/**
 * Atomic, deterministic compilation with the v2 model (runbook L07).
 *
 * V1's strongest data guarantee is that a failed build changes nothing. That
 * has to keep holding now that a build also reads the atlas, graph-only
 * identities, the backlog, claims and evidence — any one of which can be
 * broken by an edit.
 */
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const ARCHITECTURES = 'Artificial Intelligence/Deep Learning — Architectures';
const SOURCE = {
  id: 'source.he2016.deep_residual_learning',
  title: 'Deep Residual Learning for Image Recognition',
  url: 'https://arxiv.org/abs/1512.03385',
  kind: 'preprint',
  supports: ['definition'],
  checkedOn: '2026-09-16',
};

const RESNET = conceptMarkdown({
  conceptId: 'concept.deep_learning.resnet',
  title: 'ResNet',
  slug: '/concepts/resnet',
  aliases: ['Residual Network'],
  kind: 'method',
  tier: 1,
  categories: [ARCHITECTURES],
  relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.mamba' }],
  sources: [SOURCE],
  body: tier1Body(),
}).replace(
  '---\n\n',
  `unresolved_references:
  - label: Strided convolution
    reason: Needed to explain the alternative to pooling.
    proposed_categories:
      - ${ARCHITECTURES}
claims:
  - claim_id: claim.resnet.identity
    section: definition
    statement: A residual block adds its input to the output of its stacked layers.
    status: supported
    evidence:
      - source_id: ${SOURCE.id}
        locator: Section 3.1
---

`,
);

const MAMBA = `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases: []
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model.
categories:
  - ${ARCHITECTURES}
primary_category: ${ARCHITECTURES}
relationships: []
sources: []
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
  - candidate_id: candidate.artificial_intelligence.deep_learning_architectures.mamba
    title: Mamba
    categories:
      - atlas.artificial_intelligence.deep_learning_architectures
    status: covered
    canonical_concept_id: concept.deep_learning.mamba
`;

let root = '';
let contentDir = '';
let graphOnlyDir = '';

async function sha(path: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}

interface Outputs {
  readonly db: string;
  readonly graph: string;
  readonly sidebars: string;
}

function paths() {
  return {
    databasePath: join(root, 'knowledge.db'),
    graphJsonPath: join(root, 'graph.json'),
    sidebarsPath: join(root, 'sidebars.generated.ts'),
  };
}

async function compile() {
  return compileCorpus({
    contentDir,
    ...paths(),
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
}

async function snapshot(): Promise<Outputs> {
  const p = paths();
  return {
    db: await sha(p.databasePath),
    graph: await sha(p.graphJsonPath),
    sidebars: await sha(p.sidebarsPath),
  };
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-atomic-v2-'));
  contentDir = join(root, 'content', 'concepts');
  graphOnlyDir = join(root, 'content', 'graph-only');
  await mkdir(contentDir, { recursive: true });
  await mkdir(graphOnlyDir, { recursive: true });
  await writeFile(join(contentDir, 'resnet.md'), RESNET, 'utf8');
  await writeFile(join(graphOnlyDir, 'mamba.yaml'), MAMBA, 'utf8');
  await writeFile(join(root, 'content', 'atlas.yaml'), ATLAS, 'utf8');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('determinism with the v2 model', () => {
  it('produces byte-identical outputs from two builds of identical input', async () => {
    const first = await compile();
    expect(first.ok, JSON.stringify(first.diagnostics)).toBe(true);
    const before = await snapshot();

    const second = await compile();
    expect(second.ok).toBe(true);
    expect(await snapshot()).toEqual(before);
    expect(second.corpusHash).toBe(first.corpusHash);
    expect(second.atlasHash).toBe(first.atlasHash);
  }, 60_000);

  it('changes the atlas hash but not the corpus hash when only the atlas is edited', async () => {
    const first = await compile();
    expect(first.ok).toBe(true);

    await writeFile(
      join(root, 'content', 'atlas.yaml'),
      `${ATLAS}  - candidate_id: candidate.programming.languages.rust
    title: Rust
    categories:
      - atlas.programming.languages
    status: candidate
    canonical_concept_id: null
`,
      'utf8',
    );
    const second = await compile();
    expect(second.ok, JSON.stringify(second.diagnostics)).toBe(true);
    expect(second.corpusHash).toBe(first.corpusHash);
    expect(second.atlasHash).not.toBe(first.atlasHash);
  }, 60_000);
});

/* -------------------------------------------------------------------------- */

/** Each case breaks exactly one v2 feature and nothing else. */
const BROKEN: { name: string; expect: string; break: () => Promise<void> }[] = [
  {
    name: 'the atlas covers a concept that does not exist',
    expect: 'does not exist in the corpus',
    break: async () => {
      await writeFile(
        join(root, 'content', 'atlas.yaml'),
        ATLAS.replace(
          'canonical_concept_id: concept.deep_learning.mamba',
          'canonical_concept_id: concept.deep_learning.alexnet',
        ),
        'utf8',
      );
    },
  },
  {
    name: 'a graph-only identity declares the wrong tier',
    expect: 'must be tier 3',
    break: async () => {
      await writeFile(
        join(graphOnlyDir, 'mamba.yaml'),
        MAMBA.replace('tier: 3', 'tier: 1'),
        'utf8',
      );
    },
  },
  {
    name: 'a backlog item proposes a category the atlas does not have',
    expect: 'is not a category in the atlas',
    break: async () => {
      await writeFile(
        join(contentDir, 'resnet.md'),
        RESNET.replace(`      - ${ARCHITECTURES}`, '      - Mathematics/Nowhere In Particular'),
        'utf8',
      );
    },
  },
  {
    name: 'a claim cites a source the page does not list',
    expect: "is not listed in this page's sources",
    break: async () => {
      await writeFile(
        join(contentDir, 'resnet.md'),
        RESNET.replace(`source_id: ${SOURCE.id}`, 'source_id: source.vgg.2014'),
        'utf8',
      );
    },
  },
  {
    name: 'two pages declare the same claim id',
    expect: 'duplicate claim_id',
    break: async () => {
      const second = conceptMarkdown({
        conceptId: 'concept.deep_learning.vgg',
        title: 'VGG',
        slug: '/concepts/vgg',
        aliases: [],
        kind: 'method',
        tier: 1,
        categories: [ARCHITECTURES],
        relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.resnet' }],
        sources: [SOURCE],
        body: tier1Body(),
      }).replace(
        '---\n\n',
        `claims:
  - claim_id: claim.resnet.identity
    section: definition
    statement: A duplicate id, deliberately.
    status: supported
    evidence:
      - source_id: ${SOURCE.id}
        locator: Section 1
---

`,
      );
      await writeFile(join(contentDir, 'vgg.md'), second, 'utf8');
    },
  },
];

describe('a failed v2 build changes nothing', () => {
  for (const scenario of BROKEN) {
    it(`leaves the previous database, graph and sidebars untouched when ${scenario.name}`, async () => {
      const good = await compile();
      expect(good.ok, JSON.stringify(good.diagnostics)).toBe(true);
      const before = await snapshot();

      await scenario.break();

      const bad = await compile();
      expect(bad.ok).toBe(false);
      expect(bad.diagnostics.map((d) => d.message).join(' | ')).toContain(scenario.expect);

      expect(await snapshot()).toEqual(before);
    }, 60_000);
  }

  it('leaves no temporary database behind after a failure', async () => {
    const good = await compile();
    expect(good.ok).toBe(true);

    await BROKEN[0]!.break();
    const bad = await compile();
    expect(bad.ok).toBe(false);

    const { readdir } = await import('node:fs/promises');
    const leftovers = (await readdir(root)).filter((name) => name.endsWith('.db.tmp'));
    expect(leftovers).toEqual([]);
  }, 60_000);

  it('recovers exactly when the break is undone', async () => {
    const good = await compile();
    expect(good.ok).toBe(true);
    const before = await snapshot();

    await BROKEN[1]!.break();
    expect((await compile()).ok).toBe(false);

    await writeFile(join(graphOnlyDir, 'mamba.yaml'), MAMBA, 'utf8');
    const recovered = await compile();
    expect(recovered.ok).toBe(true);
    expect(await snapshot()).toEqual(before);
  }, 60_000);
});
