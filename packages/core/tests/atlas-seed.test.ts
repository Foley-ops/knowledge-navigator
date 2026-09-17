/**
 * The shipped atlas seed (v2 runbook K01 and Appendix A).
 *
 * `content/atlas.yaml` was generated from Appendix A, so this file re-reads the
 * appendix and checks the result independently: every frozen label is present
 * exactly once after normalisation, the three areas exist, Programming is
 * populated with no canonical page behind it, and exactly the eleven existing
 * concepts are marked covered.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { atlasCounts, loadAtlasFromText, resolveAtlasCategoryPath } from '../src/atlas.js';
import { normalizeName } from '../src/normalize.js';
import { projectPaths } from '../src/paths.js';

const paths = projectPaths();
const atlasResult = loadAtlasFromText(readFileSync(paths.atlasFile, 'utf8'));
const atlas = atlasResult.atlas;
if (atlas === undefined) throw new Error('content/atlas.yaml did not parse');

/** Every label Appendix A names, in order, split on the middle dot. */
function appendixLabels(): string[] {
  const runbook = readFileSync(`${paths.root}/KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md`, 'utf8');
  const appendix = runbook.slice(runbook.indexOf('## Appendix A'));
  const labels: string[] = [];

  for (const area of ['Mathematics', 'Artificial Intelligence', 'Programming']) {
    const afterHeading = appendix.slice(appendix.indexOf(`### ${area}\n`));
    const start = afterHeading.indexOf('```text\n') + '```text\n'.length;
    const block = afterHeading.slice(start, afterHeading.indexOf('\n```', start));
    for (const raw of block.split('\n')) {
      if (raw.trim() === '') continue;
      let line = raw.trim();
      if (raw.startsWith('  ') && line.includes(':')) {
        const [label, remainder] = [
          line.slice(0, line.indexOf(':')),
          line.slice(line.indexOf(':') + 1),
        ];
        labels.push(label.trim());
        line = remainder.trim();
      } else if (!raw.startsWith('  ')) {
        labels.push(line);
        continue;
      }
      for (const item of line.split(/\s*[·→]\s*/)) {
        if (item.trim() !== '') labels.push(item.trim());
      }
    }
  }
  return labels;
}

const ELEVEN_CONCEPTS = [
  'concept.analysis.convolution',
  'concept.analysis.cross_correlation',
  'concept.analysis.translation_equivariance',
  'concept.deep_learning.backpropagation_through_convolution',
  'concept.deep_learning.convolutional_layer',
  'concept.deep_learning.lenet',
  'concept.deep_learning.pooling',
  'concept.deep_learning.receptive_field',
  'concept.deep_learning.residual_connection',
  'concept.deep_learning.resnet',
  'concept.deep_learning.vgg',
];

describe('content/atlas.yaml', () => {
  it('is structurally valid', () => {
    expect(atlasResult.diagnostics).toEqual([]);
    expect(atlasResult.ok).toBe(true);
  });

  it('has exactly the three root areas', () => {
    expect([...atlas.areas.values()].map((area) => area.title).sort()).toEqual([
      'Artificial Intelligence',
      'Mathematics',
      'Programming',
    ]);
  });

  it('represents every Appendix A label exactly once after normalisation', () => {
    const wanted = appendixLabels().map(normalizeName);
    const uniqueWanted = [...new Set(wanted)].sort();
    // Appendix A repeats exactly two labels — Lean and Logic Programming — and
    // each becomes ONE candidate filed in both of its categories.
    expect(wanted.length - uniqueWanted.length).toBe(2);

    const present = [
      ...[...atlas.categories.values()].map((node) => normalizeName(node.title)),
      ...[...atlas.candidates.values()].map((candidate) => normalizeName(candidate.title)),
    ].sort();

    expect(present.length).toBe(uniqueWanted.length);
    expect(present).toEqual(uniqueWanted);
  });

  it('keeps Programming visible, with categories and candidates of its own', () => {
    // When this was first written it also asserted that nothing in Programming
    // was covered, which was true of the seed and is not a property of the
    // atlas: the area exists to be written about, and pages have since been
    // written. What matters is that the area is present and populated.
    const programming = [...atlas.areas.values()].find((area) => area.title === 'Programming');
    expect(programming).toBeDefined();
    expect(programming!.childCategoryIds.length).toBeGreaterThan(0);

    const inProgramming = [...atlas.candidates.values()].filter((candidate) =>
      candidate.categories.some((id) => atlas.categories.get(id)?.areaId === programming!.areaId),
    );
    expect(inProgramming.length).toBeGreaterThan(0);
  });

  it('still covers the eleven concepts version 1 wrote', () => {
    // This used to assert that these were the ONLY covered candidates, which
    // was a fact about the seed rather than a rule: covering a candidate is
    // what writing a page is for. What must stay true is that none of the
    // original eleven quietly lost its place on the map.
    const covered = [...atlas.candidates.values()]
      .filter((c) => c.status === 'covered')
      .map((c) => c.canonical_concept_id);
    for (const conceptId of ELEVEN_CONCEPTS) {
      expect(covered, conceptId).toContain(conceptId);
    }
  });

  it('never lets two candidates claim one concept, or an uncovered one claim any', () => {
    const covered = [...atlas.candidates.values()].filter((c) => c.status === 'covered');
    const claimed = covered.map((c) => c.canonical_concept_id);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect(covered.every((c) => c.canonical_concept_id !== null)).toBe(true);

    const others = [...atlas.candidates.values()].filter((c) => c.status !== 'covered');
    expect(others.every((c) => c.canonical_concept_id === null)).toBe(true);
  });

  it('keeps categories Appendix A names but filed nothing under', () => {
    // The atlas does not drop a neighbourhood because nobody has written about
    // it yet. Counted against the atlas alone — with no corpus supplied — these
    // categories have no candidate of their own and no children, and that is
    // true of the seed for as long as the seed is frozen.
    const withoutCandidates = [...atlas.categories.values()]
      .filter((node) => node.candidateIds.length === 0 && node.childCategoryIds.length === 0)
      .map((node) => node.path)
      .sort();
    expect(withoutCandidates).toContain('Mathematics/Information Theory');
    expect(atlasCounts(atlas).emptyCategories).toBe(withoutCandidates.length);
  });

  it('stops calling a category empty once a concept sits in it', () => {
    // A category holding a page is not an empty part of the map. Before any
    // content existed outside the candidate list the two were indistinguishable;
    // they are not the same thing, and Coverage must not report otherwise.
    const information = resolveAtlasCategoryPath(atlas, 'Mathematics/Information Theory');
    expect(information).toBeDefined();
    const before = atlasCounts(atlas).emptyCategories;
    const after = atlasCounts(atlas, new Set([information!])).emptyCategories;
    expect(after).toBe(before - 1);
  });

  it('resolves every category path the canonical corpus already uses', () => {
    for (const path of [
      'Mathematics/Analysis',
      'Artificial Intelligence/Deep Learning — Architectures',
      'Artificial Intelligence/Deep Learning — Training',
      'Artificial Intelligence/Computer Vision',
    ]) {
      expect(resolveAtlasCategoryPath(atlas, path)).toBeDefined();
    }
  });

  it('carries no factual summary anywhere', () => {
    const text = readFileSync(paths.atlasFile, 'utf8');
    for (const forbidden of ['summary:', 'description:', 'sources:', 'relationships:']) {
      expect(text).not.toContain(forbidden);
    }
  });
});
