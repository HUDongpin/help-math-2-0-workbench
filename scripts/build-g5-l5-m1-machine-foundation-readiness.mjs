#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildG5L5M0GovernanceReadiness,
  descriptor,
  ensureContainedOrdinaryDirectoryTree,
  fileRecord,
  G5_L5_EXPECTED_MEMBERS,
  G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR,
  G5_L5_PROFILE_PATH,
  G5_L5_RELEASE_ID,
  G5_L5_RELEASE_MANIFEST_PATH,
  jsonRecord,
  readContainedOrdinaryFile,
  sameDescriptor,
  selectG5L5Release,
  stableJson,
  validateG5L5M0GovernanceReport,
} from "./build-g5-l5-m0-governance-readiness.mjs";
import {
  readG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";
import {
  g5L5M1StaticReconciliationReceiptPath,
  readG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  G5_L5_STATIC_STRICT_READINESS_STATE,
  g5L5StaticStrictReadinessPath,
  readG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const M0_REPORT_PATH = "reports/g5-l5-m0-governance-readiness.json";
const SOURCE_SCOPE_PATH = "reports/g5-l5-source-scope-freeze.json";
const WORKSPACE_READINESS_PATH = "reports/g5-l5-workspace-readiness.json";
const RISK_CALIBRATION_PATH = "reports/g5-l5-risk-calibration.json";
const RUNTIME_PLANNING_PATH = "reports/g05-l05-add-subtract-negative-numbers-runtime-acquisition-planning-readiness.json";
const CONTAINMENT_PATH = "reports/g5-l5-original-runtime-containment-readiness.json";
const PROMOTION_SECURITY_PATH = "reports/g5-l5-promotion-security-readiness.json";
const ANIMATE_READINESS_PATH = "reports/g5-l5-animate-authoring-operator-readiness.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label} must be project-relative and portable`);
  const absolute = path.resolve(root, relativePath);
  const normalized = portable(path.relative(root, absolute));
  invariant(normalized && normalized !== ".." && !normalized.startsWith("../"), `${label} escapes the project root`);
  invariant(normalized === relativePath, `${label} must be normalized as ${normalized}`);
  return absolute;
}

function assertFalseFields(value, fields, label) {
  invariant(isObject(value), `${label} is missing`);
  for (const field of fields) invariant(value[field] === false, `${label}.${field} must remain false`);
}

function assertEmptyWorksheet(worksheet, animationId) {
  invariant(worksheet?.state === "empty-non-runnable-planning-only", `${animationId}: runtime worksheet state drifted`);
  for (const [key, value] of Object.entries(worksheet)) {
    if (key === "state" || key === "namedOperatorFieldMeaning") continue;
    invariant(Array.isArray(value) && value.length === 0, `${animationId}: runtime worksheet ${key} is not empty`);
  }
}

function receiptOutputDescriptor(output) {
  return {
    path: output.path,
    bytes: output.bytes,
    sha256: output.sha256,
  };
}

export async function buildG5L5MemberMachineFoundationInventory({
  root = projectRoot,
  release,
  sourceScopeRecord,
  workspaceRecord,
  riskRecord,
  runtimeRecord,
} = {}) {
  const workspaceById = new Map(workspaceRecord.value.workspaces.map((workspace) => [workspace.animationId, workspace]));
  const riskById = new Map(riskRecord.value.sourceBindings.machineAuditCoverage.members.map((member) => [member.animationId, member]));
  const runtimeById = new Map(runtimeRecord.value.items.map((item) => [item.animationId, item]));
  invariant(workspaceById.size === 57 && riskById.size === 57 && runtimeById.size === 57, "G5 L5 M1 upstream inventory is not exactly 57 members");

  const inventory = await Promise.all(release.members.map(async (member) => {
    const workspace = workspaceById.get(member.animationId);
    const risk = riskById.get(member.animationId);
    const runtime = runtimeById.get(member.animationId);
    invariant(
      workspace?.ordinal === member.ordinal &&
        workspace.assetId === member.assetId &&
        risk?.ordinal === member.ordinal &&
        risk.assetId === member.assetId &&
        runtime?.ordinal === member.ordinal &&
        runtime.assetId === member.assetId,
      `${member.animationId}: M1 inventory identity drifted`,
    );
    const staticReconciliationReceiptPath =
      g5L5M1StaticReconciliationReceiptPath(member.animationId);
    const strictReadinessPath =
      g5L5StaticStrictReadinessPath(member.animationId);
    const [
      manifestRecord,
      scopeBindingRecord,
      machineReportRecord,
      frameDomainsRecord,
      runtimePlanRecord,
      staticReconciliationReceiptIntake,
      strictReadinessIntake,
    ] = await Promise.all([
      jsonRecord(root, risk.migrationManifest.path, `${member.animationId} migration manifest`),
      jsonRecord(root, risk.scopeBinding.path, `${member.animationId} source-scope binding`),
      jsonRecord(root, risk.machineReport.path, `${member.animationId} machine report`),
      jsonRecord(root, risk.frameDomains.path, `${member.animationId} frame domains`),
      jsonRecord(root, runtime.artifact.path, `${member.animationId} runtime plan`),
      readG5L5M1StaticReconciliationReceipt({
        root,
        animationId: member.animationId,
        member,
      }),
      readG5L5StaticStrictReadiness({
        root,
        animationId: member.animationId,
        member,
      }),
    ]);
    const staticReconciliationReceipt =
      staticReconciliationReceiptIntake.receipt;
    const staticReconciliationReceiptBinding =
      staticReconciliationReceiptIntake.binding;
    const staticReconciliationPostOutputs =
      staticReconciliationReceiptIntake.postOutputs;
    invariant(
      staticReconciliationReceiptPath ===
        staticReconciliationReceiptBinding.path,
      `${member.animationId}: M1 static reconciliation receipt path drifted`,
    );
    invariant(
      sameDescriptor(
        risk.migrationManifest,
        staticReconciliationReceipt.outputs.migrationManifest.before,
      ) &&
        sameDescriptor(
          workspace.manifest,
          staticReconciliationReceipt.outputs.migrationManifest.before,
        ) &&
        sameDescriptor(
          descriptor(manifestRecord),
          staticReconciliationPostOutputs.migrationManifest,
        ),
      `${member.animationId}: authorized pre/post migration-manifest transition drifted`,
    );
    invariant(sameDescriptor(descriptor(scopeBindingRecord), risk.scopeBinding), `${member.animationId}: risk scope binding drifted`);
    invariant(sameDescriptor(descriptor(machineReportRecord), risk.machineReport), `${member.animationId}: risk machine report binding drifted`);
    invariant(sameDescriptor(descriptor(frameDomainsRecord), risk.frameDomains), `${member.animationId}: risk frame-domain binding drifted`);
    invariant(
      sameDescriptor(
        descriptor(scopeBindingRecord),
        workspace.sourceScopeBinding,
      ),
      `${member.animationId}: workspace bindings differ from the M1 inventory`,
    );
    invariant(
      descriptor(runtimePlanRecord).path === runtime.artifact.path &&
        descriptor(runtimePlanRecord).bytes === runtime.artifact.bytes &&
        descriptor(runtimePlanRecord).sha256 === runtime.artifact.sha256,
      `${member.animationId}: runtime-plan binding drifted`,
    );

    const manifest = manifestRecord.value;
    const scopeBinding = scopeBindingRecord.value;
    const machine = machineReportRecord.value;
    const domains = frameDomainsRecord.value;
    const plan = runtimePlanRecord.value;
    const strictReadiness = strictReadinessIntake.document;
    invariant(
      strictReadinessPath === strictReadinessIntake.binding.path,
      `${member.animationId}: strict-readiness path drifted`,
    );
    invariant(manifest.animationId === member.animationId && manifest.assetId === member.assetId, `${member.animationId}: manifest identity drifted`);
    invariant(
      scopeBinding.releaseId === G5_L5_RELEASE_ID &&
        scopeBinding.member?.ordinal === member.ordinal &&
        scopeBinding.member.animationId === member.animationId &&
        scopeBinding.member.assetId === member.assetId &&
        scopeBinding.member.source?.swf?.path === member.source.path &&
        scopeBinding.member.source?.swf?.sha256 === member.source.sha256 &&
        sameDescriptor(scopeBinding.scope, descriptor(sourceScopeRecord)),
      `${member.animationId}: source-scope identity drifted`,
    );
    invariant(
      machine.animationId === member.animationId &&
        machine.source?.expectedSha256 === member.source.sha256 &&
        machine.source.hashMatches === true &&
        machine.migrationStatusUnchanged === true,
      `${member.animationId}: machine audit identity drifted`,
    );
    invariant(
      domains.animationId === member.animationId &&
        domains.source?.sha256 === member.source.sha256 &&
        domains.root?.timelineId === "root" &&
        Number.isSafeInteger(domains.root.frameCount) &&
        Array.isArray(domains.nestedDefinitions) &&
        domains.summary?.completeRootReachableDomainInventory === false &&
        domains.acceptanceEffects?.strictComplete === false &&
        domains.acceptanceEffects?.published === false,
      `${member.animationId}: frame-domain boundary drifted`,
    );
    invariant(
      plan.schemaVersion === 2 &&
        plan.artifactType === "release-runtime-acquisition-plan" &&
        plan.identity?.releaseId === G5_L5_RELEASE_ID &&
        plan.identity.ordinal === member.ordinal &&
        plan.identity.animationId === member.animationId &&
        plan.identity.assetId === member.assetId &&
        plan.namedOperatorRoleAssignment === null,
      `${member.animationId}: runtime-plan identity drifted`,
    );
    assertEmptyWorksheet(plan.emptyRuntimeAcquisitionWorksheet, member.animationId);
    assertFalseFields(plan.executionGate, [
      "authorizesDirectSeek",
      "createsBaselineEvidence",
      "createsRuntimeEvidence",
      "executesLegacyEndpoints",
      "launchesAnimate",
      "launchesBrowser",
      "launchesOriginalRuntime",
      "launchesRuffle",
      "runnable",
    ], `${member.animationId} execution gate`);
    assertFalseFields(plan.acceptanceEffects, [
      "audioAccepted",
      "authoritativeOriginalRuntime",
      "currentJavaScriptCandidate",
      "fullFrameComparison",
      "humanVisualAccepted",
      "ownerAccepted",
      "published",
      "strictComplete",
    ], `${member.animationId} runtime acceptance`);
    invariant(plan.acceptanceEffects.acceptanceNeutral === true, `${member.animationId}: runtime plan is not acceptance-neutral`);
    invariant(
      sameDescriptor(
        plan.provenance?.migrationManifest,
        staticReconciliationReceipt.outputs.migrationManifest.before,
      ) &&
        sameDescriptor(plan.provenance?.sourceScopeBinding, descriptor(scopeBindingRecord)) &&
        sameDescriptor(plan.provenance?.structuralFrameDomainCandidates, descriptor(frameDomainsRecord)) &&
        plan.provenance?.namedOperatorAssignmentReceipt === null,
      `${member.animationId}: runtime-plan provenance drifted`,
    );
    invariant(
      plan.artifactFingerprintSha256 === runtime.artifact.fingerprintSha256,
      `${member.animationId}: runtime-plan fingerprint drifted`,
    );
    invariant(
      staticReconciliationReceipt.reconciliation?.applied === true &&
        staticReconciliationReceipt.reconciliation.machineOnlyStatic ===
          true &&
        staticReconciliationReceipt.reconciliation.canonicalOutputCount ===
          4 &&
        staticReconciliationReceipt.summary
          ?.manifestStaticFactsReconciled === true &&
        staticReconciliationReceipt.summary
          .migrationBriefStaticReconciled === true &&
        staticReconciliationReceipt.summary.complexityResolved === false &&
        staticReconciliationReceipt.summary.rendererSelected === false &&
        staticReconciliationReceipt.summary.runtimeReachabilityResolved ===
          false &&
        staticReconciliationReceipt.execution?.runtimeSessionsExecuted ===
          0 &&
        staticReconciliationReceipt.execution.guiApplicationsLaunched ===
          0 &&
        staticReconciliationReceipt.execution.legacyEndpointsExecuted ===
          0 &&
        Object.values(
          staticReconciliationReceipt.acceptanceEffects ?? {},
        ).every((value) => value === false),
      `${member.animationId}: M1 static reconciliation crossed its machine-only boundary`,
    );
    invariant(
      strictReadiness.state === G5_L5_STATIC_STRICT_READINESS_STATE &&
        strictReadiness.migrationStatusChanged === false &&
        strictReadiness.branchCaptureReadiness
          ?.authoritativeScheduleEstablished === false &&
        strictReadiness.branchCaptureReadiness.runtimeSessionsExecuted === 0 &&
        strictReadiness.acceptance?.acceptanceNeutral === true &&
        strictReadiness.acceptance.authoritativeOriginalRuntimeAccepted ===
          false &&
        strictReadiness.acceptance.audioAccepted === false &&
        strictReadiness.acceptance.humanVisualAccepted === false &&
        strictReadiness.acceptance.independentEngineeringAccepted === false &&
        strictReadiness.acceptance.ownerAccepted === false &&
        strictReadiness.acceptance.strictMigrationComplete === false &&
        strictReadiness.acceptance.published === false,
      `${member.animationId}: static strict-readiness crossed a runtime, review, strict, or publication boundary`,
    );

    return {
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      shardId: member.shardId,
      sourceModel: runtime.sourceModel,
      rootFrameCount: domains.root.frameCount,
      nestedDefinitionCount: domains.nestedDefinitions.length,
      unresolvedNestedReachabilityCount: domains.summary.unresolvedReachabilityCount,
      bindings: {
        migrationManifest: descriptor(manifestRecord),
        preAuthorizationMigrationManifest:
          receiptOutputDescriptor(
            staticReconciliationReceipt.outputs.migrationManifest.before,
          ),
        migrationBrief: receiptOutputDescriptor(
          staticReconciliationPostOutputs.migrationBrief,
        ),
        scriptInventory: receiptOutputDescriptor(
          staticReconciliationPostOutputs.scriptInventory,
        ),
        dependencyInventory: receiptOutputDescriptor(
          staticReconciliationPostOutputs.dependencyInventory,
        ),
        sourceScopeBinding: descriptor(scopeBindingRecord),
        machineReport: descriptor(machineReportRecord),
        frameDomains: descriptor(frameDomainsRecord),
        runtimePlan: descriptor(runtimePlanRecord),
        m1StaticReconciliationReceipt:
          staticReconciliationReceiptBinding,
        strictReadiness: strictReadinessIntake.binding,
      },
      boundaries: {
        machineAuditCurrent: true,
        m1StaticReconciliationApplied: true,
        m1StaticReconciliationMachineOnly: true,
        strictReadinessPrepared: true,
        runtimeWorksheetEmpty: true,
        namedOperatorAssigned: false,
        runtimeRunnable: false,
        implementationAuthorized: false,
        strictComplete: false,
        published: false,
      },
    };
  }));
  invariant(inventory.length === G5_L5_EXPECTED_MEMBERS, "G5 L5 M1 inventory count drifted");
  return {
    members: inventory,
    inventorySha256: sha256(Buffer.from(stableJson(inventory))),
  };
}

export async function buildG5L5M1MachineFoundationReadiness({
  root = projectRoot,
  m0ReportPath = M0_REPORT_PATH,
} = {}) {
  const [freshM0, ownerDirectiveIntake] = await Promise.all([
    buildG5L5M0GovernanceReadiness({root}),
    readG5L5OwnerGovernanceDirectiveIntake({root}),
  ]);
  const {
    receipt: ownerDirectiveReceipt,
    binding: ownerDirectiveBinding,
  } = ownerDirectiveIntake;
  const [
    m0Record,
    releaseRecord,
    profileRecord,
    sourceScopeRecord,
    workspaceRecord,
    riskRecord,
    runtimeRecord,
    containmentRecord,
    promotionRecord,
    animateRecord,
    generatorRecord,
  ] = await Promise.all([
    jsonRecord(root, m0ReportPath, "G5 L5 M0 report"),
    jsonRecord(root, G5_L5_RELEASE_MANIFEST_PATH, "lesson release manifest"),
    jsonRecord(root, G5_L5_PROFILE_PATH, "G5 L5 governance profile"),
    jsonRecord(root, SOURCE_SCOPE_PATH, "G5 L5 source scope"),
    jsonRecord(root, WORKSPACE_READINESS_PATH, "G5 L5 workspace readiness"),
    jsonRecord(root, RISK_CALIBRATION_PATH, "G5 L5 risk calibration"),
    jsonRecord(root, RUNTIME_PLANNING_PATH, "G5 L5 runtime planning"),
    jsonRecord(root, CONTAINMENT_PATH, "G5 L5 containment readiness"),
    jsonRecord(root, PROMOTION_SECURITY_PATH, "G5 L5 promotion security"),
    jsonRecord(root, ANIMATE_READINESS_PATH, "G5 L5 Animate readiness"),
    fileRecord(root, portable(path.relative(root, scriptPath)), "M1 generator"),
  ]);
  invariant(stableJson(m0Record.value) === stableJson(freshM0), "G5 L5 checked-in M0 report is stale");
  validateG5L5M0GovernanceReport(m0Record.value);
  invariant(
    sameDescriptor(
      m0Record.value.sourceBindings.ownerGovernanceDirectiveIntake,
      ownerDirectiveBinding,
    ) &&
      ownerDirectiveReceipt.authorization
        .m1MachineFoundationStartAuthorized === true &&
      ownerDirectiveReceipt.authorityBoundary.m1MachineOnlyEffective === true,
    "G5 L5 M1 Owner directive receipt does not match the M0 bounded authorization",
  );
  const release = selectG5L5Release(releaseRecord.value);
  invariant(
    sameDescriptor(m0Record.value.sourceBindings.releaseManifest, descriptor(releaseRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.governanceProfile, descriptor(profileRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.sourceScopeFreeze, descriptor(sourceScopeRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.workspaceReadiness, descriptor(workspaceRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.riskCalibration, descriptor(riskRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.runtimeAcquisitionPlanning, descriptor(runtimeRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.originalRuntimeContainmentReadiness, descriptor(containmentRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.promotionSecurityReadiness, descriptor(promotionRecord)) &&
      sameDescriptor(m0Record.value.sourceBindings.machinePacket.animateOperatorReadiness, descriptor(animateRecord)),
    "G5 L5 M1 upstream bindings differ from the M0 packet",
  );
  const inventory = await buildG5L5MemberMachineFoundationInventory({
    root,
    release,
    sourceScopeRecord,
    workspaceRecord,
    riskRecord,
    runtimeRecord,
  });
  invariant(
    inventory.members.reduce((sum, member) => sum + member.rootFrameCount, 0) === 610 &&
      inventory.members.reduce((sum, member) => sum + member.nestedDefinitionCount, 0) === 1232 &&
      inventory.members.reduce((sum, member) => sum + member.unresolvedNestedReachabilityCount, 0) === 1232,
    "G5 L5 M1 structural-domain totals drifted",
  );
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-m1-machine-foundation-readiness",
    releaseId: G5_L5_RELEASE_ID,
    evidenceState:
      "m1-machine-foundation-packet-current-machine-only-static-start-and-execution-authorized",
    authority:
      "This report re-hashes the independent G5 L5 M0 packet, the immutable public-safe Owner directive receipt, and all 57 release-local machine-audit/runtime-planning workspaces. It carries the roadmap section 4.5 minimum capacity reservations as requirements only and marks the current non-runnable machine foundation ready for its authorized machine-only static M1 work. The same receipt does not make M0 effective or closed and grants no Owner identity, named operator or reviewer, inherited or established hour commitment, spend/procurement/payment, GUI/runtime execution, renderer implementation, evidence promotion, review or fidelity acceptance, strict completion, or publication approval.",
    generator: descriptor(generatorRecord),
    sourceBindings: {
      m0GovernanceReadiness: descriptor(m0Record),
      ownerGovernanceDirectiveIntake: ownerDirectiveBinding,
      releaseManifest: descriptor(releaseRecord),
      governanceProfile: descriptor(profileRecord),
      sourceScope: descriptor(sourceScopeRecord),
      workspaceReadiness: descriptor(workspaceRecord),
      riskCalibration: descriptor(riskRecord),
      runtimePlanning: descriptor(runtimeRecord),
      containmentReadiness: descriptor(containmentRecord),
      promotionSecurityReadiness: descriptor(promotionRecord),
      animateReadiness: descriptor(animateRecord),
    },
    release: {
      publicationMode: "atomic",
      memberCount: 57,
      pageCount: 56,
      shellCount: 1,
      pairedFlaSwfCount: 49,
      swfOnlyCount: 8,
    },
    m0Gate: {
      machinePacketReadyForOwnerReview: true,
      exitReady: false,
      ownerSignoffReceipt: null,
      ownerExitDirectiveReceipt: ownerDirectiveBinding,
      ownerExitDirectiveRecorded: true,
      ownerExitEffective: false,
      ownerDecisionReceiptCount: 2,
      ownerDecisionRequirementSatisfiedCount: 1,
      namedRoleAssignmentReceiptCount: 0,
      namedPersonCount: 0,
      requiredRoleCount: 7,
      requiredNamedRoleSlotCount: 14,
      requiredPrimaryHoursPerWeekFloorTotal: 64,
      specifiedBackupHoursPerWeekFloorTotal: 8,
      rolesWithOwnerPendingBackupHourFloorCount: 6,
      inheritedHourCommitmentCount: 0,
      committedHourCommitmentCount: 0,
      committedHoursPerWeekTotal: 0,
      budgetDefaultSelectionRecorded: true,
      budgetGateApprovedCount: 0,
      externalSpendAuthorized: false,
      procurementOrPaymentAuthorized: false,
    },
    m1Authorization: {
      startAuthorizationReceipt: ownerDirectiveBinding,
      startAuthorized: false,
      machineOnlyStaticStartAuthorized: true,
      machineFoundationExecutionAuthorized: false,
      machineOnlyStaticExecutionAuthorized: true,
      machineOnlyStaticScope: true,
      portableOwnerIdentityVerified: false,
      namedOperatorAssigned: false,
      namedOperatorAssignmentReceipt: null,
      operatorWeeklyCapacityEstablished: false,
      staffingCapacityApproved: false,
      budgetApproved: false,
      runtimeHostApproved: false,
      containmentApproved: false,
      immutableSessionAuthorizationEstablished: false,
      originalRuntimeExecutionAuthorized: false,
      animateGuiExecutionAuthorized: false,
      implementationAuthorized: false,
    },
    budgetBoundary: {
      ownerDirectiveReceipt: ownerDirectiveBinding,
      defaultSelection: structuredClone(
        ownerDirectiveReceipt.budgetDefaultResolution,
      ),
      gateCount: 3,
      gateApprovedCount: 0,
      signedReceipt: null,
      budgetApproved: false,
    },
    machineFoundation: {
      state:
        "current-non-runnable-machine-only-static-execution-authorized",
      packetCurrent: true,
      memberEvidenceCount: 57,
      memberEvidenceInventorySha256: inventory.inventorySha256,
      members: inventory.members,
      machineAuditCount: 57,
      emptyRuntimeWorksheetCount: 57,
      authorizedStaticReconciliationCount: 57,
      strictReadinessArtifactCount: 57,
      rootFrameCount: 610,
      structuralNestedDefinitionCount: 1232,
      unresolvedNestedReachabilityCount: 1232,
      runtimeSessionCount: 0,
      runnableArtifactCount: 0,
      authoritativeBaselineCount: 0,
      authoringAuditCount: 0,
      workStudyCandidateCount: 4,
      completedWorkStudyCount: 0,
      containmentMechanismSelectedCount: 0,
      promotionSecuritySyntheticTestCount: promotionRecord.value.testResult.passed,
      productionPromotionWriterReady: false,
    },
    readiness: {
      machineFoundationPacketCurrent: true,
      readyForOwnerM1StartDecision: false,
      m1StartAuthorized: false,
      m1MachineOnlyStaticStartAuthorized: true,
      m1ExecutionReady: false,
      m1MachineOnlyStaticExecutionReady: true,
      runtimeAcquisitionReady: false,
      rendererImplementationReady: false,
      promotionReady: false,
      strictCompleteCount: 0,
      published: false,
    },
    summary: {
      exactReleaseMemberCount: 57,
      machineAuditCount: 57,
      emptyRuntimeWorksheetCount: 57,
      authorizedStaticReconciliationCount: 57,
      strictReadinessArtifactCount: 57,
      namedPersonCount: 0,
      requiredRoleCount: 7,
      requiredNamedRoleSlotCount: 14,
      requiredPrimaryHoursPerWeekFloorTotal: 64,
      specifiedBackupHoursPerWeekFloorTotal: 8,
      rolesWithOwnerPendingBackupHourFloorCount: 6,
      inheritedHourCommitmentCount: 0,
      committedHourCommitmentCount: 0,
      committedHoursPerWeekTotal: 0,
      authorizationReceiptCount: 1,
      budgetDefaultSelectionRecorded: true,
      budgetGateApprovedCount: 0,
      externalSpendAuthorized: false,
      procurementOrPaymentAuthorized: false,
      m0ExitDirectiveRecorded: true,
      m0ExitEffective: false,
      m0ExitReady: false,
      m1StartAuthorized: false,
      m1MachineOnlyStaticStartAuthorized: true,
      m1MachineFoundationExecutionAuthorized: false,
      m1MachineOnlyStaticExecutionAuthorized: true,
      m1MachineOnlyStaticExecutionReady: true,
      strictCompleteCount: 0,
      published: false,
    },
    blockers: [
      "The immutable Owner directive records M0-exit intent, but no portable external signature or complete M0 governance evidence makes M0 effective; M0 remains open.",
      "The same immutable receipt authorizes M1 machine-only static foundation start and execution; it does not authorize runtime/GUI execution, renderer implementation, or evidence promotion.",
      "All seven primary and seven named backup assignments remain unset. The roadmap primary minimums total 64 hours/week; the original-runtime backup minimum is 8 hours/week, the other six backup floors await Owner setting, and no hours are established or committed.",
      "Repository budget/procurement defaults contain no numeric rate ceiling, total budget, or procurement/payment cycle; gates remain 0/3 and no spend, procurement, or payment is authorized.",
      "All 57 runtime worksheets are intentionally empty and non-runnable; no host, containment, immutable session, or per-session operator attestation is authorized.",
      "All 1,232 structural nested definitions remain unresolved for natural runtime reachability and entry state.",
      "Authoring, original-runtime, bilingual/audio, renderer, full-frame/RMSE, human review, Owner fidelity, strict-completion, and atomic-publication gates remain open.",
    ],
    acceptanceEffects: {
      m0Closed: false,
      m1Authorized: false,
      m1MachineOnlyStaticStartAuthorized: true,
      m1ExecutionAuthorized: false,
      m1MachineOnlyStaticExecutionAuthorized: true,
      namedOperatorAssigned: false,
      staffingCapacityApproved: false,
      budgetApproved: false,
      runtimeExecutionAuthorized: false,
      implementationAuthorized: false,
      evidencePromotionAuthorized: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  const report = {
    ...base,
    reportFingerprintSha256: sha256(Buffer.from(stableJson(base))),
  };
  validateG5L5M1MachineFoundationReport(report);
  return report;
}

export function validateG5L5M1MachineFoundationReport(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === "g5-l5-m1-machine-foundation-readiness", "G5 L5 M1 report identity drifted");
  invariant(report.releaseId === G5_L5_RELEASE_ID, "G5 L5 M1 report belongs to another release");
  invariant(
    report.release?.memberCount === 57 &&
      report.release.pageCount === 56 &&
      report.release.shellCount === 1 &&
      report.release.pairedFlaSwfCount === 49 &&
      report.release.swfOnlyCount === 8,
    "G5 L5 M1 release scope drifted",
  );
  invariant(
    report.machineFoundation?.state ===
        "current-non-runnable-machine-only-static-execution-authorized" &&
      report.machineFoundation.packetCurrent === true &&
      report.machineFoundation.memberEvidenceCount === 57 &&
      report.machineFoundation.members?.length === 57 &&
      new Set(report.machineFoundation.members.map(({animationId}) => animationId)).size === 57 &&
      report.machineFoundation.machineAuditCount === 57 &&
      report.machineFoundation.emptyRuntimeWorksheetCount === 57 &&
      report.machineFoundation.authorizedStaticReconciliationCount === 57 &&
      report.machineFoundation.strictReadinessArtifactCount === 57 &&
      report.machineFoundation.rootFrameCount === 610 &&
      report.machineFoundation.structuralNestedDefinitionCount === 1232 &&
      report.machineFoundation.unresolvedNestedReachabilityCount === 1232 &&
      report.machineFoundation.runtimeSessionCount === 0 &&
      report.machineFoundation.runnableArtifactCount === 0 &&
      report.machineFoundation.authoritativeBaselineCount === 0 &&
      report.machineFoundation.authoringAuditCount === 0 &&
      report.machineFoundation.completedWorkStudyCount === 0 &&
      report.machineFoundation.containmentMechanismSelectedCount === 0 &&
      report.machineFoundation.productionPromotionWriterReady === false,
    "G5 L5 M1 machine-foundation boundary drifted",
  );
  invariant(
    report.machineFoundation.members.every((member) =>
      member.bindings?.migrationManifest?.path ===
        `migrations/${member.animationId}/migration.json` &&
      Number.isSafeInteger(member.bindings.migrationManifest.bytes) &&
      member.bindings.migrationManifest.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(member.bindings.migrationManifest.sha256) &&
      member.bindings.preAuthorizationMigrationManifest?.path ===
        `migrations/${member.animationId}/migration.json` &&
      Number.isSafeInteger(
        member.bindings.preAuthorizationMigrationManifest.bytes,
      ) &&
      member.bindings.preAuthorizationMigrationManifest.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(
        member.bindings.preAuthorizationMigrationManifest.sha256,
      ) &&
      member.bindings.migrationBrief?.path ===
        `migrations/${member.animationId}/MIGRATION_BRIEF.md` &&
      Number.isSafeInteger(member.bindings.migrationBrief.bytes) &&
      member.bindings.migrationBrief.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(member.bindings.migrationBrief.sha256) &&
      member.bindings.scriptInventory?.path ===
        `migrations/${member.animationId}/audit/script-inventory.json` &&
      Number.isSafeInteger(member.bindings.scriptInventory.bytes) &&
      member.bindings.scriptInventory.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(member.bindings.scriptInventory.sha256) &&
      member.bindings.dependencyInventory?.path ===
        `migrations/${member.animationId}/audit/dependency-inventory.json` &&
      Number.isSafeInteger(member.bindings.dependencyInventory.bytes) &&
      member.bindings.dependencyInventory.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(member.bindings.dependencyInventory.sha256) &&
      member.bindings.m1StaticReconciliationReceipt?.path ===
        g5L5M1StaticReconciliationReceiptPath(member.animationId) &&
      Number.isSafeInteger(
        member.bindings.m1StaticReconciliationReceipt.bytes,
      ) &&
      member.bindings.m1StaticReconciliationReceipt.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(
        member.bindings.m1StaticReconciliationReceipt.sha256,
      ) &&
      member.bindings.strictReadiness?.path ===
        g5L5StaticStrictReadinessPath(member.animationId) &&
      Number.isSafeInteger(member.bindings.strictReadiness.bytes) &&
      member.bindings.strictReadiness.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(member.bindings.strictReadiness.sha256) &&
      member.boundaries?.m1StaticReconciliationApplied === true &&
      member.boundaries.m1StaticReconciliationMachineOnly === true &&
      member.boundaries.strictReadinessPrepared === true &&
      member.boundaries.runtimeWorksheetEmpty === true &&
      member.boundaries.runtimeRunnable === false &&
      member.boundaries.implementationAuthorized === false &&
      member.boundaries.strictComplete === false &&
      member.boundaries.published === false),
    "G5 L5 M1 member static-reconciliation or strict-readiness binding drifted",
  );
  invariant(
    report.machineFoundation.memberEvidenceInventorySha256 ===
      sha256(Buffer.from(stableJson(report.machineFoundation.members))),
    "G5 L5 M1 member inventory fingerprint drifted",
  );
  const ownerDirectiveBinding =
    report.sourceBindings?.ownerGovernanceDirectiveIntake;
  invariant(
    Object.keys(ownerDirectiveBinding ?? {}).sort().join("\0") ===
      ["bytes", "path", "sha256"].join("\0") &&
      sameDescriptor(
        ownerDirectiveBinding,
        G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR,
      ),
    "G5 L5 M1 immutable Owner directive source binding drifted",
  );
  invariant(
    report.m0Gate?.exitReady === false &&
      report.m0Gate.ownerSignoffReceipt === null &&
      sameDescriptor(
        report.m0Gate.ownerExitDirectiveReceipt,
        ownerDirectiveBinding,
      ) &&
      report.m0Gate.ownerExitDirectiveRecorded === true &&
      report.m0Gate.ownerExitEffective === false &&
      report.m0Gate.ownerDecisionReceiptCount === 2 &&
      report.m0Gate.ownerDecisionRequirementSatisfiedCount === 1 &&
      report.m0Gate.budgetDefaultSelectionRecorded === true &&
      report.m0Gate.budgetGateApprovedCount === 0 &&
      report.m0Gate.externalSpendAuthorized === false &&
      report.m0Gate.procurementOrPaymentAuthorized === false,
    "G5 L5 M1 report promoted M0 or lost its bounded Owner directive",
  );
  invariant(
    report.m0Gate.namedPersonCount === 0 &&
      report.m0Gate.requiredRoleCount === 7 &&
      report.m0Gate.requiredNamedRoleSlotCount === 14 &&
      report.m0Gate.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      report.m0Gate.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      report.m0Gate.rolesWithOwnerPendingBackupHourFloorCount === 6 &&
      report.m0Gate.inheritedHourCommitmentCount === 0 &&
      report.m0Gate.committedHourCommitmentCount === 0 &&
      report.m0Gate.committedHoursPerWeekTotal === 0,
    "G5 L5 M1 report imported a person or hour commitment or drifted roadmap capacity requirements",
  );
  invariant(
    sameDescriptor(
      report.m1Authorization?.startAuthorizationReceipt,
      ownerDirectiveBinding,
    ) &&
      report.m1Authorization.startAuthorized === false &&
      report.m1Authorization.machineOnlyStaticStartAuthorized === true &&
      report.m1Authorization.machineFoundationExecutionAuthorized === false &&
      report.m1Authorization.machineOnlyStaticExecutionAuthorized === true &&
      report.m1Authorization.machineOnlyStaticScope === true &&
      report.m1Authorization.namedOperatorAssignmentReceipt === null,
    "G5 L5 M1 bounded machine-only authorization receipt drifted",
  );
  assertFalseFields(report.m1Authorization, [
    "portableOwnerIdentityVerified",
    "namedOperatorAssigned",
    "operatorWeeklyCapacityEstablished",
    "staffingCapacityApproved",
    "budgetApproved",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "originalRuntimeExecutionAuthorized",
    "animateGuiExecutionAuthorized",
    "implementationAuthorized",
  ], "G5 L5 M1 authorization");
  invariant(
    sameDescriptor(
      report.budgetBoundary?.ownerDirectiveReceipt,
      ownerDirectiveBinding,
    ) &&
      report.budgetBoundary.defaultSelection?.currency === "USD" &&
      report.budgetBoundary.defaultSelection
        .ownerSelectedRepositoryDefaults === true &&
      report.budgetBoundary.defaultSelection
        .repositoryDefinedNumericOrCycleDefaultsFound === false &&
      report.budgetBoundary.defaultSelection
        .personnelRateCeilingUsdPerHour === null &&
      report.budgetBoundary.defaultSelection.totalBudgetEnvelopeUsd === null &&
      report.budgetBoundary.defaultSelection.procurementPaymentCycle ===
        null &&
      report.budgetBoundary.defaultSelection.defaultDisposition ===
        "fail-closed-unset-no-spend-procurement-or-payment-authority" &&
      report.budgetBoundary.defaultSelection.externalSpendAuthorized ===
        false &&
      report.budgetBoundary.defaultSelection.procurementOrPaymentAuthorized ===
        false &&
      report.budgetBoundary.defaultSelection
        .anySpendRequiresNewOwnerReceipt === true &&
      report.budgetBoundary.gateCount === 3 &&
      report.budgetBoundary.gateApprovedCount === 0 &&
      report.budgetBoundary.signedReceipt === null &&
      report.budgetBoundary.budgetApproved === false,
    "G5 L5 M1 budget defaults invented a value, approval, spend, procurement, or payment authority",
  );
  invariant(
    report.readiness?.machineFoundationPacketCurrent === true &&
      report.readiness.readyForOwnerM1StartDecision === false &&
      report.readiness.m1StartAuthorized === false &&
      report.readiness.m1MachineOnlyStaticStartAuthorized === true &&
      report.readiness.m1ExecutionReady === false &&
      report.readiness.m1MachineOnlyStaticExecutionReady === true,
    "G5 L5 M1 bounded machine-only readiness drifted",
  );
  assertFalseFields(report.readiness, [
    "runtimeAcquisitionReady",
    "rendererImplementationReady",
    "promotionReady",
    "published",
  ], "G5 L5 M1 readiness");
  invariant(report.readiness.strictCompleteCount === 0, "G5 L5 M1 readiness claims strict completion");
  assertFalseFields(report.acceptanceEffects, [
    "m0Closed",
    "m1Authorized",
    "m1ExecutionAuthorized",
    "namedOperatorAssigned",
    "staffingCapacityApproved",
    "budgetApproved",
    "runtimeExecutionAuthorized",
    "implementationAuthorized",
    "evidencePromotionAuthorized",
    "humanReviewAccepted",
    "ownerAccepted",
    "strictComplete",
    "published",
  ], "G5 L5 M1 acceptance");
  invariant(
    report.acceptanceEffects.m1MachineOnlyStaticStartAuthorized === true &&
      report.acceptanceEffects.m1MachineOnlyStaticExecutionAuthorized === true,
    "G5 L5 M1 report lost bounded machine-only authorization",
  );
  invariant(
    report.summary?.namedPersonCount === 0 &&
      report.summary.authorizedStaticReconciliationCount === 57 &&
      report.summary.strictReadinessArtifactCount === 57 &&
      report.summary.requiredRoleCount === 7 &&
      report.summary.requiredNamedRoleSlotCount === 14 &&
      report.summary.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      report.summary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      report.summary.rolesWithOwnerPendingBackupHourFloorCount === 6 &&
      report.summary.inheritedHourCommitmentCount === 0 &&
      report.summary.committedHourCommitmentCount === 0 &&
      report.summary.committedHoursPerWeekTotal === 0 &&
      report.summary.authorizationReceiptCount === 1 &&
      report.summary.budgetDefaultSelectionRecorded === true &&
      report.summary.budgetGateApprovedCount === 0 &&
      report.summary.externalSpendAuthorized === false &&
      report.summary.procurementOrPaymentAuthorized === false &&
      report.summary.m0ExitDirectiveRecorded === true &&
      report.summary.m0ExitEffective === false &&
      report.summary.m0ExitReady === false &&
      report.summary.m1StartAuthorized === false &&
      report.summary.m1MachineOnlyStaticStartAuthorized === true &&
      report.summary.m1MachineFoundationExecutionAuthorized === false &&
      report.summary.m1MachineOnlyStaticExecutionAuthorized === true &&
      report.summary.m1MachineOnlyStaticExecutionReady === true &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.published === false,
    "G5 L5 M1 summary imported authority or drifted roadmap capacity requirements",
  );
  invariant(!JSON.stringify(report).includes("Dr. Peter"), "G5 L5 M1 report imported a named person");
  invariant(!Object.values(report.sourceBindings ?? {}).some(({path: file}) => file?.includes("g5-l4")), "G5 L5 M1 report imported a G5 L4 artifact");
  const {reportFingerprintSha256, ...base} = report;
  invariant(reportFingerprintSha256 === sha256(Buffer.from(stableJson(base))), "G5 L5 M1 report fingerprint drifted");
  return report;
}

export function renderG5L5M1Markdown(report) {
  return `# G5 L5 M1 machine-foundation readiness\n\n` +
    `> ${report.authority}\n\n` +
    `## Outcome\n\n` +
    `- Exact release scope: **56 pages + Shell = 57 members**.\n` +
    `- Current machine audits / empty runtime worksheets: **57/57 / 57/57**.\n` +
    `- Authorized M1 static reconciliations / fail-closed strict-readiness artifacts: **57/57 / 57/57**; both are hash-bound per member.\n` +
    `- Structural root frames: **610**; unresolved nested definitions: **1,232**.\n` +
    `- Required human capacity: **7 roles / 14 named primary+backup slots**; roadmap primary floor total: **64 hours/week**; specified backup floor total: **8 hours/week**; six other backup floors await Owner setting.\n` +
    `- Named people / inherited hour commitments / established hour commitments / unique authorization receipts: **0 / 0 / 0 / 1**; every committed-hours field remains **unset**.\n` +
    `- Owner M0-exit directive recorded: **true**; M0 effective / ready / closed: **false / false / false**.\n` +
    `- M1 machine-only static start authorized / foundation execution authorized / ready: **true / true / true**.\n` +
    `- Repository budget/procurement defaults selected: **true**; numeric/cycle values established: **false**; budget gates: **0/3**; spend/procurement/payment authority: **false**.\n` +
    `- Runtime sessions / authoritative baselines / authoring audits / completed work studies: **0 / 0 / 0 / 0**.\n` +
    `- Strict: **0/57**; published: **false**.\n\n` +
    `## Boundary\n\n` +
    `The section 4.5 hour values are roadmap-required minimum reservations, not inherited capacity or established commitments. The immutable receipt authorizes only the current, non-runnable 57-member machine foundation's static M1 work. It does not authorize a runtime session, Animate GUI, renderer implementation, evidence promotion, a production writer, review, fidelity, strict completion, or publication. Synthetic promotion-security tests remain diagnostic only.\n\n` +
    `## Open gates\n\n${report.blockers.map((blocker) => `- ${blocker}`).join("\n")}\n`;
}

function outputPaths(root, outputPrefix) {
  invariant(typeof outputPrefix === "string" && outputPrefix.startsWith("reports/"), "output prefix must stay below reports/");
  invariant(!outputPrefix.endsWith(".json") && !outputPrefix.endsWith(".md"), "output prefix must omit an extension");
  return {
    json: resolveProjectPath(root, `${outputPrefix}.json`, "M1 JSON output"),
    markdown: resolveProjectPath(root, `${outputPrefix}.md`, "M1 Markdown output"),
  };
}

async function atomicWrite(root, file, content, label) {
  await ensureContainedOrdinaryDirectoryTree(root, path.dirname(file), {
    create: true,
    label,
  });
  try {
    const metadata = await lstat(file);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1, `${file}: output target must be an ordinary unlinked file`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, content, {flag: "wx", mode: 0o644});
    await ensureContainedOrdinaryDirectoryTree(root, path.dirname(file), {
      label,
    });
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function writeOrCheckG5L5M1({report, outputPrefix, check, root = projectRoot}) {
  const outputs = outputPaths(root, outputPrefix);
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderG5L5M1Markdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readContainedOrdinaryFile(root, outputs.json, "M1 JSON output"),
      readContainedOrdinaryFile(root, outputs.markdown, "M1 Markdown output"),
    ]);
    invariant(actualJson.toString("utf8") === expectedJson, "G5 L5 M1 JSON report is stale");
    invariant(actualMarkdown.toString("utf8") === expectedMarkdown, "G5 L5 M1 Markdown report is stale");
    return {status: "checked", outputs};
  }
  await Promise.all([
    atomicWrite(root, outputs.json, expectedJson, "M1 JSON output"),
    atomicWrite(root, outputs.markdown, expectedMarkdown, "M1 Markdown output"),
  ]);
  return {status: "written", outputs};
}

export function parseG5L5M1Arguments(argv) {
  const options = {
    check: false,
    outputPrefix: "reports/g5-l5-m1-machine-foundation-readiness",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--output-prefix") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), "--output-prefix requires a value");
      options.outputPrefix = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.help) outputPaths(projectRoot, options.outputPrefix);
  return options;
}

async function main() {
  const options = parseG5L5M1Arguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/build-g5-l5-m1-machine-foundation-readiness.mjs [--output-prefix reports/prefix] [--check]\n");
    return;
  }
  const report = await buildG5L5M1MachineFoundationReadiness();
  const result = await writeOrCheckG5L5M1({...options, report});
  process.stdout.write(`${result.status === "checked" ? "PASS" : "WROTE"}: 57/57 machine foundation current; M0 directive true/effective false; M1 machine-only static authorized true; strict 0/57; published false\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
