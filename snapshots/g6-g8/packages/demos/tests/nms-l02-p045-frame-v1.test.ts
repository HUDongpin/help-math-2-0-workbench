import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p045ModuleFrame,P045_FRAME_DOMAINS} from '../src/nms-l02-p045-frame-v1';
import type {RuntimeContext} from '../src/contract';
const query=(frame:number,extra:Partial<RuntimeContext>={})=>p045ModuleFrame(frame,{frame,scenario:'source-inspection',lang:'en',seed:0,...extra});
test('source domain counts and direct seeks preserve uncompleted practice',()=>{
  const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p045/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  for(const [id,count]of Object.entries(P045_FRAME_DOMAINS))assert.equal(source.timelines.find((t:{timelineId:string})=>t.timelineId===id).declaredFrameCount,count);
  assert.equal(query(5,{frameDomain:'root'}).mainFrame,null);assert.equal(query(6,{frameDomain:'root'}).mainFrame,1);
  assert.equal(query(449).state.phase,'intro');assert.equal(query(450).state.phase,'ready');
  assert.equal(query(498).state.phase,'ready');assert.equal(query(498).state.questionIndex,0);assert.equal(query(498).postStopInspection,true);
});
test('recipes distinguish reveal entry, feedback and explicit three-question completion',()=>{
  for(const lang of ['en','es']as const)for(const seed of [0,17,0xffffffff]){
    assert.equal(query(450,{lang,seed,scenario:'first-wrong'}).state.phase,'wrong-feedback');
    assert.equal(query(450,{lang,seed,scenario:'first-correct'}).state.phase,'correct-feedback');
    for(const [frame,phase]of [[1,'ready'],[2,'answer-reveal'],[24,'answer-reveal'],[25,'awaiting-new']]as const)
      assert.equal(query(frame,{lang,seed,frameDomain:'sprite-189',scenario:'second-wrong-reveal'}).state.phase,phase);
    assert.equal(query(497,{lang,seed,scenario:'three-questions-complete'}).state.phase,'continuation');
    const end=query(498,{lang,seed,scenario:'three-questions-complete',replay:2});assert.equal(end.state.phase,'complete');assert.equal(end.state.questionIndex,2);assert.equal(end.state.replay,2);
  }
});
test('invalid identity, ranges and scenario-domain combinations fail closed',()=>{
  for(const frame of [0,499,1.5,NaN])assert.throws(()=>query(frame));
  for(const extra of [{seed:-1},{rootFrame:7},{scenario:'first-wrong'},{scenario:'three-questions-complete'},{replay:-1},{frameDomain:'sprite-197'},{frame:2}])assert.throws(()=>query(1,extra));
});
