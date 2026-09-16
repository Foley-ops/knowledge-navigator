import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConceptFile, loadConceptFromText } from '../src/loader.js';

const FRONTMATTER = `---
concept_id: concept.analysis.convolution
title: Convolution
slug: /concepts/convolution
aliases:
  - convolution operator
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: An operation combining two functions by sliding one across the other.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: contrasts_with
    target: concept.analysis.cross_correlation
    note: The two differ by a reflection of one argument.
sources:
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
    checked_on: 2026-09-16
---
`;

const BODY = `
## Definition

Convolution combines two functions, written $(f * g)(t)$, by sliding one across
the other. See [Cross-Correlation](./cross-correlation.md) for the contrast.

$$
(f * g)(t) = \\int_{-\\infty}^{\\infty} f(\\tau)\\, g(t - \\tau)\\, d\\tau
$$

## Concrete example

A discrete kernel applied to a signal:

\`\`\`python
def convolve(signal, kernel):
    return [sum(signal[n - k] * kernel[k] for k in range(len(kernel)))
            for n in range(len(signal))]
\`\`\`

The term \`stride\` appears inline.
`;

const VALID = FRONTMATTER + BODY;

describe('loading one canonical concept file', () => {
  it('returns validated metadata, body, plain text, headings, links and a hash', () => {
    const result = loadConceptFromText(VALID, 'convolution.md');
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    const concept = result.concept!;

    expect(concept.fileName).toBe('convolution.md');
    expect(concept.frontmatter.concept_id).toBe('concept.analysis.convolution');
    expect(concept.frontmatter.tier).toBe(1);
    expect(concept.body.startsWith('\n## Definition')).toBe(true);
    expect(concept.body).not.toContain('concept_id:');

    expect(concept.headings).toEqual([
      { depth: 2, text: 'Definition' },
      { depth: 2, text: 'Concrete example' },
    ]);

    expect(concept.links).toHaveLength(1);
    expect(concept.links[0]?.url).toBe('./cross-correlation.md');
    expect(concept.links[0]?.text).toBe('Cross-Correlation');
    expect(concept.links[0]?.line).toBeGreaterThan(0);

    expect(concept.rawHtml).toEqual([]);
    expect(concept.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes the newline-normalised file so the hash is platform-stable', () => {
    const unix = loadConceptFromText(VALID, 'convolution.md');
    const windows = loadConceptFromText(VALID.replace(/\n/g, '\r\n'), 'convolution.md');
    expect(windows.concept?.contentHash).toBe(unix.concept?.contentHash);
    expect(unix.concept?.contentHash).toBe(
      createHash('sha256').update(VALID, 'utf8').digest('hex'),
    );
  });

  it('extracts prose but not LaTeX notation into the searchable body', () => {
    const { plainText } = loadConceptFromText(VALID, 'convolution.md').concept!;
    expect(plainText).toContain('Convolution combines two functions');
    expect(plainText).toContain('Cross-Correlation');
    expect(plainText).toContain('stride');
    expect(plainText).not.toContain('\\int');
    expect(plainText).not.toContain('\\tau');
  });

  it('treats a fenced code block as data: its text is captured, never executed', () => {
    const { plainText, headings } = loadConceptFromText(VALID, 'convolution.md').concept!;
    expect(plainText).toContain('def convolve(signal, kernel)');
    // The fence contains a `#`-free body; nothing inside it became a heading,
    // a link, or metadata.
    expect(headings.map((h) => h.text)).not.toContain('convolve');
  });

  it('does not let a code fence containing frontmatter-shaped text become metadata', () => {
    const hostile =
      FRONTMATTER +
      '\n## Definition\n\nText.\n\n```yaml\n---\nconcept_id: concept.evil.injected\nreview_state: expert-reviewed\n---\n```\n';
    const result = loadConceptFromText(hostile, 'convolution.md');
    expect(result.ok).toBe(true);
    expect(result.concept?.frontmatter.concept_id).toBe('concept.analysis.convolution');
    expect(result.concept?.frontmatter.review_state).toBe('generated-draft');
    expect(result.concept?.plainText).toContain('concept.evil.injected');
  });

  it('records raw HTML as data rather than interpreting it', () => {
    const withHtml = FRONTMATTER + '\n## Definition\n\n<script>alert(1)</script>\n\nText.\n';
    const result = loadConceptFromText(withHtml, 'convolution.md');
    expect(result.ok).toBe(true);
    expect(result.concept?.rawHtml.join('')).toContain('<script>');
    expect(result.concept?.plainText).not.toContain('<script>');
  });

  it('rejects a file with no frontmatter block', () => {
    const result = loadConceptFromText('# Convolution\n\nJust prose.\n', 'convolution.md');
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('(frontmatter)');
    expect(result.issues[0]?.message).toContain('YAML frontmatter block');
  });

  it('rejects a file whose frontmatter block is never closed', () => {
    const result = loadConceptFromText('---\ntitle: Convolution\n\n## Definition\n', 'x.md');
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('(frontmatter)');
  });

  it('rejects an empty frontmatter block', () => {
    const result = loadConceptFromText('---\n---\n\n## Definition\n', 'x.md');
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.message).toContain('empty');
  });

  it('rejects invalid YAML without throwing', () => {
    const result = loadConceptFromText('---\ntitle: "unterminated\n---\n\nBody\n', 'x.md');
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('(frontmatter)');
    expect(result.issues[0]?.message).toContain('YAML could not be parsed');
  });

  it('rejects YAML duplicate keys', () => {
    const result = loadConceptFromText(
      '---\ntitle: One\ntitle: Two\n---\n\nBody\n',
      'x.md',
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('(frontmatter)');
  });

  it('refuses YAML alias expansion', () => {
    const result = loadConceptFromText(
      '---\na: &big [x, x, x]\nb: *big\n---\n\nBody\n',
      'x.md',
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('(frontmatter)');
  });

  it('keeps an unquoted ISO date a string rather than a Date object', () => {
    const result = loadConceptFromText(VALID, 'convolution.md');
    expect(result.concept?.frontmatter.sources[0]?.checked_on).toBe('2026-09-16');
    expect(typeof result.concept?.frontmatter.sources[0]?.checked_on).toBe('string');
  });

  it('rejects metadata that parses as YAML but breaks the contract', () => {
    const result = loadConceptFromText(
      VALID.replace('tier: 1', 'tier: 7').replace('kind: mathematical-object', 'kind: widget'),
      'convolution.md',
    );
    expect(result.ok).toBe(false);
    const paths = result.issues.map((issue) => issue.path);
    expect(paths).toContain('tier');
    expect(paths).toContain('kind');
  });

  it('rejects frontmatter that is not a mapping', () => {
    const result = loadConceptFromText('---\n- one\n- two\n---\n\nBody\n', 'x.md');
    expect(result.ok).toBe(false);
  });
});

describe('loading from disk', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'navigator-loader-'));
    await writeFile(join(dir, 'convolution.md'), VALID, 'utf8');
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads a valid file and reports its absolute path', async () => {
    const absolute = join(dir, 'convolution.md');
    const result = await loadConceptFile(absolute, 'convolution.md');
    expect(result.ok).toBe(true);
    expect(result.concept?.absolutePath).toBe(absolute);
    expect(result.concept?.fileName).toBe('convolution.md');
  });

  it('reports an unreadable file as an issue rather than throwing', async () => {
    const result = await loadConceptFile(join(dir, 'missing.md'), 'missing.md');
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('(file)');
  });
});
