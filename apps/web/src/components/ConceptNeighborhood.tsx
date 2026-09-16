import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { Section, State } from '@site/src/components/Ui';
import { ApiError, api, isAbort } from '@site/src/lib/api';
import type { GraphResponse } from '@site/src/lib/api';
import { relationshipPhrase } from '@site/src/lib/concept-frontmatter';

/**
 * A bounded neighbourhood of one concept (runbook F05).
 *
 * The text list below the canvas is not a fallback of last resort — it is the
 * accessible, keyboard-navigable representation, always present, and it is what
 * a reader gets when the API is unavailable or Cytoscape cannot render.
 */

type Status = 'idle' | 'working' | 'done' | 'failed';

const DEPTHS = [1, 2, 3] as const;

interface CytoscapeLike {
  destroy(): void;
  on(event: string, selector: string, handler: (event: { target: { id(): string } }) => void): void;
  layout(options: Record<string, unknown>): { run(): void };
  fit(padding?: number): void;
}

function readCssVariable(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value === '' ? fallback : value;
}

function GraphCanvas({
  graph,
  onRecenter,
}: {
  graph: GraphResponse;
  onRecenter: (conceptId: string) => void;
}): ReactNode {
  const container = useRef<HTMLDivElement | null>(null);
  const instance = useRef<CytoscapeLike | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const element = container.current;
    if (element === null) return;

    void (async () => {
      try {
        const module = await import('cytoscape');
        if (cancelled) return;
        const cytoscape = module.default;

        const ink = readCssVariable('--nav-ink', '#15191c');
        const muted = readCssVariable('--nav-ink-muted', '#555f68');
        const accent = readCssVariable('--nav-accent', '#0f5a63');
        const rule = readCssVariable('--nav-rule-strong', '#c3cac6');
        const surface = readCssVariable('--nav-surface', '#ffffff');

        instance.current?.destroy();
        const cy = cytoscape({
          container: element,
          elements: [
            ...graph.nodes.map((node) => ({
              data: { id: node.id, label: node.title, distance: node.distance },
            })),
            ...graph.edges.map((edge) => ({
              data: {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: relationshipPhrase(edge.type),
              },
            })),
          ],
          style: [
            {
              selector: 'node',
              style: {
                'background-color': surface,
                'border-color': rule,
                'border-width': 1.5,
                label: 'data(label)',
                color: ink,
                'font-size': 11,
                'font-family': 'system-ui, sans-serif',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-wrap': 'wrap',
                'text-max-width': '110px',
                width: 'label',
                height: 'label',
                padding: '8px',
                shape: 'round-rectangle',
              },
            },
            {
              selector: 'node[distance = 0]',
              style: { 'border-color': accent, 'border-width': 2.5, color: accent },
            },
            {
              selector: 'edge',
              style: {
                width: 1,
                'line-color': rule,
                'target-arrow-color': rule,
                'target-arrow-shape': 'triangle',
                'arrow-scale': 0.7,
                'curve-style': 'bezier',
                label: 'data(label)',
                'font-size': 9,
                'font-family': 'system-ui, sans-serif',
                color: muted,
                'text-background-color': surface,
                'text-background-opacity': 1,
                'text-background-padding': '2px',
              },
            },
          ],
          layout: { name: 'cose', animate: false, padding: 24, nodeDimensionsIncludeLabels: true },
          minZoom: 0.3,
          maxZoom: 2.5,
          wheelSensitivity: 0.2,
        }) as unknown as CytoscapeLike;

        cy.on('tap', 'node', (event) => {
          onRecenter(event.target.id());
        });
        instance.current = cy;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      instance.current?.destroy();
      instance.current = null;
    };
  }, [graph, onRecenter]);

  if (failed) {
    return (
      <State tone="caution" title="The diagram could not be drawn">
        The relationships are listed below in full; nothing is missing from the list.
      </State>
    );
  }

  return (
    <div className="graph-frame">
      <div className="graph-canvas" ref={container} aria-hidden="true" />
    </div>
  );
}

export function ConceptNeighborhood({
  conceptId,
  title,
}: {
  conceptId: string;
  title: string;
}): ReactNode {
  const [centre, setCentre] = useState(conceptId);
  const [depth, setDepth] = useState(1);
  const [status, setStatus] = useState<Status>('idle');
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(async (id: string, atDepth: number) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setStatus('working');
    setFailure(null);
    try {
      const result = await api.graph(id, atDepth, controller.signal);
      if (controller.signal.aborted) return;
      setGraph(result);
      setStatus('done');
    } catch (error) {
      if (isAbort(error)) return;
      setGraph(null);
      setStatus('failed');
      setFailure(
        error instanceof ApiError
          ? error.message
          : 'The local API did not respond, so the neighbourhood could not be loaded.',
      );
    }
  }, []);

  useEffect(() => {
    void load(centre, depth);
  }, [centre, depth, load]);

  useEffect(() => () => inFlight.current?.abort(), []);

  const centreNode = graph?.nodes.find((node) => node.id === graph.centerId);

  return (
    <Section heading="Neighbourhood">
      <div className="nav-actions" style={{ marginBottom: '0.75rem' }}>
        <span className="nav-fact__key">Depth</span>
        <div className="nav-choices" role="group" aria-label="Neighbourhood depth">
          {DEPTHS.map((value) => (
            <button
              key={value}
              type="button"
              className="nav-choice"
              aria-pressed={depth === value}
              onClick={() => setDepth(value)}
            >
              {value} {value === 1 ? 'hop' : 'hops'}
            </button>
          ))}
        </div>
        {centre !== conceptId && (
          <button
            type="button"
            className="nav-button nav-button--quiet"
            onClick={() => setCentre(conceptId)}
          >
            Back to {title}
          </button>
        )}
      </div>

      {status === 'working' && <State tone="working" title="Loading the neighbourhood…" />}

      {status === 'failed' && (
        <State tone="problem" title="The neighbourhood is unavailable">
          {failure ?? 'The local API did not respond.'} The relationships declared by this page are
          listed above and are unaffected.
        </State>
      )}

      {status === 'done' && graph !== null && (
        <>
          <BrowserOnly>{() => <GraphCanvas graph={graph} onRecenter={setCentre} />}</BrowserOnly>

          <p className="graph-legend">
            <span>
              Centred on {centreNode?.title ?? graph.centerId} · {graph.counts.nodes} concepts ·{' '}
              {graph.counts.edges} relationships
            </span>
            {graph.truncated && (
              <strong>
                Truncated at {graph.nodeLimit} concepts — some of the neighbourhood is not shown.
              </strong>
            )}
          </p>

          <ul className="graph-fallback">
            {graph.edges.length === 0 && (
              <li className="graph-fallback__edge">
                No relationships at this depth. Try a larger depth.
              </li>
            )}
            {graph.edges.map((edge) => {
              const source = graph.nodes.find((node) => node.id === edge.source);
              const target = graph.nodes.find((node) => node.id === edge.target);
              if (source === undefined || target === undefined) return null;
              return (
                <li key={edge.id} className="graph-fallback__edge">
                  <Link to={source.slug}>{source.title}</Link>{' '}
                  <span className="graph-fallback__type">{relationshipPhrase(edge.type)}</span>{' '}
                  <Link to={target.slug}>{target.title}</Link>
                  {edge.condition !== null && (
                    <span className="concept-relation__condition">
                      {' '}
                      — holds when: {edge.condition}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="nav-choices" style={{ marginTop: '0.75rem' }}>
            {graph.nodes
              .filter((node) => node.id !== graph.centerId)
              .map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="nav-choice"
                  onClick={() => setCentre(node.id)}
                >
                  Recentre on {node.title}
                </button>
              ))}
          </div>
        </>
      )}
    </Section>
  );
}
