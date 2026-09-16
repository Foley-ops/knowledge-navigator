import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { CONCEPT_SLUG, DOTTED_ID, getConceptById, getConceptBySlug } from '@navigator/core';
import type { ConceptDetail } from '@navigator/core';
import { indexUnavailable, sendError } from '../errors.js';

/**
 * Concept retrieval (runbook E02).
 *
 * The response carries canonical Markdown *source*. Nothing is rendered to
 * HTML here — the browser renders it, and the server never emits markup, so a
 * page can never be turned into server-side HTML injection.
 */
const conceptIdParams = z.object({
  conceptId: z
    .string()
    .min(1)
    .max(200)
    .regex(DOTTED_ID, 'concept id must be a lowercase dotted identifier'),
});

const slugQuery = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(CONCEPT_SLUG, 'slug must look like /concepts/kebab-case-name'),
});

function present(concept: ConceptDetail): Record<string, unknown> {
  return {
    conceptId: concept.id,
    title: concept.title,
    slug: concept.slug,
    kind: concept.kind,
    tier: concept.tier,
    reviewState: concept.reviewState,
    summary: concept.summary,
    aliases: concept.aliases,
    primaryCategory: concept.primaryCategory,
    categories: concept.categories,
    relationships: concept.relationships,
    sources: concept.sources,
    markdown: concept.body,
    provenance: {
      sourcePath: concept.sourcePath,
      contentHash: concept.contentHash,
    },
  };
}

export async function registerConceptRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/concepts/by-slug', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = slugQuery.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_slug', 'The slug parameter is not valid.', {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }
    const concept = getConceptBySlug(app.index.db, parsed.data.slug);
    if (concept === undefined) {
      return sendError(
        request,
        reply,
        404,
        'concept_not_found',
        `No concept has the slug ${parsed.data.slug}.`,
      );
    }
    return reply.send(present(concept));
  });

  app.get('/api/concepts/:conceptId', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = conceptIdParams.safeParse(request.params);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_concept_id', 'The concept id is not valid.', {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }
    const concept = getConceptById(app.index.db, parsed.data.conceptId);
    if (concept === undefined) {
      return sendError(
        request,
        reply,
        404,
        'concept_not_found',
        `No concept has the id ${parsed.data.conceptId}.`,
      );
    }
    return reply.send(present(concept));
  });
}
