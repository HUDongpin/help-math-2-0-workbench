#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const DEFAULT_JSON = "reports/g5-l5-owner-action-packet.json";
const DEFAULT_MARKDOWN = "reports/g5-l5-owner-action-packet.md";

const INPUTS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  releaseLedger: "catalog/lesson-release-ledger.json",
  governanceProfile: "catalog/g5-l5-m0-m1-governance-profile.json",
  m0Readiness: "reports/g5-l5-m0-governance-readiness.json",
  m1Readiness: "reports/g5-l5-m1-machine-foundation-readiness.json",
  containmentReadiness:
    "reports/g5-l5-original-runtime-containment-readiness.json",
  missingKeytermReadiness:
    "reports/g5-l5-missing-keyterm-recovery-readiness.json",
  specificationReadiness: "reports/g5-l5-specification-readiness.json",
  roadmap:
    "outputs/help-math-2-product-deployment-district-pilot-roadmap-2026-2027.zh.md",
});

const AUTHORIZATION_INPUT_KEYS = Object.freeze([
  "m0OwnerSignoffReceipt",
  "m1MachineFoundationStartAuthorizationReceipt",
  "namedOriginalRuntimeOperatorAssignmentReceipt",
  "staffingCapacityReceipt",
  "budgetAndProcurementReceipt",
  "runtimeHostAndContainmentExecutionReceipt",
  "promotionAndPublicationAuthorizationReceipt",
]);

const AUTHORITY =
  "This report is a public-safe blank worksheet generated from current repository evidence. It is not an authorization, assignment, signature, attestation, budget approval, runtime permission, fidelity decision, or release receipt.";

const SOURCE_GAP_INSTRUCTION =
  "Externally decide whether to recover and hash-bind each missing declared XML dependency or approve a validator-supported reviewed exception. Do not invent bilingual keyterm content.";

const RETURN_TO_GIT =
  "Only a separately reviewed, public-safe receipt index with opaque document ID, exact hash, scope, date, and authority boundary may be imported. Keep names, signatures, contracts, rates, detailed budgets, host secrets, and signed document bytes in the approved encrypted external system.";

const DECISION_IDS = Object.freeze([
  "release-membership-and-exclusions-review",
  "source-gap-and-missing-dependency-dispositions-review",
  "staffing-capacity-and-backups-review",
  "rates-budget-envelope-and-procurement-cycle-review",
  "m1-machine-foundation-start-authorization",
  "promotion-security-and-atomic-publication-authorization",
]);

const ROLE_FLOORS = Object.freeze([
  {
    roleId: "authorized-original-runtime-operator",
    primary: 20,
    backup: 8,
  },
  {roleId: "mathematics-reviewer", primary: 8, backup: null},
  {roleId: "spanish-reviewer", primary: 8, backup: null},
  {roleId: "audio-reviewer", primary: 8, backup: null},
  {roleId: "independent-visual-reviewer", primary: 8, backup: null},
  {roleId: "owner-approver", primary: 4, backup: null},
  {roleId: "product-accessibility-reviewer", primary: 8, backup: null},
]);

const KEYTERM_TARGETS = Object.freeze([
  {basename: "L5KTE01.xml", language: "english"},
  {basename: "L5KTS01.xml", language: "spanish"},
]);

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
  "Review and externally decide the exact 56-page plus Shell membership and exclusions.",
  "Choose an externally reviewed disposition for both missing KeyTerm XML dependencies.",
  "Name seven primary and seven backup people, set the six unspecified backup hour floors, and commit capacity against the roadmap minimums.",
  "Approve rate ceilings, total budget envelope, and procurement cycle in the external system.",
  "Record a separate M0 decision and M1-start authorization; neither one authorizes original-runtime execution by implication.",
  "Select, approve, and verify CR-01 through CR-08; bind the exact host, operator, launch path, read-only tree, disposable profile, and stop conditions in a separate immutable session authorization.",
  "Only after authoritative runtime/specification gates close may implementation, RMSE, audio listening, independent review, Owner fidelity acceptance, strict validation, and atomic publication proceed.",
]);

const ACCEPTANCE_KEYS = Object.freeze([
  "authoritativeOriginalRuntime",
  "authoringAccepted",
  "audioAccepted",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "humanVisualAccepted",
  "implementationAuthorized",
  "m0Exit",
  "m1StartAuthorized",
  "ownerAccepted",
  "published",
  "strictComplete",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function hasExactKeys(value, expectedKeys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") ===
      [...expectedKeys].sort().join("\0")
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function projectPath(
  relativePath,
  label = relativePath,
  root = projectRoot,
) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolute = path.resolve(root, relativePath);
  const normalized = path.relative(root, absolute).split(path.sep).join("/");
  invariant(
    normalized === relativePath &&
      normalized !== ".." &&
      !normalized.startsWith("../"),
    `${label}: path escapes or is not normalized`,
  );
  return absolute;
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative));
}

async function ensureContainedOrdinaryDirectoryTree(
  root,
  targetDirectory,
  label,
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
    const state = await lstat(current);
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

function reportOutputPath(relativePath, label, extension) {
  const absolute = projectPath(relativePath, label);
  invariant(
    path.posix.dirname(relativePath) === "reports" &&
      path.posix.basename(relativePath).startsWith(
        "g5-l5-owner-action-packet",
      ) &&
      relativePath.endsWith(extension),
    `${label}: output must be a g5-l5-owner-action-packet ${extension} file below reports`,
  );
  return absolute;
}

export async function readBinding(
  relativePath,
  {json = true, root = projectRoot} = {},
) {
  const absolute = projectPath(relativePath, relativePath, root);
  const rootReal = await ensureContainedOrdinaryDirectoryTree(
    root,
    path.dirname(absolute),
    relativePath,
  );
  const before = await lstat(absolute);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${relativePath}: must be one ordinary non-linked file`,
  );
  invariant(
    isWithin(rootReal, await realpath(absolute)),
    `${relativePath}: escapes the project root`,
  );
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1 &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size &&
      isWithin(rootReal, await realpath(absolute)),
    `${relativePath}: changed while being read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${relativePath}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    document,
    text: bytes.toString("utf8"),
  };
}

export async function atomicReplaceOrdinaryFile(
  absolutePath,
  contents,
  {root = path.dirname(absolutePath)} = {},
) {
  invariant(path.isAbsolute(absolutePath), "output path must be absolute");
  const parent = path.dirname(absolutePath);
  await ensureContainedOrdinaryDirectoryTree(
    root,
    parent,
    `${absolutePath}: output`,
  );
  const temporaryPath = path.join(
    parent,
    `.${path.basename(absolutePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let temporaryExists = false;
  try {
    await writeFile(temporaryPath, contents, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    temporaryExists = true;
    await ensureContainedOrdinaryDirectoryTree(
      root,
      parent,
      `${absolutePath}: output`,
    );
    await rename(temporaryPath, absolutePath);
    temporaryExists = false;
  } finally {
    if (temporaryExists) {
      await unlink(temporaryPath).catch(() => {});
    }
  }
}

function selectRelease(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "release manifest is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release is not unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts.courseShells === 1 &&
      release.expectedCounts.members === 57 &&
      Array.isArray(release.members) &&
      release.members.length === 57 &&
      release.members.every((member, index) => member.ordinal === index + 1) &&
      new Set(release.members.map(({animationId}) => animationId)).size ===
        57 &&
      new Set(release.members.map(({assetId}) => assetId)).size === 57,
    "G5 L5 release scope drifted",
  );
  return release;
}

function selectLedgerRelease(document) {
  const matches = document?.releases?.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    matches?.length === 1 &&
      matches[0].expectedMemberCount === 57 &&
      matches[0].strictCompleteCount === 0 &&
      matches[0].missingCount === 57 &&
      matches[0].published === false &&
      matches[0].gate?.open === false,
    "G5 L5 release ledger crossed a protected gate",
  );
  return matches[0];
}

function validateGovernance(profile, m0, m1, release) {
  invariant(
    profile?.schemaVersion === 1 &&
      profile.releaseId === RELEASE_ID &&
      profile.releaseFingerprintSha256 === RELEASE_FINGERPRINT_SHA256 &&
      profile.releaseFingerprintSha256 ===
        sha256(Buffer.from(stableJson(release))) &&
      profile.roadmap?.targetStrictMembers === 57 &&
      profile.roadmap.targetAtomicRelease === true &&
      Array.isArray(profile.requiredOwnerDecisions) &&
      profile.requiredOwnerDecisions.length === 6 &&
      profile.requiredOwnerDecisions.every(
        (decision, index) =>
          hasExactKeys(decision, ["decisionId", "receipt"]) &&
          decision.decisionId === DECISION_IDS[index] &&
          decision.receipt === null,
      ),
    "G5 L5 governance decision boundary drifted",
  );
  invariant(
    Array.isArray(profile.requiredRoles) &&
      profile.requiredRoles.length === 7,
    "G5 L5 role requirements are not seven exact roles",
  );
  for (const [index, expected] of ROLE_FLOORS.entries()) {
    const role = profile.requiredRoles[index];
    invariant(
      hasExactKeys(role, [
        "roleId",
        "minimumPrimaryHoursPerWeek",
        "minimumBackupHoursPerWeek",
        "primaryAssignmentRequired",
        "backupAssignmentRequired",
        "committedPrimaryHoursPerWeek",
        "committedBackupHoursPerWeek",
        "primaryAssignmentReceipt",
        "backupAssignmentReceipt",
      ]) &&
        role.roleId === expected.roleId &&
        role.minimumPrimaryHoursPerWeek === expected.primary &&
        role.minimumBackupHoursPerWeek === expected.backup &&
        role.primaryAssignmentRequired === true &&
        role.backupAssignmentRequired === true &&
        role.committedPrimaryHoursPerWeek === null &&
        role.committedBackupHoursPerWeek === null &&
        role.primaryAssignmentReceipt === null &&
        role.backupAssignmentReceipt === null,
      `${expected.roleId}: governance role floor or blank boundary drifted`,
    );
  }
  invariant(
    hasExactKeys(profile.authorizationInputs, AUTHORIZATION_INPUT_KEYS) &&
      AUTHORIZATION_INPUT_KEYS.every(
        (key) => profile.authorizationInputs[key] === null,
      ) &&
      hasExactKeys(profile.budgetDecision, [
        "currency",
        "rateCeilingsApproved",
        "totalBudgetEnvelopeApproved",
        "procurementCycleApproved",
        "signedReceipt",
      ]) &&
      profile.budgetDecision.currency === "USD" &&
      profile.budgetDecision?.rateCeilingsApproved === false &&
      profile.budgetDecision.totalBudgetEnvelopeApproved === false &&
      profile.budgetDecision.procurementCycleApproved === false &&
      profile.budgetDecision.signedReceipt === null,
    "G5 L5 governance already contains authority or budget approval",
  );
  invariant(
    m0?.releaseId === RELEASE_ID &&
      m0.summary?.machinePacketReadyForOwnerReview === true &&
      m0.summary.m0ExitReady === false &&
      m0.summary.m1StartAuthorized === false &&
      m0.summary.requiredOwnerDecisionCount === 6 &&
      m0.summary.requiredRoleCount === 7 &&
      m0.summary.requiredNamedRoleSlotCount === 14 &&
      m0.summary.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      m0.summary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      m0.summary.rolesWithOwnerPendingBackupHourFloorCount === 6 &&
      m0.summary.namedPersonCount === 0 &&
      m0.summary.ownerDecisionReceiptCount === 0 &&
      m0.summary.namedRoleAssignmentReceiptCount === 0 &&
      m0.summary.committedHoursPerWeekTotal === 0 &&
      m0.summary.strictCompleteCount === 0 &&
      m0.summary.published === false &&
      hasExactKeys(m0.authorizationInputs, AUTHORIZATION_INPUT_KEYS) &&
      AUTHORIZATION_INPUT_KEYS.every(
        (key) => m0.authorizationInputs[key] === null,
      ) &&
      Array.isArray(m0.ownerDecisions) &&
      m0.ownerDecisions.length === 6 &&
      m0.ownerDecisions.every(
        (decision, index) =>
          decision.decisionId === DECISION_IDS[index] &&
          decision.receipt === null &&
          decision.status === "pending-owner-decision-and-external-receipt",
      ) &&
      Array.isArray(m0.roleSlots) &&
      m0.roleSlots.length === 14 &&
      m0.roleSlots.every(
        (slot) =>
          slot.assignee === null &&
          slot.committedHoursPerWeek === null &&
          slot.receipt === null &&
          slot.authorized === false,
      ) &&
      Object.values(m0.m1 || {}).every(
        (value) => value === false || value === null,
      ) &&
      Object.values(m0.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    "G5 L5 M0 report is not the exact unsigned Owner-review boundary",
  );
  invariant(
    m1?.releaseId === RELEASE_ID &&
      m1.readiness?.machineFoundationPacketCurrent === true &&
      m1.readiness.m1ExecutionReady === false &&
      m1.readiness.m1StartAuthorized === false &&
      m1.readiness.rendererImplementationReady === false &&
      m1.readiness.runtimeAcquisitionReady === false &&
      m1.readiness.promotionReady === false &&
      m1.readiness.published === false &&
      m1.readiness.strictCompleteCount === 0 &&
      m1.m0Gate?.ownerSignoffReceipt === null &&
      m1.m0Gate.ownerDecisionReceiptCount === 0 &&
      m1.m0Gate.namedRoleAssignmentReceiptCount === 0 &&
      m1.m0Gate.namedPersonCount === 0 &&
      m1.m0Gate.committedHourCommitmentCount === 0 &&
      m1.m0Gate.committedHoursPerWeekTotal === 0 &&
      m1.m0Gate.exitReady === false &&
      Object.values(m1.m1Authorization || {}).every(
        (value) => value === false || value === null,
      ) &&
      Object.values(m1.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    "G5 L5 M1 report crossed an execution or release boundary",
  );
}

function validateTechnicalBoundaries(containment, missingKeyterm, specification) {
  invariant(
    containment?.releaseId === RELEASE_ID &&
      containment.summary?.releaseMemberCount === 57 &&
      containment.summary.containmentControlsSpecified === 8 &&
      containment.summary.containmentMechanismsSelected === 0 &&
      containment.summary.containmentControlsApproved === 0 &&
      containment.summary.containmentControlsVerified === 0 &&
      containment.summary.completeReadOnlyHostTreeCount === 0 &&
      containment.summary.missingDeclaredDependencyCount === 2 &&
      containment.summary.namedOperatorCount === 0 &&
      containment.summary.originalRuntimeSessionsExecuted === 0 &&
      containment.executionGate?.runnable === false &&
      containment.executionGate.originalRuntimeExecutionReady === false &&
      Array.isArray(containment.containmentPlan?.controls) &&
      containment.containmentPlan.controls.length === 8 &&
      containment.containmentPlan.controls.every(
        (control, index) =>
          hasExactKeys(control, [
            "controlId",
            "requirement",
            "mechanism",
            "approved",
            "verified",
          ]) &&
          control.controlId ===
            `CR-${String(index + 1).padStart(2, "0")}` &&
          control.requirement === CONTROL_REQUIREMENTS[index] &&
          control.mechanism === null &&
          control.approved === false &&
          control.verified === false,
      ) &&
      containment.containmentPlan.exactHostIdentifier === null &&
      containment.containmentPlan.launchCommand === null &&
      containment.containmentPlan.launchPath === null &&
      containment.containmentPlan.ownerExecutionAuthorization === null &&
      containment.containmentPlan.readOnlyLessonTreePath === null &&
      containment.containmentPlan.runtimeProfilePath === null &&
      containment.containmentPlan.allowedOutboundDestinations.length === 0 &&
      containment.containmentPlan.legacyEndpointAllowlist.length === 0 &&
      containment.containmentPlan.stopConditions.length === 0,
    "G5 L5 containment report crossed a runtime boundary",
  );
  invariant(
    missingKeyterm?.releaseId === RELEASE_ID &&
      Array.isArray(missingKeyterm.targets) &&
      missingKeyterm.targets.length === 2 &&
      missingKeyterm.targets.every(
        (
          {
            basename,
            language,
            exactCandidateCount,
            importAuthorized,
            contentRecovered,
          },
          index,
        ) =>
          basename === KEYTERM_TARGETS[index].basename &&
          language === KEYTERM_TARGETS[index].language &&
          exactCandidateCount === 0 &&
          importAuthorized === false &&
          contentRecovered === false,
      ) &&
      missingKeyterm.acceptanceEffects?.sourceGapClosed === false,
    "G5 L5 missing-KeyTerm report claims a recovered or authorized source",
  );
  invariant(
    specification?.releaseId === RELEASE_ID &&
      specification.summary?.memberCount === 57 &&
      specification.summary.preRuntimeCandidatePackageMaterializedCount === 57 &&
      specification.summary.preRuntimeCandidateFileCount === 399 &&
      specification.summary.remainingAutomaticallyAdvanceableTaskCount === 0 &&
      specification.summary.originalRuntimeOrHumanDecisionRequiredCount === 57 &&
      specification.summary.implementationSpecificationReadyCount === 0 &&
      specification.summary.implementationAuthorizedCount === 0 &&
      specification.summary.strictCompleteCount === 0 &&
      specification.summary.publishedCount === 0,
    "G5 L5 specification report is not at the exhausted machine-only boundary",
  );
}

function nullDecisionTemplate(decisionId) {
  return {
    decisionId,
    externalDecision: null,
    externalRationale: null,
    externalApproverIdentity: null,
    externalSignedAt: null,
    externalReceiptOpaqueId: null,
    importedIntoRepository: false,
  };
}

function blankRoleSlot(role, slot) {
  const minimum =
    slot === "primary"
      ? role.minimumPrimaryHoursPerWeek
      : role.minimumBackupHoursPerWeek;
  return {
    roleId: role.roleId,
    slot,
    namedPersonRequired: true,
    roadmapMinimumHoursPerWeek: minimum,
    ownerMustSetHoursFloor: slot === "backup" && minimum === null,
    externalAssigneeFullName: null,
    externalCommittedHoursPerWeek: null,
    externalAssignmentApprover: null,
    externalSignedAt: null,
    externalReceiptOpaqueId: null,
    importedIntoRepository: false,
  };
}

function descriptor(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

function acceptanceEffects() {
  return Object.fromEntries(ACCEPTANCE_KEYS.map((key) => [key, false]));
}

function reportWithoutFingerprint(report) {
  const clone = structuredClone(report);
  delete clone.reportFingerprintSha256;
  return clone;
}

export function validateOwnerActionPacket(report) {
  invariant(
    hasExactKeys(report, [
      "schemaVersion",
      "reportType",
      "releaseId",
      "evidenceState",
      "authority",
      "generator",
      "sourceBindings",
      "release",
      "summary",
      "ownerDecisionTemplate",
      "staffingCapacityTemplate",
      "budgetProcurementTemplate",
      "sourceGapDispositionTemplate",
      "runtimeContainmentTemplate",
      "externalHandlingBoundary",
      "orderedExternalActions",
      "acceptanceEffects",
      "reportFingerprintSha256",
    ]) &&
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-unsigned-owner-action-packet" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        "machine-prepared-unsigned-external-action-template-only" &&
      report.authority === AUTHORITY,
    "Owner action packet identity drifted",
  );
  invariant(
    hasExactKeys(report.release, [
      "titleDisplay",
      "grade",
      "lesson",
      "activeXmlPages",
      "courseShells",
      "members",
      "pairedFlaSwfMembers",
      "swfOnlyMembers",
      "publicationMode",
      "releaseFingerprintSha256",
      "strictCompleteCount",
      "published",
      "atomicGateOpen",
    ]) &&
      report.release.titleDisplay === "Add & Subtract Negative Numbers" &&
      report.release.grade === 5 &&
      report.release.lesson === 5 &&
      report.release?.members === 57 &&
      report.release.activeXmlPages === 56 &&
      report.release.courseShells === 1 &&
      report.release.pairedFlaSwfMembers === 49 &&
      report.release.swfOnlyMembers === 8 &&
      report.release.publicationMode === "atomic" &&
      report.release.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256 &&
      report.release.strictCompleteCount === 0 &&
      report.release.published === false &&
      report.release.atomicGateOpen === false,
    "Owner action packet release boundary drifted",
  );
  invariant(
    hasExactKeys(report.summary, [
      "pendingOwnerDecisionCount",
      "requiredRoleCount",
      "requiredNamedRoleSlotCount",
      "requiredPrimaryHoursPerWeekFloorTotal",
      "specifiedBackupHoursPerWeekFloorTotal",
      "ownerPendingBackupHourFloorCount",
      "pendingBudgetGateCount",
      "pendingContainmentControlCount",
      "missingDeclaredDependencyCount",
      "remainingMachineOnlyTaskCount",
      "runtimeOrHumanDecisionRequiredMemberCount",
      "originalRuntimeSessionCount",
      "implementationReadyCount",
      "strictCompleteCount",
      "publicationCount",
    ]) &&
      report.summary?.pendingOwnerDecisionCount === 6 &&
      report.summary.requiredRoleCount === 7 &&
      report.summary.requiredNamedRoleSlotCount === 14 &&
      report.summary.requiredPrimaryHoursPerWeekFloorTotal === 64 &&
      report.summary.specifiedBackupHoursPerWeekFloorTotal === 8 &&
      report.summary.ownerPendingBackupHourFloorCount === 6 &&
      report.summary.pendingBudgetGateCount === 3 &&
      report.summary.pendingContainmentControlCount === 8 &&
      report.summary.missingDeclaredDependencyCount === 2 &&
      report.summary.remainingMachineOnlyTaskCount === 0 &&
      report.summary.runtimeOrHumanDecisionRequiredMemberCount === 57 &&
      report.summary.originalRuntimeSessionCount === 0 &&
      report.summary.implementationReadyCount === 0 &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.publicationCount === 0,
    "Owner action packet summary drifted",
  );
  invariant(
    Array.isArray(report.ownerDecisionTemplate) &&
      report.ownerDecisionTemplate.length === 6 &&
      report.ownerDecisionTemplate.every(
        (decision, index) =>
          hasExactKeys(decision, [
            "decisionId",
            "externalDecision",
            "externalRationale",
            "externalApproverIdentity",
            "externalSignedAt",
            "externalReceiptOpaqueId",
            "importedIntoRepository",
          ]) &&
          decision.decisionId === DECISION_IDS[index] &&
          decision.externalDecision === null &&
          decision.externalRationale === null &&
          decision.externalApproverIdentity === null &&
          decision.externalSignedAt === null &&
          decision.externalReceiptOpaqueId === null &&
          decision.importedIntoRepository === false,
      ),
    "Owner decision template was filled or promoted",
  );
  invariant(
    hasExactKeys(report.staffingCapacityTemplate, [
      "roadmapPrimaryFloorHoursPerWeekTotal",
      "roadmapSpecifiedBackupFloorHoursPerWeekTotal",
      "ownerMustSetBackupFloorCount",
      "roleSlots",
    ]) &&
      report.staffingCapacityTemplate.roadmapPrimaryFloorHoursPerWeekTotal ===
        64 &&
      report.staffingCapacityTemplate
        .roadmapSpecifiedBackupFloorHoursPerWeekTotal === 8 &&
      report.staffingCapacityTemplate.ownerMustSetBackupFloorCount === 6 &&
      Array.isArray(report.staffingCapacityTemplate?.roleSlots) &&
      report.staffingCapacityTemplate.roleSlots.length === 14 &&
      report.staffingCapacityTemplate.roleSlots.every(
        (slot, index) => {
          const expectedRole = ROLE_FLOORS[Math.floor(index / 2)];
          const expectedSlot = index % 2 === 0 ? "primary" : "backup";
          const expectedMinimum =
            expectedSlot === "primary"
              ? expectedRole.primary
              : expectedRole.backup;
          return (
            hasExactKeys(slot, [
              "roleId",
              "slot",
              "namedPersonRequired",
              "roadmapMinimumHoursPerWeek",
              "ownerMustSetHoursFloor",
              "externalAssigneeFullName",
              "externalCommittedHoursPerWeek",
              "externalAssignmentApprover",
              "externalSignedAt",
              "externalReceiptOpaqueId",
              "importedIntoRepository",
            ]) &&
            slot.roleId === expectedRole.roleId &&
            slot.slot === expectedSlot &&
            slot.namedPersonRequired === true &&
            slot.roadmapMinimumHoursPerWeek === expectedMinimum &&
            slot.ownerMustSetHoursFloor ===
              (expectedSlot === "backup" && expectedMinimum === null) &&
            slot.externalAssigneeFullName === null &&
            slot.externalCommittedHoursPerWeek === null &&
            slot.externalAssignmentApprover === null &&
            slot.externalSignedAt === null &&
            slot.externalReceiptOpaqueId === null &&
            slot.importedIntoRepository === false
          );
        },
      ),
    "staffing template was filled or promoted",
  );
  invariant(
    hasExactKeys(report.budgetProcurementTemplate, [
      "currency",
      "rateCeilingsApproved",
      "totalBudgetEnvelopeApproved",
      "procurementCycleApproved",
      "externalApproverIdentity",
      "externalSignedAt",
      "externalReceiptOpaqueId",
      "importedIntoRepository",
    ]) &&
      report.budgetProcurementTemplate?.currency === "USD" &&
      report.budgetProcurementTemplate.rateCeilingsApproved === null &&
      report.budgetProcurementTemplate.totalBudgetEnvelopeApproved === null &&
      report.budgetProcurementTemplate.procurementCycleApproved === null &&
      report.budgetProcurementTemplate.externalApproverIdentity === null &&
      report.budgetProcurementTemplate.externalSignedAt === null &&
      report.budgetProcurementTemplate.externalReceiptOpaqueId === null &&
      report.budgetProcurementTemplate.importedIntoRepository === false,
    "budget template was filled or promoted",
  );
  invariant(
    hasExactKeys(report.runtimeContainmentTemplate, [
      "exactHostIdentifier",
      "namedRuntimeOperator",
      "ownerExecutionAuthorization",
      "launchPath",
      "launchCommand",
      "readOnlyLessonTreePath",
      "runtimeProfilePath",
      "stopConditions",
      "controls",
      "runnable",
    ]) &&
      report.runtimeContainmentTemplate?.exactHostIdentifier === null &&
      report.runtimeContainmentTemplate.namedRuntimeOperator === null &&
      report.runtimeContainmentTemplate.ownerExecutionAuthorization === null &&
      report.runtimeContainmentTemplate.launchPath === null &&
      report.runtimeContainmentTemplate.launchCommand === null &&
      report.runtimeContainmentTemplate.readOnlyLessonTreePath === null &&
      report.runtimeContainmentTemplate.runtimeProfilePath === null &&
      report.runtimeContainmentTemplate.stopConditions.length === 0 &&
      report.runtimeContainmentTemplate.controls.length === 8 &&
      report.runtimeContainmentTemplate.controls.every(
        (control, index) =>
          hasExactKeys(control, [
            "controlId",
            "requirement",
            "selectedMechanism",
            "externalApproval",
            "externalVerification",
            "externalReceiptOpaqueId",
          ]) &&
          control.controlId === `CR-${String(index + 1).padStart(2, "0")}` &&
          control.requirement === CONTROL_REQUIREMENTS[index] &&
          control.selectedMechanism === null &&
          control.externalApproval === null &&
          control.externalVerification === null &&
          control.externalReceiptOpaqueId === null,
      ) &&
      report.runtimeContainmentTemplate.runnable === false,
    "runtime containment template was filled or made runnable",
  );
  invariant(
    hasExactKeys(report.sourceGapDispositionTemplate, [
      "instruction",
      "targets",
    ]) &&
      report.sourceGapDispositionTemplate.instruction ===
        SOURCE_GAP_INSTRUCTION &&
      report.sourceGapDispositionTemplate?.targets?.length === 2 &&
      report.sourceGapDispositionTemplate.targets.every(
        (target, index) =>
          hasExactKeys(target, [
            "basename",
            "language",
            "exactCandidateCount",
            "externalDisposition",
            "externalReviewedExceptionReceiptOpaqueId",
            "importAuthorized",
          ]) &&
          target.basename === KEYTERM_TARGETS[index].basename &&
          target.language === KEYTERM_TARGETS[index].language &&
          target.exactCandidateCount === 0 &&
          target.externalDisposition === null &&
          target.externalReviewedExceptionReceiptOpaqueId === null &&
          target.importAuthorized === false,
      ),
    "source-gap disposition template was filled or authorized",
  );
  invariant(
    hasExactKeys(report.acceptanceEffects, ACCEPTANCE_KEYS) &&
    Object.keys(report.acceptanceEffects || {}).length ===
        ACCEPTANCE_KEYS.length &&
      ACCEPTANCE_KEYS.every(
        (key) => report.acceptanceEffects[key] === false,
      ),
    "Owner action packet changed an acceptance gate",
  );
  invariant(
    hasExactKeys(report.externalHandlingBoundary, [
      "copyOutsideRepositoryBeforeFilling",
      "fillThisRepositoryReport",
      "personalDataAllowedInThisReport",
      "signedDocumentBytesAllowedInGit",
      "automationMaySignOrAttest",
      "returnToGit",
    ]) &&
      report.externalHandlingBoundary?.copyOutsideRepositoryBeforeFilling ===
        true &&
      report.externalHandlingBoundary.fillThisRepositoryReport === false &&
      report.externalHandlingBoundary.personalDataAllowedInThisReport ===
        false &&
      report.externalHandlingBoundary.signedDocumentBytesAllowedInGit ===
        false &&
      report.externalHandlingBoundary.automationMaySignOrAttest === false &&
      report.externalHandlingBoundary.returnToGit === RETURN_TO_GIT,
    "Owner action packet external handling boundary drifted",
  );
  invariant(
    hasExactKeys(report.generator, ["path", "bytes", "sha256"]) &&
      report.generator.path ===
        "scripts/build-g5-l5-owner-action-packet.mjs" &&
      Number.isSafeInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(report.generator.sha256) &&
      hasExactKeys(report.sourceBindings, Object.keys(INPUTS)) &&
      Object.entries(INPUTS).every(([key, expectedPath]) => {
        const binding = report.sourceBindings[key];
        return (
          hasExactKeys(binding, ["path", "bytes", "sha256"]) &&
          binding.path === expectedPath &&
          Number.isSafeInteger(binding.bytes) &&
          binding.bytes > 0 &&
          /^[a-f0-9]{64}$/.test(binding.sha256)
        );
      }),
    "Owner action packet source bindings drifted",
  );
  invariant(
    Array.isArray(report.orderedExternalActions) &&
      JSON.stringify(report.orderedExternalActions) ===
        JSON.stringify(ORDERED_EXTERNAL_ACTIONS),
    "Owner action packet external action sequence drifted",
  );
  const serialized = JSON.stringify(report);
  invariant(
    !/\/Users\/|\/Volumes\/|file:\/\//i.test(serialized) &&
      !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized),
    "Owner action packet exposes a private path or contact identifier",
  );
  const expected = sha256(stableJson(reportWithoutFingerprint(report)));
  invariant(
    report.reportFingerprintSha256 === expected,
    "Owner action packet fingerprint is invalid",
  );
  return report;
}

async function buildOwnerActionPacketFromPreAuthorizationInputs() {
  const entries = await Promise.all(
    Object.entries(INPUTS).map(async ([key, relativePath]) => [
      key,
      await readBinding(relativePath, {json: key !== "roadmap"}),
    ]),
  );
  const inputs = Object.fromEntries(entries);
  const release = selectRelease(inputs.releaseManifest.document);
  const ledgerRelease = selectLedgerRelease(inputs.releaseLedger.document);
  validateGovernance(
    inputs.governanceProfile.document,
    inputs.m0Readiness.document,
    inputs.m1Readiness.document,
    release,
  );
  validateTechnicalBoundaries(
    inputs.containmentReadiness.document,
    inputs.missingKeytermReadiness.document,
    inputs.specificationReadiness.document,
  );
  invariant(
    inputs.governanceProfile.document.roadmap.sha256 ===
      inputs.roadmap.sha256,
    "governance profile roadmap binding drifted",
  );
  const profile = inputs.governanceProfile.document;
  const containment = inputs.containmentReadiness.document;
  const missing = inputs.missingKeytermReadiness.document;
  const specification = inputs.specificationReadiness.document;
  const roleSlots = profile.requiredRoles.flatMap((role) => [
    blankRoleSlot(role, "primary"),
    blankRoleSlot(role, "backup"),
  ]);
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-unsigned-owner-action-packet",
    releaseId: RELEASE_ID,
    evidenceState: "machine-prepared-unsigned-external-action-template-only",
    authority: AUTHORITY,
    generator: descriptor(await readBinding(
      path.relative(projectRoot, scriptPath).split(path.sep).join("/"),
      {json: false},
    )),
    sourceBindings: Object.fromEntries(
      Object.entries(inputs).map(([key, binding]) => [key, descriptor(binding)]),
    ),
    release: {
      titleDisplay: release.titleDisplay,
      grade: release.grade,
      lesson: release.lesson,
      activeXmlPages: release.expectedCounts.activeXmlReferencedPages,
      courseShells: release.expectedCounts.courseShells,
      members: release.expectedCounts.members,
      pairedFlaSwfMembers: 49,
      swfOnlyMembers: 8,
      publicationMode: release.publicationMode,
      releaseFingerprintSha256: profile.releaseFingerprintSha256,
      strictCompleteCount: ledgerRelease.strictCompleteCount,
      published: ledgerRelease.published,
      atomicGateOpen: ledgerRelease.gate.open,
    },
    summary: {
      pendingOwnerDecisionCount: 6,
      requiredRoleCount: 7,
      requiredNamedRoleSlotCount: 14,
      requiredPrimaryHoursPerWeekFloorTotal: 64,
      specifiedBackupHoursPerWeekFloorTotal: 8,
      ownerPendingBackupHourFloorCount: 6,
      pendingBudgetGateCount: 3,
      pendingContainmentControlCount: 8,
      missingDeclaredDependencyCount: 2,
      remainingMachineOnlyTaskCount:
        specification.summary.remainingAutomaticallyAdvanceableTaskCount,
      runtimeOrHumanDecisionRequiredMemberCount:
        specification.summary.originalRuntimeOrHumanDecisionRequiredCount,
      originalRuntimeSessionCount:
        containment.summary.originalRuntimeSessionsExecuted,
      implementationReadyCount:
        specification.summary.implementationSpecificationReadyCount,
      strictCompleteCount: ledgerRelease.strictCompleteCount,
      publicationCount: ledgerRelease.published ? 1 : 0,
    },
    ownerDecisionTemplate: DECISION_IDS.map(nullDecisionTemplate),
    staffingCapacityTemplate: {
      roadmapPrimaryFloorHoursPerWeekTotal: 64,
      roadmapSpecifiedBackupFloorHoursPerWeekTotal: 8,
      ownerMustSetBackupFloorCount: 6,
      roleSlots,
    },
    budgetProcurementTemplate: {
      currency: "USD",
      rateCeilingsApproved: null,
      totalBudgetEnvelopeApproved: null,
      procurementCycleApproved: null,
      externalApproverIdentity: null,
      externalSignedAt: null,
      externalReceiptOpaqueId: null,
      importedIntoRepository: false,
    },
    sourceGapDispositionTemplate: {
      instruction: SOURCE_GAP_INSTRUCTION,
      targets: missing.targets.map((target) => ({
        basename: target.basename,
        language: target.language,
        exactCandidateCount: target.exactCandidateCount,
        externalDisposition: null,
        externalReviewedExceptionReceiptOpaqueId: null,
        importAuthorized: false,
      })),
    },
    runtimeContainmentTemplate: {
      exactHostIdentifier: null,
      namedRuntimeOperator: null,
      ownerExecutionAuthorization: null,
      launchPath: null,
      launchCommand: null,
      readOnlyLessonTreePath: null,
      runtimeProfilePath: null,
      stopConditions: [],
      controls: containment.containmentPlan.controls.map((control) => ({
        controlId: control.controlId,
        requirement: control.requirement,
        selectedMechanism: null,
        externalApproval: null,
        externalVerification: null,
        externalReceiptOpaqueId: null,
      })),
      runnable: false,
    },
    externalHandlingBoundary: {
      copyOutsideRepositoryBeforeFilling: true,
      fillThisRepositoryReport: false,
      personalDataAllowedInThisReport: false,
      signedDocumentBytesAllowedInGit: false,
      automationMaySignOrAttest: false,
      returnToGit: RETURN_TO_GIT,
    },
    orderedExternalActions: [...ORDERED_EXTERNAL_ACTIONS],
    acceptanceEffects: acceptanceEffects(),
  };
  const report = {
    ...base,
    reportFingerprintSha256: sha256(stableJson(base)),
  };
  return validateOwnerActionPacket(report);
}

export async function buildOwnerActionPacket() {
  const {
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
    stableJson: stableReceiptJson,
    validateG5L5OwnerGovernanceDirectiveIntake,
  } = await import(
    "./build-g5-l5-owner-governance-directive-intake.mjs"
  );
  const [historicalJson, historicalMarkdown, directiveBinding] =
    await Promise.all([
      readBinding(DEFAULT_JSON),
      readBinding(DEFAULT_MARKDOWN, {json: false}),
      readBinding(G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH),
    ]);
  const report = validateOwnerActionPacket(historicalJson.document);
  invariant(
    historicalJson.text === stableJson(report),
    "historical pre-authorization Owner action packet is not canonical JSON",
  );
  invariant(
    historicalMarkdown.text === renderOwnerActionMarkdown(report),
    "historical pre-authorization Owner action packet Markdown drifted",
  );
  const directive = validateG5L5OwnerGovernanceDirectiveIntake(
    directiveBinding.document,
  );
  invariant(
    directiveBinding.text === stableReceiptJson(directive),
    "Owner directive receipt is not canonical JSON",
  );
  const intake = directive.sourceBindingsAtIntake;
  const packetBinding = intake?.preAuthorizationOwnerActionPacket;
  invariant(
    intake?.bindingSemantics ===
        "historical-at-intake-do-not-require-current-byte-identity" &&
      packetBinding?.path === DEFAULT_JSON &&
      packetBinding.bytes === historicalJson.bytes &&
      packetBinding.sha256 === historicalJson.sha256 &&
      packetBinding.reportFingerprintSha256 ===
        report.reportFingerprintSha256,
    "historical Owner action packet does not match the immutable at-intake receipt binding",
  );
  return report;
}

function valueOrOwner(value) {
  return value === null ? "Owner must set externally" : String(value);
}

export function renderOwnerActionMarkdown(report) {
  validateOwnerActionPacket(report);
  const decisions = report.ownerDecisionTemplate
    .map(
      ({decisionId}, index) =>
        `| ${index + 1} | \`${decisionId}\` | pending external decision |`,
    )
    .join("\n");
  const roles = report.staffingCapacityTemplate.roleSlots
    .map(
      (slot) =>
        `| \`${slot.roleId}\` | ${slot.slot} | ${valueOrOwner(slot.roadmapMinimumHoursPerWeek)} | pending external assignment and capacity receipt |`,
    )
    .join("\n");
  const controls = report.runtimeContainmentTemplate.controls
    .map(
      (control) =>
        `| \`${control.controlId}\` | ${control.requirement} | unselected / unapproved / unverified |`,
    )
    .join("\n");
  return `# G5 L5 Owner Action Packet — unsigned template

> ${report.authority}

Release: \`${report.releaseId}\` — **${report.release.titleDisplay}**

- Scope: **56 pages + Shell = 57 members**; 49 FLA+SWF and 8 SWF-only.
- Machine-only candidate work remaining: **${report.summary.remainingMachineOnlyTaskCount}**.
- Members still requiring original-runtime or human decisions: **${report.summary.runtimeOrHumanDecisionRequiredMemberCount}/57**.
- Original-runtime sessions / implementation-ready / strict / published: **0 / 0 / 0 / false**.

## How to use this packet

Do **not** enter names, signatures, rates, detailed budgets, host identifiers, credentials, or signed document bytes into this repository report. Copy the required fields into the approved encrypted external document/contract system. A later reviewed intake may return only a public-safe opaque receipt index and exact hash.

## Six Owner decisions

| # | Decision | Current state |
|---:|---|---|
${decisions}

## Fourteen named role slots

Roadmap primary floor total: **64 hours/week**. The original-runtime backup floor is **8 hours/week**. Owner must set the other six backup floors.

| Role | Slot | Roadmap floor hours/week | Current state |
|---|---|---:|---|
${roles}

## Budget and procurement

- Rate ceilings: pending external approval.
- Total budget envelope: pending external approval.
- Procurement cycle: pending external approval.

## Missing declared dependencies

Both \`L5KTE01.xml\` and \`L5KTS01.xml\` have **0 exact candidates**. Externally choose recovery plus hash binding or a validator-supported reviewed exception. Do not invent English or Spanish content.

## Runtime containment

| Control | Requirement | Current state |
|---|---|---|
${controls}

The exact host, named operator, read-only lesson tree, disposable profile, launch path/command, and stop conditions are blank. This packet contains no runnable artifact and grants no execution authority.

## Ordered action sequence

${report.orderedExternalActions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

## Fail-closed result

All acceptance effects remain false. M0 exit, M1 start, original-runtime execution, renderer implementation, fidelity, audio, human review, Owner acceptance, strict completion, and atomic publication are separate gates.
`;
}

export function parseArguments(argv) {
  const options = {
    check: false,
    json: DEFAULT_JSON,
    markdown: DEFAULT_MARKDOWN,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = argv[++index];
    else if (argument === "--markdown") options.markdown = argv[++index];
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.help) {
    reportOutputPath(options.json, "--json", ".json");
    reportOutputPath(options.markdown, "--markdown", ".md");
    invariant(
      options.json !== options.markdown,
      "JSON and Markdown outputs must differ",
    );
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-owner-action-packet.mjs
  node scripts/build-g5-l5-owner-action-packet.mjs --check

  Validates the checked-in public-safe, blank, non-runnable Owner action
  worksheet as immutable pre-authorization intake evidence. It does not
  regenerate that historical packet from current post-authorization M0/M1
  state and cannot ingest names, signatures, decisions, capacity, budget,
  host details, runtime authority, review, acceptance, strict completion, or
  publication state.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const report = await buildOwnerActionPacket();
  const json = stableJson(report);
  const markdown = renderOwnerActionMarkdown(report);
  const [currentJson, currentMarkdown] = await Promise.all([
    readBinding(options.json, {json: false}),
    readBinding(options.markdown, {json: false}),
  ]);
  invariant(currentJson.text === json, `${options.json} differs from the immutable historical packet`);
  invariant(
    currentMarkdown.text === markdown,
    `${options.markdown} differs from the immutable historical packet`,
  );
  process.stdout.write(
    `${options.check ? "PASS" : "PRESERVED"}: immutable pre-authorization Owner action packet; 6 blank decisions; 14 blank role slots; runtime/implementation/strict 0/0/0; published false\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === scriptPath
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
