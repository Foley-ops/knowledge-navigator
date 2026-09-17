/**
 * Exporting private research (v2 runbook S01).
 *
 * The private store is the only thing in this product that cannot be rebuilt.
 * Canonical Markdown is in Git, the compiled index is a build artefact, the
 * graph is derived — but a researcher's projects, notes, familiarity, saved
 * results and uploaded text exist in exactly one place. This is how they get a
 * copy they own.
 *
 * Two properties shape the format.
 *
 * It is **complete by construction**: every table in the private database is
 * read from the database's own catalogue, so a table added later is exported
 * without anyone remembering to add it here. A record that exists is in the
 * archive.
 *
 * It is **only theirs**: the exporter never opens the canonical index and never
 * looks a concept up. Where a personal record names canonical knowledge it
 * names it by stable id and by the label the researcher saw — never by copying
 * the page. An archive is a copy of private work, not a second copy of the
 * corpus.
 *
 * Original uploaded bytes are not in here because they are not anywhere: the
 * product extracts text and drops the file.
 */
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compareStrings } from './normalize.js';

/** Bumped when the archive shape changes in a way an importer must notice. */
export const PERSONAL_ARCHIVE_VERSION = 1;

export const ARCHIVE_FILES = {
  data: 'archive.json',
  summary: 'SUMMARY.md',
} as const;

export interface PersonalArchive {
  readonly archiveVersion: number;
  /** `PRAGMA user_version` of the database this came from. */
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly counts: Readonly<Record<string, number>>;
  /** Every table, by name, each row a plain object. */
  readonly tables: Readonly<Record<string, readonly Readonly<Record<string, unknown>>[]>>;
}

interface TableInfoRow {
  name: string;
  pk: number;
}

/** Every user table in the database, in a stable order. */
export function personalTableNames(db: DatabaseType): string[] {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name`,
    )
    .all() as { name: string }[];
  return rows.map((row) => row.name);
}

/**
 * Read one table in an order that does not depend on how rows were inserted.
 *
 * Ordered by primary key, then by every remaining column, so two exports of the
 * same data are byte-identical — which is what makes "restore and compare"
 * (S03) a real check rather than a hopeful one.
 */
function readTable(db: DatabaseType, table: string): Record<string, unknown>[] {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as TableInfoRow[];
  const keys = columns.filter((column) => column.pk > 0).map((column) => column.name);
  const rest = columns.filter((column) => column.pk === 0).map((column) => column.name);
  const order = [...keys, ...rest].map((name) => `"${name}"`).join(', ');
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all() as Record<string, unknown>[];
}

export interface ReadArchiveOptions {
  readonly now?: (() => string) | undefined;
}

/** Read the whole private store into one archive. Nothing else is opened. */
export function readPersonalArchive(
  db: DatabaseType,
  options: ReadArchiveOptions = {},
): PersonalArchive {
  const now = options.now ?? (() => new Date().toISOString());
  const version = (db.pragma('user_version') as { user_version: number }[])[0]?.user_version ?? 0;

  const tables: Record<string, Record<string, unknown>[]> = {};
  const counts: Record<string, number> = {};
  for (const table of personalTableNames(db)) {
    const rows = readTable(db, table);
    tables[table] = rows;
    counts[table] = rows.length;
  }

  return {
    archiveVersion: PERSONAL_ARCHIVE_VERSION,
    schemaVersion: version,
    exportedAt: now(),
    counts,
    tables,
  };
}

/** Stable JSON: keys sorted, two spaces, one trailing newline. */
export function serializePersonalArchive(archive: PersonalArchive): string {
  const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value !== null && typeof value === 'object') {
      const source = value as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(source).sort(compareStrings))
        sorted[key] = sortKeys(source[key]);
      return sorted;
    }
    return value;
  };
  return `${JSON.stringify(sortKeys(archive), null, 2)}\n`;
}

/* -------------------------------------------------------------------------- */
/* The readable summary                                                        */
/* -------------------------------------------------------------------------- */

function rowsOf(archive: PersonalArchive, table: string): Readonly<Record<string, unknown>>[] {
  return [...(archive.tables[table] ?? [])];
}

function text(row: Readonly<Record<string, unknown>>, key: string): string {
  const value = row[key];
  return typeof value === 'string'
    ? value
    : value === null || value === undefined
      ? ''
      : String(value);
}

function firstLine(value: string, limit = 120): string {
  const line = value.split('\n').find((candidate) => candidate.trim() !== '') ?? '';
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
}

/**
 * A Markdown overview a person can read without a JSON viewer.
 *
 * It is a summary on purpose: the archive beside it holds every record in full,
 * and a second complete copy in a different format is two things to keep in
 * step. What this gives is the shape of the work — which projects, how much in
 * each, and enough of each note to recognise it.
 */
export function renderPersonalSummary(archive: PersonalArchive): string {
  const lines: string[] = [];
  const projects = rowsOf(archive, 'projects');

  lines.push('# Private research export', '');
  lines.push(
    `Exported ${archive.exportedAt} from a private store at schema version ${String(archive.schemaVersion)}, archive format ${String(archive.archiveVersion)}.`,
    '',
  );
  lines.push(
    'This is your own work: projects, sessions, notes, familiarity, saved results and the text extracted from files you uploaded. It contains no canonical page content — where a record names a concept it names it by id and by the label you saw.',
    '',
  );

  lines.push('## What is here', '');
  lines.push('| Table | Records |');
  lines.push('| --- | --- |');
  for (const table of Object.keys(archive.counts).sort(compareStrings)) {
    lines.push(`| ${table} | ${String(archive.counts[table] ?? 0)} |`);
  }
  lines.push('');

  if (projects.length === 0) {
    lines.push('There are no projects in this store.', '');
  }

  for (const project of projects) {
    const id = text(project, 'id');
    lines.push(`## ${text(project, 'title')}`, '');
    lines.push(`- Id: \`${id}\``);
    lines.push(`- Created: ${text(project, 'created_at')}`);
    if (text(project, 'archived_at') !== '') {
      lines.push(`- Archived: ${text(project, 'archived_at')}`);
    }
    if (text(project, 'description') !== '') {
      lines.push(`- About: ${firstLine(text(project, 'description'), 200)}`);
    }
    lines.push('');

    const sessions = rowsOf(archive, 'research_sessions').filter(
      (row) => text(row, 'project_id') === id,
    );
    if (sessions.length > 0) {
      lines.push('### Sessions', '');
      for (const session of sessions) {
        lines.push(
          `- ${text(session, 'title')} — ${firstLine(text(session, 'starting_question'))}`.trimEnd(),
        );
      }
      lines.push('');
    }

    const notes = rowsOf(archive, 'notes').filter((row) => text(row, 'project_id') === id);
    if (notes.length > 0) {
      lines.push('### Notes', '');
      for (const note of notes) {
        const concept = text(note, 'concept_id');
        lines.push(
          `- ${firstLine(text(note, 'body'))}${concept === '' ? '' : ` (on \`${concept}\`)`}`,
        );
      }
      lines.push('');
    }

    const saved = rowsOf(archive, 'saved_items').filter((row) => text(row, 'project_id') === id);
    if (saved.length > 0) {
      lines.push('### Saved', '');
      for (const item of saved) {
        lines.push(`- ${text(item, 'item_type')}: ${text(item, 'label')}`);
      }
      lines.push('');
    }

    const artifacts = rowsOf(archive, 'artifacts').filter((row) => text(row, 'project_id') === id);
    if (artifacts.length > 0) {
      lines.push('### Uploaded material', '');
      lines.push(
        'The extracted text is in the archive. The original files were never kept, so they are not here and were not there.',
        '',
      );
      for (const artifact of artifacts) {
        lines.push(
          `- ${text(artifact, 'label')} (${text(artifact, 'media_type')}, ${text(artifact, 'character_count')} characters)`,
        );
      }
      lines.push('');
    }
  }

  const familiarity = rowsOf(archive, 'concept_familiarity');
  if (familiarity.length > 0) {
    lines.push('## Familiarity', '');
    lines.push('Only you set these. Nothing in this product infers them.', '');
    for (const record of familiarity) {
      lines.push(`- \`${text(record, 'concept_id')}\` — ${text(record, 'level')}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/* -------------------------------------------------------------------------- */
/* Writing the history row                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Record that an export happened.
 *
 * This is the only write this module makes, and the only write the command line
 * makes to the private store outside an import. It records metadata — what kind,
 * where it went, how many records and how many bytes — and never the contents.
 * It runs after the archive is safely on disk, so a failed export leaves no
 * trace claiming otherwise.
 */
export function recordExport(
  databasePath: string,
  entry: {
    readonly id: string;
    readonly kind: string;
    readonly destination: string;
    readonly recordCount: number;
    readonly byteCount: number;
    readonly createdAt: string;
  },
): void {
  const db = new Database(databasePath, { readonly: false, fileMustExist: true });
  try {
    db.prepare(
      `INSERT INTO export_history (id, project_id, kind, destination, record_count, byte_count, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
    ).run(
      entry.id,
      entry.kind,
      entry.destination,
      entry.recordCount,
      entry.byteCount,
      entry.createdAt,
    );
  } finally {
    db.close();
  }
}

/** Total records across every table. */
export function archiveRecordCount(archive: PersonalArchive): number {
  return Object.values(archive.counts).reduce((sum, count) => sum + count, 0);
}
