/**
 * The compiled index, opened read-only (runbook E00).
 *
 * Canonical knowledge lives in Markdown. The API is a reader: it opens the
 * compiled database in SQLite's read-only mode so that no request, no bug and
 * no injected input can change what the corpus says. A database that is
 * missing, unreadable, structurally wrong, or written by a *newer* compiler is
 * refused rather than half-used.
 */
import { existsSync } from 'node:fs';
import { REQUIRED_TABLES, SCHEMA_VERSION, openDatabaseReadOnly } from '@navigator/core';
import type { Database as DatabaseType } from 'better-sqlite3';

export type IndexUnavailableReason =
  'missing' | 'unreadable' | 'invalid' | 'schema-too-new' | 'closed';

export class IndexUnavailableError extends Error {
  public readonly reason: IndexUnavailableReason;
  constructor(reason: IndexUnavailableReason, message: string) {
    super(message);
    this.name = 'IndexUnavailableError';
    this.reason = reason;
  }
}

export interface IndexHandle {
  readonly available: boolean;
  readonly path: string;
  readonly schemaVersion: number | undefined;
  readonly reason: IndexUnavailableReason | undefined;
  readonly message: string | undefined;
  /** The open database. Throws when the index is unavailable. */
  readonly db: DatabaseType;
  close(): void;
}

function unavailable(path: string, reason: IndexUnavailableReason, message: string): IndexHandle {
  return {
    available: false,
    path,
    schemaVersion: undefined,
    reason,
    message,
    get db(): DatabaseType {
      throw new IndexUnavailableError(reason, message);
    },
    close: () => undefined,
  };
}

/**
 * Open the compiled index.
 *
 * Never throws: the caller decides whether an unavailable index is fatal.
 * `server.ts` refuses to start without one; the health endpoint reports it.
 */
export function openIndex(path: string): IndexHandle {
  if (!existsSync(path)) {
    return unavailable(
      path,
      'missing',
      `No compiled index at ${path}. Run \`npm run compile\` (or let the container entry point compile on start) before serving.`,
    );
  }

  let db: DatabaseType;
  try {
    db = openDatabaseReadOnly(path);
  } catch (error) {
    return unavailable(
      path,
      'unreadable',
      `The compiled index at ${path} could not be opened: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    const tables = new Set(
      (
        db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view')").all() as {
          name: string;
        }[]
      ).map((row) => row.name),
    );
    const missing = REQUIRED_TABLES.filter((table) => !tables.has(table));
    if (missing.length > 0) {
      db.close();
      return unavailable(
        path,
        'invalid',
        `The compiled index at ${path} is missing required table(s): ${missing.join(', ')}. Recompile it.`,
      );
    }

    const row = db.prepare("SELECT value FROM build_meta WHERE key = 'schema_version'").get() as
      { value: string } | undefined;
    const schemaVersion = row === undefined ? Number.NaN : Number(row.value);
    if (!Number.isInteger(schemaVersion)) {
      db.close();
      return unavailable(
        path,
        'invalid',
        `The compiled index at ${path} does not record a schema version. Recompile it.`,
      );
    }
    if (schemaVersion > SCHEMA_VERSION) {
      db.close();
      return unavailable(
        path,
        'schema-too-new',
        `The compiled index at ${path} uses schema version ${String(schemaVersion)}, but this API understands version ${String(SCHEMA_VERSION)}. Upgrade the API or recompile with this version.`,
      );
    }

    let closed = false;
    return {
      available: true,
      path,
      schemaVersion,
      reason: undefined,
      message: undefined,
      get db(): DatabaseType {
        if (closed) {
          throw new IndexUnavailableError('closed', 'the compiled index has been closed');
        }
        return db;
      },
      close: () => {
        if (closed) return;
        closed = true;
        db.close();
      },
    };
  } catch (error) {
    try {
      db.close();
    } catch {
      // Already closing down; the original error is the interesting one.
    }
    return unavailable(
      path,
      'invalid',
      `The compiled index at ${path} could not be inspected: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
