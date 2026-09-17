/**
 * E00 — the API opens the compiled index read-only and refuses anything it
 * cannot safely serve.
 */
import { copyFile, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@navigator/core';
import { IndexUnavailableError, openIndex } from '../src/index-handle.js';
import { CONTENT_DIR, compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

let corpus: CompiledCorpus;
let scratch: string;

/**
 * The source files the acceptance corpus was compiled from, spelled the way
 * the compiler records them in `concepts.source_path`.
 *
 * The corpus grows with every content batch, so the number of rows the index
 * serves is not a constant worth pinning; what must hold at any size is that
 * the index serves exactly the corpus on disk. `compileAcceptanceCorpus`
 * refuses to return unless every file compiled cleanly, so each file here is
 * one row in the table and there are no rows besides.
 */
let sourcePaths: string[];

/**
 * The corpus loader ignores names beginning with `_` or `.` — Docusaurus
 * partials and drafts are not pages — so the derivation must ignore them too,
 * or it would expect rows the compiler never wrote.
 */
async function listCorpusFiles(directory: string, extension: string): Promise<string[]> {
  try {
    return (await readdir(directory)).filter(
      (name) => name.endsWith(extension) && !name.startsWith('_') && !name.startsWith('.'),
    );
  } catch {
    // A corpus may legitimately have no graph-only directory.
    return [];
  }
}

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  scratch = await mkdtemp(join(tmpdir(), 'navigator-index-'));
  const graphOnlyDir = join(dirname(CONTENT_DIR), 'graph-only');
  sourcePaths = [
    ...(await listCorpusFiles(CONTENT_DIR, '.md')).map((name) => `content/concepts/${name}`),
    ...(await listCorpusFiles(graphOnlyDir, '.yaml')).map((name) => `content/graph-only/${name}`),
  ].sort();
}, 60_000);

afterAll(async () => {
  await corpus.cleanup();
  await rm(scratch, { recursive: true, force: true });
});

describe('opening the compiled index', () => {
  it('opens a valid index and reports its schema version', () => {
    const index = openIndex(corpus.databasePath);
    try {
      expect(index.available).toBe(true);
      expect(index.schemaVersion).toBe(SCHEMA_VERSION);
      expect(index.reason).toBeUndefined();
    } finally {
      index.close();
    }
  });

  it('serves read queries', () => {
    const index = openIndex(corpus.databasePath);
    try {
      // Guards the rest of this test against passing over an empty corpus.
      expect(sourcePaths.length).toBeGreaterThan(0);
      const row = index.db.prepare('SELECT COUNT(*) AS n FROM concepts').get() as { n: number };
      expect(row.n).toBe(sourcePaths.length);
      // A matching count alone would survive one row lost and one duplicated,
      // so compare the rows themselves against the files they came from.
      const served = (
        index.db.prepare('SELECT source_path FROM concepts ORDER BY source_path').all() as {
          source_path: string;
        }[]
      ).map((record) => record.source_path);
      expect(served).toEqual(sourcePaths);
    } finally {
      index.close();
    }
  });

  it.each([
    ['UPDATE concepts SET title = ? WHERE id = ?', ['Hacked', 'concept.deep_learning.resnet']],
    ['DELETE FROM concepts', []],
    [
      "INSERT INTO concepts (id, title, slug, file_name, source_path, kind, tier, review_state, summary, body, plain_text, content_hash, primary_category) VALUES ('x','x','/concepts/x','x.md','x','concept',1,'generated-draft','x','x','x','x','Mathematics/Analysis')",
      [],
    ],
    ['DROP TABLE concepts', []],
    ['CREATE TABLE evil (id TEXT)', []],
  ])('refuses the write statement %s', (sql, params) => {
    const index = openIndex(corpus.databasePath);
    try {
      expect(() => index.db.prepare(sql).run(...(params as string[]))).toThrow(/readonly/i);
    } finally {
      index.close();
    }
  });

  it('leaves the database unchanged after a rejected write', () => {
    const index = openIndex(corpus.databasePath);
    const countConcepts = (): number =>
      (index.db.prepare('SELECT COUNT(*) AS n FROM concepts').get() as { n: number }).n;
    try {
      // The number that matters is the one the index held a moment ago, not
      // any particular corpus size: a refused DELETE must take nothing, and a
      // partial delete is caught at any size. The count must also be non-zero,
      // or a DELETE that removed everything would be indistinguishable from
      // one that was refused.
      const before = countConcepts();
      expect(before).toBeGreaterThan(0);
      expect(() => index.db.prepare('DELETE FROM concepts').run()).toThrow();
      expect(countConcepts()).toBe(before);
    } finally {
      index.close();
    }
  });

  it('reports a missing database with an actionable message', () => {
    const index = openIndex(join(scratch, 'nope.db'));
    expect(index.available).toBe(false);
    expect(index.reason).toBe('missing');
    expect(index.message).toContain('No compiled index');
    expect(index.message).toContain('npm run compile');
    expect(() => index.db).toThrow(IndexUnavailableError);
  });

  it('rejects a file that is not a database', async () => {
    const path = join(scratch, 'garbage.db');
    await writeFile(path, 'this is not sqlite\n', 'utf8');
    const index = openIndex(path);
    expect(index.available).toBe(false);
    expect(['unreadable', 'invalid']).toContain(index.reason);
  });

  it('rejects a database missing required tables', async () => {
    const path = join(scratch, 'empty.db');
    const db = new Database(path);
    db.exec('CREATE TABLE build_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    db.prepare('INSERT INTO build_meta VALUES (?, ?)').run(
      'schema_version',
      String(SCHEMA_VERSION),
    );
    db.close();

    const index = openIndex(path);
    expect(index.available).toBe(false);
    expect(index.reason).toBe('invalid');
    expect(index.message).toContain('missing required table');
    expect(index.message).toContain('concepts');
  });

  it('rejects a database written by a newer compiler', async () => {
    const path = join(scratch, 'future.db');
    await copyFile(corpus.databasePath, path);
    const db = new Database(path);
    db.prepare("UPDATE build_meta SET value = '99' WHERE key = 'schema_version'").run();
    db.close();

    const index = openIndex(path);
    expect(index.available).toBe(false);
    expect(index.reason).toBe('schema-too-new');
    expect(index.message).toContain('schema version 99');
    expect(index.message).toContain(`version ${String(SCHEMA_VERSION)}`);
  });

  it('rejects a database with no recorded schema version', async () => {
    const path = join(scratch, 'unversioned.db');
    await copyFile(corpus.databasePath, path);
    const db = new Database(path);
    db.prepare("DELETE FROM build_meta WHERE key = 'schema_version'").run();
    db.close();

    const index = openIndex(path);
    expect(index.available).toBe(false);
    expect(index.reason).toBe('invalid');
    expect(index.message).toContain('schema version');
  });

  it('refuses access after close', () => {
    const index = openIndex(corpus.databasePath);
    index.close();
    expect(() => index.db).toThrow(IndexUnavailableError);
    // Closing twice is harmless.
    expect(() => index.close()).not.toThrow();
  });
});
