import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Page, ReviewStateBadge, State } from '@site/src/components/Ui';
import { atlasAreas, childrenOf, conceptsUnder, graphData } from '@site/src/lib/graph-data';
import { railClass } from '@site/src/lib/review-state';

/**
 * The atlas is an outline, not a tile grid: a concept can sit in several
 * categories, and an outline can show that honestly without pretending the
 * categories are a hierarchy the concept belongs to exclusively.
 */
function ConceptEntry({ conceptId, under }: { conceptId: string; under: string }): ReactNode {
  const node = graphData.nodes.find((candidate) => candidate.id === conceptId);
  if (node === undefined) return null;
  const elsewhere = node.categories.filter((category) => category !== under);
  return (
    <li className={railClass(node.reviewState)}>
      <Link className="atlas__concept-title" to={node.slug}>
        {node.title}
      </Link>{' '}
      <ReviewStateBadge state={node.reviewState} />
      <span className="atlas__concept-summary">{node.summary}</span>
      {elsewhere.length > 0 && (
        <span className="atlas__elsewhere">
          Also filed under {elsewhere.join(' and ')} — same page, one address.
        </span>
      )}
    </li>
  );
}

export default function ExplorePage(): ReactNode {
  const areas = atlasAreas();

  return (
    <Layout title="Explore" description="Browse concepts through overlapping categories.">
      <Page
        width="tool"
        title="Explore the map"
        lede="Categories are an atlas, not an ontology. A concept can appear in several categories, and each one resolves to the same single page."
      >
        {areas.length === 0 ? (
          <State tone="empty" title="No categories yet">
            The compiled graph holds no concepts. Run <code>npm run compile</code> to build it from
            canonical Markdown.
          </State>
        ) : (
          <div className="atlas">
            {areas.map((area) => {
              const branches = childrenOf(area.path).filter(
                (branch) => branch.conceptIds.length > 0,
              );
              const total = conceptsUnder(area.path).length;
              return (
                <section key={area.path} className="atlas__area">
                  <h2 className="atlas__area-name">{area.name}</h2>
                  <p className="atlas__area-count">
                    {total} {total === 1 ? 'concept' : 'concepts'} across {branches.length}{' '}
                    {branches.length === 1 ? 'category' : 'categories'}
                  </p>

                  {area.conceptIds.length > 0 && (
                    <div className="atlas__branch">
                      <h3 className="atlas__branch-name">Filed directly here</h3>
                      <ul className="atlas__concepts">
                        {area.conceptIds.map((id) => (
                          <ConceptEntry key={id} conceptId={id} under={area.path} />
                        ))}
                      </ul>
                    </div>
                  )}

                  {branches.map((branch) => (
                    <div key={branch.path} className="atlas__branch">
                      <h3 className="atlas__branch-name">{branch.name}</h3>
                      <ul className="atlas__concepts">
                        {[...branch.conceptIds].sort().map((id) => (
                          <ConceptEntry key={id} conceptId={id} under={branch.path} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        )}

        <p className="home-trust">
          Compiled from {graphData.counts.concepts} canonical Markdown pages with{' '}
          {graphData.counts.relationships} typed relationships. Corpus{' '}
          <code className="nav-id">{graphData.corpusHash.slice(0, 12)}</code>, built{' '}
          {graphData.builtAt.slice(0, 10)}.
        </p>
      </Page>
    </Layout>
  );
}
