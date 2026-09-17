/**
 * Comparison and path endpoints (v2 runbook Q01, Q03, Q06).
 *
 * Two corpora are used. The real acceptance corpus exercises the ordinary
 * cases; a small mixed-tier corpus adds a Tier 2 stub, a Tier 3 graph-only
 * identity and a deliberately empty section, so "missing" is tested as a
 * first-class outcome rather than assumed never to happen.
 *
 * The property defended hardest is Q03's: a synthesis that fabricates a
 * citation is discarded, and the deterministic table survives untouched.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { TIER_1_HEADINGS, compileCorpus } from '@navigator/core';
import { buildApp } from '../src/app.js';
import { openIndex } from '../src/index-handle.js';
import { openPersonal } from '../src/personal/handle.js';
import { createProject, setFamiliarity } from '../src/personal/index.js';
import { validateModelOutput } from '../src/assistant/index.js';
import type { AssistantProvider, GenerateInput } from '../src/assistant/types.js';
import { buildAppWithoutIndex, compileAcceptanceCorpus, testConfig } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

/* Acceptance-corpus ids. */
const RESNET = 'concept.deep_learning.resnet';
const VGG = 'concept.deep_learning.vgg';
const POOLING = 'concept.deep_learning.pooling';
const CONVOLUTION = 'concept.analysis.convolution';
const LENET = 'concept.deep_learning.lenet';

/* Mixed-corpus ids. */
const M_ALPHA = 'concept.mixed.alpha';
const M_STUB = 'concept.mixed.stub';
const M_IDENTITY = 'concept.mixed.identity';

let corpus: CompiledCorpus;
let app: FastifyInstance;

let mixedRoot = '';
let mixedApp: FastifyInstance;

/** The last prompt material a provider was handed, for containment checks. */
let seenPrompt = '';

/** A provider whose reply the test chooses, validated for real on the way out. */
function scriptedProvider(reply: () => string): AssistantProvider {
  return {
    name: 'fixture',
    status: () =>
      Promise.resolve({
        provider: 'fixture' as const,
        available: true,
        model: 'scripted',
        detail: 'scripted',
      }),
    generate: (input: GenerateInput) => {
      seenPrompt = `${input.request.question}\n${input.request.context ?? ''}`;
      // The real validator runs, so a fabricated citation fails here exactly
      // as it would with a live model.
      const outcome = validateModelOutput(reply(), input.retrieval);
      return Promise.resolve(
        outcome.ok
          ? { ok: true as const, model: 'scripted', latencyMs: 1, result: outcome.result }
          : {
              ok: false as const,
              model: 'scripted',
              latencyMs: 1,
              code:
                outcome.failure.kind === 'fabricated-citation'
                  ? ('fabricated_citation' as const)
                  : ('invalid_model_output' as const),
              message: 'the model reply was rejected',
              detail: outcome.failure.detail,
            },
      );
    },
  };
}

function goodReply(citations: { kind: string; id: string; label: string }[] = []): string {
  return JSON.stringify({
    interpretation: 'A comparison of two architectures.',
    answer: 'They differ in how depth is made trainable.',
    candidateRoutes: [],
    assumptions: [],
    disqualifiers: [],
    missingInformation: [],
    nextChecks: [],
    citations,
    confidence: 'medium',
  });
}

async function buildAgainst(
  databasePath: string,
  assistant?: AssistantProvider,
): Promise<FastifyInstance> {
  return buildApp({
    config: testConfig({ DATABASE_PATH: databasePath }),
    index: openIndex(databasePath),
    personal: openPersonal(':memory:'),
    ...(assistant === undefined ? {} : { assistant }),
  });
}

/* ------------------------------------------------------- mixed corpus ---- */

const MIXED_SOURCE = `sources:
  - source_id: source.mixed.reference
    title: "A Reference Everything Cites"
    url: https://example.org/reference
    source_kind: authoritative-secondary
    supports:
      - definition
    checked_on: 2026-09-16`;

/** A Tier 1 body where every section says something identifiable. */
function mixedBody(name: string, omit: readonly string[] = []): string {
  return TIER_1_HEADINGS.map((heading) =>
    omit.includes(heading)
      ? `## ${heading}\n`
      : `## ${heading}\n\n${name}: ${heading.toLowerCase()} prose.\n`,
  ).join('\n');
}

function mixedPage(options: {
  conceptId: string;
  title: string;
  slug: string;
  tier: number;
  relationships: string;
  body: string;
}): string {
  return `---
concept_id: ${options.conceptId}
title: ${JSON.stringify(options.title)}
slug: ${options.slug}
kind: method
tier: ${String(options.tier)}
review_state: generated-draft
summary: "The ${options.title} summary, which every tier records."
categories:
  - "Artificial Intelligence/Deep Learning"
primary_category: "Artificial Intelligence/Deep Learning"
${options.relationships}
${MIXED_SOURCE}
---

${options.body}`;
}

/**
 * A corpus that spans the coverage tiers: a Tier 1 page with one empty section,
 * a Tier 2 stub with no template at all, and a Tier 3 identity with no article.
 */
async function compileMixedCorpus(): Promise<{ root: string; databasePath: string }> {
  const root = await mkdtemp(join(tmpdir(), 'navigator-api-mixed-'));
  const contentDir = join(root, 'content', 'concepts');
  const graphOnlyDir = join(root, 'content', 'graph-only');
  await mkdir(contentDir, { recursive: true });
  await mkdir(graphOnlyDir, { recursive: true });

  await writeFile(
    join(contentDir, 'alpha.md'),
    mixedPage({
      conceptId: M_ALPHA,
      title: 'Alpha',
      slug: '/concepts/alpha',
      tier: 1,
      relationships: `relationships:
  - type: requires
    target: ${M_STUB}
    note: Alpha builds directly on the stub.`,
      // One genuinely empty section, to tell "empty" apart from "no section".
      body: mixedBody('Alpha', ['Variants and alternatives']),
    }),
    'utf8',
  );

  await writeFile(
    join(contentDir, 'stub.md'),
    mixedPage({
      conceptId: M_STUB,
      title: 'Stub',
      slug: '/concepts/stub',
      tier: 2,
      relationships: `relationships:
  - type: requires
    target: ${M_IDENTITY}
    note: The stub cannot be read without the identity behind it.`,
      body: 'A short orienting paragraph, which is all a Tier 2 stub promises.\n',
    }),
    'utf8',
  );

  await writeFile(
    join(graphOnlyDir, 'identity.yaml'),
    `concept_id: ${M_IDENTITY}
title: Identity
slug: /concepts/identity
aliases: []
kind: method
tier: 3
review_state: generated-draft
summary: A named identity that carries no article.
categories:
  - "Artificial Intelligence/Deep Learning"
primary_category: "Artificial Intelligence/Deep Learning"
relationships: []
sources: []
`,
    'utf8',
  );

  const databasePath = join(root, 'knowledge.db');
  const result = await compileCorpus({
    contentDir,
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    await rm(root, { recursive: true, force: true });
    throw new Error(
      `mixed corpus did not compile: ${result.diagnostics
        .map((d) => `${d.file} ${d.field}: ${d.message}`)
        .join('; ')}`,
    );
  }
  return { root, databasePath };
}

async function post(url: string, payload: unknown) {
  const response = await app.inject({ method: 'POST', url, payload: payload as object });
  return { status: response.statusCode, body: response.json() as any };
}

async function postMixed(url: string, payload: unknown) {
  const response = await mixedApp.inject({ method: 'POST', url, payload: payload as object });
  return { status: response.statusCode, body: response.json() as any };
}

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  app = await buildAgainst(
    corpus.databasePath,
    scriptedProvider(() => goodReply()),
  );

  const mixed = await compileMixedCorpus();
  mixedRoot = mixed.root;
  mixedApp = await buildAgainst(
    mixed.databasePath,
    scriptedProvider(() => goodReply()),
  );
}, 180_000);

afterAll(async () => {
  if (app !== undefined) await app.close();
  if (mixedApp !== undefined) await mixedApp.close();
  if (corpus !== undefined) await corpus.cleanup();
  if (mixedRoot !== '') await rm(mixedRoot, { recursive: true, force: true });
});

/* --------------------------------------------------------------- Q01 ---- */

describe('POST /api/compare', () => {
  it('compares two, three and four concepts', async () => {
    for (const ids of [
      [RESNET, VGG],
      [RESNET, VGG, POOLING],
      [RESNET, VGG, POOLING, CONVOLUTION],
    ]) {
      const { status, body } = await post('/api/compare', { conceptIds: ids });
      expect(status, `${String(ids.length)} concepts`).toBe(200);
      expect(body.concepts).toHaveLength(ids.length);
      expect(body.rows.length).toBeGreaterThan(0);
      for (const row of body.rows) expect(row.cells).toHaveLength(ids.length);
    }
  });

  it('collapses duplicates and keeps the order asked for', async () => {
    const { body } = await post('/api/compare', { conceptIds: [VGG, RESNET, VGG] });
    expect(body.concepts.map((concept: { conceptId: string }) => concept.conceptId)).toEqual([
      VGG,
      RESNET,
    ]);
  });

  it('carries review states, relationships, sources and claim coverage', async () => {
    const { body } = await post('/api/compare', { conceptIds: [RESNET, VGG] });
    expect(body.concepts[0].reviewState).toBe('generated-draft');
    expect(body.concepts[0].tier).toBe(1);
    // ResNet requires VGG, so the most useful relationship is between them.
    expect(body.between.length).toBeGreaterThan(0);
    expect(body.sources.length).toBeGreaterThan(0);
    expect(body.sources[0].citedBy.length).toBeGreaterThan(0);
    expect(body.evidence[RESNET].sources).toBeGreaterThan(0);
    expect(body.evidence[RESNET].reviewState).toBe('generated-draft');
    expect(body.evidence[RESNET]).toHaveProperty('claims');
    expect(body.completeness.cells).toBe(body.rows.length * 2);
  });

  it('refuses fewer than two and more than four', async () => {
    expect((await post('/api/compare', { conceptIds: [RESNET] })).status).toBe(400);
    expect((await post('/api/compare', { conceptIds: [RESNET, RESNET] })).status).toBe(400);
    const tooMany = await post('/api/compare', {
      conceptIds: [RESNET, VGG, POOLING, CONVOLUTION, LENET],
    });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error.message).toContain('at most 4');
  });

  it('returns 404 naming every unknown concept', async () => {
    const { status, body } = await post('/api/compare', {
      conceptIds: [RESNET, 'concept.no.such', 'concept.also.missing'],
    });
    expect(status).toBe(404);
    expect(body.error.code).toBe('concept_not_found');
    expect(body.error.details.conceptIds).toEqual(['concept.no.such', 'concept.also.missing']);
  });

  it('refuses a malformed id and an unknown field', async () => {
    expect((await post('/api/compare', { conceptIds: ['Not-An-Id', RESNET] })).status).toBe(400);
    expect((await post('/api/compare', { conceptIds: [RESNET, VGG], extra: 1 })).status).toBe(400);
    expect((await post('/api/compare', {})).status).toBe(400);
  });

  it('answers 503 when the index is unavailable', async () => {
    const without = await buildAppWithoutIndex();
    try {
      const response = await without.app.inject({
        method: 'POST',
        url: '/api/compare',
        payload: { conceptIds: [RESNET, VGG] },
      });
      expect(response.statusCode).toBe(503);
      expect((response.json() as any).error.code).toBe('index_unavailable');
    } finally {
      await without.close();
    }
  });
});

describe('POST /api/compare across coverage tiers', () => {
  it('reports a Tier 3 identity as having no article rather than as blank', async () => {
    const { status, body } = await postMixed('/api/compare', {
      conceptIds: [M_ALPHA, M_IDENTITY],
    });
    expect(status).toBe(200);
    const identity = body.concepts.find(
      (concept: { conceptId: string }) => concept.conceptId === M_IDENTITY,
    );
    expect(identity.tier).toBe(3);
    expect(identity.hasArticle).toBe(false);
    // The summary is the one thing a Tier 3 identity does record.
    expect(identity.summary).toContain('carries no article');

    const definition = body.rows.find((row: { key: string }) => row.key === 'definition');
    const cell = definition.cells.find(
      (candidate: { conceptId: string }) => candidate.conceptId === M_IDENTITY,
    );
    expect(cell.value).toBeNull();
    expect(cell.missing).toBe('no-article');
  });

  it('tells an absent section apart from an empty one', async () => {
    const { body } = await postMixed('/api/compare', { conceptIds: [M_ALPHA, M_STUB] });
    const rowsByKey = Object.fromEntries(
      body.rows.map((row: { key: string; cells: unknown[] }) => [row.key, row.cells]),
    ) as Record<string, { conceptId: string; value: string | null; missing: string | null }[]>;

    const cell = (key: string, conceptId: string) =>
      rowsByKey[key]!.find((candidate) => candidate.conceptId === conceptId)!;

    // Tier 2 has no template, so the section is absent, not empty.
    expect(cell('definition', M_STUB).missing).toBe('no-section');
    // Tier 1 with a heading and nothing under it is empty, which is different.
    expect(cell('variants-and-alternatives', M_ALPHA).missing).toBe('empty');
    expect(cell('definition', M_ALPHA).value).toContain('Alpha: definition prose.');
    // Every tier records a summary, so that row is never missing.
    expect(cell('summary', M_STUB).missing).toBeNull();
    expect(body.completeness.missing).toBeGreaterThan(0);
  });
});

/* --------------------------------------------------------------- Q03 ---- */

describe('POST /api/compare/explain', () => {
  it('sends the table and nothing else from the page', async () => {
    await postMixed('/api/compare/explain', { conceptIds: [M_ALPHA, M_STUB] });
    expect(seenPrompt).toContain('COMPARISON TABLE');
    expect(seenPrompt).toContain('COMPLETENESS');
    expect(seenPrompt).toContain('Alpha: definition prose.');
    expect(seenPrompt).toContain('Do not fill it in.');
    // Sections outside the comparison contract never reach the model.
    expect(seenPrompt).not.toContain('formal treatment prose');
    expect(seenPrompt).not.toContain('history and attribution prose');
  });

  it('returns the synthesis and the table together', async () => {
    const { status, body } = await post('/api/compare/explain', { conceptIds: [RESNET, VGG] });
    expect(status).toBe(200);
    expect(body.synthesis.answer).toContain('depth');
    expect(body.error).toBeNull();
    expect(body.comparison.concepts).toHaveLength(2);
    expect(body.privateContext.items).toEqual([]);
  });

  it('lets the synthesis cite a compared concept', async () => {
    const citing = await buildAgainst(
      corpus.databasePath,
      scriptedProvider(() => goodReply([{ kind: 'concept', id: RESNET, label: 'ResNet' }])),
    );
    try {
      const response = await citing.inject({
        method: 'POST',
        url: '/api/compare/explain',
        payload: { conceptIds: [RESNET, VGG] },
      });
      const body = response.json() as any;
      expect(body.synthesis).not.toBeNull();
      expect(body.synthesis.citations[0].id).toBe(RESNET);
    } finally {
      await citing.close();
    }
  });

  it('discards a synthesis that cites what it was not given, and keeps the table', async () => {
    const fabricating = await buildAgainst(
      corpus.databasePath,
      scriptedProvider(() =>
        goodReply([{ kind: 'concept', id: 'concept.deep_learning.mamba', label: 'Mamba' }]),
      ),
    );
    try {
      const response = await fabricating.inject({
        method: 'POST',
        url: '/api/compare/explain',
        payload: { conceptIds: [RESNET, VGG] },
      });
      const body = response.json() as any;
      expect(response.statusCode).toBe(200);
      expect(body.synthesis).toBeNull();
      expect(body.error.code).toBe('fabricated_citation');
      // The deterministic table is untouched: it was true before the model ran.
      expect(body.comparison.concepts).toHaveLength(2);
      expect(body.comparison.rows.length).toBeGreaterThan(0);
      expect(body.comparison.completeness.cells).toBeGreaterThan(0);
      expect(
        body.comparison.rows.find((row: { key: string }) => row.key === 'definition').cells[0]
          .value,
      ).not.toBeNull();
    } finally {
      await fabricating.close();
    }
  });

  it('survives an unparseable reply the same way', async () => {
    const broken = await buildAgainst(
      corpus.databasePath,
      scriptedProvider(() => 'not json at all'),
    );
    try {
      const response = await broken.inject({
        method: 'POST',
        url: '/api/compare/explain',
        payload: { conceptIds: [RESNET, VGG] },
      });
      const body = response.json() as any;
      expect(body.synthesis).toBeNull();
      expect(body.error.code).toBe('invalid_model_output');
      expect(body.comparison.rows.length).toBeGreaterThan(0);
    } finally {
      await broken.close();
    }
  });

  it('refuses an unknown concept before calling the model at all', async () => {
    const { status, body } = await post('/api/compare/explain', {
      conceptIds: [RESNET, 'concept.no.such'],
    });
    expect(status).toBe(404);
    expect(body.error.code).toBe('concept_not_found');
  });
});

/* --------------------------------------------------------------- Q06 ---- */

describe('POST /api/paths', () => {
  it('builds a route with ordered steps and an explanation for each edge', async () => {
    const { status, body } = await post('/api/paths', { targetId: RESNET });
    expect(status).toBe(200);
    expect(body.reachable).toBe(true);
    expect(body.steps.length).toBeGreaterThan(1);
    expect(body.steps.at(-1).conceptId).toBe(RESNET);
    expect(body.steps.map((step: { position: number }) => step.position)).toEqual(
      body.steps.map((_: unknown, index: number) => index + 1),
    );
    const explained = body.steps.filter((step: { because: unknown }) => step.because !== null);
    expect(explained.length).toBe(body.steps.length - 1);
    for (const step of explained) {
      expect(['requires', 'prerequisite_of']).toContain(step.because.type);
      expect(step.because.declaredBy.length).toBeGreaterThan(0);
    }
    // Every edge shown is one a page actually declared.
    expect(body.edges.length).toBe(explained.length);
  });

  it('is identical across two calls', async () => {
    const first = await post('/api/paths', { targetId: RESNET });
    const second = await post('/api/paths', { targetId: RESNET });
    const strip = (body: Record<string, unknown>) => {
      const { requestId: _requestId, ...rest } = body;
      return JSON.stringify(rest);
    };
    expect(strip(second.body)).toBe(strip(first.body));
  });

  it('says so when the corpus records no route, instead of inventing one', async () => {
    const { body } = await post('/api/paths', { targetId: CONVOLUTION });
    expect(body.reachable).toBe(false);
    expect(body.steps.map((step: { conceptId: string }) => step.conceptId)).toEqual([CONVOLUTION]);
    expect(body.edges).toEqual([]);
    expect(body.missing[0].reason).toContain('records no route');
  });

  it('reports an unknown target', async () => {
    const { status, body } = await post('/api/paths', { targetId: 'concept.no.such' });
    expect(status).toBe(200);
    expect(body.reachable).toBe(false);
    expect(body.steps).toEqual([]);
    expect(body.missing[0].reason).toContain('does not exist in the corpus');
  });

  it('shortens the route when the researcher declares what they know', async () => {
    const full = await post('/api/paths', { targetId: RESNET });
    const first = full.body.steps[0].conceptId as string;
    const shortened = await post('/api/paths', { targetId: RESNET, known: [first] });
    expect(shortened.body.steps.length).toBeLessThan(full.body.steps.length);
    expect(shortened.body.steps.map((step: { conceptId: string }) => step.conceptId)).not.toContain(
      first,
    );
    expect(shortened.body.startedFrom).toEqual([
      { conceptId: first, title: full.body.steps[0].title, reason: 'declared-known' },
    ]);
  });

  it('uses familiarity only when a project is named, and reports its effect', async () => {
    const personal = openPersonal(':memory:');
    const project = createProject(personal.db, { title: 'Paths' });
    setFamiliarity(personal.db, POOLING, { level: 'strong' });

    const personalised = await buildApp({
      config: testConfig({ DATABASE_PATH: corpus.databasePath }),
      index: openIndex(corpus.databasePath),
      personal,
    });
    try {
      const ignored = await personalised.inject({
        method: 'POST',
        url: '/api/paths',
        payload: { targetId: RESNET },
      });
      const without = ignored.json() as any;
      expect(without.familiarityEffects).toEqual([]);

      const used = await personalised.inject({
        method: 'POST',
        url: '/api/paths',
        payload: { targetId: RESNET, projectId: project.id },
      });
      const body = used.json() as any;
      expect(body.familiarityAvailable).toBe(true);
      expect(body.familiarityEffects).toContainEqual(
        expect.objectContaining({
          conceptId: POOLING,
          level: 'strong',
          effect: 'treated-as-known',
        }),
      );
      expect(body.steps.map((step: { conceptId: string }) => step.conceptId)).not.toContain(
        POOLING,
      );
      expect(body.steps.length).toBeLessThan(without.steps.length);

      // Asking for it back overrides familiarity, which is the researcher's call.
      const included = await personalised.inject({
        method: 'POST',
        url: '/api/paths',
        payload: { targetId: RESNET, projectId: project.id, include: [POOLING] },
      });
      expect(
        (included.json() as any).steps.map((step: { conceptId: string }) => step.conceptId),
      ).toContain(POOLING);
    } finally {
      await personalised.close();
    }
  });

  it('routes through a graph-only identity, marked as having no article', async () => {
    const { body } = await postMixed('/api/paths', { targetId: M_ALPHA });
    const ids = body.steps.map((step: { conceptId: string }) => step.conceptId);
    expect(ids).toEqual([M_IDENTITY, M_STUB, M_ALPHA]);
    expect(body.steps[0].hasArticle).toBe(false);
    expect(body.steps[0].tier).toBe(3);
    expect(body.steps[0].summary).toContain('carries no article');
    expect(body.steps[1].hasArticle).toBe(true);
  });

  it('refuses a malformed target and an unknown field', async () => {
    expect((await post('/api/paths', { targetId: 'Not-An-Id' })).status).toBe(400);
    expect((await post('/api/paths', { targetId: RESNET, extra: 1 })).status).toBe(400);
    expect((await post('/api/paths', { targetId: RESNET, projectId: 'nope' })).status).toBe(400);
    expect((await post('/api/paths', {})).status).toBe(400);
  });

  it('answers 503 when the index is unavailable', async () => {
    const without = await buildAppWithoutIndex();
    try {
      const response = await without.app.inject({
        method: 'POST',
        url: '/api/paths',
        payload: { targetId: RESNET },
      });
      expect(response.statusCode).toBe(503);
    } finally {
      await without.close();
    }
  });
});
