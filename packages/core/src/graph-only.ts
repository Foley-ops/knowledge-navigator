/**
 * Tier 3 graph-only identities (v2 runbook §4.2).
 *
 * A graph-only identity is a stable canonical address — an id, a slug, a title,
 * aliases, categories and typed relationships — with no article behind it. It
 * exists so the graph can name something honestly before anyone has written
 * about it, and so a later promotion to Tier 2 can keep the same id and slug.
 *
 * Identity rules are NOT restated here. The file is validated with exactly the
 * same `conceptFrontmatterSchema` a Markdown page uses, narrowed to tier 3, so
 * a rule can never hold for one format and not the other. What this module adds
 * is the storage contract: one YAML document, no Markdown body, and a file name
 * derived from the slug.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import { compareStrings, slugName } from './normalize.js';
import { conceptFrontmatterSchema } from './schema.js';
import type { FieldIssue } from './schema.js';
import type { LoadedConcept } from './loader.js';

/**
 * The §4.2 contract: the concept frontmatter contract with `tier` pinned to 3.
 *
 * Pinning happens after the shared schema has run, so a Tier 3 file still gets
 * every identity diagnostic a page would get, and additionally learns that
 * `content/graph-only/` is only for tier 3.
 */
export const graphOnlyIdentitySchema = conceptFrontmatterSchema.superRefine((value, ctx) => {
  if (value.tier !== 3) {
    ctx.addIssue({
      code: 'custom',
      path: ['tier'],
      message: `a graph-only identity must be tier 3; tier ${String(value.tier)} belongs in content/concepts as Markdown`,
    });
  }
});

export type GraphOnlyIdentity = z.infer<typeof graphOnlyIdentitySchema>;

/** Validate an unknown value against the graph-only identity contract. */
export function parseGraphOnlyIdentity(input: unknown): {
  readonly ok: boolean;
  readonly value: GraphOnlyIdentity | undefined;
  readonly issues: readonly FieldIssue[];
} {
  const result = graphOnlyIdentitySchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data, issues: [] };

  const issues: FieldIssue[] = [];
  for (const issue of result.error.issues) {
    const prefix = issue.path.map((segment) => String(segment));
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        issues.push({
          path: [...prefix, key].join('.'),
          message:
            key === 'body'
              ? 'a graph-only identity has no body: it is a stable identity, not an article. Promote it to Tier 2 Markdown to write prose.'
              : `unknown key "${key}" is not part of the graph-only identity contract`,
        });
      }
      continue;
    }
    issues.push({
      path: prefix.length > 0 ? prefix.join('.') : '(root)',
      message: issue.message,
    });
  }
  issues.sort((a, b) =>
    a.path === b.path ? compareStrings(a.message, b.message) : compareStrings(a.path, b.path),
  );
  return { ok: false, value: undefined, issues };
}

/** The file name a given slug requires, e.g. `/concepts/mamba` → `mamba.yaml`. */
export function graphOnlyFileName(slug: string): string {
  return `${slugName(slug)}.yaml`;
}

export type GraphOnlyLoadResult =
  | { readonly ok: true; readonly identity: LoadedConcept; readonly issues: readonly FieldIssue[] }
  | { readonly ok: false; readonly identity: undefined; readonly issues: readonly FieldIssue[] };

/**
 * A second YAML document, or Markdown after a `---` separator, is a body in
 * disguise. Refuse it rather than silently reading only the first document.
 */
const EXTRA_DOCUMENT = /^(---|\.\.\.)[ \t]*$/m;

/** Load a graph-only identity from in-memory YAML. */
export function loadGraphOnlyFromText(text: string, fileName: string): GraphOnlyLoadResult {
  const normalized = text.replace(/\r\n/g, '\n');
  const contentHash = createHash('sha256').update(normalized, 'utf8').digest('hex');

  // A leading `---` is a legal YAML document start marker; anything beyond that
  // means a second document or a Markdown body.
  const afterLeadingMarker = normalized.replace(/^---[ \t]*\n/, '');
  if (EXTRA_DOCUMENT.test(afterLeadingMarker)) {
    return {
      ok: false,
      identity: undefined,
      issues: [
        {
          path: '(file)',
          message:
            'a graph-only identity is exactly one YAML document with no Markdown body; found a second document or a body after a "---" separator',
        },
      ],
    };
  }

  let raw: unknown;
  try {
    raw = parseYaml(normalized, {
      version: '1.2',
      schema: 'core',
      maxAliasCount: 0,
      uniqueKeys: true,
      prettyErrors: true,
    });
  } catch (error) {
    return {
      ok: false,
      identity: undefined,
      issues: [
        {
          path: '(yaml)',
          message: `YAML could not be parsed: ${
            error instanceof Error ? (error.message.split('\n')[0] ?? error.message) : String(error)
          }`,
        },
      ],
    };
  }

  if (raw === null || raw === undefined) {
    return {
      ok: false,
      identity: undefined,
      issues: [{ path: '(yaml)', message: 'the file is empty' }],
    };
  }

  const parsed = parseGraphOnlyIdentity(raw);
  if (!parsed.ok || parsed.value === undefined) {
    return { ok: false, identity: undefined, issues: parsed.issues };
  }

  return {
    ok: true,
    issues: [],
    identity: {
      fileName,
      absolutePath: fileName,
      format: 'graph-only',
      frontmatter: parsed.value,
      body: '',
      plainText: '',
      headings: [],
      links: [],
      rawHtml: [],
      contentHash,
    },
  };
}

/** Load a graph-only identity from disk. */
export async function loadGraphOnlyFile(
  absolutePath: string,
  fileName: string,
): Promise<GraphOnlyLoadResult> {
  let text: string;
  try {
    text = await readFile(absolutePath, 'utf8');
  } catch (error) {
    return {
      ok: false,
      identity: undefined,
      issues: [
        {
          path: '(file)',
          message: `could not be read: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  const result = loadGraphOnlyFromText(text, fileName);
  if (!result.ok) return result;
  return { ok: true, issues: [], identity: { ...result.identity, absolutePath } };
}
