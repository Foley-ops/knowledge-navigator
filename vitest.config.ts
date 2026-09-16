import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Tests exercise the core sources directly so a stale dist/ can never
      // make a failing implementation look green.
      '@navigator/core': `${root}packages/core/src/index.ts`,
    },
  },
  test: {
    environment: 'node',
    include: ['packages/*/tests/**/*.test.ts', 'apps/api/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/browser/**'],
    globals: false,
    reporters: ['default'],
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
