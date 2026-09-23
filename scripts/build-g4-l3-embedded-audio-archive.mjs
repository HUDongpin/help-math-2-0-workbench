#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, lstat, readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {inflateSync} from "node:zlib";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const PARSER_VERSION = 1;
const DEFAULT_MAX_ARCHIVE_BYTES = 1024 ** 3;
const MACHINE_AUDIT_RELATIVE = "reports/g4-l3-machine-source-audits.json";
const DEFAULT_JSON_RELATIVE = "reports/g4-l3-embedded-audio-archive.json";
const DEFAULT_MARKDOWN_RELATIVE = "reports/g4-l3-embedded-audio-archive.md";
const ARCHIVE_ROOT_RELATIVE = "artifacts/g4-l3-embedded-audio/sha256";
const ARCHIVE_IGNORE_RULE = "artifacts/g4-l3-embedded-audio/";
const SOURCE_ROOT_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";

const SOUND_FORMATS = Object.freeze({
  0: "uncompressed-native-endian",
  1: "adpcm",
  2: "mp3",
  3: "uncompressed-little-endian",
  4: "nellymoser-16khz",
  5: "nellymoser-8khz",
  6: "nellymoser",
  11: "speex",
});
const SOUND_RATES = Object.freeze([5512, 11025, 22050, 44100]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(value, root = repositoryRoot) {
  return path.relative(path.resolve(root), path.resolve(value)).split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalFingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value))));
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function archiveExtension(formatCode) {
  return formatCode === 2 ? "mp3" : "bin";
}

function archiveRelativePath(payloadSha256, formatCode) {
  return `${ARCHIVE_ROOT_RELATIVE}/${payloadSha256.slice(0, 2)}/${payloadSha256}.${archiveExtension(formatCode)}`;
}

function readBits(bytes, bitOffset, width, signed = false) {
  invariant(Number.isInteger(width) && width >= 0 && width <= 31, `Unsupported bit width ${width}`);
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    const absolute = bitOffset + index;
    const byte = bytes[Math.floor(absolute / 8)];
    invariant(byte !== undefined, "Truncated SWF bit field");
    value = value * 2 + ((byte >> (7 - (absolute % 8))) & 1);
  }
  if (signed && width && value >= 2 ** (width - 1)) value -= 2 ** width;
  return value;
}

function readRectByteLength(bytes, offset) {
  const bitOffset = offset * 8;
  const width = readBits(bytes, bitOffset, 5);
  invariant(width >= 1, "Invalid SWF RECT bit width");
  return Math.ceil((5 + 4 * width) / 8);
}

function decompressSwf(sourceBytes) {
  invariant(sourceBytes.length >= 12, "SWF is too short");
  const signature = sourceBytes.subarray(0, 3).toString("ascii");
  if (signature === "FWS") return Buffer.from(sourceBytes);
  if (signature === "CWS") {
    const bytes = Buffer.concat([
      Buffer.from("FWS"),
      sourceBytes.subarray(3, 8),
      inflateSync(sourceBytes.subarray(8)),
    ]);
    bytes.writeUInt32LE(bytes.length, 4);
    return bytes;
  }
  throw new Error(`Unsupported SWF signature ${signature}; ZWS extraction is fail-closed`);
}

function parseTagRecord(bytes, offset, end) {
  invariant(offset + 2 <= end, "Truncated SWF tag header");
  const tagStart = offset;
  const shortHeader = bytes.readUInt16LE(offset);
  offset += 2;
  const code = shortHeader >> 6;
  let length = shortHeader & 0x3f;
  if (length === 0x3f) {
    invariant(offset + 4 <= end, "Truncated long SWF tag length");
    length = bytes.readUInt32LE(offset);
    offset += 4;
  }
  const bodyStart = offset;
  const bodyEnd = bodyStart + length;
  invariant(bodyEnd <= end, `Truncated SWF tag ${code}`);
  return {
    code,
    tagStart,
    bodyStart,
    bodyEnd,
    bodyLength: length,
    recordHeader: bytes.subarray(tagStart, bodyStart),
  };
}

function tagHeaderFact(tag) {
  return {
    byteLength: tag.recordHeader.length,
    hex: tag.recordHeader.toString("hex"),
  };
}

function formatFact(formatCode) {
  return SOUND_FORMATS[formatCode] || `format-${formatCode}`;
}

function payloadKind(formatCode) {
  return formatCode === 0 || formatCode === 3 ? "raw-codec-audio-bytes" : "compressed-codec-payload";
}

function parseDefineSound(bytes, tag, context) {
  invariant(tag.bodyLength >= 7, `${context.domainId}: truncated DefineSound`);
  const soundId = bytes.readUInt16LE(tag.bodyStart);
  const formatByte = bytes[tag.bodyStart + 2];
  const formatCode = formatByte >> 4;
  const rateCode = (formatByte >> 2) & 0x03;
  const soundData = bytes.subarray(tag.bodyStart + 7, tag.bodyEnd);
  let wrapper = Buffer.alloc(0);
  let codecPayload = soundData;
  let mp3SeekSamples = null;
  if (formatCode === 2) {
    invariant(soundData.length >= 2, `${context.domainId}: MP3 DefineSound ${soundId} lacks SeekSamples`);
    wrapper = soundData.subarray(0, 2);
    codecPayload = soundData.subarray(2);
    mp3SeekSamples = wrapper.readInt16LE(0);
  }
  return {
    kind: "DefineSound",
    soundId,
    ownerDomainId: context.domainId,
    ownerDomainKind: context.domainKind,
    sourceOrder: context.globalAudioOrder,
    globalTagOrdinal: context.globalTagOrdinal,
    tagOrdinalInDomain: context.tagOrdinalInDomain,
    localFrame: context.localFrame,
    tagCode: 14,
    swfTagRecordHeader: tagHeaderFact(tag),
    tagBodyBytes: tag.bodyLength,
    tagBodySha256: sha256(bytes.subarray(tag.bodyStart, tag.bodyEnd)),
    soundHeader: {
      byteLength: 7,
      hex: bytes.subarray(tag.bodyStart, tag.bodyStart + 7).toString("hex"),
      formatCode,
      format: formatFact(formatCode),
      rateCode,
      sampleRateHz: SOUND_RATES[rateCode],
      sampleSizeBits: formatByte & 0x02 ? 16 : 8,
      channels: formatByte & 0x01 ? 2 : 1,
      declaredSampleCount: bytes.readUInt32LE(tag.bodyStart + 3),
    },
    codecWrapperHeader: {
      byteLength: wrapper.length,
      hex: wrapper.toString("hex"),
      mp3SeekSamples,
    },
    swfSoundData: {
      byteLength: soundData.length,
      sha256: sha256(soundData),
    },
    payload: {
      kind: payloadKind(formatCode),
      byteLength: codecPayload.length,
      sha256: sha256(codecPayload),
      plannedArchivePath: archiveRelativePath(sha256(codecPayload), formatCode),
      archivePath: null,
      archiveWritten: false,
      physicalHashVerified: false,
    },
    language: {classification: "unresolved", established: false},
    cueMappingEstablished: false,
    runtimeSynchronizationEstablished: false,
    _payloadBytes: Buffer.from(codecPayload),
  };
}

function parseSoundStreamHead(bytes, tag, context, streamIndex) {
  invariant(tag.bodyLength >= 4, `${context.domainId}: truncated SoundStreamHead`);
  const playbackByte = bytes[tag.bodyStart];
  const streamByte = bytes[tag.bodyStart + 1];
  const formatCode = streamByte >> 4;
  const rateCode = (streamByte >> 2) & 0x03;
  const hasMp3LatencySeek = formatCode === 2;
  if (hasMp3LatencySeek) invariant(tag.bodyLength >= 6, `${context.domainId}: MP3 SoundStreamHead lacks LatencySeek`);
  return {
    kind: "SoundStream",
    streamIndex,
    ownerDomainId: context.domainId,
    ownerDomainKind: context.domainKind,
    sourceOrder: context.globalAudioOrder,
    globalTagOrdinal: context.globalTagOrdinal,
    tagOrdinalInDomain: context.tagOrdinalInDomain,
    headLocalFrame: context.localFrame,
    head: {
      tagCode: tag.code,
      tagType: tag.code === 45 ? "SoundStreamHead2" : "SoundStreamHead",
      swfTagRecordHeader: tagHeaderFact(tag),
      tagBodyBytes: tag.bodyLength,
      tagBodySha256: sha256(bytes.subarray(tag.bodyStart, tag.bodyEnd)),
      rawBodyHex: bytes.subarray(tag.bodyStart, tag.bodyEnd).toString("hex"),
      reservedNibble: playbackByte >> 4,
      playbackRateCode: (playbackByte >> 2) & 0x03,
      playbackSampleRateHz: SOUND_RATES[(playbackByte >> 2) & 0x03],
      playbackSampleSizeBits: playbackByte & 0x02 ? 16 : 8,
      playbackChannels: playbackByte & 0x01 ? 2 : 1,
      formatCode,
      format: formatFact(formatCode),
      rateCode,
      sampleRateHz: SOUND_RATES[rateCode],
      sampleSizeBits: streamByte & 0x02 ? 16 : 8,
      channels: streamByte & 0x01 ? 2 : 1,
      nominalSamplesPerBlock: bytes.readUInt16LE(tag.bodyStart + 2),
      mp3LatencySeek: hasMp3LatencySeek ? bytes.readInt16LE(tag.bodyStart + 4) : null,
    },
    blocks: [],
    blockCount: 0,
    blocksWithExplicitSampleCount: 0,
    totalBlockHeaderSampleCount: null,
    payload: null,
    language: {classification: "unresolved", established: false},
    cueMappingEstablished: false,
    runtimeSynchronizationEstablished: false,
    _payloadParts: [],
  };
}

function addSoundStreamBlock(bytes, tag, context, stream) {
  const formatCode = stream.head.formatCode;
  let wrapper = Buffer.alloc(0);
  let codecPayload = bytes.subarray(tag.bodyStart, tag.bodyEnd);
  let explicitSampleCount = null;
  let mp3SeekSamples = null;
  if (formatCode === 2) {
    invariant(tag.bodyLength >= 4, `${context.domainId}: MP3 SoundStreamBlock lacks its four-byte header`);
    wrapper = bytes.subarray(tag.bodyStart, tag.bodyStart + 4);
    codecPayload = bytes.subarray(tag.bodyStart + 4, tag.bodyEnd);
    explicitSampleCount = wrapper.readUInt16LE(0);
    mp3SeekSamples = wrapper.readInt16LE(2);
  }
  const archiveOffset = stream._payloadParts.reduce((sum, part) => sum + part.length, 0);
  const block = {
    blockIndex: stream.blocks.length + 1,
    globalTagOrdinal: context.globalTagOrdinal,
    tagOrdinalInDomain: context.tagOrdinalInDomain,
    localFrame: context.localFrame,
    tagCode: 19,
    swfTagRecordHeader: tagHeaderFact(tag),
    tagBodyBytes: tag.bodyLength,
    tagBodySha256: sha256(bytes.subarray(tag.bodyStart, tag.bodyEnd)),
    codecWrapperHeader: {
      byteLength: wrapper.length,
      hex: wrapper.toString("hex"),
      explicitSampleCount,
      mp3SeekSamples,
    },
    payload: {
      byteOffsetInStreamArchive: archiveOffset,
      byteLength: codecPayload.length,
      sha256: sha256(codecPayload),
    },
  };
  stream.blocks.push(block);
  stream._payloadParts.push(Buffer.from(codecPayload));
}

function finalizeStream(stream) {
  const codecPayload = Buffer.concat(stream._payloadParts);
  const formatCode = stream.head.formatCode;
  const explicit = stream.blocks.filter((block) => block.codecWrapperHeader.explicitSampleCount !== null);
  stream.blockCount = stream.blocks.length;
  stream.blocksWithExplicitSampleCount = explicit.length;
  stream.totalBlockHeaderSampleCount = explicit.length === stream.blocks.length
    ? explicit.reduce((sum, block) => sum + block.codecWrapperHeader.explicitSampleCount, 0)
    : null;
  stream.payload = {
    kind: payloadKind(formatCode),
    assembly: "source-order concatenation of each SoundStreamBlock codec payload after preserving its SWF wrapper header separately",
    byteLength: codecPayload.length,
    sha256: sha256(codecPayload),
    plannedArchivePath: archiveRelativePath(sha256(codecPayload), formatCode),
    archivePath: null,
    archiveWritten: false,
    physicalHashVerified: false,
  };
  stream._payloadBytes = codecPayload;
  delete stream._payloadParts;
  return stream;
}

export function parseEmbeddedAudioPayloads(sourceBytes) {
  const sourceSignature = sourceBytes.subarray(0, 3).toString("ascii");
  const bytes = decompressSwf(sourceBytes);
  const declaredUncompressedBytes = sourceBytes.readUInt32LE(4);
  invariant(bytes.length === declaredUncompressedBytes,
    `SWF declared ${declaredUncompressedBytes} uncompressed bytes but parsed ${bytes.length}`);
  const timelineOffset = 8 + readRectByteLength(bytes, 8);
  invariant(timelineOffset + 4 <= bytes.length, "Truncated SWF timeline header");
  const rootFrameCount = bytes.readUInt16LE(timelineOffset + 2);
  const defineSounds = [];
  const soundStreams = [];
  const tagCounts = {DefineSound: 0, SoundStreamHead: 0, SoundStreamHead2: 0, SoundStreamBlock: 0};
  let globalTagOrdinal = 0;
  let globalAudioOrder = 0;

  const parseRange = (start, end, domainId, domainKind, declaredFrameCount) => {
    let offset = start;
    let localFrame = 1;
    let tagOrdinalInDomain = 0;
    let activeStream = null;
    while (offset + 2 <= end) {
      const tag = parseTagRecord(bytes, offset, end);
      offset = tag.bodyEnd;
      globalTagOrdinal += 1;
      tagOrdinalInDomain += 1;
      const baseContext = {domainId, domainKind, declaredFrameCount, localFrame, globalTagOrdinal, tagOrdinalInDomain};
      if (tag.code === 14) {
        tagCounts.DefineSound += 1;
        globalAudioOrder += 1;
        defineSounds.push(parseDefineSound(bytes, tag, {...baseContext, globalAudioOrder}));
      } else if (tag.code === 18 || tag.code === 45) {
        const name = tag.code === 45 ? "SoundStreamHead2" : "SoundStreamHead";
        tagCounts[name] += 1;
        globalAudioOrder += 1;
        activeStream = parseSoundStreamHead(bytes, tag, {...baseContext, globalAudioOrder}, soundStreams.length + 1);
        soundStreams.push(activeStream);
      } else if (tag.code === 19) {
        tagCounts.SoundStreamBlock += 1;
        invariant(activeStream, `${domainId}: SoundStreamBlock encountered before SoundStreamHead`);
        addSoundStreamBlock(bytes, tag, baseContext, activeStream);
      } else if (tag.code === 39) {
        invariant(tag.bodyLength >= 4, `${domainId}: truncated DefineSprite`);
        const spriteId = bytes.readUInt16LE(tag.bodyStart);
        const spriteFrameCount = bytes.readUInt16LE(tag.bodyStart + 2);
        parseRange(tag.bodyStart + 4, tag.bodyEnd, `sprite-${spriteId}`, "sprite", spriteFrameCount);
      }
      if (tag.code === 1) localFrame += 1;
      if (tag.code === 0) break;
    }
  };
  parseRange(timelineOffset + 4, bytes.length, "root", "root", rootFrameCount);
  for (const stream of soundStreams) finalizeStream(stream);
  return {
    parserVersion: PARSER_VERSION,
    source: {
      signature: sourceSignature,
      compressedBytes: sourceBytes.length,
      declaredUncompressedBytes,
      uncompressedSha256: sha256(bytes),
      rootFrameCount,
    },
    tagCounts,
    defineSounds,
    soundStreams,
  };
}

function allUnits(items) {
  return items.flatMap((item) => [
    ...item.embeddedAudio.defineSounds.map((unit) => ({item, unit})),
    ...item.embeddedAudio.soundStreams.map((unit) => ({item, unit})),
  ]);
}

function logicalPayloadIdentityProjection(unit) {
  if (unit.kind === "DefineSound") return {
    kind: unit.kind,
    formatCode: unit.soundHeader.formatCode,
    soundHeaderHex: unit.soundHeader.hex,
    codecWrapperHeaderHex: unit.codecWrapperHeader.hex,
    payloadSha256: unit.payload.sha256,
    payloadByteLength: unit.payload.byteLength,
  };
  return {
    kind: unit.kind,
    headTagType: unit.head.tagType,
    headRawBodyHex: unit.head.rawBodyHex,
    payloadSha256: unit.payload.sha256,
    payloadByteLength: unit.payload.byteLength,
    orderedBlockLayout: unit.blocks.map((block) => ({
      codecWrapperHeaderHex: block.codecWrapperHeader.hex,
      payloadSha256: block.payload.sha256,
      payloadByteLength: block.payload.byteLength,
    })),
  };
}

function bindLogicalPayloadIdentities(items) {
  for (const {unit} of allUnits(items)) {
    unit.logicalPayloadIdentitySha256 = canonicalFingerprint(logicalPayloadIdentityProjection(unit));
  }
}

export function buildArchivePlan(items, maxArchiveBytes = DEFAULT_MAX_ARCHIVE_BYTES) {
  invariant(Number.isSafeInteger(maxArchiveBytes) && maxArchiveBytes >= 0, "Archive byte cap must be a non-negative safe integer");
  const candidates = new Map();
  let candidatePayloadBytes = 0;
  for (const {unit} of allUnits(items)) {
    if (!unit.logicalPayloadIdentitySha256) {
      unit.logicalPayloadIdentitySha256 = canonicalFingerprint(logicalPayloadIdentityProjection(unit));
    }
    const payload = unit._payloadBytes;
    invariant(Buffer.isBuffer(payload), "Archive unit lacks in-memory payload bytes");
    invariant(sha256(payload) === unit.payload.sha256 && payload.length === unit.payload.byteLength,
      "Archive unit payload binding is stale");
    candidatePayloadBytes += payload.length;
    const relativePath = unit.payload.plannedArchivePath;
    const prior = candidates.get(relativePath);
    if (prior) {
      invariant(prior.bytes.equals(payload), `Content-address collision at ${relativePath}`);
      prior.referenceCount += 1;
      prior.logicalPayloadIdentitySha256s.add(unit.logicalPayloadIdentitySha256);
    }
    else candidates.set(relativePath, {
      path: relativePath,
      sha256: unit.payload.sha256,
      byteLength: payload.length,
      formatCode: unit.kind === "DefineSound" ? unit.soundHeader.formatCode : unit.head.formatCode,
      bytes: payload,
      referenceCount: 1,
      logicalPayloadIdentitySha256s: new Set([unit.logicalPayloadIdentitySha256]),
    });
  }
  const files = [...candidates.values()].sort((left, right) => left.path.localeCompare(right.path));
  const plannedUniqueArchiveBytes = files.reduce((sum, file) => sum + file.byteLength, 0);
  const logicalIdentities = [...new Set(allUnits(items).map(({unit}) => unit.logicalPayloadIdentitySha256))].sort();
  return {
    maxArchiveBytes,
    candidateUnitCount: allUnits(items).length,
    uniqueLogicalPayloadIdentityCount: logicalIdentities.length,
    logicalPayloadIdentitySetSha256: canonicalFingerprint(logicalIdentities),
    candidatePayloadBytes,
    plannedUniqueArchiveFileCount: files.length,
    plannedUniqueArchiveBytes,
    deduplicatedBytes: candidatePayloadBytes - plannedUniqueArchiveBytes,
    eligible: plannedUniqueArchiveBytes <= maxArchiveBytes,
    files,
  };
}

async function assertArchiveRootIgnored(root) {
  const ignorePath = path.join(root, ".gitignore");
  const text = await readFile(ignorePath, "utf8");
  const rules = text.split(/\r?\n/).map((line) => line.trim());
  invariant(rules.includes(ARCHIVE_IGNORE_RULE), `.gitignore must contain ${ARCHIVE_IGNORE_RULE}`);
  return {path: ".gitignore", bytes: Buffer.byteLength(text), sha256: sha256(Buffer.from(text)), rule: ARCHIVE_IGNORE_RULE};
}

async function assertSafeArchivePath(root, relativePath) {
  const archiveRoot = path.join(root, ARCHIVE_ROOT_RELATIVE);
  const output = path.resolve(root, relativePath);
  invariant(isWithin(archiveRoot, output), `Archive output escapes ${ARCHIVE_ROOT_RELATIVE}: ${relativePath}`);
  const relative = path.relative(root, output);
  let cursor = root;
  for (const component of relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(!information?.isSymbolicLink(), `Archive path contains a symbolic link: ${projectPath(cursor, root)}`);
  }
  return output;
}

export async function writeOrVerifyArchivePlan(plan, {root = repositoryRoot, allowWrites = true} = {}) {
  invariant(plan.eligible, "Archive plan exceeds its preflight byte cap");
  let written = 0;
  let reused = 0;
  for (const file of plan.files) {
    const output = await assertSafeArchivePath(root, file.path);
    let observed = await readFile(output).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (!observed) {
      invariant(allowWrites, `Archive payload is missing in check mode: ${file.path}`);
      await mkdir(path.dirname(output), {recursive: true});
      await assertSafeArchivePath(root, file.path);
      try {
        await writeFile(output, file.bytes, {flag: "wx", mode: 0o444});
        written += 1;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      observed = await readFile(output);
    } else reused += 1;
    invariant(observed.length === file.byteLength && sha256(observed) === file.sha256,
      `Archive payload does not match its content address: ${file.path}`);
    const information = await stat(output);
    invariant(information.isFile(), `Archive payload is not a regular file: ${file.path}`);
  }
  const archiveRoot = path.join(root, ARCHIVE_ROOT_RELATIVE);
  const actualFiles = [];
  const walk = async (directory) => {
    const entries = await readdir(directory, {withFileTypes: true})
      .catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      invariant(!entry.isSymbolicLink(), `Archive contains a symbolic link: ${projectPath(absolute, root)}`);
      if (entry.isDirectory()) await walk(absolute);
      else {
        invariant(entry.isFile(), `Archive contains a non-file object: ${projectPath(absolute, root)}`);
        actualFiles.push(projectPath(absolute, root));
      }
    }
  };
  await walk(archiveRoot);
  actualFiles.sort();
  const expectedFiles = plan.files.map((file) => file.path).sort();
  invariant(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
    `Archive file set differs: expected ${expectedFiles.length}, found ${actualFiles.length}`);
  return {
    fileCount: plan.files.length,
    bytes: plan.plannedUniqueArchiveBytes,
    filesWrittenThisRun: written,
    filesReusedThisRun: reused,
    allPhysicalHashesVerified: true,
    archiveSetSha256: canonicalFingerprint(plan.files.map(({path: filePath, sha256: digest, byteLength}) => ({
      path: filePath,
      sha256: digest,
      byteLength,
    }))),
  };
}

function stripPayloadBytes(value) {
  if (Array.isArray(value)) return value.map(stripPayloadBytes);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== "_payloadBytes")
      .map(([key, child]) => [key, stripPayloadBytes(child)]));
  }
  return value;
}

function applyArchiveDisposition(items, archiveEstablished) {
  for (const {unit} of allUnits(items)) {
    unit.payload.archivePath = archiveEstablished ? unit.payload.plannedArchivePath : null;
    unit.payload.archiveWritten = archiveEstablished;
    unit.payload.physicalHashVerified = archiveEstablished;
  }
}

function compareMachineCensus(item, parsed) {
  const expected = item.swf.audio.tagCounts;
  for (const key of ["DefineSound", "SoundStreamHead", "SoundStreamHead2", "SoundStreamBlock"]) {
    invariant(parsed.tagCounts[key] === expected[key], `${item.animationId}: ${key} count differs from machine audit`);
  }
  const expectedSounds = new Map(item.swf.audio.defineSounds.map((sound) => [sound.soundId, sound]));
  invariant(parsed.defineSounds.length === expectedSounds.size, `${item.animationId}: DefineSound inventory differs from machine audit`);
  for (const sound of parsed.defineSounds) {
    const expectedSound = expectedSounds.get(sound.soundId);
    invariant(expectedSound && expectedSound.ownerDomainId === sound.ownerDomainId &&
      expectedSound.formatCode === sound.soundHeader.formatCode && expectedSound.sampleCount === sound.soundHeader.declaredSampleCount &&
      expectedSound.rateHz === sound.soundHeader.sampleRateHz && expectedSound.channels === sound.soundHeader.channels &&
      expectedSound.sampleSizeBits === sound.soundHeader.sampleSizeBits,
    `${item.animationId}: DefineSound ${sound.soundId} metadata differs from machine audit`);
  }
}

async function loadBoundFile(root, relativePath) {
  const absolute = path.join(root, relativePath);
  const bytes = await readFile(absolute);
  return {bytes, binding: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)}};
}

function validateMachineInput(machineAudit) {
  invariant(machineAudit?.schemaVersion === 1 && machineAudit.reportType === "g4-l3-machine-source-audits",
    "Machine source audit schema/report type mismatch");
  invariant(machineAudit.lesson?.canonicalItems === 40 && machineAudit.lesson.activeXmlReferencedPages === 39 &&
    machineAudit.lesson.courseShells === 1 && Array.isArray(machineAudit.items) && machineAudit.items.length === 40,
  "Machine source audit must bind 39 pages plus one shell");
  invariant(new Set(machineAudit.items.map((item) => item.animationId)).size === 40,
    "Machine source audit animation IDs are not unique");
}

export async function buildG4L3EmbeddedAudioArchive({
  root = repositoryRoot,
  maxArchiveBytes = DEFAULT_MAX_ARCHIVE_BYTES,
  inventoryOnly = false,
  allowArchiveWrites = true,
} = {}) {
  root = path.resolve(root);
  const [machineFile, scriptBytes, ignoreBinding] = await Promise.all([
    loadBoundFile(root, MACHINE_AUDIT_RELATIVE),
    readFile(scriptPath),
    assertArchiveRootIgnored(root),
  ]);
  const machineAudit = JSON.parse(machineFile.bytes);
  validateMachineInput(machineAudit);
  const items = [];
  for (const machineItem of machineAudit.items) {
    const sourceRelative = machineItem.source?.swf?.path;
    invariant(typeof sourceRelative === "string" && sourceRelative.startsWith(`${SOURCE_ROOT_RELATIVE}/`),
      `${machineItem.animationId}: source SWF is outside the frozen source root`);
    const sourceAbsolute = path.resolve(root, sourceRelative);
    invariant(isWithin(path.join(root, SOURCE_ROOT_RELATIVE), sourceAbsolute),
      `${machineItem.animationId}: source SWF path escapes the frozen source root`);
    const sourceBytes = await readFile(sourceAbsolute);
    const observedSha256 = sha256(sourceBytes);
    invariant(observedSha256 === machineItem.source.swf.sha256 && sourceBytes.length === machineItem.source.swf.bytes,
      `${machineItem.animationId}: physical source SWF differs from machine audit`);
    const parsed = parseEmbeddedAudioPayloads(sourceBytes);
    compareMachineCensus(machineItem, parsed);
    const item = {
      sequence: machineItem.sequence,
      batchId: machineItem.batch.batchId,
      animationId: machineItem.animationId,
      assetId: machineItem.assetId,
      releaseRole: machineItem.releaseRole,
      classification: machineItem.classification,
      source: {
        swf: {
          path: sourceRelative,
          expectedBytes: machineItem.source.swf.bytes,
          observedBytes: sourceBytes.length,
          expectedSha256: machineItem.source.swf.sha256,
          observedSha256,
          physicalHashVerified: true,
          signature: parsed.source.signature,
          declaredUncompressedBytes: parsed.source.declaredUncompressedBytes,
          uncompressedSha256: parsed.source.uncompressedSha256,
        },
      },
      embeddedAudio: {
        parserVersion: PARSER_VERSION,
        extractionMethod:
          "Direct recursive FWS/CWS tag parse. Codec payload bytes are copied exactly; MP3 DefineSound SeekSamples and MP3 SoundStreamBlock sample-count/seek headers are recorded separately and no audio is decoded or recompressed.",
        tagCounts: parsed.tagCounts,
        defineSounds: parsed.defineSounds,
        soundStreams: parsed.soundStreams,
      },
      evidenceLimits: {
        languageClassificationEstablished: false,
        cueMappingEstablished: false,
        runtimeSynchronizationEstablished: false,
        listeningAcceptanceEstablished: false,
        authoritativeRuntimeEstablished: false,
        humanReviewEstablished: false,
        ownerAcceptanceEstablished: false,
        strictCompletionEstablished: false,
      },
    };
    items.push(item);
  }
  bindLogicalPayloadIdentities(items);
  const plan = buildArchivePlan(items, maxArchiveBytes);
  const archiveEstablished = plan.eligible && !inventoryOnly;
  let archiveResult = {
    fileCount: 0,
    bytes: 0,
    filesWrittenThisRun: 0,
    filesReusedThisRun: 0,
    allPhysicalHashesVerified: false,
    archiveSetSha256: null,
  };
  if (archiveEstablished) archiveResult = await writeOrVerifyArchivePlan(plan, {root, allowWrites: allowArchiveWrites});
  applyArchiveDisposition(items, archiveEstablished);
  for (const item of items) {
    const clean = stripPayloadBytes(item);
    item.itemFingerprintSha256 = canonicalFingerprint(clean);
  }
  const cleanItems = stripPayloadBytes(items);
  const defineSounds = cleanItems.reduce((sum, item) => sum + item.embeddedAudio.defineSounds.length, 0);
  const soundStreams = cleanItems.reduce((sum, item) => sum + item.embeddedAudio.soundStreams.length, 0);
  const soundStreamBlocks = cleanItems.reduce((sum, item) => sum + item.embeddedAudio.soundStreams
    .reduce((streamSum, stream) => streamSum + stream.blockCount, 0), 0);
  const itemsWithAudioPayloads = cleanItems.filter((item) =>
    item.embeddedAudio.defineSounds.length || item.embeddedAudio.soundStreams.length).length;
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g4-l3-embedded-audio-archive",
    generator: {
      path: "scripts/build-g4-l3-embedded-audio-archive.mjs",
      version: SCHEMA_VERSION,
      parserVersion: PARSER_VERSION,
      sha256: sha256(scriptBytes),
    },
    acceptance: {
      acceptanceNeutral: true,
      languageClassificationEstablished: false,
      cueMappingEstablished: false,
      runtimeSynchronizationEstablished: false,
      listeningAcceptanceEstablished: false,
      authoritativeRuntimeEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      sourceAssetsChanged: 0,
      migrationsChanged: 0,
      productRenderersChanged: 0,
      approvalOrStatusChanges: 0,
      completionLedgerChanges: 0,
      statement:
        "This report proves only deterministic byte-exact inventory/extraction of SWF-embedded codec payloads. Language, cue mapping, audible content/quality, runtime timing/synchronization, authoritative playback, human review, owner acceptance, parity, and strict migration completion remain unresolved.",
    },
    sourceBindings: {
      machineSourceAudit: machineFile.binding,
      gitignore: ignoreBinding,
      frozenSourceRoot: SOURCE_ROOT_RELATIVE,
      sourceCount: cleanItems.length,
      allPhysicalSourceHashesVerified: cleanItems.every((item) => item.source.swf.physicalHashVerified),
    },
    lesson: {
      queueId: machineAudit.lesson.queueId,
      releaseId: machineAudit.lesson.releaseId,
      grade: 4,
      lesson: 3,
      activeXmlReferencedPages: 39,
      courseShells: 1,
      canonicalItems: 40,
    },
    archive: {
      root: ARCHIVE_ROOT_RELATIVE,
      ignoredByRule: ARCHIVE_IGNORE_RULE,
      maxArchiveBytes: plan.maxArchiveBytes,
      sourceAudioUnitReferenceCount: plan.candidateUnitCount,
      uniqueLogicalPayloadIdentityCount: plan.uniqueLogicalPayloadIdentityCount,
      logicalPayloadIdentitySetSha256: plan.logicalPayloadIdentitySetSha256,
      candidatePayloadBytes: plan.candidatePayloadBytes,
      plannedCasObjectCount: plan.plannedUniqueArchiveFileCount,
      plannedUniqueArchiveBytes: plan.plannedUniqueArchiveBytes,
      deduplicatedBytes: plan.deduplicatedBytes,
      preflightEligible: plan.eligible,
      disposition: archiveEstablished
        ? "content-addressed-archive-written-and-physically-verified"
        : (plan.eligible ? "inventory-only-by-explicit-option" : "inventory-only-preflight-cap-exceeded"),
      archiveWritten: archiveEstablished,
      archivedFileCount: archiveResult.fileCount,
      archivedBytes: archiveResult.bytes,
      allArchivedPayloadHashesVerified: archiveResult.allPhysicalHashesVerified,
      archiveSetSha256: archiveResult.archiveSetSha256,
      casObjects: plan.files.map((file) => ({
        path: file.path,
        sha256: file.sha256,
        byteLength: file.byteLength,
        formatCode: file.formatCode,
        sourceAudioUnitReferenceCount: file.referenceCount,
        logicalPayloadIdentityCount: file.logicalPayloadIdentitySha256s.size,
        logicalPayloadIdentitySha256s: [...file.logicalPayloadIdentitySha256s].sort(),
        physicalHashVerified: archiveEstablished,
      })),
    },
    summary: {
      canonicalItems: cleanItems.length,
      itemsWithAudioPayloads,
      itemsWithoutAudioPayloads: cleanItems.length - itemsWithAudioPayloads,
      defineSoundCount: defineSounds,
      soundStreamCount: soundStreams,
      soundStreamHeadCount: cleanItems.reduce((sum, item) => sum + item.embeddedAudio.tagCounts.SoundStreamHead, 0),
      soundStreamHead2Count: cleanItems.reduce((sum, item) => sum + item.embeddedAudio.tagCounts.SoundStreamHead2, 0),
      soundStreamBlockCount: soundStreamBlocks,
      audioUnitCount: defineSounds + soundStreams,
      sourceSetSha256: canonicalFingerprint(cleanItems.map((item) => ({
        animationId: item.animationId,
        path: item.source.swf.path,
        sha256: item.source.swf.observedSha256,
        bytes: item.source.swf.observedBytes,
      }))),
      itemSetSha256: canonicalFingerprint(cleanItems.map((item) => ({
        animationId: item.animationId,
        itemFingerprintSha256: item.itemFingerprintSha256,
      }))),
    },
    items: cleanItems,
  };
  return validateG4L3EmbeddedAudioArchive(report);
}

function validateArchiveUnit(unit, archive) {
  const formatCode = unit.kind === "DefineSound" ? unit.soundHeader.formatCode : unit.head.formatCode;
  invariant(Number.isSafeInteger(unit.payload.byteLength) && unit.payload.byteLength >= 0 &&
    /^[a-f0-9]{64}$/.test(unit.payload.sha256 || ""), "Invalid embedded-audio payload binding");
  invariant(unit.payload.plannedArchivePath === archiveRelativePath(unit.payload.sha256, formatCode),
    "Embedded-audio planned archive path is not content-addressed");
  invariant(unit.logicalPayloadIdentitySha256 === canonicalFingerprint(logicalPayloadIdentityProjection(unit)),
    "Embedded-audio logical payload identity is stale");
  invariant(unit.language?.classification === "unresolved" && unit.language.established === false &&
    unit.cueMappingEstablished === false && unit.runtimeSynchronizationEstablished === false,
  "Embedded-audio unit crossed language/cue/runtime boundaries");
  if (archive.archiveWritten) {
    invariant(unit.payload.archivePath === unit.payload.plannedArchivePath && unit.payload.archiveWritten === true &&
      unit.payload.physicalHashVerified === true, "Archived payload lacks physical verification");
  } else invariant(unit.payload.archivePath === null && unit.payload.archiveWritten === false &&
    unit.payload.physicalHashVerified === false, "Inventory-only payload claims archive evidence");
  if (unit.kind === "SoundStream") {
    invariant(unit.blockCount === unit.blocks.length, "SoundStream block count mismatch");
    let offset = 0;
    for (let index = 0; index < unit.blocks.length; index += 1) {
      const block = unit.blocks[index];
      invariant(block.blockIndex === index + 1 && block.payload.byteOffsetInStreamArchive === offset &&
        Number.isSafeInteger(block.payload.byteLength) && block.payload.byteLength >= 0 &&
        /^[a-f0-9]{64}$/.test(block.payload.sha256 || ""), "SoundStream block ordering/payload binding is invalid");
      offset += block.payload.byteLength;
      if (unit.head.formatCode === 2) invariant(block.codecWrapperHeader.byteLength === 4 &&
        Number.isSafeInteger(block.codecWrapperHeader.explicitSampleCount) &&
        Number.isSafeInteger(block.codecWrapperHeader.mp3SeekSamples), "MP3 SoundStreamBlock header is invalid");
    }
    invariant(offset === unit.payload.byteLength, "SoundStream block byte ranges do not cover the archive payload");
  } else if (unit.soundHeader.formatCode === 2) invariant(unit.codecWrapperHeader.byteLength === 2 &&
    Number.isSafeInteger(unit.codecWrapperHeader.mp3SeekSamples), "MP3 DefineSound SeekSamples header is invalid");
}

export function validateG4L3EmbeddedAudioArchive(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === "g4-l3-embedded-audio-archive",
    "G4 L3 embedded-audio report schema/type mismatch");
  invariant(report.generator?.path === "scripts/build-g4-l3-embedded-audio-archive.mjs" &&
    report.generator.version === SCHEMA_VERSION && report.generator.parserVersion === PARSER_VERSION &&
    /^[a-f0-9]{64}$/.test(report.generator.sha256 || ""), "Invalid generator binding");
  invariant(report.acceptance?.acceptanceNeutral === true, "Embedded-audio report must remain acceptance-neutral");
  for (const field of [
    "languageClassificationEstablished", "cueMappingEstablished", "runtimeSynchronizationEstablished",
    "listeningAcceptanceEstablished", "authoritativeRuntimeEstablished", "humanReviewEstablished",
    "ownerAcceptanceEstablished", "strictCompletionEstablished",
  ]) invariant(report.acceptance[field] === false, `acceptance.${field} must remain false`);
  for (const field of ["sourceAssetsChanged", "migrationsChanged", "productRenderersChanged", "approvalOrStatusChanges", "completionLedgerChanges"]) {
    invariant(report.acceptance[field] === 0, `acceptance.${field} must remain zero`);
  }
  invariant(report.lesson?.canonicalItems === 40 && report.lesson.activeXmlReferencedPages === 39 && report.lesson.courseShells === 1,
    "G4 L3 embedded-audio report must cover 39 pages plus one shell");
  invariant(report.sourceBindings?.allPhysicalSourceHashesVerified === true && report.sourceBindings.sourceCount === 40,
    "All 40 source SWF hashes must be physically verified");
  invariant(report.archive?.maxArchiveBytes <= DEFAULT_MAX_ARCHIVE_BYTES && report.archive.preflightEligible ===
    (report.archive.plannedUniqueArchiveBytes <= report.archive.maxArchiveBytes), "Archive preflight cap is invalid");
  invariant(report.archive.root === ARCHIVE_ROOT_RELATIVE && report.archive.ignoredByRule === ARCHIVE_IGNORE_RULE,
    "Archive root/ignore binding is invalid");
  if (report.archive.archiveWritten) invariant(report.archive.preflightEligible === true &&
    report.archive.archivedBytes === report.archive.plannedUniqueArchiveBytes &&
    report.archive.archivedFileCount === report.archive.plannedCasObjectCount &&
    report.archive.allArchivedPayloadHashesVerified === true && /^[a-f0-9]{64}$/.test(report.archive.archiveSetSha256 || ""),
  "Written archive lacks complete preflight/physical verification");
  else invariant(report.archive.archivedBytes === 0 && report.archive.archivedFileCount === 0 &&
    report.archive.allArchivedPayloadHashesVerified === false && report.archive.archiveSetSha256 === null,
  "Inventory-only report contains archived-payload claims");
  invariant(Array.isArray(report.items) && report.items.length === 40 &&
    new Set(report.items.map((item) => item.animationId)).size === 40, "Embedded-audio item set must contain 40 unique animations");
  for (const item of report.items) {
    invariant(item.source?.swf?.physicalHashVerified === true && item.source.swf.expectedSha256 === item.source.swf.observedSha256 &&
      item.source.swf.expectedBytes === item.source.swf.observedBytes, `${item.animationId}: source SWF physical binding is invalid`);
    invariant(Object.values(item.evidenceLimits || {}).every((value) => value === false),
      `${item.animationId}: embedded-audio evidence crossed an acceptance boundary`);
    for (const unit of [...item.embeddedAudio.defineSounds, ...item.embeddedAudio.soundStreams]) validateArchiveUnit(unit, report.archive);
    const copy = structuredClone(item);
    delete copy.itemFingerprintSha256;
    invariant(item.itemFingerprintSha256 === canonicalFingerprint(copy), `${item.animationId}: stale item fingerprint`);
  }
  const defineSounds = report.items.reduce((sum, item) => sum + item.embeddedAudio.defineSounds.length, 0);
  const streams = report.items.reduce((sum, item) => sum + item.embeddedAudio.soundStreams.length, 0);
  const blocks = report.items.reduce((sum, item) => sum + item.embeddedAudio.soundStreams
    .reduce((streamSum, stream) => streamSum + stream.blockCount, 0), 0);
  invariant(report.summary.defineSoundCount === defineSounds && report.summary.soundStreamCount === streams &&
    report.summary.soundStreamBlockCount === blocks && report.summary.audioUnitCount === defineSounds + streams,
  "Embedded-audio summary counts are stale");
  const units = report.items.flatMap((item) => [...item.embeddedAudio.defineSounds, ...item.embeddedAudio.soundStreams]);
  const logicalIdentities = [...new Set(units.map((unit) => unit.logicalPayloadIdentitySha256))].sort();
  invariant(report.archive.sourceAudioUnitReferenceCount === units.length &&
    report.archive.uniqueLogicalPayloadIdentityCount === logicalIdentities.length &&
    report.archive.logicalPayloadIdentitySetSha256 === canonicalFingerprint(logicalIdentities),
  "Audio reference/logical-identity counts are stale");
  invariant(Array.isArray(report.archive.casObjects) && report.archive.casObjects.length === report.archive.plannedCasObjectCount &&
    new Set(report.archive.casObjects.map((object) => object.path)).size === report.archive.casObjects.length &&
    report.archive.casObjects.reduce((sum, object) => sum + object.byteLength, 0) === report.archive.plannedUniqueArchiveBytes &&
    report.archive.casObjects.reduce((sum, object) => sum + object.sourceAudioUnitReferenceCount, 0) === units.length,
  "CAS object inventory is stale");
  for (const object of report.archive.casObjects) {
    invariant(object.path === archiveRelativePath(object.sha256, object.formatCode) &&
      /^[a-f0-9]{64}$/.test(object.sha256 || "") && Number.isSafeInteger(object.byteLength) && object.byteLength >= 0 &&
      object.physicalHashVerified === report.archive.archiveWritten &&
      object.logicalPayloadIdentityCount === object.logicalPayloadIdentitySha256s.length,
    "CAS object binding is invalid");
  }
  invariant(report.summary.itemSetSha256 === canonicalFingerprint(report.items.map((item) => ({
    animationId: item.animationId,
    itemFingerprintSha256: item.itemFingerprintSha256,
  }))), "Embedded-audio item-set fingerprint is stale");
  return report;
}

export function renderG4L3EmbeddedAudioArchiveMarkdown(report) {
  const rows = report.items.map((item) => {
    const defines = item.embeddedAudio.defineSounds.length;
    const streams = item.embeddedAudio.soundStreams.length;
    const blocks = item.embeddedAudio.soundStreams.reduce((sum, stream) => sum + stream.blockCount, 0);
    const payloadBytes = [...item.embeddedAudio.defineSounds, ...item.embeddedAudio.soundStreams]
      .reduce((sum, unit) => sum + unit.payload.byteLength, 0);
    return `| ${item.sequence} | ${item.batchId} | \`${item.animationId}\` | ${defines} | ${streams} | ${blocks} | ${payloadBytes} | ${item.source.swf.physicalHashVerified ? "yes" : "no"} |`;
  });
  return [
    "# G4 L3 Embedded-Audio Byte Archive",
    "",
    "> Acceptance-neutral source forensics only. Language, cue mapping, runtime synchronization, listening, human/owner approval, parity, and strict completion remain unresolved.",
    "",
    "## Result",
    "",
    `- Scope: ${report.summary.canonicalItems} canonical items (39 active pages + one shell); all ${report.sourceBindings.sourceCount} SWFs were physically rehashed.`,
    `- Parsed: ${report.summary.defineSoundCount} DefineSound records and ${report.summary.soundStreamCount} distinct SoundStream heads (${report.summary.soundStreamHeadCount} SoundStreamHead + ${report.summary.soundStreamHead2Count} SoundStreamHead2), containing ${report.summary.soundStreamBlockCount} ordered blocks.`,
    `- References and identities: ${report.archive.sourceAudioUnitReferenceCount} source audio-unit references resolve to ${report.archive.uniqueLogicalPayloadIdentityCount} logical payload structures and ${report.archive.plannedCasObjectCount} byte-identical CAS objects. Logical identity includes the codec/head and ordered block-wrapper layout; CAS identity is the archived payload SHA-256.`,
    `- Preflight: ${report.archive.plannedUniqueArchiveBytes} unique CAS bytes in ${report.archive.plannedCasObjectCount} content-addressed objects, below the ${report.archive.maxArchiveBytes} byte cap: ${report.archive.preflightEligible ? "yes" : "no"}.`,
    `- Disposition: ${report.archive.disposition}; archive-set SHA-256 \`${report.archive.archiveSetSha256 || "not-written"}\`.`,
    `- Payload handling: codec bytes were copied without decoding or recompression. MP3 DefineSound SeekSamples and every MP3 SoundStreamBlock sample-count/seek header remain explicit in the JSON report, together with source order, frame, tag header, byte range, and SHA-256.`,
    "",
    "A SoundStream is not a DefineSound: each stream is keyed by its own SoundStreamHead/Head2 and timeline domain, while its SoundStreamBlock payloads remain in exact source order with contiguous archive byte offsets.",
    "",
    "## Per-item inventory",
    "",
    "| # | Batch | Animation | DefineSound | Streams | Blocks | Payload bytes | SWF rehash |",
    "|---:|---|---|---:|---:|---:|---:|---|",
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

async function writeOrCheck(filePath, expected, {root, extension, check}) {
  const output = await assertSafeReportOutput(root, filePath, extension);
  if (check) {
    const observed = await readFile(output, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(observed === expected, `${filePath} is missing or stale`);
    return;
  }
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, expected);
}

export function parseArguments(argv) {
  const options = {
    check: false,
    inventoryOnly: false,
    maxArchiveBytes: DEFAULT_MAX_ARCHIVE_BYTES,
    jsonOutput: DEFAULT_JSON_RELATIVE,
    markdownOutput: DEFAULT_MARKDOWN_RELATIVE,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--inventory-only") options.inventoryOnly = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--max-archive-bytes", "--json-output", "--markdown-output"].includes(argument)) {
      const value = argv[++index];
      invariant(value, `${argument} requires a value`);
      if (argument === "--max-archive-bytes") {
        options.maxArchiveBytes = Number(value);
        invariant(Number.isSafeInteger(options.maxArchiveBytes) && options.maxArchiveBytes >= 0 &&
          options.maxArchiveBytes <= DEFAULT_MAX_ARCHIVE_BYTES,
        "--max-archive-bytes must be an integer from 0 through 1073741824");
      } else if (argument === "--json-output") options.jsonOutput = value;
      else options.markdownOutput = value;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(!(options.check && options.inventoryOnly), "--check cannot be combined with --inventory-only");
  return options;
}

function usage() {
  return `Usage: node scripts/build-g4-l3-embedded-audio-archive.mjs [options]\n\n` +
    `  --check                       Reparse sources and verify reports/archive byte-for-byte\n` +
    `  --inventory-only              Never write payload files, even when preflight passes\n` +
    `  --max-archive-bytes <0-1GiB>  Fail-open only to inventory when the bound is exceeded\n` +
    `  --json-output <reports/...>   JSON report path\n` +
    `  --markdown-output <reports/>  Markdown report path\n`;
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const report = await buildG4L3EmbeddedAudioArchive({
    maxArchiveBytes: options.maxArchiveBytes,
    inventoryOnly: options.inventoryOnly,
    allowArchiveWrites: !options.check,
  });
  const json = jsonText(report);
  const markdown = renderG4L3EmbeddedAudioArchiveMarkdown(report);
  await Promise.all([
    writeOrCheck(options.jsonOutput, json, {root: repositoryRoot, extension: ".json", check: options.check}),
    writeOrCheck(options.markdownOutput, markdown, {root: repositoryRoot, extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${report.summary.canonicalItems} G4 L3 SWFs; ` +
    `${report.summary.defineSoundCount} DefineSound; ${report.summary.soundStreamCount} streams; ` +
    `${report.summary.soundStreamBlockCount} blocks; ${report.archive.plannedUniqueArchiveBytes} unique payload bytes; ` +
    `strict effect none\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
