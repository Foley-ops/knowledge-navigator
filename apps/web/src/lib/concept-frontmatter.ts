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

export interface ConceptClaimEvidence {
  readonly source_id: string;
  readonly locator: string;
  readonly note?: string;
}

export interface ConceptClaim {
  readonly claim_id: string;
  readonly section: string;
  readonly statement: string;
  readonly status: string;
  readonly evidence: readonly ConceptClaimEvidence[];
}

export interface ConceptUnresolvedReference {
  readonly label: string;
  readonly reason: string;
  readonly sections: readonly string[];
  readonly blocking: boolean;
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
  readonly claims: readonly ConceptClaim[];
  readonly unresolved_references: readonly ConceptUnresolvedReference[];
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

const CLAIM_STATUSES = ['supported', 'conditional', 'disputed', 'unsupported'];

function claims(value: unknown): ConceptClaim[] {
  if (!Array.isArray(value)) return [];
  const out: ConceptClaim[] = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const claimId = str(record['claim_id']);
    const statement = str(record['statement']);
    const status = str(record['status']);
    // An unrecognised status would be rendered as if it meant something, so a
    // claim that does not declare one of the four is dropped rather than shown.
    if (claimId === undefined || statement === undefined || status === undefined) continue;
    if (!CLAIM_STATUSES.includes(status)) continue;

    const evidence: ConceptClaimEvidence[] = [];
    if (Array.isArray(record['evidence'])) {
      for (const rawEvidence of record['evidence']) {
        if (rawEvidence === null || typeof rawEvidence !== 'object') continue;
        const item = rawEvidence as Record<string, unknown>;
        const sourceId = str(item['source_id']);
        const locator = str(item['locator']);
        if (sourceId === undefined || locator === undefined) continue;
        const note = str(item['note']);
        evidence.push({
          source_id: sourceId,
          locator,
          ...(note === undefined ? {} : { note }),
        });
      }
    }

    out.push({
      claim_id: claimId,
      section: str(record['section']) ?? '',
      statement,
      status,
      evidence,
    });
  }
  return out;
}

function unresolvedReferences(value: unknown): ConceptUnresolvedReference[] {
  if (!Array.isArray(value)) return [];
  const out: ConceptUnresolvedReference[] = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const label = str(record['label']);
    const reason = str(record['reason']);
    if (label === undefined || reason === undefined) continue;
    out.push({
      label,
      reason,
      sections: strings(record['sections']),
      blocking: record['blocking'] === true,
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
    claims: claims(record['claims']),
    unresolved_references: unresolvedReferences(record['unresolved_references']),
  };
}

/** Plain words for a claim status, and what it commits the page to. */
export function claimStatusInfo(status: string): { label: string; meaning: string } {
  const info: Record<string, { label: string; meaning: string }> = {
    supported: {
      label: 'Supported',
      meaning: 'The cited evidence says this.',
    },
    conditional: {
      label: 'Conditional',
      meaning: 'It holds, but only under the stated condition.',
    },
    disputed: {
      label: 'Disputed',
      meaning: 'Sources disagree, and both are cited.',
    },
    unsupported: {
      label: 'Unsupported',
      meaning: 'Stated deliberately with no evidence behind it. Nobody has checked this.',
    },
  };
  return info[status] ?? { label: status, meaning: 'Unrecognised status. Treat it as unchecked.' };
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
