import { assistantResultSchema } from './types.js';
import type {
  AssistantProvider,
  GenerateInput,
  ProviderOutcome,
  ProviderStatus,
  RetrievedConcept,
} from './types.js';

/**
 * The `fixture` provider (runbook §4.4).
 *
 * A deterministic test double: the same request and the same retrieved material
 * always produce the same structured result. It never contacts a model and it
 * never invents a citation — every citation it emits is taken from the
 * retrieved material it was given, which is exactly the property the real
 * provider is validated against.
 *
 * It is refused when NODE_ENV=production; see `assertProviderAllowed`.
 */
const DEPTH_NOTE = {
  quick: 'Answered at quick depth: the shortest defensible reading.',
  intuitive: 'Answered at intuitive depth: the mechanism in words before the formalism.',
  formal: 'Answered at formal depth: the statement and its conditions.',
} as const;

const MODE_FRAME = {
  understand: 'Read as a request to understand an idea',
  unstick: 'Read as a request for a defensible next move',
  compare: 'Read as a request to compare nearby approaches',
  path: 'Read as a request for a route through prerequisites',
} as const;

function routeFor(concept: RetrievedConcept): {
  title: string;
  rationale: string;
  conceptIds: string[];
} {
  return {
    title: `Inspect ${concept.title}`,
    rationale: `${concept.summary} This concept was retrieved because ${concept.rankExplanation}.`,
    conceptIds: [concept.conceptId],
  };
}

export function createFixtureProvider(): AssistantProvider {
  return {
    name: 'fixture',
    status: (): Promise<ProviderStatus> =>
      Promise.resolve({
        provider: 'fixture',
        available: true,
        model: 'fixture',
        detail:
          'Deterministic test provider. It returns a fixed structure built from the retrieved material and never contacts a model.',
      }),

    generate: ({ request, retrieval }: GenerateInput): Promise<ProviderOutcome> => {
      const concepts = retrieval.concepts;
      const titles = concepts.map((concept) => concept.title);

      const result = assistantResultSchema.parse({
        interpretation: `${MODE_FRAME[request.mode]}: "${request.question}"${
          request.context === undefined ? '' : ' with additional research context supplied'
        }. ${DEPTH_NOTE[request.depth]}`,
        answer:
          concepts.length === 0
            ? 'No canonical concept in this knowledge base matched the question closely enough to ground an answer. Nothing here should be treated as evidence about the question.'
            : `The knowledge base has material on ${titles.join(', ')}. Every statement below is drawn only from those pages, which are all marked ${[
                ...new Set(concepts.map((concept) => concept.reviewState)),
              ].join(', ')} and have not been verified against their sources by a human.`,
        candidateRoutes: concepts.slice(0, 3).map(routeFor),
        assumptions:
          concepts.length === 0
            ? []
            : [
                'The question concerns the same sense of these terms as the retrieved concepts.',
                `Retrieved material is ${[...new Set(concepts.map((c) => c.reviewState))].join(', ')}, so it is unverified.`,
              ],
        disqualifiers:
          concepts.length === 0
            ? ['No grounding material was retrieved, so no route can be recommended.']
            : ['A route is not applicable if its stated assumptions do not hold for your setup.'],
        missingInformation: [
          'The concrete setting: data, model, sizes and what has already been tried.',
          'What "working" would look like, so a next check can be judged.',
        ],
        nextChecks: concepts
          .slice(0, 3)
          .map(
            (concept) =>
              `Read the assumptions section of ${concept.title} and decide whether they hold.`,
          ),
        citations: [
          ...concepts.map((concept) => ({
            kind: 'concept' as const,
            id: concept.conceptId,
            label: concept.title,
          })),
          ...concepts.flatMap((concept) =>
            concept.sources.map((source) => ({
              kind: 'source' as const,
              id: source.sourceId,
              label: source.title,
            })),
          ),
        ],
        confidence: concepts.length === 0 ? 'low' : 'medium',
      });

      return Promise.resolve({ ok: true, result, model: 'fixture', latencyMs: 0 });
    },
  };
}
