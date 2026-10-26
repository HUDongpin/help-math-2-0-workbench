import {expect, test} from '@playwright/test';

const id = 'shared-alg001-l12-p011';
// The bounded local verification uses the installed Chrome channel, avoiding
// a second large browser download on the source-evidence volume.
test.use({channel: 'chrome', actionTimeout: 10_000});

for (const locale of ['en', 'es'] as const) {
  test(`Origin source controls, host glossary and Replay (${locale})`, async ({page}) => {
    test.skip(process.env.HELP_MATH_G678_ORIGIN_HOST_QA !== '1', 'Local source-bound candidate only');
    test.setTimeout(120_000);
    await page.emulateMedia({reducedMotion: 'reduce'});
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`/${locale}/migration-status/g678-calibration/${id}`);
    expect(response?.status()).toBe(200);
    const host = page.locator(`[data-lesson-player][data-current-animation-id="${id}"]`);
    await expect(host).toHaveAttribute('data-hydrated', 'true');
    await expect(host).toHaveAttribute('data-renderer-availability', 'registered');
    const canvas = host.locator('canvas[data-flash-frame-domain="sprite-33"]');
    await expect(canvas).toHaveAttribute('data-flash-frame', '1', {timeout: 45_000});
    const controls = page.locator('[data-page-interaction-companion-surface="shared-alg001-l12-p011-glossary"]');
    await expect(controls).toHaveCount(0);
    const inspector = page.locator('input[type="range"][max="118"]');
    await expect(inspector).toHaveCount(1);
    // Behavior candidates deliberately disable arbitrary visual seek. Exercise
    // their real transport; exact visibility boundaries have separate tests.
    await expect(inspector).toBeDisabled();
    // The generic runtime honors reduced motion by holding the authored first
    // frame. Switch media preference for the distinct live-playback check.
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await expect(controls.locator('button')).toHaveCount(3);
    await expect(canvas).toHaveAttribute('data-flash-frame', '118', {timeout: 20_000});
    await expect(controls).toHaveAttribute('data-current-js-controls-ready', 'true');
    await expect(controls.locator('button')).toHaveCount(6);
    for (const character of [20, 21, 22, 27, 28, 29]) {
      const trigger = controls.locator(`[data-source-character-id="${character}"]`);
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-source-sha256', /^[a-f0-9]{64}$/);
      await expect(dialog.locator('p').last()).not.toBeEmpty();
      await dialog.getByRole('button', {name: locale === 'en' ? 'Close and continue' : 'Cerrar y continuar'}).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 844});
      await expect(controls).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.getByRole('button', {name: locale === 'en' ? 'Replay' : 'Repetir', exact: true}).click();
    await expect(canvas).toHaveAttribute('data-flash-frame', '1');
    await expect(controls).toHaveCount(0);
    await expect(inspector).toHaveValue('1');
    expect(errors).toEqual([]);
  });
}

test('Origin live host pauses glossary, resumes and cleans up navigation', async ({page}) => {
  test.skip(process.env.HELP_MATH_G678_ORIGIN_HOST_QA !== '1', 'Local source-bound candidate only');
  test.setTimeout(120_000);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto(`/en/migration-status/g678-calibration/${id}`);
  const host = page.locator(`[data-lesson-player][data-current-animation-id="${id}"]`);
  const canvas = host.locator('canvas[data-flash-frame-domain="sprite-33"]');
  const origin = page.locator('[data-page-interaction-companion-surface="shared-alg001-l12-p011-glossary"] [data-source-character-id="20"]');
  await expect(origin).toBeEnabled({timeout: 45_000});
  await origin.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const paused = await canvas.getAttribute('data-flash-frame');
  // Two frame budgets plus scheduling margin: the modal must freeze playback.
  await page.waitForTimeout(350);
  await expect(canvas).toHaveAttribute('data-flash-frame', paused!);
  await dialog.getByRole('button', {name: 'Close and continue'}).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-flash-frame'))).toBeGreaterThan(Number(paused));
  await expect(canvas).toHaveAttribute('data-flash-frame', '118', {timeout: 20_000});
  await origin.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name: 'Close and continue'}).click();
  await page.locator('[data-lesson-nav="action-next"]:visible').click();
  await expect(page.locator('[data-lesson-player][data-current-animation-id="shared-alg001-l12-p012"]')).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await expect(origin).toHaveCount(0);
  await page.locator('[data-lesson-nav="action-previous"]:visible').click();
  await expect(host).toBeVisible();
  await expect(canvas).toHaveAttribute('data-flash-frame', /^(?:[1-9]|1[0-2])$/);
});
