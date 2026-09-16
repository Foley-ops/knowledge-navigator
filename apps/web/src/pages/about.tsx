import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Page, ReviewStateBadge, Section } from '@site/src/components/Ui';
import { graphData } from '@site/src/lib/graph-data';
import { reviewStateInfo, reviewStates } from '@site/src/lib/review-state';

export default function AboutPage(): ReactNode {
  return (
    <Layout title="About" description="How this knowledge base works, and how far to trust it.">
      <Page
        title="About"
        lede="What this is, where its claims come from, and how far to trust them."
      >
        <Section heading="What this is">
          <p>
            A private research instrument for mathematics, artificial intelligence and programming.
            It runs entirely on your machine. There are no accounts, no cloud services and no
            analytics, and nothing here is published anywhere.
          </p>
          <p>
            It is not a wiki. Its job is to help you understand an unfamiliar idea, see what it
            assumes, compare it with nearby approaches, and find a defensible next move when you are
            stuck — with the evidence attached at every step.
          </p>
        </Section>

        <Section heading="What is canonical, and what is disposable">
          <p>
            The Markdown in <code className="nav-id">content/concepts/</code> is the authority and
            the only irreplaceable data here. Everything else — the search index, the graph, the
            sidebar, this site — is compiled from it and can be rebuilt at any time.
          </p>
          <p>
            An AI agent never changes a canonical page on its own. It proposes a change, a person
            reviews it, and only a person may raise a page's review state.
          </p>
        </Section>

        <Section heading="Review states">
          <p>
            Every page says how far it has been checked. A page's review state also appears as the
            texture of the rule down its left edge, so you can see it while reading rather than
            having to look it up.
          </p>
          <div className="concept-relations">
            {reviewStates.map((state) => (
              <div key={state} className="concept-relation">
                <span className="concept-relation__type">
                  <ReviewStateBadge state={state} />
                </span>
                <span className="concept-relation__note" style={{ gridColumn: 2 }}>
                  {reviewStateInfo(state).meaning}
                </span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem' }}>
            Every page in this knowledge base is currently a generated draft. Read it as a starting
            point with its sources attached, not as an authority.
          </p>
        </Section>

        <Section heading="What the assistant does and does not do">
          <p>
            A question is answered only from canonical pages this knowledge base already holds, plus
            the context you supply. The model is told that retrieved text is data rather than
            instructions, is required to state its uncertainty, and may cite only the identifiers it
            was given. An answer that cites anything else is discarded rather than shown.
          </p>
          <p>
            When generation fails, the retrieved canonical material is still shown — a failed model
            should not cost you the evidence the system already found.
          </p>
          <p>
            Your question and research context are sent only to the configured local provider. They
            are not written to the service log and are not stored.
          </p>
        </Section>

        <Section heading="Current contents">
          <p>
            {graphData.counts.concepts} concepts, {graphData.counts.relationships} typed
            relationships, {graphData.counts.categories} categories. Corpus{' '}
            <code className="nav-id">{graphData.corpusHash.slice(0, 16)}</code>, compiled{' '}
            {graphData.builtAt.slice(0, 10)}.
          </p>
          <p>
            The content is a deliberately small slice about convolutional networks and their
            mathematical foundations. It exists to exercise the system end to end, and is not a
            claim about final scope. <Link to="/explore">Browse it</Link>.
          </p>
        </Section>
      </Page>
    </Layout>
  );
}
