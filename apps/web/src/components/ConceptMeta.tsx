import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { Badge, Fact, Identifier, ReviewStateBadge, Section } from '@site/src/components/Ui';
import { ConceptNeighborhood } from '@site/src/components/ConceptNeighborhood';
import { ConceptPrivate } from '@site/src/components/ConceptPrivate';
import { claimStatusInfo, relationshipPhrase } from '@site/src/lib/concept-frontmatter';
import type { ConceptClaim, ConceptFrontmatter } from '@site/src/lib/concept-frontmatter';
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

/**
 * Claim-level evidence (v2 runbook M05).
 *
 * The four statuses have to be distinguishable at a glance *and* in words,
 * because the difference between "supported" and "unsupported" is the whole
 * point. A page with no claims says that plainly rather than leaving a reader
 * to infer that the absence of claims means everything is checked.
 */
function ClaimRow({
  claim,
  sources,
}: {
  claim: ConceptClaim;
  sources: ConceptFrontmatter['sources'];
}): ReactNode {
  const info = claimStatusInfo(claim.status);
  return (
    <li className={`concept-claim concept-claim--${claim.status}`}>
      <p className="concept-claim__head">
        <span
          className={`nav-badge claim-status claim-status--${claim.status}`}
          title={info.meaning}
        >
          {info.label}
        </span>
        {claim.section !== '' && (
          <span className="concept-claim__section">{claim.section.replace(/-/g, ' ')}</span>
        )}
      </p>
      <p className="concept-claim__statement">{claim.statement}</p>
      {claim.evidence.length === 0 ? (
        <p className="concept-claim__none">{info.meaning}</p>
      ) : (
        <ul className="concept-claim__evidence">
          {claim.evidence.map((item) => {
            const source = sources.find((candidate) => candidate.source_id === item.source_id);
            return (
              <li key={`${item.source_id}|${item.locator}`}>
                {source === undefined ? (
                  <Identifier>{item.source_id}</Identifier>
                ) : (
                  <a href={source.url} rel="noreferrer noopener external" target="_blank">
                    {source.title}
                  </a>
                )}
                <span className="concept-claim__locator">{item.locator}</span>
                {item.note !== undefined && (
                  <span className="concept-claim__note">{item.note}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="concept-claim__id">
        <Identifier>{claim.claim_id}</Identifier>
      </p>
    </li>
  );
}

export function ConceptClaims({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  if (concept.claims.length === 0) {
    if (concept.sources.length === 0) return null;
    return (
      <Section heading="Claim-level evidence">
        <p className="answer__empty">
          This page does not yet map individual statements to locators in its sources. The sources
          below record which sections each one was noted as supporting, which is coarser: it says a
          source is relevant to a section, not which sentence it backs. Absence of claim mapping is
          not evidence that the page is unsupported — it means nobody has done that work here.
        </p>
      </Section>
    );
  }

  return (
    <Section heading="Claim-level evidence">
      <ul className="concept-claims">
        {concept.claims.map((claim) => (
          <ClaimRow key={claim.claim_id} claim={claim} sources={concept.sources} />
        ))}
      </ul>
    </Section>
  );
}

/** Ideas this page needed to name and could not link (v2 runbook §4.3). */
export function ConceptUnresolved({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  if (concept.unresolved_references.length === 0) return null;
  return (
    <Section heading="Named here, not explained here">
      <p className="answer__empty">
        These ideas appear in the prose as plain text because this corpus does not carry them. No
        stub was invented so a link would resolve.
      </p>
      <ul className="concept-unresolved">
        {concept.unresolved_references.map((reference) => (
          <li key={reference.label}>
            <span className="concept-unresolved__label">{reference.label}</span>
            {reference.blocking && <Badge>Blocking</Badge>}
            <span className="concept-unresolved__reason">{reference.reason}</span>
            {reference.sections.length > 0 && (
              <span className="concept-unresolved__sections">
                needed in {reference.sections.map((s) => s.replace(/-/g, ' ')).join(', ')}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="answer__empty">
        Every one of these is an item in the <Link to="/backlog">backlog</Link>.
      </p>
    </Section>
  );
}

export function ConceptFooter({ concept }: { concept: ConceptFrontmatter }): ReactNode {
  return (
    <>
      <ConceptRelations concept={concept} />
      <ConceptNeighborhood conceptId={concept.concept_id} title={concept.title} />
      <ConceptClaims concept={concept} />
      <ConceptSources concept={concept} />
      <ConceptUnresolved concept={concept} />
      <ConceptPrivate
        conceptId={concept.concept_id}
        title={concept.title}
        slug={concept.slug}
        reviewState={concept.review_state}
        summary={concept.summary}
      />
    </>
  );
}
