#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, mkdir, open, readFile, realpath, readdir, rmdir, stat, unlink} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {canonicalJson, safeRequirementId} from "./build-course-trace-specs.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {assertStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";
import {
  ROOT_CAPTURE_RASTERIZATION_RULE,
  assertRootTraceNativeStage,
  assertRootTraceSpecIndex,
  rootTraceCaptureRaster,
  rootTraceSpecFamily,
} from "./lib/root-trace-spec-contract.mjs";
import {
  CAPTURE_SESSION_ATTESTATION_STATEMENT,
  CAPTURE_SESSION_AUTHORITY_NOTE,
  DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
  ROOT_CAPTURE_TEMPLATE_STATUS,
  ROOT_PROJECTOR_LAUNCH_PROTOCOL,
  ROOT_SOURCE_OPEN_MENU_PATH,
  ROOT_SOURCE_OPEN_METHOD,
  ROOT_SOURCE_OPEN_START_STATEMENT,
  ROOT_SOURCE_OPEN_STATEMENT,
  requirementIdentity,
  rootCaptureV3ProtocolManifest,
  specIdentity,
} from "./prepare-root-capture-candidate.mjs";
import {
  DEFAULT_PROJECTOR_APP,
  inspectProjectorRuntime,
  sha256File,
  verifyProjectorRuntimeBinding,
} from "./scaffold-audio-runtime-session-kit.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const READY_STATUS = "source-frame-accurate-root-ready-for-authoritative-capture";
const EXPECTED_READY_COUNT = 18;
const LESSON_RELEASE_TRACE_SPEC_INDEX_ROOT =
  "migrations/lesson-release-trace-spec-indexes";
const LESSON_RELEASE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,127}$/u;
const ROOT_REQUIREMENT_LANGUAGES = Object.freeze(["en", "es"]);
const ROOT_CAPTURE_STALE_ARCHIVE_ROOT = "work/root-capture-kit-stale-archive";
const ARCHIVE_INVENTORY_FILE = "archive-record.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
let nodeExecutableSha256Promise;
let refreshTransactionSequence = 0;

export {
  DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
  ROOT_CAPTURE_STALE_ARCHIVE_ROOT,
  ROOT_CAPTURE_TEMPLATE_STATUS,
  ROOT_PROJECTOR_LAUNCH_PROTOCOL,
  ROOT_SOURCE_OPEN_MENU_PATH,
  ROOT_SOURCE_OPEN_METHOD,
  ROOT_SOURCE_OPEN_STATEMENT,
};

function portable(value) {
  return value.split(path.sep).join("/");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonl(value) {
  return `${JSON.stringify(value)}\n`;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function captureKitProtocol(protocolV3 = false) {
  if (typeof protocolV3 !== "boolean") throw new Error("protocolV3 must be a boolean");
  return {
    protocolV3,
    version: protocolV3 ? 3 : 2,
    outputRootRelative: protocolV3 ? DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT : DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  };
}

async function nodeExecutableBinding() {
  nodeExecutableSha256Promise ||= sha256File(process.execPath);
  return {path: process.execPath, sha256: await nodeExecutableSha256Promise};
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertPortableProjectRelative(declared, label) {
  assertString(declared, label);
  if (
    path.isAbsolute(declared) || declared.includes("\\") || declared === ".." || declared.startsWith("../") ||
    portable(path.normalize(declared)) !== declared
  ) throw new Error(`${label} must be a normalized portable project-relative path`);
  return declared;
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
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

async function assertNoSymlinkComponents(root, candidate, label) {
  const absoluteRoot = path.resolve(root);
  const absoluteCandidate = path.resolve(candidate);
  if (!isInside(absoluteCandidate, absoluteRoot)) throw new Error(`${label} escapes the project root`);
  if ((await lstat(absoluteRoot)).isSymbolicLink()) throw new Error(`${label} project root must not be a symbolic link`);
  let current = absoluteRoot;
  for (const component of path.relative(absoluteRoot, absoluteCandidate).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    if (info.isSymbolicLink()) {
      throw new Error(`${label} contains forbidden symbolic-link component ${portable(path.relative(absoluteRoot, current))}`);
    }
  }
}

async function captureDirectoryIdentity(root, directory, label) {
  await assertNoSymlinkComponents(root, directory, label);
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`${label} must be a real directory`);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const confirmed = await lstat(directory);
  if (
    !confirmed.isDirectory() || confirmed.isSymbolicLink() ||
    !sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info))
  ) throw new Error(`${label} identity changed while it was being inspected`);
  if (actualDirectory !== path.resolve(actualRoot, path.relative(root, directory))) {
    throw new Error(`${label} resolves outside its fixed path`);
  }
  return {node: nodeIdentity(confirmed), mode: permissionMode(confirmed), realPath: actualDirectory};
}

async function assertDirectoryIdentity(root, directory, expected, label) {
  const observed = await captureDirectoryIdentity(root, directory, label);
  if (observed.realPath !== expected.realPath || !sameNodeIdentity(observed.node, expected.node)) {
    throw new Error(`${label} identity changed during the transaction`);
  }
  return observed;
}

async function ensureFixedDirectoryTree(root, directory, label) {
  const absoluteRoot = path.resolve(root);
  const absoluteDirectory = path.resolve(directory);
  if (!isInside(absoluteDirectory, absoluteRoot)) throw new Error(`${label} escapes the project root`);
  let cursor = absoluteRoot;
  let parentIdentity = await captureDirectoryIdentity(root, cursor, `${label} project root`);
  for (const part of path.relative(absoluteRoot, absoluteDirectory).split(path.sep).filter(Boolean)) {
    await assertDirectoryIdentity(root, cursor, parentIdentity, `${label} parent`);
    cursor = path.join(cursor, part);
    const existing = await lstatIfPresent(cursor);
    if (!existing) await mkdir(cursor, {recursive: false, mode: 0o755});
    else if (!existing.isDirectory() || existing.isSymbolicLink()) {
      throw new Error(`${label} component is not a real directory: ${portable(path.relative(root, cursor))}`);
    }
    const childIdentity = await captureDirectoryIdentity(root, cursor, `${label} component`);
    await assertDirectoryIdentity(root, path.dirname(cursor), parentIdentity, `${label} parent`);
    parentIdentity = childIdentity;
  }
  return {path: absoluteDirectory, identity: parentIdentity};
}

async function captureRegularFile(root, candidate, label, {
  expectedSha256,
  expectedMode,
  expectedNode,
  requireSingleLink = true,
} = {}) {
  await assertNoSymlinkComponents(root, candidate, label);
  const info = await lstat(candidate);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} must be a regular non-symbolic-link file`);
  if (requireSingleLink && info.nlink !== 1) throw new Error(`${label} must not be hard-linked`);
  const bytes = await readFile(candidate);
  const sha256 = digest(bytes);
  if (expectedSha256 !== undefined && sha256 !== expectedSha256) throw new Error(`${label} SHA-256 changed`);
  if (expectedMode !== undefined && permissionMode(info) !== expectedMode) throw new Error(`${label} mode changed`);
  if (expectedNode !== undefined && !sameNodeIdentity(nodeIdentity(info), expectedNode)) throw new Error(`${label} inode changed`);
  const confirmed = await lstat(candidate);
  if (
    !confirmed.isFile() || confirmed.isSymbolicLink() ||
    !sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)) ||
    confirmed.size !== info.size || permissionMode(confirmed) !== permissionMode(info) || confirmed.nlink !== info.nlink
  ) throw new Error(`${label} identity changed while it was being inspected`);
  return {
    node: nodeIdentity(confirmed),
    sha256,
    mode: permissionMode(confirmed),
    bytes: confirmed.size,
    nlink: confirmed.nlink,
  };
}

async function writeOwnedExclusive({root, parent, parentIdentity, candidate, bytes, mode, label, registerOwnership}) {
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await assertNoSymlinkComponents(root, candidate, label);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(candidate, flags, mode);
  let ownership;
  try {
    const initial = await handle.stat();
    ownership = {node: nodeIdentity(initial), sha256: null, mode: permissionMode(initial), bytes: 0};
    registerOwnership?.(ownership);
    await handle.writeFile(bytes);
    await handle.chmod(mode);
    await handle.sync();
    const confirmed = await handle.stat();
    if (!sameNodeIdentity(nodeIdentity(confirmed), ownership.node)) throw new Error(`${label} inode changed while it was open`);
    ownership.sha256 = digest(bytes);
    ownership.mode = mode;
    ownership.bytes = Buffer.byteLength(bytes);
  } finally {
    await handle.close();
  }
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await captureRegularFile(root, candidate, label, {
    expectedSha256: ownership.sha256,
    expectedMode: ownership.mode,
    expectedNode: ownership.node,
    requireSingleLink: true,
  });
  return ownership;
}

async function removeOwnedFileIfUnchanged(candidate, ownership) {
  try {
    if (!ownership?.sha256) return false;
    const info = await lstatIfPresent(candidate);
    if (!info?.isFile() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.node)) return false;
    if (permissionMode(info) !== ownership.mode || info.nlink !== 1 || digest(await readFile(candidate)) !== ownership.sha256) return false;
    await unlink(candidate);
    return true;
  } catch {
    return false;
  }
}

async function removeOwnedEmptyDirectory(directory, ownership) {
  try {
    const info = await lstatIfPresent(directory);
    if (!info?.isDirectory() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.node)) return false;
    if ((await readdir(directory)).length !== 0) return false;
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function resolveProjectFile(root, declared, label) {
  assertPortableProjectRelative(declared, label);
  const candidate = path.resolve(root, declared);
  await assertNoSymlinkComponents(root, candidate, label);
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

function validateReadyRootSpec(spec) {
  const family = rootTraceSpecFamily(spec, "--spec");
  if (
    spec?.schemaVersion !== 1 ||
    spec?.traceSpecStatus !== READY_STATUS || spec?.traceModel?.kind !== "frame-accurate-root-exhaustive" ||
    spec?.traceModel?.naturalPlaybackClaimed !== false || spec?.schedule?.status !== "not-required-frame-accurate-root" ||
    (spec?.schedule?.orderedSteps || []).length !== 0 || spec?.frameDomain?.kind !== "root" ||
    spec?.frameDomain?.id !== spec?.identity?.frameDomainId ||
    spec?.identity?.baselineAuthorityRequirement !== "original-runtime-frame-accurate"
  ) throw new Error("--spec must be an exact current indexed ready frame-accurate root trace specification");
  const {firstFrame, lastFrame} = spec.identity.requiredRange || {};
  if (firstFrame !== 1 || lastFrame !== spec.frameDomain.frameCount || !Number.isInteger(lastFrame) || lastFrame < 1) {
    throw new Error("root trace specification must exhaust one-indexed frames 1..N");
  }
  const plan = spec.schedule.exhaustiveFrameCapturePlan;
  if (plan?.indexing !== "one-indexed" || plan?.firstFrame !== 1 || plan?.lastFrame !== lastFrame || plan?.frameCount !== lastFrame) {
    throw new Error("root trace specification exhaustive frame plan differs from its required range");
  }
  assertRootTraceNativeStage(spec, family, "--spec");
  const proofModes = spec.traceModel.positioningProofModes || [];
  if (
    !proofModes.includes("direct-seek-root-exhaustive") ||
    !proofModes.includes("sequential-step-root-exhaustive")
  ) throw new Error("root trace specification does not declare both accepted frame-positioning proof modes");
}

async function loadTraceSpecIndex(root, family) {
  const indexPath = await resolveProjectFile(root, family.indexFile, "trace-spec index");
  const document = await readJsonDocument(indexPath, "trace-spec index");
  assertRootTraceSpecIndex(document.value, family);
  return {...document, path: indexPath};
}

function traceSpecIndexContext({specRelative, spec, family, safeId}) {
  const pilotSpec = `migrations/${spec.animationId}/audit/trace-specs/${safeId}.json`;
  if (specRelative === pilotSpec) {
    return Object.freeze({
      kind: "pilot",
      indexFile: family.indexFile,
      releaseId: null,
    });
  }

  const releaseMatch = specRelative.match(
    /^migrations\/([^/]+)\/audit\/trace-specs\/lesson-releases\/([^/]+)\/([^/]+)\.json$/u,
  );
  if (
    releaseMatch?.[1] === spec.animationId &&
    releaseMatch?.[3] === safeId &&
    /^[a-z0-9][a-z0-9-]{2,127}$/u.test(releaseMatch?.[2] || "")
  ) {
    const releaseId = releaseMatch[2];
    return Object.freeze({
      kind: "lesson-release",
      indexFile: `${LESSON_RELEASE_TRACE_SPEC_INDEX_ROOT}/${releaseId}.json`,
      releaseId,
    });
  }

  throw new Error(
    `--spec must use its canonical indexed path ${pilotSpec} or a canonical lesson-release path for the same animation and requirement`,
  );
}

async function loadBoundTraceSpecIndex(root, family, context) {
  if (context.kind === "pilot") return loadTraceSpecIndex(root, family);
  const indexPath = await resolveProjectFile(
    root,
    context.indexFile,
    "lesson-release trace-spec index",
  );
  const document = await readJsonDocument(
    indexPath,
    "lesson-release trace-spec index",
  );
  if (
    document.value?.schemaVersion !== 1 ||
    document.value?.artifactType !==
      "lesson-release-original-runtime-trace-spec-index" ||
    document.value?.releaseSelection?.releaseId !== context.releaseId ||
    !Array.isArray(document.value?.members)
  ) {
    throw new Error(
      "lesson-release trace-spec index is not the exact indexed release schema",
    );
  }
  return {...document, path: indexPath};
}

async function validateLessonReleaseCatalogBinding({root, spec, index, context}) {
  if (context.kind !== "lesson-release") return;
  const specBinding = spec.sourceBindings?.lessonReleaseCatalog;
  const indexBinding = index.value?.releaseCatalog;
  if (
    !specBinding ||
    !indexBinding ||
    canonicalJson(specBinding) !== canonicalJson(indexBinding) ||
    specBinding.path !== "catalog/lesson-releases.json" ||
    specBinding.releaseId !== context.releaseId ||
    specBinding.schemaVersion !== 1 ||
    !Number.isInteger(specBinding.bytes) ||
    specBinding.bytes < 1 ||
    !/^[0-9a-f]{64}$/u.test(specBinding.sha256 || "") ||
    !/^[0-9a-f]{64}$/u.test(specBinding.releaseFingerprintSha256 || "") ||
    !/^[0-9a-f]{64}$/u.test(specBinding.orderedMemberIdentitySha256 || "")
  ) {
    throw new Error(
      "lesson-release trace spec and index do not share one exact catalog release binding",
    );
  }
  const catalogPath = await resolveProjectFile(
    root,
    specBinding.path,
    "lesson-release catalog",
  );
  const catalog = await readJsonDocument(catalogPath, "lesson-release catalog");
  if (
    catalog.sha256 !== specBinding.sha256 ||
    catalog.bytes.length !== specBinding.bytes ||
    catalog.value?.schemaVersion !== specBinding.schemaVersion ||
    !Array.isArray(catalog.value?.releases) ||
    catalog.value.releases.filter(({releaseId}) => releaseId === context.releaseId).length !== 1
  ) {
    throw new Error("lesson-release catalog binding is stale or ambiguous");
  }
  const memberIds = (index.value.members || []).map(({animationId}) => animationId);
  if (
    memberIds.some((animationId) => typeof animationId !== "string") ||
    new Set(memberIds).size !== memberIds.length
  ) {
    throw new Error("lesson-release trace-spec index contains duplicate or invalid animation members");
  }
}

export async function listReadyRootSpecs({projectRoot = PROJECT_ROOT} = {}) {
  const root = path.resolve(projectRoot);
  const family = rootTraceSpecFamily({artifactType: "course-pilot-original-runtime-trace-specification"});
  const index = await loadTraceSpecIndex(root, family);
  const specs = [];
  for (const pilot of index.value.pilots) {
    for (const item of pilot.traceSpecs || []) {
      if (item.status !== READY_STATUS) continue;
      if (item.traceModel !== "frame-accurate-root-exhaustive" || item.frameDomainId !== "root") {
        throw new Error("ready root index entry has an unexpected trace model or frame domain");
      }
      specs.push({animationId: pilot.animationId, requirementId: item.requirementId, file: item.file, sha256: item.sha256});
    }
  }
  specs.sort((left, right) => `${left.animationId}:${left.requirementId}`.localeCompare(`${right.animationId}:${right.requirementId}`));
  if (specs.length !== EXPECTED_READY_COUNT) {
    throw new Error(`--all-ready requires the reviewed set of ${EXPECTED_READY_COUNT} ready root specs; found ${specs.length}`);
  }
  return {index, specs};
}

export async function listReadyLessonReleaseRootSpecs({
  projectRoot = PROJECT_ROOT,
  releaseId,
} = {}) {
  if (!LESSON_RELEASE_ID_PATTERN.test(releaseId || "")) {
    throw new Error("--lesson-release must be a normalized lesson release id");
  }
  const root = path.resolve(projectRoot);
  const indexFile = `${LESSON_RELEASE_TRACE_SPEC_INDEX_ROOT}/${releaseId}.json`;
  const indexPath = await resolveProjectFile(root, indexFile, "lesson-release trace-spec index");
  const index = await readJsonDocument(indexPath, "lesson-release trace-spec index");
  const value = index.value;
  if (
    value?.schemaVersion !== 1 ||
    value?.artifactType !== "lesson-release-original-runtime-trace-spec-index" ||
    value?.releaseSelection?.releaseId !== releaseId ||
    value?.releaseSelection?.fullAtomicReleaseSelected !== true ||
    !Array.isArray(value?.members) ||
    value.memberCount !== value.members.length ||
    value.releaseSelection.atomicReleaseMemberCount !== value.members.length ||
    value.releaseSelection.selectedMemberCount !== value.members.length
  ) {
    throw new Error("lesson-release reconcile requires one exact complete atomic release index");
  }
  const seenAnimations = new Set();
  const seenOrdinals = new Set();
  const specs = [];
  for (const member of value.members) {
    const {animationId} = member || {};
    const ordinal = member?.releaseMembership?.ordinal;
    if (
      typeof animationId !== "string" || !animationId || seenAnimations.has(animationId) ||
      !Number.isInteger(ordinal) || ordinal < 1 || seenOrdinals.has(ordinal)
    ) {
      throw new Error("lesson-release reconcile index has duplicate or invalid member identity/order");
    }
    seenAnimations.add(animationId);
    seenOrdinals.add(ordinal);
    const roots = (member.traceSpecs || []).filter((item) =>
      item?.status === READY_STATUS &&
      item?.traceModel === "frame-accurate-root-exhaustive" &&
      item?.frameDomainId === "root"
    );
    if (roots.length !== ROOT_REQUIREMENT_LANGUAGES.length) {
      throw new Error(`${animationId}: lesson-release reconcile requires exactly one EN and one ES ready root spec`);
    }
    for (const language of ROOT_REQUIREMENT_LANGUAGES) {
      const matches = roots.filter((item) =>
        item.language === language &&
        item.requirementId === `req-default-root-${language}`
      );
      if (matches.length !== 1) {
        throw new Error(`${animationId}: lesson-release reconcile root language/requirement identity is incomplete or ambiguous`);
      }
      const item = matches[0];
      const expectedFile = `migrations/${animationId}/audit/trace-specs/lesson-releases/${releaseId}/${safeRequirementId(item.requirementId)}.json`;
      if (item.file !== expectedFile || !SHA256_PATTERN.test(item.sha256 || "")) {
        throw new Error(`${animationId}/${language}: lesson-release reconcile root spec path/hash is invalid`);
      }
      specs.push({
        animationId,
        ordinal,
        language,
        requirementId: item.requirementId,
        file: item.file,
        sha256: item.sha256,
      });
    }
  }
  specs.sort((left, right) =>
    left.ordinal - right.ordinal ||
    ROOT_REQUIREMENT_LANGUAGES.indexOf(left.language) - ROOT_REQUIREMENT_LANGUAGES.indexOf(right.language)
  );
  if (
    specs.length !== value.members.length * ROOT_REQUIREMENT_LANGUAGES.length ||
    value.frameAccurateRootReadyCount !== specs.length ||
    value.readyTraceCount !== specs.length
  ) {
    throw new Error("lesson-release reconcile root-ready totals differ from the exact two-language atomic scope");
  }
  return {index: {...index, path: indexPath}, indexFile, specs};
}

async function loadBoundRootSpec({projectRoot, specFile}) {
  const root = path.resolve(projectRoot);
  const specRelative = assertPortableProjectRelative(specFile, "--spec");
  const specPath = await resolveProjectFile(root, specRelative, "--spec");
  const specDocument = await readJsonDocument(specPath, "trace specification");
  const spec = specDocument.value;
  validateReadyRootSpec(spec);
  const family = rootTraceSpecFamily(spec);
  const captureRaster = rootTraceCaptureRaster(spec, family, "--spec");
  const safeId = safeRequirementId(spec.requirementId);
  const indexContext = traceSpecIndexContext({
    specRelative,
    spec,
    family,
    safeId,
  });

  const workspace = path.join(root, "migrations", spec.animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const [manifestDocument, coverageDocument, inventoryDocument, index] = await Promise.all([
    readJsonDocument(manifestPath, "migration manifest"),
    readJsonDocument(coveragePath, "full-frame coverage"),
    readJsonDocument(inventoryPath, "scenario inventory"),
    loadBoundTraceSpecIndex(root, family, indexContext),
  ]);
  const manifest = manifestDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  await validateLessonReleaseCatalogBinding({
    root,
    spec,
    index,
    context: indexContext,
  });
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
      `${spec.animationId}/${spec.requirementId} root original-runtime kit`,
    );
  }
  if (requirements.length !== 1 || canonicalJson(requirementIdentity(requirements[0])) !== canonicalJson(specIdentity(spec))) {
    throw new Error("trace specification identity differs from the unique current coverage requirement");
  }
  if (
    manifest.source?.swf !== spec.sourceBindings?.sourceSwf?.path ||
    manifest.source?.swfSha256 !== spec.sourceBindings?.sourceSwf?.sha256 ||
    manifest.runtime?.stage?.width !== spec.frameDomain.nativeStage.width ||
    manifest.runtime?.stage?.height !== spec.frameDomain.nativeStage.height ||
    manifest.runtime?.fps !== spec.frameDomain.fps || manifest.runtime?.frameCount !== spec.frameDomain.frameCount
  ) throw new Error("trace specification source/runtime binding differs from migration.json");
  const indexedMembers = (
    indexContext.kind === "lesson-release"
      ? index.value.members
      : index.value.pilots
  ).filter(({animationId}) => animationId === spec.animationId);
  if (indexedMembers.length !== 1) {
    throw new Error("trace-spec index must contain exactly one matching animation member");
  }
  const indexedMember = indexedMembers[0];
  const indexed = (indexedMember?.traceSpecs || []).filter(
    ({requirementId}) => requirementId === spec.requirementId,
  );
  const expectedExecution = `migrations/${spec.animationId}/${spec.executionEvidence?.expectedExecutionReportPath || ""}`;
  if (
    indexed.length !== 1 || indexed[0].file !== specRelative || indexed[0].sha256 !== specDocument.sha256 ||
    indexed[0].status !== READY_STATUS || indexed[0].traceModel !== spec.traceModel.kind ||
    indexed[0].expectedExecutionReport !== expectedExecution
  ) throw new Error("trace specification is not the exact current indexed ready root specification");

  const sourcePath = await resolveProjectFile(root, manifest.source.swf, "bound source SWF");
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const [actualSource, actualPreserved] = await Promise.all([realpath(sourcePath), realpath(preservedRoot)]);
  if (!isInside(actualSource, actualPreserved)) throw new Error("bound source SWF is outside the preserved HELP Math archive");
  const sourceBytes = await readFile(sourcePath);
  const sourceSha256 = digest(sourceBytes);
  if (sourceSha256 !== manifest.source.swfSha256) throw new Error("bound source SWF SHA-256 is stale");

  return {
    root,
    workspace,
    spec,
    specRelative,
    specSha256: specDocument.sha256,
    safeId,
    sourcePath,
    sourceBytes,
    sourceSha256,
    indexSha256: index.sha256,
    captureRaster,
    bindings: {
      traceSpec: {file: specRelative, sha256: specDocument.sha256},
      traceSpecIndex: {file: indexContext.indexFile, sha256: index.sha256},
      sourceSwf: {file: manifest.source.swf, sha256: sourceSha256, bytes: sourceBytes.length},
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
    templateStatus: ROOT_CAPTURE_TEMPLATE_STATUS,
    notEvidence: true,
    recordKind,
    expectedCompletedRecordCount: expectedCount,
    bindings,
    requiredFields,
    invariants,
    statement: "This line describes a future same-session record schema. It is not an observed runtime event and must never be supplied to the candidate preparer.",
  };
}

function captureRasterDiffersFromNativeStage(bound) {
  return (
    bound.captureRaster.width !== bound.spec.frameDomain.nativeStage.width ||
    bound.captureRaster.height !== bound.spec.frameDomain.nativeStage.height
  );
}

function operatorCardV2({bound, stagedSource, runtime}) {
  const {spec} = bound;
  const {width, height} = spec.frameDomain.nativeStage;
  const fractionalRaster = captureRasterDiffersFromNativeStage(bound);
  const geometryLines = fractionalRaster
    ? `- Source-native stage: ${width}×${height} at ${spec.frameDomain.fps} FPS\n- Required lossless PNG raster: ${bound.captureRaster.width}×${bound.captureRaster.height} via \`${bound.captureRaster.rule}\``
    : `- Native capture: ${width}×${height} at ${spec.frameDomain.fps} FPS`;
  const pngDescription = fractionalRaster
    ? `exact ${bound.captureRaster.width}×${bound.captureRaster.height} lossless PNG while preserving the ${width}×${height} source-native stage declaration`
    : "exact native-size lossless PNG";
  return `# Root capture operator card

Status: **unsigned template only — not original-runtime evidence**

## Hash-bound identity

- Animation: \`${spec.animationId}\`
- Requirement: \`${spec.requirementId}\`
- Language: \`${spec.identity.language}\`
- Trace spec: \`${bound.specRelative}\`
- Trace spec SHA-256: \`${bound.specSha256}\`
- Preserved source SWF: \`${bound.bindings.sourceSwf.file}\`
- Source/staged SWF SHA-256: \`${bound.sourceSha256}\`
- Staged File → Open File… selection: \`${stagedSource.file}\`
- Adobe Projector: \`${runtime.version}\`, executable SHA-256 \`${runtime.executableSha256}\`
- Root frames: 1–${spec.frameDomain.frameCount}, one-indexed
${geometryLines}

## Required two-stage session

1. Use a fresh named-human session in an authorized, disposable/offline environment. Save the JSON result of the kit \`--check\` outside this immutable kit.
2. Run \`sh launch-projector-empty.sh\`. The launcher verifies the exact kit and starts only an empty Projector process with **no SWF argument**. A PID or process window is not proof that a SWF opened.
3. In Projector, the named human must choose **File → Open File…** and select the exact staged SWF above. Do not use a command-line SWF argument, \`open\`, LaunchServices, Finder association, or the preserved \`source-assets/\` path. Record the real PID/start time, GUI-open time, staged path/hash, and observed Player content window in the launch receipt.
4. Confirm the exact requirement language \`${spec.identity.language}\` and root entry state. If the original runtime cannot establish or report it without a guessed host mutation, stop; do not reuse another language's frames.
5. Select one declared proof mode for the whole session:
   - \`direct-seek-root-exhaustive\`: perform exactly one explicit original-runtime seek for every frame 1–${spec.frameDomain.frameCount}; or
   - \`sequential-step-root-exhaustive\`: perform Rewind exactly once for frame 1, then Step Forward exactly once for each frame 2–${spec.frameDomain.frameCount}.
6. For every frame, record the requested and runtime-observed root frame, display-list state, monotonic/wall time, ${pngDescription}, and both append-only hash chains. No skipped, duplicate, reordered, inferred, implementation-derived, Ruffle-derived, or post-hoc record is allowed.
7. Store completed evidence outside this kit. The actual named operator fills and signs the real receipt and attestation after the same session; template files and schema lines remain non-evidence.
8. Run \`prepare-root-capture-candidate.mjs\` only with those real session artifacts, including the completed launch receipt via \`--launch-receipt <outside-kit-file>\`. The resulting package is still a pending human/owner candidate and proves only frame-accurate root visuals—not natural playback, interaction, scoring, audio, Replay, or acceptance.
`;
}

function operatorCardV3({bound, stagedSource, runtime}) {
  const {spec} = bound;
  const {width, height} = spec.frameDomain.nativeStage;
  const fractionalRaster = captureRasterDiffersFromNativeStage(bound);
  const geometryLines = fractionalRaster
    ? `- Source-native stage: ${width}×${height} at ${spec.frameDomain.fps} FPS\n- Required lossless PNG raster: ${bound.captureRaster.width}×${bound.captureRaster.height} via \`${bound.captureRaster.rule}\``
    : `- Native capture: ${width}×${height} at ${spec.frameDomain.fps} FPS`;
  const pngDescription = fractionalRaster
    ? `exact ${bound.captureRaster.width}×${bound.captureRaster.height} lossless PNG while preserving the ${width}×${height} source-native stage declaration`
    : "exact native-size lossless PNG";
  return `# Root capture operator card — acyclic protocol v3

Status: **unsigned template only — not original-runtime evidence and not operator-ready**

This kit does not establish external named-operator authorization, an authorized disposable/offline environment preflight, a writable outside-kit session-output-root preflight, or a fresh storage-capacity preflight for this bounded session. All four must be completed and independently recorded before any runtime launch. Do not treat kit generation or \`--check\` as authorization.

The environment preflight must independently bind the exact host and stop conditions, outbound-network denial, one read-only hash-allowlisted local lesson tree, one disposable profile with an empty Flash SharedObject store, one SWF in one fresh player process, abort-on-unexpected-effect rules, a request audit, and disabled telemetry/JavaScript URLs/browser opens/\`fscommand\` effects/bookmark writes. The capacity preflight must run immediately before this bounded session and cover lossless PNGs, logs, manifests, comparisons, and archives.

## Hash-bound identity

- Animation: \`${spec.animationId}\`
- Requirement: \`${spec.requirementId}\`
- Language: \`${spec.identity.language}\`
- Trace spec: \`${bound.specRelative}\`
- Trace spec SHA-256: \`${bound.specSha256}\`
- Preserved source SWF: \`${bound.bindings.sourceSwf.file}\`
- Source/staged SWF SHA-256: \`${bound.sourceSha256}\`
- Staged File → Open File… selection: \`${stagedSource.file}\`
- Adobe Projector: \`${runtime.version}\`, executable SHA-256 \`${runtime.executableSha256}\`
- Root frames: 1–${spec.frameDomain.frameCount}, one-indexed
${geometryLines}

## Required one-way evidence DAG

1. Complete external named-operator authorization plus the full containment environment, outside-kit output-root, and fresh storage-capacity preflights for this bounded session. The capacity check must cover lossless PNGs, logs, manifests, comparisons, and archives immediately before launch. If any control is absent, unapproved, or unverified, stop: this kit is not operator-ready.
2. Save the JSON result of \`--protocol-v3 --check\` outside this immutable kit.
3. Run \`sh launch-projector-empty.sh\`. The launcher verifies this exact v3 kit and starts only an empty Projector process with **no SWF argument**.
4. The named human chooses **File → Open File…**, selects the exact staged SWF above, and confirms the Player content window. Record the real PID/start time, GUI-open time, staged path/hash, and observation.
5. Finalize and hash \`source-open-launch-receipt.json\` immediately. Its chronology must satisfy \`projector.startedAt <= sourceOpen.openedAt <= finalizedAt\`.
6. Complete and hash \`runtime-toolchain-receipt.json\`, binding the launch-receipt hash. Its \`capturedAt\` must satisfy \`launch.finalizedAt <= capturedAt\`.
7. Only after both hashes are fixed, set the final attestation's \`startedAt\` and begin frame work. Required order: \`toolchain.capturedAt <= attestation.startedAt <= first frame record\`. A launch or toolchain receipt created or revised after the first frame is forbidden and fails closed.
8. Confirm the exact requirement language \`${spec.identity.language}\` and root entry state. If the original runtime cannot establish or report it without a guessed host mutation, stop; do not reuse another language's frames.
9. Select one declared proof mode for the whole session:
   - \`direct-seek-root-exhaustive\`: perform exactly one explicit original-runtime seek for every frame 1–${spec.frameDomain.frameCount}; or
   - \`sequential-step-root-exhaustive\`: perform Rewind exactly once for frame 1, then Step Forward exactly once for each frame 2–${spec.frameDomain.frameCount}.
10. For every frame, record the requested and runtime-observed root frame, display-list state, monotonic/wall time, ${pngDescription}, and both append-only hash chains. Every record binds the already-final launch and toolchain hashes. No skipped, duplicate, reordered, inferred, implementation-derived, Ruffle-derived, or post-hoc record is allowed.
11. After all logs and the complete frame set are fixed, finish \`endedAt\`, \`signedAt\`, and the final attestation hash. The final attestation binds the complete logs and frame set; earlier receipts never bind future mutable artifacts.
12. Run \`prepare-root-capture-candidate.mjs\` only with those completed outside-kit artifacts. The result remains pending human/owner review and proves only the validated frame-accurate root-visual claim—not natural playback, interaction, scoring, audio, Replay, strict completion, owner acceptance, or publication.

Post-hoc launch/toolchain receipts are prohibited. Never edit an earlier receipt to accommodate later logs, frames, timestamps, signatures, or review decisions.
`;
}

function operatorCard({bound, stagedSource, runtime, protocolV3 = false}) {
  return protocolV3
    ? operatorCardV3({bound, stagedSource, runtime})
    : operatorCardV2({bound, stagedSource, runtime});
}

function readmeV2({bound}) {
  return `# Unsigned root-capture kit

This deterministic kit prepares \`${bound.spec.requirementId}\`. It binds the exact current indexed ready spec, preserved source SWF, byte-identical staged SWF, native stage/FPS/range, and Adobe Projector executable identity.

It contains no captured PNG, no runtime operation, no display-list observation, no human signature, and no owner decision. It never writes \`migrations/\`, \`source-assets/\`, coverage, status, reviews, or canonical baseline evidence.

Use \`OPERATOR_CARD.md\` as the session runbook. The launcher performs the first half of a two-stage contract only: it starts an empty Projector with no SWF argument. The named human performs **File → Open File…** and selects \`runtime-source/source.swf\`. Launcher output does not claim the SWF opened.

The following are templates/schema descriptions, not evidence:

- \`templates/runtime-toolchain-receipt.template.json\`
- \`templates/source-open-launch-receipt.template.json\`
- \`templates/capture-session-attestation.template.json\`
- \`templates/operation-log.schema.template.jsonl\`
- \`templates/display-list-states.schema.template.jsonl\`
- \`frames/README.md\`

Do not edit the kit in place. Write the machine-readable \`--check\` receipt and all real session artifacts into a separate session directory. The candidate preparer rejects files under \`${DEFAULT_ROOT_CAPTURE_KIT_ROOT}/\` and template/schema filenames.
`;
}

function readmeV3({bound}) {
  return `# Unsigned root-capture kit — acyclic protocol v3

This deterministic successor kit prepares \`${bound.spec.requirementId}\` under the parallel \`${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/\` root. It binds the exact current indexed ready spec, preserved source SWF, byte-identical staged SWF, native stage/FPS/range, and Adobe Projector executable identity.

It contains no captured PNG, runtime operation, display-list observation, human signature, operator authorization, environment/output-root/capacity preflight, or owner decision. It is **not operator-ready**. It never writes \`migrations/\`, \`source-assets/\`, coverage, status, reviews, or canonical baseline evidence.

The protocol is a one-way DAG: kit/check → named-human Projector start and source open → finalized schema-v3 start receipt → toolchain receipt bound to that launch hash → attestation \`startedAt\` and frame/log capture → final attestation bound to complete logs/frameSet/\`endedAt\`/\`signedAt\`. Launch and toolchain receipts must be complete and hash-known before the first frame. Post-hoc receipts or receipt rewrites are prohibited.

Use \`OPERATOR_CARD.md\` only after an external named operator is authorized and the full containment environment, outside-kit session-output root, and fresh storage capacity pass their separate preflights for the bounded session. Capacity must be rechecked immediately before every bounded session for lossless PNGs, logs, manifests, comparisons, and archives. The launcher starts an empty Projector with no SWF argument; the named human performs **File → Open File…** and selects \`runtime-source/source.swf\`. Launcher output does not claim the SWF opened.

The following are templates/schema descriptions, not evidence:

- \`templates/runtime-toolchain-receipt.template.json\`
- \`templates/source-open-launch-receipt.template.json\`
- \`templates/capture-session-attestation.template.json\`
- \`templates/operation-log.schema.template.jsonl\`
- \`templates/display-list-states.schema.template.jsonl\`
- \`frames/README.md\`

Do not edit the kit in place. Write the machine-readable \`--protocol-v3 --check\` receipt and all real session artifacts into a separate, preflighted session directory. The candidate preparer rejects both unsigned kit roots and all template/schema filenames.
`;
}

function readme({bound, protocolV3 = false}) {
  return protocolV3 ? readmeV3({bound}) : readmeV2({bound});
}

function sandboxProfile() {
  return `(version 1)\n(allow default)\n(deny network*)\n(deny appleevent-send)\n`;
}

function launcher({bound, runtime, stagedAbsolute, protocolV3 = false}) {
  const {outputRootRelative} = captureKitProtocol(protocolV3);
  const kitRoot = path.join(bound.root, outputRootRelative, bound.spec.animationId, bound.safeId);
  const protocolArgument = protocolV3 ? " --protocol-v3" : "";
  return `#!/bin/sh
set -eu
cd ${shellQuote(bound.root)}
${shellQuote(process.execPath)} ${shellQuote(SCRIPT_PATH)} --check --spec ${shellQuote(bound.specRelative)} --player-app ${shellQuote(runtime.appPath)}${protocolArgument} >/dev/null
cd ${shellQuote(path.join(kitRoot, "runtime-source"))}
printf '%s\\n' 'PROCESS LAUNCH ONLY — NOT SOURCE-OPEN EVIDENCE.' >&2
printf '%s\\n' 'After empty Projector starts, the named operator must use File -> Open File… and select:' >&2
printf '%s\\n' ${shellQuote(stagedAbsolute)} >&2
# PROJECTOR_START_MODE=empty-no-swf-argument
# SOURCE_OPEN_MODE=named-human-gui-file-open
exec /usr/bin/sandbox-exec -f ${shellQuote(path.join(kitRoot, "sandbox.sb"))} ${shellQuote(runtime.executablePath)}
`;
}

export function assertEmptyProjectorLauncher(content, runtimeExecutablePath) {
  const lines = String(content).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const execLines = lines.filter((line) => line.startsWith("exec "));
  if (execLines.length !== 1) throw new Error("root launcher must contain exactly one final exec command");
  const finalLine = execLines[0];
  if (finalLine !== lines.at(-1)) throw new Error("root launcher Projector exec must be the final command");
  if (!finalLine.endsWith(shellQuote(runtimeExecutablePath))) {
    throw new Error("root launcher must exec only the bound empty Projector and must not pass a SWF argument");
  }
  if (/\.swf(?:['"\s]|$)/i.test(finalLine)) {
    throw new Error("root launcher must exec only the bound empty Projector and must not pass a SWF argument");
  }
  if (/\b(?:open|osascript)\b[^\n]*\.swf/i.test(finalLine) || !content.includes("PROJECTOR_START_MODE=empty-no-swf-argument")) {
    throw new Error("root launcher violates the named-human GUI File Open contract");
  }
}

function snapshotBoundFromManifest(root, manifest, sourceBytes) {
  const animationId = assertString(manifest?.animationId, "existing kit animationId");
  const requirementId = assertString(manifest?.requirementId, "existing kit requirementId");
  const safeId = safeRequirementId(requirementId);
  const nativeStage = manifest?.frameDomain?.nativeStage;
  const computedCaptureRaster = {
    rule: ROOT_CAPTURE_RASTERIZATION_RULE,
    width: Math.ceil(nativeStage?.width),
    height: Math.ceil(nativeStage?.height),
  };
  const captureRaster = manifest.captureRaster || computedCaptureRaster;
  if (
    canonicalJson(captureRaster) !== canonicalJson(computedCaptureRaster) ||
    (!Number.isInteger(nativeStage?.width) || !Number.isInteger(nativeStage?.height)) && !manifest.captureRaster
  ) {
    throw new Error("existing kit does not bind the deterministic native-stage capture raster");
  }
  return {
    root,
    safeId,
    captureRaster,
    specRelative: manifest.bindings.traceSpec.file,
    specSha256: manifest.bindings.traceSpec.sha256,
    sourceSha256: manifest.stagedSource.staged.sha256,
    sourceBytes,
    bindings: manifest.bindings,
    spec: {
      animationId,
      requirementId,
      identity: manifest.identity,
      frameDomain: manifest.frameDomain,
      traceModel: {positioningProofModes: manifest.acceptedProofModes},
    },
  };
}

export function renderUnsignedTemplateFiles({root, manifest, sourceBytes}) {
  const bound = snapshotBoundFromManifest(root, manifest, sourceBytes);
  const protocolV3 = manifest?.evidenceProtocol?.schemaVersion === 3;
  const {outputRootRelative} = captureKitProtocol(protocolV3);
  if (protocolV3 && canonicalJson(manifest.evidenceProtocol) !== canonicalJson(rootCaptureV3ProtocolManifest())) {
    throw new Error("protocol-v3 manifest evidence DAG is invalid");
  }
  const runtime = manifest.runtime;
  const stagedSource = manifest.stagedSource.staged;
  const kitProjectRelative = portable(path.join(outputRootRelative, manifest.animationId, bound.safeId));
  const stagedAbsolute = path.join(root, kitProjectRelative, stagedSource.file);
  const identityRelative = "runtime/runtime-executable-sha256.txt";
  const identityProjectRelative = `${kitProjectRelative}/${identityRelative}`;
  const identityText = runtimeIdentityText(runtime);
  const sandbox = sandboxProfile();
  const launcherContent = launcher({bound, runtime, stagedAbsolute, protocolV3});
  assertEmptyProjectorLauncher(launcherContent, runtime.executablePath);
  const manifestBytes = Buffer.from(json(manifest));
  const manifestSha256 = digest(manifestBytes);
  const frameCount = manifest.frameDomain.frameCount;
  const toolchainReceipt = {
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime: {runtimeId: runtime.runtimeId, name: runtime.name, version: runtime.version},
    captureSessionBinding: {
      sessionId: "",
      traceSpecSha256: bound.specSha256,
      sourceSwfSha256: bound.sourceSha256,
      captureKitManifestSha256: manifestSha256,
      launchReceiptSha256: null,
    },
    capturedAt: null,
    identityArtifacts: [{kind: "executable-sha256-receipt", file: identityProjectRelative, sha256: digest(identityText)}],
  };
  const launchReceipt = {
    schemaVersion: protocolV3 ? 3 : 2,
    evidenceType: protocolV3
      ? "named-human-hash-bound-root-source-open-start-receipt"
      : "named-human-hash-bound-root-source-open-receipt",
    templateStatus: ROOT_CAPTURE_TEMPLATE_STATUS,
    notEvidence: true,
    sessionId: "",
    animationId: manifest.animationId,
    requirementId: manifest.requirementId,
    captureKit: {file: `${kitProjectRelative}/kit-manifest.json`, sha256: manifestSha256},
    runtime: {runtimeId: runtime.runtimeId, name: runtime.name, version: runtime.version, executableSha256: runtime.executableSha256},
    kitCheck: {file: null, sha256: null},
    launchProtocol: ROOT_PROJECTOR_LAUNCH_PROTOCOL,
    projectorStart: {executablePath: runtime.executablePath, swfArgument: null, processId: null, startedAt: null},
    sourceOpen: {
      method: ROOT_SOURCE_OPEN_METHOD,
      menuPath: [...ROOT_SOURCE_OPEN_MENU_PATH],
      selectedSource: stagedSource,
      openedAt: null,
      playerWindowObserved: null,
    },
    ...(protocolV3 ? {finalizedAt: null} : {endedAt: null}),
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    statement: protocolV3 ? ROOT_SOURCE_OPEN_START_STATEMENT : ROOT_SOURCE_OPEN_STATEMENT,
    receiptSha256: null,
  };
  const attestation = {
    schemaVersion: 1,
    evidenceType: "named-human-root-capture-session-attestation",
    sessionId: "",
    animationId: manifest.animationId,
    requirementId: manifest.requirementId,
    proofMode: null,
    traceSpec: bound.bindings.traceSpec,
    sourceSwf: {path: bound.bindings.sourceSwf.file, sha256: bound.sourceSha256},
    launchReceipt: {file: null, sha256: null},
    toolchainReceipt: {
      file: null,
      sha256: null,
      runtime: toolchainReceipt.runtime,
      captureSessionBinding: toolchainReceipt.captureSessionBinding,
    },
    operationLog: {file: null, sha256: null, finalEventSha256: null, eventCount: null},
    displayListRecords: {file: null, sha256: null, finalRecordSha256: null, recordCount: null},
    frameSet: {algorithm: "ordered-frame-path-sha256-v1", frameCount, frames: [], sha256: null},
    startedAt: null,
    endedAt: null,
    signedAt: null,
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    statement: CAPTURE_SESSION_ATTESTATION_STATEMENT,
    notes: CAPTURE_SESSION_AUTHORITY_NOTE,
    attestationSha256: null,
  };
  const schemaBindings = {
    animationId: manifest.animationId,
    requirementId: manifest.requirementId,
    traceSpecSha256: bound.specSha256,
    sourceSwfSha256: bound.sourceSha256,
    frameDomainId: manifest.frameDomain.id,
    language: manifest.identity.language,
    kitManifestSha256: manifestSha256,
    ...(captureRasterDiffersFromNativeStage(bound) ? {captureRaster: bound.captureRaster} : {}),
  };
  const operationSchema = recordSchemaTemplate({
    recordKind: "attested-root-frame-operation",
    expectedCount: frameCount,
    bindings: schemaBindings,
    requiredFields: [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
      "toolchainReceiptSha256", "sequence", "occurredAt",
      "monotonicTimeMs", "operator", "operation", "operationCountSincePrevious", "requestedRootFrame",
      "observedRootFrame", "screenshotFile", "screenshotSha256", "displayListRecordSha256",
      "previousEventSha256", "eventSha256",
    ],
    invariants: [
      "exactly one ordered record per root frame 1..N",
      "direct-seek for every frame, or Rewind at frame 1 plus exactly one Step Forward for every later frame",
      "requestedRootFrame equals runtime-observed root frame",
      "same named-human session/spec/source/toolchain identity and append-only SHA-256 chain",
    ],
  });
  const displayListSchema = recordSchemaTemplate({
    recordKind: "attested-display-list-state",
    expectedCount: frameCount,
    bindings: schemaBindings,
    requiredFields: [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
      "toolchainReceiptSha256", "sequence", "occurredAt",
      "monotonicTimeMs", "operator", "frameDomainId", "observedRootFrame", "displayListState",
      "displayListStateSha256", "screenshotSha256", "previousRecordSha256", "recordSha256",
    ],
    invariants: [
      "exactly one non-empty display-list state per ordered root frame",
      "state and operation identify the same frame/PNG/session instant",
      "contiguous append-only SHA-256 record chain",
    ],
  });
  return new Map([
    ["README.md", readme({bound, protocolV3})],
    ["OPERATOR_CARD.md", operatorCard({bound, stagedSource, runtime, protocolV3})],
    ["kit-manifest.json", manifestBytes],
    ["runtime-source/source.swf", sourceBytes],
    [identityRelative, identityText],
    ["templates/runtime-toolchain-receipt.template.json", json(toolchainReceipt)],
    ["templates/source-open-launch-receipt.template.json", json(launchReceipt)],
    ["templates/capture-session-attestation.template.json", json(attestation)],
    ["templates/operation-log.schema.template.jsonl", jsonl(operationSchema)],
    ["templates/display-list-states.schema.template.jsonl", jsonl(displayListSchema)],
    ["frames/README.md", `# Empty frame placeholder\n\nThis kit contains zero captured frames. Create a separate real session directory and capture exactly ${frameCount} lossless ${bound.captureRaster.width}×${bound.captureRaster.height} PNGs there. Files placed here make \`--check\` fail and are not evidence.\n`],
    ["sandbox.sb", sandbox],
    ["launch-projector-empty.sh", launcherContent],
  ]);
}

export async function buildRootCaptureKit({projectRoot = PROJECT_ROOT, specFile, runtime, protocolV3 = false}) {
  const protocol = captureKitProtocol(protocolV3);
  const bound = await loadBoundRootSpec({projectRoot, specFile});
  const normalizedRuntime = await verifyProjectorRuntimeBinding(runtime);
  if (
    normalizedRuntime.runtimeId !== "adobe-flash-player-projector" ||
    normalizedRuntime.name !== "Adobe Flash Player Projector"
  ) throw new Error("root capture kit requires Adobe Flash Player Projector");
  const kitProjectRelative = portable(path.join(protocol.outputRootRelative, bound.spec.animationId, bound.safeId));
  const stagedSource = {file: "runtime-source/source.swf", sha256: bound.sourceSha256, bytes: bound.sourceBytes.length};
  const stagedAbsolute = path.join(bound.root, kitProjectRelative, stagedSource.file);
  const identityRelative = "runtime/runtime-executable-sha256.txt";
  const identityProjectRelative = `${kitProjectRelative}/${identityRelative}`;
  const identityText = runtimeIdentityText(normalizedRuntime);
  const sandbox = sandboxProfile();
  const launcherContent = launcher({bound, runtime: normalizedRuntime, stagedAbsolute, protocolV3});
  assertEmptyProjectorLauncher(launcherContent, normalizedRuntime.executablePath);
  const nodeExecutable = await nodeExecutableBinding();
  const frameCount = bound.spec.frameDomain.frameCount;
  const fractionalCaptureRaster = captureRasterDiffersFromNativeStage(bound);
  const templateFiles = [
    "templates/runtime-toolchain-receipt.template.json",
    "templates/source-open-launch-receipt.template.json",
    "templates/capture-session-attestation.template.json",
    "templates/operation-log.schema.template.jsonl",
    "templates/display-list-states.schema.template.jsonl",
  ];
  const manifest = {
    schemaVersion: 1,
    artifactType: "root-frame-accurate-capture-operator-kit",
    ...(protocolV3 ? {evidenceProtocol: rootCaptureV3ProtocolManifest()} : {}),
    status: ROOT_CAPTURE_TEMPLATE_STATUS,
    notEvidence: true,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    identity: bound.spec.identity,
    frameDomain: bound.spec.frameDomain,
    ...(fractionalCaptureRaster ? {captureRaster: bound.captureRaster} : {}),
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
    stagedSource: {
      source: bound.bindings.sourceSwf,
      staged: stagedSource,
      copiedByteForByte: true,
      sourceAssetsLaunchedDirectly: false,
    },
    launchContract: {
      protocol: ROOT_PROJECTOR_LAUNCH_PROTOCOL,
      launcher: "launch-projector-empty.sh",
      launcherStartsEmptyProjector: true,
      commandLineSwfArgumentProvided: false,
      commandLineSourceOpenClaimed: false,
      sourceOpen: {
        method: ROOT_SOURCE_OPEN_METHOD,
        menuPath: [...ROOT_SOURCE_OPEN_MENU_PATH],
        selectedSource: stagedSource,
        requiresNamedHumanObservation: true,
      },
      deniedSideEffects: ["network", "apple-events"],
    },
    acceptedProofModes: [...bound.spec.traceModel.positioningProofModes],
    expectedEvidenceCounts: {frames: frameCount, operationRecords: frameCount, displayListRecords: frameCount},
    templates: templateFiles,
    statement: "This deterministic unsigned kit prepares a future session. It neither launches a SWF nor supplies evidence, review, acceptance, or authority.",
  };
  const manifestBytes = Buffer.from(json(manifest));
  const manifestSha256 = digest(manifestBytes);
  const toolchainReceipt = {
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime: {runtimeId: normalizedRuntime.runtimeId, name: normalizedRuntime.name, version: normalizedRuntime.version},
    captureSessionBinding: {
      sessionId: "",
      traceSpecSha256: bound.specSha256,
      sourceSwfSha256: bound.sourceSha256,
      captureKitManifestSha256: manifestSha256,
      launchReceiptSha256: null,
    },
    capturedAt: null,
    identityArtifacts: [{kind: "executable-sha256-receipt", file: identityProjectRelative, sha256: digest(identityText)}],
  };
  const launchReceipt = {
    schemaVersion: protocolV3 ? 3 : 2,
    evidenceType: protocolV3
      ? "named-human-hash-bound-root-source-open-start-receipt"
      : "named-human-hash-bound-root-source-open-receipt",
    templateStatus: ROOT_CAPTURE_TEMPLATE_STATUS,
    notEvidence: true,
    sessionId: "",
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    captureKit: {file: `${kitProjectRelative}/kit-manifest.json`, sha256: manifestSha256},
    runtime: {runtimeId: normalizedRuntime.runtimeId, name: normalizedRuntime.name, version: normalizedRuntime.version, executableSha256: normalizedRuntime.executableSha256},
    kitCheck: {file: null, sha256: null},
    launchProtocol: ROOT_PROJECTOR_LAUNCH_PROTOCOL,
    projectorStart: {executablePath: normalizedRuntime.executablePath, swfArgument: null, processId: null, startedAt: null},
    sourceOpen: {
      method: ROOT_SOURCE_OPEN_METHOD,
      menuPath: [...ROOT_SOURCE_OPEN_MENU_PATH],
      selectedSource: stagedSource,
      openedAt: null,
      playerWindowObserved: null,
    },
    ...(protocolV3 ? {finalizedAt: null} : {endedAt: null}),
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    statement: protocolV3 ? ROOT_SOURCE_OPEN_START_STATEMENT : ROOT_SOURCE_OPEN_STATEMENT,
    receiptSha256: null,
  };
  const attestation = {
    schemaVersion: 1,
    evidenceType: "named-human-root-capture-session-attestation",
    sessionId: "",
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    proofMode: null,
    traceSpec: bound.bindings.traceSpec,
    sourceSwf: {path: bound.bindings.sourceSwf.file, sha256: bound.sourceSha256},
    launchReceipt: {file: null, sha256: null},
    toolchainReceipt: {
      file: null,
      sha256: null,
      runtime: toolchainReceipt.runtime,
      captureSessionBinding: toolchainReceipt.captureSessionBinding,
    },
    operationLog: {file: null, sha256: null, finalEventSha256: null, eventCount: null},
    displayListRecords: {file: null, sha256: null, finalRecordSha256: null, recordCount: null},
    frameSet: {algorithm: "ordered-frame-path-sha256-v1", frameCount, frames: [], sha256: null},
    startedAt: null,
    endedAt: null,
    signedAt: null,
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    statement: CAPTURE_SESSION_ATTESTATION_STATEMENT,
    notes: CAPTURE_SESSION_AUTHORITY_NOTE,
    attestationSha256: null,
  };
  const schemaBindings = {
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    traceSpecSha256: bound.specSha256,
    sourceSwfSha256: bound.sourceSha256,
    frameDomainId: bound.spec.frameDomain.id,
    language: bound.spec.identity.language,
    kitManifestSha256: manifestSha256,
    ...(fractionalCaptureRaster ? {captureRaster: bound.captureRaster} : {}),
  };
  const operationSchema = recordSchemaTemplate({
    recordKind: "attested-root-frame-operation",
    expectedCount: frameCount,
    bindings: schemaBindings,
    requiredFields: [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
      "toolchainReceiptSha256", "sequence", "occurredAt",
      "monotonicTimeMs", "operator", "operation", "operationCountSincePrevious", "requestedRootFrame",
      "observedRootFrame", "screenshotFile", "screenshotSha256", "displayListRecordSha256",
      "previousEventSha256", "eventSha256",
    ],
    invariants: [
      "exactly one ordered record per root frame 1..N",
      "direct-seek for every frame, or Rewind at frame 1 plus exactly one Step Forward for every later frame",
      "requestedRootFrame equals runtime-observed root frame",
      "same named-human session/spec/source/toolchain identity and append-only SHA-256 chain",
    ],
  });
  const displayListSchema = recordSchemaTemplate({
    recordKind: "attested-display-list-state",
    expectedCount: frameCount,
    bindings: schemaBindings,
    requiredFields: [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
      "toolchainReceiptSha256", "sequence", "occurredAt",
      "monotonicTimeMs", "operator", "frameDomainId", "observedRootFrame", "displayListState",
      "displayListStateSha256", "screenshotSha256", "previousRecordSha256", "recordSha256",
    ],
    invariants: [
      "exactly one non-empty display-list state per ordered root frame",
      "state and operation identify the same frame/PNG/session instant",
      "contiguous append-only SHA-256 record chain",
    ],
  });
  const files = new Map([
    ["README.md", readme({bound, protocolV3})],
    ["OPERATOR_CARD.md", operatorCard({bound, stagedSource, runtime: normalizedRuntime, protocolV3})],
    ["kit-manifest.json", manifestBytes],
    ["runtime-source/source.swf", bound.sourceBytes],
    [identityRelative, identityText],
    ["templates/runtime-toolchain-receipt.template.json", json(toolchainReceipt)],
    ["templates/source-open-launch-receipt.template.json", json(launchReceipt)],
    ["templates/capture-session-attestation.template.json", json(attestation)],
    ["templates/operation-log.schema.template.jsonl", jsonl(operationSchema)],
    ["templates/display-list-states.schema.template.jsonl", jsonl(displayListSchema)],
    ["frames/README.md", `# Empty frame placeholder\n\nThis kit contains zero captured frames. Create a separate real session directory and capture exactly ${frameCount} lossless ${bound.captureRaster.width}×${bound.captureRaster.height} PNGs there. Files placed here make \`--check\` fail and are not evidence.\n`],
    ["sandbox.sb", sandbox],
    ["launch-projector-empty.sh", launcherContent],
  ]);
  return {
    bound,
    runtime: normalizedRuntime,
    manifest,
    manifestSha256,
    files,
    protocolV3,
    outputRootRelative: protocol.outputRootRelative,
  };
}

async function ensureFixedOutputRoot(root, outputRootRelative = DEFAULT_ROOT_CAPTURE_KIT_ROOT) {
  if (![DEFAULT_ROOT_CAPTURE_KIT_ROOT, DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT].includes(outputRootRelative)) {
    throw new Error("root-capture kit output root is unsupported");
  }
  const outputRoot = path.join(root, outputRootRelative);
  await ensureFixedDirectoryTree(root, outputRoot, "root-capture kit output root");
  const [actualRoot, actualOutput] = await Promise.all([realpath(root), realpath(outputRoot)]);
  if (actualOutput !== path.join(actualRoot, outputRootRelative)) {
    throw new Error(`root-capture kit output is fixed at ${outputRootRelative}`);
  }
  return outputRoot;
}

async function listRegularFiles(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`root-capture kit contains forbidden symbolic link: ${relative}`);
    if (entry.isDirectory()) result.push(...await listRegularFiles(candidate, relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`root-capture kit contains unsupported filesystem entry: ${relative}`);
  }
  return result.sort();
}

async function verifyKitDirectory(kit, kitRoot) {
  const info = await lstat(kitRoot).catch(() => null);
  if (!info?.isDirectory() || info.isSymbolicLink()) throw new Error(`root-capture requirement kit is missing: ${portable(path.relative(kit.bound.root, kitRoot))}`);
  const observedFiles = await listRegularFiles(kitRoot);
  const expectedFiles = [...kit.files.keys()].sort();
  if (canonicalJson(observedFiles) !== canonicalJson(expectedFiles)) {
    throw new Error("root-capture requirement kit file set differs from the deterministic scaffold");
  }
  for (const [relative, content] of kit.files) {
    const candidate = path.join(kitRoot, relative);
    const fileInfo = await lstat(candidate);
    if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) throw new Error(`root-capture kit file is not regular: ${relative}`);
    if (fileInfo.nlink !== 1) throw new Error(`root-capture kit file must not be hard-linked: ${relative}`);
    const observed = await readFile(candidate);
    if (!observed.equals(Buffer.from(content))) throw new Error(`root-capture kit file is stale or edited: ${relative}`);
    const confirmed = await lstat(candidate);
    if (
      !sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(fileInfo)) || confirmed.nlink !== 1 ||
      confirmed.size !== fileInfo.size || permissionMode(confirmed) !== permissionMode(fileInfo)
    ) throw new Error(`root-capture kit file identity changed while checking: ${relative}`);
    const mode = permissionMode(confirmed);
    const expectedMode = relative.endsWith(".sh") ? 0o555 : 0o444;
    if (mode !== expectedMode) throw new Error(`root-capture kit file mode changed: ${relative}`);
  }
  assertEmptyProjectorLauncher(kit.files.get("launch-projector-empty.sh"), kit.runtime.executablePath);
}

async function checkOneKit(kit) {
  const kitRoot = path.join(kit.bound.root, kit.outputRootRelative, kit.manifest.animationId, kit.bound.safeId);
  await assertNoSymlinkComponents(kit.bound.root, kitRoot, "root-capture requirement kit");
  await verifyKitDirectory(kit, kitRoot);
  return {
    status: "verified-unsigned-template-only",
    kitRoot,
    animationId: kit.manifest.animationId,
    requirementId: kit.manifest.requirementId,
    traceSpecSha256: kit.bound.specSha256,
    sourceSwfSha256: kit.bound.sourceSha256,
    runtimeExecutableSha256: kit.runtime.executableSha256,
    captureKitManifestSha256: kit.manifestSha256,
    launcherSha256: digest(kit.files.get("launch-projector-empty.sh")),
    sandboxProfileSha256: digest(kit.files.get("sandbox.sb")),
    stagedSourceSha256: digest(kit.files.get("runtime-source/source.swf")),
    nodeExecutableSha256: kit.manifest.runtime.launcherNodeExecutable.sha256,
    runtimeIdentityReceiptSha256: digest(kit.files.get("runtime/runtime-executable-sha256.txt")),
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
}

async function captureDirectoryInventory(directory) {
  const files = await listRegularFiles(directory);
  const directoryPaths = [];
  async function walkDirectories(current, prefix = "") {
    directoryPaths.push(prefix);
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const candidate = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`unsigned-template contains forbidden symbolic link: ${relative}`);
      if (entry.isDirectory()) await walkDirectories(candidate, relative);
    }
  }
  await walkDirectories(directory);
  const directories = [];
  for (const relative of directoryPaths.sort((left, right) => left.localeCompare(right))) {
    const candidate = relative ? path.join(directory, relative) : directory;
    const info = await lstat(candidate);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`unsigned-template directory changed while inventorying: ${relative || "."}`);
    directories.push({path: relative, node: nodeIdentity(info), mode: permissionMode(info)});
  }
  const snapshots = [];
  for (const relative of files) {
    const candidate = path.join(directory, relative);
    const before = await lstat(candidate);
    if (!before.isFile()) throw new Error("unsigned-template inventory entry is not a regular file: " + relative);
    if (before.isSymbolicLink() || before.nlink !== 1) throw new Error("unsigned-template inventory entry must not be symbolic- or hard-linked: " + relative);
    const bytes = await readFile(candidate);
    const after = await lstat(candidate);
    if (
      !sameNodeIdentity(nodeIdentity(before), nodeIdentity(after)) || before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || after.nlink !== 1
    ) throw new Error("unsigned-template changed while inventorying: " + relative);
    snapshots.push({
      path: relative,
      bytes,
      size: bytes.length,
      sha256: digest(bytes),
      mode: permissionMode(after),
      node: nodeIdentity(after),
      nlink: after.nlink,
    });
  }
  if (canonicalJson(await listRegularFiles(directory)) !== canonicalJson(files)) {
    throw new Error("unsigned-template file set changed while inventorying");
  }
  const records = snapshots.map(({path: file, size, sha256, mode}) => ({file, size, sha256, mode}));
  return {directories, snapshots, records, sha256: digest(canonicalJson(records))};
}

function assertUnsignedManifestBoundary(manifest, kit) {
  if (
    manifest?.schemaVersion !== 1 || manifest?.artifactType !== "root-frame-accurate-capture-operator-kit" ||
    manifest?.status !== ROOT_CAPTURE_TEMPLATE_STATUS || manifest?.notEvidence !== true ||
    manifest?.strictAcceptanceEffect !== false || manifest?.migrationStatusChanged !== false ||
    manifest?.humanReviewRecorded !== false || manifest?.ownerReviewRecorded !== false
  ) throw new Error("existing root-capture kit is not a generator unsigned template");
  if (manifest.animationId !== kit.manifest.animationId || manifest.requirementId !== kit.manifest.requirementId) {
    throw new Error("existing unsigned-template identity differs from the selected current requirement");
  }
  const allowedHistoricalHashes = [
    ["trace specification", manifest?.bindings?.traceSpec?.sha256, kit.manifest.bindings.traceSpec.sha256],
    ["trace-spec index", manifest?.bindings?.traceSpecIndex?.sha256, kit.manifest.bindings.traceSpecIndex.sha256],
    ["scenario inventory", manifest?.bindings?.scenarioInventory?.sha256, kit.manifest.bindings.scenarioInventory.sha256],
    [
      "technical migration manifest projection",
      manifest?.bindings?.migrationManifest?.sha256,
      kit.manifest.bindings.migrationManifest.sha256,
    ],
    [
      "full-frame coverage projection",
      manifest?.bindings?.fullFrameCoverage?.sha256,
      kit.manifest.bindings.fullFrameCoverage.sha256,
    ],
  ];
  for (const [label, historical] of allowedHistoricalHashes) {
    if (!/^[a-f0-9]{64}$/.test(historical || "")) {
      throw new Error(`existing unsigned-template ${label} SHA-256 is invalid`);
    }
  }
  if (!allowedHistoricalHashes.some(([, historical, current]) => historical !== current)) {
    throw new Error("refresh requires at least one stale allowlisted unsigned-template binding SHA-256");
  }
  if (
    manifest.bindings.migrationManifest.sha256 !== kit.manifest.bindings.migrationManifest.sha256 &&
    manifest.bindings.traceSpec.sha256 === kit.manifest.bindings.traceSpec.sha256
  ) {
    throw new Error("technical migration manifest projection SHA-256 drift requires trace-spec SHA-256 drift");
  }
  if (
    manifest.bindings.fullFrameCoverage.sha256 !== kit.manifest.bindings.fullFrameCoverage.sha256 &&
    manifest.bindings.traceSpec.sha256 === kit.manifest.bindings.traceSpec.sha256
  ) {
    throw new Error("full-frame coverage projection SHA-256 drift requires trace-spec SHA-256 drift");
  }
  const onlyAllowedHistoricalVariant = structuredClone(kit.manifest);
  onlyAllowedHistoricalVariant.bindings.traceSpec.sha256 = manifest.bindings.traceSpec.sha256;
  onlyAllowedHistoricalVariant.bindings.traceSpecIndex.sha256 = manifest.bindings.traceSpecIndex.sha256;
  onlyAllowedHistoricalVariant.bindings.scenarioInventory.sha256 = manifest.bindings.scenarioInventory.sha256;
  onlyAllowedHistoricalVariant.bindings.migrationManifest.sha256 = manifest.bindings.migrationManifest.sha256;
  onlyAllowedHistoricalVariant.bindings.fullFrameCoverage.sha256 = manifest.bindings.fullFrameCoverage.sha256;
  if (canonicalJson(manifest) !== canonicalJson(onlyAllowedHistoricalVariant)) {
    throw new Error("existing unsigned-template differs beyond the five allowlisted stale binding SHA-256 transforms");
  }
  if (
    manifest?.stagedSource?.copiedByteForByte !== true || manifest?.stagedSource?.sourceAssetsLaunchedDirectly !== false ||
    manifest?.stagedSource?.staged?.file !== "runtime-source/source.swf" ||
    manifest?.bindings?.sourceSwf?.file !== kit.bound.bindings.sourceSwf.file ||
    manifest?.bindings?.sourceSwf?.sha256 !== kit.bound.bindings.sourceSwf.sha256 ||
    manifest?.stagedSource?.staged?.sha256 !== kit.bound.sourceSha256 ||
    manifest?.launchContract?.protocol !== ROOT_PROJECTOR_LAUNCH_PROTOCOL ||
    manifest?.launchContract?.launcherStartsEmptyProjector !== true ||
    manifest?.launchContract?.commandLineSwfArgumentProvided !== false ||
    manifest?.launchContract?.sourceOpen?.method !== ROOT_SOURCE_OPEN_METHOD ||
    canonicalJson(manifest?.launchContract?.sourceOpen?.menuPath) !== canonicalJson(ROOT_SOURCE_OPEN_MENU_PATH)
  ) throw new Error("existing unsigned-template source or empty-Projector contract is invalid");
  const expectedTemplates = [
    "templates/runtime-toolchain-receipt.template.json",
    "templates/source-open-launch-receipt.template.json",
    "templates/capture-session-attestation.template.json",
    "templates/operation-log.schema.template.jsonl",
    "templates/display-list-states.schema.template.jsonl",
  ];
  if (canonicalJson(manifest.templates) !== canonicalJson(expectedTemplates)) {
    throw new Error("existing unsigned-template template inventory is invalid");
  }
}

async function inspectRefreshableUnsignedTemplate(kit, outputRoot) {
  const kitRoot = path.join(outputRoot, kit.manifest.animationId, kit.bound.safeId);
  await assertNoSymlinkComponents(kit.bound.root, kitRoot, "refreshable root-capture requirement kit");
  const info = await lstat(kitRoot).catch(() => null);
  if (!info?.isDirectory() || info.isSymbolicLink()) {
    throw new Error("refresh requires an existing regular unsigned-template kit directory");
  }
  const [actualOutput, actualKit, actualProject] = await Promise.all([
    realpath(outputRoot),
    realpath(kitRoot),
    realpath(kit.bound.root),
  ]);
  if (!isInside(actualKit, actualOutput) || actualKit === actualOutput) {
    throw new Error("refreshable root-capture kit resolves outside the fixed output root");
  }
  if (isInside(actualKit, path.join(actualProject, "source-assets"))) {
    throw new Error("refreshable root-capture kit must be outside source-assets");
  }

  const inventory = await captureDirectoryInventory(kitRoot);
  const expectedFileSet = [...kit.files.keys()].sort();
  if (canonicalJson(inventory.records.map(({file}) => file)) !== canonicalJson(expectedFileSet)) {
    throw new Error("existing unsigned-template has session, evidence, frame, or extra files");
  }
  const frameFiles = inventory.records.filter(({file}) => file.startsWith("frames/")).map(({file}) => file);
  if (canonicalJson(frameFiles) !== canonicalJson(["frames/README.md"])) {
    throw new Error("existing unsigned-template frames directory is not the empty README-only placeholder");
  }
  const manifestSnapshot = inventory.snapshots.find(({path: file}) => file === "kit-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(manifestSnapshot.bytes.toString("utf8"));
  } catch (error) {
    throw new Error("existing unsigned-template manifest is invalid JSON: " + error.message);
  }
  if (!manifestSnapshot.bytes.equals(Buffer.from(json(manifest)))) {
    throw new Error("existing unsigned-template manifest is not canonical generator output");
  }
  assertUnsignedManifestBoundary(manifest, kit);
  const staged = inventory.snapshots.find(({path: file}) => file === "runtime-source/source.swf");
  if (staged.sha256 !== manifest.stagedSource.staged.sha256 || staged.size !== manifest.stagedSource.staged.bytes) {
    throw new Error("existing unsigned-template staged source is stale or edited");
  }
  const historicalFiles = renderUnsignedTemplateFiles({root: kit.bound.root, manifest, sourceBytes: staged.bytes});
  for (const snapshot of inventory.snapshots) {
    const expected = historicalFiles.get(snapshot.path);
    if (expected === undefined || !snapshot.bytes.equals(Buffer.from(expected))) {
      throw new Error("existing unsigned-template is not exact generator output: " + snapshot.path);
    }
    const expectedMode = snapshot.path.endsWith(".sh") ? 0o555 : 0o444;
    if (snapshot.mode !== expectedMode) {
      throw new Error("existing unsigned-template file mode changed: " + snapshot.path);
    }
  }
  const alreadyCurrent = inventory.snapshots.every((snapshot) => {
    const current = kit.files.get(snapshot.path);
    return current !== undefined && snapshot.bytes.equals(Buffer.from(current));
  });
  if (alreadyCurrent) throw new Error("root-capture unsigned template is already current; use --check");
  return {kitRoot, manifest, inventory};
}

async function ensureOwnedKitSubdirectories({root, kitRoot, transaction, relativeDirectory}) {
  if (relativeDirectory === ".") return transaction.directories.get("");
  let cursor = kitRoot;
  let relativeCursor = "";
  for (const part of relativeDirectory.split(path.sep).filter(Boolean)) {
    const parentOwnership = transaction.directories.get(relativeCursor);
    if (!parentOwnership) throw new Error(`root-capture scaffold lost ownership of ${portable(relativeCursor || "kit root")}`);
    await assertDirectoryIdentity(root, cursor, parentOwnership, `root-capture scaffold ${portable(relativeCursor || "kit root")}`);
    cursor = path.join(cursor, part);
    relativeCursor = relativeCursor ? path.join(relativeCursor, part) : part;
    const existing = transaction.directories.get(relativeCursor);
    if (existing) {
      await assertDirectoryIdentity(root, cursor, existing, `root-capture scaffold ${portable(relativeCursor)}`);
      continue;
    }
    await assertNoSymlinkComponents(root, cursor, `root-capture scaffold ${portable(relativeCursor)}`);
    await mkdir(cursor, {recursive: false, mode: 0o755});
    const ownership = await captureDirectoryIdentity(root, cursor, `root-capture scaffold ${portable(relativeCursor)}`);
    transaction.directories.set(relativeCursor, ownership);
  }
  return transaction.directories.get(relativeCursor);
}

async function cleanupKitTransaction(transaction) {
  if (!transaction) return;
  for (const [relative, ownership] of [...transaction.files.entries()].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(transaction.kitRoot, relative), ownership);
  }
  const depth = (relative) => relative ? relative.split(path.sep).length : 0;
  const directories = [...transaction.directories.entries()].sort(([left], [right]) => depth(right) - depth(left));
  for (const [relative, ownership] of directories) {
    await removeOwnedEmptyDirectory(relative ? path.join(transaction.kitRoot, relative) : transaction.kitRoot, ownership);
  }
}

async function writeKitDirectory(kit, kitRoot, {transactionHooks = {}, hookContext = "scaffold"} = {}) {
  await assertNoSymlinkComponents(kit.bound.root, kitRoot, "root-capture requirement kit");
  if (await existsWithoutFollowing(kitRoot)) {
    throw new Error(`root-capture requirement kit already exists; refusing overwrite: ${portable(path.relative(kit.bound.root, kitRoot))}`);
  }
  const parent = path.dirname(kitRoot);
  const {identity: parentIdentity} = await ensureFixedDirectoryTree(kit.bound.root, parent, "root-capture requirement kit parent");
  await assertDirectoryIdentity(kit.bound.root, parent, parentIdentity, "root-capture requirement kit parent");
  await mkdir(kitRoot, {recursive: false, mode: 0o755});
  const rootIdentity = await captureDirectoryIdentity(kit.bound.root, kitRoot, "root-capture requirement kit root");
  const transaction = {kitRoot, parentIdentity, directories: new Map([["", rootIdentity]]), files: new Map()};
  try {
    await transactionHooks.afterKitRootCreated?.({kitRoot, hookContext});
    for (const [relative, content] of kit.files) {
      assertPortableProjectRelative(relative, `kit file ${relative}`);
      const destination = path.join(kitRoot, relative);
      const directoryOwnership = await ensureOwnedKitSubdirectories({
        root: kit.bound.root,
        kitRoot,
        transaction,
        relativeDirectory: path.dirname(relative),
      });
      const ownership = await writeOwnedExclusive({
        root: kit.bound.root,
        parent: path.dirname(destination),
        parentIdentity: directoryOwnership,
        candidate: destination,
        bytes: content,
        mode: relative.endsWith(".sh") ? 0o555 : 0o444,
        label: `root-capture scaffold ${relative}`,
        registerOwnership: (created) => transaction.files.set(relative, created),
      });
      transaction.files.set(relative, ownership);
      await transactionHooks.afterKitFileWritten?.({kitRoot, relative, destination, hookContext});
    }
    if (await sha256File(kit.bound.sourcePath) !== kit.bound.sourceSha256) {
      throw new Error("preserved source SWF changed while scaffolding the root-capture kit");
    }
    await verifyKitDirectory(kit, kitRoot);
    return {result: {
      status: "scaffolded-unsigned-template-only",
      kitRoot,
      animationId: kit.manifest.animationId,
      requirementId: kit.manifest.requirementId,
      traceSpecSha256: kit.bound.specSha256,
      sourceSwfSha256: kit.bound.sourceSha256,
      runtimeExecutableSha256: kit.runtime.executableSha256,
      captureKitManifestSha256: kit.manifestSha256,
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    }, transaction};
  } catch (error) {
    await cleanupKitTransaction(transaction);
    throw error;
  }
}

async function writeOneKit(kit, outputRoot, options) {
  return writeKitDirectory(kit, path.join(outputRoot, kit.manifest.animationId, kit.bound.safeId), options);
}

async function ensureFixedArchiveRoot(root) {
  const archiveRoot = path.join(root, ROOT_CAPTURE_STALE_ARCHIVE_ROOT);
  await ensureFixedDirectoryTree(root, archiveRoot, "root-capture stale archive root");
  const [actualRoot, actualArchive] = await Promise.all([realpath(root), realpath(archiveRoot)]);
  if (actualArchive !== path.join(actualRoot, ROOT_CAPTURE_STALE_ARCHIVE_ROOT)) {
    throw new Error("root-capture stale archive is not at its fixed project location");
  }
  if (isInside(actualArchive, path.join(actualRoot, "source-assets"))) {
    throw new Error("root-capture stale archive must be outside source-assets");
  }
  return archiveRoot;
}

function staleArchiveRecord(kit, inspection) {
  return {
    schemaVersion: 1,
    artifactType: "append-only-stale-unsigned-root-capture-kit",
    status: "archived-unsigned-template-only-not-evidence",
    notEvidence: true,
    sourceKit: portable(path.relative(kit.bound.root, inspection.kitRoot)),
    animationId: kit.manifest.animationId,
    requirementId: kit.manifest.requirementId,
    oldTraceSpecSha256: inspection.manifest.bindings.traceSpec.sha256,
    currentTraceSpecSha256: kit.bound.bindings.traceSpec.sha256,
    oldTraceSpecIndexSha256: inspection.manifest.bindings.traceSpecIndex.sha256,
    currentTraceSpecIndexSha256: kit.bound.bindings.traceSpecIndex.sha256,
    oldScenarioInventorySha256: inspection.manifest.bindings.scenarioInventory.sha256,
    currentScenarioInventorySha256: kit.bound.bindings.scenarioInventory.sha256,
    oldMigrationManifestProjectionSha256: inspection.manifest.bindings.migrationManifest.sha256,
    currentMigrationManifestProjectionSha256: kit.bound.bindings.migrationManifest.sha256,
    oldTreeSha256: inspection.inventory.sha256,
    newCaptureKitManifestSha256: kit.manifestSha256,
    fileCount: inspection.inventory.records.length,
    files: inspection.inventory.records,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
}

async function verifyReusableStaleArchive(finalRoot, kit, inspection) {
  await assertNoSymlinkComponents(kit.bound.root, finalRoot, "existing root-capture stale archive");
  const expectedRecord = Buffer.from(json(staleArchiveRecord(kit, inspection)));
  const observedFiles = await listRegularFiles(finalRoot);
  const expectedFiles = [
    ARCHIVE_INVENTORY_FILE,
    ...inspection.inventory.records.map(({file}) => "kit/" + file),
  ].sort();
  if (canonicalJson(observedFiles) !== canonicalJson(expectedFiles)) {
    throw new Error("existing append-only stale archive has an unexpected file set");
  }
  const recordPath = path.join(finalRoot, ARCHIVE_INVENTORY_FILE);
  const recordInfo = await lstat(recordPath);
  if (!recordInfo.isFile() || recordInfo.isSymbolicLink() || recordInfo.nlink !== 1 || permissionMode(recordInfo) !== 0o444) {
    throw new Error("existing append-only stale archive record mode/link identity differs; refusing overwrite");
  }
  const record = await readFile(recordPath);
  if (!record.equals(expectedRecord)) throw new Error("existing append-only stale archive record differs; refusing overwrite");
  const archivedInventory = await captureDirectoryInventory(path.join(finalRoot, "kit"));
  if (archivedInventory.sha256 !== inspection.inventory.sha256) {
    throw new Error("existing append-only stale archive bytes differ; refusing overwrite");
  }
  for (const snapshot of inspection.inventory.snapshots) {
    const archived = await readFile(path.join(finalRoot, "kit", snapshot.path));
    if (!archived.equals(snapshot.bytes)) {
      throw new Error("existing append-only stale archive file differs; refusing overwrite: " + snapshot.path);
    }
  }
  return {
    root: finalRoot,
    treeSha256: inspection.inventory.sha256,
    inventoryFile: path.join(finalRoot, ARCHIVE_INVENTORY_FILE),
    reused: true,
  };
}

async function archiveUnsignedTemplate({kit, inspection, archiveRoot, transactionId, transactionHooks = {}}) {
  const requirementRoot = path.join(archiveRoot, kit.manifest.animationId, kit.bound.safeId);
  const {identity: requirementIdentity} = await ensureFixedDirectoryTree(
    kit.bound.root,
    requirementRoot,
    "root-capture stale archive requirement root",
  );
  const archiveSlot = inspection.inventory.sha256 + "--to--" + kit.manifestSha256;
  const finalRoot = path.join(requirementRoot, archiveSlot);
  const lockRoot = path.join(requirementRoot, "." + archiveSlot + ".lock");
  if (await existsWithoutFollowing(finalRoot)) return verifyReusableStaleArchive(finalRoot, kit, inspection);
  await assertDirectoryIdentity(kit.bound.root, requirementRoot, requirementIdentity, "root-capture stale archive requirement root");
  let lockIdentity;
  try {
    await mkdir(lockRoot, {recursive: false, mode: 0o700});
    lockIdentity = await captureDirectoryIdentity(kit.bound.root, lockRoot, "root-capture stale archive lock");
  } catch (error) {
    if (error.code === "EEXIST") throw new Error("concurrent unsigned-template refresh already owns this stale snapshot");
    throw error;
  }
  let archiveTransaction = null;
  try {
    if (await existsWithoutFollowing(finalRoot)) {
      return await verifyReusableStaleArchive(finalRoot, kit, inspection);
    }
    await assertDirectoryIdentity(kit.bound.root, requirementRoot, requirementIdentity, "root-capture stale archive requirement root");
    await mkdir(finalRoot, {recursive: false, mode: 0o755});
    const finalIdentity = await captureDirectoryIdentity(kit.bound.root, finalRoot, "exclusive root-capture stale archive slot");
    archiveTransaction = {kitRoot: finalRoot, directories: new Map([["", finalIdentity]]), files: new Map()};
    await transactionHooks.afterArchiveSlotCreated?.({kit, inspection, finalRoot, transactionId});
    for (const snapshot of inspection.inventory.snapshots) {
      const relative = `kit/${snapshot.path}`;
      const destination = path.join(finalRoot, relative);
      const directoryOwnership = await ensureOwnedKitSubdirectories({
        root: kit.bound.root,
        kitRoot: finalRoot,
        transaction: archiveTransaction,
        relativeDirectory: path.dirname(relative),
      });
      const ownership = await writeOwnedExclusive({
        root: kit.bound.root,
        parent: path.dirname(destination),
        parentIdentity: directoryOwnership,
        candidate: destination,
        bytes: snapshot.bytes,
        mode: snapshot.mode,
        label: `root-capture stale archive ${relative}`,
        registerOwnership: (created) => archiveTransaction.files.set(relative, created),
      });
      archiveTransaction.files.set(relative, ownership);
      await transactionHooks.afterArchiveFileWritten?.({kit, inspection, finalRoot, relative, destination, transactionId});
    }
    const archiveInventory = staleArchiveRecord(kit, inspection);
    const inventoryBytes = Buffer.from(json(archiveInventory));
    const inventoryPath = path.join(finalRoot, ARCHIVE_INVENTORY_FILE);
    const inventoryOwnership = await writeOwnedExclusive({
      root: kit.bound.root,
      parent: finalRoot,
      parentIdentity: finalIdentity,
      candidate: inventoryPath,
      bytes: inventoryBytes,
      mode: 0o444,
      label: "root-capture stale archive record",
      registerOwnership: (created) => archiveTransaction.files.set(ARCHIVE_INVENTORY_FILE, created),
    });
    archiveTransaction.files.set(ARCHIVE_INVENTORY_FILE, inventoryOwnership);
    await transactionHooks.afterArchiveFileWritten?.({
      kit,
      inspection,
      finalRoot,
      relative: ARCHIVE_INVENTORY_FILE,
      destination: inventoryPath,
      transactionId,
    });
    const archivedInventory = await captureDirectoryInventory(path.join(finalRoot, "kit"));
    if (archivedInventory.sha256 !== inspection.inventory.sha256) {
      throw new Error("stale archive verification differs from the complete pre-refresh hash inventory");
    }
    await verifyReusableStaleArchive(finalRoot, kit, inspection);
    return {
      root: finalRoot,
      treeSha256: inspection.inventory.sha256,
      inventoryFile: path.join(finalRoot, ARCHIVE_INVENTORY_FILE),
      reused: false,
    };
  } catch (error) {
    await cleanupKitTransaction(archiveTransaction);
    throw error;
  } finally {
    if (lockIdentity) await removeOwnedEmptyDirectory(lockRoot, lockIdentity);
  }
}

async function acquireRefreshLocks(kits, outputRoot, transactionId) {
  const ordered = [...kits].sort((left, right) => {
    const leftId = left.manifest.animationId + "/" + left.bound.safeId;
    const rightId = right.manifest.animationId + "/" + right.bound.safeId;
    return leftId.localeCompare(rightId);
  });
  const locks = [];
  try {
    for (const kit of ordered) {
      const lockRoot = path.join(outputRoot, ".refresh-locks", kit.manifest.animationId, kit.bound.safeId);
      await assertNoSymlinkComponents(kit.bound.root, lockRoot, "root-capture refresh lock");
      const parent = path.dirname(lockRoot);
      const {identity: parentIdentity} = await ensureFixedDirectoryTree(kit.bound.root, parent, "root-capture refresh lock parent");
      await assertDirectoryIdentity(kit.bound.root, parent, parentIdentity, "root-capture refresh lock parent");
      try {
        await mkdir(lockRoot, {recursive: false, mode: 0o700});
      } catch (error) {
        if (error.code === "EEXIST") {
          throw new Error("concurrent unsigned-template refresh owns lock for " + kit.manifest.animationId + "/" + kit.bound.safeId);
        }
        throw error;
      }
      const owner = Buffer.from(json({
        schemaVersion: 1,
        artifactType: "root-capture-refresh-lock-owner",
        transactionId,
        processId: process.pid,
        animationId: kit.manifest.animationId,
        requirementId: kit.manifest.requirementId,
      }));
      const lockIdentity = await captureDirectoryIdentity(kit.bound.root, lockRoot, "root-capture refresh lock");
      const ownerPath = path.join(lockRoot, "owner-token.json");
      let ownerOwnership;
      try {
        ownerOwnership = await writeOwnedExclusive({
          root: kit.bound.root,
          parent: lockRoot,
          parentIdentity: lockIdentity,
          candidate: ownerPath,
          bytes: owner,
          mode: 0o444,
          label: "root-capture refresh lock owner token",
        });
      } catch (error) {
        await removeOwnedEmptyDirectory(lockRoot, lockIdentity);
        throw error;
      }
      locks.push({lockRoot, lockIdentity, ownerPath, owner, ownerOwnership});
    }
    return locks;
  } catch (error) {
    for (const lock of [...locks].reverse()) {
      await removeOwnedFileIfUnchanged(lock.ownerPath, lock.ownerOwnership);
      await removeOwnedEmptyDirectory(lock.lockRoot, lock.lockIdentity);
    }
    throw error;
  }
}

async function releaseRefreshLocks(locks) {
  const errors = [];
  for (const lock of [...locks].reverse()) {
    const observed = await lstatIfPresent(lock.ownerPath);
    if (
      !observed?.isFile() || observed.isSymbolicLink() ||
      !sameNodeIdentity(nodeIdentity(observed), lock.ownerOwnership.node) ||
      observed.nlink !== 1 || digest(await readFile(lock.ownerPath)) !== lock.ownerOwnership.sha256
    ) {
      errors.push("refresh lock ownership changed: " + lock.lockRoot);
      continue;
    }
    await removeOwnedFileIfUnchanged(lock.ownerPath, lock.ownerOwnership);
    if (!await removeOwnedEmptyDirectory(lock.lockRoot, lock.lockIdentity)) {
      errors.push("refresh lock contains a foreign child or replacement: " + lock.lockRoot);
    }
  }
  if (errors.length) throw new Error(errors.join("; "));
}

async function assertCurrentInputsUnchanged(kits) {
  for (const kit of kits) {
    const rebound = await buildRootCaptureKit({
      projectRoot: kit.bound.root,
      specFile: kit.bound.specRelative,
      runtime: kit.runtime,
      protocolV3: kit.protocolV3,
    });
    if (
      rebound.manifestSha256 !== kit.manifestSha256 ||
      rebound.bound.specSha256 !== kit.bound.specSha256 ||
      rebound.bound.sourceSha256 !== kit.bound.sourceSha256 ||
      rebound.bound.indexSha256 !== kit.bound.indexSha256 ||
      canonicalJson(rebound.bound.bindings) !== canonicalJson(kit.bound.bindings)
    ) throw new Error("current trace index/spec/source/projection inputs changed before transactional publication");
  }
}

async function assertInventoryAt(directory, inventory, label, {requireOriginalNodes = false} = {}) {
  const observed = await captureDirectoryInventory(directory);
  if (observed.sha256 !== inventory.sha256 || canonicalJson(observed.records) !== canonicalJson(inventory.records)) {
    throw new Error(`${label} bytes/modes/tree changed`);
  }
  if (requireOriginalNodes) {
    const expectedDirectories = new Map(inventory.directories.map((item) => [item.path, item.node]));
    for (const item of observed.directories) {
      if (!sameNodeIdentity(item.node, expectedDirectories.get(item.path))) throw new Error(`${label} directory inode changed: ${item.path || "."}`);
    }
    const expectedFiles = new Map(inventory.snapshots.map((item) => [item.path, item.node]));
    for (const item of observed.snapshots) {
      if (!sameNodeIdentity(item.node, expectedFiles.get(item.path))) throw new Error(`${label} file inode changed: ${item.path}`);
    }
  }
  return observed;
}

async function cleanupInventoryTree(directory, inventory) {
  for (const snapshot of [...inventory.snapshots].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(directory, snapshot.path), snapshot);
  }
  const depth = (relative) => relative ? relative.split("/").length : 0;
  for (const entry of [...inventory.directories].sort((left, right) => depth(right.path) - depth(left.path))) {
    await removeOwnedEmptyDirectory(entry.path ? path.join(directory, entry.path) : directory, entry);
  }
}

async function writeInventoryDirectory({root, directory, inventory, label}) {
  await assertNoSymlinkComponents(root, directory, label);
  if (await existsWithoutFollowing(directory)) throw new Error(`${label} already exists; refusing replacement`);
  const parent = path.dirname(directory);
  const {identity: parentIdentity} = await ensureFixedDirectoryTree(root, parent, `${label} parent`);
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await mkdir(directory, {recursive: false, mode: inventory.directories.find(({path: relative}) => relative === "")?.mode || 0o755});
  const rootIdentity = await captureDirectoryIdentity(root, directory, `${label} root`);
  const transaction = {kitRoot: directory, directories: new Map([["", rootIdentity]]), files: new Map()};
  try {
    for (const snapshot of inventory.snapshots) {
      const destination = path.join(directory, snapshot.path);
      const directoryOwnership = await ensureOwnedKitSubdirectories({
        root,
        kitRoot: directory,
        transaction,
        relativeDirectory: path.dirname(snapshot.path),
      });
      const ownership = await writeOwnedExclusive({
        root,
        parent: path.dirname(destination),
        parentIdentity: directoryOwnership,
        candidate: destination,
        bytes: snapshot.bytes,
        mode: snapshot.mode,
        label: `${label} ${snapshot.path}`,
        registerOwnership: (created) => transaction.files.set(snapshot.path, created),
      });
      transaction.files.set(snapshot.path, ownership);
    }
    const observed = await captureDirectoryInventory(directory);
    if (observed.sha256 !== inventory.sha256 || canonicalJson(observed.records) !== canonicalJson(inventory.records)) {
      throw new Error(`${label} restored tree differs from its recorded snapshot`);
    }
    return transaction;
  } catch (error) {
    await cleanupKitTransaction(transaction);
    throw error;
  }
}

async function createOwnedContainer(root, directory, label) {
  await assertNoSymlinkComponents(root, directory, label);
  if (await existsWithoutFollowing(directory)) throw new Error(`${label} already exists; refusing replacement`);
  const parent = path.dirname(directory);
  const {identity: parentIdentity} = await ensureFixedDirectoryTree(root, parent, `${label} parent`);
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await mkdir(directory, {recursive: false, mode: 0o700});
  return {root: directory, directories: new Map([["", await captureDirectoryIdentity(root, directory, label)]])};
}

async function rememberContainerDirectory(root, container, directory, label) {
  const ensured = await ensureFixedDirectoryTree(root, directory, label);
  const relative = portable(path.relative(container.root, directory));
  if (relative === ".." || relative.startsWith("../") || path.isAbsolute(relative)) throw new Error(`${label} escapes its transaction container`);
  const prior = container.directories.get(relative);
  if (prior) await assertDirectoryIdentity(root, directory, prior, label);
  else container.directories.set(relative, ensured.identity);
  return ensured.identity;
}

async function cleanupOwnedContainer(container) {
  if (!container) return;
  const depth = (relative) => relative ? relative.split("/").length : 0;
  for (const [relative, ownership] of [...container.directories.entries()].sort(([left], [right]) => depth(right) - depth(left))) {
    await removeOwnedEmptyDirectory(relative ? path.join(container.root, relative) : container.root, ownership);
  }
}

async function refreshUnsignedTemplates({kits, outputRoot, transactionHooks = {}}) {
  const transactionId = String(process.pid) + "-" + (++refreshTransactionSequence) + "-" + Date.now();
  const locks = await acquireRefreshLocks(kits, outputRoot, transactionId);
  let primaryError = null;
  try {
    const inspections = [];
    for (const kit of kits) inspections.push(await inspectRefreshableUnsignedTemplate(kit, outputRoot));
    const archiveRoot = await ensureFixedArchiveRoot(kits[0].bound.root);
    const archives = [];
    for (let index = 0; index < kits.length; index += 1) {
      archives.push(await archiveUnsignedTemplate({
        kit: kits[index],
        inspection: inspections[index],
        archiveRoot,
        transactionId,
        transactionHooks,
      }));
    }
    await transactionHooks.afterArchivesWritten?.({kits, inspections, archives});

    const stageRoot = path.join(outputRoot, ".refresh-staging-" + transactionId);
    const backupRoot = path.join(outputRoot, ".refresh-backup-" + transactionId);
    let stageContainer = null;
    let backupContainer = null;
    const stagedTransactions = [];
    const swaps = [];
    try {
      stageContainer = await createOwnedContainer(kits[0].bound.root, stageRoot, "root-capture refresh staging container");
      backupContainer = await createOwnedContainer(kits[0].bound.root, backupRoot, "root-capture refresh backup container");
      for (const kit of kits) {
        const staged = path.join(stageRoot, kit.manifest.animationId, kit.bound.safeId);
        await rememberContainerDirectory(
          kit.bound.root,
          stageContainer,
          path.dirname(staged),
          "root-capture refresh staging animation directory",
        );
        const written = await writeKitDirectory(kit, staged, {hookContext: "refresh-staging"});
        stagedTransactions.push(written.transaction);
        await verifyKitDirectory(kit, staged);
      }
      await transactionHooks.afterCurrentKitsStaged?.({kits, inspections, archives});
      for (const inspection of inspections) {
        await assertInventoryAt(inspection.kitRoot, inspection.inventory, "stale CAS: unsigned-template changed after archival; refusing replacement", {requireOriginalNodes: true});
      }
      await assertCurrentInputsUnchanged(kits);
      for (let index = 0; index < kits.length; index += 1) {
        const kit = kits[index];
        const inspection = inspections[index];
        const active = path.join(outputRoot, kit.manifest.animationId, kit.bound.safeId);
        const backup = path.join(backupRoot, kit.manifest.animationId, kit.bound.safeId);
        await rememberContainerDirectory(
          kit.bound.root,
          backupContainer,
          path.dirname(backup),
          "root-capture refresh backup animation directory",
        );
        const backupTransaction = await writeInventoryDirectory({
          root: kit.bound.root,
          directory: backup,
          inventory: inspection.inventory,
          label: "root-capture refresh backup snapshot",
        });
        const swap = {
          active,
          backup,
          backupTransaction,
          publishedTransaction: null,
          activeRemovalStarted: false,
          oldRemoved: false,
        };
        swaps.push(swap);
        await transactionHooks.afterBackupSnapshotWritten?.({kit, index, active, backup});
        await assertInventoryAt(active, inspection.inventory, "stale CAS: active unsigned-template changed before removal", {requireOriginalNodes: true});
        await transactionHooks.beforeActiveRemoval?.({kit, index, active, backup});
        await assertInventoryAt(active, inspection.inventory, "stale CAS: active unsigned-template changed before removal", {requireOriginalNodes: true});
        swap.activeRemovalStarted = true;
        await cleanupInventoryTree(active, inspection.inventory);
        if (await existsWithoutFollowing(active)) {
          throw new Error("active unsigned-template retained a foreign child or replacement; refusing refresh publication");
        }
        swap.oldRemoved = true;
        await transactionHooks.afterOldKitMoved?.({kit, index, active, backup});
        const published = await writeKitDirectory(kit, active, {
          transactionHooks,
          hookContext: "refresh-publication",
        });
        swap.publishedTransaction = published.transaction;
        await transactionHooks.afterSwap?.({kit, index, active, backup});
      }
      for (const kit of kits) await checkOneKit(kit);
      for (const swap of swaps) await cleanupKitTransaction(swap.backupTransaction);
      for (const transaction of [...stagedTransactions].reverse()) await cleanupKitTransaction(transaction);
      await cleanupOwnedContainer(backupContainer);
      await cleanupOwnedContainer(stageContainer);
      return kits.map((kit, index) => ({
        status: "refreshed-unsigned-template-only",
        kitRoot: inspections[index].kitRoot,
        staleArchiveRoot: archives[index].root,
        staleArchiveTreeSha256: archives[index].treeSha256,
        animationId: kit.manifest.animationId,
        requirementId: kit.manifest.requirementId,
        traceSpecSha256: kit.bound.specSha256,
        sourceSwfSha256: kit.bound.sourceSha256,
        runtimeExecutableSha256: kit.runtime.executableSha256,
        captureKitManifestSha256: kit.manifestSha256,
        strictAcceptanceEffect: false,
        migrationStatusChanged: false,
      }));
    } catch (error) {
      const rollbackErrors = [];
      for (let index = swaps.length - 1; index >= 0; index -= 1) {
        const swap = swaps[index];
        const inspection = inspections[index];
        await cleanupKitTransaction(swap.publishedTransaction);
        let preserveBackup = false;
        if (swap.activeRemovalStarted) {
          if (await existsWithoutFollowing(swap.active)) {
            rollbackErrors.push(`foreign active slot preserved at ${portable(path.relative(kits[index].bound.root, swap.active))}`);
            preserveBackup = true;
          } else {
            try {
              await writeInventoryDirectory({
                root: kits[index].bound.root,
                directory: swap.active,
                inventory: inspection.inventory,
                label: "root-capture refresh rollback restore",
              });
            } catch (restoreError) {
              rollbackErrors.push(`could not restore ${portable(path.relative(kits[index].bound.root, swap.active))}: ${restoreError.message}`);
              preserveBackup = true;
            }
          }
        }
        if (!preserveBackup) await cleanupKitTransaction(swap.backupTransaction);
      }
      for (const transaction of [...stagedTransactions].reverse()) await cleanupKitTransaction(transaction);
      await cleanupOwnedContainer(backupContainer);
      await cleanupOwnedContainer(stageContainer);
      if (rollbackErrors.length) throw new Error(`${error.message}; safe rollback preserved foreign state (${rollbackErrors.join("; ")})`);
      throw error;
    }
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await releaseRefreshLocks(locks);
    } catch (lockError) {
      if (!primaryError) throw lockError;
    }
  }
}

async function reconcileMissingLessonReleaseKits({kits, outputRoot, transactionHooks = {}}) {
  await assertNoSymlinkComponents(kits[0].bound.root, outputRoot, "lesson-release reconcile output root");
  const outputInfo = await lstatIfPresent(outputRoot);
  if (!outputInfo?.isDirectory() || outputInfo.isSymbolicLink()) {
    throw new Error(`--reconcile-missing requires the existing fixed ${kits[0].outputRootRelative} directory`);
  }
  const outputIdentity = await captureDirectoryIdentity(
    kits[0].bound.root,
    outputRoot,
    "lesson-release reconcile output root",
  );
  const existing = new Map();
  const missing = [];
  for (const kit of kits) {
    const kitRoot = path.join(outputRoot, kit.manifest.animationId, kit.bound.safeId);
    await assertNoSymlinkComponents(kit.bound.root, kitRoot, "lesson-release reconcile requirement kit");
    if (await existsWithoutFollowing(kitRoot)) existing.set(kitRoot, await checkOneKit(kit));
    else missing.push({kit, kitRoot});
  }
  await assertCurrentInputsUnchanged(kits);
  await transactionHooks.afterReconcilePreflight?.({kits, existing, missing});

  const transactions = [];
  const createdAnimationDirectories = new Map();
  const createdResults = new Map();
  try {
    for (const {kit, kitRoot} of missing) {
      await assertDirectoryIdentity(
        kit.bound.root,
        outputRoot,
        outputIdentity,
        "lesson-release reconcile output root",
      );
      const animationRoot = path.join(outputRoot, kit.manifest.animationId);
      if (!await existsWithoutFollowing(animationRoot)) {
        await mkdir(animationRoot, {recursive: false, mode: 0o755});
        createdAnimationDirectories.set(
          animationRoot,
          await captureDirectoryIdentity(
            kit.bound.root,
            animationRoot,
            "lesson-release reconcile animation directory",
          ),
        );
      } else {
        await captureDirectoryIdentity(
          kit.bound.root,
          animationRoot,
          "lesson-release reconcile animation directory",
        );
      }
      const written = await writeOneKit(kit, outputRoot, {
        transactionHooks,
        hookContext: "lesson-release-reconcile",
      });
      transactions.push(written.transaction);
      createdResults.set(kitRoot, written.result);
      await transactionHooks.afterReconcileKitWritten?.({kit, kitRoot, written});
    }
    await assertCurrentInputsUnchanged(kits);
    const checked = [];
    for (const kit of kits) checked.push(await checkOneKit(kit));
    await assertDirectoryIdentity(
      kits[0].bound.root,
      outputRoot,
      outputIdentity,
      "lesson-release reconcile output root",
    );
    return checked.map((result) => createdResults.get(result.kitRoot) || existing.get(result.kitRoot) || result);
  } catch (error) {
    for (const transaction of [...transactions].reverse()) await cleanupKitTransaction(transaction);
    for (const [animationRoot, ownership] of [...createdAnimationDirectories.entries()].reverse()) {
      await removeOwnedEmptyDirectory(animationRoot, ownership);
    }
    throw error;
  }
}

export async function scaffoldRootCaptureKits({
  projectRoot = PROJECT_ROOT,
  specFile = null,
  allReady = false,
  lessonRelease = null,
  runtime,
  check = false,
  reconcileMissing = false,
  refreshUnsignedTemplate = false,
  protocolV3 = false,
  transactionHooks = {},
} = {}) {
  const root = path.resolve(projectRoot);
  const protocol = captureKitProtocol(protocolV3);
  const selectorCount = [Boolean(specFile), Boolean(allReady), Boolean(lessonRelease)].filter(Boolean).length;
  if (selectorCount !== 1) throw new Error("select exactly one of --spec, --all-ready, or --lesson-release");
  if ([check, refreshUnsignedTemplate, reconcileMissing].filter(Boolean).length > 1) {
    throw new Error("--check, --refresh-unsigned-template, and --reconcile-missing are mutually exclusive");
  }
  if (lessonRelease && !check && !reconcileMissing && !protocolV3) {
    throw new Error("--lesson-release requires either --reconcile-missing or --check");
  }
  if (reconcileMissing && !lessonRelease) {
    throw new Error("--reconcile-missing is restricted to one complete --lesson-release selection");
  }
  if (refreshUnsignedTemplate && lessonRelease) {
    throw new Error("--refresh-unsigned-template does not accept a lesson-release batch");
  }
  if (refreshUnsignedTemplate && protocolV3) {
    throw new Error("--protocol-v3 uses a parallel successor root and never refreshes an existing kit");
  }
  const specFiles = lessonRelease
    ? (await listReadyLessonReleaseRootSpecs({projectRoot: root, releaseId: lessonRelease})).specs.map(({file}) => file)
    : allReady
      ? (await listReadyRootSpecs({projectRoot: root})).specs.map(({file}) => file)
      : [specFile];
  const kits = [];
  for (const selected of specFiles) {
    kits.push(await buildRootCaptureKit({projectRoot: root, specFile: selected, runtime, protocolV3}));
  }
  if (check) {
    const results = [];
    for (const kit of kits) results.push(await checkOneKit(kit));
    return results;
  }
  if (refreshUnsignedTemplate) {
    const outputRoot = await ensureFixedOutputRoot(root);
    return refreshUnsignedTemplates({kits, outputRoot, transactionHooks});
  }
  if (reconcileMissing) {
    const outputRoot = path.join(root, protocol.outputRootRelative);
    return reconcileMissingLessonReleaseKits({kits, outputRoot, transactionHooks});
  }
  const outputRoot = path.join(root, protocol.outputRootRelative);
  await assertNoSymlinkComponents(root, outputRoot, "root-capture kit output root");
  for (const kit of kits) {
    const kitRoot = path.join(outputRoot, kit.manifest.animationId, kit.bound.safeId);
    await assertNoSymlinkComponents(root, kitRoot, "root-capture requirement kit");
    if (await existsWithoutFollowing(kitRoot)) {
      throw new Error(`root-capture requirement kit already exists; refusing overwrite: ${portable(path.relative(root, kitRoot))}`);
    }
  }
  await ensureFixedOutputRoot(root, protocol.outputRootRelative);
  const results = [];
  const transactions = [];
  try {
    for (const kit of kits) {
      const written = await writeOneKit(kit, outputRoot, {transactionHooks, hookContext: "scaffold"});
      results.push(written.result);
      transactions.push(written.transaction);
    }
    return results;
  } catch (error) {
    for (const transaction of [...transactions].reverse()) await cleanupKitTransaction(transaction);
    throw error;
  }
}

export function parseArguments(argv) {
  const options = {
    specFile: null,
    allReady: false,
    lessonRelease: null,
    playerApp: DEFAULT_PROJECTOR_APP,
    check: false,
    reconcileMissing: false,
    refreshUnsignedTemplate: false,
    protocolV3: false,
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
    else if (value === "--all-ready") options.allReady = true;
    else if (value === "--lesson-release") options.lessonRelease = takeValue();
    else if (value === "--player-app") options.playerApp = path.resolve(takeValue());
    else if (value === "--check") options.check = true;
    else if (value === "--reconcile-missing") options.reconcileMissing = true;
    else if (value === "--refresh-unsigned-template") options.refreshUnsignedTemplate = true;
    else if (value === "--protocol-v3") options.protocolV3 = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.help && [Boolean(options.specFile), Boolean(options.allReady), Boolean(options.lessonRelease)].filter(Boolean).length !== 1) {
    throw new Error("select exactly one of --spec, --all-ready, or --lesson-release");
  }
  if (!options.help && [options.check, options.refreshUnsignedTemplate, options.reconcileMissing].filter(Boolean).length > 1) {
    throw new Error("--check, --refresh-unsigned-template, and --reconcile-missing are mutually exclusive");
  }
  if (!options.help && options.lessonRelease && !options.check && !options.reconcileMissing && !options.protocolV3) {
    throw new Error("--lesson-release requires either --reconcile-missing or --check");
  }
  if (!options.help && options.reconcileMissing && !options.lessonRelease) {
    throw new Error("--reconcile-missing is restricted to one complete --lesson-release selection");
  }
  if (!options.help && options.refreshUnsignedTemplate && options.lessonRelease) {
    throw new Error("--refresh-unsigned-template does not accept a lesson-release batch");
  }
  if (!options.help && options.refreshUnsignedTemplate && options.protocolV3) {
    throw new Error("--protocol-v3 uses a parallel successor root and never refreshes an existing kit");
  }
  return options;
}

export function usage() {
  return `Usage: node scripts/scaffold-root-capture-kit.mjs (--spec <file> | --all-ready | --lesson-release <id>) [options]

Options:
  --spec <file>        Exact current indexed ready root trace specification
  --all-ready          Generate/check the reviewed set of 18 ready root requirements
  --lesson-release <id>
                       Select one complete atomic lesson-release root scope
  --player-app <path>  Adobe Flash Player Projector .app to version/hash-bind
  --check              Verify existing kits byte-for-byte without writing
  --reconcile-missing  For --lesson-release only: verify current kits, then transactionally create every missing kit
  --refresh-unsigned-template
                       Archive and atomically refresh only a proven unsigned template
  --protocol-v3       Use the parallel acyclic successor protocol rooted at
                       ${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/; permits initial complete
                       lesson-release generation and never refreshes v1/v2 kits
  -h, --help           Show this help

Output is fixed under ${DEFAULT_ROOT_CAPTURE_KIT_ROOT}/<animation>/<safe-requirement>.
With --protocol-v3, output is fixed under ${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/<animation>/<safe-requirement>.
Stale unsigned templates are archived append-only under ${ROOT_CAPTURE_STALE_ARCHIVE_ROOT}/.
The command never launches a SWF, records runtime observations/signatures, writes migration,
coverage, acceptance, or source files, or promotes a candidate. Its launcher starts only an
empty Projector; the named human must use File -> Open File… for the exact staged source SWF.
Protocol v3 is a one-way DAG: finalized launch receipt -> toolchain receipt -> first
frame/log records -> final attestation. Post-hoc launch/toolchain receipts are forbidden.
The v3 kit is not operator-ready until external named-operator authorization plus the
environment, outside-kit output-root, and fresh storage-capacity preflights are
independently completed for the bounded session.
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const runtime = await inspectProjectorRuntime({playerApp: options.playerApp});
  const results = await scaffoldRootCaptureKits({
    projectRoot: PROJECT_ROOT,
    specFile: options.specFile,
    allReady: options.allReady,
    lessonRelease: options.lessonRelease,
    runtime,
    check: options.check,
    reconcileMissing: options.reconcileMissing,
    refreshUnsignedTemplate: options.refreshUnsignedTemplate,
    protocolV3: options.protocolV3,
  });
  process.stdout.write(`${JSON.stringify({
    status: options.check ? "verified-unsigned-template-only" :
      options.refreshUnsignedTemplate ? "refreshed-unsigned-template-only" :
        options.reconcileMissing ? "reconciled-unsigned-template-only" : "scaffolded-unsigned-template-only",
    count: results.length,
    results: results.map((result) => ({...result, kitRoot: portable(path.relative(PROJECT_ROOT, result.kitRoot))})),
  }, null, 2)}\n`);
  process.stderr.write("Unsigned templates only; no runtime/source-open claim, signature, migration status, review, coverage, or acceptance was recorded.\n");
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
