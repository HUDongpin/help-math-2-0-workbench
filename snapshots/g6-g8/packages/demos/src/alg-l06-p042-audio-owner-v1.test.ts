import assert from 'node:assert/strict';
import test from 'node:test';
import {P042AudioOwnerV1,type P042AudioId} from './alg-l06-p042-audio-owner-v1';

const deferred=<T>()=>{
  let resolve!:(value:T)=>void;
  const promise=new Promise<T>(done=>{resolve=done;});
  return {promise,resolve};
};
class FakeTransport {
  phase='idle';cursor=0;plays=0;pauses=0;replays=0;closed=0;
  async prepare(_bytes:ArrayBuffer){this.phase='ready';return {accepted:true,reason:'ready'};}
  async play(){this.plays++;this.phase='playing';return {accepted:true,reason:'playing'};}
  pause(){this.pauses++;this.phase='paused';return {accepted:true,reason:'paused'};}
  replay(){this.replays++;this.phase='ready';this.cursor=0;return {accepted:true,reason:'replay'};}
  setVolume(){return {accepted:true,reason:'volume'};}
  snapshot(){return {phase:this.phase,decodedSample:this.cursor};}
  async close(){this.closed++;this.phase='closed';}
}

test('P042 holds measured main and wrong cursors, SA requires direct Play',async()=>{
  let epoch=0;
  const made=new Map<P042AudioId,FakeTransport>();
  const owner=new P042AudioOwnerV1(()=>epoch,(_binding,id)=>{
    const transport=new FakeTransport();made.set(id,transport);return transport as never;
  });
  const load=async()=>new ArrayBuffer(1);
  assert.equal((await owner.select('main',0,load)).accepted,true);
  assert.equal((await owner.play(0)).accepted,true);
  made.get('main')!.cursor=491904;
  assert.equal(owner.cancelCurrent(0),true);
  assert.equal(made.get('main')!.cursor,491904);
  assert.equal(made.get('main')!.pauses,1);
  assert.equal((await owner.select('wrong4',0,load,true)).accepted,true);
  made.get('wrong4')!.cursor=36288;
  assert.equal(owner.cancelCurrent(0),true);
  assert.equal(made.get('wrong4')!.cursor,36288);
  assert.equal((await owner.activatePrepared('wrong4',0,'user')).accepted,true);
  assert.equal(made.get('wrong4')!.cursor,36288);
  assert.equal((await owner.select('sa',0,load,true)).accepted,false);
  assert.equal((await owner.select('sa',0,load)).accepted,true);
  assert.equal(made.get('sa')!.plays,0);
  assert.equal((await owner.play(0,'automatic')).accepted,false);
  assert.equal((await owner.play(0,'user')).accepted,true);
  assert.equal(owner.returnFromSpanish(0),true);
  assert.equal(owner.snapshot().owner,'wrong4');
  assert.equal(made.get('wrong4')!.plays,2);
  epoch=1;
  assert.equal(owner.replay(1),true);
  assert.equal(owner.snapshot().owner,'main');
  assert.equal(made.get('main')!.cursor,0);
  await owner.close();
  assert.equal([...made.values()].every(value=>value.closed===1),true);
});

test('P042 late loads fail run epoch, selection, cancel and mount guards',async()=>{
  let epoch=0;
  const made:FakeTransport[]=[];
  const owner=new P042AudioOwnerV1(()=>epoch,()=>{
    const transport=new FakeTransport();made.push(transport);return transport as never;
  });
  const first=deferred<ArrayBuffer>();
  const pending=owner.select('main',0,()=>first.promise,true);
  epoch=1;owner.replay(1);
  first.resolve(new ArrayBuffer(1));
  assert.equal((await pending).accepted,false);
  assert.equal(made.length,0);
  const second=deferred<ArrayBuffer>();
  const stale=owner.select('wrong4',1,()=>second.promise,true);
  assert.equal((await owner.select('right4',1,async()=>new ArrayBuffer(1))).accepted,true);
  second.resolve(new ArrayBuffer(1));
  assert.equal((await stale).accepted,false);
  assert.equal(owner.snapshot().owner,'right4');
  const third=deferred<ArrayBuffer>();
  const cancelled=owner.select('sa',1,()=>third.promise);
  assert.equal(owner.cancelCurrent(1),true);
  third.resolve(new ArrayBuffer(1));
  assert.equal((await cancelled).accepted,false);
  const fourth=deferred<ArrayBuffer>();
  const afterClose=owner.select('main',1,()=>fourth.promise);
  await owner.close();
  fourth.resolve(new ArrayBuffer(1));
  assert.equal((await afterClose).accepted,false);
});
