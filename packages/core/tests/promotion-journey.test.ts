/**
 * One complete coverage promotion, end to end (v2 runbook T01).
 *
 * This is the living-content loop, run once for real: a candidate on the map
 * becomes a Tier 3 identity, a page that was waiting on it stops waiting, the
 * identity is promoted to a Tier 2 page through the proposal machinery, and the
 * result compiles, inspects, searches, compares and orders into a path.
 *
 * It all happens in a temporary git repository with its own small corpus, which
 * is removed afterwards. The production corpus is never touched — and that is
 * asserted, not assumed.
 *
 * The property the whole journey defends: **the address survives**. The concept
 * id and the slug a reader or a relationship points at are the same before the
 * first promotion, between the two, and after the second. The review state stays
 * `generated-draft` throughout, because nobody checked anything against a source.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compileCorpus } from '../src/compile.js';
import { openDatabaseReadOnly } from '../src/db.js';
import { listBacklog, listCandidates } from '../src/coverage.js';
import { getConceptById, searchConcepts } from '../src/query.js';
import { compareConcepts } from '../src/compare.js';
import { buildLearningPath } from '../src/learning-paths.js';
import { PROPOSAL_FILES, serializeProposalManifest } from '../src/proposal.js';
import { prepareProposal } from '../src/proposal-request.js';
import { validateProposal } from '../src/proposal-validate.js';
import { acceptProposal } from '../src/proposal-accept.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const PRODUCTION = fileURLToPath(new URL('../../..', import.meta.url));
const AREA = 'Artificial Intelligence/Deep Learning';
const CANDIDATE = 'candidate.artificial_intelligence.deep_learning.state_space_model';

/** The address that must survive both promotions. */
const IDENTITY_ID = 'concept.deep_learning.state_space_model';
const IDENTITY_SLUG = '/concepts/state-space-model';

const ATLAS_TEMPLATE = (status: string, canonical: string) => `schema_version: 1
areas:
  - area_id: atlas.mathematics
    title: Mathematics
    categories:
      - category_id: atlas.mathematics.analysis
        title: Analysis
        parent_id: atlas.mathematics
  - area_id: atlas.artificial_intelligence
    title: Artificial Intelligence
    categories:
      - category_id: atlas.artificial_intelligence.deep_learning
        title: Deep Learning
        parent_id: atlas.artificial_intelligence
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates:
  - candidate_id: ${CANDIDATE}
    title: State Space Model
    categories:
      - atlas.artificial_intelligence.deep_learning
    status: ${status}
    canonical_concept_id: ${canonical}
`;

/** A page that needs the idea and cannot link to it yet. */
const MAMBA = (unresolved: boolean) => `---
concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases: []
kind: method
tier: 1
review_state: generated-draft
summary: A selective state-space sequence model.
categories:
  - ${AREA}
primary_category: ${AREA}
relationships:
${
  unresolved
    ? `  - type: contrasts_with
    target: concept.deep_learning.transformer`
    : `  - type: requires
    target: ${IDENTITY_ID}
    note: Mamba is one member of the state-space family.`
}
sources:
  - source_id: source.gu2023.mamba
    title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
    url: https://arxiv.org/abs/2312.00752
    source_kind: preprint
    supports:
      - definition
    checked_on: 2026-09-16
${
  unresolved
    ? `unresolved_references:
  - label: State Space Model
    reason: The family this belongs to has no identity in this corpus yet.
    sections:
      - definition
    blocking: true
    proposed_kind: concept
    proposed_categories:
      - ${AREA}`
    : 'unresolved_references: []'
}
claims: []
---

${tier1Body()}`;

const TRANSFORMER = conceptMarkdown({
  conceptId: 'concept.deep_learning.transformer',
  title: 'Transformer',
  slug: '/concepts/transformer',
  aliases: [],
  kind: 'method',
  tier: 1,
  categories: [AREA],
  relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.mamba' }],
  body: tier1Body(),
});

const TIER_3 = `concept_id: ${IDENTITY_ID}
title: State Space Model
slug: ${IDENTITY_SLUG}
aliases:
  - state space models
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

/** The Tier 2 page the promotion produces. */
const TIER_2 = `---
concept_id: ${IDENTITY_ID}
title: State Space Model
slug: ${IDENTITY_SLUG}
aliases:
  - state space models
kind: concept
tier: 2
review_state: generated-draft
summary: A family of sequence models that carry a latent state through time.
categories:
  - ${AREA}
primary_category: ${AREA}
relationships:
  - type: prerequisite_of
    target: concept.deep_learning.mamba
    note: Mamba is one member of this family.
sources:
  - source_id: source.gu2023.mamba
    title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
    url: https://arxiv.org/abs/2312.00752
    source_kind: preprint
    supports:
      - definition
    checked_on: 2026-09-16
unresolved_references: []
claims: []
---

A state space model carries a latent state forward through a sequence and reads
each observation against it. This stub records what the name denotes; it has not
been checked against a primary source by a person.
`;

const RESULT = `# Result

Promoted the graph-only identity to a Tier 2 stub, keeping ${IDENTITY_ID} and
${IDENTITY_SLUG} exactly as they were. One source is listed, the one the Mamba
page already cites; I have not read anything else for this family, and the stub
says so. npm run validate and npm run compile pass.
`;

let repo = '';
let bundleRoot = '';
let productionHashBefore = '';

function git(args: string[], cwd = repo): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

async function write(path: string, contents: string): Promise<void> {
  await mkdir(join(repo, path, '..'), { recursive: true });
  await writeFile(join(repo, path), contents, 'utf8');
}

async function compile(): Promise<DatabaseType> {
  const databasePath = join(repo, 'data', 'knowledge.db');
  const result = await compileCorpus({
    contentDir: join(repo, 'content', 'concepts'),
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    throw new Error(
      `the fixture corpus did not compile: ${result.diagnostics
        .map((d) => `${d.file} ${d.field}: ${d.message}`)
        .join('; ')}`,
    );
  }
  return openDatabaseReadOnly(databasePath);
}

/** Whether a compiled identity has an article behind it. */
function hasArticle(db: DatabaseType, conceptId: string): boolean {
  const row = db.prepare('SELECT has_article FROM concepts WHERE id = ?').get(conceptId) as
    { has_article: number } | undefined;
  return row?.has_article === 1;
}

function commit(message: string): string {
  git(['add', '-A']);
  git(['commit', '-q', '-m', message]);
  return git(['rev-parse', 'HEAD']).trim();
}

beforeAll(async () => {
  repo = await mkdtemp(join(tmpdir(), 'navigator-promotion-'));
  bundleRoot = await mkdtemp(join(tmpdir(), 'navigator-promotion-bundle-'));

  await write('content/concepts/mamba.md', MAMBA(true));
  await write('content/concepts/transformer.md', TRANSFORMER);
  await write('content/atlas.yaml', ATLAS_TEMPLATE('candidate', 'null'));
  await write('.gitignore', 'data/\n');

  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'test@example.invalid']);
  git(['config', 'user.name', 'Test']);
  commit('a small corpus with one gap');

  // What production looks like before any of this. Nothing below may change it.
  productionHashBefore = execFileSync('git', ['status', '--porcelain', 'content'], {
    cwd: PRODUCTION,
    encoding: 'utf8',
  });
}, 120_000);

afterAll(async () => {
  await rm(repo, { recursive: true, force: true });
  await rm(bundleRoot, { recursive: true, force: true });
});

describe('the living-content loop, once, for real', () => {
  it('starts with a candidate nobody has written and a page waiting on it', async () => {
    const db = await compile();
    try {
      const candidate = listCandidates(db).items.find((item) => item.candidateId === CANDIDATE);
      expect(candidate?.status).toBe('candidate');
      expect(candidate?.canonicalConceptId).toBeNull();

      const backlog = listBacklog(db).items;
      expect(backlog).toHaveLength(1);
      expect(backlog[0]?.label).toBe('State Space Model');
      expect(backlog[0]?.blocking).toBe(true);
      expect(backlog[0]?.sources[0]?.conceptId).toBe('concept.deep_learning.mamba');
    } finally {
      db.close();
    }
  });

  it('promotes the candidate to a Tier 3 identity, resolving the reference with it', async () => {
    // These happen together because the product insists on it: an unresolved
    // reference whose label now resolves is a validation error, so writing the
    // identity without linking the page that was waiting would not compile.
    await write('content/graph-only/state-space-model.yaml', TIER_3);
    await write('content/atlas.yaml', ATLAS_TEMPLATE('covered', IDENTITY_ID));
    await write('content/concepts/mamba.md', MAMBA(false));
    commit('promote the candidate to a graph-only identity and link the page waiting on it');

    const db = await compile();
    try {
      const identity = getConceptById(db, IDENTITY_ID);
      expect(identity?.tier).toBe(3);
      expect(identity?.slug).toBe(IDENTITY_SLUG);
      expect(identity?.reviewState).toBe('generated-draft');
      expect(hasArticle(db, IDENTITY_ID)).toBe(false);

      const candidate = listCandidates(db).items.find((item) => item.candidateId === CANDIDATE);
      expect(candidate?.status).toBe('covered');
      expect(candidate?.canonicalConceptId).toBe(IDENTITY_ID);

      // Nothing is waiting any more.
      expect(listBacklog(db).items).toHaveLength(0);

      // And the relationship points at a real identity with no article.
      const path = buildLearningPath(db, 'concept.deep_learning.mamba');
      expect(path.reachable).toBe(true);
      expect(path.steps.map((step) => step.conceptId)).toEqual([
        IDENTITY_ID,
        'concept.deep_learning.mamba',
      ]);
      expect(path.steps[0]?.hasArticle).toBe(false);
    } finally {
      db.close();
    }
  });

  it('prepares a Tier 2 proposal that keeps the address it is promoting', async () => {
    const db = await compile();
    try {
      const prepared = prepareProposal(db, {
        targetId: CANDIDATE,
        tier: 2,
        proposalId: 'p-20260917-state-space-model',
        createdAt: '2026-09-17T00:00:00.000Z',
        baseCommit: git(['rev-parse', 'HEAD']).trim(),
      });

      // The brief does not derive a new address: it carries the existing one.
      expect(prepared.conceptId).toBe(IDENTITY_ID);
      expect(prepared.slug).toBe(IDENTITY_SLUG);
      expect(prepared.manifest.allowedPaths).toEqual([
        'content/concepts/state-space-model.md',
        'content/graph-only/state-space-model.yaml',
      ]);
      expect(prepared.request).toContain('## The two files this promotion touches');
      expect(prepared.request).toContain('gaining an article');

      const dir = join(bundleRoot, prepared.manifest.proposalId);
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, PROPOSAL_FILES.manifest),
        serializeProposalManifest({ ...prepared.manifest, status: 'review' }),
        'utf8',
      );
      await writeFile(join(dir, PROPOSAL_FILES.request), prepared.request, 'utf8');
      await writeFile(join(dir, PROPOSAL_FILES.result), RESULT, 'utf8');
    } finally {
      db.close();
    }
  });

  it('validates the promotion patch, including the file it removes', async () => {
    const dir = join(bundleRoot, 'p-20260917-state-space-model');

    // The change an agent would have produced: the page appears, the identity
    // file goes away, and nothing else moves.
    await write('content/concepts/state-space-model.md', TIER_2);
    await rm(join(repo, 'content', 'graph-only', 'state-space-model.yaml'));
    git(['add', '-A']);
    const patch = git(['diff', '--cached', '--binary']);
    await writeFile(join(dir, PROPOSAL_FILES.patch), patch, 'utf8');
    git(['reset', '--hard', 'HEAD']);
    git(['clean', '-fd']);

    const { validation } = await validateProposal({
      repoRoot: repo,
      proposalDir: dir,
      now: () => '2026-09-17T00:00:00.000Z',
    });
    expect(validation.problems).toEqual([]);
    expect(validation.ok).toBe(true);
    expect(validation.filesTouched.sort()).toEqual([
      'content/concepts/state-space-model.md',
      'content/graph-only/state-space-model.yaml',
    ]);
    expect(validation.passed.join(' ')).toContain('keeping its address');
  });

  it('accepts it with an explicit confirmation, on a branch, uncommitted', async () => {
    const dir = join(bundleRoot, 'p-20260917-state-space-model');
    const outcome = await acceptProposal({
      repoRoot: repo,
      proposalDir: dir,
      confirm: 'p-20260917-state-space-model',
    });
    expect(outcome.problems).toEqual([]);
    expect(outcome.ok).toBe(true);
    expect(git(['rev-parse', '--abbrev-ref', 'HEAD']).trim()).toBe(
      'content/p-20260917-state-space-model',
    );
    expect(git(['diff', '--cached', '--name-only']).trim().split('\n').sort()).toEqual([
      'content/concepts/state-space-model.md',
      'content/graph-only/state-space-model.yaml',
    ]);
    // Applied, not committed: the last step is a person.
    expect(git(['log', '--oneline']).split('\n')).toHaveLength(
      git(['log', '--oneline', 'main']).split('\n').length,
    );
  });

  it('compiles, inspects, searches, compares and orders the promoted page', async () => {
    const db = await compile();
    try {
      const promoted = getConceptById(db, IDENTITY_ID);
      expect(promoted?.tier).toBe(2);
      expect(hasArticle(db, IDENTITY_ID)).toBe(true);

      // The address survived both promotions, and so did the review state.
      expect(promoted?.id).toBe(IDENTITY_ID);
      expect(promoted?.slug).toBe(IDENTITY_SLUG);
      expect(promoted?.reviewState).toBe('generated-draft');

      // It is findable by its alias.
      const hits = searchConcepts(db, 'state space models', 5);
      expect(hits.map((hit) => hit.conceptId)).toContain(IDENTITY_ID);

      // It compares, with its missing sections marked rather than blank.
      const comparison = compareConcepts(db, [IDENTITY_ID, 'concept.deep_learning.mamba']);
      const definition = comparison.rows.find((row) => row.key === 'definition');
      expect(definition?.cells[0]?.missing).toBe('no-section');
      expect(comparison.completeness.missing).toBeGreaterThan(0);
      expect(comparison.concepts[0]?.reviewState).toBe('generated-draft');

      // And it orders a path, now as a page rather than an address.
      const path = buildLearningPath(db, 'concept.deep_learning.mamba');
      expect(path.steps.map((step) => step.conceptId)).toEqual([
        IDENTITY_ID,
        'concept.deep_learning.mamba',
      ]);
      expect(path.steps[0]?.hasArticle).toBe(true);
      expect(path.steps[0]?.tier).toBe(2);
    } finally {
      db.close();
    }
  });

  it('left the production corpus exactly as it found it', () => {
    const now = execFileSync('git', ['status', '--porcelain', 'content'], {
      cwd: PRODUCTION,
      encoding: 'utf8',
    });
    expect(now).toBe(productionHashBefore);
    expect(existsSync(join(PRODUCTION, 'content', 'graph-only', 'state-space-model.yaml'))).toBe(
      false,
    );
    expect(existsSync(join(PRODUCTION, 'content', 'concepts', 'state-space-model.md'))).toBe(false);
  });

  it('did all of it in a directory that is about to stop existing', async () => {
    expect(repo.startsWith(tmpdir())).toBe(true);
    expect(
      await readFile(join(repo, 'content', 'concepts', 'state-space-model.md'), 'utf8'),
    ).toContain(IDENTITY_ID);
  });
});
