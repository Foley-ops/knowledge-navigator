/**
 * Restoring private research (v2 runbook S02).
 *
 * Importing someone's own work back into an empty store is the last half of the
 * promise that they own it. It is also the most dangerous operation in the
 * product, because it writes to the one database nothing else can rebuild — so
 * it is built to be boring:
 *
 *   * it plans before it writes, and the plan is printable;
 *   * it applies nothing without `--confirm-import`;
 *   * every foreign key is checked *before* the transaction opens, so a failure
 *     is a message rather than a half-restored store;
 *   * the conflict policy is one sentence with no judgement in it: a record
 *     that is already there, identical, is skipped; a record that is already
 *     there and *different* aborts the whole import;
 *   * everything happens in one transaction, so there is no half-way state to
 *     recover from.
 *
 * Nothing here merges, reconciles or prefers. A conflict means two stores
 * disagree about what a record says, and only the researcher can know which is
 * right.
 */
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { z } from 'zod';
import { compareStrings } from './normalize.js';
import { PERSONAL_ARCHIVE_VERSION } from './personal-archive.js';
import type { PersonalArchive } from './personal-archive.js';

export class PersonalImportError extends Error {
  readonly detail: readonly string[];
  constructor(message: string, detail: readonly string[] = []) {
    super(message);
    this.name = 'PersonalImportError';
    this.detail = detail;
  }
}

/** The archive shape, checked before anything is read out of it. */
export const personalArchiveSchema = z.strictObject({
  archiveVersion: z.number().int().min(1),
  schemaVersion: z.number().int().min(0),
  exportedAt: z.string().min(1).max(40),
  counts: z.record(z.string(), z.number().int().min(0)),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

export interface ImportConflict {
  readonly table: string;
  readonly id: string;
  /** Columns whose values differ, so a person can see what disagrees. */
  readonly columns: readonly string[];
}

export interface PersonalImportPlan {
  readonly ok: boolean;
  readonly archiveVersion: number;
  readonly schemaVersion: number;
  readonly exportedAt: string;
  /** Rows that would be inserted, by table. */
  readonly insert: Readonly<Record<string, number>>;
  /** Rows already present and identical, by table. */
  readonly skip: Readonly<Record<string, number>>;
  readonly conflicts: readonly ImportConflict[];
  readonly problems: readonly string[];
  /** Tables in the order they would be written, parents before children. */
  readonly order: readonly string[];
}

interface ColumnRow {
  name: string;
  pk: number;
  notnull: number;
}

interface ForeignKeyRow {
  table: string;
  from: string;
  to: string | null;
}

function columnsOf(db: DatabaseType, table: string): ColumnRow[] {
  return db.prepare(`PRAGMA table_info(${table})`).all() as ColumnRow[];
}

function foreignKeysOf(db: DatabaseType, table: string): ForeignKeyRow[] {
  return db.prepare(`PRAGMA foreign_key_list(${table})`).all() as ForeignKeyRow[];
}

function tablesOf(db: DatabaseType): string[] {
  return (
    db
      .prepare(
        `SELECT name FROM sqlite_master
          WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name`,
      )
      .all() as { name: string }[]
  ).map((row) => row.name);
}

/**
 * Tables in an order where a row's parents are written before it is.
 *
 * Ties break on name, so the order is the same on every machine and the plan a
 * person reads is the plan that runs.
 */
export function writeOrder(db: DatabaseType, tables: readonly string[]): string[] {
  const remaining = new Set(tables);
  const ordered: string[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining]
      // Ready when every table it points at is already written, or is itself.
      .filter((table) =>
        foreignKeysOf(db, table).every((key) => key.table === table || !remaining.has(key.table)),
      )
      .sort(compareStrings);
    if (ready.length === 0) {
      // A cycle. Fall back to name order rather than refusing: SQLite will
      // enforce the keys, and the researcher gets a real error if it cannot.
      ordered.push(...[...remaining].sort(compareStrings));
      break;
    }
    for (const table of ready) {
      ordered.push(table);
      remaining.delete(table);
    }
  }
  return ordered;
}

/** Whether one record is already in the store, by its primary key. */
function existsInStore(db: DatabaseType, table: string, value: unknown): boolean {
  const key = primaryKeyOf(db, table)[0] ?? 'id';
  return (
    db.prepare(`SELECT 1 AS found FROM ${table} WHERE "${key}" = ? LIMIT 1`).get(value) !==
    undefined
  );
}

function primaryKeyOf(db: DatabaseType, table: string): string[] {
  return columnsOf(db, table)
    .filter((column) => column.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((column) => column.name);
}

/**
 * A primary key as one comparable string.
 *
 * JSON rather than a separator character: an id containing whatever separator
 * was chosen would otherwise collide with a different pair of values, and the
 * whole conflict policy rests on two records being the same record.
 */
function keyValue(row: Record<string, unknown>, key: readonly string[]): string {
  return JSON.stringify(key.map((column) => row[column] ?? null));
}

/** The same form, for a single value being looked up rather than a whole row. */
function singleKey(value: unknown): string {
  return JSON.stringify([value ?? null]);
}

/**
 * Work out what an import would do, without doing any of it.
 *
 * Every problem is collected rather than thrown on the first: a person deciding
 * whether to restore an archive needs the whole picture, not the first thing
 * that was wrong with it.
 */
export function planPersonalImport(db: DatabaseType, archive: PersonalArchive): PersonalImportPlan {
  const problems: string[] = [];
  const conflicts: ImportConflict[] = [];
  const insert: Record<string, number> = {};
  const skip: Record<string, number> = {};

  const dbVersion = (db.pragma('user_version') as { user_version: number }[])[0]?.user_version ?? 0;

  if (archive.archiveVersion > PERSONAL_ARCHIVE_VERSION) {
    problems.push(
      `this archive uses format ${String(archive.archiveVersion)} and this build understands ${String(PERSONAL_ARCHIVE_VERSION)}. Upgrade the application rather than importing something it cannot read.`,
    );
  }
  if (archive.schemaVersion !== dbVersion) {
    problems.push(
      archive.schemaVersion > dbVersion
        ? `this archive came from schema version ${String(archive.schemaVersion)} and this store is at ${String(dbVersion)}. Upgrade the application first.`
        : `this archive came from schema version ${String(archive.schemaVersion)} and this store is at ${String(dbVersion)}. Importing an older shape is not supported: export again from a current build.`,
    );
  }

  const present = new Set(tablesOf(db));
  const archiveTables = Object.keys(archive.tables).sort(compareStrings);
  for (const table of archiveTables) {
    if (!present.has(table)) {
      problems.push(`the archive holds a table this store does not have: ${table}`);
    }
  }

  if (problems.length > 0) {
    return {
      ok: false,
      archiveVersion: archive.archiveVersion,
      schemaVersion: archive.schemaVersion,
      exportedAt: archive.exportedAt,
      insert,
      skip,
      conflicts,
      problems,
      order: [],
    };
  }

  const order = writeOrder(
    db,
    archiveTables.filter((table) => present.has(table)),
  );

  /* --------------------------- rows and conflicts ------------------------ */

  /** Keys that will exist after the import: already here, or coming. */
  const willExist = new Map<string, Set<string>>();

  for (const table of order) {
    const key = primaryKeyOf(db, table);
    const columns = columnsOf(db, table).map((column) => column.name);
    const rows = archive.tables[table] ?? [];
    insert[table] = 0;
    skip[table] = 0;

    const here = new Map(
      (db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]).map((row) => [
        keyValue(row, key),
        row,
      ]),
    );
    const existing = new Set(here.keys());

    for (const row of rows) {
      for (const column of Object.keys(row)) {
        if (!columns.includes(column)) {
          problems.push(`${table} in the archive has a column this store does not: ${column}`);
        }
      }
      const id = keyValue(row, key);
      const already = here.get(id);
      if (already === undefined) {
        insert[table] = (insert[table] ?? 0) + 1;
      } else {
        const differing = columns.filter(
          (column) =>
            JSON.stringify(already[column] ?? null) !== JSON.stringify(row[column] ?? null),
        );
        if (differing.length === 0) {
          skip[table] = (skip[table] ?? 0) + 1;
        } else {
          conflicts.push({ table, id, columns: differing });
        }
      }
      existing.add(id);
    }
    willExist.set(table, existing);
  }

  /* ------------------------------ foreign keys --------------------------- */

  for (const table of order) {
    const keys = foreignKeysOf(db, table);
    if (keys.length === 0) continue;
    for (const row of archive.tables[table] ?? []) {
      for (const key of keys) {
        const value = row[key.from];
        if (value === null || value === undefined) continue;

        // A key is satisfied if the record it points at is already here, or is
        // coming in this same archive. Checked before the transaction, so a
        // dangling key is a sentence rather than a half-written store.
        const coming = willExist.get(key.table);
        const satisfied =
          coming === undefined ? existsInStore(db, key.table, value) : coming.has(singleKey(value));
        if (!satisfied) {
          problems.push(
            `${table}.${key.from} points at ${key.table} ${String(value)}, which is neither in this store nor in the archive`,
          );
        }
      }
    }
  }

  if (conflicts.length > 0) {
    problems.push(
      `${String(conflicts.length)} record(s) already exist here with different contents. Nothing has been changed: the two stores disagree, and only you can say which is right.`,
    );
  }

  return {
    ok: problems.length === 0,
    archiveVersion: archive.archiveVersion,
    schemaVersion: archive.schemaVersion,
    exportedAt: archive.exportedAt,
    insert,
    skip,
    conflicts,
    problems,
    order,
  };
}

export interface ApplyResult {
  readonly inserted: number;
  readonly skipped: number;
  readonly byTable: Readonly<Record<string, number>>;
}

/**
 * Apply a plan, in one transaction.
 *
 * The plan is recomputed here rather than trusted: between planning and
 * applying, the store could have changed, and an import that wrote a stale plan
 * would be exactly the silent corruption this whole path exists to avoid.
 */
export function applyPersonalImport(db: DatabaseType, archive: PersonalArchive): ApplyResult {
  const plan = planPersonalImport(db, archive);
  if (!plan.ok) {
    throw new PersonalImportError('this archive cannot be imported into this store', plan.problems);
  }

  const byTable: Record<string, number> = {};
  let inserted = 0;
  let skipped = 0;

  const write = db.transaction(() => {
    for (const table of plan.order) {
      const key = primaryKeyOf(db, table);
      const columns = columnsOf(db, table).map((column) => column.name);
      const exists = db.prepare(
        `SELECT 1 AS found FROM ${table} WHERE ${key.map((column) => `"${column}" = ?`).join(' AND ')} LIMIT 1`,
      );
      const statement = db.prepare(
        `INSERT INTO ${table} (${columns.map((column) => `"${column}"`).join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
      );
      byTable[table] = 0;
      for (const row of archive.tables[table] ?? []) {
        if (exists.get(...key.map((column) => row[column] as never)) !== undefined) {
          skipped += 1;
          continue;
        }
        statement.run(...columns.map((column) => (row[column] ?? null) as never));
        inserted += 1;
        byTable[table] = (byTable[table] ?? 0) + 1;
      }
    }
  });

  write();
  return { inserted, skipped, byTable };
}

/** Read and validate an archive file's contents. */
export function parsePersonalArchive(text: string): PersonalArchive {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new PersonalImportError('this file is not JSON, so it is not an archive', [
      error instanceof Error ? error.message : String(error),
    ]);
  }
  const parsed = personalArchiveSchema.safeParse(raw);
  if (!parsed.success) {
    throw new PersonalImportError('this file is not a personal archive', [
      ...parsed.error.issues.map((issue) =>
        issue.path.length > 0
          ? `${issue.path.map(String).join('.')}: ${issue.message}`
          : issue.message,
      ),
    ]);
  }
  return parsed.data as PersonalArchive;
}

/** Open the private store for writing. Used only by an import a person confirmed. */
export function openPersonalForImport(path: string): DatabaseType {
  const db = new Database(path, { readonly: false, fileMustExist: true });
  db.pragma('foreign_keys = ON');
  return db;
}
