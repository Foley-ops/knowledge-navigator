/**
 * Saving and exporting a comparison or a path (v2 runbook Q07).
 *
 * The property under test is round-trip: what the private store keeps is the
 * whole structure, and what the export writes still carries every id, every
 * source URL, every missing marker and every review state. A comparison that
 * lost its missing markers on the way out would read, later, as a complete one.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compileCorpus } from '../src/compile.js';
import { openDatabaseReadOnly } from '../src/db.js';
import { compareConcepts } from '../src/compare.js';
import { buildLearningPath } from '../src/learning-paths.js';
import type { PathFamiliarity } from '../src/learning-paths.js';
import {
  exportFileName,
  renderComparisonMarkdown,
  renderPathMarkdown,
  renderSavedItemMarkdown,
  savedComparisonSchema,
  savedPathSchema,
} from '../src/export.js';
import { TIER_1_HEADINGS } from '../src/headings.js';
import { conceptMarkdown } from './fixtures.js';

const AREA = 'Artificial Intelligence/Deep Learning — Architectures';
const SOURCE = {
  id: 'source.he2016.deep_residual_learning',
  title: 'Deep Residual Learning for Image Recognition',
  url: 'https://arxiv.org/abs/1512.03385',
  kind: 'preprint',
  supports: ['definition'],
  checkedOn: '2026-09-16',
};

const ALPHA = 'concept.export.alpha';
const STUB = 'concept.export.stub';
const IDENTITY = 'concept.export.identity';
const BUILT_AT = '2026-09-17T00:00:00.000Z';
const EXPORTED_AT = '2026-09-17T09:00:00.000Z';
const SITE = 'https://notes.local/kb/';

function body(name: string, omit: readonly string[] = []): string {
  return TIER_1_HEADINGS.map((heading) =>
    omit.includes(heading)
      ? `## ${heading}\n`
      : `## ${heading}\n\n${name}: ${heading.toLowerCase()} prose.\n`,
  ).join('\n');
}

let root = '';
let db: DatabaseType;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-export-'));
  const contentDir = join(root, 'content', 'concepts');
  const graphOnlyDir = join(root, 'content', 'graph-only');
  await mkdir(contentDir, { recursive: true });
  await mkdir(graphOnlyDir, { recursive: true });

  await writeFile(
    join(contentDir, 'alpha.md'),
    conceptMarkdown({
      conceptId: ALPHA,
      title: 'Alpha',
      slug: '/concepts/alpha',
      aliases: [],
      kind: 'method',
      tier: 1,
      categories: [AREA],
      relationships: [{ type: 'requires', target: STUB }],
      sources: [SOURCE],
      // One empty section, so a missing marker has to survive the round trip.
      body: body('Alpha', ['Variants and alternatives']),
    }),
    'utf8',
  );

  await writeFile(
    join(contentDir, 'stub.md'),
    conceptMarkdown({
      conceptId: STUB,
      title: 'Stub',
      slug: '/concepts/stub',
      aliases: [],
      kind: 'method',
      tier: 2,
      categories: [AREA],
      relationships: [{ type: 'requires', target: IDENTITY }],
      sources: [SOURCE],
      body: '\nA short orienting paragraph, which is all a Tier 2 stub promises.\n',
    }),
    'utf8',
  );

  await writeFile(
    join(graphOnlyDir, 'identity.yaml'),
    `concept_id: ${IDENTITY}
title: Identity
slug: /concepts/identity
aliases: []
kind: method
tier: 3
review_state: generated-draft
summary: A named identity that carries no article.
categories:
  - ${AREA}
primary_category: ${AREA}
relationships: []
sources: []
`,
    'utf8',
  );

  const result = await compileCorpus({
    contentDir,
    databasePath: join(root, 'knowledge.db'),
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    throw new Error(
      `fixture did not compile: ${result.diagnostics.map((d) => `${d.file} ${d.field}: ${d.message}`).join('; ')}`,
    );
  }
  db = openDatabaseReadOnly(join(root, 'knowledge.db'));
});

afterAll(async () => {
  db.close();
  await rm(root, { recursive: true, force: true });
});

function savedComparison() {
  return savedComparisonSchema.parse({
    conceptIds: [ALPHA, STUB],
    builtAt: BUILT_AT,
    comparison: compareConcepts(db, [ALPHA, STUB]),
  });
}

function savedPath(options: { known?: string[]; familiarity?: Map<string, PathFamiliarity> } = {}) {
  const path = buildLearningPath(db, ALPHA, {
    ...(options.known === undefined ? {} : { known: options.known }),
    ...(options.familiarity === undefined ? {} : { familiarity: options.familiarity }),
  });
  return savedPathSchema.parse({
    targetConceptId: ALPHA,
    knownConceptIds: options.known ?? [],
    builtAt: BUILT_AT,
    path,
  });
}

describe('the saved shape', () => {
  it('accepts exactly what the comparison engine produces', () => {
    const saved = savedComparison();
    // Nothing was dropped on the way in.
    expect(saved.comparison.concepts.map((concept) => concept.conceptId)).toEqual([ALPHA, STUB]);
    expect(saved.comparison.rows.length).toBeGreaterThan(0);
    expect(saved.comparison.completeness.missing).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(saved.comparison))).toEqual(
      JSON.parse(JSON.stringify(compareConcepts(db, [ALPHA, STUB]))),
    );
  });

  it('accepts exactly what the path engine produces', () => {
    const saved = savedPath();
    expect(saved.path.steps.map((step) => step.conceptId)).toEqual([IDENTITY, STUB, ALPHA]);
    expect(JSON.parse(JSON.stringify(saved.path))).toEqual(
      JSON.parse(JSON.stringify(buildLearningPath(db, ALPHA))),
    );
  });

  it('refuses a field nobody defined and a payload missing the structure', () => {
    expect(() =>
      savedComparisonSchema.parse({
        conceptIds: [ALPHA, STUB],
        builtAt: BUILT_AT,
        comparison: compareConcepts(db, [ALPHA, STUB]),
        surprise: true,
      }),
    ).toThrow();
    expect(() =>
      savedComparisonSchema.parse({ conceptIds: [ALPHA, STUB], builtAt: BUILT_AT }),
    ).toThrow();
    expect(() => savedPathSchema.parse({ targetConceptId: ALPHA, builtAt: BUILT_AT })).toThrow();
  });
});

describe('exported comparison Markdown', () => {
  it('carries every id, review state, source URL and missing marker', () => {
    const markdown = renderComparisonMarkdown(savedComparison(), {
      siteUrl: SITE,
      exportedAt: EXPORTED_AT,
    });

    expect(markdown).toContain('# Comparison: Alpha vs Stub');
    expect(markdown).toContain(EXPORTED_AT);
    expect(markdown).toContain(BUILT_AT);

    // Ids and canonical URLs.
    expect(markdown).toContain(`\`${ALPHA}\``);
    expect(markdown).toContain(`\`${STUB}\``);
    expect(markdown).toContain('https://notes.local/kb/concepts/alpha');
    expect(markdown).toContain('https://notes.local/kb/concepts/stub');

    // Review state, in words rather than as a bare token.
    expect(markdown).toContain('Generated draft — written by an AI agent');

    // Source URLs.
    expect(markdown).toContain(SOURCE.url);
    expect(markdown).toContain(`\`${SOURCE.id}\``);

    // Missing markers, each with its own reason.
    expect(markdown).toContain('MISSING — this page has the section and it is empty.');
    expect(markdown).toContain('MISSING — this page has no such section.');
    expect(markdown).toContain('cells are missing');

    // Content that is present is quoted, not summarised.
    expect(markdown).toContain('Alpha: definition prose.');
  });

  it('is byte-identical when nothing changed', () => {
    const options = { siteUrl: SITE, exportedAt: EXPORTED_AT };
    expect(renderComparisonMarkdown(savedComparison(), options)).toBe(
      renderComparisonMarkdown(savedComparison(), options),
    );
  });

  it('says a graph-only identity has no page rather than linking to one', () => {
    const saved = savedComparisonSchema.parse({
      conceptIds: [ALPHA, IDENTITY],
      builtAt: BUILT_AT,
      comparison: compareConcepts(db, [ALPHA, IDENTITY]),
    });
    const markdown = renderComparisonMarkdown(saved, { siteUrl: SITE, exportedAt: EXPORTED_AT });
    expect(markdown).toContain('| no article |');
    expect(markdown).not.toContain('https://notes.local/kb/concepts/identity');
    expect(markdown).toContain('MISSING — this is a graph-only identity');
  });

  it('keeps a synthesis, and says it is not evidence', () => {
    const saved = savedComparisonSchema.parse({
      conceptIds: [ALPHA, STUB],
      builtAt: BUILT_AT,
      comparison: compareConcepts(db, [ALPHA, STUB]),
      synthesis: { answer: 'They differ in depth.', confidence: 'low' },
    });
    const markdown = renderComparisonMarkdown(saved, { exportedAt: EXPORTED_AT });
    expect(markdown).toContain('## Generated synthesis');
    expect(markdown).toContain('They differ in depth.');
    expect(markdown).toContain('It is not evidence');
  });
});

describe('exported path Markdown', () => {
  it('carries the reading order, every edge and every canonical link', () => {
    const markdown = renderPathMarkdown(savedPath(), {
      siteUrl: SITE,
      exportedAt: EXPORTED_AT,
    });

    expect(markdown).toContain('# Path to Alpha');
    expect(markdown).toContain('3 steps, in reading order');
    expect(markdown.indexOf('## 1. Identity')).toBeLessThan(markdown.indexOf('## 2. Stub'));
    expect(markdown.indexOf('## 2. Stub')).toBeLessThan(markdown.indexOf('## 3. Alpha'));

    expect(markdown).toContain(`\`${IDENTITY}\``);
    expect(markdown).toContain('Page: none. This is a graph-only identity');
    expect(markdown).toContain('https://notes.local/kb/concepts/stub');
    expect(markdown).toContain('Comes before Stub, because');
    expect(markdown).toContain('`requires`');
    expect(markdown).toContain('This is the destination.');
    expect(markdown).toContain('Generated draft');
  });

  it('records what the researcher already knew and what their records changed', () => {
    const known = renderPathMarkdown(savedPath({ known: [STUB] }), { exportedAt: EXPORTED_AT });
    expect(known).toContain('## Starting from what you already know');
    expect(known).toContain('you said you know it');

    const familiar = renderPathMarkdown(
      savedPath({ familiarity: new Map<string, PathFamiliarity>([[STUB, 'strong']]) }),
      { exportedAt: EXPORTED_AT },
    );
    expect(familiar).toContain('## What your own records changed');
    expect(familiar).toContain('treated as a starting point');
  });

  it('says plainly when no route is recorded', () => {
    const saved = savedPathSchema.parse({
      targetConceptId: IDENTITY,
      knownConceptIds: [],
      builtAt: BUILT_AT,
      path: buildLearningPath(db, IDENTITY),
    });
    const markdown = renderPathMarkdown(saved, { exportedAt: EXPORTED_AT });
    expect(markdown).toContain('no route is recorded');
    expect(markdown).toContain('## What the graph does not say');
    expect(markdown).not.toContain('## 1.');
  });
});

describe('choosing a renderer and a file name', () => {
  it('renders by item type and refuses anything else', () => {
    expect(renderSavedItemMarkdown('comparison', savedComparison(), {})).toContain('# Comparison:');
    expect(renderSavedItemMarkdown('path', savedPath(), {})).toContain('# Path to Alpha');
    expect(() => renderSavedItemMarkdown('assistant-answer', {}, {})).toThrow(
      /only a comparison or a path/,
    );
  });

  it('builds a file name that cannot escape its directory', () => {
    const name = exportFileName('comparison', '../../etc/passwd Alpha vs Stub', 'abc123def456');
    expect(name).toBe('comparison-etc-passwd-alpha-vs-stub-abc123de.md');
    expect(name).not.toContain('/');
    expect(name).not.toContain('..');
  });
});
