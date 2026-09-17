/**
 * The personal API surface (v2 runbook N07) and the redaction audit (N08).
 *
 * The audit is the part that matters most: every personal route is driven with
 * a unique sentinel string, and the captured log is searched for every one of
 * them. A log line about private work may carry a route, a status, a latency
 * and a count, and nothing else.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import { compileAcceptanceCorpus, testConfig } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';
import { openIndex } from '../src/index-handle.js';

let corpus: CompiledCorpus;
let scratch = '';
let app: FastifyInstance;
let personal: PersonalHandle;

async function build(options: { logStream?: Writable } = {}): Promise<FastifyInstance> {
  const config = testConfig({
    DATABASE_PATH: corpus.databasePath,
    PERSONAL_DATABASE_PATH: join(scratch, `personal-${String(Math.random()).slice(2)}.db`),
  });
  personal = openPersonal(config.PERSONAL_DATABASE_PATH);
  return buildApp({
    config,
    index: openIndex(corpus.databasePath),
    personal,
    ...(options.logStream === undefined ? {} : { logStream: options.logStream, logLevel: 'info' }),
  });
}

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  scratch = await mkdtemp(join(tmpdir(), 'navigator-personal-api-'));
}, 180_000);

afterAll(async () => {
  await app.close();
  await corpus.cleanup();
  await rm(scratch, { recursive: true, force: true });
});

beforeEach(async () => {
  if (app !== undefined) await app.close();
  app = await build();
});

async function call(method: 'GET' | 'POST' | 'PATCH', url: string, payload?: unknown) {
  const response = await app.inject({
    method,
    url,
    ...(payload === undefined ? {} : { payload: payload as object }),
  });
  return { status: response.statusCode, body: response.json() as any };
}

/* -------------------------------------------------------------------------- */

describe('GET /api/personal/status', () => {
  it('reports availability, schema version and counts without a path', async () => {
    const { status, body } = await call('GET', '/api/personal/status');
    expect(status).toBe(200);
    expect(body.available).toBe(true);
    expect(body.schemaVersion).toBe(1);
    expect(body.counts).toEqual({ projects: 0, sessions: 0, notes: 0, savedItems: 0 });
    expect(JSON.stringify(body)).not.toContain(scratch);
    expect(JSON.stringify(body)).not.toContain('personal.db');
  });

  it('never names the private store in the health response either', async () => {
    const { body } = await call('GET', '/api/health');
    const text = JSON.stringify(body);
    expect(text).not.toContain('personal');
    expect(text).not.toContain(scratch);
  });
});

describe('projects', () => {
  it('creates, lists, reads, renames, archives and restores', async () => {
    const created = await call('POST', '/api/personal/projects', {
      title: 'Small detector recall',
      description: 'Losing small objects at 512px',
    });
    expect(created.status).toBe(200);
    const id = created.body.id as string;

    expect((await call('GET', '/api/personal/projects')).body.total).toBe(1);

    const detail = await call('GET', `/api/personal/projects/${id}`);
    expect(detail.body.project.title).toBe('Small detector recall');
    expect(detail.body.contents).toEqual({ sessions: 0, notes: 0, savedItems: 0, artifacts: 0 });

    const renamed = await call('PATCH', `/api/personal/projects/${id}`, { title: 'Renamed' });
    expect(renamed.body.title).toBe('Renamed');

    await call('POST', `/api/personal/projects/${id}/archive`);
    expect((await call('GET', '/api/personal/projects')).body.total).toBe(0);
    expect((await call('GET', '/api/personal/projects?includeArchived=true')).body.total).toBe(1);

    await call('POST', `/api/personal/projects/${id}/restore`);
    expect((await call('GET', '/api/personal/projects')).body.total).toBe(1);
  });

  it('rejects an invalid body and an unknown field', async () => {
    expect((await call('POST', '/api/personal/projects', { title: '' })).status).toBe(400);
    const unknown = await call('POST', '/api/personal/projects', { title: 'x', colour: 'red' });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.code).toBe('invalid_request');
    expect(Array.isArray(unknown.body.error.details.issues)).toBe(true);
  });

  it('returns 404 for an unknown project and 400 for a malformed id', async () => {
    const missing = await call(
      'GET',
      '/api/personal/projects/11111111-1111-4111-8111-111111111111',
    );
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('not_found');
    expect((await call('GET', '/api/personal/projects/not-a-uuid')).status).toBe(400);
  });

  it('does not offer DELETE', async () => {
    const created = await call('POST', '/api/personal/projects', { title: 'Keep me' });
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/personal/projects/${String(created.body.id)}`,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('cross-project ownership', () => {
  it('refuses a session, note or saved item addressed through another project', async () => {
    const one = (await call('POST', '/api/personal/projects', { title: 'One' })).body.id as string;
    const two = (await call('POST', '/api/personal/projects', { title: 'Two' })).body.id as string;

    const session = (
      await call('POST', `/api/personal/projects/${one}/sessions`, { title: 'Only in one' })
    ).body.id as string;
    const note = (await call('POST', `/api/personal/projects/${one}/notes`, { body: 'Mine.' })).body
      .id as string;
    const saved = (
      await call('POST', `/api/personal/projects/${one}/saved`, {
        itemType: 'next-check',
        label: 'Check',
        payload: { statement: 'Measure recall first.' },
      })
    ).body.item.id as string;

    expect(
      (await call('PATCH', `/api/personal/projects/${two}/sessions/${session}`, { title: 'x' }))
        .status,
    ).toBe(404);
    expect(
      (await call('PATCH', `/api/personal/projects/${two}/notes/${note}`, { body: 'x' })).status,
    ).toBe(404);
    expect(
      (await call('POST', `/api/personal/projects/${two}/saved/${saved}/archive`)).status,
    ).toBe(404);
  });
});

describe('sessions, notes and saved items', () => {
  it('round-trips each through its routes', async () => {
    const project = (await call('POST', '/api/personal/projects', { title: 'Round trip' })).body
      .id as string;

    const session = await call('POST', `/api/personal/projects/${project}/sessions`, {
      title: 'First pass',
      startingQuestion: 'Where does recall go?',
    });
    expect(session.status).toBe(200);
    expect(
      (await call('GET', `/api/personal/projects/${project}/sessions`)).body.items,
    ).toHaveLength(1);

    const note = await call('POST', `/api/personal/projects/${project}/notes`, {
      body: 'Pooling looks like the culprit.',
      conceptId: 'concept.deep_learning.pooling',
      sessionId: session.body.id,
    });
    expect(note.status).toBe(200);
    expect(
      (
        await call(
          'GET',
          `/api/personal/projects/${project}/notes?conceptId=concept.deep_learning.pooling`,
        )
      ).body.items,
    ).toHaveLength(1);

    const saved = await call('POST', `/api/personal/projects/${project}/saved`, {
      itemType: 'concept',
      label: 'Pooling',
      payload: {
        conceptId: 'concept.deep_learning.pooling',
        title: 'Pooling',
        slug: '/concepts/pooling',
        reviewState: 'generated-draft',
      },
    });
    expect(saved.body.deduplicated).toBe(false);

    const again = await call('POST', `/api/personal/projects/${project}/saved`, {
      itemType: 'concept',
      label: 'Pooling again',
      payload: {
        conceptId: 'concept.deep_learning.pooling',
        title: 'Pooling',
        slug: '/concepts/pooling',
        reviewState: 'generated-draft',
      },
    });
    expect(again.body.deduplicated).toBe(true);
    expect(
      (await call('GET', `/api/personal/projects/${project}/saved?itemType=concept`)).body.items,
    ).toHaveLength(1);
  });

  it('archive hides and restore brings back, for every child type', async () => {
    const project = (await call('POST', '/api/personal/projects', { title: 'Archiving' })).body
      .id as string;
    const session = (
      await call('POST', `/api/personal/projects/${project}/sessions`, { title: 'S' })
    ).body.id as string;
    const note = (await call('POST', `/api/personal/projects/${project}/notes`, { body: 'N' })).body
      .id as string;

    await call('POST', `/api/personal/projects/${project}/sessions/${session}/archive`);
    await call('POST', `/api/personal/projects/${project}/notes/${note}/archive`);
    expect(
      (await call('GET', `/api/personal/projects/${project}/sessions`)).body.items,
    ).toHaveLength(0);
    expect((await call('GET', `/api/personal/projects/${project}/notes`)).body.items).toHaveLength(
      0,
    );

    await call('POST', `/api/personal/projects/${project}/sessions/${session}/restore`);
    await call('POST', `/api/personal/projects/${project}/notes/${note}/restore`);
    expect(
      (await call('GET', `/api/personal/projects/${project}/sessions`)).body.items,
    ).toHaveLength(1);
    expect((await call('GET', `/api/personal/projects/${project}/notes`)).body.items).toHaveLength(
      1,
    );
  });

  it('rejects an invalid list filter', async () => {
    const project = (await call('POST', '/api/personal/projects', { title: 'Filters' })).body
      .id as string;
    expect(
      (await call('GET', `/api/personal/projects/${project}/notes?conceptId=Nope`)).status,
    ).toBe(400);
    expect(
      (await call('GET', `/api/personal/projects/${project}/saved?itemType=invented`)).status,
    ).toBe(400);
    expect((await call('GET', `/api/personal/projects/${project}/notes?limit=0`)).status).toBe(400);
    expect((await call('GET', '/api/personal/projects?unknown=1')).status).toBe(400);
  });
});

describe('familiarity', () => {
  it('sets, reads, lists and clears', async () => {
    const set = await call('POST', '/api/personal/familiarity/concept.deep_learning.pooling', {
      level: 'working',
      note: 'Read the chapter.',
    });
    expect(set.status).toBe(200);
    expect(set.body.level).toBe('working');

    expect(
      (await call('GET', '/api/personal/familiarity/concept.deep_learning.pooling')).body
        .familiarity.level,
    ).toBe('working');
    expect((await call('GET', '/api/personal/familiarity?level=working')).body.items).toHaveLength(
      1,
    );

    const cleared = await call(
      'POST',
      '/api/personal/familiarity/concept.deep_learning.pooling/clear',
    );
    expect(cleared.body.cleared).toBe(true);
    expect(
      (await call('GET', '/api/personal/familiarity/concept.deep_learning.pooling')).body
        .familiarity,
    ).toBeNull();
  });

  it('refuses a concept the corpus does not carry', async () => {
    const response = await call('POST', '/api/personal/familiarity/concept.deep_learning.nowhere', {
      level: 'strong',
    });
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain('is not a concept in this corpus');
  });

  it('refuses a level outside the four and a malformed id', async () => {
    expect(
      (
        await call('POST', '/api/personal/familiarity/concept.deep_learning.pooling', {
          level: 'guru',
        })
      ).status,
    ).toBe(400);
    expect((await call('GET', '/api/personal/familiarity/Not-An-Id')).status).toBe(400);
  });
});

describe('ordinary browsing stores nothing', () => {
  it('leaves every personal count at zero', async () => {
    for (const url of [
      '/api/health',
      '/api/build',
      '/api/search?q=pooling',
      '/api/concepts/concept.deep_learning.pooling',
      '/api/graph/concept.deep_learning.pooling?depth=2',
      '/api/coverage/summary',
      '/api/evidence/concept.deep_learning.pooling',
      '/api/assistant/status',
    ]) {
      await app.inject({ method: 'GET', url });
    }
    await app.inject({
      method: 'POST',
      url: '/api/assistant/query',
      payload: { question: 'Why does recall drop after downsampling?' },
    });

    const { body } = await call('GET', '/api/personal/status');
    expect(body.counts).toEqual({ projects: 0, sessions: 0, notes: 0, savedItems: 0 });
  });
});

describe('with the private store unavailable', () => {
  it('answers 503 with a reason, and keeps canonical routes working', async () => {
    // A regular file where a directory would have to be: the store cannot be
    // created there, and the API must keep serving canonical knowledge anyway.
    const { writeFile } = await import('node:fs/promises');
    const blocker = join(scratch, 'not-a-directory');
    await writeFile(blocker, 'this is a file\n', 'utf8');

    const broken = await buildApp({
      config: testConfig({
        DATABASE_PATH: corpus.databasePath,
        PERSONAL_DATABASE_PATH: join(blocker, 'personal.db'),
      }),
      index: openIndex(corpus.databasePath),
    });
    try {
      const status = await broken.inject({ method: 'GET', url: '/api/personal/status' });
      expect(status.statusCode).toBe(503);
      expect((status.json() as any).available).toBe(false);

      const projects = await broken.inject({ method: 'GET', url: '/api/personal/projects' });
      expect(projects.statusCode).toBe(503);
      expect((projects.json() as any).error.code).toBe('personal_store_unavailable');
      // No path anywhere in the refusal.
      expect(JSON.stringify(projects.json())).not.toContain(scratch);

      const concepts = await broken.inject({
        method: 'GET',
        url: '/api/concepts/concept.deep_learning.pooling',
      });
      expect(concepts.statusCode).toBe(200);
    } finally {
      await broken.close();
    }
  });
});

/* -------------------------------------------------------------------------- */
/* N08 — the redaction audit                                                   */
/* -------------------------------------------------------------------------- */

describe('nothing a researcher wrote reaches the log', () => {
  it('drives every personal route with sentinels and finds none of them', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(String(chunk));
        callback();
      },
    });

    const logged = await build({ logStream: stream });
    try {
      const S = {
        projectTitle: 'SENTINEL-PROJECT-TITLE-7f3a',
        projectDescription: 'SENTINEL-PROJECT-DESCRIPTION-91bd',
        sessionTitle: 'SENTINEL-SESSION-TITLE-4c02',
        sessionQuestion: 'SENTINEL-SESSION-QUESTION-a18e',
        sessionContext: 'SENTINEL-SESSION-CONTEXT-55da',
        noteBody: 'SENTINEL-NOTE-BODY-2b7c',
        savedLabel: 'SENTINEL-SAVED-LABEL-6e90',
        savedStatement: 'SENTINEL-SAVED-STATEMENT-d3f1',
        familiarityNote: 'SENTINEL-FAMILIARITY-NOTE-08ac',
        question: 'SENTINEL-ASSISTANT-QUESTION-bb41',
        context: 'SENTINEL-ASSISTANT-CONTEXT-c7d2',
      };

      const inject = async (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: unknown) =>
        logged.inject({
          method,
          url,
          ...(payload === undefined ? {} : { payload: payload as object }),
        });

      const project = (
        (
          await inject('POST', '/api/personal/projects', {
            title: S.projectTitle,
            description: S.projectDescription,
          })
        ).json() as any
      ).id as string;

      const session = (
        (
          await inject('POST', `/api/personal/projects/${project}/sessions`, {
            title: S.sessionTitle,
            startingQuestion: S.sessionQuestion,
            contextSummary: S.sessionContext,
          })
        ).json() as any
      ).id as string;

      const note = (
        (
          await inject('POST', `/api/personal/projects/${project}/notes`, {
            body: S.noteBody,
            sessionId: session,
          })
        ).json() as any
      ).id as string;

      await inject('POST', `/api/personal/projects/${project}/saved`, {
        itemType: 'next-check',
        label: S.savedLabel,
        payload: { statement: S.savedStatement },
      });

      await inject('POST', '/api/personal/familiarity/concept.deep_learning.pooling', {
        level: 'working',
        note: S.familiarityNote,
      });

      await inject('PATCH', `/api/personal/projects/${project}`, { title: S.projectTitle });
      await inject('PATCH', `/api/personal/projects/${project}/notes/${note}`, {
        body: S.noteBody,
      });
      await inject('GET', `/api/personal/projects/${project}`);
      await inject('GET', `/api/personal/projects/${project}/notes`);
      await inject('GET', `/api/personal/projects/${project}/saved`);
      await inject('GET', '/api/personal/familiarity');
      await inject('POST', `/api/personal/projects/${project}/notes/${note}/archive`);
      await inject('POST', `/api/personal/projects/${project}/archive`);

      // The assistant, for the v1 sentinels.
      await inject('POST', '/api/assistant/query', {
        question: S.question,
        context: S.context,
      });

      // And a few deliberate failures, because an error path is a classic leak.
      await inject('POST', '/api/personal/projects', { title: '' });
      await inject('POST', `/api/personal/projects/${project}/notes`, { body: '' });
      await inject('POST', '/api/personal/familiarity/concept.no.such', { level: 'strong' });

      const captured = lines.join('\n');
      expect(captured.length).toBeGreaterThan(0);
      for (const [name, sentinel] of Object.entries(S)) {
        expect(captured.includes(sentinel), `${name} leaked into the log`).toBe(false);
      }

      // What the log may say: the route, the status, the request id.
      expect(captured).toContain('/api/personal/projects');
      expect(captured).toContain('"statusCode"');
    } finally {
      await logged.close();
    }
  });
});
