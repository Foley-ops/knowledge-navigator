/**
 * Private notes (v2 runbook N04).
 *
 * A note is Markdown *source*, stored and returned exactly as written. Nothing
 * here renders HTML and nothing here strips anything: the browser escapes the
 * text on the way out, so a note containing `<script>` is a note containing the
 * characters `<script>`, not a vulnerability and not a silently edited note.
 *
 * A note may hang off a project, a session, a canonical concept, a saved item
 * or an artifact. It never changes canonical content.
 */
import { z } from 'zod';
import type { Database as DatabaseType } from 'better-sqlite3';
import { DOTTED_ID } from '@navigator/core';
import { newId, nowIso } from './db.js';
import { getProject } from './projects.js';
import { getSessionInProject } from './sessions.js';
import { LIMITS, PersonalNotFoundError, fail, pageBounds, uuid } from './types.js';
import type { ListOptions, Note } from './types.js';

interface Row {
  id: string;
  project_id: string;
  session_id: string | null;
  concept_id: string | null;
  saved_item_id: string | null;
  artifact_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function present(row: Row): Note {
  return {
    id: row.id,
    projectId: row.project_id,
    sessionId: row.session_id,
    conceptId: row.concept_id,
    savedItemId: row.saved_item_id,
    artifactId: row.artifact_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

const body = z
  .string()
  .min(1, 'body must not be empty')
  .max(LIMITS.noteBody, `body must be at most ${String(LIMITS.noteBody)} bytes`)
  .refine((value) => value.trim() !== '', 'body must not be only whitespace');

const conceptId = z
  .string()
  .regex(DOTTED_ID, 'conceptId must be a lowercase dotted identifier')
  .optional();

const createInput = z.strictObject({
  body,
  sessionId: uuid.optional(),
  conceptId,
  savedItemId: uuid.optional(),
  artifactId: uuid.optional(),
});

const updateInput = z.strictObject({ body });

/** Confirm an optional link target exists inside this project. */
function requireInProject(
  db: DatabaseType,
  table: 'saved_items' | 'artifacts',
  projectId: string,
  id: string | undefined,
  what: string,
): string | null {
  if (id === undefined) return null;
  const row = db.prepare(`SELECT project_id FROM ${table} WHERE id = ?`).get(id) as
    { project_id: string } | undefined;
  if (row === undefined || row.project_id !== projectId) {
    throw new PersonalNotFoundError(what, id);
  }
  return id;
}

export function createNote(
  db: DatabaseType,
  projectId: string,
  input: unknown,
  now = nowIso,
): Note {
  getProject(db, projectId);
  const parsed = createInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);

  const sessionId =
    parsed.data.sessionId === undefined
      ? null
      : getSessionInProject(db, projectId, parsed.data.sessionId).id;
  const savedItemId = requireInProject(
    db,
    'saved_items',
    projectId,
    parsed.data.savedItemId,
    'saved item',
  );
  const artifactId = requireInProject(
    db,
    'artifacts',
    projectId,
    parsed.data.artifactId,
    'artifact',
  );

  const at = now();
  const id = newId();
  db.prepare(
    `INSERT INTO notes
       (id, project_id, session_id, concept_id, saved_item_id, artifact_id, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    projectId,
    sessionId,
    parsed.data.conceptId ?? null,
    savedItemId,
    artifactId,
    parsed.data.body,
    at,
    at,
  );
  return getNote(db, id);
}

export function getNote(db: DatabaseType, id: string): Note {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Row | undefined;
  if (row === undefined) throw new PersonalNotFoundError('note', id);
  return present(row);
}

export function getNoteInProject(db: DatabaseType, projectId: string, id: string): Note {
  const note = getNote(db, id);
  if (note.projectId !== projectId) throw new PersonalNotFoundError('note', id);
  return note;
}

export interface NoteQuery extends ListOptions {
  readonly conceptId?: string | undefined;
  readonly sessionId?: string | undefined;
}

export function listNotes(db: DatabaseType, projectId: string, query: NoteQuery = {}): Note[] {
  const { limit, offset } = pageBounds(query);
  const clauses = ['project_id = @projectId'];
  const params: Record<string, string | number> = { projectId, limit, offset };
  if (query.includeArchived !== true) clauses.push('archived_at IS NULL');
  if (query.conceptId !== undefined) {
    clauses.push('concept_id = @conceptId');
    params['conceptId'] = query.conceptId;
  }
  if (query.sessionId !== undefined) {
    clauses.push('session_id = @sessionId');
    params['sessionId'] = query.sessionId;
  }
  const rows = db
    .prepare(
      `SELECT * FROM notes WHERE ${clauses.join(' AND ')}
        ORDER BY created_at DESC, id LIMIT @limit OFFSET @offset`,
    )
    .all(params) as Row[];
  return rows.map(present);
}

export function countNotes(db: DatabaseType, projectId?: string): number {
  return projectId === undefined
    ? (db.prepare('SELECT COUNT(*) AS n FROM notes').get() as { n: number }).n
    : (
        db.prepare('SELECT COUNT(*) AS n FROM notes WHERE project_id = ?').get(projectId) as {
          n: number;
        }
      ).n;
}

export function updateNote(
  db: DatabaseType,
  projectId: string,
  id: string,
  input: unknown,
  now = nowIso,
): Note {
  const parsed = updateInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);
  getNoteInProject(db, projectId, id);
  db.prepare('UPDATE notes SET body = ?, updated_at = ? WHERE id = ?').run(
    parsed.data.body,
    now(),
    id,
  );
  return getNote(db, id);
}

export function archiveNote(db: DatabaseType, projectId: string, id: string, now = nowIso): Note {
  const existing = getNoteInProject(db, projectId, id);
  if (existing.archivedAt !== null) return existing;
  const at = now();
  db.prepare('UPDATE notes SET archived_at = ?, updated_at = ? WHERE id = ?').run(at, at, id);
  return getNote(db, id);
}

export function restoreNote(db: DatabaseType, projectId: string, id: string, now = nowIso): Note {
  const existing = getNoteInProject(db, projectId, id);
  if (existing.archivedAt === null) return existing;
  db.prepare('UPDATE notes SET archived_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
  return getNote(db, id);
}
