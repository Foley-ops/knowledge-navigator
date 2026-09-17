#!/usr/bin/env node
/**
 * The check one page must pass on its own (content build, requirement 4).
 *
 * Whole-corpus validation — relationship targets, name collisions, the atlas —
 * needs every page present, so it runs once per batch. This runs after every
 * single page, and answers a narrower question: is this file a real article?
 *
 * It enforces the frontmatter schema and the tier rules through the same code
 * the compiler uses, and then the things a schema cannot see: that each section
 * a reader needs is present and actually says something, that the page is not
 * an outline, and that no placeholder survived.
 *
 *   node scripts/check-page.mjs content/concepts/set-theory.md [...]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { loadConceptFromText, validateConceptPage } from '../packages/core/dist/index.js';

/**
 * Sections every page must carry, whatever its tier.
 *
 * This is the content build's bar, not the schema's: a Tier 2 page is allowed
 * to be short, and is not allowed to leave a reader without a definition, a
 * reason to care, an intuition, something concrete, or the mistakes people
 * actually make.
 */
export const REQUIRED_SECTIONS = [
  'Definition',
  'Why it matters',
  'Intuition',
  'Concrete example',
  'Uses and applicability',
  'Limitations and common mistakes',
  'Sources',
  'Prerequisites and next connections',
];

/** A page must explain the thing technically somewhere. */
export const TECHNICAL_SECTIONS = ['Formal treatment', 'Definition'];

/**
 * Minimum prose, in words, before a page counts as an article.
 *
 * The Tier 1 floor is set just under the shortest of the eleven pages version 1
 * wrote, so the bar is the one the corpus already holds itself to rather than a
 * number invented here.
 */
export const MINIMUM_WORDS = { 1: 800, 2: 450, 3: 0 };

/** Words that mean the page is not finished. */
const PLACEHOLDERS = [
  'TODO',
  'TBD',
  'FIXME',
  'lorem ipsum',
  'placeholder',
  'coming soon',
  'to be written',
  'XXX',
];

function sectionsOf(concept) {
  const body = concept.body;
  const parts = new Map();
  const matches = [...body.matchAll(/^## (.+)$/gm)];
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length ? (matches[index + 1].index ?? body.length) : body.length;
    parts.set(match[1].trim(), body.slice(start, end).trim());
  });
  return parts;
}

function words(text) {
  return text.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

/** Whether any other page in the directory declares a relationship to this one. */
function isPointedAt(path, conceptId) {
  const directory = dirname(path);
  let names;
  try {
    names = readdirSync(directory).filter((name) => name.endsWith('.md'));
  } catch {
    return false;
  }
  const needle = `target: ${conceptId}`;
  for (const name of names) {
    if (join(directory, name) === path) continue;
    try {
      if (readFileSync(join(directory, name), 'utf8').includes(needle)) return true;
    } catch {
      // A file that cannot be read is not evidence of a link.
    }
  }
  return false;
}

/** Check one page. Returns the problems found, most structural first. */
export function checkPage(path) {
  const problems = [];
  const fileName = basename(path);
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return [`${fileName}: the file does not exist`];
  }

  const loaded = loadConceptFromText(text, fileName);
  if (!loaded.ok) {
    for (const issue of loaded.issues) problems.push(`${fileName} ${issue.path}: ${issue.message}`);
    return problems;
  }

  const concept = loaded.concept;
  for (const diagnostic of validateConceptPage(concept)) {
    problems.push(`${fileName} ${diagnostic.field}: ${diagnostic.message}`);
  }

  const { frontmatter: fm } = concept;

  // The file name, the slug and the id are one address written three times.
  const tail = fm.slug.split('/').pop() ?? '';
  if (fileName !== `${tail}.md`) {
    problems.push(`${fileName} slug: the file name must be ${tail}.md to match the slug`);
  }

  const sections = sectionsOf(concept);
  for (const heading of REQUIRED_SECTIONS) {
    const contents = sections.get(heading);
    if (contents === undefined) {
      problems.push(`${fileName} body: the section "## ${heading}" is missing`);
    } else if (words(contents) < 12) {
      problems.push(
        `${fileName} body: "## ${heading}" says almost nothing (${words(contents)} words)`,
      );
    }
  }
  if (!TECHNICAL_SECTIONS.some((heading) => words(sections.get(heading) ?? '') >= 40)) {
    problems.push(
      `${fileName} body: no section explains the concept technically; "## Formal treatment" or a substantial "## Definition" is required`,
    );
  }

  const total = words(concept.plainText);
  const floor = MINIMUM_WORDS[fm.tier] ?? 0;
  if (total < floor) {
    problems.push(
      `${fileName} body: ${total} words of prose, below the ${floor} a tier ${fm.tier} page needs to orient a reader`,
    );
  }

  const lower = text.toLowerCase();
  for (const placeholder of PLACEHOLDERS) {
    if (lower.includes(placeholder.toLowerCase())) {
      problems.push(`${fileName} body: the placeholder "${placeholder}" is still in the page`);
    }
  }

  // The summary stands alone in search results and in comparisons; repeating it
  // as the definition means one of the two is doing no work.
  const definition = sections.get('Definition') ?? '';
  if (definition.trim().startsWith(fm.summary.trim()) && fm.summary.length > 40) {
    problems.push(`${fileName} body: the definition repeats the summary verbatim`);
  }

  if (fm.sources.length === 0) {
    problems.push(`${fileName} sources: a page must cite at least one source`);
  }
  if (fm.relationships.length === 0 && !isPointedAt(path, fm.concept_id)) {
    problems.push(
      `${fileName} relationships: nothing points at this page and it points at nothing; every page must connect to the rest of the corpus`,
    );
  }
  for (const [index, source] of fm.sources.entries()) {
    if (!/^https?:\/\//.test(source.url)) {
      problems.push(`${fileName} sources.${index}.url: must be an http(s) address`);
    }
    if (source.supports.length === 0) {
      problems.push(
        `${fileName} sources.${index}.supports: a source must name the sections it supports`,
      );
    }
  }

  // Relative links are how the pages actually read as a corpus rather than a
  // pile of files, so they are encouraged — and every one has to land.
  for (const link of concept.links) {
    if (!link.url.startsWith('.')) continue;
    const target = (link.url.split('#')[0] ?? '').replace(/^\.\//, '');
    if (target === '') continue;
    if (target.includes('..')) {
      problems.push(`${fileName} link:${link.url}: a link must not leave the content directory`);
      continue;
    }
    if (!existsSync(join(dirname(path), target))) {
      problems.push(`${fileName} link:${link.url}: ${target} does not exist`);
    }
  }

  return problems;
}

function main(argv) {
  const files = argv.filter((argument) => !argument.startsWith('--'));
  if (files.length === 0) {
    console.error('usage: node scripts/check-page.mjs <file.md> [...]');
    return 2;
  }
  let failed = 0;
  for (const file of files) {
    const problems = checkPage(resolve(file));
    if (problems.length === 0) {
      console.log(`  ok    ${basename(file)}`);
      continue;
    }
    failed += 1;
    console.log(`  FAIL  ${basename(file)}`);
    for (const problem of problems) console.log(`        ${problem}`);
  }
  if (failed > 0) console.log(`\n${String(failed)} of ${String(files.length)} page(s) need work.`);
  return failed === 0 ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
