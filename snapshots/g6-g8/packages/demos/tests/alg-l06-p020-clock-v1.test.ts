import assert from 'node:assert/strict';
import test from 'node:test';
import {AlgL06P020ClockV1} from '../src/alg-l06-p020-clock-v1';
import {P020_AUDIO_ASSETS, type P020AudioId} from '../src/alg-l06-p020-audio-schedule-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase} from '../src/decoded-source-stream-transport';

class Context extends EventTarget {
  currentTime=0;
  state:'suspended'|'running'|'closed'='suspended';
  closeCount=0;
  async resume(){if(this.state==='closed')throw Error('closed');this.state='running';this.dispatchEvent(new Event('statechange'));}
  async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';this.dispatchEvent(new Event('statechange'));}}
}
type NodeRecord={id:string;sample:number;delay:number};
function fixture(options:{failPrepareId?:P020AudioId;deferPlayId?:P020AudioId}={}){
  const context=new Context();
  const commits:{main:number;feedback:string|null;local:number|null}[]=[];
  const nodes:NodeRecord[]=[];
  let active=0,maxActive=0;
  let releasePlay:(()=>void)|undefined;
  let playWait:Promise<void>|undefined;
  if(options.deferPlayId)playWait=new Promise(resolve=>{releasePlay=resolve;});
  const transports=new Map<string,{phase:string;cursor:number}>();
  const clock=new AlgL06P020ClockV1({
    createContext:()=>context as unknown as AudioContext,
    commitFrame:quiz=>{commits.push({main:quiz.mainFrame,feedback:quiz.feedbackDomain,
      local:quiz.feedbackFrame});return true;},
    createTransport:(binding:DecodedSourceStreamBinding,createContext)=>{
      const id=P020_AUDIO_ASSETS.find(asset=>asset.sourceSha256===binding.sourceSha256)!.id;
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
  const sources=Object.fromEntries(P020_AUDIO_ASSETS.map(a=>
    [a.id,new ArrayBuffer(a.sourceBytes)])) as Record<P020AudioId,ArrayBuffer>;
  return {clock,context,commits,nodes,transports,sources,
    releasePlay:()=>releasePlay?.(),get active(){return active;},
    get maxActive(){return maxActive;}};
}
const USER={activation:'user' as const,reducedMotion:false};

test('eight prepared domains share one context; main source stops at quiz 58',async()=>{
  const f=fixture();
  assert.equal((await f.clock.prepare(f.sources)).accepted,true);
  assert.deepEqual(f.commits[0],{main:1,feedback:null,local:null});
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.deepEqual(f.nodes[0],{id:'main-1',sample:1673,delay:1/12});
  f.context.currentTime=57/12;
  const snapshot=f.clock.tick();
  assert.equal(snapshot.phase,'quiz-held');assert.equal(snapshot.frame,58);
  assert.equal(snapshot.quiz.answersEnabled,true);assert.equal(f.active,0);
  assert.equal((await f.clock.play(USER)).accepted,false);
  assert.equal(f.maxActive,1);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('all seven source branches are exclusive; wrong Close is compulsory',async()=>{
  for(const branch of P020_AUDIO_ASSETS.filter(a=>a.id.startsWith('feedback-'))){
    const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
    f.context.currentTime=57/12;f.clock.tick();
    const wrong=branch.id.startsWith('feedback-wrong-');
    const ordinal=Number(branch.id.at(-1));
    assert.equal(f.clock.answer(wrong?'AnsBtn1':'AnsBtn2',ordinal).accepted,true);
    assert.equal(f.clock.snapshot().feedbackDomain,branch.domain);
    await f.clock.play(USER);
    f.context.currentTime+=(branch.lastVisualFrame-2)/12;
    let snapshot=f.clock.tick();
    if(wrong){
      const hold={'feedback-wrong-1':23,'feedback-wrong-2':20,'feedback-wrong-3':21}
        [branch.id as 'feedback-wrong-1'|'feedback-wrong-2'|'feedback-wrong-3'];
      assert.equal(snapshot.phase,'feedback-held');assert.equal(snapshot.feedbackFrame,hold);
      assert.equal((await f.clock.play(USER)).accepted,false);
      assert.equal(f.clock.acknowledgeFeedback().accepted,true);
      assert.equal(f.clock.snapshot().feedbackFrame,hold+1);
      await f.clock.play(USER);
      f.context.currentTime+=(branch.lastVisualFrame-(hold+1))/12;
      snapshot=f.clock.tick();assert.equal(snapshot.phase,'quiz-held');
    }else assert.equal(snapshot.phase,'transition-ready');
    assert.equal(f.maxActive,1);
    await f.clock.close();assert.equal(f.context.closeCount,1);
  }
});

test('feedback terminal resumes the same main decoder at frame 59 and reaches visual 172 after EOF',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=57/12;f.clock.tick();f.clock.answer('AnsBtn2',1);
  await f.clock.play(USER);f.context.currentTime+=(28-2)/12;
  let snapshot=f.clock.tick();assert.equal(snapshot.phase,'transition-ready');
  assert.equal(snapshot.frame,58);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:true})).accepted,false);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,true);
  assert.deepEqual(f.nodes.at(-1),{id:'main-1',sample:1673+(59-2)*22050/12,delay:0});
  f.context.currentTime+=(171.95-59)/12;
  snapshot=f.clock.tick();
  assert.equal(snapshot.frame,171);
  assert.equal(snapshot.mainVisualAfterAudioEof,true);
  const nodes=f.nodes.length;
  assert.equal(f.clock.pause().accepted,true);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.nodes.length,nodes,'visual tail resumes without replaying exhausted MP3');
  f.context.currentTime+=.05/12;
  snapshot=f.clock.tick();
  assert.equal(snapshot.frame,172);assert.equal(snapshot.phase,'timeline-ended');
  assert.equal(snapshot.lessonCompleted,false);assert.equal(f.active,0);
  await f.clock.close();
});

test('glossary pauses the active branch, close remains held; Replay clears old feedback',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=57/12;f.clock.tick();f.clock.answer('AnsBtn1',2);
  await f.clock.play(USER);f.context.currentTime+=7/12;f.clock.tick();
  assert.equal(f.clock.openGlossary('Function').accepted,true);
  assert.equal(f.active,0);assert.equal(f.clock.snapshot().quiz.glossaryOpen,'Function');
  assert.equal((await f.clock.play(USER)).accepted,false);
  const held=f.clock.snapshot().feedbackFrame;
  f.context.currentTime+=5;assert.equal(f.clock.tick().feedbackFrame,held);
  f.clock.closeGlossary();assert.equal(f.clock.snapshot().feedbackFrame,held);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.clock.replay().accepted,true);
  assert.equal(f.clock.snapshot().frame,1);assert.equal(f.clock.snapshot().feedbackDomain,null);
  assert.equal(f.active,0);
  await f.clock.close();
});

test('sprite-94 negative-seek branch does not synthesize audio across its visual tail',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=57/12;f.clock.tick();
  assert.equal(f.clock.answer('AnsBtn3',2).accepted,true);
  await f.clock.play(USER);f.context.currentTime+=(20-2)/12;
  assert.equal(f.clock.tick().phase,'feedback-held');
  assert.equal(f.clock.acknowledgeFeedback().accepted,true);
  await f.clock.play(USER);f.context.currentTime+=(27-21)/12;
  let snapshot=f.clock.tick();
  assert.equal(snapshot.feedbackFrame,27);
  assert.equal(snapshot.audio.phase,'buffer-ended');
  assert.equal(f.clock.pause().accepted,true);
  const nodes=f.nodes.length;
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.nodes.length,nodes,'no invented tail or replay after decoded EOF');
  f.context.currentTime+=1/12;
  snapshot=f.clock.tick();
  assert.equal(snapshot.phase,'quiz-held');assert.equal(snapshot.quiz.tryCount,1);
  await f.clock.close();
});

test('pending starts and failed decode cannot leave a later active source',async()=>{
  for(const action of ['replay','close'] as const){
    const f=fixture({deferPlayId:'main-1'});await f.clock.prepare(f.sources);
    const pending=f.clock.play(USER);await Promise.resolve();
    if(action==='replay')f.clock.replay();else await f.clock.close();
    f.releasePlay();assert.equal((await pending).accepted,false);
    assert.equal(f.nodes.length,0);assert.equal(f.active,0);
    if(action==='replay')await f.clock.close();
    assert.equal(f.context.closeCount,1);
  }
  const failed=fixture({failPrepareId:'feedback-wrong-2'});
  const response=await failed.clock.prepare(failed.sources);
  assert.equal(response.accepted,false);
  assert.match(response.reason,/feedback-wrong-2:fixture-decode-rejected/u);
  assert.equal(failed.context.closeCount,1);assert.equal(failed.nodes.length,0);
});
