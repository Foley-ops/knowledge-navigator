/**
 * Build-a-path journeys (v2 runbook Q06).
 *
 * The four cases the checkpoint names: a route the corpus supports, a target it
 * supports no route to, a route personalised by familiarity the researcher
 * recorded, and a route whose step is a graph-only identity with no article.
 *
 * The graph-only case is served from a stubbed API response. The acceptance
 * corpus deliberately holds no Tier 3 identity — the coverage journeys assert
 * that count is zero — so inventing one to make a journey pass would corrupt
 * the corpus to suit a test. What is asserted here is what this page does with
 * such a step; that the API produces it is proven against a compiled mixed-tier
 * corpus in apps/api/tests/compare-paths.test.ts.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const RESNET = 'concept.deep_learning.resnet';

/** Tab to the target search box and type, exactly as a keyboard user would. */
async function chooseTarget(page: Page, query: string, title: string): Promise<void> {
  const search = page.getByRole('searchbox', { name: 'Search for the concept you want to reach' });
  for (let step = 0; step < 40; step += 1) {
    if (await search.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(search).toBeFocused();
  await page.keyboard.type(query);

  const choose = page.getByRole('button', { name: `Choose ${title}`, exact: true });
  await expect(choose).toBeVisible();
  for (let step = 0; step < 60; step += 1) {
    if (await choose.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(choose).toBeFocused();
  await page.keyboard.press('Enter');
}

async function createProject(page: Page, title: string): Promise<void> {
  await page.goto('/workspace');
  const disclosure = page.locator('.workspace-new > summary');
  if ((await disclosure.count()) > 0) await disclosure.click();
  await page.getByLabel('Project name').fill(title);
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}

/** Set, or clear, the familiarity level on one concept page. */
async function setFamiliarity(page: Page, slug: string, level: string): Promise<void> {
  await page.goto(slug);
  const panel = page
    .locator('.nav-section')
    .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
  await panel.getByRole('button', { name: level, exact: true }).click();
  await expect(panel.getByRole('button', { name: level, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

test.describe('a route the corpus supports', () => {
  test('is built from the keyboard and explains every step', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/path');
    await expect(page.getByText('Choose a destination')).toBeVisible();

    await chooseTarget(page, 'resnet', 'ResNet');

    const steps = page.locator('.path-step');
    await expect(steps).toHaveCount(10);
    await expect(steps.last().locator('.path-step__title')).toHaveText('Step 10: ResNet');
    await expect(steps.last().locator('.path-step__because')).toHaveText(
      'This is what you are working towards.',
    );

    // Every step before the destination says which page put it there.
    await expect(steps.first().locator('.path-step__because')).toContainText('Comes before');
    await expect(steps.first().locator('.path-step__because')).toContainText('requires');

    // Canonical links, and the reading order, are both present.
    await expect(steps.first().getByRole('link')).toHaveAttribute('href', /\/concepts\//);
    await expect(page.locator('.path-count')).toContainText('10 steps');

    // The target is in the address, so a route can be shared and reloaded.
    await expect(page).toHaveURL(new RegExp(`target=${RESNET.replace(/\./g, '\\.')}`));
    await page.reload();
    await expect(page.locator('.path-step')).toHaveCount(10);
  });

  test('shortens when the researcher says they already know a step', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto(`/path?target=${RESNET}`);
    await expect(page.locator('.path-step')).toHaveCount(10);

    const know = page.getByRole('button', { name: 'I already know this — Pooling', exact: true });
    await know.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.path-step')).toHaveCount(9);
    await expect(page.locator('.path-steps')).not.toContainText('Pooling');
    await expect(
      page
        .locator('.nav-section')
        .filter({ has: page.getByRole('heading', { name: 'Starting from what you know' }) }),
    ).toContainText('you said you know it');

    // And it can be put back, because a route the researcher cannot undo is a
    // route they will stop trusting.
    await page.getByRole('button', { name: 'Put back Pooling', exact: true }).first().click();
    await expect(page.locator('.path-step')).toHaveCount(10);
  });
});

test.describe('a target the corpus records no route to', () => {
  test('says so instead of arranging related concepts', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/path?target=concept.analysis.convolution');

    await expect(page.getByRole('heading', { name: 'No route is recorded' })).toBeVisible();
    await expect(page.locator('.path-count')).toContainText(
      'Nothing in this corpus declares a prerequisite',
    );
    await expect(page.locator('.path-count')).toContainText('nobody checked');
    await expect(page.locator('.path-step')).toHaveCount(0);

    // What is missing is named, and points at where that is tracked.
    const missing = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'What the graph does not say' }) });
    await expect(missing).toContainText('records no route to it');
    await expect(missing.getByRole('link', { name: 'coverage map' })).toBeVisible();
  });
});

test.describe('a route personalised by familiarity', () => {
  test('drops a strong concept and says which record did it', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Route personalisation');
    await setFamiliarity(page, '/concepts/pooling', 'Strong');

    await page.goto(`/path?target=${RESNET}`);
    // Familiarity is not used until the researcher points at a project.
    await expect(page.locator('.path-step')).toHaveCount(10);

    const use = page.getByRole('checkbox', { name: /Use the familiarity I recorded in/ });
    await use.check();

    await expect(page.locator('.path-step')).toHaveCount(9);
    await expect(page.locator('.path-steps')).not.toContainText('Pooling');

    const changed = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'What your records changed' }) });
    await expect(changed).toContainText('Pooling');
    await expect(changed).toContainText('treated as a starting point');

    // Leave the shared store as it was found.
    await setFamiliarity(page, '/concepts/pooling', 'Not set');
  });
});

test.describe('a route through a graph-only identity', () => {
  test('marks the step as having no article and does not link it', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.route('**/api/paths', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requestId: 'stub',
          targetId: RESNET,
          targetTitle: 'ResNet',
          reachable: true,
          steps: [
            {
              conceptId: 'concept.deep_learning.mamba',
              title: 'Mamba',
              slug: '/identity/mamba',
              hasArticle: false,
              tier: 3,
              reviewState: 'generated-draft',
              summary: 'A selective state-space sequence model.',
              position: 1,
              because: {
                beforeId: 'concept.deep_learning.mamba',
                afterId: RESNET,
                type: 'requires',
                declaredBy: RESNET,
                note: null,
                condition: null,
              },
              familiarity: null,
              likelyKnown: false,
            },
            {
              conceptId: RESNET,
              title: 'ResNet',
              slug: '/concepts/resnet',
              hasArticle: true,
              tier: 1,
              reviewState: 'generated-draft',
              summary: 'A deep residual network.',
              position: 2,
              because: null,
              familiarity: null,
              likelyKnown: false,
            },
          ],
          startedFrom: [],
          familiarityEffects: [],
          missing: [],
          edges: [],
          truncated: false,
          familiarityAvailable: true,
        }),
      });
    });

    await page.goto(`/path?target=${RESNET}`);
    const first = page.locator('.path-step').first();
    await expect(first.locator('.path-step__title')).toHaveText('Step 1: Mamba');
    await expect(first).toContainText('a stable address with no article');
    // Nothing pretends there is a page to read.
    await expect(first.locator('.path-step__title a')).toHaveCount(0);
    await expect(page.locator('.path-step').last().locator('.path-step__title a')).toHaveCount(1);
  });
});

/* ----------------------------------------------------------------- Q07 ---- */

test.describe('keeping a route', () => {
  test('saves it to a project and shows the command that exports it', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Route keeping');

    await page.goto(`/path?target=${RESNET}`);
    await expect(page.locator('.path-step')).toHaveCount(10);

    const save = page.getByRole('button', { name: 'Save route to project' });
    await save.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Saved to project' })).toBeVisible();

    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Saved', exact: true }).click();
    const saved = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Saved', exact: true }) });
    await expect(saved).toContainText('Path to ResNet');
    // The export is an explicit command, and the page says exactly what it is.
    await expect(saved.locator('.workspace-export')).toContainText('navigator export saved');
  });
});
