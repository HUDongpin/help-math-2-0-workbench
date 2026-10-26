#!/usr/bin/env node

import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'migrations/shared-alg001-l12-p005/audio-source-v1';
const receiptFile = path.join(root, base, 'machine-timing-receipt.json');
const mp3File = path.join(root, base, 'sprite-391-source-stream.mp3');
const analysisFile = path.join(root, base, 'timing-analysis-v1.json');
const receiptHash = 'c193f9856de277227e8ee6dbe3c97d714863c701398bc98854276e94baa4b639';
const mp3Hash = '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af';
const bitrateKbps = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const sampleRates = [44100, 48000, 32000];
const round = (value) => Number(value.toFixed(9));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function readPinnedFile(file, expectedHash, maxBytes) {
  const before = await lstat(file, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(), `${file} must be a physical file`);
  assert.equal(await realpath(file), file, `${file} must not traverse a symlink`);
  assert.ok(before.size <= BigInt(maxBytes), `${file} exceeds the diagnostic size bound`);
  const bytes = await readFile(file);
  const after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'mode']) {
    assert.equal(after[key], before[key], `${file} changed during read: ${key}`);
  }
  assert.equal(sha256(bytes), expectedHash, `${file} SHA-256 drift`);
  return bytes;
}

export function countMpeg1Layer3Frames(bytes) {
  const lengths = {};
  let frameCount = 0;
  let offset = 0;
  let sampleRateHz = null;
  let nominalBitrateBps = null;
  while (offset < bytes.length) {
    assert.ok(offset + 4 <= bytes.length, `truncated MP3 header at byte ${offset}`);
    const header = bytes.readUInt32BE(offset);
    assert.equal(header >>> 21, 0x7ff, `MP3 sync lost at byte ${offset}`);
    assert.equal((header >>> 19) & 3, 3, `non-MPEG1 frame at byte ${offset}`);
    assert.equal((header >>> 17) & 3, 1, `non-Layer-III frame at byte ${offset}`);
    const bitrate = bitrateKbps[(header >>> 12) & 15] * 1000;
    const rate = sampleRates[(header >>> 10) & 3];
    assert.ok(bitrate && rate, `invalid MP3 rate at byte ${offset}`);
    assert.equal((header >>> 6) & 3, 3, `non-mono MP3 frame at byte ${offset}`);
    const frameBytes = Math.floor(144 * bitrate / rate) + ((header >>> 9) & 1);
    assert.ok(offset + frameBytes <= bytes.length, `truncated MP3 frame at byte ${offset}`);
    sampleRateHz ??= rate;
    nominalBitrateBps ??= bitrate;
    assert.equal(rate, sampleRateHz, `sample-rate change at byte ${offset}`);
    assert.equal(bitrate, nominalBitrateBps, `bitrate change at byte ${offset}`);
    lengths[frameBytes] = (lengths[frameBytes] ?? 0) + 1;
    frameCount += 1;
    offset += frameBytes;
  }
  return {frameCount, sampleCount: frameCount * 1152, frameLengthBytes: lengths,
    sampleRateHz, nominalBitrateBps};
}

function inspectBlocks(receipt, bytes) {
  let nextOffset = 0;
  let totalFrames = 0;
  let totalSamples = 0;
  const sampleCountFrequencies = {};
  const groups = receipt.blockGroups.map((group) => ({...group, mp3Frames: 0, samples: 0,
    payloadBytes: 0}));
  for (const block of receipt.blocks) {
    assert.equal(block.payloadOffset, nextOffset, `noncontiguous block ${block.blockIndex}`);
    const payload = bytes.subarray(nextOffset, nextOffset + block.payloadBytes);
    assert.equal(payload.length, block.payloadBytes, `truncated block ${block.blockIndex}`);
    assert.equal(sha256(payload), block.payloadSha256, `block ${block.blockIndex} hash drift`);
    const parsed = countMpeg1Layer3Frames(payload);
    assert.equal(parsed.sampleCount, block.sampleCount,
      `block ${block.blockIndex} MP3 frames disagree with SWF sample header`);
    const group = groups.find((item) => block.localFrame >= item.firstFrame && block.localFrame <= item.lastFrame);
    assert.ok(group, `block ${block.blockIndex} outside reported groups`);
    group.mp3Frames += parsed.frameCount;
    group.samples += parsed.sampleCount;
    group.payloadBytes += block.payloadBytes;
    totalFrames += parsed.frameCount;
    totalSamples += block.sampleCount;
    sampleCountFrequencies[block.sampleCount] = (sampleCountFrequencies[block.sampleCount] ?? 0) + 1;
    nextOffset += block.payloadBytes;
  }
  assert.equal(nextOffset, bytes.length);
  assert.equal(totalSamples, receipt.totalBlockHeaderSampleCount);
  return {totalFrames, totalSamples, sampleCountFrequencies, groups};
}

async function probeDecodedFrames(file) {
  const {stdout} = await run('ffprobe', ['-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels,bit_rate,duration:format=duration,size,bit_rate:frame=nb_samples',
    '-show_frames', '-of', 'json', file], {maxBuffer: 2 * 1024 * 1024});
  const probe = JSON.parse(stdout);
  assert.equal(probe.streams?.length, 1);
  assert.equal(probe.streams[0].codec_name, 'mp3');
  const samples = probe.frames.map((frame) => Number(frame.nb_samples));
  assert.ok(samples.every((count) => Number.isSafeInteger(count) && count > 0));
  return {frameCount: samples.length, sampleCount: samples.reduce((sum, count) => sum + count, 0),
    sampleRateHz: Number(probe.streams[0].sample_rate), channels: probe.streams[0].channels,
    nominalBitrateBps: Number(probe.streams[0].bit_rate),
    streamDurationSeconds: Number(probe.streams[0].duration),
    formatDurationSeconds: Number(probe.format.duration), bytes: Number(probe.format.size)};
}

export async function analyzeG678AlgL12P005Mp3Timing() {
  const receiptBytes = await readPinnedFile(receiptFile, receiptHash, 2 * 1024 * 1024);
  const mp3Bytes = await readPinnedFile(mp3File, mp3Hash, 2 * 1024 * 1024);
  const receipt = JSON.parse(receiptBytes);
  assert.equal(receipt.animationId, 'shared-alg001-l12-p005');
  assert.equal(receipt.extraction.sha256, mp3Hash);
  assert.equal(receipt.domain.id, 'sprite-391');
  assert.equal(receipt.blockCount, 902);
  assert.equal(receipt.blocks.length, receipt.blockCount);
  const bitstream = countMpeg1Layer3Frames(mp3Bytes);
  const blocks = inspectBlocks(receipt, mp3Bytes);
  const decoded = await probeDecodedFrames(mp3File);
  assert.equal(bitstream.frameCount, blocks.totalFrames);
  assert.equal(bitstream.sampleCount, blocks.totalSamples);
  assert.equal(decoded.frameCount, bitstream.frameCount);
  assert.equal(decoded.sampleCount, bitstream.sampleCount);
  assert.equal(decoded.sampleRateHz, bitstream.sampleRateHz);
  assert.equal(decoded.channels, 1);
  assert.equal(decoded.nominalBitrateBps, bitstream.nominalBitrateBps);
  assert.equal(decoded.bytes, mp3Bytes.length);
  const byteRateEstimate = mp3Bytes.length * 8 / bitstream.nominalBitrateBps;
  assert.equal(decoded.formatDurationSeconds, byteRateEstimate);
  assert.equal(decoded.streamDurationSeconds, byteRateEstimate);
  const gap = receipt.missingBlockIntervals[0];
  assert.deepEqual({firstFrame: gap.firstFrame, lastFrame: gap.lastFrame, frameCount: gap.frameCount},
    {firstFrame: 340, lastFrame: 383, frameCount: 44});
  const beforeGap = receipt.blocks.find((block) => block.localFrame === 339);
  const afterGap = receipt.blocks.find((block) => block.localFrame === 384);
  assert.equal(beforeGap.payloadBytes, 0);
  assert.equal(beforeGap.sampleCount, 0);
  assert.equal(afterGap.payloadOffset, blocks.groups[0].payloadBytes);
  return {
    schemaVersion: 1,
    animationId: receipt.animationId,
    status: 'source-bound-machine-diagnostic-only',
    inputs: {receipt: {path: path.relative(root, receiptFile), sha256: receiptHash},
      mp3: {path: path.relative(root, mp3File), bytes: mp3Bytes.length, sha256: mp3Hash}},
    swfBlocks: {count: receipt.blockCount, sampleCount: blocks.totalSamples,
      sampleCountFrequencies: blocks.sampleCountFrequencies},
    mp3Frames: {count: bitstream.frameCount, samplesPerFrame: 1152,
      sampleCount: bitstream.sampleCount, frameLengthBytes: bitstream.frameLengthBytes,
      sampleRateHz: bitstream.sampleRateHz, nominalBitrateBps: bitstream.nominalBitrateBps,
      decodedFrameCount: decoded.frameCount, decodedSampleCount: decoded.sampleCount,
      decodedDurationSeconds: round(decoded.sampleCount / decoded.sampleRateHz)},
    ffprobeDuration: {streamSeconds: decoded.streamDurationSeconds,
      formatSeconds: decoded.formatDurationSeconds,
      nominalBitrateByteEstimateSeconds: round(byteRateEstimate),
      deltaFromDecodedSeconds: round(decoded.sampleCount / decoded.sampleRateHz - byteRateEstimate),
      actualAverageBitrateBps: round(mp3Bytes.length * 8 / (decoded.sampleCount / decoded.sampleRateHz))},
    sourceGap: {firstMissingFrame: gap.firstFrame, lastMissingFrame: gap.lastFrame,
      missingFrameCount: gap.frameCount, nominalFrameDurationSeconds: round(gap.frameCount / 12),
      precedingBlock: {localFrame: beforeGap.localFrame, sampleCount: beforeGap.sampleCount,
        signedSeekSamples: beforeGap.signedSeekSamples, payloadBytes: beforeGap.payloadBytes},
      followingBlock: {localFrame: afterGap.localFrame, sampleCount: afterGap.sampleCount,
        payloadOffset: afterGap.payloadOffset, payloadBytes: afterGap.payloadBytes},
      groups: blocks.groups,
      extractedPayloadsAreByteAdjacent: true},
    interpretation: {
      duration: 'ffprobe 74.698 is the 597584-byte file size at nominal 64000 bit/s; frame and decoder sample counts agree at 75.049795918 seconds',
      gap: 'no SoundStreamBlock on sprite-391 frames 340-383; concatenated extracted MP3 has no inserted time gap; runtime stop, silence, and resumption semantics remain unverified',
      limits: 'no persisted PCM, listening, original-runtime observation, synchronization, language, or audio acceptance',
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== '--check') {
    console.error('Usage: node scripts/analyze-g678-alg-l12-p005-mp3-timing.mjs --check');
    process.exitCode = 2;
  } else {
    analyzeG678AlgL12P005Mp3Timing().then(async (result) => {
      const expected = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
      const current = await readFile(analysisFile);
      assert.ok(current.equals(expected), 'timing-analysis-v1.json differs from diagnostic');
      console.log(JSON.stringify({status: 'PASS', decodedSampleCount: result.mp3Frames.decodedSampleCount,
        sourceGapFrames: result.sourceGap.missingFrameCount}));
    }).catch((error) => { console.error(error.message); process.exitCode = 1; });
  }
}
