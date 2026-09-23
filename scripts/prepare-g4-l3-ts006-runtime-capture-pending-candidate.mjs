#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, mkdir, open, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {PNG} from "pngjs";

import {
  canonicalJson as bridgeCanonicalJson,
  validateTs006BridgeHashChain,
} from "./scaffold-g4-l3-ts006-natural-trace-bridge.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const SESSION_PATTERN = /^ts006-(en|es)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/iu;
const CAPTURE_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const PNG_SIGNATURE = "89504e470d0a1a0a";
const LEGACY_BOTTOM_CORNER_ALPHA_INVARIANT =
  "stable-full-frame-mask-with-only-native-18px-bottom-corners-non-opaque";
const LEGACY_FOUR_CORNER_ALPHA_INVARIANT =
  "stable-full-frame-mask-with-only-native-18px-four-corners-non-opaque";
const NATIVE_STAGE_EDGE_ALPHA_INVARIANT =
  "stable-full-frame-mask-with-only-native-3px-right-bottom-edges-plus-19px-bottom-corners-non-opaque";
const NETTOP_HEADER = "time,,interface,state,bytes_in,bytes_out,rx_dupe,rx_ooo,re-tx,rtt_avg,rcvsize,tx_win,tc_class,tc_mgt,cc_algo,P,C,R,W,arch,";
const EXPECTED_PROJECTOR_SHA256 = "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
const EXPECTED_CHILD_SHA256 = "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47";
const EXPECTED_SHELL_SHA256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const EXPECTED_SHELL_RELATIVE = "HELP_COURSES/ELMGR4/L3/index_local.swf";
const EXPECTED_CHILD_RELATIVE = "HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf";
const NATURAL_TRACE_LOG_FILES = Object.freeze({
  operation: "operation.jsonl",
  state: "state.jsonl",
  sourceTarget: "source-target.jsonl",
  hostEntry: "host-entry.jsonl",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stablePrettyJson(value) {
  const sort = (item) => {
    if (Array.isArray(item)) return item.map(sort);
    if (item && typeof item === "object") return Object.fromEntries(Object.keys(item).sort().map((key) => [key, sort(item[key])]));
    return item;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(parent, candidate, allowEqual = false) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return (allowEqual && relative === "") || (relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function parseTimestamp(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be an ISO timestamp`);
  const milliseconds = Date.parse(value);
  invariant(Number.isFinite(milliseconds), `${label} must be an ISO timestamp`);
  return milliseconds;
}

function validateFingerprint(record, field, label) {
  invariant(record && typeof record === "object" && !Array.isArray(record), `${label} must be an object`);
  const {[field]: fingerprint, ...withoutFingerprint} = record;
  invariant(HASH_PATTERN.test(fingerprint || ""), `${label}.${field} must be a SHA-256`);
  invariant(fingerprint === sha256(stableJson(withoutFingerprint)), `${label}.${field} does not match the canonical record`);
}

async function statIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertNoSymlinkComponents(root, candidate, label) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  invariant(isInside(resolvedRoot, resolvedCandidate, true), `${label} escapes its allowed root`);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  let cursor = resolvedRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const info = await statIfPresent(cursor);
    if (!info) return;
    invariant(!info.isSymbolicLink(), `${label} contains a symbolic-link component`);
  }
}

async function readRegular(root, candidate, label, {allowEmpty = true} = {}) {
  await assertNoSymlinkComponents(root, candidate, label);
  const before = await lstat(candidate);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1, `${label} must be a regular non-linked file`);
  const bytes = await readFile(candidate);
  const after = await lstat(candidate);
  invariant(after.isFile() && !after.isSymbolicLink() && after.nlink === 1, `${label} changed type or link count while read`);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size, `${label} changed identity while read`);
  invariant(allowEmpty || bytes.length > 0, `${label} must not be empty`);
  return {path: candidate, bytes, size: bytes.length, sha256: sha256(bytes)};
}

async function readJson(root, candidate, label) {
  const artifact = await readRegular(root, candidate, label, {allowEmpty: false});
  let value;
  try {
    value = JSON.parse(artifact.bytes);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {...artifact, value};
}

async function readCanonicalJsonl(root, candidate, label) {
  const artifact = await readRegular(root, candidate, label, {allowEmpty: false});
  const text = artifact.bytes.toString("utf8");
  invariant(Buffer.from(text, "utf8").equals(artifact.bytes), `${label} is not valid UTF-8`);
  invariant(text.endsWith("\n") && !text.includes("\r"), `${label} must use canonical newline-terminated JSONL`);
  const lines = text.slice(0, -1).split("\n");
  invariant(lines.length > 0 && lines.every((line) => line.length > 0), `${label} contains an empty or missing record`);
  const records = lines.map((line, index) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`${label} record ${index + 1} is invalid JSON: ${error.message}`);
    }
    invariant(line === bridgeCanonicalJson(record), `${label} record ${index + 1} is not canonical JSON`);
    return record;
  });
  return {...artifact, records};
}

function descriptor(projectRoot, artifact) {
  return {
    path: portable(path.relative(projectRoot, artifact.path)),
    bytes: artifact.size,
    sha256: artifact.sha256,
  };
}

async function resolveProjectDescriptor(projectRoot, declared, label) {
  invariant(declared && typeof declared.path === "string" && declared.path.length > 0, `${label}.path is required`);
  invariant(Number.isInteger(declared.bytes) && declared.bytes >= 0, `${label}.bytes is invalid`);
  invariant(HASH_PATTERN.test(declared.sha256 || ""), `${label}.sha256 is invalid`);
  const candidate = path.isAbsolute(declared.path) ? path.resolve(declared.path) : path.resolve(projectRoot, declared.path);
  if (!path.isAbsolute(declared.path)) invariant(isInside(projectRoot, candidate), `${label}.path escapes the project root`);
  const artifact = await readRegular(path.isAbsolute(declared.path) ? path.parse(candidate).root : projectRoot, candidate, label);
  invariant(artifact.size === declared.bytes && artifact.sha256 === declared.sha256, `${label} bytes or SHA-256 are stale`);
  return artifact;
}

function inspectPng(bytes, label) {
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === PNG_SIGNATURE, `${label} is not a PNG`);
  invariant(bytes.subarray(12, 16).toString("ascii") === "IHDR", `${label} has no leading IHDR chunk`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function parseRect(value, label) {
  invariant(typeof value === "string", `${label} must be a comma-delimited rectangle`);
  const parts = value.split(",").map((part) => Number(part));
  invariant(parts.length === 4 && parts.every(Number.isFinite), `${label} must be a comma-delimited rectangle`);
  return {x: parts[0], y: parts[1], width: parts[2], height: parts[3]};
}

function verifyAlphaMask(bytes, expectedSha256, alphaMaskInvariant, label) {
  let png;
  try {
    png = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} cannot be decoded as PNG: ${error.message}`);
  }
  invariant(png.width === 800 && png.height === 600, `${label} decoded dimensions are not 800x600`);
  const alphaMask = Buffer.alloc(png.width * png.height);
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const alpha = png.data[((y * png.width) + x) * 4 + 3];
      alphaMask[(y * png.width) + x] = alpha;
      let permittedNativeWindowMask;
      let policyLabel;
      if (alphaMaskInvariant === NATIVE_STAGE_EDGE_ALPHA_INVARIANT) {
        const withinRightEdge = x >= png.width - 3;
        const withinBottomEdge = y >= png.height - 3;
        const withinBottomCorner = y >= png.height - 19 && (x < 19 || x >= png.width - 19);
        permittedNativeWindowMask = withinRightEdge || withinBottomEdge || withinBottomCorner;
        policyLabel = "3px right/bottom edges plus 19px bottom-corner";
      } else {
        const permitsTopCorners = alphaMaskInvariant === LEGACY_FOUR_CORNER_ALPHA_INVARIANT;
        const withinCornerColumn = x < 18 || x >= png.width - 18;
        const withinCornerRow = permitsTopCorners
          ? y < 18 || y >= png.height - 18
          : y >= png.height - 18;
        permittedNativeWindowMask = withinCornerColumn && withinCornerRow;
        policyLabel = `18px ${permitsTopCorners ? "four-corner" : "bottom-corner"}`;
      }
      invariant(alpha === 255 || permittedNativeWindowMask, `${label} has non-opaque alpha outside the native ${policyLabel} mask at (${x},${y})`);
    }
  }
  const boundMask = alphaMaskInvariant === NATIVE_STAGE_EDGE_ALPHA_INVARIANT
    ? alphaMask.map((alpha) => alpha === 255 ? 255 : 0)
    : alphaMask;
  invariant(sha256(boundMask) === expectedSha256, `${label} alpha-mask SHA-256 differs from the capture manifest`);
  return alphaMask;
}

async function mapConcurrent(values, concurrency, operation) {
  const output = new Array(values.length);
  let nextIndex = 0;
  const workers = Array.from({length: Math.min(concurrency, Math.max(values.length, 1))}, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await operation(values[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

async function verifyFrames(projectRoot, captureRoot, frames, expectedAlphaMaskSha256, alphaMaskInvariant, alphaValueJitterTolerance) {
  invariant(Array.isArray(frames) && frames.length > 0, "capture manifest must contain at least one frame");
  invariant(HASH_PATTERN.test(expectedAlphaMaskSha256 || ""), "capture manifest frameAlphaMaskSha256 is invalid");
  const framesRoot = path.join(captureRoot, "frames");
  await assertNoSymlinkComponents(projectRoot, framesRoot, "capture frames directory");
  const frameRootInfo = await lstat(framesRoot);
  invariant(frameRootInfo.isDirectory() && !frameRootInfo.isSymbolicLink(), "capture frames must be a real directory");
  const entries = await readdir(framesRoot, {withFileTypes: true});
  invariant(entries.length === frames.length && entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()), "capture frames directory differs from the manifest inventory");
  const names = entries.map(({name}) => name).sort();
  let previousPresentation = -Infinity;
  let previousRelative = -Infinity;
  for (const [index, frame] of frames.entries()) {
    const ordinal = index + 1;
    const expected = `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
    invariant(frame?.ordinal === ordinal && frame.file === expected && frame.status === "complete", `frame ${ordinal} identity or status is invalid`);
    invariant(frame.width === 800 && frame.height === 600 && Number.isInteger(frame.bytes) && frame.bytes > 0, `frame ${ordinal} descriptor is not a non-empty 800x600 PNG`);
    invariant(HASH_PATTERN.test(frame.sha256 || ""), `frame ${ordinal} SHA-256 is invalid`);
    invariant(Number.isFinite(frame.presentationTimeSeconds) && frame.presentationTimeSeconds > previousPresentation, `frame ${ordinal} presentation time is not increasing`);
    invariant(Number.isFinite(frame.relativeTimeSeconds) && frame.relativeTimeSeconds >= 0 && frame.relativeTimeSeconds > previousRelative, `frame ${ordinal} relative time is not increasing`);
    if (ordinal === 1) invariant(frame.relativeTimeSeconds === 0, "first capture frame relative time must be zero");
    previousPresentation = frame.presentationTimeSeconds;
    previousRelative = frame.relativeTimeSeconds;
    invariant(names[index] === path.basename(expected), `frame ${ordinal} file is missing or reordered`);
  }
  let baselineAlphaMask = null;
  if (alphaMaskInvariant === NATIVE_STAGE_EDGE_ALPHA_INVARIANT) {
    const baselineArtifact = await readRegular(projectRoot, path.join(captureRoot, frames[0].file), "capture frame 1 alpha baseline", {allowEmpty: false});
    baselineAlphaMask = verifyAlphaMask(baselineArtifact.bytes, expectedAlphaMaskSha256, alphaMaskInvariant, "capture frame 1 alpha baseline");
  }
  const verified = await mapConcurrent(frames, 8, async (frame, index) => {
    const artifact = await readRegular(projectRoot, path.join(captureRoot, frame.file), `capture frame ${index + 1}`, {allowEmpty: false});
    invariant(artifact.size === frame.bytes && artifact.sha256 === frame.sha256, `capture frame ${index + 1} bytes or SHA-256 differ from the manifest`);
    const dimensions = inspectPng(artifact.bytes, `capture frame ${index + 1}`);
    invariant(dimensions.width === 800 && dimensions.height === 600, `capture frame ${index + 1} PNG dimensions are not 800x600`);
    const alphaMask = verifyAlphaMask(artifact.bytes, expectedAlphaMaskSha256, alphaMaskInvariant, `capture frame ${index + 1}`);
    let maximumAlphaValueDelta = 0;
    if (baselineAlphaMask) {
      for (let offset = 0; offset < alphaMask.length; offset += 1) {
        maximumAlphaValueDelta = Math.max(maximumAlphaValueDelta, Math.abs(alphaMask[offset] - baselineAlphaMask[offset]));
      }
      invariant(maximumAlphaValueDelta <= alphaValueJitterTolerance, `capture frame ${index + 1} native-edge alpha drift exceeds the declared tolerance`);
    }
    return {ordinal: frame.ordinal, file: frame.file, bytes: frame.bytes, sha256: frame.sha256, maximumAlphaValueDelta};
  });
  const durationSeconds = frames.at(-1).relativeTimeSeconds;
  const effectiveFps = frames.length > 1 && durationSeconds > 0 ? (frames.length - 1) / durationSeconds : null;
  invariant(frames.length === 1 || (effectiveFps >= 10.5 && effectiveFps <= 13.5), `capture effective FPS ${effectiveFps} is outside the fail-closed 12 FPS envelope`);
  return {
    count: verified.length,
    totalPngBytes: verified.reduce((total, frame) => total + frame.bytes, 0),
    first: verified[0],
    last: verified.at(-1),
    durationSeconds,
    effectiveFps,
    maximumAlphaValueDelta: verified.reduce((maximum, frame) => Math.max(maximum, frame.maximumAlphaValueDelta), 0),
    orderedFrameSetAlgorithm: "ordinal-null-path-null-sha256-newline-v1",
    orderedFrameSetSha256: sha256(Buffer.from(verified.map((frame) => `${frame.ordinal}\u0000${frame.file}\u0000${frame.sha256}\n`).join(""))),
  };
}

function verifyNettopNoRows(bytes) {
  const lines = bytes.toString("utf8").replaceAll("\r", "").split("\n").filter((line) => line.length > 0);
  invariant(lines.some((line) => line === NETTOP_HEADER), "nettop audit contains no complete header sample");
  const unexpected = lines.filter((line) => line !== NETTOP_HEADER && !NETTOP_HEADER.startsWith(line));
  invariant(unexpected.length === 0, "nettop audit contains a process/network row or unrecognized output");
  return {sampleCount: lines.filter((line) => line === NETTOP_HEADER).length, truncatedHeaderCount: lines.filter((line) => line !== NETTOP_HEADER).length};
}

function verifyProjectorStderr(bytes, expectedPid) {
  const text = bytes.toString("utf8");
  invariant(Buffer.from(text, "utf8").equals(bytes), "projector stderr is not valid UTF-8");
  const lines = text.split("\n").filter((line) => line.length > 0);
  const diagnostic = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) Flash Player\[(\d+):(\d+)\] error messaging the mach port for IMKCFRunLoopWakeUpReliable$/u;
  for (const line of lines) {
    const match = diagnostic.exec(line);
    invariant(match && Number(match[2]) === expectedPid, "projector stderr contains an unrecognized or wrong-PID diagnostic");
  }
  return {
    lineCount: lines.length,
    exactPidBoundInputMethodKitDiagnosticCount: lines.length,
    unrecognizedLineCount: 0,
    diagnosticAuthorityEffect: "none",
  };
}

async function inventoryDirectory(projectRoot, directory, label) {
  await assertNoSymlinkComponents(projectRoot, directory, label);
  const rootInfo = await lstat(directory);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), `${label} must be a real directory`);
  const records = [];
  async function visit(cursor, relativeRoot = "") {
    const entries = (await readdir(cursor, {withFileTypes: true})).sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relative = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
      const candidate = path.join(cursor, entry.name);
      invariant(!entry.isSymbolicLink(), `${label} contains a symbolic link: ${relative}`);
      if (entry.isDirectory()) await visit(candidate, relative);
      else if (entry.isFile()) {
        const artifact = await readRegular(projectRoot, candidate, `${label} ${relative}`);
        records.push({path: relative, bytes: artifact.size, sha256: artifact.sha256});
      } else throw new Error(`${label} contains an unsupported filesystem entry: ${relative}`);
    }
  }
  await visit(directory);
  return {
    fileCount: records.length,
    totalBytes: records.reduce((total, record) => total + record.bytes, 0),
    inventoryAlgorithm: "sorted-relative-path-null-bytes-null-sha256-newline-v1",
    inventorySha256: sha256(Buffer.from(records.map((record) => `${record.path}\u0000${record.bytes}\u0000${record.sha256}\n`).join(""))),
    files: records,
  };
}

function validateAcceptanceNeutral(record, label) {
  invariant(record?.acceptanceNeutral === true, `${label} must remain acceptance-neutral`);
  for (const key of ["authoritativeOriginalRuntimeTrace", "baselineAccepted", "audioAccepted", "humanVisualAccepted", "ownerAccepted", "strictMigrationComplete", "publicRelease"]) {
    invariant(record[key] === false, `${label}.${key} must remain false`);
  }
}

async function bindTraceSpecifications(projectRoot, launchReceipt, language) {
  const bindings = launchReceipt.traceSpecificationBindings;
  invariant(bindings?.authority === "pending-candidate-specification-only" && bindings.executionReportsPresent === false, "launch trace binding must remain pending and unexecuted");
  invariant(Array.isArray(bindings.requirements) && bindings.requirements.length === 2, "launch receipt must bind exactly the TS006 root and sprite-23 requirements for one language");
  const indexArtifact = await resolveProjectDescriptor(projectRoot, bindings.index, "trace-spec index");
  const index = JSON.parse(indexArtifact.bytes);
  invariant(index.schemaVersion === 1 && index.artifactType === "course-shell-pilot-trace-spec-index", "trace-spec index type is invalid");
  const pilot = index.pilots?.find((item) => item.animationId === ANIMATION_ID);
  invariant(pilot && Array.isArray(pilot.traceSpecs), "trace-spec index has no TS006 pilot entry");
  const requirements = [];
  for (const binding of bindings.requirements) {
    invariant(binding.language === language && binding.seed === "0", `trace binding ${binding.requirementId || "unknown"} language/seed differs from the session`);
    invariant(["root", "sprite-23"].includes(binding.frameDomainId), `trace binding ${binding.requirementId || "unknown"} has an unexpected frame domain`);
    invariant(HASH_PATTERN.test(binding.sha256 || "") && HASH_PATTERN.test(binding.entryStateSha256 || ""), `trace binding ${binding.requirementId || "unknown"} has an invalid hash`);
    invariant(binding.orderedStepCount === 9 && binding.executedStepCount === 0, `trace binding ${binding.requirementId || "unknown"} must retain nine planned and zero executed steps`);
    const artifact = await resolveProjectDescriptor(projectRoot, {
      path: binding.file,
      bytes: binding.bytes,
      sha256: binding.sha256,
    }, `trace specification ${binding.requirementId}`);
    const spec = JSON.parse(artifact.bytes);
    invariant(spec.schemaVersion === 1 && spec.artifactType === "course-pilot-original-runtime-trace-specification" && spec.animationId === ANIMATION_ID, `trace specification ${binding.requirementId} identity is invalid`);
    invariant(spec.requirementId === binding.requirementId && spec.traceSpecStatus === binding.traceSpecStatus, `trace specification ${binding.requirementId} status or requirement differs from the launch receipt`);
    invariant(spec.identity?.traceId === binding.traceId && spec.identity?.frameDomainId === binding.frameDomainId && spec.identity?.entryStateSha256 === binding.entryStateSha256, `trace specification ${binding.requirementId} capture identity differs from the launch receipt`);
    invariant(spec.identity?.language === language && spec.identity?.seed === "0" && spec.identity?.scenario === binding.scenario, `trace specification ${binding.requirementId} scenario/language/seed differs from the launch receipt`);
    invariant(spec.identity?.baselineAuthorityRequirement === "original-runtime-natural-trace", `trace specification ${binding.requirementId} does not require a natural trace`);
    invariant(spec.frameDomain?.nativeStage?.width === 800 && spec.frameDomain?.nativeStage?.height === 600 && spec.frameDomain?.fps === 12, `trace specification ${binding.requirementId} is not 800x600 at 12 FPS`);
    invariant(spec.sourceBindings?.sourceSwf?.sha256 === EXPECTED_CHILD_SHA256, `trace specification ${binding.requirementId} source SWF hash is invalid`);
    invariant(Array.isArray(spec.schedule?.orderedSteps) && spec.schedule.orderedSteps.length === 9 && (spec.schedule.executedSteps || []).length === 0, `trace specification ${binding.requirementId} planned/executed steps are invalid`);
    const indexed = pilot.traceSpecs.find((item) => item.requirementId === binding.requirementId);
    invariant(indexed && indexed.file === binding.file && indexed.sha256 === binding.sha256 && indexed.status === binding.traceSpecStatus && indexed.traceId === binding.traceId, `trace specification ${binding.requirementId} differs from the exact global index entry`);
    invariant(indexed.expectedExecutionReport === binding.expectedExecutionReport, `trace specification ${binding.requirementId} execution-report path differs from the index`);
    const reportPath = path.resolve(projectRoot, binding.expectedExecutionReport);
    invariant(isInside(projectRoot, reportPath), `trace specification ${binding.requirementId} execution-report path escapes the project`);
    invariant(!(await statIfPresent(reportPath)), `trace specification ${binding.requirementId} already has an execution report; raw-session bridge refuses to conflate evidence layers`);
    requirements.push({
      requirementId: binding.requirementId,
      traceId: binding.traceId,
      frameDomainId: binding.frameDomainId,
      scenario: binding.scenario,
      language,
      seed: binding.seed,
      entryStateSha256: binding.entryStateSha256,
      traceSpecStatus: binding.traceSpecStatus,
      traceSpec: descriptor(projectRoot, artifact),
      expectedExecutionReport: binding.expectedExecutionReport,
      executionReportPresent: false,
    });
  }
  invariant(new Set(requirements.map(({frameDomainId}) => frameDomainId)).size === 2, "trace bindings must contain one root and one sprite-23 requirement");
  return {index: descriptor(projectRoot, indexArtifact), requirements};
}

function parseSessionRoot(projectRoot, sessionRoot) {
  const root = path.resolve(projectRoot, "artifacts/full-frame/g4-l3");
  const resolved = path.resolve(sessionRoot);
  invariant(isInside(root, resolved), "--session-root must be a direct TS006 session below artifacts/full-frame/g4-l3");
  invariant(path.dirname(resolved) === root, "--session-root must be a direct child of artifacts/full-frame/g4-l3");
  const match = SESSION_PATTERN.exec(path.basename(resolved));
  invariant(match, "--session-root basename must be ts006-(en|es)-<uuid>");
  return {resolved, language: match[1], sessionId: path.basename(resolved), artifactRoot: root};
}

async function verifyWithCanonicalTs006Recorder(options) {
  const recorder = await import("./record-g4-l3-ts006-natural-trace.mjs");
  invariant(typeof recorder.verifyTs006NaturalTraceRecorder === "function", "TS006 natural-trace recorder verifier export is unavailable");
  return recorder.verifyTs006NaturalTraceRecorder(options);
}

function expectedCaptureBinding(projectRoot, sessionId, captureName, captureRoot) {
  void projectRoot;
  invariant(path.basename(captureRoot) === captureName, "capture root basename differs from its binding");
  return {
    sessionId,
    captureName,
    captureDirectory: captureName,
    captureManifestFile: "capture-manifest.json",
    bindingStatus: "capture-name-bound-manifest-hash-pending-until-complete-verification",
  };
}

function assertSafeCaptureMember(relative, label) {
  invariant(typeof relative === "string" && relative.length > 0, `${label} is missing`);
  invariant(!path.isAbsolute(relative) && !relative.includes("\\") && path.posix.normalize(relative) === relative, `${label} is not a canonical capture-relative path`);
  invariant(relative !== "." && relative !== ".." && !relative.startsWith("../") && !relative.includes("/../"), `${label} escapes the selected capture`);
}

export async function bindOptionalTs006NaturalTraceLogs({
  projectRoot,
  sessionRoot,
  captureRoot,
  captureName,
  captureDocument,
  verifyRecorder = verifyWithCanonicalTs006Recorder,
} = {}) {
  const root = path.resolve(projectRoot);
  const resolvedSessionRoot = path.resolve(sessionRoot);
  const resolvedCaptureRoot = path.resolve(captureRoot);
  const session = parseSessionRoot(root, resolvedSessionRoot);
  invariant(path.dirname(resolvedCaptureRoot) === path.join(resolvedSessionRoot, "evidence/raw-captures"), "selected capture root is not a direct child of the session raw-captures root");
  invariant(path.basename(resolvedCaptureRoot) === captureName, "selected capture root basename differs from the selected capture name");
  invariant(captureDocument?.path === path.join(resolvedCaptureRoot, "capture-manifest.json"), "selected capture manifest path differs from the selected capture root");
  invariant(captureDocument?.value && captureDocument.sha256 === sha256(captureDocument.bytes), "selected capture manifest descriptor is missing or stale");

  const naturalTraceRoot = path.join(resolvedSessionRoot, "evidence/natural-trace-logs");
  const rootInfo = await statIfPresent(naturalTraceRoot);
  if (!rootInfo) {
    return {
      present: false,
      machineIntegrityVerified: false,
      blocker: "no-hash-chained-operation-event-log",
    };
  }
  await assertNoSymlinkComponents(root, naturalTraceRoot, "natural-trace log root");
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), "natural-trace log root must be a real directory");

  const bundleRoot = path.join(naturalTraceRoot, captureName);
  const bundleInfo = await statIfPresent(bundleRoot);
  if (!bundleInfo) {
    return {
      present: false,
      machineIntegrityVerified: false,
      blocker: "no-hash-chained-operation-event-log",
    };
  }
  await assertNoSymlinkComponents(root, bundleRoot, "selected natural-trace log bundle");
  invariant(bundleInfo.isDirectory() && !bundleInfo.isSymbolicLink() && path.dirname(bundleRoot) === naturalTraceRoot, "selected natural-trace log bundle must be a real direct-child directory");

  const required = [
    "recorder-manifest.json",
    "session-contract.json",
    ...Object.values(NATURAL_TRACE_LOG_FILES),
  ];
  for (const name of required) {
    const candidate = path.join(bundleRoot, name);
    const info = await statIfPresent(candidate);
    invariant(info, `selected natural-trace log bundle is incomplete: missing ${name}`);
    invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1, `selected natural-trace log bundle member ${name} must be a regular single-link file`);
  }

  const [recorderManifest, sessionContractDocument, operationPreflight, statePreflight, sourceTargetPreflight, hostEntryPreflight] = await Promise.all([
    readJson(root, path.join(bundleRoot, "recorder-manifest.json"), "natural-trace recorder manifest"),
    readJson(root, path.join(bundleRoot, "session-contract.json"), "natural-trace session contract"),
    readRegular(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.operation), "natural-trace operation log preflight"),
    readRegular(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.state), "natural-trace state log preflight"),
    readRegular(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.sourceTarget), "natural-trace source-target log preflight"),
    readRegular(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.hostEntry), "natural-trace host-entry log preflight"),
  ]);
  const sessionContract = sessionContractDocument.value;
  invariant(sessionContract?.artifactType === "ts006-natural-trace-session-contract", "natural-trace session contract type is invalid");
  invariant(sessionContract.animationId === ANIMATION_ID && sessionContract.sessionId === session.sessionId && sessionContract.language === session.language, "natural-trace session contract identity differs from the selected session");
  const recorder = recorderManifest.value;
  invariant(recorder?.schemaVersion === 1
    && recorder.artifactType === "ts006-natural-trace-append-only-recorder"
    && recorder.status === "initialized-pending-candidate-only"
    && recorder.animationId === ANIMATION_ID
    && recorder.sessionId === session.sessionId
    && recorder.language === session.language,
  "natural-trace recorder manifest identity or status is invalid");
  const captureBinding = expectedCaptureBinding(root, session.sessionId, captureName, resolvedCaptureRoot);
  invariant(bridgeCanonicalJson(recorder.captureBinding) === bridgeCanonicalJson(captureBinding), "natural-trace recorder manifest capture binding differs from the selected capture");
  invariant(recorder.machineClaim?.automationEventProvenanceBound === true
    && recorder.machineClaim?.namedRuntimeOperatorBound === false
    && recorder.machineClaim?.namedHumanSessionAttestationEstablished === false
    && recorder.machineClaim?.independentHumanReviewEstablished === false
    && recorder.machineClaim?.ownerAcceptanceEstablished === false
    && recorder.machineClaim?.signatureTrustEstablished === false
    && recorder.machineClaim?.originalRuntimeAuthorityEstablished === false
    && recorder.promotionEligible === false
    && recorder.strictAcceptanceEffect === "none",
  "natural-trace recorder manifest crosses the automation-only machine-integrity boundary");

  const preflightLogs = {
    operation: operationPreflight,
    state: statePreflight,
    sourceTarget: sourceTargetPreflight,
    hostEntry: hostEntryPreflight,
  };
  const emptyLogKinds = Object.entries(preflightLogs)
    .filter(([, artifact]) => artifact.size === 0)
    .map(([kind]) => kind);
  if (emptyLogKinds.length > 0) {
    invariant(emptyLogKinds.length === Object.keys(preflightLogs).length,
      `selected natural-trace log bundle is partially initialized: empty ${emptyLogKinds.join(", ")}`);
    return {
      present: true,
      machineIntegrityVerified: false,
      blocker: "no-hash-chained-operation-event-log",
      completionState: "initialized-empty-recorder-logs",
      authorityClassification: "recorder-initialized-no-hash-chain",
      directory: portable(path.relative(root, bundleRoot)),
      recorderManifest: descriptor(root, recorderManifest),
      sessionContract: descriptor(root, sessionContractDocument),
      logs: Object.fromEntries(Object.entries(preflightLogs).map(([kind, artifact]) => [kind, {
        ...descriptor(root, artifact),
        recordCount: 0,
        chainHeadSha256: null,
      }])),
      captureBinding: {
        ...captureBinding,
        captureManifest: descriptor(root, captureDocument),
      },
      recorderVerifierPassed: false,
      unresolvedAuthority: {
        naturalTraceExecutionEstablished: false,
        authoritativeOriginalRuntimeTrace: false,
        authoritativeBaseline: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        externalSignatureTrustRootEstablished: false,
        strictMigrationComplete: false,
        publicRelease: false,
      },
    };
  }

  const recorderVerification = await verifyRecorder({
    projectRoot: root,
    allowedSessionsRoot: path.join(root, "artifacts/full-frame/g4-l3"),
    sessionRoot: resolvedSessionRoot,
    captureName,
    complete: true,
    requireCurrentBridge: false,
  });
  invariant(recorderVerification && typeof recorderVerification === "object" && !Array.isArray(recorderVerification), "TS006 natural-trace recorder verifier returned no machine verification");

  const [operationLog, stateLog, sourceTargetLog, hostEntryLog] = await Promise.all([
    readCanonicalJsonl(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.operation), "natural-trace operation log"),
    readCanonicalJsonl(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.state), "natural-trace state log"),
    readCanonicalJsonl(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.sourceTarget), "natural-trace source-target log"),
    readCanonicalJsonl(root, path.join(bundleRoot, NATURAL_TRACE_LOG_FILES.hostEntry), "natural-trace host-entry log"),
  ]);

  const records = {
    operation: operationLog.records,
    state: stateLog.records,
    sourceTarget: sourceTargetLog.records,
    hostEntry: hostEntryLog.records,
  };
  const bridgeChainValidation = {
    operation: validateTs006BridgeHashChain(records.operation, {
      kind: "operation",
      sessionContract,
    }),
    state: validateTs006BridgeHashChain(records.state, {
      kind: "state",
      sessionContract,
    }),
    sourceTarget: validateTs006BridgeHashChain(records.sourceTarget, {
      kind: "source-target",
      sessionContract,
    }),
  };
  for (let index = 0; index < sessionContract.schedule.length; index += 1) {
    const target = records.sourceTarget[index];
    const pre = records.state[index * 2];
    const operation = records.operation[index];
    const post = records.state[index * 2 + 1];
    invariant(operation.sourceTargetRecordSha256 === target.recordSha256, `natural-trace bundle step ${index + 1} operation does not bind its source-target record`);
    invariant(operation.preStateRecordSha256 === pre.recordSha256, `natural-trace bundle step ${index + 1} operation does not bind its pre-state record`);
    invariant(post.causalOperationEventSha256 === operation.eventSha256, `natural-trace bundle step ${index + 1} post-state does not bind its causal operation`);
    invariant(target.monotonicTimeMs <= pre.monotonicTimeMs
      && pre.monotonicTimeMs <= operation.monotonicTimeMs
      && operation.monotonicTimeMs <= post.monotonicTimeMs,
    `natural-trace bundle step ${index + 1} cross-log monotonic order is invalid`);
  }

  const allRecords = Object.values(records).flat();
  for (const [index, record] of allRecords.entries()) {
    invariant(bridgeCanonicalJson(record.captureBinding) === bridgeCanonicalJson(captureBinding), `natural-trace record ${index + 1} capture binding differs from the selected capture`);
  }

  const operators = new Map(allRecords.map((record) => [bridgeCanonicalJson(record.operator), record.operator]));
  invariant(operators.size === 1, "natural-trace logs mix more than one automation-recorder identity");
  const operator = [...operators.values()][0];
  invariant(typeof operator.externalSubjectId === "string" && operator.externalSubjectId.length > 0
    && typeof operator.displayName === "string" && operator.displayName.length > 0
    && operator.subjectType === "automation"
    && operator.role === "machine-event-recorder"
    && operator.namedHuman === false
    && operator.provenanceClassification === "automation-only-not-human-attestation"
    && operator.independentReviewer === false
    && operator.ownerRoleUsed === false
    && operator.releaseCustodianRoleUsed === false,
  "natural-trace automation recorder cannot be reused as a named human, reviewer, owner, or release custodian");
  invariant(bridgeCanonicalJson(recorder.operator) === bridgeCanonicalJson(operator), "natural-trace record operator differs from the immutable recorder manifest");

  const capture = captureDocument.value;
  const frames = new Map(capture.frames.map((frame) => [frame.file, frame]));
  const frameHashes = new Set(capture.frames.map((frame) => frame.sha256));
  const verifiedScreenshotFiles = new Map();
  for (const [index, record] of records.state.entries()) {
    assertSafeCaptureMember(record.screenshotFile, `state record ${index + 1} screenshotFile`);
    const frame = frames.get(record.screenshotFile);
    invariant(frame, `state record ${index + 1} screenshot is not a member of the selected capture manifest`);
    invariant(record.screenshotSha256 === frame.sha256 && record.width === frame.width && record.height === frame.height, `state record ${index + 1} screenshot descriptor differs from the selected capture manifest`);
    if (!verifiedScreenshotFiles.has(record.screenshotFile)) {
      const screenshot = await readRegular(root, path.join(resolvedCaptureRoot, record.screenshotFile), `state record ${index + 1} screenshot`, {allowEmpty: false});
      invariant(screenshot.sha256 === frame.sha256 && screenshot.size === frame.bytes, `state record ${index + 1} screenshot bytes differ from the selected capture manifest`);
      verifiedScreenshotFiles.set(record.screenshotFile, descriptor(root, screenshot));
    }
  }
  const hostEntryScreenshotRecords = records.hostEntry.filter((item) => item.hostEntryEvent === "ts006-root-entry-observed" || item.hostEntryEvent === "ts006-nested-entry-observed");
  for (const record of hostEntryScreenshotRecords) {
    invariant(frameHashes.has(record.screenshotSha256), `host-entry ${record.hostEntryEvent} screenshot SHA-256 is not a member of the selected capture manifest`);
  }

  const audioRecord = records.operation.find((record) => record.audioObservation);
  if (audioRecord) {
    assertSafeCaptureMember(audioRecord.audioObservation.losslessSessionAudioFile, "natural-trace audio file");
    invariant(audioRecord.audioObservation.losslessSessionAudioFile === capture.audio?.outputFile
      && audioRecord.audioObservation.losslessSessionAudioSha256 === capture.audio?.outputSha256,
    "natural-trace audio observation differs from the selected lossless capture audio");
  }

  invariant(recorderVerification.schemaVersion === 1
    && recorderVerification.artifactType === "ts006-natural-trace-recorder-machine-validation"
    && recorderVerification.status === "complete-log-shape-and-machine-integrity-valid-not-authoritative"
    && recorderVerification.animationId === ANIMATION_ID
    && recorderVerification.sessionId === session.sessionId
    && recorderVerification.language === session.language
    && recorderVerification.machineIntegrityEstablished === true
    && recorderVerification.authoritativeOriginalRuntimeTraceEstablished === false
    && recorderVerification.signatureTrustEstablished === false
    && recorderVerification.promotionEligible === false
    && recorderVerification.strictAcceptanceEffect === "none",
  "canonical recorder verifier did not return complete, authority-neutral machine integrity");
  invariant(bridgeCanonicalJson(recorderVerification.captureBinding) === bridgeCanonicalJson(captureBinding), "canonical recorder verifier capture binding differs from the selected capture");
  invariant(recorderVerification.captureManifest?.path === "capture-manifest.json"
    && recorderVerification.captureManifest?.bytes === captureDocument.size
    && recorderVerification.captureManifest?.sha256 === captureDocument.sha256
    && recorderVerification.captureManifest?.frameCount === capture.frames.length
    && recorderVerification.captureManifest?.screenshotRecordCount === records.state.length
      + records.hostEntry.filter((record) => record.screenshotFile).length
    && recorderVerification.captureManifest?.everyScreenshotIsCaptureMember === true,
  "canonical recorder verifier capture-manifest or screenshot-membership proof differs from the selected capture");
  invariant(recorderVerification.verifiedScreenshotFileCount === recorderVerification.captureManifest.screenshotRecordCount, "canonical recorder verifier screenshot-byte count differs from capture membership");
  invariant(recorderVerification.completeBundleValidation?.schemaVersion === 1
    && recorderVerification.completeBundleValidation?.artifactType === "ts006-automation-natural-trace-log-bundle-structural-validation"
    && recorderVerification.completeBundleValidation?.status === "complete-automation-log-shape-not-named-human-not-authoritative-not-promoted"
    && recorderVerification.completeBundleValidation?.namedHumanFileOpenObserved === false
    && recorderVerification.completeBundleValidation?.automationFileOpenObserved === true
    && recorderVerification.completeBundleValidation?.namedHumanSessionAttestationEstablished === false
    && recorderVerification.completeBundleValidation?.authoritativeEvidenceEstablished === false
    && recorderVerification.completeBundleValidation?.promotionEligible === false
    && recorderVerification.completeBundleValidation?.strictAcceptanceEffect === "none",
  "canonical recorder complete-bundle validation is not automation-only, authority-neutral machine integrity");
  invariant(recorderVerification.bridgeNamedHumanBundleValidationPerformed === false, "automation logs were improperly passed through the named-human host-entry validator");
  const expectedChainHeads = {
    operation: bridgeChainValidation.operation.chainHeadSha256,
    state: bridgeChainValidation.state.chainHeadSha256,
    "source-target": bridgeChainValidation.sourceTarget.chainHeadSha256,
    "host-entry": records.hostEntry.at(-1).recordSha256,
  };
  invariant(bridgeCanonicalJson(recorderVerification.completeBundleValidation.chainHeads) === bridgeCanonicalJson(expectedChainHeads)
    && recorderVerification.completeBundleValidation.bundleDigestSha256 === sha256(Buffer.from(bridgeCanonicalJson(expectedChainHeads))),
  "canonical recorder complete-bundle chain heads or digest differ from the selected logs");
  invariant(recorderVerification.roleSeparation?.automationEventProvenanceRecorded === true
    && recorderVerification.roleSeparation?.runtimeOperatorRecorded === false
    && recorderVerification.roleSeparation?.namedHumanSessionAttestationEstablished === false
    && recorderVerification.roleSeparation?.independentVisualReviewerRecorded === false
    && recorderVerification.roleSeparation?.ownerRecorded === false
    && recorderVerification.roleSeparation?.releaseCustodianRecorded === false,
  "canonical recorder verifier improperly converts automation provenance into a human or acceptance role");
  for (const [kind, log] of [
    ["operation", operationLog],
    ["state", stateLog],
    ["source-target", sourceTargetLog],
    ["host-entry", hostEntryLog],
  ]) {
    const verified = recorderVerification.logs?.[kind];
    const expectedHead = kind === "host-entry"
      ? records.hostEntry.at(-1).recordSha256
      : kind === "source-target"
        ? bridgeChainValidation.sourceTarget.chainHeadSha256
        : bridgeChainValidation[kind].chainHeadSha256;
    invariant(verified?.path === `${kind}.jsonl`
      && verified.records === log.records.length
      && verified.bytes === log.size
      && verified.sha256 === log.sha256
      && verified.chainHeadSha256 === expectedHead,
    `canonical recorder verifier ${kind} descriptor differs from the selected log`);
  }

  return {
    present: true,
    machineIntegrityVerified: true,
    authorityClassification: "hash-chain-machine-integrity-only",
    directory: portable(path.relative(root, bundleRoot)),
    recorderManifest: descriptor(root, recorderManifest),
    sessionContract: descriptor(root, sessionContractDocument),
    logs: {
      operation: {...descriptor(root, operationLog), recordCount: operationLog.records.length, chainHeadSha256: expectedChainHeads.operation},
      state: {...descriptor(root, stateLog), recordCount: stateLog.records.length, chainHeadSha256: expectedChainHeads.state},
      sourceTarget: {...descriptor(root, sourceTargetLog), recordCount: sourceTargetLog.records.length, chainHeadSha256: expectedChainHeads["source-target"]},
      hostEntry: {...descriptor(root, hostEntryLog), recordCount: hostEntryLog.records.length, chainHeadSha256: expectedChainHeads["host-entry"]},
    },
    captureBinding: {
      ...captureBinding,
      captureManifest: descriptor(root, captureDocument),
      stateScreenshotRecordCount: records.state.length,
      uniqueStateScreenshotFileCount: verifiedScreenshotFiles.size,
      hostEntryScreenshotMembershipCount: hostEntryScreenshotRecords.length,
      recorderVerifiedScreenshotFileCount: recorderVerification.verifiedScreenshotFileCount,
    },
    operator: {
      externalSubjectId: operator.externalSubjectId,
      displayName: operator.displayName,
      subjectType: "automation",
      role: "machine-event-recorder",
      namedHuman: false,
      provenanceClassification: "automation-only-not-human-attestation",
      independentReviewer: false,
      ownerRoleUsed: false,
      releaseCustodianRoleUsed: false,
      namedHumanSessionAttestationEstablished: false,
      reviewerOrOwnerAuthorityEstablished: false,
    },
    structuralValidation: {
      schemaVersion: recorderVerification.completeBundleValidation.schemaVersion,
      artifactType: recorderVerification.completeBundleValidation.artifactType,
      status: recorderVerification.completeBundleValidation.status,
      chainHeads: recorderVerification.completeBundleValidation.chainHeads,
      bundleDigestSha256: recorderVerification.completeBundleValidation.bundleDigestSha256,
      namedHumanFileOpenObserved: false,
      automationFileOpenObserved: true,
      namedHumanSessionAttestationEstablished: false,
      authoritativeEvidenceEstablished: false,
      strictAcceptanceEffect: "none",
    },
    recorderVerifierPassed: true,
    unresolvedAuthority: {
      naturalTraceExecutionEstablished: false,
      authoritativeOriginalRuntimeTrace: false,
      authoritativeBaseline: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      externalSignatureTrustRootEstablished: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
}

function validateCandidateBoundary(candidate) {
  invariant(candidate.status.startsWith("pending-candidate-"), "candidate status must remain pending-candidate");
  invariant(candidate.promotionEligible === false && candidate.acceptanceEffect === "none", "candidate must not be promotion-eligible or affect acceptance");
  validateAcceptanceNeutral(candidate.acceptance, "candidate acceptance");
  for (const value of Object.values(candidate.authority || {})) invariant(value === false || value === "raw-session-machine-integrity-only", "candidate authority contains an escalated value");
}

async function ensureRealDirectory(projectRoot, directory, label, {create = false} = {}) {
  await assertNoSymlinkComponents(projectRoot, directory, label);
  if (create && !(await statIfPresent(directory))) await mkdir(directory, {recursive: false, mode: 0o700});
  const info = await lstat(directory);
  invariant(info.isDirectory() && !info.isSymbolicLink(), `${label} must be a real directory`);
  return directory;
}

async function writeNewReadOnly(projectRoot, destination, bytes) {
  await assertNoSymlinkComponents(projectRoot, destination, "pending candidate output");
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(destination, flags, 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const artifact = await readRegular(projectRoot, destination, "pending candidate output", {allowEmpty: false});
  invariant(artifact.bytes.equals(bytes), "pending candidate output changed immediately after no-replace write");
}

export async function prepareTs006RuntimeCapturePendingCandidate({
  projectRoot = DEFAULT_PROJECT_ROOT,
  sessionRoot,
  captureName,
  write = true,
  scriptPath = SCRIPT_PATH,
} = {}) {
  const root = path.resolve(projectRoot);
  invariant(CAPTURE_NAME_PATTERN.test(captureName || "") && captureName !== "." && captureName !== "..", "--capture must be a safe direct-child capture name");
  const session = parseSessionRoot(root, sessionRoot);
  await assertNoSymlinkComponents(session.artifactRoot, session.resolved, "TS006 session root");
  const realArtifactRoot = await realpath(session.artifactRoot);
  const realSessionRoot = await realpath(session.resolved);
  invariant(path.dirname(realSessionRoot) === realArtifactRoot, "TS006 session realpath is not a direct child of the fixed artifact root");

  const evidenceRoot = await ensureRealDirectory(root, path.join(session.resolved, "evidence"), "session evidence root");
  const logsRoot = await ensureRealDirectory(root, path.join(evidenceRoot, "logs"), "session logs root");
  const rawCaptureRoot = await ensureRealDirectory(root, path.join(evidenceRoot, "raw-captures"), "session raw-captures root");
  const captureRoot = path.join(rawCaptureRoot, captureName);
  await assertNoSymlinkComponents(root, captureRoot, "selected raw capture");
  const captureInfo = await lstat(captureRoot);
  invariant(captureInfo.isDirectory() && !captureInfo.isSymbolicLink() && path.dirname(captureRoot) === rawCaptureRoot, "selected raw capture must be a real direct-child directory");
  const captureEntries = (await readdir(captureRoot, {withFileTypes: true})).sort((left, right) => left.name.localeCompare(right.name));
  invariant(captureEntries.length === 3
    && captureEntries[0]?.name === "capture-manifest.json" && captureEntries[0].isFile() && !captureEntries[0].isSymbolicLink()
    && captureEntries[1]?.name === "frames" && captureEntries[1].isDirectory() && !captureEntries[1].isSymbolicLink()
    && captureEntries[2]?.name === "system-audio-lossless.m4a" && captureEntries[2].isFile() && !captureEntries[2].isSymbolicLink(),
  "selected raw capture must contain exactly capture-manifest.json, frames/, and system-audio-lossless.m4a");

  const [profileDocument, preflightDocument, launchDocument, exitDocument, captureDocument, generatorArtifact] = await Promise.all([
    readJson(root, path.join(session.resolved, "profile-manifest.json"), "profile manifest"),
    readJson(root, path.join(logsRoot, "preflight.json"), "session preflight"),
    readJson(root, path.join(logsRoot, "launch-receipt.json"), "Projector launch receipt"),
    readJson(root, path.join(logsRoot, "exit-receipt.json"), "Projector exit receipt"),
    readJson(root, path.join(captureRoot, "capture-manifest.json"), "ScreenCaptureKit capture manifest"),
    readRegular(path.dirname(path.resolve(scriptPath)), path.resolve(scriptPath), "pending-candidate generator", {allowEmpty: false}),
  ]);
  invariant(isInside(root, path.resolve(scriptPath)), "pending-candidate generator must be inside the project root");

  const profile = profileDocument.value;
  invariant(profile.schemaVersion === 1 && profile.evidenceType === "g4-l3-ts006-empty-current-account-disposable-runtime-profile", "profile manifest type is invalid");
  invariant(profile.animationId === ANIMATION_ID && profile.sessionId === session.sessionId && profile.language === session.language, "profile manifest session identity differs from the selected session root");
  invariant(profile.status === "empty-profile-candidate-not-authorized-not-launched", "profile manifest initial-state record was rewritten after launch");
  validateFingerprint(profile, "manifestFingerprintSha256", "profile manifest");
  validateAcceptanceNeutral(profile.acceptance, "profile acceptance");
  const sessionKitArtifact = await resolveProjectDescriptor(root, profile.sourceBindings?.sessionKit, "profile-bound session kit");
  const sandboxArtifact = await readRegular(root, path.join(session.resolved, "runtime-profile/sandbox.sb"), "session sandbox", {allowEmpty: false});
  invariant(profile.sandbox?.sha256 === sandboxArtifact.sha256 && profile.sandbox?.bytes === sandboxArtifact.size, "profile sandbox descriptor is stale");

  const preflight = preflightDocument.value;
  invariant(preflight.schemaVersion === 1 && preflight.reportType === "g4-l3-ts006-pending-candidate-runtime-preflight", "session preflight type is invalid");
  invariant(preflight.sessionId === session.sessionId && preflight.language === session.language, "session preflight identity differs from the session root");
  const {sessionId: ignoredSessionId, language: ignoredLanguage, copiedToSessionAt: ignoredCopiedAt, ...preflightSourceReport} = preflight;
  void ignoredSessionId; void ignoredLanguage; void ignoredCopiedAt;
  validateFingerprint(preflightSourceReport, "reportFingerprintSha256", "session preflight source report");
  validateAcceptanceNeutral(preflight.acceptance, "session preflight acceptance");
  invariant(preflight.executionGate?.pendingCandidateRuntimeLaunchReady === true && preflight.executionGate?.promotableRuntimeLaunchReady === false, "session preflight is not pending-candidate launch-ready and promotion-closed");
  invariant(preflight.observed?.livePidNetworkAuditRequired === true && preflight.observed?.capacityPassed === true, "session preflight lacks live PID network audit or capacity readiness");
  const selectedProfile = preflight.selectedProfiles?.find((item) => item.language === session.language && item.sessionId === session.sessionId);
  invariant(selectedProfile && selectedProfile.manifest?.sha256 === profileDocument.sha256 && selectedProfile.sandbox?.sha256 === sandboxArtifact.sha256, "session preflight does not bind the exact selected profile and sandbox");
  const captureToolArtifact = await resolveProjectDescriptor(root, preflight.toolBindings?.captureTool, "preflight capture tool");
  const hostTreeArtifact = await resolveProjectDescriptor(root, preflight.sourceBindings?.hostTree, "preflight host-tree manifest");

  const launch = launchDocument.value;
  invariant(launch.schemaVersion === 1 && launch.evidenceType === "g4-l3-ts006-pending-candidate-projector-process-launch-receipt", "Projector launch receipt type is invalid");
  validateFingerprint(launch, "receiptFingerprintSha256", "Projector launch receipt");
  invariant(launch.animationId === ANIMATION_ID && launch.sessionId === session.sessionId && launch.language === session.language, "Projector launch receipt session identity is invalid");
  invariant(Number.isInteger(launch.pid) && launch.pid > 0 && launch.preflightSha256 === preflightDocument.sha256, "Projector launch receipt PID or preflight binding is invalid");
  invariant(launch.commandLineSwfArgumentUsed === false && launch.shellOpenedByLauncher === false && launch.guiFileOpenObserved === false, "Projector launch receipt improperly claims a shell open or uses a command-line SWF argument");
  invariant(launch.flashProjectorProcessStarted === true && launch.runtimeSessionExecuted === false && launch.captureAuthority === "pending-candidate-only" && launch.promotionEligible === false && launch.acceptanceEffect === "none", "Projector launch receipt crosses the pending-candidate authority boundary");
  invariant(launch.argv?.length === 1 && launch.argv[0] === launch.executable, "Projector launch argv is not the empty-player protocol");
  invariant(launch.sandboxPath === sandboxArtifact.path && launch.workingDirectory === path.join(root, "work/original-runtime-host-trees/course-g04-l03-ts-006/root"), "Projector launch sandbox or working directory is invalid");
  const projectorDescriptor = preflight.toolBindings?.projector;
  invariant(projectorDescriptor?.path === launch.executable && projectorDescriptor?.sha256 === EXPECTED_PROJECTOR_SHA256, "Projector executable binding differs from the approved runtime");
  const projectorArtifact = await resolveProjectDescriptor(root, projectorDescriptor, "approved Projector executable");
  const traceBindings = await bindTraceSpecifications(root, launch, session.language);

  const exit = exitDocument.value;
  invariant(exit.schemaVersion === 1 && exit.evidenceType === "g4-l3-ts006-pending-candidate-projector-exit-receipt", "Projector exit receipt type is invalid");
  validateFingerprint(exit, "receiptFingerprintSha256", "Projector exit receipt");
  invariant(exit.sessionId === session.sessionId && exit.language === session.language && exit.pid === launch.pid && exit.startedAt === launch.startedAt, "Projector exit receipt identity differs from the launch receipt");
  invariant(exit.completeExitObserved === true && exit.runtimeSessionExecuted === false && exit.authoritativeTraceClaimed === false && exit.promotionEligible === false && exit.acceptanceEffect === "none", "Projector exit receipt crosses the pending-candidate authority boundary");
  const launchStartedAtMs = parseTimestamp(launch.startedAt, "launch startedAt");
  const exitEndedAtMs = parseTimestamp(exit.endedAt, "exit endedAt");
  invariant(exitEndedAtMs >= launchStartedAtMs, "Projector exit precedes launch");

  const capture = captureDocument.value;
  invariant(capture.schemaVersion === 1 && capture.evidenceType === "g4-l3-lossless-window-frame-and-system-audio-capture" && capture.status === "raw-capture-not-yet-bound-to-runtime-trace", "ScreenCaptureKit manifest type/status is invalid");
  invariant(capture.runtimeAuthorityClaimed === false && capture.acceptanceEffect === "none", "ScreenCaptureKit manifest crosses the raw-capture authority boundary");
  invariant(capture.configuration?.fps === "12" && capture.configuration?.outputWidth === "800" && capture.configuration?.outputHeight === "600", "ScreenCaptureKit capture is not configured for 800x600 at 12 FPS");
  invariant(capture.configuration?.sourceKind === "waited-first-window-exact-pid", "ScreenCaptureKit capture did not use the exact-PID waited-window mode");
  invariant(Number(capture.configuration?.waitForPidSeconds) > 0 && Number(capture.configuration?.minimumWindowWidth) >= 800 && Number(capture.configuration?.minimumWindowHeight) >= 600, "ScreenCaptureKit exact-PID window wait/minimum geometry is invalid");
  invariant(capture.configuration?.sourceRect === "0.0,28.0,800.0,600.0" && capture.configuration?.pixelFormat === "BGRA" && capture.configuration?.cursor === "excluded" && capture.configuration?.audio === "system-audio-48kHz-2ch-ALAC", "ScreenCaptureKit stage crop, pixel format, cursor, or audio configuration is invalid");
  invariant(capture.configuration?.windowShadows === "display-window-framing-excluded", "ScreenCaptureKit capture did not exclude focus-dependent single-window shadow framing");
  invariant(
    [LEGACY_BOTTOM_CORNER_ALPHA_INVARIANT, LEGACY_FOUR_CORNER_ALPHA_INVARIANT, NATIVE_STAGE_EDGE_ALPHA_INVARIANT].includes(capture.configuration?.alphaMaskInvariant),
    "ScreenCaptureKit alpha-mask invariant is missing or invalid",
  );
  if (capture.configuration.alphaMaskInvariant === NATIVE_STAGE_EDGE_ALPHA_INVARIANT) {
    invariant(capture.configuration.alphaMaskBinding === "stable-opaque-versus-nonopaque-occupancy", "ScreenCaptureKit native stage-edge alpha occupancy binding is missing or invalid");
    invariant(capture.configuration.alphaValueJitterTolerance === "2", "ScreenCaptureKit native stage-edge alpha jitter tolerance is missing or invalid");
    invariant(/^[0-2]$/u.test(capture.configuration.maximumObservedAlphaValueDelta || ""), "ScreenCaptureKit maximum observed alpha-value delta is missing or exceeds tolerance");
  }
  invariant(capture.display?.includedProcessID === launch.pid && capture.display?.includedApplicationName === "Flash Player"
    && capture.display?.includedBundleIdentifier === "com.macromedia.Flash Player.app" && Number.isInteger(capture.display?.displayID),
  "ScreenCaptureKit display record does not bind the exact launched PID/application");
  const shellPath = path.join(root, "work/original-runtime-host-trees/course-g04-l03-ts-006/root", EXPECTED_SHELL_RELATIVE);
  const expectedWindowTitle = `file://${shellPath}`;
  invariant(capture.window?.ownerName === "Flash Player" && capture.window?.title === expectedWindowTitle && capture.window?.onScreen === true, "ScreenCaptureKit window does not bind the exact staged Lesson Shell");
  invariant(capture.window?.frameWidth === 800 && capture.window?.frameHeight === 628 && Number.isInteger(capture.window?.windowID), "ScreenCaptureKit window geometry or ID is invalid");
  const resolvedRect = parseRect(capture.configuration?.resolvedDisplaySourceRect, "ScreenCaptureKit resolved display source rect");
  invariant(Number.isFinite(capture.display?.frameX) && Number.isFinite(capture.display?.frameY)
    && Number.isFinite(capture.display?.frameWidth) && Number.isFinite(capture.display?.frameHeight),
  "ScreenCaptureKit display geometry is incomplete");
  invariant(resolvedRect.x === capture.window.frameX - capture.display.frameX
    && resolvedRect.y === capture.window.frameY - capture.display.frameY + 28
    && resolvedRect.width === 800 && resolvedRect.height === 600,
  "ScreenCaptureKit resolved display crop differs from the exact window stage geometry");
  invariant(resolvedRect.x >= 0 && resolvedRect.y >= 0
    && resolvedRect.x + resolvedRect.width <= capture.display.frameWidth
    && resolvedRect.y + resolvedRect.height <= capture.display.frameHeight,
  "ScreenCaptureKit resolved display crop escapes the bound display");
  invariant(capture.droppedOrIncompleteFrameCount === 0, "ScreenCaptureKit reported a dropped or incomplete frame");
  const captureStartedAtMs = parseTimestamp(capture.startedAt, "capture startedAt");
  const captureEndedAtMs = parseTimestamp(capture.endedAt, "capture endedAt");
  invariant(captureStartedAtMs >= launchStartedAtMs && captureEndedAtMs >= captureStartedAtMs && captureEndedAtMs <= exitEndedAtMs, "capture interval is outside the exact Projector process lifetime");
  const verifiedFrames = await verifyFrames(
    root,
    captureRoot,
    capture.frames,
    capture.frameAlphaMaskSha256,
    capture.configuration.alphaMaskInvariant,
    Number(capture.configuration.alphaValueJitterTolerance || 0),
  );
  if (capture.configuration.alphaMaskInvariant === NATIVE_STAGE_EDGE_ALPHA_INVARIANT) {
    invariant(
      verifiedFrames.maximumAlphaValueDelta === Number(capture.configuration.maximumObservedAlphaValueDelta),
      "ScreenCaptureKit maximum observed alpha-value delta differs from the verified frames",
    );
  }

  const audio = capture.audio;
  invariant(audio?.codec === "Apple Lossless Audio Codec" && audio.sampleRate === 48000 && audio.channels === 2 && audio.outputFile === "system-audio-lossless.m4a", "ScreenCaptureKit audio descriptor is not lossless ALAC 48 kHz stereo");
  invariant(Number.isInteger(audio.bufferCount) && audio.bufferCount > 0 && Number.isInteger(audio.inputPayloadBytes) && audio.inputPayloadBytes > 0, "ScreenCaptureKit audio contains no captured buffers/payload");
  invariant(Number.isInteger(audio.inputNonZeroBytes) && audio.inputNonZeroBytes >= 0 && audio.inputNonZeroBytes <= audio.inputPayloadBytes && audio.inputContainsNonZeroAudio === (audio.inputNonZeroBytes > 0), "ScreenCaptureKit audio payload diagnostics are inconsistent");
  invariant(Number.isInteger(audio.outputBytes) && audio.outputBytes > 0 && HASH_PATTERN.test(audio.outputSha256 || ""), "ScreenCaptureKit audio output descriptor is incomplete");
  invariant(Number.isFinite(audio.firstPresentationTimeSeconds) && Number.isFinite(audio.lastPresentationTimeSeconds) && audio.lastPresentationTimeSeconds >= audio.firstPresentationTimeSeconds, "ScreenCaptureKit audio timestamps are invalid");
  const audioArtifact = await readRegular(root, path.join(captureRoot, audio.outputFile), "lossless session audio", {allowEmpty: false});
  invariant(audioArtifact.size === audio.outputBytes && audioArtifact.sha256 === audio.outputSha256, "lossless session audio bytes or SHA-256 differ from the capture manifest");
  invariant(audioArtifact.bytes.length >= 12 && audioArtifact.bytes.subarray(4, 8).toString("ascii") === "ftyp", "lossless session audio is not an ISO BMFF/M4A container");

  const logNames = [
    "projector.stdout.log",
    "projector.stderr.log",
    "lsof-network-pre.txt",
    "nettop.csv",
    "nettop.stderr.log",
    "lsof-network-post.txt",
  ];
  const logArtifacts = new Map();
  for (const name of logNames) logArtifacts.set(name, await readRegular(root, path.join(logsRoot, name), `session log ${name}`));
  for (const name of ["projector.stdout.log", "lsof-network-pre.txt", "nettop.stderr.log", "lsof-network-post.txt"]) {
    invariant(logArtifacts.get(name).size === 0, `${name} contains output; pending-candidate finalization fails closed`);
  }
  const projectorStderrSummary = verifyProjectorStderr(logArtifacts.get("projector.stderr.log").bytes, launch.pid);
  const nettopSummary = verifyNettopNoRows(logArtifacts.get("nettop.csv").bytes);

  const hostTree = JSON.parse(hostTreeArtifact.bytes);
  invariant(hostTree.schemaVersion === 1 && hostTree.reportType === "g4-l3-ts006-read-only-original-runtime-host-tree", "host-tree manifest type is invalid");
  const {manifestFingerprintSha256: hostTreeFingerprint, ...hostTreeWithoutFingerprint} = hostTree;
  invariant(HASH_PATTERN.test(hostTreeFingerprint || "") && hostTreeFingerprint === sha256(Buffer.from(stablePrettyJson(hostTreeWithoutFingerprint))), "host-tree manifest fingerprint is stale");
  invariant(hostTree.stagedRoot?.path === "work/original-runtime-host-trees/course-g04-l03-ts-006/root" && hostTree.stagedRoot?.regularCopiedFilesOnly === true && hostTree.stagedRoot?.hardLinks === 0 && hostTree.stagedRoot?.symbolicLinks === 0, "host-tree manifest does not describe the fixed regular-file staged root");
  const shellEntry = hostTree.files?.find((item) => item.path === EXPECTED_SHELL_RELATIVE);
  const childEntry = hostTree.files?.find((item) => item.path === EXPECTED_CHILD_RELATIVE);
  invariant(shellEntry?.sha256 === EXPECTED_SHELL_SHA256 && childEntry?.sha256 === EXPECTED_CHILD_SHA256, "host-tree manifest shell or TS006 child hash is invalid");
  const shellArtifact = await readRegular(root, shellPath, "staged Lesson Shell", {allowEmpty: false});
  const childArtifact = await readRegular(root, path.join(root, "work/original-runtime-host-trees/course-g04-l03-ts-006/root", EXPECTED_CHILD_RELATIVE), "staged TS006 child", {allowEmpty: false});
  invariant(shellArtifact.sha256 === shellEntry.sha256 && shellArtifact.size === shellEntry.bytes, "staged Lesson Shell differs from the host-tree manifest");
  invariant(childArtifact.sha256 === childEntry.sha256 && childArtifact.size === childEntry.bytes, "staged TS006 child differs from the host-tree manifest");

  const runtimeProfileInventory = await inventoryDirectory(root, path.join(session.resolved, "runtime-profile"), "post-session runtime profile");
  const naturalTraceLogs = await bindOptionalTs006NaturalTraceLogs({
    projectRoot: root,
    sessionRoot: session.resolved,
    captureRoot,
    captureName,
    captureDocument,
  });
  const specsReady = traceBindings.requirements.every(({traceSpecStatus}) => traceSpecStatus === "source-schedule-ready-for-authoritative-execution");
  const cleanExit = exit.exitCode === 0 && exit.exitSignal === null;
  const blockers = [
    ...(!specsReady ? ["trace-specifications-unresolved-at-launch"] : []),
    ...(!naturalTraceLogs.machineIntegrityVerified ? ["no-hash-chained-operation-event-log"] : []),
    "no-per-requirement-timeline-frame-mapping",
    "no-natural-trace-execution-report",
    "no-named-human-session-attestation",
    "no-causal-audio-trigger-or-listening-acceptance",
    "no-independent-human-visual-review",
    "no-owner-acceptance",
    "no-external-signature-trust-root",
    ...(!cleanExit ? ["projector-exit-was-not-clean"] : []),
  ];

  const candidateWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-screen-capture-kit-pending-natural-trace-candidate",
    status: specsReady ? "pending-candidate-unmapped-unattested-unreviewed" : "pending-candidate-unresolved-trace-specifications",
    animationId: ANIMATION_ID,
    sessionId: session.sessionId,
    language: session.language,
    preparedAt: exit.endedAt,
    generator: descriptor(root, generatorArtifact),
    sourceBindings: {
      profileManifest: descriptor(root, profileDocument),
      sessionKit: descriptor(root, sessionKitArtifact),
      sandbox: descriptor(root, sandboxArtifact),
      preflight: descriptor(root, preflightDocument),
      launchReceipt: descriptor(root, launchDocument),
      exitReceipt: descriptor(root, exitDocument),
      traceSpecIndex: traceBindings.index,
      traceSpecifications: traceBindings.requirements,
      hostTreeManifest: descriptor(root, hostTreeArtifact),
      stagedLessonShell: descriptor(root, shellArtifact),
      stagedTs006Child: descriptor(root, childArtifact),
      projectorExecutable: {path: projectorArtifact.path, bytes: projectorArtifact.size, sha256: projectorArtifact.sha256},
      screenCaptureKitTool: descriptor(root, captureToolArtifact),
      naturalTraceLogBundle: naturalTraceLogs.present ? naturalTraceLogs : null,
    },
    process: {
      pid: launch.pid,
      startedAt: launch.startedAt,
      endedAt: exit.endedAt,
      exitCode: exit.exitCode,
      exitSignal: exit.exitSignal,
      cleanExit,
      emptyProjectorArgvVerified: true,
      exactPidScreenCaptureKitBindingVerified: true,
    },
    capture: {
      directory: portable(path.relative(root, captureRoot)),
      manifest: descriptor(root, captureDocument),
      window: capture.window,
      display: capture.display,
      configuration: capture.configuration,
      startedAt: capture.startedAt,
      endedAt: capture.endedAt,
      frames: {
        ...verifiedFrames,
        width: 800,
        height: 600,
        requestedFps: 12,
        droppedOrIncompleteFrameCount: 0,
      },
      audio: {
        file: descriptor(root, audioArtifact),
        codec: audio.codec,
        sampleRate: audio.sampleRate,
        channels: audio.channels,
        bufferCount: audio.bufferCount,
        inputPayloadBytes: audio.inputPayloadBytes,
        inputNonZeroBytes: audio.inputNonZeroBytes,
        inputContainsNonZeroAudio: audio.inputContainsNonZeroAudio,
        firstPresentationTimeSeconds: audio.firstPresentationTimeSeconds,
        lastPresentationTimeSeconds: audio.lastPresentationTimeSeconds,
        causalAttributionEstablished: false,
        spokenLanguageIdentityEstablished: false,
        listeningAcceptanceEstablished: false,
      },
    },
    networkAudit: {
      pid: launch.pid,
      lsofPre: descriptor(root, logArtifacts.get("lsof-network-pre.txt")),
      nettop: descriptor(root, logArtifacts.get("nettop.csv")),
      nettopStderr: descriptor(root, logArtifacts.get("nettop.stderr.log")),
      lsofPost: descriptor(root, logArtifacts.get("lsof-network-post.txt")),
      projectorStdout: descriptor(root, logArtifacts.get("projector.stdout.log")),
      projectorStderr: descriptor(root, logArtifacts.get("projector.stderr.log")),
      projectorStderrSummary,
      nettopSummary,
      observedSocketRows: 0,
      outboundNetworkSuccessEstablished: false,
    },
    postSessionRuntimeProfile: runtimeProfileInventory,
    machineVerification: {
      rawCaptureManifestAndEveryPngRehashed: true,
      allPngsNative800x600: true,
      captureRequestedAt12Fps: true,
      exactLaunchedPidBoundByScreenCaptureKit: true,
      exactStagedLessonShellWindowBound: true,
      losslessSessionAudioRehashed: true,
      pidScopedNetworkLogsRehashed: true,
      noNetworkRowsObservedInBoundLogs: true,
      traceSpecsRehashedAgainstLaunchAndGlobalIndex: true,
      hashChainedNaturalTraceLogBundleMachineIntegrityVerified: naturalTraceLogs.machineIntegrityVerified,
      naturalTraceLogBundleCreatesRuntimeAuthority: false,
      naturalTraceLogBundleCreatesReviewOrOwnerAuthority: false,
      coverageOrLedgerFilesWritten: false,
    },
    unresolvedGates: blockers,
    promotionEligible: false,
    acceptanceEffect: "none",
    authority: {
      classification: "raw-session-machine-integrity-only",
      naturalTraceExecutionEstablished: false,
      timelineFrameMappingEstablished: false,
      authoritativeOriginalRuntimeTrace: false,
      authoritativeBaseline: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  const candidate = {...candidateWithoutFingerprint, candidateFingerprintSha256: sha256(stableJson(candidateWithoutFingerprint))};
  validateCandidateBoundary(candidate);
  validateFingerprint(candidate, "candidateFingerprintSha256", "pending candidate");
  const outputRoot = path.join(evidenceRoot, "pending-candidates");
  const outputPath = path.join(outputRoot, `${captureName}.pending-candidate.json`);
  const expectedBytes = Buffer.from(pretty(candidate));
  if (write) {
    await ensureRealDirectory(root, outputRoot, "pending-candidates output root", {create: true});
    invariant(!(await statIfPresent(outputPath)), "pending candidate already exists; append-only output refuses replacement");
    await writeNewReadOnly(root, outputPath, expectedBytes);
  } else {
    const existing = await readRegular(root, outputPath, "existing pending candidate", {allowEmpty: false});
    invariant(existing.bytes.equals(expectedBytes), "existing pending candidate is stale, edited, or belongs to different raw inputs");
  }
  return {candidate, outputPath};
}

export function parseArguments(argv) {
  const options = {projectRoot: DEFAULT_PROJECT_ROOT, sessionRoot: null, captureName: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--project-root") options.projectRoot = argv[++index] || "";
    else if (argument === "--session-root") options.sessionRoot = argv[++index] || "";
    else if (argument === "--capture") options.captureName = argv[++index] || "";
    else if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.help) {
    invariant(options.sessionRoot, "--session-root is required");
    invariant(options.captureName, "--capture is required");
    invariant(CAPTURE_NAME_PATTERN.test(options.captureName) && options.captureName !== "." && options.captureName !== "..", "--capture must be a safe direct-child capture name");
  }
  return options;
}

function usage() {
  return `Usage: node scripts/prepare-g4-l3-ts006-runtime-capture-pending-candidate.mjs \\
  --session-root <artifacts/full-frame/g4-l3/ts006-(en|es)-UUID> \\
  --capture <direct-child-capture-name> [--check]\n\n` +
    "This fail-closed bridge accepts only a completed ScreenCaptureKit exact-PID " +
    "800x600/12 FPS capture with lossless audio and complete PID-scoped network logs. " +
    "When an exact four-file natural-trace recorder bundle exists for the selected " +
    "capture, it is reverified in complete mode and bound only as automation-origin " +
    "machine integrity; absent logs retain the explicit hash-chain blocker. " +
    "It writes one append-only pending-candidate JSON inside the ignored session. It " +
    "does not write trace execution reports, coverage, migration manifests, reviews, " +
    "completion/release ledgers, baseline authority, or acceptance.\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: options.projectRoot,
    sessionRoot: options.sessionRoot,
    captureName: options.captureName,
    write: !options.check,
  });
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${portable(path.relative(path.resolve(options.projectRoot), result.outputPath))}\n`);
  process.stdout.write("Strict acceptance effect: none\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
