/**
 * Validating a proposal (v2 runbook R02).
 *
 * This runs before a human reads the change, and its job is to spend the
 * reviewer's attention well: everything a machine can check is checked here, so
 * the person can think about whether the content is *true* rather than whether
 * the agent stayed inside its lines.
 *
 * Seven things are checked, and each of them is a way agent work has actually
 * gone wrong in practice:
 *
 *   1. the patch applies to the exact commit the brief recorded;
 *   2. it touches only the files the manifest allowed;
 *   3. it adds no secret and no ignored artefact;
 *   4. an existing identity keeps its `concept_id` and `slug`;
 *   5. no review state is raised, including on the agent's own new file;
 *   6. the corpus still validates once the patch is applied;
 *   7. there is a reviewer summary written by whoever did the work.
 *
 * Nothing here applies the patch to the working tree. The change is staged in a
 * throwaway index and materialised in a temporary directory, so validation can
 * read the result of the change without the repository ever containing it.
 */
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parse as parseYaml } from 'yaml';
import { reviewStates } from './schema.js';
import { loadCorpus } from './validate.js';
import {
  PROPOSAL_FILES,
  ProposalError,
  baseCommitPresent,
  parseProposalManifest,
  pathProblem,
} from './proposal.js';
import type { ProposalManifest, ProposalValidation } from './proposal.js';

const run = promisify(execFile);

/** Minimum a reviewer summary has to say before it counts as one. */
export const MIN_RESULT_CHARACTERS = 120;

/**
 * Secret-shaped strings, checked against the added lines of the patch.
 *
 * The allowed paths already keep a proposal inside `content/`, so this is the
 * second line rather than the first: it catches a key pasted into prose, which
 * no path rule would notice.
 */
const SECRET_PATTERNS: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: 'a private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'an OpenAI-style key', pattern: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: 'a GitHub token', pattern: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { name: 'an AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: 'an assignment to a password or secret',
    pattern: /\b(password|secret|api[_-]?key)\s*[:=]\s*["']?\S{8,}/i,
  },
];

/** Artefacts that must never enter the repository through a proposal. */
const IGNORED_ARTEFACT_PATTERNS: readonly RegExp[] = [
  /(^|\/)\.navigator\//,
  /(^|\/)node_modules\//,
  /\.db($|-wal$|-shm$)/,
  /(^|\/)data\//,
  /(^|\/)\.env($|\.)/,
];

export interface ValidateProposalOptions {
  /** The git repository the patch is written against. */
  readonly repoRoot: string;
  /** The bundle directory. */
  readonly proposalDir: string;
  /** Frozen in tests so validation.json is byte-stable. */
  readonly now?: (() => string) | undefined;
}

export interface ValidateProposalResult {
  readonly validation: ProposalValidation;
  readonly manifest: ProposalManifest;
}

/**
 * Run git, capturing both streams.
 *
 * Failures here are ordinary results — a patch that does not apply, a file the
 * base does not have — so git's own complaint is captured rather than printed:
 * validation reports the problem in its own words, in its own list.
 */
function git(repoRoot: string, args: readonly string[], env: NodeJS.ProcessEnv = {}): string {
  return execFileSync('git', [...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** What git said about a failure, in one line. */
function gitComplaint(error: unknown): string {
  const stderr = (error as { stderr?: string }).stderr;
  const text =
    typeof stderr === 'string' && stderr.trim() !== ''
      ? stderr
      : error instanceof Error
        ? error.message
        : String(error);
  return (text.split('\n').find((line) => line.trim() !== '') ?? '').trim();
}

/** The review states, weakest first, so "raised" has a meaning. */
const REVIEW_ORDER: readonly string[] = [
  'disputed-or-conditional',
  'generated-draft',
  'source-checked',
  'expert-reviewed',
  'formally-verified',
];

function reviewRank(state: string): number {
  const index = REVIEW_ORDER.indexOf(state);
  return index === -1 ? 0 : index;
}

/** The frontmatter of a Markdown page or the document of a graph-only file. */
function readIdentity(path: string, text: string): Record<string, unknown> | undefined {
  try {
    if (path.endsWith('.md')) {
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
      if (match?.[1] === undefined) return undefined;
      return parseYaml(match[1]) as Record<string, unknown>;
    }
    return parseYaml(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function field(document: Record<string, unknown> | undefined, name: string): string | undefined {
  const value = document?.[name];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Validate one bundle.
 *
 * Every problem found is reported, not just the first: a reviewer sending work
 * back wants the whole list, and an agent fixing it should not have to discover
 * the failures one run at a time.
 */
export async function validateProposal(
  options: ValidateProposalOptions,
): Promise<ValidateProposalResult> {
  const now = options.now ?? (() => new Date().toISOString());
  const { proposalDir, repoRoot } = options;

  const manifestPath = join(proposalDir, PROPOSAL_FILES.manifest);
  if (!existsSync(manifestPath)) {
    throw new ProposalError(`no ${PROPOSAL_FILES.manifest} in ${proposalDir}`, [
      'a proposal directory holds manifest.json, REQUEST.md, RESULT.md and changes.patch',
    ]);
  }
  const manifest = parseProposalManifest(
    JSON.parse(await readFile(manifestPath, 'utf8')) as unknown,
  );

  const problems: string[] = [];
  const passed: string[] = [];
  let filesTouched: string[] = [];

  /* ------------------------------ the base ------------------------------- */

  const baseKnown = baseCommitPresent(repoRoot, manifest.baseCommit);
  if (!baseKnown) {
    problems.push(
      `the recorded base commit ${manifest.baseCommit} is not in this repository, so the patch cannot be checked against it`,
    );
  } else {
    passed.push('the recorded base commit is in this repository');
  }

  /* ------------------------------ the patch ------------------------------ */

  const patchPath = join(proposalDir, PROPOSAL_FILES.patch);
  const patch = existsSync(patchPath) ? await readFile(patchPath, 'utf8') : undefined;
  if (patch === undefined) {
    problems.push(`there is no ${PROPOSAL_FILES.patch} in this proposal, so there is no change`);
  } else if (patch.trim() === '') {
    problems.push(`${PROPOSAL_FILES.patch} is empty, so the agent produced no change`);
  }

  /* --------------------------- the reviewer summary ---------------------- */

  const resultPath = join(proposalDir, PROPOSAL_FILES.result);
  if (!existsSync(resultPath)) {
    problems.push(
      `there is no ${PROPOSAL_FILES.result}: a proposal has to say what was done and what could not be checked`,
    );
  } else {
    const result = await readFile(resultPath, 'utf8');
    const substance = result.replace(/\s+/g, ' ').trim();
    if (substance.length < MIN_RESULT_CHARACTERS) {
      problems.push(
        `${PROPOSAL_FILES.result} says almost nothing (${String(substance.length)} characters). A reviewer needs what was written, what was checked, and what was not.`,
      );
    } else {
      passed.push('a reviewer summary is present');
    }
  }

  // Without a base and a patch nothing further can be said honestly.
  if (!baseKnown || patch === undefined || patch.trim() === '') {
    return {
      manifest,
      validation: {
        proposalId: manifest.proposalId,
        checkedAt: now(),
        ok: false,
        problems,
        passed,
        filesTouched: [],
      },
    };
  }

  /* --------------------- apply into a throwaway index -------------------- */

  const scratch = await mkdtemp(join(tmpdir(), 'navigator-proposal-'));
  const indexFile = join(scratch, 'index');
  const worktree = join(scratch, 'tree');
  let applied = false;

  try {
    git(repoRoot, ['read-tree', manifest.baseCommit], { GIT_INDEX_FILE: indexFile });

    // What the patch claims to touch, read without applying anything.
    try {
      const numstat = git(repoRoot, ['apply', '--numstat', '-z', patchPath]);
      filesTouched = [
        ...new Set(
          numstat
            .split('\0')
            .map((entry) => entry.trim())
            .filter((entry) => entry !== '')
            .map((entry) => {
              const parts = entry.split('\t');
              return (parts[2] ?? parts[parts.length - 1] ?? '').trim();
            })
            .filter((name) => name !== '' && !/^[0-9-]+$/.test(name)),
        ),
      ].sort();
    } catch {
      problems.push('the patch could not be read: git could not parse it as a diff');
    }

    try {
      git(repoRoot, ['apply', '--cached', '--check', patchPath], { GIT_INDEX_FILE: indexFile });
      passed.push('the patch applies cleanly to the recorded base commit');
      git(repoRoot, ['apply', '--cached', patchPath], { GIT_INDEX_FILE: indexFile });
      applied = true;
    } catch (error) {
      problems.push(`the patch does not apply to the recorded base commit: ${gitComplaint(error)}`);
    }

    /* ---------------------------- allowed paths --------------------------- */

    const allowed = new Set(manifest.allowedPaths);
    const outside = filesTouched.filter((path) => !allowed.has(path));
    if (outside.length > 0) {
      problems.push(
        `the patch touches ${String(outside.length)} file(s) the proposal did not allow: ${outside.join(', ')}`,
      );
    } else if (filesTouched.length > 0) {
      passed.push('every file the patch touches is one the proposal allowed');
    }
    for (const path of filesTouched) {
      const problem = pathProblem(path);
      if (problem !== undefined && allowed.has(path)) {
        // The manifest itself is validated, so this only fires on a patch that
        // names something the manifest could not have held.
        problems.push(`the patch writes ${path}, which ${problem}`);
      }
      if (IGNORED_ARTEFACT_PATTERNS.some((pattern) => pattern.test(path))) {
        problems.push(`the patch adds ${path}, which is an ignored local artefact`);
      }
    }

    /* ------------------------------- secrets ------------------------------ */

    const added = patch
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .join('\n');
    const foundSecrets = SECRET_PATTERNS.filter(({ pattern }) => pattern.test(added));
    if (foundSecrets.length > 0) {
      problems.push(
        `the patch adds ${foundSecrets.map(({ name }) => name).join(' and ')}; nothing secret-shaped may enter canonical content`,
      );
    } else {
      passed.push('the patch adds nothing secret-shaped');
    }

    if (!applied) {
      return {
        manifest,
        validation: {
          proposalId: manifest.proposalId,
          checkedAt: now(),
          ok: false,
          problems,
          passed,
          filesTouched,
        },
      };
    }

    /* ------------------ identifiers and review states --------------------- */

    await run('git', ['checkout-index', '-a', '-f', `--prefix=${worktree}/`], {
      cwd: repoRoot,
      env: { ...process.env, GIT_INDEX_FILE: indexFile },
      maxBuffer: 64 * 1024 * 1024,
    });

    for (const path of filesTouched) {
      const afterPath = join(worktree, path);
      const after = existsSync(afterPath) ? await readFile(afterPath, 'utf8') : undefined;
      if (after === undefined) {
        problems.push(
          `the patch deletes ${path}; a proposal adds or edits content, never removes it`,
        );
        continue;
      }
      const afterDocument = readIdentity(path, after);
      if (afterDocument === undefined) {
        problems.push(`the frontmatter of ${path} could not be parsed after the patch`);
        continue;
      }

      let before: string | undefined;
      try {
        before = git(repoRoot, ['cat-file', '-p', `${manifest.baseCommit}:${path}`]);
      } catch {
        before = undefined;
      }

      const afterState = field(afterDocument, 'review_state') ?? '';
      if (before === undefined) {
        // A new file. An agent's own work is always a generated draft.
        if (afterState !== 'generated-draft') {
          problems.push(
            `${path} is new and carries review_state ${afterState || '(none)'}; agent work is always generated-draft`,
          );
        }
      } else {
        const beforeDocument = readIdentity(path, before);
        const beforeState = field(beforeDocument, 'review_state') ?? '';
        if (reviewRank(afterState) > reviewRank(beforeState)) {
          problems.push(
            `${path} raises its review state from ${beforeState} to ${afterState}; only a human who checked the sources may do that`,
          );
        }
        for (const key of ['concept_id', 'slug'] as const) {
          const wasValue = field(beforeDocument, key);
          const nowValue = field(afterDocument, key);
          if (wasValue !== undefined && wasValue !== nowValue) {
            problems.push(
              `${path} changes ${key} from ${wasValue} to ${nowValue ?? '(missing)'}; identifiers are permanent addresses`,
            );
          }
        }
      }

      if (!(reviewStates as readonly string[]).includes(afterState)) {
        problems.push(
          `${path} carries review_state ${afterState || '(none)'}, which is not a review state`,
        );
      }
    }
    if (problems.length === 0) {
      passed.push('identifiers are unchanged and no review state was raised');
    }

    /* -------------------------- content validation ------------------------ */

    const contentDir = join(worktree, 'content', 'concepts');
    if (existsSync(contentDir)) {
      const corpus = await loadCorpus(contentDir);
      if (corpus.ok) {
        passed.push('the corpus still validates with the patch applied');
      } else {
        for (const diagnostic of corpus.diagnostics.slice(0, 20)) {
          problems.push(
            `content validation failed: ${diagnostic.file} ${diagnostic.field}: ${diagnostic.message}`,
          );
        }
      }
    } else {
      problems.push('the patched tree has no content/concepts directory to validate');
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }

  return {
    manifest,
    validation: {
      proposalId: manifest.proposalId,
      checkedAt: now(),
      ok: problems.length === 0,
      problems,
      passed,
      filesTouched,
    },
  };
}

/** Write the verdict beside the bundle it describes. */
export async function writeProposalValidation(
  proposalDir: string,
  validation: ProposalValidation,
): Promise<string> {
  const path = join(proposalDir, PROPOSAL_FILES.validation);
  await writeFile(path, `${JSON.stringify(validation, null, 2)}\n`, 'utf8');
  return path;
}
