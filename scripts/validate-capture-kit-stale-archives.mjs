#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {canonicalJson, safeRequirementId} from "./build-course-trace-specs.mjs";
import {
  NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE,
  NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
  NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY,
} from "./scaffold-natural-trace-capture-kit.mjs";
import {
  SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE,
  SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM,
  SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT,
  SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
  SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
  reconstructHistoricalGeneratorDerivedTraceSpec,
} from "./scaffold-source-driven-branch-capture-kit.mjs";
import {APPROVED_SOURCE_DRIVEN_RUNTIME} from "./source-driven-branch-capture-contracts.mjs";
import {rootTraceFamilyForIndexFile} from "./lib/root-trace-spec-contract.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ROOT_ARCHIVE_RELATIVE = "work/root-capture-kit-stale-archive";
const NATURAL_ARCHIVE_RELATIVE = "work/natural-trace-capture-kits/_stale-unsigned-template-archive";
const SOURCE_DRIVEN_BRANCH_ARCHIVE_RELATIVE = SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT;
const SHA256 = /^[a-f0-9]{64}$/;

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sorted(values) {
  return [...values].sort(compareCodeUnits);
}

function assertSha256(value, label) {
  if (!SHA256.test(value || "")) throw new Error(`${label} is not a lowercase SHA-256`);
  return value;
}

function assertPortableRelative(value, label) {
  if (
    typeof value !== "string" || !value || path.isAbsolute(value) || value.includes("\\") ||
    value === ".." || value.startsWith("../") || value.includes("/../") || value.endsWith("/..")
  ) throw new Error(`${label} is not a safe portable relative path`);
  return value;
}

async function assertFixedArchiveRoot(projectRoot, relative) {
  const expected = path.join(projectRoot, relative);
  const info = await lstat(expected);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`capture-kit stale archive root is not a real directory: ${relative}`);
  const [actualProject, actualArchive] = await Promise.all([realpath(projectRoot), realpath(expected)]);
  if (actualArchive !== path.join(actualProject, relative)) {
    throw new Error(`capture-kit stale archive root resolves outside its fixed path: ${relative}`);
  }
  return expected;
}

async function optionalFixedArchiveRoot(projectRoot, relative) {
  const expected = path.join(projectRoot, relative);
  try {
    await lstat(expected);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  return assertFixedArchiveRoot(projectRoot, relative);
}

async function childDirectories(directory, label) {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (entry.isSymbolicLink()) throw new Error(`${label} contains a forbidden symbolic link: ${entry.name}`);
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      throw new Error(`${label} contains an unexpected entry: ${entry.name}`);
    }
    result.push(entry.name);
  }
  return sorted(result);
}

async function regularFiles(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`stale archive contains a forbidden symbolic link: ${relative}`);
    if (entry.isDirectory()) result.push(...await regularFiles(candidate, relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`stale archive contains an unsupported filesystem entry: ${relative}`);
  }
  return sorted(result);
}

function normalizeInventory(inventory, byteField, label) {
  if (!Array.isArray(inventory) || inventory.length === 0) throw new Error(`${label} inventory is empty or invalid`);
  const result = inventory.map((item) => {
    const bytes = item?.[byteField];
    assertPortableRelative(item?.file, `${label} inventory file`);
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error(`${label} inventory byte count is invalid: ${item?.file}`);
    assertSha256(item?.sha256, `${label} inventory SHA-256 for ${item?.file}`);
    if (!Number.isSafeInteger(item?.mode) || item.mode < 0 || item.mode > 0o777) {
      throw new Error(`${label} inventory mode is invalid: ${item?.file}`);
    }
    return {file: item.file, bytes, sha256: item.sha256, mode: item.mode};
  }).sort((left, right) => compareCodeUnits(left.file, right.file));
  if (new Set(result.map(({file}) => file)).size !== result.length) throw new Error(`${label} inventory contains duplicate files`);
  return result;
}

async function inspectKitInventory(kitRoot, {requiredMode, requireSingleLink = false} = {}) {
  const result = [];
  for (const file of await regularFiles(kitRoot)) {
    const candidate = path.join(kitRoot, file);
    const [bytes, info] = await Promise.all([readFile(candidate), lstat(candidate)]);
    if (requiredMode !== undefined && (info.mode & 0o777) !== requiredMode) {
      throw new Error(`stale archive file must have mode ${requiredMode.toString(8).padStart(4, "0")}: ${file}`);
    }
    if (requireSingleLink && info.nlink !== 1) throw new Error(`stale archive file must not be hard-linked: ${file}`);
    result.push({file, bytes: bytes.length, sha256: digest(bytes), mode: info.mode & 0o777});
  }
  return result;
}

function assertSameInventory(actual, declared, label) {
  if (canonicalJson(actual) !== canonicalJson(declared)) throw new Error(`${label} archived kit bytes, hashes, modes, or file set differ`);
}

async function assertSlotFileSet(slotRoot, expected, label) {
  const actual = await regularFiles(slotRoot);
  if (canonicalJson(actual) !== canonicalJson(sorted(expected))) throw new Error(`${label} slot file set differs`);
}

async function readRecord(candidate, label, {requireSingleLink = false} = {}) {
  const [bytes, info] = await Promise.all([readFile(candidate), lstat(candidate)]);
  if (!info.isFile() || (info.mode & 0o777) !== 0o444) throw new Error(`${label} is not a read-only regular file`);
  if (requireSingleLink && info.nlink !== 1) throw new Error(`${label} must not be hard-linked`);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {bytes, value};
}

async function archiveSlots(archiveRoot, label) {
  const result = [];
  for (const animationId of await childDirectories(archiveRoot, `${label} root`)) {
    const animationRoot = path.join(archiveRoot, animationId);
    for (const safeId of await childDirectories(animationRoot, `${label} animation ${animationId}`)) {
      const requirementRoot = path.join(animationRoot, safeId);
      for (const slot of await childDirectories(requirementRoot, `${label} requirement ${animationId}/${safeId}`)) {
        result.push({animationId, safeId, slot, slotRoot: path.join(requirementRoot, slot)});
      }
    }
  }
  return result;
}

async function validateRootArchiveTechnicalBindings({record, actual, kitRoot, recordPath}) {
  const hasGeneratedBindingRecord = [
    "oldTraceSpecSha256",
    "currentTraceSpecSha256",
    "oldTraceSpecIndexSha256",
    "currentTraceSpecIndexSha256",
  ].some((field) => record[field] !== undefined);
  if (!hasGeneratedBindingRecord) return;
  for (const field of [
    "oldTraceSpecSha256",
    "currentTraceSpecSha256",
    "oldTraceSpecIndexSha256",
    "currentTraceSpecIndexSha256",
  ]) assertSha256(record[field], `root stale archive ${field}`);
  if (!actual.some(({file}) => file === "kit-manifest.json")) {
    throw new Error(`root stale archive generated binding record is missing kit-manifest.json: ${recordPath}`);
  }
  let manifest;
  try {
    manifest = JSON.parse((await readFile(path.join(kitRoot, "kit-manifest.json"))).toString("utf8"));
  } catch (error) {
    throw new Error(`root stale archive kit manifest is invalid JSON: ${recordPath}: ${error.message}`);
  }
  if (
    manifest?.schemaVersion !== 1 || manifest?.artifactType !== "root-frame-accurate-capture-operator-kit" ||
    manifest?.animationId !== record.animationId || manifest?.requirementId !== record.requirementId
  ) throw new Error(`root stale archive kit manifest identity differs: ${recordPath}`);
  const spec = manifest.bindings?.traceSpec;
  const index = manifest.bindings?.traceSpecIndex;
  assertBoundIdentity(spec, "root stale archive trace spec");
  assertBoundIdentity(index, "root stale archive trace-spec index");
  const expectedSpec = `migrations/${record.animationId}/audit/trace-specs/${safeRequirementId(record.requirementId)}.json`;
  if (spec.file !== expectedSpec || spec.sha256 !== record.oldTraceSpecSha256) {
    throw new Error(`root stale archive trace-spec binding differs: ${recordPath}`);
  }
  const family = rootTraceFamilyForIndexFile(index.file, "root stale archive trace-spec index");
  if (
    family.id === "legacy-formula-keyterm" &&
    !record.animationId.match(/^(?:formula|keyterm)-elementary-/)
  ) throw new Error(`root stale archive legacy index is bound to a non-formula/keyterm animation: ${recordPath}`);
  if (index.sha256 !== record.oldTraceSpecIndexSha256) {
    throw new Error(`root stale archive trace-spec index hash differs: ${recordPath}`);
  }
}

async function validateRootArchives(projectRoot) {
  const archiveRoot = await assertFixedArchiveRoot(projectRoot, ROOT_ARCHIVE_RELATIVE);
  const results = [];
  for (const location of await archiveSlots(archiveRoot, "root stale archive")) {
    const recordPath = path.join(location.slotRoot, "archive-record.json");
    const {value: record} = await readRecord(recordPath, "root stale archive record");
    if (
      record.schemaVersion !== 1 || record.artifactType !== "append-only-stale-unsigned-root-capture-kit" ||
      record.status !== "archived-unsigned-template-only-not-evidence" || record.notEvidence !== true ||
      record.strictAcceptanceEffect !== false || record.migrationStatusChanged !== false
    ) throw new Error(`root stale archive authority boundary is invalid: ${recordPath}`);
    if (record.animationId !== location.animationId || safeRequirementId(record.requirementId) !== location.safeId) {
      throw new Error(`root stale archive path identity differs: ${recordPath}`);
    }
    const expectedSlot = `${assertSha256(record.oldTreeSha256, "root old tree")}--to--${assertSha256(record.newCaptureKitManifestSha256, "root replacement manifest")}`;
    if (location.slot !== expectedSlot) throw new Error(`root stale archive slot name differs: ${recordPath}`);
    const declared = normalizeInventory(record.files, "size", "root stale archive");
    if (record.fileCount !== declared.length) throw new Error(`root stale archive file count differs: ${recordPath}`);
    const kitRoot = path.join(location.slotRoot, "kit");
    const actual = await inspectKitInventory(kitRoot);
    assertSameInventory(actual, declared, `root stale archive ${location.animationId}/${location.safeId}`);
    await validateRootArchiveTechnicalBindings({record, actual, kitRoot, recordPath});
    const rootTreeInventory = actual.map(({file, bytes: size, sha256, mode}) => ({file, size, sha256, mode}));
    if (digest(Buffer.from(canonicalJson(rootTreeInventory))) !== record.oldTreeSha256) {
      throw new Error(`root stale archive tree SHA-256 cannot be reproduced: ${recordPath}`);
    }
    await assertSlotFileSet(location.slotRoot, ["archive-record.json", ...actual.map(({file}) => `kit/${file}`)], "root stale archive");
    results.push({animationId: location.animationId, requirementId: record.requirementId, treeSha256: record.oldTreeSha256});
  }
  return results;
}

function expectedNaturalSidecar({recordBytes, record, actual, directoryAlgorithm, directorySha256}) {
  const currentFullInventorySha256 = digest(Buffer.from(canonicalJson(actual)));
  const legacyInventory = actual.map(({file, bytes, sha256}) => ({file, bytes, sha256}));
  const legacyModeExcludedInventorySha256 = digest(Buffer.from(canonicalJson(legacyInventory)));
  const legacy = directoryAlgorithm === NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY;
  return {
    value: {
      schemaVersion: 2,
      evidenceType: "natural-trace-unsigned-template-stale-archive-integrity-sidecar",
      status: "append-only-integrity-binding-not-evidence",
      animationId: record.animationId,
      requirementId: record.requirementId,
      archiveRecord: {file: "archive-record.json", sha256: digest(recordBytes)},
      archivedKit: {
        root: "kit",
        fileCount: actual.length,
        currentFullInventory: {
          algorithm: NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
          sha256: currentFullInventorySha256,
        },
      },
      directoryTreeIdentity: {
        algorithm: directoryAlgorithm,
        sha256: directorySha256,
        legacyCompatibilityDerivation: legacy,
      },
      legacyModeExcludedInventory: {
        algorithm: NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY,
        sha256: legacyModeExcludedInventorySha256,
      },
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
      humanReviewRecorded: false,
      ownerReviewRecorded: false,
      statement: "This append-only sidecar binds immutable stale unsigned-template bytes and documents their tree-hash derivation. It is not runtime evidence, human review, owner acceptance, or strict completion.",
    },
    currentFullInventorySha256,
    legacyModeExcludedInventorySha256,
  };
}

async function validateNaturalArchives(projectRoot) {
  const archiveRoot = await assertFixedArchiveRoot(projectRoot, NATURAL_ARCHIVE_RELATIVE);
  const results = [];
  for (const location of await archiveSlots(archiveRoot, "natural stale archive")) {
    const recordPath = path.join(location.slotRoot, "archive-record.json");
    const sidecarPath = path.join(location.slotRoot, NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE);
    const [{bytes: recordBytes, value: record}, {bytes: sidecarBytes, value: sidecar}] = await Promise.all([
      readRecord(recordPath, "natural stale archive record"),
      readRecord(sidecarPath, "natural stale archive integrity sidecar"),
    ]);
    if (!sidecarBytes.equals(Buffer.from(`${canonicalJson(sidecar)}\n`))) {
      throw new Error(`natural stale archive integrity sidecar is not canonical: ${sidecarPath}`);
    }
    if (
      record.schemaVersion !== 1 || record.evidenceType !== "natural-trace-unsigned-template-stale-archive-record" ||
      record.status !== "archived-generator-produced-unsigned-template" || record.strictAcceptanceEffect !== false ||
      record.migrationStatusChanged !== false || record.humanReviewRecorded !== false || record.ownerReviewRecorded !== false
    ) throw new Error(`natural stale archive authority boundary is invalid: ${recordPath}`);
    if (record.animationId !== location.animationId || safeRequirementId(record.requirementId) !== location.safeId) {
      throw new Error(`natural stale archive path identity differs: ${recordPath}`);
    }
    const declared = normalizeInventory(record.inventory, "bytes", "natural stale archive");
    const actual = await inspectKitInventory(path.join(location.slotRoot, "kit"));
    assertSameInventory(actual, declared, `natural stale archive ${location.animationId}/${location.safeId}`);
    const directoryAlgorithm = sidecar?.directoryTreeIdentity?.algorithm;
    if (![NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT, NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY].includes(directoryAlgorithm)) {
      throw new Error(`natural stale archive sidecar tree algorithm is unsupported: ${sidecarPath}`);
    }
    const expected = expectedNaturalSidecar({
      recordBytes,
      record,
      actual,
      directoryAlgorithm,
      directorySha256: record.previousTreeSha256,
    });
    if (canonicalJson(sidecar) !== canonicalJson(expected.value)) {
      throw new Error(`natural stale archive integrity sidecar differs from immutable bytes: ${sidecarPath}`);
    }
    const derivedDirectorySha256 = directoryAlgorithm === NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT
      ? expected.currentFullInventorySha256
      : expected.legacyModeExcludedInventorySha256;
    if (derivedDirectorySha256 !== record.previousTreeSha256 || location.slot !== record.previousTreeSha256) {
      throw new Error(`natural stale archive directory tree identity cannot be reproduced: ${recordPath}`);
    }
    await assertSlotFileSet(location.slotRoot, [
      "archive-record.json",
      NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE,
      ...actual.map(({file}) => `kit/${file}`),
    ], "natural stale archive");
    results.push({
      animationId: location.animationId,
      requirementId: record.requirementId,
      directoryTreeSha256: record.previousTreeSha256,
      directoryTreeAlgorithm: directoryAlgorithm,
      currentFullInventorySha256: expected.currentFullInventorySha256,
    });
  }
  return results;
}

function assertBoundIdentity(binding, label) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) throw new Error(`${label} is missing or invalid`);
  assertPortableRelative(binding.file, `${label} file`);
  assertSha256(binding.sha256, `${label} SHA-256`);
}

const SOURCE_DRIVEN_COMMON_FILES = Object.freeze([
  "OPERATOR_CARD.md",
  "README.md",
  "bindings/projection-bindings.json",
  "bindings/trace-spec-index.json",
  "bindings/trace-spec.json",
  "capture-plan.template.json",
  "frames/README.md",
  "kit-manifest.json",
  "runtime-tree-manifest.json",
  "runtime-tree/fixture-manifest.json",
  "runtime-tree/fixture-spec.json",
  "runtime-tree/host.swf",
  "runtime-tree/upstream-sandbox.sb",
  "runtime/runtime-executable-sha256.txt",
  "runtime/runtime-identity.json",
  "sandbox.sb",
]);

const SOURCE_DRIVEN_V1_TEMPLATE_FILES = Object.freeze([
  "templates/capture-manifest.template.json",
  "templates/environment-isolation-receipt.template.json",
  "templates/frame-state-log.schema.template.jsonl",
  "templates/runtime-toolchain-receipt.template.json",
  "templates/session-attestation.template.json",
  "templates/source-driven-event-log.schema.template.jsonl",
]);

const SOURCE_DRIVEN_V2_ADDITIONAL_TEMPLATE_FILES = Object.freeze([
  "templates/adapter-entry-log.schema.template.jsonl",
  "templates/adapter-launch-receipt.template.json",
  "templates/operation-log.schema.template.jsonl",
  "templates/random-trial-log.schema.template.jsonl",
]);

const SOURCE_DRIVEN_MANIFEST_AUTHORITY = Object.freeze({
  isolatedMinimalAdapterOnly: true,
  originalShellAuthority: false,
  audioOrLanguageAuthority: false,
  runtimeLaunchedByFactory: false,
  framesCapturedByFactory: 0,
  humanIdentityRecorded: false,
  humanReviewRecorded: false,
  ownerReviewRecorded: false,
  strictAcceptanceEffect: false,
  migrationStatusChanged: false,
});

const SOURCE_DRIVEN_CANDIDATE_AUTHORITY = Object.freeze({
  candidateOnly: true,
  status: "pending-candidate-only",
  candidateWriterModule: "scripts/prepare-source-driven-branch-candidate.mjs",
  canonicalBaselineWritten: false,
  canonicalExecutionEvidenceWritten: false,
  migrationStatusChanged: false,
  humanReviewRecorded: false,
  ownerReviewRecorded: false,
  strictAcceptanceEffect: false,
});

const SOURCE_DRIVEN_ARCHIVE_STATEMENT = "This append-only record preserves only an exactly checked empty unsigned source-driven branch capture-kit template. Atomic rename preserves its bytes; it is not runtime evidence, human review, owner acceptance, or strict completion.";

// Keep immutable v3 provenance pins here instead of deriving them from the live
// module. Future contract revisions must append a new pair so already archived
// v3 kits remain independently verifiable.
const SOURCE_DRIVEN_V3_CONTRACT_MODULE_PINS = Object.freeze({
  e0ac929fe1c136ee5ed96ce1caf60b91094806ecd9dbd431f59aea2810c71517:
    "c4f3ca181e9a084c114e240d1a74cf5507afba0b7d4ab6a934b1d2b2d30a725e",
});

function assertExactObjectKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is missing or invalid`);
  if (canonicalJson(sorted(Object.keys(value))) !== canonicalJson(sorted(expected))) throw new Error(`${label} fields differ`);
}

function assertCanonicalEqual(left, right, label) {
  if (canonicalJson(left) !== canonicalJson(right)) throw new Error(`${label} differs`);
}

function inventoryMap(actual) {
  return new Map(actual.map((item) => [item.file, item]));
}

async function readArchivedJson(kitRoot, relative, label) {
  const candidate = path.join(kitRoot, relative);
  let value;
  try {
    value = JSON.parse((await readFile(candidate)).toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return value;
}

function validateTemplateDescriptors(contract, actualByFile, expectedTemplateFiles, label) {
  if (!Array.isArray(contract.files) || contract.files.length !== expectedTemplateFiles.length) {
    throw new Error(`${label} must bind exactly ${expectedTemplateFiles.length} templates`);
  }
  const descriptors = [...contract.files].sort((left, right) => compareCodeUnits(left?.file || "", right?.file || ""));
  if (canonicalJson(descriptors.map(({file}) => file)) !== canonicalJson(sorted(expectedTemplateFiles))) {
    throw new Error(`${label} template file set differs`);
  }
  for (const descriptor of descriptors) {
    assertExactObjectKeys(descriptor, ["file", "sha256"], `${label} template descriptor`);
    assertSha256(descriptor.sha256, `${label} template ${descriptor.file}`);
    if (actualByFile.get(descriptor.file)?.sha256 !== descriptor.sha256) throw new Error(`${label} template hash differs: ${descriptor.file}`);
  }
  assertExactObjectKeys(contract.capturePlan, ["file", "sha256"], `${label} capture plan`);
  if (contract.capturePlan.file !== "capture-plan.template.json" || actualByFile.get(contract.capturePlan.file)?.sha256 !== contract.capturePlan.sha256) {
    throw new Error(`${label} capture-plan binding differs`);
  }
}

function validateV2TemplateContract(contract, actualByFile, variant, label) {
  if (contract?.schemaVersion !== 2) throw new Error(`${label} templateContract schema must be 2`);
  const allowedKeys = ["schemaVersion", "capturePlan", "files", "adapterEntry", "randomTrials", "unifiedOperations"];
  if (contract.candidateInputContract !== undefined) allowedKeys.push("candidateInputContract");
  assertExactObjectKeys(contract, allowedKeys, `${label} templateContract`);
  validateTemplateDescriptors(contract, actualByFile, [...SOURCE_DRIVEN_V1_TEMPLATE_FILES, ...SOURCE_DRIVEN_V2_ADDITIONAL_TEMPLATE_FILES], `${label} templateContract`);
  assertCanonicalEqual(contract.adapterEntry, {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2}, `${label} adapter-entry contract`);
  assertCanonicalEqual(contract.randomTrials, {recordEveryNaturalAttempt: true, acceptedTrialCount: 1, acceptedTrialMustBeLast: true}, `${label} random-trial contract`);
  assertCanonicalEqual(contract.unifiedOperations, {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145}, `${label} operation contract`);
  if (variant === "previous-v2-27-file-pre-candidate-contract-alignment" && contract.candidateInputContract !== undefined) {
    throw new Error(`${label} previous-v2 must predate candidateInputContract`);
  }
  if (contract.candidateInputContract !== undefined) {
    assertCanonicalEqual(contract.candidateInputContract, {
      module: "scripts/prepare-source-driven-branch-candidate.mjs",
      export: "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT",
      schemaVersion: 1,
    }, `${label} historical candidate-input contract`);
  }
}

function validateV3TemplateContract(contract, actualByFile, label) {
  if (contract?.schemaVersion !== 3) throw new Error(`${label} templateContract schema must be 3`);
  assertExactObjectKeys(contract, [
    "schemaVersion", "candidateInputContract", "capturePlan", "files", "adapterEntry", "randomTrials",
    "sourceEvents", "frameStates", "unifiedOperations", "masterEvidenceChain", "authority",
  ], `${label} templateContract`);
  validateTemplateDescriptors(contract, actualByFile, [...SOURCE_DRIVEN_V1_TEMPLATE_FILES, ...SOURCE_DRIVEN_V2_ADDITIONAL_TEMPLATE_FILES], `${label} templateContract`);
  const candidate = contract.candidateInputContract;
  assertExactObjectKeys(candidate, ["module", "export", "schemaVersion", "canonicalEncoding", "sha256", "exact"], `${label} candidateInputContract`);
  assertExactObjectKeys(candidate.module, ["file", "sha256"], `${label} candidateInputContract.module`);
  if (candidate.module.file !== "scripts/source-driven-branch-capture-contracts.mjs") throw new Error(`${label} candidate contract module path differs`);
  assertSha256(candidate.module.sha256, `${label} candidate contract module`);
  if (candidate.export !== "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT" || candidate.schemaVersion !== candidate.exact?.schemaVersion || candidate.canonicalEncoding !== "canonical-json-v1") {
    throw new Error(`${label} candidate contract identity differs`);
  }
  assertSha256(candidate.sha256, `${label} candidate contract`);
  if (candidate.sha256 !== digest(Buffer.from(canonicalJson(candidate.exact)))) throw new Error(`${label} embedded candidate contract hash differs`);
  const pinnedModuleSha256 = SOURCE_DRIVEN_V3_CONTRACT_MODULE_PINS[candidate.sha256];
  if (!pinnedModuleSha256 || candidate.module.sha256 !== pinnedModuleSha256) {
    throw new Error(`${label} candidate contract/module provenance is not an approved immutable v3 pair`);
  }
  assertCanonicalEqual(candidate.exact?.outputAuthority, SOURCE_DRIVEN_CANDIDATE_AUTHORITY, `${label} embedded candidate authority`);
  assertCanonicalEqual(contract.authority, SOURCE_DRIVEN_CANDIDATE_AUTHORITY, `${label} template authority`);
  assertCanonicalEqual(contract.authority, candidate.exact.outputAuthority, `${label} candidate/template authority`);
  assertCanonicalEqual(contract.masterEvidenceChain, candidate.exact?.causalContract?.masterEvidenceChain, `${label} master evidence chain`);
  assertCanonicalEqual(contract.sourceEvents, candidate.exact?.causalContract?.sourceEvents, `${label} source-event causal contract`);
  assertCanonicalEqual(contract.frameStates, candidate.exact?.causalContract?.frameStates, `${label} frame-state causal contract`);
  assertCanonicalEqual(contract.adapterEntry, {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2}, `${label} adapter-entry contract`);
  assertCanonicalEqual(contract.randomTrials, {acceptedSessionNaturalAttemptCount: 1, acceptedTrialCount: 1, acceptedTrialMustBeOnlyRecord: true, firstPreviousRecordSha256From: "adapterEntryLog.finalRecordSha256"}, `${label} random-trial contract`);
  assertCanonicalEqual(contract.unifiedOperations, {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145, firstRecordPreviousRecordSha256From: "randomTrialLog.finalRecordSha256", everyRecordReferencesExactlyOneRawEventOrFrameRecord: true}, `${label} operation contract`);
  const contractTemplatePaths = Object.values(candidate.exact?.inputTemplatePaths || {}).filter((file) => file !== "frames");
  if (canonicalJson(sorted(contractTemplatePaths)) !== canonicalJson(sorted([...SOURCE_DRIVEN_V1_TEMPLATE_FILES, ...SOURCE_DRIVEN_V2_ADDITIONAL_TEMPLATE_FILES]))) {
    throw new Error(`${label} embedded candidate input-template paths differ`);
  }
}

async function readSingleV3JsonDocument(kitRoot, relative, label) {
  const text = (await readFile(path.join(kitRoot, relative))).toString("utf8");
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} must contain exactly one complete JSON document that is a directly fillable skeleton: ${error.message}`);
  }
  return value;
}

async function readSingleV3JsonlRecord(kitRoot, relative, label) {
  const text = (await readFile(path.join(kitRoot, relative))).toString("utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length !== 1) throw new Error(`${label} must contain exactly one nonempty physical line with a directly fillable JSON skeleton record`);
  let value;
  try {
    value = JSON.parse(lines[0]);
  } catch (error) {
    throw new Error(`${label} does not contain a directly fillable single-line JSON skeleton record: ${error.message}`);
  }
  return value;
}

async function validateV3TemplateSkeletons(kitRoot, contract, record, label) {
  const candidate = contract.candidateInputContract.exact;
  const fields = candidate.fieldContracts;
  const evidenceTypes = candidate.evidenceTypes;
  const validateIdentity = (value, expectedFields, evidenceType, itemLabel, {identity = true} = {}) => {
    assertExactObjectKeys(value, expectedFields, itemLabel);
    if (value.schemaVersion !== 1 || value.evidenceType !== evidenceType) throw new Error(`${itemLabel} schema/evidence type differs`);
    if (identity && (value.animationId !== record.animationId || value.requirementId !== record.requirementId)) {
      throw new Error(`${itemLabel} animation/requirement identity differs`);
    }
  };
  const jsonTemplates = [
    ["templates/environment-isolation-receipt.template.json", fields.environmentIsolationReceipt, evidenceTypes.environmentIsolationReceipt, "environment receipt", true],
    ["templates/adapter-launch-receipt.template.json", fields.launchReceipt, evidenceTypes.launchReceipt, "launch receipt", true],
    ["templates/runtime-toolchain-receipt.template.json", fields.toolchainReceipt, evidenceTypes.toolchainReceipt, "toolchain receipt", false],
    ["templates/session-attestation.template.json", fields.sessionAttestation, evidenceTypes.sessionAttestation, "session attestation", true],
    ["templates/capture-manifest.template.json", fields.captureManifest, evidenceTypes.captureManifest, "capture manifest", true],
  ];
  const parsed = new Map();
  for (const [relative, expectedFields, evidenceType, name, identity] of jsonTemplates) {
    const value = await readSingleV3JsonDocument(kitRoot, relative, `${label} ${name} template`);
    validateIdentity(value, expectedFields, evidenceType, `${label} ${name} template`, {identity});
    parsed.set(relative, value);
  }
  const recordTemplates = [
    ["templates/adapter-entry-log.schema.template.jsonl", fields.adapterEntryRecord, evidenceTypes.adapterEntryRecord, "adapter-entry"],
    ["templates/random-trial-log.schema.template.jsonl", fields.randomTrialRecord, evidenceTypes.randomTrialRecord, "random-trial"],
    ["templates/source-driven-event-log.schema.template.jsonl", fields.sourceEventRecord, evidenceTypes.sourceEventRecord, "source-event"],
    ["templates/frame-state-log.schema.template.jsonl", fields.frameStateRecord, evidenceTypes.frameStateRecord, "frame-state"],
    ["templates/operation-log.schema.template.jsonl", fields.operationRecord, evidenceTypes.operationRecord, "operation"],
  ];
  for (const [relative, specificFields, evidenceType, name] of recordTemplates) {
    const value = await readSingleV3JsonlRecord(kitRoot, relative, `${label} ${name} template`);
    validateIdentity(value, [...fields.commonRecord, ...specificFields], evidenceType, `${label} ${name} template`);
  }
  const attestation = parsed.get("templates/session-attestation.template.json");
  const captureManifest = parsed.get("templates/capture-manifest.template.json");
  assertCanonicalEqual(attestation.authority, SOURCE_DRIVEN_CANDIDATE_AUTHORITY, `${label} session-template authority`);
  assertCanonicalEqual(captureManifest.authority, SOURCE_DRIVEN_CANDIDATE_AUTHORITY, `${label} capture-template authority`);
  if (captureManifest.status !== "candidate-input-not-canonical" || captureManifest.strictAcceptanceEffect !== false) {
    throw new Error(`${label} capture template claims authority beyond candidate input`);
  }
}

async function validateSourceDrivenArchivedKit({kitRoot, actual, record, label}) {
  const actualByFile = inventoryMap(actual);
  const manifest = await readArchivedJson(kitRoot, "kit-manifest.json", `${label} kit manifest`);
  assertExactObjectKeys(manifest, [
    "schemaVersion", "artifactType", "status", "animationId", "requirementId", "identity", "bindings",
    "scheduleContract", "runtime", "runtimeTree", "sandbox", ...(record.templateVariant === "legacy-v1-23-file" ? [] : ["templateContract"]), "authority",
  ], `${label} kit manifest`);
  if (
    manifest.schemaVersion !== 1 || manifest.artifactType !== "source-driven-natural-branch-capture-operator-kit" ||
    manifest.status !== "unsigned-empty-template-only-not-evidence" || manifest.animationId !== record.animationId ||
    manifest.requirementId !== record.requirementId
  ) throw new Error(`${label} kit manifest schema/type/status/identity differs`);
  assertCanonicalEqual(manifest.authority, SOURCE_DRIVEN_MANIFEST_AUTHORITY, `${label} kit manifest authority`);
  if (manifest.sandbox?.file !== "sandbox.sb" || manifest.sandbox?.launcherIncluded !== false || manifest.sandbox?.networkDenied !== true || manifest.sandbox?.fileWritesDenied !== true) {
    throw new Error(`${label} kit sandbox authority differs`);
  }
  if (actualByFile.get("sandbox.sb")?.sha256 !== manifest.sandbox.sha256) throw new Error(`${label} kit sandbox hash differs`);
  assertExactObjectKeys(manifest.runtime, [
    "runtimeId", "name", "version", "requestedAppPath", "appPath", "executablePath", "executableSha256",
  ], `${label} kit runtime`);
  if (
    manifest.runtime.runtimeId !== APPROVED_SOURCE_DRIVEN_RUNTIME.runtimeId ||
    manifest.runtime.name !== APPROVED_SOURCE_DRIVEN_RUNTIME.name ||
    manifest.runtime.version !== APPROVED_SOURCE_DRIVEN_RUNTIME.version ||
    manifest.runtime.executableSha256 !== APPROVED_SOURCE_DRIVEN_RUNTIME.executableSha256 ||
    manifest.runtime.executableSha256 !== record.bindings.runtime.executableSha256
  ) {
    throw new Error(`${label} kit runtime identity differs`);
  }
  assertCanonicalEqual(manifest.runtime, record.bindings.runtime, `${label} record/kit runtime`);
  if (manifest.bindings?.traceSpec?.sha256 !== record.bindings.traceSpec.sha256 || manifest.bindings?.traceSpecIndex?.sha256 !== record.bindings.traceSpecIndex.sha256 || manifest.bindings?.fixtureManifest?.sha256 !== record.bindings.fixtureManifest.sha256) {
    throw new Error(`${label} record/kit technical bindings differ`);
  }
  if (
    actualByFile.get("bindings/trace-spec.json")?.sha256 !== manifest.bindings.traceSpec.sha256 ||
    actualByFile.get("bindings/trace-spec-index.json")?.sha256 !== manifest.bindings.traceSpecIndex.sha256
  ) {
    throw new Error(`${label} embedded trace-spec binding bytes differ`);
  }
  const archivedTraceSpec = await readArchivedJson(
    kitRoot,
    "bindings/trace-spec.json",
    `${label} embedded trace specification`,
  );
  const archivedTraceSpecIndex = await readArchivedJson(
    kitRoot,
    "bindings/trace-spec-index.json",
    `${label} embedded trace-spec index`,
  );
  if (
    archivedTraceSpec.animationId !== record.animationId ||
    archivedTraceSpec.requirementId !== record.requirementId
  ) {
    throw new Error(`${label} embedded trace-spec identity differs`);
  }
  if (record.traceSpecDriftProof) {
    const proof = record.traceSpecDriftProof;
    if (
      archivedTraceSpec.sourceBindings?.scheduleDerivation?.generator?.path !==
        proof.generatorFile ||
      archivedTraceSpec.sourceBindings?.scheduleDerivation?.generator?.sha256 !==
        proof.previousGeneratorSha256
    ) {
      throw new Error(`${label} embedded trace-spec generator drift binding differs`);
    }
    if (proof.coverageProjectionSchemaUpgrade) {
      const upgrade = proof.coverageProjectionSchemaUpgrade;
      const coverageBinding = archivedTraceSpec.sourceBindings?.fullFrameCoverage;
      if (
        coverageBinding?.projection !== upgrade.projection ||
        coverageBinding?.sha256 !== upgrade.previousProjectionSha256
      ) {
        throw new Error(`${label} embedded coverage projection schema-upgrade binding differs`);
      }
      assertCanonicalEqual(
        coverageBinding.includedPaths,
        SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
        `${label} embedded coverage-v1 included paths`,
      );
    }
  }
  if (manifest.runtimeTree?.file !== "runtime-tree-manifest.json" || actualByFile.get("runtime-tree-manifest.json")?.sha256 !== manifest.runtimeTree.sha256) {
    throw new Error(`${label} runtime-tree manifest binding differs`);
  }
  const runtimeIdentity = await readArchivedJson(kitRoot, "runtime/runtime-identity.json", `${label} runtime identity`);
  assertCanonicalEqual(runtimeIdentity, manifest.runtime, `${label} staged runtime identity`);
  const runtimeHashText = (await readFile(path.join(kitRoot, "runtime/runtime-executable-sha256.txt"))).toString("utf8");
  if (runtimeHashText !== `${manifest.runtime.executableSha256}\n`) throw new Error(`${label} staged runtime executable hash receipt differs`);
  const tree = await readArchivedJson(kitRoot, "runtime-tree-manifest.json", `${label} runtime-tree manifest`);
  if (
    tree.schemaVersion !== 1 || tree.artifactType !== "source-driven-branch-isolated-minimal-adapter-runtime-tree" ||
    tree.status !== "unsigned-empty-template-only-not-evidence" || tree.animationId !== record.animationId || tree.requirementId !== record.requirementId ||
    tree.fixtureManifest?.stagedFile !== "runtime-tree/fixture-manifest.json" || tree.isolation?.minimalAdapterOnly !== true ||
    tree.isolation?.originalCourseShellIncluded !== false || tree.isolation?.sourceChildUntouched !== true ||
    tree.isolation?.stagedChildReadOnly !== true || tree.isolation?.networkDenied !== true || tree.isolation?.externalActionsRequired !== false
  ) throw new Error(`${label} runtime-tree schema/status/isolation differs`);
  if (!Array.isArray(tree.files) || tree.files.length !== 4) throw new Error(`${label} runtime-tree must contain exactly four staged files`);
  const roles = new Map();
  for (const descriptor of tree.files) {
    assertExactObjectKeys(descriptor, ["source", "destination", "role", "sha256", "bytes", "stagedMode"], `${label} runtime-tree file`);
    assertPortableRelative(descriptor.destination, `${label} runtime-tree destination`);
    if (!descriptor.destination.startsWith("runtime-tree/") || descriptor.stagedMode !== "0444" || roles.has(descriptor.role)) throw new Error(`${label} runtime-tree role/path/mode differs`);
    const archived = actualByFile.get(descriptor.destination);
    if (!archived || archived.sha256 !== descriptor.sha256 || archived.bytes !== descriptor.bytes || archived.mode !== 0o444) throw new Error(`${label} runtime-tree file binding differs: ${descriptor.destination}`);
    roles.set(descriptor.role, descriptor);
  }
  const fixedRoles = {
    "minimal-safe-adapter-host": "runtime-tree/host.swf",
    "safe-adapter-specification": "runtime-tree/fixture-spec.json",
    "exact-upstream-sandbox-reference": "runtime-tree/upstream-sandbox.sb",
  };
  for (const [role, destination] of Object.entries(fixedRoles)) if (roles.get(role)?.destination !== destination) throw new Error(`${label} runtime-tree ${role} differs`);
  const child = roles.get("exact-preserved-child")?.destination;
  if (!child || !child.startsWith("runtime-tree/lesson/") || !child.toLowerCase().endsWith(".swf")) throw new Error(`${label} runtime-tree preserved child differs`);
  const templateFiles = record.templateVariant === "legacy-v1-23-file"
    ? [...SOURCE_DRIVEN_V1_TEMPLATE_FILES]
    : [...SOURCE_DRIVEN_V1_TEMPLATE_FILES, ...SOURCE_DRIVEN_V2_ADDITIONAL_TEMPLATE_FILES];
  const expectedFiles = sorted([...SOURCE_DRIVEN_COMMON_FILES, child, ...templateFiles]);
  if (canonicalJson(actual.map(({file}) => file)) !== canonicalJson(expectedFiles)) throw new Error(`${label} variant-specific exact file set differs`);
  if (record.templateVariant === "legacy-v1-23-file") {
    if (manifest.templateContract !== undefined) throw new Error(`${label} legacy-v1 must not contain templateContract`);
  } else if (record.templateVariant === "current-v3-causal-capture-contract") {
    validateV3TemplateContract(manifest.templateContract, actualByFile, label);
    await validateV3TemplateSkeletons(kitRoot, manifest.templateContract, record, label);
  } else {
    validateV2TemplateContract(manifest.templateContract, actualByFile, record.templateVariant, label);
  }
  return {archivedTraceSpec, archivedTraceSpecIndex};
}

const RECONSTRUCTED_TRACE_SPEC_INDEX_CASCADE_KIND =
  "exact-reconstructed-generator-output-trace-spec-and-index-cascade-v2";
const RECONSTRUCTED_TRACE_SPEC_TRANSFORMS = Object.freeze([
  "technical-binding-manifest-descriptor",
  "technical-binding-coverage-descriptor",
  "technical-binding-scenario-inventory-descriptor",
  "coverage-inventory-technical-projection-sha256",
  "coverage-inventory-file-sha256-at-spec-generation",
  "trace-spec-generator-sha256",
]);

function onePilot(index, animationId, label) {
  const pilots = (index?.pilots || []).filter(
    (pilot) => pilot.animationId === animationId,
  );
  if (pilots.length !== 1) throw new Error(`${label} pilot identity is not unique`);
  return pilots[0];
}

function decodeTraceSpecReconstructionBundle(bundle, label) {
  assertExactObjectKeys(bundle, [
    "encoding",
    "entryCount",
    "uncompressedSha256",
    "gzipSha256",
    "data",
  ], `${label} reconstruction bundle`);
  if (
    bundle.encoding !==
      "gzip-base64-canonical-json-current-trace-spec-snapshots-v1" ||
    !Number.isSafeInteger(bundle.entryCount) ||
    bundle.entryCount <= 0 ||
    typeof bundle.data !== "string" ||
    !bundle.data.length
  ) {
    throw new Error(`${label} reconstruction bundle contract differs`);
  }
  assertSha256(bundle.uncompressedSha256, `${label} reconstruction payload`);
  assertSha256(bundle.gzipSha256, `${label} reconstruction gzip`);
  const compressed = Buffer.from(bundle.data, "base64");
  if (
    compressed.toString("base64") !== bundle.data ||
    digest(compressed) !== bundle.gzipSha256
  ) {
    throw new Error(`${label} reconstruction gzip binding differs`);
  }
  let payload;
  try {
    payload = gunzipSync(compressed);
  } catch (error) {
    throw new Error(`${label} reconstruction gzip cannot be decoded: ${error.message}`);
  }
  if (digest(payload) !== bundle.uncompressedSha256) {
    throw new Error(`${label} reconstruction payload SHA-256 differs`);
  }
  let snapshots;
  try {
    snapshots = JSON.parse(payload.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} reconstruction payload is invalid JSON: ${error.message}`);
  }
  if (
    !Array.isArray(snapshots) ||
    snapshots.length !== bundle.entryCount ||
    !payload.equals(Buffer.from(`${canonicalJson(snapshots)}\n`))
  ) {
    throw new Error(`${label} reconstruction payload is not exact canonical JSON`);
  }
  const byFile = new Map();
  for (const snapshot of snapshots) {
    assertExactObjectKeys(
      snapshot,
      ["file", "currentSpecUtf8"],
      `${label} current trace-spec snapshot`,
    );
    assertPortableRelative(snapshot.file, `${label} current trace-spec snapshot file`);
    if (
      !snapshot.file.startsWith("migrations/") ||
      !snapshot.file.endsWith(".json") ||
      typeof snapshot.currentSpecUtf8 !== "string" ||
      byFile.has(snapshot.file)
    ) {
      throw new Error(`${label} current trace-spec snapshot identity differs`);
    }
    byFile.set(snapshot.file, snapshot.currentSpecUtf8);
  }
  return byFile;
}

function validateReconstructedTraceSpecIndexCascade({
  proof,
  record,
  archivedTraceSpec,
  archivedTraceSpecIndex,
  label,
}) {
  const indexDrift = proof.indexDrift;
  const snapshots = decodeTraceSpecReconstructionBundle(
    indexDrift.reconstructionBundle,
    label,
  );
  if (
    snapshots.size !== indexDrift.changedTraceSpecs.length ||
    indexDrift.reconstructionBundle.entryCount !==
      indexDrift.changedTraceSpecs.length
  ) {
    throw new Error(`${label} reconstruction snapshot coverage differs`);
  }
  const currentIndex = structuredClone(archivedTraceSpecIndex);
  const touchedTechnicalBindings = new Set();
  for (const change of indexDrift.changedTechnicalBindings) {
    if (change.kind === "coverage-included-paths-v1-to-v2") {
      assertExactObjectKeys(change, [
        "kind",
        "animationId",
        "binding",
        "previousIncludedPaths",
        "currentIncludedPaths",
      ], `${label} coverage technical-binding change`);
      if (
        change.binding !== "technicalBindings.coverage.includedPaths" ||
        touchedTechnicalBindings.has(`${change.animationId}:${change.binding}`)
      ) {
        throw new Error(`${label} coverage technical-binding change identity differs`);
      }
      assertCanonicalEqual(
        change.previousIncludedPaths,
        SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
        `${label} historical index coverage-v1 included paths`,
      );
      assertCanonicalEqual(
        change.currentIncludedPaths,
        SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
        `${label} current index coverage-v2 included paths`,
      );
      const pilot = onePilot(
        currentIndex,
        change.animationId,
        `${label} coverage technical-binding change`,
      );
      assertCanonicalEqual(
        pilot.technicalBindings?.coverage?.includedPaths,
        change.previousIncludedPaths,
        `${label} archived index coverage included paths`,
      );
      pilot.technicalBindings.coverage.includedPaths = [
        ...change.currentIncludedPaths,
      ];
    } else if (change.kind === "technical-binding-sha256") {
      assertExactObjectKeys(change, [
        "kind",
        "animationId",
        "binding",
        "previousSha256",
        "currentSha256",
      ], `${label} technical-binding SHA-256 change`);
      const match = /^technicalBindings\.(manifest|coverage|scenarioInventory)\.sha256$/.exec(
        change.binding,
      );
      if (
        !match ||
        change.previousSha256 === change.currentSha256 ||
        touchedTechnicalBindings.has(`${change.animationId}:${change.binding}`)
      ) {
        throw new Error(`${label} technical-binding SHA-256 change identity differs`);
      }
      assertSha256(change.previousSha256, `${label} historical technical binding`);
      assertSha256(change.currentSha256, `${label} current technical binding`);
      const pilot = onePilot(
        currentIndex,
        change.animationId,
        `${label} technical-binding SHA-256 change`,
      );
      if (
        pilot.technicalBindings?.[match[1]]?.sha256 !== change.previousSha256
      ) {
        throw new Error(`${label} archived technical-binding SHA-256 differs`);
      }
      pilot.technicalBindings[match[1]].sha256 = change.currentSha256;
    } else {
      throw new Error(`${label} technical-binding change kind is unsupported`);
    }
    touchedTechnicalBindings.add(`${change.animationId}:${change.binding}`);
  }

  const touchedSpecs = new Set();
  const selected = [];
  for (const change of indexDrift.changedTraceSpecs) {
    assertExactObjectKeys(change, [
      "animationId",
      "requirementId",
      "file",
      "previousSha256",
      "currentSha256",
      "allowlistedTransforms",
      "previousInventoryFileSha256AtSpecGeneration",
      "historicalInventoryFileWitness",
    ], `${label} reconstructed trace-spec change`);
    assertPortableRelative(change.file, `${label} reconstructed trace-spec file`);
    assertSha256(change.previousSha256, `${label} previous trace-spec`);
    assertSha256(change.currentSha256, `${label} current trace-spec`);
    assertSha256(
      change.previousInventoryFileSha256AtSpecGeneration,
      `${label} historical scenario-inventory file`,
    );
    if (
      change.previousSha256 === change.currentSha256 ||
      !change.file.startsWith("migrations/") ||
      !change.file.endsWith(".json") ||
      touchedSpecs.has(change.file) ||
      !Array.isArray(change.allowlistedTransforms) ||
      !change.allowlistedTransforms.length ||
      change.allowlistedTransforms.some(
        (transform) => !RECONSTRUCTED_TRACE_SPEC_TRANSFORMS.includes(transform),
      )
    ) {
      throw new Error(`${label} reconstructed trace-spec change identity differs`);
    }
    const currentSpecUtf8 = snapshots.get(change.file);
    if (currentSpecUtf8 === undefined) {
      throw new Error(`${label} reconstructed trace-spec snapshot is missing`);
    }
    const currentSpecBytes = Buffer.from(currentSpecUtf8);
    if (digest(currentSpecBytes) !== change.currentSha256) {
      throw new Error(`${label} current trace-spec snapshot SHA-256 differs`);
    }
    let currentSpecValue;
    try {
      currentSpecValue = JSON.parse(currentSpecUtf8);
    } catch (error) {
      throw new Error(`${label} current trace-spec snapshot is invalid JSON: ${error.message}`);
    }
    if (
      currentSpecUtf8 !== `${JSON.stringify(currentSpecValue, null, 2)}\n` ||
      currentSpecValue.animationId !== change.animationId ||
      currentSpecValue.requirementId !== change.requirementId
    ) {
      throw new Error(`${label} current trace-spec snapshot format/identity differs`);
    }
    const historicalPilot = onePilot(
      archivedTraceSpecIndex,
      change.animationId,
      `${label} historical trace-spec`,
    );
    const currentPilot = onePilot(
      currentIndex,
      change.animationId,
      `${label} current trace-spec`,
    );
    const historicalEntries = (historicalPilot.traceSpecs || []).filter(
      (entry) =>
        entry.requirementId === change.requirementId &&
        entry.file === change.file,
    );
    const currentEntries = (currentPilot.traceSpecs || []).filter(
      (entry) =>
        entry.requirementId === change.requirementId &&
        entry.file === change.file,
    );
    if (
      historicalEntries.length !== 1 ||
      currentEntries.length !== 1 ||
      historicalEntries[0].sha256 !== change.previousSha256 ||
      currentEntries[0].sha256 !== change.previousSha256
    ) {
      throw new Error(`${label} archived trace-spec index entry differs`);
    }
    const reconstructed = reconstructHistoricalGeneratorDerivedTraceSpec({
      currentSpecValue,
      previousGeneratorSha256: proof.previousGeneratorSha256,
      currentGeneratorSha256: proof.currentGeneratorSha256,
      historicalTechnicalBindings: historicalPilot.technicalBindings,
      currentTechnicalBindings: currentPilot.technicalBindings,
      previousInventoryFileSha256AtSpecGeneration:
        change.previousInventoryFileSha256AtSpecGeneration,
    });
    if (
      reconstructed.sha256 !== change.previousSha256 ||
      canonicalJson(reconstructed.allowlistedTransforms) !==
        canonicalJson(change.allowlistedTransforms)
    ) {
      throw new Error(`${label} previous trace-spec bytes cannot be exactly reconstructed`);
    }
    const witness = change.historicalInventoryFileWitness;
    const inventoryFileChanged = change.allowlistedTransforms.includes(
      "coverage-inventory-file-sha256-at-spec-generation",
    );
    if (witness === null) {
      if (inventoryFileChanged) {
        throw new Error(`${label} changed historical inventory file hash lacks a witness`);
      }
    } else {
      assertExactObjectKeys(witness, [
        "kind",
        "file",
        "sha256",
        "field",
        "value",
      ], `${label} historical inventory-file witness`);
      assertPortableRelative(witness.file, `${label} historical inventory-file witness`);
      assertSha256(witness.sha256, `${label} historical inventory-file witness manifest`);
      if (
        !inventoryFileChanged ||
        witness.kind !== "historical-adobe-course-host-fixture-manifest" ||
        witness.field !== "evidenceHashes.scenarioInventorySha256" ||
        witness.value !==
          change.previousInventoryFileSha256AtSpecGeneration
      ) {
        throw new Error(`${label} historical inventory-file witness contract differs`);
      }
    }
    currentEntries[0].sha256 = change.currentSha256;
    touchedSpecs.add(change.file);
    snapshots.delete(change.file);
    if (
      change.animationId === record.animationId &&
      change.requirementId === record.requirementId
    ) {
      selected.push({change, reconstructed});
    }
  }
  if (snapshots.size !== 0) {
    throw new Error(`${label} reconstruction bundle has unreferenced snapshots`);
  }
  if (
    selected.length !== 1 ||
    selected[0].change.file !== record.bindings.traceSpec.file ||
    selected[0].change.previousSha256 !==
      proof.reconstructedPreviousTraceSpecSha256 ||
    selected[0].change.currentSha256 !== proof.currentTraceSpecSha256 ||
    `${JSON.stringify(selected[0].reconstructed.value, null, 2)}\n` !==
      `${JSON.stringify(archivedTraceSpec, null, 2)}\n`
  ) {
    throw new Error(`${label} selected reconstructed trace specification differs`);
  }
  const currentIndexBytes = Buffer.from(
    `${JSON.stringify(currentIndex, null, 2)}\n`,
  );
  if (digest(currentIndexBytes) !== proof.currentTraceSpecIndexSha256) {
    throw new Error(`${label} current trace-spec index cascade cannot be reproduced`);
  }
}

async function validateSourceDrivenBranchArchives(projectRoot) {
  const archiveRoot = await optionalFixedArchiveRoot(projectRoot, SOURCE_DRIVEN_BRANCH_ARCHIVE_RELATIVE);
  if (!archiveRoot) return [];
  const results = [];
  for (const location of await archiveSlots(archiveRoot, "source-driven branch stale archive")) {
    const recordPath = path.join(location.slotRoot, "archive-record.json");
    const sidecarPath = path.join(location.slotRoot, SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE);
    const [{bytes: recordBytes, value: record}, {bytes: sidecarBytes, value: sidecar}] = await Promise.all([
      readRecord(recordPath, "source-driven branch stale archive record", {requireSingleLink: true}),
      readRecord(sidecarPath, "source-driven branch stale archive integrity sidecar", {requireSingleLink: true}),
    ]);
    if (!recordBytes.equals(Buffer.from(`${canonicalJson(record)}\n`))) {
      throw new Error(`source-driven branch stale archive record is not canonical: ${recordPath}`);
    }
    if (!sidecarBytes.equals(Buffer.from(`${canonicalJson(sidecar)}\n`))) {
      throw new Error(`source-driven branch stale archive integrity sidecar is not canonical: ${sidecarPath}`);
    }
    const hasTraceSpecDriftProof = record.traceSpecDriftProof !== undefined;
    const hasTraceSpecIndexDriftProof = record.traceSpecIndexDriftProof !== undefined;
    if (hasTraceSpecDriftProof && hasTraceSpecIndexDriftProof) {
      throw new Error(`source-driven branch stale archive has conflicting drift proofs: ${recordPath}`);
    }
    assertExactObjectKeys(record, [
      "schemaVersion", "artifactType", "status", "sourceKit", "archivedKitRoot", "animationId", "requirementId",
      "templateVariant", "bindings", ...(hasTraceSpecDriftProof ? ["traceSpecDriftProof"] : []),
      ...(hasTraceSpecIndexDriftProof ? ["traceSpecIndexDriftProof"] : []), "archivedTree", "authority", "statement",
    ], "source-driven branch stale archive record");
    assertExactObjectKeys(record.bindings, [
      "traceSpec", "traceSpecIndex", "fixtureManifest", "runtime", "archivedCaptureKitManifestSha256",
      "currentSchemaCaptureKitManifestSha256",
    ], "source-driven branch stale archive bindings");
    assertExactObjectKeys(record.bindings.fixtureManifest, ["file", "sha256"], "source-driven branch fixture binding");
    assertExactObjectKeys(record.archivedTree, ["algorithm", "sha256", "fileCount"], "source-driven branch archived tree");
    assertExactObjectKeys(record.authority, [
      "runtimeLaunched", "framesCaptured", "humanIdentityRecorded", "humanReviewRecorded", "ownerReviewRecorded",
      "strictAcceptanceEffect", "migrationStatusChanged",
    ], "source-driven branch archive authority");
    if (
      record.schemaVersion !== (hasTraceSpecIndexDriftProof ? 3 : hasTraceSpecDriftProof ? 2 : 1) ||
      record.artifactType !== "source-driven-branch-unsigned-template-stale-archive-record" ||
      record.status !== "archived-current-checked-unsigned-template-only-not-evidence" ||
      record.archivedKitRoot !== "kit" || record.authority?.runtimeLaunched !== false ||
      record.authority?.framesCaptured !== 0 || record.authority?.humanIdentityRecorded !== false ||
      record.authority?.humanReviewRecorded !== false || record.authority?.ownerReviewRecorded !== false ||
      record.authority?.strictAcceptanceEffect !== false || record.authority?.migrationStatusChanged !== false ||
      record.statement !== SOURCE_DRIVEN_ARCHIVE_STATEMENT
    ) throw new Error(`source-driven branch stale archive authority boundary is invalid: ${recordPath}`);
    if (record.animationId !== location.animationId || safeRequirementId(record.requirementId) !== location.safeId) {
      throw new Error(`source-driven branch stale archive path identity differs: ${recordPath}`);
    }
    const expectedSourceKit = `work/source-driven-branch-capture-kits/${record.animationId}/${safeRequirementId(record.requirementId)}`;
    if (record.sourceKit !== expectedSourceKit) throw new Error(`source-driven branch stale archive source-kit identity differs: ${recordPath}`);
    const expectedCount = record.templateVariant === "legacy-v1-23-file"
      ? 23
      : [
          "current-v3-causal-capture-contract",
          "current-v2-complete-capture-contract",
          "previous-v2-27-file-pre-candidate-contract-alignment",
        ].includes(record.templateVariant)
        ? 27
        : null;
    if (!expectedCount) throw new Error(`source-driven branch stale archive template variant is unsupported: ${recordPath}`);
    assertExactObjectKeys(record.bindings.traceSpec, ["file", "sha256"], "source-driven branch trace spec");
    assertExactObjectKeys(record.bindings.traceSpecIndex, ["file", "sha256"], "source-driven branch trace-spec index");
    assertBoundIdentity(record.bindings?.traceSpec, "source-driven branch trace spec");
    assertBoundIdentity(record.bindings?.traceSpecIndex, "source-driven branch trace-spec index");
    assertBoundIdentity(record.bindings?.fixtureManifest, "source-driven branch fixture manifest");
    if (record.bindings.traceSpecIndex.file !== "migrations/course-shell-pilot-trace-spec-index.json") {
      throw new Error(`source-driven branch trace-spec index path differs: ${recordPath}`);
    }
    assertSha256(record.bindings?.archivedCaptureKitManifestSha256, "source-driven branch archived kit manifest");
    assertSha256(record.bindings?.currentSchemaCaptureKitManifestSha256, "source-driven branch current-schema kit manifest");
    if (hasTraceSpecDriftProof) {
      const proof = record.traceSpecDriftProof;
      const hasCoverageProjectionSchemaUpgrade =
        proof.coverageProjectionSchemaUpgrade !== undefined;
      assertExactObjectKeys(proof, [
        "kind", "path", "generatorFile", "previousGeneratorSha256", "currentGeneratorSha256",
        "reconstructedPreviousTraceSpecSha256", "currentTraceSpecSha256", "previousTraceSpecIndexSha256",
        "currentTraceSpecIndexSha256", "indexDrift",
        ...(hasCoverageProjectionSchemaUpgrade ? ["coverageProjectionSchemaUpgrade"] : []),
        "allOtherSelectedTraceSpecBytesReconstructedFromCurrent",
      ], "source-driven branch trace-spec drift proof");
      const hasReconstructedIndexCascade =
        proof.indexDrift?.kind === RECONSTRUCTED_TRACE_SPEC_INDEX_CASCADE_KIND;
      assertExactObjectKeys(
        proof.indexDrift,
        hasReconstructedIndexCascade
          ? [
              "kind",
              "changedTechnicalBindings",
              "changedTraceSpecs",
              "reconstructionBundle",
            ]
          : ["kind", "changedTraceSpecs"],
        "source-driven branch trace-spec index drift proof",
      );
      if (
        proof.kind !== (
          hasCoverageProjectionSchemaUpgrade
            ? "allowlisted-generator-and-coverage-projection-schema-upgrade"
            : "single-allowlisted-trace-spec-field-drift"
        ) ||
        proof.path !== "sourceBindings.scheduleDerivation.generator.sha256" ||
        proof.generatorFile !== "scripts/build-course-trace-specs.mjs" ||
        ![
          "same-index-structure-except-generator-derived-trace-spec-sha256-fields",
          RECONSTRUCTED_TRACE_SPEC_INDEX_CASCADE_KIND,
        ].includes(proof.indexDrift.kind) ||
        proof.allOtherSelectedTraceSpecBytesReconstructedFromCurrent !== true ||
        proof.previousGeneratorSha256 === proof.currentGeneratorSha256 ||
        record.bindings.traceSpec.sha256 !== proof.reconstructedPreviousTraceSpecSha256 ||
        record.bindings.traceSpecIndex.sha256 !== proof.previousTraceSpecIndexSha256
      ) throw new Error(`source-driven branch trace-spec drift proof contract differs: ${recordPath}`);
      for (const field of [
        "previousGeneratorSha256", "currentGeneratorSha256", "reconstructedPreviousTraceSpecSha256",
        "currentTraceSpecSha256", "previousTraceSpecIndexSha256", "currentTraceSpecIndexSha256",
      ]) assertSha256(proof[field], `source-driven branch trace-spec drift proof ${field}`);
      if (hasCoverageProjectionSchemaUpgrade) {
        const upgrade = proof.coverageProjectionSchemaUpgrade;
        assertExactObjectKeys(upgrade, [
          "kind", "path", "projection", "previousIncludedPaths", "currentIncludedPaths",
          "previousProjectionSha256", "currentProjectionSha256", "projectionSha256Unchanged",
          "allOtherTraceSpecBytesReconstructedFromCurrent",
        ], "source-driven branch coverage projection schema-upgrade proof");
        if (
          upgrade.kind !== "deterministic-trace-coverage-included-paths-v1-to-v2" ||
          upgrade.path !== "sourceBindings.fullFrameCoverage.includedPaths" ||
          upgrade.projection !== "help-math-trace-coverage-identity-v1" ||
          upgrade.projectionSha256Unchanged !== true ||
          upgrade.previousProjectionSha256 !== upgrade.currentProjectionSha256 ||
          upgrade.allOtherTraceSpecBytesReconstructedFromCurrent !== true
        ) {
          throw new Error(`source-driven branch coverage projection schema-upgrade proof contract differs: ${recordPath}`);
        }
        assertCanonicalEqual(
          upgrade.previousIncludedPaths,
          SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
          "source-driven branch coverage-v1 included paths",
        );
        assertCanonicalEqual(
          upgrade.currentIncludedPaths,
          SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
          "source-driven branch coverage-v2 included paths",
        );
        assertSha256(
          upgrade.previousProjectionSha256,
          "source-driven branch coverage-v1 projection SHA-256",
        );
        assertSha256(
          upgrade.currentProjectionSha256,
          "source-driven branch coverage-v2 projection SHA-256",
        );
      }
      if (!Array.isArray(proof.indexDrift.changedTraceSpecs) || proof.indexDrift.changedTraceSpecs.length === 0) {
        throw new Error(`source-driven branch trace-spec drift proof has no changed index entries: ${recordPath}`);
      }
      const selectedChanges = [];
      for (const change of proof.indexDrift.changedTraceSpecs) {
        assertExactObjectKeys(
          change,
          hasReconstructedIndexCascade
            ? [
                "animationId",
                "requirementId",
                "file",
                "previousSha256",
                "currentSha256",
                "allowlistedTransforms",
                "previousInventoryFileSha256AtSpecGeneration",
                "historicalInventoryFileWitness",
              ]
            : [
                "animationId",
                "requirementId",
                "file",
                "previousSha256",
                "currentSha256",
              ],
          "source-driven branch changed trace-spec index entry",
        );
        assertSha256(change.previousSha256, "source-driven branch changed trace-spec previous SHA-256");
        assertSha256(change.currentSha256, "source-driven branch changed trace-spec current SHA-256");
        if (
          change.previousSha256 === change.currentSha256 || typeof change.file !== "string" ||
          !change.file.startsWith("migrations/") || !change.file.endsWith(".json")
        ) throw new Error(`source-driven branch changed trace-spec index entry is invalid: ${recordPath}`);
        if (change.animationId === record.animationId && change.requirementId === record.requirementId) selectedChanges.push(change);
      }
      if (
        selectedChanges.length !== 1 || selectedChanges[0].file !== record.bindings.traceSpec.file ||
        selectedChanges[0].previousSha256 !== proof.reconstructedPreviousTraceSpecSha256 ||
        selectedChanges[0].currentSha256 !== proof.currentTraceSpecSha256
      ) throw new Error(`source-driven branch trace-spec drift proof selected requirement differs: ${recordPath}`);
    }
    if (hasTraceSpecIndexDriftProof) {
      const proof = record.traceSpecIndexDriftProof;
      assertExactObjectKeys(proof, [
        "kind", "selectedTraceSpec", "previousTraceSpecIndexSha256", "currentTraceSpecIndexSha256",
        "indexDrift", "selectedPilotCanonicalJsonUnchanged", "topLevelAndStructureCanonicalJsonUnchanged",
      ], "source-driven branch trace-spec index-only drift proof");
      assertExactObjectKeys(proof.selectedTraceSpec, [
        "file", "sha256", "bytesUnchanged", "indexEntryUnchanged",
      ], "source-driven branch index-only selected trace spec");
      assertExactObjectKeys(proof.indexDrift, [
        "kind", "changedOtherPilotBindings",
      ], "source-driven branch index-only index drift");
      if (
        proof.kind !== "selected-trace-spec-current-global-index-only-drift" ||
        proof.indexDrift.kind !== "same-index-structure-selected-pilot-unchanged-other-pilot-approved-sha256-fields-only" ||
        proof.selectedTraceSpec.file !== record.bindings.traceSpec.file ||
        proof.selectedTraceSpec.sha256 !== record.bindings.traceSpec.sha256 ||
        proof.selectedTraceSpec.bytesUnchanged !== true || proof.selectedTraceSpec.indexEntryUnchanged !== true ||
        proof.previousTraceSpecIndexSha256 !== record.bindings.traceSpecIndex.sha256 ||
        proof.previousTraceSpecIndexSha256 === proof.currentTraceSpecIndexSha256 ||
        proof.selectedPilotCanonicalJsonUnchanged !== true || proof.topLevelAndStructureCanonicalJsonUnchanged !== true
      ) throw new Error(`source-driven branch trace-spec index-only drift proof contract differs: ${recordPath}`);
      assertSha256(proof.selectedTraceSpec.sha256, "source-driven branch index-only selected trace spec");
      assertSha256(proof.previousTraceSpecIndexSha256, "source-driven branch index-only previous trace-spec index");
      assertSha256(proof.currentTraceSpecIndexSha256, "source-driven branch index-only current trace-spec index");
      const changes = proof.indexDrift.changedOtherPilotBindings;
      if (!Array.isArray(changes) || changes.length === 0) {
        throw new Error(`source-driven branch trace-spec index-only drift proof has no changed bindings: ${recordPath}`);
      }
      const identities = new Set();
      const allowedTechnicalBindings = new Set([
        "technicalBindings.manifest.sha256",
        "technicalBindings.coverage.sha256",
        "technicalBindings.scenarioInventory.sha256",
      ]);
      for (const change of changes) {
        assertExactObjectKeys(change, [
          "kind", "animationId", "requirementId", "file", "binding", "previousSha256", "currentSha256",
        ], "source-driven branch index-only changed binding");
        assertSha256(change.previousSha256, "source-driven branch index-only previous binding SHA-256");
        assertSha256(change.currentSha256, "source-driven branch index-only current binding SHA-256");
        const technical = change.kind === "technical-binding-sha256" &&
          allowedTechnicalBindings.has(change.binding) && change.requirementId === null && change.file === null;
        const traceSpec = change.kind === "trace-spec-sha256" && change.binding === "traceSpecs[].sha256" &&
          typeof change.requirementId === "string" && change.requirementId.length > 0 &&
          typeof change.file === "string" && change.file.startsWith("migrations/") && change.file.endsWith(".json");
        if (
          typeof change.animationId !== "string" || !change.animationId.length || change.animationId === record.animationId ||
          change.previousSha256 === change.currentSha256 || (!technical && !traceSpec)
        ) throw new Error(`source-driven branch index-only changed binding is invalid: ${recordPath}`);
        const identity = `${change.animationId}\0${change.requirementId ?? ""}\0${change.file ?? ""}\0${change.binding}`;
        if (identities.has(identity)) throw new Error(`source-driven branch index-only changed binding is duplicated: ${recordPath}`);
        identities.add(identity);
      }
    }
    if (
      record.templateVariant === "current-v3-causal-capture-contract" &&
      !hasTraceSpecDriftProof && !hasTraceSpecIndexDriftProof &&
      record.bindings.archivedCaptureKitManifestSha256 !== record.bindings.currentSchemaCaptureKitManifestSha256
    ) throw new Error(`source-driven branch current-v3 archived/current-schema manifest identities differ: ${recordPath}`);
    const runtime = record.bindings?.runtime;
    assertExactObjectKeys(runtime, [
      "runtimeId", "name", "version", "requestedAppPath", "appPath", "executablePath", "executableSha256",
    ], "source-driven branch runtime");
    if (
      runtime.runtimeId !== APPROVED_SOURCE_DRIVEN_RUNTIME.runtimeId || runtime.name !== APPROVED_SOURCE_DRIVEN_RUNTIME.name ||
      runtime.version !== APPROVED_SOURCE_DRIVEN_RUNTIME.version ||
      runtime.executableSha256 !== APPROVED_SOURCE_DRIVEN_RUNTIME.executableSha256 ||
      !path.isAbsolute(runtime.requestedAppPath || "") || !path.isAbsolute(runtime.appPath || "") ||
      !path.isAbsolute(runtime.executablePath || "")
    ) throw new Error(`source-driven branch runtime identity is invalid: ${recordPath}`);
    assertSha256(runtime.executableSha256, "source-driven branch runtime executable");
    assertExactObjectKeys(sidecar, [
      "schemaVersion", "artifactType", "status", "animationId", "requirementId", "archiveRecord", "archivedKit",
      "strictAcceptanceEffect", "migrationStatusChanged", "humanReviewRecorded", "ownerReviewRecorded",
    ], "source-driven branch stale archive integrity sidecar");
    assertExactObjectKeys(sidecar.archiveRecord, ["file", "sha256"], "source-driven branch sidecar archive-record binding");
    assertExactObjectKeys(sidecar.archivedKit, ["root", "algorithm", "sha256", "fileCount", "inventory"], "source-driven branch sidecar archived kit");
    if (
      record.archivedTree?.algorithm !== SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM ||
      record.archivedTree?.fileCount !== expectedCount
    ) throw new Error(`source-driven branch archived tree contract differs: ${recordPath}`);
    const treeSha256 = assertSha256(record.archivedTree?.sha256, "source-driven branch archived tree");
    if (location.slot !== treeSha256) throw new Error(`source-driven branch archive slot name differs: ${recordPath}`);

    if (
      sidecar.schemaVersion !== 1 || sidecar.artifactType !== "source-driven-branch-unsigned-template-full-tree-integrity" ||
      sidecar.status !== "append-only-integrity-binding-not-evidence" || sidecar.animationId !== record.animationId ||
      sidecar.requirementId !== record.requirementId || sidecar.archiveRecord?.file !== "archive-record.json" ||
      sidecar.archiveRecord?.sha256 !== digest(recordBytes) || sidecar.archivedKit?.root !== "kit" ||
      sidecar.archivedKit?.algorithm !== SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM ||
      sidecar.archivedKit?.sha256 !== treeSha256 || sidecar.archivedKit?.fileCount !== expectedCount ||
      sidecar.strictAcceptanceEffect !== false || sidecar.migrationStatusChanged !== false ||
      sidecar.humanReviewRecorded !== false || sidecar.ownerReviewRecorded !== false
    ) throw new Error(`source-driven branch stale archive record/sidecar identity differs: ${sidecarPath}`);
    const declared = normalizeInventory(sidecar.archivedKit.inventory, "bytes", "source-driven branch stale archive");
    if (declared.length !== expectedCount) throw new Error(`source-driven branch stale archive must contain exactly 23 or 27 kit files: ${sidecarPath}`);
    const kitRoot = path.join(location.slotRoot, "kit");
    const actual = await inspectKitInventory(kitRoot, {requiredMode: 0o444, requireSingleLink: true});
    assertSameInventory(actual, declared, `source-driven branch stale archive ${location.animationId}/${location.safeId}`);
    const derivedTreeSha256 = digest(Buffer.from(canonicalJson(actual)));
    if (derivedTreeSha256 !== treeSha256) throw new Error(`source-driven branch stale archive tree SHA-256 cannot be reproduced: ${sidecarPath}`);
    const manifest = actual.find(({file}) => file === "kit-manifest.json");
    if (!manifest || manifest.sha256 !== record.bindings.archivedCaptureKitManifestSha256) {
      throw new Error(`source-driven branch archived kit-manifest identity differs: ${recordPath}`);
    }
    const validatedKit = await validateSourceDrivenArchivedKit({
      kitRoot,
      actual,
      record,
      label: `source-driven branch stale archive ${location.animationId}/${location.safeId}`,
    });
    if (
      record.traceSpecDriftProof?.indexDrift?.kind ===
        RECONSTRUCTED_TRACE_SPEC_INDEX_CASCADE_KIND
    ) {
      validateReconstructedTraceSpecIndexCascade({
        proof: record.traceSpecDriftProof,
        record,
        archivedTraceSpec: validatedKit.archivedTraceSpec,
        archivedTraceSpecIndex: validatedKit.archivedTraceSpecIndex,
        label: `source-driven branch stale archive ${location.animationId}/${location.safeId}`,
      });
    }
    await assertSlotFileSet(location.slotRoot, [
      "archive-record.json",
      SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE,
      ...actual.map(({file}) => `kit/${file}`),
    ], "source-driven branch stale archive");
    results.push({
      animationId: record.animationId,
      requirementId: record.requirementId,
      templateVariant: record.templateVariant,
      fileCount: expectedCount,
      treeSha256,
      treeAlgorithm: SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM,
      traceSpecSha256: record.bindings.traceSpec.sha256,
      traceSpecIndexSha256: record.bindings.traceSpecIndex.sha256,
      runtimeExecutableSha256: runtime.executableSha256,
    });
  }
  return results;
}

export async function validateCaptureKitStaleArchives({projectRoot = PROJECT_ROOT} = {}) {
  const root = path.resolve(projectRoot);
  const [rootArchives, naturalArchives, sourceDrivenBranchArchives] = await Promise.all([
    validateRootArchives(root),
    validateNaturalArchives(root),
    validateSourceDrivenBranchArchives(root),
  ]);
  return {
    status: "verified-append-only-stale-unsigned-template-archives",
    rootArchiveCount: rootArchives.length,
    naturalArchiveCount: naturalArchives.length,
    sourceDrivenBranchArchiveCount: sourceDrivenBranchArchives.length,
    totalArchiveCount: rootArchives.length + naturalArchives.length + sourceDrivenBranchArchives.length,
    rootArchives,
    naturalArchives,
    sourceDrivenBranchArchives,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
}

export function parseArguments(argv) {
  const options = {projectRoot: PROJECT_ROOT, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--project-root") {
      const candidate = argv[index + 1];
      if (!candidate || candidate.startsWith("--")) throw new Error("--project-root requires a value");
      options.projectRoot = path.resolve(candidate);
      index += 1;
    } else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export function usage() {
  return `Usage: node scripts/validate-capture-kit-stale-archives.mjs [--project-root <path>]\n\nValidates immutable root, natural-trace, and source-driven branch stale unsigned-template\narchives, including byte/hash/mode inventories, directory tree identities, and integrity\nsidecars. A missing source-driven archive root is reported as zero archives.\nIt never writes evidence, migrations, source assets, review, status, or acceptance.\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  process.stdout.write(`${JSON.stringify(await validateCaptureKitStaleArchives(options), null, 2)}\n`);
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
