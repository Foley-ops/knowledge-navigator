import type { ReactNode } from 'react';

const LEVELS = { low: 1, medium: 2, high: 3 } as const;

const NOTE = {
  low: 'thin or missing evidence — treat as a starting point, not an answer',
  medium: 'supported by the retrieved material, which is itself unverified',
  high: 'directly supported by the retrieved material',
} as const;

/**
 * Confidence as an instrument reading rather than a coloured pill: three
 * segments, lit to the stated level, with the reason spelled out.
 */
export function Confidence({ level }: { level: 'low' | 'medium' | 'high' }): ReactNode {
  const lit = LEVELS[level];
  return (
    <p className={`confidence confidence--${level}`}>
      <span className="confidence__meter" aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`confidence__segment${segment <= lit ? ' confidence__segment--lit' : ''}`}
          />
        ))}
      </span>
      <span>
        <span className="confidence__label">
          {level.charAt(0).toUpperCase() + level.slice(1)} confidence
        </span>{' '}
        <span className="confidence__note">— {NOTE[level]}</span>
      </span>
    </p>
  );
}
