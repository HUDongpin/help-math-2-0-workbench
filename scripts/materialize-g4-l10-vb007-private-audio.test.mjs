import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXPECTED_VB007_AUDIO,
  materializeG4L10Vb007PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-vb007-private-audio.mjs';

test('VB007 materializer freezes only the nine product-reachable full embedded streams', () => {
  assert.deepEqual(
    EXPECTED_VB007_AUDIO.embedded.map(({characterId}) => characterId),
    [39, 73, 84, 96, 172, 122, 139, 160, 204],
  );
  assert.equal(EXPECTED_VB007_AUDIO.embedded.some(({characterId}) => characterId === 45), false);
  assert.equal(EXPECTED_VB007_AUDIO.embedded.some(({characterId}) => characterId === 203), false);
});

test('VB007 materializer binds the exact source-main continuation after the correct branch', () => {
  assert.deepEqual(EXPECTED_VB007_AUDIO.continuation, {
    id: 'main-continuation',
    role: 'correct-answer-main-timeline-continuation',
    sourceTimelineId: 'sprite-204',
    characterId: 204,
    sourceFirstFrame: 10,
    firstFrame: 62,
    lastFrame: 130,
    blockCount: 69,
    totalDecodedSamples: 126720,
    sampleRateHz: 22050,
    channels: 1,
    durationMs: 5747,
    bytes: 28600,
    sha256: '55aea0a63242d214a9b5b828347236971fc7083334da945d45e31507f2cb56b2',
    output: 'public/flash-assets/courses/course-g04-l10-vb-007/audio/main-continuation.mp3',
    publicPath: '/flash-assets/courses/course-g04-l10-vb-007/audio/main-continuation.mp3',
  });
});

test('VB007 materializer arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']).check, true);
  assert.throws(() => parseArguments(['--all-candidates']), /Unknown argument/);
});

test('VB007 materializer check revalidates every no-replace output', async () => {
  const result = await materializeG4L10Vb007PrivateAudio({check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 13);
});
