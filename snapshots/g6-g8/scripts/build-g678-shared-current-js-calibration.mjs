#!/usr/bin/env node

/**
 * Compile the thirteen reviewed shared-adapter G6-G8 calibration placements.
 *
 * Raw FFDec Canvas/P-code output and safe runtimes stay below ignored `work/`.
 * Tracked output is limited to compact source-bound timeline/module wrappers,
 * one partial 13/16 freeze, and one local-only private-registry fragment.
 * No AVM1, audio, behavior, fidelity, review, release, or publication gate is
 * advanced by this generator.
 */

import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import {constants as fsConstants} from "node:fs";
import path from "node:path";
import {Script} from "node:vm";
import {fileURLToPath} from "node:url";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const GENERATOR_PATH =
  "scripts/build-g678-shared-current-js-calibration.mjs";
export const IR_PATH =
  "catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.ir.json";
export const FREEZE_PATH =
  "catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.json";
export const FRAGMENT_PATH =
  "catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.fragment.json";
export const OUTPUT_ROOT =
  "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1";
export const CALIBRATION_ID = "g678-16-page-product-calibration-v1";

const ASSET_REGISTRY = "HELP_MATH_CANVAS_ASSETS";
const CANVAS_FORMATS = "frame:canvas,sprite:canvas,script:as";
const CANVAS_ITEMS = "frame,sprite,script,image,sound";
const SHA256 = /^[a-f0-9]{64}$/u;
const ANIMATION_ID = /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;
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
  authoritativeOriginalRuntime: false,
  behaviorParityAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  published: false,
});

const LICENSE_BOUNDARY = Object.freeze({
  compilerInputCopyStorage: "ignored-private-work-only",
  ffdecGeneratedRuntimeStorage: "ignored-work-only",
  productBundleAdmission: "blocked-pending-reviewed-license-boundary",
  redistributedBinary: false,
});

const RUN_STATUS = "runtime-generated-product-calibration-blocked";
const REVIEWED_ROUTING_SHA256 =
  "c6d70fc0bbecce0e76f2b5501e5cc2c226ec2245ccc40ed226e89563d05c8f01";
const REVIEWED_SHARED_IDS = Object.freeze([
  "shared-alg001-l01-p001", "shared-alg001-l05-p030",
  "shared-alg001-l06-p040", "shared-alg001-l08-p025",
  "shared-dat001-l01-p001", "shared-dat001-l03-p030",
  "shared-dat001-l07-p025", "shared-geo001-l02-p020",
  "shared-geo001-l07-p040", "shared-geo001-l11-p030",
  "shared-nms002-l01-p001", "shared-nms002-l02-p020",
  "shared-nms002-l05-p040",
]);
const REVIEWED_ADVANCED_IDS = Object.freeze([
  "shared-dat001-l05-p040", "shared-geo001-l01-p001",
  "shared-nms002-l11-p030",
]);

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
  const sortedExpectedKeys = [...expectedKeys].sort();
  const actualKeys = Object.keys(value).sort();
  return JSON.stringify(actualKeys) === JSON.stringify(sortedExpectedKeys) &&
    sortedExpectedKeys.every((key) => value[key] === false);
}

function hasExactFalseAcceptanceEffects(value) {
  return hasExactFalseKeys(value, Object.keys(ACCEPTANCE_EFFECTS));
}

const RUNTIME_BLOCKLIST = Object.freeze([
  ["dynamic evaluation", /\b(?:eval|Function)\s*\(/u],
  ["network primitive", /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/u],
  ["timer or animation loop", /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/u],
  ["persistent storage", /\b(?:localStorage|sessionStorage|indexedDB)\b/u],
  ["ambient event listener", /\b(?:addEventListener|removeEventListener)\s*\(/u],
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

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath, label = "project path") {
  invariant(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), `${label} must be project-relative`);
  const absolute = path.resolve(PROJECT_ROOT, relativePath);
  invariant(absolute.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${label} escapes the worktree`);
  return absolute;
}

async function binding(relativePath) {
  const file = await readProjectFileBinding(relativePath);
  return Object.freeze({path: file.path, bytes: file.bytes,
    sha256: file.sha256});
}

async function readProjectFileBinding(relativePath, parseJson = false) {
  const absolute = projectPath(relativePath, relativePath);
  const resolved = await realpath(absolute);
  const before = await lstat(absolute, {bigint: true});
  invariant(resolved === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be a canonical ordinary single-link file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(after.isFile() && !after.isSymbolicLink() && after.nlink === 1n &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode,
  `${relativePath} changed while it was read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes),
    ...(parseJson ? {value: JSON.parse(bytes.toString("utf8"))} : {})});
}

async function externalFileBinding(absolutePath, label,
  allowedLinkCounts = Object.freeze([1n])) {
  const canonical = path.resolve(absolutePath);
  const before = await lstat(canonical, {bigint: true});
  const resolved = await realpath(absolutePath);
  invariant(resolved === canonical && before.isFile() &&
    !before.isSymbolicLink() && allowedLinkCounts.includes(before.nlink),
  `${label} must be a canonical ordinary file with an allowed link count`);
  const bytes = await readFile(resolved);
  const after = await lstat(canonical, {bigint: true});
  invariant(after.isFile() && !after.isSymbolicLink() &&
    allowedLinkCounts.includes(after.nlink) &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode,
  `${label} changed while it was read`);
  return Object.freeze({realPathSha256: sha256(resolved),
    bytes: bytes.length, sha256: sha256(bytes),
    mode: Number(after.mode & 0o777n), nlink: Number(after.nlink)});
}

async function resolvePathExecutable(name) {
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      const metadata = await lstat(candidate);
      if (metadata.isFile() || metadata.isSymbolicLink()) {
        return await realpath(candidate);
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`${name} is not available on PATH`);
}

async function captureToolOutput(command, args) {
  const child = spawn(command, args, {
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = [];
  const stderr = [];
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({code, signal}));
  });
  const stdoutBytes = Buffer.concat(stdout);
  const stderrBytes = Buffer.concat(stderr);
  invariant(result.code === 0 && result.signal === null &&
    stdoutBytes.length + stderrBytes.length < 1024 * 1024,
  `${command} version probe failed`);
  return Object.freeze({code: result.code, signal: result.signal,
    args: Object.freeze([...args]),
    stdoutBytes,
    stderrBytes,
    stdout: Object.freeze({bytes: stdoutBytes.length,
      sha256: sha256(stdoutBytes)}),
    stderr: Object.freeze({bytes: stderrBytes.length,
      sha256: sha256(stderrBytes)}),
    versionTextSha256: sha256(Buffer.concat([stdoutBytes, stderrBytes]))});
}

function toolOutputReceipt(output) {
  return Object.freeze({code: output.code, signal: output.signal,
    args: output.args, stdout: output.stdout, stderr: output.stderr,
    versionTextSha256: output.versionTextSha256});
}

function manifestClassPath(manifestBytes) {
  const physical = manifestBytes.toString("utf8")
    .replace(/\r\n?/gu, "\n").split("\n");
  const logical = [];
  for (const line of physical) {
    if (line.startsWith(" ") && logical.length > 0) {
      logical[logical.length - 1] += line.slice(1);
    } else logical.push(line);
  }
  const declaration = logical.find((line) => line.startsWith("Class-Path: "));
  invariant(declaration, "FFDec JAR manifest Class-Path is missing");
  const entries = declaration.slice("Class-Path: ".length).trim()
    .split(/\s+/u).filter(Boolean).sort();
  invariant(entries.length > 0 && new Set(entries).size === entries.length,
    "FFDec JAR manifest Class-Path is empty or duplicated");
  return Object.freeze(entries);
}

async function resolveFfdecToolchain() {
  const launcherPath = await resolvePathExecutable("ffdec");
  invariant(launcherPath.endsWith("/FFDec.app/Contents/Resources/ffdec.sh"),
    "ffdec must resolve to the reviewed FFDec application launcher");
  const criticalEnvironment = Object.fromEntries(
    FFDEC_CRITICAL_ENVIRONMENT.map((name) =>
      [name, process.env[name] ?? null]),
  );
  invariant(Object.values(criticalEnvironment).every((value) => value === null),
    "critical FFDec and Java environment overrides must be absent");
  const resources = path.dirname(launcherPath);
  const jarPath = path.join(resources, "ffdec.jar");
  const infoPath = path.resolve(resources, "../Info.plist");
  const javaPath = await resolvePathExecutable("java");
  const unzipPath = "/usr/bin/unzip";
  const [launcher, jar, infoPlist, java, unzip, infoBytes] = await Promise.all([
    externalFileBinding(launcherPath, "FFDec launcher"),
    externalFileBinding(jarPath, "FFDec JAR"),
    externalFileBinding(infoPath, "FFDec Info.plist"),
    externalFileBinding(javaPath, "Java launcher"),
    // `/usr/bin/unzip` is an Apple sealed-system hardlink (nlink=2).
    externalFileBinding(unzipPath, "manifest extractor", [2n]),
    readFile(infoPath, "utf8"),
  ]);
  const manifest = await captureToolOutput(unzipPath,
    ["-p", jarPath, "META-INF/MANIFEST.MF"]);
  invariant(manifest.stdoutBytes.length > 0 && manifest.stderrBytes.length === 0,
    "FFDec JAR manifest extraction failed");
  const classPathEntries = manifestClassPath(manifest.stdoutBytes);
  const jarRoot = path.dirname(jarPath);
  const libraries = [];
  for (const entry of classPathEntries) {
    invariant(!path.isAbsolute(entry) && !entry.includes(":") &&
      !entry.split("/").includes(".."),
    `FFDec JAR Class-Path entry is unsafe: ${entry}`);
    const absolute = path.resolve(jarRoot, entry);
    invariant(absolute.startsWith(`${jarRoot}${path.sep}`),
      `FFDec JAR Class-Path entry escapes its root: ${entry}`);
    libraries.push(Object.freeze({entry,
      ...await externalFileBinding(absolute,
        `FFDec JAR Class-Path ${entry}`)}));
  }
  const javaPrefixArgs = Object.freeze([
    "-Djava.net.preferIPv4Stack=true",
    "-Djna.nosys=true",
    "-Djava.util.Arrays.useLegacyMergeSort=true",
    "-Xmx1024m",
    "-jar",
    jarPath,
  ]);
  const [javaVersion, ffdecLiveProbe] = await Promise.all([
    captureToolOutput(javaPath, ["-version"]),
    captureToolOutput(javaPath, [...javaPrefixArgs, "-help"]),
  ]);
  const version = infoBytes.match(
    /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/u,
  )?.[1];
  invariant(version === "26.2.1",
    `reviewed FFDec version drifted: ${version ?? "missing"}`);
  return Object.freeze({command: javaPath, prefixArgs: javaPrefixArgs,
    identity: Object.freeze({version,
    launcher, jar, infoPlist, java,
    javaVersion: toolOutputReceipt(javaVersion),
    ffdecLiveProbe: toolOutputReceipt(ffdecLiveProbe),
    manifestExtractor: unzip,
    jarManifest: Object.freeze({bytes: manifest.stdoutBytes.length,
      sha256: sha256(manifest.stdoutBytes),
      classPathChecksumSetSha256: sha256(Buffer.from(libraries.map((entry) =>
        `${entry.sha256}  ${entry.entry}\n`).join("")))}),
    classPathLibraries: Object.freeze(libraries),
    environment: Object.freeze({
      javaHomeSha256: sha256(process.env.JAVA_HOME ?? ""),
      criticalVariables: Object.freeze(criticalEnvironment),
      lang: process.env.LANG ?? null,
      lcAll: process.env.LC_ALL ?? null,
      lcCtype: process.env.LC_CTYPE ?? null,
      timezone: process.env.TZ ?? null}),
    invocation: Object.freeze({command: "<BOUND_JAVA_EXECUTABLE>",
      prefixArgs: Object.freeze(javaPrefixArgs.map((value) =>
        value === jarPath ? "<BOUND_FFDEC_JAR>" : value))})})});
}

async function readJsonBinding(relativePath) {
  return readProjectFileBinding(relativePath, true);
}

function exactBinding(actual, expected, label) {
  invariant(actual?.path === expected.path &&
    actual.bytes === expected.bytes && actual.sha256 === expected.sha256,
  `${label} binding drifted`);
}

export function parseArguments(argv) {
  invariant(argv.length <= 1 && [undefined, "--check"].includes(argv[0]),
    `usage: node ${GENERATOR_PATH} [--check]`);
  return Object.freeze({check: argv[0] === "--check"});
}

async function exists(absolute) {
  return lstat(absolute).then(() => true, (error) => {
    if (error?.code === "ENOENT") return false;
    throw error;
  });
}

async function walkFiles(root, current = root, rows = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `generated output contains a symlink: ${absolute}`);
    if (metadata.isDirectory()) await walkFiles(root, absolute, rows);
    else {
      invariant(metadata.isFile() && metadata.nlink === 1,
        `generated output is not a single-link regular file: ${absolute}`);
      const bytes = await readFile(absolute);
      rows.push(Object.freeze({path: portable(path.relative(root, absolute)),
        bytes: bytes.length, sha256: sha256(bytes), mode: metadata.mode & 0o777}));
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

async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `cannot freeze symlinked output: ${absolute}`);
    if (metadata.isDirectory()) await freezeTree(absolute);
    else {
      invariant(metadata.isFile() && metadata.nlink === 1,
        `cannot freeze non-regular or hardlinked output: ${absolute}`);
      await chmod(absolute, 0o444);
    }
  }
  await chmod(root, 0o555);
}

async function verifyFrozenTree(root) {
  const rootMetadata = await lstat(root);
  invariant(rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink() &&
    (rootMetadata.mode & 0o777) === 0o555,
  `generated directory is not read-only: ${root}`);
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `generated output contains a symlink: ${absolute}`);
    if (metadata.isDirectory()) await verifyFrozenTree(absolute);
    else invariant(metadata.isFile() && metadata.nlink === 1 &&
      (metadata.mode & 0o777) === 0o444,
    `generated file is writable, hardlinked, or non-regular: ${absolute}`);
  }
}

function redactCommandArg(value, source, output, redactions) {
  if (value === source) return "<SOURCE_SWF>";
  if (value === output) return "<OUTPUT_DIRECTORY>";
  const replacement = redactions.find(([actual]) => value === actual)?.[1];
  if (replacement) return replacement;
  return value;
}

async function runCommand({command, args, cwd, logs, source, output,
  redactions = []}) {
  const child = spawn(command, args, {cwd, stdio: ["ignore", "pipe", "pipe"]});
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
    writeFile(`${logs}.stdout.txt`, stdoutBuffer, {flag: "wx"}),
    writeFile(`${logs}.stderr.txt`, stderrBuffer, {flag: "wx"}),
  ]);
  invariant(result.code === 0 && result.signal === null &&
    stdoutBytes <= maximum && stderrBytes <= maximum,
  `${command} failed with code=${result.code} signal=${result.signal}`);
  return Object.freeze({command,
    args: Object.freeze(args.map((value) =>
      redactCommandArg(value, source, output, redactions))),
    exitCode: result.code,
    stdout: Object.freeze({bytes: stdoutBuffer.length,
      sha256: sha256(stdoutBuffer)}),
    stderr: Object.freeze({bytes: stderrBuffer.length,
      sha256: sha256(stderrBuffer)})});
}

function attributes(source) {
  return Object.fromEntries([...source.matchAll(
    /([A-Za-z][A-Za-z0-9]*)="([^"]*)"/gu,
  )].map((match) => [match[1], match[2]]));
}

function parseRootTarget(xml, placement) {
  const matches = [...xml.matchAll(
    /^      <PlaceObject2\b([^>]*\bname="(?:animation|Animation)"[^>]*)>([\s\S]*?)^      <\/PlaceObject2>/gmu,
  )];
  invariant(matches.length === 1,
    `${placement.animationId}: expected one direct animation placement`);
  const placed = attributes(matches[0][1]);
  const transformMatch = matches[0][2].match(/<Transform([^>]*)\/>/u);
  invariant(transformMatch, `${placement.animationId}: root transform is missing`);
  const transform = attributes(transformMatch[1]);
  const number = (key, fallback) => transform[key] === undefined
    ? fallback : Number(transform[key]);
  const objectId = Number(placed.objectID);
  const directRootShowFramesBeforePlacement = [...xml
    .slice(0, matches[0].index)
    .matchAll(/^      <ShowFrame\/>$/gmu)].length;
  const beginFrame = directRootShowFramesBeforePlacement + 1;
  // PlaceObject `morph` is a ratio, not a frame ordinal. The reviewed sources
  // happen to encode the same value, so retain it only as a drift witness.
  invariant(Number(placed.morph) === directRootShowFramesBeforePlacement,
    `${placement.animationId}: root placement ratio witness drifted`);
  const matrix = Object.freeze({
    a: number("scaleX", 1), b: number("skewY", 0),
    c: number("skewX", 0), d: number("scaleY", 1),
    tx: number("transX", 0) / 20, ty: number("transY", 0) / 20,
  });
  invariant(objectId === placement.mainChild.objectId &&
    beginFrame === placement.rootBeginFrame &&
    Object.values(matrix).every(Number.isFinite),
  `${placement.animationId}: reviewed root placement drifted`);
  return Object.freeze({objectId, beginFrame, matrix,
    instanceName: placed.name, depth: placed.depth});
}

function deriveFfdecMetadata(framesHtml, placement) {
  const normalized = framesHtml.replace(/\r\n?/gu, "\n");
  const canvas = normalized.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u,
  );
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
    "var frame_cnt = (\\d+);",
  ));
  invariant(header, `${placement.animationId}: target sprite header drifted`);
  const frameCount = Number(header[3]);
  invariant(frameCount === placement.mainChild.frameCount,
    `${placement.animationId}: reviewed child frame count drifted`);
  const targetEnd = definitions.indexOf("\nfunction ",
    header.index + header[0].length);
  const targetSource = definitions.slice(header.index,
    targetEnd < 0 ? definitions.length : targetEnd);
  const cases = [...targetSource.matchAll(
    /case\s+(\d+):([\s\S]*?)(?=\n\s*case\s+\d+:|\n\s*\})/gu,
  )];
  const caseIndices = cases.map((match) => Number(match[1]));
  const expectedCaseIndices = Array.from({length: frameCount},
    (_, index) => index);
  invariant(cases.length === frameCount &&
    JSON.stringify(caseIndices) === JSON.stringify(expectedCaseIndices),
    `${placement.animationId}: target frame inventory drifted`);
  invariant(Number(canvas[1]) === placement.ffdecExportCanvas?.width &&
    Number(canvas[2]) === placement.ffdecExportCanvas?.height,
  `${placement.animationId}: reviewed FFDec child export Canvas dimensions drifted`);
  const placedFrames = cases.filter((match) => match[2].includes('place("'))
    .map((match) => Number(match[1]) + 1);
  invariant(placedFrames.length > 0,
    `${placement.animationId}: target sprite draws no frames`);
  const placedFunctions = [...new Set([...definitions.matchAll(
    /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu,
  )].map((match) => match[1]))].sort();
  const fontFunctions = [...definitions.matchAll(
    /function\s+(font\d+)\(ctx,ch,textColor\)\{/gu,
  )].map((match) => match[1]);
  const imageVariables = [...definitions.matchAll(
    /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu,
  )].map((match) => match[1]);
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
  invariant(first >= 0 && source.indexOf(marker, first + marker.length) < 0,
    `${label} marker count drifted`);
  return `${source.slice(0, first)}${replacement}${source.slice(first + marker.length)}`;
}

function finalizeRuntime(runtime, builtMetadata, spec, placement, target,
  stageMatrix) {
  const literal = (value) => Object.is(value, -0) ? "0" : String(value);
  let next = replaceExactlyOnce(runtime,
    `ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});`,
    `ctx.transform(${[stageMatrix.a, stageMatrix.b, stageMatrix.c,
      stageMatrix.d, stageMatrix.e, stageMatrix.f].map(literal).join(", ")});`,
    `${placement.animationId} root transform`);
  const alias = JSON.stringify(spec.animationId);
  const actual = JSON.stringify(placement.animationId);
  const identityOccurrences = next.split(alias).length - 1;
  invariant(identityOccurrences >= 2,
    `${placement.animationId}: safe runtime identity is missing`);
  next = next.split(alias).join(actual);
  const mutableRegistration =
    `registry[${actual}] = Object.freeze({metadata: METADATA, ready: ready, ` +
    "resolveFrameState: resolveFrameState, render: render});";
  const immutableRegistration =
    `Object.defineProperty(registry, ${actual}, {value: Object.freeze({metadata: METADATA, ready: ready, ` +
    "resolveFrameState: resolveFrameState, render: render}), configurable: false, enumerable: true, writable: false});";
  next = replaceExactlyOnce(next, mutableRegistration, immutableRegistration,
    `${placement.animationId} immutable Canvas registry entry`);
  next = replaceExactlyOnce(next,
    "/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */",
    `/* Generated by ${GENERATOR_PATH} through the hash-bound safe FFDec Canvas adapter. */`,
    `${placement.animationId} generator header`);
  const oldMetadata = `var METADATA = deepFreeze(${JSON.stringify({
    ...builtMetadata,
    animationId: spec.animationId,
  }, null, 2)});`;
  // The safe adapter currently derives animationId before returning metadata;
  // identity replacement above already updates the emitted literal. This
  // assertion prevents a future silent metadata-shape change.
  invariant(!next.includes(alias) && !next.includes(oldMetadata),
    `${placement.animationId}: adapter alias survived runtime finalization`);
  new Script(next, {filename: `${placement.animationId}-canvas-renderer.js`});
  for (const [label, pattern] of RUNTIME_BLOCKLIST) {
    invariant(!pattern.test(next),
      `${placement.animationId}: safe runtime contains ${label}`);
  }
  invariant(target.objectId === placement.mainChild.objectId,
    `${placement.animationId}: runtime target changed`);
  return next;
}

function adapterSpec({placement, reportPlacement, target, metadata,
  framesBinding, helperBinding, finalRuntimePath, inputBindings}) {
  const stageMatrix = composeStageMatrix(target.matrix,
    metadata.internalTranslation);
  // The compiler artifact is a deterministic visual frame inspector. Missing
  // host/glossary/hover/audio behavior remains an explicit product blocker,
  // but it must not suppress the source-derived drawing frames themselves.
  const blockedLocalFrameRanges = [];
  const aliasAnimationId = `course-${placement.animationId}`;
  const value = {
    schemaVersion: 1,
    animationId: aliasAnimationId,
    builderAnimationId: aliasAnimationId,
    finalAnimationId: placement.animationId,
    classification: "private-g678-local-current-js-engineering",
    title: `${placement.animationId} reviewed child timeline`,
    source: {swf: `$G678_SOURCE_ROOT/G6-G8-shared/${placement.sourceRelativePath}`,
      swfBytes: reportPlacement.source.bytes,
      swfSha256: placement.sourceSha256},
    evidence: {
      scenarioInventory: inputBindings.structuralReport.path,
      scenarioInventorySha256: inputBindings.structuralReport.sha256,
      audioAudit: inputBindings.structuralReport.path,
      audioAuditSha256: inputBindings.structuralReport.sha256,
    },
    ffdecExport: {
      tool: "JPEXS Free Flash Decompiler 26.2.1 Canvas export",
      helper: helperBinding.path,
      helperSha256: helperBinding.sha256,
      helperBytes: helperBinding.bytes,
      framesHtml: framesBinding.path,
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
      embeddedImageVariablesSha256: metadata.imageVariables.sha256,
    },
    timeline: {
      fps: reportPlacement.structural.ffdecHeader.frameRate,
      stage: {width: reportPlacement.structural.ffdecHeader.widthPx,
        height: reportPlacement.structural.ffdecHeader.heightPx,
        backgroundColor: "#b8d8f7"},
      root: {frameCount: placement.rootFrameCount, preloaderStopFrame: 1,
        beginFrame: placement.rootBeginFrame, beginLabel: "begin",
        placementName: target.instanceName, placementDepth: target.depth,
        placementTwips: {x: target.matrix.tx * 20, y: target.matrix.ty * 20},
        placementPixels: {x: target.matrix.tx, y: target.matrix.ty}},
      local: {timelineId: `sprite-${target.objectId}`,
        frameCount: placement.mainChild.frameCount,
        livePlaybackEndFrame: metadata.lastPlacedFrame,
        playbackMode: "once", publicFrameIndexing: "one-indexed"},
      stageRenderOffset: {
        x: target.matrix.tx - metadata.internalTranslation.x,
        y: target.matrix.ty - metadata.internalTranslation.y,
      },
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "fixed-zero-no-source-randomness-executed",
      blockedLocalFrameRanges,
      unresolved: [
        ...placement.productBlockers,
        "AVM1 is classified P-code only and is never executed.",
        "Embedded streaming audio is not compiled or accepted.",
        "Original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.",
      ],
      currentCanonicalFrameDomainDispositionAsserted: false,
    },
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

function structuralPlacementMap(report) {
  return new Map((report.placements ?? []).map((placement) =>
    [placement.placementId, placement]));
}

function factoryPlacementMap(factory) {
  return new Map((factory.sourcePlacements ?? []).map((placement) =>
    [placement.placementId, placement]));
}

function catalogContext(catalog) {
  const pages = new Map();
  const lessons = new Map();
  for (const lesson of catalog.lessons ?? []) {
    lessons.set(lesson.stableLessonKey, lesson);
    for (const page of lesson.pages ?? []) pages.set(page.animationId,
      {page, lesson});
  }
  return Object.freeze({pages, lessons});
}

export function validateCalibrationIr(ir, report, factory, catalog) {
  invariant(ir?.schemaVersion === 1 &&
    ir.artifactType === "g678-shared-current-js-calibration-ir-v1" &&
    ir.calibrationId === CALIBRATION_ID &&
    ir.scope?.frozenCalibrationPlacementCount === 16 &&
    ir.scope?.sharedAdapterPlacementCount === 13 &&
    ir.scope?.advancedManualPlacementCount === 3 &&
    ir.scope?.legacyFlashCourseShellCount === 0 &&
    ir.scope?.deploymentScope === "local-only" &&
    Array.isArray(ir.placements) && ir.placements.length === 16 &&
    hasExactFalseAcceptanceEffects(ir.acceptanceEffects),
  "G6-G8 calibration IR identity or authority boundary is invalid");
  const routingProjection = ir.placements.map((placement) => ({
    animationId: placement.animationId,
    sourceRelativePath: placement.sourceRelativePath,
    sourceSha256: placement.sourceSha256,
    rootFrameCount: placement.rootFrameCount,
    rootBeginFrame: placement.rootBeginFrame,
    mainChild: placement.mainChild,
    ffdecExportCanvas: placement.ffdecExportCanvas ?? null,
    reviewedLane: placement.reviewedLane,
    adapterFamily: placement.adapterFamily,
    implementationDisposition: placement.implementationDisposition,
    productBlockers: placement.productBlockers,
  }));
  invariant(sha256(JSON.stringify(routingProjection)) ===
    REVIEWED_ROUTING_SHA256,
  "G6-G8 reviewed 16-placement routing allowlist drifted");
  const structural = structuralPlacementMap(report);
  const factoryPlacements = factoryPlacementMap(factory);
  const catalogData = catalogContext(catalog);
  const ids = new Set();
  let shared = 0;
  let advanced = 0;
  for (const placement of ir.placements) {
    invariant(ANIMATION_ID.test(placement.animationId) &&
      !ids.has(placement.animationId) &&
      SHA256.test(placement.sourceSha256) &&
      Number.isSafeInteger(placement.rootFrameCount) &&
      Number.isSafeInteger(placement.rootBeginFrame) &&
      Number.isSafeInteger(placement.mainChild?.objectId) &&
      Number.isSafeInteger(placement.mainChild?.frameCount) &&
      ["interactive-understood", "behavior-heavy"].includes(
        placement.reviewedLane) &&
      Array.isArray(placement.productBlockers) &&
      placement.productBlockers.length > 0,
    `${placement.animationId}: calibration IR placement is invalid`);
    ids.add(placement.animationId);
    if (placement.implementationDisposition === "shared-adapter") {
      invariant(Number.isSafeInteger(placement.ffdecExportCanvas?.width) &&
        placement.ffdecExportCanvas.width > 0 &&
        Number.isSafeInteger(placement.ffdecExportCanvas?.height) &&
        placement.ffdecExportCanvas.height > 0,
      `${placement.animationId}: reviewed FFDec child export Canvas is invalid`);
      shared += 1;
    }
    else if (placement.implementationDisposition === "advanced-manual") advanced += 1;
    else invariant(false,
      `${placement.animationId}: implementation disposition is invalid`);
    const observed = structural.get(placement.animationId);
    const factoryPlacement = factoryPlacements.get(placement.animationId);
    const catalogPage = catalogData.pages.get(placement.animationId)?.page;
    invariant(observed?.source?.sha256 === placement.sourceSha256 &&
      observed.source.sourceRelativePath === placement.sourceRelativePath &&
      observed.structural?.ffdecHeader?.frameCount === placement.rootFrameCount &&
      observed.structural?.ffdecHeader?.frameRate === 12 &&
      observed.structural?.ffdecHeader?.widthPx === 800 &&
      observed.structural?.ffdecHeader?.heightPx === 600 &&
      factoryPlacement?.sourceSha256 === placement.sourceSha256 &&
      factoryPlacement.sourcePath ===
        `G6-G8-shared/${placement.sourceRelativePath}` &&
      catalogPage?.sourceSha256 === placement.sourceSha256,
    `${placement.animationId}: report/factory/catalog binding drifted`);
    const child = observed.structural.swfmill.nestedSprites.find((sprite) =>
      sprite.objectId === placement.mainChild.objectId);
    invariant(child?.frameCount === placement.mainChild.frameCount,
      `${placement.animationId}: reviewed main child drifted`);
  }
  invariant(shared === 13 && advanced === 3 &&
    JSON.stringify(ir.placements
      .filter(({implementationDisposition}) =>
        implementationDisposition === "shared-adapter")
      .map(({animationId}) => animationId).sort()) ===
      JSON.stringify(REVIEWED_SHARED_IDS) &&
    JSON.stringify(ir.placements
      .filter(({implementationDisposition}) =>
        implementationDisposition === "advanced-manual")
      .map(({animationId}) => animationId).sort()) ===
      JSON.stringify(REVIEWED_ADVANCED_IDS) &&
    report.summary?.selectedPlacementCount === 16 &&
    factory.sourceIdentity?.placementCount === 16,
  "G6-G8 calibration 13/3 split drifted");
  return Object.freeze({structural, factoryPlacements, catalogData});
}

async function loadContext() {
  const irBinding = await readJsonBinding(IR_PATH);
  const inputBindings = {};
  const inputValues = {};
  for (const [key, expected] of Object.entries(irBinding.value.inputs)) {
    const current = expected.path.endsWith(".json")
      ? await readJsonBinding(expected.path)
      : await binding(expected.path);
    exactBinding(current, expected, `IR ${key}`);
    inputBindings[key] = Object.freeze({path: current.path,
      bytes: current.bytes, sha256: current.sha256});
    if ("value" in current) inputValues[key] = current.value;
  }
  const report = inputValues.structuralReport;
  const factory = inputValues.structuralFactoryRun;
  const catalog = inputValues.sharedCatalog;
  invariant(report.status === "structural-audit-only" &&
    hasExactFalseKeys(report.acceptanceEffects,
      STRUCTURAL_REPORT_ACCEPTANCE_KEYS),
  "structural report crossed the acceptance boundary");
  invariant(factory.manifestKind === "FactoryRunManifestV2" &&
    factory.mode === "calibrate" &&
    hasExactFalseKeys(factory.acceptanceEffects, FACTORY_ACCEPTANCE_KEYS),
  "structural factory run crossed the acceptance boundary");
  const validated = validateCalibrationIr(irBinding.value, report, factory,
    catalog);
  const [sourceRoot, ffdec] = await Promise.all([
    resolveSourceRoot(irBinding.value),
    resolveFfdecToolchain(),
  ]);
  return Object.freeze({irBinding, inputBindings, report, factory, catalog,
    sourceRoot, ffdec, ...validated});
}

async function resolveSourceRoot(ir) {
  const token = "HELP_MATH_G678_SOURCE_ROOT";
  const supplied = process.env[token];
  invariant(typeof supplied === "string" && supplied.trim().length > 0,
    `${token} is required and must name the exact reviewed G6-G8 source root`);
  const root = path.resolve(supplied);
  const rootReal = await realpath(root);
  invariant(rootReal === root && root === ir.sourceRoot?.configuredRoot,
    `${token} must resolve exactly to the IR-reviewed source root`);
  const metadata = await lstat(root);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    (metadata.mode & 0o222) === 0,
    `${token} must name a real directory`);
  invariant(ir.sourceRoot?.relativeRoot === "G6-G8-shared" &&
    ir.sourceRoot?.requireReadOnlySources === true,
  "IR source-root read-only contract drifted");
  const sharedAbsolute = path.join(root, ir.sourceRoot.relativeRoot);
  const sharedReal = await realpath(sharedAbsolute);
  const sharedMetadata = await lstat(sharedAbsolute);
  invariant(sharedReal === sharedAbsolute && sharedMetadata.isDirectory() &&
    !sharedMetadata.isSymbolicLink() && (sharedMetadata.mode & 0o222) === 0,
  "reviewed G6-G8 shared root must be a real read-only directory");
  return Object.freeze({absolute: root, sharedAbsolute, token,
    identity: Object.freeze({realPathSha256: sha256(rootReal),
      device: String(metadata.dev), inode: String(metadata.ino),
      mode: metadata.mode & 0o777})});
}

async function verifyReadOnlyDirectoryChain(root, target) {
  const relative = path.relative(root, target);
  invariant(relative !== ".." && !relative.startsWith(`..${path.sep}`),
    "source parent escapes the reviewed shared root");
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const [metadata, resolved] = await Promise.all([
      lstat(current),
      realpath(current),
    ]);
    invariant(resolved === current && metadata.isDirectory() &&
      !metadata.isSymbolicLink() && (metadata.mode & 0o222) === 0,
    `source ancestor is symlinked or writable: ${current}`);
  }
}

async function sourceFile(placement, reportPlacement, sourceRoot) {
  const relative = placement.sourceRelativePath;
  invariant(typeof relative === "string" && !relative.includes("\\") &&
    relative.split("/").every((segment) =>
      segment.length > 0 && segment !== "." && segment !== "..") &&
    path.posix.normalize(relative) === relative,
  `${placement.animationId}: source relative path is not canonical`);
  const root = sourceRoot.sharedAbsolute;
  const absolute = path.resolve(root, relative);
  invariant(absolute.startsWith(`${root}${path.sep}`),
    `${placement.animationId}: source escapes G6-G8 root`);
  await verifyReadOnlyDirectoryChain(root, path.dirname(absolute));
  const sourceReal = await realpath(absolute);
  invariant(sourceReal === absolute,
    `${placement.animationId}: source must not resolve through a symlink`);
  const [metadata, identityBefore] = await Promise.all([
    lstat(absolute),
    lstat(absolute, {bigint: true}),
  ]);
  const bytes = await readFile(absolute);
  const [metadataAfter, identityAfter, sourceRealAfter] = await Promise.all([
    lstat(absolute),
    lstat(absolute, {bigint: true}),
    realpath(absolute),
  ]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() &&
    metadata.nlink === 1 &&
    (metadata.mode & 0o222) === 0 &&
    sourceRealAfter === absolute &&
    metadataAfter.isFile() && !metadataAfter.isSymbolicLink() &&
    metadataAfter.nlink === 1 && metadataAfter.dev === metadata.dev &&
    metadataAfter.ino === metadata.ino &&
    metadataAfter.size === metadata.size &&
    metadataAfter.mtimeMs === metadata.mtimeMs &&
    metadataAfter.mode === metadata.mode &&
    identityBefore.dev === identityAfter.dev &&
    identityBefore.ino === identityAfter.ino &&
    identityBefore.size === identityAfter.size &&
    identityBefore.mtimeNs === identityAfter.mtimeNs &&
    identityBefore.mode === identityAfter.mode &&
    identityBefore.nlink === 1n && identityAfter.nlink === 1n &&
    bytes.length === reportPlacement.source.bytes &&
    sha256(bytes) === placement.sourceSha256,
  `${placement.animationId}: source bytes, hash, or read-only mode drifted`);
  return Object.freeze({absolute, buffer: bytes, bytes: bytes.length,
    sha256: placement.sourceSha256, mode: metadata.mode & 0o777});
}

async function stableOrdinaryFile(absolute, label) {
  const canonical = path.resolve(absolute);
  const [resolved, before] = await Promise.all([
    realpath(canonical), lstat(canonical, {bigint: true}),
  ]);
  invariant(resolved === canonical && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${label} must be a canonical ordinary single-link file`);
  const buffer = await readFile(canonical);
  const [resolvedAfter, after] = await Promise.all([
    realpath(canonical), lstat(canonical, {bigint: true}),
  ]);
  invariant(resolvedAfter === canonical && after.isFile() &&
    !after.isSymbolicLink() && after.nlink === 1n &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode,
  `${label} changed while it was read`);
  return Object.freeze({absolute: canonical, buffer,
    binding: Object.freeze({path: portable(path.relative(PROJECT_ROOT,
      canonical)), bytes: buffer.length, sha256: sha256(buffer)}),
    identity: Object.freeze({dev: String(after.dev), ino: String(after.ino),
      size: String(after.size), mtimeNs: String(after.mtimeNs),
      mode: Number(after.mode & 0o777n), nlink: Number(after.nlink)})});
}

async function buildMember({placement, context, stageRoot}) {
  const reportPlacement = context.structural.get(placement.animationId);
  const source = await sourceFile(placement, reportPlacement,
    context.sourceRoot);
  const memberRoot = path.join(stageRoot, "members", placement.animationId);
  const logsRoot = path.join(memberRoot, "logs");
  const canvasRoot = path.join(memberRoot, "canvas");
  const pcodeRoot = path.join(memberRoot, "pcode");
  const sourceCopyRoot = path.join(memberRoot, "source");
  await Promise.all([mkdir(logsRoot, {recursive: true}),
    mkdir(canvasRoot, {recursive: true}), mkdir(pcodeRoot, {recursive: true}),
    mkdir(sourceCopyRoot, {recursive: true})]);
  const stagedSourcePath = path.join(sourceCopyRoot, "source.swf");
  await writeFile(stagedSourcePath, source.buffer, {flag: "wx"});
  await chmod(stagedSourcePath, 0o444);
  await chmod(sourceCopyRoot, 0o555);
  const stagedSource = await stableOrdinaryFile(stagedSourcePath,
    `${placement.animationId} staged source copy`);
  invariant(stagedSource.buffer.equals(source.buffer) &&
    stagedSource.binding.bytes === source.bytes &&
    stagedSource.binding.sha256 === source.sha256,
  `${placement.animationId}: staged source copy drifted`);
  const canvasCommand = await runCommand({command: context.ffdec.command,
    args: [...context.ffdec.prefixArgs,
      "-config", "packJavaScripts=false", "-onerror", "abort",
      "-timeout", "120", "-exportTimeout", "600", "-format",
      CANVAS_FORMATS, "-export", CANVAS_ITEMS, canvasRoot, stagedSourcePath],
    cwd: PROJECT_ROOT,
    logs: path.join(logsRoot, "ffdec-canvas"), source: stagedSourcePath,
    output: canvasRoot,
    redactions: [[context.ffdec.prefixArgs.at(-1), "<FFDEC_JAR>"]]});
  const pcodeCommand = await runCommand({command: context.ffdec.command,
    args: [...context.ffdec.prefixArgs,
      "-config", "packJavaScripts=false", "-onerror", "abort",
      "-timeout", "120", "-exportTimeout", "600", "-format",
      "script:pcode", "-export", "script", pcodeRoot, stagedSourcePath],
    cwd: PROJECT_ROOT,
    logs: path.join(logsRoot, "ffdec-pcode"), source: stagedSourcePath,
    output: pcodeRoot,
    redactions: [[context.ffdec.prefixArgs.at(-1), "<FFDEC_JAR>"]]});
  const sourceAfter = await sourceFile(placement, reportPlacement,
    context.sourceRoot);
  invariant(sourceAfter.sha256 === source.sha256 &&
    sourceAfter.bytes === source.bytes &&
    sourceAfter.buffer.equals(source.buffer),
  `${placement.animationId}: source changed during FFDec extraction`);
  const stagedSourceAfter = await stableOrdinaryFile(stagedSourcePath,
    `${placement.animationId} staged source copy after extraction`);
  invariant(stagedSourceAfter.buffer.equals(source.buffer) &&
    JSON.stringify(stagedSourceAfter.identity) ===
      JSON.stringify(stagedSource.identity),
  `${placement.animationId}: staged source copy changed during extraction`);

  const structuralBase = path.join(PROJECT_ROOT,
    path.dirname(context.irBinding.value.inputs.structuralReport.path));
  const xmlDescriptor = reportPlacement.structural.swfmill.xml;
  const expectedXmlRelativePath = portable(path.join("placements",
    placement.animationId, "swfmill", "source.xml"));
  invariant(xmlDescriptor.path === expectedXmlRelativePath,
    `${placement.animationId}: structural swfmill XML path drifted`);
  const xmlPath = path.join(structuralBase, xmlDescriptor.path);
  invariant(xmlPath === path.join(structuralBase, expectedXmlRelativePath),
    `${placement.animationId}: structural swfmill XML path is not canonical`);
  const xmlFile = await stableOrdinaryFile(xmlPath,
    `${placement.animationId} structural swfmill XML`);
  invariant(xmlFile.binding.bytes === xmlDescriptor.bytes &&
    xmlFile.binding.sha256 === xmlDescriptor.sha256,
  `${placement.animationId}: structural swfmill XML drifted`);
  const target = parseRootTarget(xmlFile.buffer.toString("utf8"), placement);
  const spriteRoot = path.join(canvasRoot, "sprites",
    `DefineSprite_${target.objectId}`);
  const framesPath = path.join(spriteRoot, "frames.html");
  const helperPath = path.join(spriteRoot, "canvas.js");
  const [framesFile, helperFile] = await Promise.all([
    stableOrdinaryFile(framesPath, `${placement.animationId} FFDec frames`),
    stableOrdinaryFile(helperPath, `${placement.animationId} FFDec helper`),
  ]);
  const framesBytes = framesFile.buffer;
  const helperBytes = helperFile.buffer;
  const metadata = deriveFfdecMetadata(framesBytes.toString("utf8"),
    placement);
  const finalRuntimePath = portable(path.join(OUTPUT_ROOT, "members",
    placement.animationId, "canvas-renderer.js"));
  const rawFramesBinding = framesFile.binding;
  const rawHelperBinding = helperFile.binding;
  const stableSpriteRoot = portable(path.join(OUTPUT_ROOT, "members",
    placement.animationId, "canvas", "sprites",
    `DefineSprite_${target.objectId}`));
  const framesBinding = Object.freeze({...rawFramesBinding,
    path: `${stableSpriteRoot}/frames.html`});
  const helperBinding = Object.freeze({...rawHelperBinding,
    path: `${stableSpriteRoot}/canvas.js`});
  const spec = adapterSpec({placement, reportPlacement, target, metadata,
    framesBinding, helperBinding, finalRuntimePath,
    inputBindings: context.irBinding.value.inputs});
  const built = buildSafeRuntime({helperSource: helperBytes.toString("utf8"),
    framesHtml: framesBytes.toString("utf8"), spec: spec.value});
  const runtimeText = finalizeRuntime(built.runtime, built.metadata, spec.value,
    placement, target, spec.stageMatrix);
  const runtimeBytes = Buffer.from(runtimeText);
  const specBytes = jsonBytes(spec.value);
  const runtimePath = path.join(memberRoot, "canvas-renderer.js");
  const specPath = path.join(memberRoot, "adapter-spec.json");
  await Promise.all([
    writeFile(runtimePath, runtimeBytes, {flag: "wx"}),
    writeFile(specPath, specBytes, {flag: "wx"}),
  ]);
  await Promise.all([
    freezeTree(canvasRoot),
    freezeTree(pcodeRoot),
    freezeTree(logsRoot),
    chmod(runtimePath, 0o444),
    chmod(specPath, 0o444),
  ]);
  const canvasInventory = await directoryInventory(canvasRoot);
  const pcodeInventory = await directoryInventory(pcodeRoot);
  const runtime = Object.freeze({path: finalRuntimePath,
    bytes: runtimeBytes.length, sha256: sha256(runtimeBytes),
    url: `/flash-assets/g678-local/${placement.animationId}/canvas-renderer.js`,
    globalRegistry: ASSET_REGISTRY});
  const memberManifest = {
    schemaVersion: 1,
    artifactType: "g678-shared-current-js-compiler-member-v1",
    animationId: placement.animationId,
    source: {path: `G6-G8-shared/${placement.sourceRelativePath}`,
      bytes: source.bytes, sha256: source.sha256, mode: source.mode,
      unchangedDuringExtraction: true,
      compilerCopy: {path: portable(path.join(OUTPUT_ROOT, "members",
        placement.animationId, "source", "source.swf")),
      bytes: stagedSource.binding.bytes,
      sha256: stagedSource.binding.sha256, mode: stagedSource.identity.mode}},
    reviewedRouting: {lane: placement.reviewedLane,
      adapterFamily: placement.adapterFamily,
      implementationDisposition: placement.implementationDisposition},
    timeline: {rootFrameCount: placement.rootFrameCount,
      rootBeginFrame: placement.rootBeginFrame,
      frameDomain: `sprite-${target.objectId}`,
      frameCount: placement.mainChild.frameCount,
      livePlaybackEndFrame: metadata.lastPlacedFrame,
      rootPlacementMatrix: target.matrix},
    compiler: {canvasCommand, pcodeCommand, canvasInventory,
      pcodeInventory, adapterBuilder: context.inputBindings.safeCanvasAdapter},
    runtime: {canvasRenderer: runtime,
      adapterSpec: {path: portable(path.join(OUTPUT_ROOT, "members",
        placement.animationId, "adapter-spec.json")),
        bytes: specBytes.length, sha256: sha256(specBytes)}},
    productBlockers: placement.productBlockers,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const manifestBytes = jsonBytes(memberManifest);
  const manifestPath = path.join(memberRoot, "member-manifest.json");
  await writeFile(manifestPath, manifestBytes, {flag: "wx"});
  await freezeTree(memberRoot);
  return Object.freeze({animationId: placement.animationId,
    manifestPath: portable(path.join(OUTPUT_ROOT, "members",
      placement.animationId, "member-manifest.json")),
    manifest: Object.freeze({bytes: manifestBytes.length,
      sha256: sha256(manifestBytes)}), runtime,
    metadata, target, placement});
}

function constantName(animationId) {
  return animationId.replace(/[^A-Za-z0-9]+/gu, "_").toUpperCase();
}

function timelineSource(page) {
  const name = constantName(page.animationId);
  const blockedFrameRanges = [];
  const sourceContract = {
    calibrationId: CALIBRATION_ID,
    deploymentScope: "local-only",
    source: {path: page.sourcePath, sha256: page.sourceSha256},
    reviewedLane: page.complexityLane,
    adapterFamily: page.adapterFamily,
    runtimePath: page.runtime.path,
    productBlockers: page.productBlockers,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    actionScriptExecuted: false,
    nestedAudioPlaybackCompiled: false,
    strictAcceptanceEffect: "none",
  };
  const config = {
    animationId: page.animationId,
    title: `${page.titleEnglish} — local-only source-static Current-JS engineering candidate`,
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
    blockedFrameRanges,
    visualMarkers: [{id: `${page.frameDomain}-ffdec-drawing`,
      firstFrame: 1, lastFrame: page.frameCount}],
    sourceControlBehaviorLabel: `Blocked product behaviors: ${page.productBlockers.join(", ")}`,
  };
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify(sourceContract, null, 2)} as const);\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

function moduleSource(page) {
  const name = constantName(page.animationId);
  return `"use client";\n\n` +
    `import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `const candidate = createSourceStaticCanvasCandidate(${name}_CONFIG);\n` +
    `const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});\n\n` +
    `export {${name}_SOURCE};\n` +
    `export const ${name}_MOVIE = candidate.movie;\n` +
    `export const ${name}_RUNTIME = candidate.runtime;\n` +
    `export const ${name}_SOURCE_CONTRACT = candidate.sourceContract;\n` +
    `export const ${name}_SCENARIOS = candidate.scenarios;\n` +
    `export const ${name}_RENDERER = candidate.Renderer;\n` +
    `export default animationModule;\n`;
}

async function generatedPages(context, memberResults) {
  const pages = [];
  for (const result of memberResults) {
    const catalogRecord = context.catalogData.pages.get(result.animationId);
    invariant(catalogRecord,
      `${result.animationId}: catalog page is missing during tracked generation`);
    const {page, lesson} = catalogRecord;
    pages.push(Object.freeze({animationId: result.animationId,
      placementId: page.placementId,
      assetId: page.assetId, moduleCode: lesson.moduleCode,
      lessonNumber: lesson.lessonNumber,
      stableLessonKey: lesson.stableLessonKey,
      globalPageOrdinal: page.globalOrdinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
      titleEnglish: page.titleEnglish,
      sourcePath: `G6-G8-shared/${result.placement.sourceRelativePath}`,
      sourceSha256: result.placement.sourceSha256,
      complexityLane: result.placement.reviewedLane,
      adapterFamily: result.placement.adapterFamily,
      rootFrameCount: result.placement.rootFrameCount,
      rootBeginFrame: result.placement.rootBeginFrame,
      frameDomain: `sprite-${result.target.objectId}`,
      frameCount: result.metadata.frameCount,
      livePlaybackEndFrame: result.metadata.lastPlacedFrame,
      runtime: result.runtime,
      productBlockers: result.placement.productBlockers}));
  }
  pages.sort((left, right) => left.animationId.localeCompare(right.animationId));
  return Object.freeze(pages);
}

async function trackedOutputs(context, runBinding, memberResults) {
  const generatorBinding = await binding(GENERATOR_PATH);
  const irBinding = await binding(IR_PATH);
  const compilerRunBinding = Object.freeze({path: runBinding.path,
    bytes: runBinding.bytes, sha256: runBinding.sha256});
  const pages = await generatedPages(context, memberResults);
  const selectedPages = pages.map((page) => ({
    animationId: page.animationId,
    placementId: page.placementId,
    assetId: page.assetId,
    moduleCode: page.moduleCode,
    lessonNumber: page.lessonNumber,
    stableLessonKey: page.stableLessonKey,
    globalPageOrdinal: page.globalPageOrdinal,
    sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sourceSha256: page.sourceSha256,
    complexityLane: page.complexityLane,
    adapterFamily: page.adapterFamily,
    implementation: {kind: "source-static-current-js-candidate",
      deploymentScope: "local-only", productCalibrationPassed: false},
    runtime: {stage: {width: 800, height: 600},
      rootFrameCount: page.rootFrameCount,
      rootBeginFrame: page.rootBeginFrame,
      frameDomain: page.frameDomain, frameCount: page.frameCount,
      livePlaybackEndFrame: page.livePlaybackEndFrame,
      language: "fixed-en", scenario: "source-static-frame", seed: "0",
      canvasRenderer: {path: page.runtime.path, bytes: page.runtime.bytes,
        sha256: page.runtime.sha256, url: page.runtime.url}},
    runtimeEvidenceBoundary: {
      runtimeKind: "source-static-current-js-candidate",
      actionScriptExecution: "not-executed",
      naturalTraceValidation: "not-established",
      audioAcceptance: "not-established",
      replaySemantics:
        "renderer-restart-only-source-behavior-not-established",
    },
    productBlockers: page.productBlockers,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  }));
  const pendingAdvancedManualPlacements = context.irBinding.value.placements
    .filter(({implementationDisposition}) =>
      implementationDisposition === "advanced-manual")
    .map((placement) => ({animationId: placement.animationId,
      sourceSha256: placement.sourceSha256,
      complexityLane: placement.reviewedLane,
      adapterFamily: placement.adapterFamily,
      productBlockers: placement.productBlockers,
      registered: false}));
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    deploymentScope: "local-only",
    status: "private-current-js-calibration-candidates-generated",
    frozenCalibrationPlacementCount: 16,
    registrationCandidatePlacementCount: 13,
    sharedAdapterPlacementCount: 13,
    advancedManualPlacementCount: 3,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {sharedCatalog: context.inputBindings.sharedCatalog,
      sourceProfile: context.inputBindings.sourceProfile,
      structuralReport: context.inputBindings.structuralReport,
      structuralFactoryRun: context.inputBindings.structuralFactoryRun,
      calibrationIr: irBinding, compilerRun: compilerRunBinding,
      safeCanvasAdapter: context.inputBindings.safeCanvasAdapter,
      sourceStaticCanvasHostAdapter:
        context.inputBindings.sourceStaticCanvasHostAdapter,
      generator: generatorBinding},
    selectedPages,
    pendingAdvancedManualPlacements,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    limitations: context.irBinding.value.limitations,
  };
  const freezeBytes = jsonBytes(freeze);
  const fragment = {
    schemaVersion: 1,
    artifactType: "private-current-js-calibration-fragment-v1",
    calibration: {
      calibrationId: CALIBRATION_ID,
      deploymentScope: "local-only",
      freezeManifest: FREEZE_PATH,
      entries: pages.map((page) => ({key: page.animationId,
        module: `./modules/${page.animationId}`,
        maturity: "private-current-js",
        complexityLane: page.complexityLane})),
    },
    freeze: {path: FREEZE_PATH, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 13,
      frozenCalibrationPlacementCount: 16,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false},
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const output = new Map();
  for (const page of pages) {
    output.set(`packages/demos/src/timelines/${page.animationId}.ts`,
      Buffer.from(timelineSource(page)));
    output.set(`packages/demos/src/modules/${page.animationId}.tsx`,
      Buffer.from(moduleSource(page)));
  }
  output.set(FREEZE_PATH, freezeBytes);
  output.set(FRAGMENT_PATH, jsonBytes(fragment));
  return Object.freeze({output, freeze, fragment, pages});
}

async function synchronizeTracked(outputs, check) {
  if (check) {
    for (const [relativePath, bytes] of outputs) {
      const current = await readProjectFileBinding(relativePath)
        .catch(() => null);
      invariant(current && current.bytes === bytes.length &&
        current.sha256 === sha256(bytes),
      `${relativePath} is stale, absent, or not a canonical ordinary file`);
    }
    return;
  }

  const transactionRoot = projectPath(
    `work/g678-shared-page-factory/.g678-tracked-publication-${process.pid}`,
    "tracked publication transaction",
  );
  invariant(!(await exists(transactionRoot)),
    `tracked publication staging already exists: ${transactionRoot}`);
  const targets = [...outputs.entries()].map(([relativePath, bytes]) =>
    Object.freeze({relativePath, bytes, target: projectPath(relativePath),
      staged: path.join(transactionRoot, relativePath)}));
  const created = [];
  const parentIdentities = new Map();
  const verifyTargetParent = async (target) => {
    const parentPath = path.dirname(target.target);
    const [parent, resolvedParent] = await Promise.all([
      lstat(parentPath, {bigint: true}), realpath(parentPath),
    ]);
    invariant(resolvedParent === parentPath && parent.isDirectory() &&
      !parent.isSymbolicLink(),
    `${target.relativePath}: tracked parent is not a canonical real directory`);
    const expected = parentIdentities.get(target.target);
    if (expected) invariant(parent.dev === expected.dev &&
      parent.ino === expected.ino && parent.mode === expected.mode,
    `${target.relativePath}: tracked parent identity changed`);
    else parentIdentities.set(target.target, Object.freeze({dev: parent.dev,
      ino: parent.ino, mode: parent.mode}));
  };
  try {
    // Fail before staging any byte unless the complete tracked target set is
    // absent and every existing parent is a real directory.
    for (const target of targets) {
      invariant(!(await exists(target.target)),
        `${target.relativePath} already exists; generated output is create-exclusive`);
      await verifyTargetParent(target);
    }
    await mkdir(transactionRoot, {recursive: false});
    for (const target of targets) {
      await mkdir(path.dirname(target.staged), {recursive: true});
      await writeFile(target.staged, target.bytes, {flag: "wx"});
      const stagedBytes = await readFile(target.staged);
      invariant(stagedBytes.equals(target.bytes),
        `${target.relativePath}: tracked staged bytes drifted`);
    }
    await writeFile(path.join(transactionRoot, "transaction.json"),
      jsonBytes({schemaVersion: 1,
        artifactType: "g678-tracked-publication-transaction-v1",
        processId: process.pid,
        targets: targets.map(({relativePath, bytes}) => ({relativePath,
          bytes: bytes.length, sha256: sha256(bytes)}))}), {flag: "wx"});
    // Recheck the complete set just before committing. COPYFILE_EXCL gives
    // every individual publication a no-replace boundary. On any failure,
    // only files created by this transaction are unlinked.
    for (const target of targets) {
      await verifyTargetParent(target);
      invariant(!(await exists(target.target)),
        `${target.relativePath} appeared during tracked staging`);
    }
    for (const target of targets) {
      await verifyTargetParent(target);
      await copyFile(target.staged, target.target, fsConstants.COPYFILE_EXCL);
      const createdFile = {target: target.target,
        relativePath: target.relativePath, bytes: target.bytes.length,
        sha256: sha256(target.bytes), identity: null};
      created.push(createdFile);
      const published = await readFile(target.target);
      const [metadata, resolvedTarget] = await Promise.all([
        lstat(target.target, {bigint: true}), realpath(target.target),
      ]);
      await verifyTargetParent(target);
      invariant(published.equals(target.bytes),
        `${target.relativePath}: tracked published bytes drifted`);
      invariant(resolvedTarget === target.target && metadata.isFile() &&
        !metadata.isSymbolicLink() &&
        metadata.nlink === 1n && metadata.size === BigInt(target.bytes.length),
      `${target.relativePath}: tracked published identity drifted`);
      createdFile.identity = Object.freeze({dev: metadata.dev, ino: metadata.ino,
        size: metadata.size, mtimeNs: metadata.mtimeNs,
        mode: metadata.mode, nlink: metadata.nlink});
    }
    await rm(transactionRoot, {recursive: true, force: false});
  } catch (error) {
    const rollbackErrors = [];
    for (const createdFile of created.reverse()) {
      try {
        invariant(createdFile.identity,
          `${createdFile.relativePath}: publication identity was not recorded`);
        const identity = createdFile.identity;
        const before = await lstat(createdFile.target, {bigint: true});
        const bytes = await readFile(createdFile.target);
        const after = await lstat(createdFile.target, {bigint: true});
        invariant(before.isFile() && !before.isSymbolicLink() &&
          before.nlink === identity.nlink && before.dev === identity.dev &&
          before.ino === identity.ino && before.size === identity.size &&
          before.mtimeNs === identity.mtimeNs &&
          before.mode === identity.mode && before.dev === after.dev &&
          before.ino === after.ino && before.size === after.size &&
          before.mtimeNs === after.mtimeNs && before.mode === after.mode &&
          bytes.length === createdFile.bytes &&
          sha256(bytes) === createdFile.sha256,
        `${createdFile.relativePath}: rollback target changed after publication`);
        await unlink(createdFile.target);
      } catch (rollbackError) {
        rollbackErrors.push(`${createdFile.target}: ${rollbackError.message}`);
      }
    }
    try {
      if (rollbackErrors.length === 0 && await exists(transactionRoot)) {
        await rm(transactionRoot, {recursive: true, force: false});
      }
    } catch (rollbackError) {
      rollbackErrors.push(`${transactionRoot}: ${rollbackError.message}`);
    }
    const suffix = rollbackErrors.length === 0
      ? "" : `; rollback failures: ${rollbackErrors.join(" | ")}`;
    const disposition = rollbackErrors.length === 0
      ? "was rolled back" : "rollback is incomplete";
    throw new Error(`tracked publication failed and ${disposition}${suffix}: ${error.message}`);
  }
}

async function buildCompilerRun(context) {
  const output = projectPath(OUTPUT_ROOT);
  invariant(!(await exists(output)),
    `${OUTPUT_ROOT} already exists; compiler run is create-exclusive`);
  const stage = `${output}.staging-${process.pid}`;
  invariant(!(await exists(stage)), `staging output already exists: ${stage}`);
  await mkdir(stage, {recursive: false});
  let finalOutputPublished = false;
  try {
    const placements = context.irBinding.value.placements.filter(
      ({implementationDisposition}) =>
        implementationDisposition === "shared-adapter");
    const results = [];
    for (const placement of placements) {
      results.push(await buildMember({placement, context, stageRoot: stage}));
    }
    const ffdecAfterExtraction = await resolveFfdecToolchain();
    invariant(ffdecAfterExtraction.command === context.ffdec.command &&
      JSON.stringify(ffdecAfterExtraction.prefixArgs) ===
        JSON.stringify(context.ffdec.prefixArgs) &&
      JSON.stringify(ffdecAfterExtraction.identity) ===
        JSON.stringify(context.ffdec.identity),
    "FFDec toolchain changed during extraction");
    await freezeTree(path.join(stage, "members"));
    const membersInventory = await directoryInventory(path.join(stage,
      "members"));
    const inventoryBytes = jsonBytes({schemaVersion: 1,
      root: `${OUTPUT_ROOT}/members`, ...membersInventory});
    await writeFile(path.join(stage, "output-inventory.json"), inventoryBytes,
      {flag: "wx"});
    const runManifest = {
      schemaVersion: 1,
      artifactType: "g678-shared-current-js-compiler-run-v1",
      runId: "g678-shared-current-js-calibration-13-v1",
      status: RUN_STATUS,
      deploymentScope: "local-only",
      scope: {frozenCalibrationPlacementCount: 16,
        compiledSharedAdapterPlacementCount: 13,
        pendingAdvancedManualPlacementCount: 3,
        legacyFlashCourseShellCount: 0},
      inputs: {...context.inputBindings,
        calibrationIr: await binding(IR_PATH),
        generator: await binding(GENERATOR_PATH)},
      sourceRoot: {environmentVariable: context.sourceRoot.token,
        relativeRoot: "G6-G8-shared",
        realPathSha256: context.sourceRoot.identity.realPathSha256,
        filesystemIdentity: {device: context.sourceRoot.identity.device,
          inode: context.sourceRoot.identity.inode,
          mode: context.sourceRoot.identity.mode}},
      toolchain: {ffdec: context.ffdec.identity,
        safeAdapter: context.inputBindings.safeCanvasAdapter,
        sourceStaticCanvasHostAdapter:
          context.inputBindings.sourceStaticCanvasHostAdapter},
      members: results.map((result) => ({animationId: result.animationId,
        manifestPath: result.manifestPath, manifest: result.manifest,
        runtime: result.runtime})),
      outputInventory: {path: `${OUTPUT_ROOT}/output-inventory.json`,
        bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)},
      licenseBoundary: LICENSE_BOUNDARY,
      scaleOutAuthorized: false,
      engineeringPreviewReady: false,
      productCalibrationPassed: false,
      acceptanceEffects: ACCEPTANCE_EFFECTS,
    };
    await writeFile(path.join(stage, "run-manifest.json"),
      jsonBytes(runManifest), {flag: "wx"});
    await Promise.all([
      chmod(path.join(stage, "output-inventory.json"), 0o444),
      chmod(path.join(stage, "run-manifest.json"), 0o444),
    ]);
    await chmod(stage, 0o555);
    await rename(stage, output);
    finalOutputPublished = true;
    const runBinding = await binding(`${OUTPUT_ROOT}/run-manifest.json`);
    const tracked = await trackedOutputs(context, runBinding, results);
    await synchronizeTracked(tracked.output, false);
    return Object.freeze({runBinding, results, tracked});
  } catch (error) {
    let retained = stage;
    let recoveryError = null;
    if (finalOutputPublished) {
      const failed = `${output}.failed-tracked-publication-${process.pid}-${Date.now()}`;
      try {
        await rename(output, failed);
        retained = failed;
      } catch (renameError) {
        retained = output;
        recoveryError = renameError;
      }
    }
    const recoverySuffix = recoveryError
      ? `; failed to archive canonical output: ${recoveryError.message}` : "";
    throw new Error(`G6-G8 shared Current-JS compiler failed; recoverable output retained at ${portable(path.relative(PROJECT_ROOT, retained))}${recoverySuffix}: ${error.message}`);
  }
}

async function checkCommandReceipt(receipt, expectedCommand, expectedArgs,
  logsPrefix, label) {
  invariant(receipt?.command === expectedCommand && receipt.exitCode === 0 &&
    JSON.stringify(receipt.args) === JSON.stringify(expectedArgs),
  `${label} command receipt drifted`);
  const [stdout, stderr] = await Promise.all([
    stableOrdinaryFile(`${logsPrefix}.stdout.txt`, `${label} stdout`),
    stableOrdinaryFile(`${logsPrefix}.stderr.txt`, `${label} stderr`),
  ]);
  invariant(receipt.stdout?.bytes === stdout.binding.bytes &&
    receipt.stdout?.sha256 === stdout.binding.sha256 &&
    receipt.stderr?.bytes === stderr.binding.bytes &&
    receipt.stderr?.sha256 === stderr.binding.sha256,
  `${label} log receipt drifted`);
}

async function checkCompilerRun(context) {
  const runBinding = await readJsonBinding(`${OUTPUT_ROOT}/run-manifest.json`);
  await verifyFrozenTree(projectPath(OUTPUT_ROOT));
  const outputRootEntries = (await readdir(projectPath(OUTPUT_ROOT),
    {withFileTypes: true})).map((entry) => entry.name).sort();
  invariant(JSON.stringify(outputRootEntries) === JSON.stringify([
    "members", "output-inventory.json", "run-manifest.json",
  ]), "compiler output root entry set drifted");
  const run = runBinding.value;
  invariant(run.schemaVersion === 1 &&
    run.artifactType === "g678-shared-current-js-compiler-run-v1" &&
    run.runId === "g678-shared-current-js-calibration-13-v1" &&
    run.status === RUN_STATUS &&
    run.deploymentScope === "local-only" &&
    run.scope?.frozenCalibrationPlacementCount === 16 &&
    run.scope?.compiledSharedAdapterPlacementCount === 13 &&
    run.scope?.pendingAdvancedManualPlacementCount === 3 &&
    run.scope?.legacyFlashCourseShellCount === 0 &&
    JSON.stringify(run.licenseBoundary) === JSON.stringify(LICENSE_BOUNDARY) &&
    run.scaleOutAuthorized === false &&
    run.engineeringPreviewReady === false &&
    run.productCalibrationPassed === false &&
    hasExactFalseAcceptanceEffects(run.acceptanceEffects),
  "compiler run identity or acceptance boundary drifted");
  invariant(run.sourceRoot?.environmentVariable === context.sourceRoot.token &&
    run.sourceRoot?.relativeRoot === "G6-G8-shared" &&
    run.sourceRoot?.realPathSha256 ===
      context.sourceRoot.identity.realPathSha256 &&
    run.sourceRoot?.filesystemIdentity?.device ===
      context.sourceRoot.identity.device &&
    run.sourceRoot?.filesystemIdentity?.inode ===
      context.sourceRoot.identity.inode &&
    run.sourceRoot?.filesystemIdentity?.mode ===
      context.sourceRoot.identity.mode,
  "compiler source-root identity drifted");
  invariant(JSON.stringify(run.toolchain?.ffdec) ===
    JSON.stringify(context.ffdec.identity) &&
    JSON.stringify(run.toolchain?.safeAdapter) ===
      JSON.stringify(context.inputBindings.safeCanvasAdapter) &&
    JSON.stringify(run.toolchain?.sourceStaticCanvasHostAdapter) ===
      JSON.stringify(context.inputBindings.sourceStaticCanvasHostAdapter),
  "compiler FFDec toolchain identity drifted");
  const expectedInputs = {...context.inputBindings,
    calibrationIr: await binding(IR_PATH),
    generator: await binding(GENERATOR_PATH)};
  const expectedInputKeys = Object.keys(expectedInputs).sort();
  invariant(JSON.stringify(Object.keys(run.inputs ?? {}).sort()) ===
    JSON.stringify(expectedInputKeys),
  "compiler input binding key set drifted");
  for (const [key, expected] of Object.entries(expectedInputs)) {
    exactBinding(run.inputs[key], expected, `compiler input ${key}`);
  }
  invariant(run.outputInventory?.path ===
    `${OUTPUT_ROOT}/output-inventory.json`,
  "compiler output inventory path drifted");
  const inventoryRead = await readJsonBinding(run.outputInventory.path);
  exactBinding(inventoryRead, run.outputInventory,
    "compiler output inventory");
  const observed = await directoryInventory(projectPath(`${OUTPUT_ROOT}/members`));
  const inventory = inventoryRead.value;
  invariant(JSON.stringify(observed) === JSON.stringify({
    fileCount: inventory.fileCount, totalBytes: inventory.totalBytes,
    checksumSetSha256: inventory.checksumSetSha256, files: inventory.files,
  }), "compiler member output inventory drifted");
  const placementById = new Map(context.irBinding.value.placements.map(
    (placement) => [placement.animationId, placement]));
  const expectedMemberIds = context.irBinding.value.placements
    .filter(({implementationDisposition}) =>
      implementationDisposition === "shared-adapter")
    .map(({animationId}) => animationId).sort();
  const observedMemberIds = (run.members ?? [])
    .map(({animationId}) => animationId).sort();
  invariant(new Set(observedMemberIds).size === observedMemberIds.length &&
    JSON.stringify(observedMemberIds) === JSON.stringify(expectedMemberIds),
  "compiler run member identity set drifted");
  const results = [];
  for (const member of run.members ?? []) {
    invariant(member.manifestPath ===
      `${OUTPUT_ROOT}/members/${member.animationId}/member-manifest.json` &&
      member.runtime?.path ===
      `${OUTPUT_ROOT}/members/${member.animationId}/canvas-renderer.js`,
    `${member.animationId}: compiler member paths are not canonical`);
    const manifestRead = await readJsonBinding(member.manifestPath);
    exactBinding(manifestRead,
      {path: member.manifestPath, ...member.manifest},
      `${member.animationId} member manifest`);
    const manifest = manifestRead.value;
    const placement = placementById.get(member.animationId);
    const reportPlacement = context.structural.get(member.animationId);
    const expectedPrefixArgs = context.ffdec.prefixArgs.map((value) =>
      value === context.ffdec.prefixArgs.at(-1) ? "<FFDEC_JAR>" : value);
    const expectedCanvasArgs = [...expectedPrefixArgs,
      "-config", "packJavaScripts=false",
      "-onerror", "abort", "-timeout", "120", "-exportTimeout", "600",
      "-format", CANVAS_FORMATS, "-export", CANVAS_ITEMS,
      "<OUTPUT_DIRECTORY>", "<SOURCE_SWF>"];
    const expectedPcodeArgs = [...expectedPrefixArgs,
      "-config", "packJavaScripts=false",
      "-onerror", "abort", "-timeout", "120", "-exportTimeout", "600",
      "-format", "script:pcode", "-export", "script",
      "<OUTPUT_DIRECTORY>", "<SOURCE_SWF>"];
    invariant(placement?.implementationDisposition === "shared-adapter" &&
      reportPlacement && manifest.schemaVersion === 1 &&
      manifest.artifactType === "g678-shared-current-js-compiler-member-v1" &&
      manifest.animationId === member.animationId,
    `${member.animationId}: member identity drifted`);
    const memberRoot = projectPath(`${OUTPUT_ROOT}/members/${member.animationId}`);
    await Promise.all([
      checkCommandReceipt(manifest.compiler?.canvasCommand,
        context.ffdec.command, expectedCanvasArgs,
        path.join(memberRoot, "logs", "ffdec-canvas"),
        `${member.animationId} Canvas command`),
      checkCommandReceipt(manifest.compiler?.pcodeCommand,
        context.ffdec.command, expectedPcodeArgs,
        path.join(memberRoot, "logs", "ffdec-pcode"),
        `${member.animationId} P-code command`),
    ]);
    const [canvasInventory, pcodeInventory] = await Promise.all([
      directoryInventory(path.join(memberRoot, "canvas")),
      directoryInventory(path.join(memberRoot, "pcode")),
    ]);
    invariant(JSON.stringify(manifest.compiler?.canvasInventory) ===
      JSON.stringify(canvasInventory) &&
      JSON.stringify(manifest.compiler?.pcodeInventory) ===
      JSON.stringify(pcodeInventory) &&
      JSON.stringify(manifest.compiler?.adapterBuilder) ===
      JSON.stringify(context.inputBindings.safeCanvasAdapter),
    `${member.animationId}: compiler inventories or adapter binding drifted`);

    const currentSource = await sourceFile(placement, reportPlacement,
      context.sourceRoot);
    const stagedSourcePath = path.join(memberRoot, "source", "source.swf");
    const stagedSource = await stableOrdinaryFile(stagedSourcePath,
      `${member.animationId} staged compiler source`);
    const expectedCompilerCopy = {path: portable(path.relative(PROJECT_ROOT,
      stagedSourcePath)), bytes: stagedSource.binding.bytes,
    sha256: stagedSource.binding.sha256, mode: stagedSource.identity.mode};
    invariant(stagedSource.buffer.equals(currentSource.buffer) &&
      JSON.stringify(manifest.source) === JSON.stringify({
        path: `G6-G8-shared/${placement.sourceRelativePath}`,
        bytes: currentSource.bytes, sha256: currentSource.sha256,
        mode: currentSource.mode, unchangedDuringExtraction: true,
        compilerCopy: expectedCompilerCopy,
      }) &&
      JSON.stringify(manifest.reviewedRouting) === JSON.stringify({
        lane: placement.reviewedLane,
        adapterFamily: placement.adapterFamily,
        implementationDisposition: placement.implementationDisposition,
      }) &&
      JSON.stringify(manifest.productBlockers) ===
        JSON.stringify(placement.productBlockers),
    `${member.animationId}: source or reviewed routing drifted`);

    const structuralBase = path.join(PROJECT_ROOT,
      path.dirname(context.irBinding.value.inputs.structuralReport.path));
    const expectedXmlRelativePath = portable(path.join("placements",
      member.animationId, "swfmill", "source.xml"));
    const xmlDescriptor = reportPlacement.structural.swfmill.xml;
    invariant(xmlDescriptor.path === expectedXmlRelativePath,
      `${member.animationId}: structural XML path drifted`);
    const xmlFile = await stableOrdinaryFile(path.join(structuralBase,
      expectedXmlRelativePath), `${member.animationId} structural XML`);
    invariant(xmlFile.binding.bytes === xmlDescriptor.bytes &&
      xmlFile.binding.sha256 === xmlDescriptor.sha256,
    `${member.animationId}: structural XML binding drifted`);
    const target = parseRootTarget(xmlFile.buffer.toString("utf8"), placement);
    const spriteRoot = path.join(memberRoot, "canvas", "sprites",
      `DefineSprite_${target.objectId}`);
    const [framesFile, helperFile] = await Promise.all([
      stableOrdinaryFile(path.join(spriteRoot, "frames.html"),
        `${member.animationId} frozen FFDec frames`),
      stableOrdinaryFile(path.join(spriteRoot, "canvas.js"),
        `${member.animationId} frozen FFDec helper`),
    ]);
    const metadata = deriveFfdecMetadata(framesFile.buffer.toString("utf8"),
      placement);
    const stableSpriteRoot = portable(path.join(OUTPUT_ROOT, "members",
      member.animationId, "canvas", "sprites",
      `DefineSprite_${target.objectId}`));
    const framesBinding = Object.freeze({...framesFile.binding,
      path: `${stableSpriteRoot}/frames.html`});
    const helperBinding = Object.freeze({...helperFile.binding,
      path: `${stableSpriteRoot}/canvas.js`});
    const expectedRuntimePath = `${OUTPUT_ROOT}/members/${member.animationId}/canvas-renderer.js`;
    const expectedSpec = adapterSpec({placement, reportPlacement, target,
      metadata, framesBinding, helperBinding,
      finalRuntimePath: expectedRuntimePath,
      inputBindings: context.irBinding.value.inputs});
    const expectedSpecPath =
      `${OUTPUT_ROOT}/members/${member.animationId}/adapter-spec.json`;
    invariant(manifest.runtime?.adapterSpec?.path === expectedSpecPath,
      `${member.animationId}: adapter spec path drifted`);
    const specRead = await readJsonBinding(manifest.runtime?.adapterSpec?.path);
    exactBinding(specRead, manifest.runtime.adapterSpec,
      `${member.animationId} adapter spec`);
    const expectedSpecBytes = jsonBytes(expectedSpec.value);
    invariant(specRead.bytes === expectedSpecBytes.length &&
      specRead.sha256 === sha256(expectedSpecBytes) &&
      JSON.stringify(specRead.value) ===
      JSON.stringify(expectedSpec.value) &&
      specRead.value.builderAnimationId === `course-${member.animationId}` &&
      specRead.value.finalAnimationId === member.animationId,
    `${member.animationId}: adapter spec reproduction drifted`);
    const built = buildSafeRuntime({
      helperSource: helperFile.buffer.toString("utf8"),
      framesHtml: framesFile.buffer.toString("utf8"),
      spec: expectedSpec.value,
    });
    const expectedRuntimeBytes = Buffer.from(finalizeRuntime(built.runtime,
      built.metadata, expectedSpec.value, placement, target,
      expectedSpec.stageMatrix));
    const runtimeFile = await stableOrdinaryFile(
      projectPath(expectedRuntimePath), `${member.animationId} safe runtime`);
    const expectedRuntime = {path: expectedRuntimePath,
      bytes: expectedRuntimeBytes.length, sha256: sha256(expectedRuntimeBytes),
      url: `/flash-assets/g678-local/${member.animationId}/canvas-renderer.js`,
      globalRegistry: ASSET_REGISTRY};
    invariant(runtimeFile.buffer.equals(expectedRuntimeBytes) &&
      JSON.stringify(manifest.runtime?.canvasRenderer) ===
        JSON.stringify(expectedRuntime) &&
      JSON.stringify(member.runtime) === JSON.stringify(expectedRuntime) &&
      JSON.stringify(manifest.timeline) === JSON.stringify({
        rootFrameCount: placement.rootFrameCount,
        rootBeginFrame: placement.rootBeginFrame,
        frameDomain: `sprite-${target.objectId}`,
        frameCount: placement.mainChild.frameCount,
        livePlaybackEndFrame: metadata.lastPlacedFrame,
        rootPlacementMatrix: target.matrix,
      }) && manifest.productCalibrationPassed === false &&
      manifest.engineeringPreviewReady === false &&
      hasExactFalseAcceptanceEffects(manifest.acceptanceEffects),
    `${member.animationId}: reproduced runtime or product boundary drifted`);
    results.push(Object.freeze({animationId: member.animationId,
      manifestPath: member.manifestPath, manifest: member.manifest,
      runtime: Object.freeze(expectedRuntime),
      placement,
      target, metadata}));
  }
  invariant(results.length === 13,
    "compiler run must contain exactly thirteen shared-adapter members");
  const tracked = await trackedOutputs(context, runBinding, results);
  await synchronizeTracked(tracked.output, true);
  return Object.freeze({runBinding, results, tracked});
}

export async function runCalibration({check = false} = {}) {
  const context = await loadContext();
  const result = check
    ? await checkCompilerRun(context)
    : await buildCompilerRun(context);
  return Object.freeze({calibrationId: CALIBRATION_ID,
    check, frozenPlacementCount: 16,
    registrationCandidatePlacementCount: 13,
    advancedManualPendingCount: 3,
    compilerRun: result.runBinding.path,
    freeze: FREEZE_PATH, fragment: FRAGMENT_PATH,
    scaleOutAuthorized: false, engineeringPreviewReady: false,
    acceptanceEffects: ACCEPTANCE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  runCalibration(options).then((result) => {
    process.stdout.write(stableJson(result));
  }).catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
