import assert from 'node:assert/strict';
import test from 'node:test';
import {createDatL05SourceInteraction,reduceDatL05SourceInteraction as step,selectDatL05Feedback,DAT_L05_SOURCE_IDS,type DatL05SourceInteraction} from '../src/dat-l05-source-interaction';
const drop=(s:DatL05SourceInteraction,id:typeof DAT_L05_SOURCE_IDS[number],target:string|null,seed=0)=>{
  const pressed=step(s,{type:'press',sourceId:id});assert(pressed.accepted);assert(pressed.retireFeedback);
  const result=step(pressed.state,{type:'drop',targetId:target as 'Tar_1'|null,seed});assert(result.accepted);return result.state;
};
test('source drop locks and scores immediately, but feedback completion owns main resume',()=>{
 let s=createDatL05SourceInteraction();for(let i=0;i<5;i++){const id=DAT_L05_SOURCE_IDS[i];s=drop(s,id,'Tar_'+(i+1));assert.equal(s.correctDrops,i+1);assert(s.locked.includes(id));assert.equal(s.sourceMainFrame,238);const r=step(s,{type:'press',sourceId:id});assert(!r.accepted);assert.equal(r.state,s);s=step(s,{type:'feedback-finished',epoch:s.epoch}).state;assert.equal(s.sourceMainFrame,i===4?239:238);}assert.equal(s.phase,'resumed');
});
test('wrong feedback has no dismissal and only its terminal event increments the source counter',()=>{
 let s=drop(createDatL05SourceInteraction(),'Src_1',null);assert.equal(s.finishedWrongFeedback,0);assert.equal(s.correctDrops,0);assert.deepEqual(s.locked,[]);s=step(s,{type:'feedback-finished',epoch:s.epoch}).state;assert.equal(s.finishedWrongFeedback,1);assert.equal(s.sourceMainFrame,238);assert.equal(s.phase,'selecting');
});
test('pressing a different unlocked source retires unfinished wrong feedback and rejects its late callback',()=>{
 const first=drop(createDatL05SourceInteraction(),'Src_1','Tar_5'),oldEpoch=first.epoch;const r=step(first,{type:'press',sourceId:'Src_2'});assert(r.accepted&&r.retireFeedback);assert.equal(r.state.feedback,null);assert.equal(r.state.finishedWrongFeedback,0);const late=step(r.state,{type:'feedback-finished',epoch:oldEpoch});assert(!late.accepted);assert.equal(late.state,r.state);
});
test('a correct item stays locked when its feedback is interrupted by the next drag',()=>{
 let s=drop(createDatL05SourceInteraction(),'Src_1','Tar_1');s=drop(s,'Src_2','Tar_2');assert.deepEqual(s.locked,['Src_1','Src_2']);assert.equal(s.correctDrops,2);assert.equal(s.sourceMainFrame,238);assert.equal(step(s,{type:'press',sourceId:'Src_1'}).accepted,false);
});
test('all 120 item orders can interrupt intermediate feedback and only the final right terminal resumes',()=>{
 function permutations<T>(a:T[]):T[][]{return a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(r=>[v,...r])):[[]];}
 const orders=permutations([...DAT_L05_SOURCE_IDS]);assert.equal(orders.length,120);
 for(const order of orders){let s=createDatL05SourceInteraction();const epochs=[];for(const id of order){s=drop(s,id,'Tar_'+id.at(-1));epochs.push(s.epoch);assert.equal(s.sourceMainFrame,238);}for(const epoch of epochs.slice(0,-1))assert.equal(step(s,{type:'feedback-finished',epoch}).accepted,false);s=step(s,{type:'feedback-finished',epoch:s.epoch}).state;assert.equal(s.phase,'resumed');assert.equal(s.sourceMainFrame,239);assert.equal(s.correctDrops,5);}
});
test('all seven source feedback variants retain their source host cardinalities',()=>{
 assert.deepEqual([...new Set(Array.from({length:12},(_,i)=>selectDatL05Feedback('wrong',i)))],[202,214,226]);assert.deepEqual([...new Set(Array.from({length:12},(_,i)=>selectDatL05Feedback('right',i)))],[314,258,294,266]);for(const seed of [-1,NaN,Infinity,1.5])assert.throws(()=>selectDatL05Feedback('right',seed));
});
test('all twenty incorrect named targets plus outside drop preserve positions and score',()=>{
 for(const id of DAT_L05_SOURCE_IDS)for(const target of [null,'Tar_1','Tar_2','Tar_3','Tar_4','Tar_5']){if(target?.at(-1)===id.at(-1))continue;const s=drop(createDatL05SourceInteraction(),id,target);assert.equal(s.feedback?.kind,'wrong');assert.equal(s.correctDrops,0);assert.deepEqual(s.locked,[]);}
});
test('Replay clears locked items, unfinished feedback and counters and invalidates prior callback',()=>{
 const s=drop(createDatL05SourceInteraction(),'Src_1','Tar_1'),r=step(s,{type:'replay'});assert(r.retireFeedback);assert.deepEqual(r.state.locked,[]);assert.equal(r.state.correctDrops,0);assert.equal(r.state.finishedWrongFeedback,0);assert.equal(r.state.sourceMainFrame,238);assert.equal(r.state.modernQuizTryCountReset,true);assert.equal(r.state.originalRuntimeAccepted,false);assert(!step(r.state,{type:'feedback-finished',epoch:s.epoch}).accepted);
});
test('invalid or repeated events cannot fabricate source score or completion',()=>{
 let s=createDatL05SourceInteraction();assert(!step(s,{type:'drop',targetId:'Tar_1',seed:0}).accepted);assert(!step(s,{type:'press',sourceId:'Src_9' as 'Src_1'}).accepted);assert(!step(s,{type:'feedback-finished',epoch:0}).accepted);s=step(s,{type:'press',sourceId:'Src_1'}).state;assert(!step(s,{type:'press',sourceId:'Src_2'}).accepted);assert(!step(s,{type:'drop',targetId:'Tar_9' as 'Tar_1',seed:0}).accepted);assert(!step(s,{type:'drop',targetId:'Tar_1',seed:NaN}).accepted);assert.equal(s.correctDrops,0);
});
