/**
 * E09 — safety limits.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { openIndex } from '../src/index-handle.js';
import { loadConfig } from '../src/config.js';
import { buildTestApp, compileAcceptanceCorpus, CONTENT_DIR } from './helpers.js';
import type { CompiledCorpus, TestApp } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import type { IndexHandle } from '../src/index-handle.js';

let corpus: CompiledCorpus;
let api: TestApp;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  api = await buildTestApp(corpus.databasePath, { ASSISTANT_PROVIDER: 'fixture' });
}, 60_000);

afterAll(async () => {
  await api.close();
  await corpus.cleanup();
});

/** Build a one-off app with specific overrides. */
async function withApp(
  overrides: Record<string, string>,
  run: (app: FastifyInstance) => Promise<void>,
): Promise<void> {
  const config = loadConfig({
    NODE_ENV: 'test',
    ASSISTANT_PROVIDER: 'fixture',
    CONTENT_PATH: CONTENT_DIR,
    DATABASE_PATH: corpus.databasePath,
    ...overrides,
  });
  let index: IndexHandle | undefined;
  let app: FastifyInstance | undefined;
  try {
    index = openIndex(corpus.databasePath);
    app = await buildApp({ config, index });
    await run(app);
  } finally {
    if (app !== undefined) await app.close();
    index?.close();
  }
}

describe('body size limit', () => {
  it('refuses a body larger than the configured limit', async () => {
    const response = await api.app.inject({
      method: 'POST',
      url: '/api/assistant/query',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ question: 'x', context: 'y'.repeat(200_000) }),
    });
    expect(response.statusCode).toBe(413);
    const body = response.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('payload_too_large');
    expect(body.error.message).toContain('byte limit');
  });

  it('refuses an over-long context inside an otherwise small body', async () => {
    const response = await api.app.inject({
      method: 'POST',
      url: '/api/assistant/query',
      payload: { question: 'ok', context: 'c'.repeat(9_000) },
    });
    expect(response.statusCode).toBe(400);
    expect((response.json() as any).error.code).toBe('invalid_request');
  });

  it('accepts a body inside the limit', async () => {
    const response = await api.app.inject({
      method: 'POST',
      url: '/api/assistant/query',
      payload: { question: 'What should I check next?', context: 'c'.repeat(5_000) },
    });
    expect(response.statusCode).toBe(200);
  });
});

describe('rate limiting', () => {
  it('refuses once the window allowance is spent, and says when to retry', async () => {
    await withApp({ RATE_LIMIT_MAX: '3', RATE_LIMIT_WINDOW_MS: '60000' }, async (app) => {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i += 1) {
        const response = await app.inject({ method: 'GET', url: '/api/health' });
        statuses.push(response.statusCode);
        if (response.statusCode === 429) {
          const body = response.json() as { error: { code: string; message: string } };
          expect(body.error.code).toBe('rate_limited');
          expect(body.error.message).toContain('Too many requests');
          expect(body.error.message).toContain('try again in');
        }
      }
      expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
      expect(statuses.slice(0, 3).every((s) => s !== 429)).toBe(true);
    });
  });

  it('sets rate limit headers', async () => {
    await withApp({ RATE_LIMIT_MAX: '5' }, async (app) => {
      const response = await app.inject({ method: 'GET', url: '/api/health' });
      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  it('leaves a generous default allowance for normal browsing', async () => {
    const response = await api.app.inject({ method: 'GET', url: '/api/health' });
    expect(Number(response.headers['x-ratelimit-limit'])).toBe(600);
  });
});

describe('cross-origin access', () => {
  it('allows the localhost web origins', async () => {
    for (const origin of ['http://127.0.0.1:3000', 'http://localhost:3000']) {
      const response = await api.app.inject({
        method: 'GET',
        url: '/api/health',
        headers: { origin },
      });
      expect(response.headers['access-control-allow-origin'], origin).toBe(origin);
    }
  });

  it('refuses an origin that is not on the list', async () => {
    for (const origin of ['https://evil.example', 'http://127.0.0.1:9999', 'null']) {
      const response = await api.app.inject({
        method: 'GET',
        url: '/api/health',
        headers: { origin },
      });
      expect(response.headers['access-control-allow-origin'], origin).toBeUndefined();
    }
  });

  it('allows a same-origin request that sends no Origin header', async () => {
    const response = await api.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
  });

  it('honours a configured origin list', async () => {
    await withApp({ ALLOWED_ORIGINS: 'http://127.0.0.1:4173' }, async (app) => {
      const allowed = await app.inject({
        method: 'GET',
        url: '/api/health',
        headers: { origin: 'http://127.0.0.1:4173' },
      });
      expect(allowed.headers['access-control-allow-origin']).toBe('http://127.0.0.1:4173');

      const refused = await app.inject({
        method: 'GET',
        url: '/api/health',
        headers: { origin: 'http://127.0.0.1:3000' },
      });
      expect(refused.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});

describe('secure response headers', () => {
  it('sets the headers helmet provides', async () => {
    const response = await api.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(String(response.headers['content-security-policy'])).toContain("default-src 'none'");
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('error shape', () => {
  it('returns a structured 404 for an unknown route', async () => {
    const response = await api.app.inject({ method: 'GET', url: '/api/nope' });
    expect(response.statusCode).toBe(404);
    const body = response.json() as { error: { code: string }; requestId: string };
    expect(body.error.code).toBe('route_not_found');
    expect(body.requestId).toBeTruthy();
  });

  it('omits internal detail from 500s in production', async () => {
    await withApp(
      { NODE_ENV: 'production', ASSISTANT_PROVIDER: 'disabled', LOG_LEVEL: 'silent' },
      async (app) => {
        app.get('/api/boom', () => {
          throw new Error('a very specific internal detail nobody should see');
        });
        const response = await app.inject({ method: 'GET', url: '/api/boom' });
        expect(response.statusCode).toBe(500);
        const text = response.body;
        expect(text).not.toContain('a very specific internal detail');
        expect(text).not.toContain('at Object');
        expect(text).not.toContain('.ts:');
        const body = response.json() as { error: { code: string; message: string } };
        expect(body.error.code).toBe('internal_error');
        expect(body.error.message).toContain('request id');
      },
    );
  });

  it('keeps the message in development, but never a stack trace', async () => {
    await withApp({ NODE_ENV: 'development', LOG_LEVEL: 'silent' }, async (app) => {
      app.get('/api/boom', () => {
        throw new Error('a very specific internal detail');
      });
      const response = await app.inject({ method: 'GET', url: '/api/boom' });
      expect(response.statusCode).toBe(500);
      expect(response.body).toContain('a very specific internal detail');
      expect(response.body).not.toContain('at Object');
      expect(response.body).not.toContain('.ts:');
    });
  });

  it('rejects a malformed JSON body without leaking internals', async () => {
    const response = await api.app.inject({
      method: 'POST',
      url: '/api/assistant/query',
      headers: { 'content-type': 'application/json' },
      payload: '{ not json',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('.ts:');
    expect((response.json() as any).requestId).toBeTruthy();
  });
});
