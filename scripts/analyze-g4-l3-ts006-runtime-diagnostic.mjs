#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, realpath, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ARTIFACT_ROOT = path.join(PROJECT_ROOT, "artifacts/full-frame/g4-l3");
const EXPECTED_SOURCE_SUFFIX = "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf";
const EXPECTED_SOURCE_SHA256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const EXPECTED_WINDOW_TITLE = `file://${path.join(PROJECT_ROOT, EXPECTED_SOURCE_SUFFIX)}`;
const CAPTURE_RELATIVE = "evidence/raw-captures/natural-shell-continuation-2026-07-26T04-47-47Z";
const REPORT_JSON_RELATIVE = "evidence/derived/diagnostic-integrity-report.json";
const REPORT_MD_RELATIVE = "evidence/derived/diagnostic-integrity-report.md";
const HASH = /^[a-f0-9]{64}$/u;
const PNG_SIGNATURE = "89504e470d0a1a0a";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(filePath, root = PROJECT_ROOT) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function within(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function readRegular(filePath, label) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  const bytes = await readFile(filePath);
  return {bytes, size: bytes.length, sha256: sha256(bytes)};
}

export function inspectPngHeader(bytes, label = "PNG") {
  invariant(bytes.length >= 24, `${label} is too small to be a PNG`);
  invariant(bytes.subarray(0, 8).toString("hex") === PNG_SIGNATURE, `${label} has an invalid PNG signature`);
  invariant(bytes.subarray(12, 16).toString("ascii") === "IHDR", `${label} does not begin with an IHDR chunk`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function percentile(sorted, probability) {
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * probability) - 1));
  return sorted[index];
}

export function summarizeFrameTiming(frames) {
  invariant(Array.isArray(frames) && frames.length >= 2, "capture must contain at least two frames");
  const intervals = [];
  for (let index = 1; index < frames.length; index += 1) {
    const delta = frames[index].relativeTimeSeconds - frames[index - 1].relativeTimeSeconds;
    invariant(Number.isFinite(delta) && delta > 0, `frame ${index + 1} time must increase monotonically`);
    intervals.push(delta);
  }
  const ordered = [...intervals].sort((left, right) => left - right);
  const durationSeconds = frames.at(-1).relativeTimeSeconds - frames[0].relativeTimeSeconds;
  return {
    durationSeconds,
    effectiveFps: (frames.length - 1) / durationSeconds,
    intervalSeconds: {
      minimum: ordered[0],
      median: percentile(ordered, 0.5),
      p95: percentile(ordered, 0.95),
      maximum: ordered.at(-1),
    },
  };
}

export function validateDiagnosticBoundary(intake, manifest) {
  invariant(intake.schemaVersion === 1
    && intake.evidenceType === "g4-l3-ts006-manual-original-runtime-diagnostic-intake"
    && intake.status === "running-diagnostic-not-promotion-eligible"
    && intake.animationId === "course-g04-l03-ts-006"
    && intake.language === "en",
  "diagnostic intake identity or status drifted");
  invariant(intake.source?.sha256 === EXPECTED_SOURCE_SHA256 && HASH.test(intake.source.sha256), "diagnostic source hash drifted");
  invariant(intake.process?.commandLineSwfArgumentUsed === false
    && intake.process?.guiFileOpenReportedByOperator === true
    && intake.process?.guiFileOpenVisuallyObserved === true,
  "manual GUI-open provenance drifted");
  invariant(intake.limitations?.currentAdministratorHomeUsed === true
    && intake.limitations?.disposableProfileUsed === false
    && intake.limitations?.networkContainmentBound === false
    && intake.limitations?.preEntryFramesCaptured === false
    && intake.limitations?.completeNaturalEntryTrace === false
    && intake.limitations?.independentHumanRolesSatisfied === false
    && intake.limitations?.promotionEligible === false
    && intake.limitations?.strictAcceptanceEffect === "none",
  "diagnostic limitations were weakened or promoted");
  invariant(manifest.schemaVersion === 1
    && manifest.evidenceType === "g4-l3-lossless-window-frame-and-system-audio-capture"
    && manifest.status === "raw-capture-not-yet-bound-to-runtime-trace"
    && manifest.runtimeAuthorityClaimed === false
    && manifest.acceptanceEffect === "none",
  "raw capture authority boundary drifted");
  return true;
}

export function validateCaptureManifest(manifest) {
  invariant(manifest.configuration?.fps === "12", "capture FPS request drifted");
  invariant(manifest.configuration?.sourceKind === "window" && manifest.configuration?.cursor === "excluded", "capture source/cursor drifted");
  invariant(manifest.configuration?.sourceRect === "0.0,28.0,800.0,600.0", "capture crop drifted");
  invariant(manifest.configuration?.outputWidth === "800" && manifest.configuration?.outputHeight === "600", "capture output dimensions drifted");
  invariant(manifest.configuration?.audio === "system-audio-48kHz-2ch-ALAC", "capture audio request drifted");
  invariant(manifest.window?.ownerName === "Flash Player" && manifest.window?.title === EXPECTED_WINDOW_TITLE, "Flash Player window identity drifted");
  invariant(manifest.window?.frameWidth === 800 && manifest.window?.frameHeight === 628, "Flash Player window dimensions drifted");
  invariant(manifest.droppedOrIncompleteFrameCount === 0, "capture reports incomplete frames");
  invariant(Array.isArray(manifest.frames) && manifest.frames.length > 0, "capture has no frame descriptors");
  invariant(manifest.audio?.codec === "Apple Lossless Audio Codec"
    && manifest.audio?.sampleRate === 48000
    && manifest.audio?.channels === 2
    && manifest.audio?.outputFile === "system-audio-lossless.m4a"
    && HASH.test(manifest.audio?.outputSha256 ?? ""),
  "capture audio descriptor drifted");
  return manifest;
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

async function verifyFrames(captureRoot, frames) {
  const frameRoot = path.join(captureRoot, "frames");
  const actualNames = (await readdir(frameRoot)).sort();
  invariant(actualNames.length === frames.length, `frame directory count ${actualNames.length} differs from manifest ${frames.length}`);
  const verified = await mapConcurrent(frames, 8, async (frame, index) => {
    const ordinal = index + 1;
    const expectedFile = `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
    invariant(frame.ordinal === ordinal && frame.file === expectedFile && frame.status === "complete", `frame ${ordinal} descriptor identity drifted`);
    invariant(frame.width === 800 && frame.height === 600, `frame ${ordinal} descriptor is not 800x600`);
    invariant(HASH.test(frame.sha256), `frame ${ordinal} has an invalid SHA-256`);
    invariant(actualNames[index] === path.basename(expectedFile), `frame ${ordinal} file sequence drifted`);
    const framePath = path.join(captureRoot, frame.file);
    invariant(within(captureRoot, framePath), `frame ${ordinal} escapes the capture root`);
    const artifact = await readRegular(framePath, `frame ${ordinal}`);
    invariant(artifact.size === frame.bytes, `frame ${ordinal} byte count drifted`);
    invariant(artifact.sha256 === frame.sha256, `frame ${ordinal} SHA-256 drifted`);
    const dimensions = inspectPngHeader(artifact.bytes, `frame ${ordinal}`);
    invariant(dimensions.width === frame.width && dimensions.height === frame.height, `frame ${ordinal} PNG dimensions drifted`);
    return {ordinal, file: frame.file, bytes: artifact.size, sha256: artifact.sha256, width: dimensions.width, height: dimensions.height};
  });
  const totalBytes = verified.reduce((sum, frame) => sum + frame.bytes, 0);
  const orderedFrameSetSha256 = sha256(Buffer.from(verified.map((frame) => `${frame.ordinal}\u0000${frame.file}\u0000${frame.sha256}\n`).join("")));
  return {verified, totalBytes, orderedFrameSetSha256};
}

async function probeAudio(audioPath) {
  const {stdout} = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=index,codec_name,codec_long_name,codec_type,sample_rate,channels,channel_layout,duration:format=format_name,duration,size",
    "-of", "json",
    audioPath,
  ], {encoding: "utf8", maxBuffer: 8 * 1024 * 1024});
  const payload = JSON.parse(stdout);
  const streams = (payload.streams ?? []).filter((stream) => stream.codec_type === "audio");
  invariant(streams.length === 1, `expected one audio stream, observed ${streams.length}`);
  const stream = streams[0];
  invariant(stream.codec_name === "alac" && Number(stream.sample_rate) === 48000 && stream.channels === 2, "ffprobe audio identity drifted");
  return {
    streamIndex: stream.index,
    codecName: stream.codec_name,
    codecLongName: stream.codec_long_name,
    sampleRate: Number(stream.sample_rate),
    channels: stream.channels,
    channelLayout: stream.channel_layout,
    durationSeconds: Number(stream.duration ?? payload.format?.duration),
    containerFormat: payload.format?.format_name,
    containerBytes: Number(payload.format?.size),
  };
}

function renderMarkdown(report) {
  const timing = report.capture.frames.timing;
  return `# TS006 EN manual original-runtime diagnostic integrity\n\n`
    + `Status: **verified diagnostic; not promotion eligible**.\n\n`
    + `This report verifies the bytes and native dimensions of the manually opened Flash Player capture. It does not establish a contained disposable-profile session, a complete pre-entry natural trace, independent human roles, runtime authority, strict acceptance, or release readiness.\n\n`
    + `- Animation: \`${report.identity.animationId}\`\n`
    + `- Session: \`${report.identity.sessionId}\`\n`
    + `- Language: \`${report.identity.language}\`\n`
    + `- Source SHA-256: \`${report.source.sha256}\`\n`
    + `- Capture manifest SHA-256: \`${report.capture.manifest.sha256}\`\n`
    + `- Verified PNG frames: ${report.capture.frames.count}/${report.capture.frames.count} at 800x600\n`
    + `- Requested FPS: 12; observed effective FPS: ${timing.effectiveFps.toFixed(6)}\n`
    + `- Capture duration: ${timing.durationSeconds.toFixed(6)} seconds\n`
    + `- Incomplete-frame count reported by capture tool: ${report.capture.frames.droppedOrIncompleteFrameCount}\n`
    + `- Ordered frame-set SHA-256: \`${report.capture.frames.orderedFrameSetSha256}\`\n`
    + `- Audio: ALAC, 48 kHz, stereo, ${report.capture.audio.bytes} bytes, ${report.capture.audio.ffprobe.durationSeconds.toFixed(6)} seconds\n`
    + `- Audio SHA-256: \`${report.capture.audio.sha256}\`\n`
    + `- Strict acceptance effect: **none**\n`;
}

export async function analyzeDiagnostic({sessionRoot, write = true} = {}) {
  const resolvedSession = path.resolve(sessionRoot ?? "");
  invariant(within(ARTIFACT_ROOT, resolvedSession), "--session-root must be a child of artifacts/full-frame/g4-l3");
  const realArtifactRoot = await realpath(ARTIFACT_ROOT);
  const realSession = await realpath(resolvedSession);
  invariant(within(realArtifactRoot, realSession), "session realpath escapes artifacts/full-frame/g4-l3");
  const sessionIntakePath = path.join(realSession, "session-intake.json");
  const captureRoot = path.join(realSession, CAPTURE_RELATIVE);
  const captureManifestPath = path.join(captureRoot, "capture-manifest.json");
  const [intakeArtifact, manifestArtifact, generatorArtifact] = await Promise.all([
    readRegular(sessionIntakePath, "session intake"),
    readRegular(captureManifestPath, "capture manifest"),
    readRegular(SCRIPT_PATH, "diagnostic analyzer"),
  ]);
  const intake = JSON.parse(intakeArtifact.bytes);
  const manifest = validateCaptureManifest(JSON.parse(manifestArtifact.bytes));
  validateDiagnosticBoundary(intake, manifest);
  const sourcePath = path.resolve(intake.source.path);
  invariant(sourcePath === path.join(PROJECT_ROOT, EXPECTED_SOURCE_SUFFIX), "diagnostic source path drifted");
  const sourceArtifact = await readRegular(sourcePath, "source SWF");
  invariant(sourceArtifact.sha256 === intake.source.sha256 && sourceArtifact.sha256 === EXPECTED_SOURCE_SHA256, "source SWF bytes drifted");
  const {verified, totalBytes, orderedFrameSetSha256} = await verifyFrames(captureRoot, manifest.frames);
  const timing = summarizeFrameTiming(manifest.frames);
  const audioPath = path.join(captureRoot, manifest.audio.outputFile);
  const audioArtifact = await readRegular(audioPath, "lossless system audio");
  invariant(audioArtifact.size === manifest.audio.outputBytes && audioArtifact.sha256 === manifest.audio.outputSha256, "audio bytes or SHA-256 drifted");
  const ffprobe = await probeAudio(audioPath);
  invariant(ffprobe.containerBytes === audioArtifact.size, "ffprobe audio byte count drifted");
  const firstFrame = manifest.frames[0];
  const lastFrame = manifest.frames.at(-1);
  const report = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-manual-runtime-diagnostic-integrity-report",
    status: "verified-diagnostic-not-promotion-eligible",
    identity: {animationId: intake.animationId, sessionId: intake.sessionId, language: intake.language, operator: intake.operator},
    source: {path: intake.source.path, bytes: sourceArtifact.size, sha256: sourceArtifact.sha256},
    inputs: {
      sessionIntake: {file: portable(sessionIntakePath), bytes: intakeArtifact.size, sha256: intakeArtifact.sha256},
      analyzer: {file: portable(SCRIPT_PATH), bytes: generatorArtifact.size, sha256: generatorArtifact.sha256},
    },
    capture: {
      manifest: {file: portable(captureManifestPath), bytes: manifestArtifact.size, sha256: manifestArtifact.sha256},
      window: manifest.window,
      configuration: manifest.configuration,
      startedAt: manifest.startedAt,
      endedAt: manifest.endedAt,
      frames: {
        count: verified.length,
        totalPngBytes: totalBytes,
        width: 800,
        height: 600,
        first: verified[0],
        last: verified.at(-1),
        timing,
        droppedOrIncompleteFrameCount: manifest.droppedOrIncompleteFrameCount,
        orderedFrameSetAlgorithm: "ordinal-null-path-null-sha256-newline-v1",
        orderedFrameSetSha256,
      },
      audio: {
        file: portable(audioPath),
        bytes: audioArtifact.size,
        sha256: audioArtifact.sha256,
        firstPresentationOffsetFromVideoSeconds: manifest.audio.firstPresentationTimeSeconds - firstFrame.presentationTimeSeconds,
        lastPresentationOffsetFromVideoSeconds: manifest.audio.lastPresentationTimeSeconds - lastFrame.presentationTimeSeconds,
        bufferCount: manifest.audio.bufferCount,
        ffprobe,
      },
    },
    verifiedFacts: {
      sourceBytesMatchIntake: true,
      allManifestFramesExist: true,
      allFrameBytesAndHashesMatch: true,
      allFramePngDimensionsAreNative800x600: true,
      audioBytesAndHashMatch: true,
      audioIsLosslessAlac48kHzStereo: true,
      captureToolReportedNoIncompleteFrames: true,
      manualGuiOpenWasRecorded: true,
    },
    limitations: intake.limitations,
    authority: {
      classification: "manual-current-administrator-runtime-diagnostic",
      runtimeAuthorityClaimed: false,
      promotionEligible: false,
      strictAcceptanceEffect: "none",
      completionLedgerEffect: "none",
      lessonReleaseLedgerEffect: "none",
    },
  };
  const jsonPath = path.join(realSession, REPORT_JSON_RELATIVE);
  const markdownPath = path.join(realSession, REPORT_MD_RELATIVE);
  if (write) {
    await mkdir(path.dirname(jsonPath), {recursive: true});
    for (const [destination, contents] of [[jsonPath, pretty(report)], [markdownPath, renderMarkdown(report)]]) {
      const temporary = `${destination}.tmp-${process.pid}`;
      await writeFile(temporary, contents, {flag: "wx"});
      await rename(temporary, destination);
    }
  }
  return {report, jsonPath, markdownPath};
}

export function parseArguments(argv) {
  let sessionRoot = null;
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--session-root") sessionRoot = argv[++index] ?? "";
    else if (value === "--check") check = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(sessionRoot, "--session-root is required");
  return {sessionRoot, check};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await analyzeDiagnostic({sessionRoot: options.sessionRoot, write: !options.check});
  if (options.check) {
    const [jsonArtifact, markdownArtifact] = await Promise.all([
      readRegular(result.jsonPath, "diagnostic JSON report"),
      readRegular(result.markdownPath, "diagnostic Markdown report"),
    ]);
    invariant(jsonArtifact.bytes.equals(Buffer.from(pretty(result.report))), "diagnostic JSON report is stale");
    invariant(markdownArtifact.bytes.equals(Buffer.from(renderMarkdown(result.report))), "diagnostic Markdown report is stale");
  }
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${portable(result.jsonPath)}\n`);
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${portable(result.markdownPath)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

