import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import { Identifier, Page, ReviewStateBadge, Section, State } from '@site/src/components/Ui';
import { ConceptSearch } from '@site/src/components/ConceptSearch';
import { Confidence } from '@site/src/components/Confidence';
import {
  NO_SELECTION,
  PrivateContextPicker,
  PrivateContextUsed,
} from '@site/src/components/PrivateContextPicker';
import type { PrivateSelectionState } from '@site/src/components/PrivateContextPicker';
import { ApiError, api, isAbort } from '@site/src/lib/api';
import type {
  AssistantStatus,
  ComparedConcept,
  Comparison,
  ComparisonCell,
  ComparisonExplanation,
  MissingReason,
  SearchResult,
} from '@site/src/lib/api';
import { railClass } from '@site/src/lib/review-state';
import { useWorkspaceSelection } from '@site/src/lib/workspace';

/**
 * Compare (v2 runbook Q01–Q03).
 *
 * Every cell here is text a canonical page actually contains, or an explicit
 * statement that the page does not contain it. Those two are never blended:
 * a blank cell would read as "nothing to say", and the whole reason to compare
 * concepts side by side is to see which of them the corpus has actually done
 * the work on. Missing is therefore a marker with a reason, not an absence.
 *
 * The optional synthesis is kept strictly downstream of the table. It can fail,
 * be discarded for citing something it was not given, or be switched off
 * entirely, and the comparison above it is unchanged — because the comparison
 * was true before any model was asked.
 */

const MIN = 2;
const MAX = 4;

const MISSING_NOTE: Record<MissingReason, string> = {
  empty: 'This page has the section and it is empty.',
  'no-section': 'This page has no such section. A Tier 2 stub does not use the full template.',
  'no-article': 'This is a graph-only identity: a stable address with no article behind it.',
};

const MISSING_LABEL: Record<MissingReason, string> = {
  empty: 'Empty section',
  'no-section': 'No such section',
  'no-article': 'No article',
};

function idsFromQuery(search: string): string[] {
  const raw = new URLSearchParams(search).get('ids');
  if (raw === null) return [];
  const ids = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const unique: string[] = [];
  for (const id of ids) if (!unique.includes(id)) unique.push(id);
  return unique.slice(0, MAX);
}

/* -------------------------------------------------------------------------- */
/* The table                                                                   */
/* -------------------------------------------------------------------------- */

function ConceptColumn({ concept }: { concept: ComparedConcept }): ReactNode {
  return (
    <div className={`compare-column ${railClass(concept.reviewState)}`}>
      <h3 className="compare-column__title">
        {concept.hasArticle ? (
          <Link to={concept.slug}>{concept.title}</Link>
        ) : (
          <span>{concept.title}</span>
        )}
      </h3>
      <p className="compare-column__meta">
        Tier {concept.tier} · {concept.kind} · <ReviewStateBadge state={concept.reviewState} />
      </p>
      <p className="compare-column__summary">{concept.summary}</p>
      <p className="compare-column__evidence">
        {concept.sourceCount} {concept.sourceCount === 1 ? 'source' : 'sources'} ·{' '}
        {concept.claimCount} recorded {concept.claimCount === 1 ? 'claim' : 'claims'}
        {concept.hasArticle ? '' : ' · no article'}
      </p>
      <p className="compare-column__id">
        <Identifier>{concept.conceptId}</Identifier>
      </p>
    </div>
  );
}

function Cell({
  cell,
  concept,
}: {
  cell: ComparisonCell;
  concept: ComparedConcept | undefined;
}): ReactNode {
  return (
    <article className={`compare-cell ${railClass(concept?.reviewState)}`}>
      <h4 className="compare-cell__who">{concept?.title ?? cell.conceptId}</h4>
      {cell.value === null ? (
        <p className="compare-cell__missing">
          <span className="compare-missing">{MISSING_LABEL[cell.missing ?? 'empty']}</span>
          <span className="compare-cell__missing-note">
            {MISSING_NOTE[cell.missing ?? 'empty']}
          </span>
        </p>
      ) : (
        <p className="compare-cell__value">{cell.value}</p>
      )}
    </article>
  );
}

function Table({ comparison }: { comparison: Comparison }): ReactNode {
  const byId = useMemo(
    () => new Map(comparison.concepts.map((concept) => [concept.conceptId, concept])),
    [comparison],
  );
  const columns = comparison.concepts.length;

  return (
    <div
      className="compare-table"
      style={{ '--compare-columns': String(columns) } as CSSProperties}
    >
      <div className="compare-row compare-row--head">
        <div className="compare-row__cells">
          {comparison.concepts.map((concept) => (
            <ConceptColumn key={concept.conceptId} concept={concept} />
          ))}
        </div>
      </div>

      {comparison.rows.map((row) => (
        <section key={row.key} className="compare-row">
          <h3 className="compare-row__label">{row.label}</h3>
          <p className="compare-row__hint">{row.hint}</p>
          <div className="compare-row__cells">
            {row.cells.map((cell) => (
              <Cell key={cell.conceptId} cell={cell} concept={byId.get(cell.conceptId)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Saving                                                                      */
/* -------------------------------------------------------------------------- */

function SaveComparison({
  comparison,
  synthesis,
}: {
  comparison: Comparison;
  synthesis: ComparisonExplanation['synthesis'];
}): ReactNode {
  const workspace = useWorkspaceSelection();
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [failure, setFailure] = useState<string | null>(null);
  const projectId = workspace.projectId;

  const ids = comparison.concepts.map((concept) => concept.conceptId).join(',');
  useEffect(() => {
    setState('idle');
    setFailure(null);
  }, [ids, synthesis]);

  if (!workspace.ready) return null;
  if (projectId === null) {
    return (
      <State tone="empty" title="Nowhere to keep this yet">
        Comparisons are kept in a project. Create one in the <Link to="/workspace">workspace</Link>{' '}
        and this comparison can be saved with its ids, evidence and missing markers intact.
      </State>
    );
  }

  const save = (): void => {
    setState('saving');
    setFailure(null);
    api
      .save(projectId, {
        itemType: 'comparison',
        label: comparison.concepts.map((concept) => concept.title).join(' vs '),
        payload: {
          conceptIds: comparison.concepts.map((concept) => concept.conceptId),
          builtAt: new Date().toISOString(),
          // The whole table, not a summary of it: a saved comparison that lost
          // its missing markers would read as a complete one later.
          comparison: comparison as unknown as Record<string, unknown>,
          ...(synthesis === null
            ? {}
            : { synthesis: synthesis as unknown as Record<string, unknown> }),
        },
      })
      .then(() => {
        setState('saved');
      })
      .catch((error: unknown) => {
        setState('idle');
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <div className="save-answer">
      <h3 className="private-heading">Keep this comparison</h3>
      <p className="private-what">
        Saves the concept ids, every cell including its missing markers, and the review state each
        column was in, to <strong>{workspace.project?.title ?? 'the current project'}</strong>
        {synthesis === null ? '' : ', together with the synthesis you generated'}.
      </p>
      <button type="button" className="nav-button" onClick={save} disabled={state !== 'idle'}>
        {state === 'saved'
          ? 'Saved to project'
          : state === 'saving'
            ? 'Saving…'
            : 'Save comparison to project'}
      </button>
      {state === 'saved' && (
        <p className="private-message" role="status">
          Kept. It is in <Link to={`/workspace?project=${projectId}`}>your workspace</Link>.
        </p>
      )}
      {failure !== null && (
        <State tone="problem" title="That did not work">
          {failure}
        </State>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ComparePage(): ReactNode {
  const location = useLocation();
  const history = useHistory();

  const [ids, setIds] = useState<string[]>(() => idsFromQuery(location.search));
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [working, setWorking] = useState(false);
  const [failure, setFailure] = useState<{ title: string; detail: string } | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [selection, setSelection] = useState<PrivateSelectionState>(NO_SELECTION);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ComparisonExplanation | null>(null);
  const [explainFailure, setExplainFailure] = useState<string | null>(null);

  /* ------------------------------ selection ------------------------------ */

  const add = useCallback((result: SearchResult) => {
    setIds((current) =>
      current.includes(result.conceptId) || current.length >= MAX
        ? current
        : [...current, result.conceptId],
    );
    setTitles((current) => ({ ...current, [result.conceptId]: result.title }));
  }, []);

  const remove = useCallback((conceptId: string) => {
    setIds((current) => current.filter((id) => id !== conceptId));
  }, []);

  // The selection lives in the URL, so a comparison can be linked to, reloaded
  // and kept in a browser history — none of which should need a save.
  useEffect(() => {
    const next = ids.length === 0 ? '/compare' : `/compare?ids=${ids.join(',')}`;
    if (`${location.pathname}${location.search}` !== next) history.replace(next);
  }, [ids, history, location.pathname, location.search]);

  /* ----------------------------- the comparison --------------------------- */

  useEffect(() => {
    inFlight.current?.abort();
    setExplanation(null);
    setExplainFailure(null);
    if (ids.length < MIN) {
      setComparison(null);
      setFailure(null);
      setWorking(false);
      return;
    }

    const controller = new AbortController();
    inFlight.current = controller;
    setWorking(true);
    setFailure(null);
    api
      .compare(ids, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setComparison(result);
        setTitles((current) => {
          const next = { ...current };
          for (const concept of result.concepts) next[concept.conceptId] = concept.title;
          return next;
        });
        setWorking(false);
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setComparison(null);
        setWorking(false);
        setFailure(
          error instanceof ApiError && error.code === 'index_unavailable'
            ? {
                title: 'The compiled index is not available',
                detail:
                  'Canonical Markdown is unaffected. Recompile the index and comparison will work again.',
              }
            : error instanceof ApiError && error.code === 'concept_not_found'
              ? {
                  title: 'One of those concepts is not in this corpus',
                  detail: `${error.message} Remove it and choose another.`,
                }
              : {
                  title: 'The comparison could not be built',
                  detail:
                    error instanceof ApiError
                      ? error.message
                      : 'The local API did not respond. Is the stack running?',
                },
        );
      });

    return () => {
      controller.abort();
    };
  }, [ids]);

  useEffect(() => () => inFlight.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    void api
      .assistantStatus(controller.signal)
      .then(setStatus)
      .catch(() => {
        setStatus(null);
      });
    return () => controller.abort();
  }, []);

  /* -------------------------------- explain ------------------------------- */

  const explain = (): void => {
    if (comparison === null) return;
    setExplaining(true);
    setExplainFailure(null);
    api
      .explainComparison({
        conceptIds: comparison.concepts.map((concept) => concept.conceptId),
        depth: 'intuitive',
        ...(selection.projectId === undefined ? {} : { projectId: selection.projectId }),
        artifactIds: [...selection.artifactIds],
        noteIds: [...selection.noteIds],
      })
      .then((result) => {
        setExplanation(result);
        setExplaining(false);
      })
      .catch((error: unknown) => {
        setExplaining(false);
        setExplanation(null);
        setExplainFailure(
          error instanceof ApiError
            ? error.message
            : 'The local API did not respond while generating the synthesis.',
        );
      });
  };

  const generationOff = status !== null && !status.available;

  return (
    <Layout
      title="Compare"
      description="Compare two to four concepts field by field, from what the pages actually say."
    >
      <Page
        width="tool"
        title="Compare"
        lede="Put two to four concepts side by side. Every cell is quoted from the canonical page, and a cell the corpus does not have says so rather than going blank."
      >
        <Section heading="Choose what to compare">
          <ConceptSearch
            label="Search for a concept to add"
            hint={`Add between ${String(MIN)} and ${String(MAX)} concepts. Search matches titles, aliases and page text.`}
            placeholder="resnet"
            actionLabel="Add"
            chosenIds={ids}
            disabled={ids.length >= MAX}
            disabledNote={`Four concepts is the most a comparison can hold and stay readable. Remove one to add another.`}
            onChoose={add}
          />

          <div className="compare-chosen">
            <h3 className="compare-chosen__heading">
              Comparing {ids.length} {ids.length === 1 ? 'concept' : 'concepts'}
            </h3>
            {ids.length === 0 ? (
              <p className="compare-chosen__empty">
                Nothing chosen yet. Search above, or open a comparison from a concept page.
              </p>
            ) : (
              <ul className="compare-chosen__list">
                {ids.map((id) => (
                  <li key={id} className="compare-chosen__item">
                    <span className="compare-chosen__name">{titles[id] ?? id}</span>
                    <button
                      type="button"
                      className="nav-button nav-button--quiet"
                      onClick={() => {
                        remove(id);
                      }}
                    >
                      Remove<span className="nav-visually-hidden"> {titles[id] ?? id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {ids.length === 1 && (
              <p className="compare-chosen__empty">
                A comparison needs at least two. Add one more.
              </p>
            )}
          </div>
        </Section>

        {working && (
          <State tone="working" title="Building the comparison…">
            This reads the compiled index on your machine. No model is involved.
          </State>
        )}

        {failure !== null && !working && (
          <State tone="problem" title={failure.title}>
            {failure.detail}
          </State>
        )}

        {comparison !== null && !working && (
          <>
            <Section heading="Field by field">
              <p className="compare-completeness">
                {comparison.completeness.missing === 0
                  ? `All ${String(comparison.completeness.cells)} cells are filled from the pages themselves.`
                  : `${String(comparison.completeness.missing)} of ${String(comparison.completeness.cells)} cells are missing. A missing cell is a gap in this corpus, not a gap in the idea.`}
              </p>
              <Table comparison={comparison} />
            </Section>

            <Section heading="How they relate">
              {comparison.between.length === 0 ? (
                <p className="compare-empty">
                  No page declares a relationship between these concepts. That is a statement about
                  this corpus, not about the ideas.
                </p>
              ) : (
                <ul className="compare-relationships">
                  {comparison.between.map((edge) => (
                    <li key={`${edge.direction}-${edge.type}-${edge.otherId}`}>
                      <span className="compare-relationships__type">
                        {edge.type.replace(/_/g, ' ')}
                      </span>{' '}
                      <span className="compare-relationships__what">
                        {edge.direction === 'outgoing' ? 'to' : 'from'} {edge.otherTitle}
                      </span>
                      {edge.note !== null && (
                        <span className="compare-relationships__note"> — {edge.note}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section heading="Sources behind these columns">
              {comparison.sources.length === 0 ? (
                <p className="compare-empty">
                  None of these pages cites a source. Treat every cell above as unverified.
                </p>
              ) : (
                <ul className="compare-sources">
                  {comparison.sources.map((source) => (
                    <li key={source.sourceId}>
                      <a href={source.url} rel="noreferrer noopener" target="_blank">
                        {source.title}
                      </a>
                      <span className="compare-sources__meta">
                        {' '}
                        · {source.sourceKind} · checked {source.checkedOn}
                      </span>
                      <span className="compare-sources__cited">
                        Cited by {source.citedBy.map((id) => titles[id] ?? id).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section heading="Explain this comparison">
              <p className="compare-explain__what">
                The local model is given the table above and nothing else — no other part of either
                page. It may cite only these concepts and the sources they cite. If it cites
                anything else, the synthesis is discarded and this table stays exactly as it is.
              </p>

              <PrivateContextPicker value={selection} onChange={setSelection} />

              {generationOff && (
                <State tone="caution" title="Generation is switched off">
                  {status?.detail ??
                    'No assistant provider is configured, so no synthesis can be generated. The comparison above does not need one.'}
                </State>
              )}

              <div className="nav-actions">
                <button
                  type="button"
                  className="nav-button"
                  onClick={explain}
                  disabled={explaining || generationOff}
                >
                  {explaining ? 'Generating…' : 'Explain this comparison'}
                </button>
              </div>

              {explaining && (
                <State tone="working" title="Asking the local model…">
                  This runs on your machine. The comparison above is already complete.
                </State>
              )}

              {explainFailure !== null && !explaining && (
                <State tone="problem" title="The request did not complete">
                  {explainFailure}
                </State>
              )}

              {explanation !== null && explanation.synthesis === null && (
                <State tone="problem" title="No synthesis was generated">
                  {explanation.error?.message ?? 'The model reply was rejected.'}
                  {explanation.error?.code === 'fabricated_citation' && (
                    <>
                      {' '}
                      It cited something it was not given, so it was discarded rather than shown.
                      The comparison above is unaffected.
                    </>
                  )}
                </State>
              )}

              {explanation !== null && explanation.synthesis !== null && (
                <div className="answer">
                  <section className="answer__section answer__section--interpretation">
                    <h3 className="answer__heading">How the comparison was read</h3>
                    <p className="answer__prose">{explanation.synthesis.interpretation}</p>
                  </section>
                  <section className="answer__section answer__section--answer">
                    <h3 className="answer__heading">Synthesis</h3>
                    <p className="answer__prose">{explanation.synthesis.answer}</p>
                  </section>
                  {explanation.synthesis.missingInformation.length > 0 && (
                    <section className="answer__section answer__section--uncertain">
                      <h3 className="answer__heading">Missing information</h3>
                      <ul className="answer__list">
                        {explanation.synthesis.missingInformation.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <section className="answer__section answer__section--plain">
                    <h3 className="answer__heading">Citations</h3>
                    {explanation.synthesis.citations.length === 0 ? (
                      <p className="answer__empty">
                        Nothing was cited, so nothing above is supported by more than the table.
                      </p>
                    ) : (
                      <ul className="answer__list">
                        {explanation.synthesis.citations.map((citation) => (
                          <li key={`${citation.kind}-${citation.id}`}>
                            {citation.slug !== null && citation.slug !== undefined ? (
                              <Link to={citation.slug}>{citation.label}</Link>
                            ) : citation.url !== null && citation.url !== undefined ? (
                              <a href={citation.url} rel="noreferrer noopener" target="_blank">
                                {citation.label}
                              </a>
                            ) : (
                              citation.label
                            )}{' '}
                            <Identifier>{citation.id}</Identifier>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <Confidence level={explanation.synthesis.confidence} />
                  <PrivateContextUsed context={explanation.privateContext} />
                </div>
              )}
            </Section>

            <Section heading="Keep this">
              <SaveComparison comparison={comparison} synthesis={explanation?.synthesis ?? null} />
            </Section>
          </>
        )}
      </Page>
    </Layout>
  );
}
