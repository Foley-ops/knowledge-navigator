/**
 * Bringing agent work back inside the review boundary (v2 runbook R08).
 *
 * An agent works in its own git worktree, which this product never reads while
 * the task is running. Importing is the moment that work becomes a proposal
 * somebody can review: the change is turned into a patch against the exact
 * commit the brief recorded, the agent's own account of what it did is copied
 * in beside it, validation runs, and the proposal moves to `review`.
 *
 * Nothing is merged and nothing is accepted. The main repository is not touched
 * at all — not its index, not its branches, not its working tree — and neither
 * is the worktree's own index, because the diff is taken through a throwaway
 * one. What changes is the bundle.
 */
import { execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  PROPOSAL_FILES,
  ProposalError,
  assertTransition,
  parseProposalManifest,
  serializeProposalManifest,
} from './proposal.js';
import type { ProposalManifest, ProposalValidation } from './proposal.js';
import { validateProposal, writeProposalValidation } from './proposal-validate.js';

export interface ImportHermesOptions {
  /** The repository the proposal was prepared in. */
  readonly repoRoot: string;
  readonly proposalDir: string;
  /** The worktree the agent worked in. */
  readonly worktree: string;
  readonly now?: (() => string) | undefined;
}

export interface ImportHermesOutcome {
  readonly ok: boolean;
  readonly proposalId: string;
  readonly problems: readonly string[];
  /** Set once the patch has been written into the bundle. */
  readonly patchBytes: number;
  readonly filesTouched: readonly string[];
  /** The verdict, when it got as far as running one. */
  readonly validation: ProposalValidation | undefined;
  readonly status: string;
}

function git(cwd: string, args: readonly string[], env: NodeJS.ProcessEnv = {}): string {
  return execFileSync('git', [...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
}

function gitOrUndefined(
  cwd: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv = {},
): string | undefined {
  try {
    return git(cwd, args, env);
  } catch {
    return undefined;
  }
}

/**
 * Whether a worktree belongs to this repository.
 *
 * Compared by the *common* git directory, which every worktree of a repository
 * shares and no unrelated clone does. Comparing remotes or root commits would
 * accept a clone of the same project sitting somewhere else on the machine,
 * which is exactly the thing this check exists to catch.
 */
export function worktreeBelongsTo(repoRoot: string, worktree: string): boolean {
  const mine = gitOrUndefined(repoRoot, [
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir',
  ]);
  const theirs = gitOrUndefined(worktree, [
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir',
  ]);
  if (mine === undefined || theirs === undefined) return false;
  return resolve(mine.trim()) === resolve(theirs.trim());
}

async function readManifest(proposalDir: string): Promise<ProposalManifest> {
  const path = join(proposalDir, PROPOSAL_FILES.manifest);
  if (!existsSync(path)) {
    throw new ProposalError(`no ${PROPOSAL_FILES.manifest} in ${proposalDir}`);
  }
  return parseProposalManifest(JSON.parse(await readFile(path, 'utf8')) as unknown);
}

/**
 * Import the result of one task.
 *
 * Refuses early and says why: an import that half-happened would leave a bundle
 * that looks reviewable and is not.
 */
export async function importHermesResult(
  options: ImportHermesOptions,
): Promise<ImportHermesOutcome> {
  const { repoRoot, proposalDir, worktree } = options;
  const manifest = await readManifest(proposalDir);
  const problems: string[] = [];

  const stop = (status = manifest.status): ImportHermesOutcome => ({
    ok: false,
    proposalId: manifest.proposalId,
    problems,
    patchBytes: 0,
    filesTouched: [],
    validation: undefined,
    status,
  });

  try {
    assertTransition(manifest.status, 'review');
  } catch (error) {
    problems.push(
      error instanceof ProposalError
        ? `${error.message}. ${error.detail.join('; ')}`
        : String(error),
    );
    return stop();
  }

  if (!existsSync(worktree)) {
    problems.push(`there is no worktree at ${worktree}`);
    return stop();
  }

  if (!worktreeBelongsTo(repoRoot, worktree)) {
    problems.push(
      `${worktree} is not a worktree of this repository. A patch from somewhere else cannot be reviewed against this corpus, whatever it contains.`,
    );
    return stop();
  }

  const head = gitOrUndefined(worktree, ['rev-parse', 'HEAD'])?.trim();
  if (head !== manifest.baseCommit) {
    problems.push(
      `the worktree is at ${head ?? '(unknown)'} but this proposal was written against ${manifest.baseCommit}. The change has to be left uncommitted on the recorded base, as the profile requires, or there is no way to tell the agent's work from everything else that moved.`,
    );
    return stop();
  }

  const resultPath = join(worktree, PROPOSAL_FILES.result);
  if (!existsSync(resultPath)) {
    problems.push(
      `the worktree has no ${PROPOSAL_FILES.result}. The task is not finished: a result saying what was written, what was checked and what was not is part of the work, not a formality.`,
    );
    return stop();
  }

  /* ------------------------------ the patch ------------------------------ */

  const scratch = await mkdtemp(join(tmpdir(), 'navigator-import-'));
  const indexFile = join(scratch, 'index');
  let patch: string;
  try {
    git(worktree, ['read-tree', manifest.baseCommit], { GIT_INDEX_FILE: indexFile });
    // `add -A` respects .gitignore, so nothing the repository ignores — a
    // private database, an export, the agent's own scratch files — can enter
    // the patch even if the agent left it lying in the worktree.
    //
    // RESULT.md is excluded deliberately: it is the agent's account of the work,
    // which belongs in the bundle beside the patch, not in the corpus.
    git(worktree, ['add', '-A', '--', '.', `:(exclude)${PROPOSAL_FILES.result}`], {
      GIT_INDEX_FILE: indexFile,
    });
    patch = git(worktree, ['diff', '--cached', '--binary', manifest.baseCommit], {
      GIT_INDEX_FILE: indexFile,
    });
  } catch (error) {
    problems.push(
      `the change in the worktree could not be turned into a patch: ${
        error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error)
      }`,
    );
    await rm(scratch, { recursive: true, force: true });
    return stop();
  }
  await rm(scratch, { recursive: true, force: true });

  if (patch.trim() === '') {
    problems.push(
      'the worktree contains no change at all. There is nothing to review, and the proposal stays where it is.',
    );
    return stop();
  }

  await writeFile(join(proposalDir, PROPOSAL_FILES.patch), patch, 'utf8');
  await copyFile(resultPath, join(proposalDir, PROPOSAL_FILES.result));

  /* ---------------------------- the verdict ------------------------------ */

  const { validation } = await validateProposal({
    repoRoot,
    proposalDir,
    ...(options.now === undefined ? {} : { now: options.now }),
  });
  await writeProposalValidation(proposalDir, validation);

  // The proposal reaches review whether or not validation passed: a failing
  // verdict is something a person needs to see, not a reason to hide the work.
  await writeFile(
    join(proposalDir, PROPOSAL_FILES.manifest),
    serializeProposalManifest({ ...manifest, status: 'review' }),
    'utf8',
  );

  return {
    ok: validation.ok,
    proposalId: manifest.proposalId,
    problems: validation.problems,
    patchBytes: Buffer.byteLength(patch, 'utf8'),
    filesTouched: validation.filesTouched,
    validation,
    status: 'review',
  };
}
