import assert from 'node:assert/strict';
import test from 'node:test';
import {P015_TIMELINE,p015TimelineState} from '../src/alg-l06-p015-timeline-v1';
import {P015_TEXT_STATE_SOURCE} from '../src/generated/alg-l06-p015-text-state-v1';

test('P015 pure timeline binds exact source frame domain and glossary gates',()=>{
  assert.deepEqual([P015_TIMELINE.animationId,P015_TIMELINE.sourceSwfSha256,
    P015_TIMELINE.frameDomain,P015_TIMELINE.mainFrameCount,P015_TIMELINE.fps,
    P015_TIMELINE.rootEntryFrame],[P015_TEXT_STATE_SOURCE.animationId,
    P015_TEXT_STATE_SOURCE.sourceSwfSha256,P015_TEXT_STATE_SOURCE.frameDomain,
    P015_TEXT_STATE_SOURCE.frameCount,P015_TEXT_STATE_SOURCE.fps,
    P015_TEXT_STATE_SOURCE.rootEntryFrame]);
  for(const control of P015_TEXT_STATE_SOURCE.controls){
    const source=P015_TIMELINE.glossary[control.key];
    assert.deepEqual([source.buttonId,source.firstFullHitFrame],
      [control.buttonId,control.fullHitFrame]);
    assert.equal(p015TimelineState(source.firstFullHitFrame-1).glossary[control.key],false);
    assert.equal(p015TimelineState(source.firstFullHitFrame).glossary[control.key],true);
  }
  assert.equal(p015TimelineState(1).phase,'intro');
  assert.equal(p015TimelineState(732).phase,'number-example');
  assert.equal(p015TimelineState(914).elapsedSeconds,913/12);
  for(const frame of [0,915,1.2])assert.throws(()=>p015TimelineState(frame),/P015_FRAME_OUT_OF_RANGE/);
});
