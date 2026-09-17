/**
 * Keep the written contract tied to the executable one (v2 runbook K07).
 *
 * `AGENT_CONTENT_CONTRACT.md` is what an agent reads before it writes canonical
 * content. If an enumeration or a required field drifts out of it, the agent is
 * being told something false. This audit fails the build when that happens, so
 * the document cannot quietly rot.
 *
 * It also pins schema generation: two runs must be byte-identical, and the
 * files on disk must match what the generator produces right now.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { atlasCandidateSchema, atlasStatuses } from '../src/atlas.js';
import { allJsonSchemas } from '../src/json-schema.js';
import { projectPaths } from '../src/paths.js';
import {
  claimSchema,
  claimStatuses,
  conceptFrontmatterSchema,
  conceptKinds,
  relationshipTypes,
  reviewStates,
  sourceKinds,
  supportedSections,
  unresolvedReferenceSchema,
} from '../src/schema.js';
import { TIER_1_HEADINGS } from '../src/headings.js';

const paths = projectPaths();
const contract = readFileSync(join(paths.root, 'AGENT_CONTENT_CONTRACT.md'), 'utf8');

/** Required keys of a Zod object schema, from the schema itself. */
function requiredKeys(shape: Record<string, { safeParse: (v: unknown) => { success: boolean } }>) {
  return Object.entries(shape)
    .filter(([, field]) => !field.safeParse(undefined).success)
    .map(([key]) => key)
    .sort();
}

describe('the written contract names every executable enumeration', () => {
  it('lists every concept kind', () => {
    for (const kind of conceptKinds) {
      expect(contract, `kind ${kind}`).toContain(kind);
    }
  });

  it('lists every review state', () => {
    for (const state of reviewStates) {
      expect(contract, `review state ${state}`).toContain(state);
    }
  });

  it('lists every claim status', () => {
    for (const status of claimStatuses) {
      expect(contract, `claim status ${status}`).toContain(`\`${status}\``);
    }
  });

  it('lists every substantive section key', () => {
    for (const section of supportedSections) {
      expect(contract, `section ${section}`).toContain(section);
    }
  });

  it('lists every Tier 1 heading, in order', () => {
    const template = contract.slice(contract.indexOf('## Page template'));
    let cursor = 0;
    for (const heading of TIER_1_HEADINGS) {
      const at = template.indexOf(`## ${heading}`, cursor);
      expect(at, `heading ${heading}`).toBeGreaterThan(-1);
      cursor = at;
    }
  });

  it('mentions every source kind it expects an agent to choose from', () => {
    // The contract points at the schema for source_kind rather than repeating
    // the list, so the audit checks the pointer resolves to a real export.
    expect(contract).toContain('`source_kind`');
    expect(sourceKinds.length).toBeGreaterThan(0);
  });

  it('names the relationship enumeration as the authority', () => {
    expect(contract).toContain('packages/core/src/schema.ts');
    expect(relationshipTypes.length).toBe(21);
  });

  it('names every atlas candidate status', () => {
    for (const status of atlasStatuses) {
      expect(contract.includes(status), `atlas status ${status}`).toBe(true);
    }
  });
});

describe('the written contract names every required field', () => {
  it('names every required concept frontmatter field', () => {
    const required = requiredKeys(
      conceptFrontmatterSchema.def.shape as unknown as Parameters<typeof requiredKeys>[0],
    );
    expect(required).toContain('concept_id');
    for (const key of required) {
      expect(contract, `frontmatter field ${key}`).toContain(`${key}:`);
    }
  });

  it('names every required unresolved-reference field', () => {
    for (const key of requiredKeys(
      unresolvedReferenceSchema.def.shape as unknown as Parameters<typeof requiredKeys>[0],
    )) {
      expect(contract, `unresolved_references field ${key}`).toContain(key);
    }
  });

  it('names every required claim field', () => {
    for (const key of requiredKeys(
      claimSchema.def.shape as unknown as Parameters<typeof requiredKeys>[0],
    )) {
      expect(contract, `claims field ${key}`).toContain(key);
    }
  });

  it('names every required atlas candidate field', () => {
    for (const key of requiredKeys(
      atlasCandidateSchema.def.shape as unknown as Parameters<typeof requiredKeys>[0],
    )) {
      expect(contract, `candidate field ${key}`).toContain(key);
    }
  });
});

describe('the written contract states the v2 boundaries', () => {
  const required = [
    'never be quoted, cited, summarised',
    'not Tier 3',
    'no reader-facing page',
    'keeping `concept_id` and `slug` exactly as they were',
    'do not create a\nstub so a link resolves',
    'An agent never makes\nthat promotion',
    'Private research material',
  ];

  for (const phrase of required) {
    it(`says: ${phrase.split('\n')[0]}`, () => {
      expect(contract).toContain(phrase);
    });
  }

  it('still forbids an agent raising its own review state', () => {
    expect(contract).toContain('Never raise your own review state');
  });
});

describe('published JSON Schemas', () => {
  const generated = allJsonSchemas();

  it('generates the same bytes twice', () => {
    expect(allJsonSchemas()).toEqual(generated);
  });

  it('matches the files committed in schemas/', () => {
    for (const [name, contents] of Object.entries(generated)) {
      const onDisk = readFileSync(join(paths.schemasDir, name), 'utf8');
      expect(onDisk, `schemas/${name} is stale; run npm run schema`).toBe(contents);
    }
  });

  it('publishes one schema per canonical format, plus the proposal bundle', () => {
    expect(Object.keys(generated).sort()).toEqual([
      'atlas.schema.json',
      'concept.schema.json',
      'graph-only.schema.json',
      // A proposal is not canonical content, but it is a contract an outside
      // agent has to meet, so it is published in the same place (v2 R00).
      'proposal.schema.json',
    ]);
  });

  it('refuses unknown keys in every published schema', () => {
    for (const [name, contents] of Object.entries(generated)) {
      const document = JSON.parse(contents) as { additionalProperties?: boolean };
      expect(document.additionalProperties, name).toBe(false);
    }
  });

  it('carries the v2 fields in the concept schema', () => {
    const document = JSON.parse(generated['concept.schema.json']!) as {
      properties: Record<string, unknown>;
    };
    expect(Object.keys(document.properties)).toContain('unresolved_references');
    expect(Object.keys(document.properties)).toContain('claims');
  });
});
