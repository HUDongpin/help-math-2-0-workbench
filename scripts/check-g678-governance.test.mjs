import assert from "node:assert/strict";
import test from "node:test";

import {evaluateGovernance, run} from "./check-g678-governance.mjs";

test("governance stays explicitly blocked until named primary and backup roles exist", async () => {
  const result = await run();
  assert.equal(result.status, "blocked");
  assert.equal(result.roleCount, 12);
  assert.equal(result.m0Exit, false);
  assert.equal(result.blockers.includes("budget-or-procurement-cap-missing"), false);
  assert.ok(result.blockers.includes("procurement-controls-not-yet-live-verified"));
  assert.ok(result.blockers.includes("remaining-named-primary-and-backup-assignments-missing"));
  assert.equal(result.blockers.includes("math-ccss-reviewer:primary-missing"), false);
  assert.ok(result.blockers.includes("math-ccss-reviewer:backup-missing"));
});

test("the evaluator rejects a missing required role", () => {
  const result = evaluateGovernance({
    schemaVersion: 1,
    artifactType: "help-math-g678-review-governance",
    requiredRoles: [],
    budget: {weeklyCap: 1, procurementOwner: "owner"},
    m0Exit: false,
  });
  assert.equal(result.status, "invalid");
  assert.ok(result.errors.some((error) => error.includes("missing role")));
});
