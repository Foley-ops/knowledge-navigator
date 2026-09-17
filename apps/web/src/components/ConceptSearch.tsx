import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ReviewStateBadge, State } from '@site/src/components/Ui';
import { ApiError, api, isAbort } from '@site/src/lib/api';
import type { SearchResult } from '@site/src/lib/api';
import { railClass } from '@site/src/lib/review-state';

/**
 * Find a concept and choose it (v2 runbook Q02, Q06).
 *
 * Compare and Path both begin the same way: the researcher knows roughly what
 * they mean and not its exact id. The same search the Search page uses is
 * reused here, including the reason each result matched, because choosing the
 * wrong concept silently is the expensive mistake on both pages.
 *
 * Everything is a real button and a real input, in document order, so the whole
 * flow works from the keyboard without a single custom key handler.
 */

const DEBOUNCE_MS = 200;
const LIMIT = 8;

export function ConceptSearch({
  label,
  hint,
  placeholder,
  actionLabel,
  chosenIds,
  disabled = false,
  disabledNote,
  onChoose,
}: {
  readonly label: string;
  readonly hint: string;
  readonly placeholder: string;
  /** The verb on each result's button: "Add" on Compare, "Choose" on Path. */
  readonly actionLabel: string;
  readonly chosenIds: readonly string[];
  readonly disabled?: boolean;
  readonly disabledNote?: string;
  onChoose(result: SearchResult): void;
}): ReactNode {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [working, setWorking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const run = useCallback(async (text: string) => {
    inFlight.current?.abort();
    const trimmed = text.trim();
    if (trimmed === '') {
      setResults(null);
      setWorking(false);
      setFailure(null);
      return;
    }
    const controller = new AbortController();
    inFlight.current = controller;
    setWorking(true);
    setFailure(null);
    try {
      const response = await api.search(trimmed, LIMIT, controller.signal);
      if (controller.signal.aborted) return;
      setResults(response.results);
      setWorking(false);
    } catch (error) {
      if (isAbort(error)) return;
      setWorking(false);
      setResults(null);
      setFailure(
        error instanceof ApiError && error.code === 'index_unavailable'
          ? 'The compiled index is unavailable, so nothing can be searched. Canonical Markdown is unaffected; recompile to restore it.'
          : error instanceof ApiError
            ? error.message
            : 'The local API did not respond. Is the stack running?',
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

  return (
    <div className="concept-search">
      <label className="nav-field">
        <span className="nav-field__label">{label}</span>
        <span className="nav-field__hint">{hint}</span>
        <input
          className="nav-input"
          type="search"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {disabled && disabledNote !== undefined && (
        <State tone="caution" title="Selection is full">
          {disabledNote}
        </State>
      )}

      {failure !== null && (
        <State tone="problem" title="Search is unavailable">
          {failure}
        </State>
      )}

      <div aria-live="polite">
        {working && <p className="concept-search__status">Searching…</p>}

        {!working && results !== null && results.length === 0 && (
          <p className="concept-search__status">
            Nothing matches “{query.trim()}”. Try a broader term or an alias.
          </p>
        )}

        {!working && results !== null && results.length > 0 && (
          <ul className="concept-search__results">
            {results.map((result) => {
              const already = chosenIds.includes(result.conceptId);
              return (
                <li key={result.conceptId} className={railClass(result.reviewState)}>
                  <div className="concept-search__result">
                    <div className="concept-search__about">
                      <p className="concept-search__title">
                        {result.title} <ReviewStateBadge state={result.reviewState} />
                      </p>
                      <p className="concept-search__summary">{result.summary}</p>
                      <p className="concept-search__why">
                        {result.rankExplanation} · Tier {result.tier}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="nav-button nav-button--quiet"
                      disabled={already || disabled}
                      onClick={() => {
                        onChoose(result);
                      }}
                    >
                      {already ? 'Chosen' : actionLabel}
                      <span className="nav-visually-hidden"> {result.title}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
