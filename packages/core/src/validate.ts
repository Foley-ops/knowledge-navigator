/**
 * Content validation.
 *
 * Checkpoint C03 enforces the page template tier by tier. Checkpoint C04 adds
 * whole-corpus rules that span several files. Every rule produces a
 * `Diagnostic` addressed to a file and a field, and validation always reports
 * every problem it can see rather than stopping at the first.
 */
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { compareStrings, normalizeName, slugName } from './normalize.js';
import { loadConceptFile } from './loader.js';
import type { LoadedConcept } from './loader.js';
import type { Source, Tier } from './schema.js';

export interface Diagnostic {
  /** File the problem belongs to, or `(corpus)` for cross-file problems. */
  readonly file: string;
  /** Field path, heading name, or other locator within the file. */
  readonly field: string;
  readonly message: string;
}

/** Sort diagnostics by file, then field, then message. Stable and locale-free. */
export function sortDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort(
    (a, b) =>
      compareStrings(a.file, b.file) ||
      compareStrings(a.field, b.field) ||
      compareStrings(a.message, b.message),
  );
}

/**
 * The Tier 1 page template (runbook §4.1): these level-2 headings must each
 * appear exactly once, in this order, and no other level-2 heading may appear.
 */
export const TIER_1_HEADINGS = [
  'Definition',
  'Why it matters',
  'Intuition',
  'Concrete example',
  'Formal treatment',
  'Assumptions and requirements',
  'Uses and applicability',
  'Limitations and common mistakes',
  'Variants and alternatives',
  'History and attribution',
  'Sources',
  'Prerequisites and next connections',
] as const;

function headingIssues(concept: LoadedConcept): Diagnostic[] {
  const file = concept.fileName;
  const diagnostics: Diagnostic[] = [];
  const level2 = concept.headings.filter((heading) => heading.depth === 2).map((h) => h.text);

  for (const heading of concept.headings) {
    if (heading.depth === 1) {
      diagnostics.push({
        file,
        field: 'body',
        message: `the body must not contain a level-1 heading ("# ${heading.text}"); the page title comes from frontmatter`,
      });
    }
  }

  const expected = TIER_1_HEADINGS as readonly string[];
  for (const required of expected) {
    const count = level2.filter((text) => text === required).length;
    if (count === 0) {
      diagnostics.push({
        file,
        field: `heading:${required}`,
        message: `a Tier 1 page must contain the heading "## ${required}"`,
      });
    } else if (count > 1) {
      diagnostics.push({
        file,
        field: `heading:${required}`,
        message: `the heading "## ${required}" appears ${String(count)} times; it must appear exactly once`,
      });
    }
  }

  for (const text of level2) {
    if (!expected.includes(text)) {
      diagnostics.push({
        file,
        field: `heading:${text}`,
        message: `"## ${text}" is not part of the Tier 1 page template; use a level-3 heading for a subsection`,
      });
    }
  }

  // Order is only meaningful once every required heading is present exactly once.
  const present = level2.filter((text) => expected.includes(text));
  const uniquePresent = [...new Set(present)];
  if (uniquePresent.length === expected.length && present.length === expected.length) {
    const actual = present.join(' | ');
    const wanted = expected.join(' | ');
    if (actual !== wanted) {
      diagnostics.push({
        file,
        field: 'headings',
        message: `Tier 1 headings are out of order. Expected: ${wanted}. Found: ${actual}.`,
      });
    }
  }

  return diagnostics;
}

/** Validate one loaded page against the rules for its tier. */
export function validateConceptPage(concept: LoadedConcept): Diagnostic[] {
  const file = concept.fileName;
  const { frontmatter } = concept;
  const diagnostics: Diagnostic[] = [];

  for (const html of concept.rawHtml) {
    diagnostics.push({
      file,
      field: 'body',
      message: `canonical Markdown must not contain raw HTML; found ${JSON.stringify(html.slice(0, 60))}`,
    });
  }

  const tier: Tier = frontmatter.tier;

  if (tier === 1) {
    diagnostics.push(...headingIssues(concept));
    if (frontmatter.sources.length === 0) {
      diagnostics.push({
        file,
        field: 'sources',
        message: 'a Tier 1 page must cite at least one source',
      });
    }
    // A Tier 1 page is NOT required to declare a relationship: a root concept
    // such as convolution legitimately has no prerequisites. Connectivity is
    // checked across the corpus instead, where a concept also counts as
    // connected when another page points at it.
  }

  if (tier === 2) {
    if (concept.plainText.length === 0) {
      diagnostics.push({
        file,
        field: 'body',
        message: 'a Tier 2 page must have a non-empty body',
      });
    }
    if (frontmatter.sources.length === 0) {
      diagnostics.push({
        file,
        field: 'sources',
        message: 'a Tier 2 page must cite at least one source',
      });
    }
    if (frontmatter.relationships.length === 0 && frontmatter.categories.length === 0) {
      diagnostics.push({
        file,
        field: 'relationships',
        message: 'a Tier 2 page must declare at least one relationship or one category',
      });
    }
  }

  // Tier 3 requires valid metadata and a one-sentence summary only; both are
  // already guaranteed by the frontmatter schema, and Tier 3 pages are omitted
  // from reader navigation.

  return sortDiagnostics(diagnostics);
}

/* -------------------------------------------------------------------------- */
/* Whole-corpus validation (runbook C04)                                       */
/* -------------------------------------------------------------------------- */

/** Identity fields that must agree everywhere a `source_id` is cited. */
const SOURCE_IDENTITY_FIELDS = ['title', 'url', 'source_kind'] as const;

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key);
  if (existing === undefined) map.set(key, [value]);
  else existing.push(value);
}

/**
 * Validate rules that span more than one file. Every rule runs; the caller
 * receives every problem in the corpus in one pass rather than the first.
 */
export function validateCorpus(concepts: readonly LoadedConcept[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const knownFiles = new Set(concepts.map((concept) => concept.fileName));

  const byConceptId = new Map<string, LoadedConcept[]>();
  const bySlug = new Map<string, LoadedConcept[]>();
  const byName = new Map<string, { file: string; field: string; value: string }[]>();
  const bySourceId = new Map<string, { file: string; source: Source }[]>();

  for (const concept of concepts) {
    const { frontmatter: fm, fileName } = concept;

    push(byConceptId, fm.concept_id, concept);
    push(bySlug, fm.slug, concept);

    push(byName, normalizeName(fm.title), { file: fileName, field: 'title', value: fm.title });
    fm.aliases.forEach((alias, index) => {
      push(byName, normalizeName(alias), {
        file: fileName,
        field: `aliases.${String(index)}`,
        value: alias,
      });
    });

    for (const source of fm.sources) {
      push(bySourceId, source.source_id, { file: fileName, source });
    }

    // The file name is the Docusaurus document id and the target of every
    // relative concept link, so it must agree with the canonical slug.
    const expectedFile = `${slugName(fm.slug)}.md`;
    if (fileName !== expectedFile) {
      diagnostics.push({
        file: fileName,
        field: 'slug',
        message: `slug ${fm.slug} requires the file to be named ${expectedFile}`,
      });
    }
  }

  /* ----------------------------- duplicates ------------------------------ */

  for (const [conceptId, group] of byConceptId) {
    if (group.length < 2) continue;
    for (const concept of group) {
      diagnostics.push({
        file: concept.fileName,
        field: 'concept_id',
        message: `duplicate concept_id ${conceptId}, also declared in ${group
          .filter((other) => other !== concept)
          .map((other) => other.fileName)
          .join(', ')}`,
      });
    }
  }

  for (const [slug, group] of bySlug) {
    if (group.length < 2) continue;
    for (const concept of group) {
      diagnostics.push({
        file: concept.fileName,
        field: 'slug',
        message: `duplicate slug ${slug}, also declared in ${group
          .filter((other) => other !== concept)
          .map((other) => other.fileName)
          .join(', ')}`,
      });
    }
  }

  for (const [normalized, group] of byName) {
    const files = new Set(group.map((entry) => entry.file));
    if (files.size < 2) continue;
    for (const entry of group) {
      diagnostics.push({
        file: entry.file,
        field: entry.field,
        message: `"${entry.value}" normalises to "${normalized}", which is also used by ${[...files]
          .filter((file) => file !== entry.file)
          .join(', ')}; a name must identify exactly one concept`,
      });
    }
  }

  /* -------------------------- relationship targets ------------------------ */

  const conceptIds = new Set(concepts.map((concept) => concept.frontmatter.concept_id));
  for (const concept of concepts) {
    concept.frontmatter.relationships.forEach((relationship, index) => {
      if (!conceptIds.has(relationship.target)) {
        diagnostics.push({
          file: concept.fileName,
          field: `relationships.${String(index)}.target`,
          message: `relationship target ${relationship.target} does not exist in the corpus`,
        });
      }
      if (relationship.target === concept.frontmatter.concept_id) {
        diagnostics.push({
          file: concept.fileName,
          field: `relationships.${String(index)}.target`,
          message: 'a concept must not declare a relationship to itself',
        });
      }
    });

    // primary_category being one of `categories` is enforced by the frontmatter
    // schema; it is restated here so a page can never reach the compiler with a
    // primary category that has no category row to attach to.
    if (!concept.frontmatter.categories.includes(concept.frontmatter.primary_category)) {
      diagnostics.push({
        file: concept.fileName,
        field: 'primary_category',
        message: `primary_category ${concept.frontmatter.primary_category} is missing from categories`,
      });
    }
  }

  /* ------------------------------- sources -------------------------------- */

  for (const [sourceId, group] of bySourceId) {
    const first = group[0];
    if (first === undefined) continue;
    for (const entry of group.slice(1)) {
      for (const field of SOURCE_IDENTITY_FIELDS) {
        if (entry.source[field] === first.source[field]) continue;
        diagnostics.push({
          file: entry.file,
          field: `sources.${sourceId}.${field}`,
          message: `source ${sourceId} declares ${field} "${entry.source[field]}" here but "${first.source[field]}" in ${first.file}; one source_id must describe one source`,
        });
      }
    }
  }

  /* ---------------------------- connectivity ------------------------------ */

  // The corpus is meant to be a connected map, not a pile of pages. A concept
  // counts as connected when it declares a relationship or when another concept
  // points at it, so a root concept with no prerequisites is still valid.
  const connected = new Set<string>();
  for (const concept of concepts) {
    for (const relationship of concept.frontmatter.relationships) {
      connected.add(concept.frontmatter.concept_id);
      connected.add(relationship.target);
    }
  }
  for (const concept of concepts) {
    if (concept.frontmatter.tier === 3) continue;
    if (connected.has(concept.frontmatter.concept_id)) continue;
    diagnostics.push({
      file: concept.fileName,
      field: 'relationships',
      message: `${concept.frontmatter.concept_id} takes part in no typed relationship; every Tier 1 and Tier 2 concept must connect to the rest of the corpus`,
    });
  }

  /* ---------------------------- relative links ---------------------------- */

  for (const concept of concepts) {
    for (const link of concept.links) {
      if (!link.url.startsWith('.')) continue;
      const target = link.url.split('#')[0];
      if (target === undefined || target === '') continue;
      if (target.includes('..')) {
        diagnostics.push({
          file: concept.fileName,
          field: `link:${link.url}`,
          message: `line ${String(link.line)}: a concept link must not leave the content directory`,
        });
        continue;
      }
      const resolved = target.replace(/^\.\//, '');
      if (!knownFiles.has(resolved)) {
        diagnostics.push({
          file: concept.fileName,
          field: `link:${link.url}`,
          message: `line ${String(link.line)}: relative link target ${resolved} does not exist in the corpus`,
        });
      }
    }
  }

  return sortDiagnostics(diagnostics);
}

/* -------------------------------------------------------------------------- */
/* Loading and validating a whole directory                                    */
/* -------------------------------------------------------------------------- */

export interface CorpusResult {
  readonly ok: boolean;
  readonly concepts: readonly LoadedConcept[];
  readonly diagnostics: readonly Diagnostic[];
  /** SHA-256 over every file name and content hash, in sorted order. */
  readonly corpusHash: string;
}

/** Deterministic hash identifying the exact canonical corpus that was read. */
export function computeCorpusHash(concepts: readonly LoadedConcept[]): string {
  const hash = createHash('sha256');
  for (const concept of [...concepts].sort((a, b) => compareStrings(a.fileName, b.fileName))) {
    hash.update(`${concept.fileName}\n${concept.contentHash}\n`);
  }
  return hash.digest('hex');
}

/**
 * Load and validate every `.md` file in a content directory.
 *
 * Names beginning with `_` or `.` are ignored, matching the Docusaurus
 * convention for partials, so a draft can sit beside canonical content without
 * entering the corpus.
 */
export async function loadCorpus(contentDir: string): Promise<CorpusResult> {
  let entries: string[];
  try {
    entries = (await readdir(contentDir)).filter(
      (name) => name.endsWith('.md') && !name.startsWith('_') && !name.startsWith('.'),
    );
  } catch (error) {
    return {
      ok: false,
      concepts: [],
      diagnostics: [
        {
          file: '(corpus)',
          field: 'contentDir',
          message: `could not read ${contentDir}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      corpusHash: computeCorpusHash([]),
    };
  }
  entries.sort(compareStrings);

  const concepts: LoadedConcept[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const fileName of entries) {
    const result = await loadConceptFile(join(contentDir, fileName), fileName);
    if (!result.ok || result.concept === undefined) {
      for (const issue of result.issues) {
        diagnostics.push({ file: fileName, field: issue.path, message: issue.message });
      }
      continue;
    }
    concepts.push(result.concept);
    diagnostics.push(...validateConceptPage(result.concept));
  }

  diagnostics.push(...validateCorpus(concepts));
  concepts.sort((a, b) => compareStrings(a.frontmatter.concept_id, b.frontmatter.concept_id));

  const sorted = sortDiagnostics(diagnostics);
  return {
    ok: sorted.length === 0,
    concepts,
    diagnostics: sorted,
    corpusHash: computeCorpusHash(concepts),
  };
}
