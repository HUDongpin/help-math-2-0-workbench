import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAGNOSTIC_FRAME_PAIRS,
  diagnosticComparisonPaths,
  parseArguments,
  validateDiagnosticComparisonInputs,
} from "./compare-g4-l3-ts006-diagnostic-composite.mjs";

function fixtures() {
  const original = {
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
    frames: Array.from({length: 3564}, (_, index) => ({
      ordinal: index + 1,
      status: "complete",
      width: 800,
      height: 600,
      sha256: "a".repeat(64),
    })),
  };
  const implementation = {
    status: "complete",
    animationId: "course-g04-l03-ts-006",
    frameDomainId: "sprite-23",
    scenario: "manual-runtime-diagnostic-observation",
    language: "en",
    seed: "0",
    requirementId: "diagnostic:ts006:manual-runtime-observation:en",
    traceId: "diagnostic:ts005-to-ts006-natural:en:seed-0",
    entryStateSha256: "08f727387e57a543f8cecb9b7340c8822e393ee082caf1a3c69ecd3e581b5d8d",
    captured: DIAGNOSTIC_FRAME_PAIRS.map(({sourceFrame}) => ({
      frame: sourceFrame,
      reportedFrame: sourceFrame,
      reportedAnimationId: "course-g04-l03-ts-006",
      frameDomainId: "sprite-23",
      scenario: "manual-runtime-diagnostic-observation",
      language: "en",
      seed: "0",
      width: 800,
      height: 600,
      sha256: "b".repeat(64),
    })),
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  return {original, implementation};
}

test("TS006 diagnostic comparison accepts only the complete fail-closed pairing", () => {
  assert.equal(validateDiagnosticComparisonInputs(fixtures()), true);
  assert.deepEqual(DIAGNOSTIC_FRAME_PAIRS.map(({sourceFrame}) => sourceFrame),
    [1, 8, 13, 55, 58, 74, 77, 125, 127, 128]);
});

test("TS006 diagnostic iterations are isolated and path-safe", () => {
  assert.equal(parseArguments([]).iteration, "v5");
  assert.equal(parseArguments(["--iteration", "v6"]).iteration, "v6");
  assert.equal(
    diagnosticComparisonPaths("v6").reportJson,
    "reports/g4-l3-ts006-diagnostic-composite-comparison-v6.json",
  );
  assert.throws(() => parseArguments(["--iteration", "../escape"]), /safe lowercase identifier/);
  assert.throws(() => parseArguments(["--output", "elsewhere"]), /Unknown option/);
});

test("TS006 diagnostic comparison rejects authority promotion and identity drift", () => {
  const promoted = fixtures();
  promoted.original.runtimeAuthorityClaimed = true;
  assert.throws(() => validateDiagnosticComparisonInputs(promoted),
    /must not claim runtime authority/);
  const spanish = fixtures();
  spanish.implementation.language = "es";
  assert.throws(() => validateDiagnosticComparisonInputs(spanish),
    /does not match the diagnostic comparison contract/);
  const reordered = fixtures();
  reordered.implementation.captured.reverse();
  assert.throws(() => validateDiagnosticComparisonInputs(reordered),
    /incomplete or out of order/);
});
