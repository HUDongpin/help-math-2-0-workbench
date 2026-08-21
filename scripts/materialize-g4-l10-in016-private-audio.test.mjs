import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXPECTED_IN016_AUDIO,
  materializeG4L10In016PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-in016-private-audio.mjs';

test('IN016 materializer freezes only the nine product-reachable embedded streams', () => {
  assert.deepEqual(
    EXPECTED_IN016_AUDIO.embedded.map(({characterId}) => characterId),
    [44, 78, 89, 101, 177, 127, 144, 165, 209],
  );
  assert.equal(EXPECTED_IN016_AUDIO.embedded.some(({characterId}) => characterId === 50), false);
  assert.equal(EXPECTED_IN016_AUDIO.embedded.some(({characterId}) => characterId === 208), false);
});

test('IN016 materializer arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']).check, true);
  assert.throws(() => parseArguments(['--all-candidates']), /Unknown argument/);
});

test('IN016 materializer check revalidates every no-replace output', async () => {
  const result = await materializeG4L10In016PrivateAudio({check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 12);
});
