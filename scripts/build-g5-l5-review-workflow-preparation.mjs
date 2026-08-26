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
  validateG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";
import {
  validateG5L5M1MachineFoundationReport,
} from "./build-g5-l5-m1-machine-foundation-readiness.mjs";
import {
  validateG5L5PostM1RuntimeAcquisitionReport,
} from "./materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs";
import {
  validateG5L5PostM1AnimateAuthoringReport,
} from "./materialize-g5-l5-post-m1-animate-authoring-successors.mjs";
import {
  validateG5L5CoverageTraceObligationReport,
} from "./build-g5-l5-coverage-trace-obligation-matrix.mjs";
import {
  validateG5L5PostM1RiskReadinessReport,
} from "./build-g5-l5-post-m1-risk-calibration-successor.mjs";
import {
  validateG5L5RendererNeutralWorkQueue,
} from "./build-g5-l5-renderer-neutral-work-queue.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const ORDERED_MEMBER_IDENTITY_SHA256 =
  "c3961a2b552a825ba4fce167a502f20e5bcb9ae73a4938c57f4fea6f6e947ccd";
const DEFAULT_OUTPUT_PREFIX = "reports/g5-l5-review-workflow-preparation";
const SHA256 = /^[a-f0-9]{64}$/;
const REVIEW_TEMPLATE_EFFECT =
  "none; blank unsigned future independent-review worksheet only";
const APPROVAL_TEMPLATE_EFFECT =
  "none; blank unsigned future release-approval worksheet only";
const REPORT_EFFECT =
  "none; post-M1 machine-only review-workflow preparation only";

const INPUT_PATHS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  ownerGovernanceDirective:
    "catalog/owner-authorizations/g5-l5-owner-governance-directive-intake-2026-07-29.json",
  m1MachineFoundation:
    "reports/g5-l5-m1-machine-foundation-readiness.json",
  postM1RuntimeAcquisition:
    "reports/g5-l5-post-m1-runtime-acquisition-readiness.json",
  postM1AnimateAuthoring:
    "reports/g5-l5-post-m1-animate-authoring-readiness.json",
  coverageTraceObligations:
    "reports/g5-l5-coverage-trace-obligation-matrix.json",
  postM1RiskCalibration:
    "reports/g5-l5-post-m1-risk-calibration-readiness.json",
  rendererNeutralWorkQueue:
    "reports/g5-l5-renderer-neutral-work-queue.json",
  ownerValidator:
    "scripts/build-g5-l5-owner-governance-directive-intake.mjs",
  m1Validator:
    "scripts/build-g5-l5-m1-machine-foundation-readiness.mjs",
  runtimeValidator:
    "scripts/materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs",
  animateValidator:
    "scripts/materialize-g5-l5-post-m1-animate-authoring-successors.mjs",
  coverageValidator:
    "scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs",
  riskValidator:
    "scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs",
  rendererQueueValidator:
    "scripts/build-g5-l5-renderer-neutral-work-queue.mjs",
  generator: "scripts/build-g5-l5-review-workflow-preparation.mjs",
});

const JSON_INPUT_KEYS = Object.freeze([
  "releaseManifest",
  "ownerGovernanceDirective",
  "m1MachineFoundation",
  "postM1RuntimeAcquisition",
  "postM1AnimateAuthoring",
  "coverageTraceObligations",
  "postM1RiskCalibration",
  "rendererNeutralWorkQueue",
]);

const REVIEW_DEFINITIONS = Object.freeze([
  Object.freeze({
    reviewId: "independent-engineering-review",
    roleId: "independent-engineering-reviewer",
    requiredEvidence: Object.freeze([
      "implemented-renderer-and-pure-timeline-source",
      "behavior-terminal-replay-and-language-tests",
      "product-accessibility-console-network-and-reduced-motion-qa",
      "immutable-current-javascript-evidence-manifest",
    ]),
  }),
  Object.freeze({
    reviewId: "independent-human-visual-review",
    roleId: "independent-human-visual-reviewer",
    requiredEvidence: Object.freeze([
      "authorized-original-runtime-baseline-for-all-required-traces",
      "deterministic-current-javascript-captures",
      "complete-full-frame-diffs-rmse-and-outlier-set",
      "native-desktop-mobile-and-language-specific-visual-review-set",
    ]),
  }),
  Object.freeze({
    reviewId: "independent-audio-review",
    roleId: "independent-audio-reviewer",
    requiredEvidence: Object.freeze([
      "authorized-original-runtime-listening-evidence",
      "hash-bound-source-host-and-current-javascript-audio",
      "cue-language-content-sync-stop-loop-and-replay-dispositions",
      "immutable-audio-review-evidence-manifest",
    ]),
  }),
  Object.freeze({
    reviewId: "independent-spanish-review",
    roleId: "independent-spanish-reviewer",
    requiredEvidence: Object.freeze([
      "authorized-spanish-original-runtime-natural-traces",
      "english-spanish-state-copy-and-mathematics-crosswalk",
      "spanish-audio-language-content-and-synchronization-dispositions",
      "immutable-spanish-review-evidence-manifest",
    ]),
  }),
]);

const RELEASE_APPROVAL_DEFINITIONS = Object.freeze([
  Object.freeze({
    approvalId: "owner-fidelity-acceptance",
    roleId: "owner-approver",
    requiredPreconditions: Object.freeze([
      "57-of-57-current-final-specifications",
      "57-of-57-implementation-and-product-qa",
      "all-required-independent-reviews-accepted",
      "all-known-exceptions-explicitly-dispositioned",
    ]),
  }),
  Object.freeze({
    approvalId: "strict-validation-approval",
    roleId: "strict-validation-authority",
    requiredPreconditions: Object.freeze([
      "owner-fidelity-acceptance",
      "strict-validator-pass-for-57-of-57",
      "current-completion-and-release-ledgers",
      "atomic-release-admission-gate-open",
    ]),
  }),
  Object.freeze({
    approvalId: "atomic-publication-approval",
    roleId: "release-custodian",
    requiredPreconditions: Object.freeze([
      "strict-validation-approval",
      "57-of-57-strict-completion",
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

function portable(value) {
  return value.split(path.sep).join("/");
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
    `${label}: path must be portable and project-relative`,
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

export async function readFileRecord(projectRoot, relativePath, label) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const before = await assertOrdinaryFile(absolutePath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
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

function allFalse(object, keys = Object.keys(object || {})) {
  return keys.every((key) => object?.[key] === false);
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
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, `${RELEASE_ID}: release is not unique`);
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.members === 57 &&
      release.expectedCounts.activeXmlReferencedPages === 56 &&
      release.expectedCounts.courseShells === 1 &&
      Array.isArray(release.members) &&
      release.members.length === 57 &&
      release.members.every(
        (member, index) => member.ordinal === index + 1,
      ),
    "G5 L5 release scope drifted",
  );
  invariant(
    sha256Bytes(Buffer.from(stableJson(release))) ===
        RELEASE_FINGERPRINT_SHA256 &&
      sha256Bytes(
        Buffer.from(stableJson(orderedMemberIdentities(release.members))),
      ) === ORDERED_MEMBER_IDENTITY_SHA256,
    "G5 L5 release fingerprint or ordered identity drifted",
  );
  return release;
}

function validateMachineInputs(records, release) {
  const owner = records.ownerGovernanceDirective.document;
  validateG5L5OwnerGovernanceDirectiveIntake(owner);
  invariant(
    owner.authorization?.continueMachineOnlyStaticWork === true &&
      owner.authorization.m0ExitDirectiveRecorded === true &&
      owner.authorization.m1MachineFoundationStartAuthorized === true &&
      owner.authorization.repositoryBudgetProcurementDefaultsSelected ===
        true &&
      owner.budgetDefaultResolution
        ?.repositoryDefinedNumericOrCycleDefaultsFound === false &&
      owner.budgetDefaultResolution.personnelRateCeilingUsdPerHour === null &&
      owner.budgetDefaultResolution.totalBudgetEnvelopeUsd === null &&
      owner.budgetDefaultResolution.procurementPaymentCycle === null &&
      owner.budgetDefaultResolution.externalSpendAuthorized === false &&
      owner.budgetDefaultResolution.procurementOrPaymentAuthorized === false &&
      owner.externalSignatureEnvelope === null,
    "Owner directive was expanded into identity, budget, spend, or procurement authority",
  );

  const m1 = records.m1MachineFoundation.document;
  validateG5L5M1MachineFoundationReport(m1);
  invariant(
    m1.summary?.exactReleaseMemberCount === 57 &&
      m1.summary.m1MachineOnlyStaticExecutionReady === true &&
      m1.summary.namedPersonCount === 0 &&
      m1.summary.strictCompleteCount === 0 &&
      m1.summary.published === false &&
      m1.summary.externalSpendAuthorized === false &&
      m1.summary.procurementOrPaymentAuthorized === false &&
      m1.acceptanceEffects?.m1MachineOnlyStaticExecutionAuthorized === true &&
      m1.acceptanceEffects.m1MachineOnlyStaticStartAuthorized === true &&
      allFalse(m1.acceptanceEffects, [
        "humanReviewAccepted",
        "implementationAuthorized",
        "ownerAccepted",
        "published",
        "runtimeExecutionAuthorized",
        "strictComplete",
      ]),
    "M1 report crossed its machine-only static boundary",
  );

  const runtime = records.postM1RuntimeAcquisition.document;
  validateG5L5PostM1RuntimeAcquisitionReport(runtime, release);
  const animate = records.postM1AnimateAuthoring.document;
  validateG5L5PostM1AnimateAuthoringReport(animate, release);
  const coverage = records.coverageTraceObligations.document;
  validateG5L5CoverageTraceObligationReport(coverage);
  const risk = records.postM1RiskCalibration.document;
  validateG5L5PostM1RiskReadinessReport(risk);
  const renderer = records.rendererNeutralWorkQueue.document;
  validateG5L5RendererNeutralWorkQueue(renderer);

  invariant(
    runtime.summary.emptyWorksheetCount === 57 &&
      runtime.summary.runtimeSessionCount === 0 &&
      runtime.summary.authoritativeBaselineCount === 0 &&
      runtime.summary.acceptedReviewCount === 0 &&
      runtime.summary.strictCompleteCount === 0 &&
      runtime.summary.publishedCount === 0 &&
      allFalse(runtime.acceptanceEffects),
    "runtime successor report recorded execution or acceptance",
  );
  invariant(
    animate.summary.emptyWorksheetCount === 57 &&
      animate.summary.guiExecutionCount === 0 &&
      animate.summary.authoringAuditCompleteCount === 0 &&
      animate.summary.acceptedReviewCount === 0 &&
      animate.summary.strictCompleteCount === 0 &&
      animate.summary.publishedCount === 0 &&
      allFalse(animate.acceptanceEffects),
    "Animate successor report recorded GUI work or acceptance",
  );
  invariant(
    coverage.currentCanonicalCoverage?.pendingRequirementCount === 114 &&
      coverage.currentCanonicalCoverage.authoritativeBaselineCount === 0 &&
      coverage.execution?.runtimeSessionsExecuted === 0 &&
      coverage.execution.guiApplicationsLaunched === 0 &&
      coverage.execution.browsersLaunched === 0 &&
      coverage.execution.namedHumanAttestationsRecorded === 0 &&
      allFalse(coverage.acceptanceEffects),
    "coverage/trace matrix recorded authority, execution, or acceptance",
  );
  invariant(
    risk.summary?.assignedPersonCount === 0 &&
      risk.summary.runtimeSessionCount === 0 &&
      risk.summary.acceptanceCompleteCount === 0 &&
      risk.summary.strictCompleteCount === 0 &&
      risk.summary.publishedCount === 0 &&
      risk.acceptanceEffects?.acceptanceNeutral === true &&
      allFalse(
        risk.acceptanceEffects,
        Object.keys(risk.acceptanceEffects).filter(
          (key) => key !== "acceptanceNeutral",
        ),
      ),
    "risk successor report recorded people, execution, or acceptance",
  );
  invariant(
    renderer.summary?.implementationStartedCount === 0 &&
      renderer.summary.runtimeSessionCount === 0 &&
      renderer.summary.guiLaunchCount === 0 &&
      renderer.summary.acceptanceCompleteCount === 0 &&
      renderer.summary.strictCompleteCount === 0 &&
      renderer.summary.publishedCount === 0 &&
      renderer.execution?.runnable === false &&
      renderer.execution.commands?.length === 0 &&
      allFalse(renderer.acceptanceEffects),
    "renderer-neutral queue recorded implementation, execution, or acceptance",
  );
}

function blankReviewTemplate(member, definition) {
  return {
    templateId: `${member.animationId}:${definition.reviewId}`,
    templateType: "g5-l5-unsigned-independent-review-template",
    releaseId: RELEASE_ID,
    releaseOrdinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    reviewId: definition.reviewId,
    roleId: definition.roleId,
    independenceRequired: true,
    requiredEvidence: [...definition.requiredEvidence],
    evidencePrerequisitesCurrent: false,
    readyForHumanReview: false,
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
    strictAcceptanceEffect: REVIEW_TEMPLATE_EFFECT,
  };
}

function blankMemberReviewBundle(member) {
  return {
    releaseOrdinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    reviews: REVIEW_DEFINITIONS.map((definition) =>
      blankReviewTemplate(member, definition)),
  };
}

function blankReleaseApproval(definition) {
  return {
    templateId: `${RELEASE_ID}:${definition.approvalId}`,
    templateType: "g5-l5-unsigned-release-approval-template",
    releaseId: RELEASE_ID,
    approvalId: definition.approvalId,
    roleId: definition.roleId,
    requiredPreconditions: [...definition.requiredPreconditions],
    preconditionsSatisfied: false,
    readyForDecision: false,
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
    strictAcceptanceEffect: APPROVAL_TEMPLATE_EFFECT,
  };
}

export async function buildG5L5ReviewWorkflowPreparation({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {};
  for (const [key, relativePath] of Object.entries(INPUT_PATHS)) {
    records[key] = JSON_INPUT_KEYS.includes(key)
      ? await readJsonRecord(projectRoot, relativePath, key)
      : await readFileRecord(projectRoot, relativePath, key);
  }
  const release = selectRelease(records.releaseManifest.document);
  validateMachineInputs(records, release);

  const memberReviewBundles = release.members.map(blankMemberReviewBundle);
  const releaseApprovalTemplates = RELEASE_APPROVAL_DEFINITIONS.map(
    blankReleaseApproval,
  );
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-review-workflow-preparation",
    releaseId: RELEASE_ID,
    evidenceState:
      "post-m1-unsigned-unassigned-non-runnable-review-preparation-only",
    authority:
      "This deterministic machine-only report prepares blank future independent-review and release-approval worksheets. It performs no review, assigns no person, records no signature or decision, launches no GUI or runtime, accepts no fidelity evidence, and changes no strict-completion or publication gate.",
    release: {
      titleDisplay: release.titleDisplay,
      releaseType: release.releaseType,
      publicationMode: release.publicationMode,
      memberCount: 57,
      pageCount: 56,
      shellCount: 1,
      pairedFlaSwfCount: 49,
      swfOnlyCount: 8,
      orderedMemberIdentitySha256: ORDERED_MEMBER_IDENTITY_SHA256,
      releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256,
    },
    sourceBindings: Object.fromEntries(
      Object.entries(records).map(([key, record]) => [
        key,
        descriptor(record),
      ]),
    ),
    preparationAuthority: {
      ownerContinueMachineOnlyStaticWorkRecorded: true,
      machineOnlyStaticPreparationAllowed: true,
      independentReviewExecutionAuthorized: false,
      reviewerAssignmentAuthorized: false,
      signatureOrAttestationAuthorized: false,
      reviewAcceptanceEstablished: false,
      ownerFidelityAcceptanceEstablished: false,
      strictValidationApprovalEstablished: false,
      atomicPublicationApprovalEstablished: false,
      runtimeOrGuiExecutionAuthorized: false,
      implementationAuthorized: false,
      evidencePromotionAuthorized: false,
      spendOrProcurementAuthorized: false,
    },
    currentInputBoundary: {
      runtimeAcquisitionEmptyWorksheetCount: 57,
      runtimeSessionCount: 0,
      authoritativeOriginalRuntimeBaselineCount: 0,
      animateAuthoringEmptyWorksheetCount: 57,
      animateGuiExecutionCount: 0,
      animateAuthoringAuditCompleteCount: 0,
      coverageRequirementCount: 114,
      coveragePendingRequirementCount: 114,
      rendererUndecidedCount: 57,
      implementationStartedCount: 0,
      acceptedIndependentReviewCount: 0,
      ownerFidelityAcceptanceCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    memberReviewBundles,
    releaseApprovalTemplates,
    summary: {
      releaseMemberCount: 57,
      reviewKindsPerMember: 4,
      memberReviewBundleCount: 57,
      independentEngineeringReviewTemplateCount: 57,
      independentVisualReviewTemplateCount: 57,
      independentAudioReviewTemplateCount: 57,
      independentSpanishReviewTemplateCount: 57,
      memberReviewTemplateCount: 228,
      releaseApprovalTemplateCount: 3,
      totalUnsignedTemplateCount: 231,
      assignedReviewerCount: 0,
      filledReviewerIdentityCount: 0,
      signedReviewCount: 0,
      acceptedReviewCount: 0,
      ownerFidelityAcceptanceCount: 0,
      strictValidationApprovalCount: 0,
      strictCompleteCount: 0,
      publicationApprovalCount: 0,
      publishedCount: 0,
    },
    execution: {
      runnable: false,
      commands: [],
      browsersLaunched: 0,
      guiApplicationsLaunched: 0,
      animateLaunches: 0,
      flashLaunches: 0,
      ruffleLaunches: 0,
      originalRuntimeSessionsExecuted: 0,
      humanReviewsPerformed: 0,
      signaturesRecorded: 0,
    },
    acceptanceEffects: Object.fromEntries(
      ACCEPTANCE_KEYS.map((key) => [key, false]),
    ),
    limitations: [
      "Each independent review requires its complete current hash-bound evidence packet and a real named reviewer distinct from the work being reviewed.",
      "Audio acceptance requires authorized original-runtime listening; structural audio inventory and empty templates are not listening evidence.",
      "Human visual review, Owner fidelity acceptance, strict validation, and atomic publication are separate immutable future decisions.",
      "All 228 member-review and three release-level approval worksheets remain blank, unsigned, unassigned, and not ready for decision.",
      "This report changes no migration manifest, canonical evidence, historical report, completion ledger, release ledger, route, renderer, or publication state.",
    ],
    protectedMutationCounts: {
      migrationManifestWrites: 0,
      canonicalEvidenceWrites: 0,
      historicalReportWrites: 0,
      completionLedgerWrites: 0,
      releaseLedgerWrites: 0,
      implementationWrites: 0,
      routeOrPublicationWrites: 0,
    },
    strictAcceptanceEffect: REPORT_EFFECT,
  };
  const report = {
    ...base,
    reportFingerprintSha256: sha256Bytes(Buffer.from(stableJson(base))),
  };
  validateG5L5ReviewWorkflowPreparation(report);
  return report;
}

function validateBlankReview(template, member, definition) {
  invariant(
    template.templateId ===
        `${member.animationId}:${definition.reviewId}` &&
      template.templateType ===
        "g5-l5-unsigned-independent-review-template" &&
      template.releaseId === RELEASE_ID &&
      template.releaseOrdinal === member.ordinal &&
      template.animationId === member.animationId &&
      template.assetId === member.assetId &&
      template.reviewId === definition.reviewId &&
      template.roleId === definition.roleId &&
      template.independenceRequired === true &&
      JSON.stringify(template.requiredEvidence) ===
        JSON.stringify(definition.requiredEvidence) &&
      template.evidencePrerequisitesCurrent === false &&
      template.readyForHumanReview === false &&
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
      template.strictAcceptanceEffect === REVIEW_TEMPLATE_EFFECT,
    `${member.animationId}/${definition.reviewId}: review template was filled or promoted`,
  );
}

function validateBlankApproval(template, definition) {
  invariant(
    template.templateId === `${RELEASE_ID}:${definition.approvalId}` &&
      template.templateType ===
        "g5-l5-unsigned-release-approval-template" &&
      template.releaseId === RELEASE_ID &&
      template.approvalId === definition.approvalId &&
      template.roleId === definition.roleId &&
      JSON.stringify(template.requiredPreconditions) ===
        JSON.stringify(definition.requiredPreconditions) &&
      template.preconditionsSatisfied === false &&
      template.readyForDecision === false &&
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
      template.strictAcceptanceEffect === APPROVAL_TEMPLATE_EFFECT,
    `${definition.approvalId}: release approval template was filled or promoted`,
  );
}

export function validateG5L5ReviewWorkflowPreparation(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-review-workflow-preparation" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        "post-m1-unsigned-unassigned-non-runnable-review-preparation-only",
    "G5 L5 review-workflow report identity drifted",
  );
  invariant(
    report.release?.titleDisplay ===
        "Add & Subtract Negative Numbers" &&
      report.release.releaseType === "complete-lesson" &&
      report.release.publicationMode === "atomic" &&
      report.release.memberCount === 57 &&
      report.release.pageCount === 56 &&
      report.release.shellCount === 1 &&
      report.release.pairedFlaSwfCount === 49 &&
      report.release.swfOnlyCount === 8 &&
      report.release.orderedMemberIdentitySha256 ===
        ORDERED_MEMBER_IDENTITY_SHA256 &&
      report.release.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256,
    "G5 L5 review-workflow release scope drifted",
  );
  invariant(
    Object.keys(report.sourceBindings || {}).length ===
        Object.keys(INPUT_PATHS).length &&
      Object.entries(INPUT_PATHS).every(([key, expectedPath]) => {
        const binding = report.sourceBindings[key];
        return binding?.path === expectedPath &&
          Number.isSafeInteger(binding.bytes) &&
          binding.bytes > 0 &&
          SHA256.test(binding.sha256 || "");
      }),
    "G5 L5 review-workflow source binding set drifted",
  );
  invariant(
    report.preparationAuthority
      ?.ownerContinueMachineOnlyStaticWorkRecorded === true &&
      report.preparationAuthority.machineOnlyStaticPreparationAllowed ===
        true &&
      [
        "independentReviewExecutionAuthorized",
        "reviewerAssignmentAuthorized",
        "signatureOrAttestationAuthorized",
        "reviewAcceptanceEstablished",
        "ownerFidelityAcceptanceEstablished",
        "strictValidationApprovalEstablished",
        "atomicPublicationApprovalEstablished",
        "runtimeOrGuiExecutionAuthorized",
        "implementationAuthorized",
        "evidencePromotionAuthorized",
        "spendOrProcurementAuthorized",
      ].every((key) => report.preparationAuthority[key] === false),
    "G5 L5 review-workflow authority was promoted",
  );
  invariant(
    report.currentInputBoundary
      ?.runtimeAcquisitionEmptyWorksheetCount === 57 &&
      report.currentInputBoundary.runtimeSessionCount === 0 &&
      report.currentInputBoundary
        .authoritativeOriginalRuntimeBaselineCount === 0 &&
      report.currentInputBoundary.animateAuthoringEmptyWorksheetCount ===
        57 &&
      report.currentInputBoundary.animateGuiExecutionCount === 0 &&
      report.currentInputBoundary.animateAuthoringAuditCompleteCount === 0 &&
      report.currentInputBoundary.coverageRequirementCount === 114 &&
      report.currentInputBoundary.coveragePendingRequirementCount === 114 &&
      report.currentInputBoundary.rendererUndecidedCount === 57 &&
      report.currentInputBoundary.implementationStartedCount === 0 &&
      report.currentInputBoundary.acceptedIndependentReviewCount === 0 &&
      report.currentInputBoundary.ownerFidelityAcceptanceCount === 0 &&
      report.currentInputBoundary.strictCompleteCount === 0 &&
      report.currentInputBoundary.publishedCount === 0,
    "G5 L5 review-workflow input boundary drifted",
  );
  invariant(
    Array.isArray(report.memberReviewBundles) &&
      report.memberReviewBundles.length === 57,
    "G5 L5 member review bundle count drifted",
  );
  const identities = [];
  const templateIds = [];
  for (const [index, bundle] of report.memberReviewBundles.entries()) {
    const member = {
      ordinal: index + 1,
      animationId: bundle?.animationId,
      assetId: bundle?.assetId,
    };
    invariant(
      bundle?.releaseOrdinal === member.ordinal &&
        typeof member.animationId === "string" &&
        typeof member.assetId === "string" &&
        typeof bundle.releaseRole === "string" &&
        Array.isArray(bundle.reviews) &&
        bundle.reviews.length === 4,
      `G5 L5 review bundle ${index + 1} identity drifted`,
    );
    identities.push(member);
    for (const [definitionIndex, definition] of
      REVIEW_DEFINITIONS.entries()) {
      const template = bundle.reviews[definitionIndex];
      validateBlankReview(template, member, definition);
      templateIds.push(template.templateId);
    }
  }
  invariant(
    sha256Bytes(Buffer.from(stableJson(identities))) ===
        ORDERED_MEMBER_IDENTITY_SHA256 &&
      templateIds.length === 228 &&
      new Set(templateIds).size === 228,
    "G5 L5 review templates are not bound to 57 unique release identities",
  );
  invariant(
    Array.isArray(report.releaseApprovalTemplates) &&
      report.releaseApprovalTemplates.length === 3,
    "G5 L5 release approval template count drifted",
  );
  for (const [index, definition] of RELEASE_APPROVAL_DEFINITIONS.entries()) {
    validateBlankApproval(report.releaseApprovalTemplates[index], definition);
  }
  const summary = report.summary;
  invariant(
    summary?.releaseMemberCount === 57 &&
      summary.reviewKindsPerMember === 4 &&
      summary.memberReviewBundleCount === 57 &&
      summary.independentEngineeringReviewTemplateCount === 57 &&
      summary.independentVisualReviewTemplateCount === 57 &&
      summary.independentAudioReviewTemplateCount === 57 &&
      summary.independentSpanishReviewTemplateCount === 57 &&
      summary.memberReviewTemplateCount === 228 &&
      summary.releaseApprovalTemplateCount === 3 &&
      summary.totalUnsignedTemplateCount === 231,
    "G5 L5 review-workflow summary cardinality drifted",
  );
  for (const key of [
    "assignedReviewerCount",
    "filledReviewerIdentityCount",
    "signedReviewCount",
    "acceptedReviewCount",
    "ownerFidelityAcceptanceCount",
    "strictValidationApprovalCount",
    "strictCompleteCount",
    "publicationApprovalCount",
    "publishedCount",
  ]) {
    invariant(summary[key] === 0, `summary ${key} must remain zero`);
  }
  invariant(
    report.execution?.runnable === false &&
      Array.isArray(report.execution.commands) &&
      report.execution.commands.length === 0 &&
      [
        "browsersLaunched",
        "guiApplicationsLaunched",
        "animateLaunches",
        "flashLaunches",
        "ruffleLaunches",
        "originalRuntimeSessionsExecuted",
        "humanReviewsPerformed",
        "signaturesRecorded",
      ].every((key) => report.execution[key] === 0),
    "G5 L5 review workflow became runnable or recorded execution",
  );
  invariant(
    Object.keys(report.acceptanceEffects || {}).length ===
        ACCEPTANCE_KEYS.length &&
      ACCEPTANCE_KEYS.every((key) => report.acceptanceEffects[key] === false),
    "G5 L5 review workflow advanced an acceptance gate",
  );
  invariant(
    Object.values(report.protectedMutationCounts || {}).every(
      (value) => value === 0,
    ) &&
      report.strictAcceptanceEffect === REPORT_EFFECT,
    "G5 L5 review workflow recorded protected mutation or strict effect",
  );
  invariant(
    SHA256.test(report.reportFingerprintSha256 || ""),
    "G5 L5 review-workflow fingerprint is missing",
  );
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 ===
      sha256Bytes(Buffer.from(stableJson(projected))),
    "G5 L5 review-workflow fingerprint drifted",
  );
  return true;
}

export function renderG5L5ReviewWorkflowMarkdown(report) {
  validateG5L5ReviewWorkflowPreparation(report);
  const reviewRows = REVIEW_DEFINITIONS.map((definition) =>
    `| \`${definition.reviewId}\` | \`${definition.roleId}\` | 57 | 0 | blank / unsigned / unassigned |`)
    .join("\n");
  const approvalRows = RELEASE_APPROVAL_DEFINITIONS.map((definition) =>
    `| \`${definition.approvalId}\` | \`${definition.roleId}\` | pending; blank / unsigned |`)
    .join("\n");
  return `# G5 L5 Review Workflow Preparation

Release: \`${RELEASE_ID}\` — **Add & Subtract Negative Numbers**  
Scope: **56 pages + Shell / 57 atomic release members**  
State: **post-M1 machine-only preparation; no review or approval accepted**

This report binds the current post-M1 runtime-acquisition, Animate-authoring,
coverage/trace, risk-calibration, and renderer-neutral planning reports. It
prepares future review worksheets only.

## Independent member-review worksheets

| Review | Required role | Templates | Accepted | State |
| --- | --- | ---: | ---: | --- |
${reviewRows}

Total: **228 blank unsigned templates / 0 assigned / 0 signed / 0 accepted**.

## Release-level approval worksheets

| Approval | Required role | State |
| --- | --- | --- |
${approvalRows}

Owner fidelity acceptance, strict-validation approval, and atomic-publication
approval remain **0 / 0 / 0**.

## Current evidence boundary

- Runtime-acquisition worksheets: **57 empty / 0 sessions**
- Authoritative original-runtime baselines: **0/57**
- Animate-authoring worksheets: **57 empty / 0 GUI launches / 0 completed audits**
- Coverage-v2 requirements: **114 pending / 114 total**
- Renderer decisions / implementation starts: **0/57 / 0/57**
- Independent reviews / Owner acceptance: **0 / 0**
- Strict complete / published: **0/57 / 0**

## Automation boundary

The report is non-runnable and contains no command, name, identity, signature,
date, evidence decision, or approval. It launches no browser, Animate, Flash,
Ruffle, or original runtime and changes no canonical evidence, historical
report, migration manifest, ledger, renderer, route, strict status, or
publication state.

Strict acceptance effect: **none**.
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

export async function writeOrCheckG5L5ReviewWorkflow({
  report,
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
} = {}) {
  validateG5L5ReviewWorkflowPreparation(report);
  const projectRoot = path.resolve(projectRootOption);
  await verifyCurrentSourceBindings(report, projectRoot);
  const outputs = outputPaths(projectRoot, outputPrefix);
  await ensureSafeDirectory(projectRoot, path.dirname(outputs.json), !check);
  const expected = {
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderG5L5ReviewWorkflowMarkdown(report)),
  };
  if (check) {
    for (const [key, absolutePath] of Object.entries(outputs)) {
      const state = await existingFileState(absolutePath, projectRoot);
      invariant(
        state?.sha256 === sha256Bytes(expected[key]),
        `${portable(path.relative(projectRoot, absolutePath))}: output is stale`,
      );
    }
    return {action: "verified", outputCount: 2};
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
        await removeExpected(entry.backup, entry.prior.sha256, projectRoot);
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
        "G5 L5 review-workflow write failed and rollback did not complete",
      );
    }
    throw error;
  }
  return {
    action: "written",
    outputCount: 2,
    outputs: entries.map((entry) => ({
      path: portable(path.relative(projectRoot, entry.absolutePath)),
      bytes: entry.contents.length,
      sha256: entry.desiredSha256,
    })),
  };
}

export function parseG5L5ReviewWorkflowArguments(argv) {
  const options = {
    mode: "dry-run",
    outputPrefix: DEFAULT_OUTPUT_PREFIX,
  };
  let modeSeen = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(!modeSeen, "choose exactly one execution mode");
      options.mode = argument.slice(2);
      modeSeen = true;
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
  const options = parseG5L5ReviewWorkflowArguments(process.argv.slice(2));
  const report = await buildG5L5ReviewWorkflowPreparation();
  if (options.mode === "dry-run") {
    process.stdout.write(`${JSON.stringify({
      action: "dry-run",
      releaseMemberCount: report.summary.releaseMemberCount,
      memberReviewTemplateCount: report.summary.memberReviewTemplateCount,
      releaseApprovalTemplateCount: report.summary.releaseApprovalTemplateCount,
      assignedReviewerCount: 0,
      signedReviewCount: 0,
      acceptedReviewCount: 0,
      runnable: false,
      outputCount: 2,
    })}\n`);
    return;
  }
  const result = await writeOrCheckG5L5ReviewWorkflow({
    report,
    outputPrefix: options.outputPrefix,
    check: options.mode === "check",
  });
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
