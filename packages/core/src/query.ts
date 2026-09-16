/**
 * Read-only query surface over the compiled index (runbook D04, E00–E04).
 *
 * Every function here takes an open database and only reads. Nothing in this
 * module writes, and the API opens the database read-only so that a request can
 * never change canonical knowledge.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { compareStrings, normalizeName } from './normalize.js';

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
 * title prefix, alias prefix, then full-text relevance — and ties inside a band
 * are broken by title so the order is stable.
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
    let rows: (ConceptRow & { score: number })[] = [];
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

  return ordered
    .sort(
      (a, b) =>
        MATCH_RANK[a.matchKind] - MATCH_RANK[b.matchKind] || compareStrings(a.title, b.title),
    )
    .slice(0, cappedLimit);
}
