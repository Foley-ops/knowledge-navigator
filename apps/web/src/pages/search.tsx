import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import { Page, ReviewStateBadge, State } from '@site/src/components/Ui';
import { ApiError, api, isAbort } from '@site/src/lib/api';
import type { SearchResponse } from '@site/src/lib/api';
import { railClass } from '@site/src/lib/review-state';

type Status = 'idle' | 'working' | 'done' | 'failed';

const DEBOUNCE_MS = 200;

export default function SearchPage(): ReactNode {
  const location = useLocation();
  const history = useHistory();
  const initial = new URLSearchParams(location.search).get('q') ?? '';

  const [query, setQuery] = useState(initial);
  const [status, setStatus] = useState<Status>('idle');
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [failure, setFailure] = useState<{ title: string; detail: string } | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const run = useCallback(async (text: string) => {
    inFlight.current?.abort();
    const trimmed = text.trim();
    if (trimmed === '') {
      setStatus('idle');
      setResponse(null);
      setFailure(null);
      return;
    }

    const controller = new AbortController();
    inFlight.current = controller;
    setStatus('working');
    setFailure(null);

    try {
      const result = await api.search(trimmed, 20, controller.signal);
      if (controller.signal.aborted) return;
      setResponse(result);
      setStatus('done');
    } catch (error) {
      if (isAbort(error)) return;
      setResponse(null);
      setStatus('failed');
      setFailure(
        error instanceof ApiError && error.code === 'index_unavailable'
          ? {
              title: 'The compiled index is not available',
              detail:
                'Canonical Markdown is unaffected. Recompile the index and search will work again.',
            }
          : {
              title: 'Search is unavailable',
              detail:
                error instanceof ApiError
                  ? error.message
                  : 'The local API did not respond. Is the stack running?',
            },
      );
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void run(query), DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query, run]);

  useEffect(() => () => inFlight.current?.abort(), []);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const trimmed = query.trim();
    history.replace(trimmed === '' ? '/search' : `/search?q=${encodeURIComponent(trimmed)}`);
    void run(query);
  };

  return (
    <Layout title="Search" description="Find a concept by name, alias or page text.">
      <Page
        title="Search"
        lede="Find a concept without knowing its exact name. Aliases and page text are searched too, and every result says why it matched."
      >
        <form onSubmit={submit} role="search">
          <label className="nav-field">
            <span className="nav-field__label">Search the knowledge base</span>
            <input
              className="nav-input"
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="conv layer"
              autoComplete="off"
              aria-describedby="search-status"
            />
          </label>
        </form>

        <div id="search-status" className="nav-section">
          {status === 'working' && <State tone="working" title="Searching…" />}

          {status === 'failed' && failure !== null && (
            <State tone="problem" title={failure.title}>
              {failure.detail}
            </State>
          )}

          {status === 'idle' && (
            <State tone="empty" title="Type to search">
              Try a concept name, an alias such as “conv layer”, or a phrase from a page.
            </State>
          )}

          {status === 'done' && response !== null && response.count === 0 && (
            <State tone="empty" title={`Nothing matches “${response.query}”`}>
              This knowledge base currently holds eleven concepts about convolutional networks and
              their mathematical foundations. Try a broader term, or browse the{' '}
              <Link to="/explore">map</Link>.
            </State>
          )}

          {status === 'done' && response !== null && response.count > 0 && (
            <>
              <p className="result__why" aria-live="polite">
                {response.count} {response.count === 1 ? 'result' : 'results'} for “{response.query}
                ”
              </p>
              <ul className="result-list">
                {response.results.map((hit) => (
                  <li key={hit.conceptId} className={railClass(hit.reviewState)}>
                    <h2 className="result__title">
                      <Link to={hit.slug}>{hit.title}</Link>
                    </h2>
                    <p className="result__summary">{hit.summary}</p>
                    <p className="result__why">
                      {hit.rankExplanation} · <ReviewStateBadge state={hit.reviewState} />
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Page>
    </Layout>
  );
}
