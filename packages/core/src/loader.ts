/**
 * Load one canonical Markdown concept file (runbook C02).
 *
 * Markdown, YAML and any embedded HTML are treated strictly as untrusted data.
 * Nothing here evaluates content: no MDX import is resolved, no code is run, no
 * template engine sees the file, and YAML aliases are refused outright so a
 * hostile or corrupted file cannot expand into an enormous document.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mathFromMarkdown } from 'mdast-util-math';
import { toString as mdastToString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';
import { math } from 'micromark-extension-math';
import type { Nodes, Parents, Root } from 'mdast';
import { parseFrontmatter } from './schema.js';
import type { ConceptFrontmatter, FieldIssue } from './schema.js';

export interface Heading {
  readonly depth: number;
  readonly text: string;
}

export interface MarkdownLink {
  readonly url: string;
  readonly text: string;
  readonly line: number;
}

export interface LoadedConcept {
  /** Path relative to the content directory, e.g. `convolution.md`. */
  readonly fileName: string;
  readonly absolutePath: string;
  readonly frontmatter: ConceptFrontmatter;
  /** Markdown body exactly as written, with the frontmatter block removed. */
  readonly body: string;
  /** Human-readable prose extracted from the body, for full-text search. */
  readonly plainText: string;
  readonly headings: readonly Heading[];
  readonly links: readonly MarkdownLink[];
  /** Raw HTML blocks found in the body. Canonical content must contain none. */
  readonly rawHtml: readonly string[];
  /** SHA-256 of the whole file, newline-normalised so it is platform-stable. */
  readonly contentHash: string;
}

export type LoadResult =
  | { readonly ok: true; readonly concept: LoadedConcept; readonly issues: readonly FieldIssue[] }
  | { readonly ok: false; readonly concept: undefined; readonly issues: readonly FieldIssue[] };

const FRONTMATTER_DELIMITER = /^---[ \t]*\r?\n/;

interface Split {
  readonly yaml: string;
  readonly body: string;
}

/** Separate the leading `---` YAML block from the Markdown body. */
function splitFrontmatter(text: string): Split | undefined {
  if (!FRONTMATTER_DELIMITER.test(text)) return undefined;
  const firstBreak = text.indexOf('\n');
  const rest = text.slice(firstBreak + 1);
  const closing = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (!closing || closing.index === undefined) return undefined;
  return {
    yaml: rest.slice(0, closing.index),
    body: rest.slice(closing.index + closing[0].length),
  };
}

function isParent(node: Nodes): node is Parents {
  return 'children' in node && Array.isArray(node.children);
}

/** Text of a node, or an empty string for notation and raw markup. */
function nodeText(node: Nodes): string {
  if (node.type === 'math' || node.type === 'inlineMath' || node.type === 'html') return '';
  return mdastToString(node);
}

interface Extracted {
  readonly plainText: string;
  readonly headings: Heading[];
  readonly links: MarkdownLink[];
  readonly rawHtml: string[];
}

/** Walk the parsed document once, collecting everything callers need. */
function extract(tree: Root): Extracted {
  const pieces: string[] = [];
  const headings: Heading[] = [];
  const links: MarkdownLink[] = [];
  const rawHtml: string[] = [];

  const walk = (node: Nodes): void => {
    switch (node.type) {
      case 'heading':
        headings.push({ depth: node.depth, text: nodeText(node) });
        pieces.push(nodeText(node));
        return;
      case 'html':
        rawHtml.push(node.value);
        return;
      case 'math':
      case 'inlineMath':
        // Notation, not prose. Excluded from the searchable body so that LaTeX
        // control words never become search tokens.
        return;
      case 'code':
      case 'text':
      case 'inlineCode':
        pieces.push(node.value);
        return;
      case 'link':
        links.push({
          url: node.url,
          text: nodeText(node),
          line: node.position?.start.line ?? 0,
        });
        break;
      default:
        break;
    }
    if (isParent(node)) {
      for (const child of node.children) walk(child);
    }
  };

  walk(tree);

  const plainText = pieces
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return { plainText, headings, links, rawHtml };
}

/** Parse a Markdown document without evaluating any of it. */
export function parseMarkdownBody(body: string): Extracted {
  const tree = fromMarkdown(body, {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  });
  return extract(tree);
}

/** Load a concept from in-memory text. `fileName` is used only in diagnostics. */
export function loadConceptFromText(text: string, fileName: string): LoadResult {
  const normalized = text.replace(/\r\n/g, '\n');
  const contentHash = createHash('sha256').update(normalized, 'utf8').digest('hex');
  const absolutePath = fileName;

  const split = splitFrontmatter(normalized);
  if (!split) {
    return {
      ok: false,
      concept: undefined,
      issues: [
        {
          path: '(frontmatter)',
          message:
            'the file must begin with a YAML frontmatter block delimited by --- on its own line',
        },
      ],
    };
  }

  let raw: unknown;
  try {
    raw = parseYaml(split.yaml, {
      version: '1.2',
      schema: 'core',
      // Refuse alias expansion outright: canonical content never needs it and
      // it is the classic amplification vector in untrusted YAML.
      maxAliasCount: 0,
      uniqueKeys: true,
      prettyErrors: true,
    });
  } catch (error) {
    return {
      ok: false,
      concept: undefined,
      issues: [
        {
          path: '(frontmatter)',
          message: `YAML could not be parsed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
        },
      ],
    };
  }

  if (raw === null || raw === undefined) {
    return {
      ok: false,
      concept: undefined,
      issues: [{ path: '(frontmatter)', message: 'the frontmatter block is empty' }],
    };
  }

  const parsed = parseFrontmatter(raw);
  if (!parsed.ok || parsed.value === undefined) {
    return { ok: false, concept: undefined, issues: parsed.issues };
  }

  const extracted = parseMarkdownBody(split.body);
  return {
    ok: true,
    issues: [],
    concept: {
      fileName,
      absolutePath,
      frontmatter: parsed.value,
      body: split.body,
      plainText: extracted.plainText,
      headings: extracted.headings,
      links: extracted.links,
      rawHtml: extracted.rawHtml,
      contentHash,
    },
  };
}

/** Load a concept from disk. */
export async function loadConceptFile(absolutePath: string, fileName: string): Promise<LoadResult> {
  let text: string;
  try {
    text = await readFile(absolutePath, 'utf8');
  } catch (error) {
    return {
      ok: false,
      concept: undefined,
      issues: [
        {
          path: '(file)',
          message: `could not be read: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  const result = loadConceptFromText(text, fileName);
  if (!result.ok) return result;
  return { ok: true, issues: [], concept: { ...result.concept, absolutePath } };
}
