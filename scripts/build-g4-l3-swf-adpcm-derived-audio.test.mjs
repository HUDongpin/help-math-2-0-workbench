import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile} from "node:fs/promises";
import test from "node:test";

import {
  collectAdpcmReferences,
  normalizeDerivedWaveProbe,
  parseArguments,
  renderG4L3SwfAdpcmDerivedAudioMarkdown,
  validateG4L3SwfAdpcmDerivedAudio,
} from "./build-g4-l3-swf-adpcm-derived-audio.mjs";
import {
  SWF_ADPCM_INDEX_TABLES,
  SWF_ADPCM_STEP_SIZE_TABLE,
  decodeSwfAdpcmBlocks,
  decodeSwfAdpcmSoundData,
  encodePcm16LeWav,
} from "./lib/swf-adpcm.mjs";

const SOURCE_SHA256 = "e5c99e029d9df7717bc7755b5f4660841ad3f453d10bb8dbc8010d69b5a653b6";
const SOURCE_URL = new URL(`../artifacts/g4-l3-embedded-audio/sha256/e5/${SOURCE_SHA256}.bin`, import.meta.url);
const ARCHIVE_REPORT_URL = new URL("../reports/g4-l3-embedded-audio-archive.json", import.meta.url);
const REPORT_URL = new URL("../reports/g4-l3-swf-adpcm-derived-audio.json", import.meta.url);
const MARKDOWN_URL = new URL("../reports/g4-l3-swf-adpcm-derived-audio.md", import.meta.url);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function unsignedBits(value, width) {
  assert(Number.isSafeInteger(value) && value >= 0 && value < (2 ** width));
  return value.toString(2).padStart(width, "0");
}

function signedBits(value, width) {
  const unsigned = value < 0 ? (2 ** width) + value : value;
  return unsignedBits(unsigned, width);
}

function packedBits(bits) {
  const padded = bits.padEnd(Math.ceil(bits.length / 8) * 8, "0");
  return Buffer.from(Array.from({length: padded.length / 8}, (_, index) =>
    Number.parseInt(padded.slice(index * 8, (index + 1) * 8), 2)));
}

function fixtureMonoBlock({codeSizeBits, initialSample, initialIndex, codes}) {
  return packedBits(
    unsignedBits(codeSizeBits - 2, 2) +
    signedBits(initialSample, 16) +
    unsignedBits(initialIndex, 6) +
    codes.map((code) => unsignedBits(code, codeSizeBits)).join(""),
  );
}

test("pure decoder follows MSB-packed SWF ADPCM predictor/index behavior", () => {
  assert.equal(SWF_ADPCM_STEP_SIZE_TABLE.length, 89);
  assert.deepEqual(SWF_ADPCM_INDEX_TABLES[5], [-1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16]);
  const bytes = fixtureMonoBlock({codeSizeBits: 4, initialSample: 0, initialIndex: 0, codes: [0, 1, 7, 8, 15]});
  const decoded = decodeSwfAdpcmSoundData(bytes, {channels: 1, sampleCountPerChannel: 6});
  assert.deepEqual([...decoded.pcm16], [0, 0, 1, 12, 10, -15]);
  assert.equal(decoded.codeSizeBits, 4);
  assert.equal(decoded.packetCount, 1);
  assert.equal(decoded.paddingValue, 0);
});

test("decoder rejects a non-zero terminal padding bit", () => {
  const bytes = fixtureMonoBlock({codeSizeBits: 5, initialSample: 0, initialIndex: 0, codes: [1]});
  bytes[bytes.length - 1] |= 1;
  assert.throws(
    () => decodeSwfAdpcmSoundData(bytes, {channels: 1, sampleCountPerChannel: 2}),
    /terminal padding must be zero/,
  );
});

test("G4 L3 CAS is decoded as 13 independent 290-byte blocks, not one continuous record", async () => {
  const [source, archiveReport] = await Promise.all([
    readFile(SOURCE_URL),
    readFile(ARCHIVE_REPORT_URL, "utf8").then(JSON.parse),
  ]);
  assert.equal(source.length, 3770);
  assert.equal(digest(source), SOURCE_SHA256);
  const references = collectAdpcmReferences(archiveReport);
  assert.equal(references.length, 4);
  const blocks = references[0].stream.blocks.map((block, index) => {
    assert.equal(block.byteOffsetInStreamArchive, index * 290);
    assert.equal(block.byteLength, 290);
    const bytes = source.subarray(index * 290, (index + 1) * 290);
    assert.equal(digest(bytes), block.sha256);
    return {bytes, sampleCountPerChannel: 459};
  });
  const decoded = decodeSwfAdpcmBlocks(blocks, {channels: 1});
  assert.equal(decoded.blockCount, 13);
  assert.equal(decoded.sampleCountPerChannel, 5967);
  assert.deepEqual(decoded.decodedBlocks.map((block) => block.codeSizeBits), Array(13).fill(5));
  assert.deepEqual(decoded.decodedBlocks.map((block) => block.paddingBitCount), Array(13).fill(6));
  assert.deepEqual(decoded.decodedBlocks.map((block) => block.packets[0].initialSamples[0]),
    [0, 0, 0, 0, 0, 0, -256, -2304, -6144, -1024, 1536, 512, 0]);
  assert.deepEqual(decoded.decodedBlocks.map((block) => block.packets[0].initialIndices[0]),
    [0, 0, 0, 0, 0, 38, 59, 56, 63, 61, 62, 38, 0]);
  const wav = encodePcm16LeWav(decoded.pcm16, {sampleRateHz: 5512, channels: 1});
  assert.equal(wav.length, 11978);
  assert.equal(digest(wav.subarray(44)), "2fdcd846d6b0f1b99b8d77111a4b5cb58cb1119f76c9b50147d3bf1804548a33");
  assert.equal(digest(wav), "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8");
});

test("checked report and physical WAV bind source, tools, and closed acceptance gates", async () => {
  const [json, markdown] = await Promise.all([readFile(REPORT_URL, "utf8"), readFile(MARKDOWN_URL, "utf8")]);
  const report = validateG4L3SwfAdpcmDerivedAudio(JSON.parse(json));
  assert.equal(markdown, renderG4L3SwfAdpcmDerivedAudioMarkdown(report));
  assert.equal(report.summary.independentlyDecodedBlockCount, 13);
  assert.equal(report.summary.decodedSampleCountPerChannel, 5967);
  assert.equal(report.derivedArtifact.sampleRateHz, 5512);
  assert.equal(report.acceptance.independentDecoderPcmEqualityEstablished, false);
  assert.equal(report.technicalValidation.noPlaybackOrListeningPerformed, true);
  assert.equal(report.technicalValidation.independentFfdecOrOriginalDecoderPcmEqualityEstablished, false);
  const artifactUrl = new URL(`../${report.derivedArtifact.path}`, import.meta.url);
  const [artifactBytes, information] = await Promise.all([readFile(artifactUrl), lstat(artifactUrl)]);
  assert.equal(digest(artifactBytes), report.derivedArtifact.sha256);
  assert.equal(information.mode & 0o777, 0o444);
});

test("report validator rejects authority promotion and framing/sample drift", async () => {
  const source = JSON.parse(await readFile(REPORT_URL, "utf8"));
  const cases = [
    [(report) => { report.acceptance.languageEstablished = true; }, /must remain false/],
    [(report) => { report.acceptance.independentDecoderPcmEqualityEstablished = true; }, /must remain false/],
    [(report) => { report.technicalValidation.independentFfdecOrOriginalDecoderPcmEqualityEstablished = true; }, /technical validation is invalid/],
    [(report) => { report.decodeContract.blockCount = 1; }, /decode contract is invalid/],
    [(report) => { report.derivedArtifact.sampleRateHz = 5500; }, /artifact binding is invalid/],
  ];
  for (const [mutate, pattern] of cases) {
    const report = structuredClone(source);
    mutate(report);
    assert.throws(() => validateG4L3SwfAdpcmDerivedAudio(report), pattern);
  }
});

test("ffprobe normalizer and CLI expose only technical build/check operations", () => {
  const normalized = normalizeDerivedWaveProbe({
    streams: [{index: 0, codec_type: "audio", codec_name: "pcm_s16le", codec_long_name: "PCM", sample_fmt: "s16", sample_rate: "5512", channels: 1, bits_per_sample: 16, time_base: "1/5512", duration_ts: 5967}],
    format: {format_name: "wav", format_long_name: "WAV", duration: "1.082547", size: "11978", probe_score: 99},
    frames: [{nb_samples: 4096}, {nb_samples: 1871}],
  });
  assert.equal(normalized.decodedSampleCount, 5967);
  assert.equal(normalized.sampleRateHz, 5512);
  const options = parseArguments(["--check", "--ffprobe", "/tool/ffprobe", "--ffmpeg", "/tool/ffmpeg"]);
  assert.equal(options.check, true);
  assert.equal(options.ffprobeCommand, "/tool/ffprobe");
  assert.equal(options.ffmpegCommand, "/tool/ffmpeg");
  assert.throws(() => parseArguments(["--listen"]), /Unknown option/);
  assert.throws(() => parseArguments(["--accept"]), /Unknown option/);
});
