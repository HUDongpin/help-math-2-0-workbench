import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import test from "node:test";

import {
  ANIMATION_ID,
  ARTIFACT_TYPE,
  AUTHORITY_BOUNDARY,
  CAPTURE_FRAMES,
  OUTPUT_ROOT,
  STAGE,
  buildDiagnosticIdentity,
  checkStoredArtifact,
  loadAndValidateInputs,
  parseArguments,
  validateCaptureManifestShape,
} from "./capture-g4-l10-vb003-current-js-engineering-diagnostic-v1.mjs";

function fixtureManifest() {
  return {
    schemaVersion: 1,
    artifactType: ARTIFACT_TYPE,
    animationId: ANIMATION_ID,
    status: "pass",
    classification: AUTHORITY_BOUNDARY.classification,
    acceptanceEffect: "none",
    coverageAdoptionAttempted: false,
    formalCoverageMutation: false,
    formalCapturedFrameCountEffect: 0,
    authorityBoundary: {...AUTHORITY_BOUNDARY},
    capturePlan: {
      frames: [...CAPTURE_FRAMES],
      nativeStage: {...STAGE},
      backingStage: {width: STAGE.width, height: STAGE.height},
      deviceScaleFactor: 1,
      frameDomain: "sprite-120",
      frameDomainCount: 203,
      rootFrameCount: 10,
      rootPlacementFrame: 6,
    },
    captures: CAPTURE_FRAMES.map((frame) => ({
      frame,
      file: `frame-${String(frame).padStart(4, "0")}.png`,
      width: 800,
      height: 600,
      opaquePixelCount: 480000,
      identityVerified: true,
      authorityBoundaryVerified: true,
      stableBeforeAfter: true,
      sha256: "a".repeat(64),
      rgbaSha256: "b".repeat(64),
      observationSha256: "c".repeat(64),
    })),
    currentJavascriptSequence: {
      comparisonMethod: "full-canvas-rgba-byte-equality",
      frameCount: 203,
      comparedConsecutivePairCount: 202,
      byteIdenticalToPreviousFrameCount: 55,
      changedFromPreviousFrameCount: 147,
      uniqueRgbaRasterCount: 148,
      byteIdenticalToFrameOneCount: 3,
      transitionStartFrames: Array.from({length: 147}, (_, index) => index + 2),
      consecutivePairs: Array.from({length: 202}, (_, index) => ({
        leftFrame: index + 1,
        rightFrame: index + 2,
      })),
    },
    formalState: {
      coverageAdoptionAttempted: false,
      formalCoverageMutation: false,
      formalCapturedFrameCountEffect: 0,
      registryPresenceCount: 0,
      completionLedgerEntryPresent: false,
      completionLedgerStatus: "preserved",
      releaseMemberStatus: "missing",
      releaseStrictCompleteCount: 0,
      releaseMissingCount: 47,
      releasePublished: false,
      releaseGateOpen: false,
      formalNestedEnTrace: {
        status: "unresolved",
        orderedStepCount: 0,
        executionReport: null,
      },
    },
    browserDiagnostics: {
      consoleErrors: [],
      consoleWarnings: [],
      pageErrors: [],
      failedRequests: [],
      httpErrors: [],
      unexpectedRequests: [],
    },
    assertions: [{id: "fixture", pass: true}],
  };
}

test("VB003 diagnostic CLI is generate/check/help only", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--accept"]), /Unknown option/);
  assert.throws(() => parseArguments(["--output", "/tmp/x"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--check", "--help"]),
    /may not be combined/,
  );
});

test("VB003 diagnostic identity is local-only and distinct from formal coverage", () => {
  const identity = buildDiagnosticIdentity();
  assert.equal(identity.requirementId, "diagnostic-current-js-vb003-source-static-en-v1");
  assert.equal(identity.traceId, "diagnostic-current-js-vb003-sprite-120-v1");
  assert.equal(identity.entryStateSha256, "a06bc7185a99c30ce0aec6c82990e90dcf3b3cc160274b7e4af3373105767ad6");
  assert.equal(identity.entryStateDescriptorBytes, 598);
  assert.equal(identity.frameDomain, "sprite-120");
  assert.equal(identity.scenario, "source-static-frame");
  assert.equal(identity.language, "en");
  assert.equal(identity.seed, 0);
  assert.equal(identity.entryStateDescriptor.sourceHostStateEstablished, false);
  assert.equal(
    identity.entryStateDescriptor.originalRuntimeEntryStateEstablished,
    false,
  );
  assert.notEqual(
    identity.requirementId,
    "req:sprite-120:source-proven-independent-domain-entry-unresolved:en",
  );
  assert.notEqual(
    identity.entryStateSha256,
    "a2ba7802bded99336ca0c6a8b3db9a8309c0fe8f5ef0dec213482387ed739cdf",
  );
});

test("VB003 input closure keeps candidate, coverage, registries, and ledgers fail-closed", async () => {
  const current = await loadAndValidateInputs();
  assert.equal(current.candidateManifest.animationId, ANIMATION_ID);
  assert.equal(current.sequence.frameCount, 203);
  assert.equal(current.sequence.changedFromPreviousFrameCount, 147);
  assert.equal(current.formalState.formalCapturedFrameCountEffect, 0);
  assert.equal(current.formalState.registryPresenceCount, 0);
  assert.equal(current.formalState.completionLedgerEntryPresent, false);
  assert.equal(current.formalState.completionLedgerStatus, "preserved");
  assert.equal(current.formalState.releaseMemberStatus, "missing");
  assert.equal(current.formalState.releaseStrictCompleteCount, 0);
  assert.equal(current.formalState.releaseMissingCount, 47);
  assert.equal(current.formalState.releasePublished, false);
  assert.equal(current.formalState.releaseGateOpen, false);
  assert.equal(current.formalState.formalNestedEnTrace.status, "unresolved");
  assert.equal(current.formalState.formalNestedEnTrace.orderedStepCount, 0);
  assert.equal(current.formalState.formalNestedEnTrace.executionReport, null);
});

test("VB003 capture manifest requires all 203 frames and rejects authority promotion", () => {
  const valid = fixtureManifest();
  assert.equal(validateCaptureManifestShape(valid), true);

  const missing = structuredClone(valid);
  missing.captures.pop();
  assert.throws(
    () => validateCaptureManifestShape(missing),
    /invalid, missing, duplicate, or non-contiguous/,
  );

  const duplicate = structuredClone(valid);
  duplicate.captures[1].frame = 1;
  assert.throws(
    () => validateCaptureManifestShape(duplicate),
    /invalid, missing, duplicate, or non-contiguous/,
  );

  const promoted = structuredClone(valid);
  promoted.authorityBoundary.ownerAcceptance = true;
  assert.throws(
    () => validateCaptureManifestShape(promoted),
    /promoted ownerAcceptance/,
  );

  const adopted = structuredClone(valid);
  adopted.formalCapturedFrameCountEffect = 203;
  assert.throws(
    () => validateCaptureManifestShape(adopted),
    /formal effect changed/,
  );

  const browserFailure = structuredClone(valid);
  browserFailure.browserDiagnostics.consoleWarnings.push({text: "warning"});
  assert.throws(
    () => validateCaptureManifestShape(browserFailure),
    /browser or network failure/,
  );
});

test(
  "VB003 immutable 204-file current-JS diagnostic rehashes and reproduces its full sequence",
  {skip: !existsSync(OUTPUT_ROOT)},
  async () => {
    const checked = await checkStoredArtifact();
    assert.equal(checked.status, "pass");
    assert.equal(checked.captureCount, 203);
    assert.equal(checked.fileCount, 204);
    assert.ok(checked.totalPngBytes > 0);
    assert.deepEqual(checked.currentJavascriptSequence, {
      changedFromPreviousFrameCount: 147,
      byteIdenticalToPreviousFrameCount: 55,
      uniqueRgbaRasterCount: 148,
    });
    assert.equal(checked.formalCapturedFrameCountEffect, 0);
    assert.equal(checked.authorityBoundary.currentJavascriptCandidateOnly, true);
    assert.equal(checked.authorityBoundary.authoritativeOriginalRuntime, false);
    assert.equal(checked.authorityBoundary.rmseAcceptance, false);
    assert.equal(checked.authorityBoundary.strictMigrationCompletion, false);
    assert.equal(checked.authorityBoundary.atomicLessonPublication, false);
  },
);
