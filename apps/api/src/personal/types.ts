/**
 * Shared shapes, limits and errors for the private personal store.
 *
 * Limits exist so one mis-paste cannot fill a disk, and so a record stays
 * something a person wrote rather than something a process dumped. They are
 * checked here, once, rather than at each call site.
 */
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/** Bad input from a caller. Maps to HTTP 400. */
export class PersonalValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(issues.join('; '));
    this.name = 'PersonalValidationError';
    this.issues = issues;
  }
}

/** The named record does not exist, or belongs to a different project. */
export class PersonalNotFoundError extends Error {
  readonly what: string;
  readonly id: string;
  constructor(what: string, id: string) {
    super(`no ${what} with id ${id}`);
    this.name = 'PersonalNotFoundError';
    this.what = what;
    this.id = id;
  }
}

/* -------------------------------------------------------------------------- */
/* Limits                                                                      */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  projectTitle: 200,
  projectDescription: 8_000,
  sessionTitle: 200,
  sessionQuestion: 4_000,
  sessionContext: 8_000,
  /** 64 KiB, per the contract. A note is prose, not a file. */
  noteBody: 65_536,
  familiarityNote: 1_000,
  savedLabel: 300,
  /** A saved assistant answer with citations, comfortably. */
  savedPayload: 262_144,
  artifactLabel: 300,
} as const;

/* -------------------------------------------------------------------------- */
/* Shared field schemas                                                        */
/* -------------------------------------------------------------------------- */

export const uuid = z.string().uuid('must be a UUID');

export function boundedText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} must not be empty`)
    .max(max, `${label} must be at most ${String(max)} characters`);
}

export function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be at most ${String(max)} characters`)
    .optional();
}

/* -------------------------------------------------------------------------- */
/* Record shapes                                                               */
/* -------------------------------------------------------------------------- */

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ResearchSession {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly startingQuestion: string | null;
  readonly contextSummary: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface Note {
  readonly id: string;
  readonly projectId: string;
  readonly sessionId: string | null;
  readonly conceptId: string | null;
  readonly savedItemId: string | null;
  readonly artifactId: string | null;
  /** Markdown source. Never rendered HTML, here or anywhere. */
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export const familiarityLevels = ['unfamiliar', 'recognize', 'working', 'strong'] as const;
export type FamiliarityLevel = (typeof familiarityLevels)[number];

/** What each level licenses, shown wherever a level is set. */
export const FAMILIARITY_MEANING: Readonly<Record<FamiliarityLevel, string>> = {
  unfamiliar: 'Do not assume this concept is known.',
  recognize: 'The name is familiar, but prerequisites may still be needed.',
  working: 'Explanations may skip basic orientation unless it is asked for.',
  strong: 'Path construction may treat this concept as already known.',
};

export interface Familiarity {
  readonly conceptId: string;
  readonly level: FamiliarityLevel;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const savedItemTypes = [
  'concept',
  'source',
  'assistant-answer',
  'comparison',
  'path',
  'next-check',
] as const;
export type SavedItemType = (typeof savedItemTypes)[number];

export interface SavedItem {
  readonly id: string;
  readonly projectId: string;
  readonly sessionId: string | null;
  readonly itemType: SavedItemType;
  /** Stable identity used to deduplicate inside a project. */
  readonly itemKey: string;
  readonly label: string;
  readonly payloadVersion: number;
  readonly payload: unknown;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface Artifact {
  readonly id: string;
  readonly projectId: string;
  readonly label: string;
  readonly originalName: string;
  readonly mediaType: string;
  readonly byteCount: number;
  readonly characterCount: number;
  readonly sha256: string;
  readonly warnings: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ArtifactWithText extends Artifact {
  readonly extractedText: string;
}

/* -------------------------------------------------------------------------- */
/* Listing                                                                     */
/* -------------------------------------------------------------------------- */

export interface ListOptions {
  /** Archived records are excluded unless this is true. */
  readonly includeArchived?: boolean | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

export const MAX_PERSONAL_PAGE = 200;

export function pageBounds(options: ListOptions): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(options.limit ?? MAX_PERSONAL_PAGE, 1), MAX_PERSONAL_PAGE),
    offset: Math.max(options.offset ?? 0, 0),
  };
}

/** Turn a Zod failure into the one validation error shape this module throws. */
export function fail(result: z.ZodError): never {
  throw new PersonalValidationError(
    result.issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.map(String).join('.')}: ${issue.message}`
        : issue.message,
    ),
  );
}
