#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {auditG678AlgL09ResidualRouting} from
  './audit-g678-alg-l09-residual-routing.mjs';
import {runAlgL09GuidedTutorialCurrentJs} from
  './build-g678-alg-l09-guided-tutorial-current-js.mjs';
import {finalizeAlgL09GuidedTutorialRegistration} from
  './finalize-g678-alg-l09-guided-tutorial-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-alg-l09-guided-tutorial-family-calibration-v1.json';
const EXPECTED_IDS = Object.freeze([
  'shared-alg001-l09-p037',
  'shared-alg001-l09-p038',
  'shared-alg001-l09-p039',
]);
const PATHS = Object.freeze({
  audit: 'catalog/g678-alg-l09-residual-routing-audit-v1.json',
  generator: 'scripts/build-g678-alg-l09-guided-tutorial-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-alg-l09-guided-tutorial-current-js-3-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-alg-l09-guided-tutorial-current-js-3-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l09-guided-tutorial-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-339-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-339-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  guidedHost:
    'packages/demos/src/private-source-static-alg-l09-guided-tutorial-candidate.tsx',
  guidedBehavior: 'packages/demos/src/g678-alg-l09-guided-tutorial.ts',
  animationContract: 'packages/demos/src/contract.ts',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
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
  const target = path.resolve(ROOT, relativePath);
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath) && target.startsWith(`${ROOT}${path.sep}`),
  `${relativePath} must be project-relative`);
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

function validateSample(sample, page, auditMember, baseUrl) {
  const semantic = auditMember.semanticEvidence;
  const correct = semantic.options.find((option) => option.correct);
  const wrong = semantic.options.find((option) => !option.correct);
  const glossaryEntry = page.glossaryEntries[0];
  const response = sample.assetResponses[0];
  invariant(correct && wrong && glossaryEntry &&
    sample.animationId === page.animationId &&
    sample.frameDomain === page.runtime.frameDomain &&
    sample.frameCount === page.runtime.frameCount &&
    sample.runtimeSha256 === page.runtime.canvasRenderer.sha256 &&
    ['ready', 'updating'].includes(sample.canvasState) &&
    sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1 && sample.assessment === null &&
    sample.groupedDrag === null && sample.numericResponse === null &&
    sample.choiceResponse === null &&
    exact(sample.guidedResponse?.sourceStopFrames,
      auditMember.interactiveStopFrames) &&
    sample.guidedResponse.help?.branchCount === 2 &&
    exact(sample.guidedResponse.help?.firstRun,
      semantic.helpPrompts.map((prompt) => prompt.text)) &&
    exact(sample.guidedResponse.help?.replayRun,
      semantic.helpPrompts.map((prompt) => prompt.text)) &&
    sample.guidedResponse.glossary?.entryId === glossaryEntry.id &&
    sample.guidedResponse.glossary?.sourceCharacterId ===
      glossaryEntry.sourceCharacterId &&
    sample.guidedResponse.glossary?.definition ===
      glossaryEntry.definitions.en &&
    sample.guidedResponse.firstWrong?.choice === wrong.id &&
    sample.guidedResponse.firstWrong?.value === wrong.value &&
    sample.guidedResponse.firstWrong?.feedback === 'Not yet.' &&
    sample.guidedResponse.firstWrong?.returnedToChoosing === true &&
    sample.guidedResponse.right?.choice === correct.id &&
    sample.guidedResponse.right?.value === correct.value &&
    sample.guidedResponse.right?.feedback === 'Correct!' &&
    Number.isSafeInteger(sample.guidedResponse.right?.branch) &&
    sample.guidedResponse.right.branch >= 1 &&
    sample.guidedResponse.right.branch <= 4 &&
    sample.guidedResponse.right.resolvedStopCount === 5 &&
    sample.guidedResponse.right.resumedFrame >= semantic.resumeFrame &&
    sample.guidedResponse.replay?.runtimeRemounted === true &&
    sample.guidedResponse.replay?.resetTryCount === 0 &&
    sample.guidedResponse.replay?.resolvedPreludeStopCount === 4 &&
    exact(sample.guidedResponse.secondWrong?.choices, [wrong.id, wrong.id]) &&
    exact(sample.guidedResponse.secondWrong?.values,
      [wrong.value, wrong.value]) &&
    sample.guidedResponse.secondWrong?.feedback ===
      'Review the worked solution' &&
    sample.guidedResponse.secondWrong?.resolvedStopCount === 5 &&
    sample.guidedResponse.secondWrong?.resumedFrame >= semantic.resumeFrame &&
    sample.guidedResponse.choiceFeedbackAudioAccepted === false &&
    sample.guidedResponse.externalNarrationAudioAccepted === false,
  `${page.animationId}: guided browser behavior evidence drifted`);
  invariant(response.url === `${baseUrl}/flash-assets/g678-local/` +
    `${page.animationId}/canvas-renderer.js?sha256=` +
    page.runtime.canvasRenderer.sha256 && response.status === 200 &&
    response.corp === 'same-origin' && response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${page.animationId}: local asset policy drifted`);
}

async function expectedArtifact() {
  const [auditCheck, generatorCheck, registrationCheck] = await Promise.all([
    auditG678AlgL09ResidualRouting({check: true}),
    runAlgL09GuidedTutorialCurrentJs({check: true}),
    finalizeAlgL09GuidedTutorialRegistration({check: true}),
  ]);
  invariant(auditCheck.check === true && generatorCheck.check === true &&
    registrationCheck.check === true &&
    registrationCheck.registrationCandidatePlacementCount === 339,
  'guided source/generator/provisional admission checks failed');
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3324'},
      maxBuffer: 32 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'guided browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 339 &&
    qaReceipt.sharedLessonCards === 44 && qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 90,
  'guided browser receipt check did not prove the 339-page product slice');

  const jsonInputs = new Set(['audit', 'generatorRun', 'generatorFragment',
    'registrationFreeze', 'registrationFragment', 'browser']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: jsonInputs.has(key)})],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const auditMembers = inputs.audit.value.members.filter((member) =>
    member.lane === 'advanced-manual-guided-tutorial-quiz-state-machine');
  const auditIds = auditMembers.map((member) => member.animationId).sort();
  const run = inputs.generatorRun.value;
  const generated = inputs.generatorFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.browser.value;
  invariant(exact(auditIds, EXPECTED_IDS) &&
    auditMembers.every((member) => member.interactiveStopFrames.length === 6 &&
      member.semanticEvidence.guidedStopCount === 4 &&
      member.semanticEvidence.needMoreHelpBranchCount === 2 &&
      member.semanticEvidence.options.filter((option) => option.correct)
        .length === 1 && member.registrationCandidate === false &&
      member.productCalibrationPassed === false),
  'guided exact source behavior authority drifted');
  invariant(run.generatedPlacementCount === 3 && run.members.length === 3 &&
    run.registryEntriesWritten === 0 &&
    exact(run.members.map((member) => member.animationId).sort(), auditIds) &&
    generated.generatedPlacementCount === 3 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    exact(generated.entries.map((entry) => entry.key).sort(), auditIds) &&
    exact(generated.compilerRun, descriptor(inputs.generatorRun)),
  'guided generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 339 &&
    freeze.selectedPages.length === 339 &&
    fragment.calibration.entries.length === 339 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'guided 339-page provisional registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(EXPECTED_IDS.every((id) => selected.get(id)?.adapterFamily ===
      'advanced-manual-alg-l09-guided-tutorial-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'alg-l09-guided-tutorial-browser-product-calibration-pending')),
  'guided registered page set is not the exact pre-calibration slice');
  invariant(browser.artifactType === 'g678-current-js-339-browser-qa-v1' &&
    browser.baseUrl === 'http://127.0.0.1:3324' &&
    browser.registeredCurrentJsPages === 339 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 339 &&
    browser.samples.length === 89 && browser.screenshots.length === 90 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exact(browser.inputs.sourceStaticHost, descriptor(inputs.sourceStaticHost)) &&
    exact(browser.inputs.algL09GuidedTutorialHost,
      descriptor(inputs.guidedHost)) &&
    exact(browser.inputs.algL09GuidedTutorialBehavior,
      descriptor(inputs.guidedBehavior)) &&
    exact(browser.inputs.animationContract,
      descriptor(inputs.animationContract)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'guided browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const member of auditMembers) {
    invariant(samples.has(member.animationId) && selected.has(member.animationId),
      `${member.animationId}: guided browser calibration sample is missing`);
    validateSample(samples.get(member.animationId),
      selected.get(member.animationId), member, browser.baseUrl);
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l09-guided-tutorial-family-calibration-v1',
    calibrationId: 'g678-alg-l09-guided-tutorial-family-calibration-v1',
    adapterFamily:
      'advanced-manual-alg-l09-guided-tutorial-source-static',
    status: 'exact-3-guided-tutorial-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 3,
    authorizedPlacementIds: EXPECTED_IDS,
    blockedPlacementCount: 0,
    sourceStopCount: 18,
    interactiveHostStopCount: 15,
    choiceCount: auditMembers.reduce((sum, member) =>
      sum + member.semanticEvidence.options.length, 0),
    browserSamples: Object.freeze(EXPECTED_IDS.map((id) => {
      const page = selected.get(id);
      const member = auditMembers.find((candidate) =>
        candidate.animationId === id);
      return Object.freeze({animationId: id,
        frameDomain: page.runtime.frameDomain,
        frameCount: page.runtime.frameCount,
        runtimeSha256: page.runtime.canvasRenderer.sha256,
        sourceStopFrames: Object.freeze([...member.interactiveStopFrames]),
        sourceResumeFrame: member.semanticEvidence.resumeFrame,
        glossaryTermCount: page.glossaryEntries.length,
        choiceCount: member.semanticEvidence.options.length,
        needMoreHelpBranchCount: 2,
        maximumWrongAttempts: 2});
    })),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      sourceSpecificStopSequencesBound: true,
      needMoreHelpBranchesBound: true,
      finalChoiceSetsBound: true,
      twoWrongAttemptsAndFeedbackResumePassed: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
      replayResetsInteractionAndReplaysPreludeStops: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsPartialRegistrationTruthful: true,
      familyCurrentJsGuidedTutorialCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({authorized: true,
      scope: 'exact-3-alg-l09-guided-tutorial-placements-only',
      permitsOtherAlgL09Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false}),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates the exact three ALG L9 guided tutorial pages through the maintained Current-JS product host.',
      'Four prelude stops, two source Need More Help branches, the source-specific final choice set, two-attempt feedback, glossary intents, and Replay reset were exercised in the browser.',
      'Choice-feedback and narration audio, authoritative original runtime, fidelity, human, Owner, strict-completion, release, and publication remain unaccepted.',
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

export async function buildAlgL09GuidedTutorialFamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'ALG L9 guided tutorial family calibration artifact drifted');
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
        .familyCurrentJsGuidedTutorialCalibrationPassed,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l09-guided-tutorial-family-calibration.mjs [--check]');
  buildAlgL09GuidedTutorialFamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
