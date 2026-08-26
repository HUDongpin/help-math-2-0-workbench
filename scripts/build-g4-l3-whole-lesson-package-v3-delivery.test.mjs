import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  assertDeliveryBuildVariantAllowed,
  assertReceiptFingerprint,
  assertV32SmokeHarnessRevision,
  assertV32SuccessorRevision,
  assertV33ProductSourceSuccessorRevision,
  assertV33R2QaHarnessRevision,
  assertV33R3SmokeHarnessRevision,
  deliveryMarkdown,
  parseDeliveryArguments,
  parseDeliveryRequest,
  resolveDeliveryReceiptVariant,
  validateV33R2SmokeFailedAttemptDocument,
  validateV33R3DeliveryFailedAttemptDocument,
  withReceiptFingerprint,
} from './build-g4-l3-whole-lesson-package-v3-delivery.mjs';
import {
  V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS,
  V32_FAILED_SMOKE_ATTEMPT_PREIMAGES,
  V32_FROZEN_PREIMAGES,
  V32_PREIMPLEMENTATION_SOURCE_AUDIT,
  V32_R2_FROZEN_PREIMAGES,
  V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
  V33_FAILED_QA_ATTEMPT_PREIMAGES,
  V33_FROZEN_PREIMAGES,
  V33_R2_FROZEN_PREIMAGES,
  V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES,
  V33_R2_QA_HARNESS_REVISION,
  V33_R3_FROZEN_PREIMAGES,
  V33_R3_SMOKE_HARNESS_REVISION,
  buildCurrentPackageInputSnapshot,
  resolvePackageVariant,
  selectG4L3Release,
} from './build-g4-l3-whole-lesson-package-mvp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function workspaceBinding(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const [bytes, metadata] = await Promise.all([
    readFile(absolutePath),
    stat(absolutePath),
  ]);
  return {
    path: relativePath,
    bytes: metadata.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

function canonicalV32SmokeHarnessRevision() {
  return {
    predecessorAttemptPackageId:
      'g4-l3-whole-lesson-package-mvp-v3-2',
    predecessorAttemptStatus:
      'superseded-after-primary-smoke-harness-failure',
    predecessorAttempt: {
      archive: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptArchive,
      ),
      manifest: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptManifest,
      ),
      archiveChecksum: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES
          .v32FailedSmokeAttemptArchiveChecksum,
      ),
      payloadChecksums: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES
          .v32FailedSmokeAttemptPayloadChecksums,
      ),
      primaryBuilderSha256:
        'ef4bab3904eb1c7030486d9b7dc3ed66bcc733eaa5881ca461ae9caee71ed5e7',
      packageVerifierPassed: true,
      formalSmokeReportPublished: false,
      deliveryReceiptPublished: false,
      predecessorOverwritten: false,
      productFailureEstablished: false,
      unchanged: true,
    },
    changeClass: 'packaging-smoke-harness-only',
    authoredProductSourceChangedFromV32: false,
    correctedBeforePackaging: true,
    externalPostbuildCorrectionUsed: false,
    compactRootSelector: 'main.lesson-shell2',
    compactPageSelectionMechanism: 'visible-course-map-row',
    browserProfileIsolation:
      'resolved-resume-state-before-each-compact-scenario',
    resumeDecisionBeforeGeometry: 'resolved',
    sessionDecisionOverlayBeforeGeometry: 'closed',
    corrections: [
      {
        id: 'compact-visible-course-map-navigation',
        effect: 'smoke-harness-only',
      },
      {
        id: 'compact-shell-root-identity',
        effect: 'smoke-harness-only',
      },
      {
        id: 'compact-resume-state-isolation-and-settling',
        effect: 'smoke-harness-only',
      },
    ],
    strictAcceptanceEffect: 'none',
  };
}

function canonicalV33ProductSourceSuccessorRevision() {
  return {
    predecessorPackageId: 'g4-l3-whole-lesson-package-mvp-v3-2-r2',
    predecessor: {
      archive: structuredClone(V33_FROZEN_PREIMAGES.v32R2Archive),
      manifest: structuredClone(V33_FROZEN_PREIMAGES.v32R2Manifest),
      archiveChecksum:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2ArchiveChecksum),
      payloadChecksums:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2PayloadChecksums),
      smoke: structuredClone(V33_FROZEN_PREIMAGES.v32R2Smoke),
      deliveryReceipt:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2DeliveryReceipt),
      deliveryReport:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2DeliveryReport),
      receiptFingerprintSha256:
        'e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965',
      sourceSnapshot: {
        fileCount: 1264,
        totalBytes: 191299550,
        sha256:
          '7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91',
      },
      unchanged: true,
    },
    declaredSixFileProductAndVerificationBatch: {
      files: V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH.map((row) => ({
        ...structuredClone(row),
        bytes: 1,
      })),
      fileCount: 6,
      roleCounts: {
        authoredRuntime: 2,
        unitTest: 2,
        browserTest: 1,
        browserConfig: 1,
      },
      predecessorPerFileAvailableCount: 5,
      predecessorPerFileUnavailableCount: 1,
      allSixChangedEstablished: false,
      exhaustiveByteDeltaFromV32R2Established: false,
      declaredBatchIsOnlyRepoDelta: false,
    },
    authoredProductSourceChangedFromV32R2: true,
    fullCurrentV33PackageSourceSnapshotBound: true,
    declaredBatchIsTheOnlyRepositoryDelta: false,
    exhaustiveByteDeltaFromV32R2Established: false,
    finalSourceBoundary:
      'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench',
    strictAcceptanceEffect: 'none',
  };
}

test('v3 delivery CLI has one explicit build or read-only check mode', () => {
  assert.equal(parseDeliveryArguments(['--build']), 'build');
  assert.equal(parseDeliveryArguments(['--check']), 'check');
  assert.throws(() => parseDeliveryArguments([]), /exactly one/);
  assert.throws(
    () => parseDeliveryArguments(['--build', '--check']),
    /exactly one/,
  );
  assert.throws(() => parseDeliveryArguments(['--publish']), /exactly one/);
  assert.deepEqual(
    parseDeliveryRequest(['--v3-1', '--build']),
    {mode: 'build', version: 'v3-1'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--check', '--v3-1']),
    {mode: 'check', version: 'v3-1'},
  );
  assert.equal(
    parseDeliveryArguments(['--v3-1', '--check']),
    'check',
  );
  assert.deepEqual(
    parseDeliveryRequest(['--v3-2', '--build']),
    {mode: 'build', version: 'v3-2'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--check', '--v3-2']),
    {mode: 'check', version: 'v3-2'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--v3-2-r2', '--build']),
    {mode: 'build', version: 'v3-2-r2'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--check', '--v3-2-r2']),
    {mode: 'check', version: 'v3-2-r2'},
  );
  assert.equal(
    parseDeliveryArguments(['--v3-2-r2', '--check']),
    'check',
  );
  assert.deepEqual(
    parseDeliveryRequest(['--v3-3', '--build']),
    {mode: 'build', version: 'v3-3'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--check', '--v3-3']),
    {mode: 'check', version: 'v3-3'},
  );
  assert.equal(
    parseDeliveryArguments(['--v3-3', '--check']),
    'check',
  );
  assert.deepEqual(
    parseDeliveryRequest(['--v3-3-r2', '--build']),
    {mode: 'build', version: 'v3-3-r2'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--check', '--v3-3-r2']),
    {mode: 'check', version: 'v3-3-r2'},
  );
  assert.equal(
    parseDeliveryArguments(['--v3-3-r2', '--check']),
    'check',
  );
  assert.deepEqual(
    parseDeliveryRequest(['--v3-3-r3', '--build']),
    {mode: 'build', version: 'v3-3-r3'},
  );
  assert.deepEqual(
    parseDeliveryRequest(['--check', '--v3-3-r3']),
    {mode: 'check', version: 'v3-3-r3'},
  );
  assert.equal(
    parseDeliveryArguments(['--v3-3-r3', '--check']),
    'check',
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-1', '--v3-1', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-1', '--v3-2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-2', '--v3-2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-2', '--v3-2-r2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-1', '--v3-2-r2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-2-r2', '--v3-2-r2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-2-r2', '--v3-3', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3', '--v3-3', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3', '--v3-3-r2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3-r2', '--v3-3-r2', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3-r2', '--v3-3-r3', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3-r3', '--v3-3-r3', '--check']),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-1']),
    /exactly one/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-2']),
    /exactly one/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-2-r2']),
    /exactly one/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3']),
    /exactly one/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3-r2']),
    /exactly one/,
  );
  assert.throws(
    () => parseDeliveryRequest(['--v3-3-r3']),
    /exactly one/,
  );
  const v31 = resolveDeliveryReceiptVariant('v3-1');
  assert.equal(v31.receiptId, 'g4-l3-whole-lesson-package-mvp-v3-1-delivery');
  assert.equal(v31.receiptJson, 'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json');
  assert.equal(v31.receiptMarkdown, 'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md');
  assert.equal(v31.controlledQa.baseUrl, 'http://127.0.0.1:3217');
  assert.equal(v31.controlledQa.reportType, 'g4-l3-controlled-ceo-preview-v3-1-qa');
  assert.equal(v31.readability.reportType, 'g4-l3-current-js-readability-v3-1');
  assert.equal(v31.regression.browserQa, 'reports/g4-l3-v31-post-v3-browser-qa.json');
  const v32 = resolveDeliveryReceiptVariant('v3-2');
  assert.equal(v32.receiptId, 'g4-l3-whole-lesson-package-mvp-v3-2-delivery');
  assert.equal(v32.receiptJson, 'reports/g4-l3-whole-lesson-package-mvp-v3-2-delivery.json');
  assert.equal(v32.receiptMarkdown, 'outputs/g4-l3-whole-lesson-package-mvp-v3-2-delivery-report.md');
  assert.equal(v32.controlledQa.baseUrl, 'http://127.0.0.1:3218');
  assert.equal(v32.controlledQa.artifactVariant, 'v3-2');
  assert.equal(v32.readability.reportType, 'g4-l3-current-js-readability-v3-2');
  assert.equal(v32.frozenPreimages.v31Archive.sha256, '211f87751120aaac29215d6828c1897bdb67408175769270db4ddfa2dd7ed1f6');
  assert.throws(
    () => assertDeliveryBuildVariantAllowed(v32),
    /frozen and finalized/,
  );
  const v32r2 = resolveDeliveryReceiptVariant('v3-2-r2');
  assert.equal(
    v32r2.receiptId,
    'g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery',
  );
  assert.equal(
    v32r2.receiptTitle,
    'G4 L3 Whole-Lesson CEO Preview v3.2-r2 Delivery Receipt',
  );
  assert.equal(
    v32r2.receiptJson,
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json',
  );
  assert.equal(
    v32r2.receiptMarkdown,
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md',
  );
  assert.equal(
    v32r2.smokeReport,
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json',
  );
  assert.equal(
    v32r2.smokeScreenshotRoot,
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2-r2',
  );
  assert.equal(v32r2.version, 'v3-2');
  assert.equal(v32r2.packageVersion, 'v3-2-r2');
  assert.equal(v32r2.artifactRevision, 'r2');
  assert.deepEqual(v32r2.readability, v32.readability);
  assert.deepEqual(v32r2.controlledQa, v32.controlledQa);
  assert.equal(v32r2.frozenPreimages, V32_R2_FROZEN_PREIMAGES);
  assert.equal(
    v32r2.frozenPreimages.v32FailedSmokeAttemptArchive.sha256,
    '5aca39fb8590889d79097fb7c429a370e2b6ac918e21cb73be4e150987ef9447',
  );
  assert.throws(
    () => assertDeliveryBuildVariantAllowed(v32r2),
    /frozen and finalized/,
  );
  const v32r2Package = resolvePackageVariant('v3-2-r2');
  assert.equal(
    v32r2Package.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-2-r2',
  );
  assert.equal(
    v32r2Package.title,
    'G4 L3 Whole-Lesson CEO Preview v3.2-r2 — current JavaScript candidate',
  );
  assert.equal(v32r2Package.artifactRevision, 'r2');
  const v33 = resolveDeliveryReceiptVariant('v3-3');
  assert.equal(
    v33.receiptId,
    'g4-l3-whole-lesson-package-mvp-v3-3-delivery',
  );
  assert.equal(
    v33.receiptTitle,
    'G4 L3 Whole-Lesson CEO Preview v3.3 Delivery Receipt',
  );
  assert.equal(
    v33.receiptJson,
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-delivery.json',
  );
  assert.equal(
    v33.receiptMarkdown,
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-delivery-report.md',
  );
  assert.equal(
    v33.smokeReport,
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json',
  );
  assert.equal(
    v33.smokeScreenshotRoot,
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3',
  );
  assert.equal(v33.controlledQa.baseUrl, 'http://127.0.0.1:3219');
  assert.equal(v33.controlledQa.artifactVariant, 'v3-3');
  assert.equal(v33.readability.artifactVersion, 'v3.3');
  assert.equal(v33.frozenPreimages, V33_FROZEN_PREIMAGES);
  assert.throws(
    () => assertDeliveryBuildVariantAllowed(v33),
    /frozen and finalized/,
  );
  const v33Package = resolvePackageVariant('v3-3');
  assert.equal(
    v33Package.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-3',
  );
  assert.equal(v33Package.defaultPort, 3219);
  assert.equal(
    v33Package.smokeVerifierImplementation,
    'primary-package-builder-v3-3',
  );
  const v33r2 = resolveDeliveryReceiptVariant('v3-3-r2');
  assert.equal(
    v33r2.receiptId,
    'g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery',
  );
  assert.equal(
    v33r2.receiptJson,
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery.json',
  );
  assert.equal(
    v33r2.receiptMarkdown,
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery-report.md',
  );
  assert.equal(
    v33r2.readability.json,
    'reports/g4-l3-current-js-readability-v3-3-r2.json',
  );
  assert.equal(
    v33r2.controlledQa.json,
    'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.json',
  );
  assert.equal(
    v33r2.smokeReport,
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json',
  );
  assert.equal(v33r2.controlledQa.baseUrl, 'http://127.0.0.1:3219');
  assert.equal(v33r2.controlledQa.artifactVariant, 'v3-3-r2');
  assert.equal(v33r2.readability.artifactVersion, 'v3.3-r2');
  assert.equal(v33r2.frozenPreimages, V33_R2_FROZEN_PREIMAGES);
  assert.throws(
    () => assertDeliveryBuildVariantAllowed(v33r2),
    /frozen and finalized/,
  );
  const v33r2Package = resolvePackageVariant('v3-3-r2');
  assert.equal(
    v33r2Package.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-3-r2',
  );
  assert.equal(v33r2Package.defaultPort, 3219);
  assert.equal(v33r2Package.artifactRevision, 'r2');
  const v33r3 = resolveDeliveryReceiptVariant('v3-3-r3');
  assert.equal(
    v33r3.receiptId,
    'g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery',
  );
  assert.equal(
    v33r3.receiptTitle,
    'G4 L3 Whole-Lesson CEO Preview v3.3-r3 Delivery Receipt',
  );
  assert.equal(
    v33r3.receiptJson,
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery.json',
  );
  assert.equal(
    v33r3.receiptMarkdown,
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-report.md',
  );
  assert.equal(
    v33r3.smokeReport,
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json',
  );
  assert.equal(
    v33r3.smokeScreenshotRoot,
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r3',
  );
  assert.equal(v33r3.version, 'v3-3');
  assert.equal(v33r3.artifactRevision, 'r3');
  assert.equal(v33r3.packageVersion, 'v3-3-r3');
  assert.equal(v33r3.frozenPreimages, V33_R3_FROZEN_PREIMAGES);
  assert.equal(v33r3.qaAndReadabilityEvidenceReusedFrom, 'v3-3-r2');
  assert.deepEqual(v33r3.readability, v33r2.readability);
  assert.deepEqual(v33r3.controlledQa, v33r2.controlledQa);
  assert.equal(assertDeliveryBuildVariantAllowed(v33r3), true);
  const v33r3Package = resolvePackageVariant('v3-3-r3');
  assert.equal(
    v33r3Package.packageId,
    'g4-l3-whole-lesson-package-mvp-v3-3-r3',
  );
  assert.equal(v33r3Package.defaultPort, 3219);
  assert.equal(v33r3Package.artifactRevision, 'r3');
  assert.throws(
    () => assertDeliveryBuildVariantAllowed(v31),
    /frozen and finalized/,
  );
  assert.throws(
    () => assertDeliveryBuildVariantAllowed(resolveDeliveryReceiptVariant('v3')),
    /frozen and finalized/,
  );
  assert.throws(
    () => resolveDeliveryReceiptVariant('v4'),
    /Unsupported delivery receipt variant/,
  );
});

test('v3.2 successor manifest rejects any frozen, source, or responsive drift', () => {
  const successor = {
    predecessorPackageId: 'g4-l3-whole-lesson-package-mvp-v3-1',
    predecessor: {
      archive: structuredClone(V32_FROZEN_PREIMAGES.v31Archive),
      manifest: structuredClone(V32_FROZEN_PREIMAGES.v31Manifest),
      archiveChecksum:
        structuredClone(V32_FROZEN_PREIMAGES.v31ArchiveChecksum),
      smoke: structuredClone(V32_FROZEN_PREIMAGES.v31Smoke),
      deliveryReceipt:
        structuredClone(V32_FROZEN_PREIMAGES.v31DeliveryReceipt),
      deliveryReport:
        structuredClone(V32_FROZEN_PREIMAGES.v31DeliveryReport),
      postbuildSmokeRunner:
        structuredClone(V32_FROZEN_PREIMAGES.v31PostbuildSmokeRunner),
      receiptFingerprintSha256:
        '6564941b267b1a29ce2ed10d0534b2273696b74957a14662536c398442be2580',
      unchanged: true,
    },
    knownCompactLandscapeBatch: {
      files: V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS.map((row) => ({
        ...row,
        bytes: 1,
      })),
      fileCount: 6,
      currentProductCopy: {
        english: 'Flash transport parity: not established',
        spanish: 'Paridad del transporte de Flash: no establecida',
      },
      responsiveContract: {
        viewport: {width: 844, height: 390},
        toolbarColumns: 4,
        minimumInteractiveTargetPixels: 44,
        fullTransportBoundaryRemainsAssistiveTechnologyReadable: true,
        learningActionsSingleRow: true,
        horizontalOverflowTolerancePixels: 1,
      },
    },
    primarySmokeSelectorClosure: {
      currentJavascriptFunctionalSelectors: [
        '[data-current-js-functional-candidate="true"]',
        '[data-current-js-functional-entry]',
        '[data-current-js-functional-scope]',
        '[data-current-js-modern-reconstruction="true"]',
      ],
      keyTermsHostSelectionResolution: 'matched-local-entry',
      externalPostbuildSmokeRunnerRequired: false,
    },
    preimplementationSourceAudit:
      structuredClone(V32_PREIMPLEMENTATION_SOURCE_AUDIT),
    finalSourceBoundary:
      'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench',
    exhaustiveByteDeltaFromV31Established: false,
    strictAcceptanceEffect: 'none',
  };
  assert.equal(assertV32SuccessorRevision(successor), true);
  for (const mutate of [
    (row) => {
      row.predecessor.postbuildSmokeRunner.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.knownCompactLandscapeBatch.files[0].sha256 = '0'.repeat(64);
    },
    (row) => {
      row.knownCompactLandscapeBatch.currentProductCopy.english = 'pending';
    },
    (row) => {
      row.knownCompactLandscapeBatch.responsiveContract
        .minimumInteractiveTargetPixels = 43;
    },
    (row) => {
      row.primarySmokeSelectorClosure
        .currentJavascriptFunctionalSelectors.splice(1, 1);
    },
    (row) => {
      row.preimplementationSourceAudit.exhaustiveCompactOnlyDelta = true;
    },
  ]) {
    const drifted = structuredClone(successor);
    mutate(drifted);
    assert.throws(
      () => assertV32SuccessorRevision(drifted),
      /does not bind the exact frozen v3\.1 closure/,
    );
  }
});

test('v3.2-r2 smoke-harness revision is canonical and fail-closed', () => {
  const canonical = canonicalV32SmokeHarnessRevision();
  assert.deepEqual(
    canonical.predecessorAttempt.archive,
    V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptArchive,
  );
  assert.deepEqual(
    canonical.predecessorAttempt.manifest,
    V32_R2_FROZEN_PREIMAGES.v32FailedSmokeAttemptManifest,
  );
  assert.equal(assertV32SmokeHarnessRevision(canonical), true);

  for (const mutate of [
    (row) => {
      row.compactRootSelector = '[data-lesson-player]';
    },
    (row) => {
      row.compactPageSelectionMechanism = 'hidden-picker-option';
    },
    (row) => {
      row.resumeDecisionBeforeGeometry = 'pending';
    },
    (row) => {
      row.sessionDecisionOverlayBeforeGeometry = 'open';
    },
    (row) => {
      row.corrections[0].id = 'compact-hidden-picker-navigation';
    },
    (row) => {
      row.corrections.reverse();
    },
    (row) => {
      row.predecessorAttempt.formalSmokeReportPublished = true;
    },
    (row) => {
      row.predecessorAttempt.deliveryReceiptPublished = true;
    },
    (row) => {
      row.predecessorAttempt.productFailureEstablished = true;
    },
    (row) => {
      row.predecessorAttempt.packageVerifierPassed = false;
    },
    (row) => {
      row.predecessorAttempt.archive.sha256 = '0'.repeat(64);
    },
  ]) {
    const drifted = structuredClone(canonical);
    mutate(drifted);
    assert.throws(
      () => assertV32SmokeHarnessRevision(drifted),
      /does not bind the failed v3\.2 attempt/,
    );
  }
});

test('v3.3 product-source successor is canonical and fail-closed', () => {
  const canonical = canonicalV33ProductSourceSuccessorRevision();
  assert.equal(
    assertV33ProductSourceSuccessorRevision(canonical),
    true,
  );
  assert.equal(
    canonical.declaredSixFileProductAndVerificationBatch.files.length,
    6,
  );
  assert.equal(
    canonical.declaredSixFileProductAndVerificationBatch
      .predecessorPerFileUnavailableCount,
    1,
  );

  for (const mutate of [
    (row) => {
      row.predecessor.archive.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.predecessor.receiptFingerprintSha256 = '0'.repeat(64);
    },
    (row) => {
      row.predecessor.sourceSnapshot.fileCount = 1263;
    },
    (row) => {
      row.declaredSixFileProductAndVerificationBatch.files[0].sha256 =
        '0'.repeat(64);
    },
    (row) => {
      row.declaredSixFileProductAndVerificationBatch.files[0].bytes = 0;
    },
    (row) => {
      row.declaredSixFileProductAndVerificationBatch.roleCounts.unitTest = 3;
    },
    (row) => {
      row.declaredSixFileProductAndVerificationBatch
        .allSixChangedEstablished = true;
    },
    (row) => {
      row.authoredProductSourceChangedFromV32R2 = false;
    },
    (row) => {
      row.fullCurrentV33PackageSourceSnapshotBound = false;
    },
    (row) => {
      row.declaredBatchIsTheOnlyRepositoryDelta = true;
    },
    (row) => {
      row.exhaustiveByteDeltaFromV32R2Established = true;
    },
    (row) => {
      row.strictAcceptanceEffect = 'strict-complete';
    },
  ]) {
    const drifted = structuredClone(canonical);
    mutate(drifted);
    assert.throws(
      () => assertV33ProductSourceSuccessorRevision(drifted),
      /v3\.3 (?:product-source successor receipt|declared six-file product\/verification subset)/,
    );
  }
});

test('v3.3-r2 QA-harness successor binds the failed attempt without claiming product failure', () => {
  const canonical = structuredClone(V33_R2_QA_HARNESS_REVISION);
  assert.equal(assertV33R2QaHarnessRevision(canonical), true);
  assert.equal(canonical.changeClass, 'qa-harness-only');
  assert.equal(canonical.predecessorAttemptPackagePublished, false);
  assert.equal(canonical.predecessorAttemptFormalQaPublished, false);
  assert.equal(canonical.predecessorAttemptPartialScreenshotRoot.fileCount, 5);
  assert.equal(canonical.productFailureEstablished, false);
  assert.equal(canonical.authoredProductSourceChangedFromV33, false);
  assert.equal(canonical.strictAcceptanceEffect, 'none');
  assert.equal(
    V33_FAILED_QA_ATTEMPT_PREIMAGES.v33FailedQaAttemptReceipt.sha256,
    '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
  );

  for (const mutate of [
    (row) => {
      row.predecessorAttemptFormalQaPublished = true;
    },
    (row) => {
      row.predecessorAttemptPartialScreenshotRoot.fileCount = 4;
    },
    (row) => {
      row.predecessorAttemptFailureReceipt.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.predecessorAttemptPackagePublished = true;
    },
    (row) => {
      row.productFailureEstablished = true;
    },
    (row) => {
      row.authoredProductSourceChangedFromV33 = true;
    },
    (row) => {
      row.strictAcceptanceEffect = 'strict-complete';
    },
  ]) {
    const drifted = structuredClone(canonical);
    mutate(drifted);
    assert.throws(
      () => assertV33R2QaHarnessRevision(drifted),
      /v3\.3-r2 QA-harness revision/,
    );
  }
});

test('v3.3-r3 smoke-harness successor is exact and acceptance-neutral', () => {
  const canonical = structuredClone(V33_R3_SMOKE_HARNESS_REVISION);
  assert.equal(assertV33R3SmokeHarnessRevision(canonical), true);
  assert.equal(canonical.changeClass, 'qa-harness-only');
  assert.equal(canonical.harnessScope, 'fresh-unzip-package-smoke');
  assert.equal(canonical.predecessorFormalSmokeReportPublished, false);
  assert.equal(canonical.predecessorDeliveryReceiptPublished, false);
  assert.equal(canonical.predecessorOverwritten, false);
  assert.equal(canonical.productFailureEstablished, false);
  assert.equal(canonical.authoredProductSourceChangedFromV33R2, false);
  assert.equal(canonical.productBuildConfigurationChangedFromV33R2, false);
  assert.equal(canonical.qaAndReadabilityEvidenceReusedFrom, 'v3-3-r2');
  assert.equal(
    canonical.focusRestorationSelector,
    'button[data-responsive-focus-key="key-terms"]',
  );
  assert.equal(canonical.arbitraryVisibleElementAccepted, false);
  assert.equal(canonical.sourceHotspotFocusRequired, false);
  assert.equal(
    canonical.rw003SourceStopHoldAndExplicitResumeStillRequired,
    true,
  );
  assert.equal(canonical.strictAcceptanceEffect, 'none');
  assert.equal(
    canonical.predecessorAttemptFailureReceipt.sha256,
    '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
  );
  assert.equal(
    V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Archive.sha256,
    '0295d8a174507478a5982071946673d0f5c9d8593894c465f89c92d8a9a41271',
  );

  for (const mutate of [
    (row) => {
      row.predecessorAttemptFailureReceipt.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.predecessorAttemptPackage.archive.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.predecessorFormalSmokeReportPublished = true;
    },
    (row) => {
      row.predecessorDeliveryReceiptPublished = true;
    },
    (row) => {
      row.productFailureEstablished = true;
    },
    (row) => {
      row.authoredProductSourceChangedFromV33R2 = true;
    },
    (row) => {
      row.focusRestorationSelector = 'button';
    },
    (row) => {
      row.arbitraryVisibleElementAccepted = true;
    },
    (row) => {
      row.rw003SourceStopHoldAndExplicitResumeStillRequired = false;
    },
    (row) => {
      row.strictAcceptanceEffect = 'strict-complete';
    },
  ]) {
    const drifted = structuredClone(canonical);
    mutate(drifted);
    assert.throws(
      () => assertV33R3SmokeHarnessRevision(drifted),
      /v3\.3-r3 smoke-harness revision/,
    );
  }
});

test('v3.3-r2 failed-smoke receipt is fail-closed', async () => {
  const failure = JSON.parse(await readFile(
    path.join(
      root,
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
    ),
    'utf8',
  ));
  assert.equal(validateV33R2SmokeFailedAttemptDocument(failure), true);
  assert.equal(failure.isolatedDiagnosticReplay.failingPredicateVector.length, 3);
  assert.equal(
    failure.independentFreshUnzipFocusForensics
      .exactResponsiveFocusContractObservedForAllThree,
    true,
  );

  for (const mutate of [
    (row) => {
      row.sealedPackage.archive.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.formalAttempt.officialSmokeJsonPublished = true;
    },
    (row) => {
      row.formalAttempt.deliveryReceiptPublished = true;
    },
    (row) => {
      row.isolatedDiagnosticReplay.failingPredicateVector[0]
        .legacySourceHotspotFocusPredicate = true;
    },
    (row) => {
      row.independentFreshUnzipFocusForensics.observations[0]
        .responsiveFocusKey = 'map';
    },
    (row) => {
      row.rootCause.productFailureEstablished = true;
    },
    (row) => {
      row.successorBoundary.r2FormalSmokePublished = true;
    },
    (row) => {
      row.successorBoundary.nextRevision = 'v3.3-r2';
    },
    (row) => {
      row.successorBoundary.strictAcceptanceEffect = 'strict-complete';
    },
    (row) => {
      row.authority.ownerAcceptance = true;
    },
  ]) {
    const drifted = structuredClone(failure);
    mutate(drifted);
    assert.throws(
      () => validateV33R2SmokeFailedAttemptDocument(drifted),
      /v3\.3-r2 smoke failed-attempt receipt/,
    );
  }
});

test('v3.3-r3 failed delivery attempt binds the exact two-file delivery-harness successor', async () => {
  const deliveryHarnessPaths = [
    'scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs',
    'scripts/build-g4-l3-whole-lesson-package-v3-delivery.test.mjs',
  ];
  const [failure, manifest, releaseDocument, ...currentBindings] =
    await Promise.all([
      readFile(
        path.join(
          root,
          'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-failed-attempt.json',
        ),
        'utf8',
      ).then(JSON.parse),
      readFile(
        path.join(
          root,
          'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64/package-manifest.json',
        ),
        'utf8',
      ).then(JSON.parse),
      readFile(
        path.join(root, 'catalog/lesson-releases.json'),
        'utf8',
      ).then(JSON.parse),
      ...deliveryHarnessPaths.map(workspaceBinding),
    ]);
  const currentSnapshot = await buildCurrentPackageInputSnapshot(
    selectG4L3Release(releaseDocument),
    resolvePackageVariant('v3-3-r3'),
  );
  assert.equal(
    validateV33R3DeliveryFailedAttemptDocument(failure, {
      manifestBuild: manifest.build,
      currentSnapshot,
      currentBindings,
    }),
    true,
  );
  assert.equal(failure.preimageRestoration.packageCheckPassed, true);
  assert.equal(failure.correctedHarness.exactChangedFileCount, 2);
  assert.equal(failure.correctedHarness.authoredProductSourceChanged, false);
  assert.equal(failure.correctedHarness.packageBytesChanged, false);
  assert.equal(failure.correctedHarness.smokeBytesChanged, false);
  assert.equal(failure.successorBoundary.sameR3PackageRetained, true);
  assert.equal(failure.successorBoundary.strictAcceptanceEffect, 'none');

  for (const mutate of [
    (row) => {
      row.packageClosure.archive.sha256 = '0'.repeat(64);
    },
    (row) => {
      row.deliveryAttempt.receiptJsonPublished = true;
    },
    (row) => {
      row.rootCause.manifestFieldWritten = 'smokeHarnessRevision';
    },
    (row) => {
      row.rootCause.manifestSourceField = 'smokeHarnessRevision';
    },
    (row) => {
      row.preimageRestoration.packageCheckPassed = false;
    },
    (row) => {
      row.correctedHarness.exactChangedFileCount = 3;
    },
    (row) => {
      row.correctedHarness.scopeSemantics = 'exhaustive-repository-delta';
    },
    (row) => {
      row.correctedHarness.exhaustiveOtherCurrentTreeDeltaEstablished = true;
    },
    (row) => {
      row.correctedHarness.currentPackageSourceSnapshotEqualsBuildSnapshot =
        true;
    },
    (row) => {
      row.correctedHarness.authoredProductSourceChanged = true;
    },
    (row) => {
      row.correctedHarness.packageBytesChanged = true;
    },
    (row) => {
      row.successorBoundary.sameR3PackageRetained = false;
    },
    (row) => {
      row.successorBoundary.ownerAcceptancePromoted = true;
    },
    (row) => {
      row.authority.published = true;
    },
  ]) {
    const drifted = structuredClone(failure);
    mutate(drifted);
    assert.throws(
      () => validateV33R3DeliveryFailedAttemptDocument(drifted, {
        manifestBuild: manifest.build,
        currentSnapshot,
        currentBindings,
      }),
      /v3\.3-r3 delivery failed-attempt receipt/,
    );
  }

  const driftedManifestBuild = structuredClone(manifest.build);
  driftedManifestBuild.inputSnapshotBefore.sha256 = '0'.repeat(64);
  assert.throws(
    () => validateV33R3DeliveryFailedAttemptDocument(failure, {
      manifestBuild: driftedManifestBuild,
      currentSnapshot,
      currentBindings,
    }),
    /v3\.3-r3 delivery failed-attempt receipt/,
  );
});

test('delivery receipt fingerprint is canonical and detects tampering', () => {
  const receipt = withReceiptFingerprint({
    schemaVersion: 1,
    receiptId: 'g4-l3-whole-lesson-package-mvp-v3-delivery',
    generatedAt: '2026-07-30T00:00:00.000Z',
    strictCompleteMembers: 0,
    published: false,
  });
  assert.match(receipt.receiptFingerprintSha256, /^[a-f0-9]{64}$/);
  assert.equal(assertReceiptFingerprint(receipt), true);
  assert.throws(
    () => assertReceiptFingerprint({...receipt, published: true}),
    /fingerprint mismatch/,
  );
  assert.deepEqual(withReceiptFingerprint(receipt), receipt);
});

test('delivery Markdown renderer preserves the immutable v3 bytes', async () => {
  const [receiptSource, expectedMarkdown] = await Promise.all([
    readFile(
      path.join(
        root,
        'reports/g4-l3-whole-lesson-package-mvp-v3-delivery.json',
      ),
      'utf8',
    ),
    readFile(
      path.join(
        root,
        'outputs/g4-l3-whole-lesson-package-mvp-v3-delivery-report.md',
      ),
      'utf8',
    ),
  ]);
  assert.equal(deliveryMarkdown(JSON.parse(receiptSource)), expectedMarkdown);
});

test('delivery Markdown renderer preserves the immutable v3.1 bytes', async () => {
  const [receiptSource, expectedMarkdown] = await Promise.all([
    readFile(
      path.join(
        root,
        'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json',
      ),
      'utf8',
    ),
    readFile(
      path.join(
        root,
        'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md',
      ),
      'utf8',
    ),
  ]);
  assert.equal(deliveryMarkdown(JSON.parse(receiptSource)), expectedMarkdown);
});

test('delivery Markdown renderer preserves the immutable v3.2-r2 bytes', async () => {
  const [receiptSource, expectedMarkdown] = await Promise.all([
    readFile(
      path.join(
        root,
        'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json',
      ),
      'utf8',
    ),
    readFile(
      path.join(
        root,
        'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md',
      ),
      'utf8',
    ),
  ]);
  assert.equal(deliveryMarkdown(JSON.parse(receiptSource)), expectedMarkdown);
});

test('delivery Markdown keeps the exact v3 identity and acceptance boundary', () => {
  const receipt = {
    generatedAt: '2026-07-30T00:00:00.000Z',
    package: {
      packageId: 'g4-l3-whole-lesson-package-mvp-v3',
      title:
        'G4 L3 Whole-Lesson CEO Preview v3 — current JavaScript candidate',
      archive: {
        path:
          'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64.zip',
        sha256: 'a'.repeat(64),
      },
      manifest: {
        path:
          'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64/package-manifest.json',
        sha256: 'b'.repeat(64),
      },
    },
    verification: {
      smoke: {
        report: {
          path: 'reports/g4-l3-whole-lesson-package-mvp-v3-smoke.json',
        },
        freshExtractedFinalZip: true,
        extractedPackageVerifier: 'pass',
        page36FrozenV2Parity: {pixelDifferenceCount: 0},
        manualIntegrationScreenshots: [],
        exactSingleRuntimePages: 39,
        privacyScan: {status: 'pass', filesScanned: 100},
      },
    },
    readabilityEnhancements: {
      animationId: 'course-g04-l03-ts-008',
      source: {sha256: 'c'.repeat(64)},
      frameDomain: 'sprite-350',
      frame: 420,
      nativePaddingPixels: 4,
      desktopScale: 2.5,
      crops: [{id: 'step-3'}, {id: 'step-4'}],
      defaultExpanded: true,
      originalLayoutPreserved: true,
      strictAcceptanceEffect: 'none',
      screenshots: [{path: 'readability.png'}],
    },
    controlledCeoPreviewQa: {
      screenshots: [{path: 'controlled.png'}],
    },
    frozenV2: {
      archive: {
        path:
          'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64.zip',
        sha256: 'd'.repeat(64),
      },
      manifest: {sha256: 'e'.repeat(64)},
      unchanged: true,
    },
    frozenTs008GeneratedRenderer: {
      sha256: 'f'.repeat(64),
      unchanged: true,
    },
    receiptFingerprintSha256: '0'.repeat(64),
  };
  const markdown = deliveryMarkdown(receipt);
  assert.match(
    markdown,
    /G4 L3 Whole-Lesson CEO Preview v3 Delivery Receipt/,
  );
  assert.match(markdown, /strict completion 证据/);
  assert.match(markdown, /Strict completion：`0\/40`/);
  assert.match(markdown, /Published：`false`/);
  assert.doesNotMatch(markdown, /\/(?:Users|Volumes)\//);

  const v31Receipt = {
    ...structuredClone(receipt),
    title: 'G4 L3 Whole-Lesson CEO Preview v3.1 Delivery Receipt',
    packageVariant: 'v3-1',
    package: {
      ...structuredClone(receipt.package),
      packageId: 'g4-l3-whole-lesson-package-mvp-v3-1',
      title:
        'G4 L3 Whole-Lesson CEO Preview v3.1 — current JavaScript candidate',
    },
    postV3Regression: {
      reports: {json: {path: 'reports/regression.json'}},
      sourceInventory: {path: 'reports/source-inventory.json'},
      browserQa: {
        report: {path: 'reports/browser-qa.json'},
        screenshots: [{path: 'output/playwright/regression.png'}],
      },
      truthBoundary: {
        declaredFunctionalPageInventoryComplete: true,
        declaredFunctionalMarkersObserved: true,
        functionalInteractionCompletenessEstablished: false,
        fullCurrentV31SourceInventoryBound: true,
        exhaustiveByteDeltaFromV3Established: false,
        strictAcceptanceEffect: 'none',
      },
    },
    frozenV3: {
      archive: {path: 'outputs/v3.zip', sha256: '1'.repeat(64)},
      archiveChecksum: {sha256: '2'.repeat(64)},
      manifest: {sha256: '3'.repeat(64)},
      deliveryReceipt: {sha256: '4'.repeat(64)},
      unchanged: true,
    },
  };
  const v31Markdown = deliveryMarkdown(v31Receipt);
  assert.match(v31Markdown, /CEO Preview v3\.1 Delivery Receipt/);
  assert.match(v31Markdown, /Post-v3 current-JavaScript 回归/);
  assert.match(v31Markdown, /Full current v3\.1 source inventory bound：`true`/);
  assert.match(v31Markdown, /Exhaustive byte delta from frozen v3 established：`false`/);
  assert.match(v31Markdown, /v3 delivery receipt SHA-256：`4444/);
  assert.doesNotMatch(v31Markdown, /\/(?:Users|Volumes)\//);

  const v32Receipt = {
    ...structuredClone(v31Receipt),
    title: 'G4 L3 Whole-Lesson CEO Preview v3.2 Delivery Receipt',
    artifactVersion: 'v3.2',
    packageVariant: 'v3-2',
    package: {
      ...structuredClone(v31Receipt.package),
      packageId: 'g4-l3-whole-lesson-package-mvp-v3-2',
      title:
        'G4 L3 Whole-Lesson CEO Preview v3.2 — current JavaScript candidate',
      sourceSnapshot: {
        fileCount: 1279,
        totalBytes: 192_700_000,
        sha256: '5'.repeat(64),
      },
    },
    verification: {
      ...structuredClone(v31Receipt.verification),
      smoke: {
        ...structuredClone(v31Receipt.verification.smoke),
        smokeVerifier: {
          implementation: 'primary-package-builder',
          postbuildCorrectionUsed: false,
          functionalEntrySelectorIncluded: true,
          keyTermsResolution: 'matched-local-entry',
          strictAcceptanceEffect: 'none',
        },
        compactLandscape: {
          passed: true,
          viewport: {width: 844, height: 390},
          english: {
            toolbar: {columns: 4, rows: 6},
            badge: {text: 'Flash transport parity: not established'},
            targets: {minimumWidth: 44, minimumHeight: 44},
            horizontalOverflowPx: 0,
            actions: {sameRow: true},
            fullTransportBoundary: {present: true, ariaHidden: null},
            primaryRuntimeCount: 1,
            screenshot: {
              path: 'output/playwright/v32/en.png',
              sha256: 'b'.repeat(64),
            },
            companionPages: [
              {
                screenshot: {
                  path: 'output/playwright/v32/fq002.png',
                  sha256: 'c'.repeat(64),
                },
              },
              {
                screenshot: {
                  path: 'output/playwright/v32/fq003.png',
                  sha256: 'd'.repeat(64),
                },
              },
            ],
          },
          spanish: {
            toolbar: {columns: 4, rows: 6},
            badge: {
              text: 'Paridad del transporte de Flash: no establecida',
            },
            targets: {minimumWidth: 44, minimumHeight: 44},
            horizontalOverflowPx: 0,
            actions: {sameRow: true},
            fullTransportBoundary: {present: true, ariaHidden: null},
            primaryRuntimeCount: 1,
            screenshot: {
              path: 'output/playwright/v32/es.png',
              sha256: 'e'.repeat(64),
            },
          },
          strictAcceptanceEffect: 'none',
        },
      },
    },
    successorRevision: {
      predecessorPackageId: 'g4-l3-whole-lesson-package-mvp-v3-1',
      knownCompactLandscapeBatch: {fileCount: 6},
      exhaustiveByteDeltaFromV31Established: false,
      strictAcceptanceEffect: 'none',
    },
    frozenV31: {
      archive: {path: 'outputs/v3-1.zip', sha256: '6'.repeat(64)},
      manifest: {sha256: '7'.repeat(64)},
      smoke: {sha256: '8'.repeat(64)},
      deliveryReceipt: {sha256: '9'.repeat(64)},
      archiveChecksum: {sha256: '0'.repeat(64)},
      deliveryReport: {sha256: '1'.repeat(64)},
      postbuildSmokeRunner: {sha256: '2'.repeat(64)},
      receiptFingerprintSha256: 'a'.repeat(64),
      unchanged: true,
    },
  };
  delete v32Receipt.postV3Regression;
  const v32Markdown = deliveryMarkdown(v32Receipt);
  assert.match(v32Markdown, /CEO Preview v3\.2 Delivery Receipt/);
  assert.match(v32Markdown, /v3\.2 compact-landscape successor/);
  assert.match(v32Markdown, /Known compact batch files：`6`/);
  assert.match(v32Markdown, /not an exhaustive v3\.1 → v3\.2 byte delta/);
  assert.match(v32Markdown, /844×390 EN\/ES smoke：`true`/);
  assert.match(v32Markdown, /Toolbar：`4` columns × `6` rows/);
  assert.match(
    v32Markdown,
    /EN disclosure：`Flash transport parity: not established`/,
  );
  assert.match(
    v32Markdown,
    /ES disclosure：`Paridad del transporte de Flash: no establecida`/,
  );
  assert.match(v32Markdown, /Primary builder smoke：`primary-package-builder`/);
  assert.match(v32Markdown, /Postbuild correction used：`false`/);
  assert.match(v32Markdown, /v3\.1 receipt fingerprint：`aaaa/);
  assert.match(v32Markdown, /v3\.1 postbuild smoke runner SHA-256：`2222/);
  assert.match(v32Markdown, /Minimum target observed：`44`px/);
  assert.match(v32Markdown, /Maximum horizontal overflow：`0`px/);
  assert.match(v32Markdown, /Three lesson actions stay on one row：`true`/);
  assert.match(v32Markdown, /Full transport boundary remains AT-readable：`true`/);
  assert.match(v32Markdown, /Single primary runtime：`true`/);
  assert.match(v32Markdown, /Strict completion：`0\/40`/);
  assert.match(v32Markdown, /Published：`false`/);
  assert.doesNotMatch(v32Markdown, /\/(?:Users|Volumes)\//);

  const v32R2Receipt = {
    ...structuredClone(v32Receipt),
    title: 'G4 L3 Whole-Lesson CEO Preview v3.2-r2 Delivery Receipt',
    artifactVersion: 'v3.2-r2',
    packageVariant: 'v3-2-r2',
    artifactRevision: 'r2',
    package: {
      ...structuredClone(v32Receipt.package),
      packageId: 'g4-l3-whole-lesson-package-mvp-v3-2-r2',
      title:
        'G4 L3 Whole-Lesson CEO Preview v3.2-r2 — current JavaScript candidate',
      archive: {
        path:
          'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64.zip',
        sha256: '3'.repeat(64),
      },
    },
    verification: {
      ...structuredClone(v32Receipt.verification),
      smoke: {
        ...structuredClone(v32Receipt.verification.smoke),
        report: {
          path:
            'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json',
        },
        smokeVerifier: {
          implementation: 'primary-package-builder-v3-2-r2',
          postbuildCorrectionUsed: false,
          functionalEntrySelectorIncluded: true,
          keyTermsResolution: 'matched-local-entry',
          compactRootSelector: 'main.lesson-shell2',
          compactPageSelectionMechanism: 'visible-course-map-row',
          browserProfileIsolation:
            'resolved-resume-state-before-each-compact-scenario',
          resumeDecisionBeforeGeometry: 'resolved',
          sessionDecisionOverlayBeforeGeometry: 'closed',
          strictAcceptanceEffect: 'none',
        },
      },
    },
    smokeHarnessRevision: canonicalV32SmokeHarnessRevision(),
  };
  const v32R2Markdown = deliveryMarkdown(v32R2Receipt);
  assert.match(v32R2Markdown, /CEO Preview v3\.2-r2 Delivery Receipt/);
  assert.match(
    v32R2Markdown,
    /Package ID：`g4-l3-whole-lesson-package-mvp-v3-2-r2`/,
  );
  assert.match(
    v32R2Markdown,
    /G4 L3 Whole-Lesson CEO Preview v3\.2-r2 — current JavaScript candidate/,
  );
  assert.match(
    v32R2Markdown,
    /g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64\.zip/,
  );
  assert.match(
    v32R2Markdown,
    /g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke\.json/,
  );
  assert.match(v32R2Markdown, /v3\.2-r2 smoke-harness revision/);
  assert.match(v32R2Markdown, /Change class：`packaging-smoke-harness-only`/);
  assert.match(
    v32R2Markdown,
    /Authored product source changed from v3\.2：`false`/,
  );
  assert.match(
    v32R2Markdown,
    /Frozen v3\.2 attempt status：`superseded-after-primary-smoke-harness-failure`/,
  );
  assert.match(
    v32R2Markdown,
    /Frozen v3\.2 ZIP SHA-256：`5aca39fb8590889d79097fb7c429a370e2b6ac918e21cb73be4e150987ef9447`/,
  );
  assert.match(v32R2Markdown, /v3\.2 package verifier passed：`true`/);
  assert.match(v32R2Markdown, /v3\.2 formal smoke published：`false`/);
  assert.match(v32R2Markdown, /v3\.2 delivery receipt published：`false`/);
  assert.match(
    v32R2Markdown,
    /Product failure established by v3\.2 harness failure：`false`/,
  );
  assert.match(v32R2Markdown, /Predecessor overwritten：`false`/);
  assert.match(v32R2Markdown, /Compact root：`main\.lesson-shell2`/);
  assert.match(v32R2Markdown, /Compact selection：`visible-course-map-row`/);
  assert.match(v32R2Markdown, /Resume decision before geometry：`resolved`/);
  assert.match(v32R2Markdown, /Session overlay before geometry：`closed`/);
  assert.match(
    v32R2Markdown,
    /r2 primary smoke verifier：`primary-package-builder-v3-2-r2`/,
  );
  assert.match(v32R2Markdown, /r2 postbuild correction used：`false`/);
  assert.match(v32R2Markdown, /Strict completion：`0\/40`/);
  assert.match(v32R2Markdown, /Published：`false`/);
  assert.doesNotMatch(v32R2Markdown, /\/(?:Users|Volumes)\//);
});

test('v3.3 delivery Markdown states the non-exhaustive current-JS boundary', () => {
  const receipt = {
    title: 'G4 L3 Whole-Lesson CEO Preview v3.3 Delivery Receipt',
    artifactVersion: 'v3.3',
    packageVariant: 'v3-3',
    generatedAt: '2026-08-01T00:00:00.000Z',
    package: {
      packageId: 'g4-l3-whole-lesson-package-mvp-v3-3',
      title:
        'G4 L3 Whole-Lesson CEO Preview v3.3 — current JavaScript candidate',
      archive: {
        path:
          'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64.zip',
        sha256: '1'.repeat(64),
      },
      manifest: {
        path:
          'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64/package-manifest.json',
        sha256: '2'.repeat(64),
      },
      sourceSnapshot: {
        fileCount: 1300,
        totalBytes: 192000000,
        sha256: '3'.repeat(64),
      },
    },
    verification: {
      smoke: {
        report: {
          path:
            'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json',
        },
        freshExtractedFinalZip: true,
        extractedPackageVerifier: 'pass',
        exactSingleRuntimePages: 39,
        privacyScan: {status: 'pass', filesScanned: 2500},
        page36FrozenV2Parity: {pixelDifferenceCount: 0},
        manualIntegrationScreenshots: [],
        smokeVerifier: {
          implementation: 'primary-package-builder-v3-3',
          postbuildCorrectionUsed: false,
        },
      },
    },
    readabilityEnhancements: {
      animationId: 'course-g04-l03-ts-008',
      source: {sha256: '4'.repeat(64)},
      frameDomain: 'sprite-350',
      frame: 789,
      nativePaddingPixels: 4,
      desktopScale: 2.5,
      crops: [{id: 'step-3'}, {id: 'step-4'}],
      defaultExpanded: true,
      originalLayoutPreserved: true,
      strictAcceptanceEffect: 'none',
      screenshots: [{path: 'output/playwright/readability.png'}],
    },
    controlledCeoPreviewQa: {
      screenshots: [{path: 'output/playwright/controlled.png'}],
    },
    productSourceSuccessorRevision:
      canonicalV33ProductSourceSuccessorRevision(),
    frozenV32R2: {
      archive: structuredClone(V33_FROZEN_PREIMAGES.v32R2Archive),
      archiveChecksum:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2ArchiveChecksum),
      manifest: structuredClone(V33_FROZEN_PREIMAGES.v32R2Manifest),
      payloadChecksums:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2PayloadChecksums),
      smoke: structuredClone(V33_FROZEN_PREIMAGES.v32R2Smoke),
      deliveryReceipt:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2DeliveryReceipt),
      deliveryReport:
        structuredClone(V33_FROZEN_PREIMAGES.v32R2DeliveryReport),
      receiptFingerprintSha256:
        'e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965',
      sourceSnapshot: {
        fileCount: 1264,
        totalBytes: 191299550,
        sha256:
          '7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91',
      },
      unchanged: true,
      overwritten: false,
    },
    frozenV2: {
      archive: {path: 'outputs/v2.zip', sha256: '5'.repeat(64)},
      manifest: {sha256: '6'.repeat(64)},
      unchanged: true,
    },
    frozenTs008GeneratedRenderer: {
      sha256: '7'.repeat(64),
      unchanged: true,
    },
    claimBoundary: {
      externalPostbuildSmokeCorrectionUsed: false,
    },
    receiptFingerprintSha256: '8'.repeat(64),
  };
  const markdown = deliveryMarkdown(receipt);
  assert.match(markdown, /CEO Preview v3\.3 Delivery Receipt/);
  assert.match(
    markdown,
    /Package ID：`g4-l3-whole-lesson-package-mvp-v3-3`/,
  );
  assert.match(markdown, /v3\.3 product-source successor/);
  assert.match(markdown, /Declared product\/verification subset files：`6`/);
  assert.match(
    markdown,
    /Authored product source changed from v3\.2-r2：`true`/,
  );
  assert.match(
    markdown,
    /Full current v3\.3 package-source snapshot bound：`true`/,
  );
  assert.match(
    markdown,
    /Declared batch is the only repository delta：`false`/,
  );
  assert.match(
    markdown,
    /Exhaustive byte delta from v3\.2-r2 established：`false`/,
  );
  assert.match(markdown, /non-exhaustive subset/);
  assert.match(markdown, /primary-package-builder-v3-3/);
  assert.match(markdown, /External postbuild smoke correction used：`false`/);
  assert.match(markdown, /v3\.2-r2 closure unchanged：`true`/);
  assert.match(markdown, /v3\.2-r2 predecessor overwritten：`false`/);
  assert.match(markdown, /current-JavaScript candidate at strict 0\/40/);
  assert.match(markdown, /unpublished/);
  assert.match(markdown, /does not claim Flash fidelity/);
  assert.match(markdown, /Owner acceptance/);
  assert.match(markdown, /public release/);
  assert.match(markdown, /Strict completion：`0\/40`/);
  assert.match(markdown, /Published：`false`/);
  assert.doesNotMatch(markdown, /\/(?:Users|Volumes)\//);

  const r2Receipt = structuredClone(receipt);
  r2Receipt.title =
    'G4 L3 Whole-Lesson CEO Preview v3.3-r2 Delivery Receipt';
  r2Receipt.artifactVersion = 'v3.3-r2';
  r2Receipt.packageVariant = 'v3-3-r2';
  r2Receipt.package.packageId =
    'g4-l3-whole-lesson-package-mvp-v3-3-r2';
  r2Receipt.package.title =
    'G4 L3 Whole-Lesson CEO Preview v3.3-r2 — current JavaScript candidate';
  r2Receipt.package.archive.path =
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64.zip';
  r2Receipt.package.manifest.path =
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64/package-manifest.json';
  r2Receipt.verification.smoke.report.path =
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json';
  r2Receipt.verification.smoke.smokeVerifier.implementation =
    'primary-package-builder-v3-3-r2';
  r2Receipt.qaHarnessRevision =
    structuredClone(V33_R2_QA_HARNESS_REVISION);
  r2Receipt.frozenV33FailedQaAttempt = {
    failureReceipt: {
      path:
        'reports/g4-l3-controlled-ceo-preview-v3-3-failed-attempt.json',
      bytes: 3211,
      sha256:
        '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
    },
  };
  const r2Markdown = deliveryMarkdown(r2Receipt);
  assert.match(r2Markdown, /v3\.3-r2 QA-harness successor/);
  assert.match(r2Markdown, /Change class：`qa-harness-only`/);
  assert.match(r2Markdown, /Formal v3\.3 QA JSON \/ Markdown published：`false`/);
  assert.match(r2Markdown, /Preserved PNG closure：`5` files \/ `876815` bytes/);
  assert.match(r2Markdown, /v3\.3 package published：`false`/);
  assert.match(r2Markdown, /Product failure established：`false`/);
  assert.match(r2Markdown, /Authored product source changed from v3\.3：`false`/);
  assert.match(r2Markdown, /formal QA attempt timed out before JSON\/Markdown publication/);
  assert.match(r2Markdown, /no v3\.3 package was published/);
  assert.match(r2Markdown, /does not establish a product failure/);
  assert.doesNotMatch(r2Markdown, /\/(?:Users|Volumes)\//);

  const r3Receipt = structuredClone(r2Receipt);
  r3Receipt.title =
    'G4 L3 Whole-Lesson CEO Preview v3.3-r3 Delivery Receipt';
  r3Receipt.artifactVersion = 'v3.3-r3';
  r3Receipt.artifactRevision = 'r3';
  r3Receipt.packageVariant = 'v3-3-r3';
  r3Receipt.package.packageId =
    'g4-l3-whole-lesson-package-mvp-v3-3-r3';
  r3Receipt.package.title =
    'G4 L3 Whole-Lesson CEO Preview v3.3-r3 — current JavaScript candidate';
  r3Receipt.package.archive.path =
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64.zip';
  r3Receipt.package.manifest.path =
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64/package-manifest.json';
  r3Receipt.verification.smoke.report.path =
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json';
  r3Receipt.verification.smoke.smokeVerifier.implementation =
    'primary-package-builder-v3-3-r3';
  r3Receipt.smokeHarnessRevision =
    structuredClone(V33_R3_SMOKE_HARNESS_REVISION);
  r3Receipt.frozenV33R2SmokeFailedAttempt = {
    sealedPackage: {
      archive: {
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Archive.path,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Archive.sha256,
      },
      manifest: {
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Manifest.path,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Manifest.sha256,
      },
      payloadChecksums: {
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES
            .v33R2PayloadChecksums.path,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES
            .v33R2PayloadChecksums.sha256,
      },
      archiveChecksum: {
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2ArchiveChecksum.path,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES
            .v33R2ArchiveChecksum.sha256,
      },
      verifier: {status: 'verified'},
    },
    failureReceipt: {
      path:
        'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
      bytes: 8526,
      sha256:
        '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
    },
    isolatedDiagnosticReplay: {
      failingPredicateVector: [
        {animationId: 'course-g04-l03-vb-005'},
        {animationId: 'course-g04-l03-vb-006'},
        {animationId: 'course-g04-l03-rw-003'},
      ],
    },
    successorBoundary: {
      r2FormalSmokePublished: false,
      r2DeliveryReceiptPublished: false,
      r2ArtifactsOverwritten: false,
      productFailureEstablished: false,
    },
    qaAndReadabilityEvidenceReuse: {
      from: 'v3-3-r2',
      readability: {
        json: 'reports/g4-l3-current-js-readability-v3-3-r2.json',
      },
      controlledQa: {
        json: 'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.json',
      },
    },
  };
  r3Receipt.verification.packageCurrentSourceSnapshot =
    'sealed-build-snapshot-plus-exact-delivery-harness-only-successor';
  r3Receipt.verification.currentPackageSourceSnapshotEqualsBuildSnapshot =
    false;
  r3Receipt.verification.currentPackageCheckExpectedOutcome =
    'source-snapshot-drift-rejection';
  r3Receipt.smokeHarnessRevisionBinding = {
    manifestSourceField: 'packageSmokeHarnessRevision',
    receiptField: 'smokeHarnessRevision',
  };
  r3Receipt.deliveryHarnessRevision = {
    failureReceipt: {
      path:
        'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-failed-attempt.json',
      sha256: '9'.repeat(64),
    },
    deliveryAttempt: {
      phase: 'manifest-package-smoke-harness-revision-binding',
    },
    rootCause: {
      classification: 'delivery-verifier-read-wrong-manifest-field',
    },
    preimageRestoration: {
      packageCheckPassed: true,
      outcomeCharacterization: 'hash-bound-recorded-preimage-outcome',
    },
    correctedHarness: {
      exactChangedFileCount: 2,
      scopeSemantics:
        'declared-exact-delivery-harness-files-not-exhaustive-repository-delta',
      exhaustiveOtherCurrentTreeDeltaEstablished: false,
      currentSourceSnapshotByteDelta: 9251,
      authoredProductSourceChanged: false,
      packageBytesChanged: false,
      smokeBytesChanged: false,
    },
    successorBoundary: {
      deliveryHarnessRevision: 'r2',
      sameR3PackageRetained: true,
      productFailureEstablished: false,
      strictAcceptanceEffect: 'none',
    },
    packageBuildSourceSnapshot: {
      fileCount: 1266,
      totalBytes: 191702749,
      sha256: 'a'.repeat(64),
    },
    currentSourceSnapshot: {
      fileCount: 1266,
      totalBytes: 191712000,
      sha256: 'b'.repeat(64),
    },
  };
  const r3Markdown = deliveryMarkdown(r3Receipt);
  assert.match(r3Markdown, /v3\.3-r3 smoke-harness-only successor/);
  assert.match(r3Markdown, /Harness scope：`fresh-unzip-package-smoke`/);
  assert.match(
    r3Markdown,
    /Frozen r2 ZIP SHA-256：`0295d8a174507478a5982071946673d0f5c9d8593894c465f89c92d8a9a41271`/,
  );
  assert.match(r3Markdown, /Failed-smoke receipt bytes：`8526`/);
  assert.match(r3Markdown, /Legacy source-hotspot focus predicates failed：`3`/);
  assert.match(
    r3Markdown,
    /Responsive focus selector：`button\[data-responsive-focus-key="key-terms"\]`/,
  );
  assert.match(r3Markdown, /Arbitrary visible element accepted：`false`/);
  assert.match(r3Markdown, /Source hotspot focus required：`false`/);
  assert.match(
    r3Markdown,
    /RW003 source-stop hold and explicit Resume still required：`true`/,
  );
  assert.match(r3Markdown, /QA\/readability evidence reused from：`v3-3-r2`/);
  assert.match(
    r3Markdown,
    /Authored product source changed from v3\.3-r2：`false`/,
  );
  assert.match(r3Markdown, /r2 formal smoke published：`false`/);
  assert.match(r3Markdown, /r2 delivery receipt published：`false`/);
  assert.match(r3Markdown, /r2 artifacts overwritten：`false`/);
  assert.match(r3Markdown, /Product failure established：`false`/);
  assert.match(r3Markdown, /does not promote current-JavaScript acceptance/);
  assert.match(r3Markdown, /Flash\/original-runtime fidelity/);
  assert.match(r3Markdown, /Owner acceptance/);
  assert.match(r3Markdown, /strict completion/);
  assert.match(r3Markdown, /publication status/);
  assert.match(r3Markdown, /v3\.3-r3 delivery-harness r2 successor/);
  assert.match(
    r3Markdown,
    /Package current-source status：`sealed-build-snapshot-plus-exact-delivery-harness-only-successor`/,
  );
  assert.match(r3Markdown, /Manifest source field：`packageSmokeHarnessRevision`/);
  assert.match(r3Markdown, /Declared scoped delivery-harness files：`2`/);
  assert.match(
    r3Markdown,
    /Exhaustive other current-tree delta established：`false`/,
  );
  assert.match(
    r3Markdown,
    /Current package-source snapshot equals build snapshot：`false`/,
  );
  assert.match(
    r3Markdown,
    /Current package check expected outcome：`source-snapshot-drift-rejection`/,
  );
  assert.match(r3Markdown, /Package bytes changed：`false`/);
  assert.match(r3Markdown, /Smoke bytes changed：`false`/);
  assert.match(r3Markdown, /Same sealed r3 package retained：`true`/);
  assert.doesNotMatch(r3Markdown, /\/(?:Users|Volumes)\//);
});

test('delivery generator binds required v3, evidence, v2, and TS08 artifacts', async () => {
  const [source, packageBuilderSource] = await Promise.all([
    readFile(
      path.join(
        root,
        'scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs',
      ),
      'utf8',
    ),
    readFile(
      path.join(
        root,
        'scripts/build-g4-l3-whole-lesson-package-mvp.mjs',
      ),
      'utf8',
    ),
  ]);
  const deliveryChainSource = `${source}\n${packageBuilderSource}`;
  for (const expected of [
    'g4-l3-whole-lesson-package-mvp-v3-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-smoke.json',
    'reports/g4-l3-current-js-readability-v3.json',
    'reports/g4-l3-controlled-ceo-preview-qa.json',
    'g4-l3-whole-lesson-package-mvp-v2-darwin-arm64.zip',
    'packages/demos/src/modules/course-g04-l03-ts-008.tsx',
    'packages/demos/src/timelines/course-g04-l03-ts-008.ts',
    'public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js',
    'readable-view/readable-view-assets.json',
    'readable-view/frame-789-source.png',
    'V3_FROZEN_PREIMAGES',
    'assertV3FrozenPreimages',
    'validateV3ReadabilityReport',
    'g4-l3-whole-lesson-package-mvp-v3-1-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3.1 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-1-smoke.json',
    'reports/g4-l3-current-js-readability-v3-1.json',
    'reports/g4-l3-controlled-ceo-preview-v3-1-qa.json',
    'reports/g4-l3-v31-post-v3-current-js-regression.json',
    'reports/g4-l3-v31-post-v3-source-inventory.json',
    'reports/g4-l3-v31-post-v3-browser-qa.json',
    'outputs/g4-l3-v31-post-v3-current-js-regression.md',
    'V31_FROZEN_PREIMAGES',
    'assertV31FrozenPreimages',
    'validateBrowserReportStructure',
    'validateSourceInventoryDocument',
    'g4-l3-whole-lesson-package-mvp-v3-2-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3.2 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-smoke.json',
    'reports/g4-l3-current-js-readability-v3-2.json',
    'reports/g4-l3-controlled-ceo-preview-v3-2-qa.json',
    'V32_FROZEN_PREIMAGES',
    'assertV32FrozenPreimages',
    'http://127.0.0.1:3218',
    'matched-local-entry',
    'primary-package-builder',
    'compactLandscape',
    'frozenV31',
    'g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3.2-r2 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json',
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2-r2',
    'g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64',
    'g4-l3-whole-lesson-package-mvp-v3-2-r2',
    'G4 L3 Whole-Lesson CEO Preview v3.2-r2 — current JavaScript candidate',
    'V32_FAILED_SMOKE_ATTEMPT_PREIMAGES',
    'V32_R2_FROZEN_PREIMAGES',
    'assertV32R2FrozenPreimages',
    'assertV32SmokeHarnessRevision',
    'primary-package-builder-v3-2-r2',
    'visible-course-map-row',
    '5aca39fb8590889d79097fb7c429a370e2b6ac918e21cb73be4e150987ef9447',
    'b3f0c106de9b0da905f993c5a971211e6ef1bd4a550fa67fb899bd12c0450a34',
    '50374e80726d9c9eb6db21becfdfa31f530c8044e67e68f17caba8a975d520c0',
    '72e38bc2a03f6528d68daf10844e4b2da8920b18255613258ed442a9b9d42cf4',
    'ef4bab3904eb1c7030486d9b7dc3ed66bcc733eaa5881ca461ae9caee71ed5e7',
    'g4-l3-whole-lesson-package-mvp-v3-3-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3.3 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json',
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3',
    'reports/g4-l3-current-js-readability-v3-3.json',
    'reports/g4-l3-controlled-ceo-preview-v3-3-qa.json',
    'http://127.0.0.1:3219',
    'V33_FROZEN_PREIMAGES',
    'V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH',
    'assertV33FrozenPreimages',
    'assertV33ProductSourceSuccessorRevision',
    'collectFrozenV32R2Closure',
    'productSourceSuccessorRevision',
    'primary-package-builder-v3-3',
    'g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3.3-r2 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json',
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r2',
    'reports/g4-l3-current-js-readability-v3-3-r2.json',
    'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.json',
    'reports/g4-l3-controlled-ceo-preview-v3-3-failed-attempt.json',
    'V33_FAILED_QA_ATTEMPT_PREIMAGES',
    'V33_R2_FROZEN_PREIMAGES',
    'V33_R2_QA_HARNESS_REVISION',
    'assertV33R2FrozenPreimages',
    'assertV33R2QaHarnessRevision',
    'frozenV33FailedQaAttempt',
    'qaHarnessRevision',
    'primary-package-builder-v3-3-r2',
    '3b65a041d823e615aab11b1e89018d5af71fa38c5454dc351ed0b15f2ef29c10',
    '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
    'g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery',
    'G4 L3 Whole-Lesson CEO Preview v3.3-r3 Delivery Receipt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery.json',
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-report.md',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json',
    'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r3',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
    'V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES',
    'V33_R3_FROZEN_PREIMAGES',
    'V33_R3_SMOKE_HARNESS_REVISION',
    'assertV33R3FrozenPreimages',
    'assertV33R3SmokeHarnessRevision',
    'validateV33R2SmokeFailedAttemptDocument',
    'collectFrozenV33R2SmokeFailedAttempt',
    'frozenV33R2SmokeFailedAttempt',
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-failed-attempt.json',
    'V33_R3_DELIVERY_HARNESS_PREIMAGES',
    'validateV33R3DeliveryFailedAttemptDocument',
    'collectV33R3DeliveryHarnessRevision',
    'deliveryHarnessRevision',
    'sealed-build-snapshot-plus-exact-delivery-harness-only-successor',
    'packageSmokeHarnessRevision',
    'qaAndReadabilityEvidenceReusedFrom',
    'primary-package-builder-v3-3-r3',
    '0295d8a174507478a5982071946673d0f5c9d8593894c465f89c92d8a9a41271',
    'a0f366e66c82b542fe9b226d0a2f6800e765e3435ea91e5e2c3ef60dee073c55',
    '4fd4e52794f6dc8910bd60dfd91eca8bde96cb49b9cc47f216e461ab419fedee',
    '306e24152cc03132bc6c8ea0b2ea4ed005fd1af58806ace0a4cdbece16b10eb1',
    '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
    '1768ae2055931f1c351f13da31a72ff96ef332f3bebaefff35c1df1fd6228d33',
    '3e9b48cef2e50992de203c8482b22d7ae9c1d846c63cc16b7f5ef69e7000a5e2',
    '8579e22cd961cee40f4af9a8b2aa320b1ed70c4d29f6832340b71a2c20a7a63d',
    'cea30a97e6f052ac82d1dcc92b15d74da2b8b7eb55eb23b4ed56a1f332bb5477',
    'eabd3ce08cca9163c318cf26834fa153d9e27db082a4c916391735c87fee6241',
    '9c0bc8ee967ec29d7d3a2d91f890188c622774d4b2f880cbef9295f389e12e68',
    '2785d2ee2708312a78aec41c6f860c9321827649a4d12072a8a0bbb29b70dc1d',
    'e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965',
    '7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91',
  ]) {
    assert.ok(deliveryChainSource.includes(expected), expected);
  }
  assert.match(source, /freshExtractedFinalZip !== true/);
  assert.match(source, /postSmokePackageCheck\?\.status !== 'pass'/);
  assert.match(source, /historicalReceipt: receipt/);
  assert.match(source, /requireCurrentSource: false/);
  assert.match(source, /if \(requireCurrentSource\)/);
  assert.match(source, /frozenClosure: true/);
  assert.match(source, /frozenV2FreshExtractedFinalZip !== true/);
  assert.match(source, /page36FrozenV2Parity/);
  assert.match(source, /pixelDifferenceCount !== 0/);
  assert.match(source, /secondRuntimeInV3PlayerDom/);
  assert.match(source, /secondRuntimeInCandidatePlayerDom/);
  assert.match(source, /candidateWholeLessonObservation/);
  assert.match(source, /candidateRgbaSha256/);
  assert.match(source, /comparisonTopology\?\.candidateVersion/);
  assert.match(source, /stableJson\(parity\?\.candidate\)/);
  assert.match(source, /parity\?\.v3 !== undefined/);
  assert.match(source, /runtimeObservations\.length !== 39/);
  assert.match(source, /pageTraversal\?\.exactManifestOrder !== true/);
  assert.match(source, /pageTraversal\?\.exactRealCourseMap !== true/);
  assert.match(source, /page36ReadableView\?\.passed !== true/);
  assert.match(source, /functionalObservations\?\.length !== 11/);
  assert.match(source, /keyTermsHostInteractions\?\.length !== 3/);
  assert.match(source, /navigation\?\.sectionFirstPage\?\.passed !== true/);
  assert.match(source, /navigation\?\.courseMap\?\.passed !== true/);
  assert.match(source, /smoke\.page36ReadableView\?\.layouts/);
  assert.match(source, /privacyScan\?\.status !== 'pass'/);
  assert.match(source, /buildCurrentPackageInputSnapshot/);
  assert.match(source, /assertPackageInputSnapshotCurrent/);
  assert.match(source, /open\(absolutePath, 'wx', 0o444\)/);
  assert.match(source, /Immutable delivery output already exists/);
  assert.match(source, /strictCompleteMembers: 0/);
  assert.match(source, /publicRelease: false/);
  assert.match(source, /published: false/);
  assert.match(source, /declaredFunctionalPageInventoryComplete: true/);
  assert.match(source, /declaredFunctionalMarkersObserved: true/);
  assert.match(source, /functionalInteractionCompletenessEstablished: false/);
  assert.match(source, /fullCurrentV31SourceInventoryBound: true/);
  assert.match(source, /exhaustiveByteDeltaFromV3Established: false/);
  assert.match(source, /strictAcceptanceEffect: 'none'/);
  assert.match(source, /assertRegressionReceiptFingerprint/);
  assert.match(source, /postbuildCorrectionUsed !== false/);
  assert.match(source, /report\?\.smokeRunnerCorrection !== undefined/);
  assert.match(source, /knownCompactLandscapeBatch\?\.fileCount/);
  assert.match(source, /exhaustiveByteDeltaFromV31Established !== false/);
  assert.match(source, /authoredProductSourceChangedFromV32R2 !== true/);
  assert.match(source, /fullCurrentV33PackageSourceSnapshotBound !== true/);
  assert.match(source, /declaredBatchIsTheOnlyRepositoryDelta !== false/);
  assert.match(source, /exhaustiveByteDeltaFromV32R2Established !== false/);
  assert.match(source, /externalPostbuildSmokeCorrectionUsed: false/);
  assert.match(source, /manifest\?\.packageSmokeHarnessRevision/);
  assert.match(source, /deliveryHarnessOnlySuccessor: true/);
  assert.match(source, /packageCurrentSourceSnapshotStillExact: false/);
  assert.match(source, /packageBuildSourceSnapshotPreserved: true/);
  assert.match(source, /only read-only --check is allowed/);
  assert.match(source, /legacy credentials and personal records/);
  assert.doesNotMatch(source, /--publish|--owner-accept|--strict-complete/);
});
