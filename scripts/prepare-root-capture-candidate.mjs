#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {access, chmod, link, lstat, mkdir, open, readFile, realpath, readdir, rmdir, stat, unlink} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {
  canonicalJson,
  safeRequirementId,
  sha256Text,
} from "./build-course-trace-specs.mjs";
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

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PROOF_MODES = new Set([
  "direct-seek-root-exhaustive",
  "sequential-step-root-exhaustive",
]);
const ADOBE_RUNTIME_LABELS = new Map([
  ["adobe-animate-test-movie", "Adobe Animate Test Movie"],
  ["adobe-flash-player-projector", "Adobe Flash Player Projector"],
  ["adobe-flash-player-legacy-browser", "Adobe Flash Player (Legacy Browser)"],
]);
const RECEIPT_ARTIFACT_KINDS = new Set([
  "product-version-capture",
  "executable-sha256-receipt",
  "workstation-toolchain-log",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ROOT_FRAME_WIDTH = 800;
export const ROOT_FRAME_HEIGHT = 600;
export const ROOT_FRAME_DECODED_BYTES = ROOT_FRAME_WIDTH * ROOT_FRAME_HEIGHT * 4;
export const MAX_ROOT_FRAME_PNG_BYTES = 16 * 1024 * 1024;
export const MAX_ROOT_FRAME_PNG_TOTAL_BYTES = 512 * 1024 * 1024;
export const MAX_ROOT_FRAME_DECODED_TOTAL_BYTES = 512 * 1024 * 1024;
export const DEFAULT_ROOT_CAPTURE_KIT_ROOT = "work/root-capture-kits";
export const DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT = "work/root-capture-kits-v3";
const LESSON_RELEASE_TRACE_SPEC_INDEX_ROOT = "migrations/lesson-release-trace-spec-indexes";
const LESSON_RELEASE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,127}$/u;
export const ROOT_CAPTURE_TEMPLATE_STATUS = "unsigned-template-only-not-evidence";
export const ROOT_PROJECTOR_LAUNCH_PROTOCOL = "two-stage-empty-projector-then-named-human-file-open";
export const ROOT_SOURCE_OPEN_METHOD = "named-human-gui-file-open";
export const ROOT_SOURCE_OPEN_MENU_PATH = Object.freeze(["File", "Open File…"]);
export const ROOT_SOURCE_OPEN_STATEMENT = "本人确认 hash-bound kit 自检通过后，launcher 只启动未带 SWF 参数的空 Adobe Projector；随后我本人通过 File → Open File… 选择所列 staged source SWF，并确认 Player 内容窗口出现；未直接启动 source-assets，也未声称命令行已打开 SWF";
export const ROOT_SOURCE_OPEN_START_STATEMENT = "本人确认 hash-bound kit 自检通过后，launcher 只启动未带 SWF 参数的空 Adobe Projector；随后我本人通过 File → Open File… 选择所列 staged source SWF，并确认 Player 内容窗口出现；本 start receipt 在首帧操作前完成并固定，未直接启动 source-assets，也未声称命令行已打开 SWF";
export const CAPTURE_SESSION_ATTESTATION_STATEMENT = "本人声明这些操作、状态和 PNG 是在同一个 Adobe 运行时会话中现场生成，未事后补写；此声明不等同于运行时来源的独立证明";
export const CAPTURE_SESSION_AUTHORITY_NOTE = "本声明提供具名人工问责和证据绑定；本机验证器不能以密码学方式独立证明 Adobe 运行时真实性，仍需后续人工与 owner 审核。";
export const CANDIDATE_STATUS = "attested-candidate-pending-human-owner";
export const CANDIDATE_AUTHORITY = "limited-named-human-attestation-not-cryptographically-verified";
export const ROOT_CAPTURE_V3_PROTOCOL_NAME = "acyclic-root-capture-evidence-dag-v3";
export const ROOT_CAPTURE_V3_EVIDENCE_ORDER = Object.freeze([
  "capture-kit-and-check",
  "projector-start-and-named-human-source-open",
  "source-open-start-receipt-finalized",
  "runtime-toolchain-receipt-captured",
  "capture-session-attestation-started",
  "operation-display-list-and-frame-records",
  "capture-session-attestation-finalized-and-signed",
]);
export const ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS = Object.freeze([
  "external-named-operator-authorization",
  "authorized-disposable-offline-environment-preflight",
  "outside-kit-session-output-root-preflight",
  "fresh-storage-capacity-preflight",
]);

export function rootCaptureV3ProtocolManifest() {
  return {
    schemaVersion: 3,
    name: ROOT_CAPTURE_V3_PROTOCOL_NAME,
    outputRoot: DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
    launchReceipt: {
      schemaVersion: 3,
      evidenceType: "named-human-hash-bound-root-source-open-start-receipt",
      finalizedBeforeFirstFrame: true,
    },
    evidenceOrder: [...ROOT_CAPTURE_V3_EVIDENCE_ORDER],
    postHocLaunchOrToolchainReceiptsAllowed: false,
    operatorReadiness: {
      operatorReady: false,
      status: "blocked-pending-external-authorization-and-preflight",
      requiredPreflights: [...ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS],
    },
  };
}
export const PROMOTION_REQUIRED = Object.freeze({
  status: "not-implemented",
  requirements: [
    "trusted-signature-or-preregistered-human-identity",
    "externally-verifiable-original-runtime-provenance",
    "independent-downstream-evidence-dag-reverification",
    "explicit-human-and-owner-promotion-decision",
  ],
  statement: "This preparer has no promotion or coverage-adoption capability; candidate evidence remains non-authoritative until every listed requirement is independently satisfied.",
});

function usage() {
  return `Usage: node scripts/prepare-root-capture-candidate.mjs [options]

FAIL-CLOSED PREPARER ONLY: creates an attested candidate pending human/owner
review. It cannot create or promote canonical authoritative evidence.

Required:
  --spec <file>                  Current indexed ready root trace specification
  --operation-log <file>         Append-only hash-chained JSONL runtime operation log
  --frames <directory>           Directory containing the declared native-size PNGs
  --display-list-states <file>   Append-only hash-chained JSONL display-list records
  --launch-receipt <file>        Hash-bound empty-Projector + named-human GUI source-open receipt
  --toolchain-receipt <file>     Human-attested Adobe runtime toolchain receipt
  --capture-session-attestation <file>
                                 Named-human same-session accountability attestation
  --proof-mode <mode>            direct-seek-root-exhaustive or sequential-step-root-exhaustive

Options:
  --project-root <directory>     Project root (default: repository root)
  -h, --help                     Show this help

This preparer is offline and evidence-only. It never starts a GUI/runtime, invents
operations, accepts Ruffle/FFDec/candidate output as authority, changes migration or
coverage status/reviews, or writes under source-assets/.
Unsigned scaffold templates/schema files and every path under work/root-capture-kits/
or work/root-capture-kits-v3/ are rejected; copy and complete real same-session
evidence in a separate directory.

The named-human attestation is an accountability statement with exact artifact
bindings. It is not a cryptographic proof that Adobe produced the evidence; human
and owner review remain separate gates. This command is append-only and never
writes full-frame-coverage.json, the trace spec's expected execution report, or
baseline/original-runtime. --baseline-output, --execution-output,
--archive-output, --candidate-manifest-output, --candidate-report-output,
--update-coverage, and promotion/adoption flags are rejected. Output destinations
are fixed, and every existing output-path component must be a real directory rather
than a symbolic link; path identity is checked again immediately before publication.

The launch receipt must be a completed schema-v3 start receipt outside the unsigned
v3 kit. It binds the exact current v3 kit/check result, empty Projector process start,
named-human File → Open File… selection of the staged byte-identical SWF, observed
Player window, operator, session, timestamps, and canonical receipt hash. It must be
finalized before the toolchain receipt and before capture-session startedAt; post-hoc
launch or toolchain receipts are forbidden.

The toolchain receipt bytes themselves must use the strict top-level schema
schemaVersion/evidenceType/runtime/captureSessionBinding/capturedAt/identityArtifacts;
captureSessionBinding is exactly {sessionId,traceSpecSha256,sourceSwfSha256,
captureKitManifestSha256,launchReceiptSha256}, and
launch.finalizedAt <= receipt.capturedAt <= attestation.startedAt. The final
attestation then binds the complete operation/display-list logs, frame set, endedAt,
and signedAt, preserving a one-way evidence DAG.

Each JSONL operation record must bind schema/type, animationId, requirementId,
proofMode, sessionId, traceSpecSha256, sourceSwfSha256,
captureKitManifestSha256, launchReceiptSha256, toolchainReceiptSha256,
contiguous sequence, in-window wall/monotonic time, the exact attested human,
positioning operation/count/requested+observed root frame, PNG path/hash,
displayListRecordSha256, previousEventSha256, and eventSha256. Each display-list
record carries the same session/spec/source/receipt/human bindings plus its ordered
state/hash/PNG/record chain. Declared evidence paths are portable project-relative
paths and every JSONL file ends with a newline.`;
}

export function portable(value) {
  return value.split(path.sep).join("/");
}

export function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function assertObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object`);
  return value;
}

export function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

export function assertRealSessionArtifactPath(declared, label) {
  assertString(declared, label);
  const normalized = portable(declared);
  if (/(?:^|[./_-])(?:template|schema-template)(?:[./_-]|$)/i.test(normalized)) {
    throw new Error(`${label} must be a real session artifact, not an unsigned template/schema file`);
  }
  return declared;
}

export async function assertOutsideUnsignedRootCaptureKit(root, candidate, label) {
  const [actualRoot, actualCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
  const relative = portable(path.relative(actualRoot, actualCandidate));
  if (
    relative === DEFAULT_ROOT_CAPTURE_KIT_ROOT || relative.startsWith(`${DEFAULT_ROOT_CAPTURE_KIT_ROOT}/`) ||
    relative === DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT || relative.startsWith(`${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/`)
  ) {
    throw new Error(`${label} must be a real session artifact outside the unsigned root-capture kit`);
  }
}

export function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

export function assertExactKeys(value, expected, label) {
  const observed = Object.keys(assertObject(value, label)).sort();
  const wanted = [...expected].sort();
  if (canonicalJson(observed) !== canonicalJson(wanted)) {
    throw new Error(`${label} fields must be exactly: ${wanted.join(", ")}`);
  }
}

export function automationLikeIdentity(value) {
  return /(?:codex|openai|chatgpt|\bai\s*agent\b|github\s*actions?|\bci\b|\bsystem\b|script|automat|generator|machine|robot|\bbot\b|自动|机器人|系统)/i.test(value || "");
}

export async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
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

function pathsOverlap(left, right) {
  return isLexicallyInside(left, right) || isLexicallyInside(right, left);
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export function validateRootFramePngBytes(
  bytes,
  label = "root frame PNG",
  expectedStage = {width: ROOT_FRAME_WIDTH, height: ROOT_FRAME_HEIGHT},
) {
  if (!Buffer.isBuffer(bytes)) throw new Error(`${label} bytes must be a Buffer`);
  const expectedWidth = expectedStage?.width;
  const expectedHeight = expectedStage?.height;
  const expectedDecodedBytes = expectedWidth * expectedHeight * 4;
  if (
    !Number.isInteger(expectedWidth) || expectedWidth < 1 ||
    !Number.isInteger(expectedHeight) || expectedHeight < 1 ||
    !Number.isSafeInteger(expectedDecodedBytes) || expectedDecodedBytes > ROOT_FRAME_DECODED_BYTES
  ) throw new Error(`${label} expected native stage exceeds the root-capture decoded byte limit`);
  if (!bytes.length || bytes.length > MAX_ROOT_FRAME_PNG_BYTES) {
    throw new Error(`${label} exceeds the compressed PNG byte limit`);
  }
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (
    bytes.length < 33 || !bytes.subarray(0, 8).equals(signature) ||
    bytes.readUInt32BE(8) !== 13 || bytes.subarray(12, 16).toString("ascii") !== "IHDR"
  ) throw new Error(`${label} has an invalid PNG signature or IHDR`);
  const declaredWidth = bytes.readUInt32BE(16);
  const declaredHeight = bytes.readUInt32BE(20);
  const declaredDecodedBytes = declaredWidth * declaredHeight * 4;
  if (
    declaredWidth !== expectedWidth || declaredHeight !== expectedHeight ||
    !Number.isSafeInteger(declaredDecodedBytes) || declaredDecodedBytes > expectedDecodedBytes
  ) {
    throw new Error(`${label} IHDR is ${declaredWidth}x${declaredHeight}; expected ${expectedWidth}x${expectedHeight} within the decoded byte limit`);
  }
  let png;
  try {
    png = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  if (
    png.width !== expectedWidth || png.height !== expectedHeight ||
    png.data.length !== expectedDecodedBytes || png.data.length > expectedDecodedBytes
  ) {
    throw new Error(`${label} decoded dimensions or byte length differ from the required ${expectedWidth}x${expectedHeight} RGBA stage`);
  }
  return {
    width: png.width,
    height: png.height,
    compressedBytes: bytes.length,
    decodedBytes: png.data.length,
    sha256: digest(bytes),
  };
}

export function isLexicallyInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function resolveInputPath({root, workspace, declared, label, type = "file", bases}) {
  assertString(declared, label);
  if (declared.includes("\\")) throw new Error(`${label} must use portable path separators`);
  const candidates = path.isAbsolute(declared)
    ? [path.resolve(declared)]
    : (bases || [root]).map((base) => path.resolve(base, declared));
  const matches = [];
  for (const candidate of candidates) {
    if (!isLexicallyInside(candidate, root) || !(await exists(candidate))) continue;
    const info = await stat(candidate);
    if ((type === "directory" && !info.isDirectory()) || (type === "file" && !info.isFile())) continue;
    const actual = await realpath(candidate);
    const actualRoot = await realpath(root);
    if (!isLexicallyInside(actual, actualRoot)) continue;
    matches.push({candidate, actual});
  }
  if (!matches.length) throw new Error(`${label} is missing, wrong-kind, outside the project root, or symlink-escaping`);
  const unique = new Map(matches.map((item) => [item.actual, item]));
  if (unique.size > 1) throw new Error(`${label} is ambiguous between workspace- and project-relative paths`);
  return [...unique.values()][0].candidate;
}

export async function assertNoExistingSymlinkComponents(root, candidate, label) {
  const absoluteRoot = path.resolve(root);
  const absoluteCandidate = path.resolve(candidate);
  if (!isLexicallyInside(absoluteCandidate, absoluteRoot)) throw new Error(`${label} escapes the project root`);
  const rootInfo = await lstat(absoluteRoot);
  if (rootInfo.isSymbolicLink()) throw new Error(`${label} project root must not be a symbolic link`);
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
    if (info.isSymbolicLink()) throw new Error(`${label} contains forbidden symbolic-link component ${portable(path.relative(absoluteRoot, current))}`);
  }
}

export async function resolveFixedOutputPath(root, candidate, label) {
  const absoluteCandidate = path.resolve(candidate);
  if (!isLexicallyInside(absoluteCandidate, root)) throw new Error(`${label} escapes the project root`);
  const sourceRoot = path.join(root, "source-assets");
  if (isLexicallyInside(absoluteCandidate, sourceRoot)) throw new Error(`${label} must not write under source-assets`);
  await assertNoExistingSymlinkComponents(root, absoluteCandidate, label);
  return absoluteCandidate;
}

export async function ensureRealOutputDirectory(root, directory, label) {
  await assertNoExistingSymlinkComponents(root, directory, label);
  await mkdir(directory, {recursive: true});
  await assertNoExistingSymlinkComponents(root, directory, label);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const expectedDirectory = path.resolve(actualRoot, path.relative(root, directory));
  if (actualDirectory !== expectedDirectory) throw new Error(`${label} real path differs from its fixed lexical path`);
  return actualDirectory;
}

async function verifyPublicationPathIdentity({
  root,
  workspace,
  pendingDirectory,
  pendingIdentity,
  archiveDirectory,
  archiveParentIdentity,
  candidateManifestPath,
  candidateReportPath,
  canonicalBaselinePath,
  canonicalExecutionPath,
}) {
  for (const [candidate, label] of [
    [pendingDirectory, "pending requirement directory"],
    [archiveDirectory, "pending archive output"],
    [candidateManifestPath, "candidate manifest output"],
    [candidateReportPath, "candidate report output"],
  ]) await assertNoExistingSymlinkComponents(root, candidate, label);
  const actualRoot = await realpath(root);
  const expectedPending = path.resolve(actualRoot, path.relative(root, pendingDirectory));
  const actualPending = pendingIdentity
    ? (await assertDirectoryIdentity(root, pendingDirectory, pendingIdentity, "pending requirement directory")).realPath
    : await realpath(pendingDirectory);
  if (actualPending !== expectedPending) throw new Error("resolved candidate parent is not the real fixed pending-root-capture directory");
  for (const candidate of [candidateManifestPath, candidateReportPath]) {
    if (await realpath(path.dirname(candidate)) !== actualPending) throw new Error("candidate output real parent differs from the real pending requirement directory");
  }
  const canonicalBaselineDirectory = path.dirname(canonicalBaselinePath);
  const canonicalExecutionDirectory = path.dirname(canonicalExecutionPath);
  for (const canonicalDirectory of [canonicalBaselineDirectory, canonicalExecutionDirectory]) {
    if (await exists(canonicalDirectory)) {
      const actualCanonical = await realpath(canonicalDirectory);
      if (isLexicallyInside(actualPending, actualCanonical)) throw new Error("resolved candidate parent falls inside a canonical baseline/execution directory");
    }
  }
  const expectedArchiveParent = path.resolve(actualRoot, path.relative(root, path.dirname(archiveDirectory)));
  const actualArchiveParent = archiveParentIdentity
    ? (await assertDirectoryIdentity(root, path.dirname(archiveDirectory), archiveParentIdentity, "pending archive parent")).realPath
    : await realpath(path.dirname(archiveDirectory));
  if (actualArchiveParent !== expectedArchiveParent) throw new Error("resolved archive parent is not the real fixed pilot archive directory");
  const canonicalArchiveDirectory = path.join(path.dirname(archiveDirectory), "original-runtime");
  if (await exists(canonicalArchiveDirectory)) {
    const actualCanonicalArchive = await realpath(canonicalArchiveDirectory);
    const intendedArchive = path.join(actualArchiveParent, path.basename(archiveDirectory));
    if (intendedArchive === actualCanonicalArchive || isLexicallyInside(intendedArchive, actualCanonicalArchive)) {
      throw new Error("resolved pending archive output falls inside the canonical original-runtime archive");
    }
  }
  const actualWorkspace = await realpath(workspace);
  if (!isLexicallyInside(actualPending, actualWorkspace)) throw new Error("resolved candidate parent escapes the real migration workspace");
}

export async function readJson(candidate, label) {
  const bytes = await readFile(candidate);
  try {
    return {value: JSON.parse(bytes.toString("utf8")), bytes, sha256: digest(bytes)};
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

export async function readJsonLines(candidate, label) {
  const bytes = await readFile(candidate);
  if (!bytes.length || bytes.at(-1) !== 0x0a) throw new Error(`${label} must be non-empty append-only JSONL ending in a newline`);
  const records = [];
  let start = 0;
  let lineNumber = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0x0a) continue;
    lineNumber += 1;
    const line = bytes.subarray(start, index).toString("utf8").replace(/\r$/, "");
    if (!line.trim()) throw new Error(`${label} contains a blank line at ${lineNumber}`);
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`${label} line ${lineNumber} is not valid JSON: ${error.message}`);
    }
    records.push({record, byteOffset: start, lineNumber});
    start = index + 1;
  }
  return {bytes, sha256: digest(bytes), records};
}

export function recordHash(record, field) {
  const payload = {...record};
  delete payload[field];
  return sha256Text(canonicalJson(payload));
}

export function operationEventSha256(record) {
  return recordHash(record, "eventSha256");
}

export function displayListRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function captureSessionAttestationSha256(attestation) {
  return recordHash(attestation, "attestationSha256");
}

export function rootLaunchReceiptSha256(receipt) {
  return recordHash(receipt, "receiptSha256");
}

export function orderedFrameSetSha256(frames) {
  return sha256Text(canonicalJson(frames));
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function resultSha256(record) {
  return recordHash(record, "resultSha256");
}

function expectedOperation(proofMode, index) {
  if (proofMode === "direct-seek-root-exhaustive") return "direct-seek";
  return index === 0 ? "rewind" : "step-forward";
}

export function requireProjection(binding, {projection, sha256, includedPaths = [], excludedPaths = []}, label) {
  if (
    binding?.hashMode !== CANONICAL_PROJECTION_ENCODING || binding?.projection !== projection || binding?.sha256 !== sha256 ||
    canonicalJson(binding.includedPaths || []) !== canonicalJson(includedPaths) ||
    canonicalJson(binding.excludedPaths || []) !== canonicalJson(excludedPaths)
  ) throw new Error(`${label} current technical projection binding is stale`);
}

export function requirementIdentity(requirement) {
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

export function specIdentity(spec) {
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

function traceSpecIndexContext({relativeSpec, spec, safeId, family}) {
  const pilotSpec = `migrations/${spec.animationId}/audit/trace-specs/${safeId}.json`;
  if (relativeSpec === pilotSpec) {
    return {kind: "pilot", indexRelative: family.indexFile, releaseId: null};
  }
  const releaseMatch = relativeSpec.match(
    /^migrations\/([^/]+)\/audit\/trace-specs\/lesson-releases\/([^/]+)\/([^/]+)\.json$/u,
  );
  if (
    releaseMatch?.[1] !== spec.animationId ||
    releaseMatch?.[3] !== safeId ||
    !LESSON_RELEASE_ID_PATTERN.test(releaseMatch?.[2] || "")
  ) {
    throw new Error(`trace specification path must be ${pilotSpec} or its canonical lesson-release path`);
  }
  return {
    kind: "lesson-release",
    releaseId: releaseMatch[2],
    indexRelative: `${LESSON_RELEASE_TRACE_SPEC_INDEX_ROOT}/${releaseMatch[2]}.json`,
  };
}

async function loadTraceSpecIndex({root, family, context}) {
  const indexPath = path.join(root, context.indexRelative);
  await assertNoExistingSymlinkComponents(root, indexPath, "trace-spec index");
  const indexDocument = await readJson(indexPath, "trace-spec index");
  if (context.kind === "pilot") {
    assertRootTraceSpecIndex(indexDocument.value, family);
  } else if (
    indexDocument.value?.schemaVersion !== 1 ||
    indexDocument.value?.artifactType !== "lesson-release-original-runtime-trace-spec-index" ||
    indexDocument.value?.releaseSelection?.releaseId !== context.releaseId ||
    !Array.isArray(indexDocument.value?.members)
  ) {
    throw new Error("lesson-release trace-spec index is not the exact indexed release schema");
  }
  return {indexPath, indexDocument};
}

async function validateLessonReleaseCatalogBinding({root, spec, index, context}) {
  if (context.kind !== "lesson-release") return null;
  const specBinding = spec.sourceBindings?.lessonReleaseCatalog;
  const indexBinding = index.releaseCatalog;
  if (
    !specBinding || !indexBinding || !same(specBinding, indexBinding) ||
    specBinding.path !== "catalog/lesson-releases.json" ||
    specBinding.releaseId !== context.releaseId || specBinding.schemaVersion !== 1 ||
    !Number.isInteger(specBinding.bytes) || specBinding.bytes < 1 ||
    !SHA256_PATTERN.test(specBinding.sha256 || "") ||
    !SHA256_PATTERN.test(specBinding.releaseFingerprintSha256 || "") ||
    !SHA256_PATTERN.test(specBinding.orderedMemberIdentitySha256 || "")
  ) {
    throw new Error("lesson-release trace spec and index do not share one exact catalog release binding");
  }
  const catalogPath = path.join(root, specBinding.path);
  await assertNoExistingSymlinkComponents(root, catalogPath, "lesson-release catalog");
  const catalogDocument = await readJson(catalogPath, "lesson-release catalog");
  if (
    catalogDocument.sha256 !== specBinding.sha256 ||
    catalogDocument.bytes.length !== specBinding.bytes ||
    catalogDocument.value?.schemaVersion !== specBinding.schemaVersion ||
    !Array.isArray(catalogDocument.value?.releases) ||
    catalogDocument.value.releases.filter(({releaseId}) => releaseId === context.releaseId).length !== 1
  ) {
    throw new Error("lesson-release catalog binding is stale or ambiguous");
  }
  const memberIds = index.members.map(({animationId}) => animationId);
  if (memberIds.some((value) => typeof value !== "string") || new Set(memberIds).size !== memberIds.length) {
    throw new Error("lesson-release trace-spec index contains duplicate or invalid animation members");
  }
  return {path: catalogPath, document: catalogDocument};
}

async function loadBoundTrace({root, specPath}) {
  const specDocument = await readJson(specPath, "trace specification");
  const spec = specDocument.value;
  const family = rootTraceSpecFamily(spec, "trace specification");
  if (
    spec.schemaVersion !== 1 ||
    spec.traceSpecStatus !== "source-frame-accurate-root-ready-for-authoritative-capture" ||
    spec.traceModel?.kind !== "frame-accurate-root-exhaustive" || spec.traceModel?.naturalPlaybackClaimed !== false ||
    spec.schedule?.status !== "not-required-frame-accurate-root" || (spec.schedule?.orderedSteps || []).length ||
    spec.frameDomain?.kind !== "root" || spec.identity?.frameDomainId !== spec.frameDomain?.id ||
    spec.identity?.baselineAuthorityRequirement !== "original-runtime-frame-accurate"
  ) throw new Error("only a ready frame-accurate root trace specification can be prepared as a candidate");
  const first = spec.identity?.requiredRange?.firstFrame;
  const last = spec.identity?.requiredRange?.lastFrame;
  if (first !== 1 || last !== spec.frameDomain.frameCount || !Number.isInteger(last) || last < 1) {
    throw new Error("trace specification must exhaust root frames 1..N");
  }
  const nativeStage = assertRootTraceNativeStage(spec, family, "trace specification");
  const captureRaster = rootTraceCaptureRaster(spec, family, "trace specification");
  const expectedSpecBasename = `${safeRequirementId(spec.requirementId)}.json`;
  const relativeSpec = portable(path.relative(root, specPath));
  const indexContext = traceSpecIndexContext({
    relativeSpec,
    spec,
    safeId: expectedSpecBasename.slice(0, -5),
    family,
  });
  const workspace = path.join(root, "migrations", spec.animationId);
  const [manifestDocument, coverageDocument, inventoryDocument] = await Promise.all([
    readJson(path.join(workspace, "migration.json"), "migration manifest"),
    readJson(path.join(workspace, "evidence", "full-frame-coverage.json"), "full-frame coverage"),
    readJson(path.join(workspace, "audit", "scenario-inventory.json"), "scenario inventory"),
  ]);
  const {value: manifest} = manifestDocument;
  const {value: coverage} = coverageDocument;
  const {value: inventory} = inventoryDocument;
  if (manifest.animationId !== spec.animationId || coverage.animationId !== spec.animationId || inventory.animationId !== spec.animationId) {
    throw new Error("trace specification and current migration documents have different animation identities");
  }
  if (
    manifest.runtime?.stage?.width !== nativeStage.width || manifest.runtime?.stage?.height !== nativeStage.height ||
    manifest.runtime?.fps !== nativeStage.fps || manifest.runtime?.frameCount !== spec.frameDomain.frameCount ||
    manifest.source?.swf !== spec.sourceBindings?.sourceSwf?.path || manifest.source?.swfSha256 !== spec.sourceBindings?.sourceSwf?.sha256
  ) throw new Error("trace specification source/runtime binding differs from migration.json");
  const coverageHash = traceCoverageSha256(coverage);
  requireProjection(spec.sourceBindings?.migrationManifest, {
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(manifest),
    excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
  }, "trace specification migration manifest");
  requireProjection(spec.sourceBindings?.fullFrameCoverage, {
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: coverageHash,
    includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
  }, "trace specification coverage");
  requireProjection(spec.sourceBindings?.scenarioInventory, {
    projection: SCENARIO_INVENTORY_PROJECTION.id,
    sha256: scenarioInventorySha256(inventory),
    excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
  }, "trace specification scenario inventory");
  const requirements = (coverage.requirements || []).filter((item) => item.requirementId === spec.requirementId);
  if (requirements.length === 1) {
    assertStrictFullDomainRequirement(
      requirements[0],
      spec.frameDomain.frameCount,
      `${spec.animationId}/${spec.requirementId} root original-runtime candidate`,
    );
  }
  if (requirements.length !== 1 || canonicalJson(requirementIdentity(requirements[0])) !== canonicalJson(specIdentity(spec))) {
    throw new Error("trace specification identity differs from the unique current coverage requirement");
  }
  const {indexPath, indexDocument} = await loadTraceSpecIndex({root, family, context: indexContext});
  const index = indexDocument.value;
  const lessonReleaseCatalog = await validateLessonReleaseCatalogBinding({
    root,
    spec,
    index,
    context: indexContext,
  });
  const indexedMembers = (
    indexContext.kind === "lesson-release" ? index.members : index.pilots
  ).filter((item) => item.animationId === spec.animationId);
  if (indexedMembers.length !== 1) throw new Error("trace-spec index must contain exactly one matching animation member");
  const indexedSpecs = (indexedMembers[0].traceSpecs || []).filter((item) => item.requirementId === spec.requirementId);
  if (
    indexedSpecs.length !== 1 || indexedSpecs[0].file !== relativeSpec || indexedSpecs[0].sha256 !== specDocument.sha256 ||
    indexedSpecs[0].status !== spec.traceSpecStatus
  ) throw new Error("trace specification is not the exact current indexed specification");
  const expectedExecution = portable(path.relative(root, path.join(workspace, spec.executionEvidence?.expectedExecutionReportPath || "")));
  if (indexedSpecs[0].expectedExecutionReport !== expectedExecution) throw new Error("indexed execution-report path differs from the trace specification");

  const sourcePath = await resolveInputPath({root, workspace, declared: manifest.source.swf, label: "bound source SWF", bases: [root]});
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  if (!isLexicallyInside(sourcePath, preservedRoot) || digest(await readFile(sourcePath)) !== manifest.source.swfSha256) {
    throw new Error("bound source SWF is outside the preserved archive or its SHA-256 is stale");
  }
  return {
    spec,
    specDocument,
    specRelative: relativeSpec,
    workspace,
    manifestDocument,
    coverageDocument,
    inventoryDocument,
    indexDocument,
    indexPath,
    indexRelative: indexContext.indexRelative,
    indexContext,
    lessonReleaseCatalog,
    family,
    nativeStage,
    captureRaster,
    manifest,
    coverage,
    coverageHash,
    requirement: requirements[0],
    sourcePath,
    expectedExecution,
  };
}

export async function verifyReceipt({
  root,
  workspace,
  receiptPath,
  captureSessionBindingFields = [
    "sessionId",
    "traceSpecSha256",
    "sourceSwfSha256",
    "captureKitManifestSha256",
    "launchReceiptSha256",
  ],
}) {
  const document = await readJson(receiptPath, "human-attested Adobe runtime toolchain receipt");
  const receipt = document.value;
  assertExactKeys(receipt, ["schemaVersion", "evidenceType", "runtime", "captureSessionBinding", "capturedAt", "identityArtifacts"], "toolchain receipt");
  if (receipt.schemaVersion !== 1 || receipt.evidenceType !== "human-attested-adobe-runtime-toolchain-receipt") {
    throw new Error("toolchain receipt schema/type is invalid");
  }
  assertExactKeys(receipt.runtime, ["runtimeId", "name", "version"], "toolchain receipt runtime");
  assertExactKeys(receipt.captureSessionBinding, captureSessionBindingFields, "toolchain receipt captureSessionBinding");
  if (!UUID_PATTERN.test(receipt.captureSessionBinding.sessionId || "")) throw new Error("toolchain receipt captureSessionBinding.sessionId must be a UUID");
  for (const field of captureSessionBindingFields) {
    if (field === "sessionId") continue;
    assertSha256(receipt.captureSessionBinding[field], `toolchain receipt captureSessionBinding.${field}`);
  }
  const expectedName = ADOBE_RUNTIME_LABELS.get(receipt.runtime.runtimeId);
  if (!expectedName || receipt.runtime.name !== expectedName || !String(receipt.runtime.version || "").trim()) {
    throw new Error("toolchain receipt runtime label is not recognized for an Adobe capture candidate");
  }
  const capturedAt = Date.parse(receipt.capturedAt || "");
  if (!Number.isFinite(capturedAt) || capturedAt > Date.now() + 5 * 60 * 1000) throw new Error("toolchain receipt capturedAt is invalid or in the future");
  if (!Array.isArray(receipt.identityArtifacts) || !receipt.identityArtifacts.length) throw new Error("toolchain receipt must bind at least one identity artifact");
  const identityArtifacts = [];
  for (const [index, artifact] of receipt.identityArtifacts.entries()) {
    assertExactKeys(artifact, ["kind", "file", "sha256"], `toolchain receipt identityArtifacts[${index}]`);
    if (!RECEIPT_ARTIFACT_KINDS.has(artifact.kind)) throw new Error(`toolchain receipt identityArtifacts[${index}] kind is invalid`);
    assertSha256(artifact.sha256, `toolchain receipt identityArtifacts[${index}].sha256`);
    const artifactPath = await resolveInputPath({
      root,
      workspace,
      declared: artifact.file,
      label: `toolchain receipt identityArtifacts[${index}].file`,
      bases: [workspace, root],
    });
    if (digest(await readFile(artifactPath)) !== artifact.sha256) throw new Error(`toolchain receipt identityArtifacts[${index}] SHA-256 mismatch`);
    identityArtifacts.push({path: artifactPath, sha256: artifact.sha256, label: `toolchain receipt identity artifact ${index + 1}`});
  }
  return {...document, receipt, identityArtifacts};
}

export function validateNamedHuman(operator) {
  assertExactKeys(operator, ["kind", "fullName", "role", "organizationOrOwnerId", "contact"], "capture-session operator");
  if (operator.kind !== "human") throw new Error("capture-session operator.kind must be human");
  for (const field of ["fullName", "role", "organizationOrOwnerId", "contact"]) {
    assertString(operator[field], `capture-session operator.${field}`);
  }
  if (automationLikeIdentity(`${operator.fullName} ${operator.role} ${operator.organizationOrOwnerId} ${operator.contact}`)) {
    throw new Error("capture-session operator must be a named human and must not use an automation-like identity");
  }
}

export function parseSessionTime(value, label) {
  const observed = Date.parse(value || "");
  if (!Number.isFinite(observed) || observed > Date.now() + 5 * 60 * 1000) throw new Error(`${label} is invalid or in the future`);
  return observed;
}

async function readBoundDescriptor({root, workspace, descriptor, label}) {
  assertExactKeys(descriptor, ["file", "sha256"], label);
  assertSha256(descriptor.sha256, `${label}.sha256`);
  const candidate = await resolveInputPath({root, workspace, declared: descriptor.file, label: `${label}.file`, bases: [root]});
  await assertNoExistingSymlinkComponents(root, candidate, `${label}.file`);
  const bytes = await readFile(candidate);
  if (digest(bytes) !== descriptor.sha256) throw new Error(`${label} SHA-256 differs from the bound descriptor`);
  return {path: candidate, bytes, sha256: descriptor.sha256};
}

function expectedRuntimeIdentityText(runtime) {
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

function assertEmptyProjectorLauncher(content, {bound, kitRoot, runtime, stagedSource}) {
  const text = String(content);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const execLines = lines.filter((line) => line.startsWith("exec "));
  const expectedFinal = `exec /usr/bin/sandbox-exec -f ${shellQuote(path.join(kitRoot, "sandbox.sb"))} ${shellQuote(runtime.executablePath)}`;
  if (execLines.length !== 1 || execLines[0] !== lines.at(-1) || execLines[0] !== expectedFinal) {
    throw new Error("root capture-kit launcher must finish by starting only the exact empty Projector without a SWF argument");
  }
  for (const required of [
    process.execPath,
    path.join(path.dirname(scriptPath), "scaffold-root-capture-kit.mjs"),
    "--check",
    "--protocol-v3",
    bound.specRelative,
    runtime.appPath,
    path.join(kitRoot, stagedSource.file),
    "PROCESS LAUNCH ONLY — NOT SOURCE-OPEN EVIDENCE.",
    "PROJECTOR_START_MODE=empty-no-swf-argument",
    "SOURCE_OPEN_MODE=named-human-gui-file-open",
  ]) {
    if (!text.includes(required)) throw new Error("root capture-kit launcher omits a required hash-bound launch component");
  }
  if (/\.swf(?:['"\s]|$)/i.test(execLines[0]) || text.includes("source-assets/")) {
    throw new Error("root capture-kit launcher must not pass a SWF argument or launch source-assets directly");
  }
}

async function verifyRootCaptureKit({root, bound, descriptor, receiptDocument, proofMode}) {
  assertExactKeys(descriptor, ["file", "sha256"], "root launch receipt captureKit");
  const kitRootRelative = portable(path.join(DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT, bound.spec.animationId, safeRequirementId(bound.spec.requirementId)));
  const expectedManifestFile = `${kitRootRelative}/kit-manifest.json`;
  if (descriptor.file !== expectedManifestFile) throw new Error("root launch receipt captureKit is not the fixed current requirement kit manifest");
  const document = await readBoundDescriptor({root, workspace: bound.workspace, descriptor, label: "root capture-kit manifest"});
  let manifest;
  try {
    manifest = JSON.parse(document.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`root capture-kit manifest is invalid JSON: ${error.message}`);
  }
  const fractionalCaptureRaster = (
    bound.captureRaster.width !== bound.spec.frameDomain.nativeStage.width ||
    bound.captureRaster.height !== bound.spec.frameDomain.nativeStage.height
  );
  assertExactKeys(manifest, [
    "schemaVersion", "artifactType", "status", "notEvidence", "strictAcceptanceEffect",
    "migrationStatusChanged", "humanReviewRecorded", "ownerReviewRecorded", "animationId",
    "requirementId", "identity", "frameDomain", "bindings", "runtime", "stagedSource",
    "launchContract", "evidenceProtocol", "acceptedProofModes", "expectedEvidenceCounts", "templates", "statement",
    ...(fractionalCaptureRaster ? ["captureRaster"] : []),
  ], "root capture-kit manifest");
  if (
    manifest.schemaVersion !== 1 || manifest.artifactType !== "root-frame-accurate-capture-operator-kit" ||
    manifest.status !== ROOT_CAPTURE_TEMPLATE_STATUS || manifest.notEvidence !== true ||
    manifest.strictAcceptanceEffect !== false || manifest.migrationStatusChanged !== false ||
    manifest.humanReviewRecorded !== false || manifest.ownerReviewRecorded !== false ||
    manifest.animationId !== bound.spec.animationId || manifest.requirementId !== bound.spec.requirementId ||
    !same(manifest.identity, bound.spec.identity) || !same(manifest.frameDomain, bound.spec.frameDomain)
  ) throw new Error("root capture-kit manifest identity or unsigned non-authority boundary is invalid");
  if (!same(manifest.evidenceProtocol, rootCaptureV3ProtocolManifest())) {
    throw new Error("root capture-kit does not bind the exact acyclic protocol-v3 DAG and fixed v3 output root");
  }
  if (fractionalCaptureRaster) {
    assertExactKeys(manifest.captureRaster, ["rule", "width", "height"], "root capture-kit captureRaster");
    if (!same(manifest.captureRaster, bound.captureRaster) || manifest.captureRaster.rule !== ROOT_CAPTURE_RASTERIZATION_RULE) {
      throw new Error("root capture-kit capture raster differs from the exact source-native stage projection");
    }
  }
  const expectedTemplates = [
    "templates/runtime-toolchain-receipt.template.json",
    "templates/source-open-launch-receipt.template.json",
    "templates/capture-session-attestation.template.json",
    "templates/operation-log.schema.template.jsonl",
    "templates/display-list-states.schema.template.jsonl",
  ];
  if (
    !same(manifest.templates, expectedTemplates) ||
    manifest.statement !== "This deterministic unsigned kit prepares a future session. It neither launches a SWF nor supplies evidence, review, acceptance, or authority."
  ) throw new Error("root capture-kit manifest template inventory or non-evidence statement is invalid");

  assertExactKeys(manifest.bindings, [
    "traceSpec", "traceSpecIndex", "sourceSwf", "migrationManifest", "fullFrameCoverage", "scenarioInventory",
  ], "root capture-kit bindings");
  assertExactKeys(manifest.bindings.traceSpec, ["file", "sha256"], "root capture-kit traceSpec binding");
  assertExactKeys(manifest.bindings.traceSpecIndex, ["file", "sha256"], "root capture-kit traceSpecIndex binding");
  assertExactKeys(manifest.bindings.sourceSwf, ["file", "sha256", "bytes"], "root capture-kit sourceSwf binding");
  const sourceBytes = await readFile(bound.sourcePath);
  const expectedCoreBindings = {
    traceSpec: {file: bound.specRelative, sha256: bound.specDocument.sha256},
    traceSpecIndex: {file: bound.indexRelative, sha256: bound.indexDocument.sha256},
    sourceSwf: {file: bound.spec.sourceBindings.sourceSwf.path, sha256: bound.spec.sourceBindings.sourceSwf.sha256, bytes: sourceBytes.length},
  };
  for (const key of Object.keys(expectedCoreBindings)) {
    if (!same(manifest.bindings[key], expectedCoreBindings[key])) throw new Error(`root capture-kit ${key} binding is stale`);
  }
  const projectedBindings = [
    ["migrationManifest", bound.spec.sourceBindings.migrationManifest],
    ["fullFrameCoverage", bound.spec.sourceBindings.fullFrameCoverage],
    ["scenarioInventory", bound.spec.sourceBindings.scenarioInventory],
  ];
  for (const [key, expected] of projectedBindings) {
    assertExactKeys(manifest.bindings[key], ["file", "projection", "hashMode", "sha256"], `root capture-kit ${key} binding`);
    const normalizedExpected = {file: portable(path.join("migrations", bound.spec.animationId, expected.path)), projection: expected.projection, hashMode: expected.hashMode, sha256: expected.sha256};
    if (!same(manifest.bindings[key], normalizedExpected)) throw new Error(`root capture-kit ${key} projection binding is stale`);
  }

  assertExactKeys(manifest.runtime, [
    "runtimeId", "name", "version", "requestedAppPath", "appPath", "executablePath",
    "executableSha256", "identityReceipt", "launcherNodeExecutable",
  ], "root capture-kit runtime");
  if (
    manifest.runtime.runtimeId !== "adobe-flash-player-projector" || manifest.runtime.name !== "Adobe Flash Player Projector" ||
    !String(manifest.runtime.version || "").trim() || !path.isAbsolute(manifest.runtime.appPath || "") ||
    !path.isAbsolute(manifest.runtime.executablePath || "") || !same(receiptDocument.receipt.runtime, {
      runtimeId: manifest.runtime.runtimeId,
      name: manifest.runtime.name,
      version: manifest.runtime.version,
    })
  ) throw new Error("root capture-kit runtime differs from the Adobe Projector toolchain receipt");
  assertSha256(manifest.runtime.executableSha256, "root capture-kit runtime.executableSha256");
  const executableBytes = await readFile(manifest.runtime.executablePath).catch(() => {
    throw new Error("root capture-kit bound Projector executable is missing");
  });
  if (digest(executableBytes) !== manifest.runtime.executableSha256) throw new Error("root capture-kit bound Projector executable SHA-256 is stale");
  const [realApp, realExecutable] = await Promise.all([
    realpath(manifest.runtime.appPath).catch(() => { throw new Error("root capture-kit bound Projector app is missing"); }),
    realpath(manifest.runtime.executablePath),
  ]);
  const executableRelative = path.relative(path.join(realApp, "Contents", "MacOS"), realExecutable);
  if (!executableRelative || executableRelative === ".." || executableRelative.startsWith(`..${path.sep}`) || path.isAbsolute(executableRelative)) {
    throw new Error("root capture-kit bound Projector executable is outside its .app/Contents/MacOS directory");
  }
  assertExactKeys(manifest.runtime.launcherNodeExecutable, ["path", "sha256"], "root capture-kit launcherNodeExecutable");
  if (
    manifest.runtime.launcherNodeExecutable.path !== process.execPath ||
    digest(await readFile(process.execPath)) !== manifest.runtime.launcherNodeExecutable.sha256
  ) throw new Error("root capture-kit launcher Node executable is stale");

  const kitRoot = path.join(root, kitRootRelative);
  assertExactKeys(manifest.runtime.identityReceipt, ["file", "sha256"], "root capture-kit runtime identityReceipt");
  const expectedIdentityFile = `${kitRootRelative}/runtime/runtime-executable-sha256.txt`;
  if (manifest.runtime.identityReceipt.file !== expectedIdentityFile) throw new Error("root capture-kit runtime identity receipt path is not fixed");
  const identityDocument = await readBoundDescriptor({root, workspace: bound.workspace, descriptor: manifest.runtime.identityReceipt, label: "root capture-kit runtime identity receipt"});
  if (identityDocument.bytes.toString("utf8") !== expectedRuntimeIdentityText(manifest.runtime)) {
    throw new Error("root capture-kit runtime identity receipt content is stale");
  }

  assertExactKeys(manifest.stagedSource, ["source", "staged", "copiedByteForByte", "sourceAssetsLaunchedDirectly"], "root capture-kit stagedSource");
  assertExactKeys(manifest.stagedSource.source, ["file", "sha256", "bytes"], "root capture-kit stagedSource.source");
  assertExactKeys(manifest.stagedSource.staged, ["file", "sha256", "bytes"], "root capture-kit stagedSource.staged");
  const stagedSource = {file: "runtime-source/source.swf", sha256: bound.spec.sourceBindings.sourceSwf.sha256, bytes: sourceBytes.length};
  if (
    !same(manifest.stagedSource.source, expectedCoreBindings.sourceSwf) || !same(manifest.stagedSource.staged, stagedSource) ||
    manifest.stagedSource.copiedByteForByte !== true || manifest.stagedSource.sourceAssetsLaunchedDirectly !== false
  ) throw new Error("root capture-kit staged source declaration is invalid");
  const stagedPath = path.join(kitRoot, stagedSource.file);
  await assertNoExistingSymlinkComponents(root, stagedPath, "root capture-kit staged source");
  const stagedBytes = await readFile(stagedPath);
  if (stagedBytes.length !== sourceBytes.length || digest(stagedBytes) !== stagedSource.sha256 || !stagedBytes.equals(sourceBytes)) {
    throw new Error("root capture-kit staged source is not byte-identical to the preserved source SWF");
  }

  assertExactKeys(manifest.launchContract, [
    "protocol", "launcher", "launcherStartsEmptyProjector", "commandLineSwfArgumentProvided",
    "commandLineSourceOpenClaimed", "sourceOpen", "deniedSideEffects",
  ], "root capture-kit launchContract");
  assertExactKeys(manifest.launchContract.sourceOpen, ["method", "menuPath", "selectedSource", "requiresNamedHumanObservation"], "root capture-kit launchContract.sourceOpen");
  if (
    manifest.launchContract.protocol !== ROOT_PROJECTOR_LAUNCH_PROTOCOL || manifest.launchContract.launcher !== "launch-projector-empty.sh" ||
    manifest.launchContract.launcherStartsEmptyProjector !== true || manifest.launchContract.commandLineSwfArgumentProvided !== false ||
    manifest.launchContract.commandLineSourceOpenClaimed !== false || manifest.launchContract.sourceOpen.method !== ROOT_SOURCE_OPEN_METHOD ||
    !same(manifest.launchContract.sourceOpen.menuPath, ROOT_SOURCE_OPEN_MENU_PATH) ||
    !same(manifest.launchContract.sourceOpen.selectedSource, stagedSource) ||
    manifest.launchContract.sourceOpen.requiresNamedHumanObservation !== true ||
    !same(manifest.launchContract.deniedSideEffects, ["network", "apple-events"])
  ) throw new Error("root capture-kit two-stage launch contract is invalid");
  if (!same(manifest.acceptedProofModes, bound.spec.traceModel.positioningProofModes) || !manifest.acceptedProofModes.includes(proofMode)) {
    throw new Error("root capture-kit does not bind the selected root positioning proof mode");
  }
  const expectedCount = bound.spec.frameDomain.frameCount;
  if (!same(manifest.expectedEvidenceCounts, {frames: expectedCount, operationRecords: expectedCount, displayListRecords: expectedCount})) {
    throw new Error("root capture-kit evidence counts differ from the current root trace spec");
  }

  const launcherPath = path.join(kitRoot, "launch-projector-empty.sh");
  const sandboxPath = path.join(kitRoot, "sandbox.sb");
  await Promise.all([
    assertNoExistingSymlinkComponents(root, launcherPath, "root capture-kit launcher"),
    assertNoExistingSymlinkComponents(root, sandboxPath, "root capture-kit sandbox"),
  ]);
  const [launcherBytes, sandboxBytes] = await Promise.all([readFile(launcherPath), readFile(sandboxPath)]);
  assertEmptyProjectorLauncher(launcherBytes.toString("utf8"), {bound, kitRoot, runtime: manifest.runtime, stagedSource});
  if (sandboxBytes.toString("utf8") !== "(version 1)\n(allow default)\n(deny network*)\n(deny appleevent-send)\n") {
    throw new Error("root capture-kit sandbox profile is stale or missing network/Apple-event denials");
  }
  return {
    descriptor,
    manifest,
    path: document.path,
    bytes: document.bytes,
    sha256: document.sha256,
    kitRoot,
    kitRootRelative,
    stagedPath,
    launcher: {path: launcherPath, bytes: launcherBytes, sha256: digest(launcherBytes)},
    sandbox: {path: sandboxPath, bytes: sandboxBytes, sha256: digest(sandboxBytes)},
    identityDocument,
  };
}

async function verifyRootKitCheck({root, bound, descriptor, captureKitDocument}) {
  const document = await readBoundDescriptor({root, workspace: bound.workspace, descriptor, label: "root launch kit-check receipt"});
  let value;
  try {
    value = JSON.parse(document.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`root launch kit-check receipt is invalid JSON: ${error.message}`);
  }
  assertExactKeys(value, ["status", "count", "results"], "root launch kit-check receipt");
  if (value.status !== "verified-unsigned-template-only" || value.count !== 1 || !Array.isArray(value.results) || value.results.length !== 1) {
    throw new Error("root launch kit-check receipt must contain exactly one verified requirement result");
  }
  const result = value.results[0];
  assertExactKeys(result, [
    "status", "kitRoot", "animationId", "requirementId", "traceSpecSha256", "sourceSwfSha256",
    "runtimeExecutableSha256", "captureKitManifestSha256", "launcherSha256", "sandboxProfileSha256",
    "stagedSourceSha256", "nodeExecutableSha256", "runtimeIdentityReceiptSha256",
    "strictAcceptanceEffect", "migrationStatusChanged",
  ], "root launch kit-check result");
  const expected = {
    status: "verified-unsigned-template-only",
    kitRoot: captureKitDocument.kitRootRelative,
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    traceSpecSha256: bound.specDocument.sha256,
    sourceSwfSha256: bound.spec.sourceBindings.sourceSwf.sha256,
    runtimeExecutableSha256: captureKitDocument.manifest.runtime.executableSha256,
    captureKitManifestSha256: captureKitDocument.sha256,
    launcherSha256: captureKitDocument.launcher.sha256,
    sandboxProfileSha256: captureKitDocument.sandbox.sha256,
    stagedSourceSha256: digest(await readFile(captureKitDocument.stagedPath)),
    nodeExecutableSha256: captureKitDocument.manifest.runtime.launcherNodeExecutable.sha256,
    runtimeIdentityReceiptSha256: captureKitDocument.identityDocument.sha256,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
  if (!same(result, expected)) throw new Error("root launch kit-check receipt does not prove the exact current kit");
  return {...document, value};
}

async function verifyRootLaunchReceipt({
  root,
  bound,
  descriptor,
  expectedPath,
  attestation,
  receiptDocument,
  proofMode,
  startedAtMs,
}) {
  if (descriptor?.file !== portable(path.relative(root, expectedPath))) {
    throw new Error("root launch receipt path differs from the supplied evidence path");
  }
  const document = await readBoundDescriptor({root, workspace: bound.workspace, descriptor, label: "root source-open launch receipt"});
  let receipt;
  try {
    receipt = JSON.parse(document.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`root source-open launch receipt is invalid JSON: ${error.message}`);
  }
  assertExactKeys(receipt, [
    "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "captureKit",
    "runtime", "kitCheck", "launchProtocol", "projectorStart", "sourceOpen", "finalizedAt",
    "operator", "statement", "receiptSha256",
  ], "root source-open launch receipt");
  if (
    receipt.schemaVersion !== 3 || receipt.evidenceType !== "named-human-hash-bound-root-source-open-start-receipt" ||
    receipt.sessionId !== attestation.sessionId || receipt.animationId !== bound.spec.animationId ||
    receipt.requirementId !== bound.spec.requirementId || receipt.statement !== ROOT_SOURCE_OPEN_START_STATEMENT ||
    receipt.receiptSha256 !== rootLaunchReceiptSha256(receipt)
  ) throw new Error("root source-open launch receipt schema, identity, statement, or canonical hash is invalid");
  validateNamedHuman(receipt.operator);
  if (!same(receipt.operator, attestation.operator)) throw new Error("root source-open launch receipt operator differs from the capture-session operator");
  const captureKitDocument = await verifyRootCaptureKit({root, bound, descriptor: receipt.captureKit, receiptDocument, proofMode});
  assertExactKeys(receipt.runtime, ["runtimeId", "name", "version", "executableSha256"], "root source-open launch receipt runtime");
  const expectedRuntime = {
    runtimeId: captureKitDocument.manifest.runtime.runtimeId,
    name: captureKitDocument.manifest.runtime.name,
    version: captureKitDocument.manifest.runtime.version,
    executableSha256: captureKitDocument.manifest.runtime.executableSha256,
  };
  if (!same(receipt.runtime, expectedRuntime)) throw new Error("root source-open launch receipt runtime differs from the exact current capture kit");
  const kitCheck = await verifyRootKitCheck({root, bound, descriptor: receipt.kitCheck, captureKitDocument});
  assertExactKeys(receipt.projectorStart, ["executablePath", "swfArgument", "processId", "startedAt"], "root source-open launch receipt projectorStart");
  assertExactKeys(receipt.sourceOpen, ["method", "menuPath", "selectedSource", "openedAt", "playerWindowObserved"], "root source-open launch receipt sourceOpen");
  const launchContractFailures = [
    [receipt.launchProtocol === ROOT_PROJECTOR_LAUNCH_PROTOCOL, "protocol"],
    [receipt.projectorStart.executablePath === captureKitDocument.manifest.runtime.executablePath, "executable"],
    [receipt.projectorStart.swfArgument === null, "swfArgument"],
    [Number.isInteger(receipt.projectorStart.processId) && receipt.projectorStart.processId > 0, "processId"],
    [receipt.sourceOpen.method === ROOT_SOURCE_OPEN_METHOD, "method"],
    [same(receipt.sourceOpen.menuPath, ROOT_SOURCE_OPEN_MENU_PATH), "menuPath"],
    [same(receipt.sourceOpen.selectedSource, captureKitDocument.manifest.stagedSource.staged), "selectedSource"],
    [receipt.sourceOpen.playerWindowObserved === true, "playerWindowObserved"],
  ].filter(([passed]) => !passed).map(([, label]) => label);
  if (launchContractFailures.length) {
    throw new Error(`root source-open launch receipt does not prove the exact two-stage empty-Projector + named-human GUI source-open contract (${launchContractFailures.join(", ")})`);
  }
  const launchedAtMs = parseSessionTime(receipt.projectorStart.startedAt, "root source-open launch receipt projectorStart.startedAt");
  const openedAtMs = parseSessionTime(receipt.sourceOpen.openedAt, "root source-open launch receipt sourceOpen.openedAt");
  const finalizedAtMs = parseSessionTime(receipt.finalizedAt, "root source-open launch receipt finalizedAt");
  if (
    openedAtMs < launchedAtMs || finalizedAtMs < openedAtMs || finalizedAtMs > startedAtMs
  ) {
    throw new Error("root source-open launch receipt chronology must satisfy projector.startedAt <= sourceOpen.openedAt <= finalizedAt <= attestation.startedAt");
  }
  return {...document, receipt, captureKitDocument, kitCheck, launchedAtMs, openedAtMs, finalizedAtMs};
}

async function verifyCaptureSessionAttestation({
  root,
  bound,
  attestationPath,
  operationLogPath,
  displayListPath,
  framesDirectory,
  launchReceiptPath,
  receiptPath,
  receiptDocument,
  proofMode,
}) {
  const document = await readJson(attestationPath, "capture-session attestation");
  const attestation = document.value;
  assertExactKeys(attestation, [
    "schemaVersion",
    "evidenceType",
    "sessionId",
    "animationId",
    "requirementId",
    "proofMode",
    "traceSpec",
    "sourceSwf",
    "launchReceipt",
    "toolchainReceipt",
    "operationLog",
    "displayListRecords",
    "frameSet",
    "startedAt",
    "endedAt",
    "signedAt",
    "monotonicTimeOrigin",
    "operator",
    "statement",
    "notes",
    "attestationSha256",
  ], "capture-session attestation");
  if (
    attestation.schemaVersion !== 1 ||
    attestation.evidenceType !== "named-human-root-capture-session-attestation"
  ) throw new Error("capture-session attestation schema/type is invalid");
  if (!UUID_PATTERN.test(attestation.sessionId || "")) throw new Error("capture-session attestation sessionId must be a UUID");
  if (
    attestation.animationId !== bound.spec.animationId ||
    attestation.requirementId !== bound.spec.requirementId ||
    attestation.proofMode !== proofMode
  ) throw new Error("capture-session attestation animation/requirement/proofMode identity mismatch");
  if (attestation.attestationSha256 !== captureSessionAttestationSha256(attestation)) {
    throw new Error("capture-session attestation SHA-256 does not match its canonical content");
  }
  if (attestation.statement !== CAPTURE_SESSION_ATTESTATION_STATEMENT) throw new Error("capture-session attestation first-person statement is missing or changed");
  if (attestation.notes !== CAPTURE_SESSION_AUTHORITY_NOTE) throw new Error("capture-session attestation authority limitation note is missing or changed");
  if (attestation.monotonicTimeOrigin !== "milliseconds-since-session-start") {
    throw new Error("capture-session attestation monotonicTimeOrigin must be milliseconds-since-session-start");
  }
  validateNamedHuman(attestation.operator);
  const startedAtMs = parseSessionTime(attestation.startedAt, "capture-session startedAt");
  const endedAtMs = parseSessionTime(attestation.endedAt, "capture-session endedAt");
  const signedAtMs = parseSessionTime(attestation.signedAt, "capture-session signedAt");
  if (endedAtMs <= startedAtMs) throw new Error("capture-session endedAt must be later than startedAt");
  if (signedAtMs < endedAtMs || signedAtMs - endedAtMs > 30 * 60 * 1000) {
    throw new Error("capture-session signedAt must be at or within 30 minutes after endedAt");
  }
  const relative = (candidate) => portable(path.relative(root, candidate));
  assertExactKeys(attestation.traceSpec, ["file", "sha256"], "capture-session traceSpec");
  if (attestation.traceSpec.file !== bound.specRelative || attestation.traceSpec.sha256 !== bound.specDocument.sha256) {
    throw new Error("capture-session traceSpec path/SHA-256 differs from the current indexed trace spec");
  }
  assertExactKeys(attestation.sourceSwf, ["path", "sha256"], "capture-session sourceSwf");
  if (
    attestation.sourceSwf.path !== bound.spec.sourceBindings.sourceSwf.path ||
    attestation.sourceSwf.sha256 !== bound.spec.sourceBindings.sourceSwf.sha256
  ) throw new Error("capture-session source SWF path/SHA-256 differs from the bound source");
  assertExactKeys(attestation.launchReceipt, ["file", "sha256"], "capture-session launchReceipt");
  const launchDocument = await verifyRootLaunchReceipt({
    root,
    bound,
    descriptor: attestation.launchReceipt,
    expectedPath: launchReceiptPath,
    attestation,
    receiptDocument,
    proofMode,
    startedAtMs,
  });
  assertExactKeys(attestation.toolchainReceipt, ["file", "sha256", "runtime", "captureSessionBinding"], "capture-session toolchainReceipt");
  assertExactKeys(attestation.toolchainReceipt.runtime, ["runtimeId", "name", "version"], "capture-session toolchainReceipt.runtime");
  assertExactKeys(attestation.toolchainReceipt.captureSessionBinding, [
    "sessionId", "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
  ], "capture-session toolchainReceipt.captureSessionBinding");
  if (
    attestation.toolchainReceipt.file !== relative(receiptPath) ||
    attestation.toolchainReceipt.sha256 !== receiptDocument.sha256 ||
    canonicalJson(attestation.toolchainReceipt.runtime) !== canonicalJson(receiptDocument.receipt.runtime) ||
    canonicalJson(attestation.toolchainReceipt.captureSessionBinding) !== canonicalJson(receiptDocument.receipt.captureSessionBinding) ||
    attestation.toolchainReceipt.captureSessionBinding.sessionId !== attestation.sessionId ||
    attestation.toolchainReceipt.captureSessionBinding.traceSpecSha256 !== bound.specDocument.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.sourceSwfSha256 !== bound.spec.sourceBindings.sourceSwf.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.captureKitManifestSha256 !== launchDocument.captureKitDocument.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.launchReceiptSha256 !== launchDocument.sha256
  ) throw new Error("capture-session toolchain receipt path/hash/runtime identity mismatch");
  const receiptCapturedAtMs = parseSessionTime(receiptDocument.receipt.capturedAt, "toolchain receipt capturedAt");
  if (receiptCapturedAtMs < launchDocument.finalizedAtMs || receiptCapturedAtMs > startedAtMs) {
    throw new Error("toolchain receipt chronology must satisfy launch.finalizedAt <= capturedAt <= attestation.startedAt");
  }
  for (const [field, candidate, chainField, countField] of [
    ["operationLog", operationLogPath, "finalEventSha256", "eventCount"],
    ["displayListRecords", displayListPath, "finalRecordSha256", "recordCount"],
  ]) {
    assertExactKeys(attestation[field], ["file", "sha256", chainField, countField], `capture-session ${field}`);
    if (attestation[field].file !== relative(candidate)) throw new Error(`capture-session ${field}.file differs from the supplied evidence path`);
    assertSha256(attestation[field].sha256, `capture-session ${field}.sha256`);
    assertSha256(attestation[field][chainField], `capture-session ${field}.${chainField}`);
    if (!Number.isInteger(attestation[field][countField]) || attestation[field][countField] < 1) {
      throw new Error(`capture-session ${field}.${countField} must be a positive integer`);
    }
  }
  assertExactKeys(attestation.frameSet, ["algorithm", "frameCount", "frames", "sha256"], "capture-session frameSet");
  if (attestation.frameSet.algorithm !== "ordered-frame-path-sha256-v1") throw new Error("capture-session frameSet algorithm is invalid");
  if (!Array.isArray(attestation.frameSet.frames) || attestation.frameSet.frames.length !== bound.spec.frameDomain.frameCount) {
    throw new Error("capture-session frameSet must contain every root frame");
  }
  if (attestation.frameSet.frameCount !== attestation.frameSet.frames.length) throw new Error("capture-session frameSet.frameCount mismatch");
  for (const [index, frame] of attestation.frameSet.frames.entries()) {
    assertExactKeys(frame, ["frame", "file", "sha256"], `capture-session frameSet.frames[${index}]`);
    if (frame.frame !== index + 1) throw new Error("capture-session frameSet frames must be one-indexed and ordered");
    assertSha256(frame.sha256, `capture-session frameSet.frames[${index}].sha256`);
    const framePath = await resolveInputPath({root, workspace: bound.workspace, declared: frame.file, label: `capture-session frameSet.frames[${index}].file`, bases: [root]});
    if (!isLexicallyInside(await realpath(framePath), await realpath(framesDirectory))) {
      throw new Error(`capture-session frameSet.frames[${index}] escapes the supplied frames directory`);
    }
  }
  if (attestation.frameSet.sha256 !== orderedFrameSetSha256(attestation.frameSet.frames)) {
    throw new Error("capture-session frameSet SHA-256 mismatch");
  }
  return {
    ...document,
    attestation,
    startedAtMs,
    endedAtMs,
    signedAtMs,
    durationMs: endedAtMs - startedAtMs,
    launchDocument,
  };
}

async function verifyEvidenceInputs({
  root,
  workspace,
  spec,
  captureRaster,
  proofMode,
  operationLogPath,
  framesDirectory,
  displayListPath,
  attestationDocument,
}) {
  const operationLog = await readJsonLines(operationLogPath, "operation log");
  const displayListLog = await readJsonLines(displayListPath, "display-list state records");
  const expectedCount = spec.frameDomain.frameCount;
  if (operationLog.records.length !== expectedCount) throw new Error(`operation log must contain exactly ${expectedCount} root-frame records`);
  if (displayListLog.records.length !== expectedCount) throw new Error(`display-list state records must contain exactly ${expectedCount} records`);
  const frameEntries = await readdir(framesDirectory, {withFileTypes: true});
  if (
    frameEntries.length !== expectedCount ||
    frameEntries.some((item) => !item.isFile() || !item.name.toLowerCase().endsWith(".png"))
  ) throw new Error(`frames directory must contain exactly ${expectedCount} regular PNG files and no other entries`);
  const seenPngPaths = new Set();
  let priorEventHash = null;
  let priorStateHash = null;
  let priorEventTime = -Infinity;
  let priorStateTime = -Infinity;
  let priorOccurredAt = -Infinity;
  let priorStateOccurredAt = -Infinity;
  const attestation = attestationDocument.attestation;
  const sessionBinding = {
    sessionId: attestation.sessionId,
    traceSpecSha256: attestation.traceSpec.sha256,
    sourceSwfSha256: attestation.sourceSwf.sha256,
    captureKitManifestSha256: attestation.toolchainReceipt.captureSessionBinding.captureKitManifestSha256,
    launchReceiptSha256: attestation.launchReceipt.sha256,
    toolchainReceiptSha256: attestation.toolchainReceipt.sha256,
  };
  const frames = [];
  let totalCompressedPngBytes = 0;
  let totalDecodedPngBytes = 0;
  for (let index = 0; index < expectedCount; index += 1) {
    const expectedFrame = index + 1;
    const operationItem = operationLog.records[index];
    const event = assertObject(operationItem.record, `operation log line ${operationItem.lineNumber}`);
    const stateItem = displayListLog.records[index];
    const state = assertObject(stateItem.record, `display-list record line ${stateItem.lineNumber}`);
    assertExactKeys(event, [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
      "toolchainReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs", "operator", "operation",
      "operationCountSincePrevious", "requestedRootFrame", "observedRootFrame", "screenshotFile",
      "screenshotSha256", "displayListRecordSha256", "previousEventSha256", "eventSha256",
    ], `operation log line ${operationItem.lineNumber}`);
    assertExactKeys(state, [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "captureKitManifestSha256", "launchReceiptSha256",
      "toolchainReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs", "operator", "frameDomainId",
      "observedRootFrame", "displayListState", "displayListStateSha256", "screenshotSha256",
      "previousRecordSha256", "recordSha256",
    ], `display-list record line ${stateItem.lineNumber}`);
    if (
      event.schemaVersion !== 1 || event.evidenceType !== "attested-root-frame-operation" ||
      event.animationId !== spec.animationId || event.requirementId !== spec.requirementId || event.proofMode !== proofMode ||
      event.sessionId !== sessionBinding.sessionId || event.traceSpecSha256 !== sessionBinding.traceSpecSha256 ||
      event.sourceSwfSha256 !== sessionBinding.sourceSwfSha256 ||
      event.captureKitManifestSha256 !== sessionBinding.captureKitManifestSha256 ||
      event.launchReceiptSha256 !== sessionBinding.launchReceiptSha256 ||
      event.toolchainReceiptSha256 !== sessionBinding.toolchainReceiptSha256 ||
      event.sequence !== expectedFrame || event.previousEventSha256 !== priorEventHash || event.eventSha256 !== operationEventSha256(event)
    ) throw new Error(`operation log hash/identity/sequence chain is invalid at frame ${expectedFrame}`);
    if (
      event.operation !== expectedOperation(proofMode, index) || event.operationCountSincePrevious !== 1 ||
      event.requestedRootFrame !== expectedFrame || event.observedRootFrame !== expectedFrame
    ) throw new Error(`operation log frame ${expectedFrame} violates the ${proofMode} Rewind/Step/direct-seek contract`);
    if (
      !Number.isFinite(event.monotonicTimeMs) || event.monotonicTimeMs <= priorEventTime || event.monotonicTimeMs < 0 ||
      event.monotonicTimeMs > attestationDocument.durationMs
    ) throw new Error(`operation log frame ${expectedFrame} monotonicTimeMs is not strictly increasing within the session window`);
    const occurredAt = Date.parse(event.occurredAt || "");
    if (
      !Number.isFinite(occurredAt) || occurredAt < priorOccurredAt ||
      occurredAt < attestationDocument.startedAtMs || occurredAt > attestationDocument.endedAtMs
    ) {
      throw new Error(`operation log frame ${expectedFrame} occurredAt is invalid, non-monotonic, or outside the session window`);
    }
    if (Math.abs((occurredAt - attestationDocument.startedAtMs) - event.monotonicTimeMs) > 1) {
      throw new Error(`operation log frame ${expectedFrame} wall-clock and monotonic times do not identify the same session instant`);
    }
    if (canonicalJson(event.operator) !== canonicalJson(attestation.operator)) throw new Error("operation log operator differs from the named-human session attestation");
    assertSha256(event.screenshotSha256, `operation log frame ${expectedFrame}.screenshotSha256`);
    assertSha256(event.displayListRecordSha256, `operation log frame ${expectedFrame}.displayListRecordSha256`);

    if (
      state.schemaVersion !== 1 || state.evidenceType !== "attested-display-list-state" ||
      state.animationId !== spec.animationId || state.requirementId !== spec.requirementId || state.proofMode !== proofMode || state.sequence !== expectedFrame ||
      state.sessionId !== sessionBinding.sessionId || state.traceSpecSha256 !== sessionBinding.traceSpecSha256 ||
      state.sourceSwfSha256 !== sessionBinding.sourceSwfSha256 ||
      state.captureKitManifestSha256 !== sessionBinding.captureKitManifestSha256 ||
      state.launchReceiptSha256 !== sessionBinding.launchReceiptSha256 ||
      state.toolchainReceiptSha256 !== sessionBinding.toolchainReceiptSha256 ||
      state.frameDomainId !== spec.frameDomain.id || state.observedRootFrame !== expectedFrame ||
      state.previousRecordSha256 !== priorStateHash || state.recordSha256 !== displayListRecordSha256(state) ||
      event.displayListRecordSha256 !== state.recordSha256
    ) throw new Error(`display-list record hash/identity/sequence chain is invalid at frame ${expectedFrame}`);
    if (
      !Number.isFinite(state.monotonicTimeMs) || state.monotonicTimeMs <= priorStateTime || state.monotonicTimeMs < event.monotonicTimeMs ||
      state.monotonicTimeMs < 0 || state.monotonicTimeMs > attestationDocument.durationMs
    ) {
      throw new Error(`display-list record frame ${expectedFrame} monotonicTimeMs is invalid or outside the session window`);
    }
    const stateOccurredAt = Date.parse(state.occurredAt || "");
    if (
      !Number.isFinite(stateOccurredAt) || stateOccurredAt < priorStateOccurredAt || stateOccurredAt < occurredAt ||
      stateOccurredAt < attestationDocument.startedAtMs || stateOccurredAt > attestationDocument.endedAtMs
    ) throw new Error(`display-list record frame ${expectedFrame} occurredAt is invalid, non-monotonic, or outside the session window`);
    if (Math.abs((stateOccurredAt - attestationDocument.startedAtMs) - state.monotonicTimeMs) > 1) {
      throw new Error(`display-list record frame ${expectedFrame} wall-clock and monotonic times do not identify the same session instant`);
    }
    if (canonicalJson(state.operator) !== canonicalJson(attestation.operator)) throw new Error("display-list record operator differs from the named-human session attestation");
    if (!isPlainObject(state.displayListState) || !Object.keys(state.displayListState).length) throw new Error(`display-list record frame ${expectedFrame} state must not be empty`);
    if (state.displayListStateSha256 !== sha256Text(canonicalJson(state.displayListState))) throw new Error(`display-list record frame ${expectedFrame} state SHA-256 mismatch`);
    if (state.screenshotSha256 !== event.screenshotSha256) throw new Error(`display-list record frame ${expectedFrame} screenshot SHA-256 differs from the operation log`);

    const screenshotPath = await resolveInputPath({
      root,
      workspace,
      declared: event.screenshotFile,
      label: `operation log frame ${expectedFrame}.screenshotFile`,
      bases: [root],
    });
    const actualFramesDirectory = await realpath(framesDirectory);
    const actualScreenshot = await realpath(screenshotPath);
    if (!isLexicallyInside(actualScreenshot, actualFramesDirectory)) throw new Error(`operation log frame ${expectedFrame} screenshot escapes the declared frames directory`);
    if (seenPngPaths.has(actualScreenshot)) throw new Error(`operation log reuses a PNG at frame ${expectedFrame}`);
    seenPngPaths.add(actualScreenshot);
    const pngBytes = await readFile(screenshotPath);
    if (digest(pngBytes) !== event.screenshotSha256) throw new Error(`operation log frame ${expectedFrame} screenshot SHA-256 mismatch`);
    const png = validateRootFramePngBytes(
      pngBytes,
      `operation log frame ${expectedFrame} screenshot`,
      captureRaster,
    );
    totalCompressedPngBytes += png.compressedBytes;
    totalDecodedPngBytes += png.decodedBytes;
    if (totalCompressedPngBytes > MAX_ROOT_FRAME_PNG_TOTAL_BYTES) throw new Error("root frame PNG set exceeds the total compressed byte limit");
    if (totalDecodedPngBytes > MAX_ROOT_FRAME_DECODED_TOTAL_BYTES) throw new Error("root frame PNG set exceeds the total decoded byte limit");
    const attestedFrame = attestation.frameSet.frames[index];
    if (attestedFrame.frame !== expectedFrame || attestedFrame.file !== event.screenshotFile || attestedFrame.sha256 !== event.screenshotSha256) {
      throw new Error(`operation log frame ${expectedFrame} differs from the attested ordered frame set`);
    }
    frames.push({
      frame: expectedFrame,
      sourcePath: screenshotPath,
      sourceSha256: event.screenshotSha256,
      compressedBytes: png.compressedBytes,
      decodedBytes: png.decodedBytes,
      byteOffset: operationItem.byteOffset,
      event,
      state,
    });
    priorEventHash = event.eventSha256;
    priorStateHash = state.recordSha256;
    priorEventTime = event.monotonicTimeMs;
    priorStateTime = state.monotonicTimeMs;
    priorOccurredAt = occurredAt;
    priorStateOccurredAt = stateOccurredAt;
  }
  if (seenPngPaths.size !== frameEntries.length) throw new Error("frames directory contains PNG files not bound by the operation log");
  for (let index = 0; index < frames.length - 1; index += 1) {
    const state = frames[index].state;
    const nextEvent = frames[index + 1].event;
    const stateWallTime = Date.parse(state.occurredAt);
    const nextEventWallTime = Date.parse(nextEvent.occurredAt);
    if (state.monotonicTimeMs >= nextEvent.monotonicTimeMs || stateWallTime >= nextEventWallTime) {
      throw new Error(`cross-stream frame ${index + 1} ordering must satisfy event_i <= state_i < event_i+1 in both wall and monotonic time`);
    }
  }
  if (
    attestation.operationLog.sha256 !== operationLog.sha256 || attestation.operationLog.eventCount !== operationLog.records.length ||
    attestation.operationLog.finalEventSha256 !== priorEventHash
  ) throw new Error("operation log bytes/count/final chain differ from the capture-session attestation");
  if (
    attestation.displayListRecords.sha256 !== displayListLog.sha256 || attestation.displayListRecords.recordCount !== displayListLog.records.length ||
    attestation.displayListRecords.finalRecordSha256 !== priorStateHash
  ) throw new Error("display-list records bytes/count/final chain differ from the capture-session attestation");
  return {operationLog, displayListLog, frames, operator: attestation.operator, capturedAt: attestation.endedAt};
}

export function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function captureDirectoryIdentity(root, directory, label) {
  await assertNoExistingSymlinkComponents(root, directory, label);
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`${label} must be a real directory`);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const confirmed = await lstat(directory);
  if (
    !confirmed.isDirectory() || confirmed.isSymbolicLink() ||
    !sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)) || permissionMode(confirmed) !== permissionMode(info)
  ) throw new Error(`${label} directory identity changed while it was being inspected`);
  const expectedDirectory = path.resolve(actualRoot, path.relative(root, directory));
  if (actualDirectory !== expectedDirectory) throw new Error(`${label} real path differs from its fixed lexical path`);
  return {node: nodeIdentity(confirmed), mode: permissionMode(confirmed), realPath: actualDirectory};
}

async function assertDirectoryIdentity(root, directory, expected, label) {
  const observed = await captureDirectoryIdentity(root, directory, label);
  if (observed.realPath !== expected.realPath || !sameNodeIdentity(observed.node, expected.node)) {
    throw new Error(`${label} directory identity changed during candidate preparation`);
  }
  return observed;
}

async function captureRegularFile(root, candidate, label, {expectedSha256, expectedMode, requireSingleLink = true} = {}) {
  await assertNoExistingSymlinkComponents(root, candidate, label);
  const info = await lstat(candidate);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} must be a regular non-symbolic-link file`);
  if (requireSingleLink && info.nlink !== 1) throw new Error(`${label} must not be hard-linked`);
  const bytes = await readFile(candidate);
  const sha256 = digest(bytes);
  if (expectedSha256 !== undefined && sha256 !== expectedSha256) throw new Error(`${label} SHA-256 changed`);
  if (expectedMode !== undefined && permissionMode(info) !== expectedMode) {
    throw new Error(`${label} mode must be ${expectedMode.toString(8).padStart(4, "0")}`);
  }
  const actual = await realpath(candidate);
  const confirmed = await lstat(candidate);
  if (
    !confirmed.isFile() || confirmed.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)) ||
    confirmed.size !== info.size || permissionMode(confirmed) !== permissionMode(info) || confirmed.nlink !== info.nlink
  ) throw new Error(`${label} file identity changed while it was being inspected`);
  return {
    node: nodeIdentity(confirmed), mode: permissionMode(confirmed), nlink: confirmed.nlink,
    bytes: confirmed.size, sha256, realPath: actual,
  };
}

async function snapshotProtectedInputs({root, inputs, framesDirectory, expectedFrameNames}) {
  const uniquePaths = new Map();
  const occupiedNodes = new Map();
  for (const input of inputs) {
    const absolute = path.resolve(input.path);
    const existing = uniquePaths.get(absolute);
    if (existing) {
      if (existing.sha256 !== input.sha256) throw new Error(`${input.label} duplicates a protected path with a different hash`);
      existing.labels.push(input.label);
      continue;
    }
    const observed = await captureRegularFile(root, absolute, input.label, {expectedSha256: input.sha256, requireSingleLink: true});
    const inodeKey = `${observed.node.dev}:${observed.node.ino}`;
    const prior = occupiedNodes.get(inodeKey);
    if (prior && prior.realPath !== observed.realPath) throw new Error(`${input.label} hard-links protected input ${prior.label}`);
    const snapshot = {...observed, path: absolute, labels: [input.label]};
    uniquePaths.set(absolute, snapshot);
    occupiedNodes.set(inodeKey, {label: input.label, realPath: observed.realPath});
  }
  const frameDirectory = await captureDirectoryIdentity(root, framesDirectory, "root frames directory");
  const entries = await readdir(framesDirectory, {withFileTypes: true});
  const names = entries.map(({name}) => name).sort();
  if (
    entries.length !== expectedFrameNames.length || entries.some((entry) => !entry.isFile()) ||
    !same(names, [...expectedFrameNames].sort())
  ) throw new Error("root frames directory inventory changed before publication");
  return {files: [...uniquePaths.values()], frameDirectory: {...frameDirectory, path: framesDirectory, entries: names}};
}

async function assertProtectedInputsUnchanged(root, snapshot, phase) {
  for (const input of snapshot.files) {
    const observed = await captureRegularFile(root, input.path, input.labels.join(" / "), {expectedSha256: input.sha256, requireSingleLink: true});
    if (
      observed.realPath !== input.realPath || !sameNodeIdentity(observed.node, input.node) ||
      observed.mode !== input.mode || observed.bytes !== input.bytes
    ) throw new Error(`${input.labels.join(" / ")} changed ${phase} candidate preparation`);
  }
  const observedDirectory = await assertDirectoryIdentity(root, snapshot.frameDirectory.path, snapshot.frameDirectory, "root frames directory");
  if (observedDirectory.mode !== snapshot.frameDirectory.mode) throw new Error(`root frames directory mode changed ${phase} candidate preparation`);
  const entries = await readdir(snapshot.frameDirectory.path, {withFileTypes: true});
  if (
    entries.length !== snapshot.frameDirectory.entries.length || entries.some((entry) => !entry.isFile()) ||
    !same(entries.map(({name}) => name).sort(), snapshot.frameDirectory.entries)
  ) throw new Error(`root frames directory inventory changed ${phase} candidate preparation`);
}

async function assertInputOutputDisjointness({root, protectedSnapshot, outputBoundaries}) {
  const actualRoot = await realpath(root);
  const inputs = [
    ...protectedSnapshot.files.map(({realPath, labels}) => ({path: realPath, label: labels.join(" / ")})),
    {path: protectedSnapshot.frameDirectory.realPath, label: "root frames directory"},
  ];
  for (const output of outputBoundaries) {
    const intended = path.resolve(actualRoot, path.relative(root, output.path));
    for (const input of inputs) {
      if (pathsOverlap(input.path, intended)) throw new Error(`${input.label} overlaps ${output.label}`);
    }
  }
}

async function verifyOwnedRegularFile({root, candidate, ownership, label, expectedMode = 0o444, requireSingleLink = true}) {
  const observed = await captureRegularFile(root, candidate, label, {
    expectedSha256: ownership.sha256,
    expectedMode,
    requireSingleLink,
  });
  if (!sameNodeIdentity(observed.node, ownership.node)) throw new Error(`${label} inode changed after publication`);
  return observed;
}

async function unlinkOwnedRegularFile({root, candidate, ownership, label}) {
  await verifyOwnedRegularFile({root, candidate, ownership, label, expectedMode: ownership.mode, requireSingleLink: false});
  await unlink(candidate);
}

async function writeOwnedBytes({root, parentDirectory, parentIdentity, candidate, bytes, label, collection, collectionKey = path.basename(candidate)}) {
  await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
  await assertNoExistingSymlinkComponents(root, candidate, label);
  if (await exists(candidate)) throw new Error(`${label} already exists; evidence is append-only`);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(candidate, flags, 0o444);
  let ownership;
  try {
    const createdInfo = await handle.stat();
    ownership = {node: nodeIdentity(createdInfo), sha256: digest(bytes), mode: 0o444};
    collection.set(collectionKey, ownership);
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink: true});
  await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
  return ownership;
}

async function writeOwnedNewAtomic({root, parentDirectory, parentIdentity, candidate, bytes, label, transaction}) {
  await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
  const temporary = path.join(parentDirectory, `.${path.basename(candidate)}.tmp-${process.pid}-${Date.now()}-${transaction.sequence++}`);
  const temporaryOwnership = await writeOwnedBytes({
    root, parentDirectory, parentIdentity, candidate: temporary, bytes, label: `${label} temporary`,
    collection: transaction.temporaryFiles, collectionKey: temporary,
  });
  try {
    await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
    await assertNoExistingSymlinkComponents(root, candidate, label);
    if (await exists(candidate)) throw new Error(`${label} already exists; evidence is append-only`);
    await link(temporary, candidate);
    const ownership = {...temporaryOwnership};
    transaction.outputFiles.set(candidate, ownership);
    await verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink: false});
    await unlinkOwnedRegularFile({root, candidate: temporary, ownership: temporaryOwnership, label: `${label} temporary`});
    transaction.temporaryFiles.delete(temporary);
    await verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink: true});
    return ownership;
  } catch (error) {
    await removeOwnedFileIfUnchanged(temporary, temporaryOwnership);
    transaction.temporaryFiles.delete(temporary);
    throw error;
  }
}

// Kept for the natural-trace preparer, which shares the append-only file
// publication primitive. Root-candidate publication uses the stronger
// transaction-aware wrapper above.
export async function writeNewAtomic(candidate, bytes) {
  const parentDirectory = path.dirname(candidate);
  const temporary = path.join(parentDirectory, `.${path.basename(candidate)}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(temporary, flags, 0o444);
  let ownership;
  try {
    const info = await handle.stat();
    ownership = {node: nodeIdentity(info), sha256: digest(bytes)};
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    const temporaryInfo = await lstat(temporary);
    if (
      !temporaryInfo.isFile() || temporaryInfo.isSymbolicLink() || temporaryInfo.nlink !== 1 ||
      !sameNodeIdentity(nodeIdentity(temporaryInfo), ownership.node) || digest(await readFile(temporary)) !== ownership.sha256
    ) throw new Error("append-only temporary output changed before publication");
    await link(temporary, candidate);
    const candidateInfo = await lstat(candidate);
    if (
      !candidateInfo.isFile() || candidateInfo.isSymbolicLink() || candidateInfo.nlink !== 2 ||
      !sameNodeIdentity(nodeIdentity(candidateInfo), ownership.node) || digest(await readFile(candidate)) !== ownership.sha256
    ) throw new Error("append-only output changed during publication");
    await unlink(temporary);
    const finalInfo = await lstat(candidate);
    if (finalInfo.nlink !== 1 || !sameNodeIdentity(nodeIdentity(finalInfo), ownership.node)) {
      throw new Error("append-only output link count changed after publication");
    }
  } catch (error) {
    const info = await lstatIfPresent(temporary);
    let currentSha256 = null;
    try {
      currentSha256 = digest(await readFile(temporary));
    } catch {
      currentSha256 = null;
    }
    if (
      info?.isFile() && !info.isSymbolicLink() && ownership &&
      sameNodeIdentity(nodeIdentity(info), ownership.node) && currentSha256 === ownership.sha256
    ) await unlink(temporary).catch(() => {});
    throw error;
  }
}

async function stageOwnedBytes({root, archiveParent, archiveParentIdentity, stagedArchive, stagedIdentity, basename, bytes, expectedSha256, transaction}) {
  if (digest(bytes) !== expectedSha256) throw new Error(`root staged ${basename} source bytes differ from the expected SHA-256`);
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "root archive parent");
  await assertDirectoryIdentity(root, stagedArchive, stagedIdentity, "root staged archive");
  const destination = path.join(stagedArchive, basename);
  await writeOwnedBytes({
    root,
    parentDirectory: stagedArchive,
    parentIdentity: stagedIdentity,
    candidate: destination,
    bytes,
    label: `root staged ${basename}`,
    collection: transaction.staging.files,
    collectionKey: basename,
  });
  return transaction.staging.files.get(basename);
}

async function copyIntoOwnedStage({root, archiveParent, archiveParentIdentity, stagedArchive, stagedIdentity, source, basename, expectedSha256, transaction}) {
  const bytes = await readFile(source);
  await stageOwnedBytes({
    root, archiveParent, archiveParentIdentity, stagedArchive, stagedIdentity,
    basename, bytes, expectedSha256, transaction,
  });
  return bytes;
}

async function verifyOwnedArchive({root, archiveDirectory, archiveOwnership, expectedNames}) {
  const observed = await assertDirectoryIdentity(root, archiveDirectory, archiveOwnership.identity, "root candidate archive");
  if (observed.mode !== 0o755) throw new Error("root candidate archive mode must be 0755");
  const entries = await readdir(archiveDirectory, {withFileTypes: true});
  if (
    entries.length !== expectedNames.length || entries.some((entry) => !entry.isFile()) ||
    !same(entries.map(({name}) => name).sort(), [...expectedNames].sort())
  ) throw new Error("root candidate archive inventory changed after publication");
  for (const basename of expectedNames) {
    const ownership = archiveOwnership.files.get(basename);
    if (!ownership) throw new Error(`root candidate archive ownership is missing ${basename}`);
    await verifyOwnedRegularFile({
      root, candidate: path.join(archiveDirectory, basename), ownership,
      label: `root candidate archive ${basename}`, requireSingleLink: true,
    });
  }
}

async function verifyFinalArchivedFrames({root, archiveDirectory, frameDescriptors}) {
  let totalCompressed = 0;
  let totalDecoded = 0;
  for (const descriptor of frameDescriptors) {
    const candidate = path.join(root, descriptor.file);
    if (path.dirname(candidate) !== archiveDirectory) throw new Error(`archived frame ${descriptor.frame} descriptor escapes the candidate archive`);
    const bytes = await readFile(candidate);
    if (digest(bytes) !== descriptor.sha256) throw new Error(`archived frame ${descriptor.frame} SHA-256 differs from its descriptor`);
    const png = validateRootFramePngBytes(
      bytes,
      `archived frame ${descriptor.frame}`,
      {width: descriptor.width, height: descriptor.height},
    );
    totalCompressed += png.compressedBytes;
    totalDecoded += png.decodedBytes;
    if (totalCompressed > MAX_ROOT_FRAME_PNG_TOTAL_BYTES) throw new Error("archived root frame set exceeds the total compressed byte limit");
    if (totalDecoded > MAX_ROOT_FRAME_DECODED_TOTAL_BYTES) throw new Error("archived root frame set exceeds the total decoded byte limit");
  }
}

async function publishOwnedArchive({root, archiveParent, archiveParentIdentity, stagedArchive, archiveDirectory, transaction}) {
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "root archive parent");
  await assertDirectoryIdentity(root, stagedArchive, transaction.staging.identity, "root staged archive");
  await assertNoExistingSymlinkComponents(root, archiveDirectory, "root candidate archive");
  await mkdir(archiveDirectory, {recursive: false, mode: 0o700});
  transaction.archive.identity = await captureDirectoryIdentity(root, archiveDirectory, "root candidate archive");
  for (const [basename, stagingOwnership] of [...transaction.staging.files.entries()]) {
    await assertDirectoryIdentity(root, stagedArchive, transaction.staging.identity, "root staged archive");
    await assertDirectoryIdentity(root, archiveDirectory, transaction.archive.identity, "root candidate archive");
    const stagedFile = path.join(stagedArchive, basename);
    const archivedFile = path.join(archiveDirectory, basename);
    await verifyOwnedRegularFile({root, candidate: stagedFile, ownership: stagingOwnership, label: `root staged ${basename}`, requireSingleLink: true});
    await link(stagedFile, archivedFile);
    transaction.archive.files.set(basename, stagingOwnership);
    await verifyOwnedRegularFile({root, candidate: archivedFile, ownership: stagingOwnership, label: `root archived ${basename}`, requireSingleLink: false});
    await unlinkOwnedRegularFile({root, candidate: stagedFile, ownership: stagingOwnership, label: `root staged ${basename}`});
    transaction.staging.files.delete(basename);
    await verifyOwnedRegularFile({root, candidate: archivedFile, ownership: stagingOwnership, label: `root archived ${basename}`, requireSingleLink: true});
  }
  if ((await readdir(stagedArchive)).length) throw new Error("root staged archive is not empty after publication");
  await rmdir(stagedArchive);
  transaction.staging.removed = true;
  await chmod(archiveDirectory, 0o755);
  transaction.archive.committed = true;
}

async function removeOwnedFileIfUnchanged(candidate, ownership) {
  try {
    const info = await lstatIfPresent(candidate);
    if (!info || !info.isFile() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.node)) return false;
    if (digest(await readFile(candidate)) !== ownership.sha256) return false;
    await unlink(candidate);
    return true;
  } catch {
    return false;
  }
}

async function cleanupOwnedDirectory(directory, ownership) {
  if (!ownership?.identity) return false;
  try {
    const info = await lstatIfPresent(directory);
    if (!info || !info.isDirectory() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.identity.node)) return false;
    await chmod(directory, 0o700);
    for (const [basename, fileOwnership] of ownership.files.entries()) {
      await removeOwnedFileIfUnchanged(path.join(directory, basename), fileOwnership);
    }
    const after = await lstatIfPresent(directory);
    if (!after || !after.isDirectory() || after.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(after), ownership.identity.node)) return false;
    if ((await readdir(directory)).length) {
      await chmod(directory, ownership.committed ? 0o755 : ownership.identity.mode);
      return false;
    }
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function cleanupEmptyOwnedDirectory(directory, identity) {
  if (!identity) return false;
  try {
    const info = await lstatIfPresent(directory);
    if (!info || !info.isDirectory() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), identity.node)) return false;
    if ((await readdir(directory)).length) return false;
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function cleanupTransaction({transaction, pendingDirectory, pendingDirectoryCreated, archiveParent, archiveParentCreated}) {
  for (const [candidate, ownership] of [...transaction.outputFiles.entries()].reverse()) await removeOwnedFileIfUnchanged(candidate, ownership);
  for (const [candidate, ownership] of transaction.temporaryFiles.entries()) await removeOwnedFileIfUnchanged(candidate, ownership);
  await cleanupOwnedDirectory(transaction.archive.path, transaction.archive);
  if (!transaction.staging.removed) await cleanupOwnedDirectory(transaction.staging.path, transaction.staging);
  if (pendingDirectoryCreated) await cleanupEmptyOwnedDirectory(pendingDirectory, transaction.pendingIdentity);
  if (archiveParentCreated) await cleanupEmptyOwnedDirectory(archiveParent, transaction.archiveParentIdentity);
}

export function parseArguments(argumentsList) {
  const options = {projectRoot: repositoryRoot};
  const valueOptions = new Set([
    "--spec", "--operation-log", "--frames", "--display-list-states", "--launch-receipt", "--toolchain-receipt", "--proof-mode",
    "--capture-session-attestation", "--project-root",
  ]);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (valueOptions.has(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      const key = {
        "--spec": "spec",
        "--operation-log": "operationLog",
        "--frames": "frames",
        "--display-list-states": "displayListStates",
        "--launch-receipt": "launchReceipt",
        "--toolchain-receipt": "toolchainReceipt",
        "--proof-mode": "proofMode",
        "--capture-session-attestation": "captureSessionAttestation",
        "--project-root": "projectRoot",
      }[value];
      options[key] = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export async function prepareRootCaptureCandidate(options, {hooks = {}} = {}) {
  for (const field of [
    "archiveOutput",
    "candidateManifestOutput",
    "candidateReportOutput",
    "baselineOutput",
    "executionOutput",
    "updateCoverage",
    "promote",
  ]) {
    if (Object.hasOwn(options, field)) {
      throw new Error(`${field} is unsupported; candidate output destinations and acceptance state are fixed`);
    }
  }
  const root = path.resolve(options.projectRoot || repositoryRoot);
  for (const [field, label] of [
    ["spec", "--spec"],
    ["operationLog", "--operation-log"],
    ["frames", "--frames"],
    ["displayListStates", "--display-list-states"],
    ["launchReceipt", "--launch-receipt"],
    ["toolchainReceipt", "--toolchain-receipt"],
    ["captureSessionAttestation", "--capture-session-attestation"],
    ["proofMode", "--proof-mode"],
  ]) assertString(options[field], label);
  for (const [field, label] of [
    ["operationLog", "--operation-log"],
    ["displayListStates", "--display-list-states"],
    ["launchReceipt", "--launch-receipt"],
    ["toolchainReceipt", "--toolchain-receipt"],
    ["captureSessionAttestation", "--capture-session-attestation"],
  ]) assertRealSessionArtifactPath(options[field], label);
  if (!PROOF_MODES.has(options.proofMode)) throw new Error("--proof-mode is unsupported");
  const specPath = await resolveInputPath({root, workspace: root, declared: options.spec, label: "--spec", bases: [root]});
  const bound = await loadBoundTrace({root, specPath});
  const {spec, workspace} = bound;
  const operationLogPath = await resolveInputPath({root, workspace, declared: options.operationLog, label: "--operation-log", bases: [root]});
  const framesDirectory = await resolveInputPath({root, workspace, declared: options.frames, label: "--frames", type: "directory", bases: [root]});
  const displayListPath = await resolveInputPath({root, workspace, declared: options.displayListStates, label: "--display-list-states", bases: [root]});
  const launchReceiptPath = await resolveInputPath({root, workspace, declared: options.launchReceipt, label: "--launch-receipt", bases: [root]});
  const receiptPath = await resolveInputPath({root, workspace, declared: options.toolchainReceipt, label: "--toolchain-receipt", bases: [root]});
  const attestationPath = await resolveInputPath({root, workspace, declared: options.captureSessionAttestation, label: "--capture-session-attestation", bases: [root]});
  for (const [candidate, label] of [
    [operationLogPath, "--operation-log"],
    [framesDirectory, "--frames"],
    [displayListPath, "--display-list-states"],
    [launchReceiptPath, "--launch-receipt"],
    [receiptPath, "--toolchain-receipt"],
    [attestationPath, "--capture-session-attestation"],
  ]) await assertOutsideUnsignedRootCaptureKit(root, candidate, label);
  const receiptDocument = await verifyReceipt({root, workspace, receiptPath});
  const attestationDocument = await verifyCaptureSessionAttestation({
    root,
    bound,
    attestationPath,
    operationLogPath,
    displayListPath,
    framesDirectory,
    launchReceiptPath,
    receiptPath,
    receiptDocument,
    proofMode: options.proofMode,
  });
  const verified = await verifyEvidenceInputs({
    root,
    workspace,
    spec,
    captureRaster: bound.captureRaster,
    proofMode: options.proofMode,
    operationLogPath,
    framesDirectory,
    displayListPath,
    attestationDocument,
  });
  const captureKitDocument = attestationDocument.launchDocument.captureKitDocument;
  const kitCheckDocument = attestationDocument.launchDocument.kitCheck;
  const protectedInputs = [
    {path: specPath, sha256: bound.specDocument.sha256, label: "trace specification"},
    {path: bound.indexPath, sha256: bound.indexDocument.sha256, label: "trace-spec index"},
    ...(bound.lessonReleaseCatalog ? [{
      path: bound.lessonReleaseCatalog.path,
      sha256: bound.lessonReleaseCatalog.document.sha256,
      label: "lesson-release catalog",
    }] : []),
    {path: path.join(workspace, "migration.json"), sha256: bound.manifestDocument.sha256, label: "migration manifest"},
    {path: path.join(workspace, "evidence", "full-frame-coverage.json"), sha256: bound.coverageDocument.sha256, label: "full-frame coverage"},
    {path: path.join(workspace, "audit", "scenario-inventory.json"), sha256: bound.inventoryDocument.sha256, label: "scenario inventory"},
    {path: bound.sourcePath, sha256: spec.sourceBindings.sourceSwf.sha256, label: "preserved source SWF"},
    {path: operationLogPath, sha256: verified.operationLog.sha256, label: "operation log"},
    {path: displayListPath, sha256: verified.displayListLog.sha256, label: "display-list state log"},
    {path: launchReceiptPath, sha256: attestationDocument.launchDocument.sha256, label: "source-open launch receipt"},
    {path: kitCheckDocument.path, sha256: kitCheckDocument.sha256, label: "root capture-kit check"},
    {path: captureKitDocument.path, sha256: captureKitDocument.sha256, label: "root capture-kit manifest"},
    {path: captureKitDocument.stagedPath, sha256: spec.sourceBindings.sourceSwf.sha256, label: "root capture-kit staged source"},
    {path: captureKitDocument.launcher.path, sha256: captureKitDocument.launcher.sha256, label: "root capture-kit launcher"},
    {path: captureKitDocument.sandbox.path, sha256: captureKitDocument.sandbox.sha256, label: "root capture-kit sandbox"},
    {path: captureKitDocument.identityDocument.path, sha256: captureKitDocument.identityDocument.sha256, label: "root runtime identity receipt"},
    {path: receiptPath, sha256: receiptDocument.sha256, label: "toolchain receipt"},
    ...receiptDocument.identityArtifacts,
    {path: attestationPath, sha256: attestationDocument.sha256, label: "capture-session attestation"},
    ...verified.frames.map((item) => ({path: item.sourcePath, sha256: item.sourceSha256, label: `root frame ${item.frame}`})),
  ];
  const safeId = safeRequirementId(spec.requirementId);
  const defaultArchive = path.join(root, "artifacts", "full-frame", "pilot-baselines", spec.animationId, safeId, "pending-human-owner");
  const archiveDirectory = await resolveFixedOutputPath(root, defaultArchive, "archive output");
  const pendingDirectory = path.join(workspace, "evidence", "pending-root-capture", safeId);
  const candidateManifestPath = await resolveFixedOutputPath(root, path.join(pendingDirectory, "candidate-manifest.json"), "candidate manifest output");
  const candidateReportPath = await resolveFixedOutputPath(root, path.join(pendingDirectory, "candidate-report.json"), "candidate report output");
  if (candidateManifestPath === candidateReportPath) throw new Error("candidate manifest and report outputs must be distinct files");
  const canonicalBaselinePath = path.join(workspace, "baseline", "original-runtime", `${safeId}.json`);
  const canonicalExecutionPath = path.join(workspace, spec.executionEvidence.expectedExecutionReportPath);
  if (
    candidateManifestPath === canonicalBaselinePath || candidateManifestPath === canonicalExecutionPath ||
    candidateReportPath === canonicalBaselinePath || candidateReportPath === canonicalExecutionPath
  ) throw new Error("candidate outputs must never target canonical baseline or expected execution-report paths");
  for (const [candidate, label] of [[archiveDirectory, "archive output"], [candidateManifestPath, "candidate manifest output"], [candidateReportPath, "candidate report output"]]) {
    if (await exists(candidate)) throw new Error(`${label} already exists; candidate evidence is append-only and will not be overwritten`);
  }
  const archiveRelative = portable(path.relative(root, archiveDirectory));
  const candidateManifestRelative = portable(path.relative(root, candidateManifestPath));
  const candidateReportRelative = portable(path.relative(root, candidateReportPath));
  const archiveParent = path.dirname(archiveDirectory);
  const stagedArchive = path.join(archiveParent, `.tmp-${path.basename(archiveDirectory)}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const pendingDirectoryExisted = await exists(pendingDirectory);
  const archiveParentExisted = await exists(archiveParent);
  const protectedSnapshot = await snapshotProtectedInputs({
    root,
    inputs: protectedInputs,
    framesDirectory,
    expectedFrameNames: verified.frames.map((item) => path.basename(item.sourcePath)),
  });
  await assertInputOutputDisjointness({
    root,
    protectedSnapshot,
    outputBoundaries: [
      {path: pendingDirectory, label: "root pending output"},
      {path: archiveDirectory, label: "root archive output"},
      {path: stagedArchive, label: "root archive staging output"},
    ],
  });
  await hooks.afterInputSnapshot?.({pendingDirectory, archiveDirectory, stagedArchive, framesDirectory});
  await assertProtectedInputsUnchanged(root, protectedSnapshot, "after input snapshot");
  const transaction = {
    sequence: 0,
    pendingIdentity: null,
    archiveParentIdentity: null,
    temporaryFiles: new Map(),
    outputFiles: new Map(),
    staging: {path: stagedArchive, identity: null, files: new Map(), removed: false, committed: false},
    archive: {path: archiveDirectory, identity: null, files: new Map(), removed: false, committed: false},
  };
  try {
    await ensureRealOutputDirectory(root, pendingDirectory, "pending requirement directory");
    await ensureRealOutputDirectory(root, archiveParent, "pending archive parent");
    transaction.pendingIdentity = await captureDirectoryIdentity(root, pendingDirectory, "pending requirement directory");
    transaction.archiveParentIdentity = await captureDirectoryIdentity(root, archiveParent, "pending archive parent");
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await hooks.afterPathPreparation?.({pendingDirectory, archiveDirectory, archiveParent});
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await mkdir(stagedArchive, {recursive: false, mode: 0o700});
    transaction.staging.identity = await captureDirectoryIdentity(root, stagedArchive, "root staged archive");
    const frameDescriptors = [];
    for (const item of verified.frames) {
      const basename = `frame-${String(item.frame).padStart(4, "0")}.png`;
      await copyIntoOwnedStage({
        root, archiveParent, archiveParentIdentity: transaction.archiveParentIdentity,
        stagedArchive, stagedIdentity: transaction.staging.identity,
        source: item.sourcePath, basename, expectedSha256: item.sourceSha256, transaction,
      });
      const outputFile = `${archiveRelative}/${basename}`;
      frameDescriptors.push({
        animationId: spec.animationId,
        requirementId: spec.requirementId,
        frameDomainId: spec.identity.frameDomainId,
        traceId: spec.identity.traceId,
        entryStateSha256: spec.identity.entryStateSha256,
        frame: item.frame,
        file: outputFile,
        sha256: item.sourceSha256,
        width: bound.captureRaster.width,
        height: bound.captureRaster.height,
      });
    }
    const rawLogBasename = "operation-log.jsonl";
    const stateBasename = "display-list-states.jsonl";
    const launchReceiptBasename = "source-open-launch-receipt.json";
    const launchKitCheckBasename = "root-capture-kit-check.json";
    const captureKitManifestBasename = "root-capture-kit-manifest.json";
    const receiptBasename = "toolchain-receipt.json";
    const attestationBasename = "capture-session-attestation.json";
    for (const [source, basename, sha256] of [
      [operationLogPath, rawLogBasename, verified.operationLog.sha256],
      [displayListPath, stateBasename, verified.displayListLog.sha256],
      [launchReceiptPath, launchReceiptBasename, attestationDocument.launchDocument.sha256],
      [kitCheckDocument.path, launchKitCheckBasename, kitCheckDocument.sha256],
      [captureKitDocument.path, captureKitManifestBasename, captureKitDocument.sha256],
      [receiptPath, receiptBasename, receiptDocument.sha256],
      [attestationPath, attestationBasename, attestationDocument.sha256],
    ]) {
      await copyIntoOwnedStage({
        root, archiveParent, archiveParentIdentity: transaction.archiveParentIdentity,
        stagedArchive, stagedIdentity: transaction.staging.identity,
        source, basename, expectedSha256: sha256, transaction,
      });
    }
    const rawLogDescriptor = {file: `${archiveRelative}/${rawLogBasename}`, sha256: verified.operationLog.sha256};
    const stateDescriptor = {file: `${archiveRelative}/${stateBasename}`, sha256: verified.displayListLog.sha256};
    const launchReceiptDescriptor = {file: `${archiveRelative}/${launchReceiptBasename}`, sha256: attestationDocument.launchDocument.sha256};
    const launchKitCheckDescriptor = {file: `${archiveRelative}/${launchKitCheckBasename}`, sha256: attestationDocument.launchDocument.kitCheck.sha256};
    const captureKitManifestDescriptor = {file: `${archiveRelative}/${captureKitManifestBasename}`, sha256: attestationDocument.launchDocument.captureKitDocument.sha256};
    const captureKitDescriptor = {manifest: captureKitManifestDescriptor, kitCheck: launchKitCheckDescriptor};
    const receiptDescriptor = {file: `${archiveRelative}/${receiptBasename}`, sha256: receiptDocument.sha256};
    const attestationDescriptor = {file: `${archiveRelative}/${attestationBasename}`, sha256: attestationDocument.sha256};
    const sourceTargetLog = {
      schemaVersion: 1,
      evidenceType: "attested-root-capture-candidate-source-target-resolution-log",
      status: "not-applicable-no-source-or-user-actions",
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      proofMode: options.proofMode,
      captureSessionAttestation: attestationDescriptor,
      launchReceipt: launchReceiptDescriptor,
      captureKit: captureKitDescriptor,
      traceSpecBinding: {file: bound.specRelative, sha256: bound.specDocument.sha256},
      rawEventLog: rawLogDescriptor,
      resolvedTargets: [],
      dispatchedActionCount: 0,
      statement: "Root frame positioning is runtime control evidence, not a source/user interaction target resolution.",
    };
    const sourceTargetBytes = Buffer.from(renderJson(sourceTargetLog));
    const sourceTargetBasename = "source-target-resolution-log.json";
    await stageOwnedBytes({
      root, archiveParent, archiveParentIdentity: transaction.archiveParentIdentity,
      stagedArchive, stagedIdentity: transaction.staging.identity,
      basename: sourceTargetBasename, bytes: sourceTargetBytes,
      expectedSha256: digest(sourceTargetBytes), transaction,
    });
    const sourceTargetDescriptor = {file: `${archiveRelative}/${sourceTargetBasename}`, sha256: digest(sourceTargetBytes)};

    const entryAction = options.proofMode === "direct-seek-root-exhaustive"
      ? "The named human claims the exact source SWF was launched in the declared Adobe runtime and every root frame was positioned by one explicit direct seek."
      : "The named human claims the exact source SWF was launched in the declared Adobe runtime, Rewind was invoked for frame 1, then Step Forward exactly once per subsequent root frame.";
    const candidateManifest = {
      schemaVersion: 1,
      evidenceType: "attested-root-capture-candidate-manifest",
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      frameDomainId: spec.identity.frameDomainId,
      traceId: spec.identity.traceId,
      entryStateSha256: spec.identity.entryStateSha256,
      scenario: spec.identity.scenario,
      language: spec.identity.language,
      seed: String(spec.identity.seed),
      capturedAtClaim: verified.capturedAt,
      source: {swf: spec.sourceBindings.sourceSwf.path, swfSha256: spec.sourceBindings.sourceSwf.sha256},
      declaredRuntimeFacts: {
        stage: {
          width: spec.frameDomain.nativeStage.width,
          height: spec.frameDomain.nativeStage.height,
        },
        ...(
          bound.captureRaster.width !== spec.frameDomain.nativeStage.width ||
          bound.captureRaster.height !== spec.frameDomain.nativeStage.height
            ? {captureRaster: bound.captureRaster}
            : {}
        ),
        fps: spec.frameDomain.fps,
        frameCount: spec.frameDomain.frameCount,
        frameNumbering: "one-indexed",
      },
      attestedCaptureClaim: {
        sessionId: attestationDocument.attestation.sessionId,
        namedHuman: verified.operator,
        claimedTool: receiptDocument.receipt.runtime,
        proofMode: options.proofMode,
        entryProtocolClaim: entryAction,
        operationSequenceChainSha256: verified.frames.at(-1).event.eventSha256,
        displayListSequenceChainSha256: verified.frames.at(-1).state.recordSha256,
        captureKit: captureKitDescriptor,
        launchReceipt: launchReceiptDescriptor,
        toolchainReceipt: receiptDescriptor,
        captureSessionAttestation: attestationDescriptor,
        limitation: CAPTURE_SESSION_AUTHORITY_NOTE,
      },
      frames: frameDescriptors,
    };
    const candidateManifestBytes = Buffer.from(renderJson(candidateManifest));
    const candidateManifestDescriptor = {file: candidateManifestRelative, sha256: digest(candidateManifestBytes)};
    let previousResultSha256 = null;
    const frameResults = verified.frames.map((item, index) => {
      const frame = frameDescriptors[index];
      const result = {
        frame: item.frame,
        positioningOperation: expectedOperation(options.proofMode, index),
        operationCountSincePrevious: 1,
        requestSequence: item.event.sequence,
        captureLogLocator: {requestSequence: item.event.sequence, byteOffset: item.byteOffset},
        observedRootFrame: item.event.observedRootFrame,
        observedDisplayListStateSha256: item.state.displayListStateSha256,
        displayListRecordSha256: item.state.recordSha256,
        screenshotFile: frame.file,
        screenshotSha256: frame.sha256,
        width: frame.width,
        height: frame.height,
        previousResultSha256,
        result: "candidate-observation-bound",
      };
      result.resultSha256 = resultSha256(result);
      previousResultSha256 = result.resultSha256;
      return result;
    });
    const candidateReport = {
      schemaVersion: 1,
      evidenceType: "attested-root-capture-candidate-report",
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      proofMode: options.proofMode,
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      identity: {
        frameDomainId: spec.identity.frameDomainId,
        traceId: spec.identity.traceId,
        entryStateSha256: spec.identity.entryStateSha256,
        scenario: spec.identity.scenario,
        language: spec.identity.language,
        seed: String(spec.identity.seed),
      },
      traceSpecBinding: {file: bound.specRelative, sha256: bound.specDocument.sha256},
      captureKit: captureKitDescriptor,
      launchReceipt: launchReceiptDescriptor,
      captureSessionAttestation: attestationDescriptor,
      claimedRuntime: {
        runtimeId: receiptDocument.receipt.runtime.runtimeId,
        name: receiptDocument.receipt.runtime.name,
        version: receiptDocument.receipt.runtime.version,
        build: receiptDocument.receipt.runtime.version,
        claimedLaunchProtocol: entryAction,
        authority: CANDIDATE_AUTHORITY,
        sourceSwfSha256: spec.sourceBindings.sourceSwf.sha256,
        captureKit: captureKitDescriptor,
        launchReceipt: launchReceiptDescriptor,
        toolchainReceipt: receiptDescriptor,
        sessionId: attestationDocument.attestation.sessionId,
        namedHumanOperator: attestationDocument.attestation.operator,
        captureSessionAttestation: attestationDescriptor,
        authorityStatement: "Named-human accountability claim only; this preparer verifies bindings but cannot establish runtime provenance or strict authority.",
        authorityLimitations: [CAPTURE_SESSION_AUTHORITY_NOTE],
      },
      rawEventLog: {...rawLogDescriptor, eventCount: verified.frames.length, dispatchedActionCount: 0},
      sourceTargetResolutionLog: sourceTargetDescriptor,
      stateSnapshotArchive: stateDescriptor,
      candidateManifest: candidateManifestDescriptor,
      frameResults,
      unexpectedEvents: [],
      candidateSequenceChainSha256: previousResultSha256,
    };
    const candidateReportBytes = Buffer.from(renderJson(candidateReport));
    const candidateReportDescriptor = {file: candidateReportRelative, sha256: digest(candidateReportBytes)};
    const expectedArchiveNames = [...transaction.staging.files.keys()];
    await assertProtectedInputsUnchanged(root, protectedSnapshot, "during");
    await hooks.afterStaging?.({stagedArchive, archiveDirectory, pendingDirectory, framesDirectory});
    await assertProtectedInputsUnchanged(root, protectedSnapshot, "after staging");
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await hooks.beforeArchivePublish?.({stagedArchive, archiveDirectory, pendingDirectory, archiveParent, framesDirectory});
    await assertProtectedInputsUnchanged(root, protectedSnapshot, "immediately before archive publication");
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await publishOwnedArchive({
      root, archiveParent, archiveParentIdentity: transaction.archiveParentIdentity,
      stagedArchive, archiveDirectory, transaction,
    });
    await hooks.afterArchivePublishBeforeVerify?.({archiveDirectory, pendingDirectory, frameDescriptors});
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    await verifyFinalArchivedFrames({root, archiveDirectory, frameDescriptors});
    await hooks.afterArchive?.({archiveDirectory, pendingDirectory, candidateManifestPath, candidateReportPath});
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    await verifyFinalArchivedFrames({root, archiveDirectory, frameDescriptors});
    const candidateManifestOwnership = await writeOwnedNewAtomic({
      root, parentDirectory: pendingDirectory, parentIdentity: transaction.pendingIdentity,
      candidate: candidateManifestPath, bytes: candidateManifestBytes,
      label: "root candidate manifest", transaction,
    });
    await hooks.afterManifest?.({candidateManifestPath, candidateReportPath, archiveDirectory, pendingDirectory});
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await verifyOwnedRegularFile({root, candidate: candidateManifestPath, ownership: candidateManifestOwnership, label: "root candidate manifest", requireSingleLink: true});
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    await verifyFinalArchivedFrames({root, archiveDirectory, frameDescriptors});
    const candidateReportOwnership = await writeOwnedNewAtomic({
      root, parentDirectory: pendingDirectory, parentIdentity: transaction.pendingIdentity,
      candidate: candidateReportPath, bytes: candidateReportBytes,
      label: "root candidate report", transaction,
    });
    await hooks.afterReport?.({candidateManifestPath, candidateReportPath, archiveDirectory, pendingDirectory});
    await verifyPublicationPathIdentity({
      root, workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaselinePath, canonicalExecutionPath,
    });
    await verifyOwnedRegularFile({root, candidate: candidateManifestPath, ownership: candidateManifestOwnership, label: "root candidate manifest", requireSingleLink: true});
    await verifyOwnedRegularFile({root, candidate: candidateReportPath, ownership: candidateReportOwnership, label: "root candidate report", requireSingleLink: true});
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    await verifyFinalArchivedFrames({root, archiveDirectory, frameDescriptors});
    await assertProtectedInputsUnchanged(root, protectedSnapshot, "after final publication");
    return {
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      proofMode: options.proofMode,
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      frameCount: spec.frameDomain.frameCount,
      candidateManifest: candidateManifestDescriptor,
      candidateReport: candidateReportDescriptor,
      captureKit: captureKitDescriptor,
      launchReceipt: launchReceiptDescriptor,
      captureSessionAttestation: attestationDescriptor,
      archiveDirectory: archiveRelative,
      coverageChanged: false,
      statusChanged: false,
      reviewsChanged: false,
      sourceChanged: false,
    };
  } catch (error) {
    await cleanupTransaction({
      transaction,
      pendingDirectory,
      pendingDirectoryCreated: !pendingDirectoryExisted,
      archiveParent,
      archiveParentCreated: !archiveParentExisted,
    });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else process.stdout.write(`${JSON.stringify(await prepareRootCaptureCandidate(options), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
