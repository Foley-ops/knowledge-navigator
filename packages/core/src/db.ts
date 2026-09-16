/**
 * Compiled-index database schema (runbook §4.2).
 *
 * The database is a *disposable* artefact. Canonical Markdown in
 * content/concepts is the authority; everything here can be rebuilt from it at
 * any time, so the schema is free to change shape whenever that serves queries
 * better — only `SCHEMA_VERSION` has to move with it.
 */
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

/** Bumped whenever the compiled shape changes. The API refuses a newer one. */
export const SCHEMA_VERSION = 1;

/** Tables the compiled database must contain (runbook §4.2). */
export const REQUIRED_TABLES = [
  'concepts',
  'aliases',
  'categories',
  'concept_categories',
  'relationships',
  'sources',
  'concept_sources',
  'build_meta',
  'concepts_fts',
] as const;

export const SCHEMA_SQL = `
-- Key/value facts about this build.
CREATE TABLE build_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

-- One row per canonical concept. \`id\` is the stable concept_id.
CREATE TABLE concepts (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  file_name        TEXT NOT NULL UNIQUE,
  source_path      TEXT NOT NULL,
  kind             TEXT NOT NULL,
  tier             INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  review_state     TEXT NOT NULL,
  summary          TEXT NOT NULL,
  body             TEXT NOT NULL,
  plain_text       TEXT NOT NULL,
  content_hash     TEXT NOT NULL,
  primary_category TEXT NOT NULL
) STRICT;

-- Titles and aliases, normalised for case-insensitive lookup. The unique index
-- on \`normalized\` makes a name collision between two concepts fail compilation.
CREATE TABLE aliases (
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  alias      TEXT NOT NULL,
  normalized TEXT NOT NULL,
  is_title   INTEGER NOT NULL DEFAULT 0 CHECK (is_title IN (0, 1)),
  position   INTEGER NOT NULL,
  PRIMARY KEY (concept_id, normalized)
) STRICT;
CREATE UNIQUE INDEX aliases_normalized_unique ON aliases (normalized);

-- The atlas. A row exists for every prefix of every category path, so the tree
-- can be walked from a top-level area down to a leaf.
CREATE TABLE categories (
  id        INTEGER PRIMARY KEY,
  path      TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  top_level TEXT NOT NULL,
  depth     INTEGER NOT NULL,
  parent_id INTEGER REFERENCES categories(id)
) STRICT;
CREATE INDEX categories_parent ON categories (parent_id);

CREATE TABLE concept_categories (
  concept_id  TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  is_primary  INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  position    INTEGER NOT NULL,
  PRIMARY KEY (concept_id, category_id)
) STRICT;
CREATE INDEX concept_categories_category ON concept_categories (category_id);
CREATE INDEX concept_categories_primary ON concept_categories (category_id, is_primary);

CREATE TABLE relationships (
  id                INTEGER PRIMARY KEY,
  source_concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  target_concept_id TEXT NOT NULL REFERENCES concepts(id),
  note              TEXT,
  condition         TEXT,
  position          INTEGER NOT NULL,
  UNIQUE (source_concept_id, type, target_concept_id)
) STRICT;
CREATE INDEX relationships_source ON relationships (source_concept_id);
CREATE INDEX relationships_target ON relationships (target_concept_id);

-- One row per distinct source_id. Identity fields must agree wherever cited.
CREATE TABLE sources (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  source_kind TEXT NOT NULL
) STRICT;

-- One row per citation. \`supports\` is a JSON array of section names, and
-- \`checked_on\` belongs to the citation rather than to the source.
CREATE TABLE concept_sources (
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  source_id  TEXT NOT NULL REFERENCES sources(id),
  supports   TEXT NOT NULL,
  checked_on TEXT NOT NULL,
  position   INTEGER NOT NULL,
  PRIMARY KEY (concept_id, source_id)
) STRICT;
CREATE INDEX concept_sources_source ON concept_sources (source_id);

-- Full-text search over titles, aliases, summaries and plain-text bodies.
CREATE VIRTUAL TABLE concepts_fts USING fts5 (
  concept_id UNINDEXED,
  title,
  aliases,
  summary,
  body,
  tokenize = 'unicode61 remove_diacritics 2'
);
`;

/** Create a new database file and install the schema. */
export function createDatabase(path: string): DatabaseType {
  const db = new Database(path);
  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  return db;
}

/** Open an existing database read-only. */
export function openDatabaseReadOnly(path: string): DatabaseType {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * Build timestamp.
 *
 * Reproducible builds set `SOURCE_DATE_EPOCH`; when it is present it is the
 * only source of the timestamp, so two builds of identical input produce
 * byte-identical output (runbook D05).
 */
export function buildTimestamp(env: NodeJS.ProcessEnv = process.env): string {
  const epoch = env['SOURCE_DATE_EPOCH'];
  if (epoch !== undefined && epoch !== '' && /^\d+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000).toISOString();
  }
  return new Date().toISOString();
}
