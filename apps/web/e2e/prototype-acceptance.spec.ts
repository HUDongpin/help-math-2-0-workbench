import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Locator, type Page} from '@playwright/test';

/**
 * Phase 8 acceptance: the prototype's composition, asserted structurally.
 *
 * The earlier specs proved geometry — aspect, crop, resolution. This one
 * proves the *arrangement* the design artifact specifies, because that is what
 * the written plan under-specified and what prose review missed:
 *
 *   - a section spine carrying the lesson's own named sequence
 *   - one transport group: Previous, Pause, Next, together, on one line
 *   - progress inline in that same line, reported exactly once
 *   - no session bar above the lesson
 *   - no second permanent rail beside the plane
 */

const MODERN_WIDE = process.env.MODERN_WIDE_SHELL_ENABLED === 'true';
const ROOT = 'main.lesson-shell2';
const SPINE = '.lesson-shell2__spine';
const BAR = '.lesson-shell2__modern-toolbar';

const SECTIONS = [
  'Introduction', 'Your World', 'Important Words', 'Learn It',
  'Try It', 'Play It', 'Practice Test', 'Final Quiz',
];

interface NovaMockRequest {
  readonly message: string;
  readonly mode: 'focus' | 'study' | 'classroom';
  readonly history: readonly Readonly<{role: 'user' | 'assistant'; text: string}>[];
  readonly frame?: Readonly<{
    animationId: string;
    dataUrl: string;
    width: number;
    height: number;
  }>;
}

async function mockNovaApi(
  page: Page,
  options: Readonly<{delayMs?: number; timeoutMessage?: string}> = {},
) {
  const requests: NovaMockRequest[] = [];
  await page.route('**/api/nova', async (route) => {
    const request = route.request().postDataJSON() as NovaMockRequest;
    requests.push(request);
    await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 60));
    if (request.message === options.timeoutMessage) {
      await route.fulfill({
        body: JSON.stringify({
          ok: false,
          error: {code: 'NOVA_TIMEOUT', message: 'Mock timeout'},
        }),
        contentType: 'application/json',
        status: 504,
      });
      return;
    }
    await route.fulfill({
      body: JSON.stringify({
        ok: true,
        reply: `Mock Nova reply: ${request.message}`,
        model: 'openai/gpt-5.6-luna',
      }),
      contentType: 'application/json',
      status: 200,
    });
  });
  return requests;
}

async function installMockSpeechRecognition(page: Page, transcript: string) {
  await page.addInitScript((mockTranscript) => {
    class MockSpeechRecognition {
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
      private ended = false;

      private finish() {
        if (this.ended) return;
        this.ended = true;
        window.setTimeout(() => this.onend?.(), 0);
      }

      start() {
        window.setTimeout(() => {
          if (this.ended) return;
          const result = Object.assign(
            [{transcript: mockTranscript}],
            {isFinal: true},
          );
          this.onresult?.({resultIndex: 0, results: [result]});
          this.finish();
        }, 0);
      }

      stop() {
        this.finish();
      }

      abort() {
        this.ended = true;
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    });
  }, transcript);
}

async function disableSpeechRecognition(page: Page) {
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

async function waitForNovaRequest(
  requests: readonly NovaMockRequest[],
  count: number,
) {
  await expect.poll(() => requests.length).toBe(count);
  return requests[count - 1]!;
}

function expectBoundedJpegFrame(request: NovaMockRequest) {
  expect(request.frame).toBeDefined();
  const dataUrl = request.frame!.dataUrl;
  expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/u);
  expect(dataUrl.length).toBeLessThanOrEqual(25_000);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = Math.floor(base64.length * 3 / 4) - padding;
  expect(bytes).toBeLessThanOrEqual(18 * 1_024);
  expect(request.frame!.width).toBeGreaterThan(0);
  expect(request.frame!.height).toBeGreaterThan(0);
}

async function openLesson(
  page: Page,
  viewport: Readonly<{width: number; height: number}> = {
    width: 1600,
    height: 1000,
  },
  route = '/courses/4/3',
) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.setViewportSize(viewport);
  await page.goto(route, {waitUntil: 'domcontentloaded'});
  await expect(page.locator(ROOT)).toHaveAttribute('data-host-presentation', 'modern-wide');
  await expect(page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]'))
    .toHaveAttribute('data-hydrated', 'true');
  await page.waitForLoadState('networkidle');
}

async function goToPage34(page: Page) {
  await page.getByRole('button', {name: 'Practice Test', exact: true}).click();
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
  }
  await expect(page.locator('[data-current-page="34"]')).toBeVisible();
}

async function goToPage36(page: Page) {
  await goToPage34(page);
  await page.getByRole('button', {name: 'Next page', exact: true}).click();
  await page.getByRole('button', {name: 'Next page', exact: true}).click();
  await expect(page.locator('[data-current-page="36"]')).toBeVisible();
}

async function goToPage14(page: Page) {
  await page.locator(`${SPINE} button[data-section-code="IN"]`).click();
  await expect(page.locator('[data-current-page="13"]')).toBeVisible();
  await page.getByRole('button', {name: 'Next page', exact: true}).click();
  await expect(page.locator('[data-current-page="14"]')).toBeVisible();
  await expect(page.locator(
    '.runtime-stage[data-animation-id="course-g04-l03-in-003"]',
  )).toBeVisible();
}

async function goToFinalQuizPage(page: Page, globalPage: 37 | 38 | 39) {
  await page.locator(`${SPINE} button[data-section-code="FQ"]`).click();
  await expect(page.locator('[data-current-page="37"]')).toBeVisible();
  for (let currentPage = 37; currentPage < globalPage; currentPage += 1) {
    await page.locator(
      `${BAR} [data-responsive-focus-key="next"]`,
    ).click();
    await expect(page.locator(
      `[data-current-page="${currentPage + 1}"]`,
    )).toBeVisible();
  }
}

async function readFlashFrame(stage: Locator) {
  const value = await stage.getAttribute('data-flash-frame');
  expect(value, 'the live runtime stage must report its current frame')
    .not.toBeNull();
  return Number(value);
}

async function expectModernFinalQuizPresentation(
  page: Page,
  animationId: 'course-g04-l03-fq-002' | 'course-g04-l03-fq-003',
) {
  const quiz = page.locator(
    `[data-final-quiz-animation-id="${animationId}"]`,
  );
  await expect(quiz).toHaveAttribute('data-current-js-controls-enabled', 'true');
  await expect(quiz).toHaveAttribute('data-current-js-controls-ready', 'true', {
    timeout: 10_000,
  });
  await expect(quiz).toHaveAttribute('data-current-js-overlay-count', '1');

  const overlay = quiz.locator(
    `[data-current-js-functional-overlay="${animationId}-quiz"]`,
  );
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toBeVisible();

  const mask = overlay.locator(
    '[data-modern-source-visual-cover="full-stage-opaque"]',
  );
  await expect(mask).toHaveCount(1);
  await expect(mask).toBeVisible();
  const maskRect = mask.locator('rect');
  await expect(maskRect).toHaveAttribute('x', '0');
  await expect(maskRect).toHaveAttribute('y', '0');
  await expect(maskRect).toHaveAttribute('width', '800');
  await expect(maskRect).toHaveAttribute('height', '600');
  await expect(maskRect).toHaveAttribute('fill', '#b8d8f7');
  expect(await maskRect.evaluate((element) => ({
    fillOpacity: getComputedStyle(element).fillOpacity,
    opacity: getComputedStyle(element).opacity,
  }))).toEqual({fillOpacity: '1', opacity: '1'});

  const sourceHost = quiz.locator(
    ':scope > [data-source-canvas-accessibility-isolated="true"]',
  );
  await expect(sourceHost).toHaveCount(1);
  await expect(sourceHost).toHaveAttribute('aria-hidden', 'true');
  await expect(sourceHost).toHaveAttribute('inert', '');
  await expect(sourceHost).toHaveAttribute(
    'data-source-canvas-visual-exposure',
    'hidden-behind-modern-backdrop',
  );
  const sourceCanvas = sourceHost.locator(
    `canvas[data-course-canvas="${animationId}"]`,
  );
  await expect(sourceCanvas).toBeVisible();

  const [maskBox, sourceBox] = await Promise.all([
    mask.boundingBox(),
    sourceCanvas.boundingBox(),
  ]);
  expect(maskBox).not.toBeNull();
  expect(sourceBox).not.toBeNull();
  expect(Math.abs(maskBox!.x - sourceBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(maskBox!.y - sourceBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(maskBox!.width - sourceBox!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(maskBox!.height - sourceBox!.height)).toBeLessThanOrEqual(1);

  await expect(quiz.locator(
    '.course-g04-l03-fq-002-stage-panel:visible',
  )).toHaveCount(1);
  await expect(quiz.locator(
    '.course-g04-l03-fq-002-eyebrow span:visible',
  ).filter({hasText: 'Modern reconstruction'})).toHaveCount(1);
}

test.describe('prototype composition', () => {
  test.skip(!MODERN_WIDE, 'MODERN_WIDE_SHELL_ENABLED is not true');

  test('the section spine carries the lesson’s own named sequence', async ({page}) => {
    await openLesson(page);
    const spine = page.locator(SPINE);
    await expect(spine).toBeVisible();

    const labels = await spine.locator('button .lesson-shell2__spine-name').allTextContents();
    expect(labels.map((l) => l.trim())).toEqual(SECTIONS);

    // Exactly one section is current, and it is a real section.
    const current = spine.locator('button[aria-current="step"]');
    await expect(current).toHaveCount(1);
  });

  test('the transport is one group on one line with progress inline', async ({page}) => {
    await openLesson(page);

    const rowOf = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, `${selector} must be laid out`).not.toBeNull();
      return box!.y + box!.height / 2;
    };

    const prev = await rowOf(`${BAR} [data-responsive-focus-key="previous"]`);
    const pause = await rowOf(`${BAR} [data-responsive-focus-key="pause"]`);
    const next = await rowOf(`${BAR} [data-responsive-focus-key="next"]`);
    const meter = await rowOf(`${BAR} .lesson-shell2__modern-completion`);

    for (const [name, mid] of [['pause', pause], ['next', next], ['progress', meter]] as const) {
      expect(
        Math.abs(mid - prev),
        `${name} must share the transport line with Previous`,
      ).toBeLessThan(28);
    }

    // Previous, Pause, Next read left to right.
    const x = async (selector: string) =>
      (await page.locator(selector).first().boundingBox())!.x;
    expect(await x(`${BAR} [data-responsive-focus-key="previous"]`))
      .toBeLessThan(await x(`${BAR} [data-responsive-focus-key="pause"]`));
    expect(await x(`${BAR} [data-responsive-focus-key="pause"]`))
      .toBeLessThan(await x(`${BAR} [data-responsive-focus-key="next"]`));
  });

  test('progress is reported exactly once', async ({page}) => {
    await openLesson(page);
    await expect(page.locator('.lesson-shell2__session-bar')).toBeHidden();
    await expect(page.locator(`${BAR} .lesson-shell2__modern-completion`)).toBeVisible();

    // The session bar's meter still exists in the DOM but is not rendered, so
    // count what a learner can actually see rather than what the tree holds.
    const visibleMeters = await page.evaluate(() =>
      [...document.querySelectorAll('progress')].filter((meter) => {
        const style = getComputedStyle(meter);
        const box = meter.getBoundingClientRect();
        return style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          box.width > 0 && box.height > 0;
      }).length);
    expect(visibleMeters, 'progress must be reported once').toBe(1);
  });

  test('no second permanent rail competes with the plane', async ({page}) => {
    await openLesson(page);
    // The invariant is that the rail claims no layout space beside the plane,
    // not that the node is absent: it stays mounted so the Map control can
    // open it on demand.
    const railArea = await page.evaluate(() => {
      const rail = document.querySelector('.lesson-shell2__side-panel--map');
      if (!rail) return 0;
      const box = rail.getBoundingClientRect();
      return box.width * box.height;
    });
    expect(railArea, 'the map rail must not occupy a column').toBe(0);
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="study-support"]`,
    )).toBeVisible();
  });

  test('the transport is not duplicated anywhere', async ({page}) => {
    await openLesson(page);
    await expect(page.locator('[data-responsive-focus-key="next"]')).toHaveCount(1);
    await expect(page.locator('[data-responsive-focus-key="previous"]')).toHaveCount(1);
    // Back repeated Previous once the transport moved into the bar.
    await expect(page.locator('[data-responsive-focus-key="header-back"]')).toBeHidden();
  });

  test('Ask Nova opens a non-occluding Focus column without taking over playback', async ({page}) => {
    const requests = await mockNovaApi(page, {timeoutMessage: 'Please timeout.'});
    await installMockSpeechRecognition(page, 'How does the number line help?');
    await openLesson(page, {width: 1920, height: 1080});
    await goToPage34(page);

    const stage = page.locator('.lesson-shell2__legacy-stage');
    const closedStage = await stage.boundingBox();
    expect(closedStage).not.toBeNull();

    const launcher = page.getByRole('button', {name: 'Ask Nova', exact: true});
    await expect(launcher).toBeVisible();
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');

    const secondaryX = async (selector: string) =>
      (await page.locator(selector).first().boundingBox())!.x;
    const askNovaX = (await launcher.boundingBox())!.x;
    const replayX = await secondaryX(`${BAR} [data-responsive-focus-key="replay"]`);
    const muteX = await secondaryX(`${BAR} [data-responsive-focus-key="mute"]`);
    const supportX = await secondaryX(
      `${BAR} [data-responsive-focus-key="study-support"]`,
    );
    expect(askNovaX).toBeLessThan(replayX);
    expect(replayX).toBeLessThan(muteX);
    expect(muteX).toBeLessThan(supportX);

    await launcher.click();

    await expect(page.locator(ROOT)).toHaveAttribute('data-tutor-open', 'true');
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-tutor-provider', 'not-yet-confirmed');
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-tutor-provider',
      'same-origin-gateway-not-yet-confirmed',
    );
    await expect(panel).toHaveAttribute(
      'data-tutor-product-origin',
      'mais-nova-tutor',
    );
    await expect(panel.getByText(/Current frame available · not sent/)).toBeVisible();
    await expect(panel).toHaveAttribute('data-tutor-frame-snapshot', 'available');
    await expect(page.locator(ROOT))
      .toHaveAttribute('data-tutor-frame-snapshot', 'available');
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-tutor-playback',
      'independent',
    );
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-host-audio-timeline-paused',
      'false',
    );
    await expect(panel.getByRole('status')).toContainText('Nova is ready when you ask');
    await expect(panel.getByRole('status')).toContainText(
      'Nova is instructed to offer hints and guiding questions instead of revealing or confirming the answer.',
    );
    await expect(panel.locator('.lesson-shell2__nova-message')).toHaveCount(0);
    await expect(panel.getByText('Ask a question', {exact: true}))
      .toBeVisible();
    await expect(panel.getByRole('button', {name: 'Concept explanation'}))
      .toBeVisible();
    await expect(panel.getByRole('button', {name: 'Step-by-step hint'}))
      .toBeVisible();
    await expect(panel.getByRole('button', {name: 'Answer check'}))
      .toBeVisible();
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="pause"]`,
    )).toBeEnabled();

    const [openStage, openPanel] = await Promise.all([
      stage.boundingBox(),
      panel.boundingBox(),
    ]);
    expect(openStage).not.toBeNull();
    expect(openPanel).not.toBeNull();
    expect(openStage!.x + openStage!.width).toBeLessThanOrEqual(openPanel!.x);
    expect(openStage!.width).toBeLessThanOrEqual(closedStage!.width);

    const accessibility = await new AxeBuilder({page})
      .include(ROOT)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = accessibility.violations.filter(
      (violation) =>
        violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);

    const attach = panel.locator('.lesson-shell2__nova-camera');
    await expect(attach).toHaveAccessibleName('Attach the current lesson frame');
    await attach.click();
    await expect(attach).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.locator('.lesson-shell2__nova-notice'))
      .toContainText('Frame attached for the next question only');

    await panel.getByRole('button', {name: 'Concept explanation'}).click();
    await expect(panel).toHaveAttribute('data-tutor-conversation-state', 'loading');
    const quickPrompt = await waitForNovaRequest(requests, 1);
    expect(quickPrompt.message).toBe('Help me understand 4 - Step Plan.');
    expect(quickPrompt.mode).toBe('focus');
    expect(quickPrompt.history).toEqual([]);
    expectBoundedJpegFrame(quickPrompt);
    expect(quickPrompt.frame?.animationId).toBe('course-g04-l03-ts-006');
    await expect(panel.getByText(
      'Mock Nova reply: Help me understand 4 - Step Plan.',
      {exact: true},
    )).toBeVisible();
    await expect(panel).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(panel).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(page.locator(ROOT)).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(page.locator(ROOT)).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(attach).toHaveAttribute('aria-pressed', 'false');

    const question = panel.getByRole('textbox', {name: 'Type a question for Nova'});
    await question.fill('Show me a similar temperature example.');
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
    const typed = await waitForNovaRequest(requests, 2);
    expect(typed.message).toBe('Show me a similar temperature example.');
    expect(typed.mode).toBe('focus');
    expect(typed.frame).toBeUndefined();
    expect(typed.history).toEqual([
      {role: 'user', text: 'Help me understand 4 - Step Plan.'},
      {role: 'assistant', text: 'Mock Nova reply: Help me understand 4 - Step Plan.'},
    ]);
    await expect(panel.getByText(
      'Mock Nova reply: Show me a similar temperature example.',
      {exact: true},
    )).toBeVisible();

    await panel.getByRole('button', {name: 'Ask Nova by voice'}).click();
    const voice = await waitForNovaRequest(requests, 3);
    expect(voice.message).toBe('How does the number line help?');
    expect(voice.mode).toBe('focus');
    expect(voice.frame).toBeUndefined();
    await expect(panel.getByText(
      'Mock Nova reply: How does the number line help?',
      {exact: true},
    )).toBeVisible();

    await question.fill('Please timeout.');
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
    const failed = await waitForNovaRequest(requests, 4);
    expect(failed.message).toBe('Please timeout.');
    await expect(panel).toHaveAttribute('data-tutor-conversation-state', 'error');
    await expect(panel.locator('.lesson-shell2__nova-notice'))
      .toHaveText('Nova took too long. Please try again.');

    await launcher.click();
    await expect(page.locator(ROOT)).toHaveAttribute('data-tutor-open', 'false');
    await expect(panel).toHaveCount(0);
    await expect(launcher).toBeFocused();
  });

  test('Study keeps one support region while every tab remains playback-independent', async ({page}) => {
    const requests = await mockNovaApi(page);
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/courses/4/3?mode=study',
    );

    const root = page.locator(ROOT);
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(root).toHaveAttribute('data-tutor-mode', 'study');
    await expect(root).toHaveAttribute('data-tutor-panel-open', 'true');
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'false');
    await expect(panel).toHaveCount(1);
    await expect(panel.getByRole('tab', {name: 'Read it'}))
      .toHaveAttribute('aria-selected', 'true');
    await expect(root).toHaveAttribute('data-tutor-playback', 'independent');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );

    await goToPage34(page);

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    await expect(panel.getByRole('tab', {name: 'Nova Tutor'}))
      .toHaveAttribute('aria-selected', 'true');
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'true');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="pause"]`,
    )).toBeEnabled();
    const framePreview = panel.locator('[data-tutor-current-frame="captured"]');
    await expect(framePreview).toBeVisible();
    await expect.poll(async () => framePreview.evaluate(async (element) => {
      const background = getComputedStyle(element).backgroundImage;
      const match = background.match(/^url\(["']?(data:image\/png[^"']+)["']?\)$/u);
      if (!match) return 0;
      const image = new Image();
      image.src = match[1];
      await image.decode();
      const sample = document.createElement('canvas');
      sample.width = image.naturalWidth;
      sample.height = image.naturalHeight;
      const context = sample.getContext('2d');
      if (!context) return 0;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(
        0,
        0,
        sample.width,
        sample.height,
      ).data;
      const colors = new Set<string>();
      for (let index = 0; index < pixels.length; index += 64) {
        colors.add(`${pixels[index]}:${pixels[index + 1]}:${pixels[index + 2]}`);
      }
      return colors.size;
    }), {timeout: 3_000}).toBeGreaterThan(20);

    const novaTab = panel.getByRole('tab', {name: 'Nova Tutor'});
    await novaTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.getByRole('tab', {name: 'Read it'}))
      .toHaveAttribute('aria-selected', 'true');
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'false');
    await expect(panel).toHaveCount(1);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );

    const readTab = panel.getByRole('tab', {name: 'Read it'});
    await readTab.focus();
    await page.keyboard.press('End');
    await expect(panel.getByRole('tab', {name: 'Words'}))
      .toHaveAttribute('aria-selected', 'true');
    const firstWord = panel.locator('.lesson-shell2__nova-words button').first();
    await expect(firstWord).toBeVisible();
    await firstWord.click();
    await expect(panel.getByRole('tab', {name: 'Nova Tutor'}))
      .toHaveAttribute('aria-selected', 'true');
    const wordsRequest = await waitForNovaRequest(requests, 1);
    expect(wordsRequest.message).toBe('Help me understand Number Line.');
    expect(wordsRequest.mode).toBe('study');
    expect(wordsRequest.frame).toBeUndefined();
    await expect(panel.getByText(
      'Mock Nova reply: Help me understand Number Line.',
      {exact: true},
    )).toBeVisible();
    await expect(panel).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(panel).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(root).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(root).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'true');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
  });

  test('Study does not open an unsolicited modal on a narrow screen', async ({page}) => {
    await openLesson(
      page,
      {width: 375, height: 812},
      '/courses/4/3?mode=study',
    );

    const root = page.locator(ROOT);
    await expect(root).toHaveAttribute('data-tutor-mode', 'study');
    await expect(root).toHaveAttribute('data-tutor-panel-open', 'false');
    await expect(root).toHaveAttribute('data-tutor-modal', 'false');
    await expect(page.getByRole('dialog', {name: 'Nova Tutor support'}))
      .toHaveCount(0);
    await expect(page.locator('.lesson-shell2__learning-column'))
      .not.toHaveAttribute('inert', '');

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'Nova Tutor support'});
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', {name: 'Nova Tutor'}))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('Page 36 readable support has exactly one visible owner', async ({page}) => {
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/courses/4/3?mode=study',
    );
    await goToPage36(page);

    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel.getByRole('tab', {name: 'Read it'}))
      .toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.g4-l3-readable-view:visible')).toHaveCount(1);
    await expect(page.locator(
      '.lesson-shell2__learning-support .g4-l3-readable-view',
    )).toHaveCount(0);

    await panel.getByRole('tab', {name: 'Words'}).click();
    await expect(page.locator('.g4-l3-readable-view:visible')).toHaveCount(0);
    await panel.getByRole('tab', {name: 'Read it'}).click();
    await expect(page.locator('.g4-l3-readable-view:visible')).toHaveCount(1);
  });

  test('Nova context and frame track page navigation while the panel stays open', async ({page}) => {
    await openLesson(page, {width: 1920, height: 1080});
    await goToPage34(page);
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();

    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toHaveAttribute('data-tutor-page-title-en', '4 - Step Plan');
    await expect(panel).toContainText('Page 34 of 39');

    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await expect(page.locator('[data-current-page="35"]')).toBeVisible();
    await expect(panel).toHaveAttribute('data-tutor-page-title-en', 'Question 1');
    await expect(panel).toContainText('Page 35 of 39');
    await expect(page.locator(ROOT))
      .toHaveAttribute('data-current-animation-id', 'course-g04-l03-ts-007');
    await expect(page.locator(ROOT))
      .toHaveAttribute('data-tutor-frame-snapshot', 'available');
  });

  test('Nova rasterizes an inline SVG lesson surface into a bounded attachment', async ({page}) => {
    const requests = await mockNovaApi(page);
    await openLesson(page, {width: 1920, height: 1080});
    await page.getByRole('button', {name: 'Important Words', exact: true}).click();
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await expect(page.locator('[data-current-page="6"]')).toBeVisible();
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-current-animation-id',
      'course-g04-l03-vb-003',
    );
    await expect(page.locator('.lesson-shell2__stage svg')).toBeVisible();

    // This page normally layers an inline SVG interaction over a source-static
    // canvas. Remove that canvas in-browser to exercise the real SVG fallback
    // rather than merely proving that the preferred canvas path still works.
    await page.locator('.lesson-shell2__stage canvas').evaluateAll((canvases) => {
      canvases.forEach((canvas) => canvas.remove());
    });
    await expect(page.locator('.lesson-shell2__stage canvas')).toHaveCount(0);

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-tutor-frame-snapshot',
      'available',
      {timeout: 10_000},
    );
    await expect(panel).toHaveAttribute('data-tutor-frame-snapshot', 'available');

    const attach = panel.locator('.lesson-shell2__nova-camera');
    await expect(attach).toHaveAccessibleName('Attach the current lesson frame');
    await attach.click();
    await expect(attach).toHaveAttribute('aria-pressed', 'true');
    const question = panel.getByRole('textbox', {name: 'Type a question for Nova'});
    await question.fill('What do you see in this number-line activity?');
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();

    const request = await waitForNovaRequest(requests, 1);
    expect(request.mode).toBe('focus');
    expect(request.message).toBe('What do you see in this number-line activity?');
    expect(request.frame?.animationId).toBe('course-g04-l03-vb-003');
    expectBoundedJpegFrame(request);
    await expect(panel.getByText(
      'Mock Nova reply: What do you see in this number-line activity?',
      {exact: true},
    )).toBeVisible();
  });

  test('Focus Nova leaves a live animation running and keeps Pause and Resume learner-controlled', async ({page}) => {
    test.setTimeout(45_000);
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await openLesson(page, {width: 1920, height: 1080});
    await goToPage14(page);

    const root = page.locator(ROOT);
    const runtime = page.locator('.runtime-shell');
    const stage = page.locator(
      '.runtime-stage[data-animation-id="course-g04-l03-in-003"]',
    );
    const pause = page.locator(
      `${BAR} [data-responsive-focus-key="pause"]`,
    );
    const launcher = page.getByRole('button', {name: 'Ask Nova', exact: true});

    await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
    await expect(pause).toBeEnabled();
    const frameBeforeNova = await readFlashFrame(stage);
    await expect.poll(() => readFlashFrame(stage), {timeout: 4_000})
      .toBeGreaterThan(frameBeforeNova);

    await launcher.click();
    await expect(root).toHaveAttribute('data-tutor-open', 'true');
    await expect(root).toHaveAttribute('data-tutor-playback', 'independent');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
    await expect(runtime).toHaveAttribute(
      'data-host-audio-timeline-paused',
      'false',
    );
    await expect(pause).toBeEnabled();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');

    const frameWithNovaOpen = await readFlashFrame(stage);
    await expect.poll(() => readFlashFrame(stage), {timeout: 4_000})
      .toBeGreaterThan(frameWithNovaOpen);

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'true');
    const manuallyPausedFrame = await readFlashFrame(stage);
    await page.waitForTimeout(750);
    expect(await readFlashFrame(stage)).toBe(manuallyPausedFrame);

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
    const resumedFrame = await readFlashFrame(stage);
    await expect.poll(() => readFlashFrame(stage), {timeout: 4_000})
      .toBeGreaterThan(resumedFrame);

    await launcher.click();
    await expect(root).toHaveAttribute('data-tutor-open', 'false');
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
  });

  test('support tools retain a pause lease while Nova preserves the learner state', async ({page}) => {
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/courses/4/3?mode=classroom',
    );

    const pause = page.locator(`${BAR} [data-responsive-focus-key="pause"]`);
    const map = page.locator(`${BAR} [data-responsive-focus-key="map"]`);
    await expect(pause).toHaveAttribute('aria-pressed', 'false');

    await map.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', {name: 'Close course map'}).click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await map.click();
    await page.getByRole('button', {name: 'Close course map'}).click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-tutor-playback',
      'independent',
    );
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await expect(pause).toBeEnabled();
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await expect(pause).toBeEnabled();
    await page.getByRole('button', {name: 'Close Nova'}).click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', {name: 'Close Nova'}).click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
  });

  test('Classroom keeps voice plus a working text fallback in one projector band', async ({page}) => {
    const requests = await mockNovaApi(page, {
      delayMs: 250,
      timeoutMessage: 'Please timeout.',
    });
    await disableSpeechRecognition(page);
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/courses/4/3?mode=classroom',
    );

    const root = page.locator(ROOT);
    await expect(root).toHaveAttribute('data-tutor-mode', 'classroom');
    await expect(page.locator('.lesson-shell2__nova-panel')).toHaveCount(0);
    await expect(page.locator('.lesson-shell2__nova-classroom-band'))
      .toHaveCount(0);

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const band = page.getByRole('region', {name: 'Nova Tutor voice band'});
    await expect(band).toBeVisible();
    await expect(root).toHaveAttribute('data-tutor-playback', 'independent');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="pause"]`,
    )).toBeEnabled();
    const launcher = page.getByRole('button', {name: 'Ask Nova', exact: true});
    const controlledId = await launcher.getAttribute('aria-controls');
    expect(controlledId).toBeTruthy();
    await expect(page.locator(`#${controlledId}`)).toBeVisible();
    await expect(page.locator('.lesson-shell2__nova-panel')).toHaveCount(0);
    const question = band.getByRole('textbox', {
      name: 'Type a classroom question for Nova',
    });
    const send = band.getByRole('button', {
      name: 'Send classroom question to Nova',
    });
    await expect(question).toBeVisible();
    await expect(send).toBeDisabled();
    await expect(band.locator('form')).toHaveAttribute(
      'data-classroom-text-fallback',
      'available',
    );
    await expect(band).toContainText('No question recorded');
    await expect(band).toContainText('Use the microphone or type a question');
    await expect(band).toHaveAttribute('data-tutor-provider', 'not-yet-confirmed');

    expect(await page.evaluate(() =>
      !window.SpeechRecognition && !window.webkitSpeechRecognition
    )).toBe(true);
    await band.getByRole('button', {name: 'Ask Nova by voice'}).click();
    await expect(band).toContainText(
      'Speech recognition is not available in this browser. Type your question instead.',
    );
    expect(requests).toHaveLength(0);

    await question.fill('Why is negative three below zero?');
    await question.press('Enter');
    await expect(band).toHaveAttribute('data-tutor-conversation-state', 'loading');
    await expect(question).toBeDisabled();
    await expect(send).toBeDisabled();
    await expect(band.getByRole('button', {name: 'Ask Nova by voice'})).toBeDisabled();
    const typedRequest = await waitForNovaRequest(requests, 1);
    expect(typedRequest.message).toBe('Why is negative three below zero?');
    expect(typedRequest.mode).toBe('classroom');
    expect(typedRequest.history).toEqual([]);
    expect(typedRequest.frame).toBeUndefined();
    await expect(band).toContainText('Why is negative three below zero?');
    await expect(band).toContainText(
      'Mock Nova reply: Why is negative three below zero?',
    );
    await expect(band).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(band).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(root).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(root).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(question).toBeEnabled();

    await question.fill('Please timeout.');
    await question.press('Enter');
    await expect(band).toHaveAttribute('data-tutor-conversation-state', 'loading');
    const failedRequest = await waitForNovaRequest(requests, 2);
    expect(failedRequest.message).toBe('Please timeout.');
    expect(failedRequest.history).toEqual([
      {role: 'user', text: 'Why is negative three below zero?'},
      {
        role: 'assistant',
        text: 'Mock Nova reply: Why is negative three below zero?',
      },
    ]);
    await expect(band).toHaveAttribute('data-tutor-conversation-state', 'error');
    await expect(band).toContainText('Nova took too long. Please try again.');
    await expect(question).toBeEnabled();

    const dimensions = await band.evaluate((element) => {
      const mic = element.querySelector<HTMLElement>(
        '.lesson-shell2__nova-classroom-mic',
      )!;
      const answer = element.querySelector<HTMLElement>(
        '.lesson-shell2__nova-classroom-answer span',
      )!;
      const micBox = mic.getBoundingClientRect();
      return {
        micWidth: micBox.width,
        micHeight: micBox.height,
        answerFont: Number.parseFloat(getComputedStyle(answer).fontSize),
      };
    });
    expect(dimensions.micWidth).toBeGreaterThanOrEqual(72);
    expect(dimensions.micHeight).toBeGreaterThanOrEqual(72);
    expect(dimensions.answerFont).toBeGreaterThanOrEqual(24);

    const [bandBox, viewport] = await Promise.all([
      band.boundingBox(),
      page.viewportSize(),
    ]);
    expect(bandBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(bandBox!.y).toBeGreaterThanOrEqual(0);
    expect(bandBox!.y + bandBox!.height)
      .toBeLessThanOrEqual(viewport!.height);

    await band.getByRole('button', {name: 'Close Nova'}).click();
    await expect(band).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Ask Nova', exact: true}))
      .toBeFocused();
  });

  test('narrow Focus is a modal sheet with scrim, inert background, and trapped focus', async ({page}) => {
    await openLesson(page, {width: 375, height: 812});
    const launcher = page.getByRole('button', {name: 'Ask Nova', exact: true});
    await launcher.click();

    const root = page.locator(ROOT);
    const dialog = page.getByRole('dialog', {name: 'Nova Tutor support'});
    await expect(root).toHaveAttribute('data-tutor-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('.lesson-shell2__nova-scrim')).toBeVisible();
    await expect(page.locator('.lesson-shell2__learning-column'))
      .toHaveAttribute('inert', '');
    await expect(page.locator(SPINE)).toHaveAttribute('inert', '');
    await expect(root).toHaveAttribute('data-tutor-playback', 'independent');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
    await expect(dialog.getByRole('button', {name: 'Close Nova'})).toBeFocused();

    const readTab = dialog.getByRole('tab', {name: 'Read it'});
    await readTab.click();
    await readTab.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', {name: 'Close Nova'})).toBeFocused();

    const noHorizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1);
    expect(noHorizontalOverflow).toBe(true);

    const modalCoverage = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLElement>(
        '.lesson-shell2__nova-panel',
      )!.getBoundingClientRect();
      const scrim = document.querySelector<HTMLElement>(
        '.lesson-shell2__nova-scrim',
      )!.getBoundingClientRect();
      return {
        dialogLeft: dialog.left,
        dialogRight: dialog.right,
        scrimLeft: scrim.left,
        scrimRight: scrim.right,
        viewportWidth: innerWidth,
      };
    });
    expect(modalCoverage.dialogLeft).toBeLessThanOrEqual(.5);
    expect(modalCoverage.scrimLeft).toBeLessThanOrEqual(.5);
    expect(Math.abs(
      modalCoverage.viewportWidth - modalCoverage.dialogRight,
    )).toBeLessThanOrEqual(.5);
    expect(Math.abs(
      modalCoverage.viewportWidth - modalCoverage.scrimRight,
    )).toBeLessThanOrEqual(.5);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(root).toHaveAttribute('data-tutor-modal', 'false');
    await expect(launcher).toBeFocused();
  });

  test('all three Nova placements have no serious or critical axe findings', async ({page}) => {
    const cases = [
      {route: '/courses/4/3', viewport: {width: 375, height: 812}, open: true},
      {route: '/courses/4/3?mode=study', viewport: {width: 1920, height: 1080}, open: false},
      {route: '/courses/4/3?mode=classroom', viewport: {width: 1920, height: 1080}, open: true},
    ] as const;

    for (const scenario of cases) {
      await openLesson(page, scenario.viewport, scenario.route);
      if (scenario.open) {
        await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
      }
      const accessibility = await new AxeBuilder({page})
        .include(ROOT)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = accessibility.violations.filter(
        (violation) =>
          violation.impact === 'serious' || violation.impact === 'critical',
      );
      expect(
        blocking,
        `${scenario.route}: ${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([]);
    }
  });

  test('English Final Quiz uses one learner-visible modern presentation on pages 38 and 39', async ({page}) => {
    await openLesson(page, {width: 1920, height: 1080});
    await goToFinalQuizPage(page, 37);

    // FQ1 has no modern counterpart yet. Preserve its fail-closed source-only
    // boundary instead of hiding the sole learner-visible surface.
    await expect(page.locator(
      'canvas[data-course-canvas="course-g04-l03-fq-001"]',
    )).toBeVisible({timeout: 10_000});
    await expect(page.locator('[data-current-js-functional-overlay]'))
      .toHaveCount(0);
    await expect(page.getByText('Modern reconstruction', {exact: true}))
      .toHaveCount(0);

    await page.locator(
      `${BAR} [data-responsive-focus-key="next"]`,
    ).click();
    await expect(page.locator('[data-current-page="38"]')).toBeVisible();
    await expectModernFinalQuizPresentation(
      page,
      'course-g04-l03-fq-002',
    );

    const fq2 = page.locator(
      '[data-final-quiz-animation-id="course-g04-l03-fq-002"]',
    );
    await expect(fq2).toHaveAttribute('data-current-js-sequence-number', '1');
    const fq2Choice = fq2.locator(
      '.course-g04-l03-fq-002-stage-surface '
      + '.course-g04-l03-fq-002-choices button',
    ).first();
    await expect(fq2Choice).toBeEnabled();
    await fq2Choice.click();
    await expect(fq2).toHaveAttribute('data-current-js-sequence-number', '2');
    await expect(fq2).toHaveAttribute('data-current-js-controls-ready', 'true', {
      timeout: 10_000,
    });

    await page.locator(
      `${BAR} [data-responsive-focus-key="next"]`,
    ).click();
    await expect(page.locator('[data-current-page="39"]')).toBeVisible();
    await expectModernFinalQuizPresentation(
      page,
      'course-g04-l03-fq-003',
    );

    const fq3 = page.locator(
      '[data-final-quiz-animation-id="course-g04-l03-fq-003"]',
    );
    await expect(fq3).toHaveAttribute('data-current-js-sequence-number', '1');
    const fq3Choice = fq3.locator(
      '.course-g04-l03-fq-002-stage-surface '
      + '.course-g04-l03-fq-002-choices button',
    ).first();
    await expect(fq3Choice).toBeEnabled();
    await fq3Choice.click();
    await expect(fq3).toHaveAttribute('data-current-js-sequence-number', '2');
    await expect(fq3).toHaveAttribute('data-current-js-controls-ready', 'true', {
      timeout: 10_000,
    });
  });

  test('Spanish Final Quiz remains source-only and does not expose the English modern controls', async ({page}) => {
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/es/courses/4/3',
    );
    await goToFinalQuizPage(page, 37);

    await expect(page.locator('[data-current-js-functional-overlay]'))
      .toHaveCount(0);
    await expect(page.getByText('Modern reconstruction', {exact: true}))
      .toHaveCount(0);

    for (const [globalPage, animationId] of [
      [38, 'course-g04-l03-fq-002'],
      [39, 'course-g04-l03-fq-003'],
    ] as const) {
      await page.locator(
        `${BAR} [data-responsive-focus-key="next"]`,
      ).click();
      await expect(page.locator(`[data-current-page="${globalPage}"]`))
        .toBeVisible();
      const quiz = page.locator(
        `[data-final-quiz-animation-id="${animationId}"]`,
      );
      await expect(quiz).toHaveAttribute(
        'data-current-js-controls-enabled',
        'false',
      );
      await expect(quiz).toHaveAttribute('data-current-js-overlay-count', '0');
      await expect(quiz.locator('[data-current-js-functional-overlay]'))
        .toHaveCount(0);
      const sourceHost = quiz.locator(
        ':scope > [data-source-canvas-accessibility-isolated="false"]',
      );
      await expect(sourceHost).toHaveCount(1);
      await expect(sourceHost).toHaveAttribute(
        'data-source-canvas-visual-exposure',
        'source-only',
      );
      await expect(sourceHost).not.toHaveAttribute('aria-hidden', 'true');
      await expect(sourceHost).not.toHaveAttribute('inert', '');
      await expect(page.getByText('Modern reconstruction', {exact: true}))
        .toHaveCount(0);
    }
  });

  test('the Page 34 Canvas asset loads without a locale-prefixed 404', async ({page}) => {
    await openLesson(page, {width: 1920, height: 1080});
    await goToPage34(page);

    await expect(page.locator('[data-current-page="34"]')).toBeVisible();
    await expect(page.locator('.lesson-shell2__page-heading'))
      .toContainText('Practice Test · 5 of 7');
    await expect(page.getByText('Loading source-static drawing…', {exact: true}))
      .toHaveCount(0);
    await expect(page.getByText(
      'The source-bound composite background failed integrity verification.',
      {exact: true},
    )).toHaveCount(0);
    await expect(page.locator('.lesson-shell2__stage canvas')).toBeVisible();
    await expect(page.locator('.lesson-shell2__stage .reduced-motion-note'))
      .toBeHidden();

    const [planeBox, canvasBox] = await Promise.all([
      page.locator('.lesson-shell2__legacy-stage').boundingBox(),
      page.locator('canvas[data-course-canvas="course-g04-l03-ts-006"]')
        .boundingBox(),
    ]);
    expect(planeBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    const canvasScale = canvasBox!.height / 600;
    const authoredBandTop = canvasBox!.y + 109 * canvasScale;
    const authoredBandBottom = canvasBox!.y + 524 * canvasScale;
    expect(authoredBandTop).toBeGreaterThanOrEqual(planeBox!.y - 1);
    expect(authoredBandBottom)
      .toBeLessThanOrEqual(planeBox!.y + planeBox!.height + 1);
    expect(canvasBox!.x).toBeGreaterThanOrEqual(planeBox!.x - 1);
    expect(canvasBox!.x + canvasBox!.width)
      .toBeLessThanOrEqual(planeBox!.x + planeBox!.width + 1);

    const asset = await page.request.get(
      '/flash-assets/courses/course-g04-l03-ts-006/canvas-renderer.js',
    );
    expect(asset.status()).toBe(200);
    expect(asset.headers()['content-type']).toContain('javascript');
  });
});
