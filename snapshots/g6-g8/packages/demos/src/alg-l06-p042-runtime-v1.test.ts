import assert from 'node:assert/strict';
import test from 'node:test';
import {P042PageRuntimeV1} from './alg-l06-p042-runtime-v1';
import type {P042AudioId} from './alg-l06-p042-audio-owner-v1';

class FakeAudio {
  owner:P042AudioId|null=null;
  beforeSpanish:P042AudioId|null=null;
  now=0;anchor:number|null=null;epoch=0;phase='idle';
  pauses=0;replays=0;closed=0;spanishStarts=0;
  readonly cursors=new Map<P042AudioId,number>();
  syncStateEpoch(epoch:number){if(epoch<this.epoch)return false;this.epoch=epoch;return true;}
  async select(id:P042AudioId,epoch:number,_load:unknown,autostart=false){
    this.syncStateEpoch(epoch);
    if(id==='sa')this.beforeSpanish=this.owner;
    this.owner=id;
    this.phase=autostart?'playing':'ready';this.anchor=autostart?this.now:null;
    if(autostart&&id==='sa')throw Error('SA must not autostart');
    return {accepted:true,reason:'ready'};
  }
  async activatePrepared(id:P042AudioId){
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

function page(audio:FakeAudio,extras:Partial<ConstructorParameters<typeof P042PageRuntimeV1>[0]>={}){
  return new P042PageRuntimeV1({audio:audio as never,paint:()=>true,
    loadMain:async()=>new ArrayBuffer(1),
    loadFeedback:async()=>new ArrayBuffer(1),
    loadSpanish:async()=>new ArrayBuffer(1),...extras});
}
async function reachQuiz(runtime:P042PageRuntimeV1,audio:FakeAudio){
  assert.equal(await runtime.start(),true);
  assert.equal(await runtime.play(),true);
  audio.now=278/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(runtime.snapshot().state.mainFrame,279);
  assert.equal(runtime.snapshot().state.lessonCompleted,false);
}
async function wrongAndClose(runtime:P042PageRuntimeV1,audio:FakeAudio,
  choice:'B'|'C'|'D'){
  const generation=runtime.snapshot().state.quizGeneration;
  assert.equal(await runtime.choose(choice,generation),true);
  const token=runtime.snapshot().state.feedback!.token;
  audio.now+=20/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'wrong-feedback-held');
  assert.equal(runtime.snapshot().state.feedback?.frame,22);
  assert.equal(await runtime.closeWrong(token),true);
  assert.equal(runtime.snapshot().state.feedback?.frame,23);
  audio.now+=8/12;runtime.tick();
}

test('P042 hold 279, two wrong Close cycles, continuation 280 and held 400',async()=>{
  const audio=new FakeAudio();
  const painted:number[]=[];
  const runtime=page(audio,{paint:state=>{painted.push(state.mainFrame);return true;}});
  await reachQuiz(runtime,audio);
  await wrongAndClose(runtime,audio,'B');
  assert.equal(runtime.snapshot().state.phase,'quiz-held');
  assert.equal(runtime.snapshot().state.quizTryCount,1);
  const oldGeneration=runtime.snapshot().state.quizGeneration-1;
  assert.equal(await runtime.choose('C',oldGeneration),false);
  await wrongAndClose(runtime,audio,'C');
  assert.equal(runtime.snapshot().state.phase,'postquiz');
  assert.equal(runtime.snapshot().state.mainFrame,280);
  await Promise.resolve();
  assert.equal(audio.owner,'main');
  assert.equal(runtime.snapshot().visualClockRunning,true);
  // The measured buffer may end before the engineering visual observer reaches
  // frame 400; EOF is not a visual stop or lesson-completion event.
  audio.phase='buffer-ended';
  audio.now+=120/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'engineering-end-held');
  assert.equal(runtime.snapshot().state.mainFrame,400);
  assert.equal(runtime.snapshot().visualClockRunning,false);
  assert.equal(runtime.snapshot().lessonCompleted,false);
  assert(painted.includes(279));
  assert(painted.includes(400));
  assert.equal(runtime.replay(),true);
  assert.equal(runtime.snapshot().state.mainFrame,1);
  assert.equal(runtime.snapshot().state.feedback,null);
  assert.equal(audio.replays,1);
  await runtime.close();
  assert.equal(audio.closed,1);
});

test('P042 NMH and glossary hand off; correct A preserves one prior wrong',async()=>{
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
  assert.equal(await runtime.choose('A'),true);
  assert.equal(runtime.snapshot().state.feedback?.spriteId,239);
  audio.now+=23/12;runtime.tick();
  assert.equal(runtime.snapshot().state.phase,'postquiz');
  assert.equal(runtime.snapshot().state.quizTryCount,1);
  assert.equal(runtime.glossary(153),true);
  assert.deepEqual(terms,['Function']);
  assert.equal(runtime.snapshot().state.phase,'host-glossary');
  assert.equal(audio.owner,null);
  await runtime.close();
});

test('P042 SA is explicit and independent; Replay invalidates stale feedback',async()=>{
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
  assert.equal(await runtime.choose('B'),true);
  const oldToken=runtime.snapshot().state.feedback!.token;
  assert.equal(runtime.replay(),true);
  assert.equal(await runtime.closeWrong(oldToken),false);
  assert.equal(runtime.snapshot().state.epoch,1);
  assert.equal(runtime.snapshot().state.phase,'prequiz');
  await runtime.close();
});
