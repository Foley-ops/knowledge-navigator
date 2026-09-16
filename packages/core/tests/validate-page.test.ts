import { describe, expect, it } from 'vitest';
import { loadConceptFromText } from '../src/loader.js';
import { TIER_1_HEADINGS, validateConceptPage } from '../src/validate.js';
import { conceptMarkdown, loadFixture, tier1Body } from './fixtures.js';

const messages = (concept: Parameters<typeof validateConceptPage>[0]): string[] =>
  validateConceptPage(concept).map((d) => `${d.field}: ${d.message}`);

describe('Tier 1 page template', () => {
  it('accepts a page with every heading exactly once and in order', () => {
    expect(validateConceptPage(loadFixture('convolution.md'))).toEqual([]);
  });

  it('rejects a page missing a required heading', () => {
    const body = TIER_1_HEADINGS.filter((h) => h !== 'Intuition')
      .map((h) => `## ${h}\n\nProse.\n`)
      .join('\n');
    const diagnostics = validateConceptPage(loadFixture('convolution.md', { body }));
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.field).toBe('heading:Intuition');
    expect(diagnostics[0]?.message).toContain('## Intuition');
  });

  it('rejects a repeated heading', () => {
    const diagnostics = validateConceptPage(
      loadFixture('convolution.md', { body: `${tier1Body()}\n## Intuition\n\nAgain.\n` }),
    );
    expect(
      messages(loadFixture('convolution.md', { body: `${tier1Body()}\n## Intuition\n\nAgain.\n` })),
    ).toContain(
      'heading:Intuition: the heading "## Intuition" appears 2 times; it must appear exactly once',
    );
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it('rejects headings in the wrong order', () => {
    const reordered = [...TIER_1_HEADINGS];
    const moved = reordered.splice(2, 1)[0]!;
    reordered.push(moved);
    const body = reordered.map((h) => `## ${h}\n\nProse.\n`).join('\n');
    const diagnostics = validateConceptPage(loadFixture('convolution.md', { body }));
    expect(diagnostics.map((d) => d.field)).toContain('headings');
    expect(diagnostics.find((d) => d.field === 'headings')?.message).toContain('out of order');
  });

  it('rejects a level-2 heading outside the template', () => {
    const body = `${tier1Body()}\n## Further reading\n\nProse.\n`;
    const diagnostics = validateConceptPage(loadFixture('convolution.md', { body }));
    expect(diagnostics.map((d) => d.field)).toContain('heading:Further reading');
  });

  it('allows level-3 subsections inside a template section', () => {
    const body = tier1Body({ 'Formal treatment': 'Prose.\n\n### Discrete case\n\nMore prose.' });
    expect(validateConceptPage(loadFixture('convolution.md', { body }))).toEqual([]);
  });

  it('rejects a level-1 heading in the body', () => {
    const body = `# Convolution\n\n${tier1Body()}`;
    const diagnostics = validateConceptPage(loadFixture('convolution.md', { body }));
    expect(diagnostics.some((d) => d.message.includes('level-1 heading'))).toBe(true);
  });

  it('rejects a Tier 1 page with no sources', () => {
    const concept = loadFixture('convolution.md', { sources: [] });
    expect(messages(concept)).toContain('sources: a Tier 1 page must cite at least one source');
  });

  it('allows a root Tier 1 page that declares no relationship of its own', () => {
    // Connectivity is a corpus rule, not a page rule: convolution has no
    // prerequisites but is the target of four `requires` edges.
    expect(validateConceptPage(loadFixture('convolution.md', { relationships: [] }))).toEqual([]);
  });

  it('rejects raw HTML in the body', () => {
    const body = tier1Body({ Intuition: 'Prose.\n\n<iframe src="http://example.com"></iframe>' });
    const concept = loadFixture('convolution.md', { body });
    expect(validateConceptPage(concept).some((d) => d.message.includes('raw HTML'))).toBe(true);
  });
});

describe('Tier 2 pages', () => {
  const tier2 = { tier: 2, body: '\nA short definition paragraph that stands on its own.\n' };

  it('accepts a body with a definition paragraph, a source and a relationship', () => {
    expect(validateConceptPage(loadFixture('convolution.md', tier2))).toEqual([]);
  });

  it('does not impose the Tier 1 heading template', () => {
    const concept = loadFixture('convolution.md', tier2);
    expect(validateConceptPage(concept).map((d) => d.field)).not.toContain('heading:Definition');
  });

  it('rejects a Tier 2 page with an empty body', () => {
    const concept = loadFixture('convolution.md', { ...tier2, body: '\n\n' });
    expect(messages(concept)).toContain('body: a Tier 2 page must have a non-empty body');
  });

  it('rejects a Tier 2 page with no sources', () => {
    const concept = loadFixture('convolution.md', { ...tier2, sources: [] });
    expect(messages(concept)).toContain('sources: a Tier 2 page must cite at least one source');
  });
});

describe('Tier 3 pages', () => {
  const tier3 = { tier: 3, body: '\nOne sentence.\n', sources: [], relationships: [] };

  it('accepts valid metadata and a summary with no further body requirements', () => {
    expect(validateConceptPage(loadFixture('convolution.md', tier3))).toEqual([]);
  });

  it('rejects a Tier 3 page whose metadata is invalid', () => {
    const text = conceptMarkdown(tier3).replace(
      'summary: "An operation combining two functions by sliding one across the other."',
      'summary: ""',
    );
    const result = loadConceptFromText(text, 'convolution.md');
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.path)).toContain('summary');
  });
});
