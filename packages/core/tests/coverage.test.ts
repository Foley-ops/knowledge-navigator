/**
 * Compiled coverage, backlog and evidence (v2 runbook L01–L04).
 *
 * The fixture is small and deliberate: two Markdown pages and one graph-only
 * identity, an atlas with an empty category and a Programming area no page
 * touches, the *same* unresolved label on two different pages, and claims in
 * all four statuses.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compileCorpus } from '../src/compile.js';
import { openDatabaseReadOnly } from '../src/db.js';
import {
  getAtlasOutline,
  getConceptEvidence,
  getCoverageSummary,
  listBacklog,
  listCandidates,
} from '../src/coverage.js';
import { REQUIRED_TABLES, SCHEMA_VERSION } from '../src/db.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const ARCHITECTURES = 'Artificial Intelligence/Deep Learning — Architectures';
const SOURCE = {
  id: 'source.he2016.deep_residual_learning',
  title: 'Deep Residual Learning for Image Recognition',
  url: 'https://arxiv.org/abs/1512.03385',
  kind: 'preprint',
  supports: ['definition', 'history-and-attribution'],
  checkedOn: '2026-09-16',
};
const SECOND_SOURCE = {
  id: 'source.simonyan2015.very_deep_convolutional_networks',
  title: 'Very Deep Convolutional Networks for Large-Scale Image Recognition',
  url: 'https://arxiv.org/abs/1409.1556',
  kind: 'preprint',
  supports: ['definition'],
  checkedOn: '2026-09-16',
};

const RESNET = conceptMarkdown({
  conceptId: 'concept.deep_learning.resnet',
  title: 'ResNet',
  slug: '/concepts/resnet',
  aliases: ['Residual Network'],
  kind: 'method',
  tier: 1,
  categories: [ARCHITECTURES],
  relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.vgg' }],
  sources: [SOURCE, SECOND_SOURCE],
  body: tier1Body(),
}).replace(
  '---\n\n',
  `unresolved_references:
  - label: Strided convolution
    reason: Needed to explain the alternative to pooling.
    sections:
      - variants-and-alternatives
    blocking: true
    proposed_kind: method
    proposed_categories:
      - ${ARCHITECTURES}
claims:
  - claim_id: claim.resnet.degradation
    section: history-and-attribution
    statement: Plain networks became harder to optimize as depth increased.
    status: supported
    evidence:
      - source_id: ${SOURCE.id}
        locator: Section 4.1, Figure 4
        note: Training-error comparison.
  - claim_id: claim.resnet.identity
    section: definition
    statement: A residual block adds its input to the output of its stacked layers.
    status: supported
    evidence:
      - source_id: ${SOURCE.id}
        locator: Section 3.1
  - claim_id: claim.resnet.why_it_helps
    section: intuition
    statement: Why residual connections help is not settled by the cited sources.
    status: disputed
    evidence:
      - source_id: ${SOURCE.id}
        locator: Section 1
      - source_id: ${SECOND_SOURCE.id}
        locator: Section 2
  - claim_id: claim.resnet.unverified
    section: uses-and-applicability
    statement: This statement has no source behind it and says so.
    status: unsupported
  - claim_id: claim.resnet.conditional
    section: limitations-and-common-mistakes
    statement: The benefit holds only when depth is the limiting factor.
    status: conditional
    evidence:
      - source_id: ${SOURCE.id}
        locator: Section 4.2
---

`,
);

const VGG = conceptMarkdown({
  conceptId: 'concept.deep_learning.vgg',
  title: 'VGG',
  slug: '/concepts/vgg',
  aliases: ['VGGNet'],
  kind: 'method',
  tier: 2,
  categories: [ARCHITECTURES],
  relationships: [{ type: 'requires', target: 'concept.deep_learning.mamba' }],
  sources: [SECOND_SOURCE],
  body: '\nA deep convolutional architecture built from stacks of small filters.\n',
}).replace(
  '---\n\n',
  `unresolved_references:
  - label: strided-convolution
    reason: The same gap, written differently, on a second page.
    blocking: false
---

`,
);

const MAMBA = `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases:
  - selective state space model
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model.
categories:
  - ${ARCHITECTURES}
primary_category: ${ARCHITECTURES}
relationships: []
sources: []
unresolved_references: []
claims: []
`;

const ATLAS = `schema_version: 1
areas:
  - area_id: atlas.mathematics
    title: Mathematics
    categories:
      - category_id: atlas.mathematics.analysis
        title: Analysis
        parent_id: atlas.mathematics
      - category_id: atlas.mathematics.combinatorics
        title: Combinatorics
        parent_id: atlas.mathematics
  - area_id: atlas.artificial_intelligence
    title: Artificial Intelligence
    categories:
      - category_id: atlas.artificial_intelligence.deep_learning_architectures
        title: Deep Learning — Architectures
        parent_id: atlas.artificial_intelligence
      - category_id: atlas.artificial_intelligence.deep_learning_architectures.sequence
        title: Sequence Models
        parent_id: atlas.artificial_intelligence.deep_learning_architectures
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates:
  - candidate_id: candidate.artificial_intelligence.deep_learning_architectures.resnet
    title: ResNet
    categories:
      - atlas.artificial_intelligence.deep_learning_architectures
    status: covered
    canonical_concept_id: concept.deep_learning.resnet
  - candidate_id: candidate.artificial_intelligence.deep_learning_architectures.vgg
    title: VGG
    categories:
      - atlas.artificial_intelligence.deep_learning_architectures
    status: covered
    canonical_concept_id: concept.deep_learning.vgg
  - candidate_id: candidate.artificial_intelligence.deep_learning_architectures.sequence.mamba
    title: Mamba
    aliases:
      - S6
    categories:
      - atlas.artificial_intelligence.deep_learning_architectures.sequence
    status: covered
    canonical_concept_id: concept.deep_learning.mamba
  - candidate_id: candidate.programming.languages.rust
    title: Rust
    categories:
      - atlas.programming.languages
    status: candidate
    canonical_concept_id: null
    note: Worth a page once the systems area is started.
  - candidate_id: candidate.mathematics.analysis.wavelets
    title: Wavelets
    categories:
      - atlas.mathematics.analysis
    status: deferred
    canonical_concept_id: null
`;

let root = '';
let db: DatabaseType;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-coverage-'));
  const contentDir = join(root, 'content', 'concepts');
  const graphOnlyDir = join(root, 'content', 'graph-only');
  await mkdir(contentDir, { recursive: true });
  await mkdir(graphOnlyDir, { recursive: true });
  await writeFile(join(contentDir, 'resnet.md'), RESNET, 'utf8');
  await writeFile(join(contentDir, 'vgg.md'), VGG, 'utf8');
  await writeFile(join(graphOnlyDir, 'mamba.yaml'), MAMBA, 'utf8');
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
});

afterAll(async () => {
  db.close();
  await rm(root, { recursive: true, force: true });
});

/* --------------------------------------------------------------- L00 ---- */

describe('schema version 2', () => {
  it('records version 2 and creates every required table', () => {
    const version = db
      .prepare("SELECT value FROM build_meta WHERE key = 'schema_version'")
      .get() as { value: string } | undefined;
    expect(version?.value).toBe(String(SCHEMA_VERSION));
    expect(SCHEMA_VERSION).toBe(2);

    const present = new Set(
      (
        db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view')").all() as {
          name: string;
        }[]
      ).map((row) => row.name),
    );
    for (const table of REQUIRED_TABLES) {
      expect(present.has(table), `missing table ${table}`).toBe(true);
    }
  });

  it('passes foreign-key and integrity checks', () => {
    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check')).toEqual([{ integrity_check: 'ok' }]);
  });

  it('keeps every version 1 table and column', () => {
    const columns = (db.prepare('PRAGMA table_info(concepts)').all() as { name: string }[]).map(
      (c) => c.name,
    );
    for (const v1 of ['id', 'title', 'slug', 'file_name', 'kind', 'tier', 'body', 'plain_text']) {
      expect(columns).toContain(v1);
    }
    expect(columns).toContain('content_format');
    expect(columns).toContain('has_article');
  });
});

/* --------------------------------------------------------------- L01 ---- */

describe('the compiled atlas', () => {
  it('keeps every area, including one with no canonical page', () => {
    const outline = getAtlasOutline(db);
    expect(outline.map((area) => area.title)).toEqual([
      'Mathematics',
      'Artificial Intelligence',
      'Programming',
    ]);
    const programming = outline.find((area) => area.title === 'Programming');
    expect(programming?.categories).toBe(1);
    expect(programming?.candidates).toBe(1);
    expect(programming?.covered).toBe(0);
  });

  it('keeps a category with no candidate and no child', () => {
    const mathematics = getAtlasOutline(db).find((area) => area.title === 'Mathematics');
    const combinatorics = mathematics?.children.find((c) => c.title === 'Combinatorics');
    expect(combinatorics).toBeDefined();
    expect(combinatorics?.candidates).toBe(0);
    expect(combinatorics?.children).toEqual([]);
    // Combinatorics is the only category with neither a candidate nor a child.
    expect(getCoverageSummary(db).atlas.emptyCategories).toBe(1);
  });

  it('nests a sub-category under its parent, not under the area', () => {
    const ai = getAtlasOutline(db).find((area) => area.title === 'Artificial Intelligence');
    expect(ai?.children.map((c) => c.title)).toEqual(['Deep Learning — Architectures']);
    expect(ai?.children[0]?.children.map((c) => c.title)).toEqual(['Sequence Models']);
    expect(ai?.children[0]?.children[0]?.path).toBe(
      'Artificial Intelligence/Deep Learning — Architectures/Sequence Models',
    );
  });

  it('resolves every covered candidate to exactly one concept', () => {
    const covered = listCandidates(db, { status: 'covered' });
    expect(covered.total).toBe(3);
    for (const candidate of covered.items) {
      expect(candidate.canonicalConceptId).not.toBeNull();
      expect(candidate.canonicalTitle).not.toBeNull();
    }
    const ids = covered.items.map((c) => c.canonicalConceptId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('leaves an uncovered candidate with no concept at all', () => {
    const rust = listCandidates(db, { status: 'candidate' }).items[0];
    expect(rust?.title).toBe('Rust');
    expect(rust?.canonicalConceptId).toBeNull();
    expect(rust?.note).toBe('Worth a page once the systems area is started.');
  });

  it('filters by area, category and status, and paginates stably', () => {
    expect(listCandidates(db, { areaId: 'atlas.programming' }).total).toBe(1);
    expect(
      listCandidates(db, {
        categoryId: 'atlas.artificial_intelligence.deep_learning_architectures',
      }).total,
    ).toBe(2);
    expect(listCandidates(db, { status: 'deferred' }).items.map((c) => c.title)).toEqual([
      'Wavelets',
    ]);

    const first = listCandidates(db, { limit: 2, offset: 0 });
    const second = listCandidates(db, { limit: 2, offset: 2 });
    expect(first.items.map((c) => c.title)).toEqual(['Mamba', 'ResNet']);
    expect(first.truncated).toBe(true);
    expect(second.items.map((c) => c.title)).toEqual(['Rust', 'VGG']);
    expect(listCandidates(db, { limit: 2, offset: 0 })).toEqual(first);
  });

  it('carries candidate aliases', () => {
    const mamba = listCandidates(db, { status: 'covered' }).items.find((c) => c.title === 'Mamba');
    expect(mamba?.aliases).toEqual(['S6']);
  });
});

/* --------------------------------------------------------------- L02 ---- */

describe('compiled graph-only identities', () => {
  it('is a concept row with no article', () => {
    const row = db
      .prepare(
        'SELECT content_format AS f, has_article AS a, body, source_path FROM concepts WHERE id = ?',
      )
      .get('concept.deep_learning.mamba') as {
      f: string;
      a: number;
      body: string;
      source_path: string;
    };
    expect(row.f).toBe('graph-only');
    expect(row.a).toBe(0);
    expect(row.body).toBe('');
    expect(row.source_path).toBe('content/graph-only/mamba.yaml');
  });

  it('participates in relationships from a Markdown page', () => {
    const edges = db
      .prepare('SELECT source_concept_id AS s FROM relationships WHERE target_concept_id = ?')
      .all('concept.deep_learning.mamba') as { s: string }[];
    expect(edges.map((e) => e.s)).toEqual(['concept.deep_learning.vgg']);
  });

  it('is findable by name but contributes no prose to search', () => {
    const row = db
      .prepare('SELECT title, aliases, summary, body FROM concepts_fts WHERE concept_id = ?')
      .get('concept.deep_learning.mamba') as {
      title: string;
      aliases: string;
      summary: string;
      body: string;
    };
    expect(row.title).toBe('Mamba');
    expect(row.aliases).toContain('selective state space model');
    expect(row.summary).not.toBe('');
    expect(row.body).toBe('');
  });

  it('is the only concept without an article', () => {
    const withoutArticle = db
      .prepare('SELECT id FROM concepts WHERE has_article = 0 ORDER BY id')
      .all() as { id: string }[];
    expect(withoutArticle.map((r) => r.id)).toEqual(['concept.deep_learning.mamba']);
  });
});

/* --------------------------------------------------------------- L03 ---- */

describe('the compiled backlog', () => {
  it('groups the same label from two pages into one item with two sources', () => {
    const backlog = listBacklog(db);
    expect(backlog.total).toBe(1);

    const group = backlog.items[0]!;
    expect(group.groupId).toBe('backlog.strided_convolution');
    expect(group.normalizedLabel).toBe('strided convolution');
    expect(group.sourceCount).toBe(2);
    expect(group.sources.map((s) => s.conceptId).sort()).toEqual([
      'concept.deep_learning.resnet',
      'concept.deep_learning.vgg',
    ]);
    // Both reasons survive: whoever writes the page needs both.
    expect(group.sources.map((s) => s.reason)).toContain(
      'Needed to explain the alternative to pooling.',
    );
    expect(group.sources.map((s) => s.reason)).toContain(
      'The same gap, written differently, on a second page.',
    );
  });

  it('calls the group blocking when any one page does', () => {
    const group = listBacklog(db).items[0]!;
    expect(group.blocking).toBe(true);
    expect(group.sources.filter((s) => s.blocking)).toHaveLength(1);
    expect(listBacklog(db, { blockingOnly: true }).total).toBe(1);
  });

  it('keeps the proposed kind and categories of the page that offered them', () => {
    const group = listBacklog(db).items[0]!;
    expect(group.proposedKinds).toEqual(['method']);
    expect(group.proposedCategories).toEqual([ARCHITECTURES]);
    const resnetSource = group.sources.find((s) => s.conceptId === 'concept.deep_learning.resnet');
    expect(resnetSource?.sections).toEqual(['variants-and-alternatives']);
  });

  it('resolves a proposed category to a real atlas category', () => {
    const row = db
      .prepare(
        'SELECT category_path AS p, atlas_category_id AS id FROM unresolved_reference_categories',
      )
      .get() as { p: string; id: string | null };
    expect(row.p).toBe(ARCHITECTURES);
    expect(row.id).toBe('atlas.artificial_intelligence.deep_learning_architectures');
  });

  it('stays distinguishable from an atlas candidate', () => {
    // The backlog and the candidate list are separate queries over separate
    // tables. Nothing in one appears in the other.
    const backlogLabels = listBacklog(db).items.map((g) => g.normalizedLabel);
    const candidateTitles = listCandidates(db).items.map((c) => c.title.toLowerCase());
    expect(backlogLabels).toEqual(['strided convolution']);
    expect(candidateTitles).not.toContain('strided convolution');

    const summary = getCoverageSummary(db);
    expect(summary.backlog).toEqual({ references: 2, groups: 1, blocking: 1 });
    expect(summary.atlas.candidates).toBe(5);
  });

  it('returns the same rows in the same order twice', () => {
    expect(listBacklog(db)).toEqual(listBacklog(db));
  });
});

/* --------------------------------------------------------------- L04 ---- */

describe('compiled claims and evidence', () => {
  it('records every claim with its status and section', () => {
    const evidence = getConceptEvidence(db, 'concept.deep_learning.resnet');
    expect(evidence?.hasClaimMapping).toBe(true);
    expect(evidence?.claims.map((c) => c.status)).toEqual([
      'supported',
      'supported',
      'disputed',
      'unsupported',
      'conditional',
    ]);
    expect(evidence?.claims.map((c) => c.section)).toEqual([
      'history-and-attribution',
      'definition',
      'intuition',
      'uses-and-applicability',
      'limitations-and-common-mistakes',
    ]);
  });

  it('keeps an unsupported claim visible and evidence-free', () => {
    const evidence = getConceptEvidence(db, 'concept.deep_learning.resnet');
    const unsupported = evidence?.claims.find((c) => c.status === 'unsupported');
    expect(unsupported?.evidence).toEqual([]);
    expect(unsupported?.statement).toContain('no source behind it');

    // Every other claim cites something; "unsupported" is the only way to have
    // no evidence, so a reader can never mistake one for the other.
    const withoutEvidence = db
      .prepare(
        `SELECT id, status FROM claims
          WHERE NOT EXISTS (SELECT 1 FROM claim_evidence e WHERE e.claim_id = claims.id)`,
      )
      .all() as { id: string; status: string }[];
    expect(withoutEvidence.every((row) => row.status === 'unsupported')).toBe(true);
  });

  it('cannot point evidence at a source that is not compiled', () => {
    const dangling = db
      .prepare(
        `SELECT e.id FROM claim_evidence e
          WHERE NOT EXISTS (SELECT 1 FROM sources s WHERE s.id = e.source_id)`,
      )
      .all();
    expect(dangling).toEqual([]);

    // The foreign key is real, not decorative.
    const writable = openDatabaseReadOnly(db.name);
    writable.close();
    expect(db.pragma('foreign_keys')).toEqual([{ foreign_keys: 1 }]);
  });

  it('lets one source support several claims', () => {
    const evidence = getConceptEvidence(db, 'concept.deep_learning.resnet');
    const primary = evidence?.sources.find((s) => s.sourceId === SOURCE.id);
    expect(primary?.claimCount).toBe(4);
    const secondary = evidence?.sources.find((s) => s.sourceId === SECOND_SOURCE.id);
    expect(secondary?.claimCount).toBe(1);
  });

  it('carries the locator and the note exactly as written', () => {
    const claim = getConceptEvidence(db, 'concept.deep_learning.resnet')?.claims[0];
    expect(claim?.evidence[0]?.locator).toBe('Section 4.1, Figure 4');
    expect(claim?.evidence[0]?.note).toBe('Training-error comparison.');
    expect(claim?.evidence[0]?.sourceUrl).toBe(SOURCE.url);
  });

  it('says plainly when a page has no claim mapping at all', () => {
    const evidence = getConceptEvidence(db, 'concept.deep_learning.vgg');
    expect(evidence?.hasClaimMapping).toBe(false);
    expect(evidence?.claims).toEqual([]);
    // The page still has its sources; only the claim-level mapping is absent.
    expect(evidence?.sources).toHaveLength(1);
    expect(evidence?.sources[0]?.claimCount).toBe(0);
  });

  it('returns undefined for a concept that does not exist', () => {
    expect(getConceptEvidence(db, 'concept.no.such')).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */

describe('the coverage summary', () => {
  it('counts identities, the atlas, the backlog and evidence separately', () => {
    const summary = getCoverageSummary(db);
    expect(summary.concepts).toEqual({
      total: 3,
      withArticle: 2,
      byTier: { '1': 1, '2': 1, '3': 1 },
      byFormat: { markdown: 2, 'graph-only': 1 },
      byReviewState: { 'generated-draft': 3 },
    });
    expect(summary.atlas.byStatus).toEqual({
      candidate: 1,
      'proposed-tier-3': 0,
      covered: 3,
      deferred: 1,
    });
    expect(summary.evidence.claims).toBe(5);
    expect(summary.evidence.byStatus).toEqual({
      supported: 2,
      conditional: 1,
      disputed: 1,
      unsupported: 1,
    });
    expect(summary.evidence.locators).toBe(5);
    expect(summary.evidence.conceptsWithClaims).toBe(1);
    expect(summary.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    expect(summary.atlasHash).toMatch(/^[0-9a-f]{64}$/);
    expect(summary.atlasHash).not.toBe(summary.corpusHash);
  });
});
