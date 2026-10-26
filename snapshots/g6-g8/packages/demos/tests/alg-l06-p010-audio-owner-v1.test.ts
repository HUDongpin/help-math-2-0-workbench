import test from 'node:test';
import assert from 'node:assert/strict';
import {P010AudioOwnerV1} from '../src/alg-l06-p010-audio-owner-v1';
import {AlgL06P010ClockV1} from '../src/alg-l06-p010-clock-v1';
type Main=ConstructorParameters<typeof P010AudioOwnerV1>[0];
type Spanish=ConstructorParameters<typeof P010AudioOwnerV1>[1];
const ok={accepted:true,reason:'fixture'};
function fixture(terminal=false){
 const events:string[]=[];
 let phase:ReturnType<Main['snapshot']>['phase']=terminal?'timeline-ended':'playing',frame=terminal?303:317;
 let saPhase:ReturnType<Spanish['snapshot']>['phase']='idle';let release!:()=>void;
 let disposal:Promise<void>=Promise.resolve();
 const initialMain=new AlgL06P010ClockV1({commitHeldFrame:()=>true}).snapshot();
 const main:Main={snapshot:()=>({...initialMain,phase,frame}),play:async()=>{events.push('main.play');phase='playing';return ok;},
  pause:()=>{events.push('main.pause');phase='paused';return ok;},
  replay:()=>{events.push('main.replay');phase='ready';frame=1;return ok;},
  setVolume:(v:number)=>{events.push(`main.volume:${v}`);return ok;},
  close:async()=>{events.push('main.close');phase='closed';}};
 const spanish:Spanish={snapshot:()=>({phase:saPhase,volume:1,failure:null,lessonCompleted:false}),start:async()=>{events.push('sa.start');saPhase='playing';return ok;},
  pause:()=>{events.push('sa.pause');saPhase='paused';return ok;},
  stop:()=>{events.push('sa.stop');saPhase='idle';return ok;},
  stopAndWait:async()=>{events.push('sa.retire');saPhase='idle';await disposal;events.push('sa.retired');},
  setVolume:(v:number)=>{events.push(`sa.volume:${v}`);return ok;},
  close:async()=>{events.push('sa.close');saPhase='closed';await disposal;}};
 return {owner:new P010AudioOwnerV1(main,spanish),events,main,spanish,
  holdDisposal:()=>{disposal=new Promise<void>(r=>{release=r;});},release:()=>release()};
}
test('explicit SA starts only after main pauses and retains the exact main frame',async()=>{
 const {owner,events}=fixture();
 assert.equal(owner.snapshot().selectedAudio,'main');assert.equal(events.length,0);
 await owner.startSpanish();
 assert.deepEqual(events,['main.pause','sa.start']);
 assert.equal(owner.snapshot().frame,317);assert.equal(owner.snapshot().selectedAudio,'spanish');
 owner.pause();assert.equal(owner.snapshot().spanish.phase,'paused');
 await owner.play();assert.equal(events.at(-1),'sa.start');
 assert.equal(events.includes('main.play'),false);
});
test('return waits for SA context disposal before restoring the retained main position',async()=>{
 const f=fixture();await f.owner.startSpanish();f.holdDisposal();
 const returning=f.owner.returnMain();await Promise.resolve();
 assert.equal(f.owner.snapshot().returning,true);assert.equal(f.events.includes('main.play'),false);
 f.release();assert.equal((await returning).accepted,true);
 assert.deepEqual(f.events.slice(-2),['sa.retired','main.play']);
 assert.equal(f.owner.snapshot().frame,317);assert.equal(f.owner.snapshot().selectedAudio,'main');
});
test('SA return at conditional host terminal frame303 does not revive main playback',async()=>{
 const f=fixture(true);await f.owner.startSpanish();await f.owner.returnMain();
 assert.equal(f.owner.snapshot().frame,303);assert.equal(f.owner.snapshot().phase,'timeline-ended');
 assert.equal(f.events.includes('main.play'),false);
});
test('Replay and close invalidate a pending SA return without stale main resume',async()=>{
 for(const operation of ['replay','close'] as const){
  const f=fixture();await f.owner.startSpanish();f.holdDisposal();
  const returning=f.owner.returnMain();await Promise.resolve();
  const canceled=f.owner[operation]();f.release();await canceled;
  assert.equal((await returning).accepted,false);
  assert.equal(f.events.includes('main.play'),false);
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  if(operation==='replay')assert.equal(f.owner.snapshot().frame,1);
 }
});
test('a failed SA retirement holds main and exposes the failure',async()=>{
 const f=fixture();f.spanish.stopAndWait=async()=>{throw Error('retirement-failed');};
 await f.owner.startSpanish();assert.equal((await f.owner.returnMain()).accepted,false);
 assert.equal(f.events.includes('main.play'),false);
 assert.equal(f.owner.snapshot().ownershipFailure,'retirement-failed');
});
test('host volume applies to both owned streams and rejects invalid gain',()=>{
 const f=fixture();assert.equal(f.owner.setVolume(.35).accepted,true);
 assert.deepEqual(f.events,['main.volume:0.35','sa.volume:0.35']);
 assert.equal(f.owner.setVolume(-1).accepted,false);assert.equal(f.events.length,2);
});
