/**
 * E01 — health and build endpoints.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@navigator/core';
import { buildAppWithoutIndex, buildTestApp, compileAcceptanceCorpus } from './helpers.js';
import type { CompiledCorpus, TestApp } from './helpers.js';

let corpus: CompiledCorpus;
let healthy: TestApp;
let degraded: TestApp;

beforeAll(async () => {
  corpus = await compileAcceptanceCorpus();
  healthy = await buildTestApp(corpus.databasePath);
  degraded = await buildAppWithoutIndex();
}, 60_000);

afterAll(async () => {
  await healthy.close();
  await degraded.close();
  await corpus.cleanup();
});

describe('GET /api/health', () => {
  it('reports ok when the index and provider are both describable', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body['status']).toBe('ok');
    expect(body['database']).toEqual({ available: true, schemaVersion: SCHEMA_VERSION });
    expect(body['assistant']).toMatchObject({ provider: 'disabled' });
    expect(typeof body['requestId']).toBe('string');
  });

  it('reports degraded with a reason when the database is missing', async () => {
    const response = await degraded.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(503);
    const body = response.json() as { status: string; database: Record<string, unknown> };
    expect(body.status).toBe('degraded');
    expect(body.database['available']).toBe(false);
    expect(body.database['reason']).toBe('missing');
    expect(String(body.database['message'])).toContain('No compiled index');
  });

  it('leaks no configuration secrets', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/health' });
    const text = response.body;
    expect(text).not.toContain('OLLAMA_BASE_URL');
    expect(text).not.toContain('host.docker.internal');
    expect(text).not.toContain('DATABASE_PATH');
    expect(text).not.toContain(corpus.databasePath);
  });
});

describe('GET /api/build', () => {
  it('reports schema version, corpus hash, counts and build time', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/build' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      schemaVersion: number;
      corpusHash: string;
      builtAt: string;
      generator: string;
      counts: Record<string, number>;
      tiers: Record<string, number>;
      reviewStates: Record<string, number>;
    };
    expect(body.schemaVersion).toBe(SCHEMA_VERSION);
    expect(body.corpusHash).toMatch(/^[0-9a-f]{64}$/);
    expect(body.builtAt).toBe('2023-11-14T22:13:20.000Z');
    expect(body.generator).toBe('@navigator/core');
    expect(body.counts['concepts']).toBe(11);
    expect(body.counts['relationships']).toBe(20);
    expect(body.counts['sources']).toBe(19);
    expect(body.tiers).toEqual({ '1': 11 });
    expect(body.reviewStates).toEqual({ 'generated-draft': 11 });
  });

  it('returns a structured 503 when the database is missing', async () => {
    const response = await degraded.app.inject({ method: 'GET', url: '/api/build' });
    expect(response.statusCode).toBe(503);
    const body = response.json() as { error: { code: string; message: string; details: unknown } };
    expect(body.error.code).toBe('index_unavailable');
    expect(body.error.message).toContain('No compiled index');
    expect(body.error.details).toEqual({ reason: 'missing' });
  });

  it('does not expose the database path', async () => {
    const response = await healthy.app.inject({ method: 'GET', url: '/api/build' });
    expect(response.body).not.toContain(corpus.databasePath);
  });
});
