/**
 * Accepting or rejecting a proposal (v2 runbook R03).
 *
 * Acceptance is the moment agent work stops being a proposal and starts being
 * a change to canonical knowledge, so it is the most deliberate action in the
 * product. It is human-only, and it is guarded on every side:
 *
 *   * the confirmation must repeat the proposal id exactly;
 *   * the proposal must be in review, not merely prepared or already accepted;
 *   * the working tree must be clean, so what appears afterwards is the patch
 *     and nothing that happened to be lying around;
 *   * HEAD must be the exact commit the proposal was written against;
 *   * validation must pass now — not when the bundle was written;
 *   * the branch it would create must not already exist.
 *
 * What it then does is deliberately unfinished: a new local branch, the patch
 * applied and staged, content validation and a compile run against the result,
 * and *nothing committed*. The last step is a person reading the change.
 *
 * `rejectProposal` records a reason and applies nothing at all.
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileCorpus } from './compile.js';
import { loadCorpus } from './validate.js';
import {
  PROPOSAL_FILES,
  ProposalError,
  assertTransition,
  parseProposalManifest,
  serializeProposalManifest,
} from './proposal.js';
import type { ProposalManifest } from './proposal.js';
import { validateProposal } from './proposal-validate.js';

export interface AcceptProposalOptions {
  readonly repoRoot: string;
  readonly proposalDir: string;
  /** Must equal the proposal id in the manifest. Typed by a person. */
  readonly confirm: string;
  /** Check every guard and change nothing. */
  readonly dryRun?: boolean | undefined;
  readonly now?: (() => string) | undefined;
}

export interface AcceptProposalOutcome {
  readonly ok: boolean;
  readonly proposalId: string;
  /** The branch that was created, or would be. */
  readonly branch: string;
  /** Guards that held, in the order they were checked. */
  readonly passed: readonly string[];
  /** Why it stopped. Empty when it did not. */
  readonly problems: readonly string[];
  /** What was actually done. Empty on a dry run. */
  readonly applied: readonly string[];
}

function git(repoRoot: string, args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

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

export function branchNameFor(proposalId: string): string {
  return `content/${proposalId}`;
}

async function readManifest(proposalDir: string): Promise<ProposalManifest> {
  const path = join(proposalDir, PROPOSAL_FILES.manifest);
  if (!existsSync(path)) {
    throw new ProposalError(`no ${PROPOSAL_FILES.manifest} in ${proposalDir}`);
  }
  return parseProposalManifest(JSON.parse(await readFile(path, 'utf8')) as unknown);
}

async function writeManifest(proposalDir: string, manifest: ProposalManifest): Promise<void> {
  await writeFile(
    join(proposalDir, PROPOSAL_FILES.manifest),
    serializeProposalManifest(manifest),
    'utf8',
  );
}

/**
 * Apply a reviewed proposal to a fresh branch, leaving it uncommitted.
 *
 * Every guard is checked before anything changes, and the first failure stops
 * the whole thing: a half-applied acceptance would be worse than none.
 */
export async function acceptProposal(
  options: AcceptProposalOptions,
): Promise<AcceptProposalOutcome> {
  const { repoRoot, proposalDir } = options;
  const dryRun = options.dryRun ?? false;
  const manifest = await readManifest(proposalDir);
  const branch = branchNameFor(manifest.proposalId);

  const passed: string[] = [];
  const problems: string[] = [];
  const applied: string[] = [];

  const stop = (): AcceptProposalOutcome => ({
    ok: false,
    proposalId: manifest.proposalId,
    branch,
    passed,
    problems,
    applied,
  });

  /* ---------------------------- the confirmation ------------------------- */

  if (options.confirm !== manifest.proposalId) {
    problems.push(
      `the confirmation does not match: --confirm ${manifest.proposalId} is required to accept this proposal`,
    );
    return stop();
  }
  passed.push('the confirmation matches the proposal id');

  /* ------------------------------- the status ---------------------------- */

  try {
    assertTransition(manifest.status, 'accepted');
  } catch (error) {
    problems.push(
      error instanceof ProposalError
        ? `${error.message}. ${error.detail.join('; ')}`
        : String(error),
    );
    if (manifest.status === 'prepared' || manifest.status === 'running') {
      problems.push(
        'a proposal is accepted only after its result is in the bundle: import it first, so there is something to review',
      );
    }
    return stop();
  }
  passed.push(`the proposal is in review, which is the only state acceptance follows`);

  /* ------------------------------ the tree ------------------------------- */

  const dirty = git(repoRoot, ['status', '--porcelain']).trim();
  if (dirty !== '') {
    problems.push(
      'the working tree is not clean. Commit or stash what is there first, so the only change afterwards is this proposal.',
    );
    return stop();
  }
  passed.push('the working tree is clean');

  const head = git(repoRoot, ['rev-parse', 'HEAD']).trim();
  if (head !== manifest.baseCommit) {
    problems.push(
      `HEAD is ${head} but this proposal was written against ${manifest.baseCommit}. Check out that commit, or prepare the proposal again against the current base.`,
    );
    return stop();
  }
  passed.push('HEAD is the exact commit this proposal was written against');

  /* ----------------------------- the branch ------------------------------ */

  const branches = git(repoRoot, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/'])
    .split('\n')
    .map((line) => line.trim());
  if (branches.includes(branch)) {
    problems.push(
      `the branch ${branch} already exists. This proposal has been accepted before, or a branch was made by hand.`,
    );
    return stop();
  }
  passed.push(`the branch ${branch} does not exist yet`);

  /* ---------------------------- the validation --------------------------- */

  const { validation } = await validateProposal({
    repoRoot,
    proposalDir,
    ...(options.now === undefined ? {} : { now: options.now }),
  });
  if (!validation.ok) {
    problems.push('validation does not pass now, whatever it said when the bundle was written:');
    problems.push(...validation.problems);
    return stop();
  }
  passed.push('validation passes against the repository as it is now');

  if (dryRun) {
    return {
      ok: true,
      proposalId: manifest.proposalId,
      branch,
      passed,
      problems,
      applied: [],
    };
  }

  /* ------------------------------ applying ------------------------------- */

  git(repoRoot, ['switch', '-c', branch]);
  applied.push(`created and switched to ${branch}`);

  try {
    git(repoRoot, ['apply', '--index', join(proposalDir, PROPOSAL_FILES.patch)]);
    applied.push('applied the patch and staged it, leaving it uncommitted');
  } catch (error) {
    // Put the repository back where it was: a branch with nothing on it is
    // confusing, and the person asked for an acceptance, not a mess.
    git(repoRoot, ['switch', '-']);
    git(repoRoot, ['branch', '-D', branch]);
    problems.push(`the patch did not apply: ${gitComplaint(error)}`);
    return stop();
  }

  /* --------------------------- focused checks ---------------------------- */

  const contentDir = join(repoRoot, 'content', 'concepts');
  const corpus = await loadCorpus(contentDir);
  if (!corpus.ok) {
    for (const diagnostic of corpus.diagnostics.slice(0, 20)) {
      problems.push(`${diagnostic.file} ${diagnostic.field}: ${diagnostic.message}`);
    }
    problems.push(
      'the change is still on the branch and still uncommitted. Fix it, or `git switch -` and delete the branch.',
    );
    return {
      ok: false,
      proposalId: manifest.proposalId,
      branch,
      passed,
      problems,
      applied,
    };
  }
  applied.push('content validation passes with the change applied');

  const scratch = await mkdtemp(join(tmpdir(), 'navigator-accept-'));
  try {
    const compiled = await compileCorpus({
      contentDir,
      databasePath: join(scratch, 'knowledge.db'),
      env: { SOURCE_DATE_EPOCH: '1700000000' },
    });
    if (!compiled.ok) {
      for (const diagnostic of compiled.diagnostics.slice(0, 20)) {
        problems.push(`${diagnostic.file} ${diagnostic.field}: ${diagnostic.message}`);
      }
      return {
        ok: false,
        proposalId: manifest.proposalId,
        branch,
        passed,
        problems,
        applied,
      };
    }
    applied.push('the corpus compiles with the change applied');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }

  /* ---------------------------- the manifest ----------------------------- */

  await writeManifest(proposalDir, { ...manifest, status: 'accepted' });
  applied.push('recorded the proposal as accepted');

  return {
    ok: true,
    proposalId: manifest.proposalId,
    branch,
    passed,
    problems,
    applied,
  };
}

export interface RejectProposalOptions {
  readonly proposalDir: string;
  readonly confirm: string;
  readonly reason: string;
}

/**
 * Record a refusal. Nothing is applied, and nothing is deleted.
 *
 * The reason is kept because a rejected proposal is evidence: it says what was
 * asked for and why it was not good enough, which is what stops the same brief
 * being handed out again unchanged.
 */
export async function rejectProposal(options: RejectProposalOptions): Promise<ProposalManifest> {
  const manifest = await readManifest(options.proposalDir);
  if (options.confirm !== manifest.proposalId) {
    throw new ProposalError(
      `the confirmation does not match: --confirm ${manifest.proposalId} is required to reject this proposal`,
    );
  }
  const reason = options.reason.trim();
  if (reason === '') {
    throw new ProposalError('a rejection needs a reason', [
      'pass --reason "<what was wrong with it>"',
    ]);
  }
  assertTransition(manifest.status, 'rejected');
  const rejected: ProposalManifest = { ...manifest, status: 'rejected', rejectedReason: reason };
  await writeManifest(options.proposalDir, rejected);
  return rejected;
}
