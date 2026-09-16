/** Helpers for building concept files in tests. */
import { loadConceptFromText } from '../src/loader.js';
import type { LoadedConcept } from '../src/loader.js';
import { TIER_1_HEADINGS } from '../src/validate.js';

export interface FixtureOptions {
  readonly conceptId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly aliases?: readonly string[];
  readonly kind?: string;
  readonly tier?: number;
  readonly reviewState?: string;
  readonly summary?: string;
  readonly categories?: readonly string[];
  readonly primaryCategory?: string;
  readonly relationships?: readonly { type: string; target: string; note?: string }[];
  readonly sources?: readonly {
    id: string;
    title?: string;
    url?: string;
    kind?: string;
    supports?: readonly string[];
    checkedOn?: string;
  }[];
  readonly body?: string;
}

const DEFAULT_SOURCE = {
  id: 'source.deep_learning_book.convnets',
  title: 'Deep Learning, Chapter 9 — Convolutional Networks',
  url: 'https://www.deeplearningbook.org/contents/convnets.html',
  kind: 'authoritative-secondary',
  supports: ['definition'],
  checkedOn: '2026-09-16',
};

/** A complete, correctly ordered Tier 1 body. */
export function tier1Body(extra: Record<string, string> = {}): string {
  return TIER_1_HEADINGS.map(
    (heading) => `## ${heading}\n\n${extra[heading] ?? `Prose for ${heading.toLowerCase()}.`}\n`,
  ).join('\n');
}

export function conceptMarkdown(options: FixtureOptions = {}): string {
  const {
    conceptId = 'concept.analysis.convolution',
    title = 'Convolution',
    slug = '/concepts/convolution',
    aliases = ['convolution operator'],
    kind = 'mathematical-object',
    tier = 1,
    reviewState = 'generated-draft',
    summary = 'An operation combining two functions by sliding one across the other.',
    categories = ['Mathematics/Analysis'],
    primaryCategory = categories[0]!,
    relationships = [{ type: 'contrasts_with', target: 'concept.analysis.cross_correlation' }],
    sources = [DEFAULT_SOURCE],
    body = tier1Body(),
  } = options;

  const lines: string[] = ['---'];
  lines.push(`concept_id: ${conceptId}`);
  lines.push(`title: ${JSON.stringify(title)}`);
  lines.push(`slug: ${slug}`);
  if (aliases.length > 0) {
    lines.push('aliases:');
    for (const alias of aliases) lines.push(`  - ${JSON.stringify(alias)}`);
  }
  lines.push(`kind: ${kind}`);
  lines.push(`tier: ${String(tier)}`);
  lines.push(`review_state: ${reviewState}`);
  lines.push(`summary: ${JSON.stringify(summary)}`);
  lines.push('categories:');
  for (const category of categories) lines.push(`  - ${JSON.stringify(category)}`);
  lines.push(`primary_category: ${JSON.stringify(primaryCategory)}`);
  if (relationships.length > 0) {
    lines.push('relationships:');
    for (const relationship of relationships) {
      lines.push(`  - type: ${relationship.type}`);
      lines.push(`    target: ${relationship.target}`);
      if (relationship.note !== undefined) {
        lines.push(`    note: ${JSON.stringify(relationship.note)}`);
      }
    }
  }
  if (sources.length > 0) {
    lines.push('sources:');
    for (const source of sources) {
      lines.push(`  - source_id: ${source.id}`);
      lines.push(`    title: ${JSON.stringify(source.title ?? DEFAULT_SOURCE.title)}`);
      lines.push(`    url: ${source.url ?? DEFAULT_SOURCE.url}`);
      lines.push(`    source_kind: ${source.kind ?? DEFAULT_SOURCE.kind}`);
      lines.push('    supports:');
      for (const section of source.supports ?? DEFAULT_SOURCE.supports) {
        lines.push(`      - ${section}`);
      }
      lines.push(`    checked_on: ${source.checkedOn ?? DEFAULT_SOURCE.checkedOn}`);
    }
  }
  lines.push('---', '');
  return `${lines.join('\n')}\n${body}`;
}

/** Build and load a fixture, asserting that it parses. */
export function loadFixture(fileName: string, options: FixtureOptions = {}): LoadedConcept {
  const result = loadConceptFromText(conceptMarkdown(options), fileName);
  if (!result.ok || result.concept === undefined) {
    throw new Error(
      `fixture ${fileName} did not load: ${result.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`,
    );
  }
  return result.concept;
}
