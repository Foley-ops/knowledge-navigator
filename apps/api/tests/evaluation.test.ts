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
 * What is frozen is the shape of the expectation, not the size of the corpus.
 * This file was written when `content/` held eleven pages, and for a while it
 * said so out loud: eleven concepts, a route of exactly ten steps, one concept
 * that happened to have no prerequisites. None of those numbers was the
 * property being defended — each was a transcription of what the corpus held
 * that morning, and each broke on the next batch of pages. Every one of them is
 * now derived from the corpus this run actually compiled, so the same invariant
 * is checked at eleven pages and at two hundred and ninety-one.
 *
 * Everything asserted below is deterministic and runs with no model installed.
 * The model's contribution is measured separately, only when someone asks for
 * it with EVALUATE_WITH_MODEL=1, and when they do not ask, this file says so
 * out loud rather than quietly substituting the fixture provider — a fixture
 * standing in for a model is not an observation about the model.
 */
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PREREQUISITE_TYPES, TIER_1_HEADINGS, compileCorpus } from '@navigator/core';
import { buildApp } from '../src/app.js';
import { openIndex } from '../src/index-handle.js';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import { createProject, setFamiliarity } from '../src/personal/index.js';
import { CONTENT_DIR, REPO_ROOT, compileAcceptanceCorpus, testConfig } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

const RESNET = 'concept.deep_learning.resnet';
const VGG = 'concept.deep_learning.vgg';
const POOLING = 'concept.deep_learning.pooling';

/* Ids in the two-page corpus this file compiles for itself, below. */
const F_FOUNDATION = 'concept.fixture.foundation';
const F_CONSEQUENCE = 'concept.fixture.consequence';

/**
 * What this corpus is, frozen. Only the review state belongs here now: a page
 * leaving `generated-draft` is a human deciding it has been checked, which is
 * exactly the kind of change this file should notice. Everything else that used
 * to sit in this object was a count, and a count is read from the corpus.
 */
const CORPUS = {
  reviewState: 'generated-draft',
} as const;

let corpus: CompiledCorpus;
let app: FastifyInstance;
let personal: PersonalHandle;
let projectId = '';

/** The pages `content/` holds this run, read from disk in `beforeAll`. */
let pages: readonly CorpusPage[] = [];

/** A corpus this file builds, where "has no prerequisites" is true by design. */
let fixtureRoot = '';
let fixtureApp: FastifyInstance;

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

async function postFixture(url: string, payload: unknown) {
  const response = await fixtureApp.inject({ method: 'POST', url, payload: payload as object });
  return { status: response.statusCode, body: response.json() as any };
}

/* ------------------------------------------------ the corpus, from disk --- */

/** One page as it sits in `content/`, before any code of ours has read it. */
interface CorpusPage {
  readonly id: string;
  readonly tier: number;
  readonly format: 'markdown' | 'graph-only';
}

/** The two directories `loadCorpus` reads, and what each one contributes. */
const CORPUS_DIRECTORIES = [
  { dir: CONTENT_DIR, extension: '.md', format: 'markdown' },
  { dir: join(REPO_ROOT, 'content', 'graph-only'), extension: '.yaml', format: 'graph-only' },
] as const;

/**
 * Read the corpus straight from the files, without going through the compiler.
 *
 * This is where the number 11 went. A count the product reports is worth
 * checking against a count derived some other way; checking it against a
 * number typed into this file only ever confirmed what the corpus was on the
 * day someone typed it.
 */
async function readCorpusFromDisk(): Promise<CorpusPage[]> {
  const found: CorpusPage[] = [];
  for (const { dir, extension, format } of CORPUS_DIRECTORIES) {
    const names = (await readdir(dir)).filter((name) => name.endsWith(extension));
    for (const name of names) {
      const text = await readFile(join(dir, name), 'utf8');
      // A Markdown page keeps its identity in front matter; a graph-only
      // identity is front matter all the way down.
      const metadata =
        format === 'markdown' ? (/^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '') : text;
      const id = /^concept_id:\s*(\S+)/m.exec(metadata)?.[1];
      const tier = Number(/^tier:\s*(\d+)/m.exec(metadata)?.[1]);
      // Skipping a page we could not read would quietly understate the corpus,
      // and then every count below would agree with the wrong number.
      if (id === undefined || !Number.isInteger(tier)) {
        throw new Error(`${name} does not declare both concept_id and tier`);
      }
      found.push({ id, tier, format });
    }
  }
  return found;
}

/* --------------------------------------------- the graph, from the pages --- */

/**
 * The prerequisites a concept declares, read from its own page rather than from
 * the path builder's answer, so a route can be checked against something other
 * than itself. Exactly two relationship types order anything (§4.8): an
 * outgoing `requires` puts the other concept first, and so does an incoming
 * `prerequisite_of`.
 */
const prerequisites = new Map<string, readonly string[]>();

async function prerequisitesOf(conceptId: string): Promise<readonly string[]> {
  const cached = prerequisites.get(conceptId);
  if (cached !== undefined) return cached;
  const { status, body } = await get(`/api/concepts/${conceptId}`);
  expect(status, conceptId).toBe(200);
  const ids = (body.relationships as { type: string; direction: string; otherId: string }[])
    .filter(
      (edge) =>
        (edge.direction === 'outgoing' && edge.type === 'requires') ||
        (edge.direction === 'incoming' && edge.type === 'prerequisite_of'),
    )
    .map((edge) => edge.otherId);
  prerequisites.set(conceptId, ids);
  return ids;
}

/**
 * Every concept the corpus says must be understood before `targetId`, plus the
 * target itself. Concepts in `known` are reached but never expanded, because
 * treating a concept as known is exactly the claim that what it rests on no
 * longer has to be read.
 */
async function requiredBefore(
  targetId: string,
  known: ReadonlySet<string> = new Set(),
): Promise<Set<string>> {
  const reached = new Set([targetId]);
  let frontier = [targetId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      if (known.has(id) && id !== targetId) continue;
      for (const prerequisite of await prerequisitesOf(id)) {
        if (reached.has(prerequisite)) continue;
        reached.add(prerequisite);
        next.push(prerequisite);
      }
    }
    frontier = next;
  }
  return reached;
}

/**
 * What a route is, independently of how long it is.
 *
 * This is what "ten steps" was standing in for: the route reaches its target,
 * it visits nothing twice, every step is a concept that exists, every step but
 * the target is there because a page declared an ordering, and nothing is read
 * before something it requires. All five hold at any corpus size; the length
 * held for one morning.
 */
async function expectWellFormedRoute(path: any, targetId: string): Promise<void> {
  const ids = path.steps.map((step: { conceptId: string }) => step.conceptId) as string[];
  const corpusIds = new Set(pages.map((page) => page.id));

  expect(path.truncated).toBe(false);
  expect(ids.at(-1)).toBe(targetId);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(corpusIds.has(id), `${id} is a concept in the corpus`).toBe(true);

  path.steps.forEach((step: { position: number }, index: number) => {
    expect(step.position).toBe(index + 1);
  });

  // `edges` is one per step that something else required, which is every step
  // but the one the researcher asked for — that is why it is one shorter than
  // the route, rather than nine.
  const unexplained = path.steps
    .filter((step: { because: unknown }) => step.because === null)
    .map((step: { conceptId: string }) => step.conceptId);
  expect(unexplained).toEqual([targetId]);
  expect(path.edges).toHaveLength(path.steps.length - 1);

  for (const step of path.steps) {
    if (step.because === null) continue;
    expect(PREREQUISITE_TYPES).toContain(step.because.type);
    expect(step.because.beforeId).toBe(step.conceptId);
    // The edge that put this step here points at a step further along.
    expect(ids.indexOf(step.because.afterId)).toBeGreaterThan(ids.indexOf(step.conceptId));
  }

  // Reading order is the whole promise of a route: `learning-paths.ts` sorts by
  // what it calls "the longest prerequisite chain below a concept, which is
  // exactly the order to read them in". Nothing may be scheduled before a
  // concept it requires — at eleven pages the chain was thin enough that a
  // length of ten stood in for this; it does not stand in for it now.
  for (const [index, id] of ids.entries()) {
    for (const prerequisite of await prerequisitesOf(id)) {
      const at = ids.indexOf(prerequisite);
      // A prerequisite that is not on this route was pruned as already known.
      if (at === -1) continue;
      expect(
        at,
        `${prerequisite} (step ${String(at + 1)}) must be read before ${id} (step ${String(index + 1)})`,
      ).toBeLessThan(index);
    }
  }
}

/* ------------------------------------------------------- fixture corpus --- */

const FIXTURE_SOURCE = `sources:
  - source_id: source.fixture.reference
    title: "A Reference Both Pages Cite"
    url: https://example.org/reference
    source_kind: authoritative-secondary
    supports:
      - definition
    checked_on: 2026-09-16`;

function fixturePage(options: {
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
summary: "The ${options.title} summary, which every page records."
categories:
  - "Artificial Intelligence/Deep Learning"
primary_category: "Artificial Intelligence/Deep Learning"
${options.relationships}
${FIXTURE_SOURCE}
---

${options.body}`;
}

/**
 * A corpus of two pages in which one concept has no prerequisites — not because
 * nobody has written them yet, but because this file wrote the corpus and left
 * them out.
 *
 * "The corpus records no route to this concept" used to be tested against a
 * real page that happened to sit at the bottom of the graph in the seed corpus.
 * It no longer does, legitimately: someone wrote its prerequisites. Picking
 * whichever page is a root today would pin the same fragility to a new id, so
 * the property is built instead of found. This follows the mixed-tier corpus
 * the comparison and path suites already build for the same reason.
 */
async function compileFixtureCorpus(): Promise<{ root: string; databasePath: string }> {
  const root = await mkdtemp(join(tmpdir(), 'navigator-evaluation-'));
  const contentDir = join(root, 'content', 'concepts');
  await mkdir(contentDir, { recursive: true });

  await writeFile(
    join(contentDir, 'foundation.md'),
    fixturePage({
      conceptId: F_FOUNDATION,
      title: 'Foundation',
      slug: '/concepts/foundation',
      tier: 1,
      // No relationships at all: nothing in this corpus comes before it.
      relationships: 'relationships: []',
      body: TIER_1_HEADINGS.map(
        (heading) => `## ${heading}\n\nFoundation: ${heading.toLowerCase()} prose.\n`,
      ).join('\n'),
    }),
    'utf8',
  );

  await writeFile(
    join(contentDir, 'consequence.md'),
    fixturePage({
      conceptId: F_CONSEQUENCE,
      title: 'Consequence',
      slug: '/concepts/consequence',
      tier: 2,
      relationships: `relationships:
  - type: requires
    target: ${F_FOUNDATION}
    note: The consequence cannot be read without the foundation under it.`,
      body: 'A short orienting paragraph, which is all a Tier 2 stub promises.\n',
    }),
    'utf8',
  );

  const databasePath = join(root, 'knowledge.db');
  const result = await compileCorpus({
    contentDir,
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    await rm(root, { recursive: true, force: true, maxRetries: 10 });
    throw new Error(
      `fixture corpus did not compile: ${result.diagnostics
        .map((d) => `${d.file} ${d.field}: ${d.message}`)
        .join('; ')}`,
    );
  }
  return { root, databasePath };
}

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  pages = await readCorpusFromDisk();
  personal = openPersonal(':memory:');
  app = await buildApp({
    config: testConfig({ DATABASE_PATH: corpus.databasePath }),
    index: openIndex(corpus.databasePath),
    personal,
  });
  projectId = createProject(personal.db, { title: 'Evaluation' }).id;

  const fixture = await compileFixtureCorpus();
  fixtureRoot = fixture.root;
  fixtureApp = await buildApp({
    config: testConfig({ DATABASE_PATH: fixture.databasePath }),
    index: openIndex(fixture.databasePath),
    personal: openPersonal(':memory:'),
  });
}, 180_000);

afterAll(async () => {
  await app.close();
  if (fixtureApp !== undefined) await fixtureApp.close();
  await corpus.cleanup();
  if (fixtureRoot !== '') await rm(fixtureRoot, { recursive: true, force: true, maxRetries: 10 });
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

    // Every count here is checked against the same count arrived at some other
    // way — the files in `content/`, or another endpoint's own tally. A summary
    // that miscounts is caught at any corpus size, which pinning eleven never
    // managed.
    expect(body.concepts.total).toBe(pages.length);
    expect(body.concepts.byTier['1']).toBe(pages.filter((page) => page.tier === 1).length);
    const tallied = Object.values(body.concepts.byTier as Record<string, number>).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(tallied).toBe(body.concepts.total);
    // What exists: a page a reader can actually open, as opposed to an identity
    // the graph carries and nothing more.
    expect(body.concepts.withArticle).toBe(
      pages.filter((page) => page.format === 'markdown' && page.tier < 3).length,
    );

    const outline = await get('/api/coverage/atlas');
    expect(outline.body.areas.length).toBeGreaterThan(0);
    expect(body.atlas.areas).toBe(outline.body.areas.length);

    const candidates = await get('/api/coverage/candidates?limit=1');
    expect(body.atlas.candidates).toBe(candidates.body.total);
    expect(body.atlas.candidates).toBeGreaterThan(200);
    // Candidates outnumber concepts by a wide margin, and the product says so
    // rather than hiding it.
    expect(body.atlas.candidates).toBeGreaterThan(body.concepts.total);
    record(
      `coverage: ${String(body.concepts.total)} canonical concepts, ${String(body.atlas.candidates)} candidates, ${String(body.atlas.emptyCategories)} empty categories`,
    );
  });

  it('separates the candidates that have a page from the ones that are only a name', async () => {
    // Programming was the empty area when this workflow was written, and the
    // content build is filling it. What the researcher needs from Coverage is
    // not that the area be empty but that it never blur the two states: a
    // candidate either names a concept that exists or is still just a label,
    // and the status and the id have to agree about which.
    const { body } = await get('/api/coverage/candidates?area=atlas.programming&limit=500');
    expect(body.items.length).toBeGreaterThan(0);

    let written = 0;
    for (const candidate of body.items) {
      if (candidate.status === 'covered') {
        expect(candidate.canonicalConceptId).toEqual(expect.stringMatching(/^concept\./));
        written += 1;
      } else {
        expect(candidate.status).toBe('candidate');
        expect(candidate.canonicalConceptId).toBeNull();
      }
    }
    record(
      `programming: ${String(body.items.length)} candidates, ${String(written)} canonical, ` +
        `${String(body.items.length - written)} still only a name`,
    );
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
    expect(body.completeness.cells).toBe(body.rows.length * body.concepts.length);
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

    // The route is not a length. It is exactly the concepts the corpus says
    // must be understood before ResNet, and no others — derived here from the
    // relationships the pages themselves declare, so a step invented or dropped
    // fails this whether the route is ten steps long or a hundred.
    expect(new Set(body.steps.map((step: { conceptId: string }) => step.conceptId))).toEqual(
      await requiredBefore(RESNET),
    );
    await expectWellFormedRoute(body, RESNET);

    record(
      `path to ResNet: ${String(body.steps.length)} steps over ${String(body.edges.length)} declared edges`,
    );
  });

  it('shortens when familiarity says a step is already known, and says which record did it', async () => {
    // The route as it stands before any familiarity is recorded: no project is
    // named, so the private store is not even read.
    const unaided = await post('/api/paths', { targetId: RESNET });

    setFamiliarity(personal.db, POOLING, { level: 'strong' });
    const { body } = await post('/api/paths', { targetId: RESNET, projectId });

    // Nine was the answer at eleven pages. The property is that the route is
    // now exactly the one the corpus supports when Pooling is taken as read:
    // Pooling drops out, and so does anything only Pooling required.
    const expected = await requiredBefore(RESNET, new Set([POOLING]));
    expected.delete(POOLING);
    expect(new Set(body.steps.map((step: { conceptId: string }) => step.conceptId))).toEqual(
      expected,
    );
    expect(body.steps.map((step: { conceptId: string }) => step.conceptId)).not.toContain(POOLING);
    expect(body.steps.length).toBeLessThan(unaided.body.steps.length);
    await expectWellFormedRoute(body, RESNET);

    expect(body.familiarityEffects[0]).toMatchObject({
      conceptId: POOLING,
      level: 'strong',
      effect: 'treated-as-known',
    });
    record(
      `path with familiarity: ${String(unaided.body.steps.length)} steps become ${String(body.steps.length)}, and the record that did it is named`,
    );
  });

  it('refuses to invent a route where the corpus records none', async () => {
    // Asked against the two-page corpus this file compiled, where Foundation
    // declares no prerequisites and nothing declares itself one of Foundation's.
    const { body } = await postFixture('/api/paths', { targetId: F_FOUNDATION });
    expect(body.reachable).toBe(false);
    expect(body.steps).toHaveLength(1);
    expect(body.steps[0].conceptId).toBe(F_FOUNDATION);
    expect(body.missing[0].reason).toContain('records no route');

    // And it is a refusal, not an inability: the same corpus and the same
    // endpoint do build the route that is genuinely declared.
    const declared = await postFixture('/api/paths', { targetId: F_CONSEQUENCE });
    expect(declared.body.reachable).toBe(true);
    expect(declared.body.steps.map((step: { conceptId: string }) => step.conceptId)).toEqual([
      F_FOUNDATION,
      F_CONSEQUENCE,
    ]);

    record('path to a root concept: none recorded, and none invented');
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
