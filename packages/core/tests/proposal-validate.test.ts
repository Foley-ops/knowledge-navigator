/**
 * Validating a proposal (v2 runbook R02).
 *
 * Every case here is a way work coming back from an agent has actually gone
 * wrong: a change that quietly edits something else, a review state promoted by
 * the writer, an id rewritten to a nicer name, a file that no longer validates,
 * a key pasted into prose, a summary nobody wrote, and a patch that does not
 * apply to what it claims.
 *
 * The whole thing runs in a temporary git repository holding a copy of the real
 * corpus, so "the corpus still validates" means the same thing here as it does
 * in the product.
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
  serializeProposalManifest,
  parseProposalManifest,
} from '../src/proposal.js';
import { validateProposal, writeProposalValidation } from '../src/proposal-validate.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CHECKED_AT = '2026-09-17T00:00:00.000Z';

const AREA = 'Artificial Intelligence/Deep Learning — Architectures';

/** A valid Tier 3 identity, the thing a proposal is usually asked for. */
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

Wrote content/graph-only/state-space-model.yaml as a Tier 3 identity. I did not
add sources: I have not read a primary source for this family, and an identity
makes no claim that would need one. Nothing else was touched.
`;

let repo = '';
let base = '';
/** The bundle lives outside the repository, exactly as .navigator/ is ignored. */
let bundleRoot = '';
let proposalDir = '';

function git(args: string[], cwd = repo): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/** Build a patch by staging files in the repository, then undoing the change. */
function patchFor(changes: Record<string, string | null>): string {
  for (const [path, contents] of Object.entries(changes)) {
    const full = join(repo, path);
    if (contents === null) {
      execFileSync('rm', ['-f', full]);
    } else {
      execFileSync('mkdir', ['-p', join(full, '..')]);
      execFileSync('sh', ['-c', `cat > ${JSON.stringify(full)}`], { input: contents });
    }
  }
  git(['add', '-A']);
  const patch = git(['diff', '--cached', '--binary']);
  git(['reset', '--hard', 'HEAD']);
  git(['clean', '-fd']);
  return patch;
}

async function writeBundle(options: {
  allowedPaths: string[];
  tier?: 2 | 3;
  patch?: string;
  result?: string | null;
  baseCommit?: string;
}): Promise<void> {
  await mkdir(proposalDir, { recursive: true });
  const manifest = parseProposalManifest({
    proposalId: 'p-20260917-state-space-model',
    targetBacklogId: 'candidate.artificial_intelligence.deep_learning.state_space_model',
    requestedTier: options.tier ?? 3,
    allowedPaths: options.allowedPaths,
    baseCommit: options.baseCommit ?? base,
    createdAt: CHECKED_AT,
    status: 'prepared',
  });
  await writeFile(
    join(proposalDir, PROPOSAL_FILES.manifest),
    serializeProposalManifest(manifest),
    'utf8',
  );
  await writeFile(join(proposalDir, PROPOSAL_FILES.request), '# Request\n', 'utf8');
  if (options.result !== null) {
    await writeFile(join(proposalDir, PROPOSAL_FILES.result), options.result ?? RESULT, 'utf8');
  }
  if (options.patch !== undefined) {
    await writeFile(join(proposalDir, PROPOSAL_FILES.patch), options.patch, 'utf8');
  }
}

function check() {
  return validateProposal({ repoRoot: repo, proposalDir, now: () => CHECKED_AT });
}

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), 'navigator-validate-repo-'));
  await cp(join(REPO_ROOT, 'content'), join(repo, 'content'), { recursive: true });
  git(['init', '-q']);
  git(['config', 'user.email', 'test@example.invalid']);
  git(['config', 'user.name', 'Test']);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'corpus']);
  base = git(['rev-parse', 'HEAD']).trim();
  bundleRoot = await mkdtemp(join(tmpdir(), 'navigator-validate-bundle-'));
  proposalDir = join(bundleRoot, 'p-20260917-state-space-model');
}, 60_000);

afterEach(async () => {
  await rm(repo, { recursive: true, force: true, maxRetries: 10 });
  await rm(bundleRoot, { recursive: true, force: true, maxRetries: 10 });
});

describe('a proposal that did what it was asked', () => {
  it('passes every check and says which ones', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({ 'content/graph-only/state-space-model.yaml': IDENTITY }),
    });

    const { validation } = await check();
    expect(validation.problems).toEqual([]);
    expect(validation.ok).toBe(true);
    expect(validation.filesTouched).toEqual(['content/graph-only/state-space-model.yaml']);
    expect(validation.passed).toContain('the patch applies cleanly to the recorded base commit');
    expect(validation.passed).toContain('every file the patch touches is one the proposal allowed');
    expect(validation.passed).toContain('the corpus still validates with the patch applied');
    expect(validation.passed).toContain('a reviewer summary is present');
    expect(validation.checkedAt).toBe(CHECKED_AT);
  });

  it('writes its verdict beside the bundle', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({ 'content/graph-only/state-space-model.yaml': IDENTITY }),
    });
    const { validation } = await check();
    const path = await writeProposalValidation(proposalDir, validation);
    const written = JSON.parse(await readFile(path, 'utf8')) as { ok: boolean };
    expect(written.ok).toBe(true);
  });

  it('leaves the repository exactly as it found it', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({ 'content/graph-only/state-space-model.yaml': IDENTITY }),
    });
    await check();
    expect(git(['status', '--porcelain']).trim()).toBe('');
    expect(git(['rev-parse', 'HEAD']).trim()).toBe(base);
  });
});

describe('a proposal that went outside its lines', () => {
  it('rejects a file the manifest did not allow', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({
        'content/graph-only/state-space-model.yaml': IDENTITY,
        'content/atlas.yaml': `schema_version: 1\nareas: []\ncandidates: []\n`,
      }),
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('did not allow');
    expect(validation.problems.join(' ')).toContain('content/atlas.yaml');
  });

  it('rejects a patch that reaches outside the repository', async () => {
    // git itself refuses a path that climbs out of the tree; the proposal is
    // rejected either way, and the reviewer is told rather than left guessing.
    const hostile = [
      'diff --git a/content/concepts/../../etc/passwd b/content/concepts/../../etc/passwd',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/content/concepts/../../etc/passwd',
      '@@ -0,0 +1 @@',
      '+root:x:0:0',
      '',
    ].join('\n');
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: hostile,
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.length).toBeGreaterThan(0);
  });

  it('rejects a deletion', async () => {
    await writeBundle({
      tier: 2,
      allowedPaths: ['content/concepts/vgg.md'],
      patch: patchFor({ 'content/concepts/vgg.md': null }),
    });
    const { validation } = await check();
    expect(validation.problems.join(' ')).toContain('deletes');
  });
});

describe('a proposal that promoted its own work', () => {
  it('rejects a raised review state on an existing page', async () => {
    const before = await readFile(join(repo, 'content', 'concepts', 'vgg.md'), 'utf8');
    await writeBundle({
      tier: 2,
      allowedPaths: ['content/concepts/vgg.md'],
      patch: patchFor({
        'content/concepts/vgg.md': before.replace(
          'review_state: generated-draft',
          'review_state: source-checked',
        ),
      }),
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('raises its review state');
    expect(validation.problems.join(' ')).toContain('only a human who checked the sources');
  });

  it('rejects a new file that is not a generated draft', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({
        'content/graph-only/state-space-model.yaml': IDENTITY.replace(
          'review_state: generated-draft',
          'review_state: expert-reviewed',
        ),
      }),
    });
    const { validation } = await check();
    expect(validation.problems.join(' ')).toContain('agent work is always generated-draft');
  });

  it('allows lowering a review state to disputed-or-conditional', async () => {
    const before = await readFile(join(repo, 'content', 'concepts', 'vgg.md'), 'utf8');
    await writeBundle({
      tier: 2,
      allowedPaths: ['content/concepts/vgg.md'],
      patch: patchFor({
        'content/concepts/vgg.md': before.replace(
          'review_state: generated-draft',
          'review_state: disputed-or-conditional',
        ),
      }),
    });
    const { validation } = await check();
    expect(validation.problems.join(' ')).not.toContain('raises its review state');
  });
});

describe('a proposal that moved an address', () => {
  it('rejects a changed concept id or slug', async () => {
    const before = await readFile(join(repo, 'content', 'concepts', 'vgg.md'), 'utf8');
    await writeBundle({
      tier: 2,
      allowedPaths: ['content/concepts/vgg.md'],
      patch: patchFor({
        'content/concepts/vgg.md': before.replace(
          'concept_id: concept.deep_learning.vgg',
          'concept_id: concept.deep_learning.vgg_net',
        ),
      }),
    });
    const { validation } = await check();
    expect(validation.problems.join(' ')).toContain('identifiers are permanent addresses');
  });
});

describe('a proposal whose content does not hold up', () => {
  it('rejects content the corpus validator refuses', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({
        // No summary, no categories: a shape the loader rejects outright.
        'content/graph-only/state-space-model.yaml': `concept_id: concept.deep_learning_architectures.state_space_model
title: State Space Model
slug: /concepts/state-space-model
kind: concept
tier: 3
review_state: generated-draft
`,
      }),
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('content validation failed');
  });

  it('rejects a secret pasted into prose', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({
        'content/graph-only/state-space-model.yaml': IDENTITY.replace(
          'A family of sequence models that carry a latent state through time.',
          'Reproduced with api_key sk-abcdefghijklmnopqrstuvwxyz012345',
        ),
      }),
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('secret-shaped');
  });
});

describe('a proposal that is not finished', () => {
  it('rejects a missing reviewer summary', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({ 'content/graph-only/state-space-model.yaml': IDENTITY }),
      result: null,
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('what was done and what could not be checked');
  });

  it('rejects a summary that says almost nothing', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({ 'content/graph-only/state-space-model.yaml': IDENTITY }),
      result: '# Result\n\nDone.\n',
    });
    const { validation } = await check();
    expect(validation.problems.join(' ')).toContain('says almost nothing');
  });

  it('rejects an empty patch and a missing one', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: '',
    });
    expect((await check()).validation.problems.join(' ')).toContain('produced no change');

    await rm(join(proposalDir, PROPOSAL_FILES.patch));
    expect((await check()).validation.problems.join(' ')).toContain('there is no changes.patch');
  });
});

describe('a proposal that does not apply', () => {
  it('rejects a patch whose context is not in the base', async () => {
    const stale = [
      'diff --git a/content/concepts/vgg.md b/content/concepts/vgg.md',
      '--- a/content/concepts/vgg.md',
      '+++ b/content/concepts/vgg.md',
      '@@ -1,3 +1,3 @@',
      '-a line that is not in this file',
      '+a replacement for it',
      ' another line that is not there either',
      '',
    ].join('\n');
    await writeBundle({ tier: 2, allowedPaths: ['content/concepts/vgg.md'], patch: stale });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('does not apply to the recorded base commit');
  });

  it('rejects a base commit this repository does not have', async () => {
    await writeBundle({
      allowedPaths: ['content/graph-only/state-space-model.yaml'],
      patch: patchFor({ 'content/graph-only/state-space-model.yaml': IDENTITY }),
      baseCommit: 'f'.repeat(40),
    });
    const { validation } = await check();
    expect(validation.ok).toBe(false);
    expect(validation.problems.join(' ')).toContain('is not in this repository');
    // Nothing further is claimed: with no base there is nothing to check against.
    expect(validation.filesTouched).toEqual([]);
  });
});

describe('a bundle that is not a bundle', () => {
  it('refuses a directory with no manifest', async () => {
    await mkdir(proposalDir, { recursive: true });
    await expect(check()).rejects.toThrow(ProposalError);
  });

  it('refuses a manifest that is not valid', async () => {
    await mkdir(proposalDir, { recursive: true });
    await writeFile(
      join(proposalDir, PROPOSAL_FILES.manifest),
      JSON.stringify({ proposalId: 'nope' }),
      'utf8',
    );
    await expect(check()).rejects.toThrow(/not valid/);
  });
});
