/**
 * Review state is the product's honesty signal, so it has one vocabulary and
 * one visual language everywhere it appears.
 */
export const reviewStates = [
  'generated-draft',
  'source-checked',
  'expert-reviewed',
  'formally-verified',
  'disputed-or-conditional',
] as const;

export type ReviewState = (typeof reviewStates)[number];

interface ReviewStateInfo {
  readonly label: string;
  readonly meaning: string;
  readonly badgeClass: string;
}

const INFO: Record<ReviewState, ReviewStateInfo> = {
  'generated-draft': {
    label: 'Generated draft',
    meaning: 'Written by an AI agent. No human has checked it against its sources.',
    badgeClass: 'nav-badge--draft',
  },
  'source-checked': {
    label: 'Source checked',
    meaning: 'A human has checked each claim against the sources cited here.',
    badgeClass: 'nav-badge--checked',
  },
  'expert-reviewed': {
    label: 'Expert reviewed',
    meaning: 'A human with domain expertise has reviewed the content.',
    badgeClass: 'nav-badge--reviewed',
  },
  'formally-verified': {
    label: 'Formally verified',
    meaning: 'The formal content has been machine- or proof-checked.',
    badgeClass: 'nav-badge--verified',
  },
  'disputed-or-conditional': {
    label: 'Disputed or conditional',
    meaning: 'Sources conflict, or the claim holds only under stated conditions.',
    badgeClass: 'nav-badge--disputed',
  },
};

const UNKNOWN: ReviewStateInfo = {
  label: 'Unknown review state',
  meaning: 'This page does not record how it was reviewed. Treat it as unverified.',
  badgeClass: 'nav-badge--disputed',
};

export function isReviewState(value: unknown): value is ReviewState {
  return typeof value === 'string' && (reviewStates as readonly string[]).includes(value);
}

export function reviewStateInfo(value: unknown): ReviewStateInfo {
  return isReviewState(value) ? INFO[value] : UNKNOWN;
}

/** Class for the evidence rail, which encodes review state as texture. */
export function railClass(value: unknown): string {
  return isReviewState(value) ? `nav-rail nav-rail--${value}` : 'nav-rail';
}
