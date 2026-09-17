#!/usr/bin/env node
/**
 * Keep CONTENT_BUILD_STATE.md true.
 *
 * The generated sections — the resume point, the totals, the completed pages
 * and the ordered candidate list — are rewritten from what is actually on disk:
 * the atlas, the content directory and the frozen build order. Nothing in them
 * is typed by hand, so the file cannot drift from the corpus it describes.
 *
 * The hand-written sections below the marker are preserved untouched. That is
 * where failed checks, fixes and decisions are recorded, because those are
 * judgements rather than facts about the file system.
 *
 *   node scripts/content-state.mjs          rewrite the generated sections
 *   node scripts/content-state.mjs --check  fail if they are stale
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAtlasFromText, loadConceptFromText } from '../packages/core/dist/index.js';
import { plan, BATCH_SIZE } from './content-order.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATE = join(ROOT, 'CONTENT_BUILD_STATE.md');
const CONTENT = join(ROOT, 'content', 'concepts');

/** Everything below this line is written by a person and never regenerated. */
export const HAND_WRITTEN_MARKER = '<!-- hand-written below this line -->';

function pages() {
  const loaded = [];
  for (const name of readdirSync(CONTENT).filter((file) => file.endsWith('.md')).sort()) {
    const result = loadConceptFromText(readFileSync(join(CONTENT, name), 'utf8'), name);
    if (result.ok) loaded.push({ file: name, fm: result.concept.frontmatter });
  }
  return loaded;
}

function atlas() {
  const result = loadAtlasFromText(readFileSync(join(ROOT, 'content', 'atlas.yaml'), 'utf8'));
  if (result.atlas === undefined) throw new Error('content/atlas.yaml did not parse');
  return result.atlas;
}

function table(rows, headers) {
  const lines = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
  for (const row of rows) lines.push(`| ${row.join(' | ')} |`);
  return lines;
}

export function render() {
  const { items, batches } = plan();
  const index = atlas();
  const written = pages();
  const byConceptId = new Map(written.map((page) => [page.fm.concept_id, page]));

  const done = items.filter((item) => byConceptId.has(item.conceptId));
  const remaining = items.filter((item) => !byConceptId.has(item.conceptId));
  const currentBatch = batches.find((batch) =>
    batch.items.some((item) => !byConceptId.has(item.conceptId)),
  );

  const covered = new Set(
    index.document.candidates
      .filter((candidate) => candidate.status === 'covered')
      .map((candidate) => candidate.canonical_concept_id),
  );

  const lines = [];
  lines.push('# Content Build State', '');
  lines.push(
    'Resume point for the content build: turning every atlas candidate into a real concept page.',
    '',
  );
  lines.push(
    '**Build authority:** the task brief, [`content/atlas.yaml`](./content/atlas.yaml) for the',
    'candidates, [`AGENT_CONTENT_CONTRACT.md`](./AGENT_CONTENT_CONTRACT.md) for what a page must be,',
    'and [`scripts/content-order.mjs`](./scripts/content-order.mjs) for the frozen order. Sources may',
    'be cited only from [`docs/source-registry.json`](./docs/source-registry.json).',
    '',
  );
  lines.push(
    '**Everything above the hand-written marker is generated** by',
    '`node scripts/content-state.mjs` from the atlas, the content directory and the build order. It',
    'is never edited by hand, so it cannot describe a corpus that does not exist.',
    '',
  );

  /* ------------------------------ resume point --------------------------- */

  lines.push('## Resume point', '');
  if (currentBatch === undefined) {
    lines.push(
      `Every planned page exists: ${String(done.length)} of ${String(items.length)} written.`,
      '',
      'The next work is tier promotion and the final verification, not new pages.',
      '',
    );
  } else {
    const pending = currentBatch.items.filter((item) => !byConceptId.has(item.conceptId));
    lines.push(
      `**Batch ${String(currentBatch.number)} of ${String(batches.length)}.** ` +
        `${String(pending.length)} of ${String(currentBatch.items.length)} pages in it are still to write.`,
      '',
      'Write these files next:',
      '',
    );
    for (const item of pending) {
      lines.push(`- \`${item.file}\` — ${item.title} (${item.conceptId})`);
    }
    lines.push('');
    lines.push(
      'Then: `node scripts/check-page.mjs <files>`, `npm run validate`, `npm run compile`,',
      '`npx vitest run`, and commit the batch.',
      '',
    );
  }

  /* -------------------------------- totals ------------------------------- */

  lines.push('## Running totals', '');
  const byTier = { 1: 0, 2: 0, 3: 0 };
  for (const page of written) byTier[page.fm.tier] += 1;
  lines.push(
    ...table(
      [
        ['Candidates in the atlas', String(index.document.candidates.length)],
        ['Candidates covered by a page', String(covered.size)],
        ['Markdown pages in the corpus', String(written.length)],
        ['Tier 1 pages', String(byTier[1])],
        ['Tier 2 pages', String(byTier[2])],
        ['Tier 3 identities', String(byTier[3])],
        ['Planned pages written', `${String(done.length)} of ${String(items.length)}`],
      ],
      ['Total', 'Count'],
    ),
    '',
  );

  const areas = new Map();
  for (const item of items) {
    const entry = areas.get(item.area) ?? { planned: 0, written: 0 };
    entry.planned += 1;
    if (byConceptId.has(item.conceptId)) entry.written += 1;
    areas.set(item.area, entry);
  }
  lines.push('### By area', '');
  lines.push(
    ...table(
      [...areas.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([area, entry]) => [
          area,
          String(entry.written),
          String(entry.planned),
          `${String(Math.round((entry.written / entry.planned) * 100))}%`,
        ]),
      ['Area', 'Written', 'Planned', 'Done'],
    ),
    '',
  );

  const categories = new Map();
  for (const item of items) {
    const entry = categories.get(item.primaryCategory) ?? { planned: 0, written: 0 };
    entry.planned += 1;
    if (byConceptId.has(item.conceptId)) entry.written += 1;
    categories.set(item.primaryCategory, entry);
  }
  lines.push('### By category', '');
  lines.push(
    ...table(
      [...categories.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([category, entry]) => [
          category,
          String(entry.written),
          String(entry.planned),
          entry.written === entry.planned ? 'complete' : '',
        ]),
      ['Category', 'Written', 'Planned', 'State'],
    ),
    '',
  );

  /* ---------------------------- completed pages -------------------------- */

  lines.push('## Completed pages', '');
  if (done.length === 0) {
    lines.push('None yet.', '');
  } else {
    lines.push(
      `${String(done.length)} of the planned ${String(items.length)}, in the order they were written.`,
      '',
    );
    lines.push(
      ...table(
        done.map((item) => {
          const page = byConceptId.get(item.conceptId);
          return [
            item.title,
            `\`${item.conceptId}\``,
            `tier ${String(page?.fm.tier ?? '?')}`,
            covered.has(item.conceptId) ? 'covered' : 'NOT COVERED',
          ];
        }),
        ['Title', 'Concept id', 'Tier', 'Atlas'],
      ),
      '',
    );
  }

  /* ------------------------- the ordered candidate list ------------------- */

  lines.push('## The ordered candidate list', '');
  lines.push(
    `All ${String(items.length)} candidates without a page at the start of this build, in the order`,
    'they are written: the mathematics a concept rests on before the concept, the programming',
    'foundations before the engineering, the machine learning before the architectures that assume',
    'it. Batches are ten pages each.',
    '',
  );
  for (const batch of batches) {
    const complete = batch.items.every((item) => byConceptId.has(item.conceptId));
    lines.push(`### Batch ${String(batch.number)}${complete ? ' — complete' : ''}`, '');
    lines.push(
      ...table(
        batch.items.map((item) => [
          byConceptId.has(item.conceptId) ? 'x' : ' ',
          item.title,
          `\`${item.conceptId}\``,
          item.primaryCategory,
        ]),
        ['Done', 'Title', 'Concept id', 'Category'],
      ),
      '',
    );
  }

  lines.push(HAND_WRITTEN_MARKER, '');
  return lines.join('\n');
}

function main(argv) {
  const generated = render();
  const existing = existsSync(STATE) ? readFileSync(STATE, 'utf8') : '';
  const markerAt = existing.indexOf(HAND_WRITTEN_MARKER);
  const tail = markerAt >= 0 ? existing.slice(markerAt + HAND_WRITTEN_MARKER.length) : '\n';
  const next = `${generated}${tail.replace(/^\n+/, '\n')}`;

  if (argv.includes('--check')) {
    if (existing === next) {
      console.log('CONTENT_BUILD_STATE.md is current');
      return 0;
    }
    console.error('CONTENT_BUILD_STATE.md is stale; run node scripts/content-state.mjs');
    return 1;
  }

  writeFileSync(STATE, next, 'utf8');
  const { items, batches } = plan();
  console.log(
    `CONTENT_BUILD_STATE.md rewritten — ${String(items.length)} planned pages in ${String(batches.length)} batches of ${String(BATCH_SIZE)}`,
  );
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
