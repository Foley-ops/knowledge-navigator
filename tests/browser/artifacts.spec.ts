/**
 * Local research context in the browser (v2 runbook P06, P08).
 *
 * Files are created in memory and handed to the file input the way a person
 * would choose them. Nothing on disk is read, and no fixture is executed.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

/** Open a disclosure if it is closed, rather than toggling it blindly. */
async function ensureOpen(details: Locator): Promise<void> {
  if ((await details.getAttribute('open')) === null) {
    await details.locator('summary').click();
  }
}

async function createProject(page: Page, title: string): Promise<void> {
  await page.goto('/workspace');
  const disclosure = page.locator('.workspace-new > summary');
  if ((await disclosure.count()) > 0) await disclosure.click();
  await page.getByLabel('Project name').fill(title);
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}

async function choose(
  page: Page,
  name: string,
  contents: string,
  mimeType = 'text/plain',
): Promise<void> {
  await page.getByLabel('Choose a file').setInputFiles({
    name,
    mimeType,
    buffer: Buffer.from(contents, 'utf8'),
  });
}

const NOTEBOOK = JSON.stringify({
  cells: [
    { cell_type: 'markdown', source: '# Recall experiment\n' },
    {
      cell_type: 'code',
      source: 'print(model)\n',
      outputs: [{ output_type: 'stream', text: 'SENTINEL-BROWSER-OUTPUT-2f7d\n' }],
    },
  ],
  metadata: { language_info: { name: 'python' } },
});

/* ----------------------------------------------------------------- P06 ---- */

test.describe('uploading local context', () => {
  test('says what happens to the file before you choose one', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Artifacts journey');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();

    const section = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Artifacts', exact: true }) });
    await expect(section).toContainText('the file itself is not stored');
    await expect(section).toContainText('Nothing is executed');
    await expect(section).toContainText('there is no OCR here');
    await expect(page.getByText('No uploaded context yet')).toBeVisible();
  });

  test('uploads a text file, shows its metadata, previews and archives it', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Text upload');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();

    await choose(page, 'recall.md', '# Recall\n\nMeasured at 512px on a small detector.\n');

    const item = page.locator('.workspace-item').first();
    await expect(item).toContainText('recall.md');
    await expect(item).toContainText('characters extracted');
    await expect(page.locator('.private-message')).toContainText('characters extracted');

    await item.getByRole('button', { name: 'Show extracted text' }).click();
    await expect(page.locator('.artifact-preview')).toContainText('Measured at 512px');

    // Archiving reveals the archived list straight away, rather than hiding
    // the artifact somewhere the researcher has to go looking for it.
    await item.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('No uploaded context yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide' })).toBeVisible();

    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(page.locator('.workspace-item').first()).toContainText('recall.md');
  });

  test('uploads a notebook and keeps none of its output', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await createProject(page, 'Notebook upload');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();

    await choose(page, 'experiment.ipynb', NOTEBOOK, 'application/json');
    const item = page.locator('.workspace-item').first();
    await expect(item).toContainText('experiment.ipynb');
    await expect(item.locator('.artifact-warnings')).toContainText('outputs');

    await item.getByRole('button', { name: 'Show extracted text' }).click();
    const preview = page.locator('.artifact-preview');
    await expect(preview).toContainText('# Recall experiment');
    await expect(preview).not.toContainText('SENTINEL-BROWSER-OUTPUT-2f7d');
  });

  test('refuses an unsupported file and says why', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await createProject(page, 'Refusals');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();

    await choose(page, 'deck.pptx', 'anything', 'application/vnd.ms-powerpoint');
    await expect(page.getByText('That file was not accepted')).toBeVisible();
    await expect(page.locator('.nav-state--problem')).toContainText('are not read');
    await expect(page.getByText('No uploaded context yet')).toBeVisible();
  });

  test('the same file twice is one artifact', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await createProject(page, 'Duplicates');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();

    await choose(page, 'a.txt', 'identical contents');
    await expect(page.locator('.workspace-item')).toHaveCount(1);
    await choose(page, 'renamed.txt', 'identical contents');
    await expect(page.locator('.private-message')).toContainText('already here');
    await expect(page.locator('.workspace-item')).toHaveCount(1);
  });
});

/* ------------------------------------------------------------ P07, P08 ---- */

test.describe('using private context in a question', () => {
  test('nothing is sent unless it is ticked, and provenance says what was', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Context journey');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();
    await choose(page, 'unpublished.md', 'My unpublished result about small-object recall.\n');
    await expect(page.locator('.workspace-item').first()).toContainText('unpublished.md');

    await page.goto('/ask');
    const picker = page.locator('.private-picker');
    await expect(picker).toBeVisible();
    await ensureOpen(picker);
    await expect(picker).toContainText('Nothing here is sent unless you tick it');
    await expect(picker).toContainText('can never be cited');
    await expect(picker.getByText('characters', { exact: false }).first()).toBeVisible();

    // Ask without ticking: no private context at all.
    await page.getByLabel('Your question').fill('Why does recall drop after downsampling?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(
      page.locator('.nav-section').filter({
        has: page.getByRole('heading', { name: 'Structured answer' }),
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Private context used' })).toHaveCount(0);

    // Now tick it and ask again.
    await ensureOpen(picker);
    await picker.getByRole('checkbox').first().check();
    await expect(picker.locator('.nav-badge')).toContainText('1 selected');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();

    const used = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Private context used' }) });
    await expect(used).toBeVisible({ timeout: 30_000 });
    await expect(used).toContainText('unpublished.md');
    await expect(used).toContainText('not canonical evidence');
    await expect(used).toContainText('not cited above');
  });

  test('private context is visually and structurally separate from citations', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Separation');
    await page.getByRole('button', { name: 'Artifacts', exact: true }).click();
    await choose(page, 'mine.md', 'A private note about my own experiment.\n');
    await expect(page.locator('.workspace-item').first()).toBeVisible();

    await page.goto('/ask');
    const picker = page.locator('.private-picker');
    await ensureOpen(picker);
    await picker.getByRole('checkbox').first().check();
    await page.getByLabel('Your question').fill('Why does recall drop after downsampling?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();

    const used = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Private context used' }) });
    await expect(used).toBeVisible({ timeout: 30_000 });

    // The two are different sections, with different headings and rules.
    const evidence = page.locator('.nav-section').filter({
      has: page.getByRole('heading', { name: 'The canonical material this was drawn from' }),
    });
    await expect(evidence).toBeVisible();
    await expect(used.locator('.private-used')).toBeVisible();
    await expect(evidence.locator('.private-used')).toHaveCount(0);

    // No citation points at the private material.
    const citations = page.locator('.answer__list a');
    const count = await citations.count();
    for (let index = 0; index < count; index += 1) {
      await expect(citations.nth(index)).not.toHaveText(/mine\.md/);
    }
  });

  test('says plainly when a project has nothing to offer', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await createProject(page, 'Nothing to offer');
    await page.goto('/ask');
    const picker = page.locator('.private-picker');
    await ensureOpen(picker);
    await expect(picker).toContainText('no uploaded papers or notes yet');
  });
});
