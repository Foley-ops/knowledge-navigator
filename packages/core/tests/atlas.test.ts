/**
 * The atlas contract (v2 runbook §4.1), rule by rule.
 *
 * Every rule gets one failing case, and the whole-document test proves that a
 * file breaking several rules reports all of them in one deterministic run
 * rather than stopping at the first.
 */
import { describe, expect, it } from 'vitest';
import {
  ATLAS_ROOT_AREA_TITLES,
  ATLAS_STATUS_TRANSITIONS,
  atlasCounts,
  buildAtlasIndex,
  isAllowedAtlasStatusTransition,
  loadAtlasFromText,
  parseAtlasDocument,
  resolveAtlasCategoryPath,
  validateAtlasStatusTransitions,
  validateAtlasStructure,
} from '../src/atlas.js';
import type { AtlasDocument } from '../src/atlas.js';

/* -------------------------------------------------------------------------- */
/* A small but complete valid atlas                                            */
/* -------------------------------------------------------------------------- */

const VALID_YAML = `schema_version: 1
areas:
  - area_id: atlas.mathematics
    title: Mathematics
    categories:
      - category_id: atlas.mathematics.analysis
        title: Analysis
        parent_id: atlas.mathematics
      - category_id: atlas.mathematics.combinatorics
        title: Combinatorics
        parent_id: atlas.mathematics
  - area_id: atlas.artificial_intelligence
    title: Artificial Intelligence
    categories:
      - category_id: atlas.artificial_intelligence.domains
        title: Domains
        parent_id: atlas.artificial_intelligence
      - category_id: atlas.artificial_intelligence.domains.computer_vision
        title: Computer Vision
        parent_id: atlas.artificial_intelligence.domains
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates:
  - candidate_id: candidate.mathematics.analysis.fourier_analysis
    title: Fourier Analysis
    aliases:
      - Fourier transform theory
    categories:
      - atlas.mathematics.analysis
    status: candidate
    canonical_concept_id: null
    note: null
  - candidate_id: candidate.mathematics.analysis.convolution
    title: Convolution
    categories:
      - atlas.mathematics.analysis
    status: covered
    canonical_concept_id: concept.analysis.convolution
  - candidate_id: candidate.programming.languages.lean
    title: Lean
    categories:
      - atlas.programming.languages
      - atlas.mathematics.analysis
    status: proposed-tier-3
    note: Shares a category with mathematics deliberately.
`;

function validDocument(): AtlasDocument {
  const parsed = parseAtlasDocument(
    JSON.parse(JSON.stringify(loadAtlasFromText(VALID_YAML).atlas?.document)),
  );
  if (!parsed.ok || parsed.value === undefined) {
    throw new Error(`the valid fixture did not parse: ${JSON.stringify(parsed.issues)}`);
  }
  return parsed.value;
}

function messagesFor(mutate: (document: AtlasDocument) => void): string[] {
  const document = validDocument();
  mutate(document);
  return validateAtlasStructure(document).map((diagnostic) => diagnostic.message);
}

describe('a valid atlas', () => {
  it('loads, validates and indexes', () => {
    const result = loadAtlasFromText(VALID_YAML);
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);

    const atlas = result.atlas;
    if (atlas === undefined) throw new Error('expected an index');
    expect([...atlas.areas.keys()].sort()).toEqual([
      'atlas.artificial_intelligence',
      'atlas.mathematics',
      'atlas.programming',
    ]);
    expect(atlas.categories.size).toBe(5);
    expect(atlas.candidates.size).toBe(3);
  });

  it('keeps an empty category visible', () => {
    const atlas = loadAtlasFromText(VALID_YAML).atlas;
    const languages = atlas?.categories.get('atlas.programming.languages');
    const combinatorics = atlas?.categories.get('atlas.mathematics.combinatorics');
    expect(languages?.candidateIds).toEqual(['candidate.programming.languages.lean']);
    // Combinatorics has no candidate and no child and still exists, as does
    // Computer Vision; Domains is not empty because it has a child category.
    expect(combinatorics?.candidateIds).toEqual([]);
    expect(combinatorics?.childCategoryIds).toEqual([]);
    expect(atlasCounts(atlas!).emptyCategories).toBe(2);
  });

  it('derives full and short category paths', () => {
    const atlas = loadAtlasFromText(VALID_YAML).atlas!;
    expect(
      atlas.categories.get('atlas.artificial_intelligence.domains.computer_vision')?.path,
    ).toBe('Artificial Intelligence/Domains/Computer Vision');
    // The full path resolves, and so does the short `Area/Title` form that
    // canonical concept categories use.
    expect(resolveAtlasCategoryPath(atlas, 'Artificial Intelligence/Domains/Computer Vision')).toBe(
      'atlas.artificial_intelligence.domains.computer_vision',
    );
    expect(resolveAtlasCategoryPath(atlas, 'Artificial Intelligence/Computer Vision')).toBe(
      'atlas.artificial_intelligence.domains.computer_vision',
    );
    expect(resolveAtlasCategoryPath(atlas, 'Mathematics/Analysis')).toBe(
      'atlas.mathematics.analysis',
    );
    expect(resolveAtlasCategoryPath(atlas, 'Mathematics/Nothing Here')).toBeUndefined();
  });

  it('counts candidates by status deterministically', () => {
    const counts = atlasCounts(loadAtlasFromText(VALID_YAML).atlas!);
    expect(counts).toEqual({
      areas: 3,
      categories: 5,
      emptyCategories: 2,
      candidates: 3,
      byStatus: { candidate: 1, 'proposed-tier-3': 1, covered: 1, deferred: 0 },
    });
  });

  it('places a candidate in every category it names', () => {
    const atlas = loadAtlasFromText(VALID_YAML).atlas!;
    expect(atlas.categories.get('atlas.mathematics.analysis')?.candidateIds).toEqual([
      'candidate.mathematics.analysis.convolution',
      'candidate.mathematics.analysis.fourier_analysis',
      'candidate.programming.languages.lean',
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* Schema-level rules                                                          */
/* -------------------------------------------------------------------------- */

describe('schema rules', () => {
  it('rejects an unknown top-level key', () => {
    const result = loadAtlasFromText(`${VALID_YAML}extra_key: 1\n`);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.message).join(' ')).toContain('unknown key "extra_key"');
  });

  it('refuses a factual summary on a candidate', () => {
    const yaml = VALID_YAML.replace(
      '    status: candidate\n',
      '    status: candidate\n    summary: Fourier analysis decomposes functions into frequencies.\n',
    );
    const result = loadAtlasFromText(yaml);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toContain('never a factual summary');
  });

  it('rejects a schema_version other than 1', () => {
    const result = loadAtlasFromText(VALID_YAML.replace('schema_version: 1', 'schema_version: 2'));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.message).join(' ')).toContain(
      'schema_version must be exactly 1',
    );
  });

  it('rejects an id that is not a lowercase dotted identifier', () => {
    const result = loadAtlasFromText(VALID_YAML.replace('atlas.mathematics\n', 'Atlas-Maths\n'));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.message).join(' ')).toContain(
      'must be a lowercase dotted identifier',
    );
  });

  it('rejects a status outside the enumeration', () => {
    const result = loadAtlasFromText(VALID_YAML.replace('status: candidate', 'status: maybe'));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('rejects a candidate with no categories', () => {
    const document = validDocument();
    const parsed = parseAtlasDocument({
      ...document,
      candidates: [{ ...document.candidates[0]!, categories: [] }],
    });
    expect(parsed.ok).toBe(false);
    expect(parsed.issues.map((i) => i.message).join(' ')).toContain(
      'must name at least one atlas category',
    );
  });

  it('rejects malformed YAML and an empty file without throwing', () => {
    expect(loadAtlasFromText('areas: [\n').diagnostics[0]?.message).toContain(
      'YAML could not be parsed',
    );
    expect(loadAtlasFromText('').diagnostics[0]?.message).toContain('the atlas file is empty');
  });
});

/* -------------------------------------------------------------------------- */
/* Structural rules                                                            */
/* -------------------------------------------------------------------------- */

describe('structural rules', () => {
  it('requires exactly the three root areas', () => {
    expect(
      messagesFor((document) => {
        document.areas = document.areas.filter((area) => area.title !== 'Programming');
      }).join(' '),
    ).toContain('exactly the three root areas');

    expect(
      messagesFor((document) => {
        document.areas.push({ area_id: 'atlas.chemistry', title: 'Chemistry', categories: [] });
      }).join(' '),
    ).toContain('exactly the three root areas');
  });

  it('names the three areas from the product brief', () => {
    expect([...ATLAS_ROOT_AREA_TITLES].sort()).toEqual([
      'Artificial Intelligence',
      'Mathematics',
      'Programming',
    ]);
  });

  it('rejects a duplicate area_id', () => {
    expect(
      messagesFor((document) => {
        document.areas[1]!.area_id = 'atlas.mathematics';
      }).join(' '),
    ).toContain('duplicate area_id atlas.mathematics');
  });

  it('rejects a duplicate category_id across areas', () => {
    expect(
      messagesFor((document) => {
        document.areas[2]!.categories[0]!.category_id = 'atlas.mathematics.analysis';
      }).join(' '),
    ).toContain('duplicate category_id atlas.mathematics.analysis');
  });

  it('rejects a category_id that collides with an area_id', () => {
    expect(
      messagesFor((document) => {
        document.areas[0]!.categories[0]!.category_id = 'atlas.programming';
      }).join(' '),
    ).toContain('collides with an area_id');
  });

  it('rejects a missing parent', () => {
    expect(
      messagesFor((document) => {
        document.areas[0]!.categories[0]!.parent_id = 'atlas.nowhere';
      }).join(' '),
    ).toContain('is neither an area nor a category');
  });

  it('rejects a category that is its own parent', () => {
    expect(
      messagesFor((document) => {
        document.areas[0]!.categories[0]!.parent_id = 'atlas.mathematics.analysis';
      }).join(' '),
    ).toContain('is its own parent');
  });

  it('rejects a cycle', () => {
    expect(
      messagesFor((document) => {
        // analysis -> combinatorics -> analysis: neither reaches a root.
        document.areas[0]!.categories[0]!.parent_id = 'atlas.mathematics.combinatorics';
        document.areas[0]!.categories[1]!.parent_id = 'atlas.mathematics.analysis';
      }).join(' '),
    ).toContain('does not reach a root area');
  });

  it('rejects a category whose parent chain reaches a different root', () => {
    expect(
      messagesFor((document) => {
        document.areas[2]!.categories[0]!.parent_id = 'atlas.mathematics.analysis';
      }).join(' '),
    ).toContain('belongs to exactly one root');
  });

  it('rejects two categories with the same title inside one area', () => {
    expect(
      messagesFor((document) => {
        document.areas[0]!.categories[1]!.title = 'analysis';
      }).join(' '),
    ).toContain('must be unique within its area');
  });

  it('allows the same category title in two different areas', () => {
    expect(
      messagesFor((document) => {
        document.areas[2]!.categories[0]!.title = 'Analysis';
      }),
    ).toEqual([]);
  });

  it('rejects a duplicate candidate_id', () => {
    expect(
      messagesFor((document) => {
        document.candidates[1]!.candidate_id = document.candidates[0]!.candidate_id;
      }).join(' '),
    ).toContain('appears exactly once in the candidate list');
  });

  it('rejects a candidate_id that collides with a category id', () => {
    expect(
      messagesFor((document) => {
        document.candidates[0]!.candidate_id = 'atlas.mathematics.analysis';
      }).join(' '),
    ).toContain('collides with an area or category id');
  });

  it('rejects a candidate in a category that does not exist', () => {
    expect(
      messagesFor((document) => {
        document.candidates[0]!.categories = ['atlas.mathematics.nowhere'];
      }).join(' '),
    ).toContain('does not exist in the atlas');
  });

  it('rejects a candidate attached directly to a root area', () => {
    expect(
      messagesFor((document) => {
        document.candidates[0]!.categories = ['atlas.mathematics'];
      }).join(' '),
    ).toContain('must sit in a named category');
  });

  it('rejects a candidate that repeats a category', () => {
    expect(
      messagesFor((document) => {
        document.candidates[0]!.categories = [
          'atlas.mathematics.analysis',
          'atlas.mathematics.analysis',
        ];
      }).join(' '),
    ).toContain('repeats category atlas.mathematics.analysis');
  });

  it('accepts a candidate in several categories', () => {
    expect(
      messagesFor((document) => {
        document.candidates[0]!.categories = [
          'atlas.mathematics.analysis',
          'atlas.programming.languages',
        ];
      }),
    ).toEqual([]);
  });

  it('rejects two candidates whose titles normalise to the same name', () => {
    expect(
      messagesFor((document) => {
        document.candidates[1]!.title = 'fourier-analysis';
      }).join(' '),
    ).toContain('a label must identify exactly one candidate');
  });

  it('rejects an alias that collides with another candidate title', () => {
    expect(
      messagesFor((document) => {
        document.candidates[1]!.aliases = ['Fourier Analysis'];
      }).join(' '),
    ).toContain('a label must identify exactly one candidate');
  });

  it('rejects an alias that repeats its own title', () => {
    expect(
      messagesFor((document) => {
        document.candidates[1]!.aliases = ['convolution'];
      }).join(' '),
    ).toContain('repeats another name on this same candidate');
  });

  it('rejects a covered candidate with no canonical concept id', () => {
    expect(
      messagesFor((document) => {
        document.candidates[1]!.canonical_concept_id = null;
      }).join(' '),
    ).toContain('it must name exactly one canonical concept id');
  });

  it('rejects a non-covered candidate that names a canonical concept id', () => {
    expect(
      messagesFor((document) => {
        document.candidates[0]!.canonical_concept_id = 'concept.analysis.convolution';
      }).join(' '),
    ).toContain('only a covered candidate resolves to a concept');
  });
});

/* -------------------------------------------------------------------------- */
/* Everything at once, deterministically                                       */
/* -------------------------------------------------------------------------- */

describe('reporting', () => {
  it('returns every problem in one run, in a stable order', () => {
    const document = validDocument();
    document.areas = document.areas.filter((area) => area.title !== 'Programming');
    document.areas[0]!.categories[1]!.parent_id = 'atlas.nowhere';
    document.candidates[0]!.canonical_concept_id = 'concept.analysis.convolution';
    document.candidates[1]!.canonical_concept_id = null;
    document.candidates[2]!.categories = ['atlas.mathematics.analysis'];

    const first = validateAtlasStructure(document);
    const second = validateAtlasStructure(document);

    expect(first.length).toBe(4);
    expect(first).toEqual(second);
    expect(first.map((d) => d.field)).toEqual([...first.map((d) => d.field)].sort());
    expect(first.every((d) => d.file === 'atlas.yaml')).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Status transitions                                                          */
/* -------------------------------------------------------------------------- */

describe('status transitions', () => {
  it('allows editorial progress and deferral', () => {
    expect(isAllowedAtlasStatusTransition('candidate', 'proposed-tier-3')).toBe(true);
    expect(isAllowedAtlasStatusTransition('candidate', 'deferred')).toBe(true);
    expect(isAllowedAtlasStatusTransition('deferred', 'covered')).toBe(true);
    expect(isAllowedAtlasStatusTransition('covered', 'candidate')).toBe(true);
  });

  it('refuses to un-cover a candidate into deferral or re-proposal', () => {
    expect(isAllowedAtlasStatusTransition('covered', 'deferred')).toBe(false);
    expect(isAllowedAtlasStatusTransition('covered', 'proposed-tier-3')).toBe(false);
    expect(ATLAS_STATUS_TRANSITIONS.covered).toEqual(['covered', 'candidate']);
  });

  it('reports an illegal transition between two documents', () => {
    const before = validDocument();
    const after = validDocument();
    after.candidates[1]!.status = 'deferred';
    after.candidates[1]!.canonical_concept_id = null;

    const diagnostics = validateAtlasStatusTransitions(before, after);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('may not move from "covered" to "deferred"');
  });

  it('says nothing about a candidate that is new or unchanged', () => {
    const before = validDocument();
    const after = validDocument();
    after.candidates.push({
      candidate_id: 'candidate.programming.languages.rust',
      title: 'Rust',
      aliases: [],
      categories: ['atlas.programming.languages'],
      status: 'candidate',
      canonical_concept_id: null,
      note: null,
    });
    expect(validateAtlasStatusTransitions(before, after)).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* Index behaviour on a broken document                                        */
/* -------------------------------------------------------------------------- */

describe('index construction', () => {
  it('never throws on a broken parent chain', () => {
    const document = validDocument();
    document.areas[0]!.categories[0]!.parent_id = 'atlas.mathematics.combinatorics';
    document.areas[0]!.categories[1]!.parent_id = 'atlas.mathematics.analysis';
    const index = buildAtlasIndex(document);
    expect(index.categories.get('atlas.mathematics.analysis')?.areaId).toBe('');
  });
});
