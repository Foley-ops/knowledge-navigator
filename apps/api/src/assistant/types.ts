/**
 * Assistant contract (runbook §4.3, §4.4).
 *
 * The structured result is the product's core promise: evidence and
 * uncertainty are separated, and nothing is presented as established unless it
 * is. The Zod schema here is what model output must satisfy before the API will
 * return it — an invalid generation produces a safe error plus the retrieved
 * sources, never an invented structure that merely looks valid.
 */
import { z } from 'zod';
import type { AssistantProviderName } from '../config.js';
import type { PrivateContext } from './private-context.js';

export const assistantModes = ['understand', 'unstick', 'compare', 'path'] as const;
export type AssistantMode = (typeof assistantModes)[number];

export const assistantDepths = ['quick', 'intuitive', 'formal'] as const;
export type AssistantDepth = (typeof assistantDepths)[number];

export const confidenceLevels = ['low', 'medium', 'high'] as const;
export type Confidence = (typeof confidenceLevels)[number];

export const MAX_QUESTION_LENGTH = 2_000;
export const MAX_CONTEXT_LENGTH = 8_000;

/** What the browser sends. */
export const assistantRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'question must not be empty')
    .max(MAX_QUESTION_LENGTH, `question must be at most ${String(MAX_QUESTION_LENGTH)} characters`),
  context: z
    .string()
    .trim()
    .max(MAX_CONTEXT_LENGTH, `context must be at most ${String(MAX_CONTEXT_LENGTH)} characters`)
    .optional(),
  mode: z.enum(assistantModes).default('unstick'),
  depth: z.enum(assistantDepths).default('intuitive'),
  /**
   * Private material the researcher selected for THIS request (v2 §4.9).
   *
   * Absent by default. Nothing is included because it exists, was uploaded
   * recently, or belongs to the current project: only ids listed here reach
   * the model, and only from the project named here. The caps are the
   * contract's — at most five artifacts and five notes.
   */
  projectId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  artifactIds: z.array(z.string().uuid()).max(5).default([]),
  noteIds: z.array(z.string().uuid()).max(5).default([]),
});
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

const shortText = z.string().trim().min(1).max(1_000);
const longText = z.string().trim().min(1).max(8_000);

export const candidateRouteSchema = z.object({
  title: shortText,
  rationale: longText,
  /** Concept ids from the supplied material that support this route. */
  conceptIds: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
});
export type CandidateRoute = z.infer<typeof candidateRouteSchema>;

export const citationSchema = z.object({
  kind: z.enum(['concept', 'source']),
  /** A concept_id or a source_id that appeared in the prompt. */
  id: z.string().trim().min(1).max(200),
  label: shortText,
});
export type Citation = z.infer<typeof citationSchema>;

/** A citation after the API has resolved it against the compiled index. */
export interface ResolvedCitation extends Citation {
  readonly slug: string | null;
  readonly url: string | null;
}

/** The result contract. Every array is present even when empty. */
export const assistantResultSchema = z.object({
  interpretation: longText,
  answer: longText,
  candidateRoutes: z.array(candidateRouteSchema).max(10).default([]),
  assumptions: z.array(shortText).max(20).default([]),
  disqualifiers: z.array(shortText).max(20).default([]),
  missingInformation: z.array(shortText).max(20).default([]),
  nextChecks: z.array(shortText).max(20).default([]),
  citations: z.array(citationSchema).max(40).default([]),
  confidence: z.enum(confidenceLevels),
});
export type AssistantResult = z.infer<typeof assistantResultSchema>;

/** One concept selected as grounding material. */
export interface RetrievedConcept {
  readonly conceptId: string;
  readonly title: string;
  readonly slug: string;
  readonly summary: string;
  readonly reviewState: string;
  readonly matchKind: string;
  readonly rankExplanation: string;
  readonly excerpt: string;
  readonly relationships: readonly {
    readonly type: string;
    readonly direction: 'outgoing' | 'incoming';
    readonly otherId: string;
    readonly otherTitle: string;
  }[];
  readonly sources: readonly {
    readonly sourceId: string;
    readonly title: string;
    readonly url: string;
    readonly sourceKind: string;
    readonly supports: readonly string[];
    readonly checkedOn: string;
  }[];
}

export interface Retrieval {
  readonly concepts: readonly RetrievedConcept[];
  /** Characters of grounding material actually included. */
  readonly characterCount: number;
  readonly characterBudget: number;
  /** True when the budget or the concept cap dropped material. */
  readonly truncated: boolean;
  /** Search terms actually used, for debugging. Never the raw context. */
  readonly queries: readonly string[];
}

export interface ProviderStatus {
  readonly provider: AssistantProviderName;
  readonly available: boolean;
  readonly model: string | null;
  /** Human-readable explanation. Never contains configuration secrets. */
  readonly detail: string;
}

export type ProviderFailureCode =
  | 'provider_disabled'
  | 'provider_unreachable'
  | 'model_unavailable'
  | 'timeout'
  | 'invalid_model_output'
  | 'fabricated_citation'
  | 'provider_error';

export type ProviderOutcome =
  | {
      readonly ok: true;
      readonly result: AssistantResult;
      readonly model: string | null;
      readonly latencyMs: number;
    }
  | {
      readonly ok: false;
      readonly code: ProviderFailureCode;
      readonly message: string;
      readonly model: string | null;
      readonly latencyMs: number;
      /** Set when the model replied but the reply was unusable. */
      readonly detail?: string | undefined;
    };

export interface GenerateInput {
  readonly request: AssistantRequest;
  readonly retrieval: Retrieval;
  /**
   * Private material the researcher selected for this request. Optional, and
   * empty unless they selected something: a provider must work identically
   * with and without it.
   */
  readonly privateContext?: PrivateContext | undefined;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal | undefined;
}

export interface AssistantProvider {
  readonly name: AssistantProviderName;
  /** Cheap description; `probe` allows a bounded network check. */
  status(probe: boolean): Promise<ProviderStatus>;
  generate(input: GenerateInput): Promise<ProviderOutcome>;
}
