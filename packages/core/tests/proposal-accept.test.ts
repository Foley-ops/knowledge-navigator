/**
 * Accepting and rejecting a proposal (v2 runbook R03).
 *
 * Acceptance is the only action in this product that turns agent output into
 * canonical knowledge, so every guard is tested from the side that matters:
 * what happens when it is missing. Each dry run proves the guard is checked
 * *before* anything changes, and the integration cases run entirely inside a
 * temporary git repository — no test here can reach the real one.
 */
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PROPOSAL_FILES,
  ProposalError,
  parseProposalManifest,
  serializeProposalManifest,
} from '../src/proposal.js';
import type { ProposalStatus } from '../src/proposal.js';
import { acceptProposal, branchNameFor, rejectProposal } from '../src/proposal-accept.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const PROPOSAL_ID = 'p-20260917-state-space-model';
const AREA = 'Artificial Intelligence/Deep Learning — Architectures';

const IDENTITY = `concept_id: concept.deep_learning_architectures.state_space_model
title: State Space Model
slug: /concepts/state-space-model
aliases: []
kind: concept
tier: 3
review_state: generated-draft
summary: A family of sequence models that carry a latent state through time.
categories:
  - ${AREA}
primary_category: ${AREA}
relationships: []
sources: []
unresolved_references: []
claims: []
`;

const RESULT = `# Result

Wrote content/graph-only/state-space-model.yaml as a Tier 3 identity. No sources
were added: I have read none for this family, and an identity makes no claim
that would need one. Nothing else was touched.
`;

let repo = '';
let base = '';
let bundleRoot = '';
let proposalDir = '';

function git(args: string[], cwd = repo): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function patchAdding(path: string, contents: string): string {
  const full = join(repo, path);
  execFileSync('mkdir', ['-p', join(full, '..')]);
  execFileSync('sh', ['-c', `cat > ${JSON.stringify(full)}`], { input: contents });
  git(['add', '-A']);
  const patch = git(['diff', '--cached', '--binary']);
  git(['reset', '--hard', 'HEAD']);
  git(['clean', '-fd']);
  return patch;
}

async function writeBundle(
  overrides: { status?: ProposalStatus; baseCommit?: string; patch?: string } = {},
): Promise<void> {
  await mkdir(proposalDir, { recursive: true });
  const manifest = parseProposalManifest({
    proposalId: PROPOSAL_ID,
    targetBacklogId: 'candidate.artificial_intelligence.deep_learning.state_space_model',
    requestedTier: 3,
    allowedPaths: ['content/graph-only/state-space-model.yaml'],
    baseCommit: overrides.baseCommit ?? base,
    createdAt: '2026-09-17T00:00:00.000Z',
    status: overrides.status ?? 'review',
  });
  await writeFile(
    join(proposalDir, PROPOSAL_FILES.manifest),
    serializeProposalManifest(manifest),
    'utf8',
  );
  await writeFile(join(proposalDir, PROPOSAL_FILES.request), '# Request\n', 'utf8');
  await writeFile(join(proposalDir, PROPOSAL_FILES.result), RESULT, 'utf8');
  await writeFile(
    join(proposalDir, PROPOSAL_FILES.patch),
    overrides.patch ?? patchAdding('content/graph-only/state-space-model.yaml', IDENTITY),
    'utf8',
  );
}

function accept(options: { confirm?: string; dryRun?: boolean } = {}) {
  return acceptProposal({
    repoRoot: repo,
    proposalDir,
    confirm: options.confirm ?? PROPOSAL_ID,
    dryRun: options.dryRun ?? false,
  });
}

async function manifestNow() {
  return parseProposalManifest(
    JSON.parse(await readFile(join(proposalDir, PROPOSAL_FILES.manifest), 'utf8')) as unknown,
  );
}

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), 'navigator-accept-repo-'));
  await cp(join(REPO_ROOT, 'content'), join(repo, 'content'), { recursive: true });
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'test@example.invalid']);
  git(['config', 'user.name', 'Test']);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'corpus']);
  base = git(['rev-parse', 'HEAD']).trim();
  bundleRoot = await mkdtemp(join(tmpdir(), 'navigator-accept-bundle-'));
  proposalDir = join(bundleRoot, PROPOSAL_ID);
}, 60_000);

afterEach(async () => {
  // git leaves pack files open for a moment after the last command returns, so
  // removing .git/objects/pack can lose a race and fail with ENOTEMPTY. It is
  // the temp directory of a finished test either way, so retry rather than fail
  // a run over cleanup — the flake lands on a different test each time, which
  // makes it read as a real failure somewhere new.
  const scrub = (path: string) => rm(path, { recursive: true, force: true, maxRetries: 10 });
  await scrub(repo);
  await scrub(bundleRoot);
});

/* ------------------------------ the guards -------------------------------- */

describe('the guards, each checked before anything changes', () => {
  it('refuses a confirmation that does not match', async () => {
    await writeBundle();
    const outcome = await accept({ confirm: 'yes' });
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain(`--confirm ${PROPOSAL_ID} is required`);
    expect(outcome.applied).toEqual([]);
    expect(git(['branch', '--list']).trim()).not.toContain(PROPOSAL_ID);
  });

  it('refuses a proposal that has not been reviewed yet', async () => {
    await writeBundle({ status: 'prepared' });
    const outcome = await accept();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('cannot move from prepared to accepted');
    expect(outcome.problems.join(' ')).toContain('import it first');
  });

  it('refuses a proposal that was already accepted or rejected', async () => {
    for (const status of ['accepted', 'rejected'] as const) {
      await writeBundle({ status });
      const outcome = await accept();
      expect(outcome.ok, status).toBe(false);
      expect(outcome.problems.join(' ')).toContain(`cannot move from ${status} to accepted`);
    }
  });

  it('refuses a dirty working tree', async () => {
    await writeBundle();
    await writeFile(join(repo, 'content', 'concepts', 'scratch.md'), 'work in progress\n', 'utf8');
    const outcome = await accept();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('working tree is not clean');
  });

  it('refuses when HEAD is not the commit the proposal was written against', async () => {
    await writeBundle();
    await writeFile(join(repo, 'content', 'NOTES.md'), 'a later commit\n', 'utf8');
    git(['add', '-A']);
    git(['commit', '-q', '-m', 'later']);
    const outcome = await accept();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('was written against');
  });

  it('refuses when the branch it would create already exists', async () => {
    await writeBundle();
    git(['branch', branchNameFor(PROPOSAL_ID)]);
    const outcome = await accept();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('already exists');
  });

  it('refuses when validation does not pass now', async () => {
    // A patch that would touch a file the manifest never allowed.
    await writeBundle({ patch: patchAdding('content/concepts/scratch.md', 'not a page\n') });
    const outcome = await accept();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('validation does not pass now');
    expect(git(['branch', '--list']).trim()).not.toContain(PROPOSAL_ID);
  });

  it('checks every guard and changes nothing on a dry run', async () => {
    await writeBundle();
    const outcome = await accept({ dryRun: true });
    expect(outcome.ok).toBe(true);
    expect(outcome.applied).toEqual([]);
    expect(outcome.passed).toContain('the working tree is clean');
    expect(outcome.passed).toContain('validation passes against the repository as it is now');
    expect(git(['branch', '--list']).trim()).toBe('* main');
    expect(git(['status', '--porcelain']).trim()).toBe('');
    expect((await manifestNow()).status).toBe('review');
  });
});

/* --------------------------- accepting for real --------------------------- */

describe('accepting a reviewed proposal', () => {
  it('applies it to a new branch and leaves it uncommitted', async () => {
    await writeBundle();
    const outcome = await accept();
    expect(outcome.problems).toEqual([]);
    expect(outcome.ok).toBe(true);

    // A new branch, checked out.
    expect(git(['rev-parse', '--abbrev-ref', 'HEAD']).trim()).toBe(branchNameFor(PROPOSAL_ID));
    // The change is there, staged, and not committed.
    expect(git(['rev-parse', 'HEAD']).trim()).toBe(base);
    expect(git(['diff', '--cached', '--name-only']).trim()).toBe(
      'content/graph-only/state-space-model.yaml',
    );
    const written = await readFile(
      join(repo, 'content', 'graph-only', 'state-space-model.yaml'),
      'utf8',
    );
    expect(written).toContain('concept_id: concept.deep_learning_architectures.state_space_model');

    // The focused checks ran against the result.
    expect(outcome.applied.join(' ')).toContain('content validation passes');
    expect(outcome.applied.join(' ')).toContain('compiles');
    expect((await manifestNow()).status).toBe('accepted');
  });

  it('cannot be accepted twice', async () => {
    await writeBundle();
    expect((await accept()).ok).toBe(true);
    // The manifest now says accepted, and the branch exists: both refuse.
    const second = await accept();
    expect(second.ok).toBe(false);
    expect(second.problems.join(' ')).toContain('cannot move from accepted to accepted');
  });

  it('commits nothing at all', async () => {
    await writeBundle();
    const before = git(['rev-list', '--all', '--count']).trim();
    await accept();
    expect(git(['rev-list', '--all', '--count']).trim()).toBe(before);
  });
});

/* -------------------------------- rejecting ------------------------------- */

describe('rejecting a proposal', () => {
  it('records the reason and applies nothing', async () => {
    await writeBundle();
    const rejected = await rejectProposal({
      proposalDir,
      confirm: PROPOSAL_ID,
      reason: 'The summary asserts a claim no listed source supports.',
    });
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectedReason).toContain('no listed source supports');
    expect((await manifestNow()).status).toBe('rejected');
    expect(git(['status', '--porcelain']).trim()).toBe('');
    expect(git(['branch', '--list']).trim()).toBe('* main');
  });

  it('needs a matching confirmation and a reason', async () => {
    await writeBundle();
    await expect(rejectProposal({ proposalDir, confirm: 'no', reason: 'because' })).rejects.toThrow(
      /confirmation does not match/,
    );
    await expect(
      rejectProposal({ proposalDir, confirm: PROPOSAL_ID, reason: '   ' }),
    ).rejects.toThrow(/needs a reason/);
    expect((await manifestNow()).status).toBe('review');
  });

  it('cannot reject what was already accepted', async () => {
    await writeBundle({ status: 'accepted' });
    await expect(
      rejectProposal({ proposalDir, confirm: PROPOSAL_ID, reason: 'too late' }),
    ).rejects.toThrow(ProposalError);
  });
});
