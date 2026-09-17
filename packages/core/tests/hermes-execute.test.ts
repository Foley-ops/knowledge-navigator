/**
 * Dispatching a task to Hermes (v2 runbook R07).
 *
 * Every case runs against a fake executable that records every invocation it
 * receives, in a temporary git repository. No real Hermes is contacted, no real
 * board is touched, and the recorded log is what proves a refused dispatch
 * refused *before* spawning anything rather than after.
 *
 * The cases are the ways dispatch can go wrong: no confirmation, the wrong one,
 * a proposal that is not prepared, a dirty repository, missing Hermes setup, a
 * nonzero exit, a reply that is not JSON, and the same proposal twice.
 */
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { parseProposalManifest, serializeProposalManifest } from '../src/proposal.js';

const run = promisify(execFile);
const SCRIPT = join(
  fileURLToPath(new URL('../../..', import.meta.url)),
  'scripts',
  'hermes-content-task.mjs',
);
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

let repo = '';
let scratch = '';
let proposalDir = '';
let logPath = '';

/**
 * A fake hermes that logs every invocation and answers `kanban create` however
 * the test asks. It can create nothing: there is nothing here to create.
 */
async function fakeHermes(options: {
  name: string;
  createOutput?: string;
  createExit?: number;
  projects?: string;
  boards?: string;
}): Promise<string> {
  const path = join(scratch, options.name);
  await writeFile(
    path,
    `#!/bin/sh
printf '%s\\n' "$1 $2 $3" >> "${logPath}"
if [ "$1" = "--version" ]; then echo 'hermes 2.4.1'; exit 0; fi
if [ "$1" = "--help" ]; then
  cat <<'HELP'
${TOP_HELP}
HELP
  exit 0
fi
if [ "$1" = "kanban" ] && [ "$2" = "create" ] && [ "$3" = "--help" ]; then
  cat <<'HELP'
${CREATE_HELP}
HELP
  exit 0
fi
if [ "$1" = "project" ] && [ "$2" = "list" ]; then echo '${options.projects ?? 'knowledge-navigator'}'; exit 0; fi
if [ "$1" = "kanban" ] && [ "$2" = "board" ] && [ "$3" = "list" ]; then echo '${options.boards ?? 'knowledge-navigator'}'; exit 0; fi
if [ "$1" = "kanban" ] && [ "$2" = "create" ]; then
  cat <<'OUT'
${options.createOutput ?? '{"id":"task_01HZY","state":"queued"}'}
OUT
  exit ${String(options.createExit ?? 0)}
fi
exit 64
`,
    'utf8',
  );
  await chmod(path, 0o755);
  return path;
}

async function writeProposal(status = 'prepared', agent?: Record<string, string>): Promise<void> {
  await mkdir(proposalDir, { recursive: true });
  await writeFile(
    join(proposalDir, 'manifest.json'),
    serializeProposalManifest(
      parseProposalManifest({
        proposalId: PROPOSAL_ID,
        targetBacklogId: 'candidate.artificial_intelligence.deep_learning.state_space_model',
        requestedTier: 3,
        allowedPaths: ['content/graph-only/state-space-model.yaml'],
        baseCommit: 'a'.repeat(40),
        createdAt: '2026-09-17T00:00:00.000Z',
        status,
        ...(agent === undefined ? {} : { agent }),
      }),
    ),
    'utf8',
  );
  await writeFile(join(proposalDir, 'REQUEST.md'), '# Proposal request\n\nWrite it.\n', 'utf8');
}

interface Dispatch {
  proposalId: string;
  dispatched: boolean;
  taskId: string | null;
  status: string;
  problems: string[];
  setupCommands?: string[];
}

async function dispatch(
  bin: string,
  extra: string[] = ['--confirm', PROPOSAL_ID],
): Promise<{ code: number; stdout: string; json: Dispatch }> {
  const args = [
    SCRIPT,
    '--proposal',
    PROPOSAL_ID,
    '--proposal-dir',
    proposalDir,
    '--execute',
    '--json',
    ...extra,
  ];
  try {
    const { stdout } = await run(process.execPath, args, {
      cwd: repo,
      env: { ...process.env, HERMES_BIN: bin },
      maxBuffer: 16 * 1024 * 1024,
    });
    return { code: 0, stdout, json: JSON.parse(stdout) as Dispatch };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string };
    const stdout = failure.stdout ?? '';
    return {
      code: failure.code ?? 1,
      stdout,
      json: stdout.trim() === '' ? ({} as Dispatch) : (JSON.parse(stdout) as Dispatch),
    };
  }
}

async function log(): Promise<string> {
  return existsSync(logPath) ? readFile(logPath, 'utf8') : '';
}

/**
 * How many tasks were actually created.
 *
 * `kanban create --help` is a read-only probe, so counting the string "kanban
 * create" would count asking about the command as using it.
 */
async function creations(): Promise<string[]> {
  return (await log())
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('kanban create') && !line.includes('--help'));
}

async function statusNow(): Promise<string> {
  const manifest = parseProposalManifest(
    JSON.parse(await readFile(join(proposalDir, 'manifest.json'), 'utf8')) as unknown,
  );
  return manifest.status;
}

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), 'navigator-dispatch-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
  await writeFile(join(repo, 'README.md'), 'a repository\n', 'utf8');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['commit', '-q', '-m', 'first'], { cwd: repo });

  scratch = await mkdtemp(join(tmpdir(), 'navigator-dispatch-'));
  proposalDir = join(scratch, PROPOSAL_ID);
  logPath = join(scratch, 'invocations.log');
  await writeProposal();
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
  await rm(scratch, { recursive: true, force: true });
});

describe('dispatching for real', () => {
  it('records the task id and moves the proposal to running', async () => {
    const bin = await fakeHermes({ name: 'hermes-dispatch' });
    const { code, json } = await dispatch(bin);
    expect(code).toBe(0);
    expect(json.dispatched).toBe(true);
    expect(json.taskId).toBe('task_01HZY');
    expect(json.problems).toEqual([]);
    expect(await statusNow()).toBe('running');
    expect(await creations()).toHaveLength(1);
  });

  it('writes a manifest the canonical parser still accepts', async () => {
    const bin = await fakeHermes({ name: 'hermes-manifest' });
    await dispatch(bin);
    const text = await readFile(join(proposalDir, 'manifest.json'), 'utf8');
    const manifest = parseProposalManifest(JSON.parse(text) as unknown);
    expect(manifest.agent).toEqual({ name: 'hermes', taskId: 'task_01HZY' });
    // The script writes the manifest itself, so its key order is pinned to the
    // canonical writer rather than left to drift.
    expect(text).toBe(serializeProposalManifest(manifest));
  });
});

describe('the guards', () => {
  it('refuses without a confirmation, and spawns nothing', async () => {
    const bin = await fakeHermes({ name: 'hermes-noconfirm' });
    const { code } = await dispatch(bin, []);
    expect(code).toBe(2);
    expect(await creations()).toEqual([]);
    expect(await statusNow()).toBe('prepared');
  });

  it('refuses a confirmation that names something else', async () => {
    const bin = await fakeHermes({ name: 'hermes-wrongconfirm' });
    const { json } = await dispatch(bin, ['--confirm', 'p-something-else']);
    expect(json.dispatched).toBe(false);
    expect(json.problems.join(' ')).toContain(`--confirm ${PROPOSAL_ID} is required`);
    expect(await creations()).toEqual([]);
  });

  it('refuses a dirty repository', async () => {
    await writeFile(join(repo, 'NOTES.md'), 'uncommitted\n', 'utf8');
    const bin = await fakeHermes({ name: 'hermes-dirty' });
    const { json } = await dispatch(bin);
    expect(json.dispatched).toBe(false);
    expect(json.problems.join(' ')).toContain('not clean');
    expect(await creations()).toEqual([]);
  });

  it('refuses when the Hermes project or board is missing, and prints the setup', async () => {
    const bin = await fakeHermes({ name: 'hermes-nosetup', projects: 'other', boards: 'other' });
    const { json } = await dispatch(bin);
    expect(json.dispatched).toBe(false);
    expect(json.problems.join(' ')).toContain('does not exist');
    expect((json.setupCommands ?? []).join(' ')).toContain('project create');
    // The setup is printed, never performed.
    expect(await log()).not.toContain('project create');
    expect(await creations()).toEqual([]);
  });

  it('refuses a second dispatch of the same proposal', async () => {
    const bin = await fakeHermes({ name: 'hermes-twice' });
    expect((await dispatch(bin)).json.dispatched).toBe(true);
    const second = await dispatch(bin);
    expect(second.json.dispatched).toBe(false);
    expect(second.json.problems.join(' ')).toContain('already running as task task_01HZY');
    expect(await creations()).toHaveLength(1);
  });

  it('refuses a proposal that is past dispatching', async () => {
    for (const status of ['review', 'accepted', 'rejected'] as const) {
      await writeProposal(status);
      const bin = await fakeHermes({ name: `hermes-${status}` });
      const { json } = await dispatch(bin);
      expect(json.dispatched, status).toBe(false);
      expect(json.problems.join(' ')).toContain('only a prepared proposal can be dispatched');
    }
  });
});

describe('when Hermes itself goes wrong', () => {
  it('leaves the proposal prepared when hermes exits nonzero', async () => {
    const bin = await fakeHermes({
      name: 'hermes-fails',
      createExit: 3,
      createOutput: 'board is locked',
    });
    const { json } = await dispatch(bin);
    expect(json.dispatched).toBe(false);
    expect(json.problems.join(' ')).toContain('exited 3');
    expect(json.problems.join(' ')).toContain('created nothing');
    expect(await statusNow()).toBe('prepared');
  });

  it('assumes a task exists when the reply cannot be read, and says so', async () => {
    const bin = await fakeHermes({ name: 'hermes-garbled', createOutput: 'created! (probably)' });
    const { json } = await dispatch(bin);
    // Hermes accepted it, so the work is under way whatever the reply said.
    expect(json.dispatched).toBe(true);
    expect(json.taskId).toBeNull();
    expect(json.problems.join(' ')).toContain('could not be read as JSON');
    expect(json.problems.join(' ')).toContain('Check the board');
    // And the proposal is running, so a second dispatch is refused.
    expect(await statusNow()).toBe('running');
  });

  it('reads a task id from any of the shapes a reply might use', async () => {
    for (const [output, expected] of [
      ['{"id":"a1"}', 'a1'],
      ['{"taskId":"b2"}', 'b2'],
      ['{"task_id":"c3"}', 'c3'],
      ['{"task":{"id":"d4"}}', 'd4'],
      ['{"data":{"id":"e5"}}', 'e5'],
    ] as const) {
      await writeProposal();
      const bin = await fakeHermes({ name: `hermes-id-${expected}`, createOutput: output });
      const { json } = await dispatch(bin);
      expect(json.taskId, output).toBe(expected);
    }
  });
});

describe('the adapter never creates Hermes configuration', () => {
  it('runs only read-only probes and one create, in that order', async () => {
    const bin = await fakeHermes({ name: 'hermes-order' });
    await dispatch(bin);
    const lines = (await log())
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
    expect(lines).toEqual([
      '--version',
      '--help',
      'kanban create --help',
      'project list',
      'kanban board list',
      // The only invocation that changes anything, and it is the last one.
      'kanban create --project',
    ]);
  });
});
