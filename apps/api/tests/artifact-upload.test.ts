/**
 * Upload endpoints for local research context (v2 runbook P05).
 *
 * The sentinel test is the important one: an uploaded file's *name* and its
 * *contents* are both private, and neither may reach a log line. A paper's
 * title can be the sensitive fact on its own.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { openIndex } from '../src/index-handle.js';
import { openPersonal } from '../src/personal/handle.js';
import { MAX_UPLOAD_BYTES } from '../src/artifacts/index.js';
import { compileAcceptanceCorpus, testConfig } from './helpers.js';
import type { CompiledCorpus } from './helpers.js';

let corpus: CompiledCorpus;
let scratch = '';
let app: FastifyInstance;
let projectId = '';

async function build(logStream?: Writable): Promise<FastifyInstance> {
  const config = testConfig({
    DATABASE_PATH: corpus.databasePath,
    PERSONAL_DATABASE_PATH: join(scratch, `p-${String(Math.random()).slice(2)}.db`),
  });
  return buildApp({
    config,
    index: openIndex(corpus.databasePath),
    personal: openPersonal(config.PERSONAL_DATABASE_PATH),
    ...(logStream === undefined ? {} : { logStream, logLevel: 'info' }),
  });
}

/** A multipart body with one file part, built by hand. */
function multipart(
  fileName: string,
  contents: Uint8Array | string,
  options: { mimetype?: string; label?: string } = {},
): { payload: Buffer; headers: Record<string, string> } {
  const boundary = '----navigatorTestBoundary7f3a';
  const bytes =
    typeof contents === 'string' ? Buffer.from(contents, 'utf8') : Buffer.from(contents);
  const parts: Buffer[] = [];

  if (options.label !== undefined) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="label"\r\n\r\n${options.label}\r\n`,
        'utf8',
      ),
    );
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: ${options.mimetype ?? 'application/octet-stream'}\r\n\r\n`,
      'utf8',
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
  );

  return {
    payload: Buffer.concat(parts),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

async function upload(
  instance: FastifyInstance,
  project: string,
  fileName: string,
  contents: Uint8Array | string,
  options: { mimetype?: string; label?: string } = {},
) {
  const { payload, headers } = multipart(fileName, contents, options);
  const response = await instance.inject({
    method: 'POST',
    url: `/api/personal/projects/${project}/artifacts`,
    payload,
    headers,
  });
  return { status: response.statusCode, body: response.json() as any };
}

const NOTEBOOK = JSON.stringify({
  cells: [
    { cell_type: 'markdown', source: '# Experiment\n' },
    {
      cell_type: 'code',
      source: 'print(1)\n',
      outputs: [{ output_type: 'stream', text: 'SENTINEL-UPLOAD-OUTPUT-4b21\n' }],
    },
  ],
  metadata: { language_info: { name: 'python' } },
});

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  scratch = await mkdtemp(join(tmpdir(), 'navigator-upload-'));
}, 180_000);

afterAll(async () => {
  await app.close();
  await corpus.cleanup();
  await rm(scratch, { recursive: true, force: true });
});

beforeEach(async () => {
  if (app !== undefined) await app.close();
  app = await build();
  const created = await app.inject({
    method: 'POST',
    url: '/api/personal/projects',
    payload: { title: 'Uploads' },
  });
  projectId = (created.json() as { id: string }).id;
});

/* -------------------------------------------------------------------------- */

describe('uploading', () => {
  it('accepts a text file and stores its extraction', async () => {
    const { status, body } = await upload(
      app,
      projectId,
      'notes.md',
      '# Recall\n\nMeasured at 512px.\n',
      { label: 'Recall notes' },
    );
    expect(status).toBe(200);
    expect(body.deduplicated).toBe(false);
    expect(body.artifact.label).toBe('Recall notes');
    expect(body.artifact.originalName).toBe('notes.md');
    expect(body.artifact.mediaType).toBe('text/markdown');
    expect(body.artifact.characterCount).toBeGreaterThan(0);
    expect(body.artifact.sha256).toMatch(/^[0-9a-f]{64}$/);
    // A create response carries metadata, never the text.
    expect(body.artifact.extractedText).toBeUndefined();
  });

  it('falls back to the file name when no label is given', async () => {
    const { body } = await upload(app, projectId, 'paper.txt', 'text');
    expect(body.artifact.label).toBe('paper.txt');
  });

  it('discards notebook outputs', async () => {
    const { status, body } = await upload(app, projectId, 'run.ipynb', NOTEBOOK);
    expect(status).toBe(200);
    const detail = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${projectId}/artifacts/${String(body.artifact.id)}`,
    });
    const text = (detail.json() as { extractedText: string }).extractedText;
    expect(text).toContain('# Experiment');
    expect(text).not.toContain('SENTINEL-UPLOAD-OUTPUT-4b21');
  });

  it('deduplicates the same bytes in one project', async () => {
    await upload(app, projectId, 'a.txt', 'identical');
    const second = await upload(app, projectId, 'renamed.txt', 'identical');
    expect(second.body.deduplicated).toBe(true);

    const list = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${projectId}/artifacts`,
    });
    expect((list.json() as { items: unknown[] }).items).toHaveLength(1);
  });

  it('lists metadata only, and fetches text deliberately', async () => {
    const created = await upload(app, projectId, 'paper.txt', 'the contents');
    const list = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${projectId}/artifacts`,
    });
    const items = (list.json() as { items: Record<string, unknown>[] }).items;
    expect(items).toHaveLength(1);
    expect(items[0]?.['extractedText']).toBeUndefined();
    expect(JSON.stringify(items)).not.toContain('the contents');

    const detail = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${projectId}/artifacts/${String(created.body.artifact.id)}`,
    });
    expect((detail.json() as { extractedText: string }).extractedText).toBe('the contents');
  });

  it('archives and restores', async () => {
    const created = await upload(app, projectId, 'paper.txt', 'text');
    const id = created.body.artifact.id as string;

    await app.inject({
      method: 'POST',
      url: `/api/personal/projects/${projectId}/artifacts/${id}/archive`,
    });
    const hidden = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${projectId}/artifacts`,
    });
    expect((hidden.json() as { items: unknown[] }).items).toHaveLength(0);

    await app.inject({
      method: 'POST',
      url: `/api/personal/projects/${projectId}/artifacts/${id}/restore`,
    });
    const back = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${projectId}/artifacts`,
    });
    expect((back.json() as { items: unknown[] }).items).toHaveLength(1);
  });
});

describe('what is refused', () => {
  it('an unsupported extension, naming what is allowed', async () => {
    const { status, body } = await upload(app, projectId, 'slides.pptx', 'anything');
    expect(status).toBe(415);
    expect(body.error.code).toBe('unsupported_type');
    expect(body.error.details.allowed).toContain('.pdf');
  });

  it('a file over the byte limit', async () => {
    const huge = Buffer.alloc(MAX_UPLOAD_BYTES + 1_024, 0x61);
    const { status, body } = await upload(app, projectId, 'huge.txt', huge);
    expect(status).toBe(413);
    expect(body.error.code).toBe('file_too_large');
  });

  it('binary content wearing a text extension', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
    const { status, body } = await upload(app, projectId, 'image.txt', png);
    expect(status).toBe(422);
    expect(body.error.code).toBe('binary_content');
  });

  it('an empty file and a malformed notebook', async () => {
    expect((await upload(app, projectId, 'empty.txt', '')).status).toBe(422);
    expect((await upload(app, projectId, 'broken.ipynb', '{not json')).status).toBe(422);
  });

  it('a media type that disagrees with a .pdf extension', async () => {
    const { status, body } = await upload(app, projectId, 'paper.pdf', 'not a pdf', {
      mimetype: 'text/plain',
    });
    expect(status).toBe(415);
    expect(body.error.code).toBe('type_mismatch');
    expect(body.error.message).toContain('Nothing was read');
  });

  it('a request that is not multipart', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/personal/projects/${projectId}/artifacts`,
      payload: { file: 'nope' },
    });
    expect(response.statusCode).toBe(415);
  });

  it('a project that does not exist, and one that is not this project', async () => {
    const other = await app.inject({
      method: 'POST',
      url: '/api/personal/projects',
      payload: { title: 'Other' },
    });
    const otherId = (other.json() as { id: string }).id;
    const created = await upload(app, projectId, 'mine.txt', 'mine');
    const id = created.body.artifact.id as string;

    const cross = await app.inject({
      method: 'GET',
      url: `/api/personal/projects/${otherId}/artifacts/${id}`,
    });
    expect(cross.statusCode).toBe(404);

    const missing = await upload(app, '11111111-1111-4111-8111-111111111111', 'x.txt', 'x');
    expect(missing.status).toBe(404);
  });

  it('does not offer DELETE', async () => {
    const created = await upload(app, projectId, 'paper.txt', 'text');
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/personal/projects/${projectId}/artifacts/${String(created.body.artifact.id)}`,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('nothing about an uploaded file reaches the log', () => {
  it('not its name, not its label, not a word of its contents', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(String(chunk));
        callback();
      },
    });

    const logged = await build(stream);
    try {
      const created = await logged.inject({
        method: 'POST',
        url: '/api/personal/projects',
        payload: { title: 'Sentinels' },
      });
      const project = (created.json() as { id: string }).id;

      const S = {
        fileName: 'SENTINEL-FILE-NAME-a71c.md',
        label: 'SENTINEL-ARTIFACT-LABEL-3d90',
        contents: 'SENTINEL-ARTIFACT-CONTENTS-e52f and more prose',
      };

      await upload(logged, project, S.fileName, S.contents, { label: S.label });
      // And the failure paths, where content most often leaks.
      await upload(logged, project, 'SENTINEL-REJECTED-NAME-9ab3.pptx', S.contents);
      await upload(logged, project, 'SENTINEL-EMPTY-NAME-77de.txt', '');

      const captured = lines.join('\n');
      expect(captured.length).toBeGreaterThan(0);
      for (const [name, sentinel] of Object.entries(S)) {
        expect(captured.includes(sentinel), `${name} leaked into the log`).toBe(false);
      }
      expect(captured).not.toContain('SENTINEL-REJECTED-NAME-9ab3');
      expect(captured).not.toContain('SENTINEL-EMPTY-NAME-77de');

      // What it may say: the route and a count.
      expect(captured).toContain('artifacts');
      expect(captured).toContain('characterCount');
    } finally {
      await logged.close();
    }
  });
});

describe('with the private store unavailable', () => {
  it('every artifact route answers 503', async () => {
    const { writeFile } = await import('node:fs/promises');
    const blocker = join(scratch, 'blocker');
    await writeFile(blocker, 'file\n', 'utf8');
    const broken = await buildApp({
      config: testConfig({
        DATABASE_PATH: corpus.databasePath,
        PERSONAL_DATABASE_PATH: join(blocker, 'personal.db'),
      }),
      index: openIndex(corpus.databasePath),
    });
    try {
      const id = '11111111-1111-4111-8111-111111111111';
      for (const url of [
        `/api/personal/projects/${id}/artifacts`,
        `/api/personal/projects/${id}/artifacts/${id}`,
      ]) {
        const response = await broken.inject({ method: 'GET', url });
        expect(response.statusCode, url).toBe(503);
      }
      const posted = await upload(broken, id, 'x.txt', 'x');
      expect(posted.status).toBe(503);
    } finally {
      await broken.close();
    }
  });
});
