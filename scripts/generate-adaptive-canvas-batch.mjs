#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {constants as fileSystemConstants} from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {
  endianness as osEndianness,
  release as osRelease,
  type as osType,
  version as osVersion,
} from "node:os";
import {fileURLToPath} from "node:url";

import {
  adaptiveAtomicStaticContractSha256,
  buildAdaptiveAtomicCommitEntries,
  executeAdaptiveAtomicCommit,
  inspectAdaptiveAtomicCommitHelper,
  recoverAdaptiveAtomicCommitFromStoredManifest,
} from "./lib/adaptive-canvas-atomic-commit.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REQUIRE = createRequire(import.meta.url);

export const V1_PROFILE_PATH =
  "apps/web/config/current-js-production-assets.v1.json";
export const V2_PROFILE_PATH =
  "apps/web/config/current-js-production-assets.v2.json";
export const GENERATED_BINDINGS_PATH =
  "packages/demos/src/adaptive-canvas-production-bindings.generated.ts";
export const DEFAULT_PLAN_RECEIPT_PATH =
  "work/adaptive-canvas-production-five.plan.v10.json";
export const DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH =
  "work/adaptive-canvas-production-five.chromium-proof.v2.json";
export const REGENERATION_PROVENANCE_RECEIPT_PATH =
  "work/adaptive-canvas-production-five.regeneration-provenance.v1.json";
// Gate 0A's independent authority created and reviewed the exact receipt, and
// the subsequent provenance code-review gate approved this immutable digest.
// This pin authorizes only the receipt verification below; it does not approve
// the native atomic commit capability, a Chromium proof, apply, or release.
export const APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256 =
  "d901badb154a562b97f102edb0a1ffd23fee67628254d8235a8814fcaac0ce8a";
export const REQUIRED_ATOMIC_COMMIT_CAPABILITY = deepFreeze({
  protocol: "darwin-dirfd-renameatx-nofollow-atomic-batch-v2",
  helperPath: "scripts/native/adaptive-canvas-atomic-commit-v2",
  staticContractSha256:
    "1b1c9af757ef32cb9b485f7e881b3444c1d2a498b0371868162c6f90dfadd08e",
});
// The helper is restricted at compile time to the exact 286-target static
// contract above. This approval covers only the native transaction capability;
// a fresh Chromium proof and the explicit --apply mode remain separate gates.
export const APPROVED_ATOMIC_COMMIT_HELPER_SHA256 =
  "2a20fe5becfe94788b8cf1809b5cddff6428a4cdab00697d767db31721ebc472";
export const ATOMIC_COMMIT_BUILD_RECEIPT_PATH =
  "work/adaptive-canvas-atomic-commit-build.v2.json";
export const APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256 =
  "d6836dbeea6b029e572b2286b39bf5b68f24d8e08904b7b523e2968dbcc0eda5";
export const ATOMIC_COMMIT_DRIVER_IMPLEMENTED = true;
export const BATCH_TEST_PATH =
  "scripts/generate-adaptive-canvas-batch.test.mjs";

export const EXPECTED_V1_PROFILE_SHA256 =
  "ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca";
export const EXPECTED_V1_CHECKSUM_SET_SHA256 =
  "52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25";
export const EXPECTED_PAGE_RENDERER_CHECKSUM_SET_SHA256 =
  "3bde1a6a816e8d161e96d3b2720643ce0c3e15c87d57628ff263e1f9445c3c32";

export const APPROVED_RELEASE_IDS = Object.freeze([
  "lesson-g03-l02-addition-subtraction-page-only-current-js",
  "lesson-g04-l03-negative-numbers",
  "lesson-g05-l03-exponents-prime-factorizations-page-only",
  "lesson-g05-l04-number-lines",
  "lesson-g05-l05-add-subtract-negative-numbers",
]);

export const PROFILE_COUNTS = Object.freeze({
  public: 929,
  serverAudio: 185,
  total: 1114,
});

export const RESOLUTION = Object.freeze({
  schemaVersion: 1,
  mode: "adaptive-integer",
  nativeWidth: 800,
  nativeHeight: 600,
  supportedRenderScales: Object.freeze([1, 2]),
});

export const LOADED_HOST = Object.freeze({
  assetPath:
    "courses/shell-course-g04-l03-index-local/host-composite-assets/" +
    "course-g04-l03-ir-001-loaded-swf-canvas-renderer.js",
  relativePath:
    "shell-course-g04-l03-index-local/host-composite-assets/" +
    "course-g04-l03-ir-001-loaded-swf-canvas-renderer.js",
  inputSha256:
    "3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0",
  metadataAnimationId: "course-g04-l03-ir-001-341242cc",
  registryAnimationId:
    "course-g04-l03-ir-001-341242cc-loaded-swf-host",
});

export const REAL_CHROMIUM_SAMPLE_DEFINITIONS = deepFreeze([
  {
    animationId: "course-g04-l03-in-002",
    registryAnimationId: "course-g04-l03-in-002",
    pageRenderer: true,
    request: {
      frame: 1,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    },
    frameClass: "static-frame-1",
  },
  {
    animationId: "course-g05-l05-vb-002",
    registryAnimationId: "course-g05-l05-vb-002",
    pageRenderer: true,
    request: {
      frame: 1,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    },
    frameClass: "static-frame-1",
  },
  {
    animationId: "course-g04-l03-in-009",
    registryAnimationId: "course-g04-l03-in-009",
    pageRenderer: true,
    request: {frame: 1, scenario: "default", lang: "en", seed: 0},
    frameClass: "static-frame-1",
  },
  {
    animationId: "course-g05-l04-fq-001",
    registryAnimationId: "course-g05-l04-fq-001",
    pageRenderer: true,
    request: {
      frame: 1,
      scenario: "source-static-composite-prefix",
      lang: "en",
      seed: 0,
    },
    frameClass: "static-frame-1",
  },
  {
    animationId: LOADED_HOST.registryAnimationId,
    registryAnimationId: LOADED_HOST.registryAnimationId,
    pageRenderer: false,
    request: {
      frame: 1,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    },
    frameClass: "static-frame-1",
  },
]);

export const FRAME_CLASS_RMSE_THRESHOLDS = deepFreeze({
  "static-frame-1": 0.05,
});
export const K2_COMPARISON_ALGORITHM =
  "alpha-weighted-box-2x-rgba-rmse-v1";

export function maximumRmseForFrameClass(frameClass) {
  invariant(
    typeof frameClass === "string" &&
      Object.hasOwn(FRAME_CLASS_RMSE_THRESHOLDS, frameClass),
    `unsupported Chromium proof frameClass: ${String(frameClass)}`,
    "UNSUPPORTED_CHROMIUM_FRAME_CLASS",
  );
  return FRAME_CLASS_RMSE_THRESHOLDS[frameClass];
}

export const GUARDED_CANVAS_RESIZE_PROPERTIES = deepFreeze([
  "width",
  "height",
]);

export const GUARDED_MUTATING_2D_METHODS = deepFreeze([
  "arc",
  "arcTo",
  "beginPath",
  "bezierCurveTo",
  "clearRect",
  "clip",
  "closePath",
  "drawImage",
  "ellipse",
  "fill",
  "fillRect",
  "fillText",
  "lineTo",
  "moveTo",
  "putImageData",
  "quadraticCurveTo",
  "rect",
  "reset",
  "resetTransform",
  "restore",
  "rotate",
  "roundRect",
  "save",
  "scale",
  "setLineDash",
  "setTransform",
  "stroke",
  "strokeRect",
  "strokeText",
  "transform",
  "translate",
]);

export const CHROMIUM_PROOF_RUNNER_MODE =
  "adaptive-canvas-apply-challenge-v2";
export const CHROMIUM_PROOF_TEST_NAME =
  "real Chromium writes one apply-challenge proof after all gates pass";
export const CHROMIUM_PROOF_RUNNER_CONTRACT = deepFreeze({
  protocol: CHROMIUM_PROOF_RUNNER_MODE,
  testPath: BATCH_TEST_PATH,
  testName: CHROMIUM_PROOF_TEST_NAME,
  nodeTestConcurrency: 1,
  timeoutMs: 300_000,
  shell: false,
  challengeTransport: "stdin-canonical-json-v1",
});

const REGENERATION_PROVENANCE_CLASSES = deepFreeze([
  "source-first-regeneration",
  "canonical-advanced-manual",
]);
const REGENERATION_SOURCE_EVIDENCE_ROLES = deepFreeze([
  "canonical-fla",
  "canonical-swf",
  "canonical-actionscript",
  "source-locked-ir",
  "source-regeneration-receipt",
  "canonical-advanced-manual-evidence",
]);

export const REAL_CHROMIUM_GUARD_DEFINITION = deepFreeze({
  animationId: "course-g04-l03-ts-006",
  registryAnimationId: "course-g04-l03-ts-006",
  request: {
    frame: 1,
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  },
  rejectedRenderScales: ["missing", 3],
  expectedErrors: [
    "renderScale must be exactly 1 or 2",
    "renderScale must be exactly 1 or 2",
  ],
});

const LIVE_LESSON_PREFIXES = Object.freeze([
  "course-g03-l02-",
  "course-g04-l03-",
  "course-g05-l03-",
  "course-g05-l04-",
  "course-g05-l05-",
]);
const FORBIDDEN_G4_PREFIX = /^course-g04-l(?:05|10|11)-/u;
const PAGE_RENDERER_ASSET_PATTERN =
  /^courses\/(course-g(?:03-l02|04-l03|05-l03|05-l04|05-l05)-[^/]+)\/canvas-renderer\.js$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9._-]+$/u;
const METADATA_START = "var METADATA = deepFreeze(";
const METADATA_END = ");\nvar readyPromise";
const HELPER_END = "var scalingGrids = {};";
const DATA_IMAGE_PATTERN_SOURCE =
  String.raw`data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})`;

const STANDARD_FUNCTION_SIGNATURE =
  "function render(targetCanvas, request) {";
const INTERNAL_FUNCTION_SIGNATURE =
  "function renderInternal(targetCanvas, request, requireBehaviorComposite) {";
const STANDARD_NATIVE_GUARD = [
  "    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) {",
  "        throw new Error(\"targetCanvas must be exactly 800x600\");",
  "    }",
].join("\n");
const COMPACT_NATIVE_GUARD =
  "    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) " +
  "throw new Error(\"targetCanvas must be exactly 800x600\");";
const ADAPTIVE_GUARD = [
  "    var k = request && request.renderScale;",
  "    if (k !== 1 && k !== 2) {",
  "        throw new Error(\"renderScale must be exactly 1 or 2\");",
  "    }",
  "    if (targetCanvas.width !== 800 * k || targetCanvas.height !== 600 * k) {",
  "        throw new Error(\"targetCanvas must be exactly \" + (800 * k) + \"x\" + (600 * k) + \" for renderScale \" + k);",
  "    }",
].join("\n");
const STANDARD_ROOT_TRANSFORM =
  "    ctx.setTransform(1, 0, 0, 1, 0, 0);";
const STANDARD_ADAPTIVE_ROOT_TRANSFORM =
  "    ctx.setTransform(k, 0, 0, k, 0, 0);";
const COMPACT_ROOT_TRANSFORM = "    ctx.setTransform(1,0,0,1,0,0);";
const COMPACT_ADAPTIVE_ROOT_TRANSFORM =
  "    ctx.setTransform(k,0,0,k,0,0);";
const STANDARD_TARGET_FILL =
  "    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);";
const STANDARD_AUTHORED_FILL = "    ctx.fillRect(0, 0, 800, 600);";
const COMPACT_AUTHORED_FILL = "    ctx.fillRect(0,0,800,600);";
const STANDARD_TARGET_CLEAR =
  "    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);";
const STANDARD_AUTHORED_CLEAR = "    ctx.clearRect(0, 0, 800, 600);";

const FAMILY_CONTRACTS = deepFreeze({
  "safe-ffdec-canvas-adapter": {
    marker: "Generated by scripts/build-safe-ffdec-canvas-adapter.mjs",
    expectedPageRendererCount: 225,
    helperAbiSha256:
      "7b41c10fd8e7ac62b94545df0375fe44fad1a5a1246e01c442814b12450647b1",
    functionSignature: STANDARD_FUNCTION_SIGNATURE,
    guard: STANDARD_NATIVE_GUARD,
    adaptiveGuard: ADAPTIVE_GUARD,
    rootTransform: STANDARD_ROOT_TRANSFORM,
    adaptiveRootTransform: STANDARD_ADAPTIVE_ROOT_TRANSFORM,
    background: STANDARD_TARGET_FILL,
    adaptiveBackground: STANDARD_AUTHORED_FILL,
    lane: "profile-bound-safe-ffdec-root-scale-v1",
  },
  "g5-l5-private-current-js": {
    marker: "Generated by scripts/build-g5-l5-private-current-js.mjs",
    expectedPageRendererCount: 56,
    helperAbiSha256:
      "dab76515adde1e181b6b4f1037e28bfdc29a52bc2597bece6f53d4a6f297cfc8",
    functionSignature: INTERNAL_FUNCTION_SIGNATURE,
    guard: STANDARD_NATIVE_GUARD,
    adaptiveGuard: ADAPTIVE_GUARD,
    rootTransform: STANDARD_ROOT_TRANSFORM,
    adaptiveRootTransform: STANDARD_ADAPTIVE_ROOT_TRANSFORM,
    background: STANDARD_TARGET_FILL,
    adaptiveBackground: STANDARD_AUTHORED_FILL,
    lane: "profile-bound-g5-l5-render-internal-root-scale-v1",
  },
  "g4-l3-in009-special": {
    marker: "Generated by scripts/build-in-009-ffdec-canvas-candidate.mjs",
    expectedPageRendererCount: 1,
    helperAbiSha256:
      "64a53a94ae81fcc1fa70dfd991a41caada658e3fcbb3a99e03ac4974d5abfc65",
    functionSignature: STANDARD_FUNCTION_SIGNATURE,
    guard: COMPACT_NATIVE_GUARD,
    adaptiveGuard: ADAPTIVE_GUARD,
    rootTransform: COMPACT_ROOT_TRANSFORM,
    adaptiveRootTransform: COMPACT_ADAPTIVE_ROOT_TRANSFORM,
    background: COMPACT_AUTHORED_FILL,
    adaptiveBackground: COMPACT_AUTHORED_FILL,
    lane: "profile-bound-in009-root-bitmap-mask-special-v1",
  },
  "g5-l4-fq001-special": {
    marker:
      "Generated by scripts/build-g5-l4-fq001-dual-sprite-composite-candidate.mjs",
    expectedPageRendererCount: 1,
    helperAbiSha256:
      "30434b55d3e67a0836d517244a3111851a37be9ede6987300c4783bfabebfb8b",
    functionSignature: STANDARD_FUNCTION_SIGNATURE,
    guard: STANDARD_NATIVE_GUARD,
    adaptiveGuard: ADAPTIVE_GUARD,
    rootTransform: STANDARD_ROOT_TRANSFORM,
    adaptiveRootTransform: STANDARD_ADAPTIVE_ROOT_TRANSFORM,
    background: STANDARD_TARGET_FILL,
    adaptiveBackground: STANDARD_AUTHORED_FILL,
    lane: "profile-bound-g5-l4-fq001-dual-sprite-special-v1",
  },
  "g4-l3-loaded-swf-host": {
    marker: "Generated by scripts/build-safe-ffdec-canvas-adapter.mjs",
    expectedPageRendererCount: 0,
    helperAbiSha256:
      "7b41c10fd8e7ac62b94545df0375fe44fad1a5a1246e01c442814b12450647b1",
    functionSignature: STANDARD_FUNCTION_SIGNATURE,
    guard: STANDARD_NATIVE_GUARD,
    adaptiveGuard: ADAPTIVE_GUARD,
    rootTransform: STANDARD_ROOT_TRANSFORM,
    adaptiveRootTransform: STANDARD_ADAPTIVE_ROOT_TRANSFORM,
    background: STANDARD_TARGET_CLEAR,
    adaptiveBackground: STANDARD_AUTHORED_CLEAR,
    lane: "profile-bound-g4-l3-loaded-swf-host-transparent-special-v1",
  },
});

export class AdaptiveCanvasBatchError extends Error {
  constructor(message, code = "ADAPTIVE_CANVAS_BATCH_FAILED") {
    super(message);
    this.name = "AdaptiveCanvasBatchError";
    this.code = code;
  }
}

function invariant(condition, message, code) {
  if (!condition) throw new AdaptiveCanvasBatchError(message, code);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort(compareText)) {
      result[key] = canonicalValue(value[key]);
    }
    return result;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function countString(source, marker) {
  return source.split(marker).length - 1;
}

function countPattern(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

function hasExactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const observed = Object.keys(value).sort(compareText);
  const expected = [...keys].sort(compareText);
  return observed.length === expected.length &&
    observed.every((key, index) => key === expected[index]);
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\")) {
    return false;
  }
  const segments = value.split("/");
  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== ".." &&
      SAFE_PATH_SEGMENT.test(segment),
  );
}

function projectRelative(projectRoot, absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function resolveWithin(projectRoot, relativePath, label) {
  invariant(
    isSafeRelativePath(relativePath),
    `${label}: expected a safe project-relative POSIX path`,
    "UNSAFE_PATH",
  );
  const resolved = path.resolve(projectRoot, ...relativePath.split("/"));
  const root = path.resolve(projectRoot);
  invariant(
    resolved.startsWith(`${root}${path.sep}`),
    `${label}: path escapes project root`,
    "UNSAFE_PATH",
  );
  return resolved;
}

async function readOrdinaryFile(absolutePath, label) {
  return (await readStableOrdinaryFile(absolutePath, label)).bytes;
}

function stableStatFields(stats) {
  invariant(
    stats.isFile() && stats.size >= 0n &&
      stats.size <= BigInt(Number.MAX_SAFE_INTEGER),
    "stable file read requires an ordinary safely-sized file",
    "UNSAFE_FILE_TYPE",
  );
  return {
    dev: stats.dev.toString(),
    ino: stats.ino.toString(),
    size: Number(stats.size),
    mtimeNs: stats.mtimeNs.toString(),
    ctimeNs: stats.ctimeNs.toString(),
    mode: Number(stats.mode),
    uid: Number(stats.uid),
    gid: Number(stats.gid),
    nlink: Number(stats.nlink),
  };
}

export async function readStableOrdinaryFile(absolutePath, label) {
  invariant(
    path.isAbsolute(absolutePath) && !absolutePath.includes("\0"),
    `${label}: stable read requires an absolute path`,
    "UNSAFE_PATH",
  );
  invariant(
    Number.isInteger(fileSystemConstants.O_NOFOLLOW),
    `${label}: this platform does not expose O_NOFOLLOW`,
    "UNSUPPORTED_STABLE_FILE_READ",
  );
  let handle;
  try {
    handle = await open(
      absolutePath,
      fileSystemConstants.O_RDONLY | fileSystemConstants.O_NOFOLLOW,
    );
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new AdaptiveCanvasBatchError(
        `${label}: file is missing`,
        "MISSING_FILE",
      );
    }
    if (["ELOOP", "EMLINK", "EFTYPE"].includes(error?.code)) {
      throw new AdaptiveCanvasBatchError(
        `${label}: expected an ordinary non-symlink file`,
        "UNSAFE_FILE_TYPE",
      );
    }
    throw error;
  }
  try {
    const before = stableStatFields(await handle.stat({bigint: true}));
    const bytes = await handle.readFile();
    const after = stableStatFields(await handle.stat({bigint: true}));
    invariant(
      canonicalJson(before) === canonicalJson(after) &&
        bytes.length === before.size,
      `${label}: file identity changed while it was read`,
      "UNSTABLE_FILE_READ",
    );
    return {
      bytes,
      identity: {
        ...before,
        sha256: sha256(bytes),
      },
    };
  } finally {
    await handle.close();
  }
}

export function stableFileIdentityEquals(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

export async function readAndValidateAtomicCommitBuildReceipt({
  projectRoot = PROJECT_ROOT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const receipt = await readStableOrdinaryFile(
    resolveWithin(
      resolvedRoot,
      ATOMIC_COMMIT_BUILD_RECEIPT_PATH,
      "native atomic build receipt",
    ),
    "native atomic build receipt",
  );
  invariant(
    receipt.identity.sha256 === APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256,
    "native atomic build receipt does not match its independent approval pin",
    "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
  );
  let document;
  try {
    document = JSON.parse(receipt.bytes.toString("utf8"));
  } catch (error) {
    throw new AdaptiveCanvasBatchError(
      `native atomic build receipt is not JSON: ${error.message}`,
      "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
    );
  }
  invariant(
    receipt.bytes.equals(Buffer.from(
      `${JSON.stringify(canonicalValue(document), null, 2)}\n`,
    )) &&
      hasExactKeys(document, [
        "schemaVersion",
        "receiptType",
        "payloadSha256",
        "payload",
      ]) &&
      document.schemaVersion === 1 &&
      document.receiptType ===
        "adaptive-canvas-native-atomic-commit-build-v2" &&
      document.payloadSha256 ===
        sha256(Buffer.from(canonicalJson(document.payload))),
    "native atomic build receipt encoding or payload digest is invalid",
    "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
  );
  const payload = document.payload;
  const installed = payload?.installedHelper;
  invariant(
    payload?.status === "pass" &&
      payload.boundary === "native-atomic-capability-only-no-browser-no-apply" &&
      payload.protocol === REQUIRED_ATOMIC_COMMIT_CAPABILITY.protocol &&
      payload.staticContract?.entryCount === 286 &&
      payload.staticContract?.sha256 ===
        REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256 &&
      payload.staticContract?.penultimateTarget === V2_PROFILE_PATH &&
      payload.staticContract?.finalTarget === GENERATED_BINDINGS_PATH &&
      installed?.path === REQUIRED_ATOMIC_COMMIT_CAPABILITY.helperPath &&
      installed?.sha256 === APPROVED_ATOMIC_COMMIT_HELPER_SHA256 &&
      installed?.mode === 0o555 &&
      installed?.capability?.protocol ===
        REQUIRED_ATOMIC_COMMIT_CAPABILITY.protocol &&
      installed?.capability?.staticContractSha256 ===
        REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256 &&
      installed?.capability?.production === true &&
      installed?.capability?.expectedEntryCount === 286 &&
      hasExactKeys(payload.mutationBoundary, [
        "browserStarted",
        "applyInvoked",
        "productionRendererWritten",
        "v2ProfileWritten",
        "activeBindingWritten",
        "deploymentChanged",
      ]) &&
      Object.values(payload.mutationBoundary).every((value) => value === false),
    "native atomic build receipt does not authorize the exact reviewed capability",
    "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
  );
  const codeDescriptors = [
    payload.source,
    payload.driver,
    payload.nativeTest,
    payload.buildScript,
    payload.predecessorPlan,
  ];
  const verifiedCode = [];
  for (const descriptor of codeDescriptors) {
    invariant(
      descriptor && typeof descriptor.path === "string" &&
        Number.isSafeInteger(descriptor.size) && descriptor.size > 0 &&
        SHA256_PATTERN.test(descriptor.sha256 || ""),
      "native atomic build receipt has an invalid code descriptor",
      "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
    );
    const current = await readStableOrdinaryFile(
      resolveWithin(resolvedRoot, descriptor.path, "native atomic reviewed input"),
      `native atomic reviewed input ${descriptor.path}`,
    );
    invariant(
      current.identity.size === descriptor.size &&
        current.identity.sha256 === descriptor.sha256,
      `native atomic reviewed input drifted: ${descriptor.path}`,
      "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
    );
    verifiedCode.push({path: descriptor.path, identity: current.identity});
  }
  return {
    bytes: receipt.bytes,
    document,
    fileIdentity: receipt.identity,
    verifiedCode,
  };
}

export async function assertAtomicCommitCapabilityApproved({
  projectRoot = PROJECT_ROOT,
} = {}) {
  invariant(
    process.platform === "darwin" &&
      ATOMIC_COMMIT_DRIVER_IMPLEMENTED === true &&
      SHA256_PATTERN.test(APPROVED_ATOMIC_COMMIT_HELPER_SHA256 || ""),
    "no reviewed native atomic commit capability is approved; path-level CAS remains unimplemented and Gate0 remains NO-APPLY",
    "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
  );
  const resolvedRoot = path.resolve(projectRoot);
  const buildReceipt = await readAndValidateAtomicCommitBuildReceipt({
    projectRoot: resolvedRoot,
  });
  const helperPath = resolveWithin(
    resolvedRoot,
    REQUIRED_ATOMIC_COMMIT_CAPABILITY.helperPath,
    "native atomic commit helper",
  );
  const helper = await inspectAdaptiveAtomicCommitHelper({
    helperPath,
    expectedHelperSha256: APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
  }).catch((error) => {
    throw new AdaptiveCanvasBatchError(
      `native atomic commit helper failed capability attestation: ${error.message}`,
      "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
    );
  });
  invariant(
    helper.helperIdentity.sha256 === APPROVED_ATOMIC_COMMIT_HELPER_SHA256 &&
      helper.capability.protocol === REQUIRED_ATOMIC_COMMIT_CAPABILITY.protocol &&
      helper.capability.staticContractSha256 ===
        REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256 &&
      helper.capability.expectedEntryCount === 286 &&
      helper.capability.production === true &&
      canonicalJson(helper.capability) ===
        canonicalJson(buildReceipt.document.payload.installedHelper.capability),
    "native atomic commit helper differs from its reviewed capability contract",
    "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY",
  );
  return {
    capability: REQUIRED_ATOMIC_COMMIT_CAPABILITY,
    buildReceiptIdentity: buildReceipt.fileIdentity,
    helperIdentity: helper.helperIdentity,
    nativeReceipt: helper.capability,
  };
}

async function projectRootDirectoryIdentity(projectRoot) {
  const handle = await open(
    projectRoot,
    fileSystemConstants.O_RDONLY |
      (fileSystemConstants.O_DIRECTORY ?? 0) |
      fileSystemConstants.O_NOFOLLOW,
  );
  try {
    const before = await handle.stat({bigint: true});
    const after = await handle.stat({bigint: true});
    invariant(
      before.isDirectory() && after.isDirectory() &&
        before.dev === after.dev && before.ino === after.ino,
      "project root directory identity is unstable",
      "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
    );
    return {dev: before.dev.toString(), ino: before.ino.toString()};
  } finally {
    await handle.close();
  }
}

async function assertPathAbsent(absolutePath, label) {
  const entry = await lstat(absolutePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  invariant(
    entry === null,
    `${label}: expected the path to remain absent`,
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
}

export async function captureStablePathClosure({
  present,
  absent = [],
  label = "physical path closure",
}) {
  invariant(
    Array.isArray(present) && Array.isArray(absent),
    `${label}: present/absent path sets are required`,
    "INVALID_PHYSICAL_PATH_CLOSURE",
  );
  const paths = new Set();
  const capturedPresent = [];
  for (const [index, expected] of present.entries()) {
    invariant(
      hasExactKeys(expected, [
        "label",
        "absolutePath",
        "bytes",
        "sha256",
      ]) &&
        typeof expected.label === "string" && expected.label.length > 0 &&
        path.isAbsolute(expected.absolutePath) &&
        !expected.absolutePath.includes("\0") &&
        Number.isSafeInteger(expected.bytes) && expected.bytes >= 0 &&
        SHA256_PATTERN.test(expected.sha256) &&
        !paths.has(expected.absolutePath),
      `${label}: invalid or duplicate present path ${index}`,
      "INVALID_PHYSICAL_PATH_CLOSURE",
    );
    paths.add(expected.absolutePath);
    const stable = await readStableOrdinaryFile(
      expected.absolutePath,
      expected.label,
    );
    invariant(
      stable.bytes.length === expected.bytes &&
        stable.identity.sha256 === expected.sha256,
      `${expected.label}: current bytes differ from the closure contract`,
      "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
    );
    capturedPresent.push({...expected, identity: stable.identity});
  }
  const capturedAbsent = [];
  for (const [index, expected] of absent.entries()) {
    invariant(
      hasExactKeys(expected, ["label", "absolutePath"]) &&
        typeof expected.label === "string" && expected.label.length > 0 &&
        path.isAbsolute(expected.absolutePath) &&
        !expected.absolutePath.includes("\0") &&
        !paths.has(expected.absolutePath),
      `${label}: invalid or duplicate absent path ${index}`,
      "INVALID_PHYSICAL_PATH_CLOSURE",
    );
    paths.add(expected.absolutePath);
    await assertPathAbsent(expected.absolutePath, expected.label);
    capturedAbsent.push({...expected, state: "absent"});
  }
  return {
    schemaVersion: 1,
    label,
    present: capturedPresent,
    absent: capturedAbsent,
  };
}

export async function revalidateStablePathClosure(closure) {
  invariant(
    hasExactKeys(closure, [
      "schemaVersion",
      "label",
      "present",
      "absent",
    ]) && closure.schemaVersion === 1 &&
      typeof closure.label === "string" &&
      Array.isArray(closure.present) && Array.isArray(closure.absent),
    "invalid physical path closure",
    "INVALID_PHYSICAL_PATH_CLOSURE",
  );
  for (const expected of closure.present) {
    const stable = await readStableOrdinaryFile(
      expected.absolutePath,
      expected.label,
    );
    invariant(
      stable.bytes.length === expected.bytes &&
        stable.identity.sha256 === expected.sha256 &&
        stableFileIdentityEquals(stable.identity, expected.identity),
      `${expected.label}: file identity changed after the closure was captured`,
      "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
    );
  }
  for (const expected of closure.absent) {
    await assertPathAbsent(expected.absolutePath, expected.label);
  }
  return true;
}

export async function captureProductionPrecommitClosure({
  projectRoot = PROJECT_ROOT,
  plan,
}) {
  validateApplyPlanTargetSet(plan);
  const resolvedRoot = path.resolve(projectRoot);
  const present = plan.runtimeRecords.map((record) => ({
    label: record.assetPath,
    absolutePath: resolveWithin(
      resolvedRoot,
      `apps/web/public/flash-assets/courses/${record.relativePath}`,
      record.assetPath,
    ),
    bytes: record.input.bytes,
    sha256: record.input.sha256,
  }));
  const absent = [{
    label: V2_PROFILE_PATH,
    absolutePath: resolveWithin(resolvedRoot, V2_PROFILE_PATH, "v2 profile"),
  }];
  const bindingOutput = resolveWithin(
    resolvedRoot,
    GENERATED_BINDINGS_PATH,
    "generated bindings",
  );
  const binding = await readStableOrdinaryFile(
    bindingOutput,
    GENERATED_BINDINGS_PATH,
  ).catch((error) => {
    if (error?.code === "MISSING_FILE") return null;
    throw error;
  });
  if (binding === null) {
    absent.push({
      label: GENERATED_BINDINGS_PATH,
      absolutePath: bindingOutput,
    });
  } else {
    const inactiveBytes = inactiveV1BindingsBytes();
    invariant(
      binding.bytes.equals(inactiveBytes),
      `${GENERATED_BINDINGS_PATH}: expected the exact inactive-v1 placeholder`,
      "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
    );
    present.push({
      label: GENERATED_BINDINGS_PATH,
      absolutePath: bindingOutput,
      bytes: inactiveBytes.length,
      sha256: sha256(inactiveBytes),
    });
  }
  const closure = await captureStablePathClosure({
    present,
    absent,
    label: "adaptive production precommit closure",
  });
  invariant(
    closure.present.length + closure.absent.length === 286 &&
      closure.present.filter(({label: entryLabel}) =>
        entryLabel.startsWith("courses/")
      ).length === 284,
    "adaptive precommit closure must cover 284 runtimes plus binding and profile",
    "INVALID_PHYSICAL_PATH_CLOSURE",
  );
  return closure;
}

export async function captureProductionOutputClosure({
  projectRoot = PROJECT_ROOT,
  plan,
}) {
  validateApplyPlanTargetSet(plan);
  const resolvedRoot = path.resolve(projectRoot);
  const present = plan.runtimeRecords.map((record) => ({
    label: record.assetPath,
    absolutePath: resolveWithin(
      resolvedRoot,
      `apps/web/public/flash-assets/courses/${record.relativePath}`,
      record.assetPath,
    ),
    bytes: record.output.bytes,
    sha256: record.output.sha256,
  }));
  present.push(
    {
      label: V2_PROFILE_PATH,
      absolutePath: resolveWithin(resolvedRoot, V2_PROFILE_PATH, "v2 profile"),
      bytes: plan.v2ProfileBytes.length,
      sha256: sha256(plan.v2ProfileBytes),
    },
    {
      label: GENERATED_BINDINGS_PATH,
      absolutePath: resolveWithin(
        resolvedRoot,
        GENERATED_BINDINGS_PATH,
        "generated bindings",
      ),
      bytes: plan.bindingsBytes.length,
      sha256: sha256(plan.bindingsBytes),
    },
  );
  const closure = await captureStablePathClosure({
    present,
    label: "adaptive production postcommit output closure",
  });
  invariant(
    closure.present.length === 286,
    "adaptive postcommit closure must cover all 286 output targets",
    "INVALID_PHYSICAL_PATH_CLOSURE",
  );
  return closure;
}

async function relativeFileIdentityAndBytes(projectRoot, absolutePath, label) {
  const relativePath = projectRelative(projectRoot, absolutePath);
  invariant(
    isSafeRelativePath(relativePath),
    `${label}: resolved outside the project root`,
    "UNSAFE_PATH",
  );
  const bytes = await readOrdinaryFile(absolutePath, label);
  return {
    identity: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    bytes,
  };
}

async function relativeFileIdentity(projectRoot, absolutePath, label) {
  return (await relativeFileIdentityAndBytes(
    projectRoot,
    absolutePath,
    label,
  )).identity;
}

async function absoluteFileIdentity(absolutePath, label) {
  invariant(
    path.isAbsolute(absolutePath) && !absolutePath.includes("\0"),
    `${label}: expected an absolute path`,
    "UNSAFE_PATH",
  );
  const bytes = await readOrdinaryFile(absolutePath, label);
  return {
    path: absolutePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function directoryChecksumIdentity(projectRoot, absoluteRoot, label) {
  const rootRelativePath = projectRelative(projectRoot, absoluteRoot);
  invariant(
    isSafeRelativePath(rootRelativePath),
    `${label}: directory resolved outside the project root`,
    "UNSAFE_PATH",
  );
  const rows = [];
  let totalBytes = 0;
  const visit = async (absoluteDirectory, relativeDirectory = "") => {
    const entries = await readdir(absoluteDirectory, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      invariant(
        SAFE_PATH_SEGMENT.test(entry.name) && !entry.isSymbolicLink(),
        `${label}/${relativePath}: unsupported path or symlink`,
        "UNSAFE_FILE_TYPE",
      );
      const absolutePath = path.join(absoluteDirectory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else {
        invariant(
          entry.isFile(),
          `${label}/${relativePath}: expected a regular file`,
          "UNSAFE_FILE_TYPE",
        );
        const bytes = await readOrdinaryFile(
          absolutePath,
          `${label}/${relativePath}`,
        );
        totalBytes += bytes.length;
        rows.push(`${sha256(bytes)} ${bytes.length} ${relativePath}`);
      }
    }
  };
  await visit(absoluteRoot);
  invariant(rows.length > 0, `${label}: package tree is empty`);
  return {
    path: rootRelativePath,
    fileCount: rows.length,
    totalBytes,
    checksumSetSha256: sha256(Buffer.from(rows.join("\n"))),
  };
}

function chromiumRuntimeBinaryPath(executablePath, browserVersion) {
  if (process.platform !== "darwin") return executablePath;
  const appMarker = ".app/Contents/MacOS/";
  const markerIndex = executablePath.indexOf(appMarker);
  invariant(
    markerIndex > 0,
    "Chromium macOS executable is outside an application bundle",
    "INVALID_CHROMIUM_TOOLCHAIN",
  );
  const appRoot = executablePath.slice(0, markerIndex + ".app".length);
  return path.join(
    appRoot,
    "Contents/Frameworks/Google Chrome for Testing Framework.framework/Versions",
    browserVersion,
    "Google Chrome for Testing Framework",
  );
}

export async function collectChromiumToolchainIdentity({
  projectRoot = PROJECT_ROOT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const packageLockPath = resolveWithin(
    resolvedRoot,
    "package-lock.json",
    "package lock",
  );
  const playwrightPackagePath = REQUIRE.resolve("playwright/package.json");
  const playwrightCorePackagePath = REQUIRE.resolve(
    "playwright-core/package.json",
  );
  const browsersJsonPath = path.join(
    path.dirname(playwrightCorePackagePath),
    "browsers.json",
  );
  const [
    packageLock,
    playwrightPackageFile,
    playwrightCorePackageFile,
    browsersJsonFile,
    nodeExecutable,
    playwrightPackageTree,
    playwrightCorePackageTree,
  ] = await Promise.all([
    relativeFileIdentity(resolvedRoot, packageLockPath, "package lock"),
    relativeFileIdentityAndBytes(
      resolvedRoot,
      playwrightPackagePath,
      "Playwright package.json",
    ),
    relativeFileIdentityAndBytes(
      resolvedRoot,
      playwrightCorePackagePath,
      "Playwright Core package.json",
    ),
    relativeFileIdentityAndBytes(
      resolvedRoot,
      browsersJsonPath,
      "Playwright browsers.json",
    ),
    absoluteFileIdentity(process.execPath, "Node executable"),
    directoryChecksumIdentity(
      resolvedRoot,
      path.dirname(playwrightPackagePath),
      "Playwright package tree",
    ),
    directoryChecksumIdentity(
      resolvedRoot,
      path.dirname(playwrightCorePackagePath),
      "Playwright Core package tree",
    ),
  ]);
  const playwrightPackageDocument = JSON.parse(
    playwrightPackageFile.bytes.toString("utf8"),
  );
  const playwrightCorePackageDocument = JSON.parse(
    playwrightCorePackageFile.bytes.toString("utf8"),
  );
  const browsersDocument = JSON.parse(
    browsersJsonFile.bytes.toString("utf8"),
  );
  const chromiumDescriptor = browsersDocument?.browsers?.find(
    ({name}) => name === "chromium",
  );
  invariant(
    typeof playwrightPackageDocument?.version === "string" &&
      playwrightPackageDocument.version.length > 0 &&
      playwrightCorePackageDocument?.version ===
        playwrightPackageDocument.version,
    "Playwright/Playwright Core package version is missing or inconsistent",
    "INVALID_CHROMIUM_TOOLCHAIN",
  );
  invariant(
    chromiumDescriptor &&
      typeof chromiumDescriptor.revision === "string" &&
      chromiumDescriptor.revision.length > 0 &&
      typeof chromiumDescriptor.browserVersion === "string" &&
      chromiumDescriptor.browserVersion.length > 0,
    "Playwright Chromium descriptor is missing",
    "INVALID_CHROMIUM_TOOLCHAIN",
  );
  const {chromium} = await import("playwright");
  const chromiumExecutablePath = chromium.executablePath();
  invariant(
    chromiumExecutablePath.includes(
      `${path.sep}chromium-${chromiumDescriptor.revision}${path.sep}`,
    ),
    "Chromium executable path does not bind the manifest revision",
    "INVALID_CHROMIUM_TOOLCHAIN",
  );
  const chromiumRuntimePath = chromiumRuntimeBinaryPath(
    chromiumExecutablePath,
    chromiumDescriptor.browserVersion,
  );
  const [
    chromiumExecutable,
    chromiumRuntimeBinary,
    playwrightPackageTreeAfterImport,
    playwrightCorePackageTreeAfterImport,
  ] = await Promise.all([
    absoluteFileIdentity(chromiumExecutablePath, "Chromium executable"),
    absoluteFileIdentity(chromiumRuntimePath, "Chromium runtime binary"),
    directoryChecksumIdentity(
      resolvedRoot,
      path.dirname(playwrightPackagePath),
      "Playwright package tree after import",
    ),
    directoryChecksumIdentity(
      resolvedRoot,
      path.dirname(playwrightCorePackagePath),
      "Playwright Core package tree after import",
    ),
  ]);
  invariant(
    canonicalJson(playwrightPackageTreeAfterImport) ===
      canonicalJson(playwrightPackageTree) &&
      canonicalJson(playwrightCorePackageTreeAfterImport) ===
        canonicalJson(playwrightCorePackageTree),
    "Playwright package code changed while it was loaded",
    "INVALID_CHROMIUM_TOOLCHAIN",
  );
  return {
    node: {
      version: process.version,
      versionsSha256: sha256(Buffer.from(canonicalJson(process.versions))),
      executable: nodeExecutable,
    },
    platform: {
      name: process.platform,
      arch: process.arch,
      endianness: osEndianness(),
    },
    os: {
      type: osType(),
      release: osRelease(),
      version: osVersion(),
    },
    packageLock,
    playwright: {
      version: playwrightPackageDocument.version,
      packageJson: playwrightPackageFile.identity,
      packageTree: playwrightPackageTree,
    },
    playwrightCore: {
      version: playwrightCorePackageDocument.version,
      packageJson: playwrightCorePackageFile.identity,
      packageTree: playwrightCorePackageTree,
    },
    browsersManifest: {
      ...browsersJsonFile.identity,
      chromiumRevision: chromiumDescriptor.revision,
      chromiumBrowserVersion: chromiumDescriptor.browserVersion,
    },
    chromium: {
      revision: chromiumDescriptor.revision,
      browserVersion: chromiumDescriptor.browserVersion,
      executable: chromiumExecutable,
      runtimeBinary: chromiumRuntimeBinary,
    },
  };
}

export function computeProfileChecksumSet(entries) {
  const rows = entries.map((entry, index) => {
    invariant(
      Number.isSafeInteger(entry?.bytes) && entry.bytes >= 0,
      `profile entry ${index}: invalid bytes`,
    );
    invariant(
      SHA256_PATTERN.test(entry?.sha256 || ""),
      `profile entry ${index}: invalid sha256`,
    );
    invariant(
      isSafeRelativePath(entry?.relativePath),
      `profile entry ${index}: invalid relativePath`,
    );
    return `${entry.sha256} ${entry.bytes} ${entry.relativePath}`;
  });
  rows.sort((left, right) => {
    const leftPath = left.slice(left.indexOf(" ", left.indexOf(" ") + 1) + 1);
    const rightPath = right.slice(
      right.indexOf(" ", right.indexOf(" ") + 1) + 1,
    );
    return compareText(leftPath, rightPath);
  });
  return sha256(Buffer.from(rows.join("\n")));
}

function validateProfileEntry(entry, index) {
  const keys = [
    "assetPath",
    "relativePath",
    "storageRoot",
    "releaseId",
    "bytes",
    "sha256",
  ];
  invariant(hasExactKeys(entry, keys), `profile entry ${index}: invalid keys`);
  invariant(
    isSafeRelativePath(entry.assetPath) &&
      isSafeRelativePath(entry.relativePath) &&
      entry.assetPath === `courses/${entry.relativePath}`,
    `profile entry ${index}: invalid asset path binding`,
  );
  invariant(
    entry.storageRoot === "public" || entry.storageRoot === "server-audio",
    `profile entry ${index}: unsupported storageRoot`,
  );
  invariant(
    APPROVED_RELEASE_IDS.includes(entry.releaseId),
    `profile entry ${index}: releaseId is outside production five`,
  );
  invariant(
    Number.isSafeInteger(entry.bytes) && entry.bytes >= 0 &&
      SHA256_PATTERN.test(entry.sha256),
    `profile entry ${index}: invalid byte binding`,
  );
}

function canonicalPageRendererIdentity(entry) {
  if (entry.storageRoot !== "public") return null;
  return PAGE_RENDERER_ASSET_PATTERN.exec(entry.assetPath)?.[1] ?? null;
}

function assetAbsolutePath(projectRoot, entry) {
  const root = entry.storageRoot === "public"
    ? "apps/web/public/flash-assets/courses"
    : "apps/web/server-assets/flash-assets/courses";
  return resolveWithin(projectRoot, `${root}/${entry.relativePath}`, entry.assetPath);
}

export async function loadFixedV1Profile(projectRoot = PROJECT_ROOT) {
  const absolutePath = resolveWithin(projectRoot, V1_PROFILE_PATH, "v1 profile");
  const bytes = await readOrdinaryFile(absolutePath, V1_PROFILE_PATH);
  invariant(
    bytes.length === 419688 && sha256(bytes) === EXPECTED_V1_PROFILE_SHA256,
    `v1 profile bytes are outside the fixed production input: ${sha256(bytes)}`,
    "V1_PROFILE_IDENTITY_MISMATCH",
  );
  let profile;
  try {
    profile = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new AdaptiveCanvasBatchError(
      `v1 profile is invalid JSON: ${error.message}`,
      "V1_PROFILE_INVALID",
    );
  }
  const keys = [
    "schemaVersion",
    "profileId",
    "generatedBy",
    "approvalScope",
    "approvedReleaseIds",
    "counts",
    "checksumSetSha256",
    "entries",
  ];
  invariant(hasExactKeys(profile, keys), "v1 profile keys are not exact");
  invariant(
    profile.schemaVersion === 1 &&
      profile.profileId === "current-js-production-assets-v1" &&
      profile.approvalScope === "five-lesson-current-js-production-closure" &&
      JSON.stringify(profile.approvedReleaseIds) ===
        JSON.stringify(APPROVED_RELEASE_IDS) &&
      JSON.stringify(profile.counts) === JSON.stringify(PROFILE_COUNTS) &&
      Array.isArray(profile.entries) && profile.entries.length === 1114,
    "v1 profile contract is outside the fixed production-five input",
  );
  profile.entries.forEach(validateProfileEntry);
  invariant(
    computeProfileChecksumSet(profile.entries) ===
      EXPECTED_V1_CHECKSUM_SET_SHA256 &&
      profile.checksumSetSha256 === EXPECTED_V1_CHECKSUM_SET_SHA256,
    "v1 profile checksum set mismatch",
  );
  const storageKeys = new Set();
  const assetPaths = new Set();
  for (const entry of profile.entries) {
    const storageKey = `${entry.storageRoot}\u0000${entry.relativePath}`;
    invariant(!storageKeys.has(storageKey), `duplicate storage entry: ${entry.assetPath}`);
    invariant(!assetPaths.has(entry.assetPath), `duplicate assetPath: ${entry.assetPath}`);
    storageKeys.add(storageKey);
    assetPaths.add(entry.assetPath);
  }
  const pageRenderers = profile.entries
    .map((entry) => ({entry, animationId: canonicalPageRendererIdentity(entry)}))
    .filter(({animationId}) => animationId !== null)
    .map(({entry, animationId}) => ({...entry, animationId}))
    .sort((left, right) => compareText(left.animationId, right.animationId));
  invariant(pageRenderers.length === 283, "v1 profile must contain 283 page renderers");
  invariant(
    pageRenderers.every(({animationId}) => !FORBIDDEN_G4_PREFIX.test(animationId)),
    "G4 L5/L10/L11 renderer entered the production-five batch",
  );
  invariant(
    computeProfileChecksumSet(pageRenderers) ===
      EXPECTED_PAGE_RENDERER_CHECKSUM_SET_SHA256,
    "page renderer subset checksum mismatch",
  );
  const loadedHostEntry = profile.entries.find(
    ({assetPath}) => assetPath === LOADED_HOST.assetPath,
  );
  invariant(
    loadedHostEntry?.sha256 === LOADED_HOST.inputSha256 &&
      loadedHostEntry.storageRoot === "public",
    "loaded-SWF host entry is absent or has drifted",
  );
  const nestedRendererLikeEntries = profile.entries.filter(
    ({assetPath, storageRoot}) =>
      storageRoot === "public" &&
      assetPath.endsWith("canvas-renderer.js") &&
      canonicalPageRendererIdentity({assetPath, storageRoot}) === null,
  );
  invariant(
    nestedRendererLikeEntries.length === 1 &&
      nestedRendererLikeEntries[0].assetPath === LOADED_HOST.assetPath,
    "unexpected nested canvas renderer entered or left the fixed profile",
  );
  return {absolutePath, bytes, profile, pageRenderers, loadedHostEntry};
}

function findMatchingBrace(source, openingIndex) {
  invariant(source[openingIndex] === "{", "function opening brace is required");
  let depth = 0;
  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '"' || character === "'" || character === "`") {
      const quote = character;
      index += 1;
      while (index < source.length) {
        if (source[index] === "\\") {
          index += 2;
          continue;
        }
        if (source[index] === quote) break;
        index += 1;
      }
      continue;
    }
    if (character === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      index += 2;
      while (
        index < source.length - 1 &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) index += 1;
      index += 1;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  throw new AdaptiveCanvasBatchError("unmatched function brace");
}

function functionRange(source, signature, label) {
  invariant(
    countString(source, signature) === 1,
    `${label}: expected exactly one ${signature}`,
    "UNKNOWN_RUNTIME_STRUCTURE",
  );
  const start = source.indexOf(signature);
  const opening = start + signature.length - 1;
  const end = findMatchingBrace(source, opening);
  return {start, end, text: source.slice(start, end)};
}

function metadataRange(source, label) {
  invariant(
    countString(source, METADATA_START) === 1,
    `${label}: expected exactly one METADATA declaration`,
    "UNKNOWN_RUNTIME_STRUCTURE",
  );
  const start = source.indexOf(METADATA_START) + METADATA_START.length;
  const end = source.indexOf(METADATA_END, start);
  invariant(
    end >= 0 && source.indexOf(METADATA_END, end + METADATA_END.length) < 0,
    `${label}: unsupported METADATA terminator`,
    "UNKNOWN_RUNTIME_STRUCTURE",
  );
  const text = source.slice(start, end);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new AdaptiveCanvasBatchError(
      `${label}: metadata is invalid JSON: ${error.message}`,
      "UNKNOWN_RUNTIME_STRUCTURE",
    );
  }
  return {start, end, text, value};
}

function familyFor({animationId, source, pageRenderer}) {
  if (!pageRenderer) return "g4-l3-loaded-swf-host";
  if (animationId === "course-g04-l03-in-009") return "g4-l3-in009-special";
  if (animationId === "course-g05-l04-fq-001") return "g5-l4-fq001-special";
  if (animationId.startsWith("course-g05-l05-")) {
    return "g5-l5-private-current-js";
  }
  const header = source.slice(0, 512);
  invariant(
    header.includes(FAMILY_CONTRACTS["safe-ffdec-canvas-adapter"].marker),
    `${animationId}: unknown page runtime family`,
    "UNKNOWN_RUNTIME_FAMILY",
  );
  return "safe-ffdec-canvas-adapter";
}

function helperAbiSha256(source, label) {
  invariant(
    countString(source, HELPER_END) === 1,
    `${label}: helper ABI terminator is not unique`,
    "UNKNOWN_HELPER_ABI",
  );
  const end = source.indexOf(HELPER_END) + HELPER_END.length;
  return sha256(Buffer.from(source.slice(0, end)));
}

function imageMimeFromBytes(bytes) {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))
  ) return "image/gif";
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "image/webp";
  const prefix = bytes.subarray(0, 256).toString("utf8").trimStart();
  if (prefix.startsWith("<svg") || prefix.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  return null;
}

function analyzeEmbeddedImages(source, label) {
  const pattern = new RegExp(DATA_IMAGE_PATTERN_SOURCE, "giu");
  const occurrences = [];
  for (const match of source.matchAll(pattern)) {
    const declaredMime = match[1].toLowerCase();
    const encoded = match[2];
    const bytes = Buffer.from(encoded, "base64");
    invariant(bytes.length > 0, `${label}: embedded image is empty`);
    invariant(
      bytes.toString("base64").replace(/=+$/u, "") ===
        encoded.replace(/=+$/u, ""),
      `${label}: embedded image base64 is not canonical`,
    );
    const detectedMime = imageMimeFromBytes(bytes);
    const normalizedMime = declaredMime === "image/jpg" ? "image/jpeg" : declaredMime;
    if (detectedMime !== null) {
      invariant(
        detectedMime === normalizedMime,
        `${label}: embedded image MIME mismatch`,
      );
    }
    occurrences.push({
      literal: match[0],
      decodedBytes: bytes.length,
      decodedSha256: sha256(bytes),
      mime: declaredMime,
    });
  }
  const literalRows = occurrences.map(
    ({literal}) => `${Buffer.byteLength(literal)}:${literal}`,
  );
  return {
    occurrenceCount: occurrences.length,
    uniqueDecodedImageCount: new Set(
      occurrences.map(({decodedSha256}) => decodedSha256),
    ).size,
    literalSequenceSha256: sha256(Buffer.from(literalRows.join("\n"))),
    decodedSequenceSha256: sha256(Buffer.from(occurrences.map(
      ({decodedSha256, decodedBytes, mime}) =>
        `${decodedSha256} ${decodedBytes} ${mime}`,
    ).join("\n"))),
  };
}

function actualFilterPlacementCount(source) {
  const definitionPattern =
    /Filters\.([A-Za-z_$][\w$]*)\s*=\s*function\s*\([^)]*\)\s*\{/gu;
  const callPattern = /Filters\.([A-Za-z_$][\w$]*)\s*\(/gu;
  const definitions = [];
  for (const match of source.matchAll(definitionPattern)) {
    const opening = match.index + match[0].lastIndexOf("{");
    definitions.push({start: match.index, end: findMatchingBrace(source, opening)});
  }
  let placements = 0;
  for (const match of source.matchAll(callPattern)) {
    if (!definitions.some(({start, end}) => match.index >= start && match.index < end)) {
      placements += 1;
    }
  }
  return placements;
}

function semanticStructure(source, helperSha256) {
  const offscreenTransforms = countPattern(
    source,
    /\bo\.ctx\.setTransform\s*\(/gu,
  );
  const sourceStrokeResetSites = countPattern(
    source,
    /draw(?:Morph)?Path\s*\(\s*ctx[^\n;]*,\s*true(?:\s*,|\s*\))/gu,
  );
  const clipCalls = countPattern(source, /(?<![.\w])ctx\.clip\s*\(/gu);
  const globalCompositeOperationReferences = countPattern(
    source,
    /\.globalCompositeOperation\b/gu,
  );
  const actualFilters = actualFilterPlacementCount(source);
  invariant(
    actualFilters === 0,
    "actual FFDec filter placement has no calibrated adaptive pixel-space proof",
    "UNPROVEN_FILTER_PIXEL_SPACE",
  );
  const enhanceContextTracksMatrix =
    source.includes("this._matrix = [a, b, c, d, e, f];") &&
    source.includes("ret.x = this._matrix[0] * p.x + this._matrix[2] * p.y + this._matrix[4];");
  const strokeResetUsesPhysicalPoints =
    source.includes("var k = ctx.applyTransformToPoint") &&
    source.includes("ctx.lineWidth *= 20 * Math.max(ctx._matrix[0], ctx._matrix[3]);") &&
    countString(source, "ctx.setTransform(1, 0, 0, 1, 0, 0);") >= 2;
  const maskBackingsFollowCanvas =
    source.includes("createCanvas(canvas.width,canvas.height)") &&
    source.includes("o.ctx.applyTransforms(ms);");
  const blendBackingsFollowCanvas =
    source.includes("var ncanvas = createCanvas(canvas.width, canvas.height);") &&
    source.includes("ctx.applyTransforms(oldctx._matrix);");
  if (sourceStrokeResetSites > 0) {
    invariant(
      enhanceContextTracksMatrix && strokeResetUsesPhysicalPoints,
      "stroke reset sites lack the calibrated physical-point proof",
      "UNPROVEN_STROKE_PIXEL_SPACE",
    );
  }
  if (offscreenTransforms > 0) {
    invariant(
      enhanceContextTracksMatrix && maskBackingsFollowCanvas,
      "offscreen mask contexts lack the calibrated backing/matrix proof",
      "UNPROVEN_MASK_PIXEL_SPACE",
    );
  }
  return {
    helperAbiSha256: helperSha256,
    offscreenContextTransformCount: offscreenTransforms,
    sourceStrokeResetSiteCount: sourceStrokeResetSites,
    clipCallCount: clipCalls,
    globalCompositeOperationReferenceCount: globalCompositeOperationReferences,
    actualFilterPlacementCount: actualFilters,
    proofs: {
      enhancedContextMatrixTracksRootScale: enhanceContextTracksMatrix,
      strokeResetTransformsPointsAndLineWidthBeforeIdentityDraw:
        sourceStrokeResetSites === 0 || strokeResetUsesPhysicalPoints,
      maskBackingUsesCurrentBackingAndRestoresTrackedMatrix:
        offscreenTransforms === 0 || maskBackingsFollowCanvas,
      blendBackingUsesCurrentBackingAndCopiesTrackedMatrix:
        blendBackingsFollowCanvas,
      filters: "not-applicable-zero-actual-filter-placements",
    },
  };
}

function resolutionInsertion(metadataText) {
  const pretty = metadataText.includes("\n") && metadataText.endsWith("\n}");
  if (!pretty) {
    return `,\"resolution\":${JSON.stringify(RESOLUTION)}`;
  }
  const lines = JSON.stringify(RESOLUTION, null, 2).split("\n");
  return [
    `,\n  \"resolution\": ${lines[0]}`,
    ...lines.slice(1).map((line) => `  ${line}`),
  ].join("\n");
}

function applyEdits(source, edits) {
  const sorted = [...edits].sort((left, right) => right.start - left.start);
  let previousStart = source.length;
  let result = source;
  for (const edit of sorted) {
    invariant(
      edit.start <= edit.end && edit.end <= previousStart,
      `overlapping adaptive edit: ${edit.label}`,
    );
    invariant(
      source.slice(edit.start, edit.end) === edit.original,
      `adaptive edit input mismatch: ${edit.label}`,
    );
    result = `${result.slice(0, edit.start)}${edit.replacement}${result.slice(edit.end)}`;
    previousStart = edit.start;
  }
  return result;
}

function oneMarkerEdit(section, marker, replacement, label) {
  invariant(
    countString(section.text, marker) === 1,
    `${label}: expected exactly one marker in the render entrypoint`,
    "UNKNOWN_RUNTIME_STRUCTURE",
  );
  const local = section.text.indexOf(marker);
  return {
    start: section.start + local,
    end: section.start + local + marker.length,
    original: marker,
    replacement,
    label,
  };
}

function validateMetadata(metadata, {metadataAnimationId, adaptive, label}) {
  invariant(
    metadata.value?.schemaVersion === 1 &&
      metadata.value.animationId === metadataAnimationId &&
      metadata.value.stage?.width === 800 &&
      metadata.value.stage?.height === 600,
    `${label}: metadata identity/native stage mismatch`,
  );
  if (!adaptive) {
    invariant(
      !Object.prototype.hasOwnProperty.call(metadata.value, "resolution"),
      `${label}: v1 input already contains resolution metadata`,
      "ALREADY_ADAPTIVE",
    );
    return;
  }
  invariant(
    hasExactKeys(metadata.value.resolution, [
      "schemaVersion",
      "mode",
      "nativeWidth",
      "nativeHeight",
      "supportedRenderScales",
    ]) &&
      canonicalJson(metadata.value.resolution) === canonicalJson(RESOLUTION),
    `${label}: adaptive resolution metadata is not exact`,
    "ADAPTIVE_METADATA_MISMATCH",
  );
}

function validateRegistryKey(source, registryAnimationId, label) {
  const quoted = `registry[\"${registryAnimationId}\"] = Object.freeze`;
  invariant(
    countString(source, quoted) === 1,
    `${label}: registry key mismatch`,
    "REGISTRY_IDENTITY_MISMATCH",
  );
}

export function transformAdaptiveRuntime({
  inputBytes,
  profileEntry,
  animationId,
  metadataAnimationId = animationId,
  registryAnimationId = animationId,
  pageRenderer = true,
}) {
  invariant(Buffer.isBuffer(inputBytes), `${animationId}: inputBytes must be a Buffer`);
  invariant(
    inputBytes.length === profileEntry.bytes &&
      sha256(inputBytes) === profileEntry.sha256,
    `${animationId}: v1 bytes differ from the profile binding`,
    "V1_RUNTIME_IDENTITY_MISMATCH",
  );
  const source = inputBytes.toString("utf8");
  invariant(
    Buffer.from(source).equals(inputBytes),
    `${animationId}: runtime is not lossless UTF-8`,
    "RUNTIME_ENCODING_UNSUPPORTED",
  );
  const family = familyFor({animationId, source, pageRenderer});
  const contract = FAMILY_CONTRACTS[family];
  const header = source.slice(0, 512);
  invariant(
    header.includes(contract.marker),
    `${animationId}: family marker mismatch for ${family}`,
    "UNKNOWN_RUNTIME_FAMILY",
  );
  const observedHelperSha256 = helperAbiSha256(source, animationId);
  invariant(
    observedHelperSha256 === contract.helperAbiSha256,
    `${animationId}: helper ABI drift for ${family}: ${observedHelperSha256}`,
    "UNKNOWN_HELPER_ABI",
  );
  if (family === "g5-l5-private-current-js") {
    invariant(
      countString(
        source,
        "function render(targetCanvas, request) {\n    return renderInternal(targetCanvas, request, false);\n}",
      ) === 1,
      `${animationId}: G5 L5 render delegation drifted`,
      "UNKNOWN_RUNTIME_STRUCTURE",
    );
  }
  validateRegistryKey(source, registryAnimationId, animationId);
  invariant(
    countString(source, "request.renderScale") === 0,
    `${animationId}: v1 input already references request.renderScale`,
    "ALREADY_ADAPTIVE",
  );
  const metadata = metadataRange(source, animationId);
  validateMetadata(metadata, {metadataAnimationId, adaptive: false, label: animationId});
  const entrypoint = functionRange(
    source,
    contract.functionSignature,
    animationId,
  );
  const semantics = semanticStructure(source, observedHelperSha256);
  const imagesBefore = analyzeEmbeddedImages(source, animationId);
  const insertion = resolutionInsertion(metadata.text);
  const metadataClose = metadata.end - 1;
  invariant(source[metadataClose] === "}", `${animationId}: metadata must end in }`);
  const edits = [
    {
      start: metadataClose,
      end: metadataClose,
      original: "",
      replacement: insertion,
      label: "resolution-metadata",
    },
    oneMarkerEdit(
      entrypoint,
      contract.guard,
      contract.adaptiveGuard,
      `${animationId}: native backing guard`,
    ),
    oneMarkerEdit(
      entrypoint,
      contract.rootTransform,
      contract.adaptiveRootTransform,
      `${animationId}: authored root transform`,
    ),
  ];
  if (contract.background !== contract.adaptiveBackground) {
    edits.push(oneMarkerEdit(
      entrypoint,
      contract.background,
      contract.adaptiveBackground,
      `${animationId}: authored background extent`,
    ));
  } else {
    invariant(
      countString(entrypoint.text, contract.background) === 1,
      `${animationId}: authored background extent drifted`,
      "UNKNOWN_RUNTIME_STRUCTURE",
    );
  }
  const outputSource = applyEdits(source, edits);
  const outputBytes = Buffer.from(outputSource);
  const outputMetadata = metadataRange(outputSource, animationId);
  validateMetadata(outputMetadata, {
    metadataAnimationId,
    adaptive: true,
    label: animationId,
  });
  validateRegistryKey(outputSource, registryAnimationId, animationId);
  const imagesAfter = analyzeEmbeddedImages(outputSource, animationId);
  invariant(
    canonicalJson(imagesAfter) === canonicalJson(imagesBefore),
    `${animationId}: embedded bitmap bytes changed`,
    "EMBEDDED_BITMAP_DRIFT",
  );
  let reverted = outputSource;
  for (const edit of [...edits].reverse()) {
    invariant(
      countString(reverted, edit.replacement) === 1,
      `${animationId}: reverse marker is not unique: ${edit.label}`,
      "REVERSE_PROOF_FAILED",
    );
    reverted = reverted.replace(edit.replacement, edit.original);
  }
  const revertedBytes = Buffer.from(reverted);
  invariant(
    revertedBytes.equals(inputBytes),
    `${animationId}: reverse proof did not recover v1 bytes`,
    "REVERSE_PROOF_FAILED",
  );
  return {
    outputBytes,
    record: {
      animationId: registryAnimationId,
      metadataAnimationId,
      pageRenderer,
      assetPath: profileEntry.assetPath,
      relativePath: profileEntry.relativePath,
      releaseId: profileEntry.releaseId,
      family,
      lane: contract.lane,
      input: {bytes: inputBytes.length, sha256: profileEntry.sha256},
      output: {bytes: outputBytes.length, sha256: sha256(outputBytes)},
      resolution: RESOLUTION,
      sourceBitmapResolutionBound: imagesBefore.occurrenceCount > 0,
      embeddedBitmaps: {
        ...imagesBefore,
        bytesUnchanged: true,
      },
      edits: {
        resolutionMetadata: 1,
        backingGuard: 1,
        authoredRootTransform: 1,
        authoredBackgroundExtent:
          contract.background === contract.adaptiveBackground ? 0 : 1,
        total: edits.length,
      },
      pixelSpaceSemantics: semantics,
      reverseProof: {
        byteIdenticalToV1: true,
        recoveredBytes: revertedBytes.length,
        recoveredSha256: sha256(revertedBytes),
      },
      provenance: {
        basis: "hash-bound-current-js-production-v1-runtime-bytes",
        sourceFirstRegenerationPerformed: false,
        sourceFirstRegenerationClaimed: false,
        provenanceDebt:
          "adaptive runtime derived mechanically from the profile-bound Current-JS v1 runtime; preserved FLA/SWF was not recompiled in this batch",
      },
    },
  };
}

export function reverseAdaptiveRuntime({
  outputBytes,
  profileEntry,
  animationId,
  metadataAnimationId = animationId,
  registryAnimationId = animationId,
  pageRenderer = true,
}) {
  invariant(Buffer.isBuffer(outputBytes), `${animationId}: outputBytes must be a Buffer`);
  const source = outputBytes.toString("utf8");
  invariant(Buffer.from(source).equals(outputBytes), `${animationId}: runtime is not UTF-8`);
  const family = familyFor({animationId, source, pageRenderer});
  const contract = FAMILY_CONTRACTS[family];
  invariant(
    helperAbiSha256(source, animationId) === contract.helperAbiSha256,
    `${animationId}: adaptive helper ABI drift`,
    "UNKNOWN_HELPER_ABI",
  );
  validateRegistryKey(source, registryAnimationId, animationId);
  const metadata = metadataRange(source, animationId);
  validateMetadata(metadata, {metadataAnimationId, adaptive: true, label: animationId});
  const entrypoint = functionRange(source, contract.functionSignature, animationId);
  const insertion = resolutionInsertion(
    (() => {
      const clone = {...metadata.value};
      delete clone.resolution;
      if (metadata.text.includes("\n")) {
        const propertyIndex = metadata.text.lastIndexOf(',\n  "resolution":');
        invariant(propertyIndex >= 0, `${animationId}: pretty resolution insertion missing`);
        return `${metadata.text.slice(0, propertyIndex)}\n}`;
      }
      const propertyIndex = metadata.text.lastIndexOf(',"resolution":');
      invariant(propertyIndex >= 0, `${animationId}: compact resolution insertion missing`);
      return `${metadata.text.slice(0, propertyIndex)}}`;
    })(),
  );
  const edits = [];
  const metadataInsertionIndex = source.lastIndexOf(insertion, metadata.end);
  invariant(
    metadataInsertionIndex >= metadata.start &&
      metadataInsertionIndex < metadata.end &&
      countString(metadata.text, insertion) === 1,
    `${animationId}: adaptive resolution insertion is not exact`,
    "REVERSE_PROOF_FAILED",
  );
  edits.push({
    start: metadataInsertionIndex,
    end: metadataInsertionIndex + insertion.length,
    original: insertion,
    replacement: "",
    label: "remove resolution metadata",
  });
  edits.push(oneMarkerEdit(
    entrypoint,
    contract.adaptiveGuard,
    contract.guard,
    `${animationId}: reverse backing guard`,
  ));
  edits.push(oneMarkerEdit(
    entrypoint,
    contract.adaptiveRootTransform,
    contract.rootTransform,
    `${animationId}: reverse root transform`,
  ));
  if (contract.background !== contract.adaptiveBackground) {
    edits.push(oneMarkerEdit(
      entrypoint,
      contract.adaptiveBackground,
      contract.background,
      `${animationId}: reverse background extent`,
    ));
  }
  const revertedBytes = Buffer.from(applyEdits(source, edits));
  invariant(
    revertedBytes.length === profileEntry.bytes &&
      sha256(revertedBytes) === profileEntry.sha256,
    `${animationId}: adaptive reverse proof does not match v1 profile`,
    "REVERSE_PROOF_FAILED",
  );
  return revertedBytes;
}

async function verifyLiveRendererFileSet(projectRoot, expectedPageRendererIds) {
  const coursesRoot = resolveWithin(
    projectRoot,
    "apps/web/public/flash-assets/courses",
    "public Canvas courses root",
  );
  const directories = await readdir(coursesRoot, {withFileTypes: true});
  const observed = [];
  for (const directory of directories) {
    if (
      !directory.isDirectory() ||
      !LIVE_LESSON_PREFIXES.some((prefix) => directory.name.startsWith(prefix))
    ) continue;
    const rendererPath = path.join(coursesRoot, directory.name, "canvas-renderer.js");
    const entry = await lstat(rendererPath).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (entry === null) continue;
    invariant(
      entry.isFile() && !entry.isSymbolicLink(),
      `${directory.name}: Canvas renderer is not an ordinary file`,
      "UNSAFE_FILE_TYPE",
    );
    observed.push(directory.name);
  }
  observed.sort(compareText);
  const expected = [...expectedPageRendererIds].sort(compareText);
  invariant(
    canonicalJson(observed) === canonicalJson(expected),
    `production-five external renderer file set changed: expected ${expected.length}, observed ${observed.length}`,
    "EXTERNAL_RENDERER_SET_CHANGED",
  );
  invariant(observed.length === 283, "production-five renderer file count must be 283");
  return observed;
}

function v2ProfileFrom(v1Profile, runtimeRecords) {
  const byAssetPath = new Map(
    runtimeRecords.map((record) => [record.assetPath, record]),
  );
  invariant(
    byAssetPath.size === 284,
    `expected 284 adaptive runtime records, observed ${byAssetPath.size}`,
  );
  const entries = v1Profile.entries.map((entry) => {
    const runtime = byAssetPath.get(entry.assetPath);
    return runtime
      ? {...entry, bytes: runtime.output.bytes, sha256: runtime.output.sha256}
      : {...entry};
  });
  invariant(entries.length === 1114, "v2 entry count changed");
  const profile = {
    schemaVersion: 2,
    profileId: "current-js-production-assets-v2",
    parentProfileId: "current-js-production-assets-v1",
    parentChecksumSetSha256: EXPECTED_V1_CHECKSUM_SET_SHA256,
    generatedBy: "scripts/generate-adaptive-canvas-batch.mjs",
    approvalScope: "five-lesson-current-js-production-closure",
    approvedReleaseIds: [...APPROVED_RELEASE_IDS],
    counts: {...PROFILE_COUNTS},
    checksumSetSha256: computeProfileChecksumSet(entries),
    entries,
  };
  return {profile, bytes: jsonBytes(profile)};
}

function tsString(value) {
  return JSON.stringify(value);
}

export function generatedBindingsBytes(runtimeRecords) {
  invariant(runtimeRecords.length === 284, "bindings require 284 runtime records");
  const sorted = [...runtimeRecords].sort((left, right) =>
    compareText(left.animationId, right.animationId)
  );
  invariant(
    new Set(sorted.map(({animationId}) => animationId)).size === 284,
    "binding animation IDs must be unique",
  );
  const loaded = sorted.find(({pageRenderer}) => !pageRenderer);
  invariant(
    loaded?.animationId === LOADED_HOST.registryAnimationId,
    "loaded-host binding is missing",
  );
  const lines = [
    "/* Generated by scripts/generate-adaptive-canvas-batch.mjs. Do not edit. */",
    "",
    "export interface AdaptiveCanvasProductionResolution {",
    "  readonly schemaVersion: 1;",
    '  readonly mode: "adaptive-integer";',
    "  readonly nativeWidth: 800;",
    "  readonly nativeHeight: 600;",
    "  readonly supportedRenderScales: readonly [1, 2];",
    "}",
    "",
    "export interface AdaptiveCanvasProductionBinding {",
    "  readonly animationId: string;",
    "  readonly pageRenderer: boolean;",
    "  readonly assetPath: `/flash-assets/courses/${string}`;",
    "  readonly assetSha256: string;",
    "  readonly resolution: AdaptiveCanvasProductionResolution;",
    "  readonly sourceBitmapResolutionBound: boolean;",
    "}",
    "",
    "const ADAPTIVE_CANVAS_PRODUCTION_RESOLUTION = Object.freeze({",
    "  schemaVersion: 1,",
    '  mode: "adaptive-integer",',
    "  nativeWidth: 800,",
    "  nativeHeight: 600,",
    "  supportedRenderScales: Object.freeze([1, 2] as const),",
    "} satisfies AdaptiveCanvasProductionResolution);",
    "",
    "const ADAPTIVE_CANVAS_PRODUCTION_BINDINGS: Readonly<Record<string, AdaptiveCanvasProductionBinding>> = Object.freeze({",
  ];
  for (const record of sorted) {
    lines.push(
      `  ${tsString(record.animationId)}: Object.freeze({`,
      `    animationId: ${tsString(record.animationId)},`,
      `    pageRenderer: ${record.pageRenderer},`,
      `    assetPath: ${tsString(`/flash-assets/${record.assetPath}`)},`,
      `    assetSha256: ${tsString(record.output.sha256)},`,
      "    resolution: ADAPTIVE_CANVAS_PRODUCTION_RESOLUTION,",
      `    sourceBitmapResolutionBound: ${record.sourceBitmapResolutionBound},`,
      "  }),",
    );
  }
  lines.push(
    "});",
    "",
    "export function getAdaptiveCanvasProductionBinding(",
    "  animationId: string,",
    "): AdaptiveCanvasProductionBinding | null {",
    "  return ADAPTIVE_CANVAS_PRODUCTION_BINDINGS[animationId] ?? null;",
    "}",
    "",
    "export function getAdaptiveLoadedSwfHostProductionBinding(): AdaptiveCanvasProductionBinding | null {",
    `  return ADAPTIVE_CANVAS_PRODUCTION_BINDINGS[${tsString(LOADED_HOST.registryAnimationId)}];`,
    "}",
    "",
  );
  return Buffer.from(lines.join("\n"));
}

export function inactiveV1BindingsBytes() {
  const lines = [
    "/* Generated by scripts/generate-adaptive-canvas-batch.mjs --bootstrap-bindings. Do not edit. */",
    "/* No adaptive production profile is active; historical renderers remain fixed at 1x. */",
    "",
    "export interface AdaptiveCanvasProductionResolution {",
    "  readonly schemaVersion: 1;",
    '  readonly mode: "adaptive-integer";',
    "  readonly nativeWidth: 800;",
    "  readonly nativeHeight: 600;",
    "  readonly supportedRenderScales: readonly [1, 2];",
    "}",
    "",
    "export interface AdaptiveCanvasProductionBinding {",
    "  readonly animationId: string;",
    "  readonly pageRenderer: boolean;",
    "  readonly assetPath: `/flash-assets/courses/${string}`;",
    "  readonly assetSha256: string;",
    "  readonly resolution: AdaptiveCanvasProductionResolution;",
    "  readonly sourceBitmapResolutionBound: boolean;",
    "}",
    "",
    "export function getAdaptiveCanvasProductionBinding(",
    "  animationId: string,",
    "): AdaptiveCanvasProductionBinding | null {",
    "  void animationId;",
    "  return null;",
    "}",
    "",
    "export function getAdaptiveLoadedSwfHostProductionBinding(): AdaptiveCanvasProductionBinding | null {",
    "  return null;",
    "}",
    "",
  ];
  return Buffer.from(lines.join("\n"));
}

export async function writeInactiveV1Bindings({
  projectRoot = PROJECT_ROOT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveWithin(
    resolvedRoot,
    GENERATED_BINDINGS_PATH,
    "inactive v1 generated bindings",
  );
  const bytes = inactiveV1BindingsBytes();
  const operation = await writeExclusiveOrSame(
    absolutePath,
    bytes,
    "inactive v1 generated bindings",
  );
  return {
    operation,
    path: projectRelative(resolvedRoot, absolutePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    activeAdaptiveBindingCount: 0,
  };
}

function outputChecksumRows(runtimeRecords, v2ProfileBytes, bindingsBytes) {
  const rows = runtimeRecords.map((record) =>
    `${record.output.sha256} ${record.output.bytes} apps/web/public/flash-assets/courses/${record.relativePath}`
  );
  rows.push(
    `${sha256(v2ProfileBytes)} ${v2ProfileBytes.length} ${V2_PROFILE_PATH}`,
    `${sha256(bindingsBytes)} ${bindingsBytes.length} ${GENERATED_BINDINGS_PATH}`,
  );
  rows.sort((left, right) => {
    const leftPath = left.slice(left.indexOf(" ", left.indexOf(" ") + 1) + 1);
    const rightPath = right.slice(
      right.indexOf(" ", right.indexOf(" ") + 1) + 1,
    );
    return compareText(leftPath, rightPath);
  });
  return rows;
}

export function runtimeSetIdentity(runtimeRecords) {
  invariant(
    Array.isArray(runtimeRecords) && runtimeRecords.length === 284,
    "adaptive runtime set must contain exactly 284 records",
    "EMPTY_OR_INCOMPLETE_APPLY_TARGET_SET",
  );
  const pageRendererCount = runtimeRecords.filter(
    ({pageRenderer}) => pageRenderer === true,
  ).length;
  const loadedHostCount = runtimeRecords.filter(
    ({pageRenderer}) => pageRenderer === false,
  ).length;
  invariant(
    pageRendererCount === 283 && loadedHostCount === 1,
    "adaptive runtime target denominator must be 283 pages plus one loaded host",
    "EMPTY_OR_INCOMPLETE_APPLY_TARGET_SET",
  );
  const animationIds = new Set();
  const assetPaths = new Set();
  const inputRows = [];
  const outputRows = [];
  for (const [index, record] of runtimeRecords.entries()) {
    invariant(
      typeof record?.animationId === "string" && record.animationId.length > 0 &&
        isSafeRelativePath(record?.assetPath) &&
        Number.isSafeInteger(record?.input?.bytes) && record.input.bytes > 0 &&
        SHA256_PATTERN.test(record?.input?.sha256 || "") &&
        Number.isSafeInteger(record?.output?.bytes) && record.output.bytes > 0 &&
        SHA256_PATTERN.test(record?.output?.sha256 || ""),
      `adaptive runtime record ${index}: invalid identity`,
      "EMPTY_OR_INCOMPLETE_APPLY_TARGET_SET",
    );
    invariant(
      !animationIds.has(record.animationId) && !assetPaths.has(record.assetPath),
      `adaptive runtime record ${index}: duplicate identity`,
      "EMPTY_OR_INCOMPLETE_APPLY_TARGET_SET",
    );
    animationIds.add(record.animationId);
    assetPaths.add(record.assetPath);
    inputRows.push(
      `${record.input.sha256} ${record.input.bytes} ${record.animationId} ${record.assetPath}`,
    );
    outputRows.push(
      `${record.output.sha256} ${record.output.bytes} ${record.animationId} ${record.assetPath}`,
    );
  }
  inputRows.sort(compareText);
  outputRows.sort(compareText);
  return {
    totalRuntimeCount: runtimeRecords.length,
    pageRendererCount,
    loadedHostCount,
    inputChecksumSetSha256: sha256(Buffer.from(inputRows.join("\n"))),
    outputChecksumSetSha256: sha256(Buffer.from(outputRows.join("\n"))),
  };
}

export function validateApplyPlanTargetSet(plan) {
  const identity = runtimeSetIdentity(plan?.runtimeRecords);
  invariant(
    plan.outputBytesByAssetPath instanceof Map &&
      plan.outputBytesByAssetPath.size === identity.totalRuntimeCount &&
      Buffer.isBuffer(plan.v2ProfileBytes) && plan.v2ProfileBytes.length > 0 &&
      Buffer.isBuffer(plan.bindingsBytes) && plan.bindingsBytes.length > 0,
    "adaptive apply plan has an empty or incomplete output target set",
    "EMPTY_OR_INCOMPLETE_APPLY_TARGET_SET",
  );
  for (const record of plan.runtimeRecords) {
    const output = plan.outputBytesByAssetPath.get(record.assetPath);
    invariant(
      Buffer.isBuffer(output) && output.length === record.output.bytes &&
        sha256(output) === record.output.sha256,
      `${record.animationId}: adaptive apply output bytes are absent or stale`,
      "EMPTY_OR_INCOMPLETE_APPLY_TARGET_SET",
    );
  }
  return identity;
}

function validateRegenerationFileIdentity(identity, label) {
  invariant(
    hasExactKeys(identity, ["path", "bytes", "sha256"]) &&
      isSafeRelativePath(identity.path) &&
      Number.isSafeInteger(identity.bytes) && identity.bytes > 0 &&
      SHA256_PATTERN.test(identity.sha256),
    `${label}: invalid project-file identity`,
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
}

function validateRegenerationProvenanceRecord(record, index) {
  const label = `regeneration provenance record ${index}`;
  invariant(
    hasExactKeys(record, [
      "animationId",
      "pageRenderer",
      "assetPath",
      "lane",
      "input",
      "output",
      "provenanceClass",
      "sourceEvidence",
      "generator",
    ]) &&
      typeof record.animationId === "string" &&
      record.animationId.length > 0 && record.animationId.length <= 256 &&
      typeof record.pageRenderer === "boolean" &&
      isSafeRelativePath(record.assetPath) &&
      typeof record.lane === "string" &&
      record.lane.length > 0 && record.lane.length <= 256 &&
      REGENERATION_PROVENANCE_CLASSES.includes(record.provenanceClass),
    `${label}: identity/lane/provenance class is invalid`,
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  for (const [field, identity] of [
    ["input", record.input],
    ["output", record.output],
  ]) {
    invariant(
      hasExactKeys(identity, ["bytes", "sha256"]) &&
        Number.isSafeInteger(identity.bytes) && identity.bytes > 0 &&
        SHA256_PATTERN.test(identity.sha256),
      `${label}: ${field} identity is invalid`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
  }
  invariant(
    Array.isArray(record.sourceEvidence) &&
      record.sourceEvidence.length > 0 &&
      record.sourceEvidence.length <= 32,
    `${label}: source evidence is empty or unbounded`,
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  const sourcePaths = new Set();
  for (const [sourceIndex, source] of record.sourceEvidence.entries()) {
    invariant(
      hasExactKeys(source, ["role", "path", "bytes", "sha256"]) &&
        REGENERATION_SOURCE_EVIDENCE_ROLES.includes(source.role),
      `${label}: source evidence ${sourceIndex} role/keys are invalid`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
    validateRegenerationFileIdentity(
      {path: source.path, bytes: source.bytes, sha256: source.sha256},
      `${label}: source evidence ${sourceIndex}`,
    );
    invariant(
      !sourcePaths.has(source.path),
      `${label}: duplicate source evidence path ${source.path}`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
    sourcePaths.add(source.path);
  }
  validateRegenerationFileIdentity(record.generator, `${label}: generator`);
  const sourceRoles = new Set(record.sourceEvidence.map(({role}) => role));
  if (record.provenanceClass === "source-first-regeneration") {
    invariant(
      [...sourceRoles].some(
        (role) => role !== "canonical-advanced-manual-evidence",
      ),
      `${label}: source-first regeneration lacks canonical source evidence`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
  } else {
    invariant(
      sourceRoles.has("canonical-advanced-manual-evidence"),
      `${label}: advanced-manual provenance lacks its canonical evidence`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
  }
}

function validateRegenerationProvenancePayload(payload) {
  invariant(
    hasExactKeys(payload, [
      "status",
      "authorityClass",
      "provenancePolicy",
      "runtimeSet",
      "records",
    ]) &&
      payload.status === "pass" &&
      payload.authorityClass ===
        "independent-regeneration-provenance-review" &&
      payload.provenancePolicy ===
        "source-first-or-canonical-advanced-manual-v1",
    "regeneration provenance payload authority/policy is invalid",
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  invariant(
    hasExactKeys(payload.runtimeSet, [
      "totalRuntimeCount",
      "pageRendererCount",
      "loadedHostCount",
      "inputChecksumSetSha256",
      "outputChecksumSetSha256",
    ]) &&
      payload.runtimeSet.totalRuntimeCount === 284 &&
      payload.runtimeSet.pageRendererCount === 283 &&
      payload.runtimeSet.loadedHostCount === 1 &&
      SHA256_PATTERN.test(payload.runtimeSet.inputChecksumSetSha256) &&
      SHA256_PATTERN.test(payload.runtimeSet.outputChecksumSetSha256),
    "regeneration provenance runtime-set identity is invalid",
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  invariant(
    Array.isArray(payload.records) && payload.records.length === 284,
    "regeneration provenance receipt must contain exactly 284 records",
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  const animationIds = new Set();
  const assetPaths = new Set();
  payload.records.forEach((record, index) => {
    validateRegenerationProvenanceRecord(record, index);
    invariant(
      !animationIds.has(record.animationId) && !assetPaths.has(record.assetPath),
      `regeneration provenance record ${index}: duplicate runtime identity`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
    animationIds.add(record.animationId);
    assetPaths.add(record.assetPath);
  });
}

export function regenerationProvenanceReceiptBytes(document) {
  invariant(
    hasExactKeys(document, [
      "schemaVersion",
      "receiptType",
      "payloadSha256",
      "payload",
    ]) &&
      document.schemaVersion === 1 &&
      document.receiptType ===
        "adaptive-canvas-production-five-regeneration-provenance-v1" &&
      SHA256_PATTERN.test(document.payloadSha256) &&
      document.payloadSha256 ===
        sha256(Buffer.from(canonicalJson(document.payload))),
    "invalid immutable regeneration provenance receipt",
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  validateRegenerationProvenancePayload(document.payload);
  return jsonBytes(document);
}

export function validateRegenerationProvenanceForApply({
  document,
  runtimeRecords,
}) {
  regenerationProvenanceReceiptBytes(document);
  const expectedRuntimeSet = runtimeSetIdentity(runtimeRecords);
  invariant(
    canonicalJson(document.payload.runtimeSet) ===
      canonicalJson(expectedRuntimeSet),
    "regeneration provenance runtime set differs from the selected plan",
    "STALE_REGENERATION_PROVENANCE_RECEIPT",
  );
  document.payload.records.forEach((record, index) => {
    const runtime = runtimeRecords[index];
    invariant(
      runtime &&
        record.animationId === runtime.animationId &&
        record.pageRenderer === runtime.pageRenderer &&
        record.assetPath === runtime.assetPath &&
        record.lane === runtime.lane &&
        canonicalJson(record.input) === canonicalJson(runtime.input) &&
        canonicalJson(record.output) === canonicalJson(runtime.output),
      `${record.animationId}: regeneration provenance does not exactly bind the plan record/lane`,
      "STALE_REGENERATION_PROVENANCE_RECEIPT",
    );
  });
  return true;
}

export async function readAndValidateRegenerationProvenanceReceipt({
  projectRoot = PROJECT_ROOT,
  runtimeRecords,
}) {
  invariant(
    SHA256_PATTERN.test(
      APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256 || "",
    ),
    "no immutable regeneration provenance receipt SHA is approved; Gate0 remains NO-APPLY",
    "UNAPPROVED_REGENERATION_PROVENANCE",
  );
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveWithin(
    resolvedRoot,
    REGENERATION_PROVENANCE_RECEIPT_PATH,
    "immutable regeneration provenance receipt",
  );
  const receiptStable = await readStableOrdinaryFile(
    absolutePath,
    REGENERATION_PROVENANCE_RECEIPT_PATH,
  );
  const {bytes} = receiptStable;
  invariant(
    sha256(bytes) === APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256,
    "immutable regeneration provenance receipt differs from its code-approved SHA",
    "UNAPPROVED_REGENERATION_PROVENANCE",
  );
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new AdaptiveCanvasBatchError(
      `immutable regeneration provenance receipt is invalid JSON: ${error.message}`,
      "INVALID_REGENERATION_PROVENANCE_RECEIPT",
    );
  }
  const normalized = regenerationProvenanceReceiptBytes(document);
  invariant(
    normalized.equals(bytes),
    "immutable regeneration provenance receipt JSON bytes are not canonical",
    "INVALID_REGENERATION_PROVENANCE_RECEIPT",
  );
  validateRegenerationProvenanceForApply({
    document,
    runtimeRecords,
  });
  const verifiedFiles = new Map();
  const verifyIdentity = async (identity, label) => {
    const cacheKey = canonicalJson(identity);
    if (verifiedFiles.has(cacheKey)) return;
    const sourcePath = resolveWithin(resolvedRoot, identity.path, label);
    const sourceStable = await readStableOrdinaryFile(sourcePath, label);
    const sourceBytes = sourceStable.bytes;
    invariant(
      sourceBytes.length === identity.bytes &&
        sha256(sourceBytes) === identity.sha256,
      `${label}: current bytes differ from the immutable provenance receipt`,
      "STALE_REGENERATION_PROVENANCE_RECEIPT",
    );
    verifiedFiles.set(cacheKey, {
      path: identity.path,
      identity: sourceStable.identity,
    });
  };
  for (const record of document.payload.records) {
    for (const source of record.sourceEvidence) {
      await verifyIdentity(source, `${record.animationId}: ${source.role}`);
    }
    await verifyIdentity(record.generator, `${record.animationId}: generator`);
  }
  return {
    absolutePath,
    bytes,
    document,
    fileIdentity: receiptStable.identity,
    verifiedFileIdentities: [...verifiedFiles.values()].sort(
      (left, right) => compareText(left.path, right.path),
    ),
  };
}

function planDocument(payload) {
  return {
    schemaVersion: 1,
    receiptType: "adaptive-canvas-production-five-batch-plan",
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
}

export function planReceiptBytes(document) {
  invariant(
    hasExactKeys(document, [
      "schemaVersion",
      "receiptType",
      "payloadSha256",
      "payload",
    ]) &&
      document.schemaVersion === 1 &&
      document.receiptType ===
        "adaptive-canvas-production-five-batch-plan" &&
      SHA256_PATTERN.test(document.payloadSha256) &&
      document.payloadSha256 ===
        sha256(Buffer.from(canonicalJson(document.payload))),
    "invalid adaptive batch plan receipt",
  );
  return jsonBytes(document);
}

function isJsonValue(value) {
  if (
    value === null || typeof value === "string" || typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (value && typeof value === "object") {
    return Object.keys(value).every((key) =>
      typeof key === "string" && isJsonValue(value[key])
    );
  }
  return false;
}

function validateRelativeProofFileIdentity(identity, expectedKeys, label) {
  invariant(
    hasExactKeys(identity, expectedKeys),
    `${label}: file identity keys are not exact`,
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    isSafeRelativePath(identity.path) &&
      Number.isSafeInteger(identity.bytes) && identity.bytes > 0 &&
      SHA256_PATTERN.test(identity.sha256),
    `${label}: invalid file identity`,
    "INVALID_CHROMIUM_PROOF",
  );
}

function validateAbsoluteProofFileIdentity(identity, label) {
  invariant(
    hasExactKeys(identity, ["path", "bytes", "sha256"]) &&
      typeof identity.path === "string" && path.isAbsolute(identity.path) &&
      !identity.path.includes("\0") &&
      Number.isSafeInteger(identity.bytes) && identity.bytes > 0 &&
      SHA256_PATTERN.test(identity.sha256),
    `${label}: invalid absolute file identity`,
    "INVALID_CHROMIUM_PROOF",
  );
}

function validateDirectoryChecksumIdentity(identity, label) {
  invariant(
    hasExactKeys(identity, [
      "path",
      "fileCount",
      "totalBytes",
      "checksumSetSha256",
    ]) &&
      isSafeRelativePath(identity.path) &&
      Number.isSafeInteger(identity.fileCount) && identity.fileCount > 0 &&
      Number.isSafeInteger(identity.totalBytes) && identity.totalBytes > 0 &&
      SHA256_PATTERN.test(identity.checksumSetSha256),
    `${label}: invalid directory checksum identity`,
    "INVALID_CHROMIUM_PROOF",
  );
}

function validateRuntimeSetProof(runtimeSet) {
  invariant(
    hasExactKeys(runtimeSet, [
      "totalRuntimeCount",
      "pageRendererCount",
      "loadedHostCount",
      "inputChecksumSetSha256",
      "outputChecksumSetSha256",
    ]) &&
      runtimeSet.totalRuntimeCount === 284 &&
      runtimeSet.pageRendererCount === 283 &&
      runtimeSet.loadedHostCount === 1 &&
      SHA256_PATTERN.test(runtimeSet.inputChecksumSetSha256) &&
      SHA256_PATTERN.test(runtimeSet.outputChecksumSetSha256),
    "Chromium proof runtime-set identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
}

function validateToolchainProof(toolchain) {
  invariant(
    hasExactKeys(toolchain, [
      "node",
      "platform",
      "os",
      "packageLock",
      "playwright",
      "playwrightCore",
      "browsersManifest",
      "chromium",
    ]),
    "Chromium proof toolchain keys are not exact",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(toolchain.node, [
      "version",
      "versionsSha256",
      "executable",
    ]) &&
      typeof toolchain.node.version === "string" &&
      /^v\d+\.\d+\.\d+/u.test(toolchain.node.version) &&
      SHA256_PATTERN.test(toolchain.node.versionsSha256),
    "Chromium proof Node identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateAbsoluteProofFileIdentity(
    toolchain.node.executable,
    "Chromium proof Node executable",
  );
  invariant(
    hasExactKeys(toolchain.platform, ["name", "arch", "endianness"]) &&
      typeof toolchain.platform.name === "string" &&
      toolchain.platform.name.length > 0 &&
      typeof toolchain.platform.arch === "string" &&
      toolchain.platform.arch.length > 0 &&
      (toolchain.platform.endianness === "LE" ||
        toolchain.platform.endianness === "BE"),
    "Chromium proof platform identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(toolchain.os, ["type", "release", "version"]) &&
      typeof toolchain.os.type === "string" && toolchain.os.type.length > 0 &&
      typeof toolchain.os.release === "string" &&
      toolchain.os.release.length > 0 &&
      typeof toolchain.os.version === "string" &&
      toolchain.os.version.length > 0,
    "Chromium proof OS identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateRelativeProofFileIdentity(
    toolchain.packageLock,
    ["path", "bytes", "sha256"],
    "Chromium proof package lock",
  );
  invariant(
    toolchain.packageLock.path === "package-lock.json",
    "Chromium proof package-lock path changed",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(toolchain.playwright, ["version", "packageJson", "packageTree"]) &&
      typeof toolchain.playwright.version === "string" &&
      /^\d+\.\d+\.\d+/u.test(toolchain.playwright.version),
    "Chromium proof Playwright identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateRelativeProofFileIdentity(
    toolchain.playwright.packageJson,
    ["path", "bytes", "sha256"],
    "Chromium proof Playwright package.json",
  );
  validateDirectoryChecksumIdentity(
    toolchain.playwright.packageTree,
    "Chromium proof Playwright package tree",
  );
  invariant(
    hasExactKeys(toolchain.playwrightCore, [
      "version",
      "packageJson",
      "packageTree",
    ]) &&
      toolchain.playwrightCore.version === toolchain.playwright.version,
    "Chromium proof Playwright Core identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateRelativeProofFileIdentity(
    toolchain.playwrightCore.packageJson,
    ["path", "bytes", "sha256"],
    "Chromium proof Playwright Core package.json",
  );
  validateDirectoryChecksumIdentity(
    toolchain.playwrightCore.packageTree,
    "Chromium proof Playwright Core package tree",
  );
  validateRelativeProofFileIdentity(
    toolchain.browsersManifest,
    [
      "path",
      "bytes",
      "sha256",
      "chromiumRevision",
      "chromiumBrowserVersion",
    ],
    "Chromium proof Playwright browsers manifest",
  );
  invariant(
    /^\d+$/u.test(toolchain.browsersManifest.chromiumRevision) &&
      /^\d+\.\d+\.\d+\.\d+$/u.test(
        toolchain.browsersManifest.chromiumBrowserVersion,
      ) &&
      hasExactKeys(toolchain.chromium, [
        "revision",
        "browserVersion",
        "executable",
        "runtimeBinary",
      ]) &&
      toolchain.chromium.revision ===
        toolchain.browsersManifest.chromiumRevision &&
      toolchain.chromium.browserVersion ===
        toolchain.browsersManifest.chromiumBrowserVersion,
    "Chromium proof browser manifest/runtime identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateAbsoluteProofFileIdentity(
    toolchain.chromium.executable,
    "Chromium proof Chromium executable",
  );
  validateAbsoluteProofFileIdentity(
    toolchain.chromium.runtimeBinary,
    "Chromium proof Chromium runtime binary",
  );
}

function validateChromiumProofSample(sample, definition, index) {
  const label = `Chromium proof sample ${index} (${definition.animationId})`;
  invariant(
    hasExactKeys(sample, [
      "animationId",
      "registryAnimationId",
      "pageRenderer",
      "request",
      "frameClass",
      "inputSha256",
      "outputSha256",
      "k1",
      "k2",
    ]),
    `${label}: keys are not exact`,
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    sample.animationId === definition.animationId &&
      sample.registryAnimationId === definition.registryAnimationId &&
      sample.pageRenderer === definition.pageRenderer &&
      canonicalJson(sample.request) === canonicalJson(definition.request) &&
      sample.frameClass === definition.frameClass &&
      Object.hasOwn(FRAME_CLASS_RMSE_THRESHOLDS, sample.frameClass) &&
      SHA256_PATTERN.test(sample.inputSha256) &&
      SHA256_PATTERN.test(sample.outputSha256),
    `${label}: fixed identity, request, or runtime hash mismatch`,
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(sample.k1, [
      "width",
      "height",
      "originalRgbaSha256",
      "adaptiveRgbaSha256",
      "rgbaByteIdentical",
      "originalState",
      "adaptiveState",
      "stateByteIdentical",
    ]),
    `${label}: k1 keys are not exact`,
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    sample.k1.width === 800 && sample.k1.height === 600 &&
      SHA256_PATTERN.test(sample.k1.originalRgbaSha256) &&
      sample.k1.adaptiveRgbaSha256 === sample.k1.originalRgbaSha256 &&
      sample.k1.rgbaByteIdentical === true &&
      isJsonValue(sample.k1.originalState) &&
      isJsonValue(sample.k1.adaptiveState) &&
      canonicalJson(sample.k1.adaptiveState) ===
        canonicalJson(sample.k1.originalState) &&
      sample.k1.stateByteIdentical === true,
    `${label}: k1 RGBA/state parity proof is incomplete or failed`,
    "INCOMPLETE_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(sample.k2, [
      "width",
      "height",
      "comparisonAlgorithm",
      "baselineK1RgbaSha256",
      "rawRgbaSha256",
      "downsampledWidth",
      "downsampledHeight",
      "downsampledRgbaSha256",
      "normalizedDownsampleRmse",
      "state",
      "stateSha256",
      "stateByteIdenticalToK1",
    ]),
    `${label}: k2 keys are not exact`,
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    sample.k2.width === 1600 && sample.k2.height === 1200 &&
      sample.k2.comparisonAlgorithm === K2_COMPARISON_ALGORITHM &&
      sample.k2.baselineK1RgbaSha256 ===
        sample.k1.adaptiveRgbaSha256 &&
      SHA256_PATTERN.test(sample.k2.rawRgbaSha256) &&
      sample.k2.downsampledWidth === 800 &&
      sample.k2.downsampledHeight === 600 &&
      SHA256_PATTERN.test(sample.k2.downsampledRgbaSha256) &&
      Number.isFinite(sample.k2.normalizedDownsampleRmse) &&
      sample.k2.normalizedDownsampleRmse >= 0 &&
      sample.k2.normalizedDownsampleRmse <=
        maximumRmseForFrameClass(definition.frameClass) &&
      isJsonValue(sample.k2.state) &&
      sample.k2.stateSha256 ===
        sha256(Buffer.from(canonicalJson(sample.k2.state))) &&
      canonicalJson(sample.k2.state) ===
        canonicalJson(sample.k1.originalState) &&
      canonicalJson(sample.k2.state) ===
        canonicalJson(sample.k1.adaptiveState) &&
      sample.k2.stateByteIdenticalToK1 === true,
    `${label}: k2 backing/RGBA/state/RMSE proof is incomplete or failed`,
    "INCOMPLETE_CHROMIUM_PROOF",
  );
}

function validateChromiumGuardProof(guard) {
  const definition = REAL_CHROMIUM_GUARD_DEFINITION;
  invariant(
    hasExactKeys(guard, [
      "animationId",
      "registryAnimationId",
      "request",
      "inputSha256",
      "outputSha256",
      "rejectedRenderScales",
      "errors",
      "instrumentedCanvasResizeProperties",
      "instrumentedMutating2dMethods",
      "attempts",
      "width",
      "height",
      "beforeRgbaSha256",
      "afterRgbaSha256",
      "rgbaUnchanged",
    ]),
    "Chromium guard-before-draw proof keys are not exact",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    Array.isArray(guard.attempts) && guard.attempts.length === 2,
    "Chromium guard attempt proofs are incomplete",
    "INCOMPLETE_CHROMIUM_PROOF",
  );
  guard.attempts.forEach((attempt, index) => {
    invariant(
      hasExactKeys(attempt, [
        "renderScale",
        "error",
        "afterRgbaSha256",
        "rgbaUnchanged",
        "canvasResizeCount",
        "contextAcquisitionCount",
        "mutating2dMethodCount",
        "mutationCount",
      ]) &&
        attempt.renderScale === definition.rejectedRenderScales[index] &&
        attempt.error === definition.expectedErrors[index] &&
        SHA256_PATTERN.test(attempt.afterRgbaSha256) &&
        attempt.afterRgbaSha256 === guard.beforeRgbaSha256 &&
        attempt.rgbaUnchanged === true &&
        attempt.canvasResizeCount === 0 &&
        attempt.contextAcquisitionCount === 0 &&
        attempt.mutating2dMethodCount === 0 &&
        attempt.mutationCount === 0,
      `Chromium guard attempt ${index} did not reject before drawing`,
      "INCOMPLETE_CHROMIUM_PROOF",
    );
  });
  invariant(
    guard.animationId === definition.animationId &&
      guard.registryAnimationId === definition.registryAnimationId &&
      canonicalJson(guard.request) === canonicalJson(definition.request) &&
      canonicalJson(guard.rejectedRenderScales) ===
        canonicalJson(definition.rejectedRenderScales) &&
      canonicalJson(guard.errors) === canonicalJson(definition.expectedErrors) &&
      canonicalJson(guard.instrumentedCanvasResizeProperties) ===
        canonicalJson(GUARDED_CANVAS_RESIZE_PROPERTIES) &&
      canonicalJson(guard.instrumentedMutating2dMethods) ===
        canonicalJson(GUARDED_MUTATING_2D_METHODS) &&
      canonicalJson(guard.attempts.map(({renderScale, error}) => ({
        renderScale,
        error,
      }))) === canonicalJson(definition.rejectedRenderScales.map(
        (renderScale, index) => ({
          renderScale,
          error: definition.expectedErrors[index],
        }),
      )) &&
      SHA256_PATTERN.test(guard.inputSha256) &&
      SHA256_PATTERN.test(guard.outputSha256) &&
      guard.width === 800 && guard.height === 600 &&
      SHA256_PATTERN.test(guard.beforeRgbaSha256) &&
      guard.afterRgbaSha256 === guard.beforeRgbaSha256 &&
      guard.rgbaUnchanged === true,
    "Chromium guard did not prove missing/k3 rejection before drawing",
    "INCOMPLETE_CHROMIUM_PROOF",
  );
}

function validateChromiumProofPayload(payload) {
  invariant(
    hasExactKeys(payload, [
      "status",
      "proofClass",
      "challenge",
      "generator",
      "test",
      "planReceipt",
      "runtimeSet",
      "toolchain",
      "runnerContract",
      "browser",
      "samples",
      "guardBeforeDraw",
    ]),
    "Chromium proof payload keys are not exact",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    payload.status === "pass" &&
      payload.proofClass === "real-chromium-adaptive-canvas-apply-v2",
    "Chromium proof status/class mismatch",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(payload.challenge, [
      "algorithm",
      "inputBytes",
      "sha256",
      "runnerMode",
      "temporaryProofPath",
    ]) &&
      payload.challenge.algorithm === "sha256" &&
      payload.challenge.inputBytes === 32 &&
      SHA256_PATTERN.test(payload.challenge.sha256) &&
      payload.challenge.runnerMode === CHROMIUM_PROOF_RUNNER_MODE &&
      isSafeRelativePath(payload.challenge.temporaryProofPath) &&
      payload.challenge.temporaryProofPath.includes(payload.challenge.sha256),
    "Chromium proof apply challenge is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateRelativeProofFileIdentity(
    payload.generator,
    ["path", "bytes", "sha256"],
    "Chromium proof generator",
  );
  validateRelativeProofFileIdentity(
    payload.test,
    ["path", "bytes", "sha256"],
    "Chromium proof test",
  );
  validateRelativeProofFileIdentity(
    payload.planReceipt,
    ["path", "bytes", "sha256", "payloadSha256"],
    "Chromium proof plan receipt",
  );
  invariant(
    SHA256_PATTERN.test(payload.planReceipt.payloadSha256),
    "Chromium proof plan payload hash is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  validateRuntimeSetProof(payload.runtimeSet);
  validateToolchainProof(payload.toolchain);
  invariant(
    canonicalJson(payload.runnerContract) ===
      canonicalJson(CHROMIUM_PROOF_RUNNER_CONTRACT),
    "Chromium proof runner contract is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    hasExactKeys(payload.browser, ["name", "version", "executablePath"]) &&
      payload.browser.name === "chromium" &&
      typeof payload.browser.version === "string" &&
      payload.browser.version.trim().length > 0 &&
      payload.browser.version.length <= 256 &&
      payload.browser.version ===
        payload.toolchain.chromium.browserVersion &&
      payload.browser.executablePath ===
        payload.toolchain.chromium.executable.path,
    "Chromium proof browser identity is invalid",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    Array.isArray(payload.samples) &&
      payload.samples.length === REAL_CHROMIUM_SAMPLE_DEFINITIONS.length,
    "Chromium proof fixed sample set is incomplete",
    "INCOMPLETE_CHROMIUM_PROOF",
  );
  payload.samples.forEach((sample, index) =>
    validateChromiumProofSample(
      sample,
      REAL_CHROMIUM_SAMPLE_DEFINITIONS[index],
      index,
    )
  );
  validateChromiumGuardProof(payload.guardBeforeDraw);
}

export function chromiumProofDocument({
  challenge,
  identity,
  browser,
  samples,
  guardBeforeDraw,
}) {
  invariant(
    hasExactKeys(identity, [
      "generator",
      "test",
      "planReceipt",
      "runtimeSet",
      "toolchain",
      "runnerContract",
    ]),
    "Chromium proof identity keys are not exact",
    "INVALID_CHROMIUM_PROOF",
  );
  const payload = {
    status: "pass",
    proofClass: "real-chromium-adaptive-canvas-apply-v2",
    challenge,
    generator: identity.generator,
    test: identity.test,
    planReceipt: identity.planReceipt,
    runtimeSet: identity.runtimeSet,
    toolchain: identity.toolchain,
    runnerContract: identity.runnerContract,
    browser,
    samples,
    guardBeforeDraw,
  };
  const document = {
    schemaVersion: 2,
    receiptType: "adaptive-canvas-production-five-real-chromium-proof-v2",
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
  chromiumProofReceiptBytes(document);
  return document;
}

export function chromiumProofReceiptBytes(document) {
  invariant(
    hasExactKeys(document, [
      "schemaVersion",
      "receiptType",
      "payloadSha256",
      "payload",
    ]) &&
      document.schemaVersion === 2 &&
      document.receiptType ===
        "adaptive-canvas-production-five-real-chromium-proof-v2" &&
      SHA256_PATTERN.test(document.payloadSha256) &&
      document.payloadSha256 ===
        sha256(Buffer.from(canonicalJson(document.payload))),
    "invalid adaptive real-Chromium proof receipt",
    "INVALID_CHROMIUM_PROOF",
  );
  validateChromiumProofPayload(document.payload);
  return jsonBytes(document);
}

async function verifyAllV1EntryBytes({projectRoot, loaded, retainRuntimeBytes}) {
  const runtimeAssetPaths = new Set([
    ...loaded.pageRenderers.map(({assetPath}) => assetPath),
    LOADED_HOST.assetPath,
  ]);
  const runtimeBytes = new Map();
  let totalBytesRehashed = 0;
  let publicEntries = 0;
  let serverAudioEntries = 0;
  for (const entry of loaded.profile.entries) {
    const absolutePath = assetAbsolutePath(projectRoot, entry);
    const bytes = await readOrdinaryFile(absolutePath, entry.assetPath);
    invariant(
      bytes.length === entry.bytes && sha256(bytes) === entry.sha256,
      `${entry.assetPath}: current bytes differ from fixed v1 profile`,
      "V1_ASSET_IDENTITY_MISMATCH",
    );
    totalBytesRehashed += bytes.length;
    if (entry.storageRoot === "public") publicEntries += 1;
    else serverAudioEntries += 1;
    if (retainRuntimeBytes && runtimeAssetPaths.has(entry.assetPath)) {
      runtimeBytes.set(entry.assetPath, bytes);
    }
  }
  invariant(
    publicEntries === PROFILE_COUNTS.public &&
      serverAudioEntries === PROFILE_COUNTS.serverAudio,
    "v1 physical asset entry counts changed",
  );
  if (retainRuntimeBytes) {
    invariant(runtimeBytes.size === 284, "failed to retain all 284 runtime inputs");
  }
  return {runtimeBytes, totalBytesRehashed, publicEntries, serverAudioEntries};
}

export async function createAdaptiveCanvasBatchPlan({
  projectRoot = PROJECT_ROOT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const loaded = await loadFixedV1Profile(resolvedRoot);
  await verifyLiveRendererFileSet(
    resolvedRoot,
    loaded.pageRenderers.map(({animationId}) => animationId),
  );
  const verified = await verifyAllV1EntryBytes({
    projectRoot: resolvedRoot,
    loaded,
    retainRuntimeBytes: true,
  });
  const outputBytesByAssetPath = new Map();
  const runtimeRecords = [];
  for (const entry of loaded.pageRenderers) {
    const transformed = transformAdaptiveRuntime({
      inputBytes: verified.runtimeBytes.get(entry.assetPath),
      profileEntry: entry,
      animationId: entry.animationId,
      pageRenderer: true,
    });
    runtimeRecords.push(transformed.record);
    outputBytesByAssetPath.set(entry.assetPath, transformed.outputBytes);
  }
  const loadedTransformed = transformAdaptiveRuntime({
    inputBytes: verified.runtimeBytes.get(LOADED_HOST.assetPath),
    profileEntry: loaded.loadedHostEntry,
    animationId: LOADED_HOST.metadataAnimationId,
    metadataAnimationId: LOADED_HOST.metadataAnimationId,
    registryAnimationId: LOADED_HOST.registryAnimationId,
    pageRenderer: false,
  });
  runtimeRecords.push(loadedTransformed.record);
  outputBytesByAssetPath.set(
    LOADED_HOST.assetPath,
    loadedTransformed.outputBytes,
  );
  runtimeRecords.sort((left, right) => compareText(left.animationId, right.animationId));
  const pageRecords = runtimeRecords.filter(({pageRenderer}) => pageRenderer);
  const familyCounts = Object.fromEntries(Object.keys(FAMILY_CONTRACTS)
    .filter((family) => family !== "g4-l3-loaded-swf-host")
    .map((family) => [
      family,
      pageRecords.filter((record) => record.family === family).length,
    ]));
  for (const [family, contract] of Object.entries(FAMILY_CONTRACTS)) {
    if (family === "g4-l3-loaded-swf-host") continue;
    invariant(
      familyCounts[family] === contract.expectedPageRendererCount,
      `${family}: expected ${contract.expectedPageRendererCount}, observed ${familyCounts[family]}`,
      "RUNTIME_FAMILY_COUNT_MISMATCH",
    );
  }
  invariant(pageRecords.length === 283, "adaptive page renderer count changed");
  invariant(runtimeRecords.length === 284, "adaptive runtime count changed");
  const bitmapBoundCount = pageRecords.filter(
    ({sourceBitmapResolutionBound}) => sourceBitmapResolutionBound,
  ).length;
  invariant(
    bitmapBoundCount === 114,
    `strict complete-data-URI bitmap count mismatch: ${bitmapBoundCount}`,
    "BITMAP_DENOMINATOR_MISMATCH",
  );
  invariant(
    loadedTransformed.record.sourceBitmapResolutionBound === false,
    "loaded host unexpectedly became bitmap-bound",
  );
  const v2 = v2ProfileFrom(loaded.profile, runtimeRecords);
  const bindingsBytes = generatedBindingsBytes(runtimeRecords);
  const generatorBytes = await readOrdinaryFile(SCRIPT_PATH, "batch generator");
  const outputRows = outputChecksumRows(runtimeRecords, v2.bytes, bindingsBytes);
  const payload = {
    status: "pass",
    operation: "plan",
    boundary: {
      pageRendererCount: 283,
      loadedHostRuntimeCount: 1,
      totalAdaptiveRuntimeCount: 284,
      placementCount: 284,
      courseShellCount: 0,
      profileEntryCount: 1114,
      approvedReleaseIds: APPROVED_RELEASE_IDS,
      forbiddenG4LessonsExcluded: ["g04-l05", "g04-l10", "g04-l11"],
    },
    generator: {
      path: "scripts/generate-adaptive-canvas-batch.mjs",
      bytes: generatorBytes.length,
      sha256: sha256(generatorBytes),
    },
    inputProfile: {
      path: V1_PROFILE_PATH,
      bytes: loaded.bytes.length,
      sha256: EXPECTED_V1_PROFILE_SHA256,
      checksumSetSha256: EXPECTED_V1_CHECKSUM_SET_SHA256,
      allEntryBytesRehashed: true,
      entryBytesRehashed: verified.totalBytesRehashed,
      counts: PROFILE_COUNTS,
    },
    familyCounts,
    bitmapBoundPageRendererCount: bitmapBoundCount,
    bitmapBoundary:
      "complete canonical data:image/<mime>;base64,<payload> bytes only; security guard literals are excluded",
    resolution: RESOLUTION,
    atomicCommitCapability: {
      status: "code-pinned-native-capability-only",
      protocol: REQUIRED_ATOMIC_COMMIT_CAPABILITY.protocol,
      helperPath: REQUIRED_ATOMIC_COMMIT_CAPABILITY.helperPath,
      helperSha256: APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
      buildReceiptPath: ATOMIC_COMMIT_BUILD_RECEIPT_PATH,
      buildReceiptSha256: APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256,
      staticContractSha256:
        REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256,
      targetCount: 286,
      profileCommittedBeforeBinding: true,
      bindingCommittedLast: true,
      browserProofSatisfied: false,
      applyAuthorized: false,
    },
    outputs: {
      v2Profile: {
        path: V2_PROFILE_PATH,
        bytes: v2.bytes.length,
        sha256: sha256(v2.bytes),
        checksumSetSha256: v2.profile.checksumSetSha256,
      },
      generatedBindings: {
        path: GENERATED_BINDINGS_PATH,
        bytes: bindingsBytes.length,
        sha256: sha256(bindingsBytes),
        bindingCount: 284,
        pageRendererBindingCount: 283,
        loadedHostBindingCount: 1,
        sourceBitmapResolutionBoundCount: bitmapBoundCount,
      },
      checksumSetSha256: sha256(Buffer.from(outputRows.join("\n"))),
      checksumRows: outputRows,
    },
    runtimes: runtimeRecords,
    evidenceBoundary: {
      sourceFirstRegenerationPerformed: false,
      sourceFirstRegenerationClaimed: false,
      currentJsRuntimeTransformationOnly: true,
      flashFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictCompletionChanged: false,
      releaseEligibilityChanged: false,
      productionAliasChanged: false,
      publicationChanged: false,
    },
  };
  return {
    document: planDocument(payload),
    outputBytesByAssetPath,
    runtimeRecords,
    v2Profile: v2.profile,
    v2ProfileBytes: v2.bytes,
    bindingsBytes,
  };
}

async function writeExclusiveOrSame(absolutePath, expectedBytes, label) {
  const current = await readStableOrdinaryFile(absolutePath, label).catch((error) => {
    if (error?.code === "MISSING_FILE") return null;
    throw error;
  });
  if (current !== null) {
    invariant(
      current.bytes.equals(expectedBytes),
      `${label}: existing file differs; choose a new path rather than overwriting evidence`,
      "EXISTING_EVIDENCE_DIFFERS",
    );
    return "existing-identical";
  }
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, expectedBytes, {flag: "wx"});
  return "created";
}

async function writeAtomicExclusiveOrSame(absolutePath, expectedBytes, label) {
  const existing = await readStableOrdinaryFile(absolutePath, label).catch((error) => {
    if (error?.code === "MISSING_FILE") return null;
    throw error;
  });
  if (existing !== null) {
    invariant(
      existing.bytes.equals(expectedBytes),
      `${label}: existing file differs; choose a new path rather than overwriting evidence`,
      "EXISTING_EVIDENCE_DIFFERS",
    );
    return "existing-identical";
  }
  await mkdir(path.dirname(absolutePath), {recursive: true});
  const temporaryPath = path.join(
    path.dirname(absolutePath),
    `.${path.basename(absolutePath)}.tmp-${process.pid}-${sha256(expectedBytes).slice(0, 16)}`,
  );
  let temporaryCreated = false;
  try {
    await writeFile(temporaryPath, expectedBytes, {flag: "wx"});
    temporaryCreated = true;
    const staged = await readStableOrdinaryFile(
      temporaryPath,
      `${label}: staged proof`,
    );
    invariant(
      staged.bytes.equals(expectedBytes),
      `${label}: staged proof bytes changed`,
    );
    try {
      await link(temporaryPath, absolutePath);
      return "created";
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const raced = await readStableOrdinaryFile(
        absolutePath,
        `${label}: concurrent evidence`,
      );
      invariant(
        raced.bytes.equals(expectedBytes),
        `${label}: concurrent evidence differs`,
        "EXISTING_EVIDENCE_DIFFERS",
      );
      return "existing-identical";
    }
  } finally {
    if (temporaryCreated) {
      await unlink(temporaryPath).catch((error) => {
        if (error?.code !== "ENOENT") throw error;
      });
    }
  }
}

export async function writePlanReceipt({
  document,
  receiptPath = DEFAULT_PLAN_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
}) {
  invariant(
    isSafeRelativePath(receiptPath) && receiptPath.startsWith("work/") &&
      receiptPath.endsWith(".json"),
    "adaptive batch plan receipts must stay under work/ as JSON evidence",
    "UNSAFE_PATH",
  );
  const absolutePath = resolveWithin(projectRoot, receiptPath, "plan receipt");
  const bytes = planReceiptBytes(document);
  const operation = await writeExclusiveOrSame(
    absolutePath,
    bytes,
    "adaptive batch plan receipt",
  );
  return {
    operation,
    path: projectRelative(projectRoot, absolutePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    payloadSha256: document.payloadSha256,
  };
}

export async function readAndValidatePlanReceipt({
  receiptPath,
  projectRoot,
  expectedDocument,
}) {
  invariant(
    isSafeRelativePath(receiptPath) && receiptPath.startsWith("work/") &&
      receiptPath.endsWith(".json"),
    "adaptive batch plan receipts must stay under work/ as JSON evidence",
    "UNSAFE_PATH",
  );
  const absolutePath = resolveWithin(projectRoot, receiptPath, "plan receipt");
  const stable = await readStableOrdinaryFile(absolutePath, receiptPath);
  const {bytes} = stable;
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new AdaptiveCanvasBatchError(`plan receipt is invalid JSON: ${error.message}`);
  }
  const normalized = planReceiptBytes(document);
  invariant(normalized.equals(bytes), "plan receipt JSON bytes are not canonical");
  if (expectedDocument) {
    invariant(
      bytes.equals(planReceiptBytes(expectedDocument)),
      "recomputed in-memory plan differs from the hash-bound plan receipt",
      "PLAN_RECEIPT_MISMATCH",
    );
  }
  return {absolutePath, bytes, document, fileIdentity: stable.identity};
}

async function currentChromiumProofIdentity({
  projectRoot,
  receiptPath,
  planReceipt,
  runtimeRecords = planReceipt.document?.payload?.runtimes,
}) {
  const generatorPath = resolveWithin(
    projectRoot,
    "scripts/generate-adaptive-canvas-batch.mjs",
    "batch generator",
  );
  const testPath = resolveWithin(projectRoot, BATCH_TEST_PATH, "batch test");
  const [generatorBytes, testBytes, toolchain] = await Promise.all([
    readOrdinaryFile(generatorPath, "batch generator"),
    readOrdinaryFile(testPath, "batch test"),
    collectChromiumToolchainIdentity({projectRoot}),
  ]);
  const generator = {
    path: "scripts/generate-adaptive-canvas-batch.mjs",
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  };
  invariant(
    canonicalJson(planReceipt.document?.payload?.generator) ===
      canonicalJson(generator),
    "plan receipt does not bind the current batch generator",
    "STALE_PLAN_RECEIPT",
  );
  const receiptRuntimeSet = runtimeSetIdentity(
    planReceipt.document?.payload?.runtimes,
  );
  const currentRuntimeSet = runtimeSetIdentity(runtimeRecords);
  invariant(
    canonicalJson(receiptRuntimeSet) === canonicalJson(currentRuntimeSet),
    "plan receipt runtime set differs from the current in-memory plan",
    "STALE_PLAN_RECEIPT",
  );
  return {
    generator,
    test: {
      path: BATCH_TEST_PATH,
      bytes: testBytes.length,
      sha256: sha256(testBytes),
    },
    planReceipt: {
      path: projectRelative(projectRoot, planReceipt.absolutePath) || receiptPath,
      bytes: planReceipt.bytes.length,
      sha256: sha256(planReceipt.bytes),
      payloadSha256: planReceipt.document.payloadSha256,
    },
    runtimeSet: currentRuntimeSet,
    toolchain,
    runnerContract: CHROMIUM_PROOF_RUNNER_CONTRACT,
  };
}

export async function collectChromiumProofIdentity({
  receiptPath = DEFAULT_PLAN_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const planReceipt = await readAndValidatePlanReceipt({
    receiptPath,
    projectRoot: resolvedRoot,
  });
  return currentChromiumProofIdentity({
    projectRoot: resolvedRoot,
    receiptPath,
    planReceipt,
  });
}

export async function writeChromiumProofReceipt({
  document,
  receiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
  requireCreated = false,
}) {
  const resolvedRoot = path.resolve(projectRoot);
  invariant(
    isSafeRelativePath(receiptPath) && receiptPath.startsWith("work/") &&
      receiptPath.endsWith(".json"),
    "real-Chromium proof receipts must stay under work/ as JSON evidence",
    "UNSAFE_PATH",
  );
  const absolutePath = resolveWithin(
    resolvedRoot,
    receiptPath,
    "real-Chromium proof receipt",
  );
  const bytes = chromiumProofReceiptBytes(document);
  const operation = await writeAtomicExclusiveOrSame(
    absolutePath,
    bytes,
    "adaptive real-Chromium proof receipt",
  );
  invariant(
    !requireCreated || operation === "created",
    "fresh Chromium challenge proof path was already present",
    "PREEXISTING_PROOF_NOT_AUTHORIZING",
  );
  return {
    operation,
    path: projectRelative(resolvedRoot, absolutePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    payloadSha256: document.payloadSha256,
  };
}

export function validateChromiumProofForApply({
  document,
  expectedChallenge,
  expectedIdentity,
  runtimeRecords,
}) {
  chromiumProofReceiptBytes(document);
  invariant(
    canonicalJson(document.payload.challenge) ===
      canonicalJson(expectedChallenge),
    "real-Chromium proof challenge does not match this apply invocation",
    "STALE_OR_FORGED_CHROMIUM_PROOF",
  );
  invariant(
    canonicalJson(document.payload.generator) ===
      canonicalJson(expectedIdentity.generator),
    "real-Chromium proof is stale for the current generator",
    "STALE_CHROMIUM_PROOF",
  );
  invariant(
    canonicalJson(document.payload.test) === canonicalJson(expectedIdentity.test),
    "real-Chromium proof is stale for the current test",
    "STALE_CHROMIUM_PROOF",
  );
  invariant(
    canonicalJson(document.payload.planReceipt) ===
      canonicalJson(expectedIdentity.planReceipt),
    "real-Chromium proof is stale for the selected plan receipt",
    "STALE_CHROMIUM_PROOF",
  );
  invariant(
    canonicalJson(document.payload.runtimeSet) ===
      canonicalJson(expectedIdentity.runtimeSet) &&
      canonicalJson(document.payload.toolchain) ===
        canonicalJson(expectedIdentity.toolchain) &&
      canonicalJson(document.payload.runnerContract) ===
        canonicalJson(expectedIdentity.runnerContract),
    "real-Chromium proof runtime/toolchain identity is stale",
    "STALE_CHROMIUM_PROOF",
  );
  invariant(
    Array.isArray(runtimeRecords),
    "adaptive runtime records are required to validate Chromium proof",
    "INVALID_CHROMIUM_PROOF",
  );
  invariant(
    canonicalJson(runtimeSetIdentity(runtimeRecords)) ===
      canonicalJson(expectedIdentity.runtimeSet),
    "adaptive runtime records differ from the proof identity",
    "STALE_CHROMIUM_PROOF",
  );
  const records = new Map(runtimeRecords.map((record) => [record.animationId, record]));
  for (const sample of document.payload.samples) {
    const record = records.get(sample.animationId);
    invariant(
      record && record.pageRenderer === sample.pageRenderer &&
        record.input.sha256 === sample.inputSha256 &&
        record.output.sha256 === sample.outputSha256,
      `${sample.animationId}: Chromium proof runtime binding differs from plan`,
      "STALE_CHROMIUM_PROOF",
    );
  }
  const guard = document.payload.guardBeforeDraw;
  const guardRecord = records.get(guard.animationId);
  invariant(
    guardRecord?.pageRenderer === true &&
      guardRecord.input.sha256 === guard.inputSha256 &&
      guardRecord.output.sha256 === guard.outputSha256,
    `${guard.animationId}: Chromium guard proof runtime binding differs from plan`,
    "STALE_CHROMIUM_PROOF",
  );
  return true;
}

export async function readAndValidateChromiumProofReceipt({
  proofReceiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
  expectedChallenge,
  expectedIdentity,
  runtimeRecords,
}) {
  const resolvedRoot = path.resolve(projectRoot);
  invariant(
    isSafeRelativePath(proofReceiptPath) &&
      proofReceiptPath.startsWith("work/") &&
      proofReceiptPath.endsWith(".json"),
    "real-Chromium proof receipts must stay under work/ as JSON evidence",
    "UNSAFE_PATH",
  );
  const absolutePath = resolveWithin(
    resolvedRoot,
    proofReceiptPath,
    "real-Chromium proof receipt",
  );
  const stable = await readStableOrdinaryFile(
    absolutePath,
    proofReceiptPath,
  );
  const {bytes} = stable;
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new AdaptiveCanvasBatchError(
      `real-Chromium proof receipt is invalid JSON: ${error.message}`,
      "INVALID_CHROMIUM_PROOF",
    );
  }
  const normalized = chromiumProofReceiptBytes(document);
  invariant(
    normalized.equals(bytes),
    "real-Chromium proof receipt JSON bytes are not canonical",
    "INVALID_CHROMIUM_PROOF",
  );
  if (expectedChallenge || expectedIdentity || runtimeRecords) {
    invariant(
      expectedChallenge && expectedIdentity && runtimeRecords,
      "Chromium proof apply validation requires challenge, identity, and runtime records",
      "INVALID_CHROMIUM_PROOF",
    );
    validateChromiumProofForApply({
      document,
      expectedChallenge,
      expectedIdentity,
      runtimeRecords,
    });
  }
  return {absolutePath, bytes, document, fileIdentity: stable.identity};
}

export function temporaryChromiumProofPath({
  challengeSha256,
  parentProcessId = process.pid,
}) {
  invariant(
    SHA256_PATTERN.test(challengeSha256) &&
      Number.isSafeInteger(parentProcessId) && parentProcessId > 0,
    "invalid temporary Chromium proof identity",
    "INVALID_CHROMIUM_PROOF_CHALLENGE",
  );
  return `work/.adaptive-canvas-chromium-proof-${parentProcessId}-${challengeSha256}.json`;
}

export async function assertFreshChromiumProofPublicationTarget({
  proofReceiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
}) {
  invariant(
    isSafeRelativePath(proofReceiptPath) &&
      proofReceiptPath.startsWith("work/") &&
      proofReceiptPath.endsWith(".json"),
    "real-Chromium proof publication must stay under work/ as JSON evidence",
    "UNSAFE_PATH",
  );
  const absolutePath = resolveWithin(
    path.resolve(projectRoot),
    proofReceiptPath,
    "real-Chromium proof publication target",
  );
  const entry = await lstat(absolutePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  invariant(
    entry === null,
    `${proofReceiptPath}: a pre-existing proof can never authorize apply; choose a fresh publication path`,
    "PREEXISTING_PROOF_NOT_AUTHORIZING",
  );
  return absolutePath;
}

function boundedRunnerOutput(chunks, maximumBytes = 1_000_000) {
  const bytes = Buffer.concat(chunks);
  if (bytes.length <= maximumBytes) return bytes.toString("utf8");
  return bytes.subarray(bytes.length - maximumBytes).toString("utf8");
}

async function runExactChromiumProofRunner({
  projectRoot,
  receiptPath,
  challengeBytes,
  temporaryProofPath,
  chromiumExecutablePath,
}) {
  const runnerEnvironment = {};
  for (const key of [
    "HOME",
    "LANG",
    "LC_ALL",
    "PATH",
    "TMP",
    "TMPDIR",
    "TEMP",
    "__CF_USER_TEXT_ENCODING",
  ]) {
    if (typeof process.env[key] === "string") {
      runnerEnvironment[key] = process.env[key];
    }
  }
  Object.assign(runnerEnvironment, {
    HELP_MATH_CHROMIUM_PROOF_RUNNER_MODE: CHROMIUM_PROOF_RUNNER_MODE,
    NO_COLOR: "1",
  });
  const argumentsForNode = [
    "--test",
    "--test-concurrency=1",
    `--test-name-pattern=^${CHROMIUM_PROOF_TEST_NAME}$`,
    BATCH_TEST_PATH,
  ];
  const child = spawn(process.execPath, argumentsForNode, {
    cwd: projectRoot,
    env: runnerEnvironment,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdinError = null;
  child.stdin.on("error", (error) => {
    stdinError = error;
  });
  child.stdin.end(`${canonicalJson({
    protocol: CHROMIUM_PROOF_RUNNER_MODE,
    challengeBase64: challengeBytes.toString("base64"),
    planReceiptPath: receiptPath,
    proofOutputPath: temporaryProofPath,
    chromiumExecutablePath,
  })}\n`);
  const stdoutChunks = [];
  const stderrChunks = [];
  child.stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
  child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
  const result = await new Promise((resolve, reject) => {
    let timedOut = false;
    let forceKill = null;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      forceKill = setTimeout(() => child.kill("SIGKILL"), 5_000);
    }, CHROMIUM_PROOF_RUNNER_CONTRACT.timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timeout);
      if (forceKill) clearTimeout(forceKill);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (forceKill) clearTimeout(forceKill);
      resolve({code, signal, timedOut});
    });
  });
  const stdout = boundedRunnerOutput(stdoutChunks);
  const stderr = boundedRunnerOutput(stderrChunks);
  invariant(
    !stdinError && !result.timedOut && result.code === 0 && result.signal === null,
    "exact real-Chromium proof runner failed before apply authorization: " +
      `code=${result.code} signal=${result.signal || "none"} ` +
      `timeout=${result.timedOut}; stdout=${JSON.stringify(stdout.slice(-4000))}; ` +
      `stderr=${JSON.stringify(stderr.slice(-4000))}; ` +
      `stdinError=${JSON.stringify(stdinError?.message || null)}`,
    "REAL_CHROMIUM_PROOF_RUNNER_FAILED",
  );
  return {stdout, stderr};
}

async function authorizeFreshChromiumProofForApply({
  plan,
  planReceipt,
  receiptPath,
  proofReceiptPath,
  projectRoot,
}) {
  await assertFreshChromiumProofPublicationTarget({
    proofReceiptPath,
    projectRoot,
  });
  const challengeBytes = randomBytes(32);
  const challengeSha256 = sha256(challengeBytes);
  const temporaryProofPath = temporaryChromiumProofPath({
    challengeSha256,
  });
  const temporaryAbsolutePath = resolveWithin(
    projectRoot,
    temporaryProofPath,
    "temporary real-Chromium proof",
  );
  const temporaryEntry = await lstat(temporaryAbsolutePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  invariant(
    temporaryEntry === null,
    "unique temporary Chromium proof path already exists",
    "CHROMIUM_PROOF_CHALLENGE_COLLISION",
  );
  const expectedChallenge = {
    algorithm: "sha256",
    inputBytes: challengeBytes.length,
    sha256: challengeSha256,
    runnerMode: CHROMIUM_PROOF_RUNNER_MODE,
    temporaryProofPath,
  };
  const expectedIdentity = await currentChromiumProofIdentity({
    projectRoot,
    receiptPath,
    planReceipt,
    runtimeRecords: plan.runtimeRecords,
  });
  try {
    await runExactChromiumProofRunner({
      projectRoot,
      receiptPath,
      challengeBytes,
      temporaryProofPath,
      chromiumExecutablePath:
        expectedIdentity.toolchain.chromium.executable.path,
    });
    const chromiumProof = await readAndValidateChromiumProofReceipt({
      proofReceiptPath: temporaryProofPath,
      projectRoot,
      expectedChallenge,
      expectedIdentity,
      runtimeRecords: plan.runtimeRecords,
    });
    const postRunnerIdentity = await currentChromiumProofIdentity({
      projectRoot,
      receiptPath,
      planReceipt,
      runtimeRecords: plan.runtimeRecords,
    });
    invariant(
      canonicalJson(postRunnerIdentity) === canonicalJson(expectedIdentity),
      "generator/test/plan/runtime/toolchain changed during proof runner",
      "STALE_CHROMIUM_PROOF",
    );
    const postRunnerPlan = await createAdaptiveCanvasBatchPlan({projectRoot});
    invariant(
      planReceiptBytes(postRunnerPlan.document).equals(planReceipt.bytes),
      "full adaptive batch plan changed during the Chromium proof run",
      "STALE_PLAN_RECEIPT",
    );
    const publication = await writeChromiumProofReceipt({
      document: chromiumProof.document,
      receiptPath: proofReceiptPath,
      projectRoot,
      requireCreated: true,
    });
    const preStageIdentity = await currentChromiumProofIdentity({
      projectRoot,
      receiptPath,
      planReceipt,
      runtimeRecords: plan.runtimeRecords,
    });
    invariant(
      canonicalJson(preStageIdentity) === canonicalJson(expectedIdentity),
      "generator/test/plan/runtime/toolchain changed before staging",
      "STALE_CHROMIUM_PROOF",
    );
    return {
      chromiumProof,
      publication,
      validatedPlan: postRunnerPlan,
      expectedChallenge,
      expectedIdentity,
      runnerPlanReceiptFileIdentity: planReceipt.fileIdentity,
    };
  } finally {
    await unlink(temporaryAbsolutePath).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

export async function collectAuthorizedPhysicalPrecondition({
  projectRoot = PROJECT_ROOT,
  plan,
  receiptPath = DEFAULT_PLAN_RECEIPT_PATH,
  proofReceiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  expectedChallenge,
  expectedIdentity,
  runnerPlanReceiptFileIdentity,
  runnerProvenance,
}) {
  const resolvedRoot = path.resolve(projectRoot);
  const freshPlanReceipt = await readAndValidatePlanReceipt({
    receiptPath,
    projectRoot: resolvedRoot,
    expectedDocument: plan.document,
  });
  invariant(
    stableFileIdentityEquals(
      freshPlanReceipt.fileIdentity,
      runnerPlanReceiptFileIdentity,
    ),
    "plan receipt inode/metadata changed during the Chromium runner",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  const freshProvenance =
    await readAndValidateRegenerationProvenanceReceipt({
      projectRoot: resolvedRoot,
      runtimeRecords: plan.runtimeRecords,
    });
  invariant(
    stableFileIdentityEquals(
      freshProvenance.fileIdentity,
      runnerProvenance.fileIdentity,
    ) && canonicalJson(freshProvenance.verifiedFileIdentities) ===
      canonicalJson(runnerProvenance.verifiedFileIdentities),
    "provenance receipt/source/generator identity changed during the Chromium runner",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  const officialProof = await readAndValidateChromiumProofReceipt({
    proofReceiptPath,
    projectRoot: resolvedRoot,
    expectedChallenge,
    expectedIdentity,
    runtimeRecords: plan.runtimeRecords,
  });
  const freshIdentity = await currentChromiumProofIdentity({
    projectRoot: resolvedRoot,
    receiptPath,
    planReceipt: freshPlanReceipt,
    runtimeRecords: plan.runtimeRecords,
  });
  invariant(
    canonicalJson(freshIdentity) === canonicalJson(expectedIdentity),
    "generator/test/plan/runtime/toolchain changed after proof publication",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  const recomputedPlan = await createAdaptiveCanvasBatchPlan({
    projectRoot: resolvedRoot,
  });
  invariant(
    planReceiptBytes(recomputedPlan.document).equals(freshPlanReceipt.bytes),
    "physical 1114-entry plan recomputation differs after proof publication",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  const productionClosure = await captureProductionPrecommitClosure({
    projectRoot: resolvedRoot,
    plan: recomputedPlan,
  });
  const generator = await readStableOrdinaryFile(
    resolveWithin(
      resolvedRoot,
      "scripts/generate-adaptive-canvas-batch.mjs",
      "batch generator",
    ),
    "batch generator",
  );
  const testFile = await readStableOrdinaryFile(
    resolveWithin(resolvedRoot, BATCH_TEST_PATH, "batch test"),
    "batch test",
  );
  invariant(
    generator.identity.sha256 === expectedIdentity.generator.sha256 &&
      testFile.identity.sha256 === expectedIdentity.test.sha256,
    "generator/test bytes changed while the commit precondition was captured",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  return {
    schemaVersion: 1,
    plan: recomputedPlan,
    evidenceIdentity: {
      planReceipt: freshPlanReceipt.fileIdentity,
      provenanceReceipt: freshProvenance.fileIdentity,
      provenanceFiles: freshProvenance.verifiedFileIdentities,
      officialProofReceipt: officialProof.fileIdentity,
      generator: generator.identity,
      test: testFile.identity,
      proofContentIdentity: freshIdentity,
    },
    productionClosure,
  };
}

export async function revalidateAuthorizedPhysicalPrecondition({
  precondition,
  projectRoot = PROJECT_ROOT,
  receiptPath = DEFAULT_PLAN_RECEIPT_PATH,
  proofReceiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  expectedChallenge,
  expectedIdentity,
  runnerPlanReceiptFileIdentity,
  runnerProvenance,
}) {
  const fresh = await collectAuthorizedPhysicalPrecondition({
    projectRoot,
    plan: precondition.plan,
    receiptPath,
    proofReceiptPath,
    expectedChallenge,
    expectedIdentity,
    runnerPlanReceiptFileIdentity,
    runnerProvenance,
  });
  invariant(
    canonicalJson(fresh.evidenceIdentity) ===
      canonicalJson(precondition.evidenceIdentity) &&
      canonicalJson(fresh.productionClosure) ===
        canonicalJson(precondition.productionClosure),
    "physical commit precondition changed after staging",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  return true;
}

export async function applyAdaptiveCanvasBatch({
  plan,
  receiptPath = DEFAULT_PLAN_RECEIPT_PATH,
  proofReceiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
}) {
  const resolvedRoot = path.resolve(projectRoot);
  const planReceipt = await readAndValidatePlanReceipt({
    receiptPath,
    projectRoot: resolvedRoot,
    expectedDocument: plan.document,
  });
  validateApplyPlanTargetSet(plan);
  const regenerationProvenance =
    await readAndValidateRegenerationProvenanceReceipt({
      projectRoot: resolvedRoot,
      runtimeRecords: plan.runtimeRecords,
    });
  // Do not launch the expensive proof runner, create staging paths, or touch a
  // production target unless an independently reviewed native transaction
  // capability is both code-pinned and actually wired. Node's pathname APIs
  // cannot provide the inode-conditional, descriptor-relative batch commit
  // needed for this 286-path production promotion.
  const atomicCapability = await assertAtomicCommitCapabilityApproved({
    projectRoot: resolvedRoot,
  });
  const authorization = await authorizeFreshChromiumProofForApply({
    plan,
    planReceipt,
    receiptPath,
    proofReceiptPath,
    projectRoot: resolvedRoot,
  });
  plan = authorization.validatedPlan;
  const precondition = await collectAuthorizedPhysicalPrecondition({
    projectRoot: resolvedRoot,
    plan,
    receiptPath,
    proofReceiptPath,
    expectedChallenge: authorization.expectedChallenge,
    expectedIdentity: authorization.expectedIdentity,
    runnerPlanReceiptFileIdentity:
      authorization.runnerPlanReceiptFileIdentity,
    runnerProvenance: regenerationProvenance,
  });
  await revalidateAuthorizedPhysicalPrecondition({
    precondition,
    projectRoot: resolvedRoot,
    receiptPath,
    proofReceiptPath,
    expectedChallenge: authorization.expectedChallenge,
    expectedIdentity: authorization.expectedIdentity,
    runnerPlanReceiptFileIdentity:
      authorization.runnerPlanReceiptFileIdentity,
    runnerProvenance: regenerationProvenance,
  });
  const finalAtomicCapability = await assertAtomicCommitCapabilityApproved({
    projectRoot: resolvedRoot,
  });
  invariant(
    canonicalJson(finalAtomicCapability) === canonicalJson(atomicCapability),
    "native atomic helper identity or capability changed before commit",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  plan = precondition.plan;
  const entries = buildAdaptiveAtomicCommitEntries({
    plan,
    precondition: precondition.productionClosure,
    projectRoot: resolvedRoot,
  });
  invariant(
    adaptiveAtomicStaticContractSha256(entries) ===
      REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256,
    "286-target transaction differs from the code-approved static contract",
    "PHYSICAL_COMMIT_PRECONDITION_CHANGED",
  );
  const rootIdentity = await projectRootDirectoryIdentity(resolvedRoot);
  const commitArguments = {
    helperPath: resolveWithin(
      resolvedRoot,
      REQUIRED_ATOMIC_COMMIT_CAPABILITY.helperPath,
      "native atomic commit helper",
    ),
    expectedHelperSha256: APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
    expectedStaticContractSha256:
      REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256,
    plan,
    precondition: precondition.productionClosure,
    projectRoot: resolvedRoot,
    rootIdentity,
    evidence: {
      planReceiptSha256:
        precondition.evidenceIdentity.planReceipt.sha256,
      provenanceReceiptSha256:
        precondition.evidenceIdentity.provenanceReceipt.sha256,
      proofReceiptSha256:
        precondition.evidenceIdentity.officialProofReceipt.sha256,
    },
  };
  let nativeCommit;
  let recoveredForward = false;
  try {
    nativeCommit = await executeAdaptiveAtomicCommit({
      ...commitArguments,
      action: "apply",
    });
  } catch (initialError) {
    try {
      nativeCommit = await executeAdaptiveAtomicCommit({
        ...commitArguments,
        action: "recover-forward",
      });
      recoveredForward = true;
    } catch (recoveryError) {
      const failure = new AdaptiveCanvasBatchError(
        "native atomic commit failed and exact forward recovery did not close; " +
          `initial=${initialError.code || initialError.name}; ` +
          `recovery=${recoveryError.code || recoveryError.name}`,
        "NATIVE_ATOMIC_COMMIT_UNCERTAIN",
      );
      failure.cause = recoveryError;
      failure.initialError = initialError;
      throw failure;
    }
  }
  try {
    const outputClosure = await captureProductionOutputClosure({
      projectRoot: resolvedRoot,
      plan,
    });
    return {
      status: "adaptive-canvas-production-five-atomic-apply-complete",
      runtimeCount: 284,
      pageRendererCount: 283,
      loadedHostCount: 1,
      outputTargetCount: outputClosure.present.length,
      bindingCommittedLast: true,
      recoveredForward,
      nativeCommit: {
        transactionId: nativeCommit.transactionId,
        manifestSha256: nativeCommit.manifestSha256,
        bundle: nativeCommit.bundle,
        helperIdentity: nativeCommit.helperIdentity,
        receipt: nativeCommit.receipt,
      },
      outputClosure,
    };
  } catch (postconditionError) {
    let rollback;
    try {
      rollback = await executeAdaptiveAtomicCommit({
        ...commitArguments,
        action: "recover-rollback",
      });
      // A successful rename-based rollback restores the exact preimage inodes
      // and bytes, but Darwin legitimately advances ctime during the swaps.
      // Re-capture the complete content/prestate contract instead of comparing
      // the stale pre-commit ctime values byte-for-byte.
      await captureProductionPrecommitClosure({
        projectRoot: resolvedRoot,
        plan,
      });
    } catch (rollbackError) {
      const failure = new AdaptiveCanvasBatchError(
        "native commit postcondition failed and exact rollback did not close",
        "NATIVE_ATOMIC_COMMIT_UNCERTAIN",
      );
      failure.cause = rollbackError;
      failure.postconditionError = postconditionError;
      throw failure;
    }
    const failure = new AdaptiveCanvasBatchError(
      "native commit postcondition failed; the exact 286-target preimage was restored",
      "NATIVE_ATOMIC_COMMIT_ROLLED_BACK",
    );
    failure.cause = postconditionError;
    failure.rollback = rollback.receipt;
    throw failure;
  }
}

export async function recoverAdaptiveCanvasBatch({
  action,
  transactionId,
  plan,
  receiptPath = DEFAULT_PLAN_RECEIPT_PATH,
  proofReceiptPath = DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  projectRoot = PROJECT_ROOT,
}) {
  invariant(
    ["recover-forward", "recover-rollback"].includes(action) &&
      SHA256_PATTERN.test(transactionId || ""),
    "recovery requires an exact action and 64-character transaction id",
    "INVALID_ATOMIC_RECOVERY_REQUEST",
  );
  const resolvedRoot = path.resolve(projectRoot);
  validateApplyPlanTargetSet(plan);
  const planReceipt = await readAndValidatePlanReceipt({
    receiptPath,
    projectRoot: resolvedRoot,
    expectedDocument: plan.document,
  });
  const provenance = await readAndValidateRegenerationProvenanceReceipt({
    projectRoot: resolvedRoot,
    runtimeRecords: plan.runtimeRecords,
  });
  const proof = await readStableOrdinaryFile(
    resolveWithin(resolvedRoot, proofReceiptPath, "Chromium proof receipt"),
    "Chromium proof receipt",
  );
  await assertAtomicCommitCapabilityApproved({projectRoot: resolvedRoot});
  const recovered = await recoverAdaptiveAtomicCommitFromStoredManifest({
    action,
    transactionId,
    helperPath: resolveWithin(
      resolvedRoot,
      REQUIRED_ATOMIC_COMMIT_CAPABILITY.helperPath,
      "native atomic commit helper",
    ),
    expectedHelperSha256: APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
    expectedStaticContractSha256:
      REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256,
    plan,
    projectRoot: resolvedRoot,
    expectedEvidence: {
      planReceiptSha256: planReceipt.fileIdentity.sha256,
      provenanceReceiptSha256: provenance.fileIdentity.sha256,
      proofReceiptSha256: proof.identity.sha256,
    },
  });
  const closure = action === "recover-forward"
    ? await captureProductionOutputClosure({projectRoot: resolvedRoot, plan})
    : await captureProductionPrecommitClosure({projectRoot: resolvedRoot, plan});
  return {
    status: action === "recover-forward"
      ? "adaptive-canvas-native-recovery-forward-complete"
      : "adaptive-canvas-native-recovery-rollback-complete",
    transactionId,
    targetCount: closure.present.length + closure.absent.length,
    nativeReceipt: recovered.receipt,
    closure,
  };
}

function validateV2ProfileShape(profile) {
  invariant(
    hasExactKeys(profile, [
      "schemaVersion",
      "profileId",
      "parentProfileId",
      "parentChecksumSetSha256",
      "generatedBy",
      "approvalScope",
      "approvedReleaseIds",
      "counts",
      "checksumSetSha256",
      "entries",
    ]),
    "v2 profile keys are not exact",
  );
  invariant(
    profile.schemaVersion === 2 &&
      profile.profileId === "current-js-production-assets-v2" &&
      profile.parentProfileId === "current-js-production-assets-v1" &&
      profile.parentChecksumSetSha256 === EXPECTED_V1_CHECKSUM_SET_SHA256 &&
      profile.generatedBy === "scripts/generate-adaptive-canvas-batch.mjs" &&
      profile.approvalScope === "five-lesson-current-js-production-closure" &&
      JSON.stringify(profile.approvedReleaseIds) ===
        JSON.stringify(APPROVED_RELEASE_IDS) &&
      JSON.stringify(profile.counts) === JSON.stringify(PROFILE_COUNTS) &&
      Array.isArray(profile.entries) && profile.entries.length === 1114,
    "v2 profile contract mismatch",
  );
  profile.entries.forEach(validateProfileEntry);
  invariant(
    computeProfileChecksumSet(profile.entries) === profile.checksumSetSha256,
    "v2 profile checksum set mismatch",
  );
}

export async function checkAdaptiveCanvasBatch({
  projectRoot = PROJECT_ROOT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const v1 = await loadFixedV1Profile(resolvedRoot);
  await verifyLiveRendererFileSet(
    resolvedRoot,
    v1.pageRenderers.map(({animationId}) => animationId),
  );
  const v2Path = resolveWithin(resolvedRoot, V2_PROFILE_PATH, "v2 profile");
  const v2Bytes = await readOrdinaryFile(v2Path, V2_PROFILE_PATH);
  let v2;
  try {
    v2 = JSON.parse(v2Bytes.toString("utf8"));
  } catch (error) {
    throw new AdaptiveCanvasBatchError(`v2 profile is invalid JSON: ${error.message}`);
  }
  validateV2ProfileShape(v2);
  const v1ByAsset = new Map(v1.profile.entries.map((entry) => [entry.assetPath, entry]));
  const v2ByAsset = new Map(v2.entries.map((entry) => [entry.assetPath, entry]));
  invariant(v2ByAsset.size === 1114, "v2 profile has duplicate asset paths");
  invariant(
    canonicalJson([...v1ByAsset.keys()]) === canonicalJson([...v2ByAsset.keys()]),
    "v2 asset membership/order differs from v1",
  );
  const pageByAsset = new Map(v1.pageRenderers.map((entry) => [entry.assetPath, entry]));
  const runtimeRecords = [];
  let totalBytesRehashed = 0;
  for (const v2Entry of v2.entries) {
    const v1Entry = v1ByAsset.get(v2Entry.assetPath);
    invariant(v1Entry, `${v2Entry.assetPath}: v2 entry is absent from v1`);
    const absolutePath = assetAbsolutePath(resolvedRoot, v2Entry);
    const current = await readOrdinaryFile(absolutePath, v2Entry.assetPath);
    invariant(
      current.length === v2Entry.bytes && sha256(current) === v2Entry.sha256,
      `${v2Entry.assetPath}: current bytes differ from v2 profile`,
      "V2_ASSET_IDENTITY_MISMATCH",
    );
    totalBytesRehashed += current.length;
    const pageEntry = pageByAsset.get(v2Entry.assetPath);
    const loadedHost = v2Entry.assetPath === LOADED_HOST.assetPath;
    if (!pageEntry && !loadedHost) {
      invariant(
        v2Entry.bytes === v1Entry.bytes && v2Entry.sha256 === v1Entry.sha256,
        `${v2Entry.assetPath}: non-runtime profile entry changed`,
        "NON_RUNTIME_PROFILE_DRIFT",
      );
      continue;
    }
    const animationId = loadedHost
      ? LOADED_HOST.metadataAnimationId
      : pageEntry.animationId;
    const registryAnimationId = loadedHost
      ? LOADED_HOST.registryAnimationId
      : animationId;
    const reverted = reverseAdaptiveRuntime({
      outputBytes: current,
      profileEntry: v1Entry,
      animationId,
      metadataAnimationId: animationId,
      registryAnimationId,
      pageRenderer: !loadedHost,
    });
    const regenerated = transformAdaptiveRuntime({
      inputBytes: reverted,
      profileEntry: v1Entry,
      animationId,
      metadataAnimationId: animationId,
      registryAnimationId,
      pageRenderer: !loadedHost,
    });
    invariant(
      regenerated.outputBytes.equals(current),
      `${registryAnimationId}: current adaptive bytes are not reproducible`,
      "V2_RUNTIME_NOT_REPRODUCIBLE",
    );
    invariant(
      regenerated.record.output.sha256 === v2Entry.sha256 &&
        regenerated.record.output.bytes === v2Entry.bytes,
      `${registryAnimationId}: v2 profile output binding mismatch`,
    );
    runtimeRecords.push(regenerated.record);
  }
  runtimeRecords.sort((left, right) => compareText(left.animationId, right.animationId));
  invariant(
    runtimeRecords.length === 284 &&
      runtimeRecords.filter(({pageRenderer}) => pageRenderer).length === 283 &&
      runtimeRecords.filter(
        ({pageRenderer, sourceBitmapResolutionBound}) =>
          pageRenderer && sourceBitmapResolutionBound,
      ).length === 114,
    "adaptive runtime/binding denominator mismatch",
  );
  const expectedV2 = v2ProfileFrom(v1.profile, runtimeRecords);
  invariant(
    expectedV2.bytes.equals(v2Bytes),
    "v2 profile bytes are not the deterministic generator output",
    "V2_PROFILE_NOT_REPRODUCIBLE",
  );
  const bindingPath = resolveWithin(
    resolvedRoot,
    GENERATED_BINDINGS_PATH,
    "generated bindings",
  );
  const bindingBytes = await readOrdinaryFile(bindingPath, GENERATED_BINDINGS_PATH);
  const expectedBindings = generatedBindingsBytes(runtimeRecords);
  invariant(
    bindingBytes.equals(expectedBindings),
    "generated adaptive bindings are stale",
    "ADAPTIVE_BINDINGS_STALE",
  );
  return {
    status: "pass",
    profileEntryCount: 1114,
    allCurrentV2EntryBytesRehashed: true,
    totalBytesRehashed,
    adaptiveRuntimeCount: 284,
    pageRendererCount: 283,
    loadedHostRuntimeCount: 1,
    sourceBitmapResolutionBoundPageRendererCount: 114,
    v2Profile: {
      bytes: v2Bytes.length,
      sha256: sha256(v2Bytes),
      checksumSetSha256: v2.checksumSetSha256,
    },
    generatedBindings: {
      bytes: bindingBytes.length,
      sha256: sha256(bindingBytes),
    },
    reverseProofCount: 284,
    reproducibleOutputCount: 284,
    evidenceBoundary: {
      flashFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictCompletionChanged: false,
      releaseEligibilityChanged: false,
      productionAliasChanged: false,
      publicationChanged: false,
    },
  };
}

export function usage() {
  return [
    "Usage: node scripts/generate-adaptive-canvas-batch.mjs [MODE] [options]",
    "",
    "Modes (choose exactly one):",
    "  --plan   Verify all fixed v1 inputs in memory and create a hash receipt (default)",
    "  --apply  Run fresh Chromium proof, then the code-approved 286-target native transaction",
    "  --recover-forward  Finish one exact persisted native transaction",
    "  --recover-rollback  Restore one exact persisted native transaction preimage",
    "  --check  Rehash all v2 files, reverse every runtime to v1, and check generated bytes",
    "  --bootstrap-bindings  Generate an inactive v1 lookup that returns null",
    "",
    "Options:",
    `  --receipt <path>  Plan receipt (default: ${DEFAULT_PLAN_RECEIPT_PATH})`,
    `  --proof-receipt <path>  Fresh proof publication path; it must not exist (default: ${DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH})`,
    "  --transaction <sha256>  Required only with a recovery mode",
    `  provenance receipt is fixed at ${REGENERATION_PROVENANCE_RECEIPT_PATH}; approved SHA: ${APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256}`,
    `  atomic commit requires ${REQUIRED_ATOMIC_COMMIT_CAPABILITY.protocol}; helper SHA ${APPROVED_ATOMIC_COMMIT_HELPER_SHA256}`,
    "  --help            Show this help",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {
    mode: "plan",
    receiptPath: DEFAULT_PLAN_RECEIPT_PATH,
    proofReceiptPath: DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
    transactionId: null,
    help: false,
  };
  let explicitMode = false;
  const setMode = (mode) => {
    invariant(
      !explicitMode,
      "choose exactly one operation mode",
    );
    options.mode = mode;
    explicitMode = true;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") options.help = true;
    else if (argument === "--plan") setMode("plan");
    else if (argument === "--apply") setMode("apply");
    else if (argument === "--recover-forward") setMode("recover-forward");
    else if (argument === "--recover-rollback") setMode("recover-rollback");
    else if (argument === "--check") setMode("check");
    else if (argument === "--bootstrap-bindings") {
      setMode("bootstrap-bindings");
    }
    else if (argument === "--receipt") {
      invariant(index + 1 < argv.length, "--receipt requires a value");
      options.receiptPath = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--receipt=")) {
      options.receiptPath = argument.slice("--receipt=".length);
      invariant(options.receiptPath.length > 0, "--receipt requires a value");
    } else if (argument === "--proof-receipt") {
      invariant(index + 1 < argv.length, "--proof-receipt requires a value");
      options.proofReceiptPath = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--proof-receipt=")) {
      options.proofReceiptPath = argument.slice("--proof-receipt=".length);
      invariant(
        options.proofReceiptPath.length > 0,
        "--proof-receipt requires a value",
      );
    } else if (argument === "--transaction") {
      invariant(index + 1 < argv.length, "--transaction requires a value");
      options.transactionId = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--transaction=")) {
      options.transactionId = argument.slice("--transaction=".length);
      invariant(options.transactionId.length > 0, "--transaction requires a value");
    } else throw new AdaptiveCanvasBatchError(`unknown argument: ${argument}`);
  }
  const recoveryMode = ["recover-forward", "recover-rollback"].includes(
    options.mode,
  );
  invariant(
    recoveryMode === (options.transactionId !== null),
    recoveryMode
      ? "a recovery mode requires --transaction <sha256>"
      : "--transaction is only valid with a recovery mode",
    "INVALID_ATOMIC_RECOVERY_REQUEST",
  );
  if (recoveryMode) {
    invariant(
      SHA256_PATTERN.test(options.transactionId),
      "--transaction must be a lowercase 64-character SHA-256",
      "INVALID_ATOMIC_RECOVERY_REQUEST",
    );
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.mode === "check") {
    process.stdout.write(`${JSON.stringify(await checkAdaptiveCanvasBatch())}\n`);
    return;
  }
  if (options.mode === "bootstrap-bindings") {
    process.stdout.write(`${JSON.stringify(await writeInactiveV1Bindings())}\n`);
    return;
  }
  const plan = await createAdaptiveCanvasBatchPlan();
  if (["recover-forward", "recover-rollback"].includes(options.mode)) {
    process.stdout.write(`${JSON.stringify(await recoverAdaptiveCanvasBatch({
      action: options.mode,
      transactionId: options.transactionId,
      plan,
      receiptPath: options.receiptPath,
      proofReceiptPath: options.proofReceiptPath,
    }))}\n`);
    return;
  }
  if (options.mode === "plan") {
    process.stdout.write(`${JSON.stringify(await writePlanReceipt({
      document: plan.document,
      receiptPath: options.receiptPath,
    }))}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(await applyAdaptiveCanvasBatch({
    plan,
    receiptPath: options.receiptPath,
    proofReceiptPath: options.proofReceiptPath,
  }))}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(
      `generate-adaptive-canvas-batch: ${error.code || "ERROR"}: ${error.message}\n`,
    );
    process.exitCode = 1;
  });
}
