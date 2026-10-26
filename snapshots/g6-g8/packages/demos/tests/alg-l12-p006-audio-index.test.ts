import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {p006SourceAudioCoordinate as coordinate} from '../src/alg-l12-p006-audio-index';
import {P006_AUDIO_RUNS, P006_AUDIO_SCHEDULE, frameToTimelineSample} from '../src/alg-l12-p006-audio-schedule';

test('all 340 source block coordinates match the hash-bound receipt', () => {
  const bytes = readFileSync(new URL('../../../migrations/shared-alg001-l12-p006/audio-source-v1/stream-source-receipt.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'c3f1c26102fb9b7e0cb41a60a0de764b8cc68da559a7d20be7ccb42f557f4f78');
  const receipt = JSON.parse(bytes.toString());
  assert.equal(receipt.blocks.length, 340);
  let prior = 0;
  for (const [index, block] of receipt.blocks.entries()) {
    assert.equal(block.spriteFrame, index + 3);
    const result = coordinate(block.spriteFrame);
    assert.notEqual(result.kind, 'no-block');
    if (result.kind === 'no-block') throw Error('unexpected no-block');
    assert.equal(result.sourceSample, prior + block.signedSeekSamples);
    assert.equal(result.kind, block.sampleCount === 0 ? 'empty-block' : 'positive-block');
    assert(result.sourceSample >= 0 && result.sourceSample < 624384);
    prior += block.sampleCount;
  }
  assert.equal(prior, 624384);
  // Bind the continuous candidate to the actual stream receipt, independently
  // of the schedule's hand-written boundary examples. Empty blocks do not split it.
  assert.equal(P006_AUDIO_RUNS.length, 1);
  const run = P006_AUDIO_RUNS[0];
  assert.equal(run.firstFrame, receipt.blocks[0].spriteFrame);
  assert.equal(run.sourceStartSample, receipt.streamHead.latencySeek);
  assert.equal(run.sourceStartSample, receipt.blocks[0].signedSeekSamples);
  assert.equal(run.sourceEndSample, prior);
  assert.equal(run.timelineStartSample, frameToTimelineSample(run.firstFrame));
  const audioEnd = run.timelineStartSample + prior - run.sourceStartSample;
  assert.equal(P006_AUDIO_SCHEDULE.audioEndTimelineSample, audioEnd);
  assert.equal(P006_AUDIO_SCHEDULE.terminalTimelineSample,
    Math.max(audioEnd, frameToTimelineSample(receipt.domain.frames)));
});

test('absence, empty marker, first cue and terminal remain distinct', () => {
  assert.deepEqual(coordinate(1), {kind: 'no-block', frame: 1});
  assert.deepEqual(coordinate(2), {kind: 'no-block', frame: 2});
  assert.deepEqual(coordinate(3), {kind: 'positive-block', frame: 3, sourceSample: 1673});
  assert.deepEqual(coordinate(4), {kind: 'empty-block', frame: 4, sourceSample: 3456});
  assert.deepEqual(coordinate(5), {kind: 'positive-block', frame: 5, sourceSample: 3510});
  assert.deepEqual(coordinate(342), {kind: 'positive-block', frame: 342, sourceSample: 622579});
  for (const frame of [0, -1, 343, 3.5, NaN, Infinity]) assert.throws(() => coordinate(frame), /P006_AUDIO_FRAME/);
});
