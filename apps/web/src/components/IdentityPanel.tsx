import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { Fact, Identifier, Page, ReviewStateBadge, Section, State } from '@site/src/components/Ui';
import { api, isAbort } from '@site/src/lib/api';
import type { ConceptEvidenceResponse } from '@site/src/lib/api';
import { destinationFor, graphData, identityKey, nodesById } from '@site/src/lib/graph-data';
import type { GraphDataNode } from '@site/src/lib/graph-data';
import { railClass } from '@site/src/lib/review-state';

/**
 * The identity view for one canonical concept.
 *
 * A Tier 3 identity has no article, so this is where it opens: a stable
 * address, what it denotes in one cautious sentence, and how it connects. What
 * it deliberately is *not* is an article with the prose left out — the page
 * says "no article yet" in those words, so a reader never mistakes an empty
 * frame for an explanation.
 *
 * Every concept has one of these, including concepts that do have an article.
 * For those it is the machine-facing view, and it links straight to the page.
 */

/** The last path segment, which is the identity key (see `identityPath`). */
function keyFromPath(pathname: string): string {
  const withoutTrailing = pathname.replace(/\/+$/, '');
  return decodeURIComponent(withoutTrailing.slice(withoutTrailing.lastIndexOf('/') + 1));
}

/**
 * Resolve an identity key to a node.
 *
 * The key is the slug's final segment, which is how every link in the product
 * addresses it. A dotted concept id is accepted too, so a URL written by hand
 * or by an agent still resolves when a server happens to deliver it.
 */
function findNode(key: string): GraphDataNode | undefined {
  return graphData.nodes.find((node) => identityKey(node.slug) === key) ?? nodesById.get(key);
}

function Relationships({ node }: { node: GraphDataNode }): ReactNode {
  const outgoing = graphData.edges.filter((edge) => edge.source === node.id);
  const incoming = graphData.edges.filter((edge) => edge.target === node.id);

  if (outgoing.length === 0 && incoming.length === 0) {
    return (
      <State tone="empty" title="No typed relationships">
        Nothing in the corpus points at this identity, and it points at nothing. It is reachable by
        name and by category only.
      </State>
    );
  }

  const row = (
    edge: { id: string; type: string; note: string | null; condition: string | null },
    otherId: string,
    direction: 'out' | 'in',
  ): ReactNode => {
    const other = nodesById.get(otherId);
    return (
      <li key={`${direction}-${edge.id}`} className="identity-edge">
        <span className="identity-edge__type">{edge.type.replace(/_/g, ' ')}</span>{' '}
        {direction === 'in' && <span className="identity-edge__direction">from</span>}{' '}
        {other === undefined ? (
          <Identifier>{otherId}</Identifier>
        ) : (
          <Link to={destinationFor(other)}>{other.title}</Link>
        )}
        {edge.note !== null && <span className="identity-edge__note">{edge.note}</span>}
        {edge.condition !== null && (
          <span className="identity-edge__note">Only when: {edge.condition}</span>
        )}
      </li>
    );
  };

  return (
    <>
      {outgoing.length > 0 && (
        <>
          <h3 className="identity-subheading">This identity declares</h3>
          <ul className="identity-edges">
            {outgoing.map((edge) => row(edge, edge.target, 'out'))}
          </ul>
        </>
      )}
      {incoming.length > 0 && (
        <>
          <h3 className="identity-subheading">Pointed at by</h3>
          <ul className="identity-edges">{incoming.map((edge) => row(edge, edge.source, 'in'))}</ul>
        </>
      )}
    </>
  );
}

export default function IdentityPanel(): ReactNode {
  const { pathname } = useLocation();
  const key = keyFromPath(pathname);
  const node = findNode(key);
  const conceptId = node?.id ?? key;
  const [evidence, setEvidence] = useState<ConceptEvidenceResponse | undefined>(undefined);

  useEffect(() => {
    if (node === undefined) return;
    const controller = new AbortController();
    api
      .evidence(conceptId, controller.signal)
      .then(setEvidence)
      .catch((error: unknown) => {
        // Evidence is an enrichment here; the identity itself comes from the
        // build-time graph, so a missing API must not blank the page.
        if (!isAbort(error)) setEvidence(undefined);
      });
    return () => {
      controller.abort();
    };
  }, [conceptId, node]);

  if (node === undefined) {
    return (
      <Layout title="Unknown identity">
        <Page width="read" title="No such identity">
          <State tone="problem" title="Nothing in this corpus has that id">
            <Identifier>{key}</Identifier> does not name a canonical concept. Try{' '}
            <Link to="/search">search</Link> or <Link to="/coverage">coverage</Link>.
          </State>
        </Page>
      </Layout>
    );
  }

  return (
    <Layout title={node.title} description={node.summary}>
      <Page width="read" title={node.title}>
        <div className={railClass(node.reviewState)}>
          <p className="identity-summary">{node.summary}</p>

          {!node.hasArticle ? (
            <State tone="caution" title="No article yet">
              This is a <strong>graph-only identity</strong>: a stable address so the graph can name
              this idea honestly, with no page written about it. Everything below is metadata. When
              somebody writes it, the id and the URL stay exactly as they are.
            </State>
          ) : (
            <p className="identity-has-article">
              <Link className="identity-read" to={node.slug}>
                Read the article →
              </Link>
            </p>
          )}
        </div>

        <Section heading="Identity">
          <Fact label="Concept id">
            <Identifier>{node.id}</Identifier>
          </Fact>
          <Fact label="Address">
            <Identifier>{node.slug}</Identifier>
          </Fact>
          <Fact label="Kind">{node.kind.replace(/-/g, ' ')}</Fact>
          <Fact label="Coverage depth">
            Tier {node.tier}
            {node.tier === 3
              ? ' — a stable identity in the graph, with no article'
              : node.tier === 2
                ? ' — a short stub with sources and relationships'
                : ' — a complete page'}
          </Fact>
          <Fact label="Review state">
            <ReviewStateBadge state={node.reviewState} />
          </Fact>
          <Fact label="Stored as">
            {node.format === 'graph-only'
              ? 'YAML identity in content/graph-only/'
              : 'Markdown in content/concepts/'}
          </Fact>
          {node.aliases.length > 0 && <Fact label="Also called">{node.aliases.join(', ')}</Fact>}
          <Fact label="Categories">{node.categories.join('; ')}</Fact>
          {node.candidateId !== null && (
            <Fact label="Atlas">
              Covers <Identifier>{node.candidateId}</Identifier> (
              <Link to="/coverage">coverage</Link>)
            </Fact>
          )}
        </Section>

        <Section heading="Relationships">
          <Relationships node={node} />
        </Section>

        {evidence !== undefined && evidence.sources.length > 0 && (
          <Section heading="Sources">
            <ul className="identity-sources">
              {evidence.sources.map((source) => (
                <li key={source.sourceId}>
                  <a href={source.url} rel="noreferrer noopener" target="_blank">
                    {source.title}
                  </a>
                  <span className="identity-source__meta">
                    {source.sourceKind.replace(/-/g, ' ')} · supports {source.supports.join(', ')} ·
                    checked {source.checkedOn}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {node.unresolvedReferences > 0 && (
          <Section heading="Waiting on">
            <p>
              This identity records {node.unresolvedReferences} unresolved{' '}
              {node.unresolvedReferences === 1 ? 'reference' : 'references'} — ideas it needed to
              name and could not link. See the <Link to="/backlog">backlog</Link>.
            </p>
          </Section>
        )}
      </Page>
    </Layout>
  );
}
