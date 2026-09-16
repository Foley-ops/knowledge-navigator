import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCorpus, validateCorpus } from '../src/validate.js';
import type { Diagnostic } from '../src/validate.js';
import { conceptMarkdown, loadFixture, tier1Body } from './fixtures.js';
import type { FixtureOptions } from './fixtures.js';

const CONVOLUTION: FixtureOptions = {
  conceptId: 'concept.analysis.convolution',
  title: 'Convolution',
  slug: '/concepts/convolution',
  aliases: ['convolution operator'],
  relationships: [{ type: 'contrasts_with', target: 'concept.analysis.cross_correlation' }],
};

const CROSS_CORRELATION: FixtureOptions = {
  conceptId: 'concept.analysis.cross_correlation',
  title: 'Cross-Correlation',
  slug: '/concepts/cross-correlation',
  aliases: ['sliding inner product'],
  relationships: [{ type: 'requires', target: 'concept.analysis.convolution' }],
};

function pair(a: FixtureOptions = {}, b: FixtureOptions = {}) {
  return [
    loadFixture('convolution.md', { ...CONVOLUTION, ...a }),
    loadFixture('cross-correlation.md', { ...CROSS_CORRELATION, ...b }),
  ];
}

const fields = (diagnostics: readonly Diagnostic[]): string[] =>
  diagnostics.map((d) => `${d.file}#${d.field}`);

/**
 * Some corpus-level failures cannot be authored at all, because the frontmatter
 * schema rejects them first — that is the point of defence in depth. Build them
 * by patching already-validated metadata so the corpus rule itself is exercised.
 */
function withFrontmatter(
  concept: ReturnType<typeof loadFixture>,
  patch: Partial<ReturnType<typeof loadFixture>['frontmatter']>,
): ReturnType<typeof loadFixture> {
  return { ...concept, frontmatter: { ...concept.frontmatter, ...patch } };
}

describe('corpus validation', () => {
  it('accepts a consistent corpus', () => {
    expect(validateCorpus(pair())).toEqual([]);
  });

  it('accepts an empty corpus', () => {
    expect(validateCorpus([])).toEqual([]);
  });

  it('rejects a duplicate concept_id and names both files', () => {
    const [convolution, crossCorrelation] = pair();
    const concepts = [
      convolution!,
      withFrontmatter(crossCorrelation!, { concept_id: 'concept.analysis.convolution' }),
    ];
    const diagnostics = validateCorpus(concepts).filter((d) => d.field === 'concept_id');
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0]?.message).toContain('duplicate concept_id concept.analysis.convolution');
  });

  it('rejects a duplicate slug', () => {
    const [convolution, crossCorrelation] = pair();
    const collides = withFrontmatter(crossCorrelation!, { slug: '/concepts/convolution' });
    const diagnostics = validateCorpus([convolution!, collides]);
    expect(diagnostics.some((d) => d.message.includes('duplicate slug'))).toBe(true);
    expect(fields(diagnostics)).toContain('convolution.md#slug');
    expect(fields(diagnostics)).toContain('cross-correlation.md#slug');
  });

  it('rejects two concepts whose names collide once normalised', () => {
    const diagnostics = validateCorpus(pair({}, { aliases: ['CONVOLUTION-Operator'] }));
    expect(diagnostics.some((d) => d.message.includes('normalises to'))).toBe(true);
    expect(fields(diagnostics)).toContain('cross-correlation.md#aliases.0');
    expect(fields(diagnostics)).toContain('convolution.md#aliases.0');
  });

  it('rejects an alias that collides with another concept title', () => {
    const diagnostics = validateCorpus(pair({}, { aliases: ['convolution'] }));
    expect(fields(diagnostics)).toContain('convolution.md#title');
  });

  it('allows a title and an alias of the same concept to normalise alike', () => {
    expect(validateCorpus(pair({}, { aliases: ['cross correlation'] }))).toEqual([]);
  });

  it('rejects a relationship target that is not in the corpus', () => {
    const diagnostics = validateCorpus(
      pair({ relationships: [{ type: 'requires', target: 'concept.analysis.fourier_transform' }] }),
    );
    expect(diagnostics.some((d) => d.message.includes('does not exist in the corpus'))).toBe(true);
    expect(fields(diagnostics)).toContain('convolution.md#relationships.0.target');
  });

  it('rejects a primary_category that is missing from categories', () => {
    // Build the page through the loader, then mutate the validated metadata so
    // the corpus rule is exercised independently of the frontmatter schema.
    const [convolution, crossCorrelation] = pair();
    const broken = {
      ...convolution!,
      frontmatter: { ...convolution!.frontmatter, primary_category: 'Mathematics/Topology' },
    };
    const diagnostics = validateCorpus([broken, crossCorrelation!]);
    expect(fields(diagnostics)).toContain('convolution.md#primary_category');
  });

  it('rejects the same source_id describing two different sources', () => {
    const diagnostics = validateCorpus(
      pair(
        {},
        {
          sources: [
            {
              id: 'source.deep_learning_book.convnets',
              title: 'A completely different book',
              url: 'https://example.org/other',
              kind: 'preprint',
              supports: ['definition'],
            },
          ],
        },
      ),
    );
    const messages = diagnostics.map((d) => d.message).join('\n');
    expect(messages).toContain('one source_id must describe one source');
    expect(fields(diagnostics)).toContain(
      'cross-correlation.md#sources.source.deep_learning_book.convnets.title',
    );
    expect(fields(diagnostics)).toContain(
      'cross-correlation.md#sources.source.deep_learning_book.convnets.url',
    );
  });

  it('accepts the same source cited by two concepts with different supports and dates', () => {
    expect(
      validateCorpus(
        pair(
          {},
          {
            sources: [
              {
                id: 'source.deep_learning_book.convnets',
                supports: ['intuition', 'formal-treatment'],
                checkedOn: '2026-01-02',
              },
            ],
          },
        ),
      ),
    ).toEqual([]);
  });

  it('accepts a root concept that declares no relationship but is pointed at', () => {
    const [convolution, crossCorrelation] = pair();
    const root = withFrontmatter(convolution!, { relationships: [] });
    expect(validateCorpus([root, crossCorrelation!])).toEqual([]);
  });

  it('rejects a concept that takes part in no relationship at all', () => {
    const [convolution, crossCorrelation] = pair();
    const isolated = loadFixture('pooling.md', {
      conceptId: 'concept.deep_learning.pooling',
      title: 'Pooling',
      slug: '/concepts/pooling',
      aliases: ['spatial pooling'],
      categories: ['Artificial Intelligence/Deep Learning — Architectures'],
      relationships: [],
    });
    const diagnostics = validateCorpus([convolution!, crossCorrelation!, isolated]);
    expect(fields(diagnostics)).toContain('pooling.md#relationships');
    expect(diagnostics[0]?.message).toContain('takes part in no typed relationship');
  });

  it('rejects a relative link whose target file does not exist', () => {
    const body = tier1Body({
      Definition: 'See [Pooling](./pooling.md) for the contrast.',
    });
    const diagnostics = validateCorpus(pair({ body }));
    expect(diagnostics.some((d) => d.message.includes('pooling.md does not exist'))).toBe(true);
    expect(fields(diagnostics)).toContain('convolution.md#link:./pooling.md');
  });

  it('accepts a relative link to a file that does exist', () => {
    const body = tier1Body({
      Definition: 'See [Cross-Correlation](./cross-correlation.md) for the contrast.',
    });
    expect(validateCorpus(pair({ body }))).toEqual([]);
  });

  it('accepts a relative link with a fragment', () => {
    const body = tier1Body({
      Definition: 'See [Cross-Correlation](./cross-correlation.md#definition).',
    });
    expect(validateCorpus(pair({ body }))).toEqual([]);
  });

  it('rejects a relative link that escapes the content directory', () => {
    const body = tier1Body({ Definition: 'See [secrets](../../.env).' });
    const diagnostics = validateCorpus(pair({ body }));
    expect(
      diagnostics.some((d) => d.message.includes('must not leave the content directory')),
    ).toBe(true);
  });

  it('ignores absolute and external links', () => {
    const body = tier1Body({
      Definition: 'See [the book](https://www.deeplearningbook.org/) and [pooling](/concepts/pooling).',
    });
    expect(validateCorpus(pair({ body }))).toEqual([]);
  });

  it('rejects a file name that disagrees with the slug', () => {
    const concepts = [loadFixture('conv.md', CONVOLUTION)];
    const diagnostics = validateCorpus(concepts);
    expect(diagnostics.some((d) => d.message.includes('requires the file to be named'))).toBe(true);
  });

  it('rejects a self-relationship at corpus level too', () => {
    const [convolution, crossCorrelation] = pair();
    const broken = {
      ...convolution!,
      frontmatter: {
        ...convolution!.frontmatter,
        relationships: [
          { type: 'requires' as const, target: 'concept.analysis.convolution' },
        ],
      },
    };
    expect(
      validateCorpus([broken, crossCorrelation!]).some((d) =>
        d.message.includes('relationship to itself'),
      ),
    ).toBe(true);
  });

  it('reports every problem in one run rather than stopping at the first', () => {
    const [, crossCorrelation] = pair();
    const concepts = [
      loadFixture('convolution.md', {
        ...CONVOLUTION,
        relationships: [{ type: 'requires', target: 'concept.analysis.missing' }],
        body: tier1Body({ Definition: 'See [Pooling](./pooling.md).' }),
      }),
      withFrontmatter(crossCorrelation!, { concept_id: 'concept.analysis.convolution' }),
    ];
    const diagnostics = validateCorpus(concepts);
    const messages = diagnostics.map((d) => d.message).join('\n');
    expect(messages).toContain('does not exist in the corpus');
    expect(messages).toContain('pooling.md does not exist');
    expect(messages).toContain('duplicate concept_id');
  });

  it('sorts diagnostics by file, then field, then message', () => {
    const concepts = [
      loadFixture('cross-correlation.md', {
        ...CROSS_CORRELATION,
        relationships: [{ type: 'requires', target: 'concept.analysis.missing' }],
      }),
      loadFixture('convolution.md', {
        ...CONVOLUTION,
        relationships: [{ type: 'requires', target: 'concept.analysis.absent' }],
      }),
    ];
    const diagnostics = validateCorpus(concepts);
    const keys = diagnostics.map((d) => `${d.file}#${d.field}#${d.message}`);
    expect(keys).toEqual([...keys].sort());
    expect(diagnostics[0]?.file).toBe('convolution.md');
  });
});

describe('loading a corpus from disk', () => {
  async function withDir(
    files: Record<string, string>,
    run: (dir: string) => Promise<void>,
  ): Promise<void> {
    const dir = await mkdtemp(join(tmpdir(), 'navigator-corpus-'));
    try {
      for (const [name, text] of Object.entries(files)) {
        await writeFile(join(dir, name), text, 'utf8');
      }
      await run(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it('loads, validates and hashes a good corpus', async () => {
    await withDir(
      {
        'convolution.md': conceptMarkdown(CONVOLUTION),
        'cross-correlation.md': conceptMarkdown(CROSS_CORRELATION),
      },
      async (dir) => {
        const result = await loadCorpus(dir);
        expect(result.diagnostics).toEqual([]);
        expect(result.ok).toBe(true);
        expect(result.concepts.map((c) => c.frontmatter.concept_id)).toEqual([
          'concept.analysis.convolution',
          'concept.analysis.cross_correlation',
        ]);
        expect(result.corpusHash).toMatch(/^[0-9a-f]{64}$/);
      },
    );
  });

  it('produces the same corpus hash for the same content and a different one otherwise', async () => {
    const files = {
      'convolution.md': conceptMarkdown(CONVOLUTION),
      'cross-correlation.md': conceptMarkdown(CROSS_CORRELATION),
    };
    let first = '';
    await withDir(files, async (dir) => {
      first = (await loadCorpus(dir)).corpusHash;
    });
    await withDir(files, async (dir) => {
      expect((await loadCorpus(dir)).corpusHash).toBe(first);
    });
    await withDir(
      { ...files, 'cross-correlation.md': `${conceptMarkdown(CROSS_CORRELATION)}\nExtra prose.\n` },
      async (dir) => {
        expect((await loadCorpus(dir)).corpusHash).not.toBe(first);
      },
    );
  });

  it('collects per-file parse failures alongside corpus failures', async () => {
    await withDir(
      {
        'convolution.md': conceptMarkdown(CONVOLUTION),
        'broken.md': '# no frontmatter here\n',
      },
      async (dir) => {
        const result = await loadCorpus(dir);
        expect(result.ok).toBe(false);
        const byFile = result.diagnostics.map((d) => d.file);
        expect(byFile).toContain('broken.md');
        expect(
          result.diagnostics.some((d) => d.message.includes('does not exist in the corpus')),
        ).toBe(true);
      },
    );
  });

  it('ignores partial files whose name begins with an underscore', async () => {
    await withDir(
      {
        'convolution.md': conceptMarkdown({
          ...CONVOLUTION,
          relationships: [{ type: 'contrasts_with', target: 'concept.analysis.convolution_x' }],
        }),
        'convolution-x.md': conceptMarkdown({
          conceptId: 'concept.analysis.convolution_x',
          title: 'Convolution X',
          slug: '/concepts/convolution-x',
          aliases: [],
          relationships: [{ type: 'requires', target: 'concept.analysis.convolution' }],
        }),
        '_draft.md': 'not even markdown frontmatter',
      },
      async (dir) => {
        const result = await loadCorpus(dir);
        expect(result.diagnostics).toEqual([]);
        expect(result.concepts).toHaveLength(2);
      },
    );
  });

  it('reports a missing content directory as a corpus-level diagnostic', async () => {
    const result = await loadCorpus(join(tmpdir(), 'navigator-does-not-exist-12345'));
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.file).toBe('(corpus)');
  });
});
