import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { Badge, Fact, Identifier, ReviewStateBadge, Section } from '@site/src/components/Ui';
import { ConceptNeighborhood } from '@site/src/components/ConceptNeighborhood';
import { relationshipPhrase } from '@site/src/lib/concept-frontmatter';
import type { ConceptFrontmatter } from '@site/src/lib/concept-frontmatter';
import { nodesById } from '@site/src/lib/graph-data';
import { reviewStateInfo } from '@site/src/lib/review-state';

/**
 * Provenance sits directly under the title, above the prose, because a reader
 * should know how far to trust a page before reading it rather than after.
 */
export function ConceptProvenance({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  const info = reviewStateInfo(concept.review_state);
  return (
    <div className="concept-strip">
      <Fact label="Review state">
        <ReviewStateBadge state={concept.review_state} />
      </Fact>
      <Fact label="Kind">
        <Badge>{concept.kind}</Badge> <Badge>Tier {concept.tier}</Badge>
      </Fact>
      <Fact label="Also called">
        {concept.aliases.length === 0 ? 'no other names recorded' : concept.aliases.join(', ')}
      </Fact>
      <Fact label="Categories">
        {concept.categories.map((category, index) => (
          <span key={category}>
            {index > 0 && ', '}
            {category}
            {category === concept.primary_category && concept.categories.length > 1 && ' (primary)'}
          </span>
        ))}
      </Fact>
      <Fact label="Concept id">
        <Identifier>{concept.concept_id}</Identifier>
      </Fact>
      <p className="concept-strip__note">{info.meaning}</p>
    </div>
  );
}

function RelationshipRow({
  type,
  target,
  note,
  condition,
}: {
  type: string;
  target: string;
  note?: string;
  condition?: string;
}): ReactNode {
  const node = nodesById.get(target);
  return (
    <div className="concept-relation">
      <span className="concept-relation__type">{relationshipPhrase(type)}</span>
      <span className="concept-relation__target">
        {node === undefined ? (
          <Identifier>{target}</Identifier>
        ) : (
          <Link to={node.slug}>{node.title}</Link>
        )}
      </span>
      {condition !== undefined && (
        <span className="concept-relation__condition">Holds when: {condition}</span>
      )}
      {note !== undefined && <span className="concept-relation__note">{note}</span>}
    </div>
  );
}

export function ConceptRelations({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  // Edges declared elsewhere that point at this concept are shown by the
  // neighbourhood below, which reads them from the API in both directions.
  if (concept.relationships.length === 0) return null;
  return (
    <Section heading="Typed relationships declared by this page">
      <div className="concept-relations">
        {concept.relationships.map((relationship) => (
          <RelationshipRow
            key={`${relationship.type}:${relationship.target}`}
            type={relationship.type}
            target={relationship.target}
            {...(relationship.note === undefined ? {} : { note: relationship.note })}
            {...(relationship.condition === undefined ? {} : { condition: relationship.condition })}
          />
        ))}
      </div>
    </Section>
  );
}

export function ConceptSources({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  if (concept.sources.length === 0) return null;
  return (
    <Section heading="Sources, and what each one supports">
      <ul className="concept-sources">
        {concept.sources.map((source) => (
          <li key={source.source_id}>
            <a
              className="concept-source__title"
              href={source.url}
              rel="noreferrer noopener external"
              target="_blank"
            >
              {source.title}
            </a>
            <p className="concept-source__meta">
              {source.source_kind}
              {source.supports.length > 0 && <> · supports {source.supports.join(', ')}</>}
              {source.checked_on !== '' && <> · link checked {source.checked_on}</>}
            </p>
            <p className="concept-source__meta">
              <Identifier>{source.source_id}</Identifier>
            </p>
          </li>
        ))}
      </ul>
      <p className="answer__empty">
        A reachable link is not evidence that a source supports a claim. These entries record only
        the sections each source was recorded as supporting.
      </p>
    </Section>
  );
}

export function ConceptFooter({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  return (
    <>
      <ConceptRelations concept={concept} />
      <ConceptNeighborhood conceptId={concept.concept_id} title={concept.title} />
      <ConceptSources concept={concept} />
    </>
  );
}
