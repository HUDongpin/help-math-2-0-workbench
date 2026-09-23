#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-first-original-runtime-session-readiness";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);
const SHA256 = /^[a-f0-9]{64}$/;
const GIB = 1024 ** 3;

const INPUTS = Object.freeze([
  {
    key: "runtimeAcquisitionContract",
    file: "reports/g4-l3-authoritative-runtime-acquisition-contract.json",
    reportType: "g4-l3-authoritative-runtime-acquisition-contract",
    schemaVersion: 1,
  },
  {
    key: "m3RuntimeAcquisitionReadiness",
    file: "reports/g4-l3-m3-runtime-acquisition-readiness.json",
    reportType: "g4-l3-m3-runtime-acquisition-readiness",
    schemaVersion: 1,
  },
  {
    key: "captureCapacityReadiness",
    file: "reports/g4-l3-capture-capacity-readiness.json",
    reportType: "g4-l3-capture-capacity-readiness",
    schemaVersion: 1,
  },
  {
    key: "runtimeContainmentReadiness",
    file: "reports/g4-l3-original-runtime-containment-readiness.json",
    reportType: "g4-l3-original-runtime-containment-readiness",
    schemaVersion: 1,
  },
  {
    key: "ts006ReadOnlyHostTree",
    file: "work/original-runtime-host-trees/course-g04-l03-ts-006/root/staging-manifest.json",
    reportType: "g4-l3-ts006-read-only-original-runtime-host-tree",
    schemaVersion: 1,
  },
  {
    key: "ts006SessionProtocolDraft",
    file: "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json",
    reportType: "g4-l3-ts006-original-runtime-session-protocol-draft",
    schemaVersion: 1,
  },
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function relative(file) {
  const candidate = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return candidate;
}

function resolveProjectPath(file) {
  const absolute = path.resolve(ROOT, file);
  const candidate = path.relative(ROOT, absolute);
  invariant(candidate && !candidate.startsWith("..") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return absolute;
}

async function projectBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), sha256: sha256(bytes), bytes: bytes.length};
}

async function readInput(definition) {
  const absolute = resolveProjectPath(definition.file);
  const bytes = await readFile(absolute);
  const report = JSON.parse(bytes);
  invariant(report.reportType === definition.reportType && report.schemaVersion === definition.schemaVersion,
    `${definition.key}: report identity drifted`);
  const generatorFile = report.generator?.file ?? report.generator?.path;
  invariant(typeof generatorFile === "string" && generatorFile.startsWith("scripts/") && !generatorFile.includes(".."),
    `${definition.key}: generator binding is missing or unsafe`);
  const generator = await projectBinding(resolveProjectPath(generatorFile));
  if (report.generator.sha256 !== undefined) {
    invariant(report.generator.sha256 === generator.sha256, `${definition.key}: generator hash is stale`);
  }
  if (report.generator.bytes !== undefined) {
    invariant(report.generator.bytes === generator.bytes, `${definition.key}: generator byte count is stale`);
  }
  return {
    definition,
    report,
    binding: {
      file: definition.file,
      sha256: sha256(bytes),
      bytes: bytes.length,
      reportType: report.reportType,
      schemaVersion: report.schemaVersion,
      generator,
    },
  };
}

function selectionCandidates(contract) {
  return contract.items
    .filter((item) => item.releaseRole === "active-xml-referenced-page"
      && item.authoringGate.authoringAuditEstablished
      && item.acquisitionRequirements.randomCandidate === false
      && item.runtimeContainmentPrerequisite.exactExternalOperationCount === 0
      && item.acquisitionRequirements.sourceBoundScenarioCandidateCount === 1
      && item.acquisitionRequirements.staticCandidateFamilyCount === 1)
    .map((item) => ({
      sequence: item.sequence,
      animationId: item.animationId,
      staticallyReachableDeclaredFrameCount:
        item.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum,
      sourceBoundScenarioCandidateCount:
        item.acquisitionRequirements.sourceBoundScenarioCandidateCount,
      staticCandidateFamilyCount: item.acquisitionRequirements.staticCandidateFamilyCount,
      exactExternalOperationCount: item.runtimeContainmentPrerequisite.exactExternalOperationCount,
      randomCandidate: item.acquisitionRequirements.randomCandidate,
      authoringAuditEstablished: item.authoringGate.authoringAuditEstablished,
    }))
    .sort((left, right) =>
      left.staticallyReachableDeclaredFrameCount - right.staticallyReachableDeclaredFrameCount
      || left.sequence - right.sequence);
}

function boundedCapacityEnvelope(item, capacity) {
  const logicalEvidenceFrames = item.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum * 2;
  const pngObjectCount = logicalEvidenceFrames * capacity.capacityModel.pngCopiesPerLogicalFrame;
  const pngBytesPerObject = capacity.captureSample.actualPngBytes.p95;
  const rawPngBytes = pngObjectCount * pngBytesPerObject;
  const archiveOverheadMultiplier = 1.6;
  const fixedWorkingBytes = 4 * GIB;
  const incrementalBytes = Math.ceil(rawPngBytes * archiveOverheadMultiplier + fixedWorkingBytes);
  const remainingEvidenceSafetyMultiplier = capacity.capacityModel.remainingEvidenceSafetyMultiplier;
  const operationalReserveBytes = capacity.capacityModel.operationalReserveBytes;
  const requiredAvailableBytes = Math.ceil(incrementalBytes * remainingEvidenceSafetyMultiplier)
    + operationalReserveBytes;
  const availableBytesAtBoundSnapshot = capacity.capacityModel.availableBytes;
  return {
    classification: "conservative-static-two-language-three-png-role-envelope-not-runtime-coverage",
    reachableDeclaredFramesPerLanguage: item.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum,
    languageCount: 2,
    languages: ["en", "es"],
    logicalEvidenceFrames,
    pngCopiesPerLogicalFrame: capacity.capacityModel.pngCopiesPerLogicalFrame,
    pngCopyRoles: capacity.capacityModel.scenarios.high.pngCopyRoles,
    pngObjectCount,
    pngBytesPerObject,
    pngByteStatistic: "current capture sample p95",
    rawPngBytes,
    archiveOverheadMultiplier,
    fixedWorkingBytes,
    incrementalBytes,
    remainingEvidenceSafetyMultiplier,
    operationalReserveBytes,
    requiredAvailableBytes,
    availableBytesAtBoundSnapshot,
    headroomBytesAfterEnvelopeAndReserve: availableBytesAtBoundSnapshot - requiredAvailableBytes,
    boundedStaticEnvelopeFitsWithReserve: availableBytesAtBoundSnapshot >= requiredAvailableBytes,
    livePreflightStillRequired: true,
    envelopeIsFidelityOrExecutionAuthorization: false,
  };
}

export async function buildFirstOriginalRuntimeSessionReadiness() {
  const inputs = [];
  for (const definition of INPUTS) inputs.push(await readInput(definition));
  const byKey = Object.fromEntries(inputs.map((input) => [input.definition.key, input.report]));
  const bindings = Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding]));
  const contract = byKey.runtimeAcquisitionContract;
  const m3 = byKey.m3RuntimeAcquisitionReadiness;
  const capacity = byKey.captureCapacityReadiness;
  const containment = byKey.runtimeContainmentReadiness;
  const hostTree = byKey.ts006ReadOnlyHostTree;
  const protocolDraft = byKey.ts006SessionProtocolDraft;

  invariant(contract.summary.canonicalItems === 40
    && contract.summary.verifiedWorkOnlyAnimateAuthoringAudits === 29
    && contract.summary.acquisitionSessionsExecuted === 0
    && contract.executionGate.installedOriginalRuntimeCandidateIdentified === true
    && contract.executionGate.perItemCaptureAuthorized === false,
  "Runtime acquisition contract scope drifted or was opened");
  invariant(m3.summary.workspaceArtifactsCurrent === 40
    && m3.summary.installedRuntimeCandidateBoundWorkspaces === 40
    && m3.summary.workspacesWithContainmentPrerequisiteBound === 40
    && m3.summary.runtimeSessionsExecuted === 0
    && m3.readiness.originalRuntimeExecutionReady === false,
  "M3 workspace readiness drifted or was opened");
  invariant(m3.sourceBindings.lessonAcquisitionContract.sha256
      === bindings.runtimeAcquisitionContract.sha256
    && containment.sourceBindings.originalRuntimeEnvironmentReadiness.sha256
      === contract.sourceBindings.originalRuntimeEnvironmentReadiness.sha256
    && contract.sourceBindings.captureCapacityReadiness.sha256
      === bindings.captureCapacityReadiness.sha256
    && contract.sourceBindings.originalRuntimeContainmentReadiness.sha256
      === bindings.runtimeContainmentReadiness.sha256,
  "First-session inputs do not share one current evidence chain");
  invariant(capacity.capacityModel.admission === "admit-full-lesson-capture-capacity"
    && capacity.capacityModel.remainingEvidenceSafetyMultiplier === 1.20
    && capacity.capacityModel.operationalReserveBytes === 100 * GIB
    && capacity.capacityModel.admissionIsFidelityEvidence === false,
  "Capacity snapshot no longer matches the bounded-session planning state");
  invariant(containment.summary.containmentControlsSpecified === 8
    && containment.summary.containmentControlsApproved === 0
    && containment.executionGate.originalRuntimeExecutionReady === false,
  "Containment controls drifted or were approved outside this packet");
  invariant(hostTree.selectedCandidate.animationId === "course-g04-l03-ts-006"
    && hostTree.summary.files === 657
    && hostTree.summary.bytes === 35_469_789
    && hostTree.summary.filesByExtension.mp3 === 146
    && hostTree.summary.filesByExtension.swf === 508
    && hostTree.summary.filesByExtension.xml === 3
    && SHA256.test(hostTree.fileSetSha256)
    && hostTree.stagedRoot.directoryMode === "0555"
    && hostTree.stagedRoot.fileMode === "0444"
    && hostTree.stagedRoot.regularCopiedFilesOnly === true
    && hostTree.stagedRoot.symbolicLinks === 0
    && hostTree.stagedRoot.hardLinks === 0
    && hostTree.executionGate.cr02TechnicalArtifactPrepared === true
    && hostTree.executionGate.cr02Approved === false
    && hostTree.executionGate.originalRuntimeExecutionReady === false,
  "TS006 read-only host tree drifted, was incomplete, or was promoted");
  invariant(protocolDraft.scope.animationId === "course-g04-l03-ts-006"
    && protocolDraft.summary.traceCandidatesPrepared === 2
    && protocolDraft.summary.protocolSteps === 10
    && protocolDraft.summary.schedulesAccepted === 0
    && protocolDraft.summary.runtimeSessionsExecuted === 0
    && protocolDraft.proposedProtocol.state === "draft-not-scheduled-not-authorized"
    && protocolDraft.proposedProtocol.directSeekAllowed === false
    && protocolDraft.executionGate.protocolDraftPrepared === true
    && protocolDraft.executionGate.originalRuntimeExecutionReady === false,
  "TS006 session protocol draft drifted, was accepted, or was executed");

  const candidates = selectionCandidates(contract);
  invariant(candidates.length === 2
    && candidates[0].animationId === "course-g04-l03-ts-006"
    && candidates[0].staticallyReachableDeclaredFrameCount === 139
    && candidates[1].animationId === "course-g04-l03-in-003"
    && candidates[1].staticallyReachableDeclaredFrameCount === 483,
  "Deterministic first-session candidate ranking drifted");
  const item = contract.items.find((candidate) => candidate.animationId === candidates[0].animationId);
  const workspace = m3.items.find((candidate) => candidate.animationId === item.animationId);
  invariant(workspace?.planningState === "current-empty-non-runnable"
    && workspace.executionState.runtimeSessionExecuted === false,
  "Selected first-session workspace is missing or executable");
  const capacityEnvelope = boundedCapacityEnvelope(item, capacity);
  invariant(capacityEnvelope.boundedStaticEnvelopeFitsWithReserve === true
    && capacityEnvelope.headroomBytesAfterEnvelopeAndReserve > 0,
  "Selected first-session static capacity envelope no longer fits with reserve");

  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator: await projectBinding(GENERATOR_PATH),
    scope: {
      releaseId: contract.lesson.releaseId,
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      sessionScope: "one candidate page only",
      purpose: "authorization and containment decision packet; no runtime execution",
    },
    sourceBindings: bindings,
    candidateSelection: {
      state: "recommended-first-session-candidate-not-authorized",
      method: "active FLA-backed pages with verified work-only authoring audit, zero exact static external operations, no static random candidate, exactly one source-bound scenario candidate and one static candidate family; then ascending statically reachable declared frame count and lesson sequence",
      eligibleCandidateCount: candidates.length,
      ranking: candidates,
      selectedAnimationId: item.animationId,
      selectionIsRuntimeReachabilityOrFidelityEvidence: false,
    },
    selectedCandidate: {
      sequence: item.sequence,
      animationId: item.animationId,
      assetId: item.assetId,
      classification: item.classification,
      source: item.source,
      nativeRuntimeFacts: item.nativeRuntimeFacts,
      authoringGate: item.authoringGate,
      sourceBoundScenarioCandidates: item.acquisitionRequirements.sourceBoundScenarioCandidates,
      staticCandidateFamilies: item.acquisitionRequirements.staticCandidateFamilies,
      audioObligation: item.acquisitionRequirements.audio,
      navigationAndReplayObligation: item.acquisitionRequirements.navigationAndReplay,
      captureIdentityContract: item.captureIdentityContract,
      directSeekPolicy: item.directSeekPolicy,
      runtimeEnvironmentPrerequisite: item.runtimeEnvironmentPrerequisite,
      runtimeContainmentPrerequisite: item.runtimeContainmentPrerequisite,
      workspaceArtifact: workspace.workspaceArtifact,
      currentEvidenceState: item.currentEvidenceState,
    },
    boundedCapacityEnvelope: capacityEnvelope,
    requiredNaturalEvidence: {
      state: "schedule-not-established",
      protocolDraftPrepared: true,
      protocolDraft: {
        binding: bindings.ts006SessionProtocolDraft,
        state: protocolDraft.proposedProtocol.state,
        candidateIds: protocolDraft.traceCandidates.map((candidate) => candidate.protocolTraceCandidateId),
        entryStateCandidateSha256Values:
          protocolDraft.traceCandidates.map((candidate) => candidate.entryStateCandidateSha256),
        stepIds: protocolDraft.proposedProtocol.steps.map((step) => step.stepId),
        authoritativeScheduleEstablished: false,
      },
      requiredFamilies: [
        "authorized same-lesson host natural entry in English",
        "authorized same-lesson host natural entry in Spanish",
        "root timeline natural playback and terminal stop",
        "runtime disposition of sprite-3 and sprite-23, including every reachable transition",
        "embedded stream identity/timing plus the associated Spanish MP3 path",
        "complete Replay reset and previous/next host navigation",
      ],
      requirementIds: [],
      traceIds: [],
      entryStateSha256Values: [],
      eventSchedule: [],
      captureSchedule: [],
      deterministicSeedBindings: [],
      authoritativeScenarioInventoryEstablished: false,
      authoritativeTraceSpecificationEstablished: false,
      naturalExecutionProofEstablished: false,
      directSeekAuthorized: false,
    },
    sessionControls: {
      containmentControlIds: containment.containmentPlan.controls.map((control) => control.controlId),
      preparedControlIds: ["CR-02"],
      selectedMechanisms: [],
      approvedControlIds: [],
      verifiedControlIds: [],
      readOnlyLocalDependencyAllowlist: {
        state: "technical-artifact-prepared-not-approved",
        controlId: "CR-02",
        manifest: bindings.ts006ReadOnlyHostTree,
        stagedRoot: hostTree.stagedRoot,
        fileSetSha256: hostTree.fileSetSha256,
        manifestFingerprintSha256: hostTree.manifestFingerprintSha256,
        files: hostTree.summary.files,
        bytes: hostTree.summary.bytes,
        filesByExtension: hostTree.summary.filesByExtension,
        approved: false,
        verifiedForExecution: false,
      },
      allowedOutboundDestinations: [],
      legacyEndpointAllowlist: [],
      runtimeProfilePath: null,
      sharedObjectStorePath: null,
      authorizedHostContext: null,
      launchPath: null,
      launchCommand: null,
      stopConditions: [
        "abort on any unexpected dialog",
        "abort on browser navigation, javascript URL, host command, or unallowlisted resource request",
        "abort if the source/runtime/capacity/containment hash chain differs from this packet",
        "abort if a prior Flash SharedObject or non-empty disposable profile is detected",
      ],
    },
    operatorWorksheet: {
      status: "empty-authorization-template",
      ownerDecision: null,
      ownerDecisionAt: null,
      namedOriginalRuntimeOperator: null,
      authorizedHost: null,
      containmentApprover: null,
      capacityPreflightAt: null,
      sessionId: null,
      sessionWindow: null,
      runtimeReceipt: null,
      captureSessionAttestation: null,
    },
    executionGate: {
      state: "closed-first-session-candidate-prepared-not-authorized",
      deterministicCandidateSelected: true,
      sourceHashesBound: true,
      workOnlyAuthoringAuditBound: true,
      installedRuntimeCandidateBound: true,
      containmentRequirementsSpecified: true,
      boundedStaticCapacityEnvelopeFitsWithReserve: true,
      ownerRuntimeApprovalBound: false,
      namedOriginalRuntimeOperatorSupplied: false,
      authorizedHostContextIdentified: false,
      containmentMechanismsSelected: false,
      containmentControlsApproved: false,
      noEgressVerificationPassed: false,
      readOnlyLocalDependencyAllowlistBound: true,
      ephemeralRuntimeProfileBound: false,
      emptySharedObjectStoreVerified: false,
      naturalTraceScheduleEstablished: false,
      naturalTraceProtocolDraftPrepared: true,
      liveCapacityPreflightPassed: false,
      originalRuntimeExecutionReady: false,
      launchesRuntimeByThisBuilder: false,
      launchesAnimateByThisBuilder: false,
      reason: "TS006 is the deterministic first-session candidate, its conservative static storage envelope fits with reserve, and a hash-bound read-only CR-02 dependency tree is technically prepared. CR-02 and all other controls remain unapproved; the owner, named original-runtime operator, host context, containment mechanisms, trace schedule, and live capacity preflight remain unbound.",
    },
    summary: {
      eligibleCandidates: candidates.length,
      selectedCandidates: 1,
      selectedCandidateDeclaredFrames: item.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum,
      containmentControlsRequired: 8,
      containmentControlsPrepared: 1,
      containmentControlsApproved: 0,
      readOnlyHostTreeFilesPrepared: hostTree.summary.files,
      readOnlyHostTreeBytesPrepared: hostTree.summary.bytes,
      naturalTraceSchedulesEstablished: 0,
      naturalTraceProtocolDraftsPrepared: 1,
      namedRuntimeOperators: 0,
      authorizedRuntimeContexts: 0,
      runtimeSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      implementationAuthorizations: 0,
      strictCompletions: 0,
    },
    acceptance: {
      acceptanceNeutral: true,
      firstCandidatePrepared: true,
      capacityEnvelopeEstablished: true,
      readOnlyHostTreePrepared: true,
      protocolDraftPrepared: true,
      runtimeApproved: false,
      containmentApproved: false,
      traceScheduleAccepted: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This packet chooses one low-static-risk first-session candidate, proves that a conservative static storage envelope fits the bound snapshot with reserve, binds a separate hash-verified read-only CR-02 dependency tree, and binds a deterministic EN/ES operator-protocol draft. It launches nothing and records no human identity, accepted schedule, or approval. Technical preparation does not prove runtime reachability, containment approval, authorization, baseline authority, fidelity, acceptance, parity, or completion.",
    },
  };
  return validateFirstOriginalRuntimeSessionReadiness(report);
}

export function validateFirstOriginalRuntimeSessionReadiness(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME,
    "First original-runtime session report identity drifted");
  invariant(report.scope.canonicalItems === 40 && report.scope.activePages === 39
    && report.scope.courseShells === 1 && Object.keys(report.sourceBindings).length === INPUTS.length,
  "First original-runtime session scope or source bindings drifted");
  for (const definition of INPUTS) {
    const binding = report.sourceBindings[definition.key];
    invariant(binding?.file === definition.file && binding.reportType === definition.reportType
      && binding.schemaVersion === definition.schemaVersion && SHA256.test(binding.sha256)
      && binding.generator?.file.startsWith("scripts/") && SHA256.test(binding.generator.sha256),
    `${definition.key}: first-session source binding drifted`);
  }
  invariant(report.candidateSelection.state === "recommended-first-session-candidate-not-authorized"
    && report.candidateSelection.eligibleCandidateCount === 2
    && report.candidateSelection.selectedAnimationId === "course-g04-l03-ts-006"
    && report.candidateSelection.ranking[0].animationId === "course-g04-l03-ts-006"
    && report.candidateSelection.ranking[0].staticallyReachableDeclaredFrameCount === 139
    && report.candidateSelection.ranking[1].animationId === "course-g04-l03-in-003"
    && report.candidateSelection.ranking[1].staticallyReachableDeclaredFrameCount === 483
    && report.candidateSelection.selectionIsRuntimeReachabilityOrFidelityEvidence === false,
  "First original-runtime candidate selection drifted or was promoted");
  const item = report.selectedCandidate;
  invariant(item.animationId === "course-g04-l03-ts-006"
    && item.source.swf.sha256 === "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47"
    && item.source.fla.sha256 === "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd"
    && item.nativeRuntimeFacts.stage.width === 800 && item.nativeRuntimeFacts.stage.height === 600
    && item.nativeRuntimeFacts.fps === 12 && item.nativeRuntimeFacts.rootFrameCount === 10
    && item.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum === 139
    && item.authoringGate.authoringAuditEstablished === true
    && item.runtimeEnvironmentPrerequisite.runtimeApprovedByOwner === false
    && item.runtimeContainmentPrerequisite.exactExternalOperationCount === 0
    && item.currentEvidenceState.authoritativeBaselinePackageEstablished === false,
  "Selected first original-runtime candidate identity or evidence state drifted");
  const capacity = report.boundedCapacityEnvelope;
  invariant(capacity.reachableDeclaredFramesPerLanguage === 139
    && capacity.languageCount === 2 && capacity.logicalEvidenceFrames === 278
    && capacity.pngCopiesPerLogicalFrame === 3 && capacity.pngObjectCount === 834
    && capacity.pngBytesPerObject > 0 && capacity.incrementalBytes > 4 * GIB
    && capacity.remainingEvidenceSafetyMultiplier === 1.20
    && capacity.operationalReserveBytes === 100 * GIB
    && capacity.requiredAvailableBytes
      === Math.ceil(capacity.incrementalBytes * capacity.remainingEvidenceSafetyMultiplier)
        + capacity.operationalReserveBytes
    && capacity.headroomBytesAfterEnvelopeAndReserve > 0
    && capacity.boundedStaticEnvelopeFitsWithReserve === true
    && capacity.livePreflightStillRequired === true
    && capacity.envelopeIsFidelityOrExecutionAuthorization === false,
  "First original-runtime capacity envelope drifted or was promoted");
  invariant(report.requiredNaturalEvidence.state === "schedule-not-established"
    && report.requiredNaturalEvidence.protocolDraftPrepared === true
    && report.requiredNaturalEvidence.protocolDraft.state === "draft-not-scheduled-not-authorized"
    && report.requiredNaturalEvidence.protocolDraft.candidateIds.join("|")
      === "candidate:course-g04-l03-ts-006:natural-host-entry:en|candidate:course-g04-l03-ts-006:natural-host-entry:es"
    && report.requiredNaturalEvidence.protocolDraft.entryStateCandidateSha256Values.length === 2
    && report.requiredNaturalEvidence.protocolDraft.entryStateCandidateSha256Values.every((value) => SHA256.test(value))
    && report.requiredNaturalEvidence.protocolDraft.stepIds.join("|")
      === "P00|P01|P02|P03|P04|P05|P06|P07|P08|P09"
    && report.requiredNaturalEvidence.protocolDraft.authoritativeScheduleEstablished === false
    && report.requiredNaturalEvidence.requiredFamilies.length === 6
    && report.requiredNaturalEvidence.requirementIds.length === 0
    && report.requiredNaturalEvidence.traceIds.length === 0
    && report.requiredNaturalEvidence.captureSchedule.length === 0
    && report.requiredNaturalEvidence.authoritativeScenarioInventoryEstablished === false
    && report.requiredNaturalEvidence.authoritativeTraceSpecificationEstablished === false
    && report.requiredNaturalEvidence.naturalExecutionProofEstablished === false
    && report.requiredNaturalEvidence.directSeekAuthorized === false,
  "First original-runtime natural evidence schedule was promoted");
  invariant(report.sessionControls.containmentControlIds.join("|")
      === "CR-01|CR-02|CR-03|CR-04|CR-05|CR-06|CR-07|CR-08"
    && report.sessionControls.preparedControlIds.join("|") === "CR-02"
    && report.sessionControls.selectedMechanisms.length === 0
    && report.sessionControls.approvedControlIds.length === 0
    && report.sessionControls.verifiedControlIds.length === 0
    && report.sessionControls.readOnlyLocalDependencyAllowlist.state
      === "technical-artifact-prepared-not-approved"
    && report.sessionControls.readOnlyLocalDependencyAllowlist.controlId === "CR-02"
    && report.sessionControls.readOnlyLocalDependencyAllowlist.files === 657
    && report.sessionControls.readOnlyLocalDependencyAllowlist.bytes === 35_469_789
    && report.sessionControls.readOnlyLocalDependencyAllowlist.filesByExtension.mp3 === 146
    && report.sessionControls.readOnlyLocalDependencyAllowlist.filesByExtension.swf === 508
    && report.sessionControls.readOnlyLocalDependencyAllowlist.filesByExtension.xml === 3
    && SHA256.test(report.sessionControls.readOnlyLocalDependencyAllowlist.fileSetSha256)
    && report.sessionControls.readOnlyLocalDependencyAllowlist.stagedRoot.directoryMode === "0555"
    && report.sessionControls.readOnlyLocalDependencyAllowlist.stagedRoot.fileMode === "0444"
    && report.sessionControls.readOnlyLocalDependencyAllowlist.approved === false
    && report.sessionControls.readOnlyLocalDependencyAllowlist.verifiedForExecution === false
    && report.sessionControls.allowedOutboundDestinations.length === 0
    && report.sessionControls.launchPath === null
    && report.sessionControls.launchCommand === null,
  "First original-runtime session controls were selected or opened");
  invariant(Object.entries(report.operatorWorksheet)
    .filter(([key]) => key !== "status")
    .every(([, value]) => value === null),
  "First original-runtime operator worksheet is not empty");
  const allowedTrueGateKeys = new Set([
    "deterministicCandidateSelected",
    "sourceHashesBound",
    "workOnlyAuthoringAuditBound",
    "installedRuntimeCandidateBound",
    "containmentRequirementsSpecified",
    "boundedStaticCapacityEnvelopeFitsWithReserve",
    "readOnlyLocalDependencyAllowlistBound",
    "naturalTraceProtocolDraftPrepared",
  ]);
  for (const [key, value] of Object.entries(report.executionGate)) {
    if (typeof value === "boolean") {
      invariant(value === allowedTrueGateKeys.has(key), `First original-runtime execution gate ${key} drifted`);
    }
  }
  invariant(report.executionGate.state === "closed-first-session-candidate-prepared-not-authorized"
    && report.executionGate.originalRuntimeExecutionReady === false,
  "First original-runtime execution gate opened");
  invariant(report.summary.eligibleCandidates === 2 && report.summary.selectedCandidates === 1
    && report.summary.selectedCandidateDeclaredFrames === 139
    && report.summary.containmentControlsRequired === 8
    && report.summary.containmentControlsPrepared === 1
    && report.summary.containmentControlsApproved === 0
    && report.summary.readOnlyHostTreeFilesPrepared === 657
    && report.summary.readOnlyHostTreeBytesPrepared === 35_469_789
    && report.summary.naturalTraceSchedulesEstablished === 0
    && report.summary.naturalTraceProtocolDraftsPrepared === 1
    && report.summary.namedRuntimeOperators === 0
    && report.summary.authorizedRuntimeContexts === 0
    && report.summary.runtimeSessionsExecuted === 0
    && report.summary.authoritativeBaselinePackagesEstablished === 0
    && report.summary.implementationAuthorizations === 0
    && report.summary.strictCompletions === 0,
  "First original-runtime session summary drifted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.firstCandidatePrepared === true
    && report.acceptance.capacityEnvelopeEstablished === true
    && report.acceptance.readOnlyHostTreePrepared === true
    && report.acceptance.protocolDraftPrepared === true
    && Object.entries(report.acceptance)
      .filter(([key]) => ![
        "acceptanceNeutral",
        "firstCandidatePrepared",
        "capacityEnvelopeEstablished",
        "readOnlyHostTreePrepared",
        "protocolDraftPrepared",
        "statement",
      ].includes(key))
      .every(([, value]) => value === false),
  "First original-runtime session acceptance was promoted");
  return report;
}

function formatGib(bytes) {
  return `${(bytes / GIB).toFixed(2)} GiB`;
}

export function renderMarkdown(report) {
  validateFirstOriginalRuntimeSessionReadiness(report);
  const item = report.selectedCandidate;
  const capacity = report.boundedCapacityEnvelope;
  const rankingRows = report.candidateSelection.ranking.map((candidate, index) =>
    `| ${index + 1} | \`${candidate.animationId}\` | ${candidate.staticallyReachableDeclaredFrameCount} | ${candidate.sourceBoundScenarioCandidateCount} | 0 |`,
  ).join("\n");
  const evidenceRows = report.requiredNaturalEvidence.requiredFamilies
    .map((family) => `- ${family}`).join("\n");
  const controlRows = report.sessionControls.containmentControlIds
    .map((controlId) => `| ${controlId} | ${controlId === "CR-02" ? "technical artifact prepared" : "unselected"} | false | false |`).join("\n");
  const hostTree = report.sessionControls.readOnlyLocalDependencyAllowlist;
  const protocol = report.requiredNaturalEvidence.protocolDraft;
  return `# G4 L3 First Original-Runtime Session Readiness\n\n`
    + `This packet selects one first-session candidate but does not authorize or launch Adobe Flash Player or Animate.\n\n`
    + `## Selected candidate\n\n`
    + `- **\`${item.animationId}\` — ${item.classification.titleDisplay}**.\n`
    + `- Source SWF SHA-256: \`${item.source.swf.sha256}\`; FLA SHA-256: \`${item.source.fla.sha256}\`.\n`
    + `- Native runtime facts: 800×600, 12 FPS, 10 root frames; 139 statically reachable declared frames across root and nested definitions.\n`
    + `- Static signals used for selection: no exact external operation, no random candidate, one source-bound scenario candidate, one static candidate family. These are not runtime reachability proof.\n\n`
    + `| Rank | Candidate | Reachable declared frames | Source-bound candidates | Exact external ops |\n|---:|---|---:|---:|---:|\n${rankingRows}\n\n`
    + `## Bounded capacity envelope\n\n`
    + `- ${capacity.logicalEvidenceFrames} logical frames across EN/ES × 3 PNG roles = ${capacity.pngObjectCount} PNG objects, using the current p95 PNG byte sample, 60% overhead, and ${formatGib(capacity.fixedWorkingBytes)} fixed working space.\n`
    + `- Incremental envelope: **${formatGib(capacity.incrementalBytes)}** × ${capacity.remainingEvidenceSafetyMultiplier.toFixed(2)} safety margin; operational reserve: **${formatGib(capacity.operationalReserveBytes)}**; bound available space: **${formatGib(capacity.availableBytesAtBoundSnapshot)}**.\n`
    + `- Headroom after the envelope and reserve: **${formatGib(capacity.headroomBytesAfterEnvelopeAndReserve)}**. The static envelope fits, but a live preflight is still mandatory and this is not execution authorization.\n\n`
    + `## Operator-protocol draft\n\n`
    + `- Bound draft: \`${protocol.binding.file}\`; state: \`${protocol.state}\`.\n`
    + `- Two planning candidates: \`${protocol.candidateIds.join("\`, \`")}\`; ten proposed steps: \`${protocol.stepIds.join(" → ")}\`.\n`
    + `- The candidate entry-state hashes are deterministic planning identities only. No authoritative requirement ID, trace ID, accepted event schedule, or accepted capture schedule exists yet.\n\n`
    + `## Natural evidence still to schedule\n\n${evidenceRows}\n\n`
    + `Requirement IDs, trace IDs, entry-state hashes, event schedules, and capture schedules are all still empty. Direct seek remains unauthorized until a natural same-source trace is established.\n\n`
    + `## Read-only host-tree preparation\n\n`
    + `- CR-02 technical artifact: **prepared, not approved**.\n`
    + `- Manifest: \`${hostTree.manifest.file}\`; file-set SHA-256: \`${hostTree.fileSetSha256}\`.\n`
    + `- ${hostTree.files} independent SWF/MP3/XML copies / ${hostTree.bytes} bytes; files \`${hostTree.stagedRoot.fileMode}\`, directories \`${hostTree.stagedRoot.directoryMode}\`; no symlinks or hard links.\n`
    + `- This tree is a local dependency allowlist candidate only. It does not approve CR-02 or make execution ready.\n\n`
    + `## Containment and authorization\n\n| Control | Mechanism | Approved | Verified |\n|---|---|---|---|\n${controlRows}\n\n`
    + `Owner decision, named original-runtime operator, authorized host context, containment mechanisms, disposable profile, and session identity are all unfilled. Execution remains **closed**.\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") {
      invariant(index + 1 < argv.length, "--json-output requires a value");
      options.jsonOutput = path.resolve(ROOT, argv[++index]);
    } else if (argument === "--markdown-output") {
      invariant(index + 1 < argv.length, "--markdown-output requires a value");
      options.markdownOutput = path.resolve(ROOT, argv[++index]);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildFirstOriginalRuntimeSessionReadiness();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(currentJson === json, `${relative(options.jsonOutput)} is stale`);
    invariant(currentMarkdown === markdown, `${relative(options.markdownOutput)} is stale`);
    process.stdout.write(`PASS ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)} are current\n`);
    return;
  }
  await Promise.all([writeFile(options.jsonOutput, json), writeFile(options.markdownOutput, markdown)]);
  process.stdout.write(`Wrote ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
