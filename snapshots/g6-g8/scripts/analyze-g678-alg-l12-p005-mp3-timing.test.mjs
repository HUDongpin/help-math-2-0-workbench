import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {analyzeG678AlgL12P005Mp3Timing, countMpeg1Layer3Frames} from './analyze-g678-alg-l12-p005-mp3-timing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'migrations/shared-alg001-l12-p005/audio-source-v1';

test('P005 MP3 frames, decoded samples, source headers, and checked artifact agree', async () => {
  const actual = await analyzeG678AlgL12P005Mp3Timing();
  const saved = JSON.parse(await readFile(path.join(root, base, 'timing-analysis-v1.json')));
  assert.deepEqual(actual, saved);
  assert.equal(actual.swfBlocks.count, 902);
  assert.equal(actual.swfBlocks.sampleCount, 3309696);
  assert.equal(actual.mp3Frames.count, 2873);
  assert.equal(actual.mp3Frames.decodedSampleCount, 3309696);
  assert.deepEqual(actual.mp3Frames.frameLengthBytes, {'208': 2873});
  assert.equal(actual.ffprobeDuration.nominalBitrateByteEstimateSeconds, 74.698);
  assert.equal(actual.mp3Frames.decodedDurationSeconds, 75.049795918);
  assert.equal(actual.ffprobeDuration.deltaFromDecodedSeconds, 0.351795918);
  assert.deepEqual(actual.sourceGap.groups.map((group) => group.mp3Frames), [1006, 1867]);
  assert.equal(actual.sourceGap.missingFrameCount, 44);
  assert.equal(actual.sourceGap.precedingBlock.signedSeekSamples, -4080);
  assert.equal(actual.sourceGap.followingBlock.payloadOffset, 209248);
});

test('bounded frame parser rejects damaged sync and truncated source bytes', async () => {
  const source = await readFile(path.join(root, base, 'sprite-391-source-stream.mp3'));
  const parsed = countMpeg1Layer3Frames(source);
  assert.equal(parsed.frameCount, 2873);
  assert.equal(parsed.sampleCount, 3309696);
  const damaged = Buffer.from(source);
  damaged[0] = 0;
  assert.throws(() => countMpeg1Layer3Frames(damaged), /MP3 sync lost/);
  assert.throws(() => countMpeg1Layer3Frames(source.subarray(0, source.length - 1)),
    /truncated MP3 frame/);
});
