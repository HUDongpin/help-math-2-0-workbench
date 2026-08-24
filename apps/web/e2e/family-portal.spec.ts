import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page, type TestInfo} from '@playwright/test';

const PERSONA_COOKIE = 'help_math_family_demo_persona';
const SELECTED_CHILD_COOKIE = 'help_math_family_selected_child';
const MAYA_ID = '10000000-0000-4000-8000-000000000101';
const DIEGO_ID = '10000000-0000-4000-8000-000000000102';

type RuntimeIssue = {kind: 'console' | 'page'; message: string};

test.describe.configure({mode: 'serial', timeout: 120_000});

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
  expect(
    issues,
    `Unexpected browser errors:\n${JSON.stringify(issues, null, 2)}`,
  ).toEqual([]);
}

async function expectNoBlockingAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious'
      || violation.impact === 'critical',
  );
  expect(
    blocking,
    `${label}:\n${blocking.map((item) => `${item.id}: ${item.help}`).join('\n')}`,
  ).toEqual([]);
}

async function expectNoPageOverflow(page: Page, label: string, width: number) {
  await page.setViewportSize({height: 844, width});
  const sizes = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(sizes.scrollWidth, `${label} overflow at ${width}px`)
    .toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function setPersona(page: Page, testInfo: TestInfo, persona: string) {
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== 'string') throw new Error('Playwright baseURL missing');
  await page.context().addCookies([{
    name: PERSONA_COOKIE,
    url: baseURL,
    value: persona,
  }]);
}

test('guardian completes the EN/ES read, message, child, print, and settings slice', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  const response = await page.goto('/family', {waitUntil: 'networkidle'});

  expect(response?.status()).toBe(200);
  // Next's development renderer replaces the configured private/no-store
  // value with its stricter no-cache/must-revalidate header. Production
  // header shape is separately covered by the configuration contract test.
  expect(response?.headers()['cache-control']).toMatch(
    /(?:private.*no-store|no-cache.*must-revalidate)/u,
  );
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.locator('[data-family-portal-demo="synthetic-family-portal"]')).toBeVisible();
  await expect(page.getByText('Synthetic demo', {exact: true}).first()).toBeVisible();
  await expect(page.getByText('Horizon School · Demo', {exact: true}).first()).toBeVisible();
  await expect(page.getByText('Maya R.', {exact: true}).first()).toBeVisible();
  await expect(page.getByRole('heading', {level: 2, name: 'Family math night'})).toBeVisible();
  await expect(page.getByLabel('Viewing learning for').locator('option')).toHaveCount(2);
  await expect(page.getByLabel('Viewing learning for').locator(`option[value="${MAYA_ID}"]`)).toHaveCount(1);
  await expect(page.getByLabel('Viewing learning for').locator(`option[value="${DIEGO_ID}"]`)).toHaveCount(1);
  await expect(page.getByRole('button', {name: 'Student', exact: true})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Teacher', exact: true})).toHaveCount(0);
  await page.getByRole('button', {name: 'Reply privately'}).click();
  await page.getByRole('textbox', {name: 'Plain-text private reply'}).fill(
    'Thank you. We will join the fictional family math night.',
  );
  await page.getByRole('button', {name: 'Cancel private reply'}).click();
  await expect(page.getByRole('textbox', {name: 'Plain-text private reply'})).toHaveCount(0);
  await page.getByRole('button', {name: 'Reply privately'}).click();
  await page.getByRole('textbox', {name: 'Plain-text private reply'}).fill(
    'Thank you. We will join the fictional family math night.',
  );
  await page.getByRole('button', {name: 'Add local private reply'}).click();
  await expect(page.getByText('Private reply preview completed locally. Nothing was saved or sent.')).toBeVisible();
  await expectNoBlockingAxeViolations(page, 'Family overview');

  await page.getByRole('link', {name: 'Learning progress'}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Learning progress'})).toBeVisible();
  const familyMain = page.locator('main#main-content');
  await expect(familyMain.getByText('Not enough evidence', {exact: true}).first()).toBeVisible();
  await expect(familyMain.getByText('skill_projection_v1', {exact: true})).toBeVisible();
  await expect(familyMain.getByText('g4-l3-synthetic-r1', {exact: true})).toBeVisible();
  await expect(page.getByText(/mastery probability|BKT/iu)).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Family progress');

  await page.getByRole('link', {name: 'Assignments', exact: true}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Assignments'})).toBeVisible();
  await expect(familyMain.getByRole('heading', {level: 2, name: 'Compare two visual models'})).toBeVisible();
  await expect(page.getByRole('link', {name: /continue|resume/iu})).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Family assignments');

  await page.getByRole('link', {name: /^Messages/u}).click();
  const firstThread = page.getByRole('article').filter({hasText: 'A strategy to celebrate'});
  await firstThread.getByRole('button', {name: 'Mark as read'}).click();
  await firstThread.getByRole('textbox', {name: 'Synthetic plain-text reply'}).fill(
    'We will ask Maya to explain the first comparison step.',
  );
  await firstThread.getByRole('button', {name: 'Add demo reply'}).click();
  await expect(firstThread.getByText('We will ask Maya to explain the first comparison step.')).toBeVisible();
  await firstThread.getByRole('button', {name: 'Close conversation'}).click();
  await expect(firstThread.getByText('This conversation is permanently read-only.')).toBeVisible();
  await expect(firstThread.getByRole('textbox')).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Family messages');

  await page.getByLabel('Viewing learning for').selectOption(DIEGO_ID);
  await expect(page.getByText('Diego R.', {exact: true}).first()).toBeVisible();
  await expect(page).not.toHaveURL(/(?:\?|&)child=/u);
  await expect(page).not.toHaveURL(new RegExp(DIEGO_ID, 'u'));

  await page.getByRole('link', {name: 'Family settings'}).click();
  const digest = page.getByRole('switch', {name: 'Weekly learning digest'});
  await expect(digest).toHaveAttribute('aria-checked', 'false');
  await digest.click();
  await expect(digest).toHaveAttribute('aria-checked', 'true');
  await page.reload({waitUntil: 'networkidle'});
  await expect(page.getByRole('switch', {name: 'Weekly learning digest'})).toHaveAttribute('aria-checked', 'false');

  await page.emulateMedia({media: 'print'});
  const printSummary = page.locator('[data-family-print-summary]');
  await expect(printSummary).toBeVisible();
  await expect(printSummary).toContainText('Learning summary for Diego R.');
  await expect(printSummary).not.toContainText('Maya R.');
  await expect(printSummary).toContainText('not an official grade');
  await page.emulateMedia({media: 'screen'});

  await page.getByRole('link', {name: 'Español', exact: true}).first().click();
  await expect(page).toHaveURL(/\/es\/family\?view=settings$/u);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', {level: 1, name: 'Configuración familiar'})).toBeVisible();
  await expect(page.getByText('Señales de aprendizaje, no calificaciones oficiales')).toBeVisible();
  await expectNoBlockingAxeViolations(page, 'Family settings ES');

  await page.goto('/es/family', {waitUntil: 'networkidle'});
  await page.getByRole('button', {name: 'Responder en privado'}).click();
  await expect(page.getByRole('textbox', {name: 'Respuesta privada en texto simple'})).toBeVisible();
  await page.getByRole('button', {name: 'Cancelar respuesta privada'}).click();
  await expect(page.getByRole('textbox', {name: 'Respuesta privada en texto simple'})).toHaveCount(0);

  await page.goto('/family?view=settings', {waitUntil: 'networkidle'});
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', {name: 'Relinquish access: Diego R.'}).click();
  await expect(page.getByLabel('Viewing learning for').locator('option')).toHaveCount(1);
  await expect(page.getByLabel('Viewing learning for')).toHaveValue(MAYA_ID);
  await expect(page.getByText('Diego R.', {exact: true})).toHaveCount(0);
  await page.goBack({waitUntil: 'networkidle'});
  await expect(page.locator('#family-child-selector')).toHaveValue(MAYA_ID);
  await expect(page.getByText('Diego R.', {exact: true})).toHaveCount(0);

  expectNoRuntimeIssues(issues);
});

test('family surfaces have no page-level overflow at required viewport widths', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  for (const width of [320, 375, 390, 414, 768, 1024, 1440]) {
    await page.setViewportSize({height: 900, width});
    await page.goto('/family?view=progress', {waitUntil: 'networkidle'});
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth, `Family overflow at ${width}px`).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );

    if (width === 375) {
      const languageTargets = page
        .getByRole('group', {name: 'Portal language'})
        .getByRole('link');
      await expect(languageTargets).toHaveCount(2);
      for (const target of await languageTargets.all()) {
        const size = await target.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return {height: bounds.height, width: bounds.width};
        });
        expect(size.height, 'Portal language target height').toBeGreaterThanOrEqual(44);
        expect(size.width, 'Portal language target width').toBeGreaterThanOrEqual(44);
      }
    }
  }
  expectNoRuntimeIssues(issues);
});

test('teacher role is isolated and can reply, read, and permanently close a thread', async ({page}, testInfo) => {
  await setPersona(page, testInfo, 'guardian-a');
  const denied = await page.goto('/teacher/messages', {waitUntil: 'domcontentloaded'});
  expect(denied?.status()).toBe(403);
  await expect(page.getByText('Comparison strategy')).toHaveCount(0);

  const issues = monitorRuntimeIssues(page);
  await setPersona(page, testInfo, 'teacher-a');
  const allowed = await page.goto('/teacher/messages', {waitUntil: 'networkidle'});
  expect(allowed?.status()).toBe(200);
  await expect(page.locator('[data-family-companion="teacher-messages"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 1, name: 'Family messages'})).toBeVisible();
  await page.getByLabel('Announcement title').fill('Synthetic schedule update');
  await page.getByLabel('Plain-text message').fill(
    'This update remains inside the isolated local demonstration.',
  );
  await page.getByRole('button', {name: 'Add synthetic announcement'}).click();
  await expect(page.getByText('Announcement preview completed locally. Nothing was saved or sent.')).toBeVisible();
  await page.getByRole('button', {name: /A\. Rivera · Demo guardian/u}).click();
  await page.getByRole('button', {name: 'Mark as read'}).click();
  await page.getByRole('textbox', {name: 'Plain-text teacher reply'}).fill(
    'Please keep asking Maya to name the quantities she compares.',
  );
  await page.getByRole('button', {name: 'Add demo reply'}).click();
  await expect(page.getByText('Please keep asking Maya to name the quantities she compares.')).toBeVisible();
  await page.getByRole('button', {name: 'Close conversation'}).click();
  await expect(page.getByText('This conversation is permanently closed and read-only.')).toBeVisible();
  await expect(page.getByRole('textbox', {name: 'Plain-text teacher reply'})).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Teacher family inbox');

  await page.setViewportSize({height: 667, width: 375});
  await page.goto('/es/teacher/messages', {waitUntil: 'networkidle'});
  await expect(page.getByRole('heading', {level: 1, name: 'Mensajes para familias'})).toBeVisible();
  await page.getByLabel('Título del anuncio').fill('Actualización sintética');
  await page.getByLabel('Mensaje en texto simple').fill(
    'Esta actualización permanece únicamente en la demostración local aislada.',
  );
  await page.getByRole('button', {name: 'Agregar anuncio sintético'}).click();
  await expect(page.getByText('Vista previa del anuncio completada localmente. No se guardó ni envió nada.')).toBeVisible();
  const teacherPhoneOverflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(teacherPhoneOverflow.scrollWidth).toBeLessThanOrEqual(teacherPhoneOverflow.clientWidth + 1);

  await page.setViewportSize({height: 480, width: 768});
  const teacherLandscapeOverflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(teacherLandscapeOverflow.scrollWidth).toBeLessThanOrEqual(
    teacherLandscapeOverflow.clientWidth + 1,
  );
  expectNoRuntimeIssues(issues);
});

test('guardian, teacher, and admin use the controlled governance workspaces', async ({page}, testInfo) => {
  const issues = monitorRuntimeIssues(page);
  await setPersona(page, testInfo, 'guardian-a');
  let response = await page.goto('/family/requests?kind=correction', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {level: 1, name: 'Family requests and activity'})).toBeVisible();
  await expect(page.getByLabel('Request type')).toHaveValue('correction');
  await page.getByLabel('Optional details').fill('Please review the fictional display label.');
  await page.getByRole('button', {name: 'Send for review'}).click();
  await expect(page.getByText('Request sent for school review.')).toBeVisible();
  await expectNoBlockingAxeViolations(page, 'Family requests');
  await expectNoPageOverflow(page, 'Family requests', 375);

  await setPersona(page, testInfo, 'teacher-a');
  response = await page.goto('/teacher/family-access', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {level: 1, name: 'Suggest family access'})).toBeVisible();
  await page.getByLabel('Optional note').fill('Family asked how to access the portal.');
  await page.getByRole('button', {name: 'Send suggestion'}).click();
  await expect(page.getByText('Suggestion sent to the school administrator.')).toBeVisible();
  await expectNoBlockingAxeViolations(page, 'Teacher family access suggestion');
  await expectNoPageOverflow(page, 'Teacher family access suggestion', 768);

  await setPersona(page, testInfo, 'school-admin');
  response = await page.goto('/admin/family-operations', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {level: 1, name: 'Controlled family operations'})).toBeVisible();
  await expect(page.getByLabel('Thread ID')).toBeVisible();
  await expect(page.getByText(/Finley made steady progress/iu)).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Admin family operations');
  await expectNoPageOverflow(page, 'Admin family operations', 390);
  expectNoRuntimeIssues(issues);
});

test('school admin rejects real email, manages synthetic invitations, and revokes access immediately', async ({page}, testInfo) => {
  await setPersona(page, testInfo, 'teacher-a');
  const denied = await page.goto('/admin/family-access', {waitUntil: 'domcontentloaded'});
  expect(denied?.status()).toBe(403);
  await expect(page.getByText('guardian.one@example.invalid')).toHaveCount(0);

  const issues = monitorRuntimeIssues(page);
  await setPersona(page, testInfo, 'school-admin');
  const allowed = await page.goto('/admin/family-access', {waitUntil: 'networkidle'});
  expect(allowed?.status()).toBe(200);
  await expect(page.locator('[data-family-companion="admin-family-access"]')).toBeVisible();
  const email = page.getByLabel('Fictional adult email');
  await email.fill('real-family@example.com');
  await page.getByRole('button', {name: 'Create synthetic invitation'}).click();
  await expect(page.getByText('Use a fictional address ending in .invalid.')).toBeVisible();

  await email.fill('new.guardian@helpmath.invalid');
  await page.getByRole('button', {name: 'Create synthetic invitation'}).click();
  const created = page.getByRole('article').filter({hasText: 'new.guardian@helpmath.invalid'});
  await expect(created).toContainText('Pending');
  await created.getByRole('button', {name: 'Revoke access'}).click();
  await expect(created).toContainText('Revoked');

  const accepted = page.getByRole('article').filter({hasText: 'guardian.one@example.invalid'});
  await accepted.getByRole('button', {name: 'Revoke access'}).click();
  await expect(accepted).toContainText('Revoked');
  await expect(accepted.getByRole('button', {name: /restore/iu})).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Admin family access');
  expectNoRuntimeIssues(issues);

  await setPersona(page, testInfo, 'guardian-a');
  await page.context().addCookies([{
    name: SELECTED_CHILD_COOKIE,
    url: testInfo.project.use.baseURL as string,
    value: MAYA_ID,
  }]);
  const revoked = await page.goto('/family', {waitUntil: 'domcontentloaded'});
  expect([200, 404]).toContain(revoked?.status());
  await expect(page.getByText('Maya R.', {exact: true})).toHaveCount(0);
  await page.reload({waitUntil: 'domcontentloaded'});
  await expect(page.getByText('Maya R.', {exact: true})).toHaveCount(0);
});

test('invitation fragment is removed before acceptance and never appears in rendered content', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  const token = 'a'.repeat(43);
  const response = await page.goto(
    `/family/invitations/accept#token=${token}`,
    {waitUntil: 'networkidle'},
  );
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/family\/invitations\/accept$/u);
  expect(page.url()).not.toContain(token);
  expect(await page.content()).not.toContain(token);
  await expect(page.getByRole('heading', {level: 1, name: 'Accept a family invitation safely'})).toBeVisible();
  await expect(page.getByText(/learner detail is revealed/iu)).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', {name: 'Accept synthetic invitation'}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Synthetic invitation accepted'})).toBeVisible();
  await expect(page.getByText(/real student|real learner/iu)).toHaveCount(0);
  await expectNoBlockingAxeViolations(page, 'Invitation acceptance');
  expectNoRuntimeIssues(issues);
});

test('signed-in adult can decline an invitation and the token remains out of the URL', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  const token = 'b'.repeat(43);
  const response = await page.goto(
    `/family/invitations/accept#token=${token}`,
    {waitUntil: 'networkidle'},
  );
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/family\/invitations\/accept$/u);
  await page.getByRole('button', {name: 'Decline demo'}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Synthetic invitation declined'})).toBeVisible();
  await expect(page).toHaveURL(/\/family\/invitations\/accept$/u);
  expect(page.url()).not.toContain(token);
  expect(await page.content()).not.toContain(token);
  await expectNoBlockingAxeViolations(page, 'Invitation decline');
  expectNoRuntimeIssues(issues);
});
