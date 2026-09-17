/**
 * The curated broad atlas (v2 runbook §4.1).
 *
 * `content/atlas.yaml` is *editorial* structure, not knowledge. It says which
 * neighbourhoods of mathematics, artificial intelligence and programming exist
 * and which of them this corpus has reached. A candidate entry is a lead for a
 * future page — a label and, at most, an editorial note. It carries no factual
 * summary, it is never canonical, and it can never ground an assistant answer.
 * The schema enforces that by refusing every key that is not in the contract.
 *
 * Validation here is structural and standalone: it needs no canonical corpus.
 * The cross-check that a `covered` candidate names a concept which really
 * exists belongs to whole-corpus validation, where both are in scope.
 */
import { parse as parseYaml } from 'yaml';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { compareStrings, normalizeName } from './normalize.js';
import { sortDiagnostics } from './diagnostics.js';
import type { Diagnostic } from './diagnostics.js';
import { ATLAS_FILE_NAME } from './atlas-paths.js';
import { dottedId, nonEmptyText } from './schema.js';
import type { FieldIssue } from './schema.js';

/** The only `schema_version` this build understands. */
export const ATLAS_SCHEMA_VERSION = 1;

/**
 * The three root areas, fixed by the product brief. Titles — not ids — are the
 * contract, so a renamed id cannot quietly drop an area from Coverage.
 */
export const ATLAS_ROOT_AREA_TITLES = [
  'Artificial Intelligence',
  'Mathematics',
  'Programming',
] as const;

/**
 * Editorial state of a candidate.
 *
 * - `candidate` — a lead nobody has committed to yet.
 * - `proposed-tier-3` — accepted as worth a stable identity, not yet created.
 * - `covered` — a canonical concept now exists and is named here.
 * - `deferred` — deliberately out of scope for now, kept so it stays visible.
 */
export const atlasStatuses = ['candidate', 'proposed-tier-3', 'covered', 'deferred'] as const;
export type AtlasStatus = (typeof atlasStatuses)[number];

/**
 * Which editorial moves are legal.
 *
 * Everything may move forward or be deferred. `covered` is the exception: a
 * covered candidate may only fall back to `candidate`, and only because its
 * canonical concept was removed. Deferring or re-proposing something the corpus
 * already explains would make Coverage lie about what exists.
 */
export const ATLAS_STATUS_TRANSITIONS: Readonly<Record<AtlasStatus, readonly AtlasStatus[]>> = {
  candidate: ['candidate', 'proposed-tier-3', 'covered', 'deferred'],
  'proposed-tier-3': ['proposed-tier-3', 'candidate', 'covered', 'deferred'],
  deferred: ['deferred', 'candidate', 'proposed-tier-3', 'covered'],
  covered: ['covered', 'candidate'],
};

/** Is moving a candidate from `from` to `to` an allowed editorial change? */
export function isAllowedAtlasStatusTransition(from: AtlasStatus, to: AtlasStatus): boolean {
  return ATLAS_STATUS_TRANSITIONS[from].includes(to);
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */

export const atlasCategorySchema = z.strictObject({
  category_id: dottedId('areas[].categories[].category_id'),
  title: nonEmptyText('areas[].categories[].title', 200),
  parent_id: dottedId('areas[].categories[].parent_id'),
});
export type AtlasCategory = z.infer<typeof atlasCategorySchema>;

export const atlasAreaSchema = z.strictObject({
  area_id: dottedId('areas[].area_id'),
  title: nonEmptyText('areas[].title', 200),
  categories: z.array(atlasCategorySchema).default([]),
});
export type AtlasArea = z.infer<typeof atlasAreaSchema>;

export const atlasCandidateSchema = z.strictObject({
  candidate_id: dottedId('candidates[].candidate_id'),
  title: nonEmptyText('candidates[].title', 200),
  aliases: z.array(nonEmptyText('candidates[].aliases[]', 200)).default([]),
  categories: z
    .array(dottedId('candidates[].categories[]'))
    .min(1, 'candidates[].categories must name at least one atlas category'),
  status: z.enum(atlasStatuses),
  // `null` is written explicitly in the contract's example, so both a missing
  // key and an explicit null mean "no canonical concept".
  canonical_concept_id: dottedId('candidates[].canonical_concept_id').nullish().default(null),
  note: nonEmptyText('candidates[].note', 1_000).nullish().default(null),
});
export type AtlasCandidate = z.infer<typeof atlasCandidateSchema>;

export const atlasDocumentSchema = z.strictObject({
  schema_version: z.literal(
    ATLAS_SCHEMA_VERSION,
    `schema_version must be exactly ${String(ATLAS_SCHEMA_VERSION)}`,
  ),
  areas: z.array(atlasAreaSchema).min(1, 'areas must not be empty'),
  candidates: z.array(atlasCandidateSchema).default([]),
});
export type AtlasDocument = z.infer<typeof atlasDocumentSchema>;

/** Validate an unknown value against the atlas contract. */
export function parseAtlasDocument(input: unknown): {
  readonly ok: boolean;
  readonly value: AtlasDocument | undefined;
  readonly issues: readonly FieldIssue[];
} {
  const result = atlasDocumentSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data, issues: [] };

  const issues: FieldIssue[] = [];
  for (const issue of result.error.issues) {
    const prefix = issue.path.map((segment) => String(segment));
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        issues.push({
          path: [...prefix, key].join('.'),
          message:
            key === 'summary' || key === 'description'
              ? `"${key}" is not part of the atlas contract: a candidate carries labels and editorial notes only, never a factual summary`
              : `unknown key "${key}" is not part of the atlas contract`,
        });
      }
      continue;
    }
    issues.push({
      path: prefix.length > 0 ? prefix.join('.') : '(root)',
      message: issue.message,
    });
  }
  issues.sort((a, b) =>
    a.path === b.path ? compareStrings(a.message, b.message) : compareStrings(a.path, b.path),
  );
  return { ok: false, value: undefined, issues };
}

/* -------------------------------------------------------------------------- */
/* Derived index                                                               */
/* -------------------------------------------------------------------------- */

export interface AtlasCategoryNode {
  readonly categoryId: string;
  readonly title: string;
  readonly parentId: string;
  /** Id of the root area this category descends from. */
  readonly areaId: string;
  /** Depth below the area: a category whose parent is the area has depth 1. */
  readonly depth: number;
  /** Full display path, e.g. `Artificial Intelligence/Domains/Computer Vision`. */
  readonly path: string;
  readonly childCategoryIds: readonly string[];
  readonly candidateIds: readonly string[];
}

export interface AtlasAreaNode {
  readonly areaId: string;
  readonly title: string;
  readonly childCategoryIds: readonly string[];
}

export interface AtlasIndex {
  readonly document: AtlasDocument;
  readonly areas: ReadonlyMap<string, AtlasAreaNode>;
  readonly categories: ReadonlyMap<string, AtlasCategoryNode>;
  readonly candidates: ReadonlyMap<string, AtlasCandidate>;
  /**
   * Display path → category id. Every category registers its full path, and
   * also the short `Area/Title` form when that form is unambiguous inside the
   * area. The short form is what canonical concept `categories` strings and
   * `proposed_categories` use, because they name an area and a neighbourhood
   * rather than every intermediate grouping level.
   */
  readonly categoryIdsByPath: ReadonlyMap<string, string>;
}

/** Does following `parent_id` from this category reach an area, and which one? */
function resolveArea(
  category: AtlasCategory,
  categoriesById: ReadonlyMap<string, AtlasCategory>,
  areaIds: ReadonlySet<string>,
): { areaId: string; depth: number } | { areaId: undefined; depth: number } {
  const seen = new Set<string>([category.category_id]);
  let current = category;
  let depth = 1;
  for (;;) {
    if (areaIds.has(current.parent_id)) return { areaId: current.parent_id, depth };
    const parent = categoriesById.get(current.parent_id);
    if (parent === undefined || seen.has(parent.category_id)) {
      return { areaId: undefined, depth };
    }
    seen.add(parent.category_id);
    current = parent;
    depth += 1;
  }
}

/**
 * Build the derived view of a *structurally valid* atlas.
 *
 * Call `validateAtlasStructure` first: this function assumes parents resolve
 * and ignores anything that does not, rather than inventing a placement.
 */
export function buildAtlasIndex(document: AtlasDocument): AtlasIndex {
  const areaIds = new Set(document.areas.map((area) => area.area_id));
  const areaTitles = new Map(document.areas.map((area) => [area.area_id, area.title]));

  const categoriesById = new Map<string, AtlasCategory>();
  for (const area of document.areas) {
    for (const category of area.categories) categoriesById.set(category.category_id, category);
  }

  const candidateIdsByCategory = new Map<string, string[]>();
  for (const candidate of [...document.candidates].sort((a, b) =>
    compareStrings(a.candidate_id, b.candidate_id),
  )) {
    for (const categoryId of candidate.categories) {
      const list = candidateIdsByCategory.get(categoryId);
      if (list === undefined) candidateIdsByCategory.set(categoryId, [candidate.candidate_id]);
      else list.push(candidate.candidate_id);
    }
  }

  const childrenOf = new Map<string, string[]>();
  for (const category of [...categoriesById.values()].sort((a, b) =>
    compareStrings(a.category_id, b.category_id),
  )) {
    const list = childrenOf.get(category.parent_id);
    if (list === undefined) childrenOf.set(category.parent_id, [category.category_id]);
    else list.push(category.category_id);
  }

  // Titles from the category up to the area, so the path can be assembled.
  const pathOf = (category: AtlasCategory): string => {
    const titles: string[] = [category.title];
    let current = category;
    const seen = new Set<string>([current.category_id]);
    for (;;) {
      const areaTitle = areaTitles.get(current.parent_id);
      if (areaTitle !== undefined) return [areaTitle, ...titles].join('/');
      const parent = categoriesById.get(current.parent_id);
      if (parent === undefined || seen.has(parent.category_id)) return titles.join('/');
      seen.add(parent.category_id);
      titles.unshift(parent.title);
      current = parent;
    }
  };

  const categories = new Map<string, AtlasCategoryNode>();
  for (const category of categoriesById.values()) {
    const placement = resolveArea(category, categoriesById, areaIds);
    categories.set(category.category_id, {
      categoryId: category.category_id,
      title: category.title,
      parentId: category.parent_id,
      areaId: placement.areaId ?? '',
      depth: placement.depth,
      path: pathOf(category),
      childCategoryIds: childrenOf.get(category.category_id) ?? [],
      candidateIds: candidateIdsByCategory.get(category.category_id) ?? [],
    });
  }

  const areas = new Map<string, AtlasAreaNode>();
  for (const area of document.areas) {
    areas.set(area.area_id, {
      areaId: area.area_id,
      title: area.title,
      childCategoryIds: childrenOf.get(area.area_id) ?? [],
    });
  }

  // Short-path registration: `Area/Title`, only where the title is unique
  // inside its area. Ambiguous short paths are simply not registered, so a
  // lookup fails loudly instead of resolving to an arbitrary neighbour.
  const shortPathCounts = new Map<string, number>();
  for (const node of categories.values()) {
    const areaTitle = areaTitles.get(node.areaId);
    if (areaTitle === undefined) continue;
    const short = `${areaTitle}/${node.title}`;
    shortPathCounts.set(short, (shortPathCounts.get(short) ?? 0) + 1);
  }

  const categoryIdsByPath = new Map<string, string>();
  for (const node of [...categories.values()].sort((a, b) =>
    compareStrings(a.categoryId, b.categoryId),
  )) {
    categoryIdsByPath.set(node.path, node.categoryId);
    const areaTitle = areaTitles.get(node.areaId);
    if (areaTitle === undefined) continue;
    const short = `${areaTitle}/${node.title}`;
    if (shortPathCounts.get(short) === 1 && !categoryIdsByPath.has(short)) {
      categoryIdsByPath.set(short, node.categoryId);
    }
  }

  return {
    document,
    areas,
    categories,
    candidates: new Map(
      document.candidates.map((candidate) => [candidate.candidate_id, candidate]),
    ),
    categoryIdsByPath,
  };
}

/** Resolve a display path such as `Mathematics/Analysis` to a category id. */
export function resolveAtlasCategoryPath(index: AtlasIndex, path: string): string | undefined {
  return index.categoryIdsByPath.get(path);
}

/* -------------------------------------------------------------------------- */
/* Structural validation                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every rule in §4.1 that the Zod schema cannot express, reported all at once.
 * `file` is the atlas file name so diagnostics sort beside content diagnostics.
 */
export function validateAtlasStructure(
  document: AtlasDocument,
  file = ATLAS_FILE_NAME,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const add = (field: string, message: string): void => {
    diagnostics.push({ file, field, message });
  };

  /* ------------------------------- areas -------------------------------- */

  const expectedTitles = [...ATLAS_ROOT_AREA_TITLES].sort(compareStrings);
  const actualTitles = document.areas.map((area) => area.title).sort(compareStrings);
  if (actualTitles.join('|') !== expectedTitles.join('|')) {
    add(
      'areas',
      `the atlas must contain exactly the three root areas ${expectedTitles.join(', ')}; found ${
        actualTitles.length === 0 ? 'none' : actualTitles.join(', ')
      }`,
    );
  }

  const areaIds = new Set<string>();
  document.areas.forEach((area, index) => {
    if (areaIds.has(area.area_id)) {
      add(`areas.${String(index)}.area_id`, `duplicate area_id ${area.area_id}`);
    }
    areaIds.add(area.area_id);
  });

  /* ----------------------------- categories ------------------------------ */

  const categoriesById = new Map<string, AtlasCategory>();
  const categoryOwner = new Map<string, string>();
  document.areas.forEach((area, areaIndex) => {
    area.categories.forEach((category, categoryIndex) => {
      const field = `areas.${String(areaIndex)}.categories.${String(categoryIndex)}.category_id`;
      if (areaIds.has(category.category_id)) {
        add(field, `category_id ${category.category_id} collides with an area_id`);
      }
      if (categoriesById.has(category.category_id)) {
        add(
          field,
          `duplicate category_id ${category.category_id}, also declared in area ${
            categoryOwner.get(category.category_id) ?? 'unknown'
          }`,
        );
        return;
      }
      categoriesById.set(category.category_id, category);
      categoryOwner.set(category.category_id, area.area_id);
    });
  });

  document.areas.forEach((area, areaIndex) => {
    area.categories.forEach((category, categoryIndex) => {
      const field = `areas.${String(areaIndex)}.categories.${String(categoryIndex)}.parent_id`;
      if (category.parent_id === category.category_id) {
        add(field, `category ${category.category_id} is its own parent`);
        return;
      }
      if (!areaIds.has(category.parent_id) && !categoriesById.has(category.parent_id)) {
        add(
          field,
          `parent_id ${category.parent_id} of category ${category.category_id} is neither an area nor a category`,
        );
        return;
      }
      const placement = resolveArea(category, categoriesById, areaIds);
      if (placement.areaId === undefined) {
        add(
          field,
          `category ${category.category_id} does not reach a root area: its parent chain is cyclic or broken`,
        );
        return;
      }
      if (placement.areaId !== area.area_id) {
        add(
          field,
          `category ${category.category_id} is declared under area ${area.area_id} but its parent chain reaches ${placement.areaId}; a category belongs to exactly one root`,
        );
      }
    });
  });

  // Two categories with the same title inside one area would make the short
  // `Area/Title` path — the form canonical content and backlog items use —
  // ambiguous, so it is refused rather than silently resolved.
  const titlesPerArea = new Map<string, Map<string, string[]>>();
  for (const [categoryId, category] of categoriesById) {
    const areaId = categoryOwner.get(categoryId);
    if (areaId === undefined) continue;
    const byTitle = titlesPerArea.get(areaId) ?? new Map<string, string[]>();
    const key = normalizeName(category.title);
    byTitle.set(key, [...(byTitle.get(key) ?? []), categoryId]);
    titlesPerArea.set(areaId, byTitle);
  }
  for (const [areaId, byTitle] of [...titlesPerArea].sort((a, b) => compareStrings(a[0], b[0]))) {
    for (const [normalized, ids] of [...byTitle].sort((a, b) => compareStrings(a[0], b[0]))) {
      if (ids.length < 2) continue;
      add(
        `areas.${areaId}.categories`,
        `categories ${ids.sort(compareStrings).join(', ')} all normalise to the title "${normalized}" inside one area; a category title must be unique within its area`,
      );
    }
  }

  /* ----------------------------- candidates ------------------------------ */

  const candidateIds = new Set<string>();
  const namesSeen = new Map<string, { field: string; value: string }>();

  document.candidates.forEach((candidate, index) => {
    const at = (suffix: string): string => `candidates.${String(index)}.${suffix}`;

    if (candidateIds.has(candidate.candidate_id)) {
      add(
        at('candidate_id'),
        `duplicate candidate_id ${candidate.candidate_id}; a candidate appears exactly once in the candidate list`,
      );
    }
    candidateIds.add(candidate.candidate_id);
    if (areaIds.has(candidate.candidate_id) || categoriesById.has(candidate.candidate_id)) {
      add(
        at('candidate_id'),
        `candidate_id ${candidate.candidate_id} collides with an area or category id`,
      );
    }

    const seenHere = new Set<string>();
    candidate.categories.forEach((categoryId, categoryIndex) => {
      const field = at(`categories.${String(categoryIndex)}`);
      if (seenHere.has(categoryId)) {
        add(field, `candidate ${candidate.candidate_id} repeats category ${categoryId}`);
      }
      seenHere.add(categoryId);
      if (categoriesById.has(categoryId)) return;
      add(
        field,
        areaIds.has(categoryId)
          ? `category ${categoryId} is a root area; a candidate must sit in a named category, not directly under an area`
          : `category ${categoryId} does not exist in the atlas`,
      );
    });

    // Titles and aliases share one namespace across every candidate, using the
    // same normalisation canonical concepts use, so `conv-layer` and
    // `Conv Layer` cannot become two separate leads.
    const names: { field: string; value: string }[] = [
      { field: at('title'), value: candidate.title },
      ...candidate.aliases.map((alias, aliasIndex) => ({
        field: at(`aliases.${String(aliasIndex)}`),
        value: alias,
      })),
    ];
    const localNames = new Set<string>();
    for (const name of names) {
      const normalized = normalizeName(name.value);
      if (localNames.has(normalized)) {
        add(name.field, `"${name.value}" repeats another name on this same candidate`);
        continue;
      }
      localNames.add(normalized);
      const existing = namesSeen.get(normalized);
      if (existing !== undefined) {
        add(
          name.field,
          `"${name.value}" normalises to "${normalized}", which is already used by ${existing.field} ("${existing.value}"); a label must identify exactly one candidate`,
        );
        continue;
      }
      namesSeen.set(normalized, name);
    }

    if (candidate.status === 'covered') {
      if (candidate.canonical_concept_id === null || candidate.canonical_concept_id === undefined) {
        add(
          at('canonical_concept_id'),
          `candidate ${candidate.candidate_id} is covered, so it must name exactly one canonical concept id`,
        );
      }
    } else if (
      candidate.canonical_concept_id !== null &&
      candidate.canonical_concept_id !== undefined
    ) {
      add(
        at('canonical_concept_id'),
        `candidate ${candidate.candidate_id} names canonical concept ${candidate.canonical_concept_id} but its status is "${candidate.status}"; only a covered candidate resolves to a concept`,
      );
    }
  });

  return sortDiagnostics(diagnostics);
}

/**
 * Compare two atlases and report candidate status changes that are not allowed.
 * Used when reviewing an edit rather than a single file in isolation.
 */
export function validateAtlasStatusTransitions(
  previous: AtlasDocument,
  next: AtlasDocument,
  file = ATLAS_FILE_NAME,
): Diagnostic[] {
  const before = new Map(previous.candidates.map((c) => [c.candidate_id, c.status]));
  const diagnostics: Diagnostic[] = [];
  next.candidates.forEach((candidate, index) => {
    const from = before.get(candidate.candidate_id);
    if (from === undefined) return;
    if (isAllowedAtlasStatusTransition(from, candidate.status)) return;
    diagnostics.push({
      file,
      field: `candidates.${String(index)}.status`,
      message: `candidate ${candidate.candidate_id} may not move from "${from}" to "${candidate.status}"; allowed: ${ATLAS_STATUS_TRANSITIONS[from].join(', ')}`,
    });
  });
  return sortDiagnostics(diagnostics);
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

export interface AtlasLoadResult {
  readonly ok: boolean;
  readonly atlas: AtlasIndex | undefined;
  readonly diagnostics: readonly Diagnostic[];
  /**
   * SHA-256 of the atlas file, newline-normalised. Empty-string hash when there
   * is no atlas. Kept separate from the corpus hash because the atlas is
   * editorial structure, not canonical knowledge: editing it must be visible,
   * but must not look like a change to what the corpus says.
   */
  readonly contentHash: string;
}

/** SHA-256 of nothing, used as the hash when there is no atlas file. */
const EMPTY_HASH = createHash('sha256').digest('hex');

/** An empty but structurally valid atlas, used when no atlas file exists yet. */
export function emptyAtlasIndex(): AtlasIndex {
  return buildAtlasIndex({ schema_version: ATLAS_SCHEMA_VERSION, areas: [], candidates: [] });
}

/** Parse and validate atlas YAML held in memory. */
export function loadAtlasFromText(text: string, file = ATLAS_FILE_NAME): AtlasLoadResult {
  const contentHash = createHash('sha256')
    .update(text.replace(/\r\n/g, '\n'), 'utf8')
    .digest('hex');
  let raw: unknown;
  try {
    raw = parseYaml(text, {
      version: '1.2',
      schema: 'core',
      maxAliasCount: 0,
      uniqueKeys: true,
      prettyErrors: true,
    });
  } catch (error) {
    return {
      ok: false,
      atlas: undefined,
      contentHash,
      diagnostics: [
        {
          file,
          field: '(yaml)',
          message: `YAML could not be parsed: ${
            error instanceof Error ? (error.message.split('\n')[0] ?? error.message) : String(error)
          }`,
        },
      ],
    };
  }

  if (raw === null || raw === undefined) {
    return {
      ok: false,
      atlas: undefined,
      contentHash,
      diagnostics: [{ file, field: '(yaml)', message: 'the atlas file is empty' }],
    };
  }

  const parsed = parseAtlasDocument(raw);
  if (!parsed.ok || parsed.value === undefined) {
    return {
      ok: false,
      atlas: undefined,
      contentHash,
      diagnostics: sortDiagnostics(
        parsed.issues.map((issue) => ({ file, field: issue.path, message: issue.message })),
      ),
    };
  }

  const structural = validateAtlasStructure(parsed.value, file);
  return {
    ok: structural.length === 0,
    contentHash,
    // A structurally broken atlas still produces an index so callers can report
    // what they did understand; they must check `ok` before trusting it.
    atlas: buildAtlasIndex(parsed.value),
    diagnostics: structural,
  };
}

/** Read and validate `content/atlas.yaml`. A missing file is not an error. */
export async function loadAtlasFile(
  absolutePath: string,
  file = ATLAS_FILE_NAME,
): Promise<AtlasLoadResult> {
  let text: string;
  try {
    text = await readFile(absolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ok: true, atlas: emptyAtlasIndex(), diagnostics: [], contentHash: EMPTY_HASH };
    }
    return {
      ok: false,
      atlas: undefined,
      contentHash: EMPTY_HASH,
      diagnostics: [
        {
          file,
          field: '(file)',
          message: `could not be read: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  return loadAtlasFromText(text.replace(/\r\n/g, '\n'), file);
}

/* -------------------------------------------------------------------------- */
/* Summaries                                                                   */
/* -------------------------------------------------------------------------- */

export interface AtlasCounts {
  readonly areas: number;
  readonly categories: number;
  readonly emptyCategories: number;
  readonly candidates: number;
  readonly byStatus: Readonly<Record<AtlasStatus, number>>;
}

/**
 * Deterministic counts for Coverage and for the CLI.
 *
 * `occupiedCategoryIds` names categories that hold a canonical concept. A
 * category with a page in it is not empty, whether or not a candidate label was
 * ever filed there — before any content existed the two were the same thing,
 * and they stopped being the same the moment pages were written outside the
 * candidate list. Callers that have no corpus to hand may omit it.
 */
export function atlasCounts(
  index: AtlasIndex,
  occupiedCategoryIds: ReadonlySet<string> = new Set(),
): AtlasCounts {
  const byStatus: Record<AtlasStatus, number> = {
    candidate: 0,
    'proposed-tier-3': 0,
    covered: 0,
    deferred: 0,
  };
  for (const candidate of index.document.candidates) byStatus[candidate.status] += 1;

  let emptyCategories = 0;
  for (const node of index.categories.values()) {
    if (
      node.candidateIds.length === 0 &&
      node.childCategoryIds.length === 0 &&
      !occupiedCategoryIds.has(node.categoryId)
    ) {
      emptyCategories += 1;
    }
  }

  return {
    areas: index.areas.size,
    categories: index.categories.size,
    emptyCategories,
    candidates: index.document.candidates.length,
    byStatus,
  };
}
