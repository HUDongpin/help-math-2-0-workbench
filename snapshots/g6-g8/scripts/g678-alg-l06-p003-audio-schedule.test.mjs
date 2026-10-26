import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ALG_L06_P003_SOURCE_AUDIO as plan, algL06P003AudioSlicesFromFrame as slices,
  algL06P003AudioSlicesFromSeconds as slicesAtSeconds} from '../packages/demos/src/alg-l06-p003-source-audio-schedule-v1.ts';

test('P003 preserves two source MP3 identities, a negative-seek terminal block and the 42-frame gap', () => {
  assert.deepEqual(plan.runs.map(run => [run.firstFrame, run.lastBlockFrame, run.sourceBytes]),
    [[41, 501, 190580], [544, 719, 73060]]);
  assert.deepEqual(plan.gap, {firstFrame: 502, lastFrame: 543});
  assert.deepEqual(plan.runs[0].terminalEmptyBlock, {frame: 501, samples: 0, seek: -2276, mp3Bytes: 0});
  assert.equal(plan.measuredDecoderUserAgent, 'HeadlessChrome/153.0.0.0');
  assert.deepEqual(plan.runs.map(run => run.measuredPcmSha256), [
    'd0aa56218c7b0ef05d011d4c47898fd1550cba1a888368a75304f981decef69f',
    'd53be298c40bd865740e1e77287eea868f1532f86c106b3f42dc07b8e5d9b82b',
  ]);
  assert.equal(plan.alignmentStatus, 'source-block-boundary-candidate-not-original-runtime-accepted');
});

test('P003 schedules no first-run node in the gap and resumes the second run at its source frame', () => {
  assert.deepEqual(slices(1).map(slice => [slice.runId, slice.delaySeconds]),
    [['source-run-01', 40 / 12], ['source-run-02', 543 / 12]]);
  assert.equal(slices(41)[0].firstDecodedSample, 1673);
  assert.deepEqual(slices(502).map(slice => [slice.runId, slice.delaySeconds]), [['source-run-02', 42 / 12]]);
  assert.deepEqual(slices(543).map(slice => [slice.runId, slice.delaySeconds]), [['source-run-02', 1 / 12]]);
  assert.deepEqual(slices(544).map(slice => [slice.runId, slice.delaySeconds]), [['source-run-02', 0]]);
  assert.equal(slices(544)[0].firstDecodedSample, 519);
  assert.deepEqual(slices(719), []);
});

test('P003 frame inspection rejects positions outside the authored main timeline', () => {
  for (const frame of [0, 720, 1.5, NaN, Infinity])
    assert.throws(() => slices(frame), /invalid-source-frame/u);
});

test('P003 fractional pause in the gap does not replay first-run samples', () => {
  const position = 42.25;
  const remaining = slicesAtSeconds(position);
  assert.deepEqual(remaining.map(slice => slice.runId), ['source-run-02']);
  assert(Math.abs(remaining[0].delaySeconds - (45.25 - position)) < 1e-9);
  assert.equal(remaining[0].firstDecodedSample, 519);
  assert.throws(() => slicesAtSeconds(60), /invalid-source-position/u);
});
