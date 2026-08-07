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
  validateG5L4M1MachineFoundationReport,
} from "./build-g5-l4-m1-machine-foundation-readiness.mjs";
import {
  validateG5L4PerSessionAuthorizationPreparation,
} from "./build-g5-l4-per-session-authorization-preparation.mjs";
import {
  buildReport as buildG5L4SpecificationReadinessReport,
} from "./build-g5-l4-specification-readiness.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const DEFAULT_OUTPUT_PREFIX = "reports/g5-l4-review-workflow-preparation";
const SHA256 = /^[a-f0-9]{64}$/;
const ORDERED_MEMBER_IDENTITY_SHA256 =
  "8b4f603cd1c48a18208267e23f98e0f45642057815d40a7e1728e4296f3ef24f";
const SPECIFICATION_ORDERED_MEMBER_IDENTITY_SHA256 =
  "3f74a442f18f327c6d40eab8a013f440a1d3fd96d4e98f7e9430b73c70e4381a";
const SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT = 52;
const REVIEW_TEMPLATE_ACCEPTANCE_EFFECT =
  "none; unsigned future review worksheet only";
const APPROVAL_TEMPLATE_ACCEPTANCE_EFFECT =
  "none; unsigned future approval worksheet only";
const REPORT_ACCEPTANCE_EFFECT =
  "none; unsigned future review and release-approval preparation only";

const INPUT_PATHS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  ownerDefaultsAuthorization:
    "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  m1MachineFoundation: "reports/g5-l4-m1-machine-foundation-readiness.json",
  specificationReadiness: "reports/g5-l4-specification-readiness.json",
  perSessionPreparation:
    "reports/g5-l4-per-session-authorization-preparation.json",
  m1ValidatorModule:
    "scripts/build-g5-l4-m1-machine-foundation-readiness.mjs",
  perSessionValidatorModule:
    "scripts/build-g5-l4-per-session-authorization-preparation.mjs",
  specificationBuilderModule:
    "scripts/build-g5-l4-specification-readiness.mjs",
  generator: "scripts/build-g5-l4-review-workflow-preparation.mjs",
});

const REVIEW_DEFINITIONS = Object.freeze([
  Object.freeze({
    reviewId: "independent-engineering-review",
    roleId: "independent-engineering-reviewer",
    requiredEvidence: Object.freeze([
      "implemented-renderer-and-pure-timeline-source",
      "behavior-and-replay-tests",
      "product-accessibility-console-and-network-qa",
      "immutable-implementation-evidence-manifest",
    ]),
  }),
  Object.freeze({
    reviewId: "independent-human-visual-review",
    roleId: "independent-human-visual-reviewer",
    requiredEvidence: Object.freeze([
      "authoritative-original-runtime-baseline",
      "deterministic-implementation-captures",
      "full-frame-diffs-and-rmse",
      "native-desktop-mobile-and-reduced-motion-review-set",
    ]),
  }),
  Object.freeze({
    reviewId: "independent-audio-review",
    roleId: "independent-audio-reviewer",
    requiredEvidence: Object.freeze([
      "authorized-original-runtime-listening-evidence",
      "hash-bound-source-and-implementation-audio",
      "cue-language-content-sync-stop-and-loop-dispositions",
      "immutable-audio-review-evidence-manifest",
    ]),
  }),
  Object.freeze({
    reviewId: "independent-spanish-review",
    roleId: "independent-spanish-reviewer",
    requiredEvidence: Object.freeze([
      "authorized-spanish-original-runtime-traces",
      "english-spanish-state-and-copy-crosswalk",
      "spanish-audio-language-and-content-dispositions",
      "immutable-spanish-review-evidence-manifest",
    ]),
  }),
]);

const RELEASE_APPROVAL_DEFINITIONS = Object.freeze([
  Object.freeze({
    approvalId: "owner-fidelity-acceptance",
    roleId: "owner-approver",
    requiredPreconditions: Object.freeze([
      "55-of-55-final-specifications",
      "55-of-55-implementation-and-product-qa",
      "all-required-independent-reviews-accepted",
      "all-exceptions-explicitly-dispositioned",
    ]),
  }),
  Object.freeze({
    approvalId: "strict-validation-approval",
    roleId: "strict-validation-authority",
    requiredPreconditions: Object.freeze([
      "owner-fidelity-acceptance",
      "strict-validator-pass-for-55-of-55",
      "current-completion-and-release-ledgers",
      "atomic-release-admission-gate-open",
    ]),
  }),
  Object.freeze({
    approvalId: "atomic-publication-approval",
    roleId: "release-custodian",
    requiredPreconditions: Object.freeze([
      "strict-validation-approval",
      "55-of-55-strict-completion",
      "release-security-and-production-build-pass",
      "explicit-owner-publication-authorization",
    ]),
  }),
]);

const ACCEPTANCE_KEYS = Object.freeze([
  "engineeringReviewAccepted",
  "visualReviewAccepted",
  "audioReviewAccepted",
  "spanishReviewAccepted",
  "ownerFidelityAccepted",
  "strictValidationApproved",
  "strictComplete",
  "publicationApproved",
  "published",
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
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes project root`);
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
  const absolutePath = resolveProjectPath(resolvedRoot, relativePath, label);
  const before = await assertOrdinaryFile(absolutePath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(resolvedRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
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

async function readJsonRecord(projectRoot, relativePath, label) {
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

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function allFalse(value) {
  return value &&
    Object.values(value).every((entry) => entry === false);
}

function orderedMemberIdentities(members) {
  return members.map(({ordinal, animationId, assetId}) => ({
    ordinal,
    animationId,
    assetId,
  }));
}

function selectRelease(document) {
  invariant(
    document?.schemaVersion === 1 &&
      Array.isArray(document.releases),
    "release manifest is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, `${RELEASE_ID}: release is not unique`);
  const release = matches[0];
  invariant(
    release.titleDisplay === "Number Lines" &&
      release.grade === 5 &&
      release.lesson === 4 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.members === 55 &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      Array.isArray(release.members) &&
      release.members.length === 55 &&
      release.members.every((member, index) => member.ordinal === index + 1),
    "G5 L4 release scope drifted",
  );
  invariant(
    sha256Bytes(
      Buffer.from(stableJson(orderedMemberIdentities(release.members))),
    ) === ORDERED_MEMBER_IDENTITY_SHA256,
    "G5 L4 ordered member identity set drifted",
  );
  return release;
}

function validateOwnerDefaults(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType ===
        "g5-l4-user-stated-owner-default-blockers-2-4-authorization-intake" &&
      document.releaseId === RELEASE_ID,
    "Owner blockers 2-4 receipt identity drifted",
  );
  const exact = Buffer.from(document.ownerStatement?.exactUtf8 || "", "utf8");
  invariant(
    document.ownerStatement?.exactUtf8 ===
        "请继续执行。我给与权限和批准。\n阻塞项目2到4——按照默认值" &&
      document.ownerStatement.byteLength === 84 &&
      document.ownerStatement.byteLength === exact.length &&
      document.ownerStatement.sha256 ===
        "f9e39425a4d3ad8baafab9e3cb4020dba4c90b4ebc0c043d743d46309f8ee0ef" &&
      document.ownerStatement.sha256 === sha256Bytes(exact),
    "Owner blockers 2-4 directive bytes drifted",
  );
  invariant(
    JSON.stringify(document.referencedBlockerSet?.blockerNumbers) ===
        JSON.stringify([2, 3, 4]) &&
      document.referencedBlockerSet.byteLength === 434 &&
      document.referencedBlockerSet.sha256 ===
        "3b4644bdbb72204a380a530690cc5850871012913000ee7b8bbc2de32db0d118",
    "Owner blockers 2-4 reference set drifted",
  );
  invariant(
    document.authorization?.policyApproved === true &&
      document.authorization.preparationAuthorized === true &&
      document.authorization
        .unsignedPendingOwnerSignaturePackagePreparationAuthorized === true,
    "Owner review-package preparation authority is missing",
  );
  for (const key of [
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
  ]) {
    invariant(
      document.authorization[key] === false,
      `Owner receipt ${key} must remain false`,
    );
  }
  invariant(
    document.externalSignatureEnvelope === null,
    "Owner receipt invented an external signature",
  );
}

function validateMachineInputs({m1, specification, sessions}) {
  validateG5L4M1MachineFoundationReport(m1);
  invariant(
    m1?.reportType === "g5-l4-m1-machine-foundation-readiness" &&
      m1.releaseId === RELEASE_ID &&
      m1.summary?.releaseMemberCount === 55 &&
      m1.summary.machineFoundationReady === true &&
      m1.summary.originalRuntimeSessionCount === 0 &&
      m1.summary.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      m1.summary.rendererSelectedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      m1.summary.routeDeclaredCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      m1.summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      m1.summary.implementationAuthorizedCount === 0 &&
      m1.summary.humanReviewAcceptedCount === 0 &&
      m1.summary.ownerFidelityAcceptedCount === 0 &&
      m1.summary.strictCompleteCount === 0 &&
      m1.summary.publishedCount === 0 &&
      allFalse(m1.acceptanceEffects) &&
      Object.keys(m1.acceptanceEffects || {}).length === 12,
    "M1 machine-foundation boundary drifted",
  );
  const specificationWithoutFingerprint = structuredClone(specification);
  delete specificationWithoutFingerprint.reportFingerprintSha256;
  invariant(
    specification?.schemaVersion === 1 &&
      specification.reportType ===
        "g5-l4-pre-implementation-specification-readiness" &&
      specification.releaseId === RELEASE_ID &&
      specification.summary?.memberCount === 55 &&
      specification.summary.preRuntimeCandidatePackageMaterializedCount ===
        55 &&
      specification.summary.preRuntimeCandidateFileCount === 385 &&
      specification.summary.audioRuntimeEvidencePresentCount === 55 &&
      specification.summary.audioStructurallyAuditedCount === 55 &&
      Number.isSafeInteger(
        specification.summary.remainingAutomaticallyAdvanceableTaskCount,
      ) &&
      specification.summary.remainingAutomaticallyAdvanceableTaskCount >= 0 &&
      Number.isSafeInteger(
        specification.summary.safeMachineCandidateWorkAvailableCount,
      ) &&
      specification.summary.safeMachineCandidateWorkAvailableCount >= 0 &&
      specification.summary.safeMachineCandidateWorkAvailableCount <= 55 &&
      (specification.summary.remainingAutomaticallyAdvanceableTaskCount ===
        0) ===
        (specification.summary.safeMachineCandidateWorkAvailableCount === 0) &&
      specification.summary.authoritativeRuntimeSessionCount === 0 &&
      specification.summary.implementationSpecificationReadyCount === 0 &&
      specification.summary.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      specification.summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      specification.summary.fullSingleSpriteCandidateCount === 20 &&
      specification.summary.safePrefixSingleSpriteCandidateCount === 31 &&
      specification.summary.independentDualSpriteCompositeCandidateCount ===
        1 &&
      specification.summary.canonicalNestedCoverageCandidateCount === 51 &&
      specification.summary.sourceStaticOpenFrameCount === 13696 &&
      specification.summary.sourceStaticBlockedTailFrameCount === 3020 &&
      specification.summary.currentJavaScriptOutputPresentCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      specification.summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      specification.summary.implementationAuthorizedCount === 0 &&
      specification.summary.authoritativeRuntimeReachabilityEstablishedCount ===
        0 &&
      specification.summary.humanVisualReviewPerformedCount === 0 &&
      specification.summary.ownerReviewPerformedCount === 0 &&
      specification.summary.rmseComputedCount === 0 &&
      specification.summary.sourceStaticAudioEnabledCount === 0 &&
      specification.summary.spanishEnabledCount === 0 &&
      specification.summary.strictCompleteCount === 0 &&
      specification.summary.publishedCount === 0 &&
      specification.release?.orderedMemberIdentitySha256 ===
        SPECIFICATION_ORDERED_MEMBER_IDENTITY_SHA256 &&
      Object.keys(specification.acceptanceEffects || {}).length === 9 &&
      allFalse(specification.acceptanceEffects) &&
      SHA256.test(specification.reportFingerprintSha256 || "") &&
      specification.reportFingerprintSha256 ===
        sha256Bytes(Buffer.from(stableJson(specificationWithoutFingerprint))),
    "G5 L4 specification-readiness boundary drifted",
  );
  validateG5L4PerSessionAuthorizationPreparation(sessions);
  invariant(
    sessions?.schemaVersion === 1 &&
      sessions.reportType ===
        "g5-l4-per-session-authorization-preparation" &&
      sessions.evidenceState ===
        "unsigned-non-runnable-session-preparation-only" &&
      sessions.release?.releaseId === RELEASE_ID &&
      sessions.summary?.animateUnsignedTemplates === 44 &&
      sessions.summary.originalRuntimeUnsignedTemplates === 110 &&
      sessions.summary.totalUnsignedTemplates === 154,
    "G5 L4 per-session preparation boundary drifted",
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
    invariant(
      sessions.summary[key] === 0,
      `per-session summary ${key} must remain zero`,
    );
  }
  invariant(
    sessions.summary.containmentMechanismsSelected === 8,
    "per-session summary must retain eight machine-selected containment candidates",
  );
}

function blankReviewTemplate(member, definition) {
  return {
    templateId: `${member.animationId}:${definition.reviewId}`,
    templateType: "g5-l4-unsigned-independent-review-template",
    releaseId: RELEASE_ID,
    releaseOrdinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    reviewId: definition.reviewId,
    roleId: definition.roleId,
    independenceRequired: true,
    requiredEvidence: [...definition.requiredEvidence],
    evidenceManifest: null,
    evidenceManifestSha256: null,
    reviewerFullName: null,
    reviewerSubjectId: null,
    reviewedAt: null,
    decision: null,
    findings: [],
    notes: null,
    signatureEnvelope: null,
    accepted: false,
    automationMayComplete: false,
    strictAcceptanceEffect: REVIEW_TEMPLATE_ACCEPTANCE_EFFECT,
  };
}

function blankReleaseApproval(definition) {
  return {
    templateId: `${RELEASE_ID}:${definition.approvalId}`,
    templateType: "g5-l4-unsigned-release-approval-template",
    releaseId: RELEASE_ID,
    approvalId: definition.approvalId,
    roleId: definition.roleId,
    requiredPreconditions: [...definition.requiredPreconditions],
    evidenceManifest: null,
    evidenceManifestSha256: null,
    approverFullName: null,
    approverSubjectId: null,
    approvedAt: null,
    decision: null,
    conditions: [],
    notes: null,
    signatureEnvelope: null,
    approved: false,
    automationMayComplete: false,
    strictAcceptanceEffect: APPROVAL_TEMPLATE_ACCEPTANCE_EFFECT,
  };
}

export async function buildG5L4ReviewWorkflowPreparation({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {
    releaseManifest: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.releaseManifest,
      "release manifest",
    ),
    ownerDefaultsAuthorization: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.ownerDefaultsAuthorization,
      "Owner blockers 2-4 authorization",
    ),
    m1MachineFoundation: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.m1MachineFoundation,
      "M1 machine foundation",
    ),
    specificationReadiness: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.specificationReadiness,
      "specification readiness",
    ),
    perSessionPreparation: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.perSessionPreparation,
      "per-session authorization preparation",
    ),
    m1ValidatorModule: await readFileRecord(
      projectRoot,
      INPUT_PATHS.m1ValidatorModule,
      "M1 validator module",
    ),
    perSessionValidatorModule: await readFileRecord(
      projectRoot,
      INPUT_PATHS.perSessionValidatorModule,
      "per-session validator module",
    ),
    specificationBuilderModule: await readFileRecord(
      projectRoot,
      INPUT_PATHS.specificationBuilderModule,
      "specification builder module",
    ),
    generator: await readFileRecord(
      projectRoot,
      INPUT_PATHS.generator,
      "review workflow generator",
    ),
  };
  const release = selectRelease(records.releaseManifest.document);
  validateOwnerDefaults(records.ownerDefaultsAuthorization.document);
  validateMachineInputs({
    m1: records.m1MachineFoundation.document,
    specification: records.specificationReadiness.document,
    sessions: records.perSessionPreparation.document,
  });
  const rebuiltSpecification =
    await buildG5L4SpecificationReadinessReport({projectRoot});
  invariant(
    stableJson(rebuiltSpecification) ===
      stableJson(records.specificationReadiness.document),
    "G5 L4 specification-readiness report is not the current canonical rebuild",
  );

  const memberReviewTemplates = release.members.flatMap((member) =>
    REVIEW_DEFINITIONS.map((definition) =>
      blankReviewTemplate(member, definition)));
  const releaseApprovalTemplates = RELEASE_APPROVAL_DEFINITIONS.map(
    blankReleaseApproval,
  );
  const base = {
    schemaVersion: 1,
    reportType: "g5-l4-review-workflow-preparation",
    releaseId: RELEASE_ID,
    evidenceState:
      "unsigned-independent-review-and-release-approval-preparation-only",
    authority:
      "This deterministic report prepares blank, unsigned, non-accepting review and release-approval worksheets. It performs no review, assigns no reviewer, signs no record, accepts no evidence, and changes no fidelity, strict-completion, or publication gate.",
    release: {
      titleDisplay: "Number Lines",
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      members: 55,
      activeXmlReferencedPages: 54,
      courseShells: 1,
      pairedFlaSwfMembers: 44,
      swfOnlyMembers: 11,
      orderedMemberIdentitySha256: ORDERED_MEMBER_IDENTITY_SHA256,
      releaseFingerprintSha256: sha256Bytes(Buffer.from(stableJson(release))),
    },
    sourceBindings: {
      releaseManifest: descriptor(records.releaseManifest),
      ownerDefaultsAuthorization: descriptor(
        records.ownerDefaultsAuthorization,
      ),
      m1MachineFoundation: descriptor(records.m1MachineFoundation),
      specificationReadiness: descriptor(records.specificationReadiness),
      perSessionPreparation: descriptor(records.perSessionPreparation),
      m1ValidatorModule: descriptor(records.m1ValidatorModule),
      perSessionValidatorModule: descriptor(
        records.perSessionValidatorModule,
      ),
      specificationBuilderModule: descriptor(
        records.specificationBuilderModule,
      ),
      generator: descriptor(records.generator),
    },
    preparationAuthority: {
      ownerPolicyApproved: true,
      machinePreparationAuthorized: true,
      unsignedPendingOwnerSignaturePackagePreparationAuthorized: true,
      reviewAcceptanceAuthorized: false,
      ownerFidelityAcceptanceAuthorized: false,
      strictValidationApprovalAuthorized: false,
      atomicPublicationApprovalAuthorized: false,
    },
    memberReviewTemplates,
    releaseApprovalTemplates,
    summary: {
      releaseMemberCount: 55,
      reviewKindsPerMember: 4,
      independentEngineeringReviewTemplateCount: 55,
      independentVisualReviewTemplateCount: 55,
      independentAudioReviewTemplateCount: 55,
      independentSpanishReviewTemplateCount: 55,
      memberReviewTemplateCount: 220,
      releaseApprovalTemplateCount: 3,
      totalUnsignedTemplateCount: 223,
      sourceStaticEngineeringCandidateCount:
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT,
      manifestBoundSingleSpriteCandidateCount: 51,
      fullSingleSpriteCandidateCount: 20,
      safePrefixSingleSpriteCandidateCount: 31,
      independentDualSpriteCompositeCandidateCount: 1,
      canonicalNestedCoverageCandidateCount: 51,
      sourceStaticOpenFrameCount: 13696,
      sourceStaticBlockedTailFrameCount: 3020,
      currentJavaScriptOutputPresentCount:
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT,
      implementationStartedCount:
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT,
      implementationSpecificationReadyCount: 0,
      implementationAuthorizedCount: 0,
      authoritativeOriginalRuntimeCount: 0,
      humanVisualReviewPerformedCount: 0,
      ownerReviewPerformedCount: 0,
      rmseComputedCount: 0,
      assignedReviewerCount: 0,
      signedReviewCount: 0,
      acceptedReviewCount: 0,
      ownerFidelityAcceptanceCount: 0,
      strictValidationApprovalCount: 0,
      strictCompleteCount: 0,
      publicationApprovalCount: 0,
      publishedCount: 0,
    },
    acceptanceEffects: Object.fromEntries(
      ACCEPTANCE_KEYS.map((key) => [key, false]),
    ),
    limitations: [
      "Independent review requires real evidence and a real reviewer distinct from the work being reviewed.",
      "Dr. Peter Hu's Owner and runtime-operator role statements do not create an independent review or a completed Owner fidelity decision.",
      "All 220 member-review and three release-approval worksheets remain unsigned and unassigned.",
      "No worksheet may be filled or signed by this generator.",
    ],
    strictAcceptanceEffect: REPORT_ACCEPTANCE_EFFECT,
  };
  const report = {
    ...base,
    reportFingerprintSha256: sha256Bytes(Buffer.from(stableJson(base))),
  };
  validateG5L4ReviewWorkflowPreparation(report);
  return report;
}

function validateBlankReview(template, member, definition) {
  invariant(
    template.templateId ===
        `${member.animationId}:${definition.reviewId}` &&
      template.templateType ===
        "g5-l4-unsigned-independent-review-template" &&
      template.releaseId === RELEASE_ID &&
      template.releaseOrdinal === member.ordinal &&
      template.animationId === member.animationId &&
      template.assetId === member.assetId &&
      template.reviewId === definition.reviewId &&
      template.roleId === definition.roleId &&
      template.independenceRequired === true &&
      JSON.stringify(template.requiredEvidence) ===
        JSON.stringify(definition.requiredEvidence) &&
      template.evidenceManifest === null &&
      template.evidenceManifestSha256 === null &&
      template.reviewerFullName === null &&
      template.reviewerSubjectId === null &&
      template.reviewedAt === null &&
      template.decision === null &&
      Array.isArray(template.findings) &&
      template.findings.length === 0 &&
      template.notes === null &&
      template.signatureEnvelope === null &&
      template.accepted === false &&
      template.automationMayComplete === false &&
      template.strictAcceptanceEffect === REVIEW_TEMPLATE_ACCEPTANCE_EFFECT,
    `${member.animationId}/${definition.reviewId}: review template was filled or promoted`,
  );
}

function validateBlankApproval(template, definition) {
  invariant(
    template.templateId === `${RELEASE_ID}:${definition.approvalId}` &&
      template.templateType ===
        "g5-l4-unsigned-release-approval-template" &&
      template.releaseId === RELEASE_ID &&
      template.approvalId === definition.approvalId &&
      template.roleId === definition.roleId &&
      JSON.stringify(template.requiredPreconditions) ===
        JSON.stringify(definition.requiredPreconditions) &&
      template.evidenceManifest === null &&
      template.evidenceManifestSha256 === null &&
      template.approverFullName === null &&
      template.approverSubjectId === null &&
      template.approvedAt === null &&
      template.decision === null &&
      Array.isArray(template.conditions) &&
      template.conditions.length === 0 &&
      template.notes === null &&
      template.signatureEnvelope === null &&
      template.approved === false &&
      template.automationMayComplete === false &&
      template.strictAcceptanceEffect === APPROVAL_TEMPLATE_ACCEPTANCE_EFFECT,
    `${definition.approvalId}: release approval template was filled or promoted`,
  );
}

export function validateG5L4ReviewWorkflowPreparation(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l4-review-workflow-preparation" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        "unsigned-independent-review-and-release-approval-preparation-only",
    "review-workflow report identity drifted",
  );
  invariant(
    report.release?.titleDisplay === "Number Lines" &&
      report.release.releaseType === "complete-lesson" &&
      report.release.publicationMode === "atomic" &&
      report.release.members === 55 &&
      report.release.activeXmlReferencedPages === 54 &&
      report.release.courseShells === 1 &&
      report.release.pairedFlaSwfMembers === 44 &&
      report.release.swfOnlyMembers === 11 &&
      report.release.orderedMemberIdentitySha256 ===
        ORDERED_MEMBER_IDENTITY_SHA256 &&
      SHA256.test(report.release.releaseFingerprintSha256 || ""),
    "review-workflow release scope drifted",
  );
  for (const [key, expectedPath] of Object.entries(INPUT_PATHS)) {
    const binding = report.sourceBindings?.[key];
    invariant(
      binding?.path === expectedPath &&
        Number.isInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256.test(binding.sha256 || ""),
      `${key}: review-workflow source binding drifted`,
    );
  }
  invariant(
    report.preparationAuthority?.ownerPolicyApproved === true &&
      report.preparationAuthority.machinePreparationAuthorized === true &&
      report.preparationAuthority
        .unsignedPendingOwnerSignaturePackagePreparationAuthorized === true &&
      report.preparationAuthority.reviewAcceptanceAuthorized === false &&
      report.preparationAuthority.ownerFidelityAcceptanceAuthorized === false &&
      report.preparationAuthority.strictValidationApprovalAuthorized ===
        false &&
      report.preparationAuthority.atomicPublicationApprovalAuthorized ===
        false,
    "review-workflow preparation authority drifted",
  );
  invariant(
    Array.isArray(report.memberReviewTemplates) &&
      report.memberReviewTemplates.length === 220,
    "member review template count drifted",
  );
  const templateMembers = [];
  for (let memberIndex = 0; memberIndex < 55; memberIndex += 1) {
    const offset = memberIndex * REVIEW_DEFINITIONS.length;
    const memberTemplates = report.memberReviewTemplates.slice(
      offset,
      offset + REVIEW_DEFINITIONS.length,
    );
    const first = memberTemplates[0];
    const member = {
      ordinal: memberIndex + 1,
      animationId: first?.animationId,
      assetId: first?.assetId,
    };
    invariant(
      typeof member.animationId === "string" &&
        typeof member.assetId === "string",
      `member ${memberIndex + 1}: template identity is missing`,
    );
    templateMembers.push(member);
    for (const [definitionIndex, definition] of
      REVIEW_DEFINITIONS.entries()) {
      validateBlankReview(
        memberTemplates[definitionIndex],
        member,
        definition,
      );
    }
  }
  invariant(
    sha256Bytes(Buffer.from(stableJson(templateMembers))) ===
      ORDERED_MEMBER_IDENTITY_SHA256,
    "member review templates are not bound to the canonical release identities",
  );
  invariant(
    new Set(report.memberReviewTemplates.map(({templateId}) => templateId))
      .size === 220,
    "member review template IDs are not unique",
  );
  invariant(
    Array.isArray(report.releaseApprovalTemplates) &&
      report.releaseApprovalTemplates.length === 3,
    "release approval template count drifted",
  );
  for (const [index, definition] of RELEASE_APPROVAL_DEFINITIONS.entries()) {
    validateBlankApproval(report.releaseApprovalTemplates[index], definition);
  }
  const summary = report.summary;
  invariant(
    summary?.releaseMemberCount === 55 &&
      summary.reviewKindsPerMember === 4 &&
      summary.independentEngineeringReviewTemplateCount === 55 &&
      summary.independentVisualReviewTemplateCount === 55 &&
      summary.independentAudioReviewTemplateCount === 55 &&
      summary.independentSpanishReviewTemplateCount === 55 &&
      summary.memberReviewTemplateCount === 220 &&
      summary.releaseApprovalTemplateCount === 3 &&
      summary.totalUnsignedTemplateCount === 223 &&
      summary.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      summary.fullSingleSpriteCandidateCount === 20 &&
      summary.safePrefixSingleSpriteCandidateCount === 31 &&
      summary.independentDualSpriteCompositeCandidateCount === 1 &&
      summary.canonicalNestedCoverageCandidateCount === 51 &&
      summary.sourceStaticOpenFrameCount === 13696 &&
      summary.sourceStaticBlockedTailFrameCount === 3020 &&
      summary.currentJavaScriptOutputPresentCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_COUNT &&
      summary.implementationSpecificationReadyCount === 0 &&
      summary.implementationAuthorizedCount === 0 &&
      summary.authoritativeOriginalRuntimeCount === 0 &&
      summary.humanVisualReviewPerformedCount === 0 &&
      summary.ownerReviewPerformedCount === 0 &&
      summary.rmseComputedCount === 0,
    "review-workflow summary cardinality drifted",
  );
  for (const key of [
    "assignedReviewerCount",
    "signedReviewCount",
    "acceptedReviewCount",
    "ownerFidelityAcceptanceCount",
    "strictValidationApprovalCount",
    "strictCompleteCount",
    "publicationApprovalCount",
    "publishedCount",
  ]) {
    invariant(summary[key] === 0, `review-workflow summary ${key} must be zero`);
  }
  invariant(
    Object.keys(report.acceptanceEffects || {}).length ===
        ACCEPTANCE_KEYS.length &&
      ACCEPTANCE_KEYS.every((key) => report.acceptanceEffects[key] === false),
    "review-workflow report changed an acceptance gate",
  );
  invariant(
    report.strictAcceptanceEffect === REPORT_ACCEPTANCE_EFFECT,
    "review-workflow report claims strict acceptance",
  );
  invariant(
    SHA256.test(report.reportFingerprintSha256 || ""),
    "review-workflow report fingerprint is missing",
  );
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 ===
      sha256Bytes(Buffer.from(stableJson(copy))),
    "review-workflow report fingerprint drifted",
  );
  return true;
}

export function renderMarkdown(report) {
  validateG5L4ReviewWorkflowPreparation(report);
  const reviews = REVIEW_DEFINITIONS.map((definition) =>
    `| \`${definition.reviewId}\` | \`${definition.roleId}\` | 55 | 0 | unsigned / unassigned |`)
    .join("\n");
  const approvals = RELEASE_APPROVAL_DEFINITIONS.map((definition) =>
    `| \`${definition.approvalId}\` | \`${definition.roleId}\` | pending; unsigned |`)
    .join("\n");
  return `# G5 L4 Review Workflow Preparation

Release: \`${RELEASE_ID}\` — **Number Lines**  
State: **unsigned preparation only; no review or approval accepted**

This report binds the current M1 machine foundation, all **55/55** pre-runtime
specification candidate packages, and all **154** unsigned per-session
authorization templates. It records exactly **52/55** bounded canonical current-JavaScript
engineering candidates—51 manifest-bound single-sprite candidates and one
independently evidenced FQ001 dual-sprite composite whose canonical
frame-domain disposition remains unresolved—with implementation authorization
still **0/55**. Product-only FQ002/FQ003 question atlases are excluded from that
canonical count. It prepares review worksheets only.

## Independent member-review worksheets

| Review | Required role | Templates | Accepted | State |
| --- | --- | ---: | ---: | --- |
${reviews}

Total: **220 unsigned templates / 0 assigned / 0 signed / 0 accepted**.

## Release-level approval worksheets

| Approval | Required role | State |
| --- | --- | --- |
${approvals}

Owner fidelity acceptance, strict-validation approval, and atomic-publication
approval remain **0 / 0 / 0**.

## Evidence boundary

- Original-runtime sessions: **0**
- Animate audits: **0/44**
- Bounded canonical current-JavaScript engineering candidates: **52/55**
- Implementation specification ready: **0/55**
- Implementation started / authorized: **52/55 / 0/55**
- Human visual review / Owner review / RMSE: **0 / 0 / 0**
- Strict complete / published: **0/55 / 0**

Strict acceptance effect: **none**. Automation may prepare these blank
worksheets but may not assign reviewers, perform reviews, sign decisions, accept
fidelity, approve strict validation, or authorize publication.
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

async function ensureSafeDirectory(projectRoot, directory, create) {
  invariant(isWithin(projectRoot, directory), "output directory escapes project root");
  let cursor = projectRoot;
  for (const component of path.relative(projectRoot, directory)
    .split(path.sep).filter(Boolean)) {
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
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
  }
  const [realRoot, realDirectory] = await Promise.all([
    realpath(projectRoot),
    realpath(directory),
  ]);
  invariant(isWithin(realRoot, realDirectory), "output directory resolves outside project root");
}

async function existingFileState(absolutePath, projectRoot) {
  const relative = portable(path.relative(projectRoot, absolutePath));
  const metadata = await lstat(absolutePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${relative}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(absolutePath);
  const after = await assertOrdinaryFile(absolutePath, `${relative} output`);
  invariant(
    metadata.dev === after.dev &&
      metadata.ino === after.ino &&
      metadata.mtimeMs === after.mtimeMs &&
      contents.length === after.size,
    `${relative}: output changed during read`,
  );
  return {
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

async function verifyCurrentSourceBindings(report, projectRoot) {
  for (const [key, expectedPath] of Object.entries(INPUT_PATHS)) {
    const current = await readFileRecord(
      projectRoot,
      expectedPath,
      `${key} source binding`,
    );
    const binding = report.sourceBindings[key];
    invariant(
      binding.path === current.path &&
        binding.bytes === current.bytes &&
        binding.sha256 === current.sha256,
      `${key}: source bytes drifted after report construction`,
    );
  }
}

async function removeExpected(absolutePath, expectedSha256, projectRoot) {
  const state = await existingFileState(absolutePath, projectRoot);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${portable(path.relative(projectRoot, absolutePath))}: cleanup target drifted`,
  );
  await unlink(absolutePath);
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
} = {}) {
  validateG5L4ReviewWorkflowPreparation(report);
  const projectRoot = path.resolve(projectRootOption);
  await verifyCurrentSourceBindings(report, projectRoot);
  const outputs = outputPaths(projectRoot, outputPrefix);
  await ensureSafeDirectory(projectRoot, path.dirname(outputs.json), !check);
  const expected = {
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderMarkdown(report)),
  };
  if (check) {
    for (const [key, absolutePath] of Object.entries(outputs)) {
      const state = await existingFileState(absolutePath, projectRoot);
      invariant(
        state?.sha256 === sha256Bytes(expected[key]),
        `${portable(path.relative(projectRoot, absolutePath))}: output is stale`,
      );
    }
    return {action: "verified"};
  }

  const entries = Object.entries(outputs).map(([key, absolutePath]) => ({
    key,
    absolutePath,
    contents: expected[key],
    desiredSha256: sha256Bytes(expected[key]),
    temporary: path.join(
      path.dirname(absolutePath),
      `.${path.basename(absolutePath)}.${process.pid}.${randomUUID()}.tmp`,
    ),
    backup: path.join(
      path.dirname(absolutePath),
      `.${path.basename(absolutePath)}.${process.pid}.${randomUUID()}.bak`,
    ),
  }));
  let installed = 0;
  let committed = false;
  try {
    for (const entry of entries) {
      entry.prior = await existingFileState(entry.absolutePath, projectRoot);
      invariant(
        !(await existingFileState(entry.temporary, projectRoot)),
        "temporary output unexpectedly exists",
      );
      invariant(
        !(await existingFileState(entry.backup, projectRoot)),
        "backup output unexpectedly exists",
      );
      await writeFile(entry.temporary, entry.contents, {
        flag: "wx",
        mode: 0o644,
      });
    }
    await verifyCurrentSourceBindings(report, projectRoot);
    for (const entry of entries) {
      const current = await existingFileState(entry.absolutePath, projectRoot);
      invariant(
        current?.sha256 === entry.prior?.sha256 &&
          Boolean(current) === Boolean(entry.prior),
        `${portable(path.relative(projectRoot, entry.absolutePath))}: output changed before install`,
      );
      if (entry.prior) await rename(entry.absolutePath, entry.backup);
    }
    for (const entry of entries) {
      await rename(entry.temporary, entry.absolutePath);
      installed += 1;
    }
    for (const entry of entries) {
      const current = await existingFileState(entry.absolutePath, projectRoot);
      invariant(
        current?.sha256 === entry.desiredSha256,
        `${portable(path.relative(projectRoot, entry.absolutePath))}: installed output drifted`,
      );
    }
    await verifyCurrentSourceBindings(report, projectRoot);
    committed = true;
    for (const entry of entries) {
      if (entry.prior) {
        await removeExpected(
          entry.backup,
          entry.prior.sha256,
          projectRoot,
        );
      }
    }
  } catch (error) {
    if (committed) throw error;
    const rollbackErrors = [];
    for (let index = installed - 1; index >= 0; index -= 1) {
      try {
        await removeExpected(
          entries[index].absolutePath,
          entries[index].desiredSha256,
          projectRoot,
        );
      } catch (caught) {
        rollbackErrors.push(caught);
      }
    }
    for (const entry of [...entries].reverse()) {
      try {
        const backup = await existingFileState(entry.backup, projectRoot);
        if (backup) {
          invariant(
            entry.prior && backup.sha256 === entry.prior.sha256,
            "rollback backup drifted",
          );
          await rename(entry.backup, entry.absolutePath);
        }
      } catch (caught) {
        rollbackErrors.push(caught);
      }
      try {
        await removeExpected(
          entry.temporary,
          entry.desiredSha256,
          projectRoot,
        );
      } catch (caught) {
        rollbackErrors.push(caught);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "review-workflow write failed and rollback did not complete",
      );
    }
    throw error;
  }
  return {
    action: "written",
    outputs: entries.map((entry) => ({
      path: portable(path.relative(projectRoot, entry.absolutePath)),
      bytes: entry.contents.length,
      sha256: entry.desiredSha256,
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
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--output-prefix") {
      options.outputPrefix = argv[++index];
      invariant(options.outputPrefix, "--output-prefix requires a value");
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  outputPaths(DEFAULT_PROJECT_ROOT, options.outputPrefix);
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildG5L4ReviewWorkflowPreparation();
  const result = await writeOrCheck({report, ...options});
  process.stdout.write(`${JSON.stringify(result)}\n`);
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
