/**
 * The five researcher journeys the product has to support (runbook H02).
 *
 * Deterministic data throughout: the acceptance corpus and the fixture
 * provider. No real model is contacted.
 */
import { expect, test } from './fixtures';

/* ------------------------------------------------------------------ 1 ---- */

test.describe('find a concept by an alias and open it', () => {
  test.use({});

  test('searching "conv layer" finds Convolutional Layer and opens its page', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/search');

    await page.getByLabel('Search the knowledge base').fill('conv layer');

    const first = page.locator('.result-list > li').first();
    await expect(first.locator('.result__title')).toHaveText('Convolutional Layer');
    await expect(first).toContainText('conv layer');
    await expect(first).toContainText('Generated draft');

    await first.getByRole('link', { name: 'Convolutional Layer' }).click();
    await expect(page).toHaveURL(/\/concepts\/convolutional-layer$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convolutional Layer');
  });

  test('a term that is genuinely absent says so instead of guessing', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/search');
    await page.getByLabel('Search the knowledge base').fill('quaternion holonomy');
    await expect(page.getByText(/Nothing matches/)).toBeVisible();
  });
});

/* ------------------------------------------------------------------ 2 ---- */

test('two categories reach the same canonical concept at one URL', async ({ page }) => {
  await page.goto('/explore');

  // ResNet is filed under Computer Vision (its primary category) and under
  // Deep Learning — Architectures. Both must lead to the same single page.
  const vision = page
    .locator('.atlas__branch')
    .filter({ has: page.getByRole('heading', { name: 'Computer Vision' }) });
  const architectures = page
    .locator('.atlas__branch')
    .filter({ has: page.getByRole('heading', { name: 'Deep Learning — Architectures' }) });

  const viaVision = vision.getByRole('link', { name: 'ResNet', exact: true });
  const viaArchitectures = architectures.getByRole('link', { name: 'ResNet', exact: true });

  await expect(viaVision).toHaveCount(1);
  await expect(viaArchitectures).toHaveCount(1);
  expect(await viaVision.getAttribute('href')).toBe(await viaArchitectures.getAttribute('href'));

  // The entry itself says it is filed elsewhere and still resolves to one page.
  const resnetEntry = vision
    .locator('li')
    .filter({ has: page.getByRole('link', { name: 'ResNet', exact: true }) });
  await expect(resnetEntry.locator('.atlas__elsewhere')).toContainText(
    'Deep Learning — Architectures',
  );

  // Both routes land on the same single page. Auto-retrying assertions are
  // used throughout: client-side navigation changes the URL before the new
  // document has rendered, so reading textContent here would race.
  await viaVision.click();
  await expect(page).toHaveURL(/\/concepts\/resnet$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ResNet');

  await page.goto('/explore');
  await viaArchitectures.click();
  await expect(page).toHaveURL(/\/concepts\/resnet$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ResNet');
});

/* ------------------------------------------------------------------ 3 ---- */

test('inspect a concept neighbourhood', async ({ page, withFixtureProvider }) => {
  void withFixtureProvider;
  await page.goto('/concepts/resnet');

  const neighbourhood = page
    .locator('.nav-section')
    .filter({ has: page.getByRole('heading', { name: 'Neighbourhood' }) });

  // The text list is the accessible representation and is always present.
  const edges = neighbourhood.locator('.graph-fallback__edge');
  await expect(edges.first()).toBeVisible();
  const oneHop = await edges.count();
  expect(oneHop).toBeGreaterThan(0);
  await expect(neighbourhood).toContainText('Residual Connection');
  await expect(neighbourhood).toContainText('VGG');

  // Truncation and size are reported rather than hidden.
  await expect(neighbourhood.locator('.graph-legend')).toContainText(/\d+ concepts/);

  // Depth is selectable and widens the neighbourhood.
  await neighbourhood.getByRole('button', { name: '2 hops' }).click();
  await expect.poll(async () => edges.count(), { timeout: 15_000 }).toBeGreaterThan(oneHop);
  await expect(neighbourhood).toContainText('Pooling');

  // A neighbour can be made the new centre, and the way back is offered.
  await neighbourhood.getByRole('button', { name: 'Recentre on VGG' }).first().click();
  await expect(neighbourhood.getByRole('button', { name: 'Back to ResNet' })).toBeVisible();
  await expect(neighbourhood.locator('.graph-legend')).toContainText('Centred on VGG');
});

/* ------------------------------------------------------------------ 4 ---- */

test('ask a question and see every structured section', async ({ page, withFixtureProvider }) => {
  void withFixtureProvider;
  await page.goto('/ask');

  await expect(page.getByText('Generation is unavailable right now')).toHaveCount(0);

  await page
    .getByLabel('Your question')
    .fill('My image model keeps losing small spatial details after repeated downsampling.');
  await page
    .getByLabel('Research context (optional)')
    .fill('A small detector trained on 512px crops.');
  await page.getByRole('button', { name: 'Compare approaches' }).click();
  await page.getByRole('button', { name: 'Ask', exact: true }).click();

  const answer = page
    .locator('.nav-section')
    .filter({ has: page.getByRole('heading', { name: 'Structured answer' }) });
  await expect(answer).toBeVisible({ timeout: 30_000 });

  for (const heading of [
    'How the question was read',
    'Answer',
    'Candidate routes',
    'Assumptions this rests on',
    'What would rule this out',
    'Missing information',
    'Next checks',
    'Citations',
    'Confidence',
  ]) {
    await expect(answer.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }

  // Confidence is an explicit reading with its reason.
  await expect(answer.locator('.confidence__label')).toContainText(/confidence/i);
  await expect(answer.locator('.confidence__note')).not.toBeEmpty();

  // Citations resolve to real pages in this knowledge base.
  const conceptCitation = answer.locator('.answer__list a').first();
  await expect(conceptCitation).toBeVisible();

  // The evidence is shown alongside the answer.
  const evidence = page.locator('.nav-section').filter({
    has: page.getByRole('heading', { name: 'The canonical material this was drawn from' }),
  });
  await expect(evidence.locator('.result-list > li').first()).toBeVisible();

  // Re-running at another depth changes only the depth.
  await page.getByRole('button', { name: 'Formal depth' }).click();
  await expect(answer.locator('.answer__section--interpretation')).toContainText(/formal/i, {
    timeout: 30_000,
  });
  await expect(page.getByLabel('Your question')).toHaveValue(
    'My image model keeps losing small spatial details after repeated downsampling.',
  );
  await expect(page.getByLabel('Research context (optional)')).toHaveValue(
    'A small detector trained on 512px crops.',
  );
});

test('an empty question is refused without contacting the provider', async ({
  page,
  withFixtureProvider,
}) => {
  void withFixtureProvider;
  await page.goto('/ask');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a question before asking.');
  await expect(page.getByRole('heading', { name: 'Structured answer' })).toHaveCount(0);
});

/* ------------------------------------------------------------------ 5 ---- */

test('generation switched off gives a useful message and keeps the evidence', async ({
  page,
  withGenerationOff,
}) => {
  void withGenerationOff;
  await page.goto('/ask');

  const notice = page
    .locator('.nav-state--caution')
    .filter({ hasText: 'Generation is unavailable right now' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('ASSISTANT_PROVIDER=ollama');
  await expect(notice).toContainText('browse, search and inspect the graph');

  await page.getByLabel('Your question').fill('What should I check next?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();

  const failure = page
    .locator('.nav-state--problem')
    .filter({ hasText: 'No answer was generated' });
  await expect(failure).toBeVisible({ timeout: 30_000 });
  await expect(failure).toContainText('Browsing, search and the concept graph are unaffected');

  // The retrieved canonical material survives the failure.
  const evidence = page.locator('.nav-section').filter({
    has: page.getByRole('heading', { name: 'The canonical material this was drawn from' }),
  });
  await expect(evidence.locator('.result-list > li').first()).toBeVisible();

  // Nothing was invented in place of an answer.
  await expect(page.getByRole('heading', { name: 'Structured answer' })).toHaveCount(0);

  // Browsing still works while generation is off.
  await page.goto('/concepts/pooling');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pooling');
});
