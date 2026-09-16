#!/usr/bin/env node
/**
 * `navigator` command-line interface.
 *
 * Commands are added as their checkpoints complete; a command that is not yet
 * implemented fails loudly rather than pretending to succeed.
 */
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Database as DatabaseType } from 'better-sqlite3';
import { serializeConceptJsonSchema } from './json-schema.js';
import { projectPaths } from './paths.js';
import { loadCorpus } from './validate.js';
import type { CorpusResult } from './validate.js';
import { compileCorpus } from './compile.js';
import { openDatabaseReadOnly } from './db.js';
import { getConceptById, getConceptBySlug, searchConcepts } from './query.js';
import { compareStrings } from './normalize.js';

const USAGE = `navigator <command> [options]

Commands:
  schema [--out <path>]   Write the canonical concept JSON Schema
  validate                Validate the canonical corpus
  compile                 Compile the corpus into SQLite, graph JSON and sidebars
  inspect <concept-id>    Show one compiled concept
  search <query>          Search the compiled index

Options:
  --content <dir>         Override the canonical content directory
  --database <path>       Override the compiled database location
  --limit <n>             Maximum search results (1-50, default 10)
`;

function optionValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function contentDir(args: readonly string[]): string {
  const override = optionValue(args, '--content');
  return override === undefined ? projectPaths().contentDir : resolve(process.cwd(), override);
}

/** Counts a human reads to confirm the corpus is what they expect. */
export function summarizeCorpus(result: CorpusResult): string {
  const tiers = new Map<number, number>();
  const reviewStates = new Map<string, number>();
  const sourceIds = new Set<string>();
  const categories = new Set<string>();
  let relationships = 0;
  let conceptLinks = 0;
  let sourceCitations = 0;

  for (const concept of result.concepts) {
    const { frontmatter: fm } = concept;
    tiers.set(fm.tier, (tiers.get(fm.tier) ?? 0) + 1);
    reviewStates.set(fm.review_state, (reviewStates.get(fm.review_state) ?? 0) + 1);
    relationships += fm.relationships.length;
    sourceCitations += fm.sources.length;
    for (const source of fm.sources) sourceIds.add(source.source_id);
    for (const category of fm.categories) categories.add(category);
    conceptLinks += concept.links.filter((link) => link.url.startsWith('.')).length;
  }

  const lines = [
    `concepts:           ${String(result.concepts.length)}`,
    ...[...tiers.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([tier, count]) => `  tier ${String(tier)}:          ${String(count)}`),
    ...[...reviewStates.entries()]
      .sort((a, b) => compareStrings(a[0], b[0]))
      .map(([state, count]) => `  ${state.padEnd(16)}  ${String(count)}`),
    `categories:         ${String(categories.size)}`,
    `relationships:      ${String(relationships)}`,
    `internal links:     ${String(conceptLinks)}`,
    `distinct sources:   ${String(sourceIds.size)}`,
    `source citations:   ${String(sourceCitations)}`,
    `corpus hash:        ${result.corpusHash}`,
  ];
  return lines.join('\n');
}

async function commandSchema(args: readonly string[]): Promise<number> {
  const explicitOut = optionValue(args, '--out');
  const target =
    explicitOut === undefined
      ? projectPaths().conceptJsonSchema
      : resolve(process.cwd(), explicitOut);
  await writeFile(target, serializeConceptJsonSchema(), 'utf8');
  console.log(`wrote ${target}`);
  return 0;
}

async function commandValidate(args: readonly string[]): Promise<number> {
  const dir = contentDir(args);
  const result = await loadCorpus(dir);
  if (!result.ok) {
    console.error(`${String(result.diagnostics.length)} problem(s) in ${dir}:\n`);
    for (const diagnostic of result.diagnostics) {
      console.error(`  ${diagnostic.file}  ${diagnostic.field}\n      ${diagnostic.message}`);
    }
    console.error('');
    return 1;
  }
  console.log(`validated ${dir}\n`);
  console.log(summarizeCorpus(result));
  console.log('\n0 errors');
  return 0;
}

async function commandCompile(args: readonly string[]): Promise<number> {
  const paths = projectPaths();
  const databaseOverride = optionValue(args, '--database');
  const result = await compileCorpus({
    contentDir: contentDir(args),
    databasePath:
      databaseOverride === undefined
        ? (process.env['DATABASE_PATH'] ?? paths.defaultDatabase)
        : resolve(process.cwd(), databaseOverride),
    graphJsonPath: paths.graphJson,
    sidebarsPath: paths.generatedSidebars,
  });
  if (!result.ok) {
    console.error(`compilation failed with ${String(result.diagnostics.length)} problem(s):\n`);
    for (const diagnostic of result.diagnostics) {
      console.error(`  ${diagnostic.file}  ${diagnostic.field}\n      ${diagnostic.message}`);
    }
    return 1;
  }
  const { stats } = result;
  console.log('compiled the canonical corpus\n');
  console.log(`concepts:           ${String(stats.concepts)}`);
  console.log(`names indexed:      ${String(stats.aliases)}`);
  console.log(`categories:         ${String(stats.categories)}`);
  console.log(`category links:     ${String(stats.conceptCategories)}`);
  console.log(`relationships:      ${String(stats.relationships)}`);
  console.log(`sources:            ${String(stats.sources)}`);
  console.log(`source citations:   ${String(stats.conceptSources)}`);
  console.log(`full-text rows:     ${String(stats.ftsRows)}`);
  console.log(`corpus hash:        ${result.corpusHash}`);
  console.log(`built at:           ${result.builtAt}`);
  console.log('\nwrote:');
  for (const output of result.outputs) console.log(`  ${output}`);
  return 0;
}

function resolveDatabasePath(args: readonly string[]): string {
  const override = optionValue(args, '--database');
  if (override !== undefined) return resolve(process.cwd(), override);
  return process.env['DATABASE_PATH'] ?? projectPaths().defaultDatabase;
}

function withDatabase<T>(args: readonly string[], run: (db: DatabaseType) => T): T {
  const path = resolveDatabasePath(args);
  if (!existsSync(path)) {
    throw new Error(
      `no compiled index at ${path}. Run \`npm run compile\` first, or pass --database <path>.`,
    );
  }
  const db = openDatabaseReadOnly(path);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

function commandInspect(args: readonly string[]): number {
  const conceptId = args.find((arg) => !arg.startsWith('--'));
  if (conceptId === undefined) {
    console.error('navigator inspect: a concept id or slug is required\n\n' + USAGE);
    return 2;
  }
  return withDatabase(args, (db) => {
    const concept =
      getConceptById(db, conceptId) ??
      getConceptBySlug(db, conceptId.startsWith('/') ? conceptId : `/concepts/${conceptId}`);
    if (concept === undefined) {
      console.error(`navigator inspect: no concept "${conceptId}"`);
      return 1;
    }
    const lines = [
      concept.title,
      '='.repeat(concept.title.length),
      '',
      `id:            ${concept.id}`,
      `slug:          ${concept.slug}`,
      `kind:          ${concept.kind}`,
      `tier:          ${String(concept.tier)}`,
      `review state:  ${concept.reviewState}`,
      `source file:   ${concept.sourcePath}`,
      `content hash:  ${concept.contentHash}`,
      '',
      `summary:       ${concept.summary}`,
    ];
    if (concept.aliases.length > 0) {
      lines.push('', `aliases:       ${concept.aliases.join(', ')}`);
    }
    lines.push('', 'categories:');
    for (const category of concept.categories) {
      lines.push(`  ${category.isPrimary ? '*' : ' '} ${category.path}`);
    }
    lines.push('', 'relationships:');
    if (concept.relationships.length === 0) lines.push('  (none)');
    for (const relationship of concept.relationships) {
      const arrow = relationship.direction === 'outgoing' ? '->' : '<-';
      lines.push(
        `  ${arrow} ${relationship.type.padEnd(16)} ${relationship.otherTitle} (${relationship.otherId})`,
      );
      if (relationship.condition !== null) lines.push(`       when: ${relationship.condition}`);
      if (relationship.note !== null) lines.push(`       note: ${relationship.note}`);
    }
    lines.push('', 'sources:');
    if (concept.sources.length === 0) lines.push('  (none)');
    for (const source of concept.sources) {
      lines.push(`  ${source.title}`);
      lines.push(`       ${source.url}`);
      lines.push(
        `       ${source.sourceKind}; supports ${source.supports.join(', ')}; checked ${source.checkedOn}`,
      );
    }
    console.log(lines.join('\n'));
    return 0;
  });
}

function commandSearch(args: readonly string[]): number {
  const terms: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (arg.startsWith('--')) {
      i += 1;
      continue;
    }
    terms.push(arg);
  }
  const query = terms.join(' ');
  if (query.trim() === '') {
    console.error('navigator search: a query is required\n\n' + USAGE);
    return 2;
  }
  const limitOption = optionValue(args, '--limit');
  const limit = limitOption === undefined ? 10 : Number.parseInt(limitOption, 10);

  return withDatabase(args, (db) => {
    let hits;
    try {
      hits = searchConcepts(db, query, Number.isFinite(limit) ? limit : 10);
    } catch (error) {
      console.error(`navigator search: ${error instanceof Error ? error.message : String(error)}`);
      return 2;
    }
    if (hits.length === 0) {
      console.log(`no concept matches "${query}"`);
      return 0;
    }
    console.log(`${String(hits.length)} result(s) for "${query}":\n`);
    for (const hit of hits) {
      console.log(`  ${hit.title}  [${hit.matchKind}]`);
      console.log(`    ${hit.slug}   ${hit.conceptId}`);
      console.log(`    ${hit.rankExplanation}`);
      console.log(`    ${hit.summary}`);
      console.log('');
    }
    return 0;
  });
}

async function main(argv: readonly string[]): Promise<number> {
  const [command, ...args] = argv;
  switch (command) {
    case 'schema':
      return commandSchema(args);
    case 'validate':
      return commandValidate(args);
    case 'compile':
      return commandCompile(args);
    case 'inspect':
      return commandInspect(args);
    case 'search':
      return commandSearch(args);
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      console.log(USAGE);
      return 0;
    default:
      console.error(`navigator: unknown command "${command}"\n\n${USAGE}`);
      return 2;
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
