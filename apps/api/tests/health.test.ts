/**
 * E01 — health and build endpoints.
 */
import { readdir } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, reviewStates, tiers } from '@navigator/core';
import {
  CONTENT_DIR,
  buildAppWithoutIndex,
  buildTestApp,
  compileAcceptanceCorpus,
} from './helpers.js';
import type { CompiledCorpus, TestApp } from './helpers.js';

let corpus: CompiledCorpus;
let healthy: TestApp;
let degraded: TestApp;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  healthy = await buildTestApp(corpus.databasePath);
  degraded = await buildAppWithoutIndex();
}, 60_000);

afterAll(async () => {
  await healthy.close();
  await degraded.close();
  await corpus.cleanup();
});

describe('GET /api/health', () => {
  it('reports ok when the index and provider are both describable', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body['status']).toBe('ok');
    expect(body['database']).toEqual({ available: true, schemaVersion: SCHEMA_VERSION });
    expect(body['assistant']).toMatchObject({ provider: 'disabled' });
    expect(typeof body['requestId']).toBe('string');
  });

  it('reports degraded with a reason when the database is missing', async () => {
    const response = await degraded.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(503);
    const body = response.json() as { status: string; database: Record<string, unknown> };
    expect(body.status).toBe('degraded');
    expect(body.database['available']).toBe(false);
    expect(body.database['reason']).toBe('missing');
    expect(String(body.database['message'])).toContain('No compiled index');
  });

  it('leaks no configuration secrets', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/health' });
    const text = response.body;
    expect(text).not.toContain('OLLAMA_BASE_URL');
    expect(text).not.toContain('host.docker.internal');
    expect(text).not.toContain('DATABASE_PATH');
    expect(text).not.toContain(corpus.databasePath);
  });
});

describe('GET /api/build', () => {
  /**
   * What /api/build reports must be what was compiled. A literal count agreed
   * with one corpus on one afternoon and said nothing about whether the
   * endpoint counts the right rows; the corpus this suite compiled is sitting
   * open, so the test asks it instead. Each derivation below is shaped
   * differently from the query in `getBuildInfo` — files on disk, the tally the
   * compiler wrote into `build_meta`, a join instead of a bare `COUNT(*)` — so
   * that agreement is corroboration rather than an echo of the same statement.
   */
  const meta = (key: string): string => {
    const row = healthy.index.db.prepare('SELECT value FROM build_meta WHERE key = ?').get(key) as
      { value: string } | undefined;
    if (row === undefined) throw new Error(`the compiled index records no build_meta.${key}`);
    return row.value;
  };

  const scalar = (sql: string, ...params: (string | number)[]): number =>
    (healthy.index.db.prepare(sql).get(...params) as { n: number }).n;

  it('reports schema version, corpus hash, counts and build time', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/build' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      schemaVersion: number;
      corpusHash: string;
      builtAt: string;
      generator: string;
      counts: Record<string, number>;
      tiers: Record<string, number>;
      reviewStates: Record<string, number>;
    };
    expect(body.schemaVersion).toBe(SCHEMA_VERSION);
    expect(body.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    // Hash-shaped is not enough: it must be *this* build's hash.
    expect(body.corpusHash).toBe(meta('corpus_hash'));
    // SOURCE_DATE_EPOCH is pinned by the test helper, so this instant is a
    // statement about reproducibility, not about the corpus's size.
    expect(body.builtAt).toBe('2023-11-14T22:13:20.000Z');
    expect(body.generator).toBe('@navigator/core');

    // Every Markdown page on disk compiled to exactly one concept row, and no
    // row was invented: the sets of file names agree, not merely their sizes.
    // `_`- and `.`-prefixed files are partials the loader ignores by design.
    const pagesOnDisk = (await readdir(CONTENT_DIR))
      .filter((name) => name.endsWith('.md') && !name.startsWith('_') && !name.startsWith('.'))
      .sort();
    const compiledPages = (
      healthy.index.db
        .prepare("SELECT file_name FROM concepts WHERE content_format = 'markdown'")
        .all() as { file_name: string }[]
    )
      .map((row) => row.file_name)
      .sort();
    expect(compiledPages).toEqual(pagesOnDisk);

    // The concept count is therefore the pages a reader can open plus the
    // graph-only identities that have no page — and it must also match the
    // tally the compiler itself wrote down while loading the corpus.
    const graphOnlyIdentities = scalar(
      "SELECT COUNT(*) AS n FROM concepts WHERE content_format = 'graph-only'",
    );
    expect(body.counts['concepts']).toBe(pagesOnDisk.length + graphOnlyIdentities);
    expect(body.counts['concepts']).toBe(Number(meta('concept_count')));

    // Relationships: the number reported is the number of distinct edges whose
    // endpoints are both real concepts. A dangling or duplicated edge makes the
    // derived number smaller than the reported one, which a bare count hides.
    const resolvedEdges = scalar(`
      SELECT COUNT(*) AS n FROM (
        SELECT DISTINCT r.source_concept_id, r.type, r.target_concept_id
        FROM relationships r
        JOIN concepts s ON s.id = r.source_concept_id
        JOIN concepts t ON t.id = r.target_concept_id
      )
    `);
    expect(body.counts['relationships']).toBe(resolvedEdges);

    // Sources: one row per distinct work the corpus actually cites. Counting
    // through the citations proves both directions at once — every citation
    // resolves to a source row, and no source row sits there uncited.
    const citedSources = scalar(`
      SELECT COUNT(DISTINCT cs.source_id) AS n
      FROM concept_sources cs
      JOIN sources s ON s.id = cs.source_id
    `);
    expect(body.counts['sources']).toBe(citedSources);

    // The tier and review-state histograms partition the corpus: every key is
    // a value the schema allows, every value is that group's own row count, and
    // together they account for every concept. `{ '1': 11 }` asserted that the
    // corpus was eleven Tier 1 pages; this asserts the histogram is honest,
    // which is what the endpoint is actually responsible for.
    const legalTiers = tiers.map((tier) => String(tier));
    let tiered = 0;
    for (const [tier, count] of Object.entries(body.tiers)) {
      expect(legalTiers).toContain(tier);
      expect(count).toBe(scalar('SELECT COUNT(*) AS n FROM concepts WHERE tier = ?', Number(tier)));
      tiered += count;
    }
    expect(tiered).toBe(body.counts['concepts']);

    let reviewed = 0;
    for (const [state, count] of Object.entries(body.reviewStates)) {
      expect(reviewStates as readonly string[]).toContain(state);
      expect(count).toBe(
        scalar('SELECT COUNT(*) AS n FROM concepts WHERE review_state = ?', state),
      );
      reviewed += count;
    }
    expect(reviewed).toBe(body.counts['concepts']);
  });

  it('returns a structured 503 when the database is missing', async () => {
    const response = await degraded.app.inject({ method: 'GET', url: '/api/build' });
    expect(response.statusCode).toBe(503);
    const body = response.json() as { error: { code: string; message: string; details: unknown } };
    expect(body.error.code).toBe('index_unavailable');
    expect(body.error.message).toContain('No compiled index');
    expect(body.error.details).toEqual({ reason: 'missing' });
  });

  it('does not expose the database path', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/build' });
    expect(response.body).not.toContain(corpus.databasePath);
  });
});
