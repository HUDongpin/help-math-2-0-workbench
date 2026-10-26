import assert from 'node:assert/strict';
import test from 'node:test';
import {P022AudioOwnerV1} from '../src/alg-l06-p022-audio-owner-v1';

type Main=ConstructorParameters<typeof P022AudioOwnerV1>[0];
type Spanish=ConstructorParameters<typeof P022AudioOwnerV1>[1];
const ok={accepted:true,reason:'fixture'};
function fixture(initial:'playing'|'paused'|'timeline-ended'='playing'){
  const events:string[]=[];let phase:string=initial,selected='idle',glossaryOpen:string|null=null;
  let release!:()=>void,disposal:Promise<void>=Promise.resolve();
  const main={snapshot:()=>({phase,frame:422,glossaryOpen,failure:null}),
    play:async()=>{events.push('main.play');phase='playing';return ok;},
    pause:()=>{events.push('main.pause');phase='paused';return ok;},
    replay:()=>{events.push('main.replay');phase='ready';glossaryOpen=null;return ok;},
    setVolume:(n:number)=>{events.push(`main.volume:${n}`);return ok;},
    close:async()=>{events.push('main.close');phase='closed';}} as unknown as Main;
  const spanish={snapshot:()=>({phase:selected,failure:null}),
    start:async()=>{events.push('sa.start');selected='playing';return ok;},
    pause:()=>{events.push('sa.pause');selected='paused';return ok;},
    stop:()=>{events.push('sa.stop');selected='idle';return ok;},
    stopAndWait:async()=>{events.push('sa.retire');selected='idle';
      await disposal;events.push('sa.retired');},
    setVolume:(n:number)=>{events.push(`sa.volume:${n}`);return ok;},
    close:async()=>{events.push('sa.close');selected='closed';await disposal;}} as unknown as Spanish;
  return {owner:new P022AudioOwnerV1(main,spanish),events,
    openGlossary:()=>{glossaryOpen='Function';},
    finishSpanish:()=>{selected='ended';},
    deferDisposal:()=>{disposal=new Promise<void>(resolve=>{release=resolve;});},
    release:()=>release()};
}

test('explicit SA pauses the two-range main clock and Return resumes its held cursor',async()=>{
  const f=fixture();
  assert.equal((await f.owner.startSpanish()).accepted,true);
  assert.deepEqual(f.events,['main.pause','sa.start']);
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.owner.snapshot().frame,422);
  assert.equal((await f.owner.returnMain()).accepted,true);
  assert.deepEqual(f.events.slice(-2),['sa.retired','main.play']);
  assert.equal(f.owner.snapshot().selectedAudio,'main');
});

test('SA EOF selection remains separate; Return from terminal main never restarts it',async()=>{
  const f=fixture('timeline-ended');await f.owner.startSpanish();f.finishSpanish();
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.owner.snapshot().spanish.phase,'ended');
  const returned=await f.owner.returnMain();
  assert.equal(returned.reason,'terminal-main-remains-held');
  assert.equal(f.owner.snapshot().phase,'timeline-ended');
  assert.equal(f.events.includes('main.play'),false);
});

test('an open glossary rejects SA and Replay cancels pending Return',async()=>{
  const g=fixture();g.openGlossary();
  assert.equal((await g.owner.startSpanish()).reason,'glossary-open-hold');
  assert.equal(g.events.includes('sa.start'),false);
  const f=fixture();await f.owner.startSpanish();f.deferDisposal();
  const returning=f.owner.returnMain();await Promise.resolve();
  assert.equal(f.owner.snapshot().returning,true);
  f.owner.replay();f.release();
  assert.equal((await returning).accepted,false);
  assert.equal(f.events.includes('main.play'),false);
  assert.equal(f.owner.snapshot().selectedAudio,'main');
});

test('bounded volume reaches both owners and close retires both',async()=>{
  const f=fixture();assert.equal(f.owner.setVolume(.4).accepted,true);
  assert.deepEqual(f.events,['main.volume:0.4','sa.volume:0.4']);
  assert.equal(f.owner.setVolume(-1).accepted,false);
  await f.owner.close();
  assert(f.events.includes('main.close'));assert(f.events.includes('sa.close'));
});
