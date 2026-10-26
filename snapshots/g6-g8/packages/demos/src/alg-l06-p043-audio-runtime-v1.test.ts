import assert from 'node:assert/strict';
import test from 'node:test';
import {P043PageRuntimeV1} from './alg-l06-p043-audio-runtime-v1';
import type {P043AudioId} from './alg-l06-p043-audio-owner-v1';

class FakeAudio {
  owner:P043AudioId|null=null;
  beforeSpanish:P043AudioId|null=null;
  now=0;anchor:number|null=null;epoch=0;phase='idle';
  pauses=0;replays=0;closed=0;spanishStarts=0;
  readonly cursors=new Map<P043AudioId,number>();
  syncStateEpoch(epoch:number){if(epoch<this.epoch)return false;this.epoch=epoch;return true;}
  async select(id:P043AudioId,epoch:number,_load:unknown,autostart=false){
    this.syncStateEpoch(epoch);
    if(id==='sa')this.beforeSpanish=this.owner;
    this.owner=id;
    this.phase=autostart?'playing':'ready';this.anchor=autostart?this.now:null;
    if(autostart&&id==='sa')throw Error('SA must not autostart');
    return {accepted:true,reason:'ready'};
  }
  async activatePrepared(id:P043AudioId){
    this.owner=id;this.phase='playing';this.anchor=this.now;
    return {accepted:true,reason:'playing'};
  }
  async play(_epoch:number,activation:'user'|'automatic'='user'){
    if(this.owner==='sa'){
      assert.equal(activation,'user');this.spanishStarts++;
    }
    this.phase='playing';this.anchor=this.now;
    return {accepted:true,reason:'playing'};
  }
  pause(){this.pauses++;this.phase='paused';}
  cancelCurrent(){this.pause();this.owner=null;this.beforeSpanish=null;return true;}
  replay(epoch:number){this.syncStateEpoch(epoch);this.replays++;
    this.owner='main';this.anchor=null;this.phase='ready';return true;}
  setVolume(){return true;}
  returnFromSpanish(){this.owner=this.beforeSpanish;this.beforeSpanish=null;
    this.anchor=null;this.phase='paused';return true;}
  snapshot(){return {owner:this.owner,
    selected:this.owner?{contextTime:this.now,
      playbackAnchor:this.anchor===null?null:{contextTime:this.anchor,decodedSample:0},
      phase:this.phase,decodedSample:this.cursors.get(this.owner)??0}:null,
    main:null,wrong4:null,right4:null,spanish:null,
    session:1,stateEpoch:this.epoch,closed:!!this.closed};}
  async close(){this.closed++;}
}

function page(audio:FakeAudio,extras:Partial<ConstructorParameters<typeof P043PageRuntimeV1>[0]>={}){
  return new P043PageRuntimeV1({audio:audio as never,paint:()=>true,
    loadMain:async()=>new ArrayBuffer(1),
    loadFeedback:async()=>new ArrayBuffer(1),
    loadSpanish:async()=>new ArrayBuffer(1),...extras});
}
async function reachQuiz(runtime:P043PageRuntimeV1,audio:FakeAudio){
  assert.equal(await runtime.start(),true);
  assert.equal(await runtime.play(),true);
  audio.now=61/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(runtime.snapshot().state.mainFrame,62);
  assert.equal(runtime.snapshot().state.lessonCompleted,false);
}
async function wrongAndClose(runtime:P043PageRuntimeV1,audio:FakeAudio,
  choice:'A'|'C'|'D'){
  const generation=runtime.snapshot().state.quizGeneration;
  assert.equal(await runtime.choose(choice,generation),true);
  const token=runtime.snapshot().state.feedback!.token;
  audio.now+=21/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'wrong-feedback-held');
  assert.equal(runtime.snapshot().state.feedback?.frame,23);
  assert.equal(await runtime.closeWrong(token),true);
  assert.equal(runtime.snapshot().state.feedback?.frame,24);
  audio.now+=5/12;runtime.tick();
}

test('P043 hold 62, two wrong Close cycles, continuation 63 and held 241',async()=>{
  const audio=new FakeAudio();
  const painted:number[]=[];
  const runtime=page(audio,{paint:state=>{painted.push(state.mainFrame);return true;}});
  await reachQuiz(runtime,audio);
  await wrongAndClose(runtime,audio,'A');
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(runtime.snapshot().state.quizTryCount,1);
  const oldGeneration=runtime.snapshot().state.quizGeneration-1;
  assert.equal(await runtime.choose('C',oldGeneration),false);
  await wrongAndClose(runtime,audio,'C');
  assert.equal(runtime.snapshot().state.phase,'postquiz');
  assert.equal(runtime.snapshot().state.mainFrame,63);
  await Promise.resolve();
  assert.equal(audio.owner,'main');
  assert.equal(runtime.snapshot().visualClockRunning,true);
  // The measured buffer may end before the engineering visual observer reaches
  // frame 241; EOF is not a visual stop or lesson-completion event.
  audio.phase='buffer-ended';
  audio.now+=178/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'engineering-end-held');
  assert.equal(runtime.snapshot().state.mainFrame,241);
  assert.equal(runtime.snapshot().visualClockRunning,false);
  assert.equal(runtime.snapshot().lessonCompleted,false);
  assert(painted.includes(62));
  assert(painted.includes(241));
  assert.equal(runtime.replay(),true);
  assert.equal(runtime.snapshot().state.mainFrame,1);
  assert.equal(runtime.snapshot().state.feedback,null);
  assert.equal(audio.replays,1);
  await runtime.close();
  assert.equal(audio.closed,1);
});

test('P043 NMH and glossary hand off; correct B preserves one prior wrong',async()=>{
  const audio=new FakeAudio();
  const terms:string[]=[];
  const runtime=page(audio,{onGlossary:term=>terms.push(term)});
  await reachQuiz(runtime,audio);
  const generation=runtime.snapshot().state.quizGeneration;
  assert.equal(runtime.openNmh(generation),true);
  assert.equal(runtime.snapshot().state.nmhPopupVisible,true);
  assert.equal(runtime.closeNmh(generation),true);
  await wrongAndClose(runtime,audio,'D');
  assert.equal(runtime.snapshot().state.quizTryCount,1);
  assert.equal(await runtime.choose('B'),true);
  assert.equal(runtime.snapshot().state.feedback?.spriteId,202);
  audio.now+=29/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'postquiz');
  assert.equal(runtime.snapshot().state.quizTryCount,1);
  assert.equal(runtime.glossary(155),true);
  assert.deepEqual(terms,['Function']);
  assert.equal(runtime.snapshot().state.phase,'host-glossary');
  assert.equal(audio.owner,null);
  await runtime.close();
});

test('P043 SA is explicit and independent; Replay invalidates stale feedback',async()=>{
  const audio=new FakeAudio();
  const runtime=page(audio);
  await reachQuiz(runtime,audio);
  assert.equal(audio.spanishStarts,0);
  assert.equal(await runtime.startSpanish(),true);
  assert.equal(audio.owner,'sa');
  assert.equal(audio.spanishStarts,1);
  assert.equal(runtime.returnMain(),true);
  assert.equal(audio.owner,null);
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(await runtime.choose('A'),true);
  const oldToken=runtime.snapshot().state.feedback!.token;
  assert.equal(runtime.replay(),true);
  assert.equal(await runtime.closeWrong(oldToken),false);
  assert.equal(runtime.snapshot().state.epoch,1);
  assert.equal(runtime.snapshot().state.phase,'prequiz');
  await runtime.close();
});
