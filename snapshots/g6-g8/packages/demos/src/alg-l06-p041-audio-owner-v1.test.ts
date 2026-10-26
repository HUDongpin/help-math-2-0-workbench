import assert from 'node:assert/strict';
import test from 'node:test';
import {P041AudioOwnerV1,type P041AudioId} from './alg-l06-p041-audio-owner-v1';

const deferred=<T>()=>{
  let resolve!:(value:T)=>void;
  const promise=new Promise<T>(done=>{resolve=done;});
  return {promise,resolve};
};
class FakeTransport {
  phase='idle';cursor=0;closed=0;plays=0;pauses=0;replays=0;
  async prepare(_bytes:ArrayBuffer){this.phase='ready' as const;return {accepted:true,reason:'ready'};}
  async play(){this.plays++;this.phase='playing' as const;return {accepted:true,reason:'playing'};}
  pause(){this.pauses++;this.phase='paused' as const;return {accepted:true,reason:'paused'};}
  replay(){this.replays++;this.phase='ready' as const;this.cursor=0;return {accepted:true,reason:'replay'};}
  setVolume(){return {accepted:true,reason:'volume'};}
  snapshot(){return {phase:this.phase,decodedSample:this.cursor};}
  async close(){this.closed++;this.phase='closed' as const;}
}

test('P041 main, selected feedback and optional SA have one owner; Return stays held',async()=>{
  let epoch=0;
  const made=new Map<P041AudioId,FakeTransport>();
  const owner=new P041AudioOwnerV1(()=>epoch,(_binding,id)=>{
    const t=new FakeTransport();made.set(id,t);return t as never;
  });
  const bytes=async()=>new ArrayBuffer(1);
  assert.equal((await owner.select('main',epoch,bytes)).accepted,true);
  assert.equal((await owner.play(epoch)).accepted,true);
  epoch=1;
  assert.equal((await owner.select('91',epoch,bytes,true)).accepted,true);
  assert.equal(made.get('main')?.pauses,1);
  assert.equal(owner.snapshot().owner,'91');
  assert.equal((await owner.select('sa',epoch,bytes,true)).accepted,false);
  assert.equal((await owner.select('sa',epoch,bytes)).accepted,true);
  assert.equal(made.get('91')?.pauses,1);
  assert.equal(made.get('sa')?.plays,0);
  assert.equal((await owner.play(epoch,'user')).accepted,true);
  assert.equal(owner.returnFromSpanish(epoch),true);
  assert.equal(owner.snapshot().owner,'91');
  assert.equal(made.get('91')?.plays,1);
  epoch=2;assert.equal(owner.replay(epoch),true);
  assert.equal(owner.snapshot().owner,'main');
  assert.equal(made.get('main')?.replays,1);
  assert.equal(made.get('91')?.replays,1);
  assert.equal(made.get('sa')?.replays,2);
  await owner.close();
  assert.equal([...made.values()].every(t=>t.closed===1),true);
});

test('late source load fails both mount-session and reducer state-epoch guards',async()=>{
  let epoch=0;
  const made:FakeTransport[]=[];
  const owner=new P041AudioOwnerV1(()=>epoch,()=>{
    const t=new FakeTransport();made.push(t);return t as never;
  });
  const old=deferred<ArrayBuffer>();
  const pending=owner.select('main',0,()=>old.promise,true);
  epoch=1;
  assert.equal(owner.replay(1),true);
  old.resolve(new ArrayBuffer(1));
  assert.equal((await pending).accepted,false);
  assert.equal(made.length,0);
  const next=deferred<ArrayBuffer>();
  const second=owner.select('91',1,()=>next.promise,true);
  await owner.close();
  next.resolve(new ArrayBuffer(1));
  assert.equal((await second).accepted,false);
  assert.equal(made.length,0);
});

test('same-epoch replacement rejects an older selected feedback load',async()=>{
  let epoch=1;
  const made:FakeTransport[]=[];
  const owner=new P041AudioOwnerV1(()=>epoch,()=>{
    const t=new FakeTransport();made.push(t);return t as never;
  });
  const old=deferred<ArrayBuffer>();
  const pending=owner.select('76',epoch,()=>old.promise,true);
  assert.equal((await owner.select('sa',epoch,async()=>new ArrayBuffer(1))).accepted,true);
  old.resolve(new ArrayBuffer(1));
  assert.equal((await pending).accepted,false);
  assert.equal(owner.snapshot().owner,'sa');
  assert.equal(made.length,1);
  await owner.close();
});
