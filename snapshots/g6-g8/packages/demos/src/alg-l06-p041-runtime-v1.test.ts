import assert from 'node:assert/strict';
import test from 'node:test';
import {P041PageRuntimeV1} from './alg-l06-p041-runtime-v1';
import type {P041AudioId} from './alg-l06-p041-audio-owner-v1';

class FakeAudio {
  owner:P041AudioId|null=null;now=0;anchor:number|null=null;epoch=0;
  phase='idle';
  pauses=0;replays=0;closed=0;
  syncStateEpoch(epoch:number){if(epoch<this.epoch)return false;this.epoch=epoch;return true;}
  async select(id:P041AudioId,epoch:number,_load:unknown,autostart=false){
    this.syncStateEpoch(epoch);this.owner=id;this.anchor=autostart?this.now:null;
    this.phase=autostart?'playing':'ready';
    return {accepted:true,reason:'ready'};
  }
  async activatePrepared(id:P041AudioId){this.owner=id;this.anchor=this.now;
    this.phase='playing';
    return {accepted:true,reason:'playing'};}
  async play(){this.anchor=this.now;this.phase='playing';return {accepted:true,reason:'playing'};}
  pause(){this.pauses++;this.phase='paused';}
  replay(epoch:number){this.syncStateEpoch(epoch);this.replays++;this.owner='main';this.anchor=null;this.phase='ready';return true;}
  setVolume(){return true;}
  returnFromSpanish(){this.owner='main';this.anchor=null;this.phase='paused';return true;}
  snapshot(){return {owner:this.owner,
    selected:this.owner?{contextTime:this.now,playbackAnchor:this.anchor===null?null:{contextTime:this.anchor,decodedSample:0},phase:this.phase}:null,
    main:null,spanish:null,session:1,stateEpoch:this.epoch,closed:!!this.closed};}
  async close(){this.closed++;}
}

test('P041 active context clock holds quiz 752, selected wrong popup and Replay frame one',async()=>{
  const audio=new FakeAudio();
  const painted:number[]=[];
  const runtime=new P041PageRuntimeV1({audio:audio as never,
    paint:state=>{painted.push(state.mainFrame);return true;},
    loadMain:async()=>new ArrayBuffer(1),
    loadFeedback:async()=>new ArrayBuffer(1),
    loadSpanish:async()=>new ArrayBuffer(1),draw:()=>1});
  assert.equal(await runtime.start(),true);
  assert.equal(await runtime.play(),true);
  audio.now=750/12;
  runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(runtime.snapshot().state.mainFrame,752);
  assert.equal(audio.pauses,1);
  assert.equal(await runtime.choose(1),true);
  assert.equal(runtime.snapshot().state.feedback?.spriteId,76);
  audio.now+=21/12;
  runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'wrong-feedback-held');
  assert.equal(runtime.snapshot().state.feedback?.frame,23);
  assert.equal(await runtime.closeWrong(runtime.snapshot().state.feedback!.generation),true);
  audio.now+=4/12;
  runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(runtime.snapshot().state.quizTryCount,1);
  assert.equal(runtime.replay(),true);
  assert.equal(runtime.snapshot().state.mainFrame,1);
  assert.equal(runtime.snapshot().state.feedback,null);
  assert.equal(runtime.snapshot().state.lessonCompleted,false);
  assert.equal(audio.replays,1);
  assert(painted.includes(752));
  await runtime.close();
  assert.equal(audio.closed,1);
});

test('P041 optional SA never starts from locale and Return leaves main held',async()=>{
  const audio=new FakeAudio();
  const observed:string[]=[];
  const runtime=new P041PageRuntimeV1({audio:audio as never,paint:()=>true,
    loadMain:async()=>new ArrayBuffer(1),
    loadFeedback:async()=>new ArrayBuffer(1),
    loadSpanish:async()=>new ArrayBuffer(1),
    onSnapshot:value=>observed.push(value.audio.selected?.phase??'none')});
  await runtime.start();
  assert.equal(audio.owner,'main');
  assert.equal(await runtime.startSpanish(),true);
  assert.equal(audio.owner,'sa');
  assert.equal(runtime.pause(),true);
  assert.equal(runtime.snapshot().audio.selected?.phase,'paused');
  assert.equal(observed.at(-1),'paused');
  assert.equal(runtime.returnMain(),true);
  assert.equal(audio.owner,'main');
  assert.equal(runtime.snapshot().state.mainTimelinePlaying,false);
  await runtime.close();
});
