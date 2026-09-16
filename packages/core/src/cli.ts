#!/usr/bin/env node
/**
 * `navigator` command-line interface.
 *
 * Commands are added as their checkpoints complete; a command that is not yet
 * implemented fails loudly rather than pretending to succeed.
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serializeConceptJsonSchema } from './json-schema.js';
import { projectPaths } from './paths.js';
import { loadCorpus } from './validate.js';
import type { CorpusResult } from './validate.js';
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

async function main(argv: readonly string[]): Promise<number> {
  const [command, ...args] = argv;
  switch (command) {
    case 'schema':
      return commandSchema(args);
    case 'validate':
      return commandValidate(args);
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
