/**
 * Generate `apps/web/sidebars.generated.ts` (runbook D06).
 *
 * One concept can belong to several categories without being duplicated as a
 * page: its *primary* category holds the canonical `doc` entry and every other
 * category holds a `ref` entry pointing at the same document. Tier 3 concepts
 * are omitted from reader navigation entirely.
 *
 * Output is deterministic — categories and entries are sorted by their explicit
 * labels — so regenerating without a content change produces no diff.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { compareStrings } from './normalize.js';

interface Entry {
  readonly type: 'doc' | 'ref';
  readonly id: string;
  readonly label: string;
}

interface CategoryNode {
  readonly path: string;
  readonly label: string;
  readonly children: Map<string, CategoryNode>;
  readonly entries: Entry[];
}

function emptyNode(path: string, label: string): CategoryNode {
  return { path, label, children: new Map(), entries: [] };
}

/** Docusaurus derives a document id from its file name; so do we. */
export function documentId(fileName: string): string {
  return fileName.replace(/\.md$/, '');
}

function ensureBranch(root: CategoryNode, path: string): CategoryNode {
  let node = root;
  let prefix = '';
  for (const segment of path.split('/')) {
    prefix = prefix === '' ? segment : `${prefix}/${segment}`;
    let child = node.children.get(segment);
    if (child === undefined) {
      child = emptyNode(prefix, segment);
      node.children.set(segment, child);
    }
    node = child;
  }
  return node;
}

function renderEntries(entries: readonly Entry[], indent: string): string[] {
  return [...entries]
    .sort((a, b) => compareStrings(a.label, b.label) || compareStrings(a.id, b.id))
    .map(
      (entry) =>
        `${indent}{ type: '${entry.type}', id: ${JSON.stringify(entry.id)}, label: ${JSON.stringify(entry.label)} },`,
    );
}

function renderNode(node: CategoryNode, depth: number): string[] {
  const indent = '  '.repeat(depth + 2);
  const inner = '  '.repeat(depth + 3);
  const children = [...node.children.values()].sort((a, b) => compareStrings(a.label, b.label));
  const lines: string[] = [
    `${indent}{`,
    `${inner}type: 'category',`,
    `${inner}label: ${JSON.stringify(node.label)},`,
    `${inner}collapsed: ${depth > 0 ? 'true' : 'false'},`,
    `${inner}items: [`,
  ];
  for (const child of children) lines.push(...renderNode(child, depth + 2));
  lines.push(...renderEntries(node.entries, '  '.repeat(depth + 4)));
  lines.push(`${inner}],`, `${indent}},`);
  return lines;
}

/** Build the sidebar file's contents from a compiled database. */
export function buildSidebars(db: DatabaseType): string {
  const rows = db
    .prepare(
      `SELECT c.id, c.title, c.file_name, c.tier, cat.path AS category_path, cc.is_primary
         FROM concepts c
         JOIN concept_categories cc ON cc.concept_id = c.id
         JOIN categories cat ON cat.id = cc.category_id
        WHERE c.tier < 3
        ORDER BY cat.path, c.title, c.id`,
    )
    .all() as {
    id: string;
    title: string;
    file_name: string;
    tier: number;
    category_path: string;
    is_primary: number;
  }[];

  const root = emptyNode('', '');
  for (const row of rows) {
    ensureBranch(root, row.category_path).entries.push({
      type: row.is_primary === 1 ? 'doc' : 'ref',
      id: documentId(row.file_name),
      label: row.title,
    });
  }

  const top = [...root.children.values()].sort((a, b) => compareStrings(a.label, b.label));
  const body = top.length === 0 ? [] : top.flatMap((node) => renderNode(node, 0));

  return [
    '// GENERATED FILE — do not edit by hand.',
    '// Written by `navigator compile` from canonical content in content/concepts/.',
    '//',
    '// A concept appears once as a canonical `doc` entry under its primary',
    '// category and as a `ref` entry under every other category it belongs to,',
    '// so one page can be reached through several categories without becoming',
    '// several pages. Tier 3 concepts are omitted from reader navigation.',
    "import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';",
    '',
    'const sidebars: SidebarsConfig = {',
    '  conceptsSidebar: [',
    ...body,
    '  ],',
    '};',
    '',
    'export default sidebars;',
    '',
  ].join('\n');
}
