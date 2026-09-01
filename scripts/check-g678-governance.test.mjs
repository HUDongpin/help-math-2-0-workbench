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
  assert.ok(result.blockers.includes("all-required-primary-slots-named-capacity-not-verified"));
  assert.equal(result.blockers.includes("math-ccss-reviewer:primary-missing"), false);
  assert.ok(result.blockers.includes("math-ccss-reviewer:backup-missing"));
  for (const role of [
    "migration-lead", "factory-toolchain-engineer", "integration-engineer",
    "qa-strict-authority", "authorized-original-runtime-operator", "spanish-reviewer",
    "audio-reviewer", "independent-visual-reviewer", "release-custodian",
  ]) {
    assert.equal(result.blockers.includes(`${role}:primary-missing`), false);
    assert.ok(result.blockers.includes(`${role}:backup-missing`));
  }
  assert.ok(result.blockers.includes("qa-strict-authority-must-be-independent-from-implementation"));
  assert.ok(result.blockers.includes("authorized-original-runtime-operator-cannot-self-sign-implementation"));
  assert.ok(result.blockers.includes("spanish-reviewer-must-be-separate-from-implementation-author"));
  assert.ok(result.blockers.includes("independent-visual-reviewer-must-not-be-implementation-author"));
  assert.ok(result.blockers.includes("owner-approver-must-be-separate-from-professional-reviewers"));
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
