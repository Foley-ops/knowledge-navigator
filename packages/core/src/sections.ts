/**
 * Split a canonical Markdown body into its level-2 sections.
 *
 * Used by claim validation (does the section a claim names actually say
 * anything?) and by the deterministic comparison table, which quotes stored
 * Markdown rather than asking a model what a page says.
 *
 * The split is textual and does not evaluate anything. Fenced code blocks are
 * respected so a `## ` line inside a fence is not mistaken for a heading.
 */
import { supportedSections } from './schema.js';
import type { SupportedSection } from './schema.js';
import { TIER_1_HEADINGS } from './headings.js';

/** Kebab-case a Tier 1 heading: `Uses and applicability` → `uses-and-applicability`. */
export function sectionKey(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Heading text for a section key, when the key names a Tier 1 heading. */
export function sectionHeading(key: string): string | undefined {
  return TIER_1_HEADINGS.find((heading) => sectionKey(heading) === key);
}

export interface MarkdownSection {
  /** The heading exactly as written, without the leading `## `. */
  readonly heading: string;
  /** Kebab-case key, matching the `supports` and `section` vocabularies. */
  readonly key: string;
  /** Body text between this heading and the next level-2 heading, trimmed. */
  readonly content: string;
}

const FENCE = /^(\s*)(`{3,}|~{3,})/;

/** Split a Markdown body into its level-2 sections, in document order. */
export function splitSections(body: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  let heading: string | undefined;
  let buffer: string[] = [];
  let fence: string | undefined;

  const flush = (): void => {
    if (heading === undefined) return;
    sections.push({
      heading,
      key: sectionKey(heading),
      content: buffer.join('\n').trim(),
    });
    buffer = [];
  };

  for (const line of body.split('\n')) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[2] ?? '';
      if (fence === undefined) fence = marker;
      else if (marker.startsWith(fence[0] ?? '') && marker.length >= fence.length)
        fence = undefined;
    }

    if (fence === undefined && line.startsWith('## ')) {
      flush();
      heading = line.slice(3).trim();
      continue;
    }
    if (heading !== undefined) buffer.push(line);
  }
  flush();
  return sections;
}

/** Section key → trimmed content, for the substantive sections that have prose. */
export function nonEmptySectionKeys(body: string): Set<SupportedSection> {
  const substantive = new Set<string>(supportedSections);
  const keys = new Set<SupportedSection>();
  for (const section of splitSections(body)) {
    if (!substantive.has(section.key)) continue;
    if (section.content === '') continue;
    keys.add(section.key as SupportedSection);
  }
  return keys;
}
