#!/usr/bin/env node
/**
 * `navigator` command-line interface.
 *
 * Commands are added as their checkpoints complete; a command that is not yet
 * implemented fails loudly rather than pretending to succeed.
 */
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
import Database from 'better-sqlite3';
import { exportFileName, renderSavedItemMarkdown } from './export.js';
import { PROPOSAL_FILES, ProposalError, serializeProposalManifest } from './proposal.js';
import { findProposalTarget, prepareProposal, slugNameFromLabel } from './proposal-request.js';
import { validateProposal, writeProposalValidation } from './proposal-validate.js';
import { acceptProposal, rejectProposal } from './proposal-accept.js';
import { importHermesResult } from './proposal-import.js';
import {
  ARCHIVE_FILES,
  archiveRecordCount,
  readPersonalArchive,
  recordExport,
  renderPersonalSummary,
  serializePersonalArchive,
} from './personal-archive.js';
import {
  PersonalImportError,
  applyPersonalImport,
  openPersonalForImport,
  parsePersonalArchive,
  planPersonalImport,
} from './personal-import.js';

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

  proposal prepare <backlog-id>           Write a bounded agent brief into
                   --tier 2|3             .navigator/proposals/<proposal-id>/
                   [--name <slug-tail>]
                   [--category <id>]
                   [--out <dir>]
  proposal validate <proposal-dir>        Check a proposal before a human reads it
  proposal import-hermes <proposal-id>    Bring an agent's worktree back into the
                        --worktree <path> bundle and validate it
  proposal accept <proposal-id>           Apply a reviewed proposal to a new
                  --confirm <proposal-id> branch, leaving it uncommitted
                  [--dry-run]
  proposal reject <proposal-id>           Record a refusal, applying nothing
                  --confirm <proposal-id>
                  --reason <text>

  personal export [--output <dir>]        Write a versioned archive of your own
                  [--allow-external-output] private work, and a summary to read
  personal import <archive.json>          Restore private work. Shows what it
                  [--confirm-import]      would do unless you confirm.

  export saved <saved-item-id>            Write one saved comparison or path to
                      [--out <dir>]       .navigator/exports/ as Markdown
                      [--personal <path>]
                      [--site <url>]
                      [--stdout]
  export list [--project <id>]            Saved comparisons and paths, with ids

Options:
  --content <dir>         Override the canonical content directory
  --database <path>       Override the compiled database location
  --limit <n>             Maximum results (default 10 for search, 500 otherwise)
  --offset <n>            Skip this many coverage results
  --json                  Print stable JSON instead of readable text
  --personal <path>       Override the private database location
  --out <dir>             Write an export somewhere other than .navigator/exports
  --site <url>            Base URL for canonical links in an export
  --stdout                Print an export instead of writing a file
  --tier <2|3>            The coverage tier a proposal asks for
  --name <slug-tail>      Override the address derived from a label
  --category <id>         Choose the atlas category when a target has several
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

/* -------------------------------------------------------------------------- */
/* Export (v2 runbook Q07)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The private database, which the command line opens read-only.
 *
 * This is the one place outside the API that touches a researcher's own
 * records, and it only ever reads them. Export writes exactly one file, under
 * `.navigator/exports` unless told otherwise, and never touches canonical
 * content.
 */
function resolvePersonalPath(args: readonly string[]): string {
  const override = optionValue(args, '--personal');
  if (override !== undefined) return resolve(process.cwd(), override);
  return process.env['PERSONAL_DATABASE_PATH'] ?? join(projectPaths().dataDir, 'personal.db');
}

interface SavedRow {
  id: string;
  project_id: string;
  item_type: string;
  label: string;
  payload: string;
  created_at: string;
}

function withPersonal<T>(args: readonly string[], run: (db: DatabaseType) => T): T {
  const path = resolvePersonalPath(args);
  if (!existsSync(path)) {
    throw new Error(
      `no private database at ${path}. Start the product and save something first, or pass --personal <path>.`,
    );
  }
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return run(db);
  } finally {
    db.close();
  }
}

function commandExportList(args: readonly string[]): number {
  return withPersonal(args, (db) => {
    const project = optionValue(args, '--project');
    const rows = (
      project === undefined
        ? db
            .prepare(
              `SELECT id, project_id, item_type, label, payload, created_at FROM saved_items
                WHERE item_type IN ('comparison', 'path') AND archived_at IS NULL
                ORDER BY created_at DESC, id`,
            )
            .all()
        : db
            .prepare(
              `SELECT id, project_id, item_type, label, payload, created_at FROM saved_items
                WHERE item_type IN ('comparison', 'path') AND archived_at IS NULL AND project_id = ?
                ORDER BY created_at DESC, id`,
            )
            .all(project)
    ) as SavedRow[];

    if (wantsJson(args)) {
      printJson(
        rows.map((row) => ({
          id: row.id,
          projectId: row.project_id,
          itemType: row.item_type,
          label: row.label,
          createdAt: row.created_at,
        })),
      );
      return 0;
    }

    if (rows.length === 0) {
      console.log('nothing saved that can be exported as Markdown');
      return 0;
    }
    console.log(`${String(rows.length)} exportable item(s):\n`);
    for (const row of rows) {
      console.log(`  ${row.id}  ${row.item_type.padEnd(10)}  ${row.label}`);
      console.log(`    saved ${row.created_at}  project ${row.project_id}`);
      console.log('');
    }
    return 0;
  });
}

async function commandExportSaved(args: readonly string[]): Promise<number> {
  const id = args.find((arg) => !arg.startsWith('--'));
  if (id === undefined) {
    console.error('navigator export saved: a saved item id is required\n\n' + USAGE);
    return 2;
  }

  const row = withPersonal(args, (db) => {
    return db
      .prepare(
        `SELECT id, project_id, item_type, label, payload, created_at
           FROM saved_items WHERE id = ?`,
      )
      .get(id) as SavedRow | undefined;
  });

  if (row === undefined) {
    console.error(
      `navigator export saved: no saved item ${id}. Run \`navigator export list\` to see what there is.`,
    );
    return 2;
  }

  let markdown: string;
  try {
    markdown = renderSavedItemMarkdown(row.item_type, JSON.parse(row.payload), {
      ...(optionValue(args, '--site') === undefined
        ? {}
        : { siteUrl: optionValue(args, '--site') }),
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `navigator export saved: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 2;
  }

  if (args.includes('--stdout')) {
    process.stdout.write(markdown);
    return 0;
  }

  const outDir =
    optionValue(args, '--out') === undefined
      ? projectPaths().exportsDir
      : resolve(process.cwd(), optionValue(args, '--out') ?? '.');
  await mkdir(outDir, { recursive: true });
  const file = join(
    outDir,
    exportFileName(row.item_type === 'path' ? 'path' : 'comparison', row.label, row.id),
  );
  await writeFile(file, markdown, 'utf8');
  console.log(`wrote ${file}`);
  return 0;
}

async function commandExport(args: readonly string[]): Promise<number> {
  const [subcommand, ...rest] = args;
  switch (subcommand) {
    case 'saved':
      return commandExportSaved(rest);
    case 'list':
      return commandExportList(rest);
    default:
      console.error(`navigator export: unknown subcommand "${subcommand ?? ''}"\n\n${USAGE}`);
      return 2;
  }
}

/* -------------------------------------------------------------------------- */
/* Proposals (v2 runbook R01)                                                  */
/* -------------------------------------------------------------------------- */

function proposalsDir(): string {
  return join(projectPaths().navigatorDir, 'proposals');
}

/**
 * The commit a proposal is written against: whatever HEAD is right now.
 *
 * A proposal without a base commit cannot be validated or accepted, so there is
 * no useful fallback here. Preparing one is something you do in the repository,
 * not inside a container image that has no history to point at.
 */
function headCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectPaths().root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new ProposalError(
      'this is not a git checkout, so a proposal cannot record the commit it was written against',
      [
        'prepare proposals in the repository itself',
        'a container image carries the content but not its history',
      ],
    );
  }
}

/**
 * A readable, unique proposal id.
 *
 * The date and the address make it recognisable in a directory listing months
 * later; the counter only appears when two proposals for the same thing are
 * prepared on one day, which is exactly when a reader needs to tell them apart.
 */
function nextProposalId(baseDir: string, createdAt: string, slugTail: string): string {
  const day = createdAt.slice(0, 10).replace(/-/g, '');
  const base = `p-${day}-${slugTail}`;
  let candidate = base;
  let counter = 2;
  while (existsSync(join(baseDir, candidate))) {
    candidate = `${base}-${String(counter)}`;
    counter += 1;
  }
  return candidate;
}

async function commandProposalPrepare(args: readonly string[]): Promise<number> {
  const targetId = args.find((arg) => !arg.startsWith('--'));
  if (targetId === undefined) {
    console.error('navigator proposal prepare: a backlog or candidate id is required\n\n' + USAGE);
    return 2;
  }
  const tierText = optionValue(args, '--tier');
  if (tierText !== '2' && tierText !== '3') {
    console.error(
      'navigator proposal prepare: --tier 2 or --tier 3 is required. Tier 1 is a full article and is never delegated.',
    );
    return 2;
  }
  const tier = tierText === '2' ? 2 : 3;

  const name = optionValue(args, '--name');
  const category = optionValue(args, '--category');
  const outOverride = optionValue(args, '--out');
  const baseDir = outOverride === undefined ? proposalsDir() : resolve(process.cwd(), outOverride);

  // The index is read and closed before anything is written: `withDatabase`
  // closes synchronously, so an await inside it would run against a shut handle.
  let outcome: {
    prepared: ReturnType<typeof prepareProposal>;
    proposalId: string;
    createdAt: string;
  };
  try {
    outcome = withDatabase(args, (db) => {
      const target = findProposalTarget(db, targetId);
      if (target === undefined) {
        throw new ProposalError(`no backlog group or atlas candidate with id ${targetId}`, [
          'list the editorial backlog with `navigator coverage unresolved`',
          'list atlas candidates with `navigator coverage candidates`',
        ]);
      }
      const at = new Date().toISOString();
      const slugTail = name ?? slugNameFromLabel(target.label);
      const id = nextProposalId(baseDir, at, slugTail === '' ? 'proposal' : slugTail);
      return {
        proposalId: id,
        createdAt: at,
        prepared: prepareProposal(db, {
          targetId,
          tier,
          proposalId: id,
          createdAt: at,
          baseCommit: headCommit(),
          ...(name === undefined ? {} : { name }),
          ...(category === undefined ? {} : { categoryId: category }),
        }),
      };
    });
  } catch (error) {
    if (error instanceof ProposalError) {
      console.error(`navigator proposal prepare: ${error.message}`);
      for (const line of error.detail) console.error(`  ${line}`);
      return 2;
    }
    throw error;
  }

  const { prepared, proposalId, createdAt } = outcome;
  const dir = join(baseDir, proposalId);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, PROPOSAL_FILES.manifest),
    serializeProposalManifest(prepared.manifest),
    'utf8',
  );
  await writeFile(join(dir, PROPOSAL_FILES.request), prepared.request, 'utf8');

  if (wantsJson(args)) {
    printJson({
      proposalId,
      createdAt,
      directory: dir,
      manifest: prepared.manifest,
      conceptId: prepared.conceptId,
      slug: prepared.slug,
      allowedPath: prepared.allowedPath,
    });
    return 0;
  }

  console.log(`prepared ${proposalId}`);
  console.log(`  directory      ${dir}`);
  console.log(`  target         ${prepared.target.id} (${prepared.target.kind})`);
  console.log(`  tier           ${String(tier)}`);
  console.log(`  writes         ${prepared.allowedPath}`);
  console.log(`  concept id     ${prepared.conceptId}`);
  console.log(`  slug           ${prepared.slug}`);
  console.log(`  base commit    ${prepared.manifest.baseCommit}`);
  console.log('');
  console.log('Nothing has run. Read the brief before handing it to anything:');
  console.log(`  ${join(dir, PROPOSAL_FILES.request)}`);
  return 0;
}

async function commandProposalValidate(args: readonly string[]): Promise<number> {
  const dirArg = args.find((arg) => !arg.startsWith('--'));
  if (dirArg === undefined) {
    console.error('navigator proposal validate: a proposal directory is required\n\n' + USAGE);
    return 2;
  }
  const proposalDir = resolve(process.cwd(), dirArg);

  let outcome;
  try {
    outcome = await validateProposal({ repoRoot: projectPaths().root, proposalDir });
  } catch (error) {
    if (error instanceof ProposalError) {
      console.error(`navigator proposal validate: ${error.message}`);
      for (const line of error.detail) console.error(`  ${line}`);
      return 2;
    }
    throw error;
  }

  const { validation } = outcome;
  const written = await writeProposalValidation(proposalDir, validation);

  if (wantsJson(args)) {
    printJson(validation);
    return validation.ok ? 0 : 1;
  }

  console.log(`${validation.proposalId}: ${validation.ok ? 'valid' : 'not valid'}`);
  if (validation.filesTouched.length > 0) {
    console.log('');
    console.log('files touched:');
    for (const file of validation.filesTouched) console.log(`  ${file}`);
  }
  if (validation.passed.length > 0) {
    console.log('');
    for (const line of validation.passed) console.log(`  ok    ${line}`);
  }
  if (validation.problems.length > 0) {
    console.log('');
    for (const line of validation.problems) console.log(`  FAIL  ${line}`);
  }
  console.log('');
  console.log(`wrote ${written}`);
  if (!validation.ok) {
    console.log('');
    console.log('Nothing has been applied. Send this back, or reject it with a reason.');
  }
  return validation.ok ? 0 : 1;
}

/** Where a proposal lives, by id, unless the caller says otherwise. */
function proposalDirFor(args: readonly string[], proposalId: string): string {
  const override = optionValue(args, '--dir');
  return override === undefined
    ? join(proposalsDir(), proposalId)
    : resolve(process.cwd(), override);
}

async function commandProposalAccept(args: readonly string[]): Promise<number> {
  const proposalId = args.find((arg) => !arg.startsWith('--'));
  if (proposalId === undefined) {
    console.error('navigator proposal accept: a proposal id is required\n\n' + USAGE);
    return 2;
  }
  const confirm = optionValue(args, '--confirm');
  if (confirm === undefined) {
    console.error(
      `navigator proposal accept: --confirm ${proposalId} is required. Accepting a proposal changes canonical knowledge, so it is never one word long.`,
    );
    return 2;
  }

  let outcome;
  try {
    outcome = await acceptProposal({
      repoRoot: projectPaths().root,
      proposalDir: proposalDirFor(args, proposalId),
      confirm,
      dryRun: args.includes('--dry-run'),
    });
  } catch (error) {
    if (error instanceof ProposalError) {
      console.error(`navigator proposal accept: ${error.message}`);
      for (const line of error.detail) console.error(`  ${line}`);
      return 2;
    }
    throw error;
  }

  if (wantsJson(args)) {
    printJson(outcome);
    return outcome.ok ? 0 : 1;
  }

  for (const line of outcome.passed) console.log(`  ok    ${line}`);
  for (const line of outcome.applied) console.log(`  did   ${line}`);
  for (const line of outcome.problems) console.log(`  FAIL  ${line}`);
  console.log('');
  if (!outcome.ok) {
    console.log('Nothing was applied.');
    return 1;
  }
  if (args.includes('--dry-run')) {
    console.log(
      `Every guard holds. Run it again without --dry-run to apply it to ${outcome.branch}.`,
    );
    return 0;
  }
  console.log(`The change is on ${outcome.branch}, staged and uncommitted.`);
  console.log('Read it, run `npm test`, then commit it yourself. Nothing here commits.');
  return 0;
}

async function commandProposalReject(args: readonly string[]): Promise<number> {
  const proposalId = args.find((arg) => !arg.startsWith('--'));
  if (proposalId === undefined) {
    console.error('navigator proposal reject: a proposal id is required\n\n' + USAGE);
    return 2;
  }
  const confirm = optionValue(args, '--confirm');
  const reason = optionValue(args, '--reason');
  if (confirm === undefined || reason === undefined) {
    console.error(
      `navigator proposal reject: --confirm ${proposalId} and --reason "<why>" are both required`,
    );
    return 2;
  }
  try {
    const manifest = await rejectProposal({
      proposalDir: proposalDirFor(args, proposalId),
      confirm,
      reason,
    });
    console.log(`rejected ${manifest.proposalId}`);
    console.log(`  reason  ${manifest.rejectedReason ?? ''}`);
    console.log('');
    console.log('Nothing was applied and nothing was deleted. The bundle stays for the record.');
    return 0;
  } catch (error) {
    if (error instanceof ProposalError) {
      console.error(`navigator proposal reject: ${error.message}`);
      for (const line of error.detail) console.error(`  ${line}`);
      return 2;
    }
    throw error;
  }
}

async function commandProposalImport(args: readonly string[]): Promise<number> {
  const proposalId = args.find((arg) => !arg.startsWith('--'));
  if (proposalId === undefined) {
    console.error('navigator proposal import-hermes: a proposal id is required\n\n' + USAGE);
    return 2;
  }
  const worktree = optionValue(args, '--worktree');
  if (worktree === undefined) {
    console.error('navigator proposal import-hermes: --worktree <path> is required');
    return 2;
  }

  let outcome;
  try {
    outcome = await importHermesResult({
      repoRoot: projectPaths().root,
      proposalDir: proposalDirFor(args, proposalId),
      worktree: resolve(process.cwd(), worktree),
    });
  } catch (error) {
    if (error instanceof ProposalError) {
      console.error(`navigator proposal import-hermes: ${error.message}`);
      for (const line of error.detail) console.error(`  ${line}`);
      return 2;
    }
    throw error;
  }

  if (wantsJson(args)) {
    printJson(outcome);
    return outcome.ok ? 0 : 1;
  }

  if (outcome.status !== 'review') {
    for (const problem of outcome.problems) console.error(`  FAIL  ${problem}`);
    console.error('');
    console.error('Nothing was imported. The proposal is unchanged.');
    return 1;
  }

  console.log(`imported ${outcome.proposalId}`);
  console.log(`  patch    ${String(outcome.patchBytes)} bytes`);
  console.log(`  touches  ${outcome.filesTouched.join(', ')}`);
  console.log(`  status   review`);
  console.log('');
  if (outcome.ok) {
    console.log('Validation passes. Read the change and RESULT.md, then accept or reject it:');
    console.log(
      `  navigator proposal accept ${outcome.proposalId} --confirm ${outcome.proposalId}`,
    );
  } else {
    for (const problem of outcome.problems) console.log(`  FAIL  ${problem}`);
    console.log('');
    console.log('The work is in the bundle and the proposal is in review, but it does not');
    console.log('validate. Read it, then reject it with a reason, or send it back.');
  }
  return outcome.ok ? 0 : 1;
}

async function commandProposal(args: readonly string[]): Promise<number> {
  const [subcommand, ...rest] = args;
  switch (subcommand) {
    case 'prepare':
      return commandProposalPrepare(rest);
    case 'validate':
      return commandProposalValidate(rest);
    case 'import-hermes':
      return commandProposalImport(rest);
    case 'accept':
      return commandProposalAccept(rest);
    case 'reject':
      return commandProposalReject(rest);
    default:
      console.error(`navigator proposal: unknown subcommand "${subcommand ?? ''}"\n\n${USAGE}`);
      return 2;
  }
}

/* -------------------------------------------------------------------------- */
/* Private export (v2 runbook S01)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Where an export may be written.
 *
 * `.navigator/exports` is ignored by Git and by Docker, so an export left there
 * cannot be committed or baked into an image by accident. Anywhere else is
 * allowed, but only when the person says so in as many words: the whole point
 * of this file is that it contains work nothing else can reproduce.
 */
function resolveExportDirectory(args: readonly string[], name: string): string | undefined {
  const override = optionValue(args, '--output');
  if (override === undefined) return join(projectPaths().exportsDir, name);
  const target = resolve(process.cwd(), override);
  const inside = projectPaths().exportsDir;
  if (target === inside || target.startsWith(`${inside}/`)) return target;
  if (args.includes('--allow-external-output')) return target;
  console.error(`navigator personal export: ${target} is outside ${inside}.`);
  console.error(
    '  An export holds work that exists nowhere else. Writing it somewhere Git or Docker',
  );
  console.error(
    '  might pick up is a decision, not a default: pass --allow-external-output to make it.',
  );
  return undefined;
}

async function commandPersonalExport(args: readonly string[]): Promise<number> {
  const personalPath = resolvePersonalPath(args);
  if (!existsSync(personalPath)) {
    console.error(
      `navigator personal export: no private database at ${personalPath}. There is nothing to export yet.`,
    );
    return 2;
  }

  const startedAt = new Date().toISOString();
  const name = `personal-${startedAt.replace(/[:.]/g, '-')}`;
  const directory = resolveExportDirectory(args, name);
  if (directory === undefined) return 2;

  const archive = withPersonal(args, (db) => readPersonalArchive(db, { now: () => startedAt }));
  const json = serializePersonalArchive(archive);
  const summary = renderPersonalSummary(archive);

  await mkdir(directory, { recursive: true });
  const dataPath = join(directory, ARCHIVE_FILES.data);
  const summaryPath = join(directory, ARCHIVE_FILES.summary);
  await writeFile(dataPath, json, 'utf8');
  await writeFile(summaryPath, summary, 'utf8');

  const records = archiveRecordCount(archive);
  const bytes = Buffer.byteLength(json, 'utf8') + Buffer.byteLength(summary, 'utf8');
  // Recorded after the files are safely written, so nothing claims an export
  // that did not happen. Metadata only: never the contents.
  recordExport(personalPath, {
    id: randomUUID(),
    kind: 'personal-archive',
    destination: directory,
    recordCount: records,
    byteCount: bytes,
    createdAt: startedAt,
  });

  if (wantsJson(args)) {
    printJson({
      directory,
      archive: dataPath,
      summary: summaryPath,
      archiveVersion: archive.archiveVersion,
      schemaVersion: archive.schemaVersion,
      records,
      counts: archive.counts,
    });
    return 0;
  }

  console.log(`exported ${String(records)} record(s)`);
  console.log(`  archive  ${dataPath}`);
  console.log(`  summary  ${summaryPath}`);
  console.log('');
  for (const table of Object.keys(archive.counts).sort()) {
    console.log(`  ${String(archive.counts[table] ?? 0).padStart(5)}  ${table}`);
  }
  console.log('');
  console.log('This is the only data here that cannot be rebuilt. Keep it somewhere you trust.');
  return 0;
}

async function commandPersonalImport(args: readonly string[]): Promise<number> {
  const file = args.find((arg) => !arg.startsWith('--'));
  if (file === undefined) {
    console.error('navigator personal import: an archive file is required\n\n' + USAGE);
    return 2;
  }
  const archivePath = resolve(process.cwd(), file);
  if (!existsSync(archivePath)) {
    console.error(`navigator personal import: no archive at ${archivePath}`);
    return 2;
  }
  const personalPath = resolvePersonalPath(args);
  if (!existsSync(personalPath)) {
    console.error(
      `navigator personal import: no private database at ${personalPath}. Start the product once so it can create one, or pass --personal <path>.`,
    );
    return 2;
  }

  let archive;
  try {
    archive = parsePersonalArchive(await readFile(archivePath, 'utf8'));
  } catch (error) {
    if (error instanceof PersonalImportError) {
      console.error(`navigator personal import: ${error.message}`);
      for (const line of error.detail.slice(0, 10)) console.error(`  ${line}`);
      return 2;
    }
    throw error;
  }

  const confirmed = args.includes('--confirm-import');
  const db = openPersonalForImport(personalPath);
  try {
    const plan = planPersonalImport(db, archive);

    if (wantsJson(args)) {
      printJson({ ...plan, applied: false, confirmed });
      if (!plan.ok) return 1;
      if (!confirmed) return 0;
    } else {
      console.log(`archive   ${archivePath}`);
      console.log(`exported  ${plan.exportedAt}`);
      console.log(`format    ${String(plan.archiveVersion)}, schema ${String(plan.schemaVersion)}`);
      console.log('');
      for (const table of plan.order) {
        console.log(
          `  ${String(plan.insert[table] ?? 0).padStart(5)} new  ${String(plan.skip[table] ?? 0).padStart(5)} already here   ${table}`,
        );
      }
      console.log('');
      for (const conflict of plan.conflicts.slice(0, 20)) {
        console.log(
          `  CONFLICT  ${conflict.table} ${conflict.id} differs in ${conflict.columns.join(', ')}`,
        );
      }
      for (const problem of plan.problems) console.log(`  FAIL  ${problem}`);
      if (!plan.ok) {
        console.log('');
        console.log('Nothing was changed.');
        return 1;
      }
    }

    if (!confirmed) {
      if (!wantsJson(args)) {
        console.log('This was a dry run. Nothing was changed.');
        console.log('Run it again with --confirm-import to restore this work.');
      }
      return 0;
    }

    const result = applyPersonalImport(db, archive);
    if (wantsJson(args)) {
      printJson({ ...plan, applied: true, ...result });
      return 0;
    }
    console.log(
      `imported ${String(result.inserted)} record(s), skipped ${String(result.skipped)} already here`,
    );
    return 0;
  } catch (error) {
    if (error instanceof PersonalImportError) {
      console.error(`navigator personal import: ${error.message}`);
      for (const line of error.detail.slice(0, 20)) console.error(`  ${line}`);
      return 1;
    }
    throw error;
  } finally {
    db.close();
  }
}

async function commandPersonal(args: readonly string[]): Promise<number> {
  const [subcommand, ...rest] = args;
  switch (subcommand) {
    case 'export':
      return commandPersonalExport(rest);
    case 'import':
      return commandPersonalImport(rest);
    default:
      console.error(`navigator personal: unknown subcommand "${subcommand ?? ''}"\n\n${USAGE}`);
      return 2;
  }
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
    case 'export':
      return commandExport(args);
    case 'proposal':
      return commandProposal(args);
    case 'personal':
      return commandPersonal(args);
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
