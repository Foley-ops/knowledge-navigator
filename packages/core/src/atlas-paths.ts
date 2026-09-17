/**
 * Where the v2 canonical formats live, relative to `content/`.
 *
 * Separate from ./atlas.ts and ./graph-only.ts so the validator can name these
 * locations without importing either module's implementation.
 */

/** The curated broad atlas file (v2 runbook §4.1). */
export const ATLAS_FILE_NAME = 'atlas.yaml';

/** The directory holding Tier 3 graph-only identities (v2 runbook §4.2). */
export const GRAPH_ONLY_DIR_NAME = 'graph-only';
