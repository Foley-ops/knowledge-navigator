/**
 * D05 — deterministic graph export, exercised against the real acceptance
 * corpus so node, edge and category counts are the ones a reader will see.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import type { GraphDocument } from '../src/graph.js';

const CONTENT_DIR = join(
  fileURLToPath(new URL('../../..', import.meta.url)),
  'content',
  'concepts',
);

interface Built {
  readonly text: string;
  readonly graph: GraphDocument;
}

async function build(env: NodeJS.ProcessEnv): Promise<Built> {
  const root = await mkdtemp(join(tmpdir(), 'navigator-graph-'));
  try {
    const graphJsonPath = join(root, 'graph.json');
    const result = await compileCorpus({
      contentDir: CONTENT_DIR,
      databasePath: join(root, 'knowledge.db'),
      graphJsonPath,
      env,
    });
    if (!result.ok) throw new Error('acceptance corpus failed to compile');
    const text = await readFile(graphJsonPath, 'utf8');
    return { text, graph: JSON.parse(text) as GraphDocument };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe('graph export', () => {
  it('is byte-identical across two builds when SOURCE_DATE_EPOCH is set', async () => {
    const env = { SOURCE_DATE_EPOCH: '1700000000' };
    const first = await build(env);
    const second = await build(env);
    expect(second.text).toBe(first.text);
    expect(first.graph.builtAt).toBe('2023-11-14T22:13:20.000Z');
  }, 60_000);

  it('differs only in the timestamp when SOURCE_DATE_EPOCH is absent', async () => {
    const pinned = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const live = await build({});
    expect(live.graph.builtAt).not.toBe(pinned.graph.builtAt);
    expect(live.text.replace(/"builtAt": "[^"]+"/, 'X')).toBe(
      pinned.text.replace(/"builtAt": "[^"]+"/, 'X'),
    );
  }, 60_000);

  it('carries schema version, corpus hash and counts', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    expect(graph.schemaVersion).toBe(1);
    expect(graph.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    expect(graph.counts.concepts).toBe(11);
    expect(graph.counts.concepts).toBe(graph.nodes.length);
    expect(graph.counts.relationships).toBe(graph.edges.length);
    expect(graph.counts.categories).toBe(graph.categories.length);
  }, 60_000);

  it('sorts nodes, edges and categories semantically', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    expect(graph.nodes.map((n) => n.id)).toEqual([...graph.nodes.map((n) => n.id)].sort());
    expect(graph.categories.map((c) => c.path)).toEqual(
      [...graph.categories.map((c) => c.path)].sort(),
    );
    const edgeKeys = graph.edges.map((e) => `${e.source}|${e.type}|${e.target}`);
    expect(edgeKeys).toEqual([...edgeKeys].sort());
    for (const category of graph.categories) {
      expect(category.conceptIds).toEqual([...category.conceptIds].sort());
      expect(category.primaryConceptIds).toEqual([...category.primaryConceptIds].sort());
    }
  }, 60_000);

  it('describes each node richly enough to render a card without the API', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const resnet = graph.nodes.find((n) => n.id === 'concept.deep_learning.resnet');
    expect(resnet).toMatchObject({
      title: 'ResNet',
      slug: '/concepts/resnet',
      kind: 'implementation',
      tier: 1,
      reviewState: 'generated-draft',
      primaryCategory: 'Artificial Intelligence/Computer Vision',
    });
    expect(resnet?.aliases).toEqual(['Residual Network']);
    expect(resnet?.categories).toEqual([
      'Artificial Intelligence/Computer Vision',
      'Artificial Intelligence/Deep Learning — Architectures',
    ]);
    expect(resnet?.summary.length).toBeGreaterThan(20);
    // The title must not leak into the alias list.
    expect(resnet?.aliases).not.toContain('ResNet');
  }, 60_000);

  it('keeps every edge endpoint inside the node set and preserves notes', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(ids.has(edge.source), edge.source).toBe(true);
      expect(ids.has(edge.target), edge.target).toBe(true);
    }
    const conditional = graph.edges.find(
      (e) => e.source === 'concept.deep_learning.resnet' && e.type === 'contrasts_with',
    );
    expect(conditional?.target).toBe('concept.deep_learning.vgg');
    expect(conditional?.condition).toContain('ImageNet');
    expect(conditional?.note).toBeTruthy();
    expect(conditional?.id).toBe(
      'concept.deep_learning.resnet|contrasts_with|concept.deep_learning.vgg',
    );
  }, 60_000);

  it('builds a navigable category tree including intermediate areas', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const paths = graph.categories.map((c) => c.path);
    expect(paths).toContain('Artificial Intelligence');
    expect(paths).toContain('Mathematics');
    expect(paths).toContain('Artificial Intelligence/Computer Vision');

    const area = graph.categories.find((c) => c.path === 'Artificial Intelligence');
    expect(area?.parent).toBeNull();
    expect(area?.depth).toBe(1);
    // No concept declares the bare area, so it holds no concepts itself.
    expect(area?.conceptIds).toEqual([]);

    const vision = graph.categories.find(
      (c) => c.path === 'Artificial Intelligence/Computer Vision',
    );
    expect(vision?.parent).toBe('Artificial Intelligence');
    expect(vision?.name).toBe('Computer Vision');
    expect(vision?.conceptIds).toContain('concept.deep_learning.resnet');
    expect(vision?.primaryConceptIds).toContain('concept.deep_learning.resnet');

    // ResNet appears under Architectures too, but not as its primary category.
    const architectures = graph.categories.find(
      (c) => c.path === 'Artificial Intelligence/Deep Learning — Architectures',
    );
    expect(architectures?.conceptIds).toContain('concept.deep_learning.resnet');
    expect(architectures?.primaryConceptIds).not.toContain('concept.deep_learning.resnet');
  }, 60_000);

  it('gives every concept exactly one primary category across the whole atlas', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const counts = new Map<string, number>();
    for (const category of graph.categories) {
      for (const id of category.primaryConceptIds) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    expect(counts.size).toBe(graph.nodes.length);
    for (const node of graph.nodes) {
      expect(counts.get(node.id), node.id).toBe(1);
    }
  }, 60_000);
});
