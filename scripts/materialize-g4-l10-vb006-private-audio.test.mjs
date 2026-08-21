import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXPECTED_VB006_AUDIO,
  materializeG4L10Vb006PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-vb006-private-audio.mjs';

test('VB006 materializer freezes only the nine product-reachable full embedded streams', () => {
  assert.deepEqual(
    EXPECTED_VB006_AUDIO.embedded.map(({characterId}) => characterId),
    [36, 85, 41, 59, 119, 173, 159, 131, 213],
  );
  assert.equal(EXPECTED_VB006_AUDIO.embedded.some(({characterId}) => characterId === 73), false);
  assert.equal(EXPECTED_VB006_AUDIO.embedded.some(({characterId}) => characterId === 212), false);
});

test('VB006 materializer binds the exact source-main continuation after the correct branch', () => {
  assert.deepEqual(EXPECTED_VB006_AUDIO.continuation, {
    id: 'main-continuation',
    role: 'correct-answer-main-timeline-continuation',
    sourceTimelineId: 'sprite-213',
    characterId: 213,
    sourceFirstFrame: 9,
    firstFrame: 63,
    lastFrame: 104,
    blockCount: 42,
    totalDecodedSamples: 77184,
    sampleRateHz: 22050,
    channels: 1,
    durationMs: 3500,
    bytes: 17420,
    sha256: 'e643ab8bab5713139c7ffaf39afcfc6f8242b3a9772c5e6f8bfbc0bed1d7258f',
    output: 'public/flash-assets/courses/course-g04-l10-vb-006/audio/main-continuation.mp3',
    publicPath: '/flash-assets/courses/course-g04-l10-vb-006/audio/main-continuation.mp3',
  });
});

test('VB006 materializer arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']).check, true);
  assert.throws(() => parseArguments(['--all-candidates']), /Unknown argument/);
});

test('VB006 materializer check revalidates every no-replace output', async () => {
  const result = await materializeG4L10Vb006PrivateAudio({check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 13);
});
