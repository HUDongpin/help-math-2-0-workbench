import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

import {
  parseMode,
} from "./build-g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.mjs";

test("preserves the superseded experimental capture successor without widening acceptance", async () => {
  const bytes = await readFile("reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.json");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "fd8dc2e6a5cac4325581a3a81b46e22ee837b70076e72f2000876bf6e08fca19");
  const report = JSON.parse(bytes);
  assert.equal(report.successfulCaptures.length, 2);
  assert.equal(report.captureSummary.requirementCount, 2);
  assert.equal(report.captureSummary.frameCount, 547);
  assert.equal(report.captureSummary.totalPngBytes, 144069460);
  assert.equal(report.captureSummary.allImplementationClosuresCurrent, true);
  assert.equal(report.captureSummary.adoptionPerformed, false);
  assert.deepEqual(
    report.successfulCaptures.map((capture) => capture.frameArchive.fileCount),
    [128, 419],
  );
  assert.equal(report.retainedFailedAttempts.length, 2);
  assert.ok(report.retainedFailedAttempts.every((attempt) =>
    attempt.retained && !attempt.repairedInPlace));
  assert.equal(report.g5ShellBlocker.planningOutcome, "blocked-before-capture");
  assert.equal(report.g5ShellBlocker.implementationRoutePresent, false);
  assert.equal(report.acceptanceEffects.currentJavascriptCaptureEvidenceAdded, true);
  for (const [key, value] of Object.entries(report.acceptanceEffects)) {
    if (key !== "currentJavascriptCaptureEvidenceAdded") assert.equal(value, false, key);
  }
  assert.equal(
    report.predecessorAndCurrentnessBindings.historicalEvidenceRewritten,
    false,
  );
  assert.equal(
    report.predecessorAndCurrentnessBindings.historicalApprovalCurrentnessInherited,
    false,
  );
  assert.equal(report.securityAndCaptureImplementation.boundary.tokenOrTokenHashRecorded, false);
  const canonicalGenerator = await readFile("scripts/capture-animation-keyframes.mjs");
  const canonicalGeneratorSha256 = createHash("sha256").update(canonicalGenerator).digest("hex");
  assert.notEqual(
    canonicalGeneratorSha256,
    report.securityAndCaptureImplementation.keyframeCapture.sha256,
  );
});

test("requires an explicit no-clobber mode", () => {
  assert.equal(parseMode(["--json"]), "json");
  assert.equal(parseMode(["--check"]), "check");
  assert.equal(parseMode(["--write-no-clobber"]), "write-no-clobber");
  assert.throws(() => parseMode([]));
  assert.throws(() => parseMode(["--write"]));
});

test("published successor outputs are read-only when present", async () => {
  for (const path of [
    "reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.json",
    "reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.md",
  ]) {
    try {
      const metadata = await stat(path);
      assert.equal(metadata.mode & 0o222, 0);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
});
