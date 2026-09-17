import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import {
  DOTTED_ID,
  MAX_COVERAGE_PAGE,
  atlasStatuses,
  getAtlasOutline,
  getConceptEvidence,
  getCoverageSummary,
  listBacklog,
  listCandidates,
} from '@navigator/core';
import { indexUnavailable, sendError } from '../errors.js';

/**
 * Coverage and evidence (v2 runbook M00).
 *
 * Every route here reads. The canonical database is opened read-only by the
 * process, so there is no write path to close — but it is worth saying plainly
 * that the atlas is served, never edited, over HTTP. Editing it is a Git change
 * to `content/atlas.yaml` reviewed by a person, exactly like a concept page.
 *
 * Lists are capped and paginated. A cap that silently truncates is a lie, so
 * every list response carries `total` and `truncated`.
 */

const pagination = z.strictObject({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit must be at least 1')
    .max(MAX_COVERAGE_PAGE, `limit must be at most ${String(MAX_COVERAGE_PAGE)}`)
    .optional(),
  offset: z.coerce.number().int().min(0, 'offset must not be negative').optional(),
});

const atlasId = z
  .string()
  .min(1)
  .max(200)
  .regex(DOTTED_ID, 'must be a lowercase dotted identifier');

const candidatesQuery = pagination.extend({
  area: atlasId.optional(),
  category: atlasId.optional(),
  status: z.enum(atlasStatuses).optional(),
});

const unresolvedQuery = pagination.extend({
  // Accept `?blocking` with no value, `?blocking=true` and `?blocking=1`.
  blocking: z
    .union([z.literal(''), z.literal('true'), z.literal('1'), z.literal('false'), z.literal('0')])
    .optional(),
});

const conceptIdParams = z.object({
  conceptId: z
    .string()
    .min(1)
    .max(200)
    .regex(DOTTED_ID, 'concept id must be a lowercase dotted identifier'),
});

function invalid(
  request: Parameters<typeof sendError>[0],
  reply: Parameters<typeof sendError>[1],
  issues: readonly { message: string; path: PropertyKey[] }[],
) {
  return sendError(request, reply, 400, 'invalid_query', 'The query parameters are not valid.', {
    issues: issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.map(String).join('.')}: ${issue.message}`
        : issue.message,
    ),
  });
}

export async function registerCoverageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/coverage/summary', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    return reply.send(getCoverageSummary(app.index.db));
  });

  app.get('/api/coverage/atlas', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const areas = getAtlasOutline(app.index.db);
    return reply.send({
      areas,
      // The outline is the whole atlas by construction: it is bounded by the
      // curated file, not by a request, so there is nothing to paginate.
      counts: {
        areas: areas.length,
        categories: areas.reduce((n, area) => n + area.categories, 0),
        candidates: getCoverageSummary(app.index.db).atlas.candidates,
      },
    });
  });

  app.get('/api/coverage/candidates', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = candidatesQuery.safeParse(request.query);
    if (!parsed.success) return invalid(request, reply, parsed.error.issues);
    return reply.send(
      listCandidates(app.index.db, {
        areaId: parsed.data.area,
        categoryId: parsed.data.category,
        status: parsed.data.status,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      }),
    );
  });

  app.get('/api/coverage/unresolved', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = unresolvedQuery.safeParse(request.query);
    if (!parsed.success) return invalid(request, reply, parsed.error.issues);
    const blocking = parsed.data.blocking;
    return reply.send(
      listBacklog(app.index.db, {
        blockingOnly: blocking === '' || blocking === 'true' || blocking === '1',
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      }),
    );
  });

  app.get('/api/evidence/:conceptId', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = conceptIdParams.safeParse(request.params);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_concept_id', 'The concept id is not valid.', {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }
    const evidence = getConceptEvidence(app.index.db, parsed.data.conceptId);
    if (evidence === undefined) {
      return sendError(
        request,
        reply,
        404,
        'concept_not_found',
        `No concept has the id ${parsed.data.conceptId}.`,
      );
    }
    return reply.send(evidence);
  });
}
