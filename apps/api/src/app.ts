import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { assertProviderAllowed, loadConfig } from './config.js';
import type { Config } from './config.js';
import { loggerOptions } from './logger.js';
import { openIndex } from './index-handle.js';
import type { IndexHandle } from './index-handle.js';
import { registerRoutes } from './routes/index.js';
import { createProvider } from './assistant/index.js';
import { registerSafety } from './safety.js';
import type { AssistantProvider } from './assistant/types.js';

export interface BuildAppOptions {
  readonly config?: Config;
  /** Supply an already-opened index. Tests use this to simulate failures. */
  readonly index?: IndexHandle;
  /** Replace the configured assistant provider. Tests use this for mocking. */
  readonly assistant?: AssistantProvider;
  /** Replace global fetch for the ollama provider, for mock-server tests. */
  readonly fetchImpl?: typeof fetch;
}

/**
 * Build the API instance without listening on a socket, so tests can drive it
 * entirely in memory through `app.inject()`.
 *
 * An unavailable index is *not* fatal here — the health endpoint has to be able
 * to report it. `server.ts` is what refuses to start without one.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  assertProviderAllowed(config);

  const index = options.index ?? openIndex(config.DATABASE_PATH);

  const app = Fastify({
    logger: loggerOptions(config),
    genReqId: () => globalThis.crypto.randomUUID(),
    trustProxy: false,
    bodyLimit: config.BODY_LIMIT_BYTES,
    requestTimeout: config.REQUEST_TIMEOUT_MS,
    connectionTimeout: config.REQUEST_TIMEOUT_MS,
  });

  app.decorate('config', config);
  app.decorate('index', index);
  app.decorate('assistant', options.assistant ?? createProvider(config, options.fetchImpl));

  app.addHook('onClose', async () => {
    // Only close an index this instance opened; an injected one belongs to the
    // test that supplied it.
    if (options.index === undefined) index.close();
  });

  await registerSafety(app);
  await registerRoutes(app);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
    index: IndexHandle;
    assistant: AssistantProvider;
  }
}
