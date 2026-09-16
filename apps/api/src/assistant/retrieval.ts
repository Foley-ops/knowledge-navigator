import { getConceptById, normalizeName, searchConcepts } from '@navigator/core';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { AssistantRequest, Retrieval, RetrievedConcept } from './types.js';

/**
 * Grounded retrieval (runbook E06).
 *
 * Selection is deterministic: the same question and corpus always produce the
 * same material in the same order. Exact names win first — a question that
 * mentions "conv layer" pulls the convolutional layer before anything the
 * full-text index merely finds interesting — then full-text relevance fills the
 * remaining slots.
 *
 * The user's research context is *used* for retrieval but never logged; only
 * the derived search terms are returned for debugging.
 */
export const MAX_RETRIEVED_CONCEPTS = 8;
const MAX_NAME_WINDOW = 5;
const MIN_EXCERPT_CHARS = 400;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
}

/**
 * Concept ids whose title or alias appears verbatim in the text, longest match
 * first. Windows are scanned from longest to shortest so "conv layer" beats
 * "layer".
 */
function exactNameMatches(db: DatabaseType, text: string): string[] {
  const tokens = tokenize(text);
  const lookup = db.prepare('SELECT concept_id FROM aliases WHERE normalized = ?');
  const found: string[] = [];
  const seen = new Set<string>();

  for (let size = Math.min(MAX_NAME_WINDOW, tokens.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      const phrase = normalizeName(tokens.slice(start, start + size).join(' '));
      if (phrase.length < 2) continue;
      const row = lookup.get(phrase) as { concept_id: string } | undefined;
      if (row === undefined || seen.has(row.concept_id)) continue;
      seen.add(row.concept_id);
      found.push(row.concept_id);
    }
  }
  return found;
}

/** Trim to a character budget on a word boundary, marking the cut honestly. */
function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}\n[…excerpt truncated…]`;
}

interface Selected {
  readonly conceptId: string;
  readonly matchKind: string;
  readonly rankExplanation: string;
}

export interface RetrieveOptions {
  readonly characterBudget: number;
  readonly maxConcepts?: number;
}

/** Select canonical material for a question. */
export function retrieve(
  db: DatabaseType,
  request: AssistantRequest,
  options: RetrieveOptions,
): Retrieval {
  const maxConcepts = Math.max(1, Math.min(options.maxConcepts ?? MAX_RETRIEVED_CONCEPTS, 20));
  const queries: string[] = [];
  const selected: Selected[] = [];
  const seen = new Set<string>();

  // Set when the concept cap turned away material that would otherwise have
  // been included, so truncation is reported rather than inferred.
  let cappedByCount = false;

  const take = (conceptId: string, matchKind: string, rankExplanation: string): void => {
    if (seen.has(conceptId)) return;
    if (selected.length >= maxConcepts) {
      cappedByCount = true;
      return;
    }
    seen.add(conceptId);
    selected.push({ conceptId, matchKind, rankExplanation });
  };

  // 1. Exact names in the question, then in the context.
  for (const [label, text] of [
    ['question', request.question],
    ['context', request.context ?? ''],
  ] as const) {
    if (text.trim() === '') continue;
    for (const conceptId of exactNameMatches(db, text)) {
      take(conceptId, 'exact-name', `a name for this concept appears verbatim in the ${label}`);
    }
  }

  // 2. Full-text relevance, question first.
  for (const [label, text] of [
    ['question', request.question],
    ['context', request.context ?? ''],
  ] as const) {
    const trimmed = text.trim().slice(0, 200);
    if (trimmed === '') continue;
    queries.push(trimmed);
    if (selected.length >= maxConcepts) continue;
    let hits;
    try {
      // 'any' so a whole sentence ranks by the terms it does match.
      hits = searchConcepts(db, trimmed, maxConcepts, 'any');
    } catch {
      continue;
    }
    for (const hit of hits) {
      take(hit.conceptId, hit.matchKind, `${hit.rankExplanation} (from the ${label})`);
    }
  }

  // 3. Hydrate, then fit the material into the character budget.
  const budget = Math.max(options.characterBudget, MIN_EXCERPT_CHARS);
  const perConcept = Math.max(MIN_EXCERPT_CHARS, Math.floor(budget / Math.max(selected.length, 1)));

  const concepts: RetrievedConcept[] = [];
  let used = 0;
  let truncated = false;

  for (const entry of selected) {
    const detail = getConceptById(db, entry.conceptId);
    if (detail === undefined) continue;

    const excerpt = clip(detail.plainText, perConcept);
    const cost = excerpt.length + detail.summary.length;
    if (used + cost > budget && concepts.length > 0) {
      truncated = true;
      continue;
    }
    if (excerpt.length < detail.plainText.length) truncated = true;
    used += cost;

    concepts.push({
      conceptId: detail.id,
      title: detail.title,
      slug: detail.slug,
      summary: detail.summary,
      reviewState: detail.reviewState,
      matchKind: entry.matchKind,
      rankExplanation: entry.rankExplanation,
      excerpt,
      relationships: detail.relationships.map((relationship) => ({
        type: relationship.type,
        direction: relationship.direction,
        otherId: relationship.otherId,
        otherTitle: relationship.otherTitle,
      })),
      sources: detail.sources.map((source) => ({
        sourceId: source.sourceId,
        title: source.title,
        url: source.url,
        sourceKind: source.sourceKind,
        supports: source.supports,
        checkedOn: source.checkedOn,
      })),
    });
  }

  return {
    concepts,
    characterCount: used,
    characterBudget: budget,
    truncated: truncated || cappedByCount || selected.length > concepts.length,
    queries,
  };
}
