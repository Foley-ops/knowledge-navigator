/**
 * Compile the canonical corpus into the disposable index (runbook D00–D07).
 *
 * Compilation is atomic: everything is written to a temporary path, verified,
 * closed, and only then renamed over the target. A failed build never replaces
 * a working database.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Database as DatabaseType } from 'better-sqlite3';
import { SCHEMA_VERSION, buildTimestamp, createDatabase } from './db.js';
import { categorySegments, categoryTopLevel, compareStrings, normalizeName } from './normalize.js';
import { loadCorpus } from './validate.js';
import type { Diagnostic } from './validate.js';
import type { LoadedConcept } from './loader.js';
import type { Source } from './schema.js';

export interface CompileOptions {
  /** Directory holding canonical Markdown. */
  readonly contentDir: string;
  /** Final location of the compiled database. */
  readonly databasePath: string;
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
}

export type CompileResult =
  | {
      readonly ok: true;
      readonly stats: CompileStats;
      readonly corpusHash: string;
      readonly builtAt: string;
      readonly diagnostics: readonly Diagnostic[];
    }
  | {
      readonly ok: false;
      readonly stats: undefined;
      readonly corpusHash: string | undefined;
      readonly builtAt: undefined;
      readonly diagnostics: readonly Diagnostic[];
    };

const EMPTY_STATS: CompileStats = {
  concepts: 0,
  aliases: 0,
  categories: 0,
  conceptCategories: 0,
  relationships: 0,
  sources: 0,
  conceptSources: 0,
  ftsRows: 0,
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
      summary, body, plain_text, content_hash, primary_category
    ) VALUES (
      @id, @title, @slug, @file_name, @source_path, @kind, @tier, @review_state,
      @summary, @body, @plain_text, @content_hash, @primary_category
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
      source_path: `content/concepts/${concept.fileName}`,
      kind: fm.kind,
      tier: fm.tier,
      review_state: fm.review_state,
      summary: fm.summary,
      body: concept.body,
      plain_text: concept.plainText,
      content_hash: concept.contentHash,
      primary_category: fm.primary_category,
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
      insertLink.run(
        fm.concept_id,
        categoryId,
        category === fm.primary_category ? 1 : 0,
        position,
      );
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

/** Record the facts a reader needs to know which corpus this index came from. */
function writeBuildMeta(
  db: DatabaseType,
  meta: { corpusHash: string; builtAt: string; conceptCount: number },
): void {
  const insert = db.prepare('INSERT INTO build_meta (key, value) VALUES (?, ?)');
  const rows: [string, string][] = [
    ['schema_version', String(SCHEMA_VERSION)],
    ['corpus_hash', meta.corpusHash],
    ['built_at', meta.builtAt],
    ['concept_count', String(meta.conceptCount)],
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
  };
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
      builtAt: undefined,
      diagnostics: corpus.diagnostics,
    };
  }

  const builtAt = buildTimestamp(options.env ?? process.env);
  const targetDir = dirname(options.databasePath);
  await mkdir(targetDir, { recursive: true });

  const tempPath = join(targetDir, `.${randomBytes(8).toString('hex')}.db.tmp`);
  let db: DatabaseType | undefined;
  let stats: CompileStats = EMPTY_STATS;

  try {
    db = createDatabase(tempPath);
    db.exec('BEGIN');
    insertConcepts(db, corpus.concepts);
    insertCategories(db, corpus.concepts);
    insertRelationships(db, corpus.concepts);
    insertSources(db, corpus.concepts);
    writeBuildMeta(db, {
      corpusHash: corpus.corpusHash,
      builtAt,
      conceptCount: corpus.concepts.length,
    });
    db.exec('COMMIT');
    stats = collectStats(db);
    db.close();
    db = undefined;

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
      builtAt: undefined,
      diagnostics: [
        {
          file: '(compile)',
          field: 'database',
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  return { ok: true, stats, corpusHash: corpus.corpusHash, builtAt, diagnostics: [] };
}
