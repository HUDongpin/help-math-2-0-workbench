import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p044ModuleFrame,P044_FRAME_DOMAINS} from '../src/nms-l02-p044-frame-v1';
import type {RuntimeContext} from '../src/contract';
const query=(frame:number,extra:Partial<RuntimeContext>={})=>p044ModuleFrame(frame,{frame,scenario:'source-inspection',lang:'en',seed:0,...extra});
test('declared domains match extracted source and direct lastframe inspection never completes questions',()=>{
  const s=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p044/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  for(const [id,count]of Object.entries(P044_FRAME_DOMAINS))assert.equal(s.timelines.find((t:{timelineId:string})=>t.timelineId===id).declaredFrameCount,count);
  assert.equal(query(5,{frameDomain:'root'}).mainFrame,null);assert.equal(query(6,{frameDomain:'root'}).mainFrame,1);
  assert.equal(query(360).state.phase,'intro');assert.equal(query(361).state.phase,'ready');
  assert.equal(query(393).state.phase,'ready');assert.equal(query(393).state.questionIndex,0);assert.equal(query(393).postStopInspection,true);
});
test('explicit bilingual recipes reconstruct feedback, allpartstates, reveal boundary and completion',()=>{
  for(const lang of ['en','es']as const)for(const seed of [0,17,0xffffffff]){
    for(let f=1;f<=20;f++){const q=query(f,{lang,seed,frameDomain:'sprite-219',scenario:'partition-selected'});assert.equal(q.state.parts,f);assert.deepEqual(q.state.selected,[1]);}
    assert.equal(query(1,{lang,seed,frameDomain:'sprite-234',scenario:'first-wrong'}).state.phase,'wrong-feedback');
    assert.equal(query(1,{lang,seed,frameDomain:'sprite-238',scenario:'first-correct'}).state.phase,'correct-feedback');
    assert.equal(query(24,{lang,seed,frameDomain:'sprite-235',scenario:'second-wrong-reveal'}).state.phase,'answer-reveal');
    assert.equal(query(25,{lang,seed,frameDomain:'sprite-235',scenario:'second-wrong-reveal'}).state.phase,'awaiting-new');
    const completed=query(393,{lang,seed,scenario:'four-questions-complete',replay:2});assert.equal(completed.state.phase,'complete');assert.equal(completed.state.questionIndex,3);assert.equal(completed.state.replay,2);
  }
});
test('invalid ranges and cross-scenario domains fail closed',()=>{
  for(const frame of [0,394,1.5,NaN])assert.throws(()=>query(frame));
  for(const extra of [{seed:-1},{rootFrame:7},{scenario:'first-wrong'},{scenario:'four-questions-complete'},{replay:-1},{frameDomain:'sprite-242'}])assert.throws(()=>query(1,extra));
});
