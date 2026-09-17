/**
 * Compile the canonical corpus into the disposable index (runbook D00–D07).
 *
 * Compilation is atomic: everything is written to a temporary path, verified,
 * closed, and only then renamed over the target. A failed build never replaces
 * a working database.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Database as DatabaseType } from 'better-sqlite3';
import { SCHEMA_VERSION, buildTimestamp, createDatabase } from './db.js';
import { categorySegments, categoryTopLevel, compareStrings, normalizeName } from './normalize.js';
import { loadCorpus } from './validate.js';
import type { Diagnostic } from './validate.js';
import type { LoadedConcept } from './loader.js';
import { backlogGroupId, unresolvedReferenceId } from './schema.js';
import type { Source } from './schema.js';
import { resolveAtlasCategoryPath } from './atlas.js';
import type { AtlasIndex } from './atlas.js';
import { buildGraphDocument, serializeGraph } from './graph.js';
import { buildSidebars } from './sidebars.js';
import { openDatabaseReadOnly } from './db.js';

export interface CompileOptions {
  /** Directory holding canonical Markdown. */
  readonly contentDir: string;
  /** Final location of the compiled database. */
  readonly databasePath: string;
  /** Where to write the browser graph. Omitted means "do not write it". */
  readonly graphJsonPath?: string | undefined;
  /** Where to write the generated Docusaurus sidebar. Omitted means skip. */
  readonly sidebarsPath?: string | undefined;
  /** Overrides `process.env` for timestamp determinism in tests. */
  readonly env?: NodeJS.ProcessEnv;
}

export interface CompileStats {
  readonly concepts: number;
  readonly aliases: number;
  readonly categories: number;
  readonly conceptCategories: number;
  readonly relationships: number;
  readonly sources: number;
  readonly conceptSources: number;
  readonly ftsRows: number;
  // Version 2
  readonly graphOnlyConcepts: number;
  readonly atlasAreas: number;
  readonly atlasCategories: number;
  readonly atlasCandidates: number;
  readonly atlasCandidateCategories: number;
  readonly unresolvedReferences: number;
  readonly claims: number;
  readonly claimEvidence: number;
}

export type CompileResult =
  | {
      readonly ok: true;
      readonly stats: CompileStats;
      readonly corpusHash: string;
      readonly atlasHash: string;
      readonly builtAt: string;
      readonly diagnostics: readonly Diagnostic[];
      readonly outputs: readonly string[];
    }
  | {
      readonly ok: false;
      readonly stats: undefined;
      readonly corpusHash: string | undefined;
      readonly atlasHash: string | undefined;
      readonly builtAt: undefined;
      readonly diagnostics: readonly Diagnostic[];
      readonly outputs: readonly string[];
    };

/**
 * Insert concept identity, body and names.
 *
 * Titles are stored in `aliases` alongside the declared aliases so that one
 * lookup path serves both. A title and an alias of the *same* concept may
 * normalise alike (for example "Cross-Correlation" and "cross correlation"),
 * which is deduplicated here; a collision between *different* concepts violates
 * the unique index and fails the build, as it must.
 */
function insertConcepts(db: DatabaseType, concepts: readonly LoadedConcept[]): void {
  const insertConcept = db.prepare(`
    INSERT INTO concepts (
      id, title, slug, file_name, source_path, kind, tier, review_state,
      summary, body, plain_text, content_hash, primary_category,
      content_format, has_article
    ) VALUES (
      @id, @title, @slug, @file_name, @source_path, @kind, @tier, @review_state,
      @summary, @body, @plain_text, @content_hash, @primary_category,
      @content_format, @has_article
    )
  `);
  const insertAlias = db.prepare(`
    INSERT INTO aliases (concept_id, alias, normalized, is_title, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const concept of concepts) {
    const fm = concept.frontmatter;
    insertConcept.run({
      id: fm.concept_id,
      title: fm.title,
      slug: fm.slug,
      file_name: concept.fileName,
      source_path:
        concept.format === 'graph-only'
          ? `content/graph-only/${concept.fileName}`
          : `content/concepts/${concept.fileName}`,
      kind: fm.kind,
      tier: fm.tier,
      review_state: fm.review_state,
      summary: fm.summary,
      body: concept.body,
      plain_text: concept.plainText,
      content_hash: concept.contentHash,
      primary_category: fm.primary_category,
      content_format: concept.format,
      // Only a Markdown page below Tier 3 has something to read. Everything
      // else resolves to an identity panel, never to an empty article.
      has_article: concept.format === 'markdown' && fm.tier < 3 ? 1 : 0,
    });

    const seen = new Set<string>();
    let position = 0;
    const addName = (name: string, isTitle: boolean): void => {
      const normalized = normalizeName(name);
      if (seen.has(normalized)) return;
      seen.add(normalized);
      insertAlias.run(fm.concept_id, name, normalized, isTitle ? 1 : 0, position);
      position += 1;
    };
    addName(fm.title, true);
    for (const alias of fm.aliases) addName(alias, false);
  }
}

/**
 * Insert the category atlas and attach concepts to it.
 *
 * A row is created for every *prefix* of every declared path, so
 * `Artificial Intelligence` exists as a navigable parent of
 * `Artificial Intelligence/Computer Vision` even though no concept declares the
 * bare area. Category order in the frontmatter is preserved, and the first
 * category — which the runbook makes the primary one — carries `is_primary`.
 */
function insertCategories(db: DatabaseType, concepts: readonly LoadedConcept[]): void {
  const insertCategory = db.prepare(
    'INSERT INTO categories (path, name, top_level, depth, parent_id) VALUES (?, ?, ?, ?, ?)',
  );
  const insertLink = db.prepare(
    'INSERT INTO concept_categories (concept_id, category_id, is_primary, position) VALUES (?, ?, ?, ?)',
  );

  const ids = new Map<string, number>();
  const ensure = (path: string): number => {
    const existing = ids.get(path);
    if (existing !== undefined) return existing;
    const segments = categorySegments(path);
    const parentPath = segments.slice(0, -1).join('/');
    const parentId = segments.length > 1 ? ensure(parentPath) : null;
    const info = insertCategory.run(
      path,
      segments[segments.length - 1] ?? path,
      categoryTopLevel(path),
      segments.length,
      parentId,
    );
    const id = Number(info.lastInsertRowid);
    ids.set(path, id);
    return id;
  };

  // Create every path deterministically, shortest first, so ids are stable for
  // a given corpus regardless of which concept mentions a path first.
  const allPaths = new Set<string>();
  for (const concept of concepts) {
    for (const category of concept.frontmatter.categories) {
      const segments = categorySegments(category);
      for (let i = 1; i <= segments.length; i += 1) allPaths.add(segments.slice(0, i).join('/'));
    }
  }
  for (const path of [...allPaths].sort(
    (a, b) => a.split('/').length - b.split('/').length || compareStrings(a, b),
  )) {
    ensure(path);
  }

  for (const concept of concepts) {
    const fm = concept.frontmatter;
    fm.categories.forEach((category, position) => {
      const categoryId = ensure(category);
      insertLink.run(fm.concept_id, categoryId, category === fm.primary_category ? 1 : 0, position);
    });
  }
}

/** Insert typed relationships, preserving notes, conditions and declared order. */
function insertRelationships(db: DatabaseType, concepts: readonly LoadedConcept[]): void {
  const insert = db.prepare(`
    INSERT INTO relationships (source_concept_id, type, target_concept_id, note, condition, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const concept of concepts) {
    concept.frontmatter.relationships.forEach((relationship, position) => {
      insert.run(
        concept.frontmatter.concept_id,
        relationship.type,
        relationship.target,
        relationship.note ?? null,
        relationship.condition ?? null,
        position,
      );
    });
  }
}

/**
 * Insert evidence metadata.
 *
 * Sources are deduplicated by `source_id`: one row per distinct source, holding
 * only the fields that identify it. `supports` and `checked_on` belong to the
 * *citation*, not to the source, so two concepts may legitimately cite the same
 * work for different sections on different dates. A genuine conflict — the same
 * id with a different title, url or kind — is rejected by corpus validation
 * before this runs, and the primary key here is the second line of defence.
 */
function insertSources(db: DatabaseType, concepts: readonly LoadedConcept[]): void {
  const insertSource = db.prepare(
    'INSERT INTO sources (id, title, url, source_kind) VALUES (?, ?, ?, ?)',
  );
  const insertCitation = db.prepare(`
    INSERT INTO concept_sources (concept_id, source_id, supports, checked_on, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seen = new Set<string>();
  // Insert distinct sources in id order so the table is deterministic.
  const distinct = new Map<string, Source>();
  for (const concept of concepts) {
    for (const source of concept.frontmatter.sources) {
      if (!distinct.has(source.source_id)) distinct.set(source.source_id, source);
    }
  }
  for (const id of [...distinct.keys()].sort(compareStrings)) {
    const source = distinct.get(id);
    if (source === undefined) continue;
    insertSource.run(source.source_id, source.title, source.url, source.source_kind);
    seen.add(source.source_id);
  }

  for (const concept of concepts) {
    concept.frontmatter.sources.forEach((source, position) => {
      insertCitation.run(
        concept.frontmatter.concept_id,
        source.source_id,
        JSON.stringify(source.supports),
        source.checked_on,
        position,
      );
    });
  }
}

/**
 * Populate the full-text index with title, aliases, summary and plain-text body
 * (runbook D04). The body is the prose the loader extracted, so LaTeX and raw
 * markup never become search tokens.
 */
function insertFts(db: DatabaseType, concepts: readonly LoadedConcept[]): void {
  const insert = db.prepare(
    'INSERT INTO concepts_fts (concept_id, title, aliases, summary, body) VALUES (?, ?, ?, ?, ?)',
  );
  for (const concept of concepts) {
    const fm = concept.frontmatter;
    // A graph-only identity is findable by the names and the one cautious
    // sentence it declares. It has no prose, so it contributes no body: it can
    // be found, but it can never look like an article that was never written.
    insert.run(fm.concept_id, fm.title, fm.aliases.join(' \n'), fm.summary, concept.plainText);
  }
}

/**
 * Insert the curated atlas (v2 runbook L01).
 *
 * Every area, category and candidate is stored, including categories with no
 * candidate and no child: an unexplained neighbourhood has to stay visible, and
 * dropping it here would make Coverage quietly under-report the universe.
 */
function insertAtlas(db: DatabaseType, atlas: AtlasIndex): void {
  const insertArea = db.prepare('INSERT INTO atlas_areas (id, title, position) VALUES (?, ?, ?)');
  const insertCategory = db.prepare(`
    INSERT INTO atlas_categories (id, title, area_id, parent_category_id, depth, path, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCandidate = db.prepare(`
    INSERT INTO atlas_candidates
      (id, title, normalized_title, status, canonical_concept_id, note, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCandidateAlias = db.prepare(
    'INSERT INTO atlas_candidate_aliases (candidate_id, alias, normalized, position) VALUES (?, ?, ?, ?)',
  );
  const insertCandidateCategory = db.prepare(
    'INSERT INTO atlas_candidate_categories (candidate_id, category_id, position) VALUES (?, ?, ?)',
  );

  atlas.document.areas.forEach((area, position) => {
    insertArea.run(area.area_id, area.title, position);
  });

  // Shallowest first, so a parent row always exists before its child.
  const nodes = [...atlas.categories.values()].sort(
    (a, b) => a.depth - b.depth || compareStrings(a.categoryId, b.categoryId),
  );
  nodes.forEach((node, position) => {
    insertCategory.run(
      node.categoryId,
      node.title,
      node.areaId,
      atlas.categories.has(node.parentId) ? node.parentId : null,
      node.depth,
      node.path,
      position,
    );
  });

  atlas.document.candidates.forEach((candidate, position) => {
    insertCandidate.run(
      candidate.candidate_id,
      candidate.title,
      normalizeName(candidate.title),
      candidate.status,
      candidate.canonical_concept_id ?? null,
      candidate.note ?? null,
      position,
    );
    candidate.aliases.forEach((alias, aliasPosition) => {
      insertCandidateAlias.run(candidate.candidate_id, alias, normalizeName(alias), aliasPosition);
    });
    candidate.categories.forEach((categoryId, categoryPosition) => {
      insertCandidateCategory.run(candidate.candidate_id, categoryId, categoryPosition);
    });
  });
}

/**
 * Insert the editorial backlog (v2 runbook L03).
 *
 * An unresolved reference stays attached to the page that needs it, and also
 * carries a `group_id` derived from its normalised label, so the two pages
 * waiting on the same idea are one piece of work with two source records.
 */
function insertUnresolvedReferences(
  db: DatabaseType,
  concepts: readonly LoadedConcept[],
  atlas: AtlasIndex,
): void {
  const insertReference = db.prepare(`
    INSERT INTO unresolved_references
      (id, group_id, concept_id, label, normalized_label, reason, blocking, proposed_kind, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSection = db.prepare(
    'INSERT INTO unresolved_reference_sections (reference_id, section, position) VALUES (?, ?, ?)',
  );
  const insertCategory = db.prepare(`
    INSERT INTO unresolved_reference_categories
      (reference_id, category_path, atlas_category_id, position)
    VALUES (?, ?, ?, ?)
  `);

  for (const concept of concepts) {
    const conceptId = concept.frontmatter.concept_id;
    concept.frontmatter.unresolved_references.forEach((reference, position) => {
      const id = unresolvedReferenceId(conceptId, reference.label);
      insertReference.run(
        id,
        backlogGroupId(reference.label),
        conceptId,
        reference.label,
        normalizeName(reference.label),
        reference.reason,
        reference.blocking ? 1 : 0,
        reference.proposed_kind ?? null,
        position,
      );
      reference.sections.forEach((section, sectionPosition) => {
        insertSection.run(id, section, sectionPosition);
      });
      reference.proposed_categories.forEach((path, categoryPosition) => {
        insertCategory.run(
          id,
          path,
          resolveAtlasCategoryPath(atlas, path) ?? null,
          categoryPosition,
        );
      });
    });
  }
}

/**
 * Insert claims and their evidence locators (v2 runbook L04).
 *
 * `claim_evidence.source_id` is a foreign key into `sources`, so a locator can
 * never point at a work the corpus does not carry. An `unsupported` claim has
 * no evidence rows at all — that is how the database records "nobody has
 * checked this" rather than leaving it indistinguishable from a checked one.
 */
function insertClaims(db: DatabaseType, concepts: readonly LoadedConcept[]): void {
  const insertClaim = db.prepare(
    'INSERT INTO claims (id, concept_id, section, statement, status, position) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertEvidence = db.prepare(
    'INSERT INTO claim_evidence (claim_id, source_id, locator, note, position) VALUES (?, ?, ?, ?, ?)',
  );

  for (const concept of concepts) {
    const conceptId = concept.frontmatter.concept_id;
    concept.frontmatter.claims.forEach((claim, position) => {
      insertClaim.run(
        claim.claim_id,
        conceptId,
        claim.section,
        claim.statement,
        claim.status,
        position,
      );
      claim.evidence.forEach((evidence, evidencePosition) => {
        insertEvidence.run(
          claim.claim_id,
          evidence.source_id,
          evidence.locator,
          evidence.note ?? null,
          evidencePosition,
        );
      });
    });
  }
}

/** Record the facts a reader needs to know which corpus this index came from. */
function writeBuildMeta(
  db: DatabaseType,
  meta: {
    corpusHash: string;
    atlasHash: string;
    builtAt: string;
    conceptCount: number;
    candidateCount: number;
  },
): void {
  const insert = db.prepare('INSERT INTO build_meta (key, value) VALUES (?, ?)');
  const rows: [string, string][] = [
    ['schema_version', String(SCHEMA_VERSION)],
    ['corpus_hash', meta.corpusHash],
    // Separate from corpus_hash: the atlas is editorial structure, so editing
    // it must be visible without looking like a change to what the corpus says.
    ['atlas_hash', meta.atlasHash],
    ['built_at', meta.builtAt],
    ['concept_count', String(meta.conceptCount)],
    ['candidate_count', String(meta.candidateCount)],
    ['generator', '@navigator/core'],
  ];
  for (const [key, value] of rows) insert.run(key, value);
}

function countRows(db: DatabaseType, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number };
  return row.n;
}

function collectStats(db: DatabaseType): CompileStats {
  return {
    concepts: countRows(db, 'concepts'),
    aliases: countRows(db, 'aliases'),
    categories: countRows(db, 'categories'),
    conceptCategories: countRows(db, 'concept_categories'),
    relationships: countRows(db, 'relationships'),
    sources: countRows(db, 'sources'),
    conceptSources: countRows(db, 'concept_sources'),
    ftsRows: countRows(db, 'concepts_fts'),
    graphOnlyConcepts: countRows(db, "concepts WHERE content_format = 'graph-only'"),
    atlasAreas: countRows(db, 'atlas_areas'),
    atlasCategories: countRows(db, 'atlas_categories'),
    atlasCandidates: countRows(db, 'atlas_candidates'),
    atlasCandidateCategories: countRows(db, 'atlas_candidate_categories'),
    unresolvedReferences: countRows(db, 'unresolved_references'),
    claims: countRows(db, 'claims'),
    claimEvidence: countRows(db, 'claim_evidence'),
  };
}

/**
 * Verify the freshly written database before it is allowed to replace the
 * previous one (runbook D07). Anything wrong here throws, which removes the
 * temporary file and leaves the prior database untouched.
 */
function verifyDatabase(
  db: DatabaseType,
  concepts: readonly LoadedConcept[],
  atlas: AtlasIndex,
  stats: CompileStats,
): void {
  const violations = db.pragma('foreign_key_check') as unknown[];
  if (violations.length > 0) {
    throw new Error(`compiled database has ${String(violations.length)} foreign key violation(s)`);
  }

  const integrity = db.pragma('integrity_check') as { integrity_check: string }[];
  if (integrity[0]?.integrity_check !== 'ok') {
    throw new Error(
      `compiled database failed integrity_check: ${String(integrity[0]?.integrity_check)}`,
    );
  }

  const expected = {
    concepts: concepts.length,
    relationships: concepts.reduce((n, c) => n + c.frontmatter.relationships.length, 0),
    conceptCategories: concepts.reduce((n, c) => n + c.frontmatter.categories.length, 0),
    conceptSources: concepts.reduce((n, c) => n + c.frontmatter.sources.length, 0),
    sources: new Set(concepts.flatMap((c) => c.frontmatter.sources.map((s) => s.source_id))).size,
    ftsRows: concepts.length,
    graphOnlyConcepts: concepts.filter((c) => c.format === 'graph-only').length,
    atlasAreas: atlas.areas.size,
    atlasCategories: atlas.categories.size,
    atlasCandidates: atlas.document.candidates.length,
    atlasCandidateCategories: atlas.document.candidates.reduce(
      (n, candidate) => n + candidate.categories.length,
      0,
    ),
    unresolvedReferences: concepts.reduce(
      (n, c) => n + c.frontmatter.unresolved_references.length,
      0,
    ),
    claims: concepts.reduce((n, c) => n + c.frontmatter.claims.length, 0),
    claimEvidence: concepts.reduce(
      (n, c) => n + c.frontmatter.claims.reduce((m, claim) => m + claim.evidence.length, 0),
      0,
    ),
  };
  for (const [key, want] of Object.entries(expected) as [keyof typeof expected, number][]) {
    const got = stats[key];
    if (got !== want) {
      throw new Error(
        `compiled ${key} row count is ${String(got)} but the corpus declares ${String(want)}`,
      );
    }
  }

  // Every concept must have exactly one primary category row, and it must be
  // the one its frontmatter names.
  const mismatched = db
    .prepare(
      `SELECT c.id FROM concepts c
        WHERE (SELECT COUNT(*) FROM concept_categories cc
                WHERE cc.concept_id = c.id AND cc.is_primary = 1) <> 1
           OR NOT EXISTS (
                SELECT 1 FROM concept_categories cc
                  JOIN categories cat ON cat.id = cc.category_id
                 WHERE cc.concept_id = c.id AND cc.is_primary = 1
                   AND cat.path = c.primary_category)`,
    )
    .all() as { id: string }[];
  if (mismatched.length > 0) {
    throw new Error(
      `primary category is missing or ambiguous for: ${mismatched.map((r) => r.id).join(', ')}`,
    );
  }

  // A graph-only identity must never claim to have an article, and a Markdown
  // page below Tier 3 must never claim not to.
  const wrongArticleFlag = db
    .prepare(
      `SELECT id FROM concepts
        WHERE has_article <> (CASE WHEN content_format = 'markdown' AND tier < 3 THEN 1 ELSE 0 END)`,
    )
    .all() as { id: string }[];
  if (wrongArticleFlag.length > 0) {
    throw new Error(
      `has_article disagrees with content_format/tier for: ${wrongArticleFlag.map((r) => r.id).join(', ')}`,
    );
  }

  // A covered candidate must resolve to exactly one concept that exists, and
  // no two candidates may claim the same one. Validation already refuses both,
  // so reaching here would mean the compiler had introduced the problem.
  const danglingCover = db
    .prepare(
      `SELECT a.id FROM atlas_candidates a
        WHERE a.canonical_concept_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM concepts c WHERE c.id = a.canonical_concept_id)`,
    )
    .all() as { id: string }[];
  if (danglingCover.length > 0) {
    throw new Error(
      `covered candidates name a concept that was not compiled: ${danglingCover.map((r) => r.id).join(', ')}`,
    );
  }

  // Every atlas category must reach a root area that exists.
  const orphanCategory = db
    .prepare(
      `SELECT id FROM atlas_categories
        WHERE area_id NOT IN (SELECT id FROM atlas_areas)`,
    )
    .all() as { id: string }[];
  if (orphanCategory.length > 0) {
    throw new Error(
      `atlas categories reach no root area: ${orphanCategory.map((r) => r.id).join(', ')}`,
    );
  }
}

/**
 * Compile the corpus. Returns diagnostics instead of throwing for any problem
 * a content author can fix.
 */
export async function compileCorpus(options: CompileOptions): Promise<CompileResult> {
  const corpus = await loadCorpus(options.contentDir);
  if (!corpus.ok) {
    return {
      ok: false,
      stats: undefined,
      corpusHash: corpus.corpusHash,
      atlasHash: corpus.atlasHash,
      builtAt: undefined,
      diagnostics: corpus.diagnostics,
      outputs: [],
    };
  }

  const builtAt = buildTimestamp(options.env ?? process.env);
  const targetDir = dirname(options.databasePath);
  await mkdir(targetDir, { recursive: true });

  const tempPath = join(targetDir, `.${randomBytes(8).toString('hex')}.db.tmp`);
  let db: DatabaseType | undefined;
  let stats: CompileStats;

  try {
    db = createDatabase(tempPath);
    db.exec('BEGIN');
    insertConcepts(db, corpus.concepts);
    insertCategories(db, corpus.concepts);
    insertRelationships(db, corpus.concepts);
    insertSources(db, corpus.concepts);
    insertFts(db, corpus.concepts);
    insertAtlas(db, corpus.atlas);
    insertUnresolvedReferences(db, corpus.concepts, corpus.atlas);
    insertClaims(db, corpus.concepts);
    writeBuildMeta(db, {
      corpusHash: corpus.corpusHash,
      atlasHash: corpus.atlasHash,
      builtAt,
      conceptCount: corpus.concepts.length,
      candidateCount: corpus.atlas.document.candidates.length,
    });
    db.exec('COMMIT');
    stats = collectStats(db);
    verifyDatabase(db, corpus.concepts, corpus.atlas, stats);
    db.close();
    db = undefined;

    // The rename is the only moment the live database changes, and on POSIX it
    // is atomic within a filesystem.
    await rename(tempPath, options.databasePath);
  } catch (error) {
    if (db !== undefined) {
      try {
        db.close();
      } catch {
        // Closing a database that failed to open is not itself an error.
      }
    }
    await rm(tempPath, { force: true });
    return {
      ok: false,
      stats: undefined,
      corpusHash: corpus.corpusHash,
      atlasHash: corpus.atlasHash,
      builtAt: undefined,
      diagnostics: [
        {
          file: '(compile)',
          field: 'database',
          message: error instanceof Error ? error.message : String(error),
        },
      ],
      outputs: [],
    };
  }

  // Derived artefacts are written only after the database is safely in place,
  // so a failed compilation can never leave a graph describing a corpus that
  // was never indexed.
  const outputs: string[] = [options.databasePath];
  if (options.graphJsonPath !== undefined || options.sidebarsPath !== undefined) {
    const readable = openDatabaseReadOnly(options.databasePath);
    try {
      if (options.graphJsonPath !== undefined) {
        const document = buildGraphDocument(readable, {
          builtAt,
          corpusHash: corpus.corpusHash,
          atlasHash: corpus.atlasHash,
        });
        await mkdir(dirname(options.graphJsonPath), { recursive: true });
        await writeFile(options.graphJsonPath, serializeGraph(document), 'utf8');
        outputs.push(options.graphJsonPath);
      }
      if (options.sidebarsPath !== undefined) {
        await mkdir(dirname(options.sidebarsPath), { recursive: true });
        await writeFile(options.sidebarsPath, buildSidebars(readable), 'utf8');
        outputs.push(options.sidebarsPath);
      }
    } finally {
      readable.close();
    }
  }

  return {
    ok: true,
    stats,
    corpusHash: corpus.corpusHash,
    atlasHash: corpus.atlasHash,
    builtAt,
    diagnostics: [],
    outputs,
  };
}
