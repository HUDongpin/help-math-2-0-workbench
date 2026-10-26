import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P044_QUESTIONS,p044Initial,p044Enter,p044Question,p044SetParts,p044TogglePart,p044Check,p044CloseWrong,p044CloseCorrect,p044FinishReveal,p044NewWhole,p044Help,p044FinishContinuation,p044Replay} from '../src/nms-l02-p044-practice-v1';
test('exact source question pool and seeded no-replacement completion through four authored pairs',()=>{
  const source=readFileSync(new URL('../../../migrations/shared-nms002-l02-p044/audit/ffdec-scripts-v1/scripts/DefineSprite_243/frame_361/DoAction.as',import.meta.url),'utf8');
  assert.ok(source.includes('["1~4","2~10","3~5","6~8"]'));
  assert.deepEqual(P044_QUESTIONS.map(q=>`${q.numerator}~${q.denominator}`),['1~4','2~10','3~5','6~8']);
  for(const seed of [0,1,2,123,0xffffffff]) {
    let s=p044Enter(p044Initial(seed));const seen=new Set();
    for(let i=0;i<4;i++){
      const q=p044Question(s);seen.add(`${q.numerator}/${q.denominator}`);s=p044SetParts(s,q.denominator);
      for(let n=1;n<=q.numerator;n++)s=p044TogglePart(s,n);
      s=p044Check(s);assert.equal(s.phase,'correct-feedback');assert.equal(p044NewWhole(s),s);
      s=p044CloseCorrect(s);assert.equal(s.phase,i===3?'continuation':'awaiting-new');
      if(i<3)s=p044NewWhole(s);
    }
    assert.equal(seen.size,4);assert.equal(p044FinishContinuation(s).phase,'complete');
    const replay=p044Replay(s);assert.equal(replay.phase,'intro');assert.equal(replay.replay,1);assert.deepEqual(replay.order,p044Initial(seed).order);assert.deepEqual(replay.selected,[]);
  }
});
test('first error requires close, second reveals exact parts; equivalent fraction does not pass',()=>{
  let s=p044Enter(p044Initial(0));const q=p044Question(s);
  s=p044SetParts(s,q.denominator*2);for(let n=1;n<=q.numerator*2;n++)s=p044TogglePart(s,n);
  s=p044Check(s);assert.equal(s.phase,'wrong-feedback');assert.equal(p044Check(s),s);assert.equal(p044SetParts(s,1),s);
  s=p044CloseWrong(s);s=p044Check(s);assert.equal(s.phase,'answer-reveal');assert.equal(s.parts,q.denominator);assert.equal(s.selected.length,q.numerator);
  assert.equal(p044NewWhole(s),s);s=p044FinishReveal(s);assert.equal(s.phase,'awaiting-new');
  s=p044NewWhole(s);assert.equal(s.parts,1);assert.deepEqual(s.selected,[]);assert.equal(s.attempts,0);
});
test('partition changes clear selection and help locks controls without changing answers',()=>{
  let s=p044Enter(p044Initial());s=p044SetParts(s,20);s=p044TogglePart(s,20);s=p044TogglePart(s,20);assert.equal(s.selected.length,0);
  s=p044TogglePart(s,1);s=p044Help(s,true);assert.equal(p044Check(s),s);assert.equal(p044SetParts(s,2),s);assert.equal(p044TogglePart(s,1),s);
  s=p044Help(s,false);s=p044SetParts(s,20);assert.deepEqual(s.selected,[]);
  for(const parts of [0,21,1.5,NaN])assert.throws(()=>p044SetParts(s,parts),/PARTS/);
  assert.throws(()=>p044TogglePart(s,21),/PART_ID/);assert.throws(()=>p044Initial(-1),/SEED/);
});
