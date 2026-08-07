import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPendingRuntimePreflight,
  renderMarkdown,
  validatePendingRuntimePreflight,
} from "./build-g4-l3-ts006-pending-runtime-preflight.mjs";

let reportPromise;
function buildOnce() { reportPromise ||= buildPendingRuntimePreflight(); return reportPromise; }

test("TS006 pending preflight proves technical launch path but not promotion", async () => {
  const report = validatePendingRuntimePreflight(await buildOnce());
  assert.equal(report.controls.length, 8);
  assert.equal(report.executionGate.pendingCandidateRuntimeLaunchReady, true);
  assert.equal(report.executionGate.promotableRuntimeLaunchReady, false);
  assert.equal(report.executionGate.operatorDisplayName, "Dr. Peter Hu");
  assert.equal(report.executionGate.independentVisualReviewSatisfied, false);
  assert.equal(report.observed.flashProjectorLaunched, false);
  assert.equal(report.observed.screenPixelsCaptured, false);
  assert.equal(
    report.toolBindings.captureTool.path,
    "work/g4-l3-runtime-capture-tool/HELP Math Runtime Capture.app/Contents/MacOS/g4-l3-runtime-capture",
  );
  assert.match(report.toolBindings.captureTool.sha256, /^[a-f0-9]{64}$/u);
  assert.ok(report.toolBindings.captureTool.bytes > 0);
  assert.equal(report.acceptance.strictMigrationComplete, false);
  assert.match(renderMarkdown(report), /cannot be promoted/u);
});

test("TS006 pending preflight rejects fabricated independence, launch, or acceptance", async () => {
  const report = await buildOnce();
  for (const mutate of [
    (copy) => { copy.executionGate.independentVisualReviewSatisfied = true; },
    (copy) => { copy.executionGate.flashProjectorLaunched = true; },
    (copy) => { copy.acceptance.ownerAccepted = true; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validatePendingRuntimePreflight(copy));
  }
});
