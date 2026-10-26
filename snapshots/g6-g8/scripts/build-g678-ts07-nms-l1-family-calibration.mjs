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
  'catalog/product-bridge-calibrations/g678-ts07-nms-l1-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-ts07-family-audit-v1.json',
  recovery: 'catalog/g678-ts07-l1-keyterm-recovery-v1.json',
  laneRouting:
    'catalog/product-bridge-calibrations/g678-ts07-assessment-lane-routing-v1.json',
  generator: 'scripts/build-g678-ts07-nms-l1-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-ts07-nms-l1-current-js-1-v1.fragment.json',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-277-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-277-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-277-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-277-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  glossaryHost:
    'packages/demos/src/private-source-static-glossary-candidate.tsx',
  assessmentHost:
    'packages/demos/src/private-source-static-assessment-candidate.tsx',
  assessmentReducer: 'packages/demos/src/g678-ts07-assessment.ts',
  feedbackSelector:
    'packages/demos/src/g678-advanced-manual/host-feedback-selector.ts',
  animationRuntime: 'apps/web/components/animation-runtime.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const REPRESENTATIVE_ID = 'shared-nms002-l01-p043';
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
  `${sample.animationId}: TS07 browser playback evidence drifted`);
  const response = sample.assetResponses[0];
  invariant(response.url.endsWith(
    `/${sample.animationId}/canvas-renderer.js?sha256=${sample.runtimeSha256}`) &&
    response.status === 200 && response.corp === 'same-origin' &&
    response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${sample.animationId}: TS07 local asset policy drifted`);
  const assessment = sample.assessment;
  invariant(sample.glossary === null &&
    assessment?.sourceStopFrame === 757 &&
    assessment.sourceQuizVisualProxyFrame === 758 &&
    assessment.glossary?.entryId === 'difference' &&
    assessment.glossary.definition ===
      'The answer to a subtraction problem. For example: 5 – 3 = 2; 2 is the difference.' &&
    assessment.glossary.pausedWhileOpen === true &&
    assessment.glossary.resumedAfterClose === true &&
    exactArray(assessment.hint?.lines, [
      'Difference means to subtract.',
      'Example: 10,000 – 3,500 means the difference between 10,000 and 3,500.',
    ]) &&
    assessment.firstWrong?.answer === '36°' &&
    assessment.firstWrong.feedback === 'OH! NO' &&
    assessment.firstWrong.returnedToSelection === true &&
    assessment.right?.answer === '38°' &&
    assessment.right.feedback === 'Excellent!' &&
    assessment.right.resolvedStopCount === 1 &&
    assessment.right.resumedFrame === 758 &&
    assessment.replay?.runtimeRemounted === true &&
    assessment.replay.resetToSelectingAtHeldStop === true &&
    assessment.spanish?.glossaryEntryId === 'difference' &&
    assessment.spanish.sourceEnglishDisclosure === true &&
    assessment.spanish.textParityAccepted === false &&
    assessment.feedbackAudioAccepted === false,
  `${sample.animationId}: TS07 maintained assessment behavior drifted`);
}

async function expectedArtifact() {
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3318'},
      maxBuffer: 16 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'TS07 browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 277 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 28,
  'TS07 browser receipt check did not prove the 277-page product slice');
  const jsonInputs = new Set(['audit', 'recovery', 'laneRouting', 'generatorRun',
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
  const laneRouting = inputs.laneRouting.value;
  const run = inputs.generatorRun.value;
  const generated = inputs.generatorFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.browser.value;
  const authorizedPlacementIds = [REPRESENTATIVE_ID];
  const auditedIds = audit.records.flatMap((record) => record.placements.map(
    (placement) => placement.animationId)).sort();
  const representativeRecord = audit.records.find((record) =>
    record.placements.some((placement) =>
      placement.animationId === REPRESENTATIVE_ID));
  invariant(audit.artifactType === 'g678-ts07-family-audit-v1' &&
    audit.scope.ts07Placements === 44 && audit.records.length === 44 &&
    auditedIds.length === 44 && new Set(auditedIds).size === 44 &&
    representativeRecord?.sourceSha256 ===
      'c920dfa231eb8d4e1824454df041899f8c1c979b94c0553ef44c527ac81c21df' &&
    representativeRecord.structure.stage === '800x600' &&
    representativeRecord.structure.fps === 12 &&
    representativeRecord.structure.rootFrameCount === 10 &&
    representativeRecord.structure.mainObjectId === 331 &&
    representativeRecord.structure.mainFrameCount === 779 &&
    representativeRecord.behavior.quizStop.frame === 757 &&
    representativeRecord.behavior.quiz.correctAnswerOrdinal === 3 &&
    representativeRecord.behavior.quiz.answerInstances.length === 4 &&
    representativeRecord.behavior.quiz.wrongFeedbackDomains.length === 3 &&
    representativeRecord.behavior.quiz.rightFeedbackDomains.length === 4 &&
    representativeRecord.behavior.quiz.wrongFeedbackDomains.every(
      (domain) => domain.activeAtQuizStop) &&
    representativeRecord.behavior.quiz.rightFeedbackDomains.every(
      (domain) => domain.activeAtQuizStop),
  'TS07 exact source/behavior classifier drifted');
  invariant(recovery.artifactType ===
      'g678-ts07-l1-keyterm-recovery-v1' &&
    recovery.eligibility.recoveredL1ReferencePlacementCount === 15 &&
    recovery.eligibility.exactEntryPresentPlacementCount === 13 &&
    recovery.eligibility.productEligiblePlacementCount === 0 &&
    recovery.eligibility.exactEntryPresent.some((row) =>
      row.animationId === REPRESENTATIVE_ID &&
      exactArray(row.normalizedSourceKeys,
        ['difference', 'show', 'table'])) &&
    ['difference', 'show', 'table'].every((id) =>
      recovery.terms.some((term) => term.id === id &&
        term.definitionParity === true)),
  'TS07 L1 recovery/eligibility authority drifted');
  invariant(laneRouting.artifactType ===
      'g678-ts07-assessment-lane-routing-v1' &&
    laneRouting.representativeProductSlice.length === 1 &&
    laneRouting.representativeProductSlice[0].animationId ===
      REPRESENTATIVE_ID &&
    laneRouting.implementationAuthorizedPlacementCount === 1 &&
    laneRouting.generatedCandidatePlacementCount === 0 &&
    laneRouting.registrationAuthorizedPlacementCount === 0 &&
    laneRouting.productCalibrationPassed === false &&
    exactArray(laneRouting.inputs.audit, descriptor(inputs.audit)) &&
    exactArray(laneRouting.inputs.recovery, descriptor(inputs.recovery)),
  'TS07 lane-routing authority drifted');
  invariant(run.runId === 'g678-ts07-nms-l1-current-js-1-v1' &&
    run.generatedPlacementCount === 1 &&
    run.members.length === 1 && run.registryEntriesWritten === 0 &&
    exactArray(run.members.map((member) => member.animationId).sort(),
      authorizedPlacementIds) &&
    exactArray(run.inputs.audit, descriptor(inputs.audit)) &&
    exactArray(run.inputs.recovery, descriptor(inputs.recovery)) &&
    exactArray(run.inputs.laneRouting, descriptor(inputs.laneRouting)) &&
    exactArray(run.inputs.assessmentHost,
      descriptor(inputs.assessmentHost)) &&
    exactArray(run.inputs.assessmentReducer,
      descriptor(inputs.assessmentReducer)) &&
    exactArray(run.inputs.feedbackSelector,
      descriptor(inputs.feedbackSelector)) &&
    generated.generatedPlacementCount === 1 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    generated.entries.length === 1 &&
    exactArray(generated.entries.map((entry) => entry.key).sort(),
      authorizedPlacementIds) &&
    exactArray(generated.compilerRun, descriptor(inputs.generatorRun)),
  'TS07 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 277 &&
    freeze.selectedPages.length === 277 &&
    fragment.calibration.entries.length === 277 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exactArray(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'TS07 277-page local registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(authorizedPlacementIds.every((id) =>
    selected.get(id)?.adapterFamily ===
      'ts07-nms-l1-assessment-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'ts07-nms-l1-browser-product-calibration-pending') &&
    selected.get(id)?.assessment?.quizStopFrame === 757 &&
    selected.get(id)?.assessment?.answers?.length === 4 &&
    selected.get(id)?.assessment?.feedbackDomains?.length === 7),
  'TS07 registered page set is not the exact pre-calibration candidate slice');
  invariant(browser.artifactType === 'g678-current-js-277-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 277 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 277 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exactArray(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exactArray(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exactArray(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exactArray(browser.inputs.sourceStaticHost,
      descriptor(inputs.sourceStaticHost)) &&
    exactArray(browser.inputs.glossaryHost, descriptor(inputs.glossaryHost)) &&
    exactArray(browser.inputs.assessmentHost,
      descriptor(inputs.assessmentHost)) &&
    exactArray(browser.inputs.assessmentReducer,
      descriptor(inputs.assessmentReducer)) &&
    exactArray(browser.inputs.feedbackSelector,
      descriptor(inputs.feedbackSelector)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'TS07 browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const id of authorizedPlacementIds) {
    invariant(samples.has(id) && selected.has(id),
      `${id}: TS07 browser calibration sample is missing`);
    validateSample(samples.get(id), selected.get(id));
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts07-nms-l1-family-calibration-v1',
    calibrationId: 'g678-ts07-nms-l1-family-calibration-v1',
    adapterFamily: 'ts07-nms-l1-assessment-source-static',
    status: 'exact-one-current-js-assessment-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 44,
    authorizedPlacementIds: Object.freeze(authorizedPlacementIds),
    blockedPlacementCount: 43,
    browserSamples: Object.freeze(authorizedPlacementIds.map((id) => Object.freeze({
      animationId: id,
      frameDomain: selected.get(id).runtime.frameDomain,
      frameCount: selected.get(id).runtime.frameCount,
      runtimeSha256: selected.get(id).runtime.canvasRenderer.sha256,
    }))),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      exactSourceAnswerOrderAndLabels: true,
      exactThreeWrongFourRightFeedbackDomains: true,
      exactEnglishDifferenceGlossaryDefinition: true,
      exactSpanishDifferenceGlossaryDefinition: true,
      playbackPausesWhileGlossaryOpen: true,
      playbackResumesAfterGlossaryClose: true,
      sourceQuizStopHeldUntilFeedbackResolution: true,
      firstWrongRetriesAndRightResumes: true,
      maintainedHintAndReplayReset: true,
      spanishSourceTextParityAccepted: false,
      feedbackAudioAccepted: false,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsPartialRegistrationTruthful: true,
      familyCurrentJsVisualAssessmentCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({
      authorized: true,
      scope: 'exact-shared-nms002-l01-p043-assessment-placement-only',
      permitsRemaining43Ts07Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates maintained Current-JS playback, source-ordered answers, feedback control flow, hint, Replay reset, and bilingual Difference glossary behavior for shared-nms002-l01-p043 only.',
      'The other 43 TS07 placements remain blocked by content-authority, inactive-feedback, advanced-control, or representative-scale-out gates.',
      'Spanish assessment text parity, feedback and narration audio, legacy key-term sublinks/example SWFs, authoritative original runtime, fidelity, human, Owner, strict-completion, release, and publication remain unaccepted.',
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

export async function buildTs07NmsL1FamilyCalibration({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'TS07 L1 family calibration artifact drifted');
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
        .familyCurrentJsVisualAssessmentCalibrationPassed,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-ts07-nms-l1-family-calibration.mjs [--check]');
  buildTs07NmsL1FamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
