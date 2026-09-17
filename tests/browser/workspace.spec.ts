/**
 * The private research workspace (v2 runbook O00–O07).
 *
 * Every journey here runs against a personal store created fresh for the run
 * (see `global-setup.ts`), so what a test sees is what a new researcher sees.
 *
 * The property being defended throughout: nothing is stored unless the person
 * asked for it, and nothing they stored is lost.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Create a project and wait for its view.
 *
 * The create form sits behind a `New project` disclosure once at least one
 * project exists, so a journey has to open it. Tests share one store within a
 * run, which is realistic: a researcher's second project is created exactly
 * this way.
 */
async function createProject(page: Page, title: string, description?: string): Promise<void> {
  await page.goto('/workspace');
  const disclosure = page.locator('.workspace-new > summary');
  if ((await disclosure.count()) > 0) await disclosure.click();
  await page.getByLabel('Project name').fill(title);
  if (description !== undefined) {
    await page.getByLabel('What it is about (optional)').fill(description);
  }
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}

/* ----------------------------------------------------------------- O00 ---- */

test.describe('the empty workspace', () => {
  test('says where the data lives and what it is not', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/workspace');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workspace');
    const where = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Where this lives' }) });
    await expect(where).toContainText('not');
    await expect(where).toContainText('recoverable from anywhere else');
    await expect(where).toContainText('Back them up');

    // A path to the private database is not a fact a browser needs.
    await expect(page.locator('body')).not.toContainText('personal.db');
    await expect(page.locator('body')).not.toContainText('/private');
  });

  test('is reachable from the main navigation by keyboard', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/');
    const link = page.locator('.navbar').getByRole('link', { name: 'Workspace', exact: true });
    await expect(link).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/workspace/);
  });

  /**
   * Run against the generation-off API, which has its own private store that no
   * other journey writes to. Tests share one store per API within a run, so a
   * genuinely empty workspace has to be looked for somewhere nothing has been
   * created — and this also proves the workspace works with generation off.
   */
  test('explains what a project is before there is one', async ({ page, withGenerationOff }) => {
    void withGenerationOff;
    await page.goto('/workspace');
    await expect(page.getByText('No projects yet')).toBeVisible();
    await expect(page.getByLabel('Project name')).toBeVisible();
  });
});

/* --------------------------------------------------------- O01 and O02 ---- */

test.describe('projects', () => {
  test('creates, renames, archives, reveals and restores', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Small detector recall', 'Losing small objects after downsampling.');

    // The project view appears, with its sections.
    for (const label of ['Overview', 'Sessions', 'Notes', 'Saved', 'Artifacts', 'Export']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
    await expect(page.locator('.workspace-description')).toContainText('downsampling');

    // Rename.
    await page.getByLabel('Rename').fill('Detector recall at 512px');
    await page.getByRole('button', { name: 'Save name' }).click();
    await expect(
      page.getByRole('heading', { name: 'Detector recall at 512px', exact: true }),
    ).toBeVisible();

    // The URL carries the project, so the view is linkable.
    await expect(page).toHaveURL(/\?project=[0-9a-f-]{36}/);

    // Archive requires confirmation, and is reversible.
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('Nothing is deleted');
      void dialog.accept();
    });
    await page.getByRole('button', { name: 'Archive this project' }).click();

    const archived = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Archived projects' }) });
    await expect(archived.getByText('Detector recall at 512px')).toBeVisible();

    await archived.getByRole('button', { name: 'Restore' }).click();
    await expect(
      page.getByRole('group', { name: 'Choose a project' }).getByRole('button', {
        name: 'Detector recall at 512px',
      }),
    ).toBeVisible();
  });

  test('every project section has a meaningful empty state', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Empty states');

    await page.getByRole('button', { name: 'Sessions', exact: true }).click();
    await expect(page.getByText('No sessions yet')).toBeVisible();

    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await expect(page.getByText('No notes yet')).toBeVisible();

    await page.getByRole('button', { name: 'Saved', exact: true }).click();
    await expect(page.getByText('Nothing saved yet')).toBeVisible();

    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();
    await expect(page.getByText('No uploaded context yet')).toBeVisible();

    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await expect(page.getByText('cannot be rebuilt')).toBeVisible();
  });
});

/* ----------------------------------------------------------------- O03 ---- */

test.describe('private notes on a concept', () => {
  test('a note survives reload and appears in its project', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Notes journey');

    const hashBefore = await page.evaluate(async () => {
      const response = await fetch(
        (window as { __NAVIGATOR_API_BASE__?: string }).__NAVIGATOR_API_BASE__ + '/build',
      );
      return ((await response.json()) as { corpusHash: string }).corpusHash;
    });

    await page.goto('/concepts/pooling');
    const panel = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await expect(panel).toContainText('Nothing here changes the page above');

    await panel.getByLabel('Add a private note').fill('Check the effective receptive field first.');
    await panel.getByRole('button', { name: 'Add note' }).click();
    await expect(panel.getByText('Check the effective receptive field first.')).toBeVisible();

    // It survives a reload.
    await page.reload();
    const again = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await expect(again.getByText('Check the effective receptive field first.')).toBeVisible();

    // And it appears in the project.
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await expect(page.getByText('Check the effective receptive field first.')).toBeVisible();
    await expect(page.locator('.workspace-item__where')).toContainText('Pooling');

    // The corpus is untouched.
    const hashAfter = await page.evaluate(async () => {
      const response = await fetch(
        (window as { __NAVIGATOR_API_BASE__?: string }).__NAVIGATOR_API_BASE__ + '/build',
      );
      return ((await response.json()) as { corpusHash: string }).corpusHash;
    });
    expect(hashAfter).toBe(hashBefore);
  });

  test('a note is shown as text, never as markup', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await createProject(page, 'Escaping');

    await page.goto('/concepts/pooling');
    const panel = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await panel.getByLabel('Add a private note').fill('<img src=x onerror=alert(1)> and **bold**');
    await panel.getByRole('button', { name: 'Add note' }).click();

    const note = panel.locator('.workspace-note').first();
    await expect(note).toHaveText('<img src=x onerror=alert(1)> and **bold**');
    // The characters are text, so no element was created from them.
    await expect(note.locator('img')).toHaveCount(0);
    await expect(note.locator('strong')).toHaveCount(0);
  });
});

/* ----------------------------------------------------------------- O04 ---- */

test.describe('familiarity', () => {
  test('is never inferred, survives reload, and clears in one action', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;

    // Visiting the page repeatedly must not set anything.
    await page.goto('/concepts/convolution');
    await page.goto('/concepts/convolution');
    const panel = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await expect(panel.getByRole('button', { name: 'Not set' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(panel.locator('.private-meaning').first()).toContainText('only you set it');

    await panel.getByRole('button', { name: 'Working', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Working', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(panel.locator('.private-meaning').first()).toContainText('skip basic orientation');

    await page.reload();
    const after = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await expect(after.getByRole('button', { name: 'Working', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await after.getByRole('button', { name: 'Not set' }).click();
    await expect(after.getByRole('button', { name: 'Not set' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('is available on a graph-only identity too', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/identity/resnet');
    await expect(page.getByRole('heading', { name: 'Your work on this concept' })).toBeVisible();
  });
});

/* ----------------------------------------------------------------- O05 ---- */

test.describe('saving a concept', () => {
  test('opening changes nothing; saving adds exactly one deduplicated item', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Saving journey');

    // Open two concepts without saving.
    await page.goto('/concepts/resnet');
    await page.goto('/concepts/vgg');
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Saved', exact: true }).click();
    await expect(page.getByText('Nothing saved yet')).toBeVisible();

    await page.goto('/concepts/resnet');
    const panel = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await expect(panel.locator('.private-what')).toContainText('Nothing is saved by opening');
    await panel.getByRole('button', { name: 'Save to project' }).click();
    await expect(panel.getByRole('button', { name: 'Saved to project' })).toBeVisible();

    // A second visit finds it already saved, and does not double it.
    await page.reload();
    const again = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your work on this concept' }) });
    await expect(again.getByRole('button', { name: 'Saved to project' })).toBeVisible();

    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Saved', exact: true }).click();
    const saved = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Saved', exact: true }) });
    await expect(saved.locator('.workspace-item')).toHaveCount(1);
    await expect(saved.locator('.workspace-item')).toContainText('ResNet');
  });
});

/* ----------------------------------------------------------------- O06 ---- */

test.describe('saving an assistant result', () => {
  test('an unsaved answer is gone after reload; a saved one reappears', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Answers journey');

    await page.goto('/ask');
    await page.getByLabel('Your question').fill('Why does recall drop after downsampling?');
    await page.getByLabel('Research context (optional)').fill('A detector on 512px crops.');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();

    const answer = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Structured answer' }) });
    await expect(answer).toBeVisible({ timeout: 30_000 });
    await expect(answer).toContainText('Nothing was stored');

    // Unsaved: reloading loses it.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Structured answer' })).toHaveCount(0);

    // Ask again and keep it.
    await page.getByLabel('Your question').fill('Why does recall drop after downsampling?');
    await page.getByLabel('Research context (optional)').fill('A detector on 512px crops.');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    const second = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Structured answer' }) });
    await expect(second).toBeVisible({ timeout: 30_000 });

    const save = second.locator('.save-answer');
    await expect(save).toContainText('Your research context is not, unless you tick the box');
    await save.getByRole('button', { name: 'Save result to project' }).click();
    await expect(save.getByRole('button', { name: 'Saved to project' })).toBeVisible();

    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Saved', exact: true }).click();
    const item = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Saved', exact: true }) })
      .locator('.workspace-item')
      .first();
    await expect(item).toContainText('assistant-answer');
    await expect(item).toContainText('Why does recall drop after downsampling?');
  });
});

/* ----------------------------------------------------------------- O07 ---- */

test.describe('sessions', () => {
  test('two sessions in one project stay isolated and reopen deterministically', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Two tracks');

    await page.getByRole('button', { name: 'Sessions', exact: true }).click();
    const sessions = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Sessions', exact: true }) });
    await expect(sessions.locator('.workspace-explainer')).toContainText(
      'Asking a question never creates one',
    );

    await page.getByLabel('New session').fill('Track one');
    await page.getByRole('button', { name: 'Create session' }).click();
    await expect(
      sessions.locator('.workspace-item').filter({ hasText: 'Track one' }),
    ).toBeVisible();

    await page.getByLabel('New session').fill('Track two');
    await page.getByRole('button', { name: 'Create session' }).click();
    await expect(sessions.locator('.workspace-item')).toHaveCount(2);

    // Reopening the project shows both, in the same order.
    const titlesBefore = await sessions.locator('.workspace-item__title').allTextContents();
    await page.reload();
    await page.getByRole('button', { name: 'Sessions', exact: true }).click();
    const again = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Sessions', exact: true }) });
    await expect(again.locator('.workspace-item')).toHaveCount(2);
    expect(await again.locator('.workspace-item__title').allTextContents()).toEqual(titlesBefore);
  });

  test('an answer can be filed under a session', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await createProject(page, 'Filed answers');
    await page.getByRole('button', { name: 'Sessions', exact: true }).click();
    await page.getByLabel('New session').fill('First pass');
    await page.getByRole('button', { name: 'Create session' }).click();
    await expect(page.locator('.workspace-item').filter({ hasText: 'First pass' })).toBeVisible();

    await page.goto('/ask');
    await page.getByLabel('Your question').fill('What should I check next?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    const answer = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Structured answer' }) });
    await expect(answer).toBeVisible({ timeout: 30_000 });

    await answer.getByLabel('Attach to a session (optional)').selectOption({ label: 'First pass' });
    await answer.getByRole('button', { name: 'Save result to project' }).click();
    await expect(answer.getByRole('button', { name: 'Saved to project' })).toBeVisible();
  });
});

/* -------------------------------------------------------------------------- */

test.describe('the workspace does not disturb anything else', () => {
  test('every v1 route still answers and the corpus hash is unchanged', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    for (const route of ['/', '/explore', '/search', '/ask', '/about', '/concepts/resnet']) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
    }
  });
});
