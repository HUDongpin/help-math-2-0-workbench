import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P047_CARDS,P047_WORKED_EXAMPLE,p047Initial,p047Select,p047Drop,p047Cancel,p047Help,p047FinishPhase,p047Replay,type P047Practice,type P047CardId} from '../src/nms-l02-p047-practice-v1';
const finish=(s:P047Practice)=>p047FinishPhase(s,s.phaseToken);
const ready=()=>finish(p047Initial());
test('four native cards bind audited source fractions and exact mathematical ticks',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p047/audit/source-behavior-audit-v1.json',import.meta.url),'utf8'));
 assert.equal(P047_CARDS.length,audit.draggables.length);
 for(const [i,c]of P047_CARDS.entries()){const source=audit.draggables[i];assert.equal(c.sourceText,source.sourceTextId);assert.equal(c.numerator,source.fraction.numerator);assert.equal(c.denominator,source.fraction.denominator);assert.equal(c.tick/8,c.numerator/c.denominator);assert.equal(source.correctTarget,`Mc_Tar_${c.id}`);}
 assert.equal(P047_WORKED_EXAMPLE.tick/8,3/4);
});
function permutations(ids:P047CardId[]):P047CardId[][] {return ids.length?ids.flatMap(id=>permutations(ids.filter(x=>x!==id)).map(rest=>[id,...rest])):[[]];}
test('all 24 answer orders require all four matches, feedback, celebration and continuation',()=>{
 for(const order of permutations([1,2,3,4])){let s=ready();for(const [i,id]of order.entries()){
  s=p047Drop(p047Select(s,id),P047_CARDS.find(c=>c.id===id)!.tick);assert.equal(s.phase,'correct-feedback');assert.equal(s.matched.length,i+1);
  assert.equal(p047Drop(s,4),s);assert.equal(p047Help(s,true),s);
  s=finish(s);assert.equal(s.phase,i===3?'celebration':'ready');assert.equal(p047Select(s,id),s);
 }
 s=finish(s);assert.equal(s.phase,'continuation');s=finish(s);assert.equal(s.phase,'complete');assert.equal(s.matched.length,4);
 const reset=p047Replay(s);assert.equal(reset.phase,'intro');assert.deepEqual(reset.matched,[]);assert.equal(reset.attempts,0);assert.equal(reset.replay,1);
 }
});
test('wrong ticks and release outside restore availability without scoring or consuming a card',()=>{
 for(const c of P047_CARDS)for(const tick of [null,0,1,2,3,4,5,6,7,8]){if(tick===c.tick)continue;
  let s=p047Drop(p047Select(ready(),c.id),tick);assert.equal(s.phase,'wrong-feedback');assert.deepEqual(s.matched,[]);assert.equal(s.selected,null);assert.equal(s.attempts,1);
  s=finish(s);assert.equal(s.phase,'ready');s=p047Select(s,c.id);assert.equal(s.selected,c.id);
 }
});
test('help and input cancellation preserve solved cards and reject interaction while disabled',()=>{
 const intro=p047Initial();assert.equal(p047Select(intro,1),intro);
 let s=finish(p047Drop(p047Select(ready(),1),4));s=p047Select(s,2);s=p047Help(s,true);assert.equal(s.selected,null);assert.deepEqual(s.matched,[1]);assert.equal(p047Select(s,3),s);assert.equal(p047Drop(s,2),s);
 s=p047Select(p047Help(s,false),2);s=p047Cancel(s);assert.equal(s.selected,null);assert.equal(s.attempts,1);assert.deepEqual(s.matched,[1]);
});
test('Replay rejects stale callbacks even after re-entering the same feedback phase',()=>{
 let s=p047Drop(p047Select(ready(),1),0);const token=s.phaseToken;
 s=p047Replay(s);assert.equal(p047FinishPhase(s,token),s);s=finish(s);s=p047Drop(p047Select(s,1),0);assert.equal(p047FinishPhase(s,token),s);
 const done=finish(s);assert.equal(p047FinishPhase(done,s.phaseToken),done);
});
test('seeded wrong branches are reproducible and cover all four source branches',()=>{
 const run=()=>{let s=ready();const branches:number[]=[];for(let i=0;i<32;i++){s=p047Drop(p047Select(s,1),0);branches.push(s.wrongBranch);s=finish(s);}return branches;};
 assert.deepEqual(run(),run());assert.deepEqual([...new Set(run())].sort(),[0,1,2,3]);
});
