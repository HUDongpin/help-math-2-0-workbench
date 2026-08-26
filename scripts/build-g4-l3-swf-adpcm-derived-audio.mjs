#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {access, chmod, lstat, mkdir, readFile, readdir, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  SWF_ADPCM_INDEX_TABLES,
  SWF_ADPCM_STEP_SIZE_TABLE,
  decodeSwfAdpcmBlocks,
  encodePcm16LeWav,
} from "./lib/swf-adpcm.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const decoderPath = path.join(repositoryRoot, "scripts", "lib", "swf-adpcm.mjs");
const SCHEMA_VERSION = 1;
const REPORT_TYPE = "g4-l3-swf-adpcm-derived-audio-technical-binding";
const SOURCE_SHA256 = "e5c99e029d9df7717bc7755b5f4660841ad3f453d10bb8dbc8010d69b5a653b6";
const SOURCE_RELATIVE = `artifacts/g4-l3-embedded-audio/sha256/e5/${SOURCE_SHA256}.bin`;
const ARCHIVE_REPORT_RELATIVE = "reports/g4-l3-embedded-audio-archive.json";
const PRIOR_PROBE_REPORT_RELATIVE = "reports/g4-l3-audio-cas-media-probe.json";
const DERIVED_ROOT_RELATIVE = "artifacts/g4-l3-embedded-audio-derived";
const DERIVED_SHA_ROOT_RELATIVE = `${DERIVED_ROOT_RELATIVE}/sha256`;
const DEFAULT_JSON_RELATIVE = "reports/g4-l3-swf-adpcm-derived-audio.json";
const DEFAULT_MARKDOWN_RELATIVE = "reports/g4-l3-swf-adpcm-derived-audio.md";
const SAMPLE_RATE_HZ = 5512;
const CHANNELS = 1;
const SAMPLE_SIZE_BITS = 16;
const BLOCK_COUNT = 13;
const BLOCK_BYTES = 290;
const SAMPLES_PER_BLOCK = 459;
const EXPECTED_REFERENCE_IDS = Object.freeze([
  "course-g04-l03-in-004/sound-stream-4/source-order-4",
  "course-g04-l03-ti-002/sound-stream-3/source-order-3",
  "course-g04-l03-ts-008/sound-stream-10/source-order-10",
  "course-g04-l03-vb-008/sound-stream-10/source-order-10",
]);

const FFPROBE_ENTRY_SPEC = [
  "stream=index,codec_name,codec_long_name,codec_type,sample_fmt,sample_rate,channels,channel_layout,bits_per_sample,bits_per_raw_sample,time_base,start_pts,start_time,duration_ts,duration,bit_rate,nb_frames",
  "format=format_name,format_long_name,start_time,duration,size,bit_rate,probe_score",
  "frame=nb_samples",
].join(":");

const SPECIFICATION = Object.freeze({
  title: "SWF File Format Specification Version 19",
  publisher: "Adobe Systems Incorporated",
  version: 19,
  url: "https://open-flash.github.io/mirrors/swf-spec-19.pdf",
  evidencePages: Object.freeze([
    {pages: "13", use: "SWF byte order, bit order, and signed integer representation"},
    {pages: "177-178", use: "audio format 1 and exact 5.5 kHz rate of 5512 Hz"},
    {pages: "186-188", use: "ADPCM code sizes, index tables, and mono/stereo packet fields"},
  ]),
  implementationConstraint:
    "The decoder constants and packet algorithm are implemented from the Adobe SWF v19 ADPCM contract; no third-party decoder output is used as an implementation input. ffprobe and ffmpeg inspect only the already-derived RIFF/WAVE result.",
});

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
  return String(text || "")
    .replaceAll(`${path.resolve(root)}${path.sep}`, "")
    .replace(/@ 0x[0-9a-f]+/gi, "@ <process-address>")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
}

function diagnosticFact(text, root = repositoryRoot) {
  const normalized = normalizeDiagnostic(text, root);
  return {byteLength: Buffer.byteLength(normalized), sha256: sha256(Buffer.from(normalized)), text: normalized};
}

async function runProcess(command, args, {cwd = repositoryRoot, maxBuffer = 16 * 1024 * 1024} = {}) {
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
      // Continue through PATH.
    }
  }
  invariant(resolvedCommandPath, `Executable not found: ${command}`);
  const executableRealPath = await realpath(resolvedCommandPath);
  const executableBytes = await readFile(executableRealPath);
  const version = await runProcess(resolvedCommandPath, ["-version"], {cwd: root});
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

function ffprobeArguments(wavPath) {
  return [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_frames",
    "-show_entries", FFPROBE_ENTRY_SPEC,
    "-of", "json",
    wavPath,
  ];
}

function ffmpegArguments(wavPath) {
  return ["-v", "error", "-xerror", "-nostdin", "-i", wavPath, "-map", "0:a:0", "-f", "null", "-"];
}

export function normalizeDerivedWaveProbe(payload) {
  invariant(payload && typeof payload === "object", "ffprobe payload must be an object");
  const streams = (payload.streams || []).filter((stream) => stream.codec_type === "audio");
  invariant(streams.length === 1, `Derived WAV must expose exactly one audio stream, found ${streams.length}`);
  const stream = streams[0];
  const format = payload.format || {};
  const frames = Array.isArray(payload.frames) ? payload.frames : [];
  const frameSampleCounts = frames.map((frame) => integer(frame.nb_samples));
  invariant(frames.length > 0 && frameSampleCounts.every((value) => value !== null && value >= 0),
    "ffprobe did not expose complete non-negative nb_samples values");
  return {
    audioStreamCount: streams.length,
    selectedStreamIndex: integer(stream.index),
    codecName: stream.codec_name || null,
    codecLongName: stream.codec_long_name || null,
    sampleFormat: stream.sample_fmt || null,
    bitsPerSample: integer(stream.bits_per_sample),
    bitsPerRawSample: integer(stream.bits_per_raw_sample),
    sampleRateHz: integer(stream.sample_rate),
    channels: integer(stream.channels),
    channelLayout: stream.channel_layout || null,
    timeBase: stream.time_base || null,
    durationTs: integer(stream.duration_ts),
    durationSeconds: decimal(stream.duration) ?? decimal(format.duration),
    containerFormatName: format.format_name || null,
    containerFormatLongName: format.format_long_name || null,
    containerBytes: integer(format.size),
    probeScore: integer(format.probe_score),
    decodedAudioFrameCount: frames.length,
    decodedSampleCount: frameSampleCounts.reduce((sum, value) => sum + value, 0),
    decodedSampleCountBasis: "sum-of-ffprobe-frame-nb_samples",
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

function validateArchiveReport(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === "g4-l3-embedded-audio-archive",
    "Embedded-audio archive report schema/type mismatch");
  invariant(report.acceptance?.acceptanceNeutral === true && report.archive?.archiveWritten === true &&
    report.archive.allArchivedPayloadHashesVerified === true && Array.isArray(report.archive.casObjects),
  "Embedded-audio archive is not complete acceptance-neutral source evidence");
}

function validatePriorProbeReport(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === "g4-l3-audio-cas-technical-media-probe",
    "Prior CAS media probe schema/type mismatch");
  invariant(report.acceptance?.acceptanceNeutral === true && Array.isArray(report.casObjectProbes),
    "Prior CAS media probe is not acceptance-neutral object evidence");
}

function streamProjection(stream) {
  return {
    head: {
      formatCode: stream.head.formatCode,
      format: stream.head.format,
      rateCode: stream.head.rateCode,
      sampleRateHz: stream.head.sampleRateHz,
      sampleSizeBits: stream.head.sampleSizeBits,
      channels: stream.head.channels,
      nominalSamplesPerBlock: stream.head.nominalSamplesPerBlock,
    },
    blockCount: stream.blockCount,
    blocks: stream.blocks.map((block) => ({
      blockIndex: block.blockIndex,
      localFrame: block.localFrame,
      byteOffsetInStreamArchive: block.payload.byteOffsetInStreamArchive,
      byteLength: block.payload.byteLength,
      sha256: block.payload.sha256,
    })),
    payload: {
      path: stream.payload.archivePath,
      sha256: stream.payload.sha256,
      byteLength: stream.payload.byteLength,
    },
  };
}

export function collectAdpcmReferences(archiveReport) {
  validateArchiveReport(archiveReport);
  const references = [];
  for (const item of archiveReport.items || []) {
    for (const stream of item.embeddedAudio?.soundStreams || []) {
      if (stream.payload?.sha256 !== SOURCE_SHA256) continue;
      const reference = {
        unitReferenceId: `${item.animationId}/sound-stream-${stream.streamIndex}/source-order-${stream.sourceOrder}`,
        sequence: item.sequence,
        batchId: item.batchId,
        animationId: item.animationId,
        sourceSwf: {
          path: item.source.swf.path,
          bytes: item.source.swf.observedBytes,
          sha256: item.source.swf.observedSha256,
          physicalHashVerified: item.source.swf.physicalHashVerified,
        },
        streamIndex: stream.streamIndex,
        sourceOrder: stream.sourceOrder,
        ownerDomainId: stream.ownerDomainId,
        logicalPayloadIdentitySha256: stream.logicalPayloadIdentitySha256,
        stream: streamProjection(stream),
      };
      reference.referenceFingerprintSha256 = fingerprint(reference);
      references.push(reference);
    }
  }
  references.sort((left, right) => left.unitReferenceId.localeCompare(right.unitReferenceId));
  invariant(JSON.stringify(references.map((reference) => reference.unitReferenceId)) === JSON.stringify(EXPECTED_REFERENCE_IDS),
    "ADPCM source reference set differs from the four expected G4 L3 placements");
  invariant(new Set(references.map((reference) => fingerprint(reference.stream))).size === 1,
    "The four ADPCM placements no longer share identical stream framing/head metadata");
  invariant(new Set(references.map((reference) => reference.logicalPayloadIdentitySha256)).size === 1,
    "The four ADPCM placements no longer share one logical payload identity");
  invariant(references.every((reference) => reference.sourceSwf.physicalHashVerified === true),
    "An ADPCM source placement has an unverified SWF hash");
  return references;
}

function buildBlockInputs(sourceBytes, reference) {
  const stream = reference.stream;
  invariant(stream.head.formatCode === 1 && stream.head.format === "adpcm" && stream.head.sampleRateHz === SAMPLE_RATE_HZ &&
    stream.head.sampleSizeBits === SAMPLE_SIZE_BITS && stream.head.channels === CHANNELS &&
    stream.head.nominalSamplesPerBlock === SAMPLES_PER_BLOCK && stream.blockCount === BLOCK_COUNT,
  "ADPCM stream head differs from the expected 5512 Hz mono 16-bit/459-sample block contract");
  invariant(stream.payload.path === SOURCE_RELATIVE && stream.payload.sha256 === SOURCE_SHA256 &&
    stream.payload.byteLength === BLOCK_COUNT * BLOCK_BYTES && sourceBytes.length === stream.payload.byteLength,
  "ADPCM stream payload identity/length differs");
  return stream.blocks.map((block, index) => {
    invariant(block.blockIndex === index + 1 && block.localFrame === index + 1 &&
      block.byteOffsetInStreamArchive === index * BLOCK_BYTES && block.byteLength === BLOCK_BYTES,
    `ADPCM block ${index + 1} framing differs`);
    const bytes = sourceBytes.subarray(block.byteOffsetInStreamArchive, block.byteOffsetInStreamArchive + block.byteLength);
    invariant(bytes.length === BLOCK_BYTES && sha256(bytes) === block.sha256,
      `ADPCM block ${index + 1} bytes differ from archive report`);
    return {bytes, sampleCountPerChannel: SAMPLES_PER_BLOCK, archive: block};
  });
}

function pcmStatistics(pcm16) {
  let minimum = 32767;
  let maximum = -32768;
  let zeroSampleCount = 0;
  for (const sample of pcm16) {
    minimum = Math.min(minimum, sample);
    maximum = Math.max(maximum, sample);
    if (sample === 0) zeroSampleCount += 1;
  }
  return {minimum, maximum, zeroSampleCount};
}

function buildBlockRecords(inputs, decodedBlocks) {
  return inputs.map((input, index) => {
    const decoded = decodedBlocks[index];
    invariant(decoded.codeSizeBits === 5 && decoded.channels === CHANNELS &&
      decoded.sampleCountPerChannel === SAMPLES_PER_BLOCK && decoded.packetCount === 1 &&
      decoded.paddingBitCount === 6 && decoded.paddingValue === 0,
    `ADPCM block ${index + 1} decoded structure differs`);
    const record = {
      blockIndex: index + 1,
      source: input.archive,
      decode: {
        codeSizeBits: decoded.codeSizeBits,
        channels: decoded.channels,
        sampleCountPerChannel: decoded.sampleCountPerChannel,
        packetCount: decoded.packetCount,
        sourceByteLength: decoded.sourceByteLength,
        consumedDataBits: decoded.consumedDataBits,
        paddingBitCount: decoded.paddingBitCount,
        paddingValue: decoded.paddingValue,
        initialSample: decoded.packets[0].initialSamples[0],
        initialIndex: decoded.packets[0].initialIndices[0],
        finalSample: decoded.packets[0].finalSamples[0],
        finalIndex: decoded.packets[0].finalIndices[0],
      },
    };
    record.blockFingerprintSha256 = fingerprint(record);
    return record;
  });
}

async function assertNoSymlinkComponents(root, absolute) {
  const relative = path.relative(root, absolute);
  invariant(relative === "" || (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)),
    `${absolute}: path escapes root`);
  let cursor = root;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(!information?.isSymbolicLink(), `Path contains a symbolic link: ${projectPath(cursor, root)}`);
  }
}

async function assertDerivedExactSet(root, expectedRelative) {
  const derivedRoot = path.join(root, DERIVED_ROOT_RELATIVE);
  const files = [];
  const walk = async (directory) => {
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      invariant(!entry.isSymbolicLink(), `Derived artifact root contains a symlink: ${projectPath(absolute, root)}`);
      if (entry.isDirectory()) await walk(absolute);
      else {
        invariant(entry.isFile(), `Derived artifact root contains a non-file: ${projectPath(absolute, root)}`);
        files.push(projectPath(absolute, root));
      }
    }
  };
  await walk(derivedRoot);
  invariant(JSON.stringify(files.sort()) === JSON.stringify([expectedRelative]),
    `Derived artifact file set differs: expected only ${expectedRelative}, found ${files.length}`);
}

async function ensureDerivedArtifact({root, relativePath, bytes, check}) {
  const derivedRoot = path.join(root, DERIVED_ROOT_RELATIVE);
  const output = path.resolve(root, relativePath);
  invariant(isWithin(derivedRoot, output) && path.extname(output) === ".wav", "Derived WAV escapes the dedicated artifact root");
  await assertNoSymlinkComponents(root, output);
  const existing = await readFile(output).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) {
    invariant(existing.equals(bytes), `${relativePath}: existing derived artifact bytes differ; refusing overwrite`);
  } else {
    invariant(!check, `${relativePath}: derived artifact is missing`);
    await mkdir(path.dirname(output), {recursive: true});
    await writeFile(output, bytes, {flag: "wx", mode: 0o444});
    await chmod(output, 0o444);
  }
  const information = await lstat(output);
  invariant(information.isFile() && !information.isSymbolicLink() && (information.mode & 0o777) === 0o444,
    `${relativePath}: derived artifact must be a regular 0444 file`);
  await assertDerivedExactSet(root, relativePath);
  return {path: relativePath, bytes: information.size, sha256: sha256(await readFile(output)), mode: "0444"};
}

async function probeDerivedArtifact({root, relativePath, ffprobe, ffmpeg}) {
  const before = await readFile(path.join(root, relativePath));
  const [ffprobeResult, ffmpegResult] = await Promise.all([
    runProcess(ffprobe.resolvedCommandPath, ffprobeArguments(relativePath), {cwd: root}),
    runProcess(ffmpeg.resolvedCommandPath, ffmpegArguments(relativePath), {cwd: root}),
  ]);
  const after = await readFile(path.join(root, relativePath));
  invariant(before.equals(after), "Media probes changed the derived WAV bytes");
  invariant(ffprobeResult.exitCode === 0, `ffprobe failed for derived WAV: ${ffprobeResult.stderr}`);
  let media;
  try {
    media = normalizeDerivedWaveProbe(JSON.parse(ffprobeResult.stdout));
  } catch (error) {
    throw new Error(`ffprobe JSON normalization failed: ${error.message}`);
  }
  invariant(ffmpegResult.exitCode === 0, `ffmpeg decode-to-null failed: ${ffmpegResult.stderr}`);
  return {
    derivedHashVerifiedBeforeAndAfterProbe: true,
    ffprobe: {
      arguments: ffprobeArguments(relativePath),
      exitCode: ffprobeResult.exitCode,
      stdout: diagnosticFact(ffprobeResult.stdout, root),
      stderr: diagnosticFact(ffprobeResult.stderr, root),
      media,
    },
    ffmpegDecodeToNull: {
      arguments: ffmpegArguments(relativePath),
      exitCode: ffmpegResult.exitCode,
      stdout: diagnosticFact(ffmpegResult.stdout, root),
      stderr: diagnosticFact(ffmpegResult.stderr, root),
      passed: true,
    },
  };
}

export async function buildG4L3SwfAdpcmDerivedAudio({
  root = repositoryRoot,
  ffprobeCommand = "ffprobe",
  ffmpegCommand = "ffmpeg",
  check = false,
} = {}) {
  root = path.resolve(root);
  const [archiveBytes, priorProbeBytes, generatorBytes, decoderBytes, sourceBefore, ffprobe, ffmpeg] = await Promise.all([
    readFile(path.join(root, ARCHIVE_REPORT_RELATIVE)),
    readFile(path.join(root, PRIOR_PROBE_REPORT_RELATIVE)),
    readFile(scriptPath),
    readFile(decoderPath),
    readFile(path.join(root, SOURCE_RELATIVE)),
    resolveExecutable(ffprobeCommand, root),
    resolveExecutable(ffmpegCommand, root),
  ]);
  const archiveReport = JSON.parse(archiveBytes);
  const priorProbeReport = JSON.parse(priorProbeBytes);
  validateArchiveReport(archiveReport);
  validatePriorProbeReport(priorProbeReport);
  const archiveObject = archiveReport.archive.casObjects.find((object) => object.sha256 === SOURCE_SHA256);
  invariant(archiveObject?.path === SOURCE_RELATIVE && archiveObject.byteLength === BLOCK_COUNT * BLOCK_BYTES &&
    archiveObject.formatCode === 1 && archiveObject.sourceAudioUnitReferenceCount === 4 &&
    archiveObject.logicalPayloadIdentityCount === 1 && archiveObject.physicalHashVerified === true,
  "Archive report ADPCM CAS object binding differs");
  invariant(sourceBefore.length === archiveObject.byteLength && sha256(sourceBefore) === SOURCE_SHA256,
    "Physical ADPCM CAS object differs before decode");
  const sourceInformation = await lstat(path.join(root, SOURCE_RELATIVE));
  invariant(sourceInformation.isFile() && !sourceInformation.isSymbolicLink() && (sourceInformation.mode & 0o777) === 0o444,
    "Physical ADPCM CAS object must remain a regular 0444 file");
  const priorProbe = priorProbeReport.casObjectProbes.find((probe) => probe.casObject.sha256 === SOURCE_SHA256);
  invariant(priorProbe?.probeStatus === "ffprobe-parse-failed" && priorProbe.media === null &&
    priorProbe.casObject.unchangedByProbe === true && priorProbe.casObject.formatCodeFromSwf === 1,
  "Prior raw-CAS probe binding differs");

  const references = collectAdpcmReferences(archiveReport);
  const inputs = buildBlockInputs(sourceBefore, references[0]);
  const decoded = decodeSwfAdpcmBlocks(inputs, {channels: CHANNELS});
  invariant(decoded.blockCount === BLOCK_COUNT && decoded.sampleCountPerChannel === BLOCK_COUNT * SAMPLES_PER_BLOCK,
    "Decoded ADPCM aggregate sample count differs");
  const wavBytes = encodePcm16LeWav(decoded.pcm16, {sampleRateHz: SAMPLE_RATE_HZ, channels: CHANNELS});
  const wavSha256 = sha256(wavBytes);
  const derivedRelative = `${DERIVED_SHA_ROOT_RELATIVE}/${wavSha256.slice(0, 2)}/${wavSha256}.wav`;
  const artifact = await ensureDerivedArtifact({root, relativePath: derivedRelative, bytes: wavBytes, check});
  const technicalValidation = await probeDerivedArtifact({root, relativePath: derivedRelative, ffprobe, ffmpeg});
  const sourceAfter = await readFile(path.join(root, SOURCE_RELATIVE));
  invariant(sourceBefore.equals(sourceAfter), "Physical ADPCM CAS object changed during derive/probe");
  const sampleCount = BLOCK_COUNT * SAMPLES_PER_BLOCK;
  const expectedDataBytes = sampleCount * CHANNELS * 2;
  invariant(wavBytes.length === 44 + expectedDataBytes && artifact.bytes === wavBytes.length && artifact.sha256 === wavSha256,
    "Derived PCM WAV byte contract differs");
  invariant(technicalValidation.ffprobe.media.codecName === "pcm_s16le" &&
    technicalValidation.ffprobe.media.sampleFormat === "s16" &&
    technicalValidation.ffprobe.media.bitsPerSample === SAMPLE_SIZE_BITS &&
    technicalValidation.ffprobe.media.sampleRateHz === SAMPLE_RATE_HZ &&
    technicalValidation.ffprobe.media.channels === CHANNELS &&
    technicalValidation.ffprobe.media.containerFormatName?.split(",").includes("wav") &&
    technicalValidation.ffprobe.media.containerBytes === wavBytes.length &&
    technicalValidation.ffprobe.media.decodedSampleCount === sampleCount,
  "Derived WAV ffprobe facts differ from decoder contract");
  const rawPcmBytes = wavBytes.subarray(44);
  const blocks = buildBlockRecords(inputs, decoded.decodedBlocks);
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: REPORT_TYPE,
    generator: {
      path: "scripts/build-g4-l3-swf-adpcm-derived-audio.mjs",
      version: SCHEMA_VERSION,
      sha256: sha256(generatorBytes),
      decoder: {
        path: "scripts/lib/swf-adpcm.mjs",
        sha256: sha256(decoderBytes),
      },
    },
    acceptance: {
      acceptanceNeutral: true,
      languageEstablished: false,
      cueMappingEstablished: false,
      runtimeSynchronizationEstablished: false,
      audibleContentEstablished: false,
      audibleQualityEstablished: false,
      listeningAcceptanceEstablished: false,
      authoritativeRuntimeEstablished: false,
      independentDecoderPcmEqualityEstablished: false,
      behavioralParityEstablished: false,
      visualParityEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      sourceAssetsChanged: 0,
      sourceCasObjectsChanged: 0,
      migrationsChanged: 0,
      productRenderersChanged: 0,
      approvalOrStatusChanges: 0,
      completionLedgerChanges: 0,
      statement:
        "This report establishes only deterministic byte-level decoding of one raw SWF ADPCM CAS payload into a separately stored PCM WAV and technical ffprobe/ffmpeg readability. It does not establish spoken language, cue mapping, timeline synchronization, audible content or quality, listening acceptance, authoritative/original-runtime behavior, equality with an independent FFDec/original decoder PCM export, behavioral or visual parity, human review, owner acceptance, or strict migration completion.",
    },
    specification: SPECIFICATION,
    sourceBindings: {
      embeddedAudioArchiveReport: {
        path: ARCHIVE_REPORT_RELATIVE,
        bytes: archiveBytes.length,
        sha256: sha256(archiveBytes),
        archiveSetSha256: archiveReport.archive.archiveSetSha256,
      },
      priorRawCasMediaProbeReport: {
        path: PRIOR_PROBE_REPORT_RELATIVE,
        bytes: priorProbeBytes.length,
        sha256: sha256(priorProbeBytes),
        objectProbeFingerprintSha256: priorProbe.objectProbeFingerprintSha256,
        retainedStatus: priorProbe.probeStatus,
        interpretation:
          "The prior generic probe retained this containerless .bin as unparsed. This additive report does not rewrite that result; it parses the SWF ADPCM bitstream and probes only the separately derived RIFF/WAVE artifact.",
      },
      sourceCasObject: {
        path: SOURCE_RELATIVE,
        bytes: sourceBefore.length,
        sha256: sha256(sourceBefore),
        mode: "0444",
        sourceFormatCode: archiveObject.formatCode,
        sourceAudioUnitReferenceCount: archiveObject.sourceAudioUnitReferenceCount,
        logicalPayloadIdentityCount: archiveObject.logicalPayloadIdentityCount,
        physicalHashVerifiedBeforeAndAfterDeriveAndProbe: true,
      },
      references,
      referenceSetSha256: fingerprint(references.map((reference) => ({
        unitReferenceId: reference.unitReferenceId,
        referenceFingerprintSha256: reference.referenceFingerprintSha256,
      }))),
      tools: {ffprobe: publicToolBinding(ffprobe), ffmpeg: publicToolBinding(ffmpeg)},
    },
    decodeContract: {
      swfFormatCode: 1,
      swfFormat: "adpcm",
      inputKind: "source-order concatenation of independently framed SoundStreamBlock ADPCMSOUNDDATA records",
      blockResetRule: "Each of the 13 archived SoundStreamBlock payloads is decoded as an independent ADPCMSOUNDDATA record, including its own AdpcmCodeSize and initial sample/index.",
      bitOrder: "most-significant bit first",
      adpcmCodeSizeFieldValue: 3,
      adpcmCodeSizeBits: 5,
      channels: CHANNELS,
      sampleRateHz: SAMPLE_RATE_HZ,
      outputSampleSizeBits: SAMPLE_SIZE_BITS,
      blockCount: BLOCK_COUNT,
      sourceBytesPerBlock: BLOCK_BYTES,
      samplesPerChannelPerBlock: SAMPLES_PER_BLOCK,
      maximumCodesPerFullPacketPerChannel: 4095,
      stepSizeTableEntryCount: SWF_ADPCM_STEP_SIZE_TABLE.length,
      stepSizeTableSha256: fingerprint(SWF_ADPCM_STEP_SIZE_TABLE),
      indexTable: SWF_ADPCM_INDEX_TABLES[5],
      indexTableSha256: fingerprint(SWF_ADPCM_INDEX_TABLES[5]),
      predictorClamp: [-32768, 32767],
      stepIndexClamp: [0, SWF_ADPCM_STEP_SIZE_TABLE.length - 1],
      terminalPaddingRequiredZero: true,
    },
    derivedArtifact: {
      ...artifact,
      kind: "derived-pcm-wave-technical-evidence",
      sourceOverwritten: false,
      container: "RIFF/WAVE",
      codec: "PCM signed 16-bit little-endian",
      sampleRateHz: SAMPLE_RATE_HZ,
      channels: CHANNELS,
      bitsPerSample: SAMPLE_SIZE_BITS,
      sampleCountPerChannel: sampleCount,
      interleavedSampleCount: decoded.interleavedSampleCount,
      dataByteLength: expectedDataBytes,
      rawPcmSha256: sha256(rawPcmBytes),
      duration: {
        exactSampleCountNumerator: sampleCount,
        sampleRateDenominator: SAMPLE_RATE_HZ,
        seconds: sampleCount / SAMPLE_RATE_HZ,
        interpretation: "mathematical PCM duration only; not a runtime synchronization result",
      },
      sampleStatistics: pcmStatistics(decoded.pcm16),
    },
    technicalValidation: {
      ...technicalValidation,
      ffprobeTool: publicToolBinding(ffprobe),
      ffmpegTool: publicToolBinding(ffmpeg),
      sourceCasHashVerifiedBeforeAndAfter: true,
      derivedArtifactExactFileSetVerified: true,
      noPlaybackOrListeningPerformed: true,
      independentFfdecOrOriginalDecoderPcmEqualityEstablished: false,
    },
    blocks,
    summary: {
      sourceCasObjectCount: 1,
      sourceCasBytes: sourceBefore.length,
      sourceAudioUnitReferenceCount: references.length,
      independentlyDecodedBlockCount: blocks.length,
      decodedSampleCountPerChannel: sampleCount,
      derivedArtifactCount: 1,
      derivedArtifactBytes: artifact.bytes,
      ffprobeParsedDerivedArtifactCount: 1,
      ffmpegDecodeToNullPassedDerivedArtifactCount: 1,
      blockSetSha256: fingerprint(blocks.map((block) => ({
        blockIndex: block.blockIndex,
        blockFingerprintSha256: block.blockFingerprintSha256,
      }))),
      disposition: "acceptance-neutral-technical-decode-written-and-verified",
      acceptanceEffect: "none",
    },
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return validateG4L3SwfAdpcmDerivedAudio(report);
}

export function validateG4L3SwfAdpcmDerivedAudio(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === REPORT_TYPE,
    "SWF ADPCM derived-audio report schema/type mismatch");
  invariant(report.generator?.path === "scripts/build-g4-l3-swf-adpcm-derived-audio.mjs" &&
    /^[a-f0-9]{64}$/.test(report.generator.sha256 || "") &&
    report.generator.decoder?.path === "scripts/lib/swf-adpcm.mjs" &&
    /^[a-f0-9]{64}$/.test(report.generator.decoder.sha256 || ""),
  "SWF ADPCM generator/decoder binding is invalid");
  invariant(report.acceptance?.acceptanceNeutral === true, "SWF ADPCM report must remain acceptance-neutral");
  for (const field of [
    "languageEstablished", "cueMappingEstablished", "runtimeSynchronizationEstablished", "audibleContentEstablished",
    "audibleQualityEstablished", "listeningAcceptanceEstablished", "authoritativeRuntimeEstablished",
    "independentDecoderPcmEqualityEstablished", "behavioralParityEstablished", "visualParityEstablished",
    "humanReviewEstablished", "ownerAcceptanceEstablished",
    "strictCompletionEstablished",
  ]) invariant(report.acceptance[field] === false, `acceptance.${field} must remain false`);
  for (const field of [
    "sourceAssetsChanged", "sourceCasObjectsChanged", "migrationsChanged", "productRenderersChanged",
    "approvalOrStatusChanges", "completionLedgerChanges",
  ]) invariant(report.acceptance[field] === 0, `acceptance.${field} must remain zero`);
  invariant(report.specification?.version === 19 && report.specification.publisher === "Adobe Systems Incorporated" &&
    report.specification.url === SPECIFICATION.url && report.specification.evidencePages?.length === 3,
  "Adobe SWF v19 specification binding is incomplete");
  invariant(report.sourceBindings?.sourceCasObject?.path === SOURCE_RELATIVE &&
    report.sourceBindings.sourceCasObject.sha256 === SOURCE_SHA256 &&
    report.sourceBindings.sourceCasObject.bytes === BLOCK_COUNT * BLOCK_BYTES &&
    report.sourceBindings.sourceCasObject.mode === "0444" &&
    report.sourceBindings.sourceCasObject.physicalHashVerifiedBeforeAndAfterDeriveAndProbe === true,
  "Source CAS object binding is invalid");
  invariant(report.sourceBindings.priorRawCasMediaProbeReport?.retainedStatus === "ffprobe-parse-failed" &&
    /^[a-f0-9]{64}$/.test(report.sourceBindings.priorRawCasMediaProbeReport.sha256 || ""),
  "Prior raw CAS probe binding is invalid");
  invariant(Array.isArray(report.sourceBindings.references) && report.sourceBindings.references.length === 4 &&
    JSON.stringify(report.sourceBindings.references.map((reference) => reference.unitReferenceId)) === JSON.stringify(EXPECTED_REFERENCE_IDS),
  "Source unit-reference set is invalid");
  for (const reference of report.sourceBindings.references) {
    const copy = structuredClone(reference);
    delete copy.referenceFingerprintSha256;
    invariant(reference.referenceFingerprintSha256 === fingerprint(copy), `${reference.unitReferenceId}: stale fingerprint`);
  }
  invariant(report.sourceBindings.referenceSetSha256 === fingerprint(report.sourceBindings.references.map((reference) => ({
    unitReferenceId: reference.unitReferenceId,
    referenceFingerprintSha256: reference.referenceFingerprintSha256,
  }))), "Source unit-reference set fingerprint is stale");
  invariant(report.decodeContract?.swfFormatCode === 1 && report.decodeContract.adpcmCodeSizeBits === 5 &&
    report.decodeContract.channels === CHANNELS && report.decodeContract.sampleRateHz === SAMPLE_RATE_HZ &&
    report.decodeContract.blockCount === BLOCK_COUNT && report.decodeContract.sourceBytesPerBlock === BLOCK_BYTES &&
    report.decodeContract.samplesPerChannelPerBlock === SAMPLES_PER_BLOCK &&
    report.decodeContract.stepSizeTableEntryCount === 89 &&
    report.decodeContract.stepSizeTableSha256 === fingerprint(SWF_ADPCM_STEP_SIZE_TABLE) &&
    report.decodeContract.indexTableSha256 === fingerprint(SWF_ADPCM_INDEX_TABLES[5]),
  "SWF ADPCM decode contract is invalid");
  invariant(Array.isArray(report.blocks) && report.blocks.length === BLOCK_COUNT,
    "SWF ADPCM block evidence is incomplete");
  for (const [index, block] of report.blocks.entries()) {
    invariant(block.blockIndex === index + 1 && block.source.byteOffsetInStreamArchive === index * BLOCK_BYTES &&
      block.source.byteLength === BLOCK_BYTES && block.decode.codeSizeBits === 5 &&
      block.decode.sampleCountPerChannel === SAMPLES_PER_BLOCK && block.decode.packetCount === 1 &&
      block.decode.paddingBitCount === 6 && block.decode.paddingValue === 0,
    `SWF ADPCM block ${index + 1} evidence is invalid`);
    const copy = structuredClone(block);
    delete copy.blockFingerprintSha256;
    invariant(block.blockFingerprintSha256 === fingerprint(copy), `SWF ADPCM block ${index + 1} fingerprint is stale`);
  }
  const artifact = report.derivedArtifact;
  invariant(artifact?.kind === "derived-pcm-wave-technical-evidence" && artifact.sourceOverwritten === false &&
    artifact.mode === "0444" && artifact.bytes === 11978 && /^[a-f0-9]{64}$/.test(artifact.sha256 || "") &&
    artifact.path === `${DERIVED_SHA_ROOT_RELATIVE}/${artifact.sha256.slice(0, 2)}/${artifact.sha256}.wav` &&
    artifact.sampleRateHz === SAMPLE_RATE_HZ && artifact.channels === CHANNELS && artifact.bitsPerSample === SAMPLE_SIZE_BITS &&
    artifact.sampleCountPerChannel === BLOCK_COUNT * SAMPLES_PER_BLOCK && artifact.dataByteLength === BLOCK_COUNT * SAMPLES_PER_BLOCK * 2 &&
    /^[a-f0-9]{64}$/.test(artifact.rawPcmSha256 || ""),
  "Derived PCM WAV artifact binding is invalid");
  invariant(report.technicalValidation?.derivedHashVerifiedBeforeAndAfterProbe === true &&
    report.technicalValidation.sourceCasHashVerifiedBeforeAndAfter === true &&
    report.technicalValidation.derivedArtifactExactFileSetVerified === true &&
    report.technicalValidation.noPlaybackOrListeningPerformed === true &&
    report.technicalValidation.independentFfdecOrOriginalDecoderPcmEqualityEstablished === false &&
    report.technicalValidation.ffprobe?.exitCode === 0 &&
    report.technicalValidation.ffprobe.media?.codecName === "pcm_s16le" &&
    report.technicalValidation.ffprobe.media.decodedSampleCount === BLOCK_COUNT * SAMPLES_PER_BLOCK &&
    report.technicalValidation.ffmpegDecodeToNull?.exitCode === 0 &&
    report.technicalValidation.ffmpegDecodeToNull.passed === true,
  "Derived PCM WAV technical validation is invalid");
  for (const tool of ["ffprobeTool", "ffmpegTool"]) {
    const binding = report.technicalValidation[tool];
    invariant(binding && /^[a-f0-9]{64}$/.test(binding.executableSha256 || "") &&
      /^[a-f0-9]{64}$/.test(binding.versionTextSha256 || ""), `${tool} binding is invalid`);
  }
  invariant(report.summary?.sourceCasObjectCount === 1 && report.summary.sourceAudioUnitReferenceCount === 4 &&
    report.summary.independentlyDecodedBlockCount === BLOCK_COUNT &&
    report.summary.decodedSampleCountPerChannel === BLOCK_COUNT * SAMPLES_PER_BLOCK &&
    report.summary.derivedArtifactCount === 1 && report.summary.derivedArtifactBytes === artifact.bytes &&
    report.summary.ffprobeParsedDerivedArtifactCount === 1 &&
    report.summary.ffmpegDecodeToNullPassedDerivedArtifactCount === 1 &&
    report.summary.acceptanceEffect === "none",
  "SWF ADPCM derived-audio summary is stale");
  invariant(report.summary.blockSetSha256 === fingerprint(report.blocks.map((block) => ({
    blockIndex: block.blockIndex,
    blockFingerprintSha256: block.blockFingerprintSha256,
  }))), "SWF ADPCM block set fingerprint is stale");
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === fingerprint(copy), "SWF ADPCM report fingerprint is stale");
  return report;
}

export function renderG4L3SwfAdpcmDerivedAudioMarkdown(report) {
  const referenceRows = report.sourceBindings.references.map((reference) =>
    `| \`${reference.animationId}\` | \`${reference.ownerDomainId}\` | ${reference.streamIndex} | ${reference.sourceOrder} | \`${reference.sourceSwf.sha256}\` |`);
  const blockRows = report.blocks.map((block) =>
    `| ${block.blockIndex} | ${block.source.byteOffsetInStreamArchive} | \`${block.source.sha256}\` | ${block.decode.initialSample} | ${block.decode.initialIndex} | ${block.decode.finalSample} | ${block.decode.finalIndex} | ${block.decode.paddingBitCount} |`);
  return [
    "# G4 L3 SWF ADPCM Derived-Audio Technical Binding",
    "",
    "> Acceptance-neutral byte-level evidence only. This does not establish language, cue/sync behavior, audible content or quality, listening approval, original-runtime behavior, parity, human/owner acceptance, or strict completion.",
    "",
    "## Result",
    "",
    `- Raw source: \`${report.sourceBindings.sourceCasObject.path}\` (${report.sourceBindings.sourceCasObject.bytes} bytes; SHA-256 \`${report.sourceBindings.sourceCasObject.sha256}\`).`,
    `- Framing: ${report.decodeContract.blockCount} independent SoundStreamBlock ADPCM records × ${report.decodeContract.samplesPerChannelPerBlock} mono samples at ${report.decodeContract.sampleRateHz} Hz; 5-bit codes.`,
    `- Derived WAV: [\`${report.derivedArtifact.path}\`](../${report.derivedArtifact.path}) (${report.derivedArtifact.bytes} bytes; SHA-256 \`${report.derivedArtifact.sha256}\`).`,
    `- PCM: ${report.derivedArtifact.sampleCountPerChannel} samples; raw-data SHA-256 \`${report.derivedArtifact.rawPcmSha256}\`; mathematical duration ${report.derivedArtifact.duration.seconds} seconds.`,
    `- Technical probe: ffprobe reported \`${report.technicalValidation.ffprobe.media.codecName}\`, ${report.technicalValidation.ffprobe.media.sampleRateHz} Hz, ${report.technicalValidation.ffprobe.media.channels} channel, and ${report.technicalValidation.ffprobe.media.decodedSampleCount} decoded samples; ffmpeg decode-to-null passed.`,
    `- Immutability: the source CAS remained exact \`0444\`; the derived artifact is a separate exact \`0444\` content-addressed file.`,
    "",
    "## Specification basis",
    "",
    `- ${report.specification.publisher}, [${report.specification.title}](${report.specification.url}), pages ${report.specification.evidencePages.map((entry) => entry.pages).join(", ")}.`,
    `- Step-size table: ${report.decodeContract.stepSizeTableEntryCount} entries, SHA-256 \`${report.decodeContract.stepSizeTableSha256}\`.`,
    `- 5-bit index table: \`${JSON.stringify(report.decodeContract.indexTable)}\`, SHA-256 \`${report.decodeContract.indexTableSha256}\`.`,
    "",
    "## Four source references",
    "",
    "| Animation | Frame domain | Stream | Source order | Source SWF SHA-256 |",
    "|---|---|---:|---:|---|",
    ...referenceRows,
    "",
    "## Per-block decode facts",
    "",
    "| Block | Source offset | Source block SHA-256 | Initial sample | Initial index | Final sample | Final index | Zero pad bits |",
    "|---:|---:|---|---:|---:|---:|---:|---:|",
    ...blockRows,
    "",
    "## Tool bindings",
    "",
    `- ffprobe: ${report.technicalValidation.ffprobeTool.versionFirstLine}; executable SHA-256 \`${report.technicalValidation.ffprobeTool.executableSha256}\`.`,
    `- ffmpeg: ${report.technicalValidation.ffmpegTool.versionFirstLine}; executable SHA-256 \`${report.technicalValidation.ffmpegTool.executableSha256}\`.`,
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
  await assertNoSymlinkComponents(root, output);
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
  return "Usage: node scripts/build-g4-l3-swf-adpcm-derived-audio.mjs [options]\n\n" +
    "  --check                       Verify the artifact and reports byte-for-byte\n" +
    "  --ffprobe <command>           ffprobe executable (default: ffprobe)\n" +
    "  --ffmpeg <command>            ffmpeg executable (default: ffmpeg)\n" +
    "  --json-output <reports/...>   JSON report path\n" +
    "  --markdown-output <reports/>  Markdown report path\n";
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const report = await buildG4L3SwfAdpcmDerivedAudio({
    ffprobeCommand: options.ffprobeCommand,
    ffmpegCommand: options.ffmpegCommand,
    check: options.check,
  });
  await Promise.all([
    writeOrCheck(options.jsonOutput, jsonText(report), {root: repositoryRoot, extension: ".json", check: options.check}),
    writeOrCheck(options.markdownOutput, renderG4L3SwfAdpcmDerivedAudioMarkdown(report), {
      root: repositoryRoot,
      extension: ".md",
      check: options.check,
    }),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${report.summary.independentlyDecodedBlockCount} SWF ADPCM blocks; ` +
    `${report.summary.decodedSampleCountPerChannel} PCM samples; WAV ${report.derivedArtifact.sha256}; ` +
    `ffprobe/ffmpeg technical checks passed; acceptance effect none\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
