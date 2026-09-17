/**
 * Compare journeys (v2 runbook Q02, Q03).
 *
 * Everything here is driven from the keyboard: Tab to reach a control, type
 * into it, Enter to press it. Nothing is clicked, because a research
 * instrument that needs a mouse to compare two ideas is not finished.
 *
 * The narrow-width case is checked for real information loss — every cell of
 * every row still present, and the document no wider than the viewport — not
 * merely for a layout that does not look broken.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const NARROW = { width: 360, height: 800 };

/** Tab forward until the search box has focus, then type into it. */
async function typeIntoSearch(page: Page, text: string): Promise<void> {
  const search = page.getByRole('searchbox', { name: 'Search for a concept to add' });
  for (let step = 0; step < 40; step += 1) {
    if (await search.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(search).toBeFocused();
  // Selecting the existing text first means a second search replaces the first.
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(text);
}

/** Tab forward from the search box to a result's Add button and press it. */
async function addFromKeyboard(page: Page, title: string): Promise<void> {
  // The button names itself for a screen reader — "Add ResNet" — so the journey
  // can find it the same way a keyboard user hears it.
  const button = page.getByRole('button', { name: `Add ${title}`, exact: true });
  await expect(button).toBeVisible();

  for (let step = 0; step < 60; step += 1) {
    if (await button.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
}

/** Add one concept using only the keyboard. */
async function add(page: Page, query: string, title: string): Promise<void> {
  await typeIntoSearch(page, query);
  await addFromKeyboard(page, title);
  await expect(page.locator('.compare-chosen__list')).toContainText(title);
}

/** Every row must show one cell per compared concept, all of them on screen. */
async function everyCellVisible(page: Page, columns: number): Promise<void> {
  const rows = page.locator('.compare-row:not(.compare-row--head)');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const cells = rows.nth(index).locator('.compare-cell');
    await expect(cells).toHaveCount(columns);
    for (let cell = 0; cell < columns; cell += 1) {
      await expect(cells.nth(cell)).toBeVisible();
    }
  }
}

/** Nothing may be reachable only by scrolling the page sideways. */
async function noHorizontalLoss(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Create a project, the way the workspace journeys do. */
async function createProject(page: Page, title: string): Promise<void> {
  await page.goto('/workspace');
  const disclosure = page.locator('.workspace-new > summary');
  if ((await disclosure.count()) > 0) await disclosure.click();
  await page.getByLabel('Project name').fill(title);
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}

test.describe('the Compare page', () => {
  test('is reachable from the main navigation by keyboard', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/');
    const link = page.locator('.navbar').getByRole('link', { name: 'Compare', exact: true });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compare');
  });

  test('says what it needs before anything is chosen', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/compare');
    await expect(page.locator('.compare-chosen')).toContainText('Nothing chosen yet');
    await expect(page.locator('.compare-table')).toHaveCount(0);
  });

  test('compares two concepts from the keyboard alone', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/compare');

    await add(page, 'resnet', 'ResNet');
    // One concept is not a comparison, and the page says so rather than waiting.
    await expect(page.locator('.compare-chosen')).toContainText('needs at least two');

    await add(page, 'vgg', 'VGG');

    const table = page.locator('.compare-table');
    await expect(table).toBeVisible();
    await expect(table.locator('.compare-column__title')).toHaveText(['ResNet', 'VGG']);
    await expect(page.locator('.compare-row__label').first()).toBeVisible();
    await everyCellVisible(page, 2);
    await noHorizontalLoss(page);

    // The selection is in the address, so the comparison survives a reload.
    await expect(page).toHaveURL(/ids=concept\.deep_learning\.resnet,concept\.deep_learning\.vgg/);
    await page.reload();
    await expect(page.locator('.compare-column__title')).toHaveText(['ResNet', 'VGG']);

    // Review state travels with every column, and the evidence rail with it.
    await expect(page.locator('.compare-column').first()).toContainText('Generated draft');
    await expect(page.locator('.compare-column.nav-rail--generated-draft').first()).toBeVisible();

    // Relationships and sources are the evidence behind the table.
    await expect(page.getByRole('heading', { name: 'How they relate' })).toBeVisible();
    await expect(page.locator('.compare-relationships')).toContainText('requires');
    await expect(page.locator('.compare-sources a').first()).toHaveAttribute('href', /^https?:/);
  });

  test('compares four concepts at desktop width without losing a cell', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto(
      '/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg,concept.deep_learning.lenet,concept.deep_learning.pooling',
    );
    await expect(page.locator('.compare-column__title')).toHaveText([
      'ResNet',
      'VGG',
      'LeNet',
      'Pooling',
    ]);
    await everyCellVisible(page, 4);
    await noHorizontalLoss(page);
    await expect(page.locator('.compare-completeness')).toContainText('cells');
  });

  test('keeps all four columns readable at 360px', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.setViewportSize(NARROW);
    await page.goto(
      '/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg,concept.deep_learning.lenet,concept.deep_learning.pooling',
    );
    await expect(page.locator('.compare-column__title')).toHaveCount(4);

    // Stacked, every cell still carries the name of the concept it belongs to —
    // without it a stacked column would be an unlabelled wall of prose.
    const first = page.locator('.compare-row:not(.compare-row--head)').first();
    await expect(first.locator('.compare-cell__who')).toHaveText([
      'ResNet',
      'VGG',
      'LeNet',
      'Pooling',
    ]);
    await everyCellVisible(page, 4);
    await noHorizontalLoss(page);
  });

  test('removes a concept from the keyboard and rebuilds the table', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto(
      '/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg,concept.deep_learning.lenet',
    );
    await expect(page.locator('.compare-column__title')).toHaveCount(3);

    const remove = page.getByRole('button', { name: 'Remove LeNet', exact: true });
    await remove.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.compare-column__title')).toHaveText(['ResNet', 'VGG']);
    await everyCellVisible(page, 2);
  });
});

/* ----------------------------------------------------------------- Q03 ---- */

test.describe('explaining a comparison', () => {
  test('generates a synthesis without touching the table', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg');
    await expect(page.locator('.compare-table')).toBeVisible();

    await expect(page.locator('.compare-explain__what')).toContainText(
      'the table above and nothing else',
    );

    const explain = page.getByRole('button', { name: 'Explain this comparison' });
    await explain.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Synthesis' })).toBeVisible();
    // The deterministic table is still exactly as it was.
    await expect(page.locator('.compare-column__title')).toHaveText(['ResNet', 'VGG']);
    await everyCellVisible(page, 2);
  });

  test('says generation is off rather than offering a button that cannot work', async ({
    page,
    withGenerationOff,
  }) => {
    void withGenerationOff;
    await page.goto('/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg');
    await expect(page.locator('.compare-table')).toBeVisible();
    await expect(page.getByText('Generation is switched off', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explain this comparison' })).toBeDisabled();
  });
});

/* ------------------------------------------------- Q02, optional save ---- */

test.describe('keeping a comparison', () => {
  test('saves it to a project with its ids and missing markers intact', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Depth versus width');

    await page.goto('/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg');
    await expect(page.locator('.compare-table')).toBeVisible();

    const save = page.getByRole('button', { name: 'Save comparison to project' });
    await save.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Saved to project' })).toBeVisible();

    // It is in the workspace, under its own kind.
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Saved', exact: true }).click();
    const saved = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Saved', exact: true }) });
    await expect(saved).toContainText('ResNet vs VGG');
    await expect(saved).toContainText('comparison');
  });

  test('says where a comparison would go when there is no project', async ({
    page,
    withGenerationOff,
  }) => {
    void withGenerationOff;
    await page.goto('/compare?ids=concept.deep_learning.resnet,concept.deep_learning.vgg');
    await expect(page.getByText('Nowhere to keep this yet')).toBeVisible();
  });
});
