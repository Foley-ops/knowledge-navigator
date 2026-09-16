/**
 * D08 — the `navigator` command line, driven as a real process against the
 * acceptance corpus so the shipped entry point is what gets tested.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CLI = join(REPO_ROOT, 'packages', 'core', 'dist', 'cli.js');

let root: string;
let databasePath: string;

interface Run {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function navigator(...args: string[]): Promise<Run> {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, DATABASE_PATH: databasePath },
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
  root = await mkdtemp(join(tmpdir(), 'navigator-cli-'));
  databasePath = join(root, 'knowledge.db');
}, 180_000);

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('navigator command line', () => {
  it('validate reports the acceptance corpus and exits zero', async () => {
    const result = await navigator('validate');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('concepts:           11');
    expect(result.stdout).toContain('tier 1:          11');
    expect(result.stdout).toContain('generated-draft   11');
    expect(result.stdout).toContain('0 errors');
  }, 60_000);

  it('validate exits non-zero on a broken corpus without touching the real one', async () => {
    const broken = await mkdtemp(join(tmpdir(), 'navigator-broken-'));
    try {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(join(broken, 'x.md'), 'not a concept\n', 'utf8');
      const result = await navigator('validate', '--content', broken);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('problem(s)');
    } finally {
      await rm(broken, { recursive: true, force: true });
    }
  }, 60_000);

  it('compile writes the database and reports what it wrote', async () => {
    const result = await navigator('compile', '--database', databasePath);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('compiled the canonical corpus');
    expect(result.stdout).toContain('concepts:           11');
    expect(result.stdout).toContain('full-text rows:     11');
    expect(result.stdout).toMatch(/corpus hash:\s+[0-9a-f]{64}/);
    expect(existsSync(databasePath)).toBe(true);
  }, 120_000);

  it('inspect shows one concept by id, with categories, relations and sources', async () => {
    const result = await navigator('inspect', 'concept.deep_learning.resnet');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('id:            concept.deep_learning.resnet');
    expect(result.stdout).toContain('slug:          /concepts/resnet');
    expect(result.stdout).toContain('review state:  generated-draft');
    expect(result.stdout).toContain('* Artificial Intelligence/Computer Vision');
    expect(result.stdout).toContain('implements');
    expect(result.stdout).toContain('https://arxiv.org/abs/1512.03385');
    expect(result.stdout).toContain('Residual Network');
  }, 60_000);

  it('inspect also accepts a slug name', async () => {
    const byName = await navigator('inspect', 'resnet');
    const bySlug = await navigator('inspect', '/concepts/resnet');
    const byId = await navigator('inspect', 'concept.deep_learning.resnet');
    expect(byName.code).toBe(0);
    expect(byName.stdout).toBe(byId.stdout);
    expect(bySlug.stdout).toBe(byId.stdout);
  }, 60_000);

  it('inspect exits non-zero for an unknown concept', async () => {
    const result = await navigator('inspect', 'concept.no.such_thing');
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('no concept');
  }, 60_000);

  it('search finds convolutional layer through the alias "conv layer"', async () => {
    const result = await navigator('search', 'conv', 'layer');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Convolutional Layer');
    expect(result.stdout).toContain('[exact-alias]');
    expect(result.stdout).toContain('/concepts/convolutional-layer');
  }, 60_000);

  it('search honours --limit and reports an empty result plainly', async () => {
    const limited = await navigator('search', 'convolution', '--limit', '2');
    expect(limited.code).toBe(0);
    expect(limited.stdout).toContain('2 result(s)');

    const empty = await navigator('search', 'quaternion');
    expect(empty.code).toBe(0);
    expect(empty.stdout).toContain('no concept matches');
  }, 60_000);

  it('search handles injection-shaped input without failing', async () => {
    const result = await navigator('search', "'; DROP TABLE concepts; --");
    expect(result.code).toBe(0);
    const after = await navigator('inspect', 'concept.deep_learning.resnet');
    expect(after.code).toBe(0);
  }, 60_000);

  it('prints usage for help and exits 2 for an unknown command', async () => {
    const help = await navigator('--help');
    expect(help.code).toBe(0);
    for (const command of ['validate', 'compile', 'inspect', 'search', 'schema']) {
      expect(help.stdout).toContain(command);
    }
    const unknown = await navigator('frobnicate');
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toContain('unknown command');
  }, 60_000);

  it('explains itself when no compiled index exists', async () => {
    const result = await navigator(
      'inspect',
      'concept.deep_learning.resnet',
      '--database',
      join(root, 'missing.db'),
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('no compiled index');
    expect(result.stderr).toContain('npm run compile');
  }, 60_000);
});
