import {expect, test, type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3214);
const receiptPath = path.join(
  tmpdir(),
  'helpmath-nova-full-stack',
  `browser-receipts-${port}.ndjson`,
);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type Locale = 'en' | 'es';
type PageKind = 'first-non-assessment' | 'first-assessment' | 'spanish-fallback';

const courses = [
  {
    grade: 4,
    lesson: 3,
    releaseId: 'lesson-g04-l03-negative-numbers',
    pages: {firstAssessment: 24, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 5,
    lesson: 4,
    releaseId: 'lesson-g05-l04-number-lines',
    pages: {firstAssessment: 36, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 3,
    lesson: 2,
    releaseId: 'lesson-g03-l02-addition-subtraction-page-only-current-js',
    pages: {firstAssessment: 50, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 4,
    lesson: 5,
    releaseId: 'lesson-g04-l05-multiplication-page-only',
    pages: {firstAssessment: 37, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 4,
    lesson: 10,
    releaseId: 'lesson-g04-l10-perimeter-area-page-only',
    pages: {firstAssessment: 31, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 4,
    lesson: 11,
    releaseId: 'lesson-g04-l11-coordinate-grid-page-only',
    pages: {firstAssessment: 26, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 5,
    lesson: 3,
    releaseId: 'lesson-g05-l03-exponents-prime-factorizations-page-only',
    pages: {firstAssessment: 47, firstNonAssessment: 1, spanishFallback: 1},
  },
  {
    grade: 5,
    lesson: 5,
    releaseId: 'lesson-g05-l05-add-subtract-negative-numbers',
    pages: {firstAssessment: 37, firstNonAssessment: 1, spanishFallback: 1},
  },
] as const;

const pageKinds: readonly PageKind[] = [
  'first-non-assessment',
  'first-assessment',
  'spanish-fallback',
];

function ordinalFor(
  course: (typeof courses)[number],
  pageKind: PageKind,
) {
  if (pageKind === 'first-assessment') return course.pages.firstAssessment;
  if (pageKind === 'spanish-fallback') return course.pages.spanishFallback;
  return course.pages.firstNonAssessment;
}

function routeFor(locale: Locale, grade: number, lesson: number) {
  return `${locale === 'es' ? '/es' : ''}/courses/${grade}/${lesson}?mode=focus`;
}

function readReceipts() {
  let serialized = '';
  try {
    serialized = readFileSync(receiptPath, 'utf8');
  } catch {
    return [] as Record<string, unknown>[];
  }
  return serialized.split('\n').filter(Boolean).map((line) =>
    JSON.parse(line) as Record<string, unknown>
  );
}

async function receiptFor(requestId: string) {
  await expect.poll(
    () => readReceipts().find((receipt) => receipt.requestId === requestId),
    {timeout: 10_000},
  ).toBeTruthy();
  return readReceipts().find((receipt) => receipt.requestId === requestId)!;
}

let runtimeDiagnostics = {
  consoleErrors: [] as string[],
  pageErrors: [] as string[],
  failedRequests: [] as string[],
};

test.beforeEach(({page}) => {
  runtimeDiagnostics = {consoleErrors: [], pageErrors: [], failedRequests: []};
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeDiagnostics.consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => runtimeDiagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => runtimeDiagnostics.failedRequests.push(
    `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
  ));
});

test.afterEach(() => {
  expect(runtimeDiagnostics.consoleErrors, 'browser console errors').toEqual([]);
  expect(runtimeDiagnostics.pageErrors, 'browser page errors').toEqual([]);
  expect(runtimeDiagnostics.failedRequests, 'failed browser requests').toEqual([]);
});

async function selectPageOrdinal(
  page: Page,
  locale: Locale,
  ordinal: number,
  sectionCode?: string,
) {
  if (ordinal === 1) return;
  expect(sectionCode, `page ${ordinal} requires a trusted section selector`)
    .toBeTruthy();
  await page.locator(
    `.lesson-shell2__spine button[data-section-code="${sectionCode}"]`,
  ).click();
  const visiblePage = page.locator('[data-current-page]:visible').first();
  await expect(visiblePage).toBeVisible();
  const sectionStart = Number(await visiblePage.getAttribute('data-current-page'));
  expect(sectionStart).toBeLessThanOrEqual(ordinal);
  for (let current = sectionStart; current < ordinal; current += 1) {
    await page.getByRole('button', {
      name: locale === 'es' ? 'Página siguiente' : 'Next page',
      exact: true,
    }).click();
    await expect(page.locator(`[data-current-page="${current + 1}"]:visible`).first())
      .toBeVisible();
  }
}

async function openNovaPage(input: Readonly<{
  course: (typeof courses)[number];
  locale: Locale;
  ordinal: number;
  page: Page;
  sectionCode?: string;
}>) {
  await input.page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const response = await input.page.goto(routeFor(
    input.locale,
    input.course.grade,
    input.course.lesson,
  ), {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);
  const shell = input.page.locator('main.lesson-shell2');
  await expect(shell).toHaveAttribute('data-host-presentation', 'modern-wide');
  // The lesson controls are server-rendered before React attaches its event
  // handlers. Wait for the player's explicit hydration contract so a fast
  // browser cannot lose the first section, page, or Nova launcher click.
  await expect(input.page.locator(
    '[data-lesson-player][data-hydrated="true"]',
  ).first()).toBeVisible();
  await selectPageOrdinal(
    input.page,
    input.locale,
    input.ordinal,
    input.sectionCode,
  );
  const launcher = input.page.getByRole('button', {
    name: input.locale === 'es' ? 'Preguntar a Nova' : 'Ask Nova',
    exact: true,
  });
  await expect(launcher).toBeVisible();
  await launcher.click();
  const panel = input.page.locator('.lesson-shell2__nova-panel');
  await expect(panel).toBeVisible();
  return panel;
}

async function sendTextQuestion(input: Readonly<{
  course: (typeof courses)[number];
  locale: Locale;
  ordinal: number;
  page: Page;
  prompt?: string;
  sectionCode?: string;
}>) {
  const panel = await openNovaPage(input);
  const textbox = panel.getByRole('textbox', {
    name: input.locale === 'es'
      ? 'Escribe una pregunta para Nova'
      : 'Type a question for Nova',
  });
  await textbox.fill(input.prompt ??
    'What is the main math idea on this page? Explain it in two short sentences, then ask me one check question.');
  const responsePromise = input.page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/nova'
  );
  await panel.getByRole('button', {
    name: input.locale === 'es'
      ? 'Enviar pregunta a Nova'
      : 'Send question to Nova',
  }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  const payload = await response.json() as {
    model: string;
    ok: boolean;
    requestId: string;
  };
  expect(payload.ok).toBe(true);
  expect(payload.model).toBe('openai/gpt-5.6-luna');
  expect(payload.requestId).toMatch(uuidPattern);
  const request = response.request().postDataJSON() as {
    context: {
      animationId: string;
      globalPageOrdinal: number;
      grade: number;
      lesson: number;
      releaseId: string;
    };
    frame?: unknown;
  };
  expect(request.context).toMatchObject({
    globalPageOrdinal: input.ordinal,
    grade: input.course.grade,
    lesson: input.course.lesson,
    releaseId: input.course.releaseId,
  });
  expect(request.context.animationId).toBeTruthy();
  expect(request.frame).toBeUndefined();
  await expect(panel.locator('[data-nova-message-role="user"]').last())
    .toHaveText(input.locale === 'es' ? /^Tú / : /^You /);
  await expect(panel.locator('[data-nova-message-role="assistant"]'))
    .toContainText('Nova full-stack test reply');
  const receipt = await receiptFor(payload.requestId);
  expect(receipt).toMatchObject({
    evidenceKind: 'FULL_STACK_FAKE_UPSTREAM',
    framePresent: false,
    model: 'openai/gpt-5.6-luna',
    requestId: payload.requestId,
    status: 200,
  });
  return {panel, request, requestId: payload.requestId};
}

test.describe.serial('FULL_STACK_FAKE_UPSTREAM Nova route matrix', () => {
  for (const course of courses) {
    for (const locale of ['en', 'es'] as const) {
      for (const pageKind of pageKinds) {
        const ordinal = ordinalFor(course, pageKind);
        test(`G${course.grade} L${course.lesson} ${locale} ${pageKind} uses the real /api/nova route`, async ({page}) => {
          test.setTimeout(90_000);
          await sendTextQuestion({
            course,
            locale,
            ordinal,
            page,
            prompt: pageKind === 'first-assessment'
              ? 'Help me think about the first step without giving me the answer.'
              : undefined,
            sectionCode: pageKind === 'first-assessment' ? 'TI' : undefined,
          });
        });
      }
    }
  }

  for (const ordinal of [45, 46] as const) {
    test(`G5 L3 duplicate animation placement ${ordinal} remains ordinal-bound`, async ({page}) => {
      test.setTimeout(90_000);
      const result = await sendTextQuestion({
        course: courses[6],
        locale: 'en',
        ordinal,
        page,
        sectionCode: 'IN',
      });
      expect(result.request.context.animationId).toBe('course-g05-l03-in-028');
    });
  }
});

async function installSpeechRecognition(page: Page, transcript: string) {
  await page.addInitScript((value) => {
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      onend: (() => void) | null = null;
      onerror: ((event: {error: string}) => void) | null = null;
      onresult: ((event: {
        resultIndex: number;
        results: Array<Array<{transcript: string}> & {isFinal: boolean}>;
      }) => void) | null = null;

      start() {
        window.setTimeout(() => {
          const result = Object.assign([{transcript: value}], {isFinal: true});
          this.onresult?.({resultIndex: 0, results: [result]});
          window.setTimeout(() => this.onend?.(), 0);
        }, 0);
      }
      stop() {}
      abort() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
  }, transcript);
}

type NovaAnalyticsEvent = Readonly<{
  data?: Readonly<Record<string, unknown>>;
  name?: string;
}>;

async function installNovaAnalyticsCapture(page: Page) {
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __novaAnalyticsEvents?: unknown[];
    };
    target.__novaAnalyticsEvents = [];
    window.va = (event, properties) => {
      if (event === 'event') target.__novaAnalyticsEvents?.push(properties);
    };
  });
}

async function readNovaAnalyticsEvents(page: Page) {
  return page.evaluate(() => {
    const target = window as typeof window & {
      __novaAnalyticsEvents?: NovaAnalyticsEvent[];
    };
    return target.__novaAnalyticsEvents ?? [];
  });
}

function novaSpeechStatuses(events: readonly NovaAnalyticsEvent[]) {
  return events.flatMap((event) =>
    event.name === 'nova_speech_status' && typeof event.data?.status === 'string'
      ? [event.data.status]
      : []
  );
}

test.describe.serial('FULL_STACK_FAKE_UPSTREAM media confirmation', () => {
  test('attaches only the current lesson frame and sends it only after Send', async ({page}) => {
    test.setTimeout(90_000);
    // Page 34 is a canvas-backed G4 L3 page with a stable rendered stage, so
    // this verifies the real capture path rather than a placeholder intro.
    const panel = await openNovaPage({
      course: courses[0],
      locale: 'en',
      ordinal: 34,
      page,
      sectionCode: 'TS',
    });
    await expect(panel.locator('input[type="file"]')).toHaveCount(0);
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/nova') {
        apiRequests.push(request.url());
      }
    });
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
    expect(apiRequests).toEqual([]);

    await panel.getByRole('textbox', {name: 'Type a question for Nova'})
      .fill('Use the attached lesson frame. Describe one visible math feature in one sentence, then ask one check question.');
    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/nova'
    );
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(apiRequests).toHaveLength(1);
    const request = response.request().postDataJSON() as {
      frame: {
        animationId: string;
        globalPageOrdinal: number;
        releaseId: string;
      };
    };
    expect(request.frame).toMatchObject({
      animationId: 'course-g04-l03-ts-006',
      globalPageOrdinal: 34,
      releaseId: 'lesson-g04-l03-negative-numbers',
    });
    const payload = await response.json() as {requestId: string};
    expect(await receiptFor(payload.requestId)).toMatchObject({
      framePresent: true,
      requestId: payload.requestId,
    });
    await expect(panel).not.toHaveAttribute(
      'data-tutor-frame-sharing',
      'attached-for-next-request',
    );
  });

  test('removes and clears a frame across close, reopen, and page navigation', async ({page}) => {
    test.setTimeout(120_000);
    let panel = await openNovaPage({
      course: courses[0],
      locale: 'en',
      ordinal: 34,
      page,
      sectionCode: 'TS',
    });
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/nova') {
        apiRequests.push(request.url());
      }
    });
    const attachCurrentFrame = () => panel.getByRole('button', {
      name: 'Attach current lesson frame',
      exact: true,
    });

    await expect(attachCurrentFrame()).toBeEnabled({timeout: 20_000});
    await attachCurrentFrame().click();
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'attached-for-next-request',
    );
    await panel.getByRole('button', {
      name: 'Remove the lesson frame from the next question',
      exact: true,
    }).click();
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'current-frame-not-attached',
    );
    expect(apiRequests, 'Remove must remain local').toEqual([]);

    await attachCurrentFrame().click();
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'attached-for-next-request',
    );
    await panel.getByRole('button', {name: 'Close Nova', exact: true}).click();
    await expect(panel).toBeHidden();
    expect(apiRequests, 'Close must not send an attached frame').toEqual([]);

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'current-frame-not-attached',
    );
    await expect(panel.getByRole('button', {
      name: 'Remove the lesson frame from the next question',
      exact: true,
    })).toHaveCount(0);

    await panel.getByRole('button', {name: 'Close Nova', exact: true}).click();
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await expect(page.locator('[data-current-page="35"]:visible').first())
      .toBeVisible();
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'current-frame-not-attached',
    );
    await expect(attachCurrentFrame()).toBeEnabled({timeout: 20_000});
    await attachCurrentFrame().click();
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'attached-for-next-request',
    );

    await panel.getByRole('textbox', {name: 'Type a question for Nova'})
      .fill('Use the newly attached current lesson frame and ask one check question.');
    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/nova'
    );
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(apiRequests).toHaveLength(1);
    const request = response.request().postDataJSON() as {
      frame: {
        animationId: string;
        globalPageOrdinal: number;
        releaseId: string;
      };
    };
    expect(request.frame).toMatchObject({
      animationId: 'course-g04-l03-ts-007',
      globalPageOrdinal: 35,
      releaseId: 'lesson-g04-l03-negative-numbers',
    });
    const payload = await response.json() as {requestId: string};
    expect(await receiptFor(payload.requestId)).toMatchObject({
      framePresent: true,
      requestId: payload.requestId,
    });
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'current-frame-not-attached',
    );
  });

  for (const locale of ['en', 'es'] as const) {
    test(`${locale} speech becomes an editable draft before one confirmed request`, async ({page}) => {
      test.setTimeout(90_000);
      const transcript = locale === 'es'
        ? '¿Qué idea matemática muestra esta página?'
        : 'What math idea does this page show?';
      await installNovaAnalyticsCapture(page);
      await installSpeechRecognition(page, transcript);
      const panel = await openNovaPage({course: courses[0], locale, ordinal: 1, page});
      const apiRequests: string[] = [];
      page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/api/nova') {
          apiRequests.push(request.url());
        }
      });
      await panel.getByRole('button', {
        name: locale === 'es'
          ? 'Dictar un borrador para Nova'
          : 'Dictate a draft for Nova',
      }).click();
      const textbox = panel.getByRole('textbox', {
        name: locale === 'es'
          ? 'Escribe una pregunta para Nova'
          : 'Type a question for Nova',
      });
      await expect(textbox).toHaveValue(transcript);
      await expect(panel.locator('.lesson-shell2__nova-notice')).toContainText(
        locale === 'es'
          ? 'Revísala y luego pulsa Enviar'
          : 'Review it, then press Send',
      );
      const reviewedDraft = locale === 'es'
        ? `${transcript} Explícalo brevemente.`
        : `${transcript} Please keep it brief.`;
      await textbox.fill(reviewedDraft);
      await expect(textbox).toHaveValue(reviewedDraft);
      expect(apiRequests).toEqual([]);
      const preSendAnalytics = await readNovaAnalyticsEvents(page);
      expect(novaSpeechStatuses(preSendAnalytics)).toContain('draft-ready');
      expect(novaSpeechStatuses(preSendAnalytics)).not.toContain('confirmed-send');
      expect(JSON.stringify(preSendAnalytics)).not.toContain(transcript);

      const responsePromise = page.waitForResponse((response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/nova'
      );
      await panel.getByRole('button', {
        name: locale === 'es'
          ? 'Enviar pregunta a Nova'
          : 'Send question to Nova',
      }).click();
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      expect(apiRequests).toHaveLength(1);
      const request = response.request().postDataJSON() as Record<string, unknown>;
      expect(request.message).toBe(reviewedDraft);
      expect(request.inputMethod).toBe('speech-to-draft');
      expect(JSON.stringify(request)).not.toMatch(/audio|voice|blob/iu);
      const postSendAnalytics = await readNovaAnalyticsEvents(page);
      expect(novaSpeechStatuses(postSendAnalytics)).toContain('confirmed-send');
      expect(JSON.stringify(postSendAnalytics)).not.toContain(transcript);
    });
  }
});
