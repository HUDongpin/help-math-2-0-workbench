import assert from "node:assert/strict";
import {stat} from "node:fs/promises";
import test from "node:test";

import {
  buildV217ExplicitAuthorizationHandoff,
  parseMode,
} from "./build-g4-l10-v217-explicit-authorization-handoff-2026-08-07-r1.mjs";

test("binds v2.17 authoring without creating review or runtime authority", async () => {
  const report = await buildV217ExplicitAuthorizationHandoff();
  assert.equal(report.authoringValidation.securityTargetHashMatchesProtocol, true);
  assert.deepEqual(report.futureReviewSet.requiredOrderedScopes, [
    "schema",
    "adversarial",
    "whole",
  ]);
  assert.equal(report.futureReviewSet.reviewSetCreatedByThisHandoff, false);
  assert.equal(report.futureReviewSet.reviewerTasksCreatedByThisHandoff, 0);
  assert.equal(report.futureReviewSet.authorizationTurnBound, false);
  assert.equal(report.migrationBoundary.unresolvedNested, 426);
  assert.equal(report.migrationBoundary.authoritativeFrames, 0);
  assert.ok(Object.values(report.authorityEffects).every((value) => value === false));
});

test("requires an explicit no-clobber mode", () => {
  assert.equal(parseMode(["--json"]), "json");
  assert.equal(parseMode(["--check"]), "check");
  assert.equal(parseMode(["--write-no-clobber"]), "write-no-clobber");
  assert.throws(() => parseMode([]));
  assert.throws(() => parseMode(["--write"]));
  assert.throws(() => parseMode(["--json", "--check"]));
});

test("published handoff outputs are read-only when present", async () => {
  for (const path of [
    "reports/g4-l10-v217-explicit-authorization-handoff-2026-08-07-r1.json",
    "reports/g4-l10-v217-explicit-authorization-handoff-2026-08-07-r1.md",
  ]) {
    try {
      const metadata = await stat(path);
      assert.equal(metadata.mode & 0o222, 0);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
});
