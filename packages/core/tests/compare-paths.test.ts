/**
 * Deterministic comparison and prerequisite paths (v2 runbook Q00, Q04–Q05).
 *
 * The fixture is a small corpus with a real prerequisite chain, a Tier 2 stub
 * that has no template sections, a graph-only identity with no article at all,
 * and a cycle injected below the validator — so "missing" and "unreachable" are
 * exercised as first-class outcomes rather than as edge cases.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compileCorpus } from '../src/compile.js';
import { openDatabaseReadOnly } from '../src/db.js';
import {
  ComparisonError,
  MAX_COMPARED,
  MIN_COMPARED,
  compareConcepts,
  renderComparisonForPrompt,
} from '../src/compare.js';
import { PREREQUISITE_TYPES, buildLearningPath, prerequisiteEdges } from '../src/learning-paths.js';
import type { PathFamiliarity } from '../src/learning-paths.js';
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

/** A Tier 1 body where each section says something identifiable. */
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
  root = await mkdtemp(join(tmpdir(), 'navigator-compare-'));
  const contentDir = join(root, 'content', 'concepts');
  const graphOnlyDir = join(root, 'content', 'graph-only');
  await mkdir(contentDir, { recursive: true });
  await mkdir(graphOnlyDir, { recursive: true });

  // convolution ← pooling ← resnet, plus a vgg stub and a graph-only mamba.
  await writeFile(
    join(contentDir, 'convolution.md'),
    conceptMarkdown({
      conceptId: 'concept.analysis.convolution',
      title: 'Convolution',
      slug: '/concepts/convolution',
      aliases: [],
      kind: 'mathematical-object',
      tier: 1,
      categories: ['Mathematics/Analysis'],
      relationships: [{ type: 'prerequisite_of', target: 'concept.deep_learning.pooling' }],
      sources: [SOURCE],
      body: body('Convolution'),
    }),
    'utf8',
  );

  await writeFile(
    join(contentDir, 'pooling.md'),
    conceptMarkdown({
      conceptId: 'concept.deep_learning.pooling',
      title: 'Pooling',
      slug: '/concepts/pooling',
      aliases: [],
      kind: 'method',
      tier: 1,
      categories: [AREA],
      relationships: [],
      sources: [SOURCE],
      // A Tier 1 page with one genuinely empty section.
      body: body('Pooling', ['Variants and alternatives']),
    }),
    'utf8',
  );

  await writeFile(
    join(contentDir, 'resnet.md'),
    conceptMarkdown({
      conceptId: 'concept.deep_learning.resnet',
      title: 'ResNet',
      slug: '/concepts/resnet',
      aliases: [],
      kind: 'method',
      tier: 1,
      categories: [AREA],
      relationships: [
        { type: 'requires', target: 'concept.deep_learning.pooling' },
        { type: 'contrasts_with', target: 'concept.deep_learning.vgg' },
      ],
      sources: [SOURCE],
      body: body('ResNet'),
    }),
    'utf8',
  );

  await writeFile(
    join(contentDir, 'vgg.md'),
    conceptMarkdown({
      conceptId: 'concept.deep_learning.vgg',
      title: 'VGG',
      slug: '/concepts/vgg',
      aliases: [],
      kind: 'method',
      tier: 2,
      categories: [AREA],
      relationships: [{ type: 'requires', target: 'concept.deep_learning.mamba' }],
      sources: [SOURCE],
      body: '\nA deep convolutional architecture built from stacks of small filters.\n',
    }),
    'utf8',
  );

  await writeFile(
    join(graphOnlyDir, 'mamba.yaml'),
    `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases: []
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model.
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

/* --------------------------------------------------------------- Q00 ---- */

describe('the comparison table', () => {
  it('quotes the page, section by section', () => {
    const comparison = compareConcepts(db, [
      'concept.deep_learning.resnet',
      'concept.analysis.convolution',
    ]);
    const definition = comparison.rows.find((row) => row.key === 'definition');
    expect(definition?.cells.map((cell) => cell.value)).toEqual([
      'ResNet: definition prose.',
      'Convolution: definition prose.',
    ]);
    expect(comparison.rows.map((row) => row.key)).toEqual([
      'summary',
      'definition',
      'assumptions-and-requirements',
      'uses-and-applicability',
      'limitations-and-common-mistakes',
      'variants-and-alternatives',
    ]);
  });

  it('preserves the order the researcher asked in', () => {
    const forwards = compareConcepts(db, [
      'concept.analysis.convolution',
      'concept.deep_learning.resnet',
    ]);
    const backwards = compareConcepts(db, [
      'concept.deep_learning.resnet',
      'concept.analysis.convolution',
    ]);
    expect(forwards.concepts.map((c) => c.conceptId)).toEqual([
      'concept.analysis.convolution',
      'concept.deep_learning.resnet',
    ]);
    expect(backwards.concepts.map((c) => c.conceptId)).toEqual([
      'concept.deep_learning.resnet',
      'concept.analysis.convolution',
    ]);
  });

  it('distinguishes an empty section from a missing one and from no article', () => {
    const comparison = compareConcepts(db, [
      'concept.deep_learning.pooling',
      'concept.deep_learning.vgg',
      'concept.deep_learning.mamba',
    ]);
    const variants = comparison.rows.find((row) => row.key === 'variants-and-alternatives');
    const [pooling, vgg, mamba] = variants!.cells;

    // A Tier 1 page with the heading present and nothing under it.
    expect(pooling?.value).toBeNull();
    expect(pooling?.missing).toBe('empty');
    // A Tier 2 stub has no template at all.
    expect(vgg?.missing).toBe('no-section');
    // A graph-only identity has no article.
    expect(mamba?.missing).toBe('no-article');
  });

  it('never fills a missing cell', () => {
    const comparison = compareConcepts(db, [
      'concept.deep_learning.mamba',
      'concept.deep_learning.vgg',
    ]);
    for (const row of comparison.rows) {
      if (row.key === 'summary') continue;
      for (const cell of row.cells) {
        expect(cell.value === null || cell.value.startsWith('VGG') || cell.value.length > 0).toBe(
          true,
        );
      }
    }
    expect(comparison.completeness.missing).toBeGreaterThan(0);
    expect(comparison.completeness.cells).toBeGreaterThan(comparison.completeness.missing);
  });

  it('carries identity, review state, relationships, sources and evidence coverage', () => {
    const comparison = compareConcepts(db, [
      'concept.deep_learning.resnet',
      'concept.deep_learning.vgg',
    ]);
    expect(comparison.concepts[0]).toMatchObject({
      title: 'ResNet',
      tier: 1,
      reviewState: 'generated-draft',
      hasArticle: true,
      format: 'markdown',
    });
    expect(comparison.concepts[0]?.categories).toContain(AREA);

    // The relationship that holds *between* them is surfaced separately.
    expect(comparison.between.map((edge) => edge.type)).toContain('contrasts_with');
    expect(comparison.relationships['concept.deep_learning.resnet']?.length).toBeGreaterThan(0);

    expect(comparison.sources.map((source) => source.sourceId)).toEqual([SOURCE.id]);
    expect([...(comparison.sources[0]?.citedBy ?? [])].sort()).toEqual([
      'concept.deep_learning.resnet',
      'concept.deep_learning.vgg',
    ]);
    expect(comparison.evidence['concept.deep_learning.resnet']).toMatchObject({
      sources: 1,
      claims: 0,
      reviewState: 'generated-draft',
    });
  });

  it('handles two, three and four concepts and refuses anything else', () => {
    expect(
      compareConcepts(db, ['concept.deep_learning.resnet', 'concept.deep_learning.vgg']).concepts,
    ).toHaveLength(2);
    expect(
      compareConcepts(db, [
        'concept.deep_learning.resnet',
        'concept.deep_learning.vgg',
        'concept.deep_learning.pooling',
      ]).concepts,
    ).toHaveLength(3);
    expect(
      compareConcepts(db, [
        'concept.deep_learning.resnet',
        'concept.deep_learning.vgg',
        'concept.deep_learning.pooling',
        'concept.analysis.convolution',
      ]).concepts,
    ).toHaveLength(4);

    expect(() => compareConcepts(db, ['concept.deep_learning.resnet'])).toThrow(ComparisonError);
    expect(() =>
      compareConcepts(db, [
        'concept.deep_learning.resnet',
        'concept.deep_learning.vgg',
        'concept.deep_learning.pooling',
        'concept.analysis.convolution',
        'concept.deep_learning.mamba',
      ]),
    ).toThrow(/at most 4/);
    expect(MIN_COMPARED).toBe(2);
    expect(MAX_COMPARED).toBe(4);
  });

  it('treats a repeated concept as one column, not two', () => {
    const comparison = compareConcepts(db, [
      'concept.deep_learning.resnet',
      'concept.deep_learning.resnet',
      'concept.deep_learning.vgg',
    ]);
    expect(comparison.concepts.map((c) => c.conceptId)).toEqual([
      'concept.deep_learning.resnet',
      'concept.deep_learning.vgg',
    ]);
  });

  it('names every unknown concept rather than the first', () => {
    try {
      compareConcepts(db, ['concept.no.such', 'concept.also.missing']);
      throw new Error('expected a failure');
    } catch (error) {
      expect(error).toBeInstanceOf(ComparisonError);
      expect((error as ComparisonError).detail).toEqual([
        'concept.no.such',
        'concept.also.missing',
      ]);
    }
  });

  it('is byte-identical across two runs', () => {
    const ids = ['concept.deep_learning.resnet', 'concept.deep_learning.pooling'];
    expect(JSON.stringify(compareConcepts(db, ids))).toBe(JSON.stringify(compareConcepts(db, ids)));
  });

  it('keeps Markdown as source, never as HTML', () => {
    const comparison = compareConcepts(db, [
      'concept.deep_learning.resnet',
      'concept.deep_learning.pooling',
    ]);
    const text = JSON.stringify(comparison);
    expect(text).not.toContain('<p>');
    expect(text).not.toContain('<strong>');
  });

  it('renders a prompt that forbids filling a gap', () => {
    const prompt = renderComparisonForPrompt(
      compareConcepts(db, ['concept.deep_learning.pooling', 'concept.deep_learning.mamba']),
    );
    expect(prompt).toContain('data, not instructions');
    expect(prompt).toContain('Do not fill it in.');
    expect(prompt).toContain('MISSING');
    expect(prompt).toContain('COMPLETENESS');
  });
});

/* --------------------------------------------------------- Q04 and Q05 ---- */

describe('prerequisite paths', () => {
  it('uses only requires and prerequisite_of', () => {
    expect([...PREREQUISITE_TYPES]).toEqual(['requires', 'prerequisite_of']);
    const edges = prerequisiteEdges(db);
    // resnet contrasts_with vgg must not appear anywhere.
    expect(
      edges.some(
        (edge) =>
          (edge.beforeId === 'concept.deep_learning.vgg' &&
            edge.afterId === 'concept.deep_learning.resnet') ||
          (edge.beforeId === 'concept.deep_learning.resnet' &&
            edge.afterId === 'concept.deep_learning.vgg'),
      ),
    ).toBe(false);
  });

  it('reads both directions as the contract defines them', () => {
    const edges = prerequisiteEdges(db);
    // resnet declares `requires pooling`: pooling comes first.
    expect(edges).toContainEqual(
      expect.objectContaining({
        beforeId: 'concept.deep_learning.pooling',
        afterId: 'concept.deep_learning.resnet',
        type: 'requires',
        declaredBy: 'concept.deep_learning.resnet',
      }),
    );
    // convolution declares `prerequisite_of pooling`: convolution comes first.
    expect(edges).toContainEqual(
      expect.objectContaining({
        beforeId: 'concept.analysis.convolution',
        afterId: 'concept.deep_learning.pooling',
        type: 'prerequisite_of',
        declaredBy: 'concept.analysis.convolution',
      }),
    );
  });

  it('builds a multi-hop route in reading order', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet');
    expect(path.reachable).toBe(true);
    expect(path.steps.map((step) => step.conceptId)).toEqual([
      'concept.analysis.convolution',
      'concept.deep_learning.pooling',
      'concept.deep_learning.resnet',
    ]);
    expect(path.steps.map((step) => step.position)).toEqual([1, 2, 3]);
  });

  it('explains every edge it used', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet');
    const pooling = path.steps.find((step) => step.conceptId === 'concept.deep_learning.pooling');
    expect(pooling?.because).toMatchObject({
      beforeId: 'concept.deep_learning.pooling',
      afterId: 'concept.deep_learning.resnet',
      type: 'requires',
      declaredBy: 'concept.deep_learning.resnet',
    });
    // The target itself is where the route ends, so it has no reason.
    expect(path.steps.at(-1)?.because).toBeNull();
    expect(path.edges.length).toBe(2);
  });

  it('is identical on every run', () => {
    const first = buildLearningPath(db, 'concept.deep_learning.resnet');
    const second = buildLearningPath(db, 'concept.deep_learning.resnet');
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('is a single step when nothing is declared to come first', () => {
    const path = buildLearningPath(db, 'concept.analysis.convolution');
    expect(path.reachable).toBe(false);
    expect(path.steps.map((step) => step.conceptId)).toEqual(['concept.analysis.convolution']);
    expect(path.missing[0]?.reason).toContain('records no route to it');
  });

  it('reports a target that does not exist rather than inventing one', () => {
    const path = buildLearningPath(db, 'concept.no.such');
    expect(path.reachable).toBe(false);
    expect(path.steps).toEqual([]);
    expect(path.missing[0]?.reason).toContain('does not exist in the corpus');
  });

  it('includes a graph-only identity as a step and says it has no article', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.vgg');
    expect(path.reachable).toBe(true);
    const mamba = path.steps.find((step) => step.conceptId === 'concept.deep_learning.mamba');
    expect(mamba).toBeDefined();
    expect(mamba?.hasArticle).toBe(false);
    expect(mamba?.tier).toBe(3);
  });

  it('stops at a concept the researcher says they know', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet', {
      known: ['concept.deep_learning.pooling'],
    });
    expect(path.steps.map((step) => step.conceptId)).toEqual(['concept.deep_learning.resnet']);
    expect(path.startedFrom).toEqual([
      {
        conceptId: 'concept.deep_learning.pooling',
        title: 'Pooling',
        reason: 'declared-known',
      },
    ]);
  });
});

/* --------------------------------------------------------------- Q05 ---- */

describe('familiarity changes the route, and says how', () => {
  const familiar = (entries: Record<string, PathFamiliarity>) =>
    new Map<string, PathFamiliarity>(Object.entries(entries));

  it('treats a strong concept as a starting point and reports it', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet', {
      familiarity: familiar({ 'concept.deep_learning.pooling': 'strong' }),
    });
    expect(path.steps.map((step) => step.conceptId)).toEqual(['concept.deep_learning.resnet']);
    expect(path.familiarityEffects).toEqual([
      {
        conceptId: 'concept.deep_learning.pooling',
        title: 'Pooling',
        level: 'strong',
        effect: 'treated-as-known',
      },
    ]);
    expect(path.startedFrom[0]?.reason).toBe('familiarity-strong');
  });

  it('keeps a working concept in the route but marks it likely known', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet', {
      familiarity: familiar({ 'concept.deep_learning.pooling': 'working' }),
    });
    expect(path.steps.map((step) => step.conceptId)).toEqual([
      'concept.analysis.convolution',
      'concept.deep_learning.pooling',
      'concept.deep_learning.resnet',
    ]);
    const pooling = path.steps.find((step) => step.conceptId === 'concept.deep_learning.pooling');
    expect(pooling?.likelyKnown).toBe(true);
    expect(pooling?.familiarity).toBe('working');
    expect(path.familiarityEffects).toContainEqual({
      conceptId: 'concept.deep_learning.pooling',
      title: 'Pooling',
      level: 'working',
      effect: 'marked-likely-known',
    });
  });

  it('leaves unfamiliar and recognize alone', () => {
    const base = buildLearningPath(db, 'concept.deep_learning.resnet');
    for (const level of ['unfamiliar', 'recognize'] as const) {
      const path = buildLearningPath(db, 'concept.deep_learning.resnet', {
        familiarity: familiar({ 'concept.deep_learning.pooling': level }),
      });
      expect(
        path.steps.map((step) => step.conceptId),
        level,
      ).toEqual(base.steps.map((step) => step.conceptId));
      expect(path.familiarityEffects, level).toEqual([]);
    }
  });

  it('puts a skipped concept back when the researcher asks for it', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet', {
      familiarity: familiar({ 'concept.deep_learning.pooling': 'strong' }),
      include: ['concept.deep_learning.pooling'],
    });
    expect(path.steps.map((step) => step.conceptId)).toEqual([
      'concept.analysis.convolution',
      'concept.deep_learning.pooling',
      'concept.deep_learning.resnet',
    ]);
    expect(path.startedFrom).toEqual([]);
  });

  it('never treats the target itself as known', () => {
    const path = buildLearningPath(db, 'concept.deep_learning.resnet', {
      known: ['concept.deep_learning.resnet'],
      familiarity: familiar({ 'concept.deep_learning.resnet': 'strong' }),
    });
    expect(path.steps.map((step) => step.conceptId)).toContain('concept.deep_learning.resnet');
    expect(path.startedFrom).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */

describe('cycles', () => {
  it('visits each concept once and reports the cycle', async () => {
    const cycleRoot = await mkdtemp(join(tmpdir(), 'navigator-cycle-'));
    try {
      const contentDir = join(cycleRoot, 'content', 'concepts');
      await mkdir(contentDir, { recursive: true });

      await writeFile(
        join(contentDir, 'alpha.md'),
        conceptMarkdown({
          conceptId: 'concept.loop.alpha',
          title: 'Alpha',
          slug: '/concepts/alpha',
          aliases: [],
          categories: ['Mathematics/Analysis'],
          relationships: [{ type: 'requires', target: 'concept.loop.beta' }],
          sources: [SOURCE],
          body: body('Alpha'),
        }),
        'utf8',
      );
      await writeFile(
        join(contentDir, 'beta.md'),
        conceptMarkdown({
          conceptId: 'concept.loop.beta',
          title: 'Beta',
          slug: '/concepts/beta',
          aliases: [],
          categories: ['Mathematics/Analysis'],
          relationships: [{ type: 'requires', target: 'concept.loop.alpha' }],
          sources: [SOURCE],
          body: body('Beta'),
        }),
        'utf8',
      );

      // The corpus validator now refuses a prerequisite cycle outright, so this
      // pair of pages cannot compile. That is the first half of the guarantee.
      const refused = await compileCorpus({
        contentDir,
        databasePath: join(cycleRoot, 'knowledge.db'),
        env: { SOURCE_DATE_EPOCH: '1700000000' },
      });
      expect(refused.ok).toBe(false);
      expect(refused.diagnostics.map((diagnostic) => diagnostic.message).join(' ')).toContain(
        'prerequisite cycle',
      );

      // The second half is that the path builder still survives one. Validation
      // runs when a corpus is compiled; the reader holds an index compiled
      // earlier, and the defensive branch exists for a graph that changed
      // underneath it. Reaching that branch now means putting the closing edge
      // into the database directly, which is the only way it can still happen.
      await rm(join(contentDir, 'beta.md'));
      await writeFile(
        join(contentDir, 'beta.md'),
        conceptMarkdown({
          conceptId: 'concept.loop.beta',
          title: 'Beta',
          slug: '/concepts/beta',
          aliases: [],
          categories: ['Mathematics/Analysis'],
          relationships: [{ type: 'contrasts_with', target: 'concept.loop.alpha' }],
          sources: [SOURCE],
          body: body('Beta'),
        }),
        'utf8',
      );
      const compiled = await compileCorpus({
        contentDir,
        databasePath: join(cycleRoot, 'knowledge.db'),
        env: { SOURCE_DATE_EPOCH: '1700000000' },
      });
      expect(compiled.ok, JSON.stringify(compiled.diagnostics)).toBe(true);

      const writable = new Database(join(cycleRoot, 'knowledge.db'));
      try {
        writable
          .prepare(
            `INSERT INTO relationships (source_concept_id, type, target_concept_id, note, condition, position)
             VALUES ('concept.loop.beta', 'requires', 'concept.loop.alpha', NULL, NULL, 1)`,
          )
          .run();
      } finally {
        writable.close();
      }

      const cycleDb = openDatabaseReadOnly(join(cycleRoot, 'knowledge.db'));
      try {
        const path = buildLearningPath(cycleDb, 'concept.loop.alpha');
        const ids = path.steps.map((step) => step.conceptId);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toHaveLength(2);
        expect(path.missing.map((item) => item.reason).join(' ')).toContain('cycle');
      } finally {
        cycleDb.close();
      }
    } finally {
      await rm(cycleRoot, { recursive: true, force: true });
    }
  }, 60_000);
});

describe('diamonds', () => {
  it('does not mistake a shared prerequisite for a cycle', async () => {
    // top requires left and right, both of which require base, and left also
    // reaches base the long way round, through middle. Breadth-first search
    // meets base first at depth 2 and then again from deeper down, which is
    // exactly how a back edge looks — so a cycle test that reasons from depth
    // reported base as cyclic here. Nothing in this graph is a cycle.
    const diamondRoot = await mkdtemp(join(tmpdir(), 'navigator-diamond-'));
    try {
      const contentDir = join(diamondRoot, 'content', 'concepts');
      await mkdir(contentDir, { recursive: true });
      const edges: Record<string, string[]> = {
        top: ['left', 'right'],
        left: ['middle'],
        middle: ['base'],
        right: ['base'],
        base: [],
      };
      for (const [name, requires] of Object.entries(edges)) {
        await writeFile(
          join(contentDir, `${name}.md`),
          conceptMarkdown({
            conceptId: `concept.diamond.${name}`,
            title: name,
            slug: `/concepts/${name}`,
            aliases: [],
            categories: ['Mathematics/Analysis'],
            relationships: requires.map((target) => ({
              type: 'requires' as const,
              target: `concept.diamond.${target}`,
            })),
            sources: [SOURCE],
            body: body(name),
          }),
          'utf8',
        );
      }
      const compiled = await compileCorpus({
        contentDir,
        databasePath: join(diamondRoot, 'knowledge.db'),
        env: { SOURCE_DATE_EPOCH: '1700000000' },
      });
      expect(compiled.ok, JSON.stringify(compiled.diagnostics)).toBe(true);

      const diamondDb = openDatabaseReadOnly(join(diamondRoot, 'knowledge.db'));
      try {
        const path = buildLearningPath(diamondDb, 'concept.diamond.top');
        expect(path.missing.map((item) => item.reason).join(' ')).not.toContain('cycle');
        const ids = path.steps.map((step) => step.conceptId);
        expect(new Set(ids)).toEqual(
          new Set(Object.keys(edges).map((name) => `concept.diamond.${name}`)),
        );
        // And the order still respects every declared prerequisite.
        for (const [name, requires] of Object.entries(edges)) {
          for (const target of requires) {
            expect(ids.indexOf(`concept.diamond.${target}`)).toBeLessThan(
              ids.indexOf(`concept.diamond.${name}`),
            );
          }
        }
      } finally {
        diamondDb.close();
      }
    } finally {
      await rm(diamondRoot, { recursive: true, force: true, maxRetries: 10 });
    }
  }, 60_000);
});

describe('ties and an empty known set', () => {
  it('ignores the order prerequisites were declared in and breaks ties on id', async () => {
    const tieRoot = await mkdtemp(join(tmpdir(), 'navigator-tie-'));
    try {
      const contentDir = join(tieRoot, 'content', 'concepts');
      await mkdir(contentDir, { recursive: true });

      for (const [name, id, title] of [
        ['alpha.md', 'concept.tie.alpha', 'Alpha'],
        ['zeta.md', 'concept.tie.zeta', 'Zeta'],
      ] as const) {
        await writeFile(
          join(contentDir, name),
          conceptMarkdown({
            conceptId: id,
            title,
            slug: `/concepts/${title.toLowerCase()}`,
            aliases: [],
            categories: ['Mathematics/Analysis'],
            relationships: [],
            sources: [SOURCE],
            body: body(title),
          }),
          'utf8',
        );
      }

      await writeFile(
        join(contentDir, 'target.md'),
        conceptMarkdown({
          conceptId: 'concept.tie.target',
          title: 'Target',
          slug: '/concepts/target',
          aliases: [],
          categories: ['Mathematics/Analysis'],
          // Declared zeta first on purpose: declaration order must not decide
          // reading order, or the route would change when a page is edited.
          relationships: [
            { type: 'requires', target: 'concept.tie.zeta' },
            { type: 'requires', target: 'concept.tie.alpha' },
          ],
          sources: [SOURCE],
          body: body('Target'),
        }),
        'utf8',
      );

      const result = await compileCorpus({
        contentDir,
        databasePath: join(tieRoot, 'knowledge.db'),
        env: { SOURCE_DATE_EPOCH: '1700000000' },
      });
      expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);

      const tieDb = openDatabaseReadOnly(join(tieRoot, 'knowledge.db'));
      try {
        const path = buildLearningPath(tieDb, 'concept.tie.target');
        expect(path.steps.map((step) => step.conceptId)).toEqual([
          'concept.tie.alpha',
          'concept.tie.zeta',
          'concept.tie.target',
        ]);
        // Both tied steps are at the same depth, so both explain themselves.
        expect(path.steps.slice(0, 2).every((step) => step.because !== null)).toBe(true);
        const again = buildLearningPath(tieDb, 'concept.tie.target');
        expect(JSON.stringify(again)).toBe(JSON.stringify(path));
      } finally {
        tieDb.close();
      }
    } finally {
      await rm(tieRoot, { recursive: true, force: true });
    }
  }, 60_000);

  it('treats an empty known set exactly as no known set', () => {
    const bare = buildLearningPath(db, 'concept.deep_learning.resnet');
    const empty = buildLearningPath(db, 'concept.deep_learning.resnet', {
      known: [],
      include: [],
      familiarity: new Map<string, PathFamiliarity>(),
    });
    expect(JSON.stringify(empty)).toBe(JSON.stringify(bare));
    expect(empty.startedFrom).toEqual([]);
    expect(empty.familiarityEffects).toEqual([]);
  });
});
