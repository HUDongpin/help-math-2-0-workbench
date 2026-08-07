#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, readFile, readdir, realpath, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

const SESSION_ID = "ts006-es-b8ba2818-cc71-4d20-84a8-4ae1ccda0b26";
const SESSION_ROOT = `artifacts/full-frame/g4-l3/${SESSION_ID}`;
const CAPTURE_DIRECTORY = `${SESSION_ROOT}/evidence/raw-captures/spanish-audio-control-es-002`;
const CAPTURE_MANIFEST = `${CAPTURE_DIRECTORY}/capture-manifest.json`;
const CAPTURE_AUDIO = `${CAPTURE_DIRECTORY}/system-audio-lossless.m4a`;
const PENDING_CANDIDATE = `${SESSION_ROOT}/evidence/pending-candidates/spanish-audio-control-es-002.pending-candidate.json`;
const CANONICAL_SOURCE_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3";
const STAGED_SOURCE_AUDIO =
  "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3";
const REPORT_JSON = "reports/g4-l3-ts006-spanish-audio-control-es-002-diagnostic.json";
const REPORT_MARKDOWN = "reports/g4-l3-ts006-spanish-audio-control-es-002-diagnostic.md";

const EXPECTED_CANDIDATE_SHA256 =
  "7c59ee39e8b82827c48107bf702630f5438c3626d44258c54477bb7da62b0f10";
const EXPECTED_CANDIDATE_FINGERPRINT_SHA256 =
  "c71577d01124ea515773153637701c8a190c782ab1254db2d85ecd97515aba2f";
const EXPECTED_MANIFEST_SHA256 =
  "9ea09d0c172da9571c3a2a1b8d1ff0c23e06165aae86225eb0ed81e776535304";
const EXPECTED_CAPTURE_AUDIO_SHA256 =
  "e4f07700a9bc48876aee780a54a9b8d46ae158d204b6aea809933a6c002f05c7";
const EXPECTED_SOURCE_AUDIO_SHA256 =
  "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688";
const EXPECTED_ORDERED_FRAME_SET_SHA256 =
  "32bd3a077379b7aab0c0b5f32bdc0cd1500fe3e454af20f0a7f09c5f6b43d5a3";
const EXPECTED_WINDOW_TITLE =
  "file:///Volumes/WestWorld/HELP MATH 2.0/work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf";
const EXPECTED_PROCESS_ID = 79108;
const EXPECTED_FRAME_COUNT = 539;
const NATIVE_WIDTH = 800;
const NATIVE_HEIGHT = 600;
const NOMINAL_FPS = 12;
const NOMINAL_FRAME_SECONDS = 1 / NOMINAL_FPS;
const CONTROL_CROP = "32x26+766+82";
const HASH = /^[a-f0-9]{64}$/u;
const PNG_SIGNATURE = "89504e470d0a1a0a";

const EXPECTED_CONTROL_RUNS = Object.freeze([
  Object.freeze({
    firstFrame: 1,
    lastFrame: 312,
    visualState: "non-pause-control-state",
    cropSignature: "5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701",
  }),
  Object.freeze({
    firstFrame: 313,
    lastFrame: 494,
    visualState: "pause-icon-visible",
    cropSignature: "361aeafcc964387d3db68abcd67f5bb289c52f1ee7c48d91892424e1769dec3c",
  }),
  Object.freeze({
    firstFrame: 495,
    lastFrame: 539,
    visualState: "non-pause-control-state",
    cropSignature: "5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701",
  }),
]);

const EXPECTED_SILENCE_INTERVALS = Object.freeze([
  Object.freeze({startSeconds: 0, endSeconds: 26.235125, durationSeconds: 26.235125}),
  Object.freeze({startSeconds: 31.435271, endSeconds: 32.274479, durationSeconds: 0.839208}),
  Object.freeze({startSeconds: 34.490521, endSeconds: 34.952979, durationSeconds: 0.462458}),
  Object.freeze({startSeconds: 41.41775, endSeconds: 45.14, durationSeconds: 3.72225}),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

function projectPath(relativePath) {
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  const relative = path.relative(PROJECT_ROOT, resolved);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes the project root: ${relativePath}`);
  return resolved;
}

async function readRegular(filePath, label) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  const bytes = await readFile(filePath);
  return {bytes, size: bytes.length, sha256: sha256(bytes)};
}

async function readJson(relativePath, label) {
  const artifact = await readRegular(projectPath(relativePath), label);
  return {...artifact, value: JSON.parse(artifact.bytes.toString("utf8"))};
}

export function inspectPngHeader(bytes, label = "PNG") {
  invariant(bytes.length >= 24, `${label} is too small to be a PNG`);
  invariant(bytes.subarray(0, 8).toString("hex") === PNG_SIGNATURE, `${label} has an invalid PNG signature`);
  invariant(bytes.subarray(12, 16).toString("ascii") === "IHDR", `${label} does not begin with an IHDR chunk`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

export function validatePendingCandidate(candidate) {
  invariant(candidate?.schemaVersion === 1
    && candidate.evidenceType === "g4-l3-ts006-screen-capture-kit-pending-natural-trace-candidate"
    && candidate.status === "pending-candidate-unresolved-trace-specifications"
    && candidate.animationId === "course-g04-l03-ts-006"
    && candidate.sessionId === SESSION_ID
    && candidate.language === "es",
  "supplemental Spanish-audio candidate identity or pending status drifted");
  invariant(candidate.promotionEligible === false && candidate.acceptanceEffect === "none",
    "supplemental Spanish-audio candidate must remain promotion-ineligible and acceptance-neutral");
  invariant(candidate.candidateFingerprintSha256 === EXPECTED_CANDIDATE_FINGERPRINT_SHA256,
    "supplemental Spanish-audio candidate fingerprint drifted");
  invariant(candidate.capture?.directory === CAPTURE_DIRECTORY
    && candidate.capture?.manifest?.path === CAPTURE_MANIFEST
    && candidate.capture?.manifest?.sha256 === EXPECTED_MANIFEST_SHA256,
  "supplemental Spanish-audio candidate capture binding drifted");
  invariant(candidate.capture?.audio?.file?.path === CAPTURE_AUDIO
    && candidate.capture?.audio?.file?.sha256 === EXPECTED_CAPTURE_AUDIO_SHA256
    && candidate.capture?.audio?.causalAttributionEstablished === false
    && candidate.capture?.audio?.spokenLanguageIdentityEstablished === false
    && candidate.capture?.audio?.listeningAcceptanceEstablished === false,
  "supplemental Spanish-audio candidate audio boundary drifted");
  invariant(candidate.process?.pid === EXPECTED_PROCESS_ID
    && candidate.process?.cleanExit === true
    && candidate.process?.exactPidScreenCaptureKitBindingVerified === true,
  "supplemental Spanish-audio candidate process binding drifted");
  invariant(candidate.authority?.naturalTraceExecutionEstablished === false
    && candidate.authority?.authoritativeOriginalRuntimeTrace === false
    && candidate.authority?.authoritativeBaseline === false
    && candidate.authority?.audioAccepted === false
    && candidate.authority?.humanVisualAccepted === false
    && candidate.authority?.ownerAccepted === false
    && candidate.authority?.strictMigrationComplete === false
    && candidate.authority?.publicRelease === false,
  "supplemental Spanish-audio candidate authority was promoted");
  invariant(candidate.acceptance?.acceptanceNeutral === true
    && candidate.acceptance?.authoritativeOriginalRuntimeTrace === false
    && candidate.acceptance?.baselineAccepted === false
    && candidate.acceptance?.audioAccepted === false
    && candidate.acceptance?.humanVisualAccepted === false
    && candidate.acceptance?.ownerAccepted === false
    && candidate.acceptance?.strictMigrationComplete === false
    && candidate.acceptance?.publicRelease === false,
  "supplemental Spanish-audio candidate acceptance boundary was promoted");
  invariant(candidate.unresolvedGates?.includes("no-hash-chained-operation-event-log")
    && candidate.unresolvedGates?.includes("no-natural-trace-execution-report")
    && candidate.unresolvedGates?.includes("no-causal-audio-trigger-or-listening-acceptance"),
  "supplemental Spanish-audio candidate no longer records its required unresolved gates");
  return true;
}

export function validateCaptureManifest(manifest, candidate) {
  invariant(manifest?.schemaVersion === 1
    && manifest.evidenceType === "g4-l3-lossless-window-frame-and-system-audio-capture"
    && manifest.status === "raw-capture-not-yet-bound-to-runtime-trace"
    && manifest.runtimeAuthorityClaimed === false
    && manifest.acceptanceEffect === "none",
  "supplemental capture authority boundary drifted");
  invariant(manifest.configuration?.fps === "12"
    && manifest.configuration?.sourceKind === "waited-first-window-exact-pid"
    && manifest.configuration?.cursor === "excluded"
    && manifest.configuration?.sourceRect === "0.0,28.0,800.0,600.0"
    && manifest.configuration?.outputWidth === "800"
    && manifest.configuration?.outputHeight === "600"
    && manifest.configuration?.audio === "system-audio-48kHz-2ch-ALAC",
  "supplemental capture configuration drifted");
  invariant(manifest.window?.ownerName === "Flash Player"
    && manifest.window?.title === EXPECTED_WINDOW_TITLE
    && manifest.window?.frameWidth === 800
    && manifest.window?.frameHeight === 628,
  "supplemental capture Flash Player window binding drifted");
  invariant(manifest.display?.includedApplicationName === "Flash Player"
    && manifest.display?.includedProcessID === EXPECTED_PROCESS_ID
    && manifest.display?.includedProcessID === candidate.process.pid,
  "supplemental capture exact-PID binding drifted");
  invariant(manifest.droppedOrIncompleteFrameCount === 0
    && Array.isArray(manifest.frames)
    && manifest.frames.length === EXPECTED_FRAME_COUNT,
  `supplemental capture must contain ${EXPECTED_FRAME_COUNT} complete frames with zero drops`);
  invariant(manifest.audio?.codec === "Apple Lossless Audio Codec"
    && manifest.audio?.sampleRate === 48000
    && manifest.audio?.channels === 2
    && manifest.audio?.outputFile === "system-audio-lossless.m4a"
    && manifest.audio?.outputSha256 === EXPECTED_CAPTURE_AUDIO_SHA256
    && manifest.audio?.inputContainsNonZeroAudio === true
    && manifest.audio?.inputNonZeroBytes === 5313158
    && manifest.audio?.inputPayloadBytes === 17333760,
  "supplemental capture lossless system-audio descriptor drifted");
  return true;
}

async function mapConcurrent(values, limit, operation) {
  const results = new Array(values.length);
  let next = 0;
  const workers = Array.from({length: Math.min(limit, values.length)}, async () => {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await operation(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function verifyFrames(manifest) {
  const captureRoot = projectPath(CAPTURE_DIRECTORY);
  const frameRoot = path.join(captureRoot, "frames");
  const actualNames = (await readdir(frameRoot)).sort();
  invariant(actualNames.length === EXPECTED_FRAME_COUNT,
    `frame directory contains ${actualNames.length} entries instead of ${EXPECTED_FRAME_COUNT}`);
  const verified = await mapConcurrent(manifest.frames, 8, async (frame, index) => {
    const ordinal = index + 1;
    const expectedFile = `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
    invariant(frame.ordinal === ordinal && frame.file === expectedFile && frame.status === "complete",
      `frame ${ordinal} descriptor identity drifted`);
    invariant(frame.width === NATIVE_WIDTH && frame.height === NATIVE_HEIGHT,
      `frame ${ordinal} descriptor dimensions drifted`);
    invariant(HASH.test(frame.sha256), `frame ${ordinal} descriptor SHA-256 is malformed`);
    invariant(actualNames[index] === path.basename(expectedFile), `frame ${ordinal} file sequence drifted`);
    const artifact = await readRegular(path.join(captureRoot, expectedFile), `frame ${ordinal}`);
    invariant(artifact.size === frame.bytes, `frame ${ordinal} byte count drifted`);
    invariant(artifact.sha256 === frame.sha256, `frame ${ordinal} SHA-256 drifted`);
    const dimensions = inspectPngHeader(artifact.bytes, `frame ${ordinal}`);
    invariant(dimensions.width === NATIVE_WIDTH && dimensions.height === NATIVE_HEIGHT,
      `frame ${ordinal} PNG dimensions drifted`);
    return {ordinal, file: expectedFile, bytes: artifact.size, sha256: artifact.sha256,
      width: dimensions.width, height: dimensions.height};
  });
  const totalPngBytes = verified.reduce((sum, frame) => sum + frame.bytes, 0);
  const orderedFrameSetSha256 = sha256(Buffer.from(verified.map((frame) =>
    `${frame.ordinal}\u0000${frame.file}\u0000${frame.sha256}\n`).join("")));
  invariant(totalPngBytes === 59695123, "supplemental capture total PNG bytes drifted");
  invariant(orderedFrameSetSha256 === EXPECTED_ORDERED_FRAME_SET_SHA256,
    "supplemental capture ordered frame-set SHA-256 drifted");
  return {verified, totalPngBytes, orderedFrameSetSha256};
}

export function groupControlSignatures(signatures) {
  const runs = [];
  signatures.forEach((cropSignature, index) => {
    const ordinal = index + 1;
    const current = runs.at(-1);
    if (current?.cropSignature === cropSignature) current.lastFrame = ordinal;
    else runs.push({firstFrame: ordinal, lastFrame: ordinal, cropSignature});
  });
  return runs;
}

export function validateControlRuns(runs) {
  invariant(runs.length === EXPECTED_CONTROL_RUNS.length,
    "Spanish-audio control crop must contain exactly three observed visual runs");
  return runs.map((run, index) => {
    const expected = EXPECTED_CONTROL_RUNS[index];
    invariant(run.firstFrame === expected.firstFrame
      && run.lastFrame === expected.lastFrame
      && run.cropSignature === expected.cropSignature,
    `Spanish-audio control visual run ${index + 1} drifted`);
    return {...expected};
  });
}

async function resolveTool(command) {
  const {stdout} = await execFile("/usr/bin/which", [command]);
  const commandPath = stdout.trim();
  invariant(path.isAbsolute(commandPath), `cannot resolve ${command}`);
  const executableRealPath = await realpath(commandPath);
  const executable = await readRegular(executableRealPath, `${command} executable`);
  const version = await execFile(commandPath, ["-version"], {maxBuffer: 8 * 1024 * 1024});
  return {
    command,
    commandPath,
    executableRealPath,
    executableSha256: executable.sha256,
    versionFirstLine: `${version.stdout}${version.stderr}`.split(/\r?\n/u)[0],
  };
}

async function captureControlRuns(manifest, magickPath) {
  const signatures = [];
  for (let offset = 0; offset < manifest.frames.length; offset += 160) {
    const batch = manifest.frames.slice(offset, offset + 160);
    const args = [
      ...batch.map((frame) => projectPath(`${CAPTURE_DIRECTORY}/${frame.file}`)),
      "-crop", CONTROL_CROP,
      "+repage",
      "-format", "%#\\n",
      "info:",
    ];
    const {stdout} = await execFile(magickPath, args, {maxBuffer: 16 * 1024 * 1024});
    const batchSignatures = stdout.trim().split(/\r?\n/u).filter(Boolean);
    invariant(batchSignatures.length === batch.length,
      `ImageMagick returned ${batchSignatures.length} signatures for ${batch.length} frames`);
    signatures.push(...batchSignatures);
  }
  return validateControlRuns(groupControlSignatures(signatures));
}

export function parseAudioAnalysis(stderr) {
  const mean = stderr.match(/mean_volume:\s*(-?[\d.]+) dB/u);
  const maximum = stderr.match(/max_volume:\s*(-?[\d.]+) dB/u);
  invariant(mean && maximum, "ffmpeg volume output is incomplete");
  const intervals = [];
  let pendingStart = null;
  for (const line of stderr.split(/\r?\n/u)) {
    const start = line.match(/silence_start:\s*([\d.]+)/u);
    if (start) {
      invariant(pendingStart === null, "ffmpeg silence intervals overlap or are malformed");
      pendingStart = Number(start[1]);
    }
    const end = line.match(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/u);
    if (end) {
      invariant(pendingStart !== null, "ffmpeg silence end has no matching start");
      intervals.push({startSeconds: pendingStart, endSeconds: Number(end[1]), durationSeconds: Number(end[2])});
      pendingStart = null;
    }
  }
  invariant(pendingStart === null && intervals.length > 0, "ffmpeg silence output is incomplete");
  return {meanVolumeDb: Number(mean[1]), maxVolumeDb: Number(maximum[1]), silenceIntervals: intervals};
}

function approximatelyEqual(left, right, tolerance = 1e-6) {
  return Math.abs(left - right) <= tolerance;
}

export function validateCaptureAudioAnalysis(analysis) {
  invariant(analysis.meanVolumeDb === -26 && analysis.maxVolumeDb === -5.2,
    "captured session audio volume profile drifted");
  invariant(analysis.silenceIntervals.length === EXPECTED_SILENCE_INTERVALS.length,
    "captured session audio silence interval count drifted");
  analysis.silenceIntervals.forEach((interval, index) => {
    const expected = EXPECTED_SILENCE_INTERVALS[index];
    invariant(approximatelyEqual(interval.startSeconds, expected.startSeconds)
      && approximatelyEqual(interval.endSeconds, expected.endSeconds)
      && approximatelyEqual(interval.durationSeconds, expected.durationSeconds),
    `captured session audio silence interval ${index + 1} drifted`);
  });
  return true;
}

async function probeAudio(relativePath, ffprobePath, ffmpegPath) {
  const absolutePath = projectPath(relativePath);
  const artifact = await readRegular(absolutePath, relativePath);
  const {stdout} = await execFile(ffprobePath, [
    "-v", "error",
    "-show_entries", "stream=index,codec_name,codec_long_name,codec_type,sample_rate,channels,channel_layout,duration:format=format_name,duration,size",
    "-of", "json",
    absolutePath,
  ], {maxBuffer: 8 * 1024 * 1024});
  const payload = JSON.parse(stdout);
  const streams = (payload.streams ?? []).filter((stream) => stream.codec_type === "audio");
  invariant(streams.length === 1, `expected one audio stream in ${relativePath}`);
  const volume = await execFile(ffmpegPath, [
    "-hide_banner", "-nostats", "-i", absolutePath,
    "-af", "volumedetect,silencedetect=noise=-80dB:d=0.1",
    "-f", "null", "-",
  ], {maxBuffer: 16 * 1024 * 1024});
  const stream = streams[0];
  return {
    path: relativePath,
    bytes: artifact.size,
    sha256: artifact.sha256,
    codecName: stream.codec_name,
    codecLongName: stream.codec_long_name,
    sampleRate: Number(stream.sample_rate),
    channels: Number(stream.channels),
    channelLayout: stream.channel_layout,
    durationSeconds: Number(stream.duration ?? payload.format?.duration),
    containerFormat: payload.format?.format_name,
    ...parseAudioAnalysis(volume.stderr),
  };
}

export function computeTemporalAssociation({manifest, controlRuns, captureAudioAnalysis}) {
  const pauseRun = controlRuns.find((run) => run.visualState === "pause-icon-visible");
  invariant(pauseRun, "pause-icon visual run is missing");
  const firstPauseFrame = manifest.frames[pauseRun.firstFrame - 1];
  const lastPauseFrame = manifest.frames[pauseRun.lastFrame - 1];
  const audioPtsOriginOffsetSeconds = manifest.audio.firstPresentationTimeSeconds
    - manifest.frames[0].presentationTimeSeconds;
  const firstOuterSilence = captureAudioAnalysis.silenceIntervals[0];
  const finalOuterSilence = captureAudioAnalysis.silenceIntervals.at(-1);
  const nonSilenceEnvelopeStartAudioSeconds = firstOuterSilence.endSeconds;
  const nonSilenceEnvelopeEndAudioSeconds = finalOuterSilence.startSeconds;
  const nonSilenceEnvelopeStartVideoSeconds = nonSilenceEnvelopeStartAudioSeconds + audioPtsOriginOffsetSeconds;
  const nonSilenceEnvelopeEndVideoSeconds = nonSilenceEnvelopeEndAudioSeconds + audioPtsOriginOffsetSeconds;
  const startBoundaryOffsetFromFirstPauseFrameSeconds =
    nonSilenceEnvelopeStartVideoSeconds - firstPauseFrame.relativeTimeSeconds;
  const endBoundaryOffsetFromLastPauseFrameSeconds =
    nonSilenceEnvelopeEndVideoSeconds - lastPauseFrame.relativeTimeSeconds;
  const temporalAssociationObserved =
    Math.abs(startBoundaryOffsetFromFirstPauseFrameSeconds) <= NOMINAL_FRAME_SECONDS
    && Math.abs(endBoundaryOffsetFromLastPauseFrameSeconds) <= NOMINAL_FRAME_SECONDS;
  return {
    ptsMapping: {
      audioFirstPresentationTimeSeconds: manifest.audio.firstPresentationTimeSeconds,
      firstVideoFramePresentationTimeSeconds: manifest.frames[0].presentationTimeSeconds,
      audioPtsOriginOffsetSeconds,
    },
    controlPauseVisualInterval: {
      firstFrame: pauseRun.firstFrame,
      lastFrame: pauseRun.lastFrame,
      firstRelativeTimeSeconds: firstPauseFrame.relativeTimeSeconds,
      lastRelativeTimeSeconds: lastPauseFrame.relativeTimeSeconds,
    },
    nonSilenceEnvelope: {
      firstAudioRelativeSeconds: nonSilenceEnvelopeStartAudioSeconds,
      lastAudioRelativeSeconds: nonSilenceEnvelopeEndAudioSeconds,
      firstVideoRelativeSeconds: nonSilenceEnvelopeStartVideoSeconds,
      lastVideoRelativeSeconds: nonSilenceEnvelopeEndVideoSeconds,
    },
    nominalFrameToleranceSeconds: NOMINAL_FRAME_SECONDS,
    startBoundaryOffsetFromFirstPauseFrameSeconds,
    endBoundaryOffsetFromLastPauseFrameSeconds,
    temporalAssociationObserved,
    eventTriggerLogPresent: false,
    sourceMediaRequestLogPresent: false,
    causalAttributionEstablished: false,
    sourceMediaMatchEstablished: false,
    interpretation:
      "After mapping the audio PTS origin to video-relative time, the outer non-silent envelope begins and ends within one requested 12 FPS frame of the observed pause-icon interval. This is temporal association only; no hash-chained click/event log, media-request proof, isolated application-audio attribution, source waveform match, or listening record exists.",
  };
}

function renderMarkdown(report) {
  const runs = report.runtimeControl.visualRuns.map((run) =>
    `| ${run.firstFrame}-${run.lastFrame} | ${run.firstRelativeTimeSeconds.toFixed(6)}-${run.lastRelativeTimeSeconds.toFixed(6)} | ${run.visualState} | \`${run.cropSignature}\` |`).join("\n");
  const silences = report.capture.audio.machineAnalysis.silenceIntervals.map((interval, index) =>
    `| ${index + 1} | ${interval.startSeconds.toFixed(6)} | ${interval.endSeconds.toFixed(6)} | ${interval.durationSeconds.toFixed(6)} |`).join("\n");
  const association = report.temporalAssociation;
  return `# G4 L3 TS006 Spanish audio-control supplemental diagnostic\n\n`
    + `Status: **verified pending-candidate diagnostic; no acceptance effect**.\n\n`
    + `This deterministic report binds and revalidates the supplemental Flash Player capture \`spanish-audio-control-es-002\`. It records a machine-observed timing association between a control-state change and non-silent system audio. It does not establish a click-to-audio causal chain, a match to L3TS06.mp3, Spanish spoken content, listening acceptance, visual review, Owner acceptance, strict completion, or publication.\n\n`
    + `## Bound evidence\n\n`
    + `- Pending candidate SHA-256: \`${report.inputs.pendingCandidate.sha256}\`\n`
    + `- Capture manifest SHA-256: \`${report.capture.manifest.sha256}\`\n`
    + `- Ordered 539-frame set SHA-256: \`${report.capture.frames.orderedFrameSetSha256}\`\n`
    + `- Lossless session audio SHA-256: \`${report.capture.audio.sha256}\`\n`
    + `- Canonical and staged L3TS06.mp3 SHA-256: \`${report.sourceAudio.canonical.sha256}\`\n`
    + `- Complete PNG verification: ${report.capture.frames.verifiedCount}/${report.capture.frames.expectedCount}, ${report.capture.frames.width}×${report.capture.frames.height}, dropped/incomplete ${report.capture.frames.droppedOrIncompleteFrameCount}\n`
    + `- Requested FPS: ${report.capture.frames.requestedFps}; effective FPS: ${report.capture.frames.effectiveFps.toFixed(9)}\n`
    + `- Session audio: ${report.capture.audio.ffprobe.durationSeconds.toFixed(6)} seconds, ALAC 48 kHz stereo, mean/max ${report.capture.audio.machineAnalysis.meanVolumeDb.toFixed(1)} / ${report.capture.audio.machineAnalysis.maxVolumeDb.toFixed(1)} dB\n\n`
    + `## Control crop\n\n`
    + `The crop \`${report.runtimeControl.crop}\` contains exactly three deterministic pixel-signature runs. State names are deliberately limited to what the pixels show.\n\n`
    + `| Frames | Video-relative seconds | Observed visual state | Crop signature |\n|---:|---:|---|---|\n${runs}\n\n`
    + `## Audio silence intervals\n\n`
    + `| # | Start (audio s) | End (audio s) | Duration (s) |\n|---:|---:|---:|---:|\n${silences}\n\n`
    + `## PTS association\n\n`
    + `- Audio-to-video PTS-origin offset: ${association.ptsMapping.audioPtsOriginOffsetSeconds.toFixed(9)} seconds\n`
    + `- Pause visual interval: frames ${association.controlPauseVisualInterval.firstFrame}-${association.controlPauseVisualInterval.lastFrame}, ${association.controlPauseVisualInterval.firstRelativeTimeSeconds.toFixed(9)}-${association.controlPauseVisualInterval.lastRelativeTimeSeconds.toFixed(9)} video-relative seconds\n`
    + `- Outer non-silent envelope after PTS mapping: ${association.nonSilenceEnvelope.firstVideoRelativeSeconds.toFixed(9)}-${association.nonSilenceEnvelope.lastVideoRelativeSeconds.toFixed(9)} video-relative seconds\n`
    + `- Start offset from first pause frame: ${(association.startBoundaryOffsetFromFirstPauseFrameSeconds * 1000).toFixed(6)} ms\n`
    + `- End offset from last pause frame: ${(association.endBoundaryOffsetFromLastPauseFrameSeconds * 1000).toFixed(6)} ms\n`
    + `- Both offsets are within one nominal 12 FPS frame (${(association.nominalFrameToleranceSeconds * 1000).toFixed(6)} ms): ${association.temporalAssociationObserved}\n\n`
    + `## Fail-closed conclusion\n\n`
    + `- Hash-chained trigger/event log present: **false**\n`
    + `- Temporal association observed: **true**\n`
    + `- Causal attribution established: **false**\n`
    + `- Flash runtime audio emission established: **false**\n`
    + `- Source-media match established: **false**\n`
    + `- Spanish spoken-language identity established: **false**\n`
    + `- Named-human original-runtime listening accepted: **false**\n`
    + `- Independent human visual review accepted: **false**\n`
    + `- Owner accepted: **false**\n`
    + `- Audio accepted: **false**\n`
    + `- Strict migration complete: **false**\n`
    + `- Strict acceptance effect: **none**\n\n`
    + `${association.interpretation}\n`;
}

export async function buildDiagnosticReport() {
  const [candidateArtifact, manifestArtifact, scriptArtifact, tools] = await Promise.all([
    readJson(PENDING_CANDIDATE, "pending candidate"),
    readJson(CAPTURE_MANIFEST, "capture manifest"),
    readRegular(SCRIPT_PATH, "diagnostic analyzer"),
    Promise.all([resolveTool("magick"), resolveTool("ffprobe"), resolveTool("ffmpeg")]),
  ]);
  invariant(candidateArtifact.sha256 === EXPECTED_CANDIDATE_SHA256,
    "supplemental Spanish-audio pending-candidate SHA-256 drifted");
  invariant(manifestArtifact.sha256 === EXPECTED_MANIFEST_SHA256,
    "supplemental Spanish-audio capture-manifest SHA-256 drifted");
  validatePendingCandidate(candidateArtifact.value);
  validateCaptureManifest(manifestArtifact.value, candidateArtifact.value);
  const manifest = manifestArtifact.value;
  const [magickTool, ffprobeTool, ffmpegTool] = tools;

  const [{verified, totalPngBytes, orderedFrameSetSha256}, controlRuns, captureAudio, canonicalSource, stagedSource] =
    await Promise.all([
      verifyFrames(manifest),
      captureControlRuns(manifest, magickTool.commandPath),
      probeAudio(CAPTURE_AUDIO, ffprobeTool.commandPath, ffmpegTool.commandPath),
      probeAudio(CANONICAL_SOURCE_AUDIO, ffprobeTool.commandPath, ffmpegTool.commandPath),
      readRegular(projectPath(STAGED_SOURCE_AUDIO), "staged source MP3"),
    ]);

  invariant(captureAudio.sha256 === EXPECTED_CAPTURE_AUDIO_SHA256
    && captureAudio.bytes === manifest.audio.outputBytes
    && captureAudio.codecName === "alac"
    && captureAudio.sampleRate === 48000
    && captureAudio.channels === 2
    && approximatelyEqual(captureAudio.durationSeconds, 45.141333),
  "supplemental capture audio bytes or technical probe drifted");
  validateCaptureAudioAnalysis(captureAudio);
  invariant(canonicalSource.sha256 === EXPECTED_SOURCE_AUDIO_SHA256
    && canonicalSource.codecName === "mp3"
    && canonicalSource.sampleRate === 48000
    && canonicalSource.channels === 1
    && approximatelyEqual(canonicalSource.durationSeconds, 7.632)
    && canonicalSource.meanVolumeDb === -21
    && canonicalSource.maxVolumeDb === -4.7,
  "canonical L3TS06.mp3 bytes or technical probe drifted");
  invariant(stagedSource.sha256 === canonicalSource.sha256 && stagedSource.size === canonicalSource.bytes,
    "staged L3TS06.mp3 is not byte-identical to the canonical source");

  const visualRuns = controlRuns.map((run) => ({
    ...run,
    firstRelativeTimeSeconds: manifest.frames[run.firstFrame - 1].relativeTimeSeconds,
    lastRelativeTimeSeconds: manifest.frames[run.lastFrame - 1].relativeTimeSeconds,
  }));
  const temporalAssociation = computeTemporalAssociation({
    manifest,
    controlRuns,
    captureAudioAnalysis: captureAudio,
  });
  invariant(temporalAssociation.temporalAssociationObserved === true,
    "supplemental capture no longer has the recorded within-one-frame temporal association");

  const durationSeconds = manifest.frames.at(-1).relativeTimeSeconds - manifest.frames[0].relativeTimeSeconds;
  const effectiveFps = (manifest.frames.length - 1) / durationSeconds;
  invariant(approximatelyEqual(effectiveFps, 11.908437342286353, 1e-12),
    "supplemental capture effective FPS drifted");

  return {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-spanish-audio-control-es-002-diagnostic",
    status: "verified-pending-candidate-diagnostic-no-acceptance-effect",
    animationId: "course-g04-l03-ts-006",
    sessionId: SESSION_ID,
    language: "es",
    inputs: {
      pendingCandidate: {
        path: PENDING_CANDIDATE,
        bytes: candidateArtifact.size,
        sha256: candidateArtifact.sha256,
        status: candidateArtifact.value.status,
        candidateFingerprintSha256: candidateArtifact.value.candidateFingerprintSha256,
      },
      generator: {path: portable(SCRIPT_PATH), bytes: scriptArtifact.size, sha256: scriptArtifact.sha256},
    },
    capture: {
      manifest: {path: CAPTURE_MANIFEST, bytes: manifestArtifact.size, sha256: manifestArtifact.sha256},
      startedAt: manifest.startedAt,
      endedAt: manifest.endedAt,
      processId: manifest.display.includedProcessID,
      window: manifest.window,
      configuration: manifest.configuration,
      frames: {
        expectedCount: EXPECTED_FRAME_COUNT,
        verifiedCount: verified.length,
        allManifestBytesAndHashesRevalidated: true,
        allPngHeadersRevalidated: true,
        width: NATIVE_WIDTH,
        height: NATIVE_HEIGHT,
        totalPngBytes,
        first: verified[0],
        last: verified.at(-1),
        requestedFps: NOMINAL_FPS,
        durationSeconds,
        effectiveFps,
        droppedOrIncompleteFrameCount: manifest.droppedOrIncompleteFrameCount,
        orderedFrameSetAlgorithm: "ordinal-null-path-null-sha256-newline-v1",
        orderedFrameSetSha256,
      },
      audio: {
        path: captureAudio.path,
        bytes: captureAudio.bytes,
        sha256: captureAudio.sha256,
        ffprobe: {
          codecName: captureAudio.codecName,
          codecLongName: captureAudio.codecLongName,
          sampleRate: captureAudio.sampleRate,
          channels: captureAudio.channels,
          channelLayout: captureAudio.channelLayout,
          durationSeconds: captureAudio.durationSeconds,
          containerFormat: captureAudio.containerFormat,
        },
        captureToolInputAudit: {
          inputPayloadBytes: manifest.audio.inputPayloadBytes,
          inputNonZeroBytes: manifest.audio.inputNonZeroBytes,
          inputContainsNonZeroAudio: manifest.audio.inputContainsNonZeroAudio,
        },
        machineAnalysis: {
          threshold: "silencedetect=noise=-80dB:d=0.1",
          meanVolumeDb: captureAudio.meanVolumeDb,
          maxVolumeDb: captureAudio.maxVolumeDb,
          silenceIntervals: captureAudio.silenceIntervals,
        },
      },
    },
    runtimeControl: {
      crop: CONTROL_CROP,
      visualRuns,
      pauseIconObserved: true,
      stateClaimBoundary:
        "The crop signatures establish only the observed pixels and their frame ranges; they do not establish which user event caused the state or whether source audio was loaded, decoded, or emitted.",
    },
    sourceAudio: {
      canonical: {
        path: canonicalSource.path,
        bytes: canonicalSource.bytes,
        sha256: canonicalSource.sha256,
        codecName: canonicalSource.codecName,
        sampleRate: canonicalSource.sampleRate,
        channels: canonicalSource.channels,
        durationSeconds: canonicalSource.durationSeconds,
        meanVolumeDb: canonicalSource.meanVolumeDb,
        maxVolumeDb: canonicalSource.maxVolumeDb,
      },
      stagedHostCopy: {path: STAGED_SOURCE_AUDIO, bytes: stagedSource.size, sha256: stagedSource.sha256},
      stagedCopyByteIdenticalToCanonical: true,
      sourceMediaMatchEstablished: false,
      matchBoundary:
        "Byte identity between the canonical and staged MP3 proves only source-copy identity. No hash-chained runtime media-request record, isolated application-audio capture, decoded-sample alignment, or named-human listening record binds the system-audio waveform to this MP3.",
    },
    temporalAssociation,
    machineFindings: {
      pendingCandidateBytesRevalidated: true,
      captureManifestBytesRevalidated: true,
      all539PngBytesHashesAndDimensionsRevalidated: true,
      exactPidWindowAndNativeCropRevalidated: true,
      losslessAlacBytesAndTechnicalPropertiesRevalidated: true,
      nonSilentSystemAudioObserved: true,
      threeControlCropRunsObserved: true,
      temporalAssociationObserved: true,
    },
    authority: {
      classification: "machine-integrity-and-temporal-association-only",
      eventTriggerLogPresent: false,
      naturalTraceExecutionEstablished: false,
      authoritativeOriginalRuntimeTrace: false,
      authoritativeBaseline: false,
      causalAttributionEstablished: false,
      runtimeAudioEmissionEstablished: false,
      sourceMediaMatchEstablished: false,
      spanishSpokenLanguageIdentityEstablished: false,
      namedHumanOriginalRuntimeListeningAccepted: false,
      independentHumanVisualReviewAccepted: false,
      ownerAccepted: false,
      audioAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
      promotionEligible: false,
      acceptanceEffect: "none",
      completionLedgerEffect: "none",
      lessonReleaseLedgerEffect: "none",
    },
    unresolved: [
      "No hash-chained operation-event log records the control activation.",
      "System audio is not isolated to Flash Player and is not matched to the source MP3.",
      "Spanish spoken-language identity and cue correctness have not been established.",
      "No named-human original-runtime listening acceptance exists.",
      "Natural-trace execution, independent visual review, Owner acceptance, strict completion, and publication remain closed.",
    ],
    tools: {magick: magickTool, ffprobe: ffprobeTool, ffmpeg: ffmpegTool},
    strictAcceptanceEffect: "none",
  };
}

async function writeOrCheck(report, check) {
  const jsonPath = projectPath(REPORT_JSON);
  const markdownPath = projectPath(REPORT_MARKDOWN);
  const desired = [[jsonPath, pretty(report)], [markdownPath, renderMarkdown(report)]];
  if (check) {
    for (const [destination, contents] of desired) {
      const artifact = await readRegular(destination, portable(destination));
      invariant(artifact.bytes.equals(Buffer.from(contents)), `${portable(destination)} is stale`);
    }
    return;
  }
  for (const [destination, contents] of desired) {
    try {
      const metadata = await lstat(destination);
      invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${portable(destination)} must be a regular non-symlink file`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const temporary = `${destination}.tmp-${process.pid}`;
    await writeFile(temporary, contents, {flag: "wx"});
    await rename(temporary, destination);
  }
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/analyze-g4-l3-ts006-spanish-audio-control-capture.mjs [--check]",
    "",
    "Revalidates the fixed TS006 supplemental Spanish audio-control pending candidate,",
    "all 539 PNGs, lossless session audio, control crop, source MP3, and PTS association.",
    "The report is acceptance-neutral and never writes migration, coverage, or ledger state.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${help()}\n`);
    return;
  }
  const report = await buildDiagnosticReport();
  await writeOrCheck(report, options.check);
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${REPORT_JSON}\n`);
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${REPORT_MARKDOWN}\n`);
  process.stdout.write(`Verified frames: ${report.capture.frames.verifiedCount}/${report.capture.frames.expectedCount}; temporal association: ${report.temporalAssociation.temporalAssociationObserved}; causality: false; source match: false; strict effect: none.\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
