/**
 * `navigator export` (v2 runbook Q07).
 *
 * Driven as a real process against a real private database, because the point
 * of this command is that a researcher can get their work out of the product
 * without the product running. It reads the private store and writes exactly
 * one file under `.navigator/exports`; canonical content is never touched.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildLearningPath, compareConcepts, openDatabaseReadOnly } from '@navigator/core';
import type { Database as DatabaseType } from 'better-sqlite3';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import { createProject, saveItem } from '../src/personal/index.js';
import { compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CLI = join(REPO_ROOT, 'packages', 'core', 'dist', 'cli.js');

const RESNET = 'concept.deep_learning.resnet';
const VGG = 'concept.deep_learning.vgg';
const BUILT_AT = '2026-09-17T00:00:00.000Z';

let corpus: CompiledCorpus;
let index: DatabaseType;
let personal: PersonalHandle;
let scratch = '';
let personalPath = '';
let outDir = '';
let comparisonId = '';
let pathId = '';
let answerId = '';

interface Run {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function navigator(...args: string[]): Promise<Run> {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, PERSONAL_DATABASE_PATH: personalPath },
      maxBuffer: 16 * 1024 * 1024,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: failure.code ?? 1, stdout: failure.stdout ?? '', stderr: failure.stderr ?? '' };
  }
}

beforeAll(async () => {
  if (!existsSync(CLI)) {
    await run('npm', ['run', 'build', '--workspace', '@navigator/core'], { cwd: REPO_ROOT });
  }
  corpus = await compileAcceptanceCorpus();
  index = openDatabaseReadOnly(corpus.databasePath);

  scratch = await mkdtemp(join(tmpdir(), 'navigator-export-cli-'));
  outDir = join(scratch, 'exports');
  personalPath = join(scratch, 'personal.db');
  personal = openPersonal(personalPath);

  const project = createProject(personal.db, { title: 'Export' });

  comparisonId = saveItem(personal.db, project.id, {
    itemType: 'comparison',
    label: 'ResNet vs VGG',
    payload: {
      conceptIds: [RESNET, VGG],
      builtAt: BUILT_AT,
      comparison: compareConcepts(index, [RESNET, VGG]),
    },
  }).item.id;

  pathId = saveItem(personal.db, project.id, {
    itemType: 'path',
    label: 'Path to ResNet',
    payload: {
      targetConceptId: RESNET,
      knownConceptIds: [],
      builtAt: BUILT_AT,
      path: buildLearningPath(index, RESNET),
    },
  }).item.id;

  answerId = saveItem(personal.db, project.id, {
    itemType: 'assistant-answer',
    label: 'Why does recall drop?',
    payload: {
      question: 'Why does recall drop?',
      mode: 'unstick',
      depth: 'intuitive',
      provider: 'fixture',
      model: null,
      answeredAt: BUILT_AT,
      citations: [],
      result: { answer: 'Because of downsampling.' },
    },
  }).item.id;
}, 240_000);

afterAll(async () => {
  personal.close();
  index.close();
  await corpus.cleanup();
  await rm(scratch, { recursive: true, force: true });
});

describe('navigator export list', () => {
  it('shows only what can be exported, with the ids needed to do it', async () => {
    const result = await navigator('export', 'list', '--json');
    expect(result.code).toBe(0);
    const items = JSON.parse(result.stdout) as { id: string; itemType: string }[];
    expect(items.map((item) => item.itemType).sort()).toEqual(['comparison', 'path']);
    expect(items.map((item) => item.id).sort()).toEqual([comparisonId, pathId].sort());
  });

  it('reads the same store in readable form', async () => {
    const result = await navigator('export', 'list');
    expect(result.stdout).toContain(comparisonId);
    expect(result.stdout).toContain('ResNet vs VGG');
    expect(result.stdout).not.toContain(answerId);
  });
});

describe('navigator export saved', () => {
  it('writes a comparison that round-trips ids, evidence and review states', async () => {
    const result = await navigator(
      'export',
      'saved',
      comparisonId,
      '--out',
      outDir,
      '--site',
      'http://127.0.0.1:3000',
    );
    expect(result.code, result.stderr).toBe(0);

    const files = await readdir(outDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^comparison-resnet-vs-vgg-[a-z0-9-]{1,8}\.md$/);
    expect(result.stdout).toContain(files[0] ?? '');

    const markdown = await readFile(join(outDir, files[0] ?? ''), 'utf8');
    const comparison = compareConcepts(index, [RESNET, VGG]);

    // Every id, and every canonical page URL.
    for (const concept of comparison.concepts) {
      expect(markdown).toContain(`\`${concept.conceptId}\``);
      expect(markdown).toContain(`http://127.0.0.1:3000${concept.slug}`);
    }
    // Every source, by URL and by id.
    for (const source of comparison.sources) {
      expect(markdown).toContain(source.url);
      expect(markdown).toContain(`\`${source.sourceId}\``);
    }
    // Review state in words, and the evidence counts behind each column.
    expect(markdown).toContain('Generated draft — written by an AI agent');
    expect(markdown).toContain('| Concept | Id | Tier | Review state | Sources | Claims | Page |');
    // Cell text quoted from the page itself.
    const definition = comparison.rows.find((row) => row.key === 'definition');
    const firstCell = definition?.cells[0]?.value ?? '';
    expect(markdown).toContain(firstCell.split('\n')[0] ?? '');
  });

  it('writes a path that round-trips every step and edge', async () => {
    const result = await navigator('export', 'saved', pathId, '--out', outDir);
    expect(result.code, result.stderr).toBe(0);

    const files = (await readdir(outDir)).filter((name) => name.startsWith('path-'));
    expect(files).toHaveLength(1);
    const markdown = await readFile(join(outDir, files[0] ?? ''), 'utf8');

    const path = buildLearningPath(index, RESNET);
    expect(markdown).toContain(`${String(path.steps.length)} steps, in reading order`);
    for (const step of path.steps) {
      expect(markdown).toContain(`## ${String(step.position)}. ${step.title}`);
      expect(markdown).toContain(`\`${step.conceptId}\``);
    }
    expect(markdown).toContain('`requires`');
    expect(markdown).toContain('This is the destination.');
  });

  it('prints to standard output without writing anything', async () => {
    const before = await readdir(outDir);
    const result = await navigator('export', 'saved', comparisonId, '--stdout');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('# Comparison: ResNet vs VGG');
    expect(await readdir(outDir)).toEqual(before);
  });

  it('refuses an item that is not a comparison or a path', async () => {
    const result = await navigator('export', 'saved', answerId, '--out', outDir);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('only a comparison or a path');
  });

  it('says so when the id does not exist, and when the store does not', async () => {
    const missing = await navigator('export', 'saved', 'nope', '--out', outDir);
    expect(missing.code).toBe(2);
    expect(missing.stderr).toContain('no saved item nope');

    const noStore = await navigator(
      'export',
      'list',
      '--personal',
      join(scratch, 'does-not-exist.db'),
    );
    expect(noStore.code).toBe(1);
    expect(noStore.stderr).toContain('no private database');
  });

  it('leaves the canonical corpus untouched', async () => {
    const before = openDatabaseReadOnly(corpus.databasePath);
    const hash = (
      before.prepare("SELECT value FROM build_meta WHERE key = 'corpus_hash'").get() as {
        value: string;
      }
    ).value;
    before.close();

    await navigator('export', 'saved', comparisonId, '--out', outDir);

    const after = openDatabaseReadOnly(corpus.databasePath);
    const now = (
      after.prepare("SELECT value FROM build_meta WHERE key = 'corpus_hash'").get() as {
        value: string;
      }
    ).value;
    after.close();
    expect(now).toBe(hash);
  });
});
