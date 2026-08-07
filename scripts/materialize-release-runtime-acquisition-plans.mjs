#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildIndependentFrameDomainDeclaration,
  G4_L10_DECLARATION_REPORT_RELATIVE,
  INDEPENDENT_DOMAIN_SCENARIO_ID,
} from "./materialize-g4-l10-independent-frame-domain-declarations.mjs";
import {
  SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH,
  validateSourceProvenIndependentEvidenceDocument,
} from "./source-proven-independent-frame-domain-evidence.mjs";
import {
  assertWave3AcceptanceNeutralDocument,
  G4_L10_WAVE3_CONTRACT,
  G4_L10_WAVE3_REPORT_RELATIVE,
} from "./materialize-g4-l10-post-declaration-static-composites.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const MATERIALIZER_VERSION = 6;
const RELEASES_RELATIVE = "catalog/lesson-releases.json";
const ASSETS_RELATIVE = "catalog/assets.json";
const G4_L10_RELEASE_ID = "lesson-g04-l10-perimeter-area";
const G4_L10_DECLARATION_REPORT_SHA256 =
  "d961ff2401d01740a6dc04b6084d3849f2cac1f729b43b3fe40565a7a7a15e20";
const G4_L10_WAVE2_REPORT_RELATIVE =
  "reports/lesson-release-source-proven-independent-frame-domains/lesson-g04-l10-perimeter-area.json";
const G4_L10_WAVE2_REPORT_SHA256 =
  "91625576767071511bc6c65f56ee1fd7bbe428304e0604ef58e77944fa034ce2";
const G4_L10_DECLARED_CHILD_COUNT = 213;
const G4_L10_DECLARED_LOCAL_FRAME_COUNT = 21734;
const G4_L10_DECLARED_REQUIREMENT_COUNT = 426;
const G4_L10_DECLARATION_AFFECTED_MEMBER_COUNT = 40;
const G4_L10_DECLARATION_PAIR_SET_SHA256 =
  "32bd3115ff796d2905eb8f83b9860717f9022b43d2295a1bba8ce1d2adbc4c1f";
// Pinned only after the wave3 owner reports a stable successor and its own
// deterministic --check reproduces the same bytes.
const G4_L10_WAVE3_REPORT_SHA256 =
  "1b64902f3806f6939df82c8f62806c1e09101c5f019619e874921be1d7a23ca8";
const G4_L10_WAVE3_MEMBER_IDS = Object.freeze([
  "course-g04-l10-rw-002",
  "course-g04-l10-rw-003",
  "course-g04-l10-rw-005",
]);
const STATIC_COMPOSITE_EVIDENCE_RELATIVE =
  "audit/static-frame-domain-disposition-evidence.json";
const G5_L4_RELEASE_ID = "lesson-g05-l04-number-lines";
const G5_L4_OPERATOR_ASSIGNMENT_RELATIVE =
  "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json";
const G5_L4_FQ001_COMPOSITE_ID = "course-g05-l04-fq-001";
const G5_L4_OPERATOR_STATEMENT =
  "原始运行时／Animate 的具名人工操作员是Dr. Peter Hu";
const G5_L4_OPERATOR_STATEMENT_SHA256 =
  "d367883132acc9e01e75c4e912f7ae33178e97fd69f1bf42da4833c926381b75";
const CONSERVATIVE_BLOCKED_PLANNING_AUTHORITY =
  "source-evidenced-declared-domain-only-runtime-and-acceptance-unresolved";
const DECLARED_DOMAIN_BLOCKING_REASON =
  "Static source evidence declares this full frame domain, but no authoritative original-runtime baseline has been adopted; natural runtime reachability and schedules are not inferred.";
const COVERAGE_REQUIREMENT_KEYS = new Set([
  "requirementId",
  "scenario",
  "frameDomainId",
  "traceId",
  "language",
  "seed",
  "requiredRange",
  "entryState",
  "entryStateSha256",
  "baselineAuthorityRequirement",
  "baselineAuthority",
  "status",
  "blockingReason",
  "blockingEvidence",
  "capturedFrameCount",
  "missingFrames",
  "baselineCaptureManifest",
  "baselineCaptureManifestSha256",
  "captureManifest",
  "captureManifestSha256",
  "metricsFile",
  "metricsSha256",
  "strictAcceptanceEffect",
  "planningAuthority",
]);
const PROMOTION_AUTHORITY_PATTERN =
  /(?:^|[^a-z])(ready|complete|pass|adopted|accepted|approved)(?:$|[^a-z])/i;

export const WORKSPACE_ARTIFACT_RELATIVE =
  "audit/machine/release-runtime-acquisition-plan.json";
const SOURCE_PROVEN_DISPOSITION_RELATIVE =
  "audit/frame-domain-disposition.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label}: must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(wanted), `${label}: keys drifted`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function equalStable(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

export function validateG4L10DeclarationReceipt({
  receipt,
  receiptBinding,
  releaseBinding,
}) {
  invariant(
    receiptBinding?.sha256 === G4_L10_DECLARATION_REPORT_SHA256 &&
      receiptBinding.path === G4_L10_DECLARATION_REPORT_RELATIVE,
    `${G4_L10_RELEASE_ID}: independent-domain declaration receipt identity drifted`,
  );
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.reportType ===
        "g4-l10-source-proven-independent-frame-domain-declarations" &&
      receipt.releaseId === G4_L10_RELEASE_ID &&
      String(receipt.strictAcceptanceEffect || "").startsWith("none;") &&
      Array.isArray(receipt.members),
    `${G4_L10_RELEASE_ID}: independent-domain declaration receipt schema drifted`,
  );
  invariant(
    receipt.generatedFrom?.lessonReleaseCatalog?.path ===
        releaseBinding.path &&
      receipt.generatedFrom.lessonReleaseCatalog.bytes ===
        releaseBinding.bytes &&
      receipt.generatedFrom.lessonReleaseCatalog.sha256 ===
        releaseBinding.sha256 &&
      receipt.generatedFrom.releaseFingerprintSha256 ===
        releaseBinding.releaseFingerprintSha256 &&
      receipt.generatedFrom?.wave2IndependentRequirementContract?.path ===
        G4_L10_WAVE2_REPORT_RELATIVE &&
      receipt.generatedFrom.wave2IndependentRequirementContract.sha256 ===
        G4_L10_WAVE2_REPORT_SHA256,
    `${G4_L10_RELEASE_ID}: independent-domain declaration source lineage drifted`,
  );
  invariant(
    receipt.exactPairSet?.count === G4_L10_DECLARED_CHILD_COUNT &&
      receipt.exactPairSet.sha256 ===
        G4_L10_DECLARATION_PAIR_SET_SHA256 &&
      receipt.summary?.releaseMembers === 47 &&
      receipt.summary.affectedMembers ===
        G4_L10_DECLARATION_AFFECTED_MEMBER_COUNT &&
      receipt.summary.childFrameDomainsDeclared ===
        G4_L10_DECLARED_CHILD_COUNT &&
      receipt.summary.declaredLocalFrames ===
        G4_L10_DECLARED_LOCAL_FRAME_COUNT &&
      receipt.summary.newlyEnumeratedEnEsCoverageRequirements ===
        G4_L10_DECLARED_REQUIREMENT_COUNT &&
      receipt.summary.authoritativeRuntimeSessionsExecuted === 0 &&
      receipt.summary.implementationFramesCaptured === 0 &&
      receipt.summary.originalRuntimeFramesCaptured === 0 &&
      receipt.summary.rmseComparisonsCompleted === 0 &&
      receipt.summary.strictCompletions === 0 &&
      receipt.summary.publishedMembers === 0,
    `${G4_L10_RELEASE_ID}: independent-domain declaration census drifted`,
  );
  invariant(
    receipt.acceptanceBoundary &&
      Object.keys(receipt.acceptanceBoundary).length > 0 &&
      Object.values(receipt.acceptanceBoundary).every((value) => value === false),
    `${G4_L10_RELEASE_ID}: independent-domain declaration crossed an acceptance boundary`,
  );
  const memberById = new Map();
  let domainCount = 0;
  let localFrameCount = 0;
  for (const declarationMember of receipt.members) {
    const id = declarationMember?.animationId;
    invariant(
      typeof id === "string" && !memberById.has(id) &&
        declarationMember.declaration?.scenarioId ===
          INDEPENDENT_DOMAIN_SCENARIO_ID &&
        Array.isArray(declarationMember.declaration.domains) &&
        declarationMember.declaration.domains.length > 0 &&
        declarationMember.declaration.frameDomainCount ===
          declarationMember.declaration.domains.length,
      `${G4_L10_RELEASE_ID}: declaration member identity/domain list drifted`,
    );
    const ids = new Set();
    let memberFrames = 0;
    for (const domain of declarationMember.declaration.domains) {
      invariant(
        /^sprite-\d+$/.test(domain?.id || "") &&
          !ids.has(domain.id) &&
          domain.kind === "nested" &&
          domain.sourceTimelineId === domain.id &&
          domain.parentFrameDomainId === "root" &&
          Number.isInteger(domain.frameCount) &&
          domain.frameCount > 1 &&
          equalStable(domain.scenarioIds, [INDEPENDENT_DOMAIN_SCENARIO_ID]) &&
          domain.sourceProof?.authoritativeRuntimeEntryEstablished === false &&
          domain.sourceProof?.strictAcceptanceEffect === "none",
        `${id}: declaration receipt domain shape drifted`,
      );
      ids.add(domain.id);
      memberFrames += domain.frameCount;
    }
    invariant(
      declarationMember.declaration.localFrameCount === memberFrames,
      `${id}: declaration receipt local-frame census drifted`,
    );
    domainCount += ids.size;
    localFrameCount += memberFrames;
    memberById.set(id, declarationMember);
  }
  invariant(
    memberById.size === G4_L10_DECLARATION_AFFECTED_MEMBER_COUNT &&
      domainCount === G4_L10_DECLARED_CHILD_COUNT &&
      localFrameCount === G4_L10_DECLARED_LOCAL_FRAME_COUNT,
    `${G4_L10_RELEASE_ID}: declaration receipt member/domain totals drifted`,
  );
  return {memberById, domainCount, localFrameCount};
}

function exactDescriptor(actual, expected) {
  return actual?.path === expected?.path &&
    actual?.bytes === expected?.bytes &&
    actual?.sha256 === expected?.sha256;
}

export function validateG4L10Wave3Receipt({
  receipt,
  receiptBinding,
  declarationReceiptBinding,
  declarationReceipt,
  releaseBinding,
  release,
}) {
  invariant(
    receiptBinding?.path === G4_L10_WAVE3_REPORT_RELATIVE &&
      receiptBinding.sha256 === G4_L10_WAVE3_REPORT_SHA256,
    `${G4_L10_RELEASE_ID}: wave3 receipt identity drifted`,
  );
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.reportType ===
        "g4-l10-post-declaration-static-composite-wave3" &&
      receipt.releaseId === G4_L10_RELEASE_ID &&
      String(receipt.strictAcceptanceEffect || "").startsWith("none;") &&
      Array.isArray(receipt.members) &&
      Array.isArray(receipt.unchangedDispositionBindings),
    `${G4_L10_RELEASE_ID}: wave3 receipt schema drifted`,
  );
  invariant(
    exactDescriptor(
      receipt.generatedFrom?.immutableDeclarationReceipt,
      declarationReceiptBinding,
    ) &&
      receipt.generatedFrom?.immutableWave2UnresolvedContract?.path ===
        G4_L10_WAVE2_REPORT_RELATIVE &&
      receipt.generatedFrom.immutableWave2UnresolvedContract.sha256 ===
        G4_L10_WAVE2_REPORT_SHA256 &&
      receipt.generatedFrom?.lessonReleaseCatalog?.path ===
        releaseBinding.path &&
      receipt.generatedFrom.lessonReleaseCatalog.bytes ===
        releaseBinding.bytes &&
      receipt.generatedFrom.lessonReleaseCatalog.sha256 ===
        releaseBinding.sha256 &&
      receipt.generatedFrom.releaseFingerprintSha256 ===
        releaseBinding.releaseFingerprintSha256,
    `${G4_L10_RELEASE_ID}: wave3 declaration/release lineage drifted`,
  );
  const expected = G4_L10_WAVE3_CONTRACT.expected;
  invariant(
    receipt.summary?.releaseMembers === expected.releaseMembers &&
      receipt.summary.affectedMembers === G4_L10_WAVE3_MEMBER_IDS.length &&
      receipt.summary.newCompositeClaims === G4_L10_WAVE3_MEMBER_IDS.length &&
      equalStable(receipt.summary.beforeDispositionTotals, expected.before) &&
      equalStable(receipt.summary.afterDispositionTotals, expected.after) &&
      receipt.summary.remainingUnresolved === expected.remaining.count &&
      receipt.summary.authoritativeRuntimeSessionsExecuted === 0 &&
      receipt.summary.implementationFramesCaptured === 0 &&
      receipt.summary.originalRuntimeFramesCaptured === 0 &&
      receipt.summary.rmseComparisonsCompleted === 0 &&
      receipt.summary.humanReviewsCompleted === 0 &&
      receipt.summary.ownerReviewsCompleted === 0 &&
      receipt.summary.strictCompletions === 0 &&
      receipt.summary.publishedMembers === 0,
    `${G4_L10_RELEASE_ID}: wave3 census or acceptance-neutral summary drifted`,
  );
  for (const [name, contract] of [
    ["oldParentUndeclared", expected.oldParentUndeclared],
    ["accepted", expected.accepted],
    ["rejected", expected.rejected],
    ["scriptedOneFrame", expected.scriptedOneFrame],
    ["directRootLong", expected.directRootLong],
    ["remainingUnresolved", expected.remaining],
  ]) {
    invariant(
      receipt.exactPairSets?.[name]?.count === contract.count &&
        receipt.exactPairSets[name].sha256 === contract.sha256,
      `${G4_L10_RELEASE_ID}: wave3 ${name} pair set drifted`,
    );
  }
  invariant(
    receipt.acceptanceBoundary &&
      Object.keys(receipt.acceptanceBoundary).length > 0 &&
      Object.values(receipt.acceptanceBoundary).every((value) => value === false),
    `${G4_L10_RELEASE_ID}: wave3 crossed an acceptance boundary`,
  );
  const releaseById = new Map(
    release.members.map((member) => [member.animationId, member]),
  );
  const memberById = new Map();
  const expectedDispositionById = new Map();
  for (const wave3Member of receipt.members) {
    const id = wave3Member?.animationId;
    const releaseMember = releaseById.get(id);
    const declarationMember = declarationReceipt.memberById.get(id);
    invariant(
      G4_L10_WAVE3_MEMBER_IDS.includes(id) &&
        !memberById.has(id) && releaseMember && declarationMember &&
        wave3Member.ordinal === releaseMember.ordinal &&
        wave3Member.assetId === releaseMember.assetId &&
        wave3Member.source?.path === releaseMember.source.path.replace(
          /^/,
          "source-assets/flash/HELP MATH_ORIGINAL FILES/",
        ) &&
        wave3Member.source.sha256 === releaseMember.source.sha256 &&
        exactDescriptor(
          wave3Member.predecessor?.frameDomainDisposition,
          declarationMember.successor.frameDomainDisposition,
        ) &&
        exactDescriptor(
          wave3Member.predecessor?.staticCompositeEvidence,
          declarationMember.successor.staticCompositeEvidence,
        ) &&
        wave3Member.successor?.frameDomainDisposition?.path ===
          `migrations/${id}/${SOURCE_PROVEN_DISPOSITION_RELATIVE}` &&
        wave3Member.successor?.staticCompositeEvidence?.path ===
          `migrations/${id}/${STATIC_COMPOSITE_EVIDENCE_RELATIVE}` &&
        wave3Member.compositeClaim?.disposition ===
          "composite-child-with-parent" &&
        wave3Member.compositeClaim.role ===
          "multi-frame-scriptless-parent-clock-composite-child" &&
        wave3Member.compositeClaim.claimScope ===
          "local-playhead-fully-derived-from-declared-parent-clock" &&
        wave3Member.compositeClaim.parentBinding?.parentFrameDomainId ===
          wave3Member.parentDeclaration?.id &&
        wave3Member.compositeClaim.frameCount > 1,
      `${id || G4_L10_RELEASE_ID}: wave3 member/predecessor transition drifted`,
    );
    memberById.set(id, wave3Member);
    expectedDispositionById.set(
      id,
      wave3Member.successor.frameDomainDisposition,
    );
  }
  invariant(
    equalStable([...memberById.keys()].sort(), [...G4_L10_WAVE3_MEMBER_IDS].sort()) &&
      receipt.unchangedDispositionBindings.length ===
        release.members.length - G4_L10_WAVE3_MEMBER_IDS.length,
    `${G4_L10_RELEASE_ID}: wave3 affected/unchanged member partition drifted`,
  );
  for (const descriptor of receipt.unchangedDispositionBindings) {
    const match = /^migrations\/([^/]+)\/audit\/frame-domain-disposition\.json$/.exec(
      descriptor?.path || "",
    );
    const id = match?.[1];
    invariant(
      id && releaseById.has(id) && !memberById.has(id) &&
        !expectedDispositionById.has(id),
      `${G4_L10_RELEASE_ID}: wave3 unchanged disposition partition is unsafe or duplicated`,
    );
    expectedDispositionById.set(id, descriptor);
  }
  invariant(
    expectedDispositionById.size === release.members.length,
    `${G4_L10_RELEASE_ID}: wave3 does not bind every release disposition`,
  );
  return {memberById, expectedDispositionById};
}

function projectRelative(filePath, root) {
  const relative = portable(path.relative(root, filePath));
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative),
    `${filePath}: escapes project root`);
  return relative;
}

function validateSafeId(value, label) {
  invariant(typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value),
    `${label} must contain only lowercase letters, digits, and hyphens`);
  return value;
}

async function readRegularFile(filePath, label) {
  const information = await lstat(filePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
    `${label}: must be one regular, non-linked file`);
  return readFile(filePath);
}

async function readJsonFile(filePath, label) {
  const bytes = await readRegularFile(filePath, label);
  try {
    return {bytes, value: JSON.parse(bytes.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

async function readOptionalJsonFile(filePath, label) {
  const information = await lstat(filePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!information) return null;
  return readJsonFile(filePath, label);
}

function validateOperatorAssignmentReceipt(receipt, releaseId) {
  invariant(releaseId === G5_L4_RELEASE_ID,
    `${releaseId}: the supplied operator-assignment receipt is scoped only to ${G5_L4_RELEASE_ID}`);
  assertExactKeys(receipt, [
    "schemaVersion",
    "evidenceType",
    "releaseId",
    "receivedOn",
    "recordedAt",
    "channel",
    "taskThreadId",
    "statementLanguage",
    "ownerStatement",
    "assigningAuthority",
    "assignment",
    "capacity",
    "sourceBindingsAtIntake",
    "externalSignatureEnvelope",
    "authorityBoundary",
  ], `${releaseId}: operator-assignment receipt`);
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.evidenceType === "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake" &&
      receipt.releaseId === releaseId &&
      receipt.channel === "current-codex-task" &&
      receipt.statementLanguage === "zh-CN",
    `${releaseId}: operator-assignment receipt identity drifted`,
  );
  invariant(
    /^\d{4}-\d{2}-\d{2}$/.test(receipt.receivedOn || "") &&
      typeof receipt.recordedAt === "string" &&
      receipt.recordedAt.startsWith(`${receipt.receivedOn}T`) &&
      Number.isFinite(Date.parse(receipt.recordedAt)),
    `${releaseId}: operator-assignment receipt time is invalid`,
  );
  assertExactKeys(
    receipt.ownerStatement,
    ["exactUtf8", "byteLength", "sha256"],
    `${releaseId}: operator statement`,
  );
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8 || "", "utf8");
  invariant(
    receipt.ownerStatement.exactUtf8 === G5_L4_OPERATOR_STATEMENT &&
      receipt.ownerStatement.byteLength === statementBytes.length &&
      receipt.ownerStatement.sha256 === G5_L4_OPERATOR_STATEMENT_SHA256 &&
      sha256(statementBytes) === receipt.ownerStatement.sha256,
    `${releaseId}: exact operator statement drifted`,
  );
  assertExactKeys(
    receipt.assigningAuthority,
    ["ownerFullName", "ownerRole", "externalSubjectId"],
    `${releaseId}: assigning authority`,
  );
  invariant(
    receipt.assigningAuthority.ownerFullName === "Dr. Peter Hu" &&
      receipt.assigningAuthority.ownerRole === "Owner" &&
      receipt.assigningAuthority.externalSubjectId === null,
    `${releaseId}: assigning authority drifted`,
  );
  assertExactKeys(
    receipt.assignment,
    ["roleId", "slot", "assigneeFullName", "samePersonAsOwner", "explicit", "duties"],
    `${releaseId}: operator assignment`,
  );
  invariant(
    receipt.assignment.roleId === "authorized-original-runtime-operator" &&
      receipt.assignment.slot === "primary" &&
      receipt.assignment.assigneeFullName === "Dr. Peter Hu" &&
      receipt.assignment.samePersonAsOwner === true &&
      receipt.assignment.explicit === true &&
      JSON.stringify(receipt.assignment.duties) === JSON.stringify([
        "authorized-original-runtime-human-operator",
        "adobe-animate-human-dialog-operator",
      ]),
    `${releaseId}: operator assignment scope drifted`,
  );
  assertExactKeys(
    receipt.capacity,
    ["minimumRequiredHoursPerWeek", "committedHoursPerWeek", "status"],
    `${releaseId}: operator capacity`,
  );
  invariant(
    receipt.capacity.minimumRequiredHoursPerWeek === 20 &&
      receipt.capacity.committedHoursPerWeek === null &&
      receipt.capacity.status === "not-stated",
    `${releaseId}: operator capacity was invented or drifted`,
  );
  invariant(receipt.externalSignatureEnvelope === null,
    `${releaseId}: this intake may not claim an external signature envelope`);
  assertExactKeys(receipt.authorityBoundary, [
    "assignmentUserAttested",
    "assigneeIdentityCryptographicallyVerified",
    "namedHumanRoleAssignmentEstablished",
    "namedRoleSlotCountEffect",
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
    "strictAcceptanceEffect",
  ], `${releaseId}: operator authority boundary`);
  invariant(
    receipt.authorityBoundary.assignmentUserAttested === true &&
      receipt.authorityBoundary.namedHumanRoleAssignmentEstablished === true &&
      receipt.authorityBoundary.namedRoleSlotCountEffect === 1 &&
      receipt.authorityBoundary.strictAcceptanceEffect === "named-primary-operator-role-only",
    `${releaseId}: named-role effect drifted`,
  );
  for (const key of [
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
  ]) invariant(receipt.authorityBoundary[key] === false,
    `${releaseId}: operator receipt improperly opens ${key}`);
  return {
    roleId: receipt.assignment.roleId,
    slot: receipt.assignment.slot,
    assigneeFullName: receipt.assignment.assigneeFullName,
    duties: [...receipt.assignment.duties],
    identityBasis: "user-attested-current-codex-task",
    cryptographicallyVerified: false,
    requiredHoursPerWeek: receipt.capacity.minimumRequiredHoursPerWeek,
    committedHoursPerWeek: null,
    weeklyCapacityEstablished: false,
    backupAssignmentEstablished: false,
    runtimeHostApproved: false,
    containmentApproved: false,
    immutableSessionAuthorizationEstablished: false,
    originalRuntimeExecutionAuthorized: false,
    animateGuiExecutionAuthorized: false,
    actualSessionOperatorAttestationPresent: false,
    strictAcceptanceEffect: "named-primary-operator-role-only",
  };
}

async function validateRealDirectory(filePath, expectedParentReal, label) {
  const information = await lstat(filePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `${label}: must be a real directory`);
  const resolved = await realpath(filePath);
  invariant(resolved !== expectedParentReal && resolved.startsWith(`${expectedParentReal}${path.sep}`),
    `${label}: resolves outside expected parent`);
  return resolved;
}

async function validateOutputTarget(filePath, expectedParentReal, label) {
  const parent = path.dirname(filePath);
  const parentInfo = await lstat(parent).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (parentInfo) {
    invariant(parentInfo.isDirectory() && !parentInfo.isSymbolicLink(),
      `${label}: output parent must be a real directory`);
    const parentResolved = await realpath(parent);
    invariant(parentResolved === expectedParentReal || parentResolved.startsWith(`${expectedParentReal}${path.sep}`),
      `${label}: output parent escapes expected root`);
  }
  const targetInfo = await lstat(filePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (targetInfo) {
    invariant(targetInfo.isFile() && !targetInfo.isSymbolicLink() && targetInfo.nlink === 1,
      `${label}: existing output must be one regular, non-linked file`);
  }
}

async function verifyPhysicalSource({root, sourceRootReal, descriptor, label}) {
  invariant(descriptor && typeof descriptor.path === "string" && descriptor.path.startsWith("source-assets/"),
    `${label}: source path is not a project source-assets path`);
  invariant(/^[a-f0-9]{64}$/.test(descriptor.sha256), `${label}: source SHA-256 is invalid`);
  const absolute = path.join(root, ...descriptor.path.split("/"));
  const information = await lstat(absolute).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
    `${label}: must be one regular, non-linked source file`);
  const resolved = await realpath(absolute);
  invariant(resolved.startsWith(`${sourceRootReal}${path.sep}`), `${label}: resolves outside source-assets`);
  const bytes = await readFile(absolute);
  invariant(sha256(bytes) === descriptor.sha256, `${label}: SHA-256 drifted`);
  if (descriptor.bytes !== null && descriptor.bytes !== undefined) {
    invariant(bytes.length === descriptor.bytes, `${label}: byte count drifted`);
  }
  return {path: descriptor.path, bytes: bytes.length, sha256: descriptor.sha256};
}

function selectRelease(releasesCatalog, releaseId, shardId) {
  invariant(releasesCatalog?.schemaVersion === 1 && Array.isArray(releasesCatalog.releases),
    "Lesson release catalog schema drifted");
  const matches = releasesCatalog.releases.filter((entry) => entry.releaseId === releaseId);
  invariant(matches.length === 1, `${releaseId}: expected exactly one lesson release, found ${matches.length}`);
  const release = matches[0];
  invariant(release.releaseType === "complete-lesson" && release.publicationMode === "atomic",
    `${releaseId}: runtime planning requires one atomic complete-lesson release`);
  invariant(Array.isArray(release.members) && release.members.length === release.expectedCounts?.members,
    `${releaseId}: member count drifted`);
  invariant(release.members.filter((member) => member.releaseRole === "course-shell").length === 1,
    `${releaseId}: expected exactly one lesson shell`);
  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member.ordinal === index + 1, `${releaseId}: ordinals are not contiguous at ${index + 1}`);
    invariant(!animationIds.has(member.animationId), `${releaseId}: duplicate animationId ${member.animationId}`);
    invariant(!assetIds.has(member.assetId), `${releaseId}: duplicate assetId ${member.assetId}`);
    animationIds.add(member.animationId);
    assetIds.add(member.assetId);
  }
  if (!shardId) return {release, selectedMembers: release.members, selectedShard: null};
  const shardMatches = (release.shards || []).filter((entry) => entry.shardId === shardId);
  invariant(shardMatches.length === 1, `${releaseId}: expected exactly one shard ${shardId}`);
  const selectedMembers = release.members.filter((member) => member.shardId === shardId);
  invariant(selectedMembers.length === shardMatches[0].memberCount,
    `${releaseId}/${shardId}: shard member count drifted`);
  return {release, selectedMembers, selectedShard: shardMatches[0]};
}

function validateCatalogAsset({asset, member, manifest}) {
  invariant(asset, `${member.animationId}: catalog asset is missing`);
  invariant(asset.assetId === member.assetId && asset.sha256 === member.source.sha256,
    `${member.animationId}: catalog/release asset identity mismatch`);
  invariant(Array.isArray(asset.sourcePaths) && asset.sourcePaths.includes(member.source.path),
    `${member.animationId}: release source path is absent from catalog asset`);
  invariant(Array.isArray(asset.animationIds) && asset.animationIds.includes(member.animationId),
    `${member.animationId}: animationId is absent from catalog asset`);
  invariant(asset.swf?.stage?.width === manifest.runtime?.stage?.width
    && asset.swf?.stage?.height === manifest.runtime?.stage?.height
    && asset.swf?.fps === manifest.runtime?.fps
    && asset.swf?.frameCount === manifest.runtime?.frameCount,
  `${member.animationId}: catalog/migration root runtime identity mismatch`);
}

function validateMigrationIdentity({manifest, member}) {
  invariant(manifest?.schemaVersion === 2, `${member.animationId}: migration schema drifted`);
  invariant(manifest.animationId === member.animationId && manifest.id === member.animationId,
    `${member.animationId}: migration animation identity mismatch`);
  invariant(manifest.assetId === member.assetId, `${member.animationId}: migration assetId mismatch`);
  invariant(manifest.source?.swfSha256 === member.source.sha256,
    `${member.animationId}: migration/release SWF hash mismatch`);
  invariant(manifest.source?.swf?.endsWith(`/${member.source.path}`),
    `${member.animationId}: migration/release SWF path mismatch`);
  invariant(manifest.runtime?.stage?.width > 0 && manifest.runtime?.stage?.height > 0
    && manifest.runtime?.fps > 0 && Number.isInteger(manifest.runtime?.frameCount)
    && manifest.runtime.frameCount > 0,
  `${member.animationId}: migration root runtime facts are incomplete`);
  const frameDomains = manifest.implementation?.frameDomains;
  invariant(Array.isArray(frameDomains)
    && frameDomains.some((domain) => domain.id === "root"
      && domain.kind === "root" && domain.frameCount === manifest.runtime.frameCount),
  `${member.animationId}: migration root frame domain is missing or inconsistent`);
  const defaultFrameDomainId =
    manifest.implementation?.defaultFrameDomainId;
  const defaultFrameDomain = frameDomains.find(
    ({id}) => id === defaultFrameDomainId,
  );
  invariant(
    defaultFrameDomain,
    `${member.animationId}: default frame domain is not declared`,
  );
  if (defaultFrameDomainId !== "root") {
    const candidate = manifest.implementation?.candidateState;
    invariant(
      defaultFrameDomain.kind === "nested" &&
        validateSourceStaticCandidateBoundary({
          candidate,
          frameDomain: defaultFrameDomain,
        }),
      `${member.animationId}: non-root default frame domain is not a bounded source-static engineering candidate`,
    );
  }
  currentJavascriptCandidatePlanning(manifest);
}

export function validateSourceStaticCandidateBoundary({
  candidate,
  frameDomain,
}) {
  if (
    frameDomain?.kind !== "nested" ||
    !Number.isSafeInteger(frameDomain.frameCount) ||
    frameDomain.frameCount <= 0 ||
    candidate?.status !== "current-javascript-engineering-candidate-only" ||
    candidate.sourceStaticFrameDomain !== frameDomain.id ||
    !Number.isSafeInteger(candidate.renderedFrameCount) ||
    candidate.renderedFrameCount <= 0 ||
    candidate.renderedFrameCount > frameDomain.frameCount ||
    candidate.rootEnabled !== false ||
    candidate.spanishEnabled !== false ||
    candidate.audioEnabled !== false ||
    candidate.sourceControlsEnabled !== false ||
    candidate.replayParityEstablished !== false ||
    candidate.originalRuntimeBaselineUsed !== false ||
    candidate.rmseComputed !== false ||
    candidate.humanVisualReviewPerformed !== false ||
    candidate.ownerReviewPerformed !== false ||
    candidate.strictAcceptanceEffect !== "none"
  ) {
    return false;
  }

  if (candidate.renderedFrameCount === frameDomain.frameCount) {
    return candidate.sourceStaticRenderableFrames === undefined &&
      candidate.blockedLocalFrameRanges === undefined;
  }

  const renderable = candidate.sourceStaticRenderableFrames;
  const blocked = candidate.blockedLocalFrameRanges;
  return renderable?.firstFrame === 1 &&
    renderable.lastFrame === candidate.renderedFrameCount &&
    renderable.frameCount === candidate.renderedFrameCount &&
    Array.isArray(blocked) &&
    blocked.length === 1 &&
    blocked[0]?.firstFrame === candidate.renderedFrameCount + 1 &&
    blocked[0]?.lastFrame === frameDomain.frameCount;
}

export function currentJavascriptCandidatePlanning(manifest) {
  const candidate = manifest.implementation?.candidateState;
  if (candidate) {
    const frameDomain = manifest.implementation.frameDomains.find(
      ({id}) => id === candidate.sourceStaticFrameDomain,
    );
    invariant(
      validateSourceStaticCandidateBoundary({candidate, frameDomain}),
      `${manifest.animationId}: manifest-bound source-static candidate drifted`,
    );
    const blockedTailFrameCount =
      frameDomain.frameCount - candidate.renderedFrameCount;
    return {
      status: candidate.status,
      candidateKind:
        blockedTailFrameCount === 0
          ? "single-sprite-full"
          : "single-sprite-safe-prefix",
      bindingAuthority: "manifest-bound-single-sprite-candidate",
      route: manifest.implementation.route,
      frameDomainId: frameDomain.id,
      canonicalFrameCount: frameDomain.frameCount,
      openFrameCount: candidate.renderedFrameCount,
      blockedTailFrameCount,
      companionFrameDomainId: null,
      companionFrameCount: 0,
      canonicalFrameDomainDisposition:
        "declared-conservative-nested-domain",
      canonicalNestedCoverageDeclared: true,
      implementationAuthorized: false,
      strictAcceptanceEffect: "none",
    };
  }
  const maturity = manifest.implementation?.candidateMaturity;
  if (!maturity) return null;
  invariant(
    manifest.animationId === G5_L4_FQ001_COMPOSITE_ID &&
      maturity.status ===
        "current-javascript-engineering-candidate-only" &&
      maturity.candidateKind === "dual-sprite-composite-prefix" &&
      maturity.bindingAuthority ===
        "independent-fq001-composite-evidence-only" &&
      maturity.report ===
        "evidence/dual-sprite-composite-current-js-candidate.json" &&
      maturity.specification ===
        "audit/dual-sprite-composite-current-js-candidate-spec.json" &&
      maturity.route === `/animations/${G5_L4_FQ001_COMPOSITE_ID}` &&
      maturity.publicComposite?.frameDomain === "sprite-145" &&
      maturity.publicComposite.firstFrame === 1 &&
      maturity.publicComposite.lastFrame === 52 &&
      maturity.publicComposite.openFrameCount === 52 &&
      maturity.publicComposite.fixedCompanionFrameDomain === "sprite-100" &&
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
      maturity.strictAcceptanceEffect === "none" &&
      manifest.implementation.rendering === "undecided" &&
      manifest.implementation.route === "" &&
      manifest.implementation.defaultFrameDomainId === "root" &&
      manifest.implementation.frameDomains.length === 1 &&
      manifest.implementation.frameDomains[0]?.id === "root",
    `${manifest.animationId}: independent dual-sprite composite candidate drifted or altered canonical domains`,
  );
  return {
    status: maturity.status,
    candidateKind: maturity.candidateKind,
    bindingAuthority: maturity.bindingAuthority,
    route: maturity.route,
    frameDomainId: maturity.publicComposite.frameDomain,
    canonicalFrameCount: null,
    openFrameCount: maturity.publicComposite.openFrameCount,
    blockedTailFrameCount: 0,
    companionFrameDomainId:
      maturity.publicComposite.fixedCompanionFrameDomain,
    companionFrameCount: 1,
    canonicalFrameDomainDisposition: "unresolved",
    canonicalNestedCoverageDeclared: false,
    implementationAuthorized: false,
    strictAcceptanceEffect: "none",
  };
}

async function findSourceScopeBinding({workspace, releaseId, member}) {
  const machineDirectory = path.join(workspace, "audit", "machine");
  const names = await readdir(machineDirectory);
  const candidates = [];
  for (const name of names.filter((entry) => entry.endsWith("-source-scope-binding.json")).sort()) {
    const filePath = path.join(machineDirectory, name);
    const file = await readJsonFile(filePath, `${member.animationId} ${name}`);
    if (file.value?.releaseId === releaseId && file.value?.member?.animationId === member.animationId) {
      candidates.push({filePath, ...file});
    }
  }
  invariant(candidates.length <= 1,
    `${member.animationId}: multiple matching source-scope bindings found`);
  return candidates[0] || null;
}

function validateSourceScopeBinding({binding, member, manifest, releaseId}) {
  invariant(binding.schemaVersion === 1
    && typeof binding.artifactType === "string"
    && binding.artifactType.endsWith("-source-scope-binding"),
  `${member.animationId}: source-scope binding schema drifted`);
  invariant(binding.releaseId === releaseId, `${member.animationId}: source-scope releaseId mismatch`);
  invariant(binding.member?.ordinal === member.ordinal
    && binding.member?.animationId === member.animationId
    && binding.member?.assetId === member.assetId
    && binding.member?.shardId === member.shardId,
  `${member.animationId}: source-scope member identity mismatch`);
  invariant(binding.member?.source?.swf?.path === member.source.path
    && binding.member?.source?.swf?.sha256 === member.source.sha256,
  `${member.animationId}: source-scope SWF identity mismatch`);
  invariant(binding.member?.source?.swfMetadata?.stage?.width === manifest.runtime.stage.width
    && binding.member?.source?.swfMetadata?.stage?.height === manifest.runtime.stage.height
    && binding.member?.source?.swfMetadata?.fps === manifest.runtime.fps
    && binding.member?.source?.swfMetadata?.rootFrameCount === manifest.runtime.frameCount,
  `${member.animationId}: source-scope root runtime facts mismatch`);
  const expectedSourceModel = manifest.source.fla
    ? "paired-fla-and-shipped-swf"
    : "shipped-swf-only";
  invariant(binding.member?.source?.sourceModel === expectedSourceModel,
    `${member.animationId}: source-scope source model mismatch`);
  if (manifest.source.fla) {
    invariant(binding.member.source.fla?.sha256 === manifest.source.flaSha256
      && manifest.source.fla.endsWith(`/${binding.member.source.fla.path}`),
    `${member.animationId}: source-scope FLA identity mismatch`);
  } else {
    invariant(binding.member.source.fla === null, `${member.animationId}: unexpected source-scope FLA`);
  }
}

function validateFrameDomainCandidates({domains, member, manifest}) {
  invariant(domains?.schemaVersion === 1 && domains.artifactType === "swf-frame-domain-candidates",
    `${member.animationId}: frame-domain candidate schema drifted`);
  invariant(domains.animationId === member.animationId
    && domains.source?.path === manifest.source.swf
    && domains.source?.sha256 === manifest.source.swfSha256,
  `${member.animationId}: frame-domain source identity mismatch`);
  invariant(domains.root?.timelineId === "root" && domains.root?.kind === "root"
    && domains.root?.frameCount === manifest.runtime.frameCount
    && domains.root?.rootReachability === "root-by-definition"
    && domains.root?.acceptanceDisposition === "declared-root-structural-domain",
  `${member.animationId}: structural root domain drifted`);
  invariant(Array.isArray(domains.nestedDefinitions), `${member.animationId}: nested definitions missing`);
  const timelineIds = new Set();
  for (const nested of domains.nestedDefinitions) {
    invariant(typeof nested.timelineId === "string" && !timelineIds.has(nested.timelineId),
      `${member.animationId}: duplicate or invalid nested timelineId`);
    timelineIds.add(nested.timelineId);
    invariant(nested.kind === "nested-definition-candidate" && Number.isInteger(nested.frameCount)
      && nested.frameCount > 0 && nested.rootReachability === "unresolved"
      && nested.placementEntryState === "unresolved"
      && nested.acceptanceDisposition === "structural-candidate-only",
    `${member.animationId}/${nested.timelineId}: nested candidate was resolved or promoted`);
  }
  const longer = domains.nestedDefinitions.filter((nested) => nested.frameCount > domains.root.frameCount).length;
  invariant(domains.summary?.rootDomainCount === 1
    && domains.summary?.nestedDefinitionCount === domains.nestedDefinitions.length
    && domains.summary?.nestedLongerThanRootCount === longer
    && domains.summary?.completeRootReachableDomainInventory === false
    && domains.summary?.unresolvedReachabilityCount === domains.nestedDefinitions.length,
  `${member.animationId}: frame-domain summary drifted`);
  invariant(Object.values(domains.acceptanceEffects || {}).every((value) => value === false),
    `${member.animationId}: frame-domain candidate unexpectedly has an acceptance effect`);
  return {longer};
}

export function validateIndependentDeclarationEvidence({
  evidence,
  evidenceBinding,
  declarationMember,
  manifest,
  member,
}) {
  invariant(
    evidence && evidenceBinding && declarationMember,
    `${member.animationId}: declared child domains lack their exact independent-domain evidence lineage`,
  );
  const generated = evidence.generatedFrom || {};
  validateSourceProvenIndependentEvidenceDocument(evidence, {
    animationId: member.animationId,
    sourceSwf: generated.sourceSwf,
    scenarioInventory: generated.scenarioInventory,
    migrationTechnicalProjection: generated.migrationTechnicalProjection,
    swfmillStructure: generated.swfmillStructure,
    ffdecScripts: generated.ffdecScripts,
  });
  invariant(
    evidenceBinding.path ===
        `migrations/${member.animationId}/${SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH}` &&
      evidenceBinding.sha256 ===
        declarationMember.preTransitionProof?.independentEvidence?.sha256 &&
      evidenceBinding.bytes ===
        declarationMember.preTransitionProof.independentEvidence.bytes &&
      generated.sourceSwf?.path === manifest.source.swf &&
      generated.sourceSwf.sha256 === member.source.sha256 &&
      generated.sourceProvenReleaseContract?.path ===
        G4_L10_WAVE2_REPORT_RELATIVE &&
      generated.sourceProvenReleaseContract.sha256 ===
        G4_L10_WAVE2_REPORT_SHA256 &&
      generated.sourceProvenReleaseContract.releaseId ===
        G4_L10_RELEASE_ID &&
      equalStable(
        evidence.exactPairSets?.accepted,
        declarationMember.preTransitionProof?.acceptedPairSet,
      ) &&
      evidence.claims.length ===
        declarationMember.declaration.frameDomainCount,
    `${member.animationId}: independent-domain evidence/receipt binding drifted`,
  );
  invariant(
    declarationMember.ordinal === member.ordinal &&
      declarationMember.assetId === member.assetId,
    `${member.animationId}: declaration receipt member binding drifted`,
  );
  const expectedDomains = evidence.claims.map((claim, claimIndex) =>
    buildIndependentFrameDomainDeclaration({
      claim,
      evidenceRecord: evidenceBinding,
      claimIndex,
    }));
  invariant(
    equalStable(expectedDomains, declarationMember.declaration.domains),
    `${member.animationId}: declaration receipt domains do not reproduce from the exact source proof`,
  );
  const claimsById = new Map();
  for (const [claimIndex, claim] of evidence.claims.entries()) {
    invariant(
      !claimsById.has(claim.timelineId),
      `${member.animationId}: duplicate independent-domain claim ${claim.timelineId}`,
    );
    claimsById.set(claim.timelineId, {claim, claimIndex});
  }
  return {claimsById, expectedDomains};
}

export function validateWave3MemberLineage({
  wave3Member,
  wave3Receipt,
  declarationReceiptBinding,
  manifest,
  manifestBinding,
  member,
  disposition,
  dispositionBinding,
  staticEvidence,
  staticEvidenceBinding,
}) {
  invariant(
    wave3Member && staticEvidence && staticEvidenceBinding &&
      dispositionBinding,
    `${member.animationId}: wave3 successor lineage is partial`,
  );
  invariant(
    exactDescriptor(
      dispositionBinding,
      wave3Member.successor.frameDomainDisposition,
    ) &&
      exactDescriptor(
        staticEvidenceBinding,
        wave3Member.successor.staticCompositeEvidence,
      ) &&
      exactDescriptor(
        manifestBinding,
        wave3Member.unchangedInputs.migrationJson,
      ),
    `${member.animationId}: wave3 successor descriptor drifted`,
  );
  const parentDomain = manifest.implementation.frameDomains.find(
    ({id}) => id === wave3Member.parentDeclaration.id,
  );
  invariant(
    parentDomain && equalStable({
      id: parentDomain.id,
      sourceTimelineId: parentDomain.sourceTimelineId,
      frameCount: parentDomain.frameCount,
      sourceProof: parentDomain.sourceProof,
    }, wave3Member.parentDeclaration),
    `${member.animationId}: wave3 declared-parent sourceProof lineage drifted`,
  );
  assertWave3AcceptanceNeutralDocument(
    staticEvidence,
    `${member.animationId}: wave3 static evidence`,
  );
  invariant(
    staticEvidence.schemaVersion === 2 &&
      staticEvidence.evidenceType ===
        "static-frame-domain-disposition-evidence" &&
      staticEvidence.status === "verified-static-composite-claims" &&
      staticEvidence.animationId === member.animationId &&
      staticEvidence.generatedFrom?.sourceSwf?.path === manifest.source.swf &&
      staticEvidence.generatedFrom.sourceSwf.sha256 === member.source.sha256 &&
      staticEvidence.generatedFrom?.postDeclarationWave3Basis
        ?.declarationReceipt?.path === declarationReceiptBinding.path &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .declarationReceipt.bytes === declarationReceiptBinding.bytes &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .declarationReceipt.sha256 === declarationReceiptBinding.sha256 &&
      equalStable(
        staticEvidence.generatedFrom.postDeclarationWave3Basis
          .oldParentUndeclaredPairSet,
        wave3Receipt.exactPairSets.oldParentUndeclared,
      ) &&
      equalStable(
        staticEvidence.generatedFrom.postDeclarationWave3Basis
          .acceptedPairSet,
        wave3Receipt.exactPairSets.accepted,
      ) &&
      equalStable(
        staticEvidence.generatedFrom.postDeclarationWave3Basis
          .rejectedPairSet,
        wave3Receipt.exactPairSets.rejected,
      ) &&
      equalStable(
        staticEvidence.generatedFrom.postDeclarationWave3Basis
          .remainingUnresolvedPairSet,
        wave3Receipt.exactPairSets.remainingUnresolved,
      ) &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .candidateSpecSha256 === wave3Member.candidateSpecSha256 &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .candidateSpecHashMode === wave3Member.candidateSpecHashMode &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .engineeringReviewOnly === true &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .humanReviewer === false &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .ownerAcceptance === false &&
      staticEvidence.generatedFrom.postDeclarationWave3Basis
        .strictAcceptanceEffect === "none",
    `${member.animationId}: wave3 static-evidence basis drifted`,
  );
  const claimIndexes = [];
  for (const [index, claim] of (staticEvidence.claims || []).entries()) {
    if (equalStable(claim, wave3Member.compositeClaim)) claimIndexes.push(index);
  }
  invariant(
    claimIndexes.length === 1 &&
      Object.values(wave3Member.compositeClaim.preservedObligations || {})
        .every((obligation) =>
          obligation?.required === true &&
          obligation.satisfiedByDisposition === false),
    `${member.animationId}: wave3 composite claim or preserved obligations drifted`,
  );
  const [claimIndex] = claimIndexes;
  const dispositionBasis =
    disposition.generatedFrom?.postDeclarationWave3CompositeBasis;
  invariant(
    disposition.generatedFrom?.staticDispositionEvidence?.path ===
        STATIC_COMPOSITE_EVIDENCE_RELATIVE &&
      disposition.generatedFrom.staticDispositionEvidence.sha256 ===
        staticEvidenceBinding.sha256 &&
      disposition.generatedFrom.staticDispositionEvidence.claimCount ===
        staticEvidence.claims.length &&
      dispositionBasis?.declarationReceipt?.path ===
        declarationReceiptBinding.path &&
      dispositionBasis.declarationReceipt.bytes ===
        declarationReceiptBinding.bytes &&
      dispositionBasis.declarationReceipt.sha256 ===
        declarationReceiptBinding.sha256 &&
      equalStable(
        dispositionBasis.memberAcceptedPairSet,
        staticEvidence.generatedFrom.postDeclarationWave3Basis
          .memberAcceptedPairSet,
      ) &&
      equalStable(
        dispositionBasis.acceptedPairSet,
        wave3Receipt.exactPairSets.accepted,
      ) &&
      equalStable(
        dispositionBasis.rejectedPairSet,
        wave3Receipt.exactPairSets.rejected,
      ) &&
      equalStable(
        dispositionBasis.remainingUnresolvedPairSet,
        wave3Receipt.exactPairSets.remainingUnresolved,
      ) &&
      dispositionBasis.candidateSpecSha256 ===
        wave3Member.candidateSpecSha256 &&
      exactDescriptor(
        dispositionBasis.staticCompositeEvidence,
        staticEvidenceBinding,
      ) &&
      dispositionBasis.dispositionEffect ===
        "unresolved-to-composite-child-with-parent-only" &&
      dispositionBasis.strictAcceptanceEffect === "none",
    `${member.animationId}: wave3 disposition basis drifted`,
  );
  const wave3Timelines = disposition.timelines.filter((timeline) =>
    timeline.staticCompositeEvidence?.role ===
      "multi-frame-scriptless-parent-clock-composite-child");
  invariant(
    wave3Timelines.length === 1 &&
      wave3Timelines[0].timelineId ===
        wave3Member.compositeClaim.timelineId &&
      wave3Timelines[0].frameCount ===
        wave3Member.compositeClaim.frameCount &&
      wave3Timelines[0].disposition === "composite-child-with-parent" &&
      wave3Timelines[0].declaredFrameDomains?.length === 0 &&
      wave3Timelines[0].staticCompositeEvidence.evidencePath ===
        STATIC_COMPOSITE_EVIDENCE_RELATIVE &&
      wave3Timelines[0].staticCompositeEvidence.evidenceSha256 ===
        staticEvidenceBinding.sha256 &&
      wave3Timelines[0].staticCompositeEvidence.claimIndex === claimIndex &&
      wave3Timelines[0].staticCompositeEvidence.claimScope ===
        wave3Member.compositeClaim.claimScope &&
      wave3Timelines[0].staticCompositeEvidence.parentTimelineId ===
        wave3Member.compositeClaim.parentBinding.parentTimelineId &&
      wave3Timelines[0].staticCompositeEvidence.parentFrameDomainId ===
        wave3Member.compositeClaim.parentBinding.parentFrameDomainId &&
      wave3Timelines[0].riskAssessment?.level === "none" &&
      wave3Timelines[0].riskAssessment
        .independentFrameDomainCandidate === false &&
      Object.entries(wave3Timelines[0].staticCompositeEvidence)
        .filter(([key]) => key.endsWith("Obligation"))
        .every(([, obligation]) =>
          obligation?.required === true &&
          obligation.satisfiedByDisposition === false),
    `${member.animationId}: wave3 disposition claim projection drifted`,
  );
  return {
    compositeTimelineId: wave3Member.compositeClaim.timelineId,
    compositeClaim: wave3Member.compositeClaim,
  };
}

export function validateSourceProvenFrameDomainDisposition({
  disposition,
  domains,
  manifest,
  member,
  releaseBinding,
  independentEvidence = null,
  independentEvidenceBinding = null,
  declarationMember = null,
  wave3Lineage = null,
}) {
  const declarationBasis =
    disposition?.generatedFrom?.sourceProvenIndependentDeclarationBasis ||
    null;
  const declarationBound = Boolean(
    declarationBasis || declarationMember || independentEvidence ||
      independentEvidenceBinding,
  );
  invariant(
    disposition?.schemaVersion === 1 &&
      disposition.animationId === member.animationId &&
      disposition.migrationStatusChanged === false &&
      typeof disposition.strictAcceptanceEffect === "string" &&
      disposition.strictAcceptanceEffect.startsWith("none;"),
    `${member.animationId}: source-proven frame-domain disposition identity drifted`,
  );
  invariant(
    !declarationBound || (
      declarationBasis && declarationMember && independentEvidence &&
      independentEvidenceBinding
    ),
    `${member.animationId}: post-declaration evidence lineage is partial`,
  );
  invariant(
    disposition.generatedFrom?.sourceSwf?.path === manifest.source.swf &&
      disposition.generatedFrom.sourceSwf.sha256 === member.source.sha256 &&
      disposition.generatedFrom?.lessonReleaseCatalog?.releaseId ===
        releaseBinding.releaseId &&
      disposition.generatedFrom.lessonReleaseCatalog.sha256 ===
        releaseBinding.sha256 &&
      disposition.generatedFrom.lessonReleaseCatalog
        .releaseFingerprintSha256 ===
        releaseBinding.releaseFingerprintSha256,
    `${member.animationId}: source-proven disposition source/release binding drifted`,
  );
  const nestedById = new Map(
    domains.nestedDefinitions.map((entry) => [entry.timelineId, entry]),
  );
  const timelines = disposition.timelines;
  invariant(
    Array.isArray(timelines) && timelines.length > 0 &&
      disposition.summary?.inventoryTimelineCount ===
        domains.nestedDefinitions.length + 1 &&
      disposition.summary.enumeratedTimelineCount === timelines.length,
    `${member.animationId}: source-proven disposition inventory drifted`,
  );
  const root = timelines.find(({timelineId}) => timelineId === "root");
  invariant(
    root?.frameCount === manifest.runtime.frameCount &&
      root.structuralReachability === "root" &&
      root.disposition === "declared-frame-domain",
    `${member.animationId}: source-proven disposition root drifted`,
  );
  const allowed = new Set([
    "composite-child-with-parent",
    "independent-required",
    "nonvisual",
    "unresolved",
  ]);
  if (declarationBound) allowed.add("declared-frame-domain");
  const manifestNestedById = new Map();
  for (const domain of manifest.implementation?.frameDomains || []) {
    if (domain.id === "root") continue;
    invariant(
      !manifestNestedById.has(domain.id),
      `${member.animationId}: duplicate manifest frame domain ${domain.id}`,
    );
    manifestNestedById.set(domain.id, domain);
  }
  let declarationEvidence = null;
  if (declarationBound) {
    declarationEvidence = validateIndependentDeclarationEvidence({
      evidence: independentEvidence,
      evidenceBinding: independentEvidenceBinding,
      declarationMember,
      manifest,
      member,
    });
    invariant(
      equalStable(
        [...manifestNestedById.values()],
        declarationEvidence.expectedDomains,
      ),
      `${member.animationId}: manifest declared-domain/sourceProof set drifted`,
    );
    const declarationScenarios = (manifest.scenarios || []).filter(
      ({id}) => id === INDEPENDENT_DOMAIN_SCENARIO_ID,
    );
    invariant(
      declarationScenarios.length === 1 &&
        declarationScenarios[0].kind ===
          "source-proven-structural-entry-runtime-unresolved" &&
        declarationScenarios[0].reachable === true &&
        declarationScenarios[0].reachabilityAuthority ===
          "structural-root-placement-graph-only" &&
        declarationScenarios[0].authoritativeRuntimeEntryEstablished === false &&
        declarationScenarios[0].strictAcceptanceEffect === "none",
      `${member.animationId}: declared-domain entry-unresolved scenario drifted`,
    );
    invariant(
      declarationBasis.wave2Report?.path ===
          G4_L10_WAVE2_REPORT_RELATIVE &&
        declarationBasis.wave2Report.sha256 ===
          G4_L10_WAVE2_REPORT_SHA256 &&
        declarationBasis.memberEvidence?.path ===
          independentEvidenceBinding.path &&
        declarationBasis.memberEvidence.bytes ===
          independentEvidenceBinding.bytes &&
        declarationBasis.memberEvidence.sha256 ===
          independentEvidenceBinding.sha256 &&
        equalStable(
          declarationBasis.acceptedPairSet,
          independentEvidence.exactPairSets.accepted,
        ) &&
        declarationBasis.claimCount === independentEvidence.claims.length &&
        declarationBasis.declarationEffect ===
          "declared-frame-domain-only" &&
        declarationBasis.strictAcceptanceEffect === "none",
      `${member.animationId}: declared disposition proof lineage drifted`,
    );
  } else {
    invariant(
      manifestNestedById.size === 0,
      `${member.animationId}: a source-proven disposition may not silently bind undeclared-lineage nested domains`,
    );
  }
  const byTimelineId = new Map();
  const counts = {
    declared: 0,
    composite: 0,
    postDeclarationWave3Composite: 0,
    independentRequired: 0,
    nonvisual: 0,
    unresolved: 0,
  };
  for (const timeline of timelines) {
    if (timeline.timelineId === "root") continue;
    const machine = nestedById.get(timeline.timelineId);
    invariant(
      machine && !byTimelineId.has(timeline.timelineId) &&
        timeline.frameCount === machine.frameCount &&
        String(timeline.sourceObjectId) === String(machine.sourceObjectId) &&
        timeline.structuralReachability ===
          "reachable-from-root-placement-graph" &&
        allowed.has(timeline.disposition),
      `${member.animationId}/${timeline.timelineId}: source-proven disposition does not match the machine candidate`,
    );
    if (timeline.disposition === "declared-frame-domain") {
      const declaredDomain = manifestNestedById.get(timeline.timelineId);
      const proof = declarationEvidence?.claimsById.get(timeline.timelineId);
      const expectedDeclaredDescriptor = declaredDomain ? {
        frameDomainId: declaredDomain.id,
        kind: declaredDomain.kind,
        sourceTimelineId: declaredDomain.sourceTimelineId,
        sourceInstanceId: "",
        parentFrameDomainId: declaredDomain.parentFrameDomainId,
        parentEntryFrame: null,
        localEntryFrame: null,
        frameCount: declaredDomain.frameCount,
        role: declaredDomain.role,
      } : null;
      invariant(
        declaredDomain && proof &&
          timeline.sourceTimelineId === declaredDomain.sourceTimelineId &&
          String(timeline.sourceObjectId) ===
            String(proof.claim.sourceObjectId) &&
          equalStable(
            timeline.declaredFrameDomains,
            [expectedDeclaredDescriptor],
          ) &&
          timeline.dispositionBasis ===
            "The hash-bound migration manifest declares a matching source timeline and frame count in implementation.frameDomains." &&
          timeline.riskAssessment?.level === "none" &&
          timeline.riskAssessment.independentFrameDomainCandidate === false &&
          equalStable(timeline.riskAssessment.signals, [
            "source-timeline-already-declared-as-frame-domain",
          ]),
        `${member.animationId}/${timeline.timelineId}: declared disposition/manifest proof lineage drifted`,
      );
      counts.declared += 1;
    } else if (timeline.disposition === "composite-child-with-parent") {
      if (timeline.timelineId === wave3Lineage?.compositeTimelineId) {
        invariant(
          timeline.staticCompositeEvidence?.role ===
              "multi-frame-scriptless-parent-clock-composite-child" &&
            timeline.staticCompositeEvidence.claimScope ===
              "local-playhead-fully-derived-from-declared-parent-clock" &&
            timeline.riskAssessment?.independentFrameDomainCandidate === false,
          `${member.animationId}/${timeline.timelineId}: wave3 composite proof boundary drifted`,
        );
        counts.postDeclarationWave3Composite += 1;
      } else {
        invariant(
          timeline.staticCompositeEvidence?.claimScope ===
            "independent-local-playhead-only" &&
            timeline.riskAssessment?.independentFrameDomainCandidate === false,
          `${member.animationId}/${timeline.timelineId}: predecessor composite proof boundary drifted`,
        );
      }
      counts.composite += 1;
    } else if (timeline.disposition === "independent-required") {
      counts.independentRequired += 1;
    } else if (timeline.disposition === "nonvisual") {
      counts.nonvisual += 1;
    } else {
      counts.unresolved += 1;
    }
    byTimelineId.set(timeline.timelineId, timeline);
  }
  const reachableChildCount = byTimelineId.size;
  const excludedNotProvenCount =
    domains.nestedDefinitions.length - reachableChildCount;
  const reported = disposition.summary;
  const expectedStatus =
    counts.independentRequired + counts.unresolved > 0
      ? "structurally-enumerated-dispositions-unresolved"
      : "structurally-enumerated";
  invariant(
    disposition.status === expectedStatus &&
    reported.reachableChildTimelineCount === reachableChildCount &&
      reported.excludedNotProvenTimelineCount === excludedNotProvenCount &&
      reported.dispositionCounts?.["declared-frame-domain"] ===
        1 + counts.declared &&
      reported.dispositionCounts?.["composite-child-with-parent"] ===
        counts.composite &&
      reported.dispositionCounts?.["independent-required"] ===
        counts.independentRequired &&
      reported.dispositionCounts?.nonvisual === counts.nonvisual &&
      reported.dispositionCounts?.unresolved === counts.unresolved &&
      counts.declared + counts.composite + counts.independentRequired +
        counts.nonvisual + counts.unresolved === reachableChildCount &&
      (!declarationBound || (
        counts.declared === independentEvidence.claims.length &&
        counts.independentRequired === 0
      )) &&
      counts.postDeclarationWave3Composite === (wave3Lineage ? 1 : 0),
    `${member.animationId}: source-proven disposition census drifted`,
  );
  return {
    byTimelineId,
    declarationBound,
    reachableChildCount,
    excludedNotProvenCount,
    ...counts,
  };
}

export function validatePendingCoverage({
  coverage,
  member,
  manifest,
  dispositionSummary = null,
}) {
  invariant(coverage?.schemaVersion === 2 && coverage.animationId === member.animationId
    && Array.isArray(coverage.requirements) && coverage.requirements.length > 0,
  `${member.animationId}: coverage-v2 identity is incomplete`);
  const frameDomains = new Map(
    manifest.implementation.frameDomains.map((domain) => [domain.id, domain]),
  );
  const candidate = manifest.implementation?.candidateState;
  const requirementIds = new Set();
  let rootRequirementCount = 0;
  let nestedRequirementCount = 0;
  let declaredNestedRequirementCount = 0;
  let pendingRequirementCount = 0;
  let blockedRequirementCount = 0;
  const declaredRequirementLanguageKeys = new Set();
  for (const requirement of coverage.requirements) {
    invariant(
      requirement && typeof requirement === "object" && !Array.isArray(requirement),
      `${member.animationId}: coverage requirement must be an object`,
    );
    const unknownKeys = Object.keys(requirement).filter(
      (key) => !COVERAGE_REQUIREMENT_KEYS.has(key),
    );
    invariant(
      unknownKeys.length === 0,
      `${member.animationId}/${requirement.requirementId || "unknown"}: coverage requirement keys drifted (${unknownKeys.join(", ")})`,
    );
    invariant(typeof requirement.requirementId === "string" && !requirementIds.has(requirement.requirementId),
      `${member.animationId}: duplicate or invalid coverage requirementId`);
    requirementIds.add(requirement.requirementId);
    const frameDomain = frameDomains.get(requirement.frameDomainId);
    invariant(
      frameDomain,
      `${member.animationId}/${requirement.requirementId}: coverage frame domain is not declared`,
    );
    if (requirement.frameDomainId === "root") {
      rootRequirementCount += 1;
    } else {
      nestedRequirementCount += 1;
      const disposition = dispositionSummary?.byTimelineId.get(
        requirement.frameDomainId,
      );
      const declaredFromIndependentProof =
        dispositionSummary?.declarationBound === true &&
        disposition?.disposition === "declared-frame-domain";
      if (declaredFromIndependentProof) {
        const expectedEntryState = {
          kind: "declared-domain-entry-unresolved",
          animationId: member.animationId,
          releaseId: G4_L10_RELEASE_ID,
          frameDomainId: frameDomain.id,
          sourceTimelineId: frameDomain.sourceTimelineId,
          scenario: INDEPENDENT_DOMAIN_SCENARIO_ID,
          language: requirement.language,
          seed: "0",
          runtimeReachabilityEstablished: false,
        };
        const expectedRequirementId =
          `req:${frameDomain.id}:${INDEPENDENT_DOMAIN_SCENARIO_ID}:${requirement.language}`;
        const expectedTraceId =
          `trace:${frameDomain.id}:${INDEPENDENT_DOMAIN_SCENARIO_ID}:${requirement.language}:seed-0`;
        invariant(
          frameDomain.kind === "nested" &&
            frameDomain.sourceTimelineId === frameDomain.id &&
            equalStable(frameDomain.scenarioIds, [
              INDEPENDENT_DOMAIN_SCENARIO_ID,
            ]) &&
            frameDomain.sourceProof?.proofType ===
              "multi-frame-local-action-independent-domain" &&
            frameDomain.sourceProof.claimScope ===
              "separate-local-frame-action-domain-required" &&
            frameDomain.sourceProof.authoritativeRuntimeEntryEstablished === false &&
            frameDomain.sourceProof.strictAcceptanceEffect === "none" &&
            requirement.requirementId === expectedRequirementId &&
            requirement.scenario === INDEPENDENT_DOMAIN_SCENARIO_ID &&
            requirement.traceId === expectedTraceId &&
            requirement.seed === "0" &&
            equalStable(requirement.entryState, expectedEntryState) &&
            requirement.entryStateSha256 === sha256(Buffer.from(
              JSON.stringify(stable(expectedEntryState)),
            )) &&
            requirement.baselineAuthorityRequirement ===
              "original-runtime-natural-trace" &&
            requirement.status === "blocked" &&
            requirement.blockingReason ===
              DECLARED_DOMAIN_BLOCKING_REASON &&
            Array.isArray(requirement.blockingEvidence) &&
            requirement.blockingEvidence.length === 1 &&
            requirement.blockingEvidence[0]?.file ===
              "audit/scenario-inventory.json",
          `${member.animationId}/${requirement.requirementId}: declared-domain blocked coverage lineage drifted`,
        );
        const languageKey = `${frameDomain.id}\t${requirement.language}`;
        invariant(
          !declaredRequirementLanguageKeys.has(languageKey),
          `${member.animationId}/${requirement.requirementId}: duplicate declared-domain language requirement`,
        );
        declaredRequirementLanguageKeys.add(languageKey);
        declaredNestedRequirementCount += 1;
      } else {
        invariant(
          validateSourceStaticCandidateBoundary({candidate, frameDomain}),
          `${member.animationId}/${requirement.requirementId}: nested pending coverage is neither proof-declared blocked coverage nor a bounded source-static candidate`,
        );
      }
    }
    invariant(requirement.requiredRange?.firstFrame === 1
      && requirement.requiredRange?.lastFrame === frameDomain.frameCount,
    `${member.animationId}/${requirement.requirementId}: coverage range drifted`);
    invariant(
      requirement.status === "pending" || requirement.status === "blocked",
      `${member.animationId}/${requirement.requirementId}: coverage status is not conservative pending/blocked`,
    );
    if (requirement.status === "pending") pendingRequirementCount += 1;
    else blockedRequirementCount += 1;
    invariant(requirement.baselineAuthority === "unresolved"
      && requirement.capturedFrameCount === 0,
    `${member.animationId}/${requirement.requirementId}: canonical coverage was unexpectedly promoted`);
    const strictAcceptanceEffectPresent = Object.hasOwn(
      requirement,
      "strictAcceptanceEffect",
    );
    invariant(
      !strictAcceptanceEffectPresent ||
        requirement.strictAcceptanceEffect === "none",
      `${member.animationId}/${requirement.requirementId}: coverage has a strict acceptance effect`,
    );
    if (requirement.status === "blocked") {
      invariant(
        strictAcceptanceEffectPresent &&
          requirement.strictAcceptanceEffect === "none" &&
          requirement.planningAuthority ===
            CONSERVATIVE_BLOCKED_PLANNING_AUTHORITY,
        `${member.animationId}/${requirement.requirementId}: blocked coverage lacks the exact acceptance-neutral planning boundary`,
      );
      invariant(
        typeof requirement.blockingReason === "string" &&
          requirement.blockingReason.length > 0 &&
          Array.isArray(requirement.blockingEvidence) &&
          requirement.blockingEvidence.length > 0,
        `${member.animationId}/${requirement.requirementId}: blocked coverage lacks its reason or evidence binding`,
      );
      for (const [index, evidence] of requirement.blockingEvidence.entries()) {
        assertExactKeys(
          evidence,
          ["file", "sha256"],
          `${member.animationId}/${requirement.requirementId}: blocking evidence ${index + 1}`,
        );
        invariant(
          typeof evidence.file === "string" &&
            evidence.file.length > 0 &&
            !path.isAbsolute(evidence.file) &&
            !portable(evidence.file).split("/").includes("..") &&
            /^[a-f0-9]{64}$/.test(evidence.sha256),
          `${member.animationId}/${requirement.requirementId}: blocking evidence ${index + 1} is unsafe or unhashed`,
        );
      }
    } else {
      invariant(
        !Object.hasOwn(requirement, "blockingReason") &&
          !Object.hasOwn(requirement, "blockingEvidence"),
        `${member.animationId}/${requirement.requirementId}: legacy pending coverage may not carry blocked-state evidence`,
      );
    }
    if (Object.hasOwn(requirement, "planningAuthority")) {
      invariant(
        typeof requirement.planningAuthority === "string" &&
          requirement.planningAuthority.length > 0 &&
          !PROMOTION_AUTHORITY_PATTERN.test(requirement.planningAuthority),
        `${member.animationId}/${requirement.requirementId}: planning authority is empty or promotion-bearing`,
      );
    }
    invariant(Array.isArray(requirement.missingFrames)
      && requirement.missingFrames.length === frameDomain.frameCount,
    `${member.animationId}/${requirement.requirementId}: conservative frame inventory is incomplete`);
    invariant(requirement.missingFrames.every((frame, index) => frame === index + 1),
      `${member.animationId}/${requirement.requirementId}: conservative frame inventory is not exact`);
    invariant(requirement.baselineCaptureManifest === ""
      && requirement.baselineCaptureManifestSha256 === ""
      && requirement.captureManifest === ""
      && requirement.captureManifestSha256 === ""
      && requirement.metricsFile === ""
      && requirement.metricsSha256 === "",
    `${member.animationId}/${requirement.requirementId}: canonical coverage contains capture or metric evidence`);
  }
  const languages = [...new Set(coverage.requirements.map((entry) => entry.language))].sort();
  const expectedLanguages = [...new Set(manifest.localization?.languages || [])].sort();
  invariant(JSON.stringify(languages) === JSON.stringify(expectedLanguages),
    `${member.animationId}: coverage/localization language scope mismatch`);
  if (dispositionSummary?.declarationBound) {
    invariant(
      declaredNestedRequirementCount ===
        dispositionSummary.declared * expectedLanguages.length &&
        [...dispositionSummary.byTimelineId.values()]
          .filter(({disposition}) => disposition === "declared-frame-domain")
          .every(({timelineId}) => expectedLanguages.every((language) =>
            declaredRequirementLanguageKeys.has(`${timelineId}\t${language}`))),
      `${member.animationId}: declared-domain EN/ES blocked requirement census drifted`,
    );
  }
  return {
    requirementCount: coverage.requirements.length,
    rootRequirementCount,
    nestedRequirementCount,
    declaredNestedRequirementCount,
    pendingRequirementCount,
    blockedRequirementCount,
    languages,
  };
}

function binding(filePath, bytes, root, extra = {}) {
  return {
    path: projectRelative(filePath, root),
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...extra,
  };
}

function buildNestedDefinitionPlanning(domains, dispositionSummary) {
  return domains.nestedDefinitions.map((nested) => {
    const disposition = dispositionSummary?.byTimelineId.get(
      nested.timelineId,
    );
    if (!dispositionSummary) {
      return {
        frameDomainId: nested.timelineId,
        sourceTimelineId: nested.sourceTimelineId,
        sourceObjectId: nested.sourceObjectId,
        frameCount: nested.frameCount,
        rootReachability: "unresolved",
        placementEntryState: "unresolved",
        disposition: "structural-candidate-only",
      };
    }
    if (!disposition) {
      return {
        frameDomainId: nested.timelineId,
        sourceTimelineId: nested.sourceTimelineId,
        sourceObjectId: nested.sourceObjectId,
        frameCount: nested.frameCount,
        rootReachability: "not-proven-from-root-placement-graph",
        placementEntryState: "not-applicable-unless-reachability-is-proven",
        disposition: "excluded-not-proven",
      };
    }
    if (disposition.disposition === "declared-frame-domain") {
      return {
        frameDomainId: nested.timelineId,
        sourceTimelineId: nested.sourceTimelineId,
        sourceObjectId: nested.sourceObjectId,
        frameCount: nested.frameCount,
        rootReachability: disposition.structuralReachability,
        placementEntryState:
          "declared-domain-natural-runtime-entry-unresolved",
        disposition: disposition.disposition,
        declarationAuthority:
          "source-proven-independent-domain-declaration-only",
        runtimeReachabilityEstablished: false,
        strictAcceptanceEffect: "none",
      };
    }
    return {
      frameDomainId: nested.timelineId,
      sourceTimelineId: nested.sourceTimelineId,
      sourceObjectId: nested.sourceObjectId,
      frameCount: nested.frameCount,
      rootReachability: disposition.structuralReachability,
      placementEntryState:
        disposition.disposition === "composite-child-with-parent"
          ? "separate-local-playhead-not-required-by-source-proof"
          : "unresolved",
      disposition: disposition.disposition,
    };
  });
}

function buildWorkspaceArtifact({
  release,
  member,
  releaseBinding,
  assetBinding,
  materializerBinding,
  manifestBinding,
  sourceScopeBinding,
  domainBinding,
  dispositionBinding,
  independentEvidenceBinding,
  declarationReceiptBinding,
  wave3ReceiptBinding,
  staticCompositeEvidenceBinding,
  coverageBinding,
  operatorAssignmentBinding,
  operatorAssignment,
  manifest,
  source,
  domains,
  dispositionSummary,
  coverageSummary,
  currentJavascriptCandidate,
}) {
  const nestedDefinitionPlanning = buildNestedDefinitionPlanning(
    domains,
    dispositionSummary,
  );
  const artifact = {
    schemaVersion: 2,
    artifactType: "release-runtime-acquisition-plan",
    ownership: {
      owner: "machine-generated-acceptance-neutral-planning",
      canonicalCoverage: false,
      canonicalAcceptanceEvidence: false,
      migrationManifestBindingCreated: false,
      safeToReplaceOnlyWithThisMaterializer: true,
    },
    identity: {
      releaseId: release.releaseId,
      releaseType: release.releaseType,
      publicationMode: release.publicationMode,
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
    },
    provenance: {
      lessonReleaseCatalog: releaseBinding,
      assetCatalog: assetBinding,
      migrationManifest: manifestBinding,
      sourceScopeBinding,
      structuralFrameDomainCandidates: domainBinding,
      sourceProvenFrameDomainDisposition: dispositionBinding,
      sourceProvenIndependentFrameDomainEvidence:
        independentEvidenceBinding,
      independentFrameDomainDeclarationReceipt:
        declarationReceiptBinding,
      postDeclarationWave3Receipt: wave3ReceiptBinding,
      postDeclarationWave3StaticCompositeEvidence:
        staticCompositeEvidenceBinding,
      canonicalCoverageV2: coverageBinding,
      namedOperatorAssignmentReceipt: operatorAssignmentBinding,
      materializer: materializerBinding,
    },
    namedOperatorRoleAssignment: operatorAssignment,
    source,
    nativeRootTimelineFacts: {
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      durationMs: manifest.runtime.durationMs,
      accountingBoundary: "structural-root-only-not-total-lesson-coverage",
    },
    structuralDomainPlanning: {
      root: {
        frameDomainId: "root",
        sourceTimelineId: domains.root.sourceTimelineId,
        frameCount: domains.root.frameCount,
        rootByDefinition: true,
        completeCoverageEstablished: false,
      },
      nestedDefinitionCandidates: nestedDefinitionPlanning,
      sourceProvenDispositionBound: Boolean(dispositionSummary),
      structuralRootReachableChildCount:
        dispositionSummary?.reachableChildCount ?? null,
      sourceProvenCompositeChildCount:
        dispositionSummary?.composite ?? 0,
      postDeclarationWave3CompositeCount:
        dispositionSummary?.postDeclarationWave3Composite ?? 0,
      sourceProvenDeclaredChildCount:
        dispositionSummary?.declared ?? 0,
      declaredDomainRuntimeEntryUnresolvedCount:
        dispositionSummary?.declared ?? 0,
      independentRequiredChildCount:
        dispositionSummary?.independentRequired ?? 0,
      nonvisualChildCount: dispositionSummary?.nonvisual ?? 0,
      unresolvedRootReachableChildCount:
        dispositionSummary?.unresolved ?? domains.nestedDefinitions.length,
      excludedNotProvenNestedDefinitionCount:
        dispositionSummary?.excludedNotProvenCount ?? 0,
      structuralRootReachableInventoryEnumerated:
        Boolean(dispositionSummary),
      rootReachableDomainInventoryComplete: false,
      totalCoverageFrameCount: null,
      totalCoverageFramesKnown: false,
      warning: "Root frame counts and nested definition frame counts are separate structural domains. Source-proven declaration satisfies only the missing-domain planning obligation, and composite classification removes only a separate local-playhead obligation; neither establishes natural runtime reachability, visual/audio/behavior coverage, or acceptance.",
    },
    coverageV2Planning: {
      canonicalFileBoundReadOnly: true,
      canonicalFileModified: false,
      canonicalRequirementCount: coverageSummary.requirementCount,
      canonicalRootOnlyRequirementCount:
        coverageSummary.rootRequirementCount,
      canonicalPendingRequirementCount:
        coverageSummary.pendingRequirementCount,
      canonicalBlockedRequirementCount:
        coverageSummary.blockedRequirementCount,
      canonicalLanguages: coverageSummary.languages,
      nestedRequirementsMaterialized:
        coverageSummary.nestedRequirementCount,
      sourceProvenDeclaredBlockedRequirements:
        coverageSummary.declaredNestedRequirementCount,
      completeRequirementInventoryEstablished: false,
      authoritativeBaselineCount: 0,
      candidateCaptureCount: 0,
      comparisonMetricsCount: 0,
    },
    currentJavascriptEngineeringCandidate: currentJavascriptCandidate,
    emptyRuntimeAcquisitionWorksheet: {
      state: "empty-non-runnable-planning-only",
      namedOperatorFieldMeaning: "per-session operator attestation only; release-level role assignment is separate",
      namedOperators: [],
      authorizedRuntimeContexts: [],
      naturalEntryActions: [],
      traceSchedules: [],
      actionSchedules: [],
      deterministicSeedSchedules: [],
      baselineManifests: [],
      pngFiles: [],
      audioListeningRecords: [],
      runtimeReceipts: [],
      reviewerSignatures: [],
      ownerSignatures: [],
    },
    executionGate: {
      state: "closed",
      runnable: false,
      launchesAnimate: false,
      launchesRuffle: false,
      launchesBrowser: false,
      launchesOriginalRuntime: false,
      executesLegacyEndpoints: false,
      createsRuntimeEvidence: false,
      createsBaselineEvidence: false,
      authorizesDirectSeek: false,
    },
    unresolvedBlockers: {
      missingNamedOriginalRuntimeOperator: operatorAssignment === null,
      missingPortableOperatorIdentityVerification: true,
      missingOperatorWeeklyCapacityCommitment: true,
      missingBackupOriginalRuntimeOperator: true,
      missingImmutablePerSessionOperatorAttestation: true,
      missingPerSessionExecutionAuthorization: true,
      missingAuthorizedOriginalRuntimeContext: true,
      missingNaturalHostEntry: true,
      unresolvedRootReachableNestedDomains:
        dispositionSummary?.unresolved ?? domains.nestedDefinitions.length,
      unresolvedPlacementEntryStates:
        dispositionSummary
          ? dispositionSummary.unresolved + dispositionSummary.declared
          : domains.nestedDefinitions.length,
      missingCompleteTraceSchedules: true,
      missingBilingualRuntimeTraversal: true,
      missingInteractionBranchRandomReplayTraversal: true,
      missingAudioCueAndListeningDisposition: true,
      missingAuthoritativeBaselines: true,
    },
    acceptanceEffects: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntime: false,
      currentJavaScriptCandidate: false,
      fullFrameComparison: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  return {
    ...artifact,
    artifactFingerprintSha256: sha256(Buffer.from(stableJson(artifact))),
  };
}

function reportBaseName(releaseId, shardId) {
  const base = `${releaseId.replace(/^lesson-/, "")}-runtime-acquisition-planning-readiness`;
  return shardId ? `${base}-${shardId}` : base;
}

function buildReadinessReport({
  release,
  selectedShard,
  releaseBinding,
  assetBinding,
  materializerBinding,
  operatorAssignmentBinding,
  operatorAssignment,
  declarationReceiptBinding,
  wave3ReceiptBinding,
  plans,
}) {
  const summary = {
    selectedMemberCount: plans.length,
    pairedFlaAndSwfCount: plans.filter((plan) => Boolean(plan.source.fla)).length,
    swfOnlyCount: plans.filter((plan) => !plan.source.fla).length,
    structuralRootFrameCount: plans.reduce((sum, plan) => sum + plan.rootFrameCount, 0),
    structuralNestedDefinitionCount: plans.reduce((sum, plan) => sum + plan.nestedDefinitionCount, 0),
    structuralNestedLongerThanRootCount: plans.reduce((sum, plan) => sum + plan.nestedLongerThanRootCount, 0),
    sourceProvenDispositionBoundPlanCount: plans.filter(
      (plan) => plan.sourceProvenDispositionBound,
    ).length,
    structuralRootReachableChildCount: plans.reduce(
      (sum, plan) => sum + (plan.structuralRootReachableChildCount ?? 0),
      0,
    ),
    sourceProvenCompositeChildCount: plans.reduce(
      (sum, plan) => sum + plan.sourceProvenCompositeChildCount,
      0,
    ),
    postDeclarationWave3BoundPlanCount: plans.filter(
      (plan) => plan.postDeclarationWave3Bound,
    ).length,
    postDeclarationWave3CompositeCount: plans.reduce(
      (sum, plan) => sum + plan.postDeclarationWave3CompositeCount,
      0,
    ),
    independentDomainDeclarationBoundPlanCount: plans.filter(
      (plan) => plan.independentDomainDeclarationBound,
    ).length,
    sourceProvenDeclaredChildCount: plans.reduce(
      (sum, plan) => sum + plan.sourceProvenDeclaredChildCount,
      0,
    ),
    declaredDomainRuntimeEntryUnresolvedCount: plans.reduce(
      (sum, plan) =>
        sum + plan.declaredDomainRuntimeEntryUnresolvedCount,
      0,
    ),
    independentRequiredChildCount: plans.reduce(
      (sum, plan) => sum + plan.independentRequiredChildCount,
      0,
    ),
    nonvisualChildCount: plans.reduce(
      (sum, plan) => sum + plan.nonvisualChildCount,
      0,
    ),
    excludedNotProvenNestedDefinitionCount: plans.reduce(
      (sum, plan) => sum + plan.excludedNotProvenNestedDefinitionCount,
      0,
    ),
    unresolvedNestedReachabilityCount: plans.reduce(
      (sum, plan) => sum + plan.unresolvedRootReachableChildCount,
      0,
    ),
    canonicalRequirementCount: plans.reduce(
      (sum, plan) => sum + plan.coverageRequirementCount,
      0,
    ),
    canonicalRootOnlyRequirementCount: plans.reduce(
      (sum, plan) => sum + plan.rootCoverageRequirementCount,
      0,
    ),
    canonicalNestedRequirementCount: plans.reduce(
      (sum, plan) => sum + plan.nestedCoverageRequirementCount,
      0,
    ),
    sourceProvenDeclaredBlockedRequirementCount: plans.reduce(
      (sum, plan) =>
        sum + plan.declaredNestedCoverageRequirementCount,
      0,
    ),
    canonicalPendingRequirementCount: plans.reduce(
      (sum, plan) => sum + plan.pendingCoverageRequirementCount,
      0,
    ),
    canonicalBlockedRequirementCount: plans.reduce(
      (sum, plan) => sum + plan.blockedCoverageRequirementCount,
      0,
    ),
    currentJavascriptEngineeringCandidateCount: plans.filter(
      ({currentJavascriptCandidate}) => currentJavascriptCandidate,
    ).length,
    manifestBoundSingleSpriteCandidateCount: plans.filter(
      ({currentJavascriptCandidate}) =>
        currentJavascriptCandidate?.bindingAuthority ===
          "manifest-bound-single-sprite-candidate",
    ).length,
    independentDualSpriteCompositeCandidateCount: plans.filter(
      ({currentJavascriptCandidate}) =>
        currentJavascriptCandidate?.bindingAuthority ===
          "independent-fq001-composite-evidence-only",
    ).length,
    currentJavascriptOpenFrameCount: plans.reduce(
      (sum, {currentJavascriptCandidate}) =>
        sum + (currentJavascriptCandidate?.openFrameCount ?? 0),
      0,
    ),
    currentJavascriptBlockedTailFrameCount: plans.reduce(
      (sum, {currentJavascriptCandidate}) =>
        sum + (currentJavascriptCandidate?.blockedTailFrameCount ?? 0),
      0,
    ),
    completeRootReachableDomainInventoryCount: 0,
    totalCoverageFrameCountKnownCount: 0,
    emptyWorksheetCount: plans.length,
    namedOperatorRoleAssignmentReceiptCount: operatorAssignment ? 1 : 0,
    plansWithNamedOperatorRoleAssignmentCount: operatorAssignment ? plans.length : 0,
    sessionOperatorAttestationCount: 0,
    runnableArtifactCount: 0,
    runtimeSessionCount: 0,
    authoritativeBaselineCount: 0,
    acceptanceChangeCount: 0,
  };
  const report = {
    schemaVersion: 2,
    reportType: "release-runtime-acquisition-planning-readiness",
    identity: {
      releaseId: release.releaseId,
      releaseType: release.releaseType,
      publicationMode: release.publicationMode,
      grade: release.grade,
      lesson: release.lesson,
      titleDisplay: release.titleDisplay,
      shardId: selectedShard?.shardId || null,
    },
    provenance: {
      lessonReleaseCatalog: releaseBinding,
      assetCatalog: assetBinding,
      namedOperatorAssignmentReceipt: operatorAssignmentBinding,
      independentFrameDomainDeclarationReceipt:
        declarationReceiptBinding,
      postDeclarationWave3Receipt: wave3ReceiptBinding,
      materializer: materializerBinding,
    },
    namedOperatorRoleAssignment: operatorAssignment,
    scope: {
      releaseMemberCount: release.members.length,
      selectedMemberCount: plans.length,
      selectedOrdinals: plans.map((plan) => plan.member.ordinal),
      exactReleaseScopeValidated: true,
      exactWorkspaceIdentityValidated: true,
      exactPhysicalSourceIdentityValidated: true,
      canonicalFilesModified: false,
    },
    summary,
    items: plans.map((plan) => ({
      ordinal: plan.member.ordinal,
      animationId: plan.member.animationId,
      assetId: plan.member.assetId,
      shardId: plan.member.shardId,
      sourceModel: plan.source.fla ? "paired-fla-and-shipped-swf" : "shipped-swf-only",
      rootFrameCount: plan.rootFrameCount,
      nestedDefinitionCount: plan.nestedDefinitionCount,
      nestedLongerThanRootCount: plan.nestedLongerThanRootCount,
      sourceProvenDispositionBound:
        plan.sourceProvenDispositionBound,
      structuralRootReachableChildCount:
        plan.structuralRootReachableChildCount,
      sourceProvenCompositeChildCount:
        plan.sourceProvenCompositeChildCount,
      postDeclarationWave3Bound:
        plan.postDeclarationWave3Bound,
      postDeclarationWave3CompositeCount:
        plan.postDeclarationWave3CompositeCount,
      independentDomainDeclarationBound:
        plan.independentDomainDeclarationBound,
      sourceProvenDeclaredChildCount:
        plan.sourceProvenDeclaredChildCount,
      declaredDomainRuntimeEntryUnresolvedCount:
        plan.declaredDomainRuntimeEntryUnresolvedCount,
      independentRequiredChildCount:
        plan.independentRequiredChildCount,
      nonvisualChildCount: plan.nonvisualChildCount,
      excludedNotProvenNestedDefinitionCount:
        plan.excludedNotProvenNestedDefinitionCount,
      unresolvedNestedReachabilityCount:
        plan.unresolvedRootReachableChildCount,
      canonicalRequirementCount: plan.coverageRequirementCount,
      canonicalRootOnlyRequirementCount:
        plan.rootCoverageRequirementCount,
      canonicalNestedRequirementCount:
        plan.nestedCoverageRequirementCount,
      sourceProvenDeclaredBlockedRequirementCount:
        plan.declaredNestedCoverageRequirementCount,
      canonicalPendingRequirementCount:
        plan.pendingCoverageRequirementCount,
      canonicalBlockedRequirementCount:
        plan.blockedCoverageRequirementCount,
      currentJavascriptEngineeringCandidate:
        plan.currentJavascriptCandidate,
      totalCoverageFrameCount: null,
      runtimeWorksheet: "empty-non-runnable-planning-only",
      artifact: {
        path: plan.artifactRelative,
        bytes: plan.artifactBytes.length,
        sha256: sha256(plan.artifactBytes),
        fingerprintSha256: plan.artifact.artifactFingerprintSha256,
      },
      acceptanceEffect: "none",
    })),
    gates: {
      machinePlanningArtifactsMaterialized: true,
      namedOperatorRoleAssignmentBound: operatorAssignment !== null,
      portableOperatorIdentityVerified: false,
      operatorWeeklyCapacityEstablished: false,
      runtimeOperatorSessionAttested: false,
      runtimeOperatorBound: false,
      authorizedOriginalRuntimeBound: false,
      naturalTraceSchedulesComplete: false,
      rootReachableDomainsResolved: false,
      authoritativeBaselinesComplete: false,
      audioRuntimeListeningComplete: false,
      implementationAuthorized: false,
      strictCompletionAffected: false,
      publicationAffected: false,
    },
    statement: operatorAssignment
      ? "This deterministic report proves exact release/source/workspace binding, one user-attested release-level primary operator role assignment, and materialization of empty, non-runnable per-session planning worksheets. The role receipt does not establish portable identity, weekly capacity, backup coverage, host or containment approval, immutable per-session authorization, session operator attestation, runtime execution, or evidence. Root timeline counts are structural facts, not total coverage. A hash-bound source-proven declaration satisfies only the missing-domain planning obligation; each declared domain's natural runtime entry remains unresolved. Composite classification removes only a separate local-playhead obligation, while disposition-unresolved children and excluded-not-proven definitions remain acceptance blockers. No runtime, trace, action, baseline, PNG, signature, review, acceptance, strict-completion, or publication evidence is created."
      : "This deterministic report proves only exact release/source/workspace binding and materialization of empty, non-runnable planning artifacts. Root timeline counts are structural facts, not total coverage. A hash-bound source-proven declaration satisfies only the missing-domain planning obligation; each declared domain's natural runtime entry remains unresolved. Composite classification, including the exact three post-declaration wave3 parent-clock transitions, removes only a separate local-playhead obligation, while disposition-unresolved children and excluded-not-proven definitions remain acceptance blockers. No runtime, trace, action, baseline, PNG, signature, review, acceptance, strict-completion, or publication evidence is created.",
  };
  return {
    ...report,
    reportFingerprintSha256: sha256(Buffer.from(stableJson(report))),
  };
}

function buildReadinessMarkdown(report) {
  const summary = report.summary;
  return [
    `# ${report.identity.releaseId} runtime-acquisition planning readiness`,
    "",
    `- Selection: ${report.identity.shardId || "full release"}`,
    `- Members: ${summary.selectedMemberCount}/${report.scope.releaseMemberCount}`,
    `- Sources: ${summary.pairedFlaAndSwfCount} paired FLA+SWF; ${summary.swfOnlyCount} SWF-only`,
    `- Structural root frames: ${summary.structuralRootFrameCount} (root timelines only; not total coverage)`,
    `- Nested definition candidates: ${summary.structuralNestedDefinitionCount}; ${summary.structuralNestedLongerThanRootCount} longer than their member root`,
    summary.sourceProvenDispositionBoundPlanCount > 0
      ? `- Source-proven structural dispositions: ${summary.sourceProvenDispositionBoundPlanCount}/${summary.selectedMemberCount} plans bound; ${summary.structuralRootReachableChildCount} root-reachable children + ${summary.excludedNotProvenNestedDefinitionCount} excluded-not-proven definitions; ${summary.sourceProvenDeclaredChildCount} declared (${summary.declaredDomainRuntimeEntryUnresolvedCount} natural runtime entries unresolved), ${summary.sourceProvenCompositeChildCount} composite (${summary.postDeclarationWave3CompositeCount} exact post-declaration wave3 parent-clock transitions), ${summary.independentRequiredChildCount} independent-required, ${summary.nonvisualChildCount} nonvisual, ${summary.unresolvedNestedReachabilityCount} disposition-unresolved`
      : "- Source-proven structural dispositions: none bound; every nested definition remains conservatively unresolved",
    `- Unresolved entry state: ${summary.declaredDomainRuntimeEntryUnresolvedCount} proof-declared natural runtime entries + ${summary.unresolvedNestedReachabilityCount} disposition-unresolved root-reachable children`,
    `- Existing canonical requirements: ${summary.canonicalRequirementCount} conservative = ${summary.canonicalBlockedRequirementCount} blocked + ${summary.canonicalPendingRequirementCount} legacy pending; ${summary.canonicalRootOnlyRequirementCount} root + ${summary.canonicalNestedRequirementCount} bounded nested (${summary.sourceProvenDeclaredBlockedRequirementCount} proof-declared and still blocked), bound read-only`,
    `- Current-JavaScript engineering candidates: ${summary.currentJavascriptEngineeringCandidateCount} = ${summary.manifestBoundSingleSpriteCandidateCount} manifest-bound single-sprite + ${summary.independentDualSpriteCompositeCandidateCount} independently bound dual-sprite composite; ${summary.currentJavascriptOpenFrameCount} open frame(s), ${summary.currentJavascriptBlockedTailFrameCount} blocked tail frame(s)`,
    `- Planning artifacts: ${summary.emptyWorksheetCount} empty/non-runnable; runtime sessions 0; acceptance changes 0`,
    `- Named primary operator role receipts: ${summary.namedOperatorRoleAssignmentReceiptCount}; per-session operator attestations: ${summary.sessionOperatorAttestationCount}`,
    "",
    "## Gate state",
    "",
    report.namedOperatorRoleAssignment
      ? "The release-level primary operator role is bound to Dr. Peter Hu by current-task user attestation. Portable identity, weekly capacity, backup coverage, approved host/containment, immutable per-session authorization, per-session operator attestation, runtime execution, natural host entry, complete trace/action schedules, root-reachable nested domains, authoritative baselines, audio listening, human review, owner review, strict completion, and publication all remain closed."
      : "Runtime operator, authorized runtime context, natural host entry, complete trace/action schedules, root-reachable nested domains, authoritative baselines, audio listening, human review, owner review, strict completion, and publication all remain closed.",
    "",
    "The structural root-frame sum must not be treated as lesson coverage. The complete coverage quantity remains unknown until natural original-runtime traversal resolves root-reachable nested domains, interactions, branches, random paths, audio, terminal behavior, and Replay.",
    "",
    `Report fingerprint: \`${report.reportFingerprintSha256}\``,
    "",
  ].join("\n");
}

async function writeAtomic(filePath, bytes) {
  const temporary = `${filePath}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

async function verifyInputSnapshots(snapshots) {
  for (const snapshot of snapshots) {
    const current = await readRegularFile(snapshot.filePath, snapshot.label);
    if (snapshot.bytes) {
      invariant(current.equals(snapshot.bytes), `${snapshot.label}: changed during planning publication`);
    } else {
      invariant(current.length === snapshot.byteLength && sha256(current) === snapshot.sha256,
        `${snapshot.label}: changed during planning publication`);
    }
  }
}

async function writeTransaction(operations, inputSnapshots) {
  if (!operations.length) return;
  const transactionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const staged = [];
  try {
    for (const [index, operation] of operations.entries()) {
      await mkdir(path.dirname(operation.filePath), {recursive: true});
      const temporaryPath = `${operation.filePath}.stage-${transactionId}-${index}`;
      await writeFile(temporaryPath, operation.nextBytes);
      staged.push({...operation, temporaryPath});
    }
    await verifyInputSnapshots(inputSnapshots);
  } catch (error) {
    await Promise.all(staged.map(({temporaryPath}) => unlink(temporaryPath).catch(() => {})));
    throw new Error(`Runtime planning transaction staging failed before commit (${error.message})`);
  }
  const applied = [];
  try {
    for (const operation of staged) {
      await rename(operation.temporaryPath, operation.filePath);
      applied.push(operation);
    }
    await verifyInputSnapshots(inputSnapshots);
  } catch (error) {
    const rollbackErrors = [];
    for (const operation of [...applied].reverse()) {
      try {
        if (operation.previousBytes === null) await unlink(operation.filePath);
        else await writeAtomic(operation.filePath, operation.previousBytes);
      } catch (rollbackError) {
        rollbackErrors.push(`${operation.filePath}: ${rollbackError.message}`);
      }
    }
    await Promise.all(staged.slice(applied.length).map(({temporaryPath}) => unlink(temporaryPath).catch(() => {})));
    throw new Error(`Runtime planning transaction commit failed (${error.message})` +
      (rollbackErrors.length ? `; rollback failures: ${rollbackErrors.join("; ")}` : "; all applied files were rolled back"));
  }
}

export async function materializeReleaseRuntimeAcquisitionPlans({
  root = PROJECT_ROOT,
  migrationsRoot = path.join(root, "migrations"),
  reportsRoot = path.join(root, "reports"),
  releasesPath = path.join(root, ...RELEASES_RELATIVE.split("/")),
  assetsPath = path.join(root, ...ASSETS_RELATIVE.split("/")),
  materializerPath = SCRIPT_PATH,
  operatorAssignmentReceiptPath = null,
  releaseId,
  shardId = null,
  dryRun = false,
  check = false,
} = {}) {
  validateSafeId(releaseId, "--release-id");
  if (shardId) validateSafeId(shardId, "--shard-id");
  invariant(!(dryRun && check), "--dry-run and --check are mutually exclusive");
  const resolvedOperatorAssignmentReceiptPath = operatorAssignmentReceiptPath
    ? path.resolve(root, operatorAssignmentReceiptPath)
    : null;
  const declarationReceiptPath = releaseId === G4_L10_RELEASE_ID
    ? path.join(root, ...G4_L10_DECLARATION_REPORT_RELATIVE.split("/"))
    : null;
  const wave3ReceiptPath = releaseId === G4_L10_RELEASE_ID
    ? path.join(root, ...G4_L10_WAVE3_REPORT_RELATIVE.split("/"))
    : null;
  const [
    releasesFile,
    assetsFile,
    materializerBytes,
    operatorAssignmentFile,
    declarationReceiptFile,
    wave3ReceiptFile,
  ] = await Promise.all([
    readJsonFile(releasesPath, RELEASES_RELATIVE),
    readJsonFile(assetsPath, ASSETS_RELATIVE),
    readRegularFile(materializerPath, "runtime planning materializer"),
    resolvedOperatorAssignmentReceiptPath
      ? readJsonFile(resolvedOperatorAssignmentReceiptPath, "operator-assignment receipt")
      : null,
    declarationReceiptPath
      ? readJsonFile(
        declarationReceiptPath,
        "independent-domain declaration receipt",
      )
      : null,
    wave3ReceiptPath
      ? readJsonFile(wave3ReceiptPath, "post-declaration wave3 receipt")
      : null,
  ]);
  invariant(assetsFile.value?.schemaVersion === 1 && Array.isArray(assetsFile.value.assets),
    "Asset catalog schema drifted");
  const {release, selectedMembers, selectedShard} = selectRelease(releasesFile.value, releaseId, shardId);
  const operatorAssignment = operatorAssignmentFile
    ? validateOperatorAssignmentReceipt(operatorAssignmentFile.value, releaseId)
    : null;
  const releaseBinding = binding(releasesPath, releasesFile.bytes, root, {
    schemaVersion: releasesFile.value.schemaVersion,
    releaseId: release.releaseId,
    releaseJsonPointer: `/releases/${releasesFile.value.releases.indexOf(release)}`,
    releaseFingerprintSha256: sha256(Buffer.from(stableJson(release))),
  });
  const declarationReceiptBinding = declarationReceiptFile
    ? binding(
      declarationReceiptPath,
      declarationReceiptFile.bytes,
      root,
      {schemaVersion: declarationReceiptFile.value.schemaVersion},
    )
    : null;
  const declarationReceipt = declarationReceiptFile
    ? validateG4L10DeclarationReceipt({
      receipt: declarationReceiptFile.value,
      receiptBinding: declarationReceiptBinding,
      releaseBinding,
    })
    : null;
  const wave3ReceiptBinding = wave3ReceiptFile
    ? binding(
      wave3ReceiptPath,
      wave3ReceiptFile.bytes,
      root,
      {schemaVersion: wave3ReceiptFile.value.schemaVersion},
    )
    : null;
  const wave3Receipt = wave3ReceiptFile
    ? validateG4L10Wave3Receipt({
      receipt: wave3ReceiptFile.value,
      receiptBinding: wave3ReceiptBinding,
      declarationReceiptBinding,
      declarationReceipt,
      releaseBinding,
      release,
    })
    : null;
  const assetBinding = binding(assetsPath, assetsFile.bytes, root, {
    schemaVersion: assetsFile.value.schemaVersion,
  });
  const materializerBinding = {
    path: projectRelative(materializerPath, root),
    version: MATERIALIZER_VERSION,
    sha256: sha256(materializerBytes),
  };
  const operatorAssignmentBinding = operatorAssignmentFile
    ? binding(resolvedOperatorAssignmentReceiptPath, operatorAssignmentFile.bytes, root, {
      schemaVersion: operatorAssignmentFile.value.schemaVersion,
    })
    : null;
  if (operatorAssignmentBinding) {
    invariant(
      operatorAssignmentBinding.path === G5_L4_OPERATOR_ASSIGNMENT_RELATIVE,
      `${releaseId}: operator-assignment receipt path must be ${G5_L4_OPERATOR_ASSIGNMENT_RELATIVE}`,
    );
  }
  const assetMap = new Map();
  for (const asset of assetsFile.value.assets) {
    invariant(!assetMap.has(asset.assetId), `Asset catalog duplicate ${asset.assetId}`);
    assetMap.set(asset.assetId, asset);
  }
  const migrationsRootReal = await realpath(migrationsRoot);
  const sourceRootReal = await realpath(path.join(root, "source-assets"));
  const reportsRootInfo = await lstat(reportsRoot).catch((error) => {
    throw new Error(`Reports root is unavailable (${error.message})`);
  });
  invariant(reportsRootInfo.isDirectory() && !reportsRootInfo.isSymbolicLink(),
    "Reports root must be a real directory");
  const reportsRootReal = await realpath(reportsRoot);
  const plans = [];
  const inputSnapshots = [
    {filePath: releasesPath, bytes: releasesFile.bytes, label: RELEASES_RELATIVE},
    {filePath: assetsPath, bytes: assetsFile.bytes, label: ASSETS_RELATIVE},
    {filePath: materializerPath, bytes: materializerBytes, label: "runtime planning materializer"},
  ];
  if (operatorAssignmentFile) inputSnapshots.push({
    filePath: resolvedOperatorAssignmentReceiptPath,
    bytes: operatorAssignmentFile.bytes,
    label: "operator-assignment receipt",
  });
  if (declarationReceiptFile) inputSnapshots.push({
    filePath: declarationReceiptPath,
    bytes: declarationReceiptFile.bytes,
    label: "independent-domain declaration receipt",
  });
  if (wave3ReceiptFile) inputSnapshots.push({
    filePath: wave3ReceiptPath,
    bytes: wave3ReceiptFile.bytes,
    label: "post-declaration wave3 receipt",
  });

  for (const member of selectedMembers) {
    const workspace = path.join(migrationsRoot, member.animationId);
    const workspaceReal = await validateRealDirectory(workspace, migrationsRootReal, member.animationId);
    const declarationMember =
      declarationReceipt?.memberById.get(member.animationId) || null;
    const wave3Member =
      wave3Receipt?.memberById.get(member.animationId) || null;
    const manifestPath = path.join(workspace, "migration.json");
    const domainsPath = path.join(workspace, "audit", "machine", "swf-frame-domain-candidates.json");
    const dispositionPath = path.join(
      workspace,
      ...SOURCE_PROVEN_DISPOSITION_RELATIVE.split("/"),
    );
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const independentEvidencePath = path.join(
      workspace,
      ...SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH.split("/"),
    );
    const staticCompositeEvidencePath = path.join(
      workspace,
      ...STATIC_COMPOSITE_EVIDENCE_RELATIVE.split("/"),
    );
    const [
      manifestFile,
      domainsFile,
      dispositionFile,
      coverageFile,
      scopeFile,
      independentEvidenceFile,
      staticCompositeEvidenceFile,
    ] = await Promise.all([
      readJsonFile(manifestPath, `${member.animationId} migration.json`),
      readJsonFile(domainsPath, `${member.animationId} frame-domain candidates`),
      readOptionalJsonFile(
        dispositionPath,
        `${member.animationId} source-proven frame-domain disposition`,
      ),
      readJsonFile(coveragePath, `${member.animationId} full-frame coverage`),
      findSourceScopeBinding({workspace, releaseId, member}),
      declarationMember
        ? readJsonFile(
          independentEvidencePath,
          `${member.animationId} independent-domain evidence`,
        )
        : null,
      wave3Member
        ? readJsonFile(
          staticCompositeEvidencePath,
          `${member.animationId} wave3 static-composite evidence`,
        )
        : null,
    ]);
    const manifest = manifestFile.value;
    validateMigrationIdentity({manifest, member});
    validateCatalogAsset({asset: assetMap.get(member.assetId), member, manifest});
    if (scopeFile) validateSourceScopeBinding({binding: scopeFile.value, member, manifest, releaseId});
    const {longer} = validateFrameDomainCandidates({domains: domainsFile.value, member, manifest});
    const independentEvidenceBinding = independentEvidenceFile
      ? binding(
        independentEvidencePath,
        independentEvidenceFile.bytes,
        root,
        {schemaVersion: independentEvidenceFile.value.schemaVersion},
      )
      : null;
    const manifestBinding = binding(
      manifestPath,
      manifestFile.bytes,
      root,
      {schemaVersion: manifest.schemaVersion},
    );
    const dispositionBinding = dispositionFile
      ? binding(dispositionPath, dispositionFile.bytes, root, {
        schemaVersion: dispositionFile.value.schemaVersion,
      })
      : null;
    const staticCompositeEvidenceBinding = staticCompositeEvidenceFile
      ? binding(
        staticCompositeEvidencePath,
        staticCompositeEvidenceFile.bytes,
        root,
        {schemaVersion: staticCompositeEvidenceFile.value.schemaVersion},
      )
      : null;
    if (wave3Receipt) {
      invariant(
        exactDescriptor(
          dispositionBinding,
          wave3Receipt.expectedDispositionById.get(member.animationId),
        ),
        `${member.animationId}: disposition differs from the exact wave3 affected/unchanged partition`,
      );
    }
    const wave3Lineage = wave3Member
      ? validateWave3MemberLineage({
        wave3Member,
        wave3Receipt: wave3ReceiptFile.value,
        declarationReceiptBinding,
        manifest,
        manifestBinding,
        member,
        disposition: dispositionFile.value,
        dispositionBinding,
        staticEvidence: staticCompositeEvidenceFile.value,
        staticEvidenceBinding: staticCompositeEvidenceBinding,
      })
      : null;
    const dispositionSummary = dispositionFile
      ? validateSourceProvenFrameDomainDisposition({
        disposition: dispositionFile.value,
        domains: domainsFile.value,
        manifest,
        member,
        releaseBinding,
        independentEvidence: independentEvidenceFile?.value || null,
        independentEvidenceBinding,
        declarationMember,
        wave3Lineage,
      })
      : null;
    const coverageSummary = validatePendingCoverage({
      coverage: coverageFile.value,
      member,
      manifest,
      dispositionSummary,
    });
    const currentJavascriptCandidate =
      currentJavascriptCandidatePlanning(manifest);
    const source = {
      swf: await verifyPhysicalSource({
        root,
        sourceRootReal,
        descriptor: {
          path: manifest.source.swf,
          sha256: manifest.source.swfSha256,
          bytes: scopeFile?.value?.member?.source?.swf?.bytes ?? assetMap.get(member.assetId).bytes,
        },
        label: `${member.animationId} SWF`,
      }),
      fla: null,
      sourceModel: manifest.source.fla ? "paired-fla-and-shipped-swf" : "shipped-swf-only",
    };
    if (manifest.source.fla) {
      source.fla = await verifyPhysicalSource({
        root,
        sourceRootReal,
        descriptor: {
          path: manifest.source.fla,
          sha256: manifest.source.flaSha256,
          bytes: scopeFile?.value?.member?.source?.fla?.bytes ?? null,
        },
        label: `${member.animationId} FLA`,
      });
    }
    const sourceScopeBinding = scopeFile
      ? binding(scopeFile.filePath, scopeFile.bytes, root, {schemaVersion: scopeFile.value.schemaVersion})
      : null;
    const domainBinding = binding(domainsPath, domainsFile.bytes, root, {schemaVersion: domainsFile.value.schemaVersion});
    const coverageBinding = binding(coveragePath, coverageFile.bytes, root, {schemaVersion: coverageFile.value.schemaVersion});
    const artifact = buildWorkspaceArtifact({
      release,
      member,
      releaseBinding,
      assetBinding,
      materializerBinding,
      manifestBinding,
      sourceScopeBinding,
      domainBinding,
      dispositionBinding,
      independentEvidenceBinding,
      declarationReceiptBinding,
      wave3ReceiptBinding,
      staticCompositeEvidenceBinding,
      coverageBinding,
      operatorAssignmentBinding,
      operatorAssignment,
      manifest,
      source,
      domains: domainsFile.value,
      dispositionSummary,
      coverageSummary,
      currentJavascriptCandidate,
    });
    const artifactBytes = Buffer.from(stableJson(artifact));
    const artifactPath = path.join(workspace, ...WORKSPACE_ARTIFACT_RELATIVE.split("/"));
    await validateOutputTarget(artifactPath, workspaceReal, member.animationId);
    const previousBytes = await readFile(artifactPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    plans.push({
      member,
      source,
      artifact,
      artifactPath,
      artifactRelative: projectRelative(artifactPath, root),
      artifactBytes,
      previousBytes,
      changed: !previousBytes || !previousBytes.equals(artifactBytes),
      rootFrameCount: domainsFile.value.root.frameCount,
      nestedDefinitionCount: domainsFile.value.nestedDefinitions.length,
      nestedLongerThanRootCount: longer,
      sourceProvenDispositionBound: Boolean(dispositionSummary),
      independentDomainDeclarationBound:
        dispositionSummary?.declarationBound ?? false,
      postDeclarationWave3Bound: Boolean(wave3Lineage),
      structuralRootReachableChildCount:
        dispositionSummary?.reachableChildCount ?? null,
      sourceProvenCompositeChildCount:
        dispositionSummary?.composite ?? 0,
      sourceProvenDeclaredChildCount:
        dispositionSummary?.declared ?? 0,
      postDeclarationWave3CompositeCount:
        dispositionSummary?.postDeclarationWave3Composite ?? 0,
      declaredDomainRuntimeEntryUnresolvedCount:
        dispositionSummary?.declared ?? 0,
      independentRequiredChildCount:
        dispositionSummary?.independentRequired ?? 0,
      nonvisualChildCount: dispositionSummary?.nonvisual ?? 0,
      excludedNotProvenNestedDefinitionCount:
        dispositionSummary?.excludedNotProvenCount ?? 0,
      unresolvedRootReachableChildCount:
        dispositionSummary?.unresolved ??
          domainsFile.value.nestedDefinitions.length,
      coverageRequirementCount: coverageSummary.requirementCount,
      rootCoverageRequirementCount:
        coverageSummary.rootRequirementCount,
      nestedCoverageRequirementCount:
        coverageSummary.nestedRequirementCount,
      declaredNestedCoverageRequirementCount:
        coverageSummary.declaredNestedRequirementCount,
      pendingCoverageRequirementCount:
        coverageSummary.pendingRequirementCount,
      blockedCoverageRequirementCount:
        coverageSummary.blockedRequirementCount,
      currentJavascriptCandidate,
    });
    inputSnapshots.push(
      {filePath: manifestPath, bytes: manifestFile.bytes, label: `${member.animationId} migration.json`},
      {filePath: domainsPath, bytes: domainsFile.bytes, label: `${member.animationId} frame-domain candidates`},
      {filePath: coveragePath, bytes: coverageFile.bytes, label: `${member.animationId} full-frame coverage`},
    );
    if (dispositionFile) inputSnapshots.push({
      filePath: dispositionPath,
      bytes: dispositionFile.bytes,
      label: `${member.animationId} source-proven frame-domain disposition`,
    });
    if (independentEvidenceFile) inputSnapshots.push({
      filePath: independentEvidencePath,
      bytes: independentEvidenceFile.bytes,
      label: `${member.animationId} independent-domain evidence`,
    });
    if (staticCompositeEvidenceFile) inputSnapshots.push({
      filePath: staticCompositeEvidencePath,
      bytes: staticCompositeEvidenceFile.bytes,
      label: `${member.animationId} wave3 static-composite evidence`,
    });
    if (scopeFile) inputSnapshots.push({
      filePath: scopeFile.filePath,
      bytes: scopeFile.bytes,
      label: `${member.animationId} source-scope binding`,
    });
    inputSnapshots.push({
      filePath: path.join(root, ...source.swf.path.split("/")),
      byteLength: source.swf.bytes,
      sha256: source.swf.sha256,
      label: `${member.animationId} SWF source`,
    });
    if (source.fla) inputSnapshots.push({
      filePath: path.join(root, ...source.fla.path.split("/")),
      byteLength: source.fla.bytes,
      sha256: source.fla.sha256,
      label: `${member.animationId} FLA source`,
    });
  }

  const sourceScopeCount = plans.filter((plan) => plan.artifact.provenance.sourceScopeBinding).length;
  invariant(sourceScopeCount === 0 || sourceScopeCount === plans.length,
    `${releaseId}: source-scope bindings are only partially present (${sourceScopeCount}/${plans.length})`);
  const sourceProvenDispositionCount = plans.filter(
    (plan) => plan.sourceProvenDispositionBound,
  ).length;
  invariant(
    sourceProvenDispositionCount === 0 ||
      sourceProvenDispositionCount === plans.length,
    `${releaseId}: source-proven frame-domain dispositions are only partially present (${sourceProvenDispositionCount}/${plans.length})`,
  );
  if (declarationReceipt) {
    const selectedDeclarationMembers = selectedMembers.filter((member) =>
      declarationReceipt.memberById.has(member.animationId));
    const declarationBoundPlans = plans.filter(
      (plan) => plan.independentDomainDeclarationBound,
    );
    const expectedDeclaredChildren = selectedDeclarationMembers.reduce(
      (sum, member) => sum + declarationReceipt.memberById
        .get(member.animationId).declaration.frameDomainCount,
      0,
    );
    const declaredChildren = declarationBoundPlans.reduce(
      (sum, plan) => sum + plan.sourceProvenDeclaredChildCount,
      0,
    );
    const declaredRequirements = declarationBoundPlans.reduce(
      (sum, plan) => sum + plan.declaredNestedCoverageRequirementCount,
      0,
    );
    invariant(
      declarationBoundPlans.length === selectedDeclarationMembers.length &&
        declaredChildren === expectedDeclaredChildren &&
        declaredRequirements === expectedDeclaredChildren * 2,
      `${releaseId}: declaration-bound runtime-plan/coverage census drifted`,
    );
    if (!shardId) {
      invariant(
        declarationBoundPlans.length ===
            G4_L10_DECLARATION_AFFECTED_MEMBER_COUNT &&
          declaredChildren === G4_L10_DECLARED_CHILD_COUNT &&
          declaredRequirements === G4_L10_DECLARED_REQUIREMENT_COUNT,
        `${releaseId}: full-release 213-domain/426-requirement successor census drifted`,
      );
    }
  }
  if (wave3Receipt) {
    const selectedWave3Members = selectedMembers.filter((member) =>
      wave3Receipt.memberById.has(member.animationId));
    const wave3Plans = plans.filter(
      (plan) => plan.postDeclarationWave3Bound,
    );
    invariant(
      wave3Plans.length === selectedWave3Members.length &&
        wave3Plans.reduce(
          (sum, plan) =>
            sum + plan.postDeclarationWave3CompositeCount,
          0,
        ) === selectedWave3Members.length,
      `${releaseId}: wave3-bound runtime-plan census drifted`,
    );
    if (!shardId) {
      invariant(
        wave3Plans.length === G4_L10_WAVE3_MEMBER_IDS.length &&
          plans.reduce(
            (sum, plan) => sum + plan.sourceProvenCompositeChildCount,
            0,
          ) === G4_L10_WAVE3_CONTRACT.expected.after.composite &&
          plans.reduce(
            (sum, plan) => sum + plan.unresolvedRootReachableChildCount,
            0,
          ) === G4_L10_WAVE3_CONTRACT.expected.after.unresolved,
        `${releaseId}: full-release wave3 754-composite/74-unresolved successor census drifted`,
      );
    }
  }
  const report = buildReadinessReport({
    release,
    selectedShard,
    releaseBinding,
    assetBinding,
    materializerBinding,
    operatorAssignmentBinding,
    operatorAssignment,
    declarationReceiptBinding,
    wave3ReceiptBinding,
    plans,
  });
  const reportJsonBytes = Buffer.from(stableJson(report));
  const reportMarkdownBytes = Buffer.from(buildReadinessMarkdown(report));
  const baseName = reportBaseName(releaseId, shardId);
  const reportJsonPath = path.join(reportsRoot, `${baseName}.json`);
  const reportMarkdownPath = path.join(reportsRoot, `${baseName}.md`);
  await validateOutputTarget(reportJsonPath, reportsRootReal, "JSON readiness report");
  await validateOutputTarget(reportMarkdownPath, reportsRootReal, "Markdown readiness report");
  const [previousJson, previousMarkdown] = await Promise.all([
    readFile(reportJsonPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(reportMarkdownPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error)),
  ]);
  const operations = plans.filter((plan) => plan.changed).map((plan) => ({
    filePath: plan.artifactPath,
    nextBytes: plan.artifactBytes,
    previousBytes: plan.previousBytes,
  }));
  if (!previousJson || !previousJson.equals(reportJsonBytes)) operations.push({
    filePath: reportJsonPath,
    nextBytes: reportJsonBytes,
    previousBytes: previousJson,
  });
  if (!previousMarkdown || !previousMarkdown.equals(reportMarkdownBytes)) operations.push({
    filePath: reportMarkdownPath,
    nextBytes: reportMarkdownBytes,
    previousBytes: previousMarkdown,
  });
  if (check && operations.length) {
    throw new Error(`${releaseId}${shardId ? `/${shardId}` : ""}: runtime planning artifacts or reports are stale (${operations.length} file(s))`);
  }
  if (!check && !dryRun) await writeTransaction(operations, inputSnapshots);
  return {
    mode: check ? "check" : dryRun ? "dry-run" : "write",
    releaseId,
    shardId,
    members: plans.length,
    workspaceArtifactChanges: plans.filter((plan) => plan.changed).length,
    totalFileChanges: operations.length,
    sourceScopeBindings: sourceScopeCount,
    summary: report.summary,
    artifactSetSha256: sha256(Buffer.from(plans.map((plan) => plan.artifact.artifactFingerprintSha256).join("\n"))),
    report: {
      json: projectRelative(reportJsonPath, root),
      markdown: projectRelative(reportMarkdownPath, root),
      fingerprintSha256: report.reportFingerprintSha256,
    },
    runtimeSessionsExecuted: 0,
    acceptanceChanges: 0,
    canonicalChanges: 0,
    results: plans.map((plan) => ({
      animationId: plan.member.animationId,
      action: plan.changed ? (check ? "stale" : dryRun ? "would-write" : "wrote") : "up-to-date",
      artifactFingerprintSha256: plan.artifact.artifactFingerprintSha256,
    })),
  };
}

export function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--release-id") options.releaseId = argv[++index];
    else if (argument === "--shard-id") options.shardId = argv[++index];
    else if (argument === "--operator-assignment-receipt") {
      options.operatorAssignmentReceiptPath = argv[++index];
      invariant(options.operatorAssignmentReceiptPath, "--operator-assignment-receipt requires a path");
    }
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.help) validateSafeId(options.releaseId, "--release-id");
  if (options.shardId) validateSafeId(options.shardId, "--shard-id");
  invariant(!(options.dryRun && options.check), "--dry-run and --check are mutually exclusive");
  return options;
}

function usage() {
  return [
    "Usage: node scripts/materialize-release-runtime-acquisition-plans.mjs --release-id <id> [--shard-id <id>] [--operator-assignment-receipt <path>] [--dry-run | --check]",
    "",
    `Writes only ${WORKSPACE_ARTIFACT_RELATIVE} for the exact selected release members,`,
    "plus deterministic aggregate JSON/Markdown readiness reports. It launches no tool or runtime and",
    "creates no trace, action, capture, baseline, PNG, signature, review, acceptance, status, ledger,",
    "canonical coverage, source, or publication evidence.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeReleaseRuntimeAcquisitionPlans(options);
  const label = result.mode === "check" ? "PASS" : result.mode === "dry-run" ? "DRY-RUN" : "WROTE";
  process.stdout.write(`${label}: ${result.members} ${result.releaseId}${result.shardId ? `/${result.shardId}` : ""} ` +
    `workspace planning artifacts; ${result.totalFileChanges} file change(s); ` +
    `root frames ${result.summary.structuralRootFrameCount} structural-only; ` +
    `nested candidates ${result.summary.structuralNestedDefinitionCount}; ` +
    `source-proven root-reachable ${result.summary.structuralRootReachableChildCount}; ` +
    `declared ${result.summary.sourceProvenDeclaredChildCount} with ${result.summary.sourceProvenDeclaredBlockedRequirementCount} blocked requirements; ` +
    `composite ${result.summary.sourceProvenCompositeChildCount} including wave3 ${result.summary.postDeclarationWave3CompositeCount}; ` +
    `unresolved ${result.summary.unresolvedNestedReachabilityCount}; ` +
    `runtime sessions 0; canonical/acceptance effect none; set ${result.artifactSetSha256}.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
