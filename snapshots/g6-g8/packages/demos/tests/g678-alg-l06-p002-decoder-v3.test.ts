import assert from 'node:assert/strict';
import {test} from 'node:test';
import predecessor from '../src/modules/g678-alg-l06-p002-v2';
import successor, {P002_PCM_CHROME149, P002_PCM_CHROME153,
  p002DecodedPcmForUserAgent} from '../src/modules/g678-alg-l06-p002-decoder-v3';

test('P002 decoder successor selects only the measured Chromium 153 profile', () => {
  assert.equal(p002DecodedPcmForUserAgent('Chrome/149.0.7827.55'), P002_PCM_CHROME149);
  assert.equal(p002DecodedPcmForUserAgent('Chrome/153.0.0.0'), P002_PCM_CHROME153);
  assert.equal(p002DecodedPcmForUserAgent('Chrome/154.0.0.0'), P002_PCM_CHROME149);
  assert.equal(p002DecodedPcmForUserAgent('Firefox/153.0'), P002_PCM_CHROME149);
  assert.equal(p002DecodedPcmForUserAgent('NotChrome/153.0'), P002_PCM_CHROME149);
});

test('P002 decoder successor changes only the decoded PCM identity', () => {
  assert.equal(successor.key, predecessor.key);
  assert.equal(successor.privateTerminalSource.sourceAudioBase64,
    predecessor.privateTerminalSource.sourceAudioBase64);
  assert.equal(successor.privateTerminalSource.prepare,
    predecessor.privateTerminalSource.prepare);
  assert.deepEqual(successor.privateTerminalSource.CONFIG,
    predecessor.privateTerminalSource.CONFIG);
  assert.deepEqual(successor.privateTerminalSource.PLAN,
    predecessor.privateTerminalSource.PLAN);
  assert.equal(successor.privateTerminalSource.PLAN.decoder.pcmSha256, P002_PCM_CHROME149);
  assert.notEqual(P002_PCM_CHROME153, P002_PCM_CHROME149);
});
