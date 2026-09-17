/**
 * D06 — generated Docusaurus sidebars. One concept, several categories, one URL.
 */
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
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

/**
 * The document ids a reader must be able to navigate to, read from the content
 * directory itself rather than from anything the compiler said.
 *
 * This is the corpus-sized statement of what used to be the number eleven: the
 * sidebar owes one canonical entry to every Markdown page below Tier 3, and the
 * only honest way to know how many that is — at eleven pages or at 291 — is to
 * count the pages. Tier 3 identities are deliberately absent from reader
 * navigation, so they are filtered out here exactly as `buildSidebars` filters
 * them out there.
 */
async function navigableDocumentIds(): Promise<Set<string>> {
  const fileNames = (await readdir(CONTENT_DIR)).filter((name) => name.endsWith('.md'));
  const ids = new Set<string>();
  for (const fileName of fileNames) {
    const text = await readFile(join(CONTENT_DIR, fileName), 'utf8');
    // Everything before the closing fence; the opening one carries no newline.
    const frontmatter = text.split('\n---')[0] ?? '';
    const declared = /^tier:\s*(\d+)\s*$/m.exec(frontmatter)?.[1];
    if (declared === undefined) throw new Error(`${fileName} declares no tier`);
    if (Number(declared) < 3) ids.add(documentId(fileName));
  }
  return ids;
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
    const navigable = await navigableDocumentIds();

    // Sorted arrays rather than sets, because the diff on a failure then names
    // the page that was dropped or invented.
    expect([...new Set(docs.map((d) => d.id))].sort()).toEqual([...navigable].sort());
    // One entry each: as many doc entries as there are distinct ids among them,
    // and as many distinct ids as there are pages. A page reached by two
    // canonical entries is two pages to Docusaurus, which is the failure this
    // test exists to catch.
    expect(docs).toHaveLength(navigable.size);

    // A `ref` is a second route to a page the sidebar already declares. One
    // pointing anywhere else is a dead link in the navigation tree.
    for (const ref of all.filter((entry) => entry.type === 'ref')) {
      expect(navigable.has(ref.id), `ref to ${ref.id} without a canonical doc entry`).toBe(true);
    }
  }, 60_000);

  it('shows a multi-category concept as one doc plus at least one ref', async () => {
    const all = entries(await generate());

    // The shape holds for every page the sidebar names, not only for the five
    // the acceptance corpus happened to file under two categories: appearing in
    // n categories means one canonical entry and n-1 references, whatever n is.
    const byId = new Map<string, typeof all>();
    for (const entry of all) byId.set(entry.id, [...(byId.get(entry.id) ?? []), entry]);
    for (const [id, mine] of byId) {
      expect(
        mine.filter((e) => e.type === 'doc'),
        `${id} doc entries`,
      ).toHaveLength(1);
      expect(
        mine.filter((e) => e.type === 'ref'),
        `${id} ref entries`,
      ).toHaveLength(mine.length - 1);
    }

    // These five are still named, because the rule above is vacuous for a
    // corpus in which nothing is cross-filed. They keep a multi-category page
    // in the test at every corpus size.
    for (const id of ['resnet', 'vgg', 'lenet', 'receptive-field', 'translation-equivariance']) {
      const mine = byId.get(id) ?? [];
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
    // Code-unit order, matching `compareStrings` in the generator.
    expect(labels).toEqual([...labels].sort());
    expect(new Set(labels).size, 'labels are distinct').toBe(labels.length);

    // The four acceptance-corpus pages under Computer Vision, named for their
    // labels rather than counted: the category keeps taking new pages, but
    // these four must still be there, still carrying their titles rather than
    // their document ids — which is what "by their explicit labels" means.
    expect(labels).toEqual(expect.arrayContaining(['LeNet', 'Receptive Field', 'ResNet', 'VGG']));
  }, 60_000);

  it('is byte-identical across two runs', async () => {
    expect(await generate()).toBe(await generate());
  }, 60_000);
});
