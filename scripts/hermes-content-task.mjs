#!/usr/bin/env node
/**
 * The Hermes adapter (v2 runbook R05–R07).
 *
 * This is the only place in the product that knows Hermes exists, and it is
 * deliberately incurious about it. It detects what the *installed* Hermes can
 * do, it prints the exact command it would run, and it runs that command only
 * when a person confirms a specific proposal by name.
 *
 * Three rules shape everything here:
 *
 *   1. **It never installs, updates or configures Hermes.** If Hermes is
 *      missing, or an older build lacks a flag, the script says so and stops.
 *      Fixing that is a decision a person makes about their own machine.
 *   2. **It never invents an interface.** Every capability is confirmed against
 *      the installed `--help` output before it is used, so a command that would
 *      not be understood is never sent.
 *   3. **It never builds a shell string.** Dispatch goes through `spawn` with an
 *      argument array, so proposal text — which is written by an agent, or by
 *      whoever wrote a backlog label — cannot become shell syntax.
 *
 * Usage:
 *   node scripts/hermes-content-task.mjs --check [--json]
 *   node scripts/hermes-content-task.mjs --proposal <id> [--json]        (dry run)
 *   node scripts/hermes-content-task.mjs --proposal <id> --execute --confirm <id>
 */
import { execFile, execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** Long enough for a cold start, short enough that a hung binary is obvious. */
const PROBE_TIMEOUT_MS = 10_000;

/** The board and project this product uses. Fixed, so nothing is guessed. */
export const HERMES_SLUG = 'knowledge-navigator';

/** Caps on one content task. Two hours and three attempts, then it stops. */
export const MAX_RUNTIME = '2h';
export const MAX_RETRIES = '3';

/**
 * The repository this is being run against.
 *
 * Asked of git rather than assumed from the script's own path, so the adapter
 * works the same from a checkout, a worktree, or a subdirectory — and so the
 * tests can drive it against a temporary repository instead of this one.
 */
export function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return resolve(dirname(fileURLToPath(import.meta.url)), '..');
  }
}

/**
 * What the agent is being told counts as finished.
 *
 * This is the whole reason a content task is safe to dispatch: it ends at
 * review, with the change uncommitted and a result written, and it says so in
 * the one field Hermes carries all the way to the agent.
 */
export const COMPLETION_CONTRACT = [
  'Stop at review. Write exactly the one file the proposal allows, leave it uncommitted in this worktree,',
  'and write RESULT.md saying what you wrote, every source you used and what it supports, and what you could not check.',
  'Run npm run validate, npm run compile and npm test, and report their output.',
  'Never merge, push, publish, tag, or open a pull request. Never accept, approve or apply your own proposal.',
  'This task is local-only: nothing leaves this machine and nothing is sent to a remote.',
].join(' ');

/**
 * Flags `hermes kanban create` must offer before this product will use it.
 *
 * Each one is load-bearing: the workspace and project scope the task to this
 * repository, the runtime and retry caps stop a runaway agent, and the
 * completion contract is what makes a task stop at review instead of going on.
 */
export const REQUIRED_CREATE_FLAGS = [
  '--workspace',
  '--project',
  '--max-runtime',
  '--max-retries',
  '--completion-contract',
];

/**
 * Flags this adapter will use if the installed build has them, and do without
 * if it does not. `--local-only` is the only one: when it is missing, the task
 * is still local-only, said in the completion contract and the body instead.
 */
export const OPTIONAL_CREATE_FLAGS = ['--local-only'];

/** Subcommands the top-level help must mention. */
export const REQUIRED_SUBCOMMANDS = ['project', 'kanban'];

function binary() {
  return process.env['HERMES_BIN'] ?? 'hermes';
}

/** Run the installed hermes with an argument array. Never a shell string. */
async function probe(args) {
  try {
    const { stdout, stderr } = await run(binary(), args, {
      timeout: PROBE_TIMEOUT_MS,
      maxBuffer: 8 * 1024 * 1024,
      env: process.env,
    });
    return { ok: true, text: `${stdout}\n${stderr}` };
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    return {
      ok: false,
      text: `${stdout}\n${stderr}`,
      code: error?.code,
      message: error?.message ?? String(error),
    };
  }
}

/**
 * What the installed Hermes is and what it can do.
 *
 * Reports rather than throws: a missing capability is an ordinary answer to
 * "can this machine run a content task", not an exception.
 */
export async function detectHermes() {
  const problems = [];
  const capabilities = {
    found: false,
    subcommands: Object.fromEntries(REQUIRED_SUBCOMMANDS.map((name) => [name, false])),
    createFlags: Object.fromEntries(REQUIRED_CREATE_FLAGS.map((flag) => [flag, false])),
    optionalFlags: Object.fromEntries(OPTIONAL_CREATE_FLAGS.map((flag) => [flag, false])),
  };

  const version = await probe(['--version']);
  if (!version.ok && (version.code === 'ENOENT' || /ENOENT|not found/i.test(version.message))) {
    problems.push(
      `hermes was not found (looked for ${binary()}). Install it yourself, or set HERMES_BIN to its path. This script never installs anything.`,
    );
    return { ok: false, binary: binary(), version: null, capabilities, problems };
  }
  capabilities.found = true;
  const versionText = version.text.trim().split('\n')[0]?.trim() ?? '';

  const help = await probe(['--help']);
  const helpText = help.text;
  for (const name of REQUIRED_SUBCOMMANDS) {
    const present = new RegExp(`(^|[^a-z-])${name}([^a-z-]|$)`, 'm').test(helpText);
    capabilities.subcommands[name] = present;
    if (!present) {
      problems.push(
        `the installed hermes help does not mention \`${name}\`. This is an older or different build than the one this adapter targets.`,
      );
    }
  }

  const createHelp = await probe(['kanban', 'create', '--help']);
  const createText = createHelp.text;
  if (!createHelp.ok && createText.trim() === '') {
    problems.push(
      '`hermes kanban create --help` produced nothing, so its flags could not be confirmed.',
    );
  }
  for (const flag of OPTIONAL_CREATE_FLAGS) {
    capabilities.optionalFlags[flag] = createText.includes(flag);
  }
  for (const flag of REQUIRED_CREATE_FLAGS) {
    const present = createText.includes(flag);
    capabilities.createFlags[flag] = present;
    if (!present) {
      problems.push(
        `\`hermes kanban create\` does not offer ${flag}. This adapter will not dispatch without it.`,
      );
    }
  }

  return {
    ok: problems.length === 0,
    binary: binary(),
    version: versionText === '' ? null : versionText,
    capabilities,
    problems,
  };
}

/** One-time setup a person runs themselves, printed when it is missing. */
export function manualSetupCommands() {
  return [
    `${binary()} project create --name ${HERMES_SLUG} --path ${repoRoot()}`,
    `${binary()} kanban board create --project ${HERMES_SLUG} --name ${HERMES_SLUG}`,
  ];
}

/* -------------------------------------------------------------------------- */
/* Building the task (R06)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Quote one argument for display.
 *
 * The printed command is for a person to read and, if they choose, paste. The
 * dispatched command never goes near a shell, so this is presentation only —
 * but it still has to be correct, because a half-escaped command in the
 * terminal is an invitation to run something nobody meant.
 */
export function shellQuote(value) {
  const text = String(value);
  if (text === '') return "''";
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, `'"'"'`)}'`;
}

export function shellCommand(binaryPath, args) {
  return [binaryPath, ...args].map(shellQuote).join(' ');
}

/** Read one prepared bundle. Throws a plain Error the caller reports. */
export function readProposal(proposalId, proposalsDir) {
  const dir = proposalsDir ?? join(repoRoot(), '.navigator', 'proposals', proposalId);
  const manifestPath = join(dir, 'manifest.json');
  const requestPath = join(dir, 'REQUEST.md');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `no proposal at ${dir}. Prepare one first with \`navigator proposal prepare\`.`,
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!existsSync(requestPath)) {
    throw new Error(`the proposal at ${dir} has no REQUEST.md, so there is nothing to hand over.`);
  }
  return { dir, manifest, request: readFileSync(requestPath, 'utf8') };
}

/**
 * The argument array for `hermes kanban create`.
 *
 * Built as an array and kept as one: every value below — a proposal id, a file
 * path, the whole brief — is text this product did not write, and the only
 * reason it cannot become a shell argument is that no shell is ever involved.
 */
export function buildCreateArgs({ manifest, request, localOnlySupported }) {
  const title = `Knowledge Navigator proposal ${manifest.proposalId}: write ${manifest.allowedPaths.join(', ')}`;
  const body = [
    `Proposal: ${manifest.proposalId}`,
    `Base commit: ${manifest.baseCommit}`,
    `Read HERMES_CONTENT_PROFILE.md in the repository before you start. It is the profile for this task and it is not optional.`,
    '',
    request.trim(),
  ].join('\n');

  return [
    'kanban',
    'create',
    '--project',
    HERMES_SLUG,
    '--workspace',
    repoRoot(),
    '--max-runtime',
    MAX_RUNTIME,
    '--max-retries',
    MAX_RETRIES,
    '--completion-contract',
    COMPLETION_CONTRACT,
    ...(localOnlySupported ? ['--local-only'] : []),
    '--title',
    title,
    '--body',
    body,
  ];
}

/**
 * Whether the Hermes project and board this product uses already exist.
 *
 * Both queries are read-only, and a query the installed build does not
 * understand is reported as "could not confirm" rather than as absence: this
 * script does not decide that something is missing because it failed to ask.
 */
export async function hermesSetupState() {
  const project = await probe(['project', 'list']);
  const board = await probe(['kanban', 'board', 'list']);
  return {
    projectQueryable: project.ok,
    boardQueryable: board.ok,
    projectPresent: project.ok && project.text.includes(HERMES_SLUG),
    boardPresent: board.ok && board.text.includes(HERMES_SLUG),
  };
}

async function printDryRun(proposalId, asJson, proposalsDir) {
  const detection = await detectHermes();
  const { manifest, request, dir } = readProposal(proposalId, proposalsDir);

  const localOnlySupported = detection.capabilities.optionalFlags['--local-only'] === true;
  const args = buildCreateArgs({ manifest, request, localOnlySupported });
  const setup = detection.capabilities.found
    ? await hermesSetupState()
    : {
        projectQueryable: false,
        boardQueryable: false,
        projectPresent: false,
        boardPresent: false,
      };
  const setupNeeded = !setup.projectPresent || !setup.boardPresent;

  const payload = {
    proposalId: manifest.proposalId,
    proposalDir: dir,
    status: manifest.status,
    dryRun: true,
    hermes: { binary: detection.binary, version: detection.version, ok: detection.ok },
    args,
    command: shellCommand(detection.binary, args),
    localOnlyFlag: localOnlySupported,
    setup,
    setupCommands: setupNeeded ? manualSetupCommands() : [],
    problems: detection.problems,
  };

  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return 0;
  }

  console.log(`proposal ${manifest.proposalId} (${manifest.status})`);
  console.log(`bundle   ${dir}`);
  console.log('');
  console.log('This is a dry run. Nothing has been created and no task has been dispatched.');
  console.log('');
  console.log('The command that --execute would run:');
  console.log('');
  console.log(`  ${payload.command}`);
  console.log('');
  if (!localOnlySupported) {
    console.log(
      'The installed hermes has no --local-only flag, so the completion contract and the task body say it instead.',
    );
    console.log('');
  }
  if (setupNeeded) {
    console.log('The Hermes project or board this product uses was not found. Run these once,');
    console.log('yourself, after reading them — this script never creates them:');
    console.log('');
    for (const line of manualSetupCommands()) console.log(`  ${line}`);
    console.log('');
  }
  for (const problem of detection.problems) console.log(`  FAIL  ${problem}`);
  if (detection.problems.length > 0) console.log('');
  console.log('Model and reasoning are whatever the selected Hermes profile says: `hermes kanban');
  console.log('create` exposes no flag for either, and this script does not invent one.');
  return detection.ok ? 0 : 1;
}

/* -------------------------------------------------------------------------- */
/* Dispatching (R07)                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Write the manifest back.
 *
 * The key order matches `serializeProposalManifest` in
 * `packages/core/src/proposal.ts`, which is the canonical writer; a test pins
 * the two together so this copy cannot drift. It exists because this script has
 * no build step and must run from a plain checkout.
 */
export function writeManifest(dir, manifest) {
  const ordered = {
    proposalId: manifest.proposalId,
    targetBacklogId: manifest.targetBacklogId,
    requestedTier: manifest.requestedTier,
    allowedPaths: [...manifest.allowedPaths],
    baseCommit: manifest.baseCommit,
    createdAt: manifest.createdAt,
    status: manifest.status,
  };
  if (manifest.agent !== undefined) ordered.agent = manifest.agent;
  if (manifest.rejectedReason !== undefined) ordered.rejectedReason = manifest.rejectedReason;
  writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
}

/** The task id Hermes reported, if it reported one we can recognise. */
export function taskIdFrom(stdout) {
  const text = stdout.trim();
  if (text === '') return null;
  try {
    const parsed = JSON.parse(text);
    const candidate =
      parsed?.id ?? parsed?.taskId ?? parsed?.task_id ?? parsed?.task?.id ?? parsed?.data?.id;
    return typeof candidate === 'string' && candidate.trim() !== '' ? candidate.trim() : null;
  } catch {
    return null;
  }
}

/** Run `hermes kanban create`. No shell, ever: an argument array only. */
function dispatch(binaryPath, args) {
  return new Promise((resolveResult) => {
    const child = spawn(binaryPath, args, {
      cwd: repoRoot(),
      env: process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      resolveResult({ code: null, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on('close', (code) => {
      resolveResult({ code, stdout, stderr });
    });
  });
}

function repositoryIsClean() {
  try {
    return (
      execFileSync('git', ['status', '--porcelain'], {
        cwd: repoRoot(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim() === ''
    );
  } catch {
    return false;
  }
}

/**
 * Dispatch one prepared proposal, after every guard holds.
 *
 * The order matters: nothing is spawned until the confirmation matches, the
 * proposal is prepared rather than already running, the repository is clean,
 * and the Hermes project and board this product uses already exist. Setup is
 * printed for a person to run; it is never performed here.
 */
async function execute(proposalId, confirm, asJson, proposalsDir) {
  const { dir, manifest, request } = readProposal(proposalId, proposalsDir);
  const problems = [];
  const report = (extra = {}) => {
    const payload = {
      proposalId: manifest.proposalId,
      dryRun: false,
      dispatched: false,
      taskId: null,
      status: manifest.status,
      problems,
      ...extra,
    };
    if (asJson) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    else {
      for (const problem of problems) console.error(`  FAIL  ${problem}`);
      if (!payload.dispatched) console.error('\nNothing was dispatched.');
    }
    return payload.dispatched ? 0 : 1;
  };

  if (confirm !== manifest.proposalId) {
    problems.push(
      `the confirmation does not match: --confirm ${manifest.proposalId} is required to dispatch this proposal`,
    );
    return report();
  }

  if (manifest.status !== 'prepared') {
    problems.push(
      manifest.status === 'running'
        ? `this proposal is already running${manifest.agent?.taskId ? ` as task ${manifest.agent.taskId}` : ''}. Dispatching it again would run the same work twice.`
        : `this proposal is ${manifest.status}, and only a prepared proposal can be dispatched`,
    );
    return report();
  }

  if (!repositoryIsClean()) {
    problems.push(
      'the repository is not clean. An agent works from a worktree of this commit, so uncommitted changes here would not be in it — and would be easy to mistake for its work later.',
    );
    return report();
  }

  const detection = await detectHermes();
  if (!detection.ok) {
    problems.push(...detection.problems);
    return report();
  }

  const setup = await hermesSetupState();
  if (!setup.projectPresent || !setup.boardPresent) {
    problems.push(
      'the Hermes project or board this product uses does not exist. Run these yourself, after reading them:',
      ...manualSetupCommands(),
    );
    return report({ setupCommands: manualSetupCommands() });
  }

  const args = buildCreateArgs({
    manifest,
    request,
    localOnlySupported: detection.capabilities.optionalFlags['--local-only'] === true,
  });
  const result = await dispatch(detection.binary, args);

  if (result.code !== 0) {
    problems.push(
      `hermes exited ${result.code === null ? 'without a status' : String(result.code)} and created nothing: ${result.stderr.trim().split('\n')[0] ?? ''}`,
    );
    return report();
  }

  const taskId = taskIdFrom(result.stdout);
  // Hermes accepted the task, so one exists whether or not its reply could be
  // read. The proposal moves to running either way: leaving it prepared would
  // invite a second dispatch of work that is already under way.
  writeManifest(dir, {
    ...manifest,
    status: 'running',
    agent: { name: 'hermes', ...(taskId === null ? {} : { taskId }) },
  });

  if (taskId === null) {
    problems.push(
      'hermes accepted the task but its reply could not be read as JSON, so no task id was recorded. Check the board before dispatching anything else.',
    );
  }

  const payload = {
    proposalId: manifest.proposalId,
    dryRun: false,
    dispatched: true,
    taskId,
    status: 'running',
    problems,
  };
  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    console.log(`dispatched ${manifest.proposalId}`);
    console.log(`  task     ${taskId ?? '(no id in the reply)'}`);
    console.log(`  status   running`);
    for (const problem of problems) console.log(`  NOTE  ${problem}`);
    console.log('');
    console.log('When it finishes, bring the result back with:');
    console.log(
      `  npm run navigator -- proposal import-hermes ${manifest.proposalId} --worktree <path>`,
    );
  }
  return 0;
}

function printCheck(detection, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(detection, null, 2)}\n`);
    return detection.ok ? 0 : 1;
  }

  console.log(`hermes binary   ${detection.binary}`);
  console.log(`version         ${detection.version ?? '(not reported)'}`);
  console.log('');
  for (const [name, present] of Object.entries(detection.capabilities.subcommands)) {
    console.log(`  ${present ? 'ok  ' : 'MISS'}  subcommand ${name}`);
  }
  for (const [flag, present] of Object.entries(detection.capabilities.createFlags)) {
    console.log(`  ${present ? 'ok  ' : 'MISS'}  kanban create ${flag}`);
  }
  if (detection.problems.length > 0) {
    console.log('');
    for (const problem of detection.problems) console.log(`  FAIL  ${problem}`);
    console.log('');
    console.log('Nothing was changed. This script never installs, updates or configures Hermes.');
  }
  return detection.ok ? 0 : 1;
}

async function main(argv) {
  const asJson = argv.includes('--json');

  if (argv.includes('--help') || argv.length === 0) {
    console.log(
      [
        'hermes-content-task.mjs — dispatch one reviewed proposal to Hermes',
        '',
        '  --check [--json]                    report the installed Hermes and its capabilities',
        '  --proposal <id> [--json]            print the task that would be created, and create nothing',
        '  --proposal <id> --execute --confirm <id>   dispatch it, after every guard holds',
        '',
        'This script never installs, updates or configures Hermes.',
      ].join('\n'),
    );
    return 0;
  }

  if (argv.includes('--check')) {
    return printCheck(await detectHermes(), asJson);
  }

  const proposalIndex = argv.indexOf('--proposal');
  const proposalId = proposalIndex >= 0 ? argv[proposalIndex + 1] : undefined;
  if (proposalId !== undefined) {
    const dirIndex = argv.indexOf('--proposal-dir');
    const proposalsDir = dirIndex >= 0 ? argv[dirIndex + 1] : undefined;
    try {
      if (argv.includes('--execute')) {
        const confirmIndex = argv.indexOf('--confirm');
        const confirm = confirmIndex >= 0 ? argv[confirmIndex + 1] : undefined;
        if (confirm === undefined) {
          console.error(
            `hermes-content-task.mjs: --confirm ${proposalId} is required to dispatch. Dispatching starts an agent on your machine, so it is never one flag long.`,
          );
          return 2;
        }
        return await execute(proposalId, confirm, asJson, proposalsDir);
      }
      return await printDryRun(proposalId, asJson, proposalsDir);
    } catch (error) {
      console.error(
        `hermes-content-task.mjs: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 2;
    }
  }

  console.error('hermes-content-task.mjs: nothing to do. Try --check.');
  return 2;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
