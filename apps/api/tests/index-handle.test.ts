/**
 * E00 — the API opens the compiled index read-only and refuses anything it
 * cannot safely serve.
 */
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@navigator/core';
import { IndexUnavailableError, openIndex } from '../src/index-handle.js';
import { compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

let corpus: CompiledCorpus;
let scratch: string;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  scratch = await mkdtemp(join(tmpdir(), 'navigator-index-'));
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
      const row = index.db.prepare('SELECT COUNT(*) AS n FROM concepts').get() as { n: number };
      expect(row.n).toBe(11);
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
    try {
      expect(() => index.db.prepare('DELETE FROM concepts').run()).toThrow();
      const row = index.db.prepare('SELECT COUNT(*) AS n FROM concepts').get() as { n: number };
      expect(row.n).toBe(11);
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
