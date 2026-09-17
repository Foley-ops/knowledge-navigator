import type { FastifyInstance } from 'fastify';
import { getConceptById } from '@navigator/core';
import type { Database as DatabaseType } from 'better-sqlite3';
import { assistantRequestSchema, retrieve } from '../assistant/index.js';
import {
  EMPTY_PRIVATE_CONTEXT,
  buildPrivateContext,
  describePrivateContext,
} from '../assistant/private-context.js';
import type {
  Citation,
  ProviderFailureCode,
  ResolvedCitation,
  Retrieval,
} from '../assistant/index.js';
import { indexUnavailable, sendError } from '../errors.js';

/**
 * Assistant endpoints (runbook E08).
 *
 * Two promises are kept here. The retrieved canonical material is returned
 * **whether or not generation succeeds**, so a failed model never costs the
 * researcher the evidence the system already found. And the user's question and
 * research context are never written to the log at info level — only counts and
 * the request id are.
 */

/** HTTP status for each way generation can fail. */
const FAILURE_STATUS: Record<ProviderFailureCode, number> = {
  provider_disabled: 503,
  provider_unreachable: 503,
  model_unavailable: 503,
  timeout: 504,
  invalid_model_output: 502,
  fabricated_citation: 502,
  provider_error: 502,
};

/** Attach the canonical address of every citation the model made. */
function resolveCitations(
  db: DatabaseType,
  retrieval: Retrieval,
  citations: readonly Citation[],
): ResolvedCitation[] {
  const sourceById = new Map(
    retrieval.concepts.flatMap((concept) =>
      concept.sources.map((source) => [source.sourceId, source] as const),
    ),
  );
  return citations.map((citation) => {
    if (citation.kind === 'concept') {
      const concept = getConceptById(db, citation.id);
      return { ...citation, slug: concept?.slug ?? null, url: null };
    }
    const source = sourceById.get(citation.id);
    return { ...citation, slug: null, url: source?.url ?? null };
  });
}

/** The evidence view returned alongside every answer and every failure. */
function retrievalView(retrieval: Retrieval): Record<string, unknown> {
  return {
    conceptCount: retrieval.concepts.length,
    characterCount: retrieval.characterCount,
    characterBudget: retrieval.characterBudget,
    truncated: retrieval.truncated,
    queries: retrieval.queries,
    concepts: retrieval.concepts.map((concept) => ({
      conceptId: concept.conceptId,
      title: concept.title,
      slug: concept.slug,
      summary: concept.summary,
      reviewState: concept.reviewState,
      matchKind: concept.matchKind,
      rankExplanation: concept.rankExplanation,
    })),
    sources: [
      ...new Map(
        retrieval.concepts.flatMap((concept) =>
          concept.sources.map((source) => [source.sourceId, source] as const),
        ),
      ).values(),
    ].map((source) => ({
      sourceId: source.sourceId,
      title: source.title,
      url: source.url,
      sourceKind: source.sourceKind,
      supports: source.supports,
      checkedOn: source.checkedOn,
    })),
  };
}

export async function registerAssistantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/assistant/status', async (request, reply) => {
    const status = await app.assistant.status(true);
    return reply.send({
      provider: status.provider,
      available: status.available,
      model: status.model,
      detail: status.detail,
      modes: ['understand', 'unstick', 'compare', 'path'],
      depths: ['quick', 'intuitive', 'formal'],
      requestId: request.id,
    });
  });

  app.post('/api/assistant/query', async (request, reply) => {
    const parsed = assistantRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendError(
        request,
        reply,
        400,
        'invalid_request',
        'The question could not be accepted.',
        {
          issues: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.') || '(root)',
            message: issue.message,
          })),
        },
      );
    }
    if (!app.index.available) return indexUnavailable(request, reply);

    const askedAt = Date.now();
    const retrieval = retrieve(app.index.db, parsed.data, {
      characterBudget: app.config.ASSISTANT_CHARACTER_BUDGET,
    });

    // Private material, only when the researcher named some and only from the
    // project they named. Retrieval above has already run against canonical
    // content alone, so private material can never enter the evidence list or
    // the citable ids.
    const wants =
      parsed.data.projectId !== undefined &&
      (parsed.data.artifactIds.length > 0 || parsed.data.noteIds.length > 0);
    let privateContext = EMPTY_PRIVATE_CONTEXT;
    if (wants && !app.personal.available) {
      return sendError(
        request,
        reply,
        503,
        'personal_store_unavailable',
        app.personal.message ??
          'The private research store is unavailable, so the material you selected could not be read. Ask without it, or fix the store first.',
        { reason: app.personal.reason ?? 'unknown' },
      );
    }
    if (wants) {
      privateContext = buildPrivateContext(app.personal.db, {
        projectId: parsed.data.projectId!,
        artifactIds: parsed.data.artifactIds,
        noteIds: parsed.data.noteIds,
      });
    }

    // Counts only. The question and the research context stay out of the log.
    request.log.info(
      {
        requestId: request.id,
        mode: parsed.data.mode,
        depth: parsed.data.depth,
        questionLength: parsed.data.question.length,
        contextLength: parsed.data.context?.length ?? 0,
        retrievedConcepts: retrieval.concepts.length,
        privateItems: privateContext.items.length,
        privateCharacters: privateContext.characterCount,
      },
      'assistant query',
    );

    const outcome = await app.assistant.generate({
      request: parsed.data,
      retrieval,
      privateContext,
      timeoutMs: app.config.ASSISTANT_TIMEOUT_MS,
    });

    const common = {
      requestId: request.id,
      mode: parsed.data.mode,
      depth: parsed.data.depth,
      provider: app.assistant.name,
      model: outcome.model,
      latencyMs: outcome.latencyMs,
      elapsedMs: Date.now() - askedAt,
      retrieval: retrievalView(retrieval),
      // Kept beside the canonical evidence, never merged into it: ids, labels
      // and counts only, and never a word of the material itself.
      privateContext: describePrivateContext(privateContext),
    };

    if (!outcome.ok) {
      request.log.warn(
        { requestId: request.id, code: outcome.code, provider: app.assistant.name },
        'assistant generation failed',
      );
      return reply.code(FAILURE_STATUS[outcome.code]).send({
        ...common,
        error: {
          code: outcome.code,
          message: outcome.message,
          ...(outcome.detail === undefined ? {} : { detail: outcome.detail }),
        },
        // The evidence survives the failure.
        result: null,
      });
    }

    return reply.send({
      ...common,
      error: null,
      result: {
        ...outcome.result,
        citations: resolveCitations(app.index.db, retrieval, outcome.result.citations),
      },
    });
  });
}
