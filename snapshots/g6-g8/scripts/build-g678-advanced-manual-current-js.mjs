#!/usr/bin/env node

/**
 * Build exactly the three G6-G8 behavior-heavy calibration candidates.
 *
 * FFDec Canvas/P-code extraction and the safe HELP_MATH_CANVAS_ASSETS runtime
 * stay in one create-exclusive ignored run. Tracked publication is limited to
 * three timelines, three private modules, and one advanced-3 fragment. This
 * script never edits the shared-13 generator/freeze, the registry, or a web
 * bridge, and it advances no audio, fidelity, review, strict, or release gate.
 */

import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
import ts from "typescript";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const GENERATOR_PATH =
  "scripts/build-g678-advanced-manual-current-js.mjs";
export const IR_PATH =
  "catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.ir.json";
export const OUTPUT_ROOT =
  "work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1";
export const FRAGMENT_PATH =
  "catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json";
export const RUN_ID = "g678-advanced-manual-current-js-3-v1";
export const CALIBRATION_ID = "g678-16-page-product-calibration-v1";
export const WRAPPER_PATH =
  "packages/demos/src/g678-advanced-manual/current-js-wrappers.tsx";
export const HOST_FEEDBACK_SELECTOR_PATH =
  "packages/demos/src/g678-advanced-manual/host-feedback-selector.ts";
export const PRODUCT_HOST_INPUT_PATHS = Object.freeze({
  animationRuntime: "apps/web/components/animation-runtime.tsx",
  contract: "packages/demos/src/contract.ts",
  runtime: "packages/demos/src/runtime.ts",
  feedbackSelector: HOST_FEEDBACK_SELECTOR_PATH,
  g3HostBinding:
    "migrations/course-g03-l01-ts-008/audit/host-function-binding.json",
  g4ProductBridge:
    "catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v31.json",
  g5HostActionScript:
    "migrations/course-g05-l13-rw-002/audit/original-host-entry/ffdec-scripts/frame_35/DoAction.as",
  g5HostContract:
    "migrations/course-g05-l13-rw-002/audit/original-host-entry-contract.json",
});
const HOST_INTERACTIVE_STOP_CONSUMER_IMPLEMENTED = true;
const HOST_SEEK_CONSUMER_IMPLEMENTED = true;
const HOST_FEEDBACK_SELECTOR_RECOVERED_PAGES = 2;
const PRODUCT_HOST_EVIDENCE_EXPECTED = Object.freeze({
  g3HostBinding: Object.freeze({bytes: 17761,
    sha256: "444b49203626ed196a59f77f9164158e47a450bb448d1f24bb40b7d3f13a068e"}),
  g4ProductBridge: Object.freeze({bytes: 23020,
    sha256: "7729ca9cc648c98148d29f1f19adf0ad46a5ce4cec622b6213348dc359cabbd2"}),
  g5HostActionScript: Object.freeze({bytes: 122477,
    sha256: "19a500653e0e71cb8c936373a709f13f6377e74f2d74c57e179a68710a8da08f"}),
  g5HostContract: Object.freeze({bytes: 35618,
    sha256: "433b34758c1e707da2bd5a10438ea1a35675e1a159d3d73bdc98440875ccbdbf"}),
});

const ASSET_REGISTRY = "HELP_MATH_CANVAS_ASSETS";
const SOURCE_ENVIRONMENT = "HELP_MATH_G678_SOURCE_ROOT";
const CANVAS_FORMATS = "frame:canvas,sprite:canvas,script:as";
const CANVAS_ITEMS = "frame,sprite,script,image,sound";
const SHA256 = /^[a-f0-9]{64}$/u;
const FFDEC_CRITICAL_ENVIRONMENT = Object.freeze([
  "FFDEC_JARFILENAME",
  "FFDEC_MEMORY",
  "FFDEC_STACK_SIZE",
  "JAVA_TOOL_OPTIONS",
  "JDK_JAVA_OPTIONS",
  "_JAVA_OPTIONS",
  "CLASSPATH",
]);

export const ACCEPTANCE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false,
  originalRuntimeAccepted: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

const STRUCTURAL_REPORT_ACCEPTANCE_KEYS = Object.freeze([
  "audioAccepted", "authoritativeOriginalRuntime", "avm1BehaviorCompiled",
  "behaviorAccepted", "canonicalSourcePromoted", "currentJavaScriptRegistered",
  "humanVisualAccepted", "legacyFlashCourseShellConverted",
  "modernCourseUiChanged", "modernMyLessonHostChanged",
  "nestedAudioPlaybackCompiled", "originalRuntimeAccepted", "ownerAccepted",
  "published", "released", "sourceCustodyChanged", "strictComplete",
  "visualFidelityAccepted",
]);

const FACTORY_ACCEPTANCE_KEYS = Object.freeze(
  STRUCTURAL_REPORT_ACCEPTANCE_KEYS.filter((key) =>
    key !== "authoritativeOriginalRuntime"),
);

function hasExactFalseKeys(value, expectedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) &&
    expected.every((key) => value[key] === false);
}

export function hasExactFalseAcceptanceEffects(value) {
  return hasExactFalseKeys(value, Object.keys(ACCEPTANCE_EFFECTS));
}

export const ADVANCED_PAGE_DEFINITIONS = Object.freeze([
  Object.freeze({
    animationId: "shared-geo001-l01-p001",
    adapterFamily: "advanced-manual-scrubber",
    behaviorFile:
      "packages/demos/src/g678-advanced-manual/geo001-l01-p001.ts",
    behaviorIrExport: "GEO001_L01_P001_BEHAVIOR_IR_V1",
    wrapperFactory: "createGeo001AdvancedManualCandidate",
    behaviorFrame: null,
    interactiveStop: null,
    interactiveSeek: Object.freeze({
      id: "geo-source-progress-seek",
      frameDomain: "sprite-142",
      minimumFrame: 1,
      maximumFrame: 127,
      terminalFrame: 127,
      resumeDisposition: "resume-only-when-nonterminal",
      requiresHostSeekConsumer: true,
      strictAcceptanceEffect: "none",
    }),
    sourceEvidence: Object.freeze({
      swfmillXml: Object.freeze({bytes: 768816,
        sha256: "b2f26495714ae1691260f439a3517520e7edc917ba6d4f58aa5126bc7aeaf466"}),
      ffdecDumpAs2: Object.freeze({bytes: 1983,
        sha256: "b0a0cd7b9bca7e307bd7689eff4e09d4b0eaaa4ca1e7fd4a8041d40606fd17a4"}),
      exportedScriptSet: Object.freeze({fileCount: 31, totalBytes: 28351,
        sha256: "014c909be81aa5e9977bc79070737dc4916afdbb9ee753025c0594eca471deb8"}),
    }),
    companionDomains: Object.freeze([
      Object.freeze({id: "sprite-11-progress-bar", frameCount: 2,
        label: "source progress-bar linkage (product range adapter active; source placement unresolved)"}),
    ]),
    remainingBlockers: Object.freeze([
      "source-media-controls-and-fui-linkage-placement-unproven",
      "embedded-audio-lifecycle-unaccepted",
      "spanish-source-behavior-unavailable",
      "original-runtime-and-fidelity-unaccepted",
    ]),
  }),
  Object.freeze({
    animationId: "shared-nms002-l11-p030",
    adapterFamily: "advanced-manual-choice-quiz",
    behaviorFile:
      "packages/demos/src/g678-advanced-manual/nms002-l11-p030.ts",
    behaviorIrExport: "NMS002_L11_P030_BEHAVIOR_IR_V1",
    wrapperFactory: "createNms002AdvancedManualCandidate",
    behaviorFrame: 97,
    interactiveSeek: null,
    interactiveStop: Object.freeze({
      id: "nms-question-frame-97",
      frameDomain: "sprite-260",
      stopFrame: 97,
      resumeFrame: 98,
      resolution: "explicit-source-feedback-finished",
      completionDisposition: "blocked-while-unresolved",
      requiresHostInteractiveStop: true,
      strictAcceptanceEffect: "none",
    }),
    sourceEvidence: Object.freeze({
      swfmillXml: Object.freeze({bytes: 2634776,
        sha256: "045d11790a0d604e6617d8aea5188b12edd0305c675d86be72d3912fd589a0c1"}),
      ffdecDumpAs2: Object.freeze({bytes: 2452,
        sha256: "07fb8ed722e3a16a716821587c771888a98acf36ff98b476e2762eb30006769b"}),
      exportedScriptSet: Object.freeze({fileCount: 52, totalBytes: 4396,
        sha256: "a8a8b3b0e887e7202063afe6a0fb1856ef0db489f9e216c08734813524a8fc17"}),
    }),
    companionDomains: Object.freeze([
      Object.freeze({id: "sprite-124", frameCount: 30, label: "Mc_Wrong_Feed1 audio domain (blocked)"}),
      Object.freeze({id: "sprite-112", frameCount: 30, label: "Mc_Wrong_Feed2 audio domain (blocked)"}),
      Object.freeze({id: "sprite-101", frameCount: 30, label: "Mc_Wrong_Feed3 audio domain (blocked)"}),
      Object.freeze({id: "sprite-90", frameCount: 30, label: "Mc_Wrong_Feed4 audio domain (blocked)"}),
      Object.freeze({id: "sprite-215", frameCount: 27, label: "Mc_Right_Feed1 audio domain (blocked)"}),
      Object.freeze({id: "sprite-150", frameCount: 31, label: "Mc_Right_Feed2 audio domain (blocked)"}),
      Object.freeze({id: "sprite-251", frameCount: 28, label: "Mc_Right_Feed3 audio domain (blocked)"}),
      Object.freeze({id: "sprite-223", frameCount: 27, label: "Mc_Right_Feed4 audio domain (blocked)"}),
      Object.freeze({id: "sprite-182", frameCount: 25, label: "Mc_Right_Feed5 audio domain (blocked)"}),
    ]),
    remainingBlockers: Object.freeze([
      "adobe-random-state-parity-unaccepted",
      "hint-host-content-not-reconstructed",
      "nine-feedback-audio-domains-unaccepted",
      "spanish-source-behavior-unavailable",
      "original-runtime-and-fidelity-unaccepted",
    ]),
  }),
  Object.freeze({
    animationId: "shared-dat001-l05-p040",
    adapterFamily: "advanced-manual-drag-drop-quiz",
    behaviorFile:
      "packages/demos/src/g678-advanced-manual/dat001-l05-p040.ts",
    behaviorIrExport: "DAT001_L05_P040_BEHAVIOR_IR_V1",
    wrapperFactory: "createDat001AdvancedManualCandidate",
    behaviorFrame: 238,
    interactiveSeek: null,
    interactiveStop: Object.freeze({
      id: "dat-drag-set-frame-238",
      frameDomain: "sprite-315",
      stopFrame: 238,
      resumeFrame: 239,
      resolution: "explicit-source-drag-set-finished",
      completionDisposition: "blocked-while-unresolved",
      requiresHostInteractiveStop: true,
      strictAcceptanceEffect: "none",
    }),
    sourceEvidence: Object.freeze({
      swfmillXml: Object.freeze({bytes: 3346592,
        sha256: "ebf346560c6171d0f8de674c0071ab94256ec0cee360adfb4e79b428ffe546f9"}),
      ffdecDumpAs2: Object.freeze({bytes: 4079,
        sha256: "0a45c742da480066c5590ad3d3fdedae6941a7e13dc7a4fee5b1f1fda9792f5e"}),
      exportedScriptSet: Object.freeze({fileCount: 71, totalBytes: 6507,
        sha256: "da27a1054d768c24197d754678a9b1655110fea52de051a470085bc75ad0c2f9"}),
    }),
    companionDomains: Object.freeze([
      Object.freeze({id: "sprite-202", frameCount: 28, label: "Mc_Wrong_Feed1 audio domain (blocked)"}),
      Object.freeze({id: "sprite-214", frameCount: 29, label: "Mc_Wrong_Feed2 audio domain (blocked)"}),
      Object.freeze({id: "sprite-226", frameCount: 28, label: "Mc_Wrong_Feed3 audio domain (blocked)"}),
      Object.freeze({id: "sprite-314", frameCount: 33, label: "Mc_Right_Feed1 audio domain (blocked)"}),
      Object.freeze({id: "sprite-258", frameCount: 25, label: "Mc_Right_Feed2 audio domain (blocked)"}),
      Object.freeze({id: "sprite-294", frameCount: 28, label: "Mc_Right_Feed3 audio domain (blocked)"}),
      Object.freeze({id: "sprite-266", frameCount: 27, label: "Mc_Right_Feed4 audio domain (blocked)"}),
    ]),
    remainingBlockers: Object.freeze([
      "adobe-random-state-parity-unaccepted",
      "replay-quiztrycount-reset-is-modern-product-assumption",
      "seven-feedback-audio-domains-unaccepted",
      "source-reset-references-unplaced-mc-wrong-feed4",
      "spanish-source-behavior-unavailable",
      "original-runtime-and-fidelity-unaccepted",
    ]),
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonBytes(value) {
  return Buffer.from(stableJson(value));
}

export function canonicalExportedScriptProjection(files) {
  const rows = files.map((file) => Object.freeze({
    bytes: file.bytes,
    path: file.path,
    sha256: file.sha256,
  }));
  invariant(rows.every((row) => Number.isSafeInteger(row.bytes) &&
    row.bytes >= 0 && typeof row.path === "string" && row.path.length > 0 &&
    SHA256.test(row.sha256)),
  "exported script projection contains an invalid row");
  invariant(rows.every((row, index) => index === 0 ||
    rows[index - 1].path.localeCompare(row.path) < 0),
  "exported script projection must be path-sorted and unique");
  const bytes = Buffer.from(`${JSON.stringify(rows)}\n`);
  return Object.freeze({fileCount: rows.length,
    totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    bytes: bytes.length, sha256: sha256(bytes)});
}

function propertyAssignment(object, name) {
  return object.properties.find((property) =>
    ts.isPropertyAssignment(property) &&
    ((ts.isIdentifier(property.name) && property.name.text === name) ||
      (ts.isStringLiteral(property.name) && property.name.text === name)));
}

function unwrapTsExpression(expression) {
  let current = expression;
  while (ts.isAsExpression(current) || ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current)) {
    current = current.expression;
  }
  return current;
}

function literalString(property) {
  if (!property) return null;
  const value = unwrapTsExpression(property.initializer);
  return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)
    ? value.text : null;
}

function literalNumber(property) {
  if (!property) return null;
  const value = unwrapTsExpression(property.initializer);
  return ts.isNumericLiteral(value)
    ? Number(value.getText().replaceAll("_", "")) : null;
}

export function extractBehaviorScriptClaims(sourceText, sourcePath) {
  const source = ts.createSourceFile(sourcePath, sourceText,
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const claims = [];
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const pathValue = literalString(propertyAssignment(node, "path"));
      const bytes = literalNumber(propertyAssignment(node, "bytes"));
      const digest = literalString(propertyAssignment(node, "sha256"));
      if (pathValue?.startsWith("scripts/") && Number.isSafeInteger(bytes) &&
        bytes >= 0 && digest && SHA256.test(digest)) {
        claims.push(Object.freeze({path: pathValue, bytes, sha256: digest}));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  claims.sort((left, right) => left.path.localeCompare(right.path));
  invariant(new Set(claims.map(({path}) => path)).size === claims.length,
    `${sourcePath}: behavior script claims are duplicated`);
  return Object.freeze(claims);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function canonicalSourceRelativePath(value, label) {
  invariant(typeof value === "string" && value.length > 0 &&
    !path.isAbsolute(value) && !value.includes("\\") &&
    !value.includes("\0"), `${label} is not a canonical relative path`);
  const segments = value.split("/");
  invariant(segments.every((segment) => segment.length > 0 &&
    segment !== "." && segment !== "..") &&
    path.posix.normalize(value) === value,
  `${label} contains a noncanonical segment`);
  return Object.freeze(segments);
}

function rootPath(root, relativePath, label = "path") {
  invariant(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), `${label} must be root-relative`);
  const absolute = path.resolve(root, relativePath);
  invariant(absolute.startsWith(`${path.resolve(root)}${path.sep}`),
    `${label} escapes its root`);
  return absolute;
}

function projectPath(relativePath, label = "project path") {
  return rootPath(PROJECT_ROOT, relativePath, label);
}

async function exists(absolute) {
  return lstat(absolute).then(() => true, (error) => {
    if (error?.code === "ENOENT") return false;
    throw error;
  });
}

async function fileBinding(relativePath, {
  root = PROJECT_ROOT,
  parseJson = false,
  includeBuffer = false,
} = {}) {
  const absolute = rootPath(root, relativePath, relativePath);
  const resolvedBefore = await realpath(absolute);
  const before = await lstat(absolute, {bigint: true});
  invariant(resolvedBefore === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary single-link file`);
  const bytes = await readFile(absolute);
  const resolvedAfter = await realpath(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(resolvedAfter === absolute && after.isFile() &&
    !after.isSymbolicLink() && after.nlink === 1n &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode,
  `${relativePath} changed while it was read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes),
    ...(parseJson ? {value: JSON.parse(bytes.toString("utf8"))} : {}),
    ...(includeBuffer ? {buffer: bytes} : {})});
}

async function readJsonBinding(relativePath) {
  return fileBinding(relativePath, {parseJson: true});
}

function exactBinding(actual, expected, label) {
  invariant(actual.path === expected.path && actual.bytes === expected.bytes &&
    actual.sha256 === expected.sha256, `${label} binding drifted`);
}

export function parseArguments(argv) {
  invariant(argv.length <= 1 && [undefined, "--check"].includes(argv[0]),
    `usage: node ${GENERATOR_PATH} [--check]`);
  return Object.freeze({check: argv[0] === "--check"});
}

async function walkFiles(root, current = root, rows = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `output contains a symlink: ${absolute}`);
    if (metadata.isDirectory()) await walkFiles(root, absolute, rows);
    else {
      invariant(metadata.isFile() && metadata.nlink === 1,
        `output is not a single-link regular file: ${absolute}`);
      const bytes = await readFile(absolute);
      rows.push(Object.freeze({path: portable(path.relative(root, absolute)),
        bytes: bytes.length, sha256: sha256(bytes),
        mode: metadata.mode & 0o777}));
    }
  }
  return rows;
}

async function directoryInventory(root) {
  const files = await walkFiles(root);
  const checksumRows = files.map((file) =>
    `${file.sha256}  ${file.path}\n`).join("");
  return Object.freeze({fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    checksumSetSha256: sha256(checksumRows), files: Object.freeze(files)});
}

export async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `cannot freeze a symlink: ${absolute}`);
    if (metadata.isDirectory()) await freezeTree(absolute);
    else {
      invariant(metadata.isFile() && metadata.nlink === 1,
        `cannot freeze non-regular or linked output: ${absolute}`);
      await chmod(absolute, 0o444);
    }
  }
  await chmod(root, 0o555);
}

export async function verifyFrozenTree(root) {
  const metadata = await lstat(root);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    (metadata.mode & 0o777) === 0o555,
  `directory is not a real mode-0555 directory: ${root}`);
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const child = await lstat(absolute);
    invariant(!child.isSymbolicLink(), `frozen tree contains symlink: ${absolute}`);
    if (child.isDirectory()) await verifyFrozenTree(absolute);
    else invariant(child.isFile() && child.nlink === 1 &&
      (child.mode & 0o777) === 0o444,
    `frozen file is not mode-0444/single-link: ${absolute}`);
  }
}

function redactArg(value, source, output, redactions = []) {
  if (value === source) return "<SOURCE_SWF>";
  if (value === output) return "<OUTPUT_DIRECTORY>";
  const explicit = redactions.find(([actual]) => value === actual);
  if (explicit) return explicit[1];
  return value;
}

async function runCommand({command, args, cwd, logStem, source, output,
  redactions = []}) {
  const child = spawn(command, args, {cwd, env: process.env,
    stdio: ["ignore", "pipe", "pipe"]});
  const stdout = [];
  const stderr = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  const maximum = 32 * 1024 * 1024;
  child.stdout.on("data", (chunk) => {
    stdoutBytes += chunk.length;
    if (stdoutBytes <= maximum) stdout.push(chunk);
    else child.kill("SIGTERM");
  });
  child.stderr.on("data", (chunk) => {
    stderrBytes += chunk.length;
    if (stderrBytes <= maximum) stderr.push(chunk);
    else child.kill("SIGTERM");
  });
  const timeout = setTimeout(() => child.kill("SIGTERM"), 660_000);
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({code, signal}));
  });
  clearTimeout(timeout);
  const stdoutBuffer = Buffer.concat(stdout);
  const stderrBuffer = Buffer.concat(stderr);
  await Promise.all([
    writeFile(`${logStem}.stdout.txt`, stdoutBuffer, {flag: "wx"}),
    writeFile(`${logStem}.stderr.txt`, stderrBuffer, {flag: "wx"}),
  ]);
  invariant(result.code === 0 && result.signal === null &&
    stdoutBytes <= maximum && stderrBytes <= maximum,
  `${command} failed with code=${result.code} signal=${result.signal}`);
  return Object.freeze({
    descriptor: Object.freeze({command,
      args: Object.freeze(args.map((value) =>
        redactArg(value, source, output, redactions))),
      exitCode: result.code,
      stdout: Object.freeze({bytes: stdoutBuffer.length,
        sha256: sha256(stdoutBuffer)}),
      stderr: Object.freeze({bytes: stderrBuffer.length,
        sha256: sha256(stderrBuffer)})}),
    stdoutText: stdoutBuffer.toString("utf8"),
  });
}

async function captureProcess({command, args, cwd, environment, input}) {
  const child = spawn(command, args, {cwd, env: environment,
    stdio: [input ? "pipe" : "ignore", "pipe", "pipe"]});
  const stdout = [];
  const stderr = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  const maximum = 32 * 1024 * 1024;
  child.stdout.on("data", (chunk) => {
    stdoutBytes += chunk.length;
    if (stdoutBytes <= maximum) stdout.push(chunk);
    else child.kill("SIGTERM");
  });
  child.stderr.on("data", (chunk) => {
    stderrBytes += chunk.length;
    if (stderrBytes <= maximum) stderr.push(chunk);
    else child.kill("SIGTERM");
  });
  if (input) child.stdin.end(input);
  const timeout = setTimeout(() => child.kill("SIGTERM"), 660_000);
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({code, signal}));
  });
  clearTimeout(timeout);
  invariant(stdoutBytes <= maximum && stderrBytes <= maximum,
    `${command}: toolchain probe output exceeded its limit`);
  return Object.freeze({code: result.code, signal: result.signal,
    stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)});
}

async function absoluteOrdinaryFileBinding(absolute, label, {
  requireSingleLink = true,
} = {}) {
  const resolved = await realpath(absolute);
  const before = await lstat(resolved, {bigint: true});
  invariant(resolved === path.resolve(resolved) && before.isFile() &&
    !before.isSymbolicLink() && before.nlink >= 1n &&
    (!requireSingleLink || before.nlink === 1n),
  `${label} must resolve to one canonical ordinary file`);
  const bytes = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(after.isFile() && !after.isSymbolicLink() &&
    after.nlink === before.nlink &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode,
  `${label} changed while it was read`);
  return Object.freeze({realPath: resolved, bytes: bytes.length,
    sha256: sha256(bytes), mode: Number(after.mode & 0o777n),
    nlink: Number(after.nlink)});
}

async function stableAbsoluteBuffer(absolute, label, {
  requireSingleLink = true,
} = {}) {
  const canonical = path.resolve(absolute);
  const resolvedBefore = await realpath(canonical);
  const before = await lstat(canonical, {bigint: true});
  invariant(resolvedBefore === canonical && before.isFile() &&
    !before.isSymbolicLink() && before.nlink >= 1n &&
    (!requireSingleLink || before.nlink === 1n),
  `${label} must be one canonical ordinary file`);
  const buffer = await readFile(canonical);
  const resolvedAfter = await realpath(canonical);
  const after = await lstat(canonical, {bigint: true});
  invariant(resolvedAfter === canonical && after.isFile() &&
    !after.isSymbolicLink() && before.dev === after.dev &&
    before.ino === after.ino && before.size === after.size &&
    before.mtimeNs === after.mtimeNs && before.mode === after.mode &&
    before.nlink === after.nlink && BigInt(buffer.length) === after.size,
  `${label} changed while it was read`);
  return Object.freeze({buffer, bytes: buffer.length, sha256: sha256(buffer),
    identity: Object.freeze({realPath: canonical, device: String(after.dev),
      inode: String(after.ino), size: String(after.size),
      mtimeNs: String(after.mtimeNs), mode: Number(after.mode & 0o777n),
      nlink: Number(after.nlink)})});
}

async function resolvePathExecutable(name) {
  invariant(!name.includes(path.sep), "PATH executable name is invalid");
  for (const entry of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!entry) continue;
    const requestedPath = path.join(entry, name);
    try {
      const resolved = await realpath(requestedPath);
      const metadata = await lstat(resolved);
      if (metadata.isFile() && (metadata.mode & 0o111) !== 0) {
        return Object.freeze({requestedPath,
          requestedPathKind: (await lstat(requestedPath)).isSymbolicLink()
            ? "symlink-to-verified-executable" : "ordinary-file",
          binding: await absoluteOrdinaryFileBinding(resolved,
            `${name} PATH executable`)});
      }
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "EACCES") throw error;
    }
  }
  throw new Error(`${name} is not one executable ordinary file on PATH`);
}

function manifestClassPath(manifestBytes) {
  const physical = manifestBytes.toString("utf8")
    .replace(/\r\n?/gu, "\n").split("\n");
  const logical = [];
  for (const line of physical) {
    if (line.startsWith(" ") && logical.length > 0) {
      logical[logical.length - 1] += line.slice(1);
    } else {
      logical.push(line);
    }
  }
  const declaration = logical.find((line) => line.startsWith("Class-Path: "));
  invariant(declaration, "FFDec JAR manifest Class-Path is missing");
  const entries = declaration.slice("Class-Path: ".length).trim()
    .split(/\s+/u).filter(Boolean).sort();
  invariant(entries.length > 0 && new Set(entries).size === entries.length,
    "FFDec JAR manifest Class-Path is empty or duplicated");
  return Object.freeze(entries);
}

async function verifyFfdecToolchain({requestedCommand, probeSourceBuffer}) {
  invariant(path.isAbsolute(requestedCommand),
    "FFDec requested command must be absolute");
  const requestedMetadata = await lstat(requestedCommand);
  invariant(requestedMetadata.isSymbolicLink() || requestedMetadata.isFile(),
    "FFDec requested command is neither a symlink nor an ordinary file");
  const criticalEnvironment = Object.fromEntries(
    FFDEC_CRITICAL_ENVIRONMENT.map((name) =>
      [name, process.env[name] ?? null]),
  );
  invariant(Object.values(criticalEnvironment).every((value) => value === null),
    "critical FFDec and Java environment overrides must be absent");

  const launcher = await absoluteOrdinaryFileBinding(requestedCommand,
    "FFDec launcher");
  const jarRequestedPath = path.join(path.dirname(launcher.realPath),
    "ffdec.jar");
  const jar = await absoluteOrdinaryFileBinding(jarRequestedPath,
    "FFDec JAR");
  const unzipRequestedPath = "/usr/bin/unzip";
  const unzip = await absoluteOrdinaryFileBinding(unzipRequestedPath,
    "FFDec manifest extractor", {requireSingleLink: false});
  const manifestResult = await captureProcess({command: unzip.realPath,
    args: ["-p", jar.realPath, "META-INF/MANIFEST.MF"], cwd: PROJECT_ROOT,
    environment: process.env});
  invariant(manifestResult.code === 0 && manifestResult.signal === null &&
    manifestResult.stdout.length > 0 && manifestResult.stderr.length === 0,
  "FFDec JAR manifest extraction failed");
  const classPathEntries = manifestClassPath(manifestResult.stdout);
  const jarDirectory = path.dirname(jar.realPath);
  const classPath = [];
  for (const entry of classPathEntries) {
    invariant(!path.isAbsolute(entry) && !entry.includes(":") &&
      !entry.split("/").includes(".."),
    `FFDec JAR Class-Path entry is unsafe: ${entry}`);
    const absolute = path.resolve(jarDirectory, entry);
    invariant(absolute.startsWith(`${jarDirectory}${path.sep}`),
      `FFDec JAR Class-Path entry escapes its root: ${entry}`);
    classPath.push(Object.freeze({entry,
      ...await absoluteOrdinaryFileBinding(absolute,
        `FFDec JAR Class-Path ${entry}`)}));
  }

  const javaExecutable = await resolvePathExecutable("java");
  const prefixArgs = Object.freeze([
    "-Djava.net.preferIPv4Stack=true",
    "-Djna.nosys=true",
    "-Djava.util.Arrays.useLegacyMergeSort=true",
    "-Xmx1024m",
    "-jar",
    jar.realPath,
  ]);
  const invocationContracts = Object.freeze({
    canvas: Object.freeze(["-config", "packJavaScripts=false", "-onerror",
      "abort", "-timeout", "120", "-exportTimeout", "600", "-format",
      CANVAS_FORMATS, "-export", CANVAS_ITEMS, "<OUTPUT_DIRECTORY>",
      "<SOURCE_SWF>"]),
    pcode: Object.freeze(["-config", "packJavaScripts=false", "-onerror",
      "abort", "-timeout", "120", "-exportTimeout", "600", "-format",
      "script:pcode", "-export", "script", "<OUTPUT_DIRECTORY>",
      "<SOURCE_SWF>"]),
    versionProbe: Object.freeze(["-config", "packJavaScripts=false",
      "-onerror", "abort", "-timeout", "120", "-exportTimeout", "600",
      "-format", "script:as", "-export", "script",
      "<TEMP_OUTPUT_DIRECTORY>", "<SOURCE_SWF>"]),
  });
  const javaVersion = await captureProcess({
    command: javaExecutable.binding.realPath, args: ["-version"],
    cwd: PROJECT_ROOT, environment: process.env,
  });
  invariant(javaVersion.code === 0 && javaVersion.signal === null &&
    javaVersion.stdout.length + javaVersion.stderr.length > 0,
  "effective Java version probe failed");

  invariant(Buffer.isBuffer(probeSourceBuffer) && probeSourceBuffer.length > 0,
    "FFDec probe requires one verified source buffer");
  const probeRoot = await realpath(await mkdtemp(path.join(os.tmpdir(),
    "help-math-g678-ffdec-version-")));
  try {
    const inputRoot = path.join(probeRoot, "input");
    const output = path.join(probeRoot, "scripts");
    await Promise.all([mkdir(inputRoot), mkdir(output)]);
    const stagedProbeSource = path.join(inputRoot, "source.swf");
    await writeFile(stagedProbeSource, probeSourceBuffer,
      {flag: "wx", mode: 0o444});
    await Promise.all([chmod(stagedProbeSource, 0o444),
      chmod(inputRoot, 0o555)]);
    const probeSourceRead = await stableAbsoluteBuffer(stagedProbeSource,
      "FFDec version-probe staged SWF");
    invariant(probeSourceRead.buffer.equals(probeSourceBuffer) &&
      probeSourceRead.identity.mode === 0o444 &&
      probeSourceRead.identity.nlink === 1,
    "FFDec version-probe staged SWF binding drifted");
    const toolArgs = invocationContracts.versionProbe.map((value) =>
      value === "<TEMP_OUTPUT_DIRECTORY>" ? output
        : value === "<SOURCE_SWF>" ? stagedProbeSource : value);
    const observed = await captureProcess({
      command: javaExecutable.binding.realPath,
      args: [...prefixArgs, ...toolArgs], cwd: PROJECT_ROOT,
      environment: process.env,
    });
    invariant(observed.code === 0 && observed.signal === null &&
      observed.stderr.length === 0,
    "FFDec direct-Java version probe failed");
    const probeSourceAfter = await stableAbsoluteBuffer(stagedProbeSource,
      "FFDec version-probe staged SWF after execution");
    invariant(probeSourceAfter.buffer.equals(probeSourceBuffer) &&
      JSON.stringify(probeSourceAfter.identity) ===
        JSON.stringify(probeSourceRead.identity),
    "FFDec version-probe staged SWF changed during execution");
    const banner = observed.stdout.toString("utf8")
      .replace(/\r\n?/gu, "\n").split("\n")
      .map((line) => line.trim())
      .find((line) => /^JPEXS Free Flash Decompiler v\./u.test(line)) ?? "";
    invariant(/^JPEXS Free Flash Decompiler v\.[0-9]+(?:\.[0-9]+)+$/u
      .test(banner),
    `FFDec version probe banner is invalid: ${JSON.stringify(banner)}`);
    const bannerBytes = Buffer.from(`${banner}\n`);
    const outputBinding = (result) => Object.freeze({exitCode: result.code,
      stdoutBytes: result.stdout.length, stdoutSha256: sha256(result.stdout),
      stderrBytes: result.stderr.length, stderrSha256: sha256(result.stderr),
      versionTextSha256: sha256(Buffer.concat([result.stdout, result.stderr]))});
    const identity = Object.freeze({
      requestedCommand,
      requestedCommandKind: requestedMetadata.isSymbolicLink()
        ? "symlink-to-verified-launcher" : "ordinary-file",
      execution: "direct-bound-java",
      launcher,
      jar: Object.freeze({requestedPath: jarRequestedPath, ...jar}),
      jarManifest: Object.freeze({bytes: manifestResult.stdout.length,
        sha256: sha256(manifestResult.stdout),
        extractor: Object.freeze({requestedPath: unzipRequestedPath,
          ...unzip, argv: Object.freeze(["-p", "<BOUND_FFDEC_JAR>",
            "META-INF/MANIFEST.MF"]), exitCode: manifestResult.code,
          stderrBytes: manifestResult.stderr.length,
          stderrSha256: sha256(manifestResult.stderr)}),
        classPath: Object.freeze(classPath),
        classPathChecksumSetSha256: sha256(Buffer.from(classPath.map((entry) =>
          `${entry.sha256}  ${entry.entry}\n`).join("")))}),
      java: Object.freeze({requestedPath: javaExecutable.requestedPath,
        requestedPathKind: javaExecutable.requestedPathKind,
        ...javaExecutable.binding,
        versionOutput: outputBinding(javaVersion)}),
      versionOutput: Object.freeze({text: banner, bytes: bannerBytes.length,
        sha256: sha256(bannerBytes), exitCode: observed.code,
        stderrBytes: observed.stderr.length,
        stderrSha256: sha256(observed.stderr)}),
      argv: invocationContracts,
      environment: Object.freeze({
        inheritance:
          "current-process-with-critical-ffdec-java-overrides-required-absent",
        criticalVariables: Object.freeze(criticalEnvironment),
        pathSha256: sha256(process.env.PATH ?? ""),
        javaHomeSha256: sha256(process.env.JAVA_HOME ?? ""),
        lang: process.env.LANG ?? null,
        lcAll: process.env.LC_ALL ?? null,
        lcCtype: process.env.LC_CTYPE ?? null,
        timezone: process.env.TZ ?? null,
      }),
      invocation: Object.freeze({command: "<BOUND_JAVA_EXECUTABLE>",
        prefixArgs: Object.freeze(prefixArgs.map((value) =>
          value === jar.realPath ? "<BOUND_FFDEC_JAR>" : value))}),
    });
    return Object.freeze({requestedCommand,
      command: javaExecutable.binding.realPath, prefixArgs, identity,
      argv: invocationContracts});
  } finally {
    await chmod(path.join(probeRoot, "input"), 0o755).catch(() => {});
    await rm(probeRoot, {recursive: true, force: true});
  }
}

function definitionById(animationId) {
  return ADVANCED_PAGE_DEFINITIONS.find((entry) =>
    entry.animationId === animationId);
}

function catalogPages(catalog) {
  const pages = new Map();
  for (const lesson of catalog.lessons ?? []) {
    for (const page of lesson.pages ?? []) {
      pages.set(page.animationId, Object.freeze({page, lesson}));
    }
  }
  return pages;
}

async function resolveSourceRoot(ir) {
  invariant(ir.sourceRoot?.relativeRoot === "G6-G8-shared" &&
    ir.sourceRoot.requireReadOnlySources === true &&
    ir.sourceRoot.trackedSourceBytes === false,
  "calibration IR must require external read-only G6-G8-shared sources");
  const supplied = process.env[SOURCE_ENVIRONMENT];
  invariant(typeof supplied === "string" && supplied.trim().length > 0,
    `${SOURCE_ENVIRONMENT} is required`);
  const absolute = path.resolve(supplied);
  const resolved = await realpath(absolute);
  invariant(resolved === absolute && absolute === ir.sourceRoot.configuredRoot,
    `${SOURCE_ENVIRONMENT} must be the exact reviewed source root`);
  const metadata = await lstat(absolute);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    (metadata.mode & 0o222) === 0,
  `${SOURCE_ENVIRONMENT} must name one real read-only directory`);
  const sharedAbsolute = path.join(absolute, ir.sourceRoot.relativeRoot);
  const sharedResolved = await realpath(sharedAbsolute);
  const sharedMetadata = await lstat(sharedAbsolute);
  invariant(sharedResolved === sharedAbsolute && sharedMetadata.isDirectory() &&
    !sharedMetadata.isSymbolicLink() && (sharedMetadata.mode & 0o222) === 0,
  "G6-G8-shared containment anchor must be one real read-only directory");
  return Object.freeze({absolute, token: SOURCE_ENVIRONMENT,
    sharedAbsolute,
    identity: Object.freeze({realPathSha256: sha256(resolved),
      device: String(metadata.dev), inode: String(metadata.ino),
      mode: metadata.mode & 0o777,
      sharedRoot: Object.freeze({realPathSha256: sha256(sharedResolved),
        device: String(sharedMetadata.dev), inode: String(sharedMetadata.ino),
        mode: sharedMetadata.mode & 0o777})})});
}

async function loadContext() {
  const irBinding = await readJsonBinding(IR_PATH);
  const inputBindings = {};
  const inputValues = {};
  for (const [key, expected] of Object.entries(irBinding.value.inputs ?? {})) {
    const current = expected.path.endsWith(".json")
      ? await readJsonBinding(expected.path)
      : await fileBinding(expected.path);
    exactBinding(current, expected, `IR input ${key}`);
    inputBindings[key] = Object.freeze({path: current.path,
      bytes: current.bytes, sha256: current.sha256});
    if ("value" in current) inputValues[key] = current.value;
  }
  const [wrapperBinding, generatorBinding] =
    await Promise.all([
      fileBinding(WRAPPER_PATH),
      fileBinding(GENERATOR_PATH),
    ]);
  const productHostBindings = {};
  const productHostValues = {};
  for (const [key, relativePath] of Object.entries(PRODUCT_HOST_INPUT_PATHS)) {
    const binding = await fileBinding(relativePath, {includeBuffer: true});
    const expected = PRODUCT_HOST_EVIDENCE_EXPECTED[key];
    if (expected) {
      invariant(binding.bytes === expected.bytes &&
        binding.sha256 === expected.sha256,
      `product-host evidence drifted: ${key}`);
    }
    productHostBindings[key] = Object.freeze({path: binding.path,
      bytes: binding.bytes, sha256: binding.sha256});
    productHostValues[key] = relativePath.endsWith(".json")
      ? JSON.parse(binding.buffer.toString("utf8"))
      : binding.buffer.toString("utf8");
  }
  const g3Host = productHostValues.g3HostBinding;
  const g4Host = productHostValues.g4ProductBridge;
  const g5Host = productHostValues.g5HostActionScript;
  invariant(
    g3Host?.sourceContracts?.wrongAnswer?.feedbackVariantCount === 3 &&
      g3Host?.sourceContracts?.wrongAnswer?.randomExpression ===
        "random(3) + 1" &&
      g3Host?.sourceContracts?.correctAnswer?.feedbackVariantCount === 4 &&
      g3Host?.sourceContracts?.correctAnswer?.randomExpression ===
        "random(4) + 1" &&
      g4Host?.selectedPage?.randomBranchGate?.wrongBranches?.length === 3 &&
      g4Host?.selectedPage?.randomBranchGate?.rightBranches?.length === 4 &&
      g4Host?.selectedPage?.randomBranchGate?.authoritativeAdobeRandomStateAccepted === false &&
      /function showWrongFeed\(\)[\s\S]*?random\(3\)[\s\S]*?Mc_Wrong_Feed/u.test(g5Host) &&
      /function showRightFeed\(\)[\s\S]*?random\(4\)[\s\S]*?Mc_Right_Feed/u.test(g5Host) &&
      productHostValues.feedbackSelector.includes(
        "unsigned page seed modulo exact source cardinality") &&
      productHostValues.animationRuntime.includes(
        "resolveInteractiveStopResolutionPolicy") &&
      productHostValues.animationRuntime.includes(
        "hostSeekConsumerImplemented: true") &&
      productHostValues.contract.includes(
        "AnimationInteractiveStopResolutionIntent") &&
      productHostValues.runtime.includes(
        "resolveInteractiveStopResolutionPolicy"),
    "maintained product-host stop/seek/feedback contract is incomplete",
  );
  const report = inputValues.structuralReport;
  const factory = inputValues.structuralFactoryRun;
  const catalog = inputValues.sharedCatalog;
  invariant(report.status === "structural-audit-only" &&
    hasExactFalseKeys(report.acceptanceEffects,
      STRUCTURAL_REPORT_ACCEPTANCE_KEYS),
  "structural report crossed an acceptance boundary");
  invariant(factory.manifestKind === "FactoryRunManifestV2" &&
    factory.mode === "calibrate" &&
    hasExactFalseKeys(factory.acceptanceEffects, FACTORY_ACCEPTANCE_KEYS),
  "structural factory run crossed an acceptance boundary");
  const advanced = (irBinding.value.placements ?? []).filter((placement) =>
    placement.implementationDisposition === "advanced-manual");
  invariant(advanced.length === 3 &&
    JSON.stringify(advanced.map(({animationId}) => animationId).sort()) ===
      JSON.stringify(ADVANCED_PAGE_DEFINITIONS.map(({animationId}) =>
        animationId).sort()),
  "advanced-manual three-page membership drifted");
  const reportMap = new Map((report.placements ?? []).map((entry) =>
    [entry.placementId, entry]));
  const catalogMap = catalogPages(catalog);
  const behaviorBindings = {};
  const behaviorScriptClaimCrosswalk = {};
  const expectedClaimCounts = Object.freeze({
    "shared-geo001-l01-p001": 7,
    "shared-nms002-l11-p030": 8,
    "shared-dat001-l05-p040": 2,
  });
  for (const placement of advanced) {
    const definition = definitionById(placement.animationId);
    const observed = reportMap.get(placement.animationId);
    const catalogRecord = catalogMap.get(placement.animationId)?.page;
    invariant(definition && placement.reviewedLane === "behavior-heavy" &&
      placement.adapterFamily === definition.adapterFamily &&
      SHA256.test(placement.sourceSha256) &&
      observed?.source?.sha256 === placement.sourceSha256 &&
      observed.source.sourceRelativePath === placement.sourceRelativePath &&
      observed.structural.ffdecHeader.frameCount === placement.rootFrameCount &&
      observed.structural.ffdecHeader.frameRate === 12 &&
      observed.structural.ffdecHeader.widthPx === 800 &&
      observed.structural.ffdecHeader.heightPx === 600 &&
      observed.structural.swfmill.nestedSprites.some((sprite) =>
        sprite.objectId === placement.mainChild.objectId &&
        sprite.frameCount === placement.mainChild.frameCount) &&
      catalogRecord?.sourceSha256 === placement.sourceSha256,
    `${placement.animationId}: advanced source/report/catalog identity drifted`);
    for (const domain of definition.companionDomains) {
      const objectId = Number(domain.id.match(/^sprite-(\d+)/u)?.[1]);
      invariant(observed.structural.swfmill.nestedSprites.some((sprite) =>
        sprite.objectId === objectId &&
        sprite.frameCount === domain.frameCount),
      `${placement.animationId}: companion domain ${domain.id} drifted`);
    }
    const behaviorRead = await fileBinding(definition.behaviorFile,
      {includeBuffer: true});
    behaviorBindings[placement.animationId] = Object.freeze({
      path: behaviorRead.path, bytes: behaviorRead.bytes,
      sha256: behaviorRead.sha256,
    });
    const claims = extractBehaviorScriptClaims(
      behaviorRead.buffer.toString("utf8"), definition.behaviorFile);
    invariant(claims.length === expectedClaimCounts[placement.animationId],
      `${placement.animationId}: behavior script claim count drifted`);
    const exportedRows = new Map(observed.structural.exportedScripts.files
      .map((row) => [row.path, row]));
    for (const claim of claims) {
      const row = exportedRows.get(claim.path);
      invariant(row && row.bytes === claim.bytes &&
        row.sha256 === claim.sha256,
      `${placement.animationId}: behavior script claim is absent or drifted: ${claim.path}`);
    }
    behaviorScriptClaimCrosswalk[placement.animationId] = claims;
  }
  invariant(Object.values(behaviorScriptClaimCrosswalk)
    .reduce((sum, claims) => sum + claims.length, 0) === 17,
  "advanced behavior IR must crosswalk exactly 17 path-bound script claims");
  const sourceRoot = await resolveSourceRoot(irBinding.value);
  const reportDirectory = path.dirname(projectPath(
    irBinding.value.inputs.structuralReport.path));
  const sourceEvidenceBindings = {};
  let probeSourceBuffer = null;
  for (const placement of advanced) {
    const definition = definitionById(placement.animationId);
    const reportPlacement = reportMap.get(placement.animationId);
    const verifiedSource = await sourceFile(placement, reportPlacement,
      sourceRoot);
    probeSourceBuffer ??= verifiedSource.buffer;
    sourceEvidenceBindings[placement.animationId] =
      await verifyStructuralSourceEvidence({placement, definition,
        reportPlacement, reportDirectory});
  }
  const ffdecCommands = [...new Set(advanced.map((placement) =>
    reportMap.get(placement.animationId).commands.ffdecExportScript.command))];
  invariant(ffdecCommands.length === 1 && probeSourceBuffer,
    "advanced-3 FFDec command/probe source membership drifted");
  const ffdecToolchain = await verifyFfdecToolchain({
    requestedCommand: ffdecCommands[0],
    probeSourceBuffer,
  });
  return Object.freeze({irBinding, inputBindings: Object.freeze(inputBindings),
    report, factory, catalog, advanced: Object.freeze(advanced), reportMap,
    catalogMap, behaviorBindings: Object.freeze(behaviorBindings),
    behaviorScriptClaimCrosswalk: Object.freeze(behaviorScriptClaimCrosswalk),
    sourceEvidenceBindings: Object.freeze(sourceEvidenceBindings),
    ffdecToolchain, ffdecProbeSourceBuffer: probeSourceBuffer,
    wrapperBinding, generatorBinding,
    productHostBindings: Object.freeze(productHostBindings), sourceRoot});
}

async function sourceFile(placement, reportPlacement, sourceRoot) {
  const segments = canonicalSourceRelativePath(placement.sourceRelativePath,
    `${placement.animationId} sourceRelativePath`);
  const absolute = path.join(sourceRoot.sharedAbsolute, ...segments);
  invariant(absolute.startsWith(`${sourceRoot.sharedAbsolute}${path.sep}`),
    `${placement.animationId}: source escapes G6-G8-shared anchor`);
  let directory = sourceRoot.sharedAbsolute;
  for (const segment of segments.slice(0, -1)) {
    directory = path.join(directory, segment);
    const directoryMetadata = await lstat(directory);
    invariant(directoryMetadata.isDirectory() &&
      !directoryMetadata.isSymbolicLink() &&
      (directoryMetadata.mode & 0o222) === 0 &&
      await realpath(directory) === directory,
    `${placement.animationId}: source parent is not one real read-only directory`);
  }
  const resolvedBefore = await realpath(absolute);
  const before = await lstat(absolute, {bigint: true});
  const bytes = await readFile(absolute);
  const resolvedAfter = await realpath(absolute);
  const after = await lstat(absolute, {bigint: true});
  const snapshot = (metadata, resolved) => Object.freeze({
    realPath: resolved,
    device: String(metadata.dev),
    inode: String(metadata.ino),
    size: String(metadata.size),
    mtimeNs: String(metadata.mtimeNs),
    mode: Number(metadata.mode & 0o777n),
    nlink: Number(metadata.nlink),
  });
  const beforeSnapshot = snapshot(before, resolvedBefore);
  const afterSnapshot = snapshot(after, resolvedAfter);
  invariant(before.isFile() && !before.isSymbolicLink() &&
    before.nlink === 1n && (before.mode & 0o222n) === 0n &&
    resolvedBefore === absolute &&
    JSON.stringify(beforeSnapshot) === JSON.stringify(afterSnapshot) &&
    bytes.length === reportPlacement.source.bytes &&
    BigInt(bytes.length) === before.size &&
    sha256(bytes) === placement.sourceSha256,
  `${placement.animationId}: source path/stat/read/hash custody drifted`);
  return Object.freeze({absolute, bytes: bytes.length,
    sha256: placement.sourceSha256, mode: beforeSnapshot.mode,
    nlink: beforeSnapshot.nlink, stat: beforeSnapshot, buffer: bytes});
}

async function reportEvidenceFile(reportDirectory, descriptor, label) {
  invariant(descriptor && typeof descriptor.path === "string" &&
    Number.isSafeInteger(descriptor.bytes) && SHA256.test(descriptor.sha256),
  `${label}: report descriptor is invalid`);
  const absolute = rootPath(reportDirectory, descriptor.path, label);
  const observed = await stableAbsoluteBuffer(absolute, label);
  invariant(observed.bytes === descriptor.bytes &&
    observed.sha256 === descriptor.sha256,
  `${label}: evidence bytes/hash/mode/nlink drifted`);
  return Object.freeze({path: descriptor.path, bytes: observed.bytes,
    sha256: observed.sha256});
}

async function verifyStructuralSourceEvidence({placement, definition,
  reportPlacement, reportDirectory}) {
  const swfmill = reportPlacement.structural.swfmill.xml;
  const dumpAs2 = reportPlacement.commands.ffdecDumpAS2.stdout;
  const [swfmillBinding, dumpAs2Binding, dumpSwfBinding,
    exportLogBinding] = await Promise.all([
    reportEvidenceFile(reportDirectory, swfmill,
      `${placement.animationId} swfmill XML`),
    reportEvidenceFile(reportDirectory, dumpAs2,
      `${placement.animationId} FFDec dumpAS2`),
    reportEvidenceFile(reportDirectory,
      reportPlacement.commands.ffdecDumpSWF.stdout,
      `${placement.animationId} FFDec dumpSWF`),
    reportEvidenceFile(reportDirectory,
      reportPlacement.commands.ffdecExportScript.stdout,
      `${placement.animationId} FFDec exported-script listing`),
  ]);
  invariant(swfmillBinding.bytes === definition.sourceEvidence.swfmillXml.bytes &&
    swfmillBinding.sha256 === definition.sourceEvidence.swfmillXml.sha256 &&
    dumpAs2Binding.bytes === definition.sourceEvidence.ffdecDumpAs2.bytes &&
    dumpAs2Binding.sha256 === definition.sourceEvidence.ffdecDumpAs2.sha256,
  `${placement.animationId}: versioned swfmill/dumpAS2 binding drifted`);

  const exported = reportPlacement.structural.exportedScripts;
  const exportedRoot = rootPath(reportDirectory, exported.path,
    `${placement.animationId} exported scripts`);
  const rootMetadata = await lstat(exportedRoot);
  invariant(rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    `${placement.animationId}: exported-script root is not one real directory`);
  const observedRows = (await walkFiles(exportedRoot)).map((file) =>
    Object.freeze({bytes: file.bytes, path: file.path, sha256: file.sha256}));
  const expectedRows = exported.files.map((file) => Object.freeze({
    bytes: file.bytes, path: file.path, sha256: file.sha256,
  }));
  invariant(JSON.stringify(observedRows) === JSON.stringify(expectedRows),
    `${placement.animationId}: exported-script files/list/hash set drifted`);
  const projection = canonicalExportedScriptProjection(observedRows);
  invariant(exported.fileCount === observedRows.length &&
    exported.scriptFileCount === observedRows.length &&
    exported.totalBytes === projection.totalBytes &&
    projection.fileCount === definition.sourceEvidence.exportedScriptSet.fileCount &&
    projection.totalBytes === definition.sourceEvidence.exportedScriptSet.totalBytes &&
    projection.sha256 === definition.sourceEvidence.exportedScriptSet.sha256,
  `${placement.animationId}: exportedScriptSet canonical projection drifted`);
  return Object.freeze({
    swfmillXml: swfmillBinding,
    ffdecDumpAs2: dumpAs2Binding,
    ffdecDumpSwf: dumpSwfBinding,
    ffdecExportScriptListing: exportLogBinding,
    exportedScriptSet: Object.freeze({
      path: exported.path,
      canonicalProjection:
        "structural-report exportedScripts.files serialized as sorted-key compact JSON plus LF",
      fileCount: projection.fileCount,
      totalBytes: projection.totalBytes,
      projectionBytes: projection.bytes,
      sha256: projection.sha256,
    }),
  });
}

function rootPlacementXPath() {
  const node = "/swf/Header/tags/PlaceObject2[@name='animation']";
  const value = (suffix) => `string(${node}${suffix})`;
  return `concat(count(${node}),'|',${value("/@objectID")},'|',` +
    `${value("/@depth")},'|',${value("/@name")},'|',` +
    `count(${node}/preceding-sibling::ShowFrame)+1,'|',` +
    `${value("/transform/Transform/@scaleX")},'|',` +
    `${value("/transform/Transform/@skewY")},'|',` +
    `${value("/transform/Transform/@skewX")},'|',` +
    `${value("/transform/Transform/@scaleY")},'|',` +
    `${value("/transform/Transform/@transX")},'|',` +
    `${value("/transform/Transform/@transY")})`;
}

async function parseRootTarget({xmlBuffer, placement}) {
  const command = "/usr/bin/xmllint";
  const args = ["--xpath", rootPlacementXPath(), "-"];
  const result = await captureProcess({command, args, cwd: PROJECT_ROOT,
    environment: process.env, input: xmlBuffer});
  invariant(result.code === 0 && result.signal === null &&
    result.stderr.length === 0,
  `${placement.animationId}: xmllint buffer parse failed`);
  const fields = result.stdout.toString("utf8").trim().split("|");
  invariant(fields.length === 11 && fields[0] === "1",
    `${placement.animationId}: expected exactly one parsed animation placement`);
  const number = (value, fallback) => value === "" ? fallback : Number(value);
  const target = Object.freeze({objectId: Number(fields[1]),
    depth: Number(fields[2]), instanceName: fields[3],
    beginFrame: Number(fields[4]), matrix: Object.freeze({
      a: number(fields[5], 1), b: number(fields[6], 0),
      c: number(fields[7], 0), d: number(fields[8], 1),
      tx: Number(fields[9]) / 20, ty: Number(fields[10]) / 20,
    })});
  invariant(target.objectId === placement.mainChild.objectId &&
    target.beginFrame === placement.rootBeginFrame &&
    target.instanceName === "animation" && target.depth > 0 &&
    Object.values(target.matrix).every(Number.isFinite),
  `${placement.animationId}: parsed root target drifted`);
  return Object.freeze({target, command: Object.freeze({command,
    args: Object.freeze(["--xpath", rootPlacementXPath(), "<VERIFIED_XML_BUFFER>"]),
    exitCode: result.code,
    stdin: Object.freeze({bytes: xmlBuffer.length, sha256: sha256(xmlBuffer)}),
    stdout: Object.freeze({bytes: result.stdout.length,
      sha256: sha256(result.stdout)}),
    stderr: Object.freeze({bytes: result.stderr.length,
      sha256: sha256(result.stderr)})})});
}

function deriveFfdecMetadata(framesHtml, placement) {
  const normalized = framesHtml.replace(/\r\n?/gu, "\n");
  const canvas = normalized.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  invariant(canvas, `${placement.animationId}: FFDec target Canvas is missing`);
  const marker = '<script>var canvas=document.getElementById("myCanvas");';
  const start = normalized.indexOf(marker);
  const end = normalized.indexOf("</script>", start);
  invariant(start >= 0 && end > start &&
    normalized.indexOf(marker, start + 1) < 0,
  `${placement.animationId}: FFDec bootstrap drifted`);
  const inline = normalized.slice(start + "<script>".length, end);
  const definitionsStart = inline.indexOf("var scalingGrids = {};");
  const viewerStart = inline.indexOf("\nvar frame = -1;");
  invariant(definitionsStart >= 0 && viewerStart > definitionsStart,
    `${placement.animationId}: FFDec definition boundary drifted`);
  const definitions = inline.slice(definitionsStart, viewerStart).trimEnd();
  const functionName = `sprite${placement.mainChild.objectId}`;
  const header = definitions.match(new RegExp(
    `function\\s+${functionName}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
    "ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1," +
    "([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*" +
    "var frame_cnt = (\\d+);"));
  invariant(header, `${placement.animationId}: target sprite header drifted`);
  const frameCount = Number(header[3]);
  invariant(frameCount === placement.mainChild.frameCount,
    `${placement.animationId}: target frame count drifted`);
  const targetEnd = definitions.indexOf("\nfunction ",
    header.index + header[0].length);
  const targetSource = definitions.slice(header.index,
    targetEnd < 0 ? definitions.length : targetEnd);
  const cases = [...targetSource.matchAll(
    /case\s+(\d+):([\s\S]*?)(?=\n\s*case\s+\d+:|\n\s*\})/gu)];
  invariant(cases.length === frameCount,
    `${placement.animationId}: target frame inventory drifted`);
  const placedFrames = cases.filter((match) => match[2].includes('place("'))
    .map((match) => Number(match[1]) + 1);
  invariant(placedFrames.length > 0,
    `${placement.animationId}: target sprite has no drawing frame`);
  const placedFunctions = [...new Set([...definitions.matchAll(
    /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu)]
    .map((match) => match[1]))].sort();
  const fontFunctions = [...definitions.matchAll(
    /function\s+(font\d+)\(ctx,ch,textColor\)\{/gu)]
    .map((match) => match[1]);
  const imageVariables = [...definitions.matchAll(
    /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu)]
    .map((match) => match[1]);
  return Object.freeze({functionName, frameCount,
    exportCanvas: Object.freeze({width: Number(canvas[1]),
      height: Number(canvas[2])}),
    internalTranslation: Object.freeze({x: Number(header[1]),
      y: Number(header[2])}),
    lastPlacedFrame: Math.max(...placedFrames),
    placedFunctions: Object.freeze({count: placedFunctions.length,
      sha256: sha256(JSON.stringify(placedFunctions))}),
    fontFunctions: Object.freeze({count: fontFunctions.length,
      sha256: sha256(JSON.stringify(fontFunctions))}),
    imageVariables: Object.freeze({count: imageVariables.length,
      sha256: sha256(JSON.stringify(imageVariables))})});
}

function composeStageMatrix(root, internal) {
  return Object.freeze({a: root.a, b: root.b, c: root.c, d: root.d,
    e: root.tx - root.a * internal.x - root.c * internal.y,
    f: root.ty - root.b * internal.x - root.d * internal.y});
}

function replaceExactlyOnce(source, marker, replacement, label) {
  const first = source.indexOf(marker);
  invariant(first >= 0 && source.indexOf(marker,
    first + marker.length) < 0, `${label} marker count drifted`);
  return `${source.slice(0, first)}${replacement}${source.slice(first + marker.length)}`;
}

const RUNTIME_BLOCKLIST = Object.freeze([
  ["dynamic evaluation", /\b(?:eval|Function)\s*\(/u],
  ["network primitive", /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/u],
  ["timer or animation loop", /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/u],
  ["persistent storage", /\b(?:localStorage|sessionStorage|indexedDB)\b/u],
  ["ambient event listener", /\b(?:addEventListener|removeEventListener)\s*\(/u],
]);

function runtimeSpec({placement, definition, reportPlacement, target, metadata,
  framesBinding, helperBinding, finalRuntimePath, reportBinding}) {
  const stageMatrix = composeStageMatrix(target.matrix,
    metadata.internalTranslation);
  const livePlaybackEndFrame = metadata.lastPlacedFrame;
  const runtimeAlias = `course-${placement.animationId}`;
  const value = {
    schemaVersion: 1,
    animationId: runtimeAlias,
    classification: "private-g678-advanced-manual-current-js-engineering",
    title: `${placement.animationId} advanced-manual visual runtime`,
    source: {swf: `$${SOURCE_ENVIRONMENT}/G6-G8-shared/${placement.sourceRelativePath}`,
      swfBytes: reportPlacement.source.bytes,
      swfSha256: placement.sourceSha256},
    evidence: {scenarioInventory: reportBinding.path,
      scenarioInventorySha256: reportBinding.sha256,
      audioAudit: reportBinding.path,
      audioAuditSha256: reportBinding.sha256},
    ffdecExport: {tool: "JPEXS Free Flash Decompiler 26.2.1 Canvas export",
      helper: helperBinding.path, helperSha256: helperBinding.sha256,
      helperBytes: helperBinding.bytes, framesHtml: framesBinding.path,
      framesHtmlSha256: framesBinding.sha256,
      framesHtmlBytes: framesBinding.bytes,
      targetSpriteObjectId: target.objectId,
      targetSpriteFunction: metadata.functionName,
      exportCanvas: metadata.exportCanvas,
      exportInternalTranslation: metadata.internalTranslation,
      expectedPlacedFunctionCount: metadata.placedFunctions.count,
      expectedPlacedFunctionsSha256: metadata.placedFunctions.sha256,
      expectedFontFunctionCount: metadata.fontFunctions.count,
      expectedFontFunctionsSha256: metadata.fontFunctions.sha256,
      embeddedImageVariableCount: metadata.imageVariables.count,
      embeddedImageVariablesSha256: metadata.imageVariables.sha256},
    timeline: {fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {frameCount: placement.rootFrameCount, preloaderStopFrame: 1,
        beginFrame: placement.rootBeginFrame, beginLabel: "begin",
        placementName: target.instanceName, placementDepth: target.depth,
        placementTwips: {x: target.matrix.tx * 20,
          y: target.matrix.ty * 20},
        placementPixels: {x: target.matrix.tx, y: target.matrix.ty}},
      local: {timelineId: `sprite-${target.objectId}`,
        frameCount: placement.mainChild.frameCount,
        extractedDrawingLastPlacedFrame: metadata.lastPlacedFrame,
        livePlaybackEndFrame,
        interactiveStops: definition.interactiveStop
          ? [definition.interactiveStop] : [],
        interactiveSeek: definition.interactiveSeek,
        playbackMode: "once", publicFrameIndexing: "one-indexed"},
      stageRenderOffset: {x: target.matrix.tx - metadata.internalTranslation.x,
        y: target.matrix.ty - metadata.internalTranslation.y}},
    runtimeContract: {kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "fixed-zero-no-source-randomness-executed",
      blockedLocalFrameRanges: [],
      unresolved: [...definition.remainingBlockers,
        "AVM1/P-code is extracted for evidence and never executed.",
        "Feedback and embedded streaming audio are disabled and unaccepted.",
        "Original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false."],
      currentCanonicalFrameDomainDispositionAsserted: false},
    output: {script: finalRuntimePath,
      manifest: finalRuntimePath.replace(/canvas-renderer\.js$/u,
        "member-manifest.json"),
      spec: finalRuntimePath.replace(/canvas-renderer\.js$/u,
        "adapter-spec.json"),
      globalRegistry: ASSET_REGISTRY},
    strictAcceptanceEffect: "none",
  };
  return Object.freeze({value, stageMatrix});
}

function finalizeRuntime(runtime, spec, stageMatrix, animationId) {
  const literal = (value) => Object.is(value, -0) ? "0" : String(value);
  let next = replaceExactlyOnce(runtime,
    `ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});`,
    `ctx.transform(${[stageMatrix.a, stageMatrix.b, stageMatrix.c,
      stageMatrix.d, stageMatrix.e, stageMatrix.f].map(literal).join(", ")});`,
    `${animationId} root transform`);
  next = replaceExactlyOnce(next,
    "/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */",
    `/* Generated by ${GENERATOR_PATH} through the canonical safe FFDec Canvas adapter. */`,
    `${animationId} generator header`);
  const alias = JSON.stringify(spec.animationId);
  const actual = JSON.stringify(animationId);
  invariant(next.split(alias).length - 1 >= 2,
    `${animationId}: safe runtime alias identity is missing`);
  next = next.split(alias).join(actual);
  invariant(next.includes(`HELP_MATH_CANVAS_ASSETS`) &&
    next.includes(JSON.stringify(animationId)),
  `${animationId}: canonical runtime registry/identity is missing`);
  for (const [label, pattern] of RUNTIME_BLOCKLIST) {
    invariant(!pattern.test(next), `${animationId}: runtime contains ${label}`);
  }
  new Script(next, {filename: `${animationId}-canvas-renderer.js`});
  return next;
}

async function buildMember({placement, definition, context, stageRoot}) {
  const reportPlacement = context.reportMap.get(placement.animationId);
  const source = await sourceFile(placement, reportPlacement,
    context.sourceRoot);
  const memberRoot = path.join(stageRoot, "members", placement.animationId);
  const logsRoot = path.join(memberRoot, "logs");
  const canvasRoot = path.join(memberRoot, "canvas");
  const pcodeRoot = path.join(memberRoot, "pcode");
  const compilerInputRoot = path.join(memberRoot, "compiler-input");
  await Promise.all([mkdir(logsRoot, {recursive: true}),
    mkdir(canvasRoot, {recursive: true}),
    mkdir(pcodeRoot, {recursive: true}),
    mkdir(compilerInputRoot, {recursive: true})]);
  const stagedSourcePath = path.join(compilerInputRoot, "source.swf");
  await writeFile(stagedSourcePath, source.buffer, {flag: "wx", mode: 0o444});
  await Promise.all([chmod(stagedSourcePath, 0o444),
    chmod(compilerInputRoot, 0o555)]);
  const stagedSource = await stableAbsoluteBuffer(stagedSourcePath,
    `${placement.animationId} staged compiler SWF`);
  invariant(stagedSource.bytes === source.bytes &&
    stagedSource.sha256 === source.sha256 &&
    stagedSource.identity.mode === 0o444 && stagedSource.identity.nlink === 1,
  `${placement.animationId}: staged compiler SWF binding drifted`);
  invariant(reportPlacement.commands.ffdecExportScript.command ===
    context.ffdecToolchain.requestedCommand,
  `${placement.animationId}: structural FFDec command drifted`);
  const ffdec = context.ffdecToolchain.command;
  const materializeArgs = (template, output) => template.map((value) =>
    value === "<OUTPUT_DIRECTORY>" ? output
      : value === "<SOURCE_SWF>" ? stagedSourcePath : value);
  const canvasCommand = await runCommand({command: ffdec,
    args: [...context.ffdecToolchain.prefixArgs,
      ...materializeArgs(context.ffdecToolchain.argv.canvas, canvasRoot)],
    cwd: PROJECT_ROOT, logStem: path.join(logsRoot, "ffdec-canvas"),
    source: stagedSourcePath, output: canvasRoot,
    redactions: [[context.ffdecToolchain.prefixArgs.at(-1), "<FFDEC_JAR>"]]});
  const pcodeCommand = await runCommand({command: ffdec,
    args: [...context.ffdecToolchain.prefixArgs,
      ...materializeArgs(context.ffdecToolchain.argv.pcode, pcodeRoot)],
    cwd: PROJECT_ROOT, logStem: path.join(logsRoot, "ffdec-pcode"),
    source: stagedSourcePath, output: pcodeRoot,
    redactions: [[context.ffdecToolchain.prefixArgs.at(-1), "<FFDEC_JAR>"]]});
  const sourceAfter = await sourceFile(placement, reportPlacement,
    context.sourceRoot);
  invariant(sourceAfter.sha256 === source.sha256 &&
    sourceAfter.bytes === source.bytes &&
    JSON.stringify(sourceAfter.stat) === JSON.stringify(source.stat),
  `${placement.animationId}: source changed during extraction`);
  const stagedSourceAfter = await stableAbsoluteBuffer(stagedSourcePath,
    `${placement.animationId} staged compiler SWF after extraction`);
  invariant(stagedSourceAfter.bytes === stagedSource.bytes &&
    stagedSourceAfter.sha256 === stagedSource.sha256 &&
    JSON.stringify(stagedSourceAfter.identity) ===
      JSON.stringify(stagedSource.identity),
  `${placement.animationId}: staged compiler SWF changed during extraction`);

  const reportDirectory = path.dirname(projectPath(
    context.irBinding.value.inputs.structuralReport.path));
  const xmlDescriptor = reportPlacement.structural.swfmill.xml;
  const xmlPath = path.join(reportDirectory, xmlDescriptor.path);
  const xmlRead = await stableAbsoluteBuffer(xmlPath,
    `${placement.animationId} raw swfmill XML`);
  invariant(xmlRead.bytes === xmlDescriptor.bytes &&
    xmlRead.sha256 === xmlDescriptor.sha256,
  `${placement.animationId}: swfmill XML drifted`);
  const parsed = await parseRootTarget({xmlBuffer: xmlRead.buffer, placement});
  const spriteRoot = path.join(canvasRoot, "sprites",
    `DefineSprite_${parsed.target.objectId}`);
  const framesPath = path.join(spriteRoot, "frames.html");
  const helperPath = path.join(spriteRoot, "canvas.js");
  const [framesRead, helperRead] = await Promise.all([
    stableAbsoluteBuffer(framesPath,
      `${placement.animationId} FFDec frames.html`),
    stableAbsoluteBuffer(helperPath,
      `${placement.animationId} FFDec canvas.js`),
  ]);
  const metadata = deriveFfdecMetadata(framesRead.buffer.toString("utf8"),
    placement);
  const finalMemberRoot = portable(path.join(OUTPUT_ROOT, "members",
    placement.animationId));
  const stagedSourceBinding = Object.freeze({
    path: `${finalMemberRoot}/compiler-input/source.swf`,
    bytes: stagedSource.bytes, sha256: stagedSource.sha256,
    identity: Object.freeze({...stagedSource.identity,
      realPath: `${finalMemberRoot}/compiler-input/source.swf`}),
  });
  const xmlBinding = Object.freeze({
    path: portable(path.relative(PROJECT_ROOT, xmlPath)),
    bytes: xmlRead.bytes, sha256: xmlRead.sha256,
  });
  const finalSpriteRoot = `${finalMemberRoot}/canvas/sprites/DefineSprite_${parsed.target.objectId}`;
  const framesBinding = Object.freeze({path: `${finalSpriteRoot}/frames.html`,
    bytes: framesRead.bytes, sha256: framesRead.sha256});
  const helperBinding = Object.freeze({path: `${finalSpriteRoot}/canvas.js`,
    bytes: helperRead.bytes, sha256: helperRead.sha256});
  const finalRuntimePath = `${finalMemberRoot}/canvas-renderer.js`;
  const spec = runtimeSpec({placement, definition, reportPlacement,
    target: parsed.target, metadata, framesBinding, helperBinding,
    finalRuntimePath,
    reportBinding: context.irBinding.value.inputs.structuralReport});
  const built = buildSafeRuntime({
    helperSource: helperRead.buffer.toString("utf8"),
    framesHtml: framesRead.buffer.toString("utf8"), spec: spec.value});
  const runtimeBytes = Buffer.from(finalizeRuntime(built.runtime, spec.value,
    spec.stageMatrix, placement.animationId));
  const specBytes = jsonBytes(spec.value);
  const runtimePath = path.join(memberRoot, "canvas-renderer.js");
  const specPath = path.join(memberRoot, "adapter-spec.json");
  await Promise.all([
    writeFile(runtimePath, runtimeBytes, {flag: "wx"}),
    writeFile(specPath, specBytes, {flag: "wx"}),
  ]);
  await Promise.all([freezeTree(canvasRoot), freezeTree(pcodeRoot),
    freezeTree(logsRoot), chmod(runtimePath, 0o444), chmod(specPath, 0o444)]);
  const [canvasInventory, pcodeInventory] = await Promise.all([
    directoryInventory(canvasRoot), directoryInventory(pcodeRoot),
  ]);
  const runtime = Object.freeze({path: finalRuntimePath,
    bytes: runtimeBytes.length, sha256: sha256(runtimeBytes),
    url: `/flash-assets/g678-local/${placement.animationId}/canvas-renderer.js`,
    globalRegistry: ASSET_REGISTRY});
  const behavior = context.behaviorBindings[placement.animationId];
  const memberManifest = {
    schemaVersion: 1,
    artifactType: "g678-advanced-manual-current-js-member-v1",
    animationId: placement.animationId,
    source: {path: `G6-G8-shared/${placement.sourceRelativePath}`,
      bytes: source.bytes, sha256: source.sha256, mode: source.mode,
      nlink: source.nlink, stat: source.stat,
      unchangedDuringExtraction: true},
    reviewedRouting: {lane: "behavior-heavy",
      adapterFamily: definition.adapterFamily,
      implementationDisposition: "advanced-manual"},
    behaviorSpecification: behavior,
    behaviorScriptClaims:
      context.behaviorScriptClaimCrosswalk[placement.animationId],
    sourceEvidenceReverification:
      context.sourceEvidenceBindings[placement.animationId],
    maintainedWrapper: context.wrapperBinding,
    maintainedProductHost: context.productHostBindings,
    timeline: {rootFrameCount: placement.rootFrameCount,
      rootBeginFrame: placement.rootBeginFrame,
      frameDomain: `sprite-${parsed.target.objectId}`,
      frameCount: placement.mainChild.frameCount,
      extractedDrawingLastPlacedFrame: metadata.lastPlacedFrame,
      livePlaybackEndFrame: metadata.lastPlacedFrame,
      interactiveStops: definition.interactiveStop
        ? [definition.interactiveStop] : [],
      interactiveSeek: definition.interactiveSeek,
      rootPlacementMatrix: parsed.target.matrix,
      behaviorFrame: definition.behaviorFrame,
      companionDomains: definition.companionDomains},
    compiler: {canvasCommand: canvasCommand.descriptor,
      pcodeCommand: pcodeCommand.descriptor,
      xmllintRootPlacement: parsed.command,
      stagedSource: stagedSourceBinding,
      rawInputs: Object.freeze({swfmillXml: xmlBinding,
        framesHtml: framesBinding, canvasHelper: helperBinding}),
      canvasInventory, pcodeInventory,
      ffdecToolchainBindingSha256:
        sha256(Buffer.from(stableJson(context.ffdecToolchain.identity))),
      safeAdapter: context.inputBindings.safeCanvasAdapter},
    runtime: {canvasRenderer: runtime,
      adapterSpec: {path: `${finalMemberRoot}/adapter-spec.json`,
        bytes: specBytes.length, sha256: sha256(specBytes)}},
    product: {privateCurrentJsModuleGenerated: true,
      currentJavaScriptRegistered: false,
      requiresHostInteractiveStop: Boolean(definition.interactiveStop),
      requiresHostSeekConsumer: Boolean(definition.interactiveSeek),
      hostSeekConsumerImplemented: HOST_SEEK_CONSUMER_IMPLEMENTED,
      interactiveResolutionIntentContractImplemented:
        HOST_INTERACTIVE_STOP_CONSUMER_IMPLEMENTED,
      interactiveStateQueryableThroughModuleGetFrameState: false,
      feedbackVariantSelection:
        definition.behaviorFrame === null
          ? "not-applicable"
          : "source-host-cardinality-page-seed-v1",
      productCalibrationPassed: false,
      engineeringPreviewReady: false},
    remainingBlockers: definition.remainingBlockers,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const manifestBytes = jsonBytes(memberManifest);
  const manifestPath = path.join(memberRoot, "member-manifest.json");
  await writeFile(manifestPath, manifestBytes, {flag: "wx"});
  await freezeTree(memberRoot);
  return Object.freeze({animationId: placement.animationId, placement,
    definition, target: parsed.target, metadata, runtime,
    manifestPath: `${finalMemberRoot}/member-manifest.json`,
    manifest: Object.freeze({bytes: manifestBytes.length,
      sha256: sha256(manifestBytes)}), behavior});
}

function constantName(animationId) {
  return animationId.replace(/[^A-Za-z0-9]+/gu, "_").toUpperCase();
}

export function timelineSource(page) {
  const name = constantName(page.animationId);
  const sourceContract = {
    calibrationId: CALIBRATION_ID,
    deploymentScope: "local-only",
    source: {path: page.sourcePath, sha256: page.sourceSha256},
    reviewedLane: "behavior-heavy",
    adapterFamily: page.adapterFamily,
    runtimePath: page.runtime.path,
    runtimeRegistry: page.runtime.globalRegistry,
    behaviorSpecification: page.behavior,
    currentJavaScriptRegistered: false,
    privateCurrentJsModuleGenerated: true,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    requiresHostInteractiveStop: page.interactiveStops.length > 0,
    interactiveStops: page.interactiveStops,
    interactiveSeek: page.interactiveSeek,
    requiresHostSeekConsumer: Boolean(page.interactiveSeek),
    hostSeekConsumerImplemented: HOST_SEEK_CONSUMER_IMPLEMENTED,
    interactiveResolutionIntentContractImplemented:
      HOST_INTERACTIVE_STOP_CONSUMER_IMPLEMENTED,
    interactiveStateQueryableThroughModuleGetFrameState: false,
    feedbackVariantSelection: page.behaviorFrame === null
      ? "not-applicable" : "source-host-cardinality-page-seed-v1",
    audioLifecycleAccepted: false,
    spanishBehaviorAccepted: false,
    strictAcceptanceEffect: "none",
  };
  const config = {
    animationId: page.animationId,
    title: `${page.titleEnglish} — local-only advanced-manual Current-JS engineering candidate`,
    sourceSwfSha256: page.sourceSha256,
    assetSource: page.runtime.url,
    assetSha256: page.runtime.sha256,
    stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600},
    fps: 12,
    rootFrameCount: page.rootFrameCount,
    rootBeginFrame: page.rootBeginFrame,
    mainFrameDomain: page.frameDomain,
    mainFrameCount: page.frameCount,
    livePlaybackEndFrame: page.livePlaybackEndFrame,
    playbackMode: "once",
    strictCaptureIdentity: true,
    companionDomains: page.companionDomains,
    blockedFrameRanges: [],
    visualMarkers: [{id: `${page.frameDomain}-ffdec-drawing`,
      firstFrame: 1, lastFrame: page.frameCount}],
    sourceControlBehaviorLabel:
      `Maintained advanced-manual controls; remaining blockers: ${page.remainingBlockers.join(", ")}`,
    showEngineeringDisclosure: false,
  };
  const behaviorImport = page.behavior.path
    .replace("packages/demos/src/", "../")
    .replace(/\.ts$/u, "");
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n` +
    `import {${page.behaviorIrExport}} from ${JSON.stringify(behaviorImport)};\n\n` +
    `export {${page.behaviorIrExport}};\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify(sourceContract, null, 2)} as const);\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

export function moduleSource(page) {
  const name = constantName(page.animationId);
  return `"use client";\n\n` +
    `import {${page.wrapperFactory}} from "../g678-advanced-manual/current-js-wrappers";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `const candidate = ${page.wrapperFactory}({config: ${name}_CONFIG, sourceContract: ${name}_SOURCE, interactiveStops: ${name}_SOURCE.interactiveStops, interactiveSeek: ${name}_SOURCE.interactiveSeek});\n\n` +
    `export {${name}_SOURCE};\n` +
    `export const ${name}_MOVIE = candidate.movie;\n` +
    `export const ${name}_RUNTIME = candidate.runtime;\n` +
    `export const ${name}_SOURCE_CONTRACT = candidate.sourceContract;\n` +
    `export const ${name}_SCENARIOS = candidate.scenarios;\n` +
    `export const ${name}_RENDERER = candidate.Renderer;\n` +
    `export default candidate.module;\n`;
}

function pageRecord(context, result) {
  const catalog = context.catalogMap.get(result.animationId);
  invariant(catalog, `${result.animationId}: catalog record is missing`);
  return Object.freeze({animationId: result.animationId,
    placementId: catalog.page.placementId, assetId: catalog.page.assetId,
    moduleCode: catalog.lesson.moduleCode,
    lessonNumber: catalog.lesson.lessonNumber,
    stableLessonKey: catalog.lesson.stableLessonKey,
    globalPageOrdinal: catalog.page.globalOrdinal,
    sectionCode: catalog.page.sectionCode,
    sectionPageOrdinal: catalog.page.sectionPageOrdinal,
    titleEnglish: catalog.page.titleEnglish,
    sourcePath: `G6-G8-shared/${result.placement.sourceRelativePath}`,
    sourceSha256: result.placement.sourceSha256,
    adapterFamily: result.definition.adapterFamily,
    rootFrameCount: result.placement.rootFrameCount,
    rootBeginFrame: result.placement.rootBeginFrame,
    frameDomain: `sprite-${result.target.objectId}`,
    frameCount: result.metadata.frameCount,
    extractedDrawingLastPlacedFrame:
      result.metadata.lastPlacedFrame,
    livePlaybackEndFrame:
      result.metadata.lastPlacedFrame,
    interactiveStops: result.definition.interactiveStop
      ? [result.definition.interactiveStop] : [],
    interactiveSeek: result.definition.interactiveSeek,
    behaviorFrame: result.definition.behaviorFrame,
    companionDomains: result.definition.companionDomains,
    remainingBlockers: result.definition.remainingBlockers,
    behaviorIrExport: result.definition.behaviorIrExport,
    wrapperFactory: result.definition.wrapperFactory,
    behavior: result.behavior,
    behaviorScriptClaims:
      context.behaviorScriptClaimCrosswalk[result.animationId],
    runtime: result.runtime,
    memberManifest: {path: result.manifestPath, ...result.manifest}});
}

function outputDescriptor(relativePath, bytes) {
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes)});
}

function trackedOutputs(context, results) {
  const pages = results.map((result) => pageRecord(context, result))
    .sort((left, right) => left.animationId.localeCompare(right.animationId));
  const output = new Map();
  const entryDescriptors = [];
  for (const page of pages) {
    const timelinePath = `packages/demos/src/timelines/${page.animationId}.ts`;
    const modulePath = `packages/demos/src/modules/${page.animationId}.tsx`;
    const timelineBytes = Buffer.from(timelineSource(page));
    const moduleBytes = Buffer.from(moduleSource(page));
    output.set(timelinePath, timelineBytes);
    output.set(modulePath, moduleBytes);
    entryDescriptors.push(Object.freeze({key: page.animationId,
      module: `./modules/${page.animationId}`,
      maturity: "private-current-js",
      complexityLane: "behavior-heavy",
      deploymentScope: "local-only",
      adapterFamily: page.adapterFamily,
      behaviorSpecification: page.behavior,
      behaviorScriptClaims: page.behaviorScriptClaims,
      timeline: outputDescriptor(timelinePath, timelineBytes),
      moduleFile: outputDescriptor(modulePath, moduleBytes),
      memberManifest: page.memberManifest,
      runtime: {canvasRenderer: page.runtime,
        frameDomain: page.frameDomain, frameCount: page.frameCount,
        extractedDrawingLastPlacedFrame: page.extractedDrawingLastPlacedFrame,
        livePlaybackEndFrame: page.livePlaybackEndFrame,
        interactiveStops: page.interactiveStops,
        requiresHostInteractiveStop: page.interactiveStops.length > 0,
        interactiveStateQueryableThroughModuleGetFrameState: false,
        interactiveResolutionIntentContractImplemented:
          HOST_INTERACTIVE_STOP_CONSUMER_IMPLEMENTED,
        interactiveSeek: page.interactiveSeek,
        requiresHostSeekConsumer: Boolean(page.interactiveSeek),
        hostSeekConsumerImplemented: HOST_SEEK_CONSUMER_IMPLEMENTED,
        companionDomains: page.companionDomains},
      feedbackVariantSelection: page.behaviorFrame === null
        ? "not-applicable" : "source-host-cardinality-page-seed-v1"}));
  }
  const fragment = {
    schemaVersion: 1,
    artifactType: "private-current-js-advanced-manual-fragment-v1",
    calibrationId: CALIBRATION_ID,
    runId: RUN_ID,
    compilerRunPath: `${OUTPUT_ROOT}/run-manifest.json`,
    deploymentScope: "local-only",
    frozenCalibrationPlacementCount: 16,
    advancedManualPlacementCount: 3,
    generatedPrivateCurrentJsModuleCount: 3,
    currentJavaScriptRegisteredCount: 0,
    shared13FreezeChanged: false,
    registryChanged: false,
    webBridgeChanged: false,
    entries: entryDescriptors,
    inputs: {calibrationIr: {path: IR_PATH, bytes: context.irBinding.bytes,
      sha256: context.irBinding.sha256},
      wrapper: context.wrapperBinding,
      productHost: context.productHostBindings,
      safeCanvasAdapter: context.inputBindings.safeCanvasAdapter,
      generator: context.generatorBinding},
    feedbackBoundary: {
      hostVariantSelectionAlgorithmsRecovered:
        HOST_FEEDBACK_SELECTOR_RECOVERED_PAGES,
      pagesBlockedPendingHostVariant: 0,
      guessedSelections: 0,
      deterministicBranchExhaustionImplemented: true,
      authoritativeAdobeRandomStateAccepted: false,
    },
    interactiveStopBoundary: {
      requiresHostInteractiveStop: true,
      affectedPageCount: pages.filter((page) =>
        page.interactiveStops.length > 0).length,
      hostConsumerImplemented: HOST_INTERACTIVE_STOP_CONSUMER_IMPLEMENTED,
      interactiveResolutionIntentContractImplemented:
        HOST_INTERACTIVE_STOP_CONSUMER_IMPLEMENTED,
      interactiveStateQueryContractImplemented: false,
      pageCompletionAllowedWhileUnresolved: false,
      registrationBlockedUntilHostConsumer: false,
    },
    seekBoundary: {
      requiresHostSeekConsumer: true,
      affectedPageCount: pages.filter((page) =>
        Boolean(page.interactiveSeek)).length,
      hostSeekConsumerImplemented: HOST_SEEK_CONSUMER_IMPLEMENTED,
      localCanvasPreviewIsOuterPlayheadSeek: false,
      registrationBlockedUntilHostSeekConsumer: false,
    },
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    scaleOutAuthorized: false,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const fragmentBytes = jsonBytes(fragment);
  output.set(FRAGMENT_PATH, fragmentBytes);
  return Object.freeze({pages: Object.freeze(pages), fragment,
    output, descriptors: Object.freeze([...output.entries()].map(
      ([relativePath, bytes]) => outputDescriptor(relativePath, bytes)))});
}

async function directoryCommitIdentity(absolute, label) {
  const resolved = await realpath(absolute);
  const metadata = await lstat(absolute, {bigint: true});
  invariant(resolved === absolute && metadata.isDirectory() &&
    !metadata.isSymbolicLink(), `${label} is not one canonical directory`);
  return Object.freeze({realPath: resolved, device: String(metadata.dev),
    inode: String(metadata.ino), mode: Number(metadata.mode),
    nlink: Number(metadata.nlink), mtimeNs: String(metadata.mtimeNs)});
}

function sameDirectoryObject(left, right) {
  return left.realPath === right.realPath && left.device === right.device &&
    left.inode === right.inode && left.mode === right.mode;
}

export async function publishTrackedOutputs(outputs, {
  root = PROJECT_ROOT,
  failAfterCopies = Number.POSITIVE_INFINITY,
  afterRawCopy,
  afterCopy,
} = {}) {
  const publicationParent = rootPath(root,
    "work/g678-shared-page-factory", "publication parent");
  await mkdir(publicationParent, {recursive: true});
  const transaction = path.join(publicationParent,
    `.g678-advanced3-publication-${process.pid}-${Date.now()}`);
  invariant(!(await exists(transaction)),
    `tracked publication transaction already exists: ${transaction}`);
  const targets = [...outputs.entries()].map(([relativePath, bytes]) =>
    Object.freeze({relativePath, bytes,
      target: rootPath(root, relativePath, relativePath),
      staged: path.join(transaction, relativePath)}));
  const created = [];
  const parentIdentities = new Map();
  try {
    for (const target of targets) {
      invariant(!(await exists(target.target)),
        `${target.relativePath} already exists; publication is create-exclusive`);
      const parentPath = path.dirname(target.target);
      parentIdentities.set(target.relativePath,
        await directoryCommitIdentity(parentPath,
          `${target.relativePath} initial parent`));
    }
    await mkdir(transaction, {recursive: false});
    for (const target of targets) {
      await mkdir(path.dirname(target.staged), {recursive: true});
      await writeFile(target.staged, target.bytes, {flag: "wx", mode: 0o644});
      invariant((await readFile(target.staged)).equals(target.bytes),
        `${target.relativePath}: staged bytes drifted`);
    }
    const provisionalRoot = path.join(transaction, "provisional");
    await mkdir(provisionalRoot, {recursive: false});
    await writeFile(path.join(transaction, "transaction.json"),
      jsonBytes({schemaVersion: 1,
        artifactType: "g678-advanced3-publication-transaction-v1",
        targets: targets.map(({relativePath, bytes}) => ({relativePath,
          bytes: bytes.length, sha256: sha256(bytes),
          parent: parentIdentities.get(relativePath)}))}), {flag: "wx"});
    for (const target of targets) {
      invariant(!(await exists(target.target)),
        `${target.relativePath} appeared during staging`);
    }
    for (const [index, target] of targets.entries()) {
      const initialParent = parentIdentities.get(target.relativePath);
      const parentPreCommit = await directoryCommitIdentity(
        path.dirname(target.target), `${target.relativePath} pre-commit parent`);
      invariant(sameDirectoryObject(initialParent, parentPreCommit),
        `${target.relativePath}: parent identity changed before commit`);
      await copyFile(target.staged, target.target, fsConstants.COPYFILE_EXCL);
      const createdFile = {target: target.target,
        relativePath: target.relativePath, bytes: target.bytes.length,
        sha256: sha256(target.bytes), identity: null,
        parentIdentity: initialParent};
      created.push(createdFile);
      if (afterRawCopy) {
        await afterRawCopy(Object.freeze({target: target.target,
          relativePath: target.relativePath, createdCount: created.length}));
      }
      const before = await lstat(target.target, {bigint: true});
      const published = await readFile(target.target);
      const after = await lstat(target.target, {bigint: true});
      const parentPostCommit = await directoryCommitIdentity(
        path.dirname(target.target), `${target.relativePath} post-commit parent`);
      invariant(sameDirectoryObject(initialParent, parentPostCommit),
        `${target.relativePath}: parent identity changed during commit`);
      invariant(published.equals(target.bytes),
        `${target.relativePath}: published bytes drifted`);
      invariant(before.isFile() && !before.isSymbolicLink() &&
        before.nlink === 1n && before.size === BigInt(target.bytes.length) &&
        before.dev === after.dev && before.ino === after.ino &&
        before.size === after.size && before.mtimeNs === after.mtimeNs &&
        before.mode === after.mode && before.nlink === after.nlink,
      `${target.relativePath}: published identity drifted`);
      createdFile.identity = Object.freeze({dev: after.dev, ino: after.ino,
        size: after.size, mtimeNs: after.mtimeNs, mode: after.mode,
        nlink: after.nlink});
      const journalPath = path.join(provisionalRoot,
        `${String(index + 1).padStart(3, "0")}.json`);
      await writeFile(journalPath, jsonBytes({schemaVersion: 1,
        state: "provisional-created",
        target: {relativePath: createdFile.relativePath,
          bytes: createdFile.bytes, sha256: createdFile.sha256,
          device: String(createdFile.identity.dev),
          inode: String(createdFile.identity.ino),
          size: String(createdFile.identity.size),
          mtimeNs: String(createdFile.identity.mtimeNs),
          mode: String(createdFile.identity.mode),
          nlink: String(createdFile.identity.nlink)},
        parentInitial: initialParent,
        parentPreCommit,
        parentPostCommit}), {flag: "wx"});
      if (afterCopy) {
        await afterCopy(Object.freeze({target: target.target,
          relativePath: target.relativePath, createdCount: created.length,
          journalPath}));
      }
      if (created.length >= failAfterCopies) {
        throw new Error("injected tracked publication failure");
      }
    }
    await rm(transaction, {recursive: true, force: false});
    return Object.freeze({published: created.length});
  } catch (error) {
    const rollbackErrors = [];
    for (const createdFile of created.reverse()) {
      try {
        invariant(createdFile.identity,
          `${createdFile.relativePath}: provisional publication identity is incomplete; target retained`);
        const rollbackParent = await directoryCommitIdentity(
          path.dirname(createdFile.target),
          `${createdFile.relativePath} rollback parent`);
        invariant(sameDirectoryObject(createdFile.parentIdentity,
          rollbackParent),
        `${createdFile.relativePath}: rollback parent identity changed`);
        const before = await lstat(createdFile.target, {bigint: true});
        const bytes = await readFile(createdFile.target);
        const after = await lstat(createdFile.target, {bigint: true});
        invariant(before.isFile() && !before.isSymbolicLink() &&
          before.nlink === createdFile.identity.nlink &&
          before.dev === createdFile.identity.dev &&
          before.ino === createdFile.identity.ino &&
          before.size === createdFile.identity.size &&
          before.mtimeNs === createdFile.identity.mtimeNs &&
          before.mode === createdFile.identity.mode && before.dev === after.dev &&
          before.ino === after.ino && before.size === after.size &&
          before.mtimeNs === after.mtimeNs && before.mode === after.mode &&
          after.nlink === before.nlink && bytes.length === createdFile.bytes &&
          sha256(bytes) === createdFile.sha256,
        `${createdFile.relativePath}: rollback target changed after publication`);
        await unlink(createdFile.target);
      } catch (rollbackError) {
        rollbackErrors.push(`${createdFile.target}: ${rollbackError.message}`);
      }
    }
    try {
      if (rollbackErrors.length === 0 && await exists(transaction)) {
        await rm(transaction, {recursive: true, force: false});
      }
    } catch (rollbackError) {
      rollbackErrors.push(`${transaction}: ${rollbackError.message}`);
    }
    const suffix = rollbackErrors.length === 0
      ? "" : `; rollback failures: ${rollbackErrors.join(" | ")}`;
    const disposition = rollbackErrors.length === 0
      ? "was rolled back" : "rollback is incomplete";
    throw new Error(`advanced-3 tracked publication failed and ${disposition}${suffix}: ${error.message}`);
  }
}

export async function verifyTrackedOutputs(outputs, {root = PROJECT_ROOT} = {}) {
  for (const [relativePath, expected] of outputs) {
    const absolute = rootPath(root, relativePath, relativePath);
    const metadata = await lstat(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${relativePath} is not one real single-link tracked file`);
    invariant((await readFile(absolute)).equals(expected),
      `${relativePath} is stale`);
  }
}

function expectedRunInputs(context) {
  return Object.freeze({...context.inputBindings,
    calibrationIr: Object.freeze({path: IR_PATH,
      bytes: context.irBinding.bytes, sha256: context.irBinding.sha256}),
    maintainedWrapper: context.wrapperBinding,
    maintainedProductHost: context.productHostBindings,
    generator: context.generatorBinding,
    behaviorSpecifications: context.behaviorBindings});
}

async function buildRun(context) {
  const output = projectPath(OUTPUT_ROOT);
  invariant(!(await exists(output)),
    `${OUTPUT_ROOT} already exists; compiler run is create-exclusive`);
  const stage = `${output}.staging-${process.pid}`;
  invariant(!(await exists(stage)), `staging run already exists: ${stage}`);
  await mkdir(stage, {recursive: false});
  try {
    const results = [];
    for (const placement of context.advanced) {
      results.push(await buildMember({placement,
        definition: definitionById(placement.animationId), context,
        stageRoot: stage}));
    }
    const ffdecAfterExtraction = await verifyFfdecToolchain({
      requestedCommand: context.ffdecToolchain.requestedCommand,
      probeSourceBuffer: context.ffdecProbeSourceBuffer,
    });
    invariant(ffdecAfterExtraction.command === context.ffdecToolchain.command &&
      JSON.stringify(ffdecAfterExtraction.prefixArgs) ===
        JSON.stringify(context.ffdecToolchain.prefixArgs) &&
      JSON.stringify(ffdecAfterExtraction.identity) ===
        JSON.stringify(context.ffdecToolchain.identity),
    "FFDec/Java/classpath toolchain changed during advanced extraction");
    await freezeTree(path.join(stage, "members"));
    const membersInventory = await directoryInventory(path.join(stage,
      "members"));
    const inventoryDocument = {schemaVersion: 1,
      root: `${OUTPUT_ROOT}/members`, ...membersInventory};
    const inventoryBytes = jsonBytes(inventoryDocument);
    await writeFile(path.join(stage, "output-inventory.json"), inventoryBytes,
      {flag: "wx"});
    const tracked = trackedOutputs(context, results);
    const runManifest = {
      schemaVersion: 1,
      artifactType: "g678-advanced-manual-current-js-run-v1",
      runId: RUN_ID,
      status: "private-current-js-modules-generated-product-calibration-blocked",
      deploymentScope: "local-only",
      scope: {frozenCalibrationPlacementCount: 16,
        compiledAdvancedManualPlacementCount: 3,
        shared13PlacementCountChanged: 0,
        registryEntriesWritten: 0,
        webBridgeFilesWritten: 0,
        legacyFlashCourseShellCount: 0},
      inputs: expectedRunInputs(context),
      sourceRoot: {environmentVariable: context.sourceRoot.token,
        relativeRoot: "G6-G8-shared",
        realPathSha256: context.sourceRoot.identity.realPathSha256,
        filesystemIdentity: {device: context.sourceRoot.identity.device,
          inode: context.sourceRoot.identity.inode,
          mode: context.sourceRoot.identity.mode},
        containmentAnchor: context.sourceRoot.identity.sharedRoot,
        requireReadOnlySources: true},
      sourceEvidenceReverification: context.sourceEvidenceBindings,
      behaviorScriptClaimCrosswalk: context.behaviorScriptClaimCrosswalk,
      toolchain: {ffdec: context.ffdecToolchain.identity,
        xmlParser: "/usr/bin/xmllint XPath",
        safeRuntimeRegistry: ASSET_REGISTRY,
        safeAdapter: context.inputBindings.safeCanvasAdapter},
      members: results.map((result) => ({animationId: result.animationId,
        manifestPath: result.manifestPath, manifest: result.manifest,
        runtime: result.runtime, behaviorSpecification: result.behavior,
        behaviorScriptClaims:
          context.behaviorScriptClaimCrosswalk[result.animationId]})),
      outputInventory: {path: `${OUTPUT_ROOT}/output-inventory.json`,
        bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)},
      trackedPublication: {strategy: "create-exclusive-rollback-safe",
        outputs: tracked.descriptors,
        advanced3Fragment: FRAGMENT_PATH},
      feedbackBoundary: tracked.fragment.feedbackBoundary,
      interactiveStopBoundary: tracked.fragment.interactiveStopBoundary,
      seekBoundary: tracked.fragment.seekBoundary,
      licenseBoundary: {ffdecGeneratedRuntimeStorage: "ignored-work-only",
        productBundleAdmission: "blocked-pending-reviewed-license-boundary",
        redistributedBinary: false},
      currentJavaScriptRegistered: false,
      productCalibrationPassed: false,
      engineeringPreviewReady: false,
      scaleOutAuthorized: false,
      acceptanceEffects: ACCEPTANCE_EFFECTS,
    };
    await writeFile(path.join(stage, "run-manifest.json"),
      jsonBytes(runManifest), {flag: "wx"});
    await freezeTree(stage);
    await rename(stage, output);
    try {
      await publishTrackedOutputs(tracked.output);
    } catch (error) {
      const failed = `${output}.failed-tracked-publication-${process.pid}`;
      await rename(output, failed);
      throw new Error(`runtime retained at ${portable(path.relative(PROJECT_ROOT,
        failed))}: ${error.message}`);
    }
    return Object.freeze({run: await fileBinding(
      `${OUTPUT_ROOT}/run-manifest.json`), results, tracked});
  } catch (error) {
    throw new Error(`advanced-manual Current-JS build failed; staging/evidence retained: ${error.message}`);
  }
}

async function rebuildMemberRuntime({context, placement, definition, member,
  manifest, verifiedSource}) {
  const reportPlacement = context.reportMap.get(member.animationId);
  const reportDirectoryRelative = path.dirname(
    context.irBinding.value.inputs.structuralReport.path);
  const expectedXmlPath = portable(path.join(reportDirectoryRelative,
    reportPlacement.structural.swfmill.xml.path));
  invariant(manifest.compiler.rawInputs.swfmillXml.path === expectedXmlPath,
    `${member.animationId}: raw XML path drifted`);
  const xmlRead = await fileBinding(expectedXmlPath, {includeBuffer: true});
  exactBinding(xmlRead, manifest.compiler.rawInputs.swfmillXml,
    `${member.animationId} raw swfmill XML`);
  const parsed = await parseRootTarget({xmlBuffer: xmlRead.buffer, placement});
  invariant(JSON.stringify(parsed.command) ===
    JSON.stringify(manifest.compiler.xmllintRootPlacement),
  `${member.animationId}: raw XML target parse drifted`);

  const finalMemberRoot = `${OUTPUT_ROOT}/members/${member.animationId}`;
  const expectedSpriteRoot = `${finalMemberRoot}/canvas/sprites/DefineSprite_${parsed.target.objectId}`;
  const expectedFramesPath = `${expectedSpriteRoot}/frames.html`;
  const expectedHelperPath = `${expectedSpriteRoot}/canvas.js`;
  invariant(manifest.compiler.rawInputs.framesHtml.path ===
    expectedFramesPath && manifest.compiler.rawInputs.canvasHelper.path ===
    expectedHelperPath,
  `${member.animationId}: raw Canvas input path drifted`);
  const [framesRead, helperRead] = await Promise.all([
    fileBinding(expectedFramesPath, {includeBuffer: true}),
    fileBinding(expectedHelperPath, {includeBuffer: true}),
  ]);
  exactBinding(framesRead, manifest.compiler.rawInputs.framesHtml,
    `${member.animationId} raw frames.html`);
  exactBinding(helperRead, manifest.compiler.rawInputs.canvasHelper,
    `${member.animationId} raw canvas.js`);
  const metadata = deriveFfdecMetadata(framesRead.buffer.toString("utf8"),
    placement);
  const framesBinding = Object.freeze({path: framesRead.path,
    bytes: framesRead.bytes, sha256: framesRead.sha256});
  const helperBinding = Object.freeze({path: helperRead.path,
    bytes: helperRead.bytes, sha256: helperRead.sha256});
  const rebuiltSpec = runtimeSpec({placement, definition, reportPlacement,
    target: parsed.target, metadata, framesBinding, helperBinding,
    finalRuntimePath: member.runtime.path,
    reportBinding: context.irBinding.value.inputs.structuralReport});
  invariant(manifest.runtime.adapterSpec.path ===
    `${finalMemberRoot}/adapter-spec.json`,
  `${member.animationId}: adapter spec path is not canonical`);
  const storedSpec = await readJsonBinding(manifest.runtime.adapterSpec.path);
  exactBinding(storedSpec, manifest.runtime.adapterSpec,
    `${member.animationId} adapter spec`);
  invariant(JSON.stringify(storedSpec.value) ===
    JSON.stringify(rebuiltSpec.value),
  `${member.animationId}: adapter spec does not rebuild from raw evidence`);
  const built = buildSafeRuntime({
    helperSource: helperRead.buffer.toString("utf8"),
    framesHtml: framesRead.buffer.toString("utf8"),
    spec: rebuiltSpec.value,
  });
  const rebuiltRuntime = Buffer.from(finalizeRuntime(built.runtime,
    rebuiltSpec.value, rebuiltSpec.stageMatrix, member.animationId));
  const runtimeRead = await fileBinding(member.runtime.path,
    {includeBuffer: true});
  exactBinding(runtimeRead, member.runtime,
    `${member.animationId} Canvas runtime`);
  invariant(runtimeRead.buffer.equals(rebuiltRuntime),
    `${member.animationId}: runtime does not rebuild from XML/frames/helper/spec`);

  const stagedPath = manifest.compiler.stagedSource.path;
  invariant(stagedPath === `${finalMemberRoot}/compiler-input/source.swf`,
    `${member.animationId}: staged source path drifted`);
  const stagedRead = await fileBinding(stagedPath, {includeBuffer: true});
  exactBinding(stagedRead, manifest.compiler.stagedSource,
    `${member.animationId} staged compiler source`);
  const stagedMetadata = await lstat(projectPath(stagedPath), {bigint: true});
  const stagedParent = path.dirname(projectPath(stagedPath));
  const parentMetadata = await lstat(stagedParent);
  invariant(stagedRead.buffer.equals(verifiedSource.buffer) &&
    stagedMetadata.isFile() && !stagedMetadata.isSymbolicLink() &&
    stagedMetadata.nlink === 1n &&
    (stagedMetadata.mode & 0o777n) === 0o444n &&
    parentMetadata.isDirectory() && !parentMetadata.isSymbolicLink() &&
    (parentMetadata.mode & 0o777) === 0o555 &&
    await realpath(stagedParent) === stagedParent,
  `${member.animationId}: staged compiler source custody drifted`);
  const currentStagedIdentity = Object.freeze({realPath: stagedPath,
    device: String(stagedMetadata.dev), inode: String(stagedMetadata.ino),
    size: String(stagedMetadata.size), mtimeNs: String(stagedMetadata.mtimeNs),
    mode: Number(stagedMetadata.mode & 0o777n),
    nlink: Number(stagedMetadata.nlink)});
  invariant(JSON.stringify(currentStagedIdentity) ===
    JSON.stringify(manifest.compiler.stagedSource.identity),
  `${member.animationId}: staged compiler source identity drifted`);
  invariant(JSON.stringify(manifest.timeline.rootPlacementMatrix) ===
    JSON.stringify(parsed.target.matrix) &&
    manifest.timeline.frameDomain === `sprite-${parsed.target.objectId}` &&
    manifest.timeline.frameCount === metadata.frameCount &&
    manifest.timeline.extractedDrawingLastPlacedFrame ===
      metadata.lastPlacedFrame,
  `${member.animationId}: rebuilt XML/Canvas timeline metadata drifted`);
  return Object.freeze({target: parsed.target, metadata,
    runtimeBuffer: runtimeRead.buffer});
}

async function checkRun(context) {
  await verifyFrozenTree(projectPath(OUTPUT_ROOT));
  const rootEntries = (await readdir(projectPath(OUTPUT_ROOT),
    {withFileTypes: true})).map((entry) => entry.name).sort();
  invariant(JSON.stringify(rootEntries) === JSON.stringify([
    "members", "output-inventory.json", "run-manifest.json",
  ]), "advanced-3 output root entry set drifted");
  const runBinding = await readJsonBinding(`${OUTPUT_ROOT}/run-manifest.json`);
  const run = runBinding.value;
  invariant(run.schemaVersion === 1 &&
    run.artifactType === "g678-advanced-manual-current-js-run-v1" &&
    run.runId === RUN_ID &&
    run.scope?.compiledAdvancedManualPlacementCount === 3 &&
    run.scope?.shared13PlacementCountChanged === 0 &&
    run.scope?.registryEntriesWritten === 0 &&
    run.scope?.webBridgeFilesWritten === 0 &&
    run.currentJavaScriptRegistered === false &&
    run.productCalibrationPassed === false &&
    run.engineeringPreviewReady === false &&
    run.scaleOutAuthorized === false &&
    run.feedbackBoundary?.hostVariantSelectionAlgorithmsRecovered === 2 &&
    run.feedbackBoundary?.pagesBlockedPendingHostVariant === 0 &&
    run.feedbackBoundary?.guessedSelections === 0 &&
    run.feedbackBoundary?.deterministicBranchExhaustionImplemented === true &&
    run.feedbackBoundary?.authoritativeAdobeRandomStateAccepted === false &&
    run.interactiveStopBoundary?.requiresHostInteractiveStop === true &&
    run.interactiveStopBoundary?.affectedPageCount === 2 &&
    run.interactiveStopBoundary?.hostConsumerImplemented === true &&
    run.interactiveStopBoundary?.interactiveResolutionIntentContractImplemented === true &&
    run.interactiveStopBoundary?.interactiveStateQueryContractImplemented === false &&
    run.interactiveStopBoundary?.pageCompletionAllowedWhileUnresolved === false &&
    run.interactiveStopBoundary?.registrationBlockedUntilHostConsumer === false &&
    run.seekBoundary?.requiresHostSeekConsumer === true &&
    run.seekBoundary?.affectedPageCount === 1 &&
    run.seekBoundary?.hostSeekConsumerImplemented === true &&
    run.seekBoundary?.localCanvasPreviewIsOuterPlayheadSeek === false &&
    run.seekBoundary?.registrationBlockedUntilHostSeekConsumer === false &&
    hasExactFalseAcceptanceEffects(run.acceptanceEffects),
  "advanced-3 run identity or authority boundary drifted");
  invariant(run.sourceRoot.environmentVariable === SOURCE_ENVIRONMENT &&
    run.sourceRoot.realPathSha256 === context.sourceRoot.identity.realPathSha256 &&
    run.sourceRoot.filesystemIdentity.device === context.sourceRoot.identity.device &&
    run.sourceRoot.filesystemIdentity.inode === context.sourceRoot.identity.inode &&
    run.sourceRoot.filesystemIdentity.mode === context.sourceRoot.identity.mode,
  "advanced-3 source-root identity drifted");
  invariant(run.sourceRoot.requireReadOnlySources === true &&
    JSON.stringify(run.sourceRoot.containmentAnchor) ===
      JSON.stringify(context.sourceRoot.identity.sharedRoot),
  "advanced-3 read-only shared containment anchor drifted");
  invariant(JSON.stringify(run.toolchain?.ffdec) ===
    JSON.stringify(context.ffdecToolchain.identity),
  "advanced-3 FFDec executable/JAR/version/argv/environment binding drifted");
  invariant(JSON.stringify(run.sourceEvidenceReverification) ===
    JSON.stringify(context.sourceEvidenceBindings),
  "advanced-3 source evidence reverification drifted");
  invariant(JSON.stringify(run.behaviorScriptClaimCrosswalk) ===
    JSON.stringify(context.behaviorScriptClaimCrosswalk) &&
    Object.values(run.behaviorScriptClaimCrosswalk ?? {})
      .reduce((sum, claims) => sum + claims.length, 0) === 17,
  "advanced-3 behavior script claim crosswalk drifted");
  invariant(JSON.stringify(run.inputs) ===
    JSON.stringify(expectedRunInputs(context)),
  "advanced-3 run inputs differ from the canonical current context");
  for (const [key, expected] of Object.entries(run.inputs)) {
    if (key === "behaviorSpecifications" || key === "maintainedProductHost") {
      for (const [bindingId, binding] of Object.entries(expected)) {
        exactBinding(await fileBinding(binding.path), binding,
          `${bindingId} ${key}`);
      }
    } else {
      exactBinding(await fileBinding(expected.path), expected,
        `advanced-3 run input ${key}`);
    }
  }
  invariant(run.outputInventory.path === `${OUTPUT_ROOT}/output-inventory.json`,
    "advanced-3 output inventory path is not canonical");
  const expectedInventoryBinding = await readJsonBinding(
    run.outputInventory.path);
  exactBinding(expectedInventoryBinding, run.outputInventory,
    "advanced-3 output inventory");
  const observedInventory = await directoryInventory(projectPath(
    `${OUTPUT_ROOT}/members`));
  const expectedInventory = expectedInventoryBinding.value;
  invariant(expectedInventory.root === `${OUTPUT_ROOT}/members`,
    "advanced-3 output inventory root is not canonical");
  invariant(JSON.stringify(observedInventory) === JSON.stringify({
    fileCount: expectedInventory.fileCount,
    totalBytes: expectedInventory.totalBytes,
    checksumSetSha256: expectedInventory.checksumSetSha256,
    files: expectedInventory.files}),
  "advanced-3 member inventory drifted");
  const placementMap = new Map(context.advanced.map((placement) =>
    [placement.animationId, placement]));
  const expectedMemberIds = [...placementMap.keys()].sort();
  const observedMemberIds = (run.members ?? [])
    .map(({animationId}) => animationId).sort();
  invariant(expectedMemberIds.length === 3 &&
    new Set(observedMemberIds).size === 3 &&
    JSON.stringify(observedMemberIds) === JSON.stringify(expectedMemberIds),
  "advanced-manual run must contain exactly three unique canonical members");
  const results = [];
  for (const member of run.members ?? []) {
    const placement = placementMap.get(member.animationId);
    const definition = definitionById(member.animationId);
    invariant(placement && definition,
      `${member.animationId}: unexpected member`);
    invariant(member.manifestPath ===
      `${OUTPUT_ROOT}/members/${member.animationId}/member-manifest.json`,
    `${member.animationId}: member manifest path is not canonical`);
    const memberRoot = projectPath(
      `${OUTPUT_ROOT}/members/${member.animationId}`);
    const memberEntries = (await readdir(memberRoot, {withFileTypes: true}))
      .map((entry) => entry.name).sort();
    invariant(JSON.stringify(memberEntries) === JSON.stringify([
      "adapter-spec.json", "canvas", "canvas-renderer.js", "compiler-input",
      "logs", "member-manifest.json", "pcode",
    ]), `${member.animationId}: member root entry set drifted`);
    const compilerInputEntries = (await readdir(path.join(memberRoot,
      "compiler-input"))).sort();
    const logEntries = (await readdir(path.join(memberRoot, "logs"))).sort();
    invariant(JSON.stringify(compilerInputEntries) ===
      JSON.stringify(["source.swf"]) &&
      JSON.stringify(logEntries) === JSON.stringify([
        "ffdec-canvas.stderr.txt", "ffdec-canvas.stdout.txt",
        "ffdec-pcode.stderr.txt", "ffdec-pcode.stdout.txt",
      ]), `${member.animationId}: compiler input/log entry set drifted`);
    const memberManifestBinding = await readJsonBinding(member.manifestPath);
    exactBinding(memberManifestBinding,
      {path: member.manifestPath, ...member.manifest},
      `${member.animationId} member manifest`);
    exactBinding(await fileBinding(member.behaviorSpecification.path),
      member.behaviorSpecification,
      `${member.animationId} behavior specification`);
    const verifiedSource = await sourceFile(placement,
      context.reportMap.get(member.animationId), context.sourceRoot);
    const manifest = memberManifestBinding.value;
    const expectedPrefixArgs = context.ffdecToolchain.prefixArgs.map((value) =>
      value === context.ffdecToolchain.prefixArgs.at(-1)
        ? "<FFDEC_JAR>" : value);
    invariant(manifest.source.sha256 === placement.sourceSha256 &&
      manifest.source.path === `G6-G8-shared/${placement.sourceRelativePath}` &&
      manifest.source.mode === verifiedSource.mode &&
      manifest.source.nlink === verifiedSource.nlink &&
      JSON.stringify(manifest.source.stat) ===
        JSON.stringify(verifiedSource.stat) &&
      JSON.stringify(manifest.sourceEvidenceReverification) ===
        JSON.stringify(context.sourceEvidenceBindings[member.animationId]) &&
      JSON.stringify(member.behaviorScriptClaims) ===
        JSON.stringify(context.behaviorScriptClaimCrosswalk[member.animationId]) &&
      JSON.stringify(manifest.behaviorScriptClaims) ===
        JSON.stringify(context.behaviorScriptClaimCrosswalk[member.animationId]) &&
      JSON.stringify(manifest.maintainedProductHost) ===
        JSON.stringify(context.productHostBindings) &&
      manifest.product.privateCurrentJsModuleGenerated === true &&
      manifest.product.currentJavaScriptRegistered === false &&
      manifest.product.requiresHostInteractiveStop ===
        Boolean(definition.interactiveStop) &&
      manifest.product.requiresHostSeekConsumer ===
        Boolean(definition.interactiveSeek) &&
      manifest.product.hostSeekConsumerImplemented === true &&
      manifest.product.interactiveResolutionIntentContractImplemented === true &&
      manifest.product.feedbackVariantSelection ===
        (definition.behaviorFrame === null
          ? "not-applicable"
          : "source-host-cardinality-page-seed-v1") &&
      manifest.compiler.ffdecToolchainBindingSha256 ===
        sha256(Buffer.from(stableJson(context.ffdecToolchain.identity))) &&
      manifest.compiler.canvasCommand.command ===
        context.ffdecToolchain.command &&
      manifest.compiler.pcodeCommand.command ===
        context.ffdecToolchain.command &&
      JSON.stringify(manifest.compiler.canvasCommand.args) ===
        JSON.stringify([...expectedPrefixArgs,
          ...context.ffdecToolchain.argv.canvas]) &&
      JSON.stringify(manifest.compiler.pcodeCommand.args) ===
        JSON.stringify([...expectedPrefixArgs,
          ...context.ffdecToolchain.argv.pcode]) &&
      manifest.timeline.extractedDrawingLastPlacedFrame ===
        placement.mainChild.frameCount &&
      manifest.timeline.livePlaybackEndFrame ===
        manifest.timeline.extractedDrawingLastPlacedFrame &&
      JSON.stringify(manifest.timeline.interactiveStops) ===
        JSON.stringify(definition.interactiveStop
          ? [definition.interactiveStop] : []) &&
      JSON.stringify(manifest.timeline.interactiveSeek) ===
        JSON.stringify(definition.interactiveSeek) &&
      manifest.product.productCalibrationPassed === false &&
      hasExactFalseAcceptanceEffects(manifest.acceptanceEffects),
    `${member.animationId}: member source/product boundary drifted`);
    const [canvasInventory, pcodeInventory] = await Promise.all([
      directoryInventory(projectPath(
        `${OUTPUT_ROOT}/members/${member.animationId}/canvas`)),
      directoryInventory(projectPath(
        `${OUTPUT_ROOT}/members/${member.animationId}/pcode`)),
    ]);
    invariant(JSON.stringify(canvasInventory) ===
      JSON.stringify(manifest.compiler.canvasInventory) &&
      JSON.stringify(pcodeInventory) ===
        JSON.stringify(manifest.compiler.pcodeInventory),
    `${member.animationId}: compiler subtree inventory drifted`);
    const rebuilt = await rebuildMemberRuntime({context, placement,
      definition, member, manifest, verifiedSource});
    results.push(Object.freeze({animationId: member.animationId, placement,
      definition, target: rebuilt.target,
      metadata: rebuilt.metadata,
      runtime: member.runtime, manifestPath: member.manifestPath,
      manifest: member.manifest,
      behavior: member.behaviorSpecification}));
  }
  invariant(results.length === 3,
    "advanced-manual run must contain exactly three verified members");
  const tracked = trackedOutputs(context, results);
  await verifyTrackedOutputs(tracked.output);
  invariant(JSON.stringify(run.trackedPublication.outputs) ===
    JSON.stringify(tracked.descriptors),
  "advanced-3 tracked publication descriptors drifted");
  return Object.freeze({run: {path: runBinding.path,
    bytes: runBinding.bytes, sha256: runBinding.sha256}, results, tracked});
}

export async function runAdvancedManual({check = false} = {}) {
  const context = await loadContext();
  const result = check ? await checkRun(context) : await buildRun(context);
  return Object.freeze({runId: RUN_ID, check,
    advancedManualModuleCount: 3,
    compilerRun: result.run.path,
    fragment: FRAGMENT_PATH,
    currentJavaScriptRegistered: false,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    requiresHostInteractiveStop: true,
    requiresHostSeekConsumer: true,
    scaleOutAuthorized: false,
    acceptanceEffects: ACCEPTANCE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  runAdvancedManual(options).then((result) => {
    process.stdout.write(stableJson(result));
  }).catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
