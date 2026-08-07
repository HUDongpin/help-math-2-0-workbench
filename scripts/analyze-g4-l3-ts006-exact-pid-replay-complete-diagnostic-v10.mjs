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
  "ts006-en-exact-pid-replay-complete-diagnostic-20260726T220817+0800";
export const SESSION_RELATIVE = `artifacts/full-frame/g4-l3/${SESSION_ID}`;
export const CAPTURE_MANIFEST_RELATIVE = `${SESSION_RELATIVE}/capture-manifest.json`;
export const CAPTURE_AUDIO_RELATIVE = `${SESSION_RELATIVE}/system-audio-lossless.m4a`;
export const SPANISH_SIBLING_ID =
  "ts006-es-page-audio-exact-pid-diagnostic-20260726T221112+0800";
export const SPANISH_SIBLING_RELATIVE =
  `artifacts/full-frame/g4-l3/${SPANISH_SIBLING_ID}`;
export const REPORT_JSON_RELATIVE =
  "reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.json";
export const REPORT_MARKDOWN_RELATIVE =
  "reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.md";

const SUPERSEDED_SESSION_ID =
  "ts006-en-exact-pid-replay-diagnostic-20260726T220036+0800";
const SUPERSEDED_MANIFEST_RELATIVE =
  `artifacts/full-frame/g4-l3/${SUPERSEDED_SESSION_ID}/capture-manifest.json`;
const HOST_SHELL_RELATIVE =
  "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf";
const HOST_SHELL_SHA256 =
  "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const EXPECTED_WINDOW_TITLE = `file://${path.join(PROJECT_ROOT, HOST_SHELL_RELATIVE)}`;
const EVIDENCE_TYPE =
  "g4-l3-lossless-window-frame-and-system-audio-capture";
const EXPECTED_PID = 97581;
const EXPECTED_WIDTH = 800;
const EXPECTED_HEIGHT = 600;
export const EXPECTED_ALPHA_MASK_SHA256 =
  "61a3e6ea1072d68e50f8ff6353e8af4e9657994bd3262d106d549e7e82fa88ca";
const EXPECTED_PRIMARY_FRAME_COUNT = 537;
const EXPECTED_PRIMARY_AUDIO_SHA256 =
  "dcebe8af5e012b395f46ffebe8edae1a575807e5d2164924a133cd4a783fec06";
const EXPECTED_SPANISH_FRAME_COUNT = 240;
const EXPECTED_SPANISH_AUDIO_SHA256 =
  "02165163f0c8692ee6194c6250705aa0aceba2506c2e4b93c31f375de23e7600";
const NOMINAL_FPS = 12;
const NOMINAL_FPS_TOLERANCE_FRACTION = 0.02;
const HASH = /^[a-f0-9]{64}$/u;

export const CONTENT_CROP = Object.freeze({
  x: 0,
  y: 108,
  width: 800,
  height: 416,
  purpose: "Lesson body between the 108px header and the footer beginning at y=524.",
});
export const REGISTRATION_ANCHOR = Object.freeze({
  x: 0,
  y: 0,
  width: 800,
  height: 60,
  purpose: "Static top shell strip used to detect whole-frame registration drift.",
});
const FULL_HEADER_ANCHOR = Object.freeze({
  x: 0,
  y: 0,
  width: 800,
  height: 108,
  purpose: "Complete Lesson Shell header; exact stability is expected for the primary EN capture.",
});
export const TERMINAL_MARKER_REGION = Object.freeze({
  x: 190,
  y: 305,
  width: 250,
  height: 36,
  purpose: "Source-stage region containing the terminal Show your work row.",
});
export const INSTRUCTIONAL_PIXEL_EXCLUSIONS = Object.freeze([
  Object.freeze({
    id: "replay-control-tooltip",
    x: 515,
    y: 498,
    width: 110,
    height: 26,
  }),
  Object.freeze({
    id: "next-control-tooltip",
    x: 680,
    y: 490,
    width: 120,
    height: 34,
  }),
]);

const TERMINAL_MARKER_CHANGED_PIXEL_THRESHOLD = 1000;
const TERMINAL_LIKE_RMSE_TO_INITIAL_MAXIMUM = 0.02;
const SIGNIFICANT_ADJACENT_RMSE = 0.02;

const AUTHORITY_FALSE = Object.freeze({
  exactPidSelectionCreatesRuntimeAuthority: false,
  authorizedNaturalTraceEstablished: false,
  replayInputCausalityEstablished: false,
  sourcePlayheadMappingEstablished: false,
  authoritativeOriginalRuntimeTrace: false,
  authoritativeBaseline: false,
  baselineAccepted: false,
  englishAudioAccepted: false,
  spanishAudioAccepted: false,
  audioLanguageCorrectnessAccepted: false,
  audioSynchronizationAccepted: false,
  independentHumanVisualAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicRelease: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(`TS006 exact-PID v10 diagnostic: ${message}`);
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
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
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
    typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `path must be repository-relative: ${relativePath}`,
  );
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  const relative = path.relative(PROJECT_ROOT, resolved);
  invariant(
    relative && relative !== ".." && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

async function readRegular(filePath, label) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} is not a regular file`);
  const bytes = await readFile(filePath);
  return {bytes, size: bytes.length, sha256: sha256(bytes)};
}

function decodePng(bytes, label) {
  let image;
  try {
    image = PNG.sync.read(bytes, {checkCRC: true});
  } catch (error) {
    throw new Error(`TS006 exact-PID v10 diagnostic: ${label} decode failed: ${error.message}`);
  }
  invariant(
    image.width === EXPECTED_WIDTH && image.height === EXPECTED_HEIGHT,
    `${label} must be 800x600`,
  );
  return image;
}

function extractRgbRegion(image, region) {
  invariant(
    region.x >= 0 && region.y >= 0 && region.width > 0 && region.height > 0
      && region.x + region.width <= image.width
      && region.y + region.height <= image.height,
    "RGB region is out of bounds",
  );
  const output = Buffer.allocUnsafe(region.width * region.height * 3);
  let outputOffset = 0;
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const inputOffset = (y * image.width + x) * 4;
      output[outputOffset] = image.data[inputOffset];
      output[outputOffset + 1] = image.data[inputOffset + 1];
      output[outputOffset + 2] = image.data[inputOffset + 2];
      outputOffset += 3;
    }
  }
  return output;
}

function hashInstructionalRgba(image) {
  const digest = createHash("sha256");
  for (let y = CONTENT_CROP.y; y < CONTENT_CROP.y + CONTENT_CROP.height; y += 1) {
    const excludedIntervals = INSTRUCTIONAL_PIXEL_EXCLUSIONS
      .filter((region) => y >= region.y && y < region.y + region.height)
      .map((region) => [region.x, region.x + region.width])
      .sort((left, right) => left[0] - right[0]);
    let nextX = CONTENT_CROP.x;
    for (const [excludedStart, excludedEnd] of excludedIntervals) {
      if (excludedStart > nextX) {
        digest.update(image.data.subarray(
          (y * image.width + nextX) * 4,
          (y * image.width + excludedStart) * 4,
        ));
      }
      nextX = Math.max(nextX, excludedEnd);
    }
    const rowEnd = CONTENT_CROP.x + CONTENT_CROP.width;
    if (nextX < rowEnd) {
      digest.update(image.data.subarray(
        (y * image.width + nextX) * 4,
        (y * image.width + rowEnd) * 4,
      ));
    }
  }
  return digest.digest("hex");
}

export function normalizedRgbRmse(left, right) {
  invariant(
    Buffer.isBuffer(left) && Buffer.isBuffer(right)
      && left.length === right.length && left.length > 0,
    "RMSE inputs must be equal nonempty RGB buffers",
  );
  let squaredError = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    squaredError += difference * difference;
  }
  return Math.sqrt(squaredError / left.length) / 255;
}

function changedPixelCount(left, right, euclideanThreshold = 25) {
  invariant(
    left.length === right.length && left.length % 3 === 0,
    "changed-pixel inputs must be equal RGB buffers",
  );
  let changed = 0;
  for (let index = 0; index < left.length; index += 3) {
    const red = left[index] - right[index];
    const green = left[index + 1] - right[index + 1];
    const blue = left[index + 2] - right[index + 2];
    if (Math.sqrt(red * red + green * green + blue * blue) > euclideanThreshold) {
      changed += 1;
    }
  }
  return changed;
}

export function detectLeftStageOffset(image) {
  for (let x = 0; x < image.width; x += 1) {
    let blackPixels = 0;
    for (let y = 0; y < image.height; y += 1) {
      const index = (y * image.width + x) * 4;
      if (
        image.data[index] <= 5
        && image.data[index + 1] <= 5
        && image.data[index + 2] <= 5
      ) blackPixels += 1;
    }
    if (blackPixels / image.height < 0.98) return x;
  }
  return image.width;
}

export function inspectAlphaMask(image) {
  const alpha = Buffer.allocUnsafe(image.width * image.height);
  let nonOpaquePixelCount = 0;
  let minimumX = image.width;
  let minimumY = image.height;
  let maximumX = -1;
  let maximumY = -1;
  const nonOpaquePixelsByRow = [];
  for (let y = 0; y < image.height; y += 1) {
    let rowCount = 0;
    for (let x = 0; x < image.width; x += 1) {
      const alphaValue = image.data[(y * image.width + x) * 4 + 3];
      alpha[y * image.width + x] = alphaValue;
      if (alphaValue < 255) {
        nonOpaquePixelCount += 1;
        rowCount += 1;
        minimumX = Math.min(minimumX, x);
        minimumY = Math.min(minimumY, y);
        maximumX = Math.max(maximumX, x);
        maximumY = Math.max(maximumY, y);
      }
    }
    if (rowCount > 0) nonOpaquePixelsByRow.push({y, count: rowCount});
  }
  return {
    sha256: sha256(alpha),
    nonOpaquePixelCount,
    nonOpaqueBounds: nonOpaquePixelCount > 0
      ? {minimumX, minimumY, maximumX, maximumY}
      : null,
    nonOpaquePixelsByRow,
  };
}

function validateCommonCaptureBoundary(manifest, {
  expectedFrameCount,
  expectedAudioSha256,
  label,
}) {
  invariant(
    manifest?.schemaVersion === 1
      && manifest.evidenceType === EVIDENCE_TYPE
      && manifest.status === "raw-capture-not-yet-bound-to-runtime-trace"
      && manifest.runtimeAuthorityClaimed === false
      && manifest.acceptanceEffect === "none",
    `${label} authority boundary drifted`,
  );
  invariant(
    manifest.configuration?.sourceKind === "waited-first-window-exact-pid"
      && manifest.configuration?.waitForPidSeconds === "2.0"
      && manifest.configuration?.resolvedDisplaySourceRect === "0.0,58.0,800.0,600.0"
      && manifest.configuration?.sourceRect === "0.0,28.0,800.0,600.0"
      && manifest.configuration?.outputWidth === "800"
      && manifest.configuration?.outputHeight === "600"
      && manifest.configuration?.fps === "12"
      && manifest.configuration?.pixelFormat === "BGRA"
      && manifest.configuration?.cursor === "excluded"
      && manifest.configuration?.audio === "system-audio-48kHz-2ch-ALAC",
    `${label} exact-PID/display-crop/native-capture configuration drifted`,
  );
  invariant(
    manifest.display?.includedProcessID === EXPECTED_PID
      && manifest.display?.includedApplicationName === "Flash Player"
      && manifest.display?.includedBundleIdentifier === "com.macromedia.Flash Player.app",
    `${label} exact process selection drifted`,
  );
  invariant(
    manifest.window?.ownerName === "Flash Player"
      && manifest.window?.title === EXPECTED_WINDOW_TITLE
      && manifest.window?.onScreen === true
      && manifest.window?.frameWidth === 800
      && manifest.window?.frameHeight === 628
      && manifest.window?.frameX === 0
      && manifest.window?.frameY === 30,
    `${label} Flash Player window/title/geometry drifted`,
  );
  invariant(
    manifest.frameAlphaMaskSha256 === EXPECTED_ALPHA_MASK_SHA256,
    `${label} declared alpha mask drifted`,
  );
  invariant(
    manifest.droppedOrIncompleteFrameCount === 0
      && Array.isArray(manifest.frames)
      && manifest.frames.length === expectedFrameCount,
    `${label} must have ${expectedFrameCount} frames and zero drops`,
  );
  invariant(
    manifest.audio?.codec === "Apple Lossless Audio Codec"
      && manifest.audio?.sampleRate === 48000
      && manifest.audio?.channels === 2
      && manifest.audio?.outputFile === "system-audio-lossless.m4a"
      && manifest.audio?.outputSha256 === expectedAudioSha256
      && manifest.audio?.inputContainsNonZeroAudio === true
      && Number.isInteger(manifest.audio?.inputPayloadBytes)
      && Number.isInteger(manifest.audio?.inputNonZeroBytes),
    `${label} ALAC descriptor drifted`,
  );
  return true;
}

export function validatePrimaryCaptureBoundary(manifest) {
  return validateCommonCaptureBoundary(manifest, {
    expectedFrameCount: EXPECTED_PRIMARY_FRAME_COUNT,
    expectedAudioSha256: EXPECTED_PRIMARY_AUDIO_SHA256,
    label: "primary EN Replay capture",
  });
}

export function validateSpanishSiblingBoundary(manifest) {
  return validateCommonCaptureBoundary(manifest, {
    expectedFrameCount: EXPECTED_SPANISH_FRAME_COUNT,
    expectedAudioSha256: EXPECTED_SPANISH_AUDIO_SHA256,
    label: "Spanish page-audio sibling",
  });
}

function percentile(sortedValues, probability) {
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * probability) - 1),
  );
  return sortedValues[index];
}

export function summarizeFrameTiming(frames) {
  invariant(Array.isArray(frames) && frames.length >= 2, "timing requires two frames");
  invariant(frames[0].relativeTimeSeconds === 0, "first relative frame time must be zero");
  const intervals = [];
  for (let index = 1; index < frames.length; index += 1) {
    const relative = frames[index].relativeTimeSeconds - frames[index - 1].relativeTimeSeconds;
    const presentation =
      frames[index].presentationTimeSeconds - frames[index - 1].presentationTimeSeconds;
    invariant(relative > 0 && presentation > 0, `frame ${index + 1} timing is non-monotonic`);
    invariant(
      Math.abs(relative - presentation) < 1e-6,
      `frame ${index + 1} relative and presentation cadence disagree`,
    );
    intervals.push(relative);
  }
  const sorted = [...intervals].sort((left, right) => left - right);
  const durationSeconds = frames.at(-1).relativeTimeSeconds;
  const effectiveFps = (frames.length - 1) / durationSeconds;
  const nominalFpsErrorFraction = Math.abs(effectiveFps - NOMINAL_FPS) / NOMINAL_FPS;
  return {
    durationSeconds,
    effectiveFps,
    nominalFps: NOMINAL_FPS,
    nominalFpsToleranceFraction: NOMINAL_FPS_TOLERANCE_FRACTION,
    nominalFpsErrorFraction,
    nominalCadenceWithinTolerance:
      nominalFpsErrorFraction <= NOMINAL_FPS_TOLERANCE_FRACTION,
    intervalSeconds: {
      minimum: sorted[0],
      median: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      maximum: sorted.at(-1),
    },
  };
}

function exactSignatureRuns(metrics, minimumLength = 2) {
  const runs = [];
  let firstOrdinal = 1;
  let signature = metrics[0].contentCropSha256;
  for (let index = 1; index < metrics.length; index += 1) {
    if (metrics[index].contentCropSha256 !== signature) {
      const lastOrdinal = metrics[index - 1].ordinal;
      if (lastOrdinal - firstOrdinal + 1 >= minimumLength) {
        runs.push({
          firstOrdinal,
          lastOrdinal,
          frameCount: lastOrdinal - firstOrdinal + 1,
          contentCropSha256: signature,
        });
      }
      firstOrdinal = metrics[index].ordinal;
      signature = metrics[index].contentCropSha256;
    }
  }
  const lastOrdinal = metrics.at(-1).ordinal;
  if (lastOrdinal - firstOrdinal + 1 >= minimumLength) {
    runs.push({
      firstOrdinal,
      lastOrdinal,
      frameCount: lastOrdinal - firstOrdinal + 1,
      contentCropSha256: signature,
    });
  }
  return runs;
}

function suffixStart(metrics, firstAllowedOrdinal, predicate) {
  let candidate = null;
  for (let ordinal = firstAllowedOrdinal; ordinal <= metrics.length; ordinal += 1) {
    if (predicate(metrics[ordinal - 1])) {
      if (candidate === null) candidate = ordinal;
    } else {
      candidate = null;
    }
  }
  return candidate;
}

function range(firstOrdinal, lastOrdinal) {
  return {
    firstOrdinal,
    lastOrdinal,
    frameCount: lastOrdinal - firstOrdinal + 1,
  };
}

function metricSummary(metrics) {
  return {
    minimum: Math.min(...metrics),
    maximum: Math.max(...metrics),
    mean: metrics.reduce((sum, value) => sum + value, 0) / metrics.length,
  };
}

export function deriveReplaySegments(metrics) {
  invariant(
    Array.isArray(metrics)
      && metrics.length === EXPECTED_PRIMARY_FRAME_COUNT
      && metrics.every((metric, index) => metric.ordinal === index + 1),
    "Replay metrics must contain all 537 ordered frames",
  );
  const largestAdjacent = metrics.slice(1).reduce(
    (largest, metric) =>
      metric.adjacentContentRmse > largest.adjacentContentRmse ? metric : largest,
    metrics[1],
  );
  invariant(largestAdjacent.ordinal === 17, "largest reset transition is not ordinal 17");
  const resetStart = largestAdjacent.ordinal;
  const longRuns = exactSignatureRuns(metrics, 10);
  const expectedLongRunRanges = [
    [18, 30],
    [39, 119],
    [126, 155],
    [162, 252],
    [262, 288],
  ];
  invariant(
    canonicalJson(longRuns.map((item) => [item.firstOrdinal, item.lastOrdinal]))
      === canonicalJson(expectedLongRunRanges),
    "long pixel-identical holds no longer match the deterministic Replay sequence",
  );
  const resetPlateau = longRuns[0];
  const terminalLikeSuffixStart = suffixStart(
    metrics,
    resetPlateau.lastOrdinal + 1,
    (metric) =>
      metric.terminalMarkerChangedPixels >= TERMINAL_MARKER_CHANGED_PIXEL_THRESHOLD
      && metric.rmseToInitialContent <= TERMINAL_LIKE_RMSE_TO_INITIAL_MAXIMUM,
  );
  invariant(terminalLikeSuffixStart === 262, "terminal-like suffix no longer starts at 262");
  const preResetSignificantChanges = metrics
    .slice(1, resetStart - 1)
    .filter((metric) => metric.adjacentContentRmse > SIGNIFICANT_ADJACENT_RMSE);
  invariant(
    preResetSignificantChanges.length === 1
      && preResetSignificantChanges[0].ordinal === 14,
    "pre-reset hover/interaction visual no longer begins at ordinal 14",
  );
  const terminalSuffixMetrics = metrics.slice(terminalLikeSuffixStart - 1);
  invariant(
    metrics.slice(0, 16).every(
      (metric) =>
        metric.terminalMarkerChangedPixels >= TERMINAL_MARKER_CHANGED_PIXEL_THRESHOLD,
    ),
    "terminal marker is absent from the capture prefix",
  );
  const terminalInstructionalSha256 = metrics[0].instructionalRgbaSha256;
  invariant(
    metrics.slice(0, 16).every(
      (metric) => metric.instructionalRgbaSha256 === terminalInstructionalSha256,
    ),
    "instructional terminal pixels are not stable across ordinals 1..16",
  );
  invariant(
    terminalSuffixMetrics.every(
      (metric) => metric.instructionalRgbaSha256 === terminalInstructionalSha256,
    ),
    "terminal suffix instructional pixels differ from the terminal prefix",
  );
  return {
    algorithm:
      "body-rgb-sha256-adjacent-rmse-terminal-marker-and-long-hold-segmentation-v1",
    thresholds: {
      longPixelIdenticalHoldMinimumFrames: 10,
      significantAdjacentRmse: SIGNIFICANT_ADJACENT_RMSE,
      terminalMarkerChangedPixelsMinimum: TERMINAL_MARKER_CHANGED_PIXEL_THRESHOLD,
      terminalLikeRmseToInitialMaximum: TERMINAL_LIKE_RMSE_TO_INITIAL_MAXIMUM,
    },
    stableInstructionalTerminalPrefix: {
      ...range(1, 16),
      instructionalRgbaSha256: terminalInstructionalSha256,
      excludedControlRegions: INSTRUCTIONAL_PIXEL_EXCLUSIONS,
      interpretation:
        "After excluding two control-tooltip rectangles, terminal instructional pixels are byte-identical through the complete pre-reset prefix; ordinals 14-16 contain only a control-hover overlay.",
    },
    interactionNeutralTerminalPrefix: {
      ...range(1, 13),
      interpretation:
        "Terminal lesson content is present before pointer-hover pixels appear.",
    },
    preResetInteractionVisual: {
      ...range(14, 16),
      firstSignificantAdjacentChangeOrdinal: 14,
      interpretation:
        "Pixels change while terminal content remains present; cursor pixels are excluded, so this is consistent with a control hover prelude but does not prove an input event.",
    },
    replayResetVisualTransition: {
      ...range(17, 17),
      normalizedAdjacentBodyRmse: largestAdjacent.adjacentContentRmse,
      interpretation:
        "The largest adjacent body change in the capture removes terminal content.",
    },
    resetLikePlateau: {
      ...resetPlateau,
      interpretation:
        "The body pixels are identical for 13 frames after the reset transition.",
    },
    observedRevealAnimation: {
      ...range(31, 261),
      completeThroughTerminalReveal: true,
      transitions: [
        {...range(31, 38), leadsToHold: "check-your-work"},
        {...range(120, 125), leadsToHold: "strategies-heading"},
        {...range(156, 161), leadsToHold: "strategy-list"},
        {...range(253, 261), leadsToHold: "terminal-show-your-work"},
      ],
      pixelIdenticalHolds: [
        {...longRuns[1], diagnosticLabel: "check-your-work-hold"},
        {...longRuns[2], diagnosticLabel: "strategies-heading-hold"},
        {...longRuns[3], diagnosticLabel: "strategy-list-hold"},
      ],
    },
    terminalLikeSuffix: {
      ...range(terminalLikeSuffixStart, metrics.length),
      initialPixelIdenticalHold: longRuns[4],
      fullFramePixelStaticTail: (() => {
        const finalSha256 = metrics.at(-1).frameSha256;
        let firstOrdinal = metrics.length;
        while (
          firstOrdinal > 1
          && metrics[firstOrdinal - 2].frameSha256 === finalSha256
        ) firstOrdinal -= 1;
        return {
          ...range(firstOrdinal, metrics.length),
          frameSha256: finalSha256,
          note:
            "Only this tail is full-frame pixel-static because footer controls and the source terminal pulse continue changing earlier frames.",
        };
      })(),
      normalizedRmseToInitialBody: metricSummary(
        terminalSuffixMetrics.map((metric) => metric.rmseToInitialContent),
      ),
      terminalMarkerChangedPixels: metricSummary(
        terminalSuffixMetrics.map((metric) => metric.terminalMarkerChangedPixels),
      ),
      instructionalRgbaSha256: terminalInstructionalSha256,
      instructionalPixelsEqualToTerminalPrefix: true,
      interpretation:
        "Terminal content remains present through capture end; later per-frame variation is the source terminal pulse, so the suffix is terminal-like rather than pixel-static.",
    },
    visualSequenceEstablished: true,
    replayInputCausalityEstablished: false,
    sourcePlayheadMappingEstablished: false,
    semanticRuntimeAuthorityEstablished: false,
  };
}

async function verifyCaptureRoot(sessionRoot) {
  const entries = (await readdir(sessionRoot, {withFileTypes: true}))
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
    canonicalJson(entries) === canonicalJson([
      {name: "capture-manifest.json", type: "file"},
      {name: "frames", type: "directory"},
      {name: "system-audio-lossless.m4a", type: "file"},
    ]),
    "capture directory contains unexpected, missing, or non-regular entries",
  );
  return entries;
}

function alphaInvariantSummary(alpha) {
  return {
    alphaMaskSha256: alpha.sha256,
    nonOpaquePixelCount: alpha.nonOpaquePixelCount,
    nonOpaqueBounds: alpha.nonOpaqueBounds,
    nonOpaquePixelsByRow: alpha.nonOpaquePixelsByRow,
  };
}

async function verifyFrames(sessionRoot, manifest, {
  collectReplayMetrics,
  resetReferenceOrdinal = 18,
}) {
  const frameRoot = path.join(sessionRoot, "frames");
  const metadata = await lstat(frameRoot);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(), "frames is not a real directory");
  const actualNames = (await readdir(frameRoot)).sort();
  invariant(
    actualNames.length === manifest.frames.length,
    "frame directory count does not match manifest",
  );

  let initialContent = null;
  let resetTerminalMarker = null;
  if (collectReplayMetrics) {
    const resetDescriptor = manifest.frames[resetReferenceOrdinal - 1];
    const resetBytes = await readFile(path.join(sessionRoot, resetDescriptor.file));
    resetTerminalMarker = extractRgbRegion(
      decodePng(resetBytes, "reset terminal-marker reference"),
      TERMINAL_MARKER_REGION,
    );
  }

  const metrics = [];
  const offsets = new Set();
  const alphaMasks = new Map();
  const anchors = new Map();
  const fullHeaderAnchors = new Map();
  const orderedRows = [];
  const contentRows = [];
  const instructionalRows = [];
  let previousContent = null;
  let totalPngBytes = 0;
  let firstAlpha = null;

  for (let index = 0; index < manifest.frames.length; index += 1) {
    const ordinal = index + 1;
    const descriptor = manifest.frames[index];
    const expectedFile = `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
    invariant(
      descriptor.ordinal === ordinal
        && descriptor.file === expectedFile
        && descriptor.status === "complete"
        && descriptor.width === EXPECTED_WIDTH
        && descriptor.height === EXPECTED_HEIGHT
        && HASH.test(descriptor.sha256),
      `frame ${ordinal} descriptor drifted`,
    );
    invariant(actualNames[index] === path.basename(expectedFile), `frame ${ordinal} missing`);
    const artifact = await readRegular(path.join(sessionRoot, expectedFile), `frame ${ordinal}`);
    invariant(
      artifact.size === descriptor.bytes && artifact.sha256 === descriptor.sha256,
      `frame ${ordinal} bytes/hash drifted`,
    );
    const image = decodePng(artifact.bytes, `frame ${ordinal}`);
    const alpha = inspectAlphaMask(image);
    if (firstAlpha === null) firstAlpha = alphaInvariantSummary(alpha);
    invariant(
      alpha.sha256 === manifest.frameAlphaMaskSha256,
      `frame ${ordinal} alpha mask drifted`,
    );
    alphaMasks.set(alpha.sha256, (alphaMasks.get(alpha.sha256) ?? 0) + 1);
    const offset = detectLeftStageOffset(image);
    offsets.add(offset);
    const anchorHash = sha256(extractRgbRegion(image, REGISTRATION_ANCHOR));
    anchors.set(anchorHash, (anchors.get(anchorHash) ?? 0) + 1);
    const fullHeaderAnchorHash = sha256(extractRgbRegion(image, FULL_HEADER_ANCHOR));
    fullHeaderAnchors.set(
      fullHeaderAnchorHash,
      (fullHeaderAnchors.get(fullHeaderAnchorHash) ?? 0) + 1,
    );
    const content = extractRgbRegion(image, CONTENT_CROP);
    const contentCropSha256 = sha256(content);
    const instructionalRgbaSha256 = hashInstructionalRgba(image);
    if (initialContent === null) initialContent = content;
    if (collectReplayMetrics) {
      const marker = extractRgbRegion(image, TERMINAL_MARKER_REGION);
      metrics.push({
        ordinal,
        relativeTimeSeconds: descriptor.relativeTimeSeconds,
        presentationTimeSeconds: descriptor.presentationTimeSeconds,
        frameSha256: descriptor.sha256,
        contentCropSha256,
        instructionalRgbaSha256,
        rmseToInitialContent: normalizedRgbRmse(content, initialContent),
        adjacentContentRmse:
          previousContent === null ? 0 : normalizedRgbRmse(content, previousContent),
        terminalMarkerChangedPixels:
          changedPixelCount(marker, resetTerminalMarker),
      });
    }
    previousContent = content;
    totalPngBytes += artifact.size;
    orderedRows.push(`${ordinal}\0${expectedFile}\0${descriptor.sha256}\n`);
    contentRows.push(`${ordinal}\0${contentCropSha256}\n`);
    instructionalRows.push(`${ordinal}\0${instructionalRgbaSha256}\n`);
  }
  invariant(alphaMasks.size === 1, "alpha mask is not stable across frames");
  return {
    metrics,
    totalPngBytes,
    completeFrames: manifest.frames.length,
    orderedFrameSetSha256: sha256(Buffer.from(orderedRows.join(""))),
    contentCropSequenceSha256: sha256(Buffer.from(contentRows.join(""))),
    instructionalPixelSequenceSha256:
      sha256(Buffer.from(instructionalRows.join(""))),
    alphaMask: firstAlpha,
    alphaMaskDistinctCount: alphaMasks.size,
    alphaMaskFrameCount: [...alphaMasks.values()][0],
    horizontalRegistration: {
      detectedLeftStageOffsetsPixels: [...offsets].sort((left, right) => left - right),
      staticTopAnchorDistinctSha256Count: anchors.size,
      staticTopAnchorSha256: anchors.size === 1 ? [...anchors.keys()][0] : null,
      staticTopAnchorFrameCount:
        anchors.size === 1 ? [...anchors.values()][0] : null,
      completeHeader108DistinctSha256Count: fullHeaderAnchors.size,
      completeHeader108Sha256:
        fullHeaderAnchors.size === 1 ? [...fullHeaderAnchors.keys()][0] : null,
      completeHeader108FrameCount:
        fullHeaderAnchors.size === 1 ? [...fullHeaderAnchors.values()][0] : null,
      noHorizontalRegistrationDriftDetected:
        offsets.size === 1 && offsets.has(0) && anchors.size === 1,
      algorithmBoundary:
        "Leading-black-column detector plus exact RGB SHA-256 of native x=0,y=0,w=800,h=60.",
    },
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
  const [artifact, probeResult, ffprobeVersion, ffmpegVersion] = await Promise.all([
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
      {encoding: "utf8", maxBuffer: 8 * 1024 * 1024},
    ),
    toolVersion("ffprobe"),
    toolVersion("ffmpeg"),
  ]);
  invariant(
    artifact.size === manifestAudio.outputBytes
      && artifact.sha256 === manifestAudio.outputSha256,
    "ALAC file bytes/hash drifted",
  );
  const probe = JSON.parse(probeResult.stdout);
  const streams = (probe.streams ?? []).filter((stream) => stream.codec_type === "audio");
  invariant(streams.length === 1, "audio container must contain exactly one audio stream");
  const stream = streams[0];
  invariant(
    stream.codec_name === "alac"
      && Number(stream.sample_rate) === 48000
      && stream.channels === 2
      && stream.channel_layout === "stereo"
      && Number(stream.bits_per_raw_sample) === 24
      && Number(probe.format?.size) === artifact.size,
    "ffprobe did not confirm ALAC/48kHz/stereo/24-bit/exact bytes",
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
    {encoding: null, maxBuffer: 32 * 1024 * 1024},
  );
  invariant(Buffer.isBuffer(decoded.stdout), "PCM decode did not return bytes");
  let nonZeroByteCount = 0;
  for (const byte of decoded.stdout) if (byte !== 0) nonZeroByteCount += 1;
  invariant(
    decoded.stdout.length === manifestAudio.inputPayloadBytes && nonZeroByteCount > 0,
    "PCM decoded byte length drifted or signal is silent",
  );
  return {
    file: portable(audioPath),
    bytes: artifact.size,
    sha256: artifact.sha256,
    containerFormat: probe.format?.format_name,
    durationSeconds: Number(stream.duration ?? probe.format?.duration),
    stream: {
      index: stream.index,
      codecName: stream.codec_name,
      codecLongName: stream.codec_long_name,
      sampleRate: Number(stream.sample_rate),
      channels: stream.channels,
      channelLayout: stream.channel_layout,
      bitsPerRawSample: Number(stream.bits_per_raw_sample),
    },
    decodedPcm: {
      format: "signed-32-bit-little-endian-stereo",
      bytes: decoded.stdout.length,
      sha256: sha256(decoded.stdout),
      nonZeroByteCount,
      captureManifestPayloadBytesMatch: true,
      captureManifestInputNonZeroByteCount: manifestAudio.inputNonZeroBytes,
      captureManifestNonZeroByteCountComparable: false,
    },
    tools: {ffprobe: ffprobeVersion, ffmpeg: ffmpegVersion},
  };
}

function keyMetric(metrics, ordinal) {
  const metric = metrics[ordinal - 1];
  return {
    ordinal,
    relativeTimeSeconds: metric.relativeTimeSeconds,
    presentationTimeSeconds: metric.presentationTimeSeconds,
    frameSha256: metric.frameSha256,
    contentCropSha256: metric.contentCropSha256,
    rmseToInitialContent: metric.rmseToInitialContent,
    adjacentContentRmse: metric.adjacentContentRmse,
    terminalMarkerChangedPixels: metric.terminalMarkerChangedPixels,
  };
}

function reportFingerprint(report) {
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(projected)));
}

async function loadManifest(relativePath, label) {
  const artifact = await readRegular(projectPath(relativePath), label);
  let value;
  try {
    value = JSON.parse(artifact.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`TS006 exact-PID v10 diagnostic: ${label} JSON failed: ${error.message}`);
  }
  return {artifact, value};
}

export async function buildExactPidReplayCompleteDiagnosticV10Report() {
  const primaryManifestPath = CAPTURE_MANIFEST_RELATIVE;
  const spanishManifestPath = `${SPANISH_SIBLING_RELATIVE}/capture-manifest.json`;
  const [
    primaryRoot,
    spanishRoot,
    primaryManifestResult,
    spanishManifestResult,
    supersededManifestResult,
    analyzerArtifact,
    hostShellArtifact,
  ] = await Promise.all([
    realpath(projectPath(SESSION_RELATIVE)),
    realpath(projectPath(SPANISH_SIBLING_RELATIVE)),
    loadManifest(primaryManifestPath, "primary capture manifest"),
    loadManifest(spanishManifestPath, "Spanish sibling manifest"),
    loadManifest(SUPERSEDED_MANIFEST_RELATIVE, "superseded capture manifest"),
    readRegular(SCRIPT_PATH, "v10 analyzer"),
    readRegular(projectPath(HOST_SHELL_RELATIVE), "staged Lesson Shell"),
  ]);
  invariant(hostShellArtifact.sha256 === HOST_SHELL_SHA256, "staged Lesson Shell hash drifted");
  await Promise.all([verifyCaptureRoot(primaryRoot), verifyCaptureRoot(spanishRoot)]);

  const primaryManifest = primaryManifestResult.value;
  const spanishManifest = spanishManifestResult.value;
  validatePrimaryCaptureBoundary(primaryManifest);
  validateSpanishSiblingBoundary(spanishManifest);
  invariant(
    supersededManifestResult.value.frames?.length === 382
      && supersededManifestResult.value.acceptanceEffect === "none",
    "superseded 382-frame diagnostic binding drifted",
  );

  const primaryTiming = summarizeFrameTiming(primaryManifest.frames);
  const spanishTiming = summarizeFrameTiming(spanishManifest.frames);
  invariant(
    primaryTiming.nominalCadenceWithinTolerance
      && spanishTiming.nominalCadenceWithinTolerance,
    "observed cadence exceeds the explicit 2% diagnostic tolerance",
  );

  const [primaryFrames, spanishFrames, primaryAudio, spanishAudio] = await Promise.all([
    verifyFrames(primaryRoot, primaryManifest, {collectReplayMetrics: true}),
    verifyFrames(spanishRoot, spanishManifest, {collectReplayMetrics: false}),
    probeAndDecodeAudio(
      path.join(primaryRoot, primaryManifest.audio.outputFile),
      primaryManifest.audio,
    ),
    probeAndDecodeAudio(
      path.join(spanishRoot, spanishManifest.audio.outputFile),
      spanishManifest.audio,
    ),
  ]);
  const replay = deriveReplaySegments(primaryFrames.metrics);
  invariant(
    primaryFrames.alphaMask.alphaMaskSha256 === EXPECTED_ALPHA_MASK_SHA256
      && spanishFrames.alphaMask.alphaMaskSha256 === EXPECTED_ALPHA_MASK_SHA256,
    "verified alpha mask does not match the declared invariant",
  );
  invariant(
    primaryFrames.horizontalRegistration.noHorizontalRegistrationDriftDetected
      && spanishFrames.horizontalRegistration.noHorizontalRegistrationDriftDetected,
    "horizontal registration drift was detected",
  );

  const keyOrdinals = [
    1, 13, 14, 16, 17, 18, 30, 31, 38, 39, 119, 120, 125, 126, 155,
    156, 161, 162, 252, 253, 261, 262, 288, 289, 537,
  ];
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10",
    status: "verified-acceptance-neutral-diagnostic-not-promotion-eligible",
    animationId: "course-g04-l03-ts-006",
    languageLabel: "en",
    scope:
      "Exact bytes, exact-PID/display crop, alpha, frame cadence, horizontal registration, ALAC/decoded PCM, and deterministic Replay visual segmentation.",
    authority: structuredClone(AUTHORITY_FALSE),
    acceptance: structuredClone(AUTHORITY_FALSE),
    sourceBindings: {
      primaryCaptureManifest: {
        path: primaryManifestPath,
        bytes: primaryManifestResult.artifact.size,
        sha256: primaryManifestResult.artifact.sha256,
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
    primaryCapture: {
      sessionId: SESSION_ID,
      evidenceType: primaryManifest.evidenceType,
      status: primaryManifest.status,
      startedAt: primaryManifest.startedAt,
      endedAt: primaryManifest.endedAt,
      exactPidAndDisplayCrop: {
        expectedProcessID: EXPECTED_PID,
        includedProcessID: primaryManifest.display.includedProcessID,
        includedApplicationName: primaryManifest.display.includedApplicationName,
        includedBundleIdentifier: primaryManifest.display.includedBundleIdentifier,
        sourceKind: primaryManifest.configuration.sourceKind,
        waitForPidSeconds: Number(primaryManifest.configuration.waitForPidSeconds),
        resolvedDisplaySourceRect:
          primaryManifest.configuration.resolvedDisplaySourceRect,
        exactPidManifestSelectionVerified: true,
        runtimeAuthorityEffect: "none",
      },
      window: primaryManifest.window,
      frames: {
        count: primaryManifest.frames.length,
        completeFrameCount: primaryFrames.completeFrames,
        width: EXPECTED_WIDTH,
        height: EXPECTED_HEIGHT,
        droppedOrIncompleteFrameCount: primaryManifest.droppedOrIncompleteFrameCount,
        totalPngBytes: primaryFrames.totalPngBytes,
        orderedFrameSetSha256: primaryFrames.orderedFrameSetSha256,
        contentCropSequenceSha256: primaryFrames.contentCropSequenceSha256,
        instructionalPixelSequenceSha256:
          primaryFrames.instructionalPixelSequenceSha256,
        timing: primaryTiming,
      },
      alphaMask: {
        declaredSha256: primaryManifest.frameAlphaMaskSha256,
        ...primaryFrames.alphaMask,
        distinctMaskCount: primaryFrames.alphaMaskDistinctCount,
        verifiedFrameCount: primaryFrames.alphaMaskFrameCount,
        stableAcrossAllFrames: primaryFrames.alphaMaskDistinctCount === 1,
      },
      horizontalRegistration: primaryFrames.horizontalRegistration,
      audio: {
        ...primaryAudio,
        manifestInputContainsNonZeroAudio:
          primaryManifest.audio.inputContainsNonZeroAudio,
        manifestBufferCount: primaryManifest.audio.bufferCount,
        firstPresentationOffsetFromFirstVideoFrameSeconds:
          primaryManifest.audio.firstPresentationTimeSeconds
          - primaryManifest.frames[0].presentationTimeSeconds,
        lastPresentationOffsetFromLastVideoFrameSeconds:
          primaryManifest.audio.lastPresentationTimeSeconds
          - primaryManifest.frames.at(-1).presentationTimeSeconds,
        acceptanceEffect: "none",
      },
    },
    replayDiagnostic: {
      ...replay,
      contentCrop: CONTENT_CROP,
      terminalMarkerRegion: TERMINAL_MARKER_REGION,
      instructionalPixelExclusions: INSTRUCTIONAL_PIXEL_EXCLUSIONS,
      keyFrames: Object.fromEntries(
        keyOrdinals.map((ordinal) => [String(ordinal), keyMetric(primaryFrames.metrics, ordinal)]),
      ),
      conclusion:
        "Pixels establish terminal prefix, control-hover prelude, reset transition and plateau, four reveal transitions, and a terminal-like suffix through capture end. They do not prove the Replay input event, exact source playhead values, natural-entry causality, or runtime authority.",
    },
    diagnosticSibling: {
      sessionId: SPANISH_SIBLING_ID,
      role: "separate-exact-pid-spanish-page-audio-diagnostic-sibling",
      sourceBinding: {
        path: spanishManifestPath,
        bytes: spanishManifestResult.artifact.size,
        sha256: spanishManifestResult.artifact.sha256,
      },
      languageLabel: "es-operator-label-not-runtime-language-authority",
      exactPidAndDisplayCrop: {
        includedProcessID: spanishManifest.display.includedProcessID,
        resolvedDisplaySourceRect:
          spanishManifest.configuration.resolvedDisplaySourceRect,
        exactPidManifestSelectionVerified: true,
      },
      frames: {
        count: spanishManifest.frames.length,
        completeFrameCount: spanishFrames.completeFrames,
        droppedOrIncompleteFrameCount: spanishManifest.droppedOrIncompleteFrameCount,
        orderedFrameSetSha256: spanishFrames.orderedFrameSetSha256,
        timing: spanishTiming,
      },
      alphaMask: {
        declaredSha256: spanishManifest.frameAlphaMaskSha256,
        ...spanishFrames.alphaMask,
        stableAcrossAllFrames: spanishFrames.alphaMaskDistinctCount === 1,
      },
      horizontalRegistration: spanishFrames.horizontalRegistration,
      audio: {
        ...spanishAudio,
        manifestInputContainsNonZeroAudio:
          spanishManifest.audio.inputContainsNonZeroAudio,
        acceptanceEffect: "none",
      },
      independentMacOsAccountEstablished: false,
      naturalTraceEstablished: false,
      spanishLanguageCorrectnessEstablished: false,
      audioCueCausalityEstablished: false,
      humanListeningAccepted: false,
      ownerAccepted: false,
      strictAcceptanceEffect: "none",
    },
    supersededDiagnostic: {
      sessionId: SUPERSEDED_SESSION_ID,
      manifest: {
        path: SUPERSEDED_MANIFEST_RELATIVE,
        bytes: supersededManifestResult.artifact.size,
        sha256: supersededManifestResult.artifact.sha256,
      },
      frameCount: supersededManifestResult.value.frames.length,
      classification: "retained-superseded-incomplete-diagnostic-not-v10-primary",
      deletedOrOverwritten: false,
      contributesToReplaySegmentation: false,
      acceptanceEffect: "none",
    },
    verifiedFacts: {
      primaryManifestBytesBound: true,
      stagedLessonShellBytesBound: true,
      exactPid97581ManifestSelectionVerified: true,
      resolvedDisplayCrop0x58x800x600Verified: true,
      all537PrimaryFramesBytesHashesAndPngsVerified: true,
      primaryCaptureToolReportedZeroDrops: true,
      primaryAlphaMaskStableAcross537Frames: true,
      primaryNoHorizontalRegistrationDriftDetected: true,
      primaryAlac48kHzStereo24BitVerified: true,
      primaryDecodedPcmHashAndNonzeroSignalVerified: true,
      terminalResetAnimationTerminalPixelSequenceVerified: true,
      spanishSibling240FramesAndZeroDropsVerified: true,
      spanishSiblingAlphaMaskStableAcross240Frames: true,
      spanishSiblingAlacAndNonzeroDecodedPcmVerified: true,
    },
    unresolvedGates: [
      "no-hash-chained-operation-event-log-proving-the-Replay-click",
      "no-source-playhead-telemetry-or-authoritative-ordinal-mapping",
      "no-authorized-natural-entry-trace-execution-report",
      "no-independent-English-and-Spanish-macOS-account-isolation",
      "no-English-or-Spanish-audio-language-correctness-acceptance",
      "no-audio-cue-causality-or-human-listening-acceptance",
      "no-independent-human-visual-review",
      "no-owner-acceptance",
    ],
    acceptanceEffect: "none",
    strictAcceptanceEffect: "none",
    coverageMutationPerformed: false,
    candidateMutationPerformed: false,
    completionLedgerMutationPerformed: false,
    releaseLedgerMutationPerformed: false,
    protectedPinsMutationPerformed: false,
    reportFingerprintSha256: null,
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  return report;
}

function renderMarkdown(report, reportJsonArtifact) {
  const primary = report.primaryCapture;
  const replay = report.replayDiagnostic;
  const sibling = report.diagnosticSibling;
  return `# G4 L3 TS006 exact-PID Replay complete diagnostic v10

Status: **verified acceptance-neutral diagnostic; not authority, baseline, acceptance, strict completion, or release evidence**.

## Primary EN diagnostic integrity

- Exact-PID manifest selection: PID \`${primary.exactPidAndDisplayCrop.includedProcessID}\`, \`${primary.exactPidAndDisplayCrop.sourceKind}\`, display crop \`${primary.exactPidAndDisplayCrop.resolvedDisplaySourceRect}\`.
- Frames: ${primary.frames.completeFrameCount}/${primary.frames.count} complete 800x600 PNGs; ${primary.frames.droppedOrIncompleteFrameCount} reported drops/incomplete frames.
- Capture duration/effective cadence: ${primary.frames.timing.durationSeconds.toFixed(6)} s / ${primary.frames.timing.effectiveFps.toFixed(6)} FPS.
- Alpha mask: \`${primary.alphaMask.alphaMaskSha256}\`, one mask across ${primary.alphaMask.verifiedFrameCount} frames, 116 non-opaque pixels restricted to the native bottom corners.
- Horizontal registration: offsets \`${primary.horizontalRegistration.detectedLeftStageOffsetsPixels.join(",")}\`; one exact 800x60 top-anchor hash across all frames; detected drift: **${primary.horizontalRegistration.noHorizontalRegistrationDriftDetected ? "none" : "yes"}**.
- ALAC: \`${primary.audio.sha256}\`, 48 kHz stereo, ${primary.audio.bytes} bytes; decoded PCM \`${primary.audio.decodedPcm.sha256}\`, ${primary.audio.decodedPcm.nonZeroByteCount} nonzero bytes.

## Replay pixel sequence

- Stable instructional terminal prefix: ordinals ${replay.stableInstructionalTerminalPrefix.firstOrdinal}–${replay.stableInstructionalTerminalPrefix.lastOrdinal}; the interaction-neutral portion is ${replay.interactionNeutralTerminalPrefix.firstOrdinal}–${replay.interactionNeutralTerminalPrefix.lastOrdinal}.
- Pre-reset control-hover visual: ordinals ${replay.preResetInteractionVisual.firstOrdinal}–${replay.preResetInteractionVisual.lastOrdinal}.
- Reset visual transition: ordinal ${replay.replayResetVisualTransition.firstOrdinal}; reset-like pixel-identical plateau: ${replay.resetLikePlateau.firstOrdinal}–${replay.resetLikePlateau.lastOrdinal}.
- Observed reveal animation: ordinals ${replay.observedRevealAnimation.firstOrdinal}–${replay.observedRevealAnimation.lastOrdinal}.
- Terminal-like instructional suffix: ordinals ${replay.terminalLikeSuffix.firstOrdinal}–${replay.terminalLikeSuffix.lastOrdinal}; it persists through capture end. Only ${replay.terminalLikeSuffix.fullFramePixelStaticTail.firstOrdinal}–${replay.terminalLikeSuffix.fullFramePixelStaticTail.lastOrdinal} are full-frame pixel-static because the footer and terminal pulse continue changing.
- Replay input causality and exact source-playhead mapping: **not established**.

## Separate Spanish page-audio diagnostic sibling

- Manifest: \`${sibling.sourceBinding.sha256}\`; PID \`${sibling.exactPidAndDisplayCrop.includedProcessID}\`; ${sibling.frames.completeFrameCount}/${sibling.frames.count} complete frames; zero drops.
- ALAC: \`${sibling.audio.sha256}\`; decoded PCM: \`${sibling.audio.decodedPcm.sha256}\`, nonzero.
- This sibling does **not** establish an independent ES account, natural trace, Spanish-language correctness, accepted audio timing/content, human listening acceptance, Owner acceptance, or strict evidence.

## Boundary

- All authority and acceptance fields remain false.
- Coverage, candidate, completion ledger, release ledger, and protected pins were not modified.
- The earlier 382-frame exact-PID capture remains retained as a superseded/incomplete diagnostic and does not contribute to v10 Replay segmentation.
- Report JSON: \`${REPORT_JSON_RELATIVE}\` (\`${reportJsonArtifact.sha256}\`)
- Report fingerprint: \`${report.reportFingerprintSha256}\`
`;
}

async function writeAtomically(filePath, bytes) {
  invariant(
    path.dirname(filePath) === projectPath("reports"),
    "report output must stay in reports/",
  );
  const pending = `${filePath}.${process.pid}.pending`;
  await writeFile(pending, bytes, {flag: "wx", mode: 0o644});
  await rename(pending, filePath);
}

export async function analyzeExactPidReplayCompleteDiagnosticV10({write = false} = {}) {
  const report = await buildExactPidReplayCompleteDiagnosticV10Report();
  const jsonBytes = Buffer.from(pretty(report));
  const jsonArtifact = {bytes: jsonBytes.length, sha256: sha256(jsonBytes)};
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonArtifact));
  if (write) {
    await Promise.all([
      writeAtomically(projectPath(REPORT_JSON_RELATIVE), jsonBytes),
      writeAtomically(projectPath(REPORT_MARKDOWN_RELATIVE), markdownBytes),
    ]);
  } else {
    for (const [relativePath, expected] of [
      [REPORT_JSON_RELATIVE, jsonBytes],
      [REPORT_MARKDOWN_RELATIVE, markdownBytes],
    ]) {
      const actual = await readRegular(projectPath(relativePath), relativePath);
      invariant(actual.bytes.equals(expected), `${relativePath} is missing or stale`);
    }
  }
  return {
    report,
    outputs: {
      json: {path: REPORT_JSON_RELATIVE, ...jsonArtifact},
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
  if (argv.length === 0 || (argv.length === 1 && argv[0] === "--check")) {
    return {write: false};
  }
  if (argv.length === 1 && argv[0] === "--write") return {write: true};
  throw new Error(
    "Usage: node scripts/analyze-g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.mjs [--write|--check]",
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  analyzeExactPidReplayCompleteDiagnosticV10(
    parseArguments(process.argv.slice(2)),
  ).then((result) => {
    process.stdout.write(`${JSON.stringify({
      status: result.report.status,
      exactPid: result.report.primaryCapture.exactPidAndDisplayCrop.includedProcessID,
      frameCount: result.report.primaryCapture.frames.count,
      resetOrdinal: result.report.replayDiagnostic.replayResetVisualTransition.firstOrdinal,
      animationRange: [
        result.report.replayDiagnostic.observedRevealAnimation.firstOrdinal,
        result.report.replayDiagnostic.observedRevealAnimation.lastOrdinal,
      ],
      terminalSuffix: [
        result.report.replayDiagnostic.terminalLikeSuffix.firstOrdinal,
        result.report.replayDiagnostic.terminalLikeSuffix.lastOrdinal,
      ],
      horizontalRegistrationDrift:
        !result.report.primaryCapture.horizontalRegistration
          .noHorizontalRegistrationDriftDetected,
      strictMigrationComplete: result.report.authority.strictMigrationComplete,
      outputs: result.outputs,
    })}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
