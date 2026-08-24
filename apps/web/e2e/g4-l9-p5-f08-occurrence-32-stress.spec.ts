import {expect, test, type Browser, type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const route = '/migration-status/g4-l9-product-bridge';
const animationId = 'course-g04-l09-ti-007';
const placementId = 'g04-l09-placement-032';
const storageKey = 'helpmath:g4-l9-p5-product-bridge:v1';
const releaseId = 'private-g4-l9-p5-f08-occurrence-32-stress-v1';
const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const screenshotRoot = path.join(repositoryRoot, 'reports/browser-qa/g4-l9-p5');

const glossaryHandlers = [
  ['Equation', 'equation', 'Equation'],
  ['Mathematical aentence', 'sentence', 'Sentence'],
  ['Show', 'show', 'Show'],
  ['Expression', 'expression', 'Expression'],
  ['Equal', 'equal', 'Equal'],
  ['Inverse operations', 'inverse-operations', 'Inverse operations'],
  ['Solve', 'solve', 'Solve'],
  ['Equation', 'equation', 'Equation'],
  ['Value', 'value', 'Value'],
  ['Unknown', 'unknown', 'Unknown'],
  ['Solution', 'solution', 'Solution'],
  ['Column', 'column', 'Column'],
  ['Addition', 'addition', 'Addition'],
  ['Multiplication', 'multiplication', 'Multiplication'],
  ['Subtraction', 'subtraction', 'Subtraction'],
  ['Division', 'division', 'Division'],
  ['Perform', 'perform', 'Perform'],
  ['Equation', 'equation', 'Equation'],
  ['Inverse operations', 'inverse-operations', 'Inverse operations'],
] as const;

async function selectOccurrence32(page: Page) {
  const player = page.locator(
    '[data-lesson-player="descriptor-driven-page-only-product-bridge"]',
  );
  await expect(player).toHaveAttribute('data-hydrated', 'true');
  await expect(player).toHaveAttribute('data-current-placement-id', placementId);
  await expect(player).toHaveAttribute('data-current-animation-id', animationId);
  return player;
}

async function runStress({
  browser,
  baseURL,
  locale,
  viewport,
  outputDirectory,
}: {
  browser: Browser;
  baseURL: string;
  locale: 'en' | 'es';
  viewport: {width: number; height: number};
  outputDirectory: 'desktop-en-1440x1000' | 'mobile-es-390x844';
}) {
  const context = await browser.newContext({
    baseURL,
    locale: locale === 'en' ? 'en-US' : 'es-ES',
    reducedMotion: 'reduce',
    viewport,
  });
  await context.addInitScript(({key, release, placement, language}) => {
    window.localStorage.setItem(key, JSON.stringify({
      schemaVersion: 1,
      releaseId: release,
      currentAnimationId: placement,
      locale: language,
      visitedAnimationIds: [placement],
      reviewedAnimationIds: [],
      replayCounts: {},
    }));
  }, {key: storageKey, release: releaseId, placement: placementId, language: locale});
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const forbiddenRequests: string[] = [];
  const allowedOrigin = new URL(baseURL).origin;
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} :: ${request.failure()?.errorText ?? ''}`);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.origin !== allowedOrigin ||
        /geturl|report|final-quiz-post|legacy-endpoint|xml-send/iu.test(url.href))
    ) forbiddenRequests.push(url.href);
  });

  const response = await page.goto(`/${locale}${route}`);
  expect(response?.status()).toBe(200);
  const player = await selectOccurrence32(page);
  await expect(player).toHaveAttribute('data-current-page', '32');
  await expect(player).toHaveAttribute('data-renderer-availability', 'registered');
  await expect(player).toHaveAttribute('data-unavailable-pages', '27');
  await expect(player).toHaveAttribute('data-page-audio-acceptance', 'not-established');
  await expect(player).toHaveAttribute('data-page-actionscript-execution', 'not-executed');

  const runtimeModule = page.locator(
    `[data-private-current-js="true"][data-animation-id="${animationId}"]`,
  );
  const runtimeStage = runtimeModule.locator('..');
  const runtimeShell = runtimeStage.locator('..');
  await expect(runtimeModule).toBeVisible();
  await expect(runtimeModule).toHaveAttribute('data-source-occurrence', '32');
  await expect(runtimeModule).toHaveAttribute(
    'data-do-get-rnd-quest-adapter',
    'doGetRndQuest-maintained-seeded-order-v1',
  );
  await expect(runtimeModule).toHaveAttribute('data-host-symbol-count', '21');
  await expect(runtimeModule).toHaveAttribute('data-drag-correct', 'Scr1,Scr2,Scr3,Scr6');
  await expect(runtimeModule).toHaveAttribute('data-drag-incorrect', 'Scr4,Scr5');
  await expect(runtimeModule).toHaveAttribute('data-network-calls', '0');
  await expect(runtimeModule).toHaveAttribute('data-original-runtime-validated', 'false');
  await expect(runtimeModule).toHaveAttribute('data-fidelity-accepted', 'false');
  await expect(runtimeStage).toHaveAttribute('data-flash-frame-domain', 'sprite-149');
  await expect(runtimeStage).toHaveAttribute(
    'data-runtime-scenario',
    'p5-f08-occurrence-32-stress',
  );
  const firstSeed = await runtimeStage.getAttribute('data-runtime-seed');
  expect(firstSeed).toMatch(/^\d+$/u);

  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Course' : 'Curso',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');

  expect(await runtimeModule.locator('[aria-label^="Glossary "]').count()).toBe(19);
  for (let index = 0; index < glossaryHandlers.length; index += 1) {
    const [sourceIntent, entryId, sourceKey] = glossaryHandlers[index]!;
    await runtimeModule.getByRole('button', {
      name: `Glossary ${index + 1}: ${sourceIntent}`,
      exact: true,
    }).click();
    await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
    const dialog = page.locator(`[data-glossary-entry-id="${entryId}"]`);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-source-key-attribute', sourceKey);
    await expect(dialog).toHaveAttribute('data-glossary-storage', 'memory-only');
    await dialog.getByRole('button', {
      name: locale === 'en' ? 'Close and continue' : 'Cerrar y continuar',
    }).click();
  }

  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Play audio' : 'Reproducir audio',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-audio-lifecycle', 'requested');
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
  await expect(runtimeShell).toHaveAttribute(
    'data-interactive-audio-playing',
    `${animationId}-narration`,
  );

  const correctDrop = locale === 'en' ? 'Drop Scr1' : 'Soltar Scr1';
  await runtimeModule.getByRole('button', {name: correctDrop, exact: true}).click();
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
  await expect(runtimeModule.locator('[data-feedback]')).toBeVisible();

  const shellReplay = player.locator(
    'button[data-responsive-focus-key="replay"]:visible',
  );
  await expect(shellReplay).toHaveCount(1);
  await shellReplay.click();
  await expect(runtimeModule).toHaveAttribute('data-question-index', '1');
  await expect(runtimeModule).toHaveAttribute('data-score', '0');
  await expect(runtimeModule).toHaveAttribute('data-audio-lifecycle', 'idle');
  await expect(runtimeModule.locator('[data-feedback]')).toHaveCount(0);
  await expect(runtimeShell).not.toHaveAttribute(
    'data-interactive-audio-playing',
    /.+/u,
  );

  await runtimeModule.getByRole('button', {name: correctDrop, exact: true}).click();
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Next' : 'Siguiente',
    exact: true,
  }).click();
  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Play audio' : 'Reproducir audio',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Drop Scr4' : 'Soltar Scr4',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Replay' : 'Repetir',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-question-index', '1');
  await expect(runtimeModule).toHaveAttribute('data-score', '0');
  await expect(runtimeModule).toHaveAttribute('data-audio-lifecycle', 'idle');
  await expect(runtimeModule.locator('[data-feedback]')).toHaveCount(0);
  await expect(runtimeShell).not.toHaveAttribute(
    'data-interactive-audio-playing',
    /.+/u,
  );

  const drops = locale === 'en'
    ? ['Drop Scr1', 'Drop Scr4', 'Drop Scr2']
    : ['Soltar Scr1', 'Soltar Scr4', 'Soltar Scr2'];
  const feedback = locale === 'en'
    ? ['Correct.', 'Try the next question.', 'Correct.']
    : ['Correcto.', 'Inténtalo de nuevo en la próxima pregunta.', 'Correcto.'];
  for (let question = 0; question < 3; question += 1) {
    await expect(runtimeModule).toHaveAttribute('data-question-index', String(question + 1));
    await runtimeModule.getByRole('button', {name: drops[question]!, exact: true}).click();
    await expect(runtimeModule).toHaveAttribute('data-host-decision', 'allowed');
    await expect(runtimeModule.locator('[data-feedback]')).toHaveText(feedback[question]!);
    await expect(runtimeModule).toHaveAttribute('data-score', String(question < 2 ? 1 : 2));
    await runtimeModule.getByRole('button', {
      name: locale === 'en' ? 'Next' : 'Siguiente',
      exact: true,
    }).click();
  }
  await expect(runtimeModule.locator('[data-final="true"]')).toContainText('Final: 2/3');
  await expect(runtimeModule).toHaveAttribute('data-attempts', '3');
  await runtimeModule.locator('[data-final="true"] button').click();
  await expect(runtimeModule).toHaveAttribute('data-question-index', '1');
  await expect(runtimeModule).toHaveAttribute('data-score', '0');
  await expect(runtimeModule).toHaveAttribute('data-attempts', '0');
  await expect(runtimeModule.locator('[data-feedback]')).toHaveCount(0);
  await expect(runtimeModule.locator('..').locator('..')).toHaveAttribute(
    'data-runtime-replay',
    /[1-9]\d*/u,
  );

  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Blocked report' : 'Informe bloqueado',
    exact: true,
  }).click();
  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Blocked getURL' : 'getURL bloqueado',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-host-decision', 'blocked');
  await expect(runtimeModule).toHaveAttribute('data-blocked-legacy-intents', '2');
  await expect(runtimeModule).toHaveAttribute('data-network-calls', '0');

  await runtimeModule.getByRole('button', {
    name: locale === 'en' ? 'Replay' : 'Repetir',
    exact: true,
  }).click();
  await expect(runtimeModule).toHaveAttribute('data-question-index', '1');
  await expect(runtimeModule).toHaveAttribute('data-score', '0');
  await expect(runtimeModule).toHaveAttribute('data-blocked-legacy-intents', '0');
  await expect(runtimeModule).toHaveAttribute('data-network-calls', '0');

  await page.getByRole('button', {
    name: locale === 'en' ? 'Next page' : 'Página siguiente',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '33');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', {
    name: locale === 'en' ? '← Previous' : '← Anterior',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '32');
  await expect(player).toHaveAttribute('data-current-animation-id', animationId);
  await page.waitForLoadState('networkidle');

  const output = path.join(
    screenshotRoot,
    outputDirectory,
    '032-course-g04-l09-ti-007.png',
  );
  await mkdir(path.dirname(output), {recursive: true});
  await page.screenshot({animations: 'disabled', path: output});
  expect(consoleErrors, 'browser console errors').toEqual([]);
  expect(pageErrors, 'uncaught page errors').toEqual([]);
  expect(failedRequests, 'failed browser requests').toEqual([]);
  expect(forbiddenRequests, 'external or legacy network requests').toEqual([]);
  await context.close();
}

test('P5 occurrence-32 bounded stress passes desktop EN and mobile ES', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  expect(baseURL).toBeTruthy();
  await runStress({
    browser,
    baseURL: baseURL!,
    locale: 'en',
    viewport: {width: 1440, height: 1000},
    outputDirectory: 'desktop-en-1440x1000',
  });
  await runStress({
    browser,
    baseURL: baseURL!,
    locale: 'es',
    viewport: {width: 390, height: 844},
    outputDirectory: 'mobile-es-390x844',
  });
});
