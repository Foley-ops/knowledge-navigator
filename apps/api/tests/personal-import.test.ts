/**
 * Restoring private research (v2 runbook S02).
 *
 * The cases are the ones that decide whether a researcher can trust this with
 * the only copy of their work: a clean round trip, an archive imported twice,
 * two stores that disagree, a file that is not an archive, an archive from a
 * newer build, and a write that fails halfway.
 *
 * Every case runs against real private databases created by the real schema.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  PersonalImportError,
  applyPersonalImport,
  parsePersonalArchive,
  planPersonalImport,
  readPersonalArchive,
  serializePersonalArchive,
  writeOrder,
} from '@navigator/core';
import type { PersonalArchive } from '@navigator/core';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import { createNote, createProject, createSession, setFamiliarity } from '../src/personal/index.js';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CLI = join(REPO_ROOT, 'packages', 'core', 'dist', 'cli.js');
const EXPORTED_AT = '2026-09-17T00:00:00.000Z';
const NOTE_BODY = 'SENTINEL-IMPORT recall collapses once the stride reaches 32.';

let scratch = '';
let source: PersonalHandle;
let target: PersonalHandle;
let targetPath = '';
let archivePath = '';

/** Build a store with one of everything that references something else. */
function fill(handle: PersonalHandle): void {
  const project = createProject(handle.db, { title: 'Recall', description: 'Small objects.' });
  const session = createSession(handle.db, project.id, {
    title: 'First pass',
    startingQuestion: 'Why does recall drop?',
  });
  createNote(handle.db, project.id, {
    body: NOTE_BODY,
    conceptId: 'concept.deep_learning.pooling',
    sessionId: session.id,
  });
  setFamiliarity(handle.db, 'concept.deep_learning.pooling', { level: 'working' });
}

async function navigator(...args: string[]) {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, PERSONAL_DATABASE_PATH: targetPath },
      maxBuffer: 32 * 1024 * 1024,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: failure.code ?? 1, stdout: failure.stdout ?? '', stderr: failure.stderr ?? '' };
  }
}

function archiveOf(handle: PersonalHandle): PersonalArchive {
  return readPersonalArchive(handle.db, { now: () => EXPORTED_AT });
}

beforeAll(async () => {
  if (!existsSync(CLI)) {
    await run('npm', ['run', 'build', '--workspace', '@navigator/core'], { cwd: REPO_ROOT });
  }
}, 240_000);

beforeEach(async () => {
  scratch = await mkdtemp(join(tmpdir(), 'navigator-personal-import-'));
  source = openPersonal(join(scratch, 'source.db'));
  targetPath = join(scratch, 'target.db');
  target = openPersonal(targetPath);
  fill(source);
  archivePath = join(scratch, 'archive.json');
  await writeFile(archivePath, serializePersonalArchive(archiveOf(source)), 'utf8');
});

afterEach(async () => {
  source.close();
  target.close();
  await rm(scratch, { recursive: true, force: true });
});

describe('a clean round trip', () => {
  it('restores every record into an empty store', () => {
    const archive = archiveOf(source);
    const plan = planPersonalImport(target.db, archive);
    expect(plan.problems).toEqual([]);
    expect(plan.ok).toBe(true);
    expect(plan.insert['projects']).toBe(1);
    expect(plan.insert['notes']).toBe(1);

    const result = applyPersonalImport(target.db, archive);
    expect(result.inserted).toBe(4);
    expect(result.skipped).toBe(0);

    // What comes back out is what went in.
    expect(serializePersonalArchive(archiveOf(target))).toBe(serializePersonalArchive(archive));
  });

  it('writes parents before the records that point at them', () => {
    const order = writeOrder(target.db, Object.keys(archiveOf(source).tables));
    expect(order.indexOf('projects')).toBeLessThan(order.indexOf('research_sessions'));
    expect(order.indexOf('projects')).toBeLessThan(order.indexOf('notes'));
    expect(order.indexOf('research_sessions')).toBeLessThan(order.indexOf('notes'));
  });
});

describe('an archive imported twice', () => {
  it('changes nothing the second time', () => {
    const archive = archiveOf(source);
    applyPersonalImport(target.db, archive);
    const after = serializePersonalArchive(archiveOf(target));

    const second = planPersonalImport(target.db, archive);
    expect(second.ok).toBe(true);
    expect(Object.values(second.insert).reduce((sum, n) => sum + n, 0)).toBe(0);
    expect(second.skip['projects']).toBe(1);

    const result = applyPersonalImport(target.db, archive);
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(4);
    expect(serializePersonalArchive(archiveOf(target))).toBe(after);
  });
});

describe('two stores that disagree', () => {
  it('aborts the whole import and names what differs', () => {
    const archive = archiveOf(source);
    applyPersonalImport(target.db, archive);

    // The same project id, edited here since the archive was taken.
    const projectId = String((archive.tables['projects'] ?? [])[0]?.['id'] ?? '');
    target.db
      .prepare('UPDATE projects SET title = ? WHERE id = ?')
      .run('Recall, renamed here', projectId);

    const plan = planPersonalImport(target.db, archive);
    expect(plan.ok).toBe(false);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]?.table).toBe('projects');
    expect(plan.conflicts[0]?.columns).toContain('title');
    expect(plan.problems.join(' ')).toContain('only you can say which is right');

    // And nothing is written, including the records that had no conflict.
    const before = serializePersonalArchive(archiveOf(target));
    expect(() => applyPersonalImport(target.db, archive)).toThrow(PersonalImportError);
    expect(serializePersonalArchive(archiveOf(target))).toBe(before);
  });
});

describe('an archive that cannot be trusted', () => {
  it('refuses a file that is not JSON', () => {
    expect(() => parsePersonalArchive('not json at all')).toThrow(/not JSON/);
  });

  it('refuses JSON that is not an archive', () => {
    expect(() => parsePersonalArchive('{"hello":"world"}')).toThrow(/not a personal archive/);
    expect(() =>
      parsePersonalArchive(
        JSON.stringify({
          archiveVersion: 1,
          schemaVersion: 1,
          exportedAt: EXPORTED_AT,
          counts: {},
          tables: {},
          surprise: true,
        }),
      ),
    ).toThrow(/not a personal archive/);
  });

  it('refuses an archive from a later build', () => {
    const archive = { ...archiveOf(source), archiveVersion: 99 };
    const plan = planPersonalImport(target.db, archive);
    expect(plan.ok).toBe(false);
    expect(plan.problems.join(' ')).toContain('Upgrade the application');
  });

  it('refuses an archive from a different schema version', () => {
    for (const schemaVersion of [0, 2]) {
      const plan = planPersonalImport(target.db, { ...archiveOf(source), schemaVersion });
      expect(plan.ok, String(schemaVersion)).toBe(false);
      expect(plan.problems.join(' ')).toContain('schema version');
    }
  });

  it('refuses an archive holding a table this store does not have', () => {
    const archive = archiveOf(source);
    const plan = planPersonalImport(target.db, {
      ...archive,
      tables: { ...archive.tables, invented: [] },
    });
    expect(plan.ok).toBe(false);
    expect(plan.problems.join(' ')).toContain('a table this store does not have');
  });

  it('refuses a record whose parent is nowhere', () => {
    const archive = archiveOf(source);
    const plan = planPersonalImport(target.db, {
      ...archive,
      tables: {
        ...archive.tables,
        projects: [],
      },
    });
    expect(plan.ok).toBe(false);
    expect(plan.problems.join(' ')).toContain('neither in this store nor in the archive');
  });
});

describe('a write that fails halfway', () => {
  it('rolls back everything, leaving the store exactly as it was', () => {
    const archive = archiveOf(source);
    // A level the plan cannot know is wrong — the shape is right, the value is
    // refused by the table's own CHECK constraint. This is what a corrupted or
    // hand-edited archive looks like from the inside.
    const broken: PersonalArchive = {
      ...archive,
      tables: {
        ...archive.tables,
        concept_familiarity: [
          {
            ...((archive.tables['concept_familiarity'] ?? [])[0] ?? {}),
            level: 'expert',
          },
        ],
      },
    };

    const plan = planPersonalImport(target.db, broken);
    expect(plan.ok).toBe(true);

    const before = serializePersonalArchive(archiveOf(target));
    expect(() => applyPersonalImport(target.db, broken)).toThrow();
    // The project, the session and the note were written before the bad row.
    // None of them survive.
    expect(serializePersonalArchive(archiveOf(target))).toBe(before);
    expect(target.db.prepare('SELECT COUNT(*) AS n FROM projects').get()).toEqual({ n: 0 });
  });
});

describe('navigator personal import', () => {
  it('is a dry run unless the import is confirmed', async () => {
    const dry = await navigator('personal', 'import', archivePath);
    expect(dry.code).toBe(0);
    expect(dry.stdout).toContain('This was a dry run');
    expect(dry.stdout).toContain('--confirm-import');
    expect(target.db.prepare('SELECT COUNT(*) AS n FROM projects').get()).toEqual({ n: 0 });

    const applied = await navigator('personal', 'import', archivePath, '--confirm-import');
    expect(applied.code).toBe(0);
    expect(applied.stdout).toContain('imported 4 record(s)');
    expect(target.db.prepare('SELECT COUNT(*) AS n FROM projects').get()).toEqual({ n: 1 });
    expect((target.db.prepare('SELECT body FROM notes').get() as { body: string }).body).toContain(
      'SENTINEL-IMPORT',
    );
  });

  it('prints the plan as JSON when asked, and changes nothing', async () => {
    const result = await navigator('personal', 'import', archivePath, '--json');
    expect(result.code).toBe(0);
    const plan = JSON.parse(result.stdout) as { ok: boolean; applied: boolean; order: string[] };
    expect(plan.ok).toBe(true);
    expect(plan.applied).toBe(false);
    expect(plan.order).toContain('projects');
    expect(target.db.prepare('SELECT COUNT(*) AS n FROM projects').get()).toEqual({ n: 0 });
  });

  it('reports a conflict and exits nonzero', async () => {
    await navigator('personal', 'import', archivePath, '--confirm-import');
    target.db.prepare('UPDATE projects SET title = ?').run('renamed here');

    const conflicted = await navigator('personal', 'import', archivePath, '--confirm-import');
    expect(conflicted.code).toBe(1);
    expect(conflicted.stdout).toContain('CONFLICT');
    expect(conflicted.stdout).toContain('Nothing was changed.');
  });

  it('says so when the archive or the store is missing', async () => {
    const noFile = await navigator('personal', 'import', join(scratch, 'absent.json'));
    expect(noFile.code).toBe(2);
    expect(noFile.stderr).toContain('no archive at');

    const noStore = await navigator(
      'personal',
      'import',
      archivePath,
      '--personal',
      join(scratch, 'absent.db'),
    );
    expect(noStore.code).toBe(2);
    expect(noStore.stderr).toContain('no private database');
  });

  it('refuses a malformed archive without touching the store', async () => {
    const broken = join(scratch, 'broken.json');
    await writeFile(broken, '{"archiveVersion": 1}', 'utf8');
    const result = await navigator('personal', 'import', broken, '--confirm-import');
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('not a personal archive');
    expect(target.db.prepare('SELECT COUNT(*) AS n FROM projects').get()).toEqual({ n: 0 });
  });

  it('round-trips through the command line, byte for byte', async () => {
    await navigator('personal', 'import', archivePath, '--confirm-import');
    const restored = serializePersonalArchive(archiveOf(target));
    const original = await readFile(archivePath, 'utf8');
    expect(restored).toBe(original);
  });
});
