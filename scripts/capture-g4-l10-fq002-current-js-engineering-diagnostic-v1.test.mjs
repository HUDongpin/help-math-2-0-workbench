import assert from "node:assert/strict";
import test from "node:test";

import {
  ANIMATION_ID,
  ARTIFACT_TYPE,
  AUTHORITY_BOUNDARY,
  CAPTURE_FRAMES,
  checkStoredArtifact,
  buildDiagnosticIdentity,
  parseArguments,
  validateCaptureManifestShape,
} from "./capture-g4-l10-fq002-current-js-engineering-diagnostic-v1.mjs";

test("diagnostic CLI exposes only generate, check, and help", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--accept"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--output", "/tmp/example"]),
    /Unknown option/,
  );
  assert.throws(
    () => parseArguments(["--check", "--help"]),
    /may not be combined/,
  );
});

test("diagnostic identity is explicit, complete, and acceptance-neutral", () => {
  const identity = buildDiagnosticIdentity();
  assert.match(identity.requirementId, /^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
  assert.match(identity.traceId, /^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
  assert.match(identity.entryStateSha256, /^[a-f0-9]{64}$/);
  assert.equal(identity.frameDomain, "sprite-823");
  assert.equal(identity.scenario, "source-static-frame");
  assert.equal(identity.language, "en");
  assert.equal(identity.seed, 0);
  assert.equal(identity.entryStateDescriptor.animationId, ANIMATION_ID);
  assert.equal(
    identity.entryStateDescriptor.originalRuntimeEntryStateEstablished,
    false,
  );
  assert.equal(identity.entryStateDescriptor.strictAcceptanceEffect, "none");
});

test("authority boundary keeps every acceptance and release claim false", () => {
  assert.equal(AUTHORITY_BOUNDARY.currentJavascriptCandidateOnly, true);
  assert.equal(AUTHORITY_BOUNDARY.acceptanceEffect, "none");
  for (const [key, value] of Object.entries(AUTHORITY_BOUNDARY)) {
    if (
      ["classification", "acceptanceEffect", "currentJavascriptCandidateOnly"].includes(
        key,
      )
    ) {
      continue;
    }
    assert.equal(value, false, `${key} must remain false`);
  }
});

test("manifest validator rejects promoted authority and an incomplete frame set", () => {
  const identity = buildDiagnosticIdentity();
  const cleanDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  const base = {
    schemaVersion: 1,
    artifactType: ARTIFACT_TYPE,
    animationId: ANIMATION_ID,
    status: "pass",
    classification: AUTHORITY_BOUNDARY.classification,
    acceptanceEffect: "none",
    authorityBoundary: AUTHORITY_BOUNDARY,
    capturePlan: {
      frames: CAPTURE_FRAMES,
      nativeStage: {width: 800, height: 600},
      deviceScaleFactor: 1,
    },
    captures: CAPTURE_FRAMES.map((frame) => ({
      frame,
      width: 800,
      height: 600,
      identityVerified: true,
      authorityBoundaryVerified: true,
      sha256: identity.entryStateSha256,
    })),
    browserDiagnostics: cleanDiagnostics,
    assertions: [{id: "synthetic-validator-fixture", pass: true}],
  };
  assert.equal(validateCaptureManifestShape(base), true);
  assert.throws(
    () =>
      validateCaptureManifestShape({
        ...base,
        authorityBoundary: {...AUTHORITY_BOUNDARY, ownerAcceptance: true},
      }),
    /promoted ownerAcceptance/,
  );
  assert.throws(
    () => validateCaptureManifestShape({...base, captures: base.captures.slice(1)}),
    /seven captures/,
  );
});

test("checked immutable FQ002 artifact rehashes seven native frames and remains candidate-only", async () => {
  const checked = await checkStoredArtifact();
  assert.equal(checked.status, "pass");
  assert.equal(checked.captureCount, CAPTURE_FRAMES.length);
  assert.match(checked.manifestSha256, /^[a-f0-9]{64}$/);
  assert.equal(checked.authorityBoundary.currentJavascriptCandidateOnly, true);
  assert.equal(checked.authorityBoundary.authoritativeOriginalRuntime, false);
  assert.equal(checked.authorityBoundary.rmseAcceptance, false);
  assert.equal(checked.authorityBoundary.humanVisualReview, false);
  assert.equal(checked.authorityBoundary.ownerAcceptance, false);
  assert.equal(checked.authorityBoundary.strictMigrationCompletion, false);
  assert.equal(checked.authorityBoundary.wholeLessonIntegration, false);
  assert.equal(checked.authorityBoundary.atomicLessonPublication, false);
});

