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
import { FIXTURE_API } from '../../playwright.config';
import type { APIRequestContext, Page } from '@playwright/test';

const RESNET = 'concept.deep_learning.resnet';
const POOLING = 'concept.deep_learning.pooling';

/** What one page declares must come before it. */
interface Declared {
  readonly title: string;
  /** Concepts this page says it requires. */
  readonly requires: readonly string[];
  /** Concepts whose own pages say they are a prerequisite of this one. */
  readonly prerequisiteOf: readonly string[];
}

/**
 * Read one page's declared prerequisites from the concepts API. Only the two
 * types that order anything count, from either end, which is the rule the
 * route is promised to follow.
 */
async function declared(request: APIRequestContext, conceptId: string): Promise<Declared> {
  const response = await request.get(`${FIXTURE_API}/concepts/${conceptId}`);
  expect(response.ok(), `GET /api/concepts/${conceptId}`).toBe(true);
  const concept = (await response.json()) as {
    title: string;
    relationships: { type: string; direction: string; otherId: string }[];
  };
  const others = (type: string, direction: string): string[] =>
    concept.relationships
      .filter((relationship) => relationship.type === type && relationship.direction === direction)
      .map((relationship) => relationship.otherId);
  return {
    title: concept.title,
    requires: others('requires', 'outgoing'),
    prerequisiteOf: others('prerequisite_of', 'incoming'),
  };
}

function before(page: Declared | undefined): string[] {
  if (page === undefined) return [];
  return [...new Set([...page.requires, ...page.prerequisiteOf])].sort();
}

/**
 * Every page a route to the target rests on, read one page at a time from what
 * each declares. This is reached without the paths endpoint the route page is
 * drawn from, so the page can be held against the corpus itself at any size.
 */
async function declaredGraph(
  request: APIRequestContext,
  targetId: string,
): Promise<Map<string, Declared>> {
  const graph = new Map<string, Declared>();
  const queue = [targetId];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (graph.has(id)) continue;
    const page = await declared(request, id);
    graph.set(id, page);
    queue.push(...before(page).filter((other) => !graph.has(other)));
  }
  return graph;
}

/**
 * The concepts a route has to visit: the target and everything declared before
 * it, less where the reader starts. A concept they know is not a step, and nor
 * is anything the route reached only through it.
 */
function routeMembers(
  graph: ReadonlyMap<string, Declared>,
  targetId: string,
  known: readonly string[] = [],
): Set<string> {
  const members = new Set([targetId]);
  const queue = [targetId];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const other of before(graph.get(id))) {
      if (known.includes(other) || members.has(other)) continue;
      members.add(other);
      queue.push(other);
    }
  }
  return members;
}

/**
 * Hold the route on the page against the declared graph. Its length is not a
 * constant worth knowing; what makes a route right at any corpus size is that
 * it ends at the target, visits every declared prerequisite exactly once and
 * nothing else, and puts each step after everything it requires. Returns the
 * step ids in reading order.
 */
async function expectDeclaredRoute(
  page: Page,
  graph: ReadonlyMap<string, Declared>,
  targetId: string,
  known: readonly string[] = [],
): Promise<string[]> {
  const members = routeMembers(graph, targetId, known);
  const steps = page.locator('.path-step');
  await expect(steps).toHaveCount(members.size);

  const ids = await steps.locator('.path-step__actions .nav-id').allTextContents();
  expect(ids.at(-1), 'the route ends at the target').toBe(targetId);
  expect(new Set(ids).size, 'no step appears twice').toBe(ids.length);
  expect([...ids].sort(), 'every declared prerequisite, and nothing else').toEqual(
    [...members].sort(),
  );
  ids.forEach((id, position) => {
    for (const other of before(graph.get(id))) {
      if (!members.has(other)) continue;
      expect(ids.indexOf(other), `${other} is read before ${id}, which requires it`).toBeLessThan(
        position,
      );
    }
  });
  return ids;
}

/**
 * A concept the corpus declares nothing before, found by walking down declared
 * prerequisites rather than named, because which concepts are foundations
 * changes as pages are written. The corpus validator refuses prerequisite
 * cycles, so such a walk always ends at one: a corpus with no foundation would
 * be a cyclic one, and that is worth failing on, not routing around.
 */
async function foundation(
  request: APIRequestContext,
  from: string,
): Promise<{ id: string; title: string }> {
  const walked = new Set<string>();
  let id = from;
  while (!walked.has(id)) {
    walked.add(id);
    const page = await declared(request, id);
    const [first] = before(page);
    if (first === undefined) return { id, title: page.title };
    id = first;
  }
  throw new Error(
    `Walking down declared prerequisites from ${from} came back to ${id}, so the corpus declares a prerequisite cycle its validator should have refused.`,
  );
}

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
  const name = page.getByLabel('Project name');
  // Neither exists until the project list has loaded, so wait for one of them
  // before deciding. Checking count() straight after goto() is a snapshot: on
  // a slow machine it runs before the list arrives, sees no disclosure, skips
  // the click, and then fill() waits out the whole timeout on an input hidden
  // inside the closed <details> that renders a moment later.
  await expect(disclosure.or(name).first()).toBeVisible();
  if (await disclosure.isVisible()) await disclosure.click();
  await name.fill(title);
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
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const graph = await declaredGraph(request, RESNET);
    await page.goto('/path');
    await expect(page.getByText('Choose a destination')).toBeVisible();

    await chooseTarget(page, 'resnet', 'ResNet');

    const steps = page.locator('.path-step');
    const ids = await expectDeclaredRoute(page, graph, RESNET);
    await expect(steps.last().locator('.path-step__title')).toHaveText(
      `Step ${String(ids.length)}: ResNet`,
    );
    await expect(steps.last().locator('.path-step__because')).toHaveText(
      'This is what you are working towards.',
    );

    // Every step before the destination says which page put it there: it names
    // a later step, the declared type, and whose page declared it — and the
    // corpus really does hold that declaration. `requires` is written on the
    // later page, `prerequisite_of` on this one.
    for (const [index, id] of ids.slice(0, -1).entries()) {
      const because = steps.nth(index).locator('.path-step__because');
      await expect(because).toContainText('Comes before');
      const type = await because.locator('.nav-id').textContent();
      const afterTitle = await because.locator('strong').textContent();
      expect(['requires', 'prerequisite_of'], `the relationship behind ${id}`).toContain(type);
      await expect(because).toContainText(
        type === 'requires'
          ? `because the ${String(afterTitle)} page declares requires`
          : 'because this page declares prerequisite_of',
      );
      const declaredLater = ids.slice(index + 1).some((later) => {
        const after = graph.get(later);
        if (after === undefined || after.title !== afterTitle) return false;
        return (type === 'requires' ? after.requires : after.prerequisiteOf).includes(id);
      });
      expect(declaredLater, `${id} comes before a later step that declares it`).toBe(true);
    }

    // Canonical links, and the reading order, are both present.
    await expect(steps.first().getByRole('link')).toHaveAttribute('href', /\/concepts\//);
    await expect(page.locator('.path-count')).toContainText(`${String(ids.length)} steps`);

    // The target is in the address, so a route can be shared and reloaded —
    // and what comes back is the same route, in the same order.
    await expect(page).toHaveURL(new RegExp(`target=${RESNET.replace(/\./g, '\\.')}`));
    await page.reload();
    expect(await expectDeclaredRoute(page, graph, RESNET)).toEqual(ids);
  });

  test('shortens when the researcher says they already know a step', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const graph = await declaredGraph(request, RESNET);
    await page.goto(`/path?target=${RESNET}`);
    await expectDeclaredRoute(page, graph, RESNET);

    const know = page.getByRole('button', { name: 'I already know this — Pooling', exact: true });
    await know.focus();
    await page.keyboard.press('Enter');

    // Pooling leaves the route, and so does anything it alone led to; whatever
    // else still needs its prerequisites keeps them.
    await expectDeclaredRoute(page, graph, RESNET, [POOLING]);
    await expect(page.locator('.path-steps')).not.toContainText('Pooling');
    await expect(
      page
        .locator('.nav-section')
        .filter({ has: page.getByRole('heading', { name: 'Starting from what you know' }) }),
    ).toContainText('you said you know it');

    // And it can be put back, because a route the researcher cannot undo is a
    // route they will stop trusting.
    await page.getByRole('button', { name: 'Put back Pooling', exact: true }).first().click();
    await expectDeclaredRoute(page, graph, RESNET);
  });
});

test.describe('a target the corpus records no route to', () => {
  test('says so instead of arranging related concepts', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    // Convolution was such a target until pages declared what it rests on, so
    // the target is found each run rather than named.
    const target = await foundation(request, RESNET);
    await page.goto(`/path?target=${target.id}`);

    await expect(page.getByRole('heading', { name: 'No route is recorded' })).toBeVisible();
    await expect(page.locator('.path-count')).toContainText(
      `Nothing in this corpus declares a prerequisite for ${target.title}`,
    );
    await expect(page.locator('.path-count')).toContainText('nobody checked');
    await expect(page.locator('.path-step')).toHaveCount(0);

    // What is missing is named, and points at where that is tracked.
    const missing = page
      .locator('.nav-section')
      .filter({ has: page.getByRole('heading', { name: 'What the graph does not say' }) });
    await expect(missing).toContainText(`${target.title} —`);
    await expect(missing).toContainText('records no route to it');
    await expect(missing.getByRole('link', { name: 'coverage map' })).toBeVisible();
  });
});

test.describe('a route personalised by familiarity', () => {
  test('drops a strong concept and says which record did it', async ({
    page,
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const graph = await declaredGraph(request, RESNET);
    await createProject(page, 'Route personalisation');
    await setFamiliarity(page, '/concepts/pooling', 'Strong');

    await page.goto(`/path?target=${RESNET}`);
    // Familiarity is not used until the researcher points at a project.
    await expectDeclaredRoute(page, graph, RESNET);

    const use = page.getByRole('checkbox', { name: /Use the familiarity I recorded in/ });
    await use.check();

    // Strong familiarity makes Pooling a starting point, exactly as saying so
    // by hand would: the same shorter route, not merely a shorter one.
    await expectDeclaredRoute(page, graph, RESNET, [POOLING]);
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
    request,
    withFixtureProvider,
  }) => {
    void withFixtureProvider;
    const graph = await declaredGraph(request, RESNET);
    await createProject(page, 'Route keeping');

    await page.goto(`/path?target=${RESNET}`);
    await expectDeclaredRoute(page, graph, RESNET);

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
