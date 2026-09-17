import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Page, ReviewStateBadge, Section, State } from '@site/src/components/Ui';
import { graphData } from '@site/src/lib/graph-data';
import { reviewStateInfo, reviewStates } from '@site/src/lib/review-state';
import { api, isAbort } from '@site/src/lib/api';
import type { CoverageSummary } from '@site/src/lib/api';

/**
 * What this corpus holds, live (v2 runbook T04).
 *
 * The compiled graph carries the same counts, so the page says something true
 * before the API answers and then agrees with it. What it must never do is show
 * a number nobody can check: every figure here has a route behind it.
 */
function Contents(): ReactNode {
  const compiled = graphData.coverage;
  const [live, setLive] = useState<CoverageSummary | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .coverageSummary(controller.signal)
      .then(setLive)
      .catch((error: unknown) => {
        if (!isAbort(error)) setUnavailable(true);
      });
    return () => controller.abort();
  }, []);

  const byTier = live?.concepts.byTier ?? compiled.conceptsByTier;
  const byReviewState = live?.concepts.byReviewState ?? compiled.conceptsByReviewState;
  const candidates = live?.atlas.candidates ?? compiled.atlasCandidates;
  const emptyCategories = live?.atlas.emptyCategories ?? compiled.atlasEmptyCategories;
  const unresolved = live?.backlog.groups ?? compiled.unresolvedGroups;
  const total = Object.values(byTier).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="coverage-tallies">
        <div className="coverage-tally">
          <span className="coverage-tally__value">{byTier['1'] ?? 0}</span>
          <span className="coverage-tally__label">Tier 1 pages</span>
          <span className="coverage-tally__hint">The full template, with sources</span>
        </div>
        <div className="coverage-tally">
          <span className="coverage-tally__value">{byTier['2'] ?? 0}</span>
          <span className="coverage-tally__label">Tier 2 stubs</span>
          <span className="coverage-tally__hint">A definition and its sources</span>
        </div>
        <div className="coverage-tally">
          <span className="coverage-tally__value">{byTier['3'] ?? 0}</span>
          <span className="coverage-tally__label">Tier 3 identities</span>
          <span className="coverage-tally__hint">An address in the graph, with no article</span>
        </div>
        <div className="coverage-tally">
          <span className="coverage-tally__value">{candidates}</span>
          <span className="coverage-tally__label">Atlas candidates</span>
          <span className="coverage-tally__hint">Labels on the map. Not knowledge</span>
        </div>
        <div className="coverage-tally">
          <span className="coverage-tally__value">{unresolved}</span>
          <span className="coverage-tally__label">Unresolved references</span>
          <span className="coverage-tally__hint">Gaps pages ran into while being written</span>
        </div>
        <div className="coverage-tally">
          <span className="coverage-tally__value">{emptyCategories}</span>
          <span className="coverage-tally__label">Empty categories</span>
          <span className="coverage-tally__hint">Parts of the map with nothing in them</span>
        </div>
      </div>

      <p className="about-review-counts">
        {total} canonical {total === 1 ? 'concept' : 'concepts'} by review state:{' '}
        {Object.entries(byReviewState)
          .map(([state, count]) => `${String(count)} ${reviewStateInfo(state).label.toLowerCase()}`)
          .join(', ')}
        .
      </p>

      {unavailable && (
        <State tone="caution" title="These counts are from the last compile">
          The API did not answer, so these are the numbers compiled into this site rather than the
          ones the index holds right now.
        </State>
      )}
    </>
  );
}

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
          <Contents />
          <p>
            {graphData.counts.relationships} typed relationships across{' '}
            {graphData.counts.categories} categories. Corpus{' '}
            <code className="nav-id">{graphData.corpusHash.slice(0, 16)}</code>, compiled{' '}
            {graphData.builtAt.slice(0, 10)}.
          </p>
          <p>
            The content is a deliberately small slice about convolutional networks and their
            mathematical foundations. It exists to exercise the system end to end, and is not a
            claim about final scope. <Link to="/explore">Browse it</Link>, or see{' '}
            <Link to="/coverage">how much of the map is empty</Link>.
          </p>
        </Section>

        <Section heading="What is not evidence">
          <p>
            An <strong>atlas candidate</strong> is a label somebody thought worth recording. It has
            no definition, no sources and no relationships. It is never retrieved, never cited, and
            never used to ground an answer — it exists so that the parts of the subject nobody has
            written about stay visible instead of looking like they do not exist.
          </p>
          <p>
            An <strong>unresolved reference</strong> is the same gap from the other side: something
            a page needed and could not link to. Both are editorial notes about what is missing, not
            claims about what is true.
          </p>
          <p>
            <strong>Your own material is not evidence either.</strong> Notes you write and files you
            upload are yours; they are never treated as canonical, never cited as a source, and
            never used to support a claim on a page.
          </p>
        </Section>

        <Section heading="Your private work">
          <p>
            Projects, sessions, notes, familiarity, saved comparisons and paths, and the text
            extracted from files you upload, live in a separate database on your machine. It is
            never compiled into this site, never published, and never tracked in version control.
          </p>
          <p>
            Nothing is stored because you read it. Opening a concept, running a search or asking a
            question saves nothing — saving is always something you chose. Archiving is reversible,
            and nothing here deletes your work.
          </p>
          <p>
            It is also the only data here that cannot be rebuilt. Export it with{' '}
            <code className="nav-id">npm run personal:export</code>; the archive lands under{' '}
            <code className="nav-id">.navigator/exports/</code>, which version control ignores.
          </p>
        </Section>

        <Section heading="Files you upload">
          <p>
            A file you add to a project is read once: the text is extracted and{' '}
            <strong>the original bytes are discarded</strong>. Nothing here keeps a copy of your
            file.
          </p>
          <p>
            Extraction is bounded — at most 10 MiB, 300 PDF pages, 200,000 characters and 60 seconds
            — and anything past a limit fails with a reason rather than being silently truncated.
            Notebook outputs and attachments are dropped. Nothing uploaded is ever executed:
            uploaded code is text.
          </p>
          <p>
            A PDF with no text layer, an encrypted one, an image-only scan and a binary file are all
            refused with a message saying which. There is no OCR here, so a scan cannot be read, and
            the product says so rather than guessing.
          </p>
          <p>
            Extracted text reaches the model only when you tick it for a specific request. Nothing
            is included because it is in the current project or because it was uploaded recently.
          </p>
        </Section>
      </Page>
    </Layout>
  );
}
