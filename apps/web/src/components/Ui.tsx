import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { reviewStateInfo } from '@site/src/lib/review-state';

/** A page shell at one of the two allowed measures (runbook §4.5). */
export function Page({
  width = 'read',
  title,
  lede,
  children,
}: {
  width?: 'read' | 'tool';
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <main className={`nav-page nav-page--${width}`}>
      <h1 className="nav-page__title">{title}</h1>
      {lede !== undefined && <p className="nav-page__lede">{lede}</p>}
      {children}
    </main>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="nav-section">
      <h2 className="nav-section__heading">{heading}</h2>
      {children}
    </section>
  );
}

export function Fact({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="nav-fact">
      <span className="nav-fact__key">{label}</span>
      <span className="nav-fact__value">{children}</span>
    </div>
  );
}

/** Review state, always with its meaning available rather than as a bare word. */
export function ReviewStateBadge({ state }: { state: unknown }): ReactNode {
  const info = reviewStateInfo(state);
  return (
    <span className={`nav-badge ${info.badgeClass}`} title={info.meaning}>
      {info.label}
    </span>
  );
}

export function Badge({ children }: { children: ReactNode }): ReactNode {
  return <span className="nav-badge nav-badge--neutral">{children}</span>;
}

/**
 * The one place the interface speaks when something is wrong, missing or in
 * progress. Every state says what happened and what to do — never a spinner
 * alone, never invented content in place of a failure.
 */
export function State({
  tone,
  title,
  children,
}: {
  tone: 'working' | 'empty' | 'problem' | 'caution';
  title: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <div
      className={`nav-state nav-state--${tone}`}
      role={tone === 'problem' ? 'alert' : 'status'}
      aria-live={tone === 'working' ? 'polite' : undefined}
    >
      <p className="nav-state__title">{title}</p>
      {children !== undefined && <p className="nav-state__body">{children}</p>}
    </div>
  );
}

export function ConceptLink({ slug, children }: { slug: string; children: ReactNode }): ReactNode {
  return <Link to={slug}>{children}</Link>;
}

/** A stable machine identifier. Monospace here carries meaning. */
export function Identifier({ children }: { children: ReactNode }): ReactNode {
  return <code className="nav-id">{children}</code>;
}
