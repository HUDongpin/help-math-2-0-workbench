#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, mkdir, open, readFile, realpath, readdir, rmdir, stat, unlink} from "node:fs/promises";
import {homedir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {canonicalJson, safeRequirementId, sha256Text} from "./build-course-trace-specs.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionSha256,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {assertStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";
import {
  DEFAULT_PROJECTOR_APP,
  inspectProjectorRuntime,
  sha256File,
  verifyProjectorRuntimeBinding,
} from "./scaffold-audio-runtime-session-kit.mjs";
import {
  NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT,
  NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE,
  NATURAL_ENVIRONMENT_ISOLATION_STATEMENT,
  NATURAL_HOST_OPEN_MENU_PATH,
  NATURAL_HOST_OPEN_METHOD,
  NATURAL_LAUNCH_RECEIPT_STATEMENT,
  NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
  NATURAL_TRACE_PROOF_MODE,
  loadOriginalHostEvidence,
} from "./prepare-natural-trace-candidate.mjs";
import {
  assertRootTraceNativeStage,
  assertRootTraceSpecIndex,
  rootTraceSpecFamily,
} from "./lib/root-trace-spec-contract.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RW_ANIMATION_ID = "course-g05-l13-rw-002";
const RW_FRAME_DOMAIN_ID = "sprite-334";
const COMPUTEGHGH_ANIMATION_ID = "keyterm-elementary-computeghgh";
const RW_INDEX_RELATIVE = "migrations/course-shell-pilot-trace-spec-index.json";
const COMPUTEGHGH_SOURCE_RELATIVE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf";
const COMPUTEGHGH_SOURCE_SHA256 = "fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8";
const COMPUTEGHGH_REPLAY_BOUNDARY_SHA256 =
  "e3c74404392222ff5201e9d203b5d0bd05df67e48540f5324cf8b32fbd2784bc";
const TRACE_SPEC_GENERATOR_PATH = "sourceBindings.scheduleDerivation.generator.sha256";
const TRACE_COVERAGE_INCLUDED_PATHS_PATH = "sourceBindings.fullFrameCoverage.includedPaths";
const LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS = Object.freeze([
  "requirementId",
  "scenario",
  "frameDomainId",
  "traceId",
  "language",
  "seed",
  "requiredRange",
  "entryState",
  "entryStateSha256",
  "baselineAuthorityRequirement",
]);
const TRACE_COVERAGE_SCHEMA_V2_ADDED_REQUIREMENT_PATHS = Object.freeze(
  TRACE_COVERAGE_PROJECTION.includedRequirementPaths.filter(
    (item) => !LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS.includes(item),
  ),
);

export const DEFAULT_NATURAL_TRACE_KIT_ROOT = "work/natural-trace-capture-kits";
export const NATURAL_TRACE_STALE_ARCHIVE_ROOT = `${DEFAULT_NATURAL_TRACE_KIT_ROOT}/_stale-unsigned-template-archive`;
export const NATURAL_TRACE_TEMPLATE_STATUS = "unsigned-template-only-not-evidence";
export const NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE = "archive-integrity-v2.json";
export const NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT =
  "sha256-canonical-json-code-unit-file-sorted-full-inventory-with-mode-v2";
export const NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY =
  "sha256-canonical-json-code-unit-file-sorted-inventory-without-mode-v1";
export {NATURAL_TRACE_PROOF_MODE};
export const NATURAL_TRACE_ATTESTATION_STATEMENT = NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT;
export const NATURAL_TRACE_AUTHORITY_NOTE = NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE;

function portable(value) {
  return value.split(path.sep).join("/");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonl(value) {
  return `${JSON.stringify(value)}\n`;
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function sandboxQuote(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizedArchiveInventory(inventory) {
  if (!Array.isArray(inventory) || inventory.length === 0) {
    throw new Error("natural-trace stale archive inventory must be a non-empty array");
  }
  const normalized = inventory.map((item) => {
    if (
      !item || typeof item !== "object" || typeof item.file !== "string" || !item.file ||
      !Number.isSafeInteger(item.bytes) || item.bytes < 0 || !/^[a-f0-9]{64}$/.test(item.sha256 || "") ||
      !Number.isSafeInteger(item.mode) || item.mode < 0 || item.mode > 0o777
    ) throw new Error("natural-trace stale archive inventory entry is invalid");
    return {file: item.file, bytes: item.bytes, sha256: item.sha256, mode: item.mode};
  }).sort((left, right) => compareCodeUnits(left.file, right.file));
  if (new Set(normalized.map(({file}) => file)).size !== normalized.length) {
    throw new Error("natural-trace stale archive inventory contains duplicate files");
  }
  return normalized;
}

export function deriveNaturalTraceArchiveTreeIdentities(inventory) {
  const fullInventory = normalizedArchiveInventory(inventory);
  const legacyModeExcludedInventory = fullInventory.map(({file, bytes, sha256}) => ({file, bytes, sha256}));
  return {
    fullInventory,
    currentFullInventorySha256: digest(Buffer.from(canonicalJson(fullInventory))),
    legacyModeExcludedInventorySha256: digest(Buffer.from(canonicalJson(legacyModeExcludedInventory))),
  };
}

export function buildNaturalTraceArchiveIntegritySidecar({
  archiveRecordBytes,
  inventory,
  directoryTreeAlgorithm,
  directoryTreeSha256,
  animationId,
  requirementId,
}) {
  if (!Buffer.isBuffer(archiveRecordBytes) || archiveRecordBytes.length === 0) {
    throw new Error("natural-trace stale archive integrity sidecar requires archive-record bytes");
  }
  if (!/^[a-f0-9]{64}$/.test(directoryTreeSha256 || "")) {
    throw new Error("natural-trace stale archive directory tree SHA-256 is invalid");
  }
  const identities = deriveNaturalTraceArchiveTreeIdentities(inventory);
  const derivedDirectoryTreeSha256 = directoryTreeAlgorithm === NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT
    ? identities.currentFullInventorySha256
    : directoryTreeAlgorithm === NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY
      ? identities.legacyModeExcludedInventorySha256
      : null;
  if (!derivedDirectoryTreeSha256) throw new Error("natural-trace stale archive tree algorithm is unsupported");
  if (derivedDirectoryTreeSha256 !== directoryTreeSha256) {
    throw new Error("natural-trace stale archive directory identity does not match its declared derivation");
  }
  return {
    schemaVersion: 2,
    evidenceType: "natural-trace-unsigned-template-stale-archive-integrity-sidecar",
    status: "append-only-integrity-binding-not-evidence",
    animationId,
    requirementId,
    archiveRecord: {
      file: "archive-record.json",
      sha256: digest(archiveRecordBytes),
    },
    archivedKit: {
      root: "kit",
      fileCount: identities.fullInventory.length,
      currentFullInventory: {
        algorithm: NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
        sha256: identities.currentFullInventorySha256,
      },
    },
    directoryTreeIdentity: {
      algorithm: directoryTreeAlgorithm,
      sha256: directoryTreeSha256,
      legacyCompatibilityDerivation: directoryTreeAlgorithm === NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY,
    },
    legacyModeExcludedInventory: {
      algorithm: NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY,
      sha256: identities.legacyModeExcludedInventorySha256,
    },
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    statement: "This append-only sidecar binds immutable stale unsigned-template bytes and documents their tree-hash derivation. It is not runtime evidence, human review, owner acceptance, or strict completion.",
  };
}

function naturalScheduleBinding(spec) {
  const hash = (value) => sha256Text(canonicalJson(value));
  return {
    orderedStepsSha256: hash(spec.schedule.orderedSteps),
    stateCheckpointsSha256: hash(spec.schedule.stateCheckpoints),
    playbackSegmentsSha256: hash(spec.schedule.playbackSegments),
    terminalExpectedStateSha256: hash(spec.schedule.terminalSemantics.expectedState),
  };
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

async function existsWithoutFollowing(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function nodeIdentity(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNodeIdentity(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

function permissionMode(info) {
  return info.mode & 0o777;
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function captureDirectoryIdentity(root, directory, label) {
  await assertNoSymlinkComponents(root, directory, label);
  const before = await lstat(directory);
  if (!before.isDirectory() || before.isSymbolicLink()) throw new Error(`${label} must be a real directory`);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const after = await lstat(directory);
  if (!after.isDirectory() || after.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(before), nodeIdentity(after))) {
    throw new Error(`${label} identity changed while it was inspected`);
  }
  if (actualDirectory !== path.resolve(actualRoot, path.relative(root, directory))) {
    throw new Error(`${label} resolves outside its fixed lexical path`);
  }
  return {node: nodeIdentity(after), realPath: actualDirectory, mode: permissionMode(after)};
}

async function assertDirectoryIdentity(root, directory, expected, label) {
  const observed = await captureDirectoryIdentity(root, directory, label);
  if (observed.realPath !== expected.realPath || !sameNodeIdentity(observed.node, expected.node)) {
    throw new Error(`${label} identity changed during the transaction`);
  }
  return observed;
}

async function verifyOwnedFile(root, candidate, ownership, label, {requireSingleLink = true} = {}) {
  await assertNoSymlinkComponents(root, candidate, label);
  const before = await lstat(candidate);
  if (
    !before.isFile() || before.isSymbolicLink() || (requireSingleLink && before.nlink !== 1) ||
    !sameNodeIdentity(nodeIdentity(before), ownership.node) || permissionMode(before) !== ownership.mode
  ) throw new Error(`${label} ownership/inode/mode/link identity changed`);
  const bytes = await readFile(candidate);
  const after = await lstat(candidate);
  if (
    !after.isFile() || after.isSymbolicLink() || (requireSingleLink && after.nlink !== 1) ||
    !sameNodeIdentity(nodeIdentity(after), ownership.node) || after.size !== before.size ||
    permissionMode(after) !== ownership.mode || digest(bytes) !== ownership.sha256
  ) throw new Error(`${label} changed while it was verified`);
}

async function writeOwnedFile({root, parent, parentIdentity, candidate, bytes, mode, label, collection, key}) {
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await assertNoSymlinkComponents(root, candidate, label);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(candidate, flags, mode);
  let ownership;
  try {
    const initial = await handle.stat();
    ownership = {node: nodeIdentity(initial), sha256: digest(bytes), mode};
    collection.set(key, ownership);
    await handle.writeFile(bytes);
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await verifyOwnedFile(root, candidate, ownership, label);
  return ownership;
}

async function removeOwnedFileIfUnchanged(candidate, ownership) {
  try {
    const info = await lstatIfPresent(candidate);
    if (
      !info?.isFile() || info.isSymbolicLink() || info.nlink !== 1 ||
      !sameNodeIdentity(nodeIdentity(info), ownership?.node) || permissionMode(info) !== ownership?.mode ||
      digest(await readFile(candidate)) !== ownership?.sha256
    ) return false;
    await unlink(candidate);
    return true;
  } catch {
    return false;
  }
}

async function removeOwnedEmptyDirectory(directory, ownership) {
  try {
    const info = await lstatIfPresent(directory);
    if (
      !info?.isDirectory() || info.isSymbolicLink() ||
      !sameNodeIdentity(nodeIdentity(info), ownership?.node) || (await readdir(directory)).length !== 0
    ) return false;
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function assertPortableProjectRelative(declared, label) {
  assertString(declared, label);
  if (
    path.isAbsolute(declared) || declared.includes("\\") || declared === ".." || declared.startsWith("../") ||
    portable(path.normalize(declared)) !== declared
  ) throw new Error(`${label} must be a normalized portable project-relative path`);
  return declared;
}

async function resolveProjectFile(root, declared, label) {
  assertPortableProjectRelative(declared, label);
  const candidate = path.resolve(root, declared);
  if (!isInside(candidate, root)) throw new Error(`${label} escapes the project root`);
  const info = await stat(candidate).catch(() => {
    throw new Error(`${label} is missing: ${declared}`);
  });
  if (!info.isFile()) throw new Error(`${label} is not a file: ${declared}`);
  const [actualRoot, actual] = await Promise.all([realpath(root), realpath(candidate)]);
  if (!isInside(actual, actualRoot)) throw new Error(`${label} resolves outside the project root`);
  return candidate;
}

async function readJsonDocument(candidate, label) {
  const bytes = await readFile(candidate);
  try {
    return {value: JSON.parse(bytes.toString("utf8")), bytes, sha256: digest(bytes)};
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function requireProjection(binding, {projection, sha256, includedPaths = [], excludedPaths = []}, label) {
  if (
    binding?.hashMode !== CANONICAL_PROJECTION_ENCODING || binding?.projection !== projection || binding?.sha256 !== sha256 ||
    canonicalJson(binding.includedPaths || []) !== canonicalJson(includedPaths) ||
    canonicalJson(binding.excludedPaths || []) !== canonicalJson(excludedPaths)
  ) throw new Error(`${label} projection binding is stale`);
}

function requirementIdentity(requirement) {
  return {
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: String(requirement.seed),
    requiredRange: requirement.requiredRange,
    baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
  };
}

function specIdentity(spec) {
  return {
    frameDomainId: spec.identity?.frameDomainId,
    traceId: spec.identity?.traceId,
    entryStateSha256: spec.identity?.entryStateSha256,
    scenario: spec.identity?.scenario,
    language: spec.identity?.language,
    seed: String(spec.identity?.seed),
    requiredRange: spec.identity?.requiredRange,
    baselineAuthorityRequirement: spec.identity?.baselineAuthorityRequirement,
  };
}

function validateReadyRwNaturalTraceSpec(spec) {
  const family = rootTraceSpecFamily(spec, "RW natural-trace specification");
  if (
    spec?.schemaVersion !== 1 || spec?.artifactType !== "course-pilot-original-runtime-trace-specification" ||
    spec?.animationId !== RW_ANIMATION_ID ||
    spec?.traceSpecStatus !== "source-schedule-ready-for-authoritative-execution" ||
    spec?.traceModel?.kind !== "stateful-natural-trace" || spec?.traceModel?.naturalPlaybackClaimed !== true ||
    spec?.schedule?.status !== "source-evidenced-executable" ||
    spec?.identity?.baselineAuthorityRequirement !== "original-runtime-natural-trace" ||
    spec?.frameDomain?.id !== RW_FRAME_DOMAIN_ID || spec?.frameDomain?.kind !== "nested" ||
    spec?.identity?.frameDomainId !== spec?.frameDomain?.id
  ) throw new Error("--spec must be one of the exact current ready RW sprite-334 natural-trace specifications");
  if (family.id !== "course-shell") {
    throw new Error("RW natural-trace specification must use the course-shell trace family");
  }
  assertRootTraceNativeStage(spec, family, "RW natural-trace specification");
  if (!new Set(["en", "es"]).has(spec.identity.language)) throw new Error("RW natural-trace language must be en or es");
  const {firstFrame, lastFrame} = spec.identity.requiredRange || {};
  if (firstFrame !== 1 || lastFrame !== spec.frameDomain.frameCount || !Number.isInteger(lastFrame) || lastFrame < 1) {
    throw new Error("RW natural-trace required range must exhaust local frames 1..N");
  }
  const plan = spec.schedule.exhaustiveFrameCapturePlan;
  if (plan?.indexing !== "one-indexed" || plan?.firstFrame !== 1 || plan?.lastFrame !== lastFrame || plan?.frameCount !== lastFrame) {
    throw new Error("RW natural-trace exhaustiveFrameCapturePlan differs from the required range");
  }
  if (
    !Number.isInteger(spec.frameDomain.nativeStage?.width) || spec.frameDomain.nativeStage.width < 1 ||
    !Number.isInteger(spec.frameDomain.nativeStage?.height) || spec.frameDomain.nativeStage.height < 1 ||
    typeof spec.frameDomain.fps !== "number" || !(spec.frameDomain.fps > 0)
  ) throw new Error("RW natural-trace native stage/FPS is invalid");
  const steps = spec.schedule.orderedSteps;
  const checkpoints = spec.schedule.stateCheckpoints;
  if (!Array.isArray(steps) || !steps.length || !Array.isArray(checkpoints) || !checkpoints.length) {
    throw new Error("RW natural-trace must retain its source-evidenced actions and checkpoints");
  }
  const checkpointIds = new Set(checkpoints.map(({id}) => id));
  if (checkpointIds.size !== checkpoints.length) throw new Error("RW natural-trace checkpoint IDs must be unique");
  for (const [index, step] of steps.entries()) {
    if (step.order !== index + 1 || !isPlainObject(step.action) || !isPlainObject(step.sourceTarget)) {
      throw new Error("RW natural-trace ordered steps must be contiguous and source-targeted");
    }
    for (const checkpoint of [step.preStateCheckpoint, step.postStateCheckpoint]) {
      if (!checkpointIds.has(checkpoint?.checkpointId) || !isPlainObject(checkpoint.expectedState)) {
        throw new Error("RW natural-trace step checkpoint bindings are incomplete");
      }
    }
  }
  if (spec.schedule.terminalSemantics?.status !== "source-evidenced" || !isPlainObject(spec.schedule.terminalSemantics.expectedState)) {
    throw new Error("RW natural-trace terminal semantics are not source-evidenced");
  }
}

async function loadBoundRwNaturalTrace({projectRoot, specFile}) {
  const root = path.resolve(projectRoot);
  const specRelative = assertPortableProjectRelative(specFile, "--spec");
  const specPath = await resolveProjectFile(root, specRelative, "--spec");
  const specDocument = await readJsonDocument(specPath, "trace specification");
  const spec = specDocument.value;
  validateReadyRwNaturalTraceSpec(spec);
  const safeId = safeRequirementId(spec.requirementId);
  const expectedSpec = `migrations/${spec.animationId}/audit/trace-specs/${safeId}.json`;
  if (specRelative !== expectedSpec) throw new Error(`--spec must use its canonical indexed path ${expectedSpec}`);

  const workspace = path.join(root, "migrations", spec.animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const indexPath = path.join(root, RW_INDEX_RELATIVE);
  const [manifestDocument, coverageDocument, inventoryDocument, indexDocument] = await Promise.all([
    readJsonDocument(manifestPath, "migration manifest"),
    readJsonDocument(coveragePath, "full-frame coverage"),
    readJsonDocument(inventoryPath, "scenario inventory"),
    readJsonDocument(indexPath, "course/shell trace-spec index"),
  ]);
  const manifest = manifestDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  const family = rootTraceSpecFamily(spec, "RW natural-trace specification");
  assertRootTraceSpecIndex(indexDocument.value, family, "course/shell trace-spec index");
  if (manifest.animationId !== spec.animationId || coverage.animationId !== spec.animationId || inventory.animationId !== spec.animationId) {
    throw new Error("trace specification and current migration documents have different animation identities");
  }
  requireProjection(spec.sourceBindings?.migrationManifest, {
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(manifest),
    excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
  }, "trace specification migration manifest");
  requireProjection(spec.sourceBindings?.fullFrameCoverage, {
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: traceCoverageSha256(coverage),
    includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
  }, "trace specification coverage");
  requireProjection(spec.sourceBindings?.scenarioInventory, {
    projection: SCENARIO_INVENTORY_PROJECTION.id,
    sha256: scenarioInventorySha256(inventory),
    excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
  }, "trace specification scenario inventory");
  const requirements = (coverage.requirements || []).filter(({requirementId}) => requirementId === spec.requirementId);
  if (requirements.length === 1) {
    assertStrictFullDomainRequirement(
      requirements[0],
      spec.frameDomain.frameCount,
      `${spec.animationId}/${spec.requirementId} natural original-runtime kit`,
    );
  }
  if (requirements.length !== 1 || canonicalJson(requirementIdentity(requirements[0])) !== canonicalJson(specIdentity(spec))) {
    throw new Error("trace specification identity differs from the unique current coverage requirement");
  }
  const pilot = (indexDocument.value.pilots || []).find(({animationId}) => animationId === spec.animationId);
  const indexed = (pilot?.traceSpecs || []).filter(({requirementId}) => requirementId === spec.requirementId);
  const expectedExecution = `migrations/${spec.animationId}/${spec.executionEvidence?.expectedExecutionReportPath || ""}`;
  if (
    indexed.length !== 1 || indexed[0].file !== specRelative || indexed[0].sha256 !== specDocument.sha256 ||
    indexed[0].status !== spec.traceSpecStatus || indexed[0].traceModel !== spec.traceModel.kind ||
    indexed[0].expectedExecutionReport !== expectedExecution
  ) throw new Error("trace specification is not the exact current indexed ready natural trace");
  if (
    manifest.source?.swf !== spec.sourceBindings?.sourceSwf?.path ||
    manifest.source?.swfSha256 !== spec.sourceBindings?.sourceSwf?.sha256
  ) throw new Error("trace specification source binding differs from migration.json");
  if (
    manifest.runtime?.stage?.width !== spec.frameDomain.nativeStage.width ||
    manifest.runtime?.stage?.height !== spec.frameDomain.nativeStage.height ||
    manifest.runtime?.fps !== spec.frameDomain.fps
  ) throw new Error("trace specification native runtime differs from migration.json");
  const sourcePath = await resolveProjectFile(root, manifest.source.swf, "bound source SWF");
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const [actualSource, actualPreserved] = await Promise.all([realpath(sourcePath), realpath(preservedRoot)]);
  if (!isInside(actualSource, actualPreserved)) throw new Error("bound source SWF is outside the preserved HELP MATH archive");
  const sourceSha256 = await sha256File(sourcePath);
  if (sourceSha256 !== manifest.source.swfSha256) throw new Error("bound source SWF SHA-256 is stale");
  const originalHostPath = path.join(path.dirname(path.dirname(sourcePath)), "index_local.swf");
  const originalHostRelative = portable(path.relative(root, originalHostPath));
  await resolveProjectFile(root, originalHostRelative, "original lesson host SWF");
  const actualOriginalHost = await realpath(originalHostPath);
  if (!isInside(actualOriginalHost, actualPreserved)) throw new Error("original lesson host SWF is outside the preserved HELP MATH archive");
  const originalHostSha256 = await sha256File(originalHostPath);
  const originalHostSwf = {path: originalHostRelative, sha256: originalHostSha256};
  const originalHostEvidence = await loadOriginalHostEvidence({
    root,
    workspace,
    spec,
    originalHostSwf,
  });
  const minimalTreePath = await resolveProjectFile(root, originalHostEvidence.minimalTree.file, "original-host minimal-tree manifest");
  const minimalTreeDocument = await readJsonDocument(minimalTreePath, "original-host minimal-tree manifest");
  if (minimalTreeDocument.sha256 !== originalHostEvidence.minimalTree.sha256) {
    throw new Error("original-host minimal-tree manifest SHA-256 changed after validation");
  }
  const expectedLayout = minimalTreeDocument.value.expectedRelativeLayoutFromArchiveRoot;
  if (!Array.isArray(expectedLayout) || expectedLayout.length !== minimalTreeDocument.value.requiredFileCount) {
    throw new Error("original-host minimal-tree manifest lacks its complete archive-root layout");
  }
  const runtimeTreeFiles = [];
  const seenArchivePaths = new Set();
  for (const [index, item] of minimalTreeDocument.value.requiredFiles.entries()) {
    const sourceFile = await resolveProjectFile(root, item.path, `original-host runtime-tree source ${index + 1}`);
    const actualSourceFile = await realpath(sourceFile);
    if (!isInside(actualSourceFile, actualPreserved)) {
      throw new Error(`original-host runtime-tree source ${index + 1} is outside the preserved HELP MATH archive`);
    }
    const archiveRelative = portable(path.relative(preservedRoot, sourceFile));
    if (archiveRelative !== expectedLayout[index] || seenArchivePaths.has(archiveRelative)) {
      throw new Error("original-host minimal-tree archive-root layout is stale or duplicated");
    }
    seenArchivePaths.add(archiveRelative);
    const bytes = await readFile(sourceFile);
    if (bytes.length !== item.bytes || digest(bytes) !== item.sha256) {
      throw new Error(`original-host runtime-tree source ${index + 1} changed after audit validation`);
    }
    runtimeTreeFiles.push({
      sourcePath: sourceFile,
      sourceProjectPath: item.path,
      archiveRelative,
      stagedRelative: `runtime-tree/${archiveRelative}`,
      sha256: item.sha256,
      bytes: item.bytes,
      role: item.role,
      content: bytes,
    });
  }
  const runtimeHost = runtimeTreeFiles.find((item) => item.sourceProjectPath === originalHostRelative);
  if (!runtimeHost) throw new Error("original-host staged runtime tree does not contain its launch host");

  return {
    family,
    indexRelative: RW_INDEX_RELATIVE,
    root,
    workspace,
    coverage,
    spec,
    specRelative,
    specSha256: specDocument.sha256,
    safeId,
    sourcePath,
    sourceSha256,
    originalHostPath,
    originalHostSha256,
    originalHostEvidence,
    minimalTree: minimalTreeDocument.value,
    runtimeTreeFiles,
    runtimeHost,
    indexSha256: indexDocument.sha256,
    bindings: {
      traceSpec: {file: specRelative, sha256: specDocument.sha256},
      traceSpecIndex: {file: RW_INDEX_RELATIVE, sha256: indexDocument.sha256},
      sourceSwf: {file: manifest.source.swf, sha256: sourceSha256},
      originalHostSwf: {file: originalHostRelative, sha256: originalHostSha256},
      originalHostEvidence,
      migrationManifest: {
        file: portable(path.relative(root, manifestPath)),
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        sha256: technicalManifestSha256(manifest),
      },
      fullFrameCoverage: {
        file: portable(path.relative(root, coveragePath)),
        projection: TRACE_COVERAGE_PROJECTION.id,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        sha256: traceCoverageSha256(coverage),
      },
      scenarioInventory: {
        file: portable(path.relative(root, inventoryPath)),
        projection: SCENARIO_INVENTORY_PROJECTION.id,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        sha256: scenarioInventorySha256(inventory),
      },
    },
  };
}

function requireCanonicalEqual(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} differs from the locked source-derived contract`);
}

function validateReadyComputeghghNaturalTraceSpec(spec) {
  const family = rootTraceSpecFamily(spec, "computeghgh natural-trace specification");
  if (
    family.id !== "legacy-formula-keyterm" ||
    spec?.schemaVersion !== 1 ||
    spec?.artifactType !== "legacy-pilot-original-runtime-trace-specification" ||
    spec?.animationId !== COMPUTEGHGH_ANIMATION_ID ||
    spec?.traceSpecStatus !== "source-schedule-ready-for-authoritative-execution" ||
    spec?.traceModel?.kind !== "stateful-natural-trace" ||
    spec?.traceModel?.domainScope !== "root" ||
    spec?.traceModel?.interactionMode !== "interactive" ||
    spec?.traceModel?.naturalPlaybackClaimed !== true ||
    spec?.schedule?.status !== "source-evidenced-executable" ||
    spec?.schedule?.noActionsRequired !== false ||
    spec?.identity?.baselineAuthorityRequirement !== "original-runtime-natural-trace" ||
    spec?.frameDomain?.id !== "root" ||
    spec?.frameDomain?.kind !== "root" ||
    spec?.frameDomain?.sourceTimelineId !== "root" ||
    spec?.frameDomain?.sourceInstanceId !== "root" ||
    spec?.frameDomain?.parentFrameDomainId !== null ||
    spec?.frameDomain?.parentEntryFrame !== null ||
    spec?.frameDomain?.localEntryFrame !== 1 ||
    spec?.frameDomain?.frameCount !== 35 ||
    spec?.identity?.frameDomainId !== "root"
  ) {
    throw new Error("--spec must be one of the exact current ready computeghgh root natural-Replay specifications");
  }
  assertRootTraceNativeStage(spec, family, "computeghgh natural-trace specification");
  if (spec.frameDomain.nativeStage.width !== 225 || spec.frameDomain.nativeStage.height !== 225) {
    throw new Error("computeghgh natural-trace specification must retain its exact 225x225 native stage");
  }
  const language = spec.identity.language;
  if (!new Set(["en", "es"]).has(language)) throw new Error("computeghgh natural-trace language must be en or es");
  if (
    spec.identity.scenario !== "default" ||
    spec.identity.scenarioKind !== "interactive" ||
    String(spec.identity.seed) !== "0" ||
    spec.identity.traceId !== `trace:root:default:${language}:seed-0`
  ) throw new Error("computeghgh natural-trace identity is not the locked default interactive language trace");
  const expectedEntryState = {
    kind: "original-root-natural-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario: "default",
    language,
    seed: "0",
  };
  requireCanonicalEqual(spec.entryState, expectedEntryState, "computeghgh entry state");
  if (spec.identity.entryStateSha256 !== sha256Text(canonicalJson(expectedEntryState))) {
    throw new Error("computeghgh entry-state SHA-256 does not bind the exact language-specific root entry");
  }
  requireCanonicalEqual(spec.identity.requiredRange, {firstFrame: 1, lastFrame: 35}, "computeghgh required range");
  requireCanonicalEqual(spec.schedule.exhaustiveFrameCapturePlan, {
    indexing: "one-indexed",
    firstFrame: 1,
    lastFrame: 35,
    frameCount: 35,
    executionPrerequisite:
      "Execute this source-evidenced schedule in the required original runtime before pairing every frame with implementation evidence.",
  }, "computeghgh exhaustive frame-capture plan");
  if (!Array.isArray(spec.schedule.playbackSegments) || spec.schedule.playbackSegments.length !== 2) {
    throw new Error("computeghgh natural-Replay schedule must retain exactly two first-cycle playback segments");
  }
  const [playingSegment, stoppedSegment] = spec.schedule.playbackSegments;
  if (
    playingSegment?.id !== "frames-1-34-natural-first-cycle" ||
    canonicalJson(playingSegment?.requiredRange) !== canonicalJson({firstFrame: 1, lastFrame: 34}) ||
    playingSegment?.expectedState?.rootPlayState !== "playing" ||
    playingSegment?.expectedState?.requiredLanguage !== language ||
    stoppedSegment?.id !== "frame-35-source-stop-awaiting-replay-release" ||
    canonicalJson(stoppedSegment?.requiredRange) !== canonicalJson({firstFrame: 35, lastFrame: 35}) ||
    stoppedSegment?.expectedState?.rootFrame !== 35 ||
    stoppedSegment?.expectedState?.rootPlayState !== "stopped" ||
    stoppedSegment?.expectedState?.localPlayState !== "stopped"
  ) throw new Error("computeghgh first-cycle playback schedule differs from the source-derived frame-35 stop contract");
  const checkpoints = spec.schedule.stateCheckpoints;
  const expectedCheckpointIds = [
    "frame-1-natural-entry-first-cycle",
    "frame-35-before-source-replay-release",
    "frame-1-after-source-replay-release",
  ];
  if (
    !Array.isArray(checkpoints) ||
    checkpoints.length !== expectedCheckpointIds.length ||
    canonicalJson(checkpoints.map(({id}) => id)) !== canonicalJson(expectedCheckpointIds)
  ) throw new Error("computeghgh natural-Replay checkpoints are missing, duplicated, or reordered");
  const step = spec.schedule.orderedSteps?.[0];
  if (!step || spec.schedule.orderedSteps.length !== 1 || step.order !== 1) {
    throw new Error("computeghgh natural-Replay schedule must retain exactly one ordered Replay release");
  }
  requireCanonicalEqual(step.action, {
    event: "release",
    sourceCondition: "pointerReleaseInside",
    dispatchSequence: ["pointer-down-inside", "pointer-up-inside"],
    dispatchPhase: "pointer-up",
    coordinateSpace: "native-stage-pixels",
    pointer: {x: 184.85, y: 200},
    exactPointerDecimals: {x: "184.85", y: "200"},
    hitTest: "inside-source-derived-opaque-hit-shape",
    sourceCommand: "GotoFrame(0); Play",
    executionTiming: "after-capture-and-observation-of-source-stopped-root-frame-35",
  }, "computeghgh Replay action schedule");
  if (
    step.sourceTarget?.timelineId !== "root" ||
    step.sourceTarget?.localFrame !== 35 ||
    step.sourceTarget?.buttonObjectId !== 14 ||
    step.sourceTarget?.selectedHitShapeObjectId !== 6 ||
    step.sourceTarget?.depth !== 28 ||
    canonicalJson(step.sourceTarget?.activeFrameRange) !== canonicalJson({firstFrame: 1, lastFrame: 35}) ||
    step.sourceTarget?.sourceFillInteriorProof?.boundary?.canonicalSegmentsSha256 !==
      COMPUTEGHGH_REPLAY_BOUNDARY_SHA256 ||
    step.sourceTarget?.sourceFillInteriorProof?.proofConclusion !==
      "point-strictly-inside-opaque-source-fill" ||
    step.sourceTarget?.sourceFillInteriorProof?.strictlyInsideCentralRectangle !== true ||
    canonicalJson(step.sourceTarget?.stageHitBounds?.interiorPointNumeric) !==
      canonicalJson({x: 184.85, y: 200})
  ) throw new Error("computeghgh Replay source target or exact hit geometry differs from the locked source proof");
  const before = checkpoints[1];
  const after = checkpoints[2];
  requireCanonicalEqual(step.preStateCheckpoint, {
    checkpointId: before.id,
    expectedState: before.expectedState,
  }, "computeghgh Replay pre-checkpoint binding");
  const {
    requiredLanguage: _afterRequiredLanguage,
    playbackCycle: _afterPlaybackCycle,
    ...postActionExpectedState
  } = after.expectedState;
  requireCanonicalEqual(step.postStateCheckpoint, {
    checkpointId: after.id,
    expectedState: postActionExpectedState,
  }, "computeghgh Replay post-checkpoint binding");
  if (
    checkpoints[0]?.expectedState?.rootFrame !== 1 ||
    checkpoints[0]?.expectedState?.rootPlayState !== "playing" ||
    checkpoints[0]?.expectedState?.requiredLanguage !== language ||
    before?.expectedState?.rootFrame !== 35 ||
    before?.expectedState?.rootPlayState !== "stopped" ||
    after?.expectedState?.rootFrame !== 1 ||
    after?.expectedState?.rootPlayState !== "playing" ||
    after?.expectedState?.requiredLanguage !== language ||
    after?.expectedState?.replayTransition?.fromRootFrame !== 35 ||
    after?.expectedState?.replayTransition?.toRootFrame !== 1 ||
    after?.expectedState?.replayTransition?.sourceCommand !== "GotoFrame(0); Play"
  ) throw new Error("computeghgh natural-Replay checkpoint states differ from the source-derived transition");
  if (
    spec.schedule.terminalSemantics?.status !== "source-evidenced" ||
    spec.schedule.terminalSemantics?.traceEnd !== "post-replay-root-frame-1-playing"
  ) throw new Error("computeghgh natural-Replay terminal semantics are not source-evidenced");
  requireCanonicalEqual(
    spec.schedule.terminalSemantics.expectedState,
    after.expectedState,
    "computeghgh Replay terminal expected state",
  );
  if (
    !Array.isArray(spec.schedule.executedSteps) ||
    spec.schedule.executedSteps.length !== 0 ||
    spec.executionEvidence?.status !== "not-executed-by-this-generator" ||
    spec.executionEvidence?.expectedExecutionReportPath !==
      `baseline/trace-executions/${safeRequirementId(spec.requirementId)}.json`
  ) throw new Error("computeghgh trace spec must remain an unexecuted schedule prerequisite");
  if (
    spec.sourceBindings?.sourceSwf?.path !== COMPUTEGHGH_SOURCE_RELATIVE ||
    spec.sourceBindings?.sourceSwf?.sha256 !== COMPUTEGHGH_SOURCE_SHA256 ||
    spec.sourceBindings?.scheduleDerivation?.generator?.path !== "scripts/build-legacy-trace-specs.mjs" ||
    spec.sourceBindings?.scheduleDerivation?.geometryParser?.path !==
      "scripts/parse-swfmill-root-replay-trace.py" ||
    spec.sourceBindings?.scheduleDerivation?.replayWrapContract?.actionAfterCapturedFrame !== 35 ||
    spec.sourceBindings?.scheduleDerivation?.replayWrapContract?.postActionRootFrame !== 1 ||
    spec.sourceBindings?.scheduleDerivation?.executionEvidenceCreated !== false
  ) throw new Error("computeghgh source/schedule derivation bindings differ from the locked legacy contract");
  return family;
}

async function loadBoundComputeghghNaturalTrace({projectRoot, specFile}) {
  const root = path.resolve(projectRoot);
  const specRelative = assertPortableProjectRelative(specFile, "--spec");
  const specPath = await resolveProjectFile(root, specRelative, "--spec");
  const specDocument = await readJsonDocument(specPath, "trace specification");
  const spec = specDocument.value;
  const family = validateReadyComputeghghNaturalTraceSpec(spec);
  const safeId = safeRequirementId(spec.requirementId);
  const expectedSpec = `migrations/${COMPUTEGHGH_ANIMATION_ID}/audit/trace-specs/${safeId}.json`;
  if (specRelative !== expectedSpec) throw new Error(`--spec must use its canonical indexed path ${expectedSpec}`);

  const workspace = path.join(root, "migrations", spec.animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const indexRelative = family.indexFile;
  const indexPath = path.join(root, indexRelative);
  const [manifestDocument, coverageDocument, inventoryDocument, indexDocument] = await Promise.all([
    readJsonDocument(manifestPath, "migration manifest"),
    readJsonDocument(coveragePath, "full-frame coverage"),
    readJsonDocument(inventoryPath, "scenario inventory"),
    readJsonDocument(indexPath, "legacy trace-spec index"),
  ]);
  assertRootTraceSpecIndex(indexDocument.value, family, "legacy trace-spec index");
  const manifest = manifestDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  if (
    manifest.animationId !== spec.animationId ||
    coverage.animationId !== spec.animationId ||
    inventory.animationId !== spec.animationId
  ) throw new Error("trace specification and current migration documents have different animation identities");
  const projectionRequirements = {
    manifest: {
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      sha256: technicalManifestSha256(manifest),
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
    coverage: {
      projection: TRACE_COVERAGE_PROJECTION.id,
      sha256: traceCoverageSha256(coverage),
      includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
      excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
    },
    inventory: {
      projection: SCENARIO_INVENTORY_PROJECTION.id,
      sha256: scenarioInventorySha256(inventory),
      excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
    },
  };
  requireProjection(spec.sourceBindings?.migrationManifest, projectionRequirements.manifest, "trace specification migration manifest");
  requireProjection(spec.sourceBindings?.fullFrameCoverage, projectionRequirements.coverage, "trace specification coverage");
  requireProjection(spec.sourceBindings?.scenarioInventory, projectionRequirements.inventory, "trace specification scenario inventory");
  const requirements = (coverage.requirements || []).filter(({requirementId}) => requirementId === spec.requirementId);
  if (requirements.length === 1) {
    assertStrictFullDomainRequirement(
      requirements[0],
      spec.frameDomain.frameCount,
      `${spec.animationId}/${spec.requirementId} natural original-runtime kit`,
    );
  }
  if (
    requirements.length !== 1 ||
    canonicalJson(requirementIdentity(requirements[0])) !== canonicalJson(specIdentity(spec))
  ) throw new Error("trace specification identity differs from the unique current coverage requirement");
  const pilots = (indexDocument.value.pilots || []).filter(({animationId}) => animationId === spec.animationId);
  if (pilots.length !== 1) throw new Error("legacy trace-spec index lacks one unique computeghgh pilot");
  const pilot = pilots[0];
  if (pilot.sourceSwfSha256 !== COMPUTEGHGH_SOURCE_SHA256) {
    throw new Error("legacy trace-spec index source SHA-256 differs from computeghgh");
  }
  requireProjection(pilot.technicalBindings?.manifest, projectionRequirements.manifest, "legacy index migration manifest");
  requireProjection(pilot.technicalBindings?.coverage, projectionRequirements.coverage, "legacy index coverage");
  requireProjection(pilot.technicalBindings?.scenarioInventory, projectionRequirements.inventory, "legacy index scenario inventory");
  const indexed = (pilot.traceSpecs || []).filter(({requirementId}) => requirementId === spec.requirementId);
  const expectedExecution =
    `migrations/${spec.animationId}/${spec.executionEvidence.expectedExecutionReportPath}`;
  if (
    indexed.length !== 1 ||
    indexed[0].file !== specRelative ||
    indexed[0].sha256 !== specDocument.sha256 ||
    indexed[0].status !== spec.traceSpecStatus ||
    indexed[0].traceModel !== spec.traceModel.kind ||
    indexed[0].frameDomainId !== "root" ||
    indexed[0].scenario !== "default" ||
    indexed[0].language !== spec.identity.language ||
    String(indexed[0].seed) !== "0" ||
    indexed[0].expectedExecutionReport !== expectedExecution
  ) throw new Error("trace specification is not the exact current indexed ready computeghgh natural trace");
  if (
    manifest.source?.swf !== COMPUTEGHGH_SOURCE_RELATIVE ||
    manifest.source?.swfSha256 !== COMPUTEGHGH_SOURCE_SHA256 ||
    manifest.source?.swf !== spec.sourceBindings.sourceSwf.path ||
    manifest.source?.swfSha256 !== spec.sourceBindings.sourceSwf.sha256
  ) throw new Error("computeghgh source binding differs between the spec and migration manifest");
  if (
    manifest.runtime?.stage?.width !== 225 ||
    manifest.runtime?.stage?.height !== 225 ||
    manifest.runtime?.fps !== 12 ||
    manifest.runtime?.frameCount !== 35 ||
    manifest.implementation?.defaultFrameDomainId !== "root"
  ) throw new Error("computeghgh migration runtime differs from the locked 225x225/12 FPS/35-frame root contract");

  const sourcePath = await resolveProjectFile(root, COMPUTEGHGH_SOURCE_RELATIVE, "bound computeghgh source SWF");
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const [actualSource, actualPreserved] = await Promise.all([realpath(sourcePath), realpath(preservedRoot)]);
  if (!isInside(actualSource, actualPreserved)) throw new Error("bound computeghgh source SWF is outside the preserved HELP MATH archive");
  const sourceBytes = await readFile(sourcePath);
  const sourceSha256 = digest(sourceBytes);
  if (sourceSha256 !== COMPUTEGHGH_SOURCE_SHA256) throw new Error("bound computeghgh source SWF SHA-256 is stale");
  const scheduleGenerator = spec.sourceBindings.scheduleDerivation.generator;
  const geometryParser = spec.sourceBindings.scheduleDerivation.geometryParser;
  for (const [binding, label] of [
    [scheduleGenerator, "computeghgh trace-spec generator"],
    [geometryParser, "computeghgh Replay geometry parser"],
  ]) {
    const candidate = await resolveProjectFile(root, binding.path, label);
    if (await sha256File(candidate) !== binding.sha256) throw new Error(`${label} SHA-256 is stale`);
  }
  const archiveRelative = portable(path.relative(preservedRoot, sourcePath));
  const runtimeTreeFiles = [{
    sourcePath,
    sourceProjectPath: COMPUTEGHGH_SOURCE_RELATIVE,
    archiveRelative,
    stagedRelative: `runtime-tree/${archiveRelative}`,
    sha256: sourceSha256,
    bytes: sourceBytes.length,
    role: "standalone-original-runtime-source-host",
    content: sourceBytes,
  }];
  const runtimeHost = runtimeTreeFiles[0];
  const originalHostSwf = {file: COMPUTEGHGH_SOURCE_RELATIVE, sha256: sourceSha256};
  const originalHostEvidence = {
    mode: "standalone-source-swf-is-original-runtime-host",
    sourceSwf: {path: COMPUTEGHGH_SOURCE_RELATIVE, sha256: sourceSha256, bytes: sourceBytes.length},
    scheduleGenerator,
    geometryParser,
    originalRuntimeExecutedByThisBinding: false,
    baselineAuthorityClaimed: false,
  };
  const minimalTree = {
    schemaVersion: 1,
    artifactType: "standalone-source-runtime-tree-binding",
    sourceArchiveRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
    requiredFileCount: 1,
    requiredTotalBytes: sourceBytes.length,
    expectedRelativeLayoutFromArchiveRoot: [archiveRelative],
    requiredFiles: [{
      path: COMPUTEGHGH_SOURCE_RELATIVE,
      sha256: sourceSha256,
      bytes: sourceBytes.length,
      role: runtimeHost.role,
    }],
    sourceFilesModified: false,
    runtimeExecutedByThisArtifact: false,
  };
  return {
    family,
    indexRelative,
    root,
    workspace,
    coverage,
    spec,
    specRelative,
    specSha256: specDocument.sha256,
    safeId,
    sourcePath,
    sourceSha256,
    originalHostPath: sourcePath,
    originalHostSha256: sourceSha256,
    originalHostEvidence,
    minimalTree,
    runtimeTreeFiles,
    runtimeHost,
    indexSha256: indexDocument.sha256,
    bindings: {
      traceSpec: {file: specRelative, sha256: specDocument.sha256},
      traceSpecIndex: {file: indexRelative, sha256: indexDocument.sha256},
      sourceSwf: {file: COMPUTEGHGH_SOURCE_RELATIVE, sha256: sourceSha256},
      originalHostSwf,
      originalHostEvidence,
      migrationManifest: {
        file: portable(path.relative(root, manifestPath)),
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        sha256: technicalManifestSha256(manifest),
      },
      fullFrameCoverage: {
        file: portable(path.relative(root, coveragePath)),
        projection: TRACE_COVERAGE_PROJECTION.id,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        sha256: traceCoverageSha256(coverage),
      },
      scenarioInventory: {
        file: portable(path.relative(root, inventoryPath)),
        projection: SCENARIO_INVENTORY_PROJECTION.id,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        sha256: scenarioInventorySha256(inventory),
      },
    },
  };
}

async function loadBoundNaturalTrace({projectRoot, specFile}) {
  const root = path.resolve(projectRoot);
  const specRelative = assertPortableProjectRelative(specFile, "--spec");
  const specPath = await resolveProjectFile(root, specRelative, "--spec");
  const {value: spec} = await readJsonDocument(specPath, "trace specification");
  const family = rootTraceSpecFamily(spec, "natural-trace specification");
  if (family.id === "course-shell") {
    return loadBoundRwNaturalTrace({projectRoot: root, specFile: specRelative});
  }
  if (family.id === "legacy-formula-keyterm" && spec.animationId === COMPUTEGHGH_ANIMATION_ID) {
    return loadBoundComputeghghNaturalTrace({projectRoot: root, specFile: specRelative});
  }
  throw new Error("--spec is not an approved indexed natural-trace capture family member");
}

function runtimeIdentityText(runtime) {
  return [
    `runtime_id=${runtime.runtimeId}`,
    `runtime_name=${runtime.name}`,
    `runtime_version=${runtime.version}`,
    `requested_application_path=${runtime.requestedAppPath}`,
    `resolved_application_path=${runtime.appPath}`,
    `resolved_executable_path=${runtime.executablePath}`,
    `executable_sha256=${runtime.executableSha256}`,
    "",
  ].join("\n");
}

function recordSchemaTemplate({recordKind, expectedCount, bindings, requiredFields, invariants}) {
  return {
    schemaVersion: 1,
    artifactType: "unsigned-jsonl-record-schema-template",
    templateStatus: NATURAL_TRACE_TEMPLATE_STATUS,
    notEvidence: true,
    recordKind,
    expectedCompletedRecordCount: expectedCount,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    bindings,
    requiredFields,
    invariants,
    statement: "This single JSONL line describes a future record schema. It is not an observed runtime record and must be replaced, not appended to evidence.",
  };
}

function isStandaloneLegacyNaturalTrace(bound) {
  return bound.family?.id === "legacy-formula-keyterm";
}

function stagedRuntimeTreeManifest(bound) {
  if (isStandaloneLegacyNaturalTrace(bound)) {
    return {
      schemaVersion: 1,
      artifactType: "unsigned-hash-bound-standalone-source-runtime-tree",
      templateStatus: NATURAL_TRACE_TEMPLATE_STATUS,
      notEvidence: true,
      animationId: bound.spec.animationId,
      requirementId: bound.spec.requirementId,
      sourceManifest: bound.minimalTree,
      sourceArchiveRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
      stagedRoot: "runtime-tree",
      fileCount: bound.runtimeTreeFiles.length,
      totalBytes: bound.runtimeTreeFiles.reduce((total, item) => total + item.bytes, 0),
      files: bound.runtimeTreeFiles.map((item) => ({
        sourcePath: item.sourceProjectPath,
        archiveRelativePath: item.archiveRelative,
        stagedFile: item.stagedRelative,
        sha256: item.sha256,
        bytes: item.bytes,
        role: item.role,
      })),
      launchHost: {
        sourcePath: bound.runtimeHost.sourceProjectPath,
        stagedFile: bound.runtimeHost.stagedRelative,
        sha256: bound.runtimeHost.sha256,
        bytes: bound.runtimeHost.bytes,
      },
      isolation: {
        sourceAssetsLaunchedDirectly: false,
        onlyHashBoundStandaloneSourcePresent: true,
        relativeLayoutPreservedFromArchiveRoot: true,
        sourceFilesCopiedByteForByte: true,
        sourceFilesModified: false,
        limitation: "The staged tree isolates the exact standalone source SWF by absence of other HELP Math content. The sandbox still permits operating-system/runtime reads; same-session logs must reject every unexpected legacy load or side effect.",
      },
    };
  }
  return {
    schemaVersion: 1,
    artifactType: "unsigned-hash-bound-original-host-runtime-tree",
    templateStatus: NATURAL_TRACE_TEMPLATE_STATUS,
    notEvidence: true,
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    sourceManifest: bound.originalHostEvidence.minimalTree,
    sourceArchiveRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
    stagedRoot: "runtime-tree",
    fileCount: bound.runtimeTreeFiles.length,
    totalBytes: bound.runtimeTreeFiles.reduce((total, item) => total + item.bytes, 0),
    files: bound.runtimeTreeFiles.map((item) => ({
      sourcePath: item.sourceProjectPath,
      archiveRelativePath: item.archiveRelative,
      stagedFile: item.stagedRelative,
      sha256: item.sha256,
      bytes: item.bytes,
      role: item.role,
    })),
    launchHost: {
      sourcePath: bound.runtimeHost.sourceProjectPath,
      stagedFile: bound.runtimeHost.stagedRelative,
      sha256: bound.runtimeHost.sha256,
      bytes: bound.runtimeHost.bytes,
    },
    isolation: {
      sourceAssetsLaunchedDirectly: false,
      onlyManifestedCourseContentPresent: true,
      relativeLayoutPreservedFromArchiveRoot: true,
      sourceFilesCopiedByteForByte: true,
      sourceFilesModified: false,
      limitation: "The staged tree isolates HELP Math content by absence. The sandbox still permits operating-system/runtime reads; same-session logs must reject every unexpected legacy load or side effect.",
    },
  };
}

function operatorCard({bound}) {
  const {spec} = bound;
  const {width, height} = spec.frameDomain.nativeStage;
  const steps = spec.schedule.orderedSteps.map((step) => [
    `### Step ${step.order}`,
    "",
    `- Pre-checkpoint: \`${step.preStateCheckpoint.checkpointId}\``,
    `- Exact action: \`${JSON.stringify(step.action)}\``,
    `- Exact source target: \`${JSON.stringify(step.sourceTarget)}\``,
    `- Post-checkpoint: \`${step.postStateCheckpoint.checkpointId}\``,
  ].join("\n")).join("\n\n");
  const checkpoints = spec.schedule.stateCheckpoints.map(({id, expectedState}) => `- \`${id}\`: \`${JSON.stringify(expectedState)}\``).join("\n");
  if (isStandaloneLegacyNaturalTrace(bound)) {
    return `# computeghgh root natural-Replay operator card

Status: **unsigned safety-probe preparation only — not authoritative evidence**

## Bound identity

- Animation: \`${spec.animationId}\`
- Requirement: \`${spec.requirementId}\`
- Language identity: \`${spec.identity.language}\`
- Trace spec SHA-256: \`${bound.specSha256}\`
- Legacy trace-spec index: \`${bound.bindings.traceSpecIndex.file}\`
- Legacy trace-spec index SHA-256: \`${bound.indexSha256}\`
- Standalone source/host: \`${bound.bindings.sourceSwf.file}\`
- Standalone source/host SHA-256: \`${bound.sourceSha256}\`
- Frame domain: \`root\`, first-cycle frames 1–${spec.frameDomain.frameCount}
- Native capture: ${width}×${height} at ${spec.frameDomain.fps} FPS

## Fail-closed session procedure

The launcher generated in the current user account deliberately denies that account's existing Flash preferences and SharedObjects. That makes it a safety probe only: an access denial is not a normal empty Flash profile, so output from this launcher is ineligible for authoritative promotion. Authoritative capture requires a separately attested disposable macOS VM snapshot or one-time OS login account with a real independent home and normal, initially empty Flash profile semantics.

1. Run the checked launcher. It verifies the exact legacy-family index, trace spec, source SWF, 225×225 stage contract, Projector executable, and empty template before starting an empty Adobe Projector process with **no SWF argument**.
2. In Projector, the named operator must choose **File → Open File…** and select exactly \`${bound.runtimeHost.stagedRelative}\` beneath this kit's \`runtime-tree/\`. Do not use a command-line SWF argument, \`open\`/LaunchServices, or the preserved \`source-assets/\` path. Record the actual Projector PID/start time, GUI-open time, selected staged path/SHA-256, and observed Player content window in the v2 launch receipt.
3. Establish natural root entry at one-indexed frame 1. The standalone source does not consume a language flag; \`${spec.identity.language}\` is the separate product-context identity bound by this requirement, not a claim that the SWF changed language.
4. Capture exactly one lossless 225×225 PNG and one complete state record for every naturally reached first-cycle root frame 1–35. Do not direct-seek, Step Forward, or substitute Ruffle/the JavaScript rewrite.
5. At the observed source-stopped root frame 35, dispatch only the exact source-derived pointer-down-inside then pointer-up-inside sequence at native point (184.85, 200), resolving button 14 / hit shape 6 / depth 28. Record the source-target resolution and the post-action root-frame-1 playing state as an additional terminal observation; do not replace it with a guessed Replay click.
6. Verify all three checkpoints and the post-Replay terminal state from the same session. Any missing/extra/reordered frame, action, checkpoint, wrong target, unexpected event, wrong hash, or non-225×225 image invalidates the entire candidate.
7. A named human fills and signs the receipt and attestation only after the session ends. These files remain templates, not evidence, until real same-session observations replace every null/blank/hash-chain field.

${steps}

## Required checkpoints

${checkpoints}

## Terminal state

\`${JSON.stringify(spec.schedule.terminalSemantics.expectedState)}\`

This trace explicitly includes the source-derived Replay release and wrap to root frame 1. Audio, visual RMSE, human visual review, owner acceptance, and migration completion remain separate gates.
`;
  }
  return `# RW natural-trace operator card

Status: **unsigned safety-probe preparation only — not authoritative evidence**

## Bound identity

- Animation: \`${spec.animationId}\`
- Requirement: \`${spec.requirementId}\`
- Language: \`${spec.identity.language}\`
- Trace spec SHA-256: \`${bound.specSha256}\`
- Source SWF SHA-256: \`${bound.sourceSha256}\`
- Original lesson host: \`${bound.bindings.originalHostSwf.file}\`
- Original lesson host SHA-256: \`${bound.originalHostSha256}\`
- Frame domain: \`${spec.frameDomain.id}\`, local frames 1–${spec.frameDomain.frameCount}
- Natural parent entry: root frame ${spec.frameDomain.parentEntryFrame}; local frame ${spec.frameDomain.localEntryFrame}
- Native capture: ${width}×${height} at ${spec.frameDomain.fps} FPS

## Fail-closed session procedure

The launcher generated in the current user account deliberately denies that account's existing Flash preferences and SharedObjects. That makes it a safety probe only: an access denial is not a normal empty Flash profile, so output from this launcher is ineligible for authoritative promotion. Authoritative capture requires a separately attested disposable macOS VM snapshot or one-time OS login account with a real independent home and normal, initially empty Flash profile semantics.

1. Run the checked launcher. It performs the kit check and starts an empty Adobe Projector process with **no SWF argument**. Its terminal message is process-launch guidance only and is not host-open evidence.
2. In Projector, the named operator must choose **File → Open File…** and select exactly \`${bound.runtimeHost.stagedRelative}\` beneath this kit's \`runtime-tree/\`. Do not use a command-line SWF argument, \`open\`/LaunchServices, the preserved \`source-assets/\` path, or a child SWF. Record the actual Projector PID/start time, GUI-open time, selected staged path/SHA-256, and observed Player content window in the v2 launch receipt.
3. Confirm the sandbox denied the user's existing Flash Player preferences/SharedObjects, and observe a clean entry with no incoming bookmark/cookie state. Establish the exact entry state and required language \`${spec.identity.language}\`. If the controller cannot report both root and local playheads or clean-start state, stop; do not infer them visually.
4. Capture exactly one lossless native-size PNG and one complete state record for every naturally reached local frame 1–${spec.frameDomain.frameCount}. Do not direct-seek or Step Forward; those operations cannot prove this natural trace.
5. Dispatch only the ordered source action below, only after its pre-checkpoint is observed, and bind the actual target-resolution record. No guessed coordinate, delay, keyboard event, Replay, network call, or modern implementation behavior may be substituted.
6. Verify every checkpoint and the terminal state from the same session. Any missing/extra/reordered frame, action, checkpoint, unexpected event, wrong language, or stale hash invalidates the entire candidate.
7. A named human fills and signs the receipt and attestation only after the session ends. The templates remain non-evidence until every null/blank/hash-chain field is replaced with real same-session observations.

${steps}

## Required checkpoints

${checkpoints}

## Terminal state

\`${JSON.stringify(spec.schedule.terminalSemantics.expectedState)}\`

Replay and audio are outside this trace specification and remain separate acceptance gates.
`;
}

function readme({bound}) {
  if (isStandaloneLegacyNaturalTrace(bound)) {
    return `# Unsigned computeghgh root natural-Replay capture kit

This directory is a deterministic safety-probe scaffold for \`${bound.spec.requirementId}\`. It binds the exact current legacy-family trace-spec index and SHA-256, the exact indexed natural-Replay spec and SHA-256, the preserved standalone source SWF \`${bound.bindings.sourceSwf.file}\` at SHA-256 \`${bound.sourceSha256}\`, its 225×225 / 12 FPS / 35-frame root contract, the source-derived Replay schedule, and the Adobe Projector executable identity. Its current-account launcher is not an authoritative clean-profile capture environment.

It contains no captured PNG, no runtime event, no human signature, no \`pass\`, and no owner decision. The \`frames/\` directory contains only a read-only README. Generating or checking this kit does not write under \`migrations/\` or \`source-assets/\`, does not execute Projector, and has no strict-acceptance effect.

Use \`OPERATOR_CARD.md\` only during a separately authorized original-runtime session. The files below are schema/templates only:

- \`templates/runtime-toolchain-receipt.template.json\`
- \`templates/environment-isolation-receipt.template.json\`
- \`templates/original-host-launch-receipt.template.json\`
- \`templates/capture-session-attestation.template.json\`
- \`templates/host-entry-log.schema.template.jsonl\`
- \`templates/natural-event-log.schema.template.jsonl\`
- \`templates/frame-state-log.schema.template.jsonl\`
- \`templates/source-target-log.schema.template.jsonl\`
- \`capture-plan.template.json\`

The JSONL files each contain one schema-description line, not a fabricated observation. Replace templates with separately named real evidence files; never rename a template and claim it was captured.

For a non-authoritative safety rehearsal, \`sh launch-original-host-sandboxed.sh\` first performs a byte-for-byte check, changes to the isolated one-file \`runtime-tree/\`, and starts an **empty** Adobe Projector process with no SWF argument. It does not itself open the SWF. A named operator must use **File → Open File…** and choose the exact staged standalone source listed in \`runtime-tree-manifest.json\`. Network, Apple Events, broad writes, launch-service side effects, existing Flash profile reads, and unmanifested HELP Math content are denied. Because that profile denial can alter runtime semantics, the launcher cannot produce a promotable baseline.

Before any authorized disposable-environment session, write the machine-readable check receipt outside this immutable kit with \`node scripts/scaffold-natural-trace-capture-kit.mjs --check --spec <this-spec> > <separate-session-directory>/kit-check.json\`. Standard output is JSON only; the non-evidence warning is sent to standard error. Bind that untouched JSON file in the launch receipt.
`;
  }
  return `# Unsigned RW natural-trace capture kit

This directory is a deterministic safety-probe scaffold for \`${bound.spec.requirementId}\`. It binds the exact current indexed trace spec, preserved SWF, original-host audit reports, five-file source-derived runtime tree, and Adobe Projector executable identity. Its current-account launcher is not an authoritative clean-profile capture environment.

It contains no captured PNG, no runtime event, no human signature, no \`pass\`, and no owner decision. Generating it does not write under \`migrations/\` or \`source-assets/\` and has no strict-acceptance effect.

Use \`OPERATOR_CARD.md\` during the authorized runtime session. The files below are schema/templates only:

- \`templates/runtime-toolchain-receipt.template.json\`
- \`templates/environment-isolation-receipt.template.json\`
- \`templates/original-host-launch-receipt.template.json\`
- \`templates/capture-session-attestation.template.json\`
- \`templates/host-entry-log.schema.template.jsonl\`
- \`templates/natural-event-log.schema.template.jsonl\`
- \`templates/frame-state-log.schema.template.jsonl\`
- \`templates/source-target-log.schema.template.jsonl\`
- \`capture-plan.template.json\`

The JSONL files each contain one schema-description line, not a fabricated observation. Replace templates with separately named real evidence files; never rename a template and claim it was captured.

For a non-authoritative safety rehearsal, run \`sh launch-original-host-sandboxed.sh\`. The launcher first performs a byte-for-byte kit/spec/source/runtime check, changes the working directory to the isolated \`runtime-tree/\`, then starts an **empty** Adobe Projector process with no SWF argument. Its output is process-launch guidance only, not evidence that the host opened. The named operator must then use **File → Open File…** inside Projector to select the exact staged host listed in \`runtime-tree-manifest.json\`. Network, Apple Events, broad writes, launch-service side effects, and reads of the user's existing Flash Player preference/SharedObject stores are denied; unmanifested HELP Math content is absent from the staged tree. Because denying the existing profile can alter \`SharedObject.getLocal\`, this launcher must not produce a promotable baseline. It does not open a SWF, navigate, click, capture, or sign anything.

Before an authorized disposable-environment session, write the machine-readable check receipt outside this immutable kit with \`node scripts/scaffold-natural-trace-capture-kit.mjs --check --spec <this-spec> > <separate-session-directory>/kit-check.json\`. Standard output is JSON only; the non-evidence warning is sent to standard error. Bind that untouched JSON file in the launch receipt.
`;
}

function sandboxProfile() {
  const legacyPreferenceRoot = path.join(homedir(), "Library", "Preferences", "Macromedia", "Flash Player");
  const legacyApplicationSupportRoot = path.join(homedir(), "Library", "Application Support", "Macromedia", "Flash Player");
  return `(version 1)
(allow default)
(deny network*)
(deny appleevent-send)
(deny file-read*
  (require-any
    (subpath ${sandboxQuote(legacyPreferenceRoot)})
    (subpath ${sandboxQuote(legacyApplicationSupportRoot)})))
(deny mach-lookup
  (require-any
    (global-name "com.apple.lsd.open")
    (global-name "com.apple.lsd.modifydb")
    (global-name-regex #"^com\\.apple\\.lsd\\.")))
(deny file-write*
  (require-all
    (require-not (subpath "/private/var/folders"))
    (require-not (subpath "/private/tmp"))
    (require-not (literal "/dev/null"))))
`;
}

function originalHostLauncher({bound, runtime}) {
  const kitRoot = path.join(bound.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, bound.spec.animationId, bound.safeId);
  const contentRoot = path.join(kitRoot, "runtime-tree");
  const stagedHostPath = path.join(kitRoot, bound.runtimeHost.stagedRelative);
  return `#!/bin/sh
set -eu
cd ${shellQuote(bound.root)}
${shellQuote(process.execPath)} ${shellQuote(SCRIPT_PATH)} --check --spec ${shellQuote(bound.specRelative)} --player-app ${shellQuote(runtime.appPath)}
cd ${shellQuote(contentRoot)}
printf '%s\n' 'PROCESS LAUNCH ONLY — NOT HOST-OPEN EVIDENCE.' >&2
printf '%s\n' 'After the empty Projector starts, the named operator must use File -> Open File… and select:' >&2
printf '%s\n' ${shellQuote(stagedHostPath)} >&2
# PROJECTOR_START_MODE=empty-no-swf-argument
# HOST_OPEN_MODE=named-human-gui-file-open
exec /usr/bin/sandbox-exec -f ${shellQuote(path.join(kitRoot, "sandbox.sb"))} ${shellQuote(runtime.executablePath)}
`;
}

export async function buildNaturalTraceCaptureKit({projectRoot = PROJECT_ROOT, specFile, runtime}) {
  const bound = await loadBoundNaturalTrace({projectRoot, specFile});
  return renderNaturalTraceCaptureKit({bound, runtime});
}

export async function renderNaturalTraceCaptureKit({bound, runtime}) {
  const normalizedRuntime = await verifyProjectorRuntimeBinding(runtime);
  const standaloneLegacy = isStandaloneLegacyNaturalTrace(bound);
  const identityText = runtimeIdentityText(normalizedRuntime);
  const identityRelative = "runtime/runtime-executable-sha256.txt";
  const kitProjectRelative = portable(path.join(DEFAULT_NATURAL_TRACE_KIT_ROOT, bound.spec.animationId, bound.safeId));
  const identityProjectRelative = `${kitProjectRelative}/${identityRelative}`;
  const runtimeTreeManifestRelative = "runtime-tree-manifest.json";
  const runtimeTreeManifest = stagedRuntimeTreeManifest(bound);
  const runtimeTreeManifestBytes = Buffer.from(json(runtimeTreeManifest));
  const runtimeTreeManifestBinding = {file: `${kitProjectRelative}/${runtimeTreeManifestRelative}`, sha256: digest(runtimeTreeManifestBytes)};
  const nodeExecutable = {path: process.execPath, sha256: await sha256File(process.execPath)};
  const sandboxContent = sandboxProfile();
  const launcherContent = originalHostLauncher({bound, runtime: normalizedRuntime});
  const receiptRelative = "templates/runtime-toolchain-receipt.template.json";
  const environmentReceiptRelative = "templates/environment-isolation-receipt.template.json";
  const launchReceiptRelative = "templates/original-host-launch-receipt.template.json";
  const attestationRelative = "templates/capture-session-attestation.template.json";
  const logBindings = {
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    traceSpecSha256: bound.specSha256,
    sourceSwfSha256: bound.sourceSha256,
    originalHostSwfSha256: bound.originalHostSha256,
    captureKitManifestSha256: null,
    sandboxProfileSha256: digest(sandboxContent),
    environmentIsolationReceiptSha256: null,
    launchReceiptSha256: null,
  };
  const frameCount = bound.spec.frameDomain.frameCount;
  const stepCount = bound.spec.schedule.orderedSteps.length;
  const checkpointCount = bound.spec.schedule.stateCheckpoints.length;
  const terminalPostActionObservationCount = standaloneLegacy ? 1 : 0;
  const naturalFrameObservationCount = frameCount + terminalPostActionObservationCount;
  const templateFiles = [
    receiptRelative,
    environmentReceiptRelative,
    launchReceiptRelative,
    attestationRelative,
    "templates/host-entry-log.schema.template.jsonl",
    "templates/natural-event-log.schema.template.jsonl",
    "templates/frame-state-log.schema.template.jsonl",
    "templates/source-target-log.schema.template.jsonl",
  ];
  const plan = {
    schemaVersion: 1,
    artifactType: "unsigned-natural-trace-capture-plan-template",
    templateStatus: NATURAL_TRACE_TEMPLATE_STATUS,
    notEvidence: true,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    identity: bound.spec.identity,
    frameDomain: bound.spec.frameDomain,
    playbackSegments: bound.spec.schedule.playbackSegments,
    orderedSteps: bound.spec.schedule.orderedSteps,
    stateCheckpoints: bound.spec.schedule.stateCheckpoints,
    terminalSemantics: bound.spec.schedule.terminalSemantics,
    exhaustiveFrameCapturePlan: bound.spec.schedule.exhaustiveFrameCapturePlan,
    observations: {
      capturedFrameCount: 0,
      dispatchedActionCount: 0,
      observedCheckpointCount: 0,
      terminalObserved: false,
      humanSigned: false,
      ownerAccepted: false,
      ...(standaloneLegacy ? {terminalPostActionObservationRecorded: false} : {}),
    },
  };
  const receipt = {
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime: {runtimeId: normalizedRuntime.runtimeId, name: normalizedRuntime.name, version: normalizedRuntime.version},
    captureSessionBinding: {
      sessionId: "",
      traceSpecSha256: bound.specSha256,
      sourceSwfSha256: bound.sourceSha256,
      originalHostSwfSha256: bound.originalHostSha256,
      captureKitManifestSha256: null,
      sandboxProfileSha256: digest(sandboxContent),
      environmentIsolationReceiptSha256: null,
      launchReceiptSha256: null,
    },
    capturedAt: null,
    identityArtifacts: [{kind: "executable-sha256-receipt", file: identityProjectRelative, sha256: digest(identityText)}],
  };
  const environmentReceipt = {
    schemaVersion: 1,
    evidenceType: "named-human-disposable-flash-runtime-environment-receipt",
    sessionId: "",
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    isolationMode: null,
    operatingSystem: {productVersion: "", buildVersion: "", architecture: ""},
    account: {userName: "", uid: null, homeDirectory: "", realOsAccount: null, dedicatedToCapture: null},
    profile: {
      identifier: "",
      createdForSession: null,
      reused: null,
      normalSharedObjectReadWriteSemantics: null,
      resetOrDestroyedAfterSession: null,
    },
    preflight: {
      runningFlashProcessCount: null,
      sharedObjectFileCount: null,
      cookienameFileCount: null,
      incomingCookieKeyCount: null,
      bookmarkState: null,
      dtfBMID: null,
      inventory: {file: null, sha256: null},
    },
    runtimeObservations: standaloneLegacy
      ? {
          standaloneSourceOpenedThroughGui: null,
          naturalRootFrame1Observed: null,
          firstCycleRootFrame35StopObserved: null,
          replayReleaseTargetResolved: null,
          postReplayRootFrame1PlayingObserved: null,
        }
      : {
          sharedObjectGetLocalReturnedObject: null,
          bookmarkBranchTaken: null,
          defaultStartupIrObserved: null,
          targetRwNavigationObserved: null,
          automaticEnglishKeytermRequested: null,
          automaticEnglishKeytermLoadSucceeded: null,
          automaticEnglishKeytermParseSucceeded: null,
        },
    postflight: {
      unexpectedProfileFileCount: null,
      unexpectedMutations: null,
      profileResetOrDestroyed: null,
      inventory: {file: null, sha256: null},
    },
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    startedAt: null,
    endedAt: null,
    signedAt: null,
    statement: NATURAL_ENVIRONMENT_ISOLATION_STATEMENT,
    receiptSha256: null,
  };
  const attestation = {
    schemaVersion: 1,
    evidenceType: "named-human-natural-trace-capture-session-attestation",
    sessionId: "",
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    traceSpec: bound.bindings.traceSpec,
    sourceSwf: {path: bound.bindings.sourceSwf.file, sha256: bound.bindings.sourceSwf.sha256},
    originalHostSwf: {path: bound.bindings.originalHostSwf.file, sha256: bound.bindings.originalHostSwf.sha256},
    originalHostEvidence: bound.originalHostEvidence,
    runtimeTreeManifest: runtimeTreeManifestBinding,
    captureKit: null,
    environmentIsolation: {file: null, sha256: null},
    launchReceipt: {file: null, sha256: null},
    hostEntryLog: {file: null, sha256: null, finalRecordSha256: null, recordCount: null},
    toolchainReceipt: null,
    operationLog: {file: null, sha256: null, finalEventSha256: null, eventCount: null},
    sourceTargetResolutions: {file: null, sha256: null, finalRecordSha256: null, recordCount: null},
    stateSnapshots: {file: null, sha256: null, finalRecordSha256: null, recordCount: null},
    frameSet: {algorithm: "ordered-frame-path-sha256-v1", frameCount, frames: [], sha256: null},
    scheduleBinding: naturalScheduleBinding(bound.spec),
    startedAt: null,
    endedAt: null,
    signedAt: null,
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    unexpectedEvents: [],
    statement: NATURAL_TRACE_ATTESTATION_STATEMENT,
    notes: NATURAL_TRACE_AUTHORITY_NOTE,
    attestationSha256: null,
  };
  if (standaloneLegacy) {
    attestation.terminalPostActionStateEvidence = {
      expectedState: bound.spec.schedule.terminalSemantics.expectedState,
      observedState: null,
      observedStateSha256: null,
      screenshotFile: null,
      screenshotSha256: null,
      sourceTargetResolutionRecordSha256: null,
      stateSnapshotRecordSha256: null,
    };
  }
  const schemaBindings = {...logBindings, proofMode: NATURAL_TRACE_PROOF_MODE};
  const sessionBoundRecordFields = [
    "captureKitManifestSha256", "sandboxProfileSha256", "environmentIsolationReceiptSha256",
    "launchReceiptSha256", "toolchainReceiptSha256",
  ];
  const schemas = {
    "templates/natural-event-log.schema.template.jsonl": recordSchemaTemplate({
      recordKind: "attested-natural-trace-operation frame/action union",
      expectedCount: {
        minimum: naturalFrameObservationCount + stepCount,
        exactFrameObservations: naturalFrameObservationCount,
        exactActionDispatches: stepCount,
        ...(standaloneLegacy ? {
          exactFirstCycleFrameObservations: frameCount,
          exactTerminalPostActionFrameObservations: terminalPostActionObservationCount,
        } : {}),
      },
      bindings: schemaBindings,
      requiredFields: {
        common: ["schemaVersion", "evidenceType", "eventKind", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", ...sessionBoundRecordFields, "sequence", "occurredAt", "monotonicTimeMs", "operator", "previousEventSha256", "eventSha256"],
        frameObservation: ["frameDomainId", "observedRootFrame", "observedLocalFrame", "screenshotFile", "screenshotSha256", "stateSnapshotRecordSha256"],
        sourceActionDispatch: ["scheduleStepOrder", "action", "sourceTarget", "preCheckpointId", "postCheckpointId", "preStateSnapshotRecordSha256", "postStateSnapshotRecordSha256", "sourceTargetResolutionRecordSha256"],
      },
      invariants: standaloneLegacy
        ? [
            "contiguous sequence and append-only hash chain",
            "first-cycle root frames 1..35 observed once in natural order, followed only by the scheduled Replay release and one post-action root-frame-1 observation",
            "the action is canonical-equal to the scheduled pointerReleaseInside action and strictly between its frame-35 pre-state and frame-1 post-state observations",
            "no direct seek, Step Forward, guessed action, duplicate first-cycle frame, or unexpected event",
          ]
        : ["contiguous sequence and append-only hash chain", "every local frame observed once in natural order", "each action canonical-equal to its scheduled action and strictly between its pre/post observations", "no direct seek, Step Forward, guessed action, or unexpected event"],
    }),
    "templates/frame-state-log.schema.template.jsonl": recordSchemaTemplate({
      recordKind: "attested-natural-trace-state-snapshot",
      expectedCount: naturalFrameObservationCount,
      bindings: schemaBindings,
      requiredFields: ["schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", ...sessionBoundRecordFields, "sequence", "occurredAt", "monotonicTimeMs", "operator", "frameDomainId", "observedRootFrame", "observedLocalFrame", "observedState", "observedStateSha256", "screenshotFile", "screenshotSha256", "previousRecordSha256", "recordSha256"],
      invariants: standaloneLegacy
        ? [
            "exact first-cycle root frames 1..35 without gaps, duplicates, or reordering, followed by one post-Replay root-frame-1 terminal observation",
            "root/local playheads and semantic state come from the same observation",
            "one unique native-size 225x225 PNG per first-cycle frame plus one separately named terminal post-action PNG",
          ]
        : ["exact local frames 1..N without gaps, duplicates, or reordering", "root/local playheads and semantic state come from the same observation", "one unique native-size PNG per local frame"],
    }),
    "templates/source-target-log.schema.template.jsonl": recordSchemaTemplate({
      recordKind: "attested-natural-source-target-resolution",
      expectedCount: stepCount,
      bindings: schemaBindings,
      requiredFields: ["schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", ...sessionBoundRecordFields, "sequence", "occurredAt", "monotonicTimeMs", "operator", "scheduleStepOrder", "action", "expectedSourceTarget", "resolvedSourceTarget", "resolution", "previousRecordSha256", "recordSha256"],
      invariants: ["one record per ordered step in spec order", "action and source target canonical-equal the current spec", "hit test succeeds at the source-derived target"],
    }),
    "templates/host-entry-log.schema.template.jsonl": recordSchemaTemplate({
      recordKind: standaloneLegacy
        ? "attested-standalone-source-open-and-entry-observation"
        : "attested-original-host-entry-observation",
      expectedCount: standaloneLegacy ? 3 : 8,
      bindings: schemaBindings,
      requiredFields: [
        "schemaVersion", "evidenceType", "eventKind", "sessionId", "animationId", "requirementId", "proofMode",
        "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", "captureKitManifestSha256",
        "environmentIsolationReceiptSha256", "launchReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs",
        "operator", "details", "previousRecordSha256", "recordSha256",
      ],
      invariants: standaloneLegacy
        ? [
            "exact event order: clean-profile, named-human GUI open of the one hash-bound standalone source, empty side-effect summary",
            "the selected staged source path, bytes, and SHA-256 equal the one-file runtime tree and the current indexed spec source binding",
            "contiguous one-indexed sequence and append-only hash chain in the same attested session",
          ]
        : [
            "exact event order: clean-profile, host frame 50, ELKTEG4.xml, IR child, original Next, RW child, nested frame-domain entry, empty side-effect summary",
            "all paths, bytes, and hashes equal the source-derived five-file runtime tree",
            "contiguous one-indexed sequence and append-only hash chain in the same attested session",
          ],
    }),
  };
  const kitManifest = {
    schemaVersion: 1,
    artifactType: standaloneLegacy
      ? "legacy-root-natural-trace-capture-operator-kit"
      : "rw-natural-trace-capture-operator-kit",
    status: NATURAL_TRACE_TEMPLATE_STATUS,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    identity: bound.spec.identity,
    bindings: bound.bindings,
    runtime: {
      runtimeId: normalizedRuntime.runtimeId,
      name: normalizedRuntime.name,
      version: normalizedRuntime.version,
      requestedAppPath: normalizedRuntime.requestedAppPath,
      appPath: normalizedRuntime.appPath,
      executablePath: normalizedRuntime.executablePath,
      executableSha256: normalizedRuntime.executableSha256,
      identityReceipt: {file: identityProjectRelative, sha256: digest(identityText)},
      launcherNodeExecutable: nodeExecutable,
    },
    originalHostLaunch: {
      ...(standaloneLegacy ? {
        hostKind: "standalone-source-swf-is-original-runtime-host",
        languageIdentityNote: "The standalone SWF is byte-identical for EN/ES requirements; language remains a separate product-context trace identity.",
      } : {}),
      authority: "safety-probe-only-not-authoritative-clean-profile",
      authoritativeCapturePermittedByThisLauncher: false,
      authoritativeEnvironmentRequired: "fresh-disposable-macos-vm-snapshot-or-dedicated-one-time-os-login-account-with-real-independent-home",
      sourceHost: bound.bindings.originalHostSwf,
      stagedHost: {
        file: bound.runtimeHost.stagedRelative,
        sha256: bound.runtimeHost.sha256,
        bytes: bound.runtimeHost.bytes,
      },
      stagedContentRoot: "runtime-tree",
      stagedRuntimeTreeManifest: runtimeTreeManifestBinding,
      sourceTreeLaunchedDirectly: false,
      launcher: "launch-original-host-sandboxed.sh",
      sandboxProfile: "sandbox.sb",
      launchProtocol: NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
      launcherStartsEmptyProjector: true,
      commandLineSwfArgumentProvided: false,
      commandLineHostOpenClaimed: false,
      hostOpen: {
        method: NATURAL_HOST_OPEN_METHOD,
        menuPath: [...NATURAL_HOST_OPEN_MENU_PATH],
        selectedHost: {
          file: bound.runtimeHost.stagedRelative,
          sha256: bound.runtimeHost.sha256,
          bytes: bound.runtimeHost.bytes,
        },
        requiresNamedHumanObservation: true,
      },
      launchesChildAlone: false,
      contentIsolation: "only-hash-bound-minimal-tree-help-math-files-are-present",
      deniedSideEffects: ["network", "apple-events", "launch-services", "writes-outside-ephemeral-temp", "stale-flash-preference-and-sharedobject-reads", "unmanifested-help-math-content-by-absence"],
      limitation: runtimeTreeManifest.isolation.limitation,
    },
    expectedEvidenceCounts: {
      frames: frameCount,
      orderedSteps: stepCount,
      checkpoints: checkpointCount,
      ...(standaloneLegacy ? {
        terminalPostActionStateObservations: terminalPostActionObservationCount,
        totalStateObservations: naturalFrameObservationCount,
      } : {}),
    },
    templates: templateFiles,
    statement: NATURAL_TRACE_AUTHORITY_NOTE,
  };
  const kitManifestBytes = Buffer.from(json(kitManifest));
  const kitManifestSha256 = digest(kitManifestBytes);
  attestation.captureKit = {
    kitManifest: {file: `${kitProjectRelative}/kit-manifest.json`, sha256: kitManifestSha256},
    launcher: {file: `${kitProjectRelative}/launch-original-host-sandboxed.sh`, sha256: digest(launcherContent)},
    sandboxProfile: {file: `${kitProjectRelative}/sandbox.sb`, sha256: digest(sandboxContent)},
    runtimeTreeManifest: runtimeTreeManifestBinding,
    nodeExecutable,
  };
  receipt.captureSessionBinding.captureKitManifestSha256 = kitManifestSha256;
  receipt.captureSessionBinding.sandboxProfileSha256 = attestation.captureKit.sandboxProfile.sha256;
  attestation.toolchainReceipt = {file: null, sha256: null, runtime: receipt.runtime, captureSessionBinding: receipt.captureSessionBinding};
  schemaBindings.captureKitManifestSha256 = kitManifestSha256;
  schemaBindings.sandboxProfileSha256 = attestation.captureKit.sandboxProfile.sha256;
  const launchReceipt = {
    schemaVersion: 2,
    evidenceType: "named-human-hash-bound-original-host-launch-receipt",
    sessionId: "",
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    captureKit: attestation.captureKit,
    environmentIsolation: {file: null, sha256: null},
    runtime: receipt.runtime,
    workingDirectory: `${kitProjectRelative}/runtime-tree`,
    kitCheck: {file: null, sha256: null},
    launchProtocol: NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
    projectorStart: {
      executablePath: normalizedRuntime.executablePath,
      swfArgument: null,
      processId: null,
      startedAt: null,
    },
    hostOpen: {
      method: NATURAL_HOST_OPEN_METHOD,
      menuPath: [...NATURAL_HOST_OPEN_MENU_PATH],
      selectedHost: kitManifest.originalHostLaunch.stagedHost,
      openedAt: null,
      playerWindowObserved: null,
    },
    endedAt: null,
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    statement: NATURAL_LAUNCH_RECEIPT_STATEMENT,
    receiptSha256: null,
  };
  const files = new Map([
    ["README.md", readme({bound})],
    ["OPERATOR_CARD.md", operatorCard({bound})],
    ["kit-manifest.json", kitManifestBytes],
    ["capture-plan.template.json", json(plan)],
    [runtimeTreeManifestRelative, runtimeTreeManifestBytes],
    [identityRelative, identityText],
    [receiptRelative, json(receipt)],
    [environmentReceiptRelative, json(environmentReceipt)],
    [launchReceiptRelative, json(launchReceipt)],
    [attestationRelative, json(attestation)],
    ["sandbox.sb", sandboxContent],
    ["launch-original-host-sandboxed.sh", launcherContent],
    ["frames/README.md", standaloneLegacy
      ? "# Empty capture directory\n\nPlace no files here during scaffolding. A real same-session controller must later create exactly one lossless 225x225 PNG for each naturally reached first-cycle root frame 1..35 plus one separately named terminal post-Replay root-frame-1 PNG.\n"
      : "# Empty capture directory\n\nPlace no files here during scaffolding. A real same-session controller must later create exactly one lossless native-size PNG per naturally reached local frame.\n"],
  ]);
  for (const item of bound.runtimeTreeFiles) files.set(item.stagedRelative, item.content);
  for (const [file, schema] of Object.entries(schemas)) files.set(file, jsonl(schema));
  return {bound, runtime: normalizedRuntime, manifest: kitManifest, files};
}

async function assertNoSymlinkComponents(root, candidate, label) {
  const absoluteRoot = path.resolve(root);
  const absoluteCandidate = path.resolve(candidate);
  if (!isInside(absoluteCandidate, absoluteRoot)) throw new Error(`${label} escapes the project root`);
  const rootInfo = await lstat(absoluteRoot);
  if (rootInfo.isSymbolicLink()) throw new Error(`${label} project root must not be a symbolic link`);
  let current = absoluteRoot;
  for (const part of path.relative(absoluteRoot, absoluteCandidate).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    if (info.isSymbolicLink()) throw new Error(`${label} contains forbidden symbolic-link component ${portable(path.relative(absoluteRoot, current))}`);
  }
}

async function ensureRealOutputRoot(root, outputRoot) {
  const expected = path.join(root, DEFAULT_NATURAL_TRACE_KIT_ROOT);
  if (path.resolve(outputRoot) !== path.resolve(expected)) throw new Error(`natural-trace kit output is fixed at ${DEFAULT_NATURAL_TRACE_KIT_ROOT}`);
  await assertNoSymlinkComponents(root, outputRoot, "natural-trace kit output root");
  await mkdir(outputRoot, {recursive: true});
  await assertNoSymlinkComponents(root, outputRoot, "natural-trace kit output root");
  const [actualRoot, actualOutput] = await Promise.all([realpath(root), realpath(outputRoot)]);
  const expectedActual = path.join(actualRoot, DEFAULT_NATURAL_TRACE_KIT_ROOT);
  if (actualOutput !== expectedActual) throw new Error("natural-trace kit output root real path differs from its fixed path");
}

async function listRegularFiles(root, directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`natural-trace kit contains forbidden symbolic link: ${relative}`);
    if (entry.isDirectory()) result.push(...await listRegularFiles(root, candidate, relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`natural-trace kit contains unsupported filesystem entry: ${relative}`);
  }
  return result.sort();
}

async function assertFixedKitRealPath(root, outputRoot, kitRoot, label) {
  await assertNoSymlinkComponents(root, kitRoot, label);
  const [actualRoot, actualOutput, actualKit] = await Promise.all([
    realpath(root),
    realpath(outputRoot),
    realpath(kitRoot),
  ]);
  if (actualOutput !== path.join(actualRoot, DEFAULT_NATURAL_TRACE_KIT_ROOT) || !isInside(actualKit, actualOutput)) {
    throw new Error(`${label} real path is outside the fixed natural-trace kit root`);
  }
  const sourceAssets = path.join(actualRoot, "source-assets");
  if (isInside(actualKit, sourceAssets)) throw new Error(`${label} must never resolve inside source-assets`);
}

async function snapshotKitTree(root, kitRoot, label = "natural-trace requirement kit") {
  const files = await listRegularFiles(root, kitRoot);
  const contents = new Map();
  const inventory = [];
  const snapshots = [];
  const directories = [];
  const actualKitRoot = await realpath(kitRoot);
  async function walkDirectories(directory, relative = "") {
    const identity = await captureDirectoryIdentity(root, directory, `${label} directory ${relative || "."}`);
    directories.push({path: relative, ...identity});
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (entry.isDirectory()) await walkDirectories(path.join(directory, entry.name), relative ? `${relative}/${entry.name}` : entry.name);
    }
  }
  await walkDirectories(kitRoot);
  for (const relative of files) {
    const candidate = path.join(kitRoot, relative);
    await assertNoSymlinkComponents(root, candidate, `${label} file ${relative}`);
    const info = await lstat(candidate);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
      throw new Error(`${label} file must not be symbolic- or hard-linked: ${relative}`);
    }
    const [actual, bytes] = await Promise.all([realpath(candidate), readFile(candidate)]);
    const confirmed = await lstat(candidate);
    if (
      !confirmed.isFile() || confirmed.isSymbolicLink() || confirmed.nlink !== 1 ||
      !sameNodeIdentity(nodeIdentity(info), nodeIdentity(confirmed)) || confirmed.size !== info.size ||
      permissionMode(confirmed) !== permissionMode(info) || !isInside(actual, actualKitRoot)
    ) {
      throw new Error(`${label} file escapes its fixed directory: ${relative}`);
    }
    contents.set(relative, bytes);
    const record = {
      file: relative,
      bytes: bytes.length,
      sha256: digest(bytes),
      mode: permissionMode(confirmed),
    };
    inventory.push(record);
    snapshots.push({path: relative, node: nodeIdentity(confirmed), ...record});
  }
  return {
    files,
    contents,
    inventory,
    snapshots,
    directories,
    treeSha256: digest(Buffer.from(canonicalJson(inventory))),
  };
}

function assertSnapshotMatchesFiles(snapshot, expectedFiles, label) {
  const expectedNames = [...expectedFiles.keys()].sort();
  if (canonicalJson(snapshot.files) !== canonicalJson(expectedNames)) {
    throw new Error(`${label} file set differs from the deterministic unsigned scaffold; runtime/session evidence or extra files may be present`);
  }
  for (const [relative, content] of expectedFiles) {
    const observed = snapshot.contents.get(relative);
    if (!observed?.equals(Buffer.from(content))) {
      throw new Error(`${label} is not an exact generator-produced unsigned template: ${relative}`);
    }
    const inventory = snapshot.inventory.find(({file}) => file === relative);
    const expectedMode = relative.endsWith(".sh") ? 0o555 : 0o444;
    if (inventory?.mode !== expectedMode) {
      throw new Error(`${label} does not retain generator file mode ${expectedMode.toString(8)}: ${relative}`);
    }
  }
}

function assertExpectedFileMapsEqual(observed, expected, label) {
  const observedNames = [...observed.keys()].sort();
  const expectedNames = [...expected.keys()].sort();
  if (canonicalJson(observedNames) !== canonicalJson(expectedNames)) throw new Error(`${label} file set changed`);
  for (const [relative, content] of expected) {
    if (!Buffer.from(observed.get(relative)).equals(Buffer.from(content))) throw new Error(`${label} changed: ${relative}`);
  }
}

async function assertSnapshotUnchanged(root, directory, snapshot, label) {
  const observed = await snapshotKitTree(root, directory, label);
  if (observed.treeSha256 !== snapshot.treeSha256 || canonicalJson(observed.inventory) !== canonicalJson(snapshot.inventory)) {
    throw new Error(`${label} bytes/modes/tree changed`);
  }
  const expectedFiles = new Map(snapshot.snapshots.map((item) => [item.path, item.node]));
  for (const item of observed.snapshots) {
    if (!sameNodeIdentity(item.node, expectedFiles.get(item.path))) throw new Error(`${label} file inode changed: ${item.path}`);
  }
  const expectedDirectories = new Map(snapshot.directories.map((item) => [item.path, item.node]));
  for (const item of observed.directories) {
    if (!sameNodeIdentity(item.node, expectedDirectories.get(item.path))) throw new Error(`${label} directory inode changed: ${item.path || "."}`);
  }
}

async function cleanupSnapshotTree(directory, snapshot) {
  for (const item of [...snapshot.snapshots].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(directory, item.path), item);
  }
  const depth = (relative) => relative ? relative.split("/").length : 0;
  for (const item of [...snapshot.directories].sort((left, right) => depth(right.path) - depth(left.path))) {
    await removeOwnedEmptyDirectory(item.path ? path.join(directory, item.path) : directory, item);
  }
}

async function ensureOwnedSubdirectories(root, transaction, relativeDirectory, label) {
  if (relativeDirectory === ".") return transaction.directories.get("");
  let cursor = transaction.root;
  let relative = "";
  for (const part of relativeDirectory.split(path.sep).filter(Boolean)) {
    const parentIdentity = transaction.directories.get(relative);
    await assertDirectoryIdentity(root, cursor, parentIdentity, `${label} parent`);
    cursor = path.join(cursor, part);
    relative = relative ? path.join(relative, part) : part;
    const existing = transaction.directories.get(relative);
    if (existing) {
      await assertDirectoryIdentity(root, cursor, existing, label);
      continue;
    }
    await mkdir(cursor, {recursive: false, mode: 0o755});
    transaction.directories.set(relative, await captureDirectoryIdentity(root, cursor, label));
  }
  return transaction.directories.get(relative);
}

async function cleanupFileMapTransaction(transaction) {
  if (!transaction) return;
  for (const [relative, ownership] of [...transaction.files.entries()].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(transaction.root, relative), ownership);
  }
  const depth = (relative) => relative ? relative.split(path.sep).length : 0;
  for (const [relative, ownership] of [...transaction.directories.entries()].sort(([left], [right]) => depth(right) - depth(left))) {
    await removeOwnedEmptyDirectory(relative ? path.join(transaction.root, relative) : transaction.root, ownership);
  }
}

async function writeFileMap(root, directory, files, label) {
  await assertNoSymlinkComponents(root, directory, label);
  if (await existsWithoutFollowing(directory)) throw new Error(`${label} already exists; refusing replacement`);
  const parent = path.dirname(directory);
  const parentIdentity = await captureDirectoryIdentity(root, parent, `${label} parent`);
  await mkdir(directory, {recursive: false});
  const transaction = {
    root: directory,
    parentIdentity,
    directories: new Map([["", await captureDirectoryIdentity(root, directory, `${label} root`)]]),
    files: new Map(),
  };
  try {
    for (const [relative, content] of files) {
      assertPortableProjectRelative(relative, `${label} file ${relative}`);
      const destination = path.join(directory, relative);
      await assertNoSymlinkComponents(root, destination, `${label} file ${relative}`);
      const directoryIdentity = await ensureOwnedSubdirectories(root, transaction, path.dirname(relative), `${label} directory`);
      await writeOwnedFile({
        root,
        parent: path.dirname(destination),
        parentIdentity: directoryIdentity,
        candidate: destination,
        bytes: content,
        mode: relative.endsWith(".sh") ? 0o555 : 0o444,
        label: `${label} file ${relative}`,
        collection: transaction.files,
        key: relative,
      });
    }
    return transaction;
  } catch (error) {
    await cleanupFileMapTransaction(transaction);
    throw error;
  }
}

function withTraceIndexSha256(bound, sha256) {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error("stale kit trace-spec index SHA-256 is invalid");
  return {
    ...bound,
    bindings: {
      ...bound.bindings,
      traceSpecIndex: {...bound.bindings.traceSpecIndex, sha256},
    },
  };
}

async function reconstructAllowlistedPreviousTraceSpec(bound, previousGeneratorSha256, previousTraceSpecSha256) {
  if (!/^[a-f0-9]{64}$/.test(previousTraceSpecSha256 || "")) {
    throw new Error("stale kit trace-spec SHA-256 is invalid");
  }
  if (!/^[a-f0-9]{64}$/.test(previousGeneratorSha256 || "")) {
    throw new Error("previous trace-spec generator SHA-256 must be a lowercase SHA-256");
  }
  const currentGenerator = bound.spec?.sourceBindings?.scheduleDerivation?.generator;
  if (
    currentGenerator?.path !== "scripts/build-course-trace-specs.mjs" ||
    !/^[a-f0-9]{64}$/.test(currentGenerator?.sha256 || "")
  ) {
    throw new Error(`current trace specification lacks the exact ${TRACE_SPEC_GENERATOR_PATH} binding`);
  }
  const currentGeneratorPath = await resolveProjectFile(
    bound.root,
    currentGenerator.path,
    "current trace-spec generator",
  );
  if (await sha256File(currentGeneratorPath) !== currentGenerator.sha256) {
    throw new Error("current trace-spec generator SHA-256 binding is stale");
  }
  if (digest(Buffer.from(json(bound.spec))) !== bound.specSha256) {
    throw new Error("current trace specification is not in the generator's exact JSON byte format");
  }
  if (previousGeneratorSha256 === currentGenerator.sha256) {
    throw new Error("previous trace-spec generator SHA-256 must differ from the current generator SHA-256");
  }

  // Preserve the generator's insertion order and JSON rendering contract. The
  // prior bytes are accepted only when changing this one allowlisted value
  // reconstructs the exact SHA-256 retained by the stale unsigned kit.
  const previousSpec = JSON.parse(JSON.stringify(bound.spec));
  previousSpec.sourceBindings.scheduleDerivation.generator.sha256 = previousGeneratorSha256;
  const generatorOnlyBytes = Buffer.from(json(previousSpec));
  const generatorOnlySha256 = digest(generatorOnlyBytes);
  if (generatorOnlySha256 === previousTraceSpecSha256) {
    return {
      previousSpec,
      proof: {
        kind: "single-allowlisted-trace-spec-field-drift",
        path: TRACE_SPEC_GENERATOR_PATH,
        previousGeneratorSha256,
        currentGeneratorSha256: currentGenerator.sha256,
        reconstructedPreviousTraceSpecSha256: generatorOnlySha256,
        currentTraceSpecSha256: bound.specSha256,
        allOtherTraceSpecBytesReconstructedFromCurrent: true,
      },
    };
  }

  const currentCoverageBinding = bound.spec?.sourceBindings?.fullFrameCoverage;
  const currentIncludedPaths = currentCoverageBinding?.includedPaths;
  const exactCurrentDescriptor =
    currentCoverageBinding?.path === "evidence/full-frame-coverage.json" &&
    currentCoverageBinding?.hashMode === CANONICAL_PROJECTION_ENCODING &&
    currentCoverageBinding?.projection === TRACE_COVERAGE_PROJECTION.id &&
    canonicalJson(currentIncludedPaths || []) === canonicalJson(TRACE_COVERAGE_PROJECTION.includedRequirementPaths) &&
    canonicalJson(currentCoverageBinding?.excludedPaths || []) === canonicalJson(TRACE_COVERAGE_PROJECTION.excludedRequirementPaths);
  const select = (requirement, paths) => Object.fromEntries(
    paths
      .filter((item) => requirement?.[item] !== undefined)
      .map((item) => [item, requirement[item]]),
  );
  const projectionFor = (includedPaths) => projectionSha256({
    projection: TRACE_COVERAGE_PROJECTION.id,
    schemaVersion: bound.coverage?.schemaVersion,
    animationId: bound.coverage?.animationId,
    requirements: (bound.coverage?.requirements || []).map((requirement) => select(requirement, includedPaths)),
  });
  const currentCoverageProjectionSha256 = traceCoverageSha256(bound.coverage);
  const legacyCoverageProjectionSha256 = projectionFor(LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS);
  const descriptorExpansionIsProjectionInert =
    exactCurrentDescriptor &&
    currentCoverageBinding.sha256 === currentCoverageProjectionSha256 &&
    currentCoverageProjectionSha256 === legacyCoverageProjectionSha256;

  if (descriptorExpansionIsProjectionInert) {
    previousSpec.sourceBindings.fullFrameCoverage.includedPaths = [
      ...LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS,
    ];
    const reconstructedBytes = Buffer.from(json(previousSpec));
    const reconstructedSha256 = digest(reconstructedBytes);
    if (reconstructedSha256 === previousTraceSpecSha256) {
      return {
        previousSpec,
        proof: {
          kind: "allowlisted-generator-and-inert-coverage-descriptor-drift",
          paths: [
            TRACE_SPEC_GENERATOR_PATH,
            TRACE_COVERAGE_INCLUDED_PATHS_PATH,
          ],
          previousGeneratorSha256,
          currentGeneratorSha256: currentGenerator.sha256,
          reconstructedPreviousTraceSpecSha256: reconstructedSha256,
          currentTraceSpecSha256: bound.specSha256,
          coverageDescriptorDrift: {
            kind: "schema-v2-partial-selection-descriptor-expansion",
            path: TRACE_COVERAGE_INCLUDED_PATHS_PATH,
            previousIncludedPaths: [...LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS],
            currentIncludedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
            addedPaths: [...TRACE_COVERAGE_SCHEMA_V2_ADDED_REQUIREMENT_PATHS],
            previousProjectionSha256: legacyCoverageProjectionSha256,
            currentProjectionSha256: currentCoverageProjectionSha256,
            projectionSha256Unchanged: true,
          },
          allOtherTraceSpecBytesReconstructedFromCurrent: true,
        },
      };
    }
  }

  throw new Error(
    `previous generator SHA-256 does not reconstruct the stale trace specification; non-allowlisted ${TRACE_SPEC_GENERATOR_PATH} or ${TRACE_COVERAGE_INCLUDED_PATHS_PATH} drift, projection-changing coverage semantics, or an incorrect witness is present`,
  );
}

async function withPreviousTraceSpecAndIndex(bound, {
  previousTraceSpecSha256,
  previousIndexSha256,
  previousGeneratorSha256,
}) {
  const traceSpecBinding = bound.bindings?.traceSpec;
  if (traceSpecBinding?.file !== bound.specRelative) {
    throw new Error("current trace-spec binding path differs from its canonical specification path");
  }
  if (previousTraceSpecSha256 === bound.specSha256) {
    if (previousGeneratorSha256 !== undefined && previousGeneratorSha256 !== null) {
      throw new Error("previous trace-spec generator SHA-256 must be omitted when the trace specification did not change");
    }
    return {
      bound: withTraceIndexSha256(bound, previousIndexSha256),
      driftProof: null,
    };
  }
  if (previousGeneratorSha256 === undefined || previousGeneratorSha256 === null) {
    throw new Error(
      `trace specification changed; --previous-trace-spec-generator-sha256 is required to prove ${TRACE_SPEC_GENERATOR_PATH}-only drift`,
    );
  }
  const {previousSpec, proof} = await reconstructAllowlistedPreviousTraceSpec(
    bound,
    previousGeneratorSha256,
    previousTraceSpecSha256,
  );
  const previousBound = withTraceIndexSha256({
    ...bound,
    spec: previousSpec,
    specSha256: previousTraceSpecSha256,
    bindings: {
      ...bound.bindings,
      traceSpec: {...traceSpecBinding, sha256: previousTraceSpecSha256},
    },
  }, previousIndexSha256);
  return {bound: previousBound, driftProof: proof};
}

async function acquireRefreshLock(root, outputRoot, animationId, safeId) {
  const lockRoot = path.join(outputRoot, ".refresh-locks");
  await assertNoSymlinkComponents(root, lockRoot, "natural-trace refresh lock root");
  await mkdir(lockRoot, {recursive: true});
  await assertNoSymlinkComponents(root, lockRoot, "natural-trace refresh lock root");
  const lockPath = path.join(lockRoot, `${animationId}--${safeId}.lock`);
  try {
    await mkdir(lockPath, {recursive: false});
  } catch (error) {
    if (error.code === "EEXIST") throw new Error("natural-trace unsigned-template refresh is already in progress for this requirement");
    throw error;
  }
  const owner = Buffer.from(json({
    schemaVersion: 1,
    evidenceType: "natural-trace-unsigned-template-refresh-lock-owner",
    nonce: randomUUID(),
    processId: process.pid,
  }));
  const ownerPath = path.join(lockPath, "owner.json");
  const lockIdentity = await captureDirectoryIdentity(root, lockPath, "natural-trace refresh lock");
  const ownerFiles = new Map();
  let ownerOwnership;
  try {
    ownerOwnership = await writeOwnedFile({
      root,
      parent: lockPath,
      parentIdentity: lockIdentity,
      candidate: ownerPath,
      bytes: owner,
      mode: 0o444,
      label: "natural-trace refresh lock owner",
      collection: ownerFiles,
      key: "owner.json",
    });
  } catch (error) {
    if (ownerOwnership) await removeOwnedFileIfUnchanged(ownerPath, ownerOwnership);
    await removeOwnedEmptyDirectory(lockPath, lockIdentity);
    throw error;
  }
  return {path: lockPath, ownerPath, owner, identity: lockIdentity, ownerOwnership};
}

async function releaseRefreshLock(root, lock) {
  await assertNoSymlinkComponents(root, lock.path, "natural-trace refresh lock");
  const observed = await readFile(lock.ownerPath).catch(() => null);
  const info = await lstatIfPresent(lock.ownerPath);
  if (
    !observed?.equals(lock.owner) || !info?.isFile() || info.isSymbolicLink() || info.nlink !== 1 ||
    !sameNodeIdentity(nodeIdentity(info), lock.ownerOwnership.node)
  ) {
    throw new Error(`natural-trace refresh lock ownership changed; refusing to remove ${portable(path.relative(root, lock.path))}`);
  }
  await removeOwnedFileIfUnchanged(lock.ownerPath, lock.ownerOwnership);
  if (!await removeOwnedEmptyDirectory(lock.path, lock.identity)) {
    throw new Error(`natural-trace refresh lock contains a foreign child or replacement: ${portable(path.relative(root, lock.path))}`);
  }
}

function staleArchiveRecord({currentKit, before, staleIndexSha256, staleTraceSpecSha256, traceSpecDriftProof}) {
  return {
    schemaVersion: 1,
    evidenceType: "natural-trace-unsigned-template-stale-archive-record",
    status: "archived-generator-produced-unsigned-template",
    animationId: currentKit.manifest.animationId,
    requirementId: currentKit.manifest.requirementId,
    previousTreeSha256: before.treeSha256,
    inventory: before.inventory,
    traceSpecIndex: {
      previousSha256: staleIndexSha256,
      currentSha256: currentKit.bound.indexSha256,
    },
    traceSpec: {
      previousSha256: staleTraceSpecSha256,
      currentSha256: currentKit.bound.specSha256,
      driftProof: traceSpecDriftProof,
    },
    replacementCaptureKitManifestSha256: digest(currentKit.files.get("kit-manifest.json")),
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    statement: "This deterministic machine record archives only an exact empty unsigned capture-kit template. It is not runtime evidence, human review, owner acceptance, or strict completion.",
  };
}

async function verifyReusableStaleArchive({
  root,
  outputRoot,
  archiveSlot,
  staleKit,
  archiveRecordBytes,
  archiveIntegrityBytes,
}) {
  await assertFixedKitRealPath(root, outputRoot, archiveSlot, "natural-trace stale archive slot");
  const slotFiles = await listRegularFiles(root, archiveSlot);
  const expectedSlotFiles = [
    "archive-record.json",
    NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE,
    ...[...staleKit.files.keys()].map((relative) => `kit/${relative}`),
  ].sort();
  if (canonicalJson(slotFiles) !== canonicalJson(expectedSlotFiles)) {
    throw new Error("existing append-only stale archive has extra, missing, or symbolic-link entries");
  }
  const observedRecord = await readFile(path.join(archiveSlot, "archive-record.json"));
  if (!observedRecord.equals(archiveRecordBytes)) throw new Error("existing append-only stale archive record differs from the planned deterministic record");
  const observedIntegrity = await readFile(path.join(archiveSlot, NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE));
  if (!observedIntegrity.equals(archiveIntegrityBytes)) {
    throw new Error("existing append-only stale archive integrity sidecar differs from the planned deterministic binding");
  }
  const recordInfo = await lstat(path.join(archiveSlot, "archive-record.json"));
  if (!recordInfo.isFile() || recordInfo.isSymbolicLink() || recordInfo.nlink !== 1 || (recordInfo.mode & 0o777) !== 0o444) {
    throw new Error("existing append-only stale archive record is not the generator read-only file");
  }
  const integrityInfo = await lstat(path.join(archiveSlot, NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE));
  if (!integrityInfo.isFile() || integrityInfo.isSymbolicLink() || integrityInfo.nlink !== 1 || (integrityInfo.mode & 0o777) !== 0o444) {
    throw new Error("existing append-only stale archive integrity sidecar is not the generator read-only file");
  }
  assertSnapshotMatchesFiles(await snapshotKitTree(root, path.join(archiveSlot, "kit"), "existing stale archive kit"), staleKit.files, "existing stale archive kit");
}

export async function refreshNaturalTraceCaptureKit({
  projectRoot = PROJECT_ROOT,
  specFile,
  runtime,
  previousTraceSpecGeneratorSha256,
  transactionHooks = {},
}) {
  const root = path.resolve(projectRoot);
  const currentKit = await buildNaturalTraceCaptureKit({projectRoot: root, specFile, runtime});
  if (isStandaloneLegacyNaturalTrace(currentKit.bound)) {
    throw new Error("legacy natural-trace unsigned-template refresh is not implemented; preserve the existing kit and regenerate only through a separately reviewed append-only contract");
  }
  const outputRoot = path.join(root, DEFAULT_NATURAL_TRACE_KIT_ROOT);
  await ensureRealOutputRoot(root, outputRoot);
  const safeId = safeRequirementId(currentKit.manifest.requirementId);
  const kitRoot = path.join(outputRoot, currentKit.manifest.animationId, safeId);
  await assertFixedKitRealPath(root, outputRoot, kitRoot, "natural-trace requirement kit");

  const lock = await acquireRefreshLock(root, outputRoot, currentKit.manifest.animationId, safeId);
  let transactionRoot = null;
  let transactionRootIdentity = null;
  let displacedRoot = null;
  let displacedTransaction = null;
  let newStageTransaction = null;
  let installedTransaction = null;
  let archiveSlot = null;
  let archiveKitRoot = null;
  let before = null;
  try {
    before = await snapshotKitTree(root, kitRoot);
    const manifestBytes = before.contents.get("kit-manifest.json");
    if (!manifestBytes) throw new Error("existing natural-trace kit lacks kit-manifest.json");
    let staleManifest;
    try {
      staleManifest = JSON.parse(manifestBytes.toString("utf8"));
    } catch (error) {
      throw new Error(`existing natural-trace kit manifest is invalid JSON: ${error.message}`);
    }
    if (
      staleManifest.schemaVersion !== 1 || staleManifest.artifactType !== "rw-natural-trace-capture-operator-kit" ||
      staleManifest.status !== NATURAL_TRACE_TEMPLATE_STATUS || staleManifest.strictAcceptanceEffect !== false ||
      staleManifest.migrationStatusChanged !== false || staleManifest.humanReviewRecorded !== false ||
      staleManifest.ownerReviewRecorded !== false || staleManifest.animationId !== currentKit.manifest.animationId ||
      staleManifest.requirementId !== currentKit.manifest.requirementId
    ) throw new Error("existing natural-trace kit is not an unsigned, non-authoritative generator template");
    const staleIndexSha256 = staleManifest.bindings?.traceSpecIndex?.sha256;
    const staleTraceSpec = staleManifest.bindings?.traceSpec;
    if (staleTraceSpec?.file !== currentKit.bound.specRelative || !/^[a-f0-9]{64}$/.test(staleTraceSpec?.sha256 || "")) {
      throw new Error("existing natural-trace kit has an invalid or non-canonical trace-spec binding");
    }
    if (staleIndexSha256 === currentKit.bound.indexSha256) {
      throw new Error("natural-trace unsigned template already binds the current trace-spec index; use --check");
    }
    const previous = await withPreviousTraceSpecAndIndex(currentKit.bound, {
      previousTraceSpecSha256: staleTraceSpec.sha256,
      previousIndexSha256: staleIndexSha256,
      previousGeneratorSha256: previousTraceSpecGeneratorSha256,
    });
    const staleKit = await renderNaturalTraceCaptureKit({
      bound: previous.bound,
      runtime,
    });
    assertSnapshotMatchesFiles(before, staleKit.files, "existing natural-trace kit");
    const archiveRecord = staleArchiveRecord({
      currentKit,
      before,
      staleIndexSha256,
      staleTraceSpecSha256: staleTraceSpec.sha256,
      traceSpecDriftProof: previous.driftProof,
    });
    const archiveRecordBytes = Buffer.from(`${canonicalJson(archiveRecord)}\n`);
    const archiveIntegrity = buildNaturalTraceArchiveIntegritySidecar({
      archiveRecordBytes,
      inventory: before.inventory,
      directoryTreeAlgorithm: NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
      directoryTreeSha256: before.treeSha256,
      animationId: currentKit.manifest.animationId,
      requirementId: currentKit.manifest.requirementId,
    });
    const archiveIntegrityBytes = Buffer.from(`${canonicalJson(archiveIntegrity)}\n`);

    const transactionParent = path.join(outputRoot, ".refresh-transactions");
    await assertNoSymlinkComponents(root, transactionParent, "natural-trace refresh transaction parent");
    await mkdir(transactionParent, {recursive: true});
    await assertFixedKitRealPath(root, outputRoot, transactionParent, "natural-trace refresh transaction parent");
    transactionRoot = path.join(transactionParent, `${currentKit.manifest.animationId}--${safeId}--${randomUUID()}`);
    await assertNoSymlinkComponents(root, transactionRoot, "natural-trace refresh transaction");
    await mkdir(transactionRoot, {recursive: false});
    await assertFixedKitRealPath(root, outputRoot, transactionRoot, "natural-trace refresh transaction");
    transactionRootIdentity = await captureDirectoryIdentity(root, transactionRoot, "natural-trace refresh transaction");
    const newStage = path.join(transactionRoot, "new-kit");
    displacedRoot = path.join(transactionRoot, "displaced-stale-kit");
    newStageTransaction = await writeFileMap(root, newStage, currentKit.files, "natural-trace refreshed kit staging");
    assertSnapshotMatchesFiles(await snapshotKitTree(root, newStage, "natural-trace refreshed kit staging"), currentKit.files, "natural-trace refreshed kit staging");

    if (typeof transactionHooks.beforeCas === "function") await transactionHooks.beforeCas({kitRoot, transactionRoot});
    const rebuiltCurrentKit = await buildNaturalTraceCaptureKit({projectRoot: root, specFile, runtime});
    if (rebuiltCurrentKit.bound.indexSha256 !== currentKit.bound.indexSha256) {
      throw new Error("trace-spec index changed after refresh planning; stale CAS refused");
    }
    assertExpectedFileMapsEqual(rebuiltCurrentKit.files, currentKit.files, "natural-trace refreshed kit plan");
    const casSnapshot = await snapshotKitTree(root, kitRoot);
    if (casSnapshot.treeSha256 !== before.treeSha256) {
      throw new Error("natural-trace kit changed after refresh validation; stale CAS refused");
    }
    const currentIndexSha256 = await sha256File(path.join(root, currentKit.bound.indexRelative));
    if (currentIndexSha256 !== currentKit.bound.indexSha256) {
      throw new Error("trace-spec index changed after refresh planning; stale CAS refused");
    }
    for (const item of currentKit.bound.runtimeTreeFiles) {
      if (await sha256File(item.sourcePath) !== item.sha256) {
        throw new Error("a preserved original-host runtime-tree source changed during refresh");
      }
    }

    const archiveParent = path.join(root, NATURAL_TRACE_STALE_ARCHIVE_ROOT, currentKit.manifest.animationId, safeId);
    await assertNoSymlinkComponents(root, archiveParent, "natural-trace stale archive parent");
    await mkdir(archiveParent, {recursive: true});
    await assertNoSymlinkComponents(root, archiveParent, "natural-trace stale archive parent");
    archiveSlot = path.join(archiveParent, before.treeSha256);
    archiveKitRoot = path.join(archiveSlot, "kit");
    let archiveReused = false;
    if (await existsWithoutFollowing(archiveSlot)) {
      await verifyReusableStaleArchive({root, outputRoot, archiveSlot, staleKit, archiveRecordBytes, archiveIntegrityBytes});
      archiveReused = true;
    } else {
      const archiveFiles = new Map([
        ["archive-record.json", archiveRecordBytes],
        [NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE, archiveIntegrityBytes],
        ...[...before.contents.entries()].map(([relative, bytes]) => [`kit/${relative}`, bytes]),
      ]);
      try {
        await writeFileMap(root, archiveSlot, archiveFiles, "natural-trace append-only stale archive slot");
      } catch (error) {
        if (!/already exists|EEXIST/.test(`${error.code || ""} ${error.message || ""}`)) throw error;
        await verifyReusableStaleArchive({root, outputRoot, archiveSlot, staleKit, archiveRecordBytes, archiveIntegrityBytes});
        archiveReused = true;
      }
      await assertFixedKitRealPath(root, outputRoot, archiveSlot, "natural-trace stale archive slot");
    }
    if (typeof transactionHooks.afterArchive === "function") {
      await transactionHooks.afterArchive({kitRoot, archiveKitRoot, archiveRecord: path.join(archiveSlot, "archive-record.json"), transactionRoot, archiveReused});
    }

    await assertSnapshotUnchanged(root, kitRoot, before, "natural-trace kit before displacement");
    displacedTransaction = await writeFileMap(root, displacedRoot, before.contents, "displaced stale natural-trace kit");
    assertSnapshotMatchesFiles(await snapshotKitTree(root, displacedRoot, "displaced stale natural-trace kit"), staleKit.files, "displaced stale natural-trace kit");
    await cleanupSnapshotTree(kitRoot, before);
    if (await existsWithoutFollowing(kitRoot)) {
      throw new Error("natural-trace active kit retained a foreign child or replacement during displacement");
    }
    if (typeof transactionHooks.afterDisplace === "function") await transactionHooks.afterDisplace({kitRoot, archiveKitRoot, displacedRoot, transactionRoot});
    if (await existsWithoutFollowing(kitRoot)) throw new Error("natural-trace active kit path reappeared during refresh; refusing replacement");
    installedTransaction = await writeFileMap(root, kitRoot, currentKit.files, "refreshed natural-trace requirement kit");
    if (typeof transactionHooks.afterInstall === "function") await transactionHooks.afterInstall({kitRoot, archiveKitRoot, displacedRoot, transactionRoot});
    await assertFixedKitRealPath(root, outputRoot, kitRoot, "refreshed natural-trace requirement kit");
    assertSnapshotMatchesFiles(await snapshotKitTree(root, kitRoot), currentKit.files, "refreshed natural-trace requirement kit");
    await cleanupFileMapTransaction(displacedTransaction);
    displacedTransaction = null;
    displacedRoot = null;
    await cleanupFileMapTransaction(newStageTransaction);
    newStageTransaction = null;
    await removeOwnedEmptyDirectory(transactionRoot, transactionRootIdentity);
    transactionRoot = null;
    return {
      status: "refreshed-unsigned-template-only",
      kitRoot,
      archiveRoot: archiveKitRoot,
      archiveRecord: path.join(archiveSlot, "archive-record.json"),
      archiveIntegrity: path.join(archiveSlot, NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE),
      archiveReused,
      animationId: currentKit.manifest.animationId,
      requirementId: currentKit.manifest.requirementId,
      previousTreeSha256: before.treeSha256,
      previousTraceSpecSha256: staleTraceSpec.sha256,
      traceSpecSha256: currentKit.bound.specSha256,
      traceSpecDriftProof: previous.driftProof,
      previousTraceSpecIndexSha256: staleIndexSha256,
      traceSpecIndexSha256: currentKit.bound.indexSha256,
      captureKitManifestSha256: digest(currentKit.files.get("kit-manifest.json")),
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    };
  } catch (error) {
    let rollbackError = null;
    try {
      if (installedTransaction) {
        await cleanupFileMapTransaction(installedTransaction);
        installedTransaction = null;
      }
      if (displacedTransaction && await existsWithoutFollowing(displacedRoot)) {
        if (await existsWithoutFollowing(kitRoot)) {
          throw new Error("foreign active slot preserved; refusing to overwrite it during rollback");
        }
        await writeFileMap(root, kitRoot, before.contents, "natural-trace refresh rollback restore");
        await cleanupFileMapTransaction(displacedTransaction);
        displacedTransaction = null;
        displacedRoot = null;
      }
    } catch (candidate) {
      rollbackError = candidate;
    }
    const displacedPreserved = displacedRoot && await existsWithoutFollowing(displacedRoot);
    if (!displacedPreserved) {
      await cleanupFileMapTransaction(displacedTransaction);
      displacedTransaction = null;
    }
    await cleanupFileMapTransaction(newStageTransaction);
    newStageTransaction = null;
    if (transactionRoot && !displacedPreserved) await removeOwnedEmptyDirectory(transactionRoot, transactionRootIdentity);
    if (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        `natural-trace refresh failed and rollback could not safely restore the stale kit; preserved recovery transaction: ${portable(path.relative(root, transactionRoot))}`,
      );
    }
    throw error;
  } finally {
    await releaseRefreshLock(root, lock);
  }
}

export async function checkNaturalTraceCaptureKit({projectRoot = PROJECT_ROOT, specFile, runtime}) {
  const root = path.resolve(projectRoot);
  const kit = await buildNaturalTraceCaptureKit({projectRoot: root, specFile, runtime});
  const kitRoot = path.join(root, DEFAULT_NATURAL_TRACE_KIT_ROOT, kit.manifest.animationId, safeRequirementId(kit.manifest.requirementId));
  await assertNoSymlinkComponents(root, kitRoot, "natural-trace requirement kit");
  const info = await stat(kitRoot).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`natural-trace requirement kit is missing: ${portable(path.relative(root, kitRoot))}`);
  const observedFiles = await listRegularFiles(root, kitRoot);
  const expectedFiles = [...kit.files.keys()].sort();
  if (canonicalJson(observedFiles) !== canonicalJson(expectedFiles)) {
    throw new Error("natural-trace requirement kit file set differs from the deterministic scaffold");
  }
  for (const [relative, content] of kit.files) {
    const candidate = path.join(kitRoot, relative);
    const before = await lstat(candidate);
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1) {
      throw new Error(`natural-trace kit file must not be symbolic- or hard-linked: ${relative}`);
    }
    const observed = await readFile(candidate);
    if (!observed.equals(Buffer.from(content))) throw new Error(`natural-trace kit file is stale or edited: ${relative}`);
    const after = await lstat(candidate);
    const expectedMode = relative.endsWith(".sh") ? 0o555 : 0o444;
    if (
      after.nlink !== 1 || !sameNodeIdentity(nodeIdentity(before), nodeIdentity(after)) ||
      permissionMode(after) !== expectedMode
    ) throw new Error(`natural-trace kit file identity or mode changed: ${relative}`);
  }
  return {
    status: "verified-unsigned-template-only",
    kitRoot,
    animationId: kit.manifest.animationId,
    requirementId: kit.manifest.requirementId,
    traceSpecSha256: kit.bound.specSha256,
    sourceSwfSha256: kit.bound.sourceSha256,
    originalHostSwfSha256: kit.bound.originalHostSha256,
    runtimeExecutableSha256: kit.runtime.executableSha256,
    captureKitManifestSha256: digest(kit.files.get("kit-manifest.json")),
    launcherSha256: digest(kit.files.get("launch-original-host-sandboxed.sh")),
    sandboxProfileSha256: digest(kit.files.get("sandbox.sb")),
    runtimeTreeManifestSha256: digest(kit.files.get("runtime-tree-manifest.json")),
    nodeExecutableSha256: kit.manifest.runtime.launcherNodeExecutable.sha256,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
}

export async function scaffoldNaturalTraceCaptureKit({
  projectRoot = PROJECT_ROOT,
  specFile,
  runtime,
  check = false,
  refreshUnsignedTemplate = false,
  previousTraceSpecGeneratorSha256,
  transactionHooks = {},
}) {
  if (check && refreshUnsignedTemplate) throw new Error("--check and --refresh-unsigned-template are mutually exclusive");
  if (check && previousTraceSpecGeneratorSha256 !== undefined && previousTraceSpecGeneratorSha256 !== null) {
    throw new Error("previous trace-spec generator SHA-256 cannot be used with check mode");
  }
  if (check) return checkNaturalTraceCaptureKit({projectRoot, specFile, runtime});
  if (refreshUnsignedTemplate) {
    return refreshNaturalTraceCaptureKit({
      projectRoot,
      specFile,
      runtime,
      previousTraceSpecGeneratorSha256,
      transactionHooks,
    });
  }
  if (previousTraceSpecGeneratorSha256 !== undefined && previousTraceSpecGeneratorSha256 !== null) {
    throw new Error("previous trace-spec generator SHA-256 is valid only with --refresh-unsigned-template");
  }
  const root = path.resolve(projectRoot);
  const kit = await buildNaturalTraceCaptureKit({projectRoot: root, specFile, runtime});
  const outputRoot = path.join(root, DEFAULT_NATURAL_TRACE_KIT_ROOT);
  await ensureRealOutputRoot(root, outputRoot);
  const kitRoot = path.join(outputRoot, kit.manifest.animationId, safeRequirementId(kit.manifest.requirementId));
  await assertNoSymlinkComponents(root, kitRoot, "natural-trace requirement kit");
  if (await existsWithoutFollowing(kitRoot)) throw new Error(`natural-trace requirement kit already exists; refusing overwrite: ${portable(path.relative(root, kitRoot))}`);
  const preservedHashesBefore = new Map(await Promise.all(kit.bound.runtimeTreeFiles.map(async (item) => [
    item.sourcePath,
    await sha256File(item.sourcePath),
  ])));
  const animationRoot = path.dirname(kitRoot);
  await assertNoSymlinkComponents(root, animationRoot, "natural-trace animation kit root");
  if (!await existsWithoutFollowing(animationRoot)) await mkdir(animationRoot, {recursive: false, mode: 0o755});
  await captureDirectoryIdentity(root, animationRoot, "natural-trace animation kit root");
  await assertNoSymlinkComponents(root, kitRoot, "natural-trace requirement kit");
  let transaction = null;
  try {
    transaction = await writeFileMap(root, kitRoot, kit.files, "natural-trace requirement kit");
    for (const [sourcePath, sha256] of preservedHashesBefore) {
      if (await sha256File(sourcePath) !== sha256) {
        throw new Error("a preserved original-host runtime-tree source changed while scaffolding the operator kit");
      }
    }
    return {
      status: "scaffolded-unsigned-template-only",
      kitRoot,
      animationId: kit.manifest.animationId,
      requirementId: kit.manifest.requirementId,
      traceSpecSha256: kit.bound.specSha256,
      sourceSwfSha256: kit.bound.sourceSha256,
      originalHostSwfSha256: kit.bound.originalHostSha256,
      runtimeExecutableSha256: kit.runtime.executableSha256,
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    };
  } catch (error) {
    await cleanupFileMapTransaction(transaction);
    throw error;
  }
}

export function parseArguments(argv) {
  const options = {
    specFile: null,
    playerApp: DEFAULT_PROJECTOR_APP,
    check: false,
    refreshUnsignedTemplate: false,
    previousTraceSpecGeneratorSha256: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const takeValue = () => {
      const candidate = argv[index + 1];
      if (!candidate || candidate.startsWith("--")) throw new Error(`${value} requires a value`);
      index += 1;
      return candidate;
    };
    if (value === "--spec") options.specFile = takeValue();
    else if (value === "--player-app") options.playerApp = path.resolve(takeValue());
    else if (value === "--check") options.check = true;
    else if (value === "--refresh-unsigned-template") options.refreshUnsignedTemplate = true;
    else if (value === "--previous-trace-spec-generator-sha256") options.previousTraceSpecGeneratorSha256 = takeValue();
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (options.check && options.refreshUnsignedTemplate) {
    throw new Error("--check and --refresh-unsigned-template are mutually exclusive");
  }
  if (options.previousTraceSpecGeneratorSha256 && !options.refreshUnsignedTemplate) {
    throw new Error("--previous-trace-spec-generator-sha256 requires --refresh-unsigned-template");
  }
  if (
    options.previousTraceSpecGeneratorSha256 &&
    !/^[a-f0-9]{64}$/.test(options.previousTraceSpecGeneratorSha256)
  ) throw new Error("--previous-trace-spec-generator-sha256 must be a lowercase SHA-256");
  if (!options.help && !options.specFile) throw new Error("--spec is required");
  return options;
}

export function usage() {
  return `Usage: node scripts/scaffold-natural-trace-capture-kit.mjs --spec <project-relative-spec> [options]

Options:
  --spec <file>        Exact current indexed ready RW002 or computeghgh
                       natural-trace spec (required)
  --player-app <path>  Adobe Flash Player Projector .app to version/hash-bind
  --check              Verify the existing kit byte-for-byte without writing
  --refresh-unsigned-template
                       Refresh only an exact generator-produced empty unsigned
                       template; archive prior bytes append-only and fail closed
                       (currently restricted to the reviewed RW002 family)
  --previous-trace-spec-generator-sha256 <sha256>
                       Required only when the stale kit's trace-spec hash also
                       changed; reconstructs and proves the single allowlisted
                       sourceBindings.scheduleDerivation.generator.sha256 drift
  -h, --help           Show this help

The output path is fixed under ${DEFAULT_NATURAL_TRACE_KIT_ROOT}/<animation>/<requirement>.
The command refuses overwrite and symbolic-link output paths. Refresh uses a per-requirement
lock, stale-tree CAS, append-only archive, and rollback. It never launches the runtime,
captures evidence, fills a human identity, writes migrations/source-assets, changes status,
or records human/owner acceptance.
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const runtime = await inspectProjectorRuntime({playerApp: options.playerApp});
  const result = await scaffoldNaturalTraceCaptureKit({
    projectRoot: PROJECT_ROOT,
    specFile: options.specFile,
    runtime,
    check: options.check,
    refreshUnsignedTemplate: options.refreshUnsignedTemplate,
    previousTraceSpecGeneratorSha256: options.previousTraceSpecGeneratorSha256,
  });
  process.stdout.write(`${JSON.stringify({...result, kitRoot: portable(path.relative(PROJECT_ROOT, result.kitRoot))}, null, 2)}\n`);
  process.stderr.write("Unsigned templates only; migration/status/review/coverage remain unchanged.\n");
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
