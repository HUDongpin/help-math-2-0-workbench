import assert from "node:assert/strict";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {writeCreateExclusiveArtifacts} from
  "./build-g5-l4-current-js-deep-qa-successors.mjs";

import {
  CURRENT_SOURCE_SNAPSHOT,
  KNOWN_REMEDIATIONS_REQUIRED,
  V6_PACKAGE_SOURCE_SNAPSHOT,
  validateFqDeepQaSuccessor,
  validateFailedRawDeepQaAttempt,
  validateRawDeepQaReport,
  validateWholeLessonDeepQaSuccessor,
} from "./lib/g5-l4-current-js-deep-qa-successor.mjs";

const SHA = "a".repeat(64);

function binding(path) {
  return {path, bytes: 1, sha256: SHA};
}

function acceptanceEffects() {
  return {
    productQaComplete: false,
    migrationQaComplete: false,
    authoritativeOriginalRuntime: false,
    naturalNavigationCausalityEstablished: false,
    spanishSourceVisualParityEstablished: false,
    audioAccepted: false,
    fullFrameRmseAccepted: false,
    independentHumanVisualReviewAccepted: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    externalDeploymentAuthorized: false,
    publicReleaseAuthorized: false,
    published: false,
  };
}

function rawAcceptanceEffects() {
  return {
    authoritativeOriginalRuntimeAccepted: false,
    originalRuntimeFullFrameAccepted: false,
    originalRuntimeNaturalTraversalAccepted: false,
    audioAccepted: false,
    humanAudioAccepted: false,
    humanVisualAccepted: false,
    rmseAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    lessonStrictComplete: false,
    publicReleaseAuthorized: false,
    published: false,
  };
}

function freshClaims() {
  return {
    exactReleaseOrder: true,
    mapInteractionFreshlyReperformed: true,
    mapDifferentPageFocusPassed: true,
    mapSamePageReselectFocusPassed: false,
    keyTerms: true,
    fq: true,
    persistence: true,
  };
}

function assertionCounts() {
  return {
    layout: {observations: 648, passed: 648, failed: 0},
    identity: {observations: 648, passed: 648, failed: 0},
    overflow: {observations: 648, passed: 648, failed: 0},
    reducedMotion: {rows: 108, samples: 324, failed: 0},
    replay: {activations: 324, passed: 324, failed: 0},
  };
}

function rawAssertionCounts() {
  return {
    layout: {passed: 648, failed: 0},
    identity: {passed: 648, failed: 0},
    overflow: {passed: 648, failed: 0},
    reducedMotionObservations: {passed: 108, failed: 0},
    reducedMotionSamples: {passed: 324, failed: 0},
    replayActivations: {passed: 324, failed: 0},
    mapCore: {passed: 4, failed: 0},
    mapSamePageReselectFocus: {passed: 0, failed: 4},
    keyTerms: {passed: 4, failed: 0},
    fq: {passed: 4, failed: 0},
    persistence: {passed: 2, failed: 0},
  };
}

function rawFreshClaims() {
  return {
    deepQaFreshlyPerformed: true,
    freshUnzip: true,
    packageVerifierBeforeAndAfter: true,
    dynamicLoopbackServer: true,
    exactReleaseOrder: true,
    layout: true,
    reducedMotion: true,
    replayMouseEnterSpace: true,
    mapCore: true,
    mapDifferentPageFocus: true,
    mapSameCurrentPageReselectFocus: false,
    map: false,
    keyTerms: true,
    fq: true,
    persistence: true,
    directUrlBoundary: true,
    perPageDirectUrl: false,
    networkBoundary: true,
    currentJavascriptDeepQaMatrixComplete: true,
    machineWorkExhausted: false,
    productQaComplete: false,
    migrationQaComplete: false,
  };
}

function rawFixture() {
  return {
    schemaVersion: 1,
    reportType:
      "g5-l4-v6-fresh-unzip-deep-current-javascript-product-qa",
    reportId:
      "g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r4",
    packageId: "g5-l4-whole-lesson-package-mvp-v6",
    status: "observed-current-javascript-deep-qa-remediations-required",
    authorityBoundary: {
      evidenceLayer: "current-javascript-machine-product-qa-only",
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      originalRuntimeAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      publicationAuthority: false,
    },
    releaseBoundary: {
      releaseId: "lesson-g05-l04-number-lines",
      activePages: 54,
      courseShells: 1,
      expectedMembers: 55,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
    },
    sourceObservation: {
      packageSnapshot: V6_PACKAGE_SOURCE_SNAPSHOT,
      currentSnapshot: CURRENT_SOURCE_SNAPSHOT,
      sourceCurrentAtObservation: false,
      delta: {fileCount: 0, totalBytes: 96, sha256Changed: true},
      driftReason:
        "The G4 v3.1 build automatically added two generated type paths to apps/web/tsconfig.json (+96 bytes); the immutable fresh-unzip v6 package remains the QA runtime subject.",
      qaRuntimeSource: "fresh-unzip-immutable-v6-package",
      currentWorkspaceSourceUsedToServeQa: false,
      acceptanceEffect: "none",
    },
    freshClaims: rawFreshClaims(),
    assertionCounts: rawAssertionCounts(),
    knownRemediationsRequired: [...KNOWN_REMEDIATIONS_REQUIRED],
    remediationFindings: KNOWN_REMEDIATIONS_REQUIRED.map((summary) => ({
      summary,
      observed: true,
    })),
    failures: [...KNOWN_REMEDIATIONS_REQUIRED],
    scopeResult: {
      productQaComplete: false,
      migrationQaComplete: false,
    },
    acceptanceEffects: rawAcceptanceEffects(),
  };
}

function failedR3Fixture() {
  const fixture = rawFixture();
  fixture.reportId = undefined;
  fixture.status = "fail-current-javascript-deep-qa";
  fixture.freshClaims.layout = false;
  fixture.freshClaims.networkBoundary = false;
  fixture.freshClaims.currentJavascriptDeepQaMatrixComplete = false;
  fixture.assertionCounts.layout = {passed: 647, failed: 1};
  fixture.assertionCounts.identity = {passed: 647, failed: 1};
  fixture.assertionCounts.overflow = {passed: 647, failed: 1};
  fixture.failures = [
    "layout en/mobile-portrait/course-g05-l04-vb-004: layout assertion failed",
    "support es/mobile-portrait: failed request: http://127.0.0.1:49815/generated/g5-l4-elementary-keyterms-reference-es.json net::ERR_ABORTED",
  ];
  return fixture;
}

function common(kind) {
  return {
    schemaVersion: 3,
    evidenceType: `g5-l4-current-js-${kind}-deep-qa-successor-receipt`,
    receiptId: `g5-l4-current-js-${kind}-qa-successor-2026-08-01-r5`,
    releaseId: "lesson-g05-l04-number-lines",
    status: "observed-current-javascript-deep-qa-remediations-required",
    evidenceAssembledOn: "2026-08-01",
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      packageId: "g5-l4-whole-lesson-package-mvp-v6",
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
    packageEvidence: {
      packageId: "g5-l4-whole-lesson-package-mvp-v6",
      packageSourceSnapshot: V6_PACKAGE_SOURCE_SNAPSHOT,
      currentSourceSnapshot: CURRENT_SOURCE_SNAPSHOT,
      sourceCurrentAtObservation: false,
      sourceDrift: {
        changedPath: "apps/web/tsconfig.json",
        totalBytesDelta: 96,
        explanation:
          "The G4 v3.1 build automatically added two generated type paths to apps/web/tsconfig.json (+96 bytes); the immutable fresh-unzip v6 package remains the QA runtime subject.",
      },
    },
    predecessorEvidence: {
      receipt: binding(
        `reports/g5-l4-current-js-${kind}-qa-successor-2026-08-01-r4.json`,
      ),
      markdown: binding(
        `reports/g5-l4-current-js-${kind}-qa-successor-2026-08-01-r4.md`,
      ),
      immediatePredecessor: true,
      currentAuthority: false,
      claimsCarriedForward: false,
    },
    rawDeepQaEvidence: {
      report: binding(
        "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r4.json",
      ),
      markdown: binding(
        "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r4.md",
      ),
      runner: binding("scripts/qa-g5-l4-v6-deep-product.mjs"),
      runnerTest: binding("scripts/qa-g5-l4-v6-deep-product.test.mjs"),
      freshClaims: freshClaims(),
      assertionCounts: assertionCounts(),
      failedAttempts: [
        {
          report: binding(
            "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1.json",
          ),
          markdown: binding(
            "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1.md",
          ),
          status: "fail-current-javascript-deep-qa-execution",
          failure:
            "Replay session storage key lookup used the wrong prefix before r2 correction.",
          generatorCurrentAtSuccessorAssembly: false,
          currentAuthority: false,
          claimsCarriedForward: false,
          strictAcceptanceEffect: "none",
        },
        {
          report: binding(
            "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r2.json",
          ),
          markdown: binding(
            "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r2.md",
          ),
          status: "fail-current-javascript-deep-qa",
          failure:
            "Map-core classification and an expected navigation-aborted renderer request prevented observed-remediations status before r3 correction.",
          generatorCurrentAtSuccessorAssembly: false,
          currentAuthority: false,
          claimsCarriedForward: false,
          strictAcceptanceEffect: "none",
        },
        {
          report: binding(
            "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r3.json",
          ),
          markdown: binding(
            "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r3.md",
          ),
          status: "fail-current-javascript-deep-qa",
          failure:
            "A transient VB004 mobile layout sample and an aborted Spanish Key Terms reference request prevented observed-remediations status before r4 correction.",
          generatorCurrentAtSuccessorAssembly: false,
          currentAuthority: false,
          claimsCarriedForward: false,
          strictAcceptanceEffect: "none",
        },
      ],
    },
    knownRemediationsRequired: [...KNOWN_REMEDIATIONS_REQUIRED],
    sourceBindings: [],
    artifacts: [],
    acceptanceEffects: acceptanceEffects(),
  };
}

function fqFixture() {
  return {
    ...common("fq23-companion"),
    scope: {
      ...common("fq23-companion").scope,
      members: ["course-g05-l04-fq-002", "course-g05-l04-fq-003"],
    },
    scopeResult: {
      currentJavascriptFq23DeepQaFreshlyPerformed: true,
      deepQaFreshlyPerformed: true,
      exactReleaseOrderFreshlyEstablished: true,
      fqInteractionFreshlyReperformed: true,
      currentJavascriptDeepProductQaMachineWorkExhausted: false,
      predecessorClaimsCarriedForward: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
  };
}

function wholeFixture() {
  return {
    ...common("whole-lesson-product"),
    scope: {
      ...common("whole-lesson-product").scope,
      releaseMembers: 55,
      activePages: 54,
      courseShells: 1,
    },
    childReceipts: [binding(
      "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.json",
    )],
    scopeResult: {
      deepQaFreshlyPerformed: true,
      exactReleaseOrderFreshlyEstablished: true,
      layoutAssertionsFreshlyPassed: true,
      reducedMotionAssertionsFreshlyPassed: true,
      replayAssertionsFreshlyPassed: true,
      courseMapInteractionFreshlyReperformed: true,
      mapDifferentPageFocusPassed: true,
      mapSamePageReselectFocusPassed: false,
      keyTermsInteractionFreshlyReperformed: true,
      fqInteractionFreshlyReperformed: true,
      crossLocalePersistenceFreshlyReperformed: true,
      predecessorClaimsCarriedForward: false,
      currentJavascriptDeepProductQaMachineWorkExhausted: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
  };
}

test("raw deep-QA validation locks the source drift and fresh assertion counts", () => {
  assert.equal(validateRawDeepQaReport(rawFixture()), true);
  for (const mutate of [
    (candidate) => { candidate.sourceObservation.sourceCurrentAtObservation = true; },
    (candidate) => { candidate.sourceObservation.delta.totalBytes = 0; },
    (candidate) => { candidate.assertionCounts.layout.passed = 647; },
    (candidate) => { candidate.assertionCounts.reducedMotionObservations.failed = 1; },
    (candidate) => { candidate.assertionCounts.replayActivations.passed = 323; },
    (candidate) => { candidate.freshClaims.mapCore = false; },
    (candidate) => { candidate.knownRemediationsRequired.pop(); },
    (candidate) => { candidate.acceptanceEffects.strictComplete = true; },
  ]) {
    const forged = structuredClone(rawFixture());
    mutate(forged);
    assert.throws(() => validateRawDeepQaReport(forged));
  }
});

test("r3 remains an immutable failed attempt and cannot become r4 evidence", () => {
  assert.equal(validateFailedRawDeepQaAttempt(failedR3Fixture(), 3), true);
  const forged = failedR3Fixture();
  forged.assertionCounts.layout = {passed: 648, failed: 0};
  assert.throws(() => validateFailedRawDeepQaAttempt(forged, 3));
});

test("r5 successor validators require r4 as the immediate predecessor", () => {
  assert.equal(validateFqDeepQaSuccessor(fqFixture()), true);
  assert.equal(validateWholeLessonDeepQaSuccessor(wholeFixture()), true);
  for (const [fixture, validate] of [
    [fqFixture, validateFqDeepQaSuccessor],
    [wholeFixture, validateWholeLessonDeepQaSuccessor],
  ]) {
    for (const mutate of [
      (candidate) => { candidate.predecessorEvidence.immediatePredecessor = false; },
      (candidate) => {
        candidate.predecessorEvidence.receipt.path =
          candidate.predecessorEvidence.receipt.path.replace("-r4", "-r3");
      },
      (candidate) => { candidate.predecessorEvidence.claimsCarriedForward = true; },
      (candidate) => { candidate.packageEvidence.sourceCurrentAtObservation = true; },
      (candidate) => { candidate.scopeResult.productQaComplete = true; },
      (candidate) => { candidate.scopeResult.migrationQaComplete = true; },
      (candidate) => {
        candidate.scopeResult.currentJavascriptDeepProductQaMachineWorkExhausted = true;
      },
      (candidate) => { candidate.acceptanceEffects.ownerFidelityAccepted = true; },
      (candidate) => { candidate.knownRemediationsRequired.shift(); },
    ]) {
      const forged = fixture();
      mutate(forged);
      assert.throws(() => validate(forged));
    }
  }
});

test("whole-lesson r5 cannot demote any freshly established deep-QA claim", () => {
  for (const key of [
    "exactReleaseOrderFreshlyEstablished",
    "layoutAssertionsFreshlyPassed",
    "reducedMotionAssertionsFreshlyPassed",
    "replayAssertionsFreshlyPassed",
    "courseMapInteractionFreshlyReperformed",
    "mapDifferentPageFocusPassed",
    "keyTermsInteractionFreshlyReperformed",
    "fqInteractionFreshlyReperformed",
    "crossLocalePersistenceFreshlyReperformed",
  ]) {
    const forged = wholeFixture();
    forged.scopeResult[key] = false;
    assert.throws(() => validateWholeLessonDeepQaSuccessor(forged), key);
  }
});

test("the r5 writer is create-exclusive and never overwrites an existing receipt", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-r5-successor-test-"));
  const outputs = {
    fq: {
      jsonPath: "reports/fq.json",
      jsonBytes: Buffer.from("fq-json\n"),
      markdownPath: "reports/fq.md",
      markdownBytes: Buffer.from("fq-md\n"),
    },
    whole: {
      jsonPath: "reports/whole.json",
      jsonBytes: Buffer.from("whole-json\n"),
      markdownPath: "reports/whole.md",
      markdownBytes: Buffer.from("whole-md\n"),
    },
  };
  try {
    await writeCreateExclusiveArtifacts(root, outputs);
    assert.equal(
      await readFile(path.join(root, outputs.whole.jsonPath), "utf8"),
      "whole-json\n",
    );
    await assert.rejects(
      writeCreateExclusiveArtifacts(root, outputs),
      /never overwritten/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
