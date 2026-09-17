/**
 * A reading order has to be a reading order.
 *
 * `requires` and `prerequisite_of` are the only two relationships that claim
 * one page comes before another, and the learning path presents the result as
 * the order to read them in. A cycle among them makes that promise unkeepable:
 * the corpus asks a reader to understand three things before any of them.
 *
 * Nothing but a whole-corpus check finds this. Every edge of a cycle can be
 * individually defensible — the one this test was written for was spectral
 * theory needing operators, needing matrix decompositions, needing spectral
 * theory — and each page in isolation is valid.
 */
import { describe, expect, it } from 'vitest';
import { loadConceptFromText, validateCorpus } from '../src/index.js';
import type { LoadedConcept } from '../src/index.js';
import { conceptMarkdown } from './fixtures.js';

interface Edge {
  readonly type: 'requires' | 'prerequisite_of' | 'contributes_to';
  readonly target: string;
}

/** One valid page, named by a bare word, declaring the edges given. */
function page(name: string, relationships: Edge[]): LoadedConcept {
  const result = loadConceptFromText(
    conceptMarkdown({
      conceptId: `concept.test.${name}`,
      title: name,
      slug: `/concepts/${name}`,
      aliases: [`${name} (test fixture)`],
      categories: ['Mathematics/Analysis'],
      relationships: relationships.map((edge) => ({
        type: edge.type,
        target: `concept.test.${edge.target}`,
        note: `${name} and ${edge.target} are related for the purposes of this fixture.`,
      })),
    }),
    `${name}.md`,
  );
  if (!result.ok) {
    throw new Error(`fixture ${name} did not load: ${JSON.stringify(result.issues)}`);
  }
  return result.concept;
}

/** Only the cycle diagnostics, so an unrelated rule cannot make this pass. */
function cycleMessages(concepts: LoadedConcept[]): string[] {
  return validateCorpus(concepts)
    .filter((diagnostic) => diagnostic.message.startsWith('prerequisite cycle:'))
    .map((diagnostic) => diagnostic.message);
}

describe('prerequisite cycles', () => {
  it('accepts a chain, however long', () => {
    const concepts = [
      page('first', [{ type: 'prerequisite_of', target: 'second' }]),
      page('second', [{ type: 'requires', target: 'first' }]),
      page('third', [{ type: 'requires', target: 'second' }]),
      page('fourth', [{ type: 'requires', target: 'third' }]),
    ];
    expect(cycleMessages(concepts)).toEqual([]);
  });

  it('accepts a diamond, where two routes meet again', () => {
    const concepts = [
      page('base', [{ type: 'prerequisite_of', target: 'left' }]),
      page('left', [{ type: 'requires', target: 'base' }]),
      page('right', [{ type: 'requires', target: 'base' }]),
      page('top', [
        { type: 'requires', target: 'left' },
        { type: 'requires', target: 'right' },
      ]),
    ];
    expect(cycleMessages(concepts)).toEqual([]);
  });

  it('refuses two concepts that each require the other', () => {
    const concepts = [
      page('chicken', [{ type: 'requires', target: 'egg' }]),
      page('egg', [{ type: 'requires', target: 'chicken' }]),
    ];
    const messages = cycleMessages(concepts);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('concept.test.chicken');
    expect(messages[0]).toContain('concept.test.egg');
  });

  it('refuses a cycle spelled with prerequisite_of instead of requires', () => {
    // The same loop, declared from the other end by every page. Which end
    // declares an edge is a matter of where it reads better, so a check that
    // caught only one spelling would catch only half the mistakes.
    const concepts = [
      page('one', [{ type: 'prerequisite_of', target: 'two' }]),
      page('two', [{ type: 'prerequisite_of', target: 'three' }]),
      page('three', [{ type: 'prerequisite_of', target: 'one' }]),
    ];
    expect(cycleMessages(concepts)).toHaveLength(1);
  });

  it('refuses the three-page cycle that this rule was written for', () => {
    const concepts = [
      page('spectral', [{ type: 'requires', target: 'operators' }]),
      page('operators', [{ type: 'requires', target: 'decompositions' }]),
      page('decompositions', [{ type: 'requires', target: 'spectral' }]),
    ];
    const messages = cycleMessages(concepts);
    expect(messages).toHaveLength(1);
    for (const name of ['spectral', 'operators', 'decompositions']) {
      expect(messages[0]).toContain(`concept.test.${name}`);
    }
  });

  it('reports one cycle once, however many of its pages the walk enters first', () => {
    const concepts = [
      page('alpha', [{ type: 'requires', target: 'beta' }]),
      page('beta', [{ type: 'requires', target: 'gamma' }]),
      page('gamma', [{ type: 'requires', target: 'alpha' }]),
      page('delta', [{ type: 'requires', target: 'alpha' }]),
    ];
    expect(cycleMessages(concepts)).toHaveLength(1);
  });

  it('reports two separate cycles separately', () => {
    const concepts = [
      page('a1', [{ type: 'requires', target: 'a2' }]),
      page('a2', [{ type: 'requires', target: 'a1' }]),
      page('b1', [{ type: 'requires', target: 'b2' }]),
      page('b2', [{ type: 'requires', target: 'b1' }]),
    ];
    expect(cycleMessages(concepts)).toHaveLength(2);
  });

  it('ignores relationships that do not claim an order', () => {
    // contributes_to, contrasts_with and the rest say two concepts are related,
    // not that one comes first, so a loop among them is ordinary and fine —
    // which is exactly how the real cycle was broken.
    const concepts = [
      page('here', [{ type: 'contributes_to', target: 'there' }]),
      page('there', [{ type: 'contributes_to', target: 'here' }]),
    ];
    expect(cycleMessages(concepts)).toEqual([]);
  });

  it('never sees a page that requires itself, because the schema refuses it first', () => {
    // The shortest cycle is caught a layer earlier, when the page is loaded.
    // Recorded here so the two rules are known to cover the case between them
    // rather than each assuming the other has it.
    const result = loadConceptFromText(
      conceptMarkdown({
        conceptId: 'concept.test.alone',
        title: 'Alone',
        slug: '/concepts/alone',
        aliases: ['alone (test fixture)'],
        relationships: [{ type: 'requires', target: 'concept.test.alone' }],
      }),
      'alone.md',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain(
      'must not declare a relationship to itself',
    );
  });
});
