import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

const REPORT = "reports/g4-l3-g5-l4-private-preview-capture-currentness-invalidation-2026-08-07-r3.json";

test("r3 preserves the r2 execution and invalidates both captures without authority promotion", async () => {
  const report = JSON.parse(await readFile(REPORT));
  const predecessor = await readFile(report.predecessorExecutionReceipt.path);
  assert.equal(predecessor.length, report.predecessorExecutionReceipt.bytes);
  assert.equal(
    createHash("sha256").update(predecessor).digest("hex"),
    report.predecessorExecutionReceipt.sha256,
  );
  assert.equal(report.predecessorExecutionReceipt.rewritten, false);
  assert.equal(report.driftedArtifact.samePathMultiplePostCaptureHashesObserved, true);
  assert.equal(new Set(report.driftedArtifact.postCaptureObservations.map(({sha256}) => sha256)).size, 3);
  assert.equal(report.affectedCaptures.length, 2);
  assert.equal(report.affectedCaptures.reduce((sum, capture) => sum + capture.executedFrameCount, 0), 547);
  assert.ok(report.affectedCaptures.every((capture) => capture.captureExecutionRetained && !capture.currentImplementationClosure));
  assert.equal(report.disposition.automaticRecaptureAuthorized, false);
  assert.ok(Object.values(report.authority).every((value) => value === false));
});

test("r3 outputs are read-only", async () => {
  for (const path of [REPORT, REPORT.replace(/\.json$/u, ".md")]) {
    const metadata = await stat(path);
    assert.equal(metadata.mode & 0o222, 0);
  }
});
