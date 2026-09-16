import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REQUIRED_TABLES, SCHEMA_VERSION, buildTimestamp } from '../src/db.js';
import { compileCorpus } from '../src/compile.js';
import { normalizeName as normalizeForTest } from '../src/normalize.js';
import { conceptMarkdown } from './fixtures.js';
import type { FixtureOptions } from './fixtures.js';

export const CONVOLUTION: FixtureOptions = {
  conceptId: 'concept.analysis.convolution',
  title: 'Convolution',
  slug: '/concepts/convolution',
  aliases: ['convolution operator'],
  relationships: [{ type: 'contrasts_with', target: 'concept.analysis.cross_correlation' }],
};

export const CROSS_CORRELATION: FixtureOptions = {
  conceptId: 'concept.analysis.cross_correlation',
  title: 'Cross-Correlation',
  slug: '/concepts/cross-correlation',
  aliases: ['cross correlation'],
  relationships: [{ type: 'requires', target: 'concept.analysis.convolution' }],
};

let root: string;
let contentDir: string;
let databasePath: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-compile-'));
  contentDir = join(root, 'content');
  databasePath = join(root, 'data', 'knowledge.db');
  await rm(contentDir, { recursive: true, force: true });
  await import('node:fs/promises').then((fs) => fs.mkdir(contentDir, { recursive: true }));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function writeConcept(file: string, options: FixtureOptions): Promise<void> {
  await writeFile(join(contentDir, file), conceptMarkdown(options), 'utf8');
}

function open(path = databasePath): Database.Database {
  return new Database(path, { readonly: true, fileMustExist: true });
}

describe('D00 — database schema', () => {
  it('compiles an empty valid corpus and creates every required table', async () => {
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
    expect(existsSync(databasePath)).toBe(true);

    const db = open();
    try {
      const names = new Set(
        (
          db
            .prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view')")
            .all() as { name: string }[]
        ).map((row) => row.name),
      );
      for (const table of REQUIRED_TABLES) {
        expect(names.has(table), `missing table ${table}`).toBe(true);
      }
    } finally {
      db.close();
    }
  });

  it('enables foreign keys and records schema version 1 in build_meta', async () => {
    await compileCorpus({ contentDir, databasePath, env: {} });
    const db = open();
    try {
      const meta = Object.fromEntries(
        (db.prepare('SELECT key, value FROM build_meta').all() as { key: string; value: string }[])
          .map((row) => [row.key, row.value]),
      );
      expect(meta['schema_version']).toBe(String(SCHEMA_VERSION));
      expect(meta['schema_version']).toBe('1');
      expect(meta['concept_count']).toBe('0');
      expect(meta['generator']).toBe('@navigator/core');
      expect(meta['corpus_hash']).toMatch(/^[0-9a-f]{64}$/);
      expect(meta['built_at']).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      const [pragma] = db.pragma('foreign_keys') as { foreign_keys: number }[];
      expect(pragma?.foreign_keys).toBe(1);
    } finally {
      db.close();
    }
  });

  it('creates the required indexes', async () => {
    await compileCorpus({ contentDir, databasePath, env: {} });
    const db = open();
    try {
      const indexes = new Set(
        (db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as {
          name: string;
        }[]).map((row) => row.name),
      );
      for (const index of [
        'aliases_normalized_unique',
        'categories_parent',
        'concept_categories_category',
        'relationships_source',
        'relationships_target',
        'concept_sources_source',
      ]) {
        expect(indexes.has(index), `missing index ${index}`).toBe(true);
      }
    } finally {
      db.close();
    }
  });

  it('refuses to compile an invalid corpus and writes no database', async () => {
    await writeFile(join(contentDir, 'broken.md'), 'no frontmatter at all\n', 'utf8');
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(existsSync(databasePath)).toBe(false);
  });

  it('leaves no temporary file behind on success', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.ok).toBe(true);
    const leftovers = readdirSync(join(root, 'data')).filter((n) => n.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });
});

describe('build timestamp', () => {
  it('derives the timestamp from SOURCE_DATE_EPOCH when it is set', () => {
    expect(buildTimestamp({ SOURCE_DATE_EPOCH: '1700000000' })).toBe('2023-11-14T22:13:20.000Z');
  });

  it('ignores a malformed SOURCE_DATE_EPOCH', () => {
    const stamp = buildTimestamp({ SOURCE_DATE_EPOCH: 'not-a-number' });
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stamp).not.toBe('2023-11-14T22:13:20.000Z');
  });

  it('is identical across two builds when SOURCE_DATE_EPOCH is set', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    const env = { SOURCE_DATE_EPOCH: '1700000000' };
    const first = await compileCorpus({ contentDir, databasePath, env });
    const second = await compileCorpus({ contentDir, databasePath, env });
    expect(first.builtAt).toBe(second.builtAt);
    expect(first.corpusHash).toBe(second.corpusHash);
  });
});

describe('D01 — concepts and aliases', () => {
  it('inserts identity, body, hash and source path for every concept', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.ok).toBe(true);
    expect(result.stats?.concepts).toBe(2);

    const db = open();
    try {
      const row = db
        .prepare('SELECT * FROM concepts WHERE id = ?')
        .get('concept.analysis.convolution') as Record<string, unknown>;
      expect(row['title']).toBe('Convolution');
      expect(row['slug']).toBe('/concepts/convolution');
      expect(row['file_name']).toBe('convolution.md');
      expect(row['source_path']).toBe('content/concepts/convolution.md');
      expect(row['kind']).toBe('mathematical-object');
      expect(row['tier']).toBe(1);
      expect(row['review_state']).toBe('generated-draft');
      expect(row['primary_category']).toBe('Mathematics/Analysis');
      expect(String(row['content_hash'])).toMatch(/^[0-9a-f]{64}$/);
      expect(String(row['body'])).toContain('## Definition');
      expect(String(row['plain_text'])).toContain('Prose for definition');
    } finally {
      db.close();
    }
  });

  it('stores titles and aliases in normalised form', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      const rows = db
        .prepare('SELECT concept_id, alias, normalized, is_title FROM aliases ORDER BY normalized')
        .all() as { concept_id: string; alias: string; normalized: string; is_title: number }[];
      expect(rows.map((r) => r.normalized)).toEqual([
        'convolution',
        'convolution operator',
        'cross correlation',
      ]);
      // "Cross-Correlation" and the alias "cross correlation" normalise alike,
      // so the concept keeps one row and it is the title.
      const cross = rows.find((r) => r.normalized === 'cross correlation');
      expect(cross?.concept_id).toBe('concept.analysis.cross_correlation');
      expect(cross?.is_title).toBe(1);
      expect(cross?.alias).toBe('Cross-Correlation');
    } finally {
      db.close();
    }
  });

  it('finds a concept case-insensitively through a normalised alias', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      for (const query of ['CONVOLUTION Operator', 'convolution-operator', 'convolution  operator']) {
        const hit = db
          .prepare('SELECT concept_id FROM aliases WHERE normalized = ?')
          .get(normalizeForTest(query)) as { concept_id: string } | undefined;
        expect(hit?.concept_id, query).toBe('concept.analysis.convolution');
      }
    } finally {
      db.close();
    }
  });

  it('fails compilation when two concepts claim the same normalised name', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', {
      ...CROSS_CORRELATION,
      aliases: ['Convolution-Operator'],
    });
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('normalises to'))).toBe(true);
    expect(existsSync(databasePath)).toBe(false);
  });
});

describe('D02 — categories and relationships', () => {
  it('creates a row for every category path prefix, linked to its parent', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', {
      ...CROSS_CORRELATION,
      categories: [
        'Artificial Intelligence/Deep Learning — Architectures',
        'Artificial Intelligence/Computer Vision',
      ],
    });
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      const rows = db
        .prepare('SELECT path, name, top_level, depth, parent_id FROM categories ORDER BY path')
        .all() as { path: string; name: string; top_level: string; depth: number; parent_id: number | null }[];
      expect(rows.map((r) => r.path)).toEqual([
        'Artificial Intelligence',
        'Artificial Intelligence/Computer Vision',
        'Artificial Intelligence/Deep Learning — Architectures',
        'Mathematics',
        'Mathematics/Analysis',
      ]);
      const area = rows.find((r) => r.path === 'Artificial Intelligence');
      const leaf = rows.find((r) => r.path === 'Artificial Intelligence/Computer Vision');
      expect(area?.parent_id).toBeNull();
      expect(area?.depth).toBe(1);
      expect(leaf?.parent_id).toBe(
        (db.prepare('SELECT id FROM categories WHERE path = ?').get('Artificial Intelligence') as {
          id: number;
        }).id,
      );
      expect(leaf?.name).toBe('Computer Vision');
      expect(leaf?.top_level).toBe('Artificial Intelligence');
    } finally {
      db.close();
    }
  });

  it('flags exactly one primary category per concept, set by category order', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', {
      ...CROSS_CORRELATION,
      categories: [
        'Artificial Intelligence/Computer Vision',
        'Artificial Intelligence/Deep Learning — Architectures',
      ],
    });
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      const primaries = db
        .prepare(
          `SELECT cc.concept_id, c.path FROM concept_categories cc
             JOIN categories c ON c.id = cc.category_id
            WHERE cc.is_primary = 1 ORDER BY cc.concept_id`,
        )
        .all() as { concept_id: string; path: string }[];
      expect(primaries).toEqual([
        { concept_id: 'concept.analysis.convolution', path: 'Mathematics/Analysis' },
        {
          concept_id: 'concept.analysis.cross_correlation',
          path: 'Artificial Intelligence/Computer Vision',
        },
      ]);
      const counts = db
        .prepare('SELECT concept_id, COUNT(*) AS n FROM concept_categories GROUP BY concept_id')
        .all() as { concept_id: string; n: number }[];
      expect(counts.find((r) => r.concept_id === 'concept.analysis.cross_correlation')?.n).toBe(2);
      // Every concept's declared primary_category has a matching flagged row.
      const mismatches = db
        .prepare(
          `SELECT c.id FROM concepts c
            WHERE NOT EXISTS (
              SELECT 1 FROM concept_categories cc JOIN categories cat ON cat.id = cc.category_id
               WHERE cc.concept_id = c.id AND cc.is_primary = 1 AND cat.path = c.primary_category)`,
        )
        .all();
      expect(mismatches).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('preserves relationship notes, conditions and declared order', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', {
      ...CROSS_CORRELATION,
      relationships: [
        { type: 'requires', target: 'concept.analysis.convolution', note: 'Defined by contrast.' },
        { type: 'contrasts_with', target: 'concept.analysis.convolution' },
      ],
    });
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      const rows = db
        .prepare(
          `SELECT type, target_concept_id, note, condition, position FROM relationships
            WHERE source_concept_id = ? ORDER BY position`,
        )
        .all('concept.analysis.cross_correlation') as {
        type: string;
        target_concept_id: string;
        note: string | null;
        condition: string | null;
        position: number;
      }[];
      expect(rows).toEqual([
        {
          type: 'requires',
          target_concept_id: 'concept.analysis.convolution',
          note: 'Defined by contrast.',
          condition: null,
          position: 0,
        },
        {
          type: 'contrasts_with',
          target_concept_id: 'concept.analysis.convolution',
          note: null,
          condition: null,
          position: 1,
        },
      ]);
    } finally {
      db.close();
    }
  });

  it('joins every relationship endpoint to a concept row', async () => {
    await writeConcept('convolution.md', CONVOLUTION);
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      const dangling = db
        .prepare(
          `SELECT r.id FROM relationships r
             LEFT JOIN concepts s ON s.id = r.source_concept_id
             LEFT JOIN concepts t ON t.id = r.target_concept_id
            WHERE s.id IS NULL OR t.id IS NULL`,
        )
        .all();
      expect(dangling).toEqual([]);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    } finally {
      db.close();
    }
  });
});

describe('D03 — sources', () => {
  const CITED = {
    id: 'source.deep_learning_book.convnets',
    title: 'Deep Learning, Chapter 9 — Convolutional Networks',
    url: 'https://www.deeplearningbook.org/contents/convnets.html',
    kind: 'authoritative-secondary',
  };

  it('stores one row per distinct source and one row per citation', async () => {
    await writeConcept('convolution.md', {
      ...CONVOLUTION,
      sources: [{ ...CITED, supports: ['definition'], checkedOn: '2026-09-16' }],
    });
    await writeConcept('cross-correlation.md', {
      ...CROSS_CORRELATION,
      sources: [
        { ...CITED, supports: ['intuition', 'formal-treatment'], checkedOn: '2026-01-02' },
      ],
    });
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.ok).toBe(true);
    expect(result.stats?.sources).toBe(1);
    expect(result.stats?.conceptSources).toBe(2);

    const db = open();
    try {
      const source = db.prepare('SELECT * FROM sources').get() as Record<string, unknown>;
      expect(source['id']).toBe(CITED.id);
      expect(source['title']).toBe(CITED.title);
      expect(source['url']).toBe(CITED.url);
      expect(source['source_kind']).toBe(CITED.kind);

      const citations = db
        .prepare('SELECT concept_id, supports, checked_on FROM concept_sources ORDER BY concept_id')
        .all() as { concept_id: string; supports: string; checked_on: string }[];
      expect(citations).toEqual([
        {
          concept_id: 'concept.analysis.convolution',
          supports: '["definition"]',
          checked_on: '2026-09-16',
        },
        {
          concept_id: 'concept.analysis.cross_correlation',
          supports: '["intuition","formal-treatment"]',
          checked_on: '2026-01-02',
        },
      ]);
    } finally {
      db.close();
    }
  });

  it('rejects one source id describing two different works', async () => {
    await writeConcept('convolution.md', {
      ...CONVOLUTION,
      sources: [{ ...CITED, supports: ['definition'] }],
    });
    await writeConcept('cross-correlation.md', {
      ...CROSS_CORRELATION,
      sources: [
        { ...CITED, title: 'Something else entirely', url: 'https://example.org/other', supports: ['definition'] },
      ],
    });
    const result = await compileCorpus({ contentDir, databasePath, env: {} });
    expect(result.ok).toBe(false);
    expect(
      result.diagnostics.some((d) => d.message.includes('one source_id must describe one source')),
    ).toBe(true);
    expect(existsSync(databasePath)).toBe(false);
  });

  it('inserts sources in id order so the table is deterministic', async () => {
    await writeConcept('convolution.md', {
      ...CONVOLUTION,
      sources: [
        { id: 'source.zzz.last', supports: ['definition'] },
        { id: 'source.aaa.first', supports: ['definition'] },
      ],
    });
    await writeConcept('cross-correlation.md', CROSS_CORRELATION);
    await compileCorpus({ contentDir, databasePath, env: {} });

    const db = open();
    try {
      const ids = (db.prepare('SELECT id FROM sources').all() as { id: string }[]).map((r) => r.id);
      expect(ids).toEqual([
        'source.aaa.first',
        'source.deep_learning_book.convnets',
        'source.zzz.last',
      ]);
    } finally {
      db.close();
    }
  });
});
