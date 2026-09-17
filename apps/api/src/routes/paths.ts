import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { DOTTED_ID, buildLearningPath } from '@navigator/core';
import type { PathFamiliarity } from '@navigator/core';
import { indexUnavailable, sendError } from '../errors.js';
import { familiarityMap } from '../personal/index.js';

/**
 * Learning paths (v2 runbook Q06).
 *
 * The route is computed from declared prerequisite relationships alone. When
 * the corpus records none, the response says so and lists what is missing —
 * it never falls back to "related concepts" arranged in a plausible order,
 * because a route the corpus does not support is a route nobody checked.
 *
 * Familiarity is read from the private store only when the researcher names a
 * project, and every record that changed the result is reported back.
 */

const body = z.strictObject({
  targetId: z.string().regex(DOTTED_ID, 'targetId must be a lowercase dotted identifier'),
  /** Concepts the researcher says they already know. */
  known: z.array(z.string().regex(DOTTED_ID)).max(200).default([]),
  /** Concepts to keep in the route even if familiarity would skip them. */
  include: z.array(z.string().regex(DOTTED_ID)).max(200).default([]),
  /** Read familiarity from this project's owner. Omit to ignore familiarity. */
  projectId: z.string().uuid().optional(),
});

export async function registerPathRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/paths', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = body.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_request', 'The path request is not valid.', {
        issues: parsed.error.issues.map((issue) =>
          issue.path.length > 0
            ? `${issue.path.map(String).join('.')}: ${issue.message}`
            : issue.message,
        ),
      });
    }

    // Familiarity is personal. It is read only when a project is named, and a
    // store that cannot be opened simply means no familiarity — the route is
    // still built, just without personalisation, and the response says so.
    let familiarity: ReadonlyMap<string, PathFamiliarity> | undefined;
    let familiarityAvailable = true;
    if (parsed.data.projectId !== undefined) {
      if (app.personal.available) {
        familiarity = familiarityMap(app.personal.db) as ReadonlyMap<string, PathFamiliarity>;
      } else {
        familiarityAvailable = false;
      }
    }

    const path = buildLearningPath(app.index.db, parsed.data.targetId, {
      known: parsed.data.known,
      include: parsed.data.include,
      familiarity,
    });

    request.log.info(
      {
        requestId: request.id,
        steps: path.steps.length,
        reachable: path.reachable,
        familiarityUsed: familiarity?.size ?? 0,
      },
      'path built',
    );

    return reply.send({
      requestId: request.id,
      ...path,
      familiarityAvailable,
    });
  });
}
