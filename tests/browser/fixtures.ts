import { test as base } from '@playwright/test';
import { DISABLED_API, FIXTURE_API } from '../../playwright.config';

/**
 * Two page fixtures, one per API. The browser is told which API to call before
 * any page script runs, so a journey never depends on which server happened to
 * start first.
 */
export const test = base.extend<{ withFixtureProvider: void; withGenerationOff: void }>({
  withFixtureProvider: [
    async ({ context }, use) => {
      await context.addInitScript((base) => {
        (window as unknown as { __NAVIGATOR_API_BASE__: string }).__NAVIGATOR_API_BASE__ = base;
      }, FIXTURE_API);
      await use();
    },
    { auto: false },
  ],
  withGenerationOff: [
    async ({ context }, use) => {
      await context.addInitScript((base) => {
        (window as unknown as { __NAVIGATOR_API_BASE__: string }).__NAVIGATOR_API_BASE__ = base;
      }, DISABLED_API);
      await use();
    },
    { auto: false },
  ],
});

export { expect } from '@playwright/test';
