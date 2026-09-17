/**
 * Read-only coverage queries over the compiled index (v2 runbook L01–L04).
 *
 * Three different things are reported here and they are deliberately never
 * mixed:
 *
 *   * **canonical identities** — concepts that exist, in one of three depths;
 *   * **atlas candidates** — editorial leads, noncanonical, never evidence;
 *   * **unresolved references** — links a page needed and could not make.
 *
 * A candidate and an unresolved reference both describe something missing, but
 * they come from different places and mean different things: a candidate is a
 * neighbourhood somebody curated, an unresolved reference is a gap a page hit
 * while being written. Coverage keeps them apart so neither hides the other.
 *
 * Every query orders explicitly, so two runs return the same rows in the same
 * order. Nothing here writes.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { compareStrings } from './normalize.js';

/* -------------------------------------------------------------------------- */
/* Summary                                                                     */
/* -------------------------------------------------------------------------- */

export interface CompiledCoverageSummary {
  readonly corpusHash: string;
  readonly atlasHash: string;
  readonly builtAt: string;
  readonly concepts: {
    readonly total: number;
    readonly withArticle: number;
    readonly byTier: Readonly<Record<string, number>>;
    readonly byFormat: Readonly<Record<string, number>>;
    readonly byReviewState: Readonly<Record<string, number>>;
  };
  readonly atlas: {
    readonly areas: number;
    readonly categories: number;
    readonly emptyCategories: number;
    readonly candidates: number;
    readonly byStatus: Readonly<Record<string, number>>;
  };
  readonly backlog: {
    readonly references: number;
    readonly groups: number;
    readonly blocking: number;
  };
  readonly evidence: {
    readonly claims: number;
    readonly byStatus: Readonly<Record<string, number>>;
    readonly locators: number;
    readonly conceptsWithClaims: number;
  };
}

function tally(
  db: DatabaseType,
  sql: string,
  keys: readonly string[] = [],
): Record<string, number> {
  const rows = db.prepare(sql).all() as { key: string | number; n: number }[];
  const out: Record<string, number> = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const row of rows) out[String(row.key)] = row.n;
  return out;
}

function meta(db: DatabaseType, key: string): string {
  const row = db.prepare('SELECT value FROM build_meta WHERE key = ?').get(key) as
    { value: string } | undefined;
  return row?.value ?? '';
}

function scalar(db: DatabaseType, sql: string): number {
  const row = db.prepare(sql).get() as { n: number } | undefined;
  return row?.n ?? 0;
}

/** Everything the Coverage page and `navigator coverage summary` report. */
export function getCoverageSummary(db: DatabaseType): CompiledCoverageSummary {
  return {
    corpusHash: meta(db, 'corpus_hash'),
    atlasHash: meta(db, 'atlas_hash'),
    builtAt: meta(db, 'built_at'),
    concepts: {
      total: scalar(db, 'SELECT COUNT(*) AS n FROM concepts'),
      withArticle: scalar(db, 'SELECT COUNT(*) AS n FROM concepts WHERE has_article = 1'),
      byTier: tally(
        db,
        'SELECT tier AS key, COUNT(*) AS n FROM concepts GROUP BY tier ORDER BY tier',
        ['1', '2', '3'],
      ),
      byFormat: tally(
        db,
        'SELECT content_format AS key, COUNT(*) AS n FROM concepts GROUP BY content_format ORDER BY content_format',
        ['markdown', 'graph-only'],
      ),
      byReviewState: tally(
        db,
        'SELECT review_state AS key, COUNT(*) AS n FROM concepts GROUP BY review_state ORDER BY review_state',
      ),
    },
    atlas: {
      areas: scalar(db, 'SELECT COUNT(*) AS n FROM atlas_areas'),
      categories: scalar(db, 'SELECT COUNT(*) AS n FROM atlas_categories'),
      emptyCategories: scalar(
        db,
        `SELECT COUNT(*) AS n FROM atlas_categories c
          WHERE NOT EXISTS (SELECT 1 FROM atlas_candidate_categories cc WHERE cc.category_id = c.id)
            AND NOT EXISTS (SELECT 1 FROM atlas_categories k WHERE k.parent_category_id = c.id)`,
      ),
      candidates: scalar(db, 'SELECT COUNT(*) AS n FROM atlas_candidates'),
      byStatus: tally(
        db,
        'SELECT status AS key, COUNT(*) AS n FROM atlas_candidates GROUP BY status ORDER BY status',
        ['candidate', 'proposed-tier-3', 'covered', 'deferred'],
      ),
    },
    backlog: {
      references: scalar(db, 'SELECT COUNT(*) AS n FROM unresolved_references'),
      groups: scalar(db, 'SELECT COUNT(DISTINCT group_id) AS n FROM unresolved_references'),
      blocking: scalar(db, 'SELECT COUNT(*) AS n FROM unresolved_references WHERE blocking = 1'),
    },
    evidence: {
      claims: scalar(db, 'SELECT COUNT(*) AS n FROM claims'),
      byStatus: tally(
        db,
        'SELECT status AS key, COUNT(*) AS n FROM claims GROUP BY status ORDER BY status',
        ['supported', 'conditional', 'disputed', 'unsupported'],
      ),
      locators: scalar(db, 'SELECT COUNT(*) AS n FROM claim_evidence'),
      conceptsWithClaims: scalar(db, 'SELECT COUNT(DISTINCT concept_id) AS n FROM claims'),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* The atlas outline                                                           */
/* -------------------------------------------------------------------------- */

export interface AtlasCategoryNodeRow {
  readonly categoryId: string;
  readonly title: string;
  readonly path: string;
  readonly areaId: string;
  readonly parentCategoryId: string | null;
  readonly depth: number;
  readonly candidates: number;
  readonly covered: number;
  readonly children: readonly AtlasCategoryNodeRow[];
}

export interface AtlasAreaNodeRow {
  readonly areaId: string;
  readonly title: string;
  readonly categories: number;
  readonly candidates: number;
  readonly covered: number;
  readonly children: readonly AtlasCategoryNodeRow[];
}

interface FlatCategory {
  categoryId: string;
  title: string;
  path: string;
  areaId: string;
  parentCategoryId: string | null;
  depth: number;
  candidates: number;
  covered: number;
}

/**
 * The whole atlas as a tree, including categories with nothing in them.
 *
 * An empty category is the point: it is how the product says "this
 * neighbourhood exists and we have not been there", instead of pretending the
 * map ends where the pages do.
 */
export function getAtlasOutline(db: DatabaseType): AtlasAreaNodeRow[] {
  const flat = db
    .prepare(
      `SELECT c.id              AS categoryId,
              c.title           AS title,
              c.path            AS path,
              c.area_id         AS areaId,
              c.parent_category_id AS parentCategoryId,
              c.depth           AS depth,
              (SELECT COUNT(*) FROM atlas_candidate_categories cc
                WHERE cc.category_id = c.id) AS candidates,
              (SELECT COUNT(*) FROM atlas_candidate_categories cc
                 JOIN atlas_candidates a ON a.id = cc.candidate_id
                WHERE cc.category_id = c.id AND a.status = 'covered') AS covered
         FROM atlas_categories c
        ORDER BY c.depth, c.title, c.id`,
    )
    .all() as FlatCategory[];

  const childrenOf = new Map<string, FlatCategory[]>();
  for (const row of flat) {
    const key = row.parentCategoryId ?? `area:${row.areaId}`;
    const list = childrenOf.get(key);
    if (list === undefined) childrenOf.set(key, [row]);
    else list.push(row);
  }

  const build = (row: FlatCategory): AtlasCategoryNodeRow => ({
    categoryId: row.categoryId,
    title: row.title,
    path: row.path,
    areaId: row.areaId,
    parentCategoryId: row.parentCategoryId,
    depth: row.depth,
    candidates: row.candidates,
    covered: row.covered,
    children: (childrenOf.get(row.categoryId) ?? []).map(build),
  });

  const areas = db
    .prepare('SELECT id AS areaId, title FROM atlas_areas ORDER BY position, id')
    .all() as { areaId: string; title: string }[];

  // Bound parameters throughout: nothing from the database is ever spliced into
  // SQL text, even when it came from a validated identifier.
  const candidatesInArea = db.prepare(
    `SELECT COUNT(DISTINCT cc.candidate_id) AS n
       FROM atlas_candidate_categories cc
       JOIN atlas_categories c ON c.id = cc.category_id
      WHERE c.area_id = ?`,
  );
  const coveredInArea = db.prepare(
    `SELECT COUNT(DISTINCT cc.candidate_id) AS n
       FROM atlas_candidate_categories cc
       JOIN atlas_categories c ON c.id = cc.category_id
       JOIN atlas_candidates a ON a.id = cc.candidate_id
      WHERE c.area_id = ? AND a.status = 'covered'`,
  );

  return areas.map((area) => ({
    areaId: area.areaId,
    title: area.title,
    categories: flat.filter((row) => row.areaId === area.areaId).length,
    candidates: (candidatesInArea.get(area.areaId) as { n: number }).n,
    covered: (coveredInArea.get(area.areaId) as { n: number }).n,
    children: (childrenOf.get(`area:${area.areaId}`) ?? []).map(build),
  }));
}

/* -------------------------------------------------------------------------- */
/* Candidates                                                                  */
/* -------------------------------------------------------------------------- */

export interface CandidateCategoryRef {
  readonly categoryId: string;
  readonly title: string;
  readonly path: string;
  readonly areaId: string;
}

export interface CandidateRow {
  readonly candidateId: string;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly status: string;
  readonly note: string | null;
  readonly categories: readonly CandidateCategoryRef[];
  /** Set only when the status is `covered`. */
  readonly canonicalConceptId: string | null;
  readonly canonicalTitle: string | null;
  readonly canonicalSlug: string | null;
  readonly canonicalHasArticle: boolean | null;
}

export interface CandidateQuery {
  readonly areaId?: string | undefined;
  readonly categoryId?: string | undefined;
  readonly status?: string | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

export const MAX_COVERAGE_PAGE = 500;

export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly truncated: boolean;
}

/** Candidates, filtered and paginated, in a stable order. */
export function listCandidates(db: DatabaseType, query: CandidateQuery = {}): Page<CandidateRow> {
  const limit = Math.min(Math.max(query.limit ?? MAX_COVERAGE_PAGE, 1), MAX_COVERAGE_PAGE);
  const offset = Math.max(query.offset ?? 0, 0);

  const where: string[] = [];
  const params: Record<string, string> = {};
  if (query.status !== undefined) {
    where.push('a.status = @status');
    params['status'] = query.status;
  }
  if (query.categoryId !== undefined) {
    where.push(
      'EXISTS (SELECT 1 FROM atlas_candidate_categories cc WHERE cc.candidate_id = a.id AND cc.category_id = @categoryId)',
    );
    params['categoryId'] = query.categoryId;
  }
  if (query.areaId !== undefined) {
    where.push(
      `EXISTS (SELECT 1 FROM atlas_candidate_categories cc
                 JOIN atlas_categories c ON c.id = cc.category_id
                WHERE cc.candidate_id = a.id AND c.area_id = @areaId)`,
    );
    params['areaId'] = query.areaId;
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM atlas_candidates a ${clause}`).get(params) as {
      n: number;
    }
  ).n;

  const rows = db
    .prepare(
      `SELECT a.id                   AS candidateId,
              a.title                AS title,
              a.status               AS status,
              a.note                 AS note,
              a.canonical_concept_id AS canonicalConceptId,
              c.title                AS canonicalTitle,
              c.slug                 AS canonicalSlug,
              c.has_article          AS canonicalHasArticle
         FROM atlas_candidates a
         LEFT JOIN concepts c ON c.id = a.canonical_concept_id
         ${clause}
        ORDER BY a.title, a.id
        LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit, offset }) as {
    candidateId: string;
    title: string;
    status: string;
    note: string | null;
    canonicalConceptId: string | null;
    canonicalTitle: string | null;
    canonicalSlug: string | null;
    canonicalHasArticle: number | null;
  }[];

  const aliasesFor = db.prepare(
    'SELECT alias FROM atlas_candidate_aliases WHERE candidate_id = ? ORDER BY position, alias',
  );
  const categoriesFor = db.prepare(
    `SELECT c.id AS categoryId, c.title AS title, c.path AS path, c.area_id AS areaId
       FROM atlas_candidate_categories cc
       JOIN atlas_categories c ON c.id = cc.category_id
      WHERE cc.candidate_id = ?
      ORDER BY cc.position, c.path`,
  );

  return {
    items: rows.map((row) => ({
      candidateId: row.candidateId,
      title: row.title,
      aliases: (aliasesFor.all(row.candidateId) as { alias: string }[]).map((a) => a.alias),
      status: row.status,
      note: row.note,
      categories: categoriesFor.all(row.candidateId) as CandidateCategoryRef[],
      canonicalConceptId: row.canonicalConceptId,
      canonicalTitle: row.canonicalTitle,
      canonicalSlug: row.canonicalSlug,
      canonicalHasArticle: row.canonicalHasArticle === null ? null : row.canonicalHasArticle === 1,
    })),
    total,
    limit,
    offset,
    truncated: offset + rows.length < total,
  };
}

/* -------------------------------------------------------------------------- */
/* The unresolved-reference backlog                                            */
/* -------------------------------------------------------------------------- */

export interface BacklogSource {
  readonly referenceId: string;
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly conceptSlug: string;
  readonly conceptHasArticle: boolean;
  readonly reason: string;
  readonly blocking: boolean;
  readonly sections: readonly string[];
  readonly proposedKind: string | null;
  readonly proposedCategories: readonly string[];
}

export interface BacklogGroup {
  readonly groupId: string;
  /** The label as the first source page wrote it, alphabetically. */
  readonly label: string;
  readonly normalizedLabel: string;
  /** True when any source page calls it blocking. */
  readonly blocking: boolean;
  readonly sourceCount: number;
  readonly proposedKinds: readonly string[];
  readonly proposedCategories: readonly string[];
  readonly sources: readonly BacklogSource[];
}

export interface BacklogQuery {
  readonly blockingOnly?: boolean | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

/**
 * Unresolved references, grouped by normalised label.
 *
 * Two pages waiting on the same idea are one piece of work, so they become one
 * group — but both source records survive, because whoever writes the page
 * needs to know which pages were waiting and why.
 *
 * Order is blocking first, then by how many pages are waiting, then by label.
 */
export function listBacklog(db: DatabaseType, query: BacklogQuery = {}): Page<BacklogGroup> {
  const limit = Math.min(Math.max(query.limit ?? MAX_COVERAGE_PAGE, 1), MAX_COVERAGE_PAGE);
  const offset = Math.max(query.offset ?? 0, 0);

  const rows = db
    .prepare(
      `SELECT u.id               AS referenceId,
              u.group_id         AS groupId,
              u.label            AS label,
              u.normalized_label AS normalizedLabel,
              u.reason           AS reason,
              u.blocking         AS blocking,
              u.proposed_kind    AS proposedKind,
              u.concept_id       AS conceptId,
              c.title            AS conceptTitle,
              c.slug             AS conceptSlug,
              c.has_article      AS conceptHasArticle
         FROM unresolved_references u
         JOIN concepts c ON c.id = u.concept_id
        ORDER BY u.group_id, c.title, u.id`,
    )
    .all() as {
    referenceId: string;
    groupId: string;
    label: string;
    normalizedLabel: string;
    reason: string;
    blocking: number;
    proposedKind: string | null;
    conceptId: string;
    conceptTitle: string;
    conceptSlug: string;
    conceptHasArticle: number;
  }[];

  const sectionsFor = db.prepare(
    'SELECT section FROM unresolved_reference_sections WHERE reference_id = ? ORDER BY position, section',
  );
  const categoriesFor = db.prepare(
    'SELECT category_path AS path FROM unresolved_reference_categories WHERE reference_id = ? ORDER BY position, category_path',
  );

  const groups = new Map<string, BacklogSource[]>();
  const labels = new Map<string, { label: string; normalizedLabel: string }>();
  for (const row of rows) {
    const source: BacklogSource = {
      referenceId: row.referenceId,
      conceptId: row.conceptId,
      conceptTitle: row.conceptTitle,
      conceptSlug: row.conceptSlug,
      conceptHasArticle: row.conceptHasArticle === 1,
      reason: row.reason,
      blocking: row.blocking === 1,
      sections: (sectionsFor.all(row.referenceId) as { section: string }[]).map((s) => s.section),
      proposedKind: row.proposedKind,
      proposedCategories: (categoriesFor.all(row.referenceId) as { path: string }[]).map(
        (c) => c.path,
      ),
    };
    const list = groups.get(row.groupId);
    if (list === undefined) groups.set(row.groupId, [source]);
    else list.push(source);
    if (!labels.has(row.groupId)) {
      labels.set(row.groupId, { label: row.label, normalizedLabel: row.normalizedLabel });
    }
  }

  let all: BacklogGroup[] = [...groups.entries()].map(([groupId, sources]) => {
    const names = labels.get(groupId);
    return {
      groupId,
      label: names?.label ?? groupId,
      normalizedLabel: names?.normalizedLabel ?? groupId,
      blocking: sources.some((source) => source.blocking),
      sourceCount: sources.length,
      proposedKinds: [
        ...new Set(sources.map((s) => s.proposedKind).filter((k): k is string => k !== null)),
      ].sort(compareStrings),
      proposedCategories: [...new Set(sources.flatMap((s) => s.proposedCategories))].sort(
        compareStrings,
      ),
      sources,
    };
  });

  if (query.blockingOnly === true) all = all.filter((group) => group.blocking);

  all.sort(
    (a, b) =>
      Number(b.blocking) - Number(a.blocking) ||
      b.sourceCount - a.sourceCount ||
      compareStrings(a.normalizedLabel, b.normalizedLabel),
  );

  return {
    items: all.slice(offset, offset + limit),
    total: all.length,
    limit,
    offset,
    truncated: offset + limit < all.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Evidence for one concept                                                    */
/* -------------------------------------------------------------------------- */

export interface ClaimEvidenceRow {
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly sourceUrl: string;
  readonly sourceKind: string;
  readonly locator: string;
  readonly note: string | null;
}

export interface ClaimRow {
  readonly claimId: string;
  readonly section: string;
  readonly statement: string;
  readonly status: string;
  readonly evidence: readonly ClaimEvidenceRow[];
}

export interface ConceptEvidence {
  readonly conceptId: string;
  readonly title: string;
  readonly slug: string;
  readonly tier: number;
  readonly reviewState: string;
  readonly hasArticle: boolean;
  /**
   * False when the page carries no claim metadata at all. The interface says so
   * rather than implying that "no claims" means "nothing is supported".
   */
  readonly hasClaimMapping: boolean;
  readonly claims: readonly ClaimRow[];
  /** Sections that have at least one claim, in template order. */
  readonly sectionsWithClaims: readonly string[];
  readonly sources: readonly {
    readonly sourceId: string;
    readonly title: string;
    readonly url: string;
    readonly sourceKind: string;
    readonly supports: readonly string[];
    readonly checkedOn: string;
    readonly claimCount: number;
  }[];
}

/** Claim-level evidence for one concept, by id. Returns undefined if unknown. */
export function getConceptEvidence(
  db: DatabaseType,
  conceptId: string,
): ConceptEvidence | undefined {
  const concept = db
    .prepare(
      `SELECT id AS conceptId, title, slug, tier, review_state AS reviewState,
              has_article AS hasArticle
         FROM concepts WHERE id = ?`,
    )
    .get(conceptId) as
    | {
        conceptId: string;
        title: string;
        slug: string;
        tier: number;
        reviewState: string;
        hasArticle: number;
      }
    | undefined;
  if (concept === undefined) return undefined;

  const claimRows = db
    .prepare(
      `SELECT id AS claimId, section, statement, status
         FROM claims WHERE concept_id = ? ORDER BY position, id`,
    )
    .all(conceptId) as { claimId: string; section: string; statement: string; status: string }[];

  const evidenceFor = db.prepare(
    `SELECT e.source_id AS sourceId, s.title AS sourceTitle, s.url AS sourceUrl,
            s.source_kind AS sourceKind, e.locator AS locator, e.note AS note
       FROM claim_evidence e
       JOIN sources s ON s.id = e.source_id
      WHERE e.claim_id = ?
      ORDER BY e.position, e.source_id, e.locator`,
  );

  const claims: ClaimRow[] = claimRows.map((row) => ({
    ...row,
    evidence: evidenceFor.all(row.claimId) as ClaimEvidenceRow[],
  }));

  const sources = db
    .prepare(
      `SELECT cs.source_id  AS sourceId,
              s.title       AS title,
              s.url         AS url,
              s.source_kind AS sourceKind,
              cs.supports   AS supports,
              cs.checked_on AS checkedOn,
              (SELECT COUNT(DISTINCT e.claim_id)
                 FROM claim_evidence e
                 JOIN claims cl ON cl.id = e.claim_id
                WHERE e.source_id = cs.source_id AND cl.concept_id = cs.concept_id) AS claimCount
         FROM concept_sources cs
         JOIN sources s ON s.id = cs.source_id
        WHERE cs.concept_id = ?
        ORDER BY cs.position, cs.source_id`,
    )
    .all(conceptId) as {
    sourceId: string;
    title: string;
    url: string;
    sourceKind: string;
    supports: string;
    checkedOn: string;
    claimCount: number;
  }[];

  return {
    conceptId: concept.conceptId,
    title: concept.title,
    slug: concept.slug,
    tier: concept.tier,
    reviewState: concept.reviewState,
    hasArticle: concept.hasArticle === 1,
    hasClaimMapping: claims.length > 0,
    claims,
    sectionsWithClaims: [...new Set(claims.map((claim) => claim.section))],
    sources: sources.map((source) => ({
      sourceId: source.sourceId,
      title: source.title,
      url: source.url,
      sourceKind: source.sourceKind,
      supports: JSON.parse(source.supports) as string[],
      checkedOn: source.checkedOn,
      claimCount: source.claimCount,
    })),
  };
}
