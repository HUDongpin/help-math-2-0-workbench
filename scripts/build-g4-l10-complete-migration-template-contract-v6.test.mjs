import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  deriveContract,
  parseCliArgs,
  readSnapshot,
  renderMarkdown,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v6.mjs";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const snapshotPromise = readSnapshot(PROJECT_ROOT);
const reportPromise = snapshotPromise.then(deriveContract);

test("preserves and authoritatively recomputes exact v5", async () => {
  const report = await reportPromise;
  assert.equal(
    report.successorOf.sha256,
    "b4777628d6433241c247c1e3c4236becadd3b4b66e03585f51a81babd5fbeef9",
  );
  assert.equal(report.predecessorDisposition.v5.preserved, true);
  assert.equal(report.predecessorDisposition.v5.authoritativeRecomputationMatched, true);
  assert.equal(report.currentLedgerFreshness.status, "current-authoritative-generator-proven");
  assert.equal(report.currentLedgerFreshness.proof.completion.l10StrictComplete, 0);
  assert.equal(report.currentLedgerFreshness.proof.release.l10.published, false);
});

test("records Peter Hu as conditional but never activated", async () => {
  const report = await reportPromise;
  const runtime = report.currentFormalState.originalRuntime;
  assert.equal(runtime.conditionallyDesignatedOperator, "Peter Hu");
  assert.equal(runtime.operatorDesignationRecorded, true);
  assert.equal(runtime.operatorActivated, false);
  assert.equal(runtime.operatorReady, false);
  assert.equal(runtime.runtimeSessions, 0);
  assert.equal(runtime.capturePngs, 0);
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
});

test("binds only the exact VB003 EN and ES kits", async () => {
  const report = await reportPromise;
  const gate = report.operatorGateSuccessor;
  assert.equal(gate.exactScope.animationId, "course-g04-l10-vb-003");
  assert.deepEqual(gate.exactScope.languages, ["en", "es"]);
  assert.deepEqual(gate.exactScope.requirementIds,
    ["req-default-root-en", "req-default-root-es"]);
  assert.equal(gate.exactCaptureKits.length, 2);
  assert.equal(gate.operator.authorizationScopeExpansion, false);
  assert.equal(gate.runtimeAuthority, false);
});

test("keeps the original-runtime gate blocked by every unsatisfied security condition", async () => {
  const report = await reportPromise;
  const gate = report.gates.find(({id}) => id === "original-runtime-baseline");
  assert.equal(gate.status, "BLOCKED-CONDITIONAL-OPERATOR-NOT-ACTIVATED");
  assert.equal(gate.satisfied, false);
  assert.equal(gate.current.validV214ReviewBatch, false);
  assert.equal(gate.current.productionHelperIndependentlyApproved, false);
  assert.equal(gate.current.disposableOfflineEnvironmentApproved, false);
  assert.equal(gate.current.freshCheckedLaunchReceiptForCurrentStart, false);
  assert.ok(Object.values(report.operatorGateSuccessor.currentSecurityGates)
    .every((value) => value === false));
});

test("keeps template, transaction, batch, integration, and acceptance closed", async () => {
  const report = await reportPromise;
  assert.equal(report.templateStable, false);
  assert.equal(report.operatorGateSuccessor.decision, "DO_NOT_LAUNCH");
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.gates.filter(({satisfied}) => satisfied).length, 1);
});

test("validator rejects operator activation or downstream authority expansion", async () => {
  const report = await reportPromise;
  for (const mutate of [
    (copy) => { copy.currentFormalState.originalRuntime.operatorActivated = true; },
    (copy) => { copy.operatorGateSuccessor.activationEligible = true; },
    (copy) => { copy.operatorGateSuccessor.currentSecurityGates.freshV214SchemaAdversarialWholeReviewBatchValid = true; },
    (copy) => { copy.operatorGateSuccessor.launchReceipt.launchAuthorizedNow = true; },
    (copy) => { copy.downstreamTransactionBoundary.applyAuthorized = true; },
    (copy) => { copy.automationBoundary.wholeCourseIntegrationAllowed = true; },
    (copy) => { copy.acceptanceEffects.ownerAcceptance = true; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateContract(copy));
  }
});

test("renders deterministically and retains a valid fingerprint", async () => {
  const report = await reportPromise;
  assert.equal(validateContract(report), true);
  assert.equal(renderMarkdown(report), renderMarkdown(structuredClone(report)));
  assert.match(report.reportFingerprintSha256, /^[0-9a-f]{64}$/u);
});

test("CLI has no apply or runtime mode", () => {
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--write"]));
  assert.throws(() => parseCliArgs(["--check", "--write-no-clobber"]));
});
