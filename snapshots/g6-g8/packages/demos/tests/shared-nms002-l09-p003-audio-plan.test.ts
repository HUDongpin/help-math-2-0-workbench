import assert from 'node:assert/strict';
import test from 'node:test';

import {ContinuousSourceStreamClockCandidate} from
  '../src/continuous-source-stream-clock-candidate';
import {NMS_L09_P003_AUDIO_PLAN} from
  '../src/timelines/shared-nms002-l09-p003-audio-plan';
import {NMS_L09_P003_SOURCE} from
  '../src/timelines/shared-nms002-l09-p003-source-clock';

test('P003 source-clock plan binds the whole browser-decoded stream to its main domain', () => {
  const plan = NMS_L09_P003_AUDIO_PLAN;
  assert.equal(plan.sourceSwfSha256, NMS_L09_P003_SOURCE.swfSha256);
  assert.equal(plan.frameDomain, 'sprite-246');
  assert.equal(plan.firstFrame, 1);
  assert.equal(plan.lastFrame, 635);
  assert.equal(plan.fps, 12);
  assert.equal(plan.audioFirstFrame, 1);
  assert.equal(plan.latencySamples, 1673);
  assert.equal(plan.sourceSegmentCount, 1);
  assert.equal(plan.sourceHasNegativeSeek, false);
  assert.equal(plan.decoder.sourceBytes, 263120);
  assert.equal(plan.decoder.decodedSamples, 1165824);
  assert.equal(plan.decoder.pcmSha256,
    '8186323537f3a02d1a5a837cf1a7cfde96d64f7b5a1e1f823fdaf4419763a4a4');
  const audibleDuration = (plan.decoder.decodedSamples - plan.latencySamples) /
    plan.decoder.sampleRate;
  const terminalFrameTime = (plan.lastFrame - 1) / plan.fps;
  assert(Math.abs(audibleDuration - terminalFrameTime) < 1 / plan.fps,
    'decoded audible tail must meet the source terminal frame within one frame');
  const clock = new ContinuousSourceStreamClockCandidate(plan, {
    commitHeldFrame: () => true,
  });
  assert.equal(clock.snapshot().frameDomain, 'sprite-246');
  assert.equal(clock.snapshot().frame, 1);
  assert.equal(clock.snapshot().sourceAlignment,
    'continuous-play-candidate-not-accepted');
});
