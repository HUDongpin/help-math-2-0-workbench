#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {isDeepStrictEqual} from "node:util";
import {fileURLToPath} from "node:url";

import {
  buildAuthoritativeRuntimeAcquisitionContract,
  validateAuthoritativeRuntimeAcquisitionContract,
} from "./build-g4-l3-authoritative-runtime-acquisition-contract.mjs";
import {technicalManifestSha256} from "./evidence-projections.mjs";
import {
  buildWorkspaceRuntimeAcquisitionArtifact,
  readTs006PreparedContainmentArtifact,
  WORKSPACE_ARTIFACT_RELATIVE,
} from "./materialize-g4-l3-workspace-runtime-acquisition.mjs";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const CONTRACT_PATH = path.join(ROOT, "reports", "g4-l3-authoritative-runtime-acquisition-contract.json");
const MATERIALIZER_PATH = path.join(ROOT, "scripts", "materialize-g4-l3-workspace-runtime-acquisition.mjs");
const REPORT_BASENAME = "g4-l3-m3-runtime-acquisition-readiness";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function relative(file) {
  const candidate = portable(path.relative(ROOT, file));
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return candidate;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

async function physicalBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), bytes: bytes.length, sha256: sha256(bytes)};
}

function emptyWorksheet(worksheet) {
  return worksheet?.status === "empty-template-planning-only"
    && worksheet.namedAnimateDialogOperator === null
    && worksheet.namedOriginalRuntimeOperator === null
    && worksheet.authorizedRuntimeExecutable === null
    && worksheet.authorizedRuntimeVersion === null
    && worksheet.launchPath === null
    && worksheet.hostContext === null
    && worksheet.sessionId === null
    && [
      "captureSchedule",
      "eventSchedule",
      "runtimeScenarioIds",
      "traceIds",
      "deterministicSeedBindings",
      "baselineManifests",
      "pngFiles",
      "audioListeningRecords",
      "runtimeReceipts",
      "reviewerOrOwnerSignatures",
    ].every((key) => Array.isArray(worksheet[key]) && worksheet[key].length === 0);
}

function assertExecutionState(object, expectedAuthoringAudit, label) {
  invariant(object && typeof object === "object" && !Array.isArray(object), `${label}: expected object`);
  for (const [key, value] of Object.entries(object)) {
    if (key === "authoringAuditEstablished") {
      invariant(value === expectedAuthoringAudit, `${label}.${key}: authoring state drifted`);
      continue;
    }
    invariant(value === false, `${label}.${key}: unexpectedly opened`);
  }
}

export async function buildM3RuntimeAcquisitionReadiness() {
  const [contractBytes, materializerBytes, generator, currentContract] = await Promise.all([
    readFile(CONTRACT_PATH),
    readFile(MATERIALIZER_PATH),
    physicalBinding(GENERATOR_PATH),
    buildAuthoritativeRuntimeAcquisitionContract(),
  ]);
  const contract = validateAuthoritativeRuntimeAcquisitionContract(JSON.parse(contractBytes));
  invariant(isDeepStrictEqual(contract, currentContract), "Lesson runtime-acquisition contract is stale");
  const contractBinding = {
    path: relative(CONTRACT_PATH),
    bytes: contractBytes.length,
    sha256: sha256(contractBytes),
    reportType: contract.reportType,
    schemaVersion: contract.schemaVersion,
  };
  const materializerBinding = {
    path: relative(MATERIALIZER_PATH),
    version: 1,
    bytes: materializerBytes.length,
    sha256: sha256(materializerBytes),
  };
  const ts006PreparedContainmentArtifact = await readTs006PreparedContainmentArtifact(ROOT);
  const items = [];

  for (const [itemIndex, contractItem] of contract.items.entries()) {
    const workspace = path.join(ROOT, "migrations", contractItem.animationId);
    const manifestPath = path.join(workspace, "migration.json");
    const artifactPath = path.join(workspace, ...WORKSPACE_ARTIFACT_RELATIVE.split("/"));
    const [manifestBytes, artifactBytes] = await Promise.all([readFile(manifestPath), readFile(artifactPath)]);
    const manifest = JSON.parse(manifestBytes);
    const artifact = JSON.parse(artifactBytes);
    const expectedArtifact = buildWorkspaceRuntimeAcquisitionArtifact({
      item: contractItem,
      itemIndex,
      manifest,
      contractBinding,
      materializerBinding: {
        path: materializerBinding.path,
        version: materializerBinding.version,
        sha256: materializerBinding.sha256,
      },
      preparedContainmentArtifacts: contractItem.animationId === "course-g04-l03-ts-006"
        ? [ts006PreparedContainmentArtifact]
        : [],
    });
    invariant(artifactBytes.toString("utf8") === stableJson(expectedArtifact),
      `${contractItem.animationId}: workspace runtime-acquisition artifact is stale`);
    invariant(emptyWorksheet(artifact.operatorWorksheet),
      `${contractItem.animationId}: operator worksheet is not empty`);
    invariant(artifact.executionGate?.state === "closed-empty-planning-artifact"
      && artifact.executionGate.runnable === false
      && artifact.executionGate.launchesAnimate === false
      && artifact.executionGate.launchesOriginalRuntime === false
      && artifact.executionGate.createsCaptureEvidence === false,
    `${contractItem.animationId}: workspace execution gate opened`);
    invariant(artifact.currentEvidenceState.workOnlyAuthoringAuditEstablished
      === contractItem.authoringGate.required,
    `${contractItem.animationId}: workspace authoring evidence state drifted`);
    invariant(artifact.runtimeEnvironmentPrerequisite.installedCandidateIdentified === true
      && artifact.runtimeEnvironmentPrerequisite.candidateExecutableTechnicallyBound === true
      && artifact.runtimeEnvironmentPrerequisite.runtimeVersion === "32.0.0.414"
      && artifact.runtimeEnvironmentPrerequisite.runtimeApprovedByOwner === false
      && artifact.runtimeEnvironmentPrerequisite.authorizedHostContextIdentified === false
      && artifact.runtimeEnvironmentPrerequisite.networkContainmentPlanApproved === false
      && artifact.runtimeEnvironmentPrerequisite.namedOriginalRuntimeOperatorSupplied === false
      && artifact.runtimeEnvironmentPrerequisite.perItemCaptureAuthorized === false
      && artifact.runtimeEnvironmentPrerequisite.originalRuntimeExecutionReady === false
      && artifact.runtimeEnvironmentPrerequisite.environmentIdentityIsBaselineEvidence === false,
    `${contractItem.animationId}: workspace runtime environment binding drifted or was promoted`);
    invariant(artifact.runtimeContainmentPrerequisite.requiredForEveryRuntimeSession === true
      && artifact.runtimeContainmentPrerequisite.controlsSpecified === 8
      && artifact.runtimeContainmentPrerequisite.controlsApproved === 0
      && artifact.runtimeContainmentPrerequisite.controlsVerified === 0
      && artifact.runtimeContainmentPrerequisite.state === "closed-awaiting-approved-side-effect-containment"
      && artifact.runtimeContainmentPrerequisite.sideEffectContainmentApproved === false
      && artifact.runtimeContainmentPrerequisite.noEgressVerificationPassed === false
      && artifact.runtimeContainmentPrerequisite.readOnlyLocalDependencyAllowlistBound === false
      && artifact.runtimeContainmentPrerequisite.ephemeralRuntimeProfileBound === false
      && artifact.runtimeContainmentPrerequisite.emptySharedObjectStoreVerified === false
      && artifact.runtimeContainmentPrerequisite.safeToExecuteNow === false
      && artifact.runtimeContainmentPrerequisite.staticCallsAreRuntimeReachabilityProof === false,
    `${contractItem.animationId}: workspace runtime containment binding drifted or was promoted`);
    const expectedPreparedControlIds = contractItem.animationId === "course-g04-l03-ts-006"
      ? ["CR-02"]
      : [];
    invariant(isDeepStrictEqual(artifact.executionGate.preparedContainmentControlIds, expectedPreparedControlIds)
      && artifact.preparedContainmentArtifacts.length === expectedPreparedControlIds.length
      && artifact.preparedContainmentArtifacts.every((candidate) => candidate.controlId === "CR-02"
        && candidate.state === "technical-artifact-prepared-not-approved"
        && candidate.summary.files === 657
        && candidate.summary.bytes === 35_469_789
        && candidate.stagedRoot.fileMode === "0444"
        && candidate.stagedRoot.directoryMode === "0555"
        && candidate.approved === false
        && candidate.verifiedForExecution === false),
    `${contractItem.animationId}: prepared containment artifact drifted or was promoted`);
    invariant(Object.entries(artifact.currentEvidenceState)
      .filter(([key]) => key !== "workOnlyAuthoringAuditEstablished")
      .every(([, value]) => value === false),
    `${contractItem.animationId}: workspace runtime or acceptance evidence state opened`);
    items.push({
      sequence: contractItem.sequence,
      animationId: contractItem.animationId,
      assetId: contractItem.assetId,
      releaseRole: contractItem.releaseRole,
      sourceKind: contractItem.source.sourceKind,
      batchId: contractItem.batch.batchId,
      authoringGateRequired: contractItem.authoringGate.required,
      authoringGateStatus: contractItem.authoringGate.status,
      staticReachableNestedDefinitions: contractItem.nativeRuntimeFacts.staticallyRootReachableNestedDefinitionCount,
      staticCandidateFamilies: contractItem.acquisitionRequirements.staticCandidateFamilyCount,
      sourceBoundScenarioCandidates: contractItem.acquisitionRequirements.sourceBoundScenarioCandidateCount,
      randomCandidate: contractItem.acquisitionRequirements.randomCandidate,
      audioRequired: contractItem.acquisitionRequirements.audio.required,
      workspaceArtifact: {
        path: relative(artifactPath),
        bytes: artifactBytes.length,
        sha256: sha256(artifactBytes),
        artifactFingerprintSha256: artifact.artifactFingerprintSha256,
      },
      migrationTechnicalManifest: {
        path: relative(manifestPath),
        sha256: technicalManifestSha256(manifest),
      },
      planningState: "current-empty-non-runnable",
      runtimeEnvironmentState: {
        installedCandidateIdentified: artifact.runtimeEnvironmentPrerequisite.installedCandidateIdentified,
        candidateExecutableTechnicallyBound: artifact.runtimeEnvironmentPrerequisite.candidateExecutableTechnicallyBound,
        runtimeVersion: artifact.runtimeEnvironmentPrerequisite.runtimeVersion,
        runtimeApprovedByOwner: false,
        authorizedHostContextIdentified: false,
        networkContainmentPlanApproved: false,
        namedOriginalRuntimeOperatorSupplied: false,
        perItemCaptureAuthorized: false,
        originalRuntimeExecutionReady: false,
        historicalStandaloneCandidateReverified:
          artifact.runtimeEnvironmentPrerequisite.historicalStandaloneCandidate !== null,
        historicalStandaloneCandidateHasStrictAuthority: false,
      },
      runtimeContainmentState: {
        requiredForEveryRuntimeSession: true,
        staticExternalSurfaceAffectedMember:
          artifact.runtimeContainmentPrerequisite.staticExternalSurfaceAffectedMember,
        exactExternalOperationCount: artifact.runtimeContainmentPrerequisite.exactExternalOperationCount,
        controlsSpecified: artifact.runtimeContainmentPrerequisite.controlsSpecified,
        controlsApproved: 0,
        controlsVerified: 0,
        sideEffectContainmentApproved: false,
        noEgressVerificationPassed: false,
        preparedControlIds: artifact.executionGate.preparedContainmentControlIds,
        preparedArtifactCount: artifact.preparedContainmentArtifacts.length,
        readOnlyLocalDependencyAllowlistTechnicallyPrepared:
          artifact.preparedContainmentArtifacts.some((candidate) => candidate.controlId === "CR-02"),
        readOnlyLocalDependencyAllowlistApproved: false,
        safeToExecuteNow: false,
      },
      executionState: {
        authoringAuditEstablished: contractItem.authoringGate.authoringAuditEstablished,
        namedOperatorsSupplied: false,
        authorizedRuntimeEstablished: false,
        captureScheduleEstablished: false,
        runtimeSessionExecuted: false,
        baselinePackageEstablished: false,
        implementationAuthorized: false,
        strictComplete: false,
      },
    });
  }

  const artifactSetSha256 = sha256(Buffer.from(items.map((item) =>
    `${item.animationId}\t${item.workspaceArtifact.sha256}\t${item.workspaceArtifact.artifactFingerprintSha256}`,
  ).join("\n")));
  const manifestTechnicalSetSha256 = sha256(Buffer.from(items.map((item) =>
    `${item.animationId}\t${item.migrationTechnicalManifest.sha256}`,
  ).join("\n")));
  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator,
    lesson: contract.lesson,
    sourceBindings: {
      lessonAcquisitionContract: contractBinding,
      workspaceMaterializer: materializerBinding,
      workspaceArtifactSet: {
        count: items.length,
        sha256: artifactSetSha256,
      },
      migrationTechnicalManifestSet: {
        count: items.length,
        sha256: manifestTechnicalSetSha256,
      },
    },
    summary: {
      canonicalItems: items.length,
      activePages: items.filter((item) => item.releaseRole === "active-xml-referenced-page").length,
      courseShells: items.filter((item) => item.releaseRole === "course-shell").length,
      workspaceArtifactsCurrent: items.filter((item) => item.planningState === "current-empty-non-runnable").length,
      emptyOperatorWorksheets: items.length,
      nonRunnableArtifacts: items.length,
      flaBackedItems: items.filter((item) => item.sourceKind === "fla+swf").length,
      swfOnlyItems: items.filter((item) => item.sourceKind === "swf-only").length,
      verifiedWorkOnlyAnimateAuthoringAudits: items.filter((item) =>
        item.executionState.authoringAuditEstablished).length,
      pendingAnimateAuthoringAudits: items.filter((item) => item.authoringGateRequired
        && !item.executionState.authoringAuditEstablished).length,
      staticallyReachableNestedDefinitions: items.reduce((sum, item) => sum + item.staticReachableNestedDefinitions, 0),
      staticCandidateFamilies: items.reduce((sum, item) => sum + item.staticCandidateFamilies, 0),
      sourceBoundScenarioCandidates: items.reduce((sum, item) => sum + item.sourceBoundScenarioCandidates, 0),
      randomCandidateItems: items.filter((item) => item.randomCandidate).length,
      audioObligationItems: items.filter((item) => item.audioRequired).length,
      installedRuntimeCandidateBoundWorkspaces: items.filter((item) =>
        item.runtimeEnvironmentState.installedCandidateIdentified
        && item.runtimeEnvironmentState.candidateExecutableTechnicallyBound).length,
      runtimeCandidateApprovedWorkspaces: 0,
      historicalStandaloneCandidatesReverified: items.filter((item) =>
        item.runtimeEnvironmentState.historicalStandaloneCandidateReverified).length,
      historicalStandaloneCandidatesWithStrictAuthority: 0,
      workspacesWithContainmentPrerequisiteBound: items.filter((item) =>
        item.runtimeContainmentState.requiredForEveryRuntimeSession).length,
      staticExternalSurfaceAffectedMembers: items.filter((item) =>
        item.runtimeContainmentState.staticExternalSurfaceAffectedMember).length,
      exactExternalSideEffectOperations: items.reduce((sum, item) =>
        sum + item.runtimeContainmentState.exactExternalOperationCount, 0),
      containmentControlsSpecified: 8,
      containmentControlsTechnicallyPrepared: 1,
      workspacesWithReadOnlyCR02ArtifactPrepared: items.filter((item) =>
        item.runtimeContainmentState.readOnlyLocalDependencyAllowlistTechnicallyPrepared).length,
      containmentControlsApproved: 0,
      namedOperatorsSupplied: 0,
      authorizedRuntimeContexts: 0,
      captureSchedulesEstablished: 0,
      runtimeSessionsExecuted: 0,
      authoritativeBaselinePackages: 0,
      implementationAuthorizations: 0,
      strictCompletions: 0,
    },
    readiness: {
      machinePlanningReady: true,
      workspacePlanningCoverageComplete: true,
      animateAuthoringCoverageComplete: true,
      animateAuthoringExecutionReady: false,
      installedRuntimeCandidateBound: true,
      installedRuntimeCandidateApproved: false,
      sideEffectContainmentRequirementsBound: true,
      readOnlyCR02TechnicalArtifactPrepared: true,
      sideEffectContainmentApproved: false,
      originalRuntimeExecutionReady: false,
      baselineCaptureReady: false,
      implementationReady: false,
      atomicPublicationReady: false,
      state: "m3-planning-materialized-execution-closed",
    },
    capacityBoundary: contract.capacityBoundary,
    items,
    acceptance: {
      acceptanceNeutral: true,
      workspacePlanningMaterialized: true,
      sourceAssetsModified: false,
      migrationManifestsModified: false,
      runtimeSessionsExecuted: false,
      authoringAccepted: false,
      authoritativeRuntimeAccepted: false,
      implementationAuthorized: false,
      visualOrBehaviorParityAccepted: false,
      rmseAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      lessonPublished: false,
      strictMigrationComplete: false,
      statement: "This report proves that the 40 acceptance-neutral workspace planning artifacts exactly reproduce the current lesson acquisition contract and technical manifest projections, including one hash-bound installed-but-unapproved runtime candidate, an unapproved eight-control side-effect containment prerequisite, one TS006 read-only CR-02 technical artifact, and 29 validated work-only Animate authoring audits. Every future runtime operator worksheet is empty and non-runnable. It proves no runtime or containment approval, authoring acceptance, authorized original runtime, natural trace, baseline, specification approval, implementation, RMSE, audio, human, owner, publication, parity, or migration completion.",
    },
  };
  return validateM3RuntimeAcquisitionReadiness(report);
}

export function validateM3RuntimeAcquisitionReadiness(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME,
    "M3 runtime-acquisition readiness identity drifted");
  invariant(report.summary.canonicalItems === 40 && report.summary.activePages === 39
    && report.summary.courseShells === 1 && report.summary.workspaceArtifactsCurrent === 40
    && report.summary.emptyOperatorWorksheets === 40 && report.summary.nonRunnableArtifacts === 40
    && report.summary.flaBackedItems === 29 && report.summary.swfOnlyItems === 11
    && report.summary.verifiedWorkOnlyAnimateAuthoringAudits === 29
    && report.summary.pendingAnimateAuthoringAudits === 0
    && report.summary.staticallyReachableNestedDefinitions === 859
    && report.summary.staticCandidateFamilies === 143
    && report.summary.sourceBoundScenarioCandidates === 193
    && report.summary.randomCandidateItems === 12 && report.summary.audioObligationItems === 40
    && report.summary.installedRuntimeCandidateBoundWorkspaces === 40
    && report.summary.runtimeCandidateApprovedWorkspaces === 0
    && report.summary.historicalStandaloneCandidatesReverified === 1
    && report.summary.historicalStandaloneCandidatesWithStrictAuthority === 0
    && report.summary.workspacesWithContainmentPrerequisiteBound === 40
    && report.summary.staticExternalSurfaceAffectedMembers === 3
    && report.summary.exactExternalSideEffectOperations === 23
    && report.summary.containmentControlsSpecified === 8
    && report.summary.containmentControlsTechnicallyPrepared === 1
    && report.summary.workspacesWithReadOnlyCR02ArtifactPrepared === 1
    && report.summary.containmentControlsApproved === 0,
  "M3 runtime-acquisition readiness exact scope drifted");
  invariant(report.items.length === 40 && new Set(report.items.map((item) => item.animationId)).size === 40,
    "M3 runtime-acquisition readiness item set drifted");
  invariant(report.readiness.machinePlanningReady === true
    && report.readiness.workspacePlanningCoverageComplete === true
    && report.readiness.animateAuthoringCoverageComplete === true
    && report.readiness.animateAuthoringExecutionReady === false
    && report.readiness.installedRuntimeCandidateBound === true
    && report.readiness.installedRuntimeCandidateApproved === false
    && report.readiness.sideEffectContainmentRequirementsBound === true
    && report.readiness.readOnlyCR02TechnicalArtifactPrepared === true
    && report.readiness.sideEffectContainmentApproved === false
    && report.readiness.originalRuntimeExecutionReady === false
    && report.readiness.baselineCaptureReady === false
    && report.readiness.implementationReady === false
    && report.readiness.atomicPublicationReady === false
    && report.readiness.state === "m3-planning-materialized-execution-closed",
  "M3 runtime-acquisition readiness gate was promoted");
  invariant(report.summary.namedOperatorsSupplied === 0
    && report.summary.authorizedRuntimeContexts === 0
    && report.summary.captureSchedulesEstablished === 0
    && report.summary.runtimeSessionsExecuted === 0
    && report.summary.authoritativeBaselinePackages === 0
    && report.summary.implementationAuthorizations === 0
    && report.summary.strictCompletions === 0,
  "M3 runtime-acquisition readiness result was promoted");
  for (const item of report.items) {
    invariant(item.planningState === "current-empty-non-runnable", `${item.animationId}: planning state drifted`);
    invariant(item.runtimeEnvironmentState.installedCandidateIdentified === true
      && item.runtimeEnvironmentState.candidateExecutableTechnicallyBound === true
      && item.runtimeEnvironmentState.runtimeVersion === "32.0.0.414"
      && item.runtimeEnvironmentState.runtimeApprovedByOwner === false
      && item.runtimeEnvironmentState.authorizedHostContextIdentified === false
      && item.runtimeEnvironmentState.networkContainmentPlanApproved === false
      && item.runtimeEnvironmentState.namedOriginalRuntimeOperatorSupplied === false
      && item.runtimeEnvironmentState.perItemCaptureAuthorized === false
      && item.runtimeEnvironmentState.originalRuntimeExecutionReady === false
      && item.runtimeEnvironmentState.historicalStandaloneCandidateHasStrictAuthority === false,
    `${item.animationId}: runtime environment state drifted or was promoted`);
    invariant(item.runtimeContainmentState.requiredForEveryRuntimeSession === true
      && Number.isInteger(item.runtimeContainmentState.exactExternalOperationCount)
      && item.runtimeContainmentState.exactExternalOperationCount >= 0
      && item.runtimeContainmentState.controlsSpecified === 8
      && item.runtimeContainmentState.controlsApproved === 0
      && item.runtimeContainmentState.controlsVerified === 0
      && Array.isArray(item.runtimeContainmentState.preparedControlIds)
      && item.runtimeContainmentState.preparedArtifactCount
        === item.runtimeContainmentState.preparedControlIds.length
      && item.runtimeContainmentState.readOnlyLocalDependencyAllowlistApproved === false
      && item.runtimeContainmentState.sideEffectContainmentApproved === false
      && item.runtimeContainmentState.noEgressVerificationPassed === false
      && item.runtimeContainmentState.safeToExecuteNow === false,
    `${item.animationId}: runtime containment state drifted or was promoted`);
    const isTs006 = item.animationId === "course-g04-l03-ts-006";
    invariant(item.runtimeContainmentState.readOnlyLocalDependencyAllowlistTechnicallyPrepared === isTs006
      && item.runtimeContainmentState.preparedArtifactCount === (isTs006 ? 1 : 0)
      && item.runtimeContainmentState.preparedControlIds.join("|") === (isTs006 ? "CR-02" : ""),
    `${item.animationId}: CR-02 preparation scope drifted`);
    assertExecutionState(item.executionState, item.authoringGateRequired, `${item.animationId} executionState`);
    invariant(/^[a-f0-9]{64}$/.test(item.workspaceArtifact.sha256)
      && /^[a-f0-9]{64}$/.test(item.workspaceArtifact.artifactFingerprintSha256)
      && /^[a-f0-9]{64}$/.test(item.migrationTechnicalManifest.sha256),
    `${item.animationId}: workspace or manifest binding is malformed`);
  }
  invariant(report.capacityBoundary.bulkLessonCaptureAdmittedByThisContract === false
    && report.capacityBoundary.boundedSessionRequiresLiveCapacityPreflight === true
    && report.capacityBoundary.capacityIsFidelityEvidence === false,
  "M3 runtime-acquisition capacity boundary was promoted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.workspacePlanningMaterialized === true
    && report.acceptance.sourceAssetsModified === false
    && report.acceptance.migrationManifestsModified === false
    && report.acceptance.runtimeSessionsExecuted === false
    && report.acceptance.authoringAccepted === false
    && report.acceptance.authoritativeRuntimeAccepted === false
    && report.acceptance.implementationAuthorized === false
    && report.acceptance.visualOrBehaviorParityAccepted === false
    && report.acceptance.rmseAccepted === false
    && report.acceptance.audioAccepted === false
    && report.acceptance.humanVisualAccepted === false
    && report.acceptance.ownerAccepted === false
    && report.acceptance.lessonPublished === false
    && report.acceptance.strictMigrationComplete === false,
  "M3 runtime-acquisition acceptance state drifted");
  return report;
}

export function renderMarkdown(report) {
  validateM3RuntimeAcquisitionReadiness(report);
  const rows = report.items.map((item) => `| ${item.sequence} | \`${item.animationId}\` | ${item.sourceKind} | ${item.authoringGateRequired ? "verified work-only" : "n/a"} | ${item.staticReachableNestedDefinitions} | ${item.staticCandidateFamilies}/${item.sourceBoundScenarioCandidates} | ${item.randomCandidate ? "yes" : "no"} | ${item.audioRequired ? "yes" : "no"} | closed |`).join("\n");
  return `# G4 L3 M3 Runtime-Acquisition Readiness\n\n`
    + `Machine planning coverage is **40/40**, but execution remains closed. This report validates one current, empty, non-runnable workspace planning artifact for each of the 39 active pages and the course shell.\n\n`
    + `## Result\n\n`
    + `- Workspace planning artifacts: **${report.summary.workspaceArtifactsCurrent}/40** current.\n`
    + `- Empty operator worksheets: **${report.summary.emptyOperatorWorksheets}/40**; named operators, runtime contexts, schedules, sessions, and baselines: **0**.\n`
    + `- Source split: **${report.summary.flaBackedItems} FLA/SWF + ${report.summary.swfOnlyItems} SWF-only**; verified work-only Animate authoring audits: **${report.summary.verifiedWorkOnlyAnimateAuthoringAudits}**; pending: **${report.summary.pendingAnimateAuthoringAudits}**.\n`
    + `- Installed runtime candidate: **bound into ${report.summary.installedRuntimeCandidateBoundWorkspaces}/40 workspaces**, approved in **${report.summary.runtimeCandidateApprovedWorkspaces}/40**. One historical standalone frame set is reverified but has no strict authority.\n`
    + `- Side-effect containment: prerequisite bound into **${report.summary.workspacesWithContainmentPrerequisiteBound}/40** workspaces; **${report.summary.exactExternalSideEffectOperations} exact operations across ${report.summary.staticExternalSurfaceAffectedMembers} members**; **${report.summary.containmentControlsSpecified} controls specified / 0 approved**.\n`
    + `- CR-02 local dependency tree: **1 technical artifact prepared for TS006 / 0 approved**; the remaining 39 workspaces have no prepared CR-02 artifact.\n`
    + `- Static planning workload: **${report.summary.staticallyReachableNestedDefinitions}** reachable nested definitions, **${report.summary.staticCandidateFamilies}** candidate families, **${report.summary.sourceBoundScenarioCandidates}** source-bound scenario candidates, **${report.summary.randomCandidateItems}** random-candidate members, and **${report.summary.audioObligationItems}** audio-obligation members.\n`
    + `- Readiness state: \`${report.readiness.state}\`. Implementation and atomic publication remain closed.\n`
    + `- Capacity boundary: \`${report.capacityBoundary.boundSnapshotAdmission}\`; every future bounded session requires a fresh live-capacity preflight.\n\n`
    + `## Workspace matrix\n\n`
    + `| # | Animation | Source | Animate audit | Nested defs | Candidates | Random | Audio | Execution |\n`
    + `| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |\n${rows}\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(ROOT, argv[++index] || "");
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(ROOT, argv[++index] || "");
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildM3RuntimeAcquisitionReadiness();
  const jsonText = stableJson(report);
  const markdownText = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(currentJson === jsonText, `${relative(options.jsonOutput)} is stale`);
    invariant(currentMarkdown === markdownText, `${relative(options.markdownOutput)} is stale`);
    process.stdout.write(`PASS ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)} are current\n`);
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, jsonText),
    writeFile(options.markdownOutput, markdownText),
  ]);
  process.stdout.write(`Wrote ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
