#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  open,
  readFile,
  realpath,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  renderMarkdown as renderPredecessorMarkdown,
  validateG5L4ContinuationMachineReadiness,
} from "./build-g5-l4-continuation-machine-readiness.mjs";
import {
  renderMarkdown as renderAudioStaticMarkdown,
  validateReport as validateAudioStaticReport,
} from "./build-g5-l4-audio-static-cue-reconciliation.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const GENERATOR_PATH =
  "scripts/build-g5-l4-continuation-machine-readiness-successor.mjs";
export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const PACKAGE_ID = "g5-l4-whole-lesson-package-mvp-v6";
export const REPORT_TYPE =
  "g5-l4-continuation-machine-readiness-successor";
export const RAW_REPORT_TYPE =
  "g5-l4-v6-fresh-unzip-deep-current-javascript-product-qa";

export const REQUIRED_INPUT_KEYS = Object.freeze([
  "predecessorJson",
  "predecessorMarkdown",
  "audioStaticJson",
  "audioStaticMarkdown",
  "deepRawJson",
  "deepRawMarkdown",
  "fqSuccessorJson",
  "fqSuccessorMarkdown",
  "wholeSuccessorJson",
  "wholeSuccessorMarkdown",
  "packageSmoke",
  "packageManifest",
  "packageArchive",
  "packageArchiveSha256",
]);

export const DEFAULT_INPUT_PATHS = Object.freeze({
  predecessorJson: "reports/g5-l4-continuation-machine-readiness.json",
  predecessorMarkdown: "reports/g5-l4-continuation-machine-readiness.md",
  audioStaticJson: "reports/g5-l4-audio-static-cue-reconciliation.json",
  audioStaticMarkdown: "reports/g5-l4-audio-static-cue-reconciliation.md",
  deepRawJson:
    "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1.json",
  deepRawMarkdown:
    "reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1.md",
  fqSuccessorJson:
    "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.json",
  fqSuccessorMarkdown:
    "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.md",
  wholeSuccessorJson:
    "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5.json",
  wholeSuccessorMarkdown:
    "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5.md",
  packageSmoke: "reports/g5-l4-whole-lesson-package-mvp-v6-smoke.json",
  packageManifest:
    "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64/package-manifest.json",
  packageArchive:
    "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip",
  packageArchiveSha256:
    "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip.sha256",
});

export const ACCEPTANCE_EFFECTS = Object.freeze({
  staticSpecificationAccepted: false,
  currentJavascriptProductQaAccepted: false,
  productQaComplete: false,
  migrationQaComplete: false,
  audioStaticCueMapAccepted: false,
  audioRuntimeReachabilityAccepted: false,
  audioListeningAccepted: false,
  audioSpokenLanguageAccepted: false,
  audioSynchronizationAccepted: false,
  authoritativeOriginalRuntime: false,
  naturalNavigationCausalityEstablished: false,
  fullFrameRmseAccepted: false,
  independentHumanVisualReviewAccepted: false,
  ownerFidelityAccepted: false,
  strictComplete: false,
  externalDeploymentAuthorized: false,
  publicReleaseAuthorized: false,
  published: false,
});

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const EXPECTED_ASSERTION_COUNTS = Object.freeze({
  layout: Object.freeze({passed: 648, failed: 0}),
  identity: Object.freeze({passed: 648, failed: 0}),
  overflow: Object.freeze({passed: 648, failed: 0}),
  reducedMotionObservations: Object.freeze({passed: 108, failed: 0}),
  reducedMotionSamples: Object.freeze({passed: 324, failed: 0}),
  replayActivations: Object.freeze({passed: 324, failed: 0}),
});
const REQUIRED_FRESH_TRUE_CLAIMS = Object.freeze([
  "exactReleaseOrder",
  "map",
  "keyTerms",
  "fq",
  "persistence",
  "networkBoundary",
]);
const R5_FQ_EVIDENCE_TYPE =
  "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt";
const R5_WHOLE_EVIDENCE_TYPE =
  "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt";
const FORBIDDEN_BROAD_EXHAUSTION_KEY =
  "machinePreparationExhaustedBeforeHumanGate";
const ROOT_KEYS = Object.freeze([
  "schemaVersion",
  "reportType",
  "releaseId",
  "evidenceState",
  "authority",
  "generator",
  "sourceBindings",
  "inputCurrency",
  "staticSpecificationMachinePreparationExhausted",
  "currentJavascriptDeepProductQaMachineWorkExhausted",
  "audioStaticReconciliationComplete",
  "audioRuntimeReachability",
  "audioListening",
  "audioSpokenLanguage",
  "audioSynchronization",
  "staticSpecificationBoundary",
  "currentJavascriptDeepProductQaBoundary",
  "audioBoundary",
  "finalPackageBoundary",
  "remainingGates",
  "summary",
  "acceptanceEffects",
  "strictAcceptanceEffect",
  "reportFingerprintSha256",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprint(value) {
  return sha256(Buffer.from(stableJson(value), "utf8"));
}

function exactKeys(value, keys, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: expected an object`,
  );
  invariant(
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...keys].sort()),
    `${label}: exact key set drifted`,
  );
}

function allFalse(value, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value) &&
      Object.keys(value).length > 0,
    `${label}: expected a non-empty object`,
  );
  for (const [key, item] of Object.entries(value)) {
    invariant(item === false, `${label}.${key} must remain false`);
  }
}

function resolveProjectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 &&
      !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be portable and project-relative`,
  );
  const absolute = path.resolve(root, relativePath);
  const relative = portable(path.relative(root, absolute));
  invariant(
    relative === relativePath && relative !== ".." &&
      !relative.startsWith("../"),
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolute;
}

async function readFileRecord(root, relativePath, label = relativePath) {
  const resolvedRoot = path.resolve(root);
  const absolute = resolveProjectPath(resolvedRoot, relativePath, label);
  const [before, canonicalRoot, canonicalFile] = await Promise.all([
    lstat(absolute),
    realpath(resolvedRoot),
    realpath(absolute),
  ]).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const relativeCanonical = path.relative(canonicalRoot, canonicalFile);
  invariant(
    relativeCanonical !== ".." &&
      !relativeCanonical.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeCanonical),
    `${label}: resolves outside the project root`,
  );
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(
    before.dev === after.dev && before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs && after.size === bytes.length,
    `${label}: changed while being read`,
  );
  return {
    path: relativePath,
    absolute,
    bytes,
    descriptor: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function readJsonRecord(root, relativePath, label = relativePath) {
  const record = await readFileRecord(root, relativePath, label);
  try {
    return {...record, document: JSON.parse(record.bytes.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function validateDescriptor(value, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value) &&
      typeof value.path === "string" && !path.isAbsolute(value.path) &&
      Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
      SHA256_PATTERN.test(value.sha256 || ""),
    `${label}: invalid descriptor`,
  );
}

function sameDescriptor(actual, expected, label) {
  validateDescriptor(actual, label);
  invariant(
    actual.path === expected.path && actual.bytes === expected.bytes &&
      actual.sha256 === expected.sha256,
    `${label}: stale or mismatched descriptor`,
  );
}

function descriptorOccurrences(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) descriptorOccurrences(item, output);
    return output;
  }
  if (!value || typeof value !== "object") return output;
  if (
    typeof value.path === "string" && Number.isSafeInteger(value.bytes) &&
      typeof value.sha256 === "string"
  ) output.push(value);
  for (const item of Object.values(value)) descriptorOccurrences(item, output);
  return output;
}

function requireDescriptorOccurrence(document, expected, label) {
  const matched = descriptorOccurrences(document).some((candidate) =>
    candidate.path === expected.path && candidate.bytes === expected.bytes &&
      candidate.sha256 === expected.sha256
  );
  invariant(matched, `${label}: exact descriptor is not bound`);
}

function validatePredecessor(predecessor, predecessorMarkdown) {
  validateG5L4ContinuationMachineReadiness(predecessor);
  invariant(
    predecessor.schemaVersion === 1 &&
      predecessor.reportType === "g5-l4-continuation-machine-readiness" &&
      predecessor.releaseId === RELEASE_ID,
    "predecessor continuation identity drifted",
  );
  invariant(
    predecessor.machinePreparation?.specificationCandidates
        ?.remainingAutomaticallyAdvanceableTaskCount === 0 &&
      predecessor.machinePreparation.specificationCandidates
        .safeMachineCandidateWorkAvailableCount === 0,
    "predecessor does not establish static specification machine exhaustion",
  );
  invariant(
    predecessor.summary?.strictCompleteCount === 0 &&
      predecessor.summary.publishedCount === 0 &&
      Object.values(predecessor.acceptanceEffects || {})
        .every((value) => value === false),
    "predecessor crossed an acceptance boundary",
  );
  invariant(
    predecessorMarkdown === renderPredecessorMarkdown(predecessor),
    "predecessor Markdown differs from its validated JSON",
  );
}

function validateAudioStatic(audio, audioMarkdown) {
  validateAudioStaticReport(audio);
  invariant(
    audio.schemaVersion === 1 &&
      audio.artifactType === "g5-l4-audio-static-cue-reconciliation" &&
      audio.releaseId === RELEASE_ID &&
      audio.status ===
        "machine-static-reconciliation-complete-runtime-evidence-unresolved",
    "audio static reconciliation identity drifted",
  );
  invariant(
    audio.summary?.canonicalInventoryCueCount === 373 &&
      audio.summary.inventoryIdentityTriangulatedCount === 373 &&
      audio.summary.runtimeReachabilityEstablishedCueCount === 0 &&
      audio.summary.audibleContentEstablishedCueCount === 0 &&
      audio.summary.spokenLanguageEstablishedFileCount === 0 &&
      audio.summary.synchronizationEstablishedCueCount === 0 &&
      audio.summary.listeningAcceptedCueCount === 0 &&
      audio.summary.ownerAcceptedCueCount === 0 &&
      audio.summary.strictCompleteMemberCount === 0 &&
      audio.summary.publishedMemberCount === 0,
    "audio static/runtime boundary drifted",
  );
  allFalse(audio.acceptanceEffects, "audio.acceptanceEffects");
  invariant(
    audioMarkdown === `${renderAudioStaticMarkdown(audio)}\n`,
    "audio static Markdown differs from its validated JSON",
  );
}

function validateRawDeepQa(raw, records) {
  invariant(
    raw?.schemaVersion === 1 && raw.reportType === RAW_REPORT_TYPE &&
      raw.packageId === PACKAGE_ID,
    "raw deep-QA identity drifted",
  );
  invariant(
    typeof raw.status === "string" && raw.status.startsWith("pass-"),
    "currentJavascriptDeepProductQaMachineWorkExhausted requires a final raw pass-* status",
  );
  for (const [key, expected] of Object.entries(EXPECTED_ASSERTION_COUNTS)) {
    invariant(
      JSON.stringify(raw.assertionCounts?.[key]) === JSON.stringify(expected),
      `raw assertionCounts.${key} is not the final passing count`,
    );
  }
  for (const key of REQUIRED_FRESH_TRUE_CLAIMS) {
    invariant(raw.freshClaims?.[key] === true, `raw freshClaims.${key} must be true`);
  }
  invariant(
    raw.freshClaims?.perPageDirectUrl === false &&
      raw.freshClaims.productQaComplete === false,
    "raw deep-QA overstates v6 routing or product completion",
  );
  invariant(
    raw.releaseBoundary?.expectedMembers === 55 &&
      raw.releaseBoundary.strictCompleteCount === 0 &&
      raw.releaseBoundary.published === false,
    "raw deep-QA release boundary drifted",
  );
  invariant(
    raw.sourceObservation?.sourceCurrentAtObservation === false &&
      raw.sourceObservation.packageSnapshot?.fileCount === 537 &&
      raw.sourceObservation.packageSnapshot.totalBytes === 189628108 &&
      raw.sourceObservation.packageSnapshot.sha256 ===
        "f8e506deb23dfd1c2c9d231d1c80470cab4df9ae91992409d29fc6dc293d955a" &&
      raw.sourceObservation.currentSnapshot?.fileCount === 537 &&
      raw.sourceObservation.currentSnapshot.totalBytes === 189628204 &&
      raw.sourceObservation.currentSnapshot.sha256 ===
        "88e39500a536fd8dae91cf1b907734c6ab88d8b665a7e5562f7b43604b6a2484" &&
      raw.sourceObservation.delta?.fileCount === 0 &&
      raw.sourceObservation.delta.totalBytes === 96 &&
      raw.sourceObservation.delta.sha256Changed === true &&
      String(raw.sourceObservation.driftReason || "")
        .includes("apps/web/tsconfig.json"),
    "raw deep-QA source-observation boundary drifted",
  );
  for (const key of [
    "authoritativeOriginalRuntimeAccepted",
    "originalRuntimeFullFrameAccepted",
    "originalRuntimeNaturalTraversalAccepted",
    "audioAccepted",
    "humanAudioAccepted",
    "humanVisualAccepted",
    "rmseAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
    "lessonStrictComplete",
    "publicReleaseAuthorized",
    "published",
  ]) invariant(raw.acceptanceEffects?.[key] === false, `raw.acceptanceEffects.${key} must remain false`);
  invariant(
    raw.acceptanceEffects?.acceptanceNeutral === true &&
      raw.acceptanceEffects.strictAcceptanceEffect === "none",
    "raw deep-QA acceptance-neutral marker drifted",
  );
  requireDescriptorOccurrence(
    raw,
    records.packageArchive.descriptor,
    "raw/package archive",
  );
  requireDescriptorOccurrence(
    raw,
    records.packageManifest.descriptor,
    "raw/package manifest",
  );
}

function validateR5Common(receipt, kind, records) {
  const isFq = kind === "fq";
  invariant(receipt?.schemaVersion === 3, `${kind} r5 schemaVersion drifted`);
  invariant(
    receipt.evidenceType ===
      (isFq ? R5_FQ_EVIDENCE_TYPE : R5_WHOLE_EVIDENCE_TYPE) &&
      receipt.releaseId === RELEASE_ID &&
      receipt.receiptId ===
        (isFq
          ? "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5"
          : "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5"),
    `${kind} r5 identity drifted`,
  );
  invariant(
    receipt.scope?.packageId === PACKAGE_ID &&
      receipt.scope.networkBoundary === "loopback-only-local-preview" &&
      receipt.scope.previewClass === "private-controlled-ceo-preview" &&
      receipt.scope.g4L3Port3216Touched === false &&
      receipt.scope.externalDeploymentPerformed === false,
    `${kind} r5 scope drifted`,
  );
  invariant(
    receipt.packageEvidence?.packageId === PACKAGE_ID &&
      receipt.packageEvidence.sourceCurrentAtObservation === false &&
      receipt.packageEvidence.packageSourceSnapshot?.sha256 ===
        "f8e506deb23dfd1c2c9d231d1c80470cab4df9ae91992409d29fc6dc293d955a" &&
      receipt.packageEvidence.currentSourceSnapshot?.sha256 ===
        "88e39500a536fd8dae91cf1b907734c6ab88d8b665a7e5562f7b43604b6a2484",
    `${kind} r5 package evidence drifted`,
  );
  sameDescriptor(
    receipt.rawDeepQaEvidence?.report,
    records.deepRawJson.descriptor,
    `${kind} r5/raw report`,
  );
  sameDescriptor(
    receipt.rawDeepQaEvidence?.markdown,
    records.deepRawMarkdown.descriptor,
    `${kind} r5/raw Markdown`,
  );
  invariant(
    receipt.scopeResult?.predecessorClaimsCarriedForward === false &&
      receipt.scopeResult.productQaComplete === false &&
      receipt.scopeResult.migrationQaComplete === false,
    `${kind} r5 completion boundary drifted`,
  );
  allFalse(receipt.acceptanceEffects, `${kind} r5 acceptanceEffects`);
  for (const key of [
    "packageSmoke",
    "packageManifest",
    "packageArchive",
    "packageArchiveSha256",
  ]) requireDescriptorOccurrence(receipt, records[key].descriptor, `${kind} r5/${key}`);
  if (isFq) {
    invariant(
      JSON.stringify(receipt.scope.members) === JSON.stringify([
        "course-g05-l04-fq-002",
        "course-g05-l04-fq-003",
      ]) &&
        receipt.scopeResult.currentJavascriptFq23DeepQaFreshlyEstablished === true &&
        receipt.scopeResult.exactReleaseOrderFreshlyEstablished === true &&
        receipt.scopeResult.fqInteractionFreshlyReperformed === true,
      "FQ r5 deep-QA result drifted",
    );
  } else {
    invariant(
      receipt.scope.releaseMembers === 55 && receipt.scope.activePages === 54 &&
        receipt.scope.courseShells === 1,
      "whole-lesson r5 member scope drifted",
    );
    for (const key of [
      "currentJavascriptWholeLessonDeepQaFreshlyEstablished",
      "exactReleaseOrderFreshlyEstablished",
      "layoutAssertionsFreshlyPassed",
      "reducedMotionAssertionsFreshlyPassed",
      "replayAssertionsFreshlyPassed",
      "courseMapInteractionFreshlyReperformed",
      "keyTermsInteractionFreshlyReperformed",
      "fqInteractionFreshlyReperformed",
      "crossLocalePersistenceFreshlyReperformed",
    ]) invariant(receipt.scopeResult[key] === true, `whole r5 scopeResult.${key} must be true`);
    requireDescriptorOccurrence(
      receipt,
      records.fqSuccessorJson.descriptor,
      "whole r5/FQ r5 child",
    );
  }
}

function validateFinalPackage(smoke, manifest, records) {
  invariant(
    smoke?.schemaVersion === 1 &&
      smoke.reportType === "g5-l4-whole-lesson-package-mvp-v6-smoke" &&
      smoke.packageId === PACKAGE_ID &&
      typeof smoke.status === "string" && smoke.status.startsWith("pass-") &&
      smoke.freshArchiveExtraction === true,
    "final package smoke identity/status drifted",
  );
  sameDescriptor(smoke.archive, records.packageArchive.descriptor, "smoke/archive");
  invariant(
    smoke.packageManifestSha256 === records.packageManifest.descriptor.sha256 &&
      smoke.packageVerifier?.status === "verified" &&
      smoke.packageVerifier.packageId === PACKAGE_ID &&
      smoke.packageVerifier.members === 55 &&
      smoke.packageVerifier.currentJavascriptPages === 54 &&
      smoke.packageVerifier.strictComplete === 0 &&
      smoke.packageVerifier.published === false &&
      smoke.packageVerifier.privacyScan?.status === "pass",
    "final package smoke verification boundary drifted",
  );
  invariant(
    manifest?.schemaVersion === 1 && manifest.packageId === PACKAGE_ID &&
      manifest.release?.releaseId === RELEASE_ID &&
      manifest.release.expectedMembers === 55 &&
      manifest.release.activePages === 54 &&
      manifest.release.strictCompleteCount === 0 &&
      manifest.release.published === false &&
      Object.values(manifest.authority || {}).every((value) => value === false),
    "final package manifest release boundary drifted",
  );
  const sidecar = records.packageArchiveSha256.bytes.toString("utf8").trim();
  const sidecarMatch = /^([a-f0-9]{64})\s+([^/\\\s]+\.zip)$/.exec(sidecar);
  invariant(
    sidecarMatch && sidecarMatch[1] === records.packageArchive.descriptor.sha256 &&
      sidecarMatch[2] === path.basename(records.packageArchive.path),
    "final package archive sidecar does not bind the ZIP",
  );
}

function normalizeInputPaths(inputPaths) {
  exactKeys(inputPaths, REQUIRED_INPUT_KEYS, "input paths");
  return Object.fromEntries(
    REQUIRED_INPUT_KEYS.map((key) => {
      const value = inputPaths[key];
      invariant(typeof value === "string" && value.length > 0, `${key}: missing input path`);
      return [key, value];
    }),
  );
}

function nestedSourceBindings(records) {
  return {
    predecessor: {
      json: records.predecessorJson.descriptor,
      markdown: records.predecessorMarkdown.descriptor,
    },
    audioStaticReconciliation: {
      json: records.audioStaticJson.descriptor,
      markdown: records.audioStaticMarkdown.descriptor,
    },
    currentJavascriptDeepProductQa: {
      rawJson: records.deepRawJson.descriptor,
      rawMarkdown: records.deepRawMarkdown.descriptor,
      fqR5Json: records.fqSuccessorJson.descriptor,
      fqR5Markdown: records.fqSuccessorMarkdown.descriptor,
      wholeR5Json: records.wholeSuccessorJson.descriptor,
      wholeR5Markdown: records.wholeSuccessorMarkdown.descriptor,
    },
    finalPackage: {
      smoke: records.packageSmoke.descriptor,
      manifest: records.packageManifest.descriptor,
      archive: records.packageArchive.descriptor,
      archiveSha256: records.packageArchiveSha256.descriptor,
    },
  };
}

function sourceBindingProjection(sourceBindings) {
  return descriptorOccurrences(sourceBindings)
    .map(({path: itemPath, bytes, sha256: digest}) => ({path: itemPath, bytes, sha256: digest}))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
}

export async function buildReport({
  projectRoot = defaultProjectRoot,
  inputPaths = DEFAULT_INPUT_PATHS,
  generatorPath = GENERATOR_PATH,
} = {}) {
  const root = path.resolve(projectRoot);
  const paths = normalizeInputPaths(inputPaths);
  const records = {};
  for (const key of REQUIRED_INPUT_KEYS) {
    records[key] = key.endsWith("Json") || key === "packageSmoke" ||
        key === "packageManifest"
      ? await readJsonRecord(root, paths[key], key)
      : await readFileRecord(root, paths[key], key);
  }
  records.generator = await readFileRecord(root, generatorPath, "successor generator");

  const predecessor = records.predecessorJson.document;
  const audio = records.audioStaticJson.document;
  const raw = records.deepRawJson.document;
  const fq = records.fqSuccessorJson.document;
  const whole = records.wholeSuccessorJson.document;
  const smoke = records.packageSmoke.document;
  const manifest = records.packageManifest.document;

  validatePredecessor(
    predecessor,
    records.predecessorMarkdown.bytes.toString("utf8"),
  );
  validateAudioStatic(
    audio,
    records.audioStaticMarkdown.bytes.toString("utf8"),
  );
  validateFinalPackage(smoke, manifest, records);
  validateRawDeepQa(raw, records);
  validateR5Common(fq, "fq", records);
  validateR5Common(whole, "whole", records);

  const sourceBindings = nestedSourceBindings(records);
  const sourceProjection = sourceBindingProjection(sourceBindings);
  invariant(sourceProjection.length === REQUIRED_INPUT_KEYS.length, "input binding cardinality drifted");

  const report = {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    releaseId: RELEASE_ID,
    evidenceState:
      "static-specification-and-current-javascript-deep-product-qa-machine-work-exhausted-audio-static-reconciliation-complete-runtime-and-human-gates-pending",
    authority:
      "This deterministic successor separates static specification preparation, current-JavaScript deep product-QA execution, and static audio reconciliation. Its three true machine facts are hash-bound to the listed inputs. They do not establish runtime audio reachability, audible or spoken-language correctness, synchronization, listening acceptance, original-runtime fidelity, human or Owner acceptance, strict completion, deployment, publication, or product/migration QA completion.",
    generator: records.generator.descriptor,
    sourceBindings,
    inputCurrency: {
      boundInputCount: sourceProjection.length,
      inputKeys: [...REQUIRED_INPUT_KEYS],
      inputSetSha256: fingerprint(sourceProjection),
      allInputsCurrent: true,
      predecessorJsonMarkdownPairVerified: true,
      audioJsonMarkdownPairVerified: true,
      rawPassReportBoundToR5Successors: true,
      finalPackageCasVerified: true,
    },
    staticSpecificationMachinePreparationExhausted: true,
    currentJavascriptDeepProductQaMachineWorkExhausted: true,
    audioStaticReconciliationComplete: true,
    audioRuntimeReachability: "pending",
    audioListening: "pending",
    audioSpokenLanguage: "pending",
    audioSynchronization: "pending",
    staticSpecificationBoundary: {
      predecessorReportFingerprintSha256:
        predecessor.reportFingerprintSha256,
      remainingAutomaticallyAdvanceableTaskCount: 0,
      safeMachineCandidateWorkAvailableCount: 0,
      priorBroadAggregateExhaustionNotInherited: true,
      implementationComplete: false,
      fidelityMigrationComplete: false,
      strictComplete: false,
      published: false,
    },
    currentJavascriptDeepProductQaBoundary: {
      derivedOnlyFromFinalRawPass: true,
      rawStatus: raw.status,
      rawReportType: raw.reportType,
      rawPass: true,
      r5FqReceiptId: fq.receiptId,
      r5WholeLessonReceiptId: whole.receiptId,
      exactReleaseOrderFreshlyEstablished: true,
      layoutAssertionCount: 648,
      reducedMotionObservationCount: 108,
      reducedMotionSampleCount: 324,
      replayActivationCount: 324,
      courseMapFreshlyReperformed: true,
      keyTermsFreshlyReperformed: true,
      fqFreshlyReperformed: true,
      persistenceFreshlyReperformed: true,
      sourceCurrentAtObservation: false,
      knownRemediationCount: Array.isArray(raw.knownRemediationsRequired)
        ? raw.knownRemediationsRequired.length
        : 0,
      remediationComplete: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    audioBoundary: {
      staticCueIdentityCount: 373,
      staticCueIdentityTriangulatedCount: 373,
      zeroBlockStructureCount: 267,
      fqExpectedPathCount: 180,
      fqPresentCandidateCount: 83,
      fqMissingSourceCount: 97,
      unmappedCandidateFileCount: 2,
      runtimeReachabilityEstablishedCueCount: 0,
      audibleContentEstablishedCueCount: 0,
      spokenLanguageEstablishedFileCount: 0,
      synchronizationEstablishedCueCount: 0,
      listeningAcceptedCueCount: 0,
      ownerAcceptedCueCount: 0,
      strictCompleteMemberCount: 0,
      publishedMemberCount: 0,
    },
    finalPackageBoundary: {
      packageId: PACKAGE_ID,
      smokeStatus: smoke.status,
      freshArchiveExtraction: true,
      archiveEntryCount: smoke.archiveEntryCount,
      releaseMemberCount: 55,
      activePageCount: 54,
      strictCompleteCount: 0,
      published: false,
      sourceCurrentAtDeepQaObservation: false,
      strictAcceptanceEffect: "none",
    },
    remainingGates: [
      "audio runtime reachability and natural cue traces",
      "audible-content and spoken-language verification",
      "audio start-stop-replay synchronization verification",
      "named-human authorized-original-runtime listening",
      "authoritative original-runtime full-frame evidence and comparison",
      "independent human visual review and Owner fidelity acceptance",
      "strict completion and atomic publication authorization",
    ],
    summary: {
      boundInputCount: sourceProjection.length,
      staticSpecificationMachinePreparationExhausted: true,
      currentJavascriptDeepProductQaMachineWorkExhausted: true,
      audioStaticReconciliationComplete: true,
      audioRuntimeReachabilityPending: true,
      audioListeningPending: true,
      audioSpokenLanguagePending: true,
      audioSynchronizationPending: true,
      currentJavascriptProductQaComplete: false,
      migrationQaComplete: false,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    strictAcceptanceEffect:
      "none; split machine-readiness facts do not establish runtime audio, product or migration acceptance, fidelity, strict completion, deployment, publication, or release",
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return validateReport(report, {expectedSourceBindings: sourceBindings});
}

function rejectForbiddenBroadKey(value, label = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenBroadKey(item, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    invariant(
      key !== FORBIDDEN_BROAD_EXHAUSTION_KEY,
      `${label}: forbidden broad aggregate exhaustion key`,
    );
    rejectForbiddenBroadKey(item, `${label}.${key}`);
  }
}

export function validateReport(report, {expectedSourceBindings} = {}) {
  exactKeys(report, ROOT_KEYS, "successor report");
  invariant(
    report.schemaVersion === 1 && report.reportType === REPORT_TYPE &&
      report.releaseId === RELEASE_ID,
    "successor identity drifted",
  );
  rejectForbiddenBroadKey(report);
  validateDescriptor(report.generator, "generator");
  const bindings = sourceBindingProjection(report.sourceBindings);
  invariant(
    bindings.length === REQUIRED_INPUT_KEYS.length &&
      report.inputCurrency?.boundInputCount === REQUIRED_INPUT_KEYS.length &&
      JSON.stringify(report.inputCurrency.inputKeys) ===
        JSON.stringify(REQUIRED_INPUT_KEYS) &&
      report.inputCurrency.inputSetSha256 === fingerprint(bindings) &&
      report.inputCurrency.allInputsCurrent === true,
    "successor input currency drifted",
  );
  if (expectedSourceBindings) {
    invariant(
      stableJson(report.sourceBindings) === stableJson(expectedSourceBindings),
      "successor source bindings differ from current inputs",
    );
  }
  invariant(
    report.staticSpecificationMachinePreparationExhausted === true &&
      report.staticSpecificationBoundary
        ?.remainingAutomaticallyAdvanceableTaskCount === 0 &&
      report.staticSpecificationBoundary.safeMachineCandidateWorkAvailableCount === 0 &&
      report.staticSpecificationBoundary.priorBroadAggregateExhaustionNotInherited === true &&
      report.staticSpecificationBoundary.implementationComplete === false &&
      report.staticSpecificationBoundary.fidelityMigrationComplete === false &&
      report.staticSpecificationBoundary.strictComplete === false &&
      report.staticSpecificationBoundary.published === false,
    "static specification exhaustion boundary drifted",
  );
  invariant(
    report.currentJavascriptDeepProductQaMachineWorkExhausted === true &&
      report.currentJavascriptDeepProductQaBoundary?.derivedOnlyFromFinalRawPass === true &&
      report.currentJavascriptDeepProductQaBoundary.rawPass === true &&
      typeof report.currentJavascriptDeepProductQaBoundary.rawStatus === "string" &&
      report.currentJavascriptDeepProductQaBoundary.rawStatus.startsWith("pass-") &&
      report.currentJavascriptDeepProductQaBoundary.rawReportType === RAW_REPORT_TYPE &&
      report.currentJavascriptDeepProductQaBoundary.productQaComplete === false &&
      report.currentJavascriptDeepProductQaBoundary.migrationQaComplete === false &&
      report.currentJavascriptDeepProductQaBoundary.remediationComplete === false,
    "current-JavaScript deep product-QA exhaustion is not derived solely from a final raw pass",
  );
  invariant(
    report.audioStaticReconciliationComplete === true &&
      report.audioRuntimeReachability === "pending" &&
      report.audioListening === "pending" &&
      report.audioSpokenLanguage === "pending" &&
      report.audioSynchronization === "pending",
    "audio static/runtime split drifted",
  );
  for (const key of [
    "runtimeReachabilityEstablishedCueCount",
    "audibleContentEstablishedCueCount",
    "spokenLanguageEstablishedFileCount",
    "synchronizationEstablishedCueCount",
    "listeningAcceptedCueCount",
    "ownerAcceptedCueCount",
    "strictCompleteMemberCount",
    "publishedMemberCount",
  ]) invariant(report.audioBoundary?.[key] === 0, `audioBoundary.${key} must remain zero`);
  invariant(
    report.finalPackageBoundary?.packageId === PACKAGE_ID &&
      report.finalPackageBoundary.freshArchiveExtraction === true &&
      report.finalPackageBoundary.strictCompleteCount === 0 &&
      report.finalPackageBoundary.published === false &&
      report.finalPackageBoundary.sourceCurrentAtDeepQaObservation === false &&
      report.finalPackageBoundary.strictAcceptanceEffect === "none",
    "final package boundary drifted",
  );
  exactKeys(report.acceptanceEffects, Object.keys(ACCEPTANCE_EFFECTS), "acceptanceEffects");
  allFalse(report.acceptanceEffects, "acceptanceEffects");
  invariant(
    report.summary?.staticSpecificationMachinePreparationExhausted === true &&
      report.summary.currentJavascriptDeepProductQaMachineWorkExhausted === true &&
      report.summary.audioStaticReconciliationComplete === true &&
      report.summary.audioRuntimeReachabilityPending === true &&
      report.summary.audioListeningPending === true &&
      report.summary.audioSpokenLanguagePending === true &&
      report.summary.audioSynchronizationPending === true &&
      report.summary.currentJavascriptProductQaComplete === false &&
      report.summary.migrationQaComplete === false &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.publishedCount === 0,
    "successor summary boundary drifted",
  );
  const {reportFingerprintSha256, ...fingerprinted} = report;
  invariant(
    SHA256_PATTERN.test(reportFingerprintSha256 || "") &&
      reportFingerprintSha256 === fingerprint(fingerprinted),
    "successor report fingerprint is stale",
  );
  return report;
}

export function renderMarkdown(report) {
  validateReport(report);
  return `# G5 L4 continuation machine-readiness successor

> Split machine-readiness evidence only. No acceptance effect is changed.

## Result

- Static specification machine preparation exhausted: **${report.staticSpecificationMachinePreparationExhausted}**.
- Current-JavaScript deep product-QA machine work exhausted: **${report.currentJavascriptDeepProductQaMachineWorkExhausted}**, derived only from raw status \`${report.currentJavascriptDeepProductQaBoundary.rawStatus}\`.
- Audio static reconciliation complete: **${report.audioStaticReconciliationComplete}** (${report.audioBoundary.staticCueIdentityTriangulatedCount}/${report.audioBoundary.staticCueIdentityCount} cue identities triangulated).
- Audio runtime reachability: **${report.audioRuntimeReachability}**.
- Audio listening: **${report.audioListening}**.
- Audio spoken-language verification: **${report.audioSpokenLanguage}**.
- Audio synchronization: **${report.audioSynchronization}**.

## Current-JavaScript deep QA

- Exact release order, Course Map, Key Terms, FQ, persistence, layout, reduced motion, and Replay were freshly exercised against the hash-bound final package.
- Layout assertions: **${report.currentJavascriptDeepProductQaBoundary.layoutAssertionCount}**; reduced-motion rows/samples: **${report.currentJavascriptDeepProductQaBoundary.reducedMotionObservationCount}/${report.currentJavascriptDeepProductQaBoundary.reducedMotionSampleCount}**; Replay activations: **${report.currentJavascriptDeepProductQaBoundary.replayActivationCount}**.
- Source current at observation: **${report.currentJavascriptDeepProductQaBoundary.sourceCurrentAtObservation}**; the QA subject was the immutable fresh-unzip package.
- Product QA complete: **false**; migration QA complete: **false**; remediation complete: **false**.

## Audio boundary

- Canonical cues: **${report.audioBoundary.staticCueIdentityCount}**; zero-block structures: **${report.audioBoundary.zeroBlockStructureCount}**.
- FQ paths present/missing: **${report.audioBoundary.fqPresentCandidateCount}/${report.audioBoundary.fqMissingSourceCount}** of ${report.audioBoundary.fqExpectedPathCount}; unmapped physical candidates: **${report.audioBoundary.unmappedCandidateFileCount}**.
- Runtime-reachable, audible, spoken-language-established, synchronized, listened, Owner-accepted, strict, and published counts remain **0**.

## Authority boundary

The predecessor's earlier broad aggregate exhaustion claim is intentionally not inherited. Static specification preparation, current-JavaScript deep-QA execution, and static audio reconciliation are reported separately. All acceptance effects remain \`false\`; strict acceptance effect remains \`none\`.

Report fingerprint: \`${report.reportFingerprintSha256}\`.
`;
}

function outputPaths(outputPrefix) {
  invariant(
    typeof outputPrefix === "string" && outputPrefix.startsWith("reports/") &&
      !outputPrefix.endsWith(".json") && !outputPrefix.endsWith(".md") &&
      !outputPrefix.includes("\\") && !outputPrefix.split("/").includes(".."),
    "output prefix must be a safe extensionless reports/ path",
  );
  return [`${outputPrefix}.json`, `${outputPrefix}.md`];
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveProjectPath(root, relativePath, relativePath);
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Refusing to overwrite existing output: ${relativePath}`);
}

async function verifyCurrentBindings(root, report) {
  const expected = [report.generator, ...sourceBindingProjection(report.sourceBindings)];
  for (const binding of expected) {
    const current = await readFileRecord(root, binding.path, `current binding ${binding.path}`);
    sameDescriptor(current.descriptor, binding, `current binding ${binding.path}`);
  }
}

export async function writeOrCheck({
  projectRoot = defaultProjectRoot,
  outputPrefix,
  report,
  check = false,
} = {}) {
  const root = path.resolve(projectRoot);
  validateReport(report);
  await verifyCurrentBindings(root, report);
  const [jsonPath, markdownPath] = outputPaths(outputPrefix);
  const expected = [
    {path: jsonPath, bytes: Buffer.from(stableJson(report), "utf8")},
    {path: markdownPath, bytes: Buffer.from(renderMarkdown(report), "utf8")},
  ];
  if (check) {
    for (const output of expected) {
      const current = await readFileRecord(root, output.path, `checked output ${output.path}`);
      invariant(current.bytes.equals(output.bytes), `${output.path}: differs from current builder`);
    }
    return {action: "verified", outputs: expected.map(({path: outputPath, bytes}) => ({
      path: outputPath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    }))};
  }
  for (const output of expected) await assertAbsent(root, output.path);
  const created = [];
  try {
    for (const output of expected) {
      const absolute = resolveProjectPath(root, output.path, output.path);
      const handle = await open(absolute, "wx", 0o444);
      created.push({absolute, handle});
      await handle.writeFile(output.bytes);
      await handle.sync();
      await handle.close();
    }
  } catch (error) {
    for (const item of created) {
      try { await item.handle.close(); } catch {}
    }
    for (const item of created) {
      try { await unlink(item.absolute); } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") throw cleanupError;
      }
    }
    throw error;
  }
  return {action: "created", outputs: expected.map(({path: outputPath, bytes}) => ({
    path: outputPath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  }))};
}

const INPUT_FLAGS = Object.freeze({
  "--predecessor-json": "predecessorJson",
  "--predecessor-md": "predecessorMarkdown",
  "--audio-static-json": "audioStaticJson",
  "--audio-static-md": "audioStaticMarkdown",
  "--deep-raw-json": "deepRawJson",
  "--deep-raw-md": "deepRawMarkdown",
  "--fq-successor-json": "fqSuccessorJson",
  "--fq-successor-md": "fqSuccessorMarkdown",
  "--whole-successor-json": "wholeSuccessorJson",
  "--whole-successor-md": "wholeSuccessorMarkdown",
  "--package-smoke": "packageSmoke",
  "--package-manifest": "packageManifest",
  "--package-archive": "packageArchive",
  "--package-archive-sha256": "packageArchiveSha256",
});

export function parseArguments(argv) {
  const options = {
    help: false,
    check: false,
    projectRoot: defaultProjectRoot,
    outputPrefix: null,
    inputPaths: {...DEFAULT_INPUT_PATHS},
  };
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") {
      invariant(argv.length === 1, "--help cannot be combined with other options");
      options.help = true;
      continue;
    }
    if (value === "--check") {
      invariant(!seen.has(value), "duplicate --check");
      seen.add(value);
      options.check = true;
      continue;
    }
    const inputKey = INPUT_FLAGS[value];
    const recognized = inputKey || value === "--root" || value === "--output-prefix";
    invariant(recognized, `Unknown option: ${value}`);
    invariant(!seen.has(value), `Duplicate option: ${value}`);
    const next = argv[++index];
    invariant(next && !next.startsWith("--"), `${value} requires a value`);
    seen.add(value);
    if (inputKey) options.inputPaths[inputKey] = next;
    else if (value === "--root") options.projectRoot = path.resolve(next);
    else options.outputPrefix = next;
  }
  if (!options.help) {
    invariant(options.outputPrefix, "--output-prefix is required; no canonical report is generated by default");
    outputPaths(options.outputPrefix);
    normalizeInputPaths(options.inputPaths);
  }
  return options;
}

export function usage() {
  return `Usage: node ${GENERATOR_PATH} --output-prefix reports/<new-successor> [--check] [input overrides]

All input paths have explicit r5/v6 defaults and may be overridden with the
documented --predecessor-*, --audio-static-*, --deep-raw-*, --fq-successor-*,
--whole-successor-*, and --package-* flags. No output prefix is defaulted.
Without --check, the JSON/Markdown pair is created with exclusive-create
semantics; --check is read-only and requires an existing exact pair.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const report = await buildReport({
    projectRoot: options.projectRoot,
    inputPaths: options.inputPaths,
  });
  const result = await writeOrCheck({
    projectRoot: options.projectRoot,
    outputPrefix: options.outputPrefix,
    report,
    check: options.check,
  });
  process.stdout.write(
    `${result.action.toUpperCase()}: ${result.outputs.map((item) => `${item.path}=${item.sha256}`).join(" ")}; split machine facts only, all acceptance effects false\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
