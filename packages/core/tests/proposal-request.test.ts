/**
 * Generating a proposal request (v2 runbook R01).
 *
 * The brief is the whole specification an agent gets. Two properties matter:
 * it is derived from the corpus rather than written, so the same target and
 * base commit produce it byte for byte; and it never guesses an address, since
 * a concept id and a slug are permanent and a guessed one is permanent too.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compileCorpus } from '../src/compile.js';
import { openDatabaseReadOnly } from '../src/db.js';
import { listBacklog } from '../src/coverage.js';
import { ProposalError, parseProposalManifest } from '../src/proposal.js';
import {
  conceptIdFor,
  findProposalTarget,
  labelIsAddressable,
  prepareProposal,
  slugNameFromLabel,
} from '../src/proposal-request.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const AREA = 'Artificial Intelligence/Deep Learning';
const SEARCH = 'Artificial Intelligence/Symbolic AI';
const BASE = 'a'.repeat(40);
const CREATED = '2026-09-17T00:00:00.000Z';

const ATLAS = `schema_version: 1
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
      - category_id: atlas.artificial_intelligence.symbolic_ai
        title: Symbolic AI
        parent_id: atlas.artificial_intelligence
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates:
  - candidate_id: candidate.artificial_intelligence.deep_learning.state_space_model
    title: State Space Model
    categories:
      - atlas.artificial_intelligence.deep_learning
    status: candidate
    canonical_concept_id: null
    note: A family the corpus keeps brushing against.
  - candidate_id: candidate.artificial_intelligence.symbolic_ai.a_star
    title: A*
    categories:
      - atlas.artificial_intelligence.symbolic_ai
    status: candidate
    canonical_concept_id: null
  - candidate_id: candidate.artificial_intelligence.deep_learning.attention
    title: Attention
    categories:
      - atlas.artificial_intelligence.deep_learning
      - atlas.artificial_intelligence.symbolic_ai
    status: candidate
    canonical_concept_id: null
`;

/** A page that needed an idea this corpus does not have. */
const RESNET = `---
concept_id: concept.deep_learning.resnet
title: ResNet
slug: /concepts/resnet
aliases: []
kind: method
tier: 1
review_state: generated-draft
summary: A deep network built from residual blocks.
categories:
  - ${AREA}
primary_category: ${AREA}
relationships:
  - type: contrasts_with
    target: concept.deep_learning.vgg
sources:
  - source_id: source.he2016.deep_residual_learning
    title: "Deep Residual Learning for Image Recognition"
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - definition
    checked_on: 2026-09-16
unresolved_references:
  - label: Layer Normalization
    reason: The normalisation this architecture is usually compared against has no page here.
    sections:
      - variants-and-alternatives
    blocking: true
    proposed_kind: method
    proposed_categories:
      - ${AREA}
claims: []
---

${tier1Body()}`;

const VGG = conceptMarkdown({
  conceptId: 'concept.deep_learning.vgg',
  title: 'VGG',
  slug: '/concepts/vgg',
  aliases: [],
  kind: 'method',
  tier: 1,
  categories: [AREA],
  relationships: [],
  body: tier1Body(),
});

let root = '';
let db: DatabaseType;
let backlogId = '';

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-request-'));
  const contentDir = join(root, 'content', 'concepts');
  await mkdir(contentDir, { recursive: true });
  await writeFile(join(contentDir, 'resnet.md'), RESNET, 'utf8');
  await writeFile(join(contentDir, 'vgg.md'), VGG, 'utf8');
  await writeFile(join(root, 'content', 'atlas.yaml'), ATLAS, 'utf8');

  const result = await compileCorpus({
    contentDir,
    databasePath: join(root, 'knowledge.db'),
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    throw new Error(
      `fixture did not compile: ${result.diagnostics.map((d) => `${d.file} ${d.field}: ${d.message}`).join('; ')}`,
    );
  }
  db = openDatabaseReadOnly(join(root, 'knowledge.db'));
  const group = listBacklog(db).items[0];
  if (group === undefined) throw new Error('the fixture produced no unresolved-reference group');
  backlogId = group.groupId;
});

afterAll(async () => {
  db.close();
  await rm(root, { recursive: true, force: true });
});

function prepare(targetId: string, overrides: Record<string, unknown> = {}) {
  return prepareProposal(db, {
    targetId,
    tier: 3,
    proposalId: 'p-20260917-fixed',
    createdAt: CREATED,
    baseCommit: BASE,
    ...overrides,
  });
}

describe('finding the target', () => {
  it('finds an atlas candidate with its categories and note', () => {
    const target = findProposalTarget(
      db,
      'candidate.artificial_intelligence.deep_learning.state_space_model',
    );
    expect(target?.kind).toBe('atlas-candidate');
    expect(target?.label).toBe('State Space Model');
    expect(target?.note).toContain('brushing against');
    expect(target?.categories.map((category) => category.categoryId)).toEqual([
      'atlas.artificial_intelligence.deep_learning',
    ]);
    expect(target?.sources).toEqual([]);
  });

  it('finds an unresolved-reference group with the pages waiting on it', () => {
    const target = findProposalTarget(db, backlogId);
    expect(target?.kind).toBe('unresolved-reference');
    expect(target?.label).toBe('Layer Normalization');
    expect(target?.blocking).toBe(true);
    expect(target?.sources.map((source) => source.conceptId)).toEqual([
      'concept.deep_learning.resnet',
    ]);
    expect(target?.sources[0]?.sections).toEqual(['variants-and-alternatives']);
  });

  it('returns nothing for an id from neither list', () => {
    expect(findProposalTarget(db, 'candidate.nope.nope')).toBeUndefined();
  });
});

describe('addresses', () => {
  it('derives the slug tail and the id segment the corpus already uses', () => {
    expect(slugNameFromLabel('State Space Model')).toBe('state-space-model');
    expect(conceptIdFor('atlas.artificial_intelligence.deep_learning', 'state-space-model')).toBe(
      'concept.deep_learning.state_space_model',
    );
  });

  it('knows which labels make an address by themselves', () => {
    expect(labelIsAddressable('State Space Model')).toBe(true);
    expect(labelIsAddressable('Cross-Correlation')).toBe(true);
    expect(labelIsAddressable('A*')).toBe(false);
    expect(labelIsAddressable('C++')).toBe(false);
    expect(labelIsAddressable('Other Traditions & Frontiers')).toBe(false);
  });

  it('refuses to guess an address rather than quietly losing a character', () => {
    expect(() => prepare('candidate.artificial_intelligence.symbolic_ai.a_star')).toThrow(
      ProposalError,
    );
    try {
      prepare('candidate.artificial_intelligence.symbolic_ai.a_star');
    } catch (error) {
      expect((error as ProposalError).detail.join(' ')).toContain('--name');
    }
    // With a name chosen by a person, it prepares.
    const prepared = prepare('candidate.artificial_intelligence.symbolic_ai.a_star', {
      name: 'a-star',
    });
    expect(prepared.conceptId).toBe('concept.symbolic_ai.a_star');
    expect(prepared.slug).toBe('/concepts/a-star');
  });

  it('refuses a name that would not be a legal address', () => {
    expect(() =>
      prepare('candidate.artificial_intelligence.deep_learning.state_space_model', {
        name: 'Not An Address',
      }),
    ).toThrow(/does not make a usable address/);
  });

  it('asks which category when a candidate sits in more than one', () => {
    expect(() => prepare('candidate.artificial_intelligence.deep_learning.attention')).toThrow(
      /sits in 2 categories/,
    );
    const prepared = prepare('candidate.artificial_intelligence.deep_learning.attention', {
      categoryId: 'atlas.artificial_intelligence.symbolic_ai',
    });
    expect(prepared.primaryCategory).toBe(SEARCH);
    expect(prepared.conceptId).toBe('concept.symbolic_ai.attention');
  });
});

describe('the prepared bundle', () => {
  it('writes a manifest its own parser accepts', () => {
    const prepared = prepare('candidate.artificial_intelligence.deep_learning.state_space_model');
    expect(() => parseProposalManifest(prepared.manifest)).not.toThrow();
    expect(prepared.manifest.status).toBe('prepared');
    expect(prepared.manifest.allowedPaths).toEqual(['content/graph-only/state-space-model.yaml']);
    expect(prepared.manifest.baseCommit).toBe(BASE);
  });

  it('asks for a Markdown page when the tier is 2, and YAML when it is 3', () => {
    expect(
      prepare('candidate.artificial_intelligence.deep_learning.state_space_model', { tier: 2 })
        .allowedPath,
    ).toBe('content/concepts/state-space-model.md');
    expect(
      prepare('candidate.artificial_intelligence.deep_learning.state_space_model', { tier: 3 })
        .allowedPath,
    ).toBe('content/graph-only/state-space-model.yaml');
  });

  it('is byte-identical for the same target, tier and base commit', () => {
    const first = prepare('candidate.artificial_intelligence.deep_learning.state_space_model');
    const second = prepare('candidate.artificial_intelligence.deep_learning.state_space_model');
    expect(second.request).toBe(first.request);
  });

  it('differs only where the proposal id and time appear', () => {
    const first = prepare('candidate.artificial_intelligence.deep_learning.state_space_model');
    const second = prepare('candidate.artificial_intelligence.deep_learning.state_space_model', {
      proposalId: 'p-20260918-other',
      createdAt: '2026-09-18T12:00:00.000Z',
    });
    const mask = (text: string) =>
      text.replace(/p-2026\d{4}-[a-z0-9-]+/g, '<id>').replace(/2026-09-\d{2}T[0-9:.]+Z/g, '<time>');
    expect(mask(second.request)).toBe(mask(first.request));
  });
});

describe('what the brief says', () => {
  const prepared = () =>
    prepare('candidate.artificial_intelligence.deep_learning.state_space_model');

  it('names exactly one file and forbids every other', () => {
    const request = prepared().request;
    expect(request).toContain('## The one file you may write');
    expect(request).toContain('`content/graph-only/state-space-model.yaml`');
    expect(request).toContain('Creating, editing, moving or deleting any other file');
    expect(request).toContain('Do not edit, move or delete any file other than the one named');
  });

  it('fixes the identifiers rather than leaving them to the agent', () => {
    const request = prepared().request;
    expect(request).toContain('concept_id: concept.deep_learning.state_space_model');
    expect(request).toContain('slug: /concepts/state-space-model');
    expect(request).toContain('tier: 3');
    expect(request).toContain('review_state: generated-draft');
    expect(request).toContain('may not be changed at all');
  });

  it('says where the need came from, and that the atlas is not evidence', () => {
    const request = prepared().request;
    expect(request).toContain('label on the curated atlas');
    expect(request).toContain('It is not evidence');
    expect(request).toContain('A family the corpus keeps brushing against.');
  });

  it('lists the pages waiting on an unresolved reference, with their sections', () => {
    const request = prepare(backlogId, { name: 'layer-normalization' }).request;
    expect(request).toContain('### Pages waiting on it');
    expect(request).toContain('ResNet (`concept.deep_learning.resnet`)');
    expect(request).toContain('variants-and-alternatives');
    expect(request).toContain('has no page here');
    expect(request).toContain('Do not edit them');
  });

  it('carries the checks and the stopping point', () => {
    const request = prepared().request;
    expect(request).toContain('npm run validate');
    expect(request).toContain('npm test');
    expect(request).toContain('## Where you stop');
    expect(request).toContain('RESULT.md');
    expect(request).toContain('Do not commit, merge, push or publish it.');
    expect(request).toContain('A person reviews it next.');
    expect(request).toContain('AGENT_CONTENT_CONTRACT.md');
  });

  it('gives a Tier 2 brief different rules from a Tier 3 one', () => {
    const stub = prepare('candidate.artificial_intelligence.deep_learning.state_space_model', {
      tier: 2,
    }).request;
    expect(stub).toContain('definition paragraph');
    expect(stub).not.toContain('No Markdown body');
    expect(prepared().request).toContain('No Markdown body');
  });

  it('never invokes a model, and says nothing about one', () => {
    const request = prepared().request;
    expect(request.toLowerCase()).not.toContain('ollama');
    expect(request.toLowerCase()).not.toContain('temperature');
  });
});
