/**
 * The one shape every validator reports in.
 *
 * This lives in its own module because validation now spans three formats —
 * Markdown concepts, graph-only YAML identities and the atlas — and each of
 * them needs the type without importing the others.
 */
import { compareStrings } from './normalize.js';

export interface Diagnostic {
  /** File the problem belongs to, or `(corpus)` for cross-file problems. */
  readonly file: string;
  /** Field path, heading name, or other locator within the file. */
  readonly field: string;
  readonly message: string;
}

/** Sort diagnostics by file, then field, then message. Stable and locale-free. */
export function sortDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort(
    (a, b) =>
      compareStrings(a.file, b.file) ||
      compareStrings(a.field, b.field) ||
      compareStrings(a.message, b.message),
  );
}
