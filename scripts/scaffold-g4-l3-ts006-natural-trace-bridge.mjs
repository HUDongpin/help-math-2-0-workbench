#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  verifyDisposableProfileSelectionTransaction,
} from "./select-g4-l3-ts006-disposable-runtime-profiles.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
export const TS006_ANIMATION_ID = "course-g04-l03-ts-006";

const MIGRATION_DIRECTORY = `migrations/${TS006_ANIMATION_ID}`;
const TRACE_INDEX_PATH = "migrations/course-shell-pilot-trace-spec-index.json";
const SESSION_KIT_READINESS_PATH =
  "reports/g4-l3-ts006-original-runtime-session-kit-readiness.json";
const PROFILE_SELECTION_PATH =
  "work/g4-l3-ts006-original-runtime-authorization-intake/current-session-profile-selection.json";
const PROFILE_SELECTION_TRANSACTION_ROOT =
  "work/g4-l3-ts006-original-runtime-authorization-intake/profile-selection-transactions";
const PROFILE_READINESS_PATH =
  "reports/g4-l3-ts006-current-account-profile-readiness.json";
const CONTAINMENT_PATH =
  "reports/g4-l3-original-runtime-containment-readiness.json";
const RUNTIME_ENVIRONMENT_PATH =
  "reports/g4-l3-original-runtime-environment-readiness.json";
const HOST_MANIFEST_PATH =
  "work/original-runtime-host-trees/course-g04-l03-ts-006/root/staging-manifest.json";

const EXPECTED_TRACE_FILES = Object.freeze([
  `${MIGRATION_DIRECTORY}/audit/trace-specs/req-root-lesson-shell-natural-entry-en.json`,
  `${MIGRATION_DIRECTORY}/audit/trace-specs/req-root-lesson-shell-natural-entry-es.json`,
  `${MIGRATION_DIRECTORY}/audit/trace-specs/req-sprite-23-lesson-shell-natural-entry-en.json`,
  `${MIGRATION_DIRECTORY}/audit/trace-specs/req-sprite-23-lesson-shell-natural-entry-es.json`,
]);

const EXPECTED_DOMAINS = Object.freeze({
  root: Object.freeze({ firstFrame: 1, lastFrame: 10, frameCount: 10 }),
  "sprite-23": Object.freeze({ firstFrame: 1, lastFrame: 128, frameCount: 128 }),
});

const EXPECTED_STEP_IDS = Object.freeze({
  en: Object.freeze([
    "select-host-language",
    "navigate-same-lesson-host-to-ts006",
    "observe-root-preloader-handoff",
    "observe-natural-begin-and-nested-entry",
    "observe-first-natural-terminal",
    "invoke-host-native-replay",
    "observe-second-natural-terminal",
    "exercise-previous-next-and-natural-return",
    "close-runtime-and-record-postconditions",
  ]),
  es: Object.freeze([
    "navigate-same-lesson-host-to-ts006",
    "observe-root-preloader-handoff",
    "observe-natural-begin-and-nested-entry",
    "invoke-page-spanish-narration",
    "observe-first-natural-terminal",
    "invoke-host-native-replay",
    "observe-second-natural-terminal",
    "exercise-previous-next-and-natural-return",
    "close-runtime-and-record-postconditions",
  ]),
});

const EXPECTED_HOST_ENTRY_EVENTS = Object.freeze([
  "profile-empty-preflight",
  "projector-process-started-empty",
  "named-human-file-open-selected-staged-host",
  "same-lesson-host-loaded",
  "same-lesson-natural-navigation-target-resolved",
  "ts006-root-entry-observed",
  "ts006-nested-entry-observed",
  "post-session-side-effect-summary",
]);

const LOG_DEFINITIONS = Object.freeze({
  operation: Object.freeze({
    evidenceType: "ts006-original-runtime-operation-event",
    previousHashField: "previousEventSha256",
    ownHashField: "eventSha256",
  }),
  state: Object.freeze({
    evidenceType: "ts006-original-runtime-state-observation",
    previousHashField: "previousRecordSha256",
    ownHashField: "recordSha256",
  }),
  "source-target": Object.freeze({
    evidenceType: "ts006-original-runtime-source-target-resolution",
    previousHashField: "previousRecordSha256",
    ownHashField: "recordSha256",
  }),
  "host-entry": Object.freeze({
    evidenceType: "ts006-original-runtime-host-entry-event",
    previousHashField: "previousRecordSha256",
    ownHashField: "recordSha256",
  }),
});

const AUTHORITY_FALSE = Object.freeze({
  authoritativeOriginalRuntimeTrace: false,
  authoritativeBaseline: false,
  baselineAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicRelease: false,
});

function fail(message) {
  throw new Error(`TS006 natural-trace bridge: ${message}`);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Canonical(value) {
  return sha256Bytes(Buffer.from(canonicalJson(value)));
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertSha256(value, label) {
  assert(
    typeof value === "string" && /^[a-f0-9]{64}$/u.test(value),
    `${label} must be a lowercase SHA-256`,
  );
}

function assertFalseAcceptance(record, label) {
  for (const key of Object.keys(AUTHORITY_FALSE)) {
    if (Object.hasOwn(record || {}, key) && record[key] !== false) {
      fail(`${label}.${key} must remain false`);
    }
  }
}

function withoutField(document, field) {
  const clone = structuredClone(document);
  delete clone[field];
  return clone;
}

function expectedFingerprint(document, field, pretty = false) {
  const stable = stableValue(withoutField(document, field));
  const text = pretty
    ? `${JSON.stringify(stable, null, 2)}\n`
    : JSON.stringify(stable);
  return sha256Bytes(Buffer.from(text));
}

function verifyFingerprint(document, field, label, pretty = false) {
  assertSha256(document?.[field], `${label}.${field}`);
  assert(
    document[field] === expectedFingerprint(document, field, pretty),
    `${label}.${field} does not match the document`,
  );
}

function relativePath(repositoryRoot, requestedPath, label) {
  assert(typeof requestedPath === "string" && requestedPath.length > 0, `${label} path missing`);
  assert(!path.isAbsolute(requestedPath), `${label} must be repository-relative`);
  const resolved = path.resolve(repositoryRoot, requestedPath);
  const relative = path.relative(repositoryRoot, resolved);
  assert(
    relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${label} escapes the repository root`,
  );
  return resolved;
}

async function readRegularFile(repositoryRoot, requestedPath, label) {
  const absolutePath = relativePath(repositoryRoot, requestedPath, label);
  const stat = await lstat(absolutePath);
  assert(stat.isFile() && !stat.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  const bytes = await readFile(absolutePath);
  return {
    path: requestedPath,
    absolutePath,
    bytes,
    byteCount: bytes.length,
    sha256: sha256Bytes(bytes),
  };
}

async function readJsonFile(repositoryRoot, requestedPath, label) {
  const file = await readRegularFile(repositoryRoot, requestedPath, label);
  let document;
  try {
    document = JSON.parse(file.bytes.toString("utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
  return { ...file, document };
}

async function verifyBoundFile(repositoryRoot, binding, label) {
  assert(isPlainObject(binding), `${label} binding missing`);
  const filePath = binding.path || binding.file;
  const file = await readRegularFile(repositoryRoot, filePath, label);
  if (binding.bytes !== undefined) {
    assert(file.byteCount === binding.bytes, `${label} byte count drifted`);
  }
  assert(file.sha256 === binding.sha256, `${label} SHA-256 drifted`);
  return file;
}

function descriptorForJson(file, document) {
  return {
    path: file.path,
    bytes: file.byteCount,
    sha256: file.sha256,
    schemaVersion: document.schemaVersion ?? null,
    artifactType: document.artifactType ?? document.reportType ?? document.evidenceType ?? null,
  };
}

function scheduleStepSha256(step) {
  return sha256Canonical(step);
}

function exactIdentityFromSpec(spec, file) {
  return {
    requirementId: spec.requirementId,
    traceId: spec.identity.traceId,
    frameDomainId: spec.identity.frameDomainId,
    scenario: spec.identity.scenario,
    language: spec.identity.language,
    seed: spec.identity.seed,
    entryStateSha256: spec.identity.entryStateSha256,
    requiredRange: structuredClone(spec.identity.requiredRange),
    traceSpecPath: file.path,
    traceSpecSha256: file.sha256,
  };
}

function expectedFileFor(domain, language) {
  return `${MIGRATION_DIRECTORY}/audit/trace-specs/req-${domain === "root" ? "root" : "sprite-23"}-lesson-shell-natural-entry-${language}.json`;
}

function validateOneTraceSpec(spec, file, coverageRequirement) {
  assert(spec.schemaVersion === 1, `${file.path} schemaVersion must be 1`);
  assert(
    spec.artifactType === "course-pilot-original-runtime-trace-specification",
    `${file.path} artifactType mismatch`,
  );
  assert(spec.animationId === TS006_ANIMATION_ID, `${file.path} animationId mismatch`);
  assert(isPlainObject(spec.identity), `${file.path} identity missing`);
  const { language, frameDomainId } = spec.identity;
  assert(["en", "es"].includes(language), `${file.path} language must be en or es`);
  assert(Object.hasOwn(EXPECTED_DOMAINS, frameDomainId), `${file.path} frame domain is not TS006 root/sprite-23`);
  assert(file.path === expectedFileFor(frameDomainId, language), `${file.path} is not the expected TS006 filename`);
  assert(
    spec.requirementId === `req:${frameDomainId}:lesson-shell-natural-entry:${language}`,
    `${file.path} requirementId mismatch`,
  );
  assert(
    spec.identity.traceId === `trace:${frameDomainId}:lesson-shell-natural-entry:${language}:seed-0`,
    `${file.path} traceId mismatch`,
  );
  assert(spec.identity.seed === "0", `${file.path} seed must be string 0`);
  assert(
    spec.identity.baselineAuthorityRequirement === "original-runtime-natural-trace",
    `${file.path} authority requirement mismatch`,
  );
  assert(
    canonicalJson(spec.identity.requiredRange) === canonicalJson({
      firstFrame: EXPECTED_DOMAINS[frameDomainId].firstFrame,
      lastFrame: EXPECTED_DOMAINS[frameDomainId].lastFrame,
    }),
    `${file.path} required range mismatch`,
  );
  assert(spec.frameDomain?.id === frameDomainId, `${file.path} frameDomain.id mismatch`);
  assert(
    spec.frameDomain?.frameCount === EXPECTED_DOMAINS[frameDomainId].frameCount,
    `${file.path} frame count mismatch`,
  );
  assert(
    spec.frameDomain?.nativeStage?.width === 800 &&
      spec.frameDomain?.nativeStage?.height === 600 &&
      spec.frameDomain?.fps === 12,
    `${file.path} native stage/FPS mismatch`,
  );
  assert(
    sha256Canonical(spec.entryState) === spec.identity.entryStateSha256,
    `${file.path} entryStateSha256 mismatch`,
  );
  assert(
    canonicalJson({
      requirementId: coverageRequirement.requirementId,
      traceId: coverageRequirement.traceId,
      frameDomainId: coverageRequirement.frameDomainId,
      scenario: coverageRequirement.scenario,
      language: coverageRequirement.language,
      seed: coverageRequirement.seed,
      entryState: coverageRequirement.entryState,
      entryStateSha256: coverageRequirement.entryStateSha256,
      requiredRange: coverageRequirement.requiredRange,
      baselineAuthorityRequirement: coverageRequirement.baselineAuthorityRequirement,
    }) === canonicalJson({
      requirementId: spec.requirementId,
      traceId: spec.identity.traceId,
      frameDomainId,
      scenario: spec.identity.scenario,
      language,
      seed: spec.identity.seed,
      entryState: spec.entryState,
      entryStateSha256: spec.identity.entryStateSha256,
      requiredRange: spec.identity.requiredRange,
      baselineAuthorityRequirement: spec.identity.baselineAuthorityRequirement,
    }),
    `${file.path} does not exactly project the current coverage requirement`,
  );

  const steps = spec.schedule?.orderedSteps;
  assert(Array.isArray(steps), `${file.path} orderedSteps missing`);
  assert(steps.length === EXPECTED_STEP_IDS[language].length, `${file.path} must contain exactly nine scheduled steps`);
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    assert(step.order === index + 1, `${file.path} step order is not contiguous`);
    assert(step.id === EXPECTED_STEP_IDS[language][index], `${file.path} step ${index + 1} id mismatch`);
    assert(isPlainObject(step.action), `${file.path} step ${step.id} action missing`);
    assert(isPlainObject(step.sourceTarget), `${file.path} step ${step.id} sourceTarget missing`);
  }
  assert(
    steps.some((step) => step.action.kind === "host-native-replay"),
    `${file.path} lacks required host-native Replay action`,
  );
  if (language === "es") {
    const audioStep = steps.find((step) => step.id === "invoke-page-spanish-narration");
    assert(audioStep?.action?.kind === "page-spanish-narration-release", `${file.path} Spanish audio action missing`);
    assert(audioStep?.action?.event === "pointer-release-inside", `${file.path} Spanish audio event mismatch`);
    assert(
      audioStep?.sourceTarget?.callee === "_root.doPlaySpanishAudio",
      `${file.path} Spanish audio source target mismatch`,
    );
  }
  assert(
    spec.acquisitionPlan?.primary?.directSeekAllowed === false,
    `${file.path} primary natural trace must forbid direct seek`,
  );
  assert(
    spec.acquisitionPlan?.primary?.acquisitionMode === "primary-natural-same-lesson-host-trace",
    `${file.path} primary acquisition mode mismatch`,
  );
  if (frameDomainId === "root") {
    assert(
      spec.acquisitionPlan?.supplemental?.[0]?.acquisitionMode ===
        "supplemental-sequential-frame-step-after-natural-trace",
      `${file.path} root supplement must be separately labeled`,
    );
    assert(
      Array.isArray(spec.acquisitionPlan?.supplemental?.[0]?.forbiddenClaims) &&
        spec.acquisitionPlan.supplemental[0].forbiddenClaims.includes("natural playback"),
      `${file.path} root supplement does not exclude natural-playback authority`,
    );
  }
  assert(
    spec.executionEvidence?.status === "not-executed-by-this-generator" &&
      spec.executionEvidence?.executionReport === null &&
      spec.executionEvidence?.originalRuntimeCaptureManifest === null &&
      spec.executionEvidence?.executedSteps?.length === 0,
    `${file.path} must remain an unexecuted specification`,
  );
}

export function validateTs006TraceSpecSet({
  traceFiles,
  traceIndex,
  migrationManifest,
  coverage,
  scenarioInventory,
}) {
  assert(Array.isArray(traceFiles) && traceFiles.length === 4, "exactly four TS006 trace specs are required");
  assert(
    canonicalJson(traceFiles.map((item) => item.file.path).sort()) === canonicalJson([...EXPECTED_TRACE_FILES].sort()),
    "trace spec file set differs from the exact TS006 four-file set",
  );
  assert(migrationManifest.id === TS006_ANIMATION_ID || migrationManifest.animationId === TS006_ANIMATION_ID, "migration manifest identity mismatch");
  assert(coverage.animationId === TS006_ANIMATION_ID, "coverage animationId mismatch");
  assert(scenarioInventory.animationId === TS006_ANIMATION_ID, "scenario inventory animationId mismatch");

  const manifestProjection = technicalManifestSha256(migrationManifest);
  const coverageProjection = traceCoverageSha256(coverage);
  const inventoryProjection = scenarioInventorySha256(scenarioInventory);
  const pilot = traceIndex.pilots?.find((item) => item.animationId === TS006_ANIMATION_ID);
  assert(pilot, "TS006 pilot missing from trace-spec index");
  assert(pilot.requirementCount === 4 && pilot.traceSpecs?.length === 4, "trace-spec index does not bind exactly four TS006 requirements");
  assert(pilot.technicalBindings?.manifest?.sha256 === manifestProjection, "trace index manifest projection drifted");
  assert(pilot.technicalBindings?.coverage?.sha256 === coverageProjection, "trace index coverage projection drifted");
  assert(pilot.technicalBindings?.scenarioInventory?.sha256 === inventoryProjection, "trace index scenario projection drifted");

  const coverageById = new Map(coverage.requirements.map((item) => [item.requirementId, item]));
  const indexByFile = new Map(pilot.traceSpecs.map((item) => [item.file, item]));
  for (const { file, spec } of traceFiles) {
    const requirement = coverageById.get(spec.requirementId);
    assert(requirement, `${file.path} has no current coverage requirement`);
    validateOneTraceSpec(spec, file, requirement);
    assert(spec.sourceBindings?.migrationManifest?.sha256 === manifestProjection, `${file.path} manifest projection drifted`);
    assert(spec.sourceBindings?.fullFrameCoverage?.sha256 === coverageProjection, `${file.path} coverage projection drifted`);
    assert(spec.sourceBindings?.scenarioInventory?.sha256 === inventoryProjection, `${file.path} scenario projection drifted`);
    const indexed = indexByFile.get(file.path);
    assert(indexed, `${file.path} missing from trace index`);
    assert(indexed.sha256 === file.sha256, `${file.path} indexed SHA-256 drifted`);
    assert(indexed.requirementId === spec.requirementId, `${file.path} indexed requirement mismatch`);
    assert(indexed.traceId === spec.identity.traceId, `${file.path} indexed trace mismatch`);
    assert(indexed.frameDomainId === spec.identity.frameDomainId, `${file.path} indexed domain mismatch`);
    assert(indexed.language === spec.identity.language, `${file.path} indexed language mismatch`);
  }
  return {
    manifestProjectionSha256: manifestProjection,
    coverageProjectionSha256: coverageProjection,
    scenarioInventoryProjectionSha256: inventoryProjection,
    pilot,
  };
}

async function verifyHostTree(repositoryRoot, hostManifestFile, hostManifest) {
  verifyFingerprint(hostManifest, "manifestFingerprintSha256", "host-tree manifest", true);
  assert(hostManifest.reportType === "g4-l3-ts006-read-only-original-runtime-host-tree", "host-tree report type mismatch");
  assert(hostManifest.stagedRoot?.path === path.dirname(hostManifestFile.path), "host-tree staged root mismatch");
  assert(hostManifest.stagedRoot?.directoryMode === "0555", "host-tree root mode contract mismatch");
  assert(hostManifest.stagedRoot?.fileMode === "0444", "host-tree file mode contract mismatch");
  assert(hostManifest.stagedRoot?.symbolicLinks === 0, "host-tree manifest reports symbolic links");
  assert(hostManifest.stagedRoot?.hardLinks === 0, "host-tree manifest reports hard links");

  const rootPath = relativePath(repositoryRoot, hostManifest.stagedRoot.path, "host-tree root");
  const rootStat = await lstat(rootPath);
  assert(rootStat.isDirectory() && !rootStat.isSymbolicLink(), "host-tree root is not a real directory");
  assert((rootStat.mode & 0o777) === 0o555, "host-tree root physical mode is not 0555");
  const setRows = [];
  let totalBytes = 0;
  for (const entry of hostManifest.files) {
    assert(!path.isAbsolute(entry.path) && !entry.path.split(path.sep).includes(".."), `host-tree file path escapes: ${entry.path}`);
    const absolutePath = path.resolve(rootPath, entry.path);
    const relative = path.relative(rootPath, absolutePath);
    assert(relative && !relative.startsWith(`..${path.sep}`), `host-tree file path escapes: ${entry.path}`);
    const stat = await lstat(absolutePath);
    assert(stat.isFile() && !stat.isSymbolicLink(), `host-tree member is not a regular file: ${entry.path}`);
    assert(stat.nlink === 1, `host-tree member has a hard link: ${entry.path}`);
    assert((stat.mode & 0o777) === 0o444, `host-tree member mode drifted: ${entry.path}`);
    const bytes = await readFile(absolutePath);
    assert(bytes.length === entry.bytes, `host-tree member byte count drifted: ${entry.path}`);
    assert(sha256Bytes(bytes) === entry.sha256, `host-tree member SHA-256 drifted: ${entry.path}`);
    totalBytes += bytes.length;
    setRows.push(`${entry.path}\t${entry.bytes}\t${entry.sha256}\t${entry.stagedMode}`);
  }
  assert(hostManifest.summary.files === hostManifest.files.length, "host-tree summary file count mismatch");
  assert(hostManifest.summary.bytes === totalBytes, "host-tree summary bytes mismatch");
  assert(sha256Bytes(Buffer.from(setRows.join("\n"))) === hostManifest.fileSetSha256, "host-tree file-set SHA-256 mismatch");
  return {
    path: hostManifest.stagedRoot.path,
    manifestPath: hostManifestFile.path,
    manifestSha256: hostManifestFile.sha256,
    manifestFingerprintSha256: hostManifest.manifestFingerprintSha256,
    fileSetSha256: hostManifest.fileSetSha256,
    files: hostManifest.files.length,
    bytes: totalBytes,
    physicalMode: "0555-root/0444-files",
    symbolicLinks: 0,
    hardLinks: 0,
  };
}

export function validateTs006ProfileReadinessPredecessorProof({
  selection,
  selectionFile,
  selectedProfile,
  profileFile,
  readinessBinding,
  transactionVerification,
  transactionPreimageFile,
  transactionReceiptFile,
} = {}) {
  assert(isPlainObject(selection), "profile selection document missing");
  assert(isPlainObject(selectionFile), "profile selection file descriptor missing");
  assert(isPlainObject(selectedProfile), "selected profile descriptor missing");
  assert(isPlainObject(profileFile), "selected profile file descriptor missing");
  assert(isPlainObject(readinessBinding), "profile creation-time readiness binding missing");
  assert(isPlainObject(transactionVerification), "profile selection transaction verification missing");
  assert(isPlainObject(transactionPreimageFile), "profile selection transaction preimage missing");
  assert(isPlainObject(transactionReceiptFile), "profile selection transaction receipt missing");

  const transaction = selection.selectionTransaction;
  assert(isPlainObject(transaction), "profile selection transaction metadata missing");
  assertSha256(transaction.transactionId, "profile selection transaction ID");
  assertSha256(transaction.previousSelectionSha256, "profile selection transaction previous selection");
  const transactionDirectory =
    `${PROFILE_SELECTION_TRANSACTION_ROOT}/${transaction.transactionId}`;
  const expectedPreimagePath =
    `${transactionDirectory}/preimage/current-session-profile-selection.json`;
  const expectedReceiptPath = `${transactionDirectory}/selection-receipt.json`;
  assert(
    transaction.immutablePreimagePath === expectedPreimagePath &&
      transaction.immutableReceiptPath === expectedReceiptPath,
    "profile selection immutable transaction paths do not bind the current transaction ID",
  );

  assert(
    transactionVerification.mode === "verified" &&
      transactionVerification.transactionId === transaction.transactionId &&
      transactionVerification.FlashLaunched === false &&
      transactionVerification.runtimeAuthorityCreated === false &&
      transactionVerification.acceptanceAuthorityCreated === false &&
      transactionVerification.strictAcceptanceEffect === "none",
    "profile selection transaction verifier did not return an acceptance-neutral verified receipt",
  );
  assert(
    transactionVerification.selection?.path === PROFILE_SELECTION_PATH &&
      transactionVerification.selection?.bytes === selectionFile.byteCount &&
      transactionVerification.selection?.sha256 === selectionFile.sha256,
    "profile selection transaction verification was replayed against a different current selection",
  );
  assert(
    transactionVerification.preimage?.path === expectedPreimagePath &&
      transactionVerification.preimage?.bytes === transactionPreimageFile.byteCount &&
      transactionVerification.preimage?.sha256 === transactionPreimageFile.sha256 &&
      transactionVerification.preimage?.readOnly === true,
    "profile selection transaction verification does not bind the immutable preimage",
  );
  assert(
    transactionVerification.receipt?.path === expectedReceiptPath &&
      transactionVerification.receipt?.bytes === transactionReceiptFile.byteCount &&
      transactionVerification.receipt?.sha256 === transactionReceiptFile.sha256 &&
      transactionVerification.receipt?.readOnly === true,
    "profile selection transaction verification does not bind the immutable receipt",
  );
  assert(
    canonicalJson(transactionVerification.profiles) === canonicalJson(selection.profiles),
    "profile selection transaction verification profile set was replayed or changed",
  );

  assert(
    transactionPreimageFile.path === expectedPreimagePath &&
      transactionPreimageFile.sha256 === transaction.previousSelectionSha256,
    "profile selection transaction preimage is not the exact declared predecessor",
  );
  const receipt = transactionReceiptFile.document;
  verifyFingerprint(
    receipt,
    "receiptFingerprintSha256",
    "profile selection transaction receipt",
  );
  assert(
    receipt.schemaVersion === 1 &&
      receipt.evidenceType ===
        "g4-l3-ts006-disposable-profile-selection-cas-receipt" &&
      receipt.status === "profile-selection-replaced-by-fail-closed-cas" &&
      receipt.transactionId === transaction.transactionId &&
      receipt.before?.path === PROFILE_SELECTION_PATH &&
      receipt.before?.sha256 === transactionPreimageFile.sha256 &&
      receipt.before?.bytes === transactionPreimageFile.byteCount &&
      receipt.before?.immutablePreimagePath === expectedPreimagePath &&
      receipt.after?.path === PROFILE_SELECTION_PATH &&
      receipt.after?.sha256 === selectionFile.sha256 &&
      receipt.after?.bytes === selectionFile.byteCount,
    "profile selection receipt is stale, replayed, or does not bind its exact preimage/current selection",
  );
  assert(
    receipt.writeBoundary?.sourceAssetsWritten === false &&
      receipt.writeBoundary?.profilesCreated === 0 &&
      receipt.writeBoundary?.profilesDeleted === 0 &&
      receipt.writeBoundary?.FlashLaunched === false &&
      receipt.writeBoundary?.canonicalLedgersWritten === false &&
      receipt.executionGate?.projectorLaunched === false &&
      receipt.executionGate?.runtimeSessionExecuted === false &&
      receipt.executionGate?.originalRuntimeExecutionReady === false &&
      receipt.strictAcceptanceEffect === "none",
    "profile selection receipt contains a runtime, mutation, authority, or acceptance effect",
  );
  assert(receipt.acceptance?.acceptanceNeutral === true, "profile selection receipt is not acceptance-neutral");
  assertFalseAcceptance(receipt.acceptance, "profile selection receipt acceptance");
  assert(
    canonicalJson(receipt.selectedProfiles) === canonicalJson(selection.profiles),
    "profile selection receipt selected-profile set differs from the current selection",
  );
  assert(
    canonicalJson(receipt.writer) === canonicalJson(transaction.writer) &&
      canonicalJson(receipt.writeBoundary?.exactDurableFileAllowlist) ===
        canonicalJson(transaction.exactDurableWriteAllowlist) &&
      canonicalJson(receipt.writeBoundary?.exactDurableDirectoryAllowlist) ===
        canonicalJson(transaction.exactDurableDirectoryAllowlist) &&
      canonicalJson(receipt.writeBoundary?.exactEphemeralFileAllowlist) ===
        canonicalJson(transaction.exactEphemeralWriteAllowlist),
    "profile selection receipt write-boundary bindings differ from the current selection",
  );
  const recomputedTransactionId = sha256Canonical({
    animationId: TS006_ANIMATION_ID,
    previousSelectionSha256: transactionPreimageFile.sha256,
    profiles: selection.profiles,
    writerSha256: receipt.writer?.sha256,
  });
  assert(
    recomputedTransactionId === transaction.transactionId,
    "profile selection transaction identity does not bind its exact predecessor/profile/writer inputs",
  );

  const verifiedSelectedProfile = transactionVerification.profiles.find(
    (item) => item.language === selectedProfile.language,
  );
  const receiptSelectedProfile = receipt.selectedProfiles.find(
    (item) => item.language === selectedProfile.language,
  );
  assert(
    canonicalJson(verifiedSelectedProfile) === canonicalJson(selectedProfile) &&
      canonicalJson(receiptSelectedProfile) === canonicalJson(selectedProfile) &&
      selectedProfile.manifestPath === profileFile.path &&
      selectedProfile.manifestSha256 === profileFile.sha256,
    `${selectedProfile.language} profile manifest is not the exact profile bound by the immutable selection transaction`,
  );
  assert(
    readinessBinding.path === PROFILE_READINESS_PATH &&
      Number.isInteger(readinessBinding.bytes) &&
      readinessBinding.bytes > 0,
    `${selectedProfile.language} profile creation-time readiness descriptor is malformed`,
  );
  assertSha256(
    readinessBinding.sha256,
    `${selectedProfile.language} profile creation-time readiness SHA-256`,
  );

  return {
    path: readinessBinding.path,
    bytes: readinessBinding.bytes,
    sha256: readinessBinding.sha256,
    validationMode:
      "immutable-profile-manifest-plus-fail-closed-selection-cas-predecessor",
    transactionId: transaction.transactionId,
    predecessorSelectionSha256: transactionPreimageFile.sha256,
    selectionReceiptPath: transactionReceiptFile.path,
    selectionReceiptSha256: transactionReceiptFile.sha256,
    verifiedByExistingSelectionTransactionVerifier: true,
    currentReadinessEqualityRequired: false,
    runtimeAuthorityCreated: false,
    acceptanceAuthorityCreated: false,
    strictAcceptanceEffect: "none",
  };
}

async function verifyEmptyProfile(
  repositoryRoot,
  selection,
  profileReadiness,
  blockers,
  profileSelectionProof,
) {
  const profileFile = await readJsonFile(repositoryRoot, selection.manifestPath, `${selection.language} selected profile`);
  assert(profileFile.sha256 === selection.manifestSha256, `${selection.language} selected profile SHA-256 drifted`);
  const profile = profileFile.document;
  verifyFingerprint(profile, "manifestFingerprintSha256", `${selection.language} profile manifest`);
  assert(profile.animationId === TS006_ANIMATION_ID, `${selection.language} profile animationId mismatch`);
  assert(profile.language === selection.language, `${selection.language} profile language mismatch`);
  assert(profile.sessionId === selection.sessionId, `${selection.language} session ID mismatch`);
  assert(profile.status === "empty-profile-candidate-not-authorized-not-launched", `${selection.language} selected profile is not empty/unlaunched`);
  assert(profile.executionGate?.projectorLaunched === false, `${selection.language} profile reports Projector launch`);
  assert(profile.executionGate?.runtimeSessionExecuted === false, `${selection.language} profile reports runtime execution`);
  assert(profile.executionGate?.launchCommand === null, `${selection.language} profile unexpectedly contains a launch command`);
  assertFalseAcceptance(profile.acceptance, `${selection.language} profile acceptance`);

  const sandboxPath = profile.sandbox?.path;
  assert(path.isAbsolute(sandboxPath), `${selection.language} sandbox path must be absolute`);
  const repositoryReal = await realpath(repositoryRoot);
  const sandboxReal = await realpath(sandboxPath);
  assert(
    sandboxReal.startsWith(`${repositoryReal}${path.sep}`),
    `${selection.language} sandbox escapes repository root`,
  );
  const sandboxStat = await lstat(sandboxPath);
  assert(sandboxStat.isFile() && !sandboxStat.isSymbolicLink(), `${selection.language} sandbox is not a regular file`);
  const sandboxBytes = await readFile(sandboxPath);
  assert(sandboxBytes.length === profile.sandbox.bytes, `${selection.language} sandbox byte count drifted`);
  assert(sha256Bytes(sandboxBytes) === selection.sandboxSha256, `${selection.language} selected sandbox SHA-256 drifted`);
  assert(selection.sandboxSha256 === profile.sandbox.sha256, `${selection.language} sandbox binding mismatch`);
  assert(profile.sandbox.policy.includes("(deny network*)"), `${selection.language} sandbox lacks network deny`);

  const sessionRoot = path.dirname(profileFile.absolutePath);
  const expectedEmpty = [
    "runtime-profile/home/Library/Preferences/Macromedia/Flash Player/#SharedObjects",
    "evidence/raw-frames",
    "evidence/raw-captures",
    "evidence/audio",
    "evidence/logs",
  ];
  for (const relative of expectedEmpty) {
    const directory = path.resolve(sessionRoot, relative);
    const stat = await lstat(directory);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), `${selection.language} empty profile directory missing: ${relative}`);
    assert((await readdir(directory)).length === 0, `${selection.language} empty profile directory is no longer empty: ${relative}`);
  }
  assert(
    Object.values(profile.emptyState).every((value) => value === 0),
    `${selection.language} empty-state counters are nonzero`,
  );

  const readinessCandidate = profileReadiness.preparedProfileCandidates?.find(
    (candidate) => candidate.language === selection.language,
  );
  assert(readinessCandidate?.sessionId === selection.sessionId, `${selection.language} profile readiness session mismatch`);
  assert(readinessCandidate?.manifest?.sha256 === profileFile.sha256, `${selection.language} profile readiness manifest drifted`);
  assert(readinessCandidate?.sandbox?.sha256 === selection.sandboxSha256, `${selection.language} profile readiness sandbox drifted`);

  const creationTimeReadinessBinding =
    validateTs006ProfileReadinessPredecessorProof({
      ...profileSelectionProof,
      selectedProfile: selection,
      profileFile,
      readinessBinding: profile.sourceBindings?.readiness,
    });

  for (const [bindingName, binding] of Object.entries(profile.sourceBindings || {})) {
    if (!binding?.path || !binding?.sha256) continue;
    if (bindingName === "readiness") {
      // The selected manifest binds the readiness report that existed when the
      // profile was created. The fail-closed CAS writer verified that exact
      // source before selection, then the current readiness report was
      // intentionally regenerated from the new selection. Requiring equality
      // with that downstream report would create circular invalidation.
      continue;
    }
    let actual;
    try {
      if (path.isAbsolute(binding.path)) {
        const stat = await lstat(binding.path);
        assert(
          stat.isFile() && !stat.isSymbolicLink(),
          `${selection.language} absolute profile source ${bindingName} is not a regular file`,
        );
        const bytes = await readFile(binding.path);
        actual = {
          byteCount: bytes.length,
          sha256: sha256Bytes(bytes),
        };
      } else {
        actual = await readRegularFile(repositoryRoot, binding.path, `${selection.language} profile source ${bindingName}`);
      }
    } catch (error) {
      blockers.push(`profile-${selection.language}-source-binding-unavailable:${bindingName}`);
      continue;
    }
    if (actual.sha256 !== binding.sha256 || (binding.bytes !== undefined && actual.byteCount !== binding.bytes)) {
      blockers.push(`profile-${selection.language}-source-binding-stale:${bindingName}`);
    }
  }

  return {
    language: selection.language,
    sessionId: selection.sessionId,
    manifestPath: profileFile.path,
    manifestSha256: profileFile.sha256,
    manifestFingerprintSha256: profile.manifestFingerprintSha256,
    sandboxPath,
    sandboxSha256: selection.sandboxSha256,
    emptyProfilePhysicallyVerified: true,
    creationTimeReadinessBinding,
    projectorLaunched: false,
    runtimeSessionExecuted: false,
  };
}

async function buildInputs(repositoryRoot) {
  const migration = await readJsonFile(repositoryRoot, `${MIGRATION_DIRECTORY}/migration.json`, "TS006 migration manifest");
  const coverage = await readJsonFile(repositoryRoot, `${MIGRATION_DIRECTORY}/evidence/full-frame-coverage.json`, "TS006 coverage");
  const inventory = await readJsonFile(repositoryRoot, `${MIGRATION_DIRECTORY}/audit/scenario-inventory.json`, "TS006 scenario inventory");
  const traceIndex = await readJsonFile(repositoryRoot, TRACE_INDEX_PATH, "course pilot trace-spec index");
  const traceFiles = await Promise.all(EXPECTED_TRACE_FILES.map(async (filePath) => {
    const file = await readJsonFile(repositoryRoot, filePath, `TS006 trace spec ${filePath}`);
    return { file, spec: file.document };
  }));
  const projectionBindings = validateTs006TraceSpecSet({
    traceFiles,
    traceIndex: traceIndex.document,
    migrationManifest: migration.document,
    coverage: coverage.document,
    scenarioInventory: inventory.document,
  });

  const sourceSwfBinding = traceFiles[0].spec.sourceBindings.sourceSwf;
  const sourceSwf = await verifyBoundFile(repositoryRoot, sourceSwfBinding, "TS006 source SWF");
  for (const trace of traceFiles) {
    assert(canonicalJson(trace.spec.sourceBindings.sourceSwf) === canonicalJson(sourceSwfBinding), `${trace.file.path} source SWF binding differs`);
  }

  const hostManifestFile = await readJsonFile(repositoryRoot, HOST_MANIFEST_PATH, "TS006 host-tree manifest");
  const hostTree = await verifyHostTree(repositoryRoot, hostManifestFile, hostManifestFile.document);
  const hostShellEntry = hostManifestFile.document.files.find(
    (entry) => entry.path === "HELP_COURSES/ELMGR4/L3/index_local.swf",
  );
  assert(hostShellEntry, "host tree lacks HELP_COURSES/ELMGR4/L3/index_local.swf");

  const kitReadiness = await readJsonFile(repositoryRoot, SESSION_KIT_READINESS_PATH, "TS006 session-kit readiness");
  verifyFingerprint(kitReadiness.document, "reportFingerprintSha256", "TS006 session-kit readiness");
  assert(kitReadiness.document.readiness?.runtimeSessionsExecuted === 0, "session-kit readiness reports a runtime execution");
  assert(kitReadiness.document.readiness?.originalRuntimeExecutionReady === false, "session-kit readiness unexpectedly says execution-ready");
  assertFalseAcceptance(kitReadiness.document.acceptance, "session-kit readiness acceptance");

  const containment = await readJsonFile(repositoryRoot, CONTAINMENT_PATH, "G4 L3 containment readiness");
  const runtimeEnvironment = await readJsonFile(repositoryRoot, RUNTIME_ENVIRONMENT_PATH, "G4 L3 runtime environment readiness");
  assert(containment.document.executionGate?.originalRuntimeExecutionReady === false, "containment report unexpectedly says execution-ready");
  assert(runtimeEnvironment.document.acceptance?.runtimeApproved === false, "runtime environment unexpectedly says runtime-approved");

  const selectionFile = await readJsonFile(repositoryRoot, PROFILE_SELECTION_PATH, "TS006 current profile selection");
  const selection = selectionFile.document;
  verifyFingerprint(selection, "selectionFingerprintSha256", "TS006 profile selection");
  assert(selection.state === "empty-profile-candidates-not-authorized-not-launched", "selected profiles are not in the empty/unlaunched state");
  assert(selection.runtimeSessionsExecuted === 0, "profile selection reports runtime execution");
  assert(selection.profiles?.length === 2, "profile selection must contain exactly EN and ES");
  assert(canonicalJson(selection.profiles.map((item) => item.language).sort()) === canonicalJson(["en", "es"]), "profile selection languages mismatch");
  assertFalseAcceptance(selection.acceptance, "profile selection acceptance");
  const transactionId = selection.selectionTransaction?.transactionId;
  assertSha256(transactionId, "TS006 profile selection transaction ID");
  let profileSelectionTransactionVerification;
  try {
    profileSelectionTransactionVerification =
      await verifyDisposableProfileSelectionTransaction({
        projectRoot: repositoryRoot,
        transactionId,
      });
  } catch (error) {
    fail(`profile selection transaction verification failed: ${error.message}`);
  }
  const [
    profileSelectionTransactionPreimage,
    profileSelectionTransactionReceipt,
  ] = await Promise.all([
    readJsonFile(
      repositoryRoot,
      selection.selectionTransaction.immutablePreimagePath,
      "TS006 profile selection immutable preimage",
    ),
    readJsonFile(
      repositoryRoot,
      selection.selectionTransaction.immutableReceiptPath,
      "TS006 profile selection immutable receipt",
    ),
  ]);

  const profileReadiness = await readJsonFile(repositoryRoot, PROFILE_READINESS_PATH, "TS006 profile readiness");
  verifyFingerprint(profileReadiness.document, "reportFingerprintSha256", "TS006 profile readiness");
  assert(profileReadiness.document.executionGate?.runtimeSessionsExecuted === 0, "profile readiness reports runtime execution");
  assert(profileReadiness.document.executionGate?.originalRuntimeExecutionReady === false, "profile readiness unexpectedly says execution-ready");
  assertFalseAcceptance(profileReadiness.document.acceptance, "profile readiness acceptance");
  assert(
    profileReadiness.document.sourceBindings?.profileSelection?.path ===
      PROFILE_SELECTION_PATH &&
      profileReadiness.document.sourceBindings.profileSelection.bytes ===
        selectionFile.byteCount &&
      profileReadiness.document.sourceBindings.profileSelection.sha256 ===
        selectionFile.sha256,
    "current profile readiness does not bind the exact current profile selection",
  );

  const blockers = [];
  const profiles = [];
  const profileSelectionProof = {
    selection,
    selectionFile,
    transactionVerification: profileSelectionTransactionVerification,
    transactionPreimageFile: profileSelectionTransactionPreimage,
    transactionReceiptFile: profileSelectionTransactionReceipt,
  };
  for (const selected of selection.profiles) {
    profiles.push(
      await verifyEmptyProfile(
        repositoryRoot,
        selected,
        profileReadiness.document,
        blockers,
        profileSelectionProof,
      ),
    );
  }

  const kits = [];
  for (const language of ["en", "es"]) {
    const descriptor = kitReadiness.document.kitManifests.find((item) => item.language === language);
    assert(descriptor, `${language} session kit missing from readiness`);
    const file = await readJsonFile(repositoryRoot, descriptor.path, `${language} session kit`);
    assert(file.sha256 === descriptor.sha256 && file.byteCount === descriptor.bytes, `${language} session-kit readiness binding drifted`);
    const kit = file.document;
    verifyFingerprint(kit, "kitFingerprintSha256", `${language} session kit`);
    assert(kit.language === language && kit.animationId === TS006_ANIMATION_ID, `${language} session kit identity mismatch`);
    assert(kit.status === "immutable-empty-template-awaiting-external-signatures-and-live-preflight", `${language} session kit is not an empty template`);
    assert(kit.executionGate?.runtimeSessionExecuted === false, `${language} session kit reports runtime execution`);
    assert(kit.executionGate?.originalRuntimeExecutionReady === false, `${language} session kit unexpectedly says execution-ready`);
    assertFalseAcceptance(kit.acceptance, `${language} session-kit acceptance`);
    assert(kit.runtimeHost?.manifestSha256 === hostManifestFile.sha256, `${language} kit host manifest drifted`);
    assert(kit.runtimeHost?.fileSetSha256 === hostTree.fileSetSha256, `${language} kit host file set drifted`);
    assert(kit.runtimeHost?.shell?.sha256 === hostShellEntry.sha256, `${language} kit host shell drifted`);
    for (const [templateName, binding] of Object.entries(kit.templateDocumentBindings || {})) {
      const templatePath = `${path.dirname(file.path)}/${templateName}`;
      await verifyBoundFile(repositoryRoot, { path: templatePath, ...binding }, `${language} kit template ${templateName}`);
    }
    const currentRequirements = traceFiles
      .filter((trace) => trace.spec.identity.language === language)
      .map((trace) => exactIdentityFromSpec(trace.spec, trace.file));
    const kitRequirements = kit.sessionIdentity?.coverageRequirements || [];
    for (const current of currentRequirements) {
      const bound = kitRequirements.find((item) => item.requirementId === current.requirementId);
      if (!bound || canonicalJson({
        requirementId: bound.requirementId,
        traceId: bound.traceId,
        frameDomainId: bound.frameDomainId,
        scenario: bound.scenario,
        language: bound.language,
        entryStateSha256: bound.entryStateSha256,
        requiredRange: bound.requiredRange,
      }) !== canonicalJson({
        requirementId: current.requirementId,
        traceId: current.traceId,
        frameDomainId: current.frameDomainId,
        scenario: current.scenario,
        language: current.language,
        entryStateSha256: current.entryStateSha256,
        requiredRange: current.requiredRange,
      })) {
        blockers.push(`session-kit-${language}-coverage-binding-stale:${current.requirementId}`);
      }
    }
    kits.push({
      language,
      path: file.path,
      bytes: file.byteCount,
      sha256: file.sha256,
      kitFingerprintSha256: kit.kitFingerprintSha256,
      projector: structuredClone(kit.runtime.executable),
      projectorVersion: kit.runtime.version,
      coverageRequirementsCurrent: blockers.every((blocker) => !blocker.startsWith(`session-kit-${language}-coverage-binding-stale:`)),
    });
  }

  const projector = kits[0].projector;
  assert(canonicalJson(projector) === canonicalJson(kits[1].projector), "EN/ES Projector bindings differ");
  const projectorStat = await lstat(projector.path);
  assert(projectorStat.isFile() && !projectorStat.isSymbolicLink(), "Projector executable is not a regular file");
  const projectorBytes = await readFile(projector.path);
  assert(projectorBytes.length === projector.bytes, "Projector executable byte count drifted");
  assert(sha256Bytes(projectorBytes) === projector.sha256, "Projector executable SHA-256 drifted");

  blockers.push(
    "external-owner-and-containment-signatures-not-bound",
    "external-trust-root-not-bound",
    "named-independent-review-role-not-bound",
    "live-no-egress-preflight-not-passed",
    "live-capacity-preflight-not-passed",
    "projector-point-in-time-signature-reverification-required",
    "trace-specs-remain-pending-candidate-unexecuted",
  );
  if (containment.document.executionGate?.originalRuntimeExecutionReady !== true) {
    blockers.push("containment-execution-gate-closed");
  }
  if (profileReadiness.document.executionGate?.originalRuntimeExecutionReady !== true) {
    blockers.push("profile-execution-gate-closed");
  }
  if (kitReadiness.document.readiness?.originalRuntimeExecutionReady !== true) {
    blockers.push("session-kit-execution-gate-closed");
  }

  return {
    migration,
    coverage,
    inventory,
    traceIndex,
    traceFiles,
    projectionBindings,
    sourceSwf,
    hostManifestFile,
    hostTree,
    hostShellEntry,
    kitReadiness,
    containment,
    runtimeEnvironment,
    selectionFile,
    selection,
    profileSelectionTransactionVerification,
    profileSelectionTransactionPreimage,
    profileSelectionTransactionReceipt,
    profileReadiness,
    profiles,
    kits,
    projector,
    blockers: [...new Set(blockers)].sort(),
  };
}

function commonBindingContract(inputs, language, traceSpecSetSha256) {
  const kit = inputs.kits.find((item) => item.language === language);
  const profile = inputs.profiles.find((item) => item.language === language);
  return {
    animationId: TS006_ANIMATION_ID,
    language,
    sessionId: profile.sessionId,
    requirementIds: inputs.traceFiles
      .filter((item) => item.spec.identity.language === language)
      .map((item) => item.spec.requirementId)
      .sort(),
    traceSpecSetSha256,
    sessionKitSha256: kit.sha256,
    profileManifestSha256: profile.manifestSha256,
    hostTreeManifestSha256: inputs.hostManifestFile.sha256,
    projectorExecutableSha256: inputs.projector.sha256,
    runtimeEnvironmentReadinessSha256: inputs.runtimeEnvironment.sha256,
    containmentReadinessSha256: inputs.containment.sha256,
  };
}

function schemaTemplate(kind) {
  const definition = LOG_DEFINITIONS[kind];
  const kindRequired = {
    operation: [
      "scheduledOrder",
      "scheduledStepId",
      "scheduledStepSha256",
      "action",
      "sourceTargetRecordSha256",
      "preStateRecordSha256",
      "postStateCheckpointSha256",
      "result",
    ],
    state: [
      "scheduledOrder",
      "scheduledStepId",
      "scheduledStepSha256",
      "checkpointRole",
      "expectedState",
      "frameDomainId",
      "rootFrame",
      "localFrame",
      "observedState",
      "observedStateSha256",
      "screenshotFile",
      "screenshotSha256",
      "width",
      "height",
      "causalOperationEventSha256",
    ],
    "source-target": [
      "scheduledOrder",
      "scheduledStepId",
      "scheduledStepSha256",
      "expectedSourceTarget",
      "resolvedSourceTarget",
      "resolutionEvidenceSha256",
    ],
    "host-entry": [
      "hostEntryEvent",
      "processId",
      "observedRootFrame",
      "observedLocalFrame",
      "evidenceLocator",
      "evidenceSha256",
    ],
  }[kind];
  return {
    schemaVersion: 1,
    artifactType: "ts006-hash-chain-jsonl-schema-template",
    status: "schema-only-no-runtime-evidence",
    logKind: kind,
    evidenceType: definition.evidenceType,
    encoding: "one canonical JSON object per line; no comments; append-only after live external authorization",
    requiredFields: [
      "schemaVersion",
      "evidenceType",
      "animationId",
      "language",
      "sessionId",
      "requirementIds",
      "traceSpecSetSha256",
      "bridgeInputFingerprintSha256",
      "sessionKitSha256",
      "profileManifestSha256",
      "hostTreeManifestSha256",
      "projectorExecutableSha256",
      "runtimeEnvironmentReadinessSha256",
      "containmentReadinessSha256",
      "sequence",
      "occurredAt",
      "monotonicTimeMs",
      "operator",
      definition.previousHashField,
      ...kindRequired,
      definition.ownHashField,
    ],
    previousHashField: definition.previousHashField,
    ownHashField: definition.ownHashField,
    firstRecordPreviousHash: null,
    conditionalRequirements: kind === "operation"
      ? {
          "invoke-host-native-replay": [
            "replayObservation.controlResolved=true",
            "replayObservation.fullStateVectorResetObserved=true",
            "replayObservation.resetStateVectorSha256",
          ],
          "observe-second-natural-terminal": [
            "replayCycleObservation.cycle=2",
            "replayCycleObservation.terminalObserved=true",
            "replayCycleObservation.terminalStateSha256",
          ],
          "invoke-page-spanish-narration (es only)": [
            "audioObservation.requestedRuntimePath",
            "audioObservation.sourceAudioBytesSha256",
            "audioObservation.successfulLoadObserved=true",
            "audioObservation.audibilityObserved=true",
            "audioObservation.spokenLanguage=es",
            "audioObservation.completionObserved=true",
            "audioObservation.synchronizationObserved=true",
            "audioObservation.losslessSessionAudioFile",
            "audioObservation.losslessSessionAudioSha256",
            "audioObservation.triggerMonotonicTimeMs",
          ],
        }
      : kind === "host-entry"
        ? {
            "profile-empty-preflight": [
              "emptyProfileVerified=true",
              "sharedObjectFileCount=0",
              "rawEvidenceFileCount=0",
              "livePreflightReceiptSha256",
            ],
            "projector-process-started-empty": [
              "freshProcess=true",
              "processExecutableSha256",
              "processId",
            ],
            "named-human-file-open-selected-staged-host": [
              "humanFileOpenObserved=true",
              "openedFilePath",
              "openedFileSha256",
              "directChildSwfOpened=false",
            ],
            "same-lesson-natural-navigation-target-resolved": [
              "naturalNavigation=true",
              "targetAnimationId=course-g04-l03-ts-006",
              "directSeekUsed=false",
            ],
            "post-session-side-effect-summary": [
              "processExited=true",
              "outboundNetworkSucceededCount=0",
              "persistentSideEffectCount=0",
              "sharedObjectFileCount=0",
              "requestAuditSha256",
            ],
          }
      : {},
    authority: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
}

function sessionContract(inputs, language, traceSpecSetSha256) {
  const traceSpecs = inputs.traceFiles
    .filter((item) => item.spec.identity.language === language)
    .sort((left, right) => left.spec.identity.frameDomainId.localeCompare(right.spec.identity.frameDomainId));
  const schedule = traceSpecs[0].spec.schedule.orderedSteps;
  const spanishAudioStep = schedule.find((step) => step.id === "invoke-page-spanish-narration");
  const root = traceSpecs.find((item) => item.spec.identity.frameDomainId === "root");
  const nested = traceSpecs.find((item) => item.spec.identity.frameDomainId === "sprite-23");
  assert(
    canonicalJson(root.spec.schedule.orderedSteps) === canonicalJson(nested.spec.schedule.orderedSteps),
    `${language} root/nested schedules differ`,
  );
  const commonBindings = commonBindingContract(inputs, language, traceSpecSetSha256);
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-session-contract",
    status: "unsigned-template-only-not-evidence",
    ...commonBindings,
    bridgeInputFingerprintSha256: null,
    traceSpecs: traceSpecs.map((item) => exactIdentityFromSpec(item.spec, item.file)),
    schedule: schedule.map((step) => ({
      order: step.order,
      id: step.id,
      scheduledStepSha256: scheduleStepSha256(step),
      action: structuredClone(step.action),
      sourceTarget: structuredClone(step.sourceTarget),
      preStateCheckpoint: structuredClone(step.preStateCheckpoint),
      postStateCheckpoint: structuredClone(step.postStateCheckpoint),
      terminalEffect: structuredClone(step.terminalEffect ?? null),
    })),
    requiredHostEntryEvents: [...EXPECTED_HOST_ENTRY_EVENTS],
    hostEntryContract: {
      selectedHostShellPath:
        "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf",
      selectedHostShellSha256: inputs.hostShellEntry.sha256,
      directChildSwfOpenAllowed: false,
      sameLessonNaturalNavigationRequired: true,
      rootEntryMustPrecedeNestedEntry: true,
    },
    naturalEntry: {
      sameLessonHostRequired: true,
      directChildSwfOpenAllowed: false,
      primaryDirectSeekAllowed: false,
      rootDomainRequired: { id: "root", firstFrame: 1, lastFrame: 10 },
      nestedDomainRequired: { id: "sprite-23", firstFrame: 1, lastFrame: 128 },
      rootSupplement: {
        status: "separate-supplement-after-primary-natural-trace-only",
        acquisitionMode: "supplemental-sequential-frame-step-after-natural-trace",
        mayProveNaturalPlayback: false,
        mayProveReachability: false,
        mayProveReplay: false,
        mayProveAudioSynchronization: false,
      },
    },
    replay: {
      required: true,
      actionStepId: "invoke-host-native-replay",
      secondCycleTerminalStepId: "observe-second-natural-terminal",
      fullStateVectorResetMustBeObserved: true,
    },
    audio: language === "es"
      ? {
          required: true,
          actionStepId: "invoke-page-spanish-narration",
          actionKind: "page-spanish-narration-release",
          expectedCallee: "_root.doPlaySpanishAudio",
          requestedRuntimePathCandidate:
            spanishAudioStep.postStateCheckpoint.expectedState.requestedRuntimePathCandidate,
          requestedAudioCandidateSha256:
            spanishAudioStep.postStateCheckpoint.expectedState.requestedAudioCandidateSha256,
          actualLoadAudibilityLanguageAndSynchronizationMustBeObserved: true,
          sourceBytesMustBeHashBound: true,
          sessionAudioMustBeLosslessAndTimestamped: true,
        }
      : {
          required: false,
          noSpanishAudioAuthorityMayBeClaimed: true,
        },
    logs: Object.fromEntries(
      Object.entries(LOG_DEFINITIONS).map(([kind, definition]) => [
        kind,
        {
          file: `${kind}.jsonl`,
          evidenceType: definition.evidenceType,
          previousHashField: definition.previousHashField,
          ownHashField: definition.ownHashField,
        },
      ]),
    ),
    executionGate: {
      executionReady: false,
      mustBeRebuiltAndReverifiedAfterEveryInputChange: true,
      liveExternalAuthorizationRequired: true,
      liveContainmentPreflightRequired: true,
      namedHumanOperatorRequired: true,
    },
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
}

export async function buildTs006NaturalTraceBridge({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
} = {}) {
  const root = await realpath(repositoryRoot);
  const inputs = await buildInputs(root);
  const traceSpecs = inputs.traceFiles
    .map(({ file, spec }) => ({
      ...exactIdentityFromSpec(spec, file),
      bytes: file.byteCount,
      traceSpecStatus: spec.traceSpecStatus,
      scheduleStatus: spec.schedule.status,
      executed: false,
    }))
    .sort((left, right) => left.traceSpecPath.localeCompare(right.traceSpecPath));
  const traceSpecSetSha256 = sha256Canonical(traceSpecs);
  const inputBindings = {
    migrationManifest: descriptorForJson(inputs.migration, inputs.migration.document),
    fullFrameCoverage: descriptorForJson(inputs.coverage, inputs.coverage.document),
    scenarioInventory: descriptorForJson(inputs.inventory, inputs.inventory.document),
    traceSpecIndex: descriptorForJson(inputs.traceIndex, inputs.traceIndex.document),
    sourceSwf: {
      path: inputs.sourceSwf.path,
      bytes: inputs.sourceSwf.byteCount,
      sha256: inputs.sourceSwf.sha256,
    },
    sessionKitReadiness: descriptorForJson(inputs.kitReadiness, inputs.kitReadiness.document),
    profileSelection: descriptorForJson(inputs.selectionFile, inputs.selection),
    profileSelectionTransaction: {
      transactionId: inputs.profileSelectionTransactionVerification.transactionId,
      verificationMode: inputs.profileSelectionTransactionVerification.mode,
      preimage: descriptorForJson(
        inputs.profileSelectionTransactionPreimage,
        inputs.profileSelectionTransactionPreimage.document,
      ),
      receipt: descriptorForJson(
        inputs.profileSelectionTransactionReceipt,
        inputs.profileSelectionTransactionReceipt.document,
      ),
      verifiedByExistingSelectionTransactionVerifier: true,
      FlashLaunched: false,
      runtimeAuthorityCreated: false,
      acceptanceAuthorityCreated: false,
      strictAcceptanceEffect: "none",
    },
    profileReadiness: descriptorForJson(inputs.profileReadiness, inputs.profileReadiness.document),
    containmentReadiness: descriptorForJson(inputs.containment, inputs.containment.document),
    runtimeEnvironmentReadiness: descriptorForJson(inputs.runtimeEnvironment, inputs.runtimeEnvironment.document),
    hostTreeManifest: descriptorForJson(inputs.hostManifestFile, inputs.hostManifestFile.document),
    projectionBindings: {
      technicalManifestSha256: inputs.projectionBindings.manifestProjectionSha256,
      traceCoverageSha256: inputs.projectionBindings.coverageProjectionSha256,
      scenarioInventorySha256: inputs.projectionBindings.scenarioInventoryProjectionSha256,
    },
  };
  const bridgeInputFingerprintSha256 = sha256Canonical({
    traceSpecs,
    inputBindings,
    hostTree: inputs.hostTree,
    profiles: inputs.profiles,
    kits: inputs.kits,
    projector: inputs.projector,
    blockers: inputs.blockers,
  });
  const sessions = ["en", "es"].map((language) => {
    const contract = sessionContract(inputs, language, traceSpecSetSha256);
    contract.bridgeInputFingerprintSha256 = bridgeInputFingerprintSha256;
    return contract;
  });
  const manifest = {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-hash-chain-capture-bridge",
    status: "unsigned-template-only-not-evidence",
    animationId: TS006_ANIMATION_ID,
    purpose: "Fail-closed bridge from the exact current TS006 natural-trace specifications and empty session inputs to future append-only, hash-chained original-runtime logs.",
    prohibitions: [
      "This bridge launches no Flash runtime and performs no screen/audio capture.",
      "This bridge is not an execution report, baseline, full-frame capture, RMSE result, review, owner signature, acceptance record, or release record.",
      "No old current-admin diagnostic capture is promoted or adopted.",
      "No direct child SWF open or direct seek may serve as primary natural-entry evidence.",
      "No canonical migration, coverage, candidate, completion-ledger, release-ledger, or product-registry file may be written by this bridge.",
    ],
    diagnosticPromotionPerformed: false,
    excludedDiagnosticEvidenceClasses: [
      "prior-current-admin-diagnostic-capture",
      "synthetic-ScreenCaptureKit-fixture",
      "Ruffle-reference-playback",
      "current-JavaScript-capture",
    ],
    traceSpecSetSha256,
    bridgeInputFingerprintSha256,
    traceSpecs,
    inputBindings,
    readOnlyHostTree: inputs.hostTree,
    projector: {
      ...inputs.projector,
      version: inputs.kits[0].projectorVersion,
      pointInTimeSignatureMustBeReverifiedImmediatelyBeforeAnyAuthorizedSession: true,
    },
    selectedProfiles: inputs.profiles,
    sessionKits: inputs.kits,
    sessions,
    logSchemas: Object.fromEntries(
      Object.keys(LOG_DEFINITIONS).map((kind) => [kind, schemaTemplate(kind)]),
    ),
    executionGate: {
      executionReady: false,
      blockerCount: inputs.blockers.length,
      blockers: inputs.blockers,
      pendingCandidateOnly: true,
      liveGateMayNotBeSelfApprovedByThisScript: true,
    },
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
  manifest.bridgeManifestSha256 = sha256Canonical(manifest);
  return manifest;
}

function readmeText(manifest) {
  return `# TS006 natural-trace hash-chain capture bridge

Status: **unsigned template only; not evidence**.

This directory binds the exact current four TS006 trace specifications, the selected empty EN/ES disposable profiles, immutable session kits, the physically verified read-only lesson host tree, the hash-bound Flash Projector executable, and current containment/readiness reports.

It does not launch Flash, capture frames or audio, authorize an execution, promote an old diagnostic, establish a baseline, accept fidelity, or update any migration/coverage/completion/release ledger.

The manifest is fail-closed:

- \`executionGate.executionReady\` is always false here.
- Every future record must repeat the exact immutable session bindings and form an append-only hash chain.
- Primary evidence must enter TS006 naturally through \`index_local.swf\`; direct child SWF opening and direct seek are forbidden as primary evidence.
- Root frame stepping is a separately labeled supplement after the primary natural trace and cannot prove natural playback, reachability, Replay, navigation, or audio timing.
- Both languages require root and \`sprite-23\` observations plus Replay. Spanish additionally requires the source-bound page narration action and observed load, audibility, language, completion, and synchronization.
- All human roles, signatures, live containment checks, runtime observations, reviews, owner acceptance, and release decisions must be supplied outside this scaffolder and verified by later evidence promotion tooling.

Bridge input fingerprint: \`${manifest.bridgeInputFingerprintSha256}\`

Trace-spec set: \`${manifest.traceSpecSetSha256}\`

Current blockers: ${manifest.executionGate.blockerCount}
`;
}

export function renderTs006NaturalTraceBridge(manifest) {
  const files = new Map();
  files.set("bridge-manifest.json", jsonBytes(manifest));
  files.set("README.md", Buffer.from(readmeText(manifest)));
  for (const session of manifest.sessions) {
    files.set(`${session.language}/session-contract.json`, jsonBytes(session));
    for (const kind of Object.keys(LOG_DEFINITIONS)) {
      files.set(
        `${session.language}/${kind}.schema.template.jsonl`,
        Buffer.from(`${canonicalJson(manifest.logSchemas[kind])}\n`),
      );
    }
  }
  return files;
}

async function assertExclusiveOutput(outputPath) {
  try {
    await lstat(outputPath);
    fail(`output path already exists: ${outputPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function scaffoldTs006NaturalTraceBridge({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  outputPath,
} = {}) {
  assert(typeof outputPath === "string" && outputPath.length > 0, "--output is required");
  const absoluteOutput = path.resolve(outputPath);
  await assertExclusiveOutput(absoluteOutput);
  const manifest = await buildTs006NaturalTraceBridge({ repositoryRoot });
  const files = renderTs006NaturalTraceBridge(manifest);
  await mkdir(absoluteOutput, { recursive: false, mode: 0o700 });
  for (const [relative, bytes] of files) {
    const target = path.resolve(absoluteOutput, relative);
    assert(target.startsWith(`${absoluteOutput}${path.sep}`), `rendered path escapes output: ${relative}`);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, bytes, { flag: "wx", mode: 0o400 });
  }
  return {
    outputPath: absoluteOutput,
    fileCount: files.size,
    bridgeManifestSha256: manifest.bridgeManifestSha256,
    executionReady: false,
  };
}

export async function verifyTs006NaturalTraceBridge({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  outputPath,
} = {}) {
  assert(typeof outputPath === "string" && outputPath.length > 0, "--verify path is required");
  const absoluteOutput = await realpath(outputPath);
  const manifest = await buildTs006NaturalTraceBridge({ repositoryRoot });
  const expected = renderTs006NaturalTraceBridge(manifest);
  const actualFiles = [];
  async function walk(directory, prefix = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.resolve(directory, entry.name);
      assert(!entry.isSymbolicLink(), `verification directory contains symlink: ${relative}`);
      if (entry.isDirectory()) await walk(absolute, relative);
      else if (entry.isFile()) actualFiles.push(relative);
      else fail(`verification directory contains unsupported entry: ${relative}`);
    }
  }
  await walk(absoluteOutput);
  assert(
    canonicalJson(actualFiles.sort()) === canonicalJson([...expected.keys()].sort()),
    "scaffold file set differs from current rendered bridge",
  );
  for (const [relative, expectedBytes] of expected) {
    const actual = await readFile(path.resolve(absoluteOutput, relative));
    assert(actual.equals(expectedBytes), `scaffold file drifted: ${relative}`);
  }
  return {
    outputPath: absoluteOutput,
    fileCount: expected.size,
    bridgeManifestSha256: manifest.bridgeManifestSha256,
    current: true,
    executionReady: false,
  };
}

export function ts006BridgeRecordSha256(record, hashField) {
  assert(isPlainObject(record), "hash-chain record must be an object");
  assert(typeof hashField === "string" && hashField.length > 0, "hash field missing");
  return sha256Canonical(withoutField(record, hashField));
}

function validateCommonRecord(record, definition, sessionContract, index) {
  assert(record.schemaVersion === 1, `record ${index + 1} schemaVersion mismatch`);
  assert(record.evidenceType === definition.evidenceType, `record ${index + 1} evidenceType mismatch`);
  for (const key of [
    "animationId",
    "language",
    "sessionId",
    "requirementIds",
    "traceSpecSetSha256",
    "bridgeInputFingerprintSha256",
    "sessionKitSha256",
    "profileManifestSha256",
    "hostTreeManifestSha256",
    "projectorExecutableSha256",
    "runtimeEnvironmentReadinessSha256",
    "containmentReadinessSha256",
  ]) {
    assert(canonicalJson(record[key]) === canonicalJson(sessionContract[key]), `record ${index + 1} binding mismatch: ${key}`);
  }
  assert(record.sequence === index + 1, `record ${index + 1} sequence is not contiguous`);
  assert(typeof record.occurredAt === "string" && !Number.isNaN(Date.parse(record.occurredAt)), `record ${index + 1} occurredAt invalid`);
  assert(Number.isFinite(record.monotonicTimeMs) && record.monotonicTimeMs >= 0, `record ${index + 1} monotonicTimeMs invalid`);
  assert(isPlainObject(record.operator) && typeof record.operator.externalSubjectId === "string" && record.operator.externalSubjectId.length > 0, `record ${index + 1} named operator missing`);
  assertSha256(record[definition.ownHashField], `record ${index + 1}.${definition.ownHashField}`);
  assert(
    record[definition.ownHashField] === ts006BridgeRecordSha256(record, definition.ownHashField),
    `record ${index + 1} hash mismatch`,
  );
}

export function validateTs006BridgeHashChain(records, {
  kind,
  sessionContract,
} = {}) {
  assert(Array.isArray(records) && records.length > 0, `${kind || "unknown"} hash chain must be nonempty`);
  const definition = LOG_DEFINITIONS[kind];
  assert(definition, `unsupported hash-chain kind: ${kind}`);
  assert(sessionContract?.artifactType === "ts006-natural-trace-session-contract", "session contract missing");
  let previous = null;
  let priorMonotonic = -1;
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    validateCommonRecord(record, definition, sessionContract, index);
    assert(record[definition.previousHashField] === previous, `record ${index + 1} previous hash mismatch`);
    assert(record.monotonicTimeMs >= priorMonotonic, `record ${index + 1} monotonic time moved backward`);
    previous = record[definition.ownHashField];
    priorMonotonic = record.monotonicTimeMs;
  }

  if (kind === "operation") {
    assert(records.length === sessionContract.schedule.length, "operation log must contain exactly the scheduled operations");
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const scheduled = sessionContract.schedule[index];
      assert(record.scheduledOrder === scheduled.order, `operation ${index + 1} scheduled order mismatch`);
      assert(record.scheduledStepId === scheduled.id, `operation ${index + 1} step id mismatch`);
      assert(record.scheduledStepSha256 === scheduled.scheduledStepSha256, `operation ${index + 1} scheduled hash mismatch`);
      assert(canonicalJson(record.action) === canonicalJson(scheduled.action), `operation ${index + 1} action mismatch`);
      assertSha256(record.sourceTargetRecordSha256, `operation ${index + 1} sourceTargetRecordSha256`);
      assertSha256(record.preStateRecordSha256, `operation ${index + 1} preStateRecordSha256`);
      assert(
        record.postStateCheckpointSha256 === sha256Canonical(scheduled.postStateCheckpoint),
        `operation ${index + 1} postStateCheckpointSha256 mismatch`,
      );
    }
    assert(records.some((record) => record.action.kind === "host-native-replay"), "operation log lacks Replay");
    const replay = records.find((record) => record.scheduledStepId === "invoke-host-native-replay");
    assert(replay?.replayObservation?.controlResolved === true, "Replay control resolution was not observed");
    assert(replay?.replayObservation?.fullStateVectorResetObserved === true, "Replay full-state reset was not observed");
    assertSha256(replay?.replayObservation?.resetStateVectorSha256, "Replay resetStateVectorSha256");
    const replayTerminal = records.find((record) => record.scheduledStepId === "observe-second-natural-terminal");
    assert(replayTerminal?.replayCycleObservation?.cycle === 2, "Replay second cycle number was not observed");
    assert(replayTerminal?.replayCycleObservation?.terminalObserved === true, "Replay second terminal was not observed");
    assertSha256(replayTerminal?.replayCycleObservation?.terminalStateSha256, "Replay terminalStateSha256");
    if (sessionContract.language === "es") {
      const audio = records.find((record) => record.action.kind === "page-spanish-narration-release");
      assert(audio, "Spanish operation log lacks narration action");
      assert(
        audio.audioObservation?.requestedRuntimePath ===
          sessionContract.audio.requestedRuntimePathCandidate,
        "Spanish audio runtime path mismatch",
      );
      assert(
        audio.audioObservation?.sourceAudioBytesSha256 ===
          sessionContract.audio.requestedAudioCandidateSha256,
        "Spanish audio source-byte SHA-256 mismatch",
      );
      assert(audio.audioObservation?.successfulLoadObserved === true, "Spanish audio successful load was not observed");
      assert(audio.audioObservation?.audibilityObserved === true, "Spanish audio audibility was not observed");
      assert(audio.audioObservation?.spokenLanguage === "es", "Spanish audio spoken language mismatch");
      assert(audio.audioObservation?.completionObserved === true, "Spanish audio completion was not observed");
      assert(audio.audioObservation?.synchronizationObserved === true, "Spanish audio synchronization was not observed");
      assert(
        typeof audio.audioObservation?.losslessSessionAudioFile === "string" &&
          audio.audioObservation.losslessSessionAudioFile.length > 0,
        "Spanish lossless session-audio path missing",
      );
      assertSha256(audio.audioObservation?.losslessSessionAudioSha256, "Spanish losslessSessionAudioSha256");
      assert(
        Number.isFinite(audio.audioObservation?.triggerMonotonicTimeMs),
        "Spanish audio trigger timestamp missing",
      );
    }
  } else if (kind === "source-target") {
    assert(records.length === sessionContract.schedule.length, "source-target log must contain exactly one record per scheduled operation");
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const scheduled = sessionContract.schedule[index];
      assert(record.scheduledOrder === scheduled.order, `source-target ${index + 1} order mismatch`);
      assert(record.scheduledStepId === scheduled.id, `source-target ${index + 1} step id mismatch`);
      assert(record.scheduledStepSha256 === scheduled.scheduledStepSha256, `source-target ${index + 1} scheduled hash mismatch`);
      assert(canonicalJson(record.expectedSourceTarget) === canonicalJson(scheduled.sourceTarget), `source-target ${index + 1} expected target mismatch`);
      assert(isPlainObject(record.resolvedSourceTarget) && Object.keys(record.resolvedSourceTarget).length > 0, `source-target ${index + 1} resolved target missing`);
      assertSha256(record.resolutionEvidenceSha256, `source-target ${index + 1} resolutionEvidenceSha256`);
    }
  } else if (kind === "host-entry") {
    assert(records.length === EXPECTED_HOST_ENTRY_EVENTS.length, "host-entry log event count mismatch");
    for (let index = 0; index < records.length; index += 1) {
      assert(records[index].hostEntryEvent === EXPECTED_HOST_ENTRY_EVENTS[index], `host-entry event ${index + 1} mismatch`);
      assertSha256(records[index].evidenceSha256, `host-entry ${index + 1} evidenceSha256`);
    }
    const byEvent = new Map(records.map((record) => [record.hostEntryEvent, record]));
    const empty = byEvent.get("profile-empty-preflight");
    assert(empty.emptyProfileVerified === true, "host-entry empty profile was not verified");
    assert(empty.sharedObjectFileCount === 0, "host-entry preflight SharedObject store is not empty");
    assert(empty.rawEvidenceFileCount === 0, "host-entry preflight raw evidence root is not empty");
    assertSha256(empty.livePreflightReceiptSha256, "host-entry livePreflightReceiptSha256");
    const started = byEvent.get("projector-process-started-empty");
    assert(started.freshProcess === true, "host-entry Projector was not recorded as a fresh process");
    assert(
      started.processExecutableSha256 === sessionContract.projectorExecutableSha256,
      "host-entry Projector executable binding mismatch",
    );
    assert(Number.isInteger(started.processId) && started.processId > 0, "host-entry Projector PID invalid");
    const opened = byEvent.get("named-human-file-open-selected-staged-host");
    assert(opened.humanFileOpenObserved === true, "host-entry named-human file-open observation missing");
    assert(
      opened.openedFilePath === sessionContract.hostEntryContract.selectedHostShellPath,
      "host-entry opened path is not the selected staged host shell",
    );
    assert(
      opened.openedFileSha256 === sessionContract.hostEntryContract.selectedHostShellSha256,
      "host-entry opened host-shell SHA-256 mismatch",
    );
    assert(opened.directChildSwfOpened === false, "host-entry reports a forbidden direct child SWF open");
    const loaded = byEvent.get("same-lesson-host-loaded");
    assert(loaded.sameLessonHostLoaded === true, "host-entry same-lesson host load not observed");
    const navigated = byEvent.get("same-lesson-natural-navigation-target-resolved");
    assert(navigated.naturalNavigation === true, "host-entry natural navigation not observed");
    assert(navigated.targetAnimationId === TS006_ANIMATION_ID, "host-entry natural-navigation target mismatch");
    assert(navigated.directSeekUsed === false, "host-entry reports forbidden direct seek");
    const rootEntry = byEvent.get("ts006-root-entry-observed");
    assert(rootEntry.frameDomainId === "root" && rootEntry.observedRootFrame === 1, "host-entry root entry mismatch");
    assertSha256(rootEntry.screenshotSha256, "host-entry root screenshotSha256");
    const nestedEntry = byEvent.get("ts006-nested-entry-observed");
    assert(
      nestedEntry.frameDomainId === "sprite-23" &&
        nestedEntry.observedRootFrame === 6 &&
        nestedEntry.observedLocalFrame === 1,
      "host-entry nested entry mismatch",
    );
    assertSha256(nestedEntry.screenshotSha256, "host-entry nested screenshotSha256");
    const post = byEvent.get("post-session-side-effect-summary");
    assert(post.processExited === true, "host-entry process exit not observed");
    assert(post.outboundNetworkSucceededCount === 0, "host-entry reports successful outbound network");
    assert(post.persistentSideEffectCount === 0, "host-entry reports persistent side effects");
    assert(post.sharedObjectFileCount === 0, "host-entry post-session SharedObject store is not empty");
    assertSha256(post.requestAuditSha256, "host-entry requestAuditSha256");
  } else if (kind === "state") {
    assert(
      records.length === sessionContract.schedule.length * 2,
      "state log must contain one pre-state and one post-state for every scheduled operation",
    );
    const domains = new Set();
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const scheduled = sessionContract.schedule[Math.floor(index / 2)];
      const role = index % 2 === 0 ? "pre" : "post";
      assert(record.scheduledOrder === scheduled.order, `state ${index + 1} scheduled order mismatch`);
      assert(record.scheduledStepId === scheduled.id, `state ${index + 1} step id mismatch`);
      assert(record.scheduledStepSha256 === scheduled.scheduledStepSha256, `state ${index + 1} scheduled hash mismatch`);
      assert(record.checkpointRole === role, `state ${index + 1} checkpoint role mismatch`);
      const checkpoint = role === "pre"
        ? scheduled.preStateCheckpoint
        : scheduled.postStateCheckpoint;
      assert(
        canonicalJson(record.expectedState) === canonicalJson(checkpoint.expectedState),
        `state ${index + 1} expected state mismatch`,
      );
      assert(["root", "sprite-23"].includes(record.frameDomainId), `state ${index + 1} frame domain invalid`);
      domains.add(record.frameDomainId);
      assert(Number.isInteger(record.rootFrame) && record.rootFrame >= 1 && record.rootFrame <= 10, `state ${index + 1} root frame invalid`);
      const domain = EXPECTED_DOMAINS[record.frameDomainId];
      assert(Number.isInteger(record.localFrame) && record.localFrame >= 1 && record.localFrame <= domain.lastFrame, `state ${index + 1} local frame invalid`);
      assert(isPlainObject(record.observedState), `state ${index + 1} observedState missing`);
      assert(record.observedStateSha256 === sha256Canonical(record.observedState), `state ${index + 1} observedStateSha256 mismatch`);
      assert(typeof record.screenshotFile === "string" && record.screenshotFile.length > 0, `state ${index + 1} screenshot file missing`);
      assertSha256(record.screenshotSha256, `state ${index + 1} screenshotSha256`);
      assert(record.width === 800 && record.height === 600, `state ${index + 1} native dimensions mismatch`);
      if (role === "pre") {
        assert(record.causalOperationEventSha256 === null, `state ${index + 1} pre-state must not claim a future operation hash`);
      } else {
        assertSha256(record.causalOperationEventSha256, `state ${index + 1} causalOperationEventSha256`);
      }
    }
    assert(domains.has("root") && domains.has("sprite-23"), "state log must observe both root and sprite-23");
  }
  return {
    kind,
    recordCount: records.length,
    chainHeadSha256: records.at(-1)[definition.ownHashField],
    structurallyValid: true,
    authoritativeEvidenceEstablished: false,
    strictAcceptanceEffect: "none",
  };
}

export function validateTs006BridgeLogBundle({
  operation,
  state,
  sourceTarget,
  hostEntry,
  sessionContract,
} = {}) {
  const results = {
    operation: validateTs006BridgeHashChain(operation, {
      kind: "operation",
      sessionContract,
    }),
    state: validateTs006BridgeHashChain(state, {
      kind: "state",
      sessionContract,
    }),
    sourceTarget: validateTs006BridgeHashChain(sourceTarget, {
      kind: "source-target",
      sessionContract,
    }),
    hostEntry: validateTs006BridgeHashChain(hostEntry, {
      kind: "host-entry",
      sessionContract,
    }),
  };
  for (let index = 0; index < sessionContract.schedule.length; index += 1) {
    const targetRecord = sourceTarget[index];
    const preStateRecord = state[index * 2];
    const operationRecord = operation[index];
    const postStateRecord = state[index * 2 + 1];
    assert(
      operationRecord.sourceTargetRecordSha256 === targetRecord.recordSha256,
      `bundle step ${index + 1} operation does not bind its source-target record`,
    );
    assert(
      operationRecord.preStateRecordSha256 === preStateRecord.recordSha256,
      `bundle step ${index + 1} operation does not bind its pre-state record`,
    );
    assert(
      postStateRecord.causalOperationEventSha256 === operationRecord.eventSha256,
      `bundle step ${index + 1} post-state does not bind its causal operation`,
    );
    assert(
      targetRecord.monotonicTimeMs <= preStateRecord.monotonicTimeMs &&
        preStateRecord.monotonicTimeMs <= operationRecord.monotonicTimeMs &&
        operationRecord.monotonicTimeMs <= postStateRecord.monotonicTimeMs,
      `bundle step ${index + 1} cross-log monotonic order is invalid`,
    );
  }
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-log-bundle-structural-validation",
    status: "structurally-valid-not-promoted-not-authoritative",
    animationId: sessionContract.animationId,
    language: sessionContract.language,
    sessionId: sessionContract.sessionId,
    chainHeads: Object.fromEntries(
      Object.entries(results).map(([key, result]) => [key, result.chainHeadSha256]),
    ),
    bundleDigestSha256: sha256Canonical(
      Object.fromEntries(
        Object.entries(results).map(([key, result]) => [key, result.chainHeadSha256]),
      ),
    ),
    authoritativeEvidenceEstablished: false,
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const args = [...argv];
  if (args.length === 0 || (args.length === 1 && args[0] === "--check")) {
    return { mode: "check" };
  }
  if (args.length === 2 && args[0] === "--output") {
    return { mode: "output", outputPath: args[1] };
  }
  if (args.length === 2 && args[0] === "--verify") {
    return { mode: "verify", outputPath: args[1] };
  }
  fail("usage: node scripts/scaffold-g4-l3-ts006-natural-trace-bridge.mjs [--check | --output <new-directory> | --verify <directory>]");
}

async function main() {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed.mode === "check") {
    const manifest = await buildTs006NaturalTraceBridge();
    process.stdout.write(`${JSON.stringify({
      status: manifest.status,
      animationId: manifest.animationId,
      traceSpecCount: manifest.traceSpecs.length,
      sessionCount: manifest.sessions.length,
      executionReady: manifest.executionGate.executionReady,
      blockerCount: manifest.executionGate.blockerCount,
      bridgeInputFingerprintSha256: manifest.bridgeInputFingerprintSha256,
      bridgeManifestSha256: manifest.bridgeManifestSha256,
    })}\n`);
    return;
  }
  const result = parsed.mode === "output"
    ? await scaffoldTs006NaturalTraceBridge({ outputPath: parsed.outputPath })
    : await verifyTs006NaturalTraceBridge({ outputPath: parsed.outputPath });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedAsMain = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (invokedAsMain) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
