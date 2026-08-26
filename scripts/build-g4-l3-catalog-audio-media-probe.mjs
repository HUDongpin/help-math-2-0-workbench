#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {access, lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {normalizeFfprobePayload} from "./build-g4-l3-audio-cas-media-probe.mjs";
import {
  assertSafeReportOutput as assertSharedSafeReportOutput,
  writeOrCheckReport as writeSharedOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";

const execFileAsync = promisify(execFile);
const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const WORK_CARDS_PATH = path.join(ROOT, "reports", "g4-l3-implementation-work-cards.json");
const NORMALIZER_PATH = path.join(ROOT, "scripts", "build-g4-l3-audio-cas-media-probe.mjs");
const DEFAULT_JSON = path.join(ROOT, "reports", "g4-l3-catalog-audio-media-probe.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "g4-l3-catalog-audio-media-probe.md");
const CONCURRENCY = 4;
const FFPROBE_ENTRY_SPEC = [
  "stream=index,codec_name,codec_long_name,codec_type,profile,sample_fmt,sample_rate,channels,channel_layout,bits_per_sample,bits_per_raw_sample,time_base,start_pts,start_time,duration_ts,duration,bit_rate,nb_frames",
  "format=format_name,format_long_name,start_time,duration,size,bit_rate,probe_score",
  "frame=nb_samples",
].join(":");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertRegularReportTarget(filePath, label = "Report output") {
  const information = await lstat(path.resolve(filePath))
    .catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!information || information.isFile() || information.isSymbolicLink(),
    `${label} must be missing or an existing regular file`);
}

export async function assertSafeReportOutput(filePath, options = {}) {
  await assertRegularReportTarget(filePath);
  return assertSharedSafeReportOutput(filePath, options);
}

export async function writeOrCheckReport(filePath, expected, options = {}) {
  await assertRegularReportTarget(filePath);
  return writeSharedOrCheckReport(filePath, expected, options);
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

function sameCanonicalValue(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function countProbeValues(probes, selector) {
  const counts = new Map();
  for (const probe of probes) {
    const value = selector(probe);
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right)));
}

function derivedProbeSummary(probes) {
  const references = probes.flatMap((probe) => probe.source.referencedByAnimationIds);
  return {
    sourceFileCount: probes.length,
    sourceBytes: probes.reduce((sum, probe) => sum + probe.source.bytes, 0),
    sourceReferenceCount: references.length,
    animationsWithCatalogAudio: new Set(references).size,
    catalogLanguageCounts: countProbeValues(probes, (probe) => probe.source.catalogLanguage),
    normalizedLanguageCandidateCounts: countProbeValues(probes, (probe) => probe.source.normalizedLanguageCandidate),
    ffprobeParsedCount: probes.filter((probe) => probe.probe.ffprobe.jsonParsed === true).length,
    ffmpegDecodeCheckPassedCount: probes.filter((probe) => probe.probe.ffmpegDecodeToNull.decodeCheckPassed === true).length,
    sampleCountToolSupportedCount: probes.filter((probe) => probe.probe.media.sampleCount.toolSupported === true).length,
    probeSetSha256: fingerprint(probes.map((probe) => ({
      path: probe.source.path,
      fingerprint: probe.probeFingerprintSha256,
    }))),
  };
}

function portable(file) {
  const relative = path.relative(ROOT, path.resolve(file)).split(path.sep).join("/");
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${file} escapes the project root`);
  return relative;
}

function isWithin(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function diagnostic(text) {
  const normalized = String(text || "")
    .replaceAll(`${ROOT}${path.sep}`, "")
    .replace(/@ 0x[0-9a-f]+/gi, "@ <process-address>")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
  return {bytes: Buffer.byteLength(normalized), sha256: sha256(Buffer.from(normalized)), text: normalized};
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(ROOT, command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((directory) => path.join(directory, command));
  let executable = null;
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      executable = await realpath(candidate);
      break;
    } catch {
      // Continue searching PATH.
    }
  }
  invariant(executable, `Executable not found: ${command}`);
  const [bytes, version] = await Promise.all([
    readFile(executable),
    execFileAsync(executable, ["-version"], {encoding: "utf8", maxBuffer: 8 * 1024 * 1024}),
  ]);
  const versionText = `${version.stdout || ""}${version.stderr || ""}`.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  return {
    command,
    executable,
    executableBytes: bytes.length,
    executableSha256: sha256(bytes),
    versionFirstLine: versionText.split("\n").find(Boolean) || "",
    versionTextSha256: sha256(Buffer.from(versionText)),
  };
}

async function run(command, args) {
  try {
    const result = await execFileAsync(command, args, {cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
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

function ffprobeArgs(file) {
  return ["-v", "error", "-select_streams", "a:0", "-show_frames", "-show_entries", FFPROBE_ENTRY_SPEC, "-of", "json", file];
}

function ffmpegArgs(file) {
  return ["-v", "error", "-xerror", "-nostdin", "-i", file, "-map", "0:a:0", "-f", "null", "-"];
}

export function buildCatalogProbeRecord({source, beforeBytes, afterBytes, ffprobeResult, ffmpegResult}) {
  invariant(beforeBytes.length === source.bytes && sha256(beforeBytes) === source.sha256,
    `${source.path}: pre-probe source bytes differ from the work-card binding`);
  invariant(afterBytes.length === beforeBytes.length && sha256(afterBytes) === source.sha256,
    `${source.path}: media probe changed a catalog audio source`);
  invariant(ffprobeResult.exitCode === 0, `${source.path}: ffprobe failed (${ffprobeResult.exitCode ?? ffprobeResult.signal})`);
  let media;
  try {
    media = normalizeFfprobePayload(JSON.parse(ffprobeResult.stdout));
  } catch (error) {
    throw new Error(`${source.path}: ffprobe JSON is invalid: ${error.message}`);
  }
  invariant(ffmpegResult.exitCode === 0, `${source.path}: ffmpeg decode-to-null failed (${ffmpegResult.exitCode ?? ffmpegResult.signal})`);
  const record = {
    source: {
      path: source.path,
      bytes: source.bytes,
      sha256: source.sha256,
      catalogLanguage: source.catalogLanguage,
      normalizedLanguageCandidate: source.normalizedLanguage,
      referencedByAnimationIds: [...source.animationIds].sort(),
      physicalHashVerifiedBeforeProbe: true,
      physicalHashVerifiedAfterProbe: true,
      unchangedByProbe: true,
    },
    probe: {
      status: "ffprobe-parsed-ffmpeg-decode-check-passed",
      ffprobe: {
        arguments: ffprobeArgs(source.path),
        stdout: diagnostic(ffprobeResult.stdout),
        stderr: diagnostic(ffprobeResult.stderr),
        jsonParsed: true,
      },
      ffmpegDecodeToNull: {
        arguments: ffmpegArgs(source.path),
        stdout: diagnostic(ffmpegResult.stdout),
        stderr: diagnostic(ffmpegResult.stderr),
        decodeCheckPassed: true,
      },
      media,
    },
    evidenceLimits: {
      normalizedLanguageCandidateBasis: "existing source-path/catalog convention only",
      spokenLanguageEstablished: false,
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
  record.probeFingerprintSha256 = fingerprint(record);
  return record;
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const output = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, values.length)}, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await mapper(values[index]);
    }
  });
  await Promise.all(workers);
  return output;
}

function collectSources(workCards) {
  invariant(workCards?.summary?.cards === 40 && workCards.cards?.length === 40,
    "G4 L3 implementation work-card scope drifted");
  const sources = new Map();
  for (const card of workCards.cards) {
    for (const file of card.requiredWork?.audio?.catalogAssociation?.files || []) {
      const existing = sources.get(file.path);
      if (existing) {
        invariant(existing.bytes === file.bytes && existing.sha256 === file.sha256
          && existing.catalogLanguage === file.catalogLanguage && existing.normalizedLanguage === file.normalizedLanguage,
        `${file.path}: conflicting work-card catalog audio identity`);
        existing.animationIds.push(card.animationId);
      } else sources.set(file.path, {...file, animationIds: [card.animationId]});
    }
  }
  const result = [...sources.values()].sort((left, right) => left.path.localeCompare(right.path));
  invariant(result.length === 143, `Expected 143 unique G4 L3 catalog audio files, found ${result.length}`);
  return result;
}

async function probeSource(source, {ffprobe, ffmpeg}) {
  const file = path.resolve(ROOT, source.path);
  const lessonRoot = path.join(ROOT, "source-assets", "flash", "HELP MATH_ORIGINAL FILES", "HELP_COURSES", "ELMGR4", "L3");
  invariant(isWithin(lessonRoot, file) && path.extname(file).toLowerCase() === ".mp3",
    `${source.path}: catalog audio is outside the physical G4 L3 lesson tree`);
  const info = await lstat(file);
  invariant(info.isFile() && !info.isSymbolicLink(), `${source.path}: catalog audio must be a regular non-symlink file`);
  invariant(await realpath(file) === file, `${source.path}: catalog audio contains a symlink path component`);
  const beforeBytes = await readFile(file);
  const [ffprobeResult, ffmpegResult] = await Promise.all([
    run(ffprobe.executable, ffprobeArgs(source.path)),
    run(ffmpeg.executable, ffmpegArgs(source.path)),
  ]);
  const afterBytes = await readFile(file);
  return buildCatalogProbeRecord({source, beforeBytes, afterBytes, ffprobeResult, ffmpegResult});
}

export async function buildG4L3CatalogAudioMediaProbe({ffprobeCommand = "ffprobe", ffmpegCommand = "ffmpeg"} = {}) {
  const [workCardBytes, generatorBytes, normalizerBytes, ffprobe, ffmpeg] = await Promise.all([
    readFile(WORK_CARDS_PATH),
    readFile(GENERATOR_PATH),
    readFile(NORMALIZER_PATH),
    resolveExecutable(ffprobeCommand),
    resolveExecutable(ffmpegCommand),
  ]);
  const workCards = JSON.parse(workCardBytes);
  const sources = collectSources(workCards);
  const probes = await mapWithConcurrency(sources, CONCURRENCY, (source) => probeSource(source, {ffprobe, ffmpeg}));
  const languages = (field) => Object.fromEntries([...new Set(probes.map((probe) => probe.source[field]))].sort()
    .map((language) => [language, probes.filter((probe) => probe.source[field] === language).length]));
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-catalog-audio-technical-media-probe",
    generator: {path: portable(GENERATOR_PATH), sha256: sha256(generatorBytes), concurrency: CONCURRENCY},
    scope: {grade: 4, lesson: 3, canonicalItems: 40, catalogAudioFiles: 143},
    authorityBoundary: {
      acceptanceNeutral: true,
      sourceFilesChanged: 0,
      sourceAudioPlayed: false,
      spokenLanguageEstablished: false,
      cueMappingEstablished: false,
      runtimeSynchronizationEstablished: false,
      audibleQualityEstablished: false,
      listeningAcceptanceEstablished: false,
      authoritativeRuntimeEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      migrationOrRendererChanges: 0,
      approvalStatusOrLedgerChanges: 0,
      strictCompletionEstablished: false,
    },
    sourceBindings: {
      implementationWorkCards: {path: portable(WORK_CARDS_PATH), bytes: workCardBytes.length, sha256: sha256(workCardBytes)},
      mediaNormalizer: {path: portable(NORMALIZER_PATH), bytes: normalizerBytes.length, sha256: sha256(normalizerBytes)},
      tools: {ffprobe, ffmpeg},
    },
    summary: {
      sourceFileCount: probes.length,
      sourceBytes: probes.reduce((sum, probe) => sum + probe.source.bytes, 0),
      sourceReferenceCount: probes.reduce((sum, probe) => sum + probe.source.referencedByAnimationIds.length, 0),
      animationsWithCatalogAudio: new Set(probes.flatMap((probe) => probe.source.referencedByAnimationIds)).size,
      catalogLanguageCounts: languages("catalogLanguage"),
      normalizedLanguageCandidateCounts: languages("normalizedLanguageCandidate"),
      ffprobeParsedCount: probes.length,
      ffmpegDecodeCheckPassedCount: probes.length,
      sampleCountToolSupportedCount: probes.filter((probe) => probe.probe.media.sampleCount.toolSupported).length,
      probeSetSha256: fingerprint(probes.map((probe) => ({path: probe.source.path, fingerprint: probe.probeFingerprintSha256}))),
      listeningReviews: 0,
      acceptedAudioFiles: 0,
      strictComplete: 0,
    },
    probes,
    acceptance: {
      technicalCatalogAudioProbeReady: true,
      spokenLanguageAccepted: false,
      cueMappingAccepted: false,
      synchronizationAccepted: false,
      listeningAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "All 143 physical G4 L3 catalog MP3 files passed deterministic metadata parse and decode-to-null checks. These technical facts do not establish spoken language, cue mapping, runtime synchronization, audible quality, listening acceptance, original-runtime parity, human/owner acceptance, or strict completion.",
    },
  };
  return validateG4L3CatalogAudioMediaProbe(report);
}

export function validateG4L3CatalogAudioMediaProbe(report) {
  invariant(report?.schemaVersion === 1 && report?.reportType === "g4-l3-catalog-audio-technical-media-probe",
    "Unexpected G4 L3 catalog audio probe schema");
  invariant(report.scope?.catalogAudioFiles === 143 && report.probes?.length === 143,
    "G4 L3 catalog audio probe must contain 143 files");
  const seenPaths = new Set();
  for (const probe of report.probes) {
    const source = probe?.source;
    invariant(typeof source?.path === "string"
      && source.path.startsWith("source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/")
      && path.extname(source.path).toLowerCase() === ".mp3",
    "A catalog audio probe has an invalid G4 L3 source path");
    invariant(!seenPaths.has(source.path), `Catalog audio probe path is duplicated: ${source.path}`);
    seenPaths.add(source.path);
    invariant(Number.isSafeInteger(source.bytes) && source.bytes > 0 && /^[a-f0-9]{64}$/.test(source.sha256),
      `${source.path}: source byte/hash identity is invalid`);
    invariant(["en", "es", "und"].includes(source.catalogLanguage)
      && ["en", "es"].includes(source.normalizedLanguageCandidate),
    `${source.path}: language identity is invalid`);
    invariant(Array.isArray(source.referencedByAnimationIds) && source.referencedByAnimationIds.length > 0
      && new Set(source.referencedByAnimationIds).size === source.referencedByAnimationIds.length
      && sameCanonicalValue(source.referencedByAnimationIds, [...source.referencedByAnimationIds].sort()),
    `${source.path}: animation references must be non-empty, unique, and sorted`);
    const {probeFingerprintSha256, ...fingerprintedRecord} = probe;
    invariant(probeFingerprintSha256 === fingerprint(fingerprintedRecord),
      `${source.path}: probe fingerprint is missing or stale`);
  }
  const derived = derivedProbeSummary(report.probes);
  for (const field of ["sourceFileCount", "sourceBytes", "sourceReferenceCount", "animationsWithCatalogAudio",
    "ffprobeParsedCount", "ffmpegDecodeCheckPassedCount", "sampleCountToolSupportedCount", "probeSetSha256"]) {
    invariant(report.summary?.[field] === derived[field], `Catalog audio summary field ${field} is stale`);
  }
  invariant(sameCanonicalValue(report.summary?.catalogLanguageCounts, derived.catalogLanguageCounts),
    "Catalog audio summary field catalogLanguageCounts is stale");
  invariant(sameCanonicalValue(report.summary?.normalizedLanguageCandidateCounts, derived.normalizedLanguageCandidateCounts),
    "Catalog audio summary field normalizedLanguageCandidateCounts is stale");
  invariant(derived.sourceFileCount === 143 && derived.sourceBytes === 17798855
    && derived.sourceReferenceCount === 359 && derived.animationsWithCatalogAudio === 38,
  "G4 L3 catalog audio source totals drifted");
  invariant(sameCanonicalValue(derived.catalogLanguageCounts, {en: 60, es: 48, und: 35})
    && sameCanonicalValue(derived.normalizedLanguageCandidateCounts, {en: 60, es: 83}),
  "G4 L3 catalog audio language-candidate totals drifted");
  invariant(derived.ffprobeParsedCount === 143 && derived.ffmpegDecodeCheckPassedCount === 143
    && derived.sampleCountToolSupportedCount === 143,
  "G4 L3 catalog audio technical probes are incomplete");
  for (const field of ["listeningReviews", "acceptedAudioFiles", "strictComplete"]) {
    invariant(report.summary[field] === 0, `Catalog audio summary field ${field} must remain zero`);
  }
  const boundary = report.authorityBoundary;
  invariant(boundary?.acceptanceNeutral === true && boundary.sourceFilesChanged === 0
    && boundary.sourceAudioPlayed === false && boundary.spokenLanguageEstablished === false
    && boundary.cueMappingEstablished === false && boundary.runtimeSynchronizationEstablished === false
    && boundary.audibleQualityEstablished === false && boundary.listeningAcceptanceEstablished === false
    && boundary.authoritativeRuntimeEstablished === false && boundary.humanReviewEstablished === false
    && boundary.ownerAcceptanceEstablished === false && boundary.migrationOrRendererChanges === 0
    && boundary.approvalStatusOrLedgerChanges === 0 && boundary.strictCompletionEstablished === false,
  "G4 L3 catalog audio probe crossed its authority boundary");
  invariant(report.probes.every((probe) => probe.source.unchangedByProbe === true
    && probe.probe.status === "ffprobe-parsed-ffmpeg-decode-check-passed"
    && probe.probe.ffprobe.jsonParsed === true && probe.probe.ffmpegDecodeToNull.decodeCheckPassed === true
    && /^[a-f0-9]{64}$/.test(probe.probeFingerprintSha256)
    && Object.entries(probe.evidenceLimits).filter(([key]) => key !== "normalizedLanguageCandidateBasis")
      .every(([, value]) => value === false)),
  "A G4 L3 catalog audio probe is stale, failed, or over-claimed");
  invariant(report.acceptance?.technicalCatalogAudioProbeReady === true
    && ["spokenLanguageAccepted", "cueMappingAccepted", "synchronizationAccepted", "listeningAccepted",
      "ownerAccepted", "strictMigrationComplete"].every((field) => report.acceptance[field] === false),
  "G4 L3 catalog audio acceptance state drifted");
  return report;
}

export function renderMarkdown(report) {
  const rows = report.probes.map((probe) => `| \`${probe.source.path}\` | ${probe.source.catalogLanguage} | ${probe.source.normalizedLanguageCandidate} | ${probe.probe.media.audio.sampleRateHz} | ${probe.probe.media.audio.channels} | ${probe.probe.media.timing.durationSeconds} | pass |`);
  return [
    "# G4 L3 catalog audio technical media probe",
    "",
    "> Technical parse/decode evidence only. No audio was played and no language, synchronization, listening, parity, or acceptance gate is promoted.",
    "",
    "## Result",
    "",
    `- Physical catalog MP3 files: **${report.summary.sourceFileCount}** (${report.summary.sourceBytes} bytes).`,
    `- ffprobe parsed: **${report.summary.ffprobeParsedCount}/${report.summary.sourceFileCount}**.`,
    `- ffmpeg decode-to-null passed: **${report.summary.ffmpegDecodeCheckPassedCount}/${report.summary.sourceFileCount}**.`,
    `- Catalog language labels: en ${report.summary.catalogLanguageCounts.en}, es ${report.summary.catalogLanguageCounts.es}, und ${report.summary.catalogLanguageCounts.und}.`,
    "- The 35 `und` files have an existing Spanish path-convention candidate, but spoken language remains unestablished until runtime/listening evidence.",
    "",
    "| Source | Catalog lang | Candidate | Hz | Channels | Seconds | Decode |",
    "|---|---|---|---:|---:|---:|---|",
    ...rows,
    "",
    "## Boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {check: false, ffprobeCommand: "ffprobe", ffmpegCommand: "ffmpeg", jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--ffprobe") options.ffprobeCommand = argv[++index] || invariant(false, "--ffprobe requires a value");
    else if (argument === "--ffmpeg") options.ffmpegCommand = argv[++index] || invariant(false, "--ffmpeg requires a value");
    else if (argument === "--json-output") options.jsonOutput = path.resolve(argv[++index] || invariant(false, "--json-output requires a value"));
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(argv[++index] || invariant(false, "--markdown-output requires a value"));
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-g4-l3-catalog-audio-media-probe.mjs [--check] [--ffprobe <path>] [--ffmpeg <path>]\n");
    return;
  }
  await Promise.all([
    assertSafeReportOutput(options.jsonOutput, {root: ROOT, extension: ".json"}),
    assertSafeReportOutput(options.markdownOutput, {root: ROOT, extension: ".md"}),
  ]);
  const report = await buildG4L3CatalogAudioMediaProbe(options);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = `${renderMarkdown(report)}\n`;
  await Promise.all([
    writeOrCheckReport(options.jsonOutput, json, {root: ROOT, extension: ".json", check: options.check}),
    writeOrCheckReport(options.markdownOutput, markdown, {root: ROOT, extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: 143/143 G4 L3 catalog MP3 files parsed and decoded-to-null; acceptance effect none\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
