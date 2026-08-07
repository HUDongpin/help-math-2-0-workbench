import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTs006ScenarioReadiness,
  validateTs006ScenarioReadiness,
} from "./build-g4-l3-ts006-scenario-readiness.mjs";

test("checked-in TS006 scenario readiness is reproducible and fail-closed", async () => {
  const result = await buildTs006ScenarioReadiness({check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.document.animationId, "course-g04-l03-ts-006");
  assert.equal(result.document.conclusion.strictAcceptanceReady, false);
  assert.equal(result.document.branchCaptureReadiness.runtimeSessionsExecuted, 0);
  assert.equal(result.document.acceptance.strictMigrationComplete, false);
  assert.ok(result.document.branchCaptureReadiness.requiredScenarioInventory.some((item) => item.includes("sprite-23")));
  assert.ok(result.document.branchCaptureReadiness.requiredScenarioInventory.some((item) => item.includes("sprite-3")));
});

test("TS006 scenario readiness rejects acceptance promotion and missing scenario scope", async () => {
  const {document} = await buildTs006ScenarioReadiness({check: true});
  const promoted = structuredClone(document);
  promoted.acceptance.ownerAccepted = true;
  assert.throws(() => validateTs006ScenarioReadiness(promoted), /ownerAccepted must remain false/);

  const narrowed = structuredClone(document);
  narrowed.branchCaptureReadiness.requiredScenarioInventory = ["root only"];
  assert.throws(() => validateTs006ScenarioReadiness(narrowed), /conservative scenario requirements/);
});
