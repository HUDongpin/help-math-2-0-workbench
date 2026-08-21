import {expect, test, type Locator, type Page} from '@playwright/test';

type Box = {height: number; width: number; x: number; y: number};
type RuntimeIssue = {
  kind: 'console' | 'page' | 'request' | 'response';
  message: string;
};

const PLAYER = [
  '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
  '[data-hydrated="true"]',
  '[data-resume-decision="resolved"]',
].join('');
const G5_PLAYER = [
  '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
  '[data-hydrated="true"]',
].join('');
const ROOT = 'main.lesson-shell2';
const STAGE = [
  '.lesson-shell2__legacy-stage',
  '[data-native-composite-stage="800x600"]',
].join('');
const INNER_STAGE = [
  '.lesson-shell2__stage',
  '[data-authored-stage="800x600"]',
].join('');

function collectRuntimeIssues(page: Page, origin: string) {
  const issues: RuntimeIssue[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push({kind: 'console', message: message.text()});
    }
  });
  page.on('pageerror', (error) => {
    issues.push({kind: 'page', message: error.message});
  });
  page.on('requestfailed', (request) => {
    const headers = request.headers();
    const speculativePrefetch = headers['next-router-prefetch'] === '1'
      || headers.purpose === 'prefetch';
    const requestUrl = new URL(request.url());
    const canceledNextRoute = request.resourceType() === 'fetch' &&
      requestUrl.searchParams.has('_rsc') &&
      request.failure()?.errorText === 'net::ERR_ABORTED';
    const canceledLocaleKeyTerms = request.resourceType() === 'fetch' &&
      /^\/generated\/g4-grade-wide-keyterms-(?:en|es)\.json$/u.test(
        requestUrl.pathname,
      ) && request.failure()?.errorText === 'net::ERR_ABORTED';
    if (
      requestUrl.origin === origin &&
      !speculativePrefetch &&
      !canceledNextRoute &&
      !canceledLocaleKeyTerms
    ) {
      issues.push({
        kind: 'request',
        message: [
          request.method(),
          request.resourceType(),
          request.url(),
          request.failure()?.errorText ?? 'failed',
        ].join(' · '),
      });
    }
  });
  page.on('response', (response) => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) {
      issues.push({
        kind: 'response',
        message: `${response.status()} · ${response.url()}`,
      });
    }
  });

  return issues;
}

async function doubleRafBox(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => new Promise<Box>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      resolve({height: rect.height, width: rect.width, x: rect.x, y: rect.y});
    }));
  }));
}

async function stableBox(locator: Locator): Promise<Box> {
  let previous: Box | null = null;
  let stableSamples = 0;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const current = await doubleRafBox(locator);
    if (previous && Object.keys(current).every((key) =>
      Math.abs(current[key as keyof Box] - previous![key as keyof Box]) <= .5)) {
      stableSamples += 1;
      if (stableSamples >= 3) return current;
    } else {
      stableSamples = 0;
    }
    previous = current;
  }

  throw new Error('Lesson geometry did not settle after 12 double-RAF samples.');
}

function expectBoxUnchanged(before: Box, after: Box) {
  for (const key of ['height', 'width', 'x', 'y'] as const) {
    expect(Math.abs(before[key] - after[key]), key).toBeLessThanOrEqual(1);
  }
}

async function openLesson(
  page: Page,
  baseURL: string,
  path = '/courses/4/3',
) {
  const response = await page.goto(path, {waitUntil: 'domcontentloaded'});

  expect(response?.status()).toBe(200);
  // Whole lessons now live on the platform route. G4 L3 is the explicit
  // current-JavaScript showcase boundary; the retired controlled-review
  // middleware header must not reappear or imply a private-preview gate.
  expect(response?.headers()['x-helpmath-controlled-preview']).toBeUndefined();
  await expect(page.locator(PLAYER)).toBeVisible();
  await expect(page.locator(ROOT)).toHaveAttribute(
    'data-release-id',
    'lesson-g04-l03-negative-numbers',
  );
  await expect(page.locator(ROOT)).toHaveAttribute('data-current-js-pages', '39');
  await expect(page.locator(ROOT)).toHaveAttribute('data-public-release', 'false');
  await expect(page.locator(ROOT)).not.toHaveAttribute('data-stage-render-mode', 'measuring');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  const origin = new URL(baseURL).origin;
  expect(new URL(page.url()).origin).toBe(origin);
}

async function openG5Lesson(page: Page, baseURL: string) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const response = await page.goto('/courses/5/4', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-helpmath-controlled-preview']).toBeUndefined();
  await expect(page.locator(G5_PLAYER)).toBeVisible();
  await expect(page.locator(ROOT)).toHaveAttribute(
    'data-release-id',
    'lesson-g05-l04-number-lines',
  );
  await expect(page.locator(ROOT)).toHaveAttribute('data-current-js-pages', '54');
  await expect(page.locator(ROOT)).toHaveAttribute('data-public-release', 'false');
  await expect(page.locator(ROOT)).not.toHaveAttribute(
    'data-stage-render-mode',
    'measuring',
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  expect(new URL(page.url()).origin).toBe(new URL(baseURL).origin);
}

/**
 * The course map is the only on-demand page navigation: the authoring-style
 * page dropdown is gone, so jumping to a page means opening the map and
 * picking the page, exactly as a learner would.
 */
async function selectPageFromCourseMap(
  page: Page,
  playerSelector: string,
  animationId: string,
) {
  const root = page.locator(ROOT);
  if (await root.getAttribute('data-map-open') !== 'true') {
    await (await liveControl(page, 'map')).click();
    await expect(root).toHaveAttribute('data-map-open', 'true');
  }
  await page.locator(
    `.lesson-shell2__side-panel--map button[data-animation-id="${animationId}"]`,
  ).click();
  await expect(page.locator(playerSelector)).toHaveAttribute(
    'data-current-animation-id',
    animationId,
  );
}

async function selectG5Page(page: Page, animationId: string) {
  await selectPageFromCourseMap(page, G5_PLAYER, animationId);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: window.innerWidth,
    scrollWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectControlsReachableByVerticalScroll(
  page: Page,
  controls: Locator[],
) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  for (const control of controls) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeVisible();
    const box = await stableBox(control);
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport!.height + 1);
  }
}

async function expectNoRuntimeIssues(page: Page, issues: RuntimeIssue[]) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(50);
  expect(issues).toEqual([]);
}

/**
 * The shell keeps exactly one control surface live. The labelled toolbar is a
 * fallback for the two cases the source hit regions cannot serve — a stage
 * that has scaled below its authored plane, and a coarse pointer — and the
 * source hit regions own every other viewport, wide desktops included.
 */
async function liveControlSurface(page: Page): Promise<'legacy' | 'modern-wide'> {
  const root = page.locator(ROOT);
  const [presentation, legacyMode] = await Promise.all([
    root.getAttribute('data-modern-control-presentation'),
    root.getAttribute('data-legacy-hit-control-mode'),
  ]);
  const surface = presentation === 'true' ? 'modern-wide' : 'legacy';

  expect(legacyMode).toBe(
    surface === 'modern-wide' ? 'inert-modern-surface' : 'active-visible-stage',
  );
  return surface;
}

function surfaceControl(
  page: Page,
  surface: 'legacy' | 'modern-wide',
  key: string,
) {
  return page.locator(
    `[data-responsive-focus-surface="${surface}"] `
    + `[data-responsive-focus-key="${key}"]`,
  );
}

async function liveControl(page: Page, key: string) {
  return surfaceControl(page, await liveControlSurface(page), key);
}

async function expectSingleLiveControlSurface(
  page: Page,
  expected: 'legacy' | 'modern-wide',
) {
  expect(await liveControlSurface(page)).toBe(expected);

  const toolbar = page.locator('.lesson-shell2__modern-toolbar');
  if (expected === 'modern-wide') {
    await expect(toolbar).toBeVisible();
  } else {
    await expect(toolbar).toBeHidden();
  }

  // The suppressed surface must be unreachable, not merely styled away: an
  // inert-but-painted hotspot is what produced the duplicate control set.
  const operable = await page.evaluate(() => {
    const count = (surface: string) => [...document.querySelectorAll<HTMLElement>(
      `[data-responsive-focus-surface="${surface}"] [data-responsive-focus-key]`,
    )].filter((element) => {
      const style = getComputedStyle(element);
      return element.getClientRects().length > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.closest('[inert]');
    }).length;
    return {legacy: count('legacy'), modern: count('modern-wide')};
  });
  const suppressed = expected === 'modern-wide' ? 'legacy' : 'modern';
  const live = expected === 'modern-wide' ? 'modern' : 'legacy';

  expect(operable[suppressed]).toBe(0);
  expect(operable[live]).toBeGreaterThan(0);
}

async function expectNativeStage(page: Page) {
  const stage = await stableBox(page.locator(STAGE));
  const innerStage = await stableBox(page.locator(INNER_STAGE));

  expect(Math.abs(stage.width - 800)).toBeLessThanOrEqual(1);
  expect(Math.abs(stage.height - 600)).toBeLessThanOrEqual(1);
  expectBoxUnchanged(stage, innerStage);
  return stage;
}

async function expectProportionalStage(page: Page) {
  const stage = await stableBox(page.locator(STAGE));
  const innerStage = await stableBox(page.locator(INNER_STAGE));

  expect(stage.width).toBeLessThan(800);
  expect(Math.abs(stage.width / stage.height - (4 / 3))).toBeLessThanOrEqual(.01);
  expectBoxUnchanged(stage, innerStage);
  return stage;
}

async function exerciseOverlayTools(page: Page) {
  const stage = page.locator(STAGE);
  const before = await stableBox(stage);
  const mapTrigger = await liveControl(page, 'map');

  await mapTrigger.click();
  await expect(page.locator(ROOT)).toHaveAttribute('data-map-open', 'true');
  expectBoxUnchanged(before, await stableBox(stage));
  await expectNoHorizontalOverflow(page);
  await page.locator(
    '.lesson-shell2__side-panel--map button[data-course-map-close-control="true"]',
  ).click();
  await expect(page.locator(ROOT)).toHaveAttribute('data-map-open', 'false');

  await (await liveControl(page, 'calculator')).click();
  await expect(page.locator(ROOT)).toHaveAttribute('data-active-tool', 'calculator');
  expectBoxUnchanged(before, await stableBox(stage));
  await expectNoHorizontalOverflow(page);
  await page.locator('.lesson-shell2__side-panel--tool').getByRole(
    'button',
    {name: 'Close tool'},
  ).click();
  await expect(page.locator(ROOT)).toHaveAttribute('data-tool-open', 'false');
  expectBoxUnchanged(before, await stableBox(stage));
}

async function exerciseMapRail(page: Page) {
  const root = page.locator(ROOT);
  const stage = page.locator(STAGE);

  await expect(root).toHaveAttribute('data-map-open', 'true');
  await page.locator(
    '.lesson-shell2__side-panel--map button[data-course-map-close-control="true"]',
  ).click();
  await expect(root).toHaveAttribute('data-map-open', 'false');

  const before = await stableBox(stage);
  const surface = await liveControlSurface(page);
  const mapTrigger = surfaceControl(page, surface, 'map');

  await expect(mapTrigger).toHaveAttribute(
    'data-course-map-trigger',
    surface === 'modern-wide'
      ? 'modern-accessible-control'
      : 'legacy-source-hit-area',
  );
  await mapTrigger.click();
  await expect(root).toHaveAttribute('data-map-open', 'true');
  expectBoxUnchanged(before, await stableBox(stage));
  await expectNoHorizontalOverflow(page);
}

async function exerciseToolRail(page: Page) {
  const root = page.locator(ROOT);
  const stage = page.locator(STAGE);
  const before = await stableBox(stage);

  await (await liveControl(page, 'calculator')).click();
  await expect(root).toHaveAttribute('data-active-tool', 'calculator');
  expectBoxUnchanged(before, await stableBox(stage));
  await expectNoHorizontalOverflow(page);
  await page.locator('.lesson-shell2__side-panel--tool').getByRole(
    'button',
    {name: 'Close tool'},
  ).click();
  await expect(root).toHaveAttribute('data-tool-open', 'false');
  expectBoxUnchanged(before, await stableBox(stage));
}

async function expectVisibleResponsiveFocus(page: Page, key: string) {
  await expect.poll(() => page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    const rect = element?.getBoundingClientRect();
    return {
      key: element?.dataset.responsiveFocusKey ?? null,
      visible: Boolean(
        element &&
        rect &&
        rect.width > 0 &&
        rect.height > 0 &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).display !== 'none' &&
        getComputedStyle(element).visibility !== 'hidden' &&
        !element.closest('[hidden], [inert], [aria-hidden="true"]'),
      ),
    };
  })).toEqual({key, visible: true});
}

async function dragCenterToCenter(
  page: Page,
  source: Locator,
  target: Locator,
) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  const sourceCenter = {
    x: sourceBox!.x + sourceBox!.width / 2,
    y: sourceBox!.y + sourceBox!.height / 2,
  };
  const targetCenter = {
    x: targetBox!.x + targetBox!.width / 2,
    y: targetBox!.y + targetBox!.height / 2,
  };
  await page.mouse.move(sourceCenter.x, sourceCenter.y);
  await page.mouse.down();
  await page.mouse.move(targetCenter.x, targetCenter.y, {steps: 12});
  await page.mouse.up();
}

test('844x390 keeps compact controls reachable by vertical scroll without learner evidence copy', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 390, width: 844});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!);
  const root = page.locator(ROOT);

  await expect(root).toHaveAttribute('data-layout-mode', 'compact');
  await expect(root).toHaveAttribute('data-layout-density', 'comfortable');
  await expect(root).toHaveAttribute('data-map-presentation', 'overlay');
  await expect(root).toHaveAttribute('data-tool-presentation', 'overlay');
  await expect(root).toHaveAttribute('data-stage-render-mode', 'proportional-scale');

  const stage = await expectProportionalStage(page);
  // The stage scaled below its authored plane, so the labelled toolbar is the
  // live surface and the shrunken source hotspots stop being controls.
  await expectSingleLiveControlSurface(page, 'modern-wide');
  const toolbar = await stableBox(page.locator('.lesson-shell2__modern-toolbar'));
  const actions = await stableBox(page.locator('.lesson-shell2__learning-actions'));
  await expect(page.locator('.lesson-shell2__status')).toHaveCount(0);
  await expect(page.locator('[data-compact-transport-summary="true"]'))
    .toHaveCount(0);
  await expect(page.locator('.lesson-shell2__modern-toolbar'))
    .not.toHaveAttribute('aria-describedby', /-transport-boundary$/);
  expect(stage.x + stage.width).toBeLessThanOrEqual(toolbar.x + 1);
  expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(845);
  expect(toolbar.y).toBeGreaterThanOrEqual(-1);
  expect(actions.y).toBeGreaterThanOrEqual(-1);
  await expectControlsReachableByVerticalScroll(page, [
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="map"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="help"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="exit"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="header-back"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="key-terms"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="calculator"]'),
    page.locator('.lesson-shell2__learning-actions [data-responsive-focus-key="previous"]'),
    page.locator('.lesson-shell2__learning-actions [data-responsive-focus-key="next"]'),
  ]);
  await exerciseOverlayTools(page);
  await expectNoHorizontalOverflow(page);
  await expectNoRuntimeIssues(page, issues);
});

test('844x390 keeps Spanish compact controls reachable by vertical scroll', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 390, width: 844});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!, '/es/courses/4/3');
  const root = page.locator(ROOT);

  await expect(root).toHaveAttribute('data-layout-mode', 'compact');
  await expect(root).toHaveAttribute('data-stage-render-mode', 'proportional-scale');
  await expect(page.locator('.lesson-shell2__status')).toHaveCount(0);
  await expect(page.locator('[data-compact-transport-summary="true"]'))
    .toHaveCount(0);
  await expectSingleLiveControlSurface(page, 'modern-wide');

  const toolbar = await stableBox(page.locator('.lesson-shell2__modern-toolbar'));
  const actions = await stableBox(page.locator('.lesson-shell2__learning-actions'));
  expect(toolbar.y).toBeGreaterThanOrEqual(-1);
  expect(actions.y).toBeGreaterThanOrEqual(-1);
  await expectControlsReachableByVerticalScroll(page, [
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="key-terms"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="calculator"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="replay"]'),
    page.locator('.lesson-shell2__modern-toolbar [data-responsive-focus-key="pause"]'),
    page.locator('.lesson-shell2__learning-actions [data-responsive-focus-key="previous"]'),
    page.locator('.lesson-shell2__learning-actions [data-responsive-focus-key="next"]'),
  ]);
  await expectNoHorizontalOverflow(page);
  await expectNoRuntimeIssues(page, issues);
});

for (const viewport of [
  {height: 720, width: 1280},
  {height: 768, width: 1366},
] as const) {
  test(`${viewport.width}x${viewport.height} preserves the 800x600 stage inside the lesson column`, async ({
    baseURL,
    page,
  }) => {
    await page.setViewportSize(viewport);
    const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
    await openLesson(page, baseURL!);
    const root = page.locator(ROOT);

    await expect(root).toHaveAttribute('data-layout-mode', 'wide-functional');
    await expect(root).toHaveAttribute('data-layout-density', 'compact-height');
    await expect(root).toHaveAttribute('data-map-presentation', 'overlay');
    await expect(root).toHaveAttribute('data-tool-presentation', 'overlay');
    await expect(root).toHaveAttribute('data-stage-render-mode', 'native-pixel-size');

    const stage = await expectNativeStage(page);
    const learningColumn = await stableBox(
      page.locator('.lesson-shell2__learning-column'),
    );
    expect(stage.x).toBeGreaterThanOrEqual(learningColumn.x - 1);
    expect(stage.x + stage.width).toBeLessThanOrEqual(
      learningColumn.x + learningColumn.width + 1,
    );
    expect(stage.y).toBeGreaterThanOrEqual(learningColumn.y - 1);
    expect(stage.y + stage.height).toBeLessThanOrEqual(
      learningColumn.y + learningColumn.height + 1,
    );
    // A wide, fine-pointer viewport draws the plane at native size. The
    // labelled toolbar is not a companion here: the source hit regions are
    // the only control surface, so it stays out of the way.
    await expectSingleLiveControlSurface(page, 'legacy');
    await exerciseOverlayTools(page);
    await expectNoHorizontalOverflow(page);
    await expectNoRuntimeIssues(page, issues);
  });
}

test('1600x900 reserves a map rail without moving the native stage', async ({baseURL, page}) => {
  await page.setViewportSize({height: 900, width: 1600});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!);
  const root = page.locator(ROOT);

  await expect(root).toHaveAttribute('data-layout-mode', 'wide-functional');
  await expect(root).toHaveAttribute('data-layout-density', 'comfortable');
  await expect(root).toHaveAttribute('data-map-presentation', 'rail');
  await expect(root).toHaveAttribute('data-tool-presentation', 'overlay');
  await expect(root).toHaveAttribute('data-stage-render-mode', 'native-pixel-size');
  await expectNativeStage(page);
  await expectSingleLiveControlSurface(page, 'legacy');
  await exerciseMapRail(page);
  await expectNoHorizontalOverflow(page);
  await expectNoRuntimeIssues(page, issues);
});

test('1800x1000 reserves a calculator rail without moving the native stage', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 1000, width: 1800});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!);
  const root = page.locator(ROOT);

  await expect(root).toHaveAttribute('data-layout-mode', 'wide-functional');
  await expect(root).toHaveAttribute('data-layout-density', 'comfortable');
  await expect(root).toHaveAttribute('data-map-presentation', 'rail');
  await expect(root).toHaveAttribute('data-tool-presentation', 'rail');
  await expect(root).toHaveAttribute('data-map-open', 'true');
  await expect(root).toHaveAttribute('data-stage-render-mode', 'native-pixel-size');
  await expectNativeStage(page);
  await expectSingleLiveControlSurface(page, 'legacy');
  await exerciseToolRail(page);
  await expectNoHorizontalOverflow(page);
  await expectNoRuntimeIssues(page, issues);
});

test('support overlays lock page scroll and Escape restores the visible trigger', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 720, width: 1280});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!);
  const root = page.locator(ROOT);
  const stageBefore = await stableBox(page.locator(STAGE));

  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.dataset.e2eScrollSpacer = 'true';
    spacer.style.height = '720px';
    document.body.append(spacer);
  });
  const mapTrigger = await liveControl(page, 'map');
  await mapTrigger.click();
  await expect(root).toHaveAttribute('data-support-modal-open', 'true');
  expect(await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflowY,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
    scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
  }))).toEqual({
    bodyOverflow: 'hidden',
    htmlOverflow: 'hidden',
    scrollbarGutter: 'stable',
  });

  const lockedScrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 640);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.scrollY)).toBe(lockedScrollY);
  expectBoxUnchanged(stageBefore, await stableBox(page.locator(STAGE)));

  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-support-modal-open', 'false');
  await expectVisibleResponsiveFocus(page, 'map');
  await page.mouse.move(1000, 680);
  await page.mouse.wheel(0, 640);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(
    lockedScrollY,
  );
  await expectNoRuntimeIssues(page, issues);
});

test('tool focus remains visible across overlay, rail, language, and resize changes', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 1000, width: 1799});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!);
  const root = page.locator(ROOT);

  await expect(root).toHaveAttribute('data-tool-presentation', 'overlay');
  await (await liveControl(page, 'calculator')).click();
  let closeTool = page.locator(
    '.lesson-shell2__side-panel--tool > header button',
  );
  await expect(closeTool).toBeFocused();

  await page.setViewportSize({height: 1000, width: 1800});
  await expect(root).toHaveAttribute('data-tool-presentation', 'rail');
  await closeTool.click();
  await expectVisibleResponsiveFocus(page, 'calculator');

  await (await liveControl(page, 'key-terms')).click();
  await expect(root).toHaveAttribute('data-active-tool', 'key-terms');
  await expect(
    page.locator(
      '.lesson-shell2__side-panel--tool .lesson-shell2__key-terms-count',
    ),
  ).toContainText('candidate entries');
  await Promise.all([
    page.waitForURL(/\/es\/courses\/4\/3\?mode=focus$/),
    page.locator(
      '.lesson-shell2__language [data-responsive-focus-key="language-es"]',
    ).click(),
  ]);
  await expect(page.locator(ROOT)).toHaveAttribute(
    'data-active-tool',
    'key-terms',
  );
  closeTool = page.locator('.lesson-shell2__side-panel--tool > header button');
  await expect(closeTool).toBeFocused();
  await expect(
    page.locator(
      '.lesson-shell2__side-panel--tool .lesson-shell2__key-terms-count',
    ),
  ).toContainText('entradas candidatas');
  await page.keyboard.press('Escape');
  await expectVisibleResponsiveFocus(page, 'key-terms');

  await (await liveControl(page, 'calculator')).click();
  await page.setViewportSize({height: 700, width: 1000});
  await expect(page.locator(ROOT)).toHaveAttribute(
    'data-tool-presentation',
    'overlay',
  );
  await page.keyboard.press('Escape');
  await expectVisibleResponsiveFocus(page, 'calculator');
  await expectNoHorizontalOverflow(page);
  await expectNoRuntimeIssues(page, issues);
});

test('candidate evidence is hidden from learners and retained in explicit designer view', async ({
  baseURL,
  page,
}) => {
  await page.route('**/api/learning-events', async (route) => {
    await route.fulfill({status: 204});
  });
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openLesson(page, baseURL!, '/courses/4/3?mode=focus');
  await expect(page.locator('.lesson-shell2__status')).toHaveCount(0);
  await expectNoRuntimeIssues(page, issues);

  const designerPage = await page.context().newPage();
  await designerPage.route('**/api/learning-events', async (route) => {
    await route.fulfill({status: 204});
  });
  const designerIssues = collectRuntimeIssues(
    designerPage,
    new URL(baseURL!).origin,
  );
  await openLesson(
    designerPage,
    baseURL!,
    '/courses/4/3?mode=focus&view=designer',
  );
  const disclosure = designerPage.locator('.lesson-shell2__status');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText(
    'Current JavaScript MVP; this is not a strict-fidelity or public-release claim.',
  );
  await expect(disclosure).toContainText(
    'Pseudonymous learning events sync to the LRS',
  );
  await expectNoRuntimeIssues(designerPage, designerIssues);
  await designerPage.close();
});

for (const width of [1180, 1279] as const) {
  test(`${width}x720 keeps comfortable density without learner evidence copy`, async ({
    baseURL,
    page,
  }) => {
    await page.setViewportSize({height: 720, width});
    const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
    await openLesson(page, baseURL!);
    const root = page.locator(ROOT);

    await expect(root).toHaveAttribute('data-layout-mode', 'legacy-native');
    await expect(root).toHaveAttribute('data-layout-density', 'comfortable');
    await expect(root).toHaveAttribute(
      'data-stage-render-mode',
      'native-pixel-size',
    );
    await expect(page.locator('.lesson-shell2__status')).toHaveCount(0);
    await expect(page.locator('.controlled-ceo-preview-boundary'))
      .toHaveCount(0);
    await expectNativeStage(page);
    await expectNoHorizontalOverflow(page);
    await expectNoRuntimeIssues(page, issues);
  });
}

test('G5 VB004 supports real mouse drops to the left-hand integer target', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 720, width: 1280});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openG5Lesson(page, baseURL!);
  await selectG5Page(page, 'course-g05-l04-vb-004');

  const surface = page.locator(
    '.course-g05-l04-vb004-stage-surface[data-current-js-controls-ready="true"]',
  );
  await expect(surface).toBeVisible();
  const negativeFive = surface.locator('button[data-source-card="Src_1"]');
  const integers = surface.locator('button[data-source-target="Mc_Tar_1"]');
  const nonIntegers = surface.locator('button[data-source-target="Mc_Tar_2"]');
  await expect(negativeFive).toBeVisible();
  await expect(integers).toHaveAttribute(
    'aria-label',
    'Integers drop area; 0 of 4 placed',
  );

  await dragCenterToCenter(page, negativeFive, nonIntegers);
  const wrongFeedback = surface.locator('[data-feedback-sequence="1"]');
  await expect(wrongFeedback).toContainText('(0/8)');
  await expect(negativeFive).toBeVisible();
  await expect(integers).toHaveAttribute(
    'aria-label',
    'Integers drop area; 0 of 4 placed',
  );

  await dragCenterToCenter(page, negativeFive, integers);
  const correctFeedback = surface.locator('[data-feedback-sequence="2"]');
  await expect(correctFeedback).toContainText('(1/8)');
  await expect(surface.locator('[data-card-placed="Src_1"]')).toBeVisible();
  await expect(negativeFive).toHaveCount(0);
  await expect(integers).toHaveAttribute(
    'aria-label',
    'Integers drop area; 1 of 4 placed',
  );
  await expectNoRuntimeIssues(page, issues);
});

test('G5 FQ002 and FQ003 advance and Replay to a clean first question', async ({
  baseURL,
  page,
}) => {
  await page.setViewportSize({height: 720, width: 1280});
  const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
  await openG5Lesson(page, baseURL!);

  for (const {animationId, questionCount} of [
    {animationId: 'course-g05-l04-fq-002', questionCount: 10},
    {animationId: 'course-g05-l04-fq-003', questionCount: 18},
  ] as const) {
    await selectG5Page(page, animationId);
    const controls = page.locator(
      '[data-current-javascript-question-controls="true"]:visible',
    );
    await expect(controls.locator('legend')).toContainText(
      `Question 1 of ${questionCount}`,
    );
    await controls.locator('input[value="A"]').check();
    await controls.locator('button[type="submit"]').click();
    await expect(controls.locator('legend')).toContainText(
      `Question 2 of ${questionCount}`,
    );
    await controls.getByRole('button', {name: 'Replay quiz'}).click();
    await expect(controls.locator('legend')).toContainText(
      `Question 1 of ${questionCount}`,
    );
    await expect(controls.locator('input:checked')).toHaveCount(0);
  }
  await expectNoRuntimeIssues(page, issues);
});

test.describe('coarse-pointer companion layout', () => {
  test.use({
    hasTouch: true,
    viewport: {height: 720, width: 1280},
  });

  test('an authored page companion keeps its protected rows beside the native stage', async ({
    baseURL,
    page,
  }) => {
    const issues = collectRuntimeIssues(page, new URL(baseURL!).origin);
    await openLesson(page, baseURL!);
    const root = page.locator(ROOT);
    const stageBefore = await expectNativeStage(page);

    await expect(root).toHaveAttribute('data-coarse-pointer', 'true');
    // A coarse pointer keeps the labelled toolbar live at a wide viewport even
    // though the stage is native-sized — the second case it was built for.
    await expectSingleLiveControlSurface(page, 'modern-wide');
    await selectPageFromCourseMap(page, PLAYER, 'course-g04-l03-gs-002');
    const companionSurface = page.locator(
      '[data-page-interaction-companion-surface="gs002-mobile"]',
    );
    await expect(companionSurface).toHaveCount(1);

    const companionHost = page.locator(
      '[data-page-interaction-companion-host="true"]',
    );
    const toolbar = page.locator('.lesson-shell2__modern-toolbar');
    const toolbarBox = await stableBox(toolbar);
    const actions = page.locator('.lesson-shell2__learning-actions');
    const actionsBox = await stableBox(actions);
    const rows = await page.evaluate(() => ({
      actions: getComputedStyle(
        document.querySelector('.lesson-shell2__learning-actions')!,
      ).gridRowStart,
      companion: getComputedStyle(
        document.querySelector('[data-page-interaction-companion-host="true"]')!,
      ).gridRowStart,
      companionDisplay: getComputedStyle(
        document.querySelector('[data-page-interaction-companion-host="true"]')!,
      ).display,
      companionMembers: document.querySelector(
        '[data-page-interaction-companion-host="true"]',
      )!.childElementCount,
      toolbar: getComputedStyle(
        document.querySelector('.lesson-shell2__modern-toolbar')!,
      ).gridRowStart,
    }));

    expect(rows.companionDisplay).toBe('block');
    expect(rows.companion).toBe('2');
    expect(rows.companionMembers).toBeGreaterThan(0);
    expect(rows.toolbar).toBe('3');
    expect(rows.actions).toBe('5');
    expect(toolbarBox.y + toolbarBox.height).toBeLessThanOrEqual(actionsBox.y + 1);
    await expect(companionHost).toHaveAttribute(
      'data-page-interaction-companion-host',
      'true',
    );
    expectBoxUnchanged(stageBefore, await stableBox(page.locator(STAGE)));
    await expectNoHorizontalOverflow(page);
    await expectNoRuntimeIssues(page, issues);
  });
});
