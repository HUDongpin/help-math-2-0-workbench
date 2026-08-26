#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {lstat, mkdir, readFile, realpath, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {G4_L3_LESSON_AUDIT_IDS} from "./build-course-scenario-inventories.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CAPTURE_IDENTITY_FIELDS = Object.freeze([
  "frameDomain",
  "requirementId",
  "trace",
  "entryStateSha256",
  "frame",
  "scenario",
  "lang",
  "seed",
]);

export const G4_L3_CUSTOM_READINESS_IDS = Object.freeze([
  "course-g04-l03-in-009",
  "course-g04-l03-ts-006",
  "shell-course-g04-l03-index-local",
]);

const customReadinessIds = new Set(G4_L3_CUSTOM_READINESS_IDS);

export const G4_L3_MEMBER_READINESS_IDS = Object.freeze(
  G4_L3_LESSON_AUDIT_IDS.filter((id) => !customReadinessIds.has(id)),
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(candidate);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label}: path is empty`);
  invariant(!path.isAbsolute(candidate), `${label}: absolute paths are not allowed`);
  const resolved = path.resolve(projectRoot, candidate);
  invariant(isWithin(projectRoot, resolved), `${label}: path escapes the project root`);
  return resolved;
}

function resolveWorkspacePath(workspace, candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label}: path is empty`);
  invariant(!path.isAbsolute(candidate), `${label}: absolute paths are not allowed`);
  const resolved = path.resolve(workspace, candidate);
  invariant(isWithin(workspace, resolved), `${label}: path escapes the migration workspace`);
  return resolved;
}

async function assertRegularFile(candidate, label) {
  const details = await lstat(candidate);
  invariant(details.isFile() && !details.isSymbolicLink(), `${label}: expected a regular non-symlink file`);
  return details;
}

async function readRecord(projectRoot, relativePath, label = relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  await assertRegularFile(absolutePath, label);
  const bytes = await readFile(absolutePath);
  return {
    path: portable(relativePath),
    absolutePath,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    document: JSON.parse(bytes.toString("utf8")),
  };
}

async function verifyPinnedProjectFile(projectRoot, entry, label) {
  invariant(entry && typeof entry.path === "string", `${label}: missing path`);
  invariant(SHA256_PATTERN.test(entry.sha256 || ""), `${label}: invalid SHA-256`);
  const absolutePath = resolveProjectPath(projectRoot, entry.path, label);
  const details = await assertRegularFile(absolutePath, label);
  invariant(Number.isInteger(entry.bytes) && entry.bytes === details.size, `${label}: byte count mismatch`);
  invariant(await sha256File(absolutePath) === entry.sha256, `${label}: hash mismatch`);
  return {path: portable(entry.path), bytes: details.size, sha256: entry.sha256};
}

async function verifyPinnedWorkspaceFile(workspace, output, label) {
  invariant(output && typeof output.path === "string", `${label}: missing path`);
  invariant(output.path.startsWith("audit/machine/"), `${label}: output is outside audit/machine`);
  invariant(SHA256_PATTERN.test(output.sha256 || ""), `${label}: invalid SHA-256`);
  const absolutePath = resolveWorkspacePath(workspace, output.path, label);
  const details = await assertRegularFile(absolutePath, label);
  invariant(output.bytes === details.size, `${label}: byte count mismatch`);
  invariant(await sha256File(absolutePath) === output.sha256, `${label}: hash mismatch`);
  return {path: output.path, bytes: details.size, sha256: output.sha256};
}

function signalCount(sourceAudit, id) {
  const signal = sourceAudit.machineFindings?.scripts?.signals?.find((item) => item.id === id);
  return signal?.occurrences || 0;
}

function expectedRisk(machineAudit) {
  return machineAudit.randomCallCandidateCount > 0 ||
    machineAudit.externalApiCandidateCount > 0 ||
    machineAudit.exportedScriptFileCount >= 100
    ? "critical"
    : "high";
}

function reviewRecord(role) {
  return {
    role,
    decision: "pending",
    reviewer: null,
    reviewedAt: null,
    signatureEnvelope: null,
  };
}

function scenarioRequirements(plan) {
  const requirements = [];
  for (const locale of plan.acquisitionRequirements.requiredLocales) {
    requirements.push(`${locale.toUpperCase()} independent natural-entry runtime path with a fresh isolated runtime profile`);
  }
  for (const family of plan.acquisitionRequirements.universalEvidenceFamilies) {
    requirements.push(`universal evidence family: ${family}`);
  }
  for (const candidate of plan.acquisitionRequirements.sourceBoundScenarioCandidates) {
    requirements.push(
      `source-bound scenario candidate ${candidate.candidateId}: ${candidate.sourceEventCount} event candidate(s), ${candidate.sourceOperationCount} operation candidate(s), and ${candidate.sourceSignalCount} host-state signal candidate(s); exact ordered runtime schedule unresolved`,
    );
  }
  for (const family of plan.acquisitionRequirements.staticCandidateFamilies) {
    requirements.push(
      `static candidate family ${family.familyId}: ${family.sourceEventCount} source event candidate(s); every reachable target and branch requires runtime proof`,
    );
  }
  requirements.push(plan.acquisitionRequirements.randomOutcomeRequirement);
  requirements.push(
    `audio: ${plan.acquisitionRequirements.audio.embeddedAudioTagCount} embedded tag candidate(s) and ${plan.acquisitionRequirements.audio.externalAudioAssociationCount} external association(s); preserve original bytes and prove EN/ES selection, cue, timing, synchronization, and complete listening review`,
  );
  requirements.push("host-native Previous, Next, section navigation, terminal state, and complete Replay reset");
  return [...new Set(requirements)];
}

function flattenAuthoringArtifacts(plan) {
  const selected = plan.authoringGate?.selectedPassingAudit;
  if (!selected) return [];
  return [
    ...Object.entries(selected.artifacts || {}).map(([kind, entry]) => ({id: `work-only-authoring-${kind}`, ...entry, path: entry.file})),
    ...(selected.receipt ? [{id: "work-only-authoring-receipt", ...selected.receipt, path: selected.receipt.file}] : []),
    ...(selected.workEvidence ? [{id: "work-only-authoring-evidence", ...selected.workEvidence, path: selected.workEvidence.file}] : []),
  ];
}

function validateNoAuthorityPromotion(plan, id) {
  const current = plan.currentEvidenceState || {};
  for (const key of [
    "audioAccepted",
    "authoritativeBaselinePackageEstablished",
    "authoritativeScenarioInventoryEstablished",
    "authoritativeTraceSpecificationEstablished",
    "authorizedOriginalRuntimeSessionEstablished",
    "humanVisualAccepted",
    "implementationAuthorized",
    "namedOriginalRuntimeOperatorSupplied",
    "naturalExecutionProofEstablished",
    "ownerAccepted",
    "runtimeReachabilityEstablished",
    "strictComplete",
  ]) invariant(current[key] === false, `${id}: runtime acquisition plan promoted ${key}`);

  const execution = plan.executionGate || {};
  invariant(execution.runnable === false, `${id}: execution gate must remain closed`);
  for (const key of ["authorizesDirectSeek", "createsCaptureEvidence", "executesLegacyEndpoints", "launchesAnimate", "launchesOriginalRuntime"]) {
    invariant(execution[key] === false, `${id}: execution gate promoted ${key}`);
  }
  invariant(plan.runtimeEnvironmentPrerequisite?.originalRuntimeExecutionReady === false, `${id}: original runtime unexpectedly ready`);
  invariant(plan.runtimeEnvironmentPrerequisite?.perItemCaptureAuthorized === false, `${id}: per-item capture unexpectedly authorized`);
  invariant(plan.runtimeEnvironmentPrerequisite?.runtimeApprovedByOwner === false, `${id}: runtime owner approval unexpectedly present`);
  invariant(plan.runtimeContainmentPrerequisite?.safeToExecuteNow === false, `${id}: containment unexpectedly executable`);
  invariant(plan.runtimeContainmentPrerequisite?.sideEffectContainmentApproved === false, `${id}: containment unexpectedly approved`);

  const acceptance = plan.acceptance || {};
  invariant(acceptance.acceptanceNeutral === true, `${id}: acquisition plan must remain acceptance-neutral`);
  for (const key of [
    "audioAccepted",
    "authoringAccepted",
    "authoritativeRuntimeAccepted",
    "humanVisualAccepted",
    "implementationAuthorized",
    "ownerAccepted",
    "rmseAccepted",
    "strictComplete",
    "visualOrBehaviorParityAccepted",
  ]) invariant(acceptance[key] === false, `${id}: acquisition plan promoted ${key}`);
}

export function validateG4L3MemberScenarioReadiness(document) {
  const id = document?.animationId || "unknown";
  invariant(document.schemaVersion === 2, `${id}: schemaVersion must be 2`);
  invariant(document.evidenceKind === "course-shell-strict-readiness", `${id}: evidenceKind is invalid`);
  invariant(G4_L3_MEMBER_READINESS_IDS.includes(id), `${id}: not a machine-owned G4 L3 member readiness ID`);
  invariant(document.migrationStatusChanged === false, `${id}: migration status may not change`);
  invariant(document.generatedBy?.script === "scripts/build-g4-l3-member-scenario-readiness.mjs", `${id}: generator ownership is invalid`);
  invariant(document.generatedBy?.version === 1 && document.generatedBy?.deterministic === true, `${id}: generator metadata is invalid`);
  invariant(SHA256_PATTERN.test(document.generatedBy?.sha256 || ""), `${id}: generator SHA-256 is invalid`);

  for (const key of [
    "strictAcceptanceReady",
    "completionClaimAllowed",
    "localAuthoritativeBaselineCompletable",
    "localExhaustiveBranchCaptureCompletable",
  ]) invariant(document.conclusion?.[key] === false, `${id}: ${key} must remain false`);
  invariant(document.conclusion?.risk === expectedRisk(document.machineAudit), `${id}: risk classification drifted`);
  invariant(typeof document.conclusion?.reason === "string" && document.conclusion.reason.length > 100, `${id}: fail-closed reason is incomplete`);

  invariant(document.source?.sourceHashesVerified === true, `${id}: source hashes must be verified`);
  invariant(SHA256_PATTERN.test(document.source?.swfSha256 || ""), `${id}: source SWF SHA-256 is invalid`);
  invariant(document.source?.technicalManifestProjection === TECHNICAL_MANIFEST_PROJECTION.id, `${id}: technical manifest projection is invalid`);
  invariant(SHA256_PATTERN.test(document.source?.technicalManifestProjectionSha256 || ""), `${id}: technical manifest projection SHA-256 is invalid`);

  invariant(document.machineAudit?.auditStatus === "partial", `${id}: machine audit must remain partial`);
  invariant(document.machineAudit?.allCommandsPassed === true, `${id}: machine commands are incomplete`);
  invariant(document.machineAudit?.allOutputPinsVerified === true, `${id}: machine output pins are incomplete`);
  invariant(Number.isInteger(document.machineAudit?.rootFrameCount) && document.machineAudit.rootFrameCount > 0, `${id}: root frame count is invalid`);
  invariant(Array.isArray(document.machineAudit?.observedBehaviorFromExtractedScripts) && document.machineAudit.observedBehaviorFromExtractedScripts.length >= 4, `${id}: static observations are incomplete`);

  invariant(document.branchCaptureReadiness?.status === "partial-reference-only", `${id}: branch readiness must remain partial-reference-only`);
  invariant(document.branchCaptureReadiness?.authoritativeScheduleEstablished === false, `${id}: authoritative schedule must remain unestablished`);
  invariant(document.branchCaptureReadiness?.runtimeSessionsExecuted === 0, `${id}: runtime session count must remain zero`);
  invariant(Array.isArray(document.branchCaptureReadiness?.requiredScenarioInventory) && document.branchCaptureReadiness.requiredScenarioInventory.length >= 10, `${id}: scenario inventory is too narrow`);
  invariant(Array.isArray(document.branchCaptureReadiness?.missing) && document.branchCaptureReadiness.missing.length >= 8, `${id}: missing-evidence list is incomplete`);
  invariant(document.branchCaptureReadiness?.captureIdentity?.requiredFields?.length === CAPTURE_IDENTITY_FIELDS.length, `${id}: capture identity field count is invalid`);
  invariant(CAPTURE_IDENTITY_FIELDS.every((field, index) => document.branchCaptureReadiness.captureIdentity.requiredFields[index] === field), `${id}: capture identity fields drifted`);
  invariant(document.branchCaptureReadiness?.directSeekAuthority?.startsWith("not-permitted"), `${id}: direct seek policy is invalid`);

  invariant(document.acceptance?.acceptanceNeutral === true, `${id}: artifact must remain acceptance-neutral`);
  for (const key of [
    "authoritativeOriginalRuntimeAccepted",
    "audioAccepted",
    "rmseAccepted",
    "humanVisualAccepted",
    "independentEngineeringAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
  ]) invariant(document.acceptance?.[key] === false, `${id}: ${key} must remain false`);
  for (const role of ["independentEngineeringReview", "humanVisualReview", "ownerReview"]) {
    const review = document.review?.[role];
    invariant(review?.decision === "pending", `${id}: ${role} must remain pending`);
    invariant(review.reviewer === null && review.reviewedAt === null && review.signatureEnvelope === null, `${id}: ${role} may not contain a fabricated review or signature`);
  }

  invariant(Array.isArray(document.evidence) && document.evidence.length >= 11, `${id}: evidence index is incomplete`);
  invariant(document.evidence.every((entry) => entry.id && entry.path && Number.isInteger(entry.bytes) && entry.bytes >= 0 && SHA256_PATTERN.test(entry.sha256 || "")), `${id}: evidence entries require id, path, bytes, and SHA-256`);
  invariant(new Set(document.evidence.map((entry) => entry.id)).size === document.evidence.length, `${id}: evidence IDs must be unique`);
  invariant(new Set(document.evidence.map((entry) => entry.path)).size === document.evidence.length, `${id}: evidence paths must be unique`);
  invariant(Array.isArray(document.limitations) && document.limitations.length >= 3, `${id}: limitations are incomplete`);
  invariant(String(document.strictAcceptanceEffect || "").startsWith("none;"), `${id}: strict acceptance effect must remain none`);
  return true;
}

async function preflightWorkspace(projectRoot, id) {
  invariant(G4_L3_MEMBER_READINESS_IDS.includes(id), customReadinessIds.has(id)
    ? `${id}: custom readiness is protected and may only be maintained by its dedicated generator`
    : `${id}: unknown G4 L3 member readiness ID`);
  const workspace = path.join(projectRoot, "migrations", id);
  const migrationsRoot = path.join(projectRoot, "migrations");
  const [realProjectRoot, realMigrationsRoot, realWorkspace] = await Promise.all([
    realpath(projectRoot),
    realpath(migrationsRoot),
    realpath(workspace),
  ]);
  invariant(isWithin(realProjectRoot, realMigrationsRoot), `${id}: migrations root escapes project root`);
  invariant(isWithin(realMigrationsRoot, realWorkspace), `${id}: workspace escapes migrations root`);
  return {workspace, realProjectRoot};
}

export async function buildOneG4L3MemberScenarioReadiness(id, options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const {workspace} = await preflightWorkspace(projectRoot, id);
  const workspaceRelative = `migrations/${id}`;
  const manifestRelative = `${workspaceRelative}/migration.json`;
  const machineRelative = `${workspaceRelative}/audit/machine/report.json`;
  const sourceAuditRelative = `${workspaceRelative}/audit/machine/g4-l3-source-audit.json`;
  const acquisitionPlanRelative = `${workspaceRelative}/audit/machine/g4-l3-runtime-acquisition-plan.json`;
  const outputRelative = `${workspaceRelative}/audit/strict-readiness.json`;
  const outputPath = path.join(projectRoot, outputRelative);

  const [manifestRecord, machineRecord, sourceAuditRecord, acquisitionPlanRecord, generatorBytes] = await Promise.all([
    readRecord(projectRoot, manifestRelative, `${id}: migration manifest`),
    readRecord(projectRoot, machineRelative, `${id}: standard machine report`),
    readRecord(projectRoot, sourceAuditRelative, `${id}: G4 L3 source audit`),
    readRecord(projectRoot, acquisitionPlanRelative, `${id}: runtime acquisition plan`),
    readFile(scriptPath),
  ]);
  const manifest = manifestRecord.document;
  const machine = machineRecord.document;
  const sourceAudit = sourceAuditRecord.document;
  const plan = acquisitionPlanRecord.document;

  invariant(manifest.animationId === id, `${id}: migration manifest identity mismatch`);
  invariant(machine.animationId === id, `${id}: machine report identity mismatch`);
  invariant(sourceAudit.identity?.animationId === id, `${id}: source audit identity mismatch`);
  invariant(plan.identity?.animationId === id, `${id}: runtime acquisition plan identity mismatch`);

  invariant(machine.schemaVersion === 1 && machine.auditStatus === "partial", `${id}: standard machine report status is invalid`);
  invariant(machine.migrationStatusUnchanged === true, `${id}: machine report changed migration status`);
  invariant(machine.source?.path === manifest.source.swf && machine.source?.expectedSha256 === manifest.source.swfSha256, `${id}: machine report source binding mismatch`);
  invariant(machine.source?.observedSha256Before === manifest.source.swfSha256 && machine.source?.observedSha256After === manifest.source.swfSha256 && machine.source?.hashMatches === true, `${id}: machine report did not preserve the SWF`);
  invariant(machine.findings?.runtimeCrossCheck?.allMatch === true, `${id}: standard runtime cross-check failed`);
  invariant(Object.values(machine.commands || {}).length >= 6 && Object.values(machine.commands || {}).every((command) => command.status === "success"), `${id}: standard machine extraction has a failed or missing command`);
  invariant(Array.isArray(machine.outputs) && machine.outputs.length >= 6, `${id}: standard machine outputs are incomplete`);
  const machineOutputs = await Promise.all(machine.outputs.map((output, index) => verifyPinnedWorkspaceFile(workspace, output, `${id}: machine output ${index + 1}`)));

  const physicalSwf = await verifyPinnedProjectFile(projectRoot, {
    path: manifest.source.swf,
    bytes: machine.source.bytesAfter,
    sha256: manifest.source.swfSha256,
  }, `${id}: physical source SWF`);
  const physicalSourceRecords = [{id: "source-swf", ...physicalSwf}];
  if (manifest.source.fla) {
    invariant(machine.authoringSource?.path === manifest.source.fla && machine.authoringSource?.expectedSha256 === manifest.source.flaSha256, `${id}: machine report FLA binding mismatch`);
    invariant(machine.authoringSource?.hashMatches === true && machine.authoringSource?.inspectionStatus === "not-performed-by-this-script", `${id}: machine report FLA boundary is invalid`);
    physicalSourceRecords.push({
      id: "source-fla",
      ...await verifyPinnedProjectFile(projectRoot, {
        path: manifest.source.fla,
        bytes: machine.authoringSource.bytes,
        sha256: manifest.source.flaSha256,
      }, `${id}: physical source FLA`),
    });
  } else {
    invariant(machine.authoringSource?.pairedFlaStatus === "missing" && machine.authoringSource?.inspectionStatus === "missing-source", `${id}: missing FLA status drifted`);
  }

  invariant(sourceAudit.provenance?.source?.swf?.path === manifest.source.swf && sourceAudit.provenance.source.swf.sha256 === manifest.source.swfSha256 && sourceAudit.provenance.source.swf.physicalHashVerified === true, `${id}: source audit SWF binding mismatch`);
  invariant((sourceAudit.provenance?.source?.fla?.sha256 || "") === (manifest.source.flaSha256 || ""), `${id}: source audit FLA binding mismatch`);
  const runtime = sourceAudit.machineFindings?.runtime;
  invariant(runtime?.stage?.width === machine.findings.ffdecHeader.widthPx && runtime.stage.height === machine.findings.ffdecHeader.heightPx, `${id}: stage facts conflict`);
  invariant(runtime?.fps === machine.findings.ffdecHeader.frameRate && runtime.rootFrameCount === machine.findings.ffdecHeader.frameCount, `${id}: FPS/root frame facts conflict`);
  invariant(runtime?.actionScriptVersion === machine.findings.actionScriptVersion, `${id}: ActionScript version conflicts`);
  invariant(sourceAudit.machineFindings?.evidenceLimits?.authoritativeRuntimeLaunched === false, `${id}: source audit unexpectedly launched authoritative runtime`);
  invariant(sourceAudit.machineFindings?.evidenceLimits?.runtimeReachabilityEstablished === false, `${id}: source audit unexpectedly established runtime reachability`);
  invariant(sourceAudit.machineFindings?.evidenceLimits?.frameDomainDispositionEstablished === false, `${id}: source audit unexpectedly established frame-domain disposition`);
  invariant(sourceAudit.machineFindings?.evidenceLimits?.visualBaselineEstablished === false, `${id}: source audit unexpectedly established a visual baseline`);
  invariant(sourceAudit.machineFindings?.evidenceLimits?.audioAcceptanceEstablished === false, `${id}: source audit unexpectedly accepted audio`);
  invariant(sourceAudit.machineFindings?.evidenceLimits?.humanOrOwnerAcceptanceEstablished === false, `${id}: source audit unexpectedly accepted human/owner review`);

  invariant(plan.nativeRuntimeFacts?.stage?.width === runtime.stage.width && plan.nativeRuntimeFacts?.stage?.height === runtime.stage.height, `${id}: acquisition-plan stage facts conflict`);
  invariant(plan.nativeRuntimeFacts?.fps === runtime.fps && plan.nativeRuntimeFacts?.rootFrameCount === runtime.rootFrameCount, `${id}: acquisition-plan runtime facts conflict`);
  invariant(plan.nativeRuntimeFacts?.frameDomainDispositionEstablished === false && plan.nativeRuntimeFacts?.staticReachabilityIsRuntimeProof === false, `${id}: acquisition plan promoted static reachability`);
  invariant(plan.acquisitionRequirements?.naturalExecutionFirst === true, `${id}: natural execution must remain first`);
  invariant(JSON.stringify(plan.captureIdentityContract?.requiredFields) === JSON.stringify(CAPTURE_IDENTITY_FIELDS), `${id}: capture identity contract drifted`);
  invariant(plan.captureIdentityContract?.sourceSwfSha256 === manifest.source.swfSha256, `${id}: capture identity SWF hash mismatch`);
  invariant((plan.captureIdentityContract?.sourceFlaSha256 || "") === (manifest.source.flaSha256 || ""), `${id}: capture identity FLA hash mismatch`);
  invariant(plan.acquisitionRequirements?.sourceBoundScenarioCandidateCount === plan.acquisitionRequirements?.sourceBoundScenarioCandidates?.length, `${id}: scenario candidate count mismatch`);
  invariant(plan.acquisitionRequirements?.staticCandidateFamilyCount === plan.acquisitionRequirements?.staticCandidateFamilies?.length, `${id}: static candidate family count mismatch`);
  invariant(plan.acquisitionRequirements?.sourceBoundScenarioCandidates?.every((candidate) => candidate.acceptanceEffect === "none" && candidate.runtimeReachabilityEstablished === false && candidate.orderedScheduleEstablished === false && candidate.captureScheduleEstablished === false && candidate.authoritativeTraceIds.length === 0), `${id}: source-bound scenario candidate was promoted`);
  invariant(plan.acquisitionRequirements?.staticCandidateFamilies?.every((family) => family.acceptanceEffect === "none" && family.runtimeReachabilityEstablished === false && family.captureScheduleEstablished === false && family.runtimeScenarioIds.length === 0), `${id}: static candidate family was promoted`);
  validateNoAuthorityPromotion(plan, id);

  if (plan.authoringGate?.required) {
    invariant(plan.authoringGate.status === "verified-work-only-authoring-audit" && plan.authoringGate.authoringAuditEstablished === true, `${id}: required work-only authoring audit is not established`);
    invariant(plan.authoringGate.authoringAuditIsOriginalRuntimeEvidence === false, `${id}: authoring audit was promoted to runtime evidence`);
    invariant(plan.authoringGate.selectedPassingAudit?.acceptanceEffect === false, `${id}: authoring audit changed acceptance`);
  } else {
    invariant(plan.authoringGate?.status === "not-applicable-swf-only" && plan.authoringGate?.selectedPassingAudit === null, `${id}: SWF-only authoring boundary drifted`);
  }
  const authoringEvidence = [];
  for (const item of flattenAuthoringArtifacts(plan)) {
    authoringEvidence.push({id: item.id, ...await verifyPinnedProjectFile(projectRoot, item, `${id}: ${item.id}`)});
  }

  const scripts = sourceAudit.machineFindings.scripts;
  const machineAudit = {
    auditStatus: "partial",
    stage: {width: runtime.stage.width, height: runtime.stage.height},
    fps: runtime.fps,
    rootFrameCount: runtime.rootFrameCount,
    actionScriptVersion: runtime.actionScriptVersion,
    exportedScriptFileCount: scripts.exportedScriptFileCount,
    buttonHandlerFileCount: scripts.buttonHandlerFileCount,
    clipHandlerFileCount: scripts.clipHandlerFileCount,
    pointerEventCandidateCount: signalCount(sourceAudit, "mouse-events"),
    timelineNavigationCandidateCount: signalCount(sourceAudit, "timeline-navigation"),
    randomCallCandidateCount: scripts.random?.occurrences || 0,
    externalApiCandidateCount: scripts.externalApiCandidates?.length || 0,
    staticallyRootReachableNestedDefinitionCount: plan.nativeRuntimeFacts.staticallyRootReachableNestedDefinitionCount,
    staticallyRootReachableDeclaredFrameCountSum: plan.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum,
    allCommandsPassed: true,
    allOutputPinsVerified: true,
    observedBehaviorFromExtractedScripts: [
      `Two independent static parsers agree on an ${runtime.stage.width}x${runtime.stage.height} stage, ${runtime.fps} FPS, ${runtime.rootFrameCount} one-indexed root frames, and ${runtime.actionScriptVersion}.`,
      `FFDec exported ${scripts.exportedScriptFileCount} ActionScript file(s), including ${scripts.buttonHandlerFileCount} button-handler file(s) and ${scripts.clipHandlerFileCount} clip-handler file(s).`,
      `The source audit records ${signalCount(sourceAudit, "mouse-events")} pointer-event candidate(s), ${signalCount(sourceAudit, "timeline-navigation")} timeline-navigation candidate(s), ${scripts.random?.occurrences || 0} random-call candidate(s), and ${scripts.externalApiCandidates?.length || 0} external-API candidate(s); static occurrences do not prove runtime reachability.`,
      `The static root placement graph identifies ${plan.nativeRuntimeFacts.staticallyRootReachableNestedDefinitionCount} reachable nested definition(s) totaling ${plan.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum} declared frame(s); every timeline still requires an independent-domain, composite-only, or proven-unreachable disposition.`,
      `Audio acquisition remains required for ${plan.acquisitionRequirements.audio.embeddedAudioTagCount} embedded tag candidate(s) and ${plan.acquisitionRequirements.audio.externalAudioAssociationCount} external association(s); cue, language, timing, synchronization, and listening acceptance remain unestablished.`,
    ],
    report: {path: machineRelative, bytes: machineRecord.bytes, sha256: machineRecord.sha256},
  };

  const document = {
    schemaVersion: 2,
    evidenceKind: "course-shell-strict-readiness",
    generatedBy: {
      script: "scripts/build-g4-l3-member-scenario-readiness.mjs",
      version: 1,
      sha256: sha256Bytes(generatorBytes),
      deterministic: true,
    },
    animationId: id,
    assessedOn: "2026-07-26",
    migrationStatusChanged: false,
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk: expectedRisk(machineAudit),
      reason: "Hash-verified FLA/SWF, standard machine extraction, G4 L3 source audit, work-only authoring evidence where available, and the empty runtime-acquisition plan define conservative scenario obligations. They do not establish approved original-runtime natural entry, runtime reachability, exact ordered schedules, authoritative baselines, audio synchronization/listening acceptance, full-frame comparison, independent human review, or owner acceptance.",
    },
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: manifest.source.fla || null,
      flaSha256: manifest.source.flaSha256 || null,
      pairedFlaStatus: manifest.source.pairedFlaStatus,
      sourceHashesVerified: true,
      technicalManifestProjection: TECHNICAL_MANIFEST_PROJECTION.id,
      technicalManifestProjectionSha256: technicalManifestSha256(manifest),
      technicalManifestExcludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
    machineAudit,
    branchCaptureReadiness: {
      status: "partial-reference-only",
      authoritativeScheduleEstablished: false,
      runtimeSessionsExecuted: 0,
      requiredScenarioInventory: scenarioRequirements(plan),
      missing: [
        "source-hash-bound authorized original-runtime natural-entry capture",
        "approved CR-01 through CR-08 containment controls and an authorized per-item execution decision",
        "named original-runtime operator plus immutable session, runtime, host-tree, language, and profile identity",
        "natural runtime reachability and final disposition for every nested timeline candidate",
        "exact ordered event, frame, operation, state-hash, and deterministic-seed schedule for every reachable branch",
        "complete independent English and Spanish frame, navigation, terminal, and Replay evidence",
        "original audio bytes plus cue, language, timing, synchronization, and complete listening review",
        "identity-matched implementation capture, per-frame diff, and normalized RMSE for every requirement",
        "independent engineering and human visual review bound to the immutable evidence manifest",
        "Owner acceptance and release-custodian atomic publication authorization",
      ],
      captureIdentity: {
        requiredFields: [...CAPTURE_IDENTITY_FIELDS],
        sourceSwfSha256: manifest.source.swfSha256,
        sourceFlaSha256: manifest.source.flaSha256 || null,
        orderedEventAndStateHashChainRequired: true,
        nativeStagePngRequired: true,
      },
      directSeekAuthority: "not-permitted-for-primary-evidence; supplemental diagnosis only after a complete natural trace",
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeAccepted: false,
      audioAccepted: false,
      rmseAccepted: false,
      humanVisualAccepted: false,
      independentEngineeringAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    review: {
      independentEngineeringReview: reviewRecord("independent-engineering-reviewer"),
      humanVisualReview: reviewRecord("independent-human-visual-reviewer"),
      ownerReview: reviewRecord("owner-or-authorized-representative"),
    },
    evidence: [
      ...physicalSourceRecords,
      {id: "migration-technical-contract", path: manifestRecord.path, bytes: manifestRecord.bytes, sha256: manifestRecord.sha256},
      {id: "standard-machine-report", path: machineRecord.path, bytes: machineRecord.bytes, sha256: machineRecord.sha256},
      ...machineOutputs.map((output, index) => ({id: `standard-machine-output-${String(index + 1).padStart(2, "0")}`, ...output})),
      {id: "g4-l3-source-audit", path: sourceAuditRecord.path, bytes: sourceAuditRecord.bytes, sha256: sourceAuditRecord.sha256},
      {id: "runtime-acquisition-plan", path: acquisitionPlanRecord.path, bytes: acquisitionPlanRecord.bytes, sha256: acquisitionPlanRecord.sha256},
      ...authoringEvidence,
    ],
    limitations: [
      "This readiness artifact is a static specification input. It launches neither Adobe Animate nor an original Flash runtime.",
      "FFDec, swfmill, source-static placement graphs, and work-only authoring audits cannot prove natural runtime reachability, interaction behavior, visual fidelity, or audio timing.",
      "No field in this artifact authorizes capture, satisfies a full-frame requirement, changes migration status, or supplies a human or owner signature.",
    ],
    strictAcceptanceEffect: "none; this fail-closed readiness artifact only supplies source-bound scenario obligations",
  };
  validateG4L3MemberScenarioReadiness(document);
  const rendered = `${JSON.stringify(document, null, 2)}\n`;

  try {
    const existingStats = await lstat(outputPath);
    invariant(existingStats.isFile() && !existingStats.isSymbolicLink(), `${id}: existing readiness output is not a regular file`);
    const existing = JSON.parse(await readFile(outputPath, "utf8"));
    invariant(existing.generatedBy?.script === document.generatedBy.script, `${id}: refusing to overwrite a readiness artifact owned by another generator`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (options.check) {
    const existing = await readFile(outputPath, "utf8");
    invariant(existing === rendered, `${id}: member scenario readiness artifact is stale`);
    return {id, action: "verified", output: outputRelative, document};
  }
  return {id, action: "prepared", output: outputRelative, outputPath, rendered, document};
}

async function atomicWrite(outputPath, rendered, id) {
  await mkdir(path.dirname(outputPath), {recursive: true});
  const tempPath = `${outputPath}.tmp-${process.pid}-${sha256Bytes(id).slice(0, 12)}`;
  try {
    await writeFile(tempPath, rendered, {encoding: "utf8", flag: "wx"});
    await rename(tempPath, outputPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch (cleanupError) {
      if (cleanupError?.code !== "ENOENT") throw cleanupError;
    }
    throw error;
  }
}

export async function buildG4L3MemberScenarioReadiness(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const ids = options.ids?.length ? [...options.ids] : [...G4_L3_MEMBER_READINESS_IDS];
  invariant(new Set(ids).size === ids.length, "duplicate G4 L3 member readiness ID");
  for (const id of ids) {
    invariant(G4_L3_MEMBER_READINESS_IDS.includes(id), customReadinessIds.has(id)
      ? `${id}: custom readiness is protected and may only be maintained by its dedicated generator`
      : `${id}: unknown G4 L3 member readiness ID`);
  }

  const prepared = [];
  for (const id of ids) prepared.push(await buildOneG4L3MemberScenarioReadiness(id, {...options, projectRoot}));
  if (options.check) return prepared;

  for (const item of prepared) {
    await atomicWrite(item.outputPath, item.rendered, item.id);
    item.action = "written";
    delete item.outputPath;
    delete item.rendered;
  }
  return prepared;
}

function parseArguments(argv) {
  const options = {check: false, ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--id") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), "--id requires an animation ID");
      options.ids.push(value);
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.ids.length) delete options.ids;
  return options;
}

function usage() {
  return `Usage: node scripts/build-g4-l3-member-scenario-readiness.mjs [options]\n\nOptions:\n  --id <animation-id>  Build one of the 37 machine-owned G4 L3 member readiness records; repeatable\n  --check              Verify checked-in outputs without writing\n  --help               Show this help\n\nThe three custom readiness records for IN009, TS006, and the Lesson Shell are protected.\nThis command launches no legacy runtime and has no strict-acceptance effect.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const results = await buildG4L3MemberScenarioReadiness(options);
    process.stdout.write(`${JSON.stringify({
      action: options.check ? "verified" : "written",
      members: results.length,
      outputs: results.map(({id, output}) => ({id, output})),
      acceptanceEffect: "none",
      originalRuntimeLaunched: false,
    }, null, 2)}\n`);
  }
}
