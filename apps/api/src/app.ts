import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { assertProviderAllowed, loadConfig } from './config.js';
import type { Config } from './config.js';
import { loggerOptions } from './logger.js';
import { openIndex } from './index-handle.js';
import type { IndexHandle } from './index-handle.js';
import { openPersonal } from './personal/handle.js';
import type { PersonalHandle } from './personal/handle.js';
import { registerRoutes } from './routes/index.js';
import { createProvider } from './assistant/index.js';
import { registerSafety } from './safety.js';
import type { AssistantProvider } from './assistant/types.js';

export interface BuildAppOptions {
  readonly config?: Config;
  /** Supply an already-opened index. Tests use this to simulate failures. */
  readonly index?: IndexHandle;
  /** Supply an already-opened personal store. Tests use this for isolation. */
  readonly personal?: PersonalHandle;
  /** Replace the configured assistant provider. Tests use this for mocking. */
  readonly assistant?: AssistantProvider;
  /** Replace global fetch for the ollama provider, for mock-server tests. */
  readonly fetchImpl?: typeof fetch;
  /**
   * Send log output somewhere the caller can read. The redaction audit uses
   * this to drive every route and inspect what was actually written.
   */
  readonly logStream?: NodeJS.WritableStream;
  /** Log level override, so the audit can turn logging on inside a test. */
  readonly logLevel?: string;
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
  // The private store is opened separately from the canonical index and is the
  // only writable database in the process. An unavailable one is not fatal:
  // browsing and search do not depend on it, and its routes say 503 honestly.
  const personal = options.personal ?? openPersonal(config.PERSONAL_DATABASE_PATH);

  const baseLogger = loggerOptions(config);
  const app = Fastify({
    logger: {
      ...baseLogger,
      ...(options.logLevel === undefined ? {} : { level: options.logLevel }),
      ...(options.logStream === undefined ? {} : { stream: options.logStream }),
    },
    genReqId: () => globalThis.crypto.randomUUID(),
    trustProxy: false,
    bodyLimit: config.BODY_LIMIT_BYTES,
    requestTimeout: config.REQUEST_TIMEOUT_MS,
    connectionTimeout: config.REQUEST_TIMEOUT_MS,
  });

  app.decorate('config', config);
  app.decorate('index', index);
  app.decorate('personal', personal);
  app.decorate('assistant', options.assistant ?? createProvider(config, options.fetchImpl));

  app.addHook('onClose', async () => {
    // Only close an index this instance opened; an injected one belongs to the
    // test that supplied it.
    if (options.index === undefined) index.close();
    if (options.personal === undefined) personal.close();
  });

  await registerSafety(app);
  await registerRoutes(app);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
    index: IndexHandle;
    personal: PersonalHandle;
    assistant: AssistantProvider;
  }
}
