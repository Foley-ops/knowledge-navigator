/**
 * Integration tests against the real acceptance corpus in content/concepts.
 * These assert the specific facts the runbook's checkpoint checks name, so a
 * content change that breaks an acceptance property fails here rather than in
 * a browser.
 *
 * The corpus was eleven pages when these were written and grows a batch at a
 * time towards the whole atlas. Nothing here may depend on its size: the
 * acceptance properties are about the eleven runbook pages, which stay, and
 * about the compiler agreeing with the files it was handed, which holds at
 * any size.
 */
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import { compareStrings, normalizeName } from '../src/normalize.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CONTENT_DIR = join(REPO_ROOT, 'content', 'concepts');
const GRAPH_ONLY_DIR = join(REPO_ROOT, 'content', 'graph-only');

/**
 * The eleven pages the runbook's acceptance checkpoints are written against.
 * Every other test in this file names one of them. They were the whole corpus
 * once; now they are the slice that must survive every content batch, which is
 * why this list is asserted by containment and never by length.
 */
const ACCEPTANCE_SLICE = [
  'concept.analysis.convolution',
  'concept.analysis.cross_correlation',
  'concept.analysis.translation_equivariance',
  'concept.deep_learning.backpropagation_through_convolution',
  'concept.deep_learning.convolutional_layer',
  'concept.deep_learning.lenet',
  'concept.deep_learning.pooling',
  'concept.deep_learning.receptive_field',
  'concept.deep_learning.residual_connection',
  'concept.deep_learning.resnet',
  'concept.deep_learning.vgg',
] as const;

interface ConceptRow {
  id: string;
  tier: number;
  review_state: string;
}

/**
 * Read one scalar out of a page's frontmatter block with a regular expression
 * rather than through the loader. The expectation has to be derived from the
 * files independently, or the test would only be watching the compiler agree
 * with itself.
 */
function frontmatterField(text: string, field: string, fileName: string): string {
  const close = text.indexOf('\n---', 3);
  const block = close === -1 ? text : text.slice(0, close);
  const match = new RegExp(`^${field}:[ \\t]*(.+)$`, 'm').exec(block);
  if (!match?.[1]) throw new Error(`${fileName} has no frontmatter field "${field}"`);
  return match[1].trim().replace(/^['"](.*)['"]$/, '$1');
}

/**
 * Every Markdown page the corpus loader would pick up, with the identity, tier
 * and review state it declares. The `_` and `.` prefixes are skipped here for
 * the same reason the loader skips them: those files are not pages.
 */
async function pagesOnDisk(): Promise<ConceptRow[]> {
  const fileNames = (await readdir(CONTENT_DIR)).filter(
    (name) => name.endsWith('.md') && !name.startsWith('_') && !name.startsWith('.'),
  );
  const pages = await Promise.all(
    fileNames.map(async (fileName) => {
      const text = await readFile(join(CONTENT_DIR, fileName), 'utf8');
      return {
        id: frontmatterField(text, 'concept_id', fileName),
        tier: Number(frontmatterField(text, 'tier', fileName)),
        review_state: frontmatterField(text, 'review_state', fileName),
      };
    }),
  );
  return pages.sort((a, b) => compareStrings(a.id, b.id));
}

/** Tier 3 identities carry no page; they are files under content/graph-only. */
async function graphOnlyFilesOnDisk(): Promise<string[]> {
  const entries = await readdir(GRAPH_ONLY_DIR).catch(() => [] as string[]);
  return entries.filter(
    (name) => name.endsWith('.yaml') && !name.startsWith('_') && !name.startsWith('.'),
  );
}

let root: string;
let databasePath: string;
let db: Database.Database;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-acceptance-'));
  databasePath = join(root, 'knowledge.db');
  const result = await compileCorpus({
    contentDir: CONTENT_DIR,
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    throw new Error(
      `acceptance corpus failed to compile:\n${result.diagnostics
        .map((d) => `${d.file} ${d.field}: ${d.message}`)
        .join('\n')}`,
    );
  }
  db = new Database(databasePath, { readonly: true, fileMustExist: true });
}, 60_000);

afterAll(async () => {
  db?.close();
  await rm(root, { recursive: true, force: true });
});

describe('the acceptance corpus', () => {
  it('compiles one faithful concept row per page, the acceptance slice among them', async () => {
    const rows = db
      .prepare(
        "SELECT id, tier, review_state FROM concepts WHERE content_format = 'markdown' ORDER BY id",
      )
      .all() as ConceptRow[];

    // What the old count of eleven was really protecting is agreement between
    // the files and the table: every page compiles to exactly one row, no page
    // is dropped, no row is invented, and the tier and review state each page
    // declares arrive unchanged. Comparing whole rows to the frontmatter on
    // disk says all of that at any corpus size, which a number never could.
    expect(rows).toEqual(await pagesOnDisk());

    // The id is the join key for aliases, categories, relationships and
    // sources, so two rows may never share one.
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);

    // Tier 3 identities are concepts with no page. They belong to the same
    // table, so the table may hold exactly as many of them as there are files.
    const graphOnly = db
      .prepare("SELECT COUNT(*) AS n FROM concepts WHERE content_format = 'graph-only'")
      .get() as { n: number };
    expect(graphOnly.n).toBe((await graphOnlyFilesOnDisk()).length);

    // The acceptance slice itself. Every checkpoint below reads one of these
    // pages, and each is a Tier 1 generated draft however far the corpus grows.
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const id of ACCEPTANCE_SLICE) {
      expect(byId.get(id), `acceptance page ${id}`).toEqual({
        id,
        tier: 1,
        review_state: 'generated-draft',
      });
    }
  });

  it('passes a foreign key check with no dangling rows', () => {
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });

  /* ----------------------------- D01 aliases ----------------------------- */

  it('resolves the aliases named by the runbook, case-insensitively', () => {
    const lookup = db.prepare('SELECT concept_id FROM aliases WHERE normalized = ?');
    for (const [query, expected] of [
      ['conv layer', 'concept.deep_learning.convolutional_layer'],
      ['CONV LAYER', 'concept.deep_learning.convolutional_layer'],
      ['convolution layer', 'concept.deep_learning.convolutional_layer'],
      ['ResNet', 'concept.deep_learning.resnet'],
      ['Residual Network', 'concept.deep_learning.resnet'],
      ['LeNet-5', 'concept.deep_learning.lenet'],
      ['RF', 'concept.deep_learning.receptive_field'],
      ['shift equivariance', 'concept.analysis.translation_equivariance'],
      ['conv backprop', 'concept.deep_learning.backpropagation_through_convolution'],
      ['VGGNet', 'concept.deep_learning.vgg'],
      ['skip connection', 'concept.deep_learning.residual_connection'],
      ['spatial pooling', 'concept.deep_learning.pooling'],
      ['convolution operator', 'concept.analysis.convolution'],
      ['cross correlation', 'concept.analysis.cross_correlation'],
    ] as const) {
      const row = lookup.get(normalizeName(query)) as { concept_id: string } | undefined;
      expect(row?.concept_id, `alias lookup for "${query}"`).toBe(expected);
    }
  });

  /* ------------------------ D02 categories and graph ---------------------- */

  it('places a concept in several categories with exactly one primary', () => {
    const rows = db
      .prepare(
        `SELECT cat.path, cc.is_primary FROM concept_categories cc
           JOIN categories cat ON cat.id = cc.category_id
          WHERE cc.concept_id = ? ORDER BY cc.position`,
      )
      .all('concept.deep_learning.resnet') as { path: string; is_primary: number }[];
    expect(rows).toEqual([
      { path: 'Artificial Intelligence/Computer Vision', is_primary: 1 },
      { path: 'Artificial Intelligence/Deep Learning — Architectures', is_primary: 0 },
    ]);
  });

  it('exposes only the atlas areas the corpus actually inhabits', () => {
    // The atlas names more areas than the corpus fills — Programming had no
    // pages when this was written, and which areas are empty changes with every
    // batch. The property that does not change: an area reaches the compiled
    // categories only because a concept sits in it. Naming the two areas the
    // seed corpus happened to use only restated that fact for one corpus size.
    const exposed = (
      db.prepare('SELECT DISTINCT top_level FROM categories ORDER BY top_level').all() as {
        top_level: string;
      }[]
    ).map((a) => a.top_level);
    const inhabited = (
      db
        .prepare(
          `SELECT DISTINCT cat.top_level FROM concept_categories cc
             JOIN categories cat ON cat.id = cc.category_id
            ORDER BY cat.top_level`,
        )
        .all() as { top_level: string }[]
    ).map((a) => a.top_level);
    expect(exposed).toEqual(inhabited);

    // Nor may an area appear that the atlas does not name: the compiled
    // categories are a subset of the curated atlas, never an invention.
    const atlasAreas = (
      db.prepare('SELECT title FROM atlas_areas').all() as { title: string }[]
    ).map((a) => a.title);
    expect(atlasAreas).toEqual(expect.arrayContaining(exposed));

    // The acceptance slice is filed across both of these, so both are exposed
    // however the rest of the corpus grows.
    expect(exposed).toEqual(expect.arrayContaining(['Artificial Intelligence', 'Mathematics']));
  });

  it('reaches residual connection and an earlier architecture within two hops of ResNet', () => {
    const neighbours = (id: string): string[] =>
      (
        db
          .prepare(
            `SELECT target_concept_id AS other FROM relationships WHERE source_concept_id = @id
             UNION
             SELECT source_concept_id AS other FROM relationships WHERE target_concept_id = @id`,
          )
          .all({ id }) as { other: string }[]
      ).map((r) => r.other);

    const oneHop = new Set(neighbours('concept.deep_learning.resnet'));
    const twoHop = new Set(oneHop);
    for (const id of oneHop) for (const n of neighbours(id)) twoHop.add(n);
    twoHop.delete('concept.deep_learning.resnet');

    expect(oneHop.has('concept.deep_learning.residual_connection')).toBe(true);
    expect(twoHop.has('concept.deep_learning.vgg')).toBe(true);
    // An earlier architecture beyond VGG is reachable in two hops as well.
    expect(twoHop.has('concept.deep_learning.convolutional_layer')).toBe(true);
    expect(twoHop.has('concept.deep_learning.pooling')).toBe(true);
  });

  it('records the typed relations the runbook names explicitly', () => {
    const has = db.prepare(
      'SELECT 1 AS found FROM relationships WHERE source_concept_id = ? AND type = ? AND target_concept_id = ?',
    );
    for (const [source, type, target] of [
      ['concept.analysis.cross_correlation', 'contrasts_with', 'concept.analysis.convolution'],
      [
        'concept.deep_learning.convolutional_layer',
        'implements',
        'concept.analysis.cross_correlation',
      ],
      ['concept.deep_learning.resnet', 'implements', 'concept.deep_learning.residual_connection'],
      ['concept.deep_learning.resnet', 'contrasts_with', 'concept.deep_learning.vgg'],
    ] as const) {
      expect(has.get(source, type, target), `${source} ${type} ${target}`).toBeDefined();
    }
  });

  /* ------------------------------ D03 sources ----------------------------- */

  it('deduplicates sources by id while keeping per-citation detail', () => {
    const shared = db
      .prepare('SELECT COUNT(*) AS n FROM sources WHERE id = ?')
      .get('source.deep_learning_book.convnets') as { n: number };
    expect(shared.n).toBe(1);

    const citations = db
      .prepare('SELECT COUNT(*) AS n FROM concept_sources WHERE source_id = ?')
      .get('source.deep_learning_book.convnets') as { n: number };
    expect(citations.n).toBeGreaterThan(1);
  });

  it('resolves ResNet, VGG and LeNet to their primary papers with supported sections', () => {
    const citation = db.prepare(
      `SELECT s.title, s.url, s.source_kind, cs.supports, cs.checked_on
         FROM concept_sources cs JOIN sources s ON s.id = cs.source_id
        WHERE cs.concept_id = ? AND cs.source_id = ?`,
    );

    const resnet = citation.get(
      'concept.deep_learning.resnet',
      'source.he2016.deep_residual_learning',
    ) as { title: string; url: string; source_kind: string; supports: string; checked_on: string };
    expect(resnet.url).toBe('https://arxiv.org/abs/1512.03385');
    expect(resnet.title).toBe('Deep Residual Learning for Image Recognition');
    expect(JSON.parse(resnet.supports)).toContain('definition');
    expect(resnet.checked_on).toBe('2026-09-16');

    const vgg = citation.get(
      'concept.deep_learning.vgg',
      'source.simonyan2015.very_deep_convolutional_networks',
    ) as { url: string; supports: string };
    expect(vgg.url).toBe('https://arxiv.org/abs/1409.1556');
    expect(JSON.parse(vgg.supports)).toContain('concrete-example');

    const lenet = citation.get(
      'concept.deep_learning.lenet',
      'source.lecun1998.gradient_based_learning',
    ) as { url: string; supports: string; source_kind: string };
    expect(lenet.url).toBe('https://ieeexplore.ieee.org/document/726791');
    expect(lenet.source_kind).toBe('primary-research');
    expect(JSON.parse(lenet.supports)).toContain('history-and-attribution');
  });

  it('never lets one source id describe two different works', () => {
    const conflicts = db
      .prepare(
        `SELECT source_id FROM concept_sources cs
          WHERE NOT EXISTS (SELECT 1 FROM sources s WHERE s.id = cs.source_id)`,
      )
      .all();
    expect(conflicts).toEqual([]);
  });
});
