/**
 * Publish the content contract as JSON Schema (runbook C01).
 *
 * The document is derived from the same Zod schema the loader and compiler use
 * at runtime, so there is exactly one authority and no handwritten second copy
 * to drift. Output is deterministic: object keys are sorted, so regenerating
 * without a schema change produces no diff.
 */
import { z } from 'zod';
import { conceptFrontmatterSchema } from './schema.js';
import { compareStrings } from './normalize.js';

export const CONCEPT_SCHEMA_ID =
  'https://knowledge-navigator.local/schemas/concept.schema.json';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Recursively sort object keys. Array order is meaningful and is preserved. */
function sortKeys(value: Json): Json {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted: { [key: string]: Json } = {};
    for (const key of Object.keys(value).sort(compareStrings)) {
      sorted[key] = sortKeys(value[key] as Json);
    }
    return sorted;
  }
  return value;
}

/** Build the JSON Schema document for a canonical concept's frontmatter. */
export function buildConceptJsonSchema(): Json {
  const generated = z.toJSONSchema(conceptFrontmatterSchema, {
    target: 'draft-2020-12',
    io: 'input',
    // Cross-field rules (primary_category ∈ categories, slug/id agreement,
    // alias normalisation, self-relationships) are Zod refinements with no
    // JSON Schema equivalent. They are documented below and enforced by
    // `navigator validate`, which is the authority.
    unrepresentable: 'any',
  }) as unknown as { [key: string]: Json };

  const document: { [key: string]: Json } = {
    ...generated,
    $id: CONCEPT_SCHEMA_ID,
    title: 'Knowledge Navigator canonical concept frontmatter',
    description:
      'Generated from packages/core/src/schema.ts — do not edit by hand. ' +
      'JSON Schema cannot express this contract completely: primary_category must also appear ' +
      'in categories, the slug name must match the last segment of concept_id, aliases must be ' +
      'unique once normalised, a concept must not relate to itself, and source_id must be unique ' +
      'within a page. Those rules are enforced by `navigator validate`, which is authoritative.',
  };
  return sortKeys(document);
}

/** Serialise the schema document exactly as it is written to disk. */
export function serializeConceptJsonSchema(): string {
  return `${JSON.stringify(buildConceptJsonSchema(), null, 2)}\n`;
}
