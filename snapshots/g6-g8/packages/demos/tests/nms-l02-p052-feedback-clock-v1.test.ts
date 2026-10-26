import {test} from 'node:test';import assert from 'node:assert/strict';
import {p052FeedbackClock} from '../src/nms-l02-p052-feedback-clock-v1';
import {p052CaptureState} from '../src/nms-l02-p052-capture-state-v1';
test('wrong feedback starts2 and stops15 without closing its parent',()=>{
 for(let elapsed=0;elapsed<100;elapsed++){
  const s=p052FeedbackClock('wrong',elapsed);
  assert.equal(s.frame,Math.min(2+elapsed,15));assert.equal(s.frameDomain,'sprite-322');
  assert.equal(s.stopped,elapsed>=13);assert.equal(s.closeParent,false);
 }
});
test('right feedback reaches34 then executes frame35 return to1, not auto-close',()=>{
 for(let elapsed=0;elapsed<100;elapsed++){
  const s=p052FeedbackClock('right',elapsed);
  assert.equal(s.frame,elapsed<33?2+elapsed:1);assert.equal(s.frameDomain,'sprite-331');
  assert.equal(s.stopped,elapsed>=33);assert.equal(s.closeParent,false);
 }
});
test('child completion leaves both correct and revealed parent feedback intact',()=>{
 for(const scenario of ['first-correct','second-wrong-reveal'] as const){
  const parent=p052CaptureState({scenario,frame:115,frameDomain:'sprite-350',language:'en',seed:0}).state;
  const before=structuredClone(parent);p052FeedbackClock('right',1000);
  assert.deepEqual(parent,before);assert.equal(parent.phase,'right');assert.equal(parent.frame,115);
 }
});
test('invalid steps are rejected and very long active time cannot overflow frame arithmetic',()=>{
 for(const elapsed of [-1,0.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>p052FeedbackClock('wrong',elapsed));
 assert.throws(()=>p052FeedbackClock('other' as 'wrong',0));
 assert.equal(p052FeedbackClock('wrong',Number.MAX_SAFE_INTEGER).frame,15);
 assert.equal(p052FeedbackClock('right',Number.MAX_SAFE_INTEGER).frame,1);
});
