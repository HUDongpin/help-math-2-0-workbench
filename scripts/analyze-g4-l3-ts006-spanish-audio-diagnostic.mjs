#!/usr/bin/env node

import {createHash} from "node:crypto";
import {execFile as execFileCallback} from "node:child_process";
import {gunzipSync} from "node:zlib";
import {promisify} from "node:util";
import {readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CAPTURE_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-spanish-audio-manual-diagnostic-2026-07-26T06-22-07Z/raw-capture";
const CAPTURE_MANIFEST = `${CAPTURE_DIRECTORY}/capture-manifest.json`;
const CAPTURE_AUDIO = `${CAPTURE_DIRECTORY}/system-audio-lossless.m4a`;
const SOURCE_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3";
const SHELL_SCRIPTS =
  "migrations/shell-course-g04-l03-index-local/audit/machine/ffdec-scripts.txt.gz";
const REPORT_JSON = "reports/g4-l3-ts006-spanish-audio-diagnostic.json";
const REPORT_MARKDOWN = "reports/g4-l3-ts006-spanish-audio-diagnostic.md";

const EXPECTED_CAPTURE_AUDIO_SHA256 =
  "41a56f6d4c22e34f7badf3e880c0c1c13b9ec8f9d6e0a899e308dc1ed9855761";
const EXPECTED_SOURCE_AUDIO_SHA256 =
  "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688";
const EXPECTED_WINDOW_TITLE =
  "file:///Volumes/WestWorld/HELP MATH 2.0/work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf";
const BUTTON_CROP = "32x26+766+82";
const EXPECTED_BUTTON_RUNS = Object.freeze([
  Object.freeze({
    firstFrame: 1,
    lastFrame: 156,
    visualState: "play-icon-visible",
    cropSignature: "9331f4ed672b7aad3388e8b912ebb0bc28e836198aa56a9c5c6045c46d57cb25",
  }),
  Object.freeze({
    firstFrame: 157,
    lastFrame: 562,
    visualState: "transitional-icon-hidden-or-hover",
    cropSignature: "5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701",
  }),
  Object.freeze({
    firstFrame: 563,
    lastFrame: 1069,
    visualState: "pause-icon-visible",
    cropSignature: "361aeafcc964387d3db68abcd67f5bb289c52f1ee7c48d91892424e1769dec3c",
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJson(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
}

export function validateSpanishAudioDiagnosticManifest(manifest) {
  invariant(manifest?.status === "raw-capture-not-yet-bound-to-runtime-trace",
    "audio diagnostic must remain an unpromoted raw capture");
  invariant(manifest.runtimeAuthorityClaimed === false && manifest.acceptanceEffect === "none",
    "audio diagnostic must not claim runtime authority or acceptance");
  invariant(manifest.evidenceType === "g4-l3-lossless-window-frame-and-system-audio-capture",
    "audio diagnostic evidence type drifted");
  invariant(manifest.configuration?.fps === "12" &&
    manifest.configuration.outputWidth === "800" &&
    manifest.configuration.outputHeight === "600" &&
    manifest.configuration.sourceRect === "0.0,28.0,800.0,600.0" &&
    manifest.configuration.audio === "system-audio-48kHz-2ch-ALAC",
  "audio diagnostic capture configuration drifted");
  invariant(manifest.window?.ownerName === "Flash Player" &&
    manifest.window.title === EXPECTED_WINDOW_TITLE,
  "audio diagnostic Flash Player window binding drifted");
  invariant(manifest.droppedOrIncompleteFrameCount === 0 &&
    Array.isArray(manifest.frames) && manifest.frames.length === 1069,
  "audio diagnostic must contain 1069 complete frames with zero drops");
  invariant(manifest.frames.every((frame, index) =>
    frame.ordinal === index + 1 && frame.status === "complete" &&
    frame.width === 800 && frame.height === 600 &&
    frame.file === `frames/frame-${String(index + 1).padStart(6, "0")}.png` &&
    /^[a-f0-9]{64}$/.test(frame.sha256)),
  "audio diagnostic frame inventory is incomplete or malformed");
  invariant(manifest.audio?.codec === "Apple Lossless Audio Codec" &&
    manifest.audio.sampleRate === 48000 && manifest.audio.channels === 2 &&
    manifest.audio.outputFile === "system-audio-lossless.m4a" &&
    manifest.audio.outputSha256 === EXPECTED_CAPTURE_AUDIO_SHA256,
  "audio diagnostic lossless audio binding drifted");
  return true;
}

export function classifySpanishAudioEvidence({captureProbe, sourceProbe}) {
  const capturedSilenceSeconds = captureProbe.totalSilenceDurationSeconds ??
    captureProbe.silenceDurationSeconds;
  const capturedAudioDigitalSilence = captureProbe.maxVolumeDb <= -90 &&
    capturedSilenceSeconds >= captureProbe.durationSeconds - 0.2;
  const sourceMp3NonSilent = sourceProbe.maxVolumeDb > -80 && sourceProbe.meanVolumeDb > -80;
  const runtimeAudioEmissionObservedCandidate = !capturedAudioDigitalSilence;
  return Object.freeze({
    capturedAudioDigitalSilence,
    sourceMp3NonSilent,
    runtimeAudioEmissionObservedCandidate,
    causalAttributionAvailable: false,
    // This diagnostic has no event/media-request/source-match chain. Even a
    // non-silent system capture may be a notification or unrelated process,
    // so it must never establish Flash runtime emission.
    runtimeAudioEmissionEstablished: false,
    audioAcceptance: false,
    strictAcceptanceEffect: "none",
  });
}

function groupSignatures(signatures) {
  const runs = [];
  signatures.forEach((signature, index) => {
    const ordinal = index + 1;
    const current = runs.at(-1);
    if (current?.cropSignature === signature) {
      current.lastFrame = ordinal;
    } else {
      runs.push({firstFrame: ordinal, lastFrame: ordinal, cropSignature: signature});
    }
  });
  return runs;
}

export function validateButtonRuns(runs) {
  invariant(runs.length === EXPECTED_BUTTON_RUNS.length,
    "Spanish-audio button crop must contain exactly three observed visual runs");
  runs.forEach((run, index) => {
    const expected = EXPECTED_BUTTON_RUNS[index];
    invariant(run.firstFrame === expected.firstFrame &&
      run.lastFrame === expected.lastFrame &&
      run.cropSignature === expected.cropSignature,
    `Spanish-audio button visual run ${index + 1} drifted`);
  });
  return EXPECTED_BUTTON_RUNS.map((expected) => ({...expected}));
}

async function resolveTool(command) {
  const {stdout} = await execFile("/usr/bin/which", [command]);
  const commandPath = stdout.trim();
  invariant(path.isAbsolute(commandPath), `cannot resolve ${command}`);
  const executableRealPath = await realpath(commandPath);
  const executableBytes = await readFile(executableRealPath);
  const versionArgs = command === "magick" ? ["-version"] : ["-version"];
  const version = await execFile(commandPath, versionArgs, {maxBuffer: 8 * 1024 * 1024});
  return {
    command,
    commandPath,
    executableRealPath,
    executableSha256: sha256(executableBytes),
    versionFirstLine: `${version.stdout}${version.stderr}`.split(/\r?\n/)[0],
  };
}

async function captureButtonRuns(manifest, magickPath) {
  const signatures = [];
  const batchSize = 200;
  for (let offset = 0; offset < manifest.frames.length; offset += batchSize) {
    const batch = manifest.frames.slice(offset, offset + batchSize);
    const args = [
      ...batch.map((frame) => projectPath(`${CAPTURE_DIRECTORY}/${frame.file}`)),
      "-crop", BUTTON_CROP,
      "+repage",
      "-format", "%#\\n",
      "info:",
    ];
    const {stdout} = await execFile(magickPath, args, {maxBuffer: 16 * 1024 * 1024});
    const batchSignatures = stdout.trim().split(/\r?\n/).filter(Boolean);
    invariant(batchSignatures.length === batch.length,
      `ImageMagick returned ${batchSignatures.length} signatures for ${batch.length} frames`);
    signatures.push(...batchSignatures);
  }
  return validateButtonRuns(groupSignatures(signatures));
}

export function parseVolume(stderr) {
  const mean = stderr.match(/mean_volume:\s*(-?[\d.]+) dB/);
  const max = stderr.match(/max_volume:\s*(-?[\d.]+) dB/);
  const silence = [...stderr.matchAll(/silence_duration:\s*([\d.]+)/g)].map((match) => Number(match[1]));
  invariant(mean && max && silence.length > 0, "ffmpeg volume/silence output is incomplete");
  return {
    meanVolumeDb: Number(mean[1]),
    maxVolumeDb: Number(max[1]),
    silenceIntervalCount: silence.length,
    totalSilenceDurationSeconds: silence.reduce((sum, duration) => sum + duration, 0),
    longestSilenceDurationSeconds: Math.max(...silence),
  };
}

async function probeAudio(relativePath, ffprobePath, ffmpegPath) {
  const absolutePath = projectPath(relativePath);
  const bytes = await readFile(absolutePath);
  const probe = await execFile(ffprobePath, [
    "-v", "error",
    "-show_entries", "format=duration,size:stream=codec_name,sample_rate,channels",
    "-of", "json",
    absolutePath,
  ], {maxBuffer: 8 * 1024 * 1024});
  const parsed = JSON.parse(probe.stdout);
  invariant(parsed.streams?.length === 1, `expected one audio stream in ${relativePath}`);
  const volume = await execFile(ffmpegPath, [
    "-hide_banner", "-nostats", "-i", absolutePath,
    "-af", "volumedetect,silencedetect=noise=-80dB:d=0.1",
    "-f", "null", "-",
  ], {maxBuffer: 16 * 1024 * 1024});
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    codec: parsed.streams[0].codec_name,
    sampleRate: Number(parsed.streams[0].sample_rate),
    channels: Number(parsed.streams[0].channels),
    durationSeconds: Number(parsed.format.duration),
    ...parseVolume(volume.stderr),
  };
}

function markdown(report) {
  const runs = report.runtimeControl.buttonVisualRuns.map((run) =>
    `| ${run.firstFrame}-${run.lastFrame} | ${run.firstRelativeTimeSeconds.toFixed(3)}-${run.lastRelativeTimeSeconds.toFixed(3)} | ${run.visualState} | \`${run.cropSignature}\` |`).join("\n");
  return `# G4 L3 TS006 Spanish-audio diagnostic\n\n` +
    `This report binds an unattended current-admin-account Flash Player diagnostic. It is failure evidence for engineering, not promotable original-runtime or strict-acceptance evidence.\n\n` +
    `## Result\n\n` +
    `- Complete 800×600 frames: ${report.capture.frameCount}; dropped/incomplete: ${report.capture.droppedOrIncompleteFrameCount}\n` +
    `- Lossless session audio: ${report.capture.audio.durationSeconds.toFixed(3)} seconds, ALAC 48 kHz stereo\n` +
    `- Captured session audio mean/max: ${report.capture.audio.meanVolumeDb.toFixed(1)} / ${report.capture.audio.maxVolumeDb.toFixed(1)} dB\n` +
    `- Source L3TS06.mp3 mean/max: ${report.sourceAudio.meanVolumeDb.toFixed(1)} / ${report.sourceAudio.maxVolumeDb.toFixed(1)} dB\n` +
    `- Runtime control advanced to pause visual state: ${report.runtimeControl.advancedToPauseVisualState}\n` +
    `- Captured audio is digital silence: ${report.conclusion.capturedAudioDigitalSilence}\n` +
    `- Source MP3 is non-silent: ${report.conclusion.sourceMp3NonSilent}\n` +
    `- Non-silent runtime-audio candidate observed: ${report.conclusion.runtimeAudioEmissionObservedCandidate}\n` +
    `- Causal attribution available: ${report.conclusion.causalAttributionAvailable}\n` +
    `- Runtime audio emission established: ${report.conclusion.runtimeAudioEmissionEstablished}\n` +
    `- Audio acceptance: **false**\n` +
    `- Strict acceptance effect: **none**\n\n` +
    `| Capture frames | Relative seconds | Button visual state | Crop signature |\n|---:|---:|---|---|\n${runs}\n\n` +
    `## ActionScript finding\n\n` +
    `The audited shell ActionScript derives the external audio URL from the current child SWF filename, appends \`/SA/<basename>.mp3\`, calls streaming \`loadSound\`, and then calls \`start\`. For this target the expected source is L3TS06.mp3. The visual control state changed, but the 90-second lossless session audio remained digital silence even though the bound MP3 is technically valid and non-silent.\n\n` +
    `## Boundary and next diagnostic\n\n` +
    `This does not establish Spanish spoken-language identity, timing, listening quality, runtime parity, human review, Owner acceptance, or strict completion. A same-hash read-only host copy whose path contained no spaces reproduced the missing audio, so path whitespace is not supported as the cause. The remaining leading hypothesis is the legacy Flash trusted-local sandbox or another standalone-player load failure; it remains a hypothesis until a separately approved, reversible trust/trace experiment records the result.\n`;
}

export async function analyzeG4L3Ts006SpanishAudioDiagnostic() {
  const [{bytes: manifestBytes, value: manifest}, shellScriptsBytes, tools] = await Promise.all([
    readJson(CAPTURE_MANIFEST),
    readFile(projectPath(SHELL_SCRIPTS)),
    Promise.all([resolveTool("magick"), resolveTool("ffprobe"), resolveTool("ffmpeg")]),
  ]);
  validateSpanishAudioDiagnosticManifest(manifest);
  const [magickTool, ffprobeTool, ffmpegTool] = tools;
  const shellScripts = gunzipSync(shellScriptsBytes).toString("utf8");
  const actionScriptFragments = [
    "function doPlaySpanishAudio()",
    'SndFName = _global.tempURL + "/SA/" + SSTemFName[0] + ".mp3";',
    "_global.gSound.loadSound(SndFName,1);",
    "_global.gSound.start();",
  ];
  actionScriptFragments.forEach((fragment) => invariant(shellScripts.includes(fragment),
    `audited shell ActionScript no longer contains: ${fragment}`));

  const [buttonRuns, captureAudio, sourceAudio, scriptBytes] = await Promise.all([
    captureButtonRuns(manifest, magickTool.commandPath),
    probeAudio(CAPTURE_AUDIO, ffprobeTool.commandPath, ffmpegTool.commandPath),
    probeAudio(SOURCE_AUDIO, ffprobeTool.commandPath, ffmpegTool.commandPath),
    readFile(SCRIPT_PATH),
  ]);
  invariant(captureAudio.sha256 === EXPECTED_CAPTURE_AUDIO_SHA256,
    "captured session audio hash drifted");
  invariant(sourceAudio.sha256 === EXPECTED_SOURCE_AUDIO_SHA256,
    "TS006 source MP3 hash drifted");
  const conclusion = classifySpanishAudioEvidence({captureProbe: captureAudio, sourceProbe: sourceAudio});
  invariant(conclusion.capturedAudioDigitalSilence && conclusion.sourceMp3NonSilent,
    "Spanish-audio diagnostic classification no longer matches the bound media");

  const report = {
    schemaVersion: 2,
    reportType: "g4-l3-ts006-spanish-audio-diagnostic",
    animationId: "course-g04-l03-ts-006",
    classification: "current-admin-account-runtime-audio-failure-diagnostic-not-strict-evidence",
    authority: {
      runtimeAuthorityClaimed: false,
      audioParityClaimed: false,
      spanishLanguageAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictAcceptanceEffect: "none",
    },
    capture: {
      manifest: {
        path: CAPTURE_MANIFEST,
        bytes: manifestBytes.length,
        sha256: sha256(manifestBytes),
      },
      startedAt: manifest.startedAt,
      endedAt: manifest.endedAt,
      windowTitle: manifest.window.title,
      frameCount: manifest.frames.length,
      droppedOrIncompleteFrameCount: manifest.droppedOrIncompleteFrameCount,
      stage: {width: 800, height: 600},
      nominalFps: 12,
      audio: captureAudio,
    },
    runtimeControl: {
      crop: BUTTON_CROP,
      buttonVisualRuns: buttonRuns.map((run) => ({
        ...run,
        firstRelativeTimeSeconds: manifest.frames[run.firstFrame - 1].relativeTimeSeconds,
        lastRelativeTimeSeconds: manifest.frames[run.lastFrame - 1].relativeTimeSeconds,
      })),
      advancedToPauseVisualState: buttonRuns.at(-1)?.visualState === "pause-icon-visible",
      interpretation:
        "The control reached the pause-icon state, establishing UI state change only; it does not establish decoded or emitted audio.",
    },
    sourceAudio,
    actionScript: {
      auditPath: SHELL_SCRIPTS,
      auditCompressedBytes: shellScriptsBytes.length,
      auditCompressedSha256: sha256(shellScriptsBytes),
      verifiedFragments: actionScriptFragments,
      expectedRuntimeUrl:
        "file:///Volumes/WestWorld/HELP%20MATH%202.0/work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3",
      finding:
        "The shell derives /SA/L3TS06.mp3, invokes streaming loadSound, and then start; the diagnostic does not establish a successful file open, decode, or emitted sound.",
    },
    pathWhitespaceExperiment: {
      classification: "unsigned-current-turn-diagnostic-observation",
      readOnlyCopyRoot: "/Volumes/WestWorld/HM2_DIAG_TS006",
      sourceSwfSha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
      sourceMp3Sha256: EXPECTED_SOURCE_AUDIO_SHA256,
      naturalEntry: "TS002 -> TS003 -> TS004 -> TS005 -> TS006",
      result:
        "The TS006 control again reached the pause-icon state without an observed L3TS06.mp3 file handle; whitespace is not supported as the cause.",
      strictAcceptanceEffect: "none",
    },
    conclusion,
    unresolved: [
      "The capture used the current administrator account and is diagnostic-only.",
      "The control-state transition does not establish an authoritative audio trigger or successful media load.",
      "The trusted-local sandbox/load-failure explanation remains a hypothesis pending a reversible trust/trace experiment.",
      "Spoken-language identity, cue timing, listening quality, independent review, Owner acceptance, and strict completion remain pending.",
    ],
    tools: {magick: magickTool, ffprobe: ffprobeTool, ffmpeg: ffmpegTool},
    generator: {
      path: portable(path.relative(ROOT, SCRIPT_PATH)),
      sha256: sha256(scriptBytes),
    },
    strictAcceptanceEffect: "none",
  };
  invariant(report.runtimeControl.advancedToPauseVisualState,
    "audio diagnostic did not reach the expected pause-icon visual state");
  await Promise.all([
    writeFile(projectPath(REPORT_JSON), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(projectPath(REPORT_MARKDOWN), markdown(report)),
  ]);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  analyzeG4L3Ts006SpanishAudioDiagnostic().then((report) => {
    console.log(JSON.stringify({
      frameCount: report.capture.frameCount,
      buttonVisualRuns: report.runtimeControl.buttonVisualRuns.length,
      capturedAudioDigitalSilence: report.conclusion.capturedAudioDigitalSilence,
      sourceMp3NonSilent: report.conclusion.sourceMp3NonSilent,
      runtimeAudioEmissionEstablished: report.conclusion.runtimeAudioEmissionEstablished,
      strictAcceptanceEffect: report.strictAcceptanceEffect,
    }, null, 2));
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
