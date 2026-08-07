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
  G5_L4_WORK_STUDY_READINESS_IDS,
  validateG5L4WorkStudyStrictReadiness,
} from "./build-g5-l4-work-study-strict-readiness.mjs";
import {
  G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
} from "./build-lesson-static-strict-readiness.mjs";
import {
  validateG5L4OwnerDefaultBlockersAuthorizationReceipt,
  validateG5L4OriginalRuntimeContainmentReadiness,
} from "./build-g5-l4-original-runtime-containment-readiness.mjs";
import {
  G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  assertNoG5L4ProtectedGatePromotion,
  projectG5L4OwnerWorkAuthorization,
  validateG5L4OwnerWorkAuthorizationProjection,
  validateG5L4OwnerWorkAuthorizationReceipt,
} from "./lib/g5-l4-owner-work-authorization.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const DEFAULT_OUTPUT_PREFIX = "reports/g5-l4-m1-machine-foundation-readiness";
const SHA256 = /^[a-f0-9]{64}$/;
const G5_L4_INTAKE_RELEASE_MANIFEST_SHA256 =
  "ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375";
const G5_L4_RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const SOURCE_STATIC_CANDIDATE_RENDERING =
  "source-static Canvas engineering candidate; root host entry, Spanish visuals, audio, source controls, Replay, natural runtime reachability, original-runtime parity, and strict fidelity fail closed";
const SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS = Object.freeze([
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
]);
const SOURCE_STATIC_ENGINEERING_CANDIDATE_ORDINALS = Object.freeze([
  ...Array.from({length: 52}, (_, index) => index + 1),
]);
const SOURCE_STATIC_ENGINEERING_CANDIDATES = Object.freeze(
  Object.fromEntries(SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.map(
    (animationId, index) => {
      const profile = G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[animationId];
      if (!profile) {
        throw new Error(`${animationId}: shared engineering-candidate profile is missing`);
      }
      const renderedFrameCount =
        profile.renderedFrameCount ?? profile.nestedFrameCount;
      return [animationId, Object.freeze({
        ...profile,
        ordinal: SOURCE_STATIC_ENGINEERING_CANDIDATE_ORDINALS[index],
        frameCount: profile.nestedFrameCount,
        renderedFrameCount,
        blockedTailFrameCount:
          profile.nestedFrameCount - renderedFrameCount,
        manifestBound: profile.manifestBound !== false,
        nestedCoverageDeclared: profile.nestedCoverageDeclared !== false,
        candidateKind:
          profile.candidateKind ??
          (renderedFrameCount === profile.nestedFrameCount
            ? "single-sprite-full"
            : "single-sprite-safe-prefix"),
      })];
    },
  )),
);

const INPUT_PATHS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  m1AuthorizationReceipt: "catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json",
  operatorAssignmentReceipt: "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
  ownerDefaultBlockersAuthorizationReceipt: "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  ownerWorkAuthorizationReceipt: G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  m0OwnerGovernanceReceipt: "catalog/owner-authorizations/g5-l4-m0-owner-governance-intake-2026-07-28.json",
  m0GovernanceRequirements: "catalog/lesson-release-m0-governance.json",
  sourceScope: "reports/g5-l4-source-scope-freeze.json",
  sourceGap: "reports/g5-l4-source-gap-forensics.json",
  workspace: "reports/g5-l4-workspace-readiness.json",
  audio: "reports/g5-l4-audio-ownership-readiness.json",
  animate: "reports/g5-l4-animate-authoring-operator-readiness.json",
  runtime: "reports/g05-l04-number-lines-runtime-acquisition-planning-readiness.json",
  containment: "reports/g5-l4-original-runtime-containment-readiness.json",
  risk: "reports/g5-l4-risk-calibration.json",
  promotion: "reports/g5-l4-promotion-security-readiness.json",
  m0: "reports/g5-l4-m0-governance-readiness.json",
});

const M0_PACKET_KEYS = Object.freeze({
  sourceScopeFreeze: "sourceScope",
  sourceGapForensics: "sourceGap",
  workspaceReadiness: "workspace",
  audioOwnershipReadiness: "audio",
  animateOperatorReadiness: "animate",
  runtimeAcquisitionPlanning: "runtime",
  riskCalibration: "risk",
  promotionSecurityReadiness: "promotion",
});

const SPECIFICATION_INVENTORY_GENERATOR =
  "scripts/materialize-g5-l4-work-study-specification-inventories.mjs";
const SOURCE_DERIVED_KEYFRAME_SUCCESSOR_RECEIPT =
  "reports/g5-l4-source-derived-keyframe-candidate-successor-receipt.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertExactKeys(value, expectedKeys, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value) &&
      JSON.stringify(Object.keys(value).sort()) ===
        JSON.stringify([...expectedKeys].sort()),
    `${label}: exact key set drifted`,
  );
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function orderedProjectionSha256(value) {
  return sha256Bytes(Buffer.from(`${JSON.stringify(value, null, 2)}\n`));
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label}: path is empty`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label}: path must be project-relative and portable`);
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes the project root`);
  invariant(portable(path.relative(projectRoot, absolutePath)) === relativePath, `${label}: path is not normalized`);
  return absolutePath;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

export async function readFileRecord(projectRoot, relativePath, label = relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const metadataBefore = await assertOrdinaryFile(absolutePath, label);
  const [bytes, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside the project root`);
  const metadataAfter = await assertOrdinaryFile(absolutePath, label);
  invariant(
    metadataBefore.dev === metadataAfter.dev &&
      metadataBefore.ino === metadataAfter.ino &&
      metadataAfter.size === bytes.length &&
      metadataBefore.mtimeMs === metadataAfter.mtimeMs,
    `${label}: changed during read`,
  );
  return {
    path: relativePath,
    absolutePath,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    contents: bytes,
  };
}

async function readJsonRecord(projectRoot, relativePath, label = relativePath) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {...record, document: JSON.parse(record.contents.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function assertDescriptor(actual, expected, label) {
  invariant(actual && typeof actual === "object", `${label}: descriptor is missing`);
  invariant(
    actual.path === expected.path &&
      actual.bytes === expected.bytes &&
      actual.sha256 === expected.sha256,
    `${label}: descriptor drifted`,
  );
}

function assertAllFalse(value, keys, label) {
  for (const key of keys) invariant(value?.[key] === false, `${label}: ${key} must remain false`);
}

function assertSafeId(value, label) {
  invariant(/^[a-z0-9][a-z0-9-]{2,127}$/.test(value || ""), `${label}: unsafe identifier`);
}

function validateRelease(releaseManifest) {
  invariant(
    releaseManifest?.schemaVersion === 1 && Array.isArray(releaseManifest.releases),
    "lesson release manifest is malformed",
  );
  const matches = releaseManifest.releases.filter((release) => release?.releaseId === RELEASE_ID);
  invariant(matches.length === 1, `${RELEASE_ID}: expected exactly one release definition`);
  const release = matches[0];
  invariant(release.releaseType === "complete-lesson", `${RELEASE_ID}: releaseType drifted`);
  invariant(release.publicationMode === "atomic", `${RELEASE_ID}: publicationMode must remain atomic`);
  invariant(release.expectedCounts?.members === 55, `${RELEASE_ID}: expected member count drifted`);
  invariant(release.expectedCounts?.activeXmlReferencedPages === 54, `${RELEASE_ID}: page count drifted`);
  invariant(release.expectedCounts?.courseShells === 1, `${RELEASE_ID}: shell count drifted`);
  invariant(release.expectedCounts?.shards === 3, `${RELEASE_ID}: shard count drifted`);
  invariant(Array.isArray(release.members) && release.members.length === 55, `${RELEASE_ID}: release membership is incomplete`);
  invariant(Array.isArray(release.shards) && release.shards.length === 3, `${RELEASE_ID}: release shards are incomplete`);

  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member.ordinal === index + 1, `${RELEASE_ID}: member ordinals are not contiguous`);
    assertSafeId(member.animationId, `${RELEASE_ID} member animationId`);
    invariant(!animationIds.has(member.animationId), `${RELEASE_ID}: duplicate animationId ${member.animationId}`);
    invariant(!assetIds.has(member.assetId), `${RELEASE_ID}: duplicate assetId ${member.assetId}`);
    invariant(SHA256.test(member.source?.sha256 || ""), `${member.animationId}: invalid source SHA-256`);
    invariant(member.assetId === `swf-${member.source.sha256}`, `${member.animationId}: assetId/source hash mismatch`);
    invariant(
      typeof member.source.path === "string" &&
        member.source.path.endsWith(".swf") &&
        !path.posix.isAbsolute(member.source.path) &&
        !member.source.path.includes("\\") &&
        !member.source.path.split("/").includes("..") &&
        path.posix.normalize(member.source.path) === member.source.path,
      `${member.animationId}: unsafe source path`,
    );
    animationIds.add(member.animationId);
    assetIds.add(member.assetId);
  }
  const shardIds = new Set(release.shards.map(({shardId}) => shardId));
  invariant(shardIds.size === 3, `${RELEASE_ID}: shard IDs are not unique`);
  for (const shard of release.shards) {
    assertSafeId(shard.shardId, `${RELEASE_ID} shardId`);
    invariant(
      release.members.filter((member) => member.shardId === shard.shardId).length === shard.memberCount,
      `${RELEASE_ID}/${shard.shardId}: shard member count drifted`,
    );
  }
  invariant(release.members.every((member) => shardIds.has(member.shardId)), `${RELEASE_ID}: member references an unknown shard`);
  invariant(
    release.members.filter(({releaseRole}) => releaseRole === "active-xml-referenced-page").length === 54 &&
      release.members.filter(({releaseRole}) => releaseRole === "course-shell").length === 1,
    `${RELEASE_ID}: page/shell role partition drifted`,
  );
  invariant(
    sha256Bytes(Buffer.from(stableJson(release))) ===
      G5_L4_RELEASE_FINGERPRINT_SHA256,
    `${RELEASE_ID}: current release fingerprint drifted from the intake-equivalent scope`,
  );
  return release;
}

function validateM1Receipt(receipt, receiptRecord, releaseRecord, sourceScopeRecord) {
  invariant(receipt.schemaVersion === 1, "M1 receipt schemaVersion drifted");
  invariant(receipt.evidenceType === "g5-l4-user-stated-owner-m1-authorization-intake", "M1 receipt evidenceType drifted");
  invariant(receipt.releaseId === RELEASE_ID, "M1 receipt release identity drifted");
  invariant(receipt.channel === "current-codex-task", "M1 receipt channel drifted");
  invariant(receipt.ownerStatement?.exactUtf8 === "Owner是Dr. Peter Hu\n\n明确授权 M1", "M1 Owner directive text drifted");
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8, "utf8");
  invariant(receipt.ownerStatement.byteLength === statementBytes.length, "M1 Owner directive byte length drifted");
  invariant(receipt.ownerStatement.sha256 === sha256Bytes(statementBytes), "M1 Owner directive hash drifted");
  invariant(receipt.identity?.ownerFullName === "Dr. Peter Hu" && receipt.identity?.ownerRole === "Owner", "M1 Owner identity drifted");
  invariant(receipt.identity?.externalSubjectId === null, "M1 receipt invented an external subject");
  invariant(receipt.authorization?.phase === "M1" && receipt.authorization?.explicit === true, "M1 phase authorization drifted");
  invariant(receipt.externalSignatureEnvelope === null, "M1 intake may not claim an external signature");
  invariant(receipt.authorityBoundary?.ownerIdentityUserAttested === true, "M1 user attestation is missing");
  invariant(receipt.authorityBoundary?.ownerIdentityCryptographicallyVerified === false, "M1 receipt invented cryptographic identity");
  invariant(receipt.authorityBoundary?.machineOnlyM1FidelityTrancheAuthorized === true, "M1 machine-only tranche is not authorized");
  assertAllFalse(receipt.authorityBoundary, [
    "animateGuiExecutionAuthorizedByThisIntakeAlone",
    "formalRoadmapSignoffEstablished",
    "humanReviewAccepted",
    "m0ExitEstablished",
    "originalRuntimeExecutionAuthorizedByThisIntakeAlone",
    "ownerFidelityAcceptanceEstablished",
    "publicationAuthorized",
    "rendererImplementationAuthorizedByThisIntakeAlone",
    "strictCompletionEstablished",
  ], "M1 receipt authority boundary");
  invariant(receipt.authorityBoundary?.strictAcceptanceEffect === "m1-start-only", "M1 receipt acceptance effect drifted");
  invariant(
    receipt.sourceBindingsAtIntake?.releaseManifest?.path === releaseRecord.path &&
      receipt.sourceBindingsAtIntake.releaseManifest.sha256 ===
        G5_L4_INTAKE_RELEASE_MANIFEST_SHA256,
    "M1 receipt historical release-manifest intake binding drifted",
  );
  invariant(
    receipt.sourceBindingsAtIntake?.sourceScopeFreeze?.path === sourceScopeRecord.path &&
      receipt.sourceBindingsAtIntake.sourceScopeFreeze.sha256 === sourceScopeRecord.sha256,
    "M1 receipt source-scope binding drifted",
  );
  invariant(SHA256.test(receiptRecord.sha256), "M1 receipt file hash is invalid");
}

function validateOperatorAssignmentReceipt(
  receipt,
  receiptRecord,
  ownerGovernanceRecord,
  governanceRecord,
  m1AuthorizationRecord,
  releaseRecord,
  sourceScopeRecord,
) {
  invariant(receipt.schemaVersion === 1, "operator assignment receipt schemaVersion drifted");
  invariant(
    receipt.evidenceType === "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake",
    "operator assignment receipt evidenceType drifted",
  );
  invariant(receipt.releaseId === RELEASE_ID, "operator assignment release identity drifted");
  invariant(receipt.channel === "current-codex-task", "operator assignment channel drifted");
  invariant(
    receipt.ownerStatement?.exactUtf8 === "原始运行时／Animate 的具名人工操作员是Dr. Peter Hu",
    "operator assignment statement drifted",
  );
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8, "utf8");
  invariant(receipt.ownerStatement.byteLength === statementBytes.length, "operator assignment statement byte length drifted");
  invariant(receipt.ownerStatement.sha256 === sha256Bytes(statementBytes), "operator assignment statement hash drifted");
  invariant(
    receipt.assigningAuthority?.ownerFullName === "Dr. Peter Hu" &&
      receipt.assigningAuthority.ownerRole === "Owner" &&
      receipt.assigningAuthority.externalSubjectId === null,
    "operator assigning authority drifted",
  );
  invariant(
    receipt.assignment?.roleId === "authorized-original-runtime-operator" &&
      receipt.assignment.slot === "primary" &&
      receipt.assignment.assigneeFullName === "Dr. Peter Hu" &&
      receipt.assignment.samePersonAsOwner === true &&
      receipt.assignment.explicit === true,
    "operator assignment identity or slot drifted",
  );
  invariant(
    receipt.capacity?.minimumRequiredHoursPerWeek === 20 &&
      receipt.capacity.committedHoursPerWeek === null &&
      receipt.capacity.status === "not-stated",
    "operator assignment fabricated weekly capacity",
  );
  invariant(receipt.externalSignatureEnvelope === null, "operator assignment invented an external signature");
  invariant(
    receipt.authorityBoundary?.assignmentUserAttested === true &&
      receipt.authorityBoundary.assigneeIdentityCryptographicallyVerified === false &&
      receipt.authorityBoundary.namedHumanRoleAssignmentEstablished === true &&
      receipt.authorityBoundary.namedRoleSlotCountEffect === 1,
    "operator assignment role boundary drifted",
  );
  assertAllFalse(receipt.authorityBoundary, [
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
  ], "operator assignment authority boundary");
  invariant(
    receipt.authorityBoundary.strictAcceptanceEffect === "named-primary-operator-role-only",
    "operator assignment acceptance effect drifted",
  );
  invariant(
    receipt.sourceBindingsAtIntake?.m1OwnerAuthorization?.path === m1AuthorizationRecord.path &&
      receipt.sourceBindingsAtIntake.m1OwnerAuthorization.sha256 === m1AuthorizationRecord.sha256,
    "operator assignment M1 receipt binding drifted",
  );
  invariant(
    receipt.sourceBindingsAtIntake?.releaseManifest?.path === releaseRecord.path &&
      receipt.sourceBindingsAtIntake.releaseManifest.sha256 ===
        G5_L4_INTAKE_RELEASE_MANIFEST_SHA256,
    "operator assignment historical release-manifest intake binding drifted",
  );
  invariant(
    receipt.sourceBindingsAtIntake?.sourceScopeFreeze?.path === sourceScopeRecord.path &&
      receipt.sourceBindingsAtIntake.sourceScopeFreeze.sha256 === sourceScopeRecord.sha256,
    "operator assignment source-scope binding drifted",
  );

  const governance = governanceRecord.document;
  invariant(governance.schemaVersion === 4 && Array.isArray(governance.releases), "M0 governance requirements schema drifted");
  const releaseEntries = governance.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(releaseEntries.length === 1, "M0 governance requirements release identity drifted");
  const governanceRelease = releaseEntries[0];
  const roles = governanceRelease.requiredRoles;
  invariant(Array.isArray(roles) && roles.length === 6, "M0 governance role set drifted");
  const operatorRole = roles.find(({roleId}) => roleId === "authorized-original-runtime-operator");
  invariant(operatorRole?.minimumPrimaryHoursPerWeek === 20, "M0 governance operator capacity floor drifted");
  assertDescriptor(
    operatorRole?.primaryAssignmentReceipt,
    descriptor(receiptRecord),
    "M0 governance primary operator assignment receipt",
  );
  invariant(
    roles.flatMap((role) => [role.primaryAssignmentReceipt, role.backupAssignmentReceipt])
      .filter((value) => value !== null).length === 12,
    "M0 governance does not bind all twelve user-attested role-slot intents",
  );
  for (const role of roles) {
    for (const slot of ["primary", "backup"]) {
      const assignment = role[`${slot}AssignmentReceipt`];
      const expected =
        role.roleId === "authorized-original-runtime-operator" && slot === "primary"
          ? descriptor(receiptRecord)
          : descriptor(ownerGovernanceRecord);
      assertDescriptor(
        assignment,
        expected,
        `M0 governance ${role.roleId}/${slot} assignment receipt`,
      );
    }
  }
  assertDescriptor(
    governanceRelease.staffingCapacityReceipt,
    descriptor(ownerGovernanceRecord),
    "M0 governance staffing-capacity receipt",
  );
}

function validateOwnerGovernanceReceipt(
  receipt,
  receiptRecord,
  releaseRecord,
  sourceScopeRecord,
  sourceGapRecord,
  m1AuthorizationRecord,
  operatorAssignmentRecord,
) {
  invariant(receipt.schemaVersion === 1, "M0 Owner-governance receipt schemaVersion drifted");
  invariant(
    receipt.evidenceType === "g5-l4-user-stated-owner-m0-governance-intake" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.channel === "current-codex-task",
    "M0 Owner-governance receipt identity drifted",
  );
  invariant(
    receipt.ownerIdentity?.ownerFullName === "Dr. Peter Hu" &&
      receipt.ownerIdentity.ownerRole === "Owner" &&
      receipt.ownerIdentity.externalSubjectId === null,
    "M0 Owner-governance identity drifted",
  );
  invariant(
    receipt.roadmapSignoff?.userAttested === true &&
      receipt.roadmapSignoff.portableExternalSignatureVerified === false,
    "M0 roadmap-signoff boundary drifted",
  );
  invariant(
    Array.isArray(receipt.ownerDecisions) &&
      receipt.ownerDecisions.length === 4 &&
      receipt.ownerDecisions.every(({recorded}) => recorded === true) &&
      receipt.ownerDecisions.filter(({m0RequirementSatisfied}) =>
        m0RequirementSatisfied === true).length === 2,
    "M0 Owner-decision intake projection drifted",
  );
  invariant(
    receipt.staffingCapacity?.assigneeFullName === "Dr. Peter Hu" &&
      receipt.staffingCapacity.samePersonAsOwner === true &&
      receipt.staffingCapacity.committedHoursPerWeekPerSlot === 1 &&
      receipt.staffingCapacity.hoursAreAdditiveAcrossSlots === false &&
      receipt.staffingCapacity.roadmapMinimumsAmended === false &&
      receipt.staffingCapacity.distinctBackupCoverageClaimed === false &&
      Array.isArray(receipt.staffingCapacity.slots) &&
      receipt.staffingCapacity.slots.length === 12 &&
      receipt.staffingCapacity.slots.every((slot) =>
        slot.committedHoursPerWeek === 1),
    "M0 staffing-capacity intake projection drifted",
  );
  invariant(
    receipt.budgetDefaultSelection?.ownerSelectedRepositoryDefaults === true &&
      receipt.budgetDefaultSelection.repositoryDefinedNumericOrCycleDefaultsFound === false &&
      receipt.budgetDefaultSelection.personnelRateCeilingUsdPerHour === null &&
      receipt.budgetDefaultSelection.totalBudgetEnvelopeUsd === null &&
      receipt.budgetDefaultSelection.procurementPaymentCycle === null &&
      receipt.budgetDefaultSelection.externalSpendAuthorized === false,
    "M0 fail-closed budget-default selection drifted",
  );
  invariant(receipt.externalSignatureEnvelope === null, "M0 Owner-governance receipt invented an external signature");
  invariant(
    receipt.authorityBoundary?.ownerIdentityUserAttested === true &&
      receipt.authorityBoundary.ownerIdentityCryptographicallyVerified === false &&
      receipt.authorityBoundary.ownerDecisionDirectiveCount === 4 &&
      receipt.authorityBoundary.ownerDecisionM0SatisfiedCount === 2 &&
      receipt.authorityBoundary.namedHumanRoleSlotIntentCount === 12 &&
      receipt.authorityBoundary.weeklyCapacityCommitmentCount === 12 &&
      receipt.authorityBoundary.roadmapCapacityFloorsAmended === false &&
      receipt.authorityBoundary.distinctBackupCoverageEstablished === false &&
      receipt.authorityBoundary.budgetGatesApproved === 0 &&
      receipt.authorityBoundary.m0ExitEstablished === false,
    "M0 Owner-governance authority boundary drifted",
  );
  assertAllFalse(receipt.authorityBoundary, [
    "animateGuiExecutionAuthorizedByThisReceiptAlone",
    "containmentApproved",
    "humanReviewAccepted",
    "immutableSessionAuthorizationEstablished",
    "originalRuntimeExecutionAuthorizedByThisReceiptAlone",
    "ownerFidelityAcceptanceEstablished",
    "publicationAuthorized",
    "rendererImplementationAuthorizedByThisReceiptAlone",
    "runtimeHostApproved",
    "strictCompletionEstablished",
  ], "M0 Owner-governance authority boundary");
  invariant(
    receipt.authorityBoundary.strictAcceptanceEffect === "m0-governance-intake-only",
    "M0 Owner-governance strict-acceptance effect drifted",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake?.releaseManifest,
    descriptor(releaseRecord),
    "M0 Owner-governance release-manifest binding",
  );
  invariant(
    receipt.sourceBindingsAtIntake.releaseManifest.releaseEntryFingerprintSha256 ===
      G5_L4_RELEASE_FINGERPRINT_SHA256,
    "M0 Owner-governance release fingerprint drifted",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake?.sourceScopeFreeze,
    descriptor(sourceScopeRecord),
    "M0 Owner-governance source-scope binding",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake?.sourceGapForensics,
    descriptor(sourceGapRecord),
    "M0 Owner-governance source-gap binding",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake?.m1OwnerAuthorization,
    descriptor(m1AuthorizationRecord),
    "M0 Owner-governance M1 receipt binding",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake?.originalRuntimeOperatorAssignment,
    descriptor(operatorAssignmentRecord),
    "M0 Owner-governance operator receipt binding",
  );
  invariant(SHA256.test(receiptRecord.sha256), "M0 Owner-governance receipt file hash is invalid");
}

function validateReportIdentity(record, reportType, schemaVersion) {
  const report = record.document;
  invariant(report.schemaVersion === schemaVersion, `${record.path}: schemaVersion drifted`);
  invariant(report.reportType === reportType, `${record.path}: reportType drifted`);
  const observedReleaseId = report.releaseId ?? report.release?.releaseId ?? report.identity?.releaseId;
  invariant(observedReleaseId === RELEASE_ID, `${record.path}: release identity drifted`);
  return report;
}

function validateSourceScope(report, release) {
  invariant(report.summary?.memberCount === 55 && report.summary?.pageCount === 54 && report.summary?.shellCount === 1, "source-scope totals drifted");
  invariant(report.summary?.pairedFlaSwfCount === 44 && report.summary?.swfOnlyCount === 11, "source-scope source-model totals drifted");
  invariant(report.summary?.strictCompleteCount === 0 && report.summary?.publishedCount === 0, "source scope was promoted");
  invariant(Array.isArray(report.members) && report.members.length === 55, "source-scope membership is incomplete");
  for (const [index, member] of report.members.entries()) {
    const expected = release.members[index];
    invariant(
      member.ordinal === expected.ordinal &&
        member.animationId === expected.animationId &&
        member.assetId === expected.assetId &&
        member.shardId === expected.shardId &&
        member.source?.swf?.path === expected.source.path &&
        member.source?.swf?.sha256 === expected.source.sha256 &&
        member.strictComplete === false,
      `${expected.animationId}: source-scope membership drifted`,
    );
  }
  assertAllFalse(report.acceptanceEffects, [
    "audioAccepted",
    "authoringAuditComplete",
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "humanVisualAccepted",
    "ownerAccepted",
    "published",
    "reachableFrameDomainsComplete",
    "strictComplete",
  ], "source-scope acceptance");
}

function sourceStaticCandidateFor(animationId) {
  return SOURCE_STATIC_ENGINEERING_CANDIDATES[animationId] ?? null;
}

function expectedSourceStaticCandidateState(animationId, candidate) {
  const partial =
    candidate.renderedFrameCount < candidate.frameCount;
  return {
    status: "current-javascript-engineering-candidate-only",
    report: "evidence/source-static-current-js-candidate.json",
    assetManifest: `public/flash-assets/courses/${animationId}/manifest.json`,
    runtimeScript:
      `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
    sourceStaticFrameDomain: candidate.frameDomainId,
    sourceStaticFrames: {
      firstFrame: 1,
      lastFrame: candidate.frameCount,
    },
    renderedFrameCount: candidate.renderedFrameCount,
    ...(partial
      ? {
          sourceStaticRenderableFrames: {
            firstFrame: 1,
            lastFrame: candidate.renderedFrameCount,
            frameCount: candidate.renderedFrameCount,
          },
          blockedLocalFrameRanges: candidate.blockedLocalFrameRanges,
        }
      : {}),
    rootEnabled: false,
    spanishEnabled: false,
    audioEnabled: false,
    sourceControlsEnabled: false,
    replayParityEstablished: false,
    originalRuntimeBaselineUsed: false,
    rmseComputed: false,
    humanVisualReviewPerformed: false,
    ownerReviewPerformed: false,
    strictAcceptanceEffect: "none",
  };
}

function validateSourceStaticCandidateImplementation(manifest, member, candidate) {
  const implementation = manifest.implementation;
  invariant(
    candidate.ordinal === member.ordinal,
    `${member.animationId}: source-static candidate release ordinal drifted`,
  );
  if (!candidate.manifestBound) {
    const maturity = implementation?.candidateMaturity;
    invariant(
      member.animationId === "course-g05-l04-fq-001" &&
        implementation?.rendering === "undecided" &&
        implementation.route === "" &&
        implementation.routeFile === "" &&
        implementation.component === "" &&
        implementation.registryModule === "" &&
        implementation.timelineModule === "" &&
        implementation.testFile === "" &&
        implementation.standalonePackage === "" &&
        implementation.defaultFrameDomainId === "root" &&
        implementation.frameDomains?.length === 1 &&
        implementation.frameDomains[0]?.id === "root" &&
        implementation.frameDomains[0].kind === "root" &&
        implementation.frameDomains[0].frameCount ===
          manifest.runtime.frameCount &&
        implementation.candidateState === undefined &&
        implementation.capturePlanning === undefined &&
        maturity?.status ===
          "current-javascript-engineering-candidate-only" &&
        maturity.candidateKind === "dual-sprite-composite-prefix" &&
        maturity.bindingAuthority ===
          "independent-fq001-composite-evidence-only" &&
        maturity.route === `/animations/${member.animationId}` &&
        maturity.publicComposite?.frameDomain === candidate.frameDomainId &&
        maturity.publicComposite.firstFrame === 1 &&
        maturity.publicComposite.lastFrame === candidate.renderedFrameCount &&
        maturity.publicComposite.openFrameCount ===
          candidate.renderedFrameCount &&
        maturity.publicComposite.fixedCompanionFrameDomain ===
          candidate.companionFrameDomainId &&
        maturity.publicComposite.fixedCompanionFrame === 1 &&
        maturity.canonicalDefaultFrameDomainId === "root" &&
        maturity.canonicalFrameDomainsChanged === false &&
        maturity.canonicalFrameDomainDisposition === "unresolved" &&
        maturity.canonicalNestedCoverageDeclared === false &&
        maturity.rootEnabled === false &&
        maturity.companionStandaloneEnabled === false &&
        maturity.spanishEnabled === false &&
        maturity.audioEnabled === false &&
        maturity.sourceControlsEnabled === false &&
        maturity.replayParityEstablished === false &&
        maturity.originalRuntimeBaselineUsed === false &&
        maturity.rmseComputed === false &&
        maturity.humanVisualReviewPerformed === false &&
        maturity.ownerReviewPerformed === false &&
        maturity.implementationAuthorized === false &&
        maturity.strictAcceptanceEffect === "none",
      `${member.animationId}: independent dual-sprite composite candidate drifted or altered canonical domains`,
    );
    return;
  }
  invariant(
    implementation?.rendering === SOURCE_STATIC_CANDIDATE_RENDERING &&
      implementation.route === `/animations/${member.animationId}` &&
      implementation.routeFile ===
        "apps/web/app/[locale]/animations/[animationId]/page.tsx" &&
      implementation.component ===
        `packages/demos/src/modules/${member.animationId}.tsx` &&
      implementation.registryModule === `./modules/${member.animationId}` &&
      implementation.timelineModule ===
        `packages/demos/src/timelines/${member.animationId}.ts` &&
      implementation.testFile ===
        "packages/demos/tests/course-g05-l04-source-static.test.ts" &&
      implementation.standalonePackage === "" &&
      implementation.defaultFrameDomainId === candidate.frameDomainId,
    `${member.animationId}: bounded source-static renderer or route contract drifted`,
  );
  invariant(
    stableJson(implementation.frameDomains) === stableJson([
      {
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        sourceInstanceId: "root",
        parentFrameDomainId: null,
        frameCount: manifest.runtime.frameCount,
        scenarioIds: ["root-unavailable"],
        role: "root-host-entry-unavailable",
      },
      {
        id: candidate.frameDomainId,
        kind: "nested",
        sourceTimelineId: candidate.frameDomainId,
        sourceInstanceId: candidate.sourceInstanceId ?? "animation",
        parentFrameDomainId: "root",
        parentEntryFrame: 6,
        localEntryFrame: 1,
        frameCount: candidate.frameCount,
        scenarioIds: ["source-static-frame"],
        role: "main-teaching-animation-source-static-candidate",
      },
    ]),
    `${member.animationId}: bounded root/nested frame-domain contract drifted`,
  );
  invariant(
    stableJson(implementation.candidateState) ===
      stableJson(expectedSourceStaticCandidateState(member.animationId, candidate)),
    `${member.animationId}: bounded source-static candidateState drifted`,
  );
  invariant(
    implementation.capturePlanning?.state ===
        "pending-authoritative-natural-trace" &&
      implementation.capturePlanning.releaseId === RELEASE_ID &&
      implementation.capturePlanning.releaseSequence === member.ordinal &&
      implementation.capturePlanning.rootNaturalTraceExecuted === false &&
      implementation.capturePlanning.authoritativeScenarioInventoryEstablished ===
        false &&
      implementation.capturePlanning.nestedFrameDomainDispositionEstablished ===
        true &&
      implementation.capturePlanning
        .authoritativeRuntimeFrameDomainDispositionEstablished === false &&
      implementation.capturePlanning.structuralFrameDomainPlanningClosed ===
        false &&
      implementation.capturePlanning.runtimeReachabilityEstablished === false &&
      implementation.capturePlanning.strictAcceptanceEffect === "none",
    `${member.animationId}: source-static candidate capture boundary drifted`,
  );
}

function expectedEngineeringCandidateProjection(animationId, candidate) {
  return {
    status: "current-javascript-engineering-candidate-only",
    candidateKind: candidate.candidateKind,
    bindingAuthority: candidate.manifestBound
      ? "manifest-bound-single-sprite-candidate"
      : "independent-fq001-composite-evidence-only",
    route: `/animations/${animationId}`,
    rendering: candidate.manifestBound
      ? SOURCE_STATIC_CANDIDATE_RENDERING
      : "canonical-undecided-independent-dual-sprite-composite-candidate",
    rootFrameDomainId: "root",
    sourceStaticFrameDomainId: candidate.frameDomainId,
    sourceStaticFrameCount: candidate.frameCount,
    openFrameCount: candidate.renderedFrameCount,
    blockedTailFrameCount: candidate.blockedTailFrameCount,
    fixedCompanionFrameDomainId:
      candidate.companionFrameDomainId ?? null,
    fixedCompanionFrameCount: candidate.companionFrameCount ?? 0,
    manifestBound: candidate.manifestBound,
    canonicalNestedCoverageDeclared: candidate.nestedCoverageDeclared,
    canonicalFrameDomainDisposition: candidate.manifestBound
      ? "declared-conservative-nested-domain"
      : "unresolved",
    rootEnabled: false,
    spanishEnabled: false,
    audioEnabled: false,
    replayParityEstablished: false,
    originalRuntimeBaselineUsed: false,
    rmseComputed: false,
    humanVisualReviewPerformed: false,
    ownerReviewPerformed: false,
    implementationAuthorized: false,
    strictAcceptanceEffect: "none",
  };
}

function engineeringCandidateProjection(manifest, candidate) {
  return expectedEngineeringCandidateProjection(
    manifest.animationId,
    candidate,
  );
}

function validateWorkspaceReport(report, release) {
  invariant(
    report.summary?.expectedWorkspaceCount === 55 &&
      report.summary.presentWorkspaceCount === 55 &&
      report.summary.draftValidationPassCount === 55,
    "workspace scaffold totals drifted",
  );
  invariant(
    report.summary?.implementationStartedCount ===
      SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length,
    "workspace source-static engineering-candidate count drifted",
  );
  invariant(report.summary?.strictCompleteCount === 0 && report.summary?.publishedCount === 0, "workspace report was promoted");
  invariant(Array.isArray(report.workspaces) && report.workspaces.length === 55, "workspace report membership is incomplete");
  for (const [index, workspace] of report.workspaces.entries()) {
    const member = release.members[index];
    const candidate = sourceStaticCandidateFor(member.animationId);
    invariant(
      workspace.ordinal === member.ordinal &&
        workspace.animationId === member.animationId &&
        workspace.assetId === member.assetId &&
        workspace.shardId === member.shardId &&
        workspace.workspacePath === `migrations/${member.animationId}` &&
        workspace.draftValidation?.passed === true &&
        workspace.implementationStatus ===
          (candidate
            ? candidate.manifestBound
              ? "source-static-engineering-candidate"
              : "dual-sprite-composite-engineering-candidate"
            : "not-started") &&
        workspace.strictComplete === false,
      `${member.animationId}: workspace readiness identity drifted`,
    );
  }
}

function validateRuntimeReport(report, release) {
  invariant(report.summary?.selectedMemberCount === 55 && report.items?.length === 55, "runtime planning membership is incomplete");
  invariant(report.summary?.emptyWorksheetCount === 55, "runtime worksheets are not all empty");
  invariant(
    report.summary?.namedOperatorRoleAssignmentReceiptCount === 1 &&
      report.summary.plansWithNamedOperatorRoleAssignmentCount === 55 &&
      report.summary.sessionOperatorAttestationCount === 0,
    "runtime planning named-role/session boundary drifted",
  );
  invariant(report.summary?.runtimeSessionCount === 0 && report.summary?.authoritativeBaselineCount === 0, "runtime planning report claims execution");
  invariant(report.summary?.runnableArtifactCount === 0, "runtime planning report contains runnable artifacts");
  invariant(report.summary?.totalCoverageFrameCountKnownCount === 0, "runtime planning report claims complete frame coverage");
  invariant(
    report.summary?.canonicalRequirementCount === 212 &&
      report.summary.canonicalRootOnlyRequirementCount === 110 &&
      report.summary.canonicalNestedRequirementCount === 102 &&
      report.summary.currentJavascriptEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      report.summary.independentDualSpriteCompositeCandidateCount === 1 &&
      report.summary.currentJavascriptOpenFrameCount === 13696 &&
      report.summary.currentJavascriptBlockedTailFrameCount === 3020,
    "runtime planning candidate or coverage aggregate drifted",
  );
  invariant(report.gates?.machinePlanningArtifactsMaterialized === true, "runtime planning artifacts are not materialized");
  invariant(report.gates?.namedOperatorRoleAssignmentBound === true,
    "runtime planning does not bind the validated release-level operator role");
  invariant(
    report.namedOperatorRoleAssignment?.roleId === "authorized-original-runtime-operator" &&
      report.namedOperatorRoleAssignment.slot === "primary" &&
      report.namedOperatorRoleAssignment.assigneeFullName === "Dr. Peter Hu" &&
      report.namedOperatorRoleAssignment.identityBasis === "user-attested-current-codex-task" &&
      report.namedOperatorRoleAssignment.requiredHoursPerWeek === 20 &&
      report.namedOperatorRoleAssignment.committedHoursPerWeek === null &&
      report.namedOperatorRoleAssignment.strictAcceptanceEffect === "named-primary-operator-role-only",
    "runtime planning named operator role drifted",
  );
  assertAllFalse(report.namedOperatorRoleAssignment, [
    "cryptographicallyVerified",
    "weeklyCapacityEstablished",
    "backupAssignmentEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "originalRuntimeExecutionAuthorized",
    "animateGuiExecutionAuthorized",
    "actualSessionOperatorAttestationPresent",
  ], "runtime planning operator role");
  assertAllFalse(report.gates, [
    "audioRuntimeListeningComplete",
    "authoritativeBaselinesComplete",
    "authorizedOriginalRuntimeBound",
    "implementationAuthorized",
    "naturalTraceSchedulesComplete",
    "publicationAffected",
    "rootReachableDomainsResolved",
    "portableOperatorIdentityVerified",
    "operatorWeeklyCapacityEstablished",
    "runtimeOperatorSessionAttested",
    "runtimeOperatorBound",
    "strictCompletionAffected",
  ], "runtime planning gates");
  for (const [index, item] of report.items.entries()) {
    const member = release.members[index];
    invariant(
      item.ordinal === member.ordinal &&
        item.animationId === member.animationId &&
        item.assetId === member.assetId &&
        item.runtimeWorksheet === "empty-non-runnable-planning-only" &&
        item.acceptanceEffect === "none",
      `${member.animationId}: runtime planning identity drifted`,
    );
  }
}

function validateAudioReport(report, release) {
  const summary = report.summary || {};
  invariant(summary.memberCount === 55 && report.memberPlans?.length === 55, "audio ownership membership is incomplete");
  invariant(summary.candidateFileCount === 135 && summary.physicalHashVerifiedFileCount === 135, "audio candidate hash verification drifted");
  invariant(summary.canonicalInventoryRowCount === 373, "canonical audio inventory row total drifted");
  invariant(summary.dedicatedMachineAudioAuditPresentCount === 55, "release-member audio audit count drifted");
  invariant(summary.machineCueMapCompleteCount === 0, "machine cue maps were promoted");
  invariant(summary.spokenLanguageEstablishedFileCount === 0, "spoken language was promoted");
  invariant(summary.authorizedOriginalRuntimeListeningSessionCount === 0, "audio report claims a runtime listening session");
  invariant(summary.audioAcceptedFileCount === 0 && summary.audioAcceptedMemberCount === 0, "audio report claims acceptance");
  invariant(summary.strictCompleteMemberCount === 0 && summary.publishedMemberCount === 0, "audio report was promoted");
  for (const [index, plan] of report.memberPlans.entries()) {
    const member = release.members[index];
    invariant(
      plan.ordinal === member.ordinal &&
        plan.animationId === member.animationId &&
        plan.assetId === member.assetId &&
        plan.source?.path === member.source.path &&
        plan.source?.sha256 === member.source.sha256,
      `${member.animationId}: audio ownership identity drifted`,
    );
    assertAllFalse(plan.acceptance, [
      "audioAccepted",
      "humanReviewAccepted",
      "ownerAccepted",
      "published",
      "strictComplete",
    ], `${member.animationId}: audio ownership acceptance`);
  }
  assertAllFalse(report.acceptance, [
    "cueMappingAccepted",
    "humanAccepted",
    "listeningAccepted",
    "ownerAccepted",
    "published",
    "spokenLanguageAccepted",
    "strictLessonComplete",
    "synchronizationAccepted",
  ], "audio ownership acceptance");
}

function validateRiskReport(report) {
  invariant(report.summary?.calibrationMemberCount === 8 && report.items?.length === 8, "risk-calibration set drifted");
  invariant(report.summary?.workStudyTargetCount === 4 && report.summary?.workStudyCompletedCount === 0, "risk work-study state drifted");
  invariant(report.summary?.implementationAuthorizedCount === 0 && report.summary?.rendererSelectedCount === 0, "risk report authorized implementation");
  invariant(report.summary?.completeAuthoringAuditCount === 0, "risk report claims authoring completion");
  invariant(report.summary?.rootReachabilityResolvedCount === 0, "risk report claims runtime reachability");
  invariant(report.summary?.strictCompleteCount === 0, "risk report claims strict completion");
  invariant(report.humanWorkStudyProtocol?.automationMayFillActuals === false, "risk report permits automated human evidence");
  const selected = report.items.filter(({workStudy}) => workStudy).map(({animationId}) => animationId);
  invariant(
    JSON.stringify(selected) === JSON.stringify(G5_L4_WORK_STUDY_READINESS_IDS),
    "risk work-study target order or membership drifted",
  );
  for (const item of report.items.filter(({workStudy}) => workStudy)) {
    invariant(
      item.workStudy.status ===
          "candidate-pending-separate-authorization-and-human-timed-study" &&
        item.workStudy.actualTotalMinutes === null &&
        item.workStudy.measuredBy === null &&
        item.workStudy.phases.every((phase) =>
          phase.startedAt === null &&
          phase.finishedAt === null &&
          phase.actualMinutes === null &&
          phase.measuredBy === null),
      `${item.animationId}: risk report fabricated work-study evidence`,
    );
  }
  assertAllFalse(report.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "humanVisualAccepted",
    "implementationAuthorized",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], "risk-calibration acceptance");
}

function validatePromotionReport(report) {
  invariant(report.release?.expectedMemberCount === 55 && report.release?.publicationMode === "atomic", "promotion release scope drifted");
  invariant(report.release?.strictCompleteCount === 0 && report.release?.published === false, "promotion report claims release");
  invariant(report.readiness?.productionPromotionWriterReady === false, "production promotion writer is open");
  invariant(report.readiness?.authoritativeOriginalRuntimeCaptureMayStart === false, "promotion report authorizes runtime capture");
  invariant(report.readiness?.strictAcceptanceEffect === "none", "promotion readiness acceptance effect drifted");
  invariant(report.acceptance?.strictCompletionsGrantedByThisReport === 0, "promotion report grants strict completion");
  assertAllFalse(report.acceptance, [
    "authoritativeBaselineAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "releaseAuthorized",
  ], "promotion acceptance");
}

function validateAnimateOperatorReadiness(report, records) {
  invariant(
    report.summary?.selectedMembers === 55 &&
      report.summary.flaBackedItems === 44 &&
      report.summary.swfOnlyItems === 11 &&
      report.summary.namedPrimaryOperatorRoleAssignmentsRecorded === 1 &&
      report.summary.actualSessionOperatorAttestationsRecorded === 0 &&
      report.summary.animateGuiExecutionsByThisBuilder === 0 &&
      report.summary.authoringAuditsEstablished === 0,
    "Animate operator-readiness summary drifted",
  );
  invariant(
    report.operatorAssignment?.roleId === "authorized-original-runtime-operator" &&
      report.operatorAssignment.slot === "primary" &&
      report.operatorAssignment.assigneeFullName === "Dr. Peter Hu" &&
      report.operatorAssignment.identityEvidence === "user-attested-current-codex-task" &&
      report.operatorAssignment.cryptographicallyVerified === false &&
      report.operatorAssignment.weeklyCapacityEstablished === false &&
      report.operatorAssignment.hostApproved === false &&
      report.operatorAssignment.containmentApproved === false &&
      report.operatorAssignment.immutableSessionAuthorizationEstablished === false &&
      report.operatorAssignment.animateGuiExecutionAuthorized === false &&
      report.operatorAssignment.originalRuntimeExecutionAuthorized === false &&
      report.operatorAssignment.actualSessionOperatorAttestationPresent === false,
    "Animate operator assignment crossed its role-only boundary",
  );
  assertDescriptor(
    {
      path: report.inputs?.namedOperatorAssignmentReceipt?.file,
      bytes: report.inputs?.namedOperatorAssignmentReceipt?.bytes,
      sha256: report.inputs?.namedOperatorAssignmentReceipt?.sha256,
    },
    descriptor(records.operatorAssignmentReceipt),
    "Animate named-operator receipt",
  );
  invariant(
    report.processGate?.humanAssistedRunAllowedNow === false &&
      report.processGate.state === "closed-named-operator-bound-session-execution-authorization-required",
    "Animate process gate opened after role assignment",
  );
  invariant(
    report.operatorProtocol?.assignedOperatorBindingEnforcedByRunner === false &&
      report.operatorProtocol.immutablePerRowSessionAuthorizationPresent === false &&
      report.queue?.length === 44 &&
      report.queue.every((entry) =>
        entry.command?.humanAssistedRun?.argvTemplate?.at(-1) === "none" &&
        entry.evidenceState?.authoringAudit === false),
    "Animate queue became executable or authoritative",
  );
}

function validateM0Report(report, records) {
  invariant(report.summary?.m1StartAuthorized === true && report.acceptanceEffects?.m1Authorized === true, "M0 report does not record bounded M1 start authorization");
  invariant(report.summary?.m0ExitReady === false && report.acceptanceEffects?.m0Closed === false, "M0 report claims closure");
  invariant(report.summary?.strictCompleteCount === 0 && report.summary?.published === false, "M0 report claims strict completion or publication");
  invariant(
    report.summary?.ownerDecisionReceiptCount === 4 &&
      report.summary.requiredOwnerDecisionCount === 4 &&
      report.summary.ownerDecisionM0SatisfiedCount === 2,
    "M0 report Owner-decision projection drifted",
  );
  invariant(
    report.summary?.namedRoleAssignmentReceiptCount === 12 &&
      report.summary.requiredNamedRoleSlotCount === 12 &&
      report.summary.ownerAttestedNamedRoleAssignmentCount === 12 &&
      report.summary.portableExternallyVerifiedNamedRoleAssignmentCount === 0 &&
      report.summary.weeklyCapacityCommitmentCount === 12 &&
      report.summary.capacityFloorSatisfiedCount === 0 &&
      report.summary.effectiveBackupCoverageCount === 0,
    "M0 report does not preserve the exact twelve-slot fail-closed staffing state",
  );
  invariant(
    report.summary?.budgetGateApprovedCount === 0 &&
      report.summary.budgetGateCount === 3 &&
      report.summary.roadmapSignoffIntentUserAttested === true &&
      report.summary.roadmapPortableExternalSignatureVerified === false,
    "M0 report budget or roadmap-signoff boundary drifted",
  );
  invariant(report.phaseAuthorization?.machineOnly === true && report.phaseAuthorization?.authorizedPhase === "M1", "M0 phase authorization drifted");
  invariant(report.phaseAuthorization?.owner?.cryptographicallyVerified === false, "M0 report invented cryptographic Owner identity");
  assertDescriptor(
    report.ownerGovernance?.receipt,
    descriptor(records.m0OwnerGovernanceReceipt),
    "M0 consolidated Owner-governance receipt",
  );
  invariant(
    report.ownerGovernance?.owner?.fullName === "Dr. Peter Hu" &&
      report.ownerGovernance.owner.cryptographicallyVerified === false &&
      report.ownerGovernance.roadmapSignoff?.userAttested === true &&
      report.ownerGovernance.roadmapSignoff.portableExternalSignatureVerified === false &&
      report.ownerGovernance.authorityBoundary?.ownerDecisionDirectiveCount === 4 &&
      report.ownerGovernance.authorityBoundary.ownerDecisionM0SatisfiedCount === 2 &&
      report.ownerGovernance.authorityBoundary.namedHumanRoleSlotIntentCount === 12 &&
      report.ownerGovernance.authorityBoundary.weeklyCapacityCommitmentCount === 12 &&
      report.ownerGovernance.authorityBoundary.distinctBackupCoverageEstablished === false &&
      report.ownerGovernance.authorityBoundary.budgetGatesApproved === 0 &&
      report.ownerGovernance.authorityBoundary.m0ExitEstablished === false,
    "M0 consolidated Owner-governance projection drifted",
  );
  const assignedSlots = report.roleSlots || [];
  invariant(
    assignedSlots.length === 12 &&
      assignedSlots.every((slot) =>
        slot.assignee?.fullName === "Dr. Peter Hu" &&
        slot.assignee.cryptographicallyVerified === false &&
        slot.assignee.samePersonAsOwner === true &&
        slot.committedHoursPerWeek === 1 &&
        slot.capacityCommitmentEstablished === true &&
        slot.capacityFloorSatisfied === false) &&
      assignedSlots.filter(({assignment}) => assignment === "primary").length === 6 &&
      assignedSlots.filter(({assignment}) => assignment === "backup").length === 6 &&
      assignedSlots.filter(({assignment, effectiveBackupCoverageEstablished}) =>
        assignment === "backup" && effectiveBackupCoverageEstablished === false).length === 6,
    "M0 report named-role projection drifted",
  );
  const operatorPrimarySlot = assignedSlots.find((slot) =>
    slot.roleId === "authorized-original-runtime-operator" &&
    slot.assignment === "primary");
  const operatorBackupSlot = assignedSlots.find((slot) =>
    slot.roleId === "authorized-original-runtime-operator" &&
    slot.assignment === "backup");
  invariant(
    operatorPrimarySlot?.minimumHoursPerWeek === 20 &&
      operatorPrimarySlot.capacityFloorSpecified === true &&
      operatorBackupSlot?.minimumHoursPerWeek === 8 &&
      operatorBackupSlot.capacityFloorSpecified === true,
    "M0 operator primary/backup capacity projection drifted",
  );
  assertDescriptor(
    operatorPrimarySlot.assignmentReceipt,
    descriptor(records.operatorAssignmentReceipt),
    "M0 legacy primary-operator provenance",
  );
  for (const slot of assignedSlots.filter((slot) => slot !== operatorPrimarySlot)) {
    assertDescriptor(
      slot.assignmentReceipt,
      descriptor(records.m0OwnerGovernanceReceipt),
      `M0 ${slot.roleId}/${slot.assignment} consolidated governance provenance`,
    );
  }
  invariant(
    report.roleAssignments?.length === 1 &&
      report.roleAssignments[0].roleId === "authorized-original-runtime-operator" &&
      report.roleAssignments[0].assignee?.fullName === "Dr. Peter Hu" &&
      report.roleAssignments[0].animateGuiAuthorized === false &&
      report.roleAssignments[0].originalRuntimeAuthorized === false &&
      report.roleAssignments[0].actualAnimateExecutionEstablished === false &&
      report.roleAssignments[0].actualOriginalRuntimeSessionEstablished === false,
    "M0 operator assignment crossed an execution boundary",
  );
  assertAllFalse(report.acceptanceEffects, [
    "authoritativeOriginalRuntime",
    "humanReviewAccepted",
    "implementationAuthorized",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], "M0 acceptance");
  assertDescriptor(report.sourceBindings?.releaseManifest, descriptor(records.releaseManifest), "M0 release manifest binding");
  assertDescriptor(report.sourceBindings?.m1AuthorizationReceipt, descriptor(records.m1AuthorizationReceipt), "M0 M1 receipt binding");
  assertDescriptor(
    report.sourceBindings?.governanceRequirements,
    descriptor(records.m0GovernanceRequirements),
    "M0 governance requirements binding",
  );
  assertDescriptor(
    report.sourceBindings?.primaryOriginalRuntimeOperatorAssignmentReceipt,
    descriptor(records.operatorAssignmentReceipt),
    "M0 primary operator assignment receipt binding",
  );
  assertDescriptor(
    report.sourceBindings?.ownerM0GovernanceReceipt,
    descriptor(records.m0OwnerGovernanceReceipt),
    "M0 consolidated Owner-governance source binding",
  );
  for (const [packetKey, recordKey] of Object.entries(M0_PACKET_KEYS)) {
    assertDescriptor(
      report.sourceBindings?.machinePacket?.[packetKey],
      descriptor(records[recordKey]),
      `M0 machine packet ${packetKey}`,
    );
  }
}

async function verifyMachineOutput(projectRoot, member, output) {
  invariant(output && typeof output.path === "string", `${member.animationId}: machine output path is missing`);
  invariant(
    output.path.startsWith("audit/machine/") &&
      !output.path.includes("\\") &&
      !output.path.split("/").includes("..") &&
      path.posix.normalize(output.path) === output.path,
    `${member.animationId}: unsafe machine output path`,
  );
  invariant(Number.isInteger(output.bytes) && output.bytes > 0, `${member.animationId}/${output.path}: invalid byte count`);
  invariant(SHA256.test(output.sha256 || ""), `${member.animationId}/${output.path}: invalid SHA-256`);
  const relativePath = `migrations/${member.animationId}/${output.path}`;
  const record = await readFileRecord(projectRoot, relativePath, `${member.animationId}/${output.path}`);
  invariant(record.bytes === output.bytes && record.sha256 === output.sha256, `${member.animationId}/${output.path}: output pin drifted`);
  return descriptor(record);
}

async function validateMemberMachineFoundation(projectRoot, release, workspaceReport) {
  const workspaceById = new Map(workspaceReport.workspaces.map((workspace) => [workspace.animationId, workspace]));
  const results = [];
  for (const member of release.members) {
    const workspace = workspaceById.get(member.animationId);
    invariant(workspace, `${member.animationId}: workspace report entry is missing`);
    const manifestRecord = await readJsonRecord(
      projectRoot,
      `migrations/${member.animationId}/migration.json`,
      `${member.animationId} migration manifest`,
    );
    assertDescriptor(workspace.manifest, descriptor(manifestRecord), `${member.animationId} workspace manifest`);
    const manifest = manifestRecord.document;
    invariant(
      manifest.schemaVersion === 2 &&
        manifest.id === member.animationId &&
        manifest.animationId === member.animationId &&
        manifest.assetId === member.assetId &&
        manifest.status === "preserved" &&
        manifest.source?.swf === `${SOURCE_PREFIX}${member.source.path}` &&
        manifest.source?.placementPath === `${SOURCE_PREFIX}${member.source.path}` &&
        manifest.source?.swfSha256 === member.source.sha256,
      `${member.animationId}: migration identity or preserved status drifted`,
    );
    const candidate = sourceStaticCandidateFor(member.animationId);
    if (candidate) {
      validateSourceStaticCandidateImplementation(manifest, member, candidate);
    } else {
      invariant(
        manifest.implementation?.rendering === "undecided" &&
          manifest.implementation?.route === "" &&
          manifest.implementation?.routeFile === "" &&
          manifest.implementation?.component === "" &&
          manifest.implementation?.registryModule === "" &&
          manifest.implementation?.timelineModule === "" &&
          manifest.implementation?.testFile === "" &&
          manifest.implementation?.standalonePackage === "" &&
          manifest.implementation?.candidateState === undefined &&
          manifest.implementation?.candidateMaturity === undefined &&
          manifest.implementation?.capturePlanning === undefined,
        `${member.animationId}: non-candidate renderer or implementation has started`,
      );
    }
    invariant(
      ["engineeringReview", "humanVisualReview", "ownerReview"].every((key) => manifest.acceptance?.[key]?.decision === "pending"),
      `${member.animationId}: migration acceptance was promoted`,
    );

    const machineRecord = await readJsonRecord(
      projectRoot,
      `migrations/${member.animationId}/audit/machine/report.json`,
      `${member.animationId} machine report`,
    );
    const machine = machineRecord.document;
    invariant(
      machine.schemaVersion === 1 &&
        machine.animationId === member.animationId &&
        machine.auditStatus === "partial" &&
        machine.migrationStatus === "preserved" &&
        machine.migrationStatusUnchanged === true,
      `${member.animationId}: machine report identity or status drifted`,
    );
    invariant(
      machine.source?.expectedSha256 === member.source.sha256 &&
        machine.source?.observedSha256Before === member.source.sha256 &&
        machine.source?.observedSha256After === member.source.sha256 &&
        machine.source?.hashMatches === true,
      `${member.animationId}: machine source hash binding drifted`,
    );
    invariant(
      Object.values(machine.commands || {}).length >= 7 &&
        Object.values(machine.commands).every((command) =>
          command.status === "success" &&
          command.exitCode === 0 &&
          command.timedOut === false),
      `${member.animationId}: a machine command is not successful`,
    );
    invariant(machine.findings?.runtimeCrossCheck?.allMatch === true, `${member.animationId}: machine runtime metadata cross-check drifted`);
    invariant(Array.isArray(machine.outputs) && machine.outputs.length === 7, `${member.animationId}: machine output set drifted`);
    invariant(new Set(machine.outputs.map(({path: outputPath}) => outputPath)).size === 7, `${member.animationId}: duplicate machine output path`);
    const outputs = [];
    for (const output of machine.outputs) outputs.push(await verifyMachineOutput(projectRoot, member, output));
    const frameCandidates = machine.findings?.frameDomainCandidates;
    invariant(
      frameCandidates?.animationId === member.animationId &&
        frameCandidates?.source?.sha256 === member.source.sha256 &&
        frameCandidates?.summary?.rootDomainCount === 1 &&
        frameCandidates?.summary?.completeRootReachableDomainInventory === false,
      `${member.animationId}: structural frame-domain candidates drifted`,
    );
    assertAllFalse(frameCandidates.acceptanceEffects, [
      "audioAccepted",
      "authoritativeOriginalRuntime",
      "completeFrameDomainDisposition",
      "humanVisualAccepted",
      "ownerAccepted",
      "published",
      "strictComplete",
    ], `${member.animationId}: frame-domain candidate acceptance`);
    results.push({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      shardId: member.shardId,
      sourceSha256: member.source.sha256,
      migrationManifest: descriptor(manifestRecord),
      machineReport: descriptor(machineRecord),
      machineOutputCount: outputs.length,
      machineOutputSetSha256: sha256Bytes(Buffer.from(stableJson(outputs))),
      rootFrameCount: machine.findings.frameDomainCandidates.root.frameCount,
      nestedDefinitionCount: machine.findings.frameDomainCandidates.summary.nestedDefinitionCount,
      unresolvedReachabilityCount: machine.findings.frameDomainCandidates.summary.unresolvedReachabilityCount,
      auditStatus: machine.auditStatus,
      engineeringCandidate: Boolean(candidate),
      rendererSelected: Boolean(candidate),
      routeDeclared: Boolean(candidate),
      implementationStarted: Boolean(candidate),
      candidateState: candidate
        ? engineeringCandidateProjection(manifest, candidate)
        : null,
    });
  }
  invariant(
    stableJson(results.filter(({engineeringCandidate}) => engineeringCandidate)
      .map(({animationId}) => animationId)) ===
      stableJson(SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS),
    "bounded source-static engineering-candidate member set drifted",
  );
  return results;
}

function findEvidence(inventory, artifactId, id) {
  const matches = (inventory.evidenceIndex || []).filter((item) => item.artifactId === artifactId);
  invariant(matches.length === 1, `${id}: expected exactly one ${artifactId} evidence record`);
  return matches[0];
}

async function validateWorkStudyMember(
  projectRoot,
  member,
  records,
  strictGeneratorRecord,
  specificationInventoryGeneratorRecord,
) {
  const id = member.animationId;
  const engineeringCandidate = sourceStaticCandidateFor(id);
  const base = `migrations/${id}`;
  const [
    strictRecord,
    scenarioRecord,
    frameRecord,
    audioRecord,
    audioInventoryRecord,
    specificationInventoryRecord,
    assetDefinitionCensusRecord,
    machineDefinitionInventoryRecord,
    sourceDerivedAssetSuccessorRecord,
    sourceDerivedKeyframeSuccessorRecord,
    canonicalAssetInventoryRecord,
    canonicalKeyframeInventoryRecord,
  ] = await Promise.all([
    readJsonRecord(projectRoot, `${base}/audit/strict-readiness.json`, `${id} strict readiness`),
    readJsonRecord(projectRoot, `${base}/audit/scenario-inventory.json`, `${id} scenario inventory`),
    readJsonRecord(projectRoot, `${base}/audit/frame-domain-disposition.json`, `${id} frame-domain disposition`),
    readJsonRecord(projectRoot, `${base}/audit/audio-runtime-evidence.json`, `${id} audio machine audit`),
    readFileRecord(projectRoot, `${base}/audio-inventory.csv`, `${id} audio inventory`),
    readJsonRecord(
      projectRoot,
      `${base}/audit/machine/specification-inventory-readiness.json`,
      `${id} specification-inventory readiness`,
    ),
    readJsonRecord(
      projectRoot,
      `${base}/audit/machine/swf-asset-definition-census.json`,
      `${id} SWF asset-definition census`,
    ),
    readFileRecord(
      projectRoot,
      `${base}/audit/machine/swf-definition-inventory.csv`,
      `${id} machine definition inventory`,
    ),
    readJsonRecord(
      projectRoot,
      `${base}/audit/machine/g5-l4-source-derived-asset-inventory-candidate-receipt.json`,
      `${id} source-derived asset successor receipt`,
    ),
    readJsonRecord(
      projectRoot,
      SOURCE_DERIVED_KEYFRAME_SUCCESSOR_RECEIPT,
      `${id} source-derived keyframe successor receipt`,
    ),
    readFileRecord(
      projectRoot,
      `${base}/asset-inventory.csv`,
      `${id} canonical asset candidate inventory`,
    ),
    readFileRecord(
      projectRoot,
      `${base}/keyframes.csv`,
      `${id} canonical keyframe candidate inventory`,
    ),
  ]);

  const strict = strictRecord.document;
  validateG5L4WorkStudyStrictReadiness(strict);
  invariant(strict.generatedBy.sha256 === strictGeneratorRecord.sha256, `${id}: strict-readiness generator hash drifted`);
  invariant(strict.source?.swfSha256 === member.source.sha256, `${id}: strict-readiness source identity drifted`);
  assertDescriptor(strict.m1Authorization?.receipt, descriptor(records.m1AuthorizationReceipt), `${id}: strict-readiness M1 receipt`);
  assertDescriptor(strict.sourceScope?.freeze, descriptor(records.sourceScope), `${id}: strict-readiness source-scope freeze`);
  invariant(strict.workStudySelection.completedPhaseCount === 0, `${id}: strict-readiness claims completed work-study phases`);
  invariant(strict.runtimeAcquisitionReadiness.runtimeSessionsExecuted === 0, `${id}: strict-readiness claims runtime execution`);

  const scenario = scenarioRecord.document;
  invariant(
    scenario.schemaVersion === 1 &&
      scenario.animationId === id &&
      scenario.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      scenario.migrationStatusChanged === false,
    `${id}: scenario inventory identity or fail-closed status drifted`,
  );
  invariant(scenario.source?.swfSha256 === member.source.sha256, `${id}: scenario source identity drifted`);
  invariant(Array.isArray(scenario.authoritativeRuntimeEvidence) && scenario.authoritativeRuntimeEvidence.length === 0, `${id}: scenario inventory claims authoritative runtime evidence`);
  invariant(/^none;/.test(scenario.strictAcceptanceEffect || ""), `${id}: scenario inventory affects strict acceptance`);
  const scenarioMembership = findEvidence(scenario, "lesson-release-membership", id);
  invariant(
    scenarioMembership.releaseId === RELEASE_ID &&
      scenarioMembership.animationId === id &&
      scenarioMembership.assetId === member.assetId &&
      scenarioMembership.sourceSha256 === member.source.sha256 &&
      scenarioMembership.sha256 === records.releaseManifest.sha256,
    `${id}: scenario release membership binding drifted`,
  );

  const frame = frameRecord.document;
  invariant(
    frame.schemaVersion === 1 &&
      frame.animationId === id &&
      frame.status === "structurally-enumerated-dispositions-unresolved" &&
      frame.migrationStatusChanged === false,
    `${id}: frame-domain disposition identity or status drifted`,
  );
  invariant(frame.generatedFrom?.scenarioInventory?.sha256 === scenarioRecord.sha256, `${id}: frame-domain scenario binding drifted`);
  invariant(frame.generatedFrom?.sourceSwf?.sha256 === member.source.sha256, `${id}: frame-domain source binding drifted`);
  invariant(frame.summary?.dispositionCounts?.unresolved > 0, `${id}: frame-domain disposition unexpectedly claims closure`);
  invariant(/^none;/.test(frame.strictAcceptanceEffect || ""), `${id}: frame-domain disposition affects strict acceptance`);

  const audio = audioRecord.document;
  invariant(
    audio.schemaVersion === 2 &&
      audio.animationId === id &&
      audio.migrationStatusUnchanged === true &&
      audio.source?.expectedSha256 === member.source.sha256 &&
      audio.source?.observedSha256 === member.source.sha256 &&
      audio.source?.hashMatches === true,
    `${id}: audio machine audit identity or source binding drifted`,
  );
  const audioMembership = audio.authority?.lessonReleaseMembership;
  invariant(
    audioMembership?.releaseId === RELEASE_ID &&
      audioMembership.animationId === id &&
      audioMembership.assetId === member.assetId &&
      audioMembership.source?.sha256 === member.source.sha256,
    `${id}: audio release membership drifted`,
  );
  assertDescriptor(audioMembership.catalog, descriptor(records.releaseManifest), `${id}: audio release catalog`);
  invariant(audio.inventory?.file === "audio-inventory.csv", `${id}: audio inventory path drifted`);
  invariant(audio.acceptance?.structurallyAudited === true, `${id}: dedicated audio machine audit is incomplete`);
  invariant(audio.acceptance?.authoritativeListeningComplete === false, `${id}: audio audit claims authoritative listening`);
  assertAllFalse(audio.acceptance?.releaseBoundary, [
    "authoritativeOriginalRuntimeListeningComplete",
    "authoritativeOriginalRuntimeTraversalComplete",
    "humanAudioReviewComplete",
    "ownerAcceptanceComplete",
    "publicationAuthorized",
    "spokenLanguageContentVerified",
    "strictMigrationComplete",
  ], `${id}: audio release boundary`);
  invariant(audio.acceptance?.releaseBoundary?.strictAcceptanceEffect === "none", `${id}: audio audit affects strict acceptance`);

  const specificationInventory = specificationInventoryRecord.document;
  invariant(
    specificationInventory.schemaVersion === 2 &&
      specificationInventory.artifactType === "g5-l4-work-study-specification-inventory-readiness" &&
      specificationInventory.releaseId === RELEASE_ID &&
      specificationInventory.animationId === id &&
      specificationInventory.assetId === member.assetId,
    `${id}: specification-inventory readiness identity drifted`,
  );
  invariant(
    specificationInventory.generatedBy?.path === SPECIFICATION_INVENTORY_GENERATOR &&
      specificationInventory.generatedBy.sha256 === specificationInventoryGeneratorRecord.sha256,
    `${id}: specification-inventory generator binding drifted`,
  );
  invariant(
    specificationInventory.releaseMembership?.ordinal === member.ordinal &&
      specificationInventory.releaseMembership.releaseRole === member.releaseRole &&
      specificationInventory.releaseMembership.batchId === member.batchId &&
      specificationInventory.releaseMembership.shardId === member.shardId,
    `${id}: specification-inventory release membership drifted`,
  );
  invariant(
    specificationInventory.source?.swf?.path === `${SOURCE_PREFIX}${member.source.path}` &&
      specificationInventory.source.swf.sha256 === member.source.sha256 &&
      specificationInventory.source.swf.physicalHashVerified === true &&
      specificationInventory.source.sourceHashesVerified === true,
    `${id}: specification-inventory source binding drifted`,
  );
  assertDescriptor(
    specificationInventory.inputs?.lessonReleaseCatalog,
    descriptor(records.releaseManifest),
    `${id}: specification-inventory release catalog`,
  );
  assertDescriptor(
    specificationInventory.inputs?.scenarioInventory,
    descriptor(scenarioRecord),
    `${id}: specification-inventory scenario`,
  );
  assertDescriptor(
    specificationInventory.inputs?.strictReadiness,
    descriptor(strictRecord),
    `${id}: specification-inventory strict readiness`,
  );
  assertDescriptor(
    specificationInventory.inputs?.sourceDerivedAssetSuccessorReceipt,
    descriptor(sourceDerivedAssetSuccessorRecord),
    `${id}: specification-inventory asset successor`,
  );
  assertDescriptor(
    specificationInventory.inputs?.sourceDerivedKeyframeSuccessorReceipt,
    descriptor(sourceDerivedKeyframeSuccessorRecord),
    `${id}: specification-inventory keyframe successor`,
  );
  assertDescriptor(
    specificationInventory.outputs?.assetDefinitionCensus,
    descriptor(assetDefinitionCensusRecord),
    `${id}: specification-inventory census output`,
  );
  assertDescriptor(
    specificationInventory.outputs?.machineDefinitionInventory,
    descriptor(machineDefinitionInventoryRecord),
    `${id}: specification-inventory CSV output`,
  );
  assertDescriptor(
    specificationInventory.canonicalFiles?.assetInventory,
    descriptor(canonicalAssetInventoryRecord),
    `${id}: specification-inventory canonical asset candidates`,
  );
  assertDescriptor(
    specificationInventory.canonicalFiles?.keyframes,
    descriptor(canonicalKeyframeInventoryRecord),
    `${id}: specification-inventory canonical keyframe candidates`,
  );
  invariant(
    specificationInventory.canonicalFiles?.assetInventory?.changedByMaterializer === false &&
      specificationInventory.canonicalFiles?.keyframes?.changedByMaterializer === false &&
      specificationInventory.readiness?.staticSwfDefinitionCensusComplete === true &&
      specificationInventory.readiness.rendererAssetExportCount === 0 &&
      specificationInventory.readiness.runtimePlacementDispositionCount === 0 &&
      specificationInventory.readiness.authoritativeBoundaryEvidenceRowCount === 0 &&
      specificationInventory.readiness.baselineFilesBound === 0 &&
      specificationInventory.readiness.implementationFilesBound === 0 &&
      specificationInventory.readiness.diffFilesBound === 0 &&
      specificationInventory.readiness.rmseResultsBound === 0 &&
      specificationInventory.readiness.reviewerIdentitiesBound === 0 &&
      specificationInventory.readiness.assetInventoryFinalSpecificationComplete === false &&
      specificationInventory.readiness.keyframesFinalSpecificationComplete === false &&
      specificationInventory.readiness.finalSpecificationReady === false &&
      specificationInventory.readiness.implementationAuthorized === false &&
      specificationInventory.readiness.sourceDerivedAssetCandidateRowsMaterialized === true &&
      specificationInventory.readiness.sourceDerivedKeyframeCandidateRowsMaterialized === true &&
      specificationInventory.canonicalFiles.assetInventory.sourceDerivedCandidateOnly === true &&
      specificationInventory.canonicalFiles.keyframes.sourceDerivedCandidateOnly === true &&
      specificationInventory.canonicalFiles.assetInventory.rowCount > 0 &&
      specificationInventory.canonicalFiles.assetInventory.rowCount ===
        specificationInventory.readiness.staticSwfDefinitionCount &&
      specificationInventory.canonicalFiles.keyframes.rowCount > 0 &&
      specificationInventory.migrationStatusChanged === false &&
      specificationInventory.sourceAssetsChanged === false &&
      specificationInventory.strictAcceptanceEffect === "none",
    `${id}: specification-inventory readiness crossed an evidence boundary`,
  );
  assertAllFalse(
    specificationInventory.acceptance,
    [
      "originalRuntime",
      "implementation",
      "fidelity",
      "audio",
      "engineeringReview",
      "humanVisualReview",
      "ownerAcceptance",
      "strictCompletion",
      "publication",
    ],
    `${id}: specification-inventory acceptance`,
  );
  const specificationProjection = structuredClone(specificationInventory);
  delete specificationProjection.reportFingerprintSha256;
  invariant(
    specificationInventory.reportFingerprintSha256 ===
      orderedProjectionSha256(specificationProjection),
    `${id}: specification-inventory receipt fingerprint drifted`,
  );

  const census = assetDefinitionCensusRecord.document;
  invariant(
    census.schemaVersion === 1 &&
      census.artifactType === "g5-l4-work-study-swf-asset-definition-census" &&
      census.releaseId === RELEASE_ID &&
      census.animationId === id &&
      census.assetId === member.assetId &&
      census.source?.path === `${SOURCE_PREFIX}${member.source.path}` &&
      census.source.sha256 === member.source.sha256 &&
      census.source.physicalHashVerified === true,
    `${id}: SWF asset-definition census identity or source binding drifted`,
  );
  invariant(
    Number.isInteger(census.summary?.definitionCount) &&
      census.summary.definitionCount > 0 &&
      census.summary.definitionCount === census.definitions?.length &&
      census.summary.definitionCount === specificationInventory.readiness.staticSwfDefinitionCount &&
      census.summary.definitionCount === specificationInventory.outputs.assetDefinitionCensus.definitionCount &&
      census.summary.definitionCount === specificationInventory.outputs.machineDefinitionInventory.rowCount &&
      census.summary.definitionCount === specificationInventory.readiness.machineDefinitionInventoryRowCount,
    `${id}: SWF definition census count drifted`,
  );
  invariant(
    census.summary.rendererAssetExportCount === 0 &&
      census.summary.runtimePlacementDispositionCount === 0 &&
      census.summary.finalCanonicalAssetSpecificationComplete === false &&
      census.method?.establishesRuntimeVisibility === false &&
      census.method.establishesAuthoringSemantics === false &&
      census.method.exportsRendererAssets === false &&
      census.method.authorizesRendererReuse === false &&
      /^none;/.test(census.strictAcceptanceEffect || ""),
    `${id}: SWF definition census crossed an evidence boundary`,
  );
  assertAllFalse(census.acceptance, [
    "originalRuntime",
    "implementation",
    "fidelity",
    "audio",
    "humanReview",
    "ownerAcceptance",
    "strictCompletion",
    "publication",
  ], `${id}: census acceptance`);
  const censusProjection = structuredClone(census);
  delete censusProjection.artifactFingerprintSha256;
  invariant(
    census.artifactFingerprintSha256 === orderedProjectionSha256(censusProjection),
    `${id}: SWF definition census fingerprint drifted`,
  );
  const machineDefinitionLines = machineDefinitionInventoryRecord.contents
    .toString("utf8")
    .trimEnd()
    .split("\n");
  invariant(
    machineDefinitionLines[0]?.startsWith("asset_id,swf_character_id,") &&
      machineDefinitionLines.length - 1 === census.summary.definitionCount,
    `${id}: machine definition inventory row count drifted`,
  );

  return {
    ordinal: member.ordinal,
    animationId: id,
    sourceModel: strict.source.sourceModel,
    risk: strict.conclusion.risk,
    artifacts: {
      strictReadiness: descriptor(strictRecord),
      scenarioInventory: descriptor(scenarioRecord),
      frameDomainDisposition: descriptor(frameRecord),
      audioMachineAudit: descriptor(audioRecord),
      audioInventory: descriptor(audioInventoryRecord),
      specificationInventoryReadiness: descriptor(specificationInventoryRecord),
      swfAssetDefinitionCensus: descriptor(assetDefinitionCensusRecord),
      machineDefinitionInventory: descriptor(machineDefinitionInventoryRecord),
    },
    enhancedPreparation: {
      strictReadinessPrepared: true,
      scenarioInventoryPrepared: true,
      frameDomainDispositionPrepared: true,
      audioMachineAuditPrepared: true,
      structuralAudioAudited: true,
      specificationInventoryPrepared: true,
      staticSwfDefinitionCensusComplete: true,
      staticSwfDefinitionCount: census.summary.definitionCount,
      machineDefinitionInventoryRowCount: census.summary.definitionCount,
      rendererAssetExportCount: 0,
      runtimePlacementDispositionCount: 0,
      sourceDerivedAssetCandidateRowCount:
        specificationInventory.canonicalFiles.assetInventory.rowCount,
      sourceDerivedKeyframeCandidateRowCount:
        specificationInventory.canonicalFiles.keyframes.rowCount,
      sourceDerivedCandidateRowsFinal: false,
      finalSpecificationReady: false,
      unresolvedFrameDomainCount: frame.summary.dispositionCounts.unresolved,
      scenarioUnknownCount: scenario.unknowns.length,
    },
    workStudy: {
      status: "pending-human-timed-study",
      completedPhaseCount: 0,
      actualTotalMinutes: null,
      measuredBy: null,
    },
    runtimeSessionsExecuted: 0,
    implementationAuthorized: false,
    rendererSelected: Boolean(engineeringCandidate),
    routeDeclared: Boolean(engineeringCandidate),
    implementationStarted: Boolean(engineeringCandidate),
    currentJavaScriptCandidate: Boolean(engineeringCandidate),
    humanReviewAccepted: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    published: false,
  };
}

export async function buildG5L4M1MachineFoundationReadiness({
  projectRoot: projectRootOption = defaultProjectRoot,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {};
  for (const [key, relativePath] of Object.entries(INPUT_PATHS)) {
    records[key] = await readJsonRecord(projectRoot, relativePath, key);
  }
  records.generator = await readFileRecord(
    projectRoot,
    portable(path.relative(projectRoot, scriptPath)),
    "generator",
  );
  const strictGeneratorRecord = await readFileRecord(
    projectRoot,
    "scripts/build-g5-l4-work-study-strict-readiness.mjs",
    "work-study strict-readiness generator",
  );
  const specificationInventoryGeneratorRecord = await readFileRecord(
    projectRoot,
    SPECIFICATION_INVENTORY_GENERATOR,
    "work-study specification-inventory generator",
  );

  const release = validateRelease(records.releaseManifest.document);
  validateG5L4OwnerWorkAuthorizationReceipt(
    records.ownerWorkAuthorizationReceipt.document,
    {releaseManifest: records.releaseManifest.document},
  );
  const sourceScope = validateReportIdentity(records.sourceScope, "g5-l4-source-scope-freeze", 1);
  const workspace = validateReportIdentity(records.workspace, "g5-l4-workspace-readiness", 1);
  const runtime = validateReportIdentity(records.runtime, "release-runtime-acquisition-planning-readiness", 2);
  const containment = validateReportIdentity(
    records.containment,
    "g5-l4-original-runtime-containment-readiness",
    1,
  );
  validateG5L4OriginalRuntimeContainmentReadiness(containment);
  validateG5L4OwnerDefaultBlockersAuthorizationReceipt(
    records.ownerDefaultBlockersAuthorizationReceipt.document,
    {
      releaseManifestRecord: records.releaseManifest,
      sourceGapRecord: records.sourceGap,
      operatorAssignmentRecord: records.operatorAssignmentReceipt,
    },
  );
  const audio = validateReportIdentity(records.audio, "lesson-audio-ownership-machine-readiness", 1);
  const risk = validateReportIdentity(records.risk, "lesson-release-static-risk-calibration", 1);
  const promotion = validateReportIdentity(records.promotion, "lesson-promotion-security-readiness", 1);
  const m0 = validateReportIdentity(records.m0, "lesson-release-m0-governance-readiness", 4);
  validateReportIdentity(records.sourceGap, "lesson-release-source-gap-forensics", 1);
  const animate = validateReportIdentity(
    records.animate,
    "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness",
    2,
  );

  validateSourceScope(sourceScope, release);
  validateWorkspaceReport(workspace, release);
  validateRuntimeReport(runtime, release);
  assertDescriptor(
    runtime.provenance?.namedOperatorAssignmentReceipt,
    descriptor(records.operatorAssignmentReceipt),
    "runtime planning operator-assignment receipt",
  );
  assertDescriptor(
    containment.sourceBindings?.releaseManifest,
    descriptor(records.releaseManifest),
    "containment release manifest",
  );
  assertDescriptor(
    containment.sourceBindings?.sourceGapForensics,
    descriptor(records.sourceGap),
    "containment source-gap report",
  );
  assertDescriptor(
    containment.sourceBindings?.operatorAssignmentReceipt,
    descriptor(records.operatorAssignmentReceipt),
    "containment operator-assignment receipt",
  );
  assertDescriptor(
    containment.sourceBindings?.ownerDefaultBlockersAuthorizationReceipt,
    descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
    "containment Owner blockers 2-4 authorization receipt",
  );
  assertDescriptor(
    containment.sourceBindings?.runtimePlanningReadiness,
    descriptor(records.runtime),
    "containment runtime-planning report",
  );
  validateAudioReport(audio, release);
  validateRiskReport(risk);
  validatePromotionReport(promotion);
  validateAnimateOperatorReadiness(animate, records);
  validateM1Receipt(
    records.m1AuthorizationReceipt.document,
    records.m1AuthorizationReceipt,
    records.releaseManifest,
    records.sourceScope,
  );
  validateOwnerGovernanceReceipt(
    records.m0OwnerGovernanceReceipt.document,
    records.m0OwnerGovernanceReceipt,
    records.releaseManifest,
    records.sourceScope,
    records.sourceGap,
    records.m1AuthorizationReceipt,
    records.operatorAssignmentReceipt,
  );
  validateOperatorAssignmentReceipt(
    records.operatorAssignmentReceipt.document,
    records.operatorAssignmentReceipt,
    records.m0OwnerGovernanceReceipt,
    records.m0GovernanceRequirements,
    records.m1AuthorizationReceipt,
    records.releaseManifest,
    records.sourceScope,
  );
  validateM0Report(m0, records);

  const memberMachineFoundation = await validateMemberMachineFoundation(projectRoot, release, workspace);
  const rootFrameCount = memberMachineFoundation.reduce((sum, member) => sum + member.rootFrameCount, 0);
  const nestedDefinitionCount = memberMachineFoundation.reduce((sum, member) => sum + member.nestedDefinitionCount, 0);
  const unresolvedReachabilityCount = memberMachineFoundation.reduce((sum, member) => sum + member.unresolvedReachabilityCount, 0);
  invariant(rootFrameCount === runtime.summary.structuralRootFrameCount, "all-member root-frame total differs from runtime planning report");
  invariant(nestedDefinitionCount === runtime.summary.structuralNestedDefinitionCount, "all-member nested-definition total differs from runtime planning report");
  invariant(unresolvedReachabilityCount === runtime.summary.unresolvedNestedReachabilityCount, "all-member unresolved-reachability total differs from runtime planning report");

  const membersById = new Map(release.members.map((member) => [member.animationId, member]));
  const workStudyMembers = [];
  for (const id of G5_L4_WORK_STUDY_READINESS_IDS) {
    const member = membersById.get(id);
    invariant(member, `${id}: work-study target is outside the exact release`);
    workStudyMembers.push(await validateWorkStudyMember(
      projectRoot,
      member,
      records,
      strictGeneratorRecord,
      specificationInventoryGeneratorRecord,
    ));
  }
  invariant(workStudyMembers.every((member) => member.workStudy.completedPhaseCount === 0), "work-study completion was fabricated");
  invariant(
    containment.sourceBindings.workStudyScenarioInventories.length ===
      workStudyMembers.length,
    "containment work-study scenario binding count drifted",
  );
  for (const [index, member] of workStudyMembers.entries()) {
    assertDescriptor(
      containment.sourceBindings.workStudyScenarioInventories[index],
      member.artifacts.scenarioInventory,
      `${member.animationId}: containment scenario inventory`,
    );
  }
  invariant(
    audio.summary.dedicatedMachineAudioAuditPresentCount ===
      release.members.length,
    "audio report release-member audit count disagrees with current artifacts",
  );
  const workStudyStaticDefinitionCount = workStudyMembers.reduce(
    (sum, member) => sum + member.enhancedPreparation.staticSwfDefinitionCount,
    0,
  );
  const workStudyAssetCandidateRowCount = workStudyMembers.reduce(
    (sum, member) =>
      sum + member.enhancedPreparation.sourceDerivedAssetCandidateRowCount,
    0,
  );
  const workStudyKeyframeCandidateRowCount = workStudyMembers.reduce(
    (sum, member) =>
      sum + member.enhancedPreparation.sourceDerivedKeyframeCandidateRowCount,
    0,
  );
  invariant(workStudyStaticDefinitionCount === 2397, "work-study static SWF definition total drifted");
  invariant(workStudyAssetCandidateRowCount === 2397, "work-study source-derived asset candidate total drifted");
  invariant(workStudyKeyframeCandidateRowCount === 42, "work-study source-derived keyframe candidate total drifted");

  const sourceStaticEngineeringCandidates = memberMachineFoundation
    .filter(({engineeringCandidate}) => engineeringCandidate)
    .map((member) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      shardId: member.shardId,
      migrationManifest: member.migrationManifest,
      candidateState: member.candidateState,
      rendererSelected: member.rendererSelected,
      routeDeclared: member.routeDeclared,
      implementationStarted: member.implementationStarted,
      implementationAuthorized: false,
      humanReviewAccepted: false,
      ownerFidelityAccepted: false,
      strictComplete: false,
      published: false,
    }));
  invariant(
    sourceStaticEngineeringCandidates.length ===
      SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length,
    "bounded source-static engineering-candidate total drifted",
  );
  const sourceStaticCandidateMetrics = {
    manifestBoundSingleSpriteCandidateCount:
      sourceStaticEngineeringCandidates.filter(
        ({candidateState}) => candidateState.manifestBound,
      ).length,
    independentDualSpriteCompositeCandidateCount:
      sourceStaticEngineeringCandidates.filter(
        ({candidateState}) => !candidateState.manifestBound,
      ).length,
    fullSingleSpriteCandidateCount:
      sourceStaticEngineeringCandidates.filter(
        ({candidateState}) =>
          candidateState.candidateKind === "single-sprite-full",
      ).length,
    safePrefixSingleSpriteCandidateCount:
      sourceStaticEngineeringCandidates.filter(
        ({candidateState}) =>
          candidateState.candidateKind === "single-sprite-safe-prefix",
      ).length,
    openFrameCount: sourceStaticEngineeringCandidates.reduce(
      (sum, {candidateState}) => sum + candidateState.openFrameCount,
      0,
    ),
    blockedTailFrameCount: sourceStaticEngineeringCandidates.reduce(
      (sum, {candidateState}) => sum + candidateState.blockedTailFrameCount,
      0,
    ),
    manifestBoundCanonicalFrameCount:
      sourceStaticEngineeringCandidates
        .filter(({candidateState}) => candidateState.manifestBound)
        .reduce(
          (sum, {candidateState}) =>
            sum + candidateState.sourceStaticFrameCount,
          0,
        ),
    canonicalNestedCoverageCandidateCount:
      sourceStaticEngineeringCandidates.filter(
        ({candidateState}) =>
          candidateState.canonicalNestedCoverageDeclared,
      ).length,
  };

  const machineReportBindings = memberMachineFoundation.map((member) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    migrationManifest: member.migrationManifest,
    machineReport: member.machineReport,
    machineOutputCount: member.machineOutputCount,
    machineOutputSetSha256: member.machineOutputSetSha256,
    engineeringCandidate: member.engineeringCandidate,
    rendererSelected: member.rendererSelected,
    routeDeclared: member.routeDeclared,
    implementationStarted: member.implementationStarted,
  }));
  const workStudyArtifactBindings = workStudyMembers.map((member) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    artifacts: member.artifacts,
  }));
  const ownerWorkAuthorization = projectG5L4OwnerWorkAuthorization(
    records.ownerWorkAuthorizationReceipt.document,
    descriptor(records.ownerWorkAuthorizationReceipt),
  );

  const report = {
    schemaVersion: 4,
    reportType: "g5-l4-m1-machine-foundation-readiness",
    releaseId: RELEASE_ID,
    evidenceState: "m1-machine-foundation-current-acceptance-neutral",
    authority: "This report re-hashes and cross-checks the exact 55-member G5 L4 release, the user-attested machine-only M1 directive, the immutable primary original-runtime/Animate operator assignment receipt, the consolidated user-attested M0 Owner-governance receipt, the Owner blockers 2-4 prospective default-policy authorization receipt, the later Owner continuation/work-authorization intake, the schema-v4 M0 governance requirements and readiness report, all 55 preserved workspaces and static machine reports, the release-role-bound but empty per-session runtime-planning set, the machine-only original-runtime containment requirements and materialized but incomplete host-tree candidate, the current audio/risk/M0 packet, four enhanced work-study preparation packages, 51 manifest-bound single-sprite current-JavaScript engineering candidates (20 full and 31 safe-prefix), and one independently evidenced FQ001 dual-sprite composite candidate whose canonical frame-domain disposition remains unresolved. It records permission to continue remaining in-scope machine and implementation work without changing the existing zero strict implementation-admission count; it also records fail-closed policy approval and machine/unsigned-package preparation authorization, 4/4 Owner decision directives with 2/4 M0 requirements satisfied, 12/12 role-slot intents and one-hour weekly commitments, 0/12 satisfied capacity floors, 0/6 effective backups, 0/3 approved budget gates, machine-foundation, 52 started canonical engineering candidates spanning release ordinals 1 through 52, and eight machine-selected containment engineering candidates with candidate implementations and bounded offline or diagnostic checks. Those eight candidates have zero Owner technical approvals and zero live-session verifications. FQ002 and FQ003 product-only question atlases and the lesson shell remain outside the canonical candidate set. It does not establish portable identity or external roadmap signature, M0 exit, sufficient weekly capacity, effective backup continuity, spending authority, a complete read-only host tree, an Owner-approved or live-verified technical containment mechanism, host/session execution authority, a per-session operator attestation, authoring or implementation acceptance, original-runtime execution or evidence, root-host or Spanish candidate coverage, bilingual or audio acceptance, behavior or RMSE parity, human or Owner fidelity review, strict completion, or publication.",
    generator: descriptor(records.generator),
    sourceBindings: {
      releaseManifest: descriptor(records.releaseManifest),
      m1AuthorizationReceipt: descriptor(records.m1AuthorizationReceipt),
      primaryOriginalRuntimeOperatorAssignmentReceipt:
        descriptor(records.operatorAssignmentReceipt),
      ownerDefaultBlockersAuthorizationReceipt:
        descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
      ownerWorkAuthorizationReceipt:
        descriptor(records.ownerWorkAuthorizationReceipt),
      m0OwnerGovernanceReceipt:
        descriptor(records.m0OwnerGovernanceReceipt),
      m0GovernanceRequirements: descriptor(records.m0GovernanceRequirements),
      machinePacket: Object.fromEntries(
        Object.entries(M0_PACKET_KEYS).map(([packetKey, recordKey]) => [packetKey, descriptor(records[recordKey])]),
      ),
      m0GovernanceReadiness: descriptor(records.m0),
      originalRuntimeContainmentReadiness: descriptor(records.containment),
      workStudyStrictReadinessGenerator: descriptor(strictGeneratorRecord),
      workStudySpecificationInventoryGenerator:
        descriptor(specificationInventoryGeneratorRecord),
      memberMachineFoundationSet: {
        memberCount: machineReportBindings.length,
        sha256: sha256Bytes(Buffer.from(stableJson(machineReportBindings))),
      },
      sourceStaticEngineeringCandidateSet: {
        memberCount: sourceStaticEngineeringCandidates.length,
        sha256: sha256Bytes(Buffer.from(stableJson(
          sourceStaticEngineeringCandidates,
        ))),
      },
      workStudyArtifactSet: {
        memberCount: workStudyArtifactBindings.length,
        artifactCount: workStudyArtifactBindings.length * 8,
        specificationReadinessArtifactCount: workStudyArtifactBindings.length,
        swfAssetDefinitionCensusArtifactCount: workStudyArtifactBindings.length,
        machineDefinitionInventoryArtifactCount: workStudyArtifactBindings.length,
        staticSwfDefinitionCount: workStudyStaticDefinitionCount,
        sha256: sha256Bytes(Buffer.from(stableJson(workStudyArtifactBindings))),
      },
    },
    release: {
      title: release.titleDisplay,
      publicationMode: release.publicationMode,
      members: release.expectedCounts.members,
      pages: release.expectedCounts.activeXmlReferencedPages,
      shells: release.expectedCounts.courseShells,
      shards: release.expectedCounts.shards,
      pairedFlaSwf: sourceScope.summary.pairedFlaSwfCount,
      swfOnly: sourceScope.summary.swfOnlyCount,
      exactMemberSetSha256: sha256Bytes(Buffer.from(stableJson(release.members.map((member) => ({
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        shardId: member.shardId,
        releaseRole: member.releaseRole,
        source: member.source,
      }))))),
    },
    m1Authorization: {
      phase: "M1",
      track: records.m1AuthorizationReceipt.document.authorization.track,
      machineOnly: true,
      ownerFullName: records.m1AuthorizationReceipt.document.identity.ownerFullName,
      identityBasis: "user-attested-current-codex-task",
      portableExternalIdentityVerified: false,
      receipt: descriptor(records.m1AuthorizationReceipt),
      scope: records.m1AuthorizationReceipt.document.authorization.scope,
      intakeReleaseManifestBinding:
        records.m1AuthorizationReceipt.document.sourceBindingsAtIntake
          .releaseManifest,
      currentReleaseManifestBinding: descriptor(records.releaseManifest),
      currentReleaseFingerprintSha256:
        G5_L4_RELEASE_FINGERPRINT_SHA256,
      currentReleaseScopeRevalidated: true,
      fullCatalogHashChangedSinceIntake:
        records.m1AuthorizationReceipt.document.sourceBindingsAtIntake
          .releaseManifest.sha256 !== records.releaseManifest.sha256,
      m0Closed: false,
      implementationAuthorized: false,
      originalRuntimeAuthorized: false,
      fidelityAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      publicationAuthorized: false,
    },
    ownerDefaultPolicyAuthorization: {
      receipt: descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
      ownerDirective: {
        captureBoundary:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .ownerStatement.captureBoundary,
        byteLength:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .ownerStatement.byteLength,
        sha256:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .ownerStatement.sha256,
      },
      blockerReferenceSet: {
        blockerNumbers:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .referencedBlockerSet.blockerNumbers,
        byteLength:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .referencedBlockerSet.byteLength,
        sha256:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .referencedBlockerSet.sha256,
      },
      defaultDisposition:
        "prospective-fail-closed-policy-and-machine-preparation-only",
      policyApproved: true,
      preparationAuthorized: true,
      unsignedPendingOwnerSignaturePackagePreparationAuthorized: true,
      technicalMechanismSelectionAuthorized: false,
      technicalMechanismApprovalEstablished: false,
      technicalMechanismVerificationEstablished: false,
      missingDependencySubstitutionAuthorized: false,
      runtimeHostApprovalEstablished: false,
      immutableSessionAuthorizationEstablished: false,
      runtimeExecutionAuthorized: false,
      animateAuditEstablished: false,
      humanReviewAcceptanceEstablished: false,
      ownerFidelityAcceptanceEstablished: false,
      strictValidationApprovalEstablished: false,
      atomicPublicationApprovalEstablished: false,
      strictAcceptanceEffect:
        "prospective-fail-closed-policy-and-preparation-only",
    },
    ownerWorkAuthorization,
    m0Governance: {
      ownerFullName: m0.ownerGovernance.owner.fullName,
      identityBasis: m0.ownerGovernance.owner.identityEvidence,
      portableExternalIdentityVerified: false,
      consolidatedReceipt: descriptor(records.m0OwnerGovernanceReceipt),
      roadmapSignoffIntentUserAttested: true,
      roadmapPortableExternalSignatureVerified: false,
      ownerDecisionReceiptCount: 4,
      requiredOwnerDecisionCount: 4,
      ownerDecisionM0SatisfiedCount: 2,
      namedRoleSlotIntentCount: 12,
      weeklyCapacityCommitmentCount: 12,
      capacityFloorSatisfiedCount: 0,
      effectiveBackupCoverageCount: 0,
      requiredEffectiveBackupCoverageCount: 6,
      budgetGateApprovedCount: 0,
      budgetGateCount: 3,
      m0Closed: false,
      strictAcceptanceEffect: "m0-governance-intake-only",
    },
    namedOperatorAssignment: {
      roleId: "authorized-original-runtime-operator",
      slot: "primary",
      assigneeFullName: "Dr. Peter Hu",
      identityBasis: "user-attested-current-codex-task",
      portableExternalIdentityVerified: false,
      receipt: descriptor(records.operatorAssignmentReceipt),
      consolidatedGovernanceReceipt:
        descriptor(records.m0OwnerGovernanceReceipt),
      requiredHoursPerWeek: 20,
      committedHoursPerWeek: 1,
      capacityEstablished: false,
      backupSlotIntentRecorded: true,
      backupCommittedHoursPerWeek: 1,
      effectiveBackupCoverageEstablished: false,
      runtimeHostApproved: false,
      containmentApproved: false,
      immutableSessionAuthorizationEstablished: false,
      animateGuiAuthorized: false,
      originalRuntimeAuthorized: false,
      actualAnimateExecutionEstablished: false,
      actualOriginalRuntimeSessionEstablished: false,
      strictAcceptanceEffect: "named-primary-operator-and-backup-intent-only",
    },
    allMemberMachineFoundation: {
      scaffold: {
        workspacesPresent: workspace.summary.presentWorkspaceCount,
        draftValidationPassed: workspace.summary.draftValidationPassCount,
        sourceStaticEngineeringCandidateCount:
          sourceStaticEngineeringCandidates.length,
        rendererSelectedCount: sourceStaticEngineeringCandidates.length,
        routeDeclaredCount: sourceStaticEngineeringCandidates.length,
        implementationStarted: sourceStaticEngineeringCandidates.length,
        nonCandidateNotStartedCount:
          release.members.length - sourceStaticEngineeringCandidates.length,
      },
      staticMachineAudit: {
        reportCount: memberMachineFoundation.length,
        partialAuditCount: memberMachineFoundation.filter(({auditStatus}) => auditStatus === "partial").length,
        sourceHashBindingsCurrent: memberMachineFoundation.length,
        commandSetsPassed: memberMachineFoundation.length,
        pinnedOutputCount: memberMachineFoundation.reduce((sum, member) => sum + member.machineOutputCount, 0),
        structuralRootFrameCount: rootFrameCount,
        structuralNestedDefinitionCount: nestedDefinitionCount,
        unresolvedNestedReachabilityCount: unresolvedReachabilityCount,
        completeRootReachableDomainInventoryCount: runtime.summary.completeRootReachableDomainInventoryCount,
        authorityBoundary: "Static extraction and metadata cross-checks do not prove natural runtime reachability, behavior, audio, or fidelity.",
      },
      runtimePlanning: {
        emptyWorksheetCount: runtime.summary.emptyWorksheetCount,
        runnableArtifactCount: runtime.summary.runnableArtifactCount,
        runtimeSessionCount: 0,
        authoritativeBaselineCount: 0,
        totalCoverageKnownMemberCount: 0,
        namedOperatorRoleAssignmentCount:
          runtime.summary.namedOperatorRoleAssignmentReceiptCount,
        plansWithNamedOperatorRoleAssignmentCount:
          runtime.summary.plansWithNamedOperatorRoleAssignmentCount,
        sessionOperatorAttestationCount:
          runtime.summary.sessionOperatorAttestationCount,
        state: "empty-non-runnable-planning-only",
      },
      runtimeContainment: {
        policyApproved:
          containment.ownerDefaultPolicyAuthorization.policyApproved,
        preparationAuthorized:
          containment.ownerDefaultPolicyAuthorization.preparationAuthorized,
        unsignedPendingOwnerSignaturePackagePreparationAuthorized:
          containment.ownerDefaultPolicyAuthorization
            .unsignedPendingOwnerSignaturePackagePreparationAuthorized,
        controlsSpecified: containment.summary.containmentControlsSpecified,
        policyApprovedControlCount:
          containment.summary.policyApprovedControlCount,
        preparationAuthorizedControlCount:
          containment.summary.preparationAuthorizedControlCount,
        controlsSelected:
          containment.summary.containmentMechanismsSelected,
        controlsApproved: containment.summary.containmentControlsApproved,
        controlsVerified: containment.summary.containmentControlsVerified,
        missingDeclaredDependencyCount:
          containment.summary.missingDeclaredDependencyCount,
        partialHostTreeCandidate:
          containment.hostTreeCandidate.partialHostTreeCandidate,
        completeReadOnlyHostTreeCount:
          containment.summary.completeReadOnlyHostTreeCount,
        cr02TechnicalArtifactComplete:
          containment.hostTreeCandidate.cr02TechnicalArtifactComplete,
        namedOperatorRoleBound:
          containment.executionGate.namedOriginalRuntimeOperatorRoleBound,
        sessionOperatorAttestationBound:
          containment.executionGate.sessionOperatorAttestationBound,
        runnable: containment.executionGate.runnable,
        originalRuntimeExecutionReady:
          containment.executionGate.originalRuntimeExecutionReady,
        state: containment.executionGate.state,
      },
      audioPlanning: {
        candidateFileCount: audio.summary.candidateFileCount,
        physicallyHashVerifiedCandidateCount: audio.summary.physicalHashVerifiedFileCount,
        canonicalInventoryRowCount: audio.summary.canonicalInventoryRowCount,
        dedicatedMachineAudioAuditCount: audio.summary.dedicatedMachineAudioAuditPresentCount,
        machineCueMapCompleteCount: 0,
        spokenLanguageEstablishedFileCount: 0,
        authorizedOriginalRuntimeListeningSessionCount: 0,
        acceptedFileCount: 0,
        acceptedMemberCount: 0,
      },
      riskPlanning: {
        calibrationMemberCount: risk.summary.calibrationMemberCount,
        workStudyTargetCount: risk.summary.workStudyTargetCount,
        workStudyCompletedCount: 0,
        rendererSelectedCount: 0,
        implementationAuthorizedCount: 0,
      },
    },
    sourceStaticEngineeringCandidates: {
      state: "bounded-current-javascript-engineering-candidate-only",
      candidateCount: sourceStaticEngineeringCandidates.length,
      ...sourceStaticCandidateMetrics,
      rendererSelectedCount: sourceStaticEngineeringCandidates.length,
      routeDeclaredCount: sourceStaticEngineeringCandidates.length,
      implementationStartedCount: sourceStaticEngineeringCandidates.length,
      implementationAuthorizedCount: 0,
      rootEnabledCount: 0,
      spanishEnabledCount: 0,
      audioEnabledCount: 0,
      replayParityEstablishedCount: 0,
      originalRuntimeBaselineUsedCount: 0,
      rmseComputedCount: 0,
      humanVisualReviewPerformedCount: 0,
      ownerReviewPerformedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      members: sourceStaticEngineeringCandidates,
      strictAcceptanceEffect:
        "none; these 52 entries record bounded engineering state only",
    },
    workStudyEnhancedPreparation: {
      targetCount: workStudyMembers.length,
      preparedPackageCount: workStudyMembers.length,
      strictReadinessArtifactCount: workStudyMembers.length,
      scenarioInventoryArtifactCount: workStudyMembers.length,
      frameDomainDispositionArtifactCount: workStudyMembers.length,
      audioMachineAuditArtifactCount: workStudyMembers.length,
      specificationInventoryReadinessArtifactCount: workStudyMembers.length,
      swfAssetDefinitionCensusArtifactCount: workStudyMembers.length,
      machineDefinitionInventoryArtifactCount: workStudyMembers.length,
      staticSwfDefinitionCount: workStudyStaticDefinitionCount,
      machineDefinitionInventoryRowCount: workStudyStaticDefinitionCount,
      canonicalAssetInventoryRowCount: workStudyAssetCandidateRowCount,
      canonicalKeyframeRowCount: workStudyKeyframeCandidateRowCount,
      canonicalInventoryRowsSourceDerivedCandidateOnly: true,
      canonicalInventoryRowsFinalSpecification: false,
      rendererAssetExportCount: 0,
      runtimePlacementDispositionCount: 0,
      finalSpecificationReadyCount: 0,
      completedCount: 0,
      pendingHumanTimedStudyCount: workStudyMembers.length,
      runtimeSessionCount: 0,
      implementationAuthorizedCount: 0,
      rendererSelectedCount:
        workStudyMembers.filter(({rendererSelected}) => rendererSelected).length,
      humanReviewAcceptedCount: 0,
      ownerFidelityAcceptedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      members: workStudyMembers,
    },
    blockers: {
      runtime: [
        "Dr. Peter Hu is bound as the user-attested primary original-runtime/Animate operator with a separate one-hour weekly governance commitment; that commitment is below the 20-hour roadmap floor, and approved host/containment context, immutable session authorization, runtime receipt, and original-runtime execution remain absent.",
        "Eight containment engineering candidates are machine-selected and pass bounded offline or diagnostic checks, but all eight remain without Owner technical approval or live-session verification; L4KTE01.xml and L4KTS01.xml remain missing, so the materialized CR-02 host-tree candidate is incomplete.",
        "Natural host-entry EN/ES traversal, ordered interaction/branch/random/scoring/navigation/terminal/Replay traces, and exact state-hash chains are missing.",
        `${unresolvedReachabilityCount} all-release structural nested definitions remain unresolved for runtime reachability; the four work-study frame-domain reports also remain disposition-incomplete.`,
        "No authoritative baseline PNG set, complete frame-domain coverage, implementation comparison, or normalized RMSE acceptance exists.",
        "The four dedicated audio audits are structural only: cue maps, spoken content/language, synchronization, controls, Replay behavior, and original-runtime listening remain unaccepted.",
        "The four specification inventories bind 2,397 source-derived asset candidate rows and 42 source-derived static keyframe candidate rows. Runtime placement, authoring semantics, renderer export/reuse, authoritative runtime keyframes, and final specification remain unresolved.",
      ],
      humanAndOwner: [
        "All four timed work studies remain pending; no human phase timestamps, labor, or measurer identity is recorded.",
        "All twelve primary/backup role-slot intents name Dr. Peter Hu at one hour per week, but 0/12 roadmap capacity floors are satisfied and the same-person backup assignments establish 0/6 effective backup continuity.",
        "The current-task Owner identity and roadmap-signoff intent are user-attested and not portably or cryptographically verified by this report.",
        "All four Owner decision directives are recorded, but only the release-scope and source-gap requirements are M0-satisfied; staffing/capacity/backup and budget/procurement requirements remain fail-closed.",
        "Owner fidelity acceptance, strict-validation approval, and release-custodian atomic publication authorization are absent.",
      ],
      implementationAndRelease: [
        "Exactly 52 bounded canonical current-JavaScript engineering candidates are recorded across release ordinals 1 through 52: 51 manifest-bound single-sprite candidates (20 full and 31 safe-prefix) and one independently evidenced FQ001 dual-sprite composite candidate whose canonical disposition and nested coverage remain unresolved. Owner work permission now authorizes continued implementation and prospective runtime-execution work, while strict implementation admission remains 0/55 and exact-session runtime execution remains unauthorized; root-host entry and Spanish visuals are disabled, and FQ002, FQ003, and the lesson shell remain outside this canonical candidate set; their product-only or shell engineering state grants no canonical candidate authority.",
        "Authoring audits remain unaccepted; 11 release members are SWF-only and 44 paired FLA/SWF members still require the separately controlled authoring workflow.",
        "G5 L4 remains strict 0/55 and unpublished; atomic publication stays closed until every member satisfies every fidelity and review gate.",
      ],
    },
    summary: {
      releaseMemberCount: 55,
      scaffoldedAndDraftValidCount: 55,
      staticMachineAuditCurrentCount: 55,
      emptyRuntimePlanningCount: 55,
      originalRuntimeSessionCount: 0,
      ownerDefaultPolicyAuthorizationReceiptCount: 1,
      ownerWorkAuthorizationReceiptCount: 1,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      policyApproved: true,
      preparationAuthorized: true,
      unsignedPendingOwnerSignaturePackagePreparationAuthorized: true,
      containmentControlsSpecifiedCount:
        containment.summary.containmentControlsSpecified,
      containmentPolicyApprovedControlCount:
        containment.summary.policyApprovedControlCount,
      containmentPreparationAuthorizedControlCount:
        containment.summary.preparationAuthorizedControlCount,
      technicalMechanismSelectedCount:
        containment.summary.containmentMechanismsSelected,
      containmentControlsApprovedCount:
        containment.summary.containmentControlsApproved,
      technicalMechanismVerifiedCount:
        containment.summary.containmentControlsVerified,
      completeReadOnlyHostTreeCount:
        containment.summary.completeReadOnlyHostTreeCount,
      originalRuntimeExecutionReadyCount:
        containment.executionGate.originalRuntimeExecutionReady ? 1 : 0,
      ownerAttestedNamedPrimaryOperatorAssignmentCount: 1,
      ownerDecisionReceiptCount: 4,
      requiredOwnerDecisionCount: 4,
      ownerDecisionM0SatisfiedCount: 2,
      ownerAttestedNamedRoleSlotCount: 12,
      weeklyCapacityCommitmentCount: 12,
      capacityFloorSatisfiedRoleSlotCount: 0,
      effectiveBackupCoverageCount: 0,
      requiredEffectiveBackupCoverageCount: 6,
      budgetGateApprovedCount: 0,
      budgetGateCount: 3,
      roadmapSignoffIntentUserAttested: true,
      roadmapPortableExternalSignatureVerified: false,
      m0ExitReady: false,
      portableExternallyVerifiedNamedOperatorAssignmentCount: 0,
      workStudyPreparedCount: 4,
      workStudySpecificationInventoryPreparedCount: 4,
      workStudyStaticSwfDefinitionCount: workStudyStaticDefinitionCount,
      workStudySourceDerivedAssetCandidateRowCount:
        workStudyAssetCandidateRowCount,
      workStudySourceDerivedKeyframeCandidateRowCount:
        workStudyKeyframeCandidateRowCount,
      workStudyFinalSpecificationReadyCount: 0,
      workStudyCompletedCount: 0,
      sourceStaticEngineeringCandidateCount:
        sourceStaticEngineeringCandidates.length,
      ...sourceStaticCandidateMetrics,
      rendererSelectedCount: sourceStaticEngineeringCandidates.length,
      routeDeclaredCount: sourceStaticEngineeringCandidates.length,
      implementationStartedCount: sourceStaticEngineeringCandidates.length,
      implementationAuthorizedCount: 0,
      humanReviewAcceptedCount: 0,
      ownerFidelityAcceptedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      machineFoundationReady: true,
      fidelityMigrationComplete: false,
    },
    acceptanceEffects: {
      authoringAccepted: false,
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      humanReviewAccepted: false,
      implementationAuthorized: false,
      ownerFidelityAccepted: false,
      published: false,
      rendererSelected: false,
      rmseAccepted: false,
      strictComplete: false,
    },
    strictAcceptanceEffect: "none; this aggregate validates acceptance-neutral M1 machine preparation only",
  };

  validateG5L4M1MachineFoundationReport(report);
  return report;
}

function validateAggregateSourceStaticCandidates(report) {
  const aggregate = report.sourceStaticEngineeringCandidates;
  invariant(
    aggregate?.state ===
        "bounded-current-javascript-engineering-candidate-only" &&
      aggregate.candidateCount === SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      aggregate.manifestBoundSingleSpriteCandidateCount === 51 &&
      aggregate.independentDualSpriteCompositeCandidateCount === 1 &&
      aggregate.fullSingleSpriteCandidateCount === 20 &&
      aggregate.safePrefixSingleSpriteCandidateCount === 31 &&
      aggregate.openFrameCount === 13696 &&
      aggregate.blockedTailFrameCount === 3020 &&
      aggregate.manifestBoundCanonicalFrameCount === 16664 &&
      aggregate.canonicalNestedCoverageCandidateCount === 51 &&
      aggregate.rendererSelectedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      aggregate.routeDeclaredCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      aggregate.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      aggregate.implementationAuthorizedCount === 0 &&
      aggregate.rootEnabledCount === 0 &&
      aggregate.spanishEnabledCount === 0 &&
      aggregate.audioEnabledCount === 0 &&
      aggregate.replayParityEstablishedCount === 0 &&
      aggregate.originalRuntimeBaselineUsedCount === 0 &&
      aggregate.rmseComputedCount === 0 &&
      aggregate.humanVisualReviewPerformedCount === 0 &&
      aggregate.ownerReviewPerformedCount === 0 &&
      aggregate.strictCompleteCount === 0 &&
      aggregate.publishedCount === 0 &&
      aggregate.strictAcceptanceEffect ===
        "none; these 52 entries record bounded engineering state only" &&
      Array.isArray(aggregate.members) &&
      aggregate.members.length === SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length,
    "aggregate bounded source-static engineering-candidate totals drifted",
  );
  invariant(
    report.sourceBindings?.sourceStaticEngineeringCandidateSet?.sha256 ===
      sha256Bytes(Buffer.from(stableJson(aggregate.members))),
    "aggregate source-static engineering-candidate set binding drifted",
  );
  for (const [index, animationId] of
    SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.entries()) {
    const member = aggregate.members[index];
    const expected = SOURCE_STATIC_ENGINEERING_CANDIDATES[animationId];
    invariant(
      member?.ordinal === expected.ordinal &&
        member.animationId === animationId &&
        member.migrationManifest?.path ===
          `migrations/${animationId}/migration.json` &&
        Number.isInteger(member.migrationManifest.bytes) &&
        member.migrationManifest.bytes > 0 &&
        SHA256.test(member.migrationManifest.sha256 || "") &&
        member.rendererSelected === true &&
        member.routeDeclared === true &&
        member.implementationStarted === true,
      `${animationId}: aggregate source-static engineering identity drifted`,
    );
    assertAllFalse(member, [
      "humanReviewAccepted",
      "implementationAuthorized",
      "ownerFidelityAccepted",
      "published",
      "strictComplete",
    ], `${animationId}: aggregate source-static acceptance boundary`);
    invariant(
      stableJson(member.candidateState) ===
        stableJson(
          expectedEngineeringCandidateProjection(animationId, expected),
        ),
      `${animationId}: aggregate bounded candidateState drifted`,
    );
  }
}

export function validateG5L4M1MachineFoundationReport(report) {
  const ownerWorkAuthorizationProjectionPresent =
    report?.ownerWorkAuthorization !== undefined;
  const ownerWorkAuthorizationBindingPresent =
    report?.sourceBindings?.ownerWorkAuthorizationReceipt !== undefined;
  assertExactKeys(
    report,
    [
      "schemaVersion", "reportType", "releaseId", "evidenceState", "authority",
      "generator", "sourceBindings", "release", "m1Authorization",
      "ownerDefaultPolicyAuthorization",
      ...(ownerWorkAuthorizationProjectionPresent ? ["ownerWorkAuthorization"] : []),
      "m0Governance", "namedOperatorAssignment", "allMemberMachineFoundation",
      "sourceStaticEngineeringCandidates", "workStudyEnhancedPreparation",
      "blockers", "summary", "acceptanceEffects", "strictAcceptanceEffect",
    ],
    "aggregate report",
  );
  assertNoG5L4ProtectedGatePromotion(report, {
    label: "aggregate report",
  });
  invariant(report.schemaVersion === 4, "aggregate report schemaVersion drifted");
  invariant(report.reportType === "g5-l4-m1-machine-foundation-readiness", "aggregate reportType drifted");
  invariant(report.releaseId === RELEASE_ID, "aggregate release identity drifted");
  invariant(report.evidenceState === "m1-machine-foundation-current-acceptance-neutral", "aggregate evidence state drifted");
  invariant(report.release?.publicationMode === "atomic" && report.release?.members === 55, "aggregate release scope drifted");
  invariant(
    report.sourceBindings?.primaryOriginalRuntimeOperatorAssignmentReceipt?.path ===
        INPUT_PATHS.operatorAssignmentReceipt &&
      SHA256.test(report.sourceBindings.primaryOriginalRuntimeOperatorAssignmentReceipt.sha256 || "") &&
      report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt?.path ===
        INPUT_PATHS.ownerDefaultBlockersAuthorizationReceipt &&
      SHA256.test(
        report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt.sha256 ||
          "",
      ) &&
      report.sourceBindings.m0OwnerGovernanceReceipt?.path ===
        INPUT_PATHS.m0OwnerGovernanceReceipt &&
      SHA256.test(report.sourceBindings.m0OwnerGovernanceReceipt.sha256 || "") &&
      report.sourceBindings.m0GovernanceRequirements?.path === INPUT_PATHS.m0GovernanceRequirements &&
      SHA256.test(report.sourceBindings.m0GovernanceRequirements.sha256 || "") &&
      report.sourceBindings.originalRuntimeContainmentReadiness?.path ===
        INPUT_PATHS.containment &&
      SHA256.test(
        report.sourceBindings.originalRuntimeContainmentReadiness.sha256 || "",
      ) &&
      report.sourceBindings.memberMachineFoundationSet?.memberCount === 55 &&
      SHA256.test(report.sourceBindings.memberMachineFoundationSet.sha256 || "") &&
      report.sourceBindings.sourceStaticEngineeringCandidateSet?.memberCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      SHA256.test(
        report.sourceBindings.sourceStaticEngineeringCandidateSet.sha256 || "",
      ) &&
      report.sourceBindings.workStudyArtifactSet?.memberCount === 4 &&
      report.sourceBindings.workStudyArtifactSet.artifactCount === 32 &&
      report.sourceBindings.workStudyArtifactSet.specificationReadinessArtifactCount === 4 &&
      report.sourceBindings.workStudyArtifactSet.swfAssetDefinitionCensusArtifactCount === 4 &&
      report.sourceBindings.workStudyArtifactSet.machineDefinitionInventoryArtifactCount === 4 &&
      report.sourceBindings.workStudyArtifactSet.staticSwfDefinitionCount === 2397 &&
      SHA256.test(report.sourceBindings.workStudyArtifactSet.sha256 || ""),
    "aggregate source-binding sets drifted",
  );
  invariant(report.m1Authorization?.machineOnly === true && report.m1Authorization?.portableExternalIdentityVerified === false, "aggregate M1 authority boundary drifted");
  invariant(
    report.m1Authorization.intakeReleaseManifestBinding?.path ===
        INPUT_PATHS.releaseManifest &&
      report.m1Authorization.intakeReleaseManifestBinding.sha256 ===
        G5_L4_INTAKE_RELEASE_MANIFEST_SHA256 &&
      report.m1Authorization.currentReleaseManifestBinding?.path ===
        INPUT_PATHS.releaseManifest &&
      SHA256.test(
        report.m1Authorization.currentReleaseManifestBinding.sha256 || "",
      ) &&
      report.m1Authorization.currentReleaseFingerprintSha256 ===
        G5_L4_RELEASE_FINGERPRINT_SHA256 &&
      report.m1Authorization.currentReleaseScopeRevalidated === true &&
      report.m1Authorization.fullCatalogHashChangedSinceIntake === true,
    "aggregate M1 intake/current release binding boundary drifted",
  );
  assertAllFalse(report.m1Authorization, [
    "fidelityAcceptanceEstablished",
    "implementationAuthorized",
    "m0Closed",
    "originalRuntimeAuthorized",
    "publicationAuthorized",
    "strictCompletionEstablished",
  ], "aggregate M1 authorization");
  const policy = report.ownerDefaultPolicyAuthorization;
  invariant(
    policy?.defaultDisposition ===
        "prospective-fail-closed-policy-and-machine-preparation-only" &&
      policy.policyApproved === true &&
      policy.preparationAuthorized === true &&
      policy.unsignedPendingOwnerSignaturePackagePreparationAuthorized ===
        true &&
      policy.ownerDirective?.captureBoundary ===
        "exact-visible-message-markdown-source-with-single-lf" &&
      policy.ownerDirective.byteLength === 84 &&
      policy.ownerDirective.sha256 ===
        "f9e39425a4d3ad8baafab9e3cb4020dba4c90b4ebc0c043d743d46309f8ee0ef" &&
      JSON.stringify(policy.blockerReferenceSet?.blockerNumbers) ===
        JSON.stringify([2, 3, 4]) &&
      policy.blockerReferenceSet.byteLength === 434 &&
      policy.blockerReferenceSet.sha256 ===
        "3b4644bdbb72204a380a530690cc5850871012913000ee7b8bbc2de32db0d118" &&
      policy.strictAcceptanceEffect ===
        "prospective-fail-closed-policy-and-preparation-only",
    "aggregate Owner default-policy authorization drifted",
  );
  assertDescriptor(
    policy.receipt,
    report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt,
    "aggregate Owner default-policy authorization receipt",
  );
  assertAllFalse(policy, [
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
  ], "aggregate Owner default-policy technical/execution/acceptance boundary");
  invariant(
    ownerWorkAuthorizationProjectionPresent ===
      ownerWorkAuthorizationBindingPresent,
    "aggregate Owner work-authorization projection/binding presence drifted",
  );
  if (ownerWorkAuthorizationProjectionPresent) {
    invariant(
      report.sourceBindings.ownerWorkAuthorizationReceipt.path ===
          INPUT_PATHS.ownerWorkAuthorizationReceipt &&
        SHA256.test(
          report.sourceBindings.ownerWorkAuthorizationReceipt.sha256 || "",
        ),
      "aggregate Owner work-authorization receipt binding drifted",
    );
    validateG5L4OwnerWorkAuthorizationProjection(
      report.ownerWorkAuthorization,
      report.sourceBindings.ownerWorkAuthorizationReceipt,
    );
  }
  invariant(
    report.m0Governance?.ownerFullName === "Dr. Peter Hu" &&
      report.m0Governance.identityBasis === "user-attested-current-codex-task" &&
      report.m0Governance.portableExternalIdentityVerified === false &&
      report.m0Governance.roadmapSignoffIntentUserAttested === true &&
      report.m0Governance.roadmapPortableExternalSignatureVerified === false &&
      report.m0Governance.ownerDecisionReceiptCount === 4 &&
      report.m0Governance.requiredOwnerDecisionCount === 4 &&
      report.m0Governance.ownerDecisionM0SatisfiedCount === 2 &&
      report.m0Governance.namedRoleSlotIntentCount === 12 &&
      report.m0Governance.weeklyCapacityCommitmentCount === 12 &&
      report.m0Governance.capacityFloorSatisfiedCount === 0 &&
      report.m0Governance.effectiveBackupCoverageCount === 0 &&
      report.m0Governance.requiredEffectiveBackupCoverageCount === 6 &&
      report.m0Governance.budgetGateApprovedCount === 0 &&
      report.m0Governance.budgetGateCount === 3 &&
      report.m0Governance.m0Closed === false &&
      report.m0Governance.strictAcceptanceEffect === "m0-governance-intake-only",
    "aggregate M0 governance projection drifted",
  );
  assertDescriptor(
    report.m0Governance.consolidatedReceipt,
    report.sourceBindings.m0OwnerGovernanceReceipt,
    "aggregate consolidated M0 Owner-governance receipt",
  );
  invariant(
    report.namedOperatorAssignment?.roleId === "authorized-original-runtime-operator" &&
      report.namedOperatorAssignment.slot === "primary" &&
      report.namedOperatorAssignment.assigneeFullName === "Dr. Peter Hu" &&
      report.namedOperatorAssignment.identityBasis === "user-attested-current-codex-task" &&
      report.namedOperatorAssignment.portableExternalIdentityVerified === false &&
      report.namedOperatorAssignment.requiredHoursPerWeek === 20 &&
      report.namedOperatorAssignment.committedHoursPerWeek === 1 &&
      report.namedOperatorAssignment.capacityEstablished === false &&
      report.namedOperatorAssignment.backupSlotIntentRecorded === true &&
      report.namedOperatorAssignment.backupCommittedHoursPerWeek === 1 &&
      report.namedOperatorAssignment.effectiveBackupCoverageEstablished === false &&
      report.namedOperatorAssignment.strictAcceptanceEffect ===
        "named-primary-operator-and-backup-intent-only",
    "aggregate named-operator assignment drifted",
  );
  assertDescriptor(
    report.namedOperatorAssignment.consolidatedGovernanceReceipt,
    report.sourceBindings.m0OwnerGovernanceReceipt,
    "aggregate named-operator governance receipt",
  );
  assertAllFalse(report.namedOperatorAssignment, [
    "actualAnimateExecutionEstablished",
    "actualOriginalRuntimeSessionEstablished",
    "animateGuiAuthorized",
    "capacityEstablished",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "originalRuntimeAuthorized",
    "runtimeHostApproved",
  ], "aggregate named-operator execution boundary");
  invariant(
    report.allMemberMachineFoundation?.scaffold?.workspacesPresent === 55 &&
      report.allMemberMachineFoundation.scaffold.draftValidationPassed === 55 &&
      report.allMemberMachineFoundation.scaffold
        .sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.allMemberMachineFoundation.scaffold.rendererSelectedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.allMemberMachineFoundation.scaffold.routeDeclaredCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.allMemberMachineFoundation.scaffold.implementationStarted ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.allMemberMachineFoundation.scaffold.nonCandidateNotStartedCount ===
        3 &&
      report.allMemberMachineFoundation.staticMachineAudit.reportCount === 55 &&
      report.allMemberMachineFoundation.staticMachineAudit.commandSetsPassed === 55,
    "aggregate all-member machine foundation is incomplete",
  );
  invariant(
    report.allMemberMachineFoundation.runtimePlanning?.emptyWorksheetCount === 55 &&
      report.allMemberMachineFoundation.runtimePlanning.namedOperatorRoleAssignmentCount === 1 &&
      report.allMemberMachineFoundation.runtimePlanning.plansWithNamedOperatorRoleAssignmentCount === 55 &&
      report.allMemberMachineFoundation.runtimePlanning.sessionOperatorAttestationCount === 0 &&
      report.allMemberMachineFoundation.runtimePlanning.runtimeSessionCount === 0 &&
      report.allMemberMachineFoundation.runtimePlanning.runnableArtifactCount === 0,
    "aggregate runtime planning was promoted",
  );
  invariant(
    report.allMemberMachineFoundation.runtimeContainment?.policyApproved ===
        true &&
      report.allMemberMachineFoundation.runtimeContainment
        .preparationAuthorized === true &&
      report.allMemberMachineFoundation.runtimeContainment
        .unsignedPendingOwnerSignaturePackagePreparationAuthorized === true &&
      report.allMemberMachineFoundation.runtimeContainment.controlsSpecified ===
        8 &&
      report.allMemberMachineFoundation.runtimeContainment
        .policyApprovedControlCount === 8 &&
      report.allMemberMachineFoundation.runtimeContainment
        .preparationAuthorizedControlCount === 8 &&
      report.allMemberMachineFoundation.runtimeContainment.controlsSelected === 8 &&
      report.allMemberMachineFoundation.runtimeContainment.controlsApproved === 0 &&
      report.allMemberMachineFoundation.runtimeContainment.controlsVerified === 0 &&
      report.allMemberMachineFoundation.runtimeContainment.missingDeclaredDependencyCount === 2 &&
      report.allMemberMachineFoundation.runtimeContainment.partialHostTreeCandidate === true &&
      report.allMemberMachineFoundation.runtimeContainment.completeReadOnlyHostTreeCount === 0 &&
      report.allMemberMachineFoundation.runtimeContainment.cr02TechnicalArtifactComplete === false &&
      report.allMemberMachineFoundation.runtimeContainment.namedOperatorRoleBound === true &&
      report.allMemberMachineFoundation.runtimeContainment.sessionOperatorAttestationBound === false &&
      report.allMemberMachineFoundation.runtimeContainment.runnable === false &&
      report.allMemberMachineFoundation.runtimeContainment.originalRuntimeExecutionReady === false,
    "aggregate runtime containment was promoted",
  );
  validateAggregateSourceStaticCandidates(report);
  invariant(
    report.workStudyEnhancedPreparation?.targetCount === 4 &&
      report.workStudyEnhancedPreparation.preparedPackageCount === 4 &&
      report.workStudyEnhancedPreparation.specificationInventoryReadinessArtifactCount === 4 &&
      report.workStudyEnhancedPreparation.swfAssetDefinitionCensusArtifactCount === 4 &&
      report.workStudyEnhancedPreparation.machineDefinitionInventoryArtifactCount === 4 &&
      report.workStudyEnhancedPreparation.staticSwfDefinitionCount === 2397 &&
      report.workStudyEnhancedPreparation.machineDefinitionInventoryRowCount === 2397 &&
      report.workStudyEnhancedPreparation.canonicalAssetInventoryRowCount === 2397 &&
      report.workStudyEnhancedPreparation.canonicalKeyframeRowCount === 42 &&
      report.workStudyEnhancedPreparation.canonicalInventoryRowsSourceDerivedCandidateOnly === true &&
      report.workStudyEnhancedPreparation.canonicalInventoryRowsFinalSpecification === false &&
      report.workStudyEnhancedPreparation.finalSpecificationReadyCount === 0 &&
      report.workStudyEnhancedPreparation.completedCount === 0 &&
      report.workStudyEnhancedPreparation.members?.length === 4,
    "aggregate work-study state drifted",
  );
  invariant(report.workStudyEnhancedPreparation.members.every((member) => {
    const expectedCandidate =
      Boolean(sourceStaticCandidateFor(member.animationId));
    return member.enhancedPreparation?.specificationInventoryPrepared === true &&
      member.enhancedPreparation.staticSwfDefinitionCensusComplete === true &&
      member.enhancedPreparation.staticSwfDefinitionCount > 0 &&
      member.enhancedPreparation.machineDefinitionInventoryRowCount ===
        member.enhancedPreparation.staticSwfDefinitionCount &&
      member.enhancedPreparation.rendererAssetExportCount === 0 &&
      member.enhancedPreparation.runtimePlacementDispositionCount === 0 &&
      member.enhancedPreparation.sourceDerivedAssetCandidateRowCount > 0 &&
      member.enhancedPreparation.sourceDerivedAssetCandidateRowCount ===
        member.enhancedPreparation.staticSwfDefinitionCount &&
      member.enhancedPreparation.sourceDerivedKeyframeCandidateRowCount > 0 &&
      member.enhancedPreparation.sourceDerivedCandidateRowsFinal === false &&
      member.enhancedPreparation.finalSpecificationReady === false &&
      member.runtimeSessionsExecuted === 0 &&
      member.implementationAuthorized === false &&
      member.rendererSelected === expectedCandidate &&
      member.routeDeclared === expectedCandidate &&
      member.implementationStarted === expectedCandidate &&
      member.currentJavaScriptCandidate === expectedCandidate &&
      member.humanReviewAccepted === false &&
      member.ownerFidelityAccepted === false &&
      member.strictComplete === false &&
      member.published === false;
  }), "aggregate work-study member was promoted");
  invariant(
    report.workStudyEnhancedPreparation.rendererSelectedCount === 2,
    "aggregate work-study candidate count drifted",
  );
  invariant(report.summary?.machineFoundationReady === true, "aggregate machine foundation is not ready");
  invariant(report.summary?.fidelityMigrationComplete === false, "aggregate claims fidelity completion");
  invariant(report.summary?.originalRuntimeSessionCount === 0, "aggregate claims original-runtime sessions");
  invariant(
    report.summary?.ownerDefaultPolicyAuthorizationReceiptCount === 1 &&
      (ownerWorkAuthorizationProjectionPresent
        ? report.summary.ownerWorkAuthorizationReceiptCount === 1 &&
          report.summary.implementationWorkAuthorized === true &&
          report.summary.runtimeExecutionWorkAuthorized === true
        : report.summary.ownerWorkAuthorizationReceiptCount === undefined &&
          report.summary.implementationWorkAuthorized === undefined &&
          report.summary.runtimeExecutionWorkAuthorized === undefined) &&
      report.summary.policyApproved === true &&
      report.summary.preparationAuthorized === true &&
      report.summary
        .unsignedPendingOwnerSignaturePackagePreparationAuthorized === true &&
      report.summary.containmentControlsSpecifiedCount === 8 &&
      report.summary.containmentPolicyApprovedControlCount === 8 &&
      report.summary.containmentPreparationAuthorizedControlCount === 8 &&
      report.summary.technicalMechanismSelectedCount === 8 &&
      report.summary.containmentControlsApprovedCount === 0 &&
      report.summary.technicalMechanismVerifiedCount === 0 &&
      report.summary.completeReadOnlyHostTreeCount === 0 &&
      report.summary.originalRuntimeExecutionReadyCount === 0,
    "aggregate containment summary drifted",
  );
  invariant(
    report.summary?.ownerAttestedNamedPrimaryOperatorAssignmentCount === 1 &&
      report.summary.portableExternallyVerifiedNamedOperatorAssignmentCount === 0,
    "aggregate named-operator summary drifted",
  );
  invariant(
    report.summary?.ownerDecisionReceiptCount === 4 &&
      report.summary.requiredOwnerDecisionCount === 4 &&
      report.summary.ownerDecisionM0SatisfiedCount === 2 &&
      report.summary.ownerAttestedNamedRoleSlotCount === 12 &&
      report.summary.weeklyCapacityCommitmentCount === 12 &&
      report.summary.capacityFloorSatisfiedRoleSlotCount === 0 &&
      report.summary.effectiveBackupCoverageCount === 0 &&
      report.summary.requiredEffectiveBackupCoverageCount === 6 &&
      report.summary.budgetGateApprovedCount === 0 &&
      report.summary.budgetGateCount === 3 &&
      report.summary.roadmapSignoffIntentUserAttested === true &&
      report.summary.roadmapPortableExternalSignatureVerified === false &&
      report.summary.m0ExitReady === false,
    "aggregate M0-governance summary drifted",
  );
  invariant(report.summary?.workStudyCompletedCount === 0, "aggregate claims completed work studies");
  assertExactKeys(
    report.summary,
    [
      "releaseMemberCount", "scaffoldedAndDraftValidCount",
      "staticMachineAuditCurrentCount", "emptyRuntimePlanningCount",
      "originalRuntimeSessionCount", "ownerDefaultPolicyAuthorizationReceiptCount",
      ...(ownerWorkAuthorizationProjectionPresent
        ? ["ownerWorkAuthorizationReceiptCount", "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized"]
        : []),
      "policyApproved", "preparationAuthorized",
      "unsignedPendingOwnerSignaturePackagePreparationAuthorized",
      "containmentControlsSpecifiedCount", "containmentPolicyApprovedControlCount",
      "containmentPreparationAuthorizedControlCount", "technicalMechanismSelectedCount",
      "containmentControlsApprovedCount", "technicalMechanismVerifiedCount",
      "completeReadOnlyHostTreeCount", "originalRuntimeExecutionReadyCount",
      "ownerAttestedNamedPrimaryOperatorAssignmentCount", "ownerDecisionReceiptCount",
      "requiredOwnerDecisionCount", "ownerDecisionM0SatisfiedCount",
      "ownerAttestedNamedRoleSlotCount", "weeklyCapacityCommitmentCount",
      "capacityFloorSatisfiedRoleSlotCount", "effectiveBackupCoverageCount",
      "requiredEffectiveBackupCoverageCount", "budgetGateApprovedCount",
      "budgetGateCount", "roadmapSignoffIntentUserAttested",
      "roadmapPortableExternalSignatureVerified", "m0ExitReady",
      "portableExternallyVerifiedNamedOperatorAssignmentCount", "workStudyPreparedCount",
      "workStudySpecificationInventoryPreparedCount", "workStudyStaticSwfDefinitionCount",
      "workStudySourceDerivedAssetCandidateRowCount",
      "workStudySourceDerivedKeyframeCandidateRowCount",
      "workStudyFinalSpecificationReadyCount", "workStudyCompletedCount",
      "sourceStaticEngineeringCandidateCount", "manifestBoundSingleSpriteCandidateCount",
      "independentDualSpriteCompositeCandidateCount", "fullSingleSpriteCandidateCount",
      "safePrefixSingleSpriteCandidateCount", "openFrameCount", "blockedTailFrameCount",
      "manifestBoundCanonicalFrameCount", "canonicalNestedCoverageCandidateCount",
      "rendererSelectedCount", "routeDeclaredCount", "implementationStartedCount",
      "implementationAuthorizedCount", "humanReviewAcceptedCount",
      "ownerFidelityAcceptedCount", "strictCompleteCount", "publishedCount",
      "machineFoundationReady", "fidelityMigrationComplete",
    ],
    "aggregate summary",
  );
  invariant(
    report.summary?.workStudySpecificationInventoryPreparedCount === 4 &&
      report.summary.workStudyStaticSwfDefinitionCount === 2397 &&
      report.summary.workStudySourceDerivedAssetCandidateRowCount === 2397 &&
      report.summary.workStudySourceDerivedKeyframeCandidateRowCount === 42 &&
      report.summary.workStudyFinalSpecificationReadyCount === 0,
    "aggregate specification-inventory state drifted",
  );
  invariant(
    report.summary?.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.summary.rendererSelectedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.summary.routeDeclaredCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      report.summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      report.summary.independentDualSpriteCompositeCandidateCount === 1 &&
      report.summary.fullSingleSpriteCandidateCount === 20 &&
      report.summary.safePrefixSingleSpriteCandidateCount === 31 &&
      report.summary.openFrameCount === 13696 &&
      report.summary.blockedTailFrameCount === 3020 &&
      report.summary.manifestBoundCanonicalFrameCount === 16664 &&
      report.summary.canonicalNestedCoverageCandidateCount === 51 &&
      report.summary.implementationAuthorizedCount === 0,
    "aggregate bounded engineering-candidate state drifted",
  );
  invariant(report.summary?.strictCompleteCount === 0 && report.summary?.publishedCount === 0, "aggregate claims strict completion or publication");
  assertExactKeys(report.acceptanceEffects, [
    "audioAccepted",
    "authoringAccepted",
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
  ], "aggregate acceptance effects");
  assertAllFalse(report.acceptanceEffects, [
    "audioAccepted",
    "authoringAccepted",
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
  ], "aggregate acceptance");
  invariant(/^none;/.test(report.strictAcceptanceEffect || ""), "aggregate strict acceptance effect drifted");
  return true;
}

export function renderMarkdown(report) {
  validateG5L4M1MachineFoundationReport(report);
  const sourceStaticCandidateRows =
    report.sourceStaticEngineeringCandidates.members.map((member) =>
      `| \`${member.animationId}\` | ${member.candidateState.candidateKind} | \`${member.candidateState.sourceStaticFrameDomainId}\` | ${member.candidateState.openFrameCount}/${member.candidateState.sourceStaticFrameCount} | ${member.candidateState.blockedTailFrameCount} | ${member.candidateState.canonicalNestedCoverageDeclared} | \`${member.candidateState.route}\` | ${member.implementationAuthorized} |`,
    ).join("\n");
  const workStudyRows = report.workStudyEnhancedPreparation.members.map((member) =>
    `| \`${member.animationId}\` | ${member.sourceModel} | ${member.enhancedPreparation.scenarioInventoryPrepared} | ${member.enhancedPreparation.unresolvedFrameDomainCount} | ${member.enhancedPreparation.audioMachineAuditPrepared} | ${member.enhancedPreparation.staticSwfDefinitionCount} | false | 0 | 0 |`,
  ).join("\n");
  return `# G5 L4 M1 machine-foundation readiness\n\n` +
    `> ${report.authority}\n\n` +
    `## Outcome\n\n` +
    `- Exact release: **${report.summary.releaseMemberCount}/55** members; **${report.release.pages} pages + ${report.release.shells} shell**; publication mode **${report.release.publicationMode}**.\n` +
    `- Scaffold and draft validation: **${report.summary.scaffoldedAndDraftValidCount}/55**.\n` +
    `- Static machine reports current: **${report.summary.staticMachineAuditCurrentCount}/55** with **${report.allMemberMachineFoundation.staticMachineAudit.pinnedOutputCount}** physically re-hashed output pins.\n` +
    `- Empty, non-runnable runtime plans: **${report.summary.emptyRuntimePlanningCount}/55**; original-runtime sessions: **0**.\n` +
    `- Owner blockers 2–4 fail-closed policy / machine preparation authorized: **${report.summary.policyApproved} / ${report.summary.preparationAuthorized}**; unsigned pending-Owner-signature package preparation: **${report.summary.unsignedPendingOwnerSignaturePackagePreparationAuthorized}**.\n` +
    `- Original-runtime containment: **${report.summary.containmentControlsSpecifiedCount}/8** controls specified; policy-approved / preparation-authorized **${report.summary.containmentPolicyApprovedControlCount}/8 / ${report.summary.containmentPreparationAuthorizedControlCount}/8**; technical mechanisms selected / approved / verified **${report.summary.technicalMechanismSelectedCount}/8 / ${report.summary.containmentControlsApprovedCount}/8 / ${report.summary.technicalMechanismVerifiedCount}/8**; complete read-only host trees: **${report.summary.completeReadOnlyHostTreeCount}**; execution ready: **false**.\n` +
    `- Owner decisions recorded / M0-satisfied: **${report.summary.ownerDecisionReceiptCount}/${report.summary.requiredOwnerDecisionCount} / ${report.summary.ownerDecisionM0SatisfiedCount}/${report.summary.requiredOwnerDecisionCount}**; M0 exit ready: **false**.\n` +
    `- Owner-attested named role slots / weekly commitments: **${report.summary.ownerAttestedNamedRoleSlotCount}/12 / ${report.summary.weeklyCapacityCommitmentCount}/12**; capacity floors satisfied: **${report.summary.capacityFloorSatisfiedRoleSlotCount}/12**; effective backups: **${report.summary.effectiveBackupCoverageCount}/${report.summary.requiredEffectiveBackupCoverageCount}**.\n` +
    `- Budget gates approved: **${report.summary.budgetGateApprovedCount}/${report.summary.budgetGateCount}**; portable externally verified role identities: **${report.summary.portableExternallyVerifiedNamedOperatorAssignmentCount}**.\n` +
    `- Work-study enhanced preparation: **${report.summary.workStudyPreparedCount}/4**; completed human work studies: **0/4**.\n` +
    `- Work-study specification inventories: **${report.summary.workStudySpecificationInventoryPreparedCount}/4**; static SWF definitions: **${report.summary.workStudyStaticSwfDefinitionCount}**; source-derived asset/keyframe candidate rows: **${report.summary.workStudySourceDerivedAssetCandidateRowCount}/${report.summary.workStudySourceDerivedKeyframeCandidateRowCount}**; final specification ready: **0/4**.\n` +
    `- Source-static engineering candidates / renderer selected / route declared / implementation started: **${report.summary.sourceStaticEngineeringCandidateCount}/55 / ${report.summary.rendererSelectedCount}/55 / ${report.summary.routeDeclaredCount}/55 / ${report.summary.implementationStartedCount}/55**; implementation authorized: **0/55**.\n` +
    `- Candidate split: **${report.summary.fullSingleSpriteCandidateCount} full single-sprite + ${report.summary.safePrefixSingleSpriteCandidateCount} safe-prefix single-sprite + ${report.summary.independentDualSpriteCompositeCandidateCount} independently evidenced FQ001 dual-sprite composite**; open/blocked-tail frames: **${report.summary.openFrameCount}/${report.summary.blockedTailFrameCount}**; canonical nested coverage declared by **${report.summary.canonicalNestedCoverageCandidateCount}** candidates.\n` +
    `- Human review / Owner fidelity / strict / published: **0 / 0 / 0/55 / 0/55**.\n` +
    `- Machine foundation ready: **true**; fidelity migration complete: **false**.\n\n` +
    `## M1 authority boundary\n\n` +
    `- Phase/track: **${report.m1Authorization.phase} / ${report.m1Authorization.track}**; machine-only: **true**.\n` +
    `- Owner named in the current-task directive: **${report.m1Authorization.ownerFullName}**; portable external identity verified: **false**.\n` +
    `- The full release-catalog file changed after intake, while the current G5 L4 release fingerprint was revalidated unchanged: **${report.m1Authorization.currentReleaseScopeRevalidated}**.\n` +
    `- Roadmap signoff intent is user-attested: **true**; portable external roadmap signature verified: **false**.\n` +
    `- The blockers 2–4 directive authorizes prospective fail-closed policy, machine preparation, and unsigned pending-signature packages only; it selects or validates no technical control and grants no session, review, strict, or publication authority.\n` +
    `- Implementation, original runtime, fidelity acceptance, strict completion, and publication authorized by this aggregate: **false/false/false/false/false**.\n\n` +
    `## Named original-runtime / Animate operator\n\n` +
    `- Primary operator: **${report.namedOperatorAssignment.assigneeFullName}**; identity basis: **${report.namedOperatorAssignment.identityBasis}**; portable external identity verified: **false**.\n` +
    `- Required / committed weekly hours: **${report.namedOperatorAssignment.requiredHoursPerWeek} / ${report.namedOperatorAssignment.committedHoursPerWeek}**; capacity floor satisfied: **false**.\n` +
    `- Backup slot intent / committed weekly hours / effective backup continuity: **true / ${report.namedOperatorAssignment.backupCommittedHoursPerWeek} / false**. The same person occupies both slots, so the backup intent is not effective continuity.\n` +
    `- The earlier immutable primary-operator receipt remains the runtime execution-boundary provenance; the consolidated M0 receipt records later governance intent only.\n` +
    `- Runtime host / containment / immutable session / Animate execution / original-runtime execution established: **false/false/false/false/false**.\n\n` +
    `## All-55 machine foundation\n\n` +
    `- Source model: ${report.release.pairedFlaSwf} paired FLA/SWF; ${report.release.swfOnly} SWF-only.\n` +
    `- Static structure: ${report.allMemberMachineFoundation.staticMachineAudit.structuralRootFrameCount} root frames; ${report.allMemberMachineFoundation.staticMachineAudit.structuralNestedDefinitionCount} nested definitions; ${report.allMemberMachineFoundation.staticMachineAudit.unresolvedNestedReachabilityCount} unresolved reachability candidates.\n` +
    `- Runtime containment: policy/preparation **true/true**; ${report.allMemberMachineFoundation.runtimeContainment.controlsSpecified}/8 requirements specified; technical mechanisms selected/approved/verified ${report.allMemberMachineFoundation.runtimeContainment.controlsSelected}/${report.allMemberMachineFoundation.runtimeContainment.controlsApproved}/${report.allMemberMachineFoundation.runtimeContainment.controlsVerified}; missing declared dependencies ${report.allMemberMachineFoundation.runtimeContainment.missingDeclaredDependencyCount}; CR-02 complete **false**; runnable **false**.\n` +
    `- Audio: ${report.allMemberMachineFoundation.audioPlanning.physicallyHashVerifiedCandidateCount}/${report.allMemberMachineFoundation.audioPlanning.candidateFileCount} candidates physically hash-verified; ${report.allMemberMachineFoundation.audioPlanning.dedicatedMachineAudioAuditCount} dedicated release-member structural audits; cue maps 0; spoken-language findings 0; listening sessions 0; accepted files/members 0/0.\n` +
    `- Risk/time study: ${report.allMemberMachineFoundation.riskPlanning.calibrationMemberCount} calibration members; 4 selected human work-study targets; 0 completed.\n\n` +
    `- Specification inventory: 4 machine-only readiness receipts, 4 SWF definition censuses, and 4 machine CSV inventories bind ${report.workStudyEnhancedPreparation.staticSwfDefinitionCount} static definitions plus ${report.workStudyEnhancedPreparation.canonicalAssetInventoryRowCount}/${report.workStudyEnhancedPreparation.canonicalKeyframeRowCount} source-derived asset/keyframe candidate rows. These rows are non-final; renderer exports and runtime-placement dispositions remain 0 and 0.\n\n` +
    `## Fifty-two bounded canonical current-JavaScript engineering candidates\n\n` +
    `| Member | Kind | Candidate frame domain | Open/candidate frames | Blocked tail | Canonical nested coverage | Route | Implementation authorized |\n` +
    `|---|---|---|---:|---:|---:|---|---:|\n${sourceStaticCandidateRows}\n\n` +
    `These 52 entries span release ordinals 1 through 52 and record bounded canonical current-JavaScript engineering state only: 51 are manifest-bound single-sprite candidates (20 full and 31 safe-prefix), while FQ001 is an independently evidenced dual-sprite composite whose canonical frame-domain disposition and nested coverage remain unresolved. Root-host entry, Spanish visuals, audio, source controls, Replay parity, authoritative original-runtime comparison, RMSE, human review, Owner acceptance, strict completion, and publication remain false. FQ002 and FQ003 product-only question atlases and the lesson shell remain outside this canonical candidate set.\n\n` +
    `## Four-member enhanced preparation\n\n` +
    `| Member | Source model | Scenario inventory | Unresolved domains | Audio audit | Static definitions | Final specification | Runtime sessions | Work study complete |\n` +
    `|---|---|---:|---:|---:|---:|---:|---:|---:|\n${workStudyRows}\n\n` +
    `Every row is static, acceptance-neutral preparation. Scenario inventories remain runtime-unverified; frame-domain reports remain disposition-incomplete; audio audits remain unheard and unaccepted; definition censuses do not establish runtime placement, authoring semantics, renderer reuse, or final specification.\n\n` +
    `## Runtime blockers\n\n${report.blockers.runtime.map((item) => `- ${item}`).join("\n")}\n\n` +
    `## Human and Owner blockers\n\n${report.blockers.humanAndOwner.map((item) => `- ${item}`).join("\n")}\n\n` +
    `## Implementation and release blockers\n\n${report.blockers.implementationAndRelease.map((item) => `- ${item}`).join("\n")}\n\n` +
    `## Acceptance boundary\n\n` +
    `Original runtime, audio, behavior, full-frame/RMSE, human review, Owner fidelity, implementation authorization, strict completion, and publication are all **false**. Strict acceptance effect: **none**.\n`;
}

function outputPaths(projectRoot, outputPrefix) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("reports/") &&
      !outputPrefix.endsWith(".json") &&
      !outputPrefix.endsWith(".md"),
    "--output-prefix must be one extensionless project-relative path below reports/",
  );
  const prefix = resolveProjectPath(projectRoot, outputPrefix, "output prefix");
  return {json: `${prefix}.json`, markdown: `${prefix}.md`};
}

async function existingOutputIdentity(file, projectRoot) {
  const metadata = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${portable(path.relative(projectRoot, file))}: output must be one ordinary non-linked file`,
  );
  return {dev: metadata.dev, ino: metadata.ino, size: metadata.size, mtimeMs: metadata.mtimeMs};
}

async function existingOutputState(file, projectRoot) {
  const before = await existingOutputIdentity(file, projectRoot);
  if (!before) return null;
  const contents = await readFile(file);
  const after = await existingOutputIdentity(file, projectRoot);
  invariant(
    after &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${portable(path.relative(projectRoot, file))}: output changed during read`,
  );
  return {...after, bytes: contents.length, sha256: sha256Bytes(contents)};
}

async function assertOutputIdentityUnchanged(file, expected, projectRoot) {
  const observed = await existingOutputIdentity(file, projectRoot);
  invariant(
    expected
      ? observed &&
        observed.dev === expected.dev &&
        observed.ino === expected.ino &&
        observed.size === expected.size &&
        observed.mtimeMs === expected.mtimeMs
      : observed === null,
    `${portable(path.relative(projectRoot, file))}: output changed during preparation`,
  );
}

async function ensureSafeDirectoryPath(projectRoot, directory, {create = false} = {}) {
  invariant(isWithin(projectRoot, directory), `${portable(path.relative(projectRoot, directory))}: directory escapes the project root`);
  const rootMetadata = await lstat(projectRoot);
  invariant(
    rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "project root must be one real directory",
  );
  const realRoot = await realpath(projectRoot);
  let cursor = projectRoot;
  for (const component of path.relative(projectRoot, directory).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let metadata = await lstat(cursor).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata && create) {
      await mkdir(cursor, {mode: 0o755}).catch((error) => {
        if (error?.code !== "EEXIST") throw error;
      });
      metadata = await lstat(cursor);
    }
    invariant(metadata, `${portable(path.relative(projectRoot, cursor))}: output ancestor is unavailable`);
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be a real directory`,
    );
    invariant(
      isWithin(realRoot, await realpath(cursor)),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor resolves outside the project root`,
    );
  }
}

async function prepareTransactionOutput(file, contents, projectRoot, transactionId) {
  const prior = await existingOutputState(file, projectRoot);
  const temporary = `${file}.tmp-${transactionId}`;
  const backup = `${file}.bak-${transactionId}`;
  invariant(
    (await lstat(temporary).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))) === null &&
      (await lstat(backup).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))) === null,
    `${portable(path.relative(projectRoot, file))}: transaction scratch path already exists`,
  );
  try {
    await writeFile(temporary, contents, {encoding: "utf8", flag: "wx", mode: 0o644});
    const tempMetadata = await assertOrdinaryFile(temporary, `${portable(path.relative(projectRoot, file))} temporary output`);
    invariant(tempMetadata.size === Buffer.byteLength(contents), `${portable(path.relative(projectRoot, file))}: temporary output byte count drifted`);
  } catch (error) {
    await unlink(temporary).catch((cleanupError) => {
      if (cleanupError?.code !== "ENOENT") throw cleanupError;
    });
    throw error;
  }
  return {
    file,
    temporary,
    backup,
    prior,
    expected: {
      bytes: Buffer.byteLength(contents),
      sha256: sha256Bytes(Buffer.from(contents)),
    },
  };
}

function transactionDocument({transactionId, outputPrefix, phase, prepared, projectRoot}) {
  return {
    schemaVersion: 1,
    transactionType: "g5-l4-m1-machine-foundation-report-pair",
    transactionId,
    outputPrefix,
    phase,
    entries: prepared.map((item) => ({
      target: portable(path.relative(projectRoot, item.file)),
      temporary: portable(path.relative(projectRoot, item.temporary)),
      backup: portable(path.relative(projectRoot, item.backup)),
      expected: item.expected,
      prior: item.prior ? {bytes: item.prior.bytes, sha256: item.prior.sha256} : null,
    })),
  };
}

async function writeInitialJournal(journal, document, projectRoot) {
  await writeFile(journal, stableJson(document), {encoding: "utf8", flag: "wx", mode: 0o600});
  await assertOrdinaryFile(journal, `${portable(path.relative(projectRoot, journal))} transaction journal`);
}

async function replaceJournal(journal, document, projectRoot) {
  const prior = await existingOutputIdentity(journal, projectRoot);
  invariant(prior, "transaction journal disappeared");
  const next = `${journal}.next-${document.transactionId}`;
  await writeFile(next, stableJson(document), {encoding: "utf8", flag: "wx", mode: 0o600});
  try {
    await assertOrdinaryFile(next, `${portable(path.relative(projectRoot, next))} next transaction journal`);
    await assertOutputIdentityUnchanged(journal, prior, projectRoot);
    await rename(next, journal);
  } catch (error) {
    await unlink(next).catch((cleanupError) => {
      if (cleanupError?.code !== "ENOENT") throw cleanupError;
    });
    throw error;
  }
}

async function unlinkOwned(file, expectedSha256, projectRoot, label) {
  const state = await existingOutputState(file, projectRoot);
  if (!state) return false;
  invariant(state.sha256 === expectedSha256, `${label}: refusing to remove an unowned file`);
  await assertOutputIdentityUnchanged(file, state, projectRoot);
  await unlink(file);
  return true;
}

async function readTransactionJournal(journal, projectRoot) {
  const relativePath = portable(path.relative(projectRoot, journal));
  const record = await readFileRecord(projectRoot, relativePath, "aggregate output transaction journal");
  let document;
  try {
    document = JSON.parse(record.contents.toString("utf8"));
  } catch (error) {
    throw new Error(`aggregate output transaction journal: invalid JSON (${error.message})`);
  }
  return {record, document};
}

function validateTransactionDocument(document, outputPrefix, outputs, projectRoot) {
  invariant(
    document?.schemaVersion === 1 &&
      document.transactionType === "g5-l4-m1-machine-foundation-report-pair" &&
      document.outputPrefix === outputPrefix &&
      ["prepared", "backed-up", "committed"].includes(document.phase) &&
      typeof document.transactionId === "string" &&
      Array.isArray(document.entries) &&
      document.entries.length === 2,
    "aggregate output transaction journal is malformed",
  );
  const expectedTargets = [outputs.json, outputs.markdown].map((file) =>
    portable(path.relative(projectRoot, file)));
  invariant(
    document.entries.every((entry, index) =>
      entry.target === expectedTargets[index] &&
      entry.temporary === `${entry.target}.tmp-${document.transactionId}` &&
      entry.backup === `${entry.target}.bak-${document.transactionId}` &&
      Number.isInteger(entry.expected?.bytes) &&
      entry.expected.bytes > 0 &&
      SHA256.test(entry.expected.sha256) &&
      (entry.prior === null ||
        (Number.isInteger(entry.prior?.bytes) &&
          entry.prior.bytes > 0 &&
          SHA256.test(entry.prior.sha256)))),
    "aggregate output transaction journal entries drifted",
  );
  return document.entries.map((entry) => ({
    ...entry,
    file: resolveProjectPath(projectRoot, entry.target, "transaction target"),
    temporaryFile: resolveProjectPath(projectRoot, entry.temporary, "transaction temporary"),
    backupFile: resolveProjectPath(projectRoot, entry.backup, "transaction backup"),
  }));
}

async function recoverTransaction({journal, outputPrefix, outputs, projectRoot}) {
  const journalMetadata = await lstat(journal).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!journalMetadata) return false;
  invariant(
    journalMetadata.isFile() &&
      !journalMetadata.isSymbolicLink() &&
      journalMetadata.nlink === 1,
    "aggregate output transaction journal must be one ordinary non-linked file",
  );
  const {record, document} = await readTransactionJournal(journal, projectRoot);
  const entries = validateTransactionDocument(document, outputPrefix, outputs, projectRoot);
  if (document.phase === "committed") {
    for (const entry of entries) {
      const target = await existingOutputState(entry.file, projectRoot);
      invariant(
        target &&
          target.bytes === entry.expected.bytes &&
          target.sha256 === entry.expected.sha256,
        `${entry.target}: committed transaction target drifted`,
      );
      await unlinkOwned(
        entry.temporaryFile,
        entry.expected.sha256,
        projectRoot,
        `${entry.temporary} cleanup`,
      );
      if (entry.prior) {
        await unlinkOwned(
          entry.backupFile,
          entry.prior.sha256,
          projectRoot,
          `${entry.backup} cleanup`,
        );
      } else {
        invariant(
          (await existingOutputIdentity(entry.backupFile, projectRoot)) === null,
          `${entry.backup}: unexpected backup exists`,
        );
      }
    }
  } else {
    for (const entry of [...entries].reverse()) {
      const backup = await existingOutputState(entry.backupFile, projectRoot);
      const target = await existingOutputState(entry.file, projectRoot);
      if (backup) {
        invariant(
          entry.prior && backup.sha256 === entry.prior.sha256,
          `${entry.backup}: rollback backup drifted`,
        );
        if (target) {
          invariant(target.sha256 === entry.expected.sha256, `${entry.target}: rollback target drifted`);
          await assertOutputIdentityUnchanged(entry.file, target, projectRoot);
          await unlink(entry.file);
        }
        await rename(entry.backupFile, entry.file);
      } else if (entry.prior) {
        invariant(
          target &&
            target.bytes === entry.prior.bytes &&
            target.sha256 === entry.prior.sha256,
          `${entry.target}: prior output cannot be restored`,
        );
      } else if (target) {
        invariant(target.sha256 === entry.expected.sha256, `${entry.target}: rollback target drifted`);
        await assertOutputIdentityUnchanged(entry.file, target, projectRoot);
        await unlink(entry.file);
      }
      await unlinkOwned(
        entry.temporaryFile,
        entry.expected.sha256,
        projectRoot,
        `${entry.temporary} rollback`,
      );
    }
  }
  const journalState = await existingOutputState(journal, projectRoot);
  invariant(
    journalState &&
      journalState.bytes === record.bytes &&
      journalState.sha256 === record.sha256,
    "aggregate output transaction journal changed during recovery",
  );
  await assertOutputIdentityUnchanged(journal, journalState, projectRoot);
  const nextJournal = `${journal}.next-${document.transactionId}`;
  const nextState = await existingOutputState(nextJournal, projectRoot);
  if (nextState) {
    const nextRecord = await readTransactionJournal(nextJournal, projectRoot);
    invariant(
      nextRecord.document.transactionId === document.transactionId,
      "next transaction journal belongs to another transaction",
    );
    validateTransactionDocument(nextRecord.document, outputPrefix, outputs, projectRoot);
    invariant(
      nextRecord.record.sha256 === nextState.sha256,
      "next transaction journal changed during recovery",
    );
    await assertOutputIdentityUnchanged(nextJournal, nextState, projectRoot);
    await unlink(nextJournal);
  }
  await unlink(journal);
  return true;
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
  transactionHooks = null,
} = {}) {
  validateG5L4M1MachineFoundationReport(report);
  const projectRoot = path.resolve(projectRootOption);
  const outputs = outputPaths(projectRoot, outputPrefix);
  const outputDirectory = path.dirname(outputs.json);
  await ensureSafeDirectoryPath(projectRoot, outputDirectory, {create: !check});
  const journal = `${path.resolve(projectRoot, outputPrefix)}.transaction.json`;
  const expected = {
    json: stableJson(report),
    markdown: renderMarkdown(report),
  };
  if (check) {
    invariant(
      (await lstat(journal).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))) === null,
      "aggregate output transaction is unfinished",
    );
    const [jsonRecord, markdownRecord] = await Promise.all([
      readFileRecord(projectRoot, portable(path.relative(projectRoot, outputs.json)), "aggregate JSON output"),
      readFileRecord(projectRoot, portable(path.relative(projectRoot, outputs.markdown)), "aggregate Markdown output"),
    ]);
    invariant(jsonRecord.contents.toString("utf8") === expected.json, "aggregate JSON output is stale");
    invariant(markdownRecord.contents.toString("utf8") === expected.markdown, "aggregate Markdown output is stale");
    return {action: "verified", outputs: [descriptor(jsonRecord), descriptor(markdownRecord)]};
  }

  await recoverTransaction({journal, outputPrefix, outputs, projectRoot});
  const transactionId = randomUUID();
  const prepared = [];
  let journalWritten = false;
  try {
    prepared.push(await prepareTransactionOutput(outputs.json, expected.json, projectRoot, transactionId));
    prepared.push(await prepareTransactionOutput(outputs.markdown, expected.markdown, projectRoot, transactionId));
    await writeInitialJournal(
      journal,
      transactionDocument({transactionId, outputPrefix, phase: "prepared", prepared, projectRoot}),
      projectRoot,
    );
    journalWritten = true;
    for (const item of prepared) await assertOutputIdentityUnchanged(item.file, item.prior, projectRoot);
    for (const item of prepared) {
      if (item.prior) await rename(item.file, item.backup);
    }
    await replaceJournal(
      journal,
      transactionDocument({transactionId, outputPrefix, phase: "backed-up", prepared, projectRoot}),
      projectRoot,
    );
    for (const [index, item] of prepared.entries()) {
      if (transactionHooks?.beforeInstall) {
        await transactionHooks.beforeInstall({
          index,
          target: portable(path.relative(projectRoot, item.file)),
        });
      }
      await rename(item.temporary, item.file);
    }
    await replaceJournal(
      journal,
      transactionDocument({transactionId, outputPrefix, phase: "committed", prepared, projectRoot}),
      projectRoot,
    );
    await recoverTransaction({journal, outputPrefix, outputs, projectRoot});
  } catch (error) {
    let recoveryError = null;
    try {
      if (journalWritten) await recoverTransaction({journal, outputPrefix, outputs, projectRoot});
      else {
        for (const item of prepared) {
          await unlinkOwned(
            item.temporary,
            item.expected.sha256,
            projectRoot,
            `${portable(path.relative(projectRoot, item.temporary))} cleanup`,
          );
        }
      }
    } catch (caught) {
      recoveryError = caught;
    }
    if (recoveryError) {
      throw new AggregateError(
        [error, recoveryError],
        "aggregate output transaction failed and recovery did not complete",
      );
    }
    throw error;
  }
  const [jsonRecord, markdownRecord] = await Promise.all([
    readFileRecord(projectRoot, portable(path.relative(projectRoot, outputs.json)), "aggregate JSON output"),
    readFileRecord(projectRoot, portable(path.relative(projectRoot, outputs.markdown)), "aggregate Markdown output"),
  ]);
  invariant(jsonRecord.contents.toString("utf8") === expected.json, "aggregate JSON post-write verification failed");
  invariant(markdownRecord.contents.toString("utf8") === expected.markdown, "aggregate Markdown post-write verification failed");
  return {action: "written", outputs: [descriptor(jsonRecord), descriptor(markdownRecord)]};
}

export function parseArguments(argv) {
  const options = {check: false, outputPrefix: DEFAULT_OUTPUT_PREFIX};
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
  outputPaths(defaultProjectRoot, options.outputPrefix);
  return options;
}

function usage() {
  return `Usage: node scripts/build-g5-l4-m1-machine-foundation-readiness.mjs [options]

Options:
  --check                    Verify the checked-in JSON and Markdown without writing
  --output-prefix <path>     Extensionless project-relative prefix below reports/
  --help                     Show this help

The command reads and re-hashes existing G5 L4 M1 machine evidence. It writes
only the aggregate JSON and Markdown reports. It launches no authoring/runtime
tool, changes no migration status, and grants no implementation, review,
fidelity, strict-completion, or publication authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const report = await buildG5L4M1MachineFoundationReadiness();
    const result = await writeOrCheck({report, ...options});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      releaseId: RELEASE_ID,
      machineFoundationReady: report.summary.machineFoundationReady,
      members: report.summary.releaseMemberCount,
      policyApproved: report.summary.policyApproved,
      preparationAuthorized: report.summary.preparationAuthorized,
      technicalMechanismsSelected:
        report.summary.technicalMechanismSelectedCount,
      technicalMechanismsApproved:
        report.summary.containmentControlsApprovedCount,
      technicalMechanismsVerified:
        report.summary.technicalMechanismVerifiedCount,
      workStudyPrepared: report.summary.workStudyPreparedCount,
      workStudyCompleted: report.summary.workStudyCompletedCount,
      originalRuntimeSessions: report.summary.originalRuntimeSessionCount,
      implementationStarted: report.summary.implementationStartedCount,
      strictComplete: report.summary.strictCompleteCount,
      published: report.summary.publishedCount,
      strictAcceptanceEffect: report.strictAcceptanceEffect,
      outputs: result.outputs,
    }, null, 2)}\n`);
  }
}
