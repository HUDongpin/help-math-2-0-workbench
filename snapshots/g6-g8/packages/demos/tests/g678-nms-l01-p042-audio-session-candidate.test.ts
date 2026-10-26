import assert from 'node:assert/strict';
import test from 'node:test';
import {G678_NMS_L01_P042_AUDIO_SESSION_IR as IR,createP042AudioSession,reduceP042AudioSession as reduce,
  inspectP042DecoderCursor,inspectP042FrameEntry,type P042AudioIntent,type P042AudioSession,type P042DecoderProfileId} from '../src/g678-nms-l01-p042-audio-session-candidate';

function accepted(state:P042AudioSession,intent:P042AudioIntent){const result=reduce(state,intent);assert.equal(result.accepted,true,result.reason);return result.state;}
function ready(id:P042DecoderProfileId,now=0,reducedMotion=false){const p=IR.decoderProfiles.find(p=>p.id===id)!;
  let state=createP042AudioSession(id,'en',{nowMs:now,reducedMotion});state=accepted(state,{type:'request-load',nowMs:now});
  return accepted(state,{type:'buffer-ready',nowMs:now+20,epoch:state.epoch,sampleRate:p.sampleRate,length:p.length,channels:p.channels,pcmSha256:p.pcmSha256});}
function playing(id:P042DecoderProfileId){let state=ready(id);state=accepted(state,{type:'request-play',nowMs:25,activation:'user'});
  return accepted(state,{type:'play-result',nowMs:30,epoch:state.epoch,playRequest:state.playRequest,allowed:true});}

test('source IR retains all118 source headers, empty9, root6/child125 and unresolved semantics',()=>{
  assert.equal(IR.timeline.rootFrameCount,10);assert.equal(IR.timeline.rootEntryFrame,6);assert.equal(IR.timeline.frameCount,125);assert.equal(IR.timeline.fps,12);
  assert.equal(IR.sourceTiming.nativeRate,22050);assert.equal(IR.sourceTiming.latencyField,1673);assert.equal(IR.sourceTiming.automaticPrimingTrim,0);
  assert.equal(IR.sourceTiming.blocks.length,118);assert.equal(IR.sourceTiming.declaredSampleCount,216576);
  let prefix=0;for(const [i,block]of IR.sourceTiming.blocks.entries()){assert.equal(block.frame,i+8);assert.equal(block.declaredSamplesBeforeBlock,prefix);prefix+=block.sampleCount;}
  assert.equal(prefix,216576);assert.equal(IR.sourceTiming.blocks[0].seekSamples,1673);
  assert.ok(Object.isFrozen(IR)&&Object.isFrozen(IR.sourceTiming.blocks)&&IR.sourceTiming.blocks.every(Object.isFrozen));
  assert.equal(IR.sourceTiming.blocks[1].frame,9);assert.equal(IR.sourceTiming.blocks[1].sampleCount,0);assert.equal(IR.sourceTiming.blocks[1].bytes,4);
  assert.equal(IR.sourceTiming.blocks.at(-1)!.seekSamples,493);assert.ok(Object.values(IR.gates).every(value=>value===false));
});
test('measured profiles preserve native216576/default471457 and reference tail1 without fabricated sample',()=>{
  assert.deepEqual(IR.decoderProfiles.map(p=>[p.sampleRate,p.length,p.relativeOriginSamples,p.referenceExcludedSuffix]),[[22050,216576,0,0],[48000,471457,0,1]]);
  for(const p of IR.decoderProfiles){assert.equal(p.sourceAlignmentProven,false);assert.equal(p.spokenLanguage,'unestablished');}
});
test('all source frame-entry queries retain facts but cannot smuggle in a browser seek formula',()=>{
  for(let frame=1;frame<=125;frame++){const info=inspectP042FrameEntry(frame);assert.ok(info.status!=='invalid-source-frame');assert.equal(info.decodedSampleTarget,null);assert.equal(info.sourceAlignmentProven,false);
    assert.equal(info.status,frame<8?'pre-stream-source-frame':'source-seek-policy-unresolved');}
  for(const frame of [0,126,8.5,NaN,Infinity])assert.equal(inspectP042FrameEntry(frame).status,'invalid-source-frame');
});

for(const p of IR.decoderProfiles){
  test(`${p.sampleRate}: readiness and delayed play acknowledgment hold cursor zero; no catch-up`,()=>{
    let state=createP042AudioSession(p.id,'en');assert.equal(reduce(state,{type:'request-play',nowMs:0,activation:'user'}).accepted,false);
    state=accepted(state,{type:'request-load',nowMs:10});assert.equal(state.phase,'loading');
    const wrong=reduce(state,{type:'buffer-ready',nowMs:400,epoch:state.epoch,sampleRate:p.sampleRate,length:p.length+1,channels:1,pcmSha256:p.pcmSha256});
    assert.equal(wrong.accepted,false);assert.equal(wrong.state,state);
    state=accepted(state,{type:'buffer-ready',nowMs:500,epoch:state.epoch,sampleRate:p.sampleRate,length:p.length,channels:1,pcmSha256:p.pcmSha256});
    state=accepted(state,{type:'request-play',nowMs:1000,activation:'automatic'});assert.equal(state.cursorDecodedSamples,0);
    assert.equal(reduce(state,{type:'tick',nowMs:1500}).accepted,false);
    state=accepted(state,{type:'play-result',nowMs:1600,epoch:state.epoch,playRequest:state.playRequest,allowed:true});
    state=accepted(state,{type:'tick',nowMs:1600.125});assert.equal(state.cursorDecodedSamples,p.sampleRate*.125/1000);
  });
  test(`${p.sampleRate}: fractional pause retains subframe cursor across long wait and acknowledged resume`,()=>{
    let state=playing(p.id);state=accepted(state,{type:'pause',nowMs:40.125});const cursor=state.cursorDecodedSamples;
    assert.equal(cursor,10.125*p.sampleRate/1000);assert.equal(state.anchorTimeMs,null);assert.equal(state.phase,'paused');
    const view=inspectP042DecoderCursor(state);assert.equal(view.nativeReferenceSamples,cursor*22050/p.sampleRate);assert.equal(view.sourceLatencyApplied,0);
    assert.equal(reduce(state,{type:'tick',nowMs:9999}).accepted,false);
    state=accepted(state,{type:'request-play',nowMs:10000,activation:'user'});
    state=accepted(state,{type:'play-result',nowMs:11000,epoch:state.epoch,playRequest:state.playRequest,allowed:true});
    state=accepted(state,{type:'tick',nowMs:11000.0625});assert.equal(state.cursorDecodedSamples,cursor+.0625*p.sampleRate/1000);
  });
  test(`${p.sampleRate}: many ticks do not accumulate rounding drift`,()=>{
    let state=playing(p.id);for(let i=1;i<=400;i++)state=accepted(state,{type:'tick',nowMs:30+i*.125});
    assert.equal(state.cursorDecodedSamples,p.sampleRate*.05);assert.equal(inspectP042DecoderCursor(state).fractionalElapsedSinceAnchorMs,50);
    assert.equal(state.sourceAlignment,'unresolved');assert.equal(state.lessonCompleted,false);
  });
  test(`${p.sampleRate}: autoplay rejection is visible, no automatic retry, manual retry is acknowledged`,()=>{
    let state=ready(p.id);state=accepted(state,{type:'request-play',nowMs:21,activation:'automatic'});
    state=accepted(state,{type:'play-result',nowMs:2000,epoch:state.epoch,playRequest:state.playRequest,allowed:false});assert.equal(state.phase,'play-rejected');
    assert.equal(state.cursorDecodedSamples,0);assert.equal(reduce(state,{type:'request-play',nowMs:2001,activation:'automatic'}).accepted,false);
    const priorToken=state.playRequest;state=accepted(state,{type:'request-play',nowMs:2100,activation:'user'});
    assert.equal(reduce(state,{type:'play-result',nowMs:2200,epoch:state.epoch,playRequest:priorToken,allowed:true}).accepted,false);
    state=accepted(state,{type:'play-result',nowMs:2200,epoch:state.epoch,playRequest:state.playRequest,allowed:true});assert.equal(state.phase,'playing');
  });
  test(`${p.sampleRate}: pending load cancellation and stale success/failure do not revive old epoch`,()=>{
    let state=createP042AudioSession(p.id,'en');state=accepted(state,{type:'request-load',nowMs:1});const old=state.epoch;
    state=accepted(state,{type:'pause',nowMs:2});assert.equal(state.bufferReady,false);
    for(const intent of [{type:'buffer-ready',nowMs:3,epoch:old,sampleRate:p.sampleRate,length:p.length,channels:1,pcmSha256:p.pcmSha256},
      {type:'load-failed',nowMs:3,epoch:old}]as const)assert.equal(reduce(state,intent).accepted,false);
    state=accepted(state,{type:'request-load',nowMs:4});state=accepted(state,{type:'load-failed',nowMs:5,epoch:state.epoch});assert.equal(state.phase,'load-failed');
    state=accepted(state,{type:'request-load',nowMs:6});assert.equal(state.phase,'loading');
  });
  test(`${p.sampleRate}: pause pending start retires token; no late asynchronous play`,()=>{
    let state=ready(p.id);state=accepted(state,{type:'request-play',nowMs:25,activation:'user'});const old=state;
    state=accepted(state,{type:'pause',nowMs:26});const late=reduce(state,{type:'play-result',nowMs:100,epoch:old.epoch,playRequest:old.playRequest,allowed:true});
    assert.equal(late.accepted,false);assert.equal(late.state,state);assert.equal(state.cursorDecodedSamples,0);
  });
  test(`${p.sampleRate}: decoder-coordinate seek keeps fractional sample, epoch and native scaling; frame seek denied`,()=>{
    let state=playing(p.id);const old=state.epoch;
    state=accepted(state,{type:'seek-decoder',nowMs:50,decodedSample:1234.567});assert.equal(state.cursorDecodedSamples,1234.567);assert.equal(state.epoch,old+1);
    assert.equal(inspectP042DecoderCursor(state).nativeReferenceSamples,1234.567*22050/p.sampleRate);
    for(const frame of [8,9,10,125]){const result=reduce(state,{type:'source-frame-entry',nowMs:51,frame});assert.equal(result.accepted,false);assert.equal(result.state,state);}
    for(const decodedSample of [-1,NaN,Infinity,p.length+.1])assert.equal(reduce(state,{type:'seek-decoder',nowMs:51,decodedSample}).accepted,false);
  });
  test(`${p.sampleRate}: Replay before/during/after sound resets cursor and rejects old callbacks`,()=>{
    for(const initial of [createP042AudioSession(p.id,'en'),playing(p.id)]){
      let state=accepted(initial,{type:'replay',nowMs:500});assert.equal(state.cursorDecodedSamples,0);assert.equal(state.playRequest,0);assert.equal(state.epoch,initial.epoch+1);
      assert.equal(state.phase,initial.bufferReady?'ready':'idle');assert.equal(state.anchorTimeMs,null);
      assert.equal(reduce(state,{type:'play-result',nowMs:501,epoch:initial.epoch,playRequest:initial.playRequest,allowed:true}).accepted,false);
    }
  });
  test(`${p.sampleRate}: source125 safety hold is not EOF/completion; original same-frame ordering remains unresolved`,()=>{
    let state=playing(p.id);const result=reduce(state,{type:'source-terminal',nowMs:100,frame:125});assert.equal(result.accepted,true);
    assert.match(result.reason,/candidate-safety-hold/);assert.equal(result.state.phase,'source-boundary-pending');assert.equal(result.state.lessonCompleted,false);
    assert.equal(result.state.cursorDecodedSamples,70*p.sampleRate/1000);assert.deepEqual(result.effects[1],{type:'hold',reason:'candidate-source125-safety-hold'});
    state=result.state;assert.equal(reduce(state,{type:'request-play',nowMs:101,activation:'user'}).accepted,false);
    assert.equal(reduce(state,{type:'source-terminal',nowMs:101,frame:126}).accepted,false);
    state=accepted(state,{type:'replay',nowMs:102});assert.equal(state.phase,'ready');assert.equal(state.cursorDecodedSamples,0);
  });
  test(`${p.sampleRate}: exact decoded EOF clamps without fabricating tail or declaring source completion`,()=>{
    let state=playing(p.id);state=accepted(state,{type:'tick',nowMs:20000});assert.equal(state.cursorDecodedSamples,p.length);assert.equal(state.phase,'decoder-eof-pending');
    assert.equal(state.lessonCompleted,false);assert.equal(reduce(state,{type:'tick',nowMs:21000}).accepted,false);
    assert.equal(reduce(state,{type:'request-play',nowMs:21001,activation:'user'}).accepted,false);
    state=accepted(state,{type:'replay',nowMs:22000});assert.equal(state.cursorDecodedSamples,0);assert.equal(state.phase,'ready');
  });
  test(`${p.sampleRate}: locale and close cancel all pending callbacks without a spoken-language claim`,()=>{
    let state=playing(p.id);const old=state;
    state=accepted(state,{type:'set-locale',nowMs:50,uiLocale:'es'});assert.equal(state.phase,'idle');assert.equal(state.bufferReady,false);assert.equal(state.cursorDecodedSamples,0);
    assert.equal(p.spokenLanguage,'unestablished');assert.equal(reduce(state,{type:'play-result',nowMs:51,epoch:old.epoch,playRequest:old.playRequest,allowed:true}).accepted,false);
    state=accepted(state,{type:'close',nowMs:52});assert.equal(state.phase,'closed');for(const type of ['replay','request-load','tick']as const)assert.equal(reduce(state,{type,nowMs:53}).accepted,false);
  });
  test(`${p.sampleRate}: reduced motion denies automatic play while allowing explicit engineering user start`,()=>{
    let state=ready(p.id,0,true);assert.equal(reduce(state,{type:'request-play',nowMs:21,activation:'automatic'}).accepted,false);
    state=accepted(state,{type:'request-play',nowMs:22,activation:'user'});assert.equal(state.phase,'start-pending');
  });
  test(`${p.sampleRate}: malformed input, backward clock, forged state and extra authority fields fail closed`,()=>{
    const state=playing(p.id);for(const intent of [{type:'tick',nowMs:29},{type:'tick',nowMs:NaN},{type:'tick',nowMs:35,sourceAlignment:'proven'},
      {type:'set-locale',nowMs:35,uiLocale:'fr'},{type:'play-result',nowMs:35,epoch:state.epoch,playRequest:state.playRequest,allowed:'yes'}])
      assert.equal(reduce(state,intent as P042AudioIntent).accepted,false);
    assert.equal(reduce({...state,lessonCompleted:true}as unknown as P042AudioSession,{type:'tick',nowMs:35}).accepted,false);
    assert.equal(reduce({...state,cursorDecodedSamples:-1},{type:'tick',nowMs:35}).accepted,false);
    const snapshot=JSON.stringify(state),decision=reduce(state,{type:'pause',nowMs:40});assert.equal(JSON.stringify(state),snapshot);
    assert.ok(Object.isFrozen(state)&&Object.isFrozen(decision.state)&&Object.isFrozen(decision.effects)&&Object.isFrozen(decision.effects[0]));
  });
}
test('constructors reject unsupported profiles/locales/settings instead of silently widening source scope',()=>{
  assert.throws(()=>createP042AudioSession('other'as P042DecoderProfileId,'en'));
  assert.throws(()=>createP042AudioSession(IR.decoderProfiles[0].id,'fr'as 'en'));
  assert.throws(()=>createP042AudioSession(IR.decoderProfiles[0].id,'en',{nowMs:NaN}));
  assert.throws(()=>createP042AudioSession(IR.decoderProfiles[0].id,'en',{audioUrl:'invented'}as never));
});
