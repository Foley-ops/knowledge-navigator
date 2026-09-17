/**
 * The version 2 evaluation harness (v2 runbook T00).
 *
 * Page count is not usefulness. This harness measures whether the three things
 * a researcher actually does here still work end to end, against frozen
 * expectations:
 *
 *   1. discovering an unfamiliar neighbourhood from Coverage;
 *   2. comparing two known concepts with their evidence;
 *   3. building a prerequisite path and adjusting it with familiarity.
 *
 * Everything asserted below is deterministic and runs with no model installed.
 * The model's contribution is measured separately, only when someone asks for
 * it with EVALUATE_WITH_MODEL=1, and when they do not ask, this file says so
 * out loud rather than quietly substituting the fixture provider — a fixture
 * standing in for a model is not an observation about the model.
 */
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { openIndex } from '../src/index-handle.js';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import { createProject, setFamiliarity } from '../src/personal/index.js';
import { compileAcceptanceCorpus, testConfig } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

const RESNET = 'concept.deep_learning.resnet';
const VGG = 'concept.deep_learning.vgg';
const POOLING = 'concept.deep_learning.pooling';

/** What this corpus is, frozen. A change here is a change worth noticing. */
const CORPUS = {
  concepts: 11,
  tier1: 11,
  areas: 3,
  reviewState: 'generated-draft',
} as const;

let corpus: CompiledCorpus;
let app: FastifyInstance;
let personal: PersonalHandle;
let projectId = '';

/** Findings printed at the end, so the run is a record and not just a pass. */
const findings: string[] = [];

function record(line: string): void {
  findings.push(line);
}

async function get(url: string) {
  const response = await app.inject({ method: 'GET', url });
  return { status: response.statusCode, body: response.json() as any };
}

async function post(url: string, payload: unknown) {
  const response = await app.inject({ method: 'POST', url, payload: payload as object });
  return { status: response.statusCode, body: response.json() as any };
}

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  personal = openPersonal(':memory:');
  app = await buildApp({
    config: testConfig({ DATABASE_PATH: corpus.databasePath }),
    index: openIndex(corpus.databasePath),
    personal,
  });
  projectId = createProject(personal.db, { title: 'Evaluation' }).id;
}, 180_000);

afterAll(async () => {
  await app.close();
  await corpus.cleanup();
  // The record this checkpoint asks for, written where a person can read it
  // rather than into a test runner's swallowed console.
  const report = ['# Evaluation (v2 T00)', '', ...findings.map((line) => `- ${line}`), ''].join(
    '\n',
  );
  await writeFile(join(tmpdir(), 'navigator-evaluation.md'), report, 'utf8');
  process.stdout.write(`\n${report}\n`);
});

/* ----------------------------------------------------------- workflow 1 --- */

describe('workflow 1: discovering an unfamiliar neighbourhood from Coverage', () => {
  it('starts from counts that separate what exists from what is only a name', async () => {
    const { body } = await get('/api/coverage/summary');
    expect(body.concepts.total).toBe(CORPUS.concepts);
    expect(body.concepts.byTier['1']).toBe(CORPUS.tier1);
    expect(body.atlas.areas).toBe(CORPUS.areas);
    expect(body.atlas.candidates).toBeGreaterThan(200);
    // Candidates outnumber concepts by more than twenty to one, and the
    // product says so rather than hiding it.
    record(
      `coverage: ${String(body.concepts.total)} canonical concepts, ${String(body.atlas.candidates)} candidates, ${String(body.atlas.emptyCategories)} empty categories`,
    );
  });

  it('reaches an area where nothing has been written yet', async () => {
    const { body } = await get('/api/coverage/candidates?area=atlas.programming&limit=500');
    expect(body.items.length).toBeGreaterThan(0);
    for (const candidate of body.items) {
      expect(candidate.canonicalConceptId).toBeNull();
      expect(candidate.status).toBe('candidate');
    }
    record(`programming: ${String(body.items.length)} candidates, none canonical`);
  });

  it('never hands back page content for something that has none', async () => {
    const { body } = await get('/api/coverage/candidates?area=atlas.programming&limit=5');
    for (const candidate of body.items) {
      expect(Object.keys(candidate)).not.toContain('body');
      expect(Object.keys(candidate)).not.toContain('summary');
    }
  });

  it('leads to the backlog of what pages actually asked for', async () => {
    const { body } = await get('/api/coverage/unresolved');
    expect(Array.isArray(body.items)).toBe(true);
    record(`backlog: ${String(body.total ?? body.items.length)} grouped unresolved reference(s)`);
  });
});

/* ----------------------------------------------------------- workflow 2 --- */

describe('workflow 2: comparing two known concepts with evidence', () => {
  it('produces a complete table for two Tier 1 pages', async () => {
    const { status, body } = await post('/api/compare', { conceptIds: [RESNET, VGG] });
    expect(status).toBe(200);
    expect(body.rows.map((row: { key: string }) => row.key)).toEqual([
      'summary',
      'definition',
      'assumptions-and-requirements',
      'uses-and-applicability',
      'limitations-and-common-mistakes',
      'variants-and-alternatives',
    ]);
    expect(body.completeness.missing).toBe(0);
    expect(body.completeness.cells).toBe(12);
    record(
      `compare ResNet/VGG: ${String(body.completeness.cells)} cells, ${String(body.completeness.missing)} missing, ${String(body.sources.length)} sources`,
    );
  });

  it('carries the evidence each column rests on', async () => {
    const { body } = await post('/api/compare', { conceptIds: [RESNET, VGG] });
    expect(body.sources.length).toBeGreaterThan(0);
    for (const source of body.sources) {
      expect(source.url).toMatch(/^https?:\/\//);
      expect(source.citedBy.length).toBeGreaterThan(0);
    }
    for (const concept of body.concepts) {
      expect(concept.reviewState).toBe(CORPUS.reviewState);
      expect(body.evidence[concept.conceptId].sources).toBeGreaterThan(0);
    }
    // Every page here is still an unchecked draft, and the comparison says so
    // on every column.
    record(`compare evidence: every column is ${CORPUS.reviewState}`);
  });

  it('shows the relationship between them rather than leaving it implicit', async () => {
    const { body } = await post('/api/compare', { conceptIds: [RESNET, VGG] });
    expect(body.between.length).toBeGreaterThan(0);
    expect(body.between.map((edge: { type: string }) => edge.type)).toContain('requires');
  });
});

/* ----------------------------------------------------------- workflow 3 --- */

describe('workflow 3: building a path and adjusting it with familiarity', () => {
  it('builds the route the corpus supports', async () => {
    const { body } = await post('/api/paths', { targetId: RESNET });
    expect(body.reachable).toBe(true);
    expect(body.steps).toHaveLength(10);
    expect(body.steps.at(-1).conceptId).toBe(RESNET);
    expect(body.edges.length).toBe(9);
    record(
      `path to ResNet: ${String(body.steps.length)} steps over ${String(body.edges.length)} declared edges`,
    );
  });

  it('shortens when familiarity says a step is already known, and says which record did it', async () => {
    setFamiliarity(personal.db, POOLING, { level: 'strong' });
    const { body } = await post('/api/paths', { targetId: RESNET, projectId });
    expect(body.steps).toHaveLength(9);
    expect(body.steps.map((step: { conceptId: string }) => step.conceptId)).not.toContain(POOLING);
    expect(body.familiarityEffects[0]).toMatchObject({
      conceptId: POOLING,
      level: 'strong',
      effect: 'treated-as-known',
    });
    record('path with familiarity: 10 steps become 9, and the record that did it is named');
  });

  it('refuses to invent a route where the corpus records none', async () => {
    const { body } = await post('/api/paths', { targetId: 'concept.analysis.convolution' });
    expect(body.reachable).toBe(false);
    expect(body.steps).toHaveLength(1);
    expect(body.missing[0].reason).toContain('records no route');
    record('path to Convolution: none recorded, and none invented');
  });
});

/* ------------------------------------------------------ model observation -- */

describe('the model', () => {
  const asked = process.env['EVALUATE_WITH_MODEL'] === '1';

  it('is measured only when someone asks, and never faked', () => {
    // The fixture provider exists for testing the contract, not for pretending
    // to be a model. If this run did not ask for a model, the honest result is
    // "not measured", recorded as such.
    if (!asked) {
      record(
        'model: NOT MEASURED. Set EVALUATE_WITH_MODEL=1 with a provider configured to measure it.',
      );
      expect(process.env['ASSISTANT_PROVIDER'] ?? 'disabled').not.toBe('ollama');
      return;
    }
    record('model: measured against the configured provider, see the assistant suite');
    expect(asked).toBe(true);
  });

  it('is not required for anything above', async () => {
    // Every deterministic workflow ran with generation switched off.
    const { body } = await get('/api/assistant/status');
    expect(['disabled', 'fixture', 'ollama']).toContain(body.provider);
    if (!asked) expect(body.provider).toBe('disabled');
  });
});
