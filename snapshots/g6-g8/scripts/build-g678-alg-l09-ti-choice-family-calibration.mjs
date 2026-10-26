#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {auditG678AlgL09TiChoiceFamily} from
  './audit-g678-alg-l09-ti-choice-family.mjs';
import {runAlgL09TiChoiceCurrentJs} from
  './build-g678-alg-l09-ti-choice-current-js.mjs';
import {finalizeAlgL09TiChoiceRegistration} from
  './finalize-g678-alg-l09-ti-choice-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-alg-l09-ti-choice-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-alg-l09-ti-choice-family-audit-v1.json',
  auditBuilder: 'scripts/audit-g678-alg-l09-ti-choice-family.mjs',
  generator: 'scripts/build-g678-alg-l09-ti-choice-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-alg-l09-ti-choice-current-js-6-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-alg-l09-ti-choice-current-js-6-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l09-ti-choice-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-336-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-336-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  algL09TiChoiceHost:
    'packages/demos/src/private-source-static-alg-l09-ti-choice-candidate.tsx',
  algL09TiChoiceBehavior: 'packages/demos/src/g678-alg-l09-ti-choice.ts',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const EXPECTED_IDS = Object.freeze([
  'shared-alg001-l09-p024',
  'shared-alg001-l09-p025',
  'shared-alg001-l09-p026',
  'shared-alg001-l09-p027',
  'shared-alg001-l09-p028',
  'shared-alg001-l09-p029',
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

function validateSampleLegacy(sample, page, auditRecord, baseUrl) {
  invariant(sample.animationId === page.animationId &&
    sample.frameDomain === page.runtime.frameDomain &&
    sample.frameCount === page.runtime.frameCount &&
    sample.runtimeSha256 === page.runtime.canvasRenderer.sha256 &&
    ['ready', 'updating'].includes(sample.canvasState) &&
    sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.glossaryInspectionFrame === 93 &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1 && sample.assessment === null &&
    sample.groupedDrag === null &&
    page.glossaryEntries.length === 3 &&
    sample.glossary?.englishTerms?.length === 3 &&
    sample.glossary?.spanishTerms?.length === 3 &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true &&
    auditRecord.behavior.childTimelineScriptCount === 29 &&
    auditRecord.behavior.interaction.stopFrame === 93 &&
    auditRecord.behavior.interaction.resumeFrame === 94 &&
    auditRecord.behavior.interaction.maximumWrongAttempts === 2 &&
    auditRecord.behavior.interaction.correctAnswerButtonCharacterId === 166 &&
    auditRecord.behavior.interaction.options?.length === 2 &&
    sample.choiceResponse?.sourceStopFrame === 93 &&
    sample.choiceResponse.firstWrong?.choice === 'AnsBtn1' &&
    sample.choiceResponse.firstWrong?.value === 'proportional relationship' &&
    sample.choiceResponse.firstWrong?.feedback ===
      'Two quantities have a proportional relationship when every ratio of pairs of values is equal. Try again.' &&
    sample.choiceResponse.firstWrong?.returnedToChoosing === true &&
    sample.choiceResponse.right?.choice === 'AnsBtn2' &&
    sample.choiceResponse.right?.value === 'non-proportional relationship' &&
    sample.choiceResponse.right?.feedback === 'Correct!' &&
    Number.isSafeInteger(sample.choiceResponse.right?.branch) &&
    sample.choiceResponse.right.branch >= 1 &&
    sample.choiceResponse.right.branch <= 4 &&
    sample.choiceResponse.right?.resolvedStopCount === 1 &&
    sample.choiceResponse.right?.resumedFrame >= 94 &&
    sample.choiceResponse.replay?.runtimeRemounted === true &&
    sample.choiceResponse.replay?.resetTryCount === 0 &&
    sample.choiceResponse.replay?.returnedToHeldStop === true &&
    exact(sample.choiceResponse.secondWrong?.choices,
      ['AnsBtn1', 'AnsBtn1']) &&
    exact(sample.choiceResponse.secondWrong?.values,
      ['proportional relationship', 'proportional relationship']) &&
    sample.choiceResponse.secondWrong?.feedback ===
      'Two quantities have a proportional relationship when every ratio of pairs of values is equal.' &&
    sample.choiceResponse.secondWrong?.resolvedStopCount === 1 &&
    sample.choiceResponse.secondWrong?.resumedFrame >= 94 &&
    sample.choiceResponse.choiceFeedbackAudioAccepted === false &&
    sample.choiceResponse.externalNarrationAudioAccepted === false,
  `${page.animationId}: ALG L9 TI browser behavior evidence drifted`);
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

function validateSample(sample, page, auditRecord, baseUrl) {
  const interaction = auditRecord.behavior.interaction;
  const options = interaction.options;
  const correct = options.find((option) => option.correct);
  const wrong = options.find((option) => !option.correct);
  const uniqueKeys = new Set(auditRecord.behavior.buttons.map((button) =>
    normalizedKey(button.sourceKeyAttribute)));
  invariant(correct && wrong &&
    sample.animationId === page.animationId &&
    sample.frameDomain === page.runtime.frameDomain &&
    sample.frameCount === page.runtime.frameCount &&
    sample.runtimeSha256 === page.runtime.canvasRenderer.sha256 &&
    ['ready', 'updating'].includes(sample.canvasState) &&
    sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.glossaryInspectionFrame === interaction.stopFrame &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1 && sample.assessment === null &&
    sample.groupedDrag === null && sample.numericResponse === null &&
    page.glossaryEntries.length === uniqueKeys.size &&
    sample.glossary?.englishTerms?.length === uniqueKeys.size &&
    sample.glossary?.spanishTerms?.length === uniqueKeys.size &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true &&
    interaction.resumeFrame === interaction.stopFrame + 1 &&
    interaction.maximumWrongAttempts === 2 &&
    interaction.sourceFeedbackDomainCount === 8 &&
    [2, 4].includes(options.length) &&
    options.filter((option) => option.correct).length === 1 &&
    sample.choiceResponse?.sourceStopFrame === interaction.stopFrame &&
    sample.choiceResponse.firstWrong?.choice === wrong.id &&
    sample.choiceResponse.firstWrong?.value === wrong.value &&
    sample.choiceResponse.firstWrong?.feedback ===
      interaction.sourceText.firstWrongByChoice[wrong.id] &&
    sample.choiceResponse.firstWrong?.returnedToChoosing === true &&
    sample.choiceResponse.right?.choice === correct.id &&
    sample.choiceResponse.right?.value === correct.value &&
    sample.choiceResponse.right?.feedback === 'Correct!' &&
    Number.isSafeInteger(sample.choiceResponse.right?.branch) &&
    sample.choiceResponse.right.branch >= 1 &&
    sample.choiceResponse.right.branch <= 4 &&
    sample.choiceResponse.right?.resolvedStopCount === 1 &&
    sample.choiceResponse.right?.resumedFrame >= interaction.resumeFrame &&
    sample.choiceResponse.replay?.runtimeRemounted === true &&
    sample.choiceResponse.replay?.resetTryCount === 0 &&
    sample.choiceResponse.replay?.returnedToHeldStop === true &&
    exact(sample.choiceResponse.secondWrong?.choices, [wrong.id, wrong.id]) &&
    exact(sample.choiceResponse.secondWrong?.values,
      [wrong.value, wrong.value]) &&
    sample.choiceResponse.secondWrong?.feedback ===
      interaction.sourceText.secondWrongByChoice[wrong.id] &&
    sample.choiceResponse.secondWrong?.resolvedStopCount === 1 &&
    sample.choiceResponse.secondWrong?.resumedFrame >= interaction.resumeFrame &&
    sample.choiceResponse.sourceDefectNormalized ===
      interaction.maintainedAttemptCounterNormalizesKnownSourceVariantDefect &&
    sample.choiceResponse.choiceFeedbackAudioAccepted === false &&
    sample.choiceResponse.externalNarrationAudioAccepted === false,
  `${page.animationId}: ALG L9 TI browser behavior evidence drifted`);
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
  const auditCheck = await auditG678AlgL09TiChoiceFamily({check: true});
  const generatorCheck = await runAlgL09TiChoiceCurrentJs({check: true});
  const registrationCheck =
    await finalizeAlgL09TiChoiceRegistration({check: true});
  invariant(auditCheck.check === true &&
    auditCheck.registrationCandidatePlacementCount === 6 &&
    generatorCheck.check === true && generatorCheck.generatedPlacementCount === 6 &&
    registrationCheck.check === true &&
    registrationCheck.registrationCandidatePlacementCount === 336,
  'ALG L9 TI source/generator/provisional admission checks failed');
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
    qaReceipt.registeredCurrentJsPages === 336 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 87,
  'ALG L9 browser receipt check did not prove the 336-page product slice');

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
      'g678-alg-l09-ti-choice-family-audit-v1' &&
    audit.status ===
      'exact-6-ti-choice-quiz-script-keyterm-audio-audit-registration-candidate' &&
    audit.scope.selectedAlgL09TiChoicePlacements === 6 &&
    audit.scope.exactButtonScripts === 94 &&
    audit.scope.recoveredGlossaryTerms === 22 &&
    audit.scope.affectedLessons === 1 &&
    exact(auditIds, [...EXPECTED_IDS].sort()) &&
    audit.records.every((record) =>
      [45, 46].includes(record.behavior.childTimelineScriptCount) &&
      record.behavior.interaction.resumeFrame ===
        record.behavior.interaction.stopFrame + 1 &&
      record.behavior.interaction.maximumWrongAttempts === 2 &&
      record.behavior.interaction.sourceFeedbackDomainCount === 8 &&
      [2, 4].includes(record.behavior.interaction.options?.length) &&
      record.behavior.interaction.options
        .filter((option) => option.correct).length === 1 &&
      record.behavior.buttons.length > 0 &&
      record.generationAuthorized === true),
  'ALG L9 TI choice source/behavior classifier drifted');
  invariant(run.runId ===
      'g678-alg-l09-ti-choice-current-js-6-v1' &&
    run.generatedPlacementCount === 6 && run.members.length === 6 &&
    run.registryEntriesWritten === 0 &&
    exact(run.members.map((member) => member.animationId).sort(), auditIds) &&
    exact(run.inputs.audit, descriptor(inputs.audit)) &&
    generated.generatedPlacementCount === 6 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    generated.entries.length === 6 &&
    exact(generated.entries.map((entry) => entry.key).sort(), auditIds) &&
    exact(generated.compilerRun, descriptor(inputs.generatorRun)),
  'ALG L9 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 336 &&
    freeze.selectedPages.length === 336 &&
    fragment.calibration.entries.length === 336 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'ALG L9 336-page provisional registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(EXPECTED_IDS.every((id) =>
    selected.get(id)?.adapterFamily ===
      'alg-l09-ti-choice-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'alg-l09-ti-choice-browser-product-calibration-pending')),
  'ALG L9 registered page set is not the exact pre-calibration slice');
  invariant(browser.artifactType === 'g678-current-js-336-browser-qa-v1' &&
    browser.baseUrl === 'http://127.0.0.1:3324' &&
    browser.registeredCurrentJsPages === 336 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 336 &&
    browser.samples.length === 86 && browser.screenshots.length === 87 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exact(browser.inputs.sourceStaticHost, descriptor(inputs.sourceStaticHost)) &&
    exact(browser.inputs.algL09TiChoiceHost,
      descriptor(inputs.algL09TiChoiceHost)) &&
    exact(browser.inputs.algL09TiChoiceBehavior,
      descriptor(inputs.algL09TiChoiceBehavior)) &&
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
    artifactType: 'g678-alg-l09-ti-choice-family-calibration-v1',
    calibrationId: 'g678-alg-l09-ti-choice-family-calibration-v1',
    adapterFamily: 'alg-l09-ti-choice-source-static',
    status: 'exact-6-ti-choice-quiz-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 6,
    authorizedPlacementIds: EXPECTED_IDS,
    blockedPlacementCount: 0,
    sourceButtonCount: 48,
    uniqueGlossaryTermCount: 22,
    choiceCount: 20,
    browserSamples: Object.freeze(EXPECTED_IDS.map((id) => {
      const page = selected.get(id);
      const record = audit.records.find((candidate) =>
        candidate.animationId === id);
      const interaction = record.behavior.interaction;
      return Object.freeze({
        animationId: id,
        frameDomain: page.runtime.frameDomain,
        frameCount: page.runtime.frameCount,
        runtimeSha256: page.runtime.canvasRenderer.sha256,
        glossaryTermCount: page.glossaryEntries.length,
        sourceStopFrame: interaction.stopFrame,
        sourceResumeFrame: interaction.resumeFrame,
        choiceCount: interaction.options.length,
        maximumWrongAttempts: 2,
        sourceDefectNormalized:
          interaction
            .maintainedAttemptCounterNormalizesKnownSourceVariantDefect,
      });
    })),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      mainTimelineAdvancedPastInteractiveStop: true,
      sourceSpecificStopsAndResumesBound: true,
      sourceSpecificChoiceSetsBound: true,
      twoWrongAttemptsAndChoiceFeedbackResumePassed: true,
      threeSourceAttemptIncrementDefectsRecordedAndNormalized: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsPartialRegistrationTruthful: true,
      familyCurrentJsTiChoiceCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({
      authorized: true,
      scope: 'exact-6-alg-l09-ti-choice-quiz-placements-only',
      permitsOtherAlgL09Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates the exact six TI choice stops and resumes through the maintained Current-JS product host.',
      'The product controls preserve each source-specific A-D or A-B option set, one correct answer, per-choice hint path, typed right-feedback request, keyboard button semantics, and Replay reset.',
      'TI03, TI05, and TI07 each contain one source wrong-feedback visual variant that omits quizTryCount increment; the maintained state normalizes the explicit two-attempt policy and records original-runtime parity as unaccepted.',
      'Choice-feedback audio, external narration, authoritative original runtime, fidelity, human, Owner, strict-completion, release, and publication remain unaccepted.',
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

export async function buildAlgL09TiChoiceFamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'ALG L9 TI choice family calibration artifact drifted');
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
        .familyCurrentJsTiChoiceCalibrationPassed,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l09-ti-choice-family-calibration.mjs [--check]');
  buildAlgL09TiChoiceFamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
