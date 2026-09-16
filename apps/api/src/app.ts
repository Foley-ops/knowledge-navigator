import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { loadConfig, assertProviderAllowed } from './config.js';
import type { Config } from './config.js';
import { loggerOptions } from './logger.js';

export interface BuildAppOptions {
  readonly config?: Config;
}

/**
 * Build the API instance without listening on a socket, so tests can drive it
 * entirely in memory through `app.inject()`.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  assertProviderAllowed(config);

  const app = Fastify({
    logger: loggerOptions(config),
    genReqId: () => globalThis.crypto.randomUUID(),
    trustProxy: false,
  });

  app.decorate('config', config);

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}
