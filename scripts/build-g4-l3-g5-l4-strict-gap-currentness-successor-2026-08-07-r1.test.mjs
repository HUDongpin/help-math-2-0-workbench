import assert from "node:assert/strict";
import {stat} from "node:fs/promises";
import test from "node:test";

import {
  buildStrictGapCurrentnessSuccessor,
  parseMode,
} from "./build-g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.mjs";

test("binds current G4 L3 and G5 L4 gaps without acceptance promotion", async () => {
  const report = await buildStrictGapCurrentnessSuccessor();

  assert.equal(report.g4Lesson3.release.observedMembers, 40);
  assert.equal(report.g4Lesson3.release.strictCompleteMembers, 0);
  assert.equal(report.g4Lesson3.release.published, false);
  assert.equal(report.g4Lesson3.currentJavascript.boundModules, 39);
  assert.equal(
    report.g4Lesson3.ledgerDiagnostics.membersWithHigherCurrentValidatorErrorCount,
    39,
  );
  assert.equal(report.g4Lesson3.runtimeBoundary.runtimeSessionsExecuted, 0);
  assert.equal(report.g4Lesson3.runtimeBoundary.originalRuntimeExecutionReady, false);

  assert.equal(report.g5Lesson4.release.observedMembers, 55);
  assert.equal(report.g5Lesson4.release.strictCompleteMembers, 0);
  assert.equal(report.g5Lesson4.release.published, false);
  assert.equal(report.g5Lesson4.sourceScope.logicalScopeChanged, false);
  assert.equal(report.g5Lesson4.sourceScope.descriptorOnlyDiffCount, 7);
  assert.equal(report.g5Lesson4.runtimeBoundary.runtimeSessionsExecuted, 0);
  assert.equal(report.g5Lesson4.runtimeBoundary.originalRuntimeExecutionReady, false);

  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("requires an explicit non-overwriting mode", () => {
  assert.equal(parseMode(["--json"]), "json");
  assert.equal(parseMode(["--check"]), "check");
  assert.equal(parseMode(["--write-no-clobber"]), "write-no-clobber");
  assert.throws(() => parseMode([]));
  assert.throws(() => parseMode(["--write"]));
  assert.throws(() => parseMode(["--json", "--check"]));
});

test("published successor outputs are read-only when present", async () => {
  for (const path of [
    "reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.json",
    "reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.md",
  ]) {
    try {
      const metadata = await stat(path);
      assert.equal(metadata.mode & 0o222, 0);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
});
