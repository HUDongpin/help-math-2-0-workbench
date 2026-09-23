import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  deriveObservedState,
  selectSnapshotProfile,
} from "./capture-lesson-current-state-snapshot-v1.mjs";

const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";

async function readProjectJson(relativePath) {
  return JSON.parse(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));
}

function diagnostic(commandId, outcome = "passed") {
  return {commandId, outcome};
}

async function currentEvidence() {
  const [
    profiles,
    releaseManifest,
    releaseLedger,
    workspace,
    sourceScope,
    runtimePlanning,
    authoringReadiness,
  ] = await Promise.all([
    readProjectJson("catalog/g5-l5-current-state-snapshot-profile.json"),
    readProjectJson("catalog/lesson-releases.json"),
    readProjectJson("catalog/lesson-release-ledger.json"),
    readProjectJson("reports/g5-l5-workspace-readiness.json"),
    readProjectJson("reports/g5-l5-source-scope-freeze.json"),
    readProjectJson("reports/g05-l05-add-subtract-negative-numbers-runtime-acquisition-planning-readiness.json"),
    readProjectJson("reports/g5-l5-animate-authoring-operator-readiness.json"),
  ]);
  const release = releaseManifest.releases.find(({releaseId}) => releaseId === RELEASE_ID);
  assert.ok(release, "G5 L5 release definition must exist");
  return {
    profiles,
    release,
    releaseLedger,
    workspace,
    sourceScope,
    runtimePlanning,
    authoringReadiness,
  };
}

test("G5 L5 snapshot profile binds only independent 57-member planning evidence", async () => {
  const {profiles} = await currentEvidence();
  const profile = selectSnapshotProfile(profiles, RELEASE_ID);
  assert.equal(profile.observedStateSource.mode, "fail-closed-planning");
  assert.equal(profile.observedStateSource.expectedMemberCount, 57);
  assert.equal(profile.observedStateSource.structuralRootFrameCount, 610);
  assert.equal(profile.outputDirectory, "reports/current-state-snapshots/g5-l5-source-planning-entry-2026-07-28");
  assert.ok(profile.inputArtifacts.some(({logicalId}) => logicalId === "lesson-release-ledger"));
  assert.ok(profile.inputArtifacts.some(({logicalId}) => logicalId === "g5-l5-runtime-planning-readiness"));
  assert.ok(profile.inputArtifacts.some(({logicalId}) => logicalId === "g5-l5-authoring-readiness"));
  assert.ok(profile.inputArtifacts.every(({logicalId}) => !logicalId.includes("g5-l4")));
  assert.ok(profile.inputArtifacts.every(({artifactType}) => !artifactType.includes("m0-governance")));
  assert.match(profile.temporalBoundary.statement, /before authoritative runtime acquisition or renderer implementation/);
});

test("G5 L5 M0 machine-packet snapshot is a new fail-closed receipt profile", async () => {
  const [
    profiles,
    m0,
    m1,
    specification,
    missingKeyTerm,
    ruffle,
  ] = await Promise.all([
    readProjectJson("catalog/g5-l5-m0-machine-packet-snapshot-profile-v3.json"),
    readProjectJson("reports/g5-l5-m0-governance-readiness.json"),
    readProjectJson("reports/g5-l5-m1-machine-foundation-readiness.json"),
    readProjectJson("reports/g5-l5-specification-readiness.json"),
    readProjectJson("reports/g5-l5-missing-keyterm-recovery-readiness.json"),
    readProjectJson("reports/g5-l5-ruffle-reference-matrix.json"),
  ]);
  const profile = selectSnapshotProfile(profiles, RELEASE_ID);
  assert.equal(profile.snapshotId, "g5-l5-m0-machine-packet-2026-07-28-v3");
  assert.equal(
    profile.outputDirectory,
    "reports/current-state-snapshots/g5-l5-m0-machine-packet-2026-07-28-v3",
  );
  assert.equal(profile.observedStateSource.mode, "fail-closed-planning");
  assert.equal(profile.observedStateSource.expectedMemberCount, 57);
  assert.equal(profile.observedStateSource.structuralRootFrameCount, 610);
  const logicalIds = new Set(profile.inputArtifacts.map(({logicalId}) => logicalId));
  for (const required of [
    "g5-l5-missing-keyterm-recovery",
    "g5-l5-promotion-security",
    "g5-l5-specification-readiness",
    "g5-l5-m0-governance",
    "g5-l5-m1-machine-foundation",
    "g5-l5-ruffle-reference",
  ]) {
    assert.ok(logicalIds.has(required), `missing snapshot input ${required}`);
  }
  assert.ok([...logicalIds].every((logicalId) => !logicalId.includes("g5-l4")));
  const commandIds = new Set(profile.diagnosticCommands.map(({commandId}) => commandId));
  for (const required of [
    "check-protected-completion-ledger",
    "check-lesson-release-ledger",
    "check-pre-runtime-specification-candidates",
    "check-missing-keyterm-recovery",
    "check-promotion-security",
    "check-specification-readiness",
    "check-m0-governance",
    "check-m1-machine-foundation",
    "check-ruffle-reference",
    "g5-l5-machine-packet-tests",
  ]) {
    assert.ok(commandIds.has(required), `missing snapshot diagnostic ${required}`);
  }
  assert.equal(commandIds.has("check-completion-ledger"), false);
  assert.equal(commandIds.has("check-release-ledger"), false);
  assert.ok(
    profile.diagnosticCommands.every(({argv}) =>
      !argv.some((argument) => argument.includes("snapshot:g5:l5:m0-machine-packet"))),
    "snapshot diagnostics must not recursively check the snapshot being created",
  );
  assert.equal(m0.summary.requiredRoleCount, 7);
  assert.equal(m0.summary.requiredNamedRoleSlotCount, 14);
  assert.equal(m0.summary.requiredPrimaryHoursPerWeekFloorTotal, 64);
  assert.equal(m0.summary.namedPersonCount, 0);
  assert.equal(m0.summary.m0ExitReady, false);
  assert.equal(m0.summary.m1StartAuthorized, false);
  assert.equal(m1.readiness.m1ExecutionReady, false);
  assert.equal(specification.summary.memberCount, 57);
  assert.equal(specification.summary.implementationSpecificationReadyCount, 0);
  assert.equal(
    missingKeyTerm.targets.every(({exactCandidateCount, importAuthorized}) =>
      exactCandidateCount === 0 && importAuthorized === false),
    true,
  );
  assert.equal(ruffle.summary.queueItems, 57);
  assert.equal(ruffle.summary.representativeDiagnosticsPassed, 8);
  assert.equal(ruffle.summary.authoritativeOriginalRuntimeEvidence, 0);
  assert.equal(ruffle.summary.strictMigrationCompletions, 0);
  assert.equal(ruffle.summary.publications, 0);
});

test("G5 L5 observed state is derived fail-closed from current release, ledger, workspace, and reports", async () => {
  const evidence = await currentEvidence();
  assert.equal(evidence.release.expectedCounts.activeXmlReferencedPages, 56);
  assert.equal(evidence.release.expectedCounts.courseShells, 1);
  assert.equal(evidence.release.expectedCounts.members, 57);
  assert.equal(evidence.workspace.summary.draftValidationPassCount, 57);
  assert.equal(evidence.workspace.summary.implementationStartedCount, 0);
  assert.equal(evidence.runtimePlanning.summary.runtimeSessionCount, 0);
  assert.equal(evidence.authoringReadiness.summary.authoringAuditsEstablished, 0);

  const observed = deriveObservedState({
    release: evidence.release,
    workspace: evidence.workspace,
    sourceScope: evidence.sourceScope,
    releaseLedger: evidence.releaseLedger,
    runtimePlanning: evidence.runtimePlanning,
    authoringReadiness: evidence.authoringReadiness,
    commands: [
      diagnostic("check-protected-completion-ledger"),
      diagnostic("check-lesson-release-ledger"),
    ],
  });

  assert.deepEqual({
    expectedMemberCount: observed.expectedMemberCount,
    draftValidWorkspaceCount: observed.draftValidWorkspaceCount,
    implementationStartedCount: observed.implementationStartedCount,
    strictCompleteCount: observed.strictCompleteCount,
    published: observed.published,
    publicRoutesOpen: observed.publicRoutesOpen,
    authoritativeRuntimeSessionCount: observed.authoritativeRuntimeSessionCount,
    authoringAuditCount: observed.authoringAuditCount,
    audioAcceptedFileCount: observed.audioAcceptedFileCount,
    ownerDecisionReceiptCount: observed.ownerDecisionReceiptCount,
    namedRoleAssignmentReceiptCount: observed.namedRoleAssignmentReceiptCount,
    machinePacketReadyForOwnerReview: observed.machinePacketReadyForOwnerReview,
    m0ExitReady: observed.m0ExitReady,
    m1Authorized: observed.m1Authorized,
  }, {
    expectedMemberCount: 57,
    draftValidWorkspaceCount: 57,
    implementationStartedCount: 0,
    strictCompleteCount: 0,
    published: false,
    publicRoutesOpen: false,
    authoritativeRuntimeSessionCount: 0,
    authoringAuditCount: 0,
    audioAcceptedFileCount: 0,
    ownerDecisionReceiptCount: 0,
    namedRoleAssignmentReceiptCount: 0,
    machinePacketReadyForOwnerReview: false,
    m0ExitReady: false,
    m1Authorized: false,
  });
  assert.equal(observed.completionLedgerCurrent, true);
  assert.equal(observed.releaseLedgerCurrent, true);
});

test("G5 L5 observed state rejects release-ledger identity or strict-state drift", async () => {
  const evidence = await currentEvidence();
  const driftedIdentity = structuredClone(evidence.releaseLedger);
  const releaseEntry = driftedIdentity.releases.find(({releaseId}) => releaseId === RELEASE_ID);
  releaseEntry.members[0].assetId = "swf-" + "0".repeat(64);
  assert.throws(
    () => deriveObservedState({
      release: evidence.release,
      workspace: evidence.workspace,
      sourceScope: evidence.sourceScope,
      releaseLedger: driftedIdentity,
      runtimePlanning: evidence.runtimePlanning,
      authoringReadiness: evidence.authoringReadiness,
      commands: [],
    }),
    /ledger member identities differ/,
  );

  const driftedStrict = structuredClone(evidence.releaseLedger);
  driftedStrict.releases.find(({releaseId}) => releaseId === RELEASE_ID).strictCompleteCount = 1;
  assert.throws(
    () => deriveObservedState({
      release: evidence.release,
      workspace: evidence.workspace,
      sourceScope: evidence.sourceScope,
      releaseLedger: driftedStrict,
      runtimePlanning: evidence.runtimePlanning,
      authoringReadiness: evidence.authoringReadiness,
      commands: [],
    }),
    /strict counts differ/,
  );
});
