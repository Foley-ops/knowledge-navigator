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
import { dirname, join } from 'node:path';
import { compareStrings, normalizeName, slugName } from './normalize.js';
import { atlasCounts, emptyAtlasIndex, loadAtlasFile, resolveAtlasCategoryPath } from './atlas.js';
import type { AtlasIndex, AtlasStatus } from './atlas.js';
import { loadGraphOnlyFile } from './graph-only.js';
import { ATLAS_FILE_NAME, GRAPH_ONLY_DIR_NAME } from './atlas-paths.js';
import { TIER_1_HEADINGS } from './headings.js';
import { nonEmptySectionKeys } from './sections.js';
import { sortDiagnostics } from './diagnostics.js';
import type { Diagnostic } from './diagnostics.js';
import { loadConceptFile } from './loader.js';
import type { LoadedConcept } from './loader.js';
import {
  claimStatuses,
  promotedReviewStates as PROMOTED_REVIEW_STATES,
  reviewStates,
} from './schema.js';
import type { ClaimStatus, ReviewState, Source, Tier } from './schema.js';
import type { ConceptFormat } from './loader.js';

// `Diagnostic` and `sortDiagnostics` moved to ./diagnostics.js so the atlas and
// graph-only validators can use them without importing this module. They are
// re-exported here because every existing caller imports them from ./validate.
export { sortDiagnostics };
export type { Diagnostic };

// The Tier 1 template moved to ./headings.js so section splitting can use it
// without depending on the validator. Re-exported because every existing caller
// imports it from here.
export { TIER_1_HEADINGS };

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

export interface CorpusValidationOptions {
  /**
   * The curated atlas, when one is available. Rules that need it — currently
   * "a proposed category must be a category that exists" — are skipped when it
   * is absent, so a caller validating a fixture in isolation still works.
   * `loadCorpus` always supplies it.
   */
  readonly atlas?: AtlasIndex;
}

/**
 * Validate rules that span more than one file. Every rule runs; the caller
 * receives every problem in the corpus in one pass rather than the first.
 */
export function validateCorpus(
  concepts: readonly LoadedConcept[],
  options: CorpusValidationOptions = {},
): Diagnostic[] {
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
    // relative concept link, so it must agree with the canonical slug. A
    // graph-only identity has no document, but the same rule keeps its address
    // predictable and makes a Tier 3 → Tier 2 promotion a rename of one file.
    const expectedFile = `${slugName(fm.slug)}.${concept.format === 'graph-only' ? 'yaml' : 'md'}`;
    if (fileName !== expectedFile) {
      diagnostics.push({
        file: fileName,
        field: 'slug',
        message: `slug ${fm.slug} requires the file to be named ${expectedFile}`,
      });
    }

    // Tier and storage format must agree in both directions: a Markdown page is
    // a reader-facing article, a graph-only identity never is.
    if (concept.format === 'graph-only' && fm.tier !== 3) {
      diagnostics.push({
        file: fileName,
        field: 'tier',
        message: `tier ${String(fm.tier)} cannot be stored as a graph-only identity; a reader-facing page belongs in content/concepts as Markdown`,
      });
    }
    if (concept.format === 'markdown' && fm.tier === 3) {
      diagnostics.push({
        file: fileName,
        field: 'tier',
        message:
          'tier 3 has no article, so it belongs in content/graph-only as YAML rather than in content/concepts',
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

  /* ------------------------------- claims --------------------------------- */

  // A claim_id is an address a reviewer, an export or a saved item can point
  // at, so it has to be unique across the whole corpus, not just its own page.
  const byClaimId = new Map<string, { file: string; index: number }[]>();
  for (const concept of concepts) {
    concept.frontmatter.claims.forEach((claim, index) => {
      push(byClaimId, claim.claim_id, { file: concept.fileName, index });
    });
  }
  for (const [claimId, group] of byClaimId) {
    if (group.length < 2) continue;
    for (const entry of group) {
      diagnostics.push({
        file: entry.file,
        field: `claims.${String(entry.index)}.claim_id`,
        message: `duplicate claim_id ${claimId}, also declared in ${group
          .filter((other) => other !== entry)
          .map((other) => other.file)
          .join(', ')}`,
      });
    }
  }

  // Claim-level evidence is optional for a generated draft — v1's eleven pages
  // predate it and stay valid. It becomes mandatory the moment a human raises a
  // page above generated-draft, because that promotion is precisely the claim
  // that each statement was checked against its source.
  for (const concept of concepts) {
    const { frontmatter: fm } = concept;
    if (!(PROMOTED_REVIEW_STATES as readonly string[]).includes(fm.review_state)) continue;

    if (fm.tier === 1) {
      const covered = new Set(fm.claims.map((claim) => claim.section));
      const missing = [...nonEmptySectionKeys(concept.body)]
        .filter((section) => !covered.has(section))
        .sort(compareStrings);
      for (const section of missing) {
        diagnostics.push({
          file: concept.fileName,
          field: `claims:${section}`,
          message: `review_state ${fm.review_state} requires at least one claim for every substantive section; "${section}" has prose but no claim`,
        });
      }
      continue;
    }

    if (fm.claims.length === 0) {
      diagnostics.push({
        file: concept.fileName,
        field: 'claims',
        message: `review_state ${fm.review_state} requires at least one claim with evidence; only generated-draft may have none`,
      });
    }
  }

  /* ------------------------- unresolved references ------------------------ */

  const atlasForRules =
    options.atlas !== undefined && options.atlas.areas.size > 0 ? options.atlas : undefined;

  // A label is "unresolved" only while nothing in the corpus answers to it.
  // Once a concept with that name exists the entry is stale: it would keep an
  // item in the backlog that is already done, and hide a link that should be
  // written. Names are compared with the same normalisation used everywhere.
  const conceptByName = new Map<string, string>();
  for (const concept of concepts) {
    const { frontmatter: fm } = concept;
    conceptByName.set(normalizeName(fm.title), fm.concept_id);
    for (const alias of fm.aliases) conceptByName.set(normalizeName(alias), fm.concept_id);
  }

  for (const concept of concepts) {
    concept.frontmatter.unresolved_references.forEach((reference, index) => {
      const field = `unresolved_references.${String(index)}`;
      const resolved = conceptByName.get(normalizeName(reference.label));
      if (resolved !== undefined) {
        diagnostics.push({
          file: concept.fileName,
          field: `${field}.label`,
          message: `"${reference.label}" now resolves to ${resolved}; link it and remove this entry, or defer it deliberately`,
        });
      }

      if (atlasForRules === undefined) return;
      reference.proposed_categories.forEach((category, categoryIndex) => {
        if (resolveAtlasCategoryPath(atlasForRules, category) !== undefined) return;
        diagnostics.push({
          file: concept.fileName,
          field: `${field}.proposed_categories.${String(categoryIndex)}`,
          message: `proposed category "${category}" is not a category in the atlas`,
        });
      });
    });
  }

  /* ------------------------------- the atlas ------------------------------ */

  // An empty index means "no atlas was supplied", not "an atlas with nothing in
  // it", so atlas-dependent rules are skipped rather than failing everything.
  const atlas =
    options.atlas !== undefined && options.atlas.areas.size > 0 ? options.atlas : undefined;
  if (atlas !== undefined) {
    const coveredBy = new Map<string, string[]>();
    atlas.document.candidates.forEach((candidate, index) => {
      if (candidate.status !== 'covered' || candidate.canonical_concept_id === null) return;
      push(coveredBy, candidate.canonical_concept_id, candidate.candidate_id);
      if (conceptIds.has(candidate.canonical_concept_id)) return;
      diagnostics.push({
        file: ATLAS_FILE_NAME,
        field: `candidates.${String(index)}.canonical_concept_id`,
        message: `candidate ${candidate.candidate_id} is covered by ${candidate.canonical_concept_id}, which does not exist in the corpus`,
      });
    });

    for (const [conceptId, candidates] of coveredBy) {
      if (candidates.length < 2) continue;
      diagnostics.push({
        file: ATLAS_FILE_NAME,
        field: 'candidates',
        message: `concept ${conceptId} is claimed by ${candidates.sort(compareStrings).join(', ')}; exactly one candidate may cover a concept`,
      });
    }

    // A candidate whose label already names a canonical concept is covered in
    // fact, so saying otherwise would make Coverage under-report what exists.
    const conceptByNameForAtlas = new Map<string, string>();
    for (const concept of concepts) {
      const { frontmatter: fm } = concept;
      conceptByNameForAtlas.set(normalizeName(fm.title), fm.concept_id);
      for (const alias of fm.aliases)
        conceptByNameForAtlas.set(normalizeName(alias), fm.concept_id);
    }
    atlas.document.candidates.forEach((candidate, index) => {
      if (candidate.status === 'covered') return;
      const match = conceptByNameForAtlas.get(normalizeName(candidate.title));
      if (match === undefined) return;
      diagnostics.push({
        file: ATLAS_FILE_NAME,
        field: `candidates.${String(index)}.status`,
        message: `candidate ${candidate.candidate_id} has the same name as concept ${match}; mark it covered and name that concept`,
      });
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

export interface CoverageSummary {
  readonly areas: number;
  readonly categories: number;
  readonly emptyCategories: number;
  readonly candidates: number;
  readonly candidatesByStatus: Readonly<Record<AtlasStatus, number>>;
  readonly concepts: number;
  readonly conceptsByTier: Readonly<Record<'1' | '2' | '3', number>>;
  readonly conceptsByFormat: Readonly<Record<ConceptFormat, number>>;
  readonly conceptsByReviewState: Readonly<Record<ReviewState, number>>;
  /** Concepts a covered candidate names, and concepts no candidate names. */
  readonly conceptsInAtlas: number;
  readonly conceptsOutsideAtlas: number;
  readonly unresolvedReferences: number;
  readonly blockingUnresolvedReferences: number;
  /** Distinct normalised labels behind those references. */
  readonly unresolvedGroups: number;
  readonly claims: number;
  readonly claimsByStatus: Readonly<Record<ClaimStatus, number>>;
}

export interface CorpusResult {
  readonly ok: boolean;
  /** Every canonical identity, Markdown and graph-only alike, sorted by id. */
  readonly concepts: readonly LoadedConcept[];
  readonly diagnostics: readonly Diagnostic[];
  /** SHA-256 over every canonical file name and content hash, in sorted order. */
  readonly corpusHash: string;
  /**
   * The curated atlas. Editorial structure, kept deliberately separate from the
   * canonical identities above: a candidate is never a concept.
   */
  readonly atlas: AtlasIndex;
  /** SHA-256 of the atlas file, so an atlas edit is visible without changing corpusHash. */
  readonly atlasHash: string;
  readonly coverage: CoverageSummary;
}

/** Deterministic hash identifying the exact canonical corpus that was read. */
export function computeCorpusHash(concepts: readonly LoadedConcept[]): string {
  const hash = createHash('sha256');
  for (const concept of [...concepts].sort((a, b) => compareStrings(a.fileName, b.fileName))) {
    hash.update(`${concept.fileName}\n${concept.contentHash}\n`);
  }
  return hash.digest('hex');
}

/** Count everything Coverage and the CLI report, deterministically. */
export function summarizeCoverage(
  concepts: readonly LoadedConcept[],
  atlas: AtlasIndex,
): CoverageSummary {
  // A category holding a canonical concept is not an empty part of the map,
  // even when no candidate label was ever filed under it.
  const occupied = new Set<string>();
  for (const concept of concepts) {
    for (const path of concept.frontmatter.categories) {
      const categoryId = resolveAtlasCategoryPath(atlas, path);
      if (categoryId !== undefined) occupied.add(categoryId);
    }
  }
  const counts = atlasCounts(atlas, occupied);

  const conceptsByTier: Record<'1' | '2' | '3', number> = { '1': 0, '2': 0, '3': 0 };
  const conceptsByFormat: Record<ConceptFormat, number> = { markdown: 0, 'graph-only': 0 };
  const conceptsByReviewState = Object.fromEntries(
    reviewStates.map((state) => [state, 0]),
  ) as Record<ReviewState, number>;
  const claimsByStatus = Object.fromEntries(claimStatuses.map((status) => [status, 0])) as Record<
    ClaimStatus,
    number
  >;

  let unresolvedReferences = 0;
  let blocking = 0;
  let claims = 0;
  const groups = new Set<string>();

  for (const concept of concepts) {
    const { frontmatter: fm } = concept;
    conceptsByTier[String(fm.tier) as '1' | '2' | '3'] += 1;
    conceptsByFormat[concept.format] += 1;
    conceptsByReviewState[fm.review_state] += 1;
    for (const reference of fm.unresolved_references) {
      unresolvedReferences += 1;
      if (reference.blocking) blocking += 1;
      groups.add(normalizeName(reference.label));
    }
    for (const claim of fm.claims) {
      claims += 1;
      claimsByStatus[claim.status] += 1;
    }
  }

  const covered = new Set<string>();
  for (const candidate of atlas.document.candidates) {
    if (candidate.status === 'covered' && candidate.canonical_concept_id !== null) {
      covered.add(candidate.canonical_concept_id);
    }
  }
  let conceptsInAtlas = 0;
  for (const concept of concepts) {
    if (covered.has(concept.frontmatter.concept_id)) conceptsInAtlas += 1;
  }

  return {
    areas: counts.areas,
    categories: counts.categories,
    emptyCategories: counts.emptyCategories,
    candidates: counts.candidates,
    candidatesByStatus: counts.byStatus,
    concepts: concepts.length,
    conceptsByTier,
    conceptsByFormat,
    conceptsByReviewState,
    conceptsInAtlas,
    conceptsOutsideAtlas: concepts.length - conceptsInAtlas,
    unresolvedReferences,
    blockingUnresolvedReferences: blocking,
    unresolvedGroups: groups.size,
    claims,
    claimsByStatus,
  };
}

export interface LoadCorpusOptions {
  /** Defaults to `<contentDir>/../graph-only`. */
  readonly graphOnlyDir?: string;
  /** Defaults to `<contentDir>/../atlas.yaml`. A missing file is not an error. */
  readonly atlasFile?: string;
}

async function listFiles(directory: string, extension: string): Promise<string[] | undefined> {
  try {
    const entries = (await readdir(directory)).filter(
      (name) => name.endsWith(extension) && !name.startsWith('_') && !name.startsWith('.'),
    );
    entries.sort(compareStrings);
    return entries;
  } catch {
    return undefined;
  }
}

/**
 * Load and validate the whole canonical corpus: Markdown pages, graph-only
 * identities and the atlas, checked together in one pass.
 *
 * File names beginning with `_` or `.` are ignored, matching the Docusaurus
 * convention for partials, so a draft can sit beside canonical content without
 * entering the corpus. Ordering is by file name within each format and by
 * concept id in the result, so two runs over the same files agree exactly.
 *
 * A missing `content/graph-only/` or `content/atlas.yaml` is not an error: a
 * corpus may legitimately have neither, and fixtures usually do not.
 */
export async function loadCorpus(
  contentDir: string,
  options: LoadCorpusOptions = {},
): Promise<CorpusResult> {
  const contentRoot = dirname(contentDir);
  const graphOnlyDir = options.graphOnlyDir ?? join(contentRoot, GRAPH_ONLY_DIR_NAME);
  const atlasFile = options.atlasFile ?? join(contentRoot, ATLAS_FILE_NAME);

  const concepts: LoadedConcept[] = [];
  const diagnostics: Diagnostic[] = [];

  const markdownFiles = await listFiles(contentDir, '.md');
  if (markdownFiles === undefined) {
    return {
      ok: false,
      concepts: [],
      diagnostics: [
        { file: '(corpus)', field: 'contentDir', message: `could not read ${contentDir}` },
      ],
      corpusHash: computeCorpusHash([]),
      atlas: emptyAtlasIndex(),
      atlasHash: createHash('sha256').digest('hex'),
      coverage: summarizeCoverage([], emptyAtlasIndex()),
    };
  }

  for (const fileName of markdownFiles) {
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

  for (const fileName of (await listFiles(graphOnlyDir, '.yaml')) ?? []) {
    const result = await loadGraphOnlyFile(join(graphOnlyDir, fileName), fileName);
    if (!result.ok || result.identity === undefined) {
      for (const issue of result.issues) {
        diagnostics.push({ file: fileName, field: issue.path, message: issue.message });
      }
      continue;
    }
    concepts.push(result.identity);
    diagnostics.push(...validateConceptPage(result.identity));
  }

  const atlasResult = await loadAtlasFile(atlasFile);
  diagnostics.push(...atlasResult.diagnostics);
  const atlas = atlasResult.atlas ?? emptyAtlasIndex();

  diagnostics.push(...validateCorpus(concepts, { atlas }));
  concepts.sort((a, b) => compareStrings(a.frontmatter.concept_id, b.frontmatter.concept_id));

  const sorted = sortDiagnostics(diagnostics);
  return {
    ok: sorted.length === 0,
    concepts,
    diagnostics: sorted,
    corpusHash: computeCorpusHash(concepts),
    atlasHash: atlasResult.contentHash,
    atlas,
    coverage: summarizeCoverage(concepts, atlas),
  };
}
