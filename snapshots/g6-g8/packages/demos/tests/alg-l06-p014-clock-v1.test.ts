import assert from 'node:assert/strict';
import test from 'node:test';
import {AlgL06P014ClockV1} from '../src/alg-l06-p014-clock-v1';
import {P014_AUDIO_ASSETS, type P014AudioId} from '../src/alg-l06-p014-audio-schedule-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase} from '../src/decoded-source-stream-transport';

class Context extends EventTarget {
  currentTime=0;
  state:'suspended'|'running'|'closed'='suspended';
  closeCount=0;
  async resume(){if(this.state==='closed')throw Error('closed');this.state='running';this.dispatchEvent(new Event('statechange'));}
  async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';this.dispatchEvent(new Event('statechange'));}}
}
type NodeRecord={id:string;sample:number;delay:number};
function fixture(options:{failPrepareId?:P014AudioId;deferPlayId?:P014AudioId}={}){
  const context=new Context();
  const commits:{main:number;feedback:string|null;local:number|null}[]=[];
  const nodes:NodeRecord[]=[];
  let active=0,maxActive=0;
  let releasePlay:(()=>void)|undefined;
  let playWait:Promise<void>|undefined;
  if(options.deferPlayId)playWait=new Promise(resolve=>{releasePlay=resolve;});
  const transports=new Map<string,{phase:string;cursor:number}>();
  const clock=new AlgL06P014ClockV1({
    createContext:()=>context as unknown as AudioContext,
    commitFrame:quiz=>{commits.push({main:quiz.mainFrame,feedback:quiz.feedbackDomain,
      local:quiz.feedbackFrame});return true;},
    createTransport:(binding:DecodedSourceStreamBinding,createContext)=>{
      const id=P014_AUDIO_ASSETS.find(asset=>asset.sourceSha256===binding.sourceSha256)!.id;
      let ctx:Context|undefined;
      let phase='idle',cursor=0,start=0,delay=0,startSample=0,heldTime:number|null=null;
      let epoch=0;
      const state={phase,cursor};transports.set(id,state);
      const end=()=>{if(phase==='playing'){active--;phase='buffer-ended';cursor=binding.decodedSamples;state.phase=phase;}};
      const stop=(next:string)=>{epoch++;if(phase==='playing')active--;phase=next;state.phase=phase;
        heldTime=ctx?.currentTime??null;};
      return {
        async prepare(){ctx=createContext() as unknown as Context;
          if(options.failPrepareId===id){phase='failed';state.phase=phase;
            return {accepted:false,reason:'fixture-decode-rejected'};}
          phase='ready';state.phase=phase;return {accepted:true,reason:'ready'};},
        snapshot(){
          if(phase==='playing'){
            cursor=Math.min(binding.decodedSamples,startSample+
              Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate);
            if(cursor>=binding.decodedSamples)end();
          }
          state.cursor=cursor;
          return {phase:phase as DecodedStreamPhase,epoch:0,decodedSample:cursor,
            contextTime:ctx?.currentTime??null,heldContextTime:heldTime,
            playbackAnchor:null,elapsedMs:cursor/binding.sampleRate*1000,
            volume:1,failure:null,sourceAlignment:'unresolved' as const,
            lessonCompleted:false as const};
        },
        seekDecodedSample(sample:number){stop('paused');cursor=sample;state.cursor=cursor;
          return {accepted:true,reason:'seeked'};},
        async play(policy:{delaySeconds?:number}){const ticket=++epoch;
          if(options.deferPlayId===id&&playWait)await playWait;
          if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          await ctx!.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          start=ctx!.currentTime;
          delay=policy.delaySeconds??0;startSample=cursor;phase='playing';state.phase=phase;
          active++;maxActive=Math.max(maxActive,active);nodes.push({id,sample:cursor,delay});
          return {accepted:true,reason:'playing'};},
        pause(){stop('paused');return {accepted:true,reason:'paused'};},
        replay(){stop('ready');cursor=0;return {accepted:true,reason:'ready'};},
        holdSourceBoundary(){stop('boundary-held');return {accepted:true,reason:'held'};},
        setVolume(){return {accepted:true,reason:'volume'};},
        async close(){stop('closed');await ctx?.close();},
      };
    },
  });
  const sources=Object.fromEntries(P014_AUDIO_ASSETS.map(a=>
    [a.id,new ArrayBuffer(a.sourceBytes)])) as Record<P014AudioId,ArrayBuffer>;
  return {clock,context,commits,nodes,transports,sources,
    releasePlay:()=>releasePlay?.(),get active(){return active;},
    get maxActive(){return maxActive;}};
}
const USER={activation:'user' as const,reducedMotion:false};

test('nine prepared domains share one context; main stops at quiz 120 without audio overlap',async()=>{
  const f=fixture();
  assert.equal((await f.clock.prepare(f.sources)).accepted,true);
  assert.deepEqual(f.commits[0],{main:1,feedback:null,local:null});
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.deepEqual(f.nodes[0],{id:'main-1',sample:1673,delay:1/12});
  f.context.currentTime=119/12;let snapshot=f.clock.tick();
  assert.equal(snapshot.phase,'quiz-held');assert.equal(snapshot.frame,120);
  assert.equal(snapshot.quiz.answersEnabled,true);assert.equal(f.active,0);
  assert.equal((await f.clock.play(USER)).accepted,false);
  assert.equal(f.maxActive,1);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('every selected branch owns its own domain and wrong Close hold cannot be passed by Play',async()=>{
  for(const branch of P014_AUDIO_ASSETS.filter(a=>a.id.startsWith('sprite-'))){
    const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
    f.context.currentTime=119/12;f.clock.tick();
    const wrong=['sprite-173','sprite-187','sprite-28'].includes(branch.id);
    const instance=wrong?'AnsBtn1':'AnsBtn2';
    const ordinal=wrong?{'sprite-173':1,'sprite-187':2,'sprite-28':3}[branch.id as 'sprite-173'|'sprite-187'|'sprite-28']:
      {'sprite-115':1,'sprite-156':2,'sprite-83':3,'sprite-148':4}[branch.id as 'sprite-115'|'sprite-156'|'sprite-83'|'sprite-148'];
    assert.equal(f.clock.answer(instance,ordinal).accepted,true);
    assert.equal(f.clock.snapshot().feedbackDomain,branch.id);
    await f.clock.play(USER);
    const terminal=branch.lastVisualFrame;
    f.context.currentTime+=(terminal-2)/12;
    let s=f.clock.tick();
    if(wrong){
      const hold={'sprite-173':22,'sprite-187':23,'sprite-28':20}[branch.id as 'sprite-173'|'sprite-187'|'sprite-28'];
      assert.equal(s.phase,'feedback-held');assert.equal(s.feedbackFrame,hold);
      assert.equal(f.clock.acknowledgeFeedback().accepted,true);
      assert.equal(f.clock.snapshot().feedbackFrame,hold+1);
      await f.clock.play(USER);
      f.context.currentTime+=(terminal-(hold+1))/12;
      s=f.clock.tick();assert.equal(s.phase,'quiz-held');
    }else assert.equal(s.phase,'transition-ready');
    assert.equal(f.maxActive,1);
    await f.clock.close();assert.equal(f.context.closeCount,1);
  }
});

test('main2 starts after four-frame silence candidate and preserves final decoder tail at visual 449',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=119/12;f.clock.tick();f.clock.answer('AnsBtn2',4);
  await f.clock.play(USER);f.context.currentTime+=25/12;let s=f.clock.tick();
  assert.equal(s.phase,'transition-ready');assert.equal(s.frame,120);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:true})).accepted,false);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,true);
  assert.deepEqual(f.nodes.at(-1),{id:'main-2',sample:571,delay:4/12});
  f.context.currentTime+=4/12;s=f.clock.tick();assert.equal(s.frame,125);
  f.context.currentTime+=(449-125)/12;s=f.clock.tick();
  assert.equal(s.frame,449);assert.equal(s.phase,'playing');
  assert.equal(s.mainFinalAudioTailPending,true);
  f.context.currentTime+=.25/12;s=f.clock.tick();
  assert.equal(s.frame,449);assert(Math.abs(s.activePosition-449.25)<1e-6);
  assert.equal(f.clock.pause().accepted,true);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.nodes.at(-1)?.id,'main-2');
  assert(Math.abs(f.nodes.at(-1)!.sample-
    (571+(449.25-125)*22050/12))<1e-5,'fractional tail offset resumes exactly');
  f.context.currentTime+=.08;s=f.clock.tick();
  assert.equal(s.frame,449);assert.equal(s.phase,'timeline-ended');
  assert.equal(s.lessonCompleted,false);assert.equal(f.active,0);
  await f.clock.close();
});

test('Replay and close invalidate pending work, inactive domains cannot advance quiz',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=119/12;f.clock.tick();
  f.clock.answer('AnsBtn1',3);await f.clock.play(USER);
  f.context.currentTime+=18/12;let s=f.clock.tick();
  assert.equal(s.feedbackFrame,20);assert.equal(s.phase,'feedback-held');
  assert.equal(f.clock.replay().accepted,true);s=f.clock.snapshot();
  assert.equal(s.frame,1);assert.equal(s.feedbackDomain,null);
  assert.equal(f.active,0);
  f.transports.get('sprite-173')!.phase='buffer-ended';
  s=f.clock.tick();assert.equal(s.frame,1);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('failed exact-domain decode closes the one shared context and no source starts',async()=>{
  const f=fixture({failPrepareId:'sprite-83'});
  const prepared=await f.clock.prepare(f.sources);
  assert.equal(prepared.accepted,false);
  assert.match(prepared.reason,/sprite-83:fixture-decode-rejected/u);
  assert.equal(f.clock.snapshot().phase,'failed');
  assert.equal(f.context.closeCount,1);
  assert.equal(f.nodes.length,0);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('Replay or close cancels a pending source start before any node appears',async()=>{
  for(const action of ['replay','close'] as const){
    const f=fixture({deferPlayId:'main-1'});
    await f.clock.prepare(f.sources);
    const pending=f.clock.play(USER);
    await Promise.resolve();
    if(action==='replay')f.clock.replay();else await f.clock.close();
    f.releasePlay();
    assert.equal((await pending).accepted,false);
    assert.equal(f.nodes.length,0);
    assert.equal(f.active,0);
    if(action==='replay')await f.clock.close();
    assert.equal(f.context.closeCount,1);
  }
});

test('glossary holds an active source and rejects Play until explicit close',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=7/12;f.clock.tick();
  assert.equal(f.clock.openGlossary('Input').accepted,true);
  assert.equal(f.active,0);
  assert.equal(f.clock.snapshot().quiz.glossaryOpen,'Input');
  assert.equal((await f.clock.play(USER)).accepted,false);
  assert.equal(f.clock.snapshot().frame,8);
  f.context.currentTime=10;
  assert.equal(f.clock.snapshot().frame,8);
  f.clock.closeGlossary();
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.maxActive,1);
  await f.clock.close();
});

test('main1 decoder EOF does not skip the authored silent visual lead to quiz 120',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=110/12;
  let s=f.clock.tick();assert.equal(s.frame,111);
  assert.equal(s.audio.phase,'buffer-ended');
  assert.equal(s.phase,'playing');
  const nodes=f.nodes.length;
  f.clock.pause();assert.equal(f.clock.snapshot().frame,111);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.nodes.length,nodes,'postroll resumes visual clock without replaying main1');
  f.context.currentTime+=(120-111)/12;s=f.clock.tick();
  assert.equal(s.frame,120);assert.equal(s.phase,'quiz-held');
  assert.equal(s.quiz.answersEnabled,true);
  await f.clock.close();
});
