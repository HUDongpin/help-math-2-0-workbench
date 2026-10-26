import assert from 'node:assert/strict';
import test from 'node:test';
import {P045AudioOwnerV1,type P045AudioId} from './alg-l06-p045-audio-owner-v1';
import {P045_MEASURED_BINDINGS} from './alg-l06-p045-measured-bindings-v1';

test('P045 selects its own measured streams and SA stays gesture gated',async()=>{
  let epoch=0;
  const received=new Map<P045AudioId,string>();
  const transports=new Map<P045AudioId,{phase:string;plays:number;pauses:number}>();
  const owner=new P045AudioOwnerV1(()=>epoch,(binding,id)=>{
    received.set(id,binding.sourceSha256);
    const state={phase:'idle',plays:0,pauses:0};transports.set(id,state);
    return {
      prepare:async()=>{state.phase='ready';return {accepted:true,reason:'ready'}},
      play:async()=>{state.phase='playing';state.plays++;return {accepted:true,reason:'playing'}},
      pause:()=>{state.phase='paused';state.pauses++;return {accepted:true,reason:'paused'}},
      replay:()=>{state.phase='ready';return {accepted:true,reason:'replay'}},
      setVolume:()=>({accepted:true,reason:'volume'}),
      snapshot:()=>({phase:state.phase}),close:async()=>{state.phase='closed'},
    } as never;
  });
  const load=async()=>new ArrayBuffer(1);
  assert.equal((await owner.select('main',epoch,load)).accepted,true);
  assert.equal(received.get('main'),P045_MEASURED_BINDINGS.main.sourceSha256);
  assert.equal((await owner.play(epoch,'user')).accepted,true);
  assert.equal((await owner.select('wrong4',epoch,load,true)).accepted,true);
  assert.equal(received.get('wrong4'),P045_MEASURED_BINDINGS.wrong4.sourceSha256);
  assert.equal(transports.get('main')?.pauses,1);
  assert.equal((await owner.select('sa',epoch,load,true)).accepted,false);
  assert.equal((await owner.select('sa',epoch,load)).accepted,true);
  assert.equal(transports.get('sa')?.plays,0);
  assert.equal((await owner.play(epoch,'automatic')).accepted,false);
  assert.equal((await owner.play(epoch,'user')).accepted,true);
  assert.equal(received.get('sa'),P045_MEASURED_BINDINGS.sa.sourceSha256);
  epoch++;
  assert.equal(owner.replay(epoch),true);
  assert.equal(owner.snapshot().owner,'main');
  await owner.close();
});
