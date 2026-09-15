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

  await page.getByRole('button', {name: 'addend'}).first().click();
  await page.locator('[data-drop-target-id="slot-a"]').click();
  await page.getByRole('button', {name: 'addend'}).click();
  await page.locator('[data-drop-target-id="slot-b"]').click();
  await page.getByRole('button', {name: 'sum'}).click();
  await page.locator('[data-drop-target-id="slot-c"]').click();
  await expect(page.getByRole('status')).toContainText('Correct');
  await expect(page.locator('[data-solved="true"]')).toBeVisible();
  expect(issues, `Unexpected browser errors:\n${issues.join('\n')}`).toEqual([]);
});

test('Grade 3 Lesson 2 Play It exposes selectable answers and shell navigation still works', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await page.goto('/courses/3/2', {waitUntil: 'networkidle'});
  await page.locator('[data-section-code="GS"]').first().click();
  await expect(page.locator('[data-current-animation-id="course-g03-l02-gs-002"]').first()).toBeVisible();
  await page.getByRole('button', {name: '13'}).click();
  await expect(page.getByRole('status')).toContainText('Correct');
  await page.getByRole('button', {name: 'Calculator'}).click();
  await expect(page.getByRole('button', {name: '7'})).toBeVisible();
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
