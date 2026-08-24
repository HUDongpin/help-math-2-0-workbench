import {expect, test, type Browser, type Page} from '@playwright/test';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const route = '/migration-status/g4-l9-product-bridge';
const animationId = 'course-g04-l09-ti-004';
const placementId = 'g04-l09-placement-029';
const storageKey = 'helpmath:g4-l9-p5-product-bridge:v1';
const privateBridgeReleaseId = 'private-g4-l9-p5-f08-occurrence-32-stress-v1';
const taskId =
  'HELP-MATH-G4-L9-P5-1-OCCURRENCE-29-BOUNDED-IMPLEMENTATION-20260824';
const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const screenshotRoot = path.join(repositoryRoot, 'reports/browser-qa/g4-l9-p5-1');
const receiptPath = path.join(
  repositoryRoot,
  'reports/g4-l9-p5-1-occurrence-29-browser-qa-receipt-v1.json',
);

const glossaryHandlers = [
  ['Equation', 'equation', 'Equation'],
  ['Mathematical aentence', 'sentence', 'Sentence'],
  ['Show', 'show', 'Show'],
  ['Expression', 'expression', 'Expression'],
  ['Equal', 'equal', 'Equal'],
  ['Expression', 'expression', 'Expression'],
  ['Equation', 'equation', 'Equation'],
  ['Equal', 'equal', 'Equal'],
  ['Expression', 'expression', 'Expression'],
  ['Sentence', 'sentence', 'Sentence'],
  ['Equation', 'equation', 'Equation'],
  ['Show', 'show', 'Show'],
] as const;

type CaptureReceipt = {
  path: string;
  bytes: number;
  sha256: string;
  locale: 'en' | 'es';
  viewport: {width: number; height: number};
  consoleErrors: number;
  pageErrors: number;
  failedRequests: number;
  forbiddenRequests: number;
  spanishTitleState: 'not-applicable' | 'english-source-fallback-disclosed';
};

const digest = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

async function selectOccurrence29(page: Page) {
  const player = page.locator(
    '[data-lesson-player="descriptor-driven-page-only-product-bridge"]',
  );
  await expect(player).toHaveAttribute('data-hydrated', 'true');
  await expect(player).toHaveAttribute('data-current-placement-id', placementId);
  await expect(player).toHaveAttribute('data-current-animation-id', animationId);
  return player;
}

async function runBoundedQa({
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
}): Promise<CaptureReceipt> {
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
  }, {
    key: storageKey,
    release: privateBridgeReleaseId,
    placement: placementId,
    language: locale,
  });
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
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    const explicitModernLocalPath =
      url.pathname === `/${locale}${route}` ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/flash-assets/courses/course-g04-l09-') ||
      url.pathname === '/learning-theme-bootstrap.js' ||
      url.pathname === '/robots.txt';
    if (
      url.origin !== allowedOrigin ||
      !explicitModernLocalPath ||
      /geturl|report|final-quiz-post|legacy-endpoint|xml-send/iu.test(url.href)
    ) forbiddenRequests.push(url.href);
  });

  const response = await page.goto(`/${locale}${route}`);
  expect(response?.status()).toBe(200);
  const player = await selectOccurrence29(page);
  await expect(player).toHaveAttribute('data-current-page', '29');
  await expect(player).toHaveAttribute('data-renderer-availability', 'registered');
  await expect(player).toHaveAttribute('data-unavailable-pages', '27');
  await expect(player).toHaveAttribute('data-page-audio-acceptance', 'not-established');
  await expect(player).toHaveAttribute('data-page-actionscript-execution', 'not-executed');

  const module = page.locator(
    `[data-private-current-js="true"][data-animation-id="${animationId}"]`,
  );
  const runtimeStage = module.locator('..');
  const runtimeShell = runtimeStage.locator('..');
  await expect(module).toBeVisible();
  await expect(module).toHaveAttribute('data-source-occurrence', '29');
  await expect(module).toHaveAttribute(
    'data-random-cycle-adapter',
    'rndAudio-source-array-seeded-cycle-v1',
  );
  await expect(module).toHaveAttribute('data-do-get-rnd-quest-adapter', 'not-applicable');
  await expect(module).toHaveAttribute('data-host-symbol-count', '20');
  await expect(module).toHaveAttribute('data-drag-correct', 'Scr2,Scr3,Scr4,Scr5');
  await expect(module).toHaveAttribute('data-drag-incorrect', 'Scr1,Scr6');
  await expect(module).toHaveAttribute('data-network-calls', '0');
  await expect(module).toHaveAttribute('data-original-runtime-validated', 'false');
  await expect(module).toHaveAttribute('data-fidelity-accepted', 'false');
  await expect(runtimeStage).toHaveAttribute('data-flash-frame-domain', 'sprite-134');
  await expect(runtimeStage).toHaveAttribute(
    'data-runtime-scenario',
    'p5-1-occurrence-29-bounded',
  );
  const initialChoiceOrder = await module.getAttribute('data-choice-order');
  const initialChoiceLabel = await module.getAttribute('data-choice-label');
  expect(initialChoiceOrder).toMatch(/^\d,\d,\d,\d$/u);
  expect(new Set(initialChoiceOrder!.split(','))).toEqual(new Set(['0', '1', '2', '3']));
  expect(initialChoiceLabel).toMatch(/^S[1-4]$/u);

  expect(await module.locator('[aria-label^="Glossary "]').count()).toBe(12);
  for (let index = 0; index < glossaryHandlers.length; index += 1) {
    const [sourceIntent, entryId, sourceKey] = glossaryHandlers[index]!;
    await module.getByRole('button', {
      name: `Glossary ${index + 1}: ${sourceIntent}`,
      exact: true,
    }).click();
    await expect(module).toHaveAttribute('data-host-decision', 'allowed');
    const dialog = page.locator(`[data-glossary-entry-id="${entryId}"]`);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-source-key-attribute', sourceKey);
    await expect(dialog).toHaveAttribute('data-glossary-storage', 'memory-only');
    await dialog.getByRole('button', {
      name: locale === 'en' ? 'Close and continue' : 'Cerrar y continuar',
    }).click();
  }

  const playAudio = () => module.getByRole('button', {
    name: locale === 'en' ? 'Play audio' : 'Reproducir audio',
    exact: true,
  });
  await playAudio().click();
  await expect(module).toHaveAttribute('data-audio-lifecycle', 'requested');
  await expect(runtimeShell).toHaveAttribute(
    'data-interactive-audio-playing',
    `${animationId}-narration`,
  );
  await module.getByRole('button', {
    name: locale === 'en' ? 'Replay' : 'Repetir',
    exact: true,
  }).click();
  await expect(module).toHaveAttribute('data-audio-lifecycle', 'idle');
  await expect(module).toHaveAttribute('data-try-count', '0');
  await expect(module).toHaveAttribute('data-question-index', '1');
  await expect(module).toHaveAttribute('data-correct-placements', '');
  const replayChoiceOrder = await module.getAttribute('data-choice-order');
  const replayChoiceLabel = await module.getAttribute('data-choice-label');
  expect(replayChoiceOrder).toMatch(/^\d,\d,\d,\d$/u);
  expect(new Set(replayChoiceOrder!.split(','))).toEqual(
    new Set(['0', '1', '2', '3']),
  );
  expect(replayChoiceLabel).toBe(
    `S${Number(replayChoiceOrder!.split(',')[0]!) + 1}`,
  );
  await expect(runtimeShell).not.toHaveAttribute('data-interactive-audio-playing', /.+/u);

  const drops = locale === 'en'
    ? ['Drop Scr1', 'Drop Scr2', 'Drop Scr3', 'Drop Scr4', 'Drop Scr5']
    : ['Soltar Scr1', 'Soltar Scr2', 'Soltar Scr3', 'Soltar Scr4', 'Soltar Scr5'];
  const feedback = locale === 'en'
    ? ['Try the next question.', 'Correct.', 'Correct.', 'Correct.']
    : ['Inténtalo de nuevo en la próxima pregunta.', 'Correcto.', 'Correcto.', 'Correcto.'];
  for (let index = 0; index < drops.length; index += 1) {
    await module.getByRole('button', {name: drops[index]!, exact: true}).click();
    await expect(module).toHaveAttribute('data-try-count', String(index + 1));
    await expect(module).toHaveAttribute('data-score', String(Math.max(0, index)));
    if (index < 4) {
      await expect(module.locator('[data-feedback]')).toHaveText(feedback[index]!);
      await module.getByRole('button', {
        name: locale === 'en' ? 'Next' : 'Siguiente',
        exact: true,
      }).click();
    }
  }
  await expect(module).toHaveAttribute('data-terminal', 'true');
  await expect(module).toHaveAttribute('data-score', '4');
  await expect(module).toHaveAttribute('data-correct-placement-count', '4');
  await expect(module).toHaveAttribute('data-correct-placements', 'Scr2,Scr3,Scr4,Scr5');
  await expect(module.locator('[data-final="true"]')).toContainText('Final: 4/4');
  await module.locator('[data-final="true"] button').click();
  await expect(module).toHaveAttribute('data-terminal', 'false');
  await expect(module).toHaveAttribute('data-score', '0');
  await expect(module).toHaveAttribute('data-attempts', '0');
  await expect(module).toHaveAttribute('data-try-count', '0');
  await expect(module).toHaveAttribute('data-correct-placement-count', '0');
  await expect(module).toHaveAttribute('data-correct-placements', '');
  const completedReplayChoiceOrder = await module.getAttribute('data-choice-order');
  const completedReplayChoiceLabel = await module.getAttribute('data-choice-label');
  expect(completedReplayChoiceOrder).toMatch(/^\d,\d,\d,\d$/u);
  expect(new Set(completedReplayChoiceOrder!.split(','))).toEqual(
    new Set(['0', '1', '2', '3']),
  );
  expect(completedReplayChoiceLabel).toBe(
    `S${Number(completedReplayChoiceOrder!.split(',')[0]!) + 1}`,
  );

  await playAudio().click();
  await expect(module).toHaveAttribute('data-audio-lifecycle', 'requested');
  const shellReplay = player.locator(
    'button[data-responsive-focus-key="replay"]:visible',
  );
  await expect(shellReplay).toHaveCount(1);
  await shellReplay.click();
  await expect(module).toHaveAttribute('data-audio-lifecycle', 'idle');
  await expect(module).toHaveAttribute('data-try-count', '0');
  await expect(runtimeShell).not.toHaveAttribute('data-interactive-audio-playing', /.+/u);

  await playAudio().click();
  await expect(module).toHaveAttribute('data-audio-lifecycle', 'requested');
  await page.getByRole('button', {
    name: locale === 'en' ? 'Next page' : 'Página siguiente',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '30');
  await expect(page.locator(
    '[data-runtime-presentation="modern-wide"][data-interactive-audio-playing]',
  )).toHaveCount(0);
  await page.getByRole('button', {
    name: locale === 'en' ? '← Previous' : '← Anterior',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '29');
  await expect(module).toHaveAttribute('data-try-count', '0');
  await page.getByRole('button', {
    name: locale === 'en' ? '← Previous' : '← Anterior',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '28');
  await page.getByRole('button', {
    name: locale === 'en' ? 'Next page' : 'Página siguiente',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '29');
  await expect(module).toHaveAttribute('data-network-calls', '0');

  let spanishTitleState: CaptureReceipt['spanishTitleState'] = 'not-applicable';
  if (locale === 'es') {
    await expect(page.getByText(
      'La fuente no proporciona un título en español; se conserva el título original en inglés.',
      {exact: true},
    )).toBeVisible();
    await expect(page.getByText(
      'El candidato visual current-JS permanece limitado al contenido fuente en inglés.',
      {exact: true},
    )).toBeVisible();
    spanishTitleState = 'english-source-fallback-disclosed';
  }

  const relativeOutput =
    `reports/browser-qa/g4-l9-p5-1/${outputDirectory}/029-course-g04-l09-ti-004.png`;
  const output = path.join(repositoryRoot, relativeOutput);
  await mkdir(path.dirname(output), {recursive: true});
  await page.screenshot({animations: 'disabled', fullPage: true, path: output});
  const bytes = await readFile(output);
  expect(consoleErrors, 'browser console errors').toEqual([]);
  expect(pageErrors, 'uncaught page errors').toEqual([]);
  expect(failedRequests, 'failed browser requests').toEqual([]);
  expect(forbiddenRequests, 'external, legacy, or unknown requests').toEqual([]);
  await context.close();
  return {
    path: relativeOutput,
    bytes: bytes.length,
    sha256: digest(bytes),
    locale,
    viewport,
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length,
    failedRequests: failedRequests.length,
    forbiddenRequests: forbiddenRequests.length,
    spanishTitleState,
  };
}

test('P5.1 occurrence-29 bounded QA passes real modern My Lesson desktop EN and mobile ES', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(240_000);
  expect(baseURL).toBeTruthy();
  const captures = [
    await runBoundedQa({
      browser,
      baseURL: baseURL!,
      locale: 'en',
      viewport: {width: 1440, height: 1000},
      outputDirectory: 'desktop-en-1440x1000',
    }),
    await runBoundedQa({
      browser,
      baseURL: baseURL!,
      locale: 'es',
      viewport: {width: 390, height: 844},
      outputDirectory: 'mobile-es-390x844',
    }),
  ];
  const receipt = {
    schemaVersion: 1,
    artifactKind: 'g4-l9-p5-1-occurrence-29-browser-qa-receipt',
    taskId,
    result: 'PASS',
    browser: 'Playwright Chromium against the real local modern My Lesson host',
    route,
    privateOnly: true,
    defaultProductionRoute: '404-required-separate-build-gate',
    exercised: [
      'deterministic-S1-S4-random-cycle',
      'Scr1-through-Scr6-source-outcomes',
      '12-source-glossary-handlers-and-explicit-typo-alias',
      'correct-and-incorrect-feedback',
      'four-unique-correct-terminal-state',
      'try-and-choice-state',
      'renderer-Replay-complete-reset-with-active-audio',
      'modern-My-Lesson-Replay-complete-reset-with-active-audio',
      'Previous-and-Next-navigation',
      'navigation-unmount-audio-stop-and-state-reset',
      'Spanish-source-title-fallback-disclosure',
      'deny-external-legacy-and-unknown-network',
    ],
    captures,
    authorityEffects: {
      originalRuntimeAccepted: false,
      fidelityAccepted: false,
      audioListeningAccepted: false,
      humanOwnerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
      productionVerified: false,
    },
  };
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    flag: 'wx',
  });
});
