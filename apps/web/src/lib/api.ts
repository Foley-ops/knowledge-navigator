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

/* ------------------------------ coverage ---------------------------------- */

export interface CoverageSummary {
  corpusHash: string;
  atlasHash: string;
  builtAt: string;
  concepts: {
    total: number;
    withArticle: number;
    byTier: Record<string, number>;
    byFormat: Record<string, number>;
    byReviewState: Record<string, number>;
  };
  atlas: {
    areas: number;
    categories: number;
    emptyCategories: number;
    candidates: number;
    byStatus: Record<string, number>;
  };
  backlog: { references: number; groups: number; blocking: number };
  evidence: {
    claims: number;
    byStatus: Record<string, number>;
    locators: number;
    conceptsWithClaims: number;
  };
}

export interface AtlasCategoryNode {
  categoryId: string;
  title: string;
  path: string;
  areaId: string;
  parentCategoryId: string | null;
  depth: number;
  candidates: number;
  covered: number;
  children: AtlasCategoryNode[];
}

export interface AtlasAreaNode {
  areaId: string;
  title: string;
  categories: number;
  candidates: number;
  covered: number;
  children: AtlasCategoryNode[];
}

export interface AtlasResponse {
  areas: AtlasAreaNode[];
  counts: { areas: number; categories: number; candidates: number };
}

export interface CandidateCategoryRef {
  categoryId: string;
  title: string;
  path: string;
  areaId: string;
}

export interface CandidateItem {
  candidateId: string;
  title: string;
  aliases: string[];
  status: string;
  note: string | null;
  categories: CandidateCategoryRef[];
  canonicalConceptId: string | null;
  canonicalTitle: string | null;
  canonicalSlug: string | null;
  canonicalHasArticle: boolean | null;
}

export interface BacklogSourceItem {
  referenceId: string;
  conceptId: string;
  conceptTitle: string;
  conceptSlug: string;
  conceptHasArticle: boolean;
  reason: string;
  blocking: boolean;
  sections: string[];
  proposedKind: string | null;
  proposedCategories: string[];
}

export interface BacklogGroupItem {
  groupId: string;
  label: string;
  normalizedLabel: string;
  blocking: boolean;
  sourceCount: number;
  proposedKinds: string[];
  proposedCategories: string[];
  sources: BacklogSourceItem[];
}

export interface CoveragePage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  truncated: boolean;
}

export interface ClaimEvidenceItem {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceKind: string;
  locator: string;
  note: string | null;
}

export interface ClaimItem {
  claimId: string;
  section: string;
  statement: string;
  status: string;
  evidence: ClaimEvidenceItem[];
}

export interface ConceptEvidenceResponse {
  conceptId: string;
  title: string;
  slug: string;
  tier: number;
  reviewState: string;
  hasArticle: boolean;
  hasClaimMapping: boolean;
  claims: ClaimItem[];
  sectionsWithClaims: string[];
  sources: {
    sourceId: string;
    title: string;
    url: string;
    sourceKind: string;
    supports: string[];
    checkedOn: string;
    claimCount: number;
  }[];
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

  coverageSummary: (signal?: AbortSignal): Promise<CoverageSummary> =>
    request<CoverageSummary>('/coverage/summary', signal === undefined ? {} : { signal }),

  coverageAtlas: (signal?: AbortSignal): Promise<AtlasResponse> =>
    request<AtlasResponse>('/coverage/atlas', signal === undefined ? {} : { signal }),

  coverageCandidates: (
    query: { area?: string; category?: string; status?: string; limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<CoveragePage<CandidateItem>> => {
    const params = new URLSearchParams();
    if (query.area !== undefined) params.set('area', query.area);
    if (query.category !== undefined) params.set('category', query.category);
    if (query.status !== undefined) params.set('status', query.status);
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.offset !== undefined) params.set('offset', String(query.offset));
    const suffix = params.toString();
    return request<CoveragePage<CandidateItem>>(
      `/coverage/candidates${suffix === '' ? '' : `?${suffix}`}`,
      signal === undefined ? {} : { signal },
    );
  },

  coverageUnresolved: (
    query: { blocking?: boolean; limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<CoveragePage<BacklogGroupItem>> => {
    const params = new URLSearchParams();
    if (query.blocking === true) params.set('blocking', 'true');
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.offset !== undefined) params.set('offset', String(query.offset));
    const suffix = params.toString();
    return request<CoveragePage<BacklogGroupItem>>(
      `/coverage/unresolved${suffix === '' ? '' : `?${suffix}`}`,
      signal === undefined ? {} : { signal },
    );
  },

  evidence: (conceptId: string, signal?: AbortSignal): Promise<ConceptEvidenceResponse> =>
    request<ConceptEvidenceResponse>(
      `/evidence/${encodeURIComponent(conceptId)}`,
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
