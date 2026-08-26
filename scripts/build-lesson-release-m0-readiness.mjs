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
const G5_L4_CANONICAL_ENGINEERING_CANDIDATE_COUNT = 52;
const defaults = {
  releases: "catalog/lesson-releases.json",
  governance: "catalog/lesson-release-m0-governance.json",
};
const G5_L4_INTAKE_RELEASE_MANIFEST_SHA256 =
  "ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375";
const G5_L4_RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const G5_L4_OWNER_STATEMENTS = [
  "1. 我批准：Owner 四项正式决定及路线签认；\n2. 这个是什么：六个 primary、六个 backup 具名角色与容量",
  "这些信息都是Dr. Peter Hu, 各1小时/周\n\n下面采用默认值：\n\n人员费率上限：\n项目总预算：\n采购/付款周期：",
];
const G5_L4_OWNER_DECISIONS = [
  {
    decisionId: "release-membership-and-exclusions-review",
    directive: "approved-current-55-member-scope-and-ten-item-exclusion-disposition",
    m0RequirementSatisfied: true,
  },
  {
    decisionId: "source-gap-fail-closed-dispositions-review",
    directive: "approved-current-fail-closed-source-gap-dispositions-without-claiming-recovery",
    m0RequirementSatisfied: true,
  },
  {
    decisionId: "staffing-capacity-and-backups-review",
    directive: "approved-all-twelve-role-slot-intents-as-dr-peter-hu-at-one-hour-per-week-each",
    m0RequirementSatisfied: false,
  },
  {
    decisionId: "rates-budget-envelope-and-procurement-cycle-review",
    directive: "use-repository-defaults-fail-closed-because-no-numeric-or-cycle-defaults-exist",
    m0RequirementSatisfied: false,
  },
];
const G5_L4_ROLE_REQUIREMENTS = [
  ["authorized-original-runtime-operator", 20, 8],
  ["mathematics-reviewer", 8, null],
  ["spanish-reviewer", 8, null],
  ["audio-reviewer", 8, null],
  ["independent-visual-reviewer", 8, null],
  ["owner-approver", 4, null],
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
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

function resolveProjectPath(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label} must be project-relative and portable`);
  const absolute = path.resolve(projectRoot, relativePath);
  const normalized = portable(path.relative(projectRoot, absolute));
  invariant(normalized && normalized !== ".." && !normalized.startsWith("../"), `${label} escapes the project root`);
  invariant(normalized === relativePath, `${label} must be normalized as ${normalized}`);
  return absolute;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be an ordinary file`);
  invariant(metadata.nlink === 1, `${label} must not be hard-linked`);
}

async function fileBinding(relativePath, label) {
  const absolute = resolveProjectPath(relativePath, label);
  await assertOrdinaryFile(absolute, label);
  const bytes = await readFile(absolute);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), value: bytes};
}

async function jsonBinding(relativePath, label) {
  const binding = await fileBinding(relativePath, label);
  return {...binding, value: JSON.parse(binding.value.toString("utf8"))};
}

function descriptor(binding) {
  const {value, ...result} = binding;
  return result;
}

function assertExactKeys(value, expectedKeys, label) {
  invariant(isObject(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(expected), `${label} keys must be exactly ${expected.join(", ")}`);
}

function assertFileDescriptor(value, label) {
  assertExactKeys(value, ["path", "bytes", "sha256"], label);
  resolveProjectPath(value.path, `${label} path`);
  invariant(Number.isInteger(value.bytes) && value.bytes > 0, `${label} bytes must be a positive integer`);
  invariant(/^[a-f0-9]{64}$/.test(value.sha256 || ""), `${label} SHA-256 is invalid`);
}

function assertSameFileDescriptor(actual, expected, label) {
  assertFileDescriptor(actual, label);
  invariant(
    actual.path === expected.path &&
      actual.bytes === expected.bytes &&
      actual.sha256 === expected.sha256,
    `${label} descriptor drifted`,
  );
}

function selectRelease(manifest, releaseId) {
  invariant(manifest?.schemaVersion === 1 && Array.isArray(manifest.releases), "lesson release manifest is malformed");
  const matches = manifest.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, `expected one lesson release ${releaseId}, found ${matches.length}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: publicationMode must remain atomic`);
  invariant(release.members?.length === release.expectedCounts?.members, `${releaseId}: release member count is incomplete`);
  invariant(release.members.every((member, index) => member.ordinal === index + 1), `${releaseId}: release ordinals are not contiguous`);
  if (releaseId === "lesson-g05-l04-number-lines") {
    invariant(
      sha256(Buffer.from(stableJson(release))) ===
        G5_L4_RELEASE_FINGERPRINT_SHA256,
      `${releaseId}: current release fingerprint drifted from the intake-equivalent scope`,
    );
  }
  return release;
}

export function selectGovernance(catalog, releaseId) {
  invariant(catalog?.schemaVersion === 4 && Array.isArray(catalog.releases), "M0 governance catalog is malformed");
  const matches = catalog.releases.filter((entry) => entry?.releaseId === releaseId);
  invariant(matches.length === 1, `expected one M0 governance entry for ${releaseId}, found ${matches.length}`);
  const governance = matches[0];
  assertExactKeys(governance, [
    "releaseId",
    "calendar",
    "roadmap",
    "m1AuthorizationReceipt",
    "staffingCapacityReceipt",
    "machinePacket",
    "requiredOwnerDecisions",
    "requiredRoles",
    "budgetDecision",
    "independenceRules",
  ], `${releaseId}: governance entry`);
  assertExactKeys(governance.calendar, ["m0Start", "m0End", "m1Start", "m1End"], `${releaseId}: governance calendar`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(governance.calendar?.m0Start || ""), `${releaseId}: invalid M0 start date`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(governance.calendar?.m0End || ""), `${releaseId}: invalid M0 end date`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(governance.calendar?.m1Start || ""), `${releaseId}: invalid M1 start date`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(governance.calendar?.m1End || ""), `${releaseId}: invalid M1 end date`);
  assertExactKeys(governance.roadmap, ["path", "sha256", "formalOwnerSignoffReceipt"], `${releaseId}: roadmap`);
  resolveProjectPath(governance.roadmap.path, `${releaseId}: roadmap path`);
  invariant(/^[a-f0-9]{64}$/.test(governance.roadmap.sha256 || ""), `${releaseId}: roadmap binding is incomplete`);
  assertFileDescriptor(governance.roadmap.formalOwnerSignoffReceipt, `${releaseId}: roadmap signoff-intent receipt`);
  assertFileDescriptor(governance.m1AuthorizationReceipt, `${releaseId}: M1 authorization receipt`);
  assertFileDescriptor(governance.staffingCapacityReceipt, `${releaseId}: staffing-capacity receipt`);
  assertSameFileDescriptor(
    governance.roadmap.formalOwnerSignoffReceipt,
    governance.staffingCapacityReceipt,
    `${releaseId}: consolidated roadmap/staffing receipt`,
  );
  invariant(isObject(governance.machinePacket), `${releaseId}: machine packet is missing`);
  const requiredPacketKeys = [
    "sourceScopeFreeze",
    "sourceGapForensics",
    "workspaceReadiness",
    "audioOwnershipReadiness",
    "animateOperatorReadiness",
    "runtimeAcquisitionPlanning",
    "riskCalibration",
    "promotionSecurityReadiness",
  ];
  assertExactKeys(governance.machinePacket, requiredPacketKeys, `${releaseId}: machine packet`);
  invariant(
    requiredPacketKeys.every((key) => typeof governance.machinePacket[key] === "string"),
    `${releaseId}: machine packet paths are incomplete`,
  );
  invariant(
    Array.isArray(governance.requiredOwnerDecisions) &&
      governance.requiredOwnerDecisions.length === G5_L4_OWNER_DECISIONS.length,
    `${releaseId}: Owner decisions are incomplete`,
  );
  for (const [index, expected] of G5_L4_OWNER_DECISIONS.entries()) {
    const decision = governance.requiredOwnerDecisions[index];
    assertExactKeys(decision, ["decisionId", "receipt"], `${releaseId}: Owner decision ${index + 1}`);
    invariant(decision.decisionId === expected.decisionId, `${releaseId}: Owner decision order or identity drifted`);
    assertSameFileDescriptor(
      decision.receipt,
      governance.staffingCapacityReceipt,
      `${releaseId}: ${decision.decisionId} receipt`,
    );
  }
  invariant(
    Array.isArray(governance.requiredRoles) &&
      governance.requiredRoles.length === G5_L4_ROLE_REQUIREMENTS.length,
    `${releaseId}: required role set is incomplete`,
  );
  for (const [index, [roleId, primaryFloor, backupFloor]] of G5_L4_ROLE_REQUIREMENTS.entries()) {
    const role = governance.requiredRoles[index];
    assertExactKeys(role, [
      "roleId",
      "minimumPrimaryHoursPerWeek",
      "minimumBackupHoursPerWeek",
      "primaryAssignmentReceipt",
      "backupAssignmentReceipt",
    ], `${releaseId}: role ${roleId}`);
    invariant(role.roleId === roleId, `${releaseId}: required role order or identity drifted`);
    invariant(role.minimumPrimaryHoursPerWeek === primaryFloor, `${roleId}: primary hour floor drifted`);
    invariant(role.minimumBackupHoursPerWeek === backupFloor, `${roleId}: backup hour floor drifted`);
    assertFileDescriptor(role.primaryAssignmentReceipt, `${roleId}: primary assignment receipt`);
    assertFileDescriptor(role.backupAssignmentReceipt, `${roleId}: backup assignment receipt`);
    if (roleId === "authorized-original-runtime-operator") {
      invariant(
        role.primaryAssignmentReceipt.path !== governance.staffingCapacityReceipt.path,
        `${roleId}: historical primary operator receipt must remain independently bound`,
      );
    } else {
      assertSameFileDescriptor(
        role.primaryAssignmentReceipt,
        governance.staffingCapacityReceipt,
        `${roleId}: primary assignment receipt`,
      );
    }
    assertSameFileDescriptor(
      role.backupAssignmentReceipt,
      governance.staffingCapacityReceipt,
      `${roleId}: backup assignment receipt`,
    );
  }
  assertExactKeys(governance.budgetDecision, [
    "currency",
    "ownerSelectedRepositoryDefaults",
    "repositoryDefinedNumericOrCycleDefaultsFound",
    "personnelRateCeilingUsdPerHour",
    "totalBudgetEnvelopeUsd",
    "procurementPaymentCycle",
    "defaultDisposition",
    "rateCeilingsApproved",
    "totalBudgetEnvelopeApproved",
    "procurementCycleApproved",
    "ownerDirectiveReceipt",
    "signedReceipt",
  ], `${releaseId}: budget decision`);
  invariant(
    governance.budgetDecision.currency === "USD" &&
    governance.budgetDecision.ownerSelectedRepositoryDefaults === true &&
    governance.budgetDecision.repositoryDefinedNumericOrCycleDefaultsFound === false &&
    governance.budgetDecision.personnelRateCeilingUsdPerHour === null &&
    governance.budgetDecision.totalBudgetEnvelopeUsd === null &&
    governance.budgetDecision.procurementPaymentCycle === null &&
    governance.budgetDecision.defaultDisposition ===
      "fail-closed-unset-no-spend-procurement-or-payment-authority" &&
    governance.budgetDecision.rateCeilingsApproved === false &&
    governance.budgetDecision.totalBudgetEnvelopeApproved === false &&
    governance.budgetDecision.procurementCycleApproved === false &&
    governance.budgetDecision.signedReceipt === null,
    `${releaseId}: budget defaults must remain fail-closed and cannot claim approval`,
  );
  assertSameFileDescriptor(
    governance.budgetDecision.ownerDirectiveReceipt,
    governance.staffingCapacityReceipt,
    `${releaseId}: budget-default Owner directive receipt`,
  );
  invariant(Array.isArray(governance.independenceRules) && governance.independenceRules.length > 0, `${releaseId}: independence rules are missing`);
  return governance;
}

export function validateM1AuthorizationReceipt({
  receipt,
  receiptBinding,
  releaseId,
  governance,
  releaseBinding,
  sourceScopeBinding,
}) {
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
    "identity",
    "authorization",
    "sourceBindingsAtIntake",
    "externalSignatureEnvelope",
    "authorityBoundary",
  ], `${releaseId}: M1 authorization receipt`);
  invariant(receipt.schemaVersion === 1, `${releaseId}: unsupported M1 authorization receipt schema`);
  invariant(receipt.evidenceType === "g5-l4-user-stated-owner-m1-authorization-intake", `${releaseId}: unexpected M1 authorization evidence type`);
  invariant(receipt.releaseId === releaseId, `${releaseId}: M1 authorization receipt belongs to ${receipt.releaseId || "no release"}`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(receipt.receivedOn || ""), `${releaseId}: invalid M1 authorization receivedOn`);
  const recordedAtMs = Date.parse(receipt.recordedAt);
  invariant(
    typeof receipt.recordedAt === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(receipt.recordedAt) &&
      Number.isFinite(recordedAtMs) &&
      receipt.recordedAt.startsWith(`${receipt.receivedOn}T`),
    `${releaseId}: invalid M1 authorization recordedAt`,
  );
  invariant(receipt.channel === "current-codex-task", `${releaseId}: M1 authorization channel is not the current Codex task`);
  invariant(/^[a-f0-9-]{36}$/.test(receipt.taskThreadId || ""), `${releaseId}: invalid M1 authorization task thread ID`);
  invariant(receipt.statementLanguage === "zh-CN", `${releaseId}: unexpected M1 authorization statement language`);

  assertExactKeys(receipt.ownerStatement, ["exactUtf8", "byteLength", "sha256"], `${releaseId}: Owner statement`);
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8 || "", "utf8");
  invariant(statementBytes.length === receipt.ownerStatement.byteLength, `${releaseId}: Owner statement byte length drifted`);
  invariant(sha256(statementBytes) === receipt.ownerStatement.sha256, `${releaseId}: Owner statement SHA-256 drifted`);
  const statementMatch = /^Owner是(.+)\n\n明确授权 M1$/.exec(receipt.ownerStatement.exactUtf8);
  invariant(statementMatch, `${releaseId}: Owner statement does not exactly identify the Owner and explicitly authorize M1`);

  assertExactKeys(receipt.identity, ["ownerFullName", "ownerRole", "externalSubjectId"], `${releaseId}: Owner identity`);
  invariant(receipt.identity.ownerFullName === statementMatch[1], `${releaseId}: Owner identity does not match the exact statement`);
  invariant(receipt.identity.ownerRole === "Owner", `${releaseId}: Owner role is not explicit`);
  invariant(receipt.identity.externalSubjectId === null, `${releaseId}: unverified external subject identity must remain null`);

  assertExactKeys(receipt.authorization, ["phase", "track", "explicit", "scope"], `${releaseId}: M1 authorization`);
  invariant(receipt.authorization.phase === "M1", `${releaseId}: authorization is not for M1`);
  invariant(receipt.authorization.track === "G5 L4 fidelity track", `${releaseId}: authorization is not scoped to the G5 L4 fidelity track`);
  invariant(receipt.authorization.explicit === true, `${releaseId}: M1 authorization is not explicit`);
  const allowedScopes = new Set([
    "g5-l4-scaffold-and-machine-audit",
    "g5-l4-frame-domain-and-audio-inventory",
    "g5-l4-representative-time-study-preparation-subject-to-separate-human-runtime-and-acceptance-controls",
  ]);
  invariant(
    Array.isArray(receipt.authorization.scope) &&
      receipt.authorization.scope.length === allowedScopes.size &&
      new Set(receipt.authorization.scope).size === receipt.authorization.scope.length &&
      receipt.authorization.scope.every((scope) => allowedScopes.has(scope)),
    `${releaseId}: M1 authorization scope is incomplete or exceeds the machine-only allowlist`,
  );

  assertExactKeys(receipt.sourceBindingsAtIntake, [
    "roadmap",
    "releaseManifest",
    "sourceScopeFreeze",
  ], `${releaseId}: M1 authorization source bindings`);
  for (const [key, binding] of Object.entries(receipt.sourceBindingsAtIntake)) {
    assertExactKeys(binding, ["path", "sha256"], `${releaseId}: M1 authorization ${key} binding`);
    resolveProjectPath(binding.path, `${releaseId}: M1 authorization ${key} path`);
    invariant(/^[a-f0-9]{64}$/.test(binding.sha256 || ""), `${releaseId}: M1 authorization ${key} SHA-256 is invalid`);
  }
  invariant(
    receipt.sourceBindingsAtIntake.roadmap.path === governance.roadmap.path &&
      receipt.sourceBindingsAtIntake.roadmap.sha256 === governance.roadmap.sha256,
    `${releaseId}: M1 authorization roadmap binding does not match governance`,
  );
  invariant(
    receipt.sourceBindingsAtIntake.releaseManifest.path === releaseBinding.path &&
      receipt.sourceBindingsAtIntake.releaseManifest.sha256 ===
        G5_L4_INTAKE_RELEASE_MANIFEST_SHA256,
    `${releaseId}: M1 authorization historical release-manifest intake binding drifted`,
  );
  invariant(
    receipt.sourceBindingsAtIntake.sourceScopeFreeze.path === sourceScopeBinding.path &&
      receipt.sourceBindingsAtIntake.sourceScopeFreeze.sha256 === sourceScopeBinding.sha256,
    `${releaseId}: M1 authorization source-scope binding drifted`,
  );
  invariant(receipt.externalSignatureEnvelope === null, `${releaseId}: this intake cannot claim an external signature envelope`);

  assertExactKeys(receipt.authorityBoundary, [
    "ownerIdentityUserAttested",
    "ownerIdentityCryptographicallyVerified",
    "ownerM1IntentRecorded",
    "machineOnlyM1FidelityTrancheAuthorized",
    "formalRoadmapSignoffEstablished",
    "m0ExitEstablished",
    "requiredOwnerDecisionsSatisfied",
    "namedHumanRoleAssignmentsEstablished",
    "budgetGatesApproved",
    "animateGuiExecutionAuthorizedByThisIntakeAlone",
    "originalRuntimeExecutionAuthorizedByThisIntakeAlone",
    "rendererImplementationAuthorizedByThisIntakeAlone",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
    "strictAcceptanceEffect",
  ], `${releaseId}: M1 authorization authority boundary`);
  invariant(receipt.authorityBoundary.ownerIdentityUserAttested === true, `${releaseId}: Owner identity is not user-attested`);
  invariant(receipt.authorityBoundary.ownerIdentityCryptographicallyVerified === false, `${releaseId}: intake must not claim cryptographic identity verification`);
  invariant(receipt.authorityBoundary.ownerM1IntentRecorded === true, `${releaseId}: Owner M1 intent is not recorded`);
  invariant(receipt.authorityBoundary.machineOnlyM1FidelityTrancheAuthorized === true, `${releaseId}: machine-only M1 tranche is not authorized`);
  for (const field of [
    "formalRoadmapSignoffEstablished",
    "m0ExitEstablished",
    "animateGuiExecutionAuthorizedByThisIntakeAlone",
    "originalRuntimeExecutionAuthorizedByThisIntakeAlone",
    "rendererImplementationAuthorizedByThisIntakeAlone",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ]) {
    invariant(receipt.authorityBoundary[field] === false, `${releaseId}: M1 intake crossed the ${field} boundary`);
  }
  invariant(
    receipt.authorityBoundary.requiredOwnerDecisionsSatisfied === 0 &&
      receipt.authorityBoundary.namedHumanRoleAssignmentsEstablished === 0 &&
      receipt.authorityBoundary.budgetGatesApproved === 0,
    `${releaseId}: M1 intake filled an unverified Owner, role, or budget gate`,
  );
  invariant(receipt.authorityBoundary.strictAcceptanceEffect === "m1-start-only", `${releaseId}: M1 intake acceptance effect is too broad`);

  assertFileDescriptor(governance.m1AuthorizationReceipt, `${releaseId}: governance M1 authorization receipt`);
  invariant(
    governance.m1AuthorizationReceipt.path === receiptBinding.path &&
      governance.m1AuthorizationReceipt.bytes === receiptBinding.bytes &&
      governance.m1AuthorizationReceipt.sha256 === receiptBinding.sha256,
    `${releaseId}: governance M1 authorization receipt descriptor drifted`,
  );

  return {
    status: "authorized-with-open-m0-human-budget-and-runtime-controls",
    authorizedPhase: receipt.authorization.phase,
    track: receipt.authorization.track,
    owner: {
      fullName: receipt.identity.ownerFullName,
      role: receipt.identity.ownerRole,
      identityEvidence: "user-attested-current-codex-task",
      cryptographicallyVerified: false,
    },
    statement: {
      language: receipt.statementLanguage,
      byteLength: receipt.ownerStatement.byteLength,
      sha256: receipt.ownerStatement.sha256,
    },
    scope: receipt.authorization.scope,
    receipt: descriptor(receiptBinding),
    machineOnly: true,
    m0ExitEstablished: false,
    implementationAuthorized: false,
    originalRuntimeAuthorized: false,
    animateGuiAuthorized: false,
    fidelityAcceptanceEstablished: false,
    strictCompletionEstablished: false,
    publicationAuthorized: false,
  };
}

export function validateOriginalRuntimeOperatorAssignmentReceipt({
  receipt,
  receiptBinding,
  releaseId,
  governance,
  releaseBinding,
  sourceScopeBinding,
  m1AuthorizationBinding,
  m1AuthorizationReceipt,
}) {
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
  ], `${releaseId}: original-runtime operator assignment receipt`);
  invariant(receipt.schemaVersion === 1, `${releaseId}: unsupported operator assignment receipt schema`);
  invariant(
    receipt.evidenceType === "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake",
    `${releaseId}: unexpected operator assignment evidence type`,
  );
  invariant(receipt.releaseId === releaseId, `${releaseId}: operator assignment belongs to ${receipt.releaseId || "no release"}`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(receipt.receivedOn || ""), `${releaseId}: invalid operator assignment receivedOn`);
  const recordedAtMs = Date.parse(receipt.recordedAt);
  invariant(
    typeof receipt.recordedAt === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(receipt.recordedAt) &&
      Number.isFinite(recordedAtMs) &&
      receipt.recordedAt.startsWith(`${receipt.receivedOn}T`),
    `${releaseId}: invalid operator assignment recordedAt`,
  );
  invariant(receipt.channel === "current-codex-task", `${releaseId}: operator assignment channel is not the current Codex task`);
  invariant(receipt.taskThreadId === m1AuthorizationReceipt.taskThreadId, `${releaseId}: operator assignment task thread drifted`);
  invariant(receipt.statementLanguage === "zh-CN", `${releaseId}: unexpected operator assignment statement language`);

  assertExactKeys(receipt.ownerStatement, ["exactUtf8", "byteLength", "sha256"], `${releaseId}: operator assignment statement`);
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8 || "", "utf8");
  invariant(statementBytes.length === receipt.ownerStatement.byteLength, `${releaseId}: operator statement byte length drifted`);
  invariant(sha256(statementBytes) === receipt.ownerStatement.sha256, `${releaseId}: operator statement SHA-256 drifted`);
  const statementMatch = /^原始运行时／Animate 的具名人工操作员是(.+)$/.exec(receipt.ownerStatement.exactUtf8);
  invariant(statementMatch, `${releaseId}: statement does not exactly assign the original-runtime/Animate operator`);

  assertExactKeys(receipt.assigningAuthority, ["ownerFullName", "ownerRole", "externalSubjectId"], `${releaseId}: assigning authority`);
  invariant(
    receipt.assigningAuthority.ownerFullName === m1AuthorizationReceipt.identity.ownerFullName &&
      receipt.assigningAuthority.ownerFullName === "Dr. Peter Hu",
    `${releaseId}: assigning authority does not match the user-attested Owner`,
  );
  invariant(receipt.assigningAuthority.ownerRole === "Owner", `${releaseId}: assigning authority is not Owner`);
  invariant(receipt.assigningAuthority.externalSubjectId === null, `${releaseId}: unverified external subject identity must remain null`);

  assertExactKeys(receipt.assignment, [
    "roleId",
    "slot",
    "assigneeFullName",
    "samePersonAsOwner",
    "explicit",
    "duties",
  ], `${releaseId}: operator assignment`);
  invariant(receipt.assignment.roleId === "authorized-original-runtime-operator", `${releaseId}: wrong assigned role`);
  invariant(receipt.assignment.slot === "primary", `${releaseId}: only the primary operator slot is assigned`);
  invariant(receipt.assignment.assigneeFullName === statementMatch[1], `${releaseId}: assignee does not match the exact statement`);
  invariant(receipt.assignment.assigneeFullName === receipt.assigningAuthority.ownerFullName, `${releaseId}: self-assignment identity is inconsistent`);
  invariant(receipt.assignment.samePersonAsOwner === true && receipt.assignment.explicit === true, `${releaseId}: operator assignment is not explicit`);
  const expectedDuties = new Set([
    "authorized-original-runtime-human-operator",
    "adobe-animate-human-dialog-operator",
  ]);
  invariant(
    Array.isArray(receipt.assignment.duties) &&
      receipt.assignment.duties.length === expectedDuties.size &&
      new Set(receipt.assignment.duties).size === receipt.assignment.duties.length &&
      receipt.assignment.duties.every((duty) => expectedDuties.has(duty)),
    `${releaseId}: operator duties are incomplete or exceed the role assignment`,
  );

  assertExactKeys(receipt.capacity, [
    "minimumRequiredHoursPerWeek",
    "committedHoursPerWeek",
    "status",
  ], `${releaseId}: operator capacity`);
  const operatorRole = governance.requiredRoles.find(({roleId}) => roleId === receipt.assignment.roleId);
  invariant(operatorRole, `${releaseId}: governance has no original-runtime operator role`);
  invariant(
    receipt.capacity.minimumRequiredHoursPerWeek === operatorRole.minimumPrimaryHoursPerWeek,
    `${releaseId}: operator capacity floor drifted`,
  );
  invariant(
    receipt.capacity.committedHoursPerWeek === null && receipt.capacity.status === "not-stated",
    `${releaseId}: statement cannot establish an unstated weekly capacity commitment`,
  );

  assertExactKeys(receipt.sourceBindingsAtIntake, [
    "m1OwnerAuthorization",
    "releaseManifest",
    "sourceScopeFreeze",
  ], `${releaseId}: operator assignment source bindings`);
  for (const [key, binding] of Object.entries(receipt.sourceBindingsAtIntake)) {
    assertExactKeys(binding, ["path", "sha256"], `${releaseId}: operator assignment ${key} binding`);
    resolveProjectPath(binding.path, `${releaseId}: operator assignment ${key} path`);
    invariant(/^[a-f0-9]{64}$/.test(binding.sha256 || ""), `${releaseId}: operator assignment ${key} SHA-256 is invalid`);
  }
  invariant(
    receipt.sourceBindingsAtIntake.m1OwnerAuthorization.path === m1AuthorizationBinding.path &&
      receipt.sourceBindingsAtIntake.m1OwnerAuthorization.sha256 === m1AuthorizationBinding.sha256,
    `${releaseId}: operator assignment M1 Owner authorization binding drifted`,
  );
  invariant(
    receipt.sourceBindingsAtIntake.releaseManifest.path === releaseBinding.path &&
      receipt.sourceBindingsAtIntake.releaseManifest.sha256 ===
        G5_L4_INTAKE_RELEASE_MANIFEST_SHA256,
    `${releaseId}: operator assignment historical release-manifest intake binding drifted`,
  );
  invariant(
    receipt.sourceBindingsAtIntake.sourceScopeFreeze.path === sourceScopeBinding.path &&
      receipt.sourceBindingsAtIntake.sourceScopeFreeze.sha256 === sourceScopeBinding.sha256,
    `${releaseId}: operator assignment source-scope binding drifted`,
  );
  invariant(receipt.externalSignatureEnvelope === null, `${releaseId}: operator intake cannot claim an external signature envelope`);

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
  ], `${releaseId}: operator assignment authority boundary`);
  invariant(receipt.authorityBoundary.assignmentUserAttested === true, `${releaseId}: operator assignment is not user-attested`);
  invariant(receipt.authorityBoundary.assigneeIdentityCryptographicallyVerified === false, `${releaseId}: intake invented cryptographic identity verification`);
  invariant(receipt.authorityBoundary.namedHumanRoleAssignmentEstablished === true, `${releaseId}: named operator role was not established`);
  invariant(receipt.authorityBoundary.namedRoleSlotCountEffect === 1, `${releaseId}: operator role count effect must be exactly one`);
  for (const field of [
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
  ]) {
    invariant(receipt.authorityBoundary[field] === false, `${releaseId}: operator intake crossed the ${field} boundary`);
  }
  invariant(
    receipt.authorityBoundary.strictAcceptanceEffect === "named-primary-operator-role-only",
    `${releaseId}: operator assignment acceptance effect is too broad`,
  );

  assertFileDescriptor(operatorRole.primaryAssignmentReceipt, `${releaseId}: governance primary operator receipt`);
  invariant(
    operatorRole.primaryAssignmentReceipt.path === receiptBinding.path &&
      operatorRole.primaryAssignmentReceipt.bytes === receiptBinding.bytes &&
      operatorRole.primaryAssignmentReceipt.sha256 === receiptBinding.sha256,
    `${releaseId}: governance primary operator receipt descriptor drifted`,
  );

  return {
    status: "named-primary-operator-user-attested-capacity-host-session-and-execution-controls-open",
    roleId: receipt.assignment.roleId,
    slot: receipt.assignment.slot,
    assignee: {
      fullName: receipt.assignment.assigneeFullName,
      identityEvidence: "user-attested-current-codex-task",
      cryptographicallyVerified: false,
      samePersonAsOwner: true,
    },
    duties: receipt.assignment.duties,
    capacity: {
      minimumRequiredHoursPerWeek: receipt.capacity.minimumRequiredHoursPerWeek,
      committedHoursPerWeek: null,
      established: false,
    },
    receipt: descriptor(receiptBinding),
    runtimeHostApproved: false,
    containmentApproved: false,
    immutableSessionAuthorizationEstablished: false,
    animateGuiAuthorized: false,
    originalRuntimeAuthorized: false,
    actualAnimateExecutionEstablished: false,
    actualOriginalRuntimeSessionEstablished: false,
    strictAcceptanceEffect: "named-primary-operator-role-only",
  };
}

export function validateM0OwnerGovernanceReceipt({
  receipt,
  receiptBinding,
  releaseId,
  governance,
  roadmapBinding,
  releaseBinding,
  sourceScopeBinding,
  sourceGapBinding,
  m1AuthorizationBinding,
  m1AuthorizationReceipt,
  operatorAssignmentBinding,
  operatorAssignmentReceipt,
}) {
  assertExactKeys(receipt, [
    "schemaVersion",
    "evidenceType",
    "releaseId",
    "receivedOn",
    "recordedAt",
    "channel",
    "taskThreadId",
    "statementLanguage",
    "ownerStatements",
    "ownerIdentity",
    "roadmapSignoff",
    "ownerDecisions",
    "staffingCapacity",
    "budgetDefaultSelection",
    "sourceBindingsAtIntake",
    "externalSignatureEnvelope",
    "authorityBoundary",
  ], `${releaseId}: consolidated M0 Owner-governance receipt`);
  invariant(receipt.schemaVersion === 1, `${releaseId}: unsupported consolidated M0 receipt schema`);
  invariant(
    receipt.evidenceType === "g5-l4-user-stated-owner-m0-governance-intake",
    `${releaseId}: unexpected consolidated M0 receipt evidence type`,
  );
  invariant(receipt.releaseId === releaseId, `${releaseId}: consolidated M0 receipt belongs to ${receipt.releaseId || "no release"}`);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(receipt.receivedOn || ""), `${releaseId}: invalid consolidated M0 receivedOn`);
  const recordedAtMs = Date.parse(receipt.recordedAt);
  invariant(
    typeof receipt.recordedAt === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(receipt.recordedAt) &&
      Number.isFinite(recordedAtMs) &&
      receipt.recordedAt.startsWith(`${receipt.receivedOn}T`),
    `${releaseId}: invalid consolidated M0 recordedAt`,
  );
  invariant(receipt.channel === "current-codex-task", `${releaseId}: consolidated M0 receipt channel drifted`);
  invariant(
    receipt.taskThreadId === m1AuthorizationReceipt.taskThreadId &&
      receipt.taskThreadId === operatorAssignmentReceipt.taskThreadId,
    `${releaseId}: consolidated M0 receipt task thread drifted`,
  );
  invariant(receipt.statementLanguage === "zh-CN", `${releaseId}: consolidated M0 receipt language drifted`);

  invariant(
    Array.isArray(receipt.ownerStatements) &&
      receipt.ownerStatements.length === G5_L4_OWNER_STATEMENTS.length,
    `${releaseId}: consolidated M0 Owner statements are incomplete`,
  );
  for (const [index, expectedText] of G5_L4_OWNER_STATEMENTS.entries()) {
    const statement = receipt.ownerStatements[index];
    assertExactKeys(
      statement,
      ["sequence", "capturedUtf8", "byteLength", "sha256", "captureBoundary"],
      `${releaseId}: consolidated M0 Owner statement ${index + 1}`,
    );
    const statementBytes = Buffer.from(statement.capturedUtf8 || "", "utf8");
    invariant(statement.sequence === index + 1, `${releaseId}: consolidated M0 statement sequence drifted`);
    invariant(statement.capturedUtf8 === expectedText, `${releaseId}: consolidated M0 Owner statement text drifted`);
    invariant(statement.byteLength === statementBytes.length, `${releaseId}: consolidated M0 statement byte length drifted`);
    invariant(statement.sha256 === sha256(statementBytes), `${releaseId}: consolidated M0 statement SHA-256 drifted`);
    invariant(
      statement.captureBoundary === (
        index === 0
          ? "visible-message-with-trailing-blank-whitespace-omitted"
          : "exact-visible-message"
      ),
      `${releaseId}: consolidated M0 statement capture boundary drifted`,
    );
  }

  assertExactKeys(receipt.ownerIdentity, ["ownerFullName", "ownerRole", "externalSubjectId"], `${releaseId}: consolidated M0 Owner identity`);
  invariant(
    receipt.ownerIdentity.ownerFullName === "Dr. Peter Hu" &&
      receipt.ownerIdentity.ownerFullName === m1AuthorizationReceipt.identity.ownerFullName &&
      receipt.ownerIdentity.ownerRole === "Owner" &&
      receipt.ownerIdentity.externalSubjectId === null,
    `${releaseId}: consolidated M0 Owner identity is not the user-attested Owner`,
  );

  assertExactKeys(receipt.roadmapSignoff, [
    "userAttested",
    "portableExternalSignatureVerified",
    "signedRoadmapPath",
    "signedRoadmapSha256",
  ], `${releaseId}: roadmap signoff intent`);
  invariant(
    receipt.roadmapSignoff.userAttested === true &&
      receipt.roadmapSignoff.portableExternalSignatureVerified === false &&
      receipt.roadmapSignoff.signedRoadmapPath === governance.roadmap.path &&
      receipt.roadmapSignoff.signedRoadmapPath === roadmapBinding.path &&
      receipt.roadmapSignoff.signedRoadmapSha256 === governance.roadmap.sha256 &&
      receipt.roadmapSignoff.signedRoadmapSha256 === roadmapBinding.sha256,
    `${releaseId}: roadmap signoff intent or external-signature boundary drifted`,
  );

  invariant(
    Array.isArray(receipt.ownerDecisions) &&
      receipt.ownerDecisions.length === G5_L4_OWNER_DECISIONS.length,
    `${releaseId}: consolidated Owner decision set is incomplete`,
  );
  for (const [index, expected] of G5_L4_OWNER_DECISIONS.entries()) {
    const decision = receipt.ownerDecisions[index];
    assertExactKeys(
      decision,
      ["decisionId", "directive", "recorded", "m0RequirementSatisfied"],
      `${releaseId}: consolidated Owner decision ${index + 1}`,
    );
    invariant(
      decision.decisionId === expected.decisionId &&
        decision.directive === expected.directive &&
        decision.recorded === true &&
        decision.m0RequirementSatisfied === expected.m0RequirementSatisfied,
      `${releaseId}: consolidated Owner decision ${expected.decisionId} drifted`,
    );
  }

  assertExactKeys(receipt.staffingCapacity, [
    "assigneeFullName",
    "samePersonAsOwner",
    "committedHoursPerWeekPerSlot",
    "hoursAreAdditiveAcrossSlots",
    "roadmapMinimumsAmended",
    "distinctBackupCoverageClaimed",
    "slots",
  ], `${releaseId}: staffing capacity`);
  invariant(
    receipt.staffingCapacity.assigneeFullName === receipt.ownerIdentity.ownerFullName &&
      receipt.staffingCapacity.samePersonAsOwner === true &&
      receipt.staffingCapacity.committedHoursPerWeekPerSlot === 1 &&
      receipt.staffingCapacity.hoursAreAdditiveAcrossSlots === false &&
      receipt.staffingCapacity.roadmapMinimumsAmended === false &&
      receipt.staffingCapacity.distinctBackupCoverageClaimed === false,
    `${releaseId}: staffing capacity boundary drifted`,
  );
  const expectedSlots = governance.requiredRoles.flatMap(({roleId}) => [
    {roleId, slot: "primary"},
    {roleId, slot: "backup"},
  ]);
  invariant(
    Array.isArray(receipt.staffingCapacity.slots) &&
      receipt.staffingCapacity.slots.length === expectedSlots.length,
    `${releaseId}: staffing role slots are incomplete`,
  );
  for (const [index, expected] of expectedSlots.entries()) {
    const slot = receipt.staffingCapacity.slots[index];
    assertExactKeys(slot, ["roleId", "slot", "committedHoursPerWeek"], `${releaseId}: staffing slot ${index + 1}`);
    invariant(
      slot.roleId === expected.roleId &&
        slot.slot === expected.slot &&
        slot.committedHoursPerWeek === 1,
      `${releaseId}: staffing slot ${expected.roleId}/${expected.slot} drifted`,
    );
  }

  assertExactKeys(receipt.budgetDefaultSelection, [
    "currency",
    "ownerSelectedRepositoryDefaults",
    "repositoryDefinedNumericOrCycleDefaultsFound",
    "personnelRateCeilingUsdPerHour",
    "totalBudgetEnvelopeUsd",
    "procurementPaymentCycle",
    "defaultDisposition",
    "externalSpendAuthorized",
    "anySpendRequiresNewOwnerReceipt",
  ], `${releaseId}: budget default selection`);
  invariant(
    receipt.budgetDefaultSelection.currency === "USD" &&
      receipt.budgetDefaultSelection.ownerSelectedRepositoryDefaults === true &&
      receipt.budgetDefaultSelection.repositoryDefinedNumericOrCycleDefaultsFound === false &&
      receipt.budgetDefaultSelection.personnelRateCeilingUsdPerHour === null &&
      receipt.budgetDefaultSelection.totalBudgetEnvelopeUsd === null &&
      receipt.budgetDefaultSelection.procurementPaymentCycle === null &&
      receipt.budgetDefaultSelection.defaultDisposition ===
        "fail-closed-unset-no-spend-procurement-or-payment-authority" &&
      receipt.budgetDefaultSelection.externalSpendAuthorized === false &&
      receipt.budgetDefaultSelection.anySpendRequiresNewOwnerReceipt === true,
    `${releaseId}: budget default selection invented a numeric, cycle, spend, or payment authority`,
  );
  invariant(
    receipt.budgetDefaultSelection.currency === governance.budgetDecision.currency &&
      receipt.budgetDefaultSelection.ownerSelectedRepositoryDefaults ===
        governance.budgetDecision.ownerSelectedRepositoryDefaults &&
      receipt.budgetDefaultSelection.repositoryDefinedNumericOrCycleDefaultsFound ===
        governance.budgetDecision.repositoryDefinedNumericOrCycleDefaultsFound &&
      receipt.budgetDefaultSelection.personnelRateCeilingUsdPerHour ===
        governance.budgetDecision.personnelRateCeilingUsdPerHour &&
      receipt.budgetDefaultSelection.totalBudgetEnvelopeUsd ===
        governance.budgetDecision.totalBudgetEnvelopeUsd &&
      receipt.budgetDefaultSelection.procurementPaymentCycle ===
        governance.budgetDecision.procurementPaymentCycle &&
      receipt.budgetDefaultSelection.defaultDisposition ===
        governance.budgetDecision.defaultDisposition,
    `${releaseId}: governance budget defaults drifted from the Owner receipt`,
  );

  assertExactKeys(receipt.sourceBindingsAtIntake, [
    "roadmap",
    "releaseManifest",
    "sourceScopeFreeze",
    "sourceGapForensics",
    "m1OwnerAuthorization",
    "originalRuntimeOperatorAssignment",
  ], `${releaseId}: consolidated M0 source bindings`);
  const assertIntakeBinding = (name, expectedBinding) => {
    const binding = receipt.sourceBindingsAtIntake[name];
    assertExactKeys(binding, ["path", "bytes", "sha256"], `${releaseId}: consolidated M0 ${name} binding`);
    invariant(
      binding.path === expectedBinding.path &&
        binding.bytes === expectedBinding.bytes &&
        binding.sha256 === expectedBinding.sha256,
      `${releaseId}: consolidated M0 ${name} binding drifted`,
    );
  };
  assertIntakeBinding("roadmap", roadmapBinding);
  assertIntakeBinding("sourceScopeFreeze", sourceScopeBinding);
  assertIntakeBinding("sourceGapForensics", sourceGapBinding);
  assertIntakeBinding("m1OwnerAuthorization", m1AuthorizationBinding);
  assertIntakeBinding("originalRuntimeOperatorAssignment", operatorAssignmentBinding);
  assertExactKeys(
    receipt.sourceBindingsAtIntake.releaseManifest,
    ["path", "bytes", "sha256", "releaseEntryFingerprintSha256"],
    `${releaseId}: consolidated M0 release-manifest binding`,
  );
  invariant(
    receipt.sourceBindingsAtIntake.releaseManifest.path === releaseBinding.path &&
      receipt.sourceBindingsAtIntake.releaseManifest.bytes === releaseBinding.bytes &&
      receipt.sourceBindingsAtIntake.releaseManifest.sha256 === releaseBinding.sha256 &&
      receipt.sourceBindingsAtIntake.releaseManifest.releaseEntryFingerprintSha256 ===
        G5_L4_RELEASE_FINGERPRINT_SHA256,
    `${releaseId}: consolidated M0 release-manifest binding drifted`,
  );

  invariant(receipt.externalSignatureEnvelope === null, `${releaseId}: consolidated M0 receipt cannot claim an external signature envelope`);
  const expectedAuthorityBoundary = {
    ownerIdentityUserAttested: true,
    ownerIdentityCryptographicallyVerified: false,
    roadmapSignoffIntentRecorded: true,
    portableExternalRoadmapSignatureEstablished: false,
    ownerDecisionDirectiveCount: 4,
    ownerDecisionM0SatisfiedCount: 2,
    namedHumanRoleSlotIntentCount: 12,
    weeklyCapacityCommitmentCount: 12,
    roadmapCapacityFloorsAmended: false,
    distinctBackupCoverageEstablished: false,
    budgetDefaultSelectionRecorded: true,
    budgetValuesEstablished: false,
    budgetGatesApproved: 0,
    m0ExitEstablished: false,
    runtimeHostApproved: false,
    containmentApproved: false,
    immutableSessionAuthorizationEstablished: false,
    animateGuiExecutionAuthorizedByThisReceiptAlone: false,
    originalRuntimeExecutionAuthorizedByThisReceiptAlone: false,
    rendererImplementationAuthorizedByThisReceiptAlone: false,
    humanReviewAccepted: false,
    ownerFidelityAcceptanceEstablished: false,
    strictCompletionEstablished: false,
    publicationAuthorized: false,
    strictAcceptanceEffect: "m0-governance-intake-only",
  };
  assertExactKeys(
    receipt.authorityBoundary,
    Object.keys(expectedAuthorityBoundary),
    `${releaseId}: consolidated M0 authority boundary`,
  );
  invariant(
    stableJson(receipt.authorityBoundary) === stableJson(expectedAuthorityBoundary),
    `${releaseId}: consolidated M0 authority boundary drifted`,
  );

  assertSameFileDescriptor(
    governance.staffingCapacityReceipt,
    receiptBinding,
    `${releaseId}: governance consolidated M0 receipt`,
  );

  return {
    status: "owner-governance-intent-recorded-m0-capacity-budget-backup-and-external-signature-controls-open",
    receipt: descriptor(receiptBinding),
    owner: {
      fullName: receipt.ownerIdentity.ownerFullName,
      role: receipt.ownerIdentity.ownerRole,
      identityEvidence: "user-attested-current-codex-task",
      cryptographicallyVerified: false,
    },
    roadmapSignoff: receipt.roadmapSignoff,
    decisions: receipt.ownerDecisions,
    staffingCapacity: receipt.staffingCapacity,
    budgetDefaultSelection: receipt.budgetDefaultSelection,
    authorityBoundary: receipt.authorityBoundary,
  };
}

function reportReleaseId(report) {
  return report?.releaseId ?? report?.release?.releaseId ?? report?.identity?.releaseId ?? null;
}

function assertReportIdentity(report, releaseId, label) {
  invariant(reportReleaseId(report) === releaseId, `${label} belongs to ${reportReleaseId(report) || "no release"}, expected ${releaseId}`);
}

export function derivePromotionLedgerReadiness(promotion) {
  invariant(
    typeof promotion?.ledgerReproducibility?.completionLedger?.current === "boolean" &&
    typeof promotion?.ledgerReproducibility?.releaseLedger?.current === "boolean" &&
    typeof promotion?.ledgerReproducibility?.allCurrent === "boolean",
    "promotion readiness is missing deterministic ledger checks",
  );
  const globalInputLedgersReproducible =
    promotion.ledgerReproducibility.completionLedger.current === true &&
    promotion.ledgerReproducibility.releaseLedger.current === true &&
    promotion.ledgerReproducibility.allCurrent === true;
  invariant(
    promotion.readiness?.inputLedgersReproducible === globalInputLedgersReproducible,
    "promotion ledger reproducibility summary is inconsistent",
  );
  invariant(
    typeof promotion.releaseScopedProjection?.current === "boolean" &&
    promotion.readiness?.releaseScopedProjectionCurrent === promotion.releaseScopedProjection.current,
    "promotion readiness is missing a consistent release-scoped projection",
  );
  const releaseScopedLedgerCurrent =
    promotion.releaseScopedProjection.current === true &&
    promotion.release?.ledgerBindingsCurrent === true &&
    promotion.release?.ledgerRowPresent === true;
  return {
    globalInputLedgersReproducible,
    releaseScopedLedgerCurrent,
    ownerPacketReady: releaseScopedLedgerCurrent,
  };
}

export function deriveMachinePacketSummary({release, reports}) {
  const {sourceScope, sourceGap, workspace, audio, animate, runtime, risk, promotion} = reports;
  const expectedMembers = release.expectedCounts.members;
  invariant(sourceScope.summary?.memberCount === expectedMembers, "source-scope member count drifted");
  invariant(sourceScope.summary?.pageCount === release.expectedCounts.activeXmlReferencedPages, "source-scope page count drifted");
  invariant(sourceScope.summary?.shellCount === release.expectedCounts.courseShells, "source-scope shell count drifted");
  invariant(sourceScope.summary?.strictCompleteCount === 0 && sourceScope.summary?.publishedCount === 0, "source-scope report crossed an acceptance boundary");
  invariant(sourceGap.frozenRelease?.expectedMembers === expectedMembers && sourceGap.frozenRelease?.membershipChangedByThisReport === false, "source-gap report changed the frozen release");
  invariant(sourceGap.acceptanceEffects?.sourceGapClosed === false && sourceGap.acceptanceEffects?.strictComplete === false, "source-gap report crossed an acceptance boundary");
  invariant(workspace.summary?.presentWorkspaceCount === expectedMembers && workspace.summary?.draftValidationPassCount === expectedMembers, "workspace draft coverage is incomplete");
  invariant(
    workspace.summary?.implementationStartedCount ===
        G5_L4_CANONICAL_ENGINEERING_CANDIDATE_COUNT &&
      workspace.summary?.strictCompleteCount === 0,
    "workspace readiness candidate or strict-completion boundary drifted",
  );
  invariant(audio.summary?.memberCount === expectedMembers && audio.summary?.candidateFileCount === 135, "audio ownership scope drifted");
  invariant(audio.summary?.physicalHashVerifiedFileCount === audio.summary.candidateFileCount, "audio candidate physical verification is incomplete");
  invariant(audio.summary?.spokenLanguageEstablishedFileCount === 0 && audio.summary?.audioAcceptedFileCount === 0, "audio ownership report crossed an acceptance boundary");
  invariant(animate.summary?.selectedMembers === expectedMembers && animate.summary?.flaBackedItems === 44 && animate.summary?.swfOnlyItems === 11, "Animate queue scope drifted");
  invariant(animate.summary?.releaseStagingCopiesVerified === 44 && animate.summary?.pairedAssistPackagesVerified === 44, "Animate preparation is incomplete");
  invariant(animate.summary?.animateGuiExecutionsByThisBuilder === 0 && animate.summary?.authoringAuditsEstablished === 0, "Animate readiness report crossed the no-GUI/no-audit boundary");
  invariant(
    runtime.schemaVersion === 2 &&
      runtime.reportType === "release-runtime-acquisition-planning-readiness" &&
      runtime.summary?.selectedMemberCount === expectedMembers &&
      runtime.summary?.emptyWorksheetCount === expectedMembers,
    "runtime worksheet scope or schema is incomplete",
  );
  invariant(
    runtime.summary?.namedOperatorRoleAssignmentReceiptCount === 1 &&
      runtime.summary?.plansWithNamedOperatorRoleAssignmentCount === expectedMembers &&
      runtime.summary?.sessionOperatorAttestationCount === 0 &&
      runtime.gates?.namedOperatorRoleAssignmentBound === true &&
      runtime.gates?.runtimeOperatorSessionAttested === false &&
      runtime.gates?.runtimeOperatorBound === false,
    "runtime named-role/session boundary drifted",
  );
  invariant(
    runtime.namedOperatorRoleAssignment?.roleId === "authorized-original-runtime-operator" &&
      runtime.namedOperatorRoleAssignment.slot === "primary" &&
      runtime.namedOperatorRoleAssignment.assigneeFullName === "Dr. Peter Hu" &&
      runtime.namedOperatorRoleAssignment.weeklyCapacityEstablished === false &&
      runtime.namedOperatorRoleAssignment.runtimeHostApproved === false &&
      runtime.namedOperatorRoleAssignment.containmentApproved === false &&
      runtime.namedOperatorRoleAssignment.immutableSessionAuthorizationEstablished === false &&
      runtime.namedOperatorRoleAssignment.actualSessionOperatorAttestationPresent === false,
    "runtime named-operator role authority drifted",
  );
  invariant(runtime.summary?.runtimeSessionCount === 0 && runtime.summary?.authoritativeBaselineCount === 0, "runtime planning report crossed an authority boundary");
  invariant(runtime.summary?.totalCoverageFrameCountKnownCount === 0 && runtime.summary?.unresolvedNestedReachabilityCount === 1281, "runtime coverage uncertainty drifted");
  invariant(risk.summary?.calibrationMemberCount === 8 && risk.summary?.workStudyTargetCount === 4, "risk calibration set drifted");
  invariant(risk.summary?.workStudyCompletedCount === 0 && risk.summary?.implementationAuthorizedCount === 0, "risk calibration report crossed a planning boundary");
  invariant(promotion.testResult?.failed === 0 && promotion.testResult?.passed === promotion.testResult?.tests, "promotion security synthetic suite is not green");
  invariant(promotion.productionFuses?.allClosed === true && promotion.readiness?.productionPromotionWriterReady === false, "promotion production fuses are not fail-closed");
  invariant(promotion.release?.strictCompleteCount === 0 && promotion.acceptance?.releaseAuthorized === false, "promotion readiness crossed an acceptance boundary");
  const {
    globalInputLedgersReproducible,
    releaseScopedLedgerCurrent,
    ownerPacketReady,
  } = derivePromotionLedgerReadiness(promotion);

  return {
    readyForOwnerReview: ownerPacketReady,
    frozenRelease: {
      members: expectedMembers,
      pages: sourceScope.summary.pageCount,
      shells: sourceScope.summary.shellCount,
      pairedFlaSwf: sourceScope.summary.pairedFlaSwfCount,
      swfOnly: sourceScope.summary.swfOnlyCount,
      exclusions: sourceScope.summary.exclusionCount,
      unresolvedSourceConflicts: sourceScope.conflicts.filter(({status}) => status !== "resolved").length,
    },
    workspaces: {
      draftValidationPassed: workspace.summary.draftValidationPassCount,
      implementationStarted: workspace.summary.implementationStartedCount,
    },
    audio: {
      candidatesHashVerified: audio.summary.physicalHashVerifiedFileCount,
      candidates: audio.summary.candidateFileCount,
      unmapped: audio.summary.unmappedCandidateFileCount,
      spokenLanguageEstablished: audio.summary.spokenLanguageEstablishedFileCount,
      accepted: audio.summary.audioAcceptedFileCount,
    },
    authoring: {
      flaBacked: animate.summary.flaBackedItems,
      stagingCopiesVerified: animate.summary.releaseStagingCopiesVerified,
      pairedAssistPackagesVerified: animate.summary.pairedAssistPackagesVerified,
      actualAnimateRuns: animate.summary.animateGuiExecutionsByThisBuilder,
      authoringAudits: animate.summary.authoringAuditsEstablished,
    },
    runtime: {
      emptyWorksheets: runtime.summary.emptyWorksheetCount,
      namedOperatorRoleAssignments:
        runtime.summary.namedOperatorRoleAssignmentReceiptCount,
      plansWithNamedOperatorRoleAssignment:
        runtime.summary.plansWithNamedOperatorRoleAssignmentCount,
      sessionOperatorAttestations:
        runtime.summary.sessionOperatorAttestationCount,
      rootFramesStructuralOnly: runtime.summary.structuralRootFrameCount,
      nestedCandidates: runtime.summary.structuralNestedDefinitionCount,
      nestedReachabilityUnresolved: runtime.summary.unresolvedNestedReachabilityCount,
      totalCoverageKnownMembers: runtime.summary.totalCoverageFrameCountKnownCount,
      authoritativeSessions: runtime.summary.runtimeSessionCount,
    },
    calibration: {
      members: risk.summary.calibrationMemberCount,
      workStudyTargets: risk.summary.workStudyTargetCount,
      completedWorkStudies: risk.summary.workStudyCompletedCount,
    },
    promotionSecurity: {
      syntheticTestsPassed: promotion.testResult.passed,
      productionFusesClosed: promotion.productionFuses.allClosed,
      productionWriterReady: promotion.readiness.productionPromotionWriterReady,
      releaseScopedLedgerCurrent,
      globalCompletionLedgerCurrent: promotion.ledgerReproducibility.completionLedger.current,
      globalReleaseLedgerCurrent: promotion.ledgerReproducibility.releaseLedger.current,
      globalInputLedgersReproducible,
      externalDependenciesBound: Object.values(promotion.externalDependencies).filter(Boolean).length,
      externalDependencyCount: Object.keys(promotion.externalDependencies).length,
    },
  };
}

async function loadMachinePacket(governance, releaseId) {
  const entries = await Promise.all(Object.entries(governance.machinePacket).map(async ([key, relativePath]) => {
    const binding = await jsonBinding(relativePath, `machine packet ${key}`);
    assertReportIdentity(binding.value, releaseId, `machine packet ${key}`);
    return [key, binding];
  }));
  return Object.fromEntries(entries);
}

export async function buildReport({
  releaseId,
  releaseManifestPath = defaults.releases,
  governancePath = defaults.governance,
} = {}) {
  invariant(/^[a-z0-9][a-z0-9-]{2,127}$/.test(releaseId || ""), "--release-id must be a lowercase portable identifier");
  const [releaseBinding, governanceBinding, generatorBinding] = await Promise.all([
    jsonBinding(releaseManifestPath, "lesson release manifest"),
    jsonBinding(governancePath, "M0 governance catalog"),
    fileBinding(portable(path.relative(projectRoot, scriptPath)), "generator"),
  ]);
  const release = selectRelease(releaseBinding.value, releaseId);
  const governance = selectGovernance(governanceBinding.value, releaseId);
  const roadmapBinding = await fileBinding(governance.roadmap.path, "roadmap");
  invariant(roadmapBinding.sha256 === governance.roadmap.sha256, `${releaseId}: roadmap SHA-256 drifted`);
  const packetBindings = await loadMachinePacket(governance, releaseId);
  const authorizationBinding = await jsonBinding(
    governance.m1AuthorizationReceipt.path,
    "M1 Owner authorization receipt",
  );
  const phaseAuthorization = validateM1AuthorizationReceipt({
    receipt: authorizationBinding.value,
    receiptBinding: authorizationBinding,
    releaseId,
    governance,
    releaseBinding,
    sourceScopeBinding: packetBindings.sourceScopeFreeze,
  });
  const operatorRoleRequirement = governance.requiredRoles.find(
    ({roleId}) => roleId === "authorized-original-runtime-operator",
  );
  invariant(
    operatorRoleRequirement?.primaryAssignmentReceipt,
    `${releaseId}: primary original-runtime operator assignment receipt is missing`,
  );
  const operatorAssignmentBinding = await jsonBinding(
    operatorRoleRequirement.primaryAssignmentReceipt.path,
    "primary original-runtime operator assignment receipt",
  );
  const operatorAssignment = validateOriginalRuntimeOperatorAssignmentReceipt({
    receipt: operatorAssignmentBinding.value,
    receiptBinding: operatorAssignmentBinding,
    releaseId,
    governance,
    releaseBinding,
    sourceScopeBinding: packetBindings.sourceScopeFreeze,
    m1AuthorizationBinding: authorizationBinding,
    m1AuthorizationReceipt: authorizationBinding.value,
  });
  const ownerGovernanceBinding = await jsonBinding(
    governance.staffingCapacityReceipt.path,
    "consolidated M0 Owner-governance receipt",
  );
  const ownerGovernance = validateM0OwnerGovernanceReceipt({
    receipt: ownerGovernanceBinding.value,
    receiptBinding: ownerGovernanceBinding,
    releaseId,
    governance,
    roadmapBinding,
    releaseBinding,
    sourceScopeBinding: packetBindings.sourceScopeFreeze,
    sourceGapBinding: packetBindings.sourceGapForensics,
    m1AuthorizationBinding: authorizationBinding,
    m1AuthorizationReceipt: authorizationBinding.value,
    operatorAssignmentBinding,
    operatorAssignmentReceipt: operatorAssignmentBinding.value,
  });
  const reports = {
    sourceScope: packetBindings.sourceScopeFreeze.value,
    sourceGap: packetBindings.sourceGapForensics.value,
    workspace: packetBindings.workspaceReadiness.value,
    audio: packetBindings.audioOwnershipReadiness.value,
    animate: packetBindings.animateOperatorReadiness.value,
    runtime: packetBindings.runtimeAcquisitionPlanning.value,
    risk: packetBindings.riskCalibration.value,
    promotion: packetBindings.promotionSecurityReadiness.value,
  };
  invariant(
    reports.animate.schemaVersion === 2 &&
      reports.animate.operatorAssignment?.roleId === operatorAssignment.roleId &&
      reports.animate.operatorAssignment.slot === operatorAssignment.slot &&
      reports.animate.operatorAssignment.assigneeFullName === operatorAssignment.assignee.fullName &&
      reports.animate.operatorAssignment.cryptographicallyVerified === false &&
      reports.animate.operatorAssignment.weeklyCapacityEstablished === false &&
      reports.animate.operatorAssignment.hostApproved === false &&
      reports.animate.operatorAssignment.containmentApproved === false &&
      reports.animate.operatorAssignment.immutableSessionAuthorizationEstablished === false &&
      reports.animate.operatorAssignment.animateGuiExecutionAuthorized === false &&
      reports.animate.operatorAssignment.originalRuntimeExecutionAuthorized === false &&
      reports.animate.operatorAssignment.actualSessionOperatorAttestationPresent === false,
    `${releaseId}: Animate readiness does not preserve the named-operator execution boundary`,
  );
  invariant(
    reports.animate.inputs?.namedOperatorAssignmentReceipt?.file === operatorAssignmentBinding.path &&
      reports.animate.inputs.namedOperatorAssignmentReceipt.bytes === operatorAssignmentBinding.bytes &&
      reports.animate.inputs.namedOperatorAssignmentReceipt.sha256 === operatorAssignmentBinding.sha256,
    `${releaseId}: Animate readiness operator receipt binding drifted`,
  );
  invariant(
    reports.runtime.provenance?.namedOperatorAssignmentReceipt?.path ===
        operatorAssignmentBinding.path &&
      reports.runtime.provenance.namedOperatorAssignmentReceipt.bytes ===
        operatorAssignmentBinding.bytes &&
      reports.runtime.provenance.namedOperatorAssignmentReceipt.sha256 ===
        operatorAssignmentBinding.sha256 &&
      reports.runtime.namedOperatorRoleAssignment?.roleId ===
        operatorAssignment.roleId &&
      reports.runtime.namedOperatorRoleAssignment.slot === operatorAssignment.slot &&
      reports.runtime.namedOperatorRoleAssignment.assigneeFullName ===
        operatorAssignment.assignee.fullName,
    `${releaseId}: runtime planning operator receipt binding drifted`,
  );
  const machinePacket = deriveMachinePacketSummary({release, reports});
  const commitmentBySlot = new Map(
    ownerGovernance.staffingCapacity.slots.map((slot) => [
      `${slot.roleId}:${slot.slot}`,
      slot.committedHoursPerWeek,
    ]),
  );
  const userAttestedAssignee = {
    fullName: ownerGovernance.staffingCapacity.assigneeFullName,
    identityEvidence: "user-attested-current-codex-task",
    cryptographicallyVerified: false,
    samePersonAsOwner: true,
  };
  const roleSlots = governance.requiredRoles.flatMap((role) => [
    ["primary", role.minimumPrimaryHoursPerWeek, role.primaryAssignmentReceipt],
    ["backup", role.minimumBackupHoursPerWeek, role.backupAssignmentReceipt],
  ].map(([assignment, minimumHoursPerWeek, assignmentReceipt]) => {
    const committedHoursPerWeek = commitmentBySlot.get(`${role.roleId}:${assignment}`);
    invariant(
      committedHoursPerWeek === 1,
      `${releaseId}: ${role.roleId}/${assignment} commitment is missing or drifted`,
    );
    const capacityFloorSpecified = Number.isFinite(minimumHoursPerWeek);
    const capacityFloorSatisfied =
      capacityFloorSpecified && committedHoursPerWeek >= minimumHoursPerWeek;
    const effectiveBackupCoverageEstablished = assignment === "backup"
      ? userAttestedAssignee.fullName !==
        ownerGovernance.staffingCapacity.assigneeFullName
      : null;
    invariant(
      assignment !== "backup" || effectiveBackupCoverageEstablished === false,
      `${releaseId}: same-person backup was incorrectly treated as effective coverage`,
    );
    const status = assignment === "primary"
      ? "assigned-user-attested-capacity-below-roadmap-floor"
      : capacityFloorSpecified
        ? "assigned-user-attested-capacity-below-floor-and-no-effective-backup"
        : "assigned-user-attested-backup-floor-unset-and-no-effective-backup";
    return {
      roleId: role.roleId,
      assignment,
      minimumHoursPerWeek,
      committedHoursPerWeek,
      assignmentReceipt,
      assignee: userAttestedAssignee,
      capacityCommitmentEstablished: true,
      capacityFloorSpecified,
      capacityFloorSatisfied,
      effectiveBackupCoverageEstablished,
      status,
    };
  }));
  const decisionById = new Map(
    ownerGovernance.decisions.map((decision) => [decision.decisionId, decision]),
  );
  const ownerDecisions = governance.requiredOwnerDecisions.map(({decisionId, receipt}) => {
    const decision = decisionById.get(decisionId);
    invariant(decision, `${releaseId}: Owner decision ${decisionId} is missing from the intake`);
    return {
      decisionId,
      receipt,
      recorded: decision.recorded,
      m0RequirementSatisfied: decision.m0RequirementSatisfied,
      directive: decision.directive,
      status: decision.m0RequirementSatisfied
        ? "owner-approved-user-attested-requirement-satisfied"
        : "owner-directive-recorded-requirement-unsatisfied",
    };
  });
  const budgetGates = [
    {
      gateId: "rate-ceilings",
      approved: governance.budgetDecision.rateCeilingsApproved,
      value: governance.budgetDecision.personnelRateCeilingUsdPerHour,
    },
    {
      gateId: "total-budget-envelope",
      approved: governance.budgetDecision.totalBudgetEnvelopeApproved,
      value: governance.budgetDecision.totalBudgetEnvelopeUsd,
    },
    {
      gateId: "procurement-cycle",
      approved: governance.budgetDecision.procurementCycleApproved,
      value: governance.budgetDecision.procurementPaymentCycle,
    },
  ];
  const m1StartAuthorized =
    phaseAuthorization.authorizedPhase === "M1" &&
    phaseAuthorization.machineOnly === true &&
    phaseAuthorization.m0ExitEstablished === false;
  invariant(m1StartAuthorized, `${releaseId}: validated receipt did not yield bounded M1 start authorization`);
  const summary = {
    machinePacketReadyForOwnerReview: machinePacket.readyForOwnerReview,
    globalLedgerReproducibilityReady: machinePacket.promotionSecurity.globalInputLedgersReproducible,
    requiredOwnerDecisionCount: ownerDecisions.length,
    ownerDecisionReceiptCount: ownerDecisions.filter(({receipt}) => receipt !== null).length,
    ownerDecisionM0SatisfiedCount: ownerDecisions.filter(
      ({m0RequirementSatisfied}) => m0RequirementSatisfied,
    ).length,
    requiredNamedRoleSlotCount: roleSlots.length,
    namedRoleAssignmentReceiptCount: roleSlots.filter(({assignmentReceipt}) => assignmentReceipt !== null).length,
    ownerAttestedNamedRoleAssignmentCount: roleSlots.filter(
      ({assignee}) => assignee?.identityEvidence === "user-attested-current-codex-task",
    ).length,
    portableExternallyVerifiedNamedRoleAssignmentCount: 0,
    weeklyCapacityCommitmentCount: roleSlots.filter(
      ({capacityCommitmentEstablished}) => capacityCommitmentEstablished,
    ).length,
    capacityFloorSatisfiedCount: roleSlots.filter(
      ({capacityFloorSatisfied}) => capacityFloorSatisfied,
    ).length,
    effectiveBackupCoverageCount: roleSlots.filter(
      ({assignment, effectiveBackupCoverageEstablished}) =>
        assignment === "backup" && effectiveBackupCoverageEstablished,
    ).length,
    roleBackupHourFloorSpecifiedCount: governance.requiredRoles.filter(({minimumBackupHoursPerWeek}) => minimumBackupHoursPerWeek !== null).length,
    unresolvedBackupHourFloorCount: governance.requiredRoles.filter(
      ({minimumBackupHoursPerWeek}) => minimumBackupHoursPerWeek === null,
    ).length,
    roleCount: governance.requiredRoles.length,
    budgetGateCount: budgetGates.length,
    budgetGateApprovedCount: budgetGates.filter(({approved}) => approved).length,
    roadmapFormalOwnerSignoffReceiptPresent: governance.roadmap.formalOwnerSignoffReceipt !== null,
    roadmapSignoffIntentUserAttested: ownerGovernance.roadmapSignoff.userAttested,
    roadmapPortableExternalSignatureVerified:
      ownerGovernance.roadmapSignoff.portableExternalSignatureVerified,
    m0ExitReady: false,
    m1StartAuthorized,
    scheduleState: machinePacket.readyForOwnerReview
      ? "m1-authorized-owner-directives-recorded-capacity-backup-budget-and-runtime-controls-open"
      : "m1-authorized-owner-directives-recorded-machine-packet-ledger-drift",
    strictCompleteCount: 0,
    published: false,
  };
  invariant(
    summary.ownerDecisionReceiptCount === 4 &&
      summary.ownerDecisionM0SatisfiedCount === 2,
    `${releaseId}: expected four recorded Owner directives with exactly two satisfied M0 requirements`,
  );
  invariant(
    summary.namedRoleAssignmentReceiptCount === 12 &&
      summary.ownerAttestedNamedRoleAssignmentCount === 12 &&
      summary.portableExternallyVerifiedNamedRoleAssignmentCount === 0 &&
      summary.weeklyCapacityCommitmentCount === 12 &&
      summary.capacityFloorSatisfiedCount === 0 &&
      summary.effectiveBackupCoverageCount === 0,
    `${releaseId}: named-role identity basis drifted`,
  );
  invariant(
    summary.budgetGateApprovedCount === 0 &&
      budgetGates.every(({value}) => value === null),
    `${releaseId}: fail-closed budget defaults unexpectedly created approval or a value`,
  );

  return {
    schemaVersion: 4,
    reportType: "lesson-release-m0-governance-readiness",
    releaseId,
    evidenceState: machinePacket.readyForOwnerReview
      ? machinePacket.promotionSecurity.globalInputLedgersReproducible
        ? "owner-governance-directives-recorded-capacity-backup-budget-and-runtime-controls-open"
        : "owner-governance-directives-recorded-global-ledger-drift-and-m0-controls-open"
      : "owner-governance-directives-recorded-machine-packet-ledger-drift-and-m0-controls-open",
    authority: "This report validates three hash-bound current-task intakes: bounded M1 machine authorization, the earlier primary original-runtime/Animate operator assignment, and the later Owner roadmap/four-decision/twelve-slot directive. It records Dr. Peter Hu in all twelve primary/backup slots at one hour per week each, but does not treat overlapping same-person hours as additive, satisfy any current capacity floor, establish an effective backup, invent missing budget defaults, verify portable identity or an external signature, authorize a runtime session or renderer implementation, close M0, or grant fidelity, review, strict-completion, or publication acceptance.",
    generator: descriptor(generatorBinding),
    sourceBindings: {
      releaseManifest: descriptor(releaseBinding),
      governanceRequirements: descriptor(governanceBinding),
      roadmap: descriptor(roadmapBinding),
      m1AuthorizationReceipt: descriptor(authorizationBinding),
      primaryOriginalRuntimeOperatorAssignmentReceipt: descriptor(operatorAssignmentBinding),
      ownerM0GovernanceReceipt: descriptor(ownerGovernanceBinding),
      machinePacket: Object.fromEntries(Object.entries(packetBindings).map(([key, binding]) => [key, descriptor(binding)])),
    },
    calendar: governance.calendar,
    release: {
      title: release.titleDisplay,
      publicationMode: release.publicationMode,
      memberCount: release.expectedCounts.members,
      pageCount: release.expectedCounts.activeXmlReferencedPages,
      shellCount: release.expectedCounts.courseShells,
    },
    machinePacket,
    phaseAuthorization,
    ownerGovernance: {
      status: ownerGovernance.status,
      receipt: ownerGovernance.receipt,
      owner: ownerGovernance.owner,
      roadmapSignoff: ownerGovernance.roadmapSignoff,
      authorityBoundary: ownerGovernance.authorityBoundary,
    },
    roleAssignments: [operatorAssignment],
    ownerDecisions,
    roleRequirements: governance.requiredRoles.map((role) => {
      const primary = roleSlots.find(
        ({roleId, assignment}) => roleId === role.roleId && assignment === "primary",
      );
      const backup = roleSlots.find(
        ({roleId, assignment}) => roleId === role.roleId && assignment === "backup",
      );
      return {
        roleId: role.roleId,
        minimumPrimaryHoursPerWeek: role.minimumPrimaryHoursPerWeek,
        minimumBackupHoursPerWeek: role.minimumBackupHoursPerWeek,
        primaryCommittedHoursPerWeek: primary.committedHoursPerWeek,
        backupCommittedHoursPerWeek: backup.committedHoursPerWeek,
        primaryAssignee: primary.assignee.fullName,
        primaryStatus: primary.status,
        backupAssignee: backup.assignee.fullName,
        backupStatus: backup.status,
        effectiveBackupCoverageEstablished:
          backup.effectiveBackupCoverageEstablished,
      };
    }),
    roleSlots,
    independenceRules: governance.independenceRules,
    budget: {
      currency: governance.budgetDecision.currency,
      gates: budgetGates,
      defaultSelection: ownerGovernance.budgetDefaultSelection,
      ownerDirectiveReceipt: governance.budgetDecision.ownerDirectiveReceipt,
      signedReceipt: governance.budgetDecision.signedReceipt,
      status: "owner-selected-repository-defaults-resolved-to-fail-closed-null-values",
    },
    summary,
    m0ExitBlockers: [
      ...(!machinePacket.promotionSecurity.globalInputLedgersReproducible
        ? ["The global completion and release ledgers are not both deterministically current; this unrelated drift does not replace the release-scoped Owner packet but still blocks final M0/global release reproducibility."]
        : []),
      "Owner roadmap signoff intent is user-attested in the current task, but no portable external identity or signature envelope is verified.",
      "All twelve role slots name Dr. Peter Hu at one hour/week. All six primary commitments are below their 20/8/8/8/8/4 hour roadmap floors; the operator backup is below its 8-hour floor, and the other five backup floors remain unset.",
      "The same person occupies every primary and backup slot, so 0/6 roles have effective backup continuity and the twelve one-hour labels are not presumed to be twelve additive hours.",
      "The repository defines no numeric rate ceiling, total budget, or procurement/payment-cycle default. The selected default therefore remains null and authorizes no spend, procurement, or payment; budget gates remain 0/3.",
    ],
    downstreamBoundaries: [
      "The Owner directive authorizes only the allowlisted G5 L4 M1 machine tranche. The roadmap calendar is unchanged; this is not a schedule amendment.",
      "The twelve named role intents and one-hour commitments do not create a runtime host, containment approval, immutable session authorization, actual review, or acceptance. Animate GUI and original-runtime execution remain closed.",
      "G5 L4 remains strict 0/55 and unpublished. Those are later fidelity and atomic-release gates, not substitutes for M0 governance and not M0 exit requirements.",
    ],
    machineFollowups: [
      ...(!machinePacket.promotionSecurity.globalInputLedgersReproducible
        ? ["Resolve the upstream global ledger drift through its owning workflow, then regenerate the release ledger and downstream promotion/M0 reports; do not hand-edit ledgers or protected evidence pins."]
        : []),
    ],
    nextOwnerActions: [
      "Increase or separately approve capacity against the existing 20/8/8/8/8/4 primary floors; the current one-hour commitments leave every primary lane below minimum.",
      "Name at least one genuinely distinct qualified backup for each role and set the five still-null backup hour floors.",
      "Provide explicit numeric rate ceilings, a total budget envelope, and a procurement/payment cycle if any non-zero external spend is intended.",
      "Provide the separate runtime-host/containment and immutable per-session authorization plus reviewer receipts before any Animate GUI or original-runtime session; do not reinterpret the operator assignment as execution authority or fidelity acceptance.",
    ],
    acceptanceEffects: {
      m0Closed: false,
      m1Authorized: m1StartAuthorized,
      implementationAuthorized: false,
      authoritativeOriginalRuntime: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

export function renderMarkdown(report) {
  const decisionRows = report.ownerDecisions.map((decision) =>
    `| \`${decision.decisionId}\` | ${decision.status} | ${decision.m0RequirementSatisfied} |`,
  ).join("\n");
  const roleRows = report.roleRequirements.map((role) =>
    `| \`${role.roleId}\` | ${role.minimumPrimaryHoursPerWeek} | ${role.primaryCommittedHoursPerWeek} | ${role.primaryAssignee} | ${role.primaryStatus} | ${role.minimumBackupHoursPerWeek ?? "Owner must set"} | ${role.backupCommittedHoursPerWeek} | ${role.backupAssignee} | ${role.backupStatus} | ${role.effectiveBackupCoverageEstablished} |`,
  ).join("\n");
  const budgetRows = report.budget.gates.map((gate) =>
    `| \`${gate.gateId}\` | ${gate.value ?? "null"} | ${gate.approved ? "approved" : "pending"} |`,
  ).join("\n");
  return `# ${report.releaseId} M0 governance readiness\n\n` +
    `> ${report.authority}\n\n` +
    `## Outcome\n\n` +
    `- Machine packet ready for Owner review: **${report.summary.machinePacketReadyForOwnerReview}**.\n` +
    `- Global completion/release ledgers reproducible: **${report.summary.globalLedgerReproducibilityReady}**.\n` +
    `- Owner decisions recorded / M0 requirement satisfied: **${report.summary.ownerDecisionReceiptCount}/${report.summary.requiredOwnerDecisionCount} / ${report.summary.ownerDecisionM0SatisfiedCount}/${report.summary.requiredOwnerDecisionCount}**.\n` +
    `- Named primary/backup role assignments: **${report.summary.namedRoleAssignmentReceiptCount}/${report.summary.requiredNamedRoleSlotCount}**.\n` +
    `- Owner-attested / portable externally verified named-role assignments: **${report.summary.ownerAttestedNamedRoleAssignmentCount} / ${report.summary.portableExternallyVerifiedNamedRoleAssignmentCount}**.\n` +
    `- Weekly commitments / capacity floors satisfied: **${report.summary.weeklyCapacityCommitmentCount}/${report.summary.requiredNamedRoleSlotCount} / ${report.summary.capacityFloorSatisfiedCount}/${report.summary.requiredNamedRoleSlotCount}**; effective backups: **${report.summary.effectiveBackupCoverageCount}/${report.summary.roleCount}**.\n` +
    `- Budget/procurement gates: **${report.summary.budgetGateApprovedCount}/${report.summary.budgetGateCount}**.\n` +
    `- M0 exit ready: **${report.summary.m0ExitReady}**; M1 authorized: **${report.summary.m1StartAuthorized}**; schedule state: **${report.summary.scheduleState}**.\n` +
    `- Strict: **0/${report.release.memberCount}**; published: **false**.\n\n` +
    `## Owner M1 phase authorization\n\n` +
    `- Owner: **${report.phaseAuthorization.owner.fullName}** (${report.phaseAuthorization.owner.role}); identity basis: **${report.phaseAuthorization.owner.identityEvidence}**; cryptographically verified: **${report.phaseAuthorization.owner.cryptographicallyVerified}**.\n` +
    `- Phase/track: **${report.phaseAuthorization.authorizedPhase} / ${report.phaseAuthorization.track}**; status: **${report.phaseAuthorization.status}**.\n` +
    `- Exact directive digest: \`${report.phaseAuthorization.statement.sha256}\` (${report.phaseAuthorization.statement.byteLength} UTF-8 bytes, ${report.phaseAuthorization.statement.language}).\n` +
    `- Scope: ${report.phaseAuthorization.scope.map((scope) => `\`${scope}\``).join(", ")}.\n` +
    `- Calendar amended: **false**; implementation/original runtime/fidelity acceptance/strict/publication authorized by this receipt: **false/false/false/false/false**.\n\n` +
    `## Owner M0 governance intake\n\n` +
    `- Owner: **${report.ownerGovernance.owner.fullName}**; identity basis: **${report.ownerGovernance.owner.identityEvidence}**; cryptographically verified: **${report.ownerGovernance.owner.cryptographicallyVerified}**.\n` +
    `- Roadmap signoff intent user-attested: **${report.ownerGovernance.roadmapSignoff.userAttested}**; portable external signature verified: **${report.ownerGovernance.roadmapSignoff.portableExternalSignatureVerified}**.\n` +
    `- Four Owner directives and twelve Dr. Peter Hu role-slot intents are recorded by receipt \`${report.ownerGovernance.receipt.sha256}\`; this is not an external signature, runtime authorization, review, or acceptance.\n\n` +
    `## Named original-runtime / Animate operator\n\n` +
    `- Primary operator: **${report.roleAssignments[0].assignee.fullName}**; identity basis: **${report.roleAssignments[0].assignee.identityEvidence}**; cryptographically verified: **${report.roleAssignments[0].assignee.cryptographicallyVerified}**.\n` +
    `- Role/slot: **${report.roleAssignments[0].roleId} / ${report.roleAssignments[0].slot}**; status: **${report.roleAssignments[0].status}**.\n` +
    `- Historical assignment receipt required weekly capacity: **${report.roleAssignments[0].capacity.minimumRequiredHoursPerWeek} hours**; that earlier receipt stated no commitment. The supplemental Owner intake records **1 hour/week**, which remains below the floor.\n` +
    `- Runtime host / containment / immutable session / Animate execution / original-runtime execution established by this receipt: **false/false/false/false/false**.\n\n` +
    `## Machine packet\n\n` +
    `- Release: ${report.machinePacket.frozenRelease.members} members (${report.machinePacket.frozenRelease.pages} pages + ${report.machinePacket.frozenRelease.shells} shell), ${report.machinePacket.frozenRelease.exclusions} exclusions, ${report.machinePacket.frozenRelease.unresolvedSourceConflicts} fail-closed source conflicts.\n` +
    `- Workspaces: ${report.machinePacket.workspaces.draftValidationPassed}/${report.release.memberCount} draft-valid; implementation started ${report.machinePacket.workspaces.implementationStarted}.\n` +
    `- Audio: ${report.machinePacket.audio.candidatesHashVerified}/${report.machinePacket.audio.candidates} physically hash-verified; spoken-language findings ${report.machinePacket.audio.spokenLanguageEstablished}; accepted ${report.machinePacket.audio.accepted}.\n` +
    `- Animate: ${report.machinePacket.authoring.stagingCopiesVerified}/${report.machinePacket.authoring.flaBacked} read-only copies and ${report.machinePacket.authoring.pairedAssistPackagesVerified}/${report.machinePacket.authoring.flaBacked} paired packages; actual audits ${report.machinePacket.authoring.authoringAudits}.\n` +
    `- Runtime: ${report.machinePacket.runtime.emptyWorksheets}/${report.release.memberCount} empty worksheets; ${report.machinePacket.runtime.nestedReachabilityUnresolved} nested candidates unresolved; authoritative sessions ${report.machinePacket.runtime.authoritativeSessions}.\n` +
    `- Work study: ${report.machinePacket.calibration.completedWorkStudies}/${report.machinePacket.calibration.workStudyTargets}; production promotion writer ready: ${report.machinePacket.promotionSecurity.productionWriterReady}.\n` +
    `- Release-scoped ledger projection current: ${report.machinePacket.promotionSecurity.releaseScopedLedgerCurrent}; global completion current ${report.machinePacket.promotionSecurity.globalCompletionLedgerCurrent}; global release current ${report.machinePacket.promotionSecurity.globalReleaseLedgerCurrent}; global all current ${report.machinePacket.promotionSecurity.globalInputLedgersReproducible}.\n\n` +
    `## Owner decisions\n\n| Decision | State | M0 requirement satisfied |\n|---|---|---|\n${decisionRows}\n\n` +
    `## Named role and capacity slots\n\n| Role | Primary floor | Primary committed | Primary person | Primary state | Backup floor | Backup committed | Backup person | Backup state | Effective backup |\n|---|---:|---:|---|---|---:|---:|---|---|---|\n${roleRows}\n\n` +
    `## Budget and procurement\n\nThe Owner selected repository defaults, but the repository defines no numeric or cycle defaults. The resulting fail-closed values are null and authorize no spend, procurement, or payment.\n\n| Gate | Value | State |\n|---|---|---|\n${budgetRows}\n\n` +
    `## M0 exit blockers\n\n${report.m0ExitBlockers.map((blocker) => `- ${blocker}`).join("\n")}\n\n` +
    `## Downstream fidelity and release boundary\n\n${report.downstreamBoundaries.map((boundary) => `- ${boundary}`).join("\n")}\n\n` +
    `The M1, operator, and M0-governance intakes are hash-bound user-attested current-task records, not portable external signatures. They record intent and assignments only; they do not establish adequate capacity, effective backup continuity, budget authority, runtime execution, completed human review, Owner fidelity acceptance, strict completion, or publication approval.\n`;
}

function outputPaths(prefix, outputRoot = projectRoot) {
  invariant(typeof prefix === "string" && prefix.startsWith("reports/"), "--output-prefix must stay below reports/");
  invariant(!prefix.endsWith(".json") && !prefix.endsWith(".md"), "--output-prefix must omit an extension");
  const absolutePrefix = path.resolve(outputRoot, prefix);
  const normalized = portable(path.relative(outputRoot, absolutePrefix));
  invariant(
    normalized === prefix && normalized !== ".." && !normalized.startsWith("../"),
    "output prefix escapes the output root",
  );
  return {json: `${absolutePrefix}.json`, markdown: `${absolutePrefix}.md`};
}

async function assertSafeOutput(file, outputRoot) {
  try {
    const metadata = await lstat(file);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${portable(path.relative(outputRoot, file))}: output must be an ordinary file`);
    invariant(metadata.nlink === 1, `${portable(path.relative(outputRoot, file))}: output must not be hard-linked`);
    return metadata;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function isContainedPath(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function assertSafeOutputParent(file, outputRoot) {
  const rootMetadata = await lstat(outputRoot);
  invariant(
    rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "M0 output root must be an ordinary directory",
  );
  const projectReal = await realpath(outputRoot);
  let cursor = outputRoot;
  const relative = path.relative(outputRoot, path.dirname(file));
  invariant(isContainedPath(outputRoot, path.dirname(file)), "M0 output parent escapes project root");
  for (const segment of relative ? relative.split(path.sep) : []) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(outputRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
    invariant(
      isContainedPath(projectReal, await realpath(cursor)),
      `${portable(path.relative(outputRoot, cursor))}: output ancestor resolves outside project root`,
    );
  }
  return projectReal;
}

async function readOutputBinding(file, outputRoot, {allowMissing = true} = {}) {
  const metadata = await assertSafeOutput(file, outputRoot);
  if (!metadata) {
    invariant(allowMissing, `${portable(path.relative(outputRoot, file))}: output is missing`);
    return {exists: false};
  }
  const contents = await readFile(file);
  return {
    exists: true,
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    size: metadata.size,
    mtimeMs: metadata.mtimeMs,
    sha256: sha256(contents),
    contents,
  };
}

function sameOutputBinding(left, right) {
  if (left.exists !== right.exists) return false;
  if (!left.exists) return true;
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.sha256 === right.sha256
  );
}

async function unlinkOwnedFile(file, expectedBinding, outputRoot) {
  const binding = await readOutputBinding(file, outputRoot);
  if (!binding.exists) return;
  invariant(
    sameOutputBinding(binding, expectedBinding),
    `${portable(path.relative(outputRoot, file))}: refusing to remove changed transaction file`,
  );
  await unlink(file);
}

async function writeOutputTransaction(outputs, outputRoot, transactionHooks = {}) {
  const nonce = randomUUID();
  const staged = [];
  try {
    for (const [index, output] of outputs.entries()) {
      await assertSafeOutputParent(output.file, outputRoot);
      const initial = await readOutputBinding(output.file, outputRoot);
      const desired = Buffer.from(output.contents, "utf8");
      const temporary = `${output.file}.m0-${nonce}-${index}.stage`;
      const backup = initial.exists ? `${output.file}.m0-${nonce}-${index}.backup` : null;
      await writeFile(temporary, desired, {flag: "wx", mode: 0o600});
      const stagedBinding = await readOutputBinding(temporary, outputRoot, {allowMissing: false});
      invariant(stagedBinding.sha256 === sha256(desired), "M0 staged output hash mismatch");
      let backupBinding = null;
      if (backup) {
        await writeFile(backup, initial.contents, {flag: "wx", mode: 0o600});
        backupBinding = await readOutputBinding(backup, outputRoot, {allowMissing: false});
        invariant(backupBinding.sha256 === initial.sha256, "M0 rollback backup hash mismatch");
      }
      staged.push({
        ...output,
        initial,
        desiredSha256: sha256(desired),
        temporary,
        stagedBinding,
        backup,
        backupBinding,
        committed: false,
        committedBinding: null,
      });
    }

    for (const output of staged) {
      invariant(
        sameOutputBinding(output.initial, await readOutputBinding(output.file, outputRoot)),
        `${portable(path.relative(outputRoot, output.file))}: output changed during staging`,
      );
    }
    for (const [index, output] of staged.entries()) {
      invariant(
        sameOutputBinding(output.initial, await readOutputBinding(output.file, outputRoot)),
        `${portable(path.relative(outputRoot, output.file))}: output changed before commit`,
      );
      if (transactionHooks.beforeCommit) {
        await transactionHooks.beforeCommit({index, file: output.file});
      }
      invariant(
        sameOutputBinding(output.initial, await readOutputBinding(output.file, outputRoot)),
        `${portable(path.relative(outputRoot, output.file))}: output changed after commit hook`,
      );
      await rename(output.temporary, output.file);
      output.committed = true;
      const committed = await readOutputBinding(output.file, outputRoot, {allowMissing: false});
      invariant(committed.sha256 === output.desiredSha256, "M0 committed output hash mismatch");
      output.committedBinding = committed;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const output of [...staged].reverse()) {
      try {
        if (output.committed) {
          const current = await readOutputBinding(output.file, outputRoot, {allowMissing: false});
          invariant(
            sameOutputBinding(current, output.committedBinding),
            `${portable(path.relative(outputRoot, output.file))}: committed output changed before rollback`,
          );
          if (output.backup) {
            const backup = await readOutputBinding(output.backup, outputRoot, {allowMissing: false});
            invariant(sameOutputBinding(backup, output.backupBinding), "M0 rollback backup changed");
            await rename(output.backup, output.file);
          } else {
            await unlinkOwnedFile(output.file, output.committedBinding, outputRoot);
          }
        } else {
          await unlinkOwnedFile(output.temporary, output.stagedBinding, outputRoot);
          if (output.backup) await unlinkOwnedFile(output.backup, output.backupBinding, outputRoot);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    if (rollbackErrors.length) {
      throw new Error(`${error.message}; rollback also failed: ${rollbackErrors.join("; ")}`, {
        cause: error,
      });
    }
    throw error;
  }

  const cleanupErrors = [];
  for (const [index, output] of staged.entries()) {
    if (!output.backup) continue;
    try {
      if (transactionHooks.beforeCleanup) {
        await transactionHooks.beforeCleanup({index, file: output.backup});
      }
      await unlinkOwnedFile(output.backup, output.backupBinding, outputRoot);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `M0 outputs committed, but ${cleanupErrors.length} rollback backup cleanup(s) failed`,
    );
  }
}

export async function writeOrCheck({
  report,
  outputPrefix,
  check,
  transactionHooks = {},
  outputRoot = projectRoot,
}) {
  const outputs = outputPaths(outputPrefix, outputRoot);
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderMarkdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readOutputBinding(outputs.json, outputRoot, {allowMissing: false}),
      readOutputBinding(outputs.markdown, outputRoot, {allowMissing: false}),
    ]);
    invariant(actualJson.contents.toString("utf8") === expectedJson, `${portable(path.relative(projectRoot, outputs.json))} is stale`);
    invariant(actualMarkdown.contents.toString("utf8") === expectedMarkdown, `${portable(path.relative(projectRoot, outputs.markdown))} is stale`);
    return "checked";
  }
  await writeOutputTransaction([
    {file: outputs.json, contents: expectedJson},
    {file: outputs.markdown, contents: expectedMarkdown},
  ], outputRoot, transactionHooks);
  return "written";
}

export function parseArguments(argv) {
  const options = {...defaults, releaseId: null, outputPrefix: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const value = argv[index + 1];
    invariant(value && !value.startsWith("--"), `${argument} requires a value`);
    if (argument === "--release-id") options.releaseId = value;
    else if (argument === "--releases") options.releases = value;
    else if (argument === "--governance") options.governance = value;
    else if (argument === "--output-prefix") options.outputPrefix = value;
    else throw new Error(`unknown option: ${argument}`);
    index += 1;
  }
  if (options.help) {
    return {
      releaseId: options.releaseId,
      releaseManifestPath: options.releases,
      governancePath: options.governance,
      outputPrefix: options.outputPrefix,
      check: options.check,
      help: true,
    };
  }
  invariant(options.releaseId, "--release-id is required");
  invariant(options.outputPrefix, "--output-prefix is required");
  outputPaths(options.outputPrefix);
  return {
    releaseId: options.releaseId,
    releaseManifestPath: options.releases,
    governancePath: options.governance,
    outputPrefix: options.outputPrefix,
    check: options.check,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-lesson-release-m0-readiness.mjs --release-id <id> --output-prefix <reports/prefix> [--releases <file>] [--governance <file>] [--check]\n");
    return;
  }
  const report = await buildReport(options);
  const status = await writeOrCheck({report, outputPrefix: options.outputPrefix, check: options.check});
  process.stdout.write(`${status === "checked" ? "PASS" : "WROTE"}: machine packet ${report.summary.machinePacketReadyForOwnerReview ? "ready" : "not ready"}; M1 authorized ${report.summary.m1StartAuthorized}; Owner decisions ${report.summary.ownerDecisionReceiptCount}/${report.summary.requiredOwnerDecisionCount}; named role slots ${report.summary.namedRoleAssignmentReceiptCount}/${report.summary.requiredNamedRoleSlotCount}; M0 exit false; strict 0/${report.release.memberCount}\n`);
  if (options.check) {
    invariant(
      report.summary.machinePacketReadyForOwnerReview,
      "M0 machine packet report is current but not ready for Owner review because bound ledgers are not reproducible",
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
