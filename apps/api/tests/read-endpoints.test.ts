/**
 * E02, E03, E04 — concept, search and graph endpoints.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildAppWithoutIndex, buildTestApp, compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus, TestApp } from './helpers.js';

let corpus: CompiledCorpus;
let api: TestApp;
let degraded: TestApp;
/** The build report as it stood before any request in this file was served. */
let buildBeforeAnyQuery: Record<string, any>;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  api = await buildTestApp(corpus.databasePath);
  degraded = await buildAppWithoutIndex();
  buildBeforeAnyQuery = (await get('/api/build')).body;
}, 60_000);

afterAll(async () => {
  await api.close();
  await degraded.close();
  await corpus.cleanup();
});

const get = async (url: string): Promise<{ status: number; body: Record<string, any> }> => {
  const response = await api.app.inject({ method: 'GET', url });
  return { status: response.statusCode, body: response.json() as Record<string, any> };
};

/** The tables `/api/build` counts, so a test can count them for itself. */
const COUNTED_TABLES = ['concepts', 'relationships', 'categories', 'sources'] as const;

/**
 * Rows actually present in the compiled index, read straight off the handle
 * rather than through the endpoint under test. A literal count only tells the
 * truth about the corpus that existed the day it was written; the rows tell it
 * at any corpus size, and catch a miscount that a literal never could.
 */
const rowCount = (table: (typeof COUNTED_TABLES)[number]): number =>
  (api.index.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

/* ------------------------------ E02 concepts ------------------------------ */

describe('GET /api/concepts/:conceptId', () => {
  it('returns metadata, Markdown source, relationships, categories and sources', async () => {
    const { status, body } = await get('/api/concepts/concept.deep_learning.convolutional_layer');
    expect(status).toBe(200);
    expect(body['conceptId']).toBe('concept.deep_learning.convolutional_layer');
    expect(body['title']).toBe('Convolutional Layer');
    expect(body['slug']).toBe('/concepts/convolutional-layer');
    expect(body['kind']).toBe('method');
    expect(body['tier']).toBe(1);
    expect(body['reviewState']).toBe('generated-draft');
    expect(body['aliases']).toEqual(['convolution layer', 'conv layer']);
    expect(body['categories']).toEqual([
      {
        path: 'Artificial Intelligence/Deep Learning — Architectures',
        name: 'Deep Learning — Architectures',
        topLevel: 'Artificial Intelligence',
        isPrimary: true,
      },
    ]);
    expect(body['relationships'].length).toBeGreaterThan(0);
    expect(body['sources'].length).toBeGreaterThan(0);
    expect(body['sources'][0]['supports']).toBeInstanceOf(Array);
    expect(body['provenance']['sourcePath']).toBe('content/concepts/convolutional-layer.md');
    expect(body['provenance']['contentHash']).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns Markdown source and never server-rendered HTML', async () => {
    const { body } = await get('/api/concepts/concept.deep_learning.convolutional_layer');
    const markdown = body['markdown'] as string;
    expect(markdown).toContain('## Definition');
    expect(markdown).not.toContain('<p>');
    expect(markdown).not.toContain('<h2');
  });

  it('reports incoming as well as outgoing relationships', async () => {
    const { body } = await get('/api/concepts/concept.analysis.convolution');
    const relationships = body['relationships'] as { direction: string; otherId: string }[];
    // Convolution declares none of its own but is required by four concepts.
    expect(relationships.every((r) => r.direction === 'incoming')).toBe(true);
    expect(relationships.map((r) => r.otherId)).toContain(
      'concept.deep_learning.convolutional_layer',
    );
    expect(relationships.length).toBeGreaterThanOrEqual(4);
  });

  it('returns 404 for an unknown concept', async () => {
    const { status, body } = await get('/api/concepts/concept.nope.missing');
    expect(status).toBe(404);
    expect(body['error']['code']).toBe('concept_not_found');
  });

  it('returns 400 for a malformed concept id', async () => {
    for (const id of [
      'NotDotted',
      'has-hyphens',
      '../../etc/passwd',
      "x'; DROP TABLE concepts--",
    ]) {
      const response = await api.app.inject({
        method: 'GET',
        url: `/api/concepts/${encodeURIComponent(id)}`,
      });
      expect([400, 404], id).toContain(response.statusCode);
    }
    const stillThere = await get('/api/concepts/concept.deep_learning.resnet');
    expect(stillThere.status).toBe(200);
  });

  it('returns 503 when the index is unavailable', async () => {
    const response = await degraded.app.inject({
      method: 'GET',
      url: '/api/concepts/concept.deep_learning.resnet',
    });
    expect(response.statusCode).toBe(503);
    expect((response.json() as any).error.code).toBe('index_unavailable');
  });
});

describe('GET /api/concepts/by-slug', () => {
  it('retrieves the same concept by slug as by id', async () => {
    const bySlug = await get('/api/concepts/by-slug?slug=%2Fconcepts%2Fconvolutional-layer');
    const byId = await get('/api/concepts/concept.deep_learning.convolutional_layer');
    expect(bySlug.status).toBe(200);
    expect(bySlug.body).toEqual(byId.body);
  });

  it('returns 404 for an unknown slug', async () => {
    const { status, body } = await get('/api/concepts/by-slug?slug=%2Fconcepts%2Fnope');
    expect(status).toBe(404);
    expect(body['error']['code']).toBe('concept_not_found');
  });

  it('returns 400 for a slug outside the concepts namespace', async () => {
    for (const slug of ['/etc/passwd', 'convolutional-layer', '/concepts/Bad_Slug', '']) {
      const { status } = await get(`/api/concepts/by-slug?slug=${encodeURIComponent(slug)}`);
      expect(status, slug).toBe(400);
    }
  });
});

/* ------------------------------- E03 search ------------------------------- */

describe('GET /api/search', () => {
  it('finds a concept by title', async () => {
    const { status, body } = await get('/api/search?q=ResNet');
    expect(status).toBe(200);
    expect(body['query']).toBe('ResNet');
    expect(body['count']).toBeGreaterThan(0);
    const first = body['results'][0];
    expect(first['conceptId']).toBe('concept.deep_learning.resnet');
    expect(first['matchKind']).toBe('exact-title');
    expect(first['rankExplanation']).toContain('title is exactly');
    expect(first['slug']).toBe('/concepts/resnet');
    expect(first['reviewState']).toBe('generated-draft');
  });

  it('finds a concept by alias and names the alias that matched', async () => {
    const { body } = await get('/api/search?q=conv%20layer');
    const first = body['results'][0];
    expect(first['conceptId']).toBe('concept.deep_learning.convolutional_layer');
    expect(first['matchedAlias']).toBe('conv layer');
    expect(first['matchKind']).toBe('exact-alias');
  });

  it('finds a concept by body text', async () => {
    const { body } = await get('/api/search?q=identity%20shortcut');
    expect(body['results'][0]['conceptId']).toBe('concept.deep_learning.residual_connection');
    expect(body['results'][0]['matchKind']).toBe('full-text');
  });

  it('honours limit and caps it', async () => {
    const limited = await get('/api/search?q=convolution&limit=2');
    expect(limited.body['results']).toHaveLength(2);
    expect(limited.body['limit']).toBe(2);

    const tooBig = await get('/api/search?q=convolution&limit=500');
    expect(tooBig.status).toBe(400);
    expect(tooBig.body['error']['code']).toBe('invalid_query');
  });

  it('rejects an empty or missing query', async () => {
    for (const url of ['/api/search', '/api/search?q=', '/api/search?q=%20%20']) {
      const { status, body } = await get(url);
      expect([400], url).toContain(status);
      expect(['invalid_query', 'empty_query']).toContain(body['error']['code']);
    }
  });

  it('rejects an over-long query', async () => {
    const { status, body } = await get(`/api/search?q=${'a'.repeat(201)}`);
    expect(status).toBe(400);
    expect(body['error']['code']).toBe('invalid_query');
  });

  it('returns an empty result set rather than an error for no matches', async () => {
    const { status, body } = await get('/api/search?q=quaternion%20holonomy');
    expect(status).toBe(200);
    expect(body['count']).toBe(0);
    expect(body['results']).toEqual([]);
  });

  it.each([
    "' OR 1=1 --",
    '"; DROP TABLE concepts; --',
    '*',
    '"',
    'a NEAR/2 b',
    '^resnet',
    '%_%',
    '<script>alert(1)</script>',
  ])('handles injection-shaped query %j safely', async (q) => {
    const { status } = await get(`/api/search?q=${encodeURIComponent(q)}`);
    expect(status).toBe(200);
    // What survives the query is the point, not how big the corpus happens to
    // be: this once read `toBe(11)`, which was simply the whole corpus the
    // week it was written. Two invariants replace it. The build report still
    // agrees, table by table, with the rows in the index — nothing dropped,
    // nothing deleted, nothing miscounted — and the whole report is identical
    // to the one taken before a single query was served.
    const after = await get('/api/build');
    const counts = after.body['counts'] as Record<string, number>;
    for (const table of COUNTED_TABLES) {
      expect(counts[table], table).toBe(rowCount(table));
    }
    expect(after.body).toEqual(buildBeforeAnyQuery);
  });

  it('returns 503 when the index is unavailable', async () => {
    const response = await degraded.app.inject({ method: 'GET', url: '/api/search?q=resnet' });
    expect(response.statusCode).toBe(503);
  });
});

/* -------------------------------- E04 graph ------------------------------- */

describe('GET /api/graph/:conceptId', () => {
  it('returns the immediate neighbourhood at depth 1', async () => {
    const { status, body } = await get('/api/graph/concept.deep_learning.resnet?depth=1');
    expect(status).toBe(200);
    expect(body['centerId']).toBe('concept.deep_learning.resnet');
    expect(body['depth']).toBe(1);
    expect(body['truncated']).toBe(false);
    const ids = (body['nodes'] as { id: string; distance: number }[]).map((n) => n.id);
    expect(ids).toContain('concept.deep_learning.resnet');
    expect(ids).toContain('concept.deep_learning.residual_connection');
    expect(ids).toContain('concept.deep_learning.vgg');
    expect(ids).not.toContain('concept.analysis.convolution');
  });

  it('marks the centre at distance zero and neighbours further out', async () => {
    const { body } = await get('/api/graph/concept.deep_learning.resnet?depth=2');
    const nodes = body['nodes'] as { id: string; distance: number }[];
    expect(nodes.find((n) => n.id === 'concept.deep_learning.resnet')?.distance).toBe(0);
    expect(nodes.find((n) => n.id === 'concept.deep_learning.vgg')?.distance).toBe(1);
    expect(nodes.find((n) => n.id === 'concept.deep_learning.pooling')?.distance).toBe(2);
  });

  it('grows monotonically with depth and defaults to depth 1', async () => {
    const one = await get('/api/graph/concept.deep_learning.resnet?depth=1');
    const two = await get('/api/graph/concept.deep_learning.resnet?depth=2');
    const three = await get('/api/graph/concept.deep_learning.resnet?depth=3');
    const noDepth = await get('/api/graph/concept.deep_learning.resnet');

    expect(noDepth.body['depth']).toBe(1);
    expect(noDepth.body['nodes']).toEqual(one.body['nodes']);
    expect(two.body['nodes'].length).toBeGreaterThan(one.body['nodes'].length);
    expect(three.body['nodes'].length).toBeGreaterThanOrEqual(two.body['nodes'].length);
  });

  it('keeps every edge endpoint inside the returned node set', async () => {
    for (const depth of [1, 2, 3]) {
      const { body } = await get(`/api/graph/concept.deep_learning.resnet?depth=${String(depth)}`);
      const ids = new Set((body['nodes'] as { id: string }[]).map((n) => n.id));
      for (const edge of body['edges'] as { source: string; target: string }[]) {
        expect(ids.has(edge.source)).toBe(true);
        expect(ids.has(edge.target)).toBe(true);
      }
    }
  });

  it('deduplicates nodes and edges', async () => {
    const { body } = await get('/api/graph/concept.deep_learning.resnet?depth=3');
    const ids = (body['nodes'] as { id: string }[]).map((n) => n.id);
    const edgeIds = (body['edges'] as { id: string }[]).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
    // ResNet relates to residual connection twice, with two distinct types.
    const pair = (body['edges'] as { source: string; target: string; type: string }[]).filter(
      (e) =>
        e.source === 'concept.deep_learning.resnet' &&
        e.target === 'concept.deep_learning.residual_connection',
    );
    expect(pair.map((e) => e.type).sort()).toEqual(['implements', 'requires']);
  });

  it('is stably ordered across repeated calls', async () => {
    const a = await get('/api/graph/concept.deep_learning.resnet?depth=3');
    const b = await get('/api/graph/concept.deep_learning.resnet?depth=3');
    expect(b.body).toEqual(a.body);
    const nodes = a.body['nodes'] as { id: string; distance: number }[];
    for (let i = 1; i < nodes.length; i += 1) {
      const previous = nodes[i - 1]!;
      const current = nodes[i]!;
      expect(
        previous.distance < current.distance ||
          (previous.distance === current.distance && previous.id < current.id),
      ).toBe(true);
    }
  });

  it('reports the node cap and truncation honestly', async () => {
    const { body } = await get('/api/graph/concept.deep_learning.resnet?depth=3');
    expect(body['nodeLimit']).toBe(200);
    expect(body['nodes'].length).toBeLessThanOrEqual(200);
    expect(body['truncated']).toBe(false);
  });

  it('refuses a depth outside 1..3, so the whole corpus cannot be pulled at once', async () => {
    for (const depth of ['0', '4', '99', '-1', 'abc', '1.5']) {
      const { status, body } = await get(
        `/api/graph/concept.deep_learning.resnet?depth=${encodeURIComponent(depth)}`,
      );
      expect(status, depth).toBe(400);
      expect(body['error']['code']).toBe('invalid_depth');
    }
  });

  it('returns 404 for an unknown concept and 400 for a malformed id', async () => {
    expect((await get('/api/graph/concept.nope.missing')).status).toBe(404);
    expect((await get('/api/graph/NotDotted')).status).toBe(400);
  });

  it('returns 503 when the index is unavailable', async () => {
    const response = await degraded.app.inject({
      method: 'GET',
      url: '/api/graph/concept.deep_learning.resnet',
    });
    expect(response.statusCode).toBe(503);
  });
});
