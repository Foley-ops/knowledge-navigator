import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import {
  ComparisonError,
  DOTTED_ID,
  MAX_COMPARED,
  MIN_COMPARED,
  compareConcepts,
  renderComparisonForPrompt,
} from '@navigator/core';
import type { Comparison } from '@navigator/core';
import { sendError } from '../errors.js';
import { indexUnavailable } from '../errors.js';
import { buildPrivateContext, EMPTY_PRIVATE_CONTEXT } from '../assistant/private-context.js';
import { describePrivateContext } from '../assistant/private-context.js';
import type { Retrieval, RetrievedConcept } from '../assistant/types.js';

/**
 * Comparison (v2 runbook Q01, Q03).
 *
 * `POST /api/compare` builds the deterministic table and returns it. It calls
 * no model and cannot fail for a model's reasons.
 *
 * `POST /api/compare/explain` asks the local model to read that table aloud.
 * The prompt receives **the table and nothing else** — no page bodies beyond
 * the cells already in it — plus any private material the researcher selected.
 * Citation containment is the ordinary one: the model may cite the compared
 * concepts and the sources they cite, and nothing else. If it cites anything
 * else the synthesis is discarded and the table is returned unchanged, because
 * the table is the part that was true to begin with.
 */

const conceptId = z.string().regex(DOTTED_ID, 'must be a lowercase dotted identifier');

const compareBody = z.strictObject({
  conceptIds: z
    .array(conceptId)
    .min(MIN_COMPARED, `a comparison needs at least ${String(MIN_COMPARED)} concepts`)
    .max(MAX_COMPARED + 2, 'too many concepts'),
});

const explainBody = compareBody.extend({
  depth: z.enum(['quick', 'intuitive', 'formal']).default('intuitive'),
  projectId: z.string().uuid().optional(),
  artifactIds: z.array(z.string().uuid()).max(5).default([]),
  noteIds: z.array(z.string().uuid()).max(5).default([]),
});

/**
 * Turn the table into the material the model may read and cite.
 *
 * Each concept's "excerpt" is its own column of the table, so the prompt
 * contains exactly the deterministic comparison and no other page text. The
 * citable ids fall out of this automatically: the compared concepts, and the
 * sources they cite.
 */
function comparisonRetrieval(comparison: Comparison): Retrieval {
  const concepts: RetrievedConcept[] = comparison.concepts.map((concept) => {
    const column = comparison.rows
      .map((row) => {
        const cell = row.cells.find((candidate) => candidate.conceptId === concept.conceptId);
        if (cell === undefined) return null;
        return cell.value === null
          ? `${row.label}: (MISSING — do not fill this in)`
          : `${row.label}: ${cell.value}`;
      })
      .filter((line): line is string => line !== null)
      .join('\n');

    return {
      conceptId: concept.conceptId,
      title: concept.title,
      slug: concept.slug,
      summary: concept.summary,
      reviewState: concept.reviewState,
      matchKind: 'exact-title',
      rankExplanation: 'selected for this comparison',
      excerpt: column,
      relationships: (comparison.relationships[concept.conceptId] ?? []).map((edge) => ({
        direction: edge.direction,
        type: edge.type,
        otherId: edge.otherId,
        otherTitle: edge.otherTitle,
      })),
      sources: comparison.sources
        .filter((source) => source.citedBy.includes(concept.conceptId))
        .map((source) => ({
          sourceId: source.sourceId,
          title: source.title,
          url: source.url,
          sourceKind: source.sourceKind,
          supports: [...source.supports],
          checkedOn: source.checkedOn,
        })),
    };
  });

  const characterCount = concepts.reduce((sum, concept) => sum + concept.excerpt.length, 0);
  return {
    concepts,
    queries: [],
    characterCount,
    characterBudget: characterCount,
    truncated: false,
  };
}

export async function registerCompareRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/compare', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = compareBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_request', 'The comparison is not valid.', {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }
    try {
      return reply.send(compareConcepts(app.index.db, parsed.data.conceptIds));
    } catch (error) {
      if (error instanceof ComparisonError) {
        return sendError(
          request,
          reply,
          error.code === 'unknown-concept' ? 404 : 400,
          error.code === 'unknown-concept' ? 'concept_not_found' : 'invalid_request',
          error.message,
          error.detail.length > 0 ? { conceptIds: error.detail } : undefined,
        );
      }
      throw error;
    }
  });

  app.post('/api/compare/explain', async (request, reply) => {
    if (!app.index.available) return indexUnavailable(request, reply);
    const parsed = explainBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendError(request, reply, 400, 'invalid_request', 'The comparison is not valid.', {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    let comparison: Comparison;
    try {
      comparison = compareConcepts(app.index.db, parsed.data.conceptIds);
    } catch (error) {
      if (error instanceof ComparisonError) {
        return sendError(
          request,
          reply,
          error.code === 'unknown-concept' ? 404 : 400,
          error.code === 'unknown-concept' ? 'concept_not_found' : 'invalid_request',
          error.message,
          error.detail.length > 0 ? { conceptIds: error.detail } : undefined,
        );
      }
      throw error;
    }

    const wants =
      parsed.data.projectId !== undefined &&
      (parsed.data.artifactIds.length > 0 || parsed.data.noteIds.length > 0);
    const privateContext =
      wants && app.personal.available
        ? buildPrivateContext(app.personal.db, {
            projectId: parsed.data.projectId!,
            artifactIds: parsed.data.artifactIds,
            noteIds: parsed.data.noteIds,
          })
        : EMPTY_PRIVATE_CONTEXT;

    const titles = comparison.concepts.map((concept) => concept.title).join(' and ');
    const outcome = await app.assistant.generate({
      request: {
        question: `Explain this comparison of ${titles}. Say what each trades away and under what conditions the comparison changes. Where a cell is marked MISSING, say that this corpus does not record it — do not supply it.`,
        context: renderComparisonForPrompt(comparison),
        mode: 'compare',
        depth: parsed.data.depth,
        artifactIds: [],
        noteIds: [],
      },
      retrieval: comparisonRetrieval(comparison),
      privateContext,
      timeoutMs: app.config.ASSISTANT_TIMEOUT_MS,
    });

    request.log.info(
      {
        requestId: request.id,
        concepts: comparison.concepts.length,
        missingCells: comparison.completeness.missing,
        ok: outcome.ok,
      },
      'comparison synthesis',
    );

    // The table is returned either way. A failed synthesis costs the reader
    // nothing that was already true.
    return reply.send({
      requestId: request.id,
      comparison,
      privateContext: describePrivateContext(privateContext),
      provider: app.assistant.name,
      model: outcome.model,
      latencyMs: outcome.latencyMs,
      synthesis: outcome.ok ? outcome.result : null,
      error: outcome.ok
        ? null
        : {
            code: outcome.code,
            message: outcome.message,
            ...(outcome.detail === undefined ? {} : { detail: outcome.detail }),
          },
    });
  });
}
