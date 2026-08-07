#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ROOT_REAL = realpath(ROOT);

const CALIBRATION_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-audio-capture-calibration-bufferprobe-2026-07-26T07-21-45Z";
const CAPTURE_MANIFEST = `${CALIBRATION_DIRECTORY}/capture-manifest.json`;
const CAPTURE_AUDIO = `${CALIBRATION_DIRECTORY}/system-audio-lossless.m4a`;
const SOURCE_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3";
const CAPTURE_TOOL_SOURCE = "tools/g4-l3-runtime-capture/CaptureMain.swift";
const CAPTURE_TOOL_READINESS = "reports/g4-l3-runtime-capture-tool-readiness.json";
const CAPTURE_TOOL_EXECUTABLE =
  "work/g4-l3-runtime-capture-tool/HELP Math Runtime Capture.app/Contents/MacOS/g4-l3-runtime-capture";
const PRIOR_SPANISH_AUDIO_DIAGNOSTIC = "reports/g4-l3-ts006-spanish-audio-diagnostic.json";
const REPORT_JSON = "reports/g4-l3-runtime-capture-audio-calibration.json";
const REPORT_MARKDOWN = "reports/g4-l3-runtime-capture-audio-calibration.md";

const EXPECTED = Object.freeze({
  captureManifest: {
    bytes: 51_828,
    sha256: "5b23f886d94b7b71b748e02787912681375571090be1a78705da0afb27960ab4",
  },
  captureAudio: {
    bytes: 1_257_549,
    sha256: "17eff98ae7bc7399a8cc405d10871b8ca3a346ad81cd1312bd156a4e9bedb2d4",
    decodedPcmSha256: "4ce8a65016f543398f94cdd28b0ed7d6391d383cf2fd3f737fe9c7062dcc3873",
  },
  sourceAudio: {
    bytes: 106_848,
    sha256: "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  },
  frameCount: 144,
  frameSetSha256: "875dbcd5e42c39dda70e2edcf2a02c91ea7ec9da1c7782df403c52c5d221a724",
  captureToolSource: {
    bytes: 29_668,
    sha256: "383c88fc117e00eb1b243cc54f47e587ccbe3ddac16cce4bbe03f412b6425587",
  },
  captureToolReadiness: {
    bytes: 3_629,
    sha256: "1a6962253615935786e96a029e40e80aefa332d5912590d04afd5dabaedc2aab",
  },
  captureToolExecutable: {
    bytes: 464_528,
    sha256: "2cca84d5725bf2db24a3058fad31c0f895d4eb8d1c0de1ea78c66f936c24bde7",
    mode: "0500",
  },
  priorSpanishDiagnostic: {
    bytes: 6_946,
    sha256: "4a576acdbe98f6ec6873ffb5453a6d7fa651232600d50b45ac49503650370afa",
  },
  tools: {
    ffprobe: {
      sha256: "cfeefcc9207eb3fa424679228fe3848db2921b15537d26c1ccc4a7a61de95d00",
      versionPrefix: "ffprobe version 8.1.2 ",
    },
    ffmpeg: {
      sha256: "dad4b30b36a1a999bfa4b6ffbde138bd17ee496c69e12eef638227dff2c6415c",
      versionPrefix: "ffmpeg version 8.1.2 ",
    },
  },
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function assertInsideProject(target, label) {
  const [rootReal, targetReal] = await Promise.all([ROOT_REAL, realpath(target)]);
  invariant(targetReal.startsWith(`${rootReal}${path.sep}`), `${label} resolves outside the project root`);
}

async function bindProjectFile(relativePath, expected = null) {
  const target = projectPath(relativePath);
  const metadata = await lstat(target);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relativePath} must be one regular non-symlink file`);
  await assertInsideProject(target, relativePath);
  const bytes = await readFile(target);
  const binding = {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
  };
  if (expected) {
    invariant(binding.bytes === expected.bytes, `${relativePath} byte length drifted`);
    invariant(binding.sha256 === expected.sha256, `${relativePath} SHA-256 drifted`);
    if (expected.mode) invariant(binding.mode === expected.mode, `${relativePath} mode drifted`);
  }
  return {binding, bytes};
}

async function bindJson(relativePath, expected = null) {
  const document = await bindProjectFile(relativePath, expected);
  return {...document, value: JSON.parse(document.bytes.toString("utf8"))};
}

function expectedFrameFile(ordinal) {
  return `frames/frame-${String(ordinal).padStart(6, "0")}.png`;
}

export function validateCalibrationCaptureManifest(manifest) {
  invariant(manifest?.schemaVersion === 1 &&
    manifest.evidenceType === "g4-l3-lossless-window-frame-and-system-audio-capture" &&
    manifest.status === "raw-capture-not-yet-bound-to-runtime-trace",
  "calibration capture identity drifted");
  invariant(manifest.runtimeAuthorityClaimed === false && manifest.acceptanceEffect === "none",
    "calibration capture must remain authority- and acceptance-neutral");
  invariant((manifest.window === null || manifest.window === undefined) &&
    manifest.display?.displayID === 1 &&
    manifest.display.frameWidth === 1920 &&
    manifest.display.frameHeight === 1080 &&
    manifest.display.includedApplicationName === "QuickTime Player" &&
    manifest.display.includedBundleIdentifier === "com.apple.QuickTimePlayerX" &&
    manifest.display.includedProcessID === 26594,
  "calibration capture is not bound to the exact QuickTime application/display");
  invariant(manifest.configuration?.sourceKind === "display-exact-application" &&
    manifest.configuration.fps === "12" &&
    manifest.configuration.outputWidth === "350" &&
    manifest.configuration.outputHeight === "135" &&
    manifest.configuration.sourceRect === "50.0,180.0,350.0,135.0" &&
    manifest.configuration.audio === "system-audio-48kHz-2ch-ALAC",
  "calibration capture configuration drifted");
  invariant(manifest.startedAt === "2026-07-26T07:21:58Z" &&
    manifest.endedAt === "2026-07-26T07:22:10Z",
  "calibration capture time identity drifted");
  invariant(manifest.droppedOrIncompleteFrameCount === 0 &&
    Array.isArray(manifest.frames) && manifest.frames.length === EXPECTED.frameCount,
  "calibration capture must have 144 complete frames and zero drops");
  let previousPts = -Infinity;
  let previousRelative = -Infinity;
  for (const [index, frame] of manifest.frames.entries()) {
    const ordinal = index + 1;
    invariant(frame.ordinal === ordinal &&
      frame.file === expectedFrameFile(ordinal) &&
      frame.status === "complete" &&
      frame.width === 350 && frame.height === 135 &&
      Number.isInteger(frame.bytes) && frame.bytes > 0 &&
      /^[a-f0-9]{64}$/u.test(frame.sha256) &&
      Number.isFinite(frame.presentationTimeSeconds) &&
      Number.isFinite(frame.relativeTimeSeconds) &&
      frame.presentationTimeSeconds >= previousPts &&
      frame.relativeTimeSeconds >= previousRelative,
    `calibration frame ${ordinal} identity or ordering drifted`);
    previousPts = frame.presentationTimeSeconds;
    previousRelative = frame.relativeTimeSeconds;
  }
  invariant(manifest.frames[0].relativeTimeSeconds === 0,
    "calibration frame timeline must start at relative second zero");
  invariant(manifest.audio?.bufferCount === 604 &&
    manifest.audio.inputPayloadBytes === 4_638_720 &&
    Number.isInteger(manifest.audio.inputNonZeroBytes) &&
    manifest.audio.inputNonZeroBytes > 0 &&
    manifest.audio.inputNonZeroBytes <= manifest.audio.inputPayloadBytes &&
    manifest.audio.inputContainsNonZeroAudio === true &&
    manifest.audio.codec === "Apple Lossless Audio Codec" &&
    manifest.audio.sampleRate === 48_000 &&
    manifest.audio.channels === 2 &&
    manifest.audio.outputFile === "system-audio-lossless.m4a" &&
    manifest.audio.outputBytes === EXPECTED.captureAudio.bytes &&
    manifest.audio.outputSha256 === EXPECTED.captureAudio.sha256 &&
    Number.isFinite(manifest.audio.firstPresentationTimeSeconds) &&
    Number.isFinite(manifest.audio.lastPresentationTimeSeconds) &&
    manifest.audio.lastPresentationTimeSeconds > manifest.audio.firstPresentationTimeSeconds,
  "calibration source-buffer or encoded-audio manifest binding drifted");
  return true;
}

async function verifyCalibrationInventory(manifest) {
  const calibrationRoot = projectPath(CALIBRATION_DIRECTORY);
  const rootMetadata = await lstat(calibrationRoot);
  invariant(rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "calibration root must be a real directory");
  await assertInsideProject(calibrationRoot, "calibration root");
  const rootEntries = (await readdir(calibrationRoot, {withFileTypes: true}))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  invariant(rootEntries.length === 3 &&
    rootEntries[0].name === "capture-manifest.json" && rootEntries[0].isFile() &&
    rootEntries[1].name === "frames" && rootEntries[1].isDirectory() &&
    rootEntries[2].name === "system-audio-lossless.m4a" && rootEntries[2].isFile(),
  "calibration root contains unexpected or missing entries");

  const frameRoot = path.join(calibrationRoot, "frames");
  const entries = (await readdir(frameRoot, {withFileTypes: true}))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  invariant(entries.length === EXPECTED.frameCount && entries.every((entry, index) =>
    entry.isFile() && !entry.isSymbolicLink() &&
    entry.name === path.basename(expectedFrameFile(index + 1))),
  "calibration frame directory is incomplete or contains unexpected entries");

  const files = [];
  const digestRows = [];
  for (const frame of manifest.frames) {
    const relativePath = `${CALIBRATION_DIRECTORY}/${frame.file}`;
    const {binding} = await bindProjectFile(relativePath);
    invariant(binding.bytes === frame.bytes && binding.sha256 === frame.sha256,
      `${frame.file} differs from its capture-manifest binding`);
    files.push({
      ordinal: frame.ordinal,
      path: relativePath,
      bytes: binding.bytes,
      sha256: binding.sha256,
    });
    digestRows.push(`${frame.ordinal}\t${frame.file}\t${binding.bytes}\t${binding.sha256}`);
  }
  const frameSetSha256 = sha256(Buffer.from(digestRows.join("\n")));
  invariant(frameSetSha256 === EXPECTED.frameSetSha256,
    "calibration full-frame set SHA-256 drifted");
  return {
    directory: `${CALIBRATION_DIRECTORY}/frames`,
    count: files.length,
    frameSetSha256,
    files,
  };
}

async function resolveTool(command) {
  const expected = EXPECTED.tools[command];
  invariant(expected, `unsupported tool binding: ${command}`);
  const {stdout} = await execFile("/usr/bin/which", [command], {encoding: "utf8"});
  const commandPath = stdout.trim();
  invariant(path.isAbsolute(commandPath), `cannot resolve ${command}`);
  const executableRealPath = await realpath(commandPath);
  const metadata = await lstat(executableRealPath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${command} must resolve to a regular executable file`);
  const executableBytes = await readFile(executableRealPath);
  const executableSha256 = sha256(executableBytes);
  invariant(executableSha256 === expected.sha256, `${command} executable SHA-256 drifted`);
  const version = await execFile(executableRealPath, ["-version"], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  const versionFirstLine = `${version.stdout}${version.stderr}`.split(/\r?\n/u)[0];
  invariant(versionFirstLine.startsWith(expected.versionPrefix), `${command} version drifted`);
  return {
    command,
    commandPath,
    executableRealPath,
    executableBytes: executableBytes.length,
    executableSha256,
    versionFirstLine,
  };
}

function parseVolume(stderr, label) {
  const mean = stderr.match(/mean_volume:\s*(-?[\d.]+) dB/u);
  const max = stderr.match(/max_volume:\s*(-?[\d.]+) dB/u);
  invariant(mean && max, `${label} ffmpeg volume output is incomplete`);
  return {meanVolumeDb: Number(mean[1]), maxVolumeDb: Number(max[1])};
}

async function probeEncodedAudio(bindingDocument, ffprobeTool, ffmpegTool) {
  const absolutePath = projectPath(bindingDocument.binding.path);
  const before = await readFile(absolutePath);
  invariant(sha256(before) === bindingDocument.binding.sha256,
    `${bindingDocument.binding.path} changed before media probing`);
  const probe = await execFile(ffprobeTool.executableRealPath, [
    "-v", "error",
    "-show_entries", "format=duration,size:stream=codec_name,sample_rate,channels,sample_fmt,bits_per_raw_sample",
    "-of", "json",
    absolutePath,
  ], {encoding: "utf8", maxBuffer: 8 * 1024 * 1024});
  const parsed = JSON.parse(probe.stdout);
  invariant(parsed.streams?.length === 1, `${bindingDocument.binding.path} must have exactly one audio stream`);
  const decoded = await execFile(ffmpegTool.executableRealPath, [
    "-hide_banner", "-nostats", "-i", absolutePath,
    "-map", "0:a:0",
    "-f", "s32le", "-acodec", "pcm_s32le", "pipe:1",
  ], {encoding: null, maxBuffer: 32 * 1024 * 1024});
  invariant(Buffer.isBuffer(decoded.stdout) && decoded.stdout.length > 0,
    `${bindingDocument.binding.path} produced no decoded PCM`);
  const volume = await execFile(ffmpegTool.executableRealPath, [
    "-hide_banner", "-nostats", "-i", absolutePath,
    "-map", "0:a:0", "-af", "volumedetect",
    "-f", "null", "-",
  ], {encoding: "utf8", maxBuffer: 16 * 1024 * 1024});
  const decodedNonZeroBytes = decoded.stdout.reduce((count, byte) => count + (byte === 0 ? 0 : 1), 0);
  const after = await readFile(absolutePath);
  invariant(sha256(after) === bindingDocument.binding.sha256,
    `${bindingDocument.binding.path} changed during media probing`);
  return {
    ...bindingDocument.binding,
    codec: parsed.streams[0].codec_name,
    sampleFormat: parsed.streams[0].sample_fmt ?? null,
    bitsPerRawSample: Number(parsed.streams[0].bits_per_raw_sample || 0),
    sampleRate: Number(parsed.streams[0].sample_rate),
    channels: Number(parsed.streams[0].channels),
    durationSeconds: Number(parsed.format.duration),
    decodedPcmBytes: decoded.stdout.length,
    decodedNonZeroBytes,
    decodedPcmSha256: sha256(decoded.stdout),
    ...parseVolume(volume.stderr, bindingDocument.binding.path),
  };
}

export function classifySystemAudioCalibration({manifestAudio, encodedAudioProbe, sourceAudioProbe}) {
  const sourceBufferNonZeroEstablished =
    manifestAudio?.inputContainsNonZeroAudio === true &&
    Number.isInteger(manifestAudio.inputNonZeroBytes) &&
    manifestAudio.inputNonZeroBytes > 0;
  const encodedAudioNonSilentEstablished =
    Number.isInteger(encodedAudioProbe?.decodedNonZeroBytes) &&
    encodedAudioProbe.decodedNonZeroBytes > 0 &&
    encodedAudioProbe.meanVolumeDb > -80 &&
    encodedAudioProbe.maxVolumeDb > -80;
  const boundSourceNonSilent =
    Number.isInteger(sourceAudioProbe?.decodedNonZeroBytes) &&
    sourceAudioProbe.decodedNonZeroBytes > 0 &&
    sourceAudioProbe.meanVolumeDb > -80 &&
    sourceAudioProbe.maxVolumeDb > -80;
  return Object.freeze({
    calibration: sourceBufferNonZeroEstablished && encodedAudioNonSilentEstablished && boundSourceNonSilent,
    sourceBufferNonZeroEstablished,
    encodedAudioNonSilentEstablished,
    boundSourceNonSilent,
    flashAudioEstablished: false,
    spokenSpanishEstablished: false,
    cueTimingEstablished: false,
    listeningReviewCompleted: false,
    baselineAuthorityClaimed: false,
    runtimeAuthorityClaimed: false,
    audioAccepted: false,
    humanReviewAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    publicRelease: false,
    strictAcceptanceEffect: "none",
  });
}

export function validateCalibrationAuthorityBoundary(conclusion) {
  invariant(conclusion?.calibration === true &&
    conclusion.sourceBufferNonZeroEstablished === true &&
    conclusion.encodedAudioNonSilentEstablished === true &&
    conclusion.boundSourceNonSilent === true,
  "system-audio calibration success is not established");
  for (const field of [
    "flashAudioEstablished",
    "spokenSpanishEstablished",
    "cueTimingEstablished",
    "listeningReviewCompleted",
    "baselineAuthorityClaimed",
    "runtimeAuthorityClaimed",
    "audioAccepted",
    "humanReviewAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
    "publicRelease",
  ]) invariant(conclusion[field] === false, `calibration improperly promoted ${field}`);
  invariant(conclusion.strictAcceptanceEffect === "none",
    "calibration must have no strict-acceptance effect");
  return true;
}

export function validateCaptureToolReadiness(readiness, sourceBinding, executableBinding) {
  invariant(readiness?.schemaVersion === 1 &&
    readiness.reportType === "g4-l3-screen-capture-kit-tool-readiness",
  "capture-tool readiness identity drifted");
  const {reportFingerprintSha256, ...withoutFingerprint} = readiness;
  invariant(reportFingerprintSha256 === sha256(Buffer.from(stable(withoutFingerprint))),
    "capture-tool readiness fingerprint drifted");
  invariant(readiness.source?.path === sourceBinding.path &&
    readiness.source.bytes === sourceBinding.bytes &&
    readiness.source.sha256 === sourceBinding.sha256,
  "capture-tool readiness source binding drifted");
  invariant(readiness.executable?.path === executableBinding.path &&
    readiness.executable.bytes === executableBinding.bytes &&
    readiness.executable.sha256 === executableBinding.sha256 &&
    readiness.executable.mode === executableBinding.mode,
  "capture-tool readiness executable binding drifted");
  invariant(readiness.capabilities?.screenCaptureKitDisplayExactApplicationCapture === true &&
    readiness.capabilities.systemAudio?.codec === "ALAC" &&
    readiness.capabilities.systemAudio.sampleRate === 48_000 &&
    readiness.capabilities.systemAudio.channels === 2 &&
    readiness.capabilities.systemAudio.lossless === true &&
    readiness.capabilities.systemAudio.sourceBufferPayloadDiagnostics === true,
  "capture-tool readiness lacks required system-audio diagnostics");
  invariant(readiness.execution?.helpOnlyExecuted === true &&
    readiness.execution.screenReadAttempted === false &&
    readiness.execution.flashProjectorLaunched === false &&
    readiness.execution.swfOpened === false &&
    readiness.execution.runtimeSessionExecuted === false,
  "capture-tool readiness contains a runtime execution claim");
  invariant(readiness.acceptance?.acceptanceNeutral === true &&
    readiness.acceptance.authoritativeOriginalRuntimeTrace === false &&
    readiness.acceptance.baselineAccepted === false &&
    readiness.acceptance.audioAccepted === false &&
    readiness.acceptance.humanVisualAccepted === false &&
    readiness.acceptance.ownerAccepted === false &&
    readiness.acceptance.strictMigrationComplete === false &&
    readiness.acceptance.publicRelease === false,
  "capture-tool readiness contains an acceptance claim");
  return true;
}

function validateCaptureToolSource(sourceText) {
  for (const fragment of [
    "let inputNonZeroBytes: Int",
    "audioNonZeroByteCount += payload.reduce(into: 0)",
    "inputContainsNonZeroAudio: state.nonZeroBytes > 0",
    "configuration.capturesAudio = true",
    "filter = SCContentFilter(display: display, including: [application], exceptingWindows: [])",
  ]) invariant(sourceText.includes(fragment), `capture-tool source instrumentation drifted: ${fragment}`);
}

function validatePriorSpanishDiagnostic(report) {
  invariant(report?.schemaVersion === 2 &&
    report.reportType === "g4-l3-ts006-spanish-audio-diagnostic" &&
    report.classification === "current-admin-account-runtime-audio-failure-diagnostic-not-strict-evidence" &&
    report.conclusion?.capturedAudioDigitalSilence === true &&
    report.conclusion.sourceMp3NonSilent === true &&
    report.conclusion.runtimeAudioEmissionObservedCandidate === false &&
    report.conclusion.causalAttributionAvailable === false &&
    report.conclusion.runtimeAudioEmissionEstablished === false &&
    report.conclusion.audioAcceptance === false &&
    report.authority?.runtimeAuthorityClaimed === false &&
    report.authority.audioParityClaimed === false &&
    report.authority.spanishLanguageAccepted === false &&
    report.authority.humanReviewAccepted === false &&
    report.authority.ownerAccepted === false &&
    report.strictAcceptanceEffect === "none",
  "prior Spanish-audio diagnostic boundary drifted");
}

async function atomicWrite(relativePath, contents) {
  const target = projectPath(relativePath);
  const temporary = `${target}.tmp-${process.pid}`;
  await rm(temporary, {force: true});
  try {
    await writeFile(temporary, contents, {flag: "wx"});
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, {force: true});
    throw error;
  }
}

function markdown(report) {
  return `# G4 L3 Runtime Capture System-Audio Calibration\n\n` +
    `This deterministic report proves only that the exact current ScreenCaptureKit capture-tool build recorded non-zero system-audio buffers and encoded non-silent ALAC while filtering the exact QuickTime Player application in the bound calibration session.\n\n` +
    `## Result\n\n` +
    `- System-audio capture calibration: **${report.conclusion.calibration}**\n` +
    `- Complete frames: ${report.calibration.frames.count}; dropped/incomplete: ${report.calibration.captureSession.droppedOrIncompleteFrameCount}\n` +
    `- Input payload/non-zero bytes: ${report.calibration.sourceBufferDiagnostics.inputPayloadBytes} / ${report.calibration.sourceBufferDiagnostics.inputNonZeroBytes}\n` +
    `- Encoded ALAC decoded PCM/non-zero bytes: ${report.calibration.encodedAudio.decodedPcmBytes} / ${report.calibration.encodedAudio.decodedNonZeroBytes}\n` +
    `- Encoded ALAC mean/max: ${report.calibration.encodedAudio.meanVolumeDb.toFixed(1)} / ${report.calibration.encodedAudio.maxVolumeDb.toFixed(1)} dB\n` +
    `- Bound source MP3 mean/max: ${report.calibration.sourceAudio.meanVolumeDb.toFixed(1)} / ${report.calibration.sourceAudio.maxVolumeDb.toFixed(1)} dB\n` +
    `- Full-frame set SHA-256: \`${report.calibration.frames.frameSetSha256}\`\n\n` +
    `## Authority boundary\n\n` +
    `Calibration success does **not** establish Flash Player audio, spoken Spanish identity, cue timing, listening review, an authoritative baseline, runtime authority, audio acceptance, human review, Owner acceptance, strict completion, or public release. Every one of those fields remains false, and strict-acceptance effect is **none**.\n\n` +
    `The earlier bound TS006 Spanish-audio diagnostic remains a contrast-only observation: its captured audio was digital silence. This calibration used the current instrumented capture-tool build and therefore does not retroactively validate the older Flash session or determine why that session was silent.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`\n`;
}

export async function analyzeG4L3RuntimeCaptureAudioCalibration({writeReports = true} = {}) {
  const [
    manifestDocument,
    captureAudioDocument,
    sourceAudioDocument,
    captureToolSourceDocument,
    captureToolReadinessDocument,
    captureToolExecutableDocument,
    priorDiagnosticDocument,
    ffprobeTool,
    ffmpegTool,
    generatorBytes,
  ] = await Promise.all([
    bindJson(CAPTURE_MANIFEST, EXPECTED.captureManifest),
    bindProjectFile(CAPTURE_AUDIO, EXPECTED.captureAudio),
    bindProjectFile(SOURCE_AUDIO, EXPECTED.sourceAudio),
    bindProjectFile(CAPTURE_TOOL_SOURCE, EXPECTED.captureToolSource),
    bindJson(CAPTURE_TOOL_READINESS, EXPECTED.captureToolReadiness),
    bindProjectFile(CAPTURE_TOOL_EXECUTABLE, EXPECTED.captureToolExecutable),
    bindJson(PRIOR_SPANISH_AUDIO_DIAGNOSTIC, EXPECTED.priorSpanishDiagnostic),
    resolveTool("ffprobe"),
    resolveTool("ffmpeg"),
    readFile(SCRIPT_PATH),
  ]);

  validateCalibrationCaptureManifest(manifestDocument.value);
  validateCaptureToolReadiness(
    captureToolReadinessDocument.value,
    captureToolSourceDocument.binding,
    captureToolExecutableDocument.binding,
  );
  validateCaptureToolSource(captureToolSourceDocument.bytes.toString("utf8"));
  validatePriorSpanishDiagnostic(priorDiagnosticDocument.value);

  const [frames, encodedAudio, sourceAudio] = await Promise.all([
    verifyCalibrationInventory(manifestDocument.value),
    probeEncodedAudio(captureAudioDocument, ffprobeTool, ffmpegTool),
    probeEncodedAudio(sourceAudioDocument, ffprobeTool, ffmpegTool),
  ]);
  invariant(encodedAudio.codec === "alac" &&
    encodedAudio.sampleRate === 48_000 &&
    encodedAudio.channels === 2 &&
    encodedAudio.durationSeconds === 12.117333 &&
    encodedAudio.decodedPcmBytes === manifestDocument.value.audio.inputPayloadBytes &&
    encodedAudio.decodedPcmSha256 === EXPECTED.captureAudio.decodedPcmSha256,
  "calibration encoded ALAC media identity drifted");
  invariant(sourceAudio.codec === "mp3" &&
    sourceAudio.sampleRate === 48_000 &&
    sourceAudio.channels === 1 &&
    sourceAudio.durationSeconds === 7.632,
  "bound TS006 source MP3 media identity drifted");

  const conclusion = classifySystemAudioCalibration({
    manifestAudio: manifestDocument.value.audio,
    encodedAudioProbe: encodedAudio,
    sourceAudioProbe: sourceAudio,
  });
  validateCalibrationAuthorityBoundary(conclusion);

  const reportWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-runtime-capture-audio-calibration",
    animationId: "course-g04-l03-ts-006",
    classification: "deterministic-system-audio-capture-calibration-only-not-flash-runtime-evidence",
    calibration: {
      captureSession: {
        directory: CALIBRATION_DIRECTORY,
        manifest: manifestDocument.binding,
        startedAt: manifestDocument.value.startedAt,
        endedAt: manifestDocument.value.endedAt,
        exactApplication: {
          name: manifestDocument.value.display.includedApplicationName,
          bundleIdentifier: manifestDocument.value.display.includedBundleIdentifier,
          processId: manifestDocument.value.display.includedProcessID,
        },
        sourceKind: manifestDocument.value.configuration.sourceKind,
        droppedOrIncompleteFrameCount: manifestDocument.value.droppedOrIncompleteFrameCount,
        runtimeAuthorityClaimed: false,
        acceptanceEffect: "none",
      },
      frames,
      sourceBufferDiagnostics: {
        bufferCount: manifestDocument.value.audio.bufferCount,
        inputPayloadBytes: manifestDocument.value.audio.inputPayloadBytes,
        inputNonZeroBytes: manifestDocument.value.audio.inputNonZeroBytes,
        inputContainsNonZeroAudio: manifestDocument.value.audio.inputContainsNonZeroAudio,
        sourceBufferNonZeroEstablished: conclusion.sourceBufferNonZeroEstablished,
      },
      encodedAudio,
      sourceAudio,
    },
    captureTool: {
      source: captureToolSourceDocument.binding,
      readiness: captureToolReadinessDocument.binding,
      readinessFingerprintSha256: captureToolReadinessDocument.value.reportFingerprintSha256,
      executable: captureToolExecutableDocument.binding,
      sourceBufferPayloadDiagnostics: true,
      authority: "local-instrument-identity-only-not-evidence-trust",
    },
    tools: {
      ffprobe: ffprobeTool,
      ffmpeg: ffmpegTool,
    },
    contrast: {
      priorSpanishAudioDiagnostic: priorDiagnosticDocument.binding,
      priorCapturedAudioDigitalSilence:
        priorDiagnosticDocument.value.conclusion.capturedAudioDigitalSilence,
      priorFlashAudioEstablished:
        priorDiagnosticDocument.value.conclusion.runtimeAudioEmissionEstablished,
      interpretation:
        "Contrast only: the prior Flash capture was silent, while this current-tool QuickTime calibration is non-silent. The calibration does not retroactively validate the prior capture or establish a Flash-audio cause.",
      strictAcceptanceEffect: "none",
    },
    conclusion,
    unresolved: [
      "Flash Player audio emission remains unestablished.",
      "The bound source file has not been accepted by listening review as spoken Spanish.",
      "Spanish-audio cue timing remains unverified.",
      "No authoritative original-runtime baseline is created by this calibration.",
      "Human review, Owner acceptance, strict completion, and public release remain false.",
    ],
    generator: {
      path: portable(path.relative(ROOT, SCRIPT_PATH)),
      bytes: generatorBytes.length,
      sha256: sha256(generatorBytes),
    },
    strictAcceptanceEffect: "none",
  };
  const report = {
    ...reportWithoutFingerprint,
    reportFingerprintSha256: sha256(Buffer.from(stable(reportWithoutFingerprint))),
  };
  validateCalibrationAuthorityBoundary(report.conclusion);

  if (writeReports) {
    await Promise.all([
      atomicWrite(REPORT_JSON, pretty(report)),
      atomicWrite(REPORT_MARKDOWN, markdown(report)),
    ]);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  analyzeG4L3RuntimeCaptureAudioCalibration().then((report) => {
    process.stdout.write(`${JSON.stringify({
      calibration: report.conclusion.calibration,
      completeFrames: report.calibration.frames.count,
      inputNonZeroBytes: report.calibration.sourceBufferDiagnostics.inputNonZeroBytes,
      encodedAudioNonSilent: report.conclusion.encodedAudioNonSilentEstablished,
      flashAudioEstablished: report.conclusion.flashAudioEstablished,
      strictAcceptanceEffect: report.strictAcceptanceEffect,
      reportFingerprintSha256: report.reportFingerprintSha256,
    }, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
