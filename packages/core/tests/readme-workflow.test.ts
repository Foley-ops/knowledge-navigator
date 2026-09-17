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
