/**
 * Coverage and evidence endpoints (v2 runbook M00).
 *
 * These run against the real acceptance corpus compiled into a temporary
 * database, so what is tested is what ships.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ATLAS_ROOT_AREA_TITLES, MAX_COVERAGE_PAGE, loadCorpus } from '@navigator/core';
import type { AtlasCandidate, AtlasIndex, AtlasStatus, CorpusResult } from '@navigator/core';
import {
  CONTENT_DIR,
  buildAppWithoutIndex,
  buildTestApp,
  compileAcceptanceCorpus,
} from './helpers.js';
import type { CompiledCorpus, TestApp } from './helpers.js';

let corpus: CompiledCorpus;
let app: TestApp;
/**
 * The same corpus read straight from the files, beside the database compiled
 * from it. The corpus grows a batch of pages at a time, so no count here is
 * written as a number: each one is checked against what was actually compiled,
 * which catches a miscount at any corpus size — something a constant never did.
 */
let source: CorpusResult;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  source = await loadCorpus(CONTENT_DIR);
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

/** An article is what a Markdown page below Tier 3 has; nothing else has one. */
function conceptsWithArticle(loaded: CorpusResult): number {
  return loaded.concepts.filter((c) => c.format === 'markdown' && c.frontmatter.tier < 3).length;
}

/** The candidates the curated atlas itself marks covered. */
function coveredCandidates(atlas: AtlasIndex): AtlasCandidate[] {
  return [...atlas.candidates.values()].filter((c) => c.status === 'covered');
}

/** Distinct candidates the atlas files somewhere inside one area. */
function candidatesInArea(atlas: AtlasIndex, areaId: string, status?: AtlasStatus): number {
  let found = 0;
  for (const candidate of atlas.candidates.values()) {
    if (status !== undefined && candidate.status !== status) continue;
    if (candidate.categories.some((id) => atlas.categories.get(id)?.areaId === areaId)) found += 1;
  }
  return found;
}

/* -------------------------------------------------------------------------- */

describe('GET /api/coverage/summary', () => {
  it('reports identities, the atlas, the backlog and evidence separately', async () => {
    const { status, body } = await get('/api/coverage/summary');
    expect(status).toBe(200);

    // Not "eleven concepts": the summary must count the corpus it compiled,
    // whatever size that is. The whole tier and format tallies are compared,
    // not one bucket, so a concept counted into the wrong bucket fails here.
    expect(body.concepts.total).toBe(source.concepts.length);
    expect(body.concepts.withArticle).toBe(conceptsWithArticle(source));
    expect(body.concepts.byTier).toEqual(source.coverage.conceptsByTier);
    expect(body.concepts.byFormat).toEqual(source.coverage.conceptsByFormat);

    // Three areas is a contract rather than a count: the brief fixes them.
    expect(body.atlas.areas).toBe(ATLAS_ROOT_AREA_TITLES.length);
    expect(body.atlas.candidates).toBe(source.atlas.candidates.size);
    expect(body.atlas.byStatus).toEqual(source.coverage.candidatesByStatus);

    // The backlog and the evidence are whatever the pages record. They record
    // nothing today; the endpoint has to keep reporting the corpus on the day
    // one of them files an unresolved reference or a claim.
    expect(body.backlog).toEqual({
      references: source.coverage.unresolvedReferences,
      groups: source.coverage.unresolvedGroups,
      blocking: source.coverage.blockingUnresolvedReferences,
    });
    expect(body.evidence.claims).toBe(source.coverage.claims);

    // The hashes name *which* corpus and atlas were compiled, so they are held
    // against that corpus and not merely checked for being hex.
    expect(body.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    expect(body.corpusHash).toBe(source.corpusHash);
    expect(body.atlasHash).toMatch(/^[0-9a-f]{64}$/);
    expect(body.atlasHash).toBe(source.atlasHash);
  });
});

describe('GET /api/coverage/atlas', () => {
  it('returns all three areas, each carrying the coverage the atlas records', async () => {
    const { status, body } = await get('/api/coverage/atlas');
    expect(status).toBe(200);
    expect(body.areas.map((a: any) => a.title)).toEqual([
      'Mathematics',
      'Artificial Intelligence',
      'Programming',
    ]);

    // This used to pin "Programming: 0 covered", which was a fact about a
    // corpus with no Programming page rather than a property. The property is
    // that every area reports the covered and candidate counts the atlas
    // implies — zero for Programming today, and still right the day a
    // Programming page lands. Quantified over all three, not one.
    for (const area of body.areas as any[]) {
      expect(area.covered, area.areaId).toBe(
        candidatesInArea(source.atlas, area.areaId, 'covered'),
      );
      expect(area.candidates, area.areaId).toBe(candidatesInArea(source.atlas, area.areaId));
    }

    // An area is returned whether or not the corpus has reached it: Programming
    // has leads and neighbourhoods to show even before it has pages.
    const programming = body.areas.find((a: any) => a.title === 'Programming');
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

    // `counts` is the endpoint's own arithmetic over the tree it just sent, so
    // the invariant is that the two agree — at 38 categories or at 380. A
    // number here would have checked the atlas file, never the arithmetic.
    const nodes = (categories: any[]): number =>
      categories.reduce((n: number, c: any) => n + 1 + nodes(c.children), 0);
    expect(body.counts.areas).toBe(body.areas.length);
    expect(body.counts.categories).toBe(
      (body.areas as any[]).reduce((n: number, area: any) => n + nodes(area.children), 0),
    );

    // And that the tree it sent is the whole curated atlas, not part of it.
    expect(body.counts.categories).toBe(source.atlas.categories.size);
    expect(body.counts.candidates).toBe(source.atlas.candidates.size);
  });
});

describe('GET /api/coverage/candidates', () => {
  it('returns a capped, counted page', async () => {
    const { status, body } = await get('/api/coverage/candidates');
    expect(status).toBe(200);
    expect(body.limit).toBe(MAX_COVERAGE_PAGE);
    expect(body.offset).toBe(0);
    // The page is the whole atlas until the atlas outgrows one page. Saying
    // "more than 200, not truncated" only described an atlas of 291; the
    // arithmetic between total, page and flag is what has to hold at any size.
    expect(body.total).toBe(source.atlas.candidates.size);
    expect(body.items.length).toBe(Math.min(body.total, MAX_COVERAGE_PAGE));
    expect(body.truncated).toBe(body.total > body.items.length);
  });

  it('filters by status, area and category', async () => {
    // The atlas decides how many candidates are covered, and it gains one
    // every time a page lands — so the filter is held against the atlas, and
    // every row it returned has to be one the atlas actually marks covered.
    const coveredIds = new Set(coveredCandidates(source.atlas).map((c) => c.candidate_id));
    const covered = await get('/api/coverage/candidates?status=covered');
    expect(covered.body.total).toBe(coveredIds.size);
    expect(covered.body.items.every((c: any) => coveredIds.has(c.candidateId))).toBe(true);
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
    // Empty by construction, not by today's atlas: `status=deferred` matched
    // nothing only because nobody had deferred a candidate yet, so one
    // editorial decision would have quietly turned this test into a lie. A
    // well-formed id naming no category can never match, at any corpus size.
    const { status, body } = await get('/api/coverage/candidates?category=atlas.no.such.category');
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
  it('returns exactly the backlog the corpus records', async () => {
    const { status, body } = await get('/api/coverage/unresolved');
    const summary = await get('/api/coverage/summary');
    expect(status).toBe(200);

    // This page is empty today because no page has hit a gap yet — a fact
    // about the corpus, not a contract. The contract is that the backlog is
    // grouped one group per label, counted the same way the summary counts it,
    // and honest about truncation. That survives the first page that files an
    // unresolved reference, which an asserted `{ total: 0 }` would not.
    expect(body.total).toBe(summary.body.backlog.groups);
    expect(body.items).toHaveLength(Math.min(body.total, MAX_COVERAGE_PAGE));
    expect(body.truncated).toBe(body.total > body.items.length);
    expect(body.items.every((g: any) => g.sourceCount === g.sources.length)).toBe(true);
    if (!body.truncated) {
      const references = body.items.reduce((n: number, g: any) => n + g.sources.length, 0);
      expect(references).toBe(summary.body.backlog.references);
    }
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
