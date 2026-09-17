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
  privateContext: PrivateContextView;
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

/* ------------------------------ personal ---------------------------------- */

export interface PersonalStatus {
  available: boolean;
  schemaVersion?: number;
  reason?: string;
  message?: string;
  counts?: { projects: number; sessions: number; notes: number; savedItems: number };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ProjectContents {
  sessions: number;
  notes: number;
  savedItems: number;
  artifacts: number;
}

export interface ResearchSession {
  id: string;
  projectId: string;
  title: string;
  startingQuestion: string | null;
  contextSummary: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface PrivateNote {
  id: string;
  projectId: string;
  sessionId: string | null;
  conceptId: string | null;
  savedItemId: string | null;
  artifactId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export type FamiliarityLevel = 'unfamiliar' | 'recognize' | 'working' | 'strong';

export interface FamiliarityRecord {
  conceptId: string;
  level: FamiliarityLevel;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SavedItemType =
  'concept' | 'source' | 'assistant-answer' | 'comparison' | 'path' | 'next-check';

export interface SavedItem {
  id: string;
  projectId: string;
  sessionId: string | null;
  itemType: SavedItemType;
  itemKey: string;
  label: string;
  payloadVersion: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Artifact {
  id: string;
  projectId: string;
  label: string;
  originalName: string;
  mediaType: string;
  byteCount: number;
  characterCount: number;
  sha256: string;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ArtifactWithText extends Artifact {
  extractedText: string;
}

export interface PrivateContextItem {
  kind: 'artifact' | 'note';
  id: string;
  label: string;
  characterCount: number;
  totalCharacters: number;
  truncated: boolean;
}

export interface PrivateContextView {
  projectId: string | null;
  items: PrivateContextItem[];
  unresolved: string[];
  characterCount: number;
  characterBudget: number;
  truncated: boolean;
}

/* ------------------------------ comparison -------------------------------- */

/** Why a comparison cell is empty. Each reason means something different. */
export type MissingReason = 'empty' | 'no-section' | 'no-article';

export interface ComparisonCell {
  conceptId: string;
  /** Markdown source as the page stores it, or null when there is nothing. */
  value: string | null;
  missing: MissingReason | null;
}

export interface ComparisonRow {
  key: string;
  label: string;
  hint: string;
  cells: ComparisonCell[];
}

export interface ComparedConcept {
  conceptId: string;
  title: string;
  slug: string;
  kind: string;
  tier: number;
  reviewState: string;
  summary: string;
  format: string;
  hasArticle: boolean;
  categories: string[];
  claimCount: number;
  sourceCount: number;
}

export interface ComparisonRelationship {
  direction: 'outgoing' | 'incoming';
  type: string;
  otherId: string;
  otherTitle: string;
  note: string | null;
  condition: string | null;
}

export interface ComparisonSource {
  sourceId: string;
  title: string;
  url: string;
  sourceKind: string;
  supports: string[];
  checkedOn: string;
  citedBy: string[];
}

export interface ComparisonEvidence {
  sources: number;
  claims: number;
  sectionsWithClaims: string[];
  reviewState: string;
}

export interface Comparison {
  concepts: ComparedConcept[];
  rows: ComparisonRow[];
  relationships: Record<string, ComparisonRelationship[]>;
  between: ComparisonRelationship[];
  sources: ComparisonSource[];
  evidence: Record<string, ComparisonEvidence>;
  completeness: { cells: number; missing: number };
}

/** A comparison plus an optional synthesis. The table is present either way. */
export interface ComparisonExplanation {
  requestId: string;
  comparison: Comparison;
  privateContext: PrivateContextView;
  provider: string;
  model: string | null;
  latencyMs: number;
  synthesis: AssistantResult | null;
  error: { code: string; message: string; detail?: string } | null;
}

/* --------------------------------- paths ---------------------------------- */

export interface PathEdge {
  beforeId: string;
  afterId: string;
  type: 'requires' | 'prerequisite_of';
  /** Which page declared the relationship. */
  declaredBy: string;
  note: string | null;
  condition: string | null;
}

export interface PathStep {
  conceptId: string;
  title: string;
  slug: string;
  hasArticle: boolean;
  tier: number;
  reviewState: string;
  summary: string;
  position: number;
  because: PathEdge | null;
  familiarity: FamiliarityLevel | null;
  likelyKnown: boolean;
}

export interface MissingGraphInformation {
  conceptId: string;
  title: string;
  reason: string;
}

export interface LearningPath {
  requestId: string;
  targetId: string;
  targetTitle: string;
  reachable: boolean;
  steps: PathStep[];
  startedFrom: {
    conceptId: string;
    title: string;
    reason: 'declared-known' | 'familiarity-strong';
  }[];
  familiarityEffects: {
    conceptId: string;
    title: string;
    level: FamiliarityLevel;
    effect: 'treated-as-known' | 'marked-likely-known';
  }[];
  missing: MissingGraphInformation[];
  edges: PathEdge[];
  truncated: boolean;
  /** False when a project was named but the private store could not be read. */
  familiarityAvailable: boolean;
}

export interface AssistantAsk {
  question: string;
  context?: string;
  mode: string;
  depth: string;
  /** Private material selected for this one request. Absent means none. */
  projectId?: string;
  sessionId?: string;
  artifactIds?: string[];
  noteIds?: string[];
}

/** POST JSON and decode the reply. Used by every personal mutation. */
function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
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

  /* ----------------------------- personal ------------------------------- */

  personalStatus: (signal?: AbortSignal): Promise<PersonalStatus> =>
    request<PersonalStatus>('/personal/status', signal === undefined ? {} : { signal }),

  listProjects: (
    includeArchived = false,
    signal?: AbortSignal,
  ): Promise<{ items: Project[]; total: number }> =>
    request<{ items: Project[]; total: number }>(
      `/personal/projects${includeArchived ? '?includeArchived=true' : ''}`,
      signal === undefined ? {} : { signal },
    ),

  createProject: (input: { title: string; description?: string }): Promise<Project> =>
    post<Project>('/personal/projects', input),

  getProject: (
    id: string,
    signal?: AbortSignal,
  ): Promise<{ project: Project; contents: ProjectContents }> =>
    request<{ project: Project; contents: ProjectContents }>(
      `/personal/projects/${id}`,
      signal === undefined ? {} : { signal },
    ),

  updateProject: (id: string, input: { title?: string; description?: string }): Promise<Project> =>
    request<Project>(`/personal/projects/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),

  archiveProject: (id: string): Promise<Project> =>
    post<Project>(`/personal/projects/${id}/archive`, {}),

  restoreProject: (id: string): Promise<Project> =>
    post<Project>(`/personal/projects/${id}/restore`, {}),

  listSessions: (projectId: string, signal?: AbortSignal): Promise<{ items: ResearchSession[] }> =>
    request<{ items: ResearchSession[] }>(
      `/personal/projects/${projectId}/sessions`,
      signal === undefined ? {} : { signal },
    ),

  createSession: (
    projectId: string,
    input: { title: string; startingQuestion?: string; contextSummary?: string },
  ): Promise<ResearchSession> =>
    post<ResearchSession>(`/personal/projects/${projectId}/sessions`, input),

  archiveSession: (projectId: string, id: string): Promise<ResearchSession> =>
    post<ResearchSession>(`/personal/projects/${projectId}/sessions/${id}/archive`, {}),

  listNotes: (
    projectId: string,
    query: { conceptId?: string; sessionId?: string } = {},
    signal?: AbortSignal,
  ): Promise<{ items: PrivateNote[] }> => {
    const params = new URLSearchParams();
    if (query.conceptId !== undefined) params.set('conceptId', query.conceptId);
    if (query.sessionId !== undefined) params.set('sessionId', query.sessionId);
    const suffix = params.toString();
    return request<{ items: PrivateNote[] }>(
      `/personal/projects/${projectId}/notes${suffix === '' ? '' : `?${suffix}`}`,
      signal === undefined ? {} : { signal },
    );
  },

  createNote: (
    projectId: string,
    input: { body: string; conceptId?: string; sessionId?: string },
  ): Promise<PrivateNote> => post<PrivateNote>(`/personal/projects/${projectId}/notes`, input),

  updateNote: (projectId: string, id: string, body: string): Promise<PrivateNote> =>
    request<PrivateNote>(`/personal/projects/${projectId}/notes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
    }),

  archiveNote: (projectId: string, id: string): Promise<PrivateNote> =>
    post<PrivateNote>(`/personal/projects/${projectId}/notes/${id}/archive`, {}),

  restoreNote: (projectId: string, id: string): Promise<PrivateNote> =>
    post<PrivateNote>(`/personal/projects/${projectId}/notes/${id}/restore`, {}),

  listSaved: (
    projectId: string,
    query: { itemType?: SavedItemType; sessionId?: string } = {},
    signal?: AbortSignal,
  ): Promise<{ items: SavedItem[] }> => {
    const params = new URLSearchParams();
    if (query.itemType !== undefined) params.set('itemType', query.itemType);
    if (query.sessionId !== undefined) params.set('sessionId', query.sessionId);
    const suffix = params.toString();
    return request<{ items: SavedItem[] }>(
      `/personal/projects/${projectId}/saved${suffix === '' ? '' : `?${suffix}`}`,
      signal === undefined ? {} : { signal },
    );
  },

  save: (
    projectId: string,
    input: {
      itemType: SavedItemType;
      label: string;
      sessionId?: string;
      payload: Record<string, unknown>;
    },
  ): Promise<{ item: SavedItem; deduplicated: boolean }> =>
    post<{ item: SavedItem; deduplicated: boolean }>(
      `/personal/projects/${projectId}/saved`,
      input,
    ),

  archiveSaved: (projectId: string, id: string): Promise<SavedItem> =>
    post<SavedItem>(`/personal/projects/${projectId}/saved/${id}/archive`, {}),

  getFamiliarity: (
    conceptId: string,
    signal?: AbortSignal,
  ): Promise<{ conceptId: string; familiarity: FamiliarityRecord | null }> =>
    request<{ conceptId: string; familiarity: FamiliarityRecord | null }>(
      `/personal/familiarity/${encodeURIComponent(conceptId)}`,
      signal === undefined ? {} : { signal },
    ),

  listFamiliarity: (signal?: AbortSignal): Promise<{ items: FamiliarityRecord[] }> =>
    request<{ items: FamiliarityRecord[] }>(
      '/personal/familiarity',
      signal === undefined ? {} : { signal },
    ),

  setFamiliarity: (
    conceptId: string,
    input: { level: FamiliarityLevel; note?: string },
  ): Promise<FamiliarityRecord> =>
    post<FamiliarityRecord>(`/personal/familiarity/${encodeURIComponent(conceptId)}`, input),

  clearFamiliarity: (conceptId: string): Promise<{ conceptId: string; cleared: boolean }> =>
    post<{ conceptId: string; cleared: boolean }>(
      `/personal/familiarity/${encodeURIComponent(conceptId)}/clear`,
      {},
    ),

  listArtifacts: (
    projectId: string,
    includeArchived = false,
    signal?: AbortSignal,
  ): Promise<{ items: Artifact[] }> =>
    request<{ items: Artifact[] }>(
      `/personal/projects/${projectId}/artifacts${includeArchived ? '?includeArchived=true' : ''}`,
      signal === undefined ? {} : { signal },
    ),

  getArtifact: (projectId: string, id: string, signal?: AbortSignal): Promise<ArtifactWithText> =>
    request<ArtifactWithText>(
      `/personal/projects/${projectId}/artifacts/${id}`,
      signal === undefined ? {} : { signal },
    ),

  /**
   * Upload one local file. The browser sends the bytes; the API extracts the
   * text, keeps that, and drops the bytes. There is no path that stores a file.
   */
  uploadArtifact: (
    projectId: string,
    file: File,
    label?: string,
  ): Promise<{ artifact: Artifact; deduplicated: boolean }> => {
    const body = new FormData();
    if (label !== undefined && label.trim() !== '') body.append('label', label.trim());
    body.append('file', file, file.name);
    return request<{ artifact: Artifact; deduplicated: boolean }>(
      `/personal/projects/${projectId}/artifacts`,
      { method: 'POST', body },
    );
  },

  archiveArtifact: (projectId: string, id: string): Promise<Artifact> =>
    post<Artifact>(`/personal/projects/${projectId}/artifacts/${id}/archive`, {}),

  restoreArtifact: (projectId: string, id: string): Promise<Artifact> =>
    post<Artifact>(`/personal/projects/${projectId}/artifacts/${id}/restore`, {}),

  /* --------------------------- compare and path -------------------------- */

  /**
   * The deterministic comparison. No model is involved, so this call fails
   * only for reasons the researcher can act on: an unknown id, or no index.
   */
  compare: (conceptIds: readonly string[], signal?: AbortSignal): Promise<Comparison> =>
    request<Comparison>('/compare', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ conceptIds }),
      ...(signal === undefined ? {} : { signal }),
    }),

  /**
   * Ask the local model to read the table aloud. The table comes back whether
   * or not the synthesis does, so the caller renders the body on both paths.
   */
  explainComparison: (
    input: {
      conceptIds: readonly string[];
      depth?: string;
      projectId?: string;
      artifactIds?: string[];
      noteIds?: string[];
    },
    signal?: AbortSignal,
  ): Promise<ComparisonExplanation> =>
    request<ComparisonExplanation>('/compare/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      ...(signal === undefined ? {} : { signal }),
    }),

  path: (
    input: {
      targetId: string;
      known?: readonly string[];
      include?: readonly string[];
      projectId?: string;
    },
    signal?: AbortSignal,
  ): Promise<LearningPath> =>
    request<LearningPath>('/paths', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      ...(signal === undefined ? {} : { signal }),
    }),

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
