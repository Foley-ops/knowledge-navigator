/**
 * Auditing the documented workflow (v2 runbook R09).
 *
 * The README is how a person learns this loop, and a command in it that does
 * not exist is worse than no documentation: it is followed, it fails, and the
 * reader is left guessing which half was wrong. So every command the README
 * gives is checked against the thing that would run it, and every link is
 * checked against the file or heading it points at.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectPaths } from '../src/paths.js';

const paths = projectPaths();
const readme = readFileSync(join(paths.root, 'README.md'), 'utf8');
const scripts = (
  JSON.parse(readFileSync(join(paths.root, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }
).scripts;
const cli = readFileSync(join(paths.root, 'packages', 'core', 'src', 'cli.ts'), 'utf8');
const adapter = readFileSync(join(paths.root, 'scripts', 'hermes-content-task.mjs'), 'utf8');

/** Commands the README tells a person to run, in the order it gives them. */
function npmCommands(): string[] {
  return [...readme.matchAll(/npm run ([a-z:-]+)/g)].map((match) => match[1] ?? '');
}

function navigatorSubcommands(): string[][] {
  return [...readme.matchAll(/npm run navigator -- ([a-z-]+)(?: ([a-z-]+))?/g)].map((match) =>
    [match[1] ?? '', match[2] ?? ''].filter((part) => part !== '' && !part.startsWith('<')),
  );
}

describe('every documented command exists', () => {
  it('names only npm scripts this repository has', () => {
    for (const script of new Set(npmCommands())) {
      expect(scripts, `npm run ${script}`).toHaveProperty(script);
    }
  });

  it('runs the command line through a script that exists', () => {
    expect(scripts['navigator']).toContain('packages/core/dist/cli.js');
  });

  it('names only subcommands the command line dispatches', () => {
    const documented = navigatorSubcommands();
    expect(documented.length).toBeGreaterThan(5);
    for (const [command, subcommand] of documented) {
      expect(cli, `navigator ${command ?? ''}`).toContain(`case '${command ?? ''}':`);
      if (subcommand !== undefined && subcommand !== '') {
        expect(cli, `navigator ${command ?? ''} ${subcommand}`).toContain(`case '${subcommand}':`);
      }
    }
  });

  it('covers the whole loop, in order', () => {
    const order = [
      'proposal prepare',
      'hermes-content-task.mjs --check',
      'hermes-content-task.mjs --proposal',
      '--execute --confirm',
      'proposal import-hermes',
      'proposal validate',
      'proposal accept',
      'proposal reject',
    ];
    let cursor = 0;
    for (const step of order) {
      const at = readme.indexOf(step, cursor);
      expect(at, `${step} appears after the step before it`).toBeGreaterThan(-1);
      cursor = at;
    }
  });

  it('names only flags the adapter actually offers', () => {
    for (const flag of ['--check', '--proposal', '--execute', '--confirm']) {
      expect(adapter, flag).toContain(`'${flag}'`);
    }
  });

  it('names only flags the command line actually offers', () => {
    for (const flag of ['--tier', '--worktree', '--confirm', '--reason', '--dry-run']) {
      expect(cli, flag).toContain(flag);
    }
  });
});

describe('every link resolves', () => {
  const links = [...readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1] ?? '');

  it('points at files that are here', () => {
    const files = links.filter((href) => href.startsWith('./') || href.startsWith('../'));
    expect(files.length).toBeGreaterThan(0);
    for (const href of files) {
      const target = join(paths.root, href.split('#')[0] ?? '');
      expect(existsSync(target), href).toBe(true);
    }
  });

  it('points at headings that are here', () => {
    const anchors = links.filter((href) => href.startsWith('#'));
    const headings = [...readme.matchAll(/^#{2,4} (.+)$/gm)].map((match) =>
      (match[1] ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .trim()
        .replace(/\s+/g, '-'),
    );
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      expect(headings, anchor).toContain(anchor.slice(1));
    }
  });
});

describe('what the documentation promises about Hermes', () => {
  it('says the gateway warning is the reader’s to act on', () => {
    const collapsed = readme.replace(/\s+/g, ' ');
    expect(collapsed).toContain('gateway has not been restarted');
    expect(collapsed).toContain('neither this product nor its tests restarts anything');
  });

  it('never tells anything to restart Hermes automatically', () => {
    const collapsed = readme.replace(/\s+/g, ' ').toLowerCase();
    expect(collapsed).not.toContain('restart the gateway for you');
    expect(collapsed).not.toContain('automatically restarts');
    // And the adapter does not either.
    expect(adapter.toLowerCase()).not.toContain('restart');
    expect(adapter.toLowerCase()).not.toContain('daemon');
  });

  it('says plainly that nothing here is automatic', () => {
    const collapsed = readme.replace(/\s+/g, ' ');
    expect(collapsed).toContain('Nothing in this loop is automatic');
    expect(collapsed).toContain('no command anywhere in this repository that lets an agent accept');
    expect(collapsed).toContain('It never installs, updates or configures anything');
  });

  it('points at both contracts an agent is bound by', () => {
    expect(readme).toContain('HERMES_CONTENT_PROFILE.md');
    expect(readme).toContain('AGENT_CONTENT_CONTRACT.md');
  });
});

/* ----------------------------------------------------------------- T03 ---- */

describe('the README covers the complete product', () => {
  const collapsed = readme.replace(/\s+/g, ' ');

  it('says what version 2 added', () => {
    expect(collapsed).toContain('What Version 2 added');
    for (const addition of [
      'curated atlas',
      'Coverage tiers',
      'editorial backlog',
      'Claim-level evidence',
      'private research workspace',
      'Compare and Path',
      'Reviewable agent proposals',
    ]) {
      expect(collapsed, addition).toContain(addition);
    }
  });

  it('draws the canonical, personal and candidate boundaries exactly', () => {
    expect(collapsed).toContain('Canonical knowledge');
    expect(collapsed).toContain('content/concepts/');
    expect(collapsed).toContain('content/graph-only/');
    expect(collapsed).toContain('Your private research');
    expect(collapsed).toContain('never reaches a model unless you tick a box');
    expect(collapsed).toContain('Atlas candidates');
    expect(collapsed).toContain('A candidate is not knowledge');
    expect(collapsed).toContain('never used to ground an answer');
  });

  it('separates coverage tiers from product versions', () => {
    expect(collapsed).toContain('Coverage tiers are depths, not versions');
    expect(collapsed).toContain('nothing to do with the version of this product');
    expect(collapsed).toContain('keeps the concept id and the slug');
    expect(collapsed).toContain('review state is a separate axis');
  });

  it('says how to back up private work', () => {
    expect(collapsed).toContain('npm run personal:export');
    expect(collapsed).toContain('personal import');
    expect(collapsed).toContain('--confirm-import');
    expect(collapsed).toContain('recovery-drill.sh');
  });

  it('says exactly what happens to an uploaded file', () => {
    expect(collapsed).toContain('the original bytes are discarded');
    expect(collapsed).toContain('10 MiB');
    expect(collapsed).toContain('300 PDF pages');
    expect(collapsed).toContain('200,000 characters');
    expect(collapsed).toContain('nothing is ever executed');
    expect(collapsed).toContain('only when you tick it for that request');
  });

  it('explains Compare and Path, including what they refuse to do', () => {
    expect(collapsed).toContain('quoted from the canonical page');
    expect(collapsed).toContain('which kind of nothing it is');
    expect(collapsed).toContain('the synthesis is discarded');
    expect(collapsed).toContain('`requires` and `prerequisite_of`');
    expect(collapsed).toContain('does not arrange related concepts into a plausible order');
    expect(collapsed).toContain('every record that changed the result is named');
  });

  it('explains the Hermes proposal loop', () => {
    expect(collapsed).toContain('Proposing content with an agent');
    expect(collapsed).toContain('It may not publish it');
    expect(collapsed).toContain('hermes-content-task.mjs');
  });

  it('says what remains out of scope', () => {
    expect(collapsed).toContain('What this does not do');
    for (const excluded of [
      'No accounts, no authentication',
      'No public hosting',
      'No embeddings or vector search',
      'No OCR, images, audio, video',
      'No automatic publication',
      'No stale-claim detection',
      'No streaming',
    ]) {
      expect(collapsed, excluded).toContain(excluded);
    }
  });

  it('says the original eleven pages are still generated drafts', () => {
    expect(collapsed).toContain('All eleven pages are still `generated-draft`');
    expect(collapsed).toContain('Version 2 did not promote a single one');
  });

  it('points at the retrieval evaluation rather than claiming a need for embeddings', () => {
    expect(collapsed).toContain('docs/v2-retrieval-evaluation.md');
    expect(collapsed).toContain('measured rather than assumed');
  });
});
