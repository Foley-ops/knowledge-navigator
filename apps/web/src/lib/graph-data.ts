/**
 * The compiled graph, imported at build time.
 *
 * Reading it directly rather than through the API keeps browsing and the atlas
 * working even when the API process is unavailable, and keeps SQLite off the
 * network entirely.
 */
import graph from '@generated-graph';

export interface GraphDataNode {
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

export interface GraphDataCategory {
  readonly path: string;
  readonly name: string;
  readonly topLevel: string;
  readonly depth: number;
  readonly parent: string | null;
  readonly primaryConceptIds: readonly string[];
  readonly conceptIds: readonly string[];
}

export interface GraphData {
  readonly schemaVersion: number;
  readonly builtAt: string;
  readonly corpusHash: string;
  readonly counts: { concepts: number; relationships: number; categories: number };
  readonly categories: readonly GraphDataCategory[];
  readonly nodes: readonly GraphDataNode[];
  readonly edges: readonly {
    id: string;
    source: string;
    target: string;
    type: string;
    note: string | null;
    condition: string | null;
  }[];
}

export const graphData = graph as unknown as GraphData;

export const nodesById = new Map(graphData.nodes.map((node) => [node.id, node]));

/** Atlas areas that actually hold concepts, in stable order. */
export function atlasAreas(): GraphDataCategory[] {
  return graphData.categories
    .filter((category) => category.depth === 1 && category.conceptIds.length > 0)
    .concat(
      graphData.categories.filter(
        (category) =>
          category.depth === 1 &&
          category.conceptIds.length === 0 &&
          graphData.categories.some(
            (child) => child.parent === category.path && child.conceptIds.length > 0,
          ),
      ),
    )
    .filter((category, index, all) => all.findIndex((c) => c.path === category.path) === index)
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export function childrenOf(path: string): GraphDataCategory[] {
  return graphData.categories.filter((category) => category.parent === path);
}

/** Every concept under a category path, counting nested paths. */
export function conceptsUnder(path: string): GraphDataNode[] {
  const ids = new Set<string>();
  for (const category of graphData.categories) {
    if (category.path === path || category.path.startsWith(`${path}/`)) {
      for (const id of category.conceptIds) ids.add(id);
    }
  }
  return [...ids]
    .map((id) => nodesById.get(id))
    .filter((node): node is GraphDataNode => node !== undefined)
    .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
}
