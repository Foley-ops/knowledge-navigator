/**
 * Normalisation helpers shared by the schema, the compiler and search.
 *
 * Everything here is pure and deterministic: identical input must always
 * produce identical output, because compiled artefacts are required to be
 * byte-reproducible (runbook D05).
 */

/**
 * Normalise a title or alias for case-insensitive lookup.
 *
 * Unicode is folded to NFKC, case is dropped, hyphens and underscores become
 * spaces so `conv-layer` and `conv layer` collide deliberately, and runs of
 * whitespace collapse. Two names that normalise to the same string are treated
 * as the same name.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‐-―_]/g, '-')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a category path such as `Mathematics/Analysis` into its segments. */
export function categorySegments(category: string): string[] {
  return category.split('/').map((segment) => segment.trim());
}

/** The top-level atlas area of a category path. */
export function categoryTopLevel(category: string): string {
  return categorySegments(category)[0] ?? '';
}

/** Stable key for a category path, used for deterministic ordering and ids. */
export function categoryKey(category: string): string {
  return categorySegments(category).join('/');
}

/** The final path segment of a canonical slug, e.g. `/concepts/lenet` -> `lenet`. */
export function slugName(slug: string): string {
  const parts = slug.split('/');
  return parts[parts.length - 1] ?? '';
}

/**
 * Locale-independent comparison.
 *
 * `String.prototype.localeCompare` depends on the host ICU data, which would
 * make compiled output machine-dependent. Compare code points instead.
 */
export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
