import assert from "node:assert/strict";
import test from "node:test";

import {
  ANIMATION_ID,
  buildBundle,
  checkReport,
  parseCli,
  validateReport,
} from "./build-g4-l10-vb003-candidate-asset-relocation-successor-v1.mjs";

test("VB003 relocation successor preserves the capture and removes only the two storage failures", async () => {
  const bundle = await buildBundle();
  validateReport(bundle.report);
  assert.equal(bundle.report.animationId, ANIMATION_ID);
  assert.equal(bundle.report.predecessorCapture.captureCount, 203);
  assert.equal(bundle.report.currentValidation.errorCount, 93);
  assert.equal(bundle.report.currentValidation.removedMirrorErrorCount, 0);
  assert.equal(bundle.report.currentRelocation.oldAndCurrentCanvasBytesIdentical,
    true);
  assert.equal(bundle.report.currentRelocation.productionApprovalChanged, false);
  assert.equal(bundle.report.ledgerState.strictComplete, 0);
  assert.equal(bundle.report.ledgerState.publishedReleaseCount, 0);
  assert.equal(bundle.report.ledgerState.l10StrictCompleteCount, 0);
  assert.equal(bundle.report.ledgerState.l10Published, false);
  assert.ok(Object.values(bundle.report.authority).every((value) =>
    value === false));
});

test("VB003 relocation successor generated artifacts are current", async () => {
  const bundle = await buildBundle();
  const result = await checkReport(bundle);
  assert.equal(result.vb003ErrorCount, 93);
  assert.equal(result.strictComplete, 0);
  assert.equal(result.publishedReleaseCount, 0);
  assert.equal(result.acceptanceEffect, false);
});

test("VB003 relocation successor CLI is explicit and no-clobber", () => {
  for (const mode of ["--dry-run", "--write-no-clobber", "--check"]) {
    assert.equal(parseCli([mode]), mode);
  }
  assert.throws(() => parseCli([]), /Choose exactly one/u);
  assert.throws(() => parseCli(["--write"]), /Expected --dry-run/u);
});
