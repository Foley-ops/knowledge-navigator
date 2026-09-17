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

  it('keeps Programming visible with no canonical page behind it', () => {
    const programming = [...atlas.areas.values()].find((area) => area.title === 'Programming');
    expect(programming).toBeDefined();
    expect(programming!.childCategoryIds.length).toBeGreaterThan(0);

    const inProgramming = [...atlas.candidates.values()].filter((candidate) =>
      candidate.categories.some((id) => atlas.categories.get(id)?.areaId === programming!.areaId),
    );
    expect(inProgramming.length).toBeGreaterThan(0);
    expect(inProgramming.every((candidate) => candidate.status !== 'covered')).toBe(true);
  });

  it('marks exactly the eleven existing concepts as covered', () => {
    const covered = [...atlas.candidates.values()].filter((c) => c.status === 'covered');
    expect(covered.map((c) => c.canonical_concept_id).sort()).toEqual(ELEVEN_CONCEPTS);
    expect(new Set(covered.map((c) => c.canonical_concept_id)).size).toBe(ELEVEN_CONCEPTS.length);
  });

  it('leaves every other candidate uncovered and unmapped', () => {
    const others = [...atlas.candidates.values()].filter((c) => c.status !== 'covered');
    expect(others.every((c) => c.canonical_concept_id === null)).toBe(true);
    expect(others.every((c) => c.status === 'candidate')).toBe(true);
  });

  it('keeps empty categories rather than hiding unexplained neighbourhoods', () => {
    expect(atlasCounts(atlas).emptyCategories).toBeGreaterThan(0);
    const empty = [...atlas.categories.values()]
      .filter((node) => node.candidateIds.length === 0 && node.childCategoryIds.length === 0)
      .map((node) => node.path)
      .sort();
    expect(empty).toContain('Mathematics/Information Theory');
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
