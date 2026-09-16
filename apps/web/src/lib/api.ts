/**
 * Browser client for the local API.
 *
 * Version 1 uses ordinary request and response, not streaming, so every call
 * here is cancellable and every caller shows a waiting state (runbook §4.3).
 */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
  requestId?: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, code: string, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** Raised when the caller cancelled; never shown as a failure. */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function baseUrl(): string {
  if (typeof window === 'undefined') return '/api';
  const configured = (window as { __NAVIGATOR_API_BASE__?: string }).__NAVIGATOR_API_BASE__;
  return configured ?? '/api';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { accept: 'application/json', ...(init.headers ?? {}) },
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError(
      0,
      'api_unreachable',
      'The local API is not responding. Is the stack running?',
      error,
    );
  }

  let body: unknown = null;
  const text = await response.text();
  if (text !== '') {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const parsed = body as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      parsed?.error?.code ?? 'request_failed',
      parsed?.error?.message ?? `The API returned HTTP ${String(response.status)}.`,
      body,
    );
  }
  return body as T;
}

/* ----------------------------- response shapes ---------------------------- */

export interface SearchResult {
  conceptId: string;
  title: string;
  slug: string;
  summary: string;
  kind: string;
  tier: number;
  reviewState: string;
  matchedAlias: string | null;
  matchKind: string;
  rankExplanation: string;
}

export interface SearchResponse {
  query: string;
  limit: number;
  count: number;
  results: SearchResult[];
}

export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  kind: string;
  tier: number;
  reviewState: string;
  summary: string;
  primaryCategory: string;
  distance: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  note: string | null;
  condition: string | null;
}

export interface GraphResponse {
  centerId: string;
  depth: number;
  nodeLimit: number;
  truncated: boolean;
  counts: { nodes: number; edges: number };
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AssistantStatus {
  provider: string;
  available: boolean;
  model: string | null;
  detail: string;
  modes: string[];
  depths: string[];
}

export interface Citation {
  kind: 'concept' | 'source';
  id: string;
  label: string;
  slug: string | null;
  url: string | null;
}

export interface CandidateRoute {
  title: string;
  rationale: string;
  conceptIds: string[];
}

export interface AssistantResult {
  interpretation: string;
  answer: string;
  candidateRoutes: CandidateRoute[];
  assumptions: string[];
  disqualifiers: string[];
  missingInformation: string[];
  nextChecks: string[];
  citations: Citation[];
  confidence: 'low' | 'medium' | 'high';
}

export interface RetrievalView {
  conceptCount: number;
  characterCount: number;
  characterBudget: number;
  truncated: boolean;
  queries: string[];
  concepts: {
    conceptId: string;
    title: string;
    slug: string;
    summary: string;
    reviewState: string;
    matchKind: string;
    rankExplanation: string;
  }[];
  sources: {
    sourceId: string;
    title: string;
    url: string;
    sourceKind: string;
    supports: string[];
    checkedOn: string;
  }[];
}

export interface AssistantResponse {
  requestId: string;
  mode: string;
  depth: string;
  provider: string;
  model: string | null;
  latencyMs: number;
  elapsedMs: number;
  retrieval: RetrievalView;
  error: { code: string; message: string; detail?: string } | null;
  result: AssistantResult | null;
}

export interface AssistantAsk {
  question: string;
  context?: string;
  mode: string;
  depth: string;
}

/* -------------------------------- endpoints ------------------------------- */

export const api = {
  search: (q: string, limit: number, signal?: AbortSignal): Promise<SearchResponse> =>
    request<SearchResponse>(
      `/search?q=${encodeURIComponent(q)}&limit=${String(limit)}`,
      signal === undefined ? {} : { signal },
    ),

  graph: (conceptId: string, depth: number, signal?: AbortSignal): Promise<GraphResponse> =>
    request<GraphResponse>(
      `/graph/${encodeURIComponent(conceptId)}?depth=${String(depth)}`,
      signal === undefined ? {} : { signal },
    ),

  assistantStatus: (signal?: AbortSignal): Promise<AssistantStatus> =>
    request<AssistantStatus>('/assistant/status', signal === undefined ? {} : { signal }),

  /**
   * Ask a question. A failed generation still returns the retrieved evidence,
   * so the caller reads the body on both paths.
   */
  ask: async (ask: AssistantAsk, signal?: AbortSignal): Promise<AssistantResponse> => {
    try {
      return await request<AssistantResponse>('/assistant/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ask),
        ...(signal === undefined ? {} : { signal }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.body !== null && typeof error.body === 'object') {
        const body = error.body as Partial<AssistantResponse>;
        if ('retrieval' in body && body.retrieval !== undefined) {
          return body as AssistantResponse;
        }
      }
      throw error;
    }
  },
};
