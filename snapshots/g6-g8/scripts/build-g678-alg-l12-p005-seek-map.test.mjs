import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {buildP005SeekMap, deriveP005SeekMap, p005SeekObservation} from './build-g678-alg-l12-p005-seek-map.mjs';
const base = new URL('../migrations/shared-alg001-l12-p005/audio-source-v1/', import.meta.url);
const receipt = JSON.parse(await readFile(new URL('machine-timing-receipt.json', base)));
const payload = await readFile(new URL('sprite-391-source-stream.mp3', base));

test('all 968 source frames retain exact seek arithmetic or explicit missing/zero disposition', async () => {
  const {result: map} = await buildP005SeekMap();
  let samples = 0;
  const byFrame = new Map(receipt.blocks.map(block => [block.localFrame, block]));
  for (let frame = 1; frame <= 968; frame++) {
    const observation = p005SeekObservation(map, frame), block = byFrame.get(frame);
    if (!block) assert.equal(observation.kind, 'no-stream-block');
    else {
      assert.equal(observation.rawSeekCoordinate, samples + block.signedSeekSamples);
      assert.equal(observation.kind, block.sampleCount ? 'positive-sample-block' : 'zero-sample-block');
      samples += block.sampleCount;
    }
  }
  assert.equal(samples, 3309696);
  assert.deepEqual(map.positiveBlockRuns, [
    {firstFrame:23,lastFrame:23,blockCount:1,interceptSamples:-79155},
    {firstFrame:25,lastFrame:338,blockCount:314,interceptSamples:-82830},
    {firstFrame:384,lastFrame:968,blockCount:585,interceptSamples:-247566},
  ]);
  assert.deepEqual(map.absentFrameIntervals, [{firstFrame:1,lastFrame:22},{firstFrame:340,lastFrame:383}]);
  assert.equal(map.playbackEnabled, false);
  assert.equal(map.synchronizationAccepted, false);
});

test('exceptional boundaries never get interpolated into an invented continuous clock', () => {
  const map = deriveP005SeekMap(receipt, payload);
  assert.equal(p005SeekObservation(map, 23).rawSeekCoordinate, 1695);
  assert.equal(p005SeekObservation(map, 24).kind, 'zero-sample-block');
  assert.equal(p005SeekObservation(map, 25).rawSeekCoordinate, 5370);
  assert.equal(p005SeekObservation(map, 339).rawSeekCoordinate, 1154832);
  assert.equal(p005SeekObservation(map, 340).rawSeekCoordinate, null);
  assert.equal(p005SeekObservation(map, 383).rawSeekCoordinate, null);
  assert.equal(p005SeekObservation(map, 384).rawSeekCoordinate, 1159959);
  assert.equal(p005SeekObservation(map, 968).rawSeekCoordinate, 3306159);
  for (const frame of [0,969,1.5,NaN,Infinity]) assert.throws(()=>p005SeekObservation(map,frame),/outside domain/);
});

test('source drift, block corruption and malformed ordering are rejected', () => {
  const bad = structuredClone(receipt); bad.blocks[1].localFrame = 23;
  assert.throws(()=>deriveP005SeekMap(bad,payload),/frame order/);
  const bytes = Buffer.from(payload); bytes[0] ^= 1;
  assert.throws(()=>deriveP005SeekMap(receipt,bytes));
  const offset = structuredClone(receipt); offset.blocks[10].payloadOffset++;
  assert.throws(()=>deriveP005SeekMap(offset,payload),/payload offset/);
});
