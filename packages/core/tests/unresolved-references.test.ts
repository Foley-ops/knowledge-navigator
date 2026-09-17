/**
 * Unresolved references (v2 runbook K04, contract §4.3).
 *
 * The field exists so a page can say "I need to mention strided convolution and
 * this corpus does not explain it" without inventing a stub page to link to.
 * These tests fix what a valid entry looks like, and prove every malformed one
 * fails with a field path a human can act on.
 */
import { describe, expect, it } from 'vitest';
import {
  backlogGroupId,
  labelKey,
  parseFrontmatter,
  unresolvedReferenceId,
} from '../src/schema.js';
import { loadAtlasFromText } from '../src/atlas.js';
import { loadGraphOnlyFromText } from '../src/graph-only.js';
import { validateCorpus } from '../src/validate.js';
import { conceptMarkdown, loadFixture } from './fixtures.js';
import { loadConceptFromText } from '../src/loader.js';

const BASE = {
  concept_id: 'concept.deep_learning.pooling',
  title: 'Pooling',
  slug: '/concepts/pooling',
  aliases: ['spatial pooling'],
  kind: 'method',
  tier: 1,
  review_state: 'generated-draft',
  summary: 'A layer that summarises a neighbourhood of activations into one value.',
  categories: ['Artificial Intelligence/Deep Learning — Architectures'],
  primary_category: 'Artificial Intelligence/Deep Learning — Architectures',
  relationships: [],
  sources: [],
};

const REFERENCE = {
  label: 'Strided convolution',
  reason: 'Needed to explain the alternative to pooling without inventing a link.',
  sections: ['variants-and-alternatives'],
  blocking: false,
  proposed_kind: 'method',
  proposed_categories: ['Artificial Intelligence/Deep Learning — Architectures'],
};

function parse(references: unknown) {
  return parseFrontmatter({ ...BASE, unresolved_references: references });
}

function issueText(references: unknown): string {
  return parse(references)
    .issues.map((issue) => `${issue.path}: ${issue.message}`)
    .join(' | ');
}

const ATLAS = loadAtlasFromText(`schema_version: 1
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
      - category_id: atlas.artificial_intelligence.deep_learning_architectures
        title: Deep Learning — Architectures
        parent_id: atlas.artificial_intelligence
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates: []
`).atlas!;

describe('a valid unresolved reference', () => {
  it('parses with every field', () => {
    const result = parse([REFERENCE]);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.value?.unresolved_references[0]).toEqual(REFERENCE);
  });

  it('defaults sections, blocking and proposed categories', () => {
    const result = parse([{ label: 'Dilated convolution', reason: 'Mentioned in prose only.' }]);
    expect(result.ok).toBe(true);
    expect(result.value?.unresolved_references[0]).toEqual({
      label: 'Dilated convolution',
      reason: 'Mentioned in prose only.',
      sections: [],
      blocking: false,
      proposed_categories: [],
    });
  });

  it('defaults the whole field to an empty list', () => {
    expect(parseFrontmatter(BASE).value?.unresolved_references).toEqual([]);
  });

  it('is accepted on a Tier 1 Markdown page', () => {
    const markdown = conceptMarkdown({}).replace(
      '---\n\n',
      `unresolved_references:\n  - label: Strided convolution\n    reason: An alternative worth naming.\n    sections:\n      - variants-and-alternatives\n---\n\n`,
    );
    const result = loadConceptFromText(markdown, 'convolution.md');
    expect(result.issues).toEqual([]);
    expect(result.concept?.frontmatter.unresolved_references).toHaveLength(1);
  });

  it('is accepted on a graph-only identity when it names no section', () => {
    const yaml = `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
unresolved_references:
  - label: State space model
    reason: The family this belongs to has no identity yet.
`;
    const result = loadGraphOnlyFromText(yaml, 'mamba.yaml');
    expect(result.issues).toEqual([]);
    expect(result.identity?.frontmatter.unresolved_references).toHaveLength(1);
  });
});

describe('malformed entries', () => {
  it('rejects a missing label or reason', () => {
    expect(issueText([{ reason: 'Why.' }])).toContain('unresolved_references.0.label');
    expect(issueText([{ label: 'Strided convolution' }])).toContain(
      'unresolved_references.0.reason',
    );
  });

  it('rejects an empty label or reason', () => {
    expect(issueText([{ ...REFERENCE, label: '' }])).toContain('must not be empty');
    expect(issueText([{ ...REFERENCE, reason: '   ' }])).toContain(
      'unresolved_references.0.reason',
    );
  });

  it('rejects an unknown key', () => {
    expect(issueText([{ ...REFERENCE, summary: 'A convolution with stride > 1.' }])).toContain(
      'unknown key "summary"',
    );
  });

  it('rejects a section name outside the template', () => {
    expect(issueText([{ ...REFERENCE, sections: ['further-reading'] }])).toContain(
      'unresolved_references.0.sections.0',
    );
  });

  it('rejects a repeated section', () => {
    expect(
      issueText([
        { ...REFERENCE, sections: ['variants-and-alternatives', 'variants-and-alternatives'] },
      ]),
    ).toContain('must not repeat a section');
  });

  it('rejects a proposed_kind outside the enumeration', () => {
    expect(issueText([{ ...REFERENCE, proposed_kind: 'architecture' }])).toContain(
      'unresolved_references.0.proposed_kind',
    );
  });

  it('accepts a proposed_kind added in v2', () => {
    expect(parse([{ ...REFERENCE, proposed_kind: 'paper' }]).ok).toBe(true);
  });

  it('rejects a proposed category outside the three atlas areas', () => {
    expect(issueText([{ ...REFERENCE, proposed_categories: ['Chemistry/Catalysis'] }])).toContain(
      'must begin with one of the atlas areas',
    );
  });

  it('rejects blocking that is not a boolean', () => {
    expect(issueText([{ ...REFERENCE, blocking: 'yes' }])).toContain(
      'unresolved_references.0.blocking',
    );
  });
});

describe('duplicate and self-referential labels', () => {
  it('rejects two labels that normalise to the same name', () => {
    expect(issueText([REFERENCE, { ...REFERENCE, label: 'strided-convolution' }])).toContain(
      'one label is one backlog item',
    );
  });

  it('rejects a label that is the concept’s own title', () => {
    expect(issueText([{ ...REFERENCE, label: 'Pooling' }])).toContain("is this concept's own name");
  });

  it('rejects a label that is one of the concept’s own aliases', () => {
    expect(issueText([{ ...REFERENCE, label: 'Spatial-Pooling' }])).toContain(
      "is this concept's own name",
    );
  });

  it('rejects a section list on a graph-only identity', () => {
    const yaml = `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
unresolved_references:
  - label: State space model
    reason: The family this belongs to has no identity yet.
    sections:
      - definition
`;
    expect(
      loadGraphOnlyFromText(yaml, 'mamba.yaml')
        .issues.map((i) => i.message)
        .join(' '),
    ).toContain('a graph-only identity has no sections');
  });
});

describe('corpus rules', () => {
  function pageWith(references: string): ReturnType<typeof loadFixture> {
    const markdown = conceptMarkdown({}).replace('---\n\n', `${references}---\n\n`);
    const result = loadConceptFromText(markdown, 'convolution.md');
    if (!result.ok || result.concept === undefined) {
      throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join('; '));
    }
    return result.concept;
  }

  const convolution = pageWith(
    'unresolved_references:\n' +
      '  - label: Strided convolution\n' +
      '    reason: An alternative worth naming.\n' +
      '    proposed_categories:\n' +
      '      - Artificial Intelligence/Deep Learning — Architectures\n',
  );
  const crossCorrelation = loadFixture('cross-correlation.md', {
    conceptId: 'concept.analysis.cross_correlation',
    title: 'Cross-Correlation',
    slug: '/concepts/cross-correlation',
    aliases: ['cross correlation'],
    categories: ['Mathematics/Analysis'],
    relationships: [{ type: 'contrasts_with', target: 'concept.analysis.convolution' }],
  });

  it('accepts an unresolved reference nothing in the corpus answers to', () => {
    expect(validateCorpus([convolution, crossCorrelation], { atlas: ATLAS })).toEqual([]);
  });

  it('rejects a proposed category that is not in the atlas', () => {
    const page = pageWith(
      'unresolved_references:\n' +
        '  - label: Strided convolution\n' +
        '    reason: An alternative worth naming.\n' +
        '    proposed_categories:\n' +
        '      - Mathematics/Nowhere In Particular\n',
    );
    const found = validateCorpus([page, crossCorrelation], { atlas: ATLAS });
    expect(found).toHaveLength(1);
    expect(found[0]?.file).toBe('convolution.md');
    expect(found[0]?.field).toBe('unresolved_references.0.proposed_categories.0');
    expect(found[0]?.message).toContain('is not a category in the atlas');
  });

  it('skips the atlas rule when no atlas is supplied', () => {
    const page = pageWith(
      'unresolved_references:\n' +
        '  - label: Strided convolution\n' +
        '    reason: An alternative worth naming.\n' +
        '    proposed_categories:\n' +
        '      - Mathematics/Nowhere In Particular\n',
    );
    expect(validateCorpus([page, crossCorrelation])).toEqual([]);
  });

  it('rejects an entry the corpus already answers to', () => {
    const page = pageWith(
      'unresolved_references:\n' +
        '  - label: cross correlation\n' +
        '    reason: Stale — this page now exists.\n',
    );
    const found = validateCorpus([page, crossCorrelation], { atlas: ATLAS });
    expect(found).toHaveLength(1);
    expect(found[0]?.field).toBe('unresolved_references.0.label');
    expect(found[0]?.message).toContain('now resolves to concept.analysis.cross_correlation');
  });
});

describe('deterministic backlog ids', () => {
  it('derives an item id from the source concept and the normalised label', () => {
    expect(unresolvedReferenceId('concept.deep_learning.pooling', 'Strided convolution')).toBe(
      'unresolved.deep_learning.pooling.strided_convolution',
    );
    expect(unresolvedReferenceId('concept.deep_learning.pooling', 'strided-CONVOLUTION')).toBe(
      'unresolved.deep_learning.pooling.strided_convolution',
    );
  });

  it('groups the same label from different pages under one id', () => {
    expect(backlogGroupId('Strided convolution')).toBe(backlogGroupId('strided_convolution'));
    expect(backlogGroupId('Strided convolution')).toBe('backlog.strided_convolution');
  });

  it('always produces a valid dotted-identifier segment', () => {
    expect(labelKey('A* search')).toBe('a_search');
    expect(labelKey('C++')).toBe('c');
    expect(labelKey('3-SAT')).toBe('3_sat');
    expect(labelKey('—')).toBe('unlabelled');
  });
});
