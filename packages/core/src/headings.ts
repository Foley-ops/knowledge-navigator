/**
 * The Tier 1 page template (runbook §4.1).
 *
 * In its own module because both content validation and section splitting need
 * it, and section splitting must not depend on the validator.
 */

/**
 * These level-2 headings must each appear exactly once, in this order, and no
 * other level-2 heading may appear on a Tier 1 page.
 */
export const TIER_1_HEADINGS = [
  'Definition',
  'Why it matters',
  'Intuition',
  'Concrete example',
  'Formal treatment',
  'Assumptions and requirements',
  'Uses and applicability',
  'Limitations and common mistakes',
  'Variants and alternatives',
  'History and attribution',
  'Sources',
  'Prerequisites and next connections',
] as const;
