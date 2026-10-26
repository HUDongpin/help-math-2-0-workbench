import assert from 'node:assert/strict';
import test from 'node:test';
import {P025AudioOwnerV1,type P025MainAudio,type P025SeparateSpanishAudio}
  from '../src/alg-l06-p025-audio-owner-v1';

const ok=(reason:string)=>({accepted:true,reason});
const gate=()=>{
  let release=()=>{};
  const wait=new Promise<void>(resolve=>{release=resolve;});
  return {wait,release};
};
class Nodes {
  main=0;spanish=0;maximum=0;events:string[]=[];
  observe(){this.maximum=Math.max(this.maximum,this.main+this.spanish);
    assert(this.main+this.spanish<=1,'at most one native source node');}
}
class Main implements P025MainAudio {
  phase='ready';glossaryOpen:string|null=null;
  frame=1;events:string[]=[];
  playGate:ReturnType<typeof gate>|null=null;
  constructor(private readonly nodes:Nodes){}
  snapshot(){return {phase:this.phase,glossaryOpen:this.glossaryOpen,
    frame:this.frame,frameDomain:'sprite-21',audio:{phase:this.phase},failure:null};}
  async play(policy:{activation:'user';reducedMotion:boolean}){
    assert.equal(policy.activation,'user');
    this.phase='start-pending';this.events.push('main.start-pending');
    const pending=this.playGate;
    if(pending)await pending.wait;
    // This adversarial fake may complete even after an owner's first pause.
    // The owner must hold it again before SA starts.
    if(this.phase==='closed'||this.phase==='ready'&&this.frame===1&&pending)
      return {accepted:false,reason:'main-start-canceled'};
    this.phase='playing';this.nodes.main=1;this.nodes.observe();
    this.events.push('main.play');return ok('main-playing');
  }
  pause(){this.events.push('main.pause');this.nodes.events.push('main.pause');this.phase='paused';
    this.nodes.main=0;return ok('main-held');}
  replay(){this.events.push('main.replay');this.phase='ready';this.frame=1;
    this.nodes.main=0;this.glossaryOpen=null;return ok('main-replayed-held');}
  setVolume(value:number){assert(value>=0&&value<=1);return ok('volume-set');}
  async close(){this.events.push('main.close');this.phase='closed';this.nodes.main=0;}
}
class Spanish implements P025SeparateSpanishAudio {
  phase='idle';events:string[]=[];
  startGate:ReturnType<typeof gate>|null=null;
  retirementGate:ReturnType<typeof gate>|null=null;
  constructor(private readonly nodes:Nodes){}
  snapshot(){return {phase:this.phase,failure:null};}
  async start(policy:{activation:'user'}){
    assert.equal(policy.activation,'user');this.phase='loading';
    this.events.push('sa.loading');
    if(this.startGate)await this.startGate.wait;
    // Deliberately ignore a prior stop to model a late third-party start.
    // Owner must wait for this promise and retire the resulting node.
    this.phase='playing';this.nodes.spanish=1;this.nodes.observe();
    this.events.push('sa.play');this.nodes.events.push('sa.play');return ok('sa-playing');
  }
  pause(){this.events.push('sa.pause');this.phase='paused';
    this.nodes.spanish=0;return ok('sa-held');}
  stop(){this.events.push('sa.stop');this.phase='idle';
    this.nodes.spanish=0;return ok('sa-stopped');}
  async stopAndWait(){this.stop();if(this.retirementGate)await this.retirementGate.wait;
    this.events.push('sa.retired');}
  setVolume(value:number){assert(value>=0&&value<=1);return ok('volume-set');}
  async close(){this.stop();this.phase='closed';this.events.push('sa.closed');}
  naturalEnd(){assert.equal(this.phase,'playing');this.phase='ended';
    this.nodes.spanish=0;this.events.push('sa.eof');}
}
const USER={activation:'user' as const,reducedMotion:false};
function fixture(){const nodes=new Nodes(),main=new Main(nodes),spanish=new Spanish(nodes);
  return {nodes,main,spanish,owner:new P025AudioOwnerV1(main,spanish)};}

test('only explicit Play or SA starts sound; locale has no owner API or side effect',async()=>{
  const f=fixture();
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  assert.equal(f.owner.snapshot().frame,1);
  assert.equal(f.owner.snapshot().frameDomain,'sprite-21');
  assert.equal(f.owner.snapshot().phase,'ready');
  assert.equal(f.owner.snapshot().ownershipFailure,null);
  assert.equal(f.nodes.maximum,0);
  assert.equal((await f.owner.play({activation:'automatic' as 'user',reducedMotion:false})).accepted,false);
  assert.equal((await f.owner.startSpanish({activation:'automatic' as 'user'})).accepted,false);
  assert.equal(f.nodes.maximum,0);
  assert.equal((await f.owner.play(USER)).accepted,true);
  assert.equal(f.nodes.main,1);
  assert.equal((await f.owner.startSpanish({activation:'user'})).accepted,true);
  assert.equal(f.nodes.main,0);assert.equal(f.nodes.spanish,1);
  assert.equal((await f.owner.play(USER)).reason,'explicit-spanish-return-required');
  await f.owner.close();assert.equal(f.nodes.main+f.nodes.spanish,0);
});

test('SA selection holds main before loading and late main start is held before SA',async()=>{
  const f=fixture();f.main.playGate=gate();
  const pendingMain=f.owner.play(USER);
  await Promise.resolve();
  const pendingSA=f.owner.startSpanish({activation:'user'});
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  f.main.playGate.release();
  assert.equal((await pendingMain).reason,'stale-main-start');
  assert.equal((await pendingSA).accepted,true);
  assert.equal(f.nodes.main,0);assert.equal(f.nodes.spanish,1);
  assert.equal(f.nodes.maximum,1);
  assert(f.nodes.events.lastIndexOf('main.pause')<f.nodes.events.indexOf('sa.play'));
  await f.owner.close();
});

test('Replay supersedes pending main start and leaves its first frame silent',async()=>{
  const f=fixture();f.main.playGate=gate();
  const pending=f.owner.play(USER);
  await Promise.resolve();
  const replay=f.owner.replay();
  f.main.playGate.release();
  assert.equal((await pending).reason,'stale-main-start');
  assert.equal((await replay).accepted,true);
  assert.equal(f.owner.snapshot().frame,1);
  assert.equal(f.owner.snapshot().phase,'ready');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  await f.owner.close();
});

test('Pause during SA load cancels a late node and explicit Return releases ownership held',async()=>{
  const f=fixture();await f.owner.play(USER);
  f.spanish.startGate=gate();
  const pending=f.owner.startSpanish({activation:'user'});
  await Promise.resolve();
  assert.equal(f.owner.pause().accepted,true);
  assert(f.spanish.events.includes('sa.pause'));
  const returning=f.owner.returnMain({...USER,resumeMain:false});
  f.spanish.startGate.release();
  assert.equal((await pending).reason,'stale-spanish-start');
  assert.equal((await returning).accepted,true);
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  assert(f.spanish.events.includes('sa.retired'));
  await f.owner.close();
});

test('Return waits for delayed native SA retirement before main resumes',async()=>{
  const f=fixture();await f.owner.play(USER);
  await f.owner.startSpanish({activation:'user'});
  f.spanish.retirementGate=gate();
  const returning=f.owner.returnMain(USER);
  await Promise.resolve();
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  assert.equal(f.main.events.filter(x=>x==='main.play').length,1);
  f.spanish.retirementGate.release();
  assert.equal((await returning).accepted,true);
  assert.equal(f.nodes.main,1);assert.equal(f.nodes.spanish,0);
  assert.equal(f.nodes.maximum,1);
  await f.owner.close();
});

test('natural SA EOF holds main until explicit Return; terminal main remains held',async()=>{
  const f=fixture();await f.owner.play(USER);
  await f.owner.startSpanish({activation:'user'});
  f.spanish.naturalEnd();
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.owner.snapshot().playbackPhase,'ended');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  assert.equal((await f.owner.play(USER)).reason,'explicit-spanish-return-required');
  f.main.phase='timeline-ended';
  assert.equal((await f.owner.returnMain(USER)).reason,'terminal-main-remains-held');
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  await f.owner.close();
});

test('Replay during pending SA load retires its late node and stays held',async()=>{
  const f=fixture();await f.owner.play(USER);
  f.spanish.startGate=gate();
  const pending=f.owner.startSpanish({activation:'user'});
  await Promise.resolve();
  const replay=f.owner.replay();
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  f.spanish.startGate.release();
  assert.equal((await pending).reason,'stale-spanish-start');
  assert.equal((await replay).accepted,true);
  assert.equal(f.owner.snapshot().main.phase,'ready');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  assert.equal((await f.owner.play(USER)).accepted,true);
  assert.equal(f.nodes.maximum,1);
  await f.owner.close();
});

test('Pause and Replay supersede delayed Return without an automatic restart',async()=>{
  const f=fixture();await f.owner.play(USER);
  await f.owner.startSpanish({activation:'user'});
  f.spanish.retirementGate=gate();
  const returning=f.owner.returnMain(USER);
  f.owner.pause();
  f.spanish.retirementGate.release();
  assert.equal((await returning).reason,'stale-spanish-return');
  assert.equal(f.owner.snapshot().selectedAudio,'main');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  await f.owner.startSpanish({activation:'user'});
  f.spanish.retirementGate=gate();
  const returningAgain=f.owner.returnMain(USER);
  const replay=f.owner.replay();
  f.spanish.retirementGate.release();
  assert.equal((await returningAgain).reason,'stale-spanish-return');
  assert.equal((await replay).accepted,true);
  assert.equal(f.owner.snapshot().main.phase,'ready');
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  await f.owner.close();
});

test('new SA reservation survives an older Return after Replay',async()=>{
  const f=fixture();await f.owner.play(USER);
  await f.owner.startSpanish({activation:'user'});
  f.spanish.retirementGate=gate();
  const oldReturn=f.owner.returnMain(USER);
  const replay=f.owner.replay();
  const newStart=f.owner.startSpanish({activation:'user'});
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  f.spanish.retirementGate.release();
  assert.equal((await oldReturn).reason,'stale-spanish-return');
  assert.equal((await replay).reason,'stale-replay');
  assert.equal((await newStart).accepted,true);
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.nodes.main,0);assert.equal(f.nodes.spanish,1);
  assert.equal(f.nodes.maximum,1);
  await f.owner.close();
});

test('close supersedes delayed Return and drains the selected SA',async()=>{
  const f=fixture();await f.owner.play(USER);
  await f.owner.startSpanish({activation:'user'});
  f.spanish.retirementGate=gate();
  const returning=f.owner.returnMain(USER);
  const closing=f.owner.close();
  f.spanish.retirementGate.release();
  assert.equal((await returning).reason,'stale-spanish-return');
  await closing;
  assert.equal(f.owner.snapshot().closed,true);
  assert.equal(f.nodes.main+f.nodes.spanish,0);
});

test('close during pending SA load waits for late source and closes both',async()=>{
  const f=fixture();await f.owner.play(USER);
  f.spanish.startGate=gate();
  const pending=f.owner.startSpanish({activation:'user'});
  await Promise.resolve();
  const closing=f.owner.close();
  f.spanish.startGate.release();
  assert.equal((await pending).reason,'stale-spanish-start');
  await closing;
  assert.equal(f.nodes.main+f.nodes.spanish,0);
  assert.equal(f.owner.snapshot().closed,true);
  assert.equal(f.owner.snapshot().spanish.phase,'closed');
  assert.equal(f.owner.snapshot().main.phase,'closed');
  assert.equal((await f.owner.play(USER)).accepted,false);
});

test('close during pending main start cancels its late completion',async()=>{
  const f=fixture();f.main.playGate=gate();
  const pending=f.owner.play(USER);
  await Promise.resolve();
  const closing=f.owner.close();
  f.main.playGate.release();
  assert.equal((await pending).reason,'stale-main-start');
  await closing;
  assert.equal(f.owner.snapshot().closed,true);
  assert.equal(f.nodes.main+f.nodes.spanish,0);
});
