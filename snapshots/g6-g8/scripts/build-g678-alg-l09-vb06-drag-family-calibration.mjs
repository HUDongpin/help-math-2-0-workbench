#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {auditG678AlgL09Vb06DragFamily} from
  './audit-g678-alg-l09-vb06-drag-family.mjs';
import {runAlgL09Vb06DragCurrentJs} from
  './build-g678-alg-l09-vb06-drag-current-js.mjs';
import {finalizeAlgL09Vb06DragRegistration} from
  './finalize-g678-alg-l09-vb06-drag-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-alg-l09-vb06-drag-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-alg-l09-vb06-drag-family-audit-v1.json',
  auditBuilder: 'scripts/audit-g678-alg-l09-vb06-drag-family.mjs',
  generator: 'scripts/build-g678-alg-l09-vb06-drag-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-alg-l09-vb06-drag-current-js-1-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-alg-l09-vb06-drag-current-js-1-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l09-vb06-drag-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-325-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-325-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  algL09Vb06DragHost:
    'packages/demos/src/private-source-static-alg-l09-vb06-drag-candidate.tsx',
  algL09Vb06DragBehavior: 'packages/demos/src/g678-alg-l09-vb06-drag.ts',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const EXPECTED_IDS = Object.freeze([
  'shared-alg001-l09-p012',
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
  invariant(sample.animationId === page.animationId &&
    sample.frameDomain === page.runtime.frameDomain &&
    sample.frameCount === page.runtime.frameCount &&
    sample.runtimeSha256 === page.runtime.canvasRenderer.sha256 &&
    ['ready', 'updating'].includes(sample.canvasState) &&
    sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.glossaryInspectionFrame === 129 &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1 && sample.assessment === null &&
    page.glossaryEntries.length === 3 &&
    sample.glossary?.englishTerms?.length === 3 &&
    sample.glossary?.spanishTerms?.length === 3 &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true &&
    auditRecord.behavior.childTimelineScriptCount === 13 &&
    auditRecord.behavior.interaction.stopFrame === 129 &&
    auditRecord.behavior.interaction.resumeFrame === 130 &&
    auditRecord.behavior.interaction.completionThreshold === 4 &&
    sample.groupedDrag?.sourceStopFrame === 129 &&
    sample.groupedDrag.wrong?.sourceId === 'drag-1' &&
    sample.groupedDrag.wrong?.targetId === 'drop-1' &&
    sample.groupedDrag.wrong?.feedbackKind === 'proportional' &&
    sample.groupedDrag.wrong?.resetCount === 0 &&
    exact(sample.groupedDrag.correctSequence,
      [['drag-1', 'drop-3'], ['drag-3', 'drop-4'],
        ['drag-2', 'drop-1'], ['drag-4', 'drop-2']]) &&
    sample.groupedDrag.completionCount === 4 &&
    sample.groupedDrag.resolvedStopCount === 1 &&
    sample.groupedDrag.resumedFrame >= 130 &&
    sample.groupedDrag.replay?.runtimeRemounted === true &&
    sample.groupedDrag.replay?.resetCount === 0 &&
    sample.groupedDrag.replay?.returnedToHeldStop === true &&
    sample.groupedDrag.feedbackAudioAccepted === false &&
    sample.groupedDrag.externalNarrationAudioAccepted === false,
  `${page.animationId}: ALG L9 VB06 browser behavior evidence drifted`);
  const response = sample.assetResponses[0];
  invariant(response.url === `${baseUrl}/flash-assets/g678-local/` +
    `${page.animationId}/canvas-renderer.js?sha256=` +
    page.runtime.canvasRenderer.sha256 &&
    response.status === 200 && response.corp === 'same-origin' &&
    response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${page.animationId}: ALG L9 local asset policy drifted`);
}

async function expectedArtifact() {
  const auditCheck = await auditG678AlgL09Vb06DragFamily({check: true});
  const generatorCheck = await runAlgL09Vb06DragCurrentJs({check: true});
  const registrationCheck =
    await finalizeAlgL09Vb06DragRegistration({check: true});
  invariant(auditCheck.check === true &&
    auditCheck.registrationCandidatePlacementCount === 1 &&
    generatorCheck.check === true && generatorCheck.generatedPlacementCount === 1 &&
    registrationCheck.check === true &&
    registrationCheck.registrationCandidatePlacementCount === 325,
  'ALG L9 VB06 source/generator/provisional admission checks failed');
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3324'},
      maxBuffer: 32 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'ALG L9 browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 325 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 76,
  'ALG L9 browser receipt check did not prove the 325-page product slice');

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
  invariant(audit.artifactType ===
      'g678-alg-l09-vb06-drag-family-audit-v1' &&
    audit.status ===
      'exact-1-vb06-grouped-drag-script-keyterm-audio-audit-registration-candidate' &&
    audit.scope.selectedAlgL09Vb06DragPlacements === 1 &&
    audit.scope.exactButtonScripts === 4 &&
    audit.scope.recoveredGlossaryTerms === 3 &&
    audit.scope.affectedLessons === 1 &&
    exact(auditIds, [...EXPECTED_IDS].sort()) &&
    audit.records.every((record) =>
      record.behavior.childTimelineScriptCount === 13 &&
      record.behavior.interaction.stopFrame === 129 &&
      record.behavior.interaction.resumeFrame === 130 &&
      record.behavior.interaction.completionThreshold === 4 &&
      record.behavior.interaction.drags.length === 4 &&
      record.behavior.buttons.length === 3 &&
      record.generationAuthorized === true),
  'ALG L9 VB06 drag source/behavior classifier drifted');
  invariant(run.runId ===
      'g678-alg-l09-vb06-drag-current-js-1-v1' &&
    run.generatedPlacementCount === 1 && run.members.length === 1 &&
    run.registryEntriesWritten === 0 &&
    exact(run.members.map((member) => member.animationId).sort(), auditIds) &&
    exact(run.inputs.audit, descriptor(inputs.audit)) &&
    generated.generatedPlacementCount === 1 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    generated.entries.length === 1 &&
    exact(generated.entries.map((entry) => entry.key).sort(), auditIds) &&
    exact(generated.compilerRun, descriptor(inputs.generatorRun)),
  'ALG L9 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 325 &&
    freeze.selectedPages.length === 325 &&
    fragment.calibration.entries.length === 325 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'ALG L9 325-page provisional registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(EXPECTED_IDS.every((id) =>
    selected.get(id)?.adapterFamily ===
      'alg-l09-vb06-drag-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'alg-l09-vb06-drag-browser-product-calibration-pending')),
  'ALG L9 registered page set is not the exact pre-calibration slice');
  invariant(browser.artifactType === 'g678-current-js-325-browser-qa-v1' &&
    browser.baseUrl === 'http://127.0.0.1:3324' &&
    browser.registeredCurrentJsPages === 325 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 325 &&
    browser.samples.length === 75 && browser.screenshots.length === 76 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exact(browser.inputs.sourceStaticHost, descriptor(inputs.sourceStaticHost)) &&
    exact(browser.inputs.algL09Vb06DragHost,
      descriptor(inputs.algL09Vb06DragHost)) &&
    exact(browser.inputs.algL09Vb06DragBehavior,
      descriptor(inputs.algL09Vb06DragBehavior)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'ALG L9 browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const id of EXPECTED_IDS) {
    invariant(samples.has(id) && selected.has(id),
      `${id}: ALG L9 browser calibration sample is missing`);
    validateSample(samples.get(id), selected.get(id),
      audit.records.find((record) => record.animationId === id), browser.baseUrl);
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l09-vb06-drag-family-calibration-v1',
    calibrationId: 'g678-alg-l09-vb06-drag-family-calibration-v1',
    adapterFamily: 'alg-l09-vb06-drag-source-static',
    status: 'exact-1-vb06-grouped-drag-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 1,
    authorizedPlacementIds: EXPECTED_IDS,
    blockedPlacementCount: 0,
    sourceButtonCount: 4,
    uniqueGlossaryTermCount: 3,
    maintainedDragSourceCount: 4,
    browserSamples: Object.freeze(EXPECTED_IDS.map((id) => Object.freeze({
      animationId: id,
      frameDomain: selected.get(id).runtime.frameDomain,
      frameCount: selected.get(id).runtime.frameCount,
      runtimeSha256: selected.get(id).runtime.canvasRenderer.sha256,
      glossaryTermCount: 3,
      sourceStopFrame: 129,
      sourceResumeFrame: 130,
      maintainedDragSourceCount: 4,
    }))),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      mainTimelineAdvancedPastInteractiveStop: true,
      frame129InteractiveStopBound: true,
      fourSourceGroupingBound: true,
      pointerKeyboardCompletionAndResumePassed: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsPartialRegistrationTruthful: true,
      familyCurrentJsVb06DragCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({
      authorized: true,
      scope: 'exact-1-alg-l09-vb06-grouped-drag-placement-only',
      permitsOtherAlgL09Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates the exact frame-129 four-item grouped-drag stop and frame-130 resume through the maintained Current-JS product host.',
      'The pointer and keyboard product controls preserve the exact two source groups, two target columns, wrong-feedback classes, completion threshold four, and Replay reset.',
      'Random feedback audio, external narration, authoritative original runtime, fidelity, human, Owner, strict-completion, release, and publication remain unaccepted.',
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

export async function buildAlgL09Vb06DragFamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'ALG L9 VB06 drag family calibration artifact drifted');
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
        .familyCurrentJsVb06DragCalibrationPassed,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l09-vb06-drag-family-calibration.mjs [--check]');
  buildAlgL09Vb06DragFamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
