import assert from 'node:assert/strict';
import test from 'node:test';
import {P020AudioOwnerV1} from '../src/alg-l06-p020-audio-owner-v1';

type Main=ConstructorParameters<typeof P020AudioOwnerV1>[0];
type Spanish=ConstructorParameters<typeof P020AudioOwnerV1>[1];
const ok={accepted:true,reason:'fixture'};
function fixture(initial:'playing'|'quiz-held'|'feedback-held'|'timeline-ended'='playing'){
  const events:string[]=[];let phase:string=initial,selected='idle',glossaryOpen:string|null=null;
  let release!:()=>void;let disposal:Promise<void>=Promise.resolve();
  const main={snapshot:()=>({phase,frame:58,quiz:{feedbackFrame:20,glossaryOpen}}),
    play:async()=>{events.push('main.play');phase='playing';return ok;},
    pause:()=>{events.push('main.pause');phase='paused';return ok;},
    replay:()=>{events.push('main.replay');phase='ready';return ok;},
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
  return {owner:new P020AudioOwnerV1(main,spanish),events,
    setGlossary:(key:string|null)=>{glossaryOpen=key;},
    deferDisposal:()=>{disposal=new Promise<void>(resolve=>{release=resolve;});},
    release:()=>release()};
}

test('explicit SA stops active main and retains quiz/feedback cursor for Return',async()=>{
  const f=fixture();
  await f.owner.startSpanish();
  assert.deepEqual(f.events,['main.pause','sa.start']);
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.owner.snapshot().frame,58);
  await f.owner.returnMain();
  assert.deepEqual(f.events.slice(-2),['sa.retired','main.play']);
});

test('Return to quiz, wrong popup, or terminal leaves main held',async()=>{
  for(const phase of ['quiz-held','feedback-held','timeline-ended'] as const){
    const f=fixture(phase);await f.owner.startSpanish();
    await f.owner.returnMain();
    assert.equal(f.owner.snapshot().phase,phase);
    assert.equal(f.events.includes('main.play'),false);
  }
});

test('glossary blocks SA Start and keeps Return held if opened while SA owns audio',async()=>{
  const f=fixture('playing');
  f.setGlossary('Function');
  assert.equal((await f.owner.startSpanish()).accepted,false);
  assert.equal(f.events.length,0);
  f.setGlossary(null);
  assert.equal((await f.owner.startSpanish()).accepted,true);
  f.setGlossary('Input');
  assert.equal((await f.owner.returnMain()).accepted,true);
  assert.equal(f.events.includes('main.play'),false);
});

test('Return awaits SA context retirement and Replay cancels pending return',async()=>{
  const f=fixture();await f.owner.startSpanish();f.deferDisposal();
  const returning=f.owner.returnMain();await Promise.resolve();
  assert.equal(f.owner.snapshot().returning,true);
  assert.equal(f.events.includes('main.play'),false);
  f.owner.replay();f.release();
  assert.equal((await returning).accepted,false);
  assert.equal(f.events.includes('main.play'),false);
  assert.equal(f.owner.snapshot().selectedAudio,'main');
});

test('both streams get bounded volume; close stops both',async()=>{
  const f=fixture();
  assert.equal(f.owner.setVolume(.4).accepted,true);
  assert.deepEqual(f.events,['main.volume:0.4','sa.volume:0.4']);
  assert.equal(f.owner.setVolume(-1).accepted,false);
  await f.owner.close();
  assert(f.events.includes('main.close'));assert(f.events.includes('sa.close'));
});
