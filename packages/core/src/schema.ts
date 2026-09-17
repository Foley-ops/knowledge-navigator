/**
 * Executable form of the canonical concept frontmatter contract (runbook §4.1).
 *
 * This module is the single authority for the content contract. The JSON Schema
 * published in `schemas/concept.schema.json` is generated from exactly these
 * definitions (checkpoint C01) so the two can never drift apart.
 */
import { z } from 'zod';
import {
  categorySegments,
  categoryTopLevel,
  compareStrings,
  normalizeName,
  slugName,
} from './normalize.js';

/* -------------------------------------------------------------------------- */
/* Enumerations — copied verbatim from runbook §4.1                            */
/* -------------------------------------------------------------------------- */

export const conceptKinds = [
  // The twelve v1 kinds, unchanged. Every existing page keeps its kind.
  'concept',
  'method',
  'algorithm',
  'theorem',
  'mathematical-object',
  'assumption',
  'property',
  'problem',
  'failure-mode',
  'example',
  'implementation',
  'tool',
  // Added in v2 (checkpoint K03) so the graph can name the non-concept objects
  // the product vision promised — the paper a result came from, the person who
  // proposed it, the moment it changed, and what it was measured on. No
  // instance of these exists yet; the enumeration comes first so a future
  // identity does not have to be mislabelled as a `concept`.
  'paper',
  'person',
  'historical-event',
  'dataset',
  'benchmark',
] as const;
export type ConceptKind = (typeof conceptKinds)[number];

/** The kinds v2 added. Used by tests and by the content-contract audit. */
export const v2ConceptKinds = [
  'paper',
  'person',
  'historical-event',
  'dataset',
  'benchmark',
] as const;

export const tiers = [1, 2, 3] as const;
export type Tier = (typeof tiers)[number];

export const reviewStates = [
  'generated-draft',
  'source-checked',
  'expert-reviewed',
  'formally-verified',
  'disputed-or-conditional',
] as const;
export type ReviewState = (typeof reviewStates)[number];

export const relationshipTypes = [
  'requires',
  'prerequisite_of',
  'generalizes',
  'specializes',
  'variant_of',
  'equivalent_under',
  'contrasts_with',
  'approximates',
  'implements',
  'used_to_solve',
  'useful_when',
  'unreliable_when',
  'assumes',
  'guarantees',
  'mitigates',
  'contributes_to',
  'introduced_by',
  'supported_by',
  'challenged_by',
  'refined_by',
  'belongs_to_category',
] as const;
export type RelationshipType = (typeof relationshipTypes)[number];

/**
 * Sections of the Tier 1 page template that a source can be recorded as
 * supporting. These are the kebab-cased substantive headings from §4.1;
 * `Sources` and `Prerequisites and next connections` are navigational rather
 * than claims, so a source cannot "support" them.
 */
export const supportedSections = [
  'definition',
  'why-it-matters',
  'intuition',
  'concrete-example',
  'formal-treatment',
  'assumptions-and-requirements',
  'uses-and-applicability',
  'limitations-and-common-mistakes',
  'variants-and-alternatives',
  'history-and-attribution',
] as const;
export type SupportedSection = (typeof supportedSections)[number];

/**
 * How much evidential weight a source carries. `authoritative-secondary` is the
 * value used by the worked example in §4.1; the remaining values name the other
 * kinds of evidence this corpus actually cites.
 */
export const sourceKinds = [
  'primary-research',
  'preprint',
  'authoritative-secondary',
  'reference-documentation',
  'lecture-or-course',
  'implementation',
  'dataset-or-benchmark',
] as const;
export type SourceKind = (typeof sourceKinds)[number];

/** The three top-level areas of the atlas, from the product brief. */
export const atlasTopLevelCategories = [
  'Artificial Intelligence',
  'Mathematics',
  'Programming',
] as const;

/* -------------------------------------------------------------------------- */
/* Formats                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Lowercase dotted identifier, e.g. `concept.deep_learning.convolutional_layer`.
 *
 * The first segment must begin with a letter, so an id never starts with a
 * digit. Later segments may begin with a digit, because real names do:
 * `paper.resnet.2015` is the worked example in v2 runbook §4.4, and a concept
 * such as `3-SAT` has the slug `/concepts/3-sat`, whose final segment the id
 * has to match. Hyphens remain forbidden; underscores separate words.
 */
export const DOTTED_ID = /^[a-z][a-z0-9_]*(?:\.[a-z0-9][a-z0-9_]*)+$/;

/** Canonical page URL, e.g. `/concepts/convolutional-layer`. */
export const CONCEPT_SLUG = /^\/concepts\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Build a validator for a lowercase dotted identifier field named `label`. */
export const dottedId = (label: string) =>
  z
    .string()
    .min(1)
    .regex(
      DOTTED_ID,
      `${label} must be a lowercase dotted identifier such as concept.analysis.convolution`,
    );

const httpUrl = z
  .string()
  .min(1)
  .refine((value) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  }, 'url must be an absolute http or https URL');

const isoDate = z.iso.date('checked_on must be an ISO calendar date formatted YYYY-MM-DD');

/** Build a validator for a trimmed, non-empty, length-capped text field. */
export const nonEmptyText = (label: string, max = 4_000) =>
  z
    .string()
    .min(1, `${label} must not be empty`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine((value) => value.trim() === value, `${label} must not have leading or trailing spaces`);

const categoryPath = z
  .string()
  .min(1, 'a category must not be empty')
  .refine((value) => value.trim() === value, 'a category must not have leading or trailing spaces')
  .refine(
    (value) => categorySegments(value).every((segment) => segment.length > 0),
    'a category path must not contain an empty segment',
  )
  .refine(
    (value) => (atlasTopLevelCategories as readonly string[]).includes(categoryTopLevel(value)),
    `a category must begin with one of the atlas areas: ${atlasTopLevelCategories.join(', ')}`,
  );

/* -------------------------------------------------------------------------- */
/* Object schemas                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A dangling intellectual dependency (v2 runbook §4.3).
 *
 * When a page needs to mention an idea this corpus does not explain yet, the
 * honest move is to write the name as plain text and record *here* that the
 * link is missing, rather than inventing a stub so a link resolves. Each entry
 * becomes one traceable backlog item, grouped across pages by its normalised
 * label so two pages waiting on the same idea are one piece of work.
 */
export const unresolvedReferenceSchema = z.strictObject({
  label: nonEmptyText('unresolved_references[].label', 200),
  reason: nonEmptyText('unresolved_references[].reason', 1_000),
  /**
   * Which sections of this page feel the gap. A graph-only identity has no
   * sections, so the list must be empty there.
   */
  sections: z
    .array(z.enum(supportedSections))
    .default([])
    .refine(
      (values) => new Set(values).size === values.length,
      'unresolved_references[].sections must not repeat a section',
    ),
  blocking: z.boolean().default(false),
  proposed_kind: z.enum(conceptKinds).optional(),
  proposed_categories: z.array(categoryPath).default([]),
});
export type UnresolvedReference = z.infer<typeof unresolvedReferenceSchema>;

/**
 * Stable id for one unresolved reference: its source concept plus the
 * normalised label. Deterministic, so the same corpus always compiles the same
 * backlog ids.
 */
export function unresolvedReferenceId(conceptId: string, label: string): string {
  return `unresolved.${conceptId.replace(/^concept\./, '')}.${labelKey(label)}`;
}

/** Stable id for the backlog group every page waiting on this label shares. */
export function backlogGroupId(label: string): string {
  return `backlog.${labelKey(label)}`;
}

/** Normalised label reduced to one dotted-identifier segment. */
export function labelKey(label: string): string {
  const key = normalizeName(label)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return key === '' ? 'unlabelled' : key;
}

export const relationshipSchema = z.strictObject({
  type: z.enum(relationshipTypes),
  target: dottedId('relationships[].target'),
  note: nonEmptyText('relationships[].note').optional(),
  condition: nonEmptyText('relationships[].condition').optional(),
});
export type Relationship = z.infer<typeof relationshipSchema>;

export const sourceSchema = z.strictObject({
  source_id: dottedId('sources[].source_id'),
  title: nonEmptyText('sources[].title', 400),
  url: httpUrl,
  source_kind: z.enum(sourceKinds),
  supports: z
    .array(z.enum(supportedSections))
    .min(1, 'sources[].supports must name at least one section the source materially supports')
    .refine(
      (values) => new Set(values).size === values.length,
      'sources[].supports must not repeat a section',
    ),
  checked_on: isoDate,
});
export type Source = z.infer<typeof sourceSchema>;

/**
 * How strongly the corpus stands behind one statement (v2 runbook §4.4).
 *
 * - `supported` — the cited evidence says this.
 * - `conditional` — it holds, but only under a stated condition.
 * - `disputed` — sources disagree, and both are cited.
 * - `unsupported` — stated deliberately with no evidence behind it, so a reader
 *   knows it is unverified rather than assuming someone checked.
 */
export const claimStatuses = ['supported', 'conditional', 'disputed', 'unsupported'] as const;
export type ClaimStatus = (typeof claimStatuses)[number];

/** Review states a human — never an agent — may set, and which require claims. */
export const promotedReviewStates = [
  'source-checked',
  'expert-reviewed',
  'formally-verified',
] as const;

/**
 * One pointer into a source. Locators are written for a human to follow; the
 * system never pretends to parse or verify them.
 */
export const claimEvidenceSchema = z.strictObject({
  source_id: dottedId('claims[].evidence[].source_id'),
  locator: nonEmptyText('claims[].evidence[].locator', 200),
  note: nonEmptyText('claims[].evidence[].note', 500).optional(),
});
export type ClaimEvidence = z.infer<typeof claimEvidenceSchema>;

export const claimSchema = z.strictObject({
  claim_id: dottedId('claims[].claim_id'),
  section: z.enum(supportedSections),
  statement: nonEmptyText('claims[].statement', 2_000),
  status: z.enum(claimStatuses),
  evidence: z.array(claimEvidenceSchema).default([]),
});
export type Claim = z.infer<typeof claimSchema>;

export const conceptFrontmatterSchema = z
  .strictObject({
    concept_id: dottedId('concept_id'),
    title: nonEmptyText('title', 200),
    slug: z.string().regex(CONCEPT_SLUG, 'slug must look like /concepts/kebab-case-name'),
    aliases: z.array(nonEmptyText('aliases[]', 200)).default([]),
    kind: z.enum(conceptKinds),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    review_state: z.enum(reviewStates),
    summary: nonEmptyText('summary', 500),
    categories: z.array(categoryPath).min(1, 'categories must name at least one category'),
    primary_category: categoryPath,
    relationships: z.array(relationshipSchema).default([]),
    sources: z.array(sourceSchema).default([]),
    unresolved_references: z.array(unresolvedReferenceSchema).default([]),
    claims: z.array(claimSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.categories.includes(value.primary_category)) {
      ctx.addIssue({
        code: 'custom',
        path: ['primary_category'],
        message: 'primary_category must also appear in categories',
      });
    }
    const seenCategories = new Set<string>();
    value.categories.forEach((category, index) => {
      if (seenCategories.has(category)) {
        ctx.addIssue({
          code: 'custom',
          path: ['categories', index],
          message: `duplicate category ${category}`,
        });
      }
      seenCategories.add(category);
    });

    // The slug's last segment is the canonical file name and the page URL, so a
    // slug that disagrees with the concept id's last segment would silently
    // split one idea across two addresses.
    const idTail = value.concept_id.split('.').pop() ?? '';
    if (slugName(value.slug).replace(/-/g, '_') !== idTail) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: `slug name "${slugName(value.slug)}" must match the last segment of concept_id ("${idTail}")`,
      });
    }

    const seenNames = new Map<string, string>();
    seenNames.set(normalizeName(value.title), 'title');
    value.aliases.forEach((alias, index) => {
      const normalized = normalizeName(alias);
      const existing = seenNames.get(normalized);
      if (existing !== undefined && existing !== 'title') {
        ctx.addIssue({
          code: 'custom',
          path: ['aliases', index],
          message: `alias "${alias}" repeats an earlier alias once normalised`,
        });
      }
      seenNames.set(normalized, `aliases[${String(index)}]`);
    });

    value.relationships.forEach((relationship, index) => {
      if (relationship.target === value.concept_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['relationships', index, 'target'],
          message: 'a concept must not declare a relationship to itself',
        });
      }
    });

    // An unresolved reference names something this corpus does NOT have, so it
    // may not repeat a label, and it may not point at the page it sits on.
    const ownNames = new Set<string>([
      normalizeName(value.title),
      ...value.aliases.map(normalizeName),
    ]);
    const seenLabels = new Map<string, number>();
    value.unresolved_references.forEach((reference, index) => {
      const normalized = normalizeName(reference.label);
      const first = seenLabels.get(normalized);
      if (first !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['unresolved_references', index, 'label'],
          message: `"${reference.label}" normalises to "${normalized}", the same as unresolved_references[${String(first)}]; one label is one backlog item`,
        });
      } else {
        seenLabels.set(normalized, index);
      }
      if (ownNames.has(normalized)) {
        ctx.addIssue({
          code: 'custom',
          path: ['unresolved_references', index, 'label'],
          message: `"${reference.label}" is this concept's own name; a concept cannot be an unresolved reference to itself`,
        });
      }
      if (value.tier === 3 && reference.sections.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['unresolved_references', index, 'sections'],
          message:
            'a graph-only identity has no sections, so an unresolved reference on it must not name any',
        });
      }
    });

    // Claims and their evidence. Source ids are resolved against THIS page's
    // `sources`, so a locator can never point at a work the page does not cite.
    const declaredSources = new Set(value.sources.map((source) => source.source_id));
    const seenClaimIds = new Set<string>();
    value.claims.forEach((claim, index) => {
      if (seenClaimIds.has(claim.claim_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['claims', index, 'claim_id'],
          message: `duplicate claim_id ${claim.claim_id} on this page`,
        });
      }
      seenClaimIds.add(claim.claim_id);

      if (claim.status === 'unsupported') {
        if (claim.evidence.length > 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['claims', index, 'evidence'],
            message: `claim ${claim.claim_id} is marked unsupported but cites evidence; either the evidence supports it or the status is wrong`,
          });
        }
      } else if (claim.evidence.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['claims', index, 'evidence'],
          message: `claim ${claim.claim_id} is "${claim.status}" and must cite at least one piece of evidence; mark it unsupported if nothing does`,
        });
      }

      const seenLocators = new Set<string>();
      claim.evidence.forEach((evidence, evidenceIndex) => {
        if (!declaredSources.has(evidence.source_id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['claims', index, 'evidence', evidenceIndex, 'source_id'],
            message: `evidence source ${evidence.source_id} is not listed in this page's sources`,
          });
        }
        const key = `${evidence.source_id}|${evidence.locator}`;
        if (seenLocators.has(key)) {
          ctx.addIssue({
            code: 'custom',
            path: ['claims', index, 'evidence', evidenceIndex],
            message: `claim ${claim.claim_id} cites ${evidence.source_id} at "${evidence.locator}" twice`,
          });
        }
        seenLocators.add(key);
      });
    });

    const seenSources = new Set<string>();
    value.sources.forEach((source, index) => {
      if (seenSources.has(source.source_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources', index, 'source_id'],
          message: `duplicate source_id ${source.source_id} on this page`,
        });
      }
      seenSources.add(source.source_id);
    });
  });

export type ConceptFrontmatter = z.infer<typeof conceptFrontmatterSchema>;

/** A single validation problem, addressed to a field. */
export interface FieldIssue {
  readonly path: string;
  readonly message: string;
}

export interface FrontmatterResult {
  readonly ok: boolean;
  readonly value: ConceptFrontmatter | undefined;
  readonly issues: readonly FieldIssue[];
}

/** Validate an unknown value against the frontmatter contract. */
export function parseFrontmatter(input: unknown): FrontmatterResult {
  const result = conceptFrontmatterSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data, issues: [] };
  }
  const issues: FieldIssue[] = [];
  for (const issue of result.error.issues) {
    const prefix = issue.path.map((segment) => String(segment));
    if (issue.code === 'unrecognized_keys') {
      // Report one issue per unknown key, addressed to that key, so a
      // diagnostic always names the field a human has to edit.
      for (const key of issue.keys) {
        issues.push({
          path: [...prefix, key].join('.'),
          message: `unknown key "${key}" is not part of the concept frontmatter contract`,
        });
      }
      continue;
    }
    issues.push({
      path: prefix.length > 0 ? prefix.join('.') : '(root)',
      message: issue.message,
    });
  }
  issues.sort((a, b) =>
    a.path === b.path ? compareStrings(a.message, b.message) : compareStrings(a.path, b.path),
  );
  return { ok: false, value: undefined, issues };
}
