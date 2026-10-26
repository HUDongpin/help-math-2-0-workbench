import assert from 'node:assert/strict';
import test from 'node:test';
import {P026AudioOwnerV1,type P026MainAudio,type P026SeparateSpanishAudio}
  from '../src/alg-l06-p026-audio-owner-v1';

const ok=(reason:string)=>({accepted:true,reason});
const gate=()=>{let release=()=>{};const wait=new Promise<void>(resolve=>{release=resolve;});
  return {wait,release};};
class Main implements P026MainAudio{
  phase='ready';frame=1;glossaryOpen:string|null=null;nodes=0;
  pending:ReturnType<typeof gate>|null=null;events:string[]=[];
  snapshot(){return {phase:this.phase,frame:this.frame,frameDomain:'sprite-55',
    audio:{phase:this.phase},glossaryOpen:this.glossaryOpen,failure:null};}
  async play(){this.phase='start-pending';this.events.push('main.pending');
    if(this.pending)await this.pending.wait;
    if(this.phase==='ready')return {accepted:false,reason:'canceled'};
    this.phase='playing';this.nodes=2;this.events.push('main.two-ranges');
    return ok('main-playing');}
  pause(){this.phase='paused';this.nodes=0;this.events.push('main.held');return ok('held');}
  replay(){this.phase='ready';this.frame=1;this.nodes=0;this.glossaryOpen=null;
    this.events.push('main.replay');return ok('replayed');}
  setVolume(){return ok('volume-set');}
  async close(){this.phase='closed';this.nodes=0;this.events.push('main.closed');}
}
class Spanish implements P026SeparateSpanishAudio{
  phase='idle';nodes=0;events:string[]=[];
  pending:ReturnType<typeof gate>|null=null;
  constructor(private readonly main:Main){}
  snapshot(){return {phase:this.phase,failure:null};}
  async start(){this.phase='loading';this.events.push('sa.loading');
    if(this.pending)await this.pending.wait;
    assert.equal(this.main.nodes,0,'both main native nodes retire before SA');
    this.phase='playing';this.nodes=1;this.events.push('sa.play');return ok('sa-playing');}
  pause(){this.phase='paused';this.nodes=0;return ok('sa-paused');}
  stop(){this.phase='idle';this.nodes=0;return ok('sa-stopped');}
  async stopAndWait(){this.stop();this.events.push('sa.retired');}
  setVolume(){return ok('volume-set');}
  async close(){this.stop();this.phase='closed';}
}
const USER={activation:'user' as const,reducedMotion:false};
function fixture(){const main=new Main(),spanish=new Spanish(main);
  return {main,spanish,owner:new P026AudioOwnerV1(main,spanish)};}

test('P026 two-range main yields exclusive ownership before explicit SA and stays held at natural SA EOF',async()=>{
  const f=fixture();
  assert.equal((await f.owner.startSpanish({activation:'automatic' as 'user'})).accepted,false);
  assert.equal((await f.owner.play({activation:'automatic' as 'user',reducedMotion:false})).accepted,false);
  assert.equal(f.main.nodes+f.spanish.nodes,0);
  assert((await f.owner.play(USER)).accepted);assert.equal(f.main.nodes,2);
  assert((await f.owner.startSpanish({activation:'user'})).accepted);
  assert.equal(f.main.nodes,0);assert.equal(f.spanish.nodes,1);
  f.spanish.phase='ended';f.spanish.nodes=0;
  assert.equal(f.owner.snapshot().selectedAudio,'spanish');
  assert.equal((await f.owner.play(USER)).reason,'explicit-spanish-return-required');
  assert((await f.owner.returnMain({...USER,resumeMain:false})).accepted);
  assert.equal(f.main.nodes+f.spanish.nodes,0);
  await f.owner.close();
});

test('P026 Replay cancels a pending two-range start and resets held frame 1',async()=>{
  const f=fixture();f.main.pending=gate();
  const starting=f.owner.play(USER);await Promise.resolve();
  const replaying=f.owner.replay();f.main.pending.release();
  assert.equal((await starting).reason,'stale-main-start');
  assert((await replaying).accepted);
  assert.equal(f.owner.snapshot().frame,1);
  assert.equal(f.main.nodes+f.spanish.nodes,0);
  await f.owner.close();
});

test('P026 PAUSE during optional SA load cancels the reservation before Return',async()=>{
  const f=fixture();await f.owner.play(USER);f.spanish.pending=gate();
  const starting=f.owner.startSpanish({activation:'user'});await Promise.resolve();
  assert.equal(f.main.nodes,0);
  f.owner.pause();const returning=f.owner.returnMain({...USER,resumeMain:false});
  f.spanish.pending.release();
  assert.equal((await starting).reason,'stale-spanish-start');
  assert((await returning).accepted);
  assert.equal(f.main.nodes+f.spanish.nodes,0);
  await f.owner.close();
});
