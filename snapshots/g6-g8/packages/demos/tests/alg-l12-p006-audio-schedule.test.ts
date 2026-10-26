import assert from 'node:assert/strict';
import test from 'node:test';
import {P006_AUDIO_SOURCE} from '../src/alg-l12-p006-audio-decode';
import {p006SourceAudioCoordinate} from '../src/alg-l12-p006-audio-index';
import {
  frameToTimelineSample, P006_AUDIO_RUNS, P006_AUDIO_SCHEDULE,
  resolveSchedule, timelineSampleToFrame,
} from '../src/alg-l12-p006-audio-schedule';

const AUDIO_END = 626_386;
const FRAME_342 = 626_587.5;
const END = FRAME_342;

test('candidate metadata and one continuous run keep raw seek arithmetic distinct from the natural clock', () => {
  assert.equal(P006_AUDIO_SCHEDULE.audioSha256, P006_AUDIO_SOURCE.sha256);
  assert.equal(P006_AUDIO_SCHEDULE.sourceSha256,
    '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6');
  assert.equal(P006_AUDIO_SCHEDULE.sampleRate, 22_050);
  assert.equal(P006_AUDIO_SCHEDULE.samplesPerFrame, 1_837.5);
  assert.equal(P006_AUDIO_SCHEDULE.audioEndTimelineSample, AUDIO_END);
  assert.equal(P006_AUDIO_SCHEDULE.terminalTimelineSample, END);
  assert.equal(P006_AUDIO_SCHEDULE.originalRuntime, false);
  assert.equal(P006_AUDIO_SCHEDULE.synchronizationAccepted, false);
  assert.equal(P006_AUDIO_SCHEDULE.registered, false);
  assert.equal(Object.isFrozen(P006_AUDIO_SCHEDULE), true);
  assert.equal(Object.isFrozen(P006_AUDIO_RUNS), true);
  assert.equal(P006_AUDIO_RUNS.every(Object.isFrozen), true);
  assert.deepEqual(P006_AUDIO_RUNS, [
    {group: 1, firstFrame: 3, timelineStartSample: 3_675,
      sourceStartSample: 1_673, sourceEndSample: 624_384},
  ]);
  assert.equal(P006_AUDIO_RUNS[0]!.timelineStartSample + 624_384 - 1_673, AUDIO_END);
  assert.equal(END - AUDIO_END, 201.5, 'visual terminal follows the natural audio end');
  assert.deepEqual(p006SourceAudioCoordinate(4),
    {kind: 'empty-block', frame: 4, sourceSample: 3_456});
  assert.deepEqual(resolveSchedule(frameToTimelineSample(4)),
    {kind: 'active', timelineSample: 5_512.5,
      group: 1, sourceSample: 3_510.5, sourceEndSample: 624_384});
  assert.deepEqual(p006SourceAudioCoordinate(341),
    {kind: 'positive-block', frame: 341, sourceSample: 620_742});
  assert.deepEqual(resolveSchedule(frameToTimelineSample(341)),
    {kind: 'active', timelineSample: 624_750,
      group: 1, sourceSample: 622_748, sourceEndSample: 624_384});
  const rawCoordinate = p006SourceAudioCoordinate(342);
  const candidate = resolveSchedule(frameToTimelineSample(342));
  assert.equal(rawCoordinate.kind, 'positive-block');
  assert.equal(rawCoordinate.sourceSample, 622_579);
  assert.deepEqual(candidate, {kind: 'terminal', timelineSample: FRAME_342});
});

test('pure schedule has exact preroll, continuous run, postroll and visual terminal boundaries', () => {
  const query = (sample: number) => resolveSchedule(sample);
  assert.deepEqual(query(0), {kind: 'preroll', timelineSample: 0});
  assert.deepEqual(query(3_674.5), {kind: 'preroll', timelineSample: 3_674.5});
  assert.deepEqual(query(3_675), {kind: 'active', timelineSample: 3_675,
    group: 1, sourceSample: 1_673, sourceEndSample: 624_384});
  assert.deepEqual(query(5_511.5), {kind: 'active', timelineSample: 5_511.5,
    group: 1, sourceSample: 3_509.5, sourceEndSample: 624_384});
  assert.deepEqual(query(5_512), {kind: 'active', timelineSample: 5_512,
    group: 1, sourceSample: 3_510, sourceEndSample: 624_384});
  assert.deepEqual(query(7_349.5), {kind: 'active', timelineSample: 7_349.5,
    group: 1, sourceSample: 5_347.5, sourceEndSample: 624_384});
  assert.deepEqual(query(7_350), {kind: 'active', timelineSample: 7_350,
    group: 1, sourceSample: 5_348, sourceEndSample: 624_384});
  assert.deepEqual(query(AUDIO_END - 0.5), {kind: 'active', timelineSample: AUDIO_END - 0.5,
    group: 1, sourceSample: 624_383.5, sourceEndSample: 624_384});
  assert.deepEqual(query(AUDIO_END), {kind: 'postroll', timelineSample: AUDIO_END});
  assert.deepEqual(query(END - 0.5), {kind: 'postroll', timelineSample: END - 0.5});
  assert.deepEqual(query(END), {kind: 'terminal', timelineSample: END});
  assert.deepEqual(query(FRAME_342), query(FRAME_342));
});

test('all authored frames use the 12 fps visual grid without an empty-block gap, ending at frame 342', () => {
  for (let frame = 1; frame <= 342; frame++) {
    const sample = frameToTimelineSample(frame);
    assert.equal(sample, (frame - 1) * 1_837.5, `frame ${frame}`);
    assert.equal(timelineSampleToFrame(sample), frame, `frame ${frame}`);
    assert.equal(resolveSchedule(sample).kind,
      frame < 3 ? 'preroll' : frame < 342 ? 'active' : 'terminal', `frame ${frame}`);
  }
  assert.equal(frameToTimelineSample(342), FRAME_342);
  assert.equal(timelineSampleToFrame(AUDIO_END), 341);
  assert.equal(timelineSampleToFrame(FRAME_342 - 0.5), 341);
  assert.equal(timelineSampleToFrame(FRAME_342), 342);
  assert.equal(timelineSampleToFrame(END - 0.5), 341);
  assert.equal(timelineSampleToFrame(END), 342);
});

test('frame and timeline queries reject nonfinite and out-of-domain values', () => {
  for (const value of [0, 343, -1, 3.5, NaN, Infinity, -Infinity])
    assert.throws(() => frameToTimelineSample(value), /P006_AUDIO_FRAME/);
  for (const value of [-0.5, END + 0.5, NaN, Infinity, -Infinity]) {
    assert.throws(() => resolveSchedule(value), /P006_AUDIO_TIMELINE_SAMPLE/);
    assert.throws(() => timelineSampleToFrame(value), /P006_AUDIO_TIMELINE_SAMPLE/);
  }
});
