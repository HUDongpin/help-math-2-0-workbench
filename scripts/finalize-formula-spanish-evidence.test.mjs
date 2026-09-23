import assert from "node:assert/strict";
import test from "node:test";

import {
  applySpanishManifestEvidence,
  buildSpanishCoverageCombination,
} from "./finalize-formula-spanish-evidence.mjs";

const pilot = {id: "formula-test", frameCount: 3};
const comparison = {
  summary: {
    normalizedRmse: {min: 0.01, max: 0.02, mean: 0.015, median: 0.015, p95: 0.02},
    outliers: {failingAssignedThreshold: []},
  },
  diffArchive: {directory: "artifacts/diff"},
  inputs: {baseline: {directory: "artifacts/baseline"}},
};
const hashes = {
  baseline: "a".repeat(64), comparison: "b".repeat(64), capture: "c".repeat(64),
  contact: "d".repeat(64), coverage: "e".repeat(64), behavior: "f".repeat(64),
  product: "1".repeat(64), detailedBehavior: "2".repeat(64), detailedProduct: "3".repeat(64),
  audio: "4".repeat(64),
};

test("builds complete Spanish coverage without claiming broader review", () => {
  const row = buildSpanishCoverageCombination({pilot, capture: {}, comparison, hashes});
  assert.equal(row.status, "complete");
  assert.equal(row.capturedFrameCount, 3);
  assert.deepEqual(row.missingFrames, []);
  assert.equal(row.baselineAuthority, "original-swf-adobe-runtime-plus-swf-structural-spanish-panel");
  assert.match(row.reviewScope, /not original indexELM.*audio validation.*human review.*owner acceptance/);
});

test("records child visual parity while leaving host parity and migration status untouched", () => {
  const manifest = {
    status: "preserved",
    localization: {authoritativeSpanishHostParity: false},
    fidelity: {spanishHostVisual: {}},
    evidence: {evidenceHashes: {}},
    acceptance: {engineeringReview: {}},
  };
  const updated = applySpanishManifestEvidence({
    manifest,
    pilot,
    comparison,
    paths: {captureProject: "output/capture-manifest.json"},
    hashes,
  });
  assert.equal(updated.status, "preserved");
  assert.equal(updated.localization.authoritativeSpanishHostParity, false);
  assert.equal(updated.localization.authoritativeSpanishChildVisualParity, true);
  assert.equal(updated.fidelity.spanishChildVisual.status, "pass");
  assert.match(updated.fidelity.spanishHostVisual.status, /^blocked-/);
  assert.equal(updated.evidence.evidenceHashes.spanishComparison, hashes.comparison);
  assert.equal(updated.acceptance.engineeringReview.reviewer, "Codex engineering review");
  assert.equal(updated.acceptance.engineeringReview.reviewedAt, "2026-07-21T09:45:00.000Z");
  assert.match(updated.acceptance.engineeringReview.scope, /source-composited Spanish child-SWF visual branch/);
  assert.match(updated.acceptance.engineeringReview.scope, /does not accept the original indexELM/);
});
