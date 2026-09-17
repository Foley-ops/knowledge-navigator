/**
 * Research sessions (v2 runbook N03).
 *
 * A session preserves a research journey the researcher chose to keep. It is
 * created by an explicit action and never by asking a question — this product
 * keeps selected work, not a history of everything that was ever typed.
 */
import { z } from 'zod';
import type { Database as DatabaseType } from 'better-sqlite3';
import { newId, nowIso } from './db.js';
import { getProject } from './projects.js';
import {
  LIMITS,
  PersonalNotFoundError,
  boundedText,
  fail,
  optionalText,
  pageBounds,
} from './types.js';
import type { ListOptions, ResearchSession } from './types.js';

interface Row {
  id: string;
  project_id: string;
  title: string;
  starting_question: string | null;
  context_summary: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function present(row: Row): ResearchSession {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    startingQuestion: row.starting_question,
    contextSummary: row.context_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

const createInput = z.strictObject({
  title: boundedText('title', LIMITS.sessionTitle),
  startingQuestion: optionalText('startingQuestion', LIMITS.sessionQuestion),
  contextSummary: optionalText('contextSummary', LIMITS.sessionContext),
});

const updateInput = z
  .strictObject({
    title: boundedText('title', LIMITS.sessionTitle).optional(),
    startingQuestion: optionalText('startingQuestion', LIMITS.sessionQuestion),
    contextSummary: optionalText('contextSummary', LIMITS.sessionContext),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.startingQuestion !== undefined ||
      value.contextSummary !== undefined,
    'give at least one field to change',
  );

function emptyToNull(value: string | undefined): string | null {
  return value === undefined || value === '' ? null : value;
}

export function createSession(
  db: DatabaseType,
  projectId: string,
  input: unknown,
  now = nowIso,
): ResearchSession {
  getProject(db, projectId);
  const parsed = createInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);
  const at = now();
  const id = newId();
  db.prepare(
    `INSERT INTO research_sessions
       (id, project_id, title, starting_question, context_summary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    projectId,
    parsed.data.title,
    emptyToNull(parsed.data.startingQuestion),
    emptyToNull(parsed.data.contextSummary),
    at,
    at,
  );
  return getSession(db, id);
}

export function getSession(db: DatabaseType, id: string): ResearchSession {
  const row = db.prepare('SELECT * FROM research_sessions WHERE id = ?').get(id) as Row | undefined;
  if (row === undefined) throw new PersonalNotFoundError('session', id);
  return present(row);
}

/**
 * Fetch a session and confirm it belongs to the given project.
 *
 * Every route that takes both ids goes through this, so a session id from one
 * project can never be read or written through another project's URL.
 */
export function getSessionInProject(
  db: DatabaseType,
  projectId: string,
  id: string,
): ResearchSession {
  const session = getSession(db, id);
  if (session.projectId !== projectId) throw new PersonalNotFoundError('session', id);
  return session;
}

export function listSessions(
  db: DatabaseType,
  projectId: string,
  options: ListOptions = {},
): ResearchSession[] {
  const { limit, offset } = pageBounds(options);
  const archived = options.includeArchived === true ? '' : 'AND archived_at IS NULL';
  const rows = db
    .prepare(
      `SELECT * FROM research_sessions
        WHERE project_id = ? ${archived}
        ORDER BY updated_at DESC, id
        LIMIT ? OFFSET ?`,
    )
    .all(projectId, limit, offset) as Row[];
  return rows.map(present);
}

export function countSessions(db: DatabaseType, projectId?: string): number {
  return projectId === undefined
    ? (db.prepare('SELECT COUNT(*) AS n FROM research_sessions').get() as { n: number }).n
    : (
        db
          .prepare('SELECT COUNT(*) AS n FROM research_sessions WHERE project_id = ?')
          .get(projectId) as { n: number }
      ).n;
}

export function updateSession(
  db: DatabaseType,
  projectId: string,
  id: string,
  input: unknown,
  now = nowIso,
): ResearchSession {
  const parsed = updateInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);
  const existing = getSessionInProject(db, projectId, id);
  db.prepare(
    `UPDATE research_sessions
        SET title = ?, starting_question = ?, context_summary = ?, updated_at = ?
      WHERE id = ?`,
  ).run(
    parsed.data.title ?? existing.title,
    parsed.data.startingQuestion === undefined
      ? existing.startingQuestion
      : emptyToNull(parsed.data.startingQuestion),
    parsed.data.contextSummary === undefined
      ? existing.contextSummary
      : emptyToNull(parsed.data.contextSummary),
    now(),
    id,
  );
  return getSession(db, id);
}

export function archiveSession(
  db: DatabaseType,
  projectId: string,
  id: string,
  now = nowIso,
): ResearchSession {
  const existing = getSessionInProject(db, projectId, id);
  if (existing.archivedAt !== null) return existing;
  const at = now();
  db.prepare('UPDATE research_sessions SET archived_at = ?, updated_at = ? WHERE id = ?').run(
    at,
    at,
    id,
  );
  return getSession(db, id);
}

export function restoreSession(
  db: DatabaseType,
  projectId: string,
  id: string,
  now = nowIso,
): ResearchSession {
  const existing = getSessionInProject(db, projectId, id);
  if (existing.archivedAt === null) return existing;
  db.prepare('UPDATE research_sessions SET archived_at = NULL, updated_at = ? WHERE id = ?').run(
    now(),
    id,
  );
  return getSession(db, id);
}
