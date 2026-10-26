import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P024DomainClockV1,P024_MAIN_QUIZ_AUDIO_BOUNDARY,
 P024_VISUAL_TAIL_POLICY,inspectP024BrowserDecode,
 type P024AudioContextLike} from '../src/alg-l06-p024-clock-v1';
import {P024AudioOwnerV1,type P024SeparateSpanishAudio}
 from '../src/alg-l06-p024-audio-owner-v1';
import {p024InitialState,p024Reduce} from '../src/alg-l06-p024-state-v1';
import {P024_AUDIO_DOMAINS,P024_AUDIO_FIRST_SEEK_SAMPLES,
 p024AudioDomain,type P024AudioDomainId} from '../src/alg-l06-p024-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const source=(id:P024AudioDomainId)=>{
 const bytes=readFileSync(new URL(p024AudioDomain(id).sourcePath,root));
 return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
};
class Context extends EventTarget {
 private time=0;
 get currentTime(){return this.time;}
 set currentTime(value:number){this.time=value;}
 state:'suspended'|'running'|'closed'='suspended';
 sampleRate=22050;destination={};active=0;closeCount=0;
 starts:{when:number;offset:number}[]=[];
 scheduledStops:{when:number;fire:()=>void;fired:boolean}[]=[];
 fireScheduledStops(){
  for(const item of this.scheduledStops)
   if(!item.fired&&item.when<=this.currentTime){item.fired=true;item.fire();}
 }
 decodeGate:Promise<void>|null=null;
 decodeRelease:(()=>void)|null=null;
 deferDecode(){this.decodeGate=new Promise<void>(resolve=>{this.decodeRelease=resolve;});}
 async decodeAudioData(bytes:ArrayBuffer){
  await this.decodeGate;
  const row=P024_AUDIO_DOMAINS.find(item=>item.sourceBytes===bytes.byteLength);
  assert(row);
  return {sampleRate:22050,length:row.declaredSamples,numberOfChannels:1,
   duration:row.declaredSamples/22050} as AudioBuffer;
 }
 createGain(){return {gain:{setValueAtTime(){}},connect(){},disconnect(){}} as unknown as GainNode;}
 createBufferSource(){
  const context=this;let running=false;
  const node={buffer:null,onended:null as null|(()=>void),connect(){},disconnect(){},
   start(when:number,offset:number){assert(!running);running=true;context.active++;
    context.starts.push({when,offset});},
   stop(when?:number){
    if(when!==undefined&&when>context.currentTime){
     const item={when,fired:false,fire:()=>{
      if(running){running=false;context.active--;this.onended?.();}
     }};
     context.scheduledStops.push(item);return;
    }
    if(running){running=false;context.active--;}
   }
  };
  return node as unknown as AudioBufferSourceNode;
 }
 async resume(){assert.notEqual(this.state,'closed');this.state='running';
  this.dispatchEvent(new Event('statechange'));}
 async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';
  this.dispatchEvent(new Event('statechange'));}}
}
const USER={activation:'user' as const,reducedMotion:false};
const AUTO={activation:'automatic' as const,reducedMotion:false};
const fixture=()=>{const context=new Context();
 return {context,clock:new P024DomainClockV1({createContext:()=>context as unknown as P024AudioContextLike})};};
class Spanish {
 phase='idle';active=0;events:string[]=[];
 private wait:Promise<void>|null=null;
 private startWait:Promise<void>|null=null;
 release:(()=>void)|null=null;
 releaseStart:(()=>void)|null=null;
 deferRetirement(){this.wait=new Promise<void>(resolve=>{this.release=resolve;});}
 deferStart(){this.startWait=new Promise<void>(resolve=>{this.releaseStart=resolve;});}
 snapshot(){return {phase:this.phase,failure:null};}
 async start(){this.events.push('sa.start-pending');await this.startWait;
  this.events.push('sa.start');this.phase='playing';this.active=1;
  return {accepted:true,reason:'playing'};}
 pause(){this.events.push('sa.pause');this.phase='paused';this.active=0;
  return {accepted:true,reason:'paused'};}
 stop(){this.events.push('sa.stop');this.phase='idle';this.active=0;
  return {accepted:true,reason:'stopped'};}
 async stopAndWait(){this.stop();await this.wait;this.events.push('sa.retired');this.wait=null;}
 setVolume(_n:number){return {accepted:true,reason:'volume'};}
 async close(){this.stop();await this.wait;this.phase='closed';}
}

test('browser decode metadata is observed, while FFmpeg PCM identity remains advisory',async()=>{
 const f=fixture();
 assert.equal((await f.clock.prepare('sprite-208',source('sprite-208'))).accepted,true);
 assert.equal(f.clock.seek('sprite-208',1).accepted,true);
 assert.equal(f.clock.snapshot().browserDecode?.samples,697536);
 assert.equal(f.clock.snapshot().browserDecode?.ffmpegSampleCountMatches,true);
 assert.equal((await f.clock.play('sprite-208',1,AUTO)).reason,'explicit-user-start-required');
 assert.equal((await f.clock.play('sprite-208',1,USER)).accepted,true);
 assert.deepEqual(f.context.starts,[{when:1/12,offset:1673/22050}]);
 assert.equal(f.context.active,1);
 const observed=inspectP024BrowserDecode('sprite-208',{
  sampleRate:22050,length:697000,numberOfChannels:1,duration:697000/22050});
 assert.equal(observed.ffmpegSampleCountMatches,false);
 assert.equal(observed.ffmpegPcmSha256IsBrowserProof,false);
 await f.clock.close();assert.equal(f.context.active,0);
});

test('source hold keeps fractional decoder offset; other domain cannot overlap',async()=>{
 const f=fixture();
 await f.clock.prepare('sprite-208',source('sprite-208'));
 await f.clock.play('sprite-208',1,USER);
 f.context.currentTime=(154.35-1)/12;
 f.clock.tick();f.clock.hold();
 const held=f.clock.snapshot();assert.equal(held.frame,154);
 assert(held.decodedSample>P024_AUDIO_FIRST_SEEK_SAMPLES);
 assert.equal(f.context.active,0);
 await f.clock.prepare('sprite-155',source('sprite-155'));
 await f.clock.play('sprite-155',2,AUTO);
 assert.equal(f.context.active,1);
 f.clock.hold();assert.equal(f.context.active,0);
 assert.equal((await f.clock.play('sprite-208',154,{...AUTO,resumeHeld:true})).accepted,true);
 const resumed=f.clock.snapshot();
 assert.equal(resumed.position,held.position);
 assert.equal(f.context.starts.at(-1)?.offset,held.decodedSample/22050);
 assert(f.context.starts.at(-1)!.offset>f.context.starts[0].offset);
 assert.equal(f.context.active,1);
 await f.clock.close();
});

test('scheduled native main stop reaches quiz 154 even when RAF observes context much later',
 async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 let state=p024Reduce(p024InitialState(),{type:'play'});
 assert.equal((await owner.sync(state,{...USER,source:source('sprite-208')})).accepted,true);
 assert.equal(P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample,280973);
 assert.deepEqual(f.context.scheduledStops.map(item=>item.when),[(154-1)/12]);
 assert.equal(f.context.active,1);
 f.context.currentTime=20; // One delayed RAF must never consume main frames 155+.
 const boundary=owner.snapshot().clock;
 assert.equal(boundary.phase,'paused');assert.equal(boundary.frame,154);
 assert.equal(boundary.position,154);
 assert.equal(boundary.decodedSample,P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample);
 assert.equal(boundary.heldSourceSample,P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample);
 assert.equal(boundary.quizBoundaryReached,true);
 assert.equal(boundary.nativeBufferEndedObserved,false);
 assert.equal(boundary.decodedSampleExhaustedObserved,false);
 assert.equal(f.context.active,0);
 assert.equal((await owner.sync(state,AUTO)).reason,'quiz-boundary-held-await-reducer');
 assert.equal(f.context.starts.length,1,'late owner sync cannot replay the main prefix');
 state=p024Reduce(state,{type:'tick',frames:boundary.frame-state.mainFrame});
 assert.equal(state.phase,'quiz');assert.equal(state.mainFrame,154);
 assert.equal((await owner.sync(state,AUTO)).accepted,true);
 state=p024Reduce(state,{type:'answer',answer:'C',variant:1});
 assert.equal((await owner.sync(state,{...AUTO,source:source('sprite-155')})).accepted,true);
 assert.equal(f.context.active,1);
 state=p024Reduce(state,{type:'tick',frames:23});
 assert.equal(state.phase,'main');assert.equal(state.mainFrame,154);
 assert.equal((await owner.sync(state,AUTO)).accepted,true);
 assert.equal(f.context.active,1);
 assert.equal(f.context.starts.length,3);
 assert.equal(f.context.starts[2]?.offset,
  P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample/22050);
 assert.equal(f.context.scheduledStops.length,1,
  'resumed main audio has no second quiz stop');
 assert.equal(owner.snapshot().clock.quizBoundaryReached,false);
 await owner.close();assert.equal(f.context.active,0);
});

test('scheduled stop onended is a quiz boundary, not decoded buffer EOF',async()=>{
 const f=fixture();
 await f.clock.prepare('sprite-208',source('sprite-208'));
 assert.equal((await f.clock.play('sprite-208',1,{...USER,stopAtFrame:154})).accepted,true);
 const stop=f.context.scheduledStops[0];assert(stop);
 f.context.currentTime=stop.when;
 f.context.fireScheduledStops();
 const snap=f.clock.snapshot();
 assert.equal(snap.phase,'paused');assert.equal(snap.frame,154);
 assert.equal(snap.quizBoundaryReached,true);
 assert.equal(snap.heldSourceSample,P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample);
 assert.equal(snap.nativeBufferEndedObserved,false);
 assert.equal(snap.decodedSampleExhaustedObserved,false);
 assert.equal(snap.audioEofPosition,null);
 assert.equal(f.context.active,0);
 assert.equal((await f.clock.play('sprite-208',153,{...AUTO,
  stopAtFrame:154,resumeHeld:true})).reason,'quiz-boundary-await-reducer');
 assert.equal(f.context.starts.length,1);
 await f.clock.close();
});

test('suspended context after native stop still preserves the quiz sample',async()=>{
 const f=fixture();
 await f.clock.prepare('sprite-208',source('sprite-208'));
 await f.clock.play('sprite-208',1,{...USER,stopAtFrame:154});
 f.context.currentTime=20;f.context.state='suspended';
 f.context.dispatchEvent(new Event('statechange'));
 const snap=f.clock.snapshot();
 assert.equal(snap.phase,'paused');assert.equal(snap.frame,154);
 assert.equal(snap.heldSourceSample,P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample);
 assert.equal(snap.quizBoundaryReached,true);assert.equal(f.context.active,0);
 await f.clock.close();
});

test('an unscheduled, already overshot main clock cannot seek backward as quiz repair',
 async()=>{
 const f=fixture();
 await f.clock.prepare('sprite-208',source('sprite-208'));
 await f.clock.play('sprite-208',1,USER);
 f.context.currentTime=(154.4-1)/12;
 assert.equal(f.clock.snapshot().frame,154);
 assert.equal((await f.clock.play('sprite-208',153,{...AUTO,
  stopAtFrame:154})).reason,'quiz-boundary-already-overshot');
 assert.equal(f.context.starts.length,1);
 await f.clock.close();
});

test('97 and 123 negative empty final blocks use bounded context visual tails',async()=>{
 for(const id of ['sprite-97','sprite-123'] as const){
  const f=fixture(),row=p024AudioDomain(id);
  await f.clock.prepare(id,source(id));await f.clock.play(id,2,USER);
  const eof=2+(row.declaredSamples-1673)/22050*12;
  f.context.currentTime=(eof-2)/12+.002;
  const tail=f.clock.tick();
  assert.equal(tail.phase,'playing');assert.equal(tail.visualTailAfterAudioEOF,true);
  assert.equal(tail.decodedSampleExhaustedObserved,true);
  assert.equal(tail.nativeBufferEndedObserved,false);
  assert(tail.audioEofPosition!==null&&tail.audioEofPosition<row.frames);
  assert(row.frames-tail.position<=P024_VISUAL_TAIL_POLICY[id].maxFrames);
  f.context.currentTime=(row.frames-2)/12;
  assert.equal(f.clock.tick().phase,'ended');
  assert.equal(f.context.active,0);
  assert.equal(f.clock.seek(id,row.frames).accepted,true);
  assert.equal(f.clock.snapshot().decodedSample,row.declaredSamples);
  assert.equal((await f.clock.play(id,row.frames,AUTO)).accepted,true);
  assert.equal(f.context.starts.length,1,'no negative or synthetic replay at empty final frame');
  await f.clock.close();
 }
});

test('sprite 188 can reach its visual terminal before its source audio EOF',async()=>{
 const f=fixture(),id='sprite-188';
 await f.clock.prepare(id,source(id));await f.clock.play(id,2,USER);
 f.context.currentTime=(27-2)/12;
 const terminal=f.clock.tick();
 assert.equal(terminal.frame,27);assert.equal(terminal.visualTerminalReached,true);
 assert.equal(terminal.decodedSampleExhaustedObserved,false);
 assert.equal(terminal.phase,'playing');
 const audioEof=2+(p024AudioDomain(id).declaredSamples-1673)/22050*12;
 assert(audioEof>27);
 f.context.currentTime=(audioEof-2)/12+.002;
 assert.equal(f.clock.tick().phase,'ended');
 await f.clock.close();
});

test('wrong source bytes fail before browser decode and can be retried correctly',async()=>{
 const f=fixture(),bytes=source('sprite-69');
 new Uint8Array(bytes)[0]^=1;
 assert.equal((await f.clock.prepare('sprite-69',bytes)).reason,
  'P024_SOURCE_HASH_MISMATCH');
 assert.equal(f.clock.snapshot().browserDecode,null);
 assert.equal((await f.clock.prepare('sprite-69',source('sprite-69'))).accepted,true);
 await f.clock.close();
});

test('invalid seeks, pause, Replay, and late decode disposal are bounded',async()=>{
 const f=fixture();
 assert.equal(f.clock.seek('sprite-69',3).accepted,false);
 await f.clock.prepare('sprite-69',source('sprite-69'));
 assert.equal(f.clock.seek('sprite-69',32).accepted,false);
 assert.equal(f.clock.seek('sprite-69',3).accepted,true);
 await f.clock.play('sprite-69',3,USER);
 f.context.currentTime=.5;f.clock.tick();f.clock.hold();
 const held=f.clock.snapshot().position;f.context.currentTime=10;
 assert.equal(f.clock.tick().position,held);
 assert.equal(f.clock.replay().accepted,true);
 assert.equal(f.clock.snapshot().domain,null);
 assert.equal(f.clock.snapshot().nativeBufferEndedObserved,false);
 await f.clock.close();assert.equal(f.context.closeCount,1);

 const g=fixture();g.context.deferDecode();
 const pending=g.clock.prepare('sprite-83',source('sprite-83'));
 await Promise.resolve();await Promise.resolve();
 await g.clock.close();g.context.decodeRelease?.();
 assert.equal((await pending).reason,'stale-decode');
 assert.equal(g.clock.snapshot().phase,'closed');
 assert.equal(g.context.active,0);
});

test('reducer-selected feedback retires main and then resumes held quiz sample',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 let state=p024Reduce(p024InitialState(),{type:'play'});
 assert.equal((await owner.sync(state,{...USER,source:source('sprite-208')})).accepted,true);
 f.context.currentTime=(154.35-1)/12;f.clock.tick();
 state=p024Reduce(state,{type:'tick',frames:153});
 assert.equal(state.phase,'quiz');
 await owner.sync(state,AUTO);
 const held=f.clock.snapshot().decodedSample;
 assert(held>1673);assert.equal(f.context.active,0);
 state=p024Reduce(state,{type:'answer',answer:'C',variant:1});
 assert.equal(state.feedback,'sprite-155');
 assert.equal((await owner.sync(state,{...AUTO,source:source('sprite-155')})).accepted,true);
 assert.equal(f.context.active,1);
 state=p024Reduce(state,{type:'tick',frames:23});
 assert.equal(state.phase,'main');assert.equal(state.mainFrame,154);
 assert.equal((await owner.sync(state,AUTO)).accepted,true);
 assert.equal(f.context.active,1);
 assert.equal(f.clock.snapshot().domain,'sprite-208');
 assert.equal(f.context.starts.at(-1)?.offset,held/22050);
 assert(f.context.starts.at(-1)!.offset>f.context.starts[0].offset);
 await owner.close();assert.equal(f.context.active,0);
});

test('all named feedback variants use their own domain and no second source',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 const base=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(base,{...USER,source:source('sprite-208')});
 const quiz=p024Reduce(base,{type:'tick',frames:153});
 const variants=[['A',1,'sprite-69'],['A',2,'sprite-83'],['A',3,'sprite-97'],
  ['C',1,'sprite-155'],['C',2,'sprite-196'],['C',3,'sprite-123'],
  ['C',4,'sprite-188']] as const;
 for(const [answer,variant,id] of variants){
  await owner.sync(quiz,AUTO);
  const selected=p024Reduce(quiz,{type:'answer',answer,variant});
  assert.equal(selected.feedback,id);
  assert.equal((await owner.sync(selected,{...AUTO,source:source(id)})).accepted,true);
  assert.equal(owner.snapshot().clock.domain,id);
  assert.equal(f.context.active,1,'one native source per selected feedback');
 }
 await owner.close();assert.equal(f.context.active,0);
});

test('SA requires explicit request; Return waits for retirement before main resumes',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 let state=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(state,{...USER,source:source('sprite-208')});
 state=p024Reduce(state,{type:'locale',locale:'es'});
 assert.equal(sa.active,0,'locale cannot select SA');
 state=p024Reduce(state,{type:'sa-start'});
 assert.equal((await owner.sync(state,AUTO)).reason,'explicit-spanish-start-required');
 assert.equal(sa.active,0);
 assert.equal((await owner.startSpanish(state)).accepted,true);
 assert.equal(sa.active,1);assert.equal(f.context.active,0);
 sa.deferRetirement();
 state=p024Reduce(state,{type:'sa-return'});
 const returning=owner.returnFromSpanish(state,AUTO);
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.release?.();assert.equal((await returning).accepted,true);
 assert.equal(sa.active,0);assert.equal(f.context.active,1);
 assert(sa.events.includes('sa.retired'));
 await owner.close();
});

test('Replay cancels a late owner decode before it can start sound',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 f.context.deferDecode();
 const state=p024Reduce(p024InitialState(),{type:'play'});
 const pending=owner.sync(state,{...USER,source:source('sprite-208')});
 await Promise.resolve();await Promise.resolve();
 const replay=owner.replay();
 f.context.decodeRelease?.();
 assert.equal((await pending).accepted,false);
 assert.equal((await replay).accepted,true);
 assert.equal(f.context.active,0);assert.equal(owner.snapshot().clock.domain,null);
 await owner.close();
});

test('Replay waits for late SA start retirement before another source can play',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 sa.deferStart();const saState=p024Reduce(main,{type:'sa-start'});
 const pendingStart=owner.startSpanish(saState);
 await Promise.resolve();assert.equal(f.context.active,0);
 const replay=owner.replay();
 const newMain=owner.sync(main,AUTO);
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.releaseStart?.();
 assert.equal((await pendingStart).accepted,false);
 assert.equal((await replay).accepted,true);
 assert.equal((await newMain).accepted,true);
 assert.equal(sa.active,0);assert.equal(f.context.active,1);
 await owner.close();
});


test('Return during pending SA waits for the late start and retires it before main resume',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 sa.deferStart();const pending=owner.startSpanish(p024Reduce(main,{type:'sa-start'}));
 assert.equal(owner.snapshot().selectedAudio,'spanish');
 const returning=owner.returnFromSpanish(main,AUTO);
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.releaseStart?.();assert.equal((await pending).accepted,false);
 assert.equal((await returning).accepted,true);
 assert.equal(sa.active,0);assert.equal(f.context.active,1);
 assert.equal(owner.snapshot().selectedAudio,'source');await owner.close();
});

test('Pause while SA is loading reaches its owner and still permits explicit Return',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 sa.deferStart();const pending=owner.startSpanish(p024Reduce(main,{type:'sa-start'}));
 assert.equal(owner.pause().accepted,true);assert(sa.events.includes('sa.pause'));
 const returning=owner.returnFromSpanish({...main,playing:false},AUTO);
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.releaseStart?.();assert.equal((await pending).accepted,false);
 assert.equal((await returning).accepted,true);assert.equal(sa.active,0);
 assert.equal(f.context.active,0);await owner.close();
});

test('Pause during Return waits for SA retirement, releases ownership, and does not auto-resume',
 async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 const saState=p024Reduce(main,{type:'sa-start'});
 assert.equal((await owner.startSpanish(saState)).accepted,true);
 sa.deferRetirement();
 const returningState=p024Reduce(saState,{type:'sa-return'});
 const returning=owner.returnFromSpanish(returningState,AUTO);
 assert.equal(owner.pause().accepted,true);
 const pausedState=p024Reduce(returningState,{type:'pause'});
 const waiting=owner.sync(pausedState,AUTO);
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.release?.();
 assert.equal((await returning).reason,'stale-spanish-return');
 assert.equal((await waiting).reason,'source-held-by-reducer');
 assert.equal(owner.snapshot().selectedAudio,'source');
 assert.equal(owner.snapshot().transitioning,false);
 assert.equal(sa.active,0);assert.equal(f.context.active,0);
 const resumedState=p024Reduce(pausedState,{type:'play'});
 assert.equal((await owner.sync(resumedState,AUTO)).accepted,true);
 assert.equal(f.context.active,1,'explicit later Play can recover without Replay');
 await owner.close();assert.equal(f.context.active,0);
});

test('Replay supersedes delayed Return without restoring Spanish ownership or sound',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 const saState=p024Reduce(main,{type:'sa-start'});
 await owner.startSpanish(saState);sa.deferRetirement();
 const returning=owner.returnFromSpanish(p024Reduce(saState,{type:'sa-return'}),AUTO);
 const replay=owner.replay();
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.release?.();
 assert.equal((await returning).reason,'stale-spanish-return');
 assert.equal((await replay).accepted,true);
 assert.equal(owner.snapshot().selectedAudio,'source');
 assert.equal(owner.snapshot().clock.domain,null);
 assert.equal(sa.active,0);assert.equal(f.context.active,0);
 await owner.close();
});

test('a new SA reservation survives the previous Return retirement after Replay',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 const saState=p024Reduce(main,{type:'sa-start'});
 assert.equal((await owner.startSpanish(saState)).accepted,true);
 sa.deferRetirement();
 const returning=owner.returnFromSpanish(p024Reduce(saState,{type:'sa-return'}),AUTO);
 const replay=owner.replay();
 const newStart=owner.startSpanish(saState);
 assert.equal(owner.snapshot().selectedAudio,'spanish');
 sa.release?.();
 assert.equal((await returning).reason,'stale-spanish-return');
 assert.equal((await replay).accepted,true);
 assert.equal((await newStart).accepted,true);
 assert.equal(owner.snapshot().selectedAudio,'spanish',
  'old Return cannot release a newer SA reservation');
 assert.equal(sa.active,1);
 assert.equal(f.context.active,0);
 assert.equal((await owner.sync(main,AUTO)).reason,'explicit-spanish-return-required');
 assert.equal(f.context.active,0,'source cannot overlap the newly playing SA');
 await owner.close();
});

test('Close supersedes delayed Return and waits for its retirement',async()=>{
 const f=fixture(),sa=new Spanish(),owner=new P024AudioOwnerV1(f.clock,
  sa as P024SeparateSpanishAudio);
 const main=p024Reduce(p024InitialState(),{type:'play'});
 await owner.sync(main,{...USER,source:source('sprite-208')});
 const saState=p024Reduce(main,{type:'sa-start'});
 await owner.startSpanish(saState);sa.deferRetirement();
 const returning=owner.returnFromSpanish(p024Reduce(saState,{type:'sa-return'}),AUTO);
 const closing=owner.close();
 await Promise.resolve();assert.equal(f.context.active,0);
 sa.release?.();
 assert.equal((await returning).reason,'stale-spanish-return');
 await closing;
 assert.equal(owner.snapshot().closed,true);
 assert.equal(sa.active,0);assert.equal(f.context.active,0);
});
