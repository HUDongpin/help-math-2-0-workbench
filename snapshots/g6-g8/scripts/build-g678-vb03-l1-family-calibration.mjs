#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {auditG678Vb03L1Family} from './audit-g678-vb03-l1-family.mjs';
import {runVb03L1CurrentJs} from './build-g678-vb03-l1-current-js.mjs';
import {finalizeVb03L1Registration} from
  './finalize-g678-vb03-l1-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-vb03-l1-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-vb03-l1-family-audit-v1.json',
  auditBuilder: 'scripts/audit-g678-vb03-l1-family.mjs',
  generator: 'scripts/build-g678-vb03-l1-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-vb03-l1-current-js-9-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-vb03-l1-current-js-9-v1.fragment.json',
  registrationFinalizer: 'scripts/finalize-g678-vb03-l1-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-310-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-310-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-310-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-310-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  repeatedVocabularyGlossaryHost:
    'packages/demos/src/private-source-static-repeated-vocabulary-glossary-candidate.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const EXPECTED_IDS = Object.freeze([
  'shared-alg001-l01-p008',
  'shared-alg001-l02-p009',
  'shared-alg001-l03-p007',
  'shared-alg001-l05-p006',
  'shared-alg001-l06-p012',
  'shared-alg001-l07-p008',
  'shared-alg001-l08-p008',
  'shared-alg001-l10-p008',
  'shared-alg001-l12-p008',
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
    !path.isAbsolute(relativePath), 'input path must be project-relative');
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

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizedKey(value) {
  return value.trim().toLocaleLowerCase('en-US');
}

function validateSample(sample, page, auditRecord, baseUrl) {
  const entriesByKey = new Map(page.glossaryEntries.map((entry) =>
    [normalizedKey(entry.sourceKeyAttribute), entry]));
  const inspectionFrame = Math.max(...auditRecord.behavior.buttons.map(
    (button) => button.firstFrame));
  invariant(sample.animationId === page.animationId &&
    sample.frameDomain === page.runtime.frameDomain &&
    sample.frameCount === page.runtime.frameCount &&
    sample.runtimeSha256 === page.runtime.canvasRenderer.sha256 &&
    sample.canvasState === 'ready' && sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.glossaryInspectionFrame === inspectionFrame &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1,
  `${page.animationId}: VB03 browser playback evidence drifted`);
  const response = sample.assetResponses[0];
  invariant(response.url === `${baseUrl}/flash-assets/g678-local/` +
    `${page.animationId}/canvas-renderer.js?sha256=` +
    page.runtime.canvasRenderer.sha256 &&
    response.status === 200 && response.corp === 'same-origin' &&
    response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${page.animationId}: VB03 local asset policy drifted`);
  const expectedEnglish = auditRecord.behavior.buttons.map((sourceButton) => {
    const entry = entriesByKey.get(normalizedKey(
      sourceButton.sourceKeyAttribute));
    invariant(entry,
      `${page.animationId}: ${sourceButton.characterId} lacks a glossary entry`);
    return Object.freeze({button: entry.labels.en, entryId: entry.id,
      definition: entry.definitions.en,
      sourceCharacterId: sourceButton.characterId});
  });
  const expectedSpanish = auditRecord.behavior.buttons.map((sourceButton) => {
    const entry = entriesByKey.get(normalizedKey(
      sourceButton.sourceKeyAttribute));
    invariant(entry,
      `${page.animationId}: ${sourceButton.characterId} lacks a Spanish glossary entry`);
    return Object.freeze({button: entry.labels.es, entryId: entry.id,
      definition: entry.definitions.es,
      sourceCharacterId: sourceButton.characterId});
  });
  invariant(exact(sample.glossary?.englishTerms, expectedEnglish) &&
    exact(sample.glossary?.spanishTerms, expectedSpanish) &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true,
  `${page.animationId}: VB03 bilingual glossary behavior drifted`);
}

async function expectedArtifact() {
  const auditCheck = await auditG678Vb03L1Family({check: true});
  const generatorCheck = await runVb03L1CurrentJs({check: true});
  const registrationCheck = await finalizeVb03L1Registration({check: true});
  invariant(auditCheck.check === true &&
    auditCheck.registrationCandidatePlacementCount === 9 &&
    generatorCheck.check === true && generatorCheck.generatedPlacementCount === 9 &&
    registrationCheck.check === true &&
    registrationCheck.registrationCandidatePlacementCount === 310,
  'VB03 source/generator/provisional admission checks failed');
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3320'},
      maxBuffer: 32 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'VB03 browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 310 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 61,
  'VB03 browser receipt check did not prove the 310-page product slice');

  const jsonInputs = new Set(['audit', 'generatorRun', 'generatorFragment',
    'registrationFreeze', 'registrationFragment', 'browser']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: jsonInputs.has(key)})],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const audit = inputs.audit.value;
  const run = inputs.generatorRun.value;
  const generated = inputs.generatorFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.browser.value;
  const auditIds = audit.records.map((record) => record.animationId).sort();
  invariant(audit.artifactType === 'g678-vb03-l1-family-audit-v1' &&
    audit.status ===
      'exact-9-source-script-keyterm-audio-audit-registration-candidate' &&
    audit.scope.selectedVb03L1Placements === 9 &&
    audit.scope.exactButtonScripts === 47 &&
    audit.scope.recoveredGlossaryTerms === 37 &&
    exact(auditIds, [...EXPECTED_IDS].sort()) &&
    audit.records.every((record) =>
      record.behavior.childTimelineScriptCount === 0 &&
      record.behavior.buttons.length > 0 &&
      record.behavior.buttons.every((button) =>
        Number.isSafeInteger(button.characterId) && button.characterId > 0 &&
        Number.isSafeInteger(button.firstFrame) && button.firstFrame > 0) &&
      record.generationAuthorized === true),
  'VB03 exact source/behavior classifier drifted');
  invariant(run.runId === 'g678-vb03-l1-current-js-9-v1' &&
    run.generatedPlacementCount === 9 && run.members.length === 9 &&
    run.registryEntriesWritten === 0 &&
    exact(run.members.map((member) => member.animationId).sort(), auditIds) &&
    exact(run.inputs.audit, descriptor(inputs.audit)) &&
    generated.generatedPlacementCount === 9 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    generated.entries.length === 9 &&
    exact(generated.entries.map((entry) => entry.key).sort(), auditIds) &&
    exact(generated.compilerRun, descriptor(inputs.generatorRun)),
  'VB03 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 310 &&
    freeze.selectedPages.length === 310 &&
    fragment.calibration.entries.length === 310 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'VB03 310-page provisional registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(EXPECTED_IDS.every((id) =>
    selected.get(id)?.adapterFamily === 'vb03-l1-glossary-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'vb03-l1-browser-product-calibration-pending')),
  'VB03 registered page set is not the exact pre-calibration slice');
  invariant(browser.artifactType === 'g678-current-js-310-browser-qa-v1' &&
    browser.baseUrl === 'http://127.0.0.1:3320' &&
    browser.registeredCurrentJsPages === 310 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 310 &&
    browser.samples.length === 60 && browser.screenshots.length === 61 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exact(browser.inputs.sourceStaticHost, descriptor(inputs.sourceStaticHost)) &&
    exact(browser.inputs.repeatedVocabularyGlossaryHost,
      descriptor(inputs.repeatedVocabularyGlossaryHost)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'VB03 browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const id of EXPECTED_IDS) {
    invariant(samples.has(id) && selected.has(id),
      `${id}: VB03 browser calibration sample is missing`);
    validateSample(samples.get(id), selected.get(id),
      audit.records.find((record) => record.animationId === id), browser.baseUrl);
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-vb03-l1-family-calibration-v1',
    calibrationId: 'g678-vb03-l1-family-calibration-v1',
    adapterFamily: 'vb03-l1-glossary-source-static',
    status: 'exact-9-current-js-visual-glossary-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 9,
    authorizedPlacementIds: EXPECTED_IDS,
    blockedPlacementCount: 0,
    sourceButtonCount: 47,
    uniqueGlossaryTermCount: 37,
    browserSamples: Object.freeze(EXPECTED_IDS.map((id) => Object.freeze({
      animationId: id,
      frameDomain: selected.get(id).runtime.frameDomain,
      frameCount: selected.get(id).runtime.frameCount,
      runtimeSha256: selected.get(id).runtime.canvasRenderer.sha256,
      glossaryTermCount: selected.get(id).glossaryEntries.length,
    }))),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
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
      scope: 'exact-9-vb03-l1-glossary-placement-set-only',
      permitsOtherVb03Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates maintained Current-JS visual playback and source-frame/source-character-bound bilingual glossary behavior for the exact 9 VB-3 placements only.',
      'Two Spanish source-label collisions are preserved and separately bound by SWF character identity; no translation was invented or rewritten.',
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

export async function buildVb03L1FamilyCalibration({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'VB03 L1 family calibration artifact drifted');
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
    'usage: build-g678-vb03-l1-family-calibration.mjs [--check]');
  buildVb03L1FamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
