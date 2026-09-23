#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  assertNoG5L4ProtectedGatePromotion,
  projectG5L4OwnerWorkAuthorization,
  validateG5L4OwnerWorkAuthorizationProjection,
  validateG5L4OwnerWorkAuthorizationReceipt,
} from "./lib/g5-l4-owner-work-authorization.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCHEMA_VERSION = 1;
const RELEASE_ID = "lesson-g05-l04-number-lines";
const DEFAULT_OUTPUT_PREFIX =
  "reports/g5-l4-per-session-authorization-preparation";

const INPUT_PATHS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  operatorAssignment:
    "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
  ownerDefaultsAuthorization:
    "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  ownerWorkAuthorization: G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  animateReadiness: "reports/g5-l4-animate-authoring-operator-readiness.json",
  runtimePlanningReadiness:
    "reports/g05-l04-number-lines-runtime-acquisition-planning-readiness.json",
  containmentReadiness:
    "reports/g5-l4-original-runtime-containment-readiness.json",
  runner: "scripts/run-assisted-animate-authoring-audit.mjs",
  jsfl: "scripts/animate-audit-current-document.jsfl",
  generator:
    "scripts/build-g5-l4-per-session-authorization-preparation.mjs",
});

const CONTROL_REQUIREMENTS = Object.freeze([
  Object.freeze({
    controlId: "CR-01",
    requirement:
      "Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player.",
  }),
  Object.freeze({
    controlId: "CR-02",
    requirement:
      "Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency.",
  }),
  Object.freeze({
    controlId: "CR-03",
    requirement:
      "Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session.",
  }),
  Object.freeze({
    controlId: "CR-04",
    requirement:
      "Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.",
  }),
  Object.freeze({
    controlId: "CR-05",
    requirement:
      "Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load.",
  }),
  Object.freeze({
    controlId: "CR-06",
    requirement:
      "Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled.",
  }),
  Object.freeze({
    controlId: "CR-07",
    requirement:
      "Run a fresh storage-capacity preflight immediately before every bounded capture session.",
  }),
  Object.freeze({
    controlId: "CR-08",
    requirement:
      "Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution.",
  }),
]);

const MISSING_HOST_TREE_DEPENDENCIES = Object.freeze([
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(value, label) {
  invariant(/^[a-f0-9]{64}$/.test(value || ""), `${label}: invalid SHA-256`);
}

function assertExactKeys(value, expected, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: must be an object`,
  );
  invariant(
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort()),
    `${label}: keys drifted`,
  );
}

function assertAllFalse(value, keys, label) {
  for (const key of keys) {
    invariant(value?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function assertAllNull(value, keys, label) {
  for (const key of keys) {
    invariant(value?.[key] === null, `${label}: ${key} must remain null`);
  }
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be a portable project-relative path`,
  );
  const resolved = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, resolved), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(projectRoot, resolved)) === relativePath,
    `${label}: path is not normalized`,
  );
  return resolved;
}

async function readFileRecord(projectRoot, relativePath, label = relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const before = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const after = await lstat(absolutePath);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1 &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${label}: changed during read`,
  );
  return {
    path: relativePath,
    absolutePath,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

function descriptor(record, extras = {}) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    ...extras,
  };
}

function assertDescriptor(actual, expected, label) {
  invariant(
    actual?.path === expected.path &&
      actual?.bytes === expected.bytes &&
      actual?.sha256 === expected.sha256,
    `${label}: descriptor drifted`,
  );
}

async function readJsonRecord(projectRoot, relativePath, label = relativePath) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

export async function readPreparationInputFile(
  projectRoot,
  relativePath,
  label = relativePath,
) {
  return readFileRecord(projectRoot, relativePath, label);
}

async function readBoundProjectFile(
  projectRoot,
  declared,
  label,
  {requiredMode = null} = {},
) {
  invariant(
    declared &&
      typeof declared === "object" &&
      typeof (declared.path || declared.file) === "string",
    `${label}: descriptor is missing`,
  );
  const relativePath = declared.path || declared.file;
  const record = await readFileRecord(projectRoot, relativePath, label);
  invariant(
    record.bytes === declared.bytes && record.sha256 === declared.sha256,
    `${label}: physical bytes or SHA-256 drifted`,
  );
  const metadata = await lstat(record.absolutePath);
  const mode = (metadata.mode & 0o777).toString(8).padStart(4, "0");
  if (requiredMode !== null) {
    invariant(mode === requiredMode, `${label}: mode must remain ${requiredMode}`);
  }
  if (declared.mode !== undefined) {
    invariant(mode === declared.mode, `${label}: declared mode drifted`);
  }
  return descriptor(record, {mode});
}

async function readAbsoluteBoundFile(declared, label) {
  invariant(
    declared &&
      typeof declared.file === "string" &&
      path.isAbsolute(declared.file),
    `${label}: absolute descriptor is missing`,
  );
  const before = await lstat(declared.file).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: must be one ordinary non-linked file`,
  );
  invariant(
    await realpath(declared.file) === declared.file,
    `${label}: path must resolve without symbolic links`,
  );
  const contents = await readFile(declared.file);
  const after = await lstat(declared.file);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${label}: changed during read`,
  );
  const mode = (after.mode & 0o777).toString(8).padStart(4, "0");
  invariant(
    contents.length === declared.bytes &&
      sha256Bytes(contents) === declared.sha256 &&
      mode === declared.mode,
    `${label}: bytes, hash, or mode drifted`,
  );
  return {
    path: declared.file,
    bytes: contents.length,
    sha256: declared.sha256,
    mode,
  };
}

function validateReleaseManifest(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release manifest schema drifted",
  );
  const matches = document.releases.filter(
    (release) => release?.releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, `${RELEASE_ID}: expected exactly one release`);
  const release = matches[0];
  invariant(
    release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.grade === 5 &&
      release.lesson === 4 &&
      release.expectedCounts?.members === 55 &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      Array.isArray(release.members) &&
      release.members.length === 55,
    `${RELEASE_ID}: release scope drifted`,
  );
  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member.ordinal === index + 1, `${RELEASE_ID}: ordinal drifted`);
    invariant(
      /^[a-z0-9][a-z0-9-]+$/.test(member.animationId || ""),
      `${RELEASE_ID}: unsafe animationId`,
    );
    invariant(
      member.assetId === `swf-${member.source?.sha256}`,
      `${member.animationId}: asset/source identity drifted`,
    );
    assertSha256(member.source?.sha256, `${member.animationId} SWF`);
    invariant(
      typeof member.source?.path === "string" &&
        member.source.path.startsWith("HELP_COURSES/ELMGR5/L4/"),
      `${member.animationId}: source path drifted`,
    );
    invariant(
      !animationIds.has(member.animationId) && !assetIds.has(member.assetId),
      `${member.animationId}: duplicate release identity`,
    );
    animationIds.add(member.animationId);
    assetIds.add(member.assetId);
  }
  invariant(
    release.members.filter((member) => member.releaseRole === "course-shell")
      .length === 1 &&
      release.members.at(-1)?.animationId ===
        "shell-course-g05-l04-index-local",
    `${RELEASE_ID}: shell identity drifted`,
  );
  return release;
}

function validateOperatorAssignment(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType ===
        "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake" &&
      document.releaseId === RELEASE_ID,
    "G5 L4 operator receipt identity drifted",
  );
  invariant(
    document.assigningAuthority?.ownerFullName === "Dr. Peter Hu" &&
      document.assigningAuthority?.ownerRole === "Owner" &&
      document.assignment?.roleId === "authorized-original-runtime-operator" &&
      document.assignment?.slot === "primary" &&
      document.assignment?.assigneeFullName === "Dr. Peter Hu" &&
      document.assignment?.samePersonAsOwner === true &&
      document.assignment?.explicit === true,
    "G5 L4 operator assignment drifted",
  );
  invariant(
    document.externalSignatureEnvelope === null,
    "operator role receipt may not claim a signature envelope",
  );
  invariant(
    document.authorityBoundary?.assignmentUserAttested === true &&
      document.authorityBoundary?.namedHumanRoleAssignmentEstablished === true &&
      document.authorityBoundary?.namedRoleSlotCountEffect === 1 &&
      document.authorityBoundary?.strictAcceptanceEffect ===
        "named-primary-operator-role-only",
    "operator role-only authority boundary drifted",
  );
  assertAllFalse(
    document.authorityBoundary,
    [
      "assigneeIdentityCryptographicallyVerified",
      "weeklyCapacityCommitmentEstablished",
      "backupAssignmentEstablished",
      "runtimeHostApproved",
      "containmentApproved",
      "immutableSessionAuthorizationEstablished",
      "animateGuiExecutionAuthorizedByThisReceiptAlone",
      "originalRuntimeExecutionAuthorizedByThisReceiptAlone",
      "actualAnimateExecutionEstablished",
      "actualOriginalRuntimeSessionEstablished",
      "humanReviewAccepted",
      "ownerFidelityAcceptanceEstablished",
      "strictCompletionEstablished",
      "publicationAuthorized",
    ],
    "operator receipt",
  );
}

function validateOwnerDefaultsAuthorization(document) {
  assertExactKeys(
    document,
    [
      "schemaVersion",
      "evidenceType",
      "releaseId",
      "receivedOn",
      "recordedAt",
      "channel",
      "taskThreadId",
      "statementLanguage",
      "ownerStatement",
      "ownerIdentity",
      "referencedBlockerSet",
      "authorization",
      "sourceBindingsAtIntake",
      "externalSignatureEnvelope",
      "authorityBoundary",
    ],
    "Owner blockers 2-4 receipt",
  );
  invariant(
    document.schemaVersion === 1 &&
      document.evidenceType ===
        "g5-l4-user-stated-owner-default-blockers-2-4-authorization-intake" &&
      document.releaseId === RELEASE_ID &&
      document.receivedOn === "2026-07-29" &&
      document.channel === "current-codex-task" &&
      document.statementLanguage === "zh-CN",
    "Owner blockers 2-4 receipt identity drifted",
  );
  const ownerStatement =
    "请继续执行。我给与权限和批准。\n阻塞项目2到4——按照默认值";
  assertExactKeys(
    document.ownerStatement,
    ["exactUtf8", "byteLength", "sha256", "captureBoundary"],
    "Owner blockers 2-4 statement",
  );
  const ownerStatementBytes = Buffer.from(ownerStatement, "utf8");
  invariant(
    document.ownerStatement.exactUtf8 === ownerStatement &&
      document.ownerStatement.byteLength === ownerStatementBytes.length &&
      document.ownerStatement.sha256 === sha256Bytes(ownerStatementBytes) &&
      document.ownerStatement.captureBoundary ===
        "exact-visible-message-markdown-source-with-single-lf",
    "Owner blockers 2-4 exact statement drifted",
  );
  invariant(
    document.ownerIdentity?.ownerFullName === "Dr. Peter Hu" &&
      document.ownerIdentity?.ownerRole === "Owner" &&
      document.ownerIdentity?.externalSubjectId === null,
    "Owner blockers 2-4 identity drifted",
  );
  const blockerTexts = [
    "CR-01 至 CR-08 尚未由 Owner 选择、批准和验证；`L4KTE01.xml` 与 `L4KTS01.xml` 缺失，因此只存在不完整的 host-tree 候选。",
    "尚无不可变的单次会话授权、会话操作员证明，以及实际 EN/ES 原始运行时遍历；44 个 FLA 的 Animate 人工审计也均未执行。",
    "尚缺独立工程、视觉、音频、西班牙语审查，以及 Owner fidelity、strict-validation 和原子发布批准。",
  ];
  const blockerDispositions = [
    "fail-closed-controls-remain-technically-unselected-unapproved-unverified-missing-xml-preserved-no-substitution",
    "unsigned-non-runnable-session-and-animate-preparation-only-no-session-runtime-traversal-or-audit-established",
    "review-and-owner-signoff-package-preparation-only-no-review-fidelity-strict-validation-or-publication-acceptance-established",
  ];
  const blockerSetText = blockerTexts.join("\n");
  const blockerSetBytes = Buffer.from(blockerSetText, "utf8");
  const blockerSet = document.referencedBlockerSet;
  invariant(
    JSON.stringify(blockerSet?.blockerNumbers) === JSON.stringify([2, 3, 4]) &&
      blockerSet.exactUtf8 === blockerSetText &&
      blockerSet.byteLength === blockerSetBytes.length &&
      blockerSet.sha256 === sha256Bytes(blockerSetBytes) &&
      blockerSet.captureBoundary ===
        "exact-user-visible-blocker-markdown-source-with-list-prefixes-omitted-and-items-joined-by-single-lf" &&
      Array.isArray(blockerSet.items) &&
      blockerSet.items.length === 3,
    "Owner referenced blocker set drifted",
  );
  for (const [index, item] of blockerSet.items.entries()) {
    const bytes = Buffer.from(blockerTexts[index], "utf8");
    invariant(
      item.blockerNumber === index + 2 &&
        item.exactUtf8 === blockerTexts[index] &&
        item.byteLength === bytes.length &&
        item.sha256 === sha256Bytes(bytes) &&
        item.defaultDisposition === blockerDispositions[index],
      `Owner blocker ${index + 2} binding drifted`,
    );
  }
  const authorization = document.authorization;
  invariant(
    authorization?.defaultDisposition ===
        "prospective-fail-closed-policy-and-machine-preparation-only" &&
      authorization.policyApproved === true &&
      authorization.preparationAuthorized === true &&
      authorization.unsignedPendingOwnerSignaturePackagePreparationAuthorized ===
        true &&
      JSON.stringify(authorization.authorizedPreparation) ===
        JSON.stringify([
          "preserve-and-aggregate-current-fail-closed-evidence-boundaries",
          "materialize-machine-only-readiness-and-policy-projection-artifacts",
          "prepare-unsigned-non-runnable-candidate-packages-requiring-separate-human-or-owner-signature",
        ]),
    "Owner blockers 2-4 preparation authorization drifted",
  );
  assertAllFalse(
    authorization,
    [
      "technicalMechanismSelectionAuthorized",
      "technicalMechanismApprovalEstablished",
      "technicalMechanismVerificationEstablished",
      "missingDependencySubstitutionAuthorized",
      "runtimeHostApprovalEstablished",
      "immutableSessionAuthorizationEstablished",
      "runtimeExecutionAuthorized",
      "animateAuditEstablished",
      "humanReviewAcceptanceEstablished",
      "ownerFidelityAcceptanceEstablished",
      "strictValidationApprovalEstablished",
      "atomicPublicationApprovalEstablished",
    ],
    "Owner blockers 2-4 authorization",
  );
  invariant(
    document.externalSignatureEnvelope === null,
    "Owner blockers 2-4 receipt may not claim an external signature",
  );
  const boundary = document.authorityBoundary;
  invariant(
    boundary?.ownerIdentityUserAttested === true &&
      boundary.ownerIdentityCryptographicallyVerified === false &&
      boundary.policyApprovalRecorded === true &&
      boundary.preparationAuthorizationRecorded === true &&
      boundary.pendingOwnerSignaturePackagePreparationAuthorized === true &&
      boundary.technicalMechanismsSelected === 0 &&
      boundary.technicalMechanismsApproved === 0 &&
      boundary.technicalMechanismsVerified === 0 &&
      boundary.missingDeclaredDependenciesRemaining === 2 &&
      boundary.actualFlaAnimateAuditCount === 0 &&
      boundary.strictAcceptanceEffect ===
        "prospective-fail-closed-policy-and-preparation-only",
    "Owner blockers 2-4 authority summary drifted",
  );
  assertAllFalse(
    boundary,
    [
      "runtimeHostApproved",
      "containmentTechnicalApprovalEstablished",
      "immutableSessionAuthorizationEstablished",
      "sessionOperatorAttestationEstablished",
      "actualEnEsOriginalRuntimeTraversalEstablished",
      "animateGuiExecutionAuthorizedByThisReceiptAlone",
      "originalRuntimeExecutionAuthorizedByThisReceiptAlone",
      "independentEngineeringReviewAccepted",
      "independentVisualReviewAccepted",
      "independentAudioReviewAccepted",
      "independentSpanishReviewAccepted",
      "ownerFidelityAcceptanceEstablished",
      "strictValidationApprovalEstablished",
      "atomicPublicationApprovalEstablished",
    ],
    "Owner blockers 2-4 authority boundary",
  );
}

function validateContainmentReport(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType ===
        "g5-l4-original-runtime-containment-readiness" &&
      document.releaseId === RELEASE_ID &&
      document.identity?.releaseId === RELEASE_ID &&
      document.identity?.publicationMode === "atomic" &&
      document.summary?.containmentControlsSpecified === 8 &&
      document.summary?.containmentMechanismsSelected === 8 &&
      document.summary?.containmentCandidateImplementationsPresent === 8 &&
      document.summary?.containmentOfflineOrDiagnosticVerified === 8 &&
      document.summary?.containmentOwnerTechnicalApprovals === 0 &&
      document.summary?.containmentLiveSessionVerified === 0 &&
      document.summary?.containmentControlsApproved === 0 &&
      document.summary?.containmentControlsVerified === 0 &&
      document.summary?.completeReadOnlyHostTreeCount === 0 &&
      document.summary?.runnableArtifactCount === 0,
    "G5 L4 containment boundary drifted",
  );
  invariant(
    document.executionGate?.runnable === false &&
      document.executionGate?.originalRuntimeExecutionReady === false &&
      document.executionGate?.immutableSessionAuthorizationBound === false &&
      document.executionGate?.sessionOperatorAttestationBound === false &&
      document.executionGate?.launchesGuiByThisBuilder === false &&
      document.executionGate?.launchesRuntimeByThisBuilder === false &&
      document.hostTreeCandidate?.cr02TechnicalArtifactComplete === false &&
      document.hostTreeCandidate?.readOnlyHostTreeMaterialized === true,
    "G5 L4 containment execution gate drifted",
  );
  invariant(
    JSON.stringify(
      document.hostTreeCandidate?.missingDeclaredDependencies?.map(
        (entry) => entry.path,
      ),
    ) === JSON.stringify(MISSING_HOST_TREE_DEPENDENCIES),
    "G5 L4 missing host-tree dependencies drifted",
  );
  for (const [index, control] of document.containmentPlan.controls.entries()) {
    invariant(
      control.controlId === CONTROL_REQUIREMENTS[index].controlId &&
        control.requirement === CONTROL_REQUIREMENTS[index].requirement &&
        typeof control.selectedMechanism === "string" &&
        control.selectedMechanism.length > 10 &&
        control.candidateImplementationPresent === true &&
        control.offlineOrDiagnosticVerified === true &&
        control.ownerTechnicalApprovalEstablished === false &&
        control.liveSessionVerified === false &&
        control.approved === false &&
        control.verified === false,
      `${control.controlId || `CR-${index + 1}`}: containment state drifted`,
    );
  }
}

function validateRuntimePlanningReadiness(document, release) {
  invariant(
    document?.schemaVersion === 2 &&
      document.reportType ===
        "release-runtime-acquisition-planning-readiness" &&
      document.identity?.releaseId === RELEASE_ID &&
      document.identity?.publicationMode === "atomic" &&
      Array.isArray(document.items) &&
      document.items.length === 55,
    "G5 L4 runtime-planning readiness identity drifted",
  );
  invariant(
    document.summary?.selectedMemberCount === 55 &&
      document.summary?.emptyWorksheetCount === 55 &&
      document.summary?.pairedFlaAndSwfCount === 44 &&
      document.summary?.swfOnlyCount === 11 &&
      document.summary?.runnableArtifactCount === 0 &&
      document.summary?.runtimeSessionCount === 0 &&
      document.summary?.sessionOperatorAttestationCount === 0 &&
      document.summary?.acceptanceChangeCount === 0,
    "G5 L4 runtime-planning summary drifted",
  );
  assertAllFalse(
    document.gates,
    [
      "audioRuntimeListeningComplete",
      "authoritativeBaselinesComplete",
      "authorizedOriginalRuntimeBound",
      "implementationAuthorized",
      "operatorWeeklyCapacityEstablished",
      "portableOperatorIdentityVerified",
      "publicationAffected",
      "rootReachableDomainsResolved",
      "runtimeOperatorBound",
      "runtimeOperatorSessionAttested",
      "strictCompletionAffected",
    ],
    "runtime-planning gates",
  );
  for (const [index, item] of document.items.entries()) {
    const member = release.members[index];
    invariant(
      item.ordinal === member.ordinal &&
        item.animationId === member.animationId &&
        item.assetId === member.assetId &&
        item.runtimeWorksheet === "empty-non-runnable-planning-only" &&
        item.acceptanceEffect === "none",
      `${member.animationId}: runtime-planning item drifted`,
    );
  }
}

function validatePlan(document, item, member) {
  invariant(
    document?.schemaVersion === 2 &&
      document.artifactType === "release-runtime-acquisition-plan" &&
      document.identity?.releaseId === RELEASE_ID &&
      document.identity?.ordinal === member.ordinal &&
      document.identity?.animationId === member.animationId &&
      document.identity?.assetId === member.assetId,
    `${member.animationId}: runtime plan identity drifted`,
  );
  const {artifactFingerprintSha256, ...withoutFingerprint} = document;
  invariant(
    artifactFingerprintSha256 ===
      sha256Bytes(Buffer.from(stableJson(withoutFingerprint))) &&
      artifactFingerprintSha256 === item.artifact.fingerprintSha256,
    `${member.animationId}: runtime plan fingerprint drifted`,
  );
  const worksheet = document.emptyRuntimeAcquisitionWorksheet;
  invariant(
    worksheet?.state === "empty-non-runnable-planning-only" &&
      [
        "actionSchedules",
        "audioListeningRecords",
        "authorizedRuntimeContexts",
        "baselineManifests",
        "deterministicSeedSchedules",
        "namedOperators",
        "naturalEntryActions",
        "ownerSignatures",
        "pngFiles",
        "reviewerSignatures",
        "runtimeReceipts",
        "traceSchedules",
      ].every((key) => Array.isArray(worksheet[key]) && worksheet[key].length === 0),
    `${member.animationId}: runtime worksheet is no longer empty`,
  );
  assertAllFalse(
    document.executionGate,
    [
      "authorizesDirectSeek",
      "createsBaselineEvidence",
      "createsRuntimeEvidence",
      "executesLegacyEndpoints",
      "launchesAnimate",
      "launchesBrowser",
      "launchesOriginalRuntime",
      "launchesRuffle",
      "runnable",
    ],
    `${member.animationId} execution gate`,
  );
  assertAllFalse(
    document.acceptanceEffects,
    [
      "audioAccepted",
      "authoritativeOriginalRuntime",
      "currentJavaScriptCandidate",
      "fullFrameComparison",
      "humanVisualAccepted",
      "ownerAccepted",
      "published",
      "strictComplete",
    ],
    `${member.animationId} acceptance`,
  );
  invariant(
    document.namedOperatorRoleAssignment?.assigneeFullName === "Dr. Peter Hu" &&
      document.namedOperatorRoleAssignment?.actualSessionOperatorAttestationPresent ===
        false &&
      document.namedOperatorRoleAssignment?.immutableSessionAuthorizationEstablished ===
        false &&
      document.namedOperatorRoleAssignment?.originalRuntimeExecutionAuthorized ===
        false,
    `${member.animationId}: runtime plan operator boundary drifted`,
  );
  invariant(
    document.nativeRootTimelineFacts?.stage?.width > 0 &&
      document.nativeRootTimelineFacts?.stage?.height > 0 &&
      document.nativeRootTimelineFacts?.fps === 12 &&
      Number.isInteger(document.nativeRootTimelineFacts?.rootFrameCount) &&
      document.nativeRootTimelineFacts.rootFrameCount > 0,
    `${member.animationId}: native runtime facts drifted`,
  );
  invariant(
    document.source?.swf?.sha256 === member.source.sha256 &&
      document.source.swf.path.endsWith(`/${member.source.path}`) &&
      document.source.sourceModel === item.sourceModel &&
      (item.sourceModel === "paired-fla-and-shipped-swf"
        ? document.source.fla !== null
        : document.source.fla === null),
    `${member.animationId}: runtime plan source drifted`,
  );
}

function validateAnimateReadiness(document, release, runner, jsfl) {
  invariant(
    document?.schemaVersion === 2 &&
      document.reportType ===
        "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness" &&
      document.release?.releaseId === RELEASE_ID &&
      document.release?.publicationMode === "atomic" &&
      Array.isArray(document.queue) &&
      document.queue.length === 44,
    "G5 L4 Animate readiness identity drifted",
  );
  invariant(
    document.operatorAssignment?.assigneeFullName === "Dr. Peter Hu" &&
      document.processGate?.humanAssistedRunAllowedNow === false &&
      document.processGate?.state ===
        "closed-named-operator-bound-session-execution-authorization-required" &&
      document.operatorProtocol?.immutablePerRowSessionAuthorizationPresent ===
        false &&
      document.operatorProtocol?.noReviewOwnerStrictOrPublicationAuthority ===
        true,
    "G5 L4 Animate operator boundary drifted",
  );
  invariant(
    document.summary?.selectedMembers === 55 &&
      document.summary?.flaBackedItems === 44 &&
      document.summary?.swfOnlyItems === 11 &&
      document.summary?.pendingHumanAssistedRuns === 44 &&
      document.summary?.actualSessionOperatorAttestationsRecorded === 0 &&
      document.summary?.animateGuiExecutionsByThisBuilder === 0 &&
      document.summary?.authoringAuditsEstablished === 0 &&
      document.summary?.strictAcceptancesEstablished === 0 &&
      document.summary?.strictAcceptanceEffect === false,
    "G5 L4 Animate readiness summary drifted",
  );
  assertDescriptor(
    {
      path: document.inputs?.assistRunner?.file,
      bytes: document.inputs?.assistRunner?.bytes,
      sha256: document.inputs?.assistRunner?.sha256,
    },
    runner,
    "Animate readiness runner",
  );
  assertDescriptor(
    {
      path: document.inputs?.recursiveJsflAuditTemplate?.file,
      bytes: document.inputs?.recursiveJsflAuditTemplate?.bytes,
      sha256: document.inputs?.recursiveJsflAuditTemplate?.sha256,
    },
    jsfl,
    "Animate readiness JSFL",
  );
  const releaseById = new Map(
    release.members.map((member) => [member.animationId, member]),
  );
  for (const [index, entry] of document.queue.entries()) {
    const member = releaseById.get(entry.animationId);
    invariant(
      member &&
        entry.queueOrdinal === index + 1 &&
        entry.releaseOrdinal === member.ordinal &&
        entry.assetId === member.assetId &&
        entry.sourcePair?.sourceKind === "fla+swf" &&
        entry.sourcePair?.swf?.sha256 === member.source.sha256 &&
        entry.sourcePair?.swf?.file.endsWith(`/${member.source.path}`) &&
        entry.sourcePair?.fla?.sha256 &&
        entry.releaseStagingCopy?.mode === "0444" &&
        entry.releaseStagingCopy?.readOnly === true &&
        entry.releaseStagingCopy?.byteIdenticalToSource === true &&
        entry.pairedAssistPreparation?.currentExecutionRunner?.sha256 ===
          runner.sha256 &&
        entry.command?.prepareOnly?.animateLaunches === false &&
        entry.command?.humanAssistedRun?.argvTemplate?.at(-1) === "none" &&
        entry.command?.humanAssistedRun?.automatedDialogInteractionAllowed ===
          false &&
        entry.command?.humanAssistedRun?.documentSavePublishOrConversionAllowed ===
          false &&
        entry.operatorInputs?.dialogOperator?.namedRoleAssignee ===
          "Dr. Peter Hu" &&
        entry.resultObservation?.runDirectories === 0 &&
        entry.resultObservation?.receiptFiles?.length === 0,
      `${entry.animationId || index}: Animate queue boundary drifted`,
    );
    assertAllFalse(
      entry.evidenceState,
      [
        "authoringAudit",
        "originalRuntimeBehavior",
        "javascriptFidelity",
        "rmse",
        "audioAcceptance",
        "humanReview",
        "ownerAcceptance",
        "strictAcceptance",
        "migrationComplete",
        "publication",
      ],
      `${entry.animationId} Animate evidence`,
    );
  }
  return document.queue;
}

function selectedCandidateControls(containmentControls) {
  invariant(
    Array.isArray(containmentControls) && containmentControls.length === 8,
    "selected containment candidates must contain CR-01 through CR-08",
  );
  return CONTROL_REQUIREMENTS.map((control, index) => {
    const candidate = containmentControls[index];
    invariant(
      candidate?.controlId === control.controlId &&
        candidate.requirement === control.requirement &&
        typeof candidate.selectedMechanism === "string" &&
        candidate.selectedMechanism.length > 10 &&
        candidate.candidateImplementationPresent === true &&
        candidate.offlineOrDiagnosticVerified === true &&
        candidate.ownerTechnicalApprovalEstablished === false &&
        candidate.liveSessionVerified === false &&
        candidate.approved === false &&
        candidate.verified === false,
      `${control.controlId}: selected containment candidate drifted`,
    );
    return {
      ...control,
      selectedMechanism: candidate.selectedMechanism,
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      approvalReceiptSha256: null,
      verificationReceiptSha256: null,
      approved: false,
      verified: false,
    };
  });
}

function blankSessionAuthorization() {
  return {
    sessionId: null,
    nonce: null,
    authorizedAt: null,
    notAfter: null,
    ttlSeconds: null,
    oneTimeUseRequired: true,
    signatureEnvelope: null,
    state: "unsigned-empty-non-runnable",
  };
}

function blankEnvironment({missingHostTreeDependencies = []} = {}) {
  return {
    host: {
      exactHostIdentifier: null,
      hostIdSha256: null,
      approved: false,
    },
    profile: {
      path: null,
      manifestSha256: null,
      disposable: null,
      emptySharedObjectStoreVerified: false,
    },
    hostTree: {
      path: null,
      manifestSha256: null,
      readOnly: null,
      complete: false,
      missingDeclaredDependencies: [...missingHostTreeDependencies],
    },
  };
}

function blankContainment(containmentControls) {
  return {
    controls: selectedCandidateControls(containmentControls),
    approvalManifestSha256: null,
    liveNoEgressPreflightSha256: null,
    liveCapacityPreflightSha256: null,
    approved: false,
    verified: false,
  };
}

function operatorTemplate(operatorReceipt) {
  return {
    expectedRoleId: "authorized-original-runtime-operator",
    expectedFullName: "Dr. Peter Hu",
    roleAssignmentReceipt: operatorReceipt,
    perSessionDeclaration: {
      fullName: null,
      externalSubjectId: null,
      attestedAt: null,
      allowedActionIds: [],
      attestationSha256: null,
      signatureEnvelope: null,
      present: false,
    },
  };
}

function traceIdentity({
  animationId,
  language,
  nativeRootTimelineFacts,
}) {
  return {
    animationId,
    requirementId: null,
    frameDomain: null,
    trace: null,
    entryStateSha256: null,
    scenario: null,
    language,
    seed: null,
    nativeStage: {
      width: nativeRootTimelineFacts.stage.width,
      height: nativeRootTimelineFacts.stage.height,
    },
    fps: nativeRootTimelineFacts.fps,
    exactFrameRange: {
      start: null,
      end: null,
    },
  };
}

function blankExecution() {
  return {
    runnable: false,
    launchAuthorized: false,
    sessionExecuted: false,
    processClaimSha256: null,
    completionReceiptSha256: null,
    abortReceiptSha256: null,
  };
}

function blankAcceptance() {
  return {
    authoringAccepted: false,
    authoritativeOriginalRuntime: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    independentReviewAccepted: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    published: false,
  };
}

function commonTemplate({
  templateType,
  templateId,
  member,
  language,
  plan,
  generator,
  operatorReceipt,
  ownerDefaultsReceipt,
  source,
  staging,
  toolchain,
  containmentControls,
  missingHostTreeDependencies = [],
}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    templateType,
    templateId,
    identity: {
      releaseId: RELEASE_ID,
      releaseOrdinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      language,
    },
    preparationBindings: {
      generator,
      operatorRoleAssignmentReceipt: operatorReceipt,
      ownerDefaultsAuthorizationReceipt: ownerDefaultsReceipt,
    },
    sessionAuthorization: blankSessionAuthorization(),
    source,
    staging,
    toolchain,
    environment: blankEnvironment({missingHostTreeDependencies}),
    containment: blankContainment(containmentControls),
    stopConditions: [],
    operator: operatorTemplate(operatorReceipt),
    traceIdentity: traceIdentity({
      animationId: member.animationId,
      language,
      nativeRootTimelineFacts: plan.nativeRootTimelineFacts,
    }),
    execution: blankExecution(),
    acceptance: blankAcceptance(),
  };
}

function nullToolDescriptor() {
  return {
    path: null,
    bytes: null,
    sha256: null,
    mode: null,
  };
}

function validateSelectedCandidateControls(controls, label) {
  invariant(
    Array.isArray(controls) && controls.length === 8,
    `${label}: must contain CR-01 through CR-08`,
  );
  for (const [index, control] of controls.entries()) {
    const expected = CONTROL_REQUIREMENTS[index];
    assertExactKeys(
      control,
      [
        "controlId", "requirement", "selectedMechanism",
        "candidateImplementationPresent", "offlineOrDiagnosticVerified",
        "ownerTechnicalApprovalEstablished", "liveSessionVerified",
        "approvalReceiptSha256", "verificationReceiptSha256", "approved",
        "verified",
      ],
      `${label}: ${expected.controlId}`,
    );
    invariant(
      control.controlId === expected.controlId &&
        control.requirement === expected.requirement &&
        typeof control.selectedMechanism === "string" &&
        control.selectedMechanism.length > 10 &&
        control.candidateImplementationPresent === true &&
        control.offlineOrDiagnosticVerified === true &&
        control.ownerTechnicalApprovalEstablished === false &&
        control.liveSessionVerified === false &&
        control.approvalReceiptSha256 === null &&
        control.verificationReceiptSha256 === null &&
        control.approved === false &&
        control.verified === false,
      `${label}: ${expected.controlId} candidate or approval boundary drifted`,
    );
  }
}

function validateUnsignedTemplate(
  template,
  {
    expectedType,
    member,
    language,
    operatorReceipt,
    ownerDefaultsReceipt,
    generator,
  },
) {
  invariant(
    template?.schemaVersion === SCHEMA_VERSION &&
      template.templateType === expectedType &&
      typeof template.templateId === "string" &&
      template.identity?.releaseId === RELEASE_ID &&
      template.identity?.releaseOrdinal === member.ordinal &&
      template.identity?.animationId === member.animationId &&
      template.identity?.assetId === member.assetId &&
      template.identity?.language === language,
    `${member.animationId}/${language ?? "animate"}: template identity drifted`,
  );
  assertDescriptor(
    template.preparationBindings?.generator,
    generator,
    `${template.templateId} generator`,
  );
  assertDescriptor(
    template.preparationBindings?.operatorRoleAssignmentReceipt,
    operatorReceipt,
    `${template.templateId} operator receipt`,
  );
  assertDescriptor(
    template.preparationBindings?.ownerDefaultsAuthorizationReceipt,
    ownerDefaultsReceipt,
    `${template.templateId} Owner defaults receipt`,
  );
  assertAllNull(
    template.sessionAuthorization,
    [
      "sessionId",
      "nonce",
      "authorizedAt",
      "notAfter",
      "ttlSeconds",
      "signatureEnvelope",
    ],
    `${template.templateId} session authorization`,
  );
  invariant(
    template.sessionAuthorization?.oneTimeUseRequired === true &&
      template.sessionAuthorization?.state ===
        "unsigned-empty-non-runnable",
    `${template.templateId}: session authorization state drifted`,
  );
  assertAllNull(
    template.environment?.host,
    ["exactHostIdentifier", "hostIdSha256"],
    `${template.templateId} host`,
  );
  invariant(
    template.environment?.host?.approved === false,
    `${template.templateId}: host approval was filled`,
  );
  assertAllNull(
    template.environment?.profile,
    ["path", "manifestSha256", "disposable"],
    `${template.templateId} profile`,
  );
  invariant(
    template.environment?.profile?.emptySharedObjectStoreVerified === false,
    `${template.templateId}: profile verification was filled`,
  );
  assertAllNull(
    template.environment?.hostTree,
    ["path", "manifestSha256", "readOnly"],
    `${template.templateId} host tree`,
  );
  invariant(
    template.environment?.hostTree?.complete === false,
    `${template.templateId}: host tree was completed`,
  );
  validateSelectedCandidateControls(
    template.containment?.controls,
    `${template.templateId} containment`,
  );
  assertAllNull(
    template.containment,
    [
      "approvalManifestSha256",
      "liveNoEgressPreflightSha256",
      "liveCapacityPreflightSha256",
    ],
    `${template.templateId} containment`,
  );
  assertAllFalse(
    template.containment,
    ["approved", "verified"],
    `${template.templateId} containment`,
  );
  invariant(
    Array.isArray(template.stopConditions) &&
      template.stopConditions.length === 0,
    `${template.templateId}: stop conditions must remain empty`,
  );
  invariant(
    template.operator?.expectedRoleId ===
        "authorized-original-runtime-operator" &&
      template.operator?.expectedFullName === "Dr. Peter Hu",
    `${template.templateId}: expected operator identity drifted`,
  );
  assertDescriptor(
    template.operator.roleAssignmentReceipt,
    operatorReceipt,
    `${template.templateId} operator role receipt`,
  );
  const declaration = template.operator.perSessionDeclaration;
  assertAllNull(
    declaration,
    [
      "fullName",
      "externalSubjectId",
      "attestedAt",
      "attestationSha256",
      "signatureEnvelope",
    ],
    `${template.templateId} operator declaration`,
  );
  invariant(
    declaration?.present === false &&
      Array.isArray(declaration.allowedActionIds) &&
      declaration.allowedActionIds.length === 0,
    `${template.templateId}: operator declaration was filled`,
  );
  const trace = template.traceIdentity;
  invariant(
    trace?.animationId === member.animationId &&
      trace.language === language &&
      trace.nativeStage?.width > 0 &&
      trace.nativeStage?.height > 0 &&
      trace.fps === 12,
    `${template.templateId}: trace identity drifted`,
  );
  assertAllNull(
    trace,
    [
      "requirementId",
      "frameDomain",
      "trace",
      "entryStateSha256",
      "scenario",
      "seed",
    ],
    `${template.templateId} trace identity`,
  );
  assertAllNull(
    trace.exactFrameRange,
    ["start", "end"],
    `${template.templateId} frame range`,
  );
  assertAllFalse(
    template.execution,
    ["runnable", "launchAuthorized", "sessionExecuted"],
    `${template.templateId} execution`,
  );
  assertAllNull(
    template.execution,
    [
      "processClaimSha256",
      "completionReceiptSha256",
      "abortReceiptSha256",
    ],
    `${template.templateId} execution`,
  );
  assertAllFalse(
    template.acceptance,
    [
      "authoringAccepted",
      "authoritativeOriginalRuntime",
      "audioAccepted",
      "humanVisualAccepted",
      "independentReviewAccepted",
      "ownerFidelityAccepted",
      "strictComplete",
      "published",
    ],
    `${template.templateId} acceptance`,
  );
  invariant(
    template.source?.swf?.sha256 === member.source.sha256 &&
      template.source.swf.path.endsWith(`/${member.source.path}`),
    `${template.templateId}: source binding drifted`,
  );
  if (expectedType === "g5-l4-animate-session-unsigned-template") {
    invariant(
      language === null &&
        template.source.sourceModel === "paired-fla-and-shipped-swf" &&
        template.source.fla !== null &&
        template.staging?.releaseReadOnlyFlaCopy?.mode === "0444" &&
        template.staging?.assistFlaWorkingCopy?.mode === "0444" &&
        template.staging?.assistSwfWorkingCopy?.mode === "0444",
      `${template.templateId}: Animate source/staging binding drifted`,
    );
    for (const [key, value] of Object.entries(template.toolchain || {})) {
      assertSha256(value?.sha256, `${template.templateId} ${key}`);
      invariant(value.path && value.bytes > 0, `${template.templateId}: ${key} is incomplete`);
    }
  } else {
    invariant(
      (language === "en" || language === "es") &&
        JSON.stringify(
          template.environment.hostTree.missingDeclaredDependencies,
        ) === JSON.stringify(MISSING_HOST_TREE_DEPENDENCIES),
      `${template.templateId}: runtime language/host-tree boundary drifted`,
    );
    for (const key of ["runner", "jsfl", "executable"]) {
      assertAllNull(
        template.toolchain?.[key],
        ["path", "bytes", "sha256", "mode"],
        `${template.templateId} ${key}`,
      );
    }
    assertAllNull(
      template.staging?.stagedHost,
      ["path", "bytes", "sha256", "mode"],
      `${template.templateId} staged host`,
    );
    invariant(
      template.staging?.manifestSha256 === null &&
        template.staging?.complete === false,
      `${template.templateId}: runtime staging was filled`,
    );
  }
}

export async function buildG5L4PerSessionAuthorizationPreparation({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const [
    releaseRecord,
    operatorRecord,
    ownerDefaultsRecord,
    ownerWorkAuthorizationRecord,
    animateRecord,
    runtimePlanningRecord,
    containmentRecord,
    runnerRecord,
    jsflRecord,
    generatorRecord,
  ] = await Promise.all([
    readJsonRecord(projectRoot, INPUT_PATHS.releaseManifest),
    readJsonRecord(projectRoot, INPUT_PATHS.operatorAssignment),
    readJsonRecord(projectRoot, INPUT_PATHS.ownerDefaultsAuthorization),
    readJsonRecord(projectRoot, INPUT_PATHS.ownerWorkAuthorization),
    readJsonRecord(projectRoot, INPUT_PATHS.animateReadiness),
    readJsonRecord(projectRoot, INPUT_PATHS.runtimePlanningReadiness),
    readJsonRecord(projectRoot, INPUT_PATHS.containmentReadiness),
    readFileRecord(projectRoot, INPUT_PATHS.runner),
    readFileRecord(projectRoot, INPUT_PATHS.jsfl),
    readFileRecord(projectRoot, INPUT_PATHS.generator),
  ]);

  const release = validateReleaseManifest(releaseRecord.document);
  validateOperatorAssignment(operatorRecord.document);
  validateOwnerDefaultsAuthorization(ownerDefaultsRecord.document);
  validateG5L4OwnerWorkAuthorizationReceipt(
    ownerWorkAuthorizationRecord.document,
    {releaseManifest: releaseRecord.document},
  );
  validateContainmentReport(containmentRecord.document);
  const containment = containmentRecord.document;
  validateRuntimePlanningReadiness(runtimePlanningRecord.document, release);

  const runner = descriptor(runnerRecord, {mode: "0644"});
  const jsfl = descriptor(jsflRecord, {mode: "0644"});
  const generator = descriptor(generatorRecord, {mode: "0644"});
  const operatorReceipt = descriptor(operatorRecord);
  const ownerDefaultsReceipt = descriptor(ownerDefaultsRecord);
  const ownerWorkAuthorization = projectG5L4OwnerWorkAuthorization(
    ownerWorkAuthorizationRecord.document,
    descriptor(ownerWorkAuthorizationRecord),
  );
  const animateQueue = validateAnimateReadiness(
    animateRecord.document,
    release,
    runner,
    jsfl,
  );
  const animateExecutable = await readAbsoluteBoundFile(
    animateRecord.document.inputs.adobeAnimate.executable,
    "Adobe Animate executable",
  );

  const queueByAnimationId = new Map(
    animateQueue.map((entry) => [entry.animationId, entry]),
  );
  const animateSessionTemplates = [];
  const originalRuntimeSessionTemplates = [];
  const runtimePlanBindings = [];

  for (const [index, item] of runtimePlanningRecord.document.items.entries()) {
    const member = release.members[index];
    const planRecord = await readJsonRecord(
      projectRoot,
      item.artifact.path,
      `${member.animationId} runtime plan`,
    );
    assertDescriptor(
      descriptor(planRecord),
      {
        path: item.artifact.path,
        bytes: item.artifact.bytes,
        sha256: item.artifact.sha256,
      },
      `${member.animationId} runtime plan`,
    );
    const plan = planRecord.document;
    validatePlan(plan, item, member);
    const source = {
      sourceModel: plan.source.sourceModel,
      fla: null,
      swf: await readBoundProjectFile(
        projectRoot,
        plan.source.swf,
        `${member.animationId} preserved SWF`,
      ),
    };
    if (plan.source.fla) {
      source.fla = await readBoundProjectFile(
        projectRoot,
        plan.source.fla,
        `${member.animationId} preserved FLA`,
      );
    }
    runtimePlanBindings.push(descriptor(planRecord, {
      artifactFingerprintSha256: plan.artifactFingerprintSha256,
    }));

    const queueEntry = queueByAnimationId.get(member.animationId) || null;
    if (source.fla) {
      invariant(queueEntry, `${member.animationId}: Animate queue row is missing`);
      const releaseReadOnlyFlaCopy = await readBoundProjectFile(
        projectRoot,
        queueEntry.releaseStagingCopy,
        `${member.animationId} release FLA staging copy`,
        {requiredMode: "0444"},
      );
      const assistFlaWorkingCopy = await readBoundProjectFile(
        projectRoot,
        queueEntry.pairedAssistPreparation.flaWorkingCopy,
        `${member.animationId} assist FLA working copy`,
        {requiredMode: "0444"},
      );
      const assistSwfWorkingCopy = await readBoundProjectFile(
        projectRoot,
        queueEntry.pairedAssistPreparation.swfWorkingCopy,
        `${member.animationId} assist SWF working copy`,
        {requiredMode: "0444"},
      );
      invariant(
        releaseReadOnlyFlaCopy.sha256 === source.fla.sha256 &&
          assistFlaWorkingCopy.sha256 === source.fla.sha256 &&
          assistSwfWorkingCopy.sha256 === source.swf.sha256,
        `${member.animationId}: staging/source hashes drifted`,
      );
      animateSessionTemplates.push(
        commonTemplate({
          templateType: "g5-l4-animate-session-unsigned-template",
          templateId:
            `animate-${String(member.ordinal).padStart(2, "0")}-${member.animationId}`,
          member,
          language: null,
          plan,
          generator,
          operatorReceipt,
          ownerDefaultsReceipt,
          source,
          staging: {
            releaseReadOnlyFlaCopy,
            assistFlaWorkingCopy,
            assistSwfWorkingCopy,
          },
          toolchain: {
            runner,
            jsfl,
            executable: animateExecutable,
          },
          containmentControls: containment.containmentPlan.controls,
        }),
      );
    } else {
      invariant(
        !queueEntry,
        `${member.animationId}: SWF-only member entered Animate queue`,
      );
    }

    for (const language of ["en", "es"]) {
      originalRuntimeSessionTemplates.push(
        commonTemplate({
          templateType:
            "g5-l4-original-runtime-session-unsigned-template",
          templateId:
            `runtime-${String(member.ordinal).padStart(2, "0")}-${language}-${member.animationId}`,
          member,
          language,
          plan,
          generator,
          operatorReceipt,
          ownerDefaultsReceipt,
          source,
          staging: {
            stagedHost: nullToolDescriptor(),
            manifestSha256: null,
            complete: false,
          },
          toolchain: {
            runner: nullToolDescriptor(),
            jsfl: nullToolDescriptor(),
            executable: nullToolDescriptor(),
          },
          containmentControls: containment.containmentPlan.controls,
          missingHostTreeDependencies: MISSING_HOST_TREE_DEPENDENCIES,
        }),
      );
    }
  }

  invariant(
    animateSessionTemplates.length === 44 &&
      originalRuntimeSessionTemplates.length === 110,
    "session template cardinality drifted",
  );
  const base = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g5-l4-per-session-authorization-preparation",
    evidenceState: "unsigned-non-runnable-session-preparation-only",
    release: {
      releaseId: RELEASE_ID,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      titleDisplay: "Number Lines",
      memberCount: 55,
      flaBackedMemberCount: 44,
      swfOnlyMemberCount: 11,
      releaseFingerprintSha256: sha256Bytes(
        Buffer.from(stableJson(release)),
      ),
    },
    sourceBindings: {
      generator,
      releaseManifest: descriptor(releaseRecord),
      operatorRoleAssignmentReceipt: operatorReceipt,
      ownerDefaultsAuthorizationReceipt: ownerDefaultsReceipt,
      ownerWorkAuthorizationReceipt: descriptor(ownerWorkAuthorizationRecord),
      animateAuthoringReadiness: descriptor(animateRecord),
      runtimePlanningReadiness: descriptor(runtimePlanningRecord),
      containmentReadiness: descriptor(containmentRecord),
      runner,
      jsfl,
      runtimePlans: runtimePlanBindings,
    },
    ownerWorkAuthorization,
    authorityBoundary: {
      ownerDefaultPolicyIntakeBound: true,
      ownerWorkAuthorizationIntakeBound: true,
      machinePreparationAuthorized: true,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      technicalMechanismsSelected: true,
      containmentApproved: false,
      containmentVerified: false,
      runtimeHostApproved: false,
      immutablePerSessionAuthorizationPresent: false,
      perSessionOperatorDeclarationPresent: false,
      animateGuiExecutionAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
      sessionExecuted: false,
      reviewAccepted: false,
      ownerFidelityAccepted: false,
      strictComplete: false,
      publicationAuthorized: false,
      strictAcceptanceEffect:
        "none; unsigned machine preparation plus implementation and runtime-execution work permission only",
    },
    controls: selectedCandidateControls(containment.containmentPlan.controls),
    animateSessionTemplates,
    originalRuntimeSessionTemplates,
    summary: {
      releaseMembers: 55,
      flaBackedMembers: 44,
      swfOnlyMembers: 11,
      animateUnsignedTemplates: 44,
      originalRuntimeEnglishUnsignedTemplates: 55,
      originalRuntimeSpanishUnsignedTemplates: 55,
      originalRuntimeUnsignedTemplates: 110,
      totalUnsignedTemplates: 154,
      ownerWorkAuthorizationReceiptCount: 1,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      filledSessionIds: 0,
      filledNonces: 0,
      filledTtls: 0,
      signatureEnvelopes: 0,
      containmentMechanismsSelected: 8,
      containmentControlsApproved: 0,
      containmentControlsVerified: 0,
      runnableTemplates: 0,
      sessionsExecuted: 0,
      reviewsAccepted: 0,
      strictCompletions: 0,
      publications: 0,
    },
    limitations: [
      "These are unsigned worksheets, not execution authorizations.",
      "The release-level Dr. Peter Hu role receipt does not fill a per-session operator declaration or attestation.",
      "No runtime executable, host, profile, complete host tree, stop condition set, trace schedule, nonce, TTL, or signature is selected or supplied.",
      "The eight machine-selected containment candidates are copied only as acceptance-neutral proposals; Owner approval, live verification, and every exact-session authorization field remain empty.",
      "L4KTE01.xml and L4KTS01.xml remain missing, so CR-02 is incomplete.",
      "The existing Animate and original-runtime full-run guards remain closed.",
    ],
  };
  const report = {
    ...base,
    reportFingerprintSha256: sha256Bytes(Buffer.from(stableJson(base))),
  };
  validateG5L4PerSessionAuthorizationPreparation(report);
  return report;
}

export function validateG5L4PerSessionAuthorizationPreparation(report) {
  invariant(
    report?.schemaVersion === SCHEMA_VERSION &&
      report.reportType ===
        "g5-l4-per-session-authorization-preparation" &&
      report.evidenceState ===
        "unsigned-non-runnable-session-preparation-only",
    "per-session preparation report identity drifted",
  );
  invariant(
    report.release?.releaseId === RELEASE_ID &&
      report.release?.releaseType === "complete-lesson" &&
      report.release?.publicationMode === "atomic" &&
      report.release?.memberCount === 55 &&
      report.release?.flaBackedMemberCount === 44 &&
      report.release?.swfOnlyMemberCount === 11,
    "per-session preparation release scope drifted",
  );
  assertSha256(
    report.release.releaseFingerprintSha256,
    "release fingerprint",
  );
  for (const key of [
    "generator",
    "releaseManifest",
    "operatorRoleAssignmentReceipt",
    "ownerDefaultsAuthorizationReceipt",
    "animateAuthoringReadiness",
    "runtimePlanningReadiness",
    "containmentReadiness",
    "runner",
    "jsfl",
  ]) {
    const value = report.sourceBindings?.[key];
    invariant(value?.path && value.bytes > 0, `${key}: source binding missing`);
    assertSha256(value.sha256, `${key} source binding`);
  }
  const ownerWorkAuthorizationProjectionPresent =
    report.ownerWorkAuthorization !== undefined;
  const ownerWorkAuthorizationBindingPresent =
    report.sourceBindings?.ownerWorkAuthorizationReceipt !== undefined;
  invariant(
    ownerWorkAuthorizationProjectionPresent ===
      ownerWorkAuthorizationBindingPresent,
    "Owner work-authorization projection/binding presence drifted",
  );
  assertExactKeys(
    report,
    [
      "schemaVersion", "reportType", "evidenceState", "release", "sourceBindings",
      ...(ownerWorkAuthorizationProjectionPresent ? ["ownerWorkAuthorization"] : []),
      "authorityBoundary", "controls", "animateSessionTemplates",
      "originalRuntimeSessionTemplates", "summary", "limitations",
      "reportFingerprintSha256",
    ],
    "per-session preparation report",
  );
  assertNoG5L4ProtectedGatePromotion(report, {
    label: "per-session preparation report",
  });
  if (ownerWorkAuthorizationProjectionPresent) {
    const value = report.sourceBindings.ownerWorkAuthorizationReceipt;
    invariant(
      value.path === INPUT_PATHS.ownerWorkAuthorization && value.bytes > 0,
      "Owner work-authorization source binding drifted",
    );
    assertSha256(value.sha256, "Owner work-authorization source binding");
    validateG5L4OwnerWorkAuthorizationProjection(
      report.ownerWorkAuthorization,
      value,
    );
  }
  invariant(
    Array.isArray(report.sourceBindings?.runtimePlans) &&
      report.sourceBindings.runtimePlans.length === 55,
    "runtime plan binding count drifted",
  );
  assertExactKeys(
    report.authorityBoundary,
    [
      "ownerDefaultPolicyIntakeBound",
      ...(ownerWorkAuthorizationProjectionPresent
        ? ["ownerWorkAuthorizationIntakeBound", "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized"]
        : []),
      "machinePreparationAuthorized", "technicalMechanismsSelected",
      "containmentApproved", "containmentVerified", "runtimeHostApproved",
      "immutablePerSessionAuthorizationPresent", "perSessionOperatorDeclarationPresent",
      "animateGuiExecutionAuthorized", "originalRuntimeExecutionAuthorized",
      "sessionExecuted", "reviewAccepted", "ownerFidelityAccepted", "strictComplete",
      "publicationAuthorized", "strictAcceptanceEffect",
    ],
    "report authority boundary",
  );
  assertAllFalse(
    report.authorityBoundary,
    [
      "containmentApproved",
      "containmentVerified",
      "runtimeHostApproved",
      "immutablePerSessionAuthorizationPresent",
      "perSessionOperatorDeclarationPresent",
      "animateGuiExecutionAuthorized",
      "originalRuntimeExecutionAuthorized",
      "sessionExecuted",
      "reviewAccepted",
      "ownerFidelityAccepted",
      "strictComplete",
      "publicationAuthorized",
    ],
    "report authority boundary",
  );
  invariant(
    report.authorityBoundary?.ownerDefaultPolicyIntakeBound === true &&
      (ownerWorkAuthorizationProjectionPresent
        ? report.authorityBoundary.ownerWorkAuthorizationIntakeBound === true &&
          report.authorityBoundary.implementationWorkAuthorized === true &&
          report.authorityBoundary.runtimeExecutionWorkAuthorized === true
        : report.authorityBoundary.ownerWorkAuthorizationIntakeBound === undefined &&
          report.authorityBoundary.implementationWorkAuthorized === undefined &&
          report.authorityBoundary.runtimeExecutionWorkAuthorized === undefined) &&
      report.authorityBoundary?.machinePreparationAuthorized === true &&
      report.authorityBoundary.technicalMechanismsSelected === true &&
      report.authorityBoundary?.strictAcceptanceEffect ===
        (ownerWorkAuthorizationProjectionPresent
          ? "none; unsigned machine preparation plus implementation and runtime-execution work permission only"
          : "none; unsigned machine preparation only"),
    "report preparation authority drifted",
  );
  validateSelectedCandidateControls(report.controls, "report controls");
  invariant(
    Array.isArray(report.animateSessionTemplates) &&
      report.animateSessionTemplates.length === 44 &&
      Array.isArray(report.originalRuntimeSessionTemplates) &&
      report.originalRuntimeSessionTemplates.length === 110,
    "report template counts drifted",
  );
  const releaseIds = new Map();
  for (const template of report.originalRuntimeSessionTemplates) {
    const identity = template.identity;
    if (!releaseIds.has(identity.releaseOrdinal)) {
      releaseIds.set(identity.releaseOrdinal, {
        ordinal: identity.releaseOrdinal,
        animationId: identity.animationId,
        assetId: identity.assetId,
        languages: [],
      });
    }
    const entry = releaseIds.get(identity.releaseOrdinal);
    invariant(
      entry.animationId === identity.animationId &&
        entry.assetId === identity.assetId,
      `${identity.animationId}: runtime language identities disagree`,
    );
    entry.languages.push(identity.language);
  }
  invariant(
    releaseIds.size === 55 &&
      [...releaseIds.entries()].every(
        ([ordinal, entry], index) =>
          ordinal === index + 1 &&
          JSON.stringify(entry.languages) === JSON.stringify(["en", "es"]),
      ),
    "runtime templates do not cover every member in EN/ES order",
  );
  const runtimeMembers = new Map(
    [...releaseIds.values()].map((entry) => [
      entry.animationId,
      {
        ordinal: entry.ordinal,
        animationId: entry.animationId,
        assetId: entry.assetId,
        source: {
          path: report.originalRuntimeSessionTemplates.find(
            (template) =>
              template.identity.animationId === entry.animationId,
          ).source.swf.path.replace(/^.*(?=HELP_COURSES\/)/u, ""),
          sha256: entry.assetId.slice(4),
        },
      },
    ]),
  );
  const operatorReceipt =
    report.sourceBindings.operatorRoleAssignmentReceipt;
  const ownerDefaultsReceipt =
    report.sourceBindings.ownerDefaultsAuthorizationReceipt;
  const generator = report.sourceBindings.generator;
  const templateIds = new Set();
  for (const template of report.originalRuntimeSessionTemplates) {
    const member = runtimeMembers.get(template.identity.animationId);
    invariant(member, `${template.templateId}: runtime member is missing`);
    validateUnsignedTemplate(template, {
      expectedType:
        "g5-l4-original-runtime-session-unsigned-template",
      member,
      language: template.identity.language,
      operatorReceipt,
      ownerDefaultsReceipt,
      generator,
    });
    invariant(
      !templateIds.has(template.templateId),
      `${template.templateId}: duplicate templateId`,
    );
    templateIds.add(template.templateId);
  }
  for (const template of report.animateSessionTemplates) {
    const member = runtimeMembers.get(template.identity.animationId);
    invariant(member, `${template.templateId}: Animate member is missing`);
    validateUnsignedTemplate(template, {
      expectedType: "g5-l4-animate-session-unsigned-template",
      member,
      language: null,
      operatorReceipt,
      ownerDefaultsReceipt,
      generator,
    });
    invariant(
      !templateIds.has(template.templateId),
      `${template.templateId}: duplicate templateId`,
    );
    templateIds.add(template.templateId);
  }
  invariant(
    templateIds.size === 154,
    "template IDs are not unique and complete",
  );
  const summary = report.summary;
  assertExactKeys(
    summary,
    [
      "releaseMembers", "flaBackedMembers", "swfOnlyMembers",
      "animateUnsignedTemplates", "originalRuntimeEnglishUnsignedTemplates",
      "originalRuntimeSpanishUnsignedTemplates", "originalRuntimeUnsignedTemplates",
      "totalUnsignedTemplates",
      ...(ownerWorkAuthorizationProjectionPresent
        ? ["ownerWorkAuthorizationReceiptCount", "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized"]
        : []),
      "filledSessionIds", "filledNonces", "filledTtls", "signatureEnvelopes",
      "containmentMechanismsSelected", "containmentControlsApproved",
      "containmentControlsVerified", "runnableTemplates", "sessionsExecuted",
      "reviewsAccepted", "strictCompletions", "publications",
    ],
    "per-session preparation summary",
  );
  invariant(
    summary?.releaseMembers === 55 &&
      summary.flaBackedMembers === 44 &&
      summary.swfOnlyMembers === 11 &&
      summary.animateUnsignedTemplates === 44 &&
      summary.originalRuntimeEnglishUnsignedTemplates === 55 &&
      summary.originalRuntimeSpanishUnsignedTemplates === 55 &&
      summary.originalRuntimeUnsignedTemplates === 110 &&
      summary.totalUnsignedTemplates === 154 &&
      (ownerWorkAuthorizationProjectionPresent
        ? summary.ownerWorkAuthorizationReceiptCount === 1 &&
          summary.implementationWorkAuthorized === true &&
          summary.runtimeExecutionWorkAuthorized === true
        : summary.ownerWorkAuthorizationReceiptCount === undefined &&
          summary.implementationWorkAuthorized === undefined &&
          summary.runtimeExecutionWorkAuthorized === undefined),
    "summary cardinality drifted",
  );
  for (const key of [
    "filledSessionIds",
    "filledNonces",
    "filledTtls",
    "signatureEnvelopes",
    "containmentControlsApproved",
    "containmentControlsVerified",
    "runnableTemplates",
    "sessionsExecuted",
    "reviewsAccepted",
    "strictCompletions",
    "publications",
  ]) {
    invariant(summary[key] === 0, `summary ${key} must remain zero`);
  }
  invariant(
    summary.containmentMechanismsSelected === 8,
    "summary containmentMechanismsSelected must remain eight machine candidates",
  );
  assertSha256(report.reportFingerprintSha256, "report fingerprint");
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(
    reportFingerprintSha256 ===
      sha256Bytes(Buffer.from(stableJson(withoutFingerprint))),
    "report fingerprint drifted",
  );
  return true;
}

export function renderMarkdown(report) {
  validateG5L4PerSessionAuthorizationPreparation(report);
  return [
    "# G5 L4 per-session authorization and operator-declaration preparation",
    "",
    "> Machine-generated, unsigned, non-runnable preparation only. This report does not authorize or launch Adobe Animate, Adobe Projector, a browser, or any legacy endpoint.",
    "",
    "## Exact scope",
    "",
    `- Release: **${report.release.releaseId}**; atomic members: **55**.`,
    "- Source model: **44** paired FLA/SWF members; **11** SWF-only members.",
    "- Animate unsigned session templates: **44**.",
    "- Original-runtime unsigned templates: **110** (**55 EN + 55 ES**).",
    "- Total unsigned templates: **154**.",
    "",
    "## Empty per-session fields",
    "",
    "- Session ID / nonce / TTL / signature envelope: **0 / 0 / 0 / 0 filled**.",
    "- Runtime executable, exact host, disposable profile, complete host tree, trace schedule, and stop-condition set remain null or empty.",
    "- CR-01 through CR-08: **8 machine-selected candidates / 8 offline-checked / 0 Owner-approved / 0 live-verified**.",
    "- Per-session operator declarations: **0**. The release-level expected operator remains Dr. Peter Hu, but the role receipt is not a session attestation.",
    "",
    "## Closed effects",
    "",
    "- Runnable templates / executed sessions: **0 / 0**.",
    "- Reviews / strict completions / publications: **0 / 0 / 0**.",
    "- `L4KTE01.xml` and `L4KTS01.xml` remain missing; CR-02 is incomplete.",
    "- Existing full-run guards remain unchanged and closed.",
    "",
    `Report fingerprint: \`${report.reportFingerprintSha256}\``,
    "",
  ].join("\n");
}

function outputPaths(projectRoot, outputPrefix) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("reports/") &&
      outputPrefix !== "reports/" &&
      !outputPrefix.includes("\\") &&
      !path.posix.isAbsolute(outputPrefix) &&
      path.posix.normalize(outputPrefix) === outputPrefix &&
      path.posix.extname(outputPrefix) === "",
    "--output-prefix must be a normalized extensionless path below reports/",
  );
  return {
    json: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.json`,
      "JSON output",
    ),
    markdown: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.md`,
      "Markdown output",
    ),
  };
}

async function ensureSafeDirectoryPath(projectRoot, directory, create) {
  invariant(isWithin(projectRoot, directory), "output directory escapes project root");
  const relative = path.relative(projectRoot, directory);
  let cursor = projectRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let metadata = await lstat(cursor).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata && create) {
      await mkdir(cursor);
      metadata = await lstat(cursor);
    }
    invariant(metadata, `${portable(path.relative(projectRoot, cursor))}: directory is missing`);
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
  }
  const [realRoot, realDirectory] = await Promise.all([
    realpath(projectRoot),
    realpath(directory),
  ]);
  invariant(
    isWithin(realRoot, realDirectory),
    "output directory resolves outside project root",
  );
}

async function existingOutputState(file, projectRoot) {
  const relative = portable(path.relative(projectRoot, file));
  const before = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!before) return null;
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${relative}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(file);
  const after = await lstat(file);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${relative}: output target changed during read`,
  );
  return {
    dev: after.dev,
    ino: after.ino,
    mtimeMs: after.mtimeMs,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
  };
}

async function assertOutputUnchanged(file, prior, projectRoot) {
  const current = await existingOutputState(file, projectRoot);
  if (!prior) {
    invariant(!current, `${portable(path.relative(projectRoot, file))}: output appeared during transaction`);
    return;
  }
  invariant(
    current &&
      current.dev === prior.dev &&
      current.ino === prior.ino &&
      current.mtimeMs === prior.mtimeMs &&
      current.bytes === prior.bytes &&
      current.sha256 === prior.sha256,
    `${portable(path.relative(projectRoot, file))}: output changed during transaction`,
  );
}

async function scratchMustBeAbsent(file, projectRoot) {
  const metadata = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  invariant(
    metadata === null,
    `${portable(path.relative(projectRoot, file))}: transaction scratch path already exists`,
  );
}

async function unlinkExpected(file, expectedSha256, projectRoot) {
  const state = await existingOutputState(file, projectRoot);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${portable(path.relative(projectRoot, file))}: refusing to remove an unowned file`,
  );
  await unlink(file);
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
  transactionHook = null,
} = {}) {
  validateG5L4PerSessionAuthorizationPreparation(report);
  const projectRoot = path.resolve(projectRootOption);
  const outputs = outputPaths(projectRoot, outputPrefix);
  const outputDirectory = path.dirname(outputs.json);
  await ensureSafeDirectoryPath(projectRoot, outputDirectory, !check);
  const expected = {
    json: stableJson(report),
    markdown: renderMarkdown(report),
  };
  if (check) {
    const [json, markdown] = await Promise.all([
      readFileRecord(
        projectRoot,
        portable(path.relative(projectRoot, outputs.json)),
        "per-session preparation JSON output",
      ),
      readFileRecord(
        projectRoot,
        portable(path.relative(projectRoot, outputs.markdown)),
        "per-session preparation Markdown output",
      ),
    ]);
    invariant(
      json.contents.toString("utf8") === expected.json,
      "per-session preparation JSON output is stale",
    );
    invariant(
      markdown.contents.toString("utf8") === expected.markdown,
      "per-session preparation Markdown output is stale",
    );
    return {
      action: "verified",
      outputs: [descriptor(json), descriptor(markdown)],
    };
  }

  const transactionId = randomUUID();
  const entries = [
    {file: outputs.json, contents: expected.json},
    {file: outputs.markdown, contents: expected.markdown},
  ].map((entry) => ({
    ...entry,
    temporary: `${entry.file}.tmp-${transactionId}`,
    backup: `${entry.file}.bak-${transactionId}`,
    expectedSha256: sha256Bytes(Buffer.from(entry.contents)),
  }));
  const prepared = [];
  let installedCount = 0;
  try {
    for (const entry of entries) {
      await scratchMustBeAbsent(entry.temporary, projectRoot);
      await scratchMustBeAbsent(entry.backup, projectRoot);
      entry.prior = await existingOutputState(entry.file, projectRoot);
      await writeFile(entry.temporary, entry.contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o644,
      });
      const temporary = await existingOutputState(entry.temporary, projectRoot);
      invariant(
        temporary?.sha256 === entry.expectedSha256,
        `${portable(path.relative(projectRoot, entry.temporary))}: staged output drifted`,
      );
      prepared.push(entry);
    }
    if (transactionHook) {
      await transactionHook({phase: "after-stage", index: null, target: null});
    }
    for (const entry of entries) {
      await assertOutputUnchanged(entry.file, entry.prior, projectRoot);
    }
    for (const entry of entries) {
      if (entry.prior) await rename(entry.file, entry.backup);
    }
    for (const [index, entry] of entries.entries()) {
      if (transactionHook) {
        await transactionHook({
          phase: "before-install",
          index,
          target: portable(path.relative(projectRoot, entry.file)),
        });
      }
      await rename(entry.temporary, entry.file);
      installedCount += 1;
    }
    for (const entry of entries) {
      const state = await existingOutputState(entry.file, projectRoot);
      invariant(
        state?.sha256 === entry.expectedSha256,
        `${portable(path.relative(projectRoot, entry.file))}: post-write verification failed`,
      );
    }
    for (const entry of entries) {
      if (entry.prior) {
        await unlinkExpected(entry.backup, entry.prior.sha256, projectRoot);
      }
    }
  } catch (error) {
    let rollbackError = null;
    try {
      for (let index = installedCount - 1; index >= 0; index -= 1) {
        const entry = entries[index];
        await unlinkExpected(entry.file, entry.expectedSha256, projectRoot);
      }
      for (const entry of [...entries].reverse()) {
        const backupState = await existingOutputState(entry.backup, projectRoot);
        if (backupState) {
          invariant(
            entry.prior && backupState.sha256 === entry.prior.sha256,
            `${portable(path.relative(projectRoot, entry.backup))}: rollback backup drifted`,
          );
          await rename(entry.backup, entry.file);
        }
      }
      for (const entry of prepared) {
        await unlinkExpected(
          entry.temporary,
          entry.expectedSha256,
          projectRoot,
        );
      }
    } catch (caught) {
      rollbackError = caught;
    }
    if (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "per-session preparation transaction failed and rollback did not complete",
      );
    }
    throw error;
  }

  const [json, markdown] = await Promise.all([
    readFileRecord(
      projectRoot,
      portable(path.relative(projectRoot, outputs.json)),
      "per-session preparation JSON output",
    ),
    readFileRecord(
      projectRoot,
      portable(path.relative(projectRoot, outputs.markdown)),
      "per-session preparation Markdown output",
    ),
  ]);
  return {
    action: "written",
    outputs: [descriptor(json), descriptor(markdown)],
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    outputPrefix: DEFAULT_OUTPUT_PREFIX,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") {
      options.check = true;
    } else if (value === "--output-prefix") {
      options.outputPrefix = argv[++index];
      invariant(options.outputPrefix, "--output-prefix requires a value");
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  outputPaths(DEFAULT_PROJECT_ROOT, options.outputPrefix);
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildG5L4PerSessionAuthorizationPreparation();
  const result = await writeOrCheck({report, ...options});
  process.stdout.write(stableJson(result));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
