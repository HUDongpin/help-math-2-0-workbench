import {createHash} from 'node:crypto';

import {expect, test} from '@playwright/test';

const LOGO_PATH = '/brand/help-math-2-logo.svg';
const LOGO_SHA256 = '13339d555d2ab64e986c20af68b7c08f01abc6dece75307eff80cf6c81c9dd70';

test('header uses the approved rich-blue HELP Math 2.0 logo and preserves the footer brand', async ({
  page,
  request,
}) => {
  const response = await request.get(LOGO_PATH);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(LOGO_SHA256);

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  const homeResponse = await page.goto('/', {waitUntil: 'networkidle'});
  expect(homeResponse?.status()).toBe(200);

  const headerBrand = page.locator('.site-header .brand');
  await expect(headerBrand).toBeVisible();
  await expect(headerBrand).toHaveAccessibleName('HELP Math home');
  await expect(headerBrand).toHaveAttribute('href', '/');
  await expect(headerBrand.locator('.brand__mark, .brand__name')).toHaveCount(0);

  const headerLogo = headerBrand.locator('img.brand__logo');
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute('src', LOGO_PATH);
  await expect
    .poll(() =>
      headerLogo.evaluate(
        (image: HTMLImageElement) =>
          image.complete &&
          image.naturalWidth === 512 &&
          image.naturalHeight === 512 &&
          image.getBoundingClientRect().width === 64 &&
          image.getBoundingClientRect().height === 64,
      ),
    )
    .toBe(true);

  await expect(page.locator('.site-footer .brand__logo')).toHaveCount(0);
  await expect(page.locator('.site-footer .brand__mark')).toHaveCount(1);
  await expect(page.locator('.site-footer .brand__name')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

for (const {path, homeName, width} of [
  {path: '/', homeName: 'HELP Math home', width: 390},
  {path: '/es', homeName: 'Página principal de HELP Math', width: 320},
] as const) {
  test(`logo remains usable without horizontal overflow at ${width}px on ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({width, height: 844});
    const response = await page.goto(path, {waitUntil: 'networkidle'});
    expect(response?.status()).toBe(200);

    const headerBrand = page.locator('.site-header .brand');
    await expect(headerBrand).toHaveAccessibleName(homeName);
    await expect(headerBrand.locator('.brand__logo')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );

    const logoBox = await headerBrand.locator('.brand__logo').boundingBox();
    const menuBox = await page.locator('details.mobile-nav > summary').boundingBox();
    expect(logoBox?.width).toBe(64);
    expect(logoBox?.height).toBe(64);
    expect(logoBox && menuBox ? logoBox.x + logoBox.width <= menuBox.x : false).toBe(true);
  });
}
