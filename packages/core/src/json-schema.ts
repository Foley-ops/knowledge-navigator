/**
 * Publish the content contracts as JSON Schema (runbook C01, v2 runbook K07).
 *
 * Every document is derived from the same Zod schema the loader and compiler
 * use at runtime, so there is exactly one authority and no handwritten second
 * copy to drift. Output is deterministic: object keys are sorted, so
 * regenerating without a schema change produces no diff.
 */
import { z } from 'zod';
import { atlasDocumentSchema } from './atlas.js';
import { graphOnlyIdentitySchema } from './graph-only.js';
import { conceptFrontmatterSchema } from './schema.js';
import { compareStrings } from './normalize.js';

export const CONCEPT_SCHEMA_ID = 'https://knowledge-navigator.local/schemas/concept.schema.json';
export const GRAPH_ONLY_SCHEMA_ID =
  'https://knowledge-navigator.local/schemas/graph-only.schema.json';
export const ATLAS_SCHEMA_ID = 'https://knowledge-navigator.local/schemas/atlas.schema.json';

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

/** Cross-field rules are Zod refinements with no JSON Schema equivalent. */
const CROSS_FIELD_NOTE =
  'JSON Schema cannot express this contract completely: primary_category must also appear ' +
  'in categories, the slug name must match the last segment of concept_id, aliases and ' +
  'unresolved-reference labels must be unique once normalised, a concept must not relate to ' +
  'itself, source_id must be unique within a page, claim ids must be unique across the corpus, ' +
  'claim evidence must cite a source the page lists, a claim that is not "unsupported" must ' +
  'cite evidence and an "unsupported" one must not, and a page above generated-draft must ' +
  'carry a claim for every substantive section. Those rules are enforced by ' +
  '`navigator validate`, which is authoritative.';

function toDocument(
  schema: z.ZodType,
  extra: { readonly $id: string; readonly title: string; readonly description: string },
): Json {
  const generated = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: 'input',
    unrepresentable: 'any',
  }) as unknown as { [key: string]: Json };
  return sortKeys({ ...generated, ...extra });
}

/** JSON Schema for a canonical concept's Markdown frontmatter. */
export function buildConceptJsonSchema(): Json {
  return toDocument(conceptFrontmatterSchema, {
    $id: CONCEPT_SCHEMA_ID,
    title: 'Knowledge Navigator canonical concept frontmatter',
    description: `Generated from packages/core/src/schema.ts — do not edit by hand. ${CROSS_FIELD_NOTE}`,
  });
}

/** JSON Schema for a Tier 3 graph-only identity file. */
export function buildGraphOnlyJsonSchema(): Json {
  return toDocument(graphOnlyIdentitySchema, {
    $id: GRAPH_ONLY_SCHEMA_ID,
    title: 'Knowledge Navigator graph-only identity',
    description:
      'Generated from packages/core/src/graph-only.ts — do not edit by hand. A graph-only ' +
      'identity is the concept frontmatter contract with tier pinned to 3, stored as one YAML ' +
      'document in content/graph-only/ with no Markdown body and no reader-facing route. ' +
      `${CROSS_FIELD_NOTE}`,
  });
}

/** JSON Schema for the curated broad atlas. */
export function buildAtlasJsonSchema(): Json {
  return toDocument(atlasDocumentSchema, {
    $id: ATLAS_SCHEMA_ID,
    title: 'Knowledge Navigator atlas',
    description:
      'Generated from packages/core/src/atlas.ts — do not edit by hand. The atlas is editorial ' +
      'structure, not knowledge: a candidate carries labels and an optional editorial note and ' +
      'has no field for a factual summary. JSON Schema cannot express the structural rules — ' +
      'exactly three root areas, acyclic categories each reaching one root, unique category ' +
      'titles within an area, candidate labels unique once normalised, and a covered candidate ' +
      'naming exactly one canonical concept that exists. Those are enforced by ' +
      '`navigator validate`, which is authoritative.',
  });
}

function serialize(document: Json): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

/** Serialise the concept schema exactly as it is written to disk. */
export function serializeConceptJsonSchema(): string {
  return serialize(buildConceptJsonSchema());
}

/** Serialise the graph-only identity schema exactly as it is written to disk. */
export function serializeGraphOnlyJsonSchema(): string {
  return serialize(buildGraphOnlyJsonSchema());
}

/** Serialise the atlas schema exactly as it is written to disk. */
export function serializeAtlasJsonSchema(): string {
  return serialize(buildAtlasJsonSchema());
}

/** Every published schema, as file name → contents. */
export function allJsonSchemas(): Record<string, string> {
  return {
    'concept.schema.json': serializeConceptJsonSchema(),
    'graph-only.schema.json': serializeGraphOnlyJsonSchema(),
    'atlas.schema.json': serializeAtlasJsonSchema(),
  };
}
