import {test} from 'node:test';import assert from 'node:assert/strict';
import {P052_CAPTURE_SCENARIOS,p052CaptureState,type P052CaptureRequest,type P052CaptureScenario} from '../src/nms-l02-p052-capture-state-v1';
import {createP052State,reduceP052} from '../src/nms-l02-p052-state-v1';
const capture=(scenario:P052CaptureScenario,frame:number=P052_CAPTURE_SCENARIOS[scenario].first,seed=0)=>
 p052CaptureState({scenario,frame,seed,language:'en',frameDomain:'sprite-350'});
test('all declared frames in both languages replay deterministically through the real reducer',()=>{
 for(const scenario of Object.keys(P052_CAPTURE_SCENARIOS) as P052CaptureScenario[]){
  const def=P052_CAPTURE_SCENARIOS[scenario];
  for(const language of ['en','es'] as const)for(let frame=def.first;frame<=def.last;frame++){
   const request={scenario,frame,language,seed:17,frameDomain:'sprite-350' as const};
   const result=p052CaptureState(request);assert.deepEqual(result,p052CaptureState(request));
   let state=createP052State(17);
   for(const checkpoint of result.checkpoints){
    assert.deepEqual(checkpoint.before,state);state=reduceP052(state,checkpoint.event);
    assert.deepEqual(checkpoint.after,state);assert.ok(checkpoint.basis.length>8);
   }
   assert.deepEqual(result.state,state);assert.equal(state.frame,frame);
   assert.equal(result.frameDomain,'sprite-350');assert.equal(result.rootFrame,6);
  }
 }
});
test('branch checkpoints retain independent source outcomes and reset semantics',()=>{
 assert.equal(capture('first-wrong').state.phase,'wrong');
 const reset=capture('retry-reset').state;
 assert.equal(reset.percent,0);assert.equal(reset.tryCount,1);assert.equal(reset.wrongOrdinal,1);
 for(const scenario of ['first-correct','retry-correct'] as const){
  const s=capture(scenario).state;assert.equal(s.phase,'right');assert.equal(s.percent,75);
  assert.equal(s.outcome,'correct');assert.equal(s.audioCue,'correct');
 }
 const reveal=capture('second-wrong-reveal').state;
 assert.equal(reveal.percent,75);assert.equal(reveal.outcome,'revealed');assert.equal(reveal.tryCount,0);
 assert.equal(reveal.wrongOrdinal,2);assert.match(reveal.audioCue!,/^wrong-S[1-4]$/);
});
test('help nesting, return, pause and Replay are reached without synthetic state injection',()=>{
 for(const scenario of ['help','glossary-square','glossary-column','glossary-return','paused-help'] as const){
  const s=capture(scenario).state;assert.equal(s.help,true);assert.equal(s.percent,42);
 }
 assert.equal(capture('glossary-square').state.glossary,'Square');
 assert.equal(capture('glossary-column').state.glossary,'Column');
 assert.equal(capture('glossary-return').state.glossary,null);
 assert.equal(capture('help-return').state.help,false);
 assert.equal(capture('paused-help').state.paused,true);
 assert.deepEqual(capture('replay-from-glossary').state,createP052State(0,1));
});
test('intro preserves every authored frame; both outros remain uncompleted at156',()=>{
 for(let f=1;f<=114;f++)assert.equal(capture('intro',f).state.phase,'intro');
 for(const scenario of ['outro-correct','outro-revealed'] as const){
  assert.equal(capture(scenario,156).state.phase,'outro');
  assert.equal(capture(scenario,156).state.percent,75);
  assert.deepEqual(capture(scenario,116).entryState,capture(scenario,156).entryState);
 }
 assert.equal(capture('complete').state.phase,'complete');
});
test('seed-driven wrong cues cover all four branches without overriding the selected cue',()=>{
 const seen=new Set<string>();for(let seed=0;seed<64;seed++)seen.add(capture('first-wrong',115,seed).state.audioCue!);
 assert.deepEqual([...seen].sort(),['wrong-S1','wrong-S2','wrong-S3','wrong-S4']);
});
test('capture rejects impossible combinations rather than clamping to a different identity',()=>{
 const base:P052CaptureRequest={scenario:'intro',frame:1,seed:0,language:'en',frameDomain:'sprite-350'};
 for(const changes of [{frameDomain:'root'},{scenario:'toString'},{scenario:'absent'},
  {frame:115},{frame:0},{frame:1.5},{frame:NaN},{seed:-1},{language:'fr'},
  {scenario:'complete',frame:115},{scenario:'first-wrong',frame:116}]){
  assert.throws(()=>p052CaptureState({...base,...changes} as P052CaptureRequest));
 }
});
