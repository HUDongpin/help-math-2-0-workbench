import assert from 'node:assert/strict';
import test from 'node:test';
import {P034AudioOwnerV1} from './alg-l06-p034-audio-owner-v1';
import type {P034ResumableSpanishAudio} from './alg-l06-p034-audio-owner-v1';
import type {DecodedStreamResult} from './decoded-source-stream-transport';

const USER={activation:'user' as const,reducedMotion:false};
const ok=(reason:string):DecodedStreamResult=>({accepted:true,reason});

function fixture(){
 let phase='ready',frame=1,pending=false,nativeEof=false,nearEof=false,
  mainPlayCalls=0,mainAudioStarts=0,mainPauseCalls=0,mainClosed=false;
 let saPhase:'idle'|'playing'|'paused'|'ended'|'closed'='idle',
  saCanResume=false,saStarts=0,saResumes=0,saStops=0;
 const main={
  snapshot:()=>({phase,frame,frameDomain:'sprite-40' as const,
   activePosition:frame,elapsedSeconds:(frame-1)/12,
   audio:{phase:nativeEof?'buffer-ended':'playing',decodedSample:nearEof?741312:12000,
    contextTime:0,volume:1},nativeEofPending:pending,
   nativeEofObserved:nativeEof,sourceStopHeld:frame===433,
   glossaryOpen:null,failure:null,lessonCompleted:false as const}),
  async play(_policy:typeof USER){mainPlayCalls++;phase='playing';
   if(!nativeEof)mainAudioStarts++;return ok('main-playing');},
  pause(){mainPauseCalls++;phase='paused';if(nearEof&&!nativeEof)pending=true;
   return ok('main-held');},
  replay(){phase='ready';frame=1;pending=false;nativeEof=false;nearEof=false;
   return ok('main-replayed');},
  setVolume(){return ok('volume-set');},
  async close(){mainClosed=true;phase='closed';},
 };
 const spanish:P034ResumableSpanishAudio={
  snapshot:()=>({phase:saPhase,volume:1,failure:null,lessonCompleted:false,
   canResume:saCanResume,decodedSample:saCanResume?43210:0,
   nativePhase:saCanResume?'paused':saPhase==='playing'?'playing':null}),
  async start(policy){assert.equal(policy.activation,'user');
   assert(['ready','paused'].includes(phase),'main held before SA load/start');
   saStarts++;saPhase='playing';return ok('sa-started');},
  async resume(policy){assert.equal(policy.activation,'user');
   saResumes++;saPhase='playing';saCanResume=false;return ok('sa-resumed');},
  pause(){saPhase='paused';saCanResume=true;return ok('sa-paused');},
  stop(){saStops++;saPhase='idle';saCanResume=false;return ok('sa-stopped');},
  async stopAndWait(){saPhase='idle';saCanResume=false;},
  setVolume(){return ok('volume-set');},
  async close(){saPhase='closed';},
 };
 const owner=new P034AudioOwnerV1(main as unknown as ConstructorParameters<
  typeof P034AudioOwnerV1>[0],spanish);
 return {owner,main,spanish,
  atNearEof(){nearEof=true;frame=400;phase='playing';},
  atVisualTail(){frame=405;phase='playing';nativeEof=true;pending=false;},
  onMainEnded(){nativeEof=true;pending=false;},
  counts:()=>({mainPlayCalls,mainAudioStarts,mainPauseCalls,saStarts,
   saResumes,saStops,mainClosed})};
}

test('snapshot preserves typed P034 main native/visual fields and owner projection',async()=>{
 const f=fixture();const value=f.owner.snapshot();
 assert.equal(value.main.frameDomain,'sprite-40');
 assert.equal(value.main.nativeEofPending,false);
 assert.equal(value.nativeEofObserved,false);
 assert.equal(value.selectedAudio,'main');
 assert.equal(value.playbackPhase,'ready');
 assert.equal(value.lessonCompleted,false);
 await f.owner.close();
});

test('near-main native EOF pending blocks transfer before SA starts',async()=>{
 const f=fixture();f.atNearEof();
 const blocked=await f.owner.startSpanish({activation:'user'});
 assert.equal(blocked.reason,'main-native-eof-pending');
 assert.equal(f.owner.snapshot().selectedAudio,'main');
 assert.equal(f.owner.snapshot().main.nativeEofPending,true);
 assert.deepEqual(f.counts().saStarts,0);
 f.onMainEnded();
 assert((await f.owner.startSpanish({activation:'user'})).accepted);
 assert.equal(f.owner.snapshot().selectedAudio,'spanish');
 await f.owner.close();
});

test('SA may own post-main-EOF visual tail and Return resumes visuals only',async()=>{
 const f=fixture();f.atVisualTail();
 const before=f.counts().mainAudioStarts;
 assert((await f.owner.startSpanish({activation:'user'})).accepted);
 assert.equal(f.owner.snapshot().main.nativeEofObserved,true);
 assert.equal(f.owner.snapshot().main.frame,405);
 assert.equal(f.owner.snapshot().selectedAudio,'spanish');
 const returned=await f.owner.returnMain({...USER,resumeMain:true});
 assert(returned.accepted);assert.equal(f.owner.snapshot().selectedAudio,'main');
 assert.equal(f.owner.snapshot().main.phase,'playing');
 assert.equal(f.owner.snapshot().main.frame,405);
 assert.equal(f.counts().mainAudioStarts,before,'no second main node after EOF');
 await f.owner.close();
});

test('selected SA Pause→user Play resumes SA, never starts main or locale autoplay',async()=>{
 const f=fixture();assert((await f.owner.startSpanish({activation:'user'})).accepted);
 assert(f.owner.pause().accepted);
 const before=f.counts().mainPlayCalls;
 assert.equal((await f.owner.play({activation:'automatic',reducedMotion:false} as unknown as
  typeof USER)).accepted,false);
 assert((await f.owner.play(USER)).accepted);
 assert.equal(f.counts().saResumes,1);
 assert.equal(f.counts().mainPlayCalls,before);
 assert.equal(f.owner.snapshot().selectedAudio,'spanish');
 await f.owner.close();
});

test('Replay and close retire SA and restore held main frame one',async()=>{
 const f=fixture();assert((await f.owner.startSpanish({activation:'user'})).accepted);
 assert((await f.owner.replay()).accepted);
 assert.equal(f.owner.snapshot().selectedAudio,'main');
 assert.equal(f.owner.snapshot().main.frame,1);
 assert.equal(f.owner.snapshot().main.phase,'ready');
 assert.equal(f.owner.snapshot().lessonCompleted,false);
 assert(f.counts().saStops>=1);
 await f.owner.close();assert(f.counts().mainClosed);
 assert.equal(f.owner.snapshot().closed,true);
});
