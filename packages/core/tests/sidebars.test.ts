/**
 * D06 — generated Docusaurus sidebars. One concept, several categories, one URL.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import { documentId } from '../src/sidebars.js';

const CONTENT_DIR = join(
  fileURLToPath(new URL('../../..', import.meta.url)),
  'content',
  'concepts',
);

async function generate(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'navigator-sidebars-'));
  try {
    const sidebarsPath = join(root, 'sidebars.generated.ts');
    const result = await compileCorpus({
      contentDir: CONTENT_DIR,
      databasePath: join(root, 'knowledge.db'),
      sidebarsPath,
      env: { SOURCE_DATE_EPOCH: '1700000000' },
    });
    if (!result.ok) throw new Error('acceptance corpus failed to compile');
    return await readFile(sidebarsPath, 'utf8');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/** Every `{ type, id, label }` entry, in file order. */
function entries(text: string): { type: string; id: string; label: string }[] {
  return [...text.matchAll(/\{ type: '(doc|ref)', id: "([^"]+)", label: "([^"]+)" \}/g)].map(
    (match) => ({ type: match[1]!, id: match[2]!, label: match[3]! }),
  );
}

describe('generated sidebars', () => {
  it('derives the document id from the file name', () => {
    expect(documentId('convolutional-layer.md')).toBe('convolutional-layer');
    expect(documentId('resnet.md')).toBe('resnet');
  });

  it('gives every concept exactly one canonical doc entry', async () => {
    const all = entries(await generate());
    const docs = all.filter((entry) => entry.type === 'doc');
    expect(docs).toHaveLength(11);
    expect(new Set(docs.map((d) => d.id)).size).toBe(11);
  }, 60_000);

  it('shows a multi-category concept as one doc plus at least one ref', async () => {
    const all = entries(await generate());
    for (const id of ['resnet', 'vgg', 'lenet', 'receptive-field', 'translation-equivariance']) {
      const mine = all.filter((entry) => entry.id === id);
      expect(
        mine.filter((e) => e.type === 'doc'),
        `${id} doc entries`,
      ).toHaveLength(1);
      expect(mine.filter((e) => e.type === 'ref').length, `${id} ref entries`).toBeGreaterThan(0);
    }
  }, 60_000);

  it('puts the canonical doc entry under the primary category', async () => {
    const text = await generate();
    const vision = text.split('label: "Computer Vision"')[1]?.split("type: 'category'")[0] ?? '';
    expect(vision).toContain(`{ type: 'doc', id: "resnet"`);
    expect(vision).toContain(`{ type: 'ref', id: "lenet"`);

    const architectures =
      text
        .split('label: "Deep Learning — Architectures"')[1]
        ?.split('label: "Deep Learning — Training"')[0] ?? '';
    expect(architectures).toContain(`{ type: 'ref', id: "resnet"`);
    expect(architectures).toContain(`{ type: 'doc', id: "lenet"`);
  }, 60_000);

  it('builds a nested category tree rooted in the atlas areas', async () => {
    const text = await generate();
    expect(text).toContain('label: "Artificial Intelligence"');
    expect(text).toContain('label: "Mathematics"');
    expect(text).toContain('label: "Analysis"');
    expect(text.indexOf('label: "Artificial Intelligence"')).toBeLessThan(
      text.indexOf('label: "Mathematics"'),
    );
  }, 60_000);

  it('sorts categories and entries by their explicit labels', async () => {
    const text = await generate();
    const vision = text.split('label: "Computer Vision"')[1]?.split(']')[0] ?? '';
    const labels = [...vision.matchAll(/label: "([^"]+)" \}/g)].map((m) => m[1]!);
    expect(labels).toEqual([...labels].sort());
    expect(labels).toEqual(['LeNet', 'Receptive Field', 'ResNet', 'VGG']);
  }, 60_000);

  it('is byte-identical across two runs', async () => {
    expect(await generate()).toBe(await generate());
  }, 60_000);
});
