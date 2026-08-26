#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, realpath, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  readG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_EXPECTED_MEMBERS = 57;
export const G5_L5_EXPECTED_PAGES = 56;
export const G5_L5_EXPECTED_SHELLS = 1;
export const G5_L5_PROFILE_PATH = "catalog/g5-l5-m0-m1-governance-profile.json";
export const G5_L5_RELEASE_MANIFEST_PATH = "catalog/lesson-releases.json";
export const G5_L5_AUTHORIZATION_INPUT_KEYS = Object.freeze([
  "budgetAndProcurementReceipt",
  "m0OwnerSignoffReceipt",
  "m1MachineFoundationStartAuthorizationReceipt",
  "namedOriginalRuntimeOperatorAssignmentReceipt",
  "promotionAndPublicationAuthorizationReceipt",
  "runtimeHostAndContainmentExecutionReceipt",
  "staffingCapacityReceipt",
]);
export const G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR = Object.freeze({
  path: G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  bytes: 3743,
  sha256: "5d83225d7dec1bf1667d66499d75d3e4f2bb1476dd99163f4c43775743640a5b",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
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

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative));
}

export async function ensureContainedOrdinaryDirectoryTree(
  root,
  targetDirectory,
  {create = false, label = "path"} = {},
) {
  const rootState = await lstat(root);
  invariant(
    rootState.isDirectory() && !rootState.isSymbolicLink(),
    `${label}: root must be one ordinary directory`,
  );
  const rootReal = await realpath(root);
  const relative = path.relative(root, targetDirectory);
  invariant(
    relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)),
    `${label}: directory escapes the project root`,
  );
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let state;
    try {
      state = await lstat(current);
    } catch (error) {
      if (error?.code !== "ENOENT" || !create) throw error;
      await mkdir(current);
      state = await lstat(current);
    }
    invariant(
      state.isDirectory() && !state.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory: ${segment}`,
    );
    invariant(
      isWithin(rootReal, await realpath(current)),
      `${label}: ancestor escapes the project root: ${segment}`,
    );
  }
  return rootReal;
}

export async function readContainedOrdinaryFile(
  root,
  absolutePath,
  label,
) {
  const rootReal = await ensureContainedOrdinaryDirectoryTree(
    root,
    path.dirname(absolutePath),
    {label},
  );
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be one ordinary single-link file`,
  );
  invariant(
    isWithin(rootReal, await realpath(absolutePath)),
    `${label} escapes the project root`,
  );
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1 &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size &&
      isWithin(rootReal, await realpath(absolutePath)),
    `${label} changed while being read`,
  );
  return bytes;
}

export async function fileRecord(root, relativePath, label) {
  const absolute = resolveProjectPath(root, relativePath, label);
  const bytes = await readContainedOrdinaryFile(root, absolute, label);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    value: bytes,
  };
}

export async function jsonRecord(root, relativePath, label) {
  const record = await fileRecord(root, relativePath, label);
  return {...record, value: JSON.parse(record.value.toString("utf8"))};
}

export function descriptor(record) {
  const {value, ...binding} = record;
  return binding;
}

export function sameDescriptor(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function hasExactKeys(value, expectedKeys) {
  return isObject(value) &&
    Object.keys(value).sort().join("\0") ===
      [...expectedKeys].sort().join("\0");
}

function assertOwnerDirectiveBinding(binding, label) {
  invariant(
    hasExactKeys(binding, ["path", "bytes", "sha256"]) &&
      sameDescriptor(binding, G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR),
    `${label} is not the immutable G5 L5 Owner directive receipt`,
  );
}

function assertFalseFields(value, fields, label) {
  invariant(isObject(value), `${label} is missing`);
  for (const field of fields) {
    invariant(value[field] === false, `${label}.${field} must remain false`);
  }
}

export function selectG5L5Release(manifest) {
  invariant(manifest?.schemaVersion === 1 && Array.isArray(manifest.releases), "lesson release manifest is malformed");
  const matches = manifest.releases.filter(({releaseId}) => releaseId === G5_L5_RELEASE_ID);
  invariant(matches.length === 1, `expected exactly one ${G5_L5_RELEASE_ID} release`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", "G5 L5 publication mode must remain atomic");
  invariant(release.expectedCounts?.members === G5_L5_EXPECTED_MEMBERS, "G5 L5 member count drifted");
  invariant(release.expectedCounts?.activeXmlReferencedPages === G5_L5_EXPECTED_PAGES, "G5 L5 page count drifted");
  invariant(release.expectedCounts?.courseShells === G5_L5_EXPECTED_SHELLS, "G5 L5 shell count drifted");
  invariant(Array.isArray(release.members) && release.members.length === G5_L5_EXPECTED_MEMBERS, "G5 L5 membership is incomplete");
  invariant(release.members.every((member, index) => member.ordinal === index + 1), "G5 L5 member ordinals are not contiguous");
  invariant(new Set(release.members.map(({animationId}) => animationId)).size === G5_L5_EXPECTED_MEMBERS, "G5 L5 animation IDs are not unique");
  invariant(new Set(release.members.map(({assetId}) => assetId)).size === G5_L5_EXPECTED_MEMBERS, "G5 L5 asset IDs are not unique");
  return release;
}

export function validateG5L5GovernanceProfile(profile, release, roadmapBinding) {
  invariant(profile?.schemaVersion === 1 && profile.profileType === "g5-l5-m0-m1-governance-profile", "G5 L5 governance profile schema drifted");
  invariant(profile.releaseId === G5_L5_RELEASE_ID, "G5 L5 governance profile belongs to another release");
  invariant(profile.releaseFingerprintSha256 === sha256(Buffer.from(stableJson(release))), "G5 L5 governance profile release fingerprint drifted");
  invariant(
    profile.roadmap?.path === roadmapBinding.path &&
      profile.roadmap.sha256 === roadmapBinding.sha256 &&
      profile.roadmap.milestoneId === "M5" &&
      profile.roadmap.milestoneStart === "2027-04-01" &&
      profile.roadmap.milestoneEnd === "2027-05-31" &&
      profile.roadmap.targetStrictMembers === G5_L5_EXPECTED_MEMBERS &&
      profile.roadmap.targetAtomicRelease === true &&
      profile.roadmap.approvedM0M1ExecutionCalendarReceipt === null,
    "G5 L5 roadmap governance boundary drifted",
  );
  const packetKeys = [
    "sourceScopeFreeze",
    "sourceGapForensics",
    "workspaceReadiness",
    "audioOwnershipReadiness",
    "animateOperatorReadiness",
    "runtimeAcquisitionPlanning",
    "riskCalibration",
    "promotionSecurityReadiness",
    "originalRuntimeContainmentReadiness",
  ];
  invariant(
    isObject(profile.machinePacket) &&
      JSON.stringify(Object.keys(profile.machinePacket).sort()) === JSON.stringify([...packetKeys].sort()) &&
      packetKeys.every((key) => typeof profile.machinePacket[key] === "string" && profile.machinePacket[key].startsWith("reports/")),
    "G5 L5 machine-packet profile is incomplete",
  );
  invariant(isObject(profile.authorizationInputs), "G5 L5 authorization inputs are missing");
  invariant(
    hasExactKeys(profile.authorizationInputs, G5_L5_AUTHORIZATION_INPUT_KEYS) &&
      G5_L5_AUTHORIZATION_INPUT_KEYS.every(
        (key) => profile.authorizationInputs[key] === null,
      ),
    "G5 L5 must not import an authorization or receipt",
  );
  invariant(Array.isArray(profile.requiredOwnerDecisions) && profile.requiredOwnerDecisions.length === 6, "G5 L5 Owner decision set drifted");
  invariant(new Set(profile.requiredOwnerDecisions.map(({decisionId}) => decisionId)).size === 6, "G5 L5 Owner decision IDs are not unique");
  invariant(profile.requiredOwnerDecisions.every(({receipt}) => receipt === null), "G5 L5 Owner decision receipt must remain null");
  const expectedCapacityFloors = new Map([
    ["authorized-original-runtime-operator", {primary: 20, backup: 8}],
    ["mathematics-reviewer", {primary: 8, backup: null}],
    ["spanish-reviewer", {primary: 8, backup: null}],
    ["audio-reviewer", {primary: 8, backup: null}],
    ["independent-visual-reviewer", {primary: 8, backup: null}],
    ["owner-approver", {primary: 4, backup: null}],
    ["product-accessibility-reviewer", {primary: 8, backup: null}],
  ]);
  invariant(Array.isArray(profile.requiredRoles) && profile.requiredRoles.length === 7, "G5 L5 role requirement set drifted");
  invariant(new Set(profile.requiredRoles.map(({roleId}) => roleId)).size === 7, "G5 L5 role IDs are not unique");
  for (const role of profile.requiredRoles) {
    const expected = expectedCapacityFloors.get(role.roleId);
    invariant(
      expected &&
        role.minimumPrimaryHoursPerWeek === expected.primary &&
        role.minimumBackupHoursPerWeek === expected.backup &&
        role.primaryAssignmentRequired === true &&
        role.backupAssignmentRequired === true &&
        role.committedPrimaryHoursPerWeek === null &&
        role.committedBackupHoursPerWeek === null &&
        role.primaryAssignmentReceipt === null &&
        role.backupAssignmentReceipt === null,
      `${role.roleId}: G5 L5 roadmap capacity floor, commitment, or assignment boundary drifted`,
    );
  }
  invariant(
    profile.roadmapCapacityBoundary?.sourceSection === "4.5 Fidelity capacity proof and biweekly gates" &&
      profile.roadmapCapacityBoundary.minimumsAreRoadmapRequiredReservations === true &&
      profile.roadmapCapacityBoundary.minimumsAreInheritedCommitments === false &&
      profile.roadmapCapacityBoundary.minimumsAreEstablishedCommitments === false &&
      profile.roadmapCapacityBoundary.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      profile.roadmapCapacityBoundary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      profile.roadmapCapacityBoundary.rolesRequiringNamedPrimary === 7 &&
      profile.roadmapCapacityBoundary.rolesRequiringNamedBackup === 7 &&
      profile.roadmapCapacityBoundary.rolesWithOwnerPendingBackupHourFloor === 6 &&
      profile.roadmapCapacityBoundary.committedHourReceiptCount === 0,
    "G5 L5 roadmap capacity boundary drifted",
  );
  invariant(
    profile.budgetDecision?.currency === "USD" &&
      profile.budgetDecision.rateCeilingsApproved === false &&
      profile.budgetDecision.totalBudgetEnvelopeApproved === false &&
      profile.budgetDecision.procurementCycleApproved === false &&
      profile.budgetDecision.signedReceipt === null,
    "G5 L5 budget approvals must remain open",
  );
  invariant(Array.isArray(profile.independenceRules) && profile.independenceRules.length >= 5, "G5 L5 independence rules are incomplete");
  return profile;
}

function assertReleaseReport(document, reportType, label) {
  invariant(document?.schemaVersion >= 1 && document.reportType === reportType, `${label} report identity drifted`);
}

export function validateG5L5MachinePacket({release, reports}) {
  const {sourceScope, sourceGap, workspace, audio, animate, runtime, risk, promotion, containment} = reports;

  assertReleaseReport(sourceScope, "g5-l5-source-scope-freeze", "source scope");
  invariant(sourceScope.releaseId === G5_L5_RELEASE_ID, "source scope belongs to another release");
  invariant(
    sourceScope.summary?.memberCount === 57 &&
      sourceScope.summary.pageCount === 56 &&
      sourceScope.summary.shellCount === 1 &&
      sourceScope.summary.pairedFlaSwfCount === 49 &&
      sourceScope.summary.swfOnlyCount === 8 &&
      sourceScope.summary.exclusionCount === 11 &&
      sourceScope.summary.strictCompleteCount === 0 &&
      sourceScope.summary.publishedCount === 0,
    "source-scope summary drifted",
  );
  invariant(
    Array.isArray(sourceScope.members) &&
      sourceScope.members.length === 57 &&
      sourceScope.members.every((member, index) =>
        member.ordinal === release.members[index].ordinal &&
        member.animationId === release.members[index].animationId &&
        member.assetId === release.members[index].assetId &&
        member.source?.swf?.path === release.members[index].source.path &&
        member.source?.swf?.sha256 === release.members[index].source.sha256 &&
        member.strictComplete === false),
    "source-scope membership drifted",
  );

  assertReleaseReport(sourceGap, "lesson-release-source-gap-forensics", "source gap");
  invariant(sourceGap.releaseId === G5_L5_RELEASE_ID, "source-gap report belongs to another release");
  invariant(
    sourceGap.frozenRelease?.expectedMembers === 57 &&
      sourceGap.frozenRelease.activeXmlMembers === 56 &&
      sourceGap.frozenRelease.shellMembers === 1 &&
      sourceGap.frozenRelease.membershipChangedByThisReport === false &&
      sourceGap.reconciliation?.releaseOrderExactlyMatchesActiveXml === true &&
      sourceGap.reconciliation?.lessonDetailsVsActiveXml?.extraCount === 6 &&
      sourceGap.keytermGap?.declarations?.filter(({physicalPresence}) => physicalPresence === false).length === 2,
    "source-gap evidence boundary drifted",
  );
  assertFalseFields(sourceGap.acceptanceEffects, [
    "authoritativeOriginalRuntime",
    "implementationAuthorized",
    "published",
    "releaseScopeChanged",
    "sourceGapClosed",
    "strictComplete",
  ], "source-gap acceptance");

  assertReleaseReport(workspace, "g5-l5-workspace-readiness", "workspace readiness");
  invariant(workspace.releaseId === G5_L5_RELEASE_ID, "workspace report belongs to another release");
  invariant(
    workspace.summary?.expectedWorkspaceCount === 57 &&
      workspace.summary.presentWorkspaceCount === 57 &&
      workspace.summary.draftValidationPassCount === 57 &&
      workspace.summary.pairedWorkspaceCount === 49 &&
      workspace.summary.swfOnlyWorkspaceCount === 8 &&
      workspace.summary.implementationStartedCount === 0 &&
      workspace.summary.strictCompleteCount === 0 &&
      workspace.summary.publishedCount === 0,
    "workspace readiness summary drifted",
  );
  invariant(workspace.acceptanceEffects?.strictComplete === false && workspace.acceptanceEffects?.published === false, "workspace report promoted acceptance");

  assertReleaseReport(audio, "lesson-audio-ownership-machine-readiness", "audio ownership");
  invariant(audio.releaseId === G5_L5_RELEASE_ID, "audio report belongs to another release");
  invariant(
    audio.summary?.memberCount === 57 &&
      audio.summary.candidateFileCount === 182 &&
      audio.summary.physicalHashVerifiedFileCount === 182 &&
      audio.summary.authorizedOriginalRuntimeListeningSessionCount === 0 &&
      audio.summary.audioAcceptedFileCount === 0 &&
      audio.summary.audioAcceptedMemberCount === 0 &&
      audio.summary.strictCompleteMemberCount === 0 &&
      audio.summary.publishedMemberCount === 0,
    "audio ownership summary drifted",
  );
  assertFalseFields(audio.acceptance, [
    "cueMappingAccepted",
    "spokenLanguageAccepted",
    "synchronizationAccepted",
    "listeningAccepted",
    "humanAccepted",
    "ownerAccepted",
    "strictLessonComplete",
    "published",
  ], "audio acceptance");

  assertReleaseReport(animate, "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness", "Animate readiness");
  invariant(animate.release?.releaseId === G5_L5_RELEASE_ID, "Animate report belongs to another release");
  invariant(
    animate.summary?.selectedMembers === 57 &&
      animate.summary.flaBackedItems === 49 &&
      animate.summary.swfOnlyItems === 8 &&
      animate.summary.namedPrimaryOperatorRoleAssignmentsRecorded === 0 &&
      animate.summary.actualSessionOperatorAttestationsRecorded === 0 &&
      animate.summary.animateGuiExecutionsByThisBuilder === 0 &&
      animate.summary.authoringAuditsEstablished === 0 &&
      animate.summary.originalRuntimeBaselinesEstablished === 0 &&
      animate.summary.ownerAcceptancesEstablished === 0 &&
      animate.summary.strictAcceptancesEstablished === 0 &&
      animate.summary.strictAcceptanceEffect === false,
    "Animate readiness summary drifted",
  );
  invariant(
    animate.operatorAssignment?.status === "not-supplied" &&
      animate.operatorAssignment.assigneeFullName === null &&
      animate.operatorAssignment.receipt === null,
    "G5 L5 Animate readiness imported an operator",
  );
  assertFalseFields(animate.operatorAssignment, [
    "cryptographicallyVerified",
    "weeklyCapacityEstablished",
    "hostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "animateGuiExecutionAuthorized",
    "originalRuntimeExecutionAuthorized",
    "actualSessionOperatorAttestationPresent",
  ], "Animate operator boundary");

  assertReleaseReport(runtime, "release-runtime-acquisition-planning-readiness", "runtime planning");
  invariant(runtime.identity?.releaseId === G5_L5_RELEASE_ID, "runtime plan belongs to another release");
  invariant(
    runtime.scope?.releaseMemberCount === 57 &&
      runtime.scope.selectedMemberCount === 57 &&
      runtime.summary?.selectedMemberCount === 57 &&
      runtime.summary.emptyWorksheetCount === 57 &&
      runtime.summary.namedOperatorRoleAssignmentReceiptCount === 0 &&
      runtime.summary.runtimeSessionCount === 0 &&
      runtime.summary.runnableArtifactCount === 0 &&
      runtime.summary.authoritativeBaselineCount === 0 &&
      runtime.summary.acceptanceChangeCount === 0,
    "runtime planning summary drifted",
  );
  invariant(runtime.namedOperatorRoleAssignment === null && runtime.provenance?.namedOperatorAssignmentReceipt === null, "runtime plan imported an operator receipt");
  assertFalseFields(runtime.gates, [
    "audioRuntimeListeningComplete",
    "authoritativeBaselinesComplete",
    "authorizedOriginalRuntimeBound",
    "implementationAuthorized",
    "namedOperatorRoleAssignmentBound",
    "naturalTraceSchedulesComplete",
    "operatorWeeklyCapacityEstablished",
    "portableOperatorIdentityVerified",
    "publicationAffected",
    "rootReachableDomainsResolved",
    "runtimeOperatorBound",
    "runtimeOperatorSessionAttested",
    "strictCompletionAffected",
  ], "runtime planning gates");

  assertReleaseReport(risk, "lesson-release-static-risk-calibration", "risk calibration");
  invariant(risk.releaseId === G5_L5_RELEASE_ID, "risk report belongs to another release");
  invariant(
    risk.release?.expectedMemberCount === 57 &&
      risk.release.machineAuditMemberCount === 57 &&
      risk.release.strictCompleteCount === 0 &&
      risk.release.published === false &&
      risk.summary?.calibrationMemberCount === 8 &&
      risk.summary.workStudyTargetCount === 4 &&
      risk.summary.workStudyCompletedCount === 0 &&
      risk.sourceBindings?.machineAuditCoverage?.expectedMemberCount === 57 &&
      risk.sourceBindings.machineAuditCoverage.verifiedMemberCount === 57 &&
      risk.sourceBindings.machineAuditCoverage.members?.length === 57 &&
      risk.method?.noPriorLessonAuthorizationHoursReceiptOrAcceptanceInheritance === true,
    "risk-calibration boundary drifted",
  );
  assertFalseFields(risk.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "humanVisualAccepted",
    "implementationAuthorized",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], "risk acceptance");

  assertReleaseReport(promotion, "lesson-promotion-security-readiness", "promotion security");
  invariant(promotion.releaseId === G5_L5_RELEASE_ID, "promotion report belongs to another release");
  invariant(
    promotion.release?.expectedMemberCount === 57 &&
      promotion.release.strictCompleteCount === 0 &&
      promotion.release.published === false &&
      promotion.releaseScopedProjection?.strictCompleteCount === 0 &&
      promotion.releaseScopedProjection.published === false &&
      promotion.productionFuses?.allClosed === true &&
      promotion.readiness?.productionPromotionWriterReady === false &&
      promotion.readiness.productionReceiptIssuerPresent === false &&
      promotion.readiness.authoritativeOriginalRuntimeCaptureMayStart === false,
    "promotion-security boundary drifted",
  );
  assertFalseFields(promotion.acceptance, [
    "authoritativeBaselineAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "releaseAuthorized",
  ], "promotion acceptance");
  invariant(promotion.acceptance.strictCompletionsGrantedByThisReport === 0, "promotion report granted strict completion");

  assertReleaseReport(containment, "g5-l5-original-runtime-containment-readiness", "containment readiness");
  invariant(containment.releaseId === G5_L5_RELEASE_ID, "containment report belongs to another release");
  invariant(
    containment.summary?.releaseMemberCount === 57 &&
      containment.summary.namedOperatorCount === 0 &&
      containment.summary.containmentMechanismsSelected === 0 &&
      containment.summary.containmentControlsApproved === 0 &&
      containment.summary.containmentControlsVerified === 0 &&
      containment.summary.animateGuiExecutions === 0 &&
      containment.summary.originalRuntimeSessionsExecuted === 0 &&
      containment.summary.strictCompletions === 0 &&
      containment.summary.publications === 0 &&
      containment.executionGate?.runnable === false &&
      containment.operatorBoundary?.operatorAssignmentReceipt === null,
    "containment readiness boundary drifted",
  );
  assertFalseFields(containment.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "behaviorAccepted",
    "fullFrameAccepted",
    "humanReviewAccepted",
    "implementationAuthorized",
    "ownerFidelityAccepted",
    "published",
    "rendererSelected",
    "rmseAccepted",
    "strictComplete",
  ], "containment acceptance");

  return {
    exactReleaseScopeCurrent: true,
    source: {
      pages: 56,
      shells: 1,
      members: 57,
      pairedFlaSwf: 49,
      swfOnly: 8,
      exclusions: 11,
      lessonDetailExtras: 6,
      missingDeclaredKeytermDependencies: 2,
    },
    workspaces: {
      present: 57,
      draftValid: 57,
      machineAudited: 57,
      implementationStarted: 0,
    },
    audio: {
      candidates: 182,
      physicallyHashVerified: 182,
      acceptedMembers: 0,
    },
    authoring: {
      flaBacked: 49,
      pairedPreparationPackages: 49,
      namedOperators: 0,
      actualAudits: 0,
    },
    runtime: {
      emptyWorksheets: 57,
      namedOperators: 0,
      runnableArtifacts: 0,
      authoritativeSessions: 0,
      unresolvedNestedReachability: runtime.summary.unresolvedNestedReachabilityCount,
    },
    calibration: {
      selectedMembers: 8,
      workStudyCandidates: 4,
      completedWorkStudies: 0,
    },
    promotionSecurity: {
      syntheticTestsPassed: promotion.testResult.passed,
      productionFusesClosed: promotion.productionFuses.allClosed,
      productionWriterReady: false,
      releaseScopedProjectionCurrent: promotion.releaseScopedProjection.current,
    },
    containment: {
      controlsSpecified: 8,
      mechanismsSelected: 0,
      controlsApproved: 0,
      controlsVerified: 0,
      completeHostTrees: 0,
    },
    strictCompleteCount: 0,
    published: false,
  };
}

export async function buildG5L5M0GovernanceReadiness({
  root = projectRoot,
  profilePath = G5_L5_PROFILE_PATH,
  releaseManifestPath = G5_L5_RELEASE_MANIFEST_PATH,
} = {}) {
  const [
    profileRecord,
    releaseRecord,
    generatorRecord,
    ownerDirectiveIntake,
  ] = await Promise.all([
    jsonRecord(root, profilePath, "G5 L5 governance profile"),
    jsonRecord(root, releaseManifestPath, "lesson release manifest"),
    fileRecord(root, portable(path.relative(root, scriptPath)), "M0 generator"),
    readG5L5OwnerGovernanceDirectiveIntake({root}),
  ]);
  const {
    receipt: ownerDirectiveReceipt,
    binding: ownerDirectiveBinding,
  } = ownerDirectiveIntake;
  const release = selectG5L5Release(releaseRecord.value);
  invariant(
    ownerDirectiveReceipt.releaseId === G5_L5_RELEASE_ID &&
      ownerDirectiveReceipt.releaseFingerprintSha256 ===
        sha256(Buffer.from(stableJson(release))),
    "G5 L5 Owner directive receipt belongs to another release",
  );
  const roadmapRecord = await fileRecord(root, profileRecord.value.roadmap.path, "roadmap");
  const profile = validateG5L5GovernanceProfile(profileRecord.value, release, descriptor(roadmapRecord));
  const packetRecords = Object.fromEntries(await Promise.all(
    Object.entries(profile.machinePacket).map(async ([key, file]) => [
      key,
      await jsonRecord(root, file, `G5 L5 machine packet ${key}`),
    ]),
  ));
  const reports = {
    sourceScope: packetRecords.sourceScopeFreeze.value,
    sourceGap: packetRecords.sourceGapForensics.value,
    workspace: packetRecords.workspaceReadiness.value,
    audio: packetRecords.audioOwnershipReadiness.value,
    animate: packetRecords.animateOperatorReadiness.value,
    runtime: packetRecords.runtimeAcquisitionPlanning.value,
    risk: packetRecords.riskCalibration.value,
    promotion: packetRecords.promotionSecurityReadiness.value,
    containment: packetRecords.originalRuntimeContainmentReadiness.value,
  };
  const machinePacket = validateG5L5MachinePacket({release, reports});
  const ownerDecisionDirectives = new Map([
    [
      "rates-budget-envelope-and-procurement-cycle-review",
      {
        directive:
          "use-repository-defaults-resolved-to-fail-closed-null-values-with-no-spend-procurement-or-payment-authority",
        requirementSatisfied: false,
        status: "owner-directive-recorded-requirement-unsatisfied",
      },
    ],
    [
      "m1-machine-foundation-start-authorization",
      {
        directive:
          "authorize-g5-l5-m1-machine-only-static-foundation-start-and-execution",
        requirementSatisfied: true,
        status: "owner-authorized-machine-only-static-requirement-satisfied",
      },
    ],
  ]);
  const ownerDecisions = profile.requiredOwnerDecisions.map(({decisionId}) => {
    const projection = ownerDecisionDirectives.get(decisionId);
    return {
      decisionId,
      receipt: projection ? ownerDirectiveBinding : null,
      recorded: Boolean(projection),
      requirementSatisfied: projection?.requirementSatisfied ?? false,
      directive: projection?.directive ?? null,
      status: projection?.status ??
        "pending-owner-decision-and-external-receipt",
    };
  });
  const roleRequirements = profile.requiredRoles.map((role) => ({
    roleId: role.roleId,
    minimumPrimaryHoursPerWeek: role.minimumPrimaryHoursPerWeek,
    minimumBackupHoursPerWeek: role.minimumBackupHoursPerWeek,
    primaryAssignmentRequired: true,
    backupAssignmentRequired: true,
    committedPrimaryHoursPerWeek: null,
    committedBackupHoursPerWeek: null,
    primaryAssignee: null,
    backupAssignee: null,
    primaryAssignmentReceipt: null,
    backupAssignmentReceipt: null,
    primaryStatus: "roadmap-minimum-required-person-capacity-and-external-receipt-pending",
    backupStatus: role.minimumBackupHoursPerWeek === null
      ? "named-backup-required-owner-must-set-hour-floor-and-provide-external-receipt"
      : "roadmap-minimum-required-person-capacity-and-external-receipt-pending",
  }));
  const roleSlots = roleRequirements.flatMap((role) => [
    {
      roleId: role.roleId,
      slot: "primary",
      assignmentRequired: true,
      minimumRequiredHoursPerWeek: role.minimumPrimaryHoursPerWeek,
      committedHoursPerWeek: null,
      assignee: null,
      receipt: null,
      authorized: false,
    },
    {
      roleId: role.roleId,
      slot: "backup",
      assignmentRequired: true,
      minimumRequiredHoursPerWeek: role.minimumBackupHoursPerWeek,
      committedHoursPerWeek: null,
      assignee: null,
      receipt: null,
      authorized: false,
    },
  ]);
  const budgetGates = [
    {gateId: "rate-ceilings", approved: false, value: null, receipt: null},
    {gateId: "total-budget-envelope", approved: false, value: null, receipt: null},
    {gateId: "procurement-cycle", approved: false, value: null, receipt: null},
  ];
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-m0-governance-readiness",
    releaseId: G5_L5_RELEASE_ID,
    evidenceState:
      "machine-packet-current-owner-m0-exit-directive-recorded-m1-machine-only-static-authorized-m0-open",
    authority:
      "This release-local report verifies an acceptance-neutral 57-member machine packet and binds one immutable public-safe Owner directive receipt. The receipt records M0-exit intent without making M0 effective, ready, or closed; it authorizes only G5 L5 M1 machine-only static foundation start and execution. Repository budget/procurement defaults resolve to null values and grant no spend, procurement, or payment authority. No Owner identity, named person, inherited or established hour commitment, runtime/GUI execution, renderer implementation, evidence promotion, review decision, strict completion, or publication approval is established.",
    generator: descriptor(generatorRecord),
    sourceBindings: {
      releaseManifest: descriptor(releaseRecord),
      governanceProfile: descriptor(profileRecord),
      roadmap: descriptor(roadmapRecord),
      ownerGovernanceDirectiveIntake: ownerDirectiveBinding,
      machinePacket: Object.fromEntries(Object.entries(packetRecords).map(([key, record]) => [key, descriptor(record)])),
    },
    release: {
      title: release.titleDisplay,
      publicationMode: "atomic",
      memberCount: 57,
      pageCount: 56,
      shellCount: 1,
      releaseFingerprintSha256: profile.releaseFingerprintSha256,
    },
    roadmapBoundary: {
      milestoneId: "M5",
      milestoneStart: "2027-04-01",
      milestoneEnd: "2027-05-31",
      targetStrictMembers: 57,
      targetAtomicRelease: true,
      datesAreCapacityOrAuthorizationProof: false,
      approvedM0M1ExecutionCalendarReceipt: null,
    },
    roadmapCapacityBoundary: {
      sourceSection: profile.roadmapCapacityBoundary.sourceSection,
      minimumsAreRoadmapRequiredReservations: true,
      minimumsAreInheritedCommitments: false,
      minimumsAreEstablishedCommitments: false,
      requiredRoleCount: 7,
      requiredNamedPrimaryCount: 7,
      requiredNamedBackupCount: 7,
      requiredPrimaryHoursPerWeekFloorTotal: 64,
      specifiedBackupHoursPerWeekFloorTotal: 8,
      rolesWithOwnerPendingBackupHourFloor: 6,
      committedHourReceiptCount: 0,
      committedHoursPerWeekTotal: 0,
    },
    machinePacket,
    authorizationInputs: profile.authorizationInputs,
    ownerDirective: {
      receipt: ownerDirectiveBinding,
      continueMachineOnlyStaticWork:
        ownerDirectiveReceipt.authorization.continueMachineOnlyStaticWork,
      m0ExitDirectiveRecorded:
        ownerDirectiveReceipt.authorization.m0ExitDirectiveRecorded,
      m0ExitEffective:
        ownerDirectiveReceipt.authorityBoundary.m0ExitEffective,
      m1MachineOnlyStartAuthorized:
        ownerDirectiveReceipt.authorization.m1MachineFoundationStartAuthorized,
      m1MachineOnlyEffective:
        ownerDirectiveReceipt.authorityBoundary.m1MachineOnlyEffective,
      repositoryBudgetProcurementDefaultsSelected:
        ownerDirectiveReceipt.authorization
          .repositoryBudgetProcurementDefaultsSelected,
      budgetValuesEstablished:
        ownerDirectiveReceipt.authorityBoundary.budgetValuesEstablished,
      externalSpendAuthorized:
        ownerDirectiveReceipt.authorityBoundary.externalSpendAuthorized,
      procurementOrPaymentAuthorized:
        ownerDirectiveReceipt.authorityBoundary
          .procurementOrPaymentAuthorized,
      runtimeHostOrContainmentAuthorized:
        ownerDirectiveReceipt.authorityBoundary
          .runtimeHostOrContainmentAuthorized,
      originalRuntimeExecutionAuthorized:
        ownerDirectiveReceipt.authorityBoundary
          .originalRuntimeExecutionAuthorized,
      animateGuiExecutionAuthorized:
        ownerDirectiveReceipt.authorityBoundary
          .animateGuiExecutionAuthorized,
      rendererImplementationAuthorized:
        ownerDirectiveReceipt.authorityBoundary
          .rendererImplementationAuthorized,
      evidencePromotionAuthorized:
        ownerDirectiveReceipt.authorityBoundary.evidencePromotionAuthorized,
      humanReviewAccepted:
        ownerDirectiveReceipt.authorityBoundary.humanReviewAccepted,
      ownerFidelityAcceptanceEstablished:
        ownerDirectiveReceipt.authorityBoundary
          .ownerFidelityAcceptanceEstablished,
      strictCompletionEstablished:
        ownerDirectiveReceipt.authorityBoundary.strictCompletionEstablished,
      publicationAuthorized:
        ownerDirectiveReceipt.authorityBoundary.publicationAuthorized,
    },
    owner: {
      identity: null,
      cryptographicallyVerified: false,
      m0SignoffReceipt: null,
      m0ExitDirectiveReceipt: ownerDirectiveBinding,
      m0ExitDirectiveRecorded: true,
      m0ExitEffective: false,
      m0ExitApproved: false,
    },
    m1: {
      startAuthorizationReceipt: ownerDirectiveBinding,
      startAuthorized: false,
      machineOnlyStaticStartAuthorized: true,
      machineFoundationExecutionAuthorized: false,
      machineOnlyStaticExecutionAuthorized: true,
      machineOnlyStaticScope: true,
      implementationAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
    },
    ownerDecisions,
    roleRequirements,
    roleSlots,
    budget: {
      currency: "USD",
      gates: budgetGates,
      defaultSelection: structuredClone(
        ownerDirectiveReceipt.budgetDefaultResolution,
      ),
      ownerDirectiveReceipt: ownerDirectiveBinding,
      signedReceipt: null,
      approved: false,
    },
    independenceRules: profile.independenceRules,
    summary: {
      machinePacketReadyForOwnerReview: true,
      requiredOwnerDecisionCount: 6,
      ownerDecisionReceiptCount: 2,
      ownerDecisionRequirementSatisfiedCount: 1,
      requiredRoleCount: 7,
      requiredNamedRoleSlotCount: 14,
      namedRoleAssignmentReceiptCount: 0,
      namedPersonCount: 0,
      requiredPrimaryHoursPerWeekFloorTotal: 64,
      specifiedBackupHoursPerWeekFloorTotal: 8,
      rolesWithOwnerPendingBackupHourFloorCount: 6,
      inheritedHourCommitmentCount: 0,
      committedHourCommitmentCount: 0,
      committedHoursPerWeekTotal: 0,
      budgetGateCount: 3,
      budgetGateApprovedCount: 0,
      budgetDefaultSelectionRecorded: true,
      budgetValuesEstablished: false,
      externalSpendAuthorized: false,
      procurementOrPaymentAuthorized: false,
      m0ExitDirectiveRecorded: true,
      m0ExitEffective: false,
      m0ExitReady: false,
      m1StartAuthorized: false,
      m1MachineOnlyStaticStartAuthorized: true,
      m1MachineFoundationExecutionAuthorized: false,
      m1MachineOnlyStaticExecutionAuthorized: true,
      strictCompleteCount: 0,
      published: false,
    },
    blockers: [
      "The immutable Owner directive records M0-exit intent, but no portable external signature or complete M0 governance evidence makes that intent effective; M0 remains open.",
      "Only the budget/procurement-default and M1 machine-foundation decisions bind the directive receipt. Four of six required Owner decisions remain pending, and only the M1 machine-foundation requirement is satisfied.",
      "All seven primary and seven named backup human-role assignments and identity receipts remain unset. The roadmap primary minimums total 64 hours/week; the original-runtime backup minimum is 8 hours/week, and Owner must set the other six backup hour floors.",
      "The selected repository budget/procurement defaults contain no numeric rate ceiling, total budget, or procurement/payment cycle; all three gates remain unapproved and no spend, procurement, or payment is authorized.",
      "M1 machine-only static foundation start and execution are authorized, but this does not authorize runtime/GUI execution, renderer implementation, or evidence promotion.",
      "The read-only host tree is incomplete because two declared keyterm dependencies are absent; all eight containment mechanisms remain unselected, unapproved, and unverified.",
      "Original-runtime, authoring, audio, implementation, human review, Owner fidelity, strict-completion, and atomic-publication gates remain open.",
    ],
    nextOwnerActions: [
      "Review the exact G5 L5 56-page plus Shell membership, exclusions, source gaps, and missing dependency dispositions.",
      "Provide separately controlled evidence for the four pending Owner decisions, all seven named primary and seven named backup assignments, committed capacity against the roadmap minimums, any non-null budget/procurement values, and later runtime/promotion gates; automation must not fill identities, committed hours, values, or decisions.",
      "Do not reinterpret the bounded M1 machine-only static authorization or roadmap M5 date as permission to launch Animate/original runtime, implement a renderer, promote evidence, accept fidelity, or publish.",
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
  validateG5L5M0GovernanceReport(report);
  return report;
}

export function validateG5L5M0GovernanceReport(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === "g5-l5-m0-governance-readiness", "G5 L5 M0 report identity drifted");
  invariant(report.releaseId === G5_L5_RELEASE_ID, "G5 L5 M0 report belongs to another release");
  invariant(
    report.release?.memberCount === 57 &&
      report.release.pageCount === 56 &&
      report.release.shellCount === 1 &&
      report.release.publicationMode === "atomic",
    "G5 L5 M0 release scope drifted",
  );
  invariant(report.machinePacket?.workspaces?.machineAudited === 57, "G5 L5 M0 machine-audit coverage drifted");
  invariant(
    report.summary?.machinePacketReadyForOwnerReview === true &&
      report.summary.ownerDecisionReceiptCount === 2 &&
      report.summary.ownerDecisionRequirementSatisfiedCount === 1 &&
      report.summary.requiredRoleCount === 7 &&
      report.summary.requiredNamedRoleSlotCount === 14 &&
      report.summary.namedRoleAssignmentReceiptCount === 0 &&
      report.summary.namedPersonCount === 0 &&
      report.summary.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      report.summary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      report.summary.rolesWithOwnerPendingBackupHourFloorCount === 6 &&
      report.summary.inheritedHourCommitmentCount === 0 &&
      report.summary.committedHourCommitmentCount === 0 &&
      report.summary.committedHoursPerWeekTotal === 0 &&
      report.summary.budgetGateApprovedCount === 0 &&
      report.summary.budgetDefaultSelectionRecorded === true &&
      report.summary.budgetValuesEstablished === false &&
      report.summary.externalSpendAuthorized === false &&
      report.summary.procurementOrPaymentAuthorized === false &&
      report.summary.m0ExitDirectiveRecorded === true &&
      report.summary.m0ExitEffective === false &&
      report.summary.m0ExitReady === false &&
      report.summary.m1StartAuthorized === false &&
      report.summary.m1MachineOnlyStaticStartAuthorized === true &&
      report.summary.m1MachineFoundationExecutionAuthorized === false &&
      report.summary.m1MachineOnlyStaticExecutionAuthorized === true &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.published === false,
    "G5 L5 M0 summary crossed a governance boundary",
  );
  invariant(
    hasExactKeys(report.authorizationInputs, G5_L5_AUTHORIZATION_INPUT_KEYS) &&
      G5_L5_AUTHORIZATION_INPUT_KEYS.every(
        (key) => report.authorizationInputs[key] === null,
      ),
    "G5 L5 M0 report imported an authorization input or changed the exact seven-key baseline",
  );
  const expectedRoleFloors = new Map([
    ["authorized-original-runtime-operator", {primary: 20, backup: 8}],
    ["mathematics-reviewer", {primary: 8, backup: null}],
    ["spanish-reviewer", {primary: 8, backup: null}],
    ["audio-reviewer", {primary: 8, backup: null}],
    ["independent-visual-reviewer", {primary: 8, backup: null}],
    ["owner-approver", {primary: 4, backup: null}],
    ["product-accessibility-reviewer", {primary: 8, backup: null}],
  ]);
  invariant(report.roleRequirements?.length === 7, "G5 L5 M0 role requirement count drifted");
  for (const role of report.roleRequirements) {
    const expected = expectedRoleFloors.get(role.roleId);
    invariant(
      expected &&
        role.minimumPrimaryHoursPerWeek === expected.primary &&
        role.minimumBackupHoursPerWeek === expected.backup &&
        role.primaryAssignmentRequired === true &&
        role.backupAssignmentRequired === true &&
        role.committedPrimaryHoursPerWeek === null &&
        role.committedBackupHoursPerWeek === null &&
        role.primaryAssignee === null &&
        role.backupAssignee === null &&
        role.primaryAssignmentReceipt === null &&
        role.backupAssignmentReceipt === null,
      `${role.roleId}: G5 L5 M0 required floor or uncommitted role boundary drifted`,
    );
  }
  invariant(report.roleSlots?.length === 14, "G5 L5 M0 role-slot count drifted");
  for (const slot of report.roleSlots) {
    const expected = expectedRoleFloors.get(slot.roleId);
    invariant(
      expected &&
        ["primary", "backup"].includes(slot.slot) &&
        slot.assignmentRequired === true &&
        slot.minimumRequiredHoursPerWeek === expected[slot.slot] &&
        slot.committedHoursPerWeek === null &&
        slot.assignee === null &&
        slot.receipt === null &&
        slot.authorized === false,
      `${slot.roleId}/${slot.slot}: G5 L5 M0 role slot imported a person, commitment, receipt, or authorization`,
    );
  }
  invariant(
    report.roadmapCapacityBoundary?.minimumsAreRoadmapRequiredReservations === true &&
      report.roadmapCapacityBoundary.minimumsAreInheritedCommitments === false &&
      report.roadmapCapacityBoundary.minimumsAreEstablishedCommitments === false &&
      report.roadmapCapacityBoundary.requiredRoleCount === 7 &&
      report.roadmapCapacityBoundary.requiredNamedPrimaryCount === 7 &&
      report.roadmapCapacityBoundary.requiredNamedBackupCount === 7 &&
      report.roadmapCapacityBoundary.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      report.roadmapCapacityBoundary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      report.roadmapCapacityBoundary.rolesWithOwnerPendingBackupHourFloor === 6 &&
      report.roadmapCapacityBoundary.committedHourReceiptCount === 0 &&
      report.roadmapCapacityBoundary.committedHoursPerWeekTotal === 0,
    "G5 L5 M0 roadmap capacity boundary drifted",
  );
  const ownerDirectiveBinding =
    report.sourceBindings?.ownerGovernanceDirectiveIntake;
  assertOwnerDirectiveBinding(
    ownerDirectiveBinding,
    "G5 L5 M0 source binding",
  );
  invariant(
    sameDescriptor(report.ownerDirective?.receipt, ownerDirectiveBinding) &&
      report.ownerDirective.continueMachineOnlyStaticWork === true &&
      report.ownerDirective.m0ExitDirectiveRecorded === true &&
      report.ownerDirective.m0ExitEffective === false &&
      report.ownerDirective.m1MachineOnlyStartAuthorized === true &&
      report.ownerDirective.m1MachineOnlyEffective === true &&
      report.ownerDirective
        .repositoryBudgetProcurementDefaultsSelected === true &&
      report.ownerDirective.budgetValuesEstablished === false &&
      report.ownerDirective.externalSpendAuthorized === false &&
      report.ownerDirective.procurementOrPaymentAuthorized === false &&
      report.ownerDirective.runtimeHostOrContainmentAuthorized === false &&
      report.ownerDirective.originalRuntimeExecutionAuthorized === false &&
      report.ownerDirective.animateGuiExecutionAuthorized === false &&
      report.ownerDirective.rendererImplementationAuthorized === false &&
      report.ownerDirective.evidencePromotionAuthorized === false &&
      report.ownerDirective.humanReviewAccepted === false &&
      report.ownerDirective.ownerFidelityAcceptanceEstablished === false &&
      report.ownerDirective.strictCompletionEstablished === false &&
      report.ownerDirective.publicationAuthorized === false,
    "G5 L5 M0 Owner directive projection drifted",
  );
  invariant(
    report.owner?.identity === null &&
      report.owner.cryptographicallyVerified === false &&
      report.owner.m0SignoffReceipt === null &&
      sameDescriptor(
        report.owner.m0ExitDirectiveReceipt,
        ownerDirectiveBinding,
      ) &&
      report.owner.m0ExitDirectiveRecorded === true &&
      report.owner.m0ExitEffective === false &&
      report.owner.m0ExitApproved === false,
    "G5 L5 M0 report changed the bounded Owner directive into effective M0 evidence",
  );
  invariant(
    report.m1?.startAuthorized === false &&
      report.m1.machineOnlyStaticStartAuthorized === true &&
      report.m1.machineFoundationExecutionAuthorized === false &&
      report.m1.machineOnlyStaticExecutionAuthorized === true &&
      report.m1.machineOnlyStaticScope === true &&
      sameDescriptor(
        report.m1.startAuthorizationReceipt,
        ownerDirectiveBinding,
      ),
    "G5 L5 M1 bounded machine-only authorization drifted",
  );
  assertFalseFields(report.m1, [
    "implementationAuthorized",
    "originalRuntimeExecutionAuthorized",
  ], "G5 L5 M1 downstream boundary");
  invariant(
    report.ownerDecisions?.length === 6 &&
      report.ownerDecisions.map(({decisionId}) => decisionId).join("\0") ===
        [
          "release-membership-and-exclusions-review",
          "source-gap-and-missing-dependency-dispositions-review",
          "staffing-capacity-and-backups-review",
          "rates-budget-envelope-and-procurement-cycle-review",
          "m1-machine-foundation-start-authorization",
          "promotion-security-and-atomic-publication-authorization",
        ].join("\0"),
    "G5 L5 M0 Owner decision set drifted",
  );
  for (const decision of report.ownerDecisions) {
    if (
      decision.decisionId ===
      "rates-budget-envelope-and-procurement-cycle-review"
    ) {
      invariant(
        sameDescriptor(decision.receipt, ownerDirectiveBinding) &&
          decision.recorded === true &&
          decision.requirementSatisfied === false &&
          decision.directive ===
            "use-repository-defaults-resolved-to-fail-closed-null-values-with-no-spend-procurement-or-payment-authority" &&
          decision.status ===
            "owner-directive-recorded-requirement-unsatisfied",
        "G5 L5 M0 budget/procurement Owner decision drifted",
      );
    } else if (
      decision.decisionId === "m1-machine-foundation-start-authorization"
    ) {
      invariant(
        sameDescriptor(decision.receipt, ownerDirectiveBinding) &&
          decision.recorded === true &&
          decision.requirementSatisfied === true &&
          decision.directive ===
            "authorize-g5-l5-m1-machine-only-static-foundation-start-and-execution" &&
          decision.status ===
            "owner-authorized-machine-only-static-requirement-satisfied",
        "G5 L5 M1 Owner decision drifted",
      );
    } else {
      invariant(
        decision.receipt === null &&
          decision.recorded === false &&
          decision.requirementSatisfied === false &&
          decision.directive === null &&
          decision.status ===
            "pending-owner-decision-and-external-receipt",
        `${decision.decisionId}: G5 L5 M0 pending Owner decision was promoted`,
      );
    }
  }
  invariant(
    report.ownerDecisions.filter(({receipt}) => receipt !== null).length ===
        2 &&
      report.ownerDecisions.filter(({requirementSatisfied}) =>
        requirementSatisfied).length === 1,
    "G5 L5 M0 Owner decision receipt or satisfaction count drifted",
  );
  invariant(
    report.budget?.currency === "USD" &&
      report.budget.gates?.length === 3 &&
      report.budget.gates.every(({approved, value, receipt}) =>
        approved === false && value === null && receipt === null) &&
      report.budget.defaultSelection?.currency === "USD" &&
      report.budget.defaultSelection.ownerSelectedRepositoryDefaults ===
        true &&
      report.budget.defaultSelection
        .repositoryDefinedNumericOrCycleDefaultsFound === false &&
      report.budget.defaultSelection.personnelRateCeilingUsdPerHour === null &&
      report.budget.defaultSelection.totalBudgetEnvelopeUsd === null &&
      report.budget.defaultSelection.procurementPaymentCycle === null &&
      report.budget.defaultSelection.defaultDisposition ===
        "fail-closed-unset-no-spend-procurement-or-payment-authority" &&
      report.budget.defaultSelection.externalSpendAuthorized === false &&
      report.budget.defaultSelection.procurementOrPaymentAuthorized === false &&
      report.budget.defaultSelection.anySpendRequiresNewOwnerReceipt ===
        true &&
      sameDescriptor(
        report.budget.ownerDirectiveReceipt,
        ownerDirectiveBinding,
      ) &&
      report.budget.signedReceipt === null &&
      report.budget.approved === false,
    "G5 L5 M0 budget defaults invented a value, approval, spend, procurement, or payment authority",
  );
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
  ], "G5 L5 M0 acceptance");
  invariant(
    report.acceptanceEffects.m1MachineOnlyStaticStartAuthorized === true &&
      report.acceptanceEffects.m1MachineOnlyStaticExecutionAuthorized === true,
    "G5 L5 M0 report lost bounded M1 authorization",
  );
  invariant(!JSON.stringify(report).includes("Dr. Peter"), "G5 L5 M0 report imported a named person");
  invariant(!Object.values(report.sourceBindings?.machinePacket ?? {}).some(({path: file}) => file?.includes("g5-l4")), "G5 L5 M0 report imported a G5 L4 packet");
  const {reportFingerprintSha256, ...base} = report;
  invariant(reportFingerprintSha256 === sha256(Buffer.from(stableJson(base))), "G5 L5 M0 report fingerprint drifted");
  return report;
}

export function renderG5L5M0Markdown(report) {
  const decisionRows = report.ownerDecisions.map(
    ({decisionId, status, requirementSatisfied}) =>
      `| \`${decisionId}\` | ${status} | ${requirementSatisfied} |`,
  ).join("\n");
  const roleRows = report.roleRequirements.map((role) =>
    `| \`${role.roleId}\` | ${role.minimumPrimaryHoursPerWeek} | unset | ${role.minimumBackupHoursPerWeek ?? "Owner must set"} | unset | pending | pending (required) |`,
  ).join("\n");
  return `# G5 L5 M0 governance readiness\n\n` +
    `> ${report.authority}\n\n` +
    `## Outcome\n\n` +
    `- Exact release scope: **56 pages + Shell = 57 members**; machine audits: **57/57**.\n` +
    `- Machine packet ready for Owner review: **true**.\n` +
    `- Owner decision receipts / satisfied requirements: **2/6 / 1/6**; named primary/backup role assignments: **0/14** across **7 roles**.\n` +
    `- Roadmap-required primary floor total: **64 hours/week**; specified backup floor total: **8 hours/week**; six other backup floors require Owner decisions.\n` +
    `- Named people / inherited hour commitments / committed hour receipts / committed hours: **0 / 0 / 0 / 0**.\n` +
    `- Repository budget/procurement defaults selected: **true**; numeric/cycle values established: **false**; budget/procurement gates: **0/3**; spend/procurement/payment authority: **false**.\n` +
    `- M0-exit directive recorded: **true**; M0 effective / ready / closed: **false / false / false**.\n` +
    `- M1 machine-only static start / foundation execution authorized: **true / true**.\n` +
    `- Strict: **0/57**; published: **false**.\n\n` +
    `## Owner decisions\n\n| Decision | State | Requirement satisfied |\n|---|---|---|\n${decisionRows}\n\n` +
    `The minimums below are roadmap-required reservations from section 4.5. They are neither inherited nor established commitments; every committed-hours field remains unset.\n\n` +
    `## Human-role capacity\n\n| Role | Primary floor | Primary committed | Backup floor | Backup committed | Primary person | Backup person |\n|---|---:|---:|---:|---:|---|---|\n${roleRows}\n\n` +
    `## Open gates\n\n${report.blockers.map((blocker) => `- ${blocker}`).join("\n")}\n\n` +
    `This report grants only G5 L5 M1 machine-only static foundation start and execution. It grants no effective M0 exit or close, named-human assignment, hour commitment, budget value/approval or spend/procurement/payment authority, GUI/runtime execution, renderer implementation, evidence promotion, review acceptance, strict completion, or publication authority.\n`;
}

function outputPaths(root, outputPrefix) {
  invariant(typeof outputPrefix === "string" && outputPrefix.startsWith("reports/"), "output prefix must stay below reports/");
  invariant(!outputPrefix.endsWith(".json") && !outputPrefix.endsWith(".md"), "output prefix must omit an extension");
  return {
    json: resolveProjectPath(root, `${outputPrefix}.json`, "M0 JSON output"),
    markdown: resolveProjectPath(root, `${outputPrefix}.md`, "M0 Markdown output"),
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

export async function writeOrCheckG5L5M0({report, outputPrefix, check, root = projectRoot}) {
  const outputs = outputPaths(root, outputPrefix);
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderG5L5M0Markdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readContainedOrdinaryFile(root, outputs.json, "M0 JSON output"),
      readContainedOrdinaryFile(root, outputs.markdown, "M0 Markdown output"),
    ]);
    invariant(actualJson.toString("utf8") === expectedJson, "G5 L5 M0 JSON report is stale");
    invariant(actualMarkdown.toString("utf8") === expectedMarkdown, "G5 L5 M0 Markdown report is stale");
    return {status: "checked", outputs};
  }
  await Promise.all([
    atomicWrite(root, outputs.json, expectedJson, "M0 JSON output"),
    atomicWrite(root, outputs.markdown, expectedMarkdown, "M0 Markdown output"),
  ]);
  return {status: "written", outputs};
}

export function parseG5L5M0Arguments(argv) {
  const options = {
    check: false,
    outputPrefix: "reports/g5-l5-m0-governance-readiness",
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
  const options = parseG5L5M0Arguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/build-g5-l5-m0-governance-readiness.mjs [--output-prefix reports/prefix] [--check]\n");
    return;
  }
  const report = await buildG5L5M0GovernanceReadiness();
  const result = await writeOrCheckG5L5M0({...options, report});
  process.stdout.write(`${result.status === "checked" ? "PASS" : "WROTE"}: M0 directive true/effective false; M1 machine-only static authorized true; strict 0/57; published false\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
