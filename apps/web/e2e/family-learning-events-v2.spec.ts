import {expect, test} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
});

test('ordinary G4 L3 stays local and an unauthorized assignment launch fails closed', async ({
  page,
}) => {
  const response = await page.goto('/courses/4/3', {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBe(200);

  const player = page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]');
  await expect(player).toHaveAttribute('data-hydrated', 'true');
  await expect(player).toHaveAttribute('data-progress-storage', 'local-device-only');
  await expect(player).toHaveAttribute('data-family-learning-record-sync', 'disabled');
  await page.getByRole('button', {name: 'Open help'}).click();
  await expect(page.getByText(
    /The progress bar is stored in this browser, while pseudonymous events sync to the LRS when available\./u,
  )).toBeVisible();
  await expect(page.getByText(/saved local progress is not uploaded/u)).toHaveCount(0);

  const denied = await page.goto(
    '/courses/4/3?assignment=10000000-0000-4000-8000-000000000503',
    {waitUntil: 'domcontentloaded'},
  );
  expect(denied?.status()).toBe(404);
  await expect(page.locator('[data-family-learning-record-sync="assignment-v2"]'))
    .toHaveCount(0);
});
