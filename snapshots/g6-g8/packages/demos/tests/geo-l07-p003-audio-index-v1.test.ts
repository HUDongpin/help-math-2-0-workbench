import assert from 'node:assert/strict';
import {test} from 'node:test';
import IR from '../src/generated/geo001-l07-p003-display-ir-v2.json';
import {GEO_L07_P003_AUDIO_INDEX, geoL07P003AudioAtFrame} from
  '../src/geo-l07-p003-audio-index-v1';

test('four source audio runs retain pre-roll, gaps and exact boundary offsets', () => {
  assert.equal(GEO_L07_P003_AUDIO_INDEX.preRollFrame, 6);
  assert.equal(GEO_L07_P003_AUDIO_INDEX.sourceSynchronizationAccepted, false);
  assert.equal(GEO_L07_P003_AUDIO_INDEX.listeningAccepted, false);
  assert.deepEqual(GEO_L07_P003_AUDIO_INDEX.runs.map(run =>
    [run.firstFrame, run.endFrame, run.firstSample, run.lastSample]), [
    [8, 794, 3510, 1445555],
    [881, 968, 1447083, 1605065],
    [986, 1125, 1606560, 1860066],
    [1166, 1275, 1861764, 2060160],
  ]);
  for (const frame of [1, 6, 7, 794, 795, 880, 968, 969, 985, 1125, 1165]) {
    assert.equal(geoL07P003AudioAtFrame(frame), null);
  }
  for (const [frame, sample] of [[8, 3510], [793, 1445555], [881, 1447083],
    [967, 1605065], [986, 1606560], [1124, 1860066],
    [1166, 1861764], [1274, 2060160]]) {
    assert.equal(geoL07P003AudioAtFrame(frame)?.sourceBlockSampleOffset, sample);
  }
});

test('every positive source block maps to the exact cumulative seek offset', () => {
  let before = 0;
  let mapped = 0;
  for (const block of IR.soundBlocks) {
    const index = geoL07P003AudioAtFrame(block.frame);
    if (index) {
      mapped += 1;
      assert.equal(before + block.seekSamples, index.sourceBlockSampleOffset,
        `source frame ${block.frame}`);
    }
    before += block.sampleCount;
  }
  assert.equal(mapped, 1121);
  assert.equal(before, 2061504);
  for (const frame of [0, 1275, 1.5, NaN, Infinity]) {
    assert.throws(() => geoL07P003AudioAtFrame(frame), /AUDIO_FRAME_OUT_OF_RANGE/);
  }
});
