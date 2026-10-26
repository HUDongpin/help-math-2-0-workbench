import assert from 'node:assert/strict';
import {test} from 'node:test';
import {P052AudioSession} from '../src/nms-l02-p052-audio-session-v1';
const cue={id:'outro',domain:'sprite-350',startSample:209475,endSample:285666,sampleRate:22050 as const};
function harness(){
 const nodes:any[]=[];let loads=0,closes=0;
 const buffer={sampleRate:22050,numberOfChannels:1,length:285666} as AudioBuffer;
 const context={currentTime:0,destination:{},createGain:()=>({gain:{value:1},connect(){},disconnect(){}}),resume:async()=>{},close:async()=>{closes++;},createBufferSource:()=>{
  const node={buffer:null,onended:null as null|(()=>void),connect(){},disconnect(){},stop(){},args:[] as number[],start(...args:number[]){this.args=args;}};
  nodes.push(node);return node;
 }};
 const session=new P052AudioSession({context:()=>context as unknown as AudioContext,load:async()=>{loads++;return buffer;}});
 return {session,context,nodes,buffer,loads:()=>loads,closes:()=>closes};
}
test('pause/resume uses unplayed PCM samples; old callback cannot complete',async()=>{
 const h=harness();let ends=0;await h.session.play(cue,()=>ends++);
 const old=h.nodes[0].onended;h.context.currentTime=1;h.session.pause();
 assert.equal(h.session.snapshot().playedSamples,22050);old();assert.equal(ends,0);
 h.context.currentTime=9;await h.session.resume();
 assert.deepEqual(h.nodes[1].args,[0,(209475+22050)/22050,(285666-209475-22050)/22050]);
 const end=h.nodes[1].onended;end();end();assert.equal(ends,1);
 assert.equal(h.session.snapshot().completed,true);assert.equal(await h.session.resume(),false);
});
test('cancel, replacement and close never report natural completion',async()=>{
 const h=harness();let ends=0;await h.session.play(cue,()=>ends++);const first=h.nodes[0].onended;
 h.session.cancel();first();await h.session.play(cue,()=>ends++);const second=h.nodes[1].onended;
 await h.session.play(cue,()=>ends++);second();const third=h.nodes[2].onended;
 await h.session.close();third();await h.session.close();assert.equal(ends,0);assert.equal(h.closes(),1);
 assert.equal(await h.session.play(cue,()=>ends++),false);
});
test('cancel invalidates a pending PCM load even when loader ignores abort',async()=>{
 const h=harness();let resolve!:(buffer:AudioBuffer)=>void;let signal!:AbortSignal;
 const session=new P052AudioSession({context:()=>h.context as unknown as AudioContext,
  load:(_context,_domain,s)=>{signal=s;return new Promise(r=>{resolve=r;});}});
 const pending=session.play(cue,()=>assert.fail('cancelled completion'));session.cancel();
 assert.equal(signal.aborted,true);resolve(h.buffer);assert.equal(await pending,false);assert.equal(h.nodes.length,0);
});
test('invalid window rejected before loading and wrong PCM rejected before playback',async()=>{
 const h=harness();await assert.rejects(h.session.play({...cue,startSample:-1},()=>{}),/P052_AUDIO_WINDOW/);
 assert.equal(h.loads(),0);Object.assign(h.buffer,{sampleRate:48000});
 await assert.rejects(h.session.play(cue,()=>{}),/P052_AUDIO_PCM_BOUNDS/);assert.equal(h.nodes.length,0);
});
