import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {after, before, test} from "node:test";

import {
  buildG5L4M1MachineFoundationReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateG5L4M1MachineFoundationReport,
  writeOrCheck,
} from "./build-g5-l4-m1-machine-foundation-readiness.mjs";

let currentReport;

before(async () => {
  currentReport = await buildG5L4M1MachineFoundationReadiness();
});

test("builds the exact acceptance-neutral 55-member M1 machine foundation", () => {
  assert.equal(validateG5L4M1MachineFoundationReport(currentReport), true);
  assert.deepEqual(
    {
      members: currentReport.summary.releaseMemberCount,
      scaffolded: currentReport.summary.scaffoldedAndDraftValidCount,
      machineAudits: currentReport.summary.staticMachineAuditCurrentCount,
      machineOutputs:
        currentReport.allMemberMachineFoundation.staticMachineAudit.pinnedOutputCount,
      runtimePlans: currentReport.summary.emptyRuntimePlanningCount,
      runtimeSessions: currentReport.summary.originalRuntimeSessionCount,
      ownerDefaultPolicyReceipts:
        currentReport.summary.ownerDefaultPolicyAuthorizationReceiptCount,
      ownerWorkAuthorizationReceipts:
        currentReport.summary.ownerWorkAuthorizationReceiptCount,
      implementationWorkAuthorized:
        currentReport.summary.implementationWorkAuthorized,
      runtimeExecutionWorkAuthorized:
        currentReport.summary.runtimeExecutionWorkAuthorized,
      policyApproved: currentReport.summary.policyApproved,
      preparationAuthorized: currentReport.summary.preparationAuthorized,
      unsignedPendingSignaturePackagePreparation:
        currentReport.summary
          .unsignedPendingOwnerSignaturePackagePreparationAuthorized,
      containmentControls:
        currentReport.summary.containmentControlsSpecifiedCount,
      containmentPolicyApproved:
        currentReport.summary.containmentPolicyApprovedControlCount,
      containmentPreparationAuthorized:
        currentReport.summary.containmentPreparationAuthorizedControlCount,
      technicalMechanismsSelected:
        currentReport.summary.technicalMechanismSelectedCount,
      containmentApproved:
        currentReport.summary.containmentControlsApprovedCount,
      technicalMechanismsVerified:
        currentReport.summary.technicalMechanismVerifiedCount,
      completeHostTrees:
        currentReport.summary.completeReadOnlyHostTreeCount,
      runtimeExecutionReady:
        currentReport.summary.originalRuntimeExecutionReadyCount,
      namedPrimaryOperatorRoles:
        currentReport.summary.ownerAttestedNamedPrimaryOperatorAssignmentCount,
      ownerDecisionReceipts: currentReport.summary.ownerDecisionReceiptCount,
      ownerDecisionM0Satisfied:
        currentReport.summary.ownerDecisionM0SatisfiedCount,
      namedRoleSlots: currentReport.summary.ownerAttestedNamedRoleSlotCount,
      weeklyCommitments: currentReport.summary.weeklyCapacityCommitmentCount,
      capacityFloorsSatisfied:
        currentReport.summary.capacityFloorSatisfiedRoleSlotCount,
      effectiveBackups: currentReport.summary.effectiveBackupCoverageCount,
      budgetGatesApproved: currentReport.summary.budgetGateApprovedCount,
      m0ExitReady: currentReport.summary.m0ExitReady,
      portableOperatorIdentities:
        currentReport.summary.portableExternallyVerifiedNamedOperatorAssignmentCount,
      workStudyPrepared: currentReport.summary.workStudyPreparedCount,
      workStudyCompleted: currentReport.summary.workStudyCompletedCount,
      sourceStaticCandidates:
        currentReport.summary.sourceStaticEngineeringCandidateCount,
      rendererSelected: currentReport.summary.rendererSelectedCount,
      routesDeclared: currentReport.summary.routeDeclaredCount,
      implementationStarted: currentReport.summary.implementationStartedCount,
      implementationAuthorized:
        currentReport.summary.implementationAuthorizedCount,
      strictComplete: currentReport.summary.strictCompleteCount,
      published: currentReport.summary.publishedCount,
    },
    {
      members: 55,
      scaffolded: 55,
      machineAudits: 55,
      machineOutputs: 385,
      runtimePlans: 55,
      runtimeSessions: 0,
      ownerDefaultPolicyReceipts: 1,
      ownerWorkAuthorizationReceipts: 1,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      policyApproved: true,
      preparationAuthorized: true,
      unsignedPendingSignaturePackagePreparation: true,
      containmentControls: 8,
      containmentPolicyApproved: 8,
      containmentPreparationAuthorized: 8,
      technicalMechanismsSelected: 8,
      containmentApproved: 0,
      technicalMechanismsVerified: 0,
      completeHostTrees: 0,
      runtimeExecutionReady: 0,
      namedPrimaryOperatorRoles: 1,
      ownerDecisionReceipts: 4,
      ownerDecisionM0Satisfied: 2,
      namedRoleSlots: 12,
      weeklyCommitments: 12,
      capacityFloorsSatisfied: 0,
      effectiveBackups: 0,
      budgetGatesApproved: 0,
      m0ExitReady: false,
      portableOperatorIdentities: 0,
      workStudyPrepared: 4,
      workStudyCompleted: 0,
      sourceStaticCandidates: 52,
      rendererSelected: 52,
      routesDeclared: 52,
      implementationStarted: 52,
      implementationAuthorized: 0,
      strictComplete: 0,
      published: 0,
    },
  );
  assert.deepEqual(
    currentReport.workStudyEnhancedPreparation.members.map((member) =>
      member.animationId),
    [
      "shell-course-g05-l04-index-local",
      "course-g05-l04-rw-002",
      "course-g05-l04-in-019",
      "course-g05-l04-fq-002",
    ],
  );
  assert.equal(
    currentReport.sourceBindings.workStudyArtifactSet.artifactCount,
    32,
  );
  assert.equal(
    currentReport.workStudyEnhancedPreparation.staticSwfDefinitionCount,
    2397,
  );
  assert.equal(
    currentReport.workStudyEnhancedPreparation.machineDefinitionInventoryRowCount,
    2397,
  );
  assert.deepEqual(
    currentReport.sourceStaticEngineeringCandidates.members.map((member) =>
      member.animationId),
    [
      "course-g05-l04-ir-001-a662633d",
      "course-g05-l04-rw-002",
      "course-g05-l04-rw-003",
      "course-g05-l04-rw-004",
      "course-g05-l04-vb-002",
      "course-g05-l04-vb-003",
      "course-g05-l04-vb-004",
      "course-g05-l04-vb-005",
      "course-g05-l04-vb-006",
      "course-g05-l04-vb-007",
      "course-g05-l04-vb-008",
      "course-g05-l04-vb-009",
      "course-g05-l04-vb-010",
      "course-g05-l04-vb-011",
      "course-g05-l04-in-002",
      "course-g05-l04-in-003",
      "course-g05-l04-in-004",
      "course-g05-l04-in-005",
      "course-g05-l04-in-006",
      "course-g05-l04-in-007",
      "course-g05-l04-in-008",
      "course-g05-l04-in-009",
      "course-g05-l04-in-010",
      "course-g05-l04-in-011",
      "course-g05-l04-in-012",
      "course-g05-l04-in-013",
      "course-g05-l04-in-014",
      "course-g05-l04-in-015",
      "course-g05-l04-in-016",
      "course-g05-l04-in-017",
      "course-g05-l04-in-018",
      "course-g05-l04-in-019",
      "course-g05-l04-in-020",
      "course-g05-l04-in-021",
      "course-g05-l04-in-022",
      "course-g05-l04-ti-002",
      "course-g05-l04-ti-003",
      "course-g05-l04-ti-004",
      "course-g05-l04-ti-005",
      "course-g05-l04-ti-006",
      "course-g05-l04-ti-007",
      "course-g05-l04-ti-008",
      "course-g05-l04-ti-009",
      "course-g05-l04-gs-002",
      "course-g05-l04-ts-002",
      "course-g05-l04-ts-003",
      "course-g05-l04-ts-004",
      "course-g05-l04-ts-005",
      "course-g05-l04-ts-006",
      "course-g05-l04-ts-007",
      "course-g05-l04-ts-008",
      "course-g05-l04-fq-001",
    ],
  );
  assert.deepEqual(
    currentReport.sourceStaticEngineeringCandidates.members.map((member) =>
      member.ordinal),
    Array.from({length: 52}, (_, index) => index + 1),
  );
  assert.deepEqual(
    {
      candidateCount:
        currentReport.sourceStaticEngineeringCandidates.candidateCount,
      manifestBoundSingleSpriteCandidateCount:
        currentReport.sourceStaticEngineeringCandidates
          .manifestBoundSingleSpriteCandidateCount,
      fullSingleSpriteCandidateCount:
        currentReport.sourceStaticEngineeringCandidates
          .fullSingleSpriteCandidateCount,
      safePrefixSingleSpriteCandidateCount:
        currentReport.sourceStaticEngineeringCandidates
          .safePrefixSingleSpriteCandidateCount,
      independentDualSpriteCompositeCandidateCount:
        currentReport.sourceStaticEngineeringCandidates
          .independentDualSpriteCompositeCandidateCount,
      openFrameCount:
        currentReport.sourceStaticEngineeringCandidates.openFrameCount,
      blockedTailFrameCount:
        currentReport.sourceStaticEngineeringCandidates.blockedTailFrameCount,
      manifestBoundCanonicalFrameCount:
        currentReport.sourceStaticEngineeringCandidates
          .manifestBoundCanonicalFrameCount,
      canonicalNestedCoverageCandidateCount:
        currentReport.sourceStaticEngineeringCandidates
          .canonicalNestedCoverageCandidateCount,
    },
    {
      candidateCount: 52,
      manifestBoundSingleSpriteCandidateCount: 51,
      fullSingleSpriteCandidateCount: 20,
      safePrefixSingleSpriteCandidateCount: 31,
      independentDualSpriteCompositeCandidateCount: 1,
      openFrameCount: 13696,
      blockedTailFrameCount: 3020,
      manifestBoundCanonicalFrameCount: 16664,
      canonicalNestedCoverageCandidateCount: 51,
    },
  );
  const candidateIds = new Set(
    currentReport.sourceStaticEngineeringCandidates.members.map((member) =>
      member.animationId),
  );
  for (const animationId of [
    "course-g05-l04-fq-002",
    "course-g05-l04-fq-003",
    "shell-course-g05-l04-index-local",
  ]) {
    assert.equal(candidateIds.has(animationId), false);
  }
  assert.ok(currentReport.sourceStaticEngineeringCandidates.members.every((member) =>
    member.rendererSelected === true &&
    member.routeDeclared === true &&
    member.implementationStarted === true &&
    member.implementationAuthorized === false &&
    member.candidateState.rootEnabled === false &&
    member.candidateState.spanishEnabled === false &&
    member.candidateState.audioEnabled === false &&
    member.candidateState.originalRuntimeBaselineUsed === false &&
    member.candidateState.rmseComputed === false &&
    member.strictComplete === false &&
    member.published === false));
  assert.equal(
    currentReport.workStudyEnhancedPreparation.canonicalAssetInventoryRowCount,
    2397,
  );
  assert.equal(
    currentReport.workStudyEnhancedPreparation.canonicalKeyframeRowCount,
    42,
  );
  assert.equal(
    currentReport.workStudyEnhancedPreparation
      .canonicalInventoryRowsSourceDerivedCandidateOnly,
    true,
  );
  assert.equal(
    currentReport.workStudyEnhancedPreparation
      .canonicalInventoryRowsFinalSpecification,
    false,
  );
  assert.equal(currentReport.namedOperatorAssignment.assigneeFullName, "Dr. Peter Hu");
  assert.equal(currentReport.namedOperatorAssignment.committedHoursPerWeek, 1);
  assert.equal(currentReport.namedOperatorAssignment.capacityEstablished, false);
  assert.equal(currentReport.namedOperatorAssignment.backupSlotIntentRecorded, true);
  assert.equal(currentReport.namedOperatorAssignment.backupCommittedHoursPerWeek, 1);
  assert.equal(
    currentReport.namedOperatorAssignment.effectiveBackupCoverageEstablished,
    false,
  );
  assert.equal(currentReport.namedOperatorAssignment.animateGuiAuthorized, false);
  assert.equal(currentReport.namedOperatorAssignment.originalRuntimeAuthorized, false);
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimePlanning
      .namedOperatorRoleAssignmentCount,
    1,
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimePlanning
      .plansWithNamedOperatorRoleAssignmentCount,
    55,
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimePlanning
      .sessionOperatorAttestationCount,
    0,
  );
  assert.equal(
    currentReport.sourceBindings.primaryOriginalRuntimeOperatorAssignmentReceipt.path,
    "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
  );
  assert.equal(
    currentReport.sourceBindings.ownerDefaultBlockersAuthorizationReceipt.path,
    "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  );
  assert.equal(
    currentReport.sourceBindings.ownerWorkAuthorizationReceipt.path,
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
  );
  assert.equal(
    currentReport.sourceBindings.m0GovernanceRequirements.path,
    "catalog/lesson-release-m0-governance.json",
  );
  assert.equal(
    currentReport.sourceBindings.m0OwnerGovernanceReceipt.path,
    "catalog/owner-authorizations/g5-l4-m0-owner-governance-intake-2026-07-28.json",
  );
  assert.deepEqual(
    {
      decisions: currentReport.m0Governance.ownerDecisionReceiptCount,
      satisfied: currentReport.m0Governance.ownerDecisionM0SatisfiedCount,
      roleSlots: currentReport.m0Governance.namedRoleSlotIntentCount,
      commitments: currentReport.m0Governance.weeklyCapacityCommitmentCount,
      capacityFloors: currentReport.m0Governance.capacityFloorSatisfiedCount,
      effectiveBackups: currentReport.m0Governance.effectiveBackupCoverageCount,
      budgetGates: currentReport.m0Governance.budgetGateApprovedCount,
      m0Closed: currentReport.m0Governance.m0Closed,
    },
    {
      decisions: 4,
      satisfied: 2,
      roleSlots: 12,
      commitments: 12,
      capacityFloors: 0,
      effectiveBackups: 0,
      budgetGates: 0,
      m0Closed: false,
    },
  );
  assert.equal(currentReport.ownerWorkAuthorization.implementationWorkAuthorized, true);
  assert.equal(
    currentReport.ownerWorkAuthorization.runtimeExecutionWorkAuthorized,
    true,
  );
  assert.equal(
    currentReport.ownerWorkAuthorization.runtimeExecutionWorkAuthorizationBasis,
    "user-attested-prospective-owner-direction",
  );
  assert.equal(
    currentReport.ownerWorkAuthorization.implementationAuthorizedCountEffect,
    0,
  );
  for (const key of [
    "technicalMechanismsApproved",
    "technicalMechanismsVerified",
    "runtimeHostApproved",
    "immutableSessionAuthorizationEstablished",
    "runtimeExecutionAuthorized",
    "lessonSpecificSubstitution",
    "fidelityAccepted",
    "strictComplete",
    "publicationAuthorized",
  ]) {
    assert.equal(currentReport.ownerWorkAuthorization[key], false, key);
  }
  assert.equal(
    currentReport.sourceBindings.originalRuntimeContainmentReadiness.path,
    "reports/g5-l4-original-runtime-containment-readiness.json",
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimeContainment.controlsSpecified,
    8,
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimeContainment.policyApproved,
    true,
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimeContainment
      .preparationAuthorized,
    true,
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimeContainment.controlsApproved,
    0,
  );
  assert.equal(
    currentReport.allMemberMachineFoundation.runtimeContainment.runnable,
    false,
  );
  assert.deepEqual(
    {
      blockerNumbers:
        currentReport.ownerDefaultPolicyAuthorization.blockerReferenceSet
          .blockerNumbers,
      directiveBytes:
        currentReport.ownerDefaultPolicyAuthorization.ownerDirective.byteLength,
      directiveSha256:
        currentReport.ownerDefaultPolicyAuthorization.ownerDirective.sha256,
      policyApproved:
        currentReport.ownerDefaultPolicyAuthorization.policyApproved,
      preparationAuthorized:
        currentReport.ownerDefaultPolicyAuthorization.preparationAuthorized,
      technicalMechanismSelectionAuthorized:
        currentReport.ownerDefaultPolicyAuthorization
          .technicalMechanismSelectionAuthorized,
      runtimeExecutionAuthorized:
        currentReport.ownerDefaultPolicyAuthorization.runtimeExecutionAuthorized,
    },
    {
      blockerNumbers: [2, 3, 4],
      directiveBytes: 84,
      directiveSha256:
        "f9e39425a4d3ad8baafab9e3cb4020dba4c90b4ebc0c043d743d46309f8ee0ef",
      policyApproved: true,
      preparationAuthorized: true,
      technicalMechanismSelectionAuthorized: false,
      runtimeExecutionAuthorized: false,
    },
  );
  assert.ok(Object.values(currentReport.acceptanceEffects).every((value) =>
    value === false));
});

test("is deterministic and renders the evidence boundary explicitly", async () => {
  const rebuilt = await buildG5L4M1MachineFoundationReadiness();
  assert.equal(stableJson(rebuilt), stableJson(currentReport));
  const markdown = renderMarkdown(currentReport);
  assert.match(markdown, /original-runtime sessions: \*\*0\*\*/);
  assert.match(
    markdown,
    /fail-closed policy \/ machine preparation authorized: \*\*true \/ true\*\*/,
  );
  assert.match(
    markdown,
    /technical mechanisms selected \/ approved \/ verified \*\*8\/8 \/ 0\/8 \/ 0\/8\*\*/,
  );
  assert.match(markdown, /Original-runtime containment: \*\*8\/8\*\* controls specified/);
  assert.match(markdown, /Owner decisions recorded \/ M0-satisfied: \*\*4\/4 \/ 2\/4\*\*/);
  assert.match(markdown, /named role slots \/ weekly commitments: \*\*12\/12 \/ 12\/12\*\*/);
  assert.match(markdown, /capacity floors satisfied: \*\*0\/12\*\*; effective backups: \*\*0\/6\*\*/);
  assert.match(markdown, /Budget gates approved: \*\*0\/3\*\*/);
  assert.match(markdown, /Primary operator: \*\*Dr\. Peter Hu\*\*/);
  assert.match(markdown, /Required \/ committed weekly hours: \*\*20 \/ 1\*\*/);
  assert.match(markdown, /effective backup continuity: \*\*true \/ 1 \/ false\*\*/);
  assert.match(markdown, /completed human work studies: \*\*0\/4\*\*/);
  assert.match(markdown, /static SWF definitions: \*\*2397\*\*/);
  assert.match(
    markdown,
    /source-derived asset\/keyframe candidate rows: \*\*2397\/42\*\*/,
  );
  assert.match(markdown, /final specification ready: \*\*0\/4\*\*/);
  assert.match(
    markdown,
    /engineering candidates \/ renderer selected \/ route declared \/ implementation started: \*\*52\/55 \/ 52\/55 \/ 52\/55 \/ 52\/55\*\*; implementation authorized: \*\*0\/55\*\*/,
  );
  assert.match(
    markdown,
    /Fifty-two bounded canonical current-JavaScript engineering candidates/,
  );
  assert.match(markdown, /51 are manifest-bound single-sprite candidates \(20 full and 31 safe-prefix\)/);
  assert.match(
    markdown,
    /FQ002 and FQ003 product-only question atlases and the lesson shell remain outside this canonical candidate set/,
  );
  assert.match(markdown, /strict \/ published: \*\*0 \/ 0 \/ 0\/55 \/ 0\/55\*\*/);
  assert.match(markdown, /Strict acceptance effect: \*\*none\*\*/);
});

test("validator fails closed on M0 governance, runtime, implementation, work-study, and release promotion", () => {
  for (const mutate of [
    (report) => {
      report.summary.originalRuntimeSessionCount = 1;
    },
    (report) => {
      report.allMemberMachineFoundation.runtimeContainment.controlsApproved = 1;
    },
    (report) => {
      report.ownerDefaultPolicyAuthorization.policyApproved = false;
    },
    (report) => {
      report.ownerDefaultPolicyAuthorization
        .technicalMechanismSelectionAuthorized = true;
    },
    (report) => {
      report.summary.technicalMechanismSelectedCount = 1;
    },
    (report) => {
      report.allMemberMachineFoundation.runtimeContainment.runnable = true;
    },
    (report) => {
      report.namedOperatorAssignment.animateGuiAuthorized = true;
    },
    (report) => {
      report.namedOperatorAssignment.actualOriginalRuntimeSessionEstablished = true;
    },
    (report) => {
      report.summary.portableExternallyVerifiedNamedOperatorAssignmentCount = 1;
    },
    (report) => {
      report.summary.ownerDecisionReceiptCount = 3;
    },
    (report) => {
      report.m0Governance.ownerDecisionM0SatisfiedCount = 4;
    },
    (report) => {
      report.summary.ownerAttestedNamedRoleSlotCount = 11;
    },
    (report) => {
      report.summary.capacityFloorSatisfiedRoleSlotCount = 1;
    },
    (report) => {
      report.m0Governance.effectiveBackupCoverageCount = 1;
    },
    (report) => {
      report.summary.budgetGateApprovedCount = 1;
    },
    (report) => {
      report.m0Governance.m0Closed = true;
    },
    (report) => {
      report.summary.roadmapPortableExternalSignatureVerified = true;
    },
    (report) => {
      report.namedOperatorAssignment.committedHoursPerWeek = 20;
    },
    (report) => {
      report.summary.implementationStartedCount = 1;
    },
    (report) => {
      report.summary.implementationAuthorizedCount = 1;
    },
    (report) => {
      report.ownerWorkAuthorization.technicalMechanismsApproved = true;
    },
    (report) => {
      report.ownerWorkAuthorization.runtimeExecutionAuthorized = true;
    },
    (report) => {
      report.runtimeExecutionAuthorized = true;
    },
    (report) => {
      report.summary.runtimeExecutionAuthorized = true;
    },
    (report) => {
      report.acceptanceEffects.runtimeExecutionAuthorized = true;
    },
    (report) => {
      report.sourceBindings.runtimeExecutionAuthorized = true;
    },
    (report) => {
      report.release.strictComplete = true;
    },
    (report) => {
      report.sourceStaticEngineeringCandidates.members[0].animationId =
        "course-g05-l04-vb-003";
    },
    (report) => {
      report.sourceStaticEngineeringCandidates.members[0]
        .candidateState.rootEnabled = true;
    },
    (report) => {
      report.sourceStaticEngineeringCandidates.members[0]
        .candidateState.sourceStaticFrameCount += 1;
    },
    (report) => {
      report.workStudyEnhancedPreparation.completedCount = 1;
    },
    (report) => {
      report.workStudyEnhancedPreparation.members[0].rendererSelected = true;
    },
    (report) => {
      report.summary.strictCompleteCount = 1;
    },
    (report) => {
      report.acceptanceEffects.ownerFidelityAccepted = true;
    },
    (report) => {
      report.summary.workStudyStaticSwfDefinitionCount = 2398;
    },
    (report) => {
      report.workStudyEnhancedPreparation.finalSpecificationReadyCount = 1;
    },
  ]) {
    const promoted = structuredClone(currentReport);
    mutate(promoted);
    assert.throws(() => validateG5L4M1MachineFoundationReport(promoted));
  }
});

test("argument parser permits a normalized reports prefix and rejects unsafe paths", () => {
  assert.deepEqual(
    parseArguments([
      "--check",
      "--output-prefix",
      "reports/test-g5-l4-m1-machine-foundation",
    ]),
    {
      check: true,
      outputPrefix: "reports/test-g5-l4-m1-machine-foundation",
    },
  );
  for (const argv of [
    ["--unknown"],
    ["--output-prefix"],
    ["--output-prefix", "../escape"],
    ["--output-prefix", "reports/../escape"],
    ["--output-prefix", "reports/result.json"],
    ["--output-prefix", "/tmp/result"],
  ]) {
    assert.throws(() => parseArguments(argv));
  }
});

test("paired writer rolls back an injected second-output failure and leaves no transaction debris", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g5-l4-m1-pair-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.join(root, "reports"));
  const outputPrefix = "reports/aggregate";
  await writeOrCheck({
    report: currentReport,
    projectRoot: root,
    outputPrefix,
  });
  const jsonPath = path.join(root, `${outputPrefix}.json`);
  const markdownPath = path.join(root, `${outputPrefix}.md`);
  const beforeJson = await readFile(jsonPath);
  const beforeMarkdown = await readFile(markdownPath);
  const replacement = structuredClone(currentReport);
  replacement.authority = `${replacement.authority} Test-only transaction variant.`;

  await assert.rejects(
    writeOrCheck({
      report: replacement,
      projectRoot: root,
      outputPrefix,
      transactionHooks: {
        async beforeInstall({index}) {
          if (index === 1) {
            const journal = JSON.parse(await readFile(
              path.join(root, `${outputPrefix}.transaction.json`),
              "utf8",
            ));
            assert.equal(journal.phase, "backed-up");
            assert.equal(journal.entries.length, 2);
            throw new Error("injected second-output failure");
          }
        },
      },
    }),
    /injected second-output failure/,
  );
  assert.deepEqual(await readFile(jsonPath), beforeJson);
  assert.deepEqual(await readFile(markdownPath), beforeMarkdown);
  assert.deepEqual(
    (await readdir(path.join(root, "reports")))
      .filter((name) => /\.(?:tmp|bak)-|transaction/.test(name)),
    [],
  );
  assert.equal(
    (await writeOrCheck({
      report: currentReport,
      projectRoot: root,
      outputPrefix,
      check: true,
    })).action,
    "verified",
  );
});

test("writer rejects symlinked ancestors and linked output targets", async (t) => {
  const roots = [];
  t.after(async () => {
    await Promise.all(roots.map((root) => rm(root, {recursive: true, force: true})));
  });

  const symlinkAncestorRoot = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-m1-symlink-ancestor-"),
  );
  roots.push(symlinkAncestorRoot);
  await mkdir(path.join(symlinkAncestorRoot, "real-reports"));
  await symlink(
    path.join(symlinkAncestorRoot, "real-reports"),
    path.join(symlinkAncestorRoot, "reports"),
  );
  await assert.rejects(
    writeOrCheck({
      report: currentReport,
      projectRoot: symlinkAncestorRoot,
      outputPrefix: "reports/aggregate",
    }),
    /output ancestor must be a real directory/,
  );

  for (const kind of ["symlink", "hardlink"]) {
    const root = await mkdtemp(path.join(os.tmpdir(), `g5-l4-m1-${kind}-`));
    roots.push(root);
    await mkdir(path.join(root, "reports"));
    const victim = path.join(root, "victim.json");
    const target = path.join(root, "reports/aggregate.json");
    const victimContents = `victim-${kind}\n`;
    await writeFile(victim, victimContents);
    if (kind === "symlink") await symlink(victim, target);
    else await link(victim, target);
    await assert.rejects(
      writeOrCheck({
        report: currentReport,
        projectRoot: root,
        outputPrefix: "reports/aggregate",
      }),
      /ordinary non-linked file/,
    );
    assert.equal((await readFile(victim, "utf8")), victimContents);
  }
});

test("checked-in report pair matches a fresh build", async () => {
  const result = await writeOrCheck({report: currentReport, check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.outputs.length, 2);
  for (const output of result.outputs) {
    assert.match(output.sha256, /^[a-f0-9]{64}$/);
    assert.equal(
      output.sha256,
      createHash("sha256").update(await readFile(output.path)).digest("hex"),
    );
  }
});
