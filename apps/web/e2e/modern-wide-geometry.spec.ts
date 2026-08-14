import {expect, test, type Page} from '@playwright/test';

/**
 * Phase 0 measurement spec for the widescreen presentation.
 *
 * Records what the learner actually gets at each breakpoint and pins the
 * invariants the presentation depends on: the authored content band keeps its
 * aspect, the chrome rows are cropped exactly, nothing clips, and the control
 * surface stays single.
 *
 * Runs only when the deployment opts into the presentation, so the default
 * suite is unaffected.
 */

const MODERN_WIDE = process.env.MODERN_WIDE_SHELL_ENABLED === 'true';

const PLAYER = [
  '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
  '[data-hydrated="true"]',
  '[data-resume-decision="resolved"]',
].join('');
const ROOT = 'main.lesson-shell2';
const PLANE = '.lesson-shell2__legacy-stage';
const INNER = '.lesson-shell2__stage';

// Authored facts, mirrored from the descriptor.
const STAGE = {width: 800, height: 600};
const HEADER = 109;
const FOOTER = 76;
const BAND = STAGE.height - HEADER - FOOTER; // 415
const BAND_ASPECT = STAGE.width / BAND;      // 1.9277…

const BREAKPOINTS = [
  {width: 1920, height: 1080},
  {width: 1600, height: 1000},
  {width: 1440, height: 900},
  {width: 1366, height: 768},
  {width: 1280, height: 800},
];

async function openLesson(page: Page) {
  // Progress is stored per device, so a worker that finished the lesson in an
  // earlier test would otherwise reopen straight onto the finished screen.
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const response = await page.goto('/courses/4/3', {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);
  await expect(page.locator(PLAYER)).toBeVisible();
  await expect(page.locator(ROOT)).not.toHaveAttribute(
    'data-stage-render-mode',
    'measuring',
  );
  await page.waitForLoadState('networkidle');
}

test.describe('widescreen presentation geometry', () => {
  test.skip(!MODERN_WIDE, 'MODERN_WIDE_SHELL_ENABLED is not true');

  test('the lesson renders the widescreen presentation', async ({page}) => {
    await openLesson(page);
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-host-presentation',
      'modern-wide',
    );
  });

  test('the authored band keeps its aspect and grows with the display', async ({page}) => {
    await openLesson(page);
    const measurements: {viewport: string; plane: string; ratio: number; share: number}[] = [];

    for (const viewport of BREAKPOINTS) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(120);

      const plane = await page.locator(PLANE).boundingBox();
      expect(plane, `${viewport.width}: plane must be laid out`).not.toBeNull();
      const {width, height} = plane!;

      const ratio = width / height;
      expect(
        Math.abs(ratio - BAND_ASPECT),
        `${viewport.width}: aspect ${ratio} should be ${BAND_ASPECT}`,
      ).toBeLessThan(0.01);

      // Every breakpoint must beat the legacy 800 x 415 teaching plane.
      expect(width, `${viewport.width}: plane should exceed the authored width`)
        .toBeGreaterThan(STAGE.width);

      // No horizontal overflow at any width.
      const overflows = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflows, `${viewport.width}: page must not scroll sideways`).toBe(false);

      measurements.push({
        viewport: `${viewport.width}x${viewport.height}`,
        plane: `${Math.round(width)}x${Math.round(height)}`,
        ratio: Number(ratio.toFixed(3)),
        share: Number(((width * height) / (viewport.width * viewport.height) * 100).toFixed(1)),
      });
    }

    // The measurement record is the point of this spec, not a side effect.
    test.info().annotations.push({
      type: 'plane-geometry',
      description: JSON.stringify(measurements),
    });

    const areas = measurements.map((m) => {
      const [w, h] = m.plane.split('x').map(Number);
      return w! * h!;
    });
    expect(areas[0], 'the widest display must give the largest plane')
      .toBeGreaterThan(areas.at(-1)!);
  });

  test('the chrome rows are cropped exactly, not merely hidden', async ({page}) => {
    await openLesson(page);
    await page.setViewportSize({width: 1920, height: 1080});
    await page.waitForTimeout(120);

    const plane = (await page.locator(PLANE).boundingBox())!;
    const inner = (await page.locator(INNER).first().boundingBox())!;

    // The authored plane is taller than the window onto it, by exactly the two
    // chrome bands, and is pushed up by exactly the header.
    const scale = plane.width / STAGE.width;
    expect(Math.abs(inner.height - STAGE.height * scale)).toBeLessThan(2);
    expect(Math.abs((plane.y - inner.y) - HEADER * scale)).toBeLessThan(2);
    expect(Math.abs((inner.y + inner.height) - (plane.y + plane.height) - FOOTER * scale))
      .toBeLessThan(2);
  });

  test('no source chrome or hit area is rendered', async ({page}) => {
    await openLesson(page);
    for (const selector of [
      '.lesson-shell2__source-chrome',
      '.lesson-shell2__chrome-lesson-title',
      '.lesson-shell2__legacy-header-hits',
      '.lesson-shell2__legacy-tools',
      '.lesson-shell2__media-hits',
    ]) {
      await expect(page.locator(selector), selector).toHaveCount(0);
    }
  });

  test('exactly one Next and one Previous are reachable', async ({page}) => {
    await openLesson(page);
    await page.setViewportSize({width: 1920, height: 1080});
    await page.waitForTimeout(120);

    const reachable = await page.evaluate(() => {
      const visible = (element: Element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          !element.closest('[inert],[aria-hidden="true"]') &&
          (element as HTMLElement).getClientRects().length > 0;
      };
      const controls = [...document.querySelectorAll('button, [role="button"]')]
        .filter(visible)
        .map((element) => (element.textContent ?? '').trim().toLowerCase());
      return {
        next: controls.filter((label) => label.includes('next')).length,
        previous: controls.filter((label) => label.includes('previous')).length,
      };
    });

    expect(reachable.next, 'Next must exist once').toBe(1);
    expect(reachable.previous, 'Previous must exist once').toBe(1);
  });

  test('engineering instruments stay out of the learner surface', async ({page}) => {
    await openLesson(page);
    await expect(page.locator(ROOT)).toHaveAttribute('data-reviewer-mode', 'false');
    await expect(page.locator('.lesson-shell2__transport-boundary')).toHaveCount(0);
    await expect(page.locator('.lesson-shell2__modern-timeline')).toHaveCount(0);
    // Narrow deliberately: the page legitimately carries an accessibility
    // boundary sentence mentioning keyboard parity. What must be absent is the
    // transport-parity instrument notice.
    await expect(
      page.getByText('Flash transport parity', {exact: false}),
    ).toHaveCount(0);
    await expect(page.getByText('frames', {exact: false})).toHaveCount(0);
  });
});
