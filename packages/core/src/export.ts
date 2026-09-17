/**
 * Exporting a comparison or a path (v2 runbook Q07).
 *
 * Two things happen here, and they are deliberately the same shape.
 *
 * A *saved* comparison or path is the whole structure, not a summary of it:
 * every concept id, every cell including the ones that are missing and why,
 * every review state, every source. Saving a lossy summary would mean the
 * researcher's record slowly stopped matching what they actually read.
 *
 * An *exported* one is that same structure rendered as Markdown a person can
 * paste into their own notes, with canonical page URLs and source URLs so the
 * evidence stays reachable from outside this product. Export reads; it never
 * writes anything but the export file, and never touches canonical content.
 */
import { z } from 'zod';
import { DOTTED_ID } from './schema.js';

/** Bumped only when the saved shape changes in a way a reader must notice. */
export const EXPORT_FORMAT_VERSION = 1;

const conceptId = z.string().regex(DOTTED_ID, 'must be a lowercase dotted identifier');
const shortText = z.string().max(400);
const timestamp = z.string().min(1).max(40);

/* -------------------------------------------------------------------------- */
/* The saved shapes                                                            */
/* -------------------------------------------------------------------------- */

export const missingReasonSchema = z.enum(['empty', 'no-section', 'no-article']);

const comparedConceptSchema = z.strictObject({
  conceptId,
  title: shortText,
  slug: z.string().max(200),
  kind: z.string().max(60),
  tier: z.number().int().min(1).max(3),
  reviewState: z.string().max(60),
  summary: z.string().max(4_000),
  format: z.string().max(40),
  hasArticle: z.boolean(),
  categories: z.array(z.string().max(300)).max(20),
  claimCount: z.number().int().min(0),
  sourceCount: z.number().int().min(0),
});

const comparisonCellSchema = z.strictObject({
  conceptId,
  value: z.string().max(40_000).nullable(),
  missing: missingReasonSchema.nullable(),
});

const comparisonRowSchema = z.strictObject({
  key: z.string().max(80),
  label: shortText,
  hint: z.string().max(400),
  cells: z.array(comparisonCellSchema).max(4),
});

const comparisonRelationshipSchema = z.strictObject({
  direction: z.enum(['outgoing', 'incoming']),
  type: z.string().max(60),
  otherId: conceptId,
  otherTitle: shortText,
  note: z.string().max(2_000).nullable(),
  condition: z.string().max(2_000).nullable(),
});

const comparisonSourceSchema = z.strictObject({
  sourceId: z.string().max(200),
  title: z.string().max(400),
  url: z.string().max(2_000),
  sourceKind: z.string().max(60),
  supports: z.array(z.string().max(80)).max(30),
  checkedOn: z.string().max(40),
  citedBy: z.array(conceptId).max(4),
});

export const comparisonSnapshotSchema = z.strictObject({
  concepts: z.array(comparedConceptSchema).min(2).max(4),
  rows: z.array(comparisonRowSchema).max(20),
  relationships: z.record(z.string(), z.array(comparisonRelationshipSchema).max(200)),
  between: z.array(comparisonRelationshipSchema).max(200),
  sources: z.array(comparisonSourceSchema).max(200),
  evidence: z.record(
    z.string(),
    z.strictObject({
      sources: z.number().int().min(0),
      claims: z.number().int().min(0),
      sectionsWithClaims: z.array(z.string().max(80)).max(30),
      reviewState: z.string().max(60),
    }),
  ),
  completeness: z.strictObject({
    cells: z.number().int().min(0),
    missing: z.number().int().min(0),
  }),
});
export type ComparisonSnapshot = z.infer<typeof comparisonSnapshotSchema>;

/** What the private store keeps when a comparison is saved. */
export const savedComparisonSchema = z.strictObject({
  conceptIds: z
    .array(conceptId)
    .min(2, 'a comparison needs at least two concepts')
    .max(4, 'a comparison holds at most four concepts'),
  builtAt: timestamp,
  comparison: comparisonSnapshotSchema,
  /** The optional synthesis, exactly as the API returned it. */
  synthesis: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type SavedComparison = z.infer<typeof savedComparisonSchema>;

const pathEdgeSchema = z.strictObject({
  beforeId: conceptId,
  afterId: conceptId,
  type: z.enum(['requires', 'prerequisite_of']),
  declaredBy: conceptId,
  note: z.string().max(2_000).nullable(),
  condition: z.string().max(2_000).nullable(),
});

const pathStepSchema = z.strictObject({
  conceptId,
  title: shortText,
  slug: z.string().max(200),
  hasArticle: z.boolean(),
  tier: z.number().int().min(1).max(3),
  reviewState: z.string().max(60),
  summary: z.string().max(4_000),
  position: z.number().int().min(1),
  because: pathEdgeSchema.nullable(),
  familiarity: z.enum(['unfamiliar', 'recognize', 'working', 'strong']).nullable(),
  likelyKnown: z.boolean(),
});

export const pathSnapshotSchema = z.strictObject({
  targetId: conceptId,
  targetTitle: shortText,
  reachable: z.boolean(),
  steps: z.array(pathStepSchema).max(200),
  startedFrom: z
    .array(
      z.strictObject({
        conceptId,
        title: shortText,
        reason: z.enum(['declared-known', 'familiarity-strong']),
      }),
    )
    .max(200),
  familiarityEffects: z
    .array(
      z.strictObject({
        conceptId,
        title: shortText,
        level: z.enum(['unfamiliar', 'recognize', 'working', 'strong']),
        effect: z.enum(['treated-as-known', 'marked-likely-known']),
      }),
    )
    .max(200),
  missing: z
    .array(z.strictObject({ conceptId, title: shortText, reason: z.string().max(1_000) }))
    .max(200),
  edges: z.array(pathEdgeSchema).max(400),
  truncated: z.boolean(),
});
export type PathSnapshot = z.infer<typeof pathSnapshotSchema>;

/** What the private store keeps when a path is saved. */
export const savedPathSchema = z.strictObject({
  targetConceptId: conceptId,
  knownConceptIds: z.array(conceptId).max(200).default([]),
  builtAt: timestamp,
  path: pathSnapshotSchema,
});
export type SavedPath = z.infer<typeof savedPathSchema>;

/* -------------------------------------------------------------------------- */
/* Rendering                                                                   */
/* -------------------------------------------------------------------------- */

export interface ExportOptions {
  /**
   * Where this corpus is served, so a canonical link still works when the
   * Markdown is read somewhere else. Trailing slashes are ignored.
   */
  readonly siteUrl?: string | undefined;
  /** Stamped into the file. Pass a fixed value to get a byte-identical export. */
  readonly exportedAt?: string | undefined;
}

const DEFAULT_SITE = 'http://127.0.0.1:3000';

const REVIEW_LABEL: Record<string, string> = {
  'generated-draft': 'Generated draft — written by an AI agent, not checked by a human',
  'source-checked': 'Source checked — a human checked each claim against the sources',
  'expert-reviewed': 'Expert reviewed',
  'formally-verified': 'Formally verified',
  'disputed-or-conditional': 'Disputed or conditional',
};

const MISSING_LABEL: Record<z.infer<typeof missingReasonSchema>, string> = {
  empty: 'MISSING — this page has the section and it is empty.',
  'no-section': 'MISSING — this page has no such section. A stub does not use the full template.',
  'no-article': 'MISSING — this is a graph-only identity: an address with no article behind it.',
};

function canonicalUrl(slug: string, options: ExportOptions): string {
  const base = (options.siteUrl ?? DEFAULT_SITE).replace(/\/+$/, '');
  return `${base}${slug.startsWith('/') ? slug : `/${slug}`}`;
}

function reviewPhrase(state: string): string {
  return REVIEW_LABEL[state] ?? `${state} — review state not recognised; treat as unverified`;
}

/** Escape the few characters that would break a Markdown table cell. */
function cellText(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function header(title: string, builtAt: string, options: ExportOptions): string[] {
  const lines = [`# ${title}`, ''];
  lines.push(
    `Exported from Knowledge Navigator${
      options.exportedAt === undefined ? '' : ` on ${options.exportedAt}`
    }. Built ${builtAt}.`,
  );
  lines.push('');
  lines.push(
    'Everything below is quoted from a local corpus of generated drafts. Nothing here is a citation of the underlying literature; the sources listed are what those pages cite.',
  );
  lines.push('');
  return lines;
}

export function renderComparisonMarkdown(
  saved: SavedComparison,
  options: ExportOptions = {},
): string {
  const { comparison } = saved;
  const titles = new Map(comparison.concepts.map((concept) => [concept.conceptId, concept.title]));
  const lines = header(
    `Comparison: ${comparison.concepts.map((concept) => concept.title).join(' vs ')}`,
    saved.builtAt,
    options,
  );

  lines.push('## What is being compared', '');
  lines.push('| Concept | Id | Tier | Review state | Sources | Claims | Page |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const concept of comparison.concepts) {
    lines.push(
      `| ${cellText(concept.title)} | \`${concept.conceptId}\` | ${String(concept.tier)} | ${cellText(
        reviewPhrase(concept.reviewState),
      )} | ${String(concept.sourceCount)} | ${String(concept.claimCount)} | ${
        concept.hasArticle ? canonicalUrl(concept.slug, options) : 'no article'
      } |`,
    );
  }
  lines.push('');
  lines.push(
    comparison.completeness.missing === 0
      ? `All ${String(comparison.completeness.cells)} cells are filled from the pages themselves.`
      : `${String(comparison.completeness.missing)} of ${String(
          comparison.completeness.cells,
        )} cells are missing. A missing cell is a gap in this corpus, not in the idea.`,
  );
  lines.push('');

  for (const row of comparison.rows) {
    lines.push(`## ${row.label}`, '', row.hint, '');
    for (const cell of row.cells) {
      lines.push(`### ${titles.get(cell.conceptId) ?? cell.conceptId}`, '');
      lines.push(cell.value === null ? MISSING_LABEL[cell.missing ?? 'empty'] : cell.value.trim());
      lines.push('');
    }
  }

  lines.push('## How they relate', '');
  if (comparison.between.length === 0) {
    lines.push('No page declares a relationship between these concepts.');
  } else {
    for (const edge of comparison.between) {
      lines.push(
        `- ${edge.type.replace(/_/g, ' ')} ${edge.direction === 'outgoing' ? 'to' : 'from'} ${
          edge.otherTitle
        } (\`${edge.otherId}\`)${edge.note === null ? '' : ` — ${edge.note}`}`,
      );
    }
  }
  lines.push('');

  lines.push('## Sources these pages cite', '');
  if (comparison.sources.length === 0) {
    lines.push('None of these pages cites a source. Treat every cell above as unverified.');
  } else {
    for (const source of comparison.sources) {
      lines.push(
        `- [${source.title}](${source.url}) — ${source.sourceKind}, checked ${
          source.checkedOn
        }. Cited by ${source.citedBy.map((id) => titles.get(id) ?? id).join(', ')}. \`${
          source.sourceId
        }\``,
      );
    }
  }
  lines.push('');

  if (saved.synthesis !== undefined && saved.synthesis !== null) {
    const answer = saved.synthesis['answer'];
    lines.push('## Generated synthesis', '');
    lines.push(
      'Written by a local model from the table above. It is not evidence, and it was kept only because the table it read is here too.',
      '',
    );
    lines.push(typeof answer === 'string' ? answer : JSON.stringify(saved.synthesis));
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderPathMarkdown(saved: SavedPath, options: ExportOptions = {}): string {
  const { path } = saved;
  const titles = new Map(path.steps.map((step) => [step.conceptId, step.title]));
  const lines = header(`Path to ${path.targetTitle}`, saved.builtAt, options);

  if (!path.reachable) {
    lines.push(
      `Nothing in this corpus declares a prerequisite for ${path.targetTitle} (\`${path.targetId}\`), so no route is recorded. Related concepts have deliberately not been arranged into one.`,
      '',
    );
  } else {
    lines.push(
      `${String(path.steps.length)} ${
        path.steps.length === 1 ? 'step' : 'steps'
      }, in reading order. Every step is here because a page declares it comes first.`,
      '',
    );
    for (const step of path.steps) {
      lines.push(
        `## ${String(step.position)}. ${step.title}`,
        '',
        `- Id: \`${step.conceptId}\``,
        `- Tier ${String(step.tier)} · ${reviewPhrase(step.reviewState)}`,
        step.hasArticle
          ? `- Page: ${canonicalUrl(step.slug, options)}`
          : '- Page: none. This is a graph-only identity: a stable address with no article.',
      );
      if (step.familiarity !== null) {
        lines.push(
          `- You recorded this as ${step.familiarity}${
            step.likelyKnown ? ' — probably a refresher rather than new ground' : ''
          }.`,
        );
      }
      lines.push('');
      if (step.summary !== '') lines.push(step.summary, '');
      lines.push(
        step.because === null
          ? 'This is the destination.'
          : `Comes before ${titles.get(step.because.afterId) ?? step.because.afterId}, because ${
              step.because.declaredBy === step.conceptId ? 'this page' : 'that page'
            } declares \`${step.because.type}\`${
              step.because.note === null ? '.' : ` — ${step.because.note}`
            }`,
      );
      lines.push('');
    }
  }

  if (path.startedFrom.length > 0) {
    lines.push('## Starting from what you already know', '');
    for (const item of path.startedFrom) {
      lines.push(
        `- ${item.title} (\`${item.conceptId}\`) — ${
          item.reason === 'declared-known'
            ? 'you said you know it'
            : 'you recorded strong familiarity with it'
        }.`,
      );
    }
    lines.push('');
  }

  if (path.familiarityEffects.length > 0) {
    lines.push('## What your own records changed', '');
    for (const effect of path.familiarityEffects) {
      lines.push(
        `- ${effect.title} (\`${effect.conceptId}\`) — ${effect.level}: ${
          effect.effect === 'treated-as-known'
            ? 'treated as a starting point, so it is not a step'
            : 'kept as a step and marked likely known'
        }.`,
      );
    }
    lines.push('');
  }

  if (path.missing.length > 0) {
    lines.push('## What the graph does not say', '');
    for (const item of path.missing) {
      lines.push(`- ${item.title} (\`${item.conceptId}\`) — ${item.reason}`);
    }
    lines.push('');
  }

  if (path.truncated) {
    lines.push(
      'This route was cut short: the chain of prerequisites is longer than a route this product will draw.',
      '',
    );
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/* -------------------------------------------------------------------------- */
/* Naming                                                                      */
/* -------------------------------------------------------------------------- */

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export'
  );
}

/**
 * A file name that says what the export is without needing to be opened, and
 * that cannot escape its directory: only lowercase letters, digits and dashes.
 */
export function exportFileName(kind: 'comparison' | 'path', name: string, id: string): string {
  return `${kind}-${slugify(name)}-${slugify(id).slice(0, 8)}.md`;
}

/** Render whichever kind this saved item is. Throws if the payload is not one. */
export function renderSavedItemMarkdown(
  itemType: string,
  payload: unknown,
  options: ExportOptions = {},
): string {
  if (itemType === 'comparison') {
    return renderComparisonMarkdown(savedComparisonSchema.parse(payload), options);
  }
  if (itemType === 'path') {
    return renderPathMarkdown(savedPathSchema.parse(payload), options);
  }
  throw new Error(
    `only a comparison or a path can be exported as Markdown; this item is a ${itemType}`,
  );
}
