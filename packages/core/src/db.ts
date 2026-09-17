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

/**
 * Bumped whenever the compiled shape changes. The API refuses a newer one.
 *
 * Version 2 adds the atlas, the editorial backlog, claims and their evidence,
 * and the canonical identity format, without changing any version 1 table.
 */
export const SCHEMA_VERSION = 2;

/** Tables the compiled database must contain (runbook §4.2, v2 runbook L00). */
export const REQUIRED_TABLES = [
  // Version 1
  'concepts',
  'aliases',
  'categories',
  'concept_categories',
  'relationships',
  'sources',
  'concept_sources',
  'build_meta',
  'concepts_fts',
  // Version 2
  'atlas_areas',
  'atlas_categories',
  'atlas_candidates',
  'atlas_candidate_aliases',
  'atlas_candidate_categories',
  'unresolved_references',
  'unresolved_reference_sections',
  'unresolved_reference_categories',
  'claims',
  'claim_evidence',
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
  primary_category TEXT NOT NULL,
  -- How this identity is stored. A graph-only identity has a body of '' and no
  -- reader-facing route; \`has_article\` is the single flag every query uses so
  -- the rule lives in one place rather than in each caller's WHERE clause.
  content_format   TEXT NOT NULL DEFAULT 'markdown'
                     CHECK (content_format IN ('markdown', 'graph-only')),
  has_article      INTEGER NOT NULL DEFAULT 1 CHECK (has_article IN (0, 1))
) STRICT;
CREATE INDEX concepts_format ON concepts (content_format);
CREATE INDEX concepts_article ON concepts (has_article);

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

-- ---------------------------------------------------------------------------
-- The curated broad atlas (v2 runbook §4.1).
--
-- Editorial structure, deliberately in its own tables: a candidate is not a
-- concept, cannot be searched as one, and can never ground an answer. The only
-- bridge between the two is \`atlas_candidates.canonical_concept_id\`, which is
-- non-null exactly when a candidate's status is 'covered'.
-- ---------------------------------------------------------------------------
CREATE TABLE atlas_areas (
  id       TEXT PRIMARY KEY,
  title    TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL
) STRICT;

CREATE TABLE atlas_categories (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  area_id            TEXT NOT NULL REFERENCES atlas_areas(id),
  -- NULL when the parent is the area itself.
  parent_category_id TEXT REFERENCES atlas_categories(id),
  depth              INTEGER NOT NULL,
  path               TEXT NOT NULL UNIQUE,
  position           INTEGER NOT NULL
) STRICT;
CREATE INDEX atlas_categories_area ON atlas_categories (area_id);
CREATE INDEX atlas_categories_parent ON atlas_categories (parent_category_id);

CREATE TABLE atlas_candidates (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  normalized_title     TEXT NOT NULL,
  status               TEXT NOT NULL
                         CHECK (status IN ('candidate', 'proposed-tier-3', 'covered', 'deferred')),
  canonical_concept_id TEXT REFERENCES concepts(id),
  note                 TEXT,
  position             INTEGER NOT NULL,
  -- A covered candidate names exactly one concept; nothing else names any.
  CHECK ((status = 'covered') = (canonical_concept_id IS NOT NULL))
) STRICT;
CREATE INDEX atlas_candidates_status ON atlas_candidates (status);
CREATE UNIQUE INDEX atlas_candidates_concept ON atlas_candidates (canonical_concept_id)
  WHERE canonical_concept_id IS NOT NULL;

CREATE TABLE atlas_candidate_aliases (
  candidate_id TEXT NOT NULL REFERENCES atlas_candidates(id) ON DELETE CASCADE,
  alias        TEXT NOT NULL,
  normalized   TEXT NOT NULL,
  position     INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, normalized)
) STRICT;

CREATE TABLE atlas_candidate_categories (
  candidate_id TEXT NOT NULL REFERENCES atlas_candidates(id) ON DELETE CASCADE,
  category_id  TEXT NOT NULL REFERENCES atlas_categories(id),
  position     INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, category_id)
) STRICT;
CREATE INDEX atlas_candidate_categories_category ON atlas_candidate_categories (category_id);

-- ---------------------------------------------------------------------------
-- The editorial backlog (v2 runbook §4.3).
--
-- One row per unresolved reference, tied to the page that needs it.
-- \`group_id\` is derived from the normalised label, so two pages waiting on the
-- same idea group into one piece of work while keeping both source records.
-- ---------------------------------------------------------------------------
CREATE TABLE unresolved_references (
  id               TEXT PRIMARY KEY,
  group_id         TEXT NOT NULL,
  concept_id       TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,
  normalized_label TEXT NOT NULL,
  reason           TEXT NOT NULL,
  blocking         INTEGER NOT NULL CHECK (blocking IN (0, 1)),
  proposed_kind    TEXT,
  position         INTEGER NOT NULL
) STRICT;
CREATE INDEX unresolved_references_group ON unresolved_references (group_id);
CREATE INDEX unresolved_references_concept ON unresolved_references (concept_id);
CREATE INDEX unresolved_references_blocking ON unresolved_references (blocking);

CREATE TABLE unresolved_reference_sections (
  reference_id TEXT NOT NULL REFERENCES unresolved_references(id) ON DELETE CASCADE,
  section      TEXT NOT NULL,
  position     INTEGER NOT NULL,
  PRIMARY KEY (reference_id, section)
) STRICT;

CREATE TABLE unresolved_reference_categories (
  reference_id      TEXT NOT NULL REFERENCES unresolved_references(id) ON DELETE CASCADE,
  category_path     TEXT NOT NULL,
  atlas_category_id TEXT REFERENCES atlas_categories(id),
  position          INTEGER NOT NULL,
  PRIMARY KEY (reference_id, category_path)
) STRICT;

-- ---------------------------------------------------------------------------
-- Claims and their evidence (v2 runbook §4.4).
-- ---------------------------------------------------------------------------
CREATE TABLE claims (
  id         TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  section    TEXT NOT NULL,
  statement  TEXT NOT NULL,
  status     TEXT NOT NULL
               CHECK (status IN ('supported', 'conditional', 'disputed', 'unsupported')),
  position   INTEGER NOT NULL
) STRICT;
CREATE INDEX claims_concept ON claims (concept_id);
CREATE INDEX claims_status ON claims (status);

CREATE TABLE claim_evidence (
  id        INTEGER PRIMARY KEY,
  claim_id  TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id),
  locator   TEXT NOT NULL,
  note      TEXT,
  position  INTEGER NOT NULL,
  UNIQUE (claim_id, source_id, locator)
) STRICT;
CREATE INDEX claim_evidence_source ON claim_evidence (source_id);

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
