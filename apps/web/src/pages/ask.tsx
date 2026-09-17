import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { Identifier, Page, ReviewStateBadge, Section, State } from '@site/src/components/Ui';
import { Confidence } from '@site/src/components/Confidence';
import { SaveAnswer } from '@site/src/components/SaveAnswer';
import { ApiError, api, isAbort } from '@site/src/lib/api';
import type { AssistantResponse, AssistantStatus, ResearchSession } from '@site/src/lib/api';
import { railClass } from '@site/src/lib/review-state';
import { useWorkspaceSelection } from '@site/src/lib/workspace';

const MODES = [
  { value: 'unstick', label: 'Help me get unstuck' },
  { value: 'understand', label: 'Understand a concept' },
  { value: 'compare', label: 'Compare approaches' },
  { value: 'path', label: 'Find a route' },
] as const;

const DEPTHS = [
  { value: 'quick', label: 'Quick' },
  { value: 'intuitive', label: 'Intuitive' },
  { value: 'formal', label: 'Formal' },
] as const;

type Mode = (typeof MODES)[number]['value'];
type Depth = (typeof DEPTHS)[number]['value'];

function isMode(value: string | null): value is Mode {
  return MODES.some((mode) => mode.value === value);
}

/** One section of the structured answer. */
function AnswerSection({
  heading,
  variant,
  items,
  emptyNote,
}: {
  heading: string;
  variant: 'interpretation' | 'answer' | 'uncertain' | 'disqualifier' | 'plain';
  items: readonly string[];
  emptyNote: string;
}): ReactNode {
  return (
    <section className={`answer__section answer__section--${variant}`}>
      <h3 className="answer__heading">{heading}</h3>
      {items.length === 0 ? (
        <p className="answer__empty">{emptyNote}</p>
      ) : (
        <ul className="answer__list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AskPage(): ReactNode {
  // Sessions of the current project, so an answer can be filed under one.
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const location = useLocation();
  const initialMode = new URLSearchParams(location.search).get('mode');

  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [mode, setMode] = useState<Mode>(isMode(initialMode) ? initialMode : 'unstick');
  const [depth, setDepth] = useState<Depth>('intuitive');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [working, setWorking] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);

  const workspace = useWorkspaceSelection();
  useEffect(() => {
    const projectId = workspace.projectId;
    if (projectId === null) {
      setSessions([]);
      return;
    }
    const controller = new AbortController();
    api
      .listSessions(projectId, controller.signal)
      .then((page) => {
        setSessions(page.items);
      })
      .catch(() => {
        setSessions([]);
      });
    return () => {
      controller.abort();
    };
  }, [workspace.projectId]);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void api
      .assistantStatus(controller.signal)
      .then(setStatus)
      .catch((error: unknown) => {
        if (!isAbort(error)) setStatusFailed(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => inFlight.current?.abort(), []);

  const send = useCallback(
    async (askMode: Mode, askDepth: Depth) => {
      const trimmed = question.trim();
      if (trimmed === '') {
        setValidationError('Enter a question before asking.');
        return;
      }
      setValidationError(null);
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      setWorking(true);
      setTransportError(null);

      try {
        const result = await api.ask(
          {
            question: trimmed,
            ...(context.trim() === '' ? {} : { context: context.trim() }),
            mode: askMode,
            depth: askDepth,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResponse(result);
      } catch (error) {
        if (isAbort(error)) return;
        setResponse(null);
        setTransportError(
          error instanceof ApiError
            ? error.message
            : 'The local API did not respond. Your question and context are still here.',
        );
      } finally {
        if (!controller.signal.aborted) setWorking(false);
      }
    },
    [question, context],
  );

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    void send(mode, depth);
  };

  /** Re-run the same question at another depth, changing only the depth. */
  const rerunAtDepth = (next: Depth): void => {
    setDepth(next);
    void send(mode, next);
  };

  const cancel = (): void => {
    inFlight.current?.abort();
    setWorking(false);
  };

  const result = response?.result ?? null;
  const failure = response?.error ?? null;

  return (
    <Layout title="Ask" description="Ask a grounded question about the knowledge base.">
      <Page
        width="tool"
        title="Ask"
        lede="Describe where you are. The answer separates what the knowledge base supports from what it does not, and cites only material it was actually given."
      >
        {statusFailed && (
          <State tone="problem" title="The local API is not responding">
            Browsing and search need it too. Check that the stack is running, then reload.
          </State>
        )}

        {status !== null && !status.available && (
          <State tone="caution" title="Generation is unavailable right now">
            {status.detail} You can still browse, search and inspect the graph.
          </State>
        )}

        <form onSubmit={submit}>
          <label className="nav-field" htmlFor="question">
            <span className="nav-field__label">Your question</span>
            <span className="nav-field__hint">
              Say what you are trying to do and where it is going wrong.
            </span>
            <textarea
              id="question"
              className="nav-textarea"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="My image model keeps losing small spatial details after repeated downsampling. What should I inspect?"
              maxLength={2000}
              aria-invalid={validationError !== null}
              aria-describedby={validationError === null ? undefined : 'question-error'}
            />
          </label>

          {validationError !== null && (
            <p id="question-error" role="alert" className="nav-state__body">
              {validationError}
            </p>
          )}

          <label className="nav-field" htmlFor="context">
            <span className="nav-field__label">Research context (optional)</span>
            <span className="nav-field__hint">
              Data, model, sizes, what you have already tried. This is sent only to the configured
              local provider
              {status?.model === null || status?.model === undefined ? '' : ` (${status.model})`}.
              Nothing leaves your machine in the default stack.
            </span>
            <textarea
              id="context"
              className="nav-textarea"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              maxLength={8000}
            />
          </label>

          <div className="nav-field">
            <span className="nav-field__label" id="mode-label">
              What kind of help
            </span>
            <div className="nav-choices" role="group" aria-labelledby="mode-label">
              {MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="nav-choice"
                  aria-pressed={mode === option.value}
                  onClick={() => setMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="nav-field">
            <span className="nav-field__label" id="depth-label">
              Depth
            </span>
            <div className="nav-choices" role="group" aria-labelledby="depth-label">
              {DEPTHS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="nav-choice"
                  aria-pressed={depth === option.value}
                  onClick={() => setDepth(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="nav-actions">
            <button className="nav-button" type="submit" disabled={working}>
              {working ? 'Asking…' : 'Ask'}
            </button>
            {working && (
              <button className="nav-button nav-button--quiet" type="button" onClick={cancel}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {working && (
          <div className="nav-section">
            <State tone="working" title="Asking the local model…">
              This runs on your machine and can take a while on a large model. Cancelling stops the
              request; your question and context stay in the form.
            </State>
          </div>
        )}

        {transportError !== null && !working && (
          <div className="nav-section">
            <State tone="problem" title="The request did not complete">
              {transportError}
            </State>
          </div>
        )}

        {failure !== null && !working && (
          <div className="nav-section">
            <State tone="problem" title="No answer was generated">
              {failure.message}
              {failure.code === 'fabricated_citation' && (
                <>
                  {' '}
                  The answer was discarded rather than shown with a citation that does not exist.
                </>
              )}
            </State>
          </div>
        )}

        {result !== null && !working && (
          <Section heading="Structured answer">
            <div className="answer">
              <section className="answer__section answer__section--interpretation">
                <h3 className="answer__heading">How the question was read</h3>
                <p className="answer__prose">{result.interpretation}</p>
              </section>

              <section className="answer__section answer__section--answer">
                <h3 className="answer__heading">Answer</h3>
                <p className="answer__prose">{result.answer}</p>
              </section>

              <section className="answer__section answer__section--plain">
                <h3 className="answer__heading">Candidate routes</h3>
                {result.candidateRoutes.length === 0 ? (
                  <p className="answer__empty">
                    No route is proposed. The retrieved material does not support one.
                  </p>
                ) : (
                  result.candidateRoutes.map((route) => (
                    <div key={route.title} className="answer__route">
                      <h4 className="answer__route-title">{route.title}</h4>
                      <p className="answer__route-rationale">{route.rationale}</p>
                    </div>
                  ))
                )}
              </section>

              <AnswerSection
                heading="Assumptions this rests on"
                variant="uncertain"
                items={result.assumptions}
                emptyNote="No assumptions were stated. Treat that as a gap, not as certainty."
              />

              <AnswerSection
                heading="What would rule this out"
                variant="disqualifier"
                items={result.disqualifiers}
                emptyNote="No disqualifiers were given."
              />

              <AnswerSection
                heading="Missing information"
                variant="uncertain"
                items={result.missingInformation}
                emptyNote="Nothing was flagged as missing."
              />

              <AnswerSection
                heading="Next checks"
                variant="plain"
                items={result.nextChecks}
                emptyNote="No next check was proposed."
              />

              <section className="answer__section answer__section--plain">
                <h3 className="answer__heading">Citations</h3>
                {result.citations.length === 0 ? (
                  <p className="answer__empty">
                    Nothing was cited. Every statement above is therefore unsupported by the
                    retrieved material.
                  </p>
                ) : (
                  <ul className="answer__list">
                    {result.citations
                      .filter(
                        (citation, index, all) =>
                          all.findIndex(
                            (other) => other.kind === citation.kind && other.id === citation.id,
                          ) === index,
                      )
                      .map((citation) => (
                        <li key={`${citation.kind}:${citation.id}`}>
                          {citation.kind === 'concept' && citation.slug !== null ? (
                            <Link to={citation.slug}>{citation.label}</Link>
                          ) : citation.kind === 'source' && citation.url !== null ? (
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noreferrer noopener external"
                            >
                              {citation.label}
                            </a>
                          ) : (
                            <>
                              {citation.label}{' '}
                              <span className="nav-badge nav-badge--disputed">
                                no address on file
                              </span>
                            </>
                          )}{' '}
                          <Identifier>{citation.id}</Identifier>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              <section className="answer__section answer__section--plain">
                <h3 className="answer__heading">Confidence</h3>
                <Confidence level={result.confidence} />
              </section>
            </div>

            <div className="nav-actions" style={{ marginTop: '1.5rem' }}>
              <span className="nav-fact__key">Answer again at</span>
              {DEPTHS.filter((option) => option.value !== depth).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="nav-button nav-button--quiet"
                  onClick={() => rerunAtDepth(option.value)}
                  disabled={working}
                >
                  {option.label} depth
                </button>
              ))}
            </div>

            <p className="home-trust">
              Generated by {response?.provider}
              {response?.model === null || response?.model === undefined
                ? ''
                : ` using ${response.model}`}{' '}
              in {Math.round((response?.elapsedMs ?? 0) / 100) / 10}s. Nothing was stored, and no
              canonical page changed. Request <Identifier>{response?.requestId}</Identifier>.
            </p>

            {response !== null && (
              <SaveAnswer
                response={response}
                question={question}
                context={context}
                sessions={sessions}
              />
            )}
          </Section>
        )}
        {response !== null && !working && (
          <Section heading="The canonical material this was drawn from">
            {response.retrieval.conceptCount === 0 ? (
              <State tone="empty" title="Nothing in the knowledge base matched this question">
                There is no evidence here to answer from. That is a fact about this knowledge base,
                not about your question.
              </State>
            ) : (
              <>
                <ul className="result-list">
                  {response.retrieval.concepts.map((concept) => (
                    <li key={concept.conceptId} className={railClass(concept.reviewState)}>
                      <h3 className="result__title">
                        <Link to={concept.slug}>{concept.title}</Link>
                      </h3>
                      <p className="result__summary">{concept.summary}</p>
                      <p className="result__why">
                        {concept.rankExplanation} · <ReviewStateBadge state={concept.reviewState} />
                      </p>
                    </li>
                  ))}
                </ul>
                {response.retrieval.truncated && (
                  <p className="result__why">
                    Some material was left out to fit the size limit. Treat a missing concept as no
                    evidence either way.
                  </p>
                )}
                {response.retrieval.sources.length > 0 && (
                  <ul className="concept-sources" style={{ marginTop: '1.25rem' }}>
                    {response.retrieval.sources.map((source) => (
                      <li key={source.sourceId}>
                        <a
                          className="concept-source__title"
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener external"
                        >
                          {source.title}
                        </a>
                        <p className="concept-source__meta">
                          {source.sourceKind} · supports {source.supports.join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Section>
        )}
      </Page>
    </Layout>
  );
}
