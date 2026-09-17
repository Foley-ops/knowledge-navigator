/**
 * D04 — search over the compiled index, exercised against the real canonical
 * corpus so the ranking is judged on real prose rather than on fixture text.
 * The corpus grows page by page, so nothing here may depend on its size.
 */
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compileCorpus } from '../src/compile.js';
import { MAX_QUERY_LENGTH, QueryError, searchConcepts, toFtsQuery } from '../src/query.js';

const CONTENT_DIR = join(
  fileURLToPath(new URL('../../..', import.meta.url)),
  'content',
  'concepts',
);

const GRAPH_ONLY_DIR = join(dirname(CONTENT_DIR), 'graph-only');

let root: string;
let db: Database.Database;
/**
 * How many canonical files the compiler had to read, counted on disk rather
 * than asked of the index under test — an independent witness to the corpus
 * size, so it stays true as pages are added.
 */
let canonicalFileCount: number;

/** The same selection the loader makes: `_` and `.` prefixes are not content. */
const countCanonicalFiles = async (directory: string, extension: string): Promise<number> => {
  let entries: string[];
  try {
    entries = await readdir(directory);
  } catch {
    // A corpus with no graph-only identities is a legitimate corpus.
    return 0;
  }
  return entries.filter(
    (name) => name.endsWith(extension) && !name.startsWith('_') && !name.startsWith('.'),
  ).length;
};

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-search-'));
  const databasePath = join(root, 'knowledge.db');
  const result = await compileCorpus({
    contentDir: CONTENT_DIR,
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) throw new Error('acceptance corpus failed to compile');
  canonicalFileCount =
    (await countCanonicalFiles(CONTENT_DIR, '.md')) +
    (await countCanonicalFiles(GRAPH_ONLY_DIR, '.yaml'));
  db = new Database(databasePath, { readonly: true, fileMustExist: true });
}, 60_000);

afterAll(async () => {
  db?.close();
  await rm(root, { recursive: true, force: true });
});

const ids = (query: string, limit = 10): string[] =>
  searchConcepts(db, query, limit).map((hit) => hit.conceptId);

describe('search ranking', () => {
  it('puts an exact title first and says why it matched', () => {
    const hits = searchConcepts(db, 'ResNet');
    expect(hits[0]?.conceptId).toBe('concept.deep_learning.resnet');
    expect(hits[0]?.matchKind).toBe('exact-title');
    expect(hits[0]?.rankExplanation).toContain('title is exactly');
    expect(hits[0]?.matchedAlias).toBeNull();
    expect(hits[0]?.slug).toBe('/concepts/resnet');
    expect(hits[0]?.reviewState).toBe('generated-draft');
  });

  it('finds convolutional layer by the alias "conv layer" and reports the alias', () => {
    const hits = searchConcepts(db, 'conv layer');
    expect(hits[0]?.conceptId).toBe('concept.deep_learning.convolutional_layer');
    expect(hits[0]?.matchKind).toBe('exact-alias');
    expect(hits[0]?.matchedAlias).toBe('conv layer');
    expect(hits[0]?.rankExplanation).toContain('conv layer');
    expect(hits[0]?.slug).toBe('/concepts/convolutional-layer');
  });

  it('is case-, hyphen- and spacing-insensitive on names', () => {
    for (const query of ['CONV LAYER', 'Conv-Layer', '  conv   layer  ', 'resnet', 'RESNET']) {
      const first = searchConcepts(db, query)[0];
      expect(['exact-title', 'exact-alias'], query).toContain(first?.matchKind);
    }
    expect(ids('Conv-Layer')[0]).toBe('concept.deep_learning.convolutional_layer');
    expect(ids('RESNET')[0]).toBe('concept.deep_learning.resnet');
  });

  it('finds an alias that is only a prefix of what was typed the other way round', () => {
    const hits = searchConcepts(db, 'resid');
    expect(hits[0]?.matchKind).toBe('title-prefix');
    expect(hits[0]?.conceptId).toBe('concept.deep_learning.residual_connection');
  });

  it('finds the right page for "translation invariance", which is nobody\'s title', () => {
    const hits = searchConcepts(db, 'translation invariance');
    expect(hits[0]?.conceptId).toBe('concept.analysis.translation_equivariance');
    expect(hits[0]?.matchKind).toBe('full-text');
    expect(ids('translation invariance')).toContain('concept.deep_learning.pooling');
  });

  it('finds a concept from a phrase in its body', () => {
    expect(ids('identity shortcut')[0]).toBe('concept.deep_learning.residual_connection');
    expect(ids('degradation problem')).toContain('concept.deep_learning.residual_connection');
    expect(ids('Wiener Khinchin')[0]).toBe('concept.analysis.cross_correlation');
    expect(ids('neocognitron')).toContain('concept.deep_learning.lenet');
    expect(ids('neocognitron')).toContain('concept.deep_learning.pooling');
  });

  it('returns every page that genuinely discusses a term, not just one', () => {
    // "matched filter" is discussed by both cross-correlation and the
    // convolutional layer, and BM25 separates them by under 0.2% — a real tie.
    // Assert the set, not an arbitrary winner inside it.
    const hits = ids('matched filter');
    expect(hits).toContain('concept.analysis.cross_correlation');
    expect(hits).toContain('concept.deep_learning.convolutional_layer');
    expect(hits.slice(0, 2).sort()).toEqual([
      'concept.analysis.cross_correlation',
      'concept.deep_learning.convolutional_layer',
    ]);
  });

  it('ranks a name match above a body mention of the same word', () => {
    const hits = searchConcepts(db, 'pooling', 20);
    expect(hits[0]?.conceptId).toBe('concept.deep_learning.pooling');
    expect(hits[0]?.matchKind).toBe('exact-title');
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.slice(1).every((h) => h.matchKind === 'full-text')).toBe(true);
  });

  it('returns each concept at most once', () => {
    const found = ids('convolution', 50);
    expect(new Set(found).size).toBe(found.length);
  });

  it('honours the limit and caps it at 50', () => {
    expect(searchConcepts(db, 'convolution', 2)).toHaveLength(2);
    expect(searchConcepts(db, 'convolution', 9999).length).toBeLessThanOrEqual(50);
    expect(searchConcepts(db, 'convolution', 0).length).toBeGreaterThan(0);
  });

  it('is deterministic across repeated calls', () => {
    expect(ids('convolution', 20)).toEqual(ids('convolution', 20));
    expect(ids('translation invariance')).toEqual(ids('translation invariance'));
  });

  it('returns nothing for a term that is genuinely absent', () => {
    expect(searchConcepts(db, 'quaternion holonomy')).toEqual([]);
  });
});

describe('query hardening', () => {
  it('rejects an empty query', () => {
    expect(() => searchConcepts(db, '')).toThrow(QueryError);
    expect(() => searchConcepts(db, '    ')).toThrow(QueryError);
    try {
      searchConcepts(db, '');
    } catch (error) {
      expect((error as QueryError).code).toBe('empty_query');
    }
  });

  it('rejects an over-long query', () => {
    expect(() => searchConcepts(db, 'a'.repeat(MAX_QUERY_LENGTH + 1))).toThrow(QueryError);
    expect(() => searchConcepts(db, 'a'.repeat(MAX_QUERY_LENGTH))).not.toThrow();
  });

  it('quotes every token so FTS operators arrive as literal text', () => {
    expect(toFtsQuery('conv layer')).toBe('"conv" "layer"*');
    expect(toFtsQuery('a OR b')).toBe('"a" "OR" "b"*');
    expect(toFtsQuery('title:resnet')).toBe('"title" "resnet"*');
    expect(toFtsQuery('NEAR(a b)')).toBe('"NEAR" "a" "b"*');
    expect(toFtsQuery('he said "hi"')).toBe('"he" "said" "hi"*');
    expect(toFtsQuery('***')).toBeUndefined();
    expect(toFtsQuery('   ')).toBeUndefined();
  });

  it.each([
    "' OR 1=1 --",
    '"; DROP TABLE concepts; --',
    "resnet'); DELETE FROM concepts; --",
    '*',
    '"',
    '""""',
    'a NEAR/2 b',
    '^resnet',
    'resnet AND (vgg OR',
    '\\',
    '%_%',
    String.raw`{}[]()<>|&!~`,
  ])('handles injection-shaped input %j safely', (query) => {
    expect(() => searchConcepts(db, query)).not.toThrow();
    const hits = searchConcepts(db, query);
    expect(Array.isArray(hits)).toBe(true);
  });

  it('leaves the database unchanged after hostile input', () => {
    const count = (): number =>
      (db.prepare('SELECT COUNT(*) AS n FROM concepts').get() as { n: number }).n;
    /** Identity *and* content, so an edit that kept the row count is caught too. */
    const snapshot = (): readonly { id: string; content_hash: string }[] =>
      db.prepare('SELECT id, content_hash FROM concepts ORDER BY id').all() as {
        id: string;
        content_hash: string;
      }[];

    const before = count();
    const rowsBefore = snapshot();
    for (const query of ["'; DELETE FROM concepts; --", 'resnet" OR "1"="1']) {
      searchConcepts(db, query);
    }
    const after = count();
    expect(after).toBe(before);
    expect(snapshot()).toEqual(rowsBefore);

    // This assertion used to read `toBe(11)`, the size of the seed corpus. The
    // number was never the point: it made the comparison above non-vacuous, by
    // proving the table had rows to lose. The corpus size is not a constant, so
    // pin it to the corpus instead — every canonical file on disk is one
    // indexed concept, which also catches a compiler that silently drops pages.
    expect(before).toBe(canonicalFileCount);
  });

  it('does not let a LIKE wildcard in the query widen the prefix search', () => {
    // `%` must be escaped, so this matches nothing rather than everything.
    expect(searchConcepts(db, '%')).toEqual([]);
  });
});
