#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'reports/g678-current-js-calibration-funnel-277-post-family-20260902.json';
const PATHS = Object.freeze({
  predecessorReport:
    'reports/g678-current-js-calibration-funnel-276-post-family-20260902.json',
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-277-page-product-calibrated-registration-v1.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localRegistry:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
  browser: 'output/playwright/g678-current-js-277-v1/evidence.json',
  ts07Family:
    'catalog/product-bridge-calibrations/g678-ts07-nms-l1-family-calibration-v1.json',
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
  return Object.freeze({path: item.path, sha256: item.sha256});
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
  return [...declaration[1].matchAll(/'([^']+)'/gu)].map((match) => match[1]);
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
  const family = inputs.ts07Family.value;
  const catalog = inputs.catalog.value;
  const calibrationId = 'g678-16-page-product-calibration-v1';
  const selected = freeze.selectedPages ?? [];
  const selectedIds = selected.map((page) => page.animationId);
  const calibration = (registry.calibrations ?? []).find((candidate) =>
    candidate.calibrationId === calibrationId);
  const registryIds = (calibration?.entries ?? []).map((entry) => entry.key);
  const localIds = parseLocalKeys(inputs.localRegistry.buffer.toString('utf8'));
  invariant(predecessor.artifactType === 'help-math-g678-acceptance-matrix' &&
    predecessor.calibration?.registeredCurrentJsPages === 276 &&
    predecessor.funnel?.registeredCurrentJsPages === 276 &&
    predecessor.lessons?.length === 44 &&
    allFalse(predecessor.acceptanceEffects),
  '276 calibration-funnel predecessor drifted');
  invariant(freeze.calibrationId === calibrationId &&
    freeze.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.deploymentScope === 'local-only' &&
    freeze.frozenCalibrationPlacementCount === 2282 &&
    freeze.registrationCandidatePlacementCount === 277 &&
    selected.length === 277 && new Set(selectedIds).size === 277 &&
    freeze.productHostCalibration?.familyCalibratedPlacementCount === 61 &&
    freeze.productHostCalibration?.familyCalibrationCount === 5 &&
    freeze.productHostCalibration?.browserSampleCount === 27 &&
    freeze.productHostCalibration?.screenshotCount === 28 &&
    freeze.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(freeze.acceptanceEffects),
  '277 product-calibrated freeze drifted');
  invariant(calibration?.deploymentScope === 'local-only' &&
    calibration.freezeManifest === inputs.freeze.path &&
    calibration.freezeManifestSha256 === inputs.freeze.sha256 &&
    registryIds.length === 277 && new Set(registryIds).size === 277 &&
    JSON.stringify([...registryIds].sort()) ===
      JSON.stringify([...selectedIds].sort()) &&
    localIds.length === 277 && new Set(localIds).size === 277 &&
    JSON.stringify([...localIds].sort()) ===
      JSON.stringify([...selectedIds].sort()),
  '277 private/local registry projection drifted');
  const browserSample = browser.samples?.find((sample) =>
    sample.animationId === 'shared-nms002-l01-p043');
  invariant(browser.artifactType === 'g678-current-js-277-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 277 &&
    browser.allLessons?.sharedCardCount === 44 &&
    browser.allLessons?.linkedCardCount === 0 &&
    browser.allLessons?.registeredPageSum === 277 &&
    browser.samples?.length === 27 && browser.screenshots?.length === 28 &&
    browserSample?.assessment?.sourceStopFrame === 757 &&
    browserSample?.assessment?.right?.resolvedStopCount === 1 &&
    browserSample?.assessment?.replay?.runtimeRemounted === true &&
    browserSample?.assessment?.feedbackAudioAccepted === false &&
    allFalse(browser.acceptanceEffects),
  '277 browser product evidence drifted');
  invariant(family.artifactType ===
      'g678-ts07-nms-l1-family-calibration-v1' &&
    family.status ===
      'exact-one-current-js-assessment-product-host-calibrated' &&
    family.adapterFamily === 'ts07-nms-l1-assessment-source-static' &&
    JSON.stringify(family.authorizedPlacementIds) ===
      JSON.stringify(['shared-nms002-l01-p043']) &&
    family.productHostCalibration
      ?.familyCurrentJsVisualAssessmentCalibrationPassed === true &&
    family.productHostCalibration?.feedbackAudioAccepted === false &&
    family.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(family.acceptanceEffects),
  'TS07 family calibration authority drifted');
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
    sum + lesson.registeredPageCount, 0) === 277,
  '277 per-lesson registration vector drifted');
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
    ts07FamilyCalibrationPath: inputs.ts07Family.path,
    ts07FamilyCalibrationSha256: inputs.ts07Family.sha256,
    reportBuilderPath: builder.path,
    reportBuilderSha256: builder.sha256,
  });
  for (const [key, sourceKey] of [
    ['catalog', 'catalogSha256'], ['mapping', 'mappingSha256'],
    ['release', 'releaseManifestSha256'],
    ['governance', 'governanceSha256'],
    ['advancedFragment', 'advancedFragmentSha256'],
  ]) invariant(predecessor.source[sourceKey] === inputs[key].sha256,
    `${key} drifted from predecessor funnel`);
  return Object.freeze({
    $schema: '../schemas/g678-acceptance-matrix-v1.schema.json',
    acceptanceEffects: predecessor.acceptanceEffects,
    artifactType: 'help-math-g678-acceptance-matrix',
    calibration: Object.freeze({...predecessor.calibration,
      localPagePreviews: 277,
      registeredCurrentJsPages: 277,
      totalProductHostCalibratedPages: 61,
      ts07AssessmentPages: 1,
      ts07ProductHostCalibratedPages: 1,
      ts07FamilyProductHostCalibrationPassed: true,
      wholeLessonEngineeringPreviews: 0,
      productCalibrationPassed: false,
      scaleOutAuthorized: false}),
    funnel: Object.freeze({...predecessor.funnel,
      registeredCurrentJsPages: 277,
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
    'usage: build-g678-calibration-funnel-277.mjs [--check]');
  const check = args[0] === '--check';
  const report = await expectedReport();
  const bytes = stableBytes(report);
  if (check) {
    const current = await binding(OUTPUT, {json: true});
    const expected = stableBytes({...report,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      '277 calibration funnel drifted');
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
    bytes: bytes.length, sha256: sha256(bytes),
    registeredCurrentJsPages: 277, productHostCalibratedPages: 61,
    wholeLessonEngineeringPreviews: 0,
    acceptanceEffects: report.acceptanceEffects}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
