#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {access, lstat, mkdir, readFile, readdir, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const PROBE_VERSION = 1;
const ARCHIVE_REPORT_RELATIVE = "reports/g4-l3-embedded-audio-archive.json";
const DEFAULT_JSON_RELATIVE = "reports/g4-l3-audio-cas-media-probe.json";
const DEFAULT_MARKDOWN_RELATIVE = "reports/g4-l3-audio-cas-media-probe.md";
const ARCHIVE_ROOT_RELATIVE = "artifacts/g4-l3-embedded-audio/sha256";
const CONCURRENCY = 4;

const FFPROBE_ENTRY_SPEC = [
  "stream=index,codec_name,codec_long_name,codec_type,profile,sample_fmt,sample_rate,channels,channel_layout,bits_per_sample,bits_per_raw_sample,time_base,start_pts,start_time,duration_ts,duration,bit_rate,nb_frames",
  "format=format_name,format_long_name,start_time,duration,size,bit_rate,probe_score",
  "frame=nb_samples",
].join(":");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function fingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value))));
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function projectPath(value, root = repositoryRoot) {
  return path.relative(path.resolve(root), path.resolve(value)).split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function integer(value) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function decimal(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeDiagnostic(text, root = repositoryRoot) {
  const absoluteRoot = `${path.resolve(root)}${path.sep}`;
  return String(text || "")
    .replaceAll(absoluteRoot, "")
    .replace(/@ 0x[0-9a-f]+/gi, "@ <process-address>")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
}

function diagnosticFact(text, root) {
  const normalized = normalizeDiagnostic(text, root);
  return {
    byteLength: Buffer.byteLength(normalized),
    sha256: sha256(Buffer.from(normalized)),
    text: normalized,
  };
}

async function runProcess(command, args, {cwd = repositoryRoot, maxBuffer = 64 * 1024 * 1024} = {}) {
  try {
    const result = await execFileAsync(command, args, {cwd, encoding: "utf8", maxBuffer});
    return {exitCode: 0, signal: null, stdout: result.stdout || "", stderr: result.stderr || ""};
  } catch (error) {
    return {
      exitCode: Number.isSafeInteger(error.code) ? error.code : null,
      signal: error.signal || null,
      stdout: typeof error.stdout === "string" ? error.stdout : "",
      stderr: typeof error.stderr === "string" ? error.stderr : String(error.message || error),
    };
  }
}

async function resolveExecutable(command, root = repositoryRoot) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(root, command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((directory) => path.join(directory, command));
  let resolvedCommandPath = null;
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      resolvedCommandPath = candidate;
      break;
    } catch {
      // Keep searching PATH.
    }
  }
  invariant(resolvedCommandPath, `Executable not found: ${command}`);
  const executableRealPath = await realpath(resolvedCommandPath);
  const executableBytes = await readFile(executableRealPath);
  const version = await runProcess(resolvedCommandPath, ["-version"], {cwd: root, maxBuffer: 8 * 1024 * 1024});
  invariant(version.exitCode === 0, `${command} -version failed`);
  const versionText = normalizeDiagnostic(`${version.stdout}${version.stderr}`, root);
  return {
    command,
    resolvedCommandPath,
    executableRealPath,
    executableBytes: executableBytes.length,
    executableSha256: sha256(executableBytes),
    versionFirstLine: versionText.split("\n").find(Boolean) || "",
    versionTextSha256: sha256(Buffer.from(versionText)),
    versionText,
  };
}

function publicToolBinding(binding) {
  return {
    command: binding.command,
    resolvedCommandPath: binding.resolvedCommandPath,
    executableRealPath: binding.executableRealPath,
    executableBytes: binding.executableBytes,
    executableSha256: binding.executableSha256,
    versionFirstLine: binding.versionFirstLine,
    versionTextSha256: binding.versionTextSha256,
    versionText: binding.versionText,
  };
}

export function normalizeFfprobePayload(payload) {
  invariant(payload && typeof payload === "object", "ffprobe payload must be an object");
  const audioStreams = (payload.streams || []).filter((stream) => stream.codec_type === "audio");
  invariant(audioStreams.length >= 1, "ffprobe returned no audio stream");
  const stream = audioStreams[0];
  const format = payload.format || {};
  const frames = Array.isArray(payload.frames) ? payload.frames : [];
  const frameSampleCounts = frames.map((frame) => integer(frame.nb_samples));
  const framesWithSampleCount = frameSampleCounts.filter((value) => value !== null);
  const allFramesHaveSampleCount = frames.length > 0 && framesWithSampleCount.length === frames.length;
  const durationSeconds = decimal(stream.duration) ?? decimal(format.duration);
  return {
    audioStreamCount: audioStreams.length,
    selectedStreamIndex: integer(stream.index),
    codec: {
      name: stream.codec_name || null,
      longName: stream.codec_long_name || null,
      type: stream.codec_type || null,
      profile: stream.profile || null,
      sampleFormat: stream.sample_fmt || null,
      bitsPerSample: integer(stream.bits_per_sample),
      bitsPerRawSample: integer(stream.bits_per_raw_sample),
      bitRateBps: integer(stream.bit_rate),
    },
    container: {
      formatName: format.format_name || null,
      formatLongName: format.format_long_name || null,
      byteLength: integer(format.size),
      bitRateBps: integer(format.bit_rate),
      probeScore: integer(format.probe_score),
    },
    audio: {
      sampleRateHz: integer(stream.sample_rate),
      channels: integer(stream.channels),
      channelLayout: stream.channel_layout || null,
    },
    timing: {
      timeBase: stream.time_base || null,
      startPts: integer(stream.start_pts),
      startTimeSecondsRaw: stream.start_time ?? format.start_time ?? null,
      durationTs: integer(stream.duration_ts),
      streamDurationSecondsRaw: stream.duration ?? null,
      containerDurationSecondsRaw: format.duration ?? null,
      durationSeconds,
    },
    sampleCount: {
      toolSupported: allFramesHaveSampleCount,
      basis: allFramesHaveSampleCount ? "sum-of-ffprobe-frame-nb_samples" : null,
      decodedAudioFrameCount: frames.length,
      framesWithSampleCount: framesWithSampleCount.length,
      value: allFramesHaveSampleCount ? framesWithSampleCount.reduce((sum, value) => sum + value, 0) : null,
    },
  };
}

function ffprobeArguments(objectPath) {
  return [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_frames",
    "-show_entries", FFPROBE_ENTRY_SPEC,
    "-of", "json",
    objectPath,
  ];
}

function ffmpegArguments(objectPath) {
  return [
    "-v", "error",
    "-xerror",
    "-nostdin",
    "-i", objectPath,
    "-map", "0:a:0",
    "-f", "null",
    "-",
  ];
}

export function buildObjectProbeRecord({object, sourceBytes, postProbeBytes, ffprobeResult, ffmpegResult, root = repositoryRoot}) {
  const preHash = sha256(sourceBytes);
  const postHash = sha256(postProbeBytes);
  invariant(preHash === object.sha256 && sourceBytes.length === object.byteLength,
    `${object.path}: pre-probe bytes differ from archive report`);
  invariant(postHash === preHash && postProbeBytes.length === sourceBytes.length,
    `${object.path}: media tools changed the 0444 CAS object`);
  let media = null;
  let parseError = null;
  if (ffprobeResult.exitCode === 0) {
    try {
      media = normalizeFfprobePayload(JSON.parse(ffprobeResult.stdout));
    } catch (error) {
      parseError = `ffprobe JSON normalization failed: ${error.message}`;
    }
  } else parseError = `ffprobe exited ${ffprobeResult.exitCode ?? ffprobeResult.signal ?? "without-code"}`;
  const ffprobeDiagnostic = diagnosticFact(ffprobeResult.stderr, root);
  const ffmpegDiagnostic = diagnosticFact(ffmpegResult.stderr, root);
  const ffprobeStdout = diagnosticFact(ffprobeResult.stdout, root);
  const probeStatus = !media
    ? "ffprobe-parse-failed"
    : (ffmpegResult.exitCode === 0
      ? "ffprobe-parsed-ffmpeg-decode-check-passed"
      : "ffprobe-parsed-ffmpeg-decode-check-failed");
  const record = {
    casObject: {
      path: object.path,
      sha256: object.sha256,
      byteLength: object.byteLength,
      formatCodeFromSwf: object.formatCode,
      sourceAudioUnitReferenceCount: object.sourceAudioUnitReferenceCount,
      logicalPayloadIdentityCount: object.logicalPayloadIdentityCount,
      physicalHashVerifiedBeforeProbe: true,
      physicalHashVerifiedAfterProbe: true,
      unchangedByProbe: true,
    },
    probeStatus,
    ffprobe: {
      arguments: ffprobeArguments(object.path),
      exitCode: ffprobeResult.exitCode,
      signal: ffprobeResult.signal,
      stdoutBytes: ffprobeStdout.byteLength,
      stdoutSha256: ffprobeStdout.sha256,
      stderr: ffprobeDiagnostic,
      jsonParsed: media !== null,
      parseError,
    },
    ffmpegDecodeToNull: {
      arguments: ffmpegArguments(object.path),
      exitCode: ffmpegResult.exitCode,
      signal: ffmpegResult.signal,
      stdout: diagnosticFact(ffmpegResult.stdout, root),
      stderr: ffmpegDiagnostic,
      decodeCheckPassed: ffmpegResult.exitCode === 0,
    },
    media,
    evidenceLimits: {
      languageEstablished: false,
      cueMappingEstablished: false,
      runtimeSynchronizationEstablished: false,
      audibleQualityEstablished: false,
      listeningAcceptanceEstablished: false,
      authoritativeRuntimeEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
    },
  };
  record.objectProbeFingerprintSha256 = fingerprint(record);
  return record;
}

async function probeObject(object, {root, ffprobe, ffmpeg}) {
  const absolute = path.resolve(root, object.path);
  const archiveRoot = path.join(root, ARCHIVE_ROOT_RELATIVE);
  invariant(isWithin(archiveRoot, absolute), `${object.path}: CAS object escapes archive root`);
  const information = await lstat(absolute);
  invariant(information.isFile() && !information.isSymbolicLink(), `${object.path}: CAS object is not a regular file`);
  const sourceBytes = await readFile(absolute);
  const [ffprobeResult, ffmpegResult] = await Promise.all([
    runProcess(ffprobe.resolvedCommandPath, ffprobeArguments(object.path), {cwd: root}),
    runProcess(ffmpeg.resolvedCommandPath, ffmpegArguments(object.path), {cwd: root}),
  ]);
  const postProbeBytes = await readFile(absolute);
  return buildObjectProbeRecord({object, sourceBytes, postProbeBytes, ffprobeResult, ffmpegResult, root});
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const output = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, values.length)}, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

async function assertExactArchiveSet(root, objects) {
  const archiveRoot = path.join(root, ARCHIVE_ROOT_RELATIVE);
  const files = [];
  const walk = async (directory) => {
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      invariant(!entry.isSymbolicLink(), `CAS archive contains a symbolic link: ${projectPath(absolute, root)}`);
      if (entry.isDirectory()) await walk(absolute);
      else {
        invariant(entry.isFile(), `CAS archive contains a non-file object: ${projectPath(absolute, root)}`);
        files.push(projectPath(absolute, root));
      }
    }
  };
  await walk(archiveRoot);
  files.sort();
  const expected = objects.map((object) => object.path).sort();
  invariant(JSON.stringify(files) === JSON.stringify(expected),
    `CAS archive file set differs: expected ${expected.length}, found ${files.length}`);
}

function validateArchiveReport(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === "g4-l3-embedded-audio-archive",
    "Embedded-audio archive report schema/type mismatch");
  invariant(report.archive?.archiveWritten === true && report.archive.allArchivedPayloadHashesVerified === true &&
    report.archive.plannedCasObjectCount === 88 && report.archive.archivedFileCount === 88 &&
    Array.isArray(report.archive.casObjects) && report.archive.casObjects.length === 88,
  "Embedded-audio archive is not a complete 88-object physical source");
  invariant(report.summary?.canonicalItems === 40 && report.summary.audioUnitCount === 359 &&
    Array.isArray(report.items) && report.items.length === 40, "Embedded-audio archive unit scope is invalid");
}

function unitSourceSampleFacts(unit) {
  if (unit.kind === "DefineSound") return {
    basis: "DefineSound.SoundSampleCount",
    declaredSampleCount: unit.soundHeader.declaredSampleCount,
    sampleRateHz: unit.soundHeader.sampleRateHz,
  };
  return {
    basis: unit.totalBlockHeaderSampleCount !== null
      ? "sum-of-MP3-SoundStreamBlock-explicit-sample-counts"
      : "SoundStreamHead-nominal-samples-per-block-only",
    nominalSamplesPerBlock: unit.head.nominalSamplesPerBlock,
    blockCount: unit.blockCount,
    totalBlockHeaderSampleCount: unit.totalBlockHeaderSampleCount,
    sampleRateHz: unit.head.sampleRateHz,
  };
}

function mediaReferenceSummary(probe) {
  return {
    casObjectSha256: probe.casObject.sha256,
    objectProbeFingerprintSha256: probe.objectProbeFingerprintSha256,
    probeStatus: probe.probeStatus,
    codecName: probe.media?.codec.name ?? null,
    containerFormatName: probe.media?.container.formatName ?? null,
    sampleRateHz: probe.media?.audio.sampleRateHz ?? null,
    channels: probe.media?.audio.channels ?? null,
    durationSeconds: probe.media?.timing.durationSeconds ?? null,
    decodedSampleCount: probe.media?.sampleCount.value ?? null,
    decodedSampleCountToolSupported: probe.media?.sampleCount.toolSupported ?? false,
    ffmpegDecodeCheckPassed: probe.ffmpegDecodeToNull.decodeCheckPassed,
  };
}

function buildUnitReferences(archiveReport, probesByPath) {
  return archiveReport.items.map((item) => {
    const units = [...item.embeddedAudio.defineSounds, ...item.embeddedAudio.soundStreams]
      .sort((left, right) => left.sourceOrder - right.sourceOrder)
      .map((unit) => {
        const probe = probesByPath.get(unit.payload.archivePath);
        invariant(probe, `${item.animationId}: no CAS probe for ${unit.payload.archivePath}`);
        const unitLabel = unit.kind === "DefineSound" ? `define-sound-${unit.soundId}` : `sound-stream-${unit.streamIndex}`;
        const reference = {
          unitReferenceId: `${item.animationId}/${unitLabel}/source-order-${unit.sourceOrder}`,
          animationId: item.animationId,
          batchId: item.batchId,
          unitKind: unit.kind,
          sourceOrder: unit.sourceOrder,
          ownerDomainId: unit.ownerDomainId,
          soundId: unit.kind === "DefineSound" ? unit.soundId : null,
          streamIndex: unit.kind === "SoundStream" ? unit.streamIndex : null,
          sourceFormatCode: unit.kind === "DefineSound" ? unit.soundHeader.formatCode : unit.head.formatCode,
          sourceFormat: unit.kind === "DefineSound" ? unit.soundHeader.format : unit.head.format,
          logicalPayloadIdentitySha256: unit.logicalPayloadIdentitySha256,
          payload: {
            path: unit.payload.archivePath,
            sha256: unit.payload.sha256,
            byteLength: unit.payload.byteLength,
          },
          sourceSampleFacts: unitSourceSampleFacts(unit),
          technicalProbe: mediaReferenceSummary(probe),
          evidenceLimits: {
            languageEstablished: false,
            cueMappingEstablished: false,
            runtimeSynchronizationEstablished: false,
            listeningAcceptanceEstablished: false,
            strictCompletionEstablished: false,
          },
        };
        reference.unitReferenceFingerprintSha256 = fingerprint(reference);
        return reference;
      });
    return {
      sequence: item.sequence,
      batchId: item.batchId,
      animationId: item.animationId,
      audioUnitReferenceCount: units.length,
      parsedReferenceCount: units.filter((unit) => unit.technicalProbe.probeStatus !== "ffprobe-parse-failed").length,
      parseFailedReferenceCount: units.filter((unit) => unit.technicalProbe.probeStatus === "ffprobe-parse-failed").length,
      ffmpegDecodeCheckPassedReferenceCount: units.filter((unit) => unit.technicalProbe.ffmpegDecodeCheckPassed).length,
      units,
    };
  });
}

export async function buildG4L3AudioCasMediaProbe({
  root = repositoryRoot,
  ffprobeCommand = "ffprobe",
  ffmpegCommand = "ffmpeg",
} = {}) {
  root = path.resolve(root);
  const [archiveBytes, scriptBytes, ffprobe, ffmpeg] = await Promise.all([
    readFile(path.join(root, ARCHIVE_REPORT_RELATIVE)),
    readFile(scriptPath),
    resolveExecutable(ffprobeCommand, root),
    resolveExecutable(ffmpegCommand, root),
  ]);
  const archiveReport = JSON.parse(archiveBytes);
  validateArchiveReport(archiveReport);
  const objects = [...archiveReport.archive.casObjects].sort((left, right) => left.path.localeCompare(right.path));
  await assertExactArchiveSet(root, objects);
  const probes = await mapWithConcurrency(objects, CONCURRENCY, (object) => probeObject(object, {root, ffprobe, ffmpeg}));
  const probesByPath = new Map(probes.map((probe) => [probe.casObject.path, probe]));
  const itemReferences = buildUnitReferences(archiveReport, probesByPath);
  const references = itemReferences.flatMap((item) => item.units);
  const statuses = Object.fromEntries([...new Set(probes.map((probe) => probe.probeStatus))].sort()
    .map((status) => [status, probes.filter((probe) => probe.probeStatus === status).length]));
  const referenceStatuses = Object.fromEntries([...new Set(references.map((reference) => reference.technicalProbe.probeStatus))].sort()
    .map((status) => [status, references.filter((reference) => reference.technicalProbe.probeStatus === status).length]));
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g4-l3-audio-cas-technical-media-probe",
    generator: {
      path: "scripts/build-g4-l3-audio-cas-media-probe.mjs",
      version: SCHEMA_VERSION,
      probeVersion: PROBE_VERSION,
      sha256: sha256(scriptBytes),
    },
    acceptance: {
      acceptanceNeutral: true,
      languageEstablished: false,
      cueMappingEstablished: false,
      runtimeSynchronizationEstablished: false,
      audibleQualityEstablished: false,
      listeningAcceptanceEstablished: false,
      authoritativeRuntimeEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      archiveObjectsChanged: 0,
      migrationsChanged: 0,
      productRenderersChanged: 0,
      approvalOrStatusChanges: 0,
      completionLedgerChanges: 0,
      statement:
        "This is a deterministic technical media parse/decode probe only. Codec/container metadata, tool-reported timing/sample facts, and decode-to-null results do not establish spoken language, cue mapping, runtime synchronization, audible content or quality, listening acceptance, authoritative playback, human/owner acceptance, parity, or strict completion.",
    },
    sourceBindings: {
      embeddedAudioArchiveReport: {
        path: ARCHIVE_REPORT_RELATIVE,
        bytes: archiveBytes.length,
        sha256: sha256(archiveBytes),
        archiveSetSha256: archiveReport.archive.archiveSetSha256,
        casObjectCount: archiveReport.archive.plannedCasObjectCount,
        sourceAudioUnitReferenceCount: archiveReport.archive.sourceAudioUnitReferenceCount,
      },
      tools: {
        ffprobe: publicToolBinding(ffprobe),
        ffmpeg: publicToolBinding(ffmpeg),
      },
      allCasObjectHashesVerifiedBeforeAndAfterProbe: probes.every((probe) => probe.casObject.unchangedByProbe),
      exactArchiveFileSetVerified: true,
    },
    probeContract: {
      concurrency: CONCURRENCY,
      ffprobeArgumentsBeforeObjectPath: ffprobeArguments("<cas-object-path>").slice(0, -1),
      ffmpegArgumentsBeforeObjectPath: ffmpegArguments("<cas-object-path>").slice(0, 5),
      ffmpegArgumentsAfterObjectPath: ffmpegArguments("<cas-object-path>").slice(6),
      sampleCountBasis:
        "When every selected ffprobe audio frame exposes nb_samples, decodedSampleCount is their integer sum. It is a tool-reported decoded-frame fact, not runtime synchronization or listening evidence.",
      decodeCheckBasis:
        "ffmpeg -xerror decodes the selected first audio stream to the null muxer. No decoded media is written or played.",
    },
    lesson: {
      grade: 4,
      lesson: 3,
      canonicalItems: 40,
      activeXmlReferencedPages: 39,
      courseShells: 1,
    },
    summary: {
      casObjectCount: probes.length,
      casObjectBytes: probes.reduce((sum, probe) => sum + probe.casObject.byteLength, 0),
      casObjectProbeStatuses: statuses,
      ffprobeParsedObjectCount: probes.filter((probe) => probe.media !== null).length,
      ffprobeParseFailedObjectCount: probes.filter((probe) => probe.media === null).length,
      ffmpegDecodeCheckPassedObjectCount: probes.filter((probe) => probe.ffmpegDecodeToNull.decodeCheckPassed).length,
      ffmpegDecodeCheckFailedObjectCount: probes.filter((probe) => !probe.ffmpegDecodeToNull.decodeCheckPassed).length,
      sampleCountToolSupportedObjectCount: probes.filter((probe) => probe.media?.sampleCount.toolSupported).length,
      sourceAudioUnitReferenceCount: references.length,
      referenceProbeStatuses: referenceStatuses,
      ffprobeParsedReferenceCount: references.filter((reference) => reference.technicalProbe.probeStatus !== "ffprobe-parse-failed").length,
      ffprobeParseFailedReferenceCount: references.filter((reference) => reference.technicalProbe.probeStatus === "ffprobe-parse-failed").length,
      ffmpegDecodeCheckPassedReferenceCount: references.filter((reference) => reference.technicalProbe.ffmpegDecodeCheckPassed).length,
      probeObjectSetSha256: fingerprint(probes.map((probe) => ({
        path: probe.casObject.path,
        objectProbeFingerprintSha256: probe.objectProbeFingerprintSha256,
      }))),
      unitReferenceSetSha256: fingerprint(references.map((reference) => ({
        unitReferenceId: reference.unitReferenceId,
        unitReferenceFingerprintSha256: reference.unitReferenceFingerprintSha256,
      }))),
    },
    casObjectProbes: probes,
    itemReferences,
  };
  return validateG4L3AudioCasMediaProbe(report);
}

export function validateG4L3AudioCasMediaProbe(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === "g4-l3-audio-cas-technical-media-probe",
    "G4 L3 media probe schema/type mismatch");
  invariant(report.generator?.path === "scripts/build-g4-l3-audio-cas-media-probe.mjs" &&
    report.generator.version === SCHEMA_VERSION && report.generator.probeVersion === PROBE_VERSION &&
    /^[a-f0-9]{64}$/.test(report.generator.sha256 || ""), "Media probe generator binding is invalid");
  invariant(report.acceptance?.acceptanceNeutral === true, "Media probe must remain acceptance-neutral");
  for (const field of [
    "languageEstablished", "cueMappingEstablished", "runtimeSynchronizationEstablished", "audibleQualityEstablished",
    "listeningAcceptanceEstablished", "authoritativeRuntimeEstablished", "humanReviewEstablished",
    "ownerAcceptanceEstablished", "strictCompletionEstablished",
  ]) invariant(report.acceptance[field] === false, `acceptance.${field} must remain false`);
  for (const field of ["archiveObjectsChanged", "migrationsChanged", "productRenderersChanged", "approvalOrStatusChanges", "completionLedgerChanges"]) {
    invariant(report.acceptance[field] === 0, `acceptance.${field} must remain zero`);
  }
  invariant(report.sourceBindings?.embeddedAudioArchiveReport?.casObjectCount === 88 &&
    report.sourceBindings.embeddedAudioArchiveReport.sourceAudioUnitReferenceCount === 359 &&
    report.sourceBindings.allCasObjectHashesVerifiedBeforeAndAfterProbe === true &&
    report.sourceBindings.exactArchiveFileSetVerified === true, "Media probe source binding is incomplete");
  for (const tool of ["ffprobe", "ffmpeg"]) {
    const binding = report.sourceBindings.tools?.[tool];
    invariant(binding && /^[a-f0-9]{64}$/.test(binding.executableSha256 || "") &&
      /^[a-f0-9]{64}$/.test(binding.versionTextSha256 || "") && binding.versionFirstLine.startsWith(`${tool} version `),
    `${tool} executable/version binding is invalid`);
  }
  invariant(report.lesson?.canonicalItems === 40 && report.lesson.activeXmlReferencedPages === 39 && report.lesson.courseShells === 1,
    "Media probe lesson scope is invalid");
  invariant(Array.isArray(report.casObjectProbes) && report.casObjectProbes.length === 88 &&
    new Set(report.casObjectProbes.map((probe) => probe.casObject.path)).size === 88,
  "Media probe must contain 88 unique CAS objects");
  for (const probe of report.casObjectProbes) {
    invariant(probe.casObject.physicalHashVerifiedBeforeProbe === true &&
      probe.casObject.physicalHashVerifiedAfterProbe === true && probe.casObject.unchangedByProbe === true,
    `${probe.casObject.path}: CAS object mutation/hash boundary failed`);
    invariant(Object.values(probe.evidenceLimits || {}).every((value) => value === false),
      `${probe.casObject.path}: technical probe crossed an evidence boundary`);
    invariant(probe.probeStatus === (probe.media === null
      ? "ffprobe-parse-failed"
      : (probe.ffmpegDecodeToNull.decodeCheckPassed
        ? "ffprobe-parsed-ffmpeg-decode-check-passed"
        : "ffprobe-parsed-ffmpeg-decode-check-failed")), `${probe.casObject.path}: stale probe status`);
    if (probe.media?.sampleCount.toolSupported) invariant(Number.isSafeInteger(probe.media.sampleCount.value) &&
      probe.media.sampleCount.value >= 0 && probe.media.sampleCount.basis === "sum-of-ffprobe-frame-nb_samples",
    `${probe.casObject.path}: invalid tool-supported sample count`);
    const copy = structuredClone(probe);
    delete copy.objectProbeFingerprintSha256;
    invariant(probe.objectProbeFingerprintSha256 === fingerprint(copy), `${probe.casObject.path}: stale object probe fingerprint`);
  }
  invariant(Array.isArray(report.itemReferences) && report.itemReferences.length === 40 &&
    new Set(report.itemReferences.map((item) => item.animationId)).size === 40, "Media probe item references are incomplete");
  const references = report.itemReferences.flatMap((item) => item.units);
  invariant(references.length === 359 && report.summary?.sourceAudioUnitReferenceCount === 359,
    "Media probe must aggregate all 359 source audio-unit references");
  const probeByHash = new Map(report.casObjectProbes.map((probe) => [probe.casObject.sha256, probe]));
  for (const reference of references) {
    const probe = probeByHash.get(reference.payload.sha256);
    invariant(probe && reference.technicalProbe.objectProbeFingerprintSha256 === probe.objectProbeFingerprintSha256 &&
      reference.technicalProbe.probeStatus === probe.probeStatus,
    `${reference.unitReferenceId}: unit reference is not bound to its CAS probe`);
    invariant(Object.values(reference.evidenceLimits || {}).every((value) => value === false),
      `${reference.unitReferenceId}: unit reference crossed an evidence boundary`);
    const copy = structuredClone(reference);
    delete copy.unitReferenceFingerprintSha256;
    invariant(reference.unitReferenceFingerprintSha256 === fingerprint(copy), `${reference.unitReferenceId}: stale unit reference fingerprint`);
  }
  invariant(report.summary.casObjectCount === 88 && report.summary.casObjectBytes ===
    report.casObjectProbes.reduce((sum, probe) => sum + probe.casObject.byteLength, 0), "Media probe object summary is stale");
  invariant(report.summary.ffprobeParsedObjectCount + report.summary.ffprobeParseFailedObjectCount === 88 &&
    report.summary.ffmpegDecodeCheckPassedObjectCount + report.summary.ffmpegDecodeCheckFailedObjectCount === 88,
  "Media probe pass/failure counts are stale");
  invariant(report.summary.probeObjectSetSha256 === fingerprint(report.casObjectProbes.map((probe) => ({
    path: probe.casObject.path,
    objectProbeFingerprintSha256: probe.objectProbeFingerprintSha256,
  }))), "Media probe object-set fingerprint is stale");
  invariant(report.summary.unitReferenceSetSha256 === fingerprint(references.map((reference) => ({
    unitReferenceId: reference.unitReferenceId,
    unitReferenceFingerprintSha256: reference.unitReferenceFingerprintSha256,
  }))), "Media probe unit-reference-set fingerprint is stale");
  return report;
}

export function renderG4L3AudioCasMediaProbeMarkdown(report) {
  const rows = report.itemReferences.map((item) =>
    `| ${item.sequence} | ${item.batchId} | \`${item.animationId}\` | ${item.audioUnitReferenceCount} | ${item.parsedReferenceCount} | ${item.parseFailedReferenceCount} | ${item.ffmpegDecodeCheckPassedReferenceCount} |`);
  const statusRows = Object.entries(report.summary.casObjectProbeStatuses)
    .map(([status, count]) => `| \`${status}\` | ${count} |`);
  return [
    "# G4 L3 Audio CAS Technical Media Probe",
    "",
    "> Acceptance-neutral machine probe only. These results do not establish language, cue mapping, synchronization, audible quality, listening, runtime behavior, human/owner acceptance, parity, or strict completion.",
    "",
    "## Result",
    "",
    `- Source: ${report.summary.casObjectCount} exact CAS objects (${report.summary.casObjectBytes} bytes) bound to archive-set SHA-256 \`${report.sourceBindings.embeddedAudioArchiveReport.archiveSetSha256}\`.`,
    `- ffprobe: ${report.summary.ffprobeParsedObjectCount} objects parsed; ${report.summary.ffprobeParseFailedObjectCount} parse failures retained explicitly.`,
    `- ffmpeg decode-to-null: ${report.summary.ffmpegDecodeCheckPassedObjectCount} passed; ${report.summary.ffmpegDecodeCheckFailedObjectCount} failed. No decoded output was written or played.`,
    `- Sample counts: ${report.summary.sampleCountToolSupportedObjectCount} objects exposed complete per-frame ffprobe \`nb_samples\` data.`,
    `- References: all ${report.summary.sourceAudioUnitReferenceCount} DefineSound/SoundStream references are linked to their exact CAS probe result.`,
    `- Immutability: the exact archive file set and every object hash were verified before and after probing.`,
    "",
    "## Tool bindings",
    "",
    `- ffprobe: ${report.sourceBindings.tools.ffprobe.versionFirstLine}; executable SHA-256 \`${report.sourceBindings.tools.ffprobe.executableSha256}\`; version-text SHA-256 \`${report.sourceBindings.tools.ffprobe.versionTextSha256}\`.`,
    `- ffmpeg: ${report.sourceBindings.tools.ffmpeg.versionFirstLine}; executable SHA-256 \`${report.sourceBindings.tools.ffmpeg.executableSha256}\`; version-text SHA-256 \`${report.sourceBindings.tools.ffmpeg.versionTextSha256}\`.`,
    "",
    "## CAS probe statuses",
    "",
    "| Status | Objects |",
    "|---|---:|",
    ...statusRows,
    "",
    "## Per-item reference aggregation",
    "",
    "| # | Batch | Animation | Units | Parsed | Parse failed | Decode passed |",
    "|---:|---|---|---:|---:|---:|---:|",
    ...rows,
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

async function assertSafeReportOutput(root, relativePath, extension) {
  const reportsRoot = path.join(root, "reports");
  const output = path.resolve(root, relativePath);
  invariant(isWithin(reportsRoot, output) && path.extname(output) === extension,
    `Report output must be a ${extension} file inside reports/`);
  const relative = path.relative(root, output);
  let cursor = root;
  for (const component of relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(!information?.isSymbolicLink(), `Report output contains a symbolic link: ${projectPath(cursor, root)}`);
  }
  return output;
}

async function writeOrCheck(relativePath, expected, {root, extension, check}) {
  const output = await assertSafeReportOutput(root, relativePath, extension);
  if (check) {
    const observed = await readFile(output, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(observed === expected, `${relativePath} is missing or stale`);
    return;
  }
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, expected);
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ffprobeCommand: "ffprobe",
    ffmpegCommand: "ffmpeg",
    jsonOutput: DEFAULT_JSON_RELATIVE,
    markdownOutput: DEFAULT_MARKDOWN_RELATIVE,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--ffprobe", "--ffmpeg", "--json-output", "--markdown-output"].includes(argument)) {
      const value = argv[++index];
      invariant(value, `${argument} requires a value`);
      if (argument === "--ffprobe") options.ffprobeCommand = value;
      else if (argument === "--ffmpeg") options.ffmpegCommand = value;
      else if (argument === "--json-output") options.jsonOutput = value;
      else options.markdownOutput = value;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-g4-l3-audio-cas-media-probe.mjs [options]\n\n` +
    `  --check                       Re-probe all objects and verify reports byte-for-byte\n` +
    `  --ffprobe <command>           ffprobe executable (default: ffprobe)\n` +
    `  --ffmpeg <command>            ffmpeg executable (default: ffmpeg)\n` +
    `  --json-output <reports/...>   JSON report path\n` +
    `  --markdown-output <reports/>  Markdown report path\n`;
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const report = await buildG4L3AudioCasMediaProbe({
    ffprobeCommand: options.ffprobeCommand,
    ffmpegCommand: options.ffmpegCommand,
  });
  await Promise.all([
    writeOrCheck(options.jsonOutput, jsonText(report), {root: repositoryRoot, extension: ".json", check: options.check}),
    writeOrCheck(options.markdownOutput, renderG4L3AudioCasMediaProbeMarkdown(report), {
      root: repositoryRoot,
      extension: ".md",
      check: options.check,
    }),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${report.summary.casObjectCount} CAS objects; ` +
    `${report.summary.ffprobeParsedObjectCount} parsed; ${report.summary.ffprobeParseFailedObjectCount} parse failures; ` +
    `${report.summary.ffmpegDecodeCheckPassedObjectCount} decode checks passed; acceptance effect none\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
