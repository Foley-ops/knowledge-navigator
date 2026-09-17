import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import { Identifier, Page, ReviewStateBadge, Section, State } from '@site/src/components/Ui';
import { ConceptSearch } from '@site/src/components/ConceptSearch';
import { ApiError, api, isAbort } from '@site/src/lib/api';
import type { LearningPath, PathStep, SearchResult } from '@site/src/lib/api';
import { railClass } from '@site/src/lib/review-state';
import { useWorkspaceSelection } from '@site/src/lib/workspace';

/**
 * Build a path (v2 runbook Q06).
 *
 * A route here is only ever made of relationships a page actually declared:
 * `requires` and `prerequisite_of`, nothing else. Related concepts arranged in
 * a plausible order would look exactly like a curriculum and would be one
 * nobody checked, so when the corpus supports no route the page says that and
 * lists what is missing instead.
 *
 * Familiarity is read only when the researcher points at a project, and every
 * record that changed the route is named — a shorter path with no explanation
 * is indistinguishable from a wrong one.
 */

const FAMILIARITY_LABEL: Record<string, string> = {
  unfamiliar: 'Unfamiliar',
  recognize: 'Recognise the name',
  working: 'Working knowledge',
  strong: 'Strong',
};

function parseQuery(search: string): { target: string | null; known: string[] } {
  const params = new URLSearchParams(search);
  const known = (params.get('known') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  return { target: params.get('target'), known };
}

/** What an edge means, in the words a reader can check against the page. */
function Because({ step, afterTitle }: { step: PathStep; afterTitle: string }): ReactNode {
  if (step.because === null) {
    return <p className="path-step__because">This is what you are working towards.</p>;
  }
  const declaredHere = step.because.declaredBy === step.conceptId;
  return (
    <p className="path-step__because">
      Comes before <strong>{afterTitle}</strong>, because{' '}
      {declaredHere ? 'this page' : `the ${afterTitle} page`} declares{' '}
      <code className="nav-id">{step.because.type}</code>
      {step.because.note === null ? '.' : <> — {step.because.note}</>}
    </p>
  );
}

function Step({
  step,
  afterTitle,
  known,
  onKnown,
  onInclude,
}: {
  step: PathStep;
  afterTitle: string;
  known: boolean;
  onKnown(conceptId: string): void;
  onInclude(conceptId: string): void;
}): ReactNode {
  return (
    <li className={`path-step ${railClass(step.reviewState)}`}>
      <div className="path-step__head">
        <span className="path-step__position" aria-hidden="true">
          {step.position}
        </span>
        <h3 className="path-step__title">
          <span className="nav-visually-hidden">Step {step.position}: </span>
          {step.hasArticle ? <Link to={step.slug}>{step.title}</Link> : <span>{step.title}</span>}
        </h3>
      </div>

      <p className="path-step__meta">
        Tier {step.tier} · <ReviewStateBadge state={step.reviewState} />
        {!step.hasArticle && (
          <span className="path-step__no-article">
            Graph-only identity: a stable address with no article to read yet.
          </span>
        )}
      </p>

      <p className="path-step__summary">{step.summary}</p>
      <Because step={step} afterTitle={afterTitle} />

      {step.familiarity !== null && (
        <p className="path-step__familiarity">
          You recorded this as {FAMILIARITY_LABEL[step.familiarity] ?? step.familiarity}
          {step.likelyKnown ? ' — probably a refresher rather than new ground.' : '.'}
        </p>
      )}

      <p className="path-step__actions">
        <Identifier>{step.conceptId}</Identifier>
        {step.because !== null &&
          (known ? (
            <button
              type="button"
              className="nav-button nav-button--quiet"
              onClick={() => {
                onInclude(step.conceptId);
              }}
            >
              Put back<span className="nav-visually-hidden"> {step.title}</span>
            </button>
          ) : (
            <button
              type="button"
              className="nav-button nav-button--quiet"
              onClick={() => {
                onKnown(step.conceptId);
              }}
            >
              I already know this<span className="nav-visually-hidden"> — {step.title}</span>
            </button>
          ))}
      </p>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Saving                                                                      */
/* -------------------------------------------------------------------------- */

function SavePath({ path, known }: { path: LearningPath; known: readonly string[] }): ReactNode {
  const workspace = useWorkspaceSelection();
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [failure, setFailure] = useState<string | null>(null);
  const projectId = workspace.projectId;

  const signature = `${path.targetId}:${known.join(',')}:${String(path.steps.length)}`;
  useEffect(() => {
    setState('idle');
    setFailure(null);
  }, [signature]);

  if (!workspace.ready) return null;
  if (projectId === null) {
    return (
      <State tone="empty" title="Nowhere to keep this yet">
        Routes are kept in a project. Create one in the <Link to="/workspace">workspace</Link> and
        this route can be saved with every step, edge and missing note intact.
      </State>
    );
  }

  const save = (): void => {
    setState('saving');
    setFailure(null);
    // requestId and familiarityAvailable belong to one HTTP call, not to the
    // route, so they are not part of what is kept.
    const { requestId: _requestId, familiarityAvailable: _available, ...snapshot } = path;
    api
      .save(projectId, {
        itemType: 'path',
        label: `Path to ${path.targetTitle}`,
        payload: {
          targetConceptId: path.targetId,
          knownConceptIds: [...known],
          builtAt: new Date().toISOString(),
          path: snapshot as unknown as Record<string, unknown>,
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
      <h3 className="private-heading">Keep this route</h3>
      <p className="private-what">
        Saves every step in order, the declared edge behind each one, what you said you already
        know, and what the graph does not say, to{' '}
        <strong>{workspace.project?.title ?? 'the current project'}</strong>. Export it as Markdown
        with <code className="nav-id">navigator export saved &lt;id&gt;</code>.
      </p>
      <button type="button" className="nav-button" onClick={save} disabled={state !== 'idle'}>
        {state === 'saved'
          ? 'Saved to project'
          : state === 'saving'
            ? 'Saving…'
            : 'Save route to project'}
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

export default function PathPage(): ReactNode {
  const location = useLocation();
  const history = useHistory();
  const initial = useMemo(() => parseQuery(location.search), [location.search]);

  const [targetId, setTargetId] = useState<string | null>(initial.target);
  const [targetTitle, setTargetTitle] = useState<string | null>(null);
  const [known, setKnown] = useState<string[]>(initial.known);
  const [usePersonal, setUsePersonal] = useState(false);

  const [path, setPath] = useState<LearningPath | null>(null);
  /**
   * Titles seen so far, kept across rebuilds. A concept the researcher marks as
   * known leaves the route, and a chip that then read `concept.deep_learning.
   * pooling` would be a worse label than the one they just clicked.
   */
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [working, setWorking] = useState(false);
  const [failure, setFailure] = useState<{ title: string; detail: string } | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const workspace = useWorkspaceSelection();
  const projectId = workspace.projectId;

  const choose = useCallback((result: SearchResult) => {
    setTargetId(result.conceptId);
    setTargetTitle(result.title);
    setTitles((current) => ({ ...current, [result.conceptId]: result.title }));
    setKnown([]);
  }, []);

  const addKnown = useCallback((conceptId: string) => {
    setKnown((current) => (current.includes(conceptId) ? current : [...current, conceptId]));
  }, []);

  const removeKnown = useCallback((conceptId: string) => {
    setKnown((current) => current.filter((id) => id !== conceptId));
  }, []);

  // The route lives in the address, so it can be linked to and reloaded.
  useEffect(() => {
    const params = new URLSearchParams();
    if (targetId !== null) params.set('target', targetId);
    if (known.length > 0) params.set('known', known.join(','));
    const query = params.toString();
    const next = query === '' ? '/path' : `/path?${query}`;
    if (`${location.pathname}${location.search}` !== next) history.replace(next);
  }, [targetId, known, history, location.pathname, location.search]);

  useEffect(() => {
    inFlight.current?.abort();
    if (targetId === null) {
      setPath(null);
      setFailure(null);
      setWorking(false);
      return;
    }

    const controller = new AbortController();
    inFlight.current = controller;
    setWorking(true);
    setFailure(null);
    api
      .path(
        {
          targetId,
          known,
          ...(usePersonal && projectId !== null ? { projectId } : {}),
        },
        controller.signal,
      )
      .then((result) => {
        if (controller.signal.aborted) return;
        setPath(result);
        setTargetTitle(result.targetTitle);
        setTitles((current) => {
          const next = { ...current, [result.targetId]: result.targetTitle };
          for (const step of result.steps) next[step.conceptId] = step.title;
          for (const item of result.startedFrom) next[item.conceptId] = item.title;
          return next;
        });
        setWorking(false);
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setPath(null);
        setWorking(false);
        setFailure(
          error instanceof ApiError && error.code === 'index_unavailable'
            ? {
                title: 'The compiled index is not available',
                detail:
                  'Canonical Markdown is unaffected. Recompile the index and paths will work again.',
              }
            : {
                title: 'The route could not be built',
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
  }, [targetId, known, usePersonal, projectId]);

  useEffect(() => () => inFlight.current?.abort(), []);

  return (
    <Layout
      title="Path"
      description="Build a route to a concept from the prerequisites the corpus actually declares."
    >
      <Page
        width="tool"
        title="Build a path"
        lede="Choose what you are trying to understand. The route is built only from prerequisites a page declares, so it is short, checkable, and honest about what the corpus does not say."
      >
        <Section heading="Where you are going">
          <ConceptSearch
            label="Search for the concept you want to reach"
            hint="The route is built backwards from here, over declared prerequisites only."
            placeholder="resnet"
            actionLabel="Choose"
            chosenIds={targetId === null ? [] : [targetId]}
            onChoose={choose}
          />

          {targetId !== null && (
            <p className="path-target">
              Building a route to <strong>{targetTitle ?? targetId}</strong>{' '}
              <button
                type="button"
                className="nav-button nav-button--quiet"
                onClick={() => {
                  setTargetId(null);
                  setTargetTitle(null);
                  setKnown([]);
                }}
              >
                Clear
              </button>
            </p>
          )}
        </Section>

        <Section heading="What you already know">
          {workspace.ready && projectId === null ? (
            <p className="path-personal">
              You have no project selected, so nothing you have recorded is used. Create or choose
              one in the <Link to="/workspace">workspace</Link> to personalise a route with your own
              familiarity records.
            </p>
          ) : (
            <label className="nav-check">
              <input
                type="checkbox"
                checked={usePersonal}
                onChange={(event) => {
                  setUsePersonal(event.currentTarget.checked);
                }}
              />{' '}
              Use the familiarity I recorded in{' '}
              <strong>{workspace.project?.title ?? 'the current project'}</strong>
            </label>
          )}

          {known.length === 0 ? (
            <p className="path-personal">
              You have not marked anything as known. Every step below is included.
            </p>
          ) : (
            <ul className="path-known">
              {known.map((id) => (
                <li key={id}>
                  <span>{titles[id] ?? id}</span>
                  <button
                    type="button"
                    className="nav-button nav-button--quiet"
                    onClick={() => {
                      removeKnown(id);
                    }}
                  >
                    Put back<span className="nav-visually-hidden"> {titles[id] ?? id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {working && (
          <State tone="working" title="Building the route…">
            This reads the compiled graph on your machine. No model is involved.
          </State>
        )}

        {failure !== null && !working && (
          <State tone="problem" title={failure.title}>
            {failure.detail}
          </State>
        )}

        {targetId === null && !working && (
          <State tone="empty" title="Choose a destination">
            Search above for the concept you are trying to understand.
          </State>
        )}

        {path !== null && !working && (
          <>
            {path.familiarityAvailable === false && (
              <State tone="caution" title="Your familiarity could not be read">
                The private store is unavailable, so this route is the general one. Nothing you
                recorded has been used or lost.
              </State>
            )}

            <Section heading={path.reachable ? 'The route' : 'No route is recorded'}>
              {path.reachable ? (
                <>
                  <p className="path-count">
                    {path.steps.length} {path.steps.length === 1 ? 'step' : 'steps'}, read in this
                    order. Every step is here because a page says it comes first.
                  </p>
                  <ol className="path-steps">
                    {path.steps.map((step, index) => (
                      <Step
                        key={step.conceptId}
                        step={step}
                        afterTitle={
                          step.because === null
                            ? path.targetTitle
                            : (titles[step.because.afterId] ??
                              path.steps[index + 1]?.title ??
                              path.targetTitle)
                        }
                        known={known.includes(step.conceptId)}
                        onKnown={addKnown}
                        onInclude={removeKnown}
                      />
                    ))}
                  </ol>
                </>
              ) : (
                <p className="path-count">
                  Nothing in this corpus declares a prerequisite for{' '}
                  <strong>{path.targetTitle}</strong>. Rather than arrange related concepts into a
                  route nobody checked, this page shows none.
                </p>
              )}
            </Section>

            {path.startedFrom.length > 0 && (
              <Section heading="Starting from what you know">
                <ul className="path-notes">
                  {path.startedFrom.map((item) => (
                    <li key={item.conceptId}>
                      <strong>{item.title}</strong>{' '}
                      {item.reason === 'declared-known'
                        ? 'was left out because you said you know it.'
                        : 'was left out because you recorded strong familiarity with it.'}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {path.familiarityEffects.length > 0 && (
              <Section heading="What your records changed">
                <ul className="path-notes">
                  {path.familiarityEffects.map((effect) => (
                    <li key={`${effect.conceptId}-${effect.effect}`}>
                      <strong>{effect.title}</strong> —{' '}
                      {FAMILIARITY_LABEL[effect.level] ?? effect.level}:{' '}
                      {effect.effect === 'treated-as-known'
                        ? 'treated as a starting point, so it is not a step.'
                        : 'kept as a step and marked likely known.'}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {path.missing.length > 0 && (
              <Section heading="What the graph does not say">
                <ul className="path-notes path-notes--missing">
                  {path.missing.map((item) => (
                    <li key={`${item.conceptId}-${item.reason}`}>
                      <strong>{item.title}</strong> — {item.reason}
                    </li>
                  ))}
                </ul>
                <p className="path-personal">
                  A gap here is a gap in this corpus, not in the subject. The{' '}
                  <Link to="/coverage">coverage map</Link> shows where the work has not been done.
                </p>
              </Section>
            )}

            {path.truncated && (
              <State tone="caution" title="This route was cut short">
                The chain of prerequisites is longer than a route this page will draw. What is shown
                is the part nearest the destination.
              </State>
            )}

            <Section heading="Keep this">
              <SavePath path={path} known={known} />
            </Section>
          </>
        )}
      </Page>
    </Layout>
  );
}
