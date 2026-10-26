#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-ts05-l1-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-ts05-family-audit-v1.json',
  recovery: 'catalog/g678-ts05-l1-keyterm-recovery-v1.json',
  generator: 'scripts/build-g678-ts05-l1-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-ts05-l1-current-js-15-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-ts05-l1-current-js-15-v1.fragment.json',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-276-v2/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-276-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  glossaryHost:
    'packages/demos/src/private-source-static-glossary-candidate.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const SAMPLE_IDS = Object.freeze([
  'shared-alg001-l01-p050',
  'shared-alg001-l02-p052',
  'shared-alg001-l07-p056',
  'shared-dat001-l01-p050',
  'shared-geo001-l01-p053',
  'shared-nms002-l01-p041',
]);
const ENGLISH_TERMS = Object.freeze([
  Object.freeze({button: 'Strategies', entryId: 'strategies',
    definition: 'A plan of action. For example: Juanita plans to use a calculator'}),
  Object.freeze({button: 'Equation', entryId: 'equation',
    definition:
      'A mathematical sentence where both sides of the equal sign (=) have the same value'}),
  Object.freeze({button: 'Pattern', entryId: 'pattern',
    definition: 'A repeated set or sequence of numbers, shapes or designs'}),
  Object.freeze({button: 'Table', entryId: 'table',
    definition: 'A diagram, graph or table showing information in an ordered way.'}),
  Object.freeze({button: 'Simple / Simpler / Simplest',
    entryId: 'simple-simpler-simplest',
    definition: 'To put something in its easiest form to understand.'}),
  Object.freeze({button: 'Show', entryId: 'show',
    definition: 'To show means to be visible or to be displayed or seen.'}),
]);
const SPANISH_TERMS = Object.freeze([
  Object.freeze({button: 'Estrategias', entryId: 'strategies',
    definition: 'Un plan de acción. Por ejemplo: Juanita planea usar la calculadora'}),
  Object.freeze({button: 'Ecuación', entryId: 'equation',
    definition: 'Enunciado de una igualdad en la cual ambos lados del signo igual'}),
  Object.freeze({button: 'Patrón', entryId: 'pattern',
    definition: 'Una secuencia o conjunto de números que se repiten'}),
  Object.freeze({button: 'Cuadro', entryId: 'table',
    definition: 'Un diagrama, gráfica o tabla que presenta información'}),
  Object.freeze({button: 'Simple / Más Simple / El Más simple',
    entryId: 'simple-simpler-simplest',
    definition: 'Es poner algo en su forma más fácil de entender.'}),
  Object.freeze({button: 'Mostrar', entryId: 'show',
    definition: 'Mostrar significa enseñar o ser visto.'}),
]);
const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath),
  'calibration input must be project-relative');
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, {json = false} = {}) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function exactArray(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function validateSample(sample, expectedPage) {
  invariant(sample.animationId === expectedPage.animationId &&
    sample.frameDomain === expectedPage.runtime.frameDomain &&
    sample.frameCount === expectedPage.runtime.frameCount &&
    sample.runtimeSha256 === expectedPage.runtime.canvasRenderer.sha256 &&
    sample.canvasState === 'ready' &&
    sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1,
  `${sample.animationId}: TS05 browser playback evidence drifted`);
  const response = sample.assetResponses[0];
  invariant(response.url.endsWith(
    `/${sample.animationId}/canvas-renderer.js?sha256=${sample.runtimeSha256}`) &&
    response.status === 200 && response.corp === 'same-origin' &&
    response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${sample.animationId}: TS05 local asset policy drifted`);
  const expectedTermIds = new Set(expectedPage.glossaryEntries.map((entry) =>
    entry.id));
  const expectedEnglish = ENGLISH_TERMS.filter((term) =>
    expectedTermIds.has(term.entryId));
  invariant(exactArray(sample.glossary?.englishTerms, expectedEnglish) &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true,
  `${sample.animationId}: TS05 English glossary behavior drifted`);
  const expectedSpanish = sample.animationId === 'shared-alg001-l01-p050'
    ? SPANISH_TERMS : null;
  invariant(exactArray(sample.glossary.spanishTerms, expectedSpanish),
    `${sample.animationId}: TS05 Spanish glossary behavior drifted`);
}

async function expectedArtifact() {
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3317'},
      maxBuffer: 16 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'TS05 browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 276 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 27,
  'TS05 browser receipt check did not prove the 276-page product slice');
  const jsonInputs = new Set(['audit', 'recovery', 'generatorRun',
    'generatorFragment', 'registrationFreeze', 'registrationFragment',
    'browser']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: jsonInputs.has(key)})],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const audit = inputs.audit.value;
  const recovery = inputs.recovery.value;
  const run = inputs.generatorRun.value;
  const generated = inputs.generatorFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.browser.value;
  const authorizedPlacementIds = recovery.eligibility.eligible.map((row) =>
    row.animationId).sort();
  const auditedIds = audit.records.flatMap((record) => record.placements.map(
    (placement) => placement.animationId)).sort();
  const allowedKeys = new Set(['strategies', 'equation', 'pattern', 'table',
    'simple / simpler / simplest', 'show']);
  invariant(audit.artifactType === 'g678-ts05-family-audit-v1' &&
    audit.scope.ts05Placements === 44 && audit.records.length === 44 &&
    auditedIds.length === 44 && new Set(auditedIds).size === 44 &&
    audit.records.every((record) =>
      record.structure.stage === '800x600' &&
      record.structure.fps === 12 &&
      record.structure.rootFrameCount === 10 &&
      [234, 263, 274]
        .includes(record.structure.mainFrameCount) &&
      [5, 6, 7, 10].includes(record.structure.buttonCount) &&
      record.structure.audioStreamCount === 1 &&
      record.behavior.buttons.length === record.structure.buttonCount &&
      record.behavior.buttons.every((button) => allowedKeys.has(
        button.sourceKeyAttribute.toLowerCase()))),
  'TS05 exact source/behavior classifier drifted');
  const specialRecords = audit.records.filter((record) =>
    record.behavior.terminalChildStop.present);
  invariant(specialRecords.length === 1 &&
    specialRecords[0].placements.length === 1 &&
    specialRecords[0].placements[0].animationId ===
      'shared-nms002-l01-p041',
  'TS05 terminal-stop source identity drifted');
  invariant(recovery.artifactType ===
      'g678-ts05-l1-keyterm-recovery-v1' &&
    recovery.eligibility.eligiblePlacementCount === 15 &&
    recovery.eligibility.blockedPlacementCount === 29 &&
    authorizedPlacementIds.length === 15 &&
    new Set(authorizedPlacementIds).size === 15 &&
    authorizedPlacementIds.every((id) => auditedIds.includes(id)) &&
    recovery.terms.length === ENGLISH_TERMS.length &&
    recovery.terms.every((term, index) =>
      term.id === ENGLISH_TERMS[index].entryId &&
      term.labels.en === ENGLISH_TERMS[index].button &&
      term.definitions.en.includes(ENGLISH_TERMS[index].definition) &&
      term.labels.es === SPANISH_TERMS[index].button &&
      term.definitions.es.includes(SPANISH_TERMS[index].definition)),
  'TS05 L1 recovery/eligibility authority drifted');
  invariant(run.runId === 'g678-ts05-l1-current-js-15-v1' &&
    run.generatedPlacementCount === 15 &&
    run.members.length === 15 && run.registryEntriesWritten === 0 &&
    exactArray(run.members.map((member) => member.animationId).sort(),
      authorizedPlacementIds) &&
    exactArray(run.inputs.audit, descriptor(inputs.audit)) &&
    exactArray(run.inputs.recovery, descriptor(inputs.recovery)) &&
    generated.generatedPlacementCount === 15 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    generated.entries.length === 15 &&
    exactArray(generated.entries.map((entry) => entry.key).sort(),
      authorizedPlacementIds) &&
    exactArray(generated.compilerRun, descriptor(inputs.generatorRun)),
  'TS05 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 276 &&
    freeze.selectedPages.length === 276 &&
    fragment.calibration.entries.length === 276 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exactArray(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'TS05 276-page local registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(authorizedPlacementIds.every((id) =>
    selected.get(id)?.adapterFamily === 'ts05-l1-glossary-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'ts05-l1-browser-product-calibration-pending')),
  'TS05 registered page set is not the exact pre-calibration candidate slice');
  invariant(browser.artifactType === 'g678-current-js-276-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 276 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 276 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exactArray(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exactArray(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exactArray(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exactArray(browser.inputs.sourceStaticHost,
      descriptor(inputs.sourceStaticHost)) &&
    exactArray(browser.inputs.glossaryHost, descriptor(inputs.glossaryHost)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'TS05 browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const id of SAMPLE_IDS) {
    invariant(samples.has(id) && selected.has(id),
      `${id}: TS05 browser calibration sample is missing`);
    validateSample(samples.get(id), selected.get(id));
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts05-l1-family-calibration-v1',
    calibrationId: 'g678-ts05-l1-family-calibration-v1',
    adapterFamily: 'ts05-l1-glossary-source-static',
    status: 'exact-15-current-js-visual-glossary-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 44,
    authorizedPlacementIds: Object.freeze(authorizedPlacementIds),
    blockedPlacementCount: 29,
    browserSamples: Object.freeze(SAMPLE_IDS.map((id) => Object.freeze({
      animationId: id,
      frameDomain: selected.get(id).runtime.frameDomain,
      frameCount: selected.get(id).runtime.frameCount,
      runtimeSha256: selected.get(id).runtime.canvasRenderer.sha256,
    }))),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      exactEnglishGlossaryDefinitions: true,
      exactSpanishGlossaryDefinitions: true,
      playbackPausesWhileGlossaryOpen: true,
      playbackResumesAfterGlossaryClose: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsPartialRegistrationTruthful: true,
      familyCurrentJsVisualGlossaryCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({
      authorized: true,
      scope: 'exact-15-recovered-l1-glossary-placement-set-only',
      permitsRemaining29Ts05Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates maintained Current-JS visual playback and typed bilingual glossary behavior for the exact 15 recovered-L1 TS05 placements only.',
      'The other 29 TS05 placements remain blocked because their lesson-referenced L2-L12 key-term XML was not recovered.',
      'Legacy key-term sublinks/example SWFs, embedded audio lifecycle, authoritative original runtime, fidelity, human, Owner, strict-completion, release, and publication remain unaccepted.',
      'All 44 lessons remain partial; this authority creates no N/N whole-lesson engineering preview or learner route.',
    ]),
  });
}

async function writeExclusive(bytes) {
  const target = projectPath(OUTPUT);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function buildTs05L1FamilyCalibration({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'TS05 L1 family calibration artifact drifted');
  } else {
    await writeExclusive(bytes);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    auditedPlacementCount: artifact.auditedPlacementCount,
    authorizedPlacementCount: artifact.authorizedPlacementIds.length,
    blockedPlacementCount: artifact.blockedPlacementCount,
    productHostCalibrationPassed:
      artifact.productHostCalibration
        .familyCurrentJsVisualGlossaryCalibrationPassed,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-ts05-l1-family-calibration.mjs [--check]');
  buildTs05L1FamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
