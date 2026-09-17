import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Page, Section, State } from '@site/src/components/Ui';
import { api, isAbort } from '@site/src/lib/api';
import type { BacklogGroupItem, CandidateItem } from '@site/src/lib/api';
import { destinationFor, identityKey, nodesById } from '@site/src/lib/graph-data';

/**
 * The backlog is editorial work, not knowledge.
 *
 * Two lists live here and they come from different places, so they are shown
 * apart rather than merged into one queue:
 *
 *   * **atlas candidates** — neighbourhoods somebody curated that have no page;
 *   * **unresolved references** — links an existing page needed and could not
 *     make, because the idea it wanted to name does not exist here.
 *
 * The second kind is sharper evidence of what to write next: a page already
 * tried to use it. Two pages waiting on the same idea are one item with two
 * sources, because writing it once satisfies both.
 *
 * Nothing on this page mutates anything. Editing the atlas or a page is a Git
 * change reviewed by a person.
 */

type View = 'unresolved' | 'candidates';

function UnresolvedItem({ group }: { group: BacklogGroupItem }): ReactNode {
  return (
    <li className={`backlog-item${group.blocking ? ' backlog-item--blocking' : ''}`}>
      <p className="backlog-item__label">
        {group.label}
        {group.blocking && (
          <span
            className="nav-badge nav-badge--disputed"
            title="At least one page is materially incomplete without it"
          >
            Blocking
          </span>
        )}
        <span className="nav-badge nav-badge--neutral">
          {group.sourceCount} {group.sourceCount === 1 ? 'page waiting' : 'pages waiting'}
        </span>
      </p>

      <ul className="backlog-sources">
        {group.sources.map((source) => (
          <li key={source.referenceId}>
            {source.conceptHasArticle ? (
              <Link to={source.conceptSlug}>{source.conceptTitle}</Link>
            ) : (
              <Link to={`/identity/${identityKey(source.conceptSlug)}`}>{source.conceptTitle}</Link>
            )}{' '}
            needs it: <span className="backlog-sources__reason">{source.reason}</span>
            {source.sections.length > 0 && (
              <span className="backlog-sources__sections"> in {source.sections.join(', ')}</span>
            )}
          </li>
        ))}
      </ul>

      {(group.proposedKinds.length > 0 || group.proposedCategories.length > 0) && (
        <p className="backlog-item__proposal">
          Proposed as{' '}
          {group.proposedKinds.length > 0 ? group.proposedKinds.join(' or ') : 'an identity'}
          {group.proposedCategories.length > 0 && <> in {group.proposedCategories.join('; ')}</>}.
        </p>
      )}
      <p className="backlog-item__id">
        <code className="nav-id">{group.groupId}</code>
      </p>
    </li>
  );
}

function CandidateBacklogItem({ candidate }: { candidate: CandidateItem }): ReactNode {
  const node =
    candidate.canonicalConceptId === null ? undefined : nodesById.get(candidate.canonicalConceptId);
  return (
    <li className="backlog-item">
      <p className="backlog-item__label">
        {candidate.title}
        <span className="nav-badge nav-badge--neutral">{candidate.status}</span>
      </p>
      <p className="backlog-item__where">
        {candidate.categories.map((category) => category.path).join('; ')}
      </p>
      {candidate.note !== null && <p className="backlog-item__proposal">{candidate.note}</p>}
      {node !== undefined && (
        <p className="backlog-item__proposal">
          Already covered by <Link to={destinationFor(node)}>{node.title}</Link>.
        </p>
      )}
      <p className="backlog-item__id">
        <code className="nav-id">{candidate.candidateId}</code>
      </p>
    </li>
  );
}

export default function BacklogPage(): ReactNode {
  const [view, setView] = useState<View>('unresolved');
  const [blockingOnly, setBlockingOnly] = useState(false);
  const [groups, setGroups] = useState<BacklogGroupItem[] | undefined>(undefined);
  const [candidates, setCandidates] = useState<CandidateItem[] | undefined>(undefined);
  const [truncated, setTruncated] = useState(false);
  const [total, setTotal] = useState(0);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const abort = useRef<AbortController | undefined>(undefined);

  const load = useCallback(async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setFailure(undefined);
    try {
      if (view === 'unresolved') {
        const page = await api.coverageUnresolved(
          { blocking: blockingOnly, limit: 200 },
          controller.signal,
        );
        setGroups(page.items);
        setTotal(page.total);
        setTruncated(page.truncated);
      } else {
        const page = await api.coverageCandidates(
          { status: 'candidate', limit: 200 },
          controller.signal,
        );
        setCandidates(page.items);
        setTotal(page.total);
        setTruncated(page.truncated);
      }
    } catch (error) {
      if (isAbort(error)) return;
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [view, blockingOnly]);

  useEffect(() => {
    void load();
    return () => abort.current?.abort();
  }, [load]);

  const items = view === 'unresolved' ? groups : candidates;

  return (
    <Layout title="Backlog" description="What this corpus is missing, and which pages are waiting.">
      <Page
        width="tool"
        title="Backlog"
        lede="Missing knowledge, made actionable. Nothing here is canonical, and nothing here can answer a question — these are the gaps, not the content."
      >
        <div className="backlog-views" role="group" aria-label="Choose a backlog view">
          <button
            type="button"
            className={'nav-choice'}
            aria-pressed={view === 'unresolved'}
            onClick={() => {
              setView('unresolved');
            }}
          >
            Unresolved references
          </button>
          <button
            type="button"
            className={'nav-choice'}
            aria-pressed={view === 'candidates'}
            onClick={() => {
              setView('candidates');
            }}
          >
            Atlas candidates
          </button>
        </div>

        {view === 'unresolved' && (
          <Section heading="References existing pages could not make">
            <p>
              A page that needs to mention an idea this corpus does not explain writes the name as
              plain text and records the gap, rather than inventing a stub so a link resolves. Two
              pages waiting on the same idea are one item here, with both reasons kept.
            </p>
            <div className="backlog-filters">
              <label className="nav-check">
                <input
                  type="checkbox"
                  checked={blockingOnly}
                  onChange={(event) => {
                    setBlockingOnly(event.currentTarget.checked);
                  }}
                />{' '}
                Blocking only
              </label>
            </div>
          </Section>
        )}

        {view === 'candidates' && (
          <Section heading="Neighbourhoods with no page behind them">
            <p>
              These come from <Link to="/coverage">the atlas</Link>. A candidate is a label and an
              optional editorial note — it carries no definition, no sources and no relationships,
              and it is never used as evidence.
            </p>
          </Section>
        )}

        {loading && items === undefined && (
          <State tone="working" title="Reading the compiled index…">
            The backlog is served by the local API.
          </State>
        )}

        {failure !== undefined && (
          <State tone="problem" title="The backlog is unavailable">
            {failure} Browsing, search and the concept graph are unaffected.
          </State>
        )}

        {items !== undefined && items.length === 0 && (
          <State
            tone="empty"
            title={
              view === 'unresolved'
                ? blockingOnly
                  ? 'Nothing is blocking'
                  : 'No page is waiting on a missing concept'
                : 'No candidate is waiting'
            }
          >
            {view === 'unresolved'
              ? 'Every idea the existing pages needed to name already exists here.'
              : 'Every candidate in the atlas has either been covered or deferred.'}
          </State>
        )}

        {items !== undefined && items.length > 0 && (
          <>
            <p className="backlog-count">
              {items.length} of {total} {view === 'unresolved' ? 'gap(s)' : 'candidate(s)'}
              {truncated && ' — more than this page shows'}
            </p>
            <ul className="backlog-list">
              {view === 'unresolved'
                ? (items as BacklogGroupItem[]).map((group) => (
                    <UnresolvedItem key={group.groupId} group={group} />
                  ))
                : (items as CandidateItem[]).map((candidate) => (
                    <CandidateBacklogItem key={candidate.candidateId} candidate={candidate} />
                  ))}
            </ul>
          </>
        )}
      </Page>
    </Layout>
  );
}
