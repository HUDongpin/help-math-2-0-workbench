import assert from 'node:assert/strict';
import test from 'node:test';
import {P046PageRuntimeV1,type P046Transport} from './alg-l06-p046-audio-runtime-v1';
import type {P046AudioDomain} from './alg-l06-p046-measured-bindings-v1';
import type {DecodedStreamSnapshot,DecodedStreamPhase} from './decoded-source-stream-transport';
import type {P046Event,P046Id} from './alg-l06-p046-state-v1';

class Track implements P046Transport {
  phase:DecodedStreamPhase='idle';epoch=0;time=0;cursor=0;volume=1;
  plays=0;replays=0;closed=false;pending:(()=>void)[]=[];delay=false;
  anchor:{contextTime:number;decodedSample:number}|null=null;
  async prepare(){this.phase='ready';return {accepted:true,reason:'ready'};}
  async play(){
    const ticket=++this.epoch;this.phase='start-pending';
    if(this.delay)await new Promise<void>(resolve=>this.pending.push(resolve));
    if(ticket!==this.epoch)return {accepted:false,reason:'stale-start'};
    this.plays++;this.phase='playing';this.anchor={contextTime:this.time,decodedSample:this.cursor};
    return {accepted:true,reason:'playing'};
  }
  pause(){this.epoch++;this.phase='paused';this.anchor=null;return {accepted:true,reason:'paused'};}
  replay(){this.replays++;this.epoch++;this.cursor=0;this.phase='ready';this.anchor=null;return {accepted:true,reason:'replay'};}
  snapshot():DecodedStreamSnapshot{return {phase:this.phase,epoch:this.epoch,decodedSample:this.cursor,contextTime:this.time,
    heldContextTime:this.anchor?null:this.time,playbackAnchor:this.anchor,elapsedMs:0,volume:this.volume,failure:null,
    sourceAlignment:'unresolved',lessonCompleted:false};}
  setVolume(value:number){this.volume=value;return {accepted:true,reason:'volume'};}
  subscribe(){return ()=>{};}
  async close(){this.closed=true;this.phase='closed';this.epoch++;}
}
const settled=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
async function fixture(){
  const tracks={} as Record<P046AudioDomain,Track>;
  const runtime=new P046PageRuntimeV1({load:async()=>new ArrayBuffer(1),
    makeTransport:(_,id)=>tracks[id]=new Track(),resumeEnded:async()=>true});
  assert(await runtime.start());
  const send=(event:Record<string,unknown>)=>{
    const transition=runtime.send({...event,epoch:runtime.snapshot().state.epoch} as P046Event);
    assert(transition.accepted,transition.reason);return transition.state;
  };
  const enter=async()=>{send({type:'play'});await settled();tracks.main.time+=13.5;runtime.tick();assert.equal(runtime.snapshot().state.mainFrame,163);};
  const drop=async(id:P046Id,target:P046Id|null)=>{
    const selected=send({type:'pick',id});send({type:'drop',id,target,token:selected.selection!.token});await settled();
  };
  return {runtime,tracks,send,enter,drop};
}

test('real reducer and transport effects overlap both coaches; same-kind replacement retains the other clock',async()=>{
  const f=await fixture();await f.enter();await f.drop(1,2);
  const wrongEpoch=f.tracks.wrong.epoch;
  f.tracks.wrong.time+=.3;await f.drop(1,1);
  assert.equal(f.tracks.wrong.epoch,wrongEpoch);assert.equal(f.tracks.wrong.phase,'playing');
  assert.equal(f.tracks.right.phase,'playing');
  const rightEpoch=f.tracks.right.epoch;
  await f.drop(2,2);assert(f.tracks.right.epoch>rightEpoch);assert.equal(f.tracks.wrong.epoch,wrongEpoch);
  f.tracks.wrong.time+=1.3;f.runtime.tick();
  assert.equal(f.runtime.snapshot().state.coaches.wrong!.frame,1);
  assert.equal(f.runtime.snapshot().state.coaches.right!.playing,true);
  await f.runtime.close();assert(Object.values(f.tracks).every(t=>t.closed));
});
test('pending same-coach starts, Replay and navigation cannot revive superseded nodes',async()=>{
  const f=await fixture();await f.enter();f.tracks.right.delay=true;
  await f.drop(1,1);await f.drop(2,2);
  assert.equal(f.tracks.right.pending.length,2);
  f.tracks.right.pending.shift()!();await settled();assert.equal(f.tracks.right.plays,0);
  f.send({type:'replay'});f.tracks.right.pending.shift()!();await settled();
  assert.equal(f.tracks.right.plays,0);assert.equal(f.runtime.snapshot().state.mainFrame,1);
  f.tracks.main.delay=true;f.send({type:'play'});await f.runtime.close();
  f.tracks.main.pending.shift()!();await settled();assert.equal(f.tracks.main.plays,1);
  assert.equal(f.runtime.snapshot().state.phase,'left');
});
test('five matches wait for the current right coach20; main advances164 then ends743 without completion',async()=>{
  const f=await fixture();await f.enter();
  for(const id of [3,1,5,2,4] as const)await f.drop(id,id);
  assert.equal(f.runtime.snapshot().state.mainPlaying,false);
  f.tracks.right.time+=1.49;f.runtime.tick();assert.equal(f.runtime.snapshot().state.phase,'quiz');
  f.tracks.right.time+=.01;f.runtime.tick();await settled();
  assert.equal(f.runtime.snapshot().state.phase,'explanation');assert.equal(f.runtime.snapshot().state.mainFrame,163);
  f.tracks.main.time+=1/12;f.runtime.tick();assert.equal(f.runtime.snapshot().state.mainFrame,164);
  assert.deepEqual(f.runtime.snapshot().state.coaches,{wrong:null,right:null});
  f.tracks.main.phase='buffer-ended';f.tracks.main.anchor=null;f.tracks.main.time+=60;f.runtime.tick();
  assert.equal(f.runtime.snapshot().state.phase,'end');assert.equal(f.runtime.snapshot().lessonCompleted,false);
  await f.runtime.close();
});
test('pause resumes the fractional coach clock; glossary and Spanish preserve all matches',async()=>{
  const f=await fixture();await f.enter();await f.drop(1,1);
  f.tracks.right.time+=.13;f.send({type:'pause'});const frame=f.runtime.snapshot().state.coaches.right!.frame;
  f.tracks.right.time+=100;f.send({type:'play'});await settled();
  f.tracks.right.time+=.04;f.runtime.tick();assert.equal(f.runtime.snapshot().state.coaches.right!.frame,frame+1);
  f.send({type:'open-nmh'});f.send({type:'glossary',buttonId:84});
  assert.equal(f.tracks.right.phase,'paused');f.send({type:'close-glossary'});
  assert.equal(f.runtime.snapshot().state.nmhVisible,true);f.send({type:'close-nmh'});
  f.send({type:'spanish'});await settled();assert.equal(f.tracks.sa.phase,'playing');
  const mainPlays=f.tracks.main.plays;
  f.send({type:'pause'});f.send({type:'play'});await settled();
  assert.equal(f.tracks.sa.plays,2);assert.equal(f.tracks.main.plays,mainPlays);
  f.send({type:'return-spanish'});assert.equal(f.runtime.snapshot().state.quizDragCount,1);
  assert.equal(f.runtime.snapshot().state.mainPlaying,false);await f.runtime.close();
});
test('audio rejection and external interruption hold source progression instead of inventing time',async()=>{
  const f=await fixture();f.tracks.main.play=async()=>({accepted:false,reason:'browser rejected'});
  f.send({type:'play'});await settled();assert.equal(f.runtime.snapshot().state.mainPlaying,false);
  assert.match(f.runtime.snapshot().failure!,/browser rejected/);await f.runtime.close();
  const g=await fixture();await g.enter();await g.drop(1,1);
  g.tracks.right.epoch++;g.tracks.right.phase='interrupted';g.runtime.tick();
  assert.equal(g.runtime.snapshot().state.suspended,true);assert.match(g.runtime.snapshot().failure!,/interrupted/);
  await g.runtime.close();
});
test('Spanish bytes are requested only on activation; late SA fetch cannot escape Replay or leave',async()=>{
  const requests:P046AudioDomain[]=[],tracks={} as Record<P046AudioDomain,Track>;
  const pending:((bytes:ArrayBuffer)=>void)[]=[];
  const runtime=new P046PageRuntimeV1({load:async domain=>{
    requests.push(domain);return domain==='sa'?new Promise<ArrayBuffer>(resolve=>pending.push(resolve)):new ArrayBuffer(1);
  },makeTransport:(_,id)=>tracks[id]=new Track()});
  await runtime.start();assert.deepEqual(requests,['main','wrong','right']);
  runtime.send({type:'spanish',epoch:0});await settled();
  assert.equal(runtime.snapshot().spanishLoading,true);assert.equal(requests.filter(id=>id==='sa').length,1);
  runtime.send({type:'replay',epoch:0});pending.shift()!(new ArrayBuffer(1));await settled();
  assert.equal(runtime.snapshot().spanishLoading,false);assert.equal(tracks.sa.plays,0);
  runtime.send({type:'spanish',epoch:1});await settled();
  await runtime.close();pending.shift()!(new ArrayBuffer(1));await settled();
  assert.equal(tracks.sa.plays,0);assert.equal(tracks.sa.closed,true);
});
