/**
 * The proposal bundle (v2 runbook §4.10, R00).
 *
 * A proposal is how work by an agent becomes reviewable *before* it can touch
 * canonical knowledge. It is a directory on disk — never a database row, never
 * a branch — holding the brief that was given, the result that came back, the
 * patch it produced, and the verdict of validation:
 *
 *     .navigator/proposals/<proposal-id>/
 *       manifest.json     what was asked for, against which commit, and where it is
 *       REQUEST.md        the complete brief handed to the agent
 *       RESULT.md         what the agent reported back
 *       changes.patch     the change itself, applied by nobody yet
 *       validation.json   what checking it found
 *
 * Two properties are defended here and nowhere else.
 *
 * The first is that a proposal cannot name a path outside the content it is
 * allowed to touch. Absolute paths, parent traversal, Windows separators and
 * paths outside `content/` are rejected at the schema, so a drifting or hostile
 * agent cannot reach the API, the workflow files or a private database by
 * describing a file rather than by writing one.
 *
 * The second is that status only moves forwards through states a human would
 * recognise. A proposal cannot go back to `prepared` after it was reviewed, and
 * an accepted or rejected one is final except by being superseded.
 */
import { execFileSync } from 'node:child_process';
import { z } from 'zod';

/** Every file a complete bundle holds. */
export const PROPOSAL_FILES = {
  manifest: 'manifest.json',
  request: 'REQUEST.md',
  result: 'RESULT.md',
  patch: 'changes.patch',
  validation: 'validation.json',
} as const;

export const proposalStatuses = [
  /** Prepared locally. Nothing has run and nothing has been dispatched. */
  'prepared',
  /** Handed to an agent. The result is not back yet. */
  'running',
  /** A result is in the bundle and is waiting for a person. */
  'review',
  /** A person applied it to a branch. */
  'accepted',
  /** A person refused it, with a reason. */
  'rejected',
  /** Replaced by a later proposal for the same target. */
  'superseded',
] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

/**
 * Allowed status moves.
 *
 * Nothing returns to `prepared`: a proposal that has been dispatched or
 * reviewed has a history, and pretending otherwise would let a second dispatch
 * look like a first. `accepted` and `rejected` are terminal except for being
 * superseded, which is how a later proposal for the same target retires them.
 */
export const PROPOSAL_TRANSITIONS: Readonly<Record<ProposalStatus, readonly ProposalStatus[]>> = {
  prepared: ['running', 'review', 'rejected', 'superseded'],
  running: ['review', 'rejected', 'superseded'],
  review: ['accepted', 'rejected', 'superseded'],
  accepted: ['superseded'],
  rejected: ['superseded'],
  superseded: [],
};

export function canTransition(from: ProposalStatus, to: ProposalStatus): boolean {
  return (PROPOSAL_TRANSITIONS[from] as readonly string[]).includes(to);
}

export class ProposalError extends Error {
  readonly detail: readonly string[];
  constructor(message: string, detail: readonly string[] = []) {
    super(message);
    this.name = 'ProposalError';
    this.detail = detail;
  }
}

/** Refuse a move the contract does not allow, saying what was allowed. */
export function assertTransition(from: ProposalStatus, to: ProposalStatus): void {
  if (!canTransition(from, to)) {
    const allowed = PROPOSAL_TRANSITIONS[from];
    throw new ProposalError(
      `a proposal cannot move from ${from} to ${to}`,
      allowed.length === 0
        ? [`${from} is final`]
        : [`from ${from} the only moves are ${allowed.join(', ')}`],
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Paths                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The only places a content proposal may write.
 *
 * A Tier 2 stub is a Markdown page; a Tier 3 identity is a YAML file. Nothing
 * else is a content change, so nothing else is allowed — not the atlas, which
 * is editorial structure a person curates, and not a single file of source.
 */
export const ALLOWED_PATH_PATTERNS: readonly RegExp[] = [
  /^content\/concepts\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/,
  /^content\/graph-only\/[a-z0-9]+(?:-[a-z0-9]+)*\.yaml$/,
];

/** True for any character a path has no business containing. */
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function pathProblem(value: string): string | undefined {
  if (value === '') return 'must not be empty';
  if (value.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(value)) return 'must not be an absolute path';
  if (value.includes('\\')) return 'must use forward slashes';
  if (hasControlCharacter(value)) return 'must not contain control characters';
  if (value.split('/').some((segment) => segment === '..' || segment === '.')) {
    return 'must not contain . or .. segments';
  }
  if (value.startsWith('~')) return 'must not start with ~';
  if (!ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(value))) {
    return 'must be a file under content/concepts/ or content/graph-only/ with a lowercase dashed name';
  }
  return undefined;
}

export const proposalPathSchema = z.string().superRefine((value, ctx) => {
  const problem = pathProblem(value);
  if (problem !== undefined) {
    ctx.addIssue({ code: 'custom', message: `allowed path ${problem}` });
  }
});

/* -------------------------------------------------------------------------- */
/* The manifest                                                                */
/* -------------------------------------------------------------------------- */

/** Proposal ids are generated, not typed, so the shape can be narrow. */
export const PROPOSAL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const COMMIT_SHA = /^[0-9a-f]{40}$/;

export const proposalManifestSchema = z
  .strictObject({
    proposalId: z
      .string()
      .min(8)
      .max(120)
      .regex(PROPOSAL_ID, 'proposalId must be lowercase letters, digits and dashes'),
    /** The backlog group or atlas candidate this proposal answers. */
    targetBacklogId: z.string().min(1).max(200),
    /** What the agent is being asked to write. Tier 1 is never delegated. */
    requestedTier: z.union([z.literal(2), z.literal(3)]),
    allowedPaths: z.array(proposalPathSchema).min(1).max(20),
    /** The exact commit the patch is written against. */
    baseCommit: z.string().regex(COMMIT_SHA, 'baseCommit must be a full 40-character commit sha'),
    createdAt: z.string().min(1).max(40),
    status: z.enum(proposalStatuses),
    /** Known once an agent is chosen, and not before. */
    agent: z
      .strictObject({
        name: z.string().min(1).max(120),
        model: z.string().min(1).max(200).optional(),
        /** Set by the Hermes adapter once a task exists. */
        taskId: z.string().min(1).max(200).optional(),
      })
      .optional(),
    /** Recorded when a person rejects it. */
    rejectedReason: z.string().min(1).max(2_000).optional(),
  })
  .superRefine((manifest, ctx) => {
    const seen = new Set<string>();
    for (const path of manifest.allowedPaths) {
      if (seen.has(path)) {
        ctx.addIssue({
          code: 'custom',
          path: ['allowedPaths'],
          message: `${path} is listed twice`,
        });
      }
      seen.add(path);
    }
    const yaml = manifest.allowedPaths.filter((path) => path.endsWith('.yaml'));
    const markdown = manifest.allowedPaths.filter((path) => path.endsWith('.md'));
    // A tier says what kind of file this is. Asking for a Tier 3 identity and
    // allowing a Markdown page would let the agent choose which contract to
    // meet, which is exactly the drift this bundle exists to prevent.
    if (manifest.requestedTier === 3 && markdown.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['allowedPaths'],
        message: 'a Tier 3 proposal may only write content/graph-only/*.yaml',
      });
    }
    if (manifest.requestedTier === 2 && yaml.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['allowedPaths'],
        message: 'a Tier 2 proposal may only write content/concepts/*.md',
      });
    }
    if (manifest.status !== 'rejected' && manifest.rejectedReason !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejectedReason'],
        message: 'only a rejected proposal carries a reason',
      });
    }
  });
export type ProposalManifest = z.infer<typeof proposalManifestSchema>;

/** Parse a manifest, reporting every problem at once. */
export function parseProposalManifest(value: unknown): ProposalManifest {
  const parsed = proposalManifestSchema.safeParse(value);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.map(String).join('.')}: ${issue.message}`
        : issue.message,
    );
    // The message carries the problems, not just their count: this is read by
    // a person at a terminal who has to fix the file in front of them.
    throw new ProposalError(`the proposal manifest is not valid: ${detail.join('; ')}`, detail);
  }
  return parsed.data;
}

export function serializeProposalManifest(manifest: ProposalManifest): string {
  // Key order is fixed rather than insertion-dependent, so a manifest rewritten
  // by a later command produces a reviewable diff.
  const ordered: Record<string, unknown> = {
    proposalId: manifest.proposalId,
    targetBacklogId: manifest.targetBacklogId,
    requestedTier: manifest.requestedTier,
    allowedPaths: [...manifest.allowedPaths],
    baseCommit: manifest.baseCommit,
    createdAt: manifest.createdAt,
    status: manifest.status,
  };
  if (manifest.agent !== undefined) ordered['agent'] = manifest.agent;
  if (manifest.rejectedReason !== undefined) ordered['rejectedReason'] = manifest.rejectedReason;
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/* -------------------------------------------------------------------------- */
/* The base commit                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Confirm the recorded base commit is one this repository actually has.
 *
 * A patch is only meaningful against a known base. A manifest naming a commit
 * that is not here means the bundle came from somewhere else, and applying it
 * would produce a change nobody can reproduce.
 */
export function baseCommitPresent(repoRoot: string, commit: string): boolean {
  if (!COMMIT_SHA.test(commit)) return false;
  try {
    execFileSync('git', ['cat-file', '-e', `${commit}^{commit}`], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function assertBaseCommitPresent(repoRoot: string, commit: string): void {
  if (!baseCommitPresent(repoRoot, commit)) {
    throw new ProposalError(`the base commit ${commit} is not in this repository`, [
      'a proposal can only be validated or accepted against a commit this repository has',
      'fetch the commit, or prepare the proposal again against the current base',
    ]);
  }
}

/** The validation verdict written beside a bundle. */
export const proposalValidationSchema = z.strictObject({
  proposalId: z.string().regex(PROPOSAL_ID),
  checkedAt: z.string().min(1).max(40),
  ok: z.boolean(),
  /** Each failed check, in the words a reviewer needs. */
  problems: z.array(z.string().min(1).max(2_000)).max(200),
  /** Each check that passed, so a clean verdict is evidence rather than silence. */
  passed: z.array(z.string().min(1).max(200)).max(200),
  filesTouched: z.array(z.string().min(1).max(400)).max(200),
});
export type ProposalValidation = z.infer<typeof proposalValidationSchema>;

export function serializeProposalValidation(validation: ProposalValidation): string {
  return `${JSON.stringify(validation, null, 2)}\n`;
}
