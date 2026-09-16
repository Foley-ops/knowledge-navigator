import type { FastifyInstance } from 'fastify';
import { getBuildInfo } from '@navigator/core';
import { describeProvider } from '../assistant/index.js';
import { indexUnavailable } from '../errors.js';

/**
 * Operations endpoints (runbook E01).
 *
 * Neither endpoint reveals configuration secrets: the assistant status reports
 * the provider name, the model name and reachability, never a URL containing
 * credentials or any part of a user's research context.
 */
export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async (request, reply) => {
    const { index } = app;
    const provider = await describeProvider(app, { probe: false });
    const status = index.available ? 'ok' : 'degraded';
    return reply.code(index.available ? 200 : 503).send({
      status,
      database: index.available
        ? { available: true, schemaVersion: index.schemaVersion }
        : { available: false, reason: index.reason, message: index.message },
      assistant: { provider: provider.provider, available: provider.available },
      requestId: request.id,
    });
  });

  app.get('/api/build', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const info = getBuildInfo(app.index.db);
    return reply.send({
      schemaVersion: info.schemaVersion,
      corpusHash: info.corpusHash,
      builtAt: info.builtAt,
      generator: info.generator,
      counts: info.counts,
      tiers: info.tiers,
      reviewStates: info.reviewStates,
    });
  });
}
