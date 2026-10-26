import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P020_AUDIO_ASSETS, P020_SA_ASSET, P020_AUDIO_DISPOSITION,
  p020AudioSlice} from '../src/alg-l06-p020-audio-schedule-v1';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('eight independent domains and SA bind source bytes and actual Chrome PCM', () => {
  const receiptBytes = read('output/alg-l06-p020-audio-v1/browser-decode-v1/decode-receipt.json');
  const receipt = JSON.parse(receiptBytes.toString());
  assert.equal(P020_AUDIO_ASSETS.length, 8);
  assert.equal(new Set(P020_AUDIO_ASSETS.map(item => item.id)).size, 8);
  for (const asset of [...P020_AUDIO_ASSETS, P020_SA_ASSET]) {
    assert.equal(asset.browserReceiptSha256, sha(receiptBytes));
    const bytes = read(asset.sourcePath);
    assert.equal(bytes.length, asset.sourceBytes);
    assert.equal(sha(bytes), asset.sourceSha256);
    const measured = receipt.results.find((item: {domain: string}) => item.domain === asset.domain);
    assert(measured);
    assert.equal(measured.decodedSamples, asset.decodedSamples);
    assert.equal(measured.pcmSha256, asset.pcmSha256);
    assert.equal(measured.playbackStarted, false);
  }
  assert.equal(P020_AUDIO_DISPOSITION.separateSaSpliced, false);
  assert.equal(P020_AUDIO_DISPOSITION.sprite94NegativeSeekSemanticsResolved, false);
});

test('one continuous main decoder holds at quiz and resumes at frame 59 offset', () => {
  const at58 = p020AudioSlice('main-1', 58)!;
  const at59 = p020AudioSlice('main-1', 59)!;
  assert.equal(at59.asset, at58.asset);
  assert.equal(at59.firstDecodedSample - at58.firstDecodedSample, 22050 / 12);
  assert.equal(p020AudioSlice('main-1', 1)?.delaySeconds, 1 / 12);
  assert.equal(p020AudioSlice('main-1', 172), null,
    'main decoder exhausts before last visual frame');
});

test('feedback branch frame 2 keeps source block timing, including frame-1 stream', () => {
  assert.equal(p020AudioSlice('feedback-right-4', 2)?.firstDecodedSample, 1673 + 22050 / 12);
  assert.equal(p020AudioSlice('feedback-right-3', 2)?.delaySeconds, 1 / 12);
  assert.equal(p020AudioSlice('feedback-wrong-2', 2)?.firstDecodedSample, 1673);
  assert.deepEqual(P020_AUDIO_ASSETS.find(item => item.id === 'feedback-wrong-2')?.negativeSeekBlocks,
    [{frame: 27, rawSeekSamples: -2093, mp3Bytes: 0}]);
  assert.throws(() => p020AudioSlice('feedback-wrong-2', 29), /P020_INVALID_DOMAIN_AUDIO_POSITION/u);
});
