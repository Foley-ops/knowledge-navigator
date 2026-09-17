import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Page, ReviewStateBadge, Section, State } from '@site/src/components/Ui';
import { api, isAbort } from '@site/src/lib/api';
import type {
  AtlasAreaNode,
  AtlasCategoryNode,
  CandidateItem,
  CoverageSummary,
} from '@site/src/lib/api';
import { destinationFor, graphData, nodesById } from '@site/src/lib/graph-data';
import { railClass } from '@site/src/lib/review-state';

/**
 * Coverage answers one question: how much of the map do we actually have?
 *
 * Three different things are on this page and they are never blended. The
 * universe is the curated atlas. A canonical identity is something this corpus
 * really carries, at one of three depths. A candidate is an editorial lead with
 * no content behind it at all — and the page says so in those words, because
 * the whole value of showing the empty parts of the map is lost if a reader
 * mistakes a label for knowledge.
 */

type CoverageFilter = 'all' | 'covered' | 'uncovered';

const STATUS_LABEL: Record<string, string> = {
  candidate: 'Candidate',
  'proposed-tier-3': 'Proposed identity',
  covered: 'Covered',
  deferred: 'Deferred',
};

const STATUS_MEANING: Record<string, string> = {
  candidate: 'A lead nobody has committed to yet. Nothing has been written.',
  'proposed-tier-3': 'Accepted as worth a stable identity. The identity does not exist yet.',
  covered: 'A canonical concept exists for this label.',
  deferred: 'Deliberately out of scope for now, kept here so it stays visible.',
};

/**
 * A dotted identifier is a legal HTML id but an ambiguous CSS selector — `#a.b`
 * reads as id `a` with class `b` — so element ids are built from a dot-free
 * form. The identifier itself is never changed; only this anchor is.
 */
function anchorId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function CandidateBadge({ status }: { status: string }): ReactNode {
  return (
    <span
      className={`nav-badge coverage-status coverage-status--${status}`}
      title={STATUS_MEANING[status] ?? status}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Counts                                                                      */
/* -------------------------------------------------------------------------- */

function Tally({ label, value, hint }: { label: string; value: number; hint: string }): ReactNode {
  return (
    <div className="coverage-tally">
      <span className="coverage-tally__value">{value}</span>
      <span className="coverage-tally__label">{label}</span>
      <span className="coverage-tally__hint">{hint}</span>
    </div>
  );
}

function Counts({ summary }: { summary: CoverageSummary }): ReactNode {
  const { concepts, atlas, backlog, evidence } = summary;
  return (
    <>
      <p className="coverage-explainer">
        A <strong>candidate</strong> is a label on the map and nothing more — no definition, no
        sources, no relationships. It is never used to answer a question. A{' '}
        <strong>canonical identity</strong> is something this corpus really carries, at one of three
        depths: a full page, a short stub, or a graph-only identity with a stable address and no
        article.
      </p>

      <div className="coverage-tallies">
        <Tally
          label="Tier 1 pages"
          value={concepts.byTier['1'] ?? 0}
          hint="Complete articles using the full template"
        />
        <Tally
          label="Tier 2 stubs"
          value={concepts.byTier['2'] ?? 0}
          hint="A definition, sources and relationships"
        />
        <Tally
          label="Tier 3 identities"
          value={concepts.byTier['3'] ?? 0}
          hint="A stable address in the graph, with no article"
        />
        <Tally
          label="Candidates"
          value={atlas.candidates}
          hint="Editorial leads. Not canonical, never evidence"
        />
      </div>

      <div className="coverage-tallies">
        <Tally label="Atlas areas" value={atlas.areas} hint="Mathematics, AI and Programming" />
        <Tally
          label="Atlas categories"
          value={atlas.categories}
          hint={`${String(atlas.emptyCategories)} of them hold nothing yet`}
        />
        <Tally
          label="Unresolved references"
          value={backlog.references}
          hint={`${String(backlog.groups)} distinct gaps, ${String(backlog.blocking)} blocking`}
        />
        <Tally
          label="Claims with evidence"
          value={evidence.claims}
          hint={`across ${String(evidence.conceptsWithClaims)} page(s)`}
        />
      </div>

      <div className="coverage-breakdown">
        <h3 className="coverage-breakdown__heading">Review state of every canonical identity</h3>
        <ul className="coverage-breakdown__list">
          {Object.entries(concepts.byReviewState).map(([state, count]) => (
            <li key={state}>
              <ReviewStateBadge state={state} /> <span>{count}</span>
            </li>
          ))}
        </ul>
        <h3 className="coverage-breakdown__heading">Editorial state of every candidate</h3>
        <ul className="coverage-breakdown__list">
          {Object.entries(atlas.byStatus).map(([status, count]) => (
            <li key={status}>
              <CandidateBadge status={status} /> <span>{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The outline                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A candidate entry.
 *
 * An uncovered candidate is not a link: there is nothing to open, and a URL
 * that resolves to an empty frame is exactly the lie this page exists to avoid.
 * It opens an editorial detail panel instead, which says what a candidate is
 * and what is known about this one — which is only ever a label, its
 * categories, and an optional note.
 */
function CandidateEntry({ candidate }: { candidate: CandidateItem }): ReactNode {
  const [open, setOpen] = useState(false);
  const node =
    candidate.canonicalConceptId === null ? undefined : nodesById.get(candidate.canonicalConceptId);
  const panelId = anchorId('candidate', candidate.candidateId);

  return (
    <li
      className={
        node === undefined ? 'coverage-entry' : `coverage-entry ${railClass(node.reviewState)}`
      }
    >
      <span className="coverage-entry__line">
        <button
          type="button"
          className="coverage-entry__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((wasOpen) => !wasOpen);
          }}
        >
          {candidate.title}
        </button>
        <CandidateBadge status={candidate.status} />
        {node !== undefined && <ReviewStateBadge state={node.reviewState} />}
        {node !== undefined && !node.hasArticle && (
          <span className="nav-badge nav-badge--neutral" title="A stable identity with no article">
            Graph only
          </span>
        )}
        {node !== undefined && (
          <Link className="coverage-entry__open" to={destinationFor(node)}>
            {node.hasArticle ? 'Read' : 'Identity'}
          </Link>
        )}
      </span>

      <div className="coverage-panel" id={panelId} hidden={!open}>
        {node === undefined ? (
          <p className="coverage-panel__what">
            An editorial lead, not knowledge. Nothing has been written about this, no source is
            recorded, and it can never be used to answer a question.
          </p>
        ) : (
          <p className="coverage-panel__what">
            Covered by <Link to={destinationFor(node)}>{node.title}</Link>
            {node.hasArticle ? '.' : ', a stable identity with no article yet.'}
          </p>
        )}
        {candidate.note !== null && <p className="coverage-panel__note">{candidate.note}</p>}
        {candidate.aliases.length > 0 && (
          <p className="coverage-panel__meta">Also called {candidate.aliases.join(', ')}.</p>
        )}
        <p className="coverage-panel__meta">
          Filed under {candidate.categories.map((category) => category.path).join('; ')}.
        </p>
        <p className="coverage-panel__meta">
          <code className="nav-id">{candidate.candidateId}</code>
        </p>
      </div>
    </li>
  );
}

/** Is either filter narrowing the outline? */
function filtering(filter: CoverageFilter, reviewState: string): boolean {
  return filter !== 'all' || reviewState !== 'any';
}

/** Does any candidate anywhere under this branch pass the filters? */
function subtreeMatches(
  node: AtlasCategoryNode,
  candidates: Map<string, CandidateItem[]>,
  filter: CoverageFilter,
  reviewState: string,
): boolean {
  const own = candidates.get(node.categoryId) ?? [];
  if (own.some((candidate) => passes(candidate, filter, reviewState))) return true;
  return node.children.some((child) => subtreeMatches(child, candidates, filter, reviewState));
}

/** Does this candidate pass both filters? */
function passes(candidate: CandidateItem, filter: CoverageFilter, reviewState: string): boolean {
  if (filter === 'covered' && candidate.status !== 'covered') return false;
  if (filter === 'uncovered' && candidate.status === 'covered') return false;
  if (reviewState === 'any') return true;
  const node =
    candidate.canonicalConceptId === null ? undefined : nodesById.get(candidate.canonicalConceptId);
  return node?.reviewState === reviewState;
}

/**
 * One category, as a disclosure.
 *
 * The atlas is large on purpose — that is the point of showing the whole map —
 * so it is closed by default and every summary carries its own counts. A filter
 * opens everything, because a filtered outline is short enough to read whole.
 */
function CategoryBranch({
  node,
  candidates,
  filter,
  reviewState,
  forceOpen,
}: {
  node: AtlasCategoryNode;
  candidates: Map<string, CandidateItem[]>;
  filter: CoverageFilter;
  reviewState: string;
  forceOpen: boolean;
}): ReactNode {
  const own = (candidates.get(node.categoryId) ?? []).filter((candidate) =>
    passes(candidate, filter, reviewState),
  );
  const empty = node.candidates === 0 && node.children.length === 0;

  // With a filter on, a branch that matches nothing is omitted rather than
  // repeated with a "nothing matches" line: that is what filtering means. With
  // no filter, every category is listed, empty ones included, because the empty
  // parts of the map are the point of this page.
  if (filtering(filter, reviewState) && !subtreeMatches(node, candidates, filter, reviewState)) {
    return null;
  }

  return (
    <details
      className="coverage-branch"
      open={forceOpen}
      style={node.depth > 1 ? { marginLeft: '1rem' } : undefined}
    >
      <summary className="coverage-branch__name" id={anchorId('category', node.categoryId)}>
        {node.title}
        <span className="coverage-branch__count">
          {empty
            ? 'nothing here yet'
            : `${String(node.covered)} of ${String(node.candidates)} covered`}
        </span>
      </summary>
      {empty && (
        <p className="coverage-branch__empty">
          This category is kept so the neighbourhood stays visible even though nobody has been here.
        </p>
      )}
      {own.length > 0 && (
        <ul className="coverage-entries">
          {own.map((candidate) => (
            <CandidateEntry key={candidate.candidateId} candidate={candidate} />
          ))}
        </ul>
      )}
      {node.children.map((child) => (
        <CategoryBranch
          key={child.categoryId}
          node={child}
          candidates={candidates}
          filter={filter}
          reviewState={reviewState}
          forceOpen={forceOpen}
        />
      ))}
    </details>
  );
}

function AreaSection({
  area,
  candidates,
  filter,
  reviewState,
  forceOpen,
}: {
  area: AtlasAreaNode;
  candidates: Map<string, CandidateItem[]>;
  filter: CoverageFilter;
  reviewState: string;
  forceOpen: boolean;
}): ReactNode {
  return (
    <section className="coverage-area" aria-labelledby={anchorId('area', area.areaId)}>
      <h2 className="coverage-area__name" id={anchorId('area', area.areaId)}>
        {area.title}
      </h2>
      <p className="coverage-area__count">
        {area.covered} of {area.candidates} labels covered, across {area.categories}{' '}
        {area.categories === 1 ? 'category' : 'categories'}
        {area.covered === 0 && ' — nothing in this area has been written yet'}
      </p>
      {area.children.map((child) => (
        <CategoryBranch
          key={child.categoryId}
          node={child}
          candidates={candidates}
          filter={filter}
          reviewState={reviewState}
          forceOpen={forceOpen}
        />
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export default function CoveragePage(): ReactNode {
  const [summary, setSummary] = useState<CoverageSummary | undefined>(undefined);
  const [areas, setAreas] = useState<AtlasAreaNode[] | undefined>(undefined);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CoverageFilter>('all');
  const [reviewState, setReviewState] = useState('any');
  const [expandAll, setExpandAll] = useState(false);
  const abort = useRef<AbortController | undefined>(undefined);

  const load = useCallback(async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setFailure(undefined);
    try {
      const [nextSummary, atlas] = await Promise.all([
        api.coverageSummary(controller.signal),
        api.coverageAtlas(controller.signal),
      ]);
      // One request per page of candidates, ordered, until the server says it
      // has no more. The cap is the server's, and it reports truncation.
      const collected: CandidateItem[] = [];
      for (let offset = 0; ; offset += 500) {
        const page = await api.coverageCandidates({ limit: 500, offset }, controller.signal);
        collected.push(...page.items);
        if (!page.truncated) break;
      }
      setSummary(nextSummary);
      setAreas(atlas.areas);
      setCandidates(collected);
    } catch (error) {
      if (isAbort(error)) return;
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => abort.current?.abort();
  }, [load]);

  const byCategory = useMemo(() => {
    const map = new Map<string, CandidateItem[]>();
    for (const candidate of candidates) {
      for (const category of candidate.categories) {
        const list = map.get(category.categoryId);
        if (list === undefined) map.set(category.categoryId, [candidate]);
        else list.push(candidate);
      }
    }
    return map;
  }, [candidates]);

  return (
    <Layout
      title="Coverage"
      description="How much of the map this corpus actually carries, and what is still only a label."
    >
      <Page
        width="tool"
        title="Coverage"
        lede="The atlas is the universe this project means to cover. Most of it is still only a name. This page shows the difference between a label, an identity, and an explanation you can read."
      >
        {loading && summary === undefined && (
          <State tone="working" title="Reading the compiled index…">
            Coverage is served by the local API.
          </State>
        )}

        {failure !== undefined && (
          <State tone="problem" title="Coverage is unavailable">
            {failure} Browsing, search and the concept graph are unaffected. This build carries{' '}
            {graphData.coverage.atlasCandidates} candidates across {graphData.coverage.atlasAreas}{' '}
            areas and {graphData.counts.concepts} canonical identities, counted when the site was
            built.
          </State>
        )}

        {summary !== undefined && (
          <Section heading="What exists, and what is only a name">
            <Counts summary={summary} />
          </Section>
        )}

        {areas !== undefined && (
          <Section heading="The whole map">
            <p className="coverage-outline-note">
              Every category is listed, including the ones nothing has been written about. Open one
              to see its labels; open a label to see what is actually known about it, which for a
              candidate is only ever its name, its categories and an editorial note.
            </p>

            <div className="coverage-filters" role="group" aria-label="Filter the atlas outline">
              {(
                [
                  ['all', 'Everything'],
                  ['covered', 'Covered only'],
                  ['uncovered', 'Not covered yet'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="nav-choice"
                  aria-pressed={filter === value}
                  onClick={() => {
                    setFilter(value);
                  }}
                >
                  {label}
                </button>
              ))}

              <label className="coverage-select">
                Review state
                <select
                  value={reviewState}
                  onChange={(event) => {
                    setReviewState(event.currentTarget.value);
                  }}
                >
                  <option value="any">any</option>
                  {Object.keys(summary?.concepts.byReviewState ?? {}).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="nav-choice"
                aria-pressed={expandAll}
                onClick={() => {
                  setExpandAll((was) => !was);
                }}
              >
                {expandAll ? 'Collapse all' : 'Expand all'}
              </button>
            </div>

            {areas.map((area) => (
              <AreaSection
                key={area.areaId}
                area={area}
                candidates={byCategory}
                filter={filter}
                reviewState={reviewState}
                forceOpen={expandAll || filter !== 'all' || reviewState !== 'any'}
              />
            ))}
          </Section>
        )}

        <Section heading="What is missing">
          <p>
            Every label above with no page behind it is editorial work nobody has done. The{' '}
            <Link to="/backlog">backlog</Link> turns that into something actionable: the candidates
            waiting to be written, and the references existing pages needed and could not make.
          </p>
        </Section>

        <p className="home-trust">
          Corpus <code className="nav-id">{graphData.corpusHash.slice(0, 12)}</code>, atlas{' '}
          <code className="nav-id">{graphData.atlasHash.slice(0, 12)}</code>, built{' '}
          {graphData.builtAt.slice(0, 10)}.
        </p>
      </Page>
    </Layout>
  );
}
