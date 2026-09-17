#!/usr/bin/env node
/**
 * `navigator` command-line interface.
 *
 * Commands are added as their checkpoints complete; a command that is not yet
 * implemented fails loudly rather than pretending to succeed.
 */
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Database as DatabaseType } from 'better-sqlite3';
import { allJsonSchemas } from './json-schema.js';
import { projectPaths } from './paths.js';
import { atlasStatuses } from './atlas.js';
import { loadCorpus } from './validate.js';
import type { CorpusResult } from './validate.js';
import { compileCorpus } from './compile.js';
import { openDatabaseReadOnly } from './db.js';
import { getConceptById, getConceptBySlug, searchConcepts } from './query.js';
import { getConceptEvidence, getCoverageSummary, listBacklog, listCandidates } from './coverage.js';
import { compareStrings } from './normalize.js';

const USAGE = `navigator <command> [options]

Commands:
  schema [--out <dir>]    Write the concept, graph-only and atlas JSON Schemas
  validate                Validate the canonical corpus
  compile                 Compile the corpus into SQLite, graph JSON and sidebars
  inspect <concept-id>    Show one compiled concept
  search <query>          Search the compiled index

  coverage summary                        Counts for identities, atlas and backlog
  coverage candidates [--area <id>]       Atlas candidates, optionally filtered
                      [--category <id>]
                      [--status <status>]
  coverage unresolved [--blocking]        The grouped editorial backlog
  evidence <concept-id-or-slug>           Claim-level evidence for one concept

Options:
  --content <dir>         Override the canonical content directory
  --database <path>       Override the compiled database location
  --limit <n>             Maximum results (default 10 for search, 500 otherwise)
  --offset <n>            Skip this many coverage results
  --json                  Print stable JSON instead of readable text
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
    `  markdown:         ${String(result.coverage.conceptsByFormat.markdown)}`,
    `  graph only:       ${String(result.coverage.conceptsByFormat['graph-only'])}`,
    `categories:         ${String(categories.size)}`,
    `relationships:      ${String(relationships)}`,
    `internal links:     ${String(conceptLinks)}`,
    `distinct sources:   ${String(sourceIds.size)}`,
    `source citations:   ${String(sourceCitations)}`,
    `claims:             ${String(result.coverage.claims)}`,
    `unresolved refs:    ${String(result.coverage.unresolvedReferences)} in ${String(result.coverage.unresolvedGroups)} group(s), ${String(result.coverage.blockingUnresolvedReferences)} blocking`,
    `corpus hash:        ${result.corpusHash}`,
    '',
    // The atlas is editorial structure, reported apart from canonical
    // knowledge so a candidate is never mistaken for a concept.
    `atlas areas:        ${String(result.coverage.areas)}`,
    `atlas categories:   ${String(result.coverage.categories)} (${String(result.coverage.emptyCategories)} empty)`,
    `atlas candidates:   ${String(result.coverage.candidates)}`,
    ...atlasStatuses.map(
      (status) => `  ${status.padEnd(16)}  ${String(result.coverage.candidatesByStatus[status])}`,
    ),
    `atlas hash:         ${result.atlasHash}`,
  ];
  return lines.join('\n');
}

/**
 * Write every published JSON Schema: the concept frontmatter contract, the
 * graph-only identity contract and the atlas contract. `--out` names a
 * directory; without it they go to `schemas/`.
 */
async function commandSchema(args: readonly string[]): Promise<number> {
  const explicitOut = optionValue(args, '--out');
  const directory =
    explicitOut === undefined ? projectPaths().schemasDir : resolve(process.cwd(), explicitOut);
  for (const [name, contents] of Object.entries(allJsonSchemas()).sort(([a], [b]) =>
    compareStrings(a, b),
  )) {
    const target = join(directory, name);
    await writeFile(target, contents, 'utf8');
    console.log(`wrote ${target}`);
  }
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
  console.log(`  graph only:       ${String(stats.graphOnlyConcepts)}`);
  console.log(`unresolved refs:    ${String(stats.unresolvedReferences)}`);
  console.log(`claims:             ${String(stats.claims)}`);
  console.log(`claim evidence:     ${String(stats.claimEvidence)}`);
  console.log(`atlas areas:        ${String(stats.atlasAreas)}`);
  console.log(`atlas categories:   ${String(stats.atlasCategories)}`);
  console.log(`atlas candidates:   ${String(stats.atlasCandidates)}`);
  console.log(`corpus hash:        ${result.corpusHash}`);
  console.log(`atlas hash:         ${result.atlasHash}`);
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

/* -------------------------------------------------------------------------- */
/* Coverage (v2 runbook L06)                                                   */
/* -------------------------------------------------------------------------- */

function wantsJson(args: readonly string[]): boolean {
  return args.includes('--json');
}

/** Stable JSON: keys in insertion order, two-space indent, trailing newline. */
function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function numericOption(args: readonly string[], name: string): number | undefined {
  const raw = optionValue(args, name);
  if (raw === undefined) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : undefined;
}

function commandCoverageSummary(args: readonly string[]): number {
  return withDatabase(args, (db) => {
    const summary = getCoverageSummary(db);
    if (wantsJson(args)) {
      printJson(summary);
      return 0;
    }
    const lines = [
      'canonical identities',
      `  total               ${String(summary.concepts.total)}`,
      `  with an article     ${String(summary.concepts.withArticle)}`,
      ...Object.entries(summary.concepts.byTier).map(
        ([tier, n]) => `  tier ${tier}              ${String(n)}`,
      ),
      ...Object.entries(summary.concepts.byFormat).map(
        ([format, n]) => `  ${format.padEnd(18)}  ${String(n)}`,
      ),
      ...Object.entries(summary.concepts.byReviewState).map(
        ([state, n]) => `  ${state.padEnd(18)}  ${String(n)}`,
      ),
      '',
      'atlas (editorial, never evidence)',
      `  areas               ${String(summary.atlas.areas)}`,
      `  categories          ${String(summary.atlas.categories)} (${String(summary.atlas.emptyCategories)} empty)`,
      `  candidates          ${String(summary.atlas.candidates)}`,
      ...Object.entries(summary.atlas.byStatus).map(
        ([status, n]) => `  ${status.padEnd(18)}  ${String(n)}`,
      ),
      '',
      'editorial backlog',
      `  references          ${String(summary.backlog.references)}`,
      `  groups              ${String(summary.backlog.groups)}`,
      `  blocking            ${String(summary.backlog.blocking)}`,
      '',
      'evidence',
      `  claims              ${String(summary.evidence.claims)}`,
      ...Object.entries(summary.evidence.byStatus).map(
        ([status, n]) => `  ${status.padEnd(18)}  ${String(n)}`,
      ),
      `  locators            ${String(summary.evidence.locators)}`,
      `  concepts with claims ${String(summary.evidence.conceptsWithClaims)}`,
      '',
      `corpus hash  ${summary.corpusHash}`,
      `atlas hash   ${summary.atlasHash}`,
      `built at     ${summary.builtAt}`,
    ];
    console.log(lines.join('\n'));
    return 0;
  });
}

function commandCoverageCandidates(args: readonly string[]): number {
  const status = optionValue(args, '--status');
  if (status !== undefined && !(atlasStatuses as readonly string[]).includes(status)) {
    console.error(
      `navigator coverage candidates: unknown status "${status}". Use one of: ${atlasStatuses.join(', ')}`,
    );
    return 2;
  }
  return withDatabase(args, (db) => {
    const page = listCandidates(db, {
      areaId: optionValue(args, '--area'),
      categoryId: optionValue(args, '--category'),
      status,
      limit: numericOption(args, '--limit'),
      offset: numericOption(args, '--offset'),
    });
    if (wantsJson(args)) {
      printJson(page);
      return 0;
    }
    if (page.items.length === 0) {
      console.log('no candidate matches those filters');
      return 0;
    }
    console.log(
      `${String(page.items.length)} of ${String(page.total)} candidate(s)${page.truncated ? ' (truncated)' : ''}:\n`,
    );
    for (const candidate of page.items) {
      const covered =
        candidate.canonicalConceptId === null
          ? ''
          : `  ->  ${candidate.canonicalConceptId} (${candidate.canonicalSlug ?? ''})`;
      console.log(`  ${candidate.title}  [${candidate.status}]${covered}`);
      console.log(`    ${candidate.candidateId}`);
      console.log(`    ${candidate.categories.map((c) => c.path).join('; ')}`);
      if (candidate.note !== null) console.log(`    note: ${candidate.note}`);
      console.log('');
    }
    return 0;
  });
}

function commandCoverageUnresolved(args: readonly string[]): number {
  return withDatabase(args, (db) => {
    const page = listBacklog(db, {
      blockingOnly: args.includes('--blocking'),
      limit: numericOption(args, '--limit'),
      offset: numericOption(args, '--offset'),
    });
    if (wantsJson(args)) {
      printJson(page);
      return 0;
    }
    if (page.items.length === 0) {
      console.log('nothing is waiting on a missing concept');
      return 0;
    }
    console.log(
      `${String(page.items.length)} of ${String(page.total)} backlog item(s)${page.truncated ? ' (truncated)' : ''}:\n`,
    );
    for (const group of page.items) {
      console.log(
        `  ${group.label}${group.blocking ? '  [blocking]' : ''}  — ${String(group.sourceCount)} page(s) waiting`,
      );
      console.log(`    ${group.groupId}`);
      for (const source of group.sources) {
        console.log(`    from ${source.conceptTitle} (${source.conceptId}): ${source.reason}`);
      }
      if (group.proposedCategories.length > 0) {
        console.log(`    proposed: ${group.proposedCategories.join('; ')}`);
      }
      console.log('');
    }
    return 0;
  });
}

function commandCoverage(args: readonly string[]): number {
  const [subcommand, ...rest] = args;
  switch (subcommand) {
    case 'summary':
      return commandCoverageSummary(rest);
    case 'candidates':
      return commandCoverageCandidates(rest);
    case 'unresolved':
      return commandCoverageUnresolved(rest);
    default:
      console.error(
        `navigator coverage: unknown subcommand "${subcommand ?? ''}". Use summary, candidates or unresolved.`,
      );
      return 2;
  }
}

function commandEvidence(args: readonly string[]): number {
  const target = args.find((arg) => !arg.startsWith('--'));
  if (target === undefined) {
    console.error('navigator evidence: a concept id or slug is required\n\n' + USAGE);
    return 2;
  }
  return withDatabase(args, (db) => {
    // Accept either address, because a reader has a slug and an agent has an id.
    const bySlug = target.startsWith('/') ? getConceptBySlug(db, target) : undefined;
    const conceptId = bySlug?.id ?? target;
    const evidence = getConceptEvidence(db, conceptId);
    if (evidence === undefined) {
      console.error(`navigator evidence: no concept "${target}"`);
      return 1;
    }
    if (wantsJson(args)) {
      printJson(evidence);
      return 0;
    }
    console.log(`${evidence.title}  [${evidence.reviewState}]  tier ${String(evidence.tier)}`);
    console.log(`${evidence.conceptId}   ${evidence.slug}\n`);
    if (!evidence.hasClaimMapping) {
      console.log('This page has no claim-level evidence mapping yet.');
      console.log('Its sources are listed below, but no statement is tied to a locator.\n');
    }
    for (const claim of evidence.claims) {
      console.log(`  [${claim.status}] ${claim.section}`);
      console.log(`    ${claim.statement}`);
      for (const item of claim.evidence) {
        console.log(`      ${item.sourceId} — ${item.locator}`);
        if (item.note !== null) console.log(`        ${item.note}`);
      }
      if (claim.evidence.length === 0) console.log('      (no evidence, and marked unsupported)');
      console.log('');
    }
    console.log('sources:');
    for (const source of evidence.sources) {
      console.log(`  ${source.sourceId}  ${source.title}  (${String(source.claimCount)} claim(s))`);
      console.log(`    ${source.url}`);
      console.log(`    supports: ${source.supports.join(', ')}   checked ${source.checkedOn}`);
    }
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
    case 'coverage':
      return commandCoverage(args);
    case 'evidence':
      return commandEvidence(args);
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
