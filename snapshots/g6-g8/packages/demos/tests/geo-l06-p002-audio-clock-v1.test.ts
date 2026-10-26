import assert from 'node:assert/strict';
import {test} from 'node:test';
import SOURCE_IR from '../src/generated/geo001-l06-p002-display-ir-v1.json';
import {GEO_L06_P002_AUDIO_CLOCK, geoL06P002AudioAtFrame} from '../src/geo-l06-p002-audio-clock-v1';

test('three source MP3 runs retain the two six-frame timeline gaps', () => {
  assert.equal(GEO_L06_P002_AUDIO_CLOCK.sourceSynchronizationAccepted, false);
  assert.equal(GEO_L06_P002_AUDIO_CLOCK.samplesPerSourceFrame, 1837);
  assert.equal(GEO_L06_P002_AUDIO_CLOCK.initialLatencySamples, 1673);
  assert.deepEqual(GEO_L06_P002_AUDIO_CLOCK.segments.map(segment =>
    [segment.firstFrame, segment.endFrame, segment.firstDecodedSample, segment.endDecodedSample]), [
    [8, 417, 1673, 752832],
    [423, 463, 753084, 826560],
    [469, 1217, 826642, 2200320],
  ]);
  for (const frame of [1, 7, 417, 418, 422, 463, 464, 468]) {
    assert.equal(geoL06P002AudioAtFrame(frame), null);
  }
  assert.equal(geoL06P002AudioAtFrame(8)?.decodedSample, 1673);
  assert.equal(geoL06P002AudioAtFrame(416)?.decodedSample, 751169);
  assert.equal(geoL06P002AudioAtFrame(423)?.decodedSample, 753084);
  assert.equal(geoL06P002AudioAtFrame(462)?.decodedSample, 824727);
  assert.equal(geoL06P002AudioAtFrame(469)?.decodedSample, 826642);
  assert.equal(geoL06P002AudioAtFrame(1216)?.decodedSample, 2198881);
});

test('every active source block seek maps to the native-rate decoded stream', () => {
  let decodedBefore = 0;
  for (const block of SOURCE_IR.soundBlocks) {
    const position = geoL06P002AudioAtFrame(block.frame);
    if (block.frame !== 7 && block.sampleCount !== 0) {
      assert(position, `active frame ${block.frame}`);
      assert.equal(decodedBefore + block.seekSamples, position.decodedSample,
        `source seek for frame ${block.frame}`);
    }
    decodedBefore += block.sampleCount;
  }
  assert.equal(decodedBefore, GEO_L06_P002_AUDIO_CLOCK.decodedSamples);
  for (let frame = 1; frame <= 1216; frame++) {
    const position = geoL06P002AudioAtFrame(frame);
    if (position) assert(position.decodedSample < position.segment.endDecodedSample);
  }
  for (const frame of [0, 1217, 2.5, NaN, Infinity]) {
    assert.throws(() => geoL06P002AudioAtFrame(frame), /AUDIO_FRAME_OUT_OF_RANGE/);
  }
});
