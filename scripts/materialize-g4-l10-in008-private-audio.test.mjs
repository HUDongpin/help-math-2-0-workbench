import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXPECTED_IN008_AUDIO,
  materializeG4L10In008PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-in008-private-audio.mjs';

test('IN008 materializer freezes only the nine product-reachable full embedded streams', () => {
  assert.deepEqual(
    EXPECTED_IN008_AUDIO.embedded.map(({characterId}) => characterId),
    [45, 79, 90, 102, 178, 128, 145, 166, 210],
  );
  assert.equal(EXPECTED_IN008_AUDIO.embedded.some(({characterId}) => characterId === 51), false);
  assert.equal(EXPECTED_IN008_AUDIO.embedded.some(({characterId}) => characterId === 209), false);
});

test('IN008 materializer binds the gapped source-main continuation after the correct branch', () => {
  assert.equal(EXPECTED_IN008_AUDIO.continuation.sourceBlockStartIndex, 48);
  assert.deepEqual(EXPECTED_IN008_AUDIO.continuation.sourceBlockFrames, [
    {first: 53, last: 54},
    {first: 63, last: 129},
  ]);
  assert.equal(EXPECTED_IN008_AUDIO.continuation.blockCount, 69);
  assert.equal(EXPECTED_IN008_AUDIO.continuation.sha256, '741ba76391efe55455c13a556c5a239abcbb481c8968281b5ec532b478b272a1');
});

test('IN008 materializer arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']).check, true);
  assert.throws(() => parseArguments(['--all-candidates']), /Unknown argument/);
});

test('IN008 materializer check revalidates every no-replace output', async () => {
  const result = await materializeG4L10In008PrivateAudio({check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 13);
});
