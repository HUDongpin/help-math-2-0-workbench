import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Locator, type Page} from '@playwright/test';
import {fileURLToPath} from 'node:url';

import {
  G4_L3_WHOLE_LESSON_STORAGE_KEY,
} from '../lib/g4-l3-whole-lesson';

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
const PLAYER = '[data-lesson-player="g4-l3-whole-lesson-mvp"]';
const SPINE = '.lesson-shell2__spine';
const BAR = '.lesson-shell2__modern-toolbar';
const NOVA_TEST_IMAGE = fileURLToPath(new URL(
  '../public/brand/help-math-2-logo.png',
  import.meta.url,
));

const SECTIONS = [
  'Introduction', 'Your World', 'Important Words', 'Learn It',
  'Try It', 'Play It', 'Practice Test', 'Final Quiz',
];

const LEARNING_HOME_LOCALES = [
  {
    code: 'en',
    hideSpineLabel: 'Hide lesson section names',
    learningHomeLabel: 'Learning home',
    platformHomeLabel: 'HELP Math home',
    route: '/courses/4/3?mode=focus',
    signInLabel: 'Sign in',
    signUpLabel: 'Create account',
    showSpineLabel: 'Show lesson section names',
    themeDarkLabel: 'Switch to dark theme',
    themeLightLabel: 'Switch to light theme',
  },
  {
    code: 'es',
    hideSpineLabel: 'Ocultar nombres de secciones',
    learningHomeLabel: 'Inicio de aprendizaje',
    platformHomeLabel: 'Inicio de HELP Math',
    route: '/es/courses/4/3?mode=focus',
    signInLabel: 'Iniciar sesión',
    signUpLabel: 'Crear cuenta',
    showSpineLabel: 'Mostrar nombres de secciones',
    themeDarkLabel: 'Cambiar a tema oscuro',
    themeLightLabel: 'Cambiar a tema claro',
  },
] as const;

const LEARNING_HOME_VIEWPORTS = [
  {height: 900, width: 1440},
  {height: 390, width: 844},
  {height: 812, width: 320},
] as const;

test.beforeEach(async ({page}) => {
  await page.route(/^https?:\/\//u, async (route) => {
    const target = new URL(route.request().url());
    if (target.hostname === '127.0.0.1' || target.hostname === 'localhost') {
      await route.continue();
      return;
    }
    await route.abort('blockedbyclient');
  });
  await page.route('**/api/learning-events', async (route) => {
    await route.fulfill({status: 204});
  });
});

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

async function attachTestImageFromPlus(panel: Locator) {
  const attach = panel.getByRole('button', {
    name: 'Attach an image or take a photo',
    exact: true,
  });
  await expect(attach).toBeVisible();
  const attachBox = await attach.boundingBox();
  expect(attachBox).not.toBeNull();
  expect(attachBox!.width).toBeGreaterThanOrEqual(44);
  expect(attachBox!.height).toBeGreaterThanOrEqual(44);
  await expect(panel.locator('.lesson-shell2__nova-camera')).toHaveCount(0);
  await expect(panel.locator('input[type="file"]'))
    .toHaveAttribute('accept', 'image/png,image/jpeg');

  // Drive the hidden native input directly so a Next.js development issue
  // badge cannot mask the product's attachment pipeline. The static contract
  // separately locks the visible + trigger to fileInputRef.current.click().
  await panel.locator('input[type="file"]').setInputFiles(NOVA_TEST_IMAGE);

  await expect(panel).toHaveAttribute(
    'data-tutor-frame-sharing',
    'attached-for-next-request',
  );
  await expect(panel).toContainText('Image attached for the next question');
  await expect(panel.getByRole('button', {
    name: 'Remove the image from the next question',
    exact: true,
  })).toBeVisible();
}

async function openLesson(
  page: Page,
  viewport: Readonly<{width: number; height: number}> = {
    width: 1600,
    height: 1000,
  },
  route = '/courses/4/3',
  initialProgress: unknown = null,
) {
  await page.addInitScript(({progress, storageKey}) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (progress !== null) {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    }
  }, {
    progress: initialProgress,
    storageKey: G4_L3_WHOLE_LESSON_STORAGE_KEY,
  });
  await page.setViewportSize(viewport);
  await page.goto(route, {waitUntil: 'domcontentloaded'});
  await expect(page.locator(ROOT)).toHaveAttribute('data-host-presentation', 'modern-wide');
  await expect(page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]'))
    .toHaveAttribute('data-hydrated', 'true');
  await expect(page.locator('[data-learning-home-nav="directory"]'))
    .toBeVisible();
}

async function expectLearningHomeLayout(
  page: Page,
  expectedLabel: string,
) {
  const learningHome = page.locator(
    '[data-learning-home-nav="directory"] [data-lesson-nav="learning-home"]',
  );
  const learningHomeText = learningHome.locator(
    ':scope > span:not(.lesson-shell2__learning-home-emoji)',
  );
  const spine = page.locator(SPINE);
  const spineHeader = spine.locator('.lesson-shell2__spine-header');

  await expect(learningHome).toBeVisible();
  await expect(learningHome).toHaveAccessibleName(expectedLabel);
  await expect(learningHomeText).toHaveText(expectedLabel);
  await expect(spine).toBeVisible();

  const [homeBox, spineBox, headerBox, spineState, metrics] = await Promise.all([
    learningHome.boundingBox(),
    spine.boundingBox(),
    spineHeader.boundingBox(),
    spine.getAttribute('data-spine-state'),
    learningHomeText.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const elementBox = element.getBoundingClientRect();
      const textBox = range.getBoundingClientRect();
      return {
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        elementBox: {
          bottom: elementBox.bottom,
          left: elementBox.left,
          right: elementBox.right,
          top: elementBox.top,
        },
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        textBox: {
          bottom: textBox.bottom,
          left: textBox.left,
          right: textBox.right,
          top: textBox.top,
        },
        textContent: element.textContent?.trim() ?? '',
        viewportWidth: document.documentElement.clientWidth,
      };
    }),
  ]);
  expect(homeBox).not.toBeNull();
  expect(spineBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(homeBox!.width).toBeGreaterThanOrEqual(44);
  expect(homeBox!.height).toBeGreaterThanOrEqual(44);
  expect(homeBox!.x).toBeGreaterThanOrEqual(spineBox!.x - 1);
  expect(homeBox!.x + homeBox!.width)
    .toBeLessThanOrEqual(spineBox!.x + spineBox!.width + 1);
  expect(homeBox!.y).toBeGreaterThanOrEqual(spineBox!.y - 1);
  expect(homeBox!.y + homeBox!.height)
    .toBeLessThanOrEqual(headerBox!.y + 1);

  expect(metrics.textContent).toBe(expectedLabel);
  expect(metrics.fontSize).toBeGreaterThanOrEqual(14);
  if (spineState === 'expanded') {
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
    expect(metrics.textBox.left).toBeGreaterThanOrEqual(metrics.elementBox.left - 2);
    expect(metrics.textBox.right).toBeLessThanOrEqual(metrics.elementBox.right + 2);
    expect(metrics.textBox.top).toBeGreaterThanOrEqual(metrics.elementBox.top - 2);
    expect(metrics.textBox.bottom).toBeLessThanOrEqual(metrics.elementBox.bottom + 2);
  }
  expect(homeBox!.x).toBeGreaterThanOrEqual(-1);
  expect(homeBox!.x + homeBox!.width).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function expectLessonPlatformHeader(
  page: Page,
  locale: (typeof LEARNING_HOME_LOCALES)[number],
) {
  const header = page.locator('[data-lesson-platform-header="true"]');
  const spine = page.locator(SPINE);
  const home = header.getByRole('link', {
    exact: true,
    name: locale.platformHomeLabel,
  });
  const theme = header.getByRole('button', {
    exact: true,
    name: new RegExp(
      `^(?:${locale.themeDarkLabel}|${locale.themeLightLabel})$`,
      'u',
    ),
  });

  await expect(header).toBeVisible();
  await expect(page.locator('.lesson-shell2__learning-nav-context'))
    .toHaveCount(0);
  await expect(header.getByText('Negative Numbers', {exact: true}))
    .toHaveCount(0);
  await expect(home).toBeVisible();
  await expect(header.locator('.lesson-shell2__audience-switch')).toHaveCount(0);
  await expect(theme).toBeVisible();

  const logo = home.locator('img');
  const logoSource = await logo.getAttribute('src');
  expect(logoSource).not.toBeNull();
  expect(decodeURIComponent(logoSource!)).toContain('/brand/help-math-2-logo.png');
  expect(await logo.evaluate((image) => {
    const element = image as HTMLImageElement;
    return element.complete && element.naturalWidth === element.naturalHeight &&
      element.naturalWidth > 0;
  })).toBe(true);

  const authStatus = await header.getAttribute('data-auth-status');
  let minimumVisibleHeaderItems = 2;
  if (authStatus === 'signed-out') {
    minimumVisibleHeaderItems = 4;
    await expect(header.getByRole('link', {
      exact: true,
      name: locale.signInLabel,
    })).toBeVisible();
    await expect(header.getByRole('link', {
      exact: true,
      name: locale.signUpLabel,
    })).toBeVisible();
  } else if (authStatus === 'signed-in') {
    minimumVisibleHeaderItems = 3;
    await expect(header.locator('[data-responsive-focus-key="account"]'))
      .toBeVisible();
    await expect(header.getByRole('link', {name: locale.signInLabel}))
      .toHaveCount(0);
  } else {
    expect(authStatus).toBe('disabled');
    await expect(header.locator('.lesson-shell2__account-actions'))
      .toHaveCount(0);
  }

  const geometry = await header.locator(
    '[data-responsive-focus-key]',
  ).evaluateAll((elements) => {
    const visible = elements.flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0
        ? [{
            centerX: box.left + box.width / 2,
            centerY: box.top + box.height / 2,
            height: box.height,
            key: element.getAttribute('data-responsive-focus-key') ?? '',
            left: box.left,
            right: box.right,
            width: box.width,
          }]
        : [];
    });
    const visualOrder = [...visible].sort((a, b) =>
      Math.abs(a.centerY - b.centerY) <= 4
        ? a.centerX - b.centerX
        : a.centerY - b.centerY,
    );
    return {
      documentWidth: document.documentElement.scrollWidth,
      domOrder: visible.map((item) => item.key),
      items: visible,
      viewportWidth: document.documentElement.clientWidth,
      visualOrder: visualOrder.map((item) => item.key),
    };
  });
  expect(geometry.items.length).toBeGreaterThanOrEqual(
    minimumVisibleHeaderItems,
  );
  for (const item of geometry.items) {
    expect(item.width, `${item.key} width`).toBeGreaterThanOrEqual(44);
    expect(item.height, `${item.key} height`).toBeGreaterThanOrEqual(44);
    expect(item.left, `${item.key} left edge`).toBeGreaterThanOrEqual(-1);
    expect(item.right, `${item.key} right edge`)
      .toBeLessThanOrEqual(geometry.viewportWidth + 1);
  }
  expect(geometry.visualOrder).toEqual(geometry.domOrder);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);

  const [headerBox, spineBox] = await Promise.all([
    header.boundingBox(),
    spine.boundingBox(),
  ]);
  expect(headerBox).not.toBeNull();
  expect(spineBox).not.toBeNull();
  expect(headerBox!.y + headerBox!.height)
    .toBeLessThanOrEqual(spineBox!.y + 1);
}

async function readPersistedLessonProgress(page: Page) {
  return page.evaluate((key) => {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    const parsed = JSON.parse(value) as {
      completedAnimationIds?: string[];
      currentAnimationId?: string;
      replayCounts?: Record<string, number>;
      visitedAnimationIds?: string[];
    };
    return {
      completedAnimationIds: parsed.completedAnimationIds,
      currentAnimationId: parsed.currentAnimationId,
      replayCounts: parsed.replayCounts,
      visitedAnimationIds: parsed.visitedAnimationIds,
    };
  }, G4_L3_WHOLE_LESSON_STORAGE_KEY);
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

  for (const locale of LEARNING_HOME_LOCALES) {
    for (const viewport of LEARNING_HOME_VIEWPORTS) {
      test(`${locale.code} Learning home sits above the directory at ${viewport.width}px`, async ({page}) => {
        await openLesson(page, viewport, locale.route);
        const root = page.locator(ROOT);
        const spine = page.locator(SPINE);

        await expect(root).toHaveAttribute('data-spine-collapsed', 'false');
        await expect(spine).toHaveAttribute('data-spine-state', 'expanded');
        await expectLessonPlatformHeader(page, locale);
        await expectLearningHomeLayout(page, locale.learningHomeLabel);
        const visibleSpineFontSizes = await spine.locator(
          '.lesson-shell2__spine-mark, .lesson-shell2__spine-name, .lesson-shell2__spine-calculator-label',
        ).evaluateAll((elements) => elements.flatMap((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0
            ? [Number.parseFloat(getComputedStyle(element).fontSize)]
            : [];
        }));
        expect(visibleSpineFontSizes.length).toBeGreaterThan(0);
        for (const size of visibleSpineFontSizes) {
          expect(size).toBeGreaterThanOrEqual(13);
        }
        if (viewport.width <= 680) {
          const compactCopyFontSizes = await page.locator(
            '.lesson-shell2__page-heading p, '
            + '.lesson-shell2__modern-toolbar > [data-responsive-focus-key="help"], '
            + '.lesson-shell2__modern-toolbar > [data-responsive-focus-key="exit"], '
            + '.lesson-shell2__modern-toolbar > [data-responsive-focus-key="language-en"], '
            + '.lesson-shell2__modern-toolbar > [data-responsive-focus-key="language-es"], '
            + '.lesson-shell2__modern-toolbar > [data-responsive-focus-key="key-terms"]',
          ).evaluateAll((elements) => elements.flatMap((element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0
              ? [Number.parseFloat(getComputedStyle(element).fontSize)]
              : [];
          }));
          expect(compactCopyFontSizes.length).toBeGreaterThan(0);
          for (const size of compactCopyFontSizes) {
            expect(size).toBeGreaterThanOrEqual(13);
          }
        }

        const hideToggle = spine.getByRole('button', {
          exact: true,
          name: locale.hideSpineLabel,
        });
        if (viewport.width > 680) {
          await expect(hideToggle).toBeVisible();
          await hideToggle.click();
          await expect(root).toHaveAttribute('data-spine-collapsed', 'true');
          await expect(spine).toHaveAttribute('data-spine-state', 'collapsed');
          await expectLearningHomeLayout(page, locale.learningHomeLabel);

          const showToggle = spine.getByRole('button', {
            exact: true,
            name: locale.showSpineLabel,
          });
          await expect(showToggle).toBeVisible();
          await showToggle.click();
          await expect(root).toHaveAttribute('data-spine-collapsed', 'false');
          await expect(spine).toHaveAttribute('data-spine-state', 'expanded');
          await expectLearningHomeLayout(page, locale.learningHomeLabel);
        } else {
          await expect(hideToggle).toBeHidden();
        }
      });
    }
  }

  test('Lesson theme changes real chrome, persists on reload, and is dark before first paint', async ({page}) => {
    const themeKey = 'helpmath:learning-workspace-theme:v1';
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.evaluate((key) => window.localStorage.setItem(key, 'dark'), themeKey);
    await page.addInitScript(() => {
      (window as Window & {
        __lessonThemeFirstPaint?: Readonly<{
          colorScheme: string;
          documentTheme: string;
          headerBackground: string;
        }>;
      }).__lessonThemeFirstPaint = undefined;
      let captureScheduled = false;
      const observer = new MutationObserver(() => {
        const root = document.querySelector<HTMLElement>('main.lesson-shell2');
        const header = document.querySelector<HTMLElement>(
          '[data-lesson-platform-header="true"]',
        );
        if (!root || !header || captureScheduled) return;
        captureScheduled = true;
        // The external bootstrap is render-blocking. Its contract is the first
        // paint, not the earlier parser-time DOM insertion observed above.
        requestAnimationFrame(() => {
          (window as Window & {
            __lessonThemeFirstPaint?: Readonly<{
              colorScheme: string;
              documentTheme: string;
              headerBackground: string;
            }>;
          }).__lessonThemeFirstPaint = {
            colorScheme: getComputedStyle(root).colorScheme,
            documentTheme:
              document.documentElement.dataset.learningPlatformTheme ?? '',
            headerBackground: getComputedStyle(header).backgroundColor,
          };
          observer.disconnect();
        });
      });
      observer.observe(document, {childList: true, subtree: true});
    });

    await page.goto('/courses/4/3?mode=focus', {waitUntil: 'domcontentloaded'});
    const root = page.locator(ROOT);
    const header = page.locator('[data-lesson-platform-header="true"]');
    await expect(root).toHaveAttribute('data-theme', 'dark');
    const firstPaint = await page.evaluate(() =>
      (window as Window & {
        __lessonThemeFirstPaint?: Readonly<{
          colorScheme: string;
          documentTheme: string;
          headerBackground: string;
        }>;
      }).__lessonThemeFirstPaint,
    );
    expect(firstPaint?.documentTheme).toBe('dark');
    expect(firstPaint?.colorScheme).toContain('dark');
    expect(firstPaint?.headerBackground).not.toBe('rgba(0, 0, 0, 0)');

    const darkThemeButton = header.getByRole('button', {
      exact: true,
      name: 'Switch to light theme',
    });
    const darkSurface = await header.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    await darkThemeButton.click();
    await expect(root).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate((key) => window.localStorage.getItem(key), themeKey))
      .toBe('light');
    const lightSurface = await header.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    expect(lightSurface).not.toEqual(darkSurface);

    await header.getByRole('button', {
      exact: true,
      name: 'Switch to dark theme',
    }).click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await page.reload({waitUntil: 'domcontentloaded'});
    await expect(page.locator(ROOT)).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-lesson-platform-header="true"]')
      .getByRole('button', {exact: true, name: 'Switch to light theme'}))
      .toBeVisible();
  });

  test('Lesson platform header reflows at 200% text without covering the lesson', async ({page}) => {
    const locale = LEARNING_HOME_LOCALES[0];
    await openLesson(page, {width: 720, height: 700}, locale.route);
    await page.locator('html').evaluate((element) => {
      element.style.fontSize = '200%';
    });
    await expect.poll(async () => page.locator(
      '[data-lesson-platform-header="true"]',
    ).evaluate((element) => Math.ceil(element.getBoundingClientRect().height)))
      .toBeGreaterThan(128);
    await expectLessonPlatformHeader(page, locale);
  });

  test('Lesson header omits workspace role controls while Learning Home retains them', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/courses/4/3?mode=focus', {waitUntil: 'domcontentloaded'});
    const header = page.locator('[data-lesson-platform-header="true"]');
    await expect(header.locator('.lesson-shell2__audience-switch')).toHaveCount(0);
    await header.getByRole('link', {exact: true, name: 'HELP Math home'}).click();
    await expect(page).toHaveURL(/\/$/u);
    await expect(page.locator('[data-learning-platform-home]'))
      .toHaveAttribute('data-role-preview', 'student');
    await expect(page.getByRole('group', {name: 'Learning workspace role'}))
      .toBeVisible();
  });

  test('legacy mode URLs all render the same Focus lesson without changing progress', async ({page}) => {
    await page.setViewportSize({width: 1920, height: 1080});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    const seededProgress = {
      schemaVersion: 1,
      currentAnimationId: 'course-g04-l03-ir-001-341242cc',
      language: 'en',
      visitedAnimationIds: ['course-g04-l03-ir-001-341242cc'],
      completedAnimationIds: ['course-g04-l03-ir-001-341242cc'],
      replayCounts: {'course-g04-l03-ir-001-341242cc': 2},
    } as const;
    await page.evaluate(({key, value}) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    }, {
      key: G4_L3_WHOLE_LESSON_STORAGE_KEY,
      value: seededProgress,
    });

    const expectedProgress = {
      completedAnimationIds: [...seededProgress.completedAnimationIds],
      currentAnimationId: seededProgress.currentAnimationId,
      replayCounts: {...seededProgress.replayCounts},
      visitedAnimationIds: [...seededProgress.visitedAnimationIds],
    };
    const routes = [
      '/courses/4/3?mode=focus',
      '/courses/4/3?mode=study',
      '/courses/4/3?mode=classroom',
      '/es/courses/4/3?mode=study',
      '/es/courses/4/3?mode=classroom',
    ] as const;

    for (const route of routes) {
      await page.goto(route, {waitUntil: 'domcontentloaded'});
      const root = page.locator(ROOT);
      await expect(root).toHaveAttribute('data-host-presentation', 'modern-wide');
      await expect(page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]'))
        .toHaveAttribute('data-hydrated', 'true');
      const resumeChoice = page.locator('[data-resume-choice="continue"]:visible');
      if (await resumeChoice.count()) await resumeChoice.click();

      const currentUrl = new URL(page.url());
      expect(`${currentUrl.pathname}${currentUrl.search}`).toBe(route);
      await expect(root).toHaveAttribute('data-tutor-mode', 'focus');
      await expect(root).toHaveAttribute(
        'data-tutor-placement',
        'focus-side-column',
      );
      await expect(page.locator('.lesson-shell2__learning-nav'))
        .toHaveAttribute('data-mode-switch-available', 'false');
      await expect(page.locator('.lesson-shell2__mode-switch')).toHaveCount(0);
      await expect(page.getByRole('group', {
        name: /Learning mode|Modo de aprendizaje/u,
      })).toHaveCount(0);
      await expect(page.locator('.lesson-shell2__nova-classroom-band'))
        .toHaveCount(0);
      await expect(page.locator('[data-current-page="1"]')).toBeVisible();
      const platformHeader = page.locator('[data-lesson-platform-header="true"]');
      await expect(platformHeader).toBeVisible();
      await expect(page.locator('.lesson-shell2__learning-nav-context'))
        .toHaveCount(0);
      await expect(platformHeader.getByText('Negative Numbers', {exact: true}))
        .toHaveCount(0);

      const spanishRoute = route.startsWith('/es/');
      await expect(page.locator('[data-modern-language-switch="true"]'))
        .toHaveAttribute(
          'href',
          spanishRoute
            ? '/courses/4/3?mode=focus'
            : '/es/courses/4/3?mode=focus',
        );
      expect(await readPersistedLessonProgress(page)).toEqual(expectedProgress);
    }
  });

  test('Exit and Learning home return to the locale home without clearing progress', async ({page}) => {
    await page.setViewportSize({width: 844, height: 390});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.evaluate(({key, value}) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    }, {
      key: G4_L3_WHOLE_LESSON_STORAGE_KEY,
      value: {
        schemaVersion: 1,
        currentAnimationId: 'course-g04-l03-in-002',
        language: 'en',
        visitedAnimationIds: [
          'course-g04-l03-ir-001-341242cc',
          'course-g04-l03-in-002',
        ],
        completedAnimationIds: ['course-g04-l03-ir-001-341242cc'],
        replayCounts: {'course-g04-l03-ir-001-341242cc': 2},
      },
    });

    const resume = async (
      targetPage: Page,
      label: string,
      expectedPage = 13,
    ) => {
      await expect(targetPage.locator(
        '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
      )).toHaveAttribute('data-hydrated', 'true');
      await targetPage.locator('[data-resume-choice="continue"]:visible').click();
      await expect(targetPage.locator(
        `[data-current-page="${expectedPage}"]`,
      )).toBeVisible();
      await expect(targetPage.locator(
        '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
      )).toHaveAttribute(
        'data-resume-decision',
        'resolved',
      );
      expect(await readPersistedLessonProgress(targetPage), label).not.toBeNull();
    };

    await page.goto('/courses/4/3?mode=focus', {waitUntil: 'domcontentloaded'});
    await resume(page, 'the seeded English course should resume');
    await page.locator(`${BAR} [data-responsive-focus-key="next"]`).click();
    await expect(page.locator('[data-current-page="14"]')).toBeVisible();
    const preserved = await readPersistedLessonProgress(page);
    expect(preserved?.currentAnimationId).toBe('course-g04-l03-in-003');
    expect(preserved?.visitedAnimationIds).toContain('course-g04-l03-in-003');
    expect(preserved?.completedAnimationIds).toContain(
      'course-g04-l03-ir-001-341242cc',
    );
    expect(preserved!.completedAnimationIds!.length).toBeGreaterThan(0);
    expect(preserved?.replayCounts).toEqual({
      'course-g04-l03-ir-001-341242cc': 2,
    });

    const learningHome = page.locator(
      '[data-learning-home-nav="directory"] [data-lesson-nav="learning-home"]',
    );
    await expect(learningHome).toHaveAttribute('href', '/');
    await learningHome.click();
    await expect(page).toHaveURL(/\/$/u);
    expect(await readPersistedLessonProgress(page)).toEqual(preserved);
    await page.getByRole('link', {
      name: 'Continue my lesson',
      exact: true,
    }).click();
    await resume(page, 'persistent Learning home should preserve progress', 14);
    expect(await readPersistedLessonProgress(page)).toEqual(preserved);

    await page.locator(
      '[data-exit-trigger="modern-accessible-control"]:visible',
    ).click();
    await expect(page.getByRole('dialog', {name: 'Confirm lesson exit'}))
      .toBeVisible();
    await page.locator('[data-exit-choice="exit"]:visible').click();
    await expect(page).toHaveURL(/\/$/u);
    expect(await readPersistedLessonProgress(page)).toEqual(preserved);

    await page.getByRole('link', {
      name: 'Continue my lesson',
      exact: true,
    }).click();
    await resume(page, 'Exit should preserve progress on re-entry', 14);
    await page.goto('/es/courses/4/3?mode=focus', {
      waitUntil: 'domcontentloaded',
    });
    await resume(page, 'the Spanish course should resume the same position', 14);
    const spanishPreserved = await readPersistedLessonProgress(page);
    expect(spanishPreserved).toEqual(preserved);
    const spanishLearningHome = page.locator(
      '[data-learning-home-nav="directory"] [data-lesson-nav="learning-home"]',
    );
    await expect(spanishLearningHome).toHaveAttribute('href', '/es');
    await spanishLearningHome.click();
    await expect(page).toHaveURL(/\/es$/u);
    expect(await readPersistedLessonProgress(page)).toEqual(preserved);
    await page.getByRole('link', {
      name: 'Continuar mi lección',
      exact: true,
    }).click();
    await resume(page, 'Spanish Learning home should preserve progress', 14);

    await page.locator(
      '[data-exit-trigger="modern-accessible-control"]:visible',
    ).click();
    await page.getByRole('button', {name: 'Sí, salir', exact: true}).click();
    await expect(page).toHaveURL(/\/es$/u);
    expect(await readPersistedLessonProgress(page)).toEqual(preserved);

    await page.getByRole('link', {
      name: 'Continuar mi lección',
      exact: true,
    }).click();
    await resume(page, 'Spanish Exit should preserve progress on re-entry', 14);
    expect(await readPersistedLessonProgress(page)).toEqual(preserved);
  });

  test('the section spine collapses and restores without changing progress or mobile layout', async ({page}) => {
    test.setTimeout(60_000);
    const runtimeErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await openLesson(page, {width: 1920, height: 1080});

    const root = page.locator(ROOT);
    const spine = page.locator(SPINE);
    const body = page.locator('.lesson-shell2__body');
    const progress = page.locator(
      `${BAR} input[data-progress-model="interactive-section-position"]`,
    );
    const learningHome = page.locator('[data-lesson-nav="learning-home"]');
    const spineHeader = spine.locator('.lesson-shell2__spine-header');
    const expectLearningHomeAboveDirectory = async () => {
      const [homeBox, spineBox, headerBox] = await Promise.all([
        learningHome.boundingBox(),
        spine.boundingBox(),
        spineHeader.boundingBox(),
      ]);
      expect(homeBox).not.toBeNull();
      expect(spineBox).not.toBeNull();
      expect(headerBox).not.toBeNull();
      expect(homeBox!.x).toBeGreaterThanOrEqual(spineBox!.x - 1);
      expect(homeBox!.x + homeBox!.width)
        .toBeLessThanOrEqual(spineBox!.x + spineBox!.width + 1);
      expect(homeBox!.y + homeBox!.height)
        .toBeLessThanOrEqual(headerBox!.y + 1);
    };
    const pause = page.locator(`${BAR} [data-responsive-focus-key="pause"]`);
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    const persistedBefore = await readPersistedLessonProgress(page);
    expect(persistedBefore).not.toBeNull();
    const progressValue = await progress.getAttribute('value');
    expect(progressValue).not.toBeNull();

    await expect(root).toHaveAttribute('data-spine-collapsed', 'false');
    await expect(spine).toHaveAttribute('data-spine-state', 'expanded');
    const hideToggle = spine.getByRole('button', {
      name: 'Hide lesson section names',
      exact: true,
    });
    await expect(hideToggle).toHaveAttribute('aria-expanded', 'true');
    const toggleBox = await hideToggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
    await expect(spine.getByRole('button', {
      name: 'Learn It',
      exact: true,
    })).toBeVisible();
    await expectLearningHomeAboveDirectory();

    await hideToggle.focus();
    await page.keyboard.press('Enter');
    await expect(root).toHaveAttribute('data-spine-collapsed', 'true');
    await expect(spine).toHaveAttribute('data-spine-state', 'collapsed');
    const showToggle = spine.getByRole('button', {
      name: 'Show lesson section names',
      exact: true,
    });
    await expect(showToggle).toBeFocused();
    await expect(showToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(spine.getByRole('button', {
      name: 'Learn It',
      exact: true,
    })).toHaveAttribute('title', 'Learn It');
    await expect.poll(() => body.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).gridTemplateColumns),
    )).toBeCloseTo(92, 0);

    const desktopCollapsed = await body.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(desktopCollapsed.columns).toHaveLength(2);
    expect(Number.parseFloat(desktopCollapsed.columns[0]!)).toBeCloseTo(92, 0);
    expect(desktopCollapsed.documentWidth)
      .toBeLessThanOrEqual(desktopCollapsed.viewportWidth + 1);
    await expectLearningHomeAboveDirectory();
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute('value', progressValue!);
    expect(await readPersistedLessonProgress(page)).toEqual(persistedBefore);

    const novaLauncher = page.getByRole('button', {
      name: 'Ask Nova',
      exact: true,
    });
    await novaLauncher.click();
    await expect(root).toHaveAttribute('data-tutor-open', 'true');
    await expect.poll(() => body.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u).length,
    )).toBe(3);
    const desktopWithNova = await body.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u));
    expect(desktopWithNova).toHaveLength(3);
    expect(Number.parseFloat(desktopWithNova[0]!)).toBeCloseTo(92, 0);
    await novaLauncher.click();
    await expect(root).toHaveAttribute('data-tutor-open', 'false');

    await showToggle.click();
    await expect(root).toHaveAttribute('data-spine-collapsed', 'false');
    await expect(spine).toHaveAttribute('data-spine-state', 'expanded');
    await expect(hideToggle).toBeFocused();
    expect(await readPersistedLessonProgress(page)).toEqual(persistedBefore);

    await page.setViewportSize({width: 844, height: 390});
    await hideToggle.click();
    await expect(root).toHaveAttribute('data-spine-collapsed', 'true');
    await expectLearningHomeAboveDirectory();
    await novaLauncher.click();
    const compactWithNova = await body.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(compactWithNova.columns).toHaveLength(2);
    expect(compactWithNova.documentWidth)
      .toBeLessThanOrEqual(compactWithNova.viewportWidth + 1);
    await page.getByRole('button', {name: 'Close Nova', exact: true}).click();
    await expect(root).toHaveAttribute('data-tutor-open', 'false');
    expect(await readPersistedLessonProgress(page)).toEqual(persistedBefore);

    await page.setViewportSize({width: 375, height: 812});
    await expect(spine.locator('.lesson-shell2__spine-toggle')).toBeHidden();
    await expect(spine.locator('.lesson-shell2__spine-name').first())
      .toBeVisible();
    const mobileLayout = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>('.lesson-shell2__body')!;
      const list = document.querySelector<HTMLElement>('.lesson-shell2__spine ol')!;
      return {
        bodyColumns: getComputedStyle(body).gridTemplateColumns
          .trim().split(/\s+/u),
        documentWidth: document.documentElement.scrollWidth,
        listDirection: getComputedStyle(list).flexDirection,
        listOverflow: getComputedStyle(list).overflowX,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(mobileLayout.bodyColumns).toHaveLength(1);
    expect(mobileLayout.listDirection).toBe('row');
    expect(mobileLayout.listOverflow).toBe('auto');
    expect(mobileLayout.documentWidth)
      .toBeLessThanOrEqual(mobileLayout.viewportWidth + 1);
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute('value', progressValue!);
    expect(await readPersistedLessonProgress(page)).toEqual(persistedBefore);

    await page.setViewportSize({width: 844, height: 390});
    await expect(showToggle).toBeVisible();
    await showToggle.click();
    await expect(root).toHaveAttribute('data-spine-collapsed', 'false');
    await expect(hideToggle).toBeFocused();
    expect(runtimeErrors).toEqual([]);
    expect(await readPersistedLessonProgress(page)).toEqual(persistedBefore);
  });

  test('a descriptor lesson treats a legacy Classroom URL as fixed Focus', async ({page}) => {
    await page.setViewportSize({width: 844, height: 390});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    const response = await page.goto('/courses/5/4?mode=classroom', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(200);
    await expect(page.locator(
      '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
    )).toHaveAttribute('data-hydrated', 'true');
    const root = page.locator(ROOT);
    await expect(root).toHaveAttribute('data-tutor-mode', 'focus');
    await expect(root).toHaveAttribute(
      'data-tutor-placement',
      'focus-side-column',
    );
    await expect(page.getByRole('button', {name: 'Ask Nova', exact: true}))
      .toBeVisible();
    await expect(page.locator('.lesson-shell2__learning-nav'))
      .toHaveAttribute('data-mode-switch-available', 'false');
    await expect(page.locator('.lesson-shell2__mode-switch')).toHaveCount(0);
    await expect(page.getByRole('group', {name: 'Learning mode'})).toHaveCount(0);

    const storageKey = 'helpmath:g5-l4:whole-lesson-audit:v1';
    const readProgress = (targetPage: Page) => targetPage.evaluate((key) => {
      const serialized = window.localStorage.getItem(key);
      if (!serialized) return null;
      const parsed = JSON.parse(serialized) as {
        currentAnimationId?: string;
        replayCounts?: Record<string, number>;
        reviewedAnimationIds?: string[];
        visitedAnimationIds?: string[];
      };
      return {
        currentAnimationId: parsed.currentAnimationId,
        replayCounts: parsed.replayCounts,
        reviewedAnimationIds: parsed.reviewedAnimationIds,
        visitedAnimationIds: parsed.visitedAnimationIds,
      };
    }, storageKey);
    const previousControl = (targetPage: Page) => targetPage.locator(
      '[data-lesson-nav="action-previous"]:visible',
    );

    await page.locator('[data-lesson-nav="action-next"]:visible').click();
    await expect(page.locator('[data-current-page="2"]')).toBeVisible();
    await expect(previousControl(page)).toBeVisible();
    await previousControl(page).click();
    await expect(page.locator('[data-current-page="1"]')).toBeVisible();
    await page.locator('[data-lesson-nav="action-next"]:visible').click();
    await expect(page.locator('[data-current-page="2"]')).toBeVisible();
    const progressed = await readProgress(page);
    expect(progressed?.visitedAnimationIds?.length).toBeGreaterThanOrEqual(2);

    const descriptorHome = page.locator(
      '[data-lesson-platform-header="true"] '
      + '[data-responsive-focus-key="platform-home"]',
    );
    await expect(descriptorHome).toHaveAttribute('href', '/');
    await descriptorHome.click();
    await expect(page).toHaveURL(/\/$/u);
    expect(await readProgress(page)).toEqual(progressed);

    await page.goto('/courses/5/4?mode=classroom', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator(
      '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
    )).toHaveAttribute('data-hydrated', 'true');
    await expect(page.locator('[data-current-page="2"]')).toBeVisible();
    const reopened = await readProgress(page);
    expect(reopened?.currentAnimationId).toBe(progressed?.currentAnimationId);
    expect(reopened?.replayCounts).toEqual(progressed?.replayCounts);
    for (const animationId of progressed?.visitedAnimationIds ?? []) {
      expect(reopened?.visitedAnimationIds).toContain(animationId);
    }
    for (const animationId of progressed?.reviewedAnimationIds ?? []) {
      expect(reopened?.reviewedAnimationIds).toContain(animationId);
    }

    await page.locator(
      '[data-exit-trigger="modern-accessible-control"]:visible',
    ).click();
    await page.locator('[data-exit-choice="exit"]:visible').click();
    await expect(page).toHaveURL(/\/$/u);
    const afterExit = await readProgress(page);
    expect(afterExit?.currentAnimationId).toBe(progressed?.currentAnimationId);
    expect(afterExit?.replayCounts).toEqual(progressed?.replayCounts);
    for (const animationId of progressed?.visitedAnimationIds ?? []) {
      expect(afterExit?.visitedAnimationIds).toContain(animationId);
    }

    await page.goto('/courses/5/4?mode=classroom', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator(
      '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
    )).toHaveAttribute('data-hydrated', 'true');
    const reopenedHome = page.locator(
      '[data-lesson-platform-header="true"] '
      + '[data-responsive-focus-key="platform-home"]',
    );
    await expect(reopenedHome).toBeVisible();
    await reopenedHome.click();
    await expect(page).toHaveURL(/\/$/u);

    const fallbackPage = await page.context().newPage();
    await fallbackPage.route('**/api/learning-events', async (route) => {
      await route.fulfill({status: 204});
    });
    await fallbackPage.setViewportSize({width: 844, height: 390});
    const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
    const port = Number(process.env.PLAYWRIGHT_PORT ?? 3211);
    const fallbackUrl = `http://${host}:${port}/es/courses/5/4?mode=classroom`;
    await fallbackPage.evaluate((url) => {
      window.location.replace(url);
    }, fallbackUrl).catch(() => undefined);
    await fallbackPage.waitForURL(/\/es\/courses\/5\/4\?mode=classroom$/u);
    expect(await fallbackPage.evaluate(() => window.history.length)).toBe(1);
    await expect(fallbackPage.locator(
      '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
    )).toHaveAttribute('data-hydrated', 'true');
    const spanishHome = fallbackPage.locator(
      '[data-lesson-platform-header="true"] '
      + '[data-responsive-focus-key="platform-home"]',
    );
    await expect(spanishHome).toBeVisible();
    await spanishHome.click();
    await expect(fallbackPage).toHaveURL(/\/es$/u);
    await fallbackPage.close();
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

  test('the playback surface exposes one current-Tab progress control', async ({page}) => {
    await openLesson(page);
    await expect(page.locator('.lesson-shell2__session-bar')).toBeHidden();
    const completion = page.locator(`${BAR} .lesson-shell2__modern-completion`);
    await expect(completion).toBeVisible();
    await expect(completion).toHaveAttribute('data-progress-scope', 'section');

    const removedLessonPosition = page.locator(
      'input[data-progress-model="interactive-page-position"]:visible',
    );
    const sectionPosition = page.locator(
      'input[data-progress-model="interactive-section-position"]:visible',
    );
    await expect(removedLessonPosition).toHaveCount(0);
    await expect(sectionPosition).toHaveCount(1);
    await expect(sectionPosition).toHaveAttribute('data-responsive-focus-key', 'section-scrubber');
    await expect(page.locator('.lesson-shell2__section-scrubber')).toHaveCount(0);
    expect((await completion.innerText()).trim()).toBe('');
    await expect(page.locator(
      '[data-progress-model="current-page-animation-playhead"]',
    )).toHaveCount(0);
    await expect(page.getByText('Page animation', {exact: true})).toHaveCount(0);
    await expect(page.locator(
      'progress[data-progress-model="earned-page-completion"]:visible',
    )).toHaveCount(0);
  });

  test('the speaker opens a vertical Volume control and mute restores the last level', async ({page}) => {
    await openLesson(page, {width: 1440, height: 900});
    await goToPage14(page);

    const root = page.locator(ROOT);
    const runtime = page.locator('.runtime-shell');
    const trigger = page.locator('.lesson-shell2__volume-trigger');
    const popover = page.locator('.lesson-shell2__volume-popover');
    const volume = popover.getByRole('slider', {name: 'Volume', exact: true});
    await expect(root).toHaveAttribute('data-audio-available', 'true');
    await expect(page.locator('.lesson-shell2__modern-volume')).toHaveCount(0);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAccessibleName('Adjust volume, 80 percent');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(volume).toBeHidden();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popover).toBeVisible();
    await expect(volume).toBeVisible();
    await expect(volume).toBeEnabled();
    await expect(volume).toHaveAttribute('aria-orientation', 'vertical');
    await expect(volume).toBeFocused();
    const volumeBox = await volume.boundingBox();
    expect(volumeBox).not.toBeNull();
    expect(volumeBox!.height).toBeGreaterThanOrEqual(255);

    await volume.focus();
    await page.keyboard.press('Home');
    await expect(volume).toHaveValue('0');
    await expect(volume).toHaveAttribute('aria-valuetext', '0 percent');
    await expect(runtime).toHaveAttribute('data-runtime-volume', '0');

    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('ArrowUp');
    }
    await expect(volume).toHaveValue('0.4');
    await expect(volume).toHaveAttribute('aria-valuetext', '40 percent');
    await expect(runtime).toHaveAttribute('data-runtime-volume', '0.4');

    const mute = popover.getByRole('button', {name: 'Mute', exact: true});
    await mute.click();
    await expect(volume).toHaveValue('0');
    await expect(runtime).toHaveAttribute('data-runtime-volume', '0');
    const restore = popover.getByRole('button', {
      name: 'Restore volume',
      exact: true,
    });
    await expect(restore).toHaveAttribute('aria-pressed', 'true');
    await restore.click();
    await expect(volume).toHaveValue('0.4');
    await expect(runtime).toHaveAttribute('data-runtime-volume', '0.4');
    await expect(popover.getByRole('button', {
      name: 'Mute',
      exact: true,
    })).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await page.setViewportSize({width: 375, height: 812});
    await trigger.click();
    await expect(volume).toBeVisible();
    const mobileVolume = await volume.boundingBox();
    expect(mobileVolume).not.toBeNull();
    expect(mobileVolume!.height).toBeGreaterThanOrEqual(223);
    const mobilePopover = await popover.boundingBox();
    expect(mobilePopover).not.toBeNull();
    expect(mobilePopover!.x).toBeGreaterThanOrEqual(0);
    expect(mobilePopover!.x + mobilePopover!.width).toBeLessThanOrEqual(376);
    const compact = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(compact.documentWidth).toBeLessThanOrEqual(compact.viewportWidth + 1);

    await page.keyboard.press('Escape');
    await page.setViewportSize({width: 844, height: 390});
    await trigger.click();
    await expect(volume).toBeVisible();
    const landscapeVolume = await volume.boundingBox();
    const landscapePopover = await popover.boundingBox();
    expect(landscapeVolume).not.toBeNull();
    expect(landscapePopover).not.toBeNull();
    expect(landscapeVolume!.height).toBeGreaterThanOrEqual(215);
    expect(landscapePopover!.y).toBeGreaterThanOrEqual(0);
    expect(landscapePopover!.y + landscapePopover!.height).toBeLessThanOrEqual(391);
  });

  test('the single current-Tab strip supports pointer and keyboard page selection', async ({page}) => {
    const firstAnimationId = 'course-g04-l03-ir-001-341242cc';
    await openLesson(
      page,
      {width: 1440, height: 900},
      '/courses/4/3?mode=focus',
      {
        schemaVersion: 1,
        completedAnimationIds: [firstAnimationId],
        currentAnimationId: firstAnimationId,
        language: 'en',
        replayCounts: {[firstAnimationId]: 2},
        visitedAnimationIds: [firstAnimationId],
      },
    );
    const pause = page.locator(`${BAR} [data-responsive-focus-key="pause"]`);
    if (await pause.getAttribute('aria-pressed') !== 'true') await pause.click();

    await page.locator(SPINE).getByRole('button', {
      name: 'Learn It',
      exact: true,
    }).click();
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '13');

    const scrubber = page.getByRole('slider', {
      name: 'Go to a page within Learn It',
      exact: true,
    });
    await expect(scrubber).toBeVisible();
    await expect(scrubber).toHaveAttribute('min', '1');
    await expect(scrubber).toHaveAttribute('max', '11');
    await expect(scrubber).toHaveAttribute('value', '1');
    await expect(page.locator(
      'input[data-progress-model="interactive-page-position"]',
    )).toHaveCount(0);
    await expect(page.locator(
      'input[data-progress-model="interactive-section-position"]:visible',
    )).toHaveCount(1);
    const visibleProgressText = await page.locator(
      `${BAR} .lesson-shell2__modern-completion`,
    ).innerText();
    expect(visibleProgressText.trim()).toBe('');
    const scrubberBox = await scrubber.boundingBox();
    expect(scrubberBox).not.toBeNull();
    expect(scrubberBox!.height).toBeGreaterThanOrEqual(44);

    const before = await readPersistedLessonProgress(page);
    expect(before).not.toBeNull();
    expect(before?.completedAnimationIds).toContain(firstAnimationId);
    expect(before?.replayCounts).toEqual({[firstAnimationId]: 2});
    expect(before?.visitedAnimationIds).toContain(firstAnimationId);
    const expectProgressPreserved = async () => {
      const current = await readPersistedLessonProgress(page);
      expect(current).not.toBeNull();
      expect(current!.completedAnimationIds).toEqual(expect.arrayContaining(
        before?.completedAnimationIds ?? [],
      ));
      expect(current?.replayCounts).toEqual(before?.replayCounts);
      expect(current!.visitedAnimationIds).toEqual(expect.arrayContaining(
        before?.visitedAnimationIds ?? [],
      ));
    };
    await scrubber.click({position: {
      x: Math.round(scrubberBox!.width * 0.72),
      y: Math.round(scrubberBox!.height / 2),
    }});
    await expect.poll(async () => Number(await scrubber.inputValue()))
      .toBeGreaterThan(5);
    const pointerPage = Number(await scrubber.inputValue());
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-page',
      String(12 + pointerPage),
    );
    await expect(scrubber).toBeFocused();
    await expectProgressPreserved();

    await page.keyboard.press('Home');
    await expect(scrubber).toHaveValue('1');
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '13');
    await expect(scrubber).toBeFocused();

    const dragY = scrubberBox!.y + scrubberBox!.height / 2;
    const forwardStartX = scrubberBox!.x + Math.max(8, scrubberBox!.width * .05);
    const forwardEndX = scrubberBox!.x + scrubberBox!.width * .84;
    await page.mouse.move(forwardStartX, dragY);
    await page.mouse.down();
    await page.mouse.move(forwardEndX, dragY, {steps: 12});
    await page.mouse.up();
    await expect.poll(async () => Number(await scrubber.inputValue()))
      .toBeGreaterThan(5);
    const forwardPage = Number(await scrubber.inputValue());
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-page',
      String(12 + forwardPage),
    );
    await expect(scrubber).toBeFocused();
    await expectProgressPreserved();

    const reverseEndX = scrubberBox!.x + scrubberBox!.width * .16;
    await page.mouse.move(forwardEndX, dragY);
    await page.mouse.down();
    await page.mouse.move(reverseEndX, dragY, {steps: 12});
    await page.mouse.up();
    await expect.poll(async () => Number(await scrubber.inputValue()))
      .toBeLessThan(forwardPage);
    const reversePage = Number(await scrubber.inputValue());
    expect(reversePage).toBeLessThan(forwardPage);
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-page',
      String(12 + reversePage),
    );
    await expect(scrubber).toBeFocused();
    await expectProgressPreserved();

    await page.keyboard.press('Home');
    await expect(scrubber).toHaveValue('1');
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '13');
    await expect(scrubber).toBeFocused();

    await page.keyboard.press('End');
    await expect(scrubber).toHaveValue('11');
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '23');
    await expect(scrubber).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(scrubber).toHaveValue('10');
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '22');
    await expect(scrubber).toBeFocused();
    await expectProgressPreserved();
  });

  test('the quiet section strip scrubs only within the active left-hand Tab', async ({page}) => {
    await openLesson(page, {width: 1440, height: 900});
    await page.locator(SPINE).getByRole('button', {
      name: 'Learn It',
      exact: true,
    }).click();
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '13');

    const scrubber = page.getByRole('slider', {
      name: 'Go to a page within Learn It',
      exact: true,
    });
    await expect(scrubber).toBeVisible();
    await expect(scrubber).toHaveAttribute('data-section-code', 'IN');
    await expect(scrubber).toHaveAttribute('min', '1');
    await expect(scrubber).toHaveAttribute('max', '11');
    await expect(scrubber).toHaveValue('1');
    await expect(scrubber).toHaveAttribute(
      'aria-valuetext',
      'Learn It, page 1 of 11',
    );
    const stage = page.locator('.lesson-shell2__legacy-stage');
    const sectionStrip = page.locator(
      '.lesson-shell2__modern-completion[data-progress-scope="section"]',
    );
    const [stageBox, stripBox, trackColor] = await Promise.all([
      stage.boundingBox(),
      sectionStrip.boundingBox(),
      page.evaluate(() => {
        const section = document.querySelector<HTMLInputElement>(
          'input[data-progress-model="interactive-section-position"]',
        );
        return section
          ? getComputedStyle(section).getPropertyValue('--lesson-section-track')
          : '';
      }),
    ]);
    expect(stageBox).not.toBeNull();
    expect(stripBox).not.toBeNull();
    expect(stripBox!.y).toBeGreaterThanOrEqual(
      stageBox!.y + stageBox!.height - 1,
    );
    expect(stripBox!.y - (stageBox!.y + stageBox!.height)).toBeLessThan(72);
    expect(trackColor).toContain('#405d76');
    await expect(page.locator(
      'input[data-progress-model="interactive-page-position"]',
    )).toHaveCount(0);
    await expect(page.locator(
      'input[data-progress-model="interactive-section-position"]:visible',
    )).toHaveCount(1);
    expect((await sectionStrip.innerText()).trim()).toBe('');
    const box = await scrubber.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await scrubber.click({position: {
      x: Math.round(box!.width * .52),
      y: Math.round(box!.height / 2),
    }});
    await expect.poll(async () => Number(await scrubber.inputValue()))
      .toBeGreaterThan(1);
    const sectionPage = Number(await scrubber.inputValue());
    expect(sectionPage).toBeLessThanOrEqual(11);
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-page',
      String(12 + sectionPage),
    );
    await expect(scrubber).toBeFocused();

    await page.keyboard.press('Home');
    const dragStartX = box!.x + Math.max(4, box!.width * .08);
    const dragEndX = box!.x + box!.width * .78;
    const dragY = box!.y + box!.height / 2;
    await page.mouse.move(dragStartX, dragY);
    await page.mouse.down();
    await page.mouse.move(dragEndX, dragY, {steps: 8});
    await page.mouse.up();
    await expect.poll(async () => Number(await scrubber.inputValue()))
      .toBeGreaterThan(5);
    expect(Number(await scrubber.inputValue())).toBeLessThanOrEqual(11);
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-animation-id',
      /course-g04-l03-in-/u,
    );
    await expect(scrubber).toBeFocused();

    await page.keyboard.press('End');
    await expect(scrubber).toHaveValue('11');
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '23');
    await expect(scrubber).toHaveAttribute('data-section-code', 'IN');

    await page.keyboard.press('Home');
    await expect(scrubber).toHaveValue('1');
    await expect(page.locator(PLAYER)).toHaveAttribute('data-current-page', '13');
    await expect(page.getByText('Page animation', {exact: true})).toHaveCount(0);

    for (const viewport of [
      {width: 844, height: 390},
      {width: 375, height: 812},
    ]) {
      await page.setViewportSize(viewport);
      await expect(scrubber).toBeVisible();
      await expect(scrubber).toHaveAttribute('max', '11');
      const compactBox = await scrubber.boundingBox();
      const compactStageBox = await stage.boundingBox();
      const compactStripBox = await sectionStrip.boundingBox();
      expect(compactBox).not.toBeNull();
      expect(compactStageBox).not.toBeNull();
      expect(compactStripBox).not.toBeNull();
      expect(compactBox!.height).toBeGreaterThanOrEqual(44);
      expect(compactStripBox!.y).toBeGreaterThanOrEqual(
        compactStageBox!.y + compactStageBox!.height - 1,
      );
      expect(
        compactStripBox!.y - (compactStageBox!.y + compactStageBox!.height),
      ).toBeLessThan(80);
      const reflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(reflow.documentWidth).toBeLessThanOrEqual(reflow.viewportWidth + 1);
    }

    await page.setViewportSize({width: 1440, height: 900});
    await page.locator(SPINE).getByRole('button', {
      name: 'Play It',
      exact: true,
    }).click();
    const singlePageStrip = page.getByRole('slider', {
      name: 'Play It has one page',
      exact: true,
    });
    await expect(singlePageStrip).toBeVisible();
    await expect(singlePageStrip).toBeDisabled();
    await expect(singlePageStrip).toHaveAttribute('min', '1');
    await expect(singlePageStrip).toHaveAttribute('max', '1');
    await expect(singlePageStrip).toHaveValue('1');
    await expect(singlePageStrip).toHaveAttribute(
      'aria-valuetext',
      'Play It, page 1 of 1',
    );
    await expect(singlePageStrip).toHaveAttribute(
      'title',
      'Play It has one page',
    );
  });

  test('no second permanent rail or Read it action competes with the plane', async ({page}) => {
    await openLesson(page, {width: 1440, height: 900});
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
    )).toHaveCount(0);
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="narration"]`,
    )).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Read it', exact: true}))
      .toHaveCount(0);
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
    expect(replayX).toBeLessThan(muteX);
    expect(muteX).toBeLessThan(askNovaX);
    await expect(launcher).toHaveAttribute(
      'data-tutor-brand-origin',
      'mais-mvp-orbit-adaptation',
    );
    await expect(launcher.locator('.lesson-shell2__nova-orbit')).toBeVisible();
    await expect(launcher.getByText('Nova Tutor', {exact: true})).toBeVisible();
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="study-support"]`,
    )).toHaveCount(0);

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
    await expect(panel.getByRole('status')).toContainText(
      'Hi, I am Professor Nova ✦, your AI Tutor. I can help with this page. Share what you understand so far, and I’ll use the Socratic method to guide you step by step instead of simply giving away the answer.',
    );
    await expect(panel.getByText('A connection is not claimed until a real response is received.'))
      .toHaveCount(0);
    await expect(panel.getByRole('status')).toContainText(
      'Nova is instructed to offer hints and guiding questions instead of revealing or confirming the answer.',
    );
    await expect(panel.locator('.lesson-shell2__nova-message')).toHaveCount(0);
    await expect(panel.getByRole('heading', {name: 'Professor Nova'})).toHaveCount(0);
    await expect(panel.getByRole('button', {name: 'Close Nova'})).toBeVisible();
    await expect(panel.locator('.lesson-shell2__nova-chips')).toHaveCount(0);
    await expect(panel.getByText('Question starters', {exact: true})).toHaveCount(0);
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="pause"]`,
    )).toBeEnabled();

    const [openStage, openPanel] = await Promise.all([
      stage.boundingBox(),
      panel.boundingBox(),
    ]);
    expect(openStage).not.toBeNull();
    expect(openPanel).not.toBeNull();
    expect(Math.abs(openPanel!.width - 435)).toBeLessThanOrEqual(1);
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

    await attachTestImageFromPlus(panel);

    const question = panel.getByRole('textbox', {name: 'Type a question for Nova'});
    await question.fill('Help me understand 4 - Step Plan.');
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
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
    await expect(panel).toHaveAttribute(
      'data-tutor-frame-sharing',
      'local-not-sent',
    );
    await expect(panel.getByRole('button', {
      name: 'Remove the image from the next question',
      exact: true,
    })).toHaveCount(0);

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

  test('a legacy Study URL stays in Focus with Nova as the only support interface', async ({page}) => {
    const requests = await mockNovaApi(page);
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/courses/4/3?mode=study',
    );

    const root = page.locator(ROOT);
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(root).toHaveAttribute('data-tutor-mode', 'focus');
    await expect(root).toHaveAttribute(
      'data-tutor-placement',
      'focus-side-column',
    );
    await expect(root).toHaveAttribute('data-tutor-panel-open', 'false');
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'false');
    await expect(panel).toHaveCount(0);
    await expect(page.getByRole('button', {name: /read it|read support/i}))
      .toHaveCount(0);

    await goToPage34(page);

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    await expect(panel).toBeVisible();
    await expect(panel.locator('.lesson-shell2__nova-main')).toBeVisible();
    await expect(panel.getByRole('tab')).toHaveCount(0);
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'true');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
    await expect(page.locator(
      `${BAR} [data-responsive-focus-key="pause"]`,
    )).toBeEnabled();

    const question = panel.getByRole('textbox', {name: 'Type a question for Nova'});
    await question.fill('Help me understand Number Line.');
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
    const request = await waitForNovaRequest(requests, 1);
    expect(request.message).toBe('Help me understand Number Line.');
    expect(request.mode).toBe('focus');
    expect(request.frame).toBeUndefined();
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
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    await expect(root).toHaveAttribute('data-tutor-interaction-open', 'false');
  });

  test('a legacy Study URL remains Focus and opens no unsolicited mobile modal', async ({page}) => {
    await openLesson(
      page,
      {width: 375, height: 812},
      '/courses/4/3?mode=study',
    );

    const root = page.locator(ROOT);
    await expect(root).toHaveAttribute('data-tutor-mode', 'focus');
    await expect(root).toHaveAttribute('data-tutor-panel-open', 'false');
    await expect(root).toHaveAttribute('data-tutor-modal', 'false');
    await expect(page.getByRole('dialog', {name: 'Nova Tutor support'}))
      .toHaveCount(0);
    await expect(page.locator('.lesson-shell2__learning-column'))
      .not.toHaveAttribute('inert', '');

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'Nova Tutor support'});
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.lesson-shell2__nova-main')).toBeVisible();
    await expect(dialog.getByRole('tab')).toHaveCount(0);
  });

  test('Page 36 readable support stays separate from the Nova-only panel', async ({page}) => {
    await openLesson(page, {width: 1920, height: 1080});
    await goToPage36(page);
    await expect(page.getByRole('button', {name: /read it|read support/i}))
      .toHaveCount(0);
    await expect(page.locator('.g4-l3-readable-view:visible')).toHaveCount(1);
    const readableView = page.locator(
      '.lesson-shell2__learning-support .g4-l3-readable-view',
    );
    await expect(readableView).toBeVisible();
    await expect(readableView.getByRole('heading', {
      level: 3,
      name: 'Step 3 · Number line',
    })).toBeVisible();
    await expect(readableView.getByRole('heading', {
      level: 3,
      name: 'Step 4 · Logical reasoning',
    })).toBeVisible();
    await expect(readableView.getByRole('list', {
      name: 'Positions on the number line',
    })).toContainText('Susan owes $10');
    await expect(readableView.getByRole('list', {
      name: 'Signed amounts',
    })).toContainText('Toni has $7');
    await expect(readableView.locator('img')).toHaveCount(0);
    await expect(readableView).not.toContainText('current-JavaScript frame');
    await expect(readableView).not.toContainText('Flash-fidelity evidence');

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel.locator('.lesson-shell2__nova-main')).toBeVisible();
    await expect(panel.getByRole('tab')).toHaveCount(0);
    await expect(page.locator('.g4-l3-readable-view:visible')).toHaveCount(0);
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
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

  test('Nova keeps generous inline space and a compact attachment row on mobile', async ({page}) => {
    await openLesson(page, {width: 390, height: 844});
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toBeVisible();

    const geometry = await panel.evaluate((element) => {
      const content = element.querySelector<HTMLElement>(
        '.lesson-shell2__nova-main',
      )!;
      const attach = element.querySelector<HTMLElement>('.lesson-shell2__nova-attach')!;
      const mic = element.querySelector<HTMLElement>('.lesson-shell2__nova-mic')!;
      const draft = element.querySelector<HTMLElement>('textarea')!;
      const actions = element.querySelector<HTMLElement>('.lesson-shell2__nova-input-actions')!;
      const attachIcon = attach.querySelector<SVGElement>('svg')!;
      const micIcon = mic.querySelector<SVGElement>('svg')!;
      const panelBox = element.getBoundingClientRect();
      const attachBox = attach.getBoundingClientRect();
      const micBox = mic.getBoundingClientRect();
      const draftBox = draft.getBoundingClientRect();
      const actionsBox = actions.getBoundingClientRect();
      const attachIconBox = attachIcon.getBoundingClientRect();
      const micIconBox = micIcon.getBoundingClientRect();
      return {
        attachBeforeMic: attachBox.right <= micBox.left,
        buttonsSameSize:
          Math.abs(attachBox.width - micBox.width) <= 1 &&
          Math.abs(attachBox.height - micBox.height) <= 1,
        draftAboveActions: draftBox.bottom <= actionsBox.top,
        iconsSameSize:
          Math.abs(attachIconBox.width - micIconBox.width) <= 1 &&
          Math.abs(attachIconBox.height - micIconBox.height) <= 1,
        minimumTarget: Math.min(attachBox.width, attachBox.height, micBox.width, micBox.height),
        contentPaddingLeft: Number.parseFloat(getComputedStyle(content).paddingLeft),
        contentPaddingRight: Number.parseFloat(getComputedStyle(content).paddingRight),
        insideViewport: panelBox.left >= 0 && panelBox.right <= innerWidth,
      };
    });
    expect(geometry.attachBeforeMic).toBe(true);
    expect(geometry.buttonsSameSize).toBe(true);
    expect(geometry.draftAboveActions).toBe(true);
    expect(geometry.iconsSameSize).toBe(true);
    expect(geometry.minimumTarget).toBeGreaterThanOrEqual(44);
    expect(geometry.contentPaddingLeft).toBeGreaterThanOrEqual(16);
    expect(geometry.contentPaddingRight).toBeGreaterThanOrEqual(16);
    expect(geometry.insideViewport).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));

    await attachTestImageFromPlus(panel);
    await panel.locator('input[type="file"]').setInputFiles({
      buffer: Buffer.from('not an image', 'utf8'),
      mimeType: 'text/plain',
      name: 'notes.txt',
    });
    await expect(panel).toHaveAttribute('data-tutor-frame-sharing', 'local-not-sent');
    await expect(panel.locator('.lesson-shell2__nova-notice'))
      .toContainText('Choose a PNG or JPEG image. Nothing was attached.');
    await expect(panel.getByRole('button', {
      name: 'Remove the image from the next question',
      exact: true,
    })).toHaveCount(0);

    await attachTestImageFromPlus(panel);
    const remove = panel.getByRole('button', {
      name: 'Remove the image from the next question',
      exact: true,
    });
    await remove.click();
    await expect(panel).toHaveAttribute('data-tutor-frame-sharing', 'local-not-sent');
    await expect(remove).toHaveCount(0);

    await page.setViewportSize({width: 320, height: 720});
    const compact = await panel.evaluate((element) => {
      const attach = element.querySelector<HTMLElement>('.lesson-shell2__nova-attach')!
        .getBoundingClientRect();
      const mic = element.querySelector<HTMLElement>('.lesson-shell2__nova-mic')!
        .getBoundingClientRect();
      const draft = element.querySelector<HTMLElement>('textarea')!
        .getBoundingClientRect();
      const actions = element.querySelector<HTMLElement>('.lesson-shell2__nova-input-actions')!
        .getBoundingClientRect();
      return {
        attachBeforeMic: attach.right <= mic.left,
        buttonsSameSize:
          Math.abs(attach.width - mic.width) <= 1 &&
          Math.abs(attach.height - mic.height) <= 1,
        draftAboveActions: draft.bottom <= actions.top,
        attachInside: attach.left >= 0 && attach.right <= innerWidth,
        micInside: mic.left >= 0 && mic.right <= innerWidth,
        draftInside: draft.left >= 0 && draft.right <= innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(compact.attachBeforeMic).toBe(true);
    expect(compact.buttonsSameSize).toBe(true);
    expect(compact.draftAboveActions).toBe(true);
    expect(compact.attachInside).toBe(true);
    expect(compact.micInside).toBe(true);
    expect(compact.draftInside).toBe(true);
    expect(compact.documentWidth).toBeLessThanOrEqual(compact.viewportWidth + 1);
  });

  test('Important Words feedback is a modern card outside the number line', async ({page}) => {
    await openLesson(page, {width: 1440, height: 900});
    await page.locator(SPINE).getByRole('button', {
      name: 'Important Words',
      exact: true,
    }).click();
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-current-animation-id',
      'course-g04-l03-vb-003',
    );

    const sourceItem = page.getByRole('button', {
      name: 'Select negative 2 to move',
      exact: true,
    });
    await sourceItem.click();
    await page.getByRole('button', {
      name: 'Place selected number at 2 on the number line',
      exact: true,
    }).click();

    const card = page.getByRole('alertdialog', {name: 'Try again'});
    const companion = page.locator('[data-page-interaction-companion-host="true"]');
    const stage = page.locator('.lesson-shell2__legacy-stage');
    await expect(card).toBeVisible();
    await expect(card).toContainText(
      'Number lines show numbers in order. Try again.',
    );
    await expect(companion.getByRole('alertdialog')).toHaveCount(1);
    await expect(stage.getByRole('alertdialog')).toHaveCount(0);
    await expect(card).toHaveAttribute(
      'data-current-js-feedback-placement',
      'companion-outside-authored-stage',
    );
    const [stageBox, cardBox] = await Promise.all([
      stage.boundingBox(),
      card.boundingBox(),
    ]);
    expect(stageBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.y).toBeGreaterThanOrEqual(stageBox!.y + stageBox!.height - 1);

    const close = card.getByRole('button', {name: 'Close', exact: true});
    await expect(close).toBeFocused();
    const closeBox = await close.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(sourceItem).toBeFocused();

    await sourceItem.click();
    await page.getByRole('button', {
      name: 'Place selected number at 2 on the number line',
      exact: true,
    }).click();
    await page.setViewportSize({width: 375, height: 812});
    await expect(card).toBeVisible();
    const reflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(reflow.documentWidth).toBeLessThanOrEqual(reflow.viewportWidth + 1);
    await card.getByRole('button', {name: 'Close', exact: true}).click();
    await expect(card).toHaveCount(0);
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
    await expect(pause).toHaveAccessibleName('Pause animation');
    await expect(pause).toHaveAttribute('data-playback-action', 'pause');
    const pauseMask = await pause.evaluate((element) =>
      getComputedStyle(element, '::before').maskImage ||
        getComputedStyle(element, '::before').webkitMaskImage);
    expect(pauseMask).not.toBe('none');
    await expect(page.locator(
      '[data-progress-model="current-page-animation-playhead"]',
    )).toHaveCount(0);
    await expect(page.locator(
      'input[data-progress-model="interactive-section-position"]',
    )).toBeVisible();
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
    await expect(pause).toHaveAccessibleName('Play animation');
    await expect(pause).toHaveAttribute('data-playback-action', 'play');
    const playMask = await pause.evaluate((element) =>
      getComputedStyle(element, '::before').maskImage ||
        getComputedStyle(element, '::before').webkitMaskImage);
    expect(playMask).not.toBe('none');
    expect(playMask).not.toBe(pauseMask);
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'true');
    const manuallyPausedFrame = await readFlashFrame(stage);
    await page.waitForTimeout(750);
    expect(await readFlashFrame(stage)).toBe(manuallyPausedFrame);

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await expect(pause).toHaveAccessibleName('Pause animation');
    await expect(pause).toHaveAttribute('data-playback-action', 'pause');
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
    const resumedFrame = await readFlashFrame(stage);
    await expect.poll(() => readFlashFrame(stage), {timeout: 4_000})
      .toBeGreaterThan(resumedFrame);

    await launcher.click();
    await expect(root).toHaveAttribute('data-tutor-open', 'false');
    await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
  });

  test('Focus Nova preserves learner-controlled pause across close and reopen', async ({page}) => {
    await openLesson(page, {width: 1920, height: 1080});

    const pause = page.locator(`${BAR} [data-responsive-focus-key="pause"]`);
    const novaLauncher = page.getByRole('button', {
      name: 'Ask Nova',
      exact: true,
    });
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await novaLauncher.click();
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
    await novaLauncher.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    await novaLauncher.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await novaLauncher.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
  });

  test('a legacy Classroom URL opens the Focus Nova panel and reports Focus', async ({page}) => {
    const requests = await mockNovaApi(page);
    await openLesson(
      page,
      {width: 1920, height: 1080},
      '/courses/4/3?mode=classroom',
    );

    const root = page.locator(ROOT);
    await expect(root).toHaveAttribute('data-tutor-mode', 'focus');
    await expect(root).toHaveAttribute(
      'data-tutor-placement',
      'focus-side-column',
    );
    await expect(page.locator('.lesson-shell2__mode-switch')).toHaveCount(0);
    await expect(page.locator('.lesson-shell2__nova-panel')).toHaveCount(0);
    await expect(page.locator('.lesson-shell2__nova-classroom-band'))
      .toHaveCount(0);

    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    const panel = page.locator('.lesson-shell2__nova-panel');
    await expect(panel).toBeVisible();
    await expect(page.locator('.lesson-shell2__nova-classroom-band'))
      .toHaveCount(0);
    await expect(root).toHaveAttribute('data-tutor-playback', 'independent');
    await expect(page.locator('[data-tutor-pause-notice]')).toHaveCount(0);
    await expect(page.locator('.runtime-shell')).toHaveAttribute(
      'data-runtime-paused',
      'false',
    );
    const question = panel.getByRole('textbox', {name: 'Type a question for Nova'});
    await question.fill('Why is negative three below zero?');
    await panel.getByRole('button', {name: 'Send question to Nova'}).click();
    const typedRequest = await waitForNovaRequest(requests, 1);
    expect(typedRequest.message).toBe('Why is negative three below zero?');
    expect(typedRequest.mode).toBe('focus');
    expect(typedRequest.history).toEqual([]);
    expect(typedRequest.frame).toBeUndefined();
    await expect(panel).toContainText('Why is negative three below zero?');
    await expect(panel).toContainText(
      'Mock Nova reply: Why is negative three below zero?',
    );
    await expect(panel).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(panel).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await expect(root).toHaveAttribute('data-tutor-provider', 'openrouter');
    await expect(root).toHaveAttribute('data-tutor-model', 'openai/gpt-5.6-luna');
    await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
    await expect(panel).toHaveCount(0);
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

    const lastControl = dialog.getByRole('button', {name: 'Ask Nova by voice'});
    await lastControl.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', {name: 'Close Nova'})).toBeFocused();

    const question = dialog.getByRole('textbox', {name: 'Type a question for Nova'});
    const attach = dialog.getByRole('button', {
      name: 'Attach an image or take a photo',
    });
    const send = dialog.getByRole('button', {name: 'Send question to Nova'});
    await question.fill('A local keyboard-order check');
    await question.focus();
    await page.keyboard.press('Tab');
    await expect(attach).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(lastControl).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(send).toBeFocused();
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

  test('Focus-only routes and the compact section spine have no blocking axe findings', async ({page}) => {
    const cases = [
      {
        collapse: false,
        open: true,
        route: '/courses/4/3',
        viewport: {width: 375, height: 812},
      },
      {
        collapse: true,
        open: false,
        route: '/courses/4/3?mode=study',
        viewport: {width: 1920, height: 1080},
      },
      {
        collapse: false,
        open: true,
        route: '/courses/4/3?mode=classroom',
        viewport: {width: 1920, height: 1080},
      },
    ] as const;

    for (const scenario of cases) {
      await openLesson(page, scenario.viewport, scenario.route);
      await expect(page.locator(ROOT)).toHaveAttribute('data-tutor-mode', 'focus');
      await expect(page.locator('.lesson-shell2__mode-switch')).toHaveCount(0);
      if (scenario.collapse) {
        await page.getByRole('button', {
          name: 'Hide lesson section names',
          exact: true,
        }).click();
        await expect(page.locator(ROOT))
          .toHaveAttribute('data-spine-collapsed', 'true');
      }
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
    const fq3Panel = fq3.locator('.course-g04-l03-fq-002-stage-panel');
    const fq3Surface = fq3.locator('.course-g04-l03-fq-002-stage-surface');
    const [panelBox, surfaceBox] = await Promise.all([
      fq3Panel.boundingBox(),
      fq3Surface.boundingBox(),
    ]);
    expect(panelBox).not.toBeNull();
    expect(surfaceBox).not.toBeNull();
    expect(Math.abs(
      (panelBox!.x + panelBox!.width / 2)
      - (surfaceBox!.x + surfaceBox!.width / 2),
    )).toBeLessThanOrEqual(1);
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
    for (let target = 3; target <= 8; target += 1) {
      await expect(fq3).toHaveAttribute('data-answer-transition-locked', 'false', {
        timeout: 10_000,
      });
      await fq3Choice.click();
      await expect(fq3).toHaveAttribute(
        'data-current-js-sequence-number',
        String(target),
      );
      await expect(fq3).toHaveAttribute('data-current-js-controls-ready', 'true', {
        timeout: 10_000,
      });
    }
    await expect(fq3).toHaveAttribute(
      'data-owner-directed-question-source',
      'course-g04-l03-ts-007',
    );
    await expect(fq3).toHaveAttribute(
      'data-final-quiz-source-visual-parity-effect',
      'none',
    );
    await expect(fq3).toHaveAttribute('data-strict-acceptance-effect', 'none');
    await expect(fq3.locator(
      '.course-g04-l03-fq-002-stage-surface h2',
    )).toHaveText('Which symbol is located at −2 on the number line?');
    const ts007Figure = fq3.locator(
      '.course-g04-l03-fq-002-stage-surface '
      + '.course-g04-l03-fq-002-ts007-number-line',
    );
    await expect(ts007Figure).toBeVisible();
    await expect(ts007Figure).toHaveAttribute(
      'data-presentation-kind',
      'semantic-current-javascript-vector-reconstruction',
    );
    await expect(ts007Figure.locator('text')).toHaveText(['−5', '0', '5']);
    for (const name of [
      'A. green circle',
      'B. orange-red heart',
      'C. pink square',
      'D. cyan triangle',
    ]) {
      await expect(fq3.locator(
        '.course-g04-l03-fq-002-stage-surface',
      ).getByRole('button', {name, exact: true})).toBeEnabled();
    }
    await expect(fq3.locator(
      '.course-g04-l03-fq-002-stage-surface [data-source-symbol-crop]',
    )).toHaveCount(0);
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
