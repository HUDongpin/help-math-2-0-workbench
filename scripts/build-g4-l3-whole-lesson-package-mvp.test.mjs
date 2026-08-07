import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {
  mkdir,
  lstat,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  KEY_TERMS_FOCUS_RESTORATION_MODE,
  PackageSmokeValidationError,
  V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
  V33_FAILED_QA_ATTEMPT_PREIMAGES,
  V33_FROZEN_PREIMAGES,
  V33_R2_FROZEN_PREIMAGES,
  V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES,
  V33_R2_QA_HARNESS_REVISION,
  V33_R3_FROZEN_PREIMAGES,
  V33_R3_SMOKE_HARNESS_REVISION,
  assertImmutableBuildTargetsAbsent,
  assertPackageInputSnapshotCurrent,
  assertReportScreenshotBindings,
  assertSafeV3ArchiveEntries,
  assertVariantModeAllowed,
  assertV33FrozenPreimages,
  assertV33R2FrozenPreimages,
  assertV33R3FrozenPreimages,
  buildSmokeScreenshotBinding,
  buildPackageSmokeHarnessRevisionManifest,
  commitImmutablePackageBundle,
  evaluateKeyTermsFocusRestoration,
  findAvailableLoopbackPort,
  isAllowedCourseAsset,
  launcherSource,
  parseArguments,
  resolvePackageVariant,
  sanitizeNextStandaloneLocalPaths,
  selectG4L3Release,
  validateV3ReadabilityReport,
  validateV3ReadabilityEnhancements,
  validateV31RegressionEvidence,
  verifierSource,
} from './build-g4-l3-whole-lesson-package-mvp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('whole-lesson package CLI requires one explicit mode', () => {
  assert.equal(parseArguments(['--build']), 'build');
  assert.equal(parseArguments(['--check']), 'check');
  assert.equal(parseArguments(['--smoke']), 'smoke');
  assert.equal(parseArguments(['--v2', '--build']), 'v2:build');
  assert.equal(parseArguments(['--check', '--v2']), 'v2:check');
  assert.equal(parseArguments(['--v2', '--smoke']), 'v2:smoke');
  assert.equal(parseArguments(['--v3', '--build']), 'v3:build');
  assert.equal(parseArguments(['--check', '--v3']), 'v3:check');
  assert.equal(parseArguments(['--v3', '--smoke']), 'v3:smoke');
  assert.equal(parseArguments(['--v3-1', '--build']), 'v3-1:build');
  assert.equal(parseArguments(['--check', '--v3-1']), 'v3-1:check');
  assert.equal(parseArguments(['--v3-1', '--smoke']), 'v3-1:smoke');
  assert.equal(parseArguments(['--v3-2', '--build']), 'v3-2:build');
  assert.equal(parseArguments(['--check', '--v3-2']), 'v3-2:check');
  assert.equal(parseArguments(['--v3-2', '--smoke']), 'v3-2:smoke');
  assert.equal(
    parseArguments(['--v3-2-r2', '--build']),
    'v3-2-r2:build',
  );
  assert.equal(
    parseArguments(['--check', '--v3-2-r2']),
    'v3-2-r2:check',
  );
  assert.equal(
    parseArguments(['--v3-2-r2', '--smoke']),
    'v3-2-r2:smoke',
  );
  assert.equal(parseArguments(['--v3-3', '--build']), 'v3-3:build');
  assert.equal(parseArguments(['--check', '--v3-3']), 'v3-3:check');
  assert.equal(parseArguments(['--v3-3', '--smoke']), 'v3-3:smoke');
  assert.equal(
    parseArguments(['--v3-3-r2', '--build']),
    'v3-3-r2:build',
  );
  assert.equal(
    parseArguments(['--check', '--v3-3-r2']),
    'v3-3-r2:check',
  );
  assert.equal(
    parseArguments(['--v3-3-r2', '--smoke']),
    'v3-3-r2:smoke',
  );
  assert.equal(
    parseArguments(['--v3-3-r3', '--build']),
    'v3-3-r3:build',
  );
  assert.equal(
    parseArguments(['--check', '--v3-3-r3']),
    'v3-3-r3:check',
  );
  assert.equal(
    parseArguments(['--v3-3-r3', '--smoke']),
    'v3-3-r3:smoke',
  );
  assert.throws(() => parseArguments([]), /exactly one mode/);
  assert.throws(
    () => parseArguments(['--build', '--check']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v2', '--v2', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v2', '--v3', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3', '--v3', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3', '--v3-1', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-1', '--v3-1', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-1', '--v3-2', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-2', '--v3-2', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-2', '--v3-2-r2', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-2-r2', '--v3-2-r2', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-2-r2', '--v3-3', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-3', '--v3-3', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-3', '--v3-3-r2', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-3-r2', '--v3-3-r3', '--build']),
    /exactly one mode/,
  );
  assert.throws(
    () => parseArguments(['--v3-3-r3', '--v3-3-r3', '--build']),
    /exactly one mode/,
  );
  assert.throws(() => parseArguments(['--publish']), /exactly one mode/);
});

test('frozen predecessors through the failed v3.3-r2 smoke reject writes while v3.3-r3 remains buildable once', () => {
  for (const version of [
    'v2',
    'v3',
    'v3-1',
    'v3-2',
    'v3-2-r2',
    'v3-3',
    'v3-3-r2',
  ]) {
    const variant = resolvePackageVariant(version);
    assert.throws(
      () => assertVariantModeAllowed(variant, 'build'),
      /frozen and finalized/,
    );
    assert.throws(
      () => assertVariantModeAllowed(variant, 'smoke'),
      /frozen and finalized/,
    );
    assert.equal(assertVariantModeAllowed(variant, 'check'), true);
  }
  const v33r3 = resolvePackageVariant('v3-3-r3');
  assert.equal(assertVariantModeAllowed(v33r3, 'build'), true);
  assert.equal(assertVariantModeAllowed(v33r3, 'check'), true);
  assert.equal(assertVariantModeAllowed(v33r3, 'smoke'), true);
});

test('immutable package commit publishes all three targets and rolls back partial failure', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'g4-l3-v31-commit-'));
  try {
    const successfulStage = path.join(tempRoot, 'stage-success');
    const stagedPackageRoot = path.join(successfulStage, 'package');
    const stagedArchivePath = path.join(successfulStage, 'package.zip');
    const stagedChecksumPath = `${stagedArchivePath}.sha256`;
    await mkdir(stagedPackageRoot, {recursive: true});
    await writeFile(path.join(stagedPackageRoot, 'marker'), 'package');
    await writeFile(stagedArchivePath, 'archive');
    await writeFile(stagedChecksumPath, 'checksum');
    const finalRoot = path.join(tempRoot, 'final-success');
    const variant = {
      immutableBuild: true,
      packageRoot: path.join(finalRoot, 'package'),
      archivePath: path.join(finalRoot, 'package.zip'),
      archiveShaPath: path.join(finalRoot, 'package.zip.sha256'),
      deliveryReceiptPath: null,
      deliveryReportPath: null,
    };
    await mkdir(finalRoot);
    await commitImmutablePackageBundle(
      stagedPackageRoot,
      stagedArchivePath,
      stagedChecksumPath,
      variant,
    );
    assert.equal(
      await readFile(path.join(variant.packageRoot, 'marker'), 'utf8'),
      'package',
    );
    assert.equal(await readFile(variant.archivePath, 'utf8'), 'archive');
    assert.equal(await readFile(variant.archiveShaPath, 'utf8'), 'checksum');

    const failedStage = path.join(tempRoot, 'stage-failure');
    const failedPackage = path.join(failedStage, 'package');
    const failedArchive = path.join(failedStage, 'package.zip');
    const failedChecksum = `${failedArchive}.sha256`;
    await mkdir(failedPackage, {recursive: true});
    await writeFile(path.join(failedPackage, 'marker'), 'package');
    await writeFile(failedArchive, 'archive');
    await writeFile(failedChecksum, 'checksum');
    const failedVariant = {
      immutableBuild: true,
      packageRoot: path.join(tempRoot, 'rolled-back-package'),
      archivePath: path.join(tempRoot, 'missing-parent', 'package.zip'),
      archiveShaPath: path.join(
        tempRoot,
        'missing-parent',
        'package.zip.sha256',
      ),
      deliveryReceiptPath: null,
      deliveryReportPath: null,
    };
    await assert.rejects(
      commitImmutablePackageBundle(
        failedPackage,
        failedArchive,
        failedChecksum,
        failedVariant,
      ),
    );
    await assert.rejects(lstat(failedVariant.packageRoot), {code: 'ENOENT'});

    const collisionStage = path.join(tempRoot, 'stage-collision');
    const collisionPackage = path.join(collisionStage, 'package');
    const collisionArchive = path.join(collisionStage, 'package.zip');
    const collisionChecksum = `${collisionArchive}.sha256`;
    await mkdir(collisionPackage, {recursive: true});
    await writeFile(path.join(collisionPackage, 'marker'), 'new package');
    await writeFile(collisionArchive, 'new archive');
    await writeFile(collisionChecksum, 'new checksum');
    const collisionVariant = {
      immutableBuild: true,
      packageRoot: path.join(tempRoot, 'collision-package'),
      archivePath: path.join(tempRoot, 'collision.zip'),
      archiveShaPath: path.join(tempRoot, 'collision.zip.sha256'),
      deliveryReceiptPath: null,
      deliveryReportPath: null,
    };
    await writeFile(collisionVariant.archivePath, 'existing archive');
    await assert.rejects(
      commitImmutablePackageBundle(
        collisionPackage,
        collisionArchive,
        collisionChecksum,
        collisionVariant,
      ),
      /never overwritten/,
    );
    assert.equal(
      await readFile(collisionVariant.archivePath, 'utf8'),
      'existing archive',
    );
    await assert.rejects(lstat(collisionVariant.packageRoot), {code: 'ENOENT'});
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});

test('v2 through v3.3-r3 package paths are explicit and independent', () => {
  const v1 = resolvePackageVariant('v1');
  const v2 = resolvePackageVariant('v2');
  const v3 = resolvePackageVariant('v3');
  const v31 = resolvePackageVariant('v3-1');
  const v32 = resolvePackageVariant('v3-2');
  const v32r2 = resolvePackageVariant('v3-2-r2');
  const v33 = resolvePackageVariant('v3-3');
  const v33r2 = resolvePackageVariant('v3-3-r2');
  const v33r3 = resolvePackageVariant('v3-3-r3');
  assert.equal(v1.packageId, 'g4-l3-whole-lesson-package-mvp-v1');
  assert.equal(v2.packageId, 'g4-l3-whole-lesson-package-mvp-v2');
  assert.equal(v3.packageId, 'g4-l3-whole-lesson-package-mvp-v3');
  assert.equal(
    v3.title,
    'G4 L3 Whole-Lesson CEO Preview v3 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v3.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64',
  );
  assert.equal(
    path.relative(root, v3.archivePath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64.zip',
  );
  assert.equal(
    path.relative(root, v3.archiveShaPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64.zip.sha256',
  );
  assert.equal(
    path.relative(root, v3.smokeReportPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-smoke.json',
  );
  assert.equal(v31.version, 'v3-1');
  assert.equal(v31.packageId, 'g4-l3-whole-lesson-package-mvp-v3-1');
  assert.equal(
    v31.title,
    'G4 L3 Whole-Lesson CEO Preview v3.1 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v31.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64',
  );
  assert.equal(
    path.relative(root, v31.archivePath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64.zip',
  );
  assert.equal(
    path.relative(root, v31.archiveShaPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64.zip.sha256',
  );
  assert.equal(
    path.relative(root, v31.smokeReportPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-1-smoke.json',
  );
  assert.equal(
    path.relative(root, v31.smokeScreenshotPath),
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-1/es-mobile-player.png',
  );
  assert.equal(
    path.relative(root, v31.deliveryReceiptPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json',
  );
  assert.equal(
    path.relative(root, v31.deliveryReportPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md',
  );
  assert.notEqual(v1.packageRoot, v2.packageRoot);
  assert.notEqual(v1.archivePath, v2.archivePath);
  assert.notEqual(v1.archiveShaPath, v2.archiveShaPath);
  assert.notEqual(v1.smokeReportPath, v2.smokeReportPath);
  assert.notEqual(v1.smokeScreenshotPath, v2.smokeScreenshotPath);
  assert.notEqual(v2.packageRoot, v3.packageRoot);
  assert.notEqual(v2.archivePath, v3.archivePath);
  assert.notEqual(v2.smokeReportPath, v3.smokeReportPath);
  assert.notEqual(v3.packageRoot, v31.packageRoot);
  assert.notEqual(v3.archivePath, v31.archivePath);
  assert.notEqual(v3.archiveShaPath, v31.archiveShaPath);
  assert.notEqual(v3.smokeReportPath, v31.smokeReportPath);
  assert.notEqual(v3.smokeScreenshotPath, v31.smokeScreenshotPath);
  assert.equal(v1.verifyCurrentInputSnapshot, false);
  assert.equal(v1.bindSmokeScreenshot, false);
  assert.equal(v1.smokeFromDisposableCopy, false);
  assert.equal(v2.verifyCurrentInputSnapshot, false);
  assert.equal(v2.bindSmokeScreenshot, true);
  assert.equal(v2.smokeFromDisposableCopy, true);
  assert.equal(v2.smokeFromArchive, false);
  assert.equal(v2.checkFromArchive, true);
  assert.equal(v2.strongNavigationChecks, true);
  assert.equal(v2.requireFrozenV2Page36Parity, false);
  assert.equal(v3.verifyCurrentInputSnapshot, false);
  assert.equal(v3.bindSmokeScreenshot, true);
  assert.equal(v3.smokeFromDisposableCopy, false);
  assert.equal(v3.smokeFromArchive, true);
  assert.equal(v3.checkFromArchive, true);
  assert.equal(v3.strongNavigationChecks, true);
  assert.equal(v3.requireFrozenV2Page36Parity, true);
  assert.equal(v3.defaultPort, 3216);
  assert.equal(v3.distDir, '.next-g4-l3-package');
  assert.equal(v3.readabilityEvidence.baseUrl, 'http://127.0.0.1:3216');
  assert.equal(v31.verifyCurrentInputSnapshot, true);
  assert.equal(v31.bindSmokeScreenshot, true);
  assert.equal(v31.smokeFromDisposableCopy, false);
  assert.equal(v31.smokeFromArchive, true);
  assert.equal(v31.strongNavigationChecks, true);
  assert.equal(v31.requireFrozenV2Page36Parity, true);
  assert.equal(v31.defaultPort, 3217);
  assert.equal(v31.distDir, '.next-g4-l3-package-v3-1');
  assert.equal(v31.checkFromArchive, true);
  assert.equal(v31.immutableBuild, true);
  assert.equal(
    v31.frozenPreimages.v3Archive.sha256,
    '3439af236f5e9c0d5bd100b364d44c1785a5fcdf0a02b1b9df761656b04d7ec3',
  );
  assert.equal(
    v31.readabilityEvidence.reportType,
    'g4-l3-current-js-readability-v3-1',
  );
  assert.equal(
    v31.readabilityEvidence.baseUrl,
    'http://127.0.0.1:3217',
  );
  assert.equal(
    v31.controlledQaEvidence.reportType,
    'g4-l3-controlled-ceo-preview-v3-1-qa',
  );
  assert.equal(
    v31.controlledQaEvidence.baseUrl,
    'http://127.0.0.1:3217',
  );
  assert.deepEqual(v31.regressionEvidence, {
    json: 'reports/g4-l3-v31-post-v3-current-js-regression.json',
    browserQa: 'reports/g4-l3-v31-post-v3-browser-qa.json',
    sourceInventory: 'reports/g4-l3-v31-post-v3-source-inventory.json',
    markdown: 'outputs/g4-l3-v31-post-v3-current-js-regression.md',
    screenshotRoot:
      'output/playwright/g4-l3-v31-post-v3-current-js-regression',
    reportType: 'g4-l3-v31-post-v3-current-js-regression',
    browserQaReportType: 'g4-l3-v31-post-v3-browser-qa',
    sourceInventoryType: 'g4-l3-v31-post-v3-source-inventory',
  });
  assert.equal(v32.version, 'v3-2');
  assert.equal(v32.packageId, 'g4-l3-whole-lesson-package-mvp-v3-2');
  assert.equal(
    v32.title,
    'G4 L3 Whole-Lesson CEO Preview v3.2 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v32.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-darwin-arm64',
  );
  assert.equal(v32.defaultPort, 3218);
  assert.equal(v32.distDir, '.next-g4-l3-package-v3-2');
  assert.equal(v32.immutableBuild, true);
  assert.equal(v32.finalizedReadOnly, true);
  assert.equal(v32.advancedSuccessorSmokeChecks, true);
  assert.equal(v32.compactLandscapeChecks, true);
  assert.equal(v32.page36CandidateKey, 'v32');
  assert.equal(v32.bindFullCurrentSourceInventory, true);
  assert.equal(
    v32.frozenPreimages.v31Archive.sha256,
    '211f87751120aaac29215d6828c1897bdb67408175769270db4ddfa2dd7ed1f6',
  );
  assert.equal(
    v32.readabilityEvidence.reportType,
    'g4-l3-current-js-readability-v3-2',
  );
  assert.equal(v32.readabilityEvidence.baseUrl, 'http://127.0.0.1:3218');
  assert.equal(
    v32.controlledQaEvidence.reportType,
    'g4-l3-controlled-ceo-preview-v3-2-qa',
  );
  assert.equal(v32r2.version, 'v3-2');
  assert.equal(v32r2.artifactRevision, 'r2');
  assert.equal(
    v32r2.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-2-r2',
  );
  assert.equal(
    v32r2.title,
    'G4 L3 Whole-Lesson CEO Preview v3.2-r2 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v32r2.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64',
  );
  assert.equal(
    path.relative(root, v32r2.archivePath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64.zip',
  );
  assert.equal(
    path.relative(root, v32r2.archiveShaPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64.zip.sha256',
  );
  assert.equal(
    path.relative(root, v32r2.smokeReportPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json',
  );
  assert.equal(
    path.relative(root, v32r2.smokeScreenshotPath),
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2-r2/es-mobile-player.png',
  );
  assert.equal(
    path.relative(root, path.dirname(v32r2.smokeScreenshotPath)),
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2-r2',
  );
  assert.equal(
    path.relative(root, v32r2.deliveryReceiptPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json',
  );
  assert.equal(
    path.relative(root, v32r2.deliveryReportPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md',
  );
  assert.equal(v32r2.page36CandidateKey, 'v32r2');
  assert.equal(v32r2.defaultPort, 3218);
  assert.equal(v32r2.distDir, '.next-g4-l3-package-v3-2');
  assert.equal(v32r2.immutableBuild, true);
  assert.equal(v32r2.finalizedReadOnly, true);
  assert.equal(v32r2.advancedSuccessorSmokeChecks, true);
  assert.equal(v32r2.compactLandscapeChecks, true);
  assert.equal(v32r2.bindFullCurrentSourceInventory, true);
  assert.equal(
    v32r2.frozenPreimages.v32FailedSmokeAttemptArchive.sha256,
    '5aca39fb8590889d79097fb7c429a370e2b6ac918e21cb73be4e150987ef9447',
  );
  assert.equal(
    v32r2.frozenPreimages.v32FailedSmokeAttemptManifest.sha256,
    'b3f0c106de9b0da905f993c5a971211e6ef1bd4a550fa67fb899bd12c0450a34',
  );
  assert.equal(
    v32r2.frozenPreimages.v32FailedSmokeAttemptArchiveChecksum.sha256,
    '50374e80726d9c9eb6db21becfdfa31f530c8044e67e68f17caba8a975d520c0',
  );
  assert.equal(
    v32r2.frozenPreimages.v32FailedSmokeAttemptPayloadChecksums.sha256,
    '72e38bc2a03f6528d68daf10844e4b2da8920b18255613258ed442a9b9d42cf4',
  );
  assert.equal(
    v32r2.smokeHarnessRevision.predecessorAttemptPackageId,
    'g4-l3-whole-lesson-package-mvp-v3-2',
  );
  assert.equal(
    v32r2.smokeHarnessRevision.compactRootSelector,
    'main.lesson-shell2',
  );
  assert.equal(
    v32r2.smokeHarnessRevision.compactPageSelectionMechanism,
    'visible-course-map-row',
  );
  assert.equal(
    v32r2.smokeHarnessRevision.resumeDecisionBeforeGeometry,
    'resolved',
  );
  assert.notEqual(v31.packageRoot, v32.packageRoot);
  assert.notEqual(v31.archivePath, v32.archivePath);
  assert.notEqual(v32.packageRoot, v32r2.packageRoot);
  assert.notEqual(v32.archivePath, v32r2.archivePath);
  assert.notEqual(v32.smokeReportPath, v32r2.smokeReportPath);
  assert.notEqual(v32.smokeScreenshotPath, v32r2.smokeScreenshotPath);
  assert.equal(v33.version, 'v3-3');
  assert.equal(v33.packageId, 'g4-l3-whole-lesson-package-mvp-v3-3');
  assert.equal(
    v33.title,
    'G4 L3 Whole-Lesson CEO Preview v3.3 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v33.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64',
  );
  assert.equal(
    path.relative(root, v33.archivePath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64.zip',
  );
  assert.equal(
    path.relative(root, v33.archiveShaPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64.zip.sha256',
  );
  assert.equal(
    path.relative(root, v33.smokeReportPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json',
  );
  assert.equal(
    path.relative(root, v33.smokeScreenshotPath),
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3/es-mobile-player.png',
  );
  assert.equal(
    path.relative(root, v33.deliveryReceiptPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-delivery.json',
  );
  assert.equal(
    path.relative(root, v33.deliveryReportPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-delivery-report.md',
  );
  assert.equal(v33.page36CandidateKey, 'v33');
  assert.equal(v33.defaultPort, 3219);
  assert.equal(v33.distDir, '.next-g4-l3-package-v3-3');
  assert.equal(v33.immutableBuild, true);
  assert.equal(v33.finalizedReadOnly, true);
  assert.equal(v33.advancedSuccessorSmokeChecks, true);
  assert.equal(v33.compactLandscapeChecks, true);
  assert.equal(v33.bindFullCurrentSourceInventory, true);
  assert.equal(
    v33.smokeVerifierImplementation,
    'primary-package-builder-v3-3',
  );
  assert.equal(v33.correctedCompactSmokeHarness, true);
  assert.equal(
    v33.readabilityEvidence.reportType,
    'g4-l3-current-js-readability-v3-3',
  );
  assert.equal(v33.readabilityEvidence.baseUrl, 'http://127.0.0.1:3219');
  assert.equal(
    v33.controlledQaEvidence.reportType,
    'g4-l3-controlled-ceo-preview-v3-3-qa',
  );
  assert.equal(v33.controlledQaEvidence.baseUrl, 'http://127.0.0.1:3219');
  assert.equal(v33r2.version, 'v3-3');
  assert.equal(v33r2.artifactRevision, 'r2');
  assert.equal(v33r2.qaArtifactVersion, 'v3-3-r2');
  assert.equal(
    v33r2.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-3-r2',
  );
  assert.equal(
    v33r2.title,
    'G4 L3 Whole-Lesson CEO Preview v3.3-r2 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v33r2.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64',
  );
  assert.equal(
    path.relative(root, v33r2.archivePath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64.zip',
  );
  assert.equal(
    path.relative(root, v33r2.smokeReportPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json',
  );
  assert.equal(v33r2.page36CandidateKey, 'v33r2');
  assert.equal(v33r2.defaultPort, 3219);
  assert.equal(v33r2.distDir, '.next-g4-l3-package-v3-3');
  assert.equal(v33r2.immutableBuild, true);
  assert.equal(v33r2.finalizedReadOnly, true);
  assert.equal(
    v33r2.smokeVerifierImplementation,
    'primary-package-builder-v3-3-r2',
  );
  assert.equal(
    v33r2.readabilityEvidence.reportType,
    'g4-l3-current-js-readability-v3-3-r2',
  );
  assert.equal(
    v33r2.controlledQaEvidence.reportType,
    'g4-l3-controlled-ceo-preview-v3-3-r2-qa',
  );
  assert.deepEqual(
    v33r2.successorRevision,
    v33.successorRevision,
  );
  assert.notEqual(v33.packageRoot, v33r2.packageRoot);
  assert.notEqual(v33.archivePath, v33r2.archivePath);
  assert.notEqual(v33.smokeReportPath, v33r2.smokeReportPath);
  assert.equal(v33r3.version, 'v3-3');
  assert.equal(v33r3.artifactRevision, 'r3');
  assert.equal(v33r3.qaArtifactVersion, 'v3-3-r2');
  assert.equal(
    v33r3.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-3-r3',
  );
  assert.equal(
    v33r3.title,
    'G4 L3 Whole-Lesson CEO Preview v3.3-r3 — current JavaScript candidate',
  );
  assert.equal(
    path.relative(root, v33r3.packageRoot),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64',
  );
  assert.equal(
    path.relative(root, v33r3.archivePath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64.zip',
  );
  assert.equal(
    path.relative(root, v33r3.archiveShaPath),
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64.zip.sha256',
  );
  assert.equal(
    path.relative(root, v33r3.smokeReportPath),
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json',
  );
  assert.equal(
    path.relative(root, v33r3.smokeScreenshotPath),
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r3/es-mobile-player.png',
  );
  assert.equal(v33r3.page36CandidateKey, 'v33r3');
  assert.equal(v33r3.defaultPort, 3219);
  assert.equal(v33r3.distDir, '.next-g4-l3-package-v3-3');
  assert.equal(v33r3.immutableBuild, true);
  assert.equal(v33r3.finalizedReadOnly, undefined);
  assert.equal(
    v33r3.smokeVerifierImplementation,
    'primary-package-builder-v3-3-r3',
  );
  assert.equal(
    v33r3.keyTermsFocusRestorationMode,
    KEY_TERMS_FOCUS_RESTORATION_MODE,
  );
  assert.equal(
    v33r3.readabilityEvidence.reportType,
    'g4-l3-current-js-readability-v3-3-r2',
  );
  assert.equal(
    v33r3.controlledQaEvidence.reportType,
    'g4-l3-controlled-ceo-preview-v3-3-r2-qa',
  );
  assert.equal(v33r3.qaEvidenceReuse.copiedOrRegeneratedAsR3Reports, false);
  assert.equal(
    v33r3.qaEvidenceReuse.authoredProductSourceChangedFromV33R2,
    false,
  );
  assert.deepEqual(v33r3.qaHarnessRevision, V33_R2_QA_HARNESS_REVISION);
  assert.deepEqual(
    v33r3.packageSmokeHarnessRevision,
    V33_R3_SMOKE_HARNESS_REVISION,
  );
  assert.notEqual(v33r2.packageRoot, v33r3.packageRoot);
  assert.notEqual(v33r2.archivePath, v33r3.archivePath);
  assert.notEqual(v33r2.smokeReportPath, v33r3.smokeReportPath);
  assert.notEqual(v32r2.packageRoot, v33.packageRoot);
  assert.notEqual(v32r2.archivePath, v33.archivePath);
  assert.notEqual(v32r2.smokeReportPath, v33.smokeReportPath);
  assert.notEqual(v32r2.smokeScreenshotPath, v33.smokeScreenshotPath);
  assert.throws(() => resolvePackageVariant('v4'), /Unsupported/);
});

test('v3 readability contract binds two approved Page 36 source crops', () => {
  const sourceBytes = 693079;
  const enhancements = {
    pageOrdinal: 36,
    animationId: 'course-g04-l03-ts-008',
    source: {
      path:
        'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf',
      bytes: sourceBytes,
      sha256:
        '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885',
    },
    frameDomain: 'sprite-350',
    frame: 789,
    nativePaddingPixels: 4,
    desktopScale: 2.5,
    crops: [
      {
        id: 'step-3',
        sourceRect: {x: 292, y: 147, width: 236, height: 149},
        paddedCropRect: {x: 288, y: 143, width: 244, height: 157},
        asset: {
          path:
            'public/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-3.png',
          bytes: 23194,
          sha256:
            'cb43e972f1043af58a03f01f280eec09b8f39e816e2f23d1e6bf6ad7bb996731',
        },
        sourceCharacterIds: [99, 100, 101, 133],
        transcriptSha256:
          '74944b2787363422dfb1381cc84c3351bf81b25804e86ea869861842749002bd',
      },
      {
        id: 'step-4',
        sourceRect: {x: 292, y: 296, width: 236, height: 191},
        paddedCropRect: {x: 288, y: 292, width: 244, height: 199},
        asset: {
          path:
            'public/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-4.png',
          bytes: 26225,
          sha256:
            '02af808cbd1c1a8bbb20dda3084a68240c0e4310f08b6f3120963d76c1e7e756',
        },
        sourceCharacterIds: [144, 145, 146, 147, 148, 149, 150, 151, 152],
        transcriptSha256:
          '8c476e7328340df57c59936050b0905b786249e4f31d1fa4267153d6355ff796',
      },
    ],
    defaultExpanded: true,
    originalLayoutPreserved: true,
    strictAcceptanceEffect: 'none',
  };
  assert.deepEqual(
    validateV3ReadabilityEnhancements(enhancements, sourceBytes),
    enhancements,
  );
  assert.throws(
    () => validateV3ReadabilityEnhancements(
      {...enhancements, frame: 420},
      sourceBytes,
    ),
    /readability enhancement contract/,
  );
  assert.throws(
    () => validateV3ReadabilityEnhancements(
      {
        ...enhancements,
        crops: [
          {
            ...enhancements.crops[0],
            sourceRect: {x: 291, y: 147, width: 236, height: 149},
          },
          enhancements.crops[1],
        ],
      },
      sourceBytes,
    ),
    /readability enhancement contract/,
  );
  assert.throws(
    () => validateV3ReadabilityEnhancements(
      {
        ...enhancements,
        crops: [
          enhancements.crops[0],
          {...enhancements.crops[1], sourceCharacterIds: [144, 150]},
        ],
      },
      sourceBytes,
    ),
    /readability enhancement contract/,
  );
  assert.throws(
    () => validateV3ReadabilityEnhancements(
      {...enhancements, strictAcceptanceEffect: 'complete'},
      sourceBytes,
    ),
    /readability enhancement contract/,
  );
});

test('v3.1 readability evidence rejects a report captured from frozen port 3216', async () => {
  const report = JSON.parse(
    await readFile(
      path.join(root, 'reports/g4-l3-current-js-readability-v3.json'),
      'utf8',
    ),
  );
  report.reportType = 'g4-l3-current-js-readability-v3-1';
  assert.throws(
    () => validateV3ReadabilityReport(
      report,
      'g4-l3-current-js-readability-v3-1',
      'http://127.0.0.1:3217',
    ),
    /readability v3 report is absent, stale, or failing/,
  );
  report.environment.baseUrl = 'http://127.0.0.1:3217';
  assert.equal(
    validateV3ReadabilityReport(
      report,
      'g4-l3-current-js-readability-v3-1',
      'http://127.0.0.1:3217',
    ),
    true,
  );
});

test('v3 package chain hard-codes all three approved frozen preimages', async () => {
  const source = await readFile(
    path.join(root, 'scripts/build-g4-l3-whole-lesson-package-mvp.mjs'),
    'utf8',
  );
  for (const sha256 of [
    '7bc8074677504ff3e923dc400fdd80a7fdaf01fec2402cec9869c9019f2e79f5',
    'd856fe7a3b2cf4dde7cf50c60c0e2da6c06ced5ef5b9943cdf1144e929f2f250',
    '30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6',
  ]) {
    assert.ok(source.includes(sha256), sha256);
  }
  assert.match(source, /assertV3FrozenPreimages/);
  assert.match(source, /fresh-extracted frozen v2 manifest has drifted/);
});

test('v3.1 freezes the approved v3 delivery chain in addition to v2 and TS08', async () => {
  const source = await readFile(
    path.join(root, 'scripts/build-g4-l3-whole-lesson-package-mvp.mjs'),
    'utf8',
  );
  for (const sha256 of [
    '3439af236f5e9c0d5bd100b364d44c1785a5fcdf0a02b1b9df761656b04d7ec3',
    '15e2c35511b67346493bda333cf4f1ec1f9bc87ea1802e43447fd99607b58ffe',
    '139b33c3b2ec83cf09c489e78e4b47bb8733d844dbccbdd578ae6eb94f0896ff',
    'a559ced2e3af0570cc730607e4d757b0c31c066e2a22a67ec0c2b735b81c26a7',
    '4d9683c347adf8439d96a10ea508dc7fdd0e54125220990dc66298d99e2ff433',
    '6723c6b59381ee6275c42dd7ab118bab796f2cc9e7bc18a924bda68f6f5671f7',
  ]) {
    assert.ok(source.includes(sha256), sha256);
  }
  assert.match(source, /assertV31FrozenPreimages/);
});

test('v3.3 freezes the complete v3.2-r2 closure and binds the declared six-file batch without overstating the delta', () => {
  assert.equal(typeof assertV33FrozenPreimages, 'function');
  assert.equal(
    V33_FROZEN_PREIMAGES.v2Archive.sha256,
    '7bc8074677504ff3e923dc400fdd80a7fdaf01fec2402cec9869c9019f2e79f5',
  );
  assert.deepEqual(
    Object.fromEntries(
      [
        'v32R2Archive',
        'v32R2Manifest',
        'v32R2ArchiveChecksum',
        'v32R2PayloadChecksums',
        'v32R2Smoke',
        'v32R2DeliveryReceipt',
        'v32R2DeliveryReport',
      ].map((identity) => [
        identity,
        V33_FROZEN_PREIMAGES[identity].sha256,
      ]),
    ),
    {
      v32R2Archive:
        '1768ae2055931f1c351f13da31a72ff96ef332f3bebaefff35c1df1fd6228d33',
      v32R2Manifest:
        '8579e22cd961cee40f4af9a8b2aa320b1ed70c4d29f6832340b71a2c20a7a63d',
      v32R2ArchiveChecksum:
        '3e9b48cef2e50992de203c8482b22d7ae9c1d846c63cc16b7f5ef69e7000a5e2',
      v32R2PayloadChecksums:
        'cea30a97e6f052ac82d1dcc92b15d74da2b8b7eb55eb23b4ed56a1f332bb5477',
      v32R2Smoke:
        'eabd3ce08cca9163c318cf26834fa153d9e27db082a4c916391735c87fee6241',
      v32R2DeliveryReceipt:
        '9c0bc8ee967ec29d7d3a2d91f890188c622774d4b2f880cbef9295f389e12e68',
      v32R2DeliveryReport:
        '2785d2ee2708312a78aec41c6f860c9321827649a4d12072a8a0bbb29b70dc1d',
    },
  );
  const successor = resolvePackageVariant('v3-3').successorRevision;
  assert.equal(
    successor.predecessorPackageId,
    'g4-l3-whole-lesson-package-mvp-v3-2-r2',
  );
  assert.equal(
    successor.predecessorReceiptFingerprintSha256,
    'e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965',
  );
  assert.deepEqual(successor.predecessorSourceSnapshot, {
    fileCount: 1264,
    totalBytes: 191299550,
    sha256:
      '7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91',
  });
  assert.deepEqual(
    V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
    [
      {
        path: 'apps/web/app/globals.css',
        sha256:
          '7e7d642b9649e57892f2218fc6d482cf3e559971339880e5da712fe7b71ea718',
        role: 'authored-runtime',
        predecessor: {
          status: 'available',
          sha256:
            '9b613e51e418f0e5764c119a7aef062908bc5070b2c853002c724d346871a665',
          changed: true,
        },
      },
      {
        path: 'apps/web/components/legacy-responsive-lesson-shell.tsx',
        sha256:
          'dfbe3ee58ad7427acb30fa4c426ddfa67add30008ee4d458b5e533f2b84c7adf',
        role: 'authored-runtime',
        predecessor: {
          status: 'available',
          sha256:
            'a6a493586e7f9cc7e599952d614e92f9a01e837c9e1c3959a9b30f0427128f2e',
          changed: true,
        },
      },
      {
        path: 'apps/web/tests/g4-l3-whole-lesson.test.ts',
        sha256:
          '3aaa8cd121f0b722398453b5a5b94c6a396dd98af5b56a59d6383618e2440084',
        role: 'unit-test',
        predecessor: {
          status: 'available',
          sha256:
            '87ba0c01125d2f38f0411abb2b60efabc1861e9f82a02c00db9aef63739970d0',
          changed: true,
        },
      },
      {
        path: 'apps/web/tests/legacy-support-tools.test.ts',
        sha256:
          '4e4d9a39ef8b5523f03aa9ff5d8ac95856c93dd5e538fcc9f4bc7978407479b6',
        role: 'unit-test',
        predecessor: {
          status: 'unavailable',
          sha256: null,
          changed: null,
        },
      },
      {
        path: 'apps/web/e2e/legacy-lesson-shell-responsive.spec.ts',
        sha256:
          '922b1092a6c1264f2be18cecedaf8a80bae7d8dd6043b4a8088c1774c630e9c3',
        role: 'browser-test',
        predecessor: {
          status: 'available',
          sha256:
            'f743be52d5b9f3af9ebb239730a0984adc866aa05b9a7f8cadcc9228bb06cd6e',
          changed: true,
        },
      },
      {
        path: 'apps/web/playwright.config.ts',
        sha256:
          'ca07621fc2b4ef43c16165ad2f146c5dc4027f8caaf9ab216fc576a2853b053d',
        role: 'browser-config',
        predecessor: {
          status: 'available',
          sha256:
            '4083f84ea606c053eed30892f64ca18ef939ee1c192ad9f1cb0661da18ce2820',
          changed: true,
        },
      },
    ],
  );
  assert.deepEqual(
    V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH.reduce(
      (counts, {role}) => ({
        ...counts,
        [role]: (counts[role] ?? 0) + 1,
      }),
      {},
    ),
    {
      'authored-runtime': 2,
      'unit-test': 2,
      'browser-test': 1,
      'browser-config': 1,
    },
  );
  assert.equal(
    V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH.filter(
      ({predecessor}) => predecessor.status === 'available',
    ).length,
    5,
  );
  assert.equal(successor.allSixChangedEstablished, false);
  assert.equal(successor.authoredProductSourceChangedFromV32R2, true);
  assert.equal(successor.fullCurrentV33SourceSnapshotBound, true);
  assert.equal(successor.exhaustiveByteDeltaFromV32R2Established, false);
  assert.equal(successor.declaredBatchIsOnlyRepoDelta, false);
  assert.equal(successor.strictAcceptanceEffect, 'none');
});

test('v3.3-r2 freezes the failed QA receipt and five preserved screenshots without promoting a product failure', async () => {
  assert.equal(typeof assertV33R2FrozenPreimages, 'function');
  assert.equal(
    V33_FAILED_QA_ATTEMPT_PREIMAGES.v33FailedQaAttemptReceipt.sha256,
    '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
  );
  assert.equal(
    Object.values(V33_FAILED_QA_ATTEMPT_PREIMAGES).filter(
      ({path: relativePath}) => relativePath.endsWith('.png'),
    ).length,
    5,
  );
  assert.equal(
    Object.keys(V33_R2_FROZEN_PREIMAGES).length,
    Object.keys(V33_FROZEN_PREIMAGES).length + 6,
  );
  assert.deepEqual(V33_R2_QA_HARNESS_REVISION, {
    predecessorAttemptPackageId:
      'g4-l3-whole-lesson-package-mvp-v3-3',
    predecessorAttemptStatus:
      'superseded-after-controlled-qa-harness-timeout',
    predecessorAttemptPackagePublished: false,
    predecessorAttemptFormalQaPublished: false,
    predecessorAttemptPartialScreenshotRoot: {
      path: 'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa',
      preserved: true,
      fileCount: 5,
      totalBytes: 876815,
      treeSha256:
        '3b65a041d823e615aab11b1e89018d5af71fa38c5454dc351ed0b15f2ef29c10',
    },
    predecessorAttemptFailureReceipt: {
      path:
        'reports/g4-l3-controlled-ceo-preview-v3-3-failed-attempt.json',
      bytes: 3211,
      sha256:
        '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
    },
    predecessorAttemptOverwritten: false,
    productFailureEstablished: false,
    changeClass: 'qa-harness-only',
    authoredProductSourceChangedFromV33: false,
    correctedBeforePackaging: true,
    externalPostbuildCorrectionUsed: false,
    strictAcceptanceEffect: 'none',
  });
  assert.deepEqual(
    resolvePackageVariant('v3-3-r2').qaHarnessRevision,
    V33_R2_QA_HARNESS_REVISION,
  );
  assert.equal(await assertV33R2FrozenPreimages(), true);
});

test('v3.3-r3 freezes the sealed r2 closure and failed-smoke receipt without promoting product state', async () => {
  assert.equal(typeof assertV33R3FrozenPreimages, 'function');
  assert.deepEqual(V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES, {
    v33R2Archive: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64.zip',
      sha256:
        '0295d8a174507478a5982071946673d0f5c9d8593894c465f89c92d8a9a41271',
    },
    v33R2Manifest: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64/package-manifest.json',
      sha256:
        'a0f366e66c82b542fe9b226d0a2f6800e765e3435ea91e5e2c3ef60dee073c55',
    },
    v33R2PayloadChecksums: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64/CHECKSUMS.sha256',
      sha256:
        '4fd4e52794f6dc8910bd60dfd91eca8bde96cb49b9cc47f216e461ab419fedee',
    },
    v33R2ArchiveChecksum: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64.zip.sha256',
      sha256:
        '306e24152cc03132bc6c8ea0b2ea4ed005fd1af58806ace0a4cdbece16b10eb1',
    },
    v33R2SmokeFailedAttemptReceipt: {
      path:
        'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
      sha256:
        '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
    },
  });
  assert.equal(
    Object.keys(V33_R3_FROZEN_PREIMAGES).length,
    Object.keys(V33_R2_FROZEN_PREIMAGES).length + 5,
  );
  assert.equal(
    V33_R3_SMOKE_HARNESS_REVISION.predecessorAttemptFailureReceipt.bytes,
    8526,
  );
  assert.equal(
    V33_R3_SMOKE_HARNESS_REVISION.focusRestorationMode,
    KEY_TERMS_FOCUS_RESTORATION_MODE,
  );
  assert.deepEqual(
    V33_R3_SMOKE_HARNESS_REVISION.focusPredicateNames,
    [
      'tagIsButton',
      'responsiveKeyIsKeyTerms',
      'samePlayer',
      'connected',
      'visible',
      'enabled',
      'notHidden',
      'notInert',
    ],
  );
  assert.equal(
    V33_R3_SMOKE_HARNESS_REVISION.productFailureEstablished,
    false,
  );
  assert.equal(
    V33_R3_SMOKE_HARNESS_REVISION.authoredProductSourceChangedFromV33R2,
    false,
  );
  assert.equal(
    V33_R3_SMOKE_HARNESS_REVISION.strictAcceptanceEffect,
    'none',
  );
  assert.equal(await assertV33R3FrozenPreimages(), true);
  assert.deepEqual(
    await buildPackageSmokeHarnessRevisionManifest(
      resolvePackageVariant('v3-3-r3'),
    ),
    V33_R3_SMOKE_HARNESS_REVISION,
  );
});

test('v3.3-r3 Key Terms focus predicate accepts only the exact same-player visible responsive button', () => {
  const passing = evaluateKeyTermsFocusRestoration({
    tag: 'BUTTON',
    responsiveKey: 'key-terms',
    sourceKey: null,
    samePlayer: true,
    connected: true,
    visible: true,
    disabled: false,
    hidden: false,
    inert: false,
  });
  assert.equal(
    passing.focusRestorationMode,
    KEY_TERMS_FOCUS_RESTORATION_MODE,
  );
  assert.equal(passing.tag, 'BUTTON');
  assert.equal(passing.responsiveKey, 'key-terms');
  assert.equal(passing.sourceKey, null);
  assert.equal(passing.samePlayer, true);
  assert.equal(passing.visible, true);
  assert.deepEqual(
    Object.keys(passing.predicateVector),
    V33_R3_SMOKE_HARNESS_REVISION.focusPredicateNames,
  );
  assert.equal(passing.passed, true);

  for (const mutation of [
    {tag: 'A'},
    {responsiveKey: 'map'},
    {samePlayer: false},
    {connected: false},
    {visible: false},
    {disabled: true},
    {hidden: true},
    {inert: true},
  ]) {
    const rejected = evaluateKeyTermsFocusRestoration({
      ...passing,
      ...mutation,
    });
    assert.equal(
      rejected.passed,
      false,
      `Expected fail-closed rejection for ${JSON.stringify(mutation)}`,
    );
  }
  const arbitraryVisibleElement = evaluateKeyTermsFocusRestoration({
    tag: 'DIV',
    responsiveKey: null,
    sourceKey: null,
    samePlayer: true,
    connected: true,
    visible: true,
    disabled: false,
    hidden: false,
    inert: false,
  });
  assert.equal(arbitraryVisibleElement.passed, false);
});

test('package smoke validation errors retain an isolated structured report', () => {
  const sourceReport = {
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-3-r3',
    failures: ['focus predicate failed'],
  };
  const error = new PackageSmokeValidationError(
    'structured smoke failure',
    sourceReport,
  );
  sourceReport.failures.push('late mutation');
  assert.equal(error.name, 'PackageSmokeValidationError');
  assert.equal(error.message, 'structured smoke failure');
  assert.deepEqual(error.report, {
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-3-r3',
    failures: ['focus predicate failed'],
  });
});

test('v3.1 regression evidence binds a full inventory without overstating byte-delta proof', () => {
  const descriptor = resolvePackageVariant('v3-1').regressionEvidence;
  assert.equal(
    descriptor.browserQa,
    'reports/g4-l3-v31-post-v3-browser-qa.json',
  );
  assert.equal(
    descriptor.browserQaReportType,
    'g4-l3-v31-post-v3-browser-qa',
  );
  const sourceInventoryBinding = {
    path: descriptor.sourceInventory,
    bytes: 123,
    sha256: 'a'.repeat(64),
  };
  const sourceInventory = {
    schemaVersion: 1,
    reportType: descriptor.sourceInventoryType,
    files: [
      {
        path: 'apps/web/components/example.tsx',
        bytes: 42,
        sha256: 'b'.repeat(64),
      },
    ],
  };
  const report = {
    schemaVersion: 1,
    reportType: descriptor.reportType,
    summary: {
      status: 'pass-current-js-post-v3-regression',
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
    },
    truthBoundary: {
      declaredFunctionalPageInventoryComplete: true,
      declaredFunctionalMarkersObserved: true,
      functionalInteractionCompletenessEstablished: false,
      fullCurrentV31SourceInventoryBound: true,
      exhaustiveByteDeltaFromV3Established: false,
      strictAcceptanceEffect: 'none',
    },
    sourceInventoryBinding,
  };
  assert.deepEqual(
    validateV31RegressionEvidence(
      report,
      sourceInventory,
      sourceInventoryBinding,
      descriptor,
    ),
    report.truthBoundary,
  );
  assert.throws(
    () => validateV31RegressionEvidence(
      {
        ...report,
        truthBoundary: {
          ...report.truthBoundary,
          exhaustiveByteDeltaFromV3Established: true,
        },
      },
      sourceInventory,
      sourceInventoryBinding,
      descriptor,
    ),
    /regression evidence/,
  );
});

test('v3 report screenshot bindings must exactly cover the recursive PNG inventory', () => {
  const bindings = [
    {
      path:
        'output/playwright/g4-l3-current-js-readability-v3/desktop/step-3.png',
      bytes: 12,
      sha256: 'a'.repeat(64),
    },
    {
      path:
        'output/playwright/g4-l3-current-js-readability-v3/mobile/step-4.png',
      bytes: 24,
      sha256: 'b'.repeat(64),
    },
  ];
  assert.deepEqual(
    assertReportScreenshotBindings(
      {screenshots: bindings},
      bindings,
      'output/playwright/g4-l3-current-js-readability-v3',
      'Readability report',
    ),
    bindings,
  );
  assert.throws(
    () => assertReportScreenshotBindings(
      {screenshots: bindings.slice(0, 1)},
      bindings,
      'output/playwright/g4-l3-current-js-readability-v3',
      'Readability report',
    ),
    /do not match every PNG/,
  );
});

test('v3 ZIP smoke accepts one exact package root and rejects traversal', () => {
  const basename = 'g4-l3-whole-lesson-package-mvp-v3-darwin-arm64';
  assert.equal(
    assertSafeV3ArchiveEntries(
      [
        `${basename}/`,
        `${basename}/verify.mjs`,
        `${basename}/runtime/server.js`,
      ],
      basename,
    ),
    true,
  );
  for (const entries of [
    [`${basename}/../v2/package-manifest.json`],
    ['/tmp/escape'],
    ['another-root/package-manifest.json'],
    [`${basename}\\..\\escape`],
  ]) {
    assert.throws(
      () => assertSafeV3ArchiveEntries(entries, basename),
      /Unsafe|escaped/,
    );
  }
});

test('generated v3 package verifier is valid ESM and asserts the exact readability frame', () => {
  const source = verifierSource(resolvePackageVariant('v3'));
  const syntax = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    {encoding: 'utf8', input: source},
  );
  assert.equal(
    syntax.status,
    0,
    `${syntax.stdout}\n${syntax.stderr}`,
  );
  assert.match(source, /frame !== 789/);
  assert.match(source, /frame-789-step-3\.png/);
  assert.match(source, /frame-789-step-4\.png/);
  assert.match(source, /g4-l3-v3-execution-checkpoint/);
  assert.doesNotMatch(source, /\/Users\/|\/Volumes\//);
});

test('generated v3.1 verifier binds the independent identity, port, and Page 36 contract', () => {
  const source = verifierSource(resolvePackageVariant('v3-1'));
  const syntax = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    {encoding: 'utf8', input: source},
  );
  assert.equal(
    syntax.status,
    0,
    `${syntax.stdout}\n${syntax.stderr}`,
  );
  assert.match(source, /g4-l3-whole-lesson-package-mvp-v3-1/);
  assert.match(source, /127\.0\.0\.1:3217\/courses\/4\/3/);
  assert.match(source, /frame !== 789/);
  assert.match(source, /strictAcceptanceEffect !== 'none'/);
  assert.match(source, /frozenPreimages/);
  assert.match(source, /g4-l3-current-js-readability-v3-1\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-1-qa\.json/);
  assert.match(source, /g4-l3-v31-post-v3-current-js-regression\.json/);
  assert.match(source, /g4-l3-v31-post-v3-source-inventory\.json/);
  assert.match(source, /declaredFunctionalPageInventoryComplete/);
  assert.match(source, /declaredFunctionalMarkersObserved/);
  assert.match(source, /functionalInteractionCompletenessEstablished/);
  assert.match(source, /exhaustiveByteDeltaFromV3Established/);
  assert.match(source, /inputSnapshotBefore/);
  assert.match(source, /inputSnapshotAfter/);
  assert.match(source, /inputSnapshotFinal/);
  assert.match(source, /manifest\.target\?\.platform !== 'darwin'/);
  assert.match(source, /manifest\.target\?\.architecture !== 'arm64'/);
  assert.match(source, /process\.platform !== 'darwin'/);
  assert.match(source, /process\.arch !== 'arm64'/);
  assert.match(source, /manifest\.release\?\.activePages !== 39/);
  assert.match(source, /manifest\.release\?\.courseShells !== 1/);
  assert.match(source, /manifest\.assets\?\.audioFileCount !== 72/);
  assert.doesNotMatch(source, /\/Users\/|\/Volumes\//);
});

test('generated v3.3 verifier binds the frozen v3.2-r2 successor schema and fail-closed six-file boundary', () => {
  const source = verifierSource(resolvePackageVariant('v3-3'));
  const syntax = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    {encoding: 'utf8', input: source},
  );
  assert.equal(
    syntax.status,
    0,
    `${syntax.stdout}\n${syntax.stderr}`,
  );
  assert.match(source, /g4-l3-whole-lesson-package-mvp-v3-3/);
  assert.match(source, /127\.0\.0\.1:3219\/courses\/4\/3/);
  assert.match(source, /g4-l3-current-js-readability-v3-3\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-3-qa\.json/);
  assert.match(source, /g4-l3-whole-lesson-package-mvp-v3-2-r2/);
  assert.match(
    source,
    /1768ae2055931f1c351f13da31a72ff96ef332f3bebaefff35c1df1fd6228d33/,
  );
  assert.match(
    source,
    /e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965/,
  );
  assert.match(
    source,
    /7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91/,
  );
  assert.match(source, /declaredSixFileProductAndVerificationBatch/);
  assert.match(source, /predecessorPerFileAvailableCount !== 5/);
  assert.match(source, /predecessorPerFileUnavailableCount !== 1/);
  assert.match(source, /allSixChangedEstablished !== false/);
  assert.match(source, /exhaustiveByteDeltaFromV32R2Established !== false/);
  assert.match(source, /declaredBatchIsOnlyRepoDelta !== false/);
  assert.match(source, /authoredProductSourceChangedFromV32R2 !== true/);
  assert.match(source, /fullCurrentV33SourceSnapshotBound !== true/);
  assert.match(source, /strictAcceptanceEffect !== 'none'/);
  assert.match(source, /frame !== 789/);
  assert.doesNotMatch(source, /\/Users\/|\/Volumes\//);
});

test('generated v3.3-r2 verifier binds independent evidence and the failed-attempt QA closure', () => {
  const source = verifierSource(resolvePackageVariant('v3-3-r2'));
  const syntax = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    {encoding: 'utf8', input: source},
  );
  assert.equal(syntax.status, 0, `${syntax.stdout}\n${syntax.stderr}`);
  assert.match(source, /g4-l3-whole-lesson-package-mvp-v3-3-r2/);
  assert.match(source, /g4-l3-current-js-readability-v3-3-r2\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-3-r2-qa\.json/);
  assert.match(source, /qaHarnessRevision/);
  assert.match(source, /superseded-after-controlled-qa-harness-timeout/);
  assert.match(source, /predecessorAttemptPackagePublished/);
  assert.match(source, /predecessorAttemptFormalQaPublished/);
  assert.match(source, /predecessorAttemptPartialScreenshotRoot/);
  assert.match(source, /qa-harness-only/);
  assert.match(source, /authoredProductSourceChangedFromV33/);
  assert.match(
    source,
    /686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931/,
  );
  assert.match(
    source,
    /3b65a041d823e615aab11b1e89018d5af71fa38c5454dc351ed0b15f2ef29c10/,
  );
  for (const expected of Object.values(V33_FAILED_QA_ATTEMPT_PREIMAGES)) {
    assert.match(source, new RegExp(expected.sha256));
  }
  assert.doesNotMatch(source, /\/Users\/|\/Volumes\//);
});

test('generated v3.3-r3 verifier reuses exact r2 QA evidence and binds the failed-smoke closure', () => {
  const source = verifierSource(resolvePackageVariant('v3-3-r3'));
  const syntax = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    {encoding: 'utf8', input: source},
  );
  assert.equal(syntax.status, 0, `${syntax.stdout}\n${syntax.stderr}`);
  assert.match(source, /g4-l3-whole-lesson-package-mvp-v3-3-r3/);
  assert.match(source, /g4-l3-current-js-readability-v3-3-r2\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-3-r2-qa\.json/);
  assert.match(source, /packageSmokeHarnessRevision/);
  assert.match(source, /qaEvidenceReuse/);
  assert.match(source, /qa-harness-only/);
  assert.match(source, /copiedOrRegeneratedAsR3Reports/);
  assert.match(
    source,
    /0295d8a174507478a5982071946673d0f5c9d8593894c465f89c92d8a9a41271/,
  );
  assert.match(
    source,
    /a0f366e66c82b542fe9b226d0a2f6800e765e3435ea91e5e2c3ef60dee073c55/,
  );
  assert.match(
    source,
    /4fd4e52794f6dc8910bd60dfd91eca8bde96cb49b9cc47f216e461ab419fedee/,
  );
  assert.match(
    source,
    /306e24152cc03132bc6c8ea0b2ea4ed005fd1af58806ace0a4cdbece16b10eb1/,
  );
  assert.match(
    source,
    /4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894/,
  );
  assert.match(source, /same-player-visible-responsive-key-terms-button/);
  assert.match(source, /arbitraryVisibleElementAccepted/);
  assert.match(source, /strictAcceptanceEffect/);
  assert.doesNotMatch(source, /\/Users\/|\/Volumes\//);
});

test('generated v3.3 launcher verifies spawned process-tree ownership before ready output or browser open', () => {
  const source = launcherSource(
    'apps/web/server.js',
    resolvePackageVariant('v3-3'),
  );
  const syntax = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    {encoding: 'utf8', input: source},
  );
  assert.equal(
    syntax.status,
    0,
    `${syntax.stdout}\n${syntax.stderr}`,
  );
  assert.match(source, /import \{spawn, spawnSync\}/);
  assert.match(source, /\/usr\/bin\/pgrep/);
  assert.match(source, /\/usr\/sbin\/lsof/);
  assert.match(source, /n127\.0\.0\.1:/);
  assert.match(source, /childProcessTreePids\(child\)/);
  assert.match(source, /childOwnsLoopbackListener\(server, port\)/);
  assert.match(
    source,
    /verified process-tree ownership of its loopback listener/,
  );
  assert.match(
    source,
    /G4_L3_WHOLE_LESSON_PACKAGE_V3_3: "1"/,
  );
  const fetchPosition = source.indexOf(
    "fetch(url, {redirect: 'manual'})",
  );
  const ownershipBeforeFetchPosition = source.indexOf(
    'if (!childOwnsLoopbackListener(server, port))',
  );
  const finalOwnershipPosition = source.lastIndexOf(
    'if (!childOwnsLoopbackListener(server, port))',
  );
  const readyOutputPosition = source.indexOf(
    'G4 L3 Whole-Lesson Package MVP is ready:',
  );
  const browserOpenPosition = source.indexOf(
    "spawn('/usr/bin/open', [url]",
  );
  assert.ok(ownershipBeforeFetchPosition < fetchPosition);
  assert.ok(finalOwnershipPosition > fetchPosition);
  assert.ok(finalOwnershipPosition < readyOutputPosition);
  assert.ok(readyOutputPosition < browserOpenPosition);
});

test('immutable v3.3-r3 build guard rejects every existing final target before spending the revision', async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'g4-l3-v33-immutable-targets-'),
  );
  const descriptor = resolvePackageVariant('v3-3-r3');
  const variant = {
    ...descriptor,
    packageRoot: path.join(temporaryRoot, 'package'),
    archivePath: path.join(temporaryRoot, 'package.zip'),
    archiveShaPath: path.join(temporaryRoot, 'package.zip.sha256'),
    smokeReportPath: path.join(temporaryRoot, 'smoke.json'),
    smokeScreenshotPath: path.join(temporaryRoot, 'smoke', 'es.png'),
    deliveryReceiptPath: path.join(temporaryRoot, 'delivery.json'),
    deliveryReportPath: path.join(temporaryRoot, 'delivery.md'),
  };
  try {
    assert.equal(await assertImmutableBuildTargetsAbsent(variant), true);
    for (const [property, directory] of [
      ['packageRoot', true],
      ['archivePath', false],
      ['archiveShaPath', false],
      ['smokeReportPath', false],
      ['deliveryReceiptPath', false],
      ['deliveryReportPath', false],
    ]) {
      if (directory) await mkdir(variant[property]);
      else await writeFile(variant[property], 'immutable fixture', 'utf8');
      await assert.rejects(
        assertImmutableBuildTargetsAbsent(variant),
        /never overwritten/,
      );
      await rm(variant[property], {recursive: true, force: true});
    }
    await mkdir(path.dirname(variant.smokeScreenshotPath));
    await assert.rejects(
      assertImmutableBuildTargetsAbsent(variant),
      /never overwritten/,
    );
    await rm(path.dirname(variant.smokeScreenshotPath), {
      recursive: true,
      force: true,
    });
    assert.equal(
      await assertImmutableBuildTargetsAbsent({
        ...variant,
        immutableBuild: false,
      }),
      true,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test('Next standalone staging removes generated local paths without weakening runtime roots', async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'g4-l3-v3-standalone-paths-'),
  );
  const runtimeRoot = path.join(temporaryRoot, 'runtime');
  const serverEntry = 'apps/web/server.js';
  const serverPath = path.join(runtimeRoot, serverEntry);
  const requiredPath = path.join(
    runtimeRoot,
    'apps/web/.next-g4-l3-package/required-server-files.json',
  );
  try {
    await mkdir(path.dirname(serverPath), {recursive: true});
    await mkdir(path.dirname(requiredPath), {recursive: true});
    await writeFile(
      serverPath,
      `const nextConfig = {"outputFileTracingRoot":${JSON.stringify(root)},"turbopack":{"root":${JSON.stringify(root)}}}\n`,
      'utf8',
    );
    await writeFile(
      requiredPath,
      JSON.stringify({
        config: {
          outputFileTracingRoot: root,
          turbopack: {root},
          unexpectedFutureRoot: root,
        },
        appDir: path.join(root, 'apps/web'),
        relativeAppDir: 'apps/web',
      }),
      'utf8',
    );
    await assert.rejects(
      sanitizeNextStandaloneLocalPaths(runtimeRoot, serverEntry),
      /required-server-files local-path contract has changed/,
    );
    await writeFile(
      requiredPath,
      JSON.stringify({
        config: {
          outputFileTracingRoot: root,
          turbopack: {root},
        },
        appDir: path.join(root, 'apps/web'),
        relativeAppDir: 'apps/web',
      }),
      'utf8',
    );
    const result = await sanitizeNextStandaloneLocalPaths(
      runtimeRoot,
      serverEntry,
    );
    assert.equal(result.status, 'sanitized-next-generated-local-paths');
    assert.equal(result.serverReplacementCount, 2);
    const [serverSource, required] = await Promise.all([
      readFile(serverPath, 'utf8'),
      readFile(requiredPath, 'utf8').then(JSON.parse),
    ]);
    assert.doesNotMatch(serverSource, /\/Volumes\//);
    assert.equal(required.config.outputFileTracingRoot, '../..');
    assert.equal(required.config.turbopack.root, '../..');
    assert.equal(required.appDir, '.');
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test('fresh-ZIP smoke allocates distinct loopback ports instead of trusting fixed listeners', async () => {
  const first = await findAvailableLoopbackPort();
  const second = await findAvailableLoopbackPort([first]);
  assert.ok(Number.isSafeInteger(first) && first > 0);
  assert.ok(Number.isSafeInteger(second) && second > 0);
  assert.notEqual(first, second);
});

test('current-source check rejects stale, incomplete, or internally drifting package snapshots', () => {
  const snapshot = {
    fileCount: 2,
    totalBytes: 42,
    sha256: 'a'.repeat(64),
  };
  const manifest = {
    build: {
      inputSnapshotBefore: structuredClone(snapshot),
      inputSnapshotAfter: structuredClone(snapshot),
      inputSnapshotFinal: structuredClone(snapshot),
    },
  };
  assert.equal(
    assertPackageInputSnapshotCurrent(manifest, structuredClone(snapshot)),
    true,
  );
  const legacyManifest = {
    build: {
      inputSnapshotBefore: structuredClone(snapshot),
      inputSnapshotAfter: structuredClone(snapshot),
    },
  };
  assert.equal(
    assertPackageInputSnapshotCurrent(
      legacyManifest,
      structuredClone(snapshot),
      false,
    ),
    true,
  );
  assert.throws(
    () => assertPackageInputSnapshotCurrent(
      legacyManifest,
      structuredClone(snapshot),
    ),
    /does not match the current source tree/,
  );
  assert.throws(
    () => assertPackageInputSnapshotCurrent(
      manifest,
      {...snapshot, sha256: 'b'.repeat(64)},
    ),
    /does not match the current source tree/,
  );
  assert.throws(
    () => assertPackageInputSnapshotCurrent(
      {
        build: {
          inputSnapshotBefore: snapshot,
          inputSnapshotAfter: {...snapshot, totalBytes: 43},
          inputSnapshotFinal: snapshot,
        },
      },
      snapshot,
    ),
    /does not match the current source tree/,
  );
  assert.throws(
    () => assertPackageInputSnapshotCurrent(
      {
        build: {
          inputSnapshotBefore: snapshot,
          inputSnapshotAfter: snapshot,
          inputSnapshotFinal: {...snapshot, fileCount: 3},
        },
      },
      snapshot,
    ),
    /does not match the current source tree/,
  );
});

test('v2 smoke screenshot binding records a safe path, bytes, and SHA-256', () => {
  const binding = buildSmokeScreenshotBinding(
    'output/playwright/g4-l3-whole-lesson-package-mvp-v2/es-mobile-player.png',
    Buffer.from('v2 screenshot fixture'),
  );
  assert.equal(
    binding.path,
    'output/playwright/g4-l3-whole-lesson-package-mvp-v2/es-mobile-player.png',
  );
  assert.equal(binding.bytes, 21);
  assert.match(binding.sha256, /^[a-f0-9]{64}$/);
  assert.throws(
    () => buildSmokeScreenshotBinding('../v1.png', Buffer.from('unsafe')),
    /safe and relative/,
  );
});

test('course-asset allowlist admits runtime files but excludes evidence manifests and Flash sources', () => {
  for (const file of [
    'canvas-renderer.js',
    'audio/embedded-stream-0001.mp3',
    'sprite-132/frame-0001.png',
    'control-assets/lesson-shell-navigation-over.svg',
    'fonts/bauhaus.ttf',
  ]) {
    assert.equal(isAllowedCourseAsset(file), true, file);
  }
  for (const file of [
    'manifest.json',
    'source.swf',
    'source.fla',
    '.env',
    '../private-archive/file.mp3',
  ]) {
    assert.equal(isAllowedCourseAsset(file), false, file);
  }
});

test('package derives exactly 39 active pages plus the one shell from the atomic release', async () => {
  const document = JSON.parse(
    await readFile(path.join(root, 'catalog/lesson-releases.json'), 'utf8'),
  );
  const release = selectG4L3Release(document);
  assert.equal(release.members.length, 40);
  assert.equal(
    release.members.filter(
      (member) => member.releaseRole === 'active-xml-referenced-page',
    ).length,
    39,
  );
  assert.deepEqual(
    release.members.filter(
      (member) => member.releaseRole === 'course-shell',
    ).map((member) => member.animationId),
    ['shell-course-g04-l03-index-local'],
  );
});

test('standalone build uses a separate dist directory and remains opt-in', async () => {
  const config = await readFile(
    path.join(root, 'apps/web/next.config.ts'),
    'utf8',
  );
  assert.match(config, /G4_L3_WHOLE_LESSON_PACKAGE === '1'/);
  assert.match(config, /G4_L3_WHOLE_LESSON_PACKAGE_V3_1 === '1'/);
  assert.match(config, /G4_L3_WHOLE_LESSON_PACKAGE_V3_2 === '1'/);
  assert.match(config, /G4_L3_WHOLE_LESSON_PACKAGE_V3_3 === '1'/);
  assert.match(
    config,
    /G4 L3 and G5 L4 standalone package builds are mutually exclusive/,
  );
  assert.match(config, /wholeLessonPackageDistDir/);
  assert.match(config, /'\.next-g4-l3-package-v3-1'/);
  assert.match(config, /'\.next-g4-l3-package-v3-2'/);
  assert.match(config, /'\.next-g4-l3-package-v3-3'/);
  assert.match(config, /'\.next-g4-l3-package'/);
  assert.match(config, /distDir:[\s\S]*wholeLessonPackageDistDir/);
  assert.match(config, /output:[\s\S]*'standalone'/);
  assert.match(config, /outputFileTracingExcludes:[\s\S]*source-assets/);
});

test('package builder contains no public release or private archive intake mode', async () => {
  const source = await readFile(
    path.join(root, 'scripts/build-g4-l3-whole-lesson-package-mvp.mjs'),
    'utf8',
  );
  assert.doesNotMatch(source, /--publish|--owner-accept|--strict-complete/);
  assert.doesNotMatch(source, /private-archive\//);
  assert.match(source, /strictCompleteCount !== 0/);
  assert.match(source, /published !== false/);
  assert.match(source, /audioFileCount !== 72/);
  assert.match(source, /rm\(path\.join\(runtimeRoot, evidenceDirectory\)/);
  assert.ok(source.includes("match[2].split('/').some"));
  assert.doesNotMatch(source, /match\[2\]\.includes\('\.\.'\)/);
  assert.match(
    source,
    /'scripts\/build-g4-l3-whole-lesson-package-mvp\.mjs'/,
  );
  assert.doesNotMatch(source, /'apps\/web\/next-env\.d\.ts'/);
  assert.match(source, /data-current-page="1"/);
  assert.match(source, /lesson-shell2__legacy-hit--replay/);
  assert.match(source, /data-current-replay-count="1"/);
  assert.match(source, /Reviewed & next →/);
  assert.match(
    source,
    /rm\(variant\.archiveShaPath, \{force: true\}\)/,
  );
  assert.match(source, /assertPackageInputSnapshotCurrent/);
  assert.match(source, /buildSmokeScreenshotBinding/);
  assert.match(source, /g4-l3-whole-lesson-package-v2-smoke-/);
  assert.match(source, /data-lesson-nav="footer-previous"/);
  assert.match(source, /data-lesson-nav="footer-next"/);
  assert.match(source, /en-native-next-\$\{state\}-48x48\.png/);
  assert.match(source, /finishLabelBefore !== 'Finish review'/);
  assert.match(source, /repeatedActivationIdempotent/);
  assert.match(source, /spanishNextLabel !== 'Página siguiente'/);
  assert.match(source, /--v2/);
  assert.match(source, /--v3/);
  assert.match(source, /--v3-1/);
  assert.match(source, /--v3-2/);
  assert.match(source, /--v3-3/);
  assert.match(source, /--v3-3-r2/);
  assert.match(source, /--v3-3-r3/);
  assert.match(
    source,
    /G4 L3 Whole-Lesson CEO Preview v3 — current JavaScript candidate/,
  );
  assert.match(source, /g4-l3-current-js-readability-v3\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-qa\.json/);
  assert.match(
    source,
    /G4 L3 Whole-Lesson CEO Preview v3\.1 — current JavaScript candidate/,
  );
  assert.match(source, /g4-l3-current-js-readability-v3-1\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-1-qa\.json/);
  assert.match(source, /\.next-g4-l3-package-v3-1/);
  assert.match(source, /defaultPort: 3217/);
  assert.match(
    source,
    /G4 L3 Whole-Lesson CEO Preview v3\.2 — current JavaScript candidate/,
  );
  assert.match(source, /g4-l3-current-js-readability-v3-2\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-2-qa\.json/);
  assert.match(source, /\.next-g4-l3-package-v3-2/);
  assert.match(source, /defaultPort: 3218/);
  assert.match(
    source,
    /G4 L3 Whole-Lesson CEO Preview v3\.3 — current JavaScript candidate/,
  );
  assert.match(source, /g4-l3-current-js-readability-v3-3\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-3-qa\.json/);
  assert.match(source, /\.next-g4-l3-package-v3-3/);
  assert.match(source, /defaultPort: 3219/);
  assert.match(source, /page36CandidateKey: 'v33'/);
  assert.match(source, /G4_L3_WHOLE_LESSON_PACKAGE_V3_3/);
  assert.match(source, /primary-package-builder-v3-3/);
  assert.match(source, /V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH/);
  assert.match(source, /assertV33FrozenPreimages/);
  assert.match(source, /authoredProductSourceChangedFromV32R2: true/);
  assert.match(source, /fullCurrentV33SourceSnapshotBound: true/);
  assert.match(
    source,
    /G4 L3 Whole-Lesson CEO Preview v3\.3-r2 — current JavaScript candidate/,
  );
  assert.match(source, /g4-l3-current-js-readability-v3-3-r2\.json/);
  assert.match(source, /g4-l3-controlled-ceo-preview-v3-3-r2-qa\.json/);
  assert.match(source, /primary-package-builder-v3-3-r2/);
  assert.match(source, /V33_R2_QA_HARNESS_REVISION/);
  assert.match(source, /assertV33R2FrozenPreimages/);
  assert.match(
    source,
    /G4 L3 Whole-Lesson CEO Preview v3\.3-r3 — current JavaScript candidate/,
  );
  assert.match(source, /primary-package-builder-v3-3-r3/);
  assert.match(source, /V33_R3_SMOKE_HARNESS_REVISION/);
  assert.match(source, /assertV33R3FrozenPreimages/);
  assert.match(source, /same-player-visible-responsive-key-terms-button/);
  assert.match(source, /data-responsive-focus-key/);
  assert.match(source, /arbitraryVisibleElementAccepted: false/);
  assert.match(source, /assertImmutableBuildTargetsAbsent/);
  assert.match(source, /checkFreshArchiveCopy/);
  assert.match(source, /assertReportScreenshotBindings/);
  assert.match(source, /strictAcceptanceEffect !== 'none'/);
  assert.match(source, /variant\.strongNavigationChecks/);
  assert.match(source, /extractFinalArchiveForSmoke/);
  assert.match(source, /await runVerifierAt\(packageRoot\)/);
  assert.match(source, /freshExtractedFinalZip: true/);
  assert.match(source, /captureFrozenV2Page36Parity/);
  assert.match(source, /frameDomain: 'sprite-350'/);
  assert.match(source, /frame: 789/);
  assert.match(source, /pixelDifferenceCount/);
  assert.match(source, /channelDifferenceCount/);
  assert.match(
    source,
    /secondRuntimeInCandidatePlayerDom:[\s\S]*candidateWholeLessonObservation\.runtimeStageCount !== 1/,
  );
  assert.match(source, /runtimeObservations\.push/);
  assert.match(source, /exactSingleRuntime/);
  assert.match(source, /report\.privacyScan = await scanPackagePrivacy/);
  assert.match(source, /badHttpResponses/);
  assert.match(source, /fresh-extracted-frozen-v2/);
  assert.match(source, /\['start\.mjs', '--port', String\(port\)\]/);
  assert.match(source, /HELP_MATH_PACKAGE_NO_OPEN/);
  assert.match(
    source,
    /lsof-spawned-process-tree-loopback-listen-before-and-after-http/,
  );
  assert.match(source, /externalRequests/);
  assert.match(source, /failedRequests/);
  assert.match(source, /commitImmutableSmokeEvidence/);
  assert.match(source, /await buildFullCurrentSourceInventory\(\)/);
  assert.match(source, /renderedTranscriptHashes/);
  assert.match(source, /process\.kill\(-processGroupId/);
  assert.match(source, /detached: true/);
  assert.match(source, /postSmokePackageCheck/);
  assert.match(source, /exactManifestOrder/);
  assert.match(source, /exactRealCourseMap/);
  assert.match(source, /page36ReadableView/);
  assert.match(source, /clickOriginalLayoutOnly/);
  assert.match(source, /escapeFocusRestored/);
  assert.match(source, /reflow-200-percent-720x450/);
  assert.match(source, /functionalObservations/);
  assert.match(source, /keyTermsHostInteractions/);
  assert.match(source, /\[data-current-js-functional-entry\]/);
  assert.match(
    source,
    /data-host-selection-resolution=\"matched-local-entry\"/,
  );
  assert.doesNotMatch(
    source,
    /data-host-selection-resolution=\"resolved\"/,
  );
  assert.match(source, /primary-package-builder/);
  assert.match(source, /postbuildCorrectionUsed: false/);
  assert.match(source, /compactLandscape/);
  assert.match(source, /\$\{locale\}-compact-landscape-844x390\.png/);
  assert.match(source, /'en'/);
  assert.match(source, /'es'/);
  assert.match(source, /sectionFirstPage/);
  assert.match(source, /jumpToPage39/);
});

test('v3.2-r2 primary compact smoke uses the visible lesson shell and Course Map', async () => {
  const source = await readFile(
    path.join(root, 'scripts/build-g4-l3-whole-lesson-package-mvp.mjs'),
    'utf8',
  );
  const compactStart = source.indexOf(
    'const inspectCompactLandscape = async',
  );
  const compactEnd = source.indexOf(
    'for (const animationId of options)',
    compactStart,
  );
  assert.ok(compactStart >= 0, 'compact smoke implementation is present');
  assert.ok(
    compactEnd > compactStart,
    'compact smoke implementation has a stable end boundary',
  );
  const compactSource = source.slice(compactStart, compactEnd);
  assert.match(compactSource, /player\.locator\('main\.lesson-shell2'\)/);
  assert.match(
    compactSource,
    /\.lesson-shell2__map-content button\[data-animation-id="\$\{animationId\}"\]/,
  );
  assert.match(compactSource, /mapRow\.waitFor\(\{state: 'visible'/);
  assert.match(compactSource, /await mapRow\.click\(\)/);
  assert.match(compactSource, /selectionMechanism: 'visible-course-map-row'/);
  assert.match(
    compactSource,
    /\[data-resume-choice="beginning"\]:visible/,
  );
  assert.match(
    compactSource,
    /\[data-page-interaction-companion-host="true"\]/,
  );
  assert.match(
    compactSource,
    /\$\{locale\}-compact-landscape-844x390\.png/,
  );
  assert.match(
    compactSource,
    /\$\{animationId\}-compact-landscape-companion\.png/,
  );
  assert.doesNotMatch(compactSource, /picker\.selectOption/);
  assert.match(source, /primary-package-builder-v3-2-r2/);
});

test('package scripts keep v1/v2 and add explicit independent v3 and delivery commands', async () => {
  const packageDocument = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:check'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:smoke'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --smoke',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v2'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v2 --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v2:check'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v2 --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v2:smoke'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v2 --smoke',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3 --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3:check'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3 --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3:smoke'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3 --smoke',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3:delivery'],
    'node scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3:delivery:check'],
    'node scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs --check',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:ceo-preview:v3-1'],
    'node scripts/qa-g4-l3-current-js-product.mjs --controlled-ceo-preview --artifact-version v3-1',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:ceo-preview:v3-1:check'],
    'node scripts/qa-g4-l3-current-js-product.mjs --controlled-ceo-preview --artifact-version v3-1 --check',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:readability:v3-1'],
    'node scripts/qa-g4-l3-current-js-readability-v3.mjs --artifact-version v3-1',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:readability:v3-1:check'],
    'node scripts/qa-g4-l3-current-js-readability-v3.mjs --artifact-version v3-1 --check',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:v31:regression:browser'],
    'node scripts/qa-g4-l3-v31-post-v3-browser.mjs --run',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:v31:regression:browser:check'],
    'node scripts/qa-g4-l3-v31-post-v3-browser.mjs --check',
  );
  assert.equal(
    packageDocument.scripts['build:g4:l3:v31:regression'],
    'node scripts/build-g4-l3-v31-post-v3-regression-receipt.mjs --run',
  );
  assert.equal(
    packageDocument.scripts['build:g4:l3:v31:regression:check'],
    'node scripts/build-g4-l3-v31-post-v3-regression-receipt.mjs --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-1'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-1 --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-1:check'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-1 --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-1:smoke'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-1 --smoke',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-1:delivery'],
    'node scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs --v3-1 --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-1:delivery:check'],
    'node scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs --v3-1 --check',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:ceo-preview:v3-2'],
    'node scripts/qa-g4-l3-current-js-product.mjs --controlled-ceo-preview --artifact-version v3-2',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:ceo-preview:v3-2:check'],
    'node scripts/qa-g4-l3-current-js-product.mjs --controlled-ceo-preview --artifact-version v3-2 --check',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:readability:v3-2'],
    'node scripts/qa-g4-l3-current-js-readability-v3.mjs --artifact-version v3-2',
  );
  assert.equal(
    packageDocument.scripts['qa:g4:l3:readability:v3-2:check'],
    'node scripts/qa-g4-l3-current-js-readability-v3.mjs --artifact-version v3-2 --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-2'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-2 --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-2:check'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-2 --check',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-2:smoke'],
    'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-2 --smoke',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-2:delivery'],
    'node scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs --v3-2 --build',
  );
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-2:delivery:check'],
    'node scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs --v3-2 --check',
  );
  // r3 is an evidence-harness successor invoked through the explicit CLI.
  // Keeping the root package byte-identical to the r2 product-QA binding is
  // what makes reuse of that product evidence independently verifiable.
  assert.equal(
    packageDocument.scripts['package:g4:l3:whole-lesson:mvp:v3-3-r3'],
    undefined,
  );
});
