import assert from 'node:assert/strict';
import test from 'node:test';
import {P013AudioOwnerV1} from '../src/alg-l06-p013-audio-owner-v1';

import {AlgL06P013ClockV1} from '../src/alg-l06-p013-clock-v1';
type Main=ConstructorParameters<typeof P013AudioOwnerV1>[0];
type Spanish=ConstructorParameters<typeof P013AudioOwnerV1>[1];
const ok={accepted:true,reason:'fixture'};
const hasEvent=(events:readonly string[],event:string)=>events.some(value=>value===event);
function fixture(terminal=false){
 const events:string[]=[];
 let phase:ReturnType<Main['snapshot']>['phase']=terminal?'timeline-ended':'playing',frame=terminal?372:300;
 let saPhase:ReturnType<Spanish['snapshot']>['phase']='idle';let release!:()=>void;
 let disposal:Promise<void>=Promise.resolve();
 const initialMain=new AlgL06P013ClockV1({commitHeldFrame:()=>true}).snapshot();
 const main:Main={snapshot:()=>({...initialMain,phase,frame}),play:async()=>{events.push('main.play');phase='playing';return ok;},
  pause:()=>{events.push('main.pause');phase='paused';return ok;},
  replay:()=>{events.push('main.replay');phase='ready';frame=1;return ok;},
  setVolume:(v:number)=>{events.push(`main.volume:${v}`);return ok;},
  close:async()=>{events.push('main.close');phase='closed';}};
 const spanish:Spanish={snapshot:()=>({phase:saPhase,volume:1,failure:null,lessonCompleted:false}),
  start:async()=>{events.push('sa.start');saPhase='playing';return ok;},
  pause:()=>{events.push('sa.pause');saPhase='paused';return ok;},
  stop:()=>{events.push('sa.stop');saPhase='idle';return ok;},
  stopAndWait:async()=>{events.push('sa.retire');saPhase='idle';await disposal;events.push('sa.retired');},
  setVolume:(v:number)=>{events.push(`sa.volume:${v}`);return ok;},
  close:async()=>{events.push('sa.close');saPhase='closed';await disposal;}};
 return {owner:new P013AudioOwnerV1(main,spanish),events,main,spanish,
  holdDisposal:()=>{disposal=new Promise<void>(r=>{release=r;});},release:()=>release()};
}

test('explicit P013 SA pauses main and preserves its frame300 cursor',async()=>{
 const f=fixture();assert.equal(f.owner.snapshot().selectedAudio,'main');
 assert.deepEqual(f.events,[]);
 await f.owner.startSpanish();
 assert.deepEqual(f.events,['main.pause','sa.start']);
 assert.equal(f.owner.snapshot().frame,300);
 assert.equal(f.owner.snapshot().selectedAudio,'spanish');
 f.owner.pause();assert.equal(f.owner.snapshot().spanish.phase,'paused');
 await f.owner.play();assert.equal(hasEvent(f.events,'main.play'),false);
});

test('Return waits for SA context retirement then resumes saved main cursor',async()=>{
 const f=fixture();await f.owner.startSpanish();f.holdDisposal();
 const returning=f.owner.returnMain();await Promise.resolve();
 assert.equal(f.owner.snapshot().returning,true);
 assert.equal(hasEvent(f.events,'main.play'),false);
 f.release();assert.equal((await returning).accepted,true);
 assert.deepEqual(f.events.slice(-2),['sa.retired','main.play']);
 assert.equal(f.owner.snapshot().frame,300);
});

test('Return at conditional terminal372 leaves main held',async()=>{
 const f=fixture(true);await f.owner.startSpanish();await f.owner.returnMain();
 assert.equal(f.owner.snapshot().frame,372);
 assert.equal(f.owner.snapshot().phase,'timeline-ended');
 assert.equal(hasEvent(f.events,'main.play'),false);
});

test('Replay or navigation disposal cancels pending SA Return',async()=>{
 for(const operation of ['replay','close'] as const){
  const f=fixture();await f.owner.startSpanish();f.holdDisposal();
  const returning=f.owner.returnMain();await Promise.resolve();
  const canceled=f.owner[operation]();f.release();await canceled;
  assert.equal((await returning).accepted,false);
  assert.equal(hasEvent(f.events,'main.play'),false);
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  if(operation==='replay')assert.equal(f.owner.snapshot().frame,1);
 }
});

test('both streams receive volume and invalid volume fails closed',()=>{
 const f=fixture();assert.equal(f.owner.setVolume(0.4).accepted,true);
 assert.deepEqual(f.events,['main.volume:0.4','sa.volume:0.4']);
 assert.equal(f.owner.setVolume(-1).accepted,false);
});
