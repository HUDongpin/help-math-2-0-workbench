import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L5M1MachineFoundationReadiness,
  parseG5L5M1Arguments,
  renderG5L5M1Markdown,
  validateG5L5M1MachineFoundationReport,
  writeOrCheckG5L5M1,
} from "./build-g5-l5-m1-machine-foundation-readiness.mjs";
import {
  buildG5L5M0GovernanceReadiness,
  G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR,
  stableJson,
  writeOrCheckG5L5M0,
} from "./build-g5-l5-m0-governance-readiness.mjs";
import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";

function refingerprint(report) {
  const base = structuredClone(report);
  delete base.reportFingerprintSha256;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(Buffer.from(stableJson(base)))
    .digest("hex");
}

async function buildWithTemporaryCurrentM0() {
  const directory = await mkdtemp("reports/g5-l5-m1-test-");
  const outputPrefix = `${directory}/m0-governance-readiness`;
  try {
    const m0 = await buildG5L5M0GovernanceReadiness();
    await writeOrCheckG5L5M0({
      report: m0,
      outputPrefix,
      check: false,
    });
    const report = await buildG5L5M1MachineFoundationReadiness({
      m0ReportPath: `${outputPrefix}.json`,
    });
    return structuredClone(report);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}

test("checked-in G5 L5 M1 report binds exactly 57 current non-runnable machine packages", async () => {
  const report = await buildG5L5M1MachineFoundationReadiness();
  const [json, markdown] = await Promise.all([
    readFile("reports/g5-l5-m1-machine-foundation-readiness.json", "utf8"),
    readFile("reports/g5-l5-m1-machine-foundation-readiness.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderG5L5M1Markdown(report));
  assert.equal(report.release.memberCount, 57);
  assert.equal(report.machineFoundation.memberEvidenceCount, 57);
  assert.equal(report.machineFoundation.members.length, 57);
  assert.equal(new Set(report.machineFoundation.members.map(({animationId}) => animationId)).size, 57);
  assert.deepEqual(report.machineFoundation.members.map(({ordinal}) => ordinal), Array.from({length: 57}, (_, index) => index + 1));
  assert.ok(report.machineFoundation.members.every(({boundaries}) =>
    boundaries.machineAuditCurrent === true &&
    boundaries.m1StaticReconciliationApplied === true &&
    boundaries.m1StaticReconciliationMachineOnly === true &&
    boundaries.strictReadinessPrepared === true &&
    boundaries.runtimeWorksheetEmpty === true &&
    boundaries.namedOperatorAssigned === false &&
    boundaries.runtimeRunnable === false &&
    boundaries.implementationAuthorized === false &&
    boundaries.strictComplete === false &&
    boundaries.published === false));
  assert.ok(report.machineFoundation.members.every(({animationId, bindings}) =>
    bindings.migrationManifest.path ===
      `migrations/${animationId}/migration.json` &&
    bindings.preAuthorizationMigrationManifest.path ===
      `migrations/${animationId}/migration.json` &&
    bindings.migrationBrief.path ===
      `migrations/${animationId}/MIGRATION_BRIEF.md` &&
    bindings.scriptInventory.path ===
      `migrations/${animationId}/audit/script-inventory.json` &&
    bindings.dependencyInventory.path ===
      `migrations/${animationId}/audit/dependency-inventory.json` &&
    bindings.m1StaticReconciliationReceipt.path ===
      `migrations/${animationId}/audit/machine/g5-l5-m1-static-reconciliation-receipt.json` &&
    /^[a-f0-9]{64}$/.test(bindings.m1StaticReconciliationReceipt.sha256) &&
    bindings.strictReadiness.path ===
      `migrations/${animationId}/audit/strict-readiness.json` &&
    /^[a-f0-9]{64}$/.test(bindings.strictReadiness.sha256)));
  assert.equal(report.machineFoundation.machineAuditCount, 57);
  assert.equal(report.machineFoundation.emptyRuntimeWorksheetCount, 57);
  assert.equal(
    report.machineFoundation.authorizedStaticReconciliationCount,
    57,
  );
  assert.equal(report.machineFoundation.strictReadinessArtifactCount, 57);
  assert.equal(report.machineFoundation.rootFrameCount, 610);
  assert.equal(report.machineFoundation.structuralNestedDefinitionCount, 1232);
  assert.equal(report.machineFoundation.unresolvedNestedReachabilityCount, 1232);
  assert.equal(report.machineFoundation.runtimeSessionCount, 0);
  assert.equal(report.machineFoundation.authoritativeBaselineCount, 0);
  assert.equal(report.machineFoundation.authoringAuditCount, 0);
  assert.equal(report.machineFoundation.completedWorkStudyCount, 0);
  assert.equal(report.summary.namedPersonCount, 0);
  assert.equal(report.summary.authorizedStaticReconciliationCount, 57);
  assert.equal(report.summary.strictReadinessArtifactCount, 57);
  assert.equal(report.summary.requiredRoleCount, 7);
  assert.equal(report.summary.requiredNamedRoleSlotCount, 14);
  assert.equal(report.summary.requiredPrimaryHoursPerWeekFloorTotal, 64);
  assert.equal(report.summary.specifiedBackupHoursPerWeekFloorTotal, 8);
  assert.equal(report.summary.rolesWithOwnerPendingBackupHourFloorCount, 6);
  assert.equal(report.summary.inheritedHourCommitmentCount, 0);
  assert.equal(report.summary.committedHourCommitmentCount, 0);
  assert.equal(report.summary.committedHoursPerWeekTotal, 0);
  assert.equal(report.summary.authorizationReceiptCount, 1);
  assert.equal(report.summary.budgetDefaultSelectionRecorded, true);
  assert.equal(report.summary.budgetGateApprovedCount, 0);
  assert.equal(report.summary.externalSpendAuthorized, false);
  assert.equal(report.summary.procurementOrPaymentAuthorized, false);
  assert.equal(report.m0Gate.requiredRoleCount, 7);
  assert.equal(report.m0Gate.requiredNamedRoleSlotCount, 14);
  assert.equal(report.m0Gate.requiredPrimaryHoursPerWeekFloorTotal, 64);
  assert.equal(report.m0Gate.specifiedBackupHoursPerWeekFloorTotal, 8);
  assert.equal(report.m0Gate.rolesWithOwnerPendingBackupHourFloorCount, 6);
  assert.equal(report.m0Gate.committedHourCommitmentCount, 0);
  assert.equal(report.m0Gate.committedHoursPerWeekTotal, 0);
  assert.equal(
    report.sourceBindings.ownerGovernanceDirectiveIntake.path,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  );
  assert.deepEqual(
    report.sourceBindings.ownerGovernanceDirectiveIntake,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR,
  );
  assert.deepEqual(
    report.m0Gate.ownerExitDirectiveReceipt,
    report.sourceBindings.ownerGovernanceDirectiveIntake,
  );
  assert.deepEqual(
    report.m1Authorization.startAuthorizationReceipt,
    report.sourceBindings.ownerGovernanceDirectiveIntake,
  );
  assert.equal(report.m0Gate.ownerExitDirectiveRecorded, true);
  assert.equal(report.m0Gate.ownerExitEffective, false);
  assert.equal(report.m0Gate.ownerDecisionReceiptCount, 2);
  assert.equal(report.m0Gate.ownerDecisionRequirementSatisfiedCount, 1);
  assert.equal(report.m0Gate.ownerSignoffReceipt, null);
  assert.equal(report.summary.m0ExitDirectiveRecorded, true);
  assert.equal(report.summary.m0ExitEffective, false);
  assert.equal(report.summary.m0ExitReady, false);
  assert.equal(report.summary.m1StartAuthorized, false);
  assert.equal(report.summary.m1MachineOnlyStaticStartAuthorized, true);
  assert.equal(report.summary.m1MachineFoundationExecutionAuthorized, false);
  assert.equal(report.summary.m1MachineOnlyStaticExecutionAuthorized, true);
  assert.equal(report.summary.m1MachineOnlyStaticExecutionReady, true);
  assert.equal(report.m1Authorization.startAuthorized, false);
  assert.equal(
    report.m1Authorization.machineOnlyStaticStartAuthorized,
    true,
  );
  assert.equal(
    report.m1Authorization.machineFoundationExecutionAuthorized,
    false,
  );
  assert.equal(
    report.m1Authorization.machineOnlyStaticExecutionAuthorized,
    true,
  );
  assert.equal(report.m1Authorization.machineOnlyStaticScope, true);
  assert.equal(report.m1Authorization.originalRuntimeExecutionAuthorized, false);
  assert.equal(report.m1Authorization.animateGuiExecutionAuthorized, false);
  assert.equal(report.m1Authorization.implementationAuthorized, false);
  assert.deepEqual(
    report.budgetBoundary.ownerDirectiveReceipt,
    report.sourceBindings.ownerGovernanceDirectiveIntake,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection.ownerSelectedRepositoryDefaults,
    true,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection
      .repositoryDefinedNumericOrCycleDefaultsFound,
    false,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection.personnelRateCeilingUsdPerHour,
    null,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection.totalBudgetEnvelopeUsd,
    null,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection.procurementPaymentCycle,
    null,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection.externalSpendAuthorized,
    false,
  );
  assert.equal(
    report.budgetBoundary.defaultSelection.procurementOrPaymentAuthorized,
    false,
  );
  assert.equal(report.budgetBoundary.gateApprovedCount, 0);
  assert.equal(report.readiness.m1StartAuthorized, false);
  assert.equal(report.readiness.m1MachineOnlyStaticStartAuthorized, true);
  assert.equal(report.readiness.m1ExecutionReady, false);
  assert.equal(report.readiness.m1MachineOnlyStaticExecutionReady, true);
  assert.equal(report.readiness.runtimeAcquisitionReady, false);
  assert.equal(report.readiness.rendererImplementationReady, false);
  assert.equal(report.readiness.promotionReady, false);
  assert.equal(report.acceptanceEffects.m0Closed, false);
  assert.equal(report.acceptanceEffects.m1Authorized, false);
  assert.equal(
    report.acceptanceEffects.m1MachineOnlyStaticStartAuthorized,
    true,
  );
  assert.equal(report.acceptanceEffects.m1ExecutionAuthorized, false);
  assert.equal(
    report.acceptanceEffects.m1MachineOnlyStaticExecutionAuthorized,
    true,
  );
  assert.equal(report.acceptanceEffects.runtimeExecutionAuthorized, false);
  assert.equal(report.acceptanceEffects.implementationAuthorized, false);
  assert.equal(report.acceptanceEffects.evidencePromotionAuthorized, false);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.published, false);
  assert.match(markdown, /7 roles \/ 14 named primary\+backup slots/);
  assert.match(markdown, /roadmap primary floor total: \*\*64 hours\/week\*\*/);
  assert.match(markdown, /every committed-hours field remains \*\*unset\*\*/);
  assert.match(markdown, /Authorized M1 static reconciliations \/ fail-closed strict-readiness artifacts: \*\*57\/57 \/ 57\/57\*\*/);
  assert.match(markdown, /M1 machine-only static start authorized \/ foundation execution authorized \/ ready: \*\*true \/ true \/ true\*\*/);
  assert.doesNotMatch(json, /Dr\. Peter|Peter Hu|catalog\/owner-authorizations\/g5-l4|reports\/g5-l4/);
  await writeOrCheckG5L5M1({
    report,
    outputPrefix: "reports/g5-l5-m1-machine-foundation-readiness",
    check: true,
  });
});

test("G5 L5 M1 validator rejects receipt tampering, bounded-authorization loss, execution broadening, people, hours, strict, and publication promotion", async () => {
  const report = await buildWithTemporaryCurrentM0();
  const mutations = [
    ["M0 close", (copy) => { copy.m0Gate.exitReady = true; }, /promoted M0/],
    ["M0 effective", (copy) => { copy.m0Gate.ownerExitEffective = true; }, /promoted M0/],
    ["receipt path", (copy) => { copy.sourceBindings.ownerGovernanceDirectiveIntake.path = "catalog/owner-authorizations/other.json"; }, /source binding drifted/],
    ["M1 start loss", (copy) => { copy.m1Authorization.machineOnlyStaticStartAuthorized = false; }, /bounded machine-only authorization receipt/],
    ["M1 execution loss", (copy) => { copy.m1Authorization.machineOnlyStaticExecutionAuthorized = false; }, /bounded machine-only authorization receipt/],
    ["M1 readiness loss", (copy) => { copy.readiness.m1MachineOnlyStaticExecutionReady = false; }, /bounded machine-only readiness/],
    ["M1 receipt removed", (copy) => { copy.m1Authorization.startAuthorizationReceipt = null; }, /bounded machine-only authorization receipt/],
    ["static reconciliation binding", (copy) => { copy.machineFoundation.members[0].bindings.m1StaticReconciliationReceipt.path = "migrations/wrong/audit/machine/g5-l5-m1-static-reconciliation-receipt.json"; }, /member inventory fingerprint|member static-reconciliation/],
    ["strict readiness binding", (copy) => { copy.machineFoundation.members[0].bindings.strictReadiness.path = "migrations/wrong/audit/strict-readiness.json"; }, /member inventory fingerprint|member static-reconciliation/],
    ["budget value", (copy) => { copy.budgetBoundary.defaultSelection.totalBudgetEnvelopeUsd = 1; }, /budget defaults invented/],
    ["procurement authority", (copy) => { copy.budgetBoundary.defaultSelection.procurementOrPaymentAuthorized = true; }, /budget defaults invented/],
    ["operator", (copy) => { copy.m1Authorization.namedOperatorAssigned = true; }, /namedOperatorAssigned/],
    ["hours", (copy) => { copy.summary.inheritedHourCommitmentCount = 1; }, /imported authority/],
    ["committed hours", (copy) => { copy.summary.committedHourCommitmentCount = 1; }, /imported authority/],
    ["capacity floor", (copy) => { copy.m0Gate.requiredPrimaryHoursPerWeekFloorTotal = 63; }, /roadmap capacity requirements/],
    ["runtime", (copy) => { copy.acceptanceEffects.runtimeExecutionAuthorized = true; }, /runtimeExecutionAuthorized/],
    ["generic M1 acceptance", (copy) => { copy.acceptanceEffects.m1ExecutionAuthorized = true; }, /m1ExecutionAuthorized/],
    ["implementation", (copy) => { copy.acceptanceEffects.implementationAuthorized = true; }, /implementationAuthorized/],
    ["strict", (copy) => { copy.acceptanceEffects.strictComplete = true; }, /strictComplete/],
    ["publication", (copy) => { copy.acceptanceEffects.published = true; }, /published/],
  ];
  for (const [label, mutate, pattern] of mutations) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateG5L5M1MachineFoundationReport(copy), pattern, label);
  }
});

test("G5 L5 M1 pure-document validation hard-binds every Owner directive projection to the canonical receipt bytes", async () => {
  const copy = await buildWithTemporaryCurrentM0();
  const forged = {
    path: G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
    bytes: 1,
    sha256: "0".repeat(64),
  };
  copy.sourceBindings.ownerGovernanceDirectiveIntake = forged;
  copy.m0Gate.ownerExitDirectiveReceipt = forged;
  copy.m1Authorization.startAuthorizationReceipt = forged;
  copy.budgetBoundary.ownerDirectiveReceipt = forged;
  refingerprint(copy);
  assert.throws(
    () => validateG5L5M1MachineFoundationReport(copy),
    /immutable Owner directive source binding drifted/,
  );
});

test("G5 L5 M1 writer rejects a symlinked reports ancestor", async () => {
  const sandbox = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-m1-path-security-"),
  );
  const root = path.join(sandbox, "root");
  const externalReports = path.join(sandbox, "external-reports");
  try {
    await Promise.all([mkdir(root), mkdir(externalReports)]);
    await symlink(externalReports, path.join(root, "reports"));
    await assert.rejects(
      writeOrCheckG5L5M1({
        report: {authority: "test-only", blockers: []},
        outputPrefix: "reports/g5-l5-m1-path-security",
        check: false,
        root,
      }),
      /ancestor must be an ordinary directory/,
    );
    assert.deepEqual(await readdir(externalReports), []);
  } finally {
    await rm(sandbox, {recursive: true, force: true});
  }
});

test("G5 L5 M1 CLI exposes deterministic output/check only", () => {
  const parsed = parseG5L5M1Arguments([
    "--output-prefix", "reports/g5-l5-m1-machine-foundation-readiness",
    "--check",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.outputPrefix, "reports/g5-l5-m1-machine-foundation-readiness");
  assert.throws(() => parseG5L5M1Arguments(["--authorize"]), /Unknown option/);
  assert.throws(() => parseG5L5M1Arguments(["--run-animate"]), /Unknown option/);
  assert.throws(() => parseG5L5M1Arguments(["--output-prefix", "migrations/escape"]), /below reports/);
});
