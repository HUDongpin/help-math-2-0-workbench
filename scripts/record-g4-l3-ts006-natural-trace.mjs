#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  buildTs006NaturalTraceBridge,
  canonicalJson,
  renderTs006NaturalTraceBridge,
  ts006BridgeRecordSha256,
  validateTs006BridgeHashChain,
} from "./scaffold-g4-l3-ts006-natural-trace-bridge.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_SESSIONS_ROOT_RELATIVE = "artifacts/full-frame/g4-l3";
const DEFAULT_BRIDGES_ROOT_RELATIVE =
  "work/g4-l3-ts006-natural-trace-bridges";
const CANONICAL_RAW_CAPTURES_RELATIVE = "evidence/raw-captures";
const ANIMATION_ID = "course-g04-l03-ts-006";
const SESSION_ID_PATTERN =
  /^ts006-(en|es)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/iu;
const CAPTURE_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const SUBJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$/u;
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const LOG_KINDS = Object.freeze([
  "operation",
  "state",
  "source-target",
  "host-entry",
]);
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
const ESCALATION_KEYS = new Set([
  "acceptance",
  "acceptanceEffect",
  "approved",
  "authority",
  "authoritativeBaseline",
  "authoritativeOriginalRuntimeTrace",
  "audioAccepted",
  "baselineAccepted",
  "humanVisualAccepted",
  "independentReviewer",
  "ownerAccepted",
  "promotionEligible",
  "publicRelease",
  "releaseAuthorized",
  "role",
  "signature",
  "signed",
  "strictAcceptanceEffect",
  "strictMigrationComplete",
]);
const COMMON_MANAGED_FIELDS = new Set([
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
  "captureBinding",
  "sequence",
  "occurredAt",
  "monotonicTimeMs",
  "operator",
  "previousEventSha256",
  "previousRecordSha256",
  "eventSha256",
  "recordSha256",
]);
const PAYLOAD_KEYS = Object.freeze({
  operation: new Set([
    "scheduledStepId",
    "result",
    "replayObservation",
    "replayCycleObservation",
    "audioObservation",
  ]),
  state: new Set([
    "scheduledStepId",
    "checkpointRole",
    "frameDomainId",
    "rootFrame",
    "localFrame",
    "observedState",
    "screenshotFile",
  ]),
  "source-target": new Set([
    "scheduledStepId",
    "resolvedSourceTarget",
    "resolutionEvidenceFile",
  ]),
  "host-entry": new Set([
    "hostEntryEvent",
    "processId",
    "observedRootFrame",
    "observedLocalFrame",
    "evidenceLocator",
    "screenshotFile",
    "emptyProfileVerified",
    "sharedObjectFileCount",
    "rawEvidenceFileCount",
    "freshProcess",
    "processExecutableSha256",
    "humanFileOpenObserved",
    "automationFileOpenObserved",
    "openedFilePath",
    "openedFileSha256",
    "directChildSwfOpened",
    "sameLessonHostLoaded",
    "naturalNavigation",
    "targetAnimationId",
    "directSeekUsed",
    "frameDomainId",
    "processExited",
    "outboundNetworkSucceededCount",
    "persistentSideEffectCount",
  ]),
});
const MAX_RECORD_BYTES = 2 * 1024 * 1024;

function invariant(condition, message) {
  if (!condition) throw new Error(`TS006 hash-chain recorder: ${message}`);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Canonical(value) {
  return sha256(Buffer.from(canonicalJson(value)));
}

function canonicalLine(value) {
  return Buffer.from(`${canonicalJson(value)}\n`);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function withoutField(value, field) {
  const clone = structuredClone(value);
  delete clone[field];
  return clone;
}

function fingerprinted(value, field) {
  const clone = structuredClone(value);
  delete clone[field];
  clone[field] = sha256Canonical(clone);
  return clone;
}

function validateFingerprint(value, field, label) {
  invariant(isPlainObject(value), `${label} must be an object`);
  invariant(HASH_PATTERN.test(value[field] || ""), `${label}.${field} is not a SHA-256`);
  invariant(
    value[field] === sha256Canonical(withoutField(value, field)),
    `${label}.${field} does not match the canonical document`,
  );
}

function assertAuthorityNeutral(value, label) {
  invariant(value?.strictAcceptanceEffect === "none", `${label} strict acceptance effect changed`);
  invariant(value?.promotionEligible === false, `${label} promotion eligibility changed`);
  for (const [key, expected] of Object.entries(AUTHORITY_FALSE)) {
    invariant(value?.authority?.[key] === expected, `${label}.authority.${key} must remain false`);
    invariant(value?.acceptance?.[key] === expected, `${label}.acceptance.${key} must remain false`);
  }
}

function assertNoEscalation(value, label, trail = []) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      assertNoEscalation(value[index], label, [...trail, String(index)]);
    }
    return;
  }
  if (typeof value === "string") {
    invariant(
      !/^(?:accepted|approved|authoritative|owner-accepted|published|release-authorized|signed|strict-complete)$/iu.test(
        value.trim(),
      ),
      `${label} contains forbidden authority-status value at ${trail.join(".") || "<root>"}`,
    );
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    invariant(
      !ESCALATION_KEYS.has(key),
      `${label} contains forbidden authority/role field ${[...trail, key].join(".")}`,
    );
    assertNoEscalation(child, label, [...trail, key]);
  }
}

function assertSha256(value, label) {
  invariant(HASH_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256`);
}

function normalizeRelativeFile(value, label) {
  invariant(
    typeof value === "string" &&
      value.length > 0 &&
      !path.posix.isAbsolute(value) &&
      !value.includes("\\"),
    `${label} must be a portable relative path`,
  );
  const normalized = path.posix.normalize(value);
  invariant(
    normalized === value &&
      normalized !== "." &&
      !normalized.startsWith("../") &&
      !normalized.includes("/../"),
    `${label} escapes its allowlist`,
  );
  return normalized;
}

function assertDirectChild(parent, child, label) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  invariant(
    relative.length > 0 &&
      !relative.includes(path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative),
    `${label} must be a direct child of its allowlisted root`,
  );
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertRealDirectory(candidate, label, {mode = null} = {}) {
  const metadata = await lstat(candidate);
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    `${label} must be a real directory`,
  );
  if (mode !== null) {
    invariant((metadata.mode & 0o777) === mode, `${label} mode must be ${mode.toString(8)}`);
  }
  const resolved = await realpath(candidate);
  invariant(resolved === path.resolve(candidate), `${label} resolves through a symbolic-link component`);
  return {metadata, resolved};
}

async function ensureRealDirectory(candidate, parent, label, {exclusive = false} = {}) {
  const parentDirectory = await assertRealDirectory(parent, `${label} parent`);
  invariant(path.dirname(path.resolve(candidate)) === parentDirectory.resolved, `${label} parent mismatch`);
  try {
    await mkdir(candidate, {mode: 0o700});
  } catch (error) {
    if (error.code !== "EEXIST" || exclusive) throw error;
  }
  const result = await assertRealDirectory(candidate, label);
  await fsyncDirectory(parent);
  return result;
}

async function assertRealpathWithin(candidate, allowedRoot, label, {allowEqual = false} = {}) {
  const [candidateReal, rootReal] = await Promise.all([
    realpath(candidate),
    realpath(allowedRoot),
  ]);
  invariant(
    (allowEqual && candidateReal === rootReal) ||
      candidateReal.startsWith(`${rootReal}${path.sep}`),
    `${label} escapes its realpath allowlist`,
  );
  return candidateReal;
}

async function fsyncDirectory(directory) {
  const descriptor = await open(
    directory,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
  );
  try {
    await descriptor.sync();
  } finally {
    await descriptor.close();
  }
}

async function readRegularSingleLink(candidate, allowedRoot, label, {allowEmpty = true} = {}) {
  await assertRealpathWithin(candidate, allowedRoot, label);
  const before = await lstat(candidate);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be one regular non-symlink, single-link file`,
  );
  const descriptor = await open(candidate, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let bytes;
  try {
    const opened = await descriptor.stat();
    invariant(
      opened.isFile() &&
        opened.nlink === 1 &&
        opened.dev === before.dev &&
        opened.ino === before.ino,
      `${label} descriptor identity changed`,
    );
    bytes = await descriptor.readFile();
  } finally {
    await descriptor.close();
  }
  const after = await lstat(candidate);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1 &&
      after.dev === before.dev &&
      after.ino === before.ino &&
      after.size === before.size,
    `${label} identity changed while read`,
  );
  invariant(allowEmpty || bytes.length > 0, `${label} must not be empty`);
  return {
    path: candidate,
    bytes,
    metadata: before,
    descriptor: {
      path: portable(path.relative(allowedRoot, candidate)),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function writeExclusiveSynced(candidate, allowedRoot, bytes, {mode = 0o400} = {}) {
  invariant(Buffer.isBuffer(bytes), "exclusive writer requires Buffer bytes");
  const parent = path.dirname(candidate);
  await assertRealpathWithin(parent, allowedRoot, "exclusive-write parent", {allowEqual: true});
  const descriptor = await open(
    candidate,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      fsConstants.O_NOFOLLOW,
    mode,
  );
  try {
    const result = await descriptor.write(bytes, 0, bytes.length, 0);
    invariant(result.bytesWritten === bytes.length, `partial exclusive write: ${path.basename(candidate)}`);
    await descriptor.sync();
    await descriptor.chmod(mode);
    await descriptor.sync();
  } finally {
    await descriptor.close();
  }
  await fsyncDirectory(parent);
}

function parseCanonicalJson(bytes, label) {
  invariant(bytes.length > 0, `${label} is empty`);
  invariant(bytes.at(-1) === 0x0a, `${label} lacks its final newline`);
  invariant(!bytes.includes(0x0d), `${label} contains a carriage return`);
  const text = bytes.toString("utf8");
  invariant(Buffer.from(text).equals(bytes), `${label} is not valid UTF-8`);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`TS006 hash-chain recorder: ${label} is invalid JSON: ${error.message}`);
  }
  invariant(canonicalLine(value).equals(bytes), `${label} is not canonical JSON`);
  return value;
}

function parseRenderedPrettyJson(bytes, label) {
  invariant(bytes.length > 0, `${label} is empty`);
  invariant(bytes.at(-1) === 0x0a, `${label} lacks its final newline`);
  invariant(!bytes.includes(0x0d), `${label} contains a carriage return`);
  const text = bytes.toString("utf8");
  invariant(Buffer.from(text).equals(bytes), `${label} is not valid UTF-8`);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `TS006 hash-chain recorder: ${label} is invalid JSON: ${error.message}`,
    );
  }
  invariant(
    Buffer.from(`${JSON.stringify(value, null, 2)}\n`).equals(bytes),
    `${label} is not the exact rendered pretty JSON`,
  );
  return value;
}

export function parseCanonicalJsonl(bytes, label = "JSONL") {
  if (bytes.length === 0) return [];
  invariant(bytes.at(-1) === 0x0a, `${label} has a partial or truncated final record`);
  invariant(!bytes.includes(0x0d), `${label} contains a carriage return`);
  const text = bytes.toString("utf8");
  invariant(Buffer.from(text).equals(bytes), `${label} is not valid UTF-8`);
  const lines = text.slice(0, -1).split("\n");
  invariant(lines.every((line) => line.length > 0), `${label} contains a blank record`);
  return lines.map((line, index) => {
    invariant(Buffer.byteLength(line) <= MAX_RECORD_BYTES, `${label} record ${index + 1} is too large`);
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`TS006 hash-chain recorder: ${label} record ${index + 1} is invalid JSON: ${error.message}`);
    }
    invariant(
      line === canonicalJson(record),
      `${label} record ${index + 1} is not canonical JSON`,
    );
    return record;
  });
}

function inspectPng(bytes, label) {
  invariant(
    bytes.length >= 24 &&
      bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" &&
      bytes.subarray(12, 16).toString("ascii") === "IHDR",
    `${label} is not a PNG with a leading IHDR`,
  );
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function validateOperator(operator) {
  invariant(isPlainObject(operator), "operator must be an object");
  invariant(
    SUBJECT_ID_PATTERN.test(operator.externalSubjectId || ""),
    "operator.externalSubjectId is invalid",
  );
  invariant(
    typeof operator.displayName === "string" &&
      operator.displayName.trim().length > 0 &&
      operator.displayName.length <= 200,
    "operator.displayName is invalid",
  );
  invariant(
    operator.subjectType === "automation",
    "recorder provenance subjectType must be automation",
  );
  invariant(
    operator.role === "machine-event-recorder",
    "recorder provenance role must be machine-event-recorder",
  );
  invariant(operator.namedHuman === false, "automation cannot claim named-human operator status");
  invariant(operator.independentReviewer === false, "automation cannot claim independent review");
  invariant(operator.ownerRoleUsed === false, "automation cannot use the owner role in this recorder");
  invariant(
    operator.releaseCustodianRoleUsed === false,
    "runtime operator cannot use the release-custodian role in this recorder",
  );
  return {
    externalSubjectId: operator.externalSubjectId,
    displayName: operator.displayName.trim(),
    subjectType: "automation",
    role: "machine-event-recorder",
    namedHuman: false,
    provenanceClassification: "automation-only-not-human-attestation",
    independentReviewer: false,
    ownerRoleUsed: false,
    releaseCustodianRoleUsed: false,
  };
}

function validateSessionContract(contract) {
  invariant(
    contract?.schemaVersion === 1 &&
      contract.artifactType === "ts006-natural-trace-session-contract" &&
      contract.animationId === ANIMATION_ID,
    "session contract identity is invalid",
  );
  invariant(["en", "es"].includes(contract.language), "session contract language is invalid");
  invariant(
    SESSION_ID_PATTERN.test(contract.sessionId || "") &&
      contract.sessionId.startsWith(`ts006-${contract.language}-`),
    "session contract ID is invalid",
  );
  invariant(
    Array.isArray(contract.requirementIds) &&
      contract.requirementIds.length === 2 &&
      contract.requirementIds.every((value) => typeof value === "string"),
    "session contract must bind two requirements",
  );
  invariant(
    Array.isArray(contract.schedule) &&
      contract.schedule.length === 9 &&
      contract.schedule.every((step, index) =>
        step.order === index + 1 &&
        typeof step.id === "string" &&
        HASH_PATTERN.test(step.scheduledStepSha256 || "") &&
        isPlainObject(step.action) &&
        isPlainObject(step.sourceTarget) &&
        isPlainObject(step.preStateCheckpoint) &&
        isPlainObject(step.postStateCheckpoint)),
    "session contract schedule is not the exact contiguous nine-step shape",
  );
  invariant(
    contract.schedule.some((step) => step.id === "invoke-host-native-replay"),
    "session contract lacks Replay",
  );
  invariant(
    canonicalJson(contract.requiredHostEntryEvents) ===
      canonicalJson(EXPECTED_HOST_ENTRY_EVENTS),
    "session contract host-entry order is invalid",
  );
  for (const key of [
    "traceSpecSetSha256",
    "bridgeInputFingerprintSha256",
    "sessionKitSha256",
    "profileManifestSha256",
    "hostTreeManifestSha256",
    "projectorExecutableSha256",
    "runtimeEnvironmentReadinessSha256",
    "containmentReadinessSha256",
  ]) {
    assertSha256(contract[key], `session contract ${key}`);
  }
  invariant(
    Object.entries(LOG_DEFINITIONS).every(([kind, definition]) =>
      contract.logs?.[kind]?.file === `${kind}.jsonl` &&
      contract.logs?.[kind]?.evidenceType === definition.evidenceType &&
      contract.logs?.[kind]?.previousHashField === definition.previousHashField &&
      contract.logs?.[kind]?.ownHashField === definition.ownHashField),
    "session contract log definitions are invalid",
  );
  invariant(
    contract.authority &&
      contract.acceptance &&
      Object.entries(AUTHORITY_FALSE).every(([key, value]) =>
        contract.authority[key] === value && contract.acceptance[key] === value) &&
      contract.strictAcceptanceEffect === "none",
    "session contract crosses an authority boundary",
  );
  return contract;
}

export async function loadPrebuiltTs006NaturalTraceBridge({
  projectRoot = DEFAULT_PROJECT_ROOT,
  bridgeRoot,
  sessionRoot,
} = {}) {
  invariant(
    typeof bridgeRoot === "string" && bridgeRoot.length > 0,
    "--bridge-root is required",
  );
  invariant(
    typeof sessionRoot === "string" && sessionRoot.length > 0,
    "--session-root is required with --bridge-root",
  );
  const project = path.resolve(projectRoot);
  const allowedBridgesRoot = path.resolve(
    project,
    DEFAULT_BRIDGES_ROOT_RELATIVE,
  );
  await assertRealDirectory(allowedBridgesRoot, "prebuilt bridge allowlist root");
  const bridge = path.resolve(bridgeRoot);
  assertDirectChild(allowedBridgesRoot, bridge, "prebuilt bridge");
  await assertRealDirectory(bridge, "prebuilt bridge");

  const manifestFile = await readRegularSingleLink(
    path.join(bridge, "bridge-manifest.json"),
    bridge,
    "prebuilt bridge manifest",
    {allowEmpty: false},
  );
  const manifest = parseRenderedPrettyJson(
    manifestFile.bytes,
    "prebuilt bridge manifest",
  );
  invariant(
    manifest?.schemaVersion === 1 &&
      manifest.artifactType ===
        "ts006-natural-trace-hash-chain-capture-bridge",
    "prebuilt bridge identity is invalid",
  );
  assertSha256(
    manifest.bridgeManifestSha256,
    "prebuilt bridge manifest SHA-256",
  );
  invariant(
    manifest.bridgeManifestSha256 ===
      sha256Canonical(withoutField(manifest, "bridgeManifestSha256")),
    "prebuilt bridge manifest SHA-256 is stale",
  );
  invariant(
    path.basename(bridge) === manifest.bridgeManifestSha256,
    "prebuilt bridge directory is not named by its manifest SHA-256",
  );
  invariant(
    manifest.executionGate?.executionReady === false &&
      manifest.executionGate?.pendingCandidateOnly === true,
    "prebuilt bridge crossed its execution gate",
  );
  invariant(
    manifest.strictAcceptanceEffect === "none" &&
      Object.entries(AUTHORITY_FALSE).every(([key, value]) =>
        manifest.authority?.[key] === value &&
        manifest.acceptance?.[key] === value),
    "prebuilt bridge manifest crossed an authority boundary",
  );

  const expectedFiles = renderTs006NaturalTraceBridge(manifest);
  const actualFiles = [];
  async function walk(directory, prefix = "") {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.resolve(directory, entry.name);
      invariant(
        !entry.isSymbolicLink(),
        `prebuilt bridge contains a symbolic link: ${relative}`,
      );
      if (entry.isDirectory()) {
        await assertRealDirectory(
          absolute,
          `prebuilt bridge directory ${relative}`,
        );
        await walk(absolute, relative);
      } else {
        invariant(
          entry.isFile(),
          `prebuilt bridge contains an unsupported entry: ${relative}`,
        );
        actualFiles.push(relative);
      }
    }
  }
  await walk(bridge);
  actualFiles.sort();
  const expectedNames = [...expectedFiles.keys()].sort();
  invariant(
    canonicalJson(actualFiles) === canonicalJson(expectedNames),
    "prebuilt bridge inventory differs from its exact rendered allowlist",
  );
  for (const [relative, expectedBytes] of expectedFiles) {
    const actual = await readRegularSingleLink(
      path.resolve(bridge, ...relative.split("/")),
      bridge,
      `prebuilt bridge file ${relative}`,
      {allowEmpty: false},
    );
    invariant(
      actual.bytes.equals(expectedBytes),
      `prebuilt bridge file differs from its manifest rendering: ${relative}`,
    );
  }

  invariant(
    Array.isArray(manifest.sessions) && manifest.sessions.length === 2,
    "prebuilt bridge must contain exactly two language contracts",
  );
  const sessionId = path.basename(path.resolve(sessionRoot));
  const match = SESSION_ID_PATTERN.exec(sessionId);
  invariant(match, "selected session root has an invalid TS006 session ID");
  const language = match[1].toLowerCase();
  const contract = manifest.sessions.find(
    (candidate) => candidate.language === language,
  );
  validateSessionContract(contract);
  invariant(
    contract.sessionId === sessionId,
    "prebuilt bridge session contract does not bind the selected session root",
  );
  invariant(
    manifest.bridgeInputFingerprintSha256 ===
        contract.bridgeInputFingerprintSha256 &&
      manifest.traceSpecSetSha256 === contract.traceSpecSetSha256,
    "prebuilt bridge does not bind the selected session contract",
  );
  const contractFile = await readRegularSingleLink(
    path.join(bridge, language, "session-contract.json"),
    bridge,
    `prebuilt ${language} session contract`,
    {allowEmpty: false},
  );
  invariant(
    contractFile.bytes.equals(
      expectedFiles.get(`${language}/session-contract.json`),
    ),
    "prebuilt session-contract bytes differ from the bridge manifest",
  );
  return {
    bridgeRoot: bridge,
    bridgeManifest: manifest,
    sessionContract: contract,
    bridgeManifestFile: manifestFile.descriptor,
    sessionContractFile: contractFile.descriptor,
  };
}

function captureBinding(contract, captureName) {
  return {
    sessionId: contract.sessionId,
    captureName,
    captureDirectory: captureName,
    captureManifestFile: "capture-manifest.json",
    bindingStatus: "capture-name-bound-manifest-hash-pending-until-complete-verification",
  };
}

async function resolveLayout({
  sessionRoot,
  captureName,
  allowedSessionsRoot,
  contract = null,
  requireRecorder = false,
  allowMissingCaptureRoot = false,
}) {
  invariant(
    typeof sessionRoot === "string" && sessionRoot.length > 0,
    "sessionRoot is required",
  );
  invariant(
    CAPTURE_NAME_PATTERN.test(captureName || "") &&
      captureName !== "." &&
      captureName !== "..",
    "captureName must be a safe direct-child name",
  );
  const allowed = await assertRealDirectory(
    path.resolve(allowedSessionsRoot),
    "allowed sessions root",
  );
  const session = await assertRealDirectory(path.resolve(sessionRoot), "session root");
  assertDirectChild(allowed.resolved, session.resolved, "session root");
  invariant(
    SESSION_ID_PATTERN.test(path.basename(session.resolved)),
    "session root basename is not a TS006 EN/ES UUID session",
  );
  if (contract) {
    invariant(
      path.basename(session.resolved) === contract.sessionId,
      "session root does not match the session contract",
    );
  }
  const legacyCaptureRoot = path.join(session.resolved, captureName);
  invariant(
    !(await lstatOrNull(legacyCaptureRoot)),
    `legacy session-root capture layout is refused; use ${CANONICAL_RAW_CAPTURES_RELATIVE}/${captureName}`,
  );
  const evidenceRoot = path.join(session.resolved, "evidence");
  const evidence = await assertRealDirectory(evidenceRoot, "session evidence root");
  assertDirectChild(session.resolved, evidence.resolved, "session evidence root");
  const rawCapturesRoot = path.join(evidence.resolved, "raw-captures");
  const rawCaptures = await assertRealDirectory(
    rawCapturesRoot,
    "session raw-captures root",
  );
  assertDirectChild(evidence.resolved, rawCaptures.resolved, "session raw-captures root");
  const captureRoot = path.join(rawCaptures.resolved, captureName);
  const captureMetadata = await lstatOrNull(captureRoot);
  let resolvedCaptureRoot = captureRoot;
  if (captureMetadata) {
    const capture = await assertRealDirectory(captureRoot, "capture root");
    assertDirectChild(rawCaptures.resolved, capture.resolved, "capture root");
    resolvedCaptureRoot = capture.resolved;
  } else {
    invariant(allowMissingCaptureRoot, "capture root does not exist");
    assertDirectChild(rawCaptures.resolved, captureRoot, "reserved capture root");
  }

  const logsRoot = path.join(evidenceRoot, "natural-trace-logs");
  const recorderRoot = path.join(logsRoot, captureName);
  const transactionsRoot = path.join(recorderRoot, "transactions");
  const lockPath = path.join(session.resolved, ".ts006-natural-trace-recorder.lock");
  if (requireRecorder) {
    await assertRealDirectory(evidenceRoot, "session evidence root");
    await assertRealDirectory(logsRoot, "natural-trace logs root");
    await assertRealDirectory(recorderRoot, "recorder root");
    await assertRealDirectory(transactionsRoot, "recorder transactions root");
  }
  return {
    allowedSessionsRoot: allowed.resolved,
    sessionRoot: session.resolved,
    rawCapturesRoot: rawCaptures.resolved,
    captureRoot: resolvedCaptureRoot,
    evidenceRoot,
    logsRoot,
    recorderRoot,
    transactionsRoot,
    lockPath,
  };
}

async function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

async function removeVerifiedStaleLock(lockPath, sessionRoot) {
  const lockInfo = await lstat(lockPath);
  invariant(
    lockInfo.isDirectory() && !lockInfo.isSymbolicLink(),
    "existing lock is not a real directory",
  );
  await assertRealpathWithin(lockPath, sessionRoot, "existing lock");
  const entries = await readdir(lockPath, {withFileTypes: true});
  invariant(
    entries.length === 1 &&
      entries[0].name === "owner.json" &&
      entries[0].isFile() &&
      !entries[0].isSymbolicLink(),
    "existing lock has an unexpected inventory",
  );
  const ownerFile = await readRegularSingleLink(
    path.join(lockPath, "owner.json"),
    lockPath,
    "lock owner",
    {allowEmpty: false},
  );
  const owner = parseCanonicalJson(ownerFile.bytes, "lock owner");
  invariant(
    owner.schemaVersion === 1 &&
      owner.artifactType === "ts006-recorder-ephemeral-session-lock" &&
      Number.isInteger(owner.pid) &&
      owner.pid > 1 &&
      typeof owner.nonce === "string",
    "existing lock owner is malformed",
  );
  invariant(!(await processExists(owner.pid)), `recorder lock is held by live PID ${owner.pid}`);
  await unlink(path.join(lockPath, "owner.json"));
  await rmdir(lockPath);
  await fsyncDirectory(sessionRoot);
}

async function acquireSessionLock(layout, {recoverStaleLock = true} = {}) {
  let staleRecovered = false;
  try {
    await mkdir(layout.lockPath, {mode: 0o700});
  } catch (error) {
    if (error.code !== "EEXIST" || !recoverStaleLock) throw error;
    await removeVerifiedStaleLock(layout.lockPath, layout.sessionRoot);
    staleRecovered = true;
    await mkdir(layout.lockPath, {mode: 0o700});
  }
  const lockInfo = await assertRealDirectory(layout.lockPath, "session lock");
  assertDirectChild(layout.sessionRoot, lockInfo.resolved, "session lock");
  const owner = {
    schemaVersion: 1,
    artifactType: "ts006-recorder-ephemeral-session-lock",
    sessionId: path.basename(layout.sessionRoot),
    pid: process.pid,
    nonce: randomUUID(),
    acquiredAt: new Date().toISOString(),
  };
  await writeExclusiveSynced(
    path.join(layout.lockPath, "owner.json"),
    layout.lockPath,
    canonicalLine(owner),
    {mode: 0o400},
  );
  await fsyncDirectory(layout.lockPath);
  await fsyncDirectory(layout.sessionRoot);
  return {
    staleRecovered,
    async release() {
      const currentLock = await lstat(layout.lockPath);
      invariant(
        currentLock.dev === lockInfo.metadata.dev &&
          currentLock.ino === lockInfo.metadata.ino,
        "session lock identity changed before release",
      );
      const currentOwner = await readRegularSingleLink(
        path.join(layout.lockPath, "owner.json"),
        layout.lockPath,
        "current lock owner",
        {allowEmpty: false},
      );
      invariant(
        currentOwner.bytes.equals(canonicalLine(owner)),
        "session lock owner changed before release",
      );
      await unlink(path.join(layout.lockPath, "owner.json"));
      await rmdir(layout.lockPath);
      await fsyncDirectory(layout.sessionRoot);
    },
  };
}

function manifestWithoutFingerprint({
  contract,
  contractFile,
  bridgeBinding,
  captureName,
  operator,
}) {
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-append-only-recorder",
    status: "initialized-pending-candidate-only",
    animationId: ANIMATION_ID,
    language: contract.language,
    sessionId: contract.sessionId,
    captureBinding: captureBinding(contract, captureName),
    bridgeBinding: {
      bridgeManifestSha256: bridgeBinding.bridgeManifestSha256,
      bridgeInputFingerprintSha256: contract.bridgeInputFingerprintSha256,
      traceSpecSetSha256: contract.traceSpecSetSha256,
      sourceStatus: "current-bridge-bound-at-recorder-initialization",
    },
    sessionContract: contractFile,
    operator,
    logs: Object.fromEntries(
      LOG_KINDS.map((kind) => [
        kind,
        {
          path: `${kind}.jsonl`,
          evidenceType: LOG_DEFINITIONS[kind].evidenceType,
          previousHashField: LOG_DEFINITIONS[kind].previousHashField,
          ownHashField: LOG_DEFINITIONS[kind].ownHashField,
          initialBytes: 0,
          initialSha256: sha256(Buffer.alloc(0)),
        },
      ]),
    ),
    transactions: {
      directory: "transactions",
      protocol: "immutable-intent-then-fsynced-append-then-immutable-commit-v1",
      partialAppendPolicy: "fail-closed-no-automatic-truncation",
      exactPreimageOrExactPostimageRecoveryOnly: true,
    },
    writeBoundary: {
      sessionRootDirectChildOfAllowedRoot: true,
      captureRootRelative: `${CANONICAL_RAW_CAPTURES_RELATIVE}/${captureName}`,
      captureRootDirectChildOfSessionRawCapturesRoot: true,
      legacySessionRootCaptureLayoutAccepted: false,
      recorderRoot:
        `evidence/natural-trace-logs/${captureName}`,
      regularSingleLinkFilesOnly: true,
      symbolicLinksAllowed: false,
      hardLinksAllowed: false,
      noReplaceInitialization: true,
      appendUsesONofollow: true,
      everyWriteFsynced: true,
      perSessionLock: ".ts006-natural-trace-recorder.lock",
    },
    machineClaim: {
      classification: "append-only-structural-recording-infrastructure",
      automationEventProvenanceBound: true,
      namedRuntimeOperatorBound: false,
      namedHumanSessionAttestationEstablished: false,
      independentHumanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      signatureTrustEstablished: false,
      originalRuntimeAuthorityEstablished: false,
    },
    promotionEligible: false,
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
}

async function loadRecorder(layout) {
  const inventory = await readdir(layout.recorderRoot, {withFileTypes: true});
  const expectedFiles = [
    "host-entry.jsonl",
    "operation.jsonl",
    "recorder-manifest.json",
    "session-contract.json",
    "source-target.jsonl",
    "state.jsonl",
  ];
  const actualFiles = inventory
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .sort();
  const directories = inventory
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => entry.name);
  invariant(
    inventory.every((entry) =>
      (entry.isFile() || entry.isDirectory()) && !entry.isSymbolicLink()),
    "recorder root contains a symbolic link or unsupported entry",
  );
  invariant(
    canonicalJson(actualFiles) === canonicalJson(expectedFiles) &&
      canonicalJson(directories) === canonicalJson(["transactions"]),
    "recorder root inventory differs from its exact allowlist",
  );
  const manifestFile = await readRegularSingleLink(
    path.join(layout.recorderRoot, "recorder-manifest.json"),
    layout.recorderRoot,
    "recorder manifest",
    {allowEmpty: false},
  );
  const contractFile = await readRegularSingleLink(
    path.join(layout.recorderRoot, "session-contract.json"),
    layout.recorderRoot,
    "recorder session contract",
    {allowEmpty: false},
  );
  const manifest = parseCanonicalJson(manifestFile.bytes, "recorder manifest");
  const contract = validateSessionContract(
    parseCanonicalJson(contractFile.bytes, "recorder session contract"),
  );
  validateFingerprint(manifest, "manifestFingerprintSha256", "recorder manifest");
  assertAuthorityNeutral(manifest, "recorder manifest");
  invariant(
    manifest.schemaVersion === 1 &&
      manifest.artifactType === "ts006-natural-trace-append-only-recorder" &&
      manifest.animationId === ANIMATION_ID &&
      manifest.sessionId === contract.sessionId &&
      manifest.language === contract.language,
    "recorder manifest identity differs from its session contract",
  );
  assertSha256(
    manifest.bridgeBinding?.bridgeManifestSha256,
    "recorder bridge manifest binding",
  );
  invariant(
    manifest.sessionContract.path === "session-contract.json" &&
      manifest.sessionContract.bytes === contractFile.bytes.length &&
      manifest.sessionContract.sha256 === sha256(contractFile.bytes) &&
      manifest.sessionContract.canonicalSha256 === sha256Canonical(contract),
    "recorder session-contract binding is stale",
  );
  invariant(
    canonicalJson(manifest.captureBinding) ===
      canonicalJson(captureBinding(contract, path.basename(layout.captureRoot))),
    "recorder capture binding differs from its direct-child capture",
  );
  invariant(
    manifest.writeBoundary?.captureRootRelative ===
        `${CANONICAL_RAW_CAPTURES_RELATIVE}/${path.basename(layout.captureRoot)}` &&
      manifest.writeBoundary?.captureRootDirectChildOfSessionRawCapturesRoot === true &&
      manifest.writeBoundary?.legacySessionRootCaptureLayoutAccepted === false,
    "recorder manifest capture write boundary drifted from the canonical raw-captures layout",
  );
  invariant(
    canonicalJson(manifest.operator) === canonicalJson(validateOperator(manifest.operator)),
    "recorder operator binding is invalid",
  );
  return {
    manifest,
    manifestFile,
    contract,
    contractFile,
  };
}

async function readChains(layout) {
  const chains = {};
  const files = {};
  for (const kind of LOG_KINDS) {
    const file = await readRegularSingleLink(
      path.join(layout.recorderRoot, `${kind}.jsonl`),
      layout.recorderRoot,
      `${kind} log`,
    );
    files[kind] = file;
    chains[kind] = parseCanonicalJsonl(file.bytes, `${kind} log`);
  }
  return {chains, files};
}

function commonRecordBindings(contract) {
  return {
    animationId: contract.animationId,
    language: contract.language,
    sessionId: contract.sessionId,
    requirementIds: structuredClone(contract.requirementIds),
    traceSpecSetSha256: contract.traceSpecSetSha256,
    bridgeInputFingerprintSha256: contract.bridgeInputFingerprintSha256,
    sessionKitSha256: contract.sessionKitSha256,
    profileManifestSha256: contract.profileManifestSha256,
    hostTreeManifestSha256: contract.hostTreeManifestSha256,
    projectorExecutableSha256: contract.projectorExecutableSha256,
    runtimeEnvironmentReadinessSha256:
      contract.runtimeEnvironmentReadinessSha256,
    containmentReadinessSha256: contract.containmentReadinessSha256,
  };
}

function assertRecordCommon(record, {
  kind,
  index,
  contract,
  manifest,
  previousHash,
  priorMonotonic,
}) {
  const definition = LOG_DEFINITIONS[kind];
  invariant(record.schemaVersion === 1, `${kind} record ${index + 1} schema mismatch`);
  invariant(
    record.evidenceType === definition.evidenceType,
    `${kind} record ${index + 1} evidence type mismatch`,
  );
  for (const [key, expected] of Object.entries(commonRecordBindings(contract))) {
    invariant(
      canonicalJson(record[key]) === canonicalJson(expected),
      `${kind} record ${index + 1} binding mismatch: ${key}`,
    );
  }
  invariant(
    canonicalJson(record.captureBinding) === canonicalJson(manifest.captureBinding),
    `${kind} record ${index + 1} capture binding mismatch`,
  );
  invariant(record.sequence === index + 1, `${kind} record sequence is not contiguous`);
  invariant(
    typeof record.occurredAt === "string" &&
      Number.isFinite(Date.parse(record.occurredAt)),
    `${kind} record ${index + 1} occurredAt is invalid`,
  );
  invariant(
    Number.isFinite(record.monotonicTimeMs) &&
      record.monotonicTimeMs >= 0 &&
      record.monotonicTimeMs >= priorMonotonic,
    `${kind} record ${index + 1} monotonic time moved backward`,
  );
  invariant(
    canonicalJson(record.operator) === canonicalJson(manifest.operator),
    `${kind} record ${index + 1} operator binding mismatch`,
  );
  invariant(
    record[definition.previousHashField] === previousHash,
    `${kind} record ${index + 1} previous hash mismatch`,
  );
  invariant(
    record[definition.ownHashField] ===
      ts006BridgeRecordSha256(record, definition.ownHashField),
    `${kind} record ${index + 1} hash mismatch`,
  );
  assertAuthorityNeutral(record, `${kind} record ${index + 1}`);
}

function assertExpectedScheduleRecord(record, scheduled, label) {
  invariant(record.scheduledOrder === scheduled.order, `${label} scheduled order mismatch`);
  invariant(record.scheduledStepId === scheduled.id, `${label} scheduled step mismatch`);
  invariant(
    record.scheduledStepSha256 === scheduled.scheduledStepSha256,
    `${label} scheduled step hash mismatch`,
  );
}

function validatePrefix(chains, contract, manifest) {
  for (const kind of LOG_KINDS) {
    let previousHash = null;
    let priorMonotonic = -1;
    const definition = LOG_DEFINITIONS[kind];
    for (let index = 0; index < chains[kind].length; index += 1) {
      const record = chains[kind][index];
      assertRecordCommon(record, {
        kind,
        index,
        contract,
        manifest,
        previousHash,
        priorMonotonic,
      });
      previousHash = record[definition.ownHashField];
      priorMonotonic = record.monotonicTimeMs;
      if (kind === "operation" || kind === "source-target") {
        invariant(index < contract.schedule.length, `${kind} log exceeds the schedule`);
        const scheduled = contract.schedule[index];
        assertExpectedScheduleRecord(record, scheduled, `${kind} record ${index + 1}`);
        if (kind === "operation") {
          invariant(
            canonicalJson(record.action) === canonicalJson(scheduled.action),
            `operation record ${index + 1} action mismatch`,
          );
          invariant(
            record.postStateCheckpointSha256 ===
              sha256Canonical(scheduled.postStateCheckpoint),
            `operation record ${index + 1} post-state checkpoint hash mismatch`,
          );
        } else {
          invariant(
            canonicalJson(record.expectedSourceTarget) ===
              canonicalJson(scheduled.sourceTarget),
            `source-target record ${index + 1} expected target mismatch`,
          );
          invariant(
            isPlainObject(record.resolvedSourceTarget) &&
              Object.keys(record.resolvedSourceTarget).length > 0,
            `source-target record ${index + 1} resolved target missing`,
          );
        }
      } else if (kind === "state") {
        const scheduleIndex = Math.floor(index / 2);
        invariant(scheduleIndex < contract.schedule.length, "state log exceeds the schedule");
        const scheduled = contract.schedule[scheduleIndex];
        const role = index % 2 === 0 ? "pre" : "post";
        assertExpectedScheduleRecord(record, scheduled, `state record ${index + 1}`);
        invariant(record.checkpointRole === role, `state record ${index + 1} checkpoint role mismatch`);
        const checkpoint = role === "pre"
          ? scheduled.preStateCheckpoint
          : scheduled.postStateCheckpoint;
        invariant(
          canonicalJson(record.expectedState) === canonicalJson(checkpoint.expectedState),
          `state record ${index + 1} expected state mismatch`,
        );
        invariant(
          record.observedStateSha256 === sha256Canonical(record.observedState),
          `state record ${index + 1} observed-state hash mismatch`,
        );
        invariant(
          record.width === 800 && record.height === 600,
          `state record ${index + 1} screenshot is not 800x600`,
        );
      } else {
        invariant(index < EXPECTED_HOST_ENTRY_EVENTS.length, "host-entry log exceeds its schedule");
        invariant(
          record.hostEntryEvent === EXPECTED_HOST_ENTRY_EVENTS[index],
          `host-entry record ${index + 1} event mismatch`,
        );
      }
    }
  }

  invariant(
    chains.operation.length <= chains["source-target"].length,
    "operation chain is ahead of source-target resolution",
  );
  invariant(
    chains.operation.length <= Math.floor((chains.state.length + 1) / 2),
    "operation chain is ahead of its pre-state observations",
  );
  const preStateCount = Math.ceil(chains.state.length / 2);
  const postStateCount = Math.floor(chains.state.length / 2);
  invariant(
    postStateCount <= chains.operation.length &&
      chains.operation.length <= preStateCount &&
      preStateCount <= chains["source-target"].length,
    "cross-chain phase order must be source-target, pre-state, operation, post-state",
  );
  invariant(
    chains["source-target"].length >= chains.operation.length &&
      chains["source-target"].length <= chains.operation.length + 1,
    "source-target chain may be at most one step ahead of operations",
  );
  for (let index = 0; index < chains.operation.length; index += 1) {
    const sourceTarget = chains["source-target"][index];
    const pre = chains.state[index * 2];
    const operation = chains.operation[index];
    invariant(
      operation.sourceTargetRecordSha256 === sourceTarget.recordSha256,
      `operation ${index + 1} does not bind source-target ${index + 1}`,
    );
    invariant(
      operation.preStateRecordSha256 === pre.recordSha256,
      `operation ${index + 1} does not bind pre-state ${index + 1}`,
    );
    const post = chains.state[index * 2 + 1];
    if (post) {
      invariant(
        post.causalOperationEventSha256 === operation.eventSha256,
        `post-state ${index + 1} does not bind operation ${index + 1}`,
      );
      invariant(
        sourceTarget.monotonicTimeMs <= pre.monotonicTimeMs &&
          pre.monotonicTimeMs <= operation.monotonicTimeMs &&
          operation.monotonicTimeMs <= post.monotonicTimeMs,
        `step ${index + 1} cross-log monotonic order is invalid`,
      );
    }
  }
  return true;
}

function nextExpected(kind, chains, contract) {
  if (kind === "operation" || kind === "source-target") {
    const index = chains[kind].length;
    invariant(index < contract.schedule.length, `${kind} chain is already complete`);
    return {sequence: index + 1, scheduled: contract.schedule[index]};
  }
  if (kind === "state") {
    const index = chains.state.length;
    invariant(index < contract.schedule.length * 2, "state chain is already complete");
    return {
      sequence: index + 1,
      scheduled: contract.schedule[Math.floor(index / 2)],
      checkpointRole: index % 2 === 0 ? "pre" : "post",
    };
  }
  const index = chains["host-entry"].length;
  invariant(index < EXPECTED_HOST_ENTRY_EVENTS.length, "host-entry chain is already complete");
  return {
    sequence: index + 1,
    hostEntryEvent: EXPECTED_HOST_ENTRY_EVENTS[index],
  };
}

function validatePayload(kind, payload) {
  invariant(isPlainObject(payload), `${kind} payload must be an object`);
  for (const key of Object.keys(payload)) {
    invariant(PAYLOAD_KEYS[kind].has(key), `${kind} payload field is not allowed: ${key}`);
    invariant(!COMMON_MANAGED_FIELDS.has(key), `${kind} payload tries to set managed field ${key}`);
  }
  assertNoEscalation(payload, `${kind} payload`);
}

async function readSessionEvidence(layout, relative, label) {
  const normalized = normalizeRelativeFile(relative, label);
  const candidate = path.resolve(layout.sessionRoot, ...normalized.split("/"));
  invariant(
    candidate !== layout.recorderRoot &&
      !candidate.startsWith(`${layout.recorderRoot}${path.sep}`),
    `${label} cannot point into recorder output`,
  );
  return readRegularSingleLink(candidate, layout.sessionRoot, label, {allowEmpty: false});
}

async function readCaptureScreenshot(layout, relative, label) {
  const normalized = normalizeRelativeFile(relative, label);
  invariant(
    /^frames\/frame-[0-9]{6}\.png$/u.test(normalized),
    `${label} must be a numbered capture frame PNG`,
  );
  const artifact = await readRegularSingleLink(
    path.resolve(layout.captureRoot, ...normalized.split("/")),
    layout.captureRoot,
    label,
    {allowEmpty: false},
  );
  const dimensions = inspectPng(artifact.bytes, label);
  invariant(
    dimensions.width === 800 && dimensions.height === 600,
    `${label} must be 800x600`,
  );
  return {
    file: normalized,
    sha256: sha256(artifact.bytes),
    ...dimensions,
  };
}

async function buildKindFields({kind, payload, expected, chains, contract, layout}) {
  if (kind === "source-target") {
    invariant(
      payload.scheduledStepId === expected.scheduled.id,
      `expected source-target step ${expected.scheduled.id}`,
    );
    invariant(
      isPlainObject(payload.resolvedSourceTarget) &&
        Object.keys(payload.resolvedSourceTarget).length > 0,
      "source-target resolvedSourceTarget is required",
    );
    if (expected.scheduled.order > 1) {
      const priorPost = chains.state[(expected.scheduled.order - 2) * 2 + 1];
      invariant(
        priorPost?.checkpointRole === "post",
        "next source-target cannot be recorded before the prior step post-state",
      );
    }
    const evidence = await readSessionEvidence(
      layout,
      payload.resolutionEvidenceFile,
      "source-target resolution evidence",
    );
    return {
      scheduledOrder: expected.scheduled.order,
      scheduledStepId: expected.scheduled.id,
      scheduledStepSha256: expected.scheduled.scheduledStepSha256,
      expectedSourceTarget: structuredClone(expected.scheduled.sourceTarget),
      resolvedSourceTarget: structuredClone(payload.resolvedSourceTarget),
      resolutionEvidenceFile: normalizeRelativeFile(
        payload.resolutionEvidenceFile,
        "source-target resolution evidence",
      ),
      resolutionEvidenceSha256: sha256(evidence.bytes),
    };
  }
  if (kind === "state") {
    invariant(
      payload.scheduledStepId === expected.scheduled.id,
      `expected state step ${expected.scheduled.id}`,
    );
    invariant(
      payload.checkpointRole === expected.checkpointRole,
      `expected ${expected.checkpointRole} state checkpoint`,
    );
    invariant(["root", "sprite-23"].includes(payload.frameDomainId), "state frame domain is invalid");
    invariant(
      Number.isInteger(payload.rootFrame) &&
        payload.rootFrame >= 1 &&
        payload.rootFrame <= 10,
      "state rootFrame is outside 1..10",
    );
    const lastLocalFrame = payload.frameDomainId === "root" ? 10 : 128;
    invariant(
      Number.isInteger(payload.localFrame) &&
        payload.localFrame >= 1 &&
        payload.localFrame <= lastLocalFrame,
      `state localFrame is outside 1..${lastLocalFrame}`,
    );
    invariant(isPlainObject(payload.observedState), "state observedState is required");
    if (expected.checkpointRole === "pre") {
      const target = chains["source-target"][expected.scheduled.order - 1];
      invariant(
        target,
        "pre-state cannot be recorded before its source-target resolution",
      );
    }
    const screenshot = await readCaptureScreenshot(
      layout,
      payload.screenshotFile,
      "state screenshot",
    );
    const checkpoint = expected.checkpointRole === "pre"
      ? expected.scheduled.preStateCheckpoint
      : expected.scheduled.postStateCheckpoint;
    let causalOperationEventSha256 = null;
    if (expected.checkpointRole === "post") {
      const operation = chains.operation[expected.scheduled.order - 1];
      invariant(operation, "post-state cannot be recorded before its operation");
      causalOperationEventSha256 = operation.eventSha256;
    }
    return {
      scheduledOrder: expected.scheduled.order,
      scheduledStepId: expected.scheduled.id,
      scheduledStepSha256: expected.scheduled.scheduledStepSha256,
      checkpointRole: expected.checkpointRole,
      expectedState: structuredClone(checkpoint.expectedState),
      frameDomainId: payload.frameDomainId,
      rootFrame: payload.rootFrame,
      localFrame: payload.localFrame,
      observedState: structuredClone(payload.observedState),
      observedStateSha256: sha256Canonical(payload.observedState),
      screenshotFile: screenshot.file,
      screenshotSha256: screenshot.sha256,
      width: screenshot.width,
      height: screenshot.height,
      causalOperationEventSha256,
    };
  }
  if (kind === "operation") {
    invariant(
      payload.scheduledStepId === expected.scheduled.id,
      `expected operation step ${expected.scheduled.id}`,
    );
    invariant(isPlainObject(payload.result), "operation result is required");
    const sourceTarget = chains["source-target"][expected.scheduled.order - 1];
    const preState = chains.state[(expected.scheduled.order - 1) * 2];
    invariant(sourceTarget, "operation cannot be recorded before source-target resolution");
    invariant(preState?.checkpointRole === "pre", "operation cannot be recorded before its pre-state");
    const fields = {
      scheduledOrder: expected.scheduled.order,
      scheduledStepId: expected.scheduled.id,
      scheduledStepSha256: expected.scheduled.scheduledStepSha256,
      action: structuredClone(expected.scheduled.action),
      sourceTargetRecordSha256: sourceTarget.recordSha256,
      preStateRecordSha256: preState.recordSha256,
      postStateCheckpointSha256: sha256Canonical(expected.scheduled.postStateCheckpoint),
      result: structuredClone(payload.result),
    };
    if (payload.replayObservation !== undefined) {
      fields.replayObservation = structuredClone(payload.replayObservation);
    }
    if (payload.replayCycleObservation !== undefined) {
      fields.replayCycleObservation = structuredClone(payload.replayCycleObservation);
    }
    if (payload.audioObservation !== undefined) {
      invariant(contract.language === "es", "audioObservation is allowed only in the Spanish session");
      invariant(isPlainObject(payload.audioObservation), "audioObservation must be an object");
      const observation = structuredClone(payload.audioObservation);
      invariant(
        typeof observation.losslessSessionAudioFile === "string",
        "audioObservation.losslessSessionAudioFile is required",
      );
      const audioFile = await readRegularSingleLink(
        path.resolve(
          layout.captureRoot,
          ...normalizeRelativeFile(
            observation.losslessSessionAudioFile,
            "lossless session audio",
          ).split("/"),
        ),
        layout.captureRoot,
        "lossless session audio",
        {allowEmpty: false},
      );
      invariant(
        observation.losslessSessionAudioSha256 === undefined,
        "audioObservation lossless-session hash is recorder-managed",
      );
      observation.losslessSessionAudioSha256 = sha256(audioFile.bytes);
      fields.audioObservation = observation;
    }
    return fields;
  }

  invariant(
    payload.hostEntryEvent === expected.hostEntryEvent,
    `expected host-entry event ${expected.hostEntryEvent}`,
  );
  const evidence = await readSessionEvidence(
    layout,
    payload.evidenceLocator,
    "host-entry evidence",
  );
  const fields = {
    hostEntryEvent: expected.hostEntryEvent,
    processId: payload.processId ?? null,
    observedRootFrame: payload.observedRootFrame ?? null,
    observedLocalFrame: payload.observedLocalFrame ?? null,
    evidenceLocator: normalizeRelativeFile(
      payload.evidenceLocator,
      "host-entry evidence",
    ),
    evidenceSha256: sha256(evidence.bytes),
  };
  for (const key of PAYLOAD_KEYS["host-entry"]) {
    if (
      !["hostEntryEvent", "evidenceLocator", "screenshotFile"].includes(key) &&
      payload[key] !== undefined
    ) {
      fields[key] = payload[key];
    }
  }
  if (payload.screenshotFile !== undefined) {
    const screenshot = await readCaptureScreenshot(
      layout,
      payload.screenshotFile,
      "host-entry screenshot",
    );
    fields.screenshotFile = screenshot.file;
    fields.screenshotSha256 = screenshot.sha256;
    fields.width = screenshot.width;
    fields.height = screenshot.height;
  }
  if (expected.hostEntryEvent === "profile-empty-preflight") {
    fields.livePreflightReceiptSha256 = fields.evidenceSha256;
  }
  if (expected.hostEntryEvent === "named-human-file-open-selected-staged-host") {
    invariant(
      fields.humanFileOpenObserved === false,
      "automation recorder cannot claim a named-human file-open observation",
    );
    invariant(
      fields.automationFileOpenObserved === true,
      "automation file-open observation must be explicit",
    );
  }
  if (expected.hostEntryEvent === "post-session-side-effect-summary") {
    fields.requestAuditSha256 = fields.evidenceSha256;
  }
  return fields;
}

async function readJournalFile(candidate, transactionsRoot, label) {
  const file = await readRegularSingleLink(candidate, transactionsRoot, label, {
    allowEmpty: false,
  });
  const document = parseCanonicalJson(file.bytes, label);
  validateFingerprint(document, "journalFingerprintSha256", label);
  return {file, document};
}

async function auditTransactions(layout) {
  const entries = await readdir(layout.transactionsRoot, {withFileTypes: true});
  const names = entries.map((entry) => entry.name).sort();
  invariant(
    entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()),
    "transactions directory contains a non-regular entry",
  );
  const intentNames = names.filter((name) => name.endsWith(".intent.json"));
  invariant(
    names.every((name) =>
      name.endsWith(".intent.json") ||
      name.endsWith(".commit.json") ||
      name.endsWith(".recovery.json")),
    "transactions directory contains an unexpected file",
  );
  const outstanding = [];
  const completed = [];
  for (const name of intentNames) {
    const prefix = name.slice(0, -".intent.json".length);
    const intent = await readJournalFile(
      path.join(layout.transactionsRoot, name),
      layout.transactionsRoot,
      `transaction ${prefix} intent`,
    );
    invariant(
      intent.document.schemaVersion === 1 &&
        intent.document.artifactType === "ts006-recorder-append-intent" &&
        intent.document.transactionId === prefix &&
        LOG_KINDS.includes(intent.document.logKind) &&
        intent.document.logPath === `${intent.document.logKind}.jsonl` &&
        Number.isInteger(intent.document.sequence) &&
        intent.document.sequence > 0 &&
        HASH_PATTERN.test(intent.document.recordSha256 || "") &&
        intent.document.preimage?.nlink === 1 &&
        Number.isInteger(intent.document.preimage?.bytes) &&
        HASH_PATTERN.test(intent.document.preimage?.sha256 || "") &&
        Number.isInteger(intent.document.expectedPostimage?.bytes) &&
        HASH_PATTERN.test(intent.document.expectedPostimage?.sha256 || ""),
      `transaction ${prefix} intent identity is invalid`,
    );
    assertAuthorityNeutral(intent.document, `transaction ${prefix} intent`);
    const commitPath = path.join(layout.transactionsRoot, `${prefix}.commit.json`);
    const recoveryPath = path.join(layout.transactionsRoot, `${prefix}.recovery.json`);
    const commitInfo = await lstatOrNull(commitPath);
    const recoveryInfo = await lstatOrNull(recoveryPath);
    invariant(!(commitInfo && recoveryInfo), `transaction ${prefix} has both commit and recovery records`);
    if (!commitInfo && !recoveryInfo) {
      outstanding.push(intent);
      continue;
    }
    const terminal = await readJournalFile(
      commitInfo ? commitPath : recoveryPath,
      layout.transactionsRoot,
      `transaction ${prefix} terminal`,
    );
    invariant(
      terminal.document.transactionId === prefix &&
        terminal.document.intentSha256 === sha256(intent.file.bytes),
      `transaction ${prefix} terminal does not bind its intent`,
    );
    assertAuthorityNeutral(terminal.document, `transaction ${prefix} terminal`);
    if (commitInfo) {
      invariant(
        terminal.document.artifactType === "ts006-recorder-append-commit" &&
          terminal.document.sessionId === intent.document.sessionId &&
          terminal.document.logKind === intent.document.logKind &&
          terminal.document.sequence === intent.document.sequence &&
          terminal.document.recordSha256 === intent.document.recordSha256 &&
          terminal.document.postimage?.bytes ===
            intent.document.expectedPostimage.bytes &&
          terminal.document.postimage?.sha256 ===
            intent.document.expectedPostimage.sha256 &&
          terminal.document.postimage?.nlink === 1,
        `transaction ${prefix} commit does not bind its exact intended postimage`,
      );
    } else {
      invariant(
        terminal.document.artifactType === "ts006-recorder-append-recovery" &&
          terminal.document.sessionId === intent.document.sessionId &&
          terminal.document.logKind === intent.document.logKind &&
          terminal.document.sequence === intent.document.sequence &&
          terminal.document.recoveryDisposition ===
            "aborted-before-append-exact-preimage-preserved" &&
          terminal.document.recordCommitted === false &&
          terminal.document.current?.bytes === intent.document.preimage.bytes &&
          terminal.document.current?.sha256 === intent.document.preimage.sha256,
        `transaction ${prefix} recovery does not preserve its exact preimage`,
      );
    }
    completed.push({intent, terminal});
  }
  const expectedTerminalNames = completed.map(({terminal}) =>
    path.basename(terminal.file.path));
  const actualTerminalNames = names.filter((name) =>
    name.endsWith(".commit.json") || name.endsWith(".recovery.json"));
  invariant(
    canonicalJson(expectedTerminalNames.sort()) === canonicalJson(actualTerminalNames.sort()),
    "transaction terminal exists without exactly one intent",
  );
  return {outstanding, completed};
}

function verifyTransactionRecordCoverage(transactions, chains) {
  const commitsByKindAndSequence = new Map();
  for (const {intent, terminal} of transactions.completed) {
    if (terminal.document.artifactType !== "ts006-recorder-append-commit") continue;
    const key = `${intent.document.logKind}:${intent.document.sequence}`;
    invariant(
      !commitsByKindAndSequence.has(key),
      `more than one committed append exists for ${key}`,
    );
    commitsByKindAndSequence.set(key, intent.document);
  }
  for (const kind of LOG_KINDS) {
    const definition = LOG_DEFINITIONS[kind];
    for (const record of chains[kind]) {
      const key = `${kind}:${record.sequence}`;
      const intent = commitsByKindAndSequence.get(key);
      invariant(intent, `record ${key} has no committed append journal`);
      invariant(
        intent.recordSha256 === record[definition.ownHashField],
        `record ${key} differs from its committed append journal`,
      );
      commitsByKindAndSequence.delete(key);
    }
  }
  invariant(
    commitsByKindAndSequence.size === 0,
    "committed append journal exists without a matching chain record",
  );
}

function journalIntent({
  transactionId,
  kind,
  record,
  definition,
  logFile,
  expectedPostimage,
}) {
  return fingerprinted({
    schemaVersion: 1,
    artifactType: "ts006-recorder-append-intent",
    transactionId,
    sessionId: record.sessionId,
    captureBinding: record.captureBinding,
    logKind: kind,
    logPath: `${kind}.jsonl`,
    sequence: record.sequence,
    recordHashField: definition.ownHashField,
    recordSha256: record[definition.ownHashField],
    recordCanonicalLineSha256: sha256(canonicalLine(record)),
    preimage: {
      bytes: logFile.bytes.length,
      sha256: sha256(logFile.bytes),
      dev: String(logFile.metadata.dev),
      ino: String(logFile.metadata.ino),
      nlink: logFile.metadata.nlink,
    },
    expectedPostimage: {
      bytes: expectedPostimage.length,
      sha256: sha256(expectedPostimage),
    },
    recoveryPolicy:
      "commit-only-for-exact-postimage; abort-only-for-exact-preimage; partial-or-divergent-postimage-fails-closed",
    promotionEligible: false,
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  }, "journalFingerprintSha256");
}

async function appendWithJournal({
  layout,
  kind,
  record,
  logFile,
  hooks = {},
}) {
  const definition = LOG_DEFINITIONS[kind];
  const line = canonicalLine(record);
  invariant(line.length <= MAX_RECORD_BYTES + 1, "record exceeds maximum canonical line size");
  const expectedPostimage = Buffer.concat([logFile.bytes, line]);
  const transactionId =
    `${kind}-${String(record.sequence).padStart(4, "0")}-${record[definition.ownHashField].slice(0, 16)}-${randomUUID()}`;
  const intent = journalIntent({
    transactionId,
    kind,
    record,
    definition,
    logFile,
    expectedPostimage,
  });
  const intentPath = path.join(
    layout.transactionsRoot,
    `${transactionId}.intent.json`,
  );
  const intentBytes = canonicalLine(intent);
  await writeExclusiveSynced(
    intentPath,
    layout.transactionsRoot,
    intentBytes,
    {mode: 0o400},
  );
  await hooks.afterIntent?.({transactionId, intent, intentPath});

  const logPath = path.join(layout.recorderRoot, `${kind}.jsonl`);
  const before = await lstat(logPath);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1 &&
      before.dev === logFile.metadata.dev &&
      before.ino === logFile.metadata.ino,
    `${kind} log identity changed before append`,
  );
  const descriptor = await open(
    logPath,
    fsConstants.O_RDWR |
      fsConstants.O_APPEND |
      fsConstants.O_NOFOLLOW,
  );
  try {
    const opened = await descriptor.stat();
    invariant(
      opened.isFile() &&
        opened.nlink === 1 &&
        opened.dev === before.dev &&
        opened.ino === before.ino,
      `${kind} append descriptor identity changed`,
    );
    const current = Buffer.alloc(logFile.bytes.length);
    if (current.length > 0) {
      const read = await descriptor.read(current, 0, current.length, 0);
      invariant(
        read.bytesRead === current.length && current.equals(logFile.bytes),
        `${kind} log preimage changed`,
      );
    } else {
      invariant(opened.size === 0, `${kind} empty-log preimage changed`);
    }
    invariant(opened.size === logFile.bytes.length, `${kind} log size changed`);
    const written = await descriptor.write(line, 0, line.length, null);
    invariant(written.bytesWritten === line.length, `${kind} append was partial`);
    await descriptor.sync();
  } finally {
    await descriptor.close();
  }
  await fsyncDirectory(layout.recorderRoot);
  await hooks.afterAppend?.({transactionId, expectedPostimage});

  const after = await readRegularSingleLink(
    logPath,
    layout.recorderRoot,
    `${kind} post-append log`,
  );
  invariant(
    after.bytes.equals(expectedPostimage) &&
      after.metadata.dev === before.dev &&
      after.metadata.ino === before.ino,
    `${kind} append postimage or inode differs from the journal`,
  );
  const commit = fingerprinted({
    schemaVersion: 1,
    artifactType: "ts006-recorder-append-commit",
    transactionId,
    intentSha256: sha256(intentBytes),
    sessionId: record.sessionId,
    logKind: kind,
    sequence: record.sequence,
    recordSha256: record[definition.ownHashField],
    postimage: {
      bytes: after.bytes.length,
      sha256: sha256(after.bytes),
      dev: String(after.metadata.dev),
      ino: String(after.metadata.ino),
      nlink: after.metadata.nlink,
    },
    recoveredAfterCrash: false,
    promotionEligible: false,
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  }, "journalFingerprintSha256");
  await writeExclusiveSynced(
    path.join(layout.transactionsRoot, `${transactionId}.commit.json`),
    layout.transactionsRoot,
    canonicalLine(commit),
    {mode: 0o400},
  );
  return {transactionId, record, commit};
}

export async function initializeTs006NaturalTraceRecorder({
  projectRoot = DEFAULT_PROJECT_ROOT,
  allowedSessionsRoot =
    path.resolve(projectRoot, DEFAULT_SESSIONS_ROOT_RELATIVE),
  sessionRoot,
  captureName,
  operator,
  sessionContract = null,
  bridgeManifest = null,
  hooks = {},
} = {}) {
  let contract = sessionContract;
  let bridge = bridgeManifest;
  if (!contract || !bridge) {
    bridge = await buildTs006NaturalTraceBridge({repositoryRoot: projectRoot});
    const language = SESSION_ID_PATTERN.exec(path.basename(path.resolve(sessionRoot)))?.[1]?.toLowerCase();
    contract = bridge.sessions.find((item) => item.language === language);
  }
  validateSessionContract(contract);
  invariant(
    bridge?.artifactType === "ts006-natural-trace-hash-chain-capture-bridge" &&
      HASH_PATTERN.test(bridge.bridgeManifestSha256 || "") &&
      bridge.bridgeInputFingerprintSha256 === contract.bridgeInputFingerprintSha256,
    "bridge manifest does not bind the selected session contract",
  );
  const normalizedOperator = validateOperator(operator);
  const layout = await resolveLayout({
    sessionRoot,
    captureName,
    allowedSessionsRoot,
    contract,
    allowMissingCaptureRoot: true,
  });
  const sessionLock = await acquireSessionLock(layout);
  try {
    await hooks.afterLock?.();
    if (!(await lstatOrNull(layout.evidenceRoot))) {
      await ensureRealDirectory(
        layout.evidenceRoot,
        layout.sessionRoot,
        "session evidence root",
      );
    } else {
      await assertRealDirectory(layout.evidenceRoot, "session evidence root");
    }
    if (!(await lstatOrNull(layout.logsRoot))) {
      await ensureRealDirectory(
        layout.logsRoot,
        layout.evidenceRoot,
        "natural-trace logs root",
      );
    } else {
      await assertRealDirectory(layout.logsRoot, "natural-trace logs root");
    }
    invariant(!(await lstatOrNull(layout.recorderRoot)), "recorder output already exists; no-replace initialization refused");
    await ensureRealDirectory(
      layout.recorderRoot,
      layout.logsRoot,
      "recorder root",
      {exclusive: true},
    );
    await ensureRealDirectory(
      layout.transactionsRoot,
      layout.recorderRoot,
      "recorder transactions root",
      {exclusive: true},
    );
    const contractBytes = canonicalLine(contract);
    const contractDescriptor = {
      path: "session-contract.json",
      bytes: contractBytes.length,
      sha256: sha256(contractBytes),
      canonicalSha256: sha256Canonical(contract),
    };
    const manifest = fingerprinted(
      manifestWithoutFingerprint({
        contract,
        contractFile: contractDescriptor,
        bridgeBinding: bridge,
        captureName,
        operator: normalizedOperator,
      }),
      "manifestFingerprintSha256",
    );
    await writeExclusiveSynced(
      path.join(layout.recorderRoot, "session-contract.json"),
      layout.recorderRoot,
      contractBytes,
      {mode: 0o400},
    );
    await writeExclusiveSynced(
      path.join(layout.recorderRoot, "recorder-manifest.json"),
      layout.recorderRoot,
      canonicalLine(manifest),
      {mode: 0o400},
    );
    for (const kind of LOG_KINDS) {
      await writeExclusiveSynced(
        path.join(layout.recorderRoot, `${kind}.jsonl`),
        layout.recorderRoot,
        Buffer.alloc(0),
        {mode: 0o600},
      );
    }
    await fsyncDirectory(layout.transactionsRoot);
    await fsyncDirectory(layout.recorderRoot);
    await fsyncDirectory(layout.logsRoot);
    return {
      recorderRoot: layout.recorderRoot,
      manifest,
      contract,
      staleLockRecovered: sessionLock.staleRecovered,
      promotionEligible: false,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await sessionLock.release();
  }
}

export async function appendTs006NaturalTraceRecord({
  projectRoot = DEFAULT_PROJECT_ROOT,
  allowedSessionsRoot =
    path.resolve(projectRoot, DEFAULT_SESSIONS_ROOT_RELATIVE),
  sessionRoot,
  captureName,
  kind,
  occurredAt,
  monotonicTimeMs,
  payload,
  hooks = {},
} = {}) {
  invariant(LOG_KINDS.includes(kind), `unsupported log kind: ${kind}`);
  invariant(
    typeof occurredAt === "string" && Number.isFinite(Date.parse(occurredAt)),
    "occurredAt must be an ISO timestamp",
  );
  invariant(
    Number.isFinite(monotonicTimeMs) && monotonicTimeMs >= 0,
    "monotonicTimeMs must be a non-negative number",
  );
  validatePayload(kind, payload);
  const preliminaryLayout = await resolveLayout({
    sessionRoot,
    captureName,
    allowedSessionsRoot,
  });
  const sessionLock = await acquireSessionLock(preliminaryLayout);
  try {
    await hooks.afterLock?.();
    const layout = await resolveLayout({
      sessionRoot,
      captureName,
      allowedSessionsRoot,
      requireRecorder: true,
    });
    const recorder = await loadRecorder(layout);
    const {chains, files} = await readChains(layout);
    validatePrefix(chains, recorder.contract, recorder.manifest);
    const transactions = await auditTransactions(layout);
    invariant(
      transactions.outstanding.length === 0,
      "an unresolved append intent exists; run recover before appending",
    );
    const expected = nextExpected(kind, chains, recorder.contract);
    const kindFields = await buildKindFields({
      kind,
      payload,
      expected,
      chains,
      contract: recorder.contract,
      layout,
    });
    const definition = LOG_DEFINITIONS[kind];
    const previous = chains[kind].at(-1)?.[definition.ownHashField] ?? null;
    const record = {
      schemaVersion: 1,
      evidenceType: definition.evidenceType,
      ...commonRecordBindings(recorder.contract),
      captureBinding: structuredClone(recorder.manifest.captureBinding),
      sequence: expected.sequence,
      occurredAt,
      monotonicTimeMs,
      operator: structuredClone(recorder.manifest.operator),
      [definition.previousHashField]: previous,
      ...kindFields,
      promotionEligible: false,
      authority: structuredClone(AUTHORITY_FALSE),
      acceptance: structuredClone(AUTHORITY_FALSE),
      strictAcceptanceEffect: "none",
    };
    record[definition.ownHashField] = ts006BridgeRecordSha256(
      record,
      definition.ownHashField,
    );
    const result = await appendWithJournal({
      layout,
      kind,
      record,
      logFile: files[kind],
      hooks,
    });
    const after = await readChains(layout);
    validatePrefix(after.chains, recorder.contract, recorder.manifest);
    return {
      ...result,
      recorderRoot: layout.recorderRoot,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await sessionLock.release();
  }
}

async function recoverOneOutstanding(layout, outstanding) {
  const intent = outstanding.document;
  const logPath = path.join(layout.recorderRoot, intent.logPath);
  invariant(
    LOG_KINDS.includes(intent.logKind) &&
      intent.logPath === `${intent.logKind}.jsonl`,
    "outstanding intent targets an invalid log",
  );
  const log = await readRegularSingleLink(
    logPath,
    layout.recorderRoot,
    `${intent.logKind} recovery log`,
  );
  const current = {bytes: log.bytes.length, sha256: sha256(log.bytes)};
  const intentSha256 = sha256(outstanding.file.bytes);
  let terminal;
  let suffix;
  if (
    current.bytes === intent.preimage.bytes &&
    current.sha256 === intent.preimage.sha256
  ) {
    suffix = "recovery";
    terminal = fingerprinted({
      schemaVersion: 1,
      artifactType: "ts006-recorder-append-recovery",
      transactionId: intent.transactionId,
      intentSha256,
      sessionId: intent.sessionId,
      logKind: intent.logKind,
      sequence: intent.sequence,
      recoveryDisposition: "aborted-before-append-exact-preimage-preserved",
      current,
      recordCommitted: false,
      promotionEligible: false,
      authority: structuredClone(AUTHORITY_FALSE),
      acceptance: structuredClone(AUTHORITY_FALSE),
      strictAcceptanceEffect: "none",
    }, "journalFingerprintSha256");
  } else if (
    current.bytes === intent.expectedPostimage.bytes &&
    current.sha256 === intent.expectedPostimage.sha256
  ) {
    suffix = "commit";
    terminal = fingerprinted({
      schemaVersion: 1,
      artifactType: "ts006-recorder-append-commit",
      transactionId: intent.transactionId,
      intentSha256,
      sessionId: intent.sessionId,
      logKind: intent.logKind,
      sequence: intent.sequence,
      recordSha256: intent.recordSha256,
      postimage: {
        ...current,
        dev: String(log.metadata.dev),
        ino: String(log.metadata.ino),
        nlink: log.metadata.nlink,
      },
      recoveredAfterCrash: true,
      promotionEligible: false,
      authority: structuredClone(AUTHORITY_FALSE),
      acceptance: structuredClone(AUTHORITY_FALSE),
      strictAcceptanceEffect: "none",
    }, "journalFingerprintSha256");
  } else {
    throw new Error(
      "TS006 hash-chain recorder: outstanding append has a partial, truncated, or divergent postimage; recovery fails closed without truncating or replacing bytes",
    );
  }
  await writeExclusiveSynced(
    path.join(
      layout.transactionsRoot,
      `${intent.transactionId}.${suffix}.json`,
    ),
    layout.transactionsRoot,
    canonicalLine(terminal),
    {mode: 0o400},
  );
  return terminal;
}

export async function recoverTs006NaturalTraceRecorder({
  projectRoot = DEFAULT_PROJECT_ROOT,
  allowedSessionsRoot =
    path.resolve(projectRoot, DEFAULT_SESSIONS_ROOT_RELATIVE),
  sessionRoot,
  captureName,
} = {}) {
  const preliminaryLayout = await resolveLayout({
    sessionRoot,
    captureName,
    allowedSessionsRoot,
  });
  const sessionLock = await acquireSessionLock(preliminaryLayout);
  try {
    const layout = await resolveLayout({
      sessionRoot,
      captureName,
      allowedSessionsRoot,
      requireRecorder: true,
    });
    await loadRecorder(layout);
    const before = await auditTransactions(layout);
    const recovered = [];
    for (const outstanding of before.outstanding) {
      recovered.push(await recoverOneOutstanding(layout, outstanding));
    }
    const after = await auditTransactions(layout);
    invariant(after.outstanding.length === 0, "recovery left an outstanding transaction");
    return {
      recorderRoot: layout.recorderRoot,
      recovered,
      completedTransactionCount: after.completed.length,
      promotionEligible: false,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await sessionLock.release();
  }
}

async function verifyEvidenceHash(layout, sessionRelative, expectedSha256, label) {
  const artifact = await readSessionEvidence(layout, sessionRelative, label);
  invariant(sha256(artifact.bytes) === expectedSha256, `${label} SHA-256 mismatch`);
}

async function verifyCaptureMembership(layout, chains) {
  const manifestArtifact = await readRegularSingleLink(
    path.join(layout.captureRoot, "capture-manifest.json"),
    layout.captureRoot,
    "capture manifest",
    {allowEmpty: false},
  );
  let manifest;
  try {
    manifest = JSON.parse(manifestArtifact.bytes);
  } catch (error) {
    throw new Error(`TS006 hash-chain recorder: capture manifest is invalid JSON: ${error.message}`);
  }
  invariant(Array.isArray(manifest.frames) && manifest.frames.length > 0, "capture manifest has no frames");
  const frameMap = new Map();
  for (const frame of manifest.frames) {
    const file = normalizeRelativeFile(frame.file, "capture manifest frame");
    invariant(!frameMap.has(file), `duplicate capture frame: ${file}`);
    assertSha256(frame.sha256, `capture frame ${file} SHA-256`);
    frameMap.set(file, frame);
  }
  const screenshotRecords = [
    ...chains.state.map((record) => ({
      file: record.screenshotFile,
      sha256: record.screenshotSha256,
      label: `state screenshot ${record.sequence}`,
    })),
    ...chains["host-entry"]
      .filter((record) => record.screenshotFile)
      .map((record) => ({
        file: record.screenshotFile,
        sha256: record.screenshotSha256,
        label: `host-entry screenshot ${record.sequence}`,
      })),
  ];
  for (const screenshot of screenshotRecords) {
    const frame = frameMap.get(screenshot.file);
    invariant(frame, `${screenshot.label} is absent from the capture manifest`);
    invariant(
      frame.sha256 === screenshot.sha256,
      `${screenshot.label} hash differs from the capture manifest`,
    );
    const actual = await readCaptureScreenshot(
      layout,
      screenshot.file,
      screenshot.label,
    );
    invariant(actual.sha256 === screenshot.sha256, `${screenshot.label} bytes drifted`);
  }
  return {
    path: "capture-manifest.json",
    bytes: manifestArtifact.bytes.length,
    sha256: sha256(manifestArtifact.bytes),
    frameCount: manifest.frames.length,
    screenshotRecordCount: screenshotRecords.length,
    everyScreenshotIsCaptureMember: true,
  };
}

async function verifyReferencedEvidence(layout, chains) {
  for (const record of chains["source-target"]) {
    await verifyEvidenceHash(
      layout,
      record.resolutionEvidenceFile,
      record.resolutionEvidenceSha256,
      `source-target ${record.sequence} evidence`,
    );
  }
  for (const record of chains["host-entry"]) {
    await verifyEvidenceHash(
      layout,
      record.evidenceLocator,
      record.evidenceSha256,
      `host-entry ${record.sequence} evidence`,
    );
  }
  for (const record of chains.operation) {
    const audio = record.audioObservation;
    if (!audio?.losslessSessionAudioFile) continue;
    const normalized = normalizeRelativeFile(
      audio.losslessSessionAudioFile,
      `operation ${record.sequence} lossless audio`,
    );
    const artifact = await readRegularSingleLink(
      path.resolve(layout.captureRoot, ...normalized.split("/")),
      layout.captureRoot,
      `operation ${record.sequence} lossless audio`,
      {allowEmpty: false},
    );
    invariant(
      sha256(artifact.bytes) === audio.losslessSessionAudioSha256,
      `operation ${record.sequence} lossless audio SHA-256 mismatch`,
    );
  }
}

async function verifyScreenshotBytes(layout, chains) {
  const screenshots = [
    ...chains.state.map((record) => ({
      file: record.screenshotFile,
      sha256: record.screenshotSha256,
      label: `state screenshot ${record.sequence}`,
    })),
    ...chains["host-entry"]
      .filter((record) => record.screenshotFile)
      .map((record) => ({
        file: record.screenshotFile,
        sha256: record.screenshotSha256,
        label: `host-entry screenshot ${record.sequence}`,
      })),
  ];
  for (const screenshot of screenshots) {
    const actual = await readCaptureScreenshot(
      layout,
      screenshot.file,
      screenshot.label,
    );
    invariant(actual.sha256 === screenshot.sha256, `${screenshot.label} bytes drifted`);
  }
  return screenshots.length;
}

function recordedHostPathMatchesContract(recordedPath, contractPath, projectRoot) {
  if (recordedPath === contractPath) {
    return true;
  }
  if (
    typeof recordedPath !== "string" ||
    typeof contractPath !== "string" ||
    typeof projectRoot !== "string" ||
    !path.isAbsolute(projectRoot) ||
    !path.isAbsolute(recordedPath)
  ) {
    return false;
  }
  return recordedPath === path.resolve(projectRoot, contractPath);
}

function validateAutomationHostEntryComplete(records, contract, projectRoot) {
  invariant(
    records.length === EXPECTED_HOST_ENTRY_EVENTS.length,
    "automation host-entry chain is incomplete",
  );
  const byEvent = new Map(records.map((record) => [record.hostEntryEvent, record]));
  const empty = byEvent.get("profile-empty-preflight");
  invariant(
    empty.emptyProfileVerified === true &&
      empty.sharedObjectFileCount === 0 &&
      empty.rawEvidenceFileCount === 0 &&
      empty.livePreflightReceiptSha256 === empty.evidenceSha256,
    "automation host-entry preflight evidence is incomplete",
  );
  const started = byEvent.get("projector-process-started-empty");
  invariant(
    started.freshProcess === true &&
      started.processExecutableSha256 === contract.projectorExecutableSha256 &&
      Number.isInteger(started.processId) &&
      started.processId > 0,
    "automation host-entry Projector start evidence is incomplete",
  );
  const opened = byEvent.get("named-human-file-open-selected-staged-host");
  invariant(
    opened.humanFileOpenObserved === false &&
      opened.automationFileOpenObserved === true &&
      recordedHostPathMatchesContract(
        opened.openedFilePath,
        contract.hostEntryContract.selectedHostShellPath,
        projectRoot,
      ) &&
      opened.openedFileSha256 === contract.hostEntryContract.selectedHostShellSha256 &&
      opened.directChildSwfOpened === false,
    "automation file-open record is missing or falsely claims a named human",
  );
  invariant(
    byEvent.get("same-lesson-host-loaded").sameLessonHostLoaded === true,
    "same-lesson host load is missing",
  );
  const navigated = byEvent.get("same-lesson-natural-navigation-target-resolved");
  invariant(
    navigated.naturalNavigation === true &&
      navigated.targetAnimationId === ANIMATION_ID &&
      navigated.directSeekUsed === false,
    "same-lesson natural navigation evidence is incomplete",
  );
  const root = byEvent.get("ts006-root-entry-observed");
  invariant(
    root.frameDomainId === "root" &&
      root.observedRootFrame === 1 &&
      HASH_PATTERN.test(root.screenshotSha256 || ""),
    "root-entry observation is incomplete",
  );
  const nested = byEvent.get("ts006-nested-entry-observed");
  invariant(
    nested.frameDomainId === "sprite-23" &&
      nested.observedRootFrame === 6 &&
      nested.observedLocalFrame === 1 &&
      HASH_PATTERN.test(nested.screenshotSha256 || ""),
    "nested-entry observation is incomplete",
  );
  const post = byEvent.get("post-session-side-effect-summary");
  invariant(
    post.processExited === true &&
      post.outboundNetworkSucceededCount === 0 &&
      post.persistentSideEffectCount === 0 &&
      post.sharedObjectFileCount === 0 &&
      post.requestAuditSha256 === post.evidenceSha256,
    "post-session side-effect evidence is incomplete",
  );
  return {
    schemaVersion: 1,
    artifactType: "ts006-automation-natural-trace-log-bundle-structural-validation",
    status:
      "complete-automation-log-shape-not-named-human-not-authoritative-not-promoted",
    namedHumanFileOpenObserved: false,
    automationFileOpenObserved: true,
    namedHumanSessionAttestationEstablished: false,
    authoritativeEvidenceEstablished: false,
    promotionEligible: false,
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
}

export async function verifyTs006NaturalTraceRecorder({
  projectRoot = DEFAULT_PROJECT_ROOT,
  allowedSessionsRoot =
    path.resolve(projectRoot, DEFAULT_SESSIONS_ROOT_RELATIVE),
  sessionRoot,
  captureName,
  complete = false,
  requireCurrentBridge = false,
  requireBoundBridge = false,
} = {}) {
  const layout = await resolveLayout({
    sessionRoot,
    captureName,
    allowedSessionsRoot,
    requireRecorder: true,
  });
  const recorder = await loadRecorder(layout);
  const {chains, files} = await readChains(layout);
  validatePrefix(chains, recorder.contract, recorder.manifest);
  const transactions = await auditTransactions(layout);
  invariant(
    transactions.outstanding.length === 0,
    "recorder has an unresolved append transaction",
  );
  verifyTransactionRecordCoverage(transactions, chains);
  await verifyReferencedEvidence(layout, chains);
  const verifiedScreenshotFileCount = await verifyScreenshotBytes(layout, chains);

  let currentBridgeMatches = null;
  if (requireCurrentBridge) {
    const bridge = await buildTs006NaturalTraceBridge({repositoryRoot: projectRoot});
    const currentContract = bridge.sessions.find(
      (item) => item.language === recorder.contract.language,
    );
    currentBridgeMatches =
      bridge.bridgeManifestSha256 ===
        recorder.manifest.bridgeBinding.bridgeManifestSha256 &&
      canonicalJson(currentContract) === canonicalJson(recorder.contract);
    invariant(currentBridgeMatches, "recorder is not bound to the exact current bridge");
  }

  let boundBridgeMatches = null;
  if (requireBoundBridge) {
    const bridgeRoot = path.resolve(
      projectRoot,
      DEFAULT_BRIDGES_ROOT_RELATIVE,
      recorder.manifest.bridgeBinding.bridgeManifestSha256,
    );
    const loaded = await loadPrebuiltTs006NaturalTraceBridge({
      projectRoot,
      bridgeRoot,
      sessionRoot: layout.sessionRoot,
    });
    boundBridgeMatches =
      loaded.bridgeManifest.bridgeManifestSha256 ===
        recorder.manifest.bridgeBinding.bridgeManifestSha256 &&
      canonicalJson(loaded.sessionContract) === canonicalJson(recorder.contract);
    invariant(
      boundBridgeMatches,
      "recorder is not bound to its exact content-addressed prebuilt bridge",
    );
  }

  let bundle = null;
  let captureManifest = null;
  if (complete) {
    for (const kind of ["operation", "state", "source-target"]) {
      validateTs006BridgeHashChain(chains[kind], {
        kind,
        sessionContract: recorder.contract,
      });
    }
    bundle = validateAutomationHostEntryComplete(
      chains["host-entry"],
      recorder.contract,
      projectRoot,
    );
    bundle.chainHeads = Object.fromEntries(
      LOG_KINDS.map((kind) => [
        kind,
        chains[kind].at(-1)?.[LOG_DEFINITIONS[kind].ownHashField] ?? null,
      ]),
    );
    bundle.bundleDigestSha256 = sha256Canonical(bundle.chainHeads);
    captureManifest = await verifyCaptureMembership(layout, chains);
  }
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-recorder-machine-validation",
    status: complete
      ? "complete-log-shape-and-machine-integrity-valid-not-authoritative"
      : "partial-prefix-machine-integrity-valid-not-authoritative",
    animationId: ANIMATION_ID,
    sessionId: recorder.contract.sessionId,
    language: recorder.contract.language,
    captureBinding: recorder.manifest.captureBinding,
    recorderManifest: {
      path: portable(path.relative(layout.sessionRoot, recorder.manifestFile.path)),
      bytes: recorder.manifestFile.bytes.length,
      sha256: sha256(recorder.manifestFile.bytes),
    },
    sessionContract: recorder.manifest.sessionContract,
    logs: Object.fromEntries(
      LOG_KINDS.map((kind) => [
        kind,
        {
          path: `${kind}.jsonl`,
          records: chains[kind].length,
          bytes: files[kind].bytes.length,
          sha256: sha256(files[kind].bytes),
          chainHeadSha256:
            chains[kind].at(-1)?.[LOG_DEFINITIONS[kind].ownHashField] ?? null,
        },
      ]),
    ),
    transactionJournal: {
      completed: transactions.completed.length,
      outstanding: 0,
      partialOrDivergentAppendObserved: false,
    },
    verifiedScreenshotFileCount,
    currentBridgeRequired: requireCurrentBridge,
    currentBridgeMatches,
    boundBridgeRequired: requireBoundBridge,
    boundBridgeMatches,
    completeBundleValidation: bundle,
    bridgeNamedHumanBundleValidationPerformed: false,
    captureManifest,
    operator: recorder.manifest.operator,
    roleSeparation: {
      automationEventProvenanceRecorded: true,
      runtimeOperatorRecorded: false,
      namedHumanSessionAttestationEstablished: false,
      independentVisualReviewerRecorded: false,
      ownerRecorded: false,
      releaseCustodianRecorded: false,
      samePersonRoleCombinationCannotBeMadeIndependentByThisRecorder: true,
    },
    machineIntegrityEstablished: true,
    authoritativeOriginalRuntimeTraceEstablished: false,
    signatureTrustEstablished: false,
    promotionEligible: false,
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const args = [...argv];
  const command = args.shift();
  const options = {
    command,
    projectRoot: DEFAULT_PROJECT_ROOT,
    allowedSessionsRoot: null,
    sessionRoot: null,
    bridgeRoot: null,
    captureName: null,
    operatorSubjectId: null,
    operatorName: null,
    operatorRole: "machine-event-recorder",
    operatorSubjectType: "automation",
    kind: null,
    occurredAt: null,
    monotonicTimeMs: null,
    input: null,
    payloadJson: null,
    complete: false,
    requireCurrentBridge: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const take = () => {
      invariant(index + 1 < args.length, `${argument} requires a value`);
      index += 1;
      return args[index];
    };
    if (argument === "--project-root") options.projectRoot = take();
    else if (argument === "--allowed-sessions-root") options.allowedSessionsRoot = take();
    else if (argument === "--session-root") options.sessionRoot = take();
    else if (argument === "--bridge-root") options.bridgeRoot = take();
    else if (argument === "--capture") options.captureName = take();
    else if (argument === "--operator-subject-id") options.operatorSubjectId = take();
    else if (argument === "--operator-name") options.operatorName = take();
    else if (argument === "--operator-role") options.operatorRole = take();
    else if (argument === "--operator-subject-type") options.operatorSubjectType = take();
    else if (argument === "--kind") options.kind = take();
    else if (argument === "--occurred-at") options.occurredAt = take();
    else if (argument === "--monotonic-ms") options.monotonicTimeMs = Number(take());
    else if (argument === "--input") options.input = take();
    else if (argument === "--payload-json") options.payloadJson = take();
    else if (argument === "--complete") options.complete = true;
    else if (argument === "--require-current-bridge") options.requireCurrentBridge = true;
    else if (argument === "--require-bound-bridge") options.requireBoundBridge = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else invariant(false, `unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/record-g4-l3-ts006-natural-trace.mjs init \\
    --session-root <artifacts/full-frame/g4-l3/ts006-(en|es)-UUID> \\
    [--bridge-root <work/g4-l3-ts006-natural-trace-bridges/<manifest-sha256>>] \\
    --capture <direct-child-capture-name> \\
    --operator-subject-id <external-subject-id> --operator-name <display-name>

  node scripts/record-g4-l3-ts006-natural-trace.mjs append \\
    --session-root <session-root> --capture <capture-name> \\
    --kind <operation|state|source-target|host-entry> \\
    --occurred-at <ISO-8601> --monotonic-ms <capture-relative-ms> \\
    (--input <direct-child-session/operator-inputs/file.json|-> | --payload-json <JSON>)

  node scripts/record-g4-l3-ts006-natural-trace.mjs verify \\
    --session-root <session-root> --capture <capture-name> \\
    [--complete] [--require-current-bridge] [--require-bound-bridge]

  node scripts/record-g4-l3-ts006-natural-trace.mjs recover \\
    --session-root <session-root> --capture <capture-name>

The recorder is acceptance-neutral. It records only automation event provenance,
never supplies named-human attestation, never signs evidence, and never creates original-runtime authority, human or
owner acceptance, strict completion, or publication authority.
Initialization reserves
<session-root>/${CANONICAL_RAW_CAPTURES_RELATIVE}/<capture-name> before
ScreenCaptureKit creates that no-replace output directory. Append, verify, and
recovery require the selected capture to be a real, non-symlink directory at
that exact path. The legacy <session-root>/<capture-name> layout is rejected.
When --bridge-root is supplied during init, it must be the content-addressed,
byte-exact, non-symlink direct child of
<project-root>/${DEFAULT_BRIDGES_ROOT_RELATIVE}; its language contract must bind
the exact selected session. This permits a bridge verified before launch to be
used after the disposable profile has acquired runtime logs, without rebuilding
the bridge from a no-longer-pristine profile.
For post-session verification, --require-bound-bridge reopens that exact
content-addressed bridge and compares its language contract to the immutable
recorder contract. --require-current-bridge instead rebuilds from live
pre-launch inputs and is expected to fail after the selected profile has been
used.
`;
}

async function readCliPayload(options) {
  invariant(
    Boolean(options.input) !== Boolean(options.payloadJson),
    "append requires exactly one of --input or --payload-json",
  );
  let text;
  if (options.payloadJson) {
    text = options.payloadJson;
  } else if (options.input === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    text = Buffer.concat(chunks).toString("utf8");
  } else {
    const sessionRoot = path.resolve(options.sessionRoot);
    const inputsRoot = path.join(sessionRoot, "operator-inputs");
    const inputPath = path.resolve(options.input);
    await assertRealDirectory(inputsRoot, "operator-inputs root");
    assertDirectChild(inputsRoot, inputPath, "operator input");
    const input = await readRegularSingleLink(
      inputPath,
      inputsRoot,
      "operator input",
      {allowEmpty: false},
    );
    text = input.bytes.toString("utf8");
  }
  invariant(Buffer.byteLength(text) <= MAX_RECORD_BYTES, "operator payload is too large");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`TS006 hash-chain recorder: operator payload is invalid JSON: ${error.message}`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help || !["init", "append", "verify", "recover"].includes(options.command)) {
    process.stdout.write(usage());
    if (!options.help) process.exitCode = 1;
    return;
  }
  invariant(options.sessionRoot, "--session-root is required");
  invariant(options.captureName, "--capture is required");
  const common = {
    projectRoot: path.resolve(options.projectRoot),
    allowedSessionsRoot: options.allowedSessionsRoot
      ? path.resolve(options.allowedSessionsRoot)
      : path.resolve(options.projectRoot, DEFAULT_SESSIONS_ROOT_RELATIVE),
    sessionRoot: options.sessionRoot,
    captureName: options.captureName,
  };
  let result;
  if (options.command === "init") {
    invariant(options.operatorSubjectId, "--operator-subject-id is required");
    invariant(options.operatorName, "--operator-name is required");
    let prebuilt = null;
    if (options.bridgeRoot) {
      prebuilt = await loadPrebuiltTs006NaturalTraceBridge({
        projectRoot: common.projectRoot,
        bridgeRoot: path.resolve(options.bridgeRoot),
        sessionRoot: common.sessionRoot,
      });
    }
    result = await initializeTs006NaturalTraceRecorder({
      ...common,
      operator: {
        externalSubjectId: options.operatorSubjectId,
        displayName: options.operatorName,
        subjectType: options.operatorSubjectType,
        role: options.operatorRole,
        namedHuman: false,
        independentReviewer: false,
        ownerRoleUsed: false,
        releaseCustodianRoleUsed: false,
      },
      sessionContract: prebuilt?.sessionContract ?? null,
      bridgeManifest: prebuilt?.bridgeManifest ?? null,
    });
  } else if (options.command === "append") {
    invariant(!options.bridgeRoot, "--bridge-root is valid only for init");
    result = await appendTs006NaturalTraceRecord({
      ...common,
      kind: options.kind,
      occurredAt: options.occurredAt,
      monotonicTimeMs: options.monotonicTimeMs,
      payload: await readCliPayload(options),
    });
  } else if (options.command === "recover") {
    invariant(!options.bridgeRoot, "--bridge-root is valid only for init");
    result = await recoverTs006NaturalTraceRecorder(common);
  } else {
    invariant(!options.bridgeRoot, "--bridge-root is valid only for init");
    result = await verifyTs006NaturalTraceRecorder({
      ...common,
      complete: options.complete,
      requireCurrentBridge: options.requireCurrentBridge,
      requireBoundBridge: options.requireBoundBridge,
    });
  }
  process.stdout.write(`${canonicalJson(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
