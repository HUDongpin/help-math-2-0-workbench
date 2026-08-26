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
import {
  validateG5L4RuntimeMechanismCandidateReadiness,
} from "./build-g5-l4-runtime-mechanism-candidate-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH = "scripts/build-g5-l4-original-runtime-containment-readiness.mjs";
const RELEASE_ID = "lesson-g05-l04-number-lines";
const DEFAULT_OUTPUT_PREFIX = "reports/g5-l4-original-runtime-containment-readiness";
const SHA256 = /^[a-f0-9]{64}$/;
const OWNER_DEFAULT_DIRECTIVE =
  "请继续执行。我给与权限和批准。\n阻塞项目2到4——按照默认值";
const OWNER_DEFAULT_DIRECTIVE_SHA256 =
  "f9e39425a4d3ad8baafab9e3cb4020dba4c90b4ebc0c043d743d46309f8ee0ef";
const OWNER_DEFAULT_BLOCKER_SET_SHA256 =
  "3b4644bdbb72204a380a530690cc5850871012913000ee7b8bbc2de32db0d118";

const INPUT_PATHS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  sourceGapForensics: "reports/g5-l4-source-gap-forensics.json",
  operatorAssignmentReceipt:
    "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
  ownerDefaultBlockersAuthorizationReceipt:
    "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  ownerWorkAuthorizationReceipt: G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  runtimePlanningReadiness:
    "reports/g05-l04-number-lines-runtime-acquisition-planning-readiness.json",
  runtimeMechanismCandidateReadiness:
    "reports/g5-l4-runtime-mechanism-candidate-readiness.json",
});

const OWNER_DEFAULT_BLOCKER_REFERENCES = Object.freeze([
  {
    blockerNumber: 2,
    exactUtf8:
      "CR-01 至 CR-08 尚未由 Owner 选择、批准和验证；`L4KTE01.xml` 与 `L4KTS01.xml` 缺失，因此只存在不完整的 host-tree 候选。",
    byteLength: 147,
    sha256:
      "28c933579a4b5c2358bc8167bb898a9b21bcf8bbf71986b9f144318db06b037b",
    defaultDisposition:
      "fail-closed-controls-remain-technically-unselected-unapproved-unverified-missing-xml-preserved-no-substitution",
  },
  {
    blockerNumber: 3,
    exactUtf8:
      "尚无不可变的单次会话授权、会话操作员证明，以及实际 EN/ES 原始运行时遍历；44 个 FLA 的 Animate 人工审计也均未执行。",
    byteLength: 159,
    sha256:
      "b512d6d5e8a1689ffcd23bf18b50d289cdb9680835188a5da3a0c33d88c314d8",
    defaultDisposition:
      "unsigned-non-runnable-session-and-animate-preparation-only-no-session-runtime-traversal-or-audit-established",
  },
  {
    blockerNumber: 4,
    exactUtf8:
      "尚缺独立工程、视觉、音频、西班牙语审查，以及 Owner fidelity、strict-validation 和原子发布批准。",
    byteLength: 126,
    sha256:
      "79f403a84c387718f4f7cc827538ff1f91c08dd40f23d236c4666958253e9837",
    defaultDisposition:
      "review-and-owner-signoff-package-preparation-only-no-review-fidelity-strict-validation-or-publication-acceptance-established",
  },
]);

const WORK_STUDY_SCENARIOS = Object.freeze([
  {
    animationId: "shell-course-g05-l04-index-local",
    path: "migrations/shell-course-g05-l04-index-local/audit/scenario-inventory.json",
  },
  {
    animationId: "course-g05-l04-rw-002",
    path: "migrations/course-g05-l04-rw-002/audit/scenario-inventory.json",
  },
  {
    animationId: "course-g05-l04-in-019",
    path: "migrations/course-g05-l04-in-019/audit/scenario-inventory.json",
  },
  {
    animationId: "course-g05-l04-fq-002",
    path: "migrations/course-g05-l04-fq-002/audit/scenario-inventory.json",
  },
]);

const MISSING_KEYTERM_DEPENDENCIES = Object.freeze([
  {
    language: "english",
    path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  },
  {
    language: "spanish",
    path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
  },
]);

const CONTROL_REQUIREMENTS = Object.freeze([
  [
    "CR-01",
    "Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player.",
  ],
  [
    "CR-02",
    "Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency.",
  ],
  [
    "CR-03",
    "Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session.",
  ],
  [
    "CR-04",
    "Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.",
  ],
  [
    "CR-05",
    "Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load.",
  ],
  [
    "CR-06",
    "Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled.",
  ],
  [
    "CR-07",
    "Run a fresh storage-capacity preflight immediately before every bounded capture session.",
  ],
  [
    "CR-08",
    "Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution.",
  ],
]);

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

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: path is empty`,
  );
  invariant(
    !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath),
    `${label}: path escapes the project root`,
  );
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

export async function readFileRecord(
  projectRoot,
  relativePath,
  label = relativePath,
) {
  const absolutePath = resolveProjectPath(
    path.resolve(projectRoot),
    relativePath,
    label,
  );
  const metadataBefore = await assertOrdinaryFile(absolutePath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const metadataAfter = await assertOrdinaryFile(absolutePath, label);
  invariant(
    metadataBefore.dev === metadataAfter.dev &&
      metadataBefore.ino === metadataAfter.ino &&
      metadataBefore.mtimeMs === metadataAfter.mtimeMs &&
      metadataAfter.size === contents.length,
    `${label}: changed during read`,
  );
  return {
    path: relativePath,
    absolutePath,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
    metadata: metadataAfter,
  };
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

function descriptor(record, extra = {}) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    ...extra,
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

function assertAllFalse(value, keys, label) {
  for (const key of keys) {
    invariant(value?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function assertExactUtf8Binding(
  binding,
  exactUtf8,
  byteLength,
  expectedSha256,
  label,
) {
  invariant(binding?.exactUtf8 === exactUtf8, `${label}: exact UTF-8 text drifted`);
  const bytes = Buffer.from(binding.exactUtf8, "utf8");
  invariant(
    bytes.length === byteLength && binding.byteLength === byteLength,
    `${label}: byte length drifted`,
  );
  invariant(
    sha256Bytes(bytes) === expectedSha256 &&
      binding.sha256 === expectedSha256,
    `${label}: SHA-256 drifted`,
  );
}

export function validateG5L4OwnerDefaultBlockersAuthorizationReceipt(
  document,
  {
    releaseManifestRecord,
    sourceGapRecord,
    operatorAssignmentRecord,
  } = {},
) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType ===
        "g5-l4-user-stated-owner-default-blockers-2-4-authorization-intake" &&
      document.releaseId === RELEASE_ID &&
      document.channel === "current-codex-task" &&
      document.statementLanguage === "zh-CN",
    "Owner blockers 2-4 authorization receipt identity drifted",
  );
  assertExactUtf8Binding(
    document.ownerStatement,
    OWNER_DEFAULT_DIRECTIVE,
    84,
    OWNER_DEFAULT_DIRECTIVE_SHA256,
    "Owner blockers 2-4 directive",
  );
  invariant(
    document.ownerStatement.captureBoundary ===
      "exact-visible-message-markdown-source-with-single-lf",
    "Owner blockers 2-4 directive capture boundary drifted",
  );
  invariant(
    document.ownerIdentity?.ownerFullName === "Dr. Peter Hu" &&
      document.ownerIdentity.ownerRole === "Owner" &&
      document.ownerIdentity.externalSubjectId === null,
    "Owner blockers 2-4 identity drifted",
  );

  const blockerSet = document.referencedBlockerSet;
  const expectedJoined = OWNER_DEFAULT_BLOCKER_REFERENCES
    .map(({exactUtf8}) => exactUtf8)
    .join("\n");
  invariant(
    JSON.stringify(blockerSet?.blockerNumbers) === JSON.stringify([2, 3, 4]) &&
      blockerSet.captureBoundary ===
        "exact-user-visible-blocker-markdown-source-with-list-prefixes-omitted-and-items-joined-by-single-lf",
    "Owner blockers 2-4 reference-set identity drifted",
  );
  assertExactUtf8Binding(
    blockerSet,
    expectedJoined,
    434,
    OWNER_DEFAULT_BLOCKER_SET_SHA256,
    "Owner blockers 2-4 joined reference set",
  );
  invariant(
    Array.isArray(blockerSet.items) &&
      blockerSet.items.length === OWNER_DEFAULT_BLOCKER_REFERENCES.length,
    "Owner blockers 2-4 item set drifted",
  );
  for (const [index, expected] of OWNER_DEFAULT_BLOCKER_REFERENCES.entries()) {
    const item = blockerSet.items[index];
    invariant(
      item?.blockerNumber === expected.blockerNumber &&
        item.defaultDisposition === expected.defaultDisposition,
      `Owner blocker ${expected.blockerNumber}: default disposition drifted`,
    );
    assertExactUtf8Binding(
      item,
      expected.exactUtf8,
      expected.byteLength,
      expected.sha256,
      `Owner blocker ${expected.blockerNumber}`,
    );
  }

  const authorization = document.authorization;
  invariant(
    authorization?.defaultDisposition ===
        "prospective-fail-closed-policy-and-machine-preparation-only" &&
      authorization.policyApproved === true &&
      authorization.preparationAuthorized === true &&
      authorization
        .unsignedPendingOwnerSignaturePackagePreparationAuthorized === true &&
      JSON.stringify(authorization.authorizedPreparation) ===
        JSON.stringify([
          "preserve-and-aggregate-current-fail-closed-evidence-boundaries",
          "materialize-machine-only-readiness-and-policy-projection-artifacts",
          "prepare-unsigned-non-runnable-candidate-packages-requiring-separate-human-or-owner-signature",
        ]),
    "Owner blockers 2-4 policy/preparation authorization drifted",
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
    "Owner blockers 2-4 technical/execution/acceptance authorization",
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
    "Owner blockers 2-4 authority boundary drifted",
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
    "Owner blockers 2-4 fail-closed authority boundary",
  );
  invariant(
    document.externalSignatureEnvelope === null,
    "Owner blockers 2-4 receipt invented an external signature",
  );

  const suppliedRecords = [
    releaseManifestRecord,
    sourceGapRecord,
    operatorAssignmentRecord,
  ];
  if (suppliedRecords.some(Boolean)) {
    invariant(
      suppliedRecords.every(Boolean),
      "Owner blockers 2-4 source-binding validation inputs are incomplete",
    );
    assertDescriptor(
      document.sourceBindingsAtIntake?.releaseManifest,
      descriptor(releaseManifestRecord),
      "Owner blockers 2-4 release-manifest binding",
    );
    assertDescriptor(
      document.sourceBindingsAtIntake?.sourceGapForensics,
      descriptor(sourceGapRecord),
      "Owner blockers 2-4 source-gap binding",
    );
    assertDescriptor(
      document.sourceBindingsAtIntake?.originalRuntimeOperatorAssignment,
      descriptor(operatorAssignmentRecord),
      "Owner blockers 2-4 operator-assignment binding",
    );
  }
  return document;
}

function validateReleaseManifest(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "release manifest is malformed",
  );
  const index = document.releases.findIndex(
    (release) => release?.releaseId === RELEASE_ID,
  );
  invariant(index >= 0, `${RELEASE_ID}: release is missing`);
  invariant(
    document.releases.filter((release) => release?.releaseId === RELEASE_ID)
      .length === 1,
    `${RELEASE_ID}: release is not unique`,
  );
  const release = document.releases[index];
  invariant(
    release.titleDisplay === "Number Lines" &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic",
    `${RELEASE_ID}: release identity drifted`,
  );
  invariant(
    release.expectedCounts?.members === 55 &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      Array.isArray(release.members) &&
      release.members.length === 55,
    `${RELEASE_ID}: release scope drifted`,
  );
  invariant(
    release.members.every((member, memberIndex) =>
      member.ordinal === memberIndex + 1),
    `${RELEASE_ID}: member order drifted`,
  );
  invariant(
    release.members.filter(
      ({releaseRole}) => releaseRole === "active-xml-referenced-page",
    ).length === 54 &&
      release.members.filter(
        ({releaseRole}) => releaseRole === "course-shell",
      ).length === 1,
    `${RELEASE_ID}: member role partition drifted`,
  );
  const releaseIds = new Set(release.members.map(({animationId}) => animationId));
  invariant(
    releaseIds.size === 55 &&
      WORK_STUDY_SCENARIOS.every(({animationId}) => releaseIds.has(animationId)),
    `${RELEASE_ID}: work-study scope is outside the release`,
  );
  return {release, index};
}

function validateSourceGap(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "lesson-release-source-gap-forensics" &&
      document.releaseId === RELEASE_ID,
    "source-gap report identity drifted",
  );
  const declarations = document.keytermGap?.declarations;
  invariant(
    document.keytermGap?.status ===
      "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root" &&
      Array.isArray(declarations) &&
      declarations.length === 2,
    "G5 L4 keyterm gap state drifted",
  );
  for (const expected of MISSING_KEYTERM_DEPENDENCIES) {
    const matches = declarations.filter(
      (declaration) =>
        declaration.language === expected.language &&
        declaration.path === expected.path,
    );
    invariant(
      matches.length === 1 &&
        matches[0].physicalPresence === false &&
        Array.isArray(matches[0].exactCatalogMatches) &&
        matches[0].exactCatalogMatches.length === 0 &&
        Array.isArray(matches[0].basenameCatalogMatches) &&
        matches[0].basenameCatalogMatches.length === 0,
      `${expected.path}: missing-dependency evidence drifted`,
    );
  }
  assertAllFalse(
    document.acceptanceEffects,
    [
      "authoritativeOriginalRuntime",
      "implementationAuthorized",
      "published",
      "releaseScopeChanged",
      "sourceGapClosed",
      "strictComplete",
    ],
    "source-gap acceptance boundary",
  );
  return declarations;
}

function validateOperatorReceipt(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType ===
        "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake" &&
      document.releaseId === RELEASE_ID,
    "operator-assignment receipt identity drifted",
  );
  invariant(
    document.assignment?.roleId === "authorized-original-runtime-operator" &&
      document.assignment.slot === "primary" &&
      document.assignment.assigneeFullName === "Dr. Peter Hu" &&
      document.assignment.samePersonAsOwner === true &&
      document.assignment.explicit === true &&
      JSON.stringify(document.assignment.duties) ===
        JSON.stringify([
          "authorized-original-runtime-human-operator",
          "adobe-animate-human-dialog-operator",
        ]),
    "operator-assignment role drifted",
  );
  invariant(
    document.authorityBoundary?.assignmentUserAttested === true &&
      document.authorityBoundary.namedHumanRoleAssignmentEstablished === true &&
      document.authorityBoundary.namedRoleSlotCountEffect === 1 &&
      document.authorityBoundary.strictAcceptanceEffect ===
        "named-primary-operator-role-only",
    "operator-assignment role boundary drifted",
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
    "operator-assignment execution boundary",
  );
  invariant(
    document.externalSignatureEnvelope === null,
    "operator receipt invented an external signature",
  );
}

function validateRuntimePlanning(document, records) {
  invariant(
    document?.schemaVersion === 2 &&
      document.reportType ===
        "release-runtime-acquisition-planning-readiness" &&
      document.identity?.releaseId === RELEASE_ID &&
      document.identity.titleDisplay === "Number Lines" &&
      document.identity.grade === 5 &&
      document.identity.lesson === 4 &&
      document.identity.releaseType === "complete-lesson" &&
      document.identity.publicationMode === "atomic" &&
      document.identity.shardId === null,
    "runtime-planning report identity drifted",
  );
  invariant(
    document.scope?.releaseMemberCount === 55 &&
      document.scope.selectedMemberCount === 55 &&
      document.scope.exactReleaseScopeValidated === true &&
      document.scope.exactPhysicalSourceIdentityValidated === true &&
      document.scope.exactWorkspaceIdentityValidated === true &&
      document.scope.canonicalFilesModified === false,
    "runtime-planning scope drifted",
  );
  invariant(
    document.summary?.selectedMemberCount === 55 &&
      document.summary.emptyWorksheetCount === 55 &&
      document.summary.runnableArtifactCount === 0 &&
      document.summary.runtimeSessionCount === 0 &&
      document.summary.authoritativeBaselineCount === 0 &&
      document.summary.acceptanceChangeCount === 0 &&
      document.summary.sessionOperatorAttestationCount === 0,
    "runtime-planning report was promoted",
  );
  invariant(
    document.gates?.machinePlanningArtifactsMaterialized === true &&
      document.gates.namedOperatorRoleAssignmentBound === true,
    "runtime-planning machine preparation is incomplete",
  );
  assertAllFalse(
    document.gates,
    [
      "audioRuntimeListeningComplete",
      "authoritativeBaselinesComplete",
      "authorizedOriginalRuntimeBound",
      "implementationAuthorized",
      "naturalTraceSchedulesComplete",
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
  const operator = document.namedOperatorRoleAssignment;
  invariant(
    operator?.roleId === "authorized-original-runtime-operator" &&
      operator.slot === "primary" &&
      operator.assigneeFullName === "Dr. Peter Hu" &&
      operator.requiredHoursPerWeek === 20 &&
      operator.committedHoursPerWeek === null,
    "runtime-planning operator role drifted",
  );
  assertAllFalse(
    operator,
    [
      "actualSessionOperatorAttestationPresent",
      "animateGuiExecutionAuthorized",
      "backupAssignmentEstablished",
      "containmentApproved",
      "cryptographicallyVerified",
      "immutableSessionAuthorizationEstablished",
      "originalRuntimeExecutionAuthorized",
      "runtimeHostApproved",
      "weeklyCapacityEstablished",
    ],
    "runtime-planning operator execution boundary",
  );
  assertDescriptor(
    document.provenance?.lessonReleaseCatalog,
    descriptor(records.releaseManifest),
    "runtime-planning release-manifest binding",
  );
  assertDescriptor(
    document.provenance?.namedOperatorAssignmentReceipt,
    descriptor(records.operatorAssignmentReceipt),
    "runtime-planning operator-receipt binding",
  );
}

function validateScenario(document, expected) {
  invariant(
    document?.schemaVersion === 1 &&
      document.animationId === expected.animationId &&
      document.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      document.migrationStatusChanged === false,
    `${expected.animationId}: scenario inventory identity drifted`,
  );
  invariant(
    Array.isArray(document.authoritativeRuntimeEvidence) &&
      document.authoritativeRuntimeEvidence.length === 0,
    `${expected.animationId}: scenario inventory claims runtime evidence`,
  );
  invariant(
    Array.isArray(document.authorityStatement) &&
      document.authorityStatement.some((statement) =>
        statement.includes("Static evidence does not prove")) &&
      document.authorityStatement.some((statement) =>
        statement.includes("No legacy network")) &&
      typeof document.strictAcceptanceEffect === "string" &&
      document.strictAcceptanceEffect.startsWith("none;"),
    `${expected.animationId}: scenario authority boundary drifted`,
  );
}

function containmentControls(runtimeMechanismReport) {
  return CONTROL_REQUIREMENTS.map(([controlId, requirement], index) => {
    const candidate = runtimeMechanismReport.controls[index];
    invariant(
      candidate?.controlId === controlId,
      `${controlId}: runtime-mechanism candidate order drifted`,
    );
    return {
      controlId,
      requirement,
      policyApproved: true,
      preparationAuthorized: true,
      selectedMechanism: candidate.selectedMechanism,
      candidateImplementationPresent:
        candidate.candidateImplementationPresent,
      offlineOrDiagnosticVerified:
        candidate.offlineOrDiagnosticVerified,
      ownerTechnicalApprovalEstablished:
        candidate.ownerTechnicalApprovalEstablished,
      liveSessionVerified: candidate.liveSessionVerified,
      approved: false,
      verified: false,
    };
  });
}

export async function buildG5L4OriginalRuntimeContainmentReadiness({
  projectRoot: projectRootOption = defaultProjectRoot,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {
    generator: await readFileRecord(projectRoot, GENERATOR_PATH, "generator"),
    releaseManifest: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.releaseManifest,
      "release manifest",
    ),
    sourceGapForensics: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.sourceGapForensics,
      "source-gap report",
    ),
    operatorAssignmentReceipt: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.operatorAssignmentReceipt,
      "operator-assignment receipt",
    ),
    ownerDefaultBlockersAuthorizationReceipt: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.ownerDefaultBlockersAuthorizationReceipt,
      "Owner blockers 2-4 authorization receipt",
    ),
    ownerWorkAuthorizationReceipt: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.ownerWorkAuthorizationReceipt,
      "Owner continuation/work authorization receipt",
    ),
    runtimePlanningReadiness: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.runtimePlanningReadiness,
      "runtime-planning report",
    ),
    runtimeMechanismCandidateReadiness: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.runtimeMechanismCandidateReadiness,
      "runtime-mechanism candidate report",
    ),
  };
  const scenarioRecords = [];
  for (const scenario of WORK_STUDY_SCENARIOS) {
    scenarioRecords.push({
      expected: scenario,
      record: await readJsonRecord(
        projectRoot,
        scenario.path,
        `${scenario.animationId} scenario inventory`,
      ),
    });
  }

  const {release, index} = validateReleaseManifest(
    records.releaseManifest.document,
  );
  const declarations = validateSourceGap(
    records.sourceGapForensics.document,
  );
  validateOperatorReceipt(records.operatorAssignmentReceipt.document);
  validateG5L4OwnerDefaultBlockersAuthorizationReceipt(
    records.ownerDefaultBlockersAuthorizationReceipt.document,
    {
      releaseManifestRecord: records.releaseManifest,
      sourceGapRecord: records.sourceGapForensics,
      operatorAssignmentRecord: records.operatorAssignmentReceipt,
    },
  );
  validateG5L4OwnerWorkAuthorizationReceipt(
    records.ownerWorkAuthorizationReceipt.document,
    {releaseManifest: records.releaseManifest.document},
  );
  validateRuntimePlanning(records.runtimePlanningReadiness.document, records);
  validateG5L4RuntimeMechanismCandidateReadiness(
    records.runtimeMechanismCandidateReadiness.document,
  );
  for (const {expected, record} of scenarioRecords) {
    validateScenario(record.document, expected);
  }

  const runtimeMechanismReport =
    records.runtimeMechanismCandidateReadiness.document;
  const controls = containmentControls(runtimeMechanismReport);
  const ownerWorkAuthorization = projectG5L4OwnerWorkAuthorization(
    records.ownerWorkAuthorizationReceipt.document,
    descriptor(records.ownerWorkAuthorizationReceipt),
  );
  const report = {
    schemaVersion: 1,
    reportType: "g5-l4-original-runtime-containment-readiness",
    releaseId: RELEASE_ID,
    evidenceState:
      "machine-only-containment-candidates-selected-offline-verified-runtime-execution-closed",
    authority:
      "This deterministic report binds the exact G5 L4 release, current source-gap and runtime-planning reports, the acceptance-neutral runtime-mechanism candidate report, the user-attested named-operator role receipt, the Owner blockers 2-4 default-policy authorization receipt, the later Owner continuation/work-authorization intake, and four static work-study scenario inventories. The later intake authorizes remaining in-scope machine and implementation work plus technical-mechanism selection/implementation work. Eight machine engineering candidates are selected and pass bounded offline or diagnostic checks; those facts are not Owner technical approval, live-session verification, an exact session authorization, a runnable runtime, or acceptance. This builder launches no GUI or runtime, approves no mechanism, authorizes no session, invents no missing dependency, establishes no original-runtime evidence, and changes no review, strict-completion, or publication gate.",
    generator: descriptor(records.generator),
    identity: {
      releaseId: RELEASE_ID,
      titleDisplay: "Number Lines",
      grade: 5,
      lesson: 4,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
    },
    scope: {
      releaseMemberCount: 55,
      activeXmlReferencedPageCount: 54,
      courseShellCount: 1,
      workStudyScenarioInventoryCount: 4,
      exactReleaseScopeBound: true,
      canonicalFilesModified: false,
    },
    sourceBindings: {
      releaseManifest: descriptor(records.releaseManifest, {
        schemaVersion: records.releaseManifest.document.schemaVersion,
        releaseJsonPointer: `/releases/${index}`,
      }),
      sourceGapForensics: descriptor(records.sourceGapForensics, {
        schemaVersion: records.sourceGapForensics.document.schemaVersion,
        reportType: records.sourceGapForensics.document.reportType,
      }),
      operatorAssignmentReceipt: descriptor(
        records.operatorAssignmentReceipt,
        {
          schemaVersion: records.operatorAssignmentReceipt.document.schemaVersion,
          evidenceType:
            records.operatorAssignmentReceipt.document.evidenceType,
          },
      ),
      ownerDefaultBlockersAuthorizationReceipt: descriptor(
        records.ownerDefaultBlockersAuthorizationReceipt,
        {
          schemaVersion:
            records.ownerDefaultBlockersAuthorizationReceipt.document
              .schemaVersion,
          evidenceType:
            records.ownerDefaultBlockersAuthorizationReceipt.document
              .evidenceType,
        },
      ),
      ownerWorkAuthorizationReceipt: descriptor(
        records.ownerWorkAuthorizationReceipt,
        {
          schemaVersion:
            records.ownerWorkAuthorizationReceipt.document.schemaVersion,
          evidenceType:
            records.ownerWorkAuthorizationReceipt.document.evidenceType,
        },
      ),
      runtimePlanningReadiness: descriptor(
        records.runtimePlanningReadiness,
        {
          schemaVersion: records.runtimePlanningReadiness.document.schemaVersion,
          reportType: records.runtimePlanningReadiness.document.reportType,
        },
      ),
      runtimeMechanismCandidateReadiness: descriptor(
        records.runtimeMechanismCandidateReadiness,
        {
          schemaVersion: runtimeMechanismReport.schemaVersion,
          reportType: runtimeMechanismReport.reportType,
          reportFingerprintSha256:
            runtimeMechanismReport.reportFingerprintSha256,
        },
      ),
      workStudyScenarioInventories: scenarioRecords.map(
        ({expected, record}) => descriptor(record, {
          schemaVersion: record.document.schemaVersion,
          animationId: expected.animationId,
          inventoryStatus: record.document.inventoryStatus,
        }),
      ),
    },
    ownerDefaultPolicyAuthorization: {
      receipt: descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
      ownerDirective: {
        captureBoundary:
          records.ownerDefaultBlockersAuthorizationReceipt.document
            .ownerStatement.captureBoundary,
        byteLength: 84,
        sha256: OWNER_DEFAULT_DIRECTIVE_SHA256,
      },
      blockerReferenceSet: {
        blockerNumbers: [2, 3, 4],
        byteLength: 434,
        sha256: OWNER_DEFAULT_BLOCKER_SET_SHA256,
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
    namedOperatorRole: {
      roleId: "authorized-original-runtime-operator",
      slot: "primary",
      assigneeFullName: "Dr. Peter Hu",
      identityBasis: "user-attested-current-codex-task",
      namedRoleAssignmentBound: true,
      requiredHoursPerWeek: 20,
      committedHoursPerWeek: null,
      portableExternalIdentityVerified: false,
      capacityEstablished: false,
      backupAssigned: false,
      runtimeHostApproved: false,
      containmentApproved: false,
      immutableSessionAuthorizationEstablished: false,
      sessionOperatorAttestationPresent: false,
      animateGuiExecutionAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
      actualAnimateExecutionEstablished: false,
      actualOriginalRuntimeSessionEstablished: false,
      strictAcceptanceEffect: "named-primary-operator-role-only",
    },
    hostTreeCandidate: {
      candidateClass:
        "materialized-incomplete-read-only-host-tree-candidate-only",
      partialHostTreeCandidate: true,
      readOnlyHostTreeMaterialized: true,
      path: runtimeMechanismReport.materializedCandidates.hostTree.path,
      manifestSha256:
        runtimeMechanismReport.materializedCandidates.hostTree.manifestSha256,
      fileSetSha256:
        runtimeMechanismReport.materializedCandidates.hostTree.fileSetSha256,
      fileCount: runtimeMechanismReport.materializedCandidates.hostTree.files,
      byteCount: runtimeMechanismReport.materializedCandidates.hostTree.bytes,
      runtimeSessionsExecuted: 0,
      cr02TechnicalArtifactComplete: false,
      cr02Approved: false,
      missingDeclaredDependencies: declarations.map((declaration) => ({
        language: declaration.language,
        path: declaration.path,
        physicalPresence: false,
        exactCatalogMatchCount: 0,
        basenameCatalogMatchCount: 0,
      })),
      inventedOrSubstitutedDependencyCount: 0,
      requiredDisposition:
        records.sourceGapForensics.document.keytermGap.requiredDisposition,
    },
    workStudyStaticInputs: scenarioRecords.map(({expected, record}) => ({
      animationId: expected.animationId,
      scenarioInventory: descriptor(record),
      inventoryStatus: "static-exhaustive-runtime-unverified",
      authoritativeRuntimeEvidenceCount: 0,
      unknownCount: Array.isArray(record.document.unknowns)
        ? record.document.unknowns.length
        : 0,
      conflictCount: Array.isArray(record.document.conflicts)
        ? record.document.conflicts.length
        : 0,
      migrationStatusChanged: false,
      strictAcceptanceEffect: record.document.strictAcceptanceEffect,
    })),
    containmentPlan: {
      state:
        "fail-closed-machine-candidate-mechanisms-selected-offline-verified-owner-approval-live-verification-absent",
      policyApproved: true,
      preparationAuthorized: true,
      controls,
      controlsSpecified: 8,
      policyApprovedControlCount: 8,
      preparationAuthorizedControlCount: 8,
      controlsWithSelectedMechanism: 8,
      candidateImplementationPresentControlCount: 8,
      offlineOrDiagnosticVerifiedControlCount: 8,
      ownerTechnicalApprovalControlCount: 0,
      liveSessionVerifiedControlCount: 0,
      controlsApproved: 0,
      controlsVerified: 0,
      allowedOutboundDestinations: [],
      legacyEndpointAllowlist: [],
      runtimeProfilePath: null,
      readOnlyLessonTreePath: null,
      launchPath: null,
      launchCommand: null,
      exactHostIdentifier: null,
      stopConditions: [],
      ownerExecutionAuthorization: null,
    },
    executionGate: {
      state:
        "closed-machine-candidates-only-owner-live-session-and-exact-authorization-absent",
      runnable: false,
      machineOnlyPreparation: true,
      failClosedDefaultPolicyApproved: true,
      preparationAuthorized: true,
      unsignedPendingOwnerSignaturePackagePreparationAuthorized: true,
      exactReleaseScopeBound: true,
      sourceGapBound: true,
      currentRuntimePlanningBound: true,
      workStudyScenarioInventoriesBound: true,
      partialHostTreeCandidateBound: true,
      runtimeMechanismCandidateReportBound: true,
      materializedIncompleteReadOnlyHostTreeCandidateBound: true,
      materializedEmptyRuntimeProfileCandidateCount: 2,
      cr02TechnicalArtifactComplete: false,
      containmentMechanismsSelected: true,
      candidateImplementationsPresent: true,
      offlineOrDiagnosticChecksPassed: true,
      ownerTechnicalApprovalsEstablished: false,
      liveSessionVerificationEstablished: false,
      productionLauncherEnabled: false,
      liveObserverSupervisorImplemented: false,
      freshProjectorAbsencePassed: false,
      immutableExactSessionAuthorizationPresent: false,
      containmentControlsApproved: false,
      containmentControlsVerified: false,
      namedOriginalRuntimeOperatorRoleBound: true,
      operatorCapacityEstablished: false,
      authorizedHostContextIdentified: false,
      immutableSessionAuthorizationBound: false,
      sessionOperatorAttestationBound: false,
      ownerRuntimeApprovalBound: false,
      launchesGuiByThisBuilder: false,
      launchesRuntimeByThisBuilder: false,
      executesLegacyEndpointsByThisBuilder: false,
      originalRuntimeExecutionReady: false,
    },
    summary: {
      releaseMemberCount: release.members.length,
      workStudyScenarioInventoryCount: 4,
      missingDeclaredDependencyCount: 2,
      partialHostTreeCandidateCount: 1,
      materializedIncompleteReadOnlyHostTreeCandidateCount: 1,
      materializedEmptyRuntimeProfileCandidateCount: 2,
      completeReadOnlyHostTreeCount: 0,
      ownerDefaultPolicyAuthorizationReceiptCount: 1,
      ownerWorkAuthorizationReceiptCount: 1,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      containmentControlsSpecified: 8,
      policyApprovedControlCount: 8,
      preparationAuthorizedControlCount: 8,
      containmentMechanismsSelected: 8,
      containmentCandidateImplementationsPresent: 8,
      containmentOfflineOrDiagnosticVerified: 8,
      containmentOwnerTechnicalApprovals: 0,
      containmentLiveSessionVerified: 0,
      containmentControlsApproved: 0,
      containmentControlsVerified: 0,
      runnableArtifactCount: 0,
      guiSessionsExecuted: 0,
      animateGuiExecutions: 0,
      originalRuntimeSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      acceptedAudioListeningSessions: 0,
      humanReviewsAccepted: 0,
      ownerFidelityAcceptances: 0,
      strictCompletions: 0,
      publications: 0,
    },
    acceptanceEffects: {
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
    strictAcceptanceEffect:
      "none; eight machine-selected containment candidates, bounded offline or diagnostic checks, a materialized but incomplete read-only host-tree candidate, and empty disposable profile candidates do not establish Owner technical approval, live verification, a runnable or authorized runtime session, a baseline, review, strict completion, or publication",
  };

  report.reportFingerprintSha256 = sha256Bytes(
    Buffer.from(stableJson(report)),
  );
  validateG5L4OriginalRuntimeContainmentReadiness(report);
  return report;
}

export function validateG5L4OriginalRuntimeContainmentReadiness(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l4-original-runtime-containment-readiness" &&
      report.releaseId === RELEASE_ID,
    "containment report identity drifted",
  );
  invariant(
    report.evidenceState ===
      "machine-only-containment-candidates-selected-offline-verified-runtime-execution-closed" &&
      report.identity?.releaseId === RELEASE_ID &&
      report.identity.titleDisplay === "Number Lines" &&
      report.identity.grade === 5 &&
      report.identity.lesson === 4 &&
      report.identity.releaseType === "complete-lesson" &&
      report.identity.publicationMode === "atomic",
    "containment report release identity drifted",
  );
  invariant(
    report.scope?.releaseMemberCount === 55 &&
      report.scope.activeXmlReferencedPageCount === 54 &&
      report.scope.courseShellCount === 1 &&
      report.scope.workStudyScenarioInventoryCount === 4 &&
      report.scope.exactReleaseScopeBound === true &&
      report.scope.canonicalFilesModified === false,
    "containment report scope drifted",
  );
  invariant(
    report.generator?.path === GENERATOR_PATH &&
      Number.isInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      SHA256.test(report.generator.sha256 || ""),
    "containment generator binding drifted",
  );
  invariant(
    report.sourceBindings?.releaseManifest?.path ===
        INPUT_PATHS.releaseManifest &&
      report.sourceBindings.releaseManifest.releaseJsonPointer ===
        "/releases/1" &&
      report.sourceBindings.sourceGapForensics?.path ===
        INPUT_PATHS.sourceGapForensics &&
      report.sourceBindings.operatorAssignmentReceipt?.path ===
        INPUT_PATHS.operatorAssignmentReceipt &&
      report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt?.path ===
        INPUT_PATHS.ownerDefaultBlockersAuthorizationReceipt &&
      report.sourceBindings.runtimePlanningReadiness?.path ===
        INPUT_PATHS.runtimePlanningReadiness &&
      report.sourceBindings.runtimeMechanismCandidateReadiness?.path ===
        INPUT_PATHS.runtimeMechanismCandidateReadiness &&
      report.sourceBindings.runtimeMechanismCandidateReadiness.reportType ===
        "g5-l4-runtime-mechanism-candidate-readiness" &&
      SHA256.test(
        report.sourceBindings.runtimeMechanismCandidateReadiness
          .reportFingerprintSha256 || "",
      ) &&
      [
        report.sourceBindings.releaseManifest,
        report.sourceBindings.sourceGapForensics,
        report.sourceBindings.operatorAssignmentReceipt,
        report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt,
        report.sourceBindings.runtimePlanningReadiness,
        report.sourceBindings.runtimeMechanismCandidateReadiness,
      ].every((binding) =>
        Number.isInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256.test(binding.sha256 || "")),
    "containment primary input bindings drifted",
  );
  const ownerWorkAuthorizationPresent =
    report.sourceBindings.ownerWorkAuthorizationReceipt !== undefined ||
    report.ownerWorkAuthorization !== undefined;
  invariant(
    ownerWorkAuthorizationPresent ===
      (report.sourceBindings.ownerWorkAuthorizationReceipt !== undefined &&
        report.ownerWorkAuthorization !== undefined),
    "Owner work authorization projection is only partially present",
  );
  assertExactKeys(
    report,
    [
      "schemaVersion", "reportType", "releaseId", "evidenceState", "authority",
      "generator", "identity", "scope", "sourceBindings",
      "ownerDefaultPolicyAuthorization",
      ...(ownerWorkAuthorizationPresent ? ["ownerWorkAuthorization"] : []),
      "namedOperatorRole", "hostTreeCandidate", "workStudyStaticInputs",
      "containmentPlan", "executionGate", "summary", "acceptanceEffects",
      "strictAcceptanceEffect", "reportFingerprintSha256",
    ],
    "containment report",
  );
  assertNoG5L4ProtectedGatePromotion(report, {
    label: "containment report",
  });
  if (ownerWorkAuthorizationPresent) {
    invariant(
      report.sourceBindings.ownerWorkAuthorizationReceipt.path ===
        INPUT_PATHS.ownerWorkAuthorizationReceipt &&
        Number.isInteger(
          report.sourceBindings.ownerWorkAuthorizationReceipt.bytes,
        ) &&
        report.sourceBindings.ownerWorkAuthorizationReceipt.bytes > 0 &&
        SHA256.test(
          report.sourceBindings.ownerWorkAuthorizationReceipt.sha256 || "",
        ),
      "Owner work authorization input binding drifted",
    );
  }
  const scenarioBindings =
    report.sourceBindings?.workStudyScenarioInventories;
  invariant(
    Array.isArray(scenarioBindings) &&
      scenarioBindings.length === 4 &&
      scenarioBindings.every((binding, index) =>
        binding.path === WORK_STUDY_SCENARIOS[index].path &&
        binding.animationId === WORK_STUDY_SCENARIOS[index].animationId &&
        binding.inventoryStatus ===
          "static-exhaustive-runtime-unverified" &&
        Number.isInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256.test(binding.sha256 || "")),
    "work-study scenario bindings drifted",
  );
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
      policy.ownerDirective.sha256 === OWNER_DEFAULT_DIRECTIVE_SHA256 &&
      JSON.stringify(policy.blockerReferenceSet?.blockerNumbers) ===
        JSON.stringify([2, 3, 4]) &&
      policy.blockerReferenceSet.byteLength === 434 &&
      policy.blockerReferenceSet.sha256 ===
        OWNER_DEFAULT_BLOCKER_SET_SHA256 &&
      policy.strictAcceptanceEffect ===
        "prospective-fail-closed-policy-and-preparation-only",
    "Owner default-policy authorization projection drifted",
  );
  assertDescriptor(
    policy.receipt,
    report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt,
    "Owner default-policy authorization receipt",
  );
  assertAllFalse(
    policy,
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
    "Owner default-policy technical/execution/acceptance boundary",
  );
  if (ownerWorkAuthorizationPresent) {
    validateG5L4OwnerWorkAuthorizationProjection(
      report.ownerWorkAuthorization,
      report.sourceBindings.ownerWorkAuthorizationReceipt,
    );
  }
  invariant(
    report.namedOperatorRole?.roleId ===
        "authorized-original-runtime-operator" &&
      report.namedOperatorRole.slot === "primary" &&
      report.namedOperatorRole.assigneeFullName === "Dr. Peter Hu" &&
      report.namedOperatorRole.namedRoleAssignmentBound === true &&
      report.namedOperatorRole.requiredHoursPerWeek === 20 &&
      report.namedOperatorRole.committedHoursPerWeek === null &&
      report.namedOperatorRole.strictAcceptanceEffect ===
        "named-primary-operator-role-only",
    "named-operator role drifted",
  );
  assertAllFalse(
    report.namedOperatorRole,
    [
      "portableExternalIdentityVerified",
      "capacityEstablished",
      "backupAssigned",
      "runtimeHostApproved",
      "containmentApproved",
      "immutableSessionAuthorizationEstablished",
      "sessionOperatorAttestationPresent",
      "animateGuiExecutionAuthorized",
      "originalRuntimeExecutionAuthorized",
      "actualAnimateExecutionEstablished",
      "actualOriginalRuntimeSessionEstablished",
    ],
    "named-operator execution boundary",
  );
  invariant(
    report.hostTreeCandidate?.candidateClass ===
        "materialized-incomplete-read-only-host-tree-candidate-only" &&
      report.hostTreeCandidate.partialHostTreeCandidate === true &&
      report.hostTreeCandidate.readOnlyHostTreeMaterialized === true &&
      report.hostTreeCandidate.path ===
        "work/original-runtime-host-trees/g5-l4-shell-rw002/root" &&
      SHA256.test(report.hostTreeCandidate.manifestSha256 || "") &&
      SHA256.test(report.hostTreeCandidate.fileSetSha256 || "") &&
      report.hostTreeCandidate.fileCount === 7 &&
      Number.isSafeInteger(report.hostTreeCandidate.byteCount) &&
      report.hostTreeCandidate.byteCount > 0 &&
      report.hostTreeCandidate.runtimeSessionsExecuted === 0 &&
      report.hostTreeCandidate.cr02TechnicalArtifactComplete === false &&
      report.hostTreeCandidate.cr02Approved === false &&
      report.hostTreeCandidate.inventedOrSubstitutedDependencyCount === 0,
    "host-tree candidate was completed or promoted",
  );
  const missing = report.hostTreeCandidate.missingDeclaredDependencies;
  invariant(
    Array.isArray(missing) &&
      missing.length === 2 &&
      missing.every((dependency, index) =>
        dependency.language ===
          MISSING_KEYTERM_DEPENDENCIES[index].language &&
        dependency.path === MISSING_KEYTERM_DEPENDENCIES[index].path &&
        dependency.physicalPresence === false &&
        dependency.exactCatalogMatchCount === 0 &&
        dependency.basenameCatalogMatchCount === 0),
    "L4KTE01.xml/L4KTS01.xml missing-dependency boundary drifted",
  );
  invariant(
    Array.isArray(report.workStudyStaticInputs) &&
      report.workStudyStaticInputs.length === 4 &&
      report.workStudyStaticInputs.every((entry, index) =>
        entry.animationId === WORK_STUDY_SCENARIOS[index].animationId &&
        entry.scenarioInventory?.path === WORK_STUDY_SCENARIOS[index].path &&
        entry.inventoryStatus ===
          "static-exhaustive-runtime-unverified" &&
        entry.authoritativeRuntimeEvidenceCount === 0 &&
        entry.migrationStatusChanged === false &&
        typeof entry.strictAcceptanceEffect === "string" &&
        entry.strictAcceptanceEffect.startsWith("none;")),
    "work-study static evidence was promoted",
  );
  const controls = report.containmentPlan?.controls;
  invariant(
    report.containmentPlan?.state ===
        "fail-closed-machine-candidate-mechanisms-selected-offline-verified-owner-approval-live-verification-absent" &&
      report.containmentPlan.policyApproved === true &&
      report.containmentPlan.preparationAuthorized === true &&
      Array.isArray(controls) &&
      controls.length === 8 &&
      controls.every((control, index) =>
        control.controlId === `CR-${String(index + 1).padStart(2, "0")}` &&
        control.requirement === CONTROL_REQUIREMENTS[index][1] &&
        control.policyApproved === true &&
        control.preparationAuthorized === true &&
        typeof control.selectedMechanism === "string" &&
        control.selectedMechanism.length > 10 &&
        control.candidateImplementationPresent === true &&
        control.offlineOrDiagnosticVerified === true &&
        control.ownerTechnicalApprovalEstablished === false &&
        control.liveSessionVerified === false &&
        control.approved === false &&
        control.verified === false) &&
      report.containmentPlan.controlsSpecified === 8 &&
      report.containmentPlan.policyApprovedControlCount === 8 &&
      report.containmentPlan.preparationAuthorizedControlCount === 8 &&
      report.containmentPlan.controlsWithSelectedMechanism === 8 &&
      report.containmentPlan.candidateImplementationPresentControlCount === 8 &&
      report.containmentPlan.offlineOrDiagnosticVerifiedControlCount === 8 &&
      report.containmentPlan.ownerTechnicalApprovalControlCount === 0 &&
      report.containmentPlan.liveSessionVerifiedControlCount === 0 &&
      report.containmentPlan.controlsApproved === 0 &&
      report.containmentPlan.controlsVerified === 0 &&
      report.containmentPlan.allowedOutboundDestinations?.length === 0 &&
      report.containmentPlan.legacyEndpointAllowlist?.length === 0 &&
      report.containmentPlan.runtimeProfilePath === null &&
      report.containmentPlan.readOnlyLessonTreePath === null &&
      report.containmentPlan.launchPath === null &&
      report.containmentPlan.launchCommand === null &&
      report.containmentPlan.exactHostIdentifier === null &&
      report.containmentPlan.stopConditions?.length === 0 &&
      report.containmentPlan.ownerExecutionAuthorization === null,
    "containment machine-candidate, approval, verification, or execution boundary drifted",
  );
  const gate = report.executionGate;
  invariant(
    gate?.state ===
        "closed-machine-candidates-only-owner-live-session-and-exact-authorization-absent" &&
      gate.runnable === false &&
      gate.machineOnlyPreparation === true &&
      gate.failClosedDefaultPolicyApproved === true &&
      gate.preparationAuthorized === true &&
      gate.unsignedPendingOwnerSignaturePackagePreparationAuthorized === true &&
      gate.exactReleaseScopeBound === true &&
      gate.sourceGapBound === true &&
      gate.currentRuntimePlanningBound === true &&
      gate.workStudyScenarioInventoriesBound === true &&
      gate.partialHostTreeCandidateBound === true &&
      gate.runtimeMechanismCandidateReportBound === true &&
      gate.materializedIncompleteReadOnlyHostTreeCandidateBound === true &&
      gate.materializedEmptyRuntimeProfileCandidateCount === 2 &&
      gate.containmentMechanismsSelected === true &&
      gate.candidateImplementationsPresent === true &&
      gate.offlineOrDiagnosticChecksPassed === true &&
      gate.namedOriginalRuntimeOperatorRoleBound === true,
    "execution gate identity drifted",
  );
  assertAllFalse(
    gate,
    [
      "cr02TechnicalArtifactComplete",
      "ownerTechnicalApprovalsEstablished",
      "liveSessionVerificationEstablished",
      "productionLauncherEnabled",
      "liveObserverSupervisorImplemented",
      "freshProjectorAbsencePassed",
      "immutableExactSessionAuthorizationPresent",
      "containmentControlsApproved",
      "containmentControlsVerified",
      "operatorCapacityEstablished",
      "authorizedHostContextIdentified",
      "immutableSessionAuthorizationBound",
      "sessionOperatorAttestationBound",
      "ownerRuntimeApprovalBound",
      "launchesGuiByThisBuilder",
      "launchesRuntimeByThisBuilder",
      "executesLegacyEndpointsByThisBuilder",
      "originalRuntimeExecutionReady",
    ],
    "execution gate",
  );
  const zeroSummaryKeys = [
    "completeReadOnlyHostTreeCount",
    "containmentOwnerTechnicalApprovals",
    "containmentLiveSessionVerified",
    "containmentControlsApproved",
    "containmentControlsVerified",
    "runnableArtifactCount",
    "guiSessionsExecuted",
    "animateGuiExecutions",
    "originalRuntimeSessionsExecuted",
    "authoritativeBaselinePackagesEstablished",
    "acceptedAudioListeningSessions",
    "humanReviewsAccepted",
    "ownerFidelityAcceptances",
    "strictCompletions",
    "publications",
  ];
  assertExactKeys(
    report.summary,
    [
      "releaseMemberCount", "workStudyScenarioInventoryCount",
      "missingDeclaredDependencyCount", "partialHostTreeCandidateCount",
      "materializedIncompleteReadOnlyHostTreeCandidateCount",
      "materializedEmptyRuntimeProfileCandidateCount",
      "completeReadOnlyHostTreeCount", "ownerDefaultPolicyAuthorizationReceiptCount",
      ...(ownerWorkAuthorizationPresent
        ? ["ownerWorkAuthorizationReceiptCount", "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized"]
        : []),
      "containmentControlsSpecified", "policyApprovedControlCount",
      "preparationAuthorizedControlCount", "containmentMechanismsSelected",
      "containmentCandidateImplementationsPresent",
      "containmentOfflineOrDiagnosticVerified",
      "containmentOwnerTechnicalApprovals",
      "containmentLiveSessionVerified",
      "containmentControlsApproved", "containmentControlsVerified",
      "runnableArtifactCount", "guiSessionsExecuted", "animateGuiExecutions",
      "originalRuntimeSessionsExecuted", "authoritativeBaselinePackagesEstablished",
      "acceptedAudioListeningSessions", "humanReviewsAccepted",
      "ownerFidelityAcceptances", "strictCompletions", "publications",
    ],
    "containment summary",
  );
  invariant(
    report.summary?.releaseMemberCount === 55 &&
      report.summary.workStudyScenarioInventoryCount === 4 &&
      report.summary.missingDeclaredDependencyCount === 2 &&
      report.summary.partialHostTreeCandidateCount === 1 &&
      report.summary.materializedIncompleteReadOnlyHostTreeCandidateCount === 1 &&
      report.summary.materializedEmptyRuntimeProfileCandidateCount === 2 &&
      report.summary.ownerDefaultPolicyAuthorizationReceiptCount === 1 &&
      (ownerWorkAuthorizationPresent
        ? report.summary.ownerWorkAuthorizationReceiptCount === 1 &&
          report.summary.implementationWorkAuthorized === true &&
          report.summary.runtimeExecutionWorkAuthorized === true
        : report.summary.ownerWorkAuthorizationReceiptCount === undefined &&
          report.summary.implementationWorkAuthorized === undefined &&
          report.summary.runtimeExecutionWorkAuthorized === undefined) &&
      report.summary.containmentControlsSpecified === 8 &&
      report.summary.policyApprovedControlCount === 8 &&
      report.summary.preparationAuthorizedControlCount === 8 &&
      report.summary.containmentMechanismsSelected === 8 &&
      report.summary.containmentCandidateImplementationsPresent === 8 &&
      report.summary.containmentOfflineOrDiagnosticVerified === 8 &&
      zeroSummaryKeys.every((key) => report.summary[key] === 0),
    "containment summary was promoted",
  );
  assertExactKeys(
    report.acceptanceEffects,
    [
      "authoritativeOriginalRuntime", "audioAccepted", "behaviorAccepted",
      "fullFrameAccepted", "humanReviewAccepted", "implementationAuthorized",
      "ownerFidelityAccepted", "published", "rendererSelected", "rmseAccepted",
      "strictComplete",
    ],
    "containment acceptance effects",
  );
  invariant(
    Object.values(report.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "containment report changed an acceptance gate",
  );
  invariant(
    typeof report.strictAcceptanceEffect === "string" &&
      report.strictAcceptanceEffect.startsWith("none;"),
    "containment report claims strict acceptance",
  );
  const fingerprint = report.reportFingerprintSha256;
  invariant(
    SHA256.test(fingerprint || ""),
    "containment report fingerprint is missing",
  );
  const copy = {...report};
  delete copy.reportFingerprintSha256;
  invariant(
    fingerprint === sha256Bytes(Buffer.from(stableJson(copy))),
    "containment report fingerprint drifted",
  );
  return report;
}

export function renderMarkdown(report) {
  validateG5L4OriginalRuntimeContainmentReadiness(report);
  const controls = report.containmentPlan.controls
    .map((control) =>
      `| ${control.controlId} | ${control.requirement} | yes | yes | ${control.selectedMechanism} | yes | yes | no | no |`)
    .join("\n");
  const scenarios = report.workStudyStaticInputs
    .map((entry) =>
      `| ${entry.animationId} | ${entry.inventoryStatus} | ${entry.authoritativeRuntimeEvidenceCount} |`)
    .join("\n");
  return `# G5 L4 Original-Runtime Containment Readiness

Release: \`${report.releaseId}\` — **Number Lines**  
State: **fail-closed; machine candidates selected and offline checked; not runnable**

This report binds the exact 55-member atomic release, the current source-gap and
runtime-planning and runtime-mechanism candidate reports, Dr. Peter Hu's named
primary operator-role assignment, the Owner blockers 2–4 default-policy
authorization receipt, and four static work-study scenario inventories. It
launches no GUI or runtime. The eight selected mechanisms are acceptance-neutral
machine engineering candidates, not Owner technical approvals, live verification,
session authorization, fidelity, review, strict-completion, or publication
authority.

## Owner default-policy boundary

- Referenced blockers: **2, 3, and 4**
- Fail-closed policy approved: **true**
- Machine and unsigned pending-Owner-signature package preparation authorized: **true**
- Machine-selected candidates / candidate implementations / offline checks: **8 / 8 / 8**
- Owner technical approvals / live-session verification: **0 / 0**
- Missing-dependency substitution authorized: **false**
- Runtime host / immutable session / runtime execution authorized: **false / false / false**
- Human review / Owner fidelity / strict-validation / atomic publication accepted: **false / false / false / false**

## Host-tree boundary

- Candidate class: **materialized but incomplete read-only host-tree candidate only**
- CR-02 technical artifact complete: **false**
- Read-only host tree candidate materialized: **true** (7 hash-bound files)
- Missing declared dependency: \`HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml\`
- Missing declared dependency: \`HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml\`
- Invented or substituted dependencies: **0**

## Named operator boundary

- Role: \`authorized-original-runtime-operator\`
- Assignee: **Dr. Peter Hu**
- Capacity established: **false**
- Runtime host approved: **false**
- Immutable session authorization: **false**
- Session attestation: **false**
- Original-runtime execution authorized: **false**

## Containment requirements

| Control | Requirement | Policy approved | Preparation authorized | Machine-selected candidate | Candidate present | Offline/diagnostic checked | Owner approved | Live verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${controls}

Result: **8 specified / 8 policy-approved / 8 preparation-authorized / 8 machine-selected / 8 candidate-present / 8 offline-checked / 0 Owner-approved / 0 live-verified**.

## Work-study static inputs

| Animation | Inventory status | Authoritative runtime evidence |
| --- | --- | ---: |
${scenarios}

## Closed execution and acceptance gates

- Runnable artifacts: **0**
- GUI sessions / Animate executions / original-runtime sessions: **0 / 0 / 0**
- Authoritative baseline packages / accepted audio listening sessions: **0 / 0**
- Human reviews / Owner fidelity acceptances: **0 / 0**
- Strict completions / publications: **0 / 0**

Strict acceptance effect: **none**. Human/Owner/original-runtime requirements
remain outside this machine-only builder.
`;
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
    json: resolveProjectPath(projectRoot, `${outputPrefix}.json`, "JSON output"),
    markdown: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.md`,
      "Markdown output",
    ),
  };
}

async function ensureSafeDirectoryPath(projectRoot, directory, create) {
  const relative = path.relative(projectRoot, directory);
  invariant(
    isWithin(projectRoot, directory),
    "output directory escapes project root",
  );
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
  const metadata = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relative}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(file);
  const after = await assertOrdinaryFile(file, `${relative} output target`);
  invariant(
    metadata.dev === after.dev &&
      metadata.ino === after.ino &&
      metadata.mtimeMs === after.mtimeMs &&
      contents.length === after.size,
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
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
  transactionHook = null,
} = {}) {
  validateG5L4OriginalRuntimeContainmentReadiness(report);
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
        "containment JSON output",
      ),
      readFileRecord(
        projectRoot,
        portable(path.relative(projectRoot, outputs.markdown)),
        "containment Markdown output",
      ),
    ]);
    invariant(
      json.contents.toString("utf8") === expected.json,
      "containment JSON output is stale",
    );
    invariant(
      markdown.contents.toString("utf8") === expected.markdown,
      "containment Markdown output is stale",
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
      const temporary = await assertOrdinaryFile(
        entry.temporary,
        `${portable(path.relative(projectRoot, entry.temporary))} temporary output`,
      );
      invariant(
        temporary.size === Buffer.byteLength(entry.contents),
        `${portable(path.relative(projectRoot, entry.temporary))}: temporary output size drifted`,
      );
      prepared.push(entry);
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
        "containment report transaction failed and rollback did not complete",
      );
    }
    throw error;
  }

  const [json, markdown] = await Promise.all([
    readFileRecord(
      projectRoot,
      portable(path.relative(projectRoot, outputs.json)),
      "containment JSON output",
    ),
    readFileRecord(
      projectRoot,
      portable(path.relative(projectRoot, outputs.markdown)),
      "containment Markdown output",
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
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--output-prefix") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("--"),
        "--output-prefix requires a value",
      );
      options.outputPrefix = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  outputPaths(defaultProjectRoot, options.outputPrefix);
  return options;
}

function usage() {
  return `Usage: node scripts/build-g5-l4-original-runtime-containment-readiness.mjs [options]

Options:
  --check                    Verify JSON and Markdown without writing
  --output-prefix <path>     Extensionless project-relative prefix below reports/
  --help                     Show this help

The command reads static G5 L4 evidence and writes only a fail-closed containment
readiness pair. It records eight acceptance-neutral machine-selected engineering
candidates, launches no GUI/runtime, executes no legacy endpoint, approves or
live-verifies no containment mechanism, and changes no acceptance or release gate.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const report =
      await buildG5L4OriginalRuntimeContainmentReadiness();
    const result = await writeOrCheck({report, ...options});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      releaseId: RELEASE_ID,
      runnable: report.executionGate.runnable,
      partialHostTreeCandidate:
        report.hostTreeCandidate.partialHostTreeCandidate,
      cr02TechnicalArtifactComplete:
        report.hostTreeCandidate.cr02TechnicalArtifactComplete,
      policyApproved:
        report.ownerDefaultPolicyAuthorization.policyApproved,
      preparationAuthorized:
        report.ownerDefaultPolicyAuthorization.preparationAuthorized,
      controlsSpecified: report.summary.containmentControlsSpecified,
      controlsWithSelectedMechanism:
        report.summary.containmentMechanismsSelected,
      controlsApproved: report.summary.containmentControlsApproved,
      originalRuntimeSessions:
        report.summary.originalRuntimeSessionsExecuted,
      strictCompletions: report.summary.strictCompletions,
      publications: report.summary.publications,
      outputs: result.outputs,
    }, null, 2)}\n`);
  }
}
