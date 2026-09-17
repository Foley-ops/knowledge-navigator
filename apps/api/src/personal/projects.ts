/**
 * Projects (v2 runbook N02).
 *
 * A project groups private research activity. Nothing is ever hard-deleted:
 * archiving hides a project from the default listing and is reversible, because
 * a research note has no other copy anywhere.
 */
import { z } from 'zod';
import type { Database as DatabaseType } from 'better-sqlite3';
import { newId, nowIso } from './db.js';
import {
  LIMITS,
  PersonalNotFoundError,
  boundedText,
  fail,
  optionalText,
  pageBounds,
} from './types.js';
import type { ListOptions, Project } from './types.js';

interface Row {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function present(row: Row): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

const createInput = z.strictObject({
  title: boundedText('title', LIMITS.projectTitle),
  description: optionalText('description', LIMITS.projectDescription),
});
export type CreateProjectInput = z.input<typeof createInput>;

const updateInput = z
  .strictObject({
    title: boundedText('title', LIMITS.projectTitle).optional(),
    description: optionalText('description', LIMITS.projectDescription),
  })
  .refine(
    (value) => value.title !== undefined || value.description !== undefined,
    'give at least one field to change',
  );
export type UpdateProjectInput = z.input<typeof updateInput>;

export function createProject(db: DatabaseType, input: unknown, now = nowIso): Project {
  const parsed = createInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);
  const at = now();
  const id = newId();
  db.prepare(
    `INSERT INTO projects (id, title, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, parsed.data.title, parsed.data.description ?? '', at, at);
  return getProject(db, id);
}

/** Fetch one project. Throws when it does not exist. */
export function getProject(db: DatabaseType, id: string): Project {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row | undefined;
  if (row === undefined) throw new PersonalNotFoundError('project', id);
  return present(row);
}

/** Fetch one project, or undefined. */
export function findProject(db: DatabaseType, id: string): Project | undefined {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row | undefined;
  return row === undefined ? undefined : present(row);
}

/** Most recently touched first. Archived projects are excluded by default. */
export function listProjects(db: DatabaseType, options: ListOptions = {}): Project[] {
  const { limit, offset } = pageBounds(options);
  const where = options.includeArchived === true ? '' : 'WHERE archived_at IS NULL';
  const rows = db
    .prepare(`SELECT * FROM projects ${where} ORDER BY updated_at DESC, id LIMIT ? OFFSET ?`)
    .all(limit, offset) as Row[];
  return rows.map(present);
}

export function countProjects(db: DatabaseType, options: ListOptions = {}): number {
  const where = options.includeArchived === true ? '' : 'WHERE archived_at IS NULL';
  return (db.prepare(`SELECT COUNT(*) AS n FROM projects ${where}`).get() as { n: number }).n;
}

export function updateProject(db: DatabaseType, id: string, input: unknown, now = nowIso): Project {
  const parsed = updateInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);
  const existing = getProject(db, id);
  db.prepare('UPDATE projects SET title = ?, description = ?, updated_at = ? WHERE id = ?').run(
    parsed.data.title ?? existing.title,
    parsed.data.description ?? existing.description,
    now(),
    id,
  );
  return getProject(db, id);
}

/** Hide a project from the default listing. Reversible; nothing is deleted. */
export function archiveProject(db: DatabaseType, id: string, now = nowIso): Project {
  const existing = getProject(db, id);
  if (existing.archivedAt !== null) return existing;
  const at = now();
  db.prepare('UPDATE projects SET archived_at = ?, updated_at = ? WHERE id = ?').run(at, at, id);
  return getProject(db, id);
}

export function restoreProject(db: DatabaseType, id: string, now = nowIso): Project {
  const existing = getProject(db, id);
  if (existing.archivedAt === null) return existing;
  db.prepare('UPDATE projects SET archived_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
  return getProject(db, id);
}

/** Counts of what a project holds, for the project overview. */
export interface ProjectContents {
  readonly sessions: number;
  readonly notes: number;
  readonly savedItems: number;
  readonly artifacts: number;
}

export function projectContents(db: DatabaseType, id: string): ProjectContents {
  getProject(db, id);
  const count = (table: string): number =>
    (
      db
        .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE project_id = ? AND archived_at IS NULL`)
        .get(id) as { n: number }
    ).n;
  return {
    sessions: count('research_sessions'),
    notes: count('notes'),
    savedItems: count('saved_items'),
    artifacts: count('artifacts'),
  };
}
