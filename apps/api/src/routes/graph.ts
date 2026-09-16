import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import {
  DOTTED_ID,
  MAX_GRAPH_DEPTH,
  MAX_GRAPH_NODES,
  MIN_GRAPH_DEPTH,
  getNeighborhood,
} from '@navigator/core';
import { indexUnavailable, sendError } from '../errors.js';

/**
 * Bounded neighbourhood retrieval (runbook E04).
 *
 * Depth is clamped to 1–3 and the node count to 200, and truncation is
 * reported rather than hidden, so this endpoint can never be used to pull the
 * whole corpus in one request.
 */
const params = z.object({
  conceptId: z
    .string()
    .min(1)
    .max(200)
    .regex(DOTTED_ID, 'concept id must be a lowercase dotted identifier'),
});

const query = z.object({
  depth: z.coerce.number().int().min(MIN_GRAPH_DEPTH).max(MAX_GRAPH_DEPTH).default(1),
});

export async function registerGraphRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/graph/:conceptId', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);

    const parsedParams = params.safeParse(request.params);
    if (!parsedParams.success) {
      return sendError(request, reply, 400, 'invalid_concept_id', 'The concept id is not valid.', {
        issues: parsedParams.error.issues.map((issue) => issue.message),
      });
    }
    const raw = request.query as Record<string, unknown>;
    const parsedQuery = query.safeParse(raw['depth'] === undefined ? {} : { depth: raw['depth'] });
    if (!parsedQuery.success) {
      return sendError(
        request,
        reply,
        400,
        'invalid_depth',
        `depth must be an integer between ${String(MIN_GRAPH_DEPTH)} and ${String(MAX_GRAPH_DEPTH)}.`,
      );
    }

    const neighborhood = getNeighborhood(
      app.index.db,
      parsedParams.data.conceptId,
      parsedQuery.data.depth,
      MAX_GRAPH_NODES,
    );
    if (neighborhood === undefined) {
      return sendError(
        request,
        reply,
        404,
        'concept_not_found',
        `No concept has the id ${parsedParams.data.conceptId}.`,
      );
    }

    return reply.send({
      centerId: neighborhood.centerId,
      depth: neighborhood.depth,
      nodeLimit: neighborhood.nodeLimit,
      truncated: neighborhood.truncated,
      counts: { nodes: neighborhood.nodes.length, edges: neighborhood.edges.length },
      nodes: neighborhood.nodes,
      edges: neighborhood.edges,
    });
  });
}
