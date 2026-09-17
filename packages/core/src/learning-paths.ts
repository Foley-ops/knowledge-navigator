/**
 * Prerequisite paths (v2 runbook §4.8, Q04–Q05).
 *
 * The semantics are narrow on purpose. Exactly two relationship types create a
 * prerequisite step:
 *
 *   * an outgoing `requires` means the target comes **before** the source;
 *   * an outgoing `prerequisite_of` means the source comes **before** the target;
 *   * an incoming edge of either type is the exact inverse.
 *
 * No other type contributes. `contrasts_with`, `implements`, `generalizes` and
 * the rest describe how ideas relate, not what has to be understood first, and
 * treating them as ordering would invent a curriculum the corpus never claimed.
 *
 * When there is no supported route, the product says so and lists what is
 * missing from the graph. It does not fall back to "related concepts" dressed
 * up as a path.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { compareStrings } from './normalize.js';

/** The only two relationship types that order anything. */
export const PREREQUISITE_TYPES = ['requires', 'prerequisite_of'] as const;

/** Familiarity levels, mirrored from the personal store's vocabulary (§4.6). */
export const pathFamiliarityLevels = ['unfamiliar', 'recognize', 'working', 'strong'] as const;
export type PathFamiliarity = (typeof pathFamiliarityLevels)[number];

export const MAX_PATH_STEPS = 200;

export interface PathEdge {
  /** The concept that must come first. */
  readonly beforeId: string;
  /** The concept that depends on it. */
  readonly afterId: string;
  /** The declared relationship, and which end declared it. */
  readonly type: (typeof PREREQUISITE_TYPES)[number];
  readonly declaredBy: string;
  readonly note: string | null;
  readonly condition: string | null;
}

export interface PathStep {
  readonly conceptId: string;
  readonly title: string;
  readonly slug: string;
  readonly hasArticle: boolean;
  readonly tier: number;
  readonly reviewState: string;
  readonly summary: string;
  /** 1-based position in the route. */
  readonly position: number;
  /**
   * Why this step is here: the edge that put it before the next one. Null for
   * the target itself, which is where the route ends.
   */
  readonly because: PathEdge | null;
  readonly familiarity: PathFamiliarity | null;
  /** True when familiarity says the researcher probably knows this already. */
  readonly likelyKnown: boolean;
}

export interface MissingGraphInformation {
  readonly conceptId: string;
  readonly title: string;
  readonly reason: string;
}

export interface LearningPath {
  readonly targetId: string;
  readonly targetTitle: string;
  readonly reachable: boolean;
  readonly steps: readonly PathStep[];
  /** Concepts treated as already known, and why. */
  readonly startedFrom: readonly {
    readonly conceptId: string;
    readonly title: string;
    readonly reason: 'declared-known' | 'familiarity-strong';
  }[];
  /** Familiarity records that changed the result, named explicitly. */
  readonly familiarityEffects: readonly {
    readonly conceptId: string;
    readonly title: string;
    readonly level: PathFamiliarity;
    readonly effect: 'treated-as-known' | 'marked-likely-known';
  }[];
  readonly missing: readonly MissingGraphInformation[];
  /** Prerequisite edges the whole route rests on, for display. */
  readonly edges: readonly PathEdge[];
  readonly truncated: boolean;
}

export interface PathOptions {
  /** Concepts the researcher says they already know. */
  readonly known?: readonly string[] | undefined;
  /** Concept id → level, from the private store. Only the researcher writes it. */
  readonly familiarity?: ReadonlyMap<string, PathFamiliarity> | undefined;
  /** Concepts to include even if familiarity would have skipped them. */
  readonly include?: readonly string[] | undefined;
}

interface EdgeRow {
  source: string;
  type: string;
  target: string;
  note: string | null;
  condition: string | null;
}

interface NodeRow {
  id: string;
  title: string;
  slug: string;
  tier: number;
  review_state: string;
  summary: string;
  has_article: number;
}

/**
 * Every prerequisite edge in the corpus, normalised to before → after.
 *
 * Both directions of both types collapse to one representation, so the search
 * never has to reason about which end declared the relationship. `declaredBy`
 * keeps that fact for display, because a reader deserves to know which page
 * made the claim.
 */
export function prerequisiteEdges(db: DatabaseType): PathEdge[] {
  const rows = db
    .prepare(
      `SELECT source_concept_id AS source, type, target_concept_id AS target, note, condition
         FROM relationships
        WHERE type IN ('requires', 'prerequisite_of')
        ORDER BY source_concept_id, type, target_concept_id`,
    )
    .all() as EdgeRow[];

  return rows.map((row) =>
    row.type === 'requires'
      ? {
          beforeId: row.target,
          afterId: row.source,
          type: 'requires' as const,
          declaredBy: row.source,
          note: row.note,
          condition: row.condition,
        }
      : {
          beforeId: row.source,
          afterId: row.target,
          type: 'prerequisite_of' as const,
          declaredBy: row.source,
          note: row.note,
          condition: row.condition,
        },
  );
}

function loadNodes(db: DatabaseType): Map<string, NodeRow> {
  const rows = db
    .prepare(
      'SELECT id, title, slug, tier, review_state, summary, has_article FROM concepts ORDER BY id',
    )
    .all() as NodeRow[];
  return new Map(rows.map((row) => [row.id, row]));
}

/**
 * Build the shortest supported route to a target.
 *
 * The search runs backwards from the target over prerequisite edges, breadth
 * first, so the first time a concept is reached is by a shortest chain. Ties
 * break on concept id, which makes the result identical on every run.
 *
 * Cycles are bounded by the visited set: a corpus that declared A requires B
 * and B requires A produces a route that visits each once and reports the
 * cycle rather than looping.
 */
export function buildLearningPath(
  db: DatabaseType,
  targetId: string,
  options: PathOptions = {},
): LearningPath {
  const nodes = loadNodes(db);
  const target = nodes.get(targetId);
  if (target === undefined) {
    return {
      targetId,
      targetTitle: targetId,
      reachable: false,
      steps: [],
      startedFrom: [],
      familiarityEffects: [],
      missing: [
        {
          conceptId: targetId,
          title: targetId,
          reason: 'This concept does not exist in the corpus, so no route can be built to it.',
        },
      ],
      edges: [],
      truncated: false,
    };
  }

  const edges = prerequisiteEdges(db);
  const incoming = new Map<string, PathEdge[]>();
  for (const edge of [...edges].sort(
    (a, b) => compareStrings(a.afterId, b.afterId) || compareStrings(a.beforeId, b.beforeId),
  )) {
    const list = incoming.get(edge.afterId);
    if (list === undefined) incoming.set(edge.afterId, [edge]);
    else list.push(edge);
  }

  const include = new Set(options.include ?? []);
  const familiarity = options.familiarity ?? new Map<string, PathFamiliarity>();

  type Effect = LearningPath['familiarityEffects'][number];
  type Start = LearningPath['startedFrom'][number];
  const familiarityEffects: Effect[] = [];
  const startedFrom: Start[] = [];

  /** Concepts the route may stop at, because they are already known. */
  const known = new Set<string>();
  for (const id of options.known ?? []) {
    if (!nodes.has(id) || id === targetId) continue;
    known.add(id);
    startedFrom.push({
      conceptId: id,
      title: nodes.get(id)?.title ?? id,
      reason: 'declared-known',
    });
  }
  for (const [id, level] of [...familiarity].sort((a, b) => compareStrings(a[0], b[0]))) {
    if (!nodes.has(id) || id === targetId) continue;
    if (include.has(id)) continue;
    if (level === 'strong') {
      if (!known.has(id)) {
        known.add(id);
        startedFrom.push({
          conceptId: id,
          title: nodes.get(id)?.title ?? id,
          reason: 'familiarity-strong',
        });
      }
      familiarityEffects.push({
        conceptId: id,
        title: nodes.get(id)?.title ?? id,
        level,
        effect: 'treated-as-known',
      });
    }
  }

  /* --------------------------- the search ------------------------------- */

  // Backwards breadth-first from the target. `depth` is the longest prerequisite
  // chain below a concept, which is exactly the order to read them in.
  const depth = new Map<string, number>([[targetId, 0]]);
  const reason = new Map<string, PathEdge>();
  const order: string[] = [];
  const missing: MissingGraphInformation[] = [];
  const cyclic = new Set<string>();

  let frontier = [targetId];
  const seen = new Set<string>([targetId]);
  let truncated = false;

  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of [...frontier].sort(compareStrings)) {
      order.push(id);
      if (known.has(id)) continue;

      const parents = incoming.get(id) ?? [];
      if (parents.length === 0 && id !== targetId) continue;

      for (const edge of parents) {
        if (!nodes.has(edge.beforeId)) {
          // Validation forbids this, so reaching it means the graph changed
          // under us. Report it rather than silently dropping the step.
          missing.push({
            conceptId: edge.beforeId,
            title: edge.beforeId,
            reason: 'A prerequisite named by this corpus does not exist in it.',
          });
          continue;
        }
        if (seen.has(edge.beforeId)) {
          // Already placed, or a cycle. Either way the edge is real and the
          // reader should see it; the route just does not visit twice.
          if (depth.has(edge.beforeId) && (depth.get(edge.beforeId) ?? 0) <= (depth.get(id) ?? 0)) {
            cyclic.add(edge.beforeId);
          }
          continue;
        }
        seen.add(edge.beforeId);
        depth.set(edge.beforeId, (depth.get(id) ?? 0) + 1);
        reason.set(edge.beforeId, edge);
        next.push(edge.beforeId);
        if (seen.size > MAX_PATH_STEPS) {
          truncated = true;
          break;
        }
      }
      if (truncated) break;
    }
    if (truncated) break;
    frontier = next;
  }

  for (const id of [...cyclic].sort(compareStrings)) {
    missing.push({
      conceptId: id,
      title: nodes.get(id)?.title ?? id,
      reason:
        'This concept takes part in a prerequisite cycle, so the corpus does not say which comes first.',
    });
  }

  /* ---------------------------- the route -------------------------------- */

  // Deepest first: a concept with the longest chain below it is read earliest.
  const visited = [...seen].filter((id) => !known.has(id) || id === targetId);
  visited.sort((a, b) => (depth.get(b) ?? 0) - (depth.get(a) ?? 0) || compareStrings(a, b));

  const steps: PathStep[] = visited.map((id, index) => {
    const node = nodes.get(id);
    const level = familiarity.get(id) ?? null;
    const likelyKnown = level === 'working' && id !== targetId;
    if (likelyKnown) {
      familiarityEffects.push({
        conceptId: id,
        title: node?.title ?? id,
        level: 'working',
        effect: 'marked-likely-known',
      });
    }
    return {
      conceptId: id,
      title: node?.title ?? id,
      slug: node?.slug ?? '',
      hasArticle: node?.has_article === 1,
      tier: node?.tier ?? 0,
      reviewState: node?.review_state ?? 'unknown',
      summary: node?.summary ?? '',
      position: index + 1,
      because: reason.get(id) ?? null,
      familiarity: level,
      likelyKnown,
    };
  });

  // A route of one step is the target alone: nothing in the corpus says
  // anything has to come before it. That is a fact worth stating.
  const reachable = steps.length > 1 || (incoming.get(targetId)?.length ?? 0) > 0;
  if (!reachable) {
    missing.push({
      conceptId: targetId,
      title: target.title,
      reason:
        'No page declares a requires or prerequisite_of relationship leading to this concept, so the corpus records no route to it.',
    });
  }

  const used = steps.map((step) => step.because).filter((edge): edge is PathEdge => edge !== null);

  return {
    targetId,
    targetTitle: target.title,
    reachable,
    steps,
    startedFrom: [...startedFrom].sort((a, b) => compareStrings(a.conceptId, b.conceptId)),
    familiarityEffects: [...familiarityEffects].sort((a, b) =>
      compareStrings(a.conceptId, b.conceptId),
    ),
    missing,
    edges: used,
    truncated,
  };
}
