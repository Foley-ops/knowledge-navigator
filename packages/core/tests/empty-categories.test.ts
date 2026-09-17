/**
 * What counts as an empty part of the map.
 *
 * Coverage exists to show the parts of the subject nobody has written about. A
 * category with a page in it is not one of those, whether or not a candidate
 * label was ever filed under it — and before any content existed outside the
 * candidate list, those two conditions were indistinguishable, so the original
 * count could not tell them apart.
 *
 * Both paths that produce the number are checked here: the one computed from a
 * loaded corpus, and the one computed in SQL from a compiled index. They have
 * to agree, because Coverage reads one and `navigator validate` reads the other.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database as DatabaseType } from 'better-sqlite3';
import { compileCorpus } from '../src/compile.js';
import { openDatabaseReadOnly } from '../src/db.js';
import { getCoverageSummary } from '../src/coverage.js';
import { loadCorpus } from '../src/validate.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const ANALYSIS = 'Mathematics/Analysis';
const INFORMATION = 'Mathematics/Information Theory';

/**
 * An atlas with one category nobody filed a candidate under, which is the
 * shape Appendix A really has for several mathematical neighbourhoods.
 */
const ATLAS = `schema_version: 1
areas:
  - area_id: atlas.mathematics
    title: Mathematics
    categories:
      - category_id: atlas.mathematics.analysis
        title: Analysis
        parent_id: atlas.mathematics
      - category_id: atlas.mathematics.information_theory
        title: Information Theory
        parent_id: atlas.mathematics
  - area_id: atlas.artificial_intelligence
    title: Artificial Intelligence
    categories:
      - category_id: atlas.artificial_intelligence.deep_learning
        title: Deep Learning
        parent_id: atlas.artificial_intelligence
  - area_id: atlas.programming
    title: Programming
    categories:
      - category_id: atlas.programming.languages
        title: Languages
        parent_id: atlas.programming
candidates:
  - candidate_id: candidate.mathematics.analysis.convolution
    title: Convolution
    categories:
      - atlas.mathematics.analysis
    status: candidate
    canonical_concept_id: null
`;

function page(options: {
  id: string;
  title: string;
  slug: string;
  categories: string[];
  relatesTo: string;
}): string {
  return conceptMarkdown({
    conceptId: options.id,
    title: options.title,
    slug: options.slug,
    aliases: [],
    kind: 'concept',
    tier: 1,
    categories: options.categories,
    relationships: [{ type: 'contrasts_with', target: options.relatesTo }],
    body: tier1Body(),
  });
}

let root = '';
let db: DatabaseType;

/** Compile the fixture and return both coverage numbers. */
async function counts(categories: string[]): Promise<{ loaded: number; compiled: number }> {
  const contentDir = join(root, 'content', 'concepts');
  await writeFile(
    join(contentDir, 'shannon-entropy.md'),
    page({
      id: 'concept.analysis.shannon_entropy',
      title: 'Shannon Entropy',
      slug: '/concepts/shannon-entropy',
      categories,
      relatesTo: 'concept.analysis.entropy_partner',
    }),
    'utf8',
  );

  const corpus = await loadCorpus(contentDir);
  if (!corpus.ok) {
    throw new Error(
      `fixture did not validate: ${corpus.diagnostics.map((d) => `${d.file} ${d.field}: ${d.message}`).join('; ')}`,
    );
  }

  const databasePath = join(root, 'knowledge.db');
  const compiled = await compileCorpus({
    contentDir,
    databasePath,
    env: { SOURCE_DATE_EPOCH: '1700000000' },
  });
  expect(compiled.ok, JSON.stringify(compiled.diagnostics)).toBe(true);

  db = openDatabaseReadOnly(databasePath);
  try {
    return {
      loaded: corpus.coverage.emptyCategories,
      compiled: getCoverageSummary(db).atlas.emptyCategories,
    };
  } finally {
    db.close();
  }
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'navigator-empty-categories-'));
  const contentDir = join(root, 'content', 'concepts');
  await mkdir(contentDir, { recursive: true });
  await writeFile(join(root, 'content', 'atlas.yaml'), ATLAS, 'utf8');
  // A second page so the first has something to relate to.
  await writeFile(
    join(contentDir, 'entropy-partner.md'),
    page({
      id: 'concept.analysis.entropy_partner',
      title: 'Entropy Partner',
      slug: '/concepts/entropy-partner',
      categories: [ANALYSIS],
      relatesTo: 'concept.analysis.shannon_entropy',
    }),
    'utf8',
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('an atlas category with no candidate under it', () => {
  // Three categories in the fixture hold no candidate: Information Theory,
  // Deep Learning and Languages. Only Information Theory gains a page below.
  const EMPTY_AT_SEED = 3;

  it('is empty while nothing has been written about it', async () => {
    const { loaded, compiled } = await counts([ANALYSIS]);
    expect(loaded).toBe(EMPTY_AT_SEED);
    expect(compiled).toBe(EMPTY_AT_SEED);
  });

  it('stops being empty once a page sits in it', async () => {
    const { loaded, compiled } = await counts([INFORMATION]);
    expect(loaded).toBe(EMPTY_AT_SEED - 1);
    expect(compiled).toBe(EMPTY_AT_SEED - 1);
  });

  it('counts it as filled through the short Area/Title form too', async () => {
    // The atlas registers both the full display path and the short form, and a
    // page may be filed under either. Coverage has to see both.
    const { loaded, compiled } = await counts([ANALYSIS, INFORMATION]);
    expect(loaded).toBe(EMPTY_AT_SEED - 1);
    expect(compiled).toBe(EMPTY_AT_SEED - 1);
  });

  it('agrees between the loaded corpus and the compiled index', async () => {
    for (const categories of [[ANALYSIS], [INFORMATION], [ANALYSIS, INFORMATION]]) {
      const { loaded, compiled } = await counts(categories);
      expect(compiled, categories.join(' + ')).toBe(loaded);
    }
  });
});
