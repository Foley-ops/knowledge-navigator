import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { MAX_QUERY_LENGTH, MAX_SEARCH_LIMIT, QueryError, searchConcepts } from '@navigator/core';
import { indexUnavailable, sendError } from '../errors.js';

/** Safe ranked search (runbook E03). */
const searchQuery = z.object({
  q: z
    .string()
    .min(1, 'q must not be empty')
    .max(MAX_QUERY_LENGTH, `q must be at most ${String(MAX_QUERY_LENGTH)} characters`),
  limit: z.coerce.number().int().min(1).max(MAX_SEARCH_LIMIT).default(10),
});

export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/search', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);

    const raw = request.query as Record<string, unknown>;
    const parsed = searchQuery.safeParse({
      q: typeof raw['q'] === 'string' ? raw['q'] : '',
      ...(raw['limit'] === undefined ? {} : { limit: raw['limit'] }),
    });
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_query', 'The search query is not valid.', {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    try {
      const results = searchConcepts(app.index.db, parsed.data.q, parsed.data.limit);
      return reply.send({
        query: parsed.data.q,
        limit: parsed.data.limit,
        count: results.length,
        results: results.map((hit) => ({
          conceptId: hit.conceptId,
          title: hit.title,
          slug: hit.slug,
          summary: hit.summary,
          kind: hit.kind,
          tier: hit.tier,
          reviewState: hit.reviewState,
          matchedAlias: hit.matchedAlias,
          matchKind: hit.matchKind,
          rankExplanation: hit.rankExplanation,
        })),
      });
    } catch (error) {
      if (error instanceof QueryError) {
        return sendError(request, reply, 400, error.code, error.message);
      }
      throw error;
    }
  });
}
