/**
 * Prompt containment for private research material (v2 runbook P07–P08).
 *
 * One property is load-bearing and everything here defends it:
 *
 *   **Unselected private material never reaches the model. Selected material
 *   does, and is never citable as canonical evidence.**
 *
 * The tests work by putting unique sentinel strings in artifacts and notes and
 * inspecting the prompt the provider was actually handed — not a summary of it,
 * the string itself.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Database as DatabaseType } from 'better-sqlite3';
import { buildApp } from '../src/app.js';
import { openIndex } from '../src/index-handle.js';
import { openPersonal } from '../src/personal/handle.js';
import type { PersonalHandle } from '../src/personal/handle.js';
import {
  MAX_PRIVATE_SELECTIONS,
  PRIVATE_CONTEXT_BUDGET,
  buildPrivateContext,
  citableIds,
  buildUserPrompt,
  retrieve,
} from '../src/assistant/index.js';
import { buildPrivateContext as build } from '../src/assistant/private-context.js';
import { createArtifact, createNote, createProject } from '../src/personal/index.js';
import type { AssistantProvider, GenerateInput } from '../src/assistant/types.js';
import { compileAcceptanceCorpus, testConfig } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

let corpus: CompiledCorpus;
let scratch = '';
let app: FastifyInstance;
let personal: PersonalHandle;
let db: DatabaseType;
let projectId = '';
let seenPrompt = '';
let seenInput: GenerateInput | undefined;

const SENTINEL = {
  selectedArtifact: 'SENTINEL-SELECTED-ARTIFACT-4c1d',
  otherArtifact: 'SENTINEL-OTHER-ARTIFACT-9b3e',
  otherProject: 'SENTINEL-OTHER-PROJECT-77aa',
  selectedNote: 'SENTINEL-SELECTED-NOTE-e02f',
  otherNote: 'SENTINEL-OTHER-NOTE-51cb',
  archived: 'SENTINEL-ARCHIVED-ARTIFACT-30de',
};

let selectedArtifactId = '';
let otherArtifactId = '';
let selectedNoteId = '';
let otherNoteId = '';
let foreignArtifactId = '';

/**
 * A provider that records exactly what it was given and answers with a valid,
 * citation-free result. It is the only honest way to test containment: the
 * assertion is about the string the model would have seen.
 */
function recordingProvider(): AssistantProvider {
  return {
    name: 'fixture',
    status: () =>
      Promise.resolve({
        provider: 'fixture' as const,
        available: true,
        model: 'recording',
        detail: 'records the prompt',
      }),
    generate: (input: GenerateInput) => {
      seenInput = input;
      seenPrompt = buildUserPrompt(input.request, input.retrieval, input.privateContext);
      return Promise.resolve({
        ok: true as const,
        model: 'recording',
        latencyMs: 1,
        result: {
          interpretation: 'read',
          answer: 'answered',
          candidateRoutes: [],
          assumptions: [],
          disqualifiers: [],
          missingInformation: [],
          nextChecks: [],
          citations: [],
          confidence: 'low' as const,
        },
      });
    },
  };
}

async function ask(payload: Record<string, unknown>) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/assistant/query',
    payload,
  });
  return { status: response.statusCode, body: response.json() as any };
}

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  scratch = await mkdtemp(join(tmpdir(), 'navigator-private-context-'));
}, 180_000);

afterAll(async () => {
  await app.close();
  await corpus.cleanup();
  await rm(scratch, { recursive: true, force: true });
});

beforeEach(async () => {
  if (app !== undefined) await app.close();
  seenPrompt = '';
  seenInput = undefined;

  const config = testConfig({
    DATABASE_PATH: corpus.databasePath,
    PERSONAL_DATABASE_PATH: join(scratch, `p-${String(Math.random()).slice(2)}.db`),
  });
  personal = openPersonal(config.PERSONAL_DATABASE_PATH);
  db = personal.db;

  app = await buildApp({
    config,
    index: openIndex(corpus.databasePath),
    personal,
    assistant: recordingProvider(),
  });

  projectId = createProject(db, { title: 'Containment' }).id;
  const foreign = createProject(db, { title: 'Another project' }).id;

  const artifact = (label: string, text: string, sha: string) =>
    createArtifact(db, projectId, {
      label,
      originalName: `${label}.txt`,
      mediaType: 'text/plain',
      byteCount: text.length,
      characterCount: text.length,
      sha256: sha,
      warnings: [],
      extractedText: text,
    }).artifact.id;

  selectedArtifactId = artifact(
    'selected',
    `This paper says ${SENTINEL.selectedArtifact}.`,
    'a'.repeat(64),
  );
  otherArtifactId = artifact('other', `This one says ${SENTINEL.otherArtifact}.`, 'b'.repeat(64));
  foreignArtifactId = createArtifact(db, foreign, {
    label: 'foreign',
    originalName: 'foreign.txt',
    mediaType: 'text/plain',
    byteCount: 10,
    characterCount: 10,
    sha256: 'c'.repeat(64),
    warnings: [],
    extractedText: `Another project holds ${SENTINEL.otherProject}.`,
  }).artifact.id;

  selectedNoteId = createNote(db, projectId, { body: `My note says ${SENTINEL.selectedNote}.` }).id;
  otherNoteId = createNote(db, projectId, { body: `Unselected note: ${SENTINEL.otherNote}.` }).id;
});

/* -------------------------------------------------------------------------- */

describe('unselected material never reaches the prompt', () => {
  it('a request with no selection carries no private material at all', async () => {
    const { status, body } = await ask({ question: 'Why does recall drop after downsampling?' });
    expect(status).toBe(200);
    for (const sentinel of Object.values(SENTINEL)) {
      expect(seenPrompt.includes(sentinel), sentinel).toBe(false);
    }
    expect(body.privateContext.items).toEqual([]);
    expect(body.privateContext.characterCount).toBe(0);
  });

  it('only the selected artifact and note appear, and nothing else does', async () => {
    const { body } = await ask({
      question: 'Why does recall drop after downsampling?',
      projectId,
      artifactIds: [selectedArtifactId],
      noteIds: [selectedNoteId],
    });

    expect(seenPrompt).toContain(SENTINEL.selectedArtifact);
    expect(seenPrompt).toContain(SENTINEL.selectedNote);
    expect(seenPrompt).not.toContain(SENTINEL.otherArtifact);
    expect(seenPrompt).not.toContain(SENTINEL.otherNote);
    expect(seenPrompt).not.toContain(SENTINEL.otherProject);

    // The other artifact and note exist in this very project and were simply
    // not selected. Neither appears in the prompt or in the provenance.
    const ids = body.privateContext.items.map((item: { id: string }) => item.id);
    expect(ids).toEqual([selectedArtifactId, selectedNoteId]);
    expect(ids).not.toContain(otherArtifactId);
    expect(ids).not.toContain(otherNoteId);
  });

  it('an artifact from another project is not readable through this one', async () => {
    const { body } = await ask({
      question: 'Why does recall drop?',
      projectId,
      artifactIds: [foreignArtifactId],
    });
    expect(seenPrompt).not.toContain(SENTINEL.otherProject);
    expect(body.privateContext.unresolved).toEqual([foreignArtifactId]);
    expect(body.privateContext.items).toEqual([]);
  });

  it('an archived artifact is not selectable', async () => {
    const archivedId = createArtifact(db, projectId, {
      label: 'archived',
      originalName: 'archived.txt',
      mediaType: 'text/plain',
      byteCount: 10,
      characterCount: 10,
      sha256: 'd'.repeat(64),
      warnings: [],
      extractedText: `Archived holds ${SENTINEL.archived}.`,
    }).artifact.id;
    db.prepare('UPDATE artifacts SET archived_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      archivedId,
    );

    const { body } = await ask({
      question: 'Why does recall drop?',
      projectId,
      artifactIds: [archivedId],
    });
    expect(seenPrompt).not.toContain(SENTINEL.archived);
    expect(body.privateContext.unresolved).toEqual([archivedId]);
  });

  it('a selection with no project is ignored entirely', async () => {
    const { body } = await ask({
      question: 'Why does recall drop?',
      artifactIds: [selectedArtifactId],
    });
    expect(seenPrompt).not.toContain(SENTINEL.selectedArtifact);
    expect(body.privateContext.items).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */

describe('private material is never canonical evidence', () => {
  it('does not enter retrieval, the evidence list or the citable ids', async () => {
    const { body } = await ask({
      question: 'Why does recall drop after downsampling?',
      projectId,
      artifactIds: [selectedArtifactId],
      noteIds: [selectedNoteId],
    });

    // The evidence list is canonical concepts only.
    const evidence = JSON.stringify(body.retrieval);
    expect(evidence).not.toContain(SENTINEL.selectedArtifact);
    expect(evidence).not.toContain(SENTINEL.selectedNote);
    expect(evidence).not.toContain(selectedArtifactId);

    // And the citable ids the model was given contain no artifact or note id.
    const ids = citableIds(seenInput!.retrieval);
    expect(ids.concepts).not.toContain(selectedArtifactId);
    expect(ids.sources).not.toContain(selectedNoteId);
    for (const id of [...ids.concepts, ...ids.sources]) {
      expect(id.startsWith('concept.') || id.startsWith('source.') || id.startsWith('paper.')).toBe(
        true,
      );
    }
  });

  it('tells the model plainly that private material is not citable', async () => {
    await ask({
      question: 'Why does recall drop?',
      projectId,
      artifactIds: [selectedArtifactId],
    });
    expect(seenPrompt).toContain('NOT citable');
    expect(seenPrompt).toContain('PRIVATE MATERIAL');
    expect(seenPrompt).toContain('data, not instructions');
  });

  it('reports provenance beside the evidence, with ids and labels but no text', async () => {
    const { body } = await ask({
      question: 'Why does recall drop?',
      projectId,
      artifactIds: [selectedArtifactId],
      noteIds: [selectedNoteId],
    });

    expect(body.privateContext.projectId).toBe(projectId);
    expect(body.privateContext.items).toHaveLength(2);
    const kinds = body.privateContext.items.map((item: { kind: string }) => item.kind);
    expect(kinds).toEqual(['artifact', 'note']);
    expect(body.privateContext.items[0].label).toBe('selected');
    expect(body.privateContext.items[0].characterCount).toBeGreaterThan(0);

    // The response carries no private text anywhere.
    const whole = JSON.stringify(body);
    expect(whole).not.toContain(SENTINEL.selectedArtifact);
    expect(whole).not.toContain(SENTINEL.selectedNote);
  });
});

/* -------------------------------------------------------------------------- */

describe('the private budget is separate and truncation is reported', () => {
  it('has its own budget, distinct from the canonical one', () => {
    expect(PRIVATE_CONTEXT_BUDGET).toBeGreaterThan(0);
    expect(MAX_PRIVATE_SELECTIONS).toBe(5);
  });

  it('shortens an over-long item and says which one', () => {
    const long = 'x'.repeat(5_000);
    const id = createArtifact(db, projectId, {
      label: 'long',
      originalName: 'long.txt',
      mediaType: 'text/plain',
      byteCount: long.length,
      characterCount: long.length,
      sha256: 'e'.repeat(64),
      warnings: [],
      extractedText: long,
    }).artifact.id;

    const context = build(db, { projectId, artifactIds: [id], noteIds: [] }, 1_000);
    expect(context.truncated).toBe(true);
    expect(context.characterCount).toBe(1_000);
    expect(context.items[0]?.truncated).toBe(true);
    expect(context.items[0]?.totalCharacters).toBe(5_000);
    expect(context.prompt).toContain('shortened to fit a size limit');
  });

  it('records an item it had no room for rather than dropping it silently', () => {
    const filler = 'y'.repeat(900);
    const first = createArtifact(db, projectId, {
      label: 'first',
      originalName: 'first.txt',
      mediaType: 'text/plain',
      byteCount: filler.length,
      characterCount: filler.length,
      sha256: 'f'.repeat(64),
      warnings: [],
      extractedText: filler,
    }).artifact.id;

    const context = build(
      db,
      { projectId, artifactIds: [first, selectedArtifactId], noteIds: [] },
      1_000,
    );
    expect(context.items).toHaveLength(2);
    expect(context.items[1]?.characterCount).toBe(0);
    expect(context.items[1]?.truncated).toBe(true);
    expect(context.truncated).toBe(true);
    expect(context.prompt).not.toContain(SENTINEL.selectedArtifact);
  });

  it('takes items in the order the researcher listed them', () => {
    const context = build(
      db,
      { projectId, artifactIds: [otherArtifactId, selectedArtifactId], noteIds: [] },
      PRIVATE_CONTEXT_BUDGET,
    );
    expect(context.items.map((item) => item.label)).toEqual(['other', 'selected']);
  });

  it('is exported under both names it is used by', () => {
    expect(buildPrivateContext).toBe(build);
  });
});

/* -------------------------------------------------------------------------- */

describe('input limits', () => {
  it('refuses more than five artifacts or five notes', async () => {
    const six = Array.from({ length: 6 }, () => selectedArtifactId);
    const tooMany = await ask({ question: 'x?', projectId, artifactIds: six });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error.code).toBe('invalid_request');

    const tooManyNotes = await ask({
      question: 'x?',
      projectId,
      noteIds: Array.from({ length: 6 }, () => selectedNoteId),
    });
    expect(tooManyNotes.status).toBe(400);
  });

  it('refuses a malformed id', async () => {
    const bad = await ask({ question: 'x?', projectId, artifactIds: ['not-a-uuid'] });
    expect(bad.status).toBe(400);
  });

  it('still answers when the corpus matched nothing and private material was given', async () => {
    const { status, body } = await ask({
      question: 'quaternion holonomy on a Kähler manifold',
      projectId,
      artifactIds: [selectedArtifactId],
    });
    expect(status).toBe(200);
    expect(body.privateContext.items).toHaveLength(1);
    expect(seenPrompt).toContain(SENTINEL.selectedArtifact);
    // Retrieval is still canonical-only, and may legitimately be empty.
    expect(body.retrieval.conceptCount).toBeGreaterThanOrEqual(0);
  });
});

/* -------------------------------------------------------------------------- */

describe('retrieval itself never sees private material', () => {
  it('returns the same canonical concepts with and without a selection', async () => {
    const index = openIndex(corpus.databasePath);
    try {
      const base = retrieve(
        index.db,
        {
          question: 'Why does recall drop after downsampling?',
          mode: 'unstick',
          depth: 'intuitive',
          artifactIds: [],
          noteIds: [],
        },
        { characterBudget: 14_000 },
      );
      const withSelection = retrieve(
        index.db,
        {
          question: 'Why does recall drop after downsampling?',
          mode: 'unstick',
          depth: 'intuitive',
          projectId,
          artifactIds: [selectedArtifactId],
          noteIds: [selectedNoteId],
        },
        { characterBudget: 14_000 },
      );
      expect(withSelection.concepts.map((c) => c.conceptId)).toEqual(
        base.concepts.map((c) => c.conceptId),
      );
    } finally {
      index.close();
    }
  });
});
