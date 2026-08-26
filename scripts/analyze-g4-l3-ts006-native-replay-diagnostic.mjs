#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  realpath,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const SESSION_ID =
  "ts006-en-native-replay-diagnostic-20260726T213100+0800";
export const SESSION_RELATIVE =
  `artifacts/full-frame/g4-l3/${SESSION_ID}`;
export const CAPTURE_MANIFEST_RELATIVE =
  `${SESSION_RELATIVE}/capture-manifest.json`;
export const CAPTURE_AUDIO_RELATIVE =
  `${SESSION_RELATIVE}/system-audio-lossless.m4a`;
export const REPORT_JSON_RELATIVE =
  "reports/g4-l3-ts006-en-native-replay-diagnostic-integrity.json";
export const REPORT_MARKDOWN_RELATIVE =
  "reports/g4-l3-ts006-en-native-replay-diagnostic-integrity.md";

const HOST_SHELL_RELATIVE =
  "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf";
const HOST_SHELL_SHA256 =
  "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const EXPECTED_WINDOW_TITLE = `file://${path.join(PROJECT_ROOT, HOST_SHELL_RELATIVE)}`;
const EXPECTED_MANIFEST_EVIDENCE_TYPE =
  "g4-l3-lossless-window-frame-and-system-audio-capture";
const EXPECTED_FRAME_COUNT = 477;
const EXPECTED_WIDTH = 800;
const EXPECTED_HEIGHT = 600;
const NOMINAL_FPS = 12;
const NOMINAL_FPS_TOLERANCE_FRACTION = 0.02;
const CONTENT_CROP = Object.freeze({
  x: 0,
  y: 90,
  width: 800,
  height: 420,
  purpose:
    "Exclude the fixed shell header/footer and compare the lesson-content field only.",
});
const TERMINAL_LIKE_RMSE_THRESHOLD = 0.01;
const OPERATOR_MAPPING_HYPOTHESIS = Object.freeze({
  firstCaptureOrdinal: 163,
  firstProposedLocalFrame: 1,
  lastCaptureOrdinal: 290,
  lastProposedLocalFrame: 128,
  status:
    "operator-provided-candidate-mapping-not-proved-by-runtime-playhead-telemetry",
});
const HASH = /^[a-f0-9]{64}$/u;
const PNG_SIGNATURE = "89504e470d0a1a0a";

const AUTHORITY_FALSE = Object.freeze({
  naturalTraceExecutionEstablished: false,
  replayOperationCausalityEstablished: false,
  exactRuntimePidBindingEstablished: false,
  authoritativeOriginalRuntimeTrace: false,
  authoritativeBaseline: false,
  baselineAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicRelease: false,
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`TS006 native Replay diagnostic: ${message}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

function portable(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `path must be repository-relative: ${relativePath}`,
  );
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  const relative = path.relative(PROJECT_ROOT, resolved);
  invariant(
    relative &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes the project root: ${relativePath}`,
  );
  return resolved;
}

async function readRegular(filePath, label) {
  const metadata = await lstat(filePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${label} must be a regular non-symlink file`,
  );
  const bytes = await readFile(filePath);
  return {
    bytes,
    size: bytes.length,
    sha256: sha256(bytes),
  };
}

function percentile(sortedValues, probability) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * probability) - 1),
  );
  return sortedValues[index];
}

export function summarizeFrameTiming(frames) {
  invariant(
    Array.isArray(frames) && frames.length >= 2,
    "at least two frame descriptors are required",
  );
  invariant(
    frames[0].relativeTimeSeconds === 0,
    "first frame relative time must be zero",
  );
  const intervals = [];
  for (let index = 1; index < frames.length; index += 1) {
    const relativeDelta =
      frames[index].relativeTimeSeconds -
      frames[index - 1].relativeTimeSeconds;
    const presentationDelta =
      frames[index].presentationTimeSeconds -
      frames[index - 1].presentationTimeSeconds;
    invariant(
      Number.isFinite(relativeDelta) &&
        relativeDelta > 0 &&
        Number.isFinite(presentationDelta) &&
        presentationDelta > 0,
      `frame ${index + 1} timing is not strictly monotonic`,
    );
    invariant(
      Math.abs(relativeDelta - presentationDelta) < 1e-6,
      `frame ${index + 1} relative/presentation interval disagreement`,
    );
    intervals.push(relativeDelta);
  }
  const sorted = [...intervals].sort((left, right) => left - right);
  const durationSeconds =
    frames.at(-1).relativeTimeSeconds - frames[0].relativeTimeSeconds;
  const effectiveFps = (frames.length - 1) / durationSeconds;
  const nominalFpsErrorFraction =
    Math.abs(effectiveFps - NOMINAL_FPS) / NOMINAL_FPS;
  return {
    durationSeconds,
    effectiveFps,
    nominalFps: NOMINAL_FPS,
    nominalFpsToleranceFraction: NOMINAL_FPS_TOLERANCE_FRACTION,
    nominalCadenceWithinTolerance:
      nominalFpsErrorFraction <= NOMINAL_FPS_TOLERANCE_FRACTION,
    nominalFpsErrorFraction,
    intervalSeconds: {
      minimum: sorted[0],
      median: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      maximum: sorted.at(-1),
    },
  };
}

export function inspectPng(bytes, label = "PNG") {
  invariant(bytes.length >= 24, `${label} is too small`);
  invariant(
    bytes.subarray(0, 8).toString("hex") === PNG_SIGNATURE,
    `${label} signature is invalid`,
  );
  invariant(
    bytes.subarray(12, 16).toString("ascii") === "IHDR",
    `${label} does not begin with IHDR`,
  );
  const header = {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
  let decoded;
  try {
    decoded = PNG.sync.read(bytes, {
      checkCRC: true,
    });
  } catch (error) {
    throw new Error(
      `TS006 native Replay diagnostic: ${label} PNG decode failed: ${error.message}`,
    );
  }
  invariant(
    decoded.width === header.width && decoded.height === header.height,
    `${label} decoded dimensions disagree with IHDR`,
  );
  return {
    ...header,
    data: decoded.data,
  };
}

export function extractRgbCrop(image, crop = CONTENT_CROP) {
  invariant(
    image?.width === EXPECTED_WIDTH &&
      image?.height === EXPECTED_HEIGHT &&
      Buffer.isBuffer(image.data),
    "crop source must be a decoded 800x600 RGBA PNG",
  );
  invariant(
    Number.isInteger(crop.x) &&
      Number.isInteger(crop.y) &&
      Number.isInteger(crop.width) &&
      Number.isInteger(crop.height) &&
      crop.x >= 0 &&
      crop.y >= 0 &&
      crop.x + crop.width <= image.width &&
      crop.y + crop.height <= image.height,
    "content crop is out of bounds",
  );
  const output = Buffer.allocUnsafe(crop.width * crop.height * 3);
  let outputOffset = 0;
  for (let y = crop.y; y < crop.y + crop.height; y += 1) {
    for (let x = crop.x; x < crop.x + crop.width; x += 1) {
      const inputOffset = (y * image.width + x) * 4;
      output[outputOffset] = image.data[inputOffset];
      output[outputOffset + 1] = image.data[inputOffset + 1];
      output[outputOffset + 2] = image.data[inputOffset + 2];
      outputOffset += 3;
    }
  }
  return output;
}

export function normalizedRgbRmse(left, right) {
  invariant(
    Buffer.isBuffer(left) &&
      Buffer.isBuffer(right) &&
      left.length === right.length &&
      left.length > 0,
    "RMSE inputs must be equal nonempty RGB buffers",
  );
  let squaredError = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    squaredError += difference * difference;
  }
  return Math.sqrt(squaredError / left.length) / 255;
}

export function validateCaptureBoundary(manifest) {
  invariant(
    manifest?.schemaVersion === 1 &&
      manifest.evidenceType === EXPECTED_MANIFEST_EVIDENCE_TYPE &&
      manifest.status === "raw-capture-not-yet-bound-to-runtime-trace" &&
      manifest.runtimeAuthorityClaimed === false &&
      manifest.acceptanceEffect === "none",
    "capture authority boundary was weakened or promoted",
  );
  invariant(
    manifest.configuration?.fps === "12" &&
      manifest.configuration?.outputWidth === "800" &&
      manifest.configuration?.outputHeight === "600" &&
      manifest.configuration?.sourceRect === "0.0,28.0,800.0,600.0" &&
      manifest.configuration?.pixelFormat === "BGRA" &&
      manifest.configuration?.cursor === "excluded",
    "native frame/crop/cadence configuration drifted",
  );
  invariant(
    manifest.configuration?.audio === "system-audio-48kHz-2ch-ALAC",
    "lossless system-audio request drifted",
  );
  invariant(
    manifest.window?.ownerName === "Flash Player" &&
      manifest.window?.title === EXPECTED_WINDOW_TITLE &&
      manifest.window?.onScreen === true &&
      manifest.window?.frameWidth === 800 &&
      manifest.window?.frameHeight === 628 &&
      Number.isInteger(manifest.window?.windowID),
    "Flash Player window/title/geometry evidence drifted",
  );
  invariant(
    manifest.droppedOrIncompleteFrameCount === 0 &&
      Array.isArray(manifest.frames) &&
      manifest.frames.length === EXPECTED_FRAME_COUNT,
    `capture must contain ${EXPECTED_FRAME_COUNT} frames with zero reported drops`,
  );
  invariant(
    manifest.audio?.codec === "Apple Lossless Audio Codec" &&
      manifest.audio?.sampleRate === 48000 &&
      manifest.audio?.channels === 2 &&
      manifest.audio?.outputFile === "system-audio-lossless.m4a" &&
      HASH.test(manifest.audio?.outputSha256 ?? "") &&
      manifest.audio?.inputContainsNonZeroAudio === true &&
      Number.isInteger(manifest.audio?.inputPayloadBytes) &&
      Number.isInteger(manifest.audio?.inputNonZeroBytes),
    "capture ALAC descriptor drifted",
  );
  return true;
}

export function classifyPidEvidence(manifest) {
  const includedProcessId = manifest.display?.includedProcessID ?? null;
  const exactPidMode =
    manifest.configuration?.sourceKind === "waited-first-window-exact-pid";
  const waitedForPid =
    Number(manifest.configuration?.waitForPidSeconds) > 0;
  const positivePid =
    Number.isInteger(includedProcessId) && includedProcessId > 0;
  const exactPidBindingEstablished =
    exactPidMode && waitedForPid && positivePid;
  return {
    sourceKind: manifest.configuration?.sourceKind ?? null,
    waitForPidSeconds:
      Number(manifest.configuration?.waitForPidSeconds ?? 0),
    displayEvidencePresent: Boolean(manifest.display),
    includedApplicationName:
      manifest.display?.includedApplicationName ?? null,
    includedProcessID: includedProcessId,
    windowID: manifest.window?.windowID ?? null,
    exactPidBindingEstablished,
    reason: exactPidBindingEstablished
      ? "The manifest records exact-PID source mode, a positive wait, and a positive included process ID."
      : "The manifest records a generic window source, zero PID wait, and no included process ID. windowID is a ScreenCaptureKit window identifier, not a Unix PID.",
  };
}

function contiguousPrefixEnd(metrics, predicate) {
  let end = 0;
  for (const metric of metrics) {
    if (!predicate(metric)) break;
    end = metric.ordinal;
  }
  return end;
}

function equalSignatureRun(metrics, candidateOrdinal) {
  const candidate = metrics[candidateOrdinal - 1];
  invariant(
    candidate?.ordinal === candidateOrdinal,
    `candidate ordinal ${candidateOrdinal} is absent`,
  );
  let first = candidateOrdinal;
  let last = candidateOrdinal;
  while (
    first > 1 &&
    metrics[first - 2].contentCropSha256 === candidate.contentCropSha256
  ) {
    first -= 1;
  }
  while (
    last < metrics.length &&
    metrics[last].contentCropSha256 === candidate.contentCropSha256
  ) {
    last += 1;
  }
  return {
    firstOrdinal: first,
    lastOrdinal: last,
    frameCount: last - first + 1,
    contentCropSha256: candidate.contentCropSha256,
  };
}

function suffixStart(metrics, firstAllowedOrdinal, predicate) {
  let candidate = null;
  for (
    let ordinal = firstAllowedOrdinal;
    ordinal <= metrics.length;
    ordinal += 1
  ) {
    if (predicate(metrics[ordinal - 1])) {
      if (candidate === null) candidate = ordinal;
    } else {
      candidate = null;
    }
  }
  return candidate;
}

function summaryStats(values) {
  invariant(values.length > 0, "summary requires values");
  return {
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    mean:
      values.reduce((sum, value) => sum + value, 0) / values.length,
  };
}

export function deriveReplayVisualSequence(
  metrics,
  {
    mapping = OPERATOR_MAPPING_HYPOTHESIS,
    terminalThreshold = TERMINAL_LIKE_RMSE_THRESHOLD,
  } = {},
) {
  invariant(
    Array.isArray(metrics) &&
      metrics.length === EXPECTED_FRAME_COUNT &&
      metrics.every((metric, index) => metric.ordinal === index + 1),
    `visual metrics must contain all ${EXPECTED_FRAME_COUNT} ordinals`,
  );
  invariant(
    mapping.firstCaptureOrdinal === 163 &&
      mapping.lastCaptureOrdinal === 290 &&
      mapping.lastCaptureOrdinal -
        mapping.firstCaptureOrdinal +
        1 ===
        128,
    "operator mapping hypothesis must remain the exact 163..290/1..128 candidate",
  );

  const preTerminalPrefixEnd = contiguousPrefixEnd(
    metrics,
    (metric) => metric.rmseToInitialContent <= terminalThreshold,
  );
  const resetPlateau = equalSignatureRun(
    metrics,
    mapping.firstCaptureOrdinal,
  );
  const secondTerminalLikeStart = suffixStart(
    metrics,
    mapping.lastCaptureOrdinal + 1,
    (metric) => metric.rmseToInitialContent <= terminalThreshold,
  );
  invariant(
    secondTerminalLikeStart !== null,
    "no terminal-like suffix recurs after the reset/mapped interval",
  );
  const secondTerminalMetrics = metrics.slice(
    secondTerminalLikeStart - 1,
  );
  const resetCandidate = metrics[mapping.firstCaptureOrdinal - 1];
  const mappingLast = metrics[mapping.lastCaptureOrdinal - 1];
  const diagnosticSequenceObserved =
    preTerminalPrefixEnd >= 120 &&
    preTerminalPrefixEnd < resetPlateau.firstOrdinal &&
    resetPlateau.firstOrdinal <= mapping.firstCaptureOrdinal &&
    resetPlateau.lastOrdinal >= mapping.firstCaptureOrdinal &&
    resetCandidate.rmseToInitialContent >= 0.15 &&
    mappingLast.contentCropSha256 !==
      resetCandidate.contentCropSha256 &&
    secondTerminalLikeStart > mapping.lastCaptureOrdinal &&
    secondTerminalMetrics.length >= 60;
  invariant(
    diagnosticSequenceObserved,
    "pixel sequence does not satisfy the fail-closed terminal-like -> reset-like -> terminal-like diagnostic pattern",
  );
  return {
    algorithm:
      "content-crop-rgb-sha256-and-normalized-rmse-sequence-v1",
    contentCrop: CONTENT_CROP,
    terminalLikeRmseThreshold: terminalThreshold,
    preTerminalLikePrefix: {
      firstOrdinal: 1,
      lastOrdinal: preTerminalPrefixEnd,
      frameCount: preTerminalPrefixEnd,
      maximumRmseToInitialContent: Math.max(
        ...metrics
          .slice(0, preTerminalPrefixEnd)
          .map((metric) => metric.rmseToInitialContent),
      ),
      interpretation:
        "The recording begins in a stable terminal-like visual state; it does not capture arrival at that state.",
    },
    resetTransitionWindow: {
      firstOrdinal: preTerminalPrefixEnd + 1,
      lastOrdinal: resetPlateau.lastOrdinal,
      frameCount:
        resetPlateau.lastOrdinal - preTerminalPrefixEnd,
    },
    resetLikePlateau: {
      ...resetPlateau,
      candidateOrdinal: mapping.firstCaptureOrdinal,
      candidateRmseToInitialContent:
        resetCandidate.rmseToInitialContent,
      interpretation:
        "The lesson-content pixels are identical across this plateau and materially different from the capture-start terminal-like state.",
    },
    proposedLocalFrameMapping: {
      ...mapping,
      captureFrameCount:
        mapping.lastCaptureOrdinal -
        mapping.firstCaptureOrdinal +
        1,
      firstOrdinalInsideResetPlateau:
        mapping.firstCaptureOrdinal >=
          resetPlateau.firstOrdinal &&
        mapping.firstCaptureOrdinal <=
          resetPlateau.lastOrdinal,
      exactLocalFrameTelemetryPresent: false,
      pixelSequenceAloneProvesExactLocalFrameNumbers: false,
      limitation:
        "The content crop is pixel-identical at ordinals 162..164, so pixels alone cannot distinguish which of those samples is local frame 1. The 163..290 mapping remains a candidate until separately bound to source/keyframe or runtime-playhead evidence.",
    },
    secondTerminalLikeSuffix: {
      firstOrdinal: secondTerminalLikeStart,
      lastOrdinal: metrics.length,
      frameCount:
        metrics.length - secondTerminalLikeStart + 1,
      rmseToInitialContent: summaryStats(
        secondTerminalMetrics.map(
          (metric) => metric.rmseToInitialContent,
        ),
      ),
      interpretation:
        "A stable terminal-like visual state recurs after the reset/mapped interval and persists through capture end.",
    },
    diagnosticVisualSequenceEstablished: true,
    replayOperationCausalityEstablished: false,
    semanticTerminalStateEstablished: false,
    authoritativeNaturalTraceEstablished: false,
  };
}

async function verifyRootShape(sessionRoot) {
  const entries = await readdir(sessionRoot, {
    withFileTypes: true,
  });
  const shape = entries
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory()
        ? "directory"
        : entry.isFile()
          ? "file"
          : entry.isSymbolicLink()
            ? "symlink"
            : "other",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  invariant(
    canonicalJson(shape) ===
      canonicalJson([
        {name: "capture-manifest.json", type: "file"},
        {name: "frames", type: "directory"},
        {name: "system-audio-lossless.m4a", type: "file"},
      ]),
    "capture root contains unexpected, missing, or non-regular entries",
  );
  return shape;
}

async function loadCrop(framePath, label) {
  const artifact = await readRegular(framePath, label);
  const image = inspectPng(artifact.bytes, label);
  invariant(
    image.width === EXPECTED_WIDTH &&
      image.height === EXPECTED_HEIGHT,
    `${label} is not native 800x600`,
  );
  return {
    artifact,
    crop: extractRgbCrop(image),
  };
}

async function verifyFrames(sessionRoot, manifest) {
  const frameRoot = path.join(sessionRoot, "frames");
  const frameRootMetadata = await lstat(frameRoot);
  invariant(
    frameRootMetadata.isDirectory() &&
      !frameRootMetadata.isSymbolicLink(),
    "frames must be a real directory",
  );
  const actualNames = (await readdir(frameRoot)).sort();
  invariant(
    actualNames.length === EXPECTED_FRAME_COUNT,
    `frame directory contains ${actualNames.length} instead of ${EXPECTED_FRAME_COUNT}`,
  );

  const initial = await loadCrop(
    path.join(frameRoot, "frame-000001.png"),
    "initial frame",
  );
  const reset = await loadCrop(
    path.join(
      frameRoot,
      `frame-${String(
        OPERATOR_MAPPING_HYPOTHESIS.firstCaptureOrdinal,
      ).padStart(6, "0")}.png`,
    ),
    "reset-candidate frame",
  );
  const metrics = [];
  let totalPngBytes = 0;
  const orderedRows = [];
  const pixelRows = [];

  for (let index = 0; index < manifest.frames.length; index += 1) {
    const ordinal = index + 1;
    const descriptor = manifest.frames[index];
    const expectedFile =
      `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
    invariant(
      descriptor.ordinal === ordinal &&
        descriptor.file === expectedFile &&
        descriptor.status === "complete",
      `frame ${ordinal} descriptor sequence/status drifted`,
    );
    invariant(
      descriptor.width === EXPECTED_WIDTH &&
        descriptor.height === EXPECTED_HEIGHT &&
        HASH.test(descriptor.sha256),
      `frame ${ordinal} descriptor dimensions/hash drifted`,
    );
    invariant(
      actualNames[index] === path.basename(expectedFile),
      `frame ${ordinal} filesystem sequence drifted`,
    );
    const framePath = path.join(sessionRoot, expectedFile);
    const metadata = await lstat(framePath);
    invariant(
      metadata.isFile() && !metadata.isSymbolicLink(),
      `frame ${ordinal} is not a regular non-symlink file`,
    );
    const bytes = await readFile(framePath);
    invariant(
      bytes.length === descriptor.bytes &&
        sha256(bytes) === descriptor.sha256,
      `frame ${ordinal} bytes/SHA-256 drifted`,
    );
    const image = inspectPng(bytes, `frame ${ordinal}`);
    invariant(
      image.width === EXPECTED_WIDTH &&
        image.height === EXPECTED_HEIGHT,
      `frame ${ordinal} PNG dimensions drifted`,
    );
    const crop = extractRgbCrop(image);
    const contentCropSha256 = sha256(crop);
    metrics.push({
      ordinal,
      relativeTimeSeconds: descriptor.relativeTimeSeconds,
      presentationTimeSeconds:
        descriptor.presentationTimeSeconds,
      frameSha256: descriptor.sha256,
      contentCropSha256,
      rmseToInitialContent: normalizedRgbRmse(
        crop,
        initial.crop,
      ),
      rmseToResetCandidateContent: normalizedRgbRmse(
        crop,
        reset.crop,
      ),
    });
    totalPngBytes += bytes.length;
    orderedRows.push(
      `${ordinal}\u0000${expectedFile}\u0000${descriptor.sha256}\n`,
    );
    pixelRows.push(
      `${ordinal}\u0000${contentCropSha256}\n`,
    );
  }
  return {
    metrics,
    totalPngBytes,
    orderedFrameSetSha256: sha256(
      Buffer.from(orderedRows.join("")),
    ),
    contentCropSequenceSha256: sha256(
      Buffer.from(pixelRows.join("")),
    ),
  };
}

async function toolVersion(command) {
  const {stdout} = await execFile(command, ["-version"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  return stdout.split(/\r?\n/u)[0];
}

async function probeAndDecodeAudio(audioPath, manifestAudio) {
  const [
    audioArtifact,
    probeResult,
    ffprobeVersion,
    ffmpegVersion,
  ] = await Promise.all([
    readRegular(audioPath, "lossless system audio"),
    execFile(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "stream=index,codec_name,codec_long_name,codec_type,sample_rate,channels,channel_layout,duration,bits_per_raw_sample:format=format_name,duration,size",
        "-of",
        "json",
        audioPath,
      ],
      {
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
      },
    ),
    toolVersion("ffprobe"),
    toolVersion("ffmpeg"),
  ]);
  invariant(
    audioArtifact.size === manifestAudio.outputBytes &&
      audioArtifact.sha256 === manifestAudio.outputSha256,
    "ALAC file bytes/SHA-256 drifted",
  );
  const probe = JSON.parse(probeResult.stdout);
  const streams = (probe.streams ?? []).filter(
    (stream) => stream.codec_type === "audio",
  );
  invariant(
    streams.length === 1,
    `expected one audio stream, observed ${streams.length}`,
  );
  const stream = streams[0];
  invariant(
    stream.codec_name === "alac" &&
      Number(stream.sample_rate) === 48000 &&
      stream.channels === 2 &&
      Number(probe.format?.size) === audioArtifact.size,
    "ffprobe did not confirm ALAC/48kHz/stereo/exact bytes",
  );
  const decoded = await execFile(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      audioPath,
      "-map",
      "0:a:0",
      "-f",
      "s32le",
      "-acodec",
      "pcm_s32le",
      "pipe:1",
    ],
    {
      encoding: null,
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  invariant(
    Buffer.isBuffer(decoded.stdout),
    "ffmpeg PCM decode did not return bytes",
  );
  let nonZeroByteCount = 0;
  for (const byte of decoded.stdout) {
    if (byte !== 0) nonZeroByteCount += 1;
  }
  invariant(
    decoded.stdout.length === manifestAudio.inputPayloadBytes &&
      nonZeroByteCount > 0,
    "decoded PCM payload length drifted or the decoded stream is silent",
  );
  return {
    file: portable(audioPath),
    bytes: audioArtifact.size,
    sha256: audioArtifact.sha256,
    containerFormat: probe.format?.format_name,
    durationSeconds: Number(
      stream.duration ?? probe.format?.duration,
    ),
    stream: {
      index: stream.index,
      codecName: stream.codec_name,
      codecLongName: stream.codec_long_name,
      sampleRate: Number(stream.sample_rate),
      channels: stream.channels,
      channelLayout: stream.channel_layout,
      bitsPerRawSample: Number(
        stream.bits_per_raw_sample ?? 0,
      ),
    },
    decodedPcm: {
      format: "signed-32-bit-little-endian-stereo",
      bytes: decoded.stdout.length,
      sha256: sha256(decoded.stdout),
      nonZeroByteCount,
      captureManifestPayloadBytesMatch: true,
      captureManifestInputNonZeroByteCount:
        manifestAudio.inputNonZeroBytes,
      captureManifestNonZeroByteCountComparable: false,
      captureManifestNonZeroByteCountComparisonReason:
        "The capture counter was computed over the ScreenCaptureKit input representation; this analyzer counts nonzero bytes after ALAC decode to signed 32-bit little-endian PCM.",
    },
    tools: {
      ffprobe: ffprobeVersion,
      ffmpeg: ffmpegVersion,
    },
  };
}

function reportFingerprint(report) {
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(projected)));
}

function keyMetric(metrics, ordinal) {
  const metric = metrics[ordinal - 1];
  return {
    ordinal: metric.ordinal,
    relativeTimeSeconds: metric.relativeTimeSeconds,
    presentationTimeSeconds:
      metric.presentationTimeSeconds,
    frameSha256: metric.frameSha256,
    contentCropSha256: metric.contentCropSha256,
    rmseToInitialContent: metric.rmseToInitialContent,
    rmseToResetCandidateContent:
      metric.rmseToResetCandidateContent,
  };
}

export async function buildDiagnosticReport() {
  const [
    projectRootReal,
    sessionRootReal,
    manifestArtifact,
    analyzerArtifact,
    hostShellArtifact,
  ] = await Promise.all([
    realpath(PROJECT_ROOT),
    realpath(projectPath(SESSION_RELATIVE)),
    readRegular(
      projectPath(CAPTURE_MANIFEST_RELATIVE),
      "capture manifest",
    ),
    readRegular(SCRIPT_PATH, "diagnostic analyzer"),
    readRegular(
      projectPath(HOST_SHELL_RELATIVE),
      "staged Lesson Shell",
    ),
  ]);
  invariant(
    sessionRootReal.startsWith(
      `${projectRootReal}${path.sep}artifacts${path.sep}full-frame${path.sep}g4-l3${path.sep}`,
    ),
    "capture session realpath escapes the G4 L3 artifact root",
  );
  invariant(
    hostShellArtifact.sha256 === HOST_SHELL_SHA256,
    "staged Lesson Shell SHA-256 drifted",
  );
  await verifyRootShape(sessionRootReal);
  let manifest;
  try {
    manifest = JSON.parse(
      manifestArtifact.bytes.toString("utf8"),
    );
  } catch (error) {
    throw new Error(
      `TS006 native Replay diagnostic: capture manifest JSON failed: ${error.message}`,
    );
  }
  validateCaptureBoundary(manifest);
  const timing = summarizeFrameTiming(manifest.frames);
  invariant(
    timing.nominalCadenceWithinTolerance,
    "observed effective cadence is outside the explicit 2% diagnostic tolerance around 12 FPS",
  );

  const frameVerification = await verifyFrames(
    sessionRootReal,
    manifest,
  );
  const replayVisualSequence = deriveReplayVisualSequence(
    frameVerification.metrics,
  );
  const audio = await probeAndDecodeAudio(
    path.join(sessionRootReal, manifest.audio.outputFile),
    manifest.audio,
  );
  const pidEvidence = classifyPidEvidence(manifest);
  invariant(
    pidEvidence.exactPidBindingEstablished === false,
    "this analyzer is scoped to the known generic-window diagnostic; an exact-PID manifest requires a separate evidence path",
  );
  const proposedFirst =
    OPERATOR_MAPPING_HYPOTHESIS.firstCaptureOrdinal;
  const proposedLast =
    OPERATOR_MAPPING_HYPOTHESIS.lastCaptureOrdinal;
  const proposedDuration =
    manifest.frames[proposedLast - 1].relativeTimeSeconds -
    manifest.frames[proposedFirst - 1].relativeTimeSeconds;

  const report = {
    schemaVersion: 1,
    evidenceType:
      "g4-l3-ts006-en-native-replay-acceptance-neutral-diagnostic-integrity",
    status:
      "verified-diagnostic-visual-sequence-not-authoritative-not-promotion-eligible",
    animationId: "course-g04-l03-ts-006",
    sessionId: SESSION_ID,
    language: "en",
    scope:
      "Byte, geometry, cadence, window/title, PID-evidence classification, ALAC/decoded-PCM, and acceptance-neutral visual Replay-sequence diagnostics.",
    sourceBindings: {
      captureManifest: {
        path: CAPTURE_MANIFEST_RELATIVE,
        bytes: manifestArtifact.size,
        sha256: manifestArtifact.sha256,
      },
      stagedLessonShell: {
        path: HOST_SHELL_RELATIVE,
        bytes: hostShellArtifact.size,
        sha256: hostShellArtifact.sha256,
        exactWindowTitle: EXPECTED_WINDOW_TITLE,
      },
      analyzer: {
        path: portable(SCRIPT_PATH),
        bytes: analyzerArtifact.size,
        sha256: analyzerArtifact.sha256,
      },
    },
    capture: {
      evidenceType: manifest.evidenceType,
      status: manifest.status,
      startedAt: manifest.startedAt,
      endedAt: manifest.endedAt,
      configuration: manifest.configuration,
      window: {
        ...manifest.window,
        exactOwnerAndTitleMatch: true,
        titleBoundStagedShellSha256:
          hostShellArtifact.sha256,
      },
      pidEvidence,
      frames: {
        count: manifest.frames.length,
        width: EXPECTED_WIDTH,
        height: EXPECTED_HEIGHT,
        completeFrameCount: manifest.frames.filter(
          (frame) => frame.status === "complete",
        ).length,
        droppedOrIncompleteFrameCount:
          manifest.droppedOrIncompleteFrameCount,
        totalPngBytes:
          frameVerification.totalPngBytes,
        orderedFrameSetAlgorithm:
          "ordinal-null-relative-file-null-sha256-newline-v1",
        orderedFrameSetSha256:
          frameVerification.orderedFrameSetSha256,
        contentCropSequenceAlgorithm:
          "ordinal-null-content-crop-rgb-sha256-newline-v1",
        contentCropSequenceSha256:
          frameVerification.contentCropSequenceSha256,
        timing,
      },
      audio: {
        ...audio,
        firstPresentationOffsetFromFirstVideoFrameSeconds:
          manifest.audio.firstPresentationTimeSeconds -
          manifest.frames[0].presentationTimeSeconds,
        lastPresentationOffsetFromLastVideoFrameSeconds:
          manifest.audio.lastPresentationTimeSeconds -
          manifest.frames.at(-1).presentationTimeSeconds,
        inputContainsNonZeroAudio:
          manifest.audio.inputContainsNonZeroAudio,
        bufferCount: manifest.audio.bufferCount,
        limitation:
          "ALAC identity and nonzero decoded PCM are established. Spoken content, cue causality, language correctness, synchronization acceptance, and human listening acceptance are not established.",
      },
    },
    replayDiagnostic: {
      ...replayVisualSequence,
      keyFrames: {
        captureStartTerminalLike:
          keyMetric(frameVerification.metrics, 1),
        preResetTerminalLike:
          keyMetric(
            frameVerification.metrics,
            replayVisualSequence.preTerminalLikePrefix
              .lastOrdinal,
          ),
        resetCandidate:
          keyMetric(
            frameVerification.metrics,
            proposedFirst,
          ),
        proposedLocalFrame128:
          keyMetric(
            frameVerification.metrics,
            proposedLast,
          ),
        secondTerminalLikeStart:
          keyMetric(
            frameVerification.metrics,
            replayVisualSequence.secondTerminalLikeSuffix
              .firstOrdinal,
          ),
        captureEndTerminalLike:
          keyMetric(
            frameVerification.metrics,
            EXPECTED_FRAME_COUNT,
          ),
      },
      proposedMappingTiming: {
        firstCaptureOrdinal: proposedFirst,
        lastCaptureOrdinal: proposedLast,
        frameCount: proposedLast - proposedFirst + 1,
        elapsedSecondsBetweenFirstAndLastSamples:
          proposedDuration,
        effectiveFpsAcross127Intervals:
          (proposedLast - proposedFirst) /
          proposedDuration,
      },
      diagnosticConclusion:
        "Pixels establish a stable terminal-like capture prefix, a materially different reset-like plateau containing ordinal 163, and a stable terminal-like suffix after the 163..290 candidate interval. This is a visual Replay diagnostic pattern, not proof of the Replay input event, exact local playhead values, natural-trace causality, or semantic terminal authority.",
    },
    verifiedFacts: {
      manifestBytesBound: true,
      stagedLessonShellBytesBound: true,
      exactFlashPlayerOwnerAndWindowTitleBound: true,
      screenCaptureWindowIdPresent: true,
      exactRuntimePidEvidencePresent: false,
      native800x600PngFramesVerified:
        EXPECTED_FRAME_COUNT,
      requestedNominalFps: NOMINAL_FPS,
      observedCadenceWithinTwoPercentOfNominal: true,
      captureToolReportedZeroDrops: true,
      all477FrameDescriptorsBytesHashesAndPngsVerified:
        true,
      alac48kHzStereoVerified: true,
      decodedPcmBytesHashAndNonzeroSignalVerified: true,
      terminalLikeResetLikeTerminalLikePixelSequenceVerified:
        true,
    },
    unresolvedGates: [
      "no-exact-runtime-pid-binding-in-capture-manifest",
      "no-hash-chained-operation-event-log",
      "no-hash-chained-source-target-resolution-log",
      "no-hash-chained-pre-post-state-log",
      "no-authorized-natural-trace-execution-report",
      "no-runtime-playhead-telemetry-for-ordinal-to-local-frame-mapping",
      "no-complete-natural-entry-proof",
      "no-contained-disposable-profile-session-binding",
      "no-audio-cue-causality-or-human-listening-acceptance",
      "no-independent-human-visual-review",
      "no-owner-acceptance",
    ],
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    acceptanceEffect: "none",
    strictAcceptanceEffect: "none",
    coverageMutationPerformed: false,
    candidateMutationPerformed: false,
    completionLedgerMutationPerformed: false,
    releaseLedgerMutationPerformed: false,
    reportFingerprintSha256: null,
  };
  report.reportFingerprintSha256 =
    reportFingerprint(report);
  return report;
}

function renderMarkdown(report, reportJsonArtifact) {
  const timing = report.capture.frames.timing;
  const replay = report.replayDiagnostic;
  const pid = report.capture.pidEvidence;
  return `# TS006 EN native Replay diagnostic integrity

Status: **verified acceptance-neutral visual diagnostic; not authoritative and not promotion eligible**.

This report verifies the exact raw bytes and derives a deterministic pixel-sequence finding. It does not establish an authorized natural trace, Replay input causality, exact local playhead values, audio acceptance, human review, owner acceptance, strict completion, or release readiness.

## Capture integrity

- Capture manifest: \`${report.sourceBindings.captureManifest.path}\` (\`${report.sourceBindings.captureManifest.sha256}\`)
- Report JSON: \`${REPORT_JSON_RELATIVE}\` (\`${reportJsonArtifact.sha256}\`)
- Flash Player owner/title: exact match; ScreenCaptureKit window ID \`${report.capture.window.windowID}\`
- Exact Unix PID binding: **not present**. Source mode is \`${pid.sourceKind}\`, PID wait is \`${pid.waitForPidSeconds}\`, and \`display.includedProcessID\` is absent. The window ID is not a PID.
- Frames: ${report.capture.frames.count}/${report.capture.frames.count} complete 800x600 PNGs; capture tool reports ${report.capture.frames.droppedOrIncompleteFrameCount} drops/incomplete frames.
- Requested cadence: 12 FPS; observed effective cadence: ${timing.effectiveFps.toFixed(6)} FPS (${(timing.nominalFpsErrorFraction * 100).toFixed(4)}% from nominal), inside the analyzer's explicit 2% diagnostic tolerance.
- Ordered frame-set SHA-256: \`${report.capture.frames.orderedFrameSetSha256}\`
- Content-crop sequence SHA-256: \`${report.capture.frames.contentCropSequenceSha256}\`
- Audio: ALAC, 48 kHz, stereo, ${report.capture.audio.bytes} bytes, ${report.capture.audio.durationSeconds.toFixed(6)} seconds.
- Audio SHA-256: \`${report.capture.audio.sha256}\`
- Decoded PCM SHA-256: \`${report.capture.audio.decodedPcm.sha256}\`; ${report.capture.audio.decodedPcm.nonZeroByteCount} nonzero bytes.

## Replay visual diagnostic

- Capture-start terminal-like prefix: ordinals ${replay.preTerminalLikePrefix.firstOrdinal}–${replay.preTerminalLikePrefix.lastOrdinal}.
- Reset transition window: ordinals ${replay.resetTransitionWindow.firstOrdinal}–${replay.resetTransitionWindow.lastOrdinal}.
- Reset-like pixel-identical plateau: ordinals ${replay.resetLikePlateau.firstOrdinal}–${replay.resetLikePlateau.lastOrdinal}; ordinal ${replay.resetLikePlateau.candidateOrdinal} is inside it.
- Operator mapping hypothesis: capture ordinals 163–290 contain 128 samples and are proposed as local frames 1–128. The raw capture has no playhead telemetry, and ordinals 162–164 have identical lesson-content pixels, so the exact local-frame mapping is **not proved by this analyzer**.
- Second terminal-like stable suffix: ordinals ${replay.secondTerminalLikeSuffix.firstOrdinal}–${replay.secondTerminalLikeSuffix.lastOrdinal}; maximum normalized content RMSE to the capture-start terminal-like reference is ${replay.secondTerminalLikeSuffix.rmseToInitialContent.maximum.toFixed(6)}.
- Diagnostic finding: a terminal-like → reset-like → terminal-like visual sequence is established from the pixels and frame order.

## Evidence boundary

- Replay operation causality: **not established**
- Semantic terminal state: **not established**
- Authoritative original-runtime trace/baseline: **false**
- Audio, human visual, and Owner acceptance: **false**
- Strict completion/public release: **false**
- Coverage, candidate, completion-ledger, and release-ledger mutations: **none**
- Report fingerprint: \`${report.reportFingerprintSha256}\`
`;
}

async function writeAtomically(filePath, bytes) {
  const reportsRoot = await realpath(
    path.dirname(filePath),
  );
  invariant(
    reportsRoot ===
      (await realpath(projectPath("reports"))),
    "report output parent is not the repository reports directory",
  );
  const pending =
    `${filePath}.${process.pid}.pending`;
  await writeFile(pending, bytes, {
    flag: "wx",
    mode: 0o644,
  });
  await rename(pending, filePath);
}

export async function analyzeNativeReplayDiagnostic({
  write = false,
} = {}) {
  const report = await buildDiagnosticReport();
  const reportJsonBytes = Buffer.from(pretty(report));
  const reportJsonArtifact = {
    bytes: reportJsonBytes.length,
    sha256: sha256(reportJsonBytes),
  };
  const markdown = renderMarkdown(
    report,
    reportJsonArtifact,
  );
  const markdownBytes = Buffer.from(markdown);
  if (write) {
    await writeAtomically(
      projectPath(REPORT_JSON_RELATIVE),
      reportJsonBytes,
    );
    await writeAtomically(
      projectPath(REPORT_MARKDOWN_RELATIVE),
      markdownBytes,
    );
  } else {
    for (const [relativePath, expected] of [
      [REPORT_JSON_RELATIVE, reportJsonBytes],
      [REPORT_MARKDOWN_RELATIVE, markdownBytes],
    ]) {
      const actual = await readRegular(
        projectPath(relativePath),
        relativePath,
      );
      invariant(
        actual.bytes.equals(expected),
        `${relativePath} is missing, stale, or not generated by the current analyzer/inputs`,
      );
    }
  }
  return {
    report,
    outputs: {
      json: {
        path: REPORT_JSON_RELATIVE,
        ...reportJsonArtifact,
      },
      markdown: {
        path: REPORT_MARKDOWN_RELATIVE,
        bytes: markdownBytes.length,
        sha256: sha256(markdownBytes),
      },
    },
    wroteReports: write,
  };
}

export function parseArguments(argv) {
  if (
    argv.length === 1 &&
    argv[0] === "--write"
  ) {
    return {
      write: true,
    };
  }
  if (
    argv.length === 0 ||
    (argv.length === 1 && argv[0] === "--check")
  ) {
    return {
      write: false,
    };
  }
  throw new Error(
    "Usage: node scripts/analyze-g4-l3-ts006-native-replay-diagnostic.mjs [--write|--check]",
  );
}

async function main() {
  const options = parseArguments(
    process.argv.slice(2),
  );
  const result =
    await analyzeNativeReplayDiagnostic(options);
  process.stdout.write(
    `${JSON.stringify({
      status: result.report.status,
      frameCount:
        result.report.capture.frames.count,
      effectiveFps:
        result.report.capture.frames.timing
          .effectiveFps,
      resetPlateau:
        result.report.replayDiagnostic
          .resetLikePlateau,
      secondTerminalLikeSuffix:
        result.report.replayDiagnostic
          .secondTerminalLikeSuffix,
      exactPidBindingEstablished:
        result.report.capture.pidEvidence
          .exactPidBindingEstablished,
      authoritativeOriginalRuntimeTrace:
        result.report.authority
          .authoritativeOriginalRuntimeTrace,
      strictMigrationComplete:
        result.report.authority
          .strictMigrationComplete,
      outputs: result.outputs,
    })}\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH
) {
  main().catch((error) => {
    process.stderr.write(
      `${error.stack || error.message}\n`,
    );
    process.exitCode = 1;
  });
}
