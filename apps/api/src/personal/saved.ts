/**
 * Saved items (v2 runbook N06).
 *
 * Saving is always an explicit action. Opening a concept, running a search or
 * asking a question saves nothing — the product keeps what the researcher chose
 * to keep, and nothing else.
 *
 * Each item type has its own payload schema, validated on the way in, so a
 * saved assistant answer cannot silently carry a canonical id that was never in
 * the answer. Payloads are versioned: a later build can migrate them rather than
 * guessing what an old shape meant.
 */
import { z } from 'zod';
import type { Database as DatabaseType } from 'better-sqlite3';
import { DOTTED_ID } from '@navigator/core';
import { newId, nowIso } from './db.js';
import { getProject } from './projects.js';
import { getSessionInProject } from './sessions.js';
import {
  LIMITS,
  PersonalNotFoundError,
  PersonalValidationError,
  boundedText,
  fail,
  pageBounds,
  savedItemTypes,
  uuid,
} from './types.js';
import type { ListOptions, SavedItem, SavedItemType } from './types.js';

/** Bumped when a payload shape changes in a way a reader must notice. */
export const SAVED_PAYLOAD_VERSION = 1;

interface Row {
  id: string;
  project_id: string;
  session_id: string | null;
  item_type: SavedItemType;
  item_key: string;
  label: string;
  payload_version: number;
  payload: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function present(row: Row): SavedItem {
  return {
    id: row.id,
    projectId: row.project_id,
    sessionId: row.session_id,
    itemType: row.item_type,
    itemKey: row.item_key,
    label: row.label,
    payloadVersion: row.payload_version,
    payload: JSON.parse(row.payload) as unknown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Payload schemas, one per item type                                          */
/* -------------------------------------------------------------------------- */

const conceptId = z.string().regex(DOTTED_ID, 'must be a lowercase dotted identifier');
const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'must be http(s)');

const conceptPayload = z.strictObject({
  conceptId,
  title: boundedText('title', 200),
  slug: z.string().min(1).max(200),
  reviewState: z.string().min(1).max(50),
  summary: z.string().max(2_000).optional(),
});

const sourcePayload = z.strictObject({
  sourceId: z.string().regex(DOTTED_ID, 'must be a lowercase dotted identifier'),
  title: boundedText('title', 400),
  url: httpUrl,
  sourceKind: z.string().min(1).max(60),
  citedBy: z.array(conceptId).max(50).default([]),
  locator: z.string().max(200).optional(),
});

const citation = z.strictObject({
  kind: z.enum(['concept', 'source']),
  id: z.string().min(1).max(200),
  label: z.string().min(1).max(400),
  slug: z.string().max(200).nullable().optional(),
  url: z.string().max(2_000).nullable().optional(),
});

const assistantAnswerPayload = z.strictObject({
  question: z.string().min(1).max(8_000),
  /** Saved only when the researcher also chose to keep the context summary. */
  contextSummary: z.string().max(8_000).optional(),
  mode: z.string().min(1).max(40),
  depth: z.string().min(1).max(40),
  provider: z.string().min(1).max(40),
  model: z.string().max(200).nullable(),
  answeredAt: z.string().min(1).max(40),
  /** Artifacts the researcher selected for this request, by id. */
  artifactIds: z.array(uuid).max(5).default([]),
  noteIds: z.array(uuid).max(5).default([]),
  citations: z.array(citation).max(50).default([]),
  /** The exact structured result the API returned. */
  result: z.record(z.string(), z.unknown()),
});

const comparisonPayload = z.strictObject({
  conceptIds: z.array(conceptId).min(2, 'a comparison needs at least two concepts').max(4),
  rows: z.array(z.record(z.string(), z.unknown())).max(200).default([]),
  builtAt: z.string().min(1).max(40),
  synthesis: z.record(z.string(), z.unknown()).nullable().optional(),
});

const pathPayload = z.strictObject({
  targetConceptId: conceptId,
  knownConceptIds: z.array(conceptId).max(200).default([]),
  steps: z.array(z.record(z.string(), z.unknown())).max(200).default([]),
  reachable: z.boolean(),
  builtAt: z.string().min(1).max(40),
});

const nextCheckPayload = z.strictObject({
  statement: boundedText('statement', 2_000),
  rationale: z.string().max(4_000).optional(),
  conceptIds: z.array(conceptId).max(20).default([]),
  done: z.boolean().default(false),
});

const PAYLOADS: Record<SavedItemType, z.ZodType> = {
  concept: conceptPayload,
  source: sourcePayload,
  'assistant-answer': assistantAnswerPayload,
  comparison: comparisonPayload,
  path: pathPayload,
  'next-check': nextCheckPayload,
};

/**
 * The stable identity of a saved thing inside a project.
 *
 * Saving the same concept twice is one item, not two. An assistant answer, a
 * comparison and a path are each a distinct event, so their key is their own id.
 */
function deriveKey(type: SavedItemType, payload: unknown, id: string): string {
  const record = payload as Record<string, unknown>;
  switch (type) {
    case 'concept':
      return String(record['conceptId']);
    case 'source':
      return String(record['sourceId']);
    case 'comparison':
      return `compare:${(record['conceptIds'] as string[]).join('|')}`;
    case 'path':
      return `path:${String(record['targetConceptId'])}:${(record['knownConceptIds'] as string[]).join('|')}`;
    case 'assistant-answer':
    case 'next-check':
      return id;
  }
}

const saveInput = z.strictObject({
  itemType: z.enum(savedItemTypes),
  label: boundedText('label', LIMITS.savedLabel),
  sessionId: uuid.optional(),
  payload: z.unknown(),
});

export interface SaveResult {
  readonly item: SavedItem;
  /** True when an existing item was returned instead of a new one. */
  readonly deduplicated: boolean;
}

export function saveItem(
  db: DatabaseType,
  projectId: string,
  input: unknown,
  now = nowIso,
): SaveResult {
  getProject(db, projectId);
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);

  const schema = PAYLOADS[parsed.data.itemType];
  const payload = schema.safeParse(parsed.data.payload);
  if (!payload.success) fail(payload.error);

  const serialized = JSON.stringify(payload.data);
  if (serialized.length > LIMITS.savedPayload) {
    throw new PersonalValidationError([
      `payload must be at most ${String(LIMITS.savedPayload)} bytes once serialised`,
    ]);
  }

  const sessionId =
    parsed.data.sessionId === undefined
      ? null
      : getSessionInProject(db, projectId, parsed.data.sessionId).id;

  const id = newId();
  const key = deriveKey(parsed.data.itemType, payload.data, id);

  const existing = db
    .prepare('SELECT * FROM saved_items WHERE project_id = ? AND item_type = ? AND item_key = ?')
    .get(projectId, parsed.data.itemType, key) as Row | undefined;
  if (existing !== undefined) {
    // Saving the same thing twice is idempotent. Un-archive it, because the
    // researcher has just asked for it again.
    if (existing.archived_at !== null) {
      db.prepare('UPDATE saved_items SET archived_at = NULL, updated_at = ? WHERE id = ?').run(
        now(),
        existing.id,
      );
    }
    return { item: getSavedItem(db, existing.id), deduplicated: true };
  }

  const at = now();
  db.prepare(
    `INSERT INTO saved_items
       (id, project_id, session_id, item_type, item_key, label, payload_version, payload, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    projectId,
    sessionId,
    parsed.data.itemType,
    key,
    parsed.data.label,
    SAVED_PAYLOAD_VERSION,
    serialized,
    at,
    at,
  );
  return { item: getSavedItem(db, id), deduplicated: false };
}

export function getSavedItem(db: DatabaseType, id: string): SavedItem {
  const row = db.prepare('SELECT * FROM saved_items WHERE id = ?').get(id) as Row | undefined;
  if (row === undefined) throw new PersonalNotFoundError('saved item', id);
  return present(row);
}

export function getSavedItemInProject(db: DatabaseType, projectId: string, id: string): SavedItem {
  const item = getSavedItem(db, id);
  if (item.projectId !== projectId) throw new PersonalNotFoundError('saved item', id);
  return item;
}

export interface SavedQuery extends ListOptions {
  readonly itemType?: SavedItemType | undefined;
  readonly sessionId?: string | undefined;
}

export function listSavedItems(
  db: DatabaseType,
  projectId: string,
  query: SavedQuery = {},
): SavedItem[] {
  const { limit, offset } = pageBounds(query);
  const clauses = ['project_id = @projectId'];
  const params: Record<string, string | number> = { projectId, limit, offset };
  if (query.includeArchived !== true) clauses.push('archived_at IS NULL');
  if (query.itemType !== undefined) {
    clauses.push('item_type = @itemType');
    params['itemType'] = query.itemType;
  }
  if (query.sessionId !== undefined) {
    clauses.push('session_id = @sessionId');
    params['sessionId'] = query.sessionId;
  }
  const rows = db
    .prepare(
      `SELECT * FROM saved_items WHERE ${clauses.join(' AND ')}
        ORDER BY created_at DESC, id LIMIT @limit OFFSET @offset`,
    )
    .all(params) as Row[];
  return rows.map(present);
}

export function countSavedItems(db: DatabaseType, projectId?: string): number {
  return projectId === undefined
    ? (db.prepare('SELECT COUNT(*) AS n FROM saved_items').get() as { n: number }).n
    : (
        db.prepare('SELECT COUNT(*) AS n FROM saved_items WHERE project_id = ?').get(projectId) as {
          n: number;
        }
      ).n;
}

export function archiveSavedItem(
  db: DatabaseType,
  projectId: string,
  id: string,
  now = nowIso,
): SavedItem {
  const existing = getSavedItemInProject(db, projectId, id);
  if (existing.archivedAt !== null) return existing;
  const at = now();
  db.prepare('UPDATE saved_items SET archived_at = ?, updated_at = ? WHERE id = ?').run(at, at, id);
  return getSavedItem(db, id);
}

export function restoreSavedItem(
  db: DatabaseType,
  projectId: string,
  id: string,
  now = nowIso,
): SavedItem {
  const existing = getSavedItemInProject(db, projectId, id);
  if (existing.archivedAt === null) return existing;
  db.prepare('UPDATE saved_items SET archived_at = NULL, updated_at = ? WHERE id = ?').run(
    now(),
    id,
  );
  return getSavedItem(db, id);
}
