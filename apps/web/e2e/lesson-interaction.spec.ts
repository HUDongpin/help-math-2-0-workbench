import {expect, test, type Page} from '@playwright/test';

function monitorRuntimeIssues(page: Page) {
  const issues: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(message.text());
  });
  page.on('pageerror', (error) => issues.push(error.message));
  return issues;
}

test('Grade 3 Lesson 2 Try It exposes real key-term drag targets', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  const response = await page.goto('/courses/3/2', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-lesson-player="workbench-catalog-interaction-bridge"]')).toBeVisible();

  await page.locator('[data-section-code="TI"]').first().click();
  await expect(page.locator('[data-current-animation-id="course-g03-l02-ti-002"]').first()).toBeVisible();
  await expect(page.locator('.lesson-shell2__stage [draggable="true"]')).toHaveCount(3);
  await expect(page.locator('.lesson-shell2__stage button, .lesson-shell2__stage [data-drop-target-id]')).not.toHaveCount(0);
  await expect(page.locator('[data-drop-target-id="slot-a"]')).toBeEnabled();

  await page.getByRole('button', {name: 'addend', exact: true}).focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-drop-target-id="slot-a"]').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', {name: 'sum', exact: true}).focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-drop-target-id="slot-b"]').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', {name: 'difference', exact: true}).focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-drop-target-id="slot-c"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Practice recorded');
  await expect(page.locator('[data-solved="true"]')).toBeVisible();
  await expect(page.locator('.page-interaction-stage')).toHaveAttribute('data-answer-key', 'ungraded-practice');
  expect(issues, `Unexpected browser errors:\n${issues.join('\n')}`).toEqual([]);
});

test('Grade 3 Lesson 2 Play It exposes selectable answers and shell navigation still works', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await page.goto('/courses/3/2', {waitUntil: 'networkidle'});
  await page.locator('[data-section-code="GS"]').first().click();
  await expect(page.locator('[data-current-animation-id="course-g03-l02-gs-002"]').first()).toBeVisible();
  await page.getByRole('button', {name: 'addend', exact: true}).click();
  await expect(page.getByRole('status')).toContainText('Practice recorded');
  await page.getByRole('button', {name: 'Calculator'}).click();
  await expect(page.getByRole('button', {name: '7'})).toBeVisible();
  await page.getByRole('button', {name: '5', exact: true}).click();
  await page.getByRole('button', {name: '/', exact: true}).click();
  await page.getByRole('button', {name: '0', exact: true}).click();
  await page.getByRole('button', {name: '=', exact: true}).click();
  await expect(page.locator('.lesson-player__calculator output')).toHaveText('undefined');
  await page.getByRole('button', {name: 'Next →'}).click();
  await expect(page.locator('[data-current-animation-id="course-g03-l02-gs-003"]').first()).toBeVisible();
  expect(issues, `Unexpected browser errors:\n${issues.join('\n')}`).toEqual([]);
});

test('un-cited lessons stay fail-closed until strict-complete pages exist', async ({page}) => {
  const response = await page.goto('/courses/3/1', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {level: 2, name: 'This lesson has no strict-complete pages yet.'})).toBeVisible();
  await expect(page.locator('[data-lesson-player]')).toHaveCount(0);
});

test('cited lessons honor one-indexed frame capture and freeze interaction', async ({page}) => {
  const response = await page.goto('/courses/3/2?frame=5', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('.lesson-shell2__stage')).toHaveAttribute('data-flash-frame', '5');
  await page.locator('[data-section-code="TI"]').first().click();
  await expect(page.locator('[data-current-animation-id="course-g03-l02-ti-002"]').first()).toBeVisible();
  await expect(page.locator('.page-interaction-stage')).toHaveAttribute('data-flash-frame', '5');
  await expect(page.locator('.page-interaction-stage')).toHaveAttribute('data-interactive', 'false');
  await expect(page.locator('[data-drop-target-id="slot-a"]')).toBeDisabled();
  await expect(page.locator('.page-interaction-stage [draggable="true"]')).toHaveCount(0);
});

test('page-only viewing counts toward completion and pause keeps in-progress Try It state', async ({page}) => {
  await page.goto('/courses/3/2', {waitUntil: 'networkidle'});
  await expect(page.locator('.lesson-player__session')).toContainText('1 of 70 pages complete');
  await page.locator('[data-section-code="TI"]').first().click();
  await page.getByRole('button', {name: 'addend', exact: true}).first().click();
  await expect(page.getByRole('button', {name: 'addend', exact: true}).first()).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: 'Pause'}).click();
  await expect(page.getByText('Paused.')).toBeVisible();
  await expect(page.locator('.page-interaction-stage')).toBeVisible();
  await page.getByRole('button', {name: 'Resume'}).click();
  await expect(page.getByRole('button', {name: 'addend', exact: true}).first()).toHaveAttribute('aria-pressed', 'true');
});

test('Spanish cited lessons use Spanish page and lesson titles', async ({page}) => {
  await page.goto('/es/courses/3/2', {waitUntil: 'networkidle'});
  await expect(page.locator('.lesson-player__spine-mark')).toContainText('Adición y sustracción');
  await page.locator('[data-section-code="TI"]').first().click();
  await expect(page.getByRole('heading', {level: 1, name: 'Pregunta 1'})).toBeVisible();
});
