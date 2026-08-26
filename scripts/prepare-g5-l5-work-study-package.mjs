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
  validateG5L5M1MachineFoundationReport,
} from "./build-g5-l5-m1-machine-foundation-readiness.mjs";
import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  readG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";
import {
  G5_L5_STATIC_STRICT_READINESS_STATE,
  g5L5StaticStrictReadinessPath,
  readG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";
import {validateScenarioInventory} from "./build-course-scenario-inventories.mjs";
import {
  validatePriorReceipt,
} from "./materialize-g5-l5-pre-runtime-specification-candidates.mjs";
import {
  createG5L5StaticCompositeProofResolver,
  validateG5L5ProofBoundFrameDomainDisposition,
} from "./g5-l5-proof-bound-frame-domain-disposition.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_WORK_STUDY_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_WORK_STUDY_STATE =
  "machine-only-work-study-runtime-trace-preparation-non-runnable";
export const G5_L5_WORK_STUDY_MEMBER_IDS = Object.freeze([
  "shell-course-g05-l05-index-local",
  "course-g05-l05-rw-002",
  "course-g05-l05-in-020",
  "course-g05-l05-fq-002",
]);
export const G5_L5_WORK_STUDY_PHASES = Object.freeze([
  "source-and-authoring-audit",
  "runtime-and-trace-specification",
  "renderer-and-behavior-implementation",
  "full-frame-audio-product-and-review-preparation",
]);

const GENERATOR_PATH = "scripts/prepare-g5-l5-work-study-package.mjs";
const GENERATOR_VERSION = 1;
const RELEASE_PATH = "catalog/lesson-releases.json";
const CALIBRATION_PATH = "catalog/lesson-release-calibration-sets.json";
const M1_REPORT_PATH = "reports/g5-l5-m1-machine-foundation-readiness.json";
const REPORT_JSON_PATH =
  "reports/g5-l5-work-study-preparation-readiness.json";
const REPORT_MARKDOWN_PATH =
  "reports/g5-l5-work-study-preparation-readiness.md";
const MEMBER_OUTPUT_NAME = "g5-l5-work-study-preparation.json";
const EXPECTED_RELEASE_FINGERPRINT =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const EXPECTED_MEASUREMENT_RULE =
  "These are G5 L5 candidates only. After separate G5 L5 authorization, record actual named-human start and finish times for each phase; do not infer or inherit hours, identities, receipts, review, or acceptance.";
const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const CSV_HEADER =
  "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes";
const ACCEPTANCE_FALSE_KEYS = Object.freeze([
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
const AUTHORITY_FALSE_KEYS = Object.freeze([
  "animateGuiExecutionAuthorized",
  "evidencePromotionAuthorized",
  "humanTimingAuthorized",
  "humanWorkStudyAuthorized",
  "implementationAuthorized",
  "namedOperatorAssigned",
  "originalRuntimeExecutionAuthorized",
  "procurementOrPaymentAuthorized",
  "publicationAuthorized",
  "runtimeHostOrContainmentAuthorized",
  "runtimeTraceExecutionAuthorized",
  "spendAuthorized",
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
  const relativeParent = path.relative(root, path.dirname(absolutePath));
  invariant(
    relativeParent !== ".." &&
      !relativeParent.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeParent),
    `${label}: parent escapes project root`,
  );
  const parts = relativeParent.split(path.sep).filter(Boolean);
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

async function readHandleBytes(handle) {
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
  let descriptorAfter;
  try {
    const descriptorBefore = await handle.stat({bigint: true});
    invariant(
      sameIdentity(statIdentity(before), statIdentity(descriptorBefore)),
      `${label}: changed before stable read`,
    );
    observed = await readHandleBytes(handle);
    descriptorAfter = await handle.stat({bigint: true});
    invariant(
      sameIdentity(statIdentity(descriptorBefore), statIdentity(descriptorAfter)),
      `${label}: changed during stable read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameIdentity(statIdentity(descriptorAfter), statIdentity(after)) &&
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

function allFalse(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function exactKeys(object, expected, label) {
  invariant(
    object &&
      Object.keys(object).sort().join("\0") === [...expected].sort().join("\0"),
    `${label}: field set drifted`,
  );
}

function fingerprintWithout(document, field) {
  const projected = structuredClone(document);
  delete projected[field];
  return sha256(Buffer.from(stableJson(projected)));
}

export function withWorkStudyArtifactFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  return {
    ...projected,
    artifactFingerprintSha256: sha256(Buffer.from(stableJson(projected))),
  };
}

export function withWorkStudyReportFingerprint(document) {
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
    "G5 L5 release catalog is malformed",
  );
  const matches = catalog.releases.filter(
    ({releaseId}) => releaseId === G5_L5_WORK_STUDY_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release must be unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 57 &&
      release.members?.length === 57,
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
    ({releaseId}) => releaseId === G5_L5_WORK_STUDY_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 calibration set must be unique");
  const calibration = matches[0];
  invariant(
    JSON.stringify(calibration.humanWorkStudy?.memberAnimationIds) ===
      JSON.stringify(G5_L5_WORK_STUDY_MEMBER_IDS) &&
      JSON.stringify(calibration.humanWorkStudy?.requiredPhases) ===
      JSON.stringify(G5_L5_WORK_STUDY_PHASES) &&
      calibration.humanWorkStudy?.measurementRule ===
        EXPECTED_MEASUREMENT_RULE,
    "G5 L5 human work-study selection or measurement rule drifted",
  );
  for (const id of G5_L5_WORK_STUDY_MEMBER_IDS) {
    const matchesForMember = calibration.members.filter(
      ({animationId}) => animationId === id,
    );
    invariant(
      matchesForMember.length === 1 &&
        Array.isArray(matchesForMember[0].intendedAxes) &&
        matchesForMember[0].intendedAxes.length === 4,
      `${id}: calibration axes are missing or ambiguous`,
    );
  }
  return {
    calibration,
    fingerprint: sha256(Buffer.from(stableJson(calibration))),
  };
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
    `${member.animationId}: current migration crossed implementation or identity boundary`,
  );
}

function validateCandidateCensus(census, member, candidateReceipt) {
  invariant(
    census?.schemaVersion === 1 &&
      census.artifactType ===
        "g5-l5-swf-asset-definition-census-candidate" &&
      census.releaseId === G5_L5_WORK_STUDY_RELEASE_ID &&
      census.animationId === member.animationId &&
      census.assetId === member.assetId &&
      census.ownership?.acceptanceEvidence === false &&
      census.ownership?.canonicalFile === false &&
      census.summary?.canonicalAssetInventoryRowsAdded === 0 &&
      census.summary?.finalCanonicalAssetSpecificationComplete === false &&
      census.summary?.rendererAssetExportCount === 0 &&
      census.summary?.runtimePlacementDispositionCount === 0,
    `${member.animationId}: candidate census crossed a canonical or runtime boundary`,
  );
  allFalse(
    census.acceptanceEffects,
    Object.keys(census.acceptanceEffects || {}),
    `${member.animationId}: census acceptance`,
  );
  const markerProjection = structuredClone(census);
  delete markerProjection.artifactFingerprintSha256;
  delete markerProjection.generatedMarker;
  const expected = sha256(Buffer.from(stableJson(markerProjection)));
  invariant(
    census.artifactFingerprintSha256 === expected &&
      census.generatedMarker === `sha256:${expected}`,
    `${member.animationId}: candidate census fingerprint is invalid`,
  );
  invariant(
    candidateReceipt.outputs?.assetDefinitionCensus?.definitionCount ===
      census.summary.definitionCount,
    `${member.animationId}: census definition count differs from candidate receipt`,
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

function validateRuntimePlan(plan, coverageRecord, member, manifest) {
  invariant(
    plan?.schemaVersion === 2 &&
      plan.artifactType === "release-runtime-acquisition-plan" &&
      plan.identity?.releaseId === G5_L5_WORK_STUDY_RELEASE_ID &&
      plan.identity.animationId === member.animationId &&
      plan.identity.assetId === member.assetId &&
      plan.identity.ordinal === member.ordinal &&
      plan.namedOperatorRoleAssignment === null &&
      plan.executionGate?.state === "closed" &&
      plan.executionGate.runnable === false &&
      Object.entries(plan.executionGate)
        .filter(([key]) => !["state", "runnable"].includes(key))
        .every(([, value]) => value === false) &&
      plan.coverageV2Planning?.canonicalFileModified === false &&
      plan.coverageV2Planning.authoritativeBaselineCount === 0 &&
      plan.coverageV2Planning.candidateCaptureCount === 0 &&
      plan.coverageV2Planning.comparisonMetricsCount === 0 &&
      plan.coverageV2Planning.completeRequirementInventoryEstablished ===
        false &&
      plan.structuralDomainPlanning?.root?.frameCount ===
        manifest.runtime.frameCount &&
      plan.structuralDomainPlanning.root.completeCoverageEstablished ===
        false &&
      plan.structuralDomainPlanning.rootReachableDomainInventoryComplete ===
        false &&
      plan.structuralDomainPlanning.totalCoverageFramesKnown === false &&
      plan.structuralDomainPlanning.totalCoverageFrameCount === null &&
      plan.provenance?.canonicalCoverageV2?.path === coverageRecord.path &&
      plan.provenance.canonicalCoverageV2.bytes === coverageRecord.bytes &&
      plan.provenance.canonicalCoverageV2.sha256 === coverageRecord.sha256 &&
      plan.emptyRuntimeAcquisitionWorksheet?.state ===
        "empty-non-runnable-planning-only" &&
      Object.entries(plan.emptyRuntimeAcquisitionWorksheet)
        .filter(([key]) => !["state", "namedOperatorFieldMeaning"].includes(key))
        .every(([, value]) => Array.isArray(value) && value.length === 0) &&
      plan.ownership?.canonicalAcceptanceEvidence === false &&
      plan.ownership?.canonicalCoverage === false,
    `${member.animationId}: runtime acquisition plan is runnable, assigned, promoted, or stale`,
  );
  invariant(
    plan.artifactFingerprintSha256 ===
      fingerprintWithout(plan, "artifactFingerprintSha256"),
    `${member.animationId}: runtime acquisition plan fingerprint is invalid`,
  );
  allFalse(
    plan.acceptanceEffects,
    Object.keys(plan.acceptanceEffects || {}).filter(
      (key) => key !== "acceptanceNeutral",
    ),
    `${member.animationId}: runtime-plan acceptance`,
  );
  invariant(
    plan.acceptanceEffects.acceptanceNeutral === true,
    `${member.animationId}: runtime plan must remain acceptance-neutral`,
  );
}

function sameDescriptor(actual, record) {
  return actual?.path === record.path &&
    actual.bytes === record.bytes &&
    actual.sha256 === record.sha256;
}

function validateHistoricalCandidateBindings({
  member,
  staticReceipt,
  candidateReceipt,
  candidateRecord,
  censusRecord,
  inventoryRecord,
}) {
  validatePriorReceipt(candidateReceipt, member);
  invariant(
    staticReceipt.inputBindingSemantics?.candidateArtifacts ===
      "historical-at-adoption-do-not-require-current-path-byte-identity" &&
      sameDescriptor(staticReceipt.inputs?.candidateReceipt, candidateRecord) &&
      sameDescriptor(staticReceipt.inputs?.candidateAssetCensus, censusRecord) &&
      sameDescriptor(
        staticReceipt.inputs?.candidateDefinitionInventory,
        inventoryRecord,
      ) &&
      sameDescriptor(candidateReceipt.outputs?.assetDefinitionCensus, censusRecord) &&
      sameDescriptor(candidateReceipt.outputs?.definitionInventory, inventoryRecord),
    `${member.animationId}: historical candidate receipt/census/inventory binding drifted`,
  );
  const lines = inventoryRecord.contents.toString("utf8").trimEnd().split("\n");
  invariant(
    lines[0].replace(/\r$/, "") === CSV_HEADER &&
      lines.length - 1 === candidateReceipt.outputs.definitionInventory.rowCount,
    `${member.animationId}: definition inventory header or row count drifted`,
  );
}

function authorityBoundary() {
  return {
    machineOnlyStaticPreparationAuthorized: true,
    animateGuiExecutionAuthorized: false,
    evidencePromotionAuthorized: false,
    humanTimingAuthorized: false,
    humanWorkStudyAuthorized: false,
    implementationAuthorized: false,
    namedOperatorAssigned: false,
    originalRuntimeExecutionAuthorized: false,
    procurementOrPaymentAuthorized: false,
    publicationAuthorized: false,
    runtimeHostOrContainmentAuthorized: false,
    runtimeTraceExecutionAuthorized: false,
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
    traceEvidenceCreated: false,
  };
}

function phaseWorksheet(phaseId) {
  return {
    phaseId,
    assignedPerson: null,
    sessionId: null,
    startedAt: null,
    finishedAt: null,
    actualMinutes: null,
    measurementReceipt: null,
    completed: false,
  };
}

export function g5L5WorkStudyPreparationPath(animationId) {
  invariant(
    SAFE_ID.test(animationId || "") &&
      G5_L5_WORK_STUDY_MEMBER_IDS.includes(animationId),
    "invalid or unmanaged G5 L5 work-study member",
  );
  return `migrations/${animationId}/audit/machine/${MEMBER_OUTPUT_NAME}`;
}

export function validateG5L5WorkStudyPreparation(document, member) {
  const id = document?.member?.animationId || "unknown";
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType === "g5-l5-work-study-preparation" &&
      document.release?.releaseId === G5_L5_WORK_STUDY_RELEASE_ID &&
      document.release.memberCount === 57 &&
      document.release.pageCount === 56 &&
      document.release.shellCount === 1 &&
      document.member?.animationId === member.animationId &&
      document.member.assetId === member.assetId &&
      document.member.ordinal === member.ordinal &&
      document.state === G5_L5_WORK_STUDY_STATE,
    `${id}: work-study preparation identity or 56+Shell scope drifted`,
  );
  invariant(
    document.generatedBy?.path === GENERATOR_PATH &&
      document.generatedBy.version === GENERATOR_VERSION &&
      document.generatedBy.deterministic === true &&
      SHA256.test(document.generatedBy.sha256 || ""),
    `${id}: generator binding drifted`,
  );
  invariant(
    JSON.stringify(document.calibration?.requiredPhases) ===
      JSON.stringify(G5_L5_WORK_STUDY_PHASES) &&
      document.calibration.measurementRule === EXPECTED_MEASUREMENT_RULE &&
      document.calibration.intendedAxes?.length === 4,
    `${id}: calibration binding drifted`,
  );
  allFalse(document.authority, AUTHORITY_FALSE_KEYS, `${id}: authority`);
  invariant(
    document.authority.machineOnlyStaticPreparationAuthorized === true,
    `${id}: bounded machine-only preparation authority is absent`,
  );
  invariant(
    document.workStudy?.requiredPhaseCount === 4 &&
      document.workStudy.assignedPersonCount === 0 &&
      document.workStudy.completedPhaseCount === 0 &&
      document.workStudy.actualMinuteValueCount === 0 &&
      document.workStudy.actualTotalMinutes === null &&
      document.workStudy.measuredBy === null &&
      document.workStudy.measurementReceipt === null &&
      document.workStudy.phases?.length === 4 &&
      document.workStudy.phases.every(
        (phase, index) =>
          phase.phaseId === G5_L5_WORK_STUDY_PHASES[index] &&
          phase.assignedPerson === null &&
          phase.sessionId === null &&
          phase.startedAt === null &&
          phase.finishedAt === null &&
          phase.actualMinutes === null &&
          phase.measurementReceipt === null &&
          phase.completed === false,
      ),
    `${id}: work-study worksheet contains a person, session, time, or completion`,
  );
  invariant(
    document.runtimeTracePreparation?.runnable === false &&
      Array.isArray(document.runtimeTracePreparation.commands) &&
      document.runtimeTracePreparation.commands.length === 0 &&
      document.runtimeTracePreparation.namedOperator === null &&
      document.runtimeTracePreparation.sessionId === null &&
      document.runtimeTracePreparation.runtimeHost === null &&
      document.runtimeTracePreparation.containmentProfile === null &&
      document.runtimeTracePreparation.authorizationReceipt === null &&
      document.runtimeTracePreparation.runtimeSessionsExecuted === 0 &&
      document.runtimeTracePreparation.tracesCaptured === 0 &&
      document.runtimeTracePreparation.authoritativeRuntimeEvidenceCount ===
        0,
    `${id}: runtime-trace preparation became runnable, assigned, or executed`,
  );
  invariant(
    document.staffing?.primaryPerson === null &&
      document.staffing.backupPerson === null &&
      document.staffing.assignmentReceipt === null &&
      document.staffing.assigned === false &&
      document.session?.sessionId === null &&
      document.session.operator === null &&
      document.session.startedAt === null &&
      document.session.finishedAt === null &&
      document.session.authorizationReceipt === null &&
      document.session.executed === false &&
      document.budgetAndProcurement?.currency === "USD" &&
      document.budgetAndProcurement.personnelRateCeilingUsdPerHour === null &&
      document.budgetAndProcurement.totalBudgetEnvelopeUsd === null &&
      document.budgetAndProcurement.procurementPaymentCycle === null &&
      document.budgetAndProcurement.budgetApproved === false &&
      document.budgetAndProcurement.spendAuthorized === false &&
      document.budgetAndProcurement.procurementOrPaymentAuthorized === false,
    `${id}: staffing, session, budget, spend, or procurement boundary drifted`,
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
    `${id}: package must remain acceptance-neutral`,
  );
  allFalse(
    document.acceptanceEffects,
    ACCEPTANCE_FALSE_KEYS,
    `${id}: acceptance effects`,
  );
  invariant(
    document.publicationEffects?.publicationAuthorized === false &&
      document.publicationEffects.published === false &&
      document.publicationEffects.releaseLedgerChanged === false,
    `${id}: publication effect drifted`,
  );
  exactKeys(
    document.sourceBindings,
    [
      "calibrationCatalog",
      "candidateDefinitionInventory",
      "candidateReceipt",
      "candidateSwfAssetCensus",
      "coverageV2",
      "currentMigration",
      "frameDomainDisposition",
      "lessonReleaseCatalog",
      "m1MachineFoundationReport",
      "m1StaticReconciliationReceipt",
      "ownerDirective",
      "releaseRuntimeAcquisitionPlan",
      "scenarioInventory",
      "staticDispositionEvidence",
      "strictReadiness",
    ],
    `${id}: source bindings`,
  );
  invariant(
    Object.values(document.sourceBindings).every(
      (binding) =>
        binding === null ||
        (typeof binding.path === "string" &&
          Number.isSafeInteger(binding.bytes) &&
          binding.bytes > 0 &&
          SHA256.test(binding.sha256 || "")),
    ),
    `${id}: source binding descriptor is invalid`,
  );
  const snapshot = document.readinessSnapshot;
  invariant(
    Number.isSafeInteger(snapshot?.structurallyReachableChildTimelineCount) &&
      Number.isSafeInteger(
        snapshot.evidenceBoundCompositeFrameDomainCount,
      ) &&
      Number.isSafeInteger(snapshot.unresolvedFrameDomainCount) &&
      Number.isSafeInteger(snapshot.excludedNotProvenTimelineCount) &&
      snapshot.structurallyReachableChildTimelineCount > 0 &&
      snapshot.unresolvedFrameDomainCount > 0 &&
      snapshot.evidenceBoundCompositeFrameDomainCount >= 0 &&
      snapshot.excludedNotProvenTimelineCount >= 0 &&
      snapshot.evidenceBoundCompositeFrameDomainCount +
          snapshot.unresolvedFrameDomainCount ===
        snapshot.structurallyReachableChildTimelineCount &&
      (snapshot.evidenceBoundCompositeFrameDomainCount > 0) ===
        (document.sourceBindings.staticDispositionEvidence !== null),
    `${id}: proof-bound frame-domain accounting or evidence binding drifted`,
  );
  invariant(
    document.artifactFingerprintSha256 ===
      fingerprintWithout(document, "artifactFingerprintSha256"),
    `${id}: work-study preparation fingerprint is invalid`,
  );
  invariant(
    document.strictAcceptanceEffect ===
      "none; machine-only non-runnable preparation creates no runtime, implementation, evidence, review, acceptance, strict-completion, or publication effect",
    `${id}: strict acceptance effect drifted`,
  );
  return true;
}

export function validateG5L5WorkStudyPreparationReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-work-study-preparation-readiness" &&
      report.release?.releaseId === G5_L5_WORK_STUDY_RELEASE_ID &&
      report.release.memberCount === 57 &&
      report.release.pageCount === 56 &&
      report.release.shellCount === 1 &&
      report.state === G5_L5_WORK_STUDY_STATE,
    "G5 L5 work-study report identity or 56+Shell scope drifted",
  );
  invariant(
    report.generatedBy?.path === GENERATOR_PATH &&
      report.generatedBy.version === GENERATOR_VERSION &&
      report.generatedBy.deterministic === true &&
      Number.isSafeInteger(report.generatedBy.bytes) &&
      report.generatedBy.bytes > 0 &&
      SHA256.test(report.generatedBy.sha256 || ""),
    "G5 L5 work-study report generator binding drifted",
  );
  invariant(
    report.members?.length === 4 &&
      JSON.stringify(report.members.map(({animationId}) => animationId)) ===
        JSON.stringify(G5_L5_WORK_STUDY_MEMBER_IDS) &&
      report.members.every(
        (entry) =>
          entry.preparation?.path ===
            g5L5WorkStudyPreparationPath(entry.animationId) &&
          entry.readiness?.runnable === false &&
          entry.readiness.commands.length === 0 &&
          entry.readiness.assignedPersonCount === 0 &&
          entry.readiness.completedPhaseCount === 0 &&
          entry.readiness.actualMinuteValueCount === 0 &&
          entry.readiness.actualTotalMinutes === null &&
          entry.readiness.runtimeSessionsExecuted === 0 &&
          entry.readiness.tracesCaptured === 0 &&
          entry.readiness.evidenceBoundCompositeFrameDomainCount +
              entry.readiness.unresolvedFrameDomainCount ===
            entry.readiness.structurallyReachableChildTimelineCount,
      ),
    "G5 L5 work-study report member selection or fail-closed state drifted",
  );
  invariant(
    report.summary?.selectedMemberCount === 4 &&
      report.summary.preparationArtifactCount === 4 &&
      report.summary.requiredPhaseCount === 16 &&
      report.summary.assignedPersonCount === 0 &&
      report.summary.completedPhaseCount === 0 &&
      report.summary.actualMinuteValueCount === 0 &&
      report.summary.actualMinutesTotal === null &&
      report.summary.runnableMemberCount === 0 &&
      report.summary.runtimeSessionCount === 0 &&
      report.summary.traceCaptureCount === 0 &&
      report.summary.authoritativeRuntimeEvidenceCount === 0 &&
      report.summary.implementationStartedCount === 0 &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.publishedCount === 0 &&
      report.summary.structurallyReachableChildTimelineCount === 330 &&
      report.summary.evidenceBoundCompositeFrameDomainCount === 283 &&
      report.summary.unresolvedFrameDomainCount === 47 &&
      report.summary.excludedNotProvenTimelineCount === 101 &&
      report.summary.evidenceBoundCompositeFrameDomainCount +
          report.summary.unresolvedFrameDomainCount ===
        report.summary.structurallyReachableChildTimelineCount,
    "G5 L5 work-study report summary invented people, time, execution, or completion",
  );
  allFalse(report.authority, AUTHORITY_FALSE_KEYS, "report authority");
  invariant(
    report.authority.machineOnlyStaticPreparationAuthorized === true &&
      report.executionGate?.runnable === false &&
      report.executionGate.commands?.length === 0,
    "G5 L5 report became runnable or lost bounded static authority",
  );
  invariant(
    report.staffing?.assignedPersonCount === 0 &&
      report.staffing.primaryPerson === null &&
      report.staffing.backupPerson === null &&
      report.sessions?.sessionCount === 0 &&
      report.sessions.sessionId === null &&
      report.sessions.operator === null &&
      report.budgetAndProcurement?.personnelRateCeilingUsdPerHour === null &&
      report.budgetAndProcurement.totalBudgetEnvelopeUsd === null &&
      report.budgetAndProcurement.procurementPaymentCycle === null &&
      report.budgetAndProcurement.budgetApproved === false &&
      report.budgetAndProcurement.spendAuthorized === false &&
      report.budgetAndProcurement.procurementOrPaymentAuthorized === false,
    "G5 L5 report invented staffing, sessions, budget, spend, or procurement",
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
    "G5 L5 report must remain acceptance-neutral",
  );
  allFalse(
    report.acceptanceEffects,
    ACCEPTANCE_FALSE_KEYS,
    "report acceptance effects",
  );
  invariant(
    report.publicationEffects?.publicationAuthorized === false &&
      report.publicationEffects.published === false &&
      report.publicationEffects.releaseLedgerChanged === false,
    "G5 L5 report publication boundary drifted",
  );
  invariant(
    report.reportFingerprintSha256 ===
      fingerprintWithout(report, "reportFingerprintSha256"),
    "G5 L5 work-study report fingerprint is invalid",
  );
  return true;
}

function buildMemberDocument({
  member,
  intendedAxes,
  releaseFingerprint,
  calibrationFingerprint,
  generator,
  records,
  manifest,
  candidateReceipt,
  scenario,
  disposition,
  coverage,
  strict,
  runtimePlan,
  frameDomainFacts,
}) {
  const document = {
    schemaVersion: 1,
    artifactType: "g5-l5-work-study-preparation",
    generatedBy: {
      path: GENERATOR_PATH,
      version: GENERATOR_VERSION,
      bytes: generator.bytes,
      sha256: generator.sha256,
      deterministic: true,
    },
    state: G5_L5_WORK_STUDY_STATE,
    release: {
      releaseId: G5_L5_WORK_STUDY_RELEASE_ID,
      titleDisplay: "Add & Subtract Negative Numbers",
      pageCount: 56,
      shellCount: 1,
      memberCount: 57,
      publicationMode: "atomic",
      releaseFingerprintSha256: releaseFingerprint,
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
      calibrationSetFingerprintSha256: calibrationFingerprint,
      intendedAxes,
      requiredPhases: [...G5_L5_WORK_STUDY_PHASES],
      measurementRule: EXPECTED_MEASUREMENT_RULE,
    },
    authority: authorityBoundary(),
    workStudy: {
      requiredPhaseCount: 4,
      assignedPersonCount: 0,
      completedPhaseCount: 0,
      actualMinuteValueCount: 0,
      actualTotalMinutes: null,
      measuredBy: null,
      measurementReceipt: null,
      phases: G5_L5_WORK_STUDY_PHASES.map(phaseWorksheet),
    },
    runtimeTracePreparation: {
      runnable: false,
      commands: [],
      namedOperator: null,
      sessionId: null,
      runtimeHost: null,
      containmentProfile: null,
      authorizationReceipt: null,
      runtimeSessionsExecuted: 0,
      tracesCaptured: 0,
      authoritativeRuntimeEvidenceCount: 0,
    },
    staffing: {
      primaryPerson: null,
      backupPerson: null,
      assignmentReceipt: null,
      assigned: false,
    },
    session: {
      sessionId: null,
      operator: null,
      startedAt: null,
      finishedAt: null,
      authorizationReceipt: null,
      executed: false,
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
    readinessSnapshot: {
      migrationStatus: manifest.status,
      rootFrameCount: manifest.runtime.frameCount,
      m1StaticReconciliationApplied: true,
      historicalCandidatePackageHashBound: true,
      candidateDefinitionCount:
        candidateReceipt.outputs.assetDefinitionCensus.definitionCount,
      scenarioInventoryStatus: scenario.inventoryStatus,
      authoritativeRuntimeEvidenceCount:
        scenario.authoritativeRuntimeEvidence.length,
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
      runtimeAcquisitionGateState: runtimePlan.executionGate.state,
    },
    sourceBindings: {
      lessonReleaseCatalog: descriptor(records.release),
      calibrationCatalog: descriptor(records.calibration),
      currentMigration: descriptor(records.manifest),
      m1StaticReconciliationReceipt: descriptor(records.staticReceipt),
      candidateReceipt: descriptor(records.candidateReceipt),
      candidateSwfAssetCensus: descriptor(records.census),
      candidateDefinitionInventory: descriptor(records.inventory),
      scenarioInventory: descriptor(records.scenario),
      frameDomainDisposition: descriptor(records.disposition),
      coverageV2: descriptor(records.coverage),
      strictReadiness: descriptor(records.strict),
      releaseRuntimeAcquisitionPlan: descriptor(records.runtimePlan),
      m1MachineFoundationReport: descriptor(records.m1Report),
      ownerDirective: descriptor(records.ownerDirective),
      staticDispositionEvidence:
        records.staticEvidence ? descriptor(records.staticEvidence) : null,
    },
    implementationEffects: implementationEffects(),
    evidenceEffects: evidenceEffects(),
    acceptanceEffects: acceptanceEffects(),
    publicationEffects: {
      publicationAuthorized: false,
      published: false,
      releaseLedgerChanged: false,
    },
    strictAcceptanceEffect:
      "none; machine-only non-runnable preparation creates no runtime, implementation, evidence, review, acceptance, strict-completion, or publication effect",
  };
  return withWorkStudyArtifactFingerprint(document);
}

function buildReport({globals, prepared}) {
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-work-study-preparation-readiness",
    generatedBy: {
      path: GENERATOR_PATH,
      version: GENERATOR_VERSION,
      bytes: globals.generator.bytes,
      sha256: globals.generator.sha256,
      deterministic: true,
    },
    state: G5_L5_WORK_STUDY_STATE,
    release: {
      releaseId: G5_L5_WORK_STUDY_RELEASE_ID,
      titleDisplay: "Add & Subtract Negative Numbers",
      pageCount: 56,
      shellCount: 1,
      memberCount: 57,
      publicationMode: "atomic",
      releaseFingerprintSha256: globals.releaseFingerprint,
    },
    selection: {
      calibrationSetFingerprintSha256: globals.calibrationFingerprint,
      memberAnimationIds: [...G5_L5_WORK_STUDY_MEMBER_IDS],
      requiredPhases: [...G5_L5_WORK_STUDY_PHASES],
      measurementRule: EXPECTED_MEASUREMENT_RULE,
    },
    authority: authorityBoundary(),
    summary: {
      selectedMemberCount: 4,
      preparationArtifactCount: 4,
      requiredPhaseCount: 16,
      assignedPersonCount: 0,
      completedPhaseCount: 0,
      actualMinuteValueCount: 0,
      actualMinutesTotal: null,
      runnableMemberCount: 0,
      runtimeSessionCount: 0,
      traceCaptureCount: 0,
      authoritativeRuntimeEvidenceCount: 0,
      implementationStartedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      structurallyReachableChildTimelineCount: prepared.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.reachableChildTimelineCount,
        0,
      ),
      evidenceBoundCompositeFrameDomainCount: prepared.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.evidenceBoundCompositeChildCount,
        0,
      ),
      unresolvedFrameDomainCount: prepared.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.unresolvedChildCount,
        0,
      ),
      excludedNotProvenTimelineCount: prepared.reduce(
        (total, {frameDomainFacts}) =>
          total + frameDomainFacts.excludedNotProvenTimelineCount,
        0,
      ),
    },
    sourceBindings: {
      lessonReleaseCatalog: descriptor(globals.release),
      calibrationCatalog: descriptor(globals.calibration),
      m1MachineFoundationReport: descriptor(globals.m1Report),
      ownerDirective: descriptor(globals.ownerDirective),
    },
    members: prepared.map(({member, document, rendered}) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      intendedAxes: document.calibration.intendedAxes,
      preparation: {
        path: g5L5WorkStudyPreparationPath(member.animationId),
        bytes: Buffer.byteLength(rendered),
        sha256: sha256(Buffer.from(rendered)),
      },
      readiness: {
        runnable: false,
        commands: [],
        assignedPersonCount: 0,
        completedPhaseCount: 0,
        actualMinuteValueCount: 0,
        actualTotalMinutes: null,
        runtimeSessionsExecuted: 0,
        tracesCaptured: 0,
        structurallyReachableChildTimelineCount:
          document.readinessSnapshot.structurallyReachableChildTimelineCount,
        evidenceBoundCompositeFrameDomainCount:
          document.readinessSnapshot.evidenceBoundCompositeFrameDomainCount,
        unresolvedFrameDomainCount:
          document.readinessSnapshot.unresolvedFrameDomainCount,
        excludedNotProvenTimelineCount:
          document.readinessSnapshot.excludedNotProvenTimelineCount,
        pendingCoverageRequirementCount:
          document.readinessSnapshot.pendingCoverageRequirementCount,
      },
    })),
    executionGate: {runnable: false, commands: []},
    staffing: {
      assignedPersonCount: 0,
      primaryPerson: null,
      backupPerson: null,
    },
    sessions: {
      sessionCount: 0,
      sessionId: null,
      operator: null,
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
      "No named human, named operator, reviewer, or per-session authorization is assigned.",
      "No actual phase timing, measured minutes, runtime host, containment profile, command, or executable session exists.",
      "Runtime, implementation, evidence promotion, review, Owner acceptance, strict completion, and atomic publication remain separate blocked gates.",
    ],
  };
  return withWorkStudyReportFingerprint(base);
}

export function renderG5L5WorkStudyPreparationMarkdown(report) {
  return `<!-- generated-by: ${GENERATOR_PATH} -->\n` +
    `# G5 L5 work-study preparation readiness\n\n` +
    `> Machine-only, non-runnable preparation. This package grants no human timing, runtime, implementation, evidence-promotion, review, acceptance, strict-completion, or publication authority.\n\n` +
    `## Outcome\n\n` +
    `- Release scope: **56 pages + Shell = 57 members**.\n` +
    `- Calibration representatives prepared: **4/4**.\n` +
    `- Required phase worksheets: **16**; assigned people / completed phases / actual-minute values: **0 / 0 / 0**.\n` +
    `- Runnable members / commands / runtime sessions / captured traces: **0 / 0 / 0 / 0**.\n` +
    `- Selected reachable child domains / exact proof-bound composites / unresolved / excluded-not-proven: **${report.summary.structurallyReachableChildTimelineCount} / ${report.summary.evidenceBoundCompositeFrameDomainCount} / ${report.summary.unresolvedFrameDomainCount} / ${report.summary.excludedNotProvenTimelineCount}**.\n` +
    `- Implementation / evidence promotion / strict completion / publication: **false / false / false / false**.\n\n` +
    `## Representatives\n\n` +
    report.members.map((member) =>
      `- \`${member.animationId}\`: ${member.intendedAxes.join(", ")}; reachable / exact proof-bound composite / unresolved / excluded-not-proven frame domains ${member.readiness.structurallyReachableChildTimelineCount} / ${member.readiness.evidenceBoundCompositeFrameDomainCount} / ${member.readiness.unresolvedFrameDomainCount} / ${member.readiness.excludedNotProvenTimelineCount}; pending bilingual coverage requirements ${member.readiness.pendingCoverageRequirementCount}.`,
    ).join("\n") +
    `\n\n## Boundary\n\n` +
    report.blockers.map((value) => `- ${value}`).join("\n") +
    `\n`;
}

async function loadGlobals(root) {
  const [generator, release, calibration, m1Report, ownerResult] =
    await Promise.all([
      readRecord(root, GENERATOR_PATH, {label: "work-study generator"}),
      readRecord(root, RELEASE_PATH, {json: true, label: "release catalog"}),
      readRecord(root, CALIBRATION_PATH, {
        json: true,
        label: "calibration catalog",
      }),
      readRecord(root, M1_REPORT_PATH, {
        json: true,
        label: "G5 L5 M1 report",
      }),
      readG5L5OwnerGovernanceDirectiveIntake({root}),
    ]);
  const selectedRelease = selectRelease(release.document);
  const selectedCalibration = selectCalibration(calibration.document);
  validateG5L5M1MachineFoundationReport(m1Report.document);
  const ownerDirective = await readRecord(
    root,
    ownerResult.binding?.path ?? G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
    {json: true, label: "Owner directive"},
  );
  invariant(
    stableJson(ownerDirective.document) ===
      stableJson(ownerResult.receipt ?? ownerResult.document ?? ownerResult),
    "Owner directive reader and current bytes differ",
  );
  invariant(
    ownerDirective.document.authorityBoundary?.m1MachineOnlyEffective === true &&
      ownerDirective.document.authorityBoundary
        .originalRuntimeExecutionAuthorized === false &&
      ownerDirective.document.authorityBoundary
        .rendererImplementationAuthorized === false &&
      ownerDirective.document.authorityBoundary
        .evidencePromotionAuthorized === false &&
      ownerDirective.document.authorityBoundary.publicationAuthorized === false,
    "Owner directive crossed the machine-only static boundary",
  );
  const members = G5_L5_WORK_STUDY_MEMBER_IDS.map((id) => {
    const matches = selectedRelease.release.members.filter(
      ({animationId}) => animationId === id,
    );
    invariant(matches.length === 1, `${id}: exact release member is missing`);
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
    m1Report,
    ownerDirective,
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
    candidateReceipt:
      `${workspace}/audit/machine/pre-runtime-specification-candidate-receipt.json`,
    census: `${workspace}/audit/machine/swf-asset-definition-census.json`,
    inventory: `${workspace}/audit/machine/swf-definition-inventory.csv`,
    scenario: `${workspace}/audit/scenario-inventory.json`,
    disposition: `${workspace}/audit/frame-domain-disposition.json`,
    coverage: `${workspace}/evidence/full-frame-coverage.json`,
    strict: g5L5StaticStrictReadinessPath(member.animationId),
    runtimePlan:
      `${workspace}/audit/machine/release-runtime-acquisition-plan.json`,
    staticReceipt: g5L5M1StaticReconciliationReceiptPath(member.animationId),
  };
  const [
    manifest,
    candidateReceipt,
    census,
    inventory,
    scenario,
    disposition,
    coverage,
    strict,
    runtimePlan,
    staticReader,
    strictReader,
  ] = await Promise.all([
    readRecord(root, paths.manifest, {json: true}),
    readRecord(root, paths.candidateReceipt, {json: true}),
    readRecord(root, paths.census, {json: true}),
    readRecord(root, paths.inventory),
    readRecord(root, paths.scenario, {json: true}),
    readRecord(root, paths.disposition, {json: true}),
    readRecord(root, paths.coverage, {json: true}),
    readRecord(root, paths.strict, {json: true}),
    readRecord(root, paths.runtimePlan, {json: true}),
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
  ]);
  const staticReceipt = await readRecord(root, paths.staticReceipt, {
    json: true,
  });
  const staticPostimages = await Promise.all(
    Object.values(staticReader.postOutputs).map(async (binding) => {
      const record = await readRecord(root, binding.path, {
        label: `${member.animationId}: current M1 postimage ${binding.path}`,
      });
      invariant(
        sameDescriptor(binding, record),
        `${member.animationId}: current M1 postimage drifted`,
      );
      return record;
    }),
  );
  invariant(
    stableJson(staticReceipt.document) === stableJson(staticReader.receipt),
    `${member.animationId}: M1 receipt reader and current bytes differ`,
  );
  invariant(
    stableJson(strict.document) === stableJson(strictReader.document),
    `${member.animationId}: strict-readiness reader and current bytes differ`,
  );
  validateManifest(manifest.document, member);
  validateHistoricalCandidateBindings({
    member,
    staticReceipt: staticReader.receipt,
    candidateReceipt: candidateReceipt.document,
    candidateRecord: candidateReceipt,
    censusRecord: census,
    inventoryRecord: inventory,
  });
  validateCandidateCensus(
    census.document,
    member,
    candidateReceipt.document,
  );
  validateScenarioInventory(scenario.document);
  invariant(
    scenario.document.animationId === member.animationId &&
      scenario.document.inventoryStatus ===
        "static-exhaustive-runtime-unverified" &&
      scenario.document.migrationStatusChanged === false &&
      Array.isArray(scenario.document.authoritativeRuntimeEvidence) &&
      scenario.document.authoritativeRuntimeEvidence.length === 0 &&
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
      {label: `${member.animationId}: static composite evidence`},
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
      strict.document.implementationReadiness?.implementationAuthorized ===
        false,
    `${member.animationId}: strict-readiness was promoted`,
  );
  validateRuntimePlan(
    runtimePlan.document,
    coverage,
    member,
    manifest.document,
  );
  const m1Member = globals.m1Report.document.machineFoundation.members.find(
    ({animationId}) => animationId === member.animationId,
  );
  invariant(
    m1Member &&
      sameDescriptor(m1Member.bindings.migrationManifest, manifest) &&
      sameDescriptor(
        m1Member.bindings.m1StaticReconciliationReceipt,
        staticReceipt,
      ) &&
      sameDescriptor(m1Member.bindings.strictReadiness, strict) &&
      m1Member.boundaries.runtimeRunnable === false &&
      m1Member.boundaries.implementationAuthorized === false &&
      m1Member.boundaries.strictComplete === false &&
      m1Member.boundaries.published === false,
    `${member.animationId}: M1 report current-member binding drifted`,
  );
  const calibrationMember = globals.calibrationDocument.members.find(
    ({animationId}) => animationId === member.animationId,
  );
  const records = {
    generator: globals.generator,
    release: globals.release,
    calibration: globals.calibration,
    m1Report: globals.m1Report,
    ownerDirective: globals.ownerDirective,
    manifest,
    staticReceipt,
    candidateReceipt,
    census,
    inventory,
    scenario,
    disposition,
    coverage,
    strict,
    runtimePlan,
    ...(staticEvidence ? {staticEvidence} : {}),
  };
  const document = buildMemberDocument({
    member,
    intendedAxes: calibrationMember.intendedAxes,
    releaseFingerprint: globals.releaseFingerprint,
    calibrationFingerprint: globals.calibrationFingerprint,
    generator: globals.generator,
    records,
    manifest: manifest.document,
    candidateReceipt: candidateReceipt.document,
    scenario: scenario.document,
    disposition: disposition.document,
    coverage: coverage.document,
    strict: strict.document,
    runtimePlan: runtimePlan.document,
    frameDomainFacts,
  });
  validateG5L5WorkStudyPreparation(document, member);
  return {
    id: member.animationId,
    member,
    document,
    rendered: stableJson(document),
    frameDomainFacts,
    inputRecords: [
      ...Object.values(records),
      ...staticPostimages,
    ],
  };
}

function managedOutputPaths() {
  return new Set([
    ...G5_L5_WORK_STUDY_MEMBER_IDS.map(g5L5WorkStudyPreparationPath),
    REPORT_JSON_PATH,
    REPORT_MARKDOWN_PATH,
  ]);
}

async function readOutputSnapshot(root, relativePath) {
  invariant(
    managedOutputPaths().has(relativePath),
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
      information.nlink === 1n,
    `output must be one ordinary non-linked file: ${relativePath}`,
  );
  const record = await readRecord(root, relativePath, {
    label: `existing output ${relativePath}`,
  });
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
  } catch (error) {
    throw new Error(`refusing invalid existing JSON output: ${snapshot.path}`);
  }
  invariant(
    document.generatedBy?.path === GENERATOR_PATH &&
      [
        "g5-l5-work-study-preparation",
        "g5-l5-work-study-preparation-readiness",
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
    desiredBytes,
    desiredSha256,
    committed: false,
  };
}

async function cleanupTransaction(transaction) {
  await removeOwned(transaction.stagePath, transaction.desiredSha256);
  if (transaction.snapshot.exists) {
    await removeOwned(transaction.backupPath, transaction.snapshot.sha256);
  }
}

async function rollback(transactions, originalError) {
  const rollbackErrors = [];
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
      await cleanupTransaction(transaction);
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      `work-study transaction failed with ${rollbackErrors.length} rollback error(s)`,
    );
  }
  throw originalError;
}

async function commitBatch(root, prepared, inputRecords, hooks = {}) {
  const batchId =
    `${process.pid}-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const transactions = [];
  try {
    for (const item of prepared) {
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
      invariant(
        sha256(await readFile(transaction.snapshot.absolutePath)) ===
          transaction.desiredSha256,
        `${transaction.output}: committed bytes changed`,
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
  for (const transaction of transactions) await cleanupTransaction(transaction);
}

async function prepareOutputs(
  root,
  globals,
  members,
  resolveStaticCompositeProof,
) {
  const memberItems = [];
  for (const member of members) {
    memberItems.push(
      await buildMember(
        root,
        globals,
        member,
        resolveStaticCompositeProof,
      ),
    );
  }
  const report = buildReport({globals, prepared: memberItems});
  validateG5L5WorkStudyPreparationReport(report);
  const reportRendered = stableJson(report);
  const markdownRendered = renderG5L5WorkStudyPreparationMarkdown(report);
  const desired = [
    ...memberItems.map((item) => ({
      id: item.id,
      output: g5L5WorkStudyPreparationPath(item.id),
      rendered: item.rendered,
      inputRecords: item.inputRecords,
      document: item.document,
    })),
    {
      id: "g5-l5-work-study-preparation-readiness-json",
      output: REPORT_JSON_PATH,
      rendered: reportRendered,
      inputRecords: memberItems.flatMap(({inputRecords}) => inputRecords),
      document: report,
    },
    {
      id: "g5-l5-work-study-preparation-readiness-markdown",
      output: REPORT_MARKDOWN_PATH,
      rendered: markdownRendered,
      inputRecords: memberItems.flatMap(({inputRecords}) => inputRecords),
      document: null,
    },
  ];
  for (const item of desired) {
    item.snapshot = await readOutputSnapshot(root, item.output);
    assertOwnedOutput(item.snapshot);
  }
  return {memberItems, report, desired};
}

export async function prepareG5L5WorkStudyPackage(options = {}) {
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
    globals.members,
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
    releaseId: G5_L5_WORK_STUDY_RELEASE_ID,
    state: G5_L5_WORK_STUDY_STATE,
    selectedMemberCount: 4,
    outputCount: 6,
    outputs: prepared.desired.map(({output, rendered}) => ({
      path: output,
      bytes: Buffer.byteLength(rendered),
      sha256: sha256(Buffer.from(rendered)),
    })),
    runnable: false,
    commands: [],
    assignedPersonCount: 0,
    actualMinuteValueCount: 0,
    actualMinutesTotal: null,
    runtimeSessionCount: 0,
    structurallyReachableChildTimelineCount:
      prepared.report.summary.structurallyReachableChildTimelineCount,
    evidenceBoundCompositeFrameDomainCount:
      prepared.report.summary.evidenceBoundCompositeFrameDomainCount,
    unresolvedFrameDomainCount:
      prepared.report.summary.unresolvedFrameDomainCount,
    excludedNotProvenTimelineCount:
      prepared.report.summary.excludedNotProvenTimelineCount,
    implementationAuthorized: false,
    evidencePromotionAuthorized: false,
    strictCompleteCount: 0,
    publishedCount: 0,
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
  node scripts/prepare-g5-l5-work-study-package.mjs --dry-run
  node scripts/prepare-g5-l5-work-study-package.mjs --apply
  node scripts/prepare-g5-l5-work-study-package.mjs --check

Prepares exactly four calibration-member work-study/runtime-trace worksheets
and one JSON + Markdown readiness report. All six outputs are committed as one
compare-and-swap batch. The package is non-runnable, contains no commands,
people, sessions, actual timing, budget, spend, or procurement authority, and
grants no runtime, implementation, evidence, review, strict, or publication
effect.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const result = await prepareG5L5WorkStudyPackage(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
