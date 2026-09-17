/**
 * The proposal bundle contract (v2 runbook R00).
 *
 * A proposal is the boundary between work an agent did and knowledge this
 * corpus claims. Everything asserted here is a way that boundary could be
 * crossed by accident: a path that escapes the content directory, a tier that
 * lets the agent pick which contract to meet, a status that quietly rewinds, or
 * a base commit this repository has never seen.
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PROPOSAL_FILES,
  PROPOSAL_TRANSITIONS,
  ProposalError,
  assertBaseCommitPresent,
  assertTransition,
  baseCommitPresent,
  canTransition,
  parseProposalManifest,
  pathProblem,
  proposalManifestSchema,
  proposalStatuses,
  proposalValidationSchema,
  serializeProposalManifest,
} from '../src/proposal.js';
import type { ProposalManifest, ProposalStatus } from '../src/proposal.js';
import { buildProposalJsonSchema } from '../src/json-schema.js';

const BASE = '0'.repeat(40);

function manifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    proposalId: 'p-2026-09-17-mamba',
    targetBacklogId: 'backlog.concept.deep_learning.mamba',
    requestedTier: 3,
    allowedPaths: ['content/graph-only/mamba.yaml'],
    baseCommit: BASE,
    createdAt: '2026-09-17T00:00:00.000Z',
    status: 'prepared',
    ...overrides,
  };
}

describe('the bundle', () => {
  it('names every file a reviewer needs', () => {
    expect(Object.values(PROPOSAL_FILES)).toEqual([
      'manifest.json',
      'REQUEST.md',
      'RESULT.md',
      'changes.patch',
      'validation.json',
    ]);
  });
});

describe('the manifest', () => {
  it('accepts a complete Tier 3 proposal', () => {
    const parsed = parseProposalManifest(manifest());
    expect(parsed.requestedTier).toBe(3);
    expect(parsed.status).toBe('prepared');
    expect(parsed.agent).toBeUndefined();
  });

  it('accepts a Tier 2 proposal that writes Markdown', () => {
    const parsed = parseProposalManifest(
      manifest({ requestedTier: 2, allowedPaths: ['content/concepts/mamba.md'] }),
    );
    expect(parsed.allowedPaths).toEqual(['content/concepts/mamba.md']);
  });

  it('rejects a field nobody defined', () => {
    expect(() => parseProposalManifest(manifest({ notes: 'extra' }))).toThrow(ProposalError);
    try {
      parseProposalManifest(manifest({ notes: 'extra' }));
    } catch (error) {
      expect((error as ProposalError).detail.join(' ')).toContain('notes');
    }
  });

  it('rejects a tier that is not 2 or 3', () => {
    // Tier 1 is the full article contract. It is never delegated.
    expect(() => parseProposalManifest(manifest({ requestedTier: 1 }))).toThrow(ProposalError);
    expect(() => parseProposalManifest(manifest({ requestedTier: 4 }))).toThrow(ProposalError);
  });

  it('refuses to let a tier write the other tier\u2019s file kind', () => {
    expect(() =>
      parseProposalManifest(
        manifest({ requestedTier: 3, allowedPaths: ['content/concepts/x.md'] }),
      ),
    ).toThrow(/only write content\/graph-only/);
    expect(() =>
      parseProposalManifest(
        manifest({ requestedTier: 2, allowedPaths: ['content/graph-only/x.yaml'] }),
      ),
    ).toThrow(/only write content\/concepts/);
  });

  it('requires at least one allowed path and rejects a repeat', () => {
    expect(() => parseProposalManifest(manifest({ allowedPaths: [] }))).toThrow(ProposalError);
    expect(() =>
      parseProposalManifest(
        manifest({
          allowedPaths: ['content/graph-only/mamba.yaml', 'content/graph-only/mamba.yaml'],
        }),
      ),
    ).toThrow(/listed twice/);
  });

  it('carries a reason only when it was rejected', () => {
    expect(() => parseProposalManifest(manifest({ rejectedReason: 'no sources' }))).toThrow(
      /only a rejected proposal carries a reason/,
    );
    expect(
      parseProposalManifest(manifest({ status: 'rejected', rejectedReason: 'no sources' }))
        .rejectedReason,
    ).toBe('no sources');
  });

  it('requires a full commit sha, not a short one', () => {
    expect(() => parseProposalManifest(manifest({ baseCommit: '0123abc' }))).toThrow(
      /40-character commit sha/,
    );
    // Git prints lowercase hex; an uppercase sha is a sign of a hand-edited file.
    expect(() => parseProposalManifest(manifest({ baseCommit: 'A'.repeat(40) }))).toThrow(
      ProposalError,
    );
  });

  it('writes keys in a fixed order so a rewrite is a readable diff', () => {
    const parsed: ProposalManifest = parseProposalManifest(
      manifest({ agent: { name: 'hermes', model: 'qwen3:8b' } }),
    );
    const text = serializeProposalManifest(parsed);
    expect(text.indexOf('"proposalId"')).toBeLessThan(text.indexOf('"targetBacklogId"'));
    expect(text.indexOf('"status"')).toBeLessThan(text.indexOf('"agent"'));
    expect(text.endsWith('\n')).toBe(true);
    // Round-trips through its own parser.
    expect(serializeProposalManifest(parseProposalManifest(JSON.parse(text)))).toBe(text);
  });
});

describe('allowed paths', () => {
  const refused: [string, RegExp][] = [
    ['', /empty/],
    ['/etc/passwd', /absolute/],
    ['/content/concepts/x.md', /absolute/],
    ['C:\\content\\concepts\\x.md', /absolute/],
    ['content/concepts/../../etc/passwd', /\.\. segments/],
    ['../content/concepts/x.md', /\.\. segments/],
    ['content/./concepts/x.md', /\.\. segments/],
    ['content\\concepts\\x.md', /forward slashes/],
    ['~/content/concepts/x.md', /must not start with ~/],
    ['apps/api/src/server.ts', /content\/concepts/],
    ['content/atlas.yaml', /content\/concepts/],
    ['.github/workflows/publish.yml', /content\/concepts/],
    ['content/concepts/Mamba.md', /lowercase/],
    ['content/concepts/mamba.markdown', /content\/concepts/],
    ['content/graph-only/mamba.yml', /content\/graph-only/],
    ['content/concepts/nested/mamba.md', /content\/concepts/],
  ];

  it.each(refused)('refuses %s', (value, expected) => {
    expect(pathProblem(value)).toMatch(expected);
  });

  it('refuses a path carrying a control character', () => {
    expect(pathProblem('content/concepts/mam\u0000ba.md')).toMatch(/control characters/);
    expect(pathProblem('content/concepts/mam\u001fba.md')).toMatch(/control characters/);
  });

  it('accepts the two shapes a content proposal may write', () => {
    expect(pathProblem('content/concepts/residual-connection.md')).toBeUndefined();
    expect(pathProblem('content/graph-only/mamba.yaml')).toBeUndefined();
  });

  it('refuses every bad path through the manifest too', () => {
    for (const [value] of refused) {
      expect(() => parseProposalManifest(manifest({ allowedPaths: [value] }))).toThrow(
        ProposalError,
      );
    }
  });
});

describe('status transitions', () => {
  it('covers every status', () => {
    expect(Object.keys(PROPOSAL_TRANSITIONS).sort()).toEqual([...proposalStatuses].sort());
  });

  it('never returns to prepared, and never leaves superseded', () => {
    for (const from of proposalStatuses) {
      expect(canTransition(from, 'prepared')).toBe(false);
    }
    expect(PROPOSAL_TRANSITIONS.superseded).toEqual([]);
  });

  it('allows the moves the workflow needs', () => {
    expect(canTransition('prepared', 'running')).toBe(true);
    expect(canTransition('running', 'review')).toBe(true);
    expect(canTransition('review', 'accepted')).toBe(true);
    expect(canTransition('review', 'rejected')).toBe(true);
    expect(canTransition('prepared', 'review')).toBe(true);
  });

  it('refuses the moves that would hide a history', () => {
    const invalid: [ProposalStatus, ProposalStatus][] = [
      ['prepared', 'accepted'],
      ['running', 'accepted'],
      ['accepted', 'rejected'],
      ['rejected', 'accepted'],
      ['accepted', 'review'],
      ['superseded', 'accepted'],
      ['review', 'running'],
    ];
    for (const [from, to] of invalid) {
      expect(canTransition(from, to), `${from} -> ${to}`).toBe(false);
      expect(() => assertTransition(from, to)).toThrow(ProposalError);
    }
  });

  it('says what was allowed instead when it refuses', () => {
    try {
      assertTransition('prepared', 'accepted');
    } catch (error) {
      expect((error as ProposalError).detail.join(' ')).toContain('running');
    }
    try {
      assertTransition('superseded', 'review');
    } catch (error) {
      expect((error as ProposalError).detail.join(' ')).toContain('final');
    }
  });
});

describe('the base commit', () => {
  let repo = '';
  let head = '';

  beforeAll(async () => {
    repo = await mkdtemp(join(tmpdir(), 'navigator-proposal-repo-'));
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
    git('init', '-q');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'user.name', 'Test');
    git('commit', '-q', '--allow-empty', '-m', 'base');
    head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  });

  afterAll(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  it('accepts a commit this repository has', () => {
    expect(baseCommitPresent(repo, head)).toBe(true);
    expect(() => assertBaseCommitPresent(repo, head)).not.toThrow();
  });

  it('refuses a commit it has never seen', () => {
    expect(baseCommitPresent(repo, 'f'.repeat(40))).toBe(false);
    expect(() => assertBaseCommitPresent(repo, 'f'.repeat(40))).toThrow(
      /is not in this repository/,
    );
  });

  it('refuses something that is not a commit sha at all', () => {
    expect(baseCommitPresent(repo, 'HEAD')).toBe(false);
    expect(baseCommitPresent(repo, '')).toBe(false);
    // A tree is not a commit, even though git knows the object.
    const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim();
    expect(baseCommitPresent(repo, tree)).toBe(false);
  });
});

describe('the validation verdict', () => {
  it('records what passed as well as what failed', () => {
    const parsed = proposalValidationSchema.parse({
      proposalId: 'p-2026-09-17-mamba',
      checkedAt: '2026-09-17T00:00:00.000Z',
      ok: false,
      problems: ['the patch touches apps/api/src/server.ts, which is not an allowed path'],
      passed: ['the patch applies to the recorded base'],
      filesTouched: ['apps/api/src/server.ts'],
    });
    expect(parsed.ok).toBe(false);
    expect(parsed.problems).toHaveLength(1);
  });

  it('rejects an unknown field', () => {
    expect(() =>
      proposalValidationSchema.parse({
        proposalId: 'p-2026-09-17-mamba',
        checkedAt: '2026-09-17T00:00:00.000Z',
        ok: true,
        problems: [],
        passed: [],
        filesTouched: [],
        verdict: 'looks fine',
      }),
    ).toThrow();
  });
});

describe('the published JSON Schema', () => {
  it('is generated from the Zod schema and closed to unknown fields', () => {
    const schema = buildProposalJsonSchema() as Record<string, unknown>;
    expect(schema['$id']).toContain('proposal.schema.json');
    expect(schema['additionalProperties']).toBe(false);
    expect((schema['required'] as string[]).sort()).toEqual(
      [
        'allowedPaths',
        'baseCommit',
        'createdAt',
        'proposalId',
        'requestedTier',
        'status',
        'targetBacklogId',
      ].sort(),
    );
  });

  it('says plainly which rules it cannot express', () => {
    const description = String(
      (buildProposalJsonSchema() as Record<string, unknown>)['description'],
    );
    for (const rule of ['parent traversal', 'Tier 2', 'base commit', 'PROPOSAL_TRANSITIONS']) {
      expect(description).toContain(rule);
    }
  });

  it('is stable across two builds', () => {
    expect(JSON.stringify(buildProposalJsonSchema())).toBe(
      JSON.stringify(buildProposalJsonSchema()),
    );
  });
});

describe('what the schema alone cannot catch', () => {
  it('still parses a manifest whose base commit is absent, which is why the check is separate', () => {
    // The schema is a shape check. Whether the commit exists is a fact about
    // this machine, so it is asserted where the bundle is used, not here.
    expect(proposalManifestSchema.safeParse(manifest()).success).toBe(true);
  });
});
