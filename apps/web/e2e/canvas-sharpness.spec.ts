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
});
