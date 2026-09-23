import {expect, test, type Page, type Request} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const scenario = process.env.NOVA_FULL_STACK_SCENARIO;
if (scenario !== 'provider-down') {
  throw new Error('nova-provider-failure requires the provider-down scenario');
}

const port = Number(process.env.PLAYWRIGHT_PORT);
const receiptPath = path.join(
  tmpdir(),
  'helpmath-nova-full-stack',
  `browser-receipts-${port}.ndjson`,
);

function readReceipts() {
  try {
    return readFileSync(receiptPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return [] as Record<string, unknown>[];
  }
}

async function openFramePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const response = await page.goto('/courses/4/3?mode=focus', {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBe(200);
  await expect(page.locator('main.lesson-shell2')).toHaveAttribute(
    'data-host-presentation',
    'modern-wide',
  );
  await expect(page.locator(
    '[data-lesson-player][data-hydrated="true"]',
  ).first()).toBeVisible();
  await page.locator(
    '.lesson-shell2__spine button[data-section-code="TS"]',
  ).click();
  const visiblePage = page.locator('[data-current-page]:visible').first();
  await expect(visiblePage).toBeVisible();
  let current = Number(await visiblePage.getAttribute('data-current-page'));
  expect(current).toBeLessThanOrEqual(34);
  while (current < 34) {
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    current += 1;
    await expect(page.locator(`[data-current-page="${current}"]:visible`).first())
      .toBeVisible();
  }

  await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
  const panel = page.locator('.lesson-shell2__nova-panel');
  await expect(panel).toBeVisible();
  return panel;
}

async function expectFailedProviderAttempts(requestId: string) {
  await expect.poll(
    () => readReceipts().filter((receipt) =>
      receipt.requestId === requestId
    ).length,
    {timeout: 10_000},
  ).toBe(2);
  const receipts = readReceipts().filter((receipt) =>
    receipt.requestId === requestId
  );
  expect(receipts.map((receipt) => receipt.attempt)).toEqual([1, 2]);
  for (const receipt of receipts) {
    expect(receipt).toMatchObject({
      evidenceKind: 'FULL_STACK_FAKE_UPSTREAM',
      framePresent: true,
      model: 'openai/gpt-5.6-luna',
      requestId,
      status: 503,
    });
  }
}

test('FULL_STACK_FAKE_UPSTREAM retains a frame across failure and an explicit retry', async ({page}) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const apiRequests: Request[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(
    `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
  ));
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/nova'
    ) apiRequests.push(request);
  });

  const panel = await openFramePage(page);
  const attach = panel.getByRole('button', {
    name: 'Attach current lesson frame',
    exact: true,
  });
  await expect(attach).toBeEnabled({timeout: 20_000});
  await attach.click();
  await expect(panel).toHaveAttribute(
    'data-tutor-frame-sharing',
    'attached-for-next-request',
  );
  expect(apiRequests).toHaveLength(0);

  const question = panel.getByRole('textbox', {name: 'Type a question for Nova'});
  await question.fill('Use the attached lesson frame and ask one check question.');
  const firstResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/nova'
  );
  await panel.getByRole('button', {name: 'Send question to Nova'}).click();
  const firstResponse = await firstResponsePromise;
  expect(firstResponse.status()).toBe(502);
  const firstBody = await firstResponse.json() as {
    error: {code: string};
    requestId: string;
  };
  expect(firstBody.error.code).toBe('NOVA_UNAVAILABLE');
  await expectFailedProviderAttempts(firstBody.requestId);
  await expect(panel.locator('.lesson-shell2__nova-notice')).toHaveText(
    'Nova’s service is temporarily unavailable. Please try again.',
  );
  await expect(panel).toHaveAttribute(
    'data-tutor-frame-sharing',
    'attached-for-next-request',
  );
  const remove = panel.getByRole('button', {
    name: 'Remove the lesson frame from the next question',
    exact: true,
  });
  await expect(remove).toBeVisible();

  await question.fill('Retry with the same attached lesson frame.');
  const secondResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/nova'
  );
  await panel.getByRole('button', {name: 'Send question to Nova'}).click();
  const secondResponse = await secondResponsePromise;
  expect(secondResponse.status()).toBe(502);
  const secondBody = await secondResponse.json() as {
    error: {code: string};
    requestId: string;
  };
  expect(secondBody.error.code).toBe('NOVA_UNAVAILABLE');
  expect(secondBody.requestId).not.toBe(firstBody.requestId);
  await expectFailedProviderAttempts(secondBody.requestId);
  expect(apiRequests).toHaveLength(2);
  for (const request of apiRequests) {
    expect(request.postDataJSON()).toMatchObject({
      frame: {
        animationId: 'course-g04-l03-ts-006',
        globalPageOrdinal: 34,
        releaseId: 'lesson-g04-l03-negative-numbers',
      },
    });
  }
  await expect(panel).toHaveAttribute(
    'data-tutor-frame-sharing',
    'attached-for-next-request',
  );

  await remove.click();
  await expect(panel).toHaveAttribute(
    'data-tutor-frame-sharing',
    'current-frame-not-attached',
  );
  expect(apiRequests).toHaveLength(2);
  const expectedHttpError: string =
    'Failed to load resource: the server responded with a status of 502 (Bad Gateway)';
  const expectedHttpErrors = consoleErrors.filter((message) =>
    message === expectedHttpError
  );
  expect(expectedHttpErrors).toHaveLength(2);
  expect(consoleErrors.filter((message) =>
    message !== expectedHttpError
  )).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
