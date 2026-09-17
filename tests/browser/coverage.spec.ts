/**
 * Coverage, backlog and identity journeys (v2 runbook M01–M06).
 *
 * Deterministic data throughout: the acceptance corpus and its atlas. No real
 * model is contacted, and nothing here writes.
 */
import { expect, test } from './fixtures';

/* ----------------------------------------------------------------- M01 ---- */

test.describe('the Coverage page', () => {
  test('shows all three areas, including one with no canonical page', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');

    // Counts arrive from the API; the page must not render an empty frame.
    await expect(
      page.getByRole('heading', { name: 'What exists, and what is only a name' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The whole map' })).toBeVisible();

    for (const area of ['Mathematics', 'Artificial Intelligence', 'Programming']) {
      await expect(page.getByRole('heading', { name: area, exact: true })).toBeVisible();
    }

    // Programming has candidates and no covered concept at all.
    const programming = page
      .locator('.coverage-area')
      .filter({ has: page.getByRole('heading', { name: 'Programming', exact: true }) });
    await expect(programming.locator('.coverage-area__count')).toContainText(
      'nothing in this area has been written yet',
    );
  });

  test('separates canonical identities from candidates in words and in counts', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');

    await expect(page.locator('.coverage-explainer')).toContainText(
      'never used to answer a question',
    );

    const tallies = page.locator('.coverage-tally');
    await expect(
      tallies.filter({ hasText: 'Tier 1 pages' }).locator('.coverage-tally__value'),
    ).toHaveText('11');
    await expect(
      tallies.filter({ hasText: 'Tier 3 identities' }).locator('.coverage-tally__value'),
    ).toHaveText('0');
    const candidates = tallies.filter({ hasText: 'Candidates' }).first();
    await expect(candidates).toContainText('Not canonical, never evidence');
  });

  test('reads the same counts to a screen reader as to the eye', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    // Every area heading is a real heading, and every area is labelled by it.
    const areas = page.locator('.coverage-area');
    await expect(areas).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const area = areas.nth(index);
      const id = await area.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      await expect(page.locator(`[id="${id!}"]`)).toBeVisible();
    }
  });

  test('has no horizontal overflow at 360px', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/coverage');
    await expect(page.getByRole('heading', { name: 'The whole map' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

/* ----------------------------------------------------------------- M02 ---- */

test.describe('the atlas outline', () => {
  test('keeps empty categories visible and reachable by keyboard', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');

    const empty = page.locator('.coverage-branch__empty').first();
    await expect(empty).toContainText('kept so the neighbourhood stays visible');

    // The filters are ordinary buttons, so Tab reaches them.
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });
    await expect(filters.getByRole('button', { name: 'Everything' })).toBeVisible();
    await filters.getByRole('button', { name: 'Everything' }).focus();
    await expect(filters.getByRole('button', { name: 'Everything' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(filters.getByRole('button', { name: 'Covered only' })).toBeFocused();
  });

  test('a candidate with no page opens an editorial panel, not an article', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });
    await filters.getByRole('button', { name: 'Not covered yet' }).click();

    const rust = page.locator('.coverage-entry').filter({ hasText: 'Rust' }).first();
    // Nothing here is a URL: there is no page to open.
    await expect(rust.getByRole('link')).toHaveCount(0);

    await rust.getByRole('button', { name: 'Rust' }).click();
    await expect(rust.locator('.coverage-panel')).toBeVisible();
    await expect(rust.locator('.coverage-panel')).toContainText('An editorial lead, not knowledge');
    await expect(rust.locator('.coverage-panel')).toContainText(
      'can never be used to answer a question',
    );
    await expect(rust.locator('.coverage-panel .nav-id')).toContainText('candidate.');
  });

  test('a covered candidate opens its concept', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });
    await filters.getByRole('button', { name: 'Covered only' }).click();

    const resnet = page.locator('.coverage-entry').filter({ hasText: 'ResNet' }).first();
    await resnet.getByRole('link', { name: 'Read' }).click();
    await expect(page).toHaveURL(/\/concepts\/resnet$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ResNet');
  });

  test('the covered filter narrows to exactly the covered labels and back again', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });

    await filters.getByRole('button', { name: 'Covered only' }).click();
    await expect(page.locator('.coverage-entry')).toHaveCount(11);
    // A branch that matches nothing is omitted rather than repeated as noise.
    await expect(page.locator('.coverage-branch').filter({ hasText: 'Game Theory' })).toHaveCount(
      0,
    );

    await filters.getByRole('button', { name: 'Not covered yet' }).click();
    await expect(page.locator('.coverage-entry').filter({ hasText: 'Rust' }).first()).toBeVisible();
    await expect(page.locator('.coverage-entry').filter({ hasText: 'ResNet' })).toHaveCount(0);

    // Back to everything: the empty categories are visible again.
    await filters.getByRole('button', { name: 'Everything' }).click();
    await expect(
      page.locator('summary.coverage-branch__name').filter({ hasText: 'Game Theory' }),
    ).toBeVisible();
  });

  test('a review-state filter narrows the outline too', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });
    await filters.getByRole('combobox', { name: 'Review state' }).selectOption('generated-draft');
    await expect(page.locator('.coverage-entry')).toHaveCount(11);
  });

  test('a collapsed category still says how much of it is covered', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    const analysis = page
      .locator('summary.coverage-branch__name')
      .filter({ hasText: 'Analysis' })
      .first();
    await expect(analysis).toContainText('of');
    await expect(analysis).toContainText('covered');

    const empty = page
      .locator('summary.coverage-branch__name')
      .filter({ hasText: 'Information Theory' })
      .first();
    await expect(empty).toContainText('nothing here yet');
  });
});

/* ----------------------------------------------------------------- M03 ---- */

test.describe('the Backlog page', () => {
  test('is reached from Coverage and says what it is', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    await page.getByRole('link', { name: 'backlog' }).click();
    await expect(page).toHaveURL(/\/backlog$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Backlog');
    await expect(page.locator('.nav-page__lede')).toContainText(
      'these are the gaps, not the content',
    );
  });

  test('has two separate views, and neither mutates anything', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/backlog');

    const views = page.getByRole('group', { name: 'Choose a backlog view' });
    await expect(views.getByRole('button', { name: 'Unresolved references' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // The acceptance corpus records no unresolved reference; the page says so
    // rather than showing an empty list.
    await expect(page.getByText('No page is waiting on a missing concept')).toBeVisible();

    await views.getByRole('button', { name: 'Atlas candidates' }).click();
    await expect(page.locator('.backlog-item').first()).toBeVisible();
    await expect(page.locator('.backlog-count')).toContainText('candidate(s)');

    // No form and no button that changes anything.
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('a candidate item names its categories and its stable id', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/backlog');
    await page
      .getByRole('group', { name: 'Choose a backlog view' })
      .getByRole('button', { name: 'Atlas candidates' })
      .click();
    const first = page.locator('.backlog-item').first();
    await expect(first.locator('.backlog-item__where')).not.toBeEmpty();
    await expect(first.locator('.backlog-item__id .nav-id')).toContainText('candidate.');
  });
});

/* ----------------------------------------------------------------- M04 ---- */

test.describe('identity panels', () => {
  test('every concept has one, reachable as a direct URL', async ({ page }) => {
    await page.goto('/identity/resnet');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ResNet');
    await expect(page.getByRole('heading', { name: 'Identity', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Relationships' })).toBeVisible();
  });

  test('an identity with an article links to it rather than replacing it', async ({ page }) => {
    await page.goto('/identity/resnet');
    await expect(page.getByText('No article yet')).toHaveCount(0);
    await page.getByRole('link', { name: /Read the article/ }).click();
    await expect(page).toHaveURL(/\/concepts\/resnet$/);
  });

  test('shows the stable identity fields', async ({ page }) => {
    await page.goto('/identity/convolution');
    const facts = page.locator('.nav-fact');
    await expect(facts.filter({ hasText: 'Concept id' })).toContainText(
      'concept.analysis.convolution',
    );
    await expect(facts.filter({ hasText: 'Address' })).toContainText('/concepts/convolution');
    await expect(facts.filter({ hasText: 'Coverage depth' })).toContainText('Tier 1');
    await expect(facts.filter({ hasText: 'Stored as' })).toContainText('Markdown');
  });

  test('every identity URL is real static HTML, served with 200', async ({ page }) => {
    // A path segment containing dots is read as a file name by ordinary static
    // servers, so identity routes use the slug's last segment. This test is the
    // guard: it failed before that change, with a 404 and a hydration mismatch.
    for (const key of ['resnet', 'convolution', 'backpropagation-through-convolution']) {
      const response = await page.goto(`/identity/${key}`);
      expect(response?.status(), key).toBe(200);
    }
  });

  test('an unknown identity has no route at all', async ({ page }) => {
    const response = await page.goto('/identity/no-such-thing');
    expect(response?.status()).toBe(404);
  });

  test('renders without a hydration mismatch or a failed request', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('/identity/resnet');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ResNet');
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('never appears in the documentation sidebar', async ({ page }) => {
    await page.goto('/concepts/resnet');
    const sidebar = page.locator('.theme-doc-sidebar-container');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /identity/i })).toHaveCount(0);
  });
});

/* ----------------------------------------------------------------- M05 ---- */

test.describe('claim-level evidence on a concept page', () => {
  test('says plainly that no claim mapping exists yet', async ({ page }) => {
    await page.goto('/concepts/resnet');
    const section = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Claim-level evidence' }) });
    await expect(section).toBeVisible();
    await expect(section).toContainText('does not yet map individual statements');
    await expect(section).toContainText('is not evidence that the page is unsupported');
  });

  test('keeps the existing source display', async ({ page }) => {
    await page.goto('/concepts/resnet');
    const sources = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Sources, and what each one supports' }) });
    await expect(sources.locator('.concept-sources > li').first()).toBeVisible();
  });
});

/* ----------------------------------------------------------------- M06 ---- */

test.describe('navigation', () => {
  test('Coverage is in the main navigation and every route is reachable', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('.navbar');
    for (const label of ['Explore', 'Search', 'Ask', 'Coverage', 'About']) {
      await expect(navbar.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    // Backlog is deliberately not top-level.
    await expect(navbar.getByRole('link', { name: 'Backlog', exact: true })).toHaveCount(0);

    await navbar.getByRole('link', { name: 'Coverage', exact: true }).click();
    await expect(page).toHaveURL(/\/coverage$/);
  });

  test('the mobile header still reaches Coverage', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await page.getByLabel('Toggle navigation bar').click();
    await expect(
      page.locator('.navbar-sidebar').getByRole('link', { name: 'Coverage', exact: true }),
    ).toBeVisible();
  });

  test('every v1 route still answers', async ({ page }) => {
    for (const route of ['/', '/explore', '/search', '/ask', '/about', '/concepts/pooling']) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
    }
  });
});
