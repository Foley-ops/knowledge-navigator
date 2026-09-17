/**
 * Tier 3 graph-only identities (v2 runbook K02, contract §4.2).
 *
 * The point of these tests is that a graph-only identity gets *the same*
 * identity validation a Markdown page gets — not a second, weaker copy of it —
 * plus the storage rules that make it a graph identity rather than an article.
 */
import { describe, expect, it } from 'vitest';
import { graphOnlyFileName, loadGraphOnlyFromText } from '../src/graph-only.js';
import { validateConceptPage, validateCorpus } from '../src/validate.js';
import { loadFixture } from './fixtures.js';

const VALID = `concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases:
  - selective state space model
kind: method
tier: 3
review_state: generated-draft
summary: A selective state-space sequence model proposed as an alternative to attention.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: contrasts_with
    target: concept.deep_learning.resnet
sources: []
`;

function load(text: string, fileName = 'mamba.yaml') {
  return loadGraphOnlyFromText(text, fileName);
}

function messages(text: string): string {
  return load(text)
    .issues.map((issue) => `${issue.path}: ${issue.message}`)
    .join(' | ');
}

describe('a valid graph-only identity', () => {
  it('loads with no body, no headings and no links', () => {
    const result = load(VALID);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);

    const identity = result.identity!;
    expect(identity.format).toBe('graph-only');
    expect(identity.frontmatter.concept_id).toBe('concept.deep_learning.mamba');
    expect(identity.frontmatter.tier).toBe(3);
    expect(identity.body).toBe('');
    expect(identity.plainText).toBe('');
    expect(identity.headings).toEqual([]);
    expect(identity.links).toEqual([]);
    expect(identity.rawHtml).toEqual([]);
    expect(identity.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('needs no Tier 1 template', () => {
    expect(validateConceptPage(load(VALID).identity!)).toEqual([]);
  });

  it('may take part in relationships', () => {
    expect(load(VALID).identity!.frontmatter.relationships).toEqual([
      { type: 'contrasts_with', target: 'concept.deep_learning.resnet' },
    ]);
  });

  it('derives its file name from its slug', () => {
    expect(graphOnlyFileName('/concepts/mamba')).toBe('mamba.yaml');
    expect(graphOnlyFileName('/concepts/state-space-model')).toBe('state-space-model.yaml');
  });
});

describe('storage rules', () => {
  it('rejects a Markdown body after a separator', () => {
    const text = `${VALID}---\n\n## Definition\n\nProse that should not be here.\n`;
    expect(messages(text)).toContain('exactly one YAML document with no Markdown body');
  });

  it('rejects an explicit body key', () => {
    expect(messages(`${VALID}body: "## Definition"\n`)).toContain(
      'a graph-only identity has no body',
    );
  });

  it('rejects any other unknown key', () => {
    expect(messages(`${VALID}word_count: 0\n`)).toContain('unknown key "word_count"');
  });

  it('accepts the optional v2 fields', () => {
    const result = load(`${VALID}unresolved_references: []\nclaims: []\n`);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('rejects an empty or unparseable file', () => {
    expect(messages('')).toContain('the file is empty');
    expect(messages('categories: [\n')).toContain('YAML could not be parsed');
  });
});

describe('the wrong tier', () => {
  for (const tier of [1, 2]) {
    it(`rejects tier ${String(tier)}`, () => {
      const text = VALID.replace('tier: 3', `tier: ${String(tier)}`);
      expect(messages(text)).toContain('a graph-only identity must be tier 3');
    });
  }

  it('rejects a tier outside the enumeration', () => {
    expect(messages(VALID.replace('tier: 3', 'tier: 4'))).not.toEqual('');
  });
});

describe('shared identity rules', () => {
  it('rejects an id that is not a lowercase dotted identifier', () => {
    expect(messages(VALID.replace('concept.deep_learning.mamba', 'Mamba-Model'))).toContain(
      'must be a lowercase dotted identifier',
    );
  });

  it('rejects a slug whose name disagrees with the concept id', () => {
    expect(messages(VALID.replace('slug: /concepts/mamba', 'slug: /concepts/jamba'))).toContain(
      'must match the last segment of concept_id',
    );
  });

  it('rejects a primary_category outside categories', () => {
    expect(
      messages(
        VALID.replace(
          'primary_category: Artificial Intelligence/Deep Learning — Architectures',
          'primary_category: Mathematics/Analysis',
        ),
      ),
    ).toContain('primary_category must also appear in categories');
  });

  it('rejects a relationship to itself', () => {
    expect(
      messages(
        VALID.replace(
          'target: concept.deep_learning.resnet',
          'target: concept.deep_learning.mamba',
        ),
      ),
    ).toContain('must not declare a relationship to itself');
  });

  it('rejects a category outside the three atlas areas', () => {
    expect(messages(VALID.replace(/Artificial Intelligence\//g, 'Chemistry/'))).toContain(
      'must begin with one of the atlas areas',
    );
  });
});

describe('corpus rules across both formats', () => {
  const page = loadFixture('resnet.md', {
    conceptId: 'concept.deep_learning.resnet',
    title: 'ResNet',
    slug: '/concepts/resnet',
    aliases: ['Residual Network'],
    categories: ['Artificial Intelligence/Deep Learning — Architectures'],
    relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.mamba' }],
  });

  it('accepts a Markdown page and a graph-only identity side by side', () => {
    expect(validateCorpus([page, load(VALID).identity!])).toEqual([]);
  });

  it('rejects a graph-only file whose name disagrees with its slug', () => {
    const wrong = load(VALID, 'state-space.yaml').identity!;
    expect(
      validateCorpus([wrong])
        .map((d) => d.message)
        .join(' | '),
    ).toContain('requires the file to be named mamba.yaml');
  });

  it('rejects a concept_id shared with a Markdown page', () => {
    const clash = load(
      VALID.replace('concept.deep_learning.mamba', 'concept.deep_learning.resnet')
        .replace('slug: /concepts/mamba', 'slug: /concepts/resnet')
        .replace('target: concept.deep_learning.resnet', 'target: concept.deep_learning.pooling'),
      'resnet.yaml',
    ).identity!;
    const found = validateCorpus([page, clash])
      .map((d) => d.message)
      .join(' | ');
    expect(found).toContain('duplicate concept_id concept.deep_learning.resnet');
    expect(found).toContain('duplicate slug /concepts/resnet');
  });

  it('rejects a title or alias shared with a Markdown page', () => {
    // "Residual-Network" and the page's "Residual Network" normalise alike:
    // the hyphen folds to a space, so both become "residual network".
    const clash = load(
      VALID.replace('  - selective state space model', '  - Residual-Network'),
      'mamba.yaml',
    ).identity!;
    expect(
      validateCorpus([page, clash])
        .map((d) => d.message)
        .join(' | '),
    ).toContain('a name must identify exactly one concept');
  });

  it('rejects a relationship pointing at nothing, in either direction', () => {
    const lonely = load(
      VALID.replace(
        'target: concept.deep_learning.resnet',
        'target: concept.deep_learning.nowhere',
      ),
    ).identity!;
    expect(
      validateCorpus([lonely])
        .map((d) => d.message)
        .join(' | '),
    ).toContain('relationship target concept.deep_learning.nowhere does not exist in the corpus');
  });
});
