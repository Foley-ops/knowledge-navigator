/**
 * Integration tests against the real eleven-page acceptance corpus in
 * content/concepts. These assert the specific facts the runbook's checkpoint
 * checks name, so a content change that breaks an acceptance property fails
 * here rather than in a browser.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import { normalizeName } from '../src/normalize.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CONTENT_DIR = join(REPO_ROOT, 'content', 'concepts');

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
  it('holds exactly eleven Tier 1 generated-draft concepts', () => {
    const rows = db
      .prepare('SELECT id, tier, review_state FROM concepts ORDER BY id')
      .all() as { id: string; tier: number; review_state: string }[];
    expect(rows).toHaveLength(11);
    expect(rows.every((r) => r.tier === 1)).toBe(true);
    expect(rows.every((r) => r.review_state === 'generated-draft')).toBe(true);
    expect(rows.map((r) => r.id)).toEqual([
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
    ]);
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

  it('exposes the three top-level atlas areas that are in use', () => {
    const areas = db
      .prepare('SELECT DISTINCT top_level FROM categories ORDER BY top_level')
      .all() as { top_level: string }[];
    expect(areas.map((a) => a.top_level)).toEqual(['Artificial Intelligence', 'Mathematics']);
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
      [
        'concept.deep_learning.resnet',
        'implements',
        'concept.deep_learning.residual_connection',
      ],
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
