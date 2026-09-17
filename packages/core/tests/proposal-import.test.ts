/**
 * Importing agent work (v2 runbook R08).
 *
 * The whole test runs on real git worktrees of a temporary repository, because
 * the property being defended is a git one: a patch may only come from a
 * worktree of *this* repository, taken against the exact commit the brief
 * recorded. A clone of the same project sitting elsewhere on the machine looks
 * identical in every other way, and must be refused.
 *
 * Nothing here merges, accepts, or touches the main checkout.
 */
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PROPOSAL_FILES,
  parseProposalManifest,
  serializeProposalManifest,
} from '../src/proposal.js';
import type { ProposalStatus } from '../src/proposal.js';
import { importHermesResult, worktreeBelongsTo } from '../src/proposal-import.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const PROPOSAL_ID = 'p-20260917-state-space-model';
const CHECKED_AT = '2026-09-17T00:00:00.000Z';
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

Wrote content/graph-only/state-space-model.yaml as a Tier 3 identity. I added no
sources: I have read none for this family, and an identity makes no claim that
would need one. npm run validate, npm run compile and npm test all pass.
`;

let repo = '';
let base = '';
let worktree = '';
let bundleRoot = '';
let proposalDir = '';

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

async function writeBundle(status: ProposalStatus = 'running'): Promise<void> {
  await mkdir(proposalDir, { recursive: true });
  await writeFile(
    join(proposalDir, PROPOSAL_FILES.manifest),
    serializeProposalManifest(
      parseProposalManifest({
        proposalId: PROPOSAL_ID,
        targetBacklogId: 'candidate.artificial_intelligence.deep_learning.state_space_model',
        requestedTier: 3,
        allowedPaths: ['content/graph-only/state-space-model.yaml'],
        baseCommit: base,
        createdAt: CHECKED_AT,
        status,
      }),
    ),
    'utf8',
  );
  await writeFile(join(proposalDir, PROPOSAL_FILES.request), '# Request\n', 'utf8');
}

function bringBack(from = worktree) {
  return importHermesResult({
    repoRoot: repo,
    proposalDir,
    worktree: from,
    now: () => CHECKED_AT,
  });
}

async function statusNow(): Promise<string> {
  return parseProposalManifest(
    JSON.parse(await readFile(join(proposalDir, PROPOSAL_FILES.manifest), 'utf8')) as unknown,
  ).status;
}

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), 'navigator-import-repo-'));
  await cp(join(REPO_ROOT, 'content'), join(repo, 'content'), { recursive: true });
  // The real ignore rules come too: what a worktree ignores is part of what
  // this import is allowed to see.
  await cp(join(REPO_ROOT, '.gitignore'), join(repo, '.gitignore'));
  git(['init', '-q', '-b', 'main'], repo);
  git(['config', 'user.email', 'test@example.invalid'], repo);
  git(['config', 'user.name', 'Test'], repo);
  git(['add', '-A'], repo);
  git(['commit', '-q', '-m', 'corpus'], repo);
  base = git(['rev-parse', 'HEAD'], repo).trim();

  // The worktree an agent would have been given.
  worktree = join(repo, '..', `worktree-${String(process.pid)}-${String(Date.now())}`);
  git(['worktree', 'add', '--detach', worktree, base], repo);

  bundleRoot = await mkdtemp(join(tmpdir(), 'navigator-import-bundle-'));
  proposalDir = join(bundleRoot, PROPOSAL_ID);
  await writeBundle();
}, 60_000);

afterEach(async () => {
  await rm(worktree, { recursive: true, force: true });
  await rm(repo, { recursive: true, force: true });
  await rm(bundleRoot, { recursive: true, force: true });
});

/** The work an agent would have left behind. */
async function agentWrote(
  options: { identity?: string; result?: string | null; extra?: Record<string, string> } = {},
) {
  await mkdir(join(worktree, 'content', 'graph-only'), { recursive: true });
  await writeFile(
    join(worktree, 'content', 'graph-only', 'state-space-model.yaml'),
    options.identity ?? IDENTITY,
    'utf8',
  );
  for (const [path, contents] of Object.entries(options.extra ?? {})) {
    await mkdir(join(worktree, path, '..'), { recursive: true });
    await writeFile(join(worktree, path), contents, 'utf8');
  }
  if (options.result !== null) {
    await writeFile(join(worktree, PROPOSAL_FILES.result), options.result ?? RESULT, 'utf8');
  }
}

describe('a finished task', () => {
  it('becomes a validated proposal in review', async () => {
    await agentWrote();
    const outcome = await bringBack();

    expect(outcome.problems).toEqual([]);
    expect(outcome.ok).toBe(true);
    expect(outcome.status).toBe('review');
    expect(outcome.filesTouched).toEqual(['content/graph-only/state-space-model.yaml']);
    expect(outcome.patchBytes).toBeGreaterThan(0);

    // The bundle now holds the change, the agent's account of it, and a verdict.
    const patch = await readFile(join(proposalDir, PROPOSAL_FILES.patch), 'utf8');
    expect(patch).toContain('content/graph-only/state-space-model.yaml');
    expect(await readFile(join(proposalDir, PROPOSAL_FILES.result), 'utf8')).toContain(
      'I added no',
    );
    const verdict = JSON.parse(
      await readFile(join(proposalDir, PROPOSAL_FILES.validation), 'utf8'),
    ) as { ok: boolean };
    expect(verdict.ok).toBe(true);
    expect(await statusNow()).toBe('review');
  });

  it('merges nothing and commits nothing, in either tree', async () => {
    await agentWrote();
    const before = git(['rev-parse', 'HEAD'], repo).trim();
    await bringBack();
    expect(git(['rev-parse', 'HEAD'], repo).trim()).toBe(before);
    expect(git(['status', '--porcelain'], repo).trim()).toBe('');
    // The worktree keeps its own change, and its index is untouched.
    expect(existsSync(join(worktree, 'content', 'graph-only', 'state-space-model.yaml'))).toBe(
      true,
    );
    expect(git(['diff', '--cached', '--name-only'], worktree).trim()).toBe('');
  });

  it('ignores what the repository ignores', async () => {
    await agentWrote({ extra: { 'data/personal.db': 'not knowledge', '.navigator/scratch': 'x' } });
    const outcome = await bringBack();
    expect(outcome.filesTouched).toEqual(['content/graph-only/state-space-model.yaml']);
    const patch = await readFile(join(proposalDir, PROPOSAL_FILES.patch), 'utf8');
    expect(patch).not.toContain('personal.db');
    expect(patch).not.toContain('.navigator');
  });
});

describe('a task that went wrong', () => {
  it('imports work that touches an unrelated path, and says it does not validate', async () => {
    await agentWrote({ extra: { 'content/concepts/scratch.md': 'a page nobody asked for\n' } });
    const outcome = await bringBack();

    // It still reaches review: a person has to see what the agent actually did.
    expect(outcome.status).toBe('review');
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('did not allow');
    expect(outcome.filesTouched).toContain('content/concepts/scratch.md');
  });

  it('refuses a worktree of another repository', async () => {
    const foreign = await mkdtemp(join(tmpdir(), 'navigator-foreign-'));
    try {
      await cp(join(REPO_ROOT, 'content'), join(foreign, 'content'), { recursive: true });
      git(['init', '-q'], foreign);
      git(['config', 'user.email', 'test@example.invalid'], foreign);
      git(['config', 'user.name', 'Test'], foreign);
      git(['add', '-A'], foreign);
      git(['commit', '-q', '-m', 'a different repository'], foreign);
      await writeFile(join(foreign, PROPOSAL_FILES.result), RESULT, 'utf8');

      expect(worktreeBelongsTo(repo, foreign)).toBe(false);
      const outcome = await bringBack(foreign);
      expect(outcome.ok).toBe(false);
      expect(outcome.problems.join(' ')).toContain('not a worktree of this repository');
      expect(await statusNow()).toBe('running');
    } finally {
      await rm(foreign, { recursive: true, force: true });
    }
  });

  it('refuses a worktree that is not at the recorded base', async () => {
    await agentWrote();
    // The agent committed its work, against the profile.
    git(['add', '-A'], worktree);
    git(['commit', '-q', '-m', 'committed, which the profile forbids'], worktree);

    const outcome = await bringBack();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('was written against');
    expect(outcome.problems.join(' ')).toContain('left uncommitted');
    expect(await statusNow()).toBe('running');
  });

  it('refuses a worktree with no result', async () => {
    await agentWrote({ result: null });
    const outcome = await bringBack();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('has no RESULT.md');
    expect(outcome.problems.join(' ')).toContain('not a formality');
    expect(existsSync(join(proposalDir, PROPOSAL_FILES.patch))).toBe(false);
  });

  it('refuses a worktree where nothing was written', async () => {
    // RESULT.md is the agent's account of the work, not the work: it is copied
    // into the bundle and kept out of the patch, so a worktree holding only a
    // result has produced nothing to review.
    await writeFile(join(worktree, PROPOSAL_FILES.result), RESULT, 'utf8');
    const outcome = await bringBack();
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('no change at all');
    expect(outcome.status).toBe('running');
    expect(existsSync(join(proposalDir, PROPOSAL_FILES.patch))).toBe(false);
  });

  it('refuses to import a proposal that is past review', async () => {
    await agentWrote();
    for (const status of ['accepted', 'rejected'] as const) {
      await writeBundle(status);
      const outcome = await bringBack();
      expect(outcome.ok, status).toBe(false);
      expect(outcome.problems.join(' ')).toContain(`cannot move from ${status} to review`);
    }
  });

  it('refuses a worktree that is not there at all', async () => {
    await agentWrote();
    const outcome = await bringBack(join(repo, '..', 'no-such-worktree'));
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('no worktree at');
  });
});

describe('invalid content in an otherwise well-formed result', () => {
  it('reaches review carrying the reason it fails', async () => {
    await agentWrote({
      identity:
        'concept_id: concept.deep_learning_architectures.state_space_model\ntitle: State Space Model\n',
    });
    const outcome = await bringBack();
    expect(outcome.status).toBe('review');
    expect(outcome.ok).toBe(false);
    expect(outcome.problems.join(' ')).toContain('content validation failed');
  });
});
