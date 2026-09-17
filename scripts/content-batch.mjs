#!/usr/bin/env node
/**
 * Everything that happens to a batch after its pages are written.
 *
 * The pages themselves are the only part of this build that takes judgement.
 * What follows is mechanical and therefore done mechanically, so it is done the
 * same way every time: check each page on its own, mark each candidate covered
 * in the atlas, validate the whole corpus, compile it, and report.
 *
 *   node scripts/content-batch.mjs 1              check, cover, validate, compile
 *   node scripts/content-batch.mjs 1 --check-only stop after the per-page checks
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plan } from './content-order.mjs';
import { checkPage } from './check-page.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS = join(ROOT, 'content', 'atlas.yaml');

function run(command, args) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * Mark one candidate as covered by the page that now answers to it.
 *
 * Edited as text rather than through a YAML round trip: the atlas is a frozen
 * seed with a deliberate layout, and rewriting the whole file to change two
 * lines would bury a two-line change in a two-thousand-line diff.
 */
export function coverCandidate(candidateId, conceptId) {
  const text = readFileSync(ATLAS, 'utf8');
  const marker = `  - candidate_id: ${candidateId}\n`;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`no candidate ${candidateId} in the atlas`);
  const nextAt = text.indexOf('\n  - candidate_id:', start + marker.length);
  const end = nextAt < 0 ? text.length : nextAt + 1;
  const block = text.slice(start, end);

  if (block.includes(`canonical_concept_id: ${conceptId}`)) return false;
  if (!block.includes('status: candidate') || !block.includes('canonical_concept_id: null')) {
    throw new Error(
      `candidate ${candidateId} is not an uncovered candidate; refusing to rewrite it`,
    );
  }

  const updated = block
    .replace('status: candidate', 'status: covered')
    .replace('canonical_concept_id: null', `canonical_concept_id: ${conceptId}`);
  writeFileSync(ATLAS, `${text.slice(0, start)}${updated}${text.slice(end)}`, 'utf8');
  return true;
}

function main(argv) {
  const number = Number(argv.find((argument) => /^\d+$/.test(argument)));
  if (!Number.isInteger(number)) {
    console.error('usage: node scripts/content-batch.mjs <batch number> [--check-only]');
    return 2;
  }
  const { batches } = plan();
  const batch = batches[number - 1];
  if (batch === undefined) {
    console.error(`there is no batch ${String(number)}`);
    return 2;
  }

  console.log(`Batch ${String(number)} of ${String(batches.length)}\n`);

  /* ------------------------------ every page ----------------------------- */

  let failed = 0;
  for (const item of batch.items) {
    const path = join(ROOT, item.file);
    if (!existsSync(path)) {
      console.log(`  MISSING  ${item.file}`);
      failed += 1;
      continue;
    }
    const problems = checkPage(path);
    if (problems.length === 0) {
      console.log(`  ok       ${item.file}`);
      continue;
    }
    failed += 1;
    console.log(`  FAIL     ${item.file}`);
    for (const problem of problems) console.log(`           ${problem}`);
  }

  if (failed > 0) {
    console.log(`\n${String(failed)} of ${String(batch.items.length)} pages are not ready.`);
    return 1;
  }
  if (argv.includes('--check-only')) return 0;

  /* -------------------------------- the atlas ---------------------------- */

  let covered = 0;
  for (const item of batch.items) {
    if (coverCandidate(item.candidateId, item.conceptId)) covered += 1;
  }
  console.log(`\n  covered  ${String(covered)} candidate(s) in the atlas`);

  /* ------------------------- the corpus, then the index ------------------ */

  try {
    const validate = run('node', ['packages/core/dist/cli.js', 'validate']);
    const summary = validate
      .split('\n')
      .filter((line) => /concepts:|tier|errors|candidates|unresolved/.test(line))
      .join('\n');
    console.log(`\n${summary}`);
  } catch (error) {
    console.log('\nvalidation failed:\n');
    console.log(String(error.stdout ?? '') + String(error.stderr ?? ''));
    return 1;
  }

  try {
    run('node', ['packages/core/dist/cli.js', 'compile']);
    console.log('\n  compiled the corpus');
  } catch (error) {
    console.log('\ncompilation failed:\n');
    console.log(String(error.stdout ?? '') + String(error.stderr ?? ''));
    return 1;
  }

  run('node', ['scripts/content-state.mjs']);
  console.log('  CONTENT_BUILD_STATE.md rewritten');
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
