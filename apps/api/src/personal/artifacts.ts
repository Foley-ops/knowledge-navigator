/**
 * Artifact records (v2 runbook P01, contract §4.9).
 *
 * An artifact is the *extracted text* of a local file, plus enough metadata to
 * recognise it again: the original file name, its media type, its size, its
 * SHA-256 and any warnings raised while reading it. The original bytes are
 * never retained — there is no column for them and no code path that would
 * write one.
 *
 * The same file uploaded twice into one project is one artifact, matched on the
 * hash of the original bytes. Archiving hides one; nothing deletes it.
 */
import { z } from 'zod';
import type { Database as DatabaseType } from 'better-sqlite3';
import { newId, nowIso } from './db.js';
import { getProject } from './projects.js';
import { LIMITS, PersonalNotFoundError, boundedText, fail, pageBounds } from './types.js';
import type { Artifact, ArtifactWithText, ListOptions } from './types.js';

interface Row {
  id: string;
  project_id: string;
  label: string;
  original_name: string;
  media_type: string;
  byte_count: number;
  character_count: number;
  sha256: string;
  warnings: string;
  extracted_text: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function present(row: Row): Artifact {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    originalName: row.original_name,
    mediaType: row.media_type,
    byteCount: row.byte_count,
    characterCount: row.character_count,
    sha256: row.sha256,
    warnings: JSON.parse(row.warnings) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function presentWithText(row: Row): ArtifactWithText {
  return { ...present(row), extractedText: row.extracted_text };
}

const createInput = z.strictObject({
  label: boundedText('label', LIMITS.artifactLabel),
  originalName: boundedText('originalName', 400),
  mediaType: boundedText('mediaType', 100),
  byteCount: z.number().int().min(0),
  characterCount: z.number().int().min(0),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, 'sha256 must be a hex digest'),
  warnings: z.array(z.string().max(500)).max(50).default([]),
  extractedText: z.string().min(1, 'extractedText must not be empty'),
});

export interface CreateArtifactResult {
  readonly artifact: Artifact;
  /** True when an existing artifact with the same bytes was returned. */
  readonly deduplicated: boolean;
}

export function createArtifact(
  db: DatabaseType,
  projectId: string,
  input: unknown,
  now = nowIso,
): CreateArtifactResult {
  getProject(db, projectId);
  const parsed = createInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);

  const existing = db
    .prepare('SELECT * FROM artifacts WHERE project_id = ? AND sha256 = ?')
    .get(projectId, parsed.data.sha256) as Row | undefined;
  if (existing !== undefined) {
    // The same bytes are the same artifact. Un-archive it: the researcher has
    // just uploaded it again, which is a clear statement that they want it.
    if (existing.archived_at !== null) {
      db.prepare('UPDATE artifacts SET archived_at = NULL, updated_at = ? WHERE id = ?').run(
        now(),
        existing.id,
      );
    }
    return { artifact: getArtifact(db, existing.id), deduplicated: true };
  }

  const at = now();
  const id = newId();
  db.prepare(
    `INSERT INTO artifacts
       (id, project_id, label, original_name, media_type, byte_count, character_count,
        sha256, warnings, extracted_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    projectId,
    parsed.data.label,
    parsed.data.originalName,
    parsed.data.mediaType,
    parsed.data.byteCount,
    parsed.data.characterCount,
    parsed.data.sha256,
    JSON.stringify(parsed.data.warnings),
    parsed.data.extractedText,
    at,
    at,
  );
  return { artifact: getArtifact(db, id), deduplicated: false };
}

/** Metadata only. The extracted text is fetched deliberately, never in a list. */
export function getArtifact(db: DatabaseType, id: string): Artifact {
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as Row | undefined;
  if (row === undefined) throw new PersonalNotFoundError('artifact', id);
  return present(row);
}

export function getArtifactInProject(
  db: DatabaseType,
  projectId: string,
  id: string,
): ArtifactWithText {
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as Row | undefined;
  if (row === undefined || row.project_id !== projectId) {
    throw new PersonalNotFoundError('artifact', id);
  }
  return presentWithText(row);
}

export function listArtifacts(
  db: DatabaseType,
  projectId: string,
  options: ListOptions = {},
): Artifact[] {
  const { limit, offset } = pageBounds(options);
  const archived = options.includeArchived === true ? '' : 'AND archived_at IS NULL';
  const rows = db
    .prepare(
      `SELECT * FROM artifacts WHERE project_id = ? ${archived}
        ORDER BY created_at DESC, id LIMIT ? OFFSET ?`,
    )
    .all(projectId, limit, offset) as Row[];
  return rows.map(present);
}

export function countArtifacts(db: DatabaseType, projectId?: string): number {
  return projectId === undefined
    ? (db.prepare('SELECT COUNT(*) AS n FROM artifacts').get() as { n: number }).n
    : (
        db.prepare('SELECT COUNT(*) AS n FROM artifacts WHERE project_id = ?').get(projectId) as {
          n: number;
        }
      ).n;
}

export function archiveArtifact(
  db: DatabaseType,
  projectId: string,
  id: string,
  now = nowIso,
): Artifact {
  const existing = getArtifactInProject(db, projectId, id);
  if (existing.archivedAt !== null) return existing;
  const at = now();
  db.prepare('UPDATE artifacts SET archived_at = ?, updated_at = ? WHERE id = ?').run(at, at, id);
  return getArtifact(db, id);
}

export function restoreArtifact(
  db: DatabaseType,
  projectId: string,
  id: string,
  now = nowIso,
): Artifact {
  const existing = getArtifactInProject(db, projectId, id);
  if (existing.archivedAt === null) return existing;
  db.prepare('UPDATE artifacts SET archived_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
  return getArtifact(db, id);
}

/**
 * Fetch several artifacts of one project, for the assistant.
 *
 * Only ids the caller named are returned, and only from this project. An id
 * that names nothing, or something in another project, is simply absent from
 * the result — the caller reports what it actually got rather than silently
 * substituting something else.
 */
export function selectArtifactsForContext(
  db: DatabaseType,
  projectId: string,
  ids: readonly string[],
): ArtifactWithText[] {
  const out: ArtifactWithText[] = [];
  for (const id of ids) {
    const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as Row | undefined;
    if (row === undefined || row.project_id !== projectId || row.archived_at !== null) continue;
    out.push(presentWithText(row));
  }
  return out;
}
