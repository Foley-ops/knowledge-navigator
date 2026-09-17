/**
 * The private personal database (v2 runbook N00–N01).
 *
 * This is the one writable store in the product, and it is deliberately a
 * *separate file* from the compiled canonical index. The two have opposite
 * properties and mixing them would destroy both:
 *
 *   * `knowledge.db` is disposable. It is rebuilt from Markdown on every start
 *     and the API opens it read-only, so no request can change what the corpus
 *     says.
 *   * `personal.db` is irreplaceable. Nothing regenerates a research note. It
 *     is written only through explicit personal-data endpoints, it lives in its
 *     own Docker volume mounted by the API alone, and it never enters Git, an
 *     image layer, the graph JSON, or a model prompt unless the researcher
 *     selects the material for one request.
 *
 * Migrations run inside a transaction and are keyed on `PRAGMA user_version`,
 * so opening an existing database twice is a no-op and a failed migration
 * leaves the previous version intact.
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

/** Current personal schema version. Bumped by adding a migration below. */
export const PERSONAL_SCHEMA_VERSION = 1;

/** Tables the personal database must contain at the current version. */
export const PERSONAL_TABLES = [
  'projects',
  'research_sessions',
  'notes',
  'concept_familiarity',
  'saved_items',
  'artifacts',
  'export_history',
] as const;

/* -------------------------------------------------------------------------- */
/* Migrations                                                                  */
/* -------------------------------------------------------------------------- */

export interface Migration {
  readonly to: number;
  readonly sql: string;
}

/**
 * Version 1: the whole personal model.
 *
 * Every record carries `created_at` and `updated_at` as UTC ISO 8601 strings,
 * and everything archivable carries `archived_at` rather than being deleted —
 * losing a note to a mis-click is not recoverable from anywhere else.
 */
const MIGRATION_1 = `
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  archived_at TEXT
) STRICT;
CREATE INDEX projects_archived ON projects (archived_at);
CREATE INDEX projects_updated ON projects (updated_at);

-- A research session is created deliberately. Asking a question never creates
-- one: this product keeps selected work, not a surveillance history.
CREATE TABLE research_sessions (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  starting_question TEXT,
  context_summary   TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  archived_at       TEXT
) STRICT;
CREATE INDEX research_sessions_project ON research_sessions (project_id, archived_at);

-- Notes hold Markdown SOURCE. Nothing here is ever rendered HTML, and the
-- browser escapes it on the way out.
CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id   TEXT REFERENCES research_sessions(id) ON DELETE SET NULL,
  concept_id   TEXT,
  saved_item_id TEXT REFERENCES saved_items(id) ON DELETE SET NULL,
  artifact_id  TEXT REFERENCES artifacts(id) ON DELETE SET NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  archived_at  TEXT
) STRICT;
CREATE INDEX notes_project ON notes (project_id, archived_at);
CREATE INDEX notes_concept ON notes (concept_id);
CREATE INDEX notes_session ON notes (session_id);

-- At most one familiarity record per concept. Only the researcher writes this:
-- it is never inferred from a page visit, and the model may suggest a change
-- but may not make one.
CREATE TABLE concept_familiarity (
  concept_id TEXT PRIMARY KEY,
  level      TEXT NOT NULL CHECK (level IN ('unfamiliar', 'recognize', 'working', 'strong')),
  note       TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX concept_familiarity_level ON concept_familiarity (level);

-- Saved items are explicit. Opening a concept saves nothing.
CREATE TABLE saved_items (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id  TEXT REFERENCES research_sessions(id) ON DELETE SET NULL,
  item_type   TEXT NOT NULL
                CHECK (item_type IN ('concept', 'source', 'assistant-answer', 'comparison', 'path', 'next-check')),
  -- Stable identity of the saved thing, used to deduplicate within a project.
  item_key    TEXT NOT NULL,
  label       TEXT NOT NULL,
  payload_version INTEGER NOT NULL,
  payload     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  archived_at TEXT,
  UNIQUE (project_id, item_type, item_key)
) STRICT;
CREATE INDEX saved_items_project ON saved_items (project_id, archived_at);
CREATE INDEX saved_items_type ON saved_items (project_id, item_type);
CREATE INDEX saved_items_session ON saved_items (session_id);

-- Artifacts store EXTRACTED TEXT only. The original bytes are never retained.
CREATE TABLE artifacts (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  media_type      TEXT NOT NULL,
  byte_count      INTEGER NOT NULL,
  character_count INTEGER NOT NULL,
  sha256          TEXT NOT NULL,
  warnings        TEXT NOT NULL DEFAULT '[]',
  extracted_text  TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  archived_at     TEXT,
  -- The same file uploaded twice into one project is one artifact.
  UNIQUE (project_id, sha256)
) STRICT;
CREATE INDEX artifacts_project ON artifacts (project_id, archived_at);

-- Metadata about exports only: what was exported, when, and how much. Never
-- the exported contents.
CREATE TABLE export_history (
  id           TEXT PRIMARY KEY,
  project_id   TEXT REFERENCES projects(id) ON DELETE SET NULL,
  kind         TEXT NOT NULL,
  destination  TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  byte_count   INTEGER NOT NULL,
  created_at   TEXT NOT NULL
) STRICT;
CREATE INDEX export_history_project ON export_history (project_id);
`;

export const MIGRATIONS: readonly Migration[] = [{ to: 1, sql: MIGRATION_1 }];

/* -------------------------------------------------------------------------- */
/* Opening                                                                     */
/* -------------------------------------------------------------------------- */

export class PersonalDatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PersonalDatabaseError';
  }
}

/** UTC ISO 8601, the one timestamp format the personal store uses. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** A fresh UUID for a personal record. */
export function newId(): string {
  return globalThis.crypto.randomUUID();
}

export interface OpenPersonalOptions {
  /** Overrides `Date` for deterministic tests. */
  readonly now?: () => string;
}

/**
 * Open (creating if needed) and migrate the personal database.
 *
 * Throws on failure rather than returning a handle: unlike the canonical index,
 * which the product can run without, losing the personal store means every
 * write would silently do nothing.
 */
export function openPersonalDatabase(path: string): DatabaseType {
  if (path !== ':memory:') {
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch (error) {
      throw new PersonalDatabaseError(
        `could not create the directory for the personal database at ${path}`,
        { cause: error },
      );
    }
  }

  let db: DatabaseType;
  try {
    db = new Database(path);
  } catch (error) {
    throw new PersonalDatabaseError(`could not open the personal database at ${path}`, {
      cause: error,
    });
  }

  try {
    // WAL keeps a reader from blocking the single writer; a busy timeout means
    // a concurrent request waits rather than failing outright.
    if (path !== ':memory:') db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    migratePersonalDatabase(db);
  } catch (error) {
    db.close();
    if (error instanceof PersonalDatabaseError) throw error;
    throw new PersonalDatabaseError(
      `the personal database at ${path} could not be migrated: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
  return db;
}

/** Current `user_version`. */
export function personalSchemaVersion(db: DatabaseType): number {
  const rows = db.pragma('user_version') as { user_version: number }[];
  return rows[0]?.user_version ?? 0;
}

/**
 * Apply every migration this build knows and the database has not seen.
 *
 * Each migration runs in its own transaction together with its version bump, so
 * a failure rolls the whole step back and leaves `user_version` where it was.
 */
export function migratePersonalDatabase(db: DatabaseType): number {
  const current = personalSchemaVersion(db);
  if (current > PERSONAL_SCHEMA_VERSION) {
    throw new PersonalDatabaseError(
      `the personal database uses schema version ${String(current)}, but this build understands version ${String(PERSONAL_SCHEMA_VERSION)}. Upgrade the application rather than downgrading the data.`,
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.to <= current) continue;
    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      // `user_version` takes no bound parameter, and `migration.to` is an
      // integer literal from this module, never from input.
      db.pragma(`user_version = ${String(migration.to)}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw new PersonalDatabaseError(
        `migration to version ${String(migration.to)} failed and was rolled back: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }
  }
  return personalSchemaVersion(db);
}
