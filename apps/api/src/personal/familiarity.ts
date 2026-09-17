/**
 * Concept familiarity (v2 runbook N05, contract §4.6).
 *
 * The researcher says what they know. Nothing infers it: visiting a page, or
 * asking about a concept, changes nothing here. The model may *suggest* a
 * change — there is no code path by which it can make one, because the only
 * writer is an explicit request from the person.
 *
 * At most one record per canonical concept, and clearing it is one action.
 */
import { z } from 'zod';
import type { Database as DatabaseType } from 'better-sqlite3';
import { DOTTED_ID } from '@navigator/core';
import { nowIso } from './db.js';
import { LIMITS, familiarityLevels, fail } from './types.js';
import type { Familiarity, FamiliarityLevel } from './types.js';

interface Row {
  concept_id: string;
  level: FamiliarityLevel;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function present(row: Row): Familiarity {
  return {
    conceptId: row.concept_id,
    level: row.level,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const setInput = z.strictObject({
  level: z.enum(familiarityLevels),
  note: z
    .string()
    .trim()
    .max(
      LIMITS.familiarityNote,
      `note must be at most ${String(LIMITS.familiarityNote)} characters`,
    )
    .optional(),
});

const conceptIdSchema = z
  .string()
  .regex(DOTTED_ID, 'conceptId must be a lowercase dotted identifier');

/**
 * Set or replace the familiarity record for one concept.
 *
 * `knownConceptIds`, when given, is the set of canonical ids in the compiled
 * index: a level on a concept that does not exist would quietly distort every
 * path built afterwards, so it is refused.
 */
export function setFamiliarity(
  db: DatabaseType,
  conceptId: string,
  input: unknown,
  options: { knownConceptIds?: ReadonlySet<string> | undefined; now?: () => string } = {},
): Familiarity {
  const id = conceptIdSchema.safeParse(conceptId);
  if (!id.success) fail(id.error);
  if (options.knownConceptIds !== undefined && !options.knownConceptIds.has(id.data)) {
    fail(
      new z.ZodError([
        {
          code: 'custom',
          path: ['conceptId'],
          message: `${id.data} is not a concept in this corpus`,
        },
      ]),
    );
  }
  const parsed = setInput.safeParse(input);
  if (!parsed.success) fail(parsed.error);

  const now = options.now ?? nowIso;
  const at = now();
  const note = parsed.data.note === undefined || parsed.data.note === '' ? null : parsed.data.note;

  db.prepare(
    `INSERT INTO concept_familiarity (concept_id, level, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(concept_id) DO UPDATE SET level = excluded.level,
                                           note = excluded.note,
                                           updated_at = excluded.updated_at`,
  ).run(id.data, parsed.data.level, note, at, at);

  const found = getFamiliarity(db, id.data);
  if (found === undefined) throw new Error('familiarity was written but could not be read back');
  return found;
}

export function getFamiliarity(db: DatabaseType, conceptId: string): Familiarity | undefined {
  const row = db
    .prepare('SELECT * FROM concept_familiarity WHERE concept_id = ?')
    .get(conceptId) as Row | undefined;
  return row === undefined ? undefined : present(row);
}

/** Remove the record entirely, so the concept has no level at all. */
export function clearFamiliarity(db: DatabaseType, conceptId: string): boolean {
  const info = db.prepare('DELETE FROM concept_familiarity WHERE concept_id = ?').run(conceptId);
  return info.changes > 0;
}

export function listFamiliarity(
  db: DatabaseType,
  level?: FamiliarityLevel | undefined,
): Familiarity[] {
  const rows =
    level === undefined
      ? (db.prepare('SELECT * FROM concept_familiarity ORDER BY concept_id').all() as Row[])
      : (db
          .prepare('SELECT * FROM concept_familiarity WHERE level = ? ORDER BY concept_id')
          .all(level) as Row[]);
  return rows.map(present);
}

/** Concept id → level, for path building. */
export function familiarityMap(db: DatabaseType): Map<string, FamiliarityLevel> {
  return new Map(listFamiliarity(db).map((record) => [record.conceptId, record.level]));
}

export function countFamiliarity(db: DatabaseType): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM concept_familiarity').get() as { n: number }).n;
}
