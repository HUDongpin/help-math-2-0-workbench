import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page, type Request} from '@playwright/test';

type RuntimeIssue = Readonly<{
  kind: 'console' | 'external-request' | 'http' | 'page' | 'request';
  detail: string;
}>;

const registeredCurrentJsCandidateLessons = Object.freeze([
  '/courses/3/2?mode=focus',
  '/courses/4/3?mode=focus',
  '/courses/4/5?mode=focus',
  '/courses/4/10?mode=focus',
  '/courses/4/11?mode=focus',
  '/courses/5/3?mode=focus',
  '/courses/5/4?mode=focus',
  '/courses/5/5?mode=focus',
]);

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

test('Next production server renders clean EN and ES public documents', async ({page}) => {
  for (const [path, language] of [
    ['/', 'en'],
    ['/es', 'es'],
    ['/privacy', 'en'],
    ['/es/privacy', 'es'],
    ['/terms', 'en'],
    ['/es/terms', 'es'],
  ] as const) {
    await expectCleanDocument(page, path, language);
  }
});

test('Current-JS registration never grants public production admission by itself', async ({
  request,
}) => {
  for (const href of registeredCurrentJsCandidateLessons) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(404);
    expect(response.headers()['x-robots-tag'], href).toContain('noindex');
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
    '/source-assets/private-source.swf',
    '/candidate-assets/private-candidate.js',
    '/flash-assets/private-source.swf',
    '/pkcs11.txt',
    '/.env.production',
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test('current public surfaces have zero serious or critical axe violations', async ({page}) => {
  for (const path of ['/', '/es', '/privacy', '/terms']) {
    const response = await page.goto(path, {waitUntil: 'networkidle'});
    expect(response?.status(), path).toBe(200);
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

test('robots and sitemap keep all unapproved Current-JS candidates undiscoverable', async ({request}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain('Disallow: /api/');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  for (const href of registeredCurrentJsCandidateLessons) {
    const route = href.split('?')[0]!;
    expect(sitemapText, route).not.toContain(
      `<loc>https://www.helpmath.ai${route}</loc>`,
    );
    expect(sitemapText, `/es${route}`).not.toContain(
      `<loc>https://www.helpmath.ai/es${route}</loc>`,
    );
    expect(robotsText, route).toContain(`Disallow: ${route}`);
    expect(robotsText, `/es${route}`).toContain(`Disallow: /es${route}`);
  }
});
