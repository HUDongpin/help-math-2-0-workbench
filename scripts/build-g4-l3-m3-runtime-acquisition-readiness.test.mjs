import assert from "node:assert/strict";
import test from "node:test";

import {
  buildM3RuntimeAcquisitionReadiness,
  parseArguments,
  renderMarkdown,
  validateM3RuntimeAcquisitionReadiness,
} from "./build-g4-l3-m3-runtime-acquisition-readiness.mjs";

function clone(value) {
  return structuredClone(value);
}

test("validates all 40 current empty workspace planning artifacts", async () => {
  const report = await buildM3RuntimeAcquisitionReadiness();
  assert.equal(report.summary.canonicalItems, 40);
  assert.equal(report.summary.activePages, 39);
  assert.equal(report.summary.courseShells, 1);
  assert.equal(report.summary.workspaceArtifactsCurrent, 40);
  assert.equal(report.summary.emptyOperatorWorksheets, 40);
  assert.equal(report.summary.nonRunnableArtifacts, 40);
  assert.equal(report.items.length, 40);
  assert.equal(new Set(report.items.map((item) => item.animationId)).size, 40);
  assert.match(report.sourceBindings.workspaceArtifactSet.sha256, /^[a-f0-9]{64}$/);
  assert.match(report.sourceBindings.migrationTechnicalManifestSet.sha256, /^[a-f0-9]{64}$/);
  assert.equal(report.summary.installedRuntimeCandidateBoundWorkspaces, 40);
  assert.equal(report.summary.runtimeCandidateApprovedWorkspaces, 0);
  assert.equal(report.summary.historicalStandaloneCandidatesReverified, 1);
  assert.equal(report.summary.historicalStandaloneCandidatesWithStrictAuthority, 0);
  assert.equal(report.summary.workspacesWithContainmentPrerequisiteBound, 40);
  assert.equal(report.summary.staticExternalSurfaceAffectedMembers, 3);
  assert.equal(report.summary.exactExternalSideEffectOperations, 23);
  assert.equal(report.summary.containmentControlsSpecified, 8);
  assert.equal(report.summary.containmentControlsTechnicallyPrepared, 1);
  assert.equal(report.summary.workspacesWithReadOnlyCR02ArtifactPrepared, 1);
  assert.equal(report.summary.containmentControlsApproved, 0);
  const ts006 = report.items.find((item) => item.animationId === "course-g04-l03-ts-006");
  assert.deepEqual(ts006.runtimeContainmentState.preparedControlIds, ["CR-02"]);
  assert.equal(ts006.runtimeContainmentState.preparedArtifactCount, 1);
  assert.equal(ts006.runtimeContainmentState.readOnlyLocalDependencyAllowlistTechnicallyPrepared, true);
  assert.equal(ts006.runtimeContainmentState.readOnlyLocalDependencyAllowlistApproved, false);
  assert.ok(report.items.filter((item) => item.animationId !== "course-g04-l03-ts-006")
    .every((item) => item.runtimeContainmentState.preparedArtifactCount === 0));
});

test("retains the exact unresolved M3 workload without promoting candidates", async () => {
  const report = await buildM3RuntimeAcquisitionReadiness();
  assert.equal(report.summary.flaBackedItems, 29);
  assert.equal(report.summary.swfOnlyItems, 11);
  assert.equal(report.summary.verifiedWorkOnlyAnimateAuthoringAudits, 29);
  assert.equal(report.summary.pendingAnimateAuthoringAudits, 0);
  assert.equal(report.summary.staticallyReachableNestedDefinitions, 859);
  assert.equal(report.summary.staticCandidateFamilies, 143);
  assert.equal(report.summary.sourceBoundScenarioCandidates, 193);
  assert.equal(report.summary.randomCandidateItems, 12);
  assert.equal(report.summary.audioObligationItems, 40);
});

test("keeps every execution, implementation, acceptance, and publication gate closed", async () => {
  const report = validateM3RuntimeAcquisitionReadiness(await buildM3RuntimeAcquisitionReadiness());
  assert.equal(report.readiness.machinePlanningReady, true);
  assert.equal(report.readiness.animateAuthoringCoverageComplete, true);
  assert.equal(report.readiness.installedRuntimeCandidateBound, true);
  assert.equal(report.readiness.installedRuntimeCandidateApproved, false);
  assert.equal(report.readiness.sideEffectContainmentRequirementsBound, true);
  assert.equal(report.readiness.readOnlyCR02TechnicalArtifactPrepared, true);
  assert.equal(report.readiness.sideEffectContainmentApproved, false);
  assert.equal(report.readiness.originalRuntimeExecutionReady, false);
  assert.equal(report.readiness.baselineCaptureReady, false);
  assert.equal(report.readiness.implementationReady, false);
  assert.equal(report.readiness.atomicPublicationReady, false);
  assert.equal(report.summary.namedOperatorsSupplied, 0);
  assert.equal(report.summary.runtimeSessionsExecuted, 0);
  assert.equal(report.summary.authoritativeBaselinePackages, 0);
  assert.equal(report.acceptance.strictMigrationComplete, false);
  assert.ok(report.items.every((item) => item.executionState.authoringAuditEstablished
    === item.authoringGateRequired));
  assert.ok(report.items.every((item) => item.runtimeEnvironmentState.installedCandidateIdentified));
  assert.ok(report.items.every((item) => !item.runtimeEnvironmentState.runtimeApprovedByOwner));
  assert.ok(report.items.every((item) => item.runtimeContainmentState.requiredForEveryRuntimeSession));
  assert.ok(report.items.every((item) => !item.runtimeContainmentState.safeToExecuteNow));
  assert.ok(report.items.every((item) => Object.entries(item.executionState)
    .filter(([key]) => key !== "authoringAuditEstablished")
    .every(([, value]) => value === false)));
});

test("validator fails closed on scope, readiness, item execution, capacity, or acceptance promotion", async () => {
  const report = await buildM3RuntimeAcquisitionReadiness();
  const scope = clone(report);
  scope.summary.workspaceArtifactsCurrent = 39;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(scope), /exact scope drifted/);

  const readiness = clone(report);
  readiness.readiness.originalRuntimeExecutionReady = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(readiness), /gate was promoted/);

  const item = clone(report);
  item.items[0].executionState.runtimeSessionExecuted = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(item), /unexpectedly opened/);

  const runtimeEnvironment = clone(report);
  runtimeEnvironment.items[0].runtimeEnvironmentState.runtimeApprovedByOwner = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(runtimeEnvironment), /runtime environment state/);

  const runtimeContainment = clone(report);
  runtimeContainment.items[0].runtimeContainmentState.safeToExecuteNow = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(runtimeContainment), /runtime containment state/);

  const cr02Scope = clone(report);
  cr02Scope.items[0].runtimeContainmentState.preparedControlIds = ["CR-02"];
  cr02Scope.items[0].runtimeContainmentState.preparedArtifactCount = 1;
  cr02Scope.items[0].runtimeContainmentState.readOnlyLocalDependencyAllowlistTechnicallyPrepared = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(cr02Scope), /CR-02 preparation scope/);

  const capacity = clone(report);
  capacity.capacityBoundary.bulkLessonCaptureAdmittedByThisContract = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(capacity), /capacity boundary was promoted/);

  const acceptance = clone(report);
  acceptance.acceptance.ownerAccepted = true;
  assert.throws(() => validateM3RuntimeAcquisitionReadiness(acceptance), /acceptance state drifted/);
});

test("Markdown distinguishes materialized planning from runtime readiness", async () => {
  const markdown = renderMarkdown(await buildM3RuntimeAcquisitionReadiness());
  assert.match(markdown, /Machine planning coverage is \*\*40\/40\*\*/);
  assert.match(markdown, /Empty operator worksheets: \*\*40\/40\*\*/);
  assert.match(markdown, /runtime contexts, schedules, sessions, and baselines: \*\*0\*\*/);
  assert.match(markdown, /bound into 40\/40 workspaces/);
  assert.match(markdown, /approved in \*\*0\/40\*\*/);
  assert.match(markdown, /prerequisite bound into \*\*40\/40\*\* workspaces/);
  assert.match(markdown, /23 exact operations across 3 members/);
  assert.match(markdown, /1 technical artifact prepared for TS006 \/ 0 approved/);
  assert.match(markdown, /Implementation and atomic publication remain closed/);
  assert.equal((markdown.match(/\| closed \|/g) || []).length, 40);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI exposes only deterministic report/check outputs", () => {
  const options = parseArguments([
    "--check",
    "--json-output", "reports/a.json",
    "--markdown-output", "reports/a.md",
  ]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
});
