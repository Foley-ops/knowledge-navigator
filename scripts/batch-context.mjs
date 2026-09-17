#!/usr/bin/env node
/**
 * What a page being written this batch is allowed to point at.
 *
 * The writing brief used to carry two long lists inline — every concept id in
 * the corpus and every file in the content directory — which made each batch
 * brief thousands of tokens of machine-generated text. They are facts about the
 * repository, so an agent can read them here instead of being told.
 *
 *   node scripts/batch-context.mjs            ids and files, for a person
 *   node scripts/batch-context.mjs --json     the same, for a program
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content', 'concepts');

const files = readdirSync(CONTENT)
  .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
  .sort();

const ids = files
  .map((name) => /^concept_id:\s*(\S+)/m.exec(readFileSync(join(CONTENT, name), 'utf8'))?.[1])
  .filter((id) => id !== undefined)
  .sort();

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify({ conceptIds: ids, files }, null, 2)}\n`);
} else {
  console.log(`${String(ids.length)} concept id(s) that already exist — any of these is a`);
  console.log('valid relationship target, as are the pages being written alongside yours:\n');
  for (const id of ids) console.log(`  ${id}`);
  console.log(`\n${String(files.length)} file(s) in content/concepts — a relative link may point`);
  console.log('only at one of these, and only at a file that exists when you check your page:\n');
  for (const name of files) console.log(`  ${name}`);
}
