import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';

/**
 * The home page states the four jobs as questions a researcher actually asks,
 * because choosing a job is the first thing anyone does here.
 */
const JOBS = [
  {
    ask: 'What is this idea, exactly?',
    answer:
      'Move from a one-line definition to intuition, a worked example, the formal statement, and what it assumes.',
    to: '/explore',
    label: 'Understand a concept',
  },
  {
    ask: "I'm stuck. What should I try next?",
    answer:
      'Describe where you are. Get candidate routes, what each assumes, what would rule it out, and what to check next.',
    to: '/ask?mode=unstick',
    label: 'Help me get unstuck',
  },
  {
    ask: 'Which of these should I use?',
    answer:
      'Compare nearby approaches by what they trade away, and by the conditions under which the comparison changes.',
    to: '/ask?mode=compare',
    label: 'Compare approaches',
  },
  {
    ask: 'How do these ideas connect?',
    answer:
      'Browse overlapping categories, typed relationships and prerequisites, and follow a bounded neighbourhood of the graph.',
    to: '/explore',
    label: 'Explore the map',
  },
];

export default function Home(): ReactNode {
  const history = useHistory();
  const [query, setQuery] = useState('');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed === '') return;
    history.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <Layout
      title="Knowledge Navigator"
      description="A private, local-first research knowledge navigator for mathematics, artificial intelligence and programming."
    >
      <main className="nav-page nav-page--read">
        <h1 className="nav-page__title">Knowledge Navigator</h1>
        <p className="nav-page__lede">
          A private research instrument for mathematics, artificial intelligence and programming. It
          runs on your machine, and it shows you where every claim came from.
        </p>

        <form onSubmit={submit} role="search">
          <label className="nav-field">
            <span className="nav-field__label">Find a concept</span>
            <span className="nav-field__hint">
              Search titles, aliases, summaries and page text. Aliases work — try “conv layer”.
            </span>
            <input
              className="nav-input"
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="conv layer"
              aria-label="Find a concept"
            />
          </label>
          <div className="nav-actions">
            <button className="nav-button" type="submit">
              Search
            </button>
            <Link className="nav-button nav-button--quiet" to="/explore">
              Browse everything
            </Link>
          </div>
        </form>

        <div className="home-questions">
          {JOBS.map((job) => (
            <Link key={job.ask} className="home-question" to={job.to} aria-label={job.label}>
              <p className="home-question__ask">{job.ask}</p>
              <p className="home-question__answer">{job.answer}</p>
            </Link>
          ))}
        </div>

        <p className="home-trust">
          Every page carries a review state. Everything in this knowledge base is currently a{' '}
          <strong>generated draft</strong>: written by an AI agent and not yet checked against its
          sources by a person. Read it as a starting point with its evidence attached, not as an
          authority. <Link to="/about">How this works</Link>.
        </p>
      </main>
    </Layout>
  );
}
