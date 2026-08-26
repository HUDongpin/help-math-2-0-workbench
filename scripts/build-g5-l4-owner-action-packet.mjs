#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {lstat, readFile, realpath, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  projectG5L4PublicSafeOwnerWorkAuthorization,
  validateG5L4OwnerWorkAuthorizationReceipt,
  validateG5L4PublicSafeOwnerWorkAuthorizationProjection,
} from "./lib/g5-l4-owner-work-authorization.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const RELEASE_FINGERPRINT_SHA256 = "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const JSON_OUTPUT = "reports/g5-l4-owner-action-packet.json";
const MARKDOWN_OUTPUT = "reports/g5-l4-owner-action-packet.md";
const SHA256 = /^[a-f0-9]{64}$/;

const INPUTS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  releaseLedger: "catalog/lesson-release-ledger.json",
  m0Governance: "reports/g5-l4-m0-governance-readiness.json",
  m1Foundation: "reports/g5-l4-m1-machine-foundation-readiness.json",
  containment: "reports/g5-l4-original-runtime-containment-readiness.json",
  ownerWorkAuthorization: G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  sourceGap: "reports/g5-l4-source-gap-forensics.json",
  workspaceReadiness: "reports/g5-l4-workspace-readiness.json",
  roadmap: "outputs/help-math-2-product-deployment-district-pilot-roadmap-2026-2027.zh.md",
});

const DECISIONS = Object.freeze([
  "release-membership-and-exclusions-review",
  "source-gap-fail-closed-dispositions-review",
  "staffing-capacity-and-backups-review",
  "rates-budget-envelope-and-procurement-cycle-review",
]);

const ROLES = Object.freeze([
  {roleId: "authorized-original-runtime-operator", primary: 20, backup: 8},
  {roleId: "mathematics-reviewer", primary: 8, backup: null},
  {roleId: "spanish-reviewer", primary: 8, backup: null},
  {roleId: "audio-reviewer", primary: 8, backup: null},
  {roleId: "independent-visual-reviewer", primary: 8, backup: null},
  {roleId: "owner-approver", primary: 4, backup: null},
]);

const ACCEPTANCE_KEYS = Object.freeze([
  "m0ExitByThisPacket", "m1StartAuthorizationChangedByThisPacket",
  "runtimeExecutionAuthorizedByThisPacket", "implementationAuthorizedByThisPacket",
  "audioAcceptedByThisPacket", "humanVisualAcceptedByThisPacket",
  "ownerAcceptedByThisPacket", "strictCompleteByThisPacket", "publishedByThisPacket",
]);

const AUTHORITY = "This report is a public-safe blank external-action worksheet that separately binds a user-attested Owner permission to continue remaining in-scope machine, implementation, and prospective runtime-execution work. That permission is not implementation acceptance, an exact-host or immutable-session runtime execution authorization, an assignment, signature, attestation, budget approval, fidelity decision, strict completion, publication authorization, or release receipt.";
const SOURCE_GAP_INSTRUCTION = "Recover and hash-bind each declared missing XML dependency, or record a validator-supported reviewed exception. Do not invent English or Spanish keyterm content.";
const RETURN_TO_GIT = "Only a separately reviewed public-safe opaque receipt index and exact hash may return to Git. Keep names, signatures, contracts, rates, detailed budgets, host details, credentials, and signed document bytes outside this report.";
const CONTROL_REQUIREMENTS = Object.freeze([
  "Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player.",
  "Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency.",
  "Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session.",
  "Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.",
  "Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load.",
  "Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled.",
  "Run a fresh storage-capacity preflight immediately before every bounded capture session.",
  "Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution.",
]);
const ORDERED_EXTERNAL_ACTIONS = Object.freeze([
  "Preserve the already-recorded release-scope and fail-closed source-gap directives; no duplicate decision is requested by this packet.",
  "Name effective independent backup people, set five unspecified backup hour floors, and commit all twelve slots against roadmap minimums.",
  "Approve non-empty rate ceilings, total budget envelope, and procurement cycle outside the repository.",
  "Recover and hash-bind both missing KeyTerm XML dependencies, or record a validator-supported reviewed exception before CR-02 can close.",
  "Review the eight machine-selected CR-01 through CR-08 candidates, then separately approve and live-verify them in an immutable exact-session authorization before any execution.",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label}: expected object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(actual.length === wanted.length && actual.every((key, index) => key === wanted[index]),
    `${label}: unexpected or missing field`);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath && !path.isAbsolute(relativePath), "path must be project-relative");
  const absolute = path.resolve(projectRoot, relativePath);
  invariant(path.relative(projectRoot, absolute).split(path.sep).join("/") === relativePath, "path escapes project root");
  return absolute;
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function assertNoSymlinkComponents(relativePath, {finalType = null} = {}) {
  const parts = relativePath.split("/");
  let current = projectRoot;
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    const metadata = await lstat(current);
    invariant(!metadata.isSymbolicLink(), `${relativePath}: symbolic-link component is forbidden`);
    if (index < parts.length - 1) invariant(metadata.isDirectory(), `${relativePath}: parent component is not a directory`);
    else if (finalType === "file") invariant(metadata.isFile() && metadata.nlink === 1, `${relativePath}: must be one ordinary file`);
    else if (finalType === "directory") invariant(metadata.isDirectory(), `${relativePath}: parent is not a directory`);
  }
  const [realRoot, realTarget] = await Promise.all([realpath(projectRoot), realpath(current)]);
  invariant(isWithin(realRoot, realTarget), `${relativePath}: resolves outside project root`);
  return current;
}

async function readBinding(relativePath, {json = true} = {}) {
  const absolute = await assertNoSymlinkComponents(relativePath, {finalType: "file"});
  const before = await lstat(absolute);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size && bytes.length === after.size, `${relativePath}: changed while reading`);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes.toString("utf8"),
    document: json ? JSON.parse(bytes.toString("utf8")) : null,
  };
}

function descriptor(binding) {
  return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
}

function selectRelease(document) {
  const matches = document?.releases?.filter((item) => item.releaseId === RELEASE_ID) || [];
  invariant(matches.length === 1, "G5 L4 release is not unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Number Lines" && release.grade === 5 && release.lesson === 4 &&
    release.publicationMode === "atomic" && release.expectedCounts?.activeXmlReferencedPages === 54 &&
    release.expectedCounts?.courseShells === 1 && release.expectedCounts?.members === 55 &&
    release.members?.length === 55 && release.members.every((member, index) => member.ordinal === index + 1),
    "G5 L4 release scope drifted",
  );
  invariant(sha256(Buffer.from(stableJson(release))) === RELEASE_FINGERPRINT_SHA256,
    "G5 L4 release fingerprint drifted");
  return release;
}

function validateInputs(inputs) {
  const release = selectRelease(inputs.releaseManifest.document);
  validateG5L4OwnerWorkAuthorizationReceipt(
    inputs.ownerWorkAuthorization.document,
    {releaseManifest: inputs.releaseManifest.document},
  );
  const ownerWorkAuthorization =
    projectG5L4PublicSafeOwnerWorkAuthorization(
      inputs.ownerWorkAuthorization.document,
      descriptor(inputs.ownerWorkAuthorization),
    );
  const ledger = (inputs.releaseLedger.document?.releases || []).find((item) => item.releaseId === RELEASE_ID);
  invariant(ledger?.expectedMemberCount === 55 && ledger.strictCompleteCount === 0 && ledger.missingCount === 55 && ledger.published === false && ledger.gate?.open === false, "G5 L4 release ledger crossed a protected gate");
  const m0 = inputs.m0Governance.document;
  invariant(
    m0?.releaseId === RELEASE_ID &&
    m0.summary?.ownerDecisionReceiptCount === 4 &&
    m0.summary?.ownerDecisionM0SatisfiedCount === 2 &&
    m0.summary?.requiredNamedRoleSlotCount === 12 &&
    m0.summary?.namedRoleAssignmentReceiptCount === 12 &&
    m0.summary?.ownerAttestedNamedRoleAssignmentCount === 12 &&
    m0.summary?.weeklyCapacityCommitmentCount === 12 &&
    m0.summary?.capacityFloorSatisfiedCount === 0 &&
    m0.summary?.effectiveBackupCoverageCount === 0 &&
    m0.summary?.roleBackupHourFloorSpecifiedCount === 1 &&
    m0.summary?.unresolvedBackupHourFloorCount === 5 &&
    m0.summary?.budgetGateApprovedCount === 0 &&
    m0.summary?.budgetGateCount === 3 &&
    m0.summary?.m0ExitReady === false &&
    m0.summary?.m1StartAuthorized === true &&
    m0.ownerDecisions?.length === 4 &&
    m0.ownerDecisions.every((item, index) =>
      item.decisionId === DECISIONS[index] &&
      item.recorded === true &&
      item.m0RequirementSatisfied === (index < 2)) &&
    m0.roleSlots?.length === 12 &&
    m0.roleSlots.every((item, index) => {
      const role = ROLES[Math.floor(index / 2)];
      const slot = index % 2 ? "backup" : "primary";
      const floor = slot === "primary" ? role.primary : role.backup;
      return item.roleId === role.roleId &&
        item.assignment === slot &&
        item.capacityCommitmentEstablished === true &&
        item.committedHoursPerWeek === 1 &&
        item.minimumHoursPerWeek === floor &&
        item.capacityFloorSpecified === (floor !== null) &&
        item.capacityFloorSatisfied === false &&
        item.assignee?.identityEvidence === "user-attested-current-codex-task" &&
        item.assignee?.cryptographicallyVerified === false &&
        item.assignee?.samePersonAsOwner === true &&
        (slot === "primary"
          ? item.effectiveBackupCoverageEstablished === null
          : item.effectiveBackupCoverageEstablished === false);
    }) &&
    new Set(m0.roleSlots.map((item) => item.assignee?.fullName)).size === 1,
    "G5 L4 M0 governance state drifted",
  );
  const m1 = inputs.m1Foundation.document;
  invariant(
    m1?.releaseId === RELEASE_ID &&
    m1.summary?.releaseMemberCount === 55 &&
    m1.summary?.machineFoundationReady === true &&
    m1.summary?.m0ExitReady === false &&
    m1.summary?.ownerDecisionReceiptCount === 4 &&
    m1.summary?.ownerDecisionM0SatisfiedCount === 2 &&
    m1.summary?.ownerAttestedNamedRoleSlotCount === 12 &&
    m1.summary?.weeklyCapacityCommitmentCount === 12 &&
    m1.summary?.capacityFloorSatisfiedRoleSlotCount === 0 &&
    m1.summary?.effectiveBackupCoverageCount === 0 &&
    m1.summary?.requiredEffectiveBackupCoverageCount === 6 &&
    m1.summary?.budgetGateApprovedCount === 0 &&
    m1.summary?.budgetGateCount === 3 &&
    m1.summary?.sourceStaticEngineeringCandidateCount === 52 &&
    m1.summary?.rendererSelectedCount === 52 &&
    m1.summary?.routeDeclaredCount === 52 &&
    m1.summary?.implementationStartedCount === 52 &&
    m1.summary?.implementationAuthorizedCount === 0 &&
    m1.summary?.strictCompleteCount === 0 &&
    m1.summary?.publishedCount === 0,
    "G5 L4 M1 machine-foundation state drifted",
  );
  const containment = inputs.containment.document;
  invariant(
    containment?.releaseId === RELEASE_ID && containment.summary?.releaseMemberCount === 55 &&
    containment.summary.containmentControlsSpecified === 8 && containment.summary.containmentMechanismsSelected === 8 &&
    containment.summary.containmentCandidateImplementationsPresent === 8 && containment.summary.containmentOfflineOrDiagnosticVerified === 8 &&
    containment.summary.containmentOwnerTechnicalApprovals === 0 && containment.summary.containmentLiveSessionVerified === 0 &&
    containment.summary.containmentControlsApproved === 0 && containment.summary.containmentControlsVerified === 0 &&
    containment.summary.originalRuntimeSessionsExecuted === 0 && containment.executionGate?.runnable === false &&
    containment.executionGate?.originalRuntimeExecutionReady === false && containment.containmentPlan?.controls?.length === 8 &&
    containment.containmentPlan.controls.every((control, index) => control.controlId === `CR-${String(index + 1).padStart(2, "0")}` && typeof control.selectedMechanism === "string" && control.selectedMechanism.length > 10 && control.candidateImplementationPresent === true && control.offlineOrDiagnosticVerified === true && control.ownerTechnicalApprovalEstablished === false && control.liveSessionVerified === false && control.approved === false && control.verified === false) &&
    containment.containmentPlan.exactHostIdentifier === null && containment.containmentPlan.launchCommand === null && containment.containmentPlan.launchPath === null,
    "G5 L4 containment boundary drifted",
  );
  const declarations = inputs.sourceGap.document?.keytermGap?.declarations || [];
  invariant(
    inputs.sourceGap.document?.releaseId === RELEASE_ID && declarations.length === 2 &&
    declarations[0].path.endsWith("L4KTE01.xml") && declarations[0].language === "english" && declarations[0].physicalPresence === false && declarations[0].exactCatalogMatches.length === 0 &&
    declarations[1].path.endsWith("L4KTS01.xml") && declarations[1].language === "spanish" && declarations[1].physicalPresence === false && declarations[1].exactCatalogMatches.length === 0,
    "G5 L4 source-gap boundary drifted",
  );
  const workspace = inputs.workspaceReadiness.document;
  invariant(workspace?.releaseId === RELEASE_ID && workspace.summary?.expectedWorkspaceCount === 55 && workspace.summary.presentWorkspaceCount === 55 && workspace.summary.strictCompleteCount === 0 && workspace.summary.publishedCount === 0, "G5 L4 workspace boundary drifted");
  return {
    release,
    ledger,
    m0,
    m1,
    containment,
    declarations,
    ownerWorkAuthorization,
  };
}

function blankDecision(recordedDecision) {
  return {
    decisionId: recordedDecision.decisionId,
    repositoryDirectiveRecorded: true,
    m0RequirementSatisfied: recordedDecision.m0RequirementSatisfied,
    externalActionRequired: !recordedDecision.m0RequirementSatisfied,
    externalDecision: null,
    externalRationale: null,
    externalApproverIdentity: null,
    externalSignedAt: null,
    externalReceiptOpaqueId: null,
    importedIntoRepository: false,
  };
}

function blankRole(role, slot) {
  const floor = slot === "primary" ? role.primary : role.backup;
  return {
    roleId: role.roleId,
    slot,
    roadmapMinimumHoursPerWeek: floor,
    ownerMustSetHoursFloor: slot === "backup" && floor === null,
    repositoryUserAttestedIntentRecorded: true,
    repositoryIntentHoursPerWeek: 1,
    repositoryCapacityFloorSatisfied: false,
    repositoryEffectiveBackupCoverageEstablished: slot === "backup" ? false : null,
    externalAssigneeFullName: null,
    externalCommittedHoursPerWeek: null,
    externalAssignmentApprover: null,
    externalSignedAt: null,
    externalReceiptOpaqueId: null,
    importedIntoRepository: false,
  };
}

function blankEffects() {
  return Object.fromEntries(ACCEPTANCE_KEYS.map((key) => [key, false]));
}

function withoutFingerprint(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  return copy;
}

export function validateOwnerActionPacket(report) {
  exactKeys(report, [
    "acceptanceEffects", "authority", "budgetProcurementTemplate", "currentRepositoryState",
    "evidenceState", "externalHandlingBoundary", "generator", "orderedExternalActions",
    "ownerDecisionTemplate", "release", "releaseId", "reportFingerprintSha256", "reportType",
    "runtimeContainmentTemplate", "schemaVersion", "sourceBindings", "sourceGapDispositionTemplate",
    "staffingCapacityTemplate", "summary", "ownerWorkAuthorization",
  ], "packet");
  invariant(report?.schemaVersion === 1 && report.reportType === "g5-l4-unsigned-owner-action-packet" && report.releaseId === RELEASE_ID && report.evidenceState === "machine-prepared-public-safe-blank-external-action-template-only" && report.authority === AUTHORITY, "packet identity drifted");
  exactKeys(report.generator, ["bytes", "path", "sha256"], "generator");
  invariant(report.generator.path === "scripts/build-g5-l4-owner-action-packet.mjs" &&
    Number.isSafeInteger(report.generator.bytes) && report.generator.bytes > 0 &&
    SHA256.test(report.generator.sha256), "generator descriptor drifted");
  exactKeys(report.sourceBindings, Object.keys(INPUTS), "source bindings");
  for (const [key, expectedPath] of Object.entries(INPUTS)) {
    exactKeys(report.sourceBindings[key], ["bytes", "path", "sha256"], `source binding ${key}`);
    invariant(report.sourceBindings[key].path === expectedPath &&
      Number.isSafeInteger(report.sourceBindings[key].bytes) && report.sourceBindings[key].bytes > 0 &&
      SHA256.test(report.sourceBindings[key].sha256), `source binding ${key} drifted`);
  }
  validateG5L4PublicSafeOwnerWorkAuthorizationProjection(
    report.ownerWorkAuthorization,
    report.sourceBindings.ownerWorkAuthorization,
  );
  exactKeys(report.release, [
    "activeXmlPages", "atomicGateOpen", "courseShells", "grade", "lesson", "members",
    "pairedFlaSwfMembers", "publicationMode", "published", "releaseFingerprintSha256",
    "strictCompleteCount", "swfOnlyMembers", "titleDisplay",
  ], "release");
  invariant(report.release?.titleDisplay === "Number Lines" &&
    report.release.grade === 5 &&
    report.release.lesson === 4 &&
    report.release.activeXmlPages === 54 &&
    report.release.courseShells === 1 &&
    report.release.members === 55 &&
    report.release.pairedFlaSwfMembers === 44 &&
    report.release.swfOnlyMembers === 11 &&
    report.release.publicationMode === "atomic" &&
    report.release.releaseFingerprintSha256 === RELEASE_FINGERPRINT_SHA256 &&
    report.release.strictCompleteCount === 0 &&
    report.release.published === false &&
    report.release.atomicGateOpen === false, "release boundary drifted");
  exactKeys(report.currentRepositoryState, [
    "budgetGatesApproved", "capacityFloorsSatisfied", "effectiveBackupCoverageCount",
    "implementationAuthorizedCount", "implementationStartedCount", "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized",
    "m0ExitReady", "m0RequirementsSatisfied", "m1MachineFoundationReady",
    "m1MachinePreparationAuthorized", "ownerDirectivesRecorded",
    "roleSlotIntentsAtOneHourPerWeek", "sourceStaticEngineeringCandidateCount",
    "userAttestedRoleSlotIntentCount",
  ], "current repository state");
  invariant(
    report.currentRepositoryState?.ownerDirectivesRecorded === 4 &&
    report.currentRepositoryState?.m0RequirementsSatisfied === 2 &&
    report.currentRepositoryState?.m0ExitReady === false &&
    report.currentRepositoryState?.m1MachinePreparationAuthorized === true &&
    report.currentRepositoryState?.m1MachineFoundationReady === true &&
    report.currentRepositoryState?.sourceStaticEngineeringCandidateCount === 52 &&
    report.currentRepositoryState?.implementationStartedCount === 52 &&
    report.currentRepositoryState?.implementationWorkAuthorized === true &&
    report.currentRepositoryState?.runtimeExecutionWorkAuthorized === true &&
    report.currentRepositoryState?.implementationAuthorizedCount === 0 &&
    report.currentRepositoryState?.userAttestedRoleSlotIntentCount === 12 &&
    report.currentRepositoryState?.roleSlotIntentsAtOneHourPerWeek === 12 &&
    report.currentRepositoryState?.capacityFloorsSatisfied === 0 &&
    report.currentRepositoryState?.effectiveBackupCoverageCount === 0 &&
    report.currentRepositoryState?.budgetGatesApproved === 0,
    "current repository governance state drifted",
  );
  invariant(
    report.ownerDecisionTemplate?.length === 4 &&
    report.ownerDecisionTemplate.every((item, index) => {
      exactKeys(item, [
        "decisionId", "externalActionRequired", "externalApproverIdentity", "externalDecision",
        "externalRationale", "externalReceiptOpaqueId", "externalSignedAt", "importedIntoRepository",
        "m0RequirementSatisfied", "repositoryDirectiveRecorded",
      ], `decision ${index}`);
      return item.decisionId === DECISIONS[index] &&
        item.repositoryDirectiveRecorded === true &&
        item.m0RequirementSatisfied === (index < 2) &&
        item.externalActionRequired === (index >= 2) &&
        item.externalDecision === null &&
        item.externalRationale === null &&
        item.externalApproverIdentity === null &&
        item.externalSignedAt === null &&
        item.externalReceiptOpaqueId === null &&
        item.importedIntoRepository === false;
    }),
    "decision template was filled, rolled back, or promoted",
  );
  exactKeys(report.summary, [
    "implementationAuthorizedCount", "implementationStartedCount",
    "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized", "ownerWorkAuthorizationReceiptCount",
    "m0RequirementSatisfiedCount", "missingDeclaredDependencyCount", "originalRuntimeSessionCount",
    "ownerDirectiveRecordedCount", "ownerPendingBackupHourFloorCount", "pendingBudgetGateCount",
    "pendingContainmentControlCount", "pendingM0RequirementCount", "publicationCount",
    "requiredNamedRoleSlotCount", "requiredPrimaryHoursPerWeekFloorTotal", "requiredRoleCount",
    "sourceStaticEngineeringCandidateCount", "specifiedBackupHoursPerWeekFloorTotal",
    "strictCompleteCount",
  ], "summary");
  invariant(report.summary.ownerDirectiveRecordedCount === 4 &&
    report.summary.m0RequirementSatisfiedCount === 2 &&
    report.summary.pendingM0RequirementCount === 2 &&
    report.summary.requiredRoleCount === 6 &&
    report.summary.requiredNamedRoleSlotCount === 12 &&
    report.summary.requiredPrimaryHoursPerWeekFloorTotal === 56 &&
    report.summary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
    report.summary.ownerPendingBackupHourFloorCount === 5 &&
    report.summary.pendingBudgetGateCount === 3 &&
    report.summary.pendingContainmentControlCount === 8 &&
    report.summary.missingDeclaredDependencyCount === 2 &&
    report.summary.originalRuntimeSessionCount === 0 &&
    report.summary.sourceStaticEngineeringCandidateCount === 52 &&
    report.summary.implementationStartedCount === 52 &&
    report.summary.implementationWorkAuthorized === true &&
    report.summary.runtimeExecutionWorkAuthorized === true &&
    report.summary.ownerWorkAuthorizationReceiptCount === 1 &&
    report.summary.implementationAuthorizedCount === 0 &&
    report.summary.strictCompleteCount === 0 &&
    report.summary.publicationCount === 0, "summary drifted");
  exactKeys(report.staffingCapacityTemplate, [
    "ownerMustSetBackupFloorCount", "roadmapPrimaryFloorHoursPerWeekTotal",
    "roadmapSpecifiedBackupFloorHoursPerWeekTotal", "roleSlots",
  ], "staffing template");
  invariant(report.staffingCapacityTemplate.roadmapPrimaryFloorHoursPerWeekTotal === 56 &&
    report.staffingCapacityTemplate.roadmapSpecifiedBackupFloorHoursPerWeekTotal === 8 &&
    report.staffingCapacityTemplate.ownerMustSetBackupFloorCount === 5, "staffing totals drifted");
  invariant(report.staffingCapacityTemplate?.roleSlots?.length === 12 && report.staffingCapacityTemplate.roleSlots.every((item, index) => {
    exactKeys(item, [
      "externalAssigneeFullName", "externalAssignmentApprover", "externalCommittedHoursPerWeek",
      "externalReceiptOpaqueId", "externalSignedAt", "importedIntoRepository",
      "ownerMustSetHoursFloor", "repositoryCapacityFloorSatisfied",
      "repositoryEffectiveBackupCoverageEstablished", "repositoryIntentHoursPerWeek",
      "repositoryUserAttestedIntentRecorded", "roadmapMinimumHoursPerWeek", "roleId", "slot",
    ], `role slot ${index}`);
    const role = ROLES[Math.floor(index / 2)];
    const slot = index % 2 ? "backup" : "primary";
    const expectedFloor = slot === "primary" ? role.primary : role.backup;
    return item.roleId === role.roleId && item.slot === slot &&
      item.roadmapMinimumHoursPerWeek === expectedFloor &&
      item.ownerMustSetHoursFloor === (slot === "backup" && expectedFloor === null) &&
      item.repositoryUserAttestedIntentRecorded === true &&
      item.repositoryIntentHoursPerWeek === 1 &&
      item.repositoryCapacityFloorSatisfied === false &&
      item.repositoryEffectiveBackupCoverageEstablished === (slot === "backup" ? false : null) &&
      item.externalAssigneeFullName === null && item.externalCommittedHoursPerWeek === null &&
      item.externalAssignmentApprover === null && item.externalSignedAt === null &&
      item.externalReceiptOpaqueId === null && item.importedIntoRepository === false;
  }), "staffing template was filled or promoted");
  exactKeys(report.budgetProcurementTemplate, [
    "currency", "externalApprovalDecision", "externalApproverIdentity",
    "externalReceiptOpaqueId", "externalSignedAt", "importedIntoRepository",
    "personnelRateCeilingUsdPerHour", "procurementPaymentCycle", "totalBudgetEnvelopeUsd",
  ], "budget template");
  invariant(report.budgetProcurementTemplate?.personnelRateCeilingUsdPerHour === null &&
    report.budgetProcurementTemplate.totalBudgetEnvelopeUsd === null &&
    report.budgetProcurementTemplate.procurementPaymentCycle === null &&
    report.budgetProcurementTemplate.externalApprovalDecision === null &&
    report.budgetProcurementTemplate.externalApproverIdentity === null &&
    report.budgetProcurementTemplate.externalSignedAt === null &&
    report.budgetProcurementTemplate.externalReceiptOpaqueId === null &&
    report.budgetProcurementTemplate.importedIntoRepository === false, "budget template was filled or promoted");
  invariant(report.budgetProcurementTemplate.currency === "USD", "budget currency drifted");
  exactKeys(report.sourceGapDispositionTemplate, ["instruction", "targets"], "source-gap template");
  invariant(report.sourceGapDispositionTemplate.instruction === SOURCE_GAP_INSTRUCTION &&
    report.sourceGapDispositionTemplate?.targets?.length === 2 && report.sourceGapDispositionTemplate.targets.every((item, index) => {
      exactKeys(item, [
        "basename", "exactCandidateCount", "externalDisposition",
        "externalReviewedExceptionReceiptOpaqueId", "importAuthorized", "language",
      ], `source-gap target ${index}`);
      return item.basename === (index === 0 ? "L4KTE01.xml" : "L4KTS01.xml") &&
        item.language === (index === 0 ? "english" : "spanish") &&
        item.exactCandidateCount === 0 &&
        item.externalDisposition === null &&
        item.externalReviewedExceptionReceiptOpaqueId === null &&
        item.importAuthorized === false;
    }), "source-gap template was filled or promoted");
  exactKeys(report.runtimeContainmentTemplate, [
    "controls", "exactHostIdentifier", "launchCommand", "launchPath", "namedRuntimeOperator",
    "ownerExecutionAuthorization", "readOnlyLessonTreePath", "runnable", "runtimeProfilePath",
    "stopConditions",
  ], "runtime template");
  invariant(report.runtimeContainmentTemplate?.runnable === false && report.runtimeContainmentTemplate.exactHostIdentifier === null && report.runtimeContainmentTemplate.namedRuntimeOperator === null && report.runtimeContainmentTemplate.ownerExecutionAuthorization === null && report.runtimeContainmentTemplate.launchPath === null && report.runtimeContainmentTemplate.launchCommand === null && report.runtimeContainmentTemplate.readOnlyLessonTreePath === null && report.runtimeContainmentTemplate.runtimeProfilePath === null && report.runtimeContainmentTemplate.stopConditions.length === 0 && report.runtimeContainmentTemplate.controls.length === 8 && report.runtimeContainmentTemplate.controls.every((item, index) => {
    exactKeys(item, [
      "controlId", "externalApproval", "externalReceiptOpaqueId", "externalVerification",
      "requirement", "selectedMechanism",
    ], `runtime control ${index}`);
    return item.controlId === `CR-${String(index + 1).padStart(2, "0")}` &&
      item.requirement === CONTROL_REQUIREMENTS[index] &&
      typeof item.selectedMechanism === "string" && item.selectedMechanism.length > 10 && item.externalApproval === null &&
      item.externalVerification === null && item.externalReceiptOpaqueId === null;
  }), "runtime template was filled or made runnable");
  exactKeys(report.acceptanceEffects, ACCEPTANCE_KEYS, "acceptance effects");
  invariant(Object.keys(report.acceptanceEffects || {}).length === ACCEPTANCE_KEYS.length && ACCEPTANCE_KEYS.every((key) => report.acceptanceEffects[key] === false), "packet changed an acceptance gate");
  exactKeys(report.externalHandlingBoundary, [
    "automationMaySignOrAttest", "copyOutsideRepositoryBeforeFilling", "fillThisRepositoryReport",
    "personalDataAllowedInThisReport", "returnToGit", "signedDocumentBytesAllowedInGit",
  ], "external handling boundary");
  invariant(report.externalHandlingBoundary?.copyOutsideRepositoryBeforeFilling === true && report.externalHandlingBoundary.fillThisRepositoryReport === false && report.externalHandlingBoundary.personalDataAllowedInThisReport === false && report.externalHandlingBoundary.signedDocumentBytesAllowedInGit === false && report.externalHandlingBoundary.automationMaySignOrAttest === false && report.externalHandlingBoundary.returnToGit === RETURN_TO_GIT, "external handling boundary drifted");
  invariant(Array.isArray(report.orderedExternalActions) &&
    report.orderedExternalActions.length === ORDERED_EXTERNAL_ACTIONS.length &&
    report.orderedExternalActions.every((item, index) => item === ORDERED_EXTERNAL_ACTIONS[index]),
  "ordered external actions drifted");
  const serialized = JSON.stringify(report);
  invariant(!/Dr\. Peter Hu|\/Users\/|\/Volumes\/|file:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), "packet exposes an identity, private path, or contact identifier");
  invariant(report.reportFingerprintSha256 === sha256(stableJson(withoutFingerprint(report))), "packet fingerprint is invalid");
  return report;
}

export async function buildOwnerActionPacket() {
  const inputs = Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, file]) => [key, await readBinding(file, {json: key !== "roadmap"})])));
  const {
    release,
    ledger,
    m0,
    m1,
    containment,
    declarations,
    ownerWorkAuthorization,
  } = validateInputs(inputs);
  const base = {
    schemaVersion: 1,
    reportType: "g5-l4-unsigned-owner-action-packet",
    releaseId: RELEASE_ID,
    evidenceState: "machine-prepared-public-safe-blank-external-action-template-only",
    authority: AUTHORITY,
    generator: descriptor(await readBinding("scripts/build-g5-l4-owner-action-packet.mjs", {json: false})),
    sourceBindings: Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, descriptor(value)])),
    ownerWorkAuthorization,
    release: {titleDisplay: release.titleDisplay, grade: 5, lesson: 4, activeXmlPages: 54, courseShells: 1, members: 55, pairedFlaSwfMembers: 44, swfOnlyMembers: 11, publicationMode: "atomic", releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256, strictCompleteCount: ledger.strictCompleteCount, published: ledger.published, atomicGateOpen: ledger.gate.open},
    currentRepositoryState: {
      ownerDirectivesRecorded: m0.summary.ownerDecisionReceiptCount,
      m0RequirementsSatisfied: m0.summary.ownerDecisionM0SatisfiedCount,
      m0ExitReady: m0.summary.m0ExitReady,
      m1MachinePreparationAuthorized: m0.summary.m1StartAuthorized,
      m1MachineFoundationReady: m1.summary.machineFoundationReady,
      sourceStaticEngineeringCandidateCount: m1.summary.sourceStaticEngineeringCandidateCount,
      implementationStartedCount: m1.summary.implementationStartedCount,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      implementationAuthorizedCount: m1.summary.implementationAuthorizedCount,
      userAttestedRoleSlotIntentCount: m0.summary.ownerAttestedNamedRoleAssignmentCount,
      roleSlotIntentsAtOneHourPerWeek: m0.roleSlots.filter((item) => item.committedHoursPerWeek === 1).length,
      capacityFloorsSatisfied: m0.summary.capacityFloorSatisfiedCount,
      effectiveBackupCoverageCount: m0.summary.effectiveBackupCoverageCount,
      budgetGatesApproved: m0.summary.budgetGateApprovedCount,
    },
    summary: {ownerDirectiveRecordedCount: 4, m0RequirementSatisfiedCount: 2, pendingM0RequirementCount: 2, requiredRoleCount: 6, requiredNamedRoleSlotCount: 12, requiredPrimaryHoursPerWeekFloorTotal: 56, specifiedBackupHoursPerWeekFloorTotal: 8, ownerPendingBackupHourFloorCount: 5, pendingBudgetGateCount: 3, pendingContainmentControlCount: 8, missingDeclaredDependencyCount: 2, originalRuntimeSessionCount: containment.summary.originalRuntimeSessionsExecuted, sourceStaticEngineeringCandidateCount: m1.summary.sourceStaticEngineeringCandidateCount, implementationStartedCount: m1.summary.implementationStartedCount, implementationWorkAuthorized: true, runtimeExecutionWorkAuthorized: true, ownerWorkAuthorizationReceiptCount: 1, implementationAuthorizedCount: m1.summary.implementationAuthorizedCount, strictCompleteCount: ledger.strictCompleteCount, publicationCount: 0},
    ownerDecisionTemplate: m0.ownerDecisions.map(blankDecision),
    staffingCapacityTemplate: {roadmapPrimaryFloorHoursPerWeekTotal: 56, roadmapSpecifiedBackupFloorHoursPerWeekTotal: 8, ownerMustSetBackupFloorCount: 5, roleSlots: ROLES.flatMap((role) => [blankRole(role, "primary"), blankRole(role, "backup")])},
    budgetProcurementTemplate: {
      currency: "USD",
      personnelRateCeilingUsdPerHour: null,
      totalBudgetEnvelopeUsd: null,
      procurementPaymentCycle: null,
      externalApprovalDecision: null,
      externalApproverIdentity: null,
      externalSignedAt: null,
      externalReceiptOpaqueId: null,
      importedIntoRepository: false,
    },
    sourceGapDispositionTemplate: {instruction: SOURCE_GAP_INSTRUCTION, targets: declarations.map((item) => ({basename: path.posix.basename(item.path), language: item.language, exactCandidateCount: item.exactCatalogMatches.length, externalDisposition: null, externalReviewedExceptionReceiptOpaqueId: null, importAuthorized: false}))},
    runtimeContainmentTemplate: {exactHostIdentifier: null, namedRuntimeOperator: null, ownerExecutionAuthorization: null, launchPath: null, launchCommand: null, readOnlyLessonTreePath: null, runtimeProfilePath: null, stopConditions: [], controls: containment.containmentPlan.controls.map((item) => ({controlId: item.controlId, requirement: item.requirement, selectedMechanism: item.selectedMechanism, externalApproval: null, externalVerification: null, externalReceiptOpaqueId: null})), runnable: false},
    externalHandlingBoundary: {copyOutsideRepositoryBeforeFilling: true, fillThisRepositoryReport: false, personalDataAllowedInThisReport: false, signedDocumentBytesAllowedInGit: false, automationMaySignOrAttest: false, returnToGit: RETURN_TO_GIT},
    orderedExternalActions: [...ORDERED_EXTERNAL_ACTIONS],
    acceptanceEffects: blankEffects(),
  };
  return validateOwnerActionPacket({...base, reportFingerprintSha256: sha256(stableJson(base))});
}

export function renderOwnerActionMarkdown(report) {
  validateOwnerActionPacket(report);
  const roles = report.staffingCapacityTemplate.roleSlots.map((slot) =>
    `| \`${slot.roleId}\` | ${slot.slot} | ${slot.roadmapMinimumHoursPerWeek ?? "Owner must set externally"} | user-attested 1 h/week intent; floor not met${slot.slot === "backup" ? "; not effective backup" : ""} |`).join("\n");
  const escapeCell = (value) => value.replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", " ");
  const controls = report.runtimeContainmentTemplate.controls.map((item) => `| \`${item.controlId}\` | ${escapeCell(item.requirement)} | ${escapeCell(item.selectedMechanism)} | machine candidate selected / external approval pending / live verification pending |`).join("\n");
  const decisions = report.ownerDecisionTemplate.map((item, index) =>
    `${index + 1}. \`${item.decisionId}\` — ${item.m0RequirementSatisfied ? "directive recorded; M0 requirement satisfied" : "directive recorded; concrete capacity/budget requirement still unsatisfied"}`).join("\n");
  return `# G5 L4 Owner Action Packet — unsigned template\n\n> ${report.authority}\n\nRelease: \`${report.releaseId}\` — **${report.release.titleDisplay}**\n\n- Scope: **54 pages + Shell = 55 members**; 44 FLA+SWF and 11 SWF-only.\n- Original-runtime sessions / strict / published: **0 / 0 / false**.\n- Current governance: **4/4 Owner directives recorded; 2/4 M0 requirements satisfied; M0 exit closed; M1 machine preparation authorized**.\n\n## External handling\n\nCopy this blank worksheet outside the repository before filling it. Do not enter names, signatures, rates, budgets, host details, credentials, or signed document bytes here.\n\n## Four recorded Owner directives\n\n${decisions}\n\nThe blank fields below request only the concrete capacity, budget, source/runtime, and independent-review evidence still missing. They do not roll back or duplicate the two already-satisfied M0 decisions.\n\n## Twelve named role slots\n\n| Role | Slot | Roadmap floor hours/week | State |\n|---|---|---:|---|\n${roles}\n\n## Budget and procurement\n\nAll rate, budget, and procurement fields are blank and require external approval.\n\n## Missing declared dependencies\n\nBoth \`L4KTE01.xml\` and \`L4KTS01.xml\` have 0 exact candidates. ${SOURCE_GAP_INSTRUCTION}\n\n## Runtime containment\n\n| Control | Requirement | Machine-selected candidate | External approval/live state |\n|---|---|---|---|\n${controls}\n\nThe exact host, operator, launch path/command, read-only tree, runtime profile, stop conditions, and execution authorization are blank. This packet contains no runnable artifact and grants no execution authority.\n\n## Fail-closed result\n\nCurrent M0 exit remains false while M1 machine preparation remains authorized. This packet itself changes no authorization or acceptance gate; runtime execution, implementation authorization, audio review, independent human review, Owner fidelity acceptance, strict completion, and publication remain false.\n`;
}

async function replaceOutputPair(entries) {
  const transactionId = `${process.pid}.${randomUUID()}`;
  const states = [];
  let committed = false;
  try {
    for (const [relativePath, contents] of entries) {
      const output = projectPath(relativePath);
      await assertNoSymlinkComponents(path.posix.dirname(relativePath), {finalType: "directory"});
      const existing = await lstat(output).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (existing) invariant(existing.isFile() && !existing.isSymbolicLink() && existing.nlink === 1,
        `${relativePath}: existing output must be one ordinary file`);
      const temporary = path.join(path.dirname(output), `.${path.basename(output)}.${transactionId}.tmp`);
      const backup = path.join(path.dirname(output), `.${path.basename(output)}.${transactionId}.bak`);
      await writeFile(temporary, contents, {encoding: "utf8", flag: "wx", mode: 0o644});
      states.push({output, temporary, backup, hadExisting: Boolean(existing), backedUp: false, installed: false});
    }
    for (const state of states) {
      if (state.hadExisting) {
        await rename(state.output, state.backup);
        state.backedUp = true;
      }
    }
    for (const state of states) {
      await rename(state.temporary, state.output);
      state.installed = true;
    }
    committed = true;
    await Promise.all(states.filter((state) => state.backedUp).map((state) => unlink(state.backup)));
  } catch (error) {
    if (!committed) {
      for (const state of [...states].reverse()) {
        if (state.installed) await unlink(state.output).catch(() => {});
        if (state.backedUp) await rename(state.backup, state.output).catch(() => {});
      }
    }
    throw error;
  } finally {
    await Promise.all(states.flatMap((state) => [
      unlink(state.temporary).catch(() => {}),
      unlink(state.backup).catch(() => {}),
    ]));
  }
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const arg of argv) {
    if (arg === "--check") options.check = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/build-g5-l4-owner-action-packet.mjs [--check]\n");
    return;
  }
  const report = await buildOwnerActionPacket();
  const json = stableJson(report);
  const markdown = renderOwnerActionMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readBinding(JSON_OUTPUT, {json: false}),
      readBinding(MARKDOWN_OUTPUT, {json: false}),
    ]);
    invariant(currentJson.contents === json, "JSON output is stale");
    invariant(currentMarkdown.contents === markdown, "Markdown output is stale");
    process.stdout.write("PASS: G5 L4 public-safe blank Owner action packet; runtime/acceptance false\n");
  } else {
    await replaceOutputPair([[JSON_OUTPUT, json], [MARKDOWN_OUTPUT, markdown]]);
    process.stdout.write("WROTE: G5 L4 public-safe blank Owner action packet\n");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) main().catch((error) => { process.stderr.write(`Error: ${error.message}\n`); process.exitCode = 1; });
