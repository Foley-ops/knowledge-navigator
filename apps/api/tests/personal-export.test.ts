/**
 * Exporting private research (v2 runbook S01).
 *
 * This runs in `apps/api` because that is where the private store's schema
 * lives: the archive has to be complete against the real database, not against
 * a fixture somebody wrote to match the exporter.
 *
 * Two properties are under test. Everything the researcher has is in the
 * archive — proved by writing one of every kind of record and counting them
 * back out. And nothing of the corpus is: the exporter never opens the
 * canonical index, and no page body appears in what it writes.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ARCHIVE_FILES,
  PERSONAL_ARCHIVE_VERSION,
  archiveRecordCount,
  personalTableNames,
  readPersonalArchive,
  renderPersonalSummary,
  serializePersonalArchive,
} from '@navigator/core';
import type { PersonalArchive } from '@navigator/core';
import { PERSONAL_SCHEMA_VERSION } from '../src/personal/db.js';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import {
  createArtifact,
  createNote,
  createProject,
  createSession,
  saveItem,
  setFamiliarity,
} from '../src/personal/index.js';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CLI = join(REPO_ROOT, 'packages', 'core', 'dist', 'cli.js');
const EXPORTED_AT = '2026-09-17T00:00:00.000Z';

/** A sentence only this test could have written. */
const NOTE_BODY = 'SENTINEL-NOTE small objects vanish after the third downsampling stage.';
const ARTIFACT_TEXT = 'SENTINEL-ARTIFACT recall at 512px was 0.41 on the held-out split.';

let scratch = '';
let personalPath = '';
let personal: PersonalHandle;
let projectId = '';
let archive: PersonalArchive;

async function navigator(...args: string[]) {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, PERSONAL_DATABASE_PATH: personalPath },
      maxBuffer: 32 * 1024 * 1024,
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
  scratch = await mkdtemp(join(tmpdir(), 'navigator-personal-export-'));
  personalPath = join(scratch, 'personal.db');
  personal = openPersonal(personalPath);

  const project = createProject(personal.db, {
    title: 'Small detector recall',
    description: 'Losing small objects after downsampling.',
  });
  projectId = project.id;
  const session = createSession(personal.db, projectId, {
    title: 'First pass',
    startingQuestion: 'Why does recall drop at 512px?',
  });
  createNote(personal.db, projectId, {
    body: NOTE_BODY,
    conceptId: 'concept.deep_learning.pooling',
    sessionId: session.id,
  });
  setFamiliarity(personal.db, 'concept.deep_learning.pooling', { level: 'working' });
  setFamiliarity(personal.db, 'concept.deep_learning.resnet', { level: 'strong' });
  saveItem(personal.db, projectId, {
    itemType: 'concept',
    label: 'Pooling',
    payload: {
      conceptId: 'concept.deep_learning.pooling',
      title: 'Pooling',
      slug: '/concepts/pooling',
      reviewState: 'generated-draft',
    },
  });
  createArtifact(personal.db, projectId, {
    label: 'Run log',
    originalName: 'run.txt',
    mediaType: 'text/plain',
    byteCount: ARTIFACT_TEXT.length,
    characterCount: ARTIFACT_TEXT.length,
    sha256: 'a'.repeat(64),
    warnings: [],
    extractedText: ARTIFACT_TEXT,
  });

  archive = readPersonalArchive(personal.db, { now: () => EXPORTED_AT });
}, 240_000);

afterAll(async () => {
  personal.close();
  await rm(scratch, { recursive: true, force: true });
});

describe('the archive', () => {
  it('covers every table the private store has', () => {
    const tables = personalTableNames(personal.db);
    expect(tables).toEqual([
      'artifacts',
      'concept_familiarity',
      'export_history',
      'notes',
      'projects',
      'research_sessions',
      'saved_items',
    ]);
    // Read from the database's own catalogue, so a table added later cannot be
    // forgotten here.
    expect(Object.keys(archive.tables).sort()).toEqual([...tables].sort());
  });

  it('carries every record the researcher created', () => {
    expect(archive.counts['projects']).toBe(1);
    expect(archive.counts['research_sessions']).toBe(1);
    expect(archive.counts['notes']).toBe(1);
    expect(archive.counts['concept_familiarity']).toBe(2);
    expect(archive.counts['saved_items']).toBe(1);
    expect(archive.counts['artifacts']).toBe(1);
    // One project, one session, one note, two familiarity records, one saved
    // item and one artifact.
    expect(archiveRecordCount(archive)).toBe(7);
  });

  it('keeps what only exists here: note bodies and extracted text', () => {
    const json = serializePersonalArchive(archive);
    expect(json).toContain(NOTE_BODY);
    expect(json).toContain(ARTIFACT_TEXT);
  });

  it('records the versions an importer has to check', () => {
    expect(archive.archiveVersion).toBe(PERSONAL_ARCHIVE_VERSION);
    expect(archive.schemaVersion).toBe(PERSONAL_SCHEMA_VERSION);
    expect(archive.exportedAt).toBe(EXPORTED_AT);
  });

  it('is byte-identical when the data has not changed', () => {
    const first = serializePersonalArchive(
      readPersonalArchive(personal.db, { now: () => EXPORTED_AT }),
    );
    const second = serializePersonalArchive(
      readPersonalArchive(personal.db, { now: () => EXPORTED_AT }),
    );
    expect(second).toBe(first);
  });
});

describe('what the archive is not', () => {
  it('holds no canonical page body, only ids and the labels you saw', async () => {
    const json = serializePersonalArchive(archive);
    const page = await readFile(join(REPO_ROOT, 'content', 'concepts', 'pooling.md'), 'utf8');
    const prose =
      page
        .split('## Definition')[1]
        ?.split('\n')
        .find((line) => line.trim().length > 60) ?? '';
    expect(prose.length).toBeGreaterThan(60);

    // The concept is named by id and by its title; its page is not copied.
    expect(json).toContain('concept.deep_learning.pooling');
    expect(json).toContain('"Pooling"');
    expect(json).not.toContain(prose.trim());
  });

  it('never opens the canonical index', async () => {
    const source = await readFile(
      join(REPO_ROOT, 'packages', 'core', 'src', 'personal-archive.ts'),
      'utf8',
    );
    expect(source).not.toContain('openDatabaseReadOnly');
    expect(source).not.toContain('DATABASE_PATH');
    expect(source).not.toContain('knowledge.db');
  });

  it('writes nothing to the private store but one history row', async () => {
    const source = await readFile(
      join(REPO_ROOT, 'packages', 'core', 'src', 'personal-archive.ts'),
      'utf8',
    );
    const writes = [...source.matchAll(/\b(INSERT INTO|UPDATE|DELETE FROM)\b\s*(\w+)?/g)].map(
      (match) => `${match[1] ?? ''} ${match[2] ?? ''}`.trim(),
    );
    expect(writes).toEqual(['INSERT INTO export_history']);
  });
});

describe('the readable summary', () => {
  const summary = () => renderPersonalSummary(archive);

  it('says what is in the archive and what is not', () => {
    expect(summary()).toContain('# Private research export');
    expect(summary()).toContain('contains no canonical page content');
    expect(summary()).toContain('The original files were never kept');
  });

  it('lists each project with its sessions, notes, saved work and uploads', () => {
    const text = summary();
    expect(text).toContain('## Small detector recall');
    expect(text).toContain('### Sessions');
    expect(text).toContain('Why does recall drop at 512px?');
    expect(text).toContain('### Notes');
    expect(text).toContain('SENTINEL-NOTE');
    expect(text).toContain('### Saved');
    expect(text).toContain('concept: Pooling');
    expect(text).toContain('### Uploaded material');
    expect(text).toContain('Run log');
  });

  it('lists familiarity, and says only the researcher sets it', () => {
    expect(summary()).toContain('## Familiarity');
    expect(summary()).toContain('Nothing in this product infers them');
    expect(summary()).toContain('concept.deep_learning.resnet');
  });
});

describe('navigator personal export', () => {
  it('writes both files and records the export, metadata only', async () => {
    const output = join(scratch, 'out');
    const result = await navigator(
      'personal',
      'export',
      '--output',
      output,
      '--allow-external-output',
      '--json',
    );
    expect(result.code, result.stderr).toBe(0);
    const written = JSON.parse(result.stdout) as {
      directory: string;
      archive: string;
      summary: string;
      records: number;
    };
    expect(written.records).toBe(7);
    expect(await readdir(written.directory)).toEqual(
      [ARCHIVE_FILES.data, ARCHIVE_FILES.summary].sort(),
    );

    const json = JSON.parse(await readFile(written.archive, 'utf8')) as PersonalArchive;
    expect(json.counts['notes']).toBe(1);
    expect(await readFile(written.summary, 'utf8')).toContain('# Private research export');

    // The history row says what happened, not what was in it.
    const history = personal.db
      .prepare('SELECT * FROM export_history ORDER BY created_at')
      .all() as { kind: string; destination: string; record_count: number; byte_count: number }[];
    expect(history).toHaveLength(1);
    expect(history[0]?.kind).toBe('personal-archive');
    expect(history[0]?.record_count).toBe(7);
    expect(history[0]?.byte_count).toBeGreaterThan(0);
    expect(JSON.stringify(history[0])).not.toContain('SENTINEL');
  });

  it('refuses to write outside .navigator/exports without being told to', async () => {
    const outside = join(scratch, 'somewhere-else');
    const refused = await navigator('personal', 'export', '--output', outside);
    expect(refused.code).toBe(2);
    expect(refused.stderr).toContain('is outside');
    expect(refused.stderr).toContain('--allow-external-output');
    expect(existsSync(outside)).toBe(false);

    const allowed = await navigator(
      'personal',
      'export',
      '--output',
      outside,
      '--allow-external-output',
    );
    expect(allowed.code).toBe(0);
    expect(existsSync(join(outside, ARCHIVE_FILES.data))).toBe(true);
  });

  it('says so when there is no private store at all', async () => {
    const result = await run(
      process.execPath,
      [CLI, 'personal', 'export', '--personal', join(scratch, 'absent.db')],
      { cwd: REPO_ROOT, env: { ...process.env } },
    ).catch((error: { code?: number; stderr?: string }) => error);
    expect((result as { code?: number }).code).toBe(2);
    expect((result as { stderr?: string }).stderr).toContain('nothing to export yet');
  });
});
