import test from 'node:test';
import assert from 'node:assert/strict';
import {p045Initial,p045Question,p045Enter,p045Input,p045Check,p045CloseFeedback,p045FinishReveal,p045NewWhole,p045Help,p045FinishContinuation,p045Replay} from '../src/nms-l02-p045-practice-v1';
function answer(s:ReturnType<typeof p045Initial>){const q=p045Question(s);return p045Input(p045Input(s,'numerator',q.numerator),'denominator',q.denominator);}
test('three source questions draw without replacement and complete only after continuation',()=>{
 for(const seed of [0,7,12345]){let s=p045Enter(p045Initial(seed));const seen=[];
  for(let i=0;i<3;i++){seen.push(p045Question(s).label);s=p045Check(answer(s));assert.equal(s.phase,'correct-feedback');s=p045CloseFeedback(s);assert.equal(s.phase,i===2?'continuation':'awaiting-new');if(i<2)s=p045NewWhole(s);}
  assert.equal(new Set(seen).size,3);assert.equal(p045FinishContinuation(s).phase,'complete');}
});
test('first wrong Close restores values for retry; second Close reveals before New becomes available',()=>{
 let s=p045Input(p045Enter(p045Initial()),'numerator','wrong');s=p045Check(s);assert.equal(p045Input(s,'numerator','2'),s);s=p045CloseFeedback(s);assert.equal(s.numerator,'wrong');assert.equal(s.phase,'ready');s=p045CloseFeedback(p045Check(s));assert.equal(s.phase,'answer-reveal');assert.equal(s.numerator,p045Question(s).numerator);assert.equal(s.denominator,'10');assert.equal(p045NewWhole(s),s);s=p045FinishReveal(s);assert.equal(s.phase,'awaiting-new');s=p045NewWhole(s);assert.equal(s.numerator,'');assert.equal(s.denominator,'');assert.equal(s.attempts,0);
});
test('help locks fields and progression while preserving ready/awaiting-new state',()=>{
 let s=p045Enter(p045Initial());s=p045Help(s,true);assert.equal(p045Input(s,'numerator','2'),s);assert.equal(p045Check(s),s);s=p045Help(s,false);s=p045CloseFeedback(p045Check(answer(s)));s=p045Help(s,true);assert.equal(p045NewWhole(s),s);s=p045Help(s,false);assert.equal(p045NewWhole(s).questionIndex,1);
});
test('exact string answer policy rejects normalized alternatives and Replay restores the complete practice state',()=>{
 const initial=p045Initial();for(const value of ['02','2 ',' 2','2.0','+2','1']){let s=p045Enter(initial);s=p045Input(p045Input(s,'numerator',value),'denominator','10');assert.equal(p045Check(s).phase,'wrong-feedback');}
 let s=p045CloseFeedback(p045Check(answer(p045Enter(initial))));s=p045Help(s,true);const replay=p045Replay(s);assert.deepEqual({...replay,replay:0},initial);assert.equal(replay.replay,1);assert(Object.isFrozen(replay)&&Object.isFrozen(replay.order));assert.equal(p045FinishContinuation(initial),initial);
});
