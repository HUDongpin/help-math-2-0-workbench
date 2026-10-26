import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {P034_SOURCE,p034InitialClockState,p034PiecewisePlan,p034ReduceClock,
 type P034ClockEvent,type P034ClockState,type P034DecodeReceipt,type P034FrameLedger}
 from './alg-l06-p034-audio-clock-v1';

const root=path.resolve(import.meta.dirname,'../../..');
const pinned=(relative:string,expected:string)=>{
 const bytes=fs.readFileSync(path.join(root,relative));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,relative);
 return JSON.parse(bytes.toString());
};
const ledger=pinned('migrations/shared-alg001-l06-p034/audio-source-v1/main-block-schedule-v1.json',
 P034_SOURCE.ledgerSha256) as P034FrameLedger;
const decode=pinned('migrations/shared-alg001-l06-p034/audio-source-v1/browser-decode-v1.json',
 P034_SOURCE.decodeReceiptSha256) as P034DecodeReceipt;
const sourcePlan=pinned('output/alg-l06-p034-source-planning-20261001-v1/source-plan-v1.json',
 P034_SOURCE.sourcePlanSha256);
const closure=pinned('output/alg-l06-p034-browser-decode-20261001-v1/source-and-decode-readback-v1.json',
 '5f81f1d02a0432e1d7de424e5dca369b960a8fd85a06cffa7dc381afc55bc0fd');
const stopAction=sourcePlan.actions.endStop;
const plan=p034PiecewisePlan(ledger,decode,stopAction);
const step=(state:P034ClockState,event:P034ClockEvent)=>p034ReduceClock(plan,state,event);
function playingAt(target:number){
 let state=step(p034InitialClockState(),{type:'play-main-user'}).state;
 while(state.frame<target){const next=step(state,{type:'visual-tick'});
  assert(next.accepted);state=next.state;}
 return state;
}

test('exact source ledger and Chromium binding are pinned; drift fails closed',()=>{
 assert.equal(closure.originalInventory.sha256,
  '3a0ce84d49f30ecc3ef90d91c78ec8da9a045ab0bc168c26044c99a3eae001a4');
 const original=pinned(closure.originalInventory.path,closure.originalInventory.sha256);
 assert.equal(original.fileCount,10);
 for(const receipt of [...closure.retainedSourceFiles,...closure.additions]){
  const body=fs.readFileSync(path.join(root,receipt.path));
  assert.equal(body.length,receipt.bytes);
  assert.equal(createHash('sha256').update(body).digest('hex'),receipt.sha256);
 }
 assert.equal(plan.mainBinding.sourceSha256,P034_SOURCE.mainSha256);
 assert.equal(plan.mainBinding.decodedSamples,741312);
 assert.equal(plan.spanishBinding.sourceSha256,P034_SOURCE.spanishSha256);
 assert.equal(plan.spanishBinding.decodedSamples,1504512);
 assert.equal(plan.sourceFrameToBrowserSampleAlignmentAccepted,false);
 const mutate=(fn:(draft:any)=>void)=>{const draft=structuredClone(ledger);fn(draft);
  assert.throws(()=>p034PiecewisePlan(draft,decode,stopAction),/P034_.*_DRIFT/);};
 mutate(x=>{x.frames[196].seek=0;});
 mutate(x=>{x.frames[197].blockPresent=true;});
 mutate(x=>{x.frames[226].declaredSampleStart++;});
 const bad=structuredClone(decode) as any;
 bad.results[0].pcmSha256='0'.repeat(64);
 assert.throws(()=>p034PiecewisePlan(ledger,bad,stopAction),/P034_PCM_HASH_DRIFT/);
 assert.throws(()=>p034PiecewisePlan(ledger,decode,{...stopAction,text:'stop();\n'}),
  /P034_STOP_TEXT_DRIFT/);
});

test('all interval boundaries and zero marker remain explicit and unsynthesized',()=>{
 const at=(f:number)=>plan.frames[f-1];
 assert.deepEqual([at(196).declaredSampleEnd,at(197).declaredSampleStart,
  at(197).declaredSampleEnd,at(198).declaredSampleStart,
  at(226).declaredSampleEnd,at(227).declaredSampleStart,
  at(227).declaredSampleEnd,at(434).declaredSampleEnd],
  [359424,359424,359424,359424,359424,359424,361152,741312]);
 assert.deepEqual([at(197).samples,at(197).seek,at(197).mp3Bytes],[0,-2300,0]);
 assert(plan.frames.slice(197,226).every(row=>!row.blockPresent&&row.samples===0));
 assert.equal(plan.negativeSeek.runtimeEffect,'unresolved');
});

test('197 marker and 198–226 block gap are observations during one continuous main run',()=>{
 let state=playingAt(196);
 const firstRunEpoch=state.mainEpoch;
 const marker=step(state,{type:'visual-tick'});state=marker.state;
 assert.equal(state.frame,197);
 assert.equal(state.mainPlayRequested,true);
 assert.equal(state.mainEpoch,firstRunEpoch);
 assert.deepEqual(marker.effects,[{kind:'commit-frame',frame:197}]);
 for(let f=198;f<=226;f++){
  const next=step(state,{type:'visual-tick'});state=next.state;
  assert.equal(state.frame,f);assert.equal(plan.frames[f-1].declaredSampleEnd,359424);
  assert.equal(state.mainPlayRequested,true);assert.equal(state.mainEpoch,firstRunEpoch);
  assert.deepEqual(next.effects,[{kind:'commit-frame',frame:f}]);
 }
 const resumed=step(state,{type:'visual-tick'});
 assert.equal(resumed.state.frame,227);assert.equal(resumed.state.mainPlayRequested,true);
 assert.equal(resumed.state.mainEpoch,firstRunEpoch);
 assert.deepEqual(resumed.effects,[{kind:'commit-frame',frame:227}]);
 assert.equal(step(resumed.state,{type:'main-native-onended',mainEpoch:firstRunEpoch}).accepted,true);
});

test('Pause holds visual frame; Replay retires ownership and cannot autoplay',()=>{
 let state=playingAt(205);
 const paused=step(state,{type:'pause'});state=paused.state;
 assert.equal(state.phase,'paused');assert.equal(state.frame,205);
 assert.equal(step(state,{type:'visual-tick'}).accepted,false);
 const oldEpoch=state.mainEpoch;
 const replay=step(state,{type:'replay'});state=replay.state;
 assert.equal(state.frame,1);assert.equal(state.phase,'held');
 assert.equal(state.mainPlayRequested,false);assert.equal(state.mainNativeEofObserved,false);
 assert(replay.effects.some(effect=>effect.kind==='request-main-replay'));
 assert(!replay.effects.some(effect=>effect.kind==='request-main-start'));
 assert.equal(step(state,{type:'main-native-onended',mainEpoch:oldEpoch}).accepted,false);
});

test('Spanish audio is explicit, separate, and never auto-resumes main',()=>{
 let state=playingAt(100);const oldEpoch=state.mainEpoch;
 const selected=step(state,{type:'start-spanish-user'});state=selected.state;
 assert.equal(state.selectedAudio,'spanish');assert.equal(state.frame,100);
 assert.deepEqual(selected.effects.map(effect=>effect.kind),
  ['request-main-pause','request-spanish-start']);
 assert.equal(step(state,{type:'visual-tick'}).accepted,false);
 assert.equal(step(state,{type:'main-native-onended',mainEpoch:oldEpoch}).accepted,false);
 const saEpoch=state.spanishEpoch;
 state=step(state,{type:'spanish-native-onended',spanishEpoch:saEpoch}).state;
 assert.equal(state.spanishNativeEofObserved,true);
 const returned=step(state,{type:'return-main'});state=returned.state;
 assert.equal(state.selectedAudio,'main');assert.equal(state.phase,'paused');
 assert.equal(state.frame,100);assert.equal(state.mainPlayRequested,false);
 assert.equal(returned.effects.length,0);
 assert.equal(step(state,{type:'spanish-native-onended',spanishEpoch:saEpoch}).accepted,false);
 const explicit=step(state,{type:'play-main-user'});
 assert(explicit.effects.some(effect=>effect.kind==='request-main-start'&&
  effect.sourceFrame===100&&effect.decoderSeek==='not-requested'));
});

test('source stop, full decoded cursor and pending state never fabricate native EOF',()=>{
 let state=playingAt(433);
 assert.equal(state.phase,'source-stop-held');
 assert.equal(state.mainNativeEofObserved,false);
 assert.equal(state.lessonCompleted,false);
 assert.equal(step(state,{type:'visual-tick'}).accepted,false);
 // The shared transport's buffer-ended phase can also arise from explicit seek.
 // It is not accepted as a native onended event by this pure proposal.
 assert.throws(()=>p034ReduceClock(plan,state,{type:'buffer-ended'} as unknown as P034ClockEvent),
  /P034_UNKNOWN_EVENT/);
 const pending=step(state,{type:'main-native-eof-pending',mainEpoch:state.mainEpoch});
 state=pending.state;assert.equal(state.mainNativeEofPending,true);
 assert.equal(state.mainNativeEofObserved,false);
 const visualHold=step(state,{type:'pause'});state=visualHold.state;
 assert.equal(state.mainPlayRequested,true);
 assert(!visualHold.effects.some(effect=>effect.kind==='request-main-pause'));
 assert.equal(step(state,{type:'start-spanish-user'}).accepted,false);
 const ended=step(state,{type:'main-native-onended',mainEpoch:state.mainEpoch});
 assert.equal(ended.state.mainNativeEofObserved,true);
 assert.equal(ended.state.lessonCompleted,false);
 assert.equal(ended.state.mainNativeEofPending,false);
});

test('explicit Pause at authored stop may resume an unfinished main tail without seeking',()=>{
 let state=playingAt(433);
 assert.equal(state.mainPlayRequested,true);
 const held=step(state,{type:'pause'});state=held.state;
 assert.equal(state.phase,'paused');
 assert(held.effects.some(effect=>effect.kind==='request-main-pause'));
 const resumed=step(state,{type:'play-main-user'});
 assert.equal(resumed.accepted,true);
 assert.deepEqual(resumed.effects,[{kind:'request-main-start',sourceFrame:433,
  decoderSeek:'not-requested'}]);
 assert.equal(resumed.state.mainNativeEofObserved,false);
});

test('early native EOF continues visual frames through the gap without restarting audio',()=>{
 let state=playingAt(100);
 state=step(state,{type:'main-native-onended',mainEpoch:state.mainEpoch}).state;
 assert.equal(state.mainNativeEofObserved,true);
 while(state.frame<227){const next=step(state,{type:'visual-tick'});state=next.state;
  assert(!next.effects.some(effect=>effect.kind==='request-main-start'));}
 assert.equal(state.mainPlayRequested,false);
 const epoch=state.mainEpoch;
 state=step(state,{type:'close'}).state;
 assert.equal(state.phase,'closed');assert.equal(state.lessonCompleted,false);
 assert.equal(step(state,{type:'main-native-onended',mainEpoch:epoch}).accepted,false);
});
