#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'reports/g678-current-js-calibration-funnel-342-post-family-20260904.json';
const PATHS = Object.freeze({
  predecessorReport:
    'reports/g678-current-js-calibration-funnel-336-post-family-20260904.json',
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localRegistry:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
  browser: 'output/playwright/g678-current-js-342-v1/evidence.json',
  focusedBrowser:
    'output/playwright/g678-alg-l09-game-assessment-342-v1/evidence.json',
  algL09GameAssessmentFamily:
    'catalog/product-bridge-calibrations/g678-alg-l09-game-assessment-family-calibration-v1.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  mapping: 'catalog/g678-grade-mapping.v1.json',
  release: 'catalog/g678-page-only-release-manifest.v1.json',
  governance: 'catalog/g678-review-governance.v1.json',
  advancedFragment:
    'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
});
const GAME_IDS = Object.freeze(['shared-alg001-l09-p030',
  'shared-alg001-l09-p031', 'shared-alg001-l09-p041']);
const GAME_FAMILIES = Object.freeze([
  'advanced-manual-alg-l09-game-controller-source-static',
  'advanced-manual-alg-l09-matching-game-source-static',
  'advanced-manual-alg-l09-final-assessment-source-static',
]);

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
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return absolute;
}

async function binding(relativePath, {json = false} = {}) {
  const absolute = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, buffer, bytes: buffer.length,
    sha256: sha256(buffer),
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(item) {
  return Object.freeze({path: item.path, bytes: item.bytes,
    sha256: item.sha256});
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function allFalse(value) {
  const entries = Object.entries(value ?? {});
  return entries.length > 0 && entries.every(([, item]) => item === false);
}

function parseLocalKeys(source) {
  const declaration = source.match(
    /export const registeredLocalOnlyAnimationKeys:[\s\S]*?: Object\.freeze\(\[([\s\S]*?)\]\);\n\nexport const localOnlyAnimationModuleRegistrations/u,
  );
  invariant(declaration, 'local registry key declaration is missing');
  return [...declaration[1].matchAll(/'([^']+)'/gu)]
    .map((match) => match[1]);
}

async function expectedReport() {
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: key !== 'localRegistry'})],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const predecessor = inputs.predecessorReport.value;
  const freeze = inputs.freeze.value;
  const registry = inputs.privateRegistry.value;
  const browser = inputs.browser.value;
  const focusedBrowser = inputs.focusedBrowser.value;
  const family = inputs.algL09GameAssessmentFamily.value;
  const catalog = inputs.catalog.value;
  const selected = freeze.selectedPages ?? [];
  const selectedIds = selected.map((page) => page.animationId);
  const calibrationId = 'g678-16-page-product-calibration-v1';
  const calibration = (registry.calibrations ?? []).find((candidate) =>
    candidate.calibrationId === calibrationId);
  const registryIds = (calibration?.entries ?? []).map((entry) => entry.key);
  const localIds = parseLocalKeys(inputs.localRegistry.buffer.toString('utf8'));

  invariant(predecessor.artifactType === 'help-math-g678-acceptance-matrix' &&
    predecessor.calibration?.registeredCurrentJsPages === 336 &&
    predecessor.calibration?.totalProductHostCalibratedPages === 120 &&
    predecessor.funnel?.registeredCurrentJsPages === 336 &&
    predecessor.funnel?.engineeringPreviewLessons === 0 &&
    predecessor.lessons?.length === 44 && allFalse(predecessor.acceptanceEffects),
  '336 calibration-funnel predecessor drifted');
  invariant(freeze.calibrationId === calibrationId &&
    freeze.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.deploymentScope === 'local-only' &&
    freeze.frozenCalibrationPlacementCount === 2282 &&
    freeze.registrationCandidatePlacementCount === 342 &&
    selected.length === 342 && new Set(selectedIds).size === 342 &&
    freeze.productHostCalibration?.familyCalibratedPlacementCount === 126 &&
    freeze.productHostCalibration?.familyCalibrationCount === 21 &&
    freeze.productHostCalibration?.browserSampleCount === 92 &&
    freeze.productHostCalibration?.screenshotCount === 96 &&
    freeze.productHostCalibration?.wholeLessonEngineeringPreviewCount === 1 &&
    freeze.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(freeze.acceptanceEffects),
  '342 product-calibrated freeze drifted');
  invariant(calibration?.deploymentScope === 'local-only' &&
    calibration.freezeManifest === inputs.freeze.path &&
    calibration.freezeManifestSha256 === inputs.freeze.sha256 &&
    registryIds.length === 342 && new Set(registryIds).size === 342 &&
    exact([...registryIds].sort(), [...selectedIds].sort()) &&
    localIds.length === 342 && new Set(localIds).size === 342 &&
    exact([...localIds].sort(), [...selectedIds].sort()),
  '342 private/local registry projection drifted');
  invariant(browser.artifactType === 'g678-current-js-342-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 342 &&
    browser.allLessons?.sharedCardCount === 44 &&
    browser.allLessons?.linkedCardCount === 0 &&
    browser.allLessons?.registeredPageSum === 342 &&
    exact(browser.allLessons?.completeLessonKeys, ['shared-alg001-l09']) &&
    browser.samples?.length === 92 && browser.screenshots?.length === 96 &&
    allFalse(browser.acceptanceEffects) &&
    exact(freeze.inputs?.browserProductEvidence, descriptor(inputs.browser)),
  '342 aggregate browser product evidence drifted');
  invariant(focusedBrowser.artifactType ===
      'g678-alg-l09-game-assessment-browser-qa-v1' &&
    focusedBrowser.registeredCurrentJsPages === 342 &&
    exact(focusedBrowser.allLessons?.completeLessonKeys,
      ['shared-alg001-l09']) &&
    focusedBrowser.controllerAndGame?.selectedLevel === 2 &&
    focusedBrowser.controllerAndGame?.levelHandoffInherited === true &&
    focusedBrowser.controllerAndGame?.navigationTarget === GAME_IDS[1] &&
    focusedBrowser.controllerAndGame?.finalScore === 58 &&
    focusedBrowser.controllerAndGame?.matchedPairCount === 6 &&
    focusedBrowser.controllerAndGame?.visibleCardLabels?.length === 12 &&
    focusedBrowser.controllerAndGame?.level1VisibleCardLabels?.length === 12 &&
    focusedBrowser.controllerAndGame?.level1ScoringAndResetPassed === true &&
    focusedBrowser.controllerAndGame?.controllerReplayReset === true &&
    focusedBrowser.controllerAndGame?.matchingReplayReset === true &&
    focusedBrowser.controllerAndGame?.levelSwitchHeldDuringFeedback === true &&
    focusedBrowser.finalAssessment?.questionPoolSize === 24 &&
    focusedBrowser.finalAssessment?.presentedQuestionCount === 10 &&
    focusedBrowser.finalAssessment?.uniqueQuestionCount === 10 &&
    focusedBrowser.finalAssessment?.correctResponseCount === 9 &&
    focusedBrowser.finalAssessment?.wrongResponse?.selectedOption !==
      focusedBrowser.finalAssessment?.wrongResponse?.correctOption &&
    typeof focusedBrowser.finalAssessment?.wrongReviewComparison === 'string' &&
    focusedBrowser.finalAssessment.wrongReviewComparison.length > 0 &&
    focusedBrowser.finalAssessment?.hostFqScore?.attempted === 10 &&
    focusedBrowser.finalAssessment?.hostFqScore?.correct === 9 &&
    focusedBrowser.finalAssessment?.hostFqScore?.pointsAwarded === 9 &&
    focusedBrowser.finalAssessment?.hostFqScore?.pointsPossible === 10 &&
    focusedBrowser.finalAssessment?.sourceQuestionContentVisible === true &&
    focusedBrowser.finalAssessment?.visibleQuestionContent?.length === 10 &&
    focusedBrowser.finalAssessment?.twoChoiceQuestionCount > 0 &&
    focusedBrowser.finalAssessment?.reviewCount === 10 &&
    focusedBrowser.finalAssessment?.fqReplayReset === true &&
    focusedBrowser.finalAssessment?.observedRequestCount > 0 &&
    focusedBrowser.finalAssessment?.legacyNetworkOperationsObserved === 0 &&
    focusedBrowser.finalAssessment?.allObservedRequestsLoopback === true &&
    focusedBrowser.finalAssessment?.allObservedRequestsExplicitlyAllowed === true &&
    focusedBrowser.screenshots?.length === 6 &&
    allFalse(focusedBrowser.acceptanceEffects),
  'ALG L9 focused browser product evidence drifted');
  invariant(family.artifactType ===
      'g678-alg-l09-game-assessment-family-calibration-v1' &&
    family.status === 'exact-3-game-assessment-product-host-calibrated' &&
    exact(family.adapterFamilies, GAME_FAMILIES) &&
    exact([...family.authorizedPlacementIds].sort(), [...GAME_IDS].sort()) &&
    family.productHostCalibration?.typedCrossPageNavigationPassed === true &&
    family.productHostCalibration?.matchingGameTwoLevelsAndScoringPassed === true &&
    family.productHostCalibration
      ?.finalAssessmentRandomTenScoringAndReviewPassed === true &&
    family.productHostCalibration?.allLegacyNetworkOperationsBlocked === true &&
    family.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(family.acceptanceEffects) &&
    exact(freeze.inputs?.algL09GameAssessmentFamilyCalibration,
      descriptor(inputs.algL09GameAssessmentFamily)),
  'ALG L9 game/assessment family calibration authority drifted');
  const gamePages = selected.filter((page) =>
    GAME_FAMILIES.includes(page.adapterFamily));
  invariant(gamePages.length === 3 && exact(gamePages.map((page) =>
    page.animationId).sort(), [...GAME_IDS].sort()) && gamePages.every((page) =>
      page.implementation?.familyVisualPlaybackCalibrationPassed === true &&
      page.implementation?.feedbackAndAssessmentAudioAccepted === false &&
      page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false),
  'ALG L9 game/assessment calibrated page projection drifted');
  const calibratedPages = selected.filter((page) => page.productHostCalibration);
  invariant(calibratedPages.length === 126 && calibratedPages.every((page) =>
    exact(page.productHostCalibration.browserEvidence,
      descriptor(inputs.browser))),
  'aggregate browser receipt is not bound to all calibrated pages');
  invariant(catalog.activePagePlacementCount === 2282 &&
    catalog.canonicalLessonXmlCount === 44 && catalog.lessons?.length === 44,
  'G678 catalog denominator drifted');

  const counts = new Map();
  for (const page of selected) {
    counts.set(page.stableLessonKey,
      (counts.get(page.stableLessonKey) ?? 0) + 1);
  }
  const predecessorLessons = new Map(predecessor.lessons.map((lesson) =>
    [lesson.stableLessonKey, lesson]));
  const lessons = catalog.lessons.map((catalogLesson) => {
    const prior = predecessorLessons.get(catalogLesson.stableLessonKey);
    const registeredPageCount = counts.get(catalogLesson.stableLessonKey) ?? 0;
    const isEngineeringPreview = catalogLesson.stableLessonKey ===
      'shared-alg001-l09';
    invariant(prior?.moduleCode === catalogLesson.moduleCode &&
      prior.lessonNumber === catalogLesson.lessonNumber &&
      prior.activePageCount === catalogLesson.activePageCount &&
      registeredPageCount > 0 && (isEngineeringPreview
        ? registeredPageCount === catalogLesson.activePageCount
        : registeredPageCount < catalogLesson.activePageCount),
    `${catalogLesson.stableLessonKey}: lesson projection drifted`);
    return Object.freeze({...prior, registeredPageCount,
      ...(isEngineeringPreview ? {
        availability: 'engineering-preview',
        evidenceBoundary:
          'Local-only 41/41 registered Current-JS engineering preview; Common Core grade mapping and every downstream acceptance and release gate remain pending.',
      } : {}),
    });
  });
  invariant(lessons.reduce((sum, lesson) =>
    sum + lesson.registeredPageCount, 0) === 342 &&
    lessons.filter((lesson) =>
      lesson.registeredPageCount === lesson.activePageCount).length === 1 &&
    lessons.filter((lesson) =>
      lesson.availability === 'engineering-preview').length === 1,
  '342 per-lesson registration or engineering-preview vector drifted');
  for (const [key, sourceKey] of [
    ['catalog', 'catalogSha256'], ['mapping', 'mappingSha256'],
    ['release', 'releaseManifestSha256'],
    ['governance', 'governanceSha256'],
    ['advancedFragment', 'advancedFragmentSha256'],
  ]) invariant(predecessor.source[sourceKey] === inputs[key].sha256,
    `${key} drifted from predecessor funnel`);

  const source = Object.freeze({...predecessor.source,
    scope: 'canonical-active-page-only-with-private-local-calibration',
    predecessorReportPath: inputs.predecessorReport.path,
    predecessorReportSha256: inputs.predecessorReport.sha256,
    calibrationFreezePath: inputs.freeze.path,
    calibrationFreezeSha256: inputs.freeze.sha256,
    privateRegistryPath: inputs.privateRegistry.path,
    privateRegistrySha256: inputs.privateRegistry.sha256,
    localRegistryPath: inputs.localRegistry.path,
    localRegistrySha256: inputs.localRegistry.sha256,
    browserEvidencePath: inputs.browser.path,
    browserEvidenceSha256: inputs.browser.sha256,
    focusedBrowserEvidencePath: inputs.focusedBrowser.path,
    focusedBrowserEvidenceSha256: inputs.focusedBrowser.sha256,
    algL09GameAssessmentFamilyCalibrationPath:
      inputs.algL09GameAssessmentFamily.path,
    algL09GameAssessmentFamilyCalibrationSha256:
      inputs.algL09GameAssessmentFamily.sha256,
    reportBuilderPath: builder.path,
    reportBuilderSha256: builder.sha256,
  });
  return Object.freeze({
    $schema: '../schemas/g678-acceptance-matrix-v1.schema.json',
    acceptanceEffects: predecessor.acceptanceEffects,
    artifactType: 'help-math-g678-acceptance-matrix',
    calibration: Object.freeze({...predecessor.calibration,
      localPagePreviews: 342,
      registeredCurrentJsPages: 342,
      totalProductHostCalibratedPages: 126,
      algL09GameControllerPages: 1,
      algL09MatchingGamePages: 1,
      algL09FinalAssessmentPages: 1,
      algL09GameAssessmentProductHostCalibratedPages: 3,
      algL09TypedCrossPageNavigationPassed: true,
      algL09LevelHandoffInherited: true,
      algL09VisibleRatioLabelCount: 12,
      algL09Level1VisibleRatioLabelCount: 12,
      algL09Level1ScoringAndResetPassed: true,
      algL09ControllerReplayResetPassed: true,
      algL09MatchingReplayResetPassed: true,
      algL09LevelSwitchHeldDuringFeedback: true,
      algL09MatchingGameTwoLevelsAndScoringPassed: true,
      algL09FinalAssessmentRandomTenScoringAndReviewPassed: true,
      algL09FinalAssessmentWrongAnswerReviewPassed: true,
      algL09FinalAssessmentHostScorePassed: true,
      algL09FinalAssessmentReplayResetPassed: true,
      algL09FinalAssessmentSourceQuestionContentVisible: true,
      algL09FinalAssessmentVisibleQuestionCount: 10,
      algL09FinalAssessmentTwoChoiceQuestionSampled: true,
      algL09LegacyNetworkOperationsBlocked: true,
      algL09AllObservedRequestsLoopbackAndAllowlisted: true,
      algL09GameAssessmentAudioAccepted: false,
      wholeLessonEngineeringPreviews: 1,
      productCalibrationPassed: false,
      scaleOutAuthorized: false}),
    funnel: Object.freeze({...predecessor.funnel,
      registeredCurrentJsPages: 342,
      engineeringPreviewLessons: 1,
      originalRuntimeEvidencePages: 0,
      fidelityAcceptedPages: 0,
      audioAcceptedPages: 0,
      humanVisualAcceptedLessons: 0,
      ownerAcceptedLessons: 0,
      strictCompleteLessons: 0,
      releasedLessons: 0,
      publishedLessons: 0}),
    generatedAt: new Date().toISOString(),
    lessons: Object.freeze(lessons),
    matrixId: 'g678-current-js-calibration-funnel-v1',
    schemaVersion: 1,
    source,
    sourceAudit: predecessor.sourceAudit,
  });
}

async function main() {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-calibration-funnel-342.mjs [--check]');
  const check = args[0] === '--check';
  const report = await expectedReport();
  const bytes = stableBytes(report);
  let receiptBytes = bytes;
  if (check) {
    const current = await binding(OUTPUT, {json: true});
    const expected = stableBytes({...report,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      '342 calibration funnel drifted');
    receiptBytes = current.buffer;
  } else {
    const target = projectPath(OUTPUT);
    invariant(!await lstat(target).then(() => true, () => false),
      `${OUTPUT} already exists`);
    await mkdir(path.dirname(target), {recursive: true});
    const staging = `${target}.staging-${process.pid}`;
    await writeFile(staging, bytes, {flag: 'wx'});
    await rename(staging, target);
  }
  process.stdout.write(`${JSON.stringify({check, output: OUTPUT,
    bytes: receiptBytes.length, sha256: sha256(receiptBytes),
    registeredCurrentJsPages: 342, productHostCalibratedPages: 126,
    wholeLessonEngineeringPreviews: 1,
    acceptanceEffects: report.acceptanceEffects}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
