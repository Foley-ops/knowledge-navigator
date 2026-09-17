/**
 * The personal database as a handle the app can hold.
 *
 * Mirrors `IndexHandle`: opening never throws, because the API has to keep
 * serving canonical knowledge when the private store is unavailable — browsing
 * and search do not depend on it. What it must never do is *pretend*: a route
 * that would write returns 503 with a reason rather than silently succeeding.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { PERSONAL_SCHEMA_VERSION, openPersonalDatabase, personalSchemaVersion } from './db.js';

export type PersonalUnavailableReason = 'unwritable' | 'schema-too-new' | 'closed';

export class PersonalUnavailableError extends Error {
  readonly reason: PersonalUnavailableReason;
  constructor(reason: PersonalUnavailableReason, message: string) {
    super(message);
    this.name = 'PersonalUnavailableError';
    this.reason = reason;
  }
}

export interface PersonalHandle {
  readonly available: boolean;
  readonly schemaVersion: number | undefined;
  readonly reason: PersonalUnavailableReason | undefined;
  readonly message: string | undefined;
  /** Throws `PersonalUnavailableError` when the store could not be opened. */
  readonly db: DatabaseType;
  close(): void;
}

function unavailable(reason: PersonalUnavailableReason, message: string): PersonalHandle {
  return {
    available: false,
    schemaVersion: undefined,
    reason,
    message,
    get db(): DatabaseType {
      throw new PersonalUnavailableError(reason, message);
    },
    close: () => undefined,
  };
}

/**
 * Open the personal database, reporting failure instead of throwing.
 *
 * The message is deliberately free of the file path: a health response and a
 * log line are both places a path can leak, and the path of the private store
 * is exactly the kind of detail that should not travel.
 */
export function openPersonal(path: string): PersonalHandle {
  let db: DatabaseType;
  try {
    db = openPersonalDatabase(path);
  } catch (error) {
    return unavailable(
      'unwritable',
      `The private research store could not be opened. Browsing, search and the concept graph are unaffected. (${
        error instanceof Error ? error.name : 'error'
      })`,
    );
  }

  const version = personalSchemaVersion(db);
  if (version > PERSONAL_SCHEMA_VERSION) {
    db.close();
    return unavailable(
      'schema-too-new',
      `The private research store uses schema version ${String(version)}, but this build understands version ${String(PERSONAL_SCHEMA_VERSION)}. Upgrade the application rather than downgrading the data.`,
    );
  }

  let closed = false;
  return {
    available: true,
    schemaVersion: version,
    reason: undefined,
    message: undefined,
    get db(): DatabaseType {
      if (closed) {
        throw new PersonalUnavailableError('closed', 'The private research store is closed.');
      }
      return db;
    },
    close: () => {
      if (closed) return;
      closed = true;
      db.close();
    },
  };
}
