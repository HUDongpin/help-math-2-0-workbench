#!/usr/bin/env node

import {createHash} from "node:crypto";
import {execFile as execFileCallback} from "node:child_process";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

const ANIMATION_ID = "course-g04-l03-ts-006";
const PID = 97581;
const EXPECTED_ALPHA_MASK_SHA256 =
  "61a3e6ea1072d68e50f8ff6353e8af4e9657994bd3262d106d549e7e82fa88ca";
const EXPECTED_WINDOW_TITLE =
  "file:///Volumes/WestWorld/HELP MATH 2.0/work/original-runtime-host-trees/"
  + "course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf";
const HOST_SHELL =
  "work/original-runtime-host-trees/course-g04-l03-ts-006/root/"
  + "HELP_COURSES/ELMGR4/L3/index_local.swf";
const FLASH_EXECUTABLE =
  "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/"
  + "Flash Player";
const LIVE_SESSION_CONSUMER =
  "scripts/lib/original-runtime-live-session-consumer.mjs";
const REPORT_JSON =
  "reports/g4-l3-ts006-live-diagnostic-capture-receipt-v13.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-live-diagnostic-capture-receipt-v13.md";
const HASH_PATTERN = /^[0-9a-f]{64}$/u;

const HOST_SHELL_PIN = Object.freeze({
  bytes: 657_421,
  sha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
});
const FLASH_EXECUTABLE_PIN = Object.freeze({
  bytes: 23_199_312,
  sha256: "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30",
});
const LIVE_SESSION_CONSUMER_PIN = Object.freeze({
  bytes: 48_458,
  sha256: "1195917baeaf4479f8561ffc3d049e4e2e679c0a251bb99f6b883cc62e8774e6",
});

const CAPTURE_SPECS = Object.freeze([
  Object.freeze({
    id: "ts006-natural-forward-diagnostic-exact-pid-v5",
    label: "natural-forward diagnostic",
    directory:
      "artifacts/full-frame/g4-l3/"
      + "ts006-natural-forward-diagnostic-exact-pid-v5",
    expectedManifest: Object.freeze({
      bytes: 170_970,
      sha256:
        "79573a3205cd4e81edb1c52fe6fbd65ea5994e9d9d4288f1ad136b38736c7233",
    }),
    expectedFrames: 479,
    expectedFirstFrameSha256:
      "b5254dae6316e0a275461543daa3b431b0f416dc418e68bc11bdacb56afa3e94",
    expectedLastFrameSha256:
      "ad1b373ac863f2699b0712756f531006e9828f1352da77abf6ccd9cc02f1fcbf",
    expectedFirstLastChangedPixels: 168_860,
    expectedFirstLastNormalizedRgbRmse: 0.16829344593995757,
    expectedAudio: Object.freeze({
      outputBytes: 4_246_316,
      outputSha256:
        "8cc153e5a5ac151b9a7e6caa66fd8a7a1f39e0ef5789fe911c0f0ba31eac7b45",
      inputContainsNonZeroAudio: true,
      inputNonZeroBytes: 3_703_226,
      decodedPcmBytes: 7_703_040,
      decodedPcmSha256:
        "a50c464c44e68d1a24f78cdc6b644d6d1c5afdfdef04a50f64d322230f3764a1",
      nonZeroSamples: 919_922,
      maxAbsSample: 18_457,
      classification: "non-zero-audio-present",
    }),
    stateAnalysis: "first-last-different",
  }),
  Object.freeze({
    id: "ts006-answer-feedback-diagnostic-exact-pid-v6",
    label: "answer-feedback diagnostic",
    directory:
      "artifacts/full-frame/g4-l3/"
      + "ts006-answer-feedback-diagnostic-exact-pid-v6",
    expectedManifest: Object.freeze({
      bytes: 129_266,
      sha256:
        "c3956f3489ffe2608dc5ddeb37fad858e35c56660bc8e0b04680e9ef464cff08",
    }),
    expectedFrames: 360,
    expectedFirstFrameSha256:
      "bd8fb4096581029875d9488cbb1cbd6093af8bbaa45ef3319b404cd873965e46",
    expectedLastFrameSha256:
      "ef8f81f1c19db877a4137fbca13435e02a83336c013031dcad8abb1afd750da5",
    expectedFirstLastChangedPixels: 582,
    expectedFirstLastNormalizedRgbRmse: 0.003794228829725488,
    expectedAudio: Object.freeze({
      outputBytes: 2_905_219,
      outputSha256:
        "cb23898413627ddd807e3a1b0e12664d96981e4515b58c8a957bcafbc7bc92c0",
      inputContainsNonZeroAudio: false,
      inputNonZeroBytes: 0,
      decodedPcmBytes: 5_783_040,
      decodedPcmSha256:
        "c262a8897e71d36a0b9e49f66bef969128f9e481bda24a3b86d555eea8edd25b",
      nonZeroSamples: 0,
      maxAbsSample: 0,
      classification: "digital-silence",
    }),
    stateAnalysis: "instructional-state-held",
    invariantRegion: Object.freeze({
      x: 0,
      y: 0,
      width: 800,
      height: 563,
      expectedUniqueRgbHashes: 1,
      expectedRgbSha256:
        "303e3009f760eb6421b26f318152747d2a7d0c38dfc5fd92e2c35b08f8616cb3",
    }),
    expectedDifferenceUnion: Object.freeze({
      changedPixels: 582,
      bounds: Object.freeze({minX: 34, minY: 563, maxX: 457, maxY: 575}),
    }),
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !path.isAbsolute(relativePath),
    `project-relative path required: ${relativePath}`,
  );
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

function isWithin(ancestor, target) {
  const relative = path.relative(ancestor, target);
  return relative === ""
    || (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function assertNoSymlinkComponents(ancestor, target, label) {
  const relative = path.relative(ancestor, target);
  invariant(
    relative === ""
      || (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)),
    `${label} escapes its allowed root`,
  );
  let current = ancestor;
  if (relative === "") return;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    const metadata = await lstat(current);
    invariant(!metadata.isSymbolicLink(), `${label} contains a symlink`);
  }
}

async function readRegularAbsolute(absolutePath, label, allowedRoot = null) {
  const resolvedPath = path.resolve(absolutePath);
  if (allowedRoot) {
    const resolvedAllowedRoot = path.resolve(allowedRoot);
    await assertNoSymlinkComponents(resolvedAllowedRoot, resolvedPath, label);
    const [realAllowedRoot, realFile] = await Promise.all([
      realpath(resolvedAllowedRoot),
      realpath(resolvedPath),
    ]);
    invariant(isWithin(realAllowedRoot, realFile), `${label} resolves outside its allowed root`);
  } else {
    const parsed = path.parse(resolvedPath);
    await assertNoSymlinkComponents(parsed.root, resolvedPath, label);
  }
  const metadata = await lstat(resolvedPath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${label} must be a regular non-symlink file`,
  );
  const followed = await stat(resolvedPath);
  invariant(followed.isFile(), `${label} is not a regular file`);
  invariant(followed.nlink === 1, `${label} must not have multiple hard links`);
  const contents = await readFile(resolvedPath);
  return {
    path: absolutePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: `0${(followed.mode & 0o777).toString(8)}`,
    linkCount: followed.nlink,
    regularNonSymlink: true,
    contents,
  };
}

async function readProjectRegular(relativePath, label, allowedRoot = ROOT) {
  return readRegularAbsolute(projectPath(relativePath), label, allowedRoot)
    .then((binding) => ({...binding, path: portable(relativePath)}));
}

function withoutContents(binding) {
  const {contents, ...descriptor} = binding;
  return descriptor;
}

function assertPinned(binding, pin, label) {
  invariant(
    binding.bytes === pin.bytes && binding.sha256 === pin.sha256,
    `${label} differs from its pinned identity`,
  );
}

function parseIsoTimestamp(value, label) {
  invariant(typeof value === "string" && value.endsWith("Z"), `${label} is not UTC`);
  const parsed = Date.parse(value);
  invariant(Number.isFinite(parsed), `${label} is invalid`);
  return parsed;
}

function parseRect(value, label) {
  invariant(typeof value === "string", `${label} is missing`);
  const parts = value.split(",").map(Number);
  invariant(
    parts.length === 4 && parts.every(Number.isFinite),
    `${label} is not a numeric rectangle`,
  );
  return {x: parts[0], y: parts[1], width: parts[2], height: parts[3]};
}

function inspectPng(bytes, label) {
  let png;
  try {
    png = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} cannot be decoded as PNG: ${error.message}`);
  }
  invariant(png.width === 800 && png.height === 600, `${label} is not 800x600`);
  return png;
}

function inspectAlphaMask(png, label) {
  const alphaMask = Buffer.alloc(png.width * png.height);
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const pixel = (y * png.width) + x;
      const alpha = png.data[(pixel * 4) + 3];
      alphaMask[pixel] = alpha;
      const permittedNativeWindowCorner =
        y >= png.height - 18 && (x < 18 || x >= png.width - 18);
      invariant(
        alpha === 255 || permittedNativeWindowCorner,
        `${label} has non-opaque alpha outside the native bottom-corner mask`,
      );
    }
  }
  const hash = sha256(alphaMask);
  invariant(hash === EXPECTED_ALPHA_MASK_SHA256, `${label} alpha mask drifted`);
  return hash;
}

function rgbRegionSha256(png, region) {
  const hash = createHash("sha256");
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const offset = ((y * png.width) + x) * 4;
      hash.update(png.data.subarray(offset, offset + 3));
    }
  }
  return hash.digest("hex");
}

function compareRgb(first, last) {
  invariant(
    first.width === last.width && first.height === last.height,
    "first/last frame geometry differs",
  );
  let changedPixels = 0;
  let squaredError = 0;
  for (let offset = 0; offset < first.data.length; offset += 4) {
    let pixelChanged = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const difference = first.data[offset + channel] - last.data[offset + channel];
      if (difference !== 0) pixelChanged = true;
      squaredError += difference * difference;
    }
    if (pixelChanged) changedPixels += 1;
  }
  const sampleCount = first.width * first.height * 3;
  return {
    pixelContentDifferent: changedPixels > 0,
    changedPixels,
    changedPixelPercent: changedPixels / (first.width * first.height) * 100,
    normalizedRgbRmse: Math.sqrt(squaredError / sampleCount) / 255,
  };
}

function validateAudioDescriptor(audio, spec) {
  invariant(
    audio?.codec === "Apple Lossless Audio Codec"
      && audio.sampleRate === 48_000
      && audio.channels === 2
      && audio.outputFile === "system-audio-lossless.m4a",
    `${spec.id} audio format is not ALAC 48 kHz stereo`,
  );
  invariant(
    Number.isInteger(audio.bufferCount)
      && audio.bufferCount > 0
      && Number.isInteger(audio.inputPayloadBytes)
      && audio.inputPayloadBytes > 0
      && Number.isInteger(audio.inputNonZeroBytes)
      && audio.inputNonZeroBytes >= 0
      && audio.inputNonZeroBytes <= audio.inputPayloadBytes
      && audio.inputContainsNonZeroAudio === (audio.inputNonZeroBytes > 0),
    `${spec.id} audio payload diagnostics are inconsistent`,
  );
  invariant(
    audio.outputBytes === spec.expectedAudio.outputBytes
      && audio.outputSha256 === spec.expectedAudio.outputSha256
      && audio.inputContainsNonZeroAudio
        === spec.expectedAudio.inputContainsNonZeroAudio
      && audio.inputNonZeroBytes === spec.expectedAudio.inputNonZeroBytes,
    `${spec.id} audio descriptor differs from the pinned capture`,
  );
  invariant(
    Number.isFinite(audio.firstPresentationTimeSeconds)
      && Number.isFinite(audio.lastPresentationTimeSeconds)
      && audio.lastPresentationTimeSeconds >= audio.firstPresentationTimeSeconds,
    `${spec.id} audio timestamps are invalid`,
  );
}

export function validateCaptureManifestShape(manifest, spec) {
  invariant(
    manifest?.schemaVersion === 1
      && manifest.evidenceType
        === "g4-l3-lossless-window-frame-and-system-audio-capture"
      && manifest.status === "raw-capture-not-yet-bound-to-runtime-trace",
    `${spec.id} capture manifest schema/type/status is invalid`,
  );
  invariant(
    manifest.runtimeAuthorityClaimed === false
      && manifest.acceptanceEffect === "none",
    `${spec.id} raw capture crossed its authority boundary`,
  );
  invariant(
    manifest.configuration?.fps === "12"
      && manifest.configuration.outputWidth === "800"
      && manifest.configuration.outputHeight === "600"
      && manifest.configuration.minimumWindowWidth === "800"
      && manifest.configuration.minimumWindowHeight === "600"
      && manifest.configuration.sourceKind === "waited-first-window-exact-pid"
      && manifest.configuration.sourceRect === "0.0,28.0,800.0,600.0"
      && manifest.configuration.resolvedDisplaySourceRect
        === "0.0,58.0,800.0,600.0"
      && manifest.configuration.pixelFormat === "BGRA"
      && manifest.configuration.cursor === "excluded"
      && manifest.configuration.audio === "system-audio-48kHz-2ch-ALAC"
      && manifest.configuration.windowShadows
        === "display-window-framing-excluded"
      && manifest.configuration.alphaMaskInvariant
        === "stable-full-frame-mask-with-only-native-18px-bottom-corners-non-opaque",
    `${spec.id} exact-PID 800x600/12fps capture configuration is invalid`,
  );
  invariant(
    manifest.frameAlphaMaskSha256 === EXPECTED_ALPHA_MASK_SHA256,
    `${spec.id} alpha-mask identity is invalid`,
  );
  invariant(
    manifest.display?.includedProcessID === PID
      && manifest.display.includedApplicationName === "Flash Player"
      && manifest.display.includedBundleIdentifier
        === "com.macromedia.Flash Player.app"
      && manifest.display.displayID === 1
      && manifest.display.frameX === 0
      && manifest.display.frameY === 0
      && manifest.display.frameWidth === 1920
      && manifest.display.frameHeight === 1080,
    `${spec.id} display exact-PID identity is invalid`,
  );
  invariant(
    manifest.window?.ownerName === "Flash Player"
      && manifest.window.title === EXPECTED_WINDOW_TITLE
      && manifest.window.windowID === 6310
      && manifest.window.onScreen === true
      && manifest.window.frameX === 0
      && manifest.window.frameY === 30
      && manifest.window.frameWidth === 800
      && manifest.window.frameHeight === 628,
    `${spec.id} Flash window identity/title/geometry is invalid`,
  );
  const sourceRect = parseRect(
    manifest.configuration.sourceRect,
    `${spec.id} source rect`,
  );
  const resolvedRect = parseRect(
    manifest.configuration.resolvedDisplaySourceRect,
    `${spec.id} resolved source rect`,
  );
  invariant(
    sourceRect.x === 0
      && sourceRect.y === 28
      && sourceRect.width === 800
      && sourceRect.height === 600
      && resolvedRect.x === manifest.window.frameX - manifest.display.frameX
      && resolvedRect.y
        === manifest.window.frameY - manifest.display.frameY + sourceRect.y
      && resolvedRect.width === sourceRect.width
      && resolvedRect.height === sourceRect.height,
    `${spec.id} source rect does not resolve to the 800x600 native stage`,
  );
  invariant(
    manifest.droppedOrIncompleteFrameCount === 0,
    `${spec.id} contains dropped or incomplete frames`,
  );
  invariant(
    Array.isArray(manifest.frames)
      && manifest.frames.length === spec.expectedFrames,
    `${spec.id} frame count differs from ${spec.expectedFrames}`,
  );
  const startedAt = parseIsoTimestamp(manifest.startedAt, `${spec.id} startedAt`);
  const endedAt = parseIsoTimestamp(manifest.endedAt, `${spec.id} endedAt`);
  invariant(endedAt >= startedAt, `${spec.id} capture ends before it starts`);
  validateAudioDescriptor(manifest.audio, spec);
  return true;
}

export async function verifyCaptureFiles(spec, manifest) {
  const captureRoot = projectPath(spec.directory);
  await assertNoSymlinkComponents(ROOT, captureRoot, `${spec.id} capture root`);
  const captureRootInfo = await lstat(captureRoot);
  invariant(
    captureRootInfo.isDirectory() && !captureRootInfo.isSymbolicLink(),
    `${spec.id} capture root is not a regular directory`,
  );
  const rootEntries = await readdir(captureRoot, {withFileTypes: true});
  const rootInventory = rootEntries
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory"
        : entry.isFile() ? "file"
          : entry.isSymbolicLink() ? "symlink" : "other",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  invariant(
    stableJson(rootInventory) === stableJson([
      {name: "capture-manifest.json", type: "file"},
      {name: "frames", type: "directory"},
      {name: "system-audio-lossless.m4a", type: "file"},
    ]),
    `${spec.id} capture root contains unexpected or missing artifacts`,
  );

  const framesRoot = path.join(captureRoot, "frames");
  await assertNoSymlinkComponents(captureRoot, framesRoot, `${spec.id} frames root`);
  const frameRootInfo = await lstat(framesRoot);
  invariant(
    frameRootInfo.isDirectory() && !frameRootInfo.isSymbolicLink(),
    `${spec.id} frames root is not a regular directory`,
  );
  const frameEntries = await readdir(framesRoot, {withFileTypes: true});
  invariant(
    frameEntries.length === manifest.frames.length
      && frameEntries.every((entry) => entry.isFile() && !entry.isSymbolicLink()),
    `${spec.id} frames directory differs from the manifest inventory`,
  );
  const actualNames = frameEntries.map(({name}) => name).sort();
  const expectedNames = manifest.frames.map((_, index) =>
    `frame-${String(index + 1).padStart(6, "0")}.png`);
  invariant(
    stableJson(actualNames) === stableJson(expectedNames),
    `${spec.id} frames directory names differ from the manifest`,
  );

  let previousPresentation = -Infinity;
  let previousRelative = -Infinity;
  let totalPngBytes = 0;
  let firstPng = null;
  let lastPng = null;
  const invariantRegionHashes = new Set();
  const differenceUnion = Buffer.alloc(800 * 600);
  let differenceMinX = 800;
  let differenceMinY = 600;
  let differenceMaxX = -1;
  let differenceMaxY = -1;

  for (const [index, frame] of manifest.frames.entries()) {
    const ordinal = index + 1;
    const expectedFile =
      `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
    invariant(
      frame?.ordinal === ordinal
        && frame.file === expectedFile
        && frame.status === "complete"
        && frame.width === 800
        && frame.height === 600
        && Number.isInteger(frame.bytes)
        && frame.bytes > 0
        && HASH_PATTERN.test(frame.sha256 || ""),
      `${spec.id} frame ${ordinal} descriptor is invalid`,
    );
    invariant(
      Number.isFinite(frame.presentationTimeSeconds)
        && frame.presentationTimeSeconds > previousPresentation
        && Number.isFinite(frame.relativeTimeSeconds)
        && frame.relativeTimeSeconds >= 0
        && frame.relativeTimeSeconds > previousRelative,
      `${spec.id} frame ${ordinal} timestamps are not strictly increasing`,
    );
    if (ordinal === 1) {
      invariant(
        frame.relativeTimeSeconds === 0,
        `${spec.id} first frame relative time is not zero`,
      );
    }
    previousPresentation = frame.presentationTimeSeconds;
    previousRelative = frame.relativeTimeSeconds;

    const artifact = await readRegularAbsolute(
      path.join(captureRoot, frame.file),
      `${spec.id} frame ${ordinal}`,
      captureRoot,
    );
    invariant(
      artifact.bytes === frame.bytes && artifact.sha256 === frame.sha256,
      `${spec.id} frame ${ordinal} bytes/hash differ from the manifest`,
    );
    const png = inspectPng(artifact.contents, `${spec.id} frame ${ordinal}`);
    inspectAlphaMask(png, `${spec.id} frame ${ordinal}`);
    totalPngBytes += artifact.bytes;
    if (ordinal === 1) firstPng = png;
    if (ordinal === manifest.frames.length) lastPng = png;

    if (spec.invariantRegion) {
      invariantRegionHashes.add(rgbRegionSha256(png, spec.invariantRegion));
      if (ordinal > 1) {
        for (let y = 0; y < 600; y += 1) {
          for (let x = 0; x < 800; x += 1) {
            const pixel = (y * 800) + x;
            const offset = pixel * 4;
            const changed =
              png.data[offset] !== firstPng.data[offset]
              || png.data[offset + 1] !== firstPng.data[offset + 1]
              || png.data[offset + 2] !== firstPng.data[offset + 2];
            if (changed) {
              differenceUnion[pixel] = 1;
              differenceMinX = Math.min(differenceMinX, x);
              differenceMinY = Math.min(differenceMinY, y);
              differenceMaxX = Math.max(differenceMaxX, x);
              differenceMaxY = Math.max(differenceMaxY, y);
            }
          }
        }
      }
    }
  }

  invariant(
    manifest.frames[0].sha256 === spec.expectedFirstFrameSha256
      && manifest.frames.at(-1).sha256 === spec.expectedLastFrameSha256,
    `${spec.id} first/last frame identities differ from the pinned capture`,
  );
  const firstLast = compareRgb(firstPng, lastPng);
  invariant(
    firstLast.changedPixels === spec.expectedFirstLastChangedPixels
      && firstLast.normalizedRgbRmse
        === spec.expectedFirstLastNormalizedRgbRmse,
    `${spec.id} first/last RGB comparison drifted`,
  );

  let instructionalState = null;
  if (spec.invariantRegion) {
    const uniqueHashes = [...invariantRegionHashes].sort();
    const unionChangedPixels = differenceUnion.reduce(
      (count, changed) => count + changed,
      0,
    );
    const differenceBounds = {
      minX: differenceMinX,
      minY: differenceMinY,
      maxX: differenceMaxX,
      maxY: differenceMaxY,
    };
    invariant(
      uniqueHashes.length === spec.invariantRegion.expectedUniqueRgbHashes
        && uniqueHashes[0] === spec.invariantRegion.expectedRgbSha256,
      `${spec.id} instructional-state invariant region changed`,
    );
    invariant(
      unionChangedPixels === spec.expectedDifferenceUnion.changedPixels
        && stableJson(differenceBounds)
          === stableJson(spec.expectedDifferenceUnion.bounds),
      `${spec.id} all-frame difference union changed`,
    );
    instructionalState = {
      conclusion:
        "stable-question-1-state-with-footer-ui-only-variants-no-visible-feedback",
      evidence:
        "Every RGB pixel in rows 0 through 562 is identical across all "
        + "360 frames. The only changing pixels are footer-decoration pixels "
        + "within rows 563 through 575.",
      visualDescription:
        "The first-question prompt remains visible throughout; no answer "
        + "selection or feedback state appears. This bounded engineering "
        + "description is not an immutable human visual review.",
      invariantRegion: {
        x: spec.invariantRegion.x,
        y: spec.invariantRegion.y,
        width: spec.invariantRegion.width,
        height: spec.invariantRegion.height,
        uniqueRgbHashes: uniqueHashes.length,
        rgbSha256: uniqueHashes[0],
      },
      allFrameDifferenceUnion: {
        changedPixels: unionChangedPixels,
        bounds: differenceBounds,
      },
    };
  } else {
    invariant(
      firstLast.pixelContentDifferent === true,
      `${spec.id} first and last frames are not visually different`,
    );
    instructionalState = {
      conclusion: "first-and-last-frame-pixel-content-is-different",
      evidence:
        "The first and last 800x600 decoded RGB images differ materially. "
        + "This proves a visual-state change only; it does not prove the "
        + "operator action path or natural-trace causality.",
    };
  }

  const durationSeconds = manifest.frames.at(-1).relativeTimeSeconds;
  const effectiveFps =
    (manifest.frames.length - 1) / durationSeconds;
  invariant(
    effectiveFps >= 10.5 && effectiveFps <= 13.5,
    `${spec.id} effective FPS is outside the 12 FPS envelope`,
  );
  return {
    rootInventory,
    fileSafety: {
      manifestFilesAreRegularNonSymlinkSingleLink: true,
      frameDirectoryMatchesManifestExactly: true,
      captureRootContainsNetworkAudit: false,
      captureRootContainsSessionKit: false,
      captureRootContainsOperatorEventLog: false,
    },
    frames: {
      count: manifest.frames.length,
      complete: manifest.frames.length,
      droppedOrIncomplete: 0,
      totalPngBytes,
      width: 800,
      height: 600,
      configuredFps: 12,
      effectiveFps,
      durationSeconds,
      alphaMaskSha256: EXPECTED_ALPHA_MASK_SHA256,
      alphaMaskVerifiedForEveryFrame: true,
      first: {
        ordinal: manifest.frames[0].ordinal,
        file: manifest.frames[0].file,
        bytes: manifest.frames[0].bytes,
        sha256: manifest.frames[0].sha256,
      },
      last: {
        ordinal: manifest.frames.at(-1).ordinal,
        file: manifest.frames.at(-1).file,
        bytes: manifest.frames.at(-1).bytes,
        sha256: manifest.frames.at(-1).sha256,
      },
      firstLastRgbComparison: firstLast,
    },
    instructionalState,
  };
}

async function resolveAudioTools() {
  const [ffmpegPath, ffprobePath] = await Promise.all([
    realpath(process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg"),
    realpath(process.env.FFPROBE_PATH || "/opt/homebrew/bin/ffprobe"),
  ]);
  const [ffmpeg, ffprobe] = await Promise.all([
    readRegularAbsolute(ffmpegPath, "resolved ffmpeg executable"),
    readRegularAbsolute(ffprobePath, "resolved ffprobe executable"),
  ]);
  const [{stdout: ffmpegVersion}, {stdout: ffprobeVersion}] = await Promise.all([
    execFile(ffmpegPath, ["-version"], {encoding: "utf8"}),
    execFile(ffprobePath, ["-version"], {encoding: "utf8"}),
  ]);
  return {
    ffmpegPath,
    ffprobePath,
    descriptors: {
      ffmpeg: {
        ...withoutContents(ffmpeg),
        version: ffmpegVersion.split(/\r?\n/u)[0],
      },
      ffprobe: {
        ...withoutContents(ffprobe),
        version: ffprobeVersion.split(/\r?\n/u)[0],
      },
    },
  };
}

async function inspectLosslessAudio(spec, manifest, tools) {
  const captureRoot = projectPath(spec.directory);
  const audioPath = path.join(captureRoot, manifest.audio.outputFile);
  const artifact = await readRegularAbsolute(
    audioPath,
    `${spec.id} lossless audio`,
    captureRoot,
  );
  invariant(
    artifact.bytes === manifest.audio.outputBytes
      && artifact.sha256 === manifest.audio.outputSha256,
    `${spec.id} ALAC file bytes/hash differ from the manifest`,
  );
  invariant(
    artifact.contents.length >= 12
      && artifact.contents.subarray(4, 8).toString("ascii") === "ftyp",
    `${spec.id} audio is not an ISO BMFF/M4A container`,
  );
  const {stdout: probeOutput} = await execFile(
    tools.ffprobePath,
    [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries",
      "stream=codec_name,codec_long_name,sample_rate,channels,duration",
      "-of", "json",
      audioPath,
    ],
    {encoding: "utf8", maxBuffer: 1024 * 1024},
  );
  const probe = JSON.parse(probeOutput);
  invariant(
    Array.isArray(probe.streams)
      && probe.streams.length === 1
      && probe.streams[0].codec_name === "alac"
      && probe.streams[0].sample_rate === "48000"
      && probe.streams[0].channels === 2,
    `${spec.id} audio probe did not find one ALAC 48 kHz stereo stream`,
  );
  const {stdout: pcm} = await execFile(
    tools.ffmpegPath,
    [
      "-v", "error",
      "-i", audioPath,
      "-map", "0:a:0",
      "-f", "s16le",
      "-acodec", "pcm_s16le",
      "pipe:1",
    ],
    {encoding: "buffer", maxBuffer: 32 * 1024 * 1024},
  );
  invariant(pcm.length % 2 === 0, `${spec.id} decoded PCM is misaligned`);
  let nonZeroSamples = 0;
  let maxAbsSample = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    const sample = pcm.readInt16LE(offset);
    if (sample !== 0) nonZeroSamples += 1;
    maxAbsSample = Math.max(maxAbsSample, Math.abs(sample));
  }
  const decoded = {
    sampleFormat: "signed-16-bit-little-endian",
    decodedPcmBytes: pcm.length,
    decodedSamplesAcrossChannels: pcm.length / 2,
    nonZeroSamples,
    maxAbsSample,
    pcmSha256: sha256(pcm),
    classification: nonZeroSamples === 0
      ? "digital-silence" : "non-zero-audio-present",
  };
  invariant(
    decoded.decodedPcmBytes === spec.expectedAudio.decodedPcmBytes
      && decoded.pcmSha256 === spec.expectedAudio.decodedPcmSha256
      && decoded.nonZeroSamples === spec.expectedAudio.nonZeroSamples
      && decoded.maxAbsSample === spec.expectedAudio.maxAbsSample
      && decoded.classification === spec.expectedAudio.classification,
    `${spec.id} decoded lossless audio classification drifted`,
  );
  return {
    artifact: {
      path: portable(path.relative(ROOT, audioPath)),
      bytes: artifact.bytes,
      sha256: artifact.sha256,
      mode: artifact.mode,
      linkCount: artifact.linkCount,
      regularNonSymlink: true,
    },
    manifestDiagnostics: {
      bufferCount: manifest.audio.bufferCount,
      inputPayloadBytes: manifest.audio.inputPayloadBytes,
      inputContainsNonZeroAudio: manifest.audio.inputContainsNonZeroAudio,
      inputNonZeroBytes: manifest.audio.inputNonZeroBytes,
      outputBytes: manifest.audio.outputBytes,
      outputSha256: manifest.audio.outputSha256,
    },
    decodedStream: {
      codecName: probe.streams[0].codec_name,
      codecLongName: probe.streams[0].codec_long_name,
      sampleRate: Number(probe.streams[0].sample_rate),
      channels: probe.streams[0].channels,
      durationSeconds: Number(probe.streams[0].duration),
      ...decoded,
    },
    acceptanceEffect: "none",
    listeningAcceptanceCreated: false,
  };
}

async function verifyCapture(spec, tools) {
  const manifestBinding = await readProjectRegular(
    `${spec.directory}/capture-manifest.json`,
    `${spec.id} capture manifest`,
    projectPath(spec.directory),
  );
  assertPinned(manifestBinding, spec.expectedManifest, `${spec.id} manifest`);
  let manifest;
  try {
    manifest = JSON.parse(manifestBinding.contents.toString("utf8"));
  } catch (error) {
    throw new Error(`${spec.id} manifest is invalid JSON: ${error.message}`);
  }
  validateCaptureManifestShape(manifest, spec);
  const [captureFiles, audio] = await Promise.all([
    verifyCaptureFiles(spec, manifest),
    inspectLosslessAudio(spec, manifest, tools),
  ]);
  return {
    id: spec.id,
    label: spec.label,
    captureDirectory: spec.directory,
    manifest: withoutContents(manifestBinding),
    captureIdentity: {
      schemaVersion: manifest.schemaVersion,
      evidenceType: manifest.evidenceType,
      status: manifest.status,
      startedAt: manifest.startedAt,
      endedAt: manifest.endedAt,
      processId: manifest.display.includedProcessID,
      sourceKind: manifest.configuration.sourceKind,
      displayId: manifest.display.displayID,
      applicationName: manifest.display.includedApplicationName,
      bundleIdentifier: manifest.display.includedBundleIdentifier,
      windowId: manifest.window.windowID,
      windowOwner: manifest.window.ownerName,
      windowTitle: manifest.window.title,
      windowFrame: {
        x: manifest.window.frameX,
        y: manifest.window.frameY,
        width: manifest.window.frameWidth,
        height: manifest.window.frameHeight,
      },
      sourceRect: manifest.configuration.sourceRect,
      resolvedDisplaySourceRect:
        manifest.configuration.resolvedDisplaySourceRect,
      cursor: manifest.configuration.cursor,
      runtimeAuthorityClaimed: manifest.runtimeAuthorityClaimed,
      acceptanceEffect: manifest.acceptanceEffect,
    },
    ...captureFiles,
    audio,
    authority: {
      captureIntegrityVerified: true,
      runtimeAuthority: false,
      promotionEligible: false,
      strictEffect: "none",
    },
  };
}

function validateFingerprint(document, field, label) {
  const projected = structuredClone(document);
  delete projected[field];
  invariant(document[field] === fingerprint(projected), `${label} fingerprint is stale`);
}

export function validateG4L3Ts006LiveDiagnosticCaptureReceiptV13(receipt) {
  invariant(
    receipt?.schemaVersion === 1
      && receipt.reportType
        === "g4-l3-ts006-live-diagnostic-capture-receipt-v13"
      && receipt.animationId === ANIMATION_ID,
    "TS006 live diagnostic capture receipt identity is invalid",
  );
  validateFingerprint(
    receipt,
    "receiptFingerprintSha256",
    "TS006 live diagnostic capture receipt",
  );
  invariant(
    Array.isArray(receipt.captures)
      && receipt.captures.length === CAPTURE_SPECS.length
      && receipt.captures[0].id === CAPTURE_SPECS[0].id
      && receipt.captures[1].id === CAPTURE_SPECS[1].id
      && receipt.captures[0].frames.count === 479
      && receipt.captures[1].frames.count === 360
      && receipt.captures.every(
        (capture) =>
          capture.frames.droppedOrIncomplete === 0
          && capture.frames.alphaMaskVerifiedForEveryFrame === true
          && capture.authority.runtimeAuthority === false
          && capture.authority.promotionEligible === false
          && capture.authority.strictEffect === "none"
          && capture.audio.acceptanceEffect === "none"
          && capture.audio.listeningAcceptanceCreated === false,
      ),
    "TS006 diagnostic capture summaries or authority boundaries are invalid",
  );
  invariant(
    receipt.captures[0].frames.firstLastRgbComparison.pixelContentDifferent
      === true
      && receipt.captures[0].instructionalState.conclusion
        === "first-and-last-frame-pixel-content-is-different"
      && receipt.captures[0].audio.decodedStream.classification
        === "non-zero-audio-present",
    "TS006 v5 diagnostic findings changed",
  );
  invariant(
    receipt.captures[1].instructionalState.conclusion
      === "stable-question-1-state-with-footer-ui-only-variants-no-visible-feedback"
      && receipt.captures[1].instructionalState.invariantRegion
        .uniqueRgbHashes === 1
      && receipt.captures[1].audio.decodedStream.classification
        === "digital-silence"
      && receipt.captures[1].audio.decodedStream.nonZeroSamples === 0,
    "TS006 v6 diagnostic findings changed",
  );
  invariant(
    receipt.missingAuthorityEvidence.networkAudit === null
      && receipt.missingAuthorityEvidence.sessionKit === null
      && receipt.missingAuthorityEvidence.operatorEventLog === null
      && receipt.missingAuthorityEvidence.naturalTraceCausalityProven === false,
    "TS006 diagnostic receipt invented missing authority evidence",
  );
  invariant(
    receipt.authorityBoundary.processId === PID
      && receipt.authorityBoundary.pidStartedBeforeQualifyingPrelaunchAuthorization
        === true
      && receipt.authorityBoundary.protectedPreexistingDiagnosticPid === true
      && receipt.authorityBoundary.retroactiveAuthorizationPermitted === false
      && receipt.authorityBoundary.runtimeAuthority === false
      && receipt.authorityBoundary.promotionEligible === false
      && receipt.authorityBoundary.strictEffect === "none"
      && receipt.authorityBoundary.strictCompletion.before === 0
      && receipt.authorityBoundary.strictCompletion.after === 0
      && receipt.authorityBoundary.strictCompletion.total === 40
      && receipt.authorityBoundary.lessonPublished === false,
    "TS006 diagnostic receipt crossed an authority or release boundary",
  );
  invariant(
    receipt.result.integrityVerified === true
      && receipt.result.disposition === "verified-diagnostic-only"
      && receipt.result.runtimeAuthority === false
      && receipt.result.promotionEligible === false
      && receipt.result.strictEffect === "none"
      && receipt.result.strictCompletion === "0/40",
    "TS006 diagnostic receipt result is not acceptance-neutral",
  );
  return receipt;
}

export function receiptFingerprint(receipt) {
  const projected = structuredClone(receipt);
  delete projected.receiptFingerprintSha256;
  return fingerprint(projected);
}

function renderMarkdown(receipt) {
  const [v5, v6] = receipt.captures;
  return `# G4 L3 TS006 live diagnostic capture receipt v13

This receipt re-verifies two ignored raw ScreenCaptureKit directories. It is an
acceptance-neutral diagnostic integrity record only.

## Bound runtime files

- Lesson Shell: \`${receipt.sourceBindings.hostShell.path}\`;
  \`${receipt.sourceBindings.hostShell.sha256}\`;
  ${receipt.sourceBindings.hostShell.bytes} bytes.
- Flash executable: \`${receipt.sourceBindings.flashExecutable.path}\`;
  \`${receipt.sourceBindings.flashExecutable.sha256}\`;
  ${receipt.sourceBindings.flashExecutable.bytes} bytes.
- Captured process: PID \`${receipt.authorityBoundary.processId}\`, retained by
  policy as a protected pre-existing diagnostic PID that cannot be
  retroactively authorized.

## v5 natural-forward diagnostic

- Manifest: \`${v5.manifest.sha256}\`;
  ${v5.frames.count}/${v5.frames.count} complete 800x600 frames at configured
  12 FPS; zero drops.
- Every PNG bytes/hash, regular non-symlink status, geometry, and alpha mask
  re-verified.
- First and last decoded RGB frames differ:
  ${v5.frames.firstLastRgbComparison.changedPixels} changed pixels; normalized
  RGB RMSE
  \`${v5.frames.firstLastRgbComparison.normalizedRgbRmse}\`.
- ALAC: \`${v5.audio.artifact.sha256}\`; decoded classification
  \`${v5.audio.decodedStream.classification}\`, with
  ${v5.audio.decodedStream.nonZeroSamples} non-zero signed 16-bit samples.
- The changed frames and non-zero audio do not prove a natural action trace,
  audio correctness, or listening acceptance.

## v6 answer-feedback diagnostic

- Manifest: \`${v6.manifest.sha256}\`;
  ${v6.frames.count}/${v6.frames.count} complete 800x600 frames at configured
  12 FPS; zero drops.
- Every RGB pixel in rows 0-562 is identical across all 360 frames. Only
  ${v6.instructionalState.allFrameDifferenceUnion.changedPixels} footer
  decoration pixels within rows
  ${v6.instructionalState.allFrameDifferenceUnion.bounds.minY}-${v6.instructionalState.allFrameDifferenceUnion.bounds.maxY}
  changed. Therefore this capture shows no visible answer selection or
  feedback transition.
- ALAC: \`${v6.audio.artifact.sha256}\`; decoded classification
  \`${v6.audio.decodedStream.classification}\` with zero non-zero samples.

## Authority boundary

- No network audit, signed session kit, or operator event log is bound.
- Runtime authority: **false**.
- Promotion eligible: **false**.
- Strict effect: **none**.
- Strict completion remains **0/40** and the lesson remains unpublished.

Receipt fingerprint:
\`${receipt.receiptFingerprintSha256}\`.
`;
}

export async function buildG4L3Ts006LiveDiagnosticCaptureReceiptV13() {
  const [
    generator,
    hostShell,
    flashExecutable,
    liveSessionConsumer,
    tools,
  ] = await Promise.all([
    readProjectRegular(
      portable(path.relative(ROOT, SCRIPT_PATH)),
      "receipt generator",
    ),
    readProjectRegular(HOST_SHELL, "staged Lesson Shell"),
    readRegularAbsolute(FLASH_EXECUTABLE, "Flash executable"),
    readProjectRegular(
      LIVE_SESSION_CONSUMER,
      "live-session fail-closed consumer",
    ),
    resolveAudioTools(),
  ]);
  assertPinned(hostShell, HOST_SHELL_PIN, "staged Lesson Shell");
  assertPinned(flashExecutable, FLASH_EXECUTABLE_PIN, "Flash executable");
  assertPinned(
    liveSessionConsumer,
    LIVE_SESSION_CONSUMER_PIN,
    "live-session fail-closed consumer",
  );
  invariant(
    liveSessionConsumer.contents.toString("utf8").includes(
      "PROTECTED_PREEXISTING_FLASH_PIDS = Object.freeze([97581])",
    ),
    "live-session consumer no longer protects diagnostic PID 97581",
  );

  const captures = [];
  for (const spec of CAPTURE_SPECS) {
    captures.push(await verifyCapture(spec, tools));
  }

  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-live-diagnostic-capture-receipt-v13",
    animationId: ANIMATION_ID,
    receiptScope: {
      captureDirectories: CAPTURE_SPECS.map(({directory}) => directory),
      rawDirectoriesIgnoredByGit: true,
      purpose:
        "Re-verify raw diagnostic capture integrity without promoting runtime "
        + "authority, trace causality, audio acceptance, strict completion, "
        + "or release state.",
    },
    generator: withoutContents(generator),
    sourceBindings: {
      hostShell: withoutContents(hostShell),
      flashExecutable: withoutContents(flashExecutable),
      liveSessionFailClosedConsumer: withoutContents(liveSessionConsumer),
      audioDecodeTools: tools.descriptors,
    },
    captures,
    missingAuthorityEvidence: {
      networkAudit: null,
      sessionKit: null,
      operatorEventLog: null,
      captureOperatorAttestation: null,
      prelaunchAuthorizationReceipt: null,
      naturalTraceCausalityProven: false,
      note:
        "Each raw capture root contains only capture-manifest.json, frames/, "
        + "and system-audio-lossless.m4a. No external authority artifact is "
        + "bound by this receipt.",
    },
    authorityBoundary: {
      processId: PID,
      pidStartedBeforeQualifyingPrelaunchAuthorization: true,
      protectedPreexistingDiagnosticPid: true,
      protectionSource:
        "scripts/lib/original-runtime-live-session-consumer.mjs",
      retroactiveAuthorizationPermitted: false,
      runtimeAuthority: false,
      promotionEligible: false,
      strictEffect: "none",
      humanVisualReviewCreated: false,
      ownerAcceptanceCreated: false,
      audioListeningAcceptanceCreated: false,
      strictCompletion: {
        before: 0,
        after: 0,
        total: 40,
      },
      lessonPublished: false,
    },
    result: {
      integrityVerified: true,
      disposition: "verified-diagnostic-only",
      runtimeAuthority: false,
      promotionEligible: false,
      strictEffect: "none",
      strictCompletion: "0/40",
    },
  };
  report.receiptFingerprintSha256 = receiptFingerprint(report);
  validateG4L3Ts006LiveDiagnosticCaptureReceiptV13(report);
  return {
    report,
    json: stableJson(report),
    markdown: renderMarkdown(report),
  };
}

async function writeAtomic(relativePath, contents) {
  const absolute = projectPath(relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  const temporary = `${absolute}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, contents, {flag: "wx"});
    await rename(temporary, absolute);
  } finally {
    await rm(temporary, {force: true});
  }
}

async function compareCheckedIn(relativePath, expected) {
  const actual = await readProjectRegular(relativePath, relativePath);
  invariant(
    actual.contents.equals(Buffer.from(expected)),
    `${relativePath} is stale; regenerate the diagnostic receipt`,
  );
}

export function parseArguments(argv) {
  const result = {check: false};
  for (const argument of argv) {
    if (argument === "--check") result.check = true;
    else if (argument === "--help" || argument === "-h") result.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/build-g4-l3-ts006-live-diagnostic-capture-"
      + "receipt-v13.mjs [--check]\n",
    );
    return;
  }
  const built = await buildG4L3Ts006LiveDiagnosticCaptureReceiptV13();
  if (options.check) {
    await Promise.all([
      compareCheckedIn(REPORT_JSON, built.json),
      compareCheckedIn(REPORT_MARKDOWN, built.markdown),
    ]);
    process.stdout.write(
      "PASS g4-l3-ts006-live-diagnostic-capture-receipt-v13: "
      + "839/839 frames, two ALAC files, diagnostic only, strict 0/40.\n",
    );
    return;
  }
  await Promise.all([
    writeAtomic(REPORT_JSON, built.json),
    writeAtomic(REPORT_MARKDOWN, built.markdown),
  ]);
  process.stdout.write(
    `WROTE ${REPORT_JSON}\nWROTE ${REPORT_MARKDOWN}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
