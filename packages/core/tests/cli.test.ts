/**
 * D08 — the `navigator` command line, driven as a real process against the
 * acceptance corpus so the shipped entry point is what gets tested.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const CLI = join(REPO_ROOT, 'packages', 'core', 'dist', 'cli.js');

let root: string;
let databasePath: string;

interface Run {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function navigator(...args: string[]): Promise<Run> {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, DATABASE_PATH: databasePath },
      maxBuffer: 16 * 1024 * 1024,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: failure.code ?? 1, stdout: failure.stdout ?? '', stderr: failure.stderr ?? '' };
  }
}

beforeAll(async () => {
  if (!existsSync(CLI)) {
    await run('npm', ['run', 'build', '--workspace', '@navigator/core'], { cwd: REPO_ROOT });
  }
  root = await mkdtemp(join(tmpdir(), 'navigator-cli-'));
  databasePath = join(root, 'knowledge.db');
}, 180_000);

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('navigator command line', () => {
  it('validate reports the acceptance corpus and exits zero', async () => {
    const result = await navigator('validate');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('concepts:           11');
    expect(result.stdout).toContain('tier 1:          11');
    expect(result.stdout).toContain('generated-draft   11');
    expect(result.stdout).toContain('0 errors');
  }, 60_000);

  it('validate exits non-zero on a broken corpus without touching the real one', async () => {
    const broken = await mkdtemp(join(tmpdir(), 'navigator-broken-'));
    try {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(join(broken, 'x.md'), 'not a concept\n', 'utf8');
      const result = await navigator('validate', '--content', broken);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('problem(s)');
    } finally {
      await rm(broken, { recursive: true, force: true });
    }
  }, 60_000);

  it('compile writes the database and reports what it wrote', async () => {
    const result = await navigator('compile', '--database', databasePath);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('compiled the canonical corpus');
    expect(result.stdout).toContain('concepts:           11');
    expect(result.stdout).toContain('full-text rows:     11');
    expect(result.stdout).toMatch(/corpus hash:\s+[0-9a-f]{64}/);
    expect(existsSync(databasePath)).toBe(true);
  }, 120_000);

  it('inspect shows one concept by id, with categories, relations and sources', async () => {
    const result = await navigator('inspect', 'concept.deep_learning.resnet');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('id:            concept.deep_learning.resnet');
    expect(result.stdout).toContain('slug:          /concepts/resnet');
    expect(result.stdout).toContain('review state:  generated-draft');
    expect(result.stdout).toContain('* Artificial Intelligence/Computer Vision');
    expect(result.stdout).toContain('implements');
    expect(result.stdout).toContain('https://arxiv.org/abs/1512.03385');
    expect(result.stdout).toContain('Residual Network');
  }, 60_000);

  it('inspect also accepts a slug name', async () => {
    const byName = await navigator('inspect', 'resnet');
    const bySlug = await navigator('inspect', '/concepts/resnet');
    const byId = await navigator('inspect', 'concept.deep_learning.resnet');
    expect(byName.code).toBe(0);
    expect(byName.stdout).toBe(byId.stdout);
    expect(bySlug.stdout).toBe(byId.stdout);
  }, 60_000);

  it('inspect exits non-zero for an unknown concept', async () => {
    const result = await navigator('inspect', 'concept.no.such_thing');
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('no concept');
  }, 60_000);

  it('search finds convolutional layer through the alias "conv layer"', async () => {
    const result = await navigator('search', 'conv', 'layer');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Convolutional Layer');
    expect(result.stdout).toContain('[exact-alias]');
    expect(result.stdout).toContain('/concepts/convolutional-layer');
  }, 60_000);

  it('search honours --limit and reports an empty result plainly', async () => {
    const limited = await navigator('search', 'convolution', '--limit', '2');
    expect(limited.code).toBe(0);
    expect(limited.stdout).toContain('2 result(s)');

    const empty = await navigator('search', 'quaternion');
    expect(empty.code).toBe(0);
    expect(empty.stdout).toContain('no concept matches');
  }, 60_000);

  it('search handles injection-shaped input without failing', async () => {
    const result = await navigator('search', "'; DROP TABLE concepts; --");
    expect(result.code).toBe(0);
    const after = await navigator('inspect', 'concept.deep_learning.resnet');
    expect(after.code).toBe(0);
  }, 60_000);

  it('prints usage for help and exits 2 for an unknown command', async () => {
    const help = await navigator('--help');
    expect(help.code).toBe(0);
    for (const command of ['validate', 'compile', 'inspect', 'search', 'schema']) {
      expect(help.stdout).toContain(command);
    }
    const unknown = await navigator('frobnicate');
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toContain('unknown command');
  }, 60_000);

  it('explains itself when no compiled index exists', async () => {
    const result = await navigator(
      'inspect',
      'concept.deep_learning.resnet',
      '--database',
      join(root, 'missing.db'),
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('no compiled index');
    expect(result.stderr).toContain('npm run compile');
  }, 60_000);
});

describe('navigator coverage (v2 runbook L06)', () => {
  it('summary reports identities, atlas and backlog separately', async () => {
    const result = await navigator('coverage', 'summary');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('canonical identities');
    expect(result.stdout).toContain('atlas (editorial, never evidence)');
    expect(result.stdout).toContain('editorial backlog');
    expect(result.stdout).toContain('corpus hash');
    expect(result.stdout).toContain('atlas hash');
  }, 60_000);

  it('summary --json is parseable and stable across two runs', async () => {
    const first = await navigator('coverage', 'summary', '--json');
    const second = await navigator('coverage', 'summary', '--json');
    expect(first.code).toBe(0);
    expect(first.stdout).toBe(second.stdout);

    const summary = JSON.parse(first.stdout) as {
      concepts: { total: number };
      atlas: { areas: number; candidates: number };
    };
    expect(summary.concepts.total).toBe(11);
    expect(summary.atlas.areas).toBe(3);
    expect(summary.atlas.candidates).toBeGreaterThan(200);
  }, 60_000);

  it('candidates filters by area and by status', async () => {
    const programming = await navigator(
      'coverage',
      'candidates',
      '--area',
      'atlas.programming',
      '--json',
    );
    expect(programming.code).toBe(0);
    const page = JSON.parse(programming.stdout) as {
      total: number;
      items: { candidateId: string; categories: { areaId: string }[] }[];
    };
    expect(page.total).toBeGreaterThan(0);
    // Filtering is by category membership, not by id: Lean and Logic
    // Programming sit in Programming and in another area, and their ids come
    // from whichever category the atlas lists first.
    expect(
      page.items.every((item) =>
        item.categories.some((category) => category.areaId === 'atlas.programming'),
      ),
    ).toBe(true);
    expect(page.items.some((item) => !item.candidateId.startsWith('candidate.programming.'))).toBe(
      true,
    );

    const covered = await navigator('coverage', 'candidates', '--status', 'covered', '--json');
    const coveredPage = JSON.parse(covered.stdout) as {
      total: number;
      items: { canonicalConceptId: string | null }[];
    };
    expect(coveredPage.total).toBe(11);
    expect(coveredPage.items.every((item) => item.canonicalConceptId !== null)).toBe(true);
  }, 60_000);

  it('candidates returns an empty page rather than failing', async () => {
    const result = await navigator('coverage', 'candidates', '--status', 'deferred', '--json');
    expect(result.code).toBe(0);
    const page = JSON.parse(result.stdout) as { total: number; items: unknown[] };
    expect(page.total).toBe(0);
    expect(page.items).toEqual([]);

    const text = await navigator('coverage', 'candidates', '--status', 'deferred');
    expect(text.code).toBe(0);
    expect(text.stdout).toContain('no candidate matches those filters');
  }, 60_000);

  it('candidates rejects an unknown status with the allowed list', async () => {
    const result = await navigator('coverage', 'candidates', '--status', 'maybe');
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('unknown status "maybe"');
    expect(result.stderr).toContain('proposed-tier-3');
  }, 60_000);

  it('candidates orders deterministically and paginates', async () => {
    const page1 = await navigator('coverage', 'candidates', '--limit', '5', '--json');
    const again = await navigator('coverage', 'candidates', '--limit', '5', '--json');
    expect(page1.stdout).toBe(again.stdout);

    const page2 = await navigator(
      'coverage',
      'candidates',
      '--limit',
      '5',
      '--offset',
      '5',
      '--json',
    );
    const first = JSON.parse(page1.stdout) as { items: { candidateId: string }[] };
    const second = JSON.parse(page2.stdout) as { items: { candidateId: string }[] };
    const ids = new Set(first.items.map((i) => i.candidateId));
    expect(second.items.every((i) => !ids.has(i.candidateId))).toBe(true);
    expect(first.items).toHaveLength(5);
  }, 60_000);

  it('unresolved says so plainly when the backlog is empty', async () => {
    const result = await navigator('coverage', 'unresolved');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('nothing is waiting on a missing concept');

    const json = await navigator('coverage', 'unresolved', '--blocking', '--json');
    expect(JSON.parse(json.stdout)).toMatchObject({ total: 0, items: [] });
  }, 60_000);

  it('rejects an unknown subcommand', async () => {
    const result = await navigator('coverage', 'everything');
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('unknown subcommand "everything"');
  }, 60_000);
});

describe('navigator evidence (v2 runbook L06)', () => {
  it('accepts a concept id and a slug, and says when no claims exist', async () => {
    const byId = await navigator('evidence', 'concept.deep_learning.resnet');
    const bySlug = await navigator('evidence', '/concepts/resnet');
    expect(byId.code).toBe(0);
    expect(bySlug.stdout).toBe(byId.stdout);
    expect(byId.stdout).toContain('no claim-level evidence mapping yet');
    expect(byId.stdout).toContain('source.he2016.deep_residual_learning');
  }, 60_000);

  it('--json is stable and carries the sources', async () => {
    const first = await navigator('evidence', 'concept.deep_learning.resnet', '--json');
    const second = await navigator('evidence', 'concept.deep_learning.resnet', '--json');
    expect(first.stdout).toBe(second.stdout);
    const evidence = JSON.parse(first.stdout) as {
      hasClaimMapping: boolean;
      claims: unknown[];
      sources: { sourceId: string }[];
    };
    expect(evidence.hasClaimMapping).toBe(false);
    expect(evidence.claims).toEqual([]);
    expect(evidence.sources.length).toBeGreaterThan(0);
  }, 60_000);

  it('fails clearly on an unknown concept', async () => {
    const result = await navigator('evidence', 'concept.no.such');
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('no concept "concept.no.such"');
  }, 60_000);

  it('requires an argument', async () => {
    const result = await navigator('evidence');
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('a concept id or slug is required');
  }, 60_000);
});

/* ----------------------------------------------------------------- R01 ---- */

describe('navigator proposal prepare', () => {
  it('writes a bundle for an atlas candidate and runs no model', async () => {
    const out = join(root, 'proposals');
    const result = await navigator(
      'proposal',
      'prepare',
      'candidate.artificial_intelligence.symbolic_ai.search.a_star',
      '--tier',
      '3',
      '--name',
      'a-star',
      '--out',
      out,
      '--json',
    );
    expect(result.code, result.stderr).toBe(0);
    const written = JSON.parse(result.stdout) as {
      proposalId: string;
      directory: string;
      allowedPath: string;
      conceptId: string;
      manifest: { status: string; baseCommit: string };
    };
    expect(written.allowedPath).toBe('content/graph-only/a-star.yaml');
    expect(written.conceptId).toBe('concept.search.a_star');
    expect(written.manifest.status).toBe('prepared');
    expect(written.manifest.baseCommit).toMatch(/^[0-9a-f]{40}$/);

    const request = await readFile(join(written.directory, 'REQUEST.md'), 'utf8');
    expect(request).toContain('## The one file you may write');
    expect(request).toContain('A person reviews it next.');
    // Nothing canonical was touched.
    expect(existsSync(join(REPO_ROOT, 'content', 'graph-only', 'a-star.yaml'))).toBe(false);
  });

  it('produces the same brief twice, apart from the id and the time', async () => {
    const out = join(root, 'twice');
    const runOnce = async () => {
      const result = await navigator(
        'proposal',
        'prepare',
        'candidate.artificial_intelligence.symbolic_ai.search.a_star',
        '--tier',
        '3',
        '--name',
        'a-star',
        '--out',
        out,
        '--json',
      );
      expect(result.code, result.stderr).toBe(0);
      const written = JSON.parse(result.stdout) as { directory: string; proposalId: string };
      return {
        id: written.proposalId,
        request: await readFile(join(written.directory, 'REQUEST.md'), 'utf8'),
      };
    };

    const first = await runOnce();
    const second = await runOnce();
    // A second proposal for the same target on the same day is a new proposal,
    // not a silent overwrite.
    expect(second.id).not.toBe(first.id);
    const mask = (text: string) =>
      text.replace(/p-\d{8}[a-z0-9-]*/g, '<id>').replace(/\d{4}-\d{2}-\d{2}T[0-9:.]+Z/g, '<time>');
    expect(mask(second.request)).toBe(mask(first.request));
  });

  it('refuses a tier it may not delegate, and an id it cannot find', async () => {
    const out = join(root, 'refused');
    const tier1 = await navigator(
      'proposal',
      'prepare',
      'candidate.artificial_intelligence.symbolic_ai.search.a_star',
      '--tier',
      '1',
      '--out',
      out,
    );
    expect(tier1.code).toBe(2);
    expect(tier1.stderr).toContain('never delegated');

    const unknown = await navigator(
      'proposal',
      'prepare',
      'candidate.nope.nope',
      '--tier',
      '3',
      '--out',
      out,
    );
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toContain('no backlog group or atlas candidate');
    expect(existsSync(out)).toBe(false);
  });

  it('refuses to invent an address for a label that cannot make one', async () => {
    const result = await navigator(
      'proposal',
      'prepare',
      'candidate.artificial_intelligence.symbolic_ai.search.a_star',
      '--tier',
      '3',
      '--out',
      join(root, 'no-name'),
    );
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('--name');
  });
});
