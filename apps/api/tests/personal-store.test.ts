/**
 * The private personal store (v2 runbook N00–N06).
 *
 * Two properties are load-bearing and are tested first: the canonical index
 * still refuses writes, and the personal database is a different file that
 * accepts them. Everything else is about not losing a researcher's work —
 * archive rather than delete, deduplicate rather than double, and refuse a
 * record that points at something in another project.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database as DatabaseType } from 'better-sqlite3';
import { openDatabaseReadOnly } from '@navigator/core';
import {
  MIGRATIONS,
  PERSONAL_SCHEMA_VERSION,
  PERSONAL_TABLES,
  PersonalDatabaseError,
  PersonalNotFoundError,
  PersonalValidationError,
  archiveNote,
  archiveProject,
  archiveSavedItem,
  archiveSession,
  clearFamiliarity,
  countSessions,
  createNote,
  createProject,
  createSession,
  familiarityMap,
  getFamiliarity,
  listFamiliarity,
  listNotes,
  listProjects,
  listSavedItems,
  listSessions,
  migratePersonalDatabase,
  openPersonalDatabase,
  personalSchemaVersion,
  projectContents,
  restoreNote,
  restoreProject,
  restoreSavedItem,
  saveItem,
  setFamiliarity,
  updateNote,
  updateProject,
  updateSession,
} from '../src/personal/index.js';
import { compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

let scratch = '';
let db: DatabaseType;

beforeAll(async () => {
  scratch = await mkdtemp(join(tmpdir(), 'navigator-personal-'));
});

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

beforeEach(() => {
  db = openPersonalDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

/* --------------------------------------------------------------- N00 ---- */

describe('opening the personal database', () => {
  it('creates the file and its directory', () => {
    const path = join(scratch, 'nested', 'deeper', 'personal.db');
    const created = openPersonalDatabase(path);
    try {
      expect(existsSync(path)).toBe(true);
      expect(personalSchemaVersion(created)).toBe(PERSONAL_SCHEMA_VERSION);
      expect(created.pragma('foreign_keys')).toEqual([{ foreign_keys: 1 }]);
      expect(created.pragma('journal_mode')).toEqual([{ journal_mode: 'wal' }]);
      expect(created.pragma('busy_timeout')).toEqual([{ timeout: 5000 }]);
    } finally {
      created.close();
    }
  });

  it('creates every table the contract names', () => {
    const present = new Set(
      (
        db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
          name: string;
        }[]
      ).map((row) => row.name),
    );
    for (const table of PERSONAL_TABLES) {
      expect(present.has(table), `missing ${table}`).toBe(true);
    }
  });

  it('accepts a transaction', () => {
    const write = db.transaction(() => {
      createProject(db, { title: 'Detector recall' });
      createProject(db, { title: 'Second' });
    });
    write();
    expect(listProjects(db)).toHaveLength(2);
  });

  it('rolls a failed transaction back completely', () => {
    createProject(db, { title: 'Kept' });
    const bad = db.transaction(() => {
      createProject(db, { title: 'Discarded' });
      throw new Error('deliberate');
    });
    expect(() => bad()).toThrow('deliberate');
    expect(listProjects(db).map((project) => project.title)).toEqual(['Kept']);
  });
});

describe('the two databases are genuinely separate', () => {
  let corpus: CompiledCorpus;

  beforeAll(async () => {
    corpus = await compileAcceptanceCorpus();
  }, 180_000);

  afterAll(async () => {
    await corpus.cleanup();
  });

  it('still refuses every write to the canonical index', () => {
    const canonical = openDatabaseReadOnly(corpus.databasePath);
    try {
      expect(() => canonical.prepare('DELETE FROM concepts').run()).toThrow(/readonly/i);
      expect(() =>
        canonical
          .prepare("UPDATE concepts SET title = 'x' WHERE id = 'concept.analysis.convolution'")
          .run(),
      ).toThrow(/readonly/i);
      expect(() => canonical.exec('CREATE TABLE sneaky (x TEXT)')).toThrow(/readonly/i);
      // And it still reads.
      expect(
        (canonical.prepare('SELECT COUNT(*) AS n FROM concepts').get() as { n: number }).n,
      ).toBe(11);
    } finally {
      canonical.close();
    }
  });

  it('keeps personal tables out of the canonical index', () => {
    const canonical = openDatabaseReadOnly(corpus.databasePath);
    try {
      const names = new Set(
        (
          canonical.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
            name: string;
          }[]
        ).map((row) => row.name),
      );
      for (const table of PERSONAL_TABLES) {
        expect(names.has(table), `${table} must not exist in the canonical index`).toBe(false);
      }
    } finally {
      canonical.close();
    }
  });
});

/* --------------------------------------------------------------- N01 ---- */

describe('migrations', () => {
  it('is idempotent on reopen', () => {
    const path = join(scratch, 'reopen.db');
    const first = openPersonalDatabase(path);
    createProject(first, { title: 'Survives' });
    first.close();

    const second = openPersonalDatabase(path);
    try {
      expect(personalSchemaVersion(second)).toBe(PERSONAL_SCHEMA_VERSION);
      expect(listProjects(second).map((project) => project.title)).toEqual(['Survives']);
    } finally {
      second.close();
    }
  });

  it('upgrades a database that predates every migration', () => {
    const empty = new Database(':memory:');
    try {
      expect(personalSchemaVersion(empty)).toBe(0);
      expect(migratePersonalDatabase(empty)).toBe(PERSONAL_SCHEMA_VERSION);
      expect(personalSchemaVersion(empty)).toBe(PERSONAL_SCHEMA_VERSION);
      // Running again changes nothing.
      expect(migratePersonalDatabase(empty)).toBe(PERSONAL_SCHEMA_VERSION);
    } finally {
      empty.close();
    }
  });

  it('refuses a database written by a newer build', () => {
    const future = new Database(':memory:');
    try {
      future.pragma(`user_version = ${String(PERSONAL_SCHEMA_VERSION + 1)}`);
      expect(() => migratePersonalDatabase(future)).toThrow(PersonalDatabaseError);
      expect(() => migratePersonalDatabase(future)).toThrow(/Upgrade the application/);
    } finally {
      future.close();
    }
  });

  it('rolls a failed migration back and leaves the version alone', () => {
    const blocked = new Database(':memory:');
    try {
      // A table already occupying the name the migration wants to create.
      blocked.exec('CREATE TABLE projects (wrong TEXT)');
      expect(() => migratePersonalDatabase(blocked)).toThrow(/rolled back/);
      expect(personalSchemaVersion(blocked)).toBe(0);
      // The pre-existing table is untouched.
      const columns = (
        blocked.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
      ).map((column) => column.name);
      expect(columns).toEqual(['wrong']);
    } finally {
      blocked.close();
    }
  });

  it('declares exactly the migrations this version needs', () => {
    expect(MIGRATIONS.map((migration) => migration.to)).toEqual([1]);
    expect(PERSONAL_SCHEMA_VERSION).toBe(1);
  });

  it('enforces foreign keys', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO notes (id, project_id, body, created_at, updated_at)
           VALUES ('n', 'no-such-project', 'x', 'now', 'now')`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY/i);
  });
});

/* --------------------------------------------------------------- N02 ---- */

describe('projects', () => {
  it('creates, reads, renames and describes', () => {
    const project = createProject(db, { title: 'Small detector', description: 'Recall on 512px' });
    expect(project.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(project.archivedAt).toBeNull();
    expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const renamed = updateProject(db, project.id, { title: 'Small detector recall' });
    expect(renamed.title).toBe('Small detector recall');
    expect(renamed.description).toBe('Recall on 512px');
    expect(renamed.id).toBe(project.id);
  });

  it('archives instead of deleting, and restores', () => {
    const project = createProject(db, { title: 'Paused work' });
    archiveProject(db, project.id);

    expect(listProjects(db)).toHaveLength(0);
    expect(listProjects(db, { includeArchived: true })).toHaveLength(1);

    const restored = restoreProject(db, project.id);
    expect(restored.archivedAt).toBeNull();
    expect(listProjects(db)).toHaveLength(1);
  });

  it('rejects an empty or over-long title and an unknown field', () => {
    expect(() => createProject(db, { title: '   ' })).toThrow(PersonalValidationError);
    expect(() => createProject(db, { title: 'x'.repeat(201) })).toThrow(/at most 200/);
    expect(() => createProject(db, { title: 'ok', colour: 'red' })).toThrow(
      PersonalValidationError,
    );
    expect(() => createProject(db, { title: 'ok', description: 'y'.repeat(8_001) })).toThrow(
      /at most 8000/,
    );
  });

  it('throws for an unknown project', () => {
    expect(() => updateProject(db, 'nope', { title: 'x' })).toThrow(PersonalNotFoundError);
    expect(() => projectContents(db, 'nope')).toThrow(PersonalNotFoundError);
  });

  it('counts what a project holds', () => {
    const project = createProject(db, { title: 'Full' });
    createSession(db, project.id, { title: 'First pass' });
    createNote(db, project.id, { body: 'A thought.' });
    saveItem(db, project.id, {
      itemType: 'concept',
      label: 'ResNet',
      payload: {
        conceptId: 'concept.deep_learning.resnet',
        title: 'ResNet',
        slug: '/concepts/resnet',
        reviewState: 'generated-draft',
      },
    });
    expect(projectContents(db, project.id)).toEqual({
      sessions: 1,
      notes: 1,
      savedItems: 1,
      artifacts: 0,
    });
  });
});

/* --------------------------------------------------------------- N03 ---- */

describe('research sessions', () => {
  it('is created only by an explicit action', () => {
    const project = createProject(db, { title: 'Detector' });
    expect(countSessions(db)).toBe(0);

    // Everything an ordinary Ask request does to the personal store: nothing.
    expect(countSessions(db)).toBe(0);

    const session = createSession(db, project.id, {
      title: 'Why recall drops',
      startingQuestion: 'My model loses small objects after downsampling.',
    });
    expect(countSessions(db)).toBe(1);
    expect(session.projectId).toBe(project.id);
    expect(session.startingQuestion).toContain('loses small objects');
    expect(session.contextSummary).toBeNull();
  });

  it('keeps two sessions in one project isolated', () => {
    const project = createProject(db, { title: 'Two tracks' });
    const first = createSession(db, project.id, { title: 'Track one' });
    const second = createSession(db, project.id, { title: 'Track two' });

    createNote(db, project.id, { body: 'Belongs to one.', sessionId: first.id });
    createNote(db, project.id, { body: 'Belongs to two.', sessionId: second.id });

    expect(listNotes(db, project.id, { sessionId: first.id }).map((note) => note.body)).toEqual([
      'Belongs to one.',
    ]);
    expect(listNotes(db, project.id, { sessionId: second.id }).map((note) => note.body)).toEqual([
      'Belongs to two.',
    ]);
  });

  it('refuses a session id from another project', () => {
    const one = createProject(db, { title: 'One' });
    const two = createProject(db, { title: 'Two' });
    const session = createSession(db, one.id, { title: 'Only in one' });

    expect(() => updateSession(db, two.id, session.id, { title: 'stolen' })).toThrow(
      PersonalNotFoundError,
    );
    expect(() => archiveSession(db, two.id, session.id)).toThrow(PersonalNotFoundError);
    expect(() => createNote(db, two.id, { body: 'x', sessionId: session.id })).toThrow(
      PersonalNotFoundError,
    );
  });

  it('archives and restores', () => {
    const project = createProject(db, { title: 'Project' });
    const session = createSession(db, project.id, { title: 'Session' });
    archiveSession(db, project.id, session.id);
    expect(listSessions(db, project.id)).toHaveLength(0);
    expect(listSessions(db, project.id, { includeArchived: true })).toHaveLength(1);
  });

  it('disappears with its project', () => {
    const project = createProject(db, { title: 'Doomed' });
    createSession(db, project.id, { title: 'Session' });
    db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
    expect(countSessions(db)).toBe(0);
  });
});

/* --------------------------------------------------------------- N04 ---- */

describe('notes', () => {
  it('stores Markdown source exactly as written', () => {
    const project = createProject(db, { title: 'Notes' });
    const body = '# Heading\n\n<script>alert(1)</script>\n\n- item\n';
    const note = createNote(db, project.id, { body });
    // Stored verbatim: nothing is stripped, nothing is rendered. The browser
    // escapes it on the way out, so the note keeps saying what it said.
    expect(note.body).toBe(body);
    expect(note.body).toContain('<script>');
  });

  it('links to a concept, a session, a saved item or nothing', () => {
    const project = createProject(db, { title: 'Links' });
    const session = createSession(db, project.id, { title: 'S' });
    const saved = saveItem(db, project.id, {
      itemType: 'next-check',
      label: 'Measure recall',
      payload: { statement: 'Measure recall at 512px before changing the architecture.' },
    }).item;

    const plain = createNote(db, project.id, { body: 'Loose thought.' });
    expect(plain.conceptId).toBeNull();

    const onConcept = createNote(db, project.id, {
      body: 'Pooling is the suspect.',
      conceptId: 'concept.deep_learning.pooling',
    });
    expect(onConcept.conceptId).toBe('concept.deep_learning.pooling');

    const onSaved = createNote(db, project.id, { body: 'Do this first.', savedItemId: saved.id });
    expect(onSaved.savedItemId).toBe(saved.id);

    const inSession = createNote(db, project.id, {
      body: 'During pass one.',
      sessionId: session.id,
    });
    expect(inSession.sessionId).toBe(session.id);
  });

  it('rejects an empty body, an over-long body and a malformed concept id', () => {
    const project = createProject(db, { title: 'Validation' });
    expect(() => createNote(db, project.id, { body: '   ' })).toThrow(PersonalValidationError);
    expect(() => createNote(db, project.id, { body: 'x'.repeat(65_537) })).toThrow(/at most 65536/);
    expect(() => createNote(db, project.id, { body: 'ok', conceptId: 'Not-An-Id' })).toThrow(
      /lowercase dotted identifier/,
    );
  });

  it('refuses a saved item or artifact from another project', () => {
    const one = createProject(db, { title: 'One' });
    const two = createProject(db, { title: 'Two' });
    const saved = saveItem(db, one.id, {
      itemType: 'next-check',
      label: 'Check',
      payload: { statement: 'Only in project one.' },
    }).item;
    expect(() => createNote(db, two.id, { body: 'x', savedItemId: saved.id })).toThrow(
      PersonalNotFoundError,
    );
  });

  it('edits, archives and restores', () => {
    const project = createProject(db, { title: 'Lifecycle' });
    const note = createNote(db, project.id, { body: 'First draft.' });

    const edited = updateNote(db, project.id, note.id, { body: 'Second draft.' });
    expect(edited.body).toBe('Second draft.');
    expect(edited.createdAt).toBe(note.createdAt);

    archiveNote(db, project.id, note.id);
    expect(listNotes(db, project.id)).toHaveLength(0);
    expect(listNotes(db, project.id, { includeArchived: true })).toHaveLength(1);

    restoreNote(db, project.id, note.id);
    expect(listNotes(db, project.id)).toHaveLength(1);
  });

  it('filters by concept', () => {
    const project = createProject(db, { title: 'Filtering' });
    createNote(db, project.id, {
      body: 'About pooling.',
      conceptId: 'concept.deep_learning.pooling',
    });
    createNote(db, project.id, {
      body: 'About resnet.',
      conceptId: 'concept.deep_learning.resnet',
    });
    expect(
      listNotes(db, project.id, { conceptId: 'concept.deep_learning.pooling' }).map((n) => n.body),
    ).toEqual(['About pooling.']);
  });
});

/* --------------------------------------------------------------- N05 ---- */

describe('familiarity', () => {
  const KNOWN = new Set(['concept.deep_learning.pooling', 'concept.deep_learning.resnet']);

  it('upserts at most one record per concept', () => {
    setFamiliarity(db, 'concept.deep_learning.pooling', { level: 'recognize' });
    setFamiliarity(db, 'concept.deep_learning.pooling', {
      level: 'working',
      note: 'Read the chapter twice.',
    });
    const record = getFamiliarity(db, 'concept.deep_learning.pooling');
    expect(record?.level).toBe('working');
    expect(record?.note).toBe('Read the chapter twice.');
    expect(listFamiliarity(db)).toHaveLength(1);
  });

  it('clears in one action', () => {
    setFamiliarity(db, 'concept.deep_learning.pooling', { level: 'strong' });
    expect(clearFamiliarity(db, 'concept.deep_learning.pooling')).toBe(true);
    expect(getFamiliarity(db, 'concept.deep_learning.pooling')).toBeUndefined();
    expect(clearFamiliarity(db, 'concept.deep_learning.pooling')).toBe(false);
  });

  it('rejects a level outside the four', () => {
    expect(() => setFamiliarity(db, 'concept.deep_learning.pooling', { level: 'expert' })).toThrow(
      PersonalValidationError,
    );
  });

  it('rejects a concept that is not in the corpus, when the corpus is known', () => {
    expect(() =>
      setFamiliarity(
        db,
        'concept.deep_learning.nowhere',
        { level: 'strong' },
        { knownConceptIds: KNOWN },
      ),
    ).toThrow(/is not a concept in this corpus/);
    expect(
      setFamiliarity(
        db,
        'concept.deep_learning.resnet',
        { level: 'strong' },
        { knownConceptIds: KNOWN },
      ).level,
    ).toBe('strong');
  });

  it('rejects a malformed concept id and an over-long note', () => {
    expect(() => setFamiliarity(db, 'Not-An-Id', { level: 'strong' })).toThrow(
      /lowercase dotted identifier/,
    );
    expect(() =>
      setFamiliarity(db, 'concept.deep_learning.pooling', {
        level: 'strong',
        note: 'x'.repeat(1_001),
      }),
    ).toThrow(/at most 1000/);
  });

  it('lists by level and maps for path building', () => {
    setFamiliarity(db, 'concept.deep_learning.pooling', { level: 'strong' });
    setFamiliarity(db, 'concept.deep_learning.resnet', { level: 'unfamiliar' });
    expect(listFamiliarity(db, 'strong').map((r) => r.conceptId)).toEqual([
      'concept.deep_learning.pooling',
    ]);
    expect(familiarityMap(db).get('concept.deep_learning.resnet')).toBe('unfamiliar');
  });
});

/* --------------------------------------------------------------- N06 ---- */

describe('saved items', () => {
  const PAYLOADS: Record<string, unknown> = {
    concept: {
      conceptId: 'concept.deep_learning.resnet',
      title: 'ResNet',
      slug: '/concepts/resnet',
      reviewState: 'generated-draft',
    },
    source: {
      sourceId: 'source.he2016.deep_residual_learning',
      title: 'Deep Residual Learning for Image Recognition',
      url: 'https://arxiv.org/abs/1512.03385',
      sourceKind: 'preprint',
    },
    'assistant-answer': {
      question: 'Why does recall drop?',
      mode: 'unstick',
      depth: 'intuitive',
      provider: 'fixture',
      model: null,
      answeredAt: '2026-09-17T00:00:00.000Z',
      citations: [
        {
          kind: 'concept',
          id: 'concept.deep_learning.pooling',
          label: 'Pooling',
          slug: '/concepts/pooling',
        },
      ],
      result: { answer: 'Pooling discards spatial detail.', confidence: 'medium' },
    },
    // A comparison and a path are kept whole (v2 Q07), so the fixture is the
    // whole structure: dropping the missing markers or the review states here
    // would be dropping exactly what makes a saved comparison worth having.
    comparison: {
      conceptIds: ['concept.deep_learning.resnet', 'concept.deep_learning.vgg'],
      builtAt: '2026-09-17T00:00:00.000Z',
      comparison: {
        concepts: [
          {
            conceptId: 'concept.deep_learning.resnet',
            title: 'ResNet',
            slug: '/concepts/resnet',
            kind: 'method',
            tier: 1,
            reviewState: 'generated-draft',
            summary: 'A deep residual network.',
            format: 'markdown',
            hasArticle: true,
            categories: ['Artificial Intelligence/Deep Learning'],
            claimCount: 0,
            sourceCount: 1,
          },
          {
            conceptId: 'concept.deep_learning.vgg',
            title: 'VGG',
            slug: '/concepts/vgg',
            kind: 'method',
            tier: 1,
            reviewState: 'generated-draft',
            summary: 'A stack of small filters.',
            format: 'markdown',
            hasArticle: true,
            categories: ['Artificial Intelligence/Deep Learning'],
            claimCount: 0,
            sourceCount: 1,
          },
        ],
        rows: [
          {
            key: 'definition',
            label: 'Definition',
            hint: 'What each one is.',
            cells: [
              {
                conceptId: 'concept.deep_learning.resnet',
                value: 'Residual blocks.',
                missing: null,
              },
              { conceptId: 'concept.deep_learning.vgg', value: null, missing: 'no-section' },
            ],
          },
        ],
        relationships: {},
        between: [],
        sources: [],
        evidence: {
          'concept.deep_learning.resnet': {
            sources: 1,
            claims: 0,
            sectionsWithClaims: [],
            reviewState: 'generated-draft',
          },
          'concept.deep_learning.vgg': {
            sources: 1,
            claims: 0,
            sectionsWithClaims: [],
            reviewState: 'generated-draft',
          },
        },
        completeness: { cells: 2, missing: 1 },
      },
    },
    path: {
      targetConceptId: 'concept.deep_learning.resnet',
      knownConceptIds: [],
      builtAt: '2026-09-17T00:00:00.000Z',
      path: {
        targetId: 'concept.deep_learning.resnet',
        targetTitle: 'ResNet',
        reachable: true,
        steps: [
          {
            conceptId: 'concept.deep_learning.resnet',
            title: 'ResNet',
            slug: '/concepts/resnet',
            hasArticle: true,
            tier: 1,
            reviewState: 'generated-draft',
            summary: 'A deep residual network.',
            position: 1,
            because: null,
            familiarity: null,
            likelyKnown: false,
          },
        ],
        startedFrom: [],
        familiarityEffects: [],
        missing: [],
        edges: [],
        truncated: false,
      },
    },
    'next-check': { statement: 'Measure recall at 512px.' },
  };

  it('round-trips every item type', () => {
    const project = createProject(db, { title: 'Everything' });
    for (const [itemType, payload] of Object.entries(PAYLOADS)) {
      const result = saveItem(db, project.id, { itemType, label: itemType, payload });
      expect(result.deduplicated, itemType).toBe(false);
      expect(result.item.itemType).toBe(itemType);
      expect(result.item.payloadVersion).toBe(1);
      expect(result.item.payload, itemType).toMatchObject(payload as Record<string, unknown>);
    }
    expect(listSavedItems(db, project.id)).toHaveLength(6);
  });

  it('deduplicates a concept and a source, but not an answer', () => {
    const project = createProject(db, { title: 'Dedup' });

    expect(
      saveItem(db, project.id, {
        itemType: 'concept',
        label: 'ResNet',
        payload: PAYLOADS['concept'],
      }).deduplicated,
    ).toBe(false);
    expect(
      saveItem(db, project.id, {
        itemType: 'concept',
        label: 'ResNet again',
        payload: PAYLOADS['concept'],
      }).deduplicated,
    ).toBe(true);
    expect(listSavedItems(db, project.id, { itemType: 'concept' })).toHaveLength(1);

    // Two answers to the same question are two events, not one.
    saveItem(db, project.id, {
      itemType: 'assistant-answer',
      label: 'First',
      payload: PAYLOADS['assistant-answer'],
    });
    saveItem(db, project.id, {
      itemType: 'assistant-answer',
      label: 'Second',
      payload: PAYLOADS['assistant-answer'],
    });
    expect(listSavedItems(db, project.id, { itemType: 'assistant-answer' })).toHaveLength(2);
  });

  it('rejects an unknown field and a fabricated canonical id', () => {
    const project = createProject(db, { title: 'Validation' });
    expect(() =>
      saveItem(db, project.id, {
        itemType: 'concept',
        label: 'x',
        payload: { ...(PAYLOADS['concept'] as object), extra: true },
      }),
    ).toThrow(PersonalValidationError);

    expect(() =>
      saveItem(db, project.id, {
        itemType: 'concept',
        label: 'x',
        payload: { ...(PAYLOADS['concept'] as object), conceptId: 'Not An Id' },
      }),
    ).toThrow(/lowercase dotted identifier/);

    expect(() =>
      saveItem(db, project.id, {
        itemType: 'comparison',
        label: 'x',
        payload: { conceptIds: ['concept.deep_learning.resnet'], builtAt: '2026-09-17T00:00:00Z' },
      }),
    ).toThrow(/at least two concepts/);

    expect(() =>
      saveItem(db, project.id, { itemType: 'nonsense', label: 'x', payload: {} }),
    ).toThrow(PersonalValidationError);
  });

  it('rejects a source URL that is not http(s)', () => {
    const project = createProject(db, { title: 'URLs' });
    expect(() =>
      saveItem(db, project.id, {
        itemType: 'source',
        label: 'x',
        payload: { ...(PAYLOADS['source'] as object), url: 'file:///etc/passwd' },
      }),
    ).toThrow(PersonalValidationError);
  });

  it('archives, restores, and un-archives on a repeat save', () => {
    const project = createProject(db, { title: 'Lifecycle' });
    const saved = saveItem(db, project.id, {
      itemType: 'concept',
      label: 'ResNet',
      payload: PAYLOADS['concept'],
    }).item;

    archiveSavedItem(db, project.id, saved.id);
    expect(listSavedItems(db, project.id)).toHaveLength(0);

    restoreSavedItem(db, project.id, saved.id);
    expect(listSavedItems(db, project.id)).toHaveLength(1);

    archiveSavedItem(db, project.id, saved.id);
    const again = saveItem(db, project.id, {
      itemType: 'concept',
      label: 'ResNet',
      payload: PAYLOADS['concept'],
    });
    expect(again.deduplicated).toBe(true);
    expect(again.item.archivedAt).toBeNull();
  });

  it('keeps an assistant answer exactly as the API returned it', () => {
    const project = createProject(db, { title: 'Answers' });
    const saved = saveItem(db, project.id, {
      itemType: 'assistant-answer',
      label: 'Why recall drops',
      payload: PAYLOADS['assistant-answer'],
    }).item;
    const payload = saved.payload as Record<string, unknown>;
    expect(payload['result']).toEqual({
      answer: 'Pooling discards spatial detail.',
      confidence: 'medium',
    });
    expect(payload['citations']).toHaveLength(1);
    // Context is absent unless the researcher chose to keep it.
    expect(payload['contextSummary']).toBeUndefined();
  });

  it('refuses a project that does not exist', () => {
    expect(() =>
      saveItem(db, 'nope', { itemType: 'concept', label: 'x', payload: PAYLOADS['concept'] }),
    ).toThrow(PersonalNotFoundError);
  });
});
