import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page, type Request} from '@playwright/test';

import {
  isPublicLessonProductionRouteAuthorized,
  isPublicRouteProductionAuthorized,
  publicLessonCatalog,
  publicRouteCatalogRows,
} from '../lib/public-launch-manifest.server';

type RuntimeIssue = Readonly<{
  kind: 'console' | 'external-request' | 'http' | 'page' | 'request';
  detail: string;
}>;

function monitorRuntime(page: Page): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/_vercel/insights/')) {
      issues.push({kind: 'external-request', detail: `${request.method()} ${request.url()}`});
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push({kind: 'console', detail: message.text()});
    }
  });
  page.on('pageerror', (error) => {
    issues.push({kind: 'page', detail: error.message});
  });
  page.on('requestfailed', (request) => {
    if (isExpectedNextFlightCancellation(request)) return;
    issues.push({
      kind: 'request',
      detail: `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      issues.push({kind: 'http', detail: `${response.status()} ${response.url()}`});
    }
  });
  return issues;
}

function isExpectedNextFlightCancellation(request: Request): boolean {
  const failure = request.failure()?.errorText;
  if (request.method() !== 'GET' || failure !== 'net::ERR_ABORTED') return false;
  const url = new URL(request.url());
  return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    && url.searchParams.has('_rsc');
}

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

async function expectCleanDocument(
  page: Page,
  path: string,
  language: 'en' | 'es',
): Promise<void> {
  const issues = monitorRuntime(page);
  const response = await page.goto(path, {waitUntil: 'networkidle'});
  expect(response?.status(), path).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('main#main-content')).toBeVisible();
  expect(issues, `${path}: ${JSON.stringify(issues, null, 2)}`).toEqual([]);
}

test('public documents follow the exact manifest route authorization', async ({page, request}) => {
  for (const route of publicRouteCatalogRows()) {
    for (const [language, path] of [
      ['en', route.paths.en],
      ['es', route.paths.es],
    ] as const) {
      if (path === null) continue;
      const productionAuthorized = isPublicRouteProductionAuthorized(
        route.paths.en,
      );
      const response = await request.get(path);
      expect(response.status(), `${route.routeId}:${language}`).toBe(
        productionAuthorized ? 200 : 404,
      );
      if (!productionAuthorized) {
        expect(response.headers()['x-robots-tag'], path).toContain('noindex');
      } else if (route.kind === 'localized-page') {
        await expectCleanDocument(page, path, language);
      }
    }
  }

  const legacyAllLessonsQuery = await request.get('/?screen=lessons');
  const legacyAllLessonsAuthorized =
    isPublicRouteProductionAuthorized('/')
    && isPublicRouteProductionAuthorized('/lessons');
  expect(legacyAllLessonsQuery.status()).toBe(
    legacyAllLessonsAuthorized ? 200 : 404,
  );
  if (!legacyAllLessonsAuthorized) {
    expect(legacyAllLessonsQuery.headers()['x-robots-tag']).toContain(
      'noindex',
    );
  }
});

test('all 29 Lesson routes follow exact Preview-or-Released public authority', async ({
  request,
}) => {
  const catalog = publicLessonCatalog();
  expect(catalog).toHaveLength(29);
  expect(catalog.reduce((total, lesson) =>
    total + lesson.pageOccurrenceCount, 0)).toBe(1_751);
  for (const lesson of catalog) {
    const productionAuthorized = isPublicLessonProductionRouteAuthorized(
      lesson.grade,
      lesson.lesson,
    );
    for (const href of [lesson.routes.en, lesson.routes.es]) {
      const response = await request.get(`${href}?mode=focus`);
      expect(response.status(), href).toBe(productionAuthorized ? 200 : 404);
      if (!productionAuthorized) {
        expect(response.headers()['x-robots-tag'], href).toContain('noindex');
      }
    }
  }
});

test('disabled public capabilities fail closed before provider work', async ({request}) => {
  for (const {method, path} of [
    {method: 'GET', path: '/account'},
    {method: 'GET', path: '/sign-in'},
    {method: 'GET', path: '/sign-up'},
    {method: 'GET', path: '/teacher'},
    {method: 'GET', path: '/family'},
    {method: 'GET', path: '/api/auth/session'},
    {method: 'POST', path: '/api/contact'},
    {method: 'POST', path: '/api/learning-events'},
    {method: 'POST', path: '/api/nova'},
  ] as const) {
    const response = method === 'POST'
      ? await request.post(path, {data: {}})
      : await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()['x-robots-tag'], path).toContain('noindex');
  }
});

test('private-looking deployment paths are absent', async ({request}) => {
  for (const path of [
    '/migration-status?view=designer',
    '/migration-status/g4-l9-product-bridge',
    '/library',
    '/en/library',
    '/demos',
    '/en/demos',
    '/demos/conversion-1-2',
    '/es/demos/conversion-1-2',
    '/animations/not-public',
    '/en/animations/not-public',
    '/reference/not-public',
    '/en/reference/not-public',
    '/generated/g4-grade-wide-keyterms-en.json',
    '/generated/g4-grade-wide-keyterms-es.json',
    '/generated/g5-l4-elementary-keyterms-reference-en.json',
    '/generated/g5-l4-elementary-keyterms-reference-es.json',
    '/generated/not-declared.json',
    '/api/reference/not-public',
    '/api/ruffle/ruffle.js',
    '/source-assets/private-source.swf',
    '/candidate-assets/private-candidate.js',
    '/flash-assets/private-source.swf',
    '/pkcs11.txt',
    '/.env.production',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()['x-robots-tag'], path).toContain('noindex');
  }
});

test('every authorized public document has zero serious or critical axe violations', async ({page}) => {
  const documentPaths = publicRouteCatalogRows().flatMap((route) =>
    isPublicRouteProductionAuthorized(route.paths.en)
      && route.kind === 'localized-page'
      ? [route.paths.en, ...(route.paths.es === null ? [] : [route.paths.es])]
      : []
  );
  for (const path of documentPaths) {
    await expectCleanDocument(page, path, path.startsWith('/es') ? 'es' : 'en');
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(
      blocking,
      `${path}: ${blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`,
    ).toEqual([]);
  }
});

test('robots and sitemap reflect exact production Lesson authorization', async ({request}) => {
  const routeContracts = new Map(publicRouteCatalogRows().map((route) =>
    [route.routeId, route] as const));
  const robots = await request.get('/robots.txt');
  const robotsPath = routeContracts.get('robots')?.paths.en ?? '/robots.txt';
  const robotsAuthorized = isPublicRouteProductionAuthorized(robotsPath);
  expect(robots.status()).toBe(robotsAuthorized ? 200 : 404);
  if (!robotsAuthorized) {
    expect(robots.headers()['x-robots-tag']).toContain('noindex');
  }
  const robotsText = await robots.text();
  if (robotsAuthorized) expect(robotsText).toContain('Disallow: /api/');

  const sitemap = await request.get('/sitemap.xml');
  const sitemapPath = routeContracts.get('sitemap')?.paths.en ?? '/sitemap.xml';
  const sitemapAuthorized = isPublicRouteProductionAuthorized(sitemapPath);
  expect(sitemap.status()).toBe(sitemapAuthorized ? 200 : 404);
  if (!sitemapAuthorized) {
    expect(sitemap.headers()['x-robots-tag']).toContain('noindex');
  }
  const sitemapText = await sitemap.text();
  for (const lesson of publicLessonCatalog()) {
    const authorized = isPublicLessonProductionRouteAuthorized(
      lesson.grade,
      lesson.lesson,
    );
    for (const route of [lesson.routes.en, lesson.routes.es]) {
      if (sitemapAuthorized) {
        const location = `<loc>https://www.helpmath.ai${route}</loc>`;
        if (authorized) expect(sitemapText, route).toContain(location);
        else expect(sitemapText, route).not.toContain(location);
      }
      if (robotsAuthorized && !authorized) {
        expect(robotsText, route).toContain(`Disallow: ${route}`);
      }
    }
  }
});
