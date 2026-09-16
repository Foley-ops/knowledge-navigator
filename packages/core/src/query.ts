/**
 * Read-only query surface over the compiled index (runbook D04, E00–E04).
 *
 * Every function here takes an open database and only reads. Nothing in this
 * module writes, and the API opens the database read-only so that a request can
 * never change canonical knowledge.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { normalizeName } from './normalize.js';

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

export const MAX_QUERY_LENGTH = 200;
export const MAX_SEARCH_LIMIT = 50;

/** Why a result matched, best first. The order of this list is the ranking. */
export const matchKinds = [
  'exact-title',
  'exact-alias',
  'title-prefix',
  'alias-prefix',
  'full-text',
] as const;
export type MatchKind = (typeof matchKinds)[number];

const MATCH_RANK: Record<MatchKind, number> = {
  'exact-title': 0,
  'exact-alias': 1,
  'title-prefix': 2,
  'alias-prefix': 3,
  'full-text': 4,
};

export interface SearchHit {
  readonly conceptId: string;
  readonly title: string;
  readonly slug: string;
  readonly summary: string;
  readonly kind: string;
  readonly tier: number;
  readonly reviewState: string;
  /** The alias that matched, when the match was not on the title. */
  readonly matchedAlias: string | null;
  readonly matchKind: MatchKind;
  /** Plain-language reason a person can read. */
  readonly rankExplanation: string;
}

export class QueryError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'QueryError';
    this.code = code;
  }
}

/**
 * Turn arbitrary user text into a safe FTS5 MATCH expression.
 *
 * Every token is quoted, and a `"` inside a token is doubled, so no user input
 * can reach FTS5 as syntax. Operators the user types (`AND`, `NEAR`, `*`, `:`,
 * `^`, parentheses) become literal text rather than query structure. The final
 * token also gets a prefix match so that typing continues to narrow results.
 */
export function toFtsQuery(raw: string): string | undefined {
  const tokens = raw.match(/[\p{L}\p{N}_]+/gu);
  if (tokens === null || tokens.length === 0) return undefined;
  const quoted = tokens.map((token) => `"${token.replace(/"/g, '""')}"`);
  const last = quoted[quoted.length - 1];
  if (last !== undefined) quoted[quoted.length - 1] = `${last}*`;
  return quoted.join(' ');
}

interface ConceptRow {
  id: string;
  title: string;
  slug: string;
  summary: string;
  kind: string;
  tier: number;
  review_state: string;
}

function toHit(
  row: ConceptRow,
  matchKind: MatchKind,
  matchedAlias: string | null,
  rankExplanation: string,
): SearchHit {
  return {
    conceptId: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    kind: row.kind,
    tier: row.tier,
    reviewState: row.review_state,
    matchedAlias,
    matchKind,
    rankExplanation,
  };
}

const CONCEPT_COLUMNS = 'c.id, c.title, c.slug, c.summary, c.kind, c.tier, c.review_state';

/**
 * Search the compiled index.
 *
 * Results are ordered by how directly they matched — exact title, exact alias,
 * title prefix, alias prefix, then full-text relevance. Within the full-text
 * band the order is BM25 relevance; the ordering is deterministic for a given
 * index.
 */
export function searchConcepts(db: DatabaseType, rawQuery: string, limit = 10): SearchHit[] {
  const query = rawQuery.trim();
  if (query.length === 0) {
    throw new QueryError('empty_query', 'a search query must not be empty');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new QueryError(
      'query_too_long',
      `a search query must be at most ${String(MAX_QUERY_LENGTH)} characters`,
    );
  }
  const cappedLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_SEARCH_LIMIT);
  const normalized = normalizeName(query);

  // Bands are collected in rank order and each band is already internally
  // ordered — exact matches by title-before-alias, prefixes by length, full text
  // by BM25 relevance. A concept is taken the first time it appears, which is
  // its best band, so insertion order *is* the final ranking.
  const ordered: SearchHit[] = [];
  const seen = new Set<string>();
  const take = (hit: SearchHit): void => {
    if (seen.has(hit.conceptId)) return;
    seen.add(hit.conceptId);
    ordered.push(hit);
  };

  /* 1–2. Exact name matches, on the normalised form. */
  const exact = db
    .prepare(
      `SELECT ${CONCEPT_COLUMNS}, a.alias, a.is_title
         FROM aliases a JOIN concepts c ON c.id = a.concept_id
        WHERE a.normalized = ?`,
    )
    .all(normalized) as (ConceptRow & { alias: string; is_title: number })[];
  for (const row of exact.sort((a, b) => b.is_title - a.is_title)) {
    take(
      row.is_title === 1
        ? toHit(row, 'exact-title', null, `title is exactly "${query}"`)
        : toHit(row, 'exact-alias', row.alias, `alias "${row.alias}" is exactly "${query}"`),
    );
  }

  /* 3–4. Prefix matches on the normalised form. */
  if (normalized.length > 0) {
    const prefixed = db
      .prepare(
        `SELECT ${CONCEPT_COLUMNS}, a.alias, a.is_title
           FROM aliases a JOIN concepts c ON c.id = a.concept_id
          WHERE a.normalized LIKE ? ESCAPE '\\'
          ORDER BY a.is_title DESC, LENGTH(a.normalized), c.title`,
      )
      .all(`${normalized.replace(/[%_\\]/g, '\\$&')}%`) as (ConceptRow & {
      alias: string;
      is_title: number;
    })[];
    for (const row of prefixed) {
      take(
        row.is_title === 1
          ? toHit(row, 'title-prefix', null, `title starts with "${query}"`)
          : toHit(row, 'alias-prefix', row.alias, `alias "${row.alias}" starts with "${query}"`),
      );
    }
  }

  /* 5. Full text over title, aliases, summary and body. */
  const match = toFtsQuery(query);
  if (match !== undefined) {
    let rows: (ConceptRow & { score: number })[];
    try {
      rows = db
        .prepare(
          `SELECT ${CONCEPT_COLUMNS}, bm25(concepts_fts, 0.0, 10.0, 8.0, 4.0, 1.0) AS score
             FROM concepts_fts
             JOIN concepts c ON c.id = concepts_fts.concept_id
            WHERE concepts_fts MATCH ?
            ORDER BY score, c.title`,
        )
        .all(match) as (ConceptRow & { score: number })[];
    } catch {
      // Every token is quoted before it reaches FTS5, so a syntax error here is
      // not something a user can cause. Degrade to the name matches already
      // collected rather than surfacing an SQL error.
      rows = [];
    }
    for (const row of rows) {
      take(toHit(row, 'full-text', null, `text matches "${query}"`));
    }
  }

  // Sort by band only, with insertion order as the tie-break, so a stable sort
  // preserves each band's internal ordering. Sorting on title here would throw
  // BM25 relevance away.
  return ordered
    .map((hit, index) => ({ hit, index }))
    .sort((a, b) => MATCH_RANK[a.hit.matchKind] - MATCH_RANK[b.hit.matchKind] || a.index - b.index)
    .map((entry) => entry.hit)
    .slice(0, cappedLimit);
}

/* -------------------------------------------------------------------------- */
/* Concept retrieval                                                           */
/* -------------------------------------------------------------------------- */

export interface ConceptCategory {
  readonly path: string;
  readonly name: string;
  readonly topLevel: string;
  readonly isPrimary: boolean;
}

export interface ConceptRelationship {
  readonly type: string;
  readonly direction: 'outgoing' | 'incoming';
  /** The concept at the other end of the edge. */
  readonly otherId: string;
  readonly otherTitle: string;
  readonly otherSlug: string;
  readonly note: string | null;
  readonly condition: string | null;
}

export interface ConceptSourceCitation {
  readonly sourceId: string;
  readonly title: string;
  readonly url: string;
  readonly sourceKind: string;
  readonly supports: readonly string[];
  readonly checkedOn: string;
}

export interface ConceptDetail {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly kind: string;
  readonly tier: number;
  readonly reviewState: string;
  readonly summary: string;
  /** Canonical Markdown source. The caller renders it; the API never does. */
  readonly body: string;
  readonly aliases: readonly string[];
  readonly primaryCategory: string;
  readonly categories: readonly ConceptCategory[];
  readonly relationships: readonly ConceptRelationship[];
  readonly sources: readonly ConceptSourceCitation[];
  readonly contentHash: string;
  readonly sourcePath: string;
}

interface ConceptBaseRow {
  id: string;
  title: string;
  slug: string;
  kind: string;
  tier: number;
  review_state: string;
  summary: string;
  body: string;
  content_hash: string;
  source_path: string;
  primary_category: string;
}

function hydrate(db: DatabaseType, base: ConceptBaseRow): ConceptDetail {
  const aliases = (
    db
      .prepare('SELECT alias FROM aliases WHERE concept_id = ? AND is_title = 0 ORDER BY position')
      .all(base.id) as { alias: string }[]
  ).map((row) => row.alias);

  const categories = (
    db
      .prepare(
        `SELECT cat.path, cat.name, cat.top_level, cc.is_primary
           FROM concept_categories cc JOIN categories cat ON cat.id = cc.category_id
          WHERE cc.concept_id = ? ORDER BY cc.position`,
      )
      .all(base.id) as { path: string; name: string; top_level: string; is_primary: number }[]
  ).map((row) => ({
    path: row.path,
    name: row.name,
    topLevel: row.top_level,
    isPrimary: row.is_primary === 1,
  }));

  const relationships = (
    db
      .prepare(
        `SELECT r.type, 'outgoing' AS direction, r.target_concept_id AS other_id,
                t.title AS other_title, t.slug AS other_slug, r.note, r.condition, r.position
           FROM relationships r JOIN concepts t ON t.id = r.target_concept_id
          WHERE r.source_concept_id = @id
          UNION ALL
         SELECT r.type, 'incoming' AS direction, r.source_concept_id AS other_id,
                s.title AS other_title, s.slug AS other_slug, r.note, r.condition, r.position
           FROM relationships r JOIN concepts s ON s.id = r.source_concept_id
          WHERE r.target_concept_id = @id
          ORDER BY direction, type, other_id`,
      )
      .all({ id: base.id }) as {
      type: string;
      direction: 'outgoing' | 'incoming';
      other_id: string;
      other_title: string;
      other_slug: string;
      note: string | null;
      condition: string | null;
    }[]
  ).map((row) => ({
    type: row.type,
    direction: row.direction,
    otherId: row.other_id,
    otherTitle: row.other_title,
    otherSlug: row.other_slug,
    note: row.note,
    condition: row.condition,
  }));

  const sources = (
    db
      .prepare(
        `SELECT s.id, s.title, s.url, s.source_kind, cs.supports, cs.checked_on
           FROM concept_sources cs JOIN sources s ON s.id = cs.source_id
          WHERE cs.concept_id = ? ORDER BY cs.position`,
      )
      .all(base.id) as {
      id: string;
      title: string;
      url: string;
      source_kind: string;
      supports: string;
      checked_on: string;
    }[]
  ).map((row) => ({
    sourceId: row.id,
    title: row.title,
    url: row.url,
    sourceKind: row.source_kind,
    supports: JSON.parse(row.supports) as string[],
    checkedOn: row.checked_on,
  }));

  return {
    id: base.id,
    title: base.title,
    slug: base.slug,
    kind: base.kind,
    tier: base.tier,
    reviewState: base.review_state,
    summary: base.summary,
    body: base.body,
    aliases,
    primaryCategory: base.primary_category,
    categories,
    relationships,
    sources,
    contentHash: base.content_hash,
    sourcePath: base.source_path,
  };
}

const CONCEPT_BASE_COLUMNS =
  'id, title, slug, kind, tier, review_state, summary, body, content_hash, source_path, primary_category';

/** Retrieve one concept by its stable id, or undefined when it does not exist. */
export function getConceptById(db: DatabaseType, conceptId: string): ConceptDetail | undefined {
  const base = db
    .prepare(`SELECT ${CONCEPT_BASE_COLUMNS} FROM concepts WHERE id = ?`)
    .get(conceptId) as ConceptBaseRow | undefined;
  return base === undefined ? undefined : hydrate(db, base);
}

/** Retrieve one concept by its canonical slug. */
export function getConceptBySlug(db: DatabaseType, slug: string): ConceptDetail | undefined {
  const base = db
    .prepare(`SELECT ${CONCEPT_BASE_COLUMNS} FROM concepts WHERE slug = ?`)
    .get(slug) as ConceptBaseRow | undefined;
  return base === undefined ? undefined : hydrate(db, base);
}

/** Facts about the compiled build, for the API's /api/build endpoint. */
export interface BuildInfo {
  readonly schemaVersion: number;
  readonly corpusHash: string;
  readonly builtAt: string;
  readonly generator: string;
  readonly counts: {
    readonly concepts: number;
    readonly relationships: number;
    readonly categories: number;
    readonly sources: number;
  };
  readonly tiers: Readonly<Record<string, number>>;
  readonly reviewStates: Readonly<Record<string, number>>;
}

export function getBuildInfo(db: DatabaseType): BuildInfo {
  const meta = Object.fromEntries(
    (db.prepare('SELECT key, value FROM build_meta').all() as { key: string; value: string }[]).map(
      (row) => [row.key, row.value],
    ),
  );
  const count = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  const group = (column: string): Record<string, number> =>
    Object.fromEntries(
      (
        db
          .prepare(
            `SELECT ${column} AS k, COUNT(*) AS n FROM concepts GROUP BY ${column} ORDER BY k`,
          )
          .all() as { k: string | number; n: number }[]
      ).map((row) => [String(row.k), row.n]),
    );

  return {
    schemaVersion: Number(meta['schema_version'] ?? '0'),
    corpusHash: meta['corpus_hash'] ?? '',
    builtAt: meta['built_at'] ?? '',
    generator: meta['generator'] ?? '',
    counts: {
      concepts: count('concepts'),
      relationships: count('relationships'),
      categories: count('categories'),
      sources: count('sources'),
    },
    tiers: group('tier'),
    reviewStates: group('review_state'),
  };
}
