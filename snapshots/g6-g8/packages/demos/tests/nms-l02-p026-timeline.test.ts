import assert from 'node:assert/strict';
import test from 'node:test';
import {p026BuildTrace,p026ModuleFrame,P026_SCENARIOS,P026_TRACE_FRAME_COUNTS} from '../src/nms-l02-p026-timeline-v1';
import {p026Initial,p026Choose,p026Tick} from '../src/nms-l02-p026-state-v1';

test('native traces replay every scheduled input and tick across both stopped rounds',()=>{
 for(const seed of [0,1,42,0xffffffff])for(const scenario of P026_SCENARIOS){
  const trace=p026BuildTrace(seed,scenario,2);let state=p026Initial(seed,2);
  assert.equal(trace.states.length,P026_TRACE_FRAME_COUNTS[scenario]);
  for(let tick=1;tick<trace.states.length;tick++){
   for(const event of trace.events.filter(e=>e.tick===tick))state=p026Choose(state,event.cardId);
   state=p026Tick(state);assert.deepEqual(trace.states[tick],state);
   if(['moving-first','second','moving-second','returning','ready'].includes(state.phase))assert.equal(state.mainFrame,state.round===1?392:425);
  }
  assert.equal(state.phase,'completed');assert.equal(state.mainFrame,491);assert.equal(state.matches,4);
  assert.equal(state.attempts,scenario==='correct-pairs'?8:10);assert.ok(state.cards.every(c=>c.removed));
  assert.equal(trace.events.length,scenario==='correct-pairs'?16:20);
  assert.deepEqual(trace,p026BuildTrace(seed,scenario,2));
 }
});
test('main queries retain first visit and native queries expose independent board motion',()=>{
 for(const scenario of P026_SCENARIOS)for(const lang of ['en','es']as const){
  for(let frame=1;frame<=491;frame++){
   const s=p026ModuleFrame(frame,{frame,frameDomain:'sprite-82',scenario,lang,seed:42});assert.equal(s.mainFrame,frame);assert.equal(s.rootFrame,6);
   if(frame===392||frame===425)assert.equal(s.game?.phase,'ready');
  }
  for(let frame=1;frame<=P026_TRACE_FRAME_COUNTS[scenario];frame++){
   const s=p026ModuleFrame(frame,{frame,frameDomain:'native-interaction',scenario,lang,seed:42});assert.equal(s.traceTick,frame-1);assert.equal(s.game?.replay,0);
  }
 }
 const q=(frame:number)=>p026ModuleFrame(frame,{frame,frameDomain:'root',scenario:'correct-pairs',lang:'en',seed:0});
 assert.equal(q(5).game,null);for(let f=6;f<=10;f++)assert.equal(q(f).mainFrame,1);
});
test('query identity fails closed on wrong frame, root, scenario, seed, replay and domain',()=>{
 const base={frame:1,scenario:'correct-pairs',lang:'en' as const,seed:0};
 for(const patch of [{frame:2},{scenario:'source-instruction'},{seed:-1},{seed:1.2},{replay:-1},{frameDomain:'sprite-10'},{rootFrame:7},{lang:'fr'}])assert.throws(()=>p026ModuleFrame(1,{...base,...patch} as typeof base));
 assert.throws(()=>p026ModuleFrame(492,{...base,frame:492,frameDomain:'sprite-82'}));
 assert.throws(()=>p026ModuleFrame(11,{...base,frame:11,frameDomain:'root'}));
});
