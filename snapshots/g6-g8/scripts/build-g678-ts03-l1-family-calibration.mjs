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
  'catalog/product-bridge-calibrations/g678-ts03-l1-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-ts03-family-audit-v1.json',
  recovery: 'catalog/g678-ts03-l1-keyterm-recovery-v1.json',
  generator: 'scripts/build-g678-ts03-l1-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-ts03-l1-current-js-15-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-ts03-l1-current-js-15-v1.fragment.json',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-261-v2/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-261-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  glossaryHost:
    'packages/demos/src/private-source-static-glossary-candidate.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const SAMPLE_IDS = Object.freeze([
  'shared-alg001-l01-p048',
  'shared-alg001-l03-p048',
  'shared-nms002-l01-p039',
]);
const ENGLISH_TERMS = Object.freeze([
  Object.freeze({button: 'Organize', entryId: 'organize',
    definition:
      'To organize means to put into order; to arrange in a desired pattern.'}),
  Object.freeze({button: 'Information', entryId: 'information',
    definition:
      'A collection of facts or data. For example: José is 15 years old. José has a cell phone.'}),
]);
const SPANISH_TERMS = Object.freeze([
  Object.freeze({button: 'Organizar', entryId: 'organize',
    definition:
      'Organizar significa poner en orden, ordenar de acuerdo a un patrón deseado.'}),
  Object.freeze({button: 'Información', entryId: 'information',
    definition:
      'Colección de datos o hechos. Por ejemplo: José tiene 15 años. José tiene un teléfono celular.'}),
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
  `${sample.animationId}: TS03 browser playback evidence drifted`);
  const response = sample.assetResponses[0];
  invariant(response.url.endsWith(
    `/${sample.animationId}/canvas-renderer.js?sha256=${sample.runtimeSha256}`) &&
    response.status === 200 && response.corp === 'same-origin' &&
    response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${sample.animationId}: TS03 local asset policy drifted`);
  invariant(exactArray(sample.glossary?.englishTerms, ENGLISH_TERMS) &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true,
  `${sample.animationId}: TS03 English glossary behavior drifted`);
  const expectedSpanish = sample.animationId === 'shared-alg001-l03-p048'
    ? SPANISH_TERMS : null;
  invariant(exactArray(sample.glossary.spanishTerms, expectedSpanish),
    `${sample.animationId}: TS03 Spanish glossary behavior drifted`);
}

async function expectedArtifact() {
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3317'},
      maxBuffer: 16 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'TS03 browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 261 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 21,
  'TS03 browser receipt check did not prove the 261-page product slice');
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
  invariant(audit.artifactType === 'g678-ts03-family-audit-v1' &&
    audit.scope.ts03Placements === 44 && audit.records.length === 43 &&
    auditedIds.length === 44 && new Set(auditedIds).size === 44 &&
    audit.records.every((record) =>
      record.structure.stage === '800x600' &&
      record.structure.fps === 12 &&
      record.structure.rootFrameCount === 10 &&
      [220, 223, 234].includes(record.structure.mainFrameCount) &&
      record.structure.buttonCount === 2 &&
      record.structure.audioStreamCount === 1 &&
      exactArray(record.behavior.buttons.map((button) =>
        button.sourceKeyAttribute), ['Organize', 'Information'])),
  'TS03 exact source/behavior classifier drifted');
  invariant(recovery.artifactType ===
      'g678-ts03-l1-keyterm-recovery-v1' &&
    recovery.eligibility.eligiblePlacementCount === 15 &&
    recovery.eligibility.blockedPlacementCount === 29 &&
    authorizedPlacementIds.length === 15 &&
    new Set(authorizedPlacementIds).size === 15 &&
    authorizedPlacementIds.every((id) => auditedIds.includes(id)) &&
    exactArray(recovery.terms.map((term) => ({button: term.labels.en,
      entryId: term.id, definition: term.definitions.en})), ENGLISH_TERMS) &&
    exactArray(recovery.terms.map((term) => ({button: term.labels.es,
      entryId: term.id, definition: term.definitions.es})), SPANISH_TERMS),
  'TS03 L1 recovery/eligibility authority drifted');
  invariant(run.runId === 'g678-ts03-l1-current-js-15-v1' &&
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
  'TS03 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 261 &&
    freeze.selectedPages.length === 261 &&
    fragment.calibration.entries.length === 261 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exactArray(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'TS03 261-page local registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(authorizedPlacementIds.every((id) =>
    selected.get(id)?.adapterFamily === 'ts03-l1-glossary-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'ts03-l1-browser-product-calibration-pending')),
  'TS03 registered page set is not the exact pre-calibration candidate slice');
  invariant(browser.artifactType === 'g678-current-js-261-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 261 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 261 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exactArray(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exactArray(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exactArray(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exactArray(browser.inputs.sourceStaticHost,
      descriptor(inputs.sourceStaticHost)) &&
    exactArray(browser.inputs.glossaryHost, descriptor(inputs.glossaryHost)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'TS03 browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const id of SAMPLE_IDS) {
    invariant(samples.has(id) && selected.has(id),
      `${id}: TS03 browser calibration sample is missing`);
    validateSample(samples.get(id), selected.get(id));
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts03-l1-family-calibration-v1',
    calibrationId: 'g678-ts03-l1-family-calibration-v1',
    adapterFamily: 'ts03-l1-glossary-source-static',
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
      permitsRemaining29Ts03Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates maintained Current-JS visual playback and typed bilingual glossary behavior for the exact 15 recovered-L1 TS03 placements only.',
      'The other 29 TS03 placements remain blocked because their lesson-referenced L2-L12 key-term XML was not recovered.',
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

export async function buildTs03L1FamilyCalibration({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'TS03 L1 family calibration artifact drifted');
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
    'usage: build-g678-ts03-l1-family-calibration.mjs [--check]');
  buildTs03L1FamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
