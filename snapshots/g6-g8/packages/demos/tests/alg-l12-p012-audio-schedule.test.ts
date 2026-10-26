import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P012_AUDIO_SOURCE as source, P012_MAIN_AUDIO_SCHEDULE as main,
  P012_COACH_AUDIO_BRANCHES as branches, P012_SAMPLES_PER_FRAME,
  frameToP012TimelineSample, p012TimelineSampleToFrame,
  resolveP012MainAudio, resolveP012CoachBranch, p012CoachElapsedToFrame,
} from '../src/alg-l12-p012-audio-schedule';

const raw = JSON.parse(readFileSync(new URL('../../../migrations/shared-alg001-l12-p012/audio-source-v1/raw-index.json', import.meta.url), 'utf8'));

test('constants match independently indexed source bytes, frames, decoder and branch boundaries', () => {
  assert.equal(raw.source.sha256, source.swfSha256);
  for (const domain of ['main', 'coach'] as const) {
    const indexed = raw.streams[domain];
    assert.equal(source[domain].sha256, indexed.mp3.sha256);
    assert.equal(source[domain].bytes, indexed.mp3.bytes);
    assert.equal(source[domain].decodedSamples, indexed.decode.decodedSamples);
    assert.equal(source[domain].headLatencySeekSamples, indexed.head.latencySeekSamples);
    assert.deepEqual(source[domain].emptyPayloadFrames, indexed.totals.emptyPayloadFrames);
  }
  for (const indexed of raw.streams.coach.branches) {
    const branch = branches[indexed.label as keyof typeof branches];
    const first = raw.streams.coach.rows[indexed.firstFrame - 1];
    const end = raw.streams.coach.rows[indexed.returnFrame - 1];
    assert.equal(branch.firstFrame, indexed.firstFrame);
    assert.equal(branch.returnFrame, indexed.returnFrame);
    assert.equal(branch.sourceStartSample, first.cumulativeDeclaredSampleStart);
    assert.equal(branch.sourceReturnSample, end.cumulativeDeclaredSampleStart);
    assert.equal(branch.sourceReturnBlockEndSample, end.cumulativeDeclaredSampleEnd);
    assert.equal(branch.firstSeekSamples, indexed.firstSeekSamples);
    assert.equal(branch.returnSeekSamples, indexed.lastSeekSamples);
  }
});

test('main full-buffer clock crosses empty frame31 and preserves the frame119 tail', () => {
  assert.equal(P012_SAMPLES_PER_FRAME, 1837.5);
  assert.equal(frameToP012TimelineSample(30), 53_287.5);
  assert.equal(frameToP012TimelineSample(31), 55_125);
  assert.equal(frameToP012TimelineSample(119), 216_825);
  assert.equal(main.audioEndTimelineSample, main.timelineStartSample + source.main.decodedSamples);
  assert.equal(main.audioEndTimelineSample - main.interactiveEntrySample, 1_198.5);
  assert.equal(main.terminalTimelineSample - main.audioEndTimelineSample, 639);
  assert.deepEqual(resolveP012MainAudio(0), {kind: 'preroll'});
  assert.deepEqual(resolveP012MainAudio(main.timelineStartSample), {kind: 'active', sourceSample: 0});
  assert.deepEqual(resolveP012MainAudio(frameToP012TimelineSample(31)),
    {kind: 'active', sourceSample: 1837.5});
  assert.equal(p012TimelineSampleToFrame(main.audioEndTimelineSample), 119);
  assert.deepEqual(resolveP012MainAudio(main.audioEndTimelineSample), {kind: 'postroll'});
  assert.deepEqual(resolveP012MainAudio(main.terminalTimelineSample), {kind: 'terminal'});
  assert.equal(main.initialLatencyTrimApplied, false);
  assert.equal(main.emptyBlockSilenceInserted, false);
  for (const frame of [0, 120, 1.5, NaN]) assert.throws(() => frameToP012TimelineSample(frame), /P012_AUDIO_FRAME/);
});

test('coach goto seeks use block seek plus latency and inclusive return blocks match the frame clock', () => {
  const expectations = {S1: [1_673, 23_671, 23_887.5, 0, 216.5],
    S2: [1_992, 16_440, 16_537.5, 0, 97.5],
    S3: [1_681, 9_263, 9_187.5, 75.5, 0],
    S4: [2_086, 25_562, 25_725, 0, 163]} as const;
  for (const label of Object.keys(expectations) as Array<keyof typeof expectations>) {
    const branch = resolveP012CoachBranch(label);
    const [seek, window, clock, overhang, underrun] = expectations[label];
    assert.equal(branch.effectiveSeekSamples, seek);
    assert.equal(branch.playbackStartSample, branch.sourceStartSample + seek);
    assert.equal(branch.playbackEndSample, branch.sourceReturnBlockEndSample);
    assert.equal(branch.sourceDurationSamples, window);
    assert.equal(branch.clockDurationSamples, clock);
    assert.equal(branch.sourceOverhangSamples, overhang);
    assert.equal(branch.sourceUnderrunSamples, underrun);
    assert.equal(branch.scheduledDurationSamples, Math.min(window, clock));
    assert.equal(p012CoachElapsedToFrame(label, 0), branch.firstFrame);
    assert.equal(p012CoachElapsedToFrame(label, clock - 0.1), branch.returnFrame - 1);
    assert.equal(p012CoachElapsedToFrame(label, clock), 1);
  }
  assert.throws(() => resolveP012CoachBranch('S5' as never), /P012_AUDIO_COACH_LABEL/);
});
