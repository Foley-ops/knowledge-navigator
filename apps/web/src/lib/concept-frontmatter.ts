/**
 * Read a concept page's frontmatter.
 *
 * Frontmatter arrives from Markdown and is treated as untrusted data: every
 * field is checked before it is rendered, and anything unrecognised is simply
 * not shown rather than guessed at.
 */
export interface ConceptRelationship {
  readonly type: string;
  readonly target: string;
  readonly note?: string;
  readonly condition?: string;
}

export interface ConceptSource {
  readonly source_id: string;
  readonly title: string;
  readonly url: string;
  readonly source_kind: string;
  readonly supports: readonly string[];
  readonly checked_on: string;
}

export interface ConceptFrontmatter {
  readonly concept_id: string;
  readonly title: string;
  readonly slug: string;
  readonly aliases: readonly string[];
  readonly kind: string;
  readonly tier: number;
  readonly review_state: string;
  readonly summary: string;
  readonly categories: readonly string[];
  readonly primary_category: string;
  readonly relationships: readonly ConceptRelationship[];
  readonly sources: readonly ConceptSource[];
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function relationships(value: unknown): ConceptRelationship[] {
  if (!Array.isArray(value)) return [];
  const out: ConceptRelationship[] = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const type = str(record['type']);
    const target = str(record['target']);
    if (type === undefined || target === undefined) continue;
    const note = str(record['note']);
    const condition = str(record['condition']);
    out.push({
      type,
      target,
      ...(note === undefined ? {} : { note }),
      ...(condition === undefined ? {} : { condition }),
    });
  }
  return out;
}

function sources(value: unknown): ConceptSource[] {
  if (!Array.isArray(value)) return [];
  const out: ConceptSource[] = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const sourceId = str(record['source_id']);
    const title = str(record['title']);
    const url = str(record['url']);
    // Only http(s) links are rendered; anything else is dropped rather than
    // turned into a link the reader cannot judge.
    if (sourceId === undefined || title === undefined || url === undefined) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    out.push({
      source_id: sourceId,
      title,
      url,
      source_kind: str(record['source_kind']) ?? 'unknown',
      supports: strings(record['supports']),
      checked_on: str(record['checked_on']) ?? '',
    });
  }
  return out;
}

/** Returns undefined when the page is not a canonical concept page. */
export function readConceptFrontmatter(raw: unknown): ConceptFrontmatter | undefined {
  if (raw === null || typeof raw !== 'object') return undefined;
  const record = raw as Record<string, unknown>;
  const conceptId = str(record['concept_id']);
  const title = str(record['title']);
  const slug = str(record['slug']);
  if (conceptId === undefined || title === undefined || slug === undefined) return undefined;

  const tier = typeof record['tier'] === 'number' ? record['tier'] : 0;
  const categories = strings(record['categories']);
  return {
    concept_id: conceptId,
    title,
    slug,
    aliases: strings(record['aliases']),
    kind: str(record['kind']) ?? 'concept',
    tier,
    review_state: str(record['review_state']) ?? '',
    summary: str(record['summary']) ?? '',
    categories,
    primary_category: str(record['primary_category']) ?? categories[0] ?? '',
    relationships: relationships(record['relationships']),
    sources: sources(record['sources']),
  };
}

/** Human wording for a relationship type, in the direction it is declared. */
export function relationshipPhrase(type: string): string {
  const phrases: Record<string, string> = {
    requires: 'requires',
    prerequisite_of: 'is a prerequisite of',
    generalizes: 'generalises',
    specializes: 'specialises',
    variant_of: 'is a variant of',
    equivalent_under: 'is equivalent under',
    contrasts_with: 'contrasts with',
    approximates: 'approximates',
    implements: 'implements',
    used_to_solve: 'is used to solve',
    useful_when: 'is useful when',
    unreliable_when: 'is unreliable when',
    assumes: 'assumes',
    guarantees: 'guarantees',
    mitigates: 'mitigates',
    contributes_to: 'contributes to',
    introduced_by: 'was introduced by',
    supported_by: 'is supported by',
    challenged_by: 'is challenged by',
    refined_by: 'is refined by',
    belongs_to_category: 'belongs to category',
  };
  return phrases[type] ?? type;
}
