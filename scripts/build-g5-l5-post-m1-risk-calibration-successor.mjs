#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  link,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  g5L5M1StaticReconciliationReceiptPath,
  readG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  G5_L5_STATIC_STRICT_READINESS_STATE,
  g5L5StaticStrictReadinessPath,
  readG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";
import {validateScenarioInventory} from "./build-course-scenario-inventories.mjs";
import {
  G5_L5_WORK_STUDY_MEMBER_IDS,
  G5_L5_WORK_STUDY_PHASES,
  g5L5WorkStudyPreparationPath,
  validateG5L5WorkStudyPreparation,
} from "./prepare-g5-l5-work-study-package.mjs";
import {
  createG5L5StaticCompositeProofResolver,
  validateG5L5ProofBoundFrameDomainDisposition,
} from "./g5-l5-proof-bound-frame-domain-disposition.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_POST_M1_RISK_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_POST_M1_RISK_STATE =
  "post-m1-static-risk-calibration-successor-non-runnable";
export const G5_L5_POST_M1_RISK_MEMBER_IDS = Object.freeze([
  "shell-course-g05-l05-index-local",
  "course-g05-l05-rw-002",
  "course-g05-l05-in-016",
  "course-g05-l05-in-020",
  "course-g05-l05-ti-006",
  "course-g05-l05-gs-002",
  "course-g05-l05-ts-007",
  "course-g05-l05-fq-002",
]);

const GENERATOR_PATH =
  "scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs";
const GENERATOR_VERSION = 1;
const RELEASE_PATH = "catalog/lesson-releases.json";
const CALIBRATION_PATH = "catalog/lesson-release-calibration-sets.json";
const HISTORICAL_RISK_JSON = "reports/g5-l5-risk-calibration.json";
const HISTORICAL_RISK_MARKDOWN = "reports/g5-l5-risk-calibration.md";
const HISTORICAL_RISK_JSON_BYTES = 104078;
const HISTORICAL_RISK_JSON_SHA256 =
  "581889edbb1bd241bccc4ede68e6afe892f76d3e7d103d321f79283eb4c30aad";
const HISTORICAL_RISK_MARKDOWN_BYTES = 3405;
const HISTORICAL_RISK_MARKDOWN_SHA256 =
  "69b0bde0c34c616f07a4ae9f48cb2ae660c304b66f9fbc430e639ea82821f768";
const REPORT_JSON =
  "reports/g5-l5-post-m1-risk-calibration-readiness.json";
const REPORT_MARKDOWN =
  "reports/g5-l5-post-m1-risk-calibration-readiness.md";
const MEMBER_OUTPUT_NAME =
  "g5-l5-post-m1-risk-calibration-successor.json";
const EXPECTED_RELEASE_FINGERPRINT =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const MEASUREMENT_RULE =
  "These are G5 L5 candidates only. After separate G5 L5 authorization, record actual named-human start and finish times for each phase; do not infer or inherit hours, identities, receipts, review, or acceptance.";
const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const FALSE_AUTHORITY_KEYS = Object.freeze([
  "animateGuiExecutionAuthorized",
  "evidencePromotionAuthorized",
  "humanTimingAuthorized",
  "implementationAuthorized",
  "namedOperatorAssigned",
  "originalRuntimeExecutionAuthorized",
  "procurementOrPaymentAuthorized",
  "publicationAuthorized",
  "rendererSelectionAuthorized",
  "runtimeExecutionAuthorized",
  "spendAuthorized",
]);
const FALSE_ACCEPTANCE_KEYS = Object.freeze([
  "audioAccepted",
  "authoritativeOriginalRuntime",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "fullFrameComparisonAccepted",
  "humanVisualAccepted",
  "independentEngineeringAccepted",
  "ownerAccepted",
  "published",
  "rmseAccepted",
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

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(
    contained(root, absolutePath) &&
      portable(path.relative(root, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

function statIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertRealAncestors(root, absolutePath, label) {
  const parentRelative = path.relative(root, path.dirname(absolutePath));
  invariant(
    parentRelative !== ".." &&
      !parentRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(parentRelative),
    `${label}: parent escapes project root`,
  );
  const parts = parentRelative.split(path.sep).filter(Boolean);
  const ancestors = [
    root,
    ...parts.map((_, index) =>
      path.join(root, ...parts.slice(0, index + 1))),
  ];
  for (const ancestor of ancestors) {
    const information = await lstat(ancestor, {bigint: true});
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be a real directory`,
    );
  }
  const [realRoot, realParent] = await Promise.all([
    realpath(root),
    realpath(path.dirname(absolutePath)),
  ]);
  invariant(contained(realRoot, realParent), `${label}: real parent escapes root`);
}

async function readHandle(handle) {
  const chunks = [];
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;
  while (true) {
    const {bytesRead} = await handle.read(
      buffer,
      0,
      buffer.length,
      position,
    );
    if (!bytesRead) break;
    const chunk = Buffer.from(buffer.subarray(0, bytesRead));
    chunks.push(chunk);
    hash.update(chunk);
    position += bytesRead;
  }
  return {
    contents: Buffer.concat(chunks),
    bytes: position,
    sha256: hash.digest("hex"),
  };
}

async function readRecord(root, relativePath, {json = false, label = relativePath} = {}) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  await assertRealAncestors(root, absolutePath, label);
  const before = await lstat(absolutePath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") {
      throw new Error(`${label}: required file is missing (${relativePath})`);
    }
    throw error;
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let observed;
  let afterHandle;
  try {
    const beforeHandle = await handle.stat({bigint: true});
    invariant(
      sameIdentity(statIdentity(before), statIdentity(beforeHandle)),
      `${label}: changed before stable read`,
    );
    observed = await readHandle(handle);
    afterHandle = await handle.stat({bigint: true});
    invariant(
      sameIdentity(statIdentity(beforeHandle), statIdentity(afterHandle)),
      `${label}: changed during stable read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameIdentity(statIdentity(afterHandle), statIdentity(after)) &&
      observed.bytes === Number(after.size),
    `${label}: changed after stable read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(observed.contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    ...observed,
    document,
    stat: statIdentity(after),
  };
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function sameDescriptor(actual, record) {
  return actual?.path === record.path &&
    actual.bytes === record.bytes &&
    actual.sha256 === record.sha256;
}

function allFalse(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function fingerprintWithout(document, field) {
  const projected = structuredClone(document);
  delete projected[field];
  return sha256(Buffer.from(stableJson(projected)));
}

export function withPostM1RiskArtifactFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  return {
    ...projected,
    artifactFingerprintSha256: sha256(Buffer.from(stableJson(projected))),
  };
}

export function withPostM1RiskReportFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.reportFingerprintSha256;
  return {
    ...projected,
    reportFingerprintSha256: sha256(Buffer.from(stableJson(projected))),
  };
}

function selectRelease(catalog) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.releases),
    "release catalog is malformed",
  );
  const matches = catalog.releases.filter(
    ({releaseId}) => releaseId === G5_L5_POST_M1_RISK_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release must be unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 57 &&
      release.members?.length === 57 &&
      release.publicationMode === "atomic",
    "G5 L5 56-page-plus-Shell release scope drifted",
  );
  const fingerprint = sha256(Buffer.from(stableJson(release)));
  invariant(
    fingerprint === EXPECTED_RELEASE_FINGERPRINT,
    "G5 L5 release fingerprint drifted",
  );
  return {release, fingerprint};
}

function selectCalibration(catalog) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.calibrationSets),
    "calibration catalog is malformed",
  );
  const matches = catalog.calibrationSets.filter(
    ({releaseId}) => releaseId === G5_L5_POST_M1_RISK_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 calibration set must be unique");
  const calibration = matches[0];
  invariant(
    JSON.stringify(calibration.members?.map(({animationId}) => animationId)) ===
      JSON.stringify(G5_L5_POST_M1_RISK_MEMBER_IDS) &&
      calibration.members.every(
        ({intendedAxes}) =>
          Array.isArray(intendedAxes) && intendedAxes.length === 4,
      ) &&
      JSON.stringify(calibration.humanWorkStudy?.memberAnimationIds) ===
        JSON.stringify(G5_L5_WORK_STUDY_MEMBER_IDS) &&
      JSON.stringify(calibration.humanWorkStudy?.requiredPhases) ===
        JSON.stringify(G5_L5_WORK_STUDY_PHASES) &&
      calibration.humanWorkStudy?.measurementRule === MEASUREMENT_RULE,
    "G5 L5 8-member / 4-work-study calibration set drifted",
  );
  return {
    calibration,
    fingerprint: sha256(Buffer.from(stableJson(calibration))),
  };
}

function validateHistoricalRisk(report, calibration, calibrationRecord) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "lesson-release-static-risk-calibration" &&
      report.releaseId === G5_L5_POST_M1_RISK_RELEASE_ID &&
      JSON.stringify(report.items?.map(({animationId}) => animationId)) ===
        JSON.stringify(G5_L5_POST_M1_RISK_MEMBER_IDS) &&
      report.items.length === 8 &&
      report.summary?.calibrationMemberCount === 8 &&
      report.summary.workStudyTargetCount === 4 &&
      report.summary.workStudyCompletedCount === 0 &&
      report.summary.completeAuthoringAuditCount === 0 &&
      report.summary.rendererSelectedCount === 0 &&
      report.summary.rootReachabilityResolvedCount === 0 &&
      report.summary.implementationAuthorizedCount === 0 &&
      report.summary.strictCompleteCount === 0,
    "historical G5 L5 risk report identity or fail-closed summary drifted",
  );
  allFalse(
    report.acceptanceEffects,
    Object.keys(report.acceptanceEffects || {}),
    "historical risk report acceptance",
  );
  invariant(
    report.method?.noAcceptanceEffect === true &&
      report.method.noHumanIdentityOrTimestampGenerated === true &&
      report.method.noRendererSelection === true &&
      report.method.staticCountsAreNotEffortEstimates === true &&
      report.method.staticCountsAreNotRuntimeReachability === true &&
      report.humanWorkStudyProtocol?.automationMayFillActuals === false &&
      report.humanWorkStudyProtocol.status ===
        "candidate-template-only-separate-authorization-required" &&
      report.humanWorkStudyProtocol.measurementRule === MEASUREMENT_RULE &&
      sameDescriptor(
        report.sourceBindings?.calibrationSets,
        calibrationRecord,
      ),
    "historical G5 L5 risk report authority or calibration binding drifted",
  );
  for (let index = 0; index < calibration.members.length; index += 1) {
    const selected = calibration.members[index];
    const item = report.items[index];
    invariant(
      item.animationId === selected.animationId &&
        JSON.stringify(item.intendedCalibrationAxes) ===
          JSON.stringify(selected.intendedAxes) &&
        item.readiness?.authoritativeRuntimeCaptured === false &&
        item.readiness.completeAuthoringAudit === false &&
        item.readiness.implementationAuthorizedByThisReport === false &&
        item.readiness.rendererSelected === false &&
        item.readiness.rootReachabilityResolved === false &&
        item.readiness.strictAcceptanceEffect === false,
      `${selected.animationId}: historical risk item boundary drifted`,
    );
    const isWorkStudy = G5_L5_WORK_STUDY_MEMBER_IDS.includes(
      selected.animationId,
    );
    invariant(
      isWorkStudy === Boolean(item.workStudy),
      `${selected.animationId}: historical work-study selection drifted`,
    );
    if (item.workStudy) {
      invariant(
        item.workStudy.actualTotalMinutes === null &&
          item.workStudy.measuredBy === null &&
          item.workStudy.phases?.length === 4 &&
          item.workStudy.phases.every(
            (phase, phaseIndex) =>
              phase.phaseId === G5_L5_WORK_STUDY_PHASES[phaseIndex] &&
              phase.startedAt === null &&
              phase.finishedAt === null &&
              phase.actualMinutes === null &&
              phase.measuredBy === null,
          ),
        `${selected.animationId}: historical risk report contains work-study actuals`,
      );
    }
  }
}

function validateManifest(manifest, member) {
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === member.animationId &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "",
    `${member.animationId}: current migration crossed implementation boundary`,
  );
}

function validateCoverage(coverage, member, rootFrameCount) {
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      coverage.requirements?.length === 2 &&
      JSON.stringify(
        coverage.requirements.map(({language}) => language).sort(),
      ) === JSON.stringify(["en", "es"]),
    `${member.animationId}: coverage-v2 identity or bilingual scope drifted`,
  );
  for (const requirement of coverage.requirements) {
    invariant(
      requirement.frameDomainId === "root" &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === rootFrameCount &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.status === "pending" &&
        requirement.capturedFrameCount === 0 &&
        requirement.missingFrames?.length === rootFrameCount,
      `${member.animationId}: coverage-v2 was promoted or narrowed`,
    );
    for (const key of [
      "baselineCaptureManifest",
      "baselineCaptureManifestSha256",
      "captureManifest",
      "captureManifestSha256",
      "metricsFile",
      "metricsSha256",
    ]) {
      invariant(
        requirement[key] === "",
        `${member.animationId}: coverage ${key} must remain empty`,
      );
    }
  }
}

function authorityBoundary() {
  return {
    machineOnlyStaticSuccessorAuthorized: true,
    animateGuiExecutionAuthorized: false,
    evidencePromotionAuthorized: false,
    humanTimingAuthorized: false,
    implementationAuthorized: false,
    namedOperatorAssigned: false,
    originalRuntimeExecutionAuthorized: false,
    procurementOrPaymentAuthorized: false,
    publicationAuthorized: false,
    rendererSelectionAuthorized: false,
    runtimeExecutionAuthorized: false,
    spendAuthorized: false,
  };
}

function acceptanceEffects() {
  return {
    acceptanceNeutral: true,
    audioAccepted: false,
    authoritativeOriginalRuntime: false,
    currentJavaScriptCandidate: false,
    fidelityAccepted: false,
    fullFrameComparisonAccepted: false,
    humanVisualAccepted: false,
    independentEngineeringAccepted: false,
    ownerAccepted: false,
    published: false,
    rmseAccepted: false,
    strictComplete: false,
  };
}

function implementationEffects() {
  return {
    behaviorImplementationComplete: false,
    implementationAuthorized: false,
    implementationStarted: false,
    rendererSelected: false,
    routeDeclared: false,
  };
}

function evidenceEffects() {
  return {
    authoritativeBaselineCreated: false,
    evidencePromoted: false,
    fullFrameComparisonCreated: false,
    runtimeEvidenceCreated: false,
  };
}

export function g5L5PostM1RiskSuccessorPath(animationId) {
  invariant(
    SAFE_ID.test(animationId || "") &&
      G5_L5_POST_M1_RISK_MEMBER_IDS.includes(animationId),
    "invalid or unmanaged G5 L5 risk-calibration member",
  );
  return `migrations/${animationId}/audit/machine/${MEMBER_OUTPUT_NAME}`;
}

export function validateG5L5PostM1RiskSuccessor(document, member) {
  const id = document?.member?.animationId || "unknown";
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType ===
        "g5-l5-post-m1-risk-calibration-successor" &&
      document.state === G5_L5_POST_M1_RISK_STATE &&
      document.release?.releaseId === G5_L5_POST_M1_RISK_RELEASE_ID &&
      document.release.pageCount === 56 &&
      document.release.shellCount === 1 &&
      document.release.memberCount === 57 &&
      document.member?.animationId === member.animationId &&
      document.member.assetId === member.assetId &&
      document.member.ordinal === member.ordinal,
    `${id}: post-M1 risk successor identity drifted`,
  );
  invariant(
    document.generatedBy?.path === GENERATOR_PATH &&
      document.generatedBy.version === GENERATOR_VERSION &&
      document.generatedBy.deterministic === true &&
      SHA256.test(document.generatedBy.sha256 || ""),
    `${id}: post-M1 risk generator binding drifted`,
  );
  invariant(
    document.calibration?.selectedMemberCount === 8 &&
      document.calibration.workStudyTargetCount === 4 &&
      document.calibration.intendedAxes?.length === 4,
    `${id}: calibration selection drifted`,
  );
  invariant(
    document.historicalRiskCalibration?.bindingMode ===
      "immutable-historical-read-only" &&
      document.historicalRiskCalibration.successorOnly === true &&
      document.historicalRiskCalibration.historicalFilesModified === false &&
      document.historicalRiskCalibration.json?.path ===
        HISTORICAL_RISK_JSON &&
      document.historicalRiskCalibration.json.bytes ===
        HISTORICAL_RISK_JSON_BYTES &&
      document.historicalRiskCalibration.json.sha256 ===
        HISTORICAL_RISK_JSON_SHA256 &&
      document.historicalRiskCalibration.markdown?.path ===
        HISTORICAL_RISK_MARKDOWN &&
      document.historicalRiskCalibration.markdown.bytes ===
        HISTORICAL_RISK_MARKDOWN_BYTES &&
      document.historicalRiskCalibration.markdown.sha256 ===
        HISTORICAL_RISK_MARKDOWN_SHA256,
    `${id}: historical risk report was not preserved as immutable input`,
  );
  allFalse(document.authority, FALSE_AUTHORITY_KEYS, `${id}: authority`);
  invariant(
    document.authority.machineOnlyStaticSuccessorAuthorized === true,
    `${id}: bounded static successor authority is missing`,
  );
  const isWorkStudy = G5_L5_WORK_STUDY_MEMBER_IDS.includes(
    member.animationId,
  );
  invariant(
    document.humanWorkStudy?.selected === isWorkStudy &&
      document.humanWorkStudy.preparationBound === isWorkStudy &&
      (isWorkStudy
        ? stableJson(document.humanWorkStudy.preparation) ===
          stableJson(document.sourceBindings.workStudyPreparation)
        : document.humanWorkStudy.preparation === null) &&
      document.humanWorkStudy.assignedPerson === null &&
      document.humanWorkStudy.sessionId === null &&
      document.humanWorkStudy.startedAt === null &&
      document.humanWorkStudy.finishedAt === null &&
      document.humanWorkStudy.actualMinutes === null &&
      document.humanWorkStudy.actualTotalMinutes === null &&
      document.humanWorkStudy.measuredBy === null &&
      document.humanWorkStudy.measurementReceipt === null &&
      document.humanWorkStudy.completed === false,
    `${id}: work-study selection contains a person, session, timing, or completion`,
  );
  invariant(
    document.executionGate?.runnable === false &&
      document.executionGate.commands?.length === 0 &&
      document.executionGate.runtimeSessionsExecuted === 0 &&
      document.executionGate.authoritativeRuntimeEvidenceCount === 0,
    `${id}: successor became runnable or recorded runtime execution`,
  );
  invariant(
    document.staffingAndSession?.primaryPerson === null &&
      document.staffingAndSession.backupPerson === null &&
      document.staffingAndSession.operator === null &&
      document.staffingAndSession.sessionId === null &&
      document.staffingAndSession.assignmentReceipt === null &&
      document.staffingAndSession.sessionAuthorizationReceipt === null &&
      document.budgetAndProcurement?.personnelRateCeilingUsdPerHour === null &&
      document.budgetAndProcurement.totalBudgetEnvelopeUsd === null &&
      document.budgetAndProcurement.procurementPaymentCycle === null &&
      document.budgetAndProcurement.budgetApproved === false &&
      document.budgetAndProcurement.spendAuthorized === false &&
      document.budgetAndProcurement.procurementOrPaymentAuthorized === false,
    `${id}: successor invented staffing, session, budget, spend, or procurement`,
  );
  invariant(
    document.currentPostM1Snapshot?.migrationStatus === "preserved" &&
      document.currentPostM1Snapshot.m1StaticReconciliationApplied === true &&
      document.currentPostM1Snapshot.scenarioInventoryStatus ===
        "static-exhaustive-runtime-unverified" &&
      document.currentPostM1Snapshot.frameDomainDispositionStatus ===
        "structurally-enumerated-dispositions-unresolved" &&
      document.currentPostM1Snapshot
        .structurallyReachableChildTimelineCount > 0 &&
      document.currentPostM1Snapshot
        .evidenceBoundCompositeFrameDomainCount >= 0 &&
      document.currentPostM1Snapshot.unresolvedFrameDomainCount > 0 &&
      document.currentPostM1Snapshot.excludedNotProvenTimelineCount >= 0 &&
      document.currentPostM1Snapshot
        .evidenceBoundCompositeFrameDomainCount +
          document.currentPostM1Snapshot.unresolvedFrameDomainCount ===
        document.currentPostM1Snapshot
          .structurallyReachableChildTimelineCount &&
      document.currentPostM1Snapshot.coverageRequirementCount === 2 &&
      document.currentPostM1Snapshot.pendingCoverageRequirementCount === 2 &&
      document.currentPostM1Snapshot.strictReadinessState ===
        G5_L5_STATIC_STRICT_READINESS_STATE &&
      document.currentPostM1Snapshot.rendererSelected === false &&
      document.currentPostM1Snapshot.runtimeComplete === false &&
      document.currentPostM1Snapshot.implementationComplete === false &&
      document.currentPostM1Snapshot.acceptanceComplete === false &&
      document.currentPostM1Snapshot.strictComplete === false &&
      document.currentPostM1Snapshot.published === false,
    `${id}: current post-M1 snapshot was promoted`,
  );
  allFalse(
    document.implementationEffects,
    Object.keys(implementationEffects()),
    `${id}: implementation effects`,
  );
  allFalse(
    document.evidenceEffects,
    Object.keys(evidenceEffects()),
    `${id}: evidence effects`,
  );
  invariant(
    document.acceptanceEffects?.acceptanceNeutral === true,
    `${id}: successor must remain acceptance-neutral`,
  );
  allFalse(
    document.acceptanceEffects,
    FALSE_ACCEPTANCE_KEYS,
    `${id}: acceptance effects`,
  );
  invariant(
    document.publicationEffects?.publicationAuthorized === false &&
      document.publicationEffects.published === false &&
      document.publicationEffects.releaseLedgerChanged === false,
    `${id}: publication effects drifted`,
  );
  const expectedBindingKeys = [
    "calibrationCatalog",
    "coverageV2",
    "currentMigration",
    "frameDomainDisposition",
    "historicalRiskJson",
    "historicalRiskMarkdown",
    "lessonReleaseCatalog",
    "m1StaticReconciliationReceipt",
    "scenarioInventory",
    "staticDispositionEvidence",
    "strictReadiness",
    ...(isWorkStudy ? ["workStudyPreparation"] : []),
  ];
  invariant(
    Object.keys(document.sourceBindings).sort().join("\0") ===
      expectedBindingKeys.sort().join("\0") &&
      Object.values(document.sourceBindings).every(
        (binding) =>
          binding === null ||
          (typeof binding.path === "string" &&
            Number.isSafeInteger(binding.bytes) &&
            binding.bytes > 0 &&
            SHA256.test(binding.sha256 || "")),
      ),
    `${id}: source binding set drifted`,
  );
  invariant(
    (document.currentPostM1Snapshot
      .evidenceBoundCompositeFrameDomainCount > 0) ===
      (document.sourceBindings.staticDispositionEvidence !== null),
    `${id}: static proof binding does not match composite disposition count`,
  );
  invariant(
    document.artifactFingerprintSha256 ===
      fingerprintWithout(document, "artifactFingerprintSha256"),
    `${id}: successor fingerprint is invalid`,
  );
  return true;
}

export function validateG5L5PostM1RiskReadinessReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l5-post-m1-risk-calibration-readiness" &&
      report.state === G5_L5_POST_M1_RISK_STATE &&
      report.release?.releaseId === G5_L5_POST_M1_RISK_RELEASE_ID &&
      report.release.pageCount === 56 &&
      report.release.shellCount === 1 &&
      report.release.memberCount === 57 &&
      report.members?.length === 8 &&
      JSON.stringify(report.members.map(({animationId}) => animationId)) ===
        JSON.stringify(G5_L5_POST_M1_RISK_MEMBER_IDS),
    "G5 L5 post-M1 risk readiness identity or member set drifted",
  );
  invariant(
    report.generatedBy?.path === GENERATOR_PATH &&
      report.generatedBy.version === GENERATOR_VERSION &&
      report.generatedBy.deterministic === true &&
      Number.isSafeInteger(report.generatedBy.bytes) &&
      report.generatedBy.bytes > 0 &&
      SHA256.test(report.generatedBy.sha256 || ""),
    "G5 L5 post-M1 risk report generator binding drifted",
  );
  invariant(
    report.summary?.selectedMemberCount === 8 &&
      report.summary.workStudyTargetCount === 4 &&
      report.summary.workStudyPreparationBoundCount === 4 &&
      report.summary.completeMemberCount === 0 &&
      report.summary.rendererSelectedCount === 0 &&
      report.summary.runtimeCompleteCount === 0 &&
      report.summary.implementationCompleteCount === 0 &&
      report.summary.acceptanceCompleteCount === 0 &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.publishedCount === 0 &&
      report.summary.runnableMemberCount === 0 &&
      report.summary.commandCount === 0 &&
      report.summary.assignedPersonCount === 0 &&
      report.summary.actualTimeValueCount === 0 &&
      report.summary.actualMinutesTotal === null &&
      report.summary.runtimeSessionCount === 0 &&
      report.summary.structurallyReachableChildTimelineCount === 449 &&
      report.summary.evidenceBoundCompositeFrameDomainCount === 352 &&
      report.summary.unresolvedFrameDomainCount === 97 &&
      report.summary.excludedNotProvenTimelineCount === 113 &&
      report.summary.evidenceBoundCompositeFrameDomainCount +
          report.summary.unresolvedFrameDomainCount ===
        report.summary.structurallyReachableChildTimelineCount &&
      report.members.every(
        ({readiness}) =>
          readiness.evidenceBoundCompositeFrameDomainCount +
              readiness.unresolvedFrameDomainCount ===
            readiness.structurallyReachableChildTimelineCount,
      ),
    "G5 L5 post-M1 risk summary invented completion, execution, people, or time",
  );
  allFalse(report.authority, FALSE_AUTHORITY_KEYS, "report authority");
  invariant(
    report.authority.machineOnlyStaticSuccessorAuthorized === true &&
      report.executionGate?.runnable === false &&
      report.executionGate.commands?.length === 0 &&
      report.historicalRiskCalibration?.bindingMode ===
        "immutable-historical-read-only" &&
      report.historicalRiskCalibration.historicalFilesModified === false &&
      report.historicalRiskCalibration.json?.path === HISTORICAL_RISK_JSON &&
      report.historicalRiskCalibration.json.bytes ===
        HISTORICAL_RISK_JSON_BYTES &&
      report.historicalRiskCalibration.json.sha256 ===
        HISTORICAL_RISK_JSON_SHA256 &&
      report.historicalRiskCalibration.markdown?.path ===
        HISTORICAL_RISK_MARKDOWN &&
      report.historicalRiskCalibration.markdown.bytes ===
        HISTORICAL_RISK_MARKDOWN_BYTES &&
      report.historicalRiskCalibration.markdown.sha256 ===
        HISTORICAL_RISK_MARKDOWN_SHA256,
    "G5 L5 post-M1 report became runnable or lost historical immutability",
  );
  invariant(
    report.staffingAndSession?.primaryPerson === null &&
      report.staffingAndSession.backupPerson === null &&
      report.staffingAndSession.operator === null &&
      report.staffingAndSession.sessionId === null &&
      report.staffingAndSession.assignmentReceipt === null &&
      report.budgetAndProcurement?.personnelRateCeilingUsdPerHour === null &&
      report.budgetAndProcurement.totalBudgetEnvelopeUsd === null &&
      report.budgetAndProcurement.procurementPaymentCycle === null &&
      report.budgetAndProcurement.budgetApproved === false &&
      report.budgetAndProcurement.spendAuthorized === false &&
      report.budgetAndProcurement.procurementOrPaymentAuthorized === false,
    "G5 L5 post-M1 report invented staffing, sessions, budget, or procurement",
  );
  allFalse(
    report.implementationEffects,
    Object.keys(implementationEffects()),
    "report implementation effects",
  );
  allFalse(
    report.evidenceEffects,
    Object.keys(evidenceEffects()),
    "report evidence effects",
  );
  invariant(
    report.acceptanceEffects?.acceptanceNeutral === true,
    "G5 L5 post-M1 report must remain acceptance-neutral",
  );
  allFalse(
    report.acceptanceEffects,
    FALSE_ACCEPTANCE_KEYS,
    "report acceptance effects",
  );
  invariant(
    report.publicationEffects?.publicationAuthorized === false &&
      report.publicationEffects.published === false &&
      report.publicationEffects.releaseLedgerChanged === false,
    "G5 L5 post-M1 report publication boundary drifted",
  );
  invariant(
    report.reportFingerprintSha256 ===
      fingerprintWithout(report, "reportFingerprintSha256"),
    "G5 L5 post-M1 report fingerprint is invalid",
  );
  return true;
}

function memberDocument({
  globals,
  member,
  calibrationMember,
  historicalItem,
  records,
  manifest,
  scenario,
  disposition,
  coverage,
  strict,
  workStudyPreparation,
  frameDomainFacts,
}) {
  const isWorkStudy = Boolean(workStudyPreparation);
  const sourceBindings = {
    lessonReleaseCatalog: descriptor(globals.release),
    calibrationCatalog: descriptor(globals.calibration),
    historicalRiskJson: descriptor(globals.historicalRiskJson),
    historicalRiskMarkdown: descriptor(globals.historicalRiskMarkdown),
    currentMigration: descriptor(records.manifest),
    m1StaticReconciliationReceipt: descriptor(records.staticReceipt),
    scenarioInventory: descriptor(records.scenario),
    frameDomainDisposition: descriptor(records.disposition),
    coverageV2: descriptor(records.coverage),
    strictReadiness: descriptor(records.strict),
    staticDispositionEvidence:
      records.staticEvidence ? descriptor(records.staticEvidence) : null,
    ...(isWorkStudy
      ? {workStudyPreparation: descriptor(records.workStudyPreparation)}
      : {}),
  };
  const document = {
    schemaVersion: 1,
    artifactType: "g5-l5-post-m1-risk-calibration-successor",
    generatedBy: {
      path: GENERATOR_PATH,
      version: GENERATOR_VERSION,
      bytes: globals.generator.bytes,
      sha256: globals.generator.sha256,
      deterministic: true,
    },
    state: G5_L5_POST_M1_RISK_STATE,
    release: {
      releaseId: G5_L5_POST_M1_RISK_RELEASE_ID,
      titleDisplay: "Add & Subtract Negative Numbers",
      pageCount: 56,
      shellCount: 1,
      memberCount: 57,
      publicationMode: "atomic",
      releaseFingerprintSha256: globals.releaseFingerprint,
    },
    member: {
      animationId: member.animationId,
      assetId: member.assetId,
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
      sourceSwfSha256: member.source.sha256,
    },
    calibration: {
      calibrationSetFingerprintSha256: globals.calibrationFingerprint,
      selectedMemberCount: 8,
      workStudyTargetCount: 4,
      intendedAxes: calibrationMember.intendedAxes,
    },
    historicalRiskCalibration: {
      bindingMode: "immutable-historical-read-only",
      successorOnly: true,
      historicalFilesModified: false,
      json: descriptor(globals.historicalRiskJson),
      markdown: descriptor(globals.historicalRiskMarkdown),
      historicalItem: {
        ordinal: historicalItem.ordinal,
        sourceModel: historicalItem.staticFacts.sourceModel,
        rootFrameCount: historicalItem.staticFacts.rootFrameCount,
        nestedDefinitionCount:
          historicalItem.staticFacts.nestedDefinitionCount,
        unresolvedReachabilityCount:
          historicalItem.staticFacts.unresolvedReachabilityCount,
        workStudySelected: Boolean(historicalItem.workStudy),
      },
    },
    authority: authorityBoundary(),
    humanWorkStudy: {
      selected: isWorkStudy,
      preparationBound: isWorkStudy,
      preparation: isWorkStudy
        ? sourceBindings.workStudyPreparation
        : null,
      assignedPerson: null,
      sessionId: null,
      startedAt: null,
      finishedAt: null,
      actualMinutes: null,
      actualTotalMinutes: null,
      measuredBy: null,
      measurementReceipt: null,
      completed: false,
    },
    executionGate: {
      runnable: false,
      commands: [],
      runtimeSessionsExecuted: 0,
      authoritativeRuntimeEvidenceCount: 0,
    },
    staffingAndSession: {
      primaryPerson: null,
      backupPerson: null,
      operator: null,
      sessionId: null,
      assignmentReceipt: null,
      sessionAuthorizationReceipt: null,
    },
    budgetAndProcurement: {
      currency: "USD",
      personnelRateCeilingUsdPerHour: null,
      totalBudgetEnvelopeUsd: null,
      procurementPaymentCycle: null,
      budgetApproved: false,
      spendAuthorized: false,
      procurementOrPaymentAuthorized: false,
    },
    currentPostM1Snapshot: {
      migrationStatus: manifest.status,
      rootFrameCount: manifest.runtime.frameCount,
      m1StaticReconciliationApplied: true,
      scenarioInventoryStatus: scenario.inventoryStatus,
      frameDomainDispositionStatus: disposition.status,
      structurallyReachableChildTimelineCount:
        frameDomainFacts.reachableChildTimelineCount,
      evidenceBoundCompositeFrameDomainCount:
        frameDomainFacts.evidenceBoundCompositeChildCount,
      unresolvedFrameDomainCount: frameDomainFacts.unresolvedChildCount,
      excludedNotProvenTimelineCount:
        frameDomainFacts.excludedNotProvenTimelineCount,
      coverageRequirementCount: coverage.requirements.length,
      pendingCoverageRequirementCount: coverage.requirements.filter(
        ({status}) => status === "pending",
      ).length,
      strictReadinessState: strict.state,
      rendererSelected: false,
      runtimeComplete: false,
      implementationComplete: false,
      acceptanceComplete: false,
      strictComplete: false,
      published: false,
    },
    sourceBindings,
    implementationEffects: implementationEffects(),
    evidenceEffects: evidenceEffects(),
    acceptanceEffects: acceptanceEffects(),
    publicationEffects: {
      publicationAuthorized: false,
      published: false,
      releaseLedgerChanged: false,
    },
    strictAcceptanceEffect:
      "none; this post-M1 static successor preserves historical risk evidence and creates no runtime, renderer, implementation, review, acceptance, strict-completion, or publication effect",
  };
  return withPostM1RiskArtifactFingerprint(document);
}

function readinessReport(globals, members) {
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-post-m1-risk-calibration-readiness",
    generatedBy: {
      path: GENERATOR_PATH,
      version: GENERATOR_VERSION,
      bytes: globals.generator.bytes,
      sha256: globals.generator.sha256,
      deterministic: true,
    },
    state: G5_L5_POST_M1_RISK_STATE,
    release: {
      releaseId: G5_L5_POST_M1_RISK_RELEASE_ID,
      titleDisplay: "Add & Subtract Negative Numbers",
      pageCount: 56,
      shellCount: 1,
      memberCount: 57,
      publicationMode: "atomic",
      releaseFingerprintSha256: globals.releaseFingerprint,
    },
    calibration: {
      calibrationSetFingerprintSha256: globals.calibrationFingerprint,
      memberAnimationIds: [...G5_L5_POST_M1_RISK_MEMBER_IDS],
      workStudyMemberAnimationIds: [...G5_L5_WORK_STUDY_MEMBER_IDS],
      requiredPhases: [...G5_L5_WORK_STUDY_PHASES],
      measurementRule: MEASUREMENT_RULE,
    },
    historicalRiskCalibration: {
      bindingMode: "immutable-historical-read-only",
      successorOnly: true,
      historicalFilesModified: false,
      json: descriptor(globals.historicalRiskJson),
      markdown: descriptor(globals.historicalRiskMarkdown),
    },
    authority: authorityBoundary(),
    summary: {
      selectedMemberCount: 8,
      workStudyTargetCount: 4,
      workStudyPreparationBoundCount: 4,
      completeMemberCount: 0,
      rendererSelectedCount: 0,
      runtimeCompleteCount: 0,
      implementationCompleteCount: 0,
      acceptanceCompleteCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      runnableMemberCount: 0,
      commandCount: 0,
      assignedPersonCount: 0,
      actualTimeValueCount: 0,
      actualMinutesTotal: null,
      runtimeSessionCount: 0,
      structurallyReachableChildTimelineCount: members.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.reachableChildTimelineCount,
        0,
      ),
      evidenceBoundCompositeFrameDomainCount: members.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.evidenceBoundCompositeChildCount,
        0,
      ),
      unresolvedFrameDomainCount: members.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.unresolvedChildCount,
        0,
      ),
      excludedNotProvenTimelineCount: members.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.excludedNotProvenTimelineCount,
        0,
      ),
    },
    sourceBindings: {
      lessonReleaseCatalog: descriptor(globals.release),
      calibrationCatalog: descriptor(globals.calibration),
      historicalRiskJson: descriptor(globals.historicalRiskJson),
      historicalRiskMarkdown: descriptor(globals.historicalRiskMarkdown),
    },
    members: members.map(({member, document, rendered}) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      intendedAxes: document.calibration.intendedAxes,
      workStudySelected: document.humanWorkStudy.selected,
      workStudyPreparationBound:
        document.humanWorkStudy.preparationBound,
      successor: {
        path: g5L5PostM1RiskSuccessorPath(member.animationId),
        bytes: Buffer.byteLength(rendered),
        sha256: sha256(Buffer.from(rendered)),
      },
      readiness: {
        runnable: false,
        commands: [],
        structurallyReachableChildTimelineCount:
          document.currentPostM1Snapshot
            .structurallyReachableChildTimelineCount,
        evidenceBoundCompositeFrameDomainCount:
          document.currentPostM1Snapshot
            .evidenceBoundCompositeFrameDomainCount,
        unresolvedFrameDomainCount:
          document.currentPostM1Snapshot.unresolvedFrameDomainCount,
        excludedNotProvenTimelineCount:
          document.currentPostM1Snapshot.excludedNotProvenTimelineCount,
        pendingCoverageRequirementCount:
          document.currentPostM1Snapshot.pendingCoverageRequirementCount,
        rendererSelected: false,
        runtimeComplete: false,
        implementationComplete: false,
        acceptanceComplete: false,
        strictComplete: false,
        published: false,
      },
    })),
    executionGate: {runnable: false, commands: []},
    staffingAndSession: {
      primaryPerson: null,
      backupPerson: null,
      operator: null,
      sessionId: null,
      assignmentReceipt: null,
    },
    budgetAndProcurement: {
      currency: "USD",
      personnelRateCeilingUsdPerHour: null,
      totalBudgetEnvelopeUsd: null,
      procurementPaymentCycle: null,
      budgetApproved: false,
      spendAuthorized: false,
      procurementOrPaymentAuthorized: false,
    },
    implementationEffects: implementationEffects(),
    evidenceEffects: evidenceEffects(),
    acceptanceEffects: acceptanceEffects(),
    publicationEffects: {
      publicationAuthorized: false,
      published: false,
      releaseLedgerChanged: false,
    },
    blockers: [
      "The historical risk-calibration JSON and Markdown remain immutable read-only inputs; this successor does not rewrite either file.",
      "All eight selected members retain unresolved runtime/frame-domain evidence and two pending bilingual root-coverage requirements.",
      "The four work-study members bind non-runnable preparation artifacts, but contain no named person, session, actual timing, budget, spend, or procurement authority.",
      "Renderer selection, runtime execution, implementation, evidence promotion, review, acceptance, strict completion, and publication remain separate blocked gates.",
    ],
  };
  return withPostM1RiskReportFingerprint(base);
}

export function renderG5L5PostM1RiskMarkdown(report) {
  return `<!-- generated-by: ${GENERATOR_PATH} -->\n` +
    `# G5 L5 post-M1 risk-calibration readiness\n\n` +
    `> Static, acceptance-neutral successor. The historical risk-calibration report remains an immutable read-only input.\n\n` +
    `## Outcome\n\n` +
    `- Release scope: **56 pages + Shell = 57 members**.\n` +
    `- Calibration members / work-study targets / complete members: **8 / 4 / 0**.\n` +
    `- Work-study preparation bindings: **4/4**; named people / actual timing values / runtime sessions: **0 / 0 / 0**.\n` +
    `- Selected reachable child domains / exact proof-bound composites / unresolved / excluded-not-proven: **${report.summary.structurallyReachableChildTimelineCount} / ${report.summary.evidenceBoundCompositeFrameDomainCount} / ${report.summary.unresolvedFrameDomainCount} / ${report.summary.excludedNotProvenTimelineCount}**.\n` +
    `- Renderer / runtime / implementation / acceptance / strict / publication complete counts: **0 / 0 / 0 / 0 / 0 / 0**.\n` +
    `- Runnable members / commands: **0 / 0**.\n\n` +
    `## Members\n\n` +
    report.members.map((entry) =>
      `- \`${entry.animationId}\`: work-study=${entry.workStudySelected}; reachable / exact proof-bound composite / unresolved / excluded-not-proven frame domains=${entry.readiness.structurallyReachableChildTimelineCount} / ${entry.readiness.evidenceBoundCompositeFrameDomainCount} / ${entry.readiness.unresolvedFrameDomainCount} / ${entry.readiness.excludedNotProvenTimelineCount}; pending EN/ES coverage=${entry.readiness.pendingCoverageRequirementCount}.`,
    ).join("\n") +
    `\n\n## Boundary\n\n` +
    report.blockers.map((value) => `- ${value}`).join("\n") +
    `\n`;
}

async function loadGlobals(root) {
  const [
    generator,
    release,
    calibration,
    historicalRiskJson,
    historicalRiskMarkdown,
  ] = await Promise.all([
    readRecord(root, GENERATOR_PATH),
    readRecord(root, RELEASE_PATH, {json: true}),
    readRecord(root, CALIBRATION_PATH, {json: true}),
    readRecord(root, HISTORICAL_RISK_JSON, {json: true}),
    readRecord(root, HISTORICAL_RISK_MARKDOWN),
  ]);
  const selectedRelease = selectRelease(release.document);
  const selectedCalibration = selectCalibration(calibration.document);
  invariant(
    historicalRiskJson.bytes === HISTORICAL_RISK_JSON_BYTES &&
      historicalRiskJson.sha256 === HISTORICAL_RISK_JSON_SHA256 &&
      historicalRiskMarkdown.bytes === HISTORICAL_RISK_MARKDOWN_BYTES &&
      historicalRiskMarkdown.sha256 === HISTORICAL_RISK_MARKDOWN_SHA256,
    "historical G5 L5 risk report bytes changed; successor refuses to rewrite or rebase immutable history",
  );
  validateHistoricalRisk(
    historicalRiskJson.document,
    selectedCalibration.calibration,
    calibration,
  );
  const members = G5_L5_POST_M1_RISK_MEMBER_IDS.map((animationId) => {
    const matches = selectedRelease.release.members.filter(
      (member) => member.animationId === animationId,
    );
    invariant(matches.length === 1, `${animationId}: release member missing`);
    return matches[0];
  });
  return {
    generator,
    release,
    releaseDocument: selectedRelease.release,
    releaseFingerprint: selectedRelease.fingerprint,
    calibration,
    calibrationDocument: selectedCalibration.calibration,
    calibrationFingerprint: selectedCalibration.fingerprint,
    historicalRiskJson,
    historicalRiskMarkdown,
    members,
  };
}

async function buildMember(
  root,
  globals,
  member,
  resolveStaticCompositeProof,
) {
  const workspace = `migrations/${member.animationId}`;
  const paths = {
    manifest: `${workspace}/migration.json`,
    staticReceipt: g5L5M1StaticReconciliationReceiptPath(member.animationId),
    scenario: `${workspace}/audit/scenario-inventory.json`,
    disposition: `${workspace}/audit/frame-domain-disposition.json`,
    coverage: `${workspace}/evidence/full-frame-coverage.json`,
    strict: g5L5StaticStrictReadinessPath(member.animationId),
  };
  const isWorkStudy = G5_L5_WORK_STUDY_MEMBER_IDS.includes(
    member.animationId,
  );
  const [
    manifest,
    staticReceipt,
    scenario,
    disposition,
    coverage,
    strict,
    staticReader,
    strictReader,
    workStudyPreparation,
  ] = await Promise.all([
    readRecord(root, paths.manifest, {json: true}),
    readRecord(root, paths.staticReceipt, {json: true}),
    readRecord(root, paths.scenario, {json: true}),
    readRecord(root, paths.disposition, {json: true}),
    readRecord(root, paths.coverage, {json: true}),
    readRecord(root, paths.strict, {json: true}),
    readG5L5M1StaticReconciliationReceipt({
      root,
      animationId: member.animationId,
      member,
    }),
    readG5L5StaticStrictReadiness({
      root,
      animationId: member.animationId,
      member,
    }),
    isWorkStudy
      ? readRecord(root, g5L5WorkStudyPreparationPath(member.animationId), {
        json: true,
      })
      : null,
  ]);
  invariant(
    stableJson(staticReceipt.document) === stableJson(staticReader.receipt),
    `${member.animationId}: M1 reader and current receipt differ`,
  );
  invariant(
    stableJson(strict.document) === stableJson(strictReader.document),
    `${member.animationId}: strict reader and current bytes differ`,
  );
  const postimages = await Promise.all(
    Object.values(staticReader.postOutputs).map(async (binding) => {
      const record = await readRecord(root, binding.path);
      invariant(
        sameDescriptor(binding, record),
        `${member.animationId}: current M1 postimage drifted`,
      );
      return record;
    }),
  );
  validateManifest(manifest.document, member);
  validateScenarioInventory(scenario.document);
  invariant(
    scenario.document.animationId === member.animationId &&
      scenario.document.inventoryStatus ===
        "static-exhaustive-runtime-unverified" &&
      scenario.document.migrationStatusChanged === false &&
      scenario.document.authoritativeRuntimeEvidence?.length === 0 &&
      scenario.document.strictAcceptanceEffect.startsWith("none;"),
    `${member.animationId}: scenario inventory crossed runtime authority`,
  );
  const frameDomainFacts =
    await validateG5L5ProofBoundFrameDomainDisposition({
      disposition: disposition.document,
      member,
      scenarioSha256: scenario.sha256,
      resolveStaticCompositeProof,
    });
  let staticEvidence = null;
  if (frameDomainFacts.staticEvidenceBinding) {
    staticEvidence = await readRecord(
      root,
      frameDomainFacts.staticEvidenceBinding.path,
    );
    invariant(
      staticEvidence.bytes === frameDomainFacts.staticEvidenceBinding.bytes &&
        staticEvidence.sha256 ===
          frameDomainFacts.staticEvidenceBinding.sha256,
      `${member.animationId}: static composite evidence bytes drifted after proof validation`,
    );
  }
  validateCoverage(
    coverage.document,
    member,
    manifest.document.runtime.frameCount,
  );
  invariant(
    strict.document.state === G5_L5_STATIC_STRICT_READINESS_STATE &&
      strict.document.acceptance?.strictMigrationComplete === false &&
      strict.document.acceptance.published === false &&
      strict.document.implementationReadiness?.rendererSelected === false &&
      strict.document.implementationReadiness.implementationStarted === false,
    `${member.animationId}: strict-readiness was promoted`,
  );
  if (workStudyPreparation) {
    validateG5L5WorkStudyPreparation(
      workStudyPreparation.document,
      member,
    );
  }
  const calibrationMember = globals.calibrationDocument.members.find(
    ({animationId}) => animationId === member.animationId,
  );
  const historicalItem = globals.historicalRiskJson.document.items.find(
    ({animationId}) => animationId === member.animationId,
  );
  const records = {
    manifest,
    staticReceipt,
    scenario,
    disposition,
    coverage,
    strict,
    workStudyPreparation,
    ...(staticEvidence ? {staticEvidence} : {}),
  };
  const document = memberDocument({
    globals,
    member,
    calibrationMember,
    historicalItem,
    records,
    manifest: manifest.document,
    scenario: scenario.document,
    disposition: disposition.document,
    coverage: coverage.document,
    strict: strict.document,
    workStudyPreparation: workStudyPreparation?.document ?? null,
    frameDomainFacts,
  });
  validateG5L5PostM1RiskSuccessor(document, member);
  return {
    id: member.animationId,
    member,
    document,
    rendered: stableJson(document),
    frameDomainFacts,
    inputRecords: [
      globals.generator,
      globals.release,
      globals.calibration,
      globals.historicalRiskJson,
      globals.historicalRiskMarkdown,
      manifest,
      staticReceipt,
      scenario,
      disposition,
      coverage,
      strict,
      ...(staticEvidence ? [staticEvidence] : []),
      ...(workStudyPreparation ? [workStudyPreparation] : []),
      ...postimages,
    ],
  };
}

function managedOutputs() {
  return new Set([
    ...G5_L5_POST_M1_RISK_MEMBER_IDS.map(g5L5PostM1RiskSuccessorPath),
    REPORT_JSON,
    REPORT_MARKDOWN,
  ]);
}

async function readOutputSnapshot(root, relativePath) {
  invariant(
    managedOutputs().has(relativePath),
    `refusing unmanaged output: ${relativePath}`,
  );
  const absolutePath = resolveProjectPath(root, relativePath, "output");
  await assertRealAncestors(root, absolutePath, `output ${relativePath}`);
  const information = await lstatOrNull(absolutePath);
  if (!information) {
    return {
      path: relativePath,
      absolutePath,
      parent: path.dirname(absolutePath),
      exists: false,
      contents: null,
      bytes: 0,
      sha256: "",
      stat: null,
    };
  }
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n &&
      Number(information.mode & 0o777n) === 0o644,
    `output must be one ordinary non-linked 0644 file: ${relativePath}`,
  );
  const record = await readRecord(root, relativePath);
  return {
    ...record,
    parent: path.dirname(absolutePath),
    exists: true,
  };
}

function outputMatches(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.bytes === right.bytes &&
        left.sha256 === right.sha256 &&
        sameIdentity(left.stat, right.stat)));
}

function assertOwnedOutput(snapshot) {
  if (!snapshot.exists) return;
  const text = snapshot.contents.toString("utf8");
  if (snapshot.path.endsWith(".md")) {
    invariant(
      text.startsWith(`<!-- generated-by: ${GENERATOR_PATH} -->\n`),
      `refusing foreign Markdown output: ${snapshot.path}`,
    );
    return;
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error(`refusing invalid existing JSON output: ${snapshot.path}`);
  }
  invariant(
    document.generatedBy?.path === GENERATOR_PATH &&
      [
        "g5-l5-post-m1-risk-calibration-successor",
        "g5-l5-post-m1-risk-calibration-readiness",
      ].includes(document.artifactType ?? document.reportType),
    `refusing output owned by another generator: ${snapshot.path}`,
  );
}

async function assertInputsUnchanged(records) {
  const unique = new Map();
  for (const record of records) {
    if (record?.absolutePath && record?.stat) {
      unique.set(record.absolutePath, record);
    }
  }
  for (const record of unique.values()) {
    const current = await lstat(record.absolutePath, {bigint: true});
    invariant(
      current.isFile() &&
        !current.isSymbolicLink() &&
        current.nlink === 1n &&
        sameIdentity(record.stat, statIdentity(current)),
      `${record.path}: input changed after preflight`,
    );
  }
}

async function writeExclusive(candidate, contents, mode = 0o644) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    mode,
  );
  try {
    await handle.writeFile(contents);
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function removeOwned(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: transaction file is not ordinary`,
  );
  invariant(
    sha256(await readFile(candidate)) === expectedSha256,
    `${candidate}: transaction bytes changed`,
  );
  await unlink(candidate);
}

async function stageOutput(item, batchId) {
  const nonce = randomBytes(10).toString("hex");
  const prefix = `.${path.basename(item.output)}.${batchId}.${nonce}`;
  const stagePath = path.join(item.snapshot.parent, `${prefix}.stage`);
  const backupPath = path.join(item.snapshot.parent, `${prefix}.backup`);
  const desiredBytes = Buffer.from(item.rendered);
  const desiredSha256 = sha256(desiredBytes);
  await writeExclusive(stagePath, desiredBytes);
  if (item.snapshot.exists) {
    await writeExclusive(
      backupPath,
      item.snapshot.contents,
      Number.parseInt(item.snapshot.stat.mode, 10) & 0o777,
    );
  }
  return {
    ...item,
    stagePath,
    backupPath,
    desiredSha256,
    committed: false,
  };
}

async function cleanup(transaction) {
  await removeOwned(transaction.stagePath, transaction.desiredSha256);
  if (transaction.snapshot.exists) {
    await removeOwned(transaction.backupPath, transaction.snapshot.sha256);
  }
}

async function rollback(transactions, originalError) {
  const errors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        invariant(
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.desiredSha256,
          `${transaction.output}: committed output changed before rollback`,
        );
        if (transaction.snapshot.exists) {
          await rename(
            transaction.backupPath,
            transaction.snapshot.absolutePath,
          );
        } else {
          await unlink(transaction.snapshot.absolutePath);
        }
      }
      await cleanup(transaction);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw new AggregateError(
      [originalError, ...errors],
      `post-M1 risk transaction failed with ${errors.length} rollback error(s)`,
    );
  }
  throw originalError;
}

async function commitBatch(root, items, inputRecords, hooks = {}) {
  const batchId =
    `${process.pid}-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const transactions = [];
  try {
    for (const item of items) {
      const current = await readOutputSnapshot(root, item.output);
      invariant(
        outputMatches(item.snapshot, current),
        `${item.output}: output changed after preflight`,
      );
      transactions.push(await stageOutput(item, batchId));
    }
    await hooks.afterStage?.({outputs: transactions});
    await assertInputsUnchanged(inputRecords);
    for (const [index, transaction] of transactions.entries()) {
      let current = await readOutputSnapshot(root, transaction.output);
      invariant(
        outputMatches(transaction.snapshot, current),
        `${transaction.output}: output changed before commit`,
      );
      await assertInputsUnchanged(inputRecords);
      await hooks.beforeCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.snapshot.absolutePath,
      });
      current = await readOutputSnapshot(root, transaction.output);
      invariant(
        outputMatches(transaction.snapshot, current),
        `${transaction.output}: output changed during commit CAS`,
      );
      await assertInputsUnchanged(inputRecords);
      if (transaction.snapshot.exists) {
        await rename(transaction.stagePath, transaction.snapshot.absolutePath);
      } else {
        await link(transaction.stagePath, transaction.snapshot.absolutePath);
        await unlink(transaction.stagePath);
      }
      transaction.committed = true;
      const committedStat = await lstat(
        transaction.snapshot.absolutePath,
        {bigint: true},
      );
      invariant(
        committedStat.isFile() &&
          !committedStat.isSymbolicLink() &&
          committedStat.nlink === 1n &&
          Number(committedStat.mode & 0o777n) === 0o644 &&
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.desiredSha256,
        `${transaction.output}: committed bytes or 0644 mode changed`,
      );
      await hooks.afterCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.snapshot.absolutePath,
      });
    }
    await assertInputsUnchanged(inputRecords);
  } catch (error) {
    await rollback(transactions, error);
  }
  for (const transaction of transactions) await cleanup(transaction);
}

async function prepareOutputs(root, globals, resolveStaticCompositeProof) {
  const members = [];
  for (const member of globals.members) {
    members.push(
      await buildMember(
        root,
        globals,
        member,
        resolveStaticCompositeProof,
      ),
    );
  }
  const report = readinessReport(globals, members);
  validateG5L5PostM1RiskReadinessReport(report);
  const desired = [
    ...members.map((item) => ({
      id: item.id,
      output: g5L5PostM1RiskSuccessorPath(item.id),
      rendered: item.rendered,
      inputRecords: item.inputRecords,
    })),
    {
      id: "g5-l5-post-m1-risk-readiness-json",
      output: REPORT_JSON,
      rendered: stableJson(report),
      inputRecords: members.flatMap(({inputRecords}) => inputRecords),
    },
    {
      id: "g5-l5-post-m1-risk-readiness-markdown",
      output: REPORT_MARKDOWN,
      rendered: renderG5L5PostM1RiskMarkdown(report),
      inputRecords: members.flatMap(({inputRecords}) => inputRecords),
    },
  ];
  for (const item of desired) {
    item.snapshot = await readOutputSnapshot(root, item.output);
    assertOwnedOutput(item.snapshot);
  }
  return {members, report, desired};
}

export async function buildG5L5PostM1RiskCalibrationSuccessor(options = {}) {
  const root = path.resolve(options.projectRoot || defaultProjectRoot);
  const mode = options.mode || "dry-run";
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    "mode must be dry-run, apply, or check",
  );
  const globals = await loadGlobals(root);
  const resolveStaticCompositeProof =
    options.staticCompositeProofResolver ??
    createG5L5StaticCompositeProofResolver({
      projectRoot: root,
      evidenceBuilder: options.staticCompositeEvidenceBuilder,
    });
  const prepared = await prepareOutputs(
    root,
    globals,
    resolveStaticCompositeProof,
  );
  if (mode === "check") {
    for (const item of prepared.desired) {
      invariant(item.snapshot.exists, `${item.output}: output is missing`);
      invariant(
        item.snapshot.contents.toString("utf8") === item.rendered,
        `${item.output}: output is stale`,
      );
    }
  } else if (mode === "apply") {
    await commitBatch(
      root,
      prepared.desired,
      prepared.desired.flatMap(({inputRecords}) => inputRecords),
      options.transactionHooks || {},
    );
  }
  return {
    action:
      mode === "apply" ? "written" :
        mode === "check" ? "verified" :
          "planned",
    releaseId: G5_L5_POST_M1_RISK_RELEASE_ID,
    state: G5_L5_POST_M1_RISK_STATE,
    selectedMemberCount: 8,
    workStudyTargetCount: 4,
    outputCount: 10,
    outputs: prepared.desired.map(({output, rendered}) => ({
      path: output,
      bytes: Buffer.byteLength(rendered),
      sha256: sha256(Buffer.from(rendered)),
    })),
    runnable: false,
    commands: [],
    completeMemberCount: 0,
    rendererSelectedCount: 0,
    runtimeCompleteCount: 0,
    implementationCompleteCount: 0,
    acceptanceCompleteCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
    assignedPersonCount: 0,
    actualTimeValueCount: 0,
    actualMinutesTotal: null,
    structurallyReachableChildTimelineCount:
      prepared.report.summary.structurallyReachableChildTimelineCount,
    evidenceBoundCompositeFrameDomainCount:
      prepared.report.summary.evidenceBoundCompositeFrameDomainCount,
    unresolvedFrameDomainCount:
      prepared.report.summary.unresolvedFrameDomainCount,
    excludedNotProvenTimelineCount:
      prepared.report.summary.excludedNotProvenTimelineCount,
  };
}

export function parseArguments(argv) {
  const options = {help: false};
  for (const argument of argv) {
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(
        !options.mode,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      options.mode = argument.slice(2);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(
      options.mode,
      "explicitly choose one of --dry-run, --apply, or --check",
    );
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs --dry-run
  node scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs --apply
  node scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs --check

Builds eight per-member post-M1 static risk-calibration successors plus one
JSON and Markdown readiness report as a ten-output compare-and-swap batch. It
does not overwrite the historical G5 L5 risk report and grants no runtime,
renderer, implementation, evidence, review, acceptance, strict, publication,
staffing, timing, spend, or procurement authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const result =
      await buildG5L5PostM1RiskCalibrationSuccessor(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
