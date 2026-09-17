/**
 * D05 — deterministic graph export, exercised against the real acceptance
 * corpus so node, edge and category counts are the ones a reader will see.
 */
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import { SCHEMA_VERSION } from '../src/db.js';
import type { GraphDocument } from '../src/graph.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CONTENT_DIR = join(REPO_ROOT, 'content', 'concepts');
/** `loadCorpus` defaults to this sibling of the Markdown pages. */
const GRAPH_ONLY_DIR = join(REPO_ROOT, 'content', 'graph-only');

/**
 * How many canonical identities the corpus holds right now.
 *
 * The corpus is still being written, so its size is not a fact worth pinning to
 * a number: what the export owes the reader is that it carries *every* identity
 * on disk and invents none. Counted here the way the loader counts — Markdown
 * pages plus graph-only YAML, skipping the `_` and `.` prefixes it treats as
 * drafts rather than corpus — so the assertion holds at eleven concepts and at
 * two hundred and ninety-one.
 */
async function countCanonicalIdentities(): Promise<number> {
  const countIn = async (directory: string, extension: string): Promise<number> => {
    let names: string[];
    try {
      names = await readdir(directory);
    } catch {
      // A missing content/graph-only is not an error: it means no identities.
      return 0;
    }
    return names.filter(
      (name) => name.endsWith(extension) && !name.startsWith('_') && !name.startsWith('.'),
    ).length;
  };
  return (await countIn(CONTENT_DIR, '.md')) + (await countIn(GRAPH_ONLY_DIR, '.yaml'));
}

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
    expect(graph.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(2);
    expect(graph.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    // The count the header reports is the count of files the build read: one
    // node per canonical identity, nothing dropped and nothing conjured.
    expect(graph.counts.concepts).toBe(await countCanonicalIdentities());
    expect(graph.counts.concepts).toBe(graph.nodes.length);
    expect(graph.counts.relationships).toBe(graph.edges.length);
    expect(graph.counts.categories).toBe(graph.categories.length);
    // One node per identity only means something if the ids really are distinct.
    expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(graph.nodes.length);
    expect(new Set(graph.edges.map((e) => e.id)).size).toBe(graph.edges.length);
    expect(new Set(graph.categories.map((c) => c.path)).size).toBe(graph.categories.length);
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

describe('graph coverage metadata (v2 runbook L05)', () => {
  it('marks identity format and article availability on every node', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    for (const node of graph.nodes) {
      expect(['markdown', 'graph-only']).toContain(node.format);
      expect(typeof node.hasArticle).toBe('boolean');
      expect(node.hasArticle).toBe(node.format === 'markdown' && node.tier < 3);
      expect(typeof node.unresolvedReferences).toBe('number');
      expect(typeof node.claims).toBe('number');
    }
  }, 60_000);

  it('names the atlas candidate that covers each concept', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const resnet = graph.nodes.find((n) => n.id === 'concept.deep_learning.resnet');
    expect(resnet?.candidateId).toBe(
      'candidate.artificial_intelligence.deep_learning_architectures.resnet',
    );
    expect(graph.nodes.every((n) => n.candidateId !== null)).toBe(true);
  }, 60_000);

  it('carries aggregate coverage counts that agree with the nodes', async () => {
    const { graph } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    expect(graph.atlasHash).toMatch(/^[0-9a-f]{64}$/);
    expect(graph.atlasHash).not.toBe(graph.corpusHash);
    expect(graph.coverage.atlasAreas).toBe(3);
    expect(graph.coverage.atlasCandidates).toBeGreaterThan(200);
    // `covered` climbs with every page written, so the number is not the point:
    // the schema makes "covered" and "names a canonical concept" the same fact,
    // and validation lets exactly one candidate cover a concept. So the
    // aggregate is precisely the set of nodes a candidate covers — one to one.
    const covered = graph.nodes.filter((n) => n.candidateStatus === 'covered');
    expect(graph.coverage.candidatesByStatus['covered']).toBe(covered.length);
    expect(new Set(covered.map((n) => n.candidateId)).size).toBe(covered.length);
    expect(
      graph.nodes.every((n) => (n.candidateId === null) === (n.candidateStatus === null)),
    ).toBe(true);
    expect(graph.coverage.conceptsWithArticle).toBe(graph.nodes.filter((n) => n.hasArticle).length);
    expect(graph.coverage.conceptsByTier['1']).toBe(graph.nodes.filter((n) => n.tier === 1).length);
    expect(graph.coverage.conceptsByFormat['markdown']).toBe(
      graph.nodes.filter((n) => n.format === 'markdown').length,
    );
  }, 60_000);

  it('leaks nothing private and no editorial prose', async () => {
    const { text } = await build({ SOURCE_DATE_EPOCH: '1700000000' });
    const lowered = text.toLowerCase();

    // generated/graph.json is built into the web image and served to anyone who
    // can reach the site. Nothing from the private database, the artifact
    // store, the proposal workspace or the atlas notes may appear in it.
    const forbidden = [
      'personal',
      'artifact',
      'familiarity',
      'saved_item',
      'saveditem',
      'research_session',
      'proposal',
      'export_history',
      'exporthistory',
      'candidate_note',
      'apikey',
      'api_key',
      'password',
      'secret',
    ];
    for (const needle of forbidden) {
      expect(lowered.includes(needle), `graph.json contains "${needle}"`).toBe(false);
    }

    // Coverage is counts only: no candidate label and no backlog text.
    const graph = JSON.parse(text) as { coverage: Record<string, unknown> };
    for (const value of Object.values(graph.coverage)) {
      if (typeof value === 'number') continue;
      expect(typeof value).toBe('object');
      for (const inner of Object.values(value as Record<string, unknown>)) {
        expect(typeof inner).toBe('number');
      }
    }
  }, 60_000);
});
