import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {frameToP009TimelineSample, P009_AUDIO_SCHEDULE as schedule, P009_AUDIO_SOURCE as source,
  p009TimelineSampleToFrame, resolveP009AudioSchedule} from '../src/alg-l12-p009-audio-schedule';

const migration = new URL('../../../migrations/shared-alg001-l12-p009/', import.meta.url);

test('schedule pins match the immutable source stream and independent decoded analysis', () => {
  const encoded = readFileSync(new URL('audit/source-stream.mp3', migration));
  const analysis = JSON.parse(readFileSync(new URL('audio-analysis-v1/analysis.json', migration), 'utf8'));
  assert.equal(encoded.length, source.bytes);
  assert.equal(createHash('sha256').update(encoded).digest('hex'), source.sha256);
  assert.equal(analysis.source.sha256, schedule.sourceSha256);
  assert.equal(analysis.source.mainFrameCount, schedule.frameCount);
  assert.equal(analysis.source.fps, schedule.fps);
  assert.equal(source.decodedSamples, 1_253 * 576);
  assert.equal(schedule.audioEndTimelineSample,
    schedule.timelineStartSample + source.decodedSamples - schedule.sourceStartSample);
  assert.equal(schedule.terminalTimelineSample - schedule.audioEndTimelineSample, 245);
  assert.equal(schedule.sourceTerminalStop, false);
  for (const key of ['originalRuntime', 'synchronizationAccepted', 'listeningAccepted', 'registered'] as const)
    assert.equal(schedule[key], false);
});

test('all 394 source frame boundaries map exactly, including fractional half samples', () => {
  for (let frame = 1; frame <= 394; frame++) {
    const sample = frameToP009TimelineSample(frame);
    assert.equal(sample, (frame - 1) * 22_050 / 12);
    assert.equal(p009TimelineSampleToFrame(sample), frame);
    if (frame > 1) assert.equal(p009TimelineSampleToFrame(sample - 0.01), frame - 1);
  }
  assert.equal(frameToP009TimelineSample(394), 722_137.5);
});

test('preroll, empty block frame 3, audio end and terminal resolve one continuous model', () => {
  assert.deepEqual(resolveP009AudioSchedule(1_837), {kind: 'preroll', timelineSample: 1_837});
  assert.deepEqual(resolveP009AudioSchedule(1_837.5),
    {kind: 'active', timelineSample: 1_837.5, sourceSample: 1_673, sourceEndSample: 721_728});
  assert.deepEqual(resolveP009AudioSchedule(frameToP009TimelineSample(3)),
    {kind: 'active', timelineSample: 3_675, sourceSample: 3_510.5, sourceEndSample: 721_728});
  assert.equal(resolveP009AudioSchedule(721_892).kind, 'active');
  assert.deepEqual(resolveP009AudioSchedule(721_892.5), {kind: 'postroll', timelineSample: 721_892.5});
  assert.deepEqual(resolveP009AudioSchedule(722_137.5), {kind: 'terminal', timelineSample: 722_137.5});
});

test('invalid frames and timeline values fail closed', () => {
  for (const value of [0, 395, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    assert.throws(() => frameToP009TimelineSample(value), /P009_AUDIO_FRAME/);
  for (const value of [-0.1, 722_138, NaN, Infinity]) {
    assert.throws(() => resolveP009AudioSchedule(value), /P009_AUDIO_TIMELINE_SAMPLE/);
    assert.throws(() => p009TimelineSampleToFrame(value), /P009_AUDIO_TIMELINE_SAMPLE/);
  }
});
