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
