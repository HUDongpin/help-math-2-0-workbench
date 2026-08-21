import {expect, test, type Page} from '@playwright/test';

/**
 * A canvas-backed page must never be drawn larger than its backing store.
 *
 * Widening the lesson plane is a win for the 36 SVG pages, but the three pages
 * that composite a loaded-SWF canvas carry a fixed pixel buffer. Stretching
 * that buffer across a wider plane is a visible quality regression, so the
 * canvas caps itself at the pixels it actually has.
 */

const MODERN_WIDE = process.env.MODERN_WIDE_SHELL_ENABLED === 'true';
const CANVAS_PAGES = [
  'course-g04-l03-in-003',
  'course-g04-l03-rw-003',
];

async function open(page: Page, animationId: string) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto(`/animations/${animationId}`, {waitUntil: 'domcontentloaded'});
  await page.waitForLoadState('networkidle');
}

test.describe('canvas pages keep their resolution', () => {
  test.skip(!MODERN_WIDE, 'MODERN_WIDE_SHELL_ENABLED is not true');

  for (const animationId of CANVAS_PAGES) {
    test(`${animationId} is not upscaled past its backing store`, async ({page}) => {
      await page.setViewportSize({width: 1920, height: 1080});
      await open(page, animationId);

      const canvas = page.locator('canvas.faithful-stage-wrap').first();
      const count = await canvas.count();
      test.skip(count === 0, 'page did not mount a loaded-SWF canvas here');

      const measured = await canvas.evaluate((element) => {
        const node = element as HTMLCanvasElement;
        const box = node.getBoundingClientRect();
        return {backing: node.width, css: box.width};
      });

      expect(
        measured.css,
        `${animationId}: drawn at ${measured.css}px from a ${measured.backing}px buffer`,
      ).toBeLessThanOrEqual(measured.backing + 1);
    });
  }

  test('lesson Page 2 retains one visible Canvas while its 12 fps frames advance', async ({page}) => {
    const runtimeErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.route('**/api/learning-events', async (route) => {
      await route.fulfill({status: 204});
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.setViewportSize({width: 1440, height: 900});
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto('/courses/4/3?mode=focus', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator(
      '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
    )).toHaveAttribute('data-hydrated', 'true');
    const chromeSession = await page.context().newCDPSession(page);
    await chromeSession.send('Emulation.setCPUThrottlingRate', {rate: 2});
    await page.locator(
      '.lesson-shell2__spine button[data-section-code="RW"]',
    ).click();
    await expect(page.locator('[data-current-page="2"]')).toBeVisible();

    const canvas = page.locator(
      'canvas[data-course-canvas="course-g04-l03-rw-002"]',
    );
    const candidate = canvas.locator('xpath=ancestor::*[@data-canvas-status][1]');
    await expect(candidate).toHaveAttribute('data-canvas-status', 'ready', {
      timeout: 15_000,
    });
    await expect(canvas).toBeVisible();

    const observation = await canvas.evaluate(async (element) => {
      const node = element as HTMLCanvasElement;
      const host = node.closest<HTMLElement>('[data-canvas-status]');
      if (!host) throw new Error('Page 2 Canvas status host is missing');
      const frames = new Set<string>();
      const statuses = new Set<string>();
      const displayValues = new Set<string>();
      let disconnectedSamples = 0;
      let hiddenSamples = 0;
      let updatingCaptureReadySamples = 0;
      let zeroRectSamples = 0;

      const record = () => {
        const status = host.dataset.canvasStatus ?? 'missing';
        const display = getComputedStyle(node).display;
        const rect = node.getBoundingClientRect();
        statuses.add(status);
        displayValues.add(display);
        const frame = node.getAttribute('data-flash-frame');
        if (frame) frames.add(frame);
        if (!node.isConnected || !host.contains(node)) disconnectedSamples += 1;
        if (display === 'none' || getComputedStyle(node).visibility === 'hidden') {
          hiddenSamples += 1;
        }
        if (rect.width <= 0 || rect.height <= 0) zeroRectSamples += 1;
        if (status === 'updating' && node.dataset.captureStage === 'true') {
          updatingCaptureReadySamples += 1;
        }
      };
      const statusObserver = new MutationObserver((records) => {
        for (const mutation of records) {
          if (mutation.oldValue) statuses.add(mutation.oldValue);
        }
        record();
      });
      statusObserver.observe(host, {
        attributeFilter: ['data-canvas-status'],
        attributeOldValue: true,
        attributes: true,
      });
      const canvasObserver = new MutationObserver((records) => {
        for (const mutation of records) {
          if (mutation.attributeName === 'style' && mutation.oldValue) {
            const oldDisplay = /display:\s*([^;]+)/u.exec(mutation.oldValue)?.[1];
            if (oldDisplay) displayValues.add(oldDisplay.trim());
          }
        }
        record();
      });
      canvasObserver.observe(node, {
        attributeFilter: ['data-capture-stage', 'data-flash-frame', 'style'],
        attributeOldValue: true,
        attributes: true,
      });

      const deadline = performance.now() + 2_200;
      while (performance.now() < deadline) {
        record();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      statusObserver.disconnect();
      canvasObserver.disconnect();
      return {
        disconnectedSamples,
        displayValues: [...displayValues],
        frameCount: frames.size,
        hiddenSamples,
        statuses: [...statuses],
        updatingCaptureReadySamples,
        zeroRectSamples,
      };
    });

    expect(observation.frameCount).toBeGreaterThanOrEqual(8);
    expect(observation.disconnectedSamples).toBe(0);
    expect(observation.hiddenSamples).toBe(0);
    expect(observation.zeroRectSamples).toBe(0);
    expect(observation.updatingCaptureReadySamples).toBe(0);
    expect(observation.displayValues).not.toContain('none');
    expect(observation.statuses).not.toContain('idle');
    expect(observation.statuses).not.toContain('loading');
    expect(observation.statuses).not.toContain('error');
    expect(observation.statuses).not.toContain('blocked');
    expect(observation.statuses.every((status) =>
      status === 'ready' || status === 'updating'
    )).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });
});
