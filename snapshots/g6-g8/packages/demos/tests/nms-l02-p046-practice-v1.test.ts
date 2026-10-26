import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from '../src/nms-l02-p046-practice-v1';
const ready=()=>p.p046Enter(p.p046Initial(0));
const input=(s:p.P046Practice,n:string,d:string)=>p.p046Input(p.p046Input(s,'numerator',n),'denominator',d);
test('three source questions appear once and completion requires final continuation',()=>{
 for(const seed of [0,1,17,0xffffffff]){
  let s=p.p046Enter(p.p046Initial(seed));const seen=[];
  for(let i=0;i<3;i++){
   const q=p.p046Question(s);seen.push(q.label);s=p.p046CloseFeedback(p.p046Check(input(s,String(Number(q.numerator)*3),String(Number(q.denominator)*3))));
   assert.equal(s.phase,i===2?'continuation':'awaiting-new');if(i<2)s=p.p046NewWhole(s);
  }
  assert.equal(new Set(seen).size,3);assert.equal(p.p046FinishContinuation(s).phase,'complete');
 }
});
test('two errors reveal source doubled values, then finish only at explicit reveal boundary',()=>{
 let s=ready();const q=p.p046Question(s);s=p.p046Check(input(s,'0','0'));assert.equal(s.phase,'wrong-feedback');s=p.p046CloseFeedback(s);assert.equal(s.phase,'ready');
 s=p.p046CloseFeedback(p.p046Check(s));assert.equal(s.phase,'answer-reveal');assert.equal(s.numerator,String(Number(q.numerator)*2));assert.equal(s.denominator,String(Number(q.denominator)*2));
 assert.equal(p.p046NewWhole(s),s);s=p.p046FinishReveal(s);assert.equal(s.phase,'awaiting-new');
});
test('partition changes clear selection, keep answer independent, and question changes reset visual state',()=>{
 let s=input(ready(),'1','2');s=p.p046TogglePart(p.p046SetParts(s,4),2);assert.deepEqual(s.selected,[2]);assert.equal(s.numerator,'1');
 s=p.p046SetParts(s,5);assert.deepEqual(s.selected,[]);assert.equal(s.denominator,'2');
 assert.equal(p.p046SetParts(s,1000).parts,1000);assert.throws(()=>p.p046SetParts(s,0));
 s=p.p046CloseFeedback(p.p046Check(s));assert.equal(s.phase,'awaiting-new');s=p.p046NewWhole(s);assert.equal(s.parts,1);assert.deepEqual(s.selected,[]);assert.equal(s.numerator,'');
});
test('help and feedback lock inputs/partition; Replay deterministically resets the full state',()=>{
 let s=p.p046TogglePart(p.p046SetParts(ready(),12),7);s=p.p046Help(s,true);
 assert.equal(p.p046Input(s,'numerator','9'),s);assert.equal(p.p046SetParts(s,4),s);assert.equal(p.p046TogglePart(s,1),s);assert.equal(p.p046Check(s),s);
 s=p.p046Check(p.p046Help(s,false));assert.equal(p.p046SetParts(s,3),s);
 const replay=p.p046Replay(s);assert.equal(replay.phase,'intro');assert.equal(replay.replay,1);assert.equal(replay.parts,1);assert.deepEqual(replay.selected,[]);assert.deepEqual(replay.order,p.p046Initial(0).order);
 assert(Object.isFrozen(replay));assert(Object.isFrozen(replay.selected));assert(Object.isFrozen(replay.order));
});
