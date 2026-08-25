import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';

/**
 * Bounded product verification for adaptive Canvas resolution.
 *
 * This suite exercises a representative Canvas through the modern My Lesson
 * surface and the approved 1x/2x device matrix. It deliberately does not claim
 * 283/283 browser execution, performance-budget closure, long-running memory
 * or listener-leak closure, visual fidelity, human/Owner acceptance, strict
 * completion, release, or production publication. Those gates require an
 * active v2 production profile plus separately executed evidence.
 */

const VECTOR_PILOT = 'course-g04-l03-in-002';
const NAVIGATION_PILOT = 'course-g04-l03-in-003';
const MY_LESSON_ROUTE = '/courses/4/3?mode=focus';
const MY_LESSON_PLAYER =
  '[data-lesson-player="g4-l3-whole-lesson-mvp"]';
const PRODUCTION_LESSONS = [
  '/courses/3/2',
  '/courses/4/3',
  '/courses/5/3',
  '/courses/5/4',
  '/courses/5/5',
] as const;

type LessonLocale = 'en' | 'es';

interface RuntimeSignals {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
  readonly failedRequests: string[];
  readonly unexpectedLegacyRequests: string[];
}

function observeRuntime(page: Page): RuntimeSignals {
  const signals: RuntimeSignals = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    unexpectedLegacyRequests: [],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') signals.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => signals.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    signals.failedRequests.push(
      `${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`,
    );
  });
  return signals;
}

function isUnexpectedLegacyRequest(rawURL: string) {
  let inspected = rawURL;
  try {
    const url = new URL(rawURL);
    inspected = `${url.hostname}${url.pathname}${url.search}`;
  } catch {
    // Playwright normally supplies absolute URLs. Preserve a fail-closed
    // string check if a non-standard request URL reaches this helper.
  }
  try {
    inspected = decodeURIComponent(inspected);
  } catch {
    // A malformed escape must not disable the raw-string policy check.
  }
  const normalized = inspected.toLowerCase();
  return /\.(?:swf|fla)(?:$|[?&#])/u.test(normalized) ||
    /(?:^|[/_.@-])ruffle(?:$|[/_.@-])/u.test(normalized);
}

async function preparePage(page: Page, signals: RuntimeSignals) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (isUnexpectedLegacyRequest(url)) {
      signals.unexpectedLegacyRequests.push(url);
      await route.abort('blockedbyclient');
      return;
    }
    await route.fallback();
  });
  await page.route('**/api/learning-events', async (route) => {
    await route.fulfill({status: 204});
  });
}

async function openMyLesson(
  page: Page,
  baseURL: string,
  locale: LessonLocale,
  signals: RuntimeSignals,
) {
  await preparePage(page, signals);
  const prefix = locale === 'es' ? '/es' : '';
  const response = await page.goto(
    new URL(`${prefix}${MY_LESSON_ROUTE}`, baseURL).href,
    {waitUntil: 'domcontentloaded'},
  );
  expect(response?.status()).toBe(200);

  const player = page.locator(MY_LESSON_PLAYER);
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute('data-hydrated', 'true');
  await expect(player).toHaveAttribute('data-resume-decision', 'resolved');
  await expect(player).toHaveAttribute('lang', locale);
  await expect(page.locator('main.lesson-shell2')).toHaveAttribute(
    'data-host-presentation',
    'modern-wide',
  );
  return player;
}

async function waitForCurrentCanvas(
  page: Page,
  player: Locator,
  animationId: string,
  pageOrdinal: number,
) {
  await expect(player).toHaveAttribute('data-current-page', String(pageOrdinal));
  await expect(player).toHaveAttribute('data-current-animation-id', animationId);
  const runtime = page.locator(
    `${MY_LESSON_PLAYER} .runtime-stage[data-animation-id="${animationId}"]`,
  );
  await expect(runtime).toBeVisible();
  const canvas = runtime.locator(
    `canvas[data-course-canvas="${animationId}"]`,
  );
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const host = canvas.locator('xpath=ancestor::*[@data-canvas-status][1]');
  await expect(host).toHaveAttribute('data-canvas-status', 'ready');
  await expect(canvas).toHaveAttribute('data-render-state', 'ready');
  return canvas;
}

async function openVectorPilot(
  page: Page,
  baseURL: string,
  signals: RuntimeSignals,
) {
  const player = await openMyLesson(page, baseURL, 'en', signals);
  await player.locator(
    '.lesson-shell2__spine button[data-section-code="IN"]',
  ).click();
  const canvas = await waitForCurrentCanvas(
    page,
    player,
    VECTOR_PILOT,
    13,
  );
  return {canvas, player};
}

async function inspectCanvas(canvasLocator: Locator) {
  return canvasLocator.evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const runtime = canvas.closest<HTMLElement>('.runtime-stage');
    const lesson = canvas.closest<HTMLElement>('[data-lesson-player]');
    const host = canvas.closest<HTMLElement>('[data-canvas-status]');
    const isVisible = (candidate: HTMLCanvasElement) => {
      const box = candidate.getBoundingClientRect();
      const style = getComputedStyle(candidate);
      return candidate.isConnected && !candidate.hidden &&
        box.width > 0 && box.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && style.opacity !== '0';
    };
    const visibleRuntimeCanvases = runtime
      ? [...runtime.querySelectorAll<HTMLCanvasElement>('canvas')]
          .filter(isVisible)
      : [];
    const visibleLessonCanvases = lesson
      ? [...lesson.querySelectorAll<HTMLCanvasElement>('canvas')]
          .filter(isVisible)
      : [];

    return {
      animationId: canvas.dataset.courseCanvas,
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      declaredBackingWidth: Number(canvas.dataset.canvasBackingWidth),
      declaredBackingHeight: Number(canvas.dataset.canvasBackingHeight),
      cssWidth: rect.width,
      cssHeight: rect.height,
      dpr: window.devicePixelRatio,
      renderScale: Number(canvas.dataset.renderScale),
      resolutionStatus: canvas.dataset.resolutionStatus,
      ceilingReached: canvas.dataset.resolutionCeilingReached,
      renderState: canvas.dataset.renderState,
      hostStatus: host?.dataset.canvasStatus,
      frame: canvas.dataset.flashFrame,
      frameDomain: canvas.dataset.flashFrameDomain,
      language: canvas.dataset.flashLang ?? canvas.dataset.runtimeLanguage,
      rootFrame: canvas.dataset.flashRootFrame,
      scenario: canvas.dataset.flashScenario ?? canvas.dataset.runtimeScenario,
      seed: canvas.dataset.flashSeed ?? canvas.dataset.runtimeSeed,
      runtimeAnimationId: runtime?.dataset.animationId,
      runtimeFrameDomain: runtime?.dataset.flashFrameDomain,
      runtimeLanguage:
        runtime?.dataset.flashLang ?? runtime?.dataset.runtimeLanguage,
      runtimeRootFrame: runtime?.dataset.flashRootFrame,
      runtimeScenario:
        runtime?.dataset.flashScenario ?? runtime?.dataset.runtimeScenario,
      runtimeSeed: runtime?.dataset.flashSeed ?? runtime?.dataset.runtimeSeed,
      visibleRuntimeCanvasCount: visibleRuntimeCanvases.length,
      visibleLessonCanvasCount: visibleLessonCanvases.length,
    };
  });
}

async function withContext(
  browser: Browser,
  baseURL: string,
  options: {width: number; height: number; dpr: number},
  callback: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext({
    baseURL,
    deviceScaleFactor: options.dpr,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: options.width, height: options.height},
  });
  try {
    await callback(await context.newPage());
  } finally {
    await context.close();
  }
}

function expectDensity(
  measured: Awaited<ReturnType<typeof inspectCanvas>>,
  expectedScale: 1 | 2,
  expectedStatus: 'native' | 'retina' | 'capped',
) {
  const demandedScale = Math.ceil(Math.max(
    (measured.cssWidth * measured.dpr) / 800,
    (measured.cssHeight * measured.dpr) / 600,
  ));
  const selectedScale = Math.min(2, Math.max(1, demandedScale));

  expect(measured.renderScale).toBe(expectedScale);
  expect(measured.renderScale).toBe(selectedScale);
  expect(measured.backingWidth).toBe(800 * expectedScale);
  expect(measured.backingHeight).toBe(600 * expectedScale);
  expect(measured.declaredBackingWidth).toBe(measured.backingWidth);
  expect(measured.declaredBackingHeight).toBe(measured.backingHeight);
  expect(measured.cssWidth).toBeLessThanOrEqual(800.5);
  expect(measured.cssHeight).toBeLessThanOrEqual(600.5);
  expect(measured.resolutionStatus).toBe(expectedStatus);
  expect(measured.ceilingReached).toBe(String(demandedScale > 2));
  expect(measured.renderState).toBe('ready');
  expect(measured.hostStatus).toBe('ready');
}

function expectCoherentIdentity(
  measured: Awaited<ReturnType<typeof inspectCanvas>>,
) {
  expect(measured.animationId).toBe(measured.runtimeAnimationId);
  expect(measured.frameDomain).toBe(measured.runtimeFrameDomain);
  expect(measured.language).toBe(measured.runtimeLanguage);
  expect(measured.rootFrame).toBe(measured.runtimeRootFrame);
  expect(measured.scenario).toBe(measured.runtimeScenario);
  expect(measured.seed).toBe(measured.runtimeSeed);
  expect(measured.frame).toMatch(/^\d+$/u);
}

function stableIdentity(
  measured: Awaited<ReturnType<typeof inspectCanvas>>,
) {
  return {
    animationId: measured.animationId,
    frameDomain: measured.frameDomain,
    language: measured.language,
    rootFrame: measured.rootFrame,
    scenario: measured.scenario,
    seed: measured.seed,
  };
}

function expectOneVisibleProductCanvas(
  measured: Awaited<ReturnType<typeof inspectCanvas>>,
) {
  expect(measured.visibleRuntimeCanvasCount).toBe(1);
  expect(measured.visibleLessonCanvasCount).toBe(1);
}

function expectCleanSignals(signals: RuntimeSignals) {
  expect(signals.consoleErrors).toEqual([]);
  expect(signals.pageErrors).toEqual([]);
  expect(signals.failedRequests).toEqual([]);
  expect(signals.unexpectedLegacyRequests).toEqual([]);
}

test.describe('adaptive Canvas resolution production contract', () => {
  test('browser project and exact preview origin are recorded for the hash-bound run receipt', async ({
    baseURL,
    browser,
    browserName,
    page,
  }, testInfo) => {
    expect(baseURL).toBeTruthy();
    const userAgent = await page.evaluate(() => navigator.userAgent);
    await testInfo.attach('canvas-resolution-browser-environment', {
      body: Buffer.from(JSON.stringify({
        schemaVersion: 1,
        artifactType: 'canvas-resolution-browser-environment',
        projectName: testInfo.project.name,
        baseURL,
        browserName,
        browserVersion: browser.version(),
        userAgent,
        nodeVersion: process.versions.node,
        platform: process.platform,
        architecture: process.arch,
        performanceScope:
          process.env.CANVAS_RESOLUTION_PERFORMANCE_SCOPE ?? null,
      })),
      contentType: 'application/json',
    });
  });

  test('modern My Lesson DPR2 paints one 1600x1200 Canvas from the immutable binding', async ({
    baseURL,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    const signals = observeRuntime(page);
    await page.setViewportSize({width: 1440, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const {canvas} = await openVectorPilot(page, baseURL!, signals);
    await expect(canvas).toHaveAttribute('data-render-scale', '2');
    const measured = await inspectCanvas(canvas);
    expectDensity(measured, 2, 'retina');
    expectCoherentIdentity(measured);
    expectOneVisibleProductCanvas(measured);

    const assetLoad = await page.evaluate((animationId) => {
      const script = document.querySelector<HTMLScriptElement>(
        `script[data-help-math-canvas-asset="${animationId}"]`,
      );
      return script ? {
        src: script.src,
        integrity: script.integrity,
        crossOrigin: script.crossOrigin,
      } : null;
    }, VECTOR_PILOT);
    expect(assetLoad?.src).toMatch(
      /\/flash-assets\/by-sha256\/[a-f0-9]{64}\/courses\/course-g04-l03-in-002\/canvas-renderer\.js$/u,
    );
    expect(assetLoad?.integrity).toMatch(/^sha256-[A-Za-z0-9+/]+={0,2}$/u);
    expect(assetLoad?.crossOrigin).toBe('anonymous');
    expectCleanSignals(signals);
  });

  test('responsive resize changes only integer scale and retains runtime identity', async ({
    baseURL,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    const signals = observeRuntime(page);
    await page.setViewportSize({width: 1440, height: 900});
    const {canvas} = await openVectorPilot(page, baseURL!, signals);
    await expect(canvas).toHaveAttribute('data-render-scale', '2');
    const before = await inspectCanvas(canvas);
    const identity = stableIdentity(before);

    await page.setViewportSize({width: 400, height: 844});
    await expect(canvas).toHaveAttribute('data-render-scale', '1');
    const compact = await inspectCanvas(canvas);
    expectDensity(compact, 1, 'native');
    expectCoherentIdentity(compact);
    expect(stableIdentity(compact)).toEqual(identity);
    expectOneVisibleProductCanvas(compact);

    await page.setViewportSize({width: 1440, height: 900});
    await expect(canvas).toHaveAttribute('data-render-scale', '2');
    const restored = await inspectCanvas(canvas);
    expectDensity(restored, 2, 'retina');
    expectCoherentIdentity(restored);
    expect(stableIdentity(restored)).toEqual(identity);
    expectOneVisibleProductCanvas(restored);
    expectCleanSignals(signals);
  });

  test('Next, Previous, and Replay preserve scale and deterministic identity', async ({
    baseURL,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    const signals = observeRuntime(page);
    await page.setViewportSize({width: 1440, height: 900});
    const {canvas, player} = await openVectorPilot(page, baseURL!, signals);
    const initial = await inspectCanvas(canvas);
    expectDensity(initial, 2, 'retina');
    expectCoherentIdentity(initial);
    const initialIdentity = stableIdentity(initial);

    await player.locator(
      '.lesson-shell2__learning-actions [data-responsive-focus-key="next"]',
    ).click();
    const nextCanvas = await waitForCurrentCanvas(
      page,
      player,
      NAVIGATION_PILOT,
      14,
    );
    const next = await inspectCanvas(nextCanvas);
    expectDensity(next, 2, 'retina');
    expectCoherentIdentity(next);
    expect(next.animationId).toBe(NAVIGATION_PILOT);
    expect(next.language).toBe(initial.language);
    expect(next.seed).toBe(initial.seed);
    expectOneVisibleProductCanvas(next);

    await player.locator(
      '.lesson-shell2__learning-actions [data-responsive-focus-key="previous"]',
    ).click();
    const returnedCanvas = await waitForCurrentCanvas(
      page,
      player,
      VECTOR_PILOT,
      13,
    );
    const returned = await inspectCanvas(returnedCanvas);
    expectDensity(returned, 2, 'retina');
    expectCoherentIdentity(returned);
    expect(stableIdentity(returned)).toEqual(initialIdentity);
    expectOneVisibleProductCanvas(returned);

    const replayCount = Number(
      await player.getAttribute('data-current-replay-count'),
    );
    expect(Number.isSafeInteger(replayCount)).toBe(true);
    await player.locator(
      '.lesson-shell2__modern-toolbar [data-responsive-focus-key="replay"]',
    ).click();
    await expect(player).toHaveAttribute(
      'data-current-replay-count',
      String(replayCount + 1),
    );
    const replayCanvas = await waitForCurrentCanvas(
      page,
      player,
      VECTOR_PILOT,
      13,
    );
    const replayed = await inspectCanvas(replayCanvas);
    expectDensity(replayed, 2, 'retina');
    expectCoherentIdentity(replayed);
    expect(stableIdentity(replayed)).toEqual(initialIdentity);
    expectOneVisibleProductCanvas(replayed);
    expectCleanSignals(signals);
  });

  test('reduced-motion on and off redraws without changing scale or identity', async ({
    baseURL,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    const signals = observeRuntime(page);
    await page.setViewportSize({width: 1440, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const {canvas} = await openVectorPilot(page, baseURL!, signals);
    const note = page.locator(`${MY_LESSON_PLAYER} .reduced-motion-note`);
    await expect(note).toHaveCount(0);
    const before = await inspectCanvas(canvas);
    expectDensity(before, 2, 'retina');
    const identity = stableIdentity(before);

    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect(note).toBeVisible();
    const reducedCanvas = page.locator(
      `${MY_LESSON_PLAYER} .runtime-stage[data-animation-id="${VECTOR_PILOT}"] ` +
        `canvas[data-course-canvas="${VECTOR_PILOT}"]`,
    );
    await expect(reducedCanvas).toHaveAttribute('data-render-state', 'ready');
    const reduced = await inspectCanvas(reducedCanvas);
    expectDensity(reduced, 2, 'retina');
    expectCoherentIdentity(reduced);
    expect(stableIdentity(reduced)).toEqual(identity);
    expect(reduced.frame).toBe('1');
    expectOneVisibleProductCanvas(reduced);

    await page.emulateMedia({reducedMotion: 'no-preference'});
    await expect(note).toHaveCount(0);
    await expect(reducedCanvas).toHaveAttribute('data-render-state', 'ready');
    const restored = await inspectCanvas(reducedCanvas);
    expectDensity(restored, 2, 'retina');
    expectCoherentIdentity(restored);
    expect(stableIdentity(restored)).toEqual(identity);
    expectOneVisibleProductCanvas(restored);
    expectCleanSignals(signals);
  });

  test('DPR1, compact DPR2, compact DPR3, and wide DPR3 follow the approved matrix', async ({
    baseURL,
    browser,
  }) => {
    expect(baseURL).toBeTruthy();
    const cases = [
      {width: 1440, height: 900, dpr: 1, scale: 1 as const, status: 'native' as const},
      {width: 400, height: 844, dpr: 2, scale: 1 as const, status: 'native' as const},
      {width: 390, height: 844, dpr: 3, scale: 2 as const, status: 'retina' as const},
      {width: 1440, height: 900, dpr: 3, scale: 2 as const, status: 'capped' as const},
    ];
    for (const item of cases) {
      await withContext(browser, baseURL!, item, async (page) => {
        const signals = observeRuntime(page);
        const {canvas} = await openVectorPilot(page, baseURL!, signals);
        await expect(canvas).toHaveAttribute(
          'data-render-scale',
          String(item.scale),
        );
        const measured = await inspectCanvas(canvas);
        expectDensity(measured, item.scale, item.status);
        expectCoherentIdentity(measured);
        expectOneVisibleProductCanvas(measured);
        expectCleanSignals(signals);
      });
    }
  });

  test('EN and ES My Lesson routes hydrate with their exact runtime locale', async ({
    baseURL,
    browser,
  }) => {
    expect(baseURL).toBeTruthy();
    for (const locale of ['en', 'es'] as const) {
      await withContext(
        browser,
        baseURL!,
        {width: 1440, height: 900, dpr: 2},
        async (page) => {
          const signals = observeRuntime(page);
          const player = await openMyLesson(
            page,
            baseURL!,
            locale,
            signals,
          );
          const animationId = await player.getAttribute(
            'data-current-animation-id',
          );
          expect(animationId).toBeTruthy();
          await expect(player.locator(
            `.runtime-stage[data-animation-id="${animationId}"]`,
          )).toHaveAttribute('data-flash-lang', locale);
          expectCleanSignals(signals);
        },
      );
    }
  });

  test('all five EN/ES Lesson routes stay available and candidate Lessons stay absent', async ({
    baseURL,
    browserName,
    request,
  }) => {
    test.skip(browserName !== 'chromium', 'route closure is browser-independent');
    expect(baseURL).toBeTruthy();
    for (const route of PRODUCTION_LESSONS) {
      for (const prefix of ['', '/es']) {
        const response = await request.get(new URL(`${prefix}${route}`, baseURL!).href);
        expect(response.status(), `${prefix}${route}`).toBe(200);
      }
    }
    for (const lesson of ['5', '10', '11']) {
      for (const prefix of ['', '/es']) {
        const response = await request.get(
          new URL(`${prefix}/courses/4/${lesson}`, baseURL!).href,
        );
        expect(response.status(), `${prefix}/courses/4/${lesson}`).toBe(404);
      }
    }
  });

  test('wrong digest and bare controlled renderer paths fail closed', async ({
    baseURL,
    browserName,
    request,
  }) => {
    test.skip(browserName !== 'chromium', 'route closure is browser-independent');
    expect(baseURL).toBeTruthy();
    const wrong = `/flash-assets/by-sha256/${'0'.repeat(64)}/courses/${VECTOR_PILOT}/canvas-renderer.js`;
    const bare = `/flash-assets/courses/${VECTOR_PILOT}/canvas-renderer.js`;
    expect((await request.get(new URL(wrong, baseURL!).href)).status()).toBe(404);
    expect((await request.get(new URL(bare, baseURL!).href)).status()).toBe(404);
  });
});
