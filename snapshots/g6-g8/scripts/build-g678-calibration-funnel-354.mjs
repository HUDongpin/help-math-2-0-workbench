#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'reports/g678-current-js-calibration-funnel-354-post-family-20260905.json';
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ALG_L09 = 'shared-alg001-l09';
const ALG_L11 = 'shared-alg001-l11';

const PATHS = Object.freeze({
  predecessorReport:
    'reports/g678-current-js-calibration-funnel-342-post-family-20260904.json',
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json',
  fragment:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  family:
    'catalog/product-bridge-calibrations/g678-alg-l11-tranche1-family-calibration-v1.json',
  focusedBrowser:
    'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json',
  aggregateBrowser: 'output/playwright/g678-current-js-354-v1/evidence.json',
  successorCompatibility:
    'catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  mapping: 'catalog/g678-grade-mapping.v1.json',
  release: 'catalog/g678-page-only-release-manifest.v1.json',
  governance: 'catalog/g678-review-governance.v1.json',
  advancedFragment:
    'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
});

export const FINAL354_INPUT_SHA256 = Object.freeze({
  freeze: 'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850',
  fragment: 'b3d161b1f499b0cd13f34e50445dbb2d5e049b5b0a0a2020b0d4721f92701c7b',
  privateRegistry:
    '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239',
  family: 'dffc9d559c4b9ca4bf46d320d951f283a60f6a469985b063e12492801904d3a6',
  focusedBrowser:
    '9be0fc2b2e5ce9e03e1eeb6ede42b6a8f6cc42e22d35eb998dc095b63391d6ec',
  aggregateBrowser:
    '6e8a3beab7433a662d38b263e43749a1ee146a54558b47d698b742521cd7571e',
  successorCompatibility:
    'fbe4fb77634a6fa84fbc7f6a2d486c78e20a0f5641332267f436dd78df81aeb8',
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

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function allFalse(value) {
  const entries = Object.entries(value ?? {});
  return entries.length > 0 && entries.every(([, item]) => item === false);
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return absolute;
}

async function binding(relativePath, {json = true} = {}) {
  const absolute = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary single-link file`);
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

export function assertFinal354InputBindings(inputs) {
  for (const [key, expectedSha256] of Object.entries(
    FINAL354_INPUT_SHA256)) {
    invariant(inputs[key]?.path === PATHS[key] &&
      inputs[key]?.sha256 === expectedSha256,
    `final354 ${key} binding drifted`);
  }
  return true;
}

export function deriveFinal354LessonTruth(catalog, selectedPages) {
  invariant(catalog?.activePagePlacementCount === 2282 &&
    catalog?.canonicalLessonXmlCount === 44 &&
    catalog?.lessons?.length === 44 && selectedPages?.length === 354 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 354,
  'final354 lesson truth inputs drifted');
  const counts = new Map();
  for (const page of selectedPages) {
    invariant(catalog.lessons.some((lesson) =>
      lesson.stableLessonKey === page.stableLessonKey),
    `${page.animationId}: selected lesson is absent from catalog`);
    counts.set(page.stableLessonKey,
      (counts.get(page.stableLessonKey) ?? 0) + 1);
  }
  const vector = catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.activePageCount,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  }));
  const completeLessonKeys = vector.filter((lesson) =>
    lesson.registeredPageCount === lesson.activePageCount)
    .map((lesson) => lesson.stableLessonKey);
  const partialLessonCount = vector.filter((lesson) =>
    lesson.registeredPageCount < lesson.activePageCount).length;
  const algL09 = vector.find((lesson) => lesson.stableLessonKey === ALG_L09);
  const algL11 = vector.find((lesson) => lesson.stableLessonKey === ALG_L11);
  invariant(vector.reduce((sum, lesson) =>
    sum + lesson.registeredPageCount, 0) === 354 &&
    vector.every((lesson) => lesson.registeredPageCount > 0 &&
      lesson.registeredPageCount <= lesson.activePageCount) &&
    exact(completeLessonKeys, [ALG_L09]) && partialLessonCount === 43 &&
    algL09?.registeredPageCount === 41 && algL09.activePageCount === 41 &&
    algL11?.registeredPageCount === 21 && algL11.activePageCount === 44,
  'final354 one-complete and 43-partial lesson truth drifted');
  return Object.freeze({vector: Object.freeze(vector),
    completeLessonKeys: Object.freeze(completeLessonKeys),
    partialLessonCount, algL09: Object.freeze({...algL09, complete: true}),
    algL11: Object.freeze({...algL11, complete: false})});
}

async function expectedReport() {
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath)]));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH),
    {json: false});
  assertFinal354InputBindings(inputs);

  const predecessor = inputs.predecessorReport.value;
  const freeze = inputs.freeze.value;
  const fragment = inputs.fragment.value;
  const registry = inputs.privateRegistry.value;
  const family = inputs.family.value;
  const focused = inputs.focusedBrowser.value;
  const aggregate = inputs.aggregateBrowser.value;
  const successor = inputs.successorCompatibility.value;
  const catalog = inputs.catalog.value;
  const selected = freeze.selectedPages ?? [];
  const selectedIds = selected.map((page) => page.animationId);
  const truth = deriveFinal354LessonTruth(catalog, selected);
  const calibration = registry.calibrations?.find((candidate) =>
    candidate.calibrationId === CALIBRATION_ID);
  const registryIds = calibration?.entries?.map((entry) => entry.key) ?? [];

  invariant(predecessor.artifactType === 'help-math-g678-acceptance-matrix' &&
    predecessor.calibration?.registeredCurrentJsPages === 342 &&
    predecessor.calibration?.totalProductHostCalibratedPages === 126 &&
    predecessor.funnel?.registeredCurrentJsPages === 342 &&
    predecessor.funnel?.engineeringPreviewLessons === 1 &&
    predecessor.lessons?.length === 44 &&
    exact(predecessor.lessons.filter((lesson) =>
      lesson.registeredPageCount === lesson.activePageCount)
      .map((lesson) => lesson.stableLessonKey), [ALG_L09]) &&
    allFalse(predecessor.acceptanceEffects),
  'final342 calibration-funnel predecessor drifted');

  invariant(freeze.calibrationId === CALIBRATION_ID &&
    freeze.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.deploymentScope === 'local-only' &&
    freeze.frozenCalibrationPlacementCount === 2282 &&
    freeze.registrationCandidatePlacementCount === 354 &&
    selected.length === 354 && new Set(selectedIds).size === 354 &&
    freeze.productHostCalibration?.familyCalibratedPlacementCount === 138 &&
    freeze.productHostCalibration?.familyCalibrationCount === 22 &&
    freeze.productHostCalibration?.algL11Tranche1FamilyCalibratedPlacementCount ===
      12 &&
    freeze.productHostCalibration?.currentHostPredecessorReplayCount === 92 &&
    freeze.productHostCalibration?.currentHostLiveSampleRecordCount === 104 &&
    freeze.productHostCalibration?.browserSampleCount === 104 &&
    freeze.productHostCalibration?.screenshotCount === 111 &&
    freeze.productHostCalibration?.oneCompleteAnd43PartialRegistrationTruthful ===
      true &&
    freeze.productHostCalibration?.wholeLessonEngineeringPreviewCount === 1 &&
    freeze.productHostCalibration?.newWholeLessonEngineeringPreviewCount === 0 &&
    freeze.productHostCalibration?.browserProductCalibrationPassed === true &&
    freeze.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(freeze.acceptanceEffects),
  'final354 product-calibrated freeze drifted');

  invariant(fragment.artifactType ===
      'private-current-js-calibration-fragment-v1' &&
    fragment.calibration?.calibrationId === CALIBRATION_ID &&
    fragment.calibration?.deploymentScope === 'local-only' &&
    fragment.calibration?.freezeManifest === inputs.freeze.path &&
    fragment.calibration?.entries?.length === 354 &&
    exact(fragment.freeze, descriptor(inputs.freeze)) &&
    fragment.descriptorProjection?.affectedLessonCount === 44 &&
    fragment.descriptorProjection?.wholeLessonEngineeringPreviewCount === 1 &&
    fragment.descriptorProjection?.newWholeLessonEngineeringPreviewCount === 0 &&
    exact(fragment.descriptorProjection?.exactCompleteLessonKeys, [ALG_L09]) &&
    fragment.descriptorProjection?.algL11RegisteredPageCount === 21 &&
    fragment.descriptorProjection?.algL11ActivePageCount === 44 &&
    fragment.registrationBoundary?.releaseOrPublicationAuthorized === false &&
    allFalse(fragment.acceptanceEffects),
  'final354 registered fragment drifted');

  invariant(calibration?.deploymentScope === 'local-only' &&
    calibration.freezeManifest === inputs.freeze.path &&
    calibration.freezeManifestSha256 === inputs.freeze.sha256 &&
    registryIds.length === 354 && new Set(registryIds).size === 354 &&
    exact([...registryIds].sort(), [...selectedIds].sort()),
  'final354 private registry projection drifted');

  invariant(family.artifactType ===
      'g678-alg-l11-tranche1-family-calibration-v1' &&
    family.status ===
      'exact-12-alg-l11-intro-terminal-simple-glossary-product-host-calibrated' &&
    family.auditedPlacementCount === 12 &&
    family.authorizedPlacementIds?.length === 12 &&
    family.blockedPlacementCount === 0 &&
    family.currentHostPredecessorSampleReplayCount === 92 &&
    family.aggregateCurrentHostLiveSampleRecordCount === 104 &&
    family.aggregateBrowserScreenshotCount === 111 &&
    family.productHostCalibration?.algL09Complete41Of41 === true &&
    family.productHostCalibration?.algL11Partial21Of44 === true &&
    family.productHostCalibration?.familyCurrentJsCalibrationPassed === true &&
    family.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    family.productHostCalibration?.fullPrior126Replay === false &&
    allFalse(family.acceptanceEffects),
  'ALG L11 tranche1 family authority drifted');

  invariant(focused.artifactType ===
      'g678-alg-l11-tranche1-browser-qa-v1' &&
    focused.registeredCurrentJsPages === 354 &&
    focused.allLessons?.sharedCardCount === 44 &&
    focused.allLessons?.linkedCardCount === 0 &&
    focused.allLessons?.registeredPageSum === 354 &&
    exact(focused.allLessons?.completeLessonKeys, [ALG_L09]) &&
    exact(focused.allLessons?.exactLessonVector, truth.vector) &&
    focused.currentHostPredecessorReplay
      ?.currentHostPredecessorSampleReplayCount === 92 &&
    focused.screenshots?.length === 15 && allFalse(focused.acceptanceEffects),
  'final354 focused browser evidence drifted');

  invariant(aggregate.artifactType === 'g678-current-js-354-browser-qa-v1' &&
    aggregate.registeredCurrentJsPages === 354 &&
    aggregate.allLessons?.sharedCardCount === 44 &&
    aggregate.allLessons?.linkedCardCount === 0 &&
    aggregate.allLessons?.registeredPageSum === 354 &&
    exact(aggregate.allLessons?.completeLessonKeys, [ALG_L09]) &&
    exact(aggregate.allLessons?.exactLessonVector, truth.vector) &&
    aggregate.samples?.length === 104 && aggregate.screenshots?.length === 111 &&
    aggregate.browserEvidenceComposition?.currentHostPredecessorSampleReplayCount ===
      92 &&
    aggregate.browserEvidenceComposition?.currentHostLiveRecordCount === 104 &&
    aggregate.browserEvidenceComposition?.currentHostUniqueSampledModuleCount ===
      104 &&
    aggregate.browserEvidenceComposition?.fullHistoricalSpecialInteractionReplay ===
      false &&
    aggregate.browserEvidenceComposition?.fullPrior126Replay === false &&
    allFalse(aggregate.acceptanceEffects),
  'final354 aggregate browser evidence drifted');

  invariant(successor.artifactType ===
      'g678-final342-current-bridge-successor-compatibility-v1' &&
    successor.final342Compatibility?.registeredPlacementCount === 342 &&
    successor.final342Compatibility?.descriptorInvariantCount === 342 &&
    successor.final342Compatibility?.currentBridgeStaticCompatibilityEstablished ===
      true &&
    successor.final342Compatibility?.currentHostBrowserRevalidated === false &&
    successor.exactInverseTransformation?.exactMatch === true &&
    successor.exactInverseTransformation?.otherBridgeChangesDetected === false &&
    successor.requiredProvisional354BrowserAssertions
      ?.predecessorSamplesMustBeReplayed === true &&
    successor.requiredProvisional354BrowserAssertions
      ?.browserProductCalibrationPassed === false &&
    allFalse(successor.acceptanceEffects),
  'final342 successor compatibility authority drifted');

  invariant(exact(freeze.inputs?.algL11Tranche1FamilyCalibration,
    descriptor(inputs.family)) &&
    exact(freeze.inputs?.focusedBrowserProductEvidence,
      descriptor(inputs.focusedBrowser)) &&
    exact(freeze.inputs?.browserProductEvidence,
      descriptor(inputs.aggregateBrowser)) &&
    exact(freeze.inputs?.successorCompatibilityAudit,
      descriptor(inputs.successorCompatibility)) &&
    selected.filter((page) => page.productHostCalibration).length === 138 &&
    selected.filter((page) => page.productHostCalibration).every((page) =>
      exact(page.productHostCalibration.browserEvidence,
        descriptor(inputs.aggregateBrowser))),
  'final354 family/browser authority is not rebound across 138 pages');

  for (const [key, sourceKey] of [
    ['catalog', 'catalogSha256'], ['mapping', 'mappingSha256'],
    ['release', 'releaseManifestSha256'],
    ['governance', 'governanceSha256'],
    ['advancedFragment', 'advancedFragmentSha256'],
  ]) invariant(predecessor.source[sourceKey] === inputs[key].sha256,
    `${key} drifted from predecessor funnel`);

  const predecessorLessons = new Map(predecessor.lessons.map((lesson) =>
    [lesson.stableLessonKey, lesson]));
  const lessons = truth.vector.map((current) => {
    const prior = predecessorLessons.get(current.stableLessonKey);
    invariant(prior?.moduleCode === current.moduleCode &&
      prior.lessonNumber === current.lessonNumber &&
      prior.activePageCount === current.activePageCount,
    `${current.stableLessonKey}: predecessor lesson identity drifted`);
    return Object.freeze({...prior,
      registeredPageCount: current.registeredPageCount});
  });
  invariant(lessons.filter((lesson) => lesson.availability ===
      'engineering-preview').length === 1 &&
    lessons.find((lesson) => lesson.stableLessonKey === ALG_L09)
      ?.availability === 'engineering-preview' &&
    lessons.find((lesson) => lesson.stableLessonKey === ALG_L11)
      ?.availability !== 'engineering-preview',
  'final354 whole-lesson engineering preview boundary drifted');

  const source = Object.freeze({...predecessor.source,
    scope: 'canonical-active-page-only-with-private-local-calibration',
    predecessorReportPath: inputs.predecessorReport.path,
    predecessorReportSha256: inputs.predecessorReport.sha256,
    final354Freeze: descriptor(inputs.freeze),
    final354Fragment: descriptor(inputs.fragment),
    privateRegistry: descriptor(inputs.privateRegistry),
    algL11Tranche1FamilyCalibration: descriptor(inputs.family),
    focusedBrowserEvidence: descriptor(inputs.focusedBrowser),
    aggregateBrowserEvidence: descriptor(inputs.aggregateBrowser),
    final342SuccessorCompatibility: descriptor(
      inputs.successorCompatibility),
    reportBuilderPath: builder.path,
    reportBuilderSha256: builder.sha256,
  });

  return Object.freeze({
    $schema: '../schemas/g678-acceptance-matrix-v1.schema.json',
    acceptanceEffects: predecessor.acceptanceEffects,
    artifactType: 'help-math-g678-acceptance-matrix',
    calibration: Object.freeze({...predecessor.calibration,
      localPagePreviews: 354,
      registeredCurrentJsPages: 354,
      totalProductHostCalibratedPages: 138,
      algL11Tranche1Pages: 12,
      algL11Tranche1ProductHostCalibratedPages: 12,
      algL11Tranche1FamilyProductHostCalibrationPassed: true,
      algL11ExactGlossaryButtonCount: 48,
      algL11RecoveredGlossaryTermCount: 23,
      currentHostPredecessorReplayCount: 92,
      currentHostLiveSampleRecordCount: 104,
      browserScreenshotCount: 111,
      wholeLessonEngineeringPreviews: 1,
      productCalibrationPassed: false,
      scaleOutAuthorized: false}),
    funnel: Object.freeze({...predecessor.funnel,
      registeredCurrentJsPages: 354,
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
    final354Truth: Object.freeze({
      activePagePlacements: 2282,
      registeredCurrentJsPages: 354,
      productHostCalibratedPages: 138,
      familyCalibrationCount: 22,
      lessonCount: 44,
      completeLessonKeys: truth.completeLessonKeys,
      partialLessonCount: truth.partialLessonCount,
      linkedLessonCardCount: 0,
      algL09: truth.algL09,
      algL11: truth.algL11,
      overallG678ProductCalibrationPassed: false,
      acceptanceEffects: FALSE_EFFECTS,
    }),
  });
}

async function main() {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-calibration-funnel-354.mjs [--check]');
  const check = args[0] === '--check';
  const report = await expectedReport();
  const bytes = stableBytes(report);
  let receiptBytes = bytes;
  if (check) {
    const current = await binding(OUTPUT);
    const expected = stableBytes({...report,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      '354 calibration funnel drifted');
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
    registeredCurrentJsPages: 354, productHostCalibratedPages: 138,
    familyCalibrationCount: 22, completeLessonCount: 1,
    partialLessonCount: 43, wholeLessonEngineeringPreviews: 1,
    acceptanceEffects: report.final354Truth.acceptanceEffects}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
