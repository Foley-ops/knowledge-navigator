/**
 * Claims and evidence locators (v2 runbook K05, contract §4.4).
 *
 * The rule that matters most: claim-level evidence is optional for a
 * generated draft — the eleven v1 pages predate it and stay valid — and
 * mandatory the moment a human raises a page above generated-draft, because
 * that promotion IS the assertion that each statement was checked.
 */
import { describe, expect, it } from 'vitest';
import { claimStatuses, parseFrontmatter, promotedReviewStates } from '../src/schema.js';
import { nonEmptySectionKeys, splitSections } from '../src/sections.js';
import { TIER_1_HEADINGS } from '../src/headings.js';
import { validateCorpus } from '../src/validate.js';
import { loadConceptFromText } from '../src/loader.js';
import { conceptMarkdown, tier1Body } from './fixtures.js';

const SOURCE = {
  source_id: 'paper.resnet.2015',
  title: 'Deep Residual Learning for Image Recognition',
  url: 'https://arxiv.org/abs/1512.03385',
  source_kind: 'preprint',
  supports: ['history-and-attribution'],
  checked_on: '2026-09-16',
};

const BASE = {
  concept_id: 'concept.deep_learning.resnet',
  title: 'ResNet',
  slug: '/concepts/resnet',
  aliases: [],
  kind: 'method',
  tier: 1,
  review_state: 'generated-draft',
  summary: 'A convolutional architecture built from residual blocks.',
  categories: ['Artificial Intelligence/Deep Learning — Architectures'],
  primary_category: 'Artificial Intelligence/Deep Learning — Architectures',
  relationships: [],
  sources: [SOURCE],
};

const CLAIM = {
  claim_id: 'claim.resnet.degradation_problem',
  section: 'history-and-attribution',
  statement:
    'Plain residual networks became harder to optimize as depth increased even when training error was measured.',
  status: 'supported',
  evidence: [
    {
      source_id: 'paper.resnet.2015',
      locator: 'Section 4.1, Figure 4',
      note: 'Training-error comparison for plain networks.',
    },
  ],
};

function parse(claims: unknown, patch: Record<string, unknown> = {}) {
  return parseFrontmatter({ ...BASE, ...patch, claims });
}

function issueText(claims: unknown, patch: Record<string, unknown> = {}): string {
  return parse(claims, patch)
    .issues.map((issue) => `${issue.path}: ${issue.message}`)
    .join(' | ');
}

describe('a valid claim', () => {
  it('parses with every field', () => {
    const result = parse([CLAIM]);
    expect(result.issues).toEqual([]);
    expect(result.value?.claims[0]).toEqual(CLAIM);
  });

  it('defaults to an empty list', () => {
    expect(parseFrontmatter(BASE).value?.claims).toEqual([]);
  });

  it('accepts supported, conditional and disputed with evidence', () => {
    for (const status of ['supported', 'conditional', 'disputed'] as const) {
      const result = parse([{ ...CLAIM, status }]);
      expect(result.issues, status).toEqual([]);
      expect(result.value?.claims[0]?.status).toBe(status);
    }
  });

  it('accepts unsupported with no evidence at all', () => {
    const result = parse([{ ...CLAIM, status: 'unsupported', evidence: [] }]);
    expect(result.issues).toEqual([]);
    expect(result.value?.claims[0]?.evidence).toEqual([]);
  });

  it('exposes exactly the four statuses from the contract', () => {
    expect([...claimStatuses]).toEqual(['supported', 'conditional', 'disputed', 'unsupported']);
  });

  it('allows evidence with no note', () => {
    expect(
      parse([{ ...CLAIM, evidence: [{ source_id: 'paper.resnet.2015', locator: 'Table 4' }] }])
        .issues,
    ).toEqual([]);
  });
});

describe('malformed claims', () => {
  it('rejects a claim_id that is not a dotted identifier', () => {
    expect(issueText([{ ...CLAIM, claim_id: 'Degradation Problem' }])).toContain(
      'must be a lowercase dotted identifier',
    );
  });

  it('rejects a section outside the template vocabulary', () => {
    expect(issueText([{ ...CLAIM, section: 'further-reading' }])).toContain('claims.0.section');
  });

  it('rejects a missing statement', () => {
    const { statement: _statement, ...rest } = CLAIM;
    expect(issueText([rest])).toContain('claims.0.statement');
  });

  it('rejects a status outside the enumeration', () => {
    expect(issueText([{ ...CLAIM, status: 'probably' }])).toContain('claims.0.status');
  });

  it('rejects an unknown key', () => {
    expect(issueText([{ ...CLAIM, confidence: 'high' }])).toContain('unknown key "confidence"');
  });

  it('rejects an evidence entry with no locator', () => {
    expect(issueText([{ ...CLAIM, evidence: [{ source_id: 'paper.resnet.2015' }] }])).toContain(
      'claims.0.evidence.0.locator',
    );
  });
});

describe('status and evidence must agree', () => {
  for (const status of ['supported', 'conditional', 'disputed'] as const) {
    it(`rejects ${status} with no evidence`, () => {
      expect(issueText([{ ...CLAIM, status, evidence: [] }])).toContain(
        'must cite at least one piece of evidence',
      );
    });
  }

  it('rejects unsupported that cites evidence anyway', () => {
    expect(issueText([{ ...CLAIM, status: 'unsupported' }])).toContain(
      'is marked unsupported but cites evidence',
    );
  });
});

describe('evidence must point at a source this page cites', () => {
  it('rejects a source_id absent from sources', () => {
    expect(
      issueText([{ ...CLAIM, evidence: [{ source_id: 'paper.vgg.2014', locator: 'Section 2' }] }]),
    ).toContain("is not listed in this page's sources");
  });

  it('rejects a page with no sources at all', () => {
    expect(issueText([CLAIM], { sources: [] })).toContain("is not listed in this page's sources");
  });

  it('lets one source support several claims', () => {
    const result = parse([
      CLAIM,
      {
        ...CLAIM,
        claim_id: 'claim.resnet.identity_shortcut',
        section: 'definition',
        statement: 'A residual block adds its input to the output of its stacked layers.',
        evidence: [{ source_id: 'paper.resnet.2015', locator: 'Section 3.1' }],
      },
    ]);
    expect(result.issues).toEqual([]);
    expect(result.value?.claims).toHaveLength(2);
  });

  it('rejects the same source cited twice at the same locator on one claim', () => {
    expect(
      issueText([
        {
          ...CLAIM,
          evidence: [
            { source_id: 'paper.resnet.2015', locator: 'Section 4.1' },
            { source_id: 'paper.resnet.2015', locator: 'Section 4.1' },
          ],
        },
      ]),
    ).toContain('twice');
  });
});

describe('duplicate claim ids', () => {
  it('rejects two claims with the same id on one page', () => {
    expect(issueText([CLAIM, { ...CLAIM, section: 'definition' }])).toContain(
      'duplicate claim_id claim.resnet.degradation_problem on this page',
    );
  });

  it('rejects the same claim id on two different pages', () => {
    const one = page({ claims: [CLAIM] });
    const two = page({
      conceptId: 'concept.deep_learning.vgg',
      title: 'VGG',
      slug: '/concepts/vgg',
      fileName: 'vgg.md',
      claims: [CLAIM],
    });
    const found = corpus(one, two);
    expect(found.filter((d) => d.message.includes('duplicate claim_id'))).toHaveLength(2);
    expect(found.map((d) => d.file).sort()).toContain('vgg.md');
  });
});

/* -------------------------------------------------------------------------- */
/* Review promotion                                                            */
/* -------------------------------------------------------------------------- */

interface PageOptions {
  readonly conceptId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly fileName?: string;
  readonly reviewState?: string;
  readonly tier?: number;
  readonly claims?: unknown[];
  readonly body?: string;
}

/** Build a loaded page with claims in its frontmatter. */
function page(options: PageOptions = {}) {
  const {
    conceptId = 'concept.deep_learning.resnet',
    title = 'ResNet',
    slug = '/concepts/resnet',
    fileName = 'resnet.md',
    reviewState = 'generated-draft',
    tier = 1,
    claims = [],
    body = tier1Body(),
  } = options;

  const markdown = conceptMarkdown({
    conceptId,
    title,
    slug,
    aliases: [],
    kind: 'method',
    tier,
    reviewState,
    categories: ['Artificial Intelligence/Deep Learning — Architectures'],
    relationships: [{ type: 'contrasts_with', target: 'concept.deep_learning.pooling' }],
    sources: [
      {
        id: SOURCE.source_id,
        title: SOURCE.title,
        url: SOURCE.url,
        kind: SOURCE.source_kind,
        supports: SOURCE.supports,
        checkedOn: SOURCE.checked_on,
      },
    ],
    body,
  }).replace(
    '---\n\n',
    `claims:\n${claims.map((claim) => yamlClaim(claim as Record<string, unknown>)).join('')}---\n\n`,
  );

  const result = loadConceptFromText(
    claims.length === 0 ? markdown.replace('claims:\n', '') : markdown,
    fileName,
  );
  if (!result.ok || result.concept === undefined) {
    throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join('; '));
  }
  return result.concept;
}

/**
 * The page every fixture relates to, so the relationship target exists and the
 * corpus connectivity rule is satisfied. It carries no claims of its own.
 */
const POOLING = (() => {
  const markdown = conceptMarkdown({
    conceptId: 'concept.deep_learning.pooling',
    title: 'Pooling',
    slug: '/concepts/pooling',
    aliases: [],
    kind: 'method',
    categories: ['Artificial Intelligence/Deep Learning — Architectures'],
    relationships: [],
    sources: [
      {
        id: SOURCE.source_id,
        title: SOURCE.title,
        url: SOURCE.url,
        kind: SOURCE.source_kind,
        supports: SOURCE.supports,
        checkedOn: SOURCE.checked_on,
      },
    ],
  });
  const result = loadConceptFromText(markdown, 'pooling.md');
  if (!result.ok || result.concept === undefined) {
    throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join('; '));
  }
  return result.concept;
})();

/** Validate the given pages together with the shared partner page. */
function corpus(...pages: ReturnType<typeof page>[]) {
  return validateCorpus([POOLING, ...pages]);
}

function yamlClaim(claim: Record<string, unknown>): string {
  const evidence = (claim['evidence'] ?? []) as { source_id: string; locator: string }[];
  const lines = [
    `  - claim_id: ${String(claim['claim_id'])}`,
    `    section: ${String(claim['section'])}`,
    `    statement: ${JSON.stringify(String(claim['statement']))}`,
    `    status: ${String(claim['status'])}`,
  ];
  if (evidence.length > 0) {
    lines.push('    evidence:');
    for (const item of evidence) {
      lines.push(`      - source_id: ${item.source_id}`);
      lines.push(`        locator: ${JSON.stringify(item.locator)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

describe('promoting a page above generated-draft', () => {
  const claimsForEverySection = TIER_1_HEADINGS.filter(
    (heading) => heading !== 'Sources' && heading !== 'Prerequisites and next connections',
  ).map((heading, index) => ({
    claim_id: `claim.resnet.s${String(index)}`,
    section: heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    statement: `A checked statement for ${heading}.`,
    status: 'supported',
    evidence: [{ source_id: SOURCE.source_id, locator: `Section ${String(index + 1)}` }],
  }));

  it('leaves a generated draft with no claims valid', () => {
    expect(corpus(page({ claims: [] }))).toEqual([]);
  });

  for (const state of promotedReviewStates) {
    it(`requires a claim for every substantive section at ${state}`, () => {
      const found = corpus(page({ reviewState: state, claims: [CLAIM] }));
      const missing = found.filter((d) => d.field.startsWith('claims:'));
      // Ten substantive sections; the fixture covers history-and-attribution.
      expect(missing).toHaveLength(9);
      expect(missing[0]?.message).toContain(`review_state ${state} requires at least one claim`);
      expect(found.every((d) => d.file === 'resnet.md')).toBe(true);
    });
  }

  it('accepts a promoted page that covers every substantive section', () => {
    expect(corpus(page({ reviewState: 'source-checked', claims: claimsForEverySection }))).toEqual(
      [],
    );
  });

  it('ignores a section that has a heading but no prose', () => {
    const emptyIntuition = TIER_1_HEADINGS.map((heading) =>
      heading === 'Intuition' ? `## ${heading}\n` : `## ${heading}\n\nProse for ${heading}.\n`,
    ).join('\n');
    const found = corpus(
      page({
        reviewState: 'source-checked',
        claims: claimsForEverySection.filter((claim) => claim.section !== 'intuition'),
        body: emptyIntuition,
      }),
    );
    expect(found).toEqual([]);
  });

  it('requires at least one claim on a promoted Tier 2 page', () => {
    const tier2 = page({
      reviewState: 'source-checked',
      tier: 2,
      claims: [],
      body: '\nA short definition paragraph.\n',
    });
    const found = corpus(tier2);
    expect(found.map((d) => d.message).join(' ')).toContain('requires at least one claim');
  });
});

/* -------------------------------------------------------------------------- */
/* Section splitting                                                           */
/* -------------------------------------------------------------------------- */

describe('section splitting', () => {
  it('splits a Tier 1 body into its twelve sections', () => {
    const sections = splitSections(tier1Body());
    expect(sections).toHaveLength(12);
    expect(sections.map((section) => section.heading)).toEqual([...TIER_1_HEADINGS]);
    expect(sections[0]?.key).toBe('definition');
  });

  it('reports only the ten substantive sections as claimable', () => {
    const keys = nonEmptySectionKeys(tier1Body());
    expect(keys.size).toBe(10);
    expect(keys.has('definition')).toBe(true);
    expect([...keys]).not.toContain('sources');
  });

  it('does not mistake a heading inside a code fence for a section', () => {
    const body = '## Definition\n\n```markdown\n## Not a heading\n```\n\n## Intuition\n\nProse.\n';
    expect(splitSections(body).map((section) => section.heading)).toEqual([
      'Definition',
      'Intuition',
    ]);
    expect(splitSections(body)[0]?.content).toContain('## Not a heading');
  });

  it('treats a heading with no prose as empty', () => {
    expect(nonEmptySectionKeys('## Definition\n\n## Intuition\n\nProse.\n')).toEqual(
      new Set(['intuition']),
    );
  });
});
