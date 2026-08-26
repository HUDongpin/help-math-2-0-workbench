#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  lstat,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import { gunzipSync } from "node:zlib";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

import { PILOT_MIGRATIONS } from "./scaffold-pilot-migrations.mjs";
import {
  FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION,
  fqAudioSourceStructureSha256,
  projectionDescriptor,
} from "./evidence-projections.mjs";
import { selectVerifiedLessonReleaseMembers } from "./build-course-scenario-inventories.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const originalRoot = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const defaultLessonReleasesPath = path.join(projectRoot, "catalog", "lesson-releases.json");
const SAFE_CATALOG_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const audioHeader = [
  "cue_id",
  "language",
  "source_file",
  "sha256",
  "start_frame",
  "start_frame_domain_id",
  "start_semantics",
  "duration_ms",
  "format",
  "channels",
  "sample_rate_hz",
  "source_character_id",
  "notes",
];

const swfSoundRates = Object.freeze({ 0: 5512.5, 1: 11025, 2: 22050, 3: 44100 });
const swfSoundFormats = Object.freeze({
  0: "uncompressed-native-endian",
  1: "adpcm",
  2: "mp3",
  3: "uncompressed-little-endian",
  4: "nellymoser-16khz",
  5: "nellymoser-8khz",
  6: "nellymoser",
  11: "speex",
});

const strictNoAudioPilotIds = new Set([
  "course-g03-l08-re-001",
  "keyterm-elementary-computeghgh",
]);

export const ADDITIONAL_AUDIO_AUDIT_IDS = Object.freeze([
  "shell-course-g04-l03-index-local",
  "course-g04-l03-ts-006",
]);

export const SOURCE_DERIVED_FQ_AUDIO_PILOT_ID = "course-g03-l06-fq-002-review";
const FQ_EXPECTED_LANGUAGES = Object.freeze([
  Object.freeze({ language: "en", directory: "EA" }),
  Object.freeze({ language: "es", directory: "SA" }),
]);
const FQ_EXPECTED_OPTIONS = Object.freeze(["A", "B", "C", "D"]);

function usage() {
  return `Usage:
  node scripts/audit-pilot-audio.mjs [--id <animation-id>] [--check]
  node scripts/audit-pilot-audio.mjs --lesson-release <release-id> \\
    [--id <exact-member-id> ...] [--check]

Audits external and SWF-embedded audio for the approved pilots and explicitly
selected course-shell audits, or an explicitly named atomic lesson release's
exact verified members. Omitting --id with --lesson-release selects that
release's complete ordered member set. The command writes only audio-inventory.csv and
audit/audio-runtime-evidence.json, never changes migration status, and preflights
all selected inputs before writing. --check fails if generated evidence differs.

Options:
  --lesson-release <release-id>   Required for non-legacy IDs
  --lesson-releases <file>        Release catalog (default: catalog/lesson-releases.json)`;
}

export function parseArguments(argv) {
  const options = {
    ids: [],
    check: false,
    help: false,
    lessonRelease: null,
    lessonReleasesPath: defaultLessonReleasesPath,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (["--id", "--lesson-release", "--lesson-releases"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else if (value === "--lesson-release") options.lessonRelease = next;
      else options.lessonReleasesPath = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function parseAttributes(line) {
  const attributes = {};
  for (const match of line.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) attributes[match[1]] = match[2];
  return attributes;
}

function integer(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, places = 6) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

export function classifyAudioLanguage(sourcePath) {
  const segments = sourcePath.replaceAll("\\", "/").split("/").map((part) => part.toUpperCase());
  const routed = (language, evidence) => ({
    language,
    routingLanguage: language,
    classificationScope: "legacy-host-routing-only",
    confidence: "verified-structural",
    spokenLanguage: null,
    spokenLanguageEstablished: false,
    evidence,
  });
  if (segments.includes("EAD")) {
    return routed(
      "en",
      "EAD is selected by the legacy host when its audio-language argument is English.",
    );
  }
  if (segments.includes("SAD")) {
    return routed(
      "es",
      "SAD is selected by the legacy host for the non-English/Spanish branch.",
    );
  }
  if (segments.includes("EA")) {
    return routed(
      "en",
      "The legacy host maps language code EN to the EA directory.",
    );
  }
  if (segments.includes("SA")) {
    return routed(
      "es",
      "The legacy host maps language code SP and Spanish page audio to the SA directory.",
    );
  }
  return {
    language: "und",
    routingLanguage: null,
    classificationScope: "unresolved",
    confidence: "unresolved",
    spokenLanguage: null,
    spokenLanguageEstablished: false,
    evidence: "No EAD/SAD/EA/SA directory or equivalent authoritative language selector identifies this track.",
  };
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

function requireAudioEvidence(condition, message) {
  if (!condition) throw new Error(message);
}

export function extractActionScriptFunction(source, functionName) {
  const match = new RegExp(`\\bfunction\\s+${functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`).exec(source);
  if (!match) return null;
  const openBrace = source.indexOf("{", match.index + match[0].length);
  if (openBrace < 0) return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openBrace; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(match.index, index + 1);
      if (depth < 0) return null;
    }
  }
  return null;
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function normalizeProjectPath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function absolute(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
}

function projectRelative(filePath) {
  return path.relative(projectRoot, path.resolve(filePath)).replaceAll("\\", "/");
}

function isContainedPath(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === "" || (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

async function requireOrdinaryProjectFile(filePath, label) {
  const resolved = path.resolve(filePath);
  const relativePath = projectRelative(resolved);
  requireAudioEvidence(
    relativePath && relativePath !== ".." && !relativePath.startsWith("../"),
    `${label} must stay inside the project root`,
  );
  const metadata = await lstat(resolved);
  requireAudioEvidence(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${label} must be one ordinary, non-linked file`,
  );
  const [canonicalProjectRoot, canonicalPath] = await Promise.all([
    realpath(projectRoot),
    realpath(resolved),
  ]);
  requireAudioEvidence(
    isContainedPath(canonicalProjectRoot, canonicalPath) && canonicalPath === resolved,
    `${label} must have a project-contained, link-free realpath`,
  );
  return { resolved, relativePath, canonicalPath, metadata };
}

export async function loadLessonReleaseAudioMemberships({
  ids,
  lessonRelease,
  lessonReleasesPath = defaultLessonReleasesPath,
}) {
  requireAudioEvidence(SAFE_CATALOG_ID.test(lessonRelease || ""), `Unsafe lesson release ID: ${lessonRelease || "missing"}`);
  const descriptor = await requireOrdinaryProjectFile(lessonReleasesPath, "Lesson release catalog");
  const bytes = await readFile(descriptor.resolved);
  const catalog = JSON.parse(bytes.toString("utf8"));
  let selectedIds = ids;
  if (!selectedIds.length) {
    const releases = Array.isArray(catalog?.releases)
      ? catalog.releases.filter(({releaseId}) => releaseId === lessonRelease)
      : [];
    requireAudioEvidence(
      releases.length === 1 && Array.isArray(releases[0]?.members),
      releases.length > 1
        ? `Lesson release ID is duplicated: ${lessonRelease}`
        : `Unknown lesson release: ${lessonRelease}`,
    );
    selectedIds = releases[0].members.map(({animationId}) => animationId);
  }
  const members = selectVerifiedLessonReleaseMembers(
    catalog,
    selectedIds,
    { releaseId: lessonRelease },
  );
  const mismatches = members.filter(({ releaseId }) => releaseId !== lessonRelease).map(({ animationId, releaseId }) => `${animationId} (${releaseId})`);
  requireAudioEvidence(
    mismatches.length === 0,
    `Explicit ID(s) are not members of requested lesson release ${lessonRelease}: ${mismatches.join(", ")}`,
  );
  const catalogBinding = {
    path: descriptor.relativePath,
    bytes: bytes.length,
    sha256: sha256Text(bytes),
  };
  return new Map(members.map((member) => [
    member.animationId,
    { ...member, catalogBinding },
  ]));
}

function normalizeManifestAudioAssociations(manifest) {
  return (manifest.audio?.catalogExactAssociations || []).map((record) => ({
    sourceFile: normalizeProjectPath(record.sourceFile || ""),
    sha256: record.sha256,
    bytes: Number(record.bytes),
  })).sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
}

function normalizeCatalogAudioAssociations(animation) {
  return (animation.audio?.exact || []).map((record) => ({
    sourceFile: `${originalRoot}/${normalizeProjectPath(record.path || "")}`,
    sha256: record.sha256,
    bytes: Number(record.bytes),
  })).sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
}

export async function verifyLessonReleaseAudioIdentity({
  membership,
  manifest,
  animation,
}) {
  const id = membership.animationId;
  const expectedSwf = `${originalRoot}/${membership.source.path}`;
  requireAudioEvidence(
    manifest.id === id &&
    manifest.animationId === id &&
    manifest.assetId === membership.assetId &&
    manifest.source?.swf === expectedSwf &&
    manifest.source?.placementPath === expectedSwf &&
    manifest.source?.swfSha256 === membership.source.sha256,
    `${id}: migration workspace identity differs from lesson-release membership`,
  );
  requireAudioEvidence(
    animation?.animationId === id &&
    animation.assetId === membership.assetId &&
    animation.source?.path === membership.source.path &&
    animation.source?.sha256 === membership.source.sha256 &&
    Number.isSafeInteger(animation.source?.bytes) &&
    animation.source.bytes > 0,
    `${id}: animations catalog identity differs from lesson-release membership`,
  );
  requireAudioEvidence(
    manifest.audio?.inventoryFile === "audio-inventory.csv",
    `${id}: canonical audio inventory path changed`,
  );
  requireAudioEvidence(
    JSON.stringify(normalizeManifestAudioAssociations(manifest)) === JSON.stringify(normalizeCatalogAudioAssociations(animation)),
    `${id}: workspace exact-audio associations differ from animations catalog`,
  );
  requireAudioEvidence(
    JSON.stringify([...(manifest.audio?.catalogGroupCandidates || [])].sort()) ===
      JSON.stringify([...(animation.audio?.groupIds || [])].sort()),
    `${id}: workspace audio-group candidates differ from animations catalog`,
  );
  const sourceDescriptor = await requireOrdinaryProjectFile(absolute(expectedSwf), `${id} preserved source SWF`);
  const observedSha256 = await sha256File(sourceDescriptor.resolved);
  requireAudioEvidence(
    sourceDescriptor.metadata.size === animation.source.bytes &&
    observedSha256 === membership.source.sha256,
    `${id}: physical source SWF differs from release/catalog/workspace binding`,
  );
  return {
    artifactId: "lesson-release-membership",
    catalog: membership.catalogBinding,
    releaseId: membership.releaseId,
    publicationMode: membership.publicationMode,
    expectedMemberCount: membership.expectedMemberCount,
    ordinal: membership.ordinal,
    animationId: id,
    assetId: membership.assetId,
    releaseRole: membership.releaseRole,
    source: {
      path: membership.source.path,
      bytes: sourceDescriptor.metadata.size,
      sha256: observedSha256,
    },
    authorityBoundary: "Release membership authorizes this structural audio audit only; it does not establish audible language/content, original-runtime behavior, human review, owner acceptance, strict completion, or publication.",
  };
}

function csvParse(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value !== "")) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvRender(rows) {
  return `${audioHeader.join(",")}\n${rows.map((row) => audioHeader.map((header) => csvEscape(row[header] ?? "")).join(",")).join("\n")}${rows.length ? "\n" : ""}`;
}

function parseFfprobeJson(stdout) {
  const payload = JSON.parse(stdout);
  const stream = (payload.streams || []).find((candidate) => candidate.codec_type === "audio") || payload.streams?.[0] || {};
  const format = payload.format || {};
  const durationSeconds = number(format.duration) ?? number(stream.duration);
  return {
    codecName: stream.codec_name || null,
    codecLongName: stream.codec_long_name || null,
    profile: stream.profile || null,
    sampleFormat: stream.sample_fmt || null,
    sampleRateHz: integer(stream.sample_rate),
    channels: integer(stream.channels),
    channelLayout: stream.channel_layout || null,
    streamStartSeconds: number(stream.start_time),
    streamDurationSeconds: number(stream.duration),
    durationSeconds,
    durationMs: Number.isFinite(durationSeconds) ? Math.round(durationSeconds * 1000) : null,
    streamBitRateBps: integer(stream.bit_rate),
    containerBitRateBps: integer(format.bit_rate),
    formatName: format.format_name || null,
    formatLongName: format.format_long_name || null,
    probeSizeBytes: integer(format.size),
    tags: format.tags || {},
  };
}

async function ffprobeFile(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries",
    "stream=codec_name,codec_long_name,codec_type,profile,sample_fmt,sample_rate,channels,channel_layout,start_time,duration,bit_rate:format=format_name,format_long_name,duration,size,bit_rate:format_tags",
    "-of", "json",
    filePath,
  ], { maxBuffer: 10 * 1024 * 1024 });
  return parseFfprobeJson(stdout);
}

async function toolVersion(command, args) {
  const { stdout, stderr } = await execFileAsync(command, args, { maxBuffer: 10 * 1024 * 1024 });
  return `${stdout}${stderr}`.split(/\r?\n/).find(Boolean)?.trim() || "unknown";
}

function contextLabel(context, linkageById) {
  if (context.kind === "root") return "root";
  const linkage = linkageById.get(String(context.characterId));
  return linkage ? `sprite:${context.characterId}:${linkage}` : `sprite:${context.characterId}`;
}

function soundRate(rateCode) {
  return swfSoundRates[rateCode] ?? null;
}

function soundFormat(formatCode) {
  return swfSoundFormats[formatCode] || `unknown-${formatCode}`;
}

function decodeMp3StreamBlockPrefix(base64) {
  if (!base64) return { sampleCount: null, seekSamples: null };
  const prefix = Buffer.from(base64.slice(0, 12), "base64");
  if (prefix.length < 4) return { sampleCount: null, seekSamples: null };
  return { sampleCount: prefix.readUInt16LE(0), seekSamples: prefix.readInt16LE(2) };
}

/**
 * Parse only audio-relevant swfmill tags. The extractor deliberately ignores
 * base64 payloads after reading the four-byte MP3 stream-block header.
 */
export async function parseSwfmillAudio(xmlGzipPath) {
  const input = createReadStream(xmlGzipPath).pipe((await import("node:zlib")).createGunzip());
  const lines = createInterface({ input, crlfDelay: Infinity });
  const root = { kind: "root", characterId: null, declaredFrames: null, frame: 1 };
  const contexts = [root];
  const defineSounds = [];
  const soundStreams = [];
  const startSounds = [];
  const linkageById = new Map();
  let activeStream = null;
  let pendingStreamBlock = null;
  let pendingStartSound = null;
  let lineNumber = 0;

  for await (const rawLine of lines) {
    lineNumber += 1;
    const line = rawLine.trim();
    const context = contexts.at(-1);

    if (line.startsWith("<Header ")) {
      const attrs = parseAttributes(line);
      root.declaredFrames = integer(attrs.frames);
      root.frameRate = number(attrs.framerate);
    }

    if (line.startsWith("<DefineSprite ")) {
      const attrs = parseAttributes(line);
      contexts.push({
        kind: "sprite",
        characterId: integer(attrs.objectID),
        declaredFrames: integer(attrs.frames),
        frame: 1,
      });
      activeStream = null;
      continue;
    }
    if (line === "</DefineSprite>") {
      contexts.pop();
      activeStream = null;
      continue;
    }

    if (line.startsWith("<DefineSound ")) {
      const attrs = parseAttributes(line);
      const rateCode = integer(attrs.rate);
      const samples = integer(attrs.samples);
      const sampleRateHz = soundRate(rateCode);
      defineSounds.push({
        characterId: integer(attrs.objectID),
        linkage: null,
        formatCode: integer(attrs.format),
        format: soundFormat(integer(attrs.format)),
        rateCode,
        sampleRateHz,
        sampleSizeBits: attrs.is16bit === "1" ? 16 : 8,
        channels: attrs.stereo === "1" ? 2 : 1,
        samples,
        durationSeconds: sampleRateHz && samples !== null ? round(samples / sampleRateHz) : null,
        durationMs: sampleRateHz && samples !== null ? Math.round((samples / sampleRateHz) * 1000) : null,
        evidence: { file: "audit/machine/swfmill.xml.gz", line: lineNumber },
      });
    }

    const symbolTag = line.match(/<Symbol\s+[^>]*\/?>(?:<\/Symbol>)?/i)?.[0];
    if (symbolTag) {
      const attrs = parseAttributes(symbolTag);
      if (attrs.objectID && attrs.name !== undefined) linkageById.set(String(attrs.objectID), attrs.name);
    }

    if (/^<SoundStreamHead2?\s/.test(line)) {
      const attrs = parseAttributes(line);
      const rateCode = integer(attrs.soundRate);
      const sampleRateHz = soundRate(rateCode);
      activeStream = {
        streamIndex: soundStreams.length + 1,
        context: { kind: context.kind, characterId: context.characterId },
        contextLabel: null,
        contextDeclaredFrames: context.declaredFrames,
        headFrame: context.frame,
        firstBlockFrame: null,
        lastBlockFrame: null,
        syncMode: "stream",
        stop: false,
        loops: null,
        compressionCode: integer(attrs.compression),
        format: soundFormat(integer(attrs.compression)),
        playbackRateCode: integer(attrs.playbackRate),
        playbackSampleRateHz: soundRate(integer(attrs.playbackRate)),
        playbackSampleSizeBits: attrs.playbackSize === "1" ? 16 : 8,
        playbackChannels: attrs.playbackStereo === "1" ? 2 : 1,
        rateCode,
        sampleRateHz,
        sampleSizeBits: attrs.soundSize === "1" ? 16 : 8,
        channels: attrs.soundStereo === "1" ? 2 : 1,
        nominalSamplesPerBlock: integer(attrs.sampleSize),
        blockCount: 0,
        blocksWithDecodedSampleCount: 0,
        totalDecodedSamples: 0,
        seekSamplesMin: null,
        seekSamplesMax: null,
        durationSeconds: null,
        durationMs: null,
        durationBasis: null,
        evidence: { file: "audit/machine/swfmill.xml.gz", headLine: lineNumber },
      };
      soundStreams.push(activeStream);
    }

    if (line === "<SoundStreamBlock>") {
      if (activeStream) {
        pendingStreamBlock = { stream: activeStream, frame: context.frame, line: lineNumber };
        activeStream.blockCount += 1;
        if (activeStream.firstBlockFrame === null) activeStream.firstBlockFrame = context.frame;
        activeStream.lastBlockFrame = context.frame;
      }
    } else if (pendingStreamBlock && line.startsWith("<data>")) {
      const base64 = line.slice(6, line.lastIndexOf("</data>"));
      if (pendingStreamBlock.stream.compressionCode === 2) {
        const decoded = decodeMp3StreamBlockPrefix(base64);
        if (decoded.sampleCount !== null) {
          pendingStreamBlock.stream.blocksWithDecodedSampleCount += 1;
          pendingStreamBlock.stream.totalDecodedSamples += decoded.sampleCount;
          pendingStreamBlock.stream.seekSamplesMin = pendingStreamBlock.stream.seekSamplesMin === null
            ? decoded.seekSamples
            : Math.min(pendingStreamBlock.stream.seekSamplesMin, decoded.seekSamples);
          pendingStreamBlock.stream.seekSamplesMax = pendingStreamBlock.stream.seekSamplesMax === null
            ? decoded.seekSamples
            : Math.max(pendingStreamBlock.stream.seekSamplesMax, decoded.seekSamples);
        }
      } else if (pendingStreamBlock.stream.compressionCode === 0 || pendingStreamBlock.stream.compressionCode === 3) {
        const bytesPerSampleFrame = pendingStreamBlock.stream.channels * (pendingStreamBlock.stream.sampleSizeBits / 8);
        const decodedBytes = Buffer.from(base64, "base64").length;
        const sampleCount = bytesPerSampleFrame ? decodedBytes / bytesPerSampleFrame : null;
        if (Number.isInteger(sampleCount)) {
          pendingStreamBlock.stream.blocksWithDecodedSampleCount += 1;
          pendingStreamBlock.stream.totalDecodedSamples += sampleCount;
        }
      }
      pendingStreamBlock = null;
    }

    if (/^<StartSound2?\s/.test(line)) {
      const attrs = parseAttributes(line);
      pendingStartSound = {
        characterId: integer(attrs.objectID),
        className: attrs.soundClassName || null,
        linkage: null,
        context: { kind: context.kind, characterId: context.characterId },
        contextLabel: null,
        localFrame: context.frame,
        syncMode: "event",
        stop: false,
        noMultiple: false,
        loopCount: 1,
        inPoint: null,
        outPoint: null,
        envelopePointCount: 0,
        evidence: { file: "audit/machine/swfmill.xml.gz", line: lineNumber },
      };
      startSounds.push(pendingStartSound);
    } else if (pendingStartSound && line.includes("<SoundInfo")) {
      const attrs = parseAttributes(line.slice(line.indexOf("<SoundInfo")));
      pendingStartSound.stop = attrs.syncStop === "1";
      pendingStartSound.noMultiple = attrs.syncNoMultiple === "1";
      pendingStartSound.syncMode = pendingStartSound.stop ? "stop" : (pendingStartSound.noMultiple ? "event-no-multiple" : "event");
      pendingStartSound.loopCount = integer(attrs.loopCount) ?? integer(attrs.loops) ?? 1;
      pendingStartSound.inPoint = integer(attrs.inPoint);
      pendingStartSound.outPoint = integer(attrs.outPoint);
    } else if (pendingStartSound && line.startsWith("<SoundEnvelope")) {
      pendingStartSound.envelopePointCount += 1;
    } else if (pendingStartSound && (/^<\/StartSound2?>$/.test(line) || /^<StartSound2?\s[^>]*\/>$/.test(line))) pendingStartSound = null;

    if (line === "<ShowFrame/>") context.frame += 1;
  }

  for (const sound of defineSounds) sound.linkage = linkageById.get(String(sound.characterId)) || null;
  for (const stream of soundStreams) {
    stream.contextLabel = contextLabel(stream.context, linkageById);
    if (stream.sampleRateHz && stream.totalDecodedSamples > 0) {
      stream.durationSeconds = round(stream.totalDecodedSamples / stream.sampleRateHz);
      stream.durationMs = Math.round((stream.totalDecodedSamples / stream.sampleRateHz) * 1000);
      stream.durationBasis = stream.compressionCode === 2
        ? "sum-of-mp3-soundstreamblock-sample-counts"
        : "sum-of-uncompressed-soundstreamblock-sample-counts";
    } else if (stream.sampleRateHz && stream.nominalSamplesPerBlock && stream.blockCount) {
      stream.durationSeconds = round((stream.nominalSamplesPerBlock * stream.blockCount) / stream.sampleRateHz);
      stream.durationMs = Math.round(((stream.nominalSamplesPerBlock * stream.blockCount) / stream.sampleRateHz) * 1000);
      stream.durationBasis = "nominal-samples-per-block-times-block-count";
    }
  }
  for (const event of startSounds) {
    event.linkage = event.characterId === null ? null : linkageById.get(String(event.characterId)) || null;
    event.contextLabel = contextLabel(event.context, linkageById);
  }
  return {
    rootTimeline: { frameRate: root.frameRate, declaredFrames: root.declaredFrames },
    defineSounds,
    soundStreams,
    startSounds,
    exportedSoundLinkages: defineSounds.filter(({ linkage }) => linkage).map(({ characterId, linkage }) => ({ characterId, linkage })),
  };
}

export function parseScriptAudioOperations(scriptText) {
  const blocks = [];
  let current = { location: "unscoped", lines: [] };
  for (const line of scriptText.split(/\r?\n/)) {
    const heading = line.match(/^===== (.+) =====$/);
    if (heading) {
      if (current.lines.length) blocks.push(current);
      current = { location: heading[1], lines: [] };
    } else current.lines.push(line);
  }
  if (current.lines.length) blocks.push(current);

  const knownSoundReceivers = new Set();
  for (const block of blocks) {
    for (const line of block.lines) {
      const assignment = line.match(/^\s*([A-Za-z_$][\w.$]*(?:\[[^\]]+\])?)\s*=\s*new\s+Sound\s*\(/i);
      if (assignment) knownSoundReceivers.add(assignment[1].toLowerCase());
    }
  }

  const findings = [];
  for (const block of blocks) {
    const localFrame = integer(block.location.match(/(?:^|\/)frame_(\d+)(?:\/|$)/)?.[1]);
    for (let index = 0; index < block.lines.length; index += 1) {
      const line = block.lines[index].trim();
      const match = line.match(/([A-Za-z_$][\w.$]*(?:\[[^\]]+\])?)\.(attachSound|loadSound|start|stop)\s*\((.*)\)\s*;?/i);
      if (!match) continue;
      const receiver = match[1];
      const operation = match[2];
      const receiverLooksLikeSound = knownSoundReceivers.has(receiver.toLowerCase()) || /(?:sound|snd|audio)/i.test(receiver) || /(?:^|\.)ss$/i.test(receiver);
      if (!/^(?:attachSound|loadSound)$/i.test(operation) && !receiverLooksLikeSound) continue;
      const argumentExpression = match[3].replace(/;$/, "").trim();
      const literal = argumentExpression.match(/^\s*["']([^"']+)["']/)?.[1] || null;
      findings.push({
        location: block.location,
        localFrame,
        sourceLine: index + 1,
        receiver,
        operation,
        argumentExpression,
        literal,
        cueFrameAuthority: localFrame === null
          ? "event-handler-or-function; runtime invocation required"
          : "script is placed on this local timeline frame; function/event execution may still be conditional",
      });
    }
  }
  return findings;
}

async function readGzipText(filePath) {
  return gunzipSync(await readFile(filePath)).toString("utf8");
}

async function auditXmlReferences(animation) {
  const references = [...(animation.references?.courseXml || []), ...(animation.references?.keytermXml || [])];
  const evidence = [];
  for (const reference of references) {
    const relativePath = `${originalRoot}/${reference.sourceXmlPath}`;
    const filePath = absolute(relativePath);
    const text = await readFile(filePath, "utf8");
    const basename = path.basename(animation.source.path).toLowerCase();
    const matched = text.split(/\r?\n/).map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => line.toLowerCase().includes(basename));
    evidence.push({
      sourceFile: relativePath,
      sha256: await sha256File(filePath),
      catalogOccurrence: reference.occurrence ?? null,
      syntax: reference.syntax || null,
      matchedLines: matched.slice(0, 8).map(({ line, lineNumber }) => ({ lineNumber, text: line.trim().slice(0, 1000) })),
    });
  }
  return evidence;
}

async function walkFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(fullPath));
    else result.push(fullPath);
  }
  return result.sort();
}

function testAllPatterns(source, patterns) {
  return Object.fromEntries(Object.entries(patterns).map(([id, pattern]) => [id, pattern.test(source || "")]));
}

export function deriveFqHostUrlContract(records) {
  const record = records.find(({ text }) => text.includes("function doPlayFQQuestionAudio") && text.includes("function doPlayFQAnswerAudio"));
  const questionFunction = record ? extractActionScriptFunction(record.text, "doPlayFQQuestionAudio") : null;
  const answerFunction = record ? extractActionScriptFunction(record.text, "doPlayFQAnswerAudio") : null;
  const questionChecks = testAllPatterns(questionFunction, {
    currentFrameQuestionNumber: /strFQTempLabel\s*=\s*"Q"\s*\+\s*Number\(_root\.animation_mc\.animation\._currentframe\s*-\s*1\)\.toString\(\)/,
    activeChildPathBase: /_global\.playSwfFileName\.split\("\/"\)/,
    englishDirectory: /"\/EA\/"\s*\+\s*strFQTempLabel\s*\+\s*"\.mp3"/,
    spanishDirectory: /"\/SA\/"\s*\+\s*strFQTempLabel\s*\+\s*"\.mp3"/,
    externalLoad: /\.loadSound\(strFQQuestionAudioURL\s*,\s*false\)/,
  });
  const answerChecks = testAllPatterns(answerFunction, {
    currentFrameQuestionNumber: /strFQTempLabel\s*=\s*"Q"\s*\+\s*Number\(_root\.animation_mc\.animation\._currentframe\s*-\s*1\)\.toString\(\)/,
    activeChildPathBase: /_global\.playSwfFileName\.split\("\/"\)/,
    optionOneA: /case\s+1\s*:\s*strQALabel\s*=\s*"A"/s,
    optionTwoB: /case\s+2\s*:\s*strQALabel\s*=\s*"B"/s,
    optionThreeC: /case\s+3\s*:\s*strQALabel\s*=\s*"C"/s,
    optionFourD: /case\s+4\s*:\s*strQALabel\s*=\s*"D"/s,
    answerBasename: /strQAFName\s*=\s*strFQTempLabel\s*\+\s*strQALabel\s*\+\s*"\.mp3"/,
    englishDirectory: /"\/EA\/"\s*\+\s*strQAFName/,
    spanishDirectory: /"\/SA\/"\s*\+\s*strQAFName/,
    externalLoad: /\.loadSound\(strFQAnswerAudioURL\s*,\s*false\)/,
  });
  const verified = Boolean(
    record && questionFunction && answerFunction &&
    Object.values(questionChecks).every(Boolean) && Object.values(answerChecks).every(Boolean)
  );
  return {
    verified,
    evidenceScript: record?.relativePath || null,
    evidenceScriptSha256: record ? sha256Text(record.text) : null,
    questionFunctionSha256: questionFunction ? sha256Text(questionFunction) : null,
    answerFunctionSha256: answerFunction ? sha256Text(answerFunction) : null,
    questionChecks,
    answerChecks,
    pathAlgorithm: verified ? {
      base: "directory containing _global.playSwfFileName",
      question: "<base>/<EA|SA>/Q<current child frame - 1>.mp3",
      answer: "<base>/<EA|SA>/Q<current child frame - 1><A|B|C|D>.mp3",
      languageDirectories: { en: "EA", es: "SA" },
      optionSuffixes: ["A", "B", "C", "D"],
    } : null,
  };
}

async function extractHostAudioSemantics(ffdecVersion) {
  const hostSource = `${originalRoot}/HELP_COURSES/indexELM.swf`;
  const hostPath = absolute(hostSource);
  const workspace = await mkdtemp(path.join(tmpdir(), "help-math-audio-host-"));
  try {
    const output = path.join(workspace, "scripts");
    await execFileAsync("ffdec", ["-cli", "-export", "script", output, hostPath], { maxBuffer: 100 * 1024 * 1024 });
    const files = (await walkFiles(output)).filter((file) => file.endsWith(".as"));
    const records = [];
    for (const file of files) {
      const text = await readFile(file, "utf8");
      if (!/(EAD\/|SAD\/|\/EA\/|\/SA\/|dtfSpanishFormulas|loadSound\s*\()/i.test(text)) continue;
      records.push({ relativePath: path.relative(output, file).replaceAll("\\", "/"), text });
    }
    const combined = records.map(({ relativePath, text }) => `===== ${relativePath} =====\n${text}`).join("\n");
    const formulaEvidence = records.find(({ text }) => text.includes('SndFMEFName = _global.formulasPath + "EAD/"') && text.includes('SndFMSFName = _global.formulasPath + "SAD/"'));
    const keytermEvidence = records.find(({ text }) => text.includes('SndKTEFName =') && text.includes('"EAD/"') && text.includes('SndKTSFName =') && text.includes('"SAD/"'));
    const courseEvidence = records.find(({ text }) => text.includes('case "EN"') && text.includes('"/EA/"') && text.includes('case "SP"') && text.includes('"/SA/"'));
    const spanishPageEvidence = records.find(({ text }) => /Spanish/i.test(text) && text.includes('"/SA/"'));
    return {
      evidence: {
        sourceFile: hostSource,
        sha256: await sha256File(hostPath),
        extractor: ffdecVersion,
        extractedScriptCount: files.length,
        audioRelevantScriptCount: records.length,
        combinedAudioRelevantScriptsSha256: sha256Text(combined),
        conventions: {
          formula: {
            verified: Boolean(formulaEvidence),
            evidenceScript: formulaEvidence?.relativePath || null,
            finding: "EAD is loaded when the formulas audio-language argument equals English; SAD is loaded by the Spanish/non-English branch.",
          },
          keyterm: {
            verified: Boolean(keytermEvidence),
            evidenceScript: keytermEvidence?.relativePath || null,
            finding: "The key-term host builds matching EAD and SAD MP3 paths and selects them from the English/Spanish language state.",
          },
          finalQuiz: {
            verified: Boolean(courseEvidence),
            evidenceScript: courseEvidence?.relativePath || null,
            finding: "Final-quiz language code EN maps to EA and SP maps to SA for question and answer MP3 paths.",
          },
          courseSpanishPage: {
            verified: Boolean(spanishPageEvidence),
            evidenceScript: spanishPageEvidence?.relativePath || null,
            finding: "The course host's Spanish-audio path is built from the loaded page basename under the sibling SA directory.",
          },
        },
      },
      fqUrlContract: deriveFqHostUrlContract(records),
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

async function probeExternal(record, ffprobeVersion, associationStatus) {
  const sourceFile = `${originalRoot}/${record.path}`;
  const sourcePath = absolute(sourceFile);
  const descriptor = await requireOrdinaryProjectFile(sourcePath, `Audio source ${record.path}`);
  const observedHash = await sha256File(sourcePath);
  requireAudioEvidence(
    observedHash === record.sha256 && descriptor.metadata.size === record.bytes,
    `Audio source ${record.path} differs from its catalog hash/size binding`,
  );
  const metadata = await ffprobeFile(sourcePath);
  return {
    sourceFile,
    catalogSha256: record.sha256,
    observedSha256: observedHash,
    hashMatchesCatalog: observedHash === record.sha256,
    bytes: descriptor.metadata.size,
    association: record.association || associationStatus,
    associationStatus,
    languageAssessment: classifyAudioLanguage(record.path),
    probe: { tool: ffprobeVersion, ...metadata },
    startFrame: null,
    startFrameAuthority: "external audio is started by host/user state; no unconditional child-SWF root timeline cue is proven",
  };
}

async function expectedMissingExternalAudio(manifest, exactExternal, hostEvidence) {
  if (manifest.classification?.collection !== "keyterm" || !manifest.localization?.bilingualRequired || !hostEvidence.conventions.keyterm.verified) return [];
  const english = exactExternal.find((item) => item.languageAssessment.language === "en" && /\/EAD\//i.test(item.sourceFile));
  if (!english) return [];
  const spanishSource = english.sourceFile.replace(/\/EAD\//i, "/SAD/");
  if (await fileExists(absolute(spanishSource))) return [];
  return [{
    sourceFile: spanishSource,
    language: "es",
    status: "missing-source",
    evidence: "The verified key-term host constructs the SAD counterpart of the matching EAD basename; no file exists at that preserved-source path.",
  }];
}

export function externalAudioStartSemantics(item, manifest, hostEvidence) {
  const sourceFile = item.sourceFile || "";
  const collection = manifest.classification?.collection;
  let convention = null;
  if (collection === "formula" && /\/(?:EAD|SAD)\//i.test(sourceFile)) convention = hostEvidence.conventions.formula;
  else if (collection === "keyterm" && /\/(?:EAD|SAD)\//i.test(sourceFile)) convention = hostEvidence.conventions.keyterm;
  else if (/\/FQ\//i.test(manifest.source?.swf || "") && /\/(?:EA|SA)\//i.test(sourceFile)) convention = hostEvidence.conventions.finalQuiz;
  else if (/\/(?:EA|SA)\//i.test(sourceFile)) convention = hostEvidence.conventions.courseSpanishPage;
  return convention?.verified ? "host-user-activated" : "interaction-state";
}

function fullArchivePath(recordPath) {
  const normalized = normalizeProjectPath(recordPath);
  return normalized.startsWith(`${originalRoot}/`) ? normalized : `${originalRoot}/${normalized}`;
}

export function deriveFqAudioUrlMatrix({
  animationId = SOURCE_DERIVED_FQ_AUDIO_PILOT_ID,
  baseDirectory,
  questionLabels,
  groupCandidates,
  archiveFiles,
}) {
  requireAudioEvidence(animationId === SOURCE_DERIVED_FQ_AUDIO_PILOT_ID, `${animationId}: source-derived FQ URL matrix is not approved`);
  const expectedLabels = Array.from({ length: 31 }, (_, index) => `Q${index + 1}`);
  requireAudioEvidence(
    JSON.stringify(questionLabels) === JSON.stringify(expectedLabels),
    `${animationId}: child question-label sequence is not exactly Q1..Q31`,
  );
  const normalizedBase = normalizeProjectPath(baseDirectory || "").replace(/\/$/, "");
  requireAudioEvidence(
    normalizedBase.startsWith(`${originalRoot}/HELP_COURSES/`) && normalizedBase.endsWith("/FQ"),
    `${animationId}: source-derived FQ audio base directory is unsafe or unexpected (${baseDirectory || "missing"})`,
  );

  const archiveByPath = new Map();
  for (const record of archiveFiles || []) {
    const sourceFile = fullArchivePath(record.path);
    requireAudioEvidence(!archiveByPath.has(sourceFile), `${animationId}: duplicate source-files catalog path ${sourceFile}`);
    archiveByPath.set(sourceFile, record);
  }
  const candidatesByPath = new Map();
  for (const candidate of groupCandidates || []) {
    const sourceFile = normalizeProjectPath(candidate.sourceFile || "");
    requireAudioEvidence(sourceFile.startsWith(`${normalizedBase}/`), `${animationId}: audio-group candidate escapes the derived FQ directory (${sourceFile || "missing"})`);
    requireAudioEvidence(!candidatesByPath.has(sourceFile), `${animationId}: duplicate audio-group candidate ${sourceFile}`);
    const archive = archiveByPath.get(sourceFile);
    requireAudioEvidence(archive, `${animationId}: audio-group candidate is absent from source-files catalog (${sourceFile})`);
    requireAudioEvidence(
      candidate.hashMatchesCatalog === true && candidate.catalogSha256 === candidate.observedSha256 &&
      archive.sha256 === candidate.observedSha256 && Number(archive.bytes) === Number(candidate.bytes),
      `${animationId}: audio-group candidate hash/size differs from source-files catalog (${sourceFile})`,
    );
    candidatesByPath.set(sourceFile, candidate);
  }

  const expectedPaths = [];
  for (const { language, directory } of FQ_EXPECTED_LANGUAGES) {
    for (let questionNumber = 1; questionNumber <= 31; questionNumber += 1) {
      const variants = [{ kind: "question", option: null, basename: `Q${questionNumber}.mp3` }]
        .concat(FQ_EXPECTED_OPTIONS.map((option) => ({ kind: "answer", option, basename: `Q${questionNumber}${option}.mp3` })));
      for (const variant of variants) {
        const sourceFile = `${normalizedBase}/${directory}/${variant.basename}`;
        const archive = archiveByPath.get(sourceFile) || null;
        const candidate = candidatesByPath.get(sourceFile) || null;
        requireAudioEvidence(
          Boolean(archive) === Boolean(candidate),
          `${animationId}: expected FQ path has inconsistent source-files/audio-group presence (${sourceFile})`,
        );
        expectedPaths.push({
          expectedPathId: `fq-q${String(questionNumber).padStart(2, "0")}-${variant.kind}${variant.option ? `-${variant.option.toLowerCase()}` : ""}-${language}`,
          language,
          languageDirectory: directory,
          questionNumber,
          kind: variant.kind,
          option: variant.option,
          sourceFile,
          status: candidate ? "exact-path-present-candidate-not-promoted" : "missing-source",
          cuePromoted: false,
          observed: candidate ? {
            sha256: candidate.observedSha256,
            bytes: candidate.bytes,
            durationMs: candidate.probe?.durationMs || null,
            format: candidate.probe?.codecName || candidate.probe?.formatName || null,
            channels: candidate.probe?.channels || null,
            sampleRateHz: candidate.probe?.sampleRateHz || null,
          } : null,
        });
      }
    }
  }
  const expectedPathSet = new Set(expectedPaths.map(({ sourceFile }) => sourceFile));
  const anomalies = [...candidatesByPath.values()]
    .filter(({ sourceFile }) => !expectedPathSet.has(normalizeProjectPath(sourceFile)))
    .map((candidate) => ({
      sourceFile: normalizeProjectPath(candidate.sourceFile),
      status: "unmatched-audio-group-candidate-not-promoted",
      reason: "The basename is not emitted by the hash-bound host Qn/Qn[A-D].mp3 URL algorithm.",
      sha256: candidate.observedSha256,
      bytes: candidate.bytes,
      cuePromoted: false,
    }))
    .sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
  const exactPathPresentCount = expectedPaths.filter(({ status }) => status === "exact-path-present-candidate-not-promoted").length;
  const missingSourceCount = expectedPaths.filter(({ status }) => status === "missing-source").length;
  requireAudioEvidence(expectedPaths.length === 310, `${animationId}: expected FQ URL matrix is not 310 rows`);
  requireAudioEvidence(
    exactPathPresentCount + missingSourceCount === expectedPaths.length,
    `${animationId}: expected FQ URL matrix disposition is incomplete`,
  );
  return {
    baseDirectory: normalizedBase,
    expectedPathCount: expectedPaths.length,
    exactPathPresentCount,
    missingSourceCount,
    anomalyCount: anomalies.length,
    expectedPaths,
    anomalies,
  };
}

function parseQuestionLabelArray(scriptText, animationId) {
  const match = scriptText.match(/_global\.quizLabelArray\s*=\s*(\[(?:"Q\d+"\s*,?\s*)+\])\s*;/);
  requireAudioEvidence(match, `${animationId}: child script has no literal quizLabelArray`);
  let labels;
  try {
    labels = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${animationId}: child quizLabelArray is not parseable (${error.message})`);
  }
  return labels;
}

async function buildFqSourceDerivedAudioMatrix({
  pilot,
  manifest,
  workspace,
  hostEvidence,
  fqHostUrlContract,
  groupExternal,
  childScriptText,
  sourceFilesCatalog,
  sourceFilesCatalogSha256,
  audioGroupsCatalogSha256,
}) {
  if (pilot.id !== SOURCE_DERIVED_FQ_AUDIO_PILOT_ID) return null;
  const label = pilot.id;
  requireAudioEvidence(fqHostUrlContract?.verified === true, `${label}: indexELM FQ question/answer URL contract is not fully source-verified`);
  requireAudioEvidence(hostEvidence?.conventions?.finalQuiz?.verified === true, `${label}: indexELM final-quiz EA/SA convention is not verified`);
  requireAudioEvidence(
    fqHostUrlContract.evidenceScript === hostEvidence.conventions.finalQuiz.evidenceScript,
    `${label}: detailed FQ URL contract and public host convention use different scripts`,
  );

  const scenarioPath = path.join(workspace, "audit", "scenario-inventory.json");
  const scenarioBytes = await readFile(scenarioPath);
  const scenario = JSON.parse(scenarioBytes.toString("utf8"));
  requireAudioEvidence(scenario.animationId === label, `${label}: scenario inventory animationId differs`);
  requireAudioEvidence(
    scenario.source?.swf === manifest.source.swf && scenario.source?.swfSha256 === manifest.source.swfSha256,
    `${label}: scenario inventory source identity differs from migration.json`,
  );
  requireAudioEvidence(
    await sha256File(absolute(manifest.source.swf)) === manifest.source.swfSha256,
    `${label}: preserved child SWF bytes differ from migration.json`,
  );
  const childScriptsPath = path.join(workspace, "audit", "machine", "ffdec-scripts.txt.gz");
  const childScriptsCompressedSha256 = await sha256File(childScriptsPath);
  const childScriptsUncompressedSha256 = sha256Text(childScriptText);

  const timeline = (scenario.timelineInventory || []).find(({ timelineId }) => timelineId === "sprite-1168");
  requireAudioEvidence(timeline?.frameCount === 82, `${label}: sprite-1168 frame count is not 82`);
  const questionFrames = (timeline.frameLabels || []).filter(({ label: frameLabel }) => /^Q\d+$/.test(frameLabel));
  const questionLabels = questionFrames.map(({ label: frameLabel }) => frameLabel);
  const expectedFrames = Array.from({ length: 31 }, (_, index) => index + 2);
  requireAudioEvidence(
    JSON.stringify(questionFrames.map(({ frame }) => frame)) === JSON.stringify(expectedFrames),
    `${label}: Q1..Q31 are not bound to child frames 2..32`,
  );
  for (const { frame, label: frameLabel } of questionFrames) {
    const controlState = (timeline.controlStates || []).find((item) => item.frame === frame);
    const answerReleaseHandlers = (controlState?.evidence || []).filter(({ script }) => /CLIPACTIONRECORD on\(release\)\.as$/.test(script || ""));
    requireAudioEvidence(answerReleaseHandlers.length === 4, `${label}: ${frameLabel} does not expose exactly four source answer-release handlers`);
  }

  const literalQuestionLabels = parseQuestionLabelArray(childScriptText, label);
  const childScriptChecks = {
    literalQuestionLabelsMatchTimeline: JSON.stringify(literalQuestionLabels) === JSON.stringify(questionLabels),
    randomIndexAcrossRemainingLabels: /random\(_global\.quizLabelArray\.length\)/.test(childScriptText),
    selectedLabelRemovedWithoutReplacement: /_global\.quizLabelArray\.splice\(_global\.tempQNo\s*,\s*1\)/.test(childScriptText),
    selectedQuestionEntered: /gotoAndStop\(_global\.qLabelName\)/.test(childScriptText),
    englishQuestionAudioControl: /_root\.doPlayFQQuestionAudio\(this\s*,\s*"EN"\)/.test(childScriptText),
    englishAnswerAudioControl: /_root\.doPlayFQAnswerAudio\(this\s*,\s*"EN"\)/.test(childScriptText),
    spanishQuestionAudioControl: /_root\.doPlayFQQuestionAudio\(this\s*,\s*"SP"\)/.test(childScriptText),
    spanishAnswerAudioControl: /_root\.doPlayFQAnswerAudio\(this\s*,\s*"SP"\)/.test(childScriptText),
  };
  requireAudioEvidence(Object.values(childScriptChecks).every(Boolean), `${label}: child random/bilingual audio-control contract is incomplete`);

  const courseXmlDescriptor = scenario.courseXml?.artifact;
  const courseXml = scenario.courseXml;
  requireAudioEvidence(
    typeof courseXmlDescriptor?.path === "string" && /^[a-f0-9]{64}$/.test(courseXmlDescriptor?.sha256 || ""),
    `${label}: course XML source descriptor is incomplete`,
  );
  requireAudioEvidence(await sha256File(absolute(courseXmlDescriptor.path)) === courseXmlDescriptor.sha256, `${label}: course XML bytes differ from scenario binding`);
  const placement = courseXml.currentPlacement;
  requireAudioEvidence(
    placement?.sourceRelativePath === "FQ/Review/L6FQ02.swf" && placement?.matchStatus === "basename-only-conflict" &&
    placement.exactPlacement === null && placement.basenameMatches?.length === 1 && placement.basenameMatches[0].path === "FQ/L6FQ02.swf",
    `${label}: historical Review placement versus active FQ basename conflict changed`,
  );
  requireAudioEvidence(
    manifest.audio?.catalogGroupCandidates?.length === 1 && manifest.audio.catalogGroupCandidates[0] === "course-g03-l06-fq-audio" &&
    groupExternal.length === 129 && groupExternal.every(({ groupId }) => groupId === "course-g03-l06-fq-audio"),
    `${label}: expected single 129-file lesson audio group changed`,
  );
  const activePageDirectory = path.dirname(placement.basenameMatches[0].path);
  const baseDirectory = normalizeProjectPath(path.join(path.dirname(courseXml.artifact.path), activePageDirectory));
  const matrix = deriveFqAudioUrlMatrix({
    animationId: label,
    baseDirectory,
    questionLabels,
    groupCandidates: groupExternal,
    archiveFiles: sourceFilesCatalog.files,
  });
  requireAudioEvidence(
    matrix.exactPathPresentCount === 128 && matrix.missingSourceCount === 182 && matrix.anomalyCount === 1 &&
    matrix.anomalies[0]?.sourceFile === `${matrix.baseDirectory}/EA/Q20B_.mp3`,
    `${label}: source-derived 128-present/182-missing/Q20B_ anomaly contract changed`,
  );

  return {
    schemaVersion: 1,
    evidenceType: "source-derived-final-quiz-audio-url-matrix",
    status: "audit-only-candidates-not-promoted",
    strictAcceptanceEffect: "none; expected paths remain candidates or missing sources and do not satisfy cue, listening, synchronization, human-review, owner-acceptance, or completion gates",
    cuePromotionPerformed: false,
    migrationStatusChanged: false,
    bindings: {
      childSourceSwf: { file: manifest.source.swf, sha256: manifest.source.swfSha256 },
      childScenarioSourceStructure: {
        file: "audit/scenario-inventory.json",
        ...projectionDescriptor({
          projection: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.id,
          sha256: fqAudioSourceStructureSha256(scenario),
          excludedPaths: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.excludedPaths,
          includedPaths: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.includedPaths,
        }),
      },
      childFfdecScripts: {
        file: "audit/machine/ffdec-scripts.txt.gz",
        sha256: childScriptsCompressedSha256,
        uncompressedSha256: childScriptsUncompressedSha256,
      },
      activeCourseXml: { file: courseXmlDescriptor.path, sha256: courseXmlDescriptor.sha256 },
      hostSourceSwf: { file: hostEvidence.sourceFile, sha256: hostEvidence.sha256 },
      hostExtractedAudioScript: {
        extractedPath: fqHostUrlContract.evidenceScript,
        sha256: fqHostUrlContract.evidenceScriptSha256,
        questionFunctionSha256: fqHostUrlContract.questionFunctionSha256,
        answerFunctionSha256: fqHostUrlContract.answerFunctionSha256,
        extractor: hostEvidence.extractor,
      },
      sourceFilesCatalog: { file: "catalog/source-files.json", sha256: sourceFilesCatalogSha256 },
      audioGroupsCatalog: { file: "catalog/audio-groups.json", sha256: audioGroupsCatalogSha256 },
    },
    placementEvidence: {
      historicalSourcePlacement: placement.sourceRelativePath,
      activeCourseXmlBasenameMatch: placement.basenameMatches[0].path,
      status: placement.matchStatus,
      runtimePlacementProven: false,
      rationale: "The active course XML supplies the FQ directory used for the source-derived matrix, while this preserved Review variant remains a basename-only conflict. Original-host runtime traversal must still prove the actual placement.",
    },
    sourceContracts: {
      hostUrlContract: fqHostUrlContract,
      childScriptChecks,
      questionFrames,
      answerOptionsPerQuestion: 4,
      randomReachability: "Q1..Q31 are selected by random index without replacement; every question is structurally reachable across repeated runs, but authoritative runtime traversal remains pending.",
    },
    pathContract: {
      baseDirectory: matrix.baseDirectory,
      questionPattern: "<base>/<EA|SA>/Q1..Q31.mp3",
      answerPattern: "<base>/<EA|SA>/Q1..Q31[A-D].mp3",
      languageDirectories: { en: "EA", es: "SA" },
      expectedPerLanguage: 155,
      expectedTotal: 310,
    },
    summary: {
      expectedPathCount: matrix.expectedPathCount,
      exactPathPresentCount: matrix.exactPathPresentCount,
      missingSourceCount: matrix.missingSourceCount,
      unmatchedCandidateAnomalyCount: matrix.anomalyCount,
      exactAssociationsPromoted: 0,
      inventoryRowsAdded: 0,
    },
    expectedPaths: matrix.expectedPaths,
    anomalies: matrix.anomalies,
  };
}

function defineSoundStart(sound, embedded) {
  const starts = (embedded.startSounds || []).filter((event) => event.characterId === sound.characterId && !event.stop);
  const rootStarts = starts.filter((event) => event.context.kind === "root");
  if (starts.length === 1 && rootStarts.length === 1 && Number.isInteger(rootStarts[0].localFrame) && rootStarts[0].localFrame >= 1) {
    return { startSemantics: "timeline-frame", startFrame: rootStarts[0].localFrame, authority: "single root-timeline StartSound tag" };
  }
  return {
    startSemantics: "interaction-state",
    startFrame: "",
    authority: starts.length
      ? "StartSound is nested or has multiple reachable placements"
      : "no unconditional root-timeline StartSound tag was proven",
  };
}

export function embeddedInventoryRows(manifest, embedded) {
  const rows = [];
  for (const sound of embedded.defineSounds) {
    if (!sound.durationMs) continue;
    const start = defineSoundStart(sound, embedded);
    rows.push({
      cue_id: `embedded-define-sound-${String(sound.characterId).padStart(4, "0")}`,
      language: "und",
      source_file: manifest.source.swf,
      sha256: manifest.source.swfSha256,
      start_frame: start.startFrame,
      start_frame_domain_id: start.startSemantics === "timeline-frame" ? "root" : "",
      start_semantics: start.startSemantics,
      duration_ms: sound.durationMs,
      format: `swf-${sound.format}`,
      channels: sound.channels,
      sample_rate_hz: sound.sampleRateHz,
      source_character_id: sound.characterId,
      notes: `DefineSound asset${sound.linkage ? ` exported as ${sound.linkage}` : ""}; ${sound.samples} samples; start_semantics=${start.startSemantics} from ${start.authority}${start.startFrame ? ` at root frame ${start.startFrame}` : ""}; language/content and runtime trigger require listening/host traversal.`,
    });
  }
  for (const stream of embedded.soundStreams) {
    if (!stream.durationMs) continue;
    const rootStart = stream.context.kind === "root" && Number.isInteger(stream.firstBlockFrame) ? stream.firstBlockFrame : "";
    const startSemantics = rootStart ? "timeline-frame" : "interaction-state";
    rows.push({
      cue_id: `embedded-stream-${String(stream.streamIndex).padStart(4, "0")}`,
      language: "und",
      source_file: manifest.source.swf,
      sha256: manifest.source.swfSha256,
      start_frame: rootStart,
      start_frame_domain_id: startSemantics === "timeline-frame" ? "root" : "",
      start_semantics: startSemantics,
      duration_ms: stream.durationMs,
      format: `swf-${stream.format}-stream`,
      channels: stream.channels,
      sample_rate_hz: stream.sampleRateHz,
      source_character_id: stream.context.characterId ?? "",
      notes: `SoundStream in ${stream.contextLabel}, local head frame ${stream.headFrame}, first block frame ${stream.firstBlockFrame}, ${stream.blockCount} blocks, sync=stream; ${stream.durationBasis}; start_semantics=${startSemantics}; ${rootStart ? "start_frame is the proven root timeline first-block frame" : "root cue depends on sprite placement/interaction and remains unresolved; no root frame is asserted"}; spoken language/content requires listening.`,
    });
  }
  return rows;
}

export function externalInventoryRows(external, manifest, hostEvidence) {
  return external.map((item, index) => ({
    cue_id: `catalog-audio-${String(index + 1).padStart(2, "0")}`,
    language: item.languageAssessment.language,
    source_file: item.sourceFile,
    sha256: item.observedSha256,
    start_frame: "",
    start_frame_domain_id: "",
    start_semantics: externalAudioStartSemantics(item, manifest, hostEvidence),
    duration_ms: item.probe.durationMs || "",
    format: item.probe.codecName || item.probe.formatName || "",
    channels: item.probe.channels || "",
    sample_rate_hz: item.probe.sampleRateHz || "",
    source_character_id: "",
    notes: `${item.probe.tool}; codec=${item.probe.codecName || "unknown"}; stream_bitrate_bps=${item.probe.streamBitRateBps ?? "unknown"}; container_bitrate_bps=${item.probe.containerBitRateBps ?? "unknown"}; language=${item.languageAssessment.language} from legacy host directory semantics (${item.languageAssessment.evidence}); start_semantics=${externalAudioStartSemantics(item, manifest, hostEvidence)}; no child-timeline start_frame is asserted; spoken content and synchronization require authoritative listening.`,
  }));
}

function mergeInventory(existingRows, generatedRows) {
  const generatedByKey = new Map(generatedRows.map((row) => [`${row.source_file}\u0000${row.cue_id.startsWith("embedded-") ? row.cue_id : "external"}`, row]));
  const result = [];
  for (const row of existingRows) {
    const isEmbedded = row.cue_id?.startsWith("embedded-");
    const key = `${row.source_file}\u0000${isEmbedded ? row.cue_id : "external"}`;
    const replacement = generatedByKey.get(key);
    if (replacement) {
      result.push({ ...row, ...replacement, cue_id: row.cue_id || replacement.cue_id });
      generatedByKey.delete(key);
    } else if (!isEmbedded) result.push(row);
  }
  result.push(...generatedByKey.values());
  const order = new Map(generatedRows.map((row, index) => [`${row.source_file}\u0000${row.cue_id}`, index]));
  return result.sort((left, right) => {
    const leftOrder = order.get(`${left.source_file}\u0000${left.cue_id}`);
    const rightOrder = order.get(`${right.source_file}\u0000${right.cue_id}`);
    if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
    if (leftOrder !== undefined) return 1;
    if (rightOrder !== undefined) return -1;
    return `${left.source_file}\u0000${left.cue_id}`.localeCompare(`${right.source_file}\u0000${right.cue_id}`);
  });
}

export function evaluateStrictNoAudioFacts(animationId, facts) {
  const checks = [
    ["source-swf-hash", facts.sourceSwfHashMatches],
    ["swf-audio-tags", facts.swfAudioTagsAbsent],
    ["parsed-audio-structures", facts.parsedAudioStructuresAbsent],
    ["actionscript-audio-operations", facts.actionScriptAudioOperationsAbsent],
    ["catalog-audio-associations", facts.catalogAudioAssociationsAbsent],
    ["basename-mp3", facts.basenameMp3Absent],
    ["keyterm-xml-placement", facts.keytermXmlPlacementAbsent],
    ["catalog-placement", facts.catalogPlacementUnreferenced],
  ].map(([id, passed]) => ({ id, passed: passed === true }));
  const eligible = strictNoAudioPilotIds.has(animationId);
  const accepted = eligible && checks.every(({ passed }) => passed);
  const acceptedRationale = animationId === "keyterm-elementary-computeghgh"
    ? "The source-hash-bound shipped SWF contains no audio tag/data or audio ActionScript operation, the preserved archive has no matching MP3, and neither key-term XML nor the catalog exposes a host placement that could create an external cue. This is a structural negative proof; there is no audio cue to listen to or synchronize."
    : "The source-hash-bound shipped SWF contains no audio tag/data or audio ActionScript operation, the preserved archive has no matching MP3, and the source-bound catalog exposes no host placement that could create an external cue. This is a structural negative proof; there is no audio cue to listen to or synchronize.";
  return {
    eligible,
    checks,
    decision: accepted ? "accepted-not-required" : "pending",
    rationale: accepted
      ? acceptedRationale
      : eligible
        ? "At least one required structural negative-proof check is missing or contradicted; no-audio acceptance remains pending."
        : "This pilot is not approved for structural no-audio acceptance without an animation-specific evidence review.",
  };
}

async function buildStrictNoAudioAssessment({
  pilot,
  manifest,
  animation,
  exactExternal,
  groupExternal,
  embedded,
  scriptOperations,
  machineDirectory,
  sourceFilesCatalog,
  sourceFilesCatalogSha256,
  animationsCatalogSha256,
}) {
  if (!strictNoAudioPilotIds.has(pilot.id)) return null;
  const summaryPath = path.join(machineDirectory, "swfmill-summary.json");
  const xmlPath = path.join(machineDirectory, "swfmill.xml.gz");
  const scriptsPath = path.join(machineDirectory, "ffdec-scripts.txt.gz");
  const tagsPath = path.join(machineDirectory, "ffdec-tags.txt.gz");
  const summary = JSON.parse(await readFile(summaryPath, "utf8"));
  const sourceStem = path.basename(manifest.source.swf, path.extname(manifest.source.swf)).toLowerCase();
  const basenameMp3Matches = sourceFilesCatalog.files
    .filter(({ extension, path: sourcePath }) => extension === "mp3" && path.basename(sourcePath, path.extname(sourcePath)).toLowerCase() === sourceStem)
    .map(({ path: sourcePath, sha256, bytes }) => ({ sourceFile: `${originalRoot}/${sourcePath}`, sha256, bytes }));
  const keytermXmlFiles = sourceFilesCatalog.files
    .filter(({ extension, path: sourcePath }) => extension === "xml" && sourcePath.startsWith("HELP_KEYTERMS/"))
    .sort((left, right) => left.path.localeCompare(right.path));
  const keytermXmlEvidence = [];
  for (const record of keytermXmlFiles) {
    const sourceFile = `${originalRoot}/${record.path}`;
    const bytes = await readFile(absolute(sourceFile));
    const text = bytes.toString("utf8");
    const normalized = text.toLowerCase();
    keytermXmlEvidence.push({
      sourceFile,
      catalogSha256: record.sha256,
      observedSha256: createHash("sha256").update(bytes).digest("hex"),
      hashMatchesCatalog: createHash("sha256").update(bytes).digest("hex") === record.sha256,
      basenameMentionCount: normalized.split(sourceStem).length - 1,
    });
  }
  const observedSwfHash = await sha256File(absolute(manifest.source.swf));
  const facts = {
    sourceSwfHashMatches: observedSwfHash === manifest.source.swfSha256,
    swfAudioTagsAbsent: Object.keys(summary.categories?.soundTags || {}).length === 0,
    parsedAudioStructuresAbsent: embedded.defineSounds.length === 0 && embedded.soundStreams.length === 0 && embedded.startSounds.length === 0,
    actionScriptAudioOperationsAbsent: scriptOperations.length === 0,
    catalogAudioAssociationsAbsent: exactExternal.length === 0 && groupExternal.length === 0,
    basenameMp3Absent: basenameMp3Matches.length === 0,
    keytermXmlPlacementAbsent: keytermXmlEvidence.length > 0 && keytermXmlEvidence.every(({ hashMatchesCatalog, basenameMentionCount }) => hashMatchesCatalog && basenameMentionCount === 0),
    catalogPlacementUnreferenced: animation.flags?.unreferenced === true && (animation.references?.courseXml || []).length === 0 && (animation.references?.keytermXml || []).length === 0,
  };
  const decision = evaluateStrictNoAudioFacts(pilot.id, facts);
  return {
    ...decision,
    scope: "shipped-SWF-and-preserved-host-placement-audio-reachability",
    source: {
      swf: manifest.source.swf,
      expectedSha256: manifest.source.swfSha256,
      observedSha256: observedSwfHash,
      pairedFla: manifest.source.fla || null,
      pairedFlaSha256: manifest.source.flaSha256 || null,
      note: "The FLA hash preserves authoring provenance; the negative audio decision is based on the shipped SWF and reachable host-placement evidence, not on unshipped/unused FLA library contents.",
    },
    machineEvidence: {
      swfmillSummary: { file: "audit/machine/swfmill-summary.json", sha256: await sha256File(summaryPath), soundTags: summary.categories?.soundTags || {} },
      swfmillXml: { file: "audit/machine/swfmill.xml.gz", sha256: await sha256File(xmlPath) },
      ffdecScripts: { file: "audit/machine/ffdec-scripts.txt.gz", sha256: await sha256File(scriptsPath), parsedAudioOperationCount: scriptOperations.length },
      ffdecTags: { file: "audit/machine/ffdec-tags.txt.gz", sha256: await sha256File(tagsPath) },
    },
    archiveAssociationEvidence: {
      sourceFilesCatalog: { file: "catalog/source-files.json", sha256: sourceFilesCatalogSha256, checksumSetSha256: sourceFilesCatalog.checksumSetSha256 },
      animationsCatalog: { file: "catalog/animations.json", sha256: animationsCatalogSha256 },
      exactAudioAssociations: animation.audio?.exact || [],
      audioGroupIds: animation.audio?.groupIds || [],
      basenameMp3Matches,
      keytermXmlEvidence,
      catalogFlags: animation.flags || {},
      catalogReferences: animation.references || {},
    },
  };
}

export function acceptanceRequirements({
  manifest,
  exactExternal,
  groupExternal,
  embedded,
  scriptOperations,
  hostEvidence,
  strictNoAudioAssessment = null,
  releaseMembershipEvidence = null,
}) {
  if (strictNoAudioAssessment?.decision === "accepted-not-required") return [];
  const requirements = [];
  if (exactExternal.length) requirements.push("Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.");
  if (groupExternal.length) {
    requirements.push(releaseMembershipEvidence
      ? "The lesson-level audio group is only a candidate set; authoritative original-host traversal must identify exactly which files are reachable for this release member before any are promoted to cues."
      : "The lesson-level audio group is only a candidate set; authoritative host traversal must identify exactly which question/answer files are reachable from this historical Review SWF before any are promoted to cues.");
  }
  if (embedded.soundStreams.length || embedded.defineSounds.length) requirements.push("Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.");
  if (embedded.soundStreams.some(({ context }) => context.kind !== "root")) requirements.push("Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.");
  if (scriptOperations.some(({ cueFrameAuthority }) => cueFrameAuthority.includes("runtime")) || scriptOperations.length) requirements.push("ActionScript audio calls are conditional/event-driven; host state and interaction traversal must prove resolved URL/linkage, invocation order, offsets, loops, and stop behavior.");
  const hasEnglishKeytermTrack = exactExternal.some(({ languageAssessment }) => languageAssessment.language === "en");
  const hasSpanishKeytermTrack = exactExternal.some(({ languageAssessment }) => languageAssessment.language === "es");
  if (manifest.localization?.bilingualRequired && manifest.classification?.collection === "keyterm" && hasEnglishKeytermTrack && !hasSpanishKeytermTrack) requirements.push("The host constructs the SAD counterpart of the exact EAD key-term track, but no matching Spanish MP3 is present for this pilot; the missing track must be confirmed and cannot be synthesized silently.");
  if (!hostEvidence.conventions.courseSpanishPage.verified || !hostEvidence.conventions.formula.verified || !hostEvidence.conventions.keyterm.verified) requirements.push("One or more host directory-language conventions were not recovered; language classification must remain unresolved until host evidence is restored.");
  if (!requirements.length) requirements.push("No audio tags, external associations, or audio ActionScript calls were found; Adobe listening is still required to confirm silence across all reachable states before audio is marked not applicable.");
  return requirements;
}

export function manifestAudioFollowUp(manifest, exactExternal, groupExternal, embedded) {
  const findings = [];
  const audibleEmbeddedCount = embedded.defineSounds.filter(({ durationMs }) => durationMs > 0).length + embedded.soundStreams.filter(({ durationMs }) => durationMs > 0).length;
  if (!manifest.audio?.required && (exactExternal.length || audibleEmbeddedCount)) {
    findings.push(`migration.audio.required is false, but the audit found ${exactExternal.length} exact external track(s) and ${audibleEmbeddedCount} timed embedded sound asset/stream(s); update only after runtime reachability/listening review.`);
  }
  if (manifest.audio?.required && !exactExternal.length && !audibleEmbeddedCount && groupExternal.length) {
    findings.push("migration.audio.required is true, but only lesson-group candidates are known; resolve the exact host branch before adding cue rows.");
  }
  const exactLanguages = [...new Set(exactExternal.map(({ languageAssessment }) => languageAssessment.language).filter(Boolean))].sort();
  const declaredLanguages = new Set(manifest.audio?.languages || []);
  const missingExactLanguages = exactLanguages.filter((language) => !declaredLanguages.has(language));
  if (missingExactLanguages.length) {
    findings.push(`migration.audio.languages omits structurally classified exact external language(s): ${missingExactLanguages.join(", ")}. Preserve any embedded und language until authoritative listening classifies it.`);
  }
  return findings;
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function ensureOrdinaryOutputDirectoryTree(root, directory) {
  const resolvedRoot = path.resolve(root);
  const resolvedDirectory = path.resolve(directory);
  requireAudioEvidence(
    isContainedPath(resolvedRoot, resolvedDirectory),
    `Audio output parent escapes the transaction root: ${resolvedDirectory}`,
  );
  const rootMetadata = await lstat(resolvedRoot);
  requireAudioEvidence(
    rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink(),
    "Audio transaction root must be an ordinary directory",
  );
  const rootReal = await realpath(resolvedRoot);
  requireAudioEvidence(rootReal === resolvedRoot, "Audio transaction root must have a link-free realpath");
  let cursor = resolvedRoot;
  const relative = path.relative(resolvedRoot, resolvedDirectory);
  for (const segment of relative ? relative.split(path.sep) : []) {
    cursor = path.join(cursor, segment);
    const metadata = await lstatOrNull(cursor);
    requireAudioEvidence(metadata, `Audio output directory is missing: ${cursor}`);
    requireAudioEvidence(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `Audio output ancestor must be an ordinary directory: ${cursor}`,
    );
    const cursorReal = await realpath(cursor);
    requireAudioEvidence(
      isContainedPath(rootReal, cursorReal) && cursorReal === cursor,
      `Audio output ancestor must have a contained, link-free realpath: ${cursor}`,
    );
  }
  return rootReal;
}

async function readOrdinaryOutputBinding(candidate, rootReal, { allowMissing = true } = {}) {
  const resolved = path.resolve(candidate);
  requireAudioEvidence(
    isContainedPath(rootReal, resolved),
    `Audio output escapes the transaction root: ${resolved}`,
  );
  const metadata = await lstatOrNull(resolved);
  if (!metadata) {
    requireAudioEvidence(allowMissing, `Audio output is missing: ${resolved}`);
    return { exists: false };
  }
  requireAudioEvidence(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `Audio output must be one ordinary, non-linked file: ${resolved}`,
  );
  const targetReal = await realpath(resolved);
  requireAudioEvidence(
    isContainedPath(rootReal, targetReal) && targetReal === resolved,
    `Audio output must have a contained, link-free realpath: ${resolved}`,
  );
  const bytes = await readFile(resolved);
  return {
    exists: true,
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    size: metadata.size,
    mtimeMs: metadata.mtimeMs,
    sha256: sha256Text(bytes),
    bytes,
  };
}

function sameOutputBinding(left, right) {
  if (left.exists !== right.exists) return false;
  if (!left.exists) return true;
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.sha256 === right.sha256
  );
}

async function writeExclusiveAudioTransactionFile(candidate, bytes, rootReal) {
  await writeFile(candidate, bytes, { flag: "wx", mode: 0o600 });
  const binding = await readOrdinaryOutputBinding(candidate, rootReal, { allowMissing: false });
  requireAudioEvidence(
    binding.sha256 === sha256Text(bytes),
    `Staged audio transaction file changed while it was written: ${candidate}`,
  );
}

async function unlinkOwnedAudioTransactionFile(candidate, expectedSha256, rootReal) {
  const binding = await readOrdinaryOutputBinding(candidate, rootReal);
  if (!binding.exists) return;
  requireAudioEvidence(
    binding.sha256 === expectedSha256,
    `Refusing to remove a changed audio transaction file: ${candidate}`,
  );
  await unlink(candidate);
}

async function writeAudioAuditTransaction(prepared, transactionRoot, transactionHooks = {}) {
  const nonce = randomUUID();
  const journal = [];
  let transactionCompleted = false;

  try {
    let outputIndex = 0;
    for (const item of prepared) {
      for (const output of item.outputs) {
        const expectedOutput = path.resolve(output.filePath);
        const rootReal = await ensureOrdinaryOutputDirectoryTree(transactionRoot, path.dirname(expectedOutput));
        const initial = await readOrdinaryOutputBinding(expectedOutput, rootReal);
        const outputBytes = Buffer.from(output.content, "utf8");
        const stagePath = path.join(
          path.dirname(expectedOutput),
          `.audio-audit.${nonce}.${outputIndex}.stage`,
        );
        const backupPath = initial.exists
          ? path.join(path.dirname(expectedOutput), `.audio-audit.${nonce}.${outputIndex}.backup`)
          : null;
        const entry = {
          id: item.id,
          outputIndex,
          expectedOutput,
          rootReal,
          initial,
          stagePath,
          stageSha256: sha256Text(outputBytes),
          backupPath,
          backupSha256: initial.exists ? initial.sha256 : null,
          committed: false,
        };
        journal.push(entry);
        await writeExclusiveAudioTransactionFile(stagePath, outputBytes, rootReal);
        if (backupPath) {
          await writeExclusiveAudioTransactionFile(backupPath, initial.bytes, rootReal);
        }
        outputIndex += 1;
      }
    }

    // Every selected report and CSV is staged before the first destination is
    // mutated. Recheck both inputs and output-target identity immediately
    // before beginning the commit phase.
    for (const item of prepared) {
      if (item.verifyUnchanged) await item.verifyUnchanged();
    }
    for (const entry of journal) {
      const current = await readOrdinaryOutputBinding(entry.expectedOutput, entry.rootReal);
      requireAudioEvidence(
        sameOutputBinding(entry.initial, current),
        `${entry.id}: audio output changed during transaction staging`,
      );
    }

    for (const [commitIndex, entry] of journal.entries()) {
      const current = await readOrdinaryOutputBinding(entry.expectedOutput, entry.rootReal);
      requireAudioEvidence(
        sameOutputBinding(entry.initial, current),
        `${entry.id}: audio output changed immediately before commit`,
      );
      if (transactionHooks.beforeCommit) {
        await transactionHooks.beforeCommit({
          id: entry.id,
          commitIndex,
          outputPath: entry.expectedOutput,
        });
      }
      await rename(entry.stagePath, entry.expectedOutput);
      entry.committed = true;
      const committed = await readOrdinaryOutputBinding(entry.expectedOutput, entry.rootReal, {
        allowMissing: false,
      });
      requireAudioEvidence(
        committed.sha256 === entry.stageSha256,
        `${entry.id}: committed audio output failed verification`,
      );
    }
    for (const item of prepared) {
      if (item.verifyUnchanged) await item.verifyUnchanged();
    }
    transactionCompleted = true;
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...journal].reverse()) {
      try {
        if (entry.committed) {
          const committed = await readOrdinaryOutputBinding(entry.expectedOutput, entry.rootReal, {
            allowMissing: false,
          });
          requireAudioEvidence(
            committed.sha256 === entry.stageSha256,
            `${entry.id}: refusing to roll back a changed committed audio output`,
          );
          if (entry.backupPath) {
            const backup = await readOrdinaryOutputBinding(entry.backupPath, entry.rootReal, {
              allowMissing: false,
            });
            requireAudioEvidence(
              backup.sha256 === entry.backupSha256,
              `${entry.id}: audio rollback backup changed`,
            );
            await rename(entry.backupPath, entry.expectedOutput);
            const restored = await readOrdinaryOutputBinding(entry.expectedOutput, entry.rootReal, {
              allowMissing: false,
            });
            requireAudioEvidence(
              restored.sha256 === entry.initial.sha256,
              `${entry.id}: audio rollback did not restore the original bytes`,
            );
          } else {
            await unlinkOwnedAudioTransactionFile(
              entry.expectedOutput,
              entry.stageSha256,
              entry.rootReal,
            );
          }
        } else {
          await unlinkOwnedAudioTransactionFile(entry.stagePath, entry.stageSha256, entry.rootReal);
          if (entry.backupPath) {
            await unlinkOwnedAudioTransactionFile(
              entry.backupPath,
              entry.backupSha256,
              entry.rootReal,
            );
          }
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    if (rollbackErrors.length) {
      throw new Error(`${error.message}; audio rollback also failed: ${rollbackErrors.join("; ")}`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    if (transactionCompleted) {
      const cleanupErrors = [];
      for (const entry of journal) {
        try {
          await unlinkOwnedAudioTransactionFile(entry.stagePath, entry.stageSha256, entry.rootReal);
          if (entry.backupPath) {
            await unlinkOwnedAudioTransactionFile(
              entry.backupPath,
              entry.backupSha256,
              entry.rootReal,
            );
          }
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError.message);
        }
      }
      if (cleanupErrors.length) {
        throw new Error(`Audio transaction committed but cleanup failed: ${cleanupErrors.join("; ")}`);
      }
    }
  }
}

export async function preflightAndCommitAudioAudits({
  targets,
  prepareTarget,
  check = false,
  transactionRoot = path.join(projectRoot, "migrations"),
  transactionHooks = {},
}) {
  const prepared = [];
  for (const target of targets) prepared.push(await prepareTarget(target));

  const selectedOutputs = new Set();
  for (const item of prepared) {
    requireAudioEvidence(item?.id && item?.workspace && Array.isArray(item.outputs), "Prepared audio audit is malformed");
    const expectedPaths = new Set([
      path.resolve(item.workspace, "audit", "audio-runtime-evidence.json"),
      path.resolve(item.workspace, "audio-inventory.csv"),
    ]);
    const actualPaths = new Set(item.outputs.map(({ filePath }) => path.resolve(filePath)));
    requireAudioEvidence(
      actualPaths.size === 2 &&
      expectedPaths.size === actualPaths.size &&
      [...expectedPaths].every((filePath) => actualPaths.has(filePath)),
      `${item.id}: audio audit output boundary must contain only audit/audio-runtime-evidence.json and audio-inventory.csv`,
    );
    for (const outputPath of actualPaths) {
      requireAudioEvidence(!selectedOutputs.has(outputPath), `Duplicate audio output target: ${outputPath}`);
      selectedOutputs.add(outputPath);
    }
    if (item.verifyUnchanged) await item.verifyUnchanged();
  }

  if (check) {
    for (const item of prepared) {
      for (const output of item.outputs) {
        const rootReal = await ensureOrdinaryOutputDirectoryTree(
          transactionRoot,
          path.dirname(output.filePath),
        );
        const existing = await readOrdinaryOutputBinding(output.filePath, rootReal, {
          allowMissing: false,
        });
        if (!existing.bytes.equals(Buffer.from(output.content, "utf8"))) {
          throw new Error(`${path.relative(projectRoot, output.filePath)} is stale; run npm run audit:pilot-audio`);
        }
      }
    }
  } else {
    await writeAudioAuditTransaction(prepared, transactionRoot, transactionHooks);
  }
  for (const item of prepared) {
    if (item.verifyUnchanged) await item.verifyUnchanged();
  }
  return prepared.map(({ result }) => result);
}

export async function auditPilotAudio({
  ids = [],
  check = false,
  lessonRelease = null,
  lessonReleasesPath = defaultLessonReleasesPath,
} = {}) {
  requireAudioEvidence(new Set(ids).size === ids.length, "Audio audit IDs must not be repeated");
  const approved = new Set([
    ...PILOT_MIGRATIONS.map(({ id }) => id),
    ...ADDITIONAL_AUDIO_AUDIT_IDS,
  ]);
  let releaseMemberships = new Map();
  if (lessonRelease) {
    releaseMemberships = await loadLessonReleaseAudioMemberships({ ids, lessonRelease, lessonReleasesPath });
  } else {
    for (const id of ids) if (!approved.has(id)) throw new Error(`Not an approved legacy audio audit target: ${id}; provide --lesson-release for exact release members`);
  }
  const selectedIds = lessonRelease
    ? [...releaseMemberships.keys()]
    : ids.length
      ? ids
      : PILOT_MIGRATIONS.map(({ id }) => id);
  const selected = selectedIds.map((id) => ({
    ...(PILOT_MIGRATIONS.find((pilot) => pilot.id === id) || { id }),
    releaseMembership: releaseMemberships.get(id) || null,
  }));
  const animationsCatalogPath = path.join(projectRoot, "catalog/animations.json");
  const sourceFilesCatalogPath = path.join(projectRoot, "catalog/source-files.json");
  const animationsCatalogBytes = await readFile(animationsCatalogPath);
  const sourceFilesCatalogBytes = await readFile(sourceFilesCatalogPath);
  const catalog = JSON.parse(animationsCatalogBytes.toString("utf8"));
  const sourceFilesCatalog = JSON.parse(sourceFilesCatalogBytes.toString("utf8"));
  const animationsCatalogSha256 = createHash("sha256").update(animationsCatalogBytes).digest("hex");
  const sourceFilesCatalogSha256 = createHash("sha256").update(sourceFilesCatalogBytes).digest("hex");
  const audioGroupsCatalogPath = path.join(projectRoot, "catalog/audio-groups.json");
  const audioGroupsCatalogBytes = await readFile(audioGroupsCatalogPath);
  const groupsCatalog = JSON.parse(audioGroupsCatalogBytes.toString("utf8"));
  const audioGroupsCatalogSha256 = createHash("sha256").update(audioGroupsCatalogBytes).digest("hex");
  const animationsById = new Map(catalog.animations.map((animation) => [animation.animationId, animation]));
  const groupsById = new Map(groupsCatalog.groups.map((group) => [group.groupId, group]));
  const ffprobeVersion = await toolVersion("ffprobe", ["-version"]);
  const ffdecVersion = await toolVersion("ffdec", ["-help"]);
  const hostExtraction = await extractHostAudioSemantics(ffdecVersion);
  const hostEvidence = hostExtraction.evidence;
  return preflightAndCommitAudioAudits({
    targets: selected,
    check,
    prepareTarget: async (pilot) => {
    const workspace = path.join(projectRoot, "migrations", pilot.id);
    const manifestPath = path.join(workspace, "migration.json");
    const manifestTextBefore = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestTextBefore);
    const animation = animationsById.get(pilot.id);
    if (!animation) throw new Error(`${pilot.id}: missing catalog animation`);
    const releaseMembershipEvidence = pilot.releaseMembership
      ? await verifyLessonReleaseAudioIdentity({
        membership: pilot.releaseMembership,
        manifest,
        animation,
      })
      : null;

    const exactExternal = [];
    for (const record of animation.audio?.exact || []) exactExternal.push(await probeExternal(record, ffprobeVersion, "exact-basename-association"));
    for (const item of exactExternal) {
      item.startSemantics = externalAudioStartSemantics(item, manifest, hostEvidence);
      item.startFrame = null;
      item.startFrameAuthority = item.startSemantics === "host-user-activated"
        ? "Verified legacy host script selects and starts this external track from language/user state; it is not a child root-timeline cue."
        : "The external cue is interaction/host-state dependent, but the relevant host convention was not verified."
    }
    const expectedButMissingFromKeyterm = await expectedMissingExternalAudio(manifest, exactExternal, hostEvidence);
    const groupExternal = [];
    for (const groupId of animation.audio?.groupIds || []) {
      const group = groupsById.get(groupId);
      if (!group) throw new Error(`${pilot.id}: missing audio group ${groupId}`);
      for (const record of group.files) groupExternal.push({
        groupId,
        ...await probeExternal(record, ffprobeVersion, "lesson-group-candidate-only"),
      });
    }

    const machineDirectory = path.join(workspace, "audit", "machine");
    const embedded = await parseSwfmillAudio(path.join(machineDirectory, "swfmill.xml.gz"));
    const scriptText = await readGzipText(path.join(machineDirectory, "ffdec-scripts.txt.gz"));
    const scriptOperations = parseScriptAudioOperations(scriptText);
    for (const operation of scriptOperations) {
      if (operation.operation?.toLowerCase() !== "attachsound" || !operation.literal) continue;
      const sound = embedded.defineSounds.find(({ linkage }) => linkage === operation.literal);
      operation.resolvedCharacterId = sound?.characterId ?? null;
    }
    const fqSourceDerivedUrlMatrix = await buildFqSourceDerivedAudioMatrix({
      pilot,
      manifest,
      workspace,
      hostEvidence,
      fqHostUrlContract: hostExtraction.fqUrlContract,
      groupExternal,
      childScriptText: scriptText,
      sourceFilesCatalog,
      sourceFilesCatalogSha256,
      audioGroupsCatalogSha256,
    });
    const expectedButMissingFromFqMatrix = (fqSourceDerivedUrlMatrix?.expectedPaths || [])
      .filter(({ status }) => status === "missing-source")
      .map((entry) => ({
        sourceFile: entry.sourceFile,
        language: entry.language,
        status: entry.status,
        expectedPathId: entry.expectedPathId,
        cueKind: entry.kind,
        questionNumber: entry.questionNumber,
        option: entry.option,
        evidence: "Hash-bound child Q1..Q31/four-option controls plus the indexELM FQ URL algorithm require this exact path; source-files.json has no matching preserved file. The path is not promoted to a cue.",
      }));
    const expectedButMissing = [...expectedButMissingFromKeyterm, ...expectedButMissingFromFqMatrix];
    const xmlEvidence = await auditXmlReferences(animation);
    const strictNoAudioAssessment = await buildStrictNoAudioAssessment({
      pilot,
      manifest,
      animation,
      exactExternal,
      groupExternal,
      embedded,
      scriptOperations,
      machineDirectory,
      sourceFilesCatalog,
      sourceFilesCatalogSha256,
      animationsCatalogSha256,
    });

    const audioInventoryPath = path.join(workspace, "audio-inventory.csv");
    const existingInventory = csvParse(await readFile(audioInventoryPath, "utf8"));
    const generatedInventory = [
      ...externalInventoryRows(exactExternal, manifest, hostEvidence),
      ...embeddedInventoryRows(manifest, embedded),
    ];
    const mergedInventory = mergeInventory(existingInventory, generatedInventory);
    const inventoryContent = csvRender(mergedInventory);

    const report = {
      schemaVersion: 2,
      animationId: pilot.id,
      generatedBy: "scripts/audit-pilot-audio.mjs",
      scope: "strict-audio-structural-and-file-metadata-audit",
      migrationStatusBefore: null,
      migrationStatusBinding: "excluded-from-structural-audio-evidence",
      migrationStatusUnchanged: true,
      source: {
        swf: manifest.source.swf,
        expectedSha256: manifest.source.swfSha256,
        observedSha256: await sha256File(absolute(manifest.source.swf)),
      },
      tools: { ffprobe: ffprobeVersion, ffdec: ffdecVersion, swfmillEvidence: manifest.toolVersions?.swfmill || "recorded in audit/machine/report.json" },
      authority: {
        hostScript: hostEvidence,
        xmlReferences: xmlEvidence,
        catalogAnimation: "catalog/animations.json",
        catalogAudioGroups: animation.audio?.groupIds?.length ? "catalog/audio-groups.json" : null,
        ...(releaseMembershipEvidence ? { lessonReleaseMembership: releaseMembershipEvidence } : {}),
      },
      externalAudio: {
        exactAssociations: exactExternal,
        lessonGroupCandidates: groupExternal,
        ...(fqSourceDerivedUrlMatrix ? { sourceDerivedExpectedUrlMatrix: fqSourceDerivedUrlMatrix } : {}),
        expectedButMissing,
        exactCount: exactExternal.length,
        candidateOnlyCount: groupExternal.length,
        missingExpectedCount: expectedButMissing.length,
      },
      embeddedAudio: embedded,
      actionScriptAudioOperations: scriptOperations,
      strictNoAudioAssessment,
      inventory: {
        file: "audio-inventory.csv",
        rowCount: mergedInventory.length,
        exactExternalRows: exactExternal.length,
        embeddedRows: generatedInventory.length - exactExternal.length,
        manifestDeclaredAudioLanguages: manifest.audio?.languages || [],
        inventoriedLanguages: [...new Set(mergedInventory.map(({ language }) => language).filter(Boolean))].sort(),
        lessonGroupCandidatesExcludedFromCsv: groupExternal.length,
        rationale: "Candidate-only lesson audio is not promoted to a cue without a resolved host/runtime branch. Root SoundStream/StartSound cues use timeline-frame only when a root frame is structurally proven; verified host/user external tracks use host-user-activated; nested or unresolved cues use interaction-state. No root cue frame is guessed.",
      },
      acceptance: {
        structurallyAudited: true,
        authoritativeListeningComplete: false,
        hostStateTraversalComplete: false,
        synchronizationComplete: false,
        notApplicable: strictNoAudioAssessment?.decision === "accepted-not-required"
          ? ["authoritativeListeningComplete", "hostStateTraversalComplete", "synchronizationComplete"]
          : [],
        strictAudioAcceptance: strictNoAudioAssessment?.decision || "pending",
        strictAudioAcceptanceRationale: strictNoAudioAssessment?.rationale || null,
        manifestFollowUp: manifestAudioFollowUp(manifest, exactExternal, groupExternal, embedded),
        requirements: acceptanceRequirements({
          manifest,
          exactExternal,
          groupExternal,
          embedded,
          scriptOperations,
          hostEvidence,
          strictNoAudioAssessment,
          releaseMembershipEvidence,
        }),
        ...(releaseMembershipEvidence ? {
          releaseBoundary: {
            authoritativeOriginalRuntimeListeningComplete: false,
            authoritativeOriginalRuntimeTraversalComplete: false,
            spokenLanguageContentVerified: false,
            humanAudioReviewComplete: false,
            ownerAcceptanceComplete: false,
            strictMigrationComplete: false,
            publicationAuthorized: false,
            strictAcceptanceEffect: "none",
          },
        } : {}),
      },
      limitations: strictNoAudioAssessment?.decision === "accepted-not-required"
        ? [
          "No playback/listening was performed because the source-hash-bound shipped SWF has no audio data or audio ActionScript and no preserved host placement can create an external cue.",
          "The paired FLA was not used to infer shipped audio; unused authoring-library content, if any, cannot create runtime sound absent SWF audio data/calls and host placement.",
          "No cue frame, branch reachability, URL resolution, language content, or synchronization was guessed.",
        ]
        : [
          "Directory and host-script evidence can identify intended language routing but cannot prove the spoken content; listening remains mandatory.",
          "SoundStream frame numbers inside DefineSprite are local symbol frames, not unconditional root/runtime cue times.",
          "No cue frame, branch reachability, URL resolution, language content, or synchronization was guessed.",
          ...(releaseMembershipEvidence ? ["Lesson-release membership and this machine audit do not satisfy original-runtime listening, human review, owner acceptance, strict completion, or publication."] : []),
        ],
    };
    report.source.hashMatches = report.source.observedSha256 === report.source.expectedSha256;
    const reportContent = `${JSON.stringify(report, null, 2)}\n`;
    return {
      id: pilot.id,
      workspace,
      outputs: [
        { filePath: path.join(workspace, "audit", "audio-runtime-evidence.json"), content: reportContent },
        { filePath: audioInventoryPath, content: inventoryContent },
      ],
      verifyUnchanged: async () => {
        const manifestTextAfter = await readFile(manifestPath, "utf8");
        if (manifestTextAfter !== manifestTextBefore) throw new Error(`${pilot.id}: migration.json changed during audio audit`);
      },
      result: {
        id: pilot.id,
        exact: exactExternal.length,
        candidates: groupExternal.length,
        embedded: generatedInventory.length - exactExternal.length,
        inventoryRows: mergedInventory.length,
      },
    };
    },
  });
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const results = await auditPilotAudio(options);
    for (const result of results) console.log(`${options.check ? "CHECK" : "WRITE"} ${result.id}: exact=${result.exact}, candidates=${result.candidates}, embedded=${result.embedded}, inventory=${result.inventoryRows}`);
    console.log(`${options.check ? "Verified" : "Audited"} ${results.length} pilot audio workspace(s); migration statuses unchanged.`);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
