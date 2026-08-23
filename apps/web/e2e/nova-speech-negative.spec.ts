import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
} from '@playwright/test';

type Locale = 'en' | 'es';

type SpeechHarnessPlan = Readonly<{
  kind:
    | 'duplicate-final'
    | 'error'
    | 'final'
    | 'idle'
    | 'interim-only'
    | 'manual-stop'
    | 'start-throws';
  error?: string;
  transcript?: string;
}>;

type SpeechHarnessState = Readonly<{
  abortCalls: number;
  constructed: number;
  languages: readonly string[];
  startCalls: number;
  stopCalls: number;
}>;

const fullStackScenario = process.env.NOVA_FULL_STACK_SCENARIO ?? 'all-on';
if (fullStackScenario !== 'all-on') {
  throw new Error('nova-speech-negative requires the all-on full-stack scenario');
}

function routeFor(locale: Locale) {
  return `${locale === 'es' ? '/es' : ''}/courses/4/3?mode=focus`;
}

function trackNovaRequests(page: Page) {
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/nova'
    ) {
      requests.push(request);
    }
  });
  return requests;
}

async function settleBrowser(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  }));
}

async function installUnsupportedSpeechRecognition(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    });
  });
}

async function installSpeechRecognitionHarness(
  page: Page,
  plan: SpeechHarnessPlan,
) {
  await page.addInitScript((speechPlan) => {
    const state = {
      abortCalls: 0,
      constructed: 0,
      languages: [] as string[],
      startCalls: 0,
      stopCalls: 0,
    };
    Object.defineProperty(window, '__HELP_MATH_NOVA_SPEECH_TEST__', {
      configurable: true,
      value: state,
    });

    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      manualStopEmitted = false;
      maxAlternatives = 1;
      onend: (() => void) | null = null;
      onerror: ((event: {error: string}) => void) | null = null;
      onresult: ((event: {
        resultIndex: number;
        results: Array<Array<{transcript: string}> & {isFinal: boolean}>;
      }) => void) | null = null;

      constructor() {
        state.constructed += 1;
      }

      emitResult(isFinal: boolean) {
        const result = Object.assign(
          [{transcript: speechPlan.transcript ?? 'Explain this page.'}],
          {isFinal},
        );
        this.onresult?.({resultIndex: 0, results: [result]});
      }

      start() {
        state.startCalls += 1;
        state.languages.push(this.lang);
        if (speechPlan.kind === 'start-throws') {
          throw new Error('synthetic-start-failure');
        }
        if (
          speechPlan.kind === 'idle' ||
          speechPlan.kind === 'manual-stop'
        ) return;

        window.setTimeout(() => {
          if (speechPlan.kind === 'error') {
            this.onerror?.({error: speechPlan.error ?? 'network'});
            window.setTimeout(() => this.onend?.(), 0);
            return;
          }
          if (speechPlan.kind === 'interim-only') {
            this.emitResult(false);
            window.setTimeout(() => this.onend?.(), 0);
            return;
          }
          if (speechPlan.kind === 'duplicate-final') {
            this.emitResult(true);
            this.emitResult(true);
            window.setTimeout(() => {
              this.onend?.();
              this.onend?.();
            }, 0);
            return;
          }
          this.emitResult(true);
          window.setTimeout(() => this.onend?.(), 0);
        }, 0);
      }

      stop() {
        state.stopCalls += 1;
        if (
          speechPlan.kind !== 'manual-stop' ||
          this.manualStopEmitted
        ) return;
        this.manualStopEmitted = true;
        this.emitResult(true);
        window.setTimeout(() => this.onend?.(), 0);
      }

      abort() {
        state.abortCalls += 1;
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
  }, plan);
}

async function speechHarnessState(page: Page): Promise<SpeechHarnessState> {
  return page.evaluate(() => {
    const state = (window as Window & {
      __HELP_MATH_NOVA_SPEECH_TEST__?: SpeechHarnessState;
    }).__HELP_MATH_NOVA_SPEECH_TEST__;
    if (!state) throw new Error('SpeechRecognition harness was not installed');
    return {
      abortCalls: state.abortCalls,
      constructed: state.constructed,
      languages: [...state.languages],
      startCalls: state.startCalls,
      stopCalls: state.stopCalls,
    };
  });
}

function questionBox(panel: Locator, locale: Locale) {
  return panel.getByRole('textbox', {
    name: locale === 'es'
      ? 'Escribe una pregunta para Nova'
      : 'Type a question for Nova',
  });
}

function dictateButton(panel: Locator, locale: Locale) {
  return panel.getByRole('button', {
    name: locale === 'es'
      ? 'Dictar un borrador para Nova'
      : 'Dictate a draft for Nova',
    exact: true,
  });
}

function sendButton(panel: Locator, locale: Locale) {
  return panel.getByRole('button', {
    name: locale === 'es'
      ? 'Enviar pregunta a Nova'
      : 'Send question to Nova',
    exact: true,
  });
}

async function openNova(page: Page, locale: Locale) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const response = await page.goto(routeFor(locale), {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBe(200);
  await expect(page.locator('main.lesson-shell2')).toHaveAttribute(
    'data-host-presentation',
    'modern-wide',
  );
  const launcher = page.getByRole('button', {
    name: locale === 'es' ? 'Preguntar a Nova' : 'Ask Nova',
    exact: true,
  });
  await expect(launcher).toBeVisible();
  await launcher.click();
  const panel = page.locator('.lesson-shell2__nova-panel');
  await expect(panel).toBeVisible();
  return panel;
}

function forbiddenMediaPaths(
  value: unknown,
  path = '$',
): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      forbiddenMediaPaths(entry, `${path}[${index}]`)
    );
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, entry]) => {
    const entryPath = `${path}.${key}`;
    const ownMatch = /audio|voice|recording|blob|media.?stream|bytes/iu.test(key)
      ? [entryPath]
      : [];
    return [...ownMatch, ...forbiddenMediaPaths(entry, entryPath)];
  });
}

async function confirmDraft(input: Readonly<{
  apiRequests: Request[];
  expectedMessage: string;
  locale: Locale;
  page: Page;
  panel: Locator;
}>) {
  await expect(questionBox(input.panel, input.locale))
    .toHaveValue(input.expectedMessage);
  await expect(dictateButton(input.panel, input.locale)).toBeEnabled();
  await settleBrowser(input.page);
  expect(input.apiRequests, 'speech completion must not auto-submit').toHaveLength(0);

  const responsePromise = input.page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/nova'
  );
  await sendButton(input.panel, input.locale).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(input.panel.locator('[data-nova-message-role="assistant"]'))
    .toContainText('Nova full-stack test reply');
  await settleBrowser(input.page);
  expect(input.apiRequests, 'one explicit Send must create one request')
    .toHaveLength(1);

  const request = input.apiRequests[0];
  expect(await request.headerValue('content-type')).toContain('application/json');
  const payload = request.postDataJSON() as Record<string, unknown>;
  expect(payload.message).toBe(input.expectedMessage);
  expect(payload.frame).toBeUndefined();
  expect(forbiddenMediaPaths(payload), 'speech sends text only').toEqual([]);
  expect(request.postData() ?? '').not.toMatch(/data:audio|audio\//iu);
}

test.describe('FULL_STACK_FAKE_UPSTREAM Nova speech negative and confirmation matrix', () => {
  test.beforeEach(() => {
    test.setTimeout(90_000);
  });

  test('unsupported browser keeps the microphone disabled with an accessible explanation', async ({page}) => {
    await installUnsupportedSpeechRecognition(page);
    const apiRequests = trackNovaRequests(page);
    const panel = await openNova(page, 'en');
    const microphone = panel.locator('.lesson-shell2__nova-mic');
    await expect(microphone).toBeDisabled();
    await expect(microphone).toHaveAttribute(
      'aria-label',
      'Dictation is unavailable in this browser',
    );
    const descriptionId = await microphone.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    await expect(panel.locator(`[id="${descriptionId}"]`)).toContainText(
      'This browser does not provide speech recognition. Type your question instead.',
    );
    await settleBrowser(page);
    expect(apiRequests).toHaveLength(0);
    expect(await page.evaluate(() => ({
      speech: typeof window.SpeechRecognition,
      webkit: typeof window.webkitSpeechRecognition,
    }))).toEqual({speech: 'undefined', webkit: 'undefined'});
  });

  const recognitionErrors = [
    {
      error: 'not-allowed',
      name: 'permission denied',
      notice: 'The browser did not allow microphone access.',
    },
    {
      error: 'service-not-allowed',
      name: 'service-not-allowed',
      notice: 'The browser did not allow microphone access.',
    },
    {
      error: 'audio-capture',
      name: 'audio-capture',
      notice: 'The browser did not allow microphone access.',
    },
    {
      error: 'no-speech',
      name: 'no-speech',
      notice: 'No clear question was detected.',
    },
    {
      error: 'network',
      name: 'network',
      notice: 'No clear question was detected.',
    },
    {
      error: 'aborted',
      name: 'aborted',
      notice: null,
    },
  ] as const;

  for (const scenario of recognitionErrors) {
    test(`${scenario.name} ends locally without an API request`, async ({page}) => {
      await installSpeechRecognitionHarness(page, {
        kind: 'error',
        error: scenario.error,
      });
      const apiRequests = trackNovaRequests(page);
      const panel = await openNova(page, 'en');
      expect(await speechHarnessState(page)).toMatchObject({constructed: 0});
      await dictateButton(panel, 'en').click();
      await expect(dictateButton(panel, 'en')).toBeEnabled();
      await expect(questionBox(panel, 'en')).toHaveValue('');
      if (scenario.notice) {
        await expect(panel.locator('.lesson-shell2__nova-notice'))
          .toContainText(scenario.notice);
      }
      await settleBrowser(page);
      expect(apiRequests).toHaveLength(0);
      expect(await speechHarnessState(page)).toMatchObject({
        constructed: 1,
        languages: ['en-US'],
        startCalls: 1,
      });
    });
  }

  test('a synchronous start failure remains local and recoverable', async ({page}) => {
    await installSpeechRecognitionHarness(page, {kind: 'start-throws'});
    const apiRequests = trackNovaRequests(page);
    const panel = await openNova(page, 'en');
    await dictateButton(panel, 'en').click();
    await expect(panel.locator('.lesson-shell2__nova-notice')).toContainText(
      'The microphone could not start. Type your question instead.',
    );
    await expect(dictateButton(panel, 'en')).toBeEnabled();
    await expect(questionBox(panel, 'en')).toHaveValue('');
    await settleBrowser(page);
    expect(apiRequests).toHaveLength(0);
    expect(await speechHarnessState(page)).toMatchObject({
      constructed: 1,
      startCalls: 1,
    });
  });

  test('interim-only recognition becomes a draft on end and waits for Send', async ({page}) => {
    const transcript = 'Give me one hint about this page.';
    await installSpeechRecognitionHarness(page, {
      kind: 'interim-only',
      transcript,
    });
    const apiRequests = trackNovaRequests(page);
    const panel = await openNova(page, 'en');
    await dictateButton(panel, 'en').click();
    await expect(panel.locator('.lesson-shell2__nova-notice')).toContainText(
      'Review it, then press Send',
    );
    expect(apiRequests).toHaveLength(0);
    await confirmDraft({apiRequests, expectedMessage: transcript, locale: 'en', page, panel});
  });

  test('duplicate final results and duplicate onend still require exactly one Send', async ({page}) => {
    const transcript = 'Show me the next step without giving the answer.';
    await installSpeechRecognitionHarness(page, {
      kind: 'duplicate-final',
      transcript,
    });
    const apiRequests = trackNovaRequests(page);
    const panel = await openNova(page, 'en');
    await dictateButton(panel, 'en').click();
    await expect(panel.locator('.lesson-shell2__nova-notice')).toContainText(
      'Review it, then press Send',
    );
    await expect.poll(async () => (await speechHarnessState(page)).stopCalls)
      .toBe(2);
    expect(apiRequests).toHaveLength(0);
    await confirmDraft({apiRequests, expectedMessage: transcript, locale: 'en', page, panel});
  });

  test('double activation stops listening, produces a draft, and never auto-sends', async ({page}) => {
    const transcript = 'What should I notice first?';
    await installSpeechRecognitionHarness(page, {
      kind: 'manual-stop',
      transcript,
    });
    const apiRequests = trackNovaRequests(page);
    const panel = await openNova(page, 'en');
    await dictateButton(panel, 'en').click();
    // The control intentionally changes its accessible action after start;
    // activate that new Stop action immediately to exercise a rapid repeat.
    await panel.getByRole('button', {
      name: 'Stop listening and review transcript',
      exact: true,
    }).click({delay: 10});
    await expect(panel.locator('.lesson-shell2__nova-notice')).toContainText(
      'Review it, then press Send',
    );
    await expect.poll(async () => (await speechHarnessState(page)).stopCalls)
      .toBeGreaterThanOrEqual(1);
    expect(apiRequests).toHaveLength(0);
    await confirmDraft({apiRequests, expectedMessage: transcript, locale: 'en', page, panel});
  });

  test('closing the panel aborts an active recognition without sending', async ({page}) => {
    await installSpeechRecognitionHarness(page, {kind: 'idle'});
    const apiRequests = trackNovaRequests(page);
    const panel = await openNova(page, 'en');
    await dictateButton(panel, 'en').click();
    await expect(panel.getByRole('button', {
      name: 'Stop listening and review transcript',
      exact: true,
    })).toBeVisible();
    await panel.getByRole('button', {name: 'Close Nova', exact: true}).click();
    await expect(panel).toBeHidden();
    await expect.poll(async () => (await speechHarnessState(page)).abortCalls)
      .toBe(1);
    await settleBrowser(page);
    expect(apiRequests).toHaveLength(0);
  });

  for (const locale of ['en', 'es'] as const) {
    test(`${locale} uses the exact recognition locale and submits only an edited confirmed draft`, async ({page}) => {
      const transcript = locale === 'es'
        ? '¿Qué idea matemática muestra esta página?'
        : 'What math idea does this page show?';
      const edited = locale === 'es'
        ? `${transcript} Dame una pista breve.`
        : `${transcript} Give me one short hint.`;
      await installSpeechRecognitionHarness(page, {
        kind: 'final',
        transcript,
      });
      const apiRequests = trackNovaRequests(page);
      const panel = await openNova(page, locale);
      expect(await speechHarnessState(page)).toMatchObject({constructed: 0});
      await dictateButton(panel, locale).click();
      await expect(questionBox(panel, locale)).toHaveValue(transcript);
      await expect(panel.locator('.lesson-shell2__nova-notice')).toContainText(
        locale === 'es'
          ? 'Revísala y luego pulsa Enviar'
          : 'Review it, then press Send',
      );
      await expect(dictateButton(panel, locale)).toBeEnabled();
      expect(apiRequests).toHaveLength(0);
      expect(await speechHarnessState(page)).toMatchObject({
        constructed: 1,
        languages: [locale === 'es' ? 'es-US' : 'en-US'],
        startCalls: 1,
      });

      await questionBox(panel, locale).fill(edited);
      await confirmDraft({apiRequests, expectedMessage: edited, locale, page, panel});
    });
  }
});
