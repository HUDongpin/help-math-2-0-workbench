#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import {createGunzip} from "node:zlib";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const ANIMATION_ID = "course-g03-l06-ti-001";
const SOURCE_SWF = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf";
const SOURCE_SWF_SHA256 = "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739";
const SWFMILL_XML = `migrations/${ANIMATION_ID}/audit/machine/swfmill.xml.gz`;
const SWFMILL_XML_SHA256 = "65f12db57b8c694a119596134a44b1404826a30aaa24e1711e7bfe5a8188e5e1";
const PUBLIC_AUDIO_DIRECTORY = `public/flash-assets/courses/${ANIMATION_ID}/audio`;
const PUBLIC_MANIFEST = `${PUBLIC_AUDIO_DIRECTORY}/manifest.json`;
const AUDIT_RECEIPT = `migrations/${ANIMATION_ID}/audit/extracted-audio-assets.json`;

export const EXPECTED_STREAMS = Object.freeze([
  Object.freeze({
    streamIndex: 1,
    cueId: "embedded-stream-0001",
    characterId: 7,
    sourceInstanceName: "Mc_Sound_0",
    scenario: "sound-0",
    outputFile: "embedded-stream-0001.mp3",
    blockCount: 135,
    totalDecodedSamples: 247680,
    sampleRateHz: 22050,
    channels: 2,
    byteLength: 67080,
    sha256: "9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff",
  }),
  Object.freeze({
    streamIndex: 2,
    cueId: "embedded-stream-0002",
    characterId: 8,
    sourceInstanceName: "Mc_Sound_1",
    scenario: "sound-1",
    outputFile: "embedded-stream-0002.mp3",
    blockCount: 135,
    totalDecodedSamples: 247680,
    sampleRateHz: 22050,
    channels: 2,
    byteLength: 67080,
    sha256: "d90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420",
  }),
]);

function usage() {
  return `Usage: node scripts/extract-ti-soundstreams.mjs [options]

Options:
  --project-root <path>  Project root (default: repository root)
  --check                Verify the exact generated MP3 bytes and receipts
  --json                 Print a JSON summary
  -h, --help             Show this help

This deterministic extractor removes only the four-byte SWF MP3 SoundStreamBlock
header (sample count + seek samples) and concatenates the original MP3 payloads.
It never edits source-assets and never classifies spoken language, accepts audio,
or changes migration/review status.`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseAttributes(line) {
  const attributes = {};
  for (const match of line.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) attributes[match[1]] = match[2];
  return attributes;
}

function integer(value, label) {
  if (!/^-?\d+$/.test(String(value ?? ""))) throw new Error(`${label} is not an integer`);
  return Number(value);
}

export async function extractMp3SoundStreams(xmlGzipPath, characterIds) {
  const wanted = new Set(characterIds);
  const streams = new Map(characterIds.map((characterId) => [characterId, {
    characterId,
    head: null,
    blocks: [],
    totalDecodedSamples: 0,
    seekSamples: [],
  }]));
  const contexts = [];
  let pendingBlock = null;
  const lines = createInterface({input: createReadStream(xmlGzipPath).pipe(createGunzip()), crlfDelay: Infinity});
  for await (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("<DefineSprite ")) {
      contexts.push(integer(parseAttributes(line).objectID, "DefineSprite.objectID"));
      continue;
    }
    if (line === "</DefineSprite>") {
      contexts.pop();
      continue;
    }
    const characterId = contexts.at(-1);
    if (!wanted.has(characterId)) continue;
    const stream = streams.get(characterId);
    if (/^<SoundStreamHead2?\s/.test(line)) {
      if (stream.head) throw new Error(`sprite-${characterId} contains multiple SoundStreamHead tags`);
      stream.head = parseAttributes(line);
    } else if (line === "<SoundStreamBlock>") {
      pendingBlock = characterId;
    } else if (pendingBlock === characterId && line.startsWith("<data>") && line.endsWith("</data>")) {
      const block = Buffer.from(line.slice(6, -7), "base64");
      if (block.length < 4) throw new Error(`sprite-${characterId} contains a short MP3 SoundStreamBlock`);
      const sampleCount = block.readUInt16LE(0);
      const seekSamples = block.readInt16LE(2);
      stream.totalDecodedSamples += sampleCount;
      stream.seekSamples.push(seekSamples);
      stream.blocks.push(block);
      pendingBlock = null;
    }
  }
  if (contexts.length) throw new Error("swfmill XML ended inside DefineSprite");
  return new Map([...streams].map(([characterId, stream]) => [characterId, {
    ...stream,
    mp3: Buffer.concat(stream.blocks.map((block) => block.subarray(4))),
  }]));
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function assertHash(candidate, expected, label) {
  const bytes = await readFile(candidate);
  const observed = digest(bytes);
  if (observed !== expected) throw new Error(`${label} SHA-256 ${observed} differs from ${expected}`);
  return bytes;
}

function validateStream(stream, expected) {
  if (!stream.head) throw new Error(`sprite-${expected.characterId} has no SoundStreamHead`);
  if (integer(stream.head.compression, "compression") !== 2) throw new Error(`sprite-${expected.characterId} is not MP3 compression=2`);
  if (integer(stream.head.soundRate, "soundRate") !== 2 || integer(stream.head.playbackRate, "playbackRate") !== 2) {
    throw new Error(`sprite-${expected.characterId} is not source/playback rate code 2 (22050 Hz)`);
  }
  if (integer(stream.head.soundStereo, "soundStereo") !== 1 || integer(stream.head.playbackStereo, "playbackStereo") !== 1) {
    throw new Error(`sprite-${expected.characterId} is not stereo`);
  }
  if (stream.blocks.length !== expected.blockCount) throw new Error(`sprite-${expected.characterId} block count ${stream.blocks.length} differs from ${expected.blockCount}`);
  if (stream.totalDecodedSamples !== expected.totalDecodedSamples) throw new Error(`sprite-${expected.characterId} decoded sample count differs`);
  if (stream.mp3.length !== expected.byteLength || digest(stream.mp3) !== expected.sha256) throw new Error(`sprite-${expected.characterId} extracted MP3 bytes differ from the reviewed source result`);
  if (!(stream.mp3[0] === 0xff && (stream.mp3[1] & 0xe0) === 0xe0)) throw new Error(`sprite-${expected.characterId} does not begin with an MP3 sync word`);
}

function buildRecords({scriptSha256, streams}) {
  const assets = EXPECTED_STREAMS.map((expected) => {
    const stream = streams.get(expected.characterId);
    return {
      cueId: expected.cueId,
      streamIndex: expected.streamIndex,
      sourceCharacterId: expected.characterId,
      sourceTimelineId: `sprite-${expected.characterId}`,
      sourceInstanceName: expected.sourceInstanceName,
      sourceScenario: expected.scenario,
      output: `${PUBLIC_AUDIO_DIRECTORY}/${expected.outputFile}`,
      sha256: expected.sha256,
      byteLength: expected.byteLength,
      blockCount: expected.blockCount,
      totalDecodedSamples: expected.totalDecodedSamples,
      decodedSampleDurationMs: Math.round(expected.totalDecodedSamples / expected.sampleRateHz * 1000),
      sampleRateHz: expected.sampleRateHz,
      channels: expected.channels,
      format: "mp3",
      extraction: "concatenated original SoundStreamBlock payload bytes after each four-byte MP3 stream header",
      seekSamples: {minimum: Math.min(...stream.seekSamples), maximum: Math.max(...stream.seekSamples)},
      spokenLanguage: "undetermined-pending-authorized-runtime-listening",
      strictAcceptanceEffect: "none",
    };
  });
  const common = {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    source: {swf: SOURCE_SWF, swfSha256: SOURCE_SWF_SHA256},
    structuralEvidence: {path: SWFMILL_XML, sha256: SWFMILL_XML_SHA256},
    generatedBy: {script: "scripts/extract-ti-soundstreams.mjs", sha256: scriptSha256},
    assets,
    authority: "Byte-exact extraction evidence only; spoken language/content, audible quality, runtime start/stop synchronization, Replay, human listening, and owner acceptance remain unresolved.",
    strictAcceptanceEffect: "none",
  };
  const publicManifest = {
    ...common,
    assetType: "extracted-swf-mp3-soundstreams",
    status: "byte-exact-extracted-assets",
  };
  const publicManifestText = jsonText(publicManifest);
  const auditReceipt = {
    ...common,
    evidenceType: "extracted-swf-audio-assets",
    status: "byte-exact-extraction-complete-listening-pending",
    generatedAssetManifest: {path: PUBLIC_MANIFEST, sha256: digest(Buffer.from(publicManifestText))},
    unresolved: [
      "Both streams require authorized original-runtime listening to classify spoken language and content.",
      "Natural random outcome observation and parent/child audio tick phase remain unverified.",
      "Frame-5 start, frame-137 removal/stop, completion, Replay, and language-host routing require authoritative runtime and human evidence.",
    ],
  };
  return {assets, publicManifestText, auditReceiptText: jsonText(auditReceipt)};
}

export function parseArguments(argumentsList) {
  const options = {projectRoot: repositoryRoot, check: false, json: false, help: false};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--project-root") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error("--project-root requires a value");
      options.projectRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export async function extractTiSoundStreams(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || repositoryRoot);
  const sourcePath = path.join(projectRoot, SOURCE_SWF);
  const xmlPath = path.join(projectRoot, SWFMILL_XML);
  const scriptBytes = await readFile(scriptPath);
  await Promise.all([
    assertHash(sourcePath, SOURCE_SWF_SHA256, "source SWF"),
    assertHash(xmlPath, SWFMILL_XML_SHA256, "swfmill XML evidence"),
  ]);
  const streams = await extractMp3SoundStreams(xmlPath, EXPECTED_STREAMS.map(({characterId}) => characterId));
  for (const expected of EXPECTED_STREAMS) validateStream(streams.get(expected.characterId), expected);
  const records = buildRecords({scriptSha256: digest(scriptBytes), streams});
  const files = [
    ...EXPECTED_STREAMS.map((expected) => ({
      path: path.join(projectRoot, PUBLIC_AUDIO_DIRECTORY, expected.outputFile),
      expected: streams.get(expected.characterId).mp3,
      kind: "binary",
    })),
    {path: path.join(projectRoot, PUBLIC_MANIFEST), expected: records.publicManifestText, kind: "text"},
    {path: path.join(projectRoot, AUDIT_RECEIPT), expected: records.auditReceiptText, kind: "text"},
  ];
  const stale = [];
  for (const file of files) {
    const observed = await exists(file.path) ? await readFile(file.path) : null;
    const expected = Buffer.isBuffer(file.expected) ? file.expected : Buffer.from(file.expected);
    if (!observed || !observed.equals(expected)) stale.push(portable(path.relative(projectRoot, file.path)));
  }
  if (options.check && stale.length) throw new Error(`TI extracted audio assets are stale:\n${stale.join("\n")}`);
  if (!options.check) {
    await mkdir(path.join(projectRoot, PUBLIC_AUDIO_DIRECTORY), {recursive: true});
    for (const file of files) await writeFile(file.path, file.expected);
  }
  return {
    animationId: ANIMATION_ID,
    mode: options.check ? "check" : "write",
    streamCount: EXPECTED_STREAMS.length,
    totalBytes: EXPECTED_STREAMS.reduce((sum, stream) => sum + stream.byteLength, 0),
    outputs: files.map((file) => portable(path.relative(projectRoot, file.path))),
    spokenLanguage: "undetermined-pending-authorized-runtime-listening",
    strictAcceptanceEffect: "none",
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await extractTiSoundStreams(options);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else console.log(`${options.check ? "CHECK" : "EXTRACT"} ${result.animationId}: ${result.streamCount} streams, ${result.totalBytes} bytes; listening still pending`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

