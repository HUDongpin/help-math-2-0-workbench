import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';

import {
  G4_L3_WHOLE_LESSON_STORAGE_KEY,
} from '../lib/g4-l3-whole-lesson';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';

type RuntimeIssue = {kind: 'console' | 'page'; message: string};

test.beforeEach(async ({page}) => {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (!local) {
      await route.abort('blockedbyclient');
      return;
    }
    if (url.pathname === '/api/learning-events') {
      await route.fulfill({status: 204});
      return;
    }
    if (
      url.pathname === '/__nextjs_original-stack-frames'
      && !['GET', 'HEAD'].includes(request.method())
    ) {
      await route.fulfill({status: 204});
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method())) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
});

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
      // External provider requests are intentionally blocked by this suite.
      // Chromium reports each deliberate interception as an Inspector error;
      // it is not an application exception or an allowed network call.
      if (message.text() === 'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector') {
        return;
      }
      // @clerk/nextjs 7.7.5 passes three unkeyed internal children to its
      // experimental checkout context in development. Keep the exception
      // exact so application console errors still fail this suite.
      if (
        message.text().includes('Each child in a list should have a unique "key" prop.')
        && message.text().includes('__experimental_CheckoutProvider')
      ) return;
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

async function expectNoBlockingAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blocking,
    `${label}:\n${blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`,
  ).toEqual([]);
}

async function expectDocument(page: Page, path: string, language: 'en' | 'es') {
  const response = await page.goto(path, {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('main#main-content')).toBeVisible();
}

test('server HTML includes the render-blocking theme bootstrap and Organization schema', async ({
  request,
}) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain('data-help-math-theme-bootstrap="true"');
  expect(html).toContain('blocking="render"');
  expect(html).toContain('src="/learning-theme-bootstrap.js"');
  expect(html).toContain('type="application/ld+json"');
  expect(html).toContain('"@type":"EducationalOrganization"');
});

test('English home exposes the learning platform and the Grade 4 Lesson 3 entry', async ({
  page,
}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/', 'en');

  const workspace = page.locator('[data-learning-platform-home]');
  const navigation = page.getByRole('navigation', {name: 'Learning workspace'});

  await expect(workspace).toBeVisible();
  await expect(page.getByRole('heading', {level: 1, name: 'Hi Maria! Ready to keep going?'})).toBeVisible();
  await expect(page.getByText('Sample learner state', {exact: true})).toHaveCount(0);
  await expect(page.getByText(/4 days in a row/)).toBeVisible();
  await expect(page.getByText(/5 stickers/)).toBeVisible();
  await expect(page.getByText('21 / 39', {exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {level: 2, name: 'Negative Numbers'})).toBeVisible();
  await expect(page.getByText('CURRENT-JS SHOWCASE', {exact: true})).toHaveCount(0);
  await expect(page.getByText('LEARNING + SAMPLE STATE', {exact: true})).toHaveCount(0);
  await expect(page.getByText('SAMPLE TEACHER DATA', {exact: true})).toHaveCount(0);
  await expect(page.getByText(/Changes learner\/teacher previews and their links/)).toHaveCount(0);
  await expect(navigation.getByRole('link', {name: 'My lesson', exact: true})).toHaveAttribute('href', '/courses/4/3?mode=focus');
  await expect(navigation.getByRole('button', {name: 'Practice', exact: true})).toBeVisible();
  await expect(navigation.getByRole('button', {name: /My words/})).toBeVisible();
  await expect(navigation.getByRole('button', {name: 'All lessons 73', exact: true})).toBeVisible();
  await expect(navigation.getByRole('button', {name: 'Design notes', exact: true})).toHaveCount(0);
  await expect(navigation.getByRole('link', {name: 'Migration status', exact: true})).toHaveCount(0);
  await expect(page.getByRole('group', {name: 'Learning workspace role'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Student', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: 'Teacher', exact: true})).toBeVisible();
  for (const retiredPath of [
    '/about',
    '/approach',
    '/curriculum',
    '/research',
    '/resources',
    '/support',
    '/demos',
    '/login',
    '/contact',
  ]) {
    await expect(page.locator(`a[href="${retiredPath}"]`), retiredPath).toHaveCount(0);
  }
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.site-footer')).toBeHidden();

  expect(await workspace.innerText()).not.toMatch(/\bsample\b|muestra/i);
  expectNoRuntimeIssues(issues);
});

test('Learning Home opens Grade 5 Lesson 4 in the shared HELP Math 2.0 Lesson experience', async ({page}) => {
  await expectDocument(page, '/', 'en');
  await page.getByRole('navigation', {name: 'Learning workspace'})
    .getByRole('button', {name: 'All lessons 73', exact: true})
    .click();

  const lesson = page.getByRole('link', {
    name: /G5 · L4 Number Lines 54 pages · 8 steps Open/,
  });
  await expect(lesson).toHaveAttribute('href', '/courses/5/4?mode=focus');
  await lesson.click();
  await expect(page).toHaveURL(/\/courses\/5\/4\?mode=focus$/u);

  await expect(page.locator('[data-lesson-player="descriptor-driven-whole-lesson-audit"]'))
    .toHaveAttribute('data-hydrated', 'true');
  const root = page.locator('[data-release-id="lesson-g05-l04-number-lines"]');
  await expect(root).toHaveAttribute('data-current-js-pages', '54');
  await expect(root).toHaveAttribute('data-public-release', 'false');
  await expect(page.locator('[data-current-page="1"]')).toBeVisible();

  const platformHeader = page.locator('[data-lesson-platform-header="true"]');
  await expect(platformHeader.locator('img[src*="help-math-2-logo.png"]')).toBeVisible();
  await expect(platformHeader.locator('.lesson-shell2__audience-switch')).toHaveCount(0);
  await expect(platformHeader.getByRole('button', {name: /Switch to (dark|light) theme/})).toBeVisible();
  expect(await platformHeader.innerText()).not.toContain('Number Lines');
});

for (const {height, locale, path, width} of [
  {height: 812, locale: 'en' as const, path: '/', width: 320},
  {height: 600, locale: 'en' as const, path: '/', width: 844},
  {height: 900, locale: 'en' as const, path: '/', width: 1440},
  {height: 812, locale: 'es' as const, path: '/es', width: 320},
  {height: 600, locale: 'es' as const, path: '/es', width: 844},
  {height: 900, locale: 'es' as const, path: '/es', width: 1440},
]) {
  test(`${locale.toUpperCase()} G5 L4 learner card remains usable at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height});
    await expectDocument(page, path, locale);
    const navigation = page.getByRole('navigation', {
      name: locale === 'es' ? 'Espacio de aprendizaje' : 'Learning workspace',
    });
    await navigation.getByRole('button', {
      name: locale === 'es'
        ? /^Todas las lecciones(?: 73)?$/u
        : /^All lessons(?: 73)?$/u,
    }).click();
    const href = locale === 'es'
      ? '/es/courses/5/4?mode=focus'
      : '/courses/5/4?mode=focus';
    const lesson = page.locator(`a[href="${href}"]`);
    await expect(lesson).toBeVisible();
    await expect(lesson).toContainText('54');
    const box = await lesson.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 1);
    const documentGeometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(documentGeometry.scrollWidth).toBeLessThanOrEqual(documentGeometry.clientWidth + 1);
  });
}

test('designer tools are explicit and remain outside the ordinary learning workspace', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/?view=designer', 'en');
  const workspace = page.locator('[data-learning-platform-home]');
  const navigation = page.getByRole('navigation', {name: 'Learning workspace'});

  await expect(workspace).toHaveAttribute('data-designer-tools', 'visible');
  await expect(page.getByRole('group', {name: 'Learning workspace role'})).toBeVisible();
  await expect(navigation.getByRole('button', {name: 'Design notes', exact: true})).toBeVisible();
  await expect(navigation.getByRole('link', {name: 'Migration status', exact: true})).toHaveAttribute('href', '/migration-status?view=designer');
  await navigation.getByRole('button', {name: 'Design notes', exact: true}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Soft, friendly, and still honest'})).toBeVisible();
  await expect(page.getByText('EVIDENCE', {exact: true})).toBeVisible();
  await expect(page.getByText('CURRENT-JS SHOWCASE · NOT A RELEASE VERDICT', {exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: 'Open migration status', exact: true})).toHaveAttribute('href', '/migration-status?view=designer');
  await expect(navigation.getByRole('link', {name: 'ES', exact: true})).toHaveAttribute(
    'href',
    '/es?role=student&screen=notes&view=designer',
  );
  await page.getByRole('button', {name: 'Teacher', exact: true}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Class board'})).toBeVisible();
  await expect(page.getByRole('cell', {name: '0.94'})).toBeVisible();
  await page.getByRole('button', {name: 'Student', exact: true}).click();
  await navigation.getByRole('button', {name: /My words/}).click();
  await expect(page.getByText('Grade 5 · Lesson 4 — Number Lines', {exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Coordinate Grid. No Spanish in the source', exact: true})).toBeVisible();
  expectNoRuntimeIssues(issues);
});

test('ordinary workspace exposes the teacher console without exposing designer tools', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/?role=teacher&screen=class', 'en');
  await expect(page.locator('[data-learning-platform-home]')).toHaveAttribute('data-role-preview', 'teacher');
  await expect(page.getByRole('button', {name: 'Teacher', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-workspace-screen="class"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 1, name: 'Class board'})).toBeVisible();
  const navigation = page.getByRole('navigation', {name: 'Learning workspace'});
  await expect(navigation.getByRole('button', {name: 'Design notes', exact: true})).toHaveCount(0);
  await expect(navigation.getByRole('link', {name: 'Migration status', exact: true})).toHaveCount(0);
  expectNoRuntimeIssues(issues);
});

test('learning workspace uses the supplied HELP Math 2.0 logo and hides the marketing chrome', async ({
  page,
  request,
}) => {
  const issues = monitorRuntimeIssues(page);
  const logoAsset = await request.get('/brand/help-math-2-logo.png');
  expect(logoAsset.status()).toBe(200);
  expect(logoAsset.headers()['content-type']).toContain('image/png');
  expect((await logoAsset.body()).byteLength).toBeGreaterThan(100);

  await expectDocument(page, '/', 'en');

  const workspaceNavigation = page.getByRole('navigation', {name: 'Learning workspace'});
  const workspaceBrand = workspaceNavigation.getByRole('link', {name: 'HELP Math home'});
  await expect(workspaceBrand).toBeVisible();
  await expect(workspaceBrand).toHaveAttribute('href', '/');
  await expect(workspaceBrand.locator('[data-brand-word="help"]')).toHaveCSS('color', 'rgb(20, 33, 61)');
  await expect(workspaceBrand.locator('[data-brand-word="math"]')).toHaveCSS('color', 'rgb(23, 104, 212)');

  await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
  await expect(workspaceBrand.locator('[data-brand-word="help"]')).toHaveCSS('color', 'rgb(245, 243, 252)');
  await expect(workspaceBrand.locator('[data-brand-word="math"]')).toHaveCSS('color', 'rgb(120, 145, 245)');

  const workspaceLogo = workspaceBrand.locator('img');
  await expect(workspaceLogo).toBeVisible();
  await expect(workspaceLogo).toHaveAttribute('src', /help-math-2-logo\.png/);
  await expect
    .poll(() =>
      workspaceLogo.evaluate(
        (image: HTMLImageElement) =>
          image.complete &&
          image.naturalWidth >= 44 &&
          image.naturalWidth === image.naturalHeight,
      ),
    )
    .toBe(true);

  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.site-footer')).toBeHidden();
  await expect(page.locator('.status-strip')).toBeHidden();
  expectNoRuntimeIssues(issues);
});

test('Spanish home localizes content and never duplicates the /es route prefix', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/es', 'es');

  const navigation = page.getByRole('navigation', {name: 'Espacio de aprendizaje'});
  await expect(page.getByRole('heading', {level: 1, name: '¡Hola María! ¿Lista para seguir?'})).toBeVisible();
  await expect(navigation).toBeVisible();
  await expect(page.getByRole('heading', {level: 2, name: 'Negative Numbers'})).toBeVisible();
  await expect(page.getByText('⚠️ inglés · la fuente no tiene español', {exact: true})).toBeVisible();
  await expect(page.getByText('Estado de estudiante de muestra', {exact: true})).toHaveCount(0);
  await expect(navigation.getByRole('link', {name: 'Mi lección', exact: true})).toHaveAttribute('href', '/es/courses/4/3?mode=focus');
  await expect(navigation.getByRole('link', {name: 'EN', exact: true})).toHaveAttribute('href', '/');
  await expect(navigation.getByRole('link', {name: 'ES', exact: true})).toHaveAttribute('href', '/es');

  await navigation.getByRole('button', {name: /Mis palabras/}).click();
  await expect(page.getByText('Las ocho palabras de tu lección actual', {exact: true})).toBeVisible();
  await expect(page.getByText('Grade 5 · Lesson 4 — Number Lines', {exact: true})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Coordinate Grid. Sin español en la fuente', exact: true})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Docente', exact: true})).toBeVisible();

  await navigation.getByRole('button', {name: 'Todas las lecciones 73', exact: true}).click();
  const g5Lesson = page.locator('a[href="/es/courses/5/4?mode=focus"]');
  await expect(g5Lesson).toHaveAttribute('href', '/es/courses/5/4?mode=focus');
  await expect(g5Lesson.getByText('⚠️ inglés · sin título español en la fuente', {exact: true})).toBeVisible();
  expect(await page.locator('[data-learning-platform-home]').innerText()).not.toMatch(/\bsample\b|muestra/i);

  const localHrefs = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href')).filter(Boolean),
  );
  expect(localHrefs.some((href) => href?.includes('/es/es'))).toBe(false);
  for (const href of localHrefs) {
    expect(
      href === '/' || href?.startsWith('/?') || href?.startsWith('/es'),
    ).toBe(true);
  }
  expectNoRuntimeIssues(issues);
});

test('workspace language links preserve learner and teacher role state', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/es?view=designer', 'es');
  const navigation = page.getByRole('navigation', {name: 'Espacio de aprendizaje'});
  await page.getByRole('button', {name: 'Docente', exact: true}).click();
  await navigation.getByRole('button', {name: 'Preparación', exact: true}).click();
  const english = navigation.getByRole('link', {name: 'EN', exact: true});
  await expect(english).toHaveAttribute('href', '/?role=teacher&screen=prep&view=designer');
  await english.click();
  await expect(page).toHaveURL(/\/?role=teacher&screen=prep&view=designer$/);
  await expect(page.getByRole('button', {name: 'Teacher', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', {level: 1, name: 'Grade 4, Lesson 3 — Negative Numbers'})).toBeVisible();

  await expectDocument(page, '/', 'en');
  await page.getByRole('button', {name: 'Practice', exact: true}).click();
  const spanish = page.getByRole('navigation', {name: 'Learning workspace'})
    .getByRole('link', {name: 'ES', exact: true});
  await expect(spanish).toHaveAttribute('href', '/es?role=student&screen=practice');
  await spanish.click();
  await expect(page.getByRole('button', {name: 'Estudiante', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: 'Docente', exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {level: 1, name: '¿Dónde va −6?'})).toBeVisible();
  expectNoRuntimeIssues(issues);
});

test('mobile navigation opens at a phone viewport and reaches Grade 4 Lesson 3', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await page.setViewportSize({width: 390, height: 844});
  await expectDocument(page, '/', 'en');

  const navigation = page.getByRole('navigation', {name: 'Learning workspace'});
  const brand = navigation.getByRole('link', {name: 'HELP Math home'});
  const brandBox = await brand.boundingBox();
  const logoBox = await brand.locator('img').boundingBox();
  expect(brandBox?.height).toBeGreaterThanOrEqual(44);
  expect(logoBox?.width).toBeGreaterThanOrEqual(38);
  expect(logoBox?.height).toBeGreaterThanOrEqual(38);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );

  await expect(navigation.getByRole('link', {name: 'ES', exact: true})).toBeVisible();
  for (const control of [
    page.getByRole('button', {name: 'Switch to dark theme', exact: true}),
  ]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  const lesson = navigation.getByRole('link', {name: 'My lesson', exact: true});
  await expect(lesson).toBeVisible();
  await expect(lesson).toHaveAttribute('href', '/courses/4/3?mode=focus');
  await lesson.click();
  await expect(page).toHaveURL(/\/courses\/4\/3\?mode=focus$/);
  const lessonPlayer = page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]');
  await expect(lessonPlayer).toBeVisible();
  await expect(lessonPlayer).toHaveAttribute('data-current-page', '1');
  await expect(page.locator('main[data-release-id="lesson-g04-l03-negative-numbers"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 1}).first()).toBeVisible();
  expectNoRuntimeIssues(issues);
});

test('workspace tools work without turning preview controls into real records', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  const writeRequests: string[] = [];
  const downloads: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) {
      const url = new URL(request.url());
      if (
        ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
        && url.pathname !== '/api/learning-events'
        && url.pathname !== '/__nextjs_original-stack-frames'
      ) {
        writeRequests.push(`${request.method()} ${request.url()}`);
      }
    }
  });
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  await expectDocument(page, '/?view=designer', 'en');
  const navigation = page.getByRole('navigation', {name: 'Learning workspace'});

  await navigation.getByRole('button', {name: 'Practice', exact: true}).click();
  await expect(page.locator('main#main-content')).toBeFocused();
  await expect(page.getByRole('heading', {level: 1, name: 'Where does −6 go?'})).toBeVisible();
  await page.getByRole('button', {name: 'Check it', exact: true}).click();
  await expect(page.getByText('Zero is the boundary. Negative numbers are to its left.', {exact: true})).toBeVisible();
  await page.locator('#negative-number-practice').fill('-6');
  await page.getByRole('button', {name: 'Check it', exact: true}).click();
  await expect(page.getByText("That's it!", {exact: true})).toBeVisible();

  await navigation.getByRole('button', {name: /My words/}).click();
  const negativeNumbers = page.getByRole('button', {
    name: 'Negative Numbers. Spanish: Números negativos',
    exact: true,
  }).first();
  await expect(negativeNumbers).toHaveAttribute('aria-pressed', 'false');
  await negativeNumbers.click();
  await expect(negativeNumbers).toHaveAttribute('aria-pressed', 'true');

  await navigation.getByRole('button', {name: 'All lessons 73', exact: true}).click();
  await expect(page.getByRole('heading', {level: 1, name: '73 math lessons · grades 3 to 8'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Grade 8', exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: /G4 · L3 Negative Numbers/})).toHaveAttribute('href', '/courses/4/3?mode=focus');
  const g5Lesson = page.getByRole('link', {name: /G5 · L4 Number Lines 54 pages · 8 steps Open/});
  await expect(g5Lesson).toHaveAttribute('href', '/courses/5/4?mode=focus');
  await expect(page.getByText('Coming soon', {exact: true}).first()).toBeVisible();
  await expect(page.locator('a[href*="/courses/5/4"]')).toHaveCount(1);

  await page.getByRole('button', {name: 'Teacher', exact: true}).click();
  await page.getByRole('button', {name: 'Preview IEP export', exact: true}).click();
  await expect(page.getByText('Preview only: no IEP file was created.', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Plan tomorrow', exact: true}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Grade 4, Lesson 3 — Negative Numbers'})).toBeVisible();
  const assignment = page.getByRole('button', {name: 'Assign to Period 2', exact: true});
  await assignment.click();
  await expect(page.getByRole('button', {name: 'Assignment ready', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
  await expect(page.locator('[data-learning-platform-home]')).toHaveAttribute('data-theme', 'dark');
  expect(writeRequests, 'Sample workspace controls must not create network records').toEqual([]);
  expect(downloads, 'Sample workspace controls must not create files').toEqual([]);
  expectNoRuntimeIssues(issues);
});

test('real browser progress is distinct from the preserved 21 of 39 sample score', async ({page}) => {
  const current = G4_L3_LESSON.pages[5]!;
  const visited = G4_L3_LESSON.pages.slice(0, 6).map(({animationId}) => animationId);
  const completed = G4_L3_LESSON.pages.slice(0, 4).map(({animationId}) => animationId);
  await page.addInitScript(({key, value}) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, {
    key: G4_L3_WHOLE_LESSON_STORAGE_KEY,
    value: {
      schemaVersion: 1,
      currentAnimationId: current.animationId,
      language: 'en',
      visitedAnimationIds: visited,
      completedAnimationIds: completed,
      replayCounts: {},
    },
  });

  await expectDocument(page, '/', 'en');
  await expect(page.getByText('21 / 39', {exact: true})).toBeVisible();
  await expect(page.getByText('This browser: page 6, 4 reviewed', {exact: false})).toBeVisible();
  await expect(page.getByRole('link', {name: 'Continue my lesson', exact: true})).toHaveAttribute('href', '/courses/4/3?mode=focus');
});

test('workspace stays within the document viewport at all required responsive sizes', async ({page}) => {
  for (const viewport of [
    {width: 320, height: 568},
    {width: 375, height: 812},
    {width: 414, height: 896},
    {width: 768, height: 1024},
    {width: 844, height: 390},
    {width: 1024, height: 768},
    {width: 1440, height: 900},
  ]) {
    await page.setViewportSize(viewport);
    await expectDocument(page, '/', 'en');
    await expect(page.locator('[data-learning-platform-home]')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `${viewport.width}x${viewport.height} document width`,
    ).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
    for (const control of [
      page.getByRole('button', {name: 'Switch to dark theme', exact: true}),
    ]) {
      const box = await control.boundingBox();
      expect(box?.height, `${viewport.width}x${viewport.height} touch target`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('skip link and in-app screen changes move keyboard focus into learning content', async ({page}) => {
  await page.setViewportSize({width: 320, height: 568});
  await expectDocument(page, '/', 'en');
  const skipLink = page.getByRole('link', {name: 'Skip to main content', exact: true});
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect.poll(async () => (await skipLink.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(0);
  const skipBox = await skipLink.boundingBox();
  expect(skipBox?.y).toBeGreaterThanOrEqual(0);
  expect((skipBox?.y ?? 0) + (skipBox?.height ?? 0)).toBeLessThanOrEqual(568);
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();

  const practice = page.getByRole('navigation', {name: 'Learning workspace'})
    .getByRole('button', {name: 'Practice', exact: true});
  await practice.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
  await expect(page.getByRole('heading', {level: 1, name: 'Where does −6 go?'})).toBeVisible();
});

test('workspace theme remains usable when browser storage is unavailable', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      configurable: true,
      value() {
        throw new DOMException('Storage blocked for test', 'SecurityError');
      },
    });
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value() {
        throw new DOMException('Storage blocked for test', 'SecurityError');
      },
    });
  });
  await expectDocument(page, '/', 'en');
  await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
  await expect(page.locator('[data-learning-platform-home]')).toHaveAttribute('data-theme', 'dark');
  expectNoRuntimeIssues(issues);
});

test('dark designer-only Design notes screen has no serious or critical axe violations', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/?view=designer&screen=notes', 'en');
  await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking).toEqual([]);
  expectNoRuntimeIssues(issues);
});

test('every learner screen and designer-only teacher screen stays axe-clean', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await expectDocument(page, '/', 'en');
  const navigation = page.getByRole('navigation', {name: 'Learning workspace'});

  for (const screen of [
    {label: 'Practice', control: navigation.getByRole('button', {name: 'Practice', exact: true})},
    {label: 'My words', control: navigation.getByRole('button', {name: /My words/})},
    {label: 'All lessons', control: navigation.getByRole('button', {name: /All lessons/})},
  ]) {
    await screen.control.click();
    await expectNoBlockingAxeViolations(page, screen.label);
  }

  await expectDocument(page, '/?view=designer', 'en');
  const designerNavigation = page.getByRole('navigation', {name: 'Learning workspace'});
  await page.getByRole('button', {name: 'Teacher', exact: true}).click();
  await expectNoBlockingAxeViolations(page, 'Class board');
  await designerNavigation.getByRole('button', {name: 'Lesson prep', exact: true}).click();
  await expectNoBlockingAxeViolations(page, 'Lesson prep');
  await page.getByRole('button', {name: 'Switch to dark theme', exact: true}).click();
  await page.getByRole('button', {name: 'Student', exact: true}).click();
  await expectNoBlockingAxeViolations(page, 'Today dark');
  await page.getByRole('button', {name: 'Teacher', exact: true}).click();
  await expectNoBlockingAxeViolations(page, 'Class board dark');
  expectNoRuntimeIssues(issues);
});

test('retired marketing and status surfaces return non-indexable 404 responses', async ({request}) => {
  for (const path of [
    '/about',
    '/approach',
    '/curriculum',
    '/research',
    '/resources',
    '/support',
    '/demos',
    '/login',
    '/contact',
    '/es/contact',
    '/migration-status',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
  }
});

for (const demo of [
  {id: 'conversion-1-2', title: 'Conversion 1.2'},
  {id: 'conversion-1-4', title: 'Conversion 1.4'},
] as const) {
  test(`${demo.title} local diagnostic renders its deterministic JavaScript stage`, async ({page}) => {
    const issues = monitorRuntimeIssues(page);
    await expectDocument(page, `/demos/${demo.id}?frame=1`, 'en');

    await expect(page.getByRole('heading', {level: 1, name: demo.title})).toBeVisible();
    await expect(page.locator('.demo-player .faithful-stage')).toBeVisible();
    await expect(page.locator('object, embed')).toHaveCount(0);
    await expect(page.locator('[src$=".swf"], [data$=".swf"]')).toHaveCount(0);
    expectNoRuntimeIssues(issues);
  });
}

test('development-only diagnostic image assets respond with PNG content', async ({request}) => {
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

test('local audit archive fails closed until strict completion ledger entries exist', async ({page}) => {
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
  for (const path of ['/', '/migration-status?view=designer', '/courses/4/3']) {
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
  if (process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED === 'true') {
    expect(robotsText).not.toContain('Disallow: /courses/5/4');
    expect(robotsText).not.toContain('Disallow: /es/courses/5/4');
  } else {
    expect(robotsText).toContain('Disallow: /courses/5/4');
    expect(robotsText).toContain('Disallow: /es/courses/5/4');
  }

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/</loc>');
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/es</loc>');
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/courses/4/3</loc>');
  expect(sitemapText).toContain('<loc>https://www.helpmath.ai/es/courses/4/3</loc>');
  if (process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED === 'true') {
    expect(sitemapText).toContain('<loc>https://www.helpmath.ai/courses/5/4</loc>');
    expect(sitemapText).toContain('<loc>https://www.helpmath.ai/es/courses/5/4</loc>');
  } else {
    expect(sitemapText).not.toContain('<loc>https://www.helpmath.ai/courses/5/4</loc>');
    expect(sitemapText).not.toContain('<loc>https://www.helpmath.ai/es/courses/5/4</loc>');
  }
  for (const retiredPath of [
    '/about',
    '/approach',
    '/curriculum',
    '/research',
    '/resources',
    '/support',
    '/library',
    '/demos',
    '/login',
    '/contact',
    '/migration-status',
  ]) {
    expect(sitemapText, retiredPath).not.toContain(`<loc>https://www.helpmath.ai${retiredPath}</loc>`);
  }
});

for (const path of [
  '/',
  '/es',
  '/privacy',
  '/terms',
  '/migration-status?view=designer',
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
