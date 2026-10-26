import {expect, test} from '@playwright/test';

const path = '/en/migration-status/g678-calibration/shared-nms002-l02-p052';

// The route is deliberately local-only and needs the exact source-root and
// candidate flags. Ordinary site E2E runs must not treat it as a public route.
test('P052 host handles wrong/correct answers, Replay, Spanish, and narrow layouts', async ({page}) => {
  test.skip(
    process.env.HELP_MATH_G678_P052_AUDIO_CANDIDATE !== '1',
    'P052 private candidate is not enabled for this browser run',
  );
  test.setTimeout(90_000);
  // The site-wide suite defaults to reduced motion, which intentionally
  // leaves this source-timeline Replay paused at frame one. Exercise the
  // ordinary playback path here; reduced-motion is a separate contract.
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const response = await page.goto(path, {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);

  const player = page.locator('[data-p052-lesson-host]');
  await expect(player).toBeVisible();
  const slider = page.getByRole('slider', {name: 'Percentage shaded'});
  await expect(slider).toBeVisible({timeout: 30_000});
  await slider.fill('100');
  await page.getByRole('button', {name: 'Done'}).click();
  await expect(page.getByRole('dialog')).toContainText('Try Again.');
  await page.getByRole('dialog').getByRole('button', {name: 'Close'}).click();

  await slider.fill('75');
  await expect(page.getByRole('status', {name: /75% shaded/u})).toBeVisible();
  await page.getByRole('button', {name: 'Done'}).click();
  await expect(page.getByRole('dialog')).toContainText('75 of the 100 squares');
  await page.getByRole('dialog').getByRole('button', {name: 'Close'}).click();

  await page.getByRole('button', {name: 'Replay'}).click();
  await expect(slider).toHaveValue('0', {timeout: 30_000});
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('link', {name: 'Switch lesson language to Spanish'}).click();
  await expect(page).toHaveURL(/\/es\/migration-status\/g678-calibration\/shared-nms002-l02-p052/u);
  const spanishSlider = page.getByRole('slider', {name: 'Porcentaje coloreado'});
  await expect(spanishSlider).toBeVisible({timeout: 30_000});
  await expect(page.getByText('Mueve el control deslizante para colorear el 75% de la figura.')).toBeVisible();

  for (const width of [390, 320]) {
    await page.setViewportSize({width, height: 844});
    await expect(spanishSlider).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(width);
  }
});

test('P052 reduced-motion Replay keeps the host and runtime paused together', async ({page}) => {
  test.skip(
    process.env.HELP_MATH_G678_P052_AUDIO_CANDIDATE !== '1',
    'P052 private candidate is not enabled for this browser run',
  );
  test.setTimeout(60_000);
  await page.emulateMedia({reducedMotion: 'reduce'});
  const response = await page.goto(path, {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-p052-player-phase="intro"]')).toBeVisible({timeout: 30_000});

  await page.getByRole('button', {name: 'Replay'}).click();
  const frame = page.getByRole('slider', {name: 'Inspect frame'});
  await expect(frame).toHaveValue('1');
  await expect(page.getByRole('button', {name: 'Play animation'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Narration: Play the audio'})).toBeVisible();
  await page.waitForTimeout(1_200);
  await expect(frame).toHaveValue('1');

  await page.getByRole('button', {name: 'Play animation'}).click();
  await expect(page.getByRole('button', {name: 'Pause animation'})).toBeVisible();
  await expect.poll(async () => Number(await frame.inputValue())).toBeGreaterThan(1);
});
