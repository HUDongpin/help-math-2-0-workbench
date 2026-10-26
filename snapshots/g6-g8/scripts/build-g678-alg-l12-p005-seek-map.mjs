#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'migrations/shared-alg001-l12-p005/audio-source-v1');
const receiptSha = 'c193f9856de277227e8ee6dbe3c97d714863c701398bc98854276e94baa4b639';
const mp3Sha = '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

/** Structural arithmetic only. This does not resolve continuous-play or seek semantics. */
export function deriveP005SeekMap(receipt, payload) {
  assert.equal(receipt.animationId, 'shared-alg001-l12-p005');
  assert.equal(receipt.source.sha256, 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  assert.equal(receipt.domain.id, 'sprite-391');
  assert.equal(receipt.domain.declaredFrames, 968);
  assert.equal(receipt.domain.fpsNumerator, 12);
  assert.equal(receipt.domain.fpsDenominator, 1);
  assert.equal(receipt.streamHead.sampleRateHz, 44100);
  assert.equal(receipt.streamHead.mp3LatencySeek, 1695);
  assert.equal(receipt.streamHead.nominalSamplesPerBlock, 3675);
  assert.equal(receipt.blocks.length, 902);
  assert.equal(hash(payload), mp3Sha);
  let decodedBefore = 0, nextByte = 0, previousFrame = 0;
  const runs = [], zeroBlocks = [], absentFrames = [];
  for (const block of receipt.blocks) {
    const frame = block.localFrame;
    assert.ok(Number.isSafeInteger(frame) && frame > previousFrame && frame <= 968, 'frame order');
    for (let missing = previousFrame + 1; missing < frame; missing++) absentFrames.push(missing);
    assert.ok(Number.isSafeInteger(block.sampleCount) && block.sampleCount >= 0, 'sample count');
    assert.ok(Number.isSafeInteger(block.signedSeekSamples) && block.signedSeekSamples >= -32768 && block.signedSeekSamples <= 32767, 'signed seek');
    assert.equal(block.payloadOffset, nextByte, 'payload offset');
    const bytes = payload.subarray(nextByte, nextByte + block.payloadBytes);
    assert.equal(bytes.length, block.payloadBytes, 'payload length');
    assert.equal(hash(bytes), block.payloadSha256, 'block hash');
    const coordinate = decodedBefore + block.signedSeekSamples;
    if (block.sampleCount === 0) {
      assert.equal(block.payloadBytes, 0, 'zero block payload');
      zeroBlocks.push({frame, decodedBefore, signedSeekSamples: block.signedSeekSamples,
        rawSeekCoordinate: coordinate, payloadOffset: nextByte});
    } else {
      assert.ok(block.payloadBytes > 0, 'nonzero block payload');
      const intercept = coordinate - (frame - 1) * 3675;
      const previous = runs.at(-1);
      if (previous && previous.lastFrame + 1 === frame && previous.interceptSamples === intercept) {
        previous.lastFrame = frame; previous.blockCount++;
      } else runs.push({firstFrame: frame, lastFrame: frame, blockCount: 1, interceptSamples: intercept});
    }
    decodedBefore += block.sampleCount; nextByte += block.payloadBytes; previousFrame = frame;
  }
  assert.equal(nextByte, payload.length);
  assert.equal(decodedBefore, 3309696);
  assert.equal(previousFrame, 968);
  return {schemaVersion: 1, animationId: receipt.animationId,
    status: 'structural-seek-coordinates-not-playback-clock',
    sourceSha256: receipt.source.sha256, receiptSha256: receiptSha, payloadSha256: mp3Sha,
    domain: 'sprite-391', frameCount: 968, sampleRate: 44100, samplesPerVisualFrame: 3675,
    headerLatencySeek: 1695, decodedSampleCount: decodedBefore,
    coordinateRule: 'sum of preceding SampleCount fields + signed SeekSamples; no added latency, trim, silence or playback policy',
    positiveBlockRuns: runs, zeroBlocks, absentFrameIntervals: intervals(absentFrames),
    playbackEnabled: false, synchronizationAccepted: false};
}

function intervals(frames) {
  const result = [];
  for (const frame of frames) {
    const last = result.at(-1);
    if (last && last.lastFrame + 1 === frame) last.lastFrame = frame;
    else result.push({firstFrame: frame, lastFrame: frame});
  }
  return result;
}

/** Absence and zero samples remain distinguishable; neither is labeled silence. */
export function p005SeekObservation(map, frame) {
  assert.ok(Number.isSafeInteger(frame) && frame >= 1 && frame <= map.frameCount, 'frame outside domain');
  const zero = map.zeroBlocks.find(item => item.frame === frame);
  if (zero) return {kind: 'zero-sample-block', ...zero};
  const run = map.positiveBlockRuns.find(item => frame >= item.firstFrame && frame <= item.lastFrame);
  if (run) return {kind: 'positive-sample-block', frame,
    rawSeekCoordinate: (frame - 1) * map.samplesPerVisualFrame + run.interceptSamples};
  assert.ok(map.absentFrameIntervals.some(item => frame >= item.firstFrame && frame <= item.lastFrame), 'unaccounted frame');
  return {kind: 'no-stream-block', frame, rawSeekCoordinate: null};
}

async function pinned(file, expected) {
  const stat = await lstat(file, {bigint: true});
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size < 2n * 1024n * 1024n);
  assert.equal(await realpath(file), file);
  const bytes = await readFile(file), after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs']) assert.equal(after[key], stat[key]);
  assert.equal(hash(bytes), expected, 'pinned input drift');
  return bytes;
}

export async function buildP005SeekMap(check = true) {
  const receipt = JSON.parse(await pinned(path.join(base, 'machine-timing-receipt.json'), receiptSha));
  const payload = await pinned(path.join(base, 'sprite-391-source-stream.mp3'), mp3Sha);
  const result = deriveP005SeekMap(receipt, payload);
  const file = path.join(base, 'seek-map-v1.json');
  const bytes = Buffer.from(JSON.stringify(result, null, 2) + '\n');
  assert.equal(await realpath(base), base);
  if (check) assert.ok((await readFile(file)).equals(bytes), 'seek map drift');
  else await writeFile(file, bytes, {flag: 'wx'});
  return {path: path.relative(root, file), sha256: hash(bytes), bytes: bytes.length, result};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'Usage: --write|--check');
  buildP005SeekMap(process.argv[2] === '--check').then(({result, ...receipt}) => console.log(JSON.stringify(receipt)))
    .catch(error => {console.error(error.message); process.exitCode = 1;});
}
