import test from 'node:test';
import assert from 'node:assert/strict';
import {getGs002EndingState} from '../src/modern-lessons/g4-l3-gs002-ending';
import source from '../src/modern-lessons/generated/g4-l3-gs002-ending.json';

test('ending time is source12fps, clamps parent at186, and resets by elapsed0',()=>{
  assert.equal(getGs002EndingState(0).frame,1);
  assert.equal(getGs002EndingState(1000/12).frame,2);
  assert.equal(getGs002EndingState(185000/12).frame,186);
  assert.equal(getGs002EndingState(1e6).frame,186);
  assert.deepEqual(getGs002EndingState(0),getGs002EndingState(0));
  for(const n of [-1,NaN,Infinity])assert.throws(()=>getGs002EndingState(n),RangeError);
});
test('all186 source display lists retain order, identities, transforms, masks and ratios',()=>{
  for(let i=0;i<186;i++){
    const actual=getGs002EndingState(i*1000/12).nodes.map(({children,localFrame,...p})=>p);
    assert.deepEqual(actual,source.timelines['319'].frames[i]);
  }
  const mask=getGs002EndingState(0).nodes.find(n=>n.characterId===166);
  assert.equal(mask?.clipDepth,89);
});
test('held parent leaves nested source318 loop live, reduced motion freezes deterministic view',()=>{
  const node=(tick:number)=>getGs002EndingState(tick*1000/12).nodes.find(n=>n.characterId===318);
  assert.equal(node(185)?.localFrame,9);
  assert.equal(node(193)?.localFrame,1);
  assert.deepEqual(getGs002EndingState(0,true),getGs002EndingState(1e6,true));
  assert.equal(getGs002EndingState(0,true).frame,186);
});
test('single-frame ship wrapper207 does not freeze two-frame rotor206',()=>{
  const rotor=(tick:number)=>getGs002EndingState(tick*1000/12).nodes.find(n=>n.characterId===207)?.children?.find(n=>n.characterId===206);
  assert.equal(rotor(58)?.localFrame,1);
  assert.equal(rotor(59)?.localFrame,2);
});
import {createCourseG04L03Gs002InteractionState,reduceCourseG04L03Gs002Interaction} from '../src/timelines/course-g04-l03-gs-002-interaction';

test('existing game reducer owns ending time without changing score/timer and resets on New Game and Replay',()=>{
  const initial=createCourseG04L03Gs002InteractionState(0);
  const advance={type:'advance-ending' as const,elapsedMs:1000};
  assert.equal(reduceCourseG04L03Gs002Interaction(initial,advance),initial);
  const expired=reduceCourseG04L03Gs002Interaction(initial,{type:'advance-time',elapsedMs:240000});
  assert.equal(expired.endingElapsedMs,0);
  const next=reduceCourseG04L03Gs002Interaction(expired,advance);
  assert.equal(getGs002EndingState(next.endingElapsedMs).frame,13);
  assert.equal(next.score,expired.score);assert.equal(next.timerDisplay,'00:00:00');
  for(const elapsedMs of [NaN,Infinity,-1,0])assert.equal(reduceCourseG04L03Gs002Interaction(next,{type:'advance-ending',elapsedMs}),next);
  for(const type of ['new-game','replay'] as const)assert.equal(reduceCourseG04L03Gs002Interaction(next,{type}).endingElapsedMs,0);
});
