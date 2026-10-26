import assert from'node:assert/strict';import test from'node:test';
import{p039Initial,p039Advance,p039SetPercent,p039Submit,p039Reset,p039CloseWrong,p039Replay,p039Phase}from'../src/nms-l02-p039-state-v1';
const practice=(seed=0)=>p039Advance(p039Initial(seed),545);
test('all101answers accept only25and source intro blocks input',()=>{
 assert.equal(p039SetPercent(p039Initial(),25).percent,0);
 for(let n=0;n<=100;n++){const s=p039Submit(p039SetPercent(practice(),n));assert.equal(s.correctPlaying,n===25);assert.equal(s.popupVisible,n!==25);assert.equal(s.tries,n===25?0:1);assert(!s.enabled);}
});
test('first retry/reset preserves count; second failure explicitly reveals25then waits35frame action',()=>{
 let s=p039Submit(practice());s=p039CloseWrong(s);assert(s.enabled);s=p039SetPercent(s,75);s=p039Reset(s);assert.equal(s.percent,0);assert.equal(s.tries,1);
 s=p039CloseWrong(p039Submit(s));assert.equal(s.percent,25);assert(s.correctedReveal&&!s.enabled);assert.equal(s.revealFrame,2);
 s=p039Advance(s,32);assert.equal(s.revealFrame,34);assert(!s.mainPlaying);s=p039Advance(s,1);assert.equal(s.mainFrame,546);assert(s.mainPlaying);s=p039Advance(s,1);assert.equal(s.mainFrame,547);assert.equal(s.coachBranch,null);s=p039Advance(s,100);assert.equal(p039Phase(s),'completed');assert.equal(s.percent,25);
});
test('right feedback retains source13action before main advances',()=>{
 let s=p039Submit(p039SetPercent(practice(),25));s=p039Advance(s,10);assert.equal(s.correctFrame,12);assert(!s.mainPlaying);s=p039Advance(s,1);assert.equal(s.correctFrame,13);assert.equal(s.mainFrame,546);assert(s.mainPlaying);s=p039Advance(s,1);assert.equal(s.mainFrame,547);assert.equal(s.correctFrame,null);
});
test('all four deterministic coach branches stop their local timeline independently',()=>{
 const starts=[3,18,31,40],stops=[16,27,36,54];
 for(let seed=0;seed<4;seed++){let s=p039Submit(practice(seed));assert.equal(s.coachBranch,seed);assert.equal(s.coachFrame,starts[seed]);s=p039Advance(s,stops[seed]-starts[seed]);assert.equal(s.coachFrame,1);assert(!s.coachPlaying);assert(s.popupVisible);s=p039CloseWrong(s);assert(s.enabled);s=p039Submit(s);assert.equal(s.coachBranch,(seed+1)%4);assert.deepEqual(p039Replay(s),p039Initial(seed,1));}
});
