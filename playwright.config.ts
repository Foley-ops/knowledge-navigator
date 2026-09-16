import { defineConfig, devices } from '@playwright/test';

/**
 * Browser acceptance tests (runbook H02).
 *
 * Three servers are started: the static site, an API using the deterministic
 * fixture provider, and a second API with generation switched off. No real
 * model is contacted, so the journeys are repeatable and fast.
 */
const WEB_PORT = 3100;
const FIXTURE_API_PORT = 8101;
const DISABLED_API_PORT = 8102;

export const BASE_URL = `http://127.0.0.1:${String(WEB_PORT)}`;
export const FIXTURE_API = `http://127.0.0.1:${String(FIXTURE_API_PORT)}/api`;
export const DISABLED_API = `http://127.0.0.1:${String(DISABLED_API_PORT)}/api`;

const apiEnvironment = (port: number, provider: string): Record<string, string> => ({
  NODE_ENV: 'development',
  ASSISTANT_PROVIDER: provider,
  DATABASE_PATH: `${process.cwd()}/data/knowledge.db`,
  CONTENT_PATH: `${process.cwd()}/content/concepts`,
  PORT: String(port),
  HOST: '127.0.0.1',
  LOG_LEVEL: 'silent',
  ALLOWED_ORIGINS: BASE_URL,
});

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] === undefined ? 0 : 1,
  reporter: process.env['CI'] === undefined ? [['list']] : [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `node apps/api/dist/server.js`,
      env: apiEnvironment(FIXTURE_API_PORT, 'fixture'),
      url: `http://127.0.0.1:${String(FIXTURE_API_PORT)}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `node apps/api/dist/server.js`,
      env: apiEnvironment(DISABLED_API_PORT, 'disabled'),
      // The disabled provider makes /api/health report 'degraded' only when the
      // index is missing; with an index present it is healthy.
      url: `http://127.0.0.1:${String(DISABLED_API_PORT)}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npx docusaurus serve --dir build --port ${String(WEB_PORT)} --host 127.0.0.1 --no-open`,
      cwd: `${process.cwd()}/apps/web`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
