import { describe, expect, it } from 'vitest';
import {
  conceptKinds,
  parseFrontmatter,
  relationshipTypes,
  reviewStates,
  sourceKinds,
  supportedSections,
  tiers,
} from '../src/schema.js';

/** The worked example from runbook §4.1, completed into a valid page. */
function validFrontmatter(): Record<string, unknown> {
  return {
    concept_id: 'concept.deep_learning.convolutional_layer',
    title: 'Convolutional Layer',
    slug: '/concepts/convolutional-layer',
    aliases: ['convolution layer', 'conv layer'],
    kind: 'method',
    tier: 1,
    review_state: 'generated-draft',
    summary: 'A neural-network layer that applies learned local filters with shared parameters.',
    categories: [
      'Artificial Intelligence/Deep Learning — Architectures',
      'Artificial Intelligence/Deep Learning — Training',
    ],
    primary_category: 'Artificial Intelligence/Deep Learning — Architectures',
    relationships: [
      {
        type: 'requires',
        target: 'concept.analysis.cross_correlation',
        note: 'Most deep-learning libraries implement cross-correlation despite using convolution terminology.',
      },
    ],
    sources: [
      {
        source_id: 'source.deep_learning_book.convnets',
        title: 'Deep Learning, Chapter 9 — Convolutional Networks',
        url: 'https://www.deeplearningbook.org/contents/convnets.html',
        source_kind: 'authoritative-secondary',
        supports: ['definition', 'uses-and-applicability'],
        checked_on: '2026-09-16',
      },
    ],
  };
}

/** Apply a patch to the valid example; `undefined` deletes the key. */
function withPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const base = validFrontmatter();
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete base[key];
    else base[key] = value;
  }
  return base;
}

function expectRejected(input: unknown, pathFragment: string): void {
  const result = parseFrontmatter(input);
  expect(result.ok, `expected rejection mentioning "${pathFragment}"`).toBe(false);
  expect(result.value).toBeUndefined();
  expect(result.issues.length).toBeGreaterThan(0);
  expect(result.issues.some((issue) => issue.path.includes(pathFragment))).toBe(true);
}

describe('concept frontmatter contract', () => {
  it('accepts the worked example from runbook §4.1', () => {
    const result = parseFrontmatter(validFrontmatter());
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.value?.concept_id).toBe('concept.deep_learning.convolutional_layer');
    expect(result.value?.tier).toBe(1);
    expect(result.value?.sources[0]?.supports).toEqual(['definition', 'uses-and-applicability']);
  });

  it('defaults optional collections so downstream code never sees undefined', () => {
    const result = parseFrontmatter(
      withPatch({ aliases: undefined, relationships: undefined, sources: undefined }),
    );
    expect(result.ok).toBe(true);
    expect(result.value?.aliases).toEqual([]);
    expect(result.value?.relationships).toEqual([]);
    expect(result.value?.sources).toEqual([]);
  });

  it('exposes exactly the enumerations named in the runbook', () => {
    expect(conceptKinds).toHaveLength(12);
    expect(tiers).toEqual([1, 2, 3]);
    expect(reviewStates).toHaveLength(5);
    expect(relationshipTypes).toHaveLength(21);
    expect(sourceKinds.includes('authoritative-secondary')).toBe(true);
    expect(supportedSections.includes('uses-and-applicability')).toBe(true);
  });

  /* ---------------- enumerations: one invalid example each ---------------- */

  it('rejects a kind outside the enumeration', () => {
    expectRejected(withPatch({ kind: 'architecture' }), 'kind');
  });

  it('rejects a tier outside 1, 2, 3', () => {
    expectRejected(withPatch({ tier: 4 }), 'tier');
  });

  it('rejects a tier that is a numeric string', () => {
    expectRejected(withPatch({ tier: '1' }), 'tier');
  });

  it('rejects a review_state outside the enumeration', () => {
    expectRejected(withPatch({ review_state: 'reviewed' }), 'review_state');
  });

  it('rejects a relationship type outside the enumeration', () => {
    expectRejected(
      withPatch({ relationships: [{ type: 'uses', target: 'concept.analysis.convolution' }] }),
      'relationships.0.type',
    );
  });

  it('rejects a source_kind outside the enumeration', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['source_kind'] = 'blog-post';
    expectRejected(withPatch({ sources }), 'sources.0.source_kind');
  });

  it('rejects a supports entry that is not a Tier 1 section', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['supports'] = ['definition', 'sources'];
    expectRejected(withPatch({ sources }), 'sources.0.supports.1');
  });

  it('rejects an empty supports list', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['supports'] = [];
    expectRejected(withPatch({ sources }), 'sources.0.supports');
  });

  it('rejects a repeated supports entry', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['supports'] = ['definition', 'definition'];
    expectRejected(withPatch({ sources }), 'sources.0.supports');
  });

  /* -------------------------- identifier formats -------------------------- */

  it('rejects a concept_id that is not lowercase dotted', () => {
    expectRejected(withPatch({ concept_id: 'Concept.Deep_Learning.ConvLayer' }), 'concept_id');
  });

  it('rejects a concept_id with a single segment', () => {
    expectRejected(withPatch({ concept_id: 'convolution' }), 'concept_id');
  });

  it('rejects a concept_id with a hyphen', () => {
    expectRejected(withPatch({ concept_id: 'concept.deep-learning.conv' }), 'concept_id');
  });

  it('rejects a relationship target that is not a dotted identifier', () => {
    expectRejected(
      withPatch({ relationships: [{ type: 'requires', target: 'cross-correlation' }] }),
      'relationships.0.target',
    );
  });

  it('rejects a source_id that is not a dotted identifier', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['source_id'] = 'deeplearningbook';
    expectRejected(withPatch({ sources }), 'sources.0.source_id');
  });

  /* ------------------------------- slug ---------------------------------- */

  it('rejects a slug outside the /concepts/ namespace', () => {
    expectRejected(withPatch({ slug: '/docs/convolutional-layer' }), 'slug');
  });

  it('rejects a slug that is not kebab-case', () => {
    expectRejected(withPatch({ slug: '/concepts/Convolutional_Layer' }), 'slug');
  });

  it('rejects a slug whose name disagrees with the concept_id tail', () => {
    expectRejected(withPatch({ slug: '/concepts/conv-layer' }), 'slug');
  });

  /* ------------------------------- URL ----------------------------------- */

  it('rejects a source url that is not absolute', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['url'] = '/contents/convnets.html';
    expectRejected(withPatch({ sources }), 'sources.0.url');
  });

  it('rejects a source url with a non-http scheme', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['url'] = 'file:///etc/passwd';
    expectRejected(withPatch({ sources }), 'sources.0.url');
  });

  /* ------------------------------- dates ---------------------------------- */

  it('rejects a checked_on that is not ISO formatted', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['checked_on'] = '16/09/2026';
    expectRejected(withPatch({ sources }), 'sources.0.checked_on');
  });

  it('rejects a checked_on that is not a real calendar date', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    sources[0]!['checked_on'] = '2026-02-30';
    expectRejected(withPatch({ sources }), 'sources.0.checked_on');
  });

  /* ----------------------------- categories ------------------------------- */

  it('rejects a category outside the three atlas areas', () => {
    expectRejected(
      withPatch({
        categories: ['Biology/Neuroscience'],
        primary_category: 'Biology/Neuroscience',
      }),
      'categories',
    );
  });

  it('rejects a category path with an empty segment', () => {
    expectRejected(
      withPatch({
        categories: ['Mathematics//Analysis'],
        primary_category: 'Mathematics//Analysis',
      }),
      'categories',
    );
  });

  it('rejects an empty categories list', () => {
    expectRejected(withPatch({ categories: [] }), 'categories');
  });

  it('rejects a duplicated category', () => {
    expectRejected(
      withPatch({
        categories: ['Mathematics/Analysis', 'Mathematics/Analysis'],
        primary_category: 'Mathematics/Analysis',
      }),
      'categories',
    );
  });

  it('rejects a primary_category that is not among the categories', () => {
    expectRejected(withPatch({ primary_category: 'Mathematics/Analysis' }), 'primary_category');
  });

  /* ---------------------------- strictness -------------------------------- */

  it('rejects an unknown top-level key', () => {
    expectRejected(withPatch({ notes: 'some private note' }), 'notes');
  });

  it('rejects an unknown key inside a relationship', () => {
    expectRejected(
      withPatch({
        relationships: [{ type: 'requires', target: 'concept.analysis.convolution', weight: 0.5 }],
      }),
      'relationships.0',
    );
  });

  /* ------------------------- required and shape --------------------------- */

  it.each([
    'concept_id',
    'title',
    'slug',
    'kind',
    'tier',
    'review_state',
    'summary',
    'categories',
    'primary_category',
  ])('rejects a page missing %s', (field) => {
    expectRejected(withPatch({ [field]: undefined }), field);
  });

  it('rejects an empty summary', () => {
    expectRejected(withPatch({ summary: '' }), 'summary');
  });

  it('rejects a title padded with whitespace', () => {
    expectRejected(withPatch({ title: '  Convolutional Layer ' }), 'title');
  });

  it('rejects a value that is not an object at all', () => {
    expectRejected('convolutional layer', '(root)');
  });

  /* --------------------------- cross-field rules -------------------------- */

  it('rejects a self-relationship', () => {
    expectRejected(
      withPatch({
        relationships: [{ type: 'requires', target: 'concept.deep_learning.convolutional_layer' }],
      }),
      'relationships.0.target',
    );
  });

  it('rejects two aliases that differ only by case, hyphen or spacing', () => {
    expectRejected(withPatch({ aliases: ['conv layer', 'Conv-Layer'] }), 'aliases.1');
  });

  it('rejects two sources sharing a source_id on the same page', () => {
    const sources = validFrontmatter()['sources'] as Record<string, unknown>[];
    expectRejected(withPatch({ sources: [sources[0], { ...sources[0] }] }), 'sources.1.source_id');
  });

  it('reports every problem in one pass rather than stopping at the first', () => {
    const result = parseFrontmatter(
      withPatch({ kind: 'architecture', tier: 9, review_state: 'reviewed' }),
    );
    expect(result.ok).toBe(false);
    const paths = result.issues.map((issue) => issue.path);
    expect(paths).toContain('kind');
    expect(paths).toContain('tier');
    expect(paths).toContain('review_state');
  });

  it('sorts issues deterministically by path', () => {
    const first = parseFrontmatter(withPatch({ kind: 'x', tier: 9 })).issues;
    const second = parseFrontmatter(withPatch({ kind: 'x', tier: 9 })).issues;
    expect(first).toEqual(second);
    expect(first.map((i) => i.path)).toEqual([...first.map((i) => i.path)].sort());
  });
});
