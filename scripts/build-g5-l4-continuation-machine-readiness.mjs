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
  buildG5L4OriginalRuntimeContainmentReadiness,
  stableJson as containmentStableJson,
  validateG5L4OriginalRuntimeContainmentReadiness,
  validateG5L4OwnerDefaultBlockersAuthorizationReceipt,
} from "./build-g5-l4-original-runtime-containment-readiness.mjs";
import {
  buildG5L4M1MachineFoundationReadiness,
  stableJson as m1StableJson,
  validateG5L4M1MachineFoundationReport,
} from "./build-g5-l4-m1-machine-foundation-readiness.mjs";
import {
  buildG5L4MissingKeytermRecoveryReadiness,
  stableJson as recoveryStableJson,
  validateG5L4MissingKeytermRecoveryReadiness,
} from "./build-g5-l4-missing-keyterm-recovery-readiness.mjs";
import {
  buildReport as buildG5L4SpecificationReadiness,
  stableJson as specificationStableJson,
} from "./build-g5-l4-specification-readiness.mjs";
import {
  buildG5L4PerSessionAuthorizationPreparation,
  stableJson as sessionStableJson,
  validateG5L4PerSessionAuthorizationPreparation,
} from "./build-g5-l4-per-session-authorization-preparation.mjs";
import {
  buildG5L4ReviewWorkflowPreparation,
  stableJson as reviewStableJson,
  validateG5L4ReviewWorkflowPreparation,
} from "./build-g5-l4-review-workflow-preparation.mjs";
import {
  validateReceiptDocument as validateCombinedKeytermsProductReferenceSuccessor,
} from "./verify-g5-l4-combined-keyterms-product-reference-successor.mjs";
import {
  validateSuccessorReceipt as validateSourceDerivedKeyframeCandidateSuccessor,
} from "./materialize-g5-l4-source-derived-keyframe-candidates.mjs";
import {
  checkFq23QaSuccessor,
} from "./check-g5-l4-current-js-fq23-companion-qa-successor.mjs";
import {
  checkWholeLessonQaSuccessor,
} from "./check-g5-l4-current-js-whole-lesson-product-qa-successor.mjs";
import {
  validateFqSuccessorReceipt,
  validateWholeLessonSuccessorReceipt,
} from "./lib/g5-l4-current-js-qa-successor.mjs";
import {
  buildReport as buildSourceGapReport,
  stableJson as sourceGapStableJson,
} from "./build-lesson-source-gap-forensics.mjs";
import {
  G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  assertNoG5L4ProtectedGatePromotion,
  projectG5L4OwnerWorkAuthorization,
  validateG5L4OwnerWorkAuthorizationProjection,
  validateG5L4OwnerWorkAuthorizationReceipt,
} from "./lib/g5-l4-owner-work-authorization.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l4-continuation-machine-readiness.mjs";
const RELEASE_ID = "lesson-g05-l04-number-lines";
const DEFAULT_OUTPUT_PREFIX =
  "reports/g5-l4-continuation-machine-readiness";
const STANDALONE_PACKAGE_MANIFEST_PATH =
  "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64/package-manifest.json";
const SHA256 = /^[a-f0-9]{64}$/;
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

const INPUT_PATHS = Object.freeze({
  ownerDefaultBlockersAuthorizationReceipt:
    "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  ownerWorkAuthorizationReceipt: G5_L4_OWNER_WORK_AUTHORIZATION_PATH,
  originalRuntimeContainmentReadiness:
    "reports/g5-l4-original-runtime-containment-readiness.json",
  m1MachineFoundationReadiness:
    "reports/g5-l4-m1-machine-foundation-readiness.json",
  sourceGapForensics: "reports/g5-l4-source-gap-forensics.json",
  missingKeytermRecoveryReadiness:
    "reports/g5-l4-missing-keyterm-recovery-readiness.json",
  specificationReadiness: "reports/g5-l4-specification-readiness.json",
  perSessionAuthorizationPreparation:
    "reports/g5-l4-per-session-authorization-preparation.json",
  reviewWorkflowPreparation:
    "reports/g5-l4-review-workflow-preparation.json",
  currentJsImplementationAuthorization:
    "catalog/owner-authorizations/g5-l4-current-js-implementation-authorization-2026-07-29.json",
  combinedKeytermsProductReferenceSuccessor:
    "catalog/owner-authorizations/g5-l4-combined-keyterms-product-reference-successor-2026-07-30.json",
  sourceDerivedKeyframeCandidateSuccessor:
    "reports/g5-l4-source-derived-keyframe-candidate-successor-receipt.json",
  currentJsFq23CompanionQa:
    "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4.json",
  currentJsWholeLessonProductQa:
    "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4.json",
  standalonePackageSmoke:
    "reports/g5-l4-whole-lesson-package-mvp-v6-smoke.json",
});

const INPUT_KEYS = Object.freeze(Object.keys(INPUT_PATHS));
const UPSTREAM_REBUILD_CHECK_COUNT = 7;
const SUPPLEMENTAL_EVIDENCE_VALIDATOR_COUNT = 6;
const LEGACY_AUTHORITY =
  "This deterministic continuation report re-hashes and fresh-rebuilds the current G5 L4 machine-only preparation chain and separately binds the narrow Owner-authorized current-JavaScript private-preview evidence. It may state that the bounded, currently defined machine preparation is exhausted before the next human/Owner-fidelity/original-runtime gate only while all fourteen bound inputs remain current and all exact counts and fail-closed authority boundaries validate. It records eight machine-selected containment engineering candidates with eight candidate implementations and eight bounded offline or diagnostic checks, while preserving zero Owner technical approvals, zero live-session verifications, zero runnable artifacts, and zero runtime sessions. It records the current-JavaScript renderer, behavior-candidate, local QA, and private controlled CEO-preview authorization only; that authorization does not alter any migration strict implementationAuthorized field. It records the Owner-relayed content-manager authorization to use the combined elementary KeyTerm files as a product reference while preserving zero exact lesson-local recovery candidates, zero recovered targets, an open source gap, no lesson-specific substitution authority, and no verified runtime byte variant. It binds 55 source-derived asset candidate inventories with 12,066 rows and 55 source-derived keyframe candidate inventories with 802 rows while preserving zero authoritative baseline keyframes. It records exactly 52 bounded canonical current-JavaScript engineering candidates: 51 manifest-bound single-sprite candidates and one independently evidenced FQ001 dual-sprite composite whose canonical frame-domain disposition and nested coverage remain unresolved. Product-only FQ002/FQ003 question atlases remain outside this canonical count. Local whole-lesson/FQ browser QA and fresh-unzip standalone-package smoke are current-JavaScript private-preview evidence only. This report does not recover missing source, approve or live-verify a technical containment mechanism, create a signed session authorization, execute original runtime or Animate, perform or accept an independent human review, establish fidelity, grant strict completion, authorize external deployment or public release, or publish the lesson.";
const AUTHORITY = LEGACY_AUTHORITY
  .replace("all fourteen bound inputs", "all fifteen bound inputs")
  .replace(
    "It records the current-JavaScript renderer",
    "It separately binds the user-attested Owner permission to continue remaining in-scope machine, implementation, and prospective runtime-execution work without changing the strict implementationAuthorized count or exact-session runtime authorization. It records the current-JavaScript renderer",
  );
const STRICT_ACCEPTANCE_EFFECT =
  "none; current machine-only preparation exhaustion is not implementation, original-runtime evidence, review acceptance, fidelity acceptance, strict completion, or publication";

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
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be non-empty, project-relative, and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath),
    `${label}: path escapes project root`,
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
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveProjectPath(
    resolvedRoot,
    relativePath,
    label,
  );
  const before = await assertOrdinaryFile(absolutePath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(resolvedRoot),
    realpath(absolutePath),
  ]);
  invariant(
    isWithin(realRoot, realFile),
    `${label}: resolves outside project root`,
  );
  const after = await assertOrdinaryFile(absolutePath, label);
  invariant(
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
    `${label}: stale or mismatched descriptor`,
  );
}

function assertHashAndSizeDescriptor(actual, expected, label) {
  invariant(
    actual?.bytes === expected.bytes &&
      actual?.sha256 === expected.sha256,
    `${label}: stale or mismatched hash/size descriptor`,
  );
}

function assertAllFalse(value, keys, label) {
  for (const key of keys) {
    invariant(value?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function validateSourceGap(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "lesson-release-source-gap-forensics" &&
      report.releaseId === RELEASE_ID,
    "source-gap report identity drifted",
  );
  const declarations = report.keytermGap?.declarations;
  invariant(
    report.keytermGap?.status ===
        "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root" &&
      Array.isArray(declarations) &&
      declarations.length === 2,
    "source-gap missing-KeyTerm state drifted",
  );
  const expected = [
    ["english", "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml"],
    ["spanish", "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml"],
  ];
  invariant(
    declarations.every((item, index) =>
      item.language === expected[index][0] &&
      item.path === expected[index][1] &&
      item.physicalPresence === false &&
      Array.isArray(item.exactCatalogMatches) &&
      item.exactCatalogMatches.length === 0 &&
      Array.isArray(item.basenameCatalogMatches) &&
      item.basenameCatalogMatches.length === 0),
    "source-gap target evidence drifted",
  );
  assertAllFalse(report.acceptanceEffects, [
    "authoritativeOriginalRuntime",
    "implementationAuthorized",
    "published",
    "releaseScopeChanged",
    "sourceGapClosed",
    "strictComplete",
  ], "source-gap acceptance");
}

function validateCurrentJsImplementationAuthorization(receipt) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.evidenceType ===
        "g5-l4-user-stated-owner-current-js-implementation-authorization-intake" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.receivedOn === "2026-07-29" &&
      receipt.channel === "current-codex-task" &&
      receipt.ownerIdentity?.ownerFullName === "Dr. Peter Hu" &&
      receipt.ownerIdentity.ownerRole === "Owner" &&
      receipt.ownerStatement?.sha256 ===
        "fd40c80927cf6f4f97090a6f00e146914bbecec24b3994b8e629b488f0effe79" &&
      receipt.ownerStatement.byteLength === 478,
    "current-JS implementation authorization identity drifted",
  );
  invariant(
    JSON.stringify(receipt.authorization?.scope) === JSON.stringify([
      "g5-l4-source-derived-current-js-renderer-and-behavior-candidate-implementation",
      "g5-l4-acceptance-neutral-current-js-product-qa",
      "g5-l4-private-controlled-ceo-preview-preparation",
    ]) &&
      receipt.authorization.explicit === true &&
      receipt.authorization
        .namedHumanNaturalEntryVerificationWaivedForControlledPreview === true &&
      receipt.authorization.currentJsRendererImplementationAuthorized === true &&
      receipt.authorization
        .sourceDerivedBehaviorCandidateImplementationAuthorized === true &&
      receipt.authorization.currentJsProductQaAuthorized === true &&
      receipt.authorization.privateControlledCeoPreviewPreparationAuthorized ===
        true,
    "current-JS authorization scope drifted",
  );
  assertAllFalse(receipt.authorization, [
    "externalDeploymentAuthorized",
    "publicReleaseAuthorized",
    "missingDependencySubstitutionAuthorized",
    "originalRuntimeEvidenceEstablished",
    "independentHumanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ], "current-JS authorization strict boundary");
  invariant(
    receipt.authorityBoundary?.ownerIdentityUserAttested === true &&
      receipt.authorityBoundary.currentJsImplementationAuthorizationRecorded ===
        true &&
      receipt.authorityBoundary.controlledPreviewHumanNaturalEntryRequirementWaived ===
        true &&
      receipt.authorityBoundary.strictAcceptanceEffect ===
        "current-js-implementation-and-private-preview-only",
    "current-JS authorization authority boundary drifted",
  );
  assertAllFalse(receipt.authorityBoundary, [
    "ownerIdentityCryptographicallyVerified",
    "waiverSatisfiesOriginalRuntimeEvidence",
    "waiverSatisfiesNaturalNavigationCausality",
    "waiverSatisfiesIndependentHumanReview",
    "ownerFidelityAcceptanceEstablished",
    "strictValidationApprovalEstablished",
    "atomicPublicationApprovalEstablished",
  ], "current-JS authorization non-promotion boundary");
}

function validateStandalonePackageSmoke(report, archiveRecord) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l4-whole-lesson-package-mvp-v6-smoke" &&
      report.packageId === "g5-l4-whole-lesson-package-mvp-v6" &&
      report.status === "pass-current-javascript-private-preview" &&
      report.freshArchiveExtraction === true &&
      Number.isSafeInteger(report.archiveEntryCount) &&
      report.archiveEntryCount > 0,
    "standalone-package smoke identity drifted",
  );
  invariant(
    report.archive?.path ===
        "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip" &&
      report.archive.bytes === archiveRecord.bytes &&
      report.archive.sha256 === archiveRecord.sha256,
    "standalone-package archive binding drifted",
  );
  invariant(
    report.pagesExpectedPerLocale === 54 &&
      report.englishPagesReady === 54 &&
      report.spanishPagesReady === 54 &&
      report.glossaryCounts?.englishIndex === 761 &&
      report.glossaryCounts.spanishIndex === 753 &&
      report.spanishMobile?.viewportWidth === 390 &&
      report.spanishMobile.documentWidth === 390 &&
      report.spanishMobile.horizontalOverflow === false &&
      Array.isArray(report.fqFlows) &&
      report.fqFlows.length === 2 &&
      report.fqFlows.every((item) =>
        ["course-g05-l04-fq-002", "course-g05-l04-fq-003"].includes(
          item.animationId,
        ) &&
        item.answerSelectionAndSubmit === true &&
        item.replayResetToQuestionOne === true),
    "standalone-package current-JS product smoke counts drifted",
  );
  for (const key of [
    "consoleErrors",
    "pageErrors",
    "badHttpResponses",
    "failedRequests",
    "externalRequests",
    "failures",
  ]) {
    invariant(
      Array.isArray(report[key]) && report[key].length === 0,
      `standalone-package ${key} must remain empty`,
    );
  }
  invariant(
    report.packageVerifier?.status === "verified" &&
      report.packageVerifier.packageId === report.packageId &&
      report.packageVerifier.members === 55 &&
      report.packageVerifier.currentJavascriptPages === 54 &&
      report.packageVerifier.glossaries?.en === 761 &&
      report.packageVerifier.glossaries.es === 753 &&
      report.packageVerifier.strictComplete === 0 &&
      report.packageVerifier.published === false &&
      report.packageVerifier.privacyScan?.status === "pass" &&
      report.packageVerifier.privacyScan.forbiddenPathFindings === 0 &&
      report.packageVerifier.privacyScan.forbiddenExtensionFindings === 0 &&
      report.packageVerifier.privacyScan.absoluteLocalPathFindings === 0 &&
      report.privacyScan?.status === "pass" &&
      report.privacyScan.forbiddenPathFindings === 0 &&
      report.privacyScan.forbiddenExtensionFindings === 0 &&
      report.privacyScan.absoluteLocalPathFindings === 0,
    "standalone-package verifier or privacy boundary drifted",
  );
  invariant(
    report.release?.releaseId === RELEASE_ID &&
      report.release.expectedMembers === 55 &&
      report.release.activePages === 54 &&
      report.release.courseShells === 1 &&
      report.release.strictCompleteCount === 0 &&
      report.release.missingCount === 55 &&
      report.release.published === false &&
      report.serverIdentity?.bindAddress === "127.0.0.1" &&
      report.serverIdentity.listenerOwnedBySpawnedChild === true,
    "standalone-package release or loopback boundary drifted",
  );
  invariant(
    Object.values(report.authority || {}).every((value) => value === false),
    "standalone-package smoke promoted an authority claim",
  );
}

function validateStandalonePackageManifest(manifest) {
  invariant(
    manifest?.schemaVersion === 1 &&
      manifest.packageId === "g5-l4-whole-lesson-package-mvp-v6" &&
      manifest.packageType === "machine-verified-private-controlled-preview" &&
      manifest.productLayer === "whole-lesson-current-javascript-mvp" &&
      manifest.target?.platform === "darwin" &&
      manifest.target.architecture === "arm64" &&
      manifest.entry?.network === "loopback-only" &&
      manifest.entry.externalDeploymentAuthorized === false,
    "standalone-package manifest identity or private boundary drifted",
  );
  invariant(
    manifest.release?.releaseId === RELEASE_ID &&
      manifest.release.expectedMembers === 55 &&
      manifest.release.activePages === 54 &&
      manifest.release.courseShells === 1 &&
      manifest.release.strictCompleteCount === 0 &&
      manifest.release.missingCount === 55 &&
      manifest.release.published === false &&
      Array.isArray(manifest.members) &&
      manifest.members.length === 55 &&
      manifest.assets?.memberCount === 55 &&
      manifest.assets.audioFileCount === 0 &&
      manifest.assets.audioAcceptance === false &&
      Array.isArray(manifest.glossaries) &&
      manifest.glossaries.length === 2 &&
      manifest.glossaries[0].entryCount === 761 &&
      manifest.glossaries[1].entryCount === 753,
    "standalone-package manifest product counts drifted",
  );
  invariant(
    Object.values(manifest.authority || {}).every((value) => value === false),
    "standalone-package manifest promoted an authority claim",
  );
}

function validateCurrentJsWholeLessonProductQa(report) {
  validateWholeLessonSuccessorReceipt(report);
  invariant(
    report.receiptId ===
        "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4" &&
      report.scope?.packageId === "g5-l4-whole-lesson-package-mvp-v6" &&
      report.scope.releaseMembers === 55 &&
      report.scope.activePages === 54 &&
      report.scope.courseShells === 1 &&
      report.packageEvidence?.packageId ===
        "g5-l4-whole-lesson-package-mvp-v6" &&
      report.predecessorEvidence?.currentAuthority === false &&
      report.predecessorEvidence.claimsCarriedForward === false &&
      report.scopeResult?.predecessorClaimsCarriedForward === false &&
      report.scopeResult.productQaComplete === false &&
      Array.isArray(report.childReceipts) &&
      report.childReceipts.length === 1 &&
      report.childReceipts[0].path === INPUT_PATHS.currentJsFq23CompanionQa &&
      Array.isArray(report.artifacts) &&
      report.artifacts.length === 3 &&
      Object.values(report.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    "whole-lesson current-JS QA successor boundary drifted",
  );
}

function validateSpecification(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l4-pre-implementation-specification-readiness" &&
      report.releaseId === RELEASE_ID &&
      Array.isArray(report.members) &&
      report.members.length === 55,
    "specification-readiness identity drifted",
  );
  const summary = report.summary;
  invariant(
    summary?.memberCount === 55 &&
      summary.preRuntimeCandidatePackageMaterializedCount === 55 &&
      summary.preRuntimeCandidateFileCount === 385 &&
      summary.materializedDefinitionCandidateCount === 12066 &&
      summary.materializedScriptCandidateCount === 2332 &&
      summary.assetInventoryPopulatedCount === 55 &&
      summary.assetInventoryRowCount === 12066 &&
      summary.keyframeInventoryPopulatedCount === 55 &&
      summary.keyframeRowCount === 802 &&
      summary.audioRuntimeEvidencePresentCount === 55 &&
      summary.audioStructurallyAuditedCount === 55 &&
      summary.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      summary.fullSingleSpriteCandidateCount === 20 &&
      summary.safePrefixSingleSpriteCandidateCount === 31 &&
      summary.independentDualSpriteCompositeCandidateCount === 1 &&
      summary.canonicalNestedCoverageCandidateCount === 51 &&
      summary.sourceStaticOpenFrameCount === 13696 &&
      summary.sourceStaticBlockedTailFrameCount === 3020 &&
      summary.currentJavaScriptOutputPresentCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.coverageRequirementCount === 212 &&
      summary.coverageRootOnlyRequirementCount === 110 &&
      summary.coverageNestedRequirementCount === 102 &&
      summary.coverageRequiredFrameCount === 34508 &&
      summary.coverageMissingFrameCount === 34508 &&
      Number.isSafeInteger(
        summary.remainingAutomaticallyAdvanceableTaskCount,
      ) &&
      summary.remainingAutomaticallyAdvanceableTaskCount >= 0 &&
      Number.isSafeInteger(summary.safeMachineCandidateWorkAvailableCount) &&
      summary.safeMachineCandidateWorkAvailableCount >= 0 &&
      summary.safeMachineCandidateWorkAvailableCount <= 55 &&
      (summary.remainingAutomaticallyAdvanceableTaskCount === 0) ===
        (summary.safeMachineCandidateWorkAvailableCount === 0) &&
      summary.implementationSpecificationReadyCount === 0 &&
      summary.authoritativeRuntimeSessionCount === 0 &&
      summary.authoritativeRuntimeReachabilityEstablishedCount === 0 &&
      summary.implementationAuthorizedCount === 0 &&
      summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.spanishEnabledCount === 0 &&
      summary.sourceStaticAudioEnabledCount === 0 &&
      summary.rmseComputedCount === 0 &&
      summary.humanVisualReviewPerformedCount === 0 &&
      summary.ownerReviewPerformedCount === 0 &&
      summary.strictCompleteCount === 0 &&
      summary.publishedCount === 0,
    "specification-readiness exact counts or gate boundary drifted",
  );
  const engineeringCandidates = report.members.filter(
    (member) =>
      member.implementationState?.sourceStaticEngineeringCandidate === true,
  );
  invariant(
    JSON.stringify(engineeringCandidates.map((member) => member.animationId)) ===
      JSON.stringify(SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS) &&
      engineeringCandidates.every((member) =>
        member.implementationState.currentJavaScriptOutputPresent === true &&
        member.implementationState.started === true &&
        member.implementationState.state ===
          (member.animationId === "course-g05-l04-fq-001"
            ? "dual-sprite-composite-engineering-candidate"
            : "source-static-engineering-candidate") &&
        member.implementationState
          .authoritativeRuntimeReachabilityEstablished === false &&
        member.implementationState
          .implementationAuthorizedByThisReport === false &&
        member.implementationState.spanishEnabled === false &&
        member.implementationState.audioEnabled === false &&
        member.implementationState.rmseComputed === false &&
        member.implementationState.humanVisualReviewPerformed === false &&
        member.implementationState.ownerReviewPerformed === false &&
        member.specificationAreas?.fullFrameCoverage?.specificationReady ===
          false &&
        member.acceptanceEffects?.authoritativeOriginalRuntime === false &&
        member.acceptanceEffects?.currentJavaScriptCandidate === false &&
        member.acceptanceEffects?.fidelityAccepted === false &&
        member.acceptanceEffects?.humanVisualAccepted === false &&
        member.acceptanceEffects?.ownerAccepted === false &&
        member.acceptanceEffects?.strictComplete === false &&
        member.acceptanceEffects?.published === false),
    "specification-readiness engineering-candidate set or fail-closed state drifted",
  );
  invariant(
    report.writeBoundary?.candidateFilesObservedByThisGenerator === 385 &&
      report.writeBoundary.reportFilesOnly === true &&
      report.writeBoundary.workspaceFilesCreatedByThisGenerator === 0 &&
      report.writeBoundary.workspaceFilesModifiedByThisGenerator === 0,
    "specification-readiness write boundary drifted",
  );
  invariant(
    report.members.every((member) =>
      member.specificationAreas?.assetInventory?.sourceDerivedCandidateOnly ===
        true &&
      member.specificationAreas.assetInventory.rowCount > 0 &&
      member.specificationAreas.assetInventory.specificationReady === false &&
      member.specificationAreas?.keyframes?.sourceDerivedCandidateOnly === true &&
      member.specificationAreas.keyframes.rowCount > 0 &&
      member.specificationAreas.keyframes.specificationReady === false &&
      member.preRuntimeCandidatePackage
        ?.sourceDerivedAssetFinalSpecificationComplete === false &&
      member.preRuntimeCandidatePackage
        ?.sourceDerivedAuthoritativeBaselineKeyframeCount === 0),
    "source-derived asset/keyframe successor boundary drifted",
  );
  const assetSuccessorBindings = report.members.map(
    (member) => member.workspace?.files?.sourceDerivedAssetSuccessor,
  );
  invariant(
    assetSuccessorBindings.every((binding) =>
      typeof binding?.path === "string" &&
      binding.path.endsWith(
        "/audit/machine/g5-l4-source-derived-asset-inventory-candidate-receipt.json",
      ) &&
      Number.isSafeInteger(binding.bytes) &&
      binding.bytes > 0 &&
      SHA256.test(binding.sha256 || "")) &&
      new Set(assetSuccessorBindings.map((binding) => binding.path)).size === 55,
    "specification-readiness per-member asset-successor bindings drifted",
  );
  invariant(
    SHA256.test(report.reportFingerprintSha256 || ""),
    "specification-readiness fingerprint is missing",
  );
  assertAllFalse(report.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fidelityAccepted",
    "humanVisualAccepted",
    "implementationAuthorized",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], "specification-readiness acceptance");
}

async function assertFreshRebuild(record, report, serialize, label) {
  const expected = Buffer.from(serialize(report));
  invariant(
    expected.equals(record.contents),
    `${label}: checked-in report is stale relative to its current inputs`,
  );
}

function inputSetProjection(sourceBindings, keys = INPUT_KEYS) {
  return keys.map((key) => ({
    key,
    path: sourceBindings[key].path,
    bytes: sourceBindings[key].bytes,
    sha256: sourceBindings[key].sha256,
  }));
}

export async function buildG5L4ContinuationMachineReadiness({
  projectRoot: projectRootOption = defaultProjectRoot,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  invariant(
    projectRoot === defaultProjectRoot,
    "continuation current-rebuild validation requires the canonical project root",
  );
  const records = {};
  for (const [key, relativePath] of Object.entries(INPUT_PATHS)) {
    records[key] = await readJsonRecord(projectRoot, relativePath, key);
  }
  records.generator = await readFileRecord(
    projectRoot,
    GENERATOR_PATH,
    "continuation generator",
  );

  const receipt =
    records.ownerDefaultBlockersAuthorizationReceipt.document;
  const ownerWorkAuthorizationReceipt =
    records.ownerWorkAuthorizationReceipt.document;
  const containment =
    records.originalRuntimeContainmentReadiness.document;
  const m1 = records.m1MachineFoundationReadiness.document;
  const sourceGap = records.sourceGapForensics.document;
  const recovery = records.missingKeytermRecoveryReadiness.document;
  const specification = records.specificationReadiness.document;
  const sessions = records.perSessionAuthorizationPreparation.document;
  const reviews = records.reviewWorkflowPreparation.document;
  const currentJsAuthorization =
    records.currentJsImplementationAuthorization.document;
  const combinedKeytermsSuccessor =
    records.combinedKeytermsProductReferenceSuccessor.document;
  const keyframeSuccessor =
    records.sourceDerivedKeyframeCandidateSuccessor.document;
  const fq23Qa = records.currentJsFq23CompanionQa.document;
  const wholeLessonQa = records.currentJsWholeLessonProductQa.document;
  const standalonePackageSmoke = records.standalonePackageSmoke.document;

  validateG5L4OwnerDefaultBlockersAuthorizationReceipt(receipt);
  validateG5L4OwnerWorkAuthorizationReceipt(ownerWorkAuthorizationReceipt);
  const ownerWorkAuthorization = projectG5L4OwnerWorkAuthorization(
    ownerWorkAuthorizationReceipt,
    descriptor(records.ownerWorkAuthorizationReceipt),
  );
  validateG5L4OriginalRuntimeContainmentReadiness(containment);
  validateG5L4M1MachineFoundationReport(m1);
  validateSourceGap(sourceGap);
  validateG5L4MissingKeytermRecoveryReadiness(recovery);
  const combinedReference =
    recovery.authorizedCombinedElementaryKeytermsReference;
  invariant(
    combinedReference?.direction?.referenceUseAuthorized === true &&
      combinedReference.direction.evidenceClass ===
        "owner-relayed-content-manager-email" &&
      combinedReference.intakeVariant?.sourceCount === 2 &&
      combinedReference.intakeVariant.parsedRecordCount === 1626 &&
      combinedReference.intakeVariant.knownUnrelatedMalformedRecordCount === 1 &&
      SHA256.test(combinedReference.intakeVariant.sourceSetSha256 || "") &&
      combinedReference.clientSelection?.canonical2008MasterSelected === true &&
      combinedReference.clientSelection.ownerIntake2015Selected === false &&
      combinedReference.disposition?.exactTargetCandidates === 0 &&
      combinedReference.disposition.recoveredTargets === 0 &&
      combinedReference.disposition.sourceGapClosed === false &&
      combinedReference.disposition.substitutionAuthorized === false &&
      combinedReference.disposition.runtimeByteVariantVerified === false &&
      combinedReference.disposition.fidelityAccepted === false &&
      combinedReference.disposition.strictComplete === false &&
      combinedReference.disposition.published === false,
    "authorized combined-KeyTerm reference or recovery boundary drifted",
  );
  validateSpecification(specification);
  validateG5L4PerSessionAuthorizationPreparation(sessions);
  validateG5L4ReviewWorkflowPreparation(reviews);
  validateCurrentJsImplementationAuthorization(currentJsAuthorization);
  validateCombinedKeytermsProductReferenceSuccessor(
    combinedKeytermsSuccessor,
  );
  validateSourceDerivedKeyframeCandidateSuccessor(keyframeSuccessor);
  validateFqSuccessorReceipt(fq23Qa);
  await checkFq23QaSuccessor({
    root: projectRoot,
    receiptPath: INPUT_PATHS.currentJsFq23CompanionQa,
  });
  invariant(
    fq23Qa.receiptId ===
        "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4" &&
      fq23Qa.scope?.packageId === "g5-l4-whole-lesson-package-mvp-v6" &&
      fq23Qa.scopeResult?.currentJavascriptFq23FreshPackageQaPassed === true &&
      fq23Qa.scopeResult.predecessorClaimsCarriedForward === false &&
      fq23Qa.scopeResult.productQaComplete === false &&
      Object.values(fq23Qa.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    "FQ23 current-JS QA successor boundary drifted",
  );
  validateCurrentJsWholeLessonProductQa(wholeLessonQa);
  await checkWholeLessonQaSuccessor({
    root: projectRoot,
    receiptPath: INPUT_PATHS.currentJsWholeLessonProductQa,
  });
  assertDescriptor(
    wholeLessonQa.authorizationBinding,
    descriptor(records.currentJsImplementationAuthorization),
    "whole-lesson QA/current-JS authorization",
  );
  assertDescriptor(
    wholeLessonQa.childReceipts[0],
    descriptor(records.currentJsFq23CompanionQa),
    "whole-lesson QA/FQ23 child receipt",
  );
  invariant(
    standalonePackageSmoke.archive?.path ===
      "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip",
    "standalone-package smoke archive path drifted",
  );
  const standalonePackageArchive = await readFileRecord(
    projectRoot,
    standalonePackageSmoke.archive.path,
    "standalone-package archive",
  );
  validateStandalonePackageSmoke(
    standalonePackageSmoke,
    standalonePackageArchive,
  );
  const standalonePackageManifest = await readJsonRecord(
    projectRoot,
    STANDALONE_PACKAGE_MANIFEST_PATH,
    "standalone-package manifest",
  );
  validateStandalonePackageManifest(standalonePackageManifest.document);
  invariant(
    standalonePackageSmoke.packageManifestSha256 ===
      standalonePackageManifest.sha256,
    "standalone-package smoke/manifest hash binding drifted",
  );
  invariant(
    JSON.stringify(
      m1.sourceStaticEngineeringCandidates?.members?.map(
        (member) => member.animationId,
      ),
    ) === JSON.stringify(SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS) &&
      m1.summary?.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      m1.summary.rendererSelectedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      m1.summary.routeDeclaredCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      m1.summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      m1.summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      m1.summary.fullSingleSpriteCandidateCount === 20 &&
      m1.summary.safePrefixSingleSpriteCandidateCount === 31 &&
      m1.summary.independentDualSpriteCompositeCandidateCount === 1 &&
      m1.summary.canonicalNestedCoverageCandidateCount === 51 &&
      m1.summary.openFrameCount === 13696 &&
      m1.summary.blockedTailFrameCount === 3020 &&
      m1.summary.implementationAuthorizedCount === 0 &&
      m1.summary.originalRuntimeSessionCount === 0 &&
      m1.summary.humanReviewAcceptedCount === 0 &&
      m1.summary.ownerFidelityAcceptedCount === 0 &&
      m1.summary.strictCompleteCount === 0 &&
      m1.summary.publishedCount === 0,
    "M1/source-static engineering-candidate set or gate boundary drifted",
  );

  assertDescriptor(
    containment.sourceBindings.ownerDefaultBlockersAuthorizationReceipt,
    descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
    "containment/Owner-default receipt",
  );
  assertDescriptor(
    containment.sourceBindings.ownerWorkAuthorizationReceipt,
    descriptor(records.ownerWorkAuthorizationReceipt),
    "containment/Owner work-authorization receipt",
  );
  assertDescriptor(
    containment.sourceBindings.sourceGapForensics,
    descriptor(records.sourceGapForensics),
    "containment/source-gap",
  );
  assertDescriptor(
    m1.sourceBindings.ownerDefaultBlockersAuthorizationReceipt,
    descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
    "M1/Owner-default receipt",
  );
  assertDescriptor(
    m1.sourceBindings.ownerWorkAuthorizationReceipt,
    descriptor(records.ownerWorkAuthorizationReceipt),
    "M1/Owner work-authorization receipt",
  );
  assertDescriptor(
    m1.sourceBindings.originalRuntimeContainmentReadiness,
    descriptor(records.originalRuntimeContainmentReadiness),
    "M1/containment",
  );
  assertDescriptor(
    m1.sourceBindings.machinePacket.sourceGapForensics,
    descriptor(records.sourceGapForensics),
    "M1/source-gap",
  );
  assertHashAndSizeDescriptor(
    recovery.sourceBindings.g5L4SourceGap,
    descriptor(records.sourceGapForensics),
    "recovery/source-gap",
  );
  assertDescriptor(
    sessions.sourceBindings.ownerDefaultsAuthorizationReceipt,
    descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
    "session/Owner-default receipt",
  );
  assertDescriptor(
    sessions.sourceBindings.ownerWorkAuthorizationReceipt,
    descriptor(records.ownerWorkAuthorizationReceipt),
    "session/Owner work-authorization receipt",
  );
  assertDescriptor(
    sessions.sourceBindings.containmentReadiness,
    descriptor(records.originalRuntimeContainmentReadiness),
    "session/containment",
  );
  assertDescriptor(
    reviews.sourceBindings.ownerDefaultsAuthorization,
    descriptor(records.ownerDefaultBlockersAuthorizationReceipt),
    "review/Owner-default receipt",
  );
  assertDescriptor(
    reviews.sourceBindings.m1MachineFoundation,
    descriptor(records.m1MachineFoundationReadiness),
    "review/M1",
  );
  assertDescriptor(
    reviews.sourceBindings.specificationReadiness,
    descriptor(records.specificationReadiness),
    "review/specification",
  );
  assertDescriptor(
    reviews.sourceBindings.perSessionPreparation,
    descriptor(records.perSessionAuthorizationPreparation),
    "review/per-session preparation",
  );
  assertDescriptor(
    specification.inputs.sourceDerivedKeyframeSuccessor,
    descriptor(records.sourceDerivedKeyframeCandidateSuccessor),
    "specification/source-derived keyframe successor",
  );

  const rebuilt = await Promise.all([
    buildG5L4OriginalRuntimeContainmentReadiness({projectRoot}),
    buildG5L4M1MachineFoundationReadiness({projectRoot}),
    buildSourceGapReport({releaseId: RELEASE_ID}),
    buildG5L4MissingKeytermRecoveryReadiness({projectRoot}),
    buildG5L4SpecificationReadiness({projectRoot}),
    buildG5L4PerSessionAuthorizationPreparation({projectRoot}),
    buildG5L4ReviewWorkflowPreparation({projectRoot}),
  ]);
  await Promise.all([
    assertFreshRebuild(
      records.originalRuntimeContainmentReadiness,
      rebuilt[0],
      containmentStableJson,
      "containment",
    ),
    assertFreshRebuild(
      records.m1MachineFoundationReadiness,
      rebuilt[1],
      m1StableJson,
      "M1 machine foundation",
    ),
    assertFreshRebuild(
      records.sourceGapForensics,
      rebuilt[2],
      sourceGapStableJson,
      "source-gap",
    ),
    assertFreshRebuild(
      records.missingKeytermRecoveryReadiness,
      rebuilt[3],
      recoveryStableJson,
      "missing-KeyTerm recovery",
    ),
    assertFreshRebuild(
      records.specificationReadiness,
      rebuilt[4],
      specificationStableJson,
      "specification readiness",
    ),
    assertFreshRebuild(
      records.perSessionAuthorizationPreparation,
      rebuilt[5],
      sessionStableJson,
      "per-session preparation",
    ),
    assertFreshRebuild(
      records.reviewWorkflowPreparation,
      rebuilt[6],
      reviewStableJson,
      "review-workflow preparation",
    ),
  ]);

  const sourceBindings = {
    ownerDefaultBlockersAuthorizationReceipt: descriptor(
      records.ownerDefaultBlockersAuthorizationReceipt,
      {
        schemaVersion: receipt.schemaVersion,
        evidenceType: receipt.evidenceType,
      },
    ),
    ownerWorkAuthorizationReceipt: descriptor(
      records.ownerWorkAuthorizationReceipt,
      {
        schemaVersion: ownerWorkAuthorizationReceipt.schemaVersion,
        evidenceType: ownerWorkAuthorizationReceipt.evidenceType,
      },
    ),
    originalRuntimeContainmentReadiness: descriptor(
      records.originalRuntimeContainmentReadiness,
      {
        schemaVersion: containment.schemaVersion,
        reportType: containment.reportType,
      },
    ),
    m1MachineFoundationReadiness: descriptor(
      records.m1MachineFoundationReadiness,
      {schemaVersion: m1.schemaVersion, reportType: m1.reportType},
    ),
    sourceGapForensics: descriptor(records.sourceGapForensics, {
      schemaVersion: sourceGap.schemaVersion,
      reportType: sourceGap.reportType,
    }),
    missingKeytermRecoveryReadiness: descriptor(
      records.missingKeytermRecoveryReadiness,
      {
        schemaVersion: recovery.schemaVersion,
        reportType: recovery.reportType,
      },
    ),
    specificationReadiness: descriptor(records.specificationReadiness, {
      schemaVersion: specification.schemaVersion,
      reportType: specification.reportType,
    }),
    perSessionAuthorizationPreparation: descriptor(
      records.perSessionAuthorizationPreparation,
      {
        schemaVersion: sessions.schemaVersion,
        reportType: sessions.reportType,
      },
    ),
    reviewWorkflowPreparation: descriptor(
      records.reviewWorkflowPreparation,
      {
        schemaVersion: reviews.schemaVersion,
        reportType: reviews.reportType,
      },
    ),
    currentJsImplementationAuthorization: descriptor(
      records.currentJsImplementationAuthorization,
      {
        schemaVersion: currentJsAuthorization.schemaVersion,
        evidenceType: currentJsAuthorization.evidenceType,
      },
    ),
    combinedKeytermsProductReferenceSuccessor: descriptor(
      records.combinedKeytermsProductReferenceSuccessor,
      {
        schemaVersion: combinedKeytermsSuccessor.schemaVersion,
        evidenceType: combinedKeytermsSuccessor.evidenceType,
      },
    ),
    sourceDerivedKeyframeCandidateSuccessor: descriptor(
      records.sourceDerivedKeyframeCandidateSuccessor,
      {
        schemaVersion: keyframeSuccessor.schemaVersion,
        receiptType: keyframeSuccessor.receiptType,
      },
    ),
    currentJsFq23CompanionQa: descriptor(records.currentJsFq23CompanionQa, {
      schemaVersion: fq23Qa.schemaVersion,
      evidenceType: fq23Qa.evidenceType,
    }),
    currentJsWholeLessonProductQa: descriptor(
      records.currentJsWholeLessonProductQa,
      {
        schemaVersion: wholeLessonQa.schemaVersion,
        evidenceType: wholeLessonQa.evidenceType,
      },
    ),
    standalonePackageSmoke: descriptor(records.standalonePackageSmoke, {
      schemaVersion: standalonePackageSmoke.schemaVersion,
      reportType: standalonePackageSmoke.reportType,
    }),
  };
  const projection = inputSetProjection(sourceBindings);
  const remainingAutomaticallyAdvanceableTaskCount =
    specification.summary.remainingAutomaticallyAdvanceableTaskCount;
  const safeMachineCandidateWorkAvailableCount =
    specification.summary.safeMachineCandidateWorkAvailableCount;
  const sourceStaticEngineeringCandidateCount =
    specification.summary.sourceStaticEngineeringCandidateCount;
  const manifestBoundSingleSpriteCandidateCount =
    specification.summary.manifestBoundSingleSpriteCandidateCount;
  const fullSingleSpriteCandidateCount =
    specification.summary.fullSingleSpriteCandidateCount;
  const safePrefixSingleSpriteCandidateCount =
    specification.summary.safePrefixSingleSpriteCandidateCount;
  const independentDualSpriteCompositeCandidateCount =
    specification.summary.independentDualSpriteCompositeCandidateCount;
  const canonicalNestedCoverageCandidateCount =
    specification.summary.canonicalNestedCoverageCandidateCount;
  const sourceStaticOpenFrameCount =
    specification.summary.sourceStaticOpenFrameCount;
  const sourceStaticBlockedTailFrameCount =
    specification.summary.sourceStaticBlockedTailFrameCount;
  const currentJavaScriptOutputPresentCount =
    specification.summary.currentJavaScriptOutputPresentCount;
  const implementationStartedCount =
    specification.summary.implementationStartedCount;
  const coverageRequirementCount =
    specification.summary.coverageRequirementCount;
  const coverageRootOnlyRequirementCount =
    specification.summary.coverageRootOnlyRequirementCount;
  const coverageNestedRequirementCount =
    specification.summary.coverageNestedRequirementCount;
  const coverageRequiredFrameCount =
    specification.summary.coverageRequiredFrameCount;
  const coverageMissingFrameCount =
    specification.summary.coverageMissingFrameCount;
  const assetInventoryPopulatedCount =
    specification.summary.assetInventoryPopulatedCount;
  const assetInventoryRowCount = specification.summary.assetInventoryRowCount;
  const keyframeInventoryPopulatedCount =
    specification.summary.keyframeInventoryPopulatedCount;
  const keyframeRowCount = specification.summary.keyframeRowCount;
  const machinePreparationExhaustedBeforeHumanGate =
    remainingAutomaticallyAdvanceableTaskCount === 0 &&
    safeMachineCandidateWorkAvailableCount === 0;

  const report = {
    schemaVersion: 1,
    reportType: "g5-l4-continuation-machine-readiness",
    releaseId: RELEASE_ID,
    evidenceState: machinePreparationExhaustedBeforeHumanGate
      ? "all-current-bounded-machine-preparation-exhausted-before-human-owner-original-runtime-gates"
      : "all-current-bounded-machine-preparation-in-progress-before-human-owner-original-runtime-gates",
    authority: AUTHORITY,
    generator: descriptor(records.generator),
    sourceBindings,
    ownerWorkAuthorization,
    inputCurrency: {
      boundInputCount: INPUT_KEYS.length,
      inputKeys: [...INPUT_KEYS],
      inputSetSha256: sha256Bytes(Buffer.from(stableJson(projection))),
      exactOwnerDirectiveVerified: true,
      ownerWorkAuthorizationReceiptVerified: true,
      upstreamFreshRebuildCheckCount: UPSTREAM_REBUILD_CHECK_COUNT,
      upstreamFreshRebuildVerifiedCount: UPSTREAM_REBUILD_CHECK_COUNT,
      supplementalEvidenceValidatorCount:
        SUPPLEMENTAL_EVIDENCE_VALIDATOR_COUNT,
      supplementalEvidenceVerifiedCount:
        SUPPLEMENTAL_EVIDENCE_VALIDATOR_COUNT,
      crossReportDescriptorCasVerified: true,
      standalonePackageArchiveCasVerified: true,
      allInputsCurrent: true,
    },
    machinePreparation: {
      runtimeMechanismCandidates: {
        state:
          "acceptance-neutral-machine-selected-candidates-owner-live-runtime-gates-closed",
        bindingMode:
          "transitive-through-original-runtime-containment-readiness",
        sourceReport:
          containment.sourceBindings.runtimeMechanismCandidateReadiness,
        controlsSpecified: containment.summary.containmentControlsSpecified,
        mechanismsSelected:
          containment.summary.containmentMechanismsSelected,
        candidateImplementationsPresent:
          containment.summary.containmentCandidateImplementationsPresent,
        offlineOrDiagnosticVerified:
          containment.summary.containmentOfflineOrDiagnosticVerified,
        ownerTechnicalApprovals:
          containment.summary.containmentOwnerTechnicalApprovals,
        liveSessionVerified:
          containment.summary.containmentLiveSessionVerified,
        materializedReadOnlyHostTrees:
          containment.summary
            .materializedIncompleteReadOnlyHostTreeCandidateCount,
        materializedEmptyProfiles:
          containment.summary.materializedEmptyRuntimeProfileCandidateCount,
        originalRuntimeSessionsExecuted:
          containment.summary.originalRuntimeSessionsExecuted,
        productionLauncherEnabled:
          containment.executionGate.productionLauncherEnabled,
        liveObserverSupervisorImplemented:
          containment.executionGate.liveObserverSupervisorImplemented,
        freshProjectorAbsencePassed:
          containment.executionGate.freshProjectorAbsencePassed,
        immutableExactSessionAuthorizationPresent:
          containment.executionGate
            .immutableExactSessionAuthorizationPresent,
        runnable: containment.executionGate.runnable,
        strictAcceptanceEffect:
          "none; machine-selected and offline-checked candidates are not Owner-approved, live-verified, authorized, runnable, or acceptance evidence",
      },
      specificationCandidates: {
        expectedMemberCount: 55,
        candidatePackageCount: 55,
        candidateFileCount: 385,
        definitionCandidateCount: 12066,
        scriptCandidateCount: 2332,
        sourceDerivedAssetCandidateMemberCount: assetInventoryPopulatedCount,
        sourceDerivedAssetCandidateRowCount: assetInventoryRowCount,
        sourceDerivedKeyframeCandidateMemberCount:
          keyframeInventoryPopulatedCount,
        sourceDerivedKeyframeCandidateRowCount: keyframeRowCount,
        authoritativeBaselineKeyframeCount: 0,
        remainingAutomaticallyAdvanceableTaskCount,
        safeMachineCandidateWorkAvailableCount,
        implementationSpecificationReadyCount: 0,
      },
      sourceStaticEngineeringCandidates: {
        candidateIds: [...SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS],
        candidateCount: sourceStaticEngineeringCandidateCount,
        manifestBoundSingleSpriteCandidateCount,
        fullSingleSpriteCandidateCount,
        safePrefixSingleSpriteCandidateCount,
        independentDualSpriteCompositeCandidateCount,
        canonicalNestedCoverageCandidateCount,
        openFrameCount: sourceStaticOpenFrameCount,
        blockedTailFrameCount: sourceStaticBlockedTailFrameCount,
        currentJavaScriptOutputPresentCount,
        rendererSelectedCount: m1.summary.rendererSelectedCount,
        routeDeclaredCount: m1.summary.routeDeclaredCount,
        implementationStartedCount,
        implementationAuthorizedCount: 0,
        authoritativeRuntimeReachabilityEstablishedCount: 0,
        originalRuntimeSessionCount: 0,
        spanishEnabledCount: 0,
        audioEnabledCount: 0,
        rmseComputedCount: 0,
        humanReviewAcceptedCount: 0,
        ownerFidelityAcceptedCount: 0,
        strictCompleteCount: 0,
        publishedCount: 0,
        strictAcceptanceEffect:
          "none; these 52 entries are bounded canonical current-JavaScript engineering candidates only",
      },
      coverageObligations: {
        requirementCount: coverageRequirementCount,
        rootRequirementCount: coverageRootOnlyRequirementCount,
        nestedRequirementCount: coverageNestedRequirementCount,
        requiredFrameCount: coverageRequiredFrameCount,
        missingFrameCount: coverageMissingFrameCount,
        authoritativeBaselineCount: 0,
        authoritativeRuntimeReachabilityEstablishedCount: 0,
        specificationReadyCount: 0,
        state:
          "all-root-and-conservative-nested-requirements-pending-no-authoritative-baseline",
      },
      unsignedSessionTemplates: {
        originalRuntimeEnglishCount: 55,
        originalRuntimeSpanishCount: 55,
        originalRuntimeTotalCount: 110,
        animateCount: 44,
        totalCount: 154,
        signedCount: 0,
        runnableCount: 0,
        executedCount: 0,
      },
      unsignedReviewAndApprovalTemplates: {
        independentEngineeringCount: 55,
        independentVisualCount: 55,
        independentAudioCount: 55,
        independentSpanishCount: 55,
        memberReviewCount: 220,
        releaseApprovalCount: 3,
        totalCount: 223,
        assignedCount: 0,
        signedCount: 0,
        acceptedCount: 0,
      },
      authorizedCombinedElementaryKeytermsReference: {
        state:
          "authorized-product-reference-only-lesson-source-gap-open",
        directionEvidenceClass:
          combinedReference.direction.evidenceClass,
        referenceUseAuthorized: true,
        intakeSourceCount: combinedReference.intakeVariant.sourceCount,
        intakeSourceSetSha256:
          combinedReference.intakeVariant.sourceSetSha256,
        parsedRecordCount:
          combinedReference.intakeVariant.parsedRecordCount,
        knownUnrelatedMalformedRecordCount:
          combinedReference.intakeVariant
            .knownUnrelatedMalformedRecordCount,
        intakeSources: {
          english: {
            path: combinedReference.intakeVariant.sources.english.path,
            bytes: combinedReference.intakeVariant.sources.english.bytes,
            sha256: combinedReference.intakeVariant.sources.english.sha256,
          },
          spanish: {
            path: combinedReference.intakeVariant.sources.spanish.path,
            bytes: combinedReference.intakeVariant.sources.spanish.bytes,
            sha256: combinedReference.intakeVariant.sources.spanish.sha256,
          },
        },
        canonical2008MasterSelected:
          combinedReference.clientSelection.canonical2008MasterSelected,
        ownerIntake2015Selected:
          combinedReference.clientSelection.ownerIntake2015Selected,
        runtimeByteVariantVerified: false,
        exactRecoveryCandidateCount: 0,
        recoveredTargetCount: 0,
        missingLessonSourcesRecovered: false,
        sourceGapClosed: false,
        substitutionAuthorized: false,
        fidelityAccepted: false,
        strictComplete: false,
        published: false,
      },
      missingKeytermRecovery: {
        missingXmlCount: 2,
        exactRecoveryCandidateCount: 0,
        recoveredCount: 0,
        combinedReferenceUseAuthorized: true,
        sourceGapClosed: false,
        importAuthorized: false,
        substitutionAuthorized: false,
      },
      totalUnsignedHumanGateTemplateCount: 377,
    },
    currentJavascriptPrivatePreviewEvidence: {
      authorization: {
        state: "owner-authorized-current-js-private-preview-scope-only",
        currentJsRendererImplementationAuthorized: true,
        sourceDerivedBehaviorCandidateImplementationAuthorized: true,
        currentJsProductQaAuthorized: true,
        privateControlledCeoPreviewPreparationAuthorized: true,
        controlledPreviewHumanNaturalEntryRequirementWaived: true,
        migrationStrictImplementationAuthorizedCount: 0,
        originalRuntimeEvidenceEstablished: false,
        naturalNavigationCausalityEstablished: false,
        independentHumanReviewAccepted: false,
        ownerFidelityAcceptanceEstablished: false,
        strictCompletionEstablished: false,
        externalDeploymentAuthorized: false,
        publicReleaseAuthorized: false,
        publicationAuthorized: false,
      },
      combinedElementaryKeytermsProductReference: {
        successorReceiptVerified: true,
        selectedVariant: "canonical-preserved-master",
        englishClientTermCount:
          combinedKeytermsSuccessor.productBindings.selectedMasterSources.en
            .clientTermCount,
        spanishClientTermCount:
          combinedKeytermsSuccessor.productBindings.selectedMasterSources.es
            .clientTermCount,
        missingLessonSpecificSourceCount: 2,
        lessonSpecificSubstitutionAuthorized: false,
        sourceGapClosed: false,
      },
      sourceDerivedSpecificationCandidates: {
        assetBindingMode:
          "indirect-through-specification-readiness-member-workspace-descriptors",
        assetSuccessorReceiptCount: 55,
        assetCandidateRowCount: assetInventoryRowCount,
        keyframeSuccessorReceiptCount: 1,
        keyframeCandidateMemberCount: keyframeInventoryPopulatedCount,
        keyframeCandidateRowCount: keyframeSuccessor.summary.rowCount,
        authoritativeBaselineKeyframeCount:
          keyframeSuccessor.summary.authoritativeBaselineKeyframeCount,
        observedRuntimeKeyframeRowCount:
          keyframeSuccessor.summary.observedRuntimeRowCount,
        finalSpecificationComplete: false,
      },
      fq23CompanionQa: {
        receiptId: fq23Qa.receiptId,
        memberCount: fq23Qa.scope.members.length,
        packageId: fq23Qa.packageEvidence.packageId,
        currentJavascriptFreshPackageQaPassed:
          fq23Qa.scopeResult.currentJavascriptFq23FreshPackageQaPassed,
        answerSelectionSubmitAndReplayResetPassed:
          fq23Qa.scopeResult.answerSelectionSubmitAndReplayResetPassed,
        fullScoreAndReviewFlowFreshlyReperformed:
          fq23Qa.scopeResult.fullScoreAndReviewFlowFreshlyReperformed,
        predecessorClaimsCarriedForward:
          fq23Qa.scopeResult.predecessorClaimsCarriedForward,
        consoleErrorCount:
          fq23Qa.freshBrowserObservations.consoleErrorCount,
        pageErrorCount: fq23Qa.freshBrowserObservations.pageErrorCount,
        failedRequestCount:
          fq23Qa.freshBrowserObservations.failedRequestCount,
        badHttpResponseCount:
          fq23Qa.freshBrowserObservations.badHttpResponseCount,
        externalRequestCount:
          fq23Qa.freshBrowserObservations.externalRequestCount,
        productQaComplete: false,
      },
      wholeLessonProductQa: {
        receiptId: wholeLessonQa.receiptId,
        packageId: wholeLessonQa.packageEvidence.packageId,
        currentJavascriptFreshPackageQaPassed:
          wholeLessonQa.scopeResult
            .currentJavascriptFreshPackageWholeLessonQaPassed,
        releaseMemberCount: wholeLessonQa.scope.releaseMembers,
        activePageCount: wholeLessonQa.scope.activePages,
        englishReadyPageCount:
          wholeLessonQa.freshBrowserObservations.englishPagesReady,
        spanishReadyPageCount:
          wholeLessonQa.freshBrowserObservations.spanishPagesReady,
        reducedMotionContextApplied:
          wholeLessonQa.freshBrowserObservations.reducedMotionContextApplied,
        spanishMobileHorizontalOverflow:
          wholeLessonQa.freshBrowserObservations.spanishMobile
            .horizontalOverflow,
        englishGlossaryEntryCount:
          wholeLessonQa.freshBrowserObservations.glossaryCounts.englishIndex,
        spanishGlossaryEntryCount:
          wholeLessonQa.freshBrowserObservations.glossaryCounts.spanishIndex,
        exactReleaseOrderFreshlyEstablished:
          wholeLessonQa.scopeResult.exactReleaseOrderFreshlyEstablished,
        courseMapInteractionFreshlyReperformed:
          wholeLessonQa.scopeResult.courseMapInteractionFreshlyReperformed,
        keyTermsEscapeFocusFreshlyReperformed:
          wholeLessonQa.scopeResult.keyTermsEscapeFocusFreshlyReperformed,
        predecessorClaimsCarriedForward:
          wholeLessonQa.scopeResult.predecessorClaimsCarriedForward,
        spanishSourceVisualParityEstablished: false,
        consoleErrorCount:
          wholeLessonQa.freshBrowserObservations.consoleErrorCount,
        pageErrorCount:
          wholeLessonQa.freshBrowserObservations.pageErrorCount,
        failedRequestCount:
          wholeLessonQa.freshBrowserObservations.failedRequestCount,
        badHttpResponseCount:
          wholeLessonQa.freshBrowserObservations.badHttpResponseCount,
        externalRequestCount:
          wholeLessonQa.freshBrowserObservations.externalRequestCount,
        productQaComplete: false,
      },
      standalonePackage: {
        packageId: standalonePackageSmoke.packageId,
        status: standalonePackageSmoke.status,
        archive: descriptor(standalonePackageArchive),
        packageManifest: descriptor(standalonePackageManifest),
        freshArchiveExtraction: true,
        packageMemberCount: standalonePackageSmoke.packageVerifier.members,
        currentJavascriptPageCount:
          standalonePackageSmoke.packageVerifier.currentJavascriptPages,
        englishPagesReady: standalonePackageSmoke.englishPagesReady,
        spanishPagesReady: standalonePackageSmoke.spanishPagesReady,
        privacyScanPassed: true,
        strictCompleteCount: 0,
        published: false,
      },
    },
    machinePreparationExhaustedBeforeHumanGate,
    machinePreparationExhaustionBoundary:
      machinePreparationExhaustedBeforeHumanGate
        ? "true only for the current hash-bound, explicitly defined machine-only continuation scope; any changed or stale input closes this claim, and the claim is not implementation or fidelity completion"
        : "false because current hash-bound specification evidence identifies remaining automatically advanceable machine-only tasks; human, runtime, review, acceptance, strict, and publication gates remain independently closed",
    nextRequiredGates: [
      "preserve the completed hash-bound machine-only static reconciliation, strict-readiness, scenario-inventory, and frame-domain-disposition state without promoting runtime reachability or acceptance",
      "preserve the authorized combined elementary product-reference disposition while separately recovering and hash-binding L4KTE01.xml and L4KTS01.xml or establishing a validator-supported reviewed exception without invented content",
      "separately obtain Owner technical approval and live-session verification for the eight machine-selected CR-01 through CR-08 candidates, resolve the incomplete CR-02 dependency boundary, and bind an exact authorized session",
      "complete immutable per-session authorization, named operator declaration, original-runtime EN/ES traversal, and 44 human Animate audits",
      "complete independent engineering, visual, audio, and Spanish review plus separate Owner fidelity, strict-validation, and atomic-publication approvals",
      "retain the 52 bounded canonical current-JavaScript engineering candidates as acceptance-neutral, keep FQ001 canonical root-only until its frame-domain disposition is proven, keep product-only FQ002/FQ003 atlases outside canonical promotion, and complete authoritative comparison for all 55 members only after the applicable source, runtime, and authority gates permit it",
    ],
    summary: {
      releaseMemberCount: 55,
      candidatePackageCount: 55,
      candidateFileCount: 385,
      definitionCandidateCount: 12066,
      scriptCandidateCount: 2332,
      sourceDerivedAssetCandidateMemberCount: assetInventoryPopulatedCount,
      sourceDerivedAssetCandidateRowCount: assetInventoryRowCount,
      sourceDerivedKeyframeCandidateMemberCount:
        keyframeInventoryPopulatedCount,
      sourceDerivedKeyframeCandidateRowCount: keyframeRowCount,
      authoritativeBaselineKeyframeCount: 0,
      unsignedSessionTemplateCount: 154,
      unsignedReviewAndApprovalTemplateCount: 223,
      totalUnsignedHumanGateTemplateCount: 377,
      missingXmlCount: 2,
      exactRecoveryCandidateCount: 0,
      combinedElementaryKeytermsReferenceAuthorized: true,
      combinedReferenceRuntimeByteVariantVerified: false,
      currentJavascriptPrivatePreviewImplementationAuthorized: true,
      currentJavascriptPrivatePreviewQaAuthorized: true,
      currentJavascriptFq23ScopedQaPassed: true,
      currentJavascriptFq23QaMemberCount: 2,
      currentJavascriptWholeLessonScopedQaPassed: true,
      currentJavascriptWholeLessonReadyPageCount: 54,
      currentJavascriptWholeLessonMinimumPageStateVisitCount: 162,
      standalonePackageFreshUnzipSmokePassed: true,
      standalonePackageCurrentJavascriptPageCount: 54,
      ownerWorkAuthorizationReceiptCount: 1,
      implementationWorkAuthorized: true,
      runtimeExecutionWorkAuthorized: true,
      containmentMechanismsSelected: 8,
      containmentCandidateImplementationsPresent: 8,
      containmentOfflineOrDiagnosticVerified: 8,
      containmentOwnerTechnicalApprovals: 0,
      containmentLiveSessionVerified: 0,
      materializedReadOnlyHostTreeCandidateCount: 1,
      materializedEmptyRuntimeProfileCandidateCount: 2,
      sourceStaticEngineeringCandidateCount,
      manifestBoundSingleSpriteCandidateCount,
      fullSingleSpriteCandidateCount,
      safePrefixSingleSpriteCandidateCount,
      independentDualSpriteCompositeCandidateCount,
      canonicalNestedCoverageCandidateCount,
      sourceStaticOpenFrameCount,
      sourceStaticBlockedTailFrameCount,
      currentJavaScriptOutputPresentCount,
      coverageRequirementCount,
      coverageRootOnlyRequirementCount,
      coverageNestedRequirementCount,
      coverageRequiredFrameCount,
      coverageMissingFrameCount,
      actualOriginalRuntimeSessionCount: 0,
      actualAnimateAuditCount: 0,
      actualReviewAcceptanceCount: 0,
      actualOwnerFidelityAcceptanceCount: 0,
      implementationStartedCount,
      strictCompleteCount: 0,
      publishedCount: 0,
      machinePreparationExhaustedBeforeHumanGate,
      implementationComplete: false,
      fidelityMigrationComplete: false,
    },
    acceptanceEffects: {
      animateAuditAccepted: false,
      audioAccepted: false,
      authoritativeOriginalRuntime: false,
      behaviorAccepted: false,
      externalDeploymentAuthorized: false,
      fidelityAccepted: false,
      fullFrameAccepted: false,
      humanReviewAccepted: false,
      implementationAuthorized: false,
      implementationComplete: false,
      ownerFidelityAccepted: false,
      publicationAuthorized: false,
      published: false,
      publicReleaseAuthorized: false,
      rendererSelected: false,
      rmseAccepted: false,
      sourceGapClosed: false,
      strictComplete: false,
      strictValidationApproved: false,
    },
    strictAcceptanceEffect: STRICT_ACCEPTANCE_EFFECT,
  };
  report.reportFingerprintSha256 = sha256Bytes(
    Buffer.from(stableJson(report)),
  );
  validateG5L4ContinuationMachineReadiness(report, {
    expectedSourceBindings: sourceBindings,
  });
  return report;
}

export function validateG5L4ContinuationMachineReadiness(
  report,
  {expectedSourceBindings} = {},
) {
  const ownerWorkAuthorizationProjectionPresent =
    report?.ownerWorkAuthorization !== undefined;
  const ownerWorkAuthorizationBindingPresent =
    report?.sourceBindings?.ownerWorkAuthorizationReceipt !== undefined;
  invariant(
    ownerWorkAuthorizationProjectionPresent ===
      ownerWorkAuthorizationBindingPresent,
    "continuation Owner work-authorization projection/binding presence drifted",
  );
  assertExactKeys(
    report,
    [
      "schemaVersion", "reportType", "releaseId", "evidenceState", "authority",
      "generator", "sourceBindings",
      ...(ownerWorkAuthorizationProjectionPresent ? ["ownerWorkAuthorization"] : []),
      "inputCurrency", "machinePreparation", "currentJavascriptPrivatePreviewEvidence",
      "machinePreparationExhaustedBeforeHumanGate",
      "machinePreparationExhaustionBoundary", "nextRequiredGates", "summary",
      "acceptanceEffects", "strictAcceptanceEffect", "reportFingerprintSha256",
    ],
    "continuation report",
  );
  assertNoG5L4ProtectedGatePromotion(report, {
    label: "continuation report",
  });
  const expectedInputKeys = ownerWorkAuthorizationProjectionPresent
    ? [...INPUT_KEYS]
    : INPUT_KEYS.filter((key) => key !== "ownerWorkAuthorizationReceipt");
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l4-continuation-machine-readiness" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        (report.machinePreparationExhaustedBeforeHumanGate
          ? "all-current-bounded-machine-preparation-exhausted-before-human-owner-original-runtime-gates"
          : "all-current-bounded-machine-preparation-in-progress-before-human-owner-original-runtime-gates") &&
      report.authority ===
        (ownerWorkAuthorizationProjectionPresent ? AUTHORITY : LEGACY_AUTHORITY),
    "continuation report identity or authority drifted",
  );
  invariant(
    report.generator?.path === GENERATOR_PATH &&
      Number.isInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      SHA256.test(report.generator.sha256 || ""),
    "continuation generator binding drifted",
  );
  invariant(
    JSON.stringify(Object.keys(report.sourceBindings || {}).sort()) ===
      JSON.stringify([...expectedInputKeys].sort()),
    "continuation source-binding key set drifted",
  );
  for (const key of expectedInputKeys) {
    const binding = report.sourceBindings[key];
    invariant(
      binding?.path === INPUT_PATHS[key] &&
        Number.isInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256.test(binding.sha256 || ""),
      `${key}: source descriptor drifted`,
    );
    if (expectedSourceBindings) {
      assertDescriptor(
        binding,
        expectedSourceBindings[key],
        `${key} current source binding`,
      );
    }
  }
  if (ownerWorkAuthorizationProjectionPresent) {
    validateG5L4OwnerWorkAuthorizationProjection(
      report.ownerWorkAuthorization,
      report.sourceBindings.ownerWorkAuthorizationReceipt,
    );
  }
  const projection = inputSetProjection(
    report.sourceBindings,
    expectedInputKeys,
  );
  invariant(
    expectedInputKeys.length ===
        (ownerWorkAuthorizationProjectionPresent ? 15 : 14) &&
      report.inputCurrency?.boundInputCount === expectedInputKeys.length &&
      JSON.stringify(report.inputCurrency.inputKeys) ===
        JSON.stringify(expectedInputKeys) &&
      report.inputCurrency.inputSetSha256 ===
        sha256Bytes(Buffer.from(stableJson(projection))) &&
      report.inputCurrency.exactOwnerDirectiveVerified === true &&
      (ownerWorkAuthorizationProjectionPresent
        ? report.inputCurrency.ownerWorkAuthorizationReceiptVerified === true
        : report.inputCurrency.ownerWorkAuthorizationReceiptVerified ===
          undefined) &&
      report.inputCurrency.upstreamFreshRebuildCheckCount ===
        UPSTREAM_REBUILD_CHECK_COUNT &&
      report.inputCurrency.upstreamFreshRebuildVerifiedCount ===
        UPSTREAM_REBUILD_CHECK_COUNT &&
      report.inputCurrency.supplementalEvidenceValidatorCount ===
        SUPPLEMENTAL_EVIDENCE_VALIDATOR_COUNT &&
      report.inputCurrency.supplementalEvidenceVerifiedCount ===
        SUPPLEMENTAL_EVIDENCE_VALIDATOR_COUNT &&
      report.inputCurrency.crossReportDescriptorCasVerified === true &&
      report.inputCurrency.standalonePackageArchiveCasVerified === true &&
      report.inputCurrency.allInputsCurrent === true,
    "continuation input currency or descriptor CAS drifted",
  );

  const runtimeMechanisms =
    report.machinePreparation?.runtimeMechanismCandidates;
  assertExactKeys(
    runtimeMechanisms,
    [
      "state", "bindingMode", "sourceReport", "controlsSpecified",
      "mechanismsSelected", "candidateImplementationsPresent",
      "offlineOrDiagnosticVerified", "ownerTechnicalApprovals",
      "liveSessionVerified", "materializedReadOnlyHostTrees",
      "materializedEmptyProfiles", "originalRuntimeSessionsExecuted",
      "productionLauncherEnabled", "liveObserverSupervisorImplemented",
      "freshProjectorAbsencePassed",
      "immutableExactSessionAuthorizationPresent", "runnable",
      "strictAcceptanceEffect",
    ],
    "continuation runtime-mechanism candidates",
  );
  assertExactKeys(
    runtimeMechanisms.sourceReport,
    [
      "path", "bytes", "sha256", "schemaVersion", "reportType",
      "reportFingerprintSha256",
    ],
    "continuation runtime-mechanism source report",
  );
  invariant(
    runtimeMechanisms.state ===
        "acceptance-neutral-machine-selected-candidates-owner-live-runtime-gates-closed" &&
      runtimeMechanisms.bindingMode ===
        "transitive-through-original-runtime-containment-readiness" &&
      runtimeMechanisms.sourceReport.path ===
        "reports/g5-l4-runtime-mechanism-candidate-readiness.json" &&
      Number.isInteger(runtimeMechanisms.sourceReport.bytes) &&
      runtimeMechanisms.sourceReport.bytes > 0 &&
      SHA256.test(runtimeMechanisms.sourceReport.sha256 || "") &&
      runtimeMechanisms.sourceReport.schemaVersion === 1 &&
      runtimeMechanisms.sourceReport.reportType ===
        "g5-l4-runtime-mechanism-candidate-readiness" &&
      SHA256.test(
        runtimeMechanisms.sourceReport.reportFingerprintSha256 || "",
      ) &&
      runtimeMechanisms.controlsSpecified === 8 &&
      runtimeMechanisms.mechanismsSelected === 8 &&
      runtimeMechanisms.candidateImplementationsPresent === 8 &&
      runtimeMechanisms.offlineOrDiagnosticVerified === 8 &&
      runtimeMechanisms.ownerTechnicalApprovals === 0 &&
      runtimeMechanisms.liveSessionVerified === 0 &&
      runtimeMechanisms.materializedReadOnlyHostTrees === 1 &&
      runtimeMechanisms.materializedEmptyProfiles === 2 &&
      runtimeMechanisms.originalRuntimeSessionsExecuted === 0 &&
      runtimeMechanisms.productionLauncherEnabled === false &&
      runtimeMechanisms.liveObserverSupervisorImplemented === false &&
      runtimeMechanisms.freshProjectorAbsencePassed === false &&
      runtimeMechanisms.immutableExactSessionAuthorizationPresent === false &&
      runtimeMechanisms.runnable === false &&
      typeof runtimeMechanisms.strictAcceptanceEffect === "string" &&
      runtimeMechanisms.strictAcceptanceEffect.startsWith("none;"),
    "continuation runtime-mechanism candidate boundary drifted",
  );

  const specification =
    report.machinePreparation?.specificationCandidates;
  invariant(
    specification?.expectedMemberCount === 55 &&
      specification.candidatePackageCount === 55 &&
      specification.candidateFileCount === 385 &&
      specification.definitionCandidateCount === 12066 &&
      specification.scriptCandidateCount === 2332 &&
      specification.sourceDerivedAssetCandidateMemberCount === 55 &&
      specification.sourceDerivedAssetCandidateRowCount === 12066 &&
      specification.sourceDerivedKeyframeCandidateMemberCount === 55 &&
      specification.sourceDerivedKeyframeCandidateRowCount === 802 &&
      specification.authoritativeBaselineKeyframeCount === 0 &&
      Number.isSafeInteger(
        specification.remainingAutomaticallyAdvanceableTaskCount,
      ) &&
      specification.remainingAutomaticallyAdvanceableTaskCount >= 0 &&
      Number.isSafeInteger(
        specification.safeMachineCandidateWorkAvailableCount,
      ) &&
      specification.safeMachineCandidateWorkAvailableCount >= 0 &&
      specification.safeMachineCandidateWorkAvailableCount <= 55 &&
      (specification.remainingAutomaticallyAdvanceableTaskCount === 0) ===
        (specification.safeMachineCandidateWorkAvailableCount === 0) &&
      specification.implementationSpecificationReadyCount === 0,
    "continuation specification candidate counts drifted",
  );
  const engineeringCandidates =
    report.machinePreparation?.sourceStaticEngineeringCandidates;
  invariant(
    JSON.stringify(engineeringCandidates?.candidateIds) ===
      JSON.stringify(SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS) &&
      engineeringCandidates.candidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      engineeringCandidates.manifestBoundSingleSpriteCandidateCount === 51 &&
      engineeringCandidates.fullSingleSpriteCandidateCount === 20 &&
      engineeringCandidates.safePrefixSingleSpriteCandidateCount === 31 &&
      engineeringCandidates.independentDualSpriteCompositeCandidateCount ===
        1 &&
      engineeringCandidates.canonicalNestedCoverageCandidateCount === 51 &&
      engineeringCandidates.openFrameCount === 13696 &&
      engineeringCandidates.blockedTailFrameCount === 3020 &&
      engineeringCandidates.currentJavaScriptOutputPresentCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      engineeringCandidates.rendererSelectedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      engineeringCandidates.routeDeclaredCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      engineeringCandidates.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      engineeringCandidates.strictAcceptanceEffect ===
        "none; these 52 entries are bounded canonical current-JavaScript engineering candidates only",
    "continuation source-static engineering-candidate identity drifted",
  );
  for (const key of [
    "implementationAuthorizedCount",
    "authoritativeRuntimeReachabilityEstablishedCount",
    "originalRuntimeSessionCount",
    "spanishEnabledCount",
    "audioEnabledCount",
    "rmseComputedCount",
    "humanReviewAcceptedCount",
    "ownerFidelityAcceptedCount",
    "strictCompleteCount",
    "publishedCount",
  ]) {
    invariant(
      engineeringCandidates[key] === 0,
      `continuation engineering candidates promoted ${key}`,
    );
  }
  const coverage = report.machinePreparation?.coverageObligations;
  invariant(
    coverage?.requirementCount === 212 &&
      coverage.rootRequirementCount === 110 &&
      coverage.nestedRequirementCount === 102 &&
      coverage.requiredFrameCount === 34508 &&
      coverage.missingFrameCount === 34508 &&
      coverage.authoritativeBaselineCount === 0 &&
      coverage.authoritativeRuntimeReachabilityEstablishedCount === 0 &&
      coverage.specificationReadyCount === 0 &&
      coverage.state ===
        "all-root-and-conservative-nested-requirements-pending-no-authoritative-baseline",
    "continuation coverage-obligation counts or authority boundary drifted",
  );
  const sessions = report.machinePreparation?.unsignedSessionTemplates;
  invariant(
    sessions?.originalRuntimeEnglishCount === 55 &&
      sessions.originalRuntimeSpanishCount === 55 &&
      sessions.originalRuntimeTotalCount === 110 &&
      sessions.animateCount === 44 &&
      sessions.totalCount === 154 &&
      sessions.signedCount === 0 &&
      sessions.runnableCount === 0 &&
      sessions.executedCount === 0,
    "continuation unsigned-session counts or execution boundary drifted",
  );
  const reviews =
    report.machinePreparation?.unsignedReviewAndApprovalTemplates;
  invariant(
    reviews?.independentEngineeringCount === 55 &&
      reviews.independentVisualCount === 55 &&
      reviews.independentAudioCount === 55 &&
      reviews.independentSpanishCount === 55 &&
      reviews.memberReviewCount === 220 &&
      reviews.releaseApprovalCount === 3 &&
      reviews.totalCount === 223 &&
      reviews.assignedCount === 0 &&
      reviews.signedCount === 0 &&
      reviews.acceptedCount === 0,
    "continuation unsigned-review counts or acceptance boundary drifted",
  );
  const authorizedReference =
    report.machinePreparation?.authorizedCombinedElementaryKeytermsReference;
  invariant(
    authorizedReference?.state ===
        "authorized-product-reference-only-lesson-source-gap-open" &&
      authorizedReference.directionEvidenceClass ===
        "owner-relayed-content-manager-email" &&
      authorizedReference.referenceUseAuthorized === true &&
      authorizedReference.intakeSourceCount === 2 &&
      SHA256.test(authorizedReference.intakeSourceSetSha256 || "") &&
      authorizedReference.parsedRecordCount === 1626 &&
      authorizedReference.knownUnrelatedMalformedRecordCount === 1 &&
      authorizedReference.intakeSources?.english?.path ===
        "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml" &&
      authorizedReference.intakeSources.english.bytes === 398191 &&
      authorizedReference.intakeSources.english.sha256 ===
        "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c" &&
      authorizedReference.intakeSources?.spanish?.path ===
        "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml" &&
      authorizedReference.intakeSources.spanish.bytes === 396776 &&
      authorizedReference.intakeSources.spanish.sha256 ===
        "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d" &&
      authorizedReference.canonical2008MasterSelected === true &&
      authorizedReference.ownerIntake2015Selected === false &&
      authorizedReference.runtimeByteVariantVerified === false &&
      authorizedReference.exactRecoveryCandidateCount === 0 &&
      authorizedReference.recoveredTargetCount === 0 &&
      authorizedReference.missingLessonSourcesRecovered === false &&
      authorizedReference.sourceGapClosed === false &&
      authorizedReference.substitutionAuthorized === false &&
      authorizedReference.fidelityAccepted === false &&
      authorizedReference.strictComplete === false &&
      authorizedReference.published === false,
    "continuation authorized combined-reference boundary drifted",
  );
  const recovery = report.machinePreparation?.missingKeytermRecovery;
  invariant(
    recovery?.missingXmlCount === 2 &&
      recovery.exactRecoveryCandidateCount === 0 &&
      recovery.recoveredCount === 0 &&
      recovery.combinedReferenceUseAuthorized === true &&
      recovery.sourceGapClosed === false &&
      recovery.importAuthorized === false &&
      recovery.substitutionAuthorized === false,
    "continuation missing-KeyTerm recovery boundary drifted",
  );
  invariant(
    report.machinePreparation.totalUnsignedHumanGateTemplateCount === 377 &&
      report.machinePreparationExhaustedBeforeHumanGate ===
        (specification.remainingAutomaticallyAdvanceableTaskCount === 0 &&
          specification.safeMachineCandidateWorkAvailableCount === 0) &&
      typeof report.machinePreparationExhaustionBoundary === "string" &&
      report.machinePreparationExhaustionBoundary.startsWith(
        report.machinePreparationExhaustedBeforeHumanGate
          ? "true only for the current hash-bound"
          : "false because current hash-bound",
      ) &&
      Array.isArray(report.nextRequiredGates) &&
      report.nextRequiredGates.length === 6,
    "continuation machine-preparation exhaustion boundary drifted",
  );

  const privatePreview = report.currentJavascriptPrivatePreviewEvidence;
  const authorization = privatePreview?.authorization;
  invariant(
    authorization?.state ===
        "owner-authorized-current-js-private-preview-scope-only" &&
      authorization.currentJsRendererImplementationAuthorized === true &&
      authorization.sourceDerivedBehaviorCandidateImplementationAuthorized ===
        true &&
      authorization.currentJsProductQaAuthorized === true &&
      authorization.privateControlledCeoPreviewPreparationAuthorized === true &&
      authorization.controlledPreviewHumanNaturalEntryRequirementWaived ===
        true &&
      authorization.migrationStrictImplementationAuthorizedCount === 0,
    "continuation current-JS private-preview authorization drifted",
  );
  assertAllFalse(authorization, [
    "originalRuntimeEvidenceEstablished",
    "naturalNavigationCausalityEstablished",
    "independentHumanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "externalDeploymentAuthorized",
    "publicReleaseAuthorized",
    "publicationAuthorized",
  ], "continuation current-JS private-preview non-promotion boundary");
  const productReference =
    privatePreview.combinedElementaryKeytermsProductReference;
  invariant(
    productReference?.successorReceiptVerified === true &&
      productReference.selectedVariant === "canonical-preserved-master" &&
      productReference.englishClientTermCount === 761 &&
      productReference.spanishClientTermCount === 753 &&
      productReference.missingLessonSpecificSourceCount === 2 &&
      productReference.lessonSpecificSubstitutionAuthorized === false &&
      productReference.sourceGapClosed === false,
    "continuation combined-KeyTerms product successor drifted",
  );
  const sourceDerived = privatePreview.sourceDerivedSpecificationCandidates;
  invariant(
    sourceDerived?.assetBindingMode ===
        "indirect-through-specification-readiness-member-workspace-descriptors" &&
      sourceDerived.assetSuccessorReceiptCount === 55 &&
      sourceDerived.assetCandidateRowCount === 12066 &&
      sourceDerived.keyframeSuccessorReceiptCount === 1 &&
      sourceDerived.keyframeCandidateMemberCount === 55 &&
      sourceDerived.keyframeCandidateRowCount === 802 &&
      sourceDerived.authoritativeBaselineKeyframeCount === 0 &&
      sourceDerived.observedRuntimeKeyframeRowCount === 0 &&
      sourceDerived.finalSpecificationComplete === false,
    "continuation source-derived successor counts or boundary drifted",
  );
  const fq23Qa = privatePreview.fq23CompanionQa;
  invariant(
    fq23Qa?.receiptId ===
        "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4" &&
      fq23Qa.memberCount === 2 &&
      fq23Qa.packageId === "g5-l4-whole-lesson-package-mvp-v6" &&
      fq23Qa.currentJavascriptFreshPackageQaPassed === true &&
      fq23Qa.answerSelectionSubmitAndReplayResetPassed === true &&
      fq23Qa.fullScoreAndReviewFlowFreshlyReperformed === false &&
      fq23Qa.predecessorClaimsCarriedForward === false &&
      fq23Qa.consoleErrorCount === 0 &&
      fq23Qa.pageErrorCount === 0 &&
      fq23Qa.failedRequestCount === 0 &&
      fq23Qa.badHttpResponseCount === 0 &&
      fq23Qa.externalRequestCount === 0 &&
      fq23Qa.productQaComplete === false,
    "continuation FQ23 current-JS QA successor boundary drifted",
  );
  const wholeLessonQa = privatePreview.wholeLessonProductQa;
  invariant(
    wholeLessonQa?.receiptId ===
        "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4" &&
      wholeLessonQa.packageId === "g5-l4-whole-lesson-package-mvp-v6" &&
      wholeLessonQa.currentJavascriptFreshPackageQaPassed === true &&
      wholeLessonQa.releaseMemberCount === 55 &&
      wholeLessonQa.activePageCount === 54 &&
      wholeLessonQa.englishReadyPageCount === 54 &&
      wholeLessonQa.spanishReadyPageCount === 54 &&
      wholeLessonQa.reducedMotionContextApplied === true &&
      wholeLessonQa.spanishMobileHorizontalOverflow === false &&
      wholeLessonQa.englishGlossaryEntryCount === 761 &&
      wholeLessonQa.spanishGlossaryEntryCount === 753 &&
      wholeLessonQa.exactReleaseOrderFreshlyEstablished === false &&
      wholeLessonQa.courseMapInteractionFreshlyReperformed === false &&
      wholeLessonQa.keyTermsEscapeFocusFreshlyReperformed === false &&
      wholeLessonQa.predecessorClaimsCarriedForward === false &&
      wholeLessonQa.spanishSourceVisualParityEstablished === false &&
      wholeLessonQa.consoleErrorCount === 0 &&
      wholeLessonQa.pageErrorCount === 0 &&
      wholeLessonQa.failedRequestCount === 0 &&
      wholeLessonQa.badHttpResponseCount === 0 &&
      wholeLessonQa.externalRequestCount === 0 &&
      wholeLessonQa.productQaComplete === false,
    "continuation whole-lesson current-JS QA successor boundary drifted",
  );
  const standalonePackage = privatePreview.standalonePackage;
  invariant(
    standalonePackage?.packageId ===
        "g5-l4-whole-lesson-package-mvp-v6" &&
      standalonePackage.status ===
        "pass-current-javascript-private-preview" &&
      standalonePackage.archive?.path ===
        "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip" &&
      Number.isSafeInteger(standalonePackage.archive.bytes) &&
      standalonePackage.archive.bytes > 0 &&
      SHA256.test(standalonePackage.archive.sha256 || "") &&
      standalonePackage.packageManifest?.path ===
        STANDALONE_PACKAGE_MANIFEST_PATH &&
      Number.isSafeInteger(standalonePackage.packageManifest.bytes) &&
      standalonePackage.packageManifest.bytes > 0 &&
      SHA256.test(standalonePackage.packageManifest.sha256 || "") &&
      standalonePackage.freshArchiveExtraction === true &&
      standalonePackage.packageMemberCount === 55 &&
      standalonePackage.currentJavascriptPageCount === 54 &&
      standalonePackage.englishPagesReady === 54 &&
      standalonePackage.spanishPagesReady === 54 &&
      standalonePackage.privacyScanPassed === true &&
      standalonePackage.strictCompleteCount === 0 &&
      standalonePackage.published === false,
    "continuation standalone-package private-preview boundary drifted",
  );

  const summary = report.summary;
  assertExactKeys(
    summary,
    [
      "releaseMemberCount", "candidatePackageCount", "candidateFileCount",
      "definitionCandidateCount", "scriptCandidateCount",
      "sourceDerivedAssetCandidateMemberCount", "sourceDerivedAssetCandidateRowCount",
      "sourceDerivedKeyframeCandidateMemberCount", "sourceDerivedKeyframeCandidateRowCount",
      "authoritativeBaselineKeyframeCount", "unsignedSessionTemplateCount",
      "unsignedReviewAndApprovalTemplateCount", "totalUnsignedHumanGateTemplateCount",
      "missingXmlCount", "exactRecoveryCandidateCount",
      "combinedElementaryKeytermsReferenceAuthorized",
      "combinedReferenceRuntimeByteVariantVerified",
      "currentJavascriptPrivatePreviewImplementationAuthorized",
      "currentJavascriptPrivatePreviewQaAuthorized", "currentJavascriptFq23ScopedQaPassed",
      "currentJavascriptFq23QaMemberCount", "currentJavascriptWholeLessonScopedQaPassed",
      "currentJavascriptWholeLessonReadyPageCount",
      "currentJavascriptWholeLessonMinimumPageStateVisitCount",
      "standalonePackageFreshUnzipSmokePassed",
      "standalonePackageCurrentJavascriptPageCount",
      ...(ownerWorkAuthorizationProjectionPresent
        ? ["ownerWorkAuthorizationReceiptCount", "implementationWorkAuthorized", "runtimeExecutionWorkAuthorized"]
        : []),
      "containmentMechanismsSelected",
      "containmentCandidateImplementationsPresent",
      "containmentOfflineOrDiagnosticVerified",
      "containmentOwnerTechnicalApprovals",
      "containmentLiveSessionVerified",
      "materializedReadOnlyHostTreeCandidateCount",
      "materializedEmptyRuntimeProfileCandidateCount",
      "sourceStaticEngineeringCandidateCount", "manifestBoundSingleSpriteCandidateCount",
      "fullSingleSpriteCandidateCount", "safePrefixSingleSpriteCandidateCount",
      "independentDualSpriteCompositeCandidateCount", "canonicalNestedCoverageCandidateCount",
      "sourceStaticOpenFrameCount", "sourceStaticBlockedTailFrameCount",
      "currentJavaScriptOutputPresentCount", "coverageRequirementCount",
      "coverageRootOnlyRequirementCount", "coverageNestedRequirementCount",
      "coverageRequiredFrameCount", "coverageMissingFrameCount",
      "actualOriginalRuntimeSessionCount", "actualAnimateAuditCount",
      "actualReviewAcceptanceCount", "actualOwnerFidelityAcceptanceCount",
      "implementationStartedCount", "strictCompleteCount", "publishedCount",
      "machinePreparationExhaustedBeforeHumanGate", "implementationComplete",
      "fidelityMigrationComplete",
    ],
    "continuation summary",
  );
  invariant(
    summary?.releaseMemberCount === 55 &&
      summary.candidatePackageCount === 55 &&
      summary.candidateFileCount === 385 &&
      summary.definitionCandidateCount === 12066 &&
      summary.scriptCandidateCount === 2332 &&
      summary.sourceDerivedAssetCandidateMemberCount === 55 &&
      summary.sourceDerivedAssetCandidateRowCount === 12066 &&
      summary.sourceDerivedKeyframeCandidateMemberCount === 55 &&
      summary.sourceDerivedKeyframeCandidateRowCount === 802 &&
      summary.authoritativeBaselineKeyframeCount === 0 &&
      summary.unsignedSessionTemplateCount === 154 &&
      summary.unsignedReviewAndApprovalTemplateCount === 223 &&
      summary.totalUnsignedHumanGateTemplateCount === 377 &&
      summary.missingXmlCount === 2 &&
      summary.exactRecoveryCandidateCount === 0 &&
      summary.combinedElementaryKeytermsReferenceAuthorized === true &&
      summary.combinedReferenceRuntimeByteVariantVerified === false &&
      summary.currentJavascriptPrivatePreviewImplementationAuthorized === true &&
      summary.currentJavascriptPrivatePreviewQaAuthorized === true &&
      summary.currentJavascriptFq23ScopedQaPassed === true &&
      summary.currentJavascriptFq23QaMemberCount === 2 &&
      summary.currentJavascriptWholeLessonScopedQaPassed === true &&
      summary.currentJavascriptWholeLessonReadyPageCount === 54 &&
      summary.currentJavascriptWholeLessonMinimumPageStateVisitCount === 162 &&
      summary.standalonePackageFreshUnzipSmokePassed === true &&
      summary.standalonePackageCurrentJavascriptPageCount === 54 &&
      (ownerWorkAuthorizationProjectionPresent
        ? summary.ownerWorkAuthorizationReceiptCount === 1 &&
          summary.implementationWorkAuthorized === true &&
          summary.runtimeExecutionWorkAuthorized === true
        : summary.ownerWorkAuthorizationReceiptCount === undefined &&
          summary.implementationWorkAuthorized === undefined &&
          summary.runtimeExecutionWorkAuthorized === undefined) &&
      summary.containmentMechanismsSelected === 8 &&
      summary.containmentCandidateImplementationsPresent === 8 &&
      summary.containmentOfflineOrDiagnosticVerified === 8 &&
      summary.containmentOwnerTechnicalApprovals === 0 &&
      summary.containmentLiveSessionVerified === 0 &&
      summary.materializedReadOnlyHostTreeCandidateCount === 1 &&
      summary.materializedEmptyRuntimeProfileCandidateCount === 2 &&
      summary.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      summary.fullSingleSpriteCandidateCount === 20 &&
      summary.safePrefixSingleSpriteCandidateCount === 31 &&
      summary.independentDualSpriteCompositeCandidateCount === 1 &&
      summary.canonicalNestedCoverageCandidateCount === 51 &&
      summary.sourceStaticOpenFrameCount === 13696 &&
      summary.sourceStaticBlockedTailFrameCount === 3020 &&
      summary.currentJavaScriptOutputPresentCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.coverageRequirementCount === 212 &&
      summary.coverageRootOnlyRequirementCount === 110 &&
      summary.coverageNestedRequirementCount === 102 &&
      summary.coverageRequiredFrameCount === 34508 &&
      summary.coverageMissingFrameCount === 34508 &&
      summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.machinePreparationExhaustedBeforeHumanGate ===
        report.machinePreparationExhaustedBeforeHumanGate &&
      summary.implementationComplete === false &&
      summary.fidelityMigrationComplete === false,
    "continuation summary exact counts or completion boundary drifted",
  );
  for (const key of [
    "actualOriginalRuntimeSessionCount",
    "actualAnimateAuditCount",
    "actualReviewAcceptanceCount",
    "actualOwnerFidelityAcceptanceCount",
    "strictCompleteCount",
    "publishedCount",
  ]) {
    invariant(summary[key] === 0, `continuation summary promoted ${key}`);
  }
  assertExactKeys(
    report.acceptanceEffects,
    [
      "animateAuditAccepted", "audioAccepted", "authoritativeOriginalRuntime",
      "behaviorAccepted", "externalDeploymentAuthorized", "fidelityAccepted",
      "fullFrameAccepted", "humanReviewAccepted", "implementationAuthorized",
      "implementationComplete", "ownerFidelityAccepted", "publicationAuthorized",
      "published", "publicReleaseAuthorized", "rendererSelected", "rmseAccepted",
      "sourceGapClosed", "strictComplete", "strictValidationApproved",
    ],
    "continuation acceptance effects",
  );
  invariant(
    Object.values(report.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "continuation report promoted an acceptance effect",
  );
  invariant(
    report.strictAcceptanceEffect === STRICT_ACCEPTANCE_EFFECT,
    "continuation strict-acceptance effect drifted",
  );
  const fingerprint = report.reportFingerprintSha256;
  invariant(
    SHA256.test(fingerprint || ""),
    "continuation report fingerprint is missing",
  );
  const copy = {...report};
  delete copy.reportFingerprintSha256;
  invariant(
    fingerprint === sha256Bytes(Buffer.from(stableJson(copy))),
    "continuation report fingerprint drifted",
  );
  return true;
}

export function renderMarkdown(report) {
  validateG5L4ContinuationMachineReadiness(report);
  const inputs = report.inputCurrency.inputKeys.map((key) => {
    const binding = report.sourceBindings[key];
    return `| \`${key}\` | \`${binding.path}\` | ${binding.bytes} | \`${binding.sha256}\` |`;
  }).join("\n");
  return `# G5 L4 continuation machine readiness

Release: \`${RELEASE_ID}\` — **Number Lines**

> ${report.authority}

## Outcome

- Bound inputs current: **${report.inputCurrency.boundInputCount}/${report.inputCurrency.boundInputCount}**; fresh upstream report rebuilds verified: **7/7**; supplemental evidence validators: **6/6**; cross-report descriptor and standalone-archive CAS: **true**.
- Runtime containment engineering candidates: **8/8 selected / 8/8 candidate implementations / 8/8 offline or diagnostic checks**; Owner technical approvals / live-session verifications / runtime sessions / runnable artifacts: **0 / 0 / 0 / 0**. The runtime-mechanism report is bound transitively through the canonical containment report.
- Pre-runtime candidate packages: **55/55**; files: **385**.
- Static definition/script candidates: **12,066 / 2,332**.
- Source-derived asset/keyframe candidate inventories: **55/55 (12,066 rows) / 55/55 (802 rows)**; authoritative baseline keyframes: **0**. The 55 asset successor receipts are bound indirectly through the exact per-member specification-readiness descriptors. These are candidate rows, not final specifications.
- Current-JavaScript renderer/behavior-candidate implementation and private controlled CEO preview: **Owner-authorized within the narrow current-JS scope**; migration strict \`implementationAuthorized\`: **0/55**.
- Bounded canonical current-JavaScript engineering candidates / routes / implementation started: **52/55 / 52/55 / 52/55**.
- Candidate split: **20 full single-sprite + 31 safe-prefix single-sprite + 1 independently evidenced FQ001 dual-sprite composite**; open/blocked-tail frames: **13,696 / 3,020**; canonical nested coverage declared by **51** candidates. Product-only FQ002/FQ003 atlases are excluded from these canonical totals.
- Pending coverage obligations: **212** (**110 root + 102 conservative nested**); missing frames: **34,508/34,508**; authoritative baselines: **0**.
- Unsigned session templates: **154** — 55 EN runtime, 55 ES runtime, and 44 Animate.
- Unsigned independent-review/release-approval templates: **223** — 220 member reviews and 3 release approvals.
- Missing KeyTerm XML / exact recovery candidates: **2 / 0**.
- Combined elementary KeyTerm product-reference use authorized: **true**; recovered lesson-local targets: **0/2**; runtime byte variant verified: **false**; source gap closed: **false**.
- FQ002/FQ003 scoped browser QA: **pass for 2/2 current-JS product-only members**; whole-product QA completion: **false**.
- Whole-lesson current-JS browser QA: **54/54 EN + 54/54 ES + 54/54 reduced-motion ready** across **3 traversal sweeps / at least 162 page-state visits**; console/page/failed-request/non-loopback failures: **0/0/0/0**. All 54 ES-route page renderers still report fixed English source visuals, and the development response did not prove private no-store.
- Fresh-unzip standalone package smoke: **pass for 55 members / 54 current-JS pages / 54 EN + 54 ES page visits**; strict complete: **0/55**; published: **false**.
- Actual original-runtime sessions / Animate audits / accepted reviews: **0 / 0 / 0**.
- Implementation started / strict complete / published: **52/55 / 0/55 / 0/55**.
- Remaining automatically advanceable machine tasks: **${report.machinePreparation.specificationCandidates.remainingAutomaticallyAdvanceableTaskCount}** across **${report.machinePreparation.specificationCandidates.safeMachineCandidateWorkAvailableCount}/55** members.
- \`machinePreparationExhaustedBeforeHumanGate\`: **${report.machinePreparationExhaustedBeforeHumanGate}**.

${report.machinePreparationExhaustionBoundary}. This value is **not**
implementation completion, original-runtime evidence, fidelity acceptance,
strict completion, or release.

The 52 canonical engineering candidates are \`${SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.join(
    "`, `",
  )}\`. Their current-JavaScript output, renderer, route, and started status are
engineering facts only. FQ001 remains canonical root-only with unresolved
frame-domain disposition and no canonical nested coverage. Runtime authority, Spanish/audio completeness, RMSE,
human review, Owner fidelity acceptance, strict completion, and publication
remain unset.

## Current-JavaScript private-preview evidence

The exact Owner statement authorizes the source-derived current-JavaScript
renderer and behavior-candidate work, acceptance-neutral local product QA, and
private controlled CEO-preview preparation. The controlled-preview natural
entry step is waived only for that narrow scope. The waiver is not
original-runtime evidence, natural-navigation causality, independent human
review, Owner fidelity acceptance, strict validation approval, external
deployment/public-release authority, or publication approval. Migration strict
\`implementationAuthorized\` remains **0/55**.

The bound FQ002/FQ003 companion receipt passes its local current-JavaScript
interaction, scoring, review, and Replay checks. The bound fresh-unzip package
smoke passes the loopback-only 55-member / 54-page EN/ES product checks and
privacy scan. The whole-lesson receipt passes its current-JavaScript EN/ES,
reduced-motion, Map, Key Terms, and failure-boundary checks while explicitly
retaining fixed-English Spanish page visuals and the development-cache caveat.
None of these receipts is Flash/Animate comparison evidence or fidelity
acceptance.

## Authorized combined elementary KeyTerm reference

The Owner-relayed Content Manager direction is recorded as product-reference
use authorized. The hash-bound 2015 intake contains **814 EN + 812 ES** parsed
records and one known unrelated malformed Spanish record. The client selection
remains the canonical preserved 2008 master; the 2015 intake is unselected.
This reference disposition does not recover \`L4KTE01.xml\` or
\`L4KTS01.xml\`, authorize lesson-specific substitution, establish a
runtime byte variant, accept fidelity, grant strict completion, or publish the
lesson.

## Current input bindings

| Input | Path | Bytes | SHA-256 |
| --- | --- | ---: | --- |
${inputs}

Input-set SHA-256: \`${report.inputCurrency.inputSetSha256}\`.

## Next required human, Owner, source, and runtime gates

${report.nextRequiredGates.map((item) => `- ${item}`).join("\n")}

## Acceptance boundary

Every acceptance effect remains **false**. Strict acceptance effect:
**none**. G5 L4 remains strict **0/55** and unpublished.
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
  invariant(
    isWithin(projectRoot, directory),
    "output directory escapes project root",
  );
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
    invariant(
      metadata?.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary real directory`,
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

async function outputState(file, projectRoot) {
  const relative = portable(path.relative(projectRoot, file));
  const before = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!before) return null;
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1,
    `${relative}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(file);
  const after = await assertOrdinaryFile(file, `${relative} output target`);
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
    contents,
  };
}

function sameState(left, right) {
  if (!left || !right) return left === right;
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.mtimeMs === right.mtimeMs &&
    left.bytes === right.bytes &&
    left.sha256 === right.sha256;
}

async function verifyCurrentSourceBindings(report, projectRoot) {
  const generator = await readFileRecord(
    projectRoot,
    report.generator.path,
    "continuation generator source binding",
  );
  invariant(
    report.generator.bytes === generator.bytes &&
      report.generator.sha256 === generator.sha256,
    "continuation generator bytes drifted after report construction",
  );
  for (const key of INPUT_KEYS) {
    const binding = report.sourceBindings[key];
    const current = await readFileRecord(
      projectRoot,
      binding.path,
      `${key} source binding`,
    );
    invariant(
      binding.path === current.path &&
        binding.bytes === current.bytes &&
        binding.sha256 === current.sha256,
      `${key}: source bytes drifted after report construction`,
    );
  }
  const packageBindings =
    report.currentJavascriptPrivatePreviewEvidence?.standalonePackage;
  for (const [label, binding] of [
    ["archive", packageBindings.archive],
    ["manifest", packageBindings.packageManifest],
  ]) {
    const current = await readFileRecord(
      projectRoot,
      binding.path,
      `standalone-package ${label} binding`,
    );
    invariant(
      binding.path === current.path &&
        binding.bytes === current.bytes &&
        binding.sha256 === current.sha256,
      `standalone-package ${label} bytes drifted after report construction`,
    );
  }
}

async function assertOutputState(file, expected, projectRoot) {
  invariant(
    sameState(await outputState(file, projectRoot), expected),
    `${portable(path.relative(projectRoot, file))}: output changed during transaction`,
  );
}

async function unlinkIfOwned(file, expectedSha256, projectRoot, label) {
  const state = await outputState(file, projectRoot);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${label}: refusing to remove an unowned file`,
  );
  await unlink(file);
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
  transactionHooks = {},
} = {}) {
  validateG5L4ContinuationMachineReadiness(report);
  const projectRoot = path.resolve(projectRootOption);
  await verifyCurrentSourceBindings(report, projectRoot);
  const outputs = outputPaths(projectRoot, outputPrefix);
  const expected = [
    {
      file: outputs.json,
      contents: Buffer.from(stableJson(report)),
    },
    {
      file: outputs.markdown,
      contents: Buffer.from(renderMarkdown(report)),
    },
  ].map((item) => ({
    ...item,
    sha256: sha256Bytes(item.contents),
  }));
  await ensureSafeDirectoryPath(
    projectRoot,
    path.dirname(outputs.json),
    !check,
  );
  if (check) {
    for (const item of expected) {
      const state = await outputState(item.file, projectRoot);
      invariant(
        state &&
          state.bytes === item.contents.length &&
          state.sha256 === item.sha256 &&
          state.contents.equals(item.contents),
        `${portable(path.relative(projectRoot, item.file))}: checked output is stale`,
      );
    }
    return {
      action: "verified",
      outputs: expected.map((item) => ({
        path: portable(path.relative(projectRoot, item.file)),
        bytes: item.contents.length,
        sha256: item.sha256,
      })),
    };
  }

  const transactionId = randomUUID();
  const items = [];
  for (const [index, item] of expected.entries()) {
    const prior = await outputState(item.file, projectRoot);
    const temporary = path.join(
      path.dirname(item.file),
      `.${path.basename(item.file)}.${transactionId}.${index}.tmp`,
    );
    const backup = path.join(
      path.dirname(item.file),
      `.${path.basename(item.file)}.${transactionId}.${index}.bak`,
    );
    invariant(
      !(await outputState(temporary, projectRoot)) &&
        !(await outputState(backup, projectRoot)),
      "transaction path collision",
    );
    items.push({
      ...item,
      prior,
      temporary,
      backup,
      backupCreated: false,
      installed: false,
    });
  }
  let committed = false;
  try {
    for (const item of items) {
      await writeFile(item.temporary, item.contents, {
        flag: "wx",
        mode: 0o600,
      });
      const temporaryState = await outputState(item.temporary, projectRoot);
      invariant(
        temporaryState?.sha256 === item.sha256 &&
          temporaryState.bytes === item.contents.length,
        "temporary output verification failed",
      );
    }
    await verifyCurrentSourceBindings(report, projectRoot);
    for (const [index, item] of items.entries()) {
      await assertOutputState(item.file, item.prior, projectRoot);
      if (typeof transactionHooks.beforeInstall === "function") {
        await transactionHooks.beforeInstall({index});
      }
      if (item.prior) {
        await rename(item.file, item.backup);
        item.backupCreated = true;
      }
      await rename(item.temporary, item.file);
      item.installed = true;
    }
    for (const item of items) {
      const state = await outputState(item.file, projectRoot);
      invariant(
        state?.sha256 === item.sha256 &&
          state.bytes === item.contents.length &&
          state.contents.equals(item.contents),
        "installed output verification failed",
      );
    }
    await verifyCurrentSourceBindings(report, projectRoot);
    committed = true;
  } catch (error) {
    const rollbackErrors = [];
    for (const item of [...items].reverse()) {
      try {
        if (item.installed) {
          await unlinkIfOwned(
            item.file,
            item.sha256,
            projectRoot,
            "rollback installed output",
          );
        }
        if (item.backupCreated) await rename(item.backup, item.file);
        await unlinkIfOwned(
          item.temporary,
          item.sha256,
          projectRoot,
          "rollback temporary output",
        );
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "continuation report transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }

  invariant(committed, "continuation report transaction did not commit");
  const cleanupErrors = [];
  for (const item of items) {
    if (!item.backupCreated) continue;
    try {
      await unlinkIfOwned(
        item.backup,
        item.prior.sha256,
        projectRoot,
        "committed backup cleanup",
      );
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      "continuation report pair committed but backup cleanup was incomplete",
    );
  }
  return {
    action: "written",
    outputs: expected.map((item) => ({
      path: portable(path.relative(projectRoot, item.file)),
      bytes: item.contents.length,
      sha256: item.sha256,
    })),
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
  return `Usage: node scripts/build-g5-l4-continuation-machine-readiness.mjs [options]

Options:
  --check                    Verify the checked-in JSON and Markdown
  --output-prefix <path>     Extensionless project-relative prefix below reports/
  --help                     Show this help

The command re-hashes and fresh-rebuilds the bounded G5 L4 machine-preparation
chain. It launches no GUI/runtime, performs no review or additional
implementation, and grants no fidelity, strict-completion, or publication
authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const report = await buildG5L4ContinuationMachineReadiness();
    const result = await writeOrCheck({report, ...options});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      releaseId: RELEASE_ID,
      boundInputsCurrent: report.inputCurrency.allInputsCurrent,
      candidatePackages: report.summary.candidatePackageCount,
      candidateFiles: report.summary.candidateFileCount,
      definitions: report.summary.definitionCandidateCount,
      scripts: report.summary.scriptCandidateCount,
      sourceStaticEngineeringCandidates:
        report.summary.sourceStaticEngineeringCandidateCount,
      currentJavaScriptOutputs:
        report.summary.currentJavaScriptOutputPresentCount,
      coverageRequirements: report.summary.coverageRequirementCount,
      coverageRootRequirements:
        report.summary.coverageRootOnlyRequirementCount,
      coverageNestedRequirements:
        report.summary.coverageNestedRequirementCount,
      coverageMissingFrames: report.summary.coverageMissingFrameCount,
      unsignedSessionTemplates:
        report.summary.unsignedSessionTemplateCount,
      unsignedReviewAndApprovalTemplates:
        report.summary.unsignedReviewAndApprovalTemplateCount,
      missingXml: report.summary.missingXmlCount,
      recoveryCandidates: report.summary.exactRecoveryCandidateCount,
      machinePreparationExhaustedBeforeHumanGate:
        report.machinePreparationExhaustedBeforeHumanGate,
      actualOriginalRuntimeSessions:
        report.summary.actualOriginalRuntimeSessionCount,
      actualAnimateAudits: report.summary.actualAnimateAuditCount,
      acceptedReviews: report.summary.actualReviewAcceptanceCount,
      implementationStarted: report.summary.implementationStartedCount,
      strictComplete: report.summary.strictCompleteCount,
      published: report.summary.publishedCount,
      outputs: result.outputs,
    }, null, 2)}\n`);
  }
}
