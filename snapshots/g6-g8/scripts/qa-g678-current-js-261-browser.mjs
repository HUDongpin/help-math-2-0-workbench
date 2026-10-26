#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const base = process.env.HELP_MATH_G678_QA_BASE_URL ?? 'http://127.0.0.1:3318';
const parsedBase = new URL(base);
invariant(parsedBase.protocol === 'http:' &&
  parsedBase.hostname === '127.0.0.1' &&
  parsedBase.username === '' && parsedBase.password === '' &&
  parsedBase.pathname === '/' && parsedBase.search === '' &&
  parsedBase.hash === '',
'G678 browser QA base must be one loopback HTTP origin');
const output = 'output/playwright/g678-current-js-261-v2';
const PATHS = Object.freeze({
  freeze: 'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  launcher: 'scripts/run-g678-local-preview.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  glossaryHost:
    'packages/demos/src/private-source-static-glossary-candidate.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const REGISTRY_PATHS = Object.freeze({
  privateRegistry: Object.freeze({
    live: 'packages/demos/private-current-js-registry.json',
    snapshot: `${output}/private-current-js-registry.snapshot.json`,
  }),
  localRegistry: Object.freeze({
    live: 'packages/demos/src/registry.local-only.metadata.generated.ts',
    snapshot: `${output}/registry.local-only.metadata.generated.snapshot.ts`,
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

async function binding(relativePath, json = false) {
  const absolute = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

async function absoluteBinding(requestedPath) {
  const absolute = path.resolve(requestedPath);
  const canonical = await realpath(absolute);
  const before = await lstat(canonical, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    'Chromium executable must be one canonical ordinary file');
  const bytes = await readFile(canonical);
  const after = await lstat(canonical, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  'Chromium executable changed during read');
  return Object.freeze({requestedPath: absolute, realPath: canonical,
    bytes: bytes.length, sha256: sha256(bytes)});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

async function currentInputs({check}) {
  const jsonKeys = new Set(['freeze', 'catalog']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key,
      await binding(relativePath, jsonKeys.has(key))],
  ));
  const values = Object.fromEntries(entries);
  const registryEntries = await Promise.all(Object.entries(REGISTRY_PATHS).map(
    async ([key, paths]) => {
      const source = await binding(check ? paths.snapshot : paths.live,
        key === 'privateRegistry');
      return [key, check ? source : Object.freeze({...source,
        path: paths.snapshot})];
    },
  ));
  Object.assign(values, Object.fromEntries(registryEntries));
  const script = await binding(path.relative(ROOT, SCRIPT_PATH));
  const executable = await absoluteBinding(chromium.executablePath());
  const freeze = values.freeze.value;
  const privateCalibration = values.privateRegistry.value.calibrations.find(
    (calibration) =>
      calibration.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(freeze.registrationCandidatePlacementCount === 261 &&
    freeze.selectedPages.length === 261 &&
    new Set(freeze.selectedPages.map((page) => page.animationId)).size === 261 &&
    privateCalibration?.entries?.length === 261 &&
    privateCalibration?.freezeManifestSha256 === values.freeze.sha256 &&
    values.localRegistry.buffer.toString('utf8').includes(
      'export const registeredLocalOnlyAnimationKeys') &&
    values.localRegistry.buffer.toString('utf8').match(/'shared-/gu)?.length >=
      261 &&
    values.productBridge.bytes > 0 && values.glossaryHost.bytes > 0 &&
    values.sourceStaticHost.bytes > 0,
  '261-page QA input identity drifted');
  return Object.freeze({values, descriptors: Object.freeze({
    ...Object.fromEntries(Object.entries(values).map(([key, value]) =>
      [key, descriptor(value)])),
    script: descriptor(script),
    chromiumExecutable: executable,
  }), snapshotBytes: check ? null : Object.freeze(Object.fromEntries(
    registryEntries.map(([key, value]) => [key, value.buffer])))});
}

function lessonExpectations(catalog, freeze) {
  const counts = new Map();
  for (const page of freeze.selectedPages) {
    counts.set(page.stableLessonKey,
      (counts.get(page.stableLessonKey) ?? 0) + 1);
  }
  const lessons = catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.pages.length,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  }));
  invariant(lessons.length === 44 &&
    lessons.every((lesson) => lesson.registeredPageCount > 0 &&
      lesson.registeredPageCount < lesson.activePageCount) &&
    lessons.reduce((sum, lesson) => sum + lesson.registeredPageCount, 0) === 261,
  '261-page lesson vector drifted');
  return Object.freeze(lessons);
}

function sampleExpectations(freeze) {
  const pureLinearPages = freeze.selectedPages.filter((page) =>
    page.adapterFamily === 'pure-linear-source-static');
  const pureSamples = ['ALG001', 'DAT001', 'GEO001', 'NMS002'].map(
    (moduleCode) => {
      const candidates = pureLinearPages.filter((page) =>
        page.moduleCode === moduleCode).sort((left, right) =>
        left.runtime.canvasRenderer.bytes - right.runtime.canvasRenderer.bytes);
      invariant(candidates.length > 0,
        `no pure-linear sample for ${moduleCode}`);
      return candidates[0];
    });
  const fq01 = freeze.selectedPages.find((page) =>
    page.animationId === 'shared-alg001-l01-p055' &&
      page.adapterFamily === 'final-quiz-intro-source-static');
  invariant(fq01, 'final 261 freeze lacks the calibrated FQ01 representative');
  const ts03Ids = [
    'shared-alg001-l01-p048',
    'shared-alg001-l03-p048',
    'shared-nms002-l01-p039',
  ];
  const ts03 = ts03Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts03-l1-glossary-source-static'));
  invariant(ts03.every(Boolean),
    'final 261 freeze lacks the three TS03 behavior-shape samples');
  const ts02Ids = [
    'shared-alg001-l01-p047',
    'shared-alg001-l04-p044',
    'shared-alg001-l09-p032',
    'shared-alg001-l10-p043',
    'shared-dat001-l01-p047',
    'shared-nms002-l01-p038',
  ];
  const ts02 = ts02Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts02-l1-glossary-source-static'));
  invariant(ts02.every(Boolean),
    'final 261 freeze lacks the six TS02 behavior-shape samples');
  const ts04Ids = [
    'shared-alg001-l01-p049',
    'shared-alg001-l04-p046',
    'shared-alg001-l10-p045',
    'shared-dat001-l01-p049',
    'shared-geo001-l01-p052',
    'shared-nms002-l01-p040',
  ];
  const ts04 = ts04Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts04-l1-glossary-source-static'));
  invariant(ts04.every(Boolean),
    'final 261 freeze lacks the six TS04 behavior-shape samples');
  return Object.freeze([...pureSamples, fq01, ...ts03, ...ts02, ...ts04]);
}

async function screenshotBinding(stage, fileName) {
  const bytes = await readFile(path.join(stage, fileName));
  return Object.freeze({path: `${output}/${fileName}`, bytes: bytes.length,
    sha256: sha256(bytes)});
}

async function buildEvidence(inputs) {
  const outputAbsolute = projectPath(output);
  invariant(!await lstat(outputAbsolute).then(() => true, () => false),
    `${output} already exists`);
  const stage = `${outputAbsolute}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  invariant(inputs.snapshotBytes, 'browser QA build requires registry snapshots');
  await Promise.all([
    writeFile(path.join(stage, 'private-current-js-registry.snapshot.json'),
      inputs.snapshotBytes.privateRegistry, {flag: 'wx'}),
    writeFile(path.join(stage,
      'registry.local-only.metadata.generated.snapshot.ts'),
    inputs.snapshotBytes.localRegistry, {flag: 'wx'}),
  ]);
  const browser = await chromium.launch({headless: true});
  const browserIdentity = Object.freeze({name: 'Chromium',
    version: browser.version(), executable: inputs.descriptors.chromiumExecutable});
  const freeze = inputs.values.freeze.value;
  const expectedLessons = lessonExpectations(inputs.values.catalog.value, freeze);
  const samples = sampleExpectations(freeze);
  const evidence = {
    schemaVersion: 1,
    artifactType: 'g678-current-js-261-browser-qa-v1',
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    inputs: inputs.descriptors,
    browser: browserIdentity,
    frozenCalibrationPlacementCount: freeze.frozenCalibrationPlacementCount,
    registeredCurrentJsPages: freeze.selectedPages.length,
    allLessons: null,
    samples: [],
    screenshots: [],
    acceptanceEffects: Object.freeze({authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false, audioAccepted: false,
      humanVisualAccepted: false, ownerAccepted: false,
      strictComplete: false, released: false, published: false}),
  };
  try {
    const allLessonsPage = await browser.newPage(
      {viewport: {width: 1440, height: 1100}});
    const allLessonsConsoleErrors = [];
    const allLessonsPageErrors = [];
    allLessonsPage.on('console', (message) => {
      if (message.type() === 'error') allLessonsConsoleErrors.push(message.text());
    });
    allLessonsPage.on('pageerror', (error) =>
      allLessonsPageErrors.push(String(error)));
    await allLessonsPage.goto(`${base}/en?screen=lessons`,
      {waitUntil: 'networkidle'});
    await allLessonsPage.getByRole('button', {name: 'G6–G8 shared'}).click();
    await allLessonsPage.waitForFunction(() =>
      document.querySelectorAll('[data-workspace-screen="lessons"] article')
        .length === 44);
    const lessonScreen = allLessonsPage.locator('[data-workspace-screen="lessons"]');
    const cards = lessonScreen.locator('article');
    const cardCopy = await cards.locator('[data-lesson-card-copy]').allTextContents();
    const statusCopy = await cards.locator('[data-lesson-card-status]').allTextContents();
    const browserLessons = cardCopy.map((copy, index) => {
      const identity = copy.match(
        /G6–G8 shared · (NMS002|GEO001|ALG001|DAT001) · L(\d+)/u);
      const progress = copy.match(/(\d+)\/(\d+) pages registered/u);
      invariant(identity && progress, `invalid shared lesson card: ${copy}`);
      const expected = expectedLessons[index];
      const observed = {moduleCode: identity[1], lessonNumber: Number(identity[2]),
        registeredPageCount: Number(progress[1]),
        activePageCount: Number(progress[2])};
      invariant(expected.moduleCode === observed.moduleCode &&
        expected.lessonNumber === observed.lessonNumber &&
        expected.registeredPageCount === observed.registeredPageCount &&
        expected.activePageCount === observed.activePageCount,
      `shared lesson browser vector drifted at ${expected.stableLessonKey}`);
      return Object.freeze({...expected});
    });
    invariant(browserLessons.length === 44 &&
      browserLessons.reduce((sum, lesson) =>
        sum + lesson.registeredPageCount, 0) === 261 &&
      statusCopy.every((copy) => copy.includes('Mapping pending')) &&
      await lessonScreen.locator('a').count() === 0 &&
      allLessonsConsoleErrors.length === 0 && allLessonsPageErrors.length === 0,
    'All Lessons browser contract drifted');
    const allLessonsFile = 'all-lessons-44-partial.png';
    await allLessonsPage.screenshot({path: path.join(stage, allLessonsFile),
      fullPage: true});
    evidence.allLessons = {sharedCardCount: browserLessons.length,
      linkedCardCount: 0, registeredPageSum: 261,
      exactLessonVector: browserLessons,
      consoleErrors: allLessonsConsoleErrors, pageErrors: allLessonsPageErrors};
    evidence.screenshots.push(await screenshotBinding(stage, allLessonsFile));
    await allLessonsPage.close();

    for (const sample of samples) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
      const consoleErrors = [];
      const pageErrors = [];
      const assetResponses = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      page.on('response', (response) => {
        if (response.url().includes(
          `/flash-assets/g678-local/${sample.animationId}/canvas-renderer.js`)) {
          const headers = response.headers();
          assetResponses.push({url: response.url(), status: response.status(),
            cacheControl: headers['cache-control'] ?? null,
            contentType: headers['content-type'] ?? null,
            corp: headers['cross-origin-resource-policy'] ?? null,
            nosniff: headers['x-content-type-options'] ?? null});
        }
      });
      await page.goto(
        `${base}/en/migration-status/g678-calibration/${sample.animationId}`,
        {waitUntil: 'domcontentloaded'});
      await page.waitForFunction((animationId) =>
        document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
          ?.getAttribute('data-render-state') === 'ready',
      sample.animationId, {timeout: 45_000});
      const stageElement = page.locator('.runtime-stage');
      const shell = page.locator('.runtime-shell');
      const initialFrame = Number(await stageElement.getAttribute('data-flash-frame'));
      await page.waitForFunction((previous) => Number(
        document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'))
          > previous, initialFrame, {timeout: 5_000});
      const progressedFrame = Number(
        await stageElement.getAttribute('data-flash-frame'));
      const expectedAssetUrl = `${base}/flash-assets/g678-local/` +
        `${sample.animationId}/canvas-renderer.js?sha256=` +
        sample.runtime.canvasRenderer.sha256;
      invariant(assetResponses.length === 1 &&
        assetResponses[0].url === expectedAssetUrl &&
        assetResponses[0].status === 200 &&
        assetResponses[0].corp === 'same-origin' &&
        assetResponses[0].nosniff === 'nosniff' &&
        assetResponses[0].cacheControl === 'private, no-store, max-age=0' &&
        assetResponses[0].contentType?.startsWith('text/javascript') &&
        consoleErrors.length === 0 && pageErrors.length === 0 &&
        await shell.getAttribute('data-runtime-playback-complete') === 'false',
      `${sample.animationId} browser/asset policy drifted`);
      let glossary = null;
      const isTs03 = sample.adapterFamily ===
        'ts03-l1-glossary-source-static';
      const isTs02 = sample.adapterFamily ===
        'ts02-l1-glossary-source-static';
      const isTs04 = sample.adapterFamily ===
        'ts04-l1-glossary-source-static';
      if (isTs03 || isTs02 || isTs04) {
        const waitForEnabledButton = async (name) => {
          await page.getByRole('button', {name, exact: true})
            .waitFor({state: 'visible'});
          await page.waitForFunction((label) => {
            const button = [...document.querySelectorAll('button')].find(
              (candidate) => candidate.textContent?.trim() === label);
            return button instanceof HTMLButtonElement && !button.disabled;
          }, name, {timeout: 10_000});
        };
        const verifyTerm = async ({button, entryId, definition}) => {
          await waitForEnabledButton(button);
          await page.getByRole('button', {name: button, exact: true}).click();
          const overlay = page.locator(
            `[data-glossary-entry-id="${entryId}"]`,
          );
          await overlay.waitFor({state: 'visible'});
          invariant((await overlay.textContent()).includes(definition) &&
            await shell.getAttribute('data-runtime-paused') === 'true',
          `${sample.animationId} ${entryId} glossary overlay drifted`);
          await overlay.getByRole('button', {name: 'Close and continue'}).click();
          invariant(await shell.getAttribute('data-runtime-paused') === 'false',
            `${sample.animationId} glossary close did not resume`);
          return Object.freeze({button, entryId, definition});
        };
        const englishDefinitions = isTs02 ? [
          {button: 'Restate', entryId: 'restate',
            definition: 'To repeat again; to say again'},
          {button: 'Question', entryId: 'question',
            definition:
              'A problem to solve. For example: Find the mean of this set of numbers {1, 2, 5, 10}'},
          {button: 'Problem', entryId: 'problem',
            definition:
              'A question to solve or answer. For example: Evaluate the equation y = 2x + 3'},
        ] : isTs03 ? [
          {button: 'Organize', entryId: 'organize',
            definition:
              'To organize means to put into order; to arrange in a desired pattern.'},
          {button: 'Information', entryId: 'information',
            definition:
              'A collection of facts or data. For example: José is 15 years old. José has a cell phone.'},
        ] : [
          {button: 'Solve', entryId: 'solve',
            definition:
              'To solve the problem is another way of finding the answer.'},
          {button: 'Problem', entryId: 'problem',
            definition:
              'A question to solve or answer. For example: Evaluate the equation y = 2x + 3'},
          {button: 'Strategies', entryId: 'strategies',
            definition: 'A plan of action. For example: Juanita plans to use a calculator'},
          ...(sample.animationId === 'shared-alg001-l01-p049' ? [{
            button: 'Data Tables', entryId: 'data-tables',
            definition:
              'Data tables are organized by columns and rows created to easily view information.',
          }] : []),
          {button: 'Equation', entryId: 'equation',
            definition:
              'A mathematical sentence where both sides of the equal sign (=) have the same value'},
          {button: 'Pattern', entryId: 'pattern',
            definition: 'A repeated set or sequence of numbers, shapes or designs'},
          {button: 'Table', entryId: 'table',
            definition: 'A diagram, graph or table showing information in an ordered way.'},
          {button: 'Simple / Simpler / Simplest',
            entryId: 'simple-simpler-simplest',
            definition: 'To put something in its easiest form to understand.'},
        ];
        const englishTerms = [];
        for (const definition of englishDefinitions) {
          englishTerms.push(await verifyTerm(definition));
        }
        let spanishTerms = null;
        const spanishSample =
          sample.animationId === 'shared-alg001-l03-p048' ||
          sample.animationId === 'shared-alg001-l10-p043' ||
          sample.animationId === 'shared-alg001-l01-p049';
        if (spanishSample) {
          const spanish = await browser.newPage(
            {viewport: {width: 1440, height: 1000}});
          const spanishErrors = [];
          spanish.on('console', (message) => {
            if (message.type() === 'error') spanishErrors.push(message.text());
          });
          await spanish.goto(
            `${base}/es/migration-status/g678-calibration/${sample.animationId}`,
            {waitUntil: 'domcontentloaded'});
          await spanish.waitForFunction((animationId) =>
            document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
              ?.getAttribute('data-render-state') === 'ready',
          sample.animationId, {timeout: 45_000});
          const spanishShell = spanish.locator('.runtime-shell');
          const verifySpanishTerm = async ({button, entryId, definition}) => {
            await spanish.getByRole('button', {name: button, exact: true})
              .waitFor({state: 'visible'});
            await spanish.waitForFunction((label) => {
              const element = [...document.querySelectorAll('button')].find(
                (candidate) => candidate.textContent?.trim() === label);
              return element instanceof HTMLButtonElement && !element.disabled;
            }, button, {timeout: 10_000});
            await spanish.getByRole('button', {name: button}).click();
            const overlay = spanish.locator(
              `[data-glossary-entry-id="${entryId}"]`,
            );
            await overlay.waitFor({state: 'visible'});
            invariant((await overlay.textContent()).includes(definition) &&
              await spanishShell.getAttribute('data-runtime-paused') === 'true',
            `${sample.animationId} Spanish ${entryId} glossary drifted`);
            await overlay.getByRole('button',
              {name: 'Cerrar y continuar'}).click();
            invariant(await spanishShell.getAttribute('data-runtime-paused') ===
              'false', `${sample.animationId} Spanish glossary did not resume`);
            return Object.freeze({button, entryId, definition});
          };
          const spanishDefinitions = isTs02 ? [
            {button: 'Replantear', entryId: 'restate',
              definition: 'Volver a repetir; decir de nuevo.'},
            {button: 'Pregunta', entryId: 'question',
              definition:
                'Un problema para resolver. Por ejemplo: Encontrar el promedio de este conjunto de números: {1,2,5,10}'},
            {button: 'Problema', entryId: 'problem',
              definition:
                'Una pregunta para resolver o contestar. Por ejemplo: Evalúe la ecuación y = 2x + 3'},
          ] : isTs03 ? [
            {button: 'Organizar', entryId: 'organize',
              definition:
                'Organizar significa poner en orden, ordenar de acuerdo a un patrón deseado.'},
            {button: 'Información', entryId: 'information',
              definition:
                'Colección de datos o hechos. Por ejemplo: José tiene 15 años. José tiene un teléfono celular.'},
          ] : [
            {button: 'Resolver', entryId: 'solve',
              definition:
                'Resolver el problema es otra manera de encontrar la respuesta.'},
            {button: 'Problema', entryId: 'problem',
              definition:
                'Una pregunta para resolver o contestar. Por ejemplo: Evalúe la ecuación y = 2x + 3'},
            {button: 'Estrategias', entryId: 'strategies',
              definition: 'Un plan de acción. Por ejemplo: Juanita planea usar la calculadora'},
            {button: 'Tablas de datos', entryId: 'data-tables',
              definition:
                'Las tablas de datos están organizadas en columnas y filas'},
            {button: 'Ecuación', entryId: 'equation',
              definition: 'Enunciado de una igualdad en la cual ambos lados del signo igual'},
            {button: 'Patrón', entryId: 'pattern',
              definition: 'Una secuencia o conjunto de números que se repiten'},
            {button: 'Cuadro', entryId: 'table',
              definition: 'Un diagrama, gráfica o tabla que presenta información'},
            {button: 'Simple / Más Simple / El Más simple',
              entryId: 'simple-simpler-simplest',
              definition: 'Es poner algo en su forma más fácil de entender.'},
          ];
          spanishTerms = [];
          for (const definition of spanishDefinitions) {
            spanishTerms.push(await verifySpanishTerm(definition));
          }
          invariant(spanishErrors.length === 0,
            `${sample.animationId} Spanish console errors`);
          await spanish.close();
        }
        glossary = {englishTerms, spanishTerms,
          pausedWhileOpen: true, resumedAfterClose: true};
      }
      evidence.samples.push({animationId: sample.animationId,
        moduleCode: sample.moduleCode, stableLessonKey: sample.stableLessonKey,
        frameDomain: sample.runtime.frameDomain,
        frameCount: sample.runtime.frameCount,
        runtimeSha256: sample.runtime.canvasRenderer.sha256,
        initialFrame, progressedFrame,
        canvasState: await page.locator(
          `canvas[data-course-canvas="${sample.animationId}"]`)
          .getAttribute('data-render-state'),
        playbackComplete: 'false', assetResponses, consoleErrors, pageErrors,
        glossary});
      const screenshotFile = `${sample.animationId}.png`;
      await page.screenshot({path: path.join(stage, screenshotFile),
        fullPage: true});
      evidence.screenshots.push(await screenshotBinding(stage, screenshotFile));
      await page.close();
    }
    await writeFile(path.join(stage, 'evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`, {flag: 'wx'});
    await rename(stage, outputAbsolute);
    return evidence;
  } catch (error) {
    await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

async function checkEvidence(inputs) {
  const evidence = (await binding(`${output}/evidence.json`, true)).value;
  invariant(JSON.stringify(evidence.inputs) ===
    JSON.stringify(inputs.descriptors), 'browser QA input bindings drifted');
  const browser = await chromium.launch({headless: true});
  const version = browser.version();
  await browser.close();
  invariant(evidence.browser.version === version &&
    JSON.stringify(evidence.browser.executable) ===
      JSON.stringify(inputs.descriptors.chromiumExecutable),
  'browser QA Chromium identity drifted');
  const expectedLessons = lessonExpectations(inputs.values.catalog.value,
    inputs.values.freeze.value);
  const expectedSamples = sampleExpectations(inputs.values.freeze.value);
  const expectedScreenshotPaths = [
    `${output}/all-lessons-44-partial.png`,
    ...expectedSamples.map((sample) => `${output}/${sample.animationId}.png`),
  ];
  invariant(evidence.baseUrl === base &&
    evidence.registeredCurrentJsPages === 261 &&
    evidence.allLessons.sharedCardCount === 44 &&
    evidence.allLessons.linkedCardCount === 0 &&
    evidence.allLessons.registeredPageSum === 261 &&
    JSON.stringify(evidence.allLessons.exactLessonVector) ===
      JSON.stringify(expectedLessons) &&
    evidence.allLessons.consoleErrors.length === 0 &&
    evidence.allLessons.pageErrors.length === 0 &&
    evidence.samples.length === 20 &&
    evidence.samples.every((sample, index) => {
      const expected = expectedSamples[index];
      const expectedAssetUrl = `${base}/flash-assets/g678-local/` +
        `${expected.animationId}/canvas-renderer.js?sha256=` +
        expected.runtime.canvasRenderer.sha256;
      const response = sample.assetResponses[0];
      const isTs03 = expected.adapterFamily ===
        'ts03-l1-glossary-source-static';
      const isTs02 = expected.adapterFamily ===
        'ts02-l1-glossary-source-static';
      const isTs04 = expected.adapterFamily ===
        'ts04-l1-glossary-source-static';
      const expectedEnglishTermCount = isTs02 ? 3 : isTs03 ? 2 :
        isTs04 ? expected.animationId === 'shared-alg001-l01-p049' ? 8 : 7 : 0;
      const expectedSpanishTermCount =
        expected.animationId === 'shared-alg001-l01-p049' ? 8 :
        expected.animationId === 'shared-alg001-l10-p043' ? 3 :
          expected.animationId === 'shared-alg001-l03-p048' ? 2 : 0;
      const glossaryValid = isTs03 || isTs02 || isTs04
        ? sample.glossary?.englishTerms?.length === expectedEnglishTermCount &&
          sample.glossary.pausedWhileOpen === true &&
          sample.glossary.resumedAfterClose === true &&
          (expectedSpanishTermCount > 0
            ? sample.glossary.spanishTerms?.length === expectedSpanishTermCount
            : sample.glossary.spanishTerms === null)
        : sample.glossary === null;
      return sample.animationId === expected.animationId &&
        sample.moduleCode === expected.moduleCode &&
        sample.stableLessonKey === expected.stableLessonKey &&
        sample.frameDomain === expected.runtime.frameDomain &&
        sample.frameCount === expected.runtime.frameCount &&
        sample.runtimeSha256 === expected.runtime.canvasRenderer.sha256 &&
        sample.canvasState === 'ready' &&
        sample.progressedFrame > sample.initialFrame &&
        sample.playbackComplete === 'false' &&
        sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
        sample.assetResponses.length === 1 &&
        response.url === expectedAssetUrl && response.status === 200 &&
        response.corp === 'same-origin' && response.nosniff === 'nosniff' &&
        response.cacheControl === 'private, no-store, max-age=0' &&
        glossaryValid &&
        response.contentType?.startsWith('text/javascript');
    }) &&
    JSON.stringify(evidence.screenshots.map((item) => item.path)) ===
      JSON.stringify(expectedScreenshotPaths) &&
    JSON.stringify(evidence.acceptanceEffects) === JSON.stringify({
      authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    }),
  'browser QA product assertions drifted');
  for (const screenshot of evidence.screenshots) {
    const current = await binding(screenshot.path);
    invariant(current.bytes === screenshot.bytes &&
      current.sha256 === screenshot.sha256,
    `${screenshot.path} drifted`);
  }
  return evidence;
}

const args = process.argv.slice(2);
invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
  'usage: qa-g678-current-js-261-browser.mjs [--check]');
const check = args[0] === '--check';
const inputs = await currentInputs({check});
const evidence = check ? await checkEvidence(inputs) : await buildEvidence(inputs);
process.stdout.write(`${JSON.stringify({check,
  evidence: `${output}/evidence.json`,
  registeredCurrentJsPages: evidence.registeredCurrentJsPages,
  sharedLessonCards: evidence.allLessons.sharedCardCount,
  linkedLessonCards: evidence.allLessons.linkedCardCount,
  sampledModules: evidence.samples.map((sample) => sample.moduleCode),
  screenshotCount: evidence.screenshots.length,
  acceptanceEffects: evidence.acceptanceEffects}, null, 2)}\n`);
