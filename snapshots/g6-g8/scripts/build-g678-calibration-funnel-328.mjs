#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'reports/g678-current-js-calibration-funnel-328-post-family-20260903.json';
const PATHS = Object.freeze({
  predecessorReport:
    'reports/g678-current-js-calibration-funnel-327-post-family-20260903.json',
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-328-page-product-calibrated-registration-v1.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localRegistry:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
  browser: 'output/playwright/g678-current-js-328-v1/evidence.json',
  algL09In06ChoiceFamily:
    'catalog/product-bridge-calibrations/g678-alg-l09-in06-choice-family-calibration-v1.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  mapping: 'catalog/g678-grade-mapping.v1.json',
  release: 'catalog/g678-page-only-release-manifest.v1.json',
  governance: 'catalog/g678-review-governance.v1.json',
  advancedFragment:
    'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
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
  const family = inputs.algL09In06ChoiceFamily.value;
  const catalog = inputs.catalog.value;
  const calibrationId = 'g678-16-page-product-calibration-v1';
  const selected = freeze.selectedPages ?? [];
  const selectedIds = selected.map((page) => page.animationId);
  const calibration = (registry.calibrations ?? []).find((candidate) =>
    candidate.calibrationId === calibrationId);
  const registryIds = (calibration?.entries ?? []).map((entry) => entry.key);
  const localIds = parseLocalKeys(inputs.localRegistry.buffer.toString('utf8'));
  invariant(predecessor.artifactType === 'help-math-g678-acceptance-matrix' &&
    predecessor.calibration?.registeredCurrentJsPages === 327 &&
    predecessor.calibration?.totalProductHostCalibratedPages === 111 &&
    predecessor.funnel?.registeredCurrentJsPages === 327 &&
    predecessor.lessons?.length === 44 &&
    allFalse(predecessor.acceptanceEffects),
  '327 calibration-funnel predecessor drifted');
  invariant(freeze.calibrationId === calibrationId &&
    freeze.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.deploymentScope === 'local-only' &&
    freeze.frozenCalibrationPlacementCount === 2282 &&
    freeze.registrationCandidatePlacementCount === 328 &&
    selected.length === 328 && new Set(selectedIds).size === 328 &&
    freeze.productHostCalibration?.familyCalibratedPlacementCount === 112 &&
    freeze.productHostCalibration?.familyCalibrationCount === 16 &&
    freeze.productHostCalibration?.browserSampleCount === 78 &&
    freeze.productHostCalibration?.screenshotCount === 79 &&
    freeze.productHostCalibration?.overallG678ProductCalibrationPassed ===
      false &&
    allFalse(freeze.acceptanceEffects),
  '328 product-calibrated freeze drifted');
  invariant(calibration?.deploymentScope === 'local-only' &&
    calibration.freezeManifest === inputs.freeze.path &&
    calibration.freezeManifestSha256 === inputs.freeze.sha256 &&
    registryIds.length === 328 && new Set(registryIds).size === 328 &&
    JSON.stringify([...registryIds].sort()) ===
      JSON.stringify([...selectedIds].sort()) &&
    localIds.length === 328 && new Set(localIds).size === 328 &&
    JSON.stringify([...localIds].sort()) ===
      JSON.stringify([...selectedIds].sort()),
  '328 private/local registry projection drifted');
  invariant(browser.artifactType === 'g678-current-js-328-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 328 &&
    browser.allLessons?.sharedCardCount === 44 &&
    browser.allLessons?.linkedCardCount === 0 &&
    browser.allLessons?.registeredPageSum === 328 &&
    browser.samples?.length === 78 && browser.screenshots?.length === 79 &&
    allFalse(browser.acceptanceEffects) &&
    JSON.stringify(freeze.inputs?.browserProductEvidence) ===
      JSON.stringify(descriptor(inputs.browser)),
  '328 browser product evidence drifted');
  const familyIds = family.authorizedPlacementIds ?? [];
  const familyPages = selected.filter((page) =>
    page.adapterFamily === 'alg-l09-in06-choice-source-static');
  invariant(family.artifactType ===
      'g678-alg-l09-in06-choice-family-calibration-v1' &&
    family.status ===
      'exact-1-in06-choice-quiz-product-host-calibrated' &&
    family.adapterFamily === 'alg-l09-in06-choice-source-static' &&
    familyIds.length === 1 && new Set(familyIds).size === 1 &&
    family.sourceButtonCount === 3 && family.uniqueGlossaryTermCount === 3 &&
    family.choiceCount === 4 &&
    family.productHostCalibration
      ?.familyCurrentJsIn06ChoiceCalibrationPassed === true &&
    family.productHostCalibration?.frame188InteractiveStopBound === true &&
    family.productHostCalibration?.fourSourceRatioChoicesBound === true &&
    family.productHostCalibration
      ?.twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
    family.productHostCalibration?.overallG678ProductCalibrationPassed ===
      false &&
    allFalse(family.acceptanceEffects) &&
    JSON.stringify(freeze.inputs?.algL09In06ChoiceFamilyCalibration) ===
      JSON.stringify(descriptor(inputs.algL09In06ChoiceFamily)) &&
    familyPages.length === 1 && familyPages.every((page) =>
      page.implementation?.familyVisualPlaybackCalibrationPassed === true &&
      page.implementation?.sourceChoiceQuizStopBound === true &&
      page.implementation?.sourceChoiceQuizBehaviorBound === true &&
      page.implementation?.choiceFeedbackAudioAccepted === false &&
      page.productHostCalibration?.frame188InteractiveStopBound === true &&
      page.productHostCalibration?.fourSourceRatioChoicesBound === true &&
      page.productHostCalibration
        ?.twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
      (page.glossaryEntries?.length ?? 0) === 3 &&
      page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false),
  'ALG L9 IN06 choice family calibration authority drifted');
  const calibratedPages = selected.filter((page) => page.productHostCalibration);
  invariant(calibratedPages.length === 112 && calibratedPages.every((page) =>
    JSON.stringify(page.productHostCalibration.browserEvidence) ===
      JSON.stringify(descriptor(inputs.browser))),
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
    invariant(prior?.moduleCode === catalogLesson.moduleCode &&
      prior.lessonNumber === catalogLesson.lessonNumber &&
      prior.activePageCount === catalogLesson.activePageCount &&
      registeredPageCount > 0 &&
      registeredPageCount < catalogLesson.activePageCount,
    `${catalogLesson.stableLessonKey}: lesson projection drifted`);
    return Object.freeze({...prior, registeredPageCount});
  });
  invariant(lessons.reduce((sum, lesson) =>
    sum + lesson.registeredPageCount, 0) === 328,
  '328 per-lesson registration vector drifted');
  for (const [key, sourceKey] of [
    ['catalog', 'catalogSha256'], ['mapping', 'mappingSha256'],
    ['release', 'releaseManifestSha256'],
    ['governance', 'governanceSha256'],
    ['advancedFragment', 'advancedFragmentSha256'],
  ]) invariant(predecessor.source[sourceKey] === inputs[key].sha256,
    `${key} drifted from predecessor funnel`);
  const source = Object.freeze({
    ...predecessor.source,
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
    algL09In06ChoiceFamilyCalibrationPath:
      inputs.algL09In06ChoiceFamily.path,
    algL09In06ChoiceFamilyCalibrationSha256:
      inputs.algL09In06ChoiceFamily.sha256,
    reportBuilderPath: builder.path,
    reportBuilderSha256: builder.sha256,
  });
  return Object.freeze({
    $schema: '../schemas/g678-acceptance-matrix-v1.schema.json',
    acceptanceEffects: predecessor.acceptanceEffects,
    artifactType: 'help-math-g678-acceptance-matrix',
    calibration: Object.freeze({...predecessor.calibration,
      localPagePreviews: 328,
      registeredCurrentJsPages: 328,
      totalProductHostCalibratedPages: 112,
      algL09TerminalStopPages: 3,
      algL09TerminalStopProductHostCalibratedPages: 3,
      algL09IntroShellLinkageFamilyProductHostCalibrationPassed: true,
      algL09Vb06DragPages: 1,
      algL09Vb06DragProductHostCalibratedPages: 1,
      algL09Vb06DragFrame129StopBound: true,
      algL09Vb06DragFrame130ResumeBound: true,
      algL09Vb06DragFeedbackAudioAccepted: false,
      algL09Vb02GlossaryPages: 1,
      algL09Vb02GlossaryProductHostCalibratedPages: 1,
      algL09Vb02GlossaryMainTimelineScriptCount: 0,
      algL09Vb02GlossaryDormantChildAudioAccepted: false,
      algL09In04NumericPages: 1,
      algL09In04NumericProductHostCalibratedPages: 1,
      algL09In04NumericFrame270StopBound: true,
      algL09In04NumericFrame271ResumeBound: true,
      algL09In04NumericRightFeedbackAudioAccepted: false,
      algL09In06ChoicePages: 1,
      algL09In06ChoiceProductHostCalibratedPages: 1,
      algL09In06ChoiceFrame188StopBound: true,
      algL09In06ChoiceFrame189ResumeBound: true,
      algL09In06ChoiceFeedbackAudioAccepted: false,
      algL09TerminalStopSourceEndpointBound: true,
      algL09TerminalStopGlossaryPages: 1,
      wholeLessonEngineeringPreviews: 0,
      productCalibrationPassed: false,
      scaleOutAuthorized: false}),
    funnel: Object.freeze({...predecessor.funnel,
      registeredCurrentJsPages: 328,
      engineeringPreviewLessons: 0,
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
    'usage: build-g678-calibration-funnel-328.mjs [--check]');
  const check = args[0] === '--check';
  const report = await expectedReport();
  const bytes = stableBytes(report);
  let receiptBytes = bytes;
  if (check) {
    const current = await binding(OUTPUT, {json: true});
    const expected = stableBytes({...report,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      '328 calibration funnel drifted');
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
    registeredCurrentJsPages: 328, productHostCalibratedPages: 112,
    wholeLessonEngineeringPreviews: 0,
    acceptanceEffects: report.acceptanceEffects}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
