import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';

type RuntimeIssue = {kind: 'console' | 'page'; message: string};

const demoAssets = [
  '/flash-assets/conversion-1-2/gallon-0.png',
  '/flash-assets/conversion-1-2/gallon-32.png',
  '/flash-assets/conversion-1-2/gallon-64.png',
  '/flash-assets/conversion-1-2/gallon-96.png',
  '/flash-assets/conversion-1-2/gallon-128.png',
  '/flash-assets/conversion-1-2/quart-empty-stage.png',
  '/flash-assets/conversion-1-2/quart-full-stage.png',
  '/flash-assets/conversion-1-2/quart-pouring-empty.png',
  '/flash-assets/conversion-1-2/quart-pouring-full.png',
  '/flash-assets/cylinder-base.png',
  '/flash-assets/pitcher-back.png',
  '/flash-assets/pitcher-front.png',
] as const;

function monitorRuntimeIssues(page: Page): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push({kind: 'console', message: message.text()});
    }
  });
  page.on('pageerror', (error) => {
    issues.push({kind: 'page', message: error.message});
  });

  return issues;
}

function expectNoRuntimeIssues(issues: RuntimeIssue[]) {
  expect(issues, `Unexpected browser errors:\n${JSON.stringify(issues, null, 2)}`).toEqual([]);
}

async function expectDocument(page: Page, path: string, language: 'en' | 'es') {
  const response = await page.goto(path, {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('main#main-content')).toBeVisible();
}

test('English home exposes the learning platform and the Grade 4 Lesson 3 entry', async ({
  page,
}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/', 'en');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Math makes more sense when you can see it.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Grade 4 · Lesson 3').first()).toBeVisible();
  await expect(page.getByRole('heading', {level: 2, name: 'Negative Numbers'})).toBeVisible();
  await expect(page.getByText(
    'Fully navigable 39-page current-JavaScript showcase · bilingual interface + Nova',
  )).toBeVisible();

  const navigation = page.getByRole('navigation', {name: 'Main navigation'});
  const links = [
    ['Home', '/'],
    ['My lesson', '/courses/4/3'],
    ['Progress', '/#progress'],
    ['Learning supports', '/#learning-supports'],
  ] as const;
  for (const [name, href] of links) {
    await expect(navigation.getByRole('link', {name, exact: true})).toHaveAttribute('href', href);
  }

  await expect(page.getByRole('link', {name: 'Start your lesson'}).first()).toHaveAttribute(
    'href',
    '/courses/4/3?mode=focus',
  );
  await expect(page.getByRole('link', {name: 'Open study mode'})).toHaveAttribute(
    'href',
    '/courses/4/3?mode=study',
  );

  await expect(page.getByRole('link', {name: 'Language: Español'}).first()).toHaveAttribute(
    'href',
    '/es',
  );
  expectNoRuntimeIssues(issues);
});

test('site header uses the supplied HELP Math 2.0 logo without changing the footer brand', async ({
  page,
  request,
}) => {
  const issues = monitorRuntimeIssues(page);
  const logoAsset = await request.get('/brand/help-math-2-logo.png');
  expect(logoAsset.status()).toBe(200);
  expect(logoAsset.headers()['content-type']).toContain('image/png');
  expect((await logoAsset.body()).byteLength).toBeGreaterThan(100);

  await expectDocument(page, '/', 'en');

  const headerBrand = page.locator('.site-header .brand');
  await expect(headerBrand).toBeVisible();
  await expect(headerBrand).toHaveAccessibleName('HELP Math home');
  await expect(headerBrand).toHaveAttribute('href', '/');

  const headerLogo = headerBrand.locator('img.brand__logo');
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute('src', /help-math-2-logo\.png/);
  await expect(headerBrand.locator('.brand__mark, .brand__name')).toHaveCount(0);
  await expect
    .poll(() =>
      headerLogo.evaluate(
        (image: HTMLImageElement) =>
          image.complete &&
          image.naturalWidth >= 64 &&
          image.naturalWidth === image.naturalHeight,
      ),
    )
    .toBe(true);

  await expect(page.locator('.site-footer .brand__logo')).toHaveCount(0);
  await expect(page.locator('.site-footer .brand__mark')).toHaveCount(1);
  await expect(page.locator('.site-footer .brand__name')).toHaveCount(1);
  expectNoRuntimeIssues(issues);
});

test('Spanish home localizes content and never duplicates the /es route prefix', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/es', 'es');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Las matemáticas se entienden mejor cuando puedes verlas.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('navigation', {name: 'Navegación principal'})).toBeVisible();
  await expect(page.getByRole('heading', {level: 2, name: 'Negative Numbers'})).toBeVisible();
  await expect(page.getByText(
    'Muestra de 39 páginas completamente navegable en JavaScript actual · interfaz bilingüe + Nova',
  )).toBeVisible();
  await expect(page.getByRole('link', {name: 'Comenzar la lección'}).first()).toHaveAttribute(
    'href',
    '/es/courses/4/3?mode=focus',
  );
  await expect(page.locator('.site-header .brand')).toHaveAccessibleName(
    'Página principal de HELP Math',
  );
  await expect(page.locator('.site-header .brand__logo')).toBeVisible();
  await expect(page.getByRole('link', {name: 'Idioma: English'}).first()).toHaveAttribute(
    'href',
    '/',
  );

  const localHrefs = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href')).filter(Boolean),
  );
  expect(localHrefs.some((href) => href?.includes('/es/es'))).toBe(false);
  for (const href of localHrefs) {
    expect(href === '/' || href?.startsWith('/es')).toBe(true);
  }
  expectNoRuntimeIssues(issues);
});

test('mobile navigation opens at a phone viewport and reaches Grade 4 Lesson 3', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await page.setViewportSize({width: 390, height: 844});
  await expectDocument(page, '/', 'en');

  const logoBox = await page.locator('.site-header .brand__logo').boundingBox();
  expect(logoBox?.width).toBe(64);
  expect(logoBox?.height).toBe(64);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );

  await expect(page.locator('.desktop-nav')).toBeHidden();
  const menu = page.locator('details.mobile-nav');
  const trigger = menu.locator(':scope > summary');
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText('Open navigation');
  await trigger.click();
  await expect(menu).toHaveAttribute('open', '');

  const lesson = menu.getByRole('link', {name: 'My lesson', exact: true});
  await expect(lesson).toBeVisible();
  await expect(lesson).toHaveAttribute('href', '/courses/4/3');
  await lesson.click();
  await expect(page).toHaveURL(/\/courses\/4\/3$/);
  const lessonPlayer = page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]');
  await expect(lessonPlayer).toBeVisible();
  await expect(lessonPlayer).toHaveAttribute('data-current-page', '1');
  await expect(page.locator('main[data-release-id="lesson-g04-l03-negative-numbers"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 1}).first()).toBeVisible();
  expectNoRuntimeIssues(issues);
});

test('account access page is a status page and never renders credential fields', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/login', 'en');

  await expect(
    page.getByRole('heading', {level: 1, name: 'The former HELP Math login is not active here'}),
  ).toBeVisible();
  await expect(page.getByText('Protect your old credentials', {exact: true})).toBeVisible();
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('input[name="username"]')).toHaveCount(0);
  expectNoRuntimeIssues(issues);
});

test('contact submission is visibly paused without collecting contact data', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/contact', 'en');

  await expect(page.locator('[data-contact-form="disabled"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 2, name: 'Contact submission is paused'})).toBeVisible();
  await expect(page.getByText(/does not collect or send a name, email address, school, or message/i)).toBeVisible();
  await expect(
    page.getByRole('heading', {level: 2, name: 'Do not enter personal or student information'}),
  ).toBeVisible();
  await expect(page.getByText(/does not accept any message/i)).toBeVisible();
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('main input, main textarea, main select')).toHaveCount(0);
  await expect(page.locator('main iframe[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  await expect(page.locator('main button[type="submit"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  expectNoRuntimeIssues(issues);
});

test('Spanish contact status page is equally fail-closed', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/es/contact', 'es');

  await expect(page.locator('[data-contact-form="disabled"]')).toBeVisible();
  await expect(
    page.getByRole('heading', {level: 2, name: 'El envío de contactos está en pausa'}),
  ).toBeVisible();
  await expect(page.getByText(/no recopila ni envía nombres, correos, escuelas ni mensajes/i)).toBeVisible();
  await expect(page.locator('main form, main input, main textarea, main select')).toHaveCount(0);
  await expect(page.locator('main iframe[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  await expect(page.locator('main button[type="submit"]')).toHaveCount(0);
  expectNoRuntimeIssues(issues);
});

for (const demo of [
  {id: 'conversion-1-2', title: 'Conversion 1.2'},
  {id: 'conversion-1-4', title: 'Conversion 1.4'},
] as const) {
  test(`${demo.title} detail renders its deterministic JavaScript stage`, async ({page}) => {
    const issues = monitorRuntimeIssues(page);
    await expectDocument(page, `/demos/${demo.id}?frame=1`, 'en');

    await expect(page.getByRole('heading', {level: 1, name: demo.title})).toBeVisible();
    await expect(page.locator('.demo-player .faithful-stage')).toBeVisible();
    await expect(page.locator('object, embed')).toHaveCount(0);
    await expect(page.locator('[src$=".swf"], [data$=".swf"]')).toHaveCount(0);
    expectNoRuntimeIssues(issues);
  });
}

test('all public demo image assets respond with PNG content', async ({request}) => {
  for (const asset of demoAssets) {
    const response = await request.get(asset);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()['content-type'], asset).toContain('image/png');
    expect((await response.body()).byteLength, asset).toBeGreaterThan(100);
  }
});

test('unknown routes return a non-indexable 404 response', async ({page}) => {
  const response = await page.goto('/route-that-does-not-exist', {waitUntil: 'networkidle'});

  expect(response?.status()).toBe(404);
  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  await expect(page.locator('body')).toHaveText('Not Found');
});

test('public archive fails closed until strict completion ledger entries exist', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/library', 'en');
  await expect(page.getByRole('heading', {level: 1, name: 'Animation library'})).toBeVisible();
  await expect(page.getByText('0 strict-complete migrations')).toBeVisible();
  await expect(page.locator('.animation-card')).toHaveCount(0);

  await expectDocument(page, '/courses/3/1', 'en');
  await expect(page.getByRole('heading', {level: 2, name: 'This lesson has no strict-complete pages yet.'})).toBeVisible();
  expectNoRuntimeIssues(issues);
});

test('prototype demos honor exact one-indexed frame capture', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/demos/conversion-1-2?frame=42', 'en');
  await expect(page.locator('.faithful-stage-wrap')).toHaveAttribute('data-flash-frame', '42');
  await expectDocument(page, '/demos/conversion-1-4?frame=67', 'en');
  await expect(page.locator('.faithful-stage-wrap')).toHaveAttribute('data-flash-frame', '67');
  expectNoRuntimeIssues(issues);
});

test('ordinary platform surfaces expose only the environment-required CSP', async ({request}) => {
  // This browser suite runs `next dev`, where local forensic routes are
  // intentionally available. The production-only 404 gate is covered by its
  // environment-aware unit tests; this real-browser check verifies that the
  // ordinary platform CSP still follows the environment boundary rather than
  // implying that development behavior is the production policy.
  for (const path of ['/', '/library', '/courses/4/3']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const policy = response.headers()['content-security-policy'];
    expect(policy, path).toContain("object-src 'none'");
    if (process.env.NODE_ENV === 'production') {
      expect(policy, path).not.toContain('wasm-unsafe-eval');
    } else {
      expect(policy, path).toContain('wasm-unsafe-eval');
    }
  }
});

test('robots and sitemap publish crawl policy and both locale variants', async ({request}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  const robotsText = await robots.text();
  expect(robotsText).toContain('User-Agent: *');
  expect(robotsText).toContain('Disallow: /api/');
  expect(robotsText).toContain('Sitemap: https://www.helpmath.ai/sitemap.xml');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/</loc>');
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/es</loc>');
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/courses/4/3</loc>');
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/es/courses/4/3</loc>');
});

for (const path of [
  '/',
  '/es',
  '/login',
  '/contact',
  '/demos',
  '/demos/conversion-1-2?frame=1',
  '/demos/conversion-1-4?frame=1',
] as const) {
  test(`${path} has no serious or critical axe violations`, async ({page}) => {
    const issues = monitorRuntimeIssues(page);
    const response = await page.goto(path, {waitUntil: 'networkidle'});
    expect(response?.status()).toBe(200);

    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(
      blocking,
      blocking
        .map(
          (violation) =>
            `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes
              .map((node) => `  ${node.target.join(' ')}: ${node.failureSummary ?? ''}`)
              .join('\n')}`,
        )
        .join('\n\n'),
    ).toEqual([]);
    expectNoRuntimeIssues(issues);
  });
}
