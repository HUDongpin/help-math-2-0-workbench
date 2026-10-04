import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';
import program from '../config/current-js-controlled-preview.v1.json' with {type: 'json'};

// This suite verifies the explicitly selected 1751-page serving profile.
// It does not grant strict migration, audio-listening, or lesson publication acceptance.
test('release scope remains 29 courses and 1751 active page occurrences', () => {
  expect(program.courses).toHaveLength(29);
  expect(program.courses.reduce((n, course) => n + course.pageCount, 0)).toBe(1751);
  expect(Object.values(program.authority).every((value) => value === false)).toBe(true);
});

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : '';
  for (const course of program.courses) {
    test(`${locale} G${course.grade} L${course.lesson} renders its registered lesson host`, async ({page}) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(`${prefix}/courses/${course.grade}/${course.lesson}?mode=focus`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const host = page.locator('.lesson-shell2');
      await expect(host).toBeVisible();
      await expect(host).toHaveAttribute('data-current-js-pages', String(course.pageCount));
      await expect(host).toHaveAttribute('data-release-id', course.releaseId);
      await expect(host).toHaveAttribute('data-runtime-available', 'true');
      await expect(page.locator('.runtime-stage')).toHaveAttribute('data-runtime-first-paint', 'ready', {timeout: 45000});
      await expect(host).toHaveAttribute('data-current-animation-id', /.+/);
      await expect(page.locator('object, embed, [src$=".swf"], [data$=".swf"]')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  for (const width of [1280, 390]) {
    test(`${locale} learning home and lesson navigation at ${width}px`, async ({page}) => {
      await page.setViewportSize({width, height: 900});
      expect((await page.goto(prefix || '/'))?.status()).toBe(200);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      expect((await page.goto(`${prefix}/courses/4/3?mode=focus`))?.status()).toBe(200);
      const host = page.locator('.lesson-shell2');
      await expect(host).toHaveAttribute('data-runtime-available', 'true');
      const first = await host.getAttribute('data-current-animation-id');
      const next = locale === 'es' ? 'Página siguiente' : 'Next page';
      const previous = locale === 'es' ? 'Página anterior' : 'Previous page';
      await page.locator(width === 390 ? '[data-lesson-nav="action-next"]:visible' : `button[aria-label="${next}"]:visible`).first().click();
      await expect.poll(() => host.getAttribute('data-current-animation-id')).not.toBe(first);
      await expect(host).toHaveAttribute('data-runtime-available', 'true');
      await page.locator(width === 390 ? '[data-lesson-nav="action-previous"]:visible' : `button[aria-label="${previous}"]:visible`).first().click();
      await expect(host).toHaveAttribute('data-current-animation-id', first!);
      await expect(host).toHaveAttribute('data-runtime-available', 'true');
    });
  }

  for (const route of ['', '/courses/4/3?mode=focus']) {
    test(`${locale} ${route || 'home'} has no serious or critical accessibility violations`, async ({page}) => {
      expect((await page.goto(`${prefix}${route}` || '/'))?.status()).toBe(200);
      if (route) await expect(page.locator('.lesson-shell2')).toHaveAttribute('data-runtime-available', 'true');
      const report = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(report.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    });
  }
}

for (const route of ['/courses/6/1', '/courses/3/999', '/es/courses/6/1', '/reference/not-authorized', '/migration-status', '/flash-assets/not-authorized.mp3', '/login', '/contact', '/demos', '/demos/conversion-1-2', '/demos/conversion-1-4', '/library', '/api/ruffle/ruffle.js']) {
  test(`production denies ${route}`, async ({request}) => {
    const response = await request.get(route, {maxRedirects: 0});
    expect(response.status()).toBe(404);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  });
}

test.describe('lesson playback waits for rendering and recovers failed assets', () => {
  test.use({contextOptions: {reducedMotion: 'no-preference'}, viewport: {width: 1440, height: 1000}});

  test('EN G3 L1 holds the clock while its Canvas script is delayed', async ({page}) => {
    const assetPath = '/flash-assets/courses/course-g03-l01-ir-001-f1ec7620/canvas-renderer.js';
    let releaseAsset!: () => void;
    const assetGate = new Promise<void>((resolve) => {releaseAsset = resolve;});
    let requested = false;
    await page.route('**/*', async (route) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        await route.abort('blockedbyclient');
        return;
      }
      if (new URL(route.request().url()).pathname === assetPath) {
        requested = true;
        await assetGate;
      }
      await route.continue();
    });
    try {
      await page.goto('/courses/3/1?mode=focus', {waitUntil: 'domcontentloaded'});
      const stage = page.locator('.runtime-stage');
      await expect.poll(() => requested).toBe(true);
      await expect(stage).toHaveAttribute('data-runtime-first-paint', 'waiting');
      const initialFrame = await stage.getAttribute('data-flash-frame');
      await page.waitForTimeout(3500);
      await expect(stage).toHaveAttribute('data-flash-frame', initialFrame!);
      await expect(page.locator('.runtime-shell')).toHaveAttribute('data-runtime-playback-complete', 'false');
      releaseAsset();
      await expect(stage).toHaveAttribute('data-runtime-first-paint', 'ready');
      await expect(stage.locator('canvas')).toHaveAttribute('data-render-state', 'ready');
      await expect.poll(async () => Number(await stage.getAttribute('data-flash-frame'))).toBeGreaterThan(Number(initialFrame));
    } finally {
      releaseAsset();
    }
  });

  for (const sample of [
    {name: 'EN G3 source Canvas', route: '/courses/3/1', assetPath: '/flash-assets/courses/course-g03-l01-ir-001-f1ec7620/canvas-renderer.js'},
    {name: 'EN G4 loaded-SWF host', route: '/courses/4/3', assetPath: '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js'},
    {name: 'ES G5 source Canvas', route: '/es/courses/5/4', assetPath: '/flash-assets/courses/course-g05-l04-ir-001-a662633d/canvas-renderer.js'},
  ]) {
    test(`${sample.name} retries a failed script when the learner presses Replay`, async ({page}) => {
      let attempts = 0;
      await page.route('**/*', async (route) => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
          await route.abort('blockedbyclient');
          return;
        }
        if (new URL(route.request().url()).pathname === sample.assetPath && ++attempts === 1) {
          await route.abort('failed');
          return;
        }
        await route.continue();
      });
      // The old renderer's error state lasts only one clock tick. The failed
      // request is the stable evidence that the intended fault was injected.
      const failedRequest = page.waitForEvent('requestfailed', {
        predicate: (request) => new URL(request.url()).pathname === sample.assetPath,
      });
      await page.goto(`${sample.route}?mode=focus`, {waitUntil: 'domcontentloaded'});
      await failedRequest;
      const stage = page.locator('.runtime-stage');
      await expect(stage).toBeVisible();
      await page.locator('[data-responsive-focus-key="replay"]:visible').first().click();
      await expect.poll(() => attempts, {timeout: 15000}).toBeGreaterThan(1);
      await expect(stage).toHaveAttribute('data-runtime-first-paint', 'ready', {timeout: 15000});
      const canvas = stage.locator('canvas').first();
      await expect(canvas).toHaveAttribute('data-render-state', 'ready');
      // These source introductions deliberately open on a blank first frame.
      // Wait for their natural reveal; never seek or synthesize a visible frame.
      await expect.poll(async () => canvas.evaluate((element) => {
        const probe = document.createElement('canvas');
        probe.width = 80;
        probe.height = 60;
        const context = probe.getContext('2d')!;
        context.drawImage(element as HTMLCanvasElement, 0, 0, 80, 60);
        const pixels = context.getImageData(0, 0, 80, 60).data;
        const colors = new Set<string>();
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] > 0) colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
        }
        return colors.size;
      }), {timeout: 8000}).toBeGreaterThan(3);
      const frame = Number(await stage.getAttribute('data-flash-frame'));
      await expect.poll(async () => Number(await stage.getAttribute('data-flash-frame'))).toBeGreaterThan(frame);
    });
  }
});
