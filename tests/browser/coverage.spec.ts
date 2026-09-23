/**
 * Coverage, backlog and identity journeys (v2 runbook M01–M06).
 *
 * Deterministic data throughout: the acceptance corpus and its atlas. No real
 * model is contacted, and nothing here writes.
 *
 * The corpus grows while these journeys stay fixed, so nothing below counts it
 * by hand. What the page shows is held against what the API reports, and a case
 * the corpus may stop containing — an area with nothing written, a candidate
 * with no page, a backlog item — is found through the API, with what the page
 * must show when there is none asserted too.
 */
import { expect, test } from './fixtures';
import { FIXTURE_API } from '../../playwright.config';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

interface CandidateRow {
  readonly candidateId: string;
  readonly title: string;
  readonly status: string;
  readonly canonicalConceptId: string | null;
  readonly categories: readonly { categoryId: string; path: string; areaId: string }[];
}

interface CategoryNode {
  readonly categoryId: string;
  readonly title: string;
  readonly depth: number;
  readonly children: readonly CategoryNode[];
}

interface AreaNode {
  readonly areaId: string;
  readonly title: string;
  readonly children: readonly CategoryNode[];
}

async function fromApi<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`${FIXTURE_API}${path}`);
  expect(response.ok(), `GET /api${path}`).toBe(true);
  return (await response.json()) as T;
}

/** Every candidate, page by page until the server says there are no more. */
async function allCandidates(request: APIRequestContext): Promise<CandidateRow[]> {
  const all: CandidateRow[] = [];
  for (;;) {
    const page = await fromApi<{ items: CandidateRow[]; truncated: boolean }>(
      request,
      `/coverage/candidates?limit=500&offset=${String(all.length)}`,
    );
    all.push(...page.items);
    if (!page.truncated || page.items.length === 0) return all;
  }
}

async function atlasAreas(request: APIRequestContext): Promise<AreaNode[]> {
  return (await fromApi<{ areas: AreaNode[] }>(request, '/coverage/atlas')).areas;
}

function everyCategory(areas: readonly AreaNode[]): CategoryNode[] {
  const walk = (node: CategoryNode): CategoryNode[] => [node, ...node.children.flatMap(walk)];
  return areas.flatMap((area) => area.children.flatMap(walk));
}

/** A label is listed under every category it is filed in: a label in two is two entries. */
function entryLabels(candidates: readonly CandidateRow[]): string[] {
  return candidates.flatMap((candidate) => candidate.categories.map(() => candidate.title)).sort();
}

/**
 * The categories a filter keeps: those with a matching label filed in them or
 * anywhere beneath them. Worked out from the candidates, not from the outline's
 * own counts, so a miscount in either one shows.
 */
function branchesHolding(areas: readonly AreaNode[], labels: readonly CandidateRow[]): string[] {
  const filed = new Set(
    labels.flatMap((candidate) => candidate.categories.map((category) => category.categoryId)),
  );
  const holds = (node: CategoryNode): boolean =>
    filed.has(node.categoryId) || node.children.some(holds);
  return everyCategory(areas)
    .filter(holds)
    .map((node) => node.title)
    .sort();
}

/** The labels the outline is showing now, in any order. */
async function shownLabels(page: Page): Promise<string[]> {
  return (await page.locator('.coverage-entry__toggle').allTextContents()).sort();
}

/** The categories the outline is showing now, by title alone, without their counts. */
async function shownBranches(page: Page): Promise<string[]> {
  return (
    await page
      .locator('summary.coverage-branch__name')
      .evaluateAll((summaries) => summaries.map((summary) => summary.firstChild?.textContent ?? ''))
  ).sort();
}

/** "N of TOTAL …": the N the page states, which must be the number of items it renders. */
async function statedShown(count: Locator): Promise<number> {
  const text = (await count.textContent()) ?? '';
  const shown = Number(/^(\d+) of /.exec(text)?.[1]);
  expect(Number.isInteger(shown), `a leading "N of" in "${text}"`).toBe(true);
  return shown;
}

const NOTHING_WRITTEN = 'nothing in this area has been written yet';

/* ----------------------------------------------------------------- M01 ---- */

test.describe('the Coverage page', () => {
  test('shows all three areas, and says plainly when one has nothing written', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const [areas, candidates] = await Promise.all([atlasAreas(request), allCandidates(request)]);
    await page.goto('/coverage');

    // Counts arrive from the API; the page must not render an empty frame.
    await expect(
      page.getByRole('heading', { name: 'What exists, and what is only a name' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The whole map' })).toBeVisible();

    for (const area of ['Mathematics', 'Artificial Intelligence', 'Programming']) {
      await expect(page.getByRole('heading', { name: area, exact: true })).toBeVisible();
    }

    // Each area's line counts its own labels, each once however many of the
    // area's categories it is filed in. Those counts are rebuilt here from the
    // candidates, so the page is held against the atlas at any size.
    await expect(page.locator('.coverage-area')).toHaveCount(areas.length);
    for (const area of areas) {
      const inArea = candidates.filter((candidate) =>
        candidate.categories.some((category) => category.areaId === area.areaId),
      );
      const covered = inArea.filter((candidate) => candidate.status === 'covered').length;
      const line = page
        .locator('.coverage-area')
        .filter({ has: page.getByRole('heading', { name: area.title, exact: true }) })
        .locator('.coverage-area__count');
      await expect(line).toContainText(
        `${String(covered)} of ${String(inArea.length)} labels covered`,
      );
      // The plain statement belongs to an area with no covered label and to no
      // other: an empty area is never dressed up, and one with pages is never
      // called empty. Once every area has a page, no line may say it.
      if (covered === 0) await expect(line).toContainText(NOTHING_WRITTEN);
      else await expect(line).not.toContainText(NOTHING_WRITTEN);
    }
  });

  test('separates canonical identities from candidates in words and in counts', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const summary = await fromApi<{
      concepts: { byTier: Record<string, number> };
      atlas: { candidates: number };
    }>(request, '/coverage/summary');
    await page.goto('/coverage');

    await expect(page.locator('.coverage-explainer')).toContainText(
      'never used to answer a question',
    );

    // Each depth is counted from the canonical concepts, and candidates on
    // their own, so a page that folded one into the other would disagree here.
    const tallies = page.locator('.coverage-tally');
    const value = (label: string) =>
      tallies.filter({ hasText: label }).first().locator('.coverage-tally__value');
    await expect(value('Tier 1 pages')).toHaveText(String(summary.concepts.byTier['1'] ?? 0));
    await expect(value('Tier 2 stubs')).toHaveText(String(summary.concepts.byTier['2'] ?? 0));
    // Not a count that grows: the corpus deliberately holds no Tier 3 identity,
    // and path.spec.ts rests on this journey keeping that true.
    await expect(value('Tier 3 identities')).toHaveText('0');
    await expect(value('Candidates')).toHaveText(String(summary.atlas.candidates));
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
  test('gives every element a unique id, so each disclosure controls one panel', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/coverage');
    // Rendered, not visible: most entries sit inside collapsed categories, and
    // a duplicate id is a defect whether or not it is on screen.
    await expect(page.locator('.coverage-entry').first()).toBeAttached();

    // A candidate filed under two categories is drawn once in each. Keyed on
    // the candidate alone, both copies got the same panel id, and each
    // disclosure's aria-controls then pointed at an id that existed twice.
    const duplicates = await page.evaluate(() => {
      const counts = new Map<string, number>();
      for (const element of document.querySelectorAll('[id]')) {
        counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
      }
      return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
    });
    expect(duplicates).toEqual([]);

    // And every aria-controls resolves to exactly one element.
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-controls]')]
        .map((element) => element.getAttribute('aria-controls') ?? '')
        .filter((id) => document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length !== 1),
    );
    expect(dangling).toEqual([]);
  });

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
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    // Whichever labels have no page today. Pages are still being written, so
    // no particular label can be named here and still be uncovered next week.
    const uncovered = (await allCandidates(request)).filter(
      (candidate) => candidate.status !== 'covered',
    );
    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });
    await filters.getByRole('button', { name: 'Not covered yet' }).click();
    await expect(filters.getByRole('button', { name: 'Not covered yet' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const entries = page.locator('.coverage-entry');
    await expect(entries).toHaveCount(entryLabels(uncovered).length);
    // Nothing in this view is a URL: none of these labels has a page to open.
    await expect(entries.getByRole('link')).toHaveCount(0);

    if (uncovered.length === 0) {
      // Every label has a page, so there is no editorial panel to open. The
      // view says so by listing nothing, rather than a covered label.
      return;
    }

    const lead = uncovered[0]!;
    expect(lead.canonicalConceptId, lead.candidateId).toBeNull();
    const entry = entries
      .filter({ has: page.getByText(lead.candidateId, { exact: true }) })
      .first();
    await entry.getByRole('button', { name: lead.title, exact: true }).click();
    const panel = entry.locator('.coverage-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('An editorial lead, not knowledge');
    await expect(panel).toContainText('can never be used to answer a question');
    await expect(panel.locator('.nav-id')).toHaveText(lead.candidateId);
    expect(lead.candidateId).toMatch(/^candidate\./);
    // Opened, it still offers nowhere to go.
    await expect(entry.getByRole('link')).toHaveCount(0);
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
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const [areas, candidates] = await Promise.all([atlasAreas(request), allCandidates(request)]);
    const covered = candidates.filter((candidate) => candidate.status === 'covered');
    const uncovered = candidates.filter((candidate) => candidate.status !== 'covered');
    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });

    // Exactly the covered labels, each under every category it is filed in:
    // no uncovered label slips in, and no covered one is dropped.
    await filters.getByRole('button', { name: 'Covered only' }).click();
    await expect.poll(() => shownLabels(page)).toEqual(entryLabels(covered));
    // A branch that matches nothing is omitted rather than repeated as noise,
    // and a branch that holds a match, however deep, is kept.
    await expect.poll(() => shownBranches(page)).toEqual(branchesHolding(areas, covered));

    // The complement, and nothing else: no covered label is left in this view.
    await filters.getByRole('button', { name: 'Not covered yet' }).click();
    await expect.poll(() => shownLabels(page)).toEqual(entryLabels(uncovered));
    await expect.poll(() => shownBranches(page)).toEqual(branchesHolding(areas, uncovered));
    if (uncovered.length > 0) {
      // A filtered outline is short enough to read whole, so it opens.
      await expect(page.locator('.coverage-entry').first()).toBeVisible();
    }

    // Back to everything: every label and every category is listed again, the
    // empty ones included, and every top-level category can be seen unopened.
    await filters.getByRole('button', { name: 'Everything' }).click();
    await expect.poll(() => shownLabels(page)).toEqual(entryLabels(candidates));
    await expect
      .poll(() => shownBranches(page))
      .toEqual(
        everyCategory(areas)
          .map((node) => node.title)
          .sort(),
      );
    const topLevel = page.locator('.coverage-area > .coverage-branch > summary');
    await expect(topLevel).toHaveCount(areas.reduce((n, area) => n + area.children.length, 0));
    for (const summary of await topLevel.all()) await expect(summary).toBeVisible();
  });

  test('a review-state filter narrows the outline too', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const [summary, candidates] = await Promise.all([
      fromApi<{ concepts: { byReviewState: Record<string, number> } }>(
        request,
        '/coverage/summary',
      ),
      allCandidates(request),
    ]);
    // Each covered label's review state, read from its concept rather than from
    // anything the outline is drawn from.
    const conceptIds = [
      ...new Set(candidates.flatMap((candidate) => candidate.canonicalConceptId ?? [])),
    ];
    const reviewStateOf = new Map(
      await Promise.all(
        conceptIds.map(
          async (id) =>
            [
              id,
              (await fromApi<{ reviewState: string }>(request, `/concepts/${id}`)).reviewState,
            ] as const,
        ),
      ),
    );

    await page.goto('/coverage');
    const filters = page.getByRole('group', { name: 'Filter the atlas outline' });
    const select = filters.getByRole('combobox', { name: 'Review state' });

    // Every state the corpus holds is offered, and each narrows the outline to
    // exactly the labels whose concept is in that state. An uncovered label has
    // no concept, so no state ever shows it.
    const states = Object.keys(summary.concepts.byReviewState);
    expect(states.length).toBeGreaterThan(0);
    for (const state of states) {
      await select.selectOption(state);
      const inState = candidates.filter(
        (candidate) =>
          candidate.canonicalConceptId !== null &&
          reviewStateOf.get(candidate.canonicalConceptId) === state,
      );
      await expect.poll(() => shownLabels(page), state).toEqual(entryLabels(inState));
    }
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

  /**
   * One backlog view, held against the API's own total. An empty view says so
   * in words rather than showing an empty list; a full one renders exactly as
   * many items as it says it shows, and owns up when that is fewer than exist.
   */
  async function showsBacklog(
    page: Page,
    view: { total: number; noun: string; empty: string },
  ): Promise<void> {
    const items = page.locator('.backlog-item');
    const count = page.locator('.backlog-count');
    if (view.total === 0) {
      await expect(page.getByText(view.empty)).toBeVisible();
      await expect(items).toHaveCount(0);
      return;
    }
    await expect(count).toContainText(` of ${String(view.total)} ${view.noun}`);
    const shown = await statedShown(count);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThanOrEqual(view.total);
    await expect(items).toHaveCount(shown);
    await expect(items.first()).toBeVisible();
    if (shown < view.total) await expect(count).toContainText('more than this page shows');
    else await expect(count).not.toContainText('more than this page shows');
    await expect(page.getByText(view.empty)).toHaveCount(0);
  }

  test('has two separate views, and neither mutates anything', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    // Each view's total, asked the same way the view asks. Either may be empty
    // or not as pages are written, so neither is assumed.
    const [unresolved, waiting] = await Promise.all([
      fromApi<{ total: number }>(request, '/coverage/unresolved?limit=1'),
      fromApi<{ total: number }>(request, '/coverage/candidates?status=candidate&limit=1'),
    ]);
    await page.goto('/backlog');

    const views = page.getByRole('group', { name: 'Choose a backlog view' });
    await expect(views.getByRole('button', { name: 'Unresolved references' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await showsBacklog(page, {
      total: unresolved.total,
      noun: 'gap(s)',
      empty: 'No page is waiting on a missing concept',
    });

    await views.getByRole('button', { name: 'Atlas candidates' }).click();
    await expect(views.getByRole('button', { name: 'Atlas candidates' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await showsBacklog(page, {
      total: waiting.total,
      noun: 'candidate(s)',
      empty: 'No candidate is waiting',
    });

    // No form and no button that changes anything.
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('a candidate item names its categories and its stable id', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const waiting = await fromApi<{ items: CandidateRow[]; total: number }>(
      request,
      '/coverage/candidates?status=candidate&limit=1',
    );
    await page.goto('/backlog');
    await page
      .getByRole('group', { name: 'Choose a backlog view' })
      .getByRole('button', { name: 'Atlas candidates' })
      .click();

    if (waiting.total === 0) {
      // Every candidate has been covered or deferred, so no item exists to
      // name anything; the view says why instead of listing nothing silently.
      await expect(page.getByText('No candidate is waiting')).toBeVisible();
      await expect(page.locator('.backlog-item')).toHaveCount(0);
      return;
    }

    // The first one waiting, found by its id, must carry that id and every
    // category the atlas files it under.
    const lead = waiting.items[0]!;
    expect(lead.candidateId).toMatch(/^candidate\./);
    expect(lead.categories.length, lead.candidateId).toBeGreaterThan(0);
    const item = page
      .locator('.backlog-item')
      .filter({ has: page.getByText(lead.candidateId, { exact: true }) });
    await expect(item).toHaveCount(1);
    await expect(item.locator('.backlog-item__where')).toHaveText(
      lead.categories.map((category) => category.path).join('; '),
    );
    await expect(item.locator('.backlog-item__id .nav-id')).toHaveText(lead.candidateId);
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

/* ----------------------------------------------------------------- T04 ---- */

test.describe('the About page', () => {
  test('shows live counts that match the API, by tier and by review state', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const summary = (await (await request.get(`${FIXTURE_API}/coverage/summary`)).json()) as {
      concepts: { byTier: Record<string, number>; byReviewState: Record<string, number> };
      atlas: { candidates: number; emptyCategories: number };
      backlog: { groups: number };
    };

    await page.goto('/about');
    const tallies = page.locator('.coverage-tally');
    const value = (label: string) =>
      tallies.filter({ hasText: label }).first().locator('.coverage-tally__value');

    await expect(value('Tier 1 pages')).toHaveText(String(summary.concepts.byTier['1'] ?? 0));
    await expect(value('Tier 2 stubs')).toHaveText(String(summary.concepts.byTier['2'] ?? 0));
    await expect(value('Tier 3 identities')).toHaveText(String(summary.concepts.byTier['3'] ?? 0));
    await expect(value('Atlas candidates')).toHaveText(String(summary.atlas.candidates));
    await expect(value('Unresolved references')).toHaveText(String(summary.backlog.groups));
    await expect(value('Empty categories')).toHaveText(String(summary.atlas.emptyCategories));

    const total = Object.values(summary.concepts.byTier).reduce((sum, count) => sum + count, 0);
    await expect(page.locator('.about-review-counts')).toContainText(
      `${String(total)} canonical concepts by review state`,
    );
    await expect(page.locator('.about-review-counts')).toContainText(
      `${String(summary.concepts.byReviewState['generated-draft'] ?? 0)} generated draft`,
    );
  });

  test('says what is not evidence, in the product itself', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/about');

    const notEvidence = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'What is not evidence' }) });
    await expect(notEvidence).toContainText('never used to ground an answer');
    await expect(notEvidence).toContainText('Your own material is not evidence either');
    await expect(notEvidence).toContainText('never cited as a source');
  });

  test('describes the private boundary and the limits on uploaded files', async ({
    page,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    await page.goto('/about');

    const private_ = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Your private work' }) });
    await expect(private_).toContainText('separate database on your machine');
    await expect(private_).toContainText('Nothing is stored because you read it');
    await expect(private_).toContainText('npm run personal:export');

    const files = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'Files you upload' }) });
    await expect(files).toContainText('the original bytes are discarded');
    await expect(files).toContainText('10 MiB');
    await expect(files).toContainText('300 PDF pages');
    await expect(files).toContainText('is ever executed');
    await expect(files).toContainText('no OCR');
  });

  test('contains no private record of any kind', async ({ page, withFixtureProvider }) => {
    void withFixtureProvider;
    // Everything a researcher wrote lives behind the API and is never compiled
    // into this page. A project created by another journey must not appear here.
    await page.goto('/about');
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const forbidden of ['sentinel', 'small detector recall', 'drill-note', 'personal.db']) {
      expect(body, forbidden).not.toContain(forbidden);
    }
  });
});
