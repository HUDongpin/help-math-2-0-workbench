import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuthoritativeRuntimeAcquisitionContract,
  parseArguments,
  renderMarkdown,
  validateAuthoritativeRuntimeAcquisitionContract,
} from "./build-g4-l3-authoritative-runtime-acquisition-contract.mjs";

function clone(value) {
  return structuredClone(value);
}

test("binds the complete 39-page plus shell acquisition scope", async () => {
  const report = await buildAuthoritativeRuntimeAcquisitionContract();
  assert.equal(report.summary.canonicalItems, 40);
  assert.equal(report.summary.activePages, 39);
  assert.equal(report.summary.courseShells, 1);
  assert.equal(report.summary.flaBackedItems, 29);
  assert.equal(report.summary.swfOnlyItems, 11);
  assert.equal(report.summary.acquisitionContractsPrepared, 40);
  assert.equal(report.items.length, 40);
  assert.equal(new Set(report.items.map((item) => item.animationId)).size, 40);
  assert.equal(Object.keys(report.sourceBindings).length, 12);
  assert.equal(report.summary.installedOriginalRuntimeCandidates, 1);
  assert.equal(report.summary.workspacesWithInstalledCandidateBinding, 40);
  assert.equal(report.summary.historicalStandaloneCandidatesReverified, 1);
  assert.equal(report.summary.historicalStandaloneFramesReverified, 10);
  assert.equal(report.summary.externalSideEffectAffectedMembers, 3);
  assert.equal(report.summary.exactExternalSideEffectOperations, 23);
  assert.equal(report.summary.runtimeContainmentControlsSpecified, 8);
  assert.equal(report.summary.runtimeContainmentControlsApproved, 0);
});

test("turns static evidence into explicit unresolved acquisition obligations", async () => {
  const report = await buildAuthoritativeRuntimeAcquisitionContract();
  assert.equal(report.summary.staticallyReachableNestedDefinitions, 859);
  assert.equal(report.summary.staticCandidateFamilies, 143);
  assert.equal(report.summary.sourceBoundScenarioCandidates, 193);
  assert.equal(report.summary.randomCandidateItems, 12);
  assert.equal(report.summary.audioObligationItems, 40);
  assert.ok(report.items.every((item) => item.acquisitionRequirements.requiredLocales.join(",") === "en,es"));
  assert.ok(report.items.every((item) => item.acquisitionRequirements.naturalExecutionFirst));
  assert.ok(report.items.every((item) => item.acquisitionRequirements.navigationAndReplay.required));
  assert.ok(report.items.every((item) => item.captureIdentityContract.requiredFields.length === 8));
});

test("binds the installed candidate while keeping execution, direct seek, Ruffle, storage, and acceptance closed", async () => {
  const report = validateAuthoritativeRuntimeAcquisitionContract(
    await buildAuthoritativeRuntimeAcquisitionContract(),
  );
  assert.equal(report.executionGate.state, "closed-runtime-candidate-identified-acquisition-not-authorized");
  assert.equal(report.executionGate.installedOriginalRuntimeCandidateIdentified, true);
  assert.equal(report.executionGate.candidateExecutableTechnicallyBound, true);
  assert.equal(report.executionGate.runtimeCandidateApprovedByOwner, false);
  assert.equal(report.executionGate.networkContainmentPlanApproved, false);
  assert.equal(report.executionGate.sideEffectContainmentPlanApproved, false);
  assert.equal(report.executionGate.perItemCaptureAuthorized, false);
  assert.equal(report.executionGate.bulkCaptureAuthorized, false);
  assert.equal(report.capacityBoundary.bulkLessonCaptureAdmittedByThisContract, false);
  assert.equal(report.capacityBoundary.boundedSessionRequiresLiveCapacityPreflight, true);
  assert.equal(report.authorityPolicy.ruffleIsForensicOnly, true);
  assert.equal(report.authorityPolicy.naturalExecutionRequiredBeforeDirectSeek, true);
  assert.equal(report.summary.acquisitionSessionsExecuted, 0);
  assert.equal(report.summary.authoritativeBaselinePackagesEstablished, 0);
  assert.equal(report.runtimeEnvironmentCandidate.version, "32.0.0.414");
  assert.equal(report.runtimeEnvironmentCandidate.executable.sha256,
    "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30");
  assert.equal(report.runtimeEnvironmentCandidate.runtimeApprovedByOwner, false);
  assert.equal(report.runtimeEnvironmentCandidate.executionAuthorized, false);
  assert.equal(report.runtimeContainmentBoundary.exactExternalOperations, 23);
  assert.equal(report.runtimeContainmentBoundary.controlsApproved, 0);
  assert.equal(report.runtimeContainmentBoundary.originalRuntimeExecutionReady, false);
  assert.ok(report.items.every((item) => item.directSeekPolicy.authorizedNow === false));
  assert.ok(report.items.every((item) => item.runtimeEnvironmentPrerequisite.installedCandidateIdentified));
  assert.ok(report.items.every((item) => !item.runtimeEnvironmentPrerequisite.originalRuntimeExecutionReady));
  assert.ok(report.items.every((item) => item.runtimeContainmentPrerequisite.requiredForEveryRuntimeSession));
  assert.ok(report.items.every((item) => !item.runtimeContainmentPrerequisite.sideEffectContainmentApproved));
  assert.ok(report.items.every((item) => item.currentEvidenceState.workOnlyAuthoringAuditEstablished
    === item.authoringGate.required));
  assert.ok(report.items.every((item) => Object.entries(item.currentEvidenceState)
    .filter(([key]) => key !== "workOnlyAuthoringAuditEstablished")
    .every(([, value]) => value === false)));
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("preserves the 29 paired authoring gates and 11 SWF-only dispositions", async () => {
  const report = await buildAuthoritativeRuntimeAcquisitionContract();
  const paired = report.items.filter((item) => item.authoringGate.required);
  const swfOnly = report.items.filter((item) => !item.authoringGate.required);
  assert.equal(paired.length, 29);
  assert.equal(swfOnly.length, 11);
  assert.ok(paired.every((item) => item.authoringGate.status === "verified-work-only-authoring-audit"));
  assert.ok(paired.every((item) => item.authoringGate.namedDialogOperatorSupplied));
  assert.ok(paired.every((item) => item.authoringGate.animateGuiExecutionEstablished));
  assert.ok(paired.every((item) => item.authoringGate.authoringAuditEstablished));
  assert.ok(paired.every((item) => item.authoringGate.selectedPassingAudit?.acceptanceEffect === false));
  assert.ok(paired.every((item) => item.authoringGate.animateQueueOrdinal !== null));
  assert.ok(swfOnly.every((item) => item.authoringGate.status === "not-applicable-swf-only"));
  assert.ok(swfOnly.every((item) => item.authoringGate.animateQueueOrdinal === null));
  assert.ok(swfOnly.every((item) => item.authoringGate.authoringAuditEstablished === false));
});

test("validator fails closed on source, execution, evidence, or authority promotion", async () => {
  const report = await buildAuthoritativeRuntimeAcquisitionContract();

  const source = clone(report);
  source.sourceBindings.machineSourceAudits.sha256 = "0".repeat(63);
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(source), /input binding drifted/);

  const execution = clone(report);
  execution.executionGate.perItemCaptureAuthorized = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(execution), /execution gate was opened/);

  const runtimeCandidate = clone(report);
  runtimeCandidate.runtimeEnvironmentCandidate.executionAuthorized = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(runtimeCandidate), /environment candidate identity or disposition drifted/);

  const workspaceRuntime = clone(report);
  workspaceRuntime.items[0].runtimeEnvironmentPrerequisite.runtimeApprovedByOwner = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(workspaceRuntime), /runtime environment prerequisite/);

  const containment = clone(report);
  containment.runtimeContainmentBoundary.controls[0].approved = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(containment), /containment boundary/);

  const workspaceContainment = clone(report);
  workspaceContainment.items[0].runtimeContainmentPrerequisite.safeToExecuteNow = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(workspaceContainment), /runtime containment prerequisite/);

  const evidence = clone(report);
  evidence.items[0].currentEvidenceState.authoritativeBaselinePackageEstablished = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(evidence), /runtime or acceptance evidence state unexpectedly opened/);

  const ruffle = clone(report);
  ruffle.items[0].forensicReferenceBoundary.authoritativeOriginalRuntimeEvidence = true;
  assert.throws(() => validateAuthoritativeRuntimeAcquisitionContract(ruffle), /authority was promoted/);
});

test("Markdown exposes the executable boundary and all 40 queue rows", async () => {
  const report = await buildAuthoritativeRuntimeAcquisitionContract();
  const markdown = renderMarkdown(report);
  assert.match(markdown, /40-member lesson evidence queue/);
  assert.match(markdown, /29\/29 paired FLA\/SWF audits are verified as work-only evidence/);
  assert.match(markdown, /Adobe Flash Player Projector 32\.0\.0\.414/);
  assert.match(markdown, /not owner-approved or authorized for execution/);
  assert.match(markdown, /23 exact static operations across 3 members/);
  assert.match(markdown, /8 controls specified \/ 0 approved/);
  assert.match(markdown, /0\/40 authoritative baseline packages/);
  assert.match(markdown, /Ruffle remains forensic-only/);
  assert.match(markdown, /frameDomain/);
  assert.match(markdown, /closed for original-runtime acquisition/);
  assert.equal((markdown.match(/\| closed \|/g) || []).length, 40);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI accepts deterministic report/check outputs but no launch or approval switches", () => {
  const options = parseArguments([
    "--check",
    "--json-output", "reports/a.json",
    "--markdown-output", "reports/a.md",
  ]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--launch-animate"]), /Unknown option/);
  assert.throws(() => parseArguments(["--run-original-runtime"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
});
