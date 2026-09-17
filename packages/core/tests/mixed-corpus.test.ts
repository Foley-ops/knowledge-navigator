/**
 * One mixed corpus (v2 runbook K06).
 *
 * Markdown pages, graph-only identities and the atlas are loaded together and
 * validated in one pass, so a collision between two formats is caught by the
 * same rule that catches a collision inside one.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCorpus } from '../src/validate.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const ARCHITECTURES = 'Artificial Intelligence/Deep Learning — Architectures';

const TIER_1 = conceptMarkdown({
  conceptId: 'concept.deep_learning.resnet',
  title: 'ResNet',
  slug: '/concepts/resnet',
  aliases: ['Residual Network'],
  kind: 'method',
  tier: 1,
  categories: [ARCHITECTURES],
  relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.vgg' }],
  body: tier1Body(),
});

const TIER_2 = conceptMarkdown({
  conceptId: 'concept.deep_learning.vgg',
  title: 'VGG',
  slug: '/concepts/vgg',
  aliases: ['VGGNet'],
  kind: 'method',
  tier: 2,
  categories: [ARCHITECTURES],
  relationships: [{ type: 'requires', target: 'concept.deep_learning.mamba' }],
  body: '\nA deep convolutional architecture built from stacks of 3x3 filters.\n',
});

const TIER_3 = `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases:
  - selective state space model
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model.
categories:
  - ${ARCHITECTURES}
primary_category: ${ARCHITECTURES}
relationships: []
sources: []
unresolved_references:
  - label: State space model
    reason: The family this belongs to has no identity yet.
    blocking: true
claims: []
`;

const ATLAS = `schema_version: 1
areas:
  - area_id: atlas.mathematics
    title: Mathematics
    categories:
      - category_id: atlas.mathematics.analysis
        title: Analysis
        parent_id: atlas.mathematics
  - area_id: atlas.artificial_intelligence
    title: Artificial Intelligence
    categories:
      - category_id: atlas.artificial_intelligence.deep_learning_architectures
        title: Deep Learning — Architectures
        parent_id: atlas.artificial_intelligence
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates:
  - candidate_id: candidate.artificial_intelligence.deep_learning_architectures.resnet
    title: ResNet
    categories:
      - atlas.artificial_intelligence.deep_learning_architectures
    status: covered
    canonical_concept_id: concept.deep_learning.resnet
  - candidate_id: candidate.programming.languages.rust
    title: Rust
    categories:
      - atlas.programming.languages
    status: candidate
    canonical_concept_id: null
`;

interface Tree {
  readonly concepts?: Record<string, string>;
  readonly graphOnly?: Record<string, string>;
  readonly atlas?: string;
}

async function withCorpus(tree: Tree, run: (contentDir: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'navigator-mixed-'));
  try {
    const contentDir = join(root, 'content', 'concepts');
    await mkdir(contentDir, { recursive: true });
    for (const [name, text] of Object.entries(tree.concepts ?? {})) {
      await writeFile(join(contentDir, name), text, 'utf8');
    }
    if (tree.graphOnly !== undefined) {
      const graphOnlyDir = join(root, 'content', 'graph-only');
      await mkdir(graphOnlyDir, { recursive: true });
      for (const [name, text] of Object.entries(tree.graphOnly)) {
        await writeFile(join(graphOnlyDir, name), text, 'utf8');
      }
    }
    if (tree.atlas !== undefined) {
      await writeFile(join(root, 'content', 'atlas.yaml'), tree.atlas, 'utf8');
    }
    await run(contentDir);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const COMPLETE: Tree = {
  concepts: { 'resnet.md': TIER_1, 'vgg.md': TIER_2 },
  graphOnly: { 'mamba.yaml': TIER_3 },
  atlas: ATLAS,
};

describe('a corpus with all three tiers and an atlas', () => {
  it('loads and validates cleanly', async () => {
    await withCorpus(COMPLETE, async (dir) => {
      const result = await loadCorpus(dir);
      expect(result.diagnostics).toEqual([]);
      expect(result.ok).toBe(true);
    });
  });

  it('returns every identity sorted by concept id, in both formats', async () => {
    await withCorpus(COMPLETE, async (dir) => {
      const result = await loadCorpus(dir);
      expect(result.concepts.map((c) => c.frontmatter.concept_id)).toEqual([
        'concept.deep_learning.mamba',
        'concept.deep_learning.resnet',
        'concept.deep_learning.vgg',
      ]);
      expect(result.concepts.map((c) => c.format)).toEqual(['graph-only', 'markdown', 'markdown']);
    });
  });

  it('keeps the atlas separate from the canonical identities', async () => {
    await withCorpus(COMPLETE, async (dir) => {
      const result = await loadCorpus(dir);
      expect(result.atlas.candidates.size).toBe(2);
      // No candidate leaked into the concept list.
      expect(result.concepts.map((c) => c.frontmatter.concept_id)).not.toContain(
        'candidate.programming.languages.rust',
      );
      expect(result.atlasHash).toMatch(/^[0-9a-f]{64}$/);
      expect(result.atlasHash).not.toBe(result.corpusHash);
    });
  });

  it('summarises coverage', async () => {
    await withCorpus(COMPLETE, async (dir) => {
      const { coverage } = await loadCorpus(dir);
      expect(coverage.areas).toBe(3);
      expect(coverage.categories).toBe(3);
      expect(coverage.candidates).toBe(2);
      expect(coverage.candidatesByStatus.covered).toBe(1);
      expect(coverage.concepts).toBe(3);
      expect(coverage.conceptsByTier).toEqual({ '1': 1, '2': 1, '3': 1 });
      expect(coverage.conceptsByFormat).toEqual({ markdown: 2, 'graph-only': 1 });
      expect(coverage.conceptsByReviewState['generated-draft']).toBe(3);
      expect(coverage.conceptsInAtlas).toBe(1);
      expect(coverage.conceptsOutsideAtlas).toBe(2);
      expect(coverage.unresolvedReferences).toBe(1);
      expect(coverage.blockingUnresolvedReferences).toBe(1);
      expect(coverage.unresolvedGroups).toBe(1);
    });
  });

  it('is deterministic across two loads', async () => {
    await withCorpus(COMPLETE, async (dir) => {
      const first = await loadCorpus(dir);
      const second = await loadCorpus(dir);
      expect(second.corpusHash).toBe(first.corpusHash);
      expect(second.atlasHash).toBe(first.atlasHash);
      expect(second.coverage).toEqual(first.coverage);
      expect(second.concepts.map((c) => c.fileName)).toEqual(first.concepts.map((c) => c.fileName));
    });
  });

  it('includes graph-only files in the corpus hash', async () => {
    let withTier3 = '';
    await withCorpus(COMPLETE, async (dir) => {
      withTier3 = (await loadCorpus(dir)).corpusHash;
    });
    await withCorpus(
      { ...COMPLETE, graphOnly: { 'mamba.yaml': TIER_3.replace('tier: 3', 'tier: 3 ') } },
      async (dir) => {
        expect((await loadCorpus(dir)).corpusHash).not.toBe(withTier3);
      },
    );
  });

  it('works with no graph-only directory and no atlas', async () => {
    await withCorpus(
      {
        concepts: {
          'resnet.md': TIER_1,
          'vgg.md': TIER_2.replace(
            '    target: concept.deep_learning.mamba',
            '    target: concept.deep_learning.resnet',
          ),
        },
      },
      async (dir) => {
        const result = await loadCorpus(dir);
        expect(result.diagnostics).toEqual([]);
        expect(result.atlas.areas.size).toBe(0);
        expect(result.coverage.areas).toBe(0);
      },
    );
  });
});

describe('cross-format collisions, all reported in one run', () => {
  it('reports duplicate ids, slugs, aliases and a broken relationship together', async () => {
    const clashing = TIER_3.replace('concept.deep_learning.mamba', 'concept.deep_learning.resnet')
      .replace('slug: /concepts/mamba', 'slug: /concepts/resnet')
      .replace('  - selective state space model', '  - Residual-Network')
      .replace(
        'relationships: []',
        'relationships:\n  - type: requires\n    target: concept.deep_learning.nowhere',
      );

    await withCorpus(
      {
        concepts: { 'resnet.md': TIER_1, 'vgg.md': TIER_2 },
        graphOnly: { 'resnet.yaml': clashing },
        atlas: ATLAS,
      },
      async (dir) => {
        const result = await loadCorpus(dir);
        expect(result.ok).toBe(false);
        const text = result.diagnostics.map((d) => `${d.file} ${d.field} ${d.message}`).join(' | ');

        expect(text).toContain('duplicate concept_id concept.deep_learning.resnet');
        expect(text).toContain('duplicate slug /concepts/resnet');
        expect(text).toContain('a name must identify exactly one concept');
        expect(text).toContain('relationship target concept.deep_learning.nowhere');
        expect(text).toContain('relationship target concept.deep_learning.mamba');

        // Both formats are named, and the whole run is sorted deterministically.
        const files = new Set(result.diagnostics.map((d) => d.file));
        expect(files.has('resnet.md')).toBe(true);
        expect(files.has('resnet.yaml')).toBe(true);
        expect(result.diagnostics).toEqual((await loadCorpus(dir)).diagnostics);
      },
    );
  });

  it('rejects a covered candidate naming a concept that does not exist', async () => {
    await withCorpus(
      {
        ...COMPLETE,
        atlas: ATLAS.replace(
          'canonical_concept_id: concept.deep_learning.resnet',
          'canonical_concept_id: concept.deep_learning.alexnet',
        ),
      },
      async (dir) => {
        const found = (await loadCorpus(dir)).diagnostics;
        expect(found.map((d) => d.message).join(' | ')).toContain(
          'which does not exist in the corpus',
        );
        expect(found[0]?.file).toBe('atlas.yaml');
      },
    );
  });

  it('rejects two candidates claiming the same concept', async () => {
    await withCorpus(
      {
        ...COMPLETE,
        atlas: `${ATLAS}  - candidate_id: candidate.mathematics.analysis.residual
    title: Residual Networks
    categories:
      - atlas.mathematics.analysis
    status: covered
    canonical_concept_id: concept.deep_learning.resnet
`,
      },
      async (dir) => {
        expect((await loadCorpus(dir)).diagnostics.map((d) => d.message).join(' | ')).toContain(
          'exactly one candidate may cover a concept',
        );
      },
    );
  });

  it('rejects a candidate whose label already names a concept but is not covered', async () => {
    await withCorpus(
      {
        ...COMPLETE,
        atlas: ATLAS.replace(
          `    title: Rust
    categories:
      - atlas.programming.languages`,
          `    title: VGGNet
    categories:
      - atlas.programming.languages`,
        ),
      },
      async (dir) => {
        expect((await loadCorpus(dir)).diagnostics.map((d) => d.message).join(' | ')).toContain(
          'mark it covered and name that concept',
        );
      },
    );
  });

  it('reports a malformed atlas without losing the concept diagnostics', async () => {
    await withCorpus(
      {
        concepts: { 'resnet.md': TIER_1 },
        atlas: 'schema_version: 9\nareas: []\ncandidates: []\n',
      },
      async (dir) => {
        const found = (await loadCorpus(dir)).diagnostics;
        const text = found.map((d) => `${d.file}:${d.message}`).join(' | ');
        expect(text).toContain('schema_version must be exactly 1');
        expect(text).toContain('relationship target concept.deep_learning.vgg');
      },
    );
  });
});
