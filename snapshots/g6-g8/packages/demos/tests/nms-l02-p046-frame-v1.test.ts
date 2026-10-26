import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p046ModuleFrame,P046_FRAME_DOMAINS} from '../src/nms-l02-p046-frame-v1';
import type {RuntimeContext} from '../src/contract';
const query=(frame:number,extra:Partial<RuntimeContext>={})=>p046ModuleFrame(frame,{frame,scenario:'source-inspection',lang:'en',seed:0,...extra});
test('source domain counts and direct seeks preserve uncompleted practice',()=>{
  const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p046/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  const placement=source.timelines.find((t:{timelineId:string})=>t.timelineId==='root').events.find((e:{characterId?:number})=>e.characterId===205);assert.equal(placement.frame,6);assert.equal(placement.name.text,'animation');
  for(const [id,count]of Object.entries(P046_FRAME_DOMAINS))assert.equal(source.timelines.find((t:{timelineId:string})=>t.timelineId===id).declaredFrameCount,count);
  assert.equal(query(5,{frameDomain:'root'}).mainFrame,null);assert.equal(query(6,{frameDomain:'root'}).mainFrame,1);
  assert.equal(query(653).state.phase,'intro');assert.equal(query(654).state.phase,'ready');
  assert.equal(query(706).state.phase,'ready');assert.equal(query(706).state.questionIndex,0);assert.equal(query(706).postStopInspection,true);
});
test('recipes distinguish reveal entry, feedback and explicit three-question completion',()=>{
  for(const lang of ['en','es']as const)for(const seed of [0,17,0xffffffff]){
    assert.equal(query(654,{lang,seed,scenario:'first-wrong'}).state.phase,'wrong-feedback');
    assert.equal(query(654,{lang,seed,scenario:'first-correct'}).state.phase,'correct-feedback');
    for(const [frame,phase]of [[1,'ready'],[2,'answer-reveal'],[24,'answer-reveal'],[25,'awaiting-new']]as const)
      assert.equal(query(frame,{lang,seed,frameDomain:'sprite-168',scenario:'second-wrong-reveal'}).state.phase,phase);
    assert.equal(query(705,{lang,seed,scenario:'three-questions-complete'}).state.phase,'continuation');
    const end=query(706,{lang,seed,scenario:'three-questions-complete',replay:2});assert.equal(end.state.phase,'complete');assert.equal(end.state.questionIndex,2);assert.equal(end.state.replay,2);
  }
});
test('invalid identity, ranges and scenario-domain combinations fail closed',()=>{
  for(const frame of [0,707,1.5,NaN])assert.throws(()=>query(frame));
  for(const extra of [{seed:-1},{rootFrame:7},{scenario:'first-wrong'},{scenario:'three-questions-complete'},{replay:-1},{frameDomain:'sprite-197'},{frame:2}])assert.throws(()=>query(1,extra));
});
