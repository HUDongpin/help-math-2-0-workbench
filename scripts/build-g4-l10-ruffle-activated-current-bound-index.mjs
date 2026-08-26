#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import {isDeepStrictEqual} from "node:util";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {PNG} from "pngjs";

import {buildActivatedPlaybackPlan} from "./probe-lesson-release-ruffle-activated-playback.mjs";
import {
  readPinnedRuffleNetworkingBoundary,
  requestDisposition,
} from "./probe-lesson-release-ruffle-reference.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const FIXED_RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const FIXED_RUN_ID = "l10-full-current-binding-v1-20260803";
export const FIXED_BASE_URL = "http://127.0.0.1:3102";
export const FIXED_LANGUAGES = Object.freeze(["en", "es"]);
export const FIXED_MEMBER_COUNT = 47;
export const FIXED_RUN_COUNT = 94;
export const FIXED_PRE_ACTIVATION_MS = 250;
export const FIXED_POST_ACTIVATION_MS = 3_500;

export const BATCH_RELATIVE_PATH = path.posix.join(
  "output",
  "playwright",
  "lesson-ruffle-activated-natural-playback-diagnostics",
  FIXED_RELEASE_ID,
  FIXED_RUN_ID,
  "batch-activated-natural-playback-diagnostic.json",
);
export const REPORT_JSON_RELATIVE_PATH = "reports/g4-l10-ruffle-activated-evidence-closure-v2.json";
export const REPORT_MARKDOWN_RELATIVE_PATH = "reports/g4-l10-ruffle-activated-evidence-closure-v2.md";
export const PREDECESSOR_REPORTS = Object.freeze([
  Object.freeze({
    path: "reports/g4-l10-ruffle-activated-current-bound-index.json",
    bytes: 202_659,
    sha256: "eb951e9cdfa1867678c45c14aaec56ba96891e51e4c964f70af73e5ba16eaa27",
  }),
  Object.freeze({
    path: "reports/g4-l10-ruffle-activated-current-bound-index.md",
    bytes: 2_662,
    sha256: "2885d7a4cbd86861cc2d91810f34fa9d928aeb2acbae8b7c7884cbf0189a483f",
  }),
]);

export const ACTIVATED_PROBE_PATH = "scripts/probe-lesson-release-ruffle-activated-playback.mjs";
export const ROUTE_PROBE_PATH = "scripts/probe-lesson-release-ruffle-reference.mjs";
export const LEGACY_SOURCE_RESPONSE_PROBE_PATH = "scripts/probe-g4-l3-ruffle-reference.mjs";
export const INDEX_BUILDER_PATH = "scripts/build-g4-l10-ruffle-activated-current-bound-index.mjs";
export const INDEX_TEST_PATH = "scripts/build-g4-l10-ruffle-activated-current-bound-index.test.mjs";
export const RUFFLE_PACKAGE_ROOT = "node_modules/@ruffle-rs/ruffle";

export const FIXED_CAPTURE_WITNESS = Object.freeze({
  batch: Object.freeze({
    bytes: 42_855,
    sha256: "3d4f1df262e208fabbb5a22da3d260155d798a918b0a2c8a573e3115ea3ee5cc",
    generatedAt: "2026-08-03T21:39:58.169Z",
  }),
  manifests: Object.freeze({count: 47, sha256: "bb84474d1c27fc779103b3251d5ccaa5dbf80aefa1e6e39ca87eaf44c4df006b"}),
  machineAudits: Object.freeze({count: 47, sha256: "7534e99a4b187f4be5f33f05dfbb4579f7d69b87fa8941074fb165897d8c897d"}),
  canonicalSwfs: Object.freeze({count: 47, sha256: "d8e80cbeb6acf3de659f9b8009ca98d6aee28027dded3c103e236d5fd52e372e"}),
  diagnosticJson: Object.freeze({count: 94, sha256: "5f8f7da73eec366bed450445c0325fba00a38097b11606bb4d0bc00a92fc8559"}),
  beforeExplicitActivationPng: Object.freeze({count: 94, sha256: "80afbf55b2fca6a699c39be6e0342b5be0607a142b1b95e06ae7e553a78ea67e"}),
  afterExplicitActivationPng: Object.freeze({count: 94, sha256: "f8dc21d142dd2b9c06e620741945ba7c127d18ec0c7818181f71082c6d5dee96"}),
  allBeforeAfterPng: Object.freeze({count: 188, sha256: "be583625df70a1523155a9078e30640cd6ca9e8a34db95128e6fdc04cd9e40f5"}),
  allDiagnosticJsonAndPng: Object.freeze({count: 282, sha256: "e9530117a10c1d03bde07977b98b354d056be2e51ce71a02efe9d39c242c8854"}),
  visualCensus: Object.freeze({
    beforePngSha256Groups: Object.freeze([
      Object.freeze({sha256: "7d9aca6caabe715f6e8004147f62eadf1a8781e716f28d20b0e73f5e8c5378b1", count: 86}),
      Object.freeze({sha256: "59e50aa40ec22954a20f676a64068cfc246798a3a9dfc0714e2de8696f4dae0f", count: 8}),
    ]),
    afterPngSha256Groups: Object.freeze([
      Object.freeze({sha256: "87207dc5a2e5c96e9d09c01729b642d7e0f3ad836426aedc66fd86f5266b2f0d", count: 88}),
      Object.freeze({sha256: "6a532957fbbcdd7bbc9edbf87800f7e828e4fa0de1838259b12f6d73e6b85b47", count: 2}),
      Object.freeze({sha256: "945939af7148cce0d1bed97e7cb11a23e0128be4695da7e9e83fdff30491cdda", count: 2}),
      Object.freeze({sha256: "edb1ab60e5fd27e9a3ea668b87b1b516ab82c4653fe3e082a41b000b0a2d5b83", count: 2}),
    ]),
    solidPostActivationPngCount: 88,
    visuallyNonSolidPostActivationPngCount: 6,
    repeatedSolidPostActivationRgba: Object.freeze([184, 216, 247, 255]),
    visuallyNonSolidPostActivationRuns: Object.freeze([
      Object.freeze({ordinal: 38, animationId: "course-g04-l10-ts-003", language: "en"}),
      Object.freeze({ordinal: 38, animationId: "course-g04-l10-ts-003", language: "es"}),
      Object.freeze({ordinal: 39, animationId: "course-g04-l10-ts-004", language: "en"}),
      Object.freeze({ordinal: 39, animationId: "course-g04-l10-ts-004", language: "es"}),
      Object.freeze({ordinal: 47, animationId: "shell-course-g04-l10-index-local", language: "en"}),
      Object.freeze({ordinal: 47, animationId: "shell-course-g04-l10-index-local", language: "es"}),
    ]),
  }),
});

/**
 * This is an explicit, fixed source/tool boundary rather than a claim that an
 * old browser response body can be reconstructed after the fact. The index
 * also binds every Ruffle JS/WASM asset name actually observed in the 94
 * reports to its current installed file below RUFFLE_PACKAGE_ROOT.
 */
export const FIXED_TOOL_BOUNDARY_PATHS = Object.freeze([
  INDEX_BUILDER_PATH,
  INDEX_TEST_PATH,
  "package.json",
  ACTIVATED_PROBE_PATH,
  ROUTE_PROBE_PATH,
  LEGACY_SOURCE_RESPONSE_PROBE_PATH,
  "package-lock.json",
  `${RUFFLE_PACKAGE_ROOT}/package.json`,
  `${RUFFLE_PACKAGE_ROOT}/ruffle.js.map`,
  "apps/web/components/reference-player.tsx",
  "apps/web/app/[locale]/reference/[animationId]/page.tsx",
  "apps/web/app/api/reference/[animationId]/route.ts",
  "apps/web/app/api/ruffle/[...asset]/route.ts",
  "apps/web/lib/local-reference-diagnostic-access.ts",
  "apps/web/lib/catalog.ts",
  "apps/web/lib/catalog-overlays.ts",
  "apps/web/lib/catalog-cache-identity.ts",
  "apps/web/lib/lesson-release-publication.ts",
  "apps/web/app/globals.css",
]);

const EXPECTED_BATCH_ACCEPTANCE_KEYS = Object.freeze([
  "acceptanceNeutral",
  "strictAcceptanceEffect",
  "statement",
]);
const EXPECTED_RUN_ACCEPTANCE_KEYS = Object.freeze([
  "acceptanceNeutral",
  "strictAcceptanceEffect",
  "originalRuntimeAuthority",
  "deterministicFrameEvidence",
  "swfEnglishOrSpanishStateEvidence",
  "audioEvidence",
  "fidelityOrRmseEvidence",
  "humanReview",
  "ownerReview",
  "statement",
]);
const EXPECTED_STATUS = "observed-after-explicit-activation-with-blocked-network-attempts";
const EXPECTED_ALLOWLIST = Object.freeze([
  "exact reference page GET",
  "exact hash-bound SWF API GET",
  "same-origin /_next GET",
  "same-origin /api/ruffle GET",
]);
const CLOSURE_ENCODING = "sorted-portable-path-nul-sha256-lf-v1";
const PNG_SIGNATURE_HEX = "89504e470d0a1a0a";

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function portableFrom(root, value) {
  return portable(path.relative(root, value));
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPathInside(root, value, {allowRoot = false} = {}) {
  const relative = path.relative(root, value);
  return (allowRoot && relative === "") || (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(isDeepStrictEqual(actual, wanted), `${label} keys drifted: ${actual.join(",")}`);
}

function assertDeepEqual(actual, expected, label) {
  invariant(isDeepStrictEqual(actual, expected), `${label} drifted`);
}

function assertFinitePositive(value, label) {
  invariant(Number.isFinite(value) && value > 0, `${label} must be a positive finite number`);
}

function assertBooleanFalse(value, label) {
  invariant(value === false, `${label} must remain false`);
}

async function readPhysicalFile(root, relativePath, label, {requireSingleLink = true} = {}) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} path is missing`);
  invariant(!path.isAbsolute(relativePath), `${label} path must be relative`);
  const absolute = path.resolve(root, relativePath);
  invariant(isPathInside(root, absolute), `${label} escaped the project root`);
  let information;
  try {
    information = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`${label} is missing: ${portableFrom(root, absolute)}`);
    throw error;
  }
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  if (requireSingleLink) invariant(information.nlink === 1, `${label} must not be hard linked`);
  invariant(await realpath(absolute) === absolute, `${label} must not traverse a symbolic-link parent`);
  const bytes = await readFile(absolute);
  return {
    absolute,
    bytes,
    mode: information.mode & 0o7777,
    nlink: information.nlink,
    binding: {
      path: portableFrom(root, absolute),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function readPhysicalJson(root, relativePath, label, options) {
  const physical = await readPhysicalFile(root, relativePath, label, options);
  let value;
  try {
    value = JSON.parse(physical.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {...physical, value};
}

function parsePngIhdr(bytes, label) {
  invariant(bytes.length >= 24, `${label} is too short to contain a PNG IHDR`);
  invariant(bytes.subarray(0, 8).toString("hex") === PNG_SIGNATURE_HEX, `${label} PNG signature is invalid`);
  invariant(bytes.readUInt32BE(8) === 13, `${label} PNG first chunk is not a 13-byte IHDR`);
  invariant(bytes.subarray(12, 16).toString("ascii") === "IHDR", `${label} PNG first chunk is not IHDR`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  invariant(width > 0 && height > 0, `${label} PNG IHDR dimensions are invalid`);
  return {width, height};
}

function decodePngVisualCensus(bytes, label) {
  let decoded;
  try {
    decoded = PNG.sync.read(bytes, {checkCRC: true});
  } catch (error) {
    throw new Error(`${label} failed full PNG decode/CRC validation: ${error.message}`);
  }
  invariant(decoded.data.length === decoded.width * decoded.height * 4, `${label} decoded RGBA length drifted`);
  const rgba = [...decoded.data.subarray(0, 4)];
  let solid = true;
  for (let offset = 4; offset < decoded.data.length; offset += 4) {
    if (
      decoded.data[offset] !== rgba[0] ||
      decoded.data[offset + 1] !== rgba[1] ||
      decoded.data[offset + 2] !== rgba[2] ||
      decoded.data[offset + 3] !== rgba[3]
    ) {
      solid = false;
      break;
    }
  }
  return {
    width: decoded.width,
    height: decoded.height,
    fullyDecodedWithCrcValidation: true,
    solidSingleRgba: solid,
    rgba: solid ? rgba : null,
  };
}

function hashGroups(bindings) {
  const groups = new Map();
  for (const binding of bindings) groups.set(binding.sha256, (groups.get(binding.sha256) ?? 0) + 1);
  return [...groups]
    .map(([digest, count]) => ({sha256: digest, count}))
    .sort((left, right) => right.count - left.count || compareStrings(left.sha256, right.sha256));
}

function assertClosureWitness(actual, expected, label) {
  assertDeepEqual({count: actual.count, sha256: actual.sha256}, expected, `${label} fixed witness`);
}

async function verifyModeFrozenRunTree({root, runRootRelativePath, expectedFileBindings}) {
  const resolvedRoot = path.resolve(root);
  const runRoot = path.resolve(resolvedRoot, runRootRelativePath);
  invariant(isPathInside(resolvedRoot, runRoot), "fixed run root escaped the project root");
  const expectedFiles = new Set(expectedFileBindings.map(({path: entryPath}) => entryPath));
  invariant(expectedFiles.size === expectedFileBindings.length, "fixed run expected-file set contains duplicates");
  const expectedDirectories = new Set([portableFrom(resolvedRoot, runRoot)]);
  for (const entryPath of expectedFiles) {
    invariant(entryPath === portableFrom(resolvedRoot, runRoot) || entryPath.startsWith(`${portableFrom(resolvedRoot, runRoot)}/`), `fixed run expected file escaped its run root: ${entryPath}`);
    let parent = path.posix.dirname(entryPath);
    while (parent !== "." && parent.startsWith(portableFrom(resolvedRoot, runRoot))) {
      expectedDirectories.add(parent);
      if (parent === portableFrom(resolvedRoot, runRoot)) break;
      parent = path.posix.dirname(parent);
    }
  }

  const actualFiles = new Set();
  const actualDirectories = new Set();
  async function visit(absolute, isRoot = false) {
    const information = await lstat(absolute);
    invariant(!information.isSymbolicLink(), `fixed run contains a symbolic link: ${portableFrom(resolvedRoot, absolute)}`);
    invariant(await realpath(absolute) === absolute, `fixed run path traverses a symbolic-link parent: ${portableFrom(resolvedRoot, absolute)}`);
    const relative = portableFrom(resolvedRoot, absolute);
    if (information.isDirectory()) {
      invariant((information.mode & 0o7777) === 0o555, `fixed run directory must be mode 0555: ${relative}`);
      actualDirectories.add(relative);
      const entries = await readdir(absolute, {withFileTypes: true});
      for (const entry of entries.sort((left, right) => compareStrings(left.name, right.name))) {
        await visit(path.join(absolute, entry.name));
      }
      return;
    }
    invariant(!isRoot && information.isFile(), `fixed run contains a non-file/non-directory entry: ${relative}`);
    invariant(information.nlink === 1, `fixed run file must not be hard linked: ${relative}`);
    invariant((information.mode & 0o7777) === 0o444, `fixed run file must be mode 0444: ${relative}`);
    actualFiles.add(relative);
  }
  await visit(runRoot, true);
  assertDeepEqual([...actualFiles].sort(compareStrings), [...expectedFiles].sort(compareStrings), "fixed mode-frozen run file set");
  assertDeepEqual([...actualDirectories].sort(compareStrings), [...expectedDirectories].sort(compareStrings), "fixed mode-frozen run directory set");
  return {
    kind: "same-uid-mode-frozen-tamper-evident-run-tree-not-cryptographic-immutability",
    fileCount: actualFiles.size,
    directoryCount: actualDirectories.size,
    requiredFileMode: "0444",
    requiredDirectoryMode: "0555",
    noSymlinksOrSpecialEntries: true,
    noHardLinkedFiles: true,
    exactEnumeratedFileAndDirectorySets: true,
    statement: "The run tree is exact and mode-frozen for tamper evidence. The owner UID can still chmod and replace it, so this is not OS-enforced, signed, cryptographic, or physical immutability.",
  };
}

export function checksumClosure(entries, label = "artifact closure") {
  invariant(Array.isArray(entries) && entries.length > 0, `${label} must have at least one entry`);
  const sorted = [...entries].sort((left, right) => compareStrings(left.path, right.path));
  invariant(new Set(sorted.map(({path: entryPath}) => entryPath)).size === sorted.length, `${label} paths must be unique`);
  for (const entry of sorted) {
    invariant(typeof entry.path === "string" && !entry.path.includes("\0") && !entry.path.includes("\n"), `${label} contains an unsafe path`);
    invariant(/^[a-f0-9]{64}$/.test(entry.sha256 ?? ""), `${label} contains a malformed SHA-256`);
  }
  const encoded = Buffer.from(sorted.map(({path: entryPath, sha256: digest}) => `${entryPath}\0${digest}\n`).join(""), "utf8");
  return {
    encoding: CLOSURE_ENCODING,
    count: sorted.length,
    sha256: sha256(encoded),
  };
}

function expectedContext(overrides = {}) {
  return {
    releaseId: FIXED_RELEASE_ID,
    runId: FIXED_RUN_ID,
    baseUrl: FIXED_BASE_URL,
    languages: [...FIXED_LANGUAGES],
    memberCount: FIXED_MEMBER_COUNT,
    runCount: FIXED_RUN_COUNT,
    preActivationMs: FIXED_PRE_ACTIVATION_MS,
    postActivationMs: FIXED_POST_ACTIVATION_MS,
    activatedProbePath: ACTIVATED_PROBE_PATH,
    routeProbePath: ROUTE_PROBE_PATH,
    rufflePackageRoot: RUFFLE_PACKAGE_ROOT,
    toolBoundaryPaths: [...FIXED_TOOL_BOUNDARY_PATHS],
    fixedWitness: FIXED_CAPTURE_WITNESS,
    predecessorReports: [...PREDECESSOR_REPORTS],
    requireFrozenRunArtifacts: true,
    ...overrides,
  };
}

function assertBatchAcceptance(acceptance) {
  assertExactKeys(acceptance, EXPECTED_BATCH_ACCEPTANCE_KEYS, "batch acceptance");
  invariant(acceptance.acceptanceNeutral === true, "batch acceptanceNeutral must be true");
  assertBooleanFalse(acceptance.strictAcceptanceEffect, "batch strictAcceptanceEffect");
  invariant(typeof acceptance.statement === "string" && acceptance.statement.includes("cannot create deterministic frame or original-runtime evidence"), "batch acceptance statement lost its evidence boundary");
}

function assertRunAcceptance(acceptance, key) {
  assertExactKeys(acceptance, EXPECTED_RUN_ACCEPTANCE_KEYS, `${key} acceptance`);
  invariant(acceptance.acceptanceNeutral === true, `${key} acceptanceNeutral must be true`);
  for (const field of EXPECTED_RUN_ACCEPTANCE_KEYS) {
    if (["acceptanceNeutral", "statement"].includes(field)) continue;
    assertBooleanFalse(acceptance[field], `${key} acceptance.${field}`);
  }
  const statement = acceptance.statement;
  invariant(typeof statement === "string", `${key} acceptance statement is missing`);
  for (const phrase of [
    "does not establish original-runtime authority",
    "exact or deterministic frame",
    "English/Spanish SWF state",
    "audio cue correctness or audibility",
    "fidelity",
    "RMSE",
    "human review",
    "owner review",
    "strict completion",
    "publication",
    "current-JavaScript renderer",
  ]) {
    invariant(statement.includes(phrase), `${key} acceptance statement lost boundary: ${phrase}`);
  }
}

function assertOverlayClear(state, label) {
  invariant(state?.overlays?.play?.visible === false, `${label} play overlay must be hidden`);
  invariant(state?.overlays?.unmute?.visible === false, `${label} unmute overlay must be hidden`);
  invariant(state?.overlays?.hardwareAcceleration?.visible === false, `${label} hardware-acceleration overlay must be hidden`);
}

function assertPlaybackStateMetadata(state, runtime, nativeStage, label) {
  invariant(state && typeof state === "object", `${label} is missing`);
  invariant(state.ruffleV1Available === true && state.playApiAvailable === true, `${label} lacks the Ruffle playback API`);
  invariant(state.readyState === 2, `${label} readyState must be 2`);
  assertDeepEqual(state.metadata, {
    width: nativeStage.width,
    height: nativeStage.height,
    frameRate: runtime.fps,
    numFrames: runtime.frameCount,
    swfVersion: runtime.swfVersion,
  }, `${label} SWF metadata`);
}

function assertGeometry(geometry, run, key) {
  invariant(geometry && typeof geometry === "object", `${key} geometry is missing`);
  assertDeepEqual(geometry.nativeCssStage, run.nativeStage, `${key} geometry native stage`);
  assertDeepEqual(geometry.rasterPngStage, run.rasterStage, `${key} geometry raster stage`);
  invariant(geometry.fractionalNativeStagePreservedSeparatelyFromCeilRaster === true, `${key} geometry fractional/raster boundary is missing`);
  const {viewport, host, player} = geometry;
  invariant(viewport?.scrollX === 0 && viewport?.scrollY === 0, `${key} viewport must remain unscrolled`);
  for (const [name, box] of [["host", host], ["player", player]]) {
    assertFinitePositive(box?.width, `${key} ${name} width`);
    assertFinitePositive(box?.height, `${key} ${name} height`);
  }
  invariant(Math.abs(host.width - run.nativeStage.width) <= 0.05, `${key} host width drifted from native stage`);
  invariant(Math.abs(host.height - run.nativeStage.height) <= 0.05, `${key} host height drifted from native stage`);
  invariant(Math.abs(player.x - host.x) <= 0.05 && Math.abs(player.y - host.y) <= 0.05, `${key} player origin drifted from host`);
  invariant(Math.abs(player.width - host.width) <= 0.05 && Math.abs(player.height - host.height) <= 0.05, `${key} player dimensions drifted from host`);
  invariant(host.x >= 0 && host.y >= 0 && host.x + host.width <= viewport.innerWidth && host.y + host.height <= viewport.innerHeight, `${key} host is not fully contained in the viewport`);
  invariant(host.y >= geometry.stickyHeaderBottom, `${key} sticky header overlaps the host`);
  invariant(geometry.captureRectangleRole === "reference-player-host-only", `${key} capture rectangle role drifted`);
}

function assertNetworkDiagnostic(diagnostic, run, key) {
  invariant(diagnostic?.enforcement === "real-playwright-browser-context-route-and-websocket-interception", `${key} network enforcement drifted`);
  invariant(diagnostic.expectedOrigin === run.pageUrl.slice(0, run.pageUrl.indexOf("/", 8)), `${key} expected network origin drifted`);
  assertDeepEqual(diagnostic.allowlist, EXPECTED_ALLOWLIST, `${key} network allowlist`);
  invariant(diagnostic.everyOtherHttpRequestAbortedAndRecorded === true, `${key} HTTP abort/record boundary is missing`);
  invariant(diagnostic.everyWebSocketAbortedAndRecorded === true, `${key} WebSocket abort/record boundary is missing`);
  assertBooleanFalse(diagnostic.blockedRequestsReachedServer, `${key} blockedRequestsReachedServer`);
  invariant(Array.isArray(diagnostic.requests) && diagnostic.requests.length > 0, `${key} request list is empty`);
  invariant(Array.isArray(diagnostic.blockedRequests), `${key} blocked request list is missing`);
  invariant(Array.isArray(diagnostic.blockedWebSockets), `${key} blocked WebSocket list is missing`);
  invariant(Array.isArray(diagnostic.responses), `${key} response list is missing`);
  const policy = {expectedOrigin: FIXED_BASE_URL, pageUrl: run.pageUrl, sourceUrl: run.sourceUrl};
  for (const request of diagnostic.requests) {
    const disposition = requestDisposition(request.url, request.method, policy);
    invariant(request.allowed === disposition.allowed && request.kind === disposition.kind, `${key} request disposition drifted: ${request.method} ${request.url}`);
  }
  const blocked = diagnostic.requests.filter(({allowed}) => !allowed);
  assertDeepEqual(diagnostic.blockedRequests, blocked, `${key} blocked request list`);
  invariant(blocked.length > 0, `${key} expected the bound run's recorded blocked local prefetches`);
  for (const socket of diagnostic.blockedWebSockets) {
    invariant(socket?.allowed === false && socket?.kind === "blocked-websocket", `${key} malformed blocked WebSocket record`);
  }
  for (const response of diagnostic.responses) {
    const disposition = requestDisposition(response.url, response.method, policy);
    invariant(disposition.allowed === true, `${key} contains a response for a blocked request: ${response.url}`);
    invariant(response.disposition === disposition.kind, `${key} response disposition drifted: ${response.url}`);
    invariant(response.status === 200, `${key} allowed response was not HTTP 200: ${response.url}`);
  }
  invariant(diagnostic.requests.some(({allowed, kind, url}) => allowed && kind === "allowed-exact-page-get" && url === run.pageUrl), `${key} exact page GET is missing`);
  invariant(diagnostic.requests.some(({allowed, kind, url}) => allowed && kind === "allowed-exact-swf-api-get" && url === run.sourceUrl), `${key} exact SWF API GET is missing`);
  invariant(diagnostic.requests.some(({allowed, kind, url}) => allowed && kind === "allowed-ruffle-api-get" && url === `${FIXED_BASE_URL}/api/ruffle/ruffle.js`), `${key} local Ruffle loader GET is missing`);
  return {blocked, policy};
}

function observedRuffleAssetNames(responses, key) {
  const names = [];
  for (const response of responses) {
    if (response.disposition !== "allowed-ruffle-api-get") continue;
    const url = new URL(response.url);
    const prefix = "/api/ruffle/";
    invariant(url.pathname.startsWith(prefix), `${key} Ruffle response path drifted`);
    const name = decodeURIComponent(url.pathname.slice(prefix.length));
    invariant(/^[a-zA-Z0-9._-]+$/.test(name) && !name.includes("/"), `${key} Ruffle asset name is unsafe`);
    names.push(name);
  }
  invariant(names.includes("ruffle.js"), `${key} observed Ruffle assets omit ruffle.js`);
  return names;
}

function artifactEntry(binding) {
  return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
}

function summarizeKinds(records, field) {
  const counts = new Map();
  for (const record of records) {
    const key = String(record[field]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort(([left], [right]) => compareStrings(left, right)).map(([value, count]) => ({value, count}));
}

async function assertBindingsStable(root, bindings, label) {
  const byPath = new Map();
  for (const binding of bindings) {
    const prior = byPath.get(binding.path);
    if (prior) assertDeepEqual(binding, prior, `${label} duplicate binding ${binding.path}`);
    else byPath.set(binding.path, binding);
  }
  for (const expected of [...byPath.values()].sort((left, right) => compareStrings(left.path, right.path))) {
    const observed = await readPhysicalFile(root, expected.path, `${label} stability recheck ${expected.path}`, {requireSingleLink: false});
    assertDeepEqual(observed.binding, expected, `${label} changed during verification: ${expected.path}`);
  }
}

/**
 * Validate and index an already-completed activated-playback run. This
 * function is intentionally injectable for deterministic negative tests. The
 * production wrapper below fixes every scope/path/tool value.
 */
export async function validateActivatedCurrentBoundIndex({
  root,
  batchRelativePath,
  plan,
  networkingBoundary,
  context: contextOverrides = {},
} = {}) {
  const resolvedRoot = path.resolve(root);
  const context = expectedContext(contextOverrides);
  invariant(plan.releaseId === context.releaseId && plan.runId === context.runId, "activated plan release/run ID drifted");
  invariant(plan.baseUrl === context.baseUrl, "activated plan base URL drifted");
  assertDeepEqual(plan.languages, context.languages, "activated plan languages");
  invariant(plan.members?.length === context.memberCount, `activated plan must contain ${context.memberCount} members`);
  invariant(plan.runs?.length === context.runCount, `activated plan must contain ${context.runCount} runs`);
  invariant(plan.preActivationMs === context.preActivationMs && plan.postActivationMs === context.postActivationMs, "activated plan timing drifted");

  const batchPhysical = await readPhysicalJson(resolvedRoot, batchRelativePath, "activated-playback batch");
  const batch = batchPhysical.value;
  invariant(batch.schemaVersion === 1, "batch schemaVersion must be 1");
  invariant(batch.reportType === "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic-batch", "batch reportType drifted");
  invariant(batch.runId === context.runId, "batch runId drifted");
  assertDeepEqual(batch.release, plan.release, "batch release binding");
  assertDeepEqual(batch.languages, context.languages, "batch languages");
  invariant(batch.baseUrl === context.baseUrl, "batch baseUrl drifted");
  assertDeepEqual(batch.catalogs, plan.catalogs, "batch catalog binding");
  assertDeepEqual(batch.outputSeparation, plan.outputSeparation, "batch output separation");
  invariant(batch.runCount === context.runCount && batch.observedCount === context.runCount && batch.failedCount === 0, "batch must be observed/failed 94/0");
  invariant(Array.isArray(batch.runs) && batch.runs.length === context.runCount, `batch must have ${context.runCount} run pointers`);
  invariant(typeof batch.generatedAt === "string" && Number.isFinite(Date.parse(batch.generatedAt)), "batch generatedAt is invalid");
  assertBatchAcceptance(batch.acceptance);
  assertDeepEqual(batch.ruffleNetworkingBoundary, networkingBoundary, "batch Ruffle networking boundary");

  if (context.fixedWitness) {
    assertDeepEqual(batchPhysical.binding, {
      path: BATCH_RELATIVE_PATH,
      bytes: context.fixedWitness.batch.bytes,
      sha256: context.fixedWitness.batch.sha256,
    }, "fixed batch witness");
    invariant(batch.generatedAt === context.fixedWitness.batch.generatedAt, "fixed batch generatedAt witness drifted");
  }

  const predecessorReportBindings = [];
  for (const expected of context.predecessorReports) {
    const predecessor = await readPhysicalFile(resolvedRoot, expected.path, `unreviewed predecessor report ${expected.path}`);
    assertDeepEqual(predecessor.binding, expected, `unreviewed predecessor report ${expected.path}`);
    predecessorReportBindings.push(predecessor.binding);
  }

  const physicalCache = new Map();
  const jsonCache = new Map();
  const physical = async (relativePath, label, options) => {
    if (!physicalCache.has(relativePath)) physicalCache.set(relativePath, readPhysicalFile(resolvedRoot, relativePath, label, options));
    return physicalCache.get(relativePath);
  };
  const json = async (relativePath, label, options) => {
    if (!jsonCache.has(relativePath)) jsonCache.set(relativePath, readPhysicalJson(resolvedRoot, relativePath, label, options));
    return jsonCache.get(relativePath);
  };

  const explicitToolFiles = [];
  for (const relativePath of context.toolBoundaryPaths) {
    explicitToolFiles.push((await physical(relativePath, `tool boundary ${relativePath}`, {requireSingleLink: relativePath !== `${context.rufflePackageRoot}/package.json` && relativePath !== `${context.rufflePackageRoot}/ruffle.js.map`})).binding);
  }
  const toolByPath = new Map(explicitToolFiles.map((binding) => [binding.path, binding]));
  assertDeepEqual(batch.toolchain, {
    activatedPlaybackProbe: toolByPath.get(context.activatedProbePath),
    reusedExactReleasePlannerAndNetworkGuard: toolByPath.get(context.routeProbePath),
  }, "batch toolchain binding");

  // Re-read the current plan inputs after plan construction. This catches a
  // same-turn file change rather than trusting only the planner's first hash.
  for (const catalog of Object.values(plan.catalogs)) {
    const current = await physical(catalog.path, `current catalog ${catalog.path}`);
    assertDeepEqual(current.binding, catalog, `current catalog ${catalog.path}`);
  }

  const batchKeys = new Set();
  const planByKey = new Map(plan.runs.map((run) => [`${run.ordinal}|${run.animationId}|${run.language}`, run]));
  invariant(planByKey.size === context.runCount, "activated plan run keys are duplicated");
  const diagnosticArtifacts = [];
  const beforeArtifacts = [];
  const afterArtifacts = [];
  const runRows = [];
  const observedAssetNames = new Set();
  const manifestBindings = new Map();
  const machineAuditBindings = new Map();
  const sourceBindings = new Map();
  const blockedRequests = [];
  const blockedWebSockets = [];
  const consoleMessages = [];
  const afterVisualRows = [];
  let browserPageErrorCount = 0;
  let distinctBeforeAfterPairCount = 0;

  for (const batchRun of batch.runs) {
    const key = `${batchRun.ordinal}|${batchRun.animationId}|${batchRun.language}`;
    invariant(!batchKeys.has(key), `batch duplicates run ${key}`);
    batchKeys.add(key);
    const run = planByKey.get(key);
    invariant(run, `batch contains non-plan run ${key}`);
    invariant(batchRun.status === EXPECTED_STATUS, `${key} batch status drifted`);
    const expectedReportPath = portableFrom(resolvedRoot, path.join(run.output, "activated-natural-playback-diagnostic.json"));
    invariant(batchRun.report === expectedReportPath, `${key} batch report path drifted`);
    const reportPhysical = await json(expectedReportPath, `${key} activated diagnostic`);
    const report = reportPhysical.value;
    diagnosticArtifacts.push(artifactEntry(reportPhysical.binding));

    invariant(report.schemaVersion === 1 && report.reportType === "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic", `${key} diagnostic type drifted`);
    invariant(report.runId === context.runId && report.releaseId === context.releaseId, `${key} release/run ID drifted`);
    invariant(report.releaseOrdinal === run.ordinal && report.animationId === run.animationId, `${key} release member identity drifted`);
    invariant(report.assetId === run.assetId && report.releaseRole === run.releaseRole, `${key} release member binding drifted`);
    invariant(report.localizedRouteLanguage === run.language, `${key} localized route language drifted`);
    invariant(report.status === batchRun.status, `${key} report status conflicts with batch`);
    invariant(report.baseUrl === context.baseUrl && report.pageUrl === run.pageUrl && report.sourceUrl === run.sourceUrl, `${key} route/source URL drifted`);
    assertDeepEqual(report.outputSeparation, plan.outputSeparation, `${key} output separation`);
    assertDeepEqual(report.toolchain, batch.toolchain, `${key} toolchain`);
    assertDeepEqual(report.ruffleNetworkingBoundary, networkingBoundary, `${key} Ruffle networking boundary`);

    const expectedBinding = {
      lessonReleases: plan.catalogs.lessonReleases,
      animations: plan.catalogs.animations,
      workspace: run.workspace,
      manifest: run.manifest,
      machineAudit: run.machineAudit,
      source: run.source,
      nativeStage: run.nativeStage,
      rasterStage: run.rasterStage,
      physicalSourceHashPathBytesAndStageVerifiedBeforeBrowser: true,
    };
    assertDeepEqual(report.exactReleaseBinding, expectedBinding, `${key} exact current release binding`);
    const [manifestPhysical, machinePhysical, sourcePhysical] = await Promise.all([
      json(run.manifest.path, `${key} current manifest`),
      json(run.machineAudit.path, `${key} current machine audit`),
      physical(run.source.path, `${key} current canonical SWF`),
    ]);
    assertDeepEqual(manifestPhysical.binding, run.manifest, `${key} current manifest hash/bytes`);
    assertDeepEqual(machinePhysical.binding, run.machineAudit, `${key} current machine-audit hash/bytes`);
    assertDeepEqual(sourcePhysical.binding, run.source, `${key} current source hash/bytes`);
    manifestBindings.set(run.manifest.path, run.manifest);
    machineAuditBindings.set(run.machineAudit.path, run.machineAudit);
    sourceBindings.set(run.source.path, run.source);

    const runtime = manifestPhysical.value?.runtime;
    invariant(runtime && typeof runtime === "object", `${key} current manifest runtime is missing`);
    const sourceDiagnostic = report.sourceDiagnostic;
    invariant(sourceDiagnostic?.status === 200, `${key} SWF response was not HTTP 200`);
    invariant(sourceDiagnostic.contentType === "application/x-shockwave-flash", `${key} SWF content type drifted`);
    invariant(sourceDiagnostic.cacheControl === "no-store", `${key} SWF cache boundary drifted`);
    invariant(typeof sourceDiagnostic.contentSecurityPolicy === "string" && sourceDiagnostic.contentSecurityPolicy.length > 0, `${key} SWF CSP is missing`);
    invariant(sourceDiagnostic.bytes === run.source.bytes && sourceDiagnostic.sha256 === run.source.sha256 && sourceDiagnostic.exactSourceBytesVerified === true, `${key} exact SWF response binding failed`);

    const playback = report.playbackDiagnostic;
    assertDeepEqual(playback?.probeConfiguration, {
      autoplay: "off",
      unmuteOverlay: "visible",
      reason: "Force an explicit-start diagnostic opportunity before natural Ruffle playback; this is probe configuration, not evidence of the normal route autoplay state.",
    }, `${key} playback probe configuration`);
    invariant(playback.fixedDelayBeforeActivationMs === context.preActivationMs && playback.fixedDelayAfterActivationMs === context.postActivationMs, `${key} playback timing drifted`);
    invariant(typeof playback.activationCompletedAt === "string" && Number.isFinite(Date.parse(playback.activationCompletedAt)), `${key} activationCompletedAt is invalid`);
    assertPlaybackStateMetadata(playback.preActivationState, runtime, run.nativeStage, `${key} pre-activation state`);
    invariant(playback.preActivationState.publicElementIsPlaying === false && playback.preActivationState.ruffleV1IsPlaying === false, `${key} playback was already active before explicit activation`);
    invariant(playback.preActivationState.overlays?.play?.visible === true, `${key} visible play overlay was not observed before activation`);
    const activation = playback.activation;
    invariant(activation?.userActivationPreferred === true && activation.userActivationAttempted === true && activation.userActivationUsed === true, `${key} real UI activation was not used`);
    invariant(activation.playerPlayApiUsed === false, `${key} player.play() fallback must remain unused`);
    invariant(activation.primaryTrigger === "ruffle-shadow-play-button", `${key} primary activation trigger drifted`);
    const deliveredClicks = activation.steps?.filter((step) => step.method === "playwright-user-click" && step.target === "ruffle-shadow-play-button" && step.outcome === "delivered" && step.activation === true && step.playerPlayApi === false) ?? [];
    invariant(deliveredClicks.length === 1, `${key} must record exactly one delivered UI play-button activation`);
    invariant(!(activation.steps ?? []).some((step) => step.playerPlayApi === true || step.method === "player-play-api"), `${key} activation steps contain a player.play() fallback`);
    for (const [name, state] of [["activation.before", activation.before], ["activation.afterPrimary", activation.afterPrimary], ["activation.after", activation.after], ["postFixedDelayState", playback.postFixedDelayState]]) {
      assertPlaybackStateMetadata(state, runtime, run.nativeStage, `${key} ${name}`);
    }
    invariant(activation.before.publicElementIsPlaying === false && activation.before.ruffleV1IsPlaying === false, `${key} activation.before was already playing`);
    for (const [name, state] of [["activation.afterPrimary", activation.afterPrimary], ["activation.after", activation.after], ["postFixedDelayState", playback.postFixedDelayState]]) {
      invariant(state.publicElementIsPlaying === true && state.ruffleV1IsPlaying === true, `${key} ${name} did not remain playing`);
      assertOverlayClear(state, `${key} ${name}`);
    }
    invariant(playback.postCaptureOverlaysClear === true, `${key} post-capture overlay-clear flag is missing`);
    invariant(playback.exactSourceFrameObserved === null && playback.deterministicFrameSelectionSupported === false, `${key} improperly promotes a deterministic/source frame`);
    invariant(playback.normalRouteAutoplayBehaviorProven === false, `${key} improperly promotes normal-route autoplay evidence`);
    invariant(playback.languageFlashVarSelectionSupported === false && playback.localizedRouteLanguageIsNotSwfLanguageState === true, `${key} improperly promotes route locale into SWF language state`);
    invariant(playback.audioCueOrAudibilityObserved === false, `${key} improperly promotes audio evidence`);
    invariant(typeof playback.naturalPlaybackBoundary === "string" && playback.naturalPlaybackBoundary.includes("nondeterministic Ruffle observation"), `${key} natural-playback boundary is missing`);

    assertGeometry(report.geometry, run, key);
    const network = assertNetworkDiagnostic(report.networkDiagnostic, run, key);
    blockedRequests.push(...network.blocked);
    blockedWebSockets.push(...report.networkDiagnostic.blockedWebSockets);
    for (const name of observedRuffleAssetNames(report.networkDiagnostic.responses, key)) observedAssetNames.add(name);
    invariant(report.browserDiagnostic?.product === "Playwright Chromium", `${key} browser product drifted`);
    invariant(typeof report.browserDiagnostic.version === "string" && report.browserDiagnostic.version.length > 0, `${key} browser version is missing`);
    invariant(Array.isArray(report.browserDiagnostic.consoleMessages), `${key} console diagnostics are missing`);
    invariant(Array.isArray(report.browserDiagnostic.pageErrors), `${key} page errors are missing`);
    browserPageErrorCount += report.browserDiagnostic.pageErrors.length;
    consoleMessages.push(...report.browserDiagnostic.consoleMessages);
    invariant(report.browserDiagnostic.pageErrors.length === 0, `${key} contains browser page errors`);
    invariant(report.browserDiagnostic.messagesAreRecordedDiagnosticsNotAcceptance === true, `${key} browser-message acceptance boundary is missing`);

    const expectedBeforePath = portableFrom(resolvedRoot, path.join(run.output, "before-explicit-activation-stage.png"));
    const expectedAfterPath = portableFrom(resolvedRoot, path.join(run.output, "activated-natural-playback-stage.png"));
    const screenshotDefinitions = [
      ["beforeExplicitActivation", report.screenshots?.beforeExplicitActivation, expectedBeforePath, "nondeterministic-ruffle-before-explicit-activation-diagnostic-only", beforeArtifacts],
      ["afterExplicitActivationAndFixedDelay", report.screenshots?.afterExplicitActivationAndFixedDelay, expectedAfterPath, "nondeterministic-ruffle-post-explicit-activation-natural-playback-diagnostic-only", afterArtifacts],
    ];
    const screenshotRows = {};
    for (const [name, screenshot, expectedPath, expectedRole, collection] of screenshotDefinitions) {
      invariant(screenshot?.path === expectedPath, `${key} ${name} path drifted`);
      invariant(screenshot.role === expectedRole, `${key} ${name} role drifted`);
      invariant(screenshot.sourceFrameBinding === null && screenshot.requirementTraceEntryStateBinding === null, `${key} ${name} improperly claims frame/trace binding`);
      assertDeepEqual(screenshot.nativeCssStage, run.nativeStage, `${key} ${name} native stage`);
      assertDeepEqual(screenshot.rasterPngStage, run.rasterStage, `${key} ${name} raster stage`);
      const screenshotPhysical = await physical(expectedPath, `${key} ${name} PNG`);
      invariant(screenshotPhysical.binding.bytes === screenshot.bytes && screenshotPhysical.binding.sha256 === screenshot.sha256, `${key} ${name} PNG hash/bytes drifted`);
      const ihdr = parsePngIhdr(screenshotPhysical.bytes, `${key} ${name}`);
      invariant(ihdr.width === run.rasterStage.width && ihdr.height === run.rasterStage.height, `${key} ${name} PNG IHDR drifted from ceil(native stage)`);
      invariant(screenshot.width === ihdr.width && screenshot.height === ihdr.height, `${key} ${name} declared PNG dimensions drifted`);
      const visualCensus = decodePngVisualCensus(screenshotPhysical.bytes, `${key} ${name}`);
      invariant(visualCensus.width === ihdr.width && visualCensus.height === ihdr.height, `${key} ${name} full PNG decode dimensions drifted from IHDR`);
      collection.push(artifactEntry(screenshotPhysical.binding));
      screenshotRows[name] = {...artifactEntry(screenshotPhysical.binding), visualCensus};
    }
    if (screenshotRows.beforeExplicitActivation.sha256 !== screenshotRows.afterExplicitActivationAndFixedDelay.sha256) distinctBeforeAfterPairCount += 1;
    afterVisualRows.push({
      ordinal: run.ordinal,
      animationId: run.animationId,
      language: run.language,
      sha256: screenshotRows.afterExplicitActivationAndFixedDelay.sha256,
      solidSingleRgba: screenshotRows.afterExplicitActivationAndFixedDelay.visualCensus.solidSingleRgba,
      rgba: screenshotRows.afterExplicitActivationAndFixedDelay.visualCensus.rgba,
    });

    assertRunAcceptance(report.acceptance, key);
    runRows.push({
      ordinal: run.ordinal,
      animationId: run.animationId,
      language: run.language,
      status: report.status,
      report: artifactEntry(reportPhysical.binding),
      beforeExplicitActivation: screenshotRows.beforeExplicitActivation,
      afterExplicitActivationAndFixedDelay: screenshotRows.afterExplicitActivationAndFixedDelay,
      probeAuthoredActivationRecord: {
        recordedTrigger: activation.primaryTrigger,
        recordedUserActivationUsed: true,
        recordedPlayerPlayApiFallbackUsed: false,
        recordedPlayingAfterActivation: true,
        recordedPlayingAfterFixedDelay: true,
        recordedPostCaptureOverlaysClear: true,
        independentlyCorroborated: false,
      },
      blockedHttpRequestCount: network.blocked.length,
      blockedWebSocketCount: report.networkDiagnostic.blockedWebSockets.length,
      pageErrorCount: 0,
    });
  }

  invariant(batchKeys.size === context.runCount, "batch run-key cardinality drifted");
  for (const key of planByKey.keys()) invariant(batchKeys.has(key), `batch omits plan run ${key}`);
  invariant(manifestBindings.size === context.memberCount, "manifest binding set is incomplete");
  invariant(machineAuditBindings.size === context.memberCount, "machine-audit binding set is incomplete");
  invariant(sourceBindings.size === context.memberCount, "source binding set is incomplete");
  invariant(browserPageErrorCount === 0, "browser page error total must remain zero");
  invariant(runRows.every(({probeAuthoredActivationRecord}) => probeAuthoredActivationRecord.recordedUserActivationUsed && !probeAuthoredActivationRecord.recordedPlayerPlayApiFallbackUsed), "not every probe report records the expected explicit UI activation fields");

  const observedRuffleFiles = [];
  for (const name of [...observedAssetNames].sort()) {
    observedRuffleFiles.push((await physical(`${context.rufflePackageRoot}/${name}`, `observed Ruffle asset ${name}`, {requireSingleLink: false})).binding);
  }
  const toolBoundaryFiles = [...explicitToolFiles];
  for (const binding of observedRuffleFiles) {
    if (!toolBoundaryFiles.some(({path: entryPath}) => entryPath === binding.path)) toolBoundaryFiles.push(binding);
  }

  const allScreenshotArtifacts = [...beforeArtifacts, ...afterArtifacts];
  const allBrowserArtifacts = [...diagnosticArtifacts, ...allScreenshotArtifacts];
  const manifestEntries = [...manifestBindings.values()].map(artifactEntry);
  const machineAuditEntries = [...machineAuditBindings.values()].map(artifactEntry);
  const sourceEntries = [...sourceBindings.values()].map(artifactEntry);
  const blockedExternalCount = blockedRequests.filter(({url}) => new URL(url).origin !== context.baseUrl).length;
  const manifestClosure = checksumClosure(manifestEntries, "manifest closure");
  const machineAuditClosure = checksumClosure(machineAuditEntries, "machine-audit closure");
  const sourceClosure = checksumClosure(sourceEntries, "canonical SWF closure");
  const diagnosticClosure = checksumClosure(diagnosticArtifacts, "diagnostic JSON closure");
  const beforeClosure = checksumClosure(beforeArtifacts, "before-activation PNG closure");
  const afterClosure = checksumClosure(afterArtifacts, "after-activation PNG closure");
  const allPngClosure = checksumClosure(allScreenshotArtifacts, "all before/after PNG closure");
  const allArtifactClosure = checksumClosure(allBrowserArtifacts, "all browser artifact closure");
  const beforePngSha256Groups = hashGroups(beforeArtifacts);
  const afterPngSha256Groups = hashGroups(afterArtifacts);
  const solidPostActivationRows = afterVisualRows.filter(({solidSingleRgba}) => solidSingleRgba);
  const visuallyNonSolidPostActivationRows = afterVisualRows.filter(({solidSingleRgba}) => !solidSingleRgba);
  const solidRgbaGroups = new Map();
  for (const {rgba} of solidPostActivationRows) {
    const key = JSON.stringify(rgba);
    solidRgbaGroups.set(key, (solidRgbaGroups.get(key) ?? 0) + 1);
  }
  const postActivationVisualCensus = {
    fullPngDecodeAndCrcValidationCount: afterVisualRows.length,
    beforePngSha256GroupCount: beforePngSha256Groups.length,
    beforePngSha256Groups,
    afterPngSha256GroupCount: afterPngSha256Groups.length,
    afterPngSha256Groups,
    solidPostActivationPngCount: solidPostActivationRows.length,
    visuallyNonSolidPostActivationPngCount: visuallyNonSolidPostActivationRows.length,
    solidRgbaGroups: [...solidRgbaGroups].map(([rgba, count]) => ({rgba: JSON.parse(rgba), count})),
    visuallyNonSolidPostActivationRuns: visuallyNonSolidPostActivationRows.map(({ordinal, animationId, language, sha256}) => ({ordinal, animationId, language, sha256})),
    playerIsPlayingFlagsDoNotProveVisibleContentOrNaturalTrace: true,
    statement: "The image census is descriptive only. In particular, a cleared play overlay, different before/after hashes, and probe-authored isPlaying flags do not prove visible SWF content, a natural timeline trace, language behavior, audio, or behavioral success.",
  };

  if (context.fixedWitness) {
    assertClosureWitness(manifestClosure, context.fixedWitness.manifests, "manifest closure");
    assertClosureWitness(machineAuditClosure, context.fixedWitness.machineAudits, "machine-audit closure");
    assertClosureWitness(sourceClosure, context.fixedWitness.canonicalSwfs, "canonical SWF closure");
    assertClosureWitness(diagnosticClosure, context.fixedWitness.diagnosticJson, "diagnostic JSON closure");
    assertClosureWitness(beforeClosure, context.fixedWitness.beforeExplicitActivationPng, "before-activation PNG closure");
    assertClosureWitness(afterClosure, context.fixedWitness.afterExplicitActivationPng, "after-activation PNG closure");
    assertClosureWitness(allPngClosure, context.fixedWitness.allBeforeAfterPng, "all PNG closure");
    assertClosureWitness(allArtifactClosure, context.fixedWitness.allDiagnosticJsonAndPng, "all browser artifact closure");
    assertDeepEqual(beforePngSha256Groups, context.fixedWitness.visualCensus.beforePngSha256Groups, "before PNG visual witness groups");
    assertDeepEqual(afterPngSha256Groups, context.fixedWitness.visualCensus.afterPngSha256Groups, "after PNG visual witness groups");
    invariant(solidPostActivationRows.length === context.fixedWitness.visualCensus.solidPostActivationPngCount, "solid post-activation PNG witness count drifted");
    invariant(visuallyNonSolidPostActivationRows.length === context.fixedWitness.visualCensus.visuallyNonSolidPostActivationPngCount, "non-solid post-activation PNG witness count drifted");
    assertDeepEqual([...solidRgbaGroups].map(([rgba, count]) => ({rgba: JSON.parse(rgba), count})), [{
      rgba: context.fixedWitness.visualCensus.repeatedSolidPostActivationRgba,
      count: context.fixedWitness.visualCensus.solidPostActivationPngCount,
    }], "solid post-activation RGBA witness");
    assertDeepEqual(visuallyNonSolidPostActivationRows.map(({ordinal, animationId, language}) => ({ordinal, animationId, language})), context.fixedWitness.visualCensus.visuallyNonSolidPostActivationRuns, "non-solid post-activation run witness");
  }

  const modeFrozenRun = context.requireFrozenRunArtifacts
    ? await verifyModeFrozenRunTree({
      root: resolvedRoot,
      runRootRelativePath: path.posix.dirname(batchRelativePath),
      expectedFileBindings: [batchPhysical.binding, ...allBrowserArtifacts],
    })
    : {
      kind: "fixture-freeze-check-disabled",
      fileCount: null,
      directoryCount: null,
      statement: "Mode-frozen run-tree verification is disabled only for an injected test fixture.",
    };

  await assertBindingsStable(resolvedRoot, [
    batchPhysical.binding,
    ...predecessorReportBindings,
    ...Object.values(plan.catalogs),
    ...manifestEntries,
    ...machineAuditEntries,
    ...sourceEntries,
    ...toolBoundaryFiles,
    ...allBrowserArtifacts,
  ], "current-bound input/artifact set");
  const status = {
    currentReleaseCatalogWorkspaceSourceBindingValid: true,
    enumeratedToolSubsetBindingValid: true,
    fullBrowserRuntimeInputBindingValid: false,
    serverResponseBodyClosureComplete: false,
    independentUiCausalityEstablished: false,
    currentActivatedNaturalPlaybackObserved: false,
    deterministicFrameEvidence: false,
    originalRuntimeAuthority: false,
    audioEvidence: false,
    languageStateEvidence: false,
    fidelityEvidence: false,
    rmseEvidence: false,
    currentJavascriptRenderer: false,
    formalJavascriptRendererCount: 0,
    humanReview: false,
    ownerReview: false,
    migrationCompletion: false,
    strictComplete: false,
    wholeLessonIntegration: false,
    publication: false,
    strictAcceptanceEffect: "none",
  };

  return {
    schemaVersion: 2,
    reportType: "g4-l10-ruffle-activated-fixed-capture-evidence-closure-v2",
    status: "fixed-capture-reports-and-artifacts-verified-claims-explicitly-limited",
    fixedScope: {
      releaseId: context.releaseId,
      runId: context.runId,
      baseUrl: context.baseUrl,
      languages: context.languages,
      memberCount: context.memberCount,
      runCount: context.runCount,
      requiredStatus: EXPECTED_STATUS,
      reportPath: REPORT_JSON_RELATIVE_PATH,
    },
    unreviewedPredecessorLineage: {
      files: predecessorReportBindings,
      reviewStatus: "independently-rejected-as-formal-current-bound-forensic-index",
      supersededForClaimsByV2: true,
      acceptanceEffect: "none",
      statement: "These v1 reports are preserved and hash-bound only as unreviewed/rejected predecessor lineage. V2 neither overwrites nor adopts their overbroad current-browser-binding or natural-playback claims.",
    },
    fixedCaptureWitness: context.fixedWitness,
    modeFrozenRun,
    boundInput: {
      batch: artifactEntry(batchPhysical.binding),
      batchGeneratedAt: batch.generatedAt,
      catalogs: plan.catalogs,
      outputSeparation: plan.outputSeparation,
      toolchainRecordedByBatch: batch.toolchain,
      ruffleNetworkingBoundary: networkingBoundary,
    },
    currentInputClosures: {
      manifests: {...manifestClosure, files: manifestEntries.sort((left, right) => compareStrings(left.path, right.path))},
      machineAudits: {...machineAuditClosure, files: machineAuditEntries.sort((left, right) => compareStrings(left.path, right.path))},
      canonicalSwfs: {...sourceClosure, files: sourceEntries.sort((left, right) => compareStrings(left.path, right.path))},
    },
    toolBoundary: {
      kind: "enumerated-partial-tool-subset-plus-observed-local-ruffle-assets-not-full-browser-runtime-closure",
      files: toolBoundaryFiles.sort((left, right) => compareStrings(left.path, right.path)).map(artifactEntry),
      closure: checksumClosure(toolBoundaryFiles.map(artifactEntry), "tool boundary closure"),
      observedRuffleAssetNames: [...observedAssetNames].sort(),
      fullBrowserRuntimeDependencyClosure: false,
      historicalServerResponseBodyClosure: false,
      statement: "This binds only the enumerated probes/test/package entry, selected source files, lockfile, installed Ruffle metadata/source map, and local Ruffle JS/WASM asset names recorded by the probe. It omits other mutable Next/page/layout/content dependencies, built /_next response bodies, exact server build provenance, installed Playwright/pngjs implementation closure, Chromium bytes, and Node runtime bytes. It is not a complete historical browser/runtime input closure.",
    },
    artifactClosures: {
      diagnosticJson: diagnosticClosure,
      beforeExplicitActivationPng: beforeClosure,
      afterExplicitActivationPng: afterClosure,
      allBeforeAfterPng: allPngClosure,
      allDiagnosticJsonAndPng: allArtifactClosure,
    },
    postActivationVisualCensus,
    verification: {
      ...status,
      probeReportCount: runRows.length,
      probeReportsRecordExplicitUiActivationCount: runRows.filter(({probeAuthoredActivationRecord}) => probeAuthoredActivationRecord.recordedUserActivationUsed).length,
      probeReportsRecordPlayerPlayApiFallbackCount: runRows.filter(({probeAuthoredActivationRecord}) => probeAuthoredActivationRecord.recordedPlayerPlayApiFallbackUsed).length,
      beforeAfterPngCount: allScreenshotArtifacts.length,
      distinctBeforeAfterPairCount,
      solidPostActivationPngCount: solidPostActivationRows.length,
      visuallyNonSolidPostActivationPngCount: visuallyNonSolidPostActivationRows.length,
      playerIsPlayingFlagsDoNotProveVisibleContentOrNaturalTrace: true,
      browserPageErrorCount,
      blockedHttpRequestCount: blockedRequests.length,
      blockedExternalRequestCount: blockedExternalCount,
      blockedWebSocketCount: blockedWebSockets.length,
      blockedRequestKinds: summarizeKinds(blockedRequests, "kind"),
      consoleMessageTypes: summarizeKinds(consoleMessages, "type"),
    },
    runs: runRows.sort((left, right) => left.ordinal - right.ordinal || context.languages.indexOf(left.language) - context.languages.indexOf(right.language)),
    acceptanceBoundary: {
      ...status,
      acceptanceNeutral: true,
      statement: "V2 verifies fixed probe-authored reports, fixed screenshot/artifact bytes, current release catalogs/workspace manifests/machine audits/canonical SWFs, a mode-frozen run tree, and an enumerated partial tool subset. It does not independently prove historical UI causality, visible or natural SWF playback, a complete browser/runtime input closure, or historical server response bodies. It creates no deterministic frame, original-runtime, SWF-language, audio, fidelity, RMSE, current-JavaScript, human, owner, completion, strict, whole-lesson, or publication evidence.",
    },
    limitations: [
      "The capture did not hash all non-SWF page, Next.js, Ruffle, or /_next HTTP response bodies.",
      "The capture has no exact server build provenance or complete browser/runtime dependency closure.",
      "The same probe authored the click, isPlaying, fallback, overlay, network, console, and page-error fields; no independent Playwright trace, causal signature, or external witness corroborates them.",
      "Eighty-eight of 94 post-activation PNGs are the identical solid RGBA(184,216,247,255) image; isPlaying flags and overlay disappearance do not prove visible content, natural timeline progression, or behavioral success.",
      "The EN/ES values identify localized HTML routes only and do not prove a SWF English/Spanish state.",
      "No audio cue or audibility was observed.",
      "File mode 0444 and directory mode 0555 make the fixed run tamper-evident for ordinary use, but the owner UID can chmod/replace files; this is not cryptographic or physical immutability.",
    ],
  };
}

export function renderActivatedCurrentBoundMarkdown(report) {
  const verification = report.verification;
  return `# G4 L10 Ruffle Activated Evidence Closure v2

## Outcome

- Fixed release: \`${report.fixedScope.releaseId}\`.
- Fixed, mode-frozen, tamper-evident run: \`${report.fixedScope.runId}\`.
- Current release/catalog/workspace/source binding: **${verification.currentReleaseCatalogWorkspaceSourceBindingValid ? "valid" : "invalid"}**.
- Enumerated partial tool-subset binding: **${verification.enumeratedToolSubsetBindingValid ? "valid" : "invalid"}**.
- Full browser/runtime input closure: **${verification.fullBrowserRuntimeInputBindingValid ? "complete" : "not established"}**.
- Historical server response-body closure: **${verification.serverResponseBodyClosureComplete ? "complete" : "not established"}**.
- Independent UI causality: **${verification.independentUiCausalityEstablished ? "established" : "not established"}**.
- Current activated natural playback: **${verification.currentActivatedNaturalPlaybackObserved ? "established" : "not established"}**.
- Probe-authored reports recording explicit UI activation: **${verification.probeReportsRecordExplicitUiActivationCount}/${report.fixedScope.runCount}**.
- Probe-authored reports recording player \`play()\` fallbacks: **${verification.probeReportsRecordPlayerPlayApiFallbackCount}**.
- Browser page errors: **${verification.browserPageErrorCount}**.
- Before/after PNGs: **${verification.beforeAfterPngCount}**; distinct before/after pairs: **${verification.distinctBeforeAfterPairCount}/${report.fixedScope.runCount}**.
- Post-activation visual census: **${verification.solidPostActivationPngCount} solid PNGs; ${verification.visuallyNonSolidPostActivationPngCount} visually non-solid PNGs**.

## Fixed Witness and Current Source Binding

- Batch: \`${report.boundInput.batch.path}\`, ${report.boundInput.batch.bytes} bytes, SHA-256 \`${report.boundInput.batch.sha256}\`.
- Batch-generated input value: \`${report.boundInput.batchGeneratedAt}\`.
- Manifest closure: \`${report.currentInputClosures.manifests.sha256}\` (${report.currentInputClosures.manifests.count}).
- Machine-audit closure: \`${report.currentInputClosures.machineAudits.sha256}\` (${report.currentInputClosures.machineAudits.count}).
- Canonical-SWF closure: \`${report.currentInputClosures.canonicalSwfs.sha256}\` (${report.currentInputClosures.canonicalSwfs.count}).
- Enumerated partial tool-subset closure: \`${report.toolBoundary.closure.sha256}\` (${report.toolBoundary.closure.count}).
- Fixed run tree: ${report.modeFrozenRun.fileCount} files, ${report.modeFrozenRun.directoryCount} directories, file mode \`${report.modeFrozenRun.requiredFileMode}\`, directory mode \`${report.modeFrozenRun.requiredDirectoryMode}\`.
- V1 predecessor reports are hash-bound as rejected/unreviewed lineage and superseded for claims; V2 does not overwrite them.

## Browser Artifact Closures

- 94 diagnostic JSON: \`${report.artifactClosures.diagnosticJson.sha256}\`.
- 94 before-activation PNG: \`${report.artifactClosures.beforeExplicitActivationPng.sha256}\`.
- 94 post-activation PNG: \`${report.artifactClosures.afterExplicitActivationPng.sha256}\`.
- 188 before/after PNG: \`${report.artifactClosures.allBeforeAfterPng.sha256}\`.
- 282 diagnostic JSON + PNG artifacts: \`${report.artifactClosures.allDiagnosticJsonAndPng.sha256}\`.
- Closure encoding: \`${report.artifactClosures.allDiagnosticJsonAndPng.encoding}\`.

## Network Diagnostics

- Probe-authored blocked HTTP records: **${verification.blockedHttpRequestCount}**.
- Probe-authored blocked external-origin records: **${verification.blockedExternalRequestCount}**.
- Probe-authored blocked WebSocket records: **${verification.blockedWebSocketCount}**.
- Recorded enforcement was Playwright BrowserContext interception because pinned Ruffle 0.4.1 documents \`NetworkingAccessMode.None\` as unimplemented; V2 does not independently corroborate the historical causal chain.

## Material Limitations

${report.limitations.map((limitation) => `- ${limitation}`).join("\n")}

## Evidence Boundary

This closure proves only the fixed probe-authored report and screenshot bytes, their hard-coded capture witness, exact current release/catalog/workspace/source bindings, the mode-frozen run tree, and an enumerated partial tool subset. It does not independently prove the historical click chain, visible content, natural timeline progression, full browser/runtime inputs, or historical HTTP response bodies. It is not an authoritative original-runtime baseline, deterministic frame or natural-trace capture, English/Spanish SWF-language or audio-cue proof, visual fidelity/RMSE result, current-JavaScript renderer, human/owner decision, migration completion, strict acceptance, whole-lesson integration, or publication approval.

All acceptance and release effects remain false; \`strictAcceptanceEffect\` is \`none\` and the formal JavaScript renderer count remains 0.
`;
}

export async function buildG4L10RuffleActivatedCurrentBoundIndex({root = projectRoot} = {}) {
  const batch = await readPhysicalJson(root, BATCH_RELATIVE_PATH, "fixed activated-playback batch");
  invariant(batch.value.runId === FIXED_RUN_ID && batch.value.baseUrl === FIXED_BASE_URL, "fixed batch run/base binding drifted");
  const [plan, networkingBoundary] = await Promise.all([
    buildActivatedPlaybackPlan({
      root,
      releaseId: FIXED_RELEASE_ID,
      baseUrl: FIXED_BASE_URL,
      language: "both",
      runId: FIXED_RUN_ID,
      preActivationMs: FIXED_PRE_ACTIVATION_MS,
      postActivationMs: FIXED_POST_ACTIVATION_MS,
    }),
    readPinnedRuffleNetworkingBoundary({root}),
  ]);
  return validateActivatedCurrentBoundIndex({
    root,
    batchRelativePath: BATCH_RELATIVE_PATH,
    plan,
    networkingBoundary,
  });
}

function outputBytes(report) {
  return {
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderActivatedCurrentBoundMarkdown(report),
  };
}

async function assertPhysicalOutputParent(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath), `${label} path must be relative`);
  const resolvedRoot = path.resolve(root);
  const absolute = path.resolve(resolvedRoot, relativePath);
  invariant(isPathInside(resolvedRoot, absolute), `${label} escaped the project root`);
  const parent = path.dirname(absolute);
  const information = await lstat(parent);
  invariant(information.isDirectory() && !information.isSymbolicLink(), `${label} parent must be a physical directory`);
  invariant(await realpath(parent) === parent, `${label} parent must not traverse a symbolic link`);
  return {resolvedRoot, absolute};
}

function stableOutputMetadata(information) {
  return {
    dev: information.dev,
    ino: information.ino,
    mode: information.mode,
    nlink: information.nlink,
    uid: information.uid,
    gid: information.gid,
    size: information.size,
    mtimeMs: information.mtimeMs,
    ctimeMs: information.ctimeMs,
  };
}

async function inspectExclusiveOutput({root, relativePath, expected, label, allowAbsent}) {
  const {resolvedRoot, absolute} = await assertPhysicalOutputParent(root, relativePath, label);
  let before;
  try {
    before = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT" && allowAbsent) return {state: "absent", resolvedRoot, absolute};
    if (error?.code === "ENOENT") throw new Error(`${label} is missing: ${relativePath}`);
    throw error;
  }
  invariant(before.isFile() && !before.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  invariant(before.nlink === 1, `${label} must not be hard linked`);
  invariant((before.mode & 0o7777) === 0o444, `${label} must be mode 0444`);
  invariant(await realpath(absolute) === absolute, `${label} must not traverse a symbolic-link parent`);
  const current = await readFile(absolute, "utf8");
  invariant(current === expected, `${label} is stale; V2 reports are never overwritten or rebased`);
  const after = await lstat(absolute);
  assertDeepEqual(stableOutputMetadata(after), stableOutputMetadata(before), `${label} metadata changed during read-only verification`);
  return {state: "exact", resolvedRoot, absolute};
}

export async function verifyExactReadOnlyOutput({root, relativePath, expected, label = "V2 report"}) {
  return inspectExclusiveOutput({root, relativePath, expected, label, allowAbsent: false});
}

export async function writeExclusiveOrVerifyExact({root, relativePath, expected, label = "V2 report"}) {
  const inspected = await inspectExclusiveOutput({root, relativePath, expected, label, allowAbsent: true});
  if (inspected.state === "exact") return {created: false, path: relativePath};
  await writeFile(inspected.absolute, expected, {encoding: "utf8", flag: "wx", mode: 0o444});
  await verifyExactReadOnlyOutput({root, relativePath, expected, label});
  return {created: true, path: relativePath};
}

export async function writeExclusiveOutputSet({root, outputs}) {
  invariant(Array.isArray(outputs) && outputs.length > 0, "exclusive output set must not be empty");
  const paths = outputs.map(({relativePath}) => relativePath);
  invariant(new Set(paths).size === paths.length, "exclusive output paths must be unique");
  const inspections = [];
  for (const output of outputs) {
    inspections.push(await inspectExclusiveOutput({...output, root, allowAbsent: true}));
  }
  const results = [];
  for (let index = 0; index < outputs.length; index += 1) {
    const output = outputs[index];
    const inspected = inspections[index];
    if (inspected.state === "exact") {
      results.push({created: false, path: output.relativePath});
      continue;
    }
    await writeFile(inspected.absolute, output.expected, {encoding: "utf8", flag: "wx", mode: 0o444});
    await verifyExactReadOnlyOutput({...output, root});
    results.push({created: true, path: output.relativePath});
  }
  return results;
}

function usage() {
  return `Usage: node scripts/build-g4-l10-ruffle-activated-current-bound-index.mjs [--check]\n\nWithout arguments, validates the fixed mode-frozen L10 activated-Ruffle evidence, then exclusively creates missing V2 JSON/Markdown reports or verifies exact existing read-only bytes. It never overwrites or rebases a report. --check rebuilds expected bytes in memory and verifies exact report content/mode/metadata without writing.`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    invariant(args.every((arg) => ["--help", "-h"].includes(arg)), "--help cannot be combined with other arguments");
    console.log(usage());
    return;
  }
  invariant(args.every((arg) => arg === "--check") && args.length <= 1, "Only --check is supported");
  const check = args[0] === "--check";
  const report = await buildG4L10RuffleActivatedCurrentBoundIndex({root: projectRoot});
  const bytes = outputBytes(report);
  if (check) {
    await Promise.all([
      verifyExactReadOnlyOutput({root: projectRoot, relativePath: REPORT_JSON_RELATIVE_PATH, expected: bytes.json, label: "V2 JSON report"}),
      verifyExactReadOnlyOutput({root: projectRoot, relativePath: REPORT_MARKDOWN_RELATIVE_PATH, expected: bytes.markdown, label: "V2 Markdown report"}),
    ]);
    console.log(`PASS ${report.verification.probeReportCount}/${report.fixedScope.runCount}: fixed activated-Ruffle evidence closure V2 is exact and write-free`);
    return;
  }
  const results = await writeExclusiveOutputSet({
    root: projectRoot,
    outputs: [
      {relativePath: REPORT_JSON_RELATIVE_PATH, expected: bytes.json, label: "V2 JSON report"},
      {relativePath: REPORT_MARKDOWN_RELATIVE_PATH, expected: bytes.markdown, label: "V2 Markdown report"},
    ],
  });
  const created = results.filter((result) => result.created).length;
  console.log(`${created > 0 ? "WROTE" : "VERIFIED"} ${report.verification.probeReportCount}/${report.fixedScope.runCount}: fixed activated-Ruffle evidence closure V2 (${created} newly created report files)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
