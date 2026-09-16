/**
 * Graph export (runbook D05).
 *
 * The browser reads `generated/graph.json` rather than talking to SQLite, so
 * the compiled database never has to be exposed. Everything is sorted
 * semantically before serialisation, and the only non-deterministic field —
 * the build timestamp — comes from `SOURCE_DATE_EPOCH` when it is set, so two
 * builds of identical input produce byte-identical output.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { compareStrings } from './normalize.js';
import { SCHEMA_VERSION } from './db.js';

export interface GraphNode {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly kind: string;
  readonly tier: number;
  readonly reviewState: string;
  readonly summary: string;
  readonly aliases: readonly string[];
  readonly primaryCategory: string;
  readonly categories: readonly string[];
}

export interface GraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: string;
  readonly note: string | null;
  readonly condition: string | null;
}

export interface GraphCategory {
  readonly path: string;
  readonly name: string;
  readonly topLevel: string;
  readonly depth: number;
  readonly parent: string | null;
  /** Concepts whose primary category is exactly this path. */
  readonly primaryConceptIds: readonly string[];
  /** Every concept attached to this path, primary or not. */
  readonly conceptIds: readonly string[];
}

export interface GraphDocument {
  readonly schemaVersion: number;
  readonly builtAt: string;
  readonly corpusHash: string;
  readonly counts: {
    readonly concepts: number;
    readonly relationships: number;
    readonly categories: number;
  };
  readonly categories: readonly GraphCategory[];
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

/** A stable, human-readable edge identifier. */
export function edgeId(source: string, type: string, target: string): string {
  return `${source}|${type}|${target}`;
}

/** Read the whole graph out of a compiled database. */
export function buildGraphDocument(
  db: DatabaseType,
  meta: { builtAt: string; corpusHash: string },
): GraphDocument {
  const conceptRows = db
    .prepare(
      `SELECT id, title, slug, kind, tier, review_state, summary, primary_category
         FROM concepts ORDER BY id`,
    )
    .all() as {
    id: string;
    title: string;
    slug: string;
    kind: string;
    tier: number;
    review_state: string;
    summary: string;
    primary_category: string;
  }[];

  const aliasRows = db
    .prepare('SELECT concept_id, alias, is_title FROM aliases ORDER BY concept_id, position')
    .all() as { concept_id: string; alias: string; is_title: number }[];
  const aliasesByConcept = new Map<string, string[]>();
  for (const row of aliasRows) {
    if (row.is_title === 1) continue;
    const list = aliasesByConcept.get(row.concept_id);
    if (list === undefined) aliasesByConcept.set(row.concept_id, [row.alias]);
    else list.push(row.alias);
  }

  const categoryLinks = db
    .prepare(
      `SELECT cc.concept_id, cat.path, cc.is_primary
         FROM concept_categories cc JOIN categories cat ON cat.id = cc.category_id
        ORDER BY cc.concept_id, cc.position`,
    )
    .all() as { concept_id: string; path: string; is_primary: number }[];
  const categoriesByConcept = new Map<string, string[]>();
  for (const row of categoryLinks) {
    const list = categoriesByConcept.get(row.concept_id);
    if (list === undefined) categoriesByConcept.set(row.concept_id, [row.path]);
    else list.push(row.path);
  }

  const nodes: GraphNode[] = conceptRows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    kind: row.kind,
    tier: row.tier,
    reviewState: row.review_state,
    summary: row.summary,
    aliases: aliasesByConcept.get(row.id) ?? [],
    primaryCategory: row.primary_category,
    categories: categoriesByConcept.get(row.id) ?? [],
  }));

  const edgeRows = db
    .prepare(
      `SELECT source_concept_id, type, target_concept_id, note, condition
         FROM relationships
        ORDER BY source_concept_id, type, target_concept_id`,
    )
    .all() as {
    source_concept_id: string;
    type: string;
    target_concept_id: string;
    note: string | null;
    condition: string | null;
  }[];
  const edges: GraphEdge[] = edgeRows.map((row) => ({
    id: edgeId(row.source_concept_id, row.type, row.target_concept_id),
    source: row.source_concept_id,
    target: row.target_concept_id,
    type: row.type,
    note: row.note,
    condition: row.condition,
  }));

  const categoryRows = db
    .prepare(
      `SELECT c.path, c.name, c.top_level, c.depth, p.path AS parent_path
         FROM categories c LEFT JOIN categories p ON p.id = c.parent_id
        ORDER BY c.path`,
    )
    .all() as {
    path: string;
    name: string;
    top_level: string;
    depth: number;
    parent_path: string | null;
  }[];

  const byPath = new Map<string, { primary: string[]; all: string[] }>();
  for (const row of categoryRows) byPath.set(row.path, { primary: [], all: [] });
  for (const link of categoryLinks) {
    const entry = byPath.get(link.path);
    if (entry === undefined) continue;
    entry.all.push(link.concept_id);
    if (link.is_primary === 1) entry.primary.push(link.concept_id);
  }

  const categories: GraphCategory[] = categoryRows.map((row) => {
    const entry = byPath.get(row.path) ?? { primary: [], all: [] };
    return {
      path: row.path,
      name: row.name,
      topLevel: row.top_level,
      depth: row.depth,
      parent: row.parent_path,
      primaryConceptIds: [...entry.primary].sort(compareStrings),
      conceptIds: [...entry.all].sort(compareStrings),
    };
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    builtAt: meta.builtAt,
    corpusHash: meta.corpusHash,
    counts: {
      concepts: nodes.length,
      relationships: edges.length,
      categories: categories.length,
    },
    categories,
    nodes,
    edges,
  };
}

/** Serialise exactly as it is written to disk. */
export function serializeGraph(document: GraphDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

/* -------------------------------------------------------------------------- */
/* Bounded neighbourhood traversal (runbook E04)                               */
/* -------------------------------------------------------------------------- */

export const MIN_GRAPH_DEPTH = 1;
export const MAX_GRAPH_DEPTH = 3;
export const MAX_GRAPH_NODES = 200;

export interface NeighborhoodNode {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly kind: string;
  readonly tier: number;
  readonly reviewState: string;
  readonly summary: string;
  readonly primaryCategory: string;
  /** Hops from the centre. The centre itself is 0. */
  readonly distance: number;
}

export interface Neighborhood {
  readonly centerId: string;
  readonly depth: number;
  readonly nodes: readonly NeighborhoodNode[];
  readonly edges: readonly GraphEdge[];
  /** True when the node cap stopped the traversal before it ran out of graph. */
  readonly truncated: boolean;
  readonly nodeLimit: number;
}

/**
 * Breadth-first neighbourhood around one concept, bounded in both depth and
 * size. Relationships are followed in both directions, because a prerequisite
 * is as relevant to a reader as a dependent. The whole-corpus query is
 * deliberately unreachable through this function: depth is clamped to 1–3 and
 * the node count is capped, with truncation reported rather than hidden.
 */
export function getNeighborhood(
  db: DatabaseType,
  centerId: string,
  requestedDepth: number,
  nodeLimit: number = MAX_GRAPH_NODES,
): Neighborhood | undefined {
  const exists = db.prepare('SELECT 1 AS found FROM concepts WHERE id = ?').get(centerId);
  if (exists === undefined) return undefined;

  const depth = Math.min(Math.max(Math.trunc(requestedDepth), MIN_GRAPH_DEPTH), MAX_GRAPH_DEPTH);
  const limit = Math.min(Math.max(Math.trunc(nodeLimit), 1), MAX_GRAPH_NODES);

  const neighbourStatement = db.prepare(
    `SELECT type, target_concept_id AS other, note, condition, 1 AS outgoing
       FROM relationships WHERE source_concept_id = @id
      UNION ALL
     SELECT type, source_concept_id AS other, note, condition, 0 AS outgoing
       FROM relationships WHERE target_concept_id = @id
      ORDER BY outgoing DESC, type, other`,
  );

  const distances = new Map<string, number>([[centerId, 0]]);
  const edges = new Map<string, GraphEdge>();
  let truncated = false;
  let frontier: string[] = [centerId];

  for (let hop = 0; hop < depth; hop += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      const rows = neighbourStatement.all({ id }) as {
        type: string;
        other: string;
        note: string | null;
        condition: string | null;
        outgoing: number;
      }[];
      for (const row of rows) {
        const source = row.outgoing === 1 ? id : row.other;
        const target = row.outgoing === 1 ? row.other : id;

        if (!distances.has(row.other)) {
          if (distances.size >= limit) {
            truncated = true;
            continue;
          }
          distances.set(row.other, hop + 1);
          next.push(row.other);
        }
        // Only keep an edge once both of its endpoints are inside the result.
        if (distances.has(source) && distances.has(target)) {
          const key = edgeId(source, row.type, target);
          if (!edges.has(key)) {
            edges.set(key, {
              id: key,
              source,
              target,
              type: row.type,
              note: row.note,
              condition: row.condition,
            });
          }
        }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }

  const ids = [...distances.keys()].sort(compareStrings);
  const placeholders = ids.map(() => '?').join(', ');
  const rows = db
    .prepare(
      `SELECT id, title, slug, kind, tier, review_state, summary, primary_category
         FROM concepts WHERE id IN (${placeholders}) ORDER BY id`,
    )
    .all(...ids) as {
    id: string;
    title: string;
    slug: string;
    kind: string;
    tier: number;
    review_state: string;
    summary: string;
    primary_category: string;
  }[];

  const nodes: NeighborhoodNode[] = rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      kind: row.kind,
      tier: row.tier,
      reviewState: row.review_state,
      summary: row.summary,
      primaryCategory: row.primary_category,
      distance: distances.get(row.id) ?? 0,
    }))
    .sort((a, b) => a.distance - b.distance || compareStrings(a.id, b.id));

  return {
    centerId,
    depth,
    nodes,
    edges: [...edges.values()].sort((a, b) => compareStrings(a.id, b.id)),
    truncated,
    nodeLimit: limit,
  };
}
