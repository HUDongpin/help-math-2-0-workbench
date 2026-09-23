import {expect, test, type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const scenario = process.env.NOVA_FULL_STACK_SCENARIO;
if (!scenario || scenario === 'all-on') {
  throw new Error('nova-capability-gates requires a named non-all-on scenario');
}
const port = Number(process.env.PLAYWRIGHT_PORT);
const receiptPath = path.join(
  tmpdir(),
  'helpmath-nova-full-stack',
  `browser-receipts-${port}.ndjson`,
);

const firstPages = {
  g4l3: {
    releaseId: 'lesson-g04-l03-negative-numbers',
    grade: 4,
    lesson: 3,
    animationId: 'course-g04-l03-ir-001-341242cc',
    sectionCode: 'IR',
    sectionTitle: 'Introduction',
    globalPageOrdinal: 1,
    activePageCount: 39,
    pageTitle: 'Introduction',
    pageTitleEnglish: 'Introduction',
    pageTitleSpanish: null,
    locale: 'en',
    pageTitleUsesEnglishFallback: false,
    assessment: false,
  },
  g5l4: {
    releaseId: 'lesson-g05-l04-number-lines',
    grade: 5,
    lesson: 4,
    animationId: 'course-g05-l04-ir-001-a662633d',
    sectionCode: 'IR',
    sectionTitle: 'Introduction',
    globalPageOrdinal: 1,
    activePageCount: 54,
    pageTitle: 'Introduction',
    pageTitleEnglish: 'Introduction',
    pageTitleSpanish: null,
    locale: 'en',
    pageTitleUsesEnglishFallback: false,
    assessment: false,
  },
} as const;

function receiptCount() {
  try {
    return readFileSync(receiptPath, 'utf8').split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}

async function postNova(
  page: Page,
  context: (typeof firstPages)[keyof typeof firstPages],
  frame = false,
) {
  return page.evaluate(async ({trustedContext, withFrame}) => {
    const response = await fetch('/api/nova', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        locale: 'en',
        mode: 'focus',
        message: 'Explain one math idea from this page.',
        history: [],
        context: trustedContext,
        ...(withFrame ? {frame: {
          releaseId: trustedContext.releaseId,
          globalPageOrdinal: trustedContext.globalPageOrdinal,
          animationId: trustedContext.animationId,
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          width: 1,
          height: 1,
        }} : {}),
      }),
      cache: 'no-store',
      credentials: 'same-origin',
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return {
      body,
      cacheControl: response.headers.get('cache-control'),
      status: response.status,
    };
  }, {trustedContext: context, withFrame: frame});
}

test(`FULL_STACK_FAKE_UPSTREAM ${scenario} keeps UI and API fail-closed`, async ({page}) => {
  test.setTimeout(90_000);
  const route = scenario === 'course-off' ? '/courses/5/4' : '/courses/4/3';
  const response = await page.goto(route, {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);
  const askNova = page.getByRole('button', {name: 'Ask Nova', exact: true});
  const beforeReceipts = receiptCount();

  if (scenario === 'media-off') {
    await expect(askNova).toBeVisible();
    await askNova.click();
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', {
      name: 'Attach current lesson frame',
    })).toHaveCount(0);
    await expect(panel.locator('.lesson-shell2__nova-mic')).toHaveCount(0);
    await expect(page.locator('main.lesson-shell2'))
      .toHaveAttribute('data-tutor-frame-snapshot', 'unavailable');
    const result = await postNova(page, firstPages.g4l3, true);
    expect(result.status).toBe(409);
    expect(result.cacheControl).toContain('no-store');
    expect(result.body).toMatchObject({
      ok: false,
      error: {code: 'NOVA_FRAME_NOT_AVAILABLE'},
    });
  } else {
    await expect(askNova).toHaveCount(0);
    const expectedStatus = [
      'course-off',
      'modern-off',
      'release-empty',
    ].includes(scenario) ? 409 : 503;
    const result = await postNova(
      page,
      scenario === 'course-off' ? firstPages.g5l4 : firstPages.g4l3,
    );
    expect(result.status).toBe(expectedStatus);
    expect(result.cacheControl).toContain('no-store');
    expect(result.body).toMatchObject({
      ok: false,
      error: {
        code: expectedStatus === 409
          ? 'NOVA_COURSE_NOT_AVAILABLE'
          : 'NOVA_NOT_CONFIGURED',
      },
    });
  }

  expect(receiptCount()).toBe(beforeReceipts);

  await page.goto('/', {waitUntil: 'domcontentloaded'});
  const novaLink = page.getByRole('link', {name: 'Talk to Nova', exact: true});
  if (scenario === 'course-off' || scenario === 'media-off') {
    await expect(novaLink).toBeVisible();
    await expect(novaLink).toHaveAttribute('href', '/courses/4/3?mode=focus');
  } else {
    await expect(novaLink).toHaveCount(0);
  }
});
