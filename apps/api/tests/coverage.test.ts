/**
 * Coverage and evidence endpoints (v2 runbook M00).
 *
 * These run against the real acceptance corpus compiled into a temporary
 * database, so what is tested is what ships.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MAX_COVERAGE_PAGE } from '@navigator/core';
import { buildAppWithoutIndex, buildTestApp, compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus, TestApp } from './helpers.js';

let corpus: CompiledCorpus;
let app: TestApp;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  app = await buildTestApp(corpus.databasePath);
}, 180_000);

afterAll(async () => {
  await app.close();
  await corpus.cleanup();
});

async function get(url: string) {
  const response = await app.app.inject({ method: 'GET', url });
  return { status: response.statusCode, body: response.json() as any };
}

/* -------------------------------------------------------------------------- */

describe('GET /api/coverage/summary', () => {
  it('reports identities, the atlas, the backlog and evidence separately', async () => {
    const { status, body } = await get('/api/coverage/summary');
    expect(status).toBe(200);
    expect(body.concepts.total).toBe(11);
    expect(body.concepts.withArticle).toBe(11);
    expect(body.concepts.byTier['1']).toBe(11);
    expect(body.concepts.byFormat['markdown']).toBe(11);
    expect(body.atlas.areas).toBe(3);
    expect(body.atlas.candidates).toBeGreaterThan(200);
    expect(body.atlas.byStatus.covered).toBe(11);
    expect(body.backlog).toEqual({ references: 0, groups: 0, blocking: 0 });
    expect(body.evidence.claims).toBe(0);
    expect(body.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    expect(body.atlasHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('GET /api/coverage/atlas', () => {
  it('returns all three areas including one with no canonical page', async () => {
    const { status, body } = await get('/api/coverage/atlas');
    expect(status).toBe(200);
    expect(body.areas.map((a: any) => a.title)).toEqual([
      'Mathematics',
      'Artificial Intelligence',
      'Programming',
    ]);
    const programming = body.areas.find((a: any) => a.title === 'Programming');
    expect(programming.covered).toBe(0);
    expect(programming.candidates).toBeGreaterThan(0);
    expect(programming.children.length).toBeGreaterThan(0);
  });

  it('nests categories and keeps empty ones', async () => {
    const { body } = await get('/api/coverage/atlas');
    const mathematics = body.areas.find((a: any) => a.title === 'Mathematics');
    const foundations = mathematics.children.find((c: any) => c.title === 'Foundations');
    expect(foundations.children.map((c: any) => c.title)).toContain('Formal Verification');

    const empty = mathematics.children.filter(
      (c: any) => c.candidates === 0 && c.children.length === 0,
    );
    expect(empty.length).toBeGreaterThan(0);
  });

  it('counts what it returned', async () => {
    const { body } = await get('/api/coverage/atlas');
    expect(body.counts.areas).toBe(3);
    expect(body.counts.categories).toBe(38);
    expect(body.counts.candidates).toBeGreaterThan(200);
  });
});

describe('GET /api/coverage/candidates', () => {
  it('returns a capped, counted page', async () => {
    const { status, body } = await get('/api/coverage/candidates');
    expect(status).toBe(200);
    expect(body.limit).toBe(MAX_COVERAGE_PAGE);
    expect(body.offset).toBe(0);
    expect(body.total).toBeGreaterThan(200);
    expect(body.items.length).toBeLessThanOrEqual(MAX_COVERAGE_PAGE);
    expect(body.truncated).toBe(false);
  });

  it('filters by status, area and category', async () => {
    const covered = await get('/api/coverage/candidates?status=covered');
    expect(covered.body.total).toBe(11);
    expect(covered.body.items.every((c: any) => c.canonicalConceptId !== null)).toBe(true);
    expect(covered.body.items.every((c: any) => c.canonicalHasArticle === true)).toBe(true);

    const programming = await get('/api/coverage/candidates?area=atlas.programming');
    expect(programming.body.total).toBeGreaterThan(0);
    expect(
      programming.body.items.every((c: any) =>
        c.categories.some((k: any) => k.areaId === 'atlas.programming'),
      ),
    ).toBe(true);

    const analysis = await get('/api/coverage/candidates?category=atlas.mathematics.analysis');
    expect(analysis.body.total).toBeGreaterThan(0);
    expect(analysis.body.items.every((c: any) => c.categories.length >= 1)).toBe(true);
  });

  it('returns an empty page rather than an error', async () => {
    const { status, body } = await get('/api/coverage/candidates?status=deferred');
    expect(status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.items).toEqual([]);
    expect(body.truncated).toBe(false);
  });

  it('paginates without overlap and reports truncation', async () => {
    const first = await get('/api/coverage/candidates?limit=10&offset=0');
    const second = await get('/api/coverage/candidates?limit=10&offset=10');
    expect(first.body.items).toHaveLength(10);
    expect(first.body.truncated).toBe(true);
    const ids = new Set(first.body.items.map((c: any) => c.candidateId));
    expect(second.body.items.every((c: any) => !ids.has(c.candidateId))).toBe(true);

    const again = await get('/api/coverage/candidates?limit=10&offset=0');
    expect(again.body).toEqual(first.body);
  });

  it('rejects an invalid status, id, limit and offset', async () => {
    for (const query of [
      '?status=maybe',
      '?area=Not-An-Id',
      '?category=NOPE',
      '?limit=0',
      `?limit=${String(MAX_COVERAGE_PAGE + 1)}`,
      '?offset=-1',
      '?limit=abc',
      '?unknown=1',
    ]) {
      const { status, body } = await get(`/api/coverage/candidates${query}`);
      expect(status, query).toBe(400);
      expect(body.error.code).toBe('invalid_query');
      expect(Array.isArray(body.error.details.issues)).toBe(true);
    }
  });
});

describe('GET /api/coverage/unresolved', () => {
  it('returns an empty backlog for a corpus with no unresolved references', async () => {
    const { status, body } = await get('/api/coverage/unresolved');
    expect(status).toBe(200);
    expect(body).toMatchObject({ total: 0, items: [], truncated: false });
  });

  it('accepts the blocking filter in every shape', async () => {
    for (const query of ['?blocking', '?blocking=true', '?blocking=1', '?blocking=false']) {
      const { status } = await get(`/api/coverage/unresolved${query}`);
      expect(status, query).toBe(200);
    }
  });

  it('rejects an invalid blocking value and an unknown filter', async () => {
    expect((await get('/api/coverage/unresolved?blocking=perhaps')).status).toBe(400);
    expect((await get('/api/coverage/unresolved?nope=1')).status).toBe(400);
  });
});

describe('GET /api/evidence/:conceptId', () => {
  it('returns claims and sources for a real concept', async () => {
    const { status, body } = await get('/api/evidence/concept.deep_learning.resnet');
    expect(status).toBe(200);
    expect(body.conceptId).toBe('concept.deep_learning.resnet');
    expect(body.reviewState).toBe('generated-draft');
    expect(body.hasArticle).toBe(true);
    // The v1 pages predate claim metadata; the endpoint says so rather than
    // implying nothing supports them.
    expect(body.hasClaimMapping).toBe(false);
    expect(body.claims).toEqual([]);
    expect(body.sources.length).toBeGreaterThan(0);
    expect(body.sources[0].claimCount).toBe(0);
    expect(body.sources[0].supports.length).toBeGreaterThan(0);
  });

  it('returns 404 for a concept that does not exist', async () => {
    const { status, body } = await get('/api/evidence/concept.no.such');
    expect(status).toBe(404);
    expect(body.error.code).toBe('concept_not_found');
  });

  it('returns 400 for a malformed id', async () => {
    const { status, body } = await get('/api/evidence/Not-An-Id');
    expect(status).toBe(400);
    expect(body.error.code).toBe('invalid_concept_id');
  });
});

/* -------------------------------------------------------------------------- */

describe('with no compiled index', () => {
  it('every coverage route answers 503 with a reason', async () => {
    const withoutIndex = await buildAppWithoutIndex();
    try {
      for (const url of [
        '/api/coverage/summary',
        '/api/coverage/atlas',
        '/api/coverage/candidates',
        '/api/coverage/unresolved',
        '/api/evidence/concept.deep_learning.resnet',
      ]) {
        const response = await withoutIndex.app.inject({ method: 'GET', url });
        expect(response.statusCode, url).toBe(503);
        const body = response.json() as any;
        expect(body.error.code).toBe('index_unavailable');
        expect(body.error.details.reason).toBeDefined();
      }
    } finally {
      await withoutIndex.close();
    }
  });
});

describe('no coverage route can write', () => {
  it('leaves the canonical database byte-identical after every read', async () => {
    const { createHash } = await import('node:crypto');
    const { readFile } = await import('node:fs/promises');
    const before = createHash('sha256')
      .update(await readFile(corpus.databasePath))
      .digest('hex');

    for (const url of [
      '/api/coverage/summary',
      '/api/coverage/atlas',
      '/api/coverage/candidates?status=covered',
      '/api/coverage/unresolved?blocking',
      '/api/evidence/concept.deep_learning.resnet',
    ]) {
      await app.app.inject({ method: 'GET', url });
    }

    const after = createHash('sha256')
      .update(await readFile(corpus.databasePath))
      .digest('hex');
    expect(after).toBe(before);
  });

  it('refuses a write method on a coverage route', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const response = await app.app.inject({
        method,
        url: '/api/coverage/candidates',
        payload: {},
      });
      expect(response.statusCode, method).toBe(404);
    }
  });
});
