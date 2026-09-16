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
] as const;
export type ConceptKind = (typeof conceptKinds)[number];

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

/** Lowercase dotted identifier, e.g. `concept.deep_learning.convolutional_layer`. */
export const DOTTED_ID = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/** Canonical page URL, e.g. `/concepts/convolutional-layer`. */
export const CONCEPT_SLUG = /^\/concepts\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const dottedId = (label: string) =>
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

const nonEmptyText = (label: string, max = 4_000) =>
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
