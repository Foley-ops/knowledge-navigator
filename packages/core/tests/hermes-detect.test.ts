/**
 * Detecting the installed Hermes (v2 runbook R05).
 *
 * Every case runs against a fake executable written for the test, so nothing
 * here depends on what is installed on this machine, nothing dispatches a task,
 * and nothing touches Hermes' own state. What is being defended is that the
 * adapter fails *clearly* — naming the missing capability — instead of guessing
 * at an interface and sending a command a different build would not understand.
 */
import { execFile } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SCRIPT = join(REPO_ROOT, 'scripts', 'hermes-content-task.mjs');

const FULL_CREATE_HELP = `Usage: hermes kanban create [options]

  --workspace <path>            worktree to run in
  --project <slug>              project to attach the task to
  --max-runtime <duration>      stop the task after this long
  --max-retries <n>             give up after this many attempts
  --completion-contract <text>  what counts as done
`;

const FULL_TOP_HELP = `Usage: hermes <command>

Commands:
  project    manage projects
  kanban     manage boards and tasks
  daemon     run the gateway
`;

let scratch = '';

/** Write a fake hermes that answers the three probes however the test wants. */
async function fakeHermes(options: {
  name: string;
  version?: string | null;
  topHelp?: string;
  createHelp?: string;
  createExitCode?: number;
}): Promise<string> {
  const path = join(scratch, options.name);
  const script = `#!/bin/sh
if [ "$1" = "--version" ]; then
${options.version === null ? '  exit 127' : `  echo '${options.version ?? 'hermes 2.4.1'}'`}
  exit 0
fi
if [ "$1" = "--help" ]; then
  cat <<'HELP'
${options.topHelp ?? FULL_TOP_HELP}
HELP
  exit 0
fi
if [ "$1" = "kanban" ] && [ "$2" = "create" ] && [ "$3" = "--help" ]; then
  cat <<'HELP'
${options.createHelp ?? FULL_CREATE_HELP}
HELP
  exit ${String(options.createExitCode ?? 0)}
fi
echo "unexpected invocation: $*" >&2
exit 64
`;
  await writeFile(path, script, 'utf8');
  await chmod(path, 0o755);
  return path;
}

interface CheckResult {
  code: number;
  stdout: string;
  json: {
    ok: boolean;
    binary: string;
    version: string | null;
    capabilities: {
      found: boolean;
      subcommands: Record<string, boolean>;
      createFlags: Record<string, boolean>;
    };
    problems: string[];
  };
}

async function check(bin: string, extra: string[] = []): Promise<CheckResult> {
  try {
    const { stdout } = await run(process.execPath, [SCRIPT, '--check', '--json', ...extra], {
      cwd: REPO_ROOT,
      env: { ...process.env, HERMES_BIN: bin },
      maxBuffer: 8 * 1024 * 1024,
    });
    return { code: 0, stdout, json: JSON.parse(stdout) as CheckResult['json'] };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string };
    const stdout = failure.stdout ?? '';
    return {
      code: failure.code ?? 1,
      stdout,
      json: JSON.parse(stdout) as CheckResult['json'],
    };
  }
}

beforeAll(async () => {
  scratch = await mkdtemp(join(tmpdir(), 'navigator-hermes-'));
});

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

describe('a Hermes that has everything', () => {
  it('reports the version and every capability', async () => {
    const bin = await fakeHermes({ name: 'hermes-good', version: 'hermes 2.4.1' });
    const result = await check(bin);
    expect(result.code).toBe(0);
    expect(result.json.ok).toBe(true);
    expect(result.json.version).toBe('hermes 2.4.1');
    expect(result.json.capabilities.found).toBe(true);
    expect(result.json.capabilities.subcommands).toEqual({ project: true, kanban: true });
    expect(result.json.capabilities.createFlags).toEqual({
      '--workspace': true,
      '--project': true,
      '--max-runtime': true,
      '--max-retries': true,
      '--completion-contract': true,
    });
    expect(result.json.problems).toEqual([]);
  });

  it('prints a readable report as well as JSON', async () => {
    const bin = await fakeHermes({ name: 'hermes-readable' });
    const { stdout } = await run(process.execPath, [SCRIPT, '--check'], {
      cwd: REPO_ROOT,
      env: { ...process.env, HERMES_BIN: bin },
    });
    expect(stdout).toContain('hermes binary');
    expect(stdout).toContain('kanban create --workspace');
    expect(stdout).not.toContain('MISS');
  });
});

describe('a Hermes that is missing something', () => {
  it('says so when the binary is not there at all', async () => {
    const result = await check(join(scratch, 'not-installed'));
    expect(result.code).toBe(1);
    expect(result.json.capabilities.found).toBe(false);
    expect(result.json.problems.join(' ')).toContain('was not found');
    expect(result.json.problems.join(' ')).toContain('never installs anything');
  });

  it.each([
    ['project', `Usage: hermes <command>\n\nCommands:\n  kanban     boards\n`],
    ['kanban', `Usage: hermes <command>\n\nCommands:\n  project    projects\n`],
  ])('names the missing subcommand %s', async (missing, topHelp) => {
    const bin = await fakeHermes({ name: `hermes-no-${missing}`, topHelp });
    const result = await check(bin);
    expect(result.code).toBe(1);
    expect(result.json.capabilities.subcommands[missing]).toBe(false);
    expect(result.json.problems.join(' ')).toContain(`does not mention \`${missing}\``);
  });

  it.each(['--workspace', '--project', '--max-runtime', '--max-retries', '--completion-contract'])(
    'names the missing create flag %s',
    async (flag) => {
      const createHelp = FULL_CREATE_HELP.split('\n')
        .filter((line) => !line.includes(flag))
        .join('\n');
      const bin = await fakeHermes({ name: `hermes-no${flag}`, createHelp });
      const result = await check(bin);
      expect(result.code).toBe(1);
      expect(result.json.capabilities.createFlags[flag]).toBe(false);
      expect(result.json.problems.join(' ')).toContain(`does not offer ${flag}`);
      expect(result.json.problems.join(' ')).toContain('will not dispatch without it');
    },
  );

  it('says so when kanban create cannot be asked about itself', async () => {
    const bin = await fakeHermes({
      name: 'hermes-silent-create',
      createHelp: '',
      createExitCode: 1,
    });
    const result = await check(bin);
    expect(result.code).toBe(1);
    expect(result.json.problems.join(' ')).toContain('could not be confirmed');
  });

  it('still reports what it did find', async () => {
    const bin = await fakeHermes({
      name: 'hermes-partial',
      createHelp: '  --workspace <path>\n  --project <slug>\n',
    });
    const result = await check(bin);
    expect(result.json.capabilities.createFlags['--workspace']).toBe(true);
    expect(result.json.capabilities.createFlags['--max-retries']).toBe(false);
    expect(result.json.version).toBe('hermes 2.4.1');
  });
});

describe('the adapter never changes Hermes', () => {
  it('contains no install, update or configuration command', async () => {
    const source = await readFile(SCRIPT, 'utf8');
    for (const forbidden of [
      'npm install',
      'npm i ',
      'brew install',
      'hermes install',
      'hermes update',
      'hermes config set',
      'hermes daemon',
    ]) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });

  it('never builds a shell command out of a string', async () => {
    const source = await readFile(SCRIPT, 'utf8');
    expect(source).not.toContain('exec(');
    expect(source).not.toContain('shell: true');
    expect(source).toContain('never builds a shell string');
  });

  it('prints the one-time setup rather than performing it', async () => {
    const source = await readFile(SCRIPT, 'utf8');
    expect(source).toContain('manualSetupCommands');
    expect(source).toContain('project create');
    // The setup commands are returned as text, never spawned.
    expect(source).not.toMatch(/probe\(\[\s*'project',\s*'create'/);
  });
});
