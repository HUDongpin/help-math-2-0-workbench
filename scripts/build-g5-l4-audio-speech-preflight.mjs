#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const LISTENING_REPORT = "reports/g5-l4-current-js-audio-listening-review-v1.json";
const REPORT_JSON = "reports/g5-l4-current-js-audio-speech-preflight-v1.json";
const REPORT_MARKDOWN = "reports/g5-l4-current-js-audio-speech-preflight-v1.md";
const EXPECTED_TRACK_COUNT = 185;
const MODEL = Object.freeze({
  provider: "ggerganov/whisper.cpp",
  file: "ggml-base-q5_1.bin",
  variant: "Whisper base multilingual q5_1",
  downloadUrl:
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin",
  bytes: 59_707_625,
  sha256: "422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898",
});
const ACCEPTANCE_FALSE_KEYS = Object.freeze([
  "spokenLanguageEstablished",
  "audibleContentAccepted",
  "intelligibilityAccepted",
  "technicalQualityAccepted",
  "currentJsSynchronizationAccepted",
  "humanListeningAccepted",
  "fq001AudioNotRequiredAccepted",
  "ownerAccepted",
  "strictComplete",
  "released",
  "published",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function readOrdinaryFile(absolute, label) {
  const before = await lstat(absolute);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const [bytes, realFile] = await Promise.all([readFile(absolute), realpath(absolute)]);
  const after = await lstat(absolute);
  invariant(
    realFile === absolute && after.isFile() && !after.isSymbolicLink() &&
      after.nlink === 1 && before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size,
    `${label}: changed while being read or is not canonical`,
  );
  return {bytes, size: bytes.length, sha256: sha256(bytes)};
}

async function readProjectFile(projectRoot, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 &&
      !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: expected a portable relative path`,
  );
  const absolute = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolute), `${label}: path escapes project root`);
  const lexical = await lstat(absolute);
  invariant(
    lexical.isFile() && !lexical.isSymbolicLink() && lexical.nlink === 1,
    `${label}: expected one ordinary non-linked project file`,
  );
  const rootReal = await realpath(projectRoot);
  const fileReal = await realpath(absolute);
  invariant(isWithin(rootReal, fileReal), `${label}: resolves outside project root`);
  const record = await readOrdinaryFile(fileReal, label);
  return {...record, absolute: fileReal, path: relativePath};
}

function descriptor(record, pathLabel = record.path) {
  return {path: pathLabel, bytes: record.size, sha256: record.sha256};
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function parseTimestamp(value) {
  invariant(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
      Number.isFinite(Date.parse(value)),
    "--executed-at must be an ISO-8601 UTC timestamp",
  );
  return value;
}

function transcriptFor(document) {
  invariant(Array.isArray(document?.transcription), "Whisper transcription is missing");
  return document.transcription
    .map((segment) => {
      invariant(typeof segment?.text === "string", "Whisper segment text is invalid");
      return segment.text.trim();
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenProbabilities(document) {
  return document.transcription.flatMap((segment) =>
    Array.isArray(segment.tokens)
      ? segment.tokens
        .filter((token) => typeof token?.p === "number" && Number.isFinite(token.p) &&
          typeof token?.text === "string" && token.text.trim().length > 0 &&
          !/^\[_.*\]$/.test(token.text.trim()))
        .map((token) => token.p)
      : [],
  );
}

async function locateResult(resultsRoot, trackId) {
  const candidates = [
    path.join(resultsRoot, `${trackId}.mp3.json`),
    path.join(resultsRoot, `${trackId}.json`),
  ];
  const available = [];
  for (const candidate of candidates) {
    const candidateStat = await lstat(candidate).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (candidateStat) {
      invariant(
        candidateStat.isFile() && !candidateStat.isSymbolicLink() &&
          candidateStat.nlink === 1,
        `${trackId}: Whisper result must be an ordinary non-linked file`,
      );
      available.push(candidate);
    }
  }
  invariant(available.length === 1, `${trackId}: expected exactly one Whisper JSON result`);
  invariant(isWithin(resultsRoot, available[0]), `${trackId}: result escapes result root`);
  const resultReal = await realpath(available[0]);
  invariant(isWithin(resultsRoot, resultReal), `${trackId}: result resolves outside result root`);
  return readOrdinaryFile(resultReal, `${trackId} Whisper JSON`);
}

function validateListeningReport(report) {
  invariant(
    report?.reviewId === "g5-l4-current-js-audio-listening-review-v1" &&
      report?.status === "unsigned-pending-human-listening-and-sync-review" &&
      report?.summary?.uniqueTrackCount === EXPECTED_TRACK_COUNT &&
      report?.summary?.humanReviewedTrackCount === 0 &&
      report?.acceptanceEffects?.spokenLanguageEstablished === false &&
      report?.acceptanceEffects?.humanListeningAccepted === false &&
      report?.ownerGate?.accepted === false,
    "listening report crossed its unsigned boundary",
  );
}

function validateWhisperDocument(document, trackId) {
  invariant(
    document?.model?.multilingual === true &&
      document?.params?.language === "auto" &&
      document?.params?.translate === false &&
      typeof document?.result?.language === "string" &&
      /^[a-z]{2,3}$/.test(document.result.language),
    `${trackId}: Whisper result is not a multilingual auto-detect, no-translation result`,
  );
}

async function whisperVersion(binary) {
  const {stdout, stderr} = await execFileAsync(binary, ["--version"], {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });
  const combined = `${stdout}\n${stderr}`;
  const match = /whisper\.cpp version:\s*([^\s]+)/.exec(combined);
  invariant(match, "unable to identify whisper.cpp version");
  return match[1];
}

export function validateG5L4AudioSpeechPreflight(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report?.artifactType === "g5-l4-current-js-audio-speech-preflight" &&
      report?.preflightId === "g5-l4-current-js-audio-speech-preflight-v1" &&
      report?.status === "machine-speech-preflight-complete-human-review-pending" &&
      report?.authority === "machine-advisory-only" &&
      report?.acceptanceEffect === "none",
    "speech preflight identity or authority changed",
  );
  invariant(
    report.model?.provider === MODEL.provider &&
      report.model?.file === MODEL.file &&
      report.model?.variant === MODEL.variant &&
      report.model?.downloadUrl === MODEL.downloadUrl &&
      report.model?.bytes === MODEL.bytes &&
      report.model?.sha256 === MODEL.sha256,
    "speech preflight model identity changed",
  );
  invariant(
    report.engine?.name === "whisper.cpp" &&
      typeof report.engine?.version === "string" && report.engine.version.length > 0 &&
      /^[a-f0-9]{64}$/.test(report.engine?.binarySha256 || "") &&
      Number.isSafeInteger(report.engine?.binaryBytes) && report.engine.binaryBytes > 0 &&
      report.invocation?.language === "auto" &&
      report.invocation?.translate === false &&
      report.invocation?.outputJsonFull === true &&
      report.invocation?.threads === 8 && report.invocation?.processors === 1,
    "speech preflight engine or invocation changed",
  );
  parseTimestamp(report.executedAt);
  invariant(Array.isArray(report.tracks) && report.tracks.length === EXPECTED_TRACK_COUNT,
    "speech preflight must contain exactly 185 track rows");
  invariant(new Set(report.tracks.map((track) => track.id)).size === EXPECTED_TRACK_COUNT,
    "speech preflight track IDs are not unique");
  for (const track of report.tracks) {
    invariant(
      typeof track.id === "string" &&
        ["en", "es"].includes(track.candidateLanguage) &&
        typeof track.detectedLanguage === "string" &&
        ["match", "mismatch"].includes(track.machineLanguageSignal) &&
        typeof track.transcriptCandidate === "string" &&
        Number.isSafeInteger(track.segmentCount) && track.segmentCount >= 0 &&
        Number.isSafeInteger(track.tokenProbabilityCount) && track.tokenProbabilityCount >= 0 &&
        (track.uncalibratedMeanTokenProbability === null ||
          (typeof track.uncalibratedMeanTokenProbability === "number" &&
            track.uncalibratedMeanTokenProbability >= 0 &&
            track.uncalibratedMeanTokenProbability <= 1)) &&
        ["review-first", "standard"].includes(track.humanReviewPriority) &&
        /^[a-f0-9]{64}$/.test(track.sourceSha256) &&
        /^[a-f0-9]{64}$/.test(track.rawWhisperJsonSha256) &&
        track.spokenLanguageEstablished === false &&
        track.humanListeningAccepted === false &&
        track.acceptanceEffect === "none",
      `${track.id || "unknown track"}: speech row crossed the machine-only boundary`,
    );
  }
  invariant(
    report.summary?.trackCount === EXPECTED_TRACK_COUNT &&
      report.summary?.humanReviewedTrackCount === 0 &&
      report.summary?.spokenLanguageEstablishedCount === 0 &&
      report.summary?.ownerAcceptedTrackCount === 0 &&
      report.summary?.publishedTrackCount === 0 &&
      Object.values(report.summary.detectedLanguageCounts || {}).reduce((sum, count) => sum + count, 0) === EXPECTED_TRACK_COUNT,
    "speech preflight summary changed",
  );
  invariant(
    ACCEPTANCE_FALSE_KEYS.every((key) => report.acceptanceEffects?.[key] === false) &&
      Object.keys(report.acceptanceEffects || {}).length === ACCEPTANCE_FALSE_KEYS.length,
    "speech preflight acceptance envelope changed",
  );
  return true;
}

export async function buildG5L4AudioSpeechPreflight({
  projectRoot = DEFAULT_PROJECT_ROOT,
  resultsDir,
  modelPath,
  whisperCli = "/opt/homebrew/bin/whisper-cli",
  executedAt,
} = {}) {
  invariant(resultsDir && modelPath, "write mode requires --results-dir and --model");
  const root = path.resolve(projectRoot);
  const resultsRoot = await realpath(path.resolve(resultsDir));
  const generatorPath = path.relative(root, SCRIPT_PATH).split(path.sep).join("/");
  const [generator, listening, model, engineBinary, engineVersion] = await Promise.all([
    readProjectFile(root, generatorPath, "generator"),
    readProjectFile(root, LISTENING_REPORT, "listening report"),
    readOrdinaryFile(await realpath(path.resolve(modelPath)), "Whisper model"),
    readOrdinaryFile(await realpath(path.resolve(whisperCli)), "whisper-cli binary"),
    whisperVersion(whisperCli),
  ]);
  invariant(
    model.size === MODEL.bytes && model.sha256 === MODEL.sha256,
    "Whisper model does not match the frozen multilingual model identity",
  );
  const listeningReport = JSON.parse(listening.bytes.toString("utf8"));
  validateListeningReport(listeningReport);
  const tracks = [];
  let systemInfo = null;
  for (const sourceTrack of listeningReport.tracks) {
    const [source, raw] = await Promise.all([
      readProjectFile(root, sourceTrack.outputPath, sourceTrack.id),
      locateResult(resultsRoot, sourceTrack.id),
    ]);
    invariant(
      source.size === sourceTrack.bytes && source.sha256 === sourceTrack.sha256,
      `${sourceTrack.id}: source MP3 changed after transcription packet`,
    );
    const document = JSON.parse(raw.bytes.toString("utf8"));
    validateWhisperDocument(document, sourceTrack.id);
    if (systemInfo === null) systemInfo = document.systeminfo;
    invariant(document.systeminfo === systemInfo, `${sourceTrack.id}: Whisper system identity changed within the batch`);
    const transcriptCandidate = transcriptFor(document);
    const probabilities = tokenProbabilities(document);
    const meanProbability = probabilities.length === 0
      ? null
      : round(probabilities.reduce((sum, value) => sum + value, 0) / probabilities.length);
    const detectedLanguage = document.result.language;
    const languageSignal = detectedLanguage === sourceTrack.candidateLanguage ? "match" : "mismatch";
    const humanReviewPriority =
      transcriptCandidate.length === 0 || languageSignal === "mismatch" ||
        meanProbability === null || meanProbability < 0.5
        ? "review-first"
        : "standard";
    tracks.push({
      id: sourceTrack.id,
      sourcePath: sourceTrack.outputPath,
      sourceBytes: sourceTrack.bytes,
      sourceSha256: sourceTrack.sha256,
      candidateLanguage: sourceTrack.candidateLanguage,
      detectedLanguage,
      machineLanguageSignal: languageSignal,
      transcriptCandidate,
      segmentCount: document.transcription.length,
      tokenProbabilityCount: probabilities.length,
      uncalibratedMeanTokenProbability: meanProbability,
      humanReviewPriority,
      rawWhisperJsonBytes: raw.size,
      rawWhisperJsonSha256: raw.sha256,
      rawWhisperJsonRetained: false,
      spokenLanguageEstablished: false,
      humanListeningAccepted: false,
      acceptanceEffect: "none",
    });
  }
  const detectedLanguageCounts = {};
  for (const track of tracks) {
    detectedLanguageCounts[track.detectedLanguage] =
      (detectedLanguageCounts[track.detectedLanguage] || 0) + 1;
  }
  const report = {
    schemaVersion: 1,
    artifactType: "g5-l4-current-js-audio-speech-preflight",
    preflightId: "g5-l4-current-js-audio-speech-preflight-v1",
    releaseId: "lesson-g05-l04-number-lines",
    status: "machine-speech-preflight-complete-human-review-pending",
    authority: "machine-advisory-only",
    authorityBoundary:
      "Whisper output is an unreviewed transcript and language signal used only to prioritize named-human listening. It is not authoritative transcription, spoken-language proof, content/intelligibility/quality acceptance, synchronization evidence, FQ001 disposition, Owner acceptance, release, deployment, or publication authority.",
    acceptanceEffect: "none",
    executedAt: parseTimestamp(executedAt),
    generator: descriptor(generator, generatorPath),
    sourceBindings: {
      listeningReview: descriptor(listening, LISTENING_REPORT),
    },
    model: MODEL,
    engine: {
      name: "whisper.cpp",
      version: engineVersion,
      binaryBytes: engineBinary.size,
      binarySha256: engineBinary.sha256,
      systemInfo,
    },
    invocation: {
      language: "auto",
      translate: false,
      outputJsonFull: true,
      threads: 8,
      processors: 1,
      inputMode: "exact-committed-mp3",
      commandShape:
        "whisper-cli -m <hash-verified-model> -t 8 -p 1 -l auto -ojf -np <185 exact MP3 files>",
    },
    summary: {
      trackCount: tracks.length,
      transcriptCandidateNonEmptyCount: tracks.filter((track) => track.transcriptCandidate.length > 0).length,
      transcriptCandidateEmptyCount: tracks.filter((track) => track.transcriptCandidate.length === 0).length,
      candidateLanguageMatchCount: tracks.filter((track) => track.machineLanguageSignal === "match").length,
      candidateLanguageMismatchCount: tracks.filter((track) => track.machineLanguageSignal === "mismatch").length,
      humanReviewFirstCount: tracks.filter((track) => track.humanReviewPriority === "review-first").length,
      standardHumanReviewCount: tracks.filter((track) => track.humanReviewPriority === "standard").length,
      detectedLanguageCounts,
      humanReviewedTrackCount: 0,
      spokenLanguageEstablishedCount: 0,
      ownerAcceptedTrackCount: 0,
      publishedTrackCount: 0,
    },
    tracks,
    acceptanceEffects: Object.fromEntries(ACCEPTANCE_FALSE_KEYS.map((key) => [key, false])),
  };
  validateG5L4AudioSpeechPreflight(report);
  return report;
}

function markdownFor(report) {
  const languageCounts = Object.entries(report.summary.detectedLanguageCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([language, count]) => `${language}=${count}`)
    .join(", ");
  const rows = report.tracks.map((track) =>
    `| ${track.id} | ${track.candidateLanguage} | ${track.detectedLanguage} | ${track.machineLanguageSignal} | ${track.uncalibratedMeanTokenProbability ?? "n/a"} | ${track.humanReviewPriority} | ${track.transcriptCandidate.replaceAll("|", "\\|")} |`,
  );
  return `# G5 L4 current-JS audio speech preflight v1\n\n` +
    `Status: **${report.status}**. Authority: **${report.authority}**. Acceptance effect: **none**.\n\n` +
    `This report uses a frozen multilingual Whisper model only to prioritize the still-required named-human listening review. Machine output is not a transcript acceptance, language acceptance, synchronization review, FQ001 decision, or Owner acceptance.\n\n` +
    `## Batch identity\n\n` +
    `- Executed at: \`${report.executedAt}\`\n` +
    `- Model: ${report.model.variant}; ${report.model.bytes} bytes; \`${report.model.sha256}\`\n` +
    `- Engine: whisper.cpp ${report.engine.version}; binary \`${report.engine.binarySha256}\`\n` +
    `- Tracks: **${report.summary.trackCount}/185** machine-processed; human-reviewed: **0/185**.\n` +
    `- Non-empty/empty transcript candidates: **${report.summary.transcriptCandidateNonEmptyCount}/${report.summary.transcriptCandidateEmptyCount}**.\n` +
    `- Candidate-language machine matches/mismatches: **${report.summary.candidateLanguageMatchCount}/${report.summary.candidateLanguageMismatchCount}**.\n` +
    `- Review-first/standard human queue: **${report.summary.humanReviewFirstCount}/${report.summary.standardHumanReviewCount}**.\n` +
    `- Detected-language signals: ${languageCounts}.\n\n` +
    `Token probability is an uncalibrated model diagnostic, not an acceptance score. Short answer labels and legacy educational audio can be misdetected; every track still requires actual listening.\n\n` +
    `## Track matrix\n\n` +
    `| Track ID | Candidate | Machine detected | Signal | Mean token p | Human queue | Unreviewed transcript candidate |\n` +
    `|---|---|---|---|---:|---|---|\n${rows.join("\n")}\n\n` +
    `## Protected boundary\n\n` +
    `Spoken language, content, intelligibility, technical quality, Current-JS synchronization, human listening, FQ001 not-required disposition, Owner acceptance, strict completion, release, deployment, and publication all remain **false**.\n`;
}

async function writeAtomic(absolute, bytes, artifactType) {
  await mkdir(path.dirname(absolute), {recursive: true});
  const existing = await readFile(absolute).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (existing?.equals(bytes)) return;
  if (existing && absolute.endsWith(".json")) {
    invariant(JSON.parse(existing.toString("utf8"))?.artifactType === artifactType,
      `${absolute}: refusing to replace an unmanaged file`);
  }
  const temporary = `${absolute}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, absolute);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

export async function checkG5L4AudioSpeechPreflight({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const root = path.resolve(projectRoot);
  const [reportRecord, markdownRecord, generator, listening] = await Promise.all([
    readProjectFile(root, REPORT_JSON, "speech preflight JSON"),
    readProjectFile(root, REPORT_MARKDOWN, "speech preflight Markdown"),
    readProjectFile(root, path.relative(root, SCRIPT_PATH).split(path.sep).join("/"), "generator"),
    readProjectFile(root, LISTENING_REPORT, "listening report"),
  ]);
  const report = JSON.parse(reportRecord.bytes.toString("utf8"));
  validateG5L4AudioSpeechPreflight(report);
  invariant(stableJson(report) === reportRecord.bytes.toString("utf8"), "speech preflight JSON is not stable");
  invariant(markdownFor(report) === markdownRecord.bytes.toString("utf8"), "speech preflight Markdown is stale");
  invariant(
    report.generator.path === generator.path &&
      report.generator.bytes === generator.size &&
      report.generator.sha256 === generator.sha256,
    "speech preflight generator binding is stale",
  );
  invariant(
    report.sourceBindings.listeningReview.path === LISTENING_REPORT &&
      report.sourceBindings.listeningReview.bytes === listening.size &&
      report.sourceBindings.listeningReview.sha256 === listening.sha256,
    "speech preflight listening-report binding is stale",
  );
  const listeningReport = JSON.parse(listening.bytes.toString("utf8"));
  validateListeningReport(listeningReport);
  invariant(listeningReport.tracks.length === report.tracks.length, "speech/listening track count changed");
  for (let index = 0; index < report.tracks.length; index += 1) {
    const row = report.tracks[index];
    const source = listeningReport.tracks[index];
    invariant(
      row.id === source.id && row.sourcePath === source.outputPath &&
        row.sourceBytes === source.bytes && row.sourceSha256 === source.sha256,
      `${row.id}: speech/listening source binding changed`,
    );
    const bytes = await readProjectFile(root, row.sourcePath, row.id);
    invariant(bytes.size === row.sourceBytes && bytes.sha256 === row.sourceSha256,
      `${row.id}: committed MP3 bytes changed`);
  }
  return report;
}

export function parseArguments(argv) {
  const options = {mode: "check", resultsDir: null, modelPath: null, whisperCli: "/opt/homebrew/bin/whisper-cli", executedAt: null};
  let modeSeen = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      invariant(!modeSeen, "choose exactly one mode");
      modeSeen = true;
      options.mode = argument.slice(2);
    } else if (argument === "--results-dir") options.resultsDir = argv[++index];
    else if (argument === "--model") options.modelPath = argv[++index];
    else if (argument === "--whisper-cli") options.whisperCli = argv[++index];
    else if (argument === "--executed-at") options.executedAt = argv[++index];
    else if (argument === "--help") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  if (options.mode === "write" && !options.help) {
    invariant(options.resultsDir && options.modelPath && options.executedAt,
      "write mode requires --results-dir, --model, and --executed-at");
  }
  return options;
}

function usage() {
  return `Usage:\n  node scripts/build-g5-l4-audio-speech-preflight.mjs --check\n  node scripts/build-g5-l4-audio-speech-preflight.mjs --write --results-dir DIR --model MODEL --executed-at ISO_UTC [--whisper-cli PATH]\n\nCheck mode validates the committed machine-advisory report and all current source bindings; it does not re-run transcription. Write mode imports exact whisper.cpp full-JSON outputs. Neither mode performs or accepts human listening.`;
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else if (options.mode === "check") {
      const report = await checkG5L4AudioSpeechPreflight();
      process.stdout.write(`G5 L4 speech preflight check: ${report.tracks.length} machine rows; humanReviewed=0\n`);
    } else {
      const report = await buildG5L4AudioSpeechPreflight({
        resultsDir: options.resultsDir,
        modelPath: options.modelPath,
        whisperCli: options.whisperCli,
        executedAt: options.executedAt,
      });
      await Promise.all([
        writeAtomic(path.resolve(DEFAULT_PROJECT_ROOT, REPORT_JSON), Buffer.from(stableJson(report)), report.artifactType),
        writeAtomic(path.resolve(DEFAULT_PROJECT_ROOT, REPORT_MARKDOWN), Buffer.from(markdownFor(report)), report.artifactType),
      ]);
      process.stdout.write(`G5 L4 speech preflight write: ${report.tracks.length} machine rows; humanReviewed=0\n`);
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  }
}
