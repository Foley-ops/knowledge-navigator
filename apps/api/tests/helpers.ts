/**
 * Shared API test setup: compile the real acceptance corpus once into a
 * temporary database, then build app instances against it.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCorpus } from '@navigator/core';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import type { Config } from '../src/config.js';
import { openIndex } from '../src/index-handle.js';
import type { IndexHandle } from '../src/index-handle.js';

export const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
export const CONTENT_DIR = join(REPO_ROOT, 'content', 'concepts');

export interface CompiledCorpus {
  readonly root: string;
  readonly databasePath: string;
  cleanup(): Promise<void>;
}

/** Compile the acceptance corpus into a throwaway directory. */
export async function compileAcceptanceCorpus(): Promise<CompiledCorpus> {
  const root = await mkdtemp(join(tmpdir(), 'navigator-api-'));
  const databasePath = join(root, 'knowledge.db');
  const result = await compileCorpus({
    contentDir: CONTENT_DIR,
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  if (!result.ok) {
    await rm(root, { recursive: true, force: true });
    throw new Error(
      `acceptance corpus failed to compile:\n${result.diagnostics
        .map((d) => `${d.file} ${d.field}: ${d.message}`)
        .join('\n')}`,
    );
  }
  return {
    root,
    databasePath,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export function testConfig(overrides: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: 'test',
    ASSISTANT_PROVIDER: 'disabled',
    CONTENT_PATH: CONTENT_DIR,
    ...overrides,
  });
}

export interface TestApp {
  readonly app: FastifyInstance;
  readonly index: IndexHandle;
  close(): Promise<void>;
}

/** Build an app bound to a compiled index. */
export async function buildTestApp(
  databasePath: string,
  overrides: Record<string, string> = {},
): Promise<TestApp> {
  const config = testConfig({ DATABASE_PATH: databasePath, ...overrides });
  const index = openIndex(databasePath);
  const app = await buildApp({ config, index });
  return {
    app,
    index,
    close: async () => {
      await app.close();
      index.close();
    },
  };
}

/** Build an app whose index is deliberately unavailable. */
export async function buildAppWithoutIndex(
  overrides: Record<string, string> = {},
): Promise<TestApp> {
  const missing = join(tmpdir(), 'navigator-does-not-exist', 'knowledge.db');
  const config = testConfig({ DATABASE_PATH: missing, ...overrides });
  const index = openIndex(missing);
  const app = await buildApp({ config, index });
  return { app, index, close: async () => app.close() };
}
