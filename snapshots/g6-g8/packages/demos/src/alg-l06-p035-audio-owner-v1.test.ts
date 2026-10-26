import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import plan from '../../../migrations/shared-alg001-l06-p035/audio-source-v1/source-audio-plan-v1.json';
import {P035PageAudioOwnerV1,
 type P035DomainId,type P035Transport}
 from './alg-l06-p035-audio-owner-v1';
import type {DecodedStreamPhase} from './decoded-source-stream-transport';

const root='/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/';
const accepted=(reason:string)=>({accepted:true,reason});
class FakeTransport {
 phase:DecodedStreamPhase='idle';epoch=0;decodedSample=0;
 prepareCalls=0;playCalls=0;pauseCalls=0;replayCalls=0;
 rejectNextAutomatic=false;rejectNextUser=false;
 listeners=new Set<()=>void>();
 deferredPlay:(()=>void)|null=null;
 subscribe(fn:()=>void){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners)fn();}
 snapshot(){return {phase:this.phase,epoch:this.epoch,decodedSample:this.decodedSample,
  contextTime:null,heldContextTime:null,playbackAnchor:null,elapsedMs:0,volume:1,
  failure:null,sourceAlignment:'unresolved' as const,lessonCompleted:false as const};}
 async prepare(_bytes:ArrayBuffer){this.prepareCalls++;this.phase='ready';this.epoch++;
  this.emit();return accepted('ready');}
 async play(policy:{activation:'user'|'automatic';reducedMotion:boolean}){
  this.playCalls++;this.phase='start-pending';this.epoch++;this.emit();
  const ticket=this.epoch;
  if(policy.activation==='automatic'&&this.rejectNextAutomatic){
   this.rejectNextAutomatic=false;this.phase='play-rejected';this.emit();
   return {accepted:false,reason:'gesture-required'};
  }
  if(policy.activation==='user'&&this.rejectNextUser){
   this.rejectNextUser=false;this.phase='play-rejected';this.emit();
   return {accepted:false,reason:'gesture-required'};
  }
  if(this.deferredPlay)await new Promise<void>(resolve=>{this.deferredPlay=resolve;});
  if(this.epoch!==ticket||this.phase!=='start-pending')return {accepted:false,reason:'stale-start'};
  this.phase='playing';this.emit();return accepted('playing');
 }
 pause(){this.pauseCalls++;this.decodedSample+=10;this.phase='paused';this.epoch++;
  this.emit();return accepted('paused');}
 replay(){this.replayCalls++;this.decodedSample=0;this.phase=this.prepareCalls?'ready':'idle';
  this.epoch++;this.emit();return accepted('ready');}
 async close(){this.phase='closed';this.epoch++;this.emit();}
 end(){this.phase='buffer-ended';this.epoch++;this.emit();}
 /** Real transport does not increment epoch on natural EOF. */
 nativeEnd(){this.phase='buffer-ended';this.emit();}
}
function setup(){
 let now=0;
 const mainFrames:number[]=[],feedbackFrames:[number,number][]=[];
 const transports=new Map<P035DomainId,FakeTransport>();
 const owner=new P035PageAudioOwnerV1({nowSeconds:()=>now,
  commitMain:frame=>{mainFrames.push(frame);return true;},
  commitFeedback:(id,frame)=>{feedbackFrames.push([id,frame]);return true;},
  createTransport:id=>{const fake=new FakeTransport();transports.set(id,fake);
   return fake as P035Transport;}});
 const transport=(id:P035DomainId)=>transports.get(id)!;
 const bytes=(id:P035DomainId):ArrayBuffer=>{
  const pin=id==='sa'?plan.separateSupplemental:
   plan.domains.find(row=>row.characterId===(id==='main'?227:id))!.transportAsset;
  const b=readFileSync(pin.path.startsWith('/')?pin.path:root+pin.path);
  return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
 };
 const prepare=async(id:P035DomainId)=>assert.equal((await owner.prepare(id,bytes(id))).accepted,true);
 const at=async(seconds:number)=>{now=seconds;return owner.tick();};
 return {owner,transport,prepare,at,setNow:(seconds:number)=>{now=seconds;},
  mainFrames,feedbackFrames,bytes};
}

test('main starts on block 13; quiz 145 holds same prepared buffer and cursor',async()=>{
 const t=setup();assert.equal((await t.owner.playMain({activation:'user'})).accepted,false);
 await t.prepare('main');assert.equal((await t.owner.playMain({activation:'user'})).accepted,true);
 await t.at(11/12);assert.equal(t.owner.snapshot().state.mainFrame,12);
 assert.equal(t.transport('main').playCalls,0);
 await t.at(1);assert.equal(t.owner.snapshot().state.mainFrame,13);
 assert.equal(t.transport('main').playCalls,1);
 assert.equal(t.owner.snapshot().mainAudioToken,0);
 const held=await t.at(12);
 assert.equal(held.reason,'authored-quiz-145-held');
 assert.equal(t.owner.snapshot().state.mainFrame,145);
 assert.equal(t.transport('main').pauseCalls,1);
 assert.equal(t.transport('main').prepareCalls,1);
 assert.equal(t.transport('main').decodedSample,10);
 await t.owner.close();
});

test('right-3 ADPCM transport starts at local block 1 and waits for native EOF then terminal 25',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(207);
 await t.owner.playMain({activation:'user'});await t.at(12);
 assert.equal(t.owner.choose('B').accepted,true);
 assert.equal((await t.owner.resolveFeedback(179,{activation:'user'})).accepted,false);
 assert.equal((await t.owner.resolveFeedback(207,{activation:'user'})).accepted,true);
 assert.equal(t.transport(207).playCalls,1);
 assert.equal(t.owner.snapshot().state.feedback?.frame,1);
 assert.equal(t.transport('main').prepareCalls,1);
 assert.equal((await t.at(14)).reason,'feedback-native-eof-pending-at-visual-terminal');
 assert.equal(t.owner.snapshot().state.feedback?.frame,24);
 t.transport(207).nativeEnd();
 assert.equal((await t.at(14)).reason,'feedback-terminal-source-transition');
 assert.equal(t.owner.snapshot().state.phase,'postquiz');
 assert.equal(t.owner.snapshot().state.mainFrame,145);
 assert.equal(t.transport('main').prepareCalls,1);
 assert.equal(t.transport('main').playCalls,2);
 assert.equal(t.owner.snapshot().lessonCompleted,false);
 await t.owner.close();
});

test('first wrong holds for Close and retry; second wrong terminal resumes main',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(80);await t.prepare(95);
 await t.owner.playMain({activation:'user'});await t.at(12);
 assert.equal(t.owner.choose('A').accepted,true);
 await t.owner.resolveFeedback(80,{activation:'user'});
 assert.equal((await t.at(12+19/12)).reason,'authored-wrong-popup-hold');
 assert.equal(t.owner.snapshot().state.feedback?.frame,20);
 assert.equal((await t.owner.closeWrong(999)).accepted,false);
 const token=t.owner.snapshot().state.feedback!.token;
 assert.equal((await t.owner.closeWrong(token)).accepted,true);
 t.transport(80).nativeEnd();
 assert.equal((await t.at(12+19/12+1)).reason,'feedback-terminal-source-transition');
 assert.equal(t.owner.snapshot().state.phase,'question');
 assert.equal(t.owner.snapshot().state.quizTryCount,1);
 assert.equal(t.owner.choose('C').accepted,true);
 await t.owner.resolveFeedback(95,{activation:'user'});
 assert.equal((await t.at(12+19/12+1+20/12)).reason,'authored-wrong-popup-hold');
 const second=t.owner.snapshot().state.feedback!.token;
 await t.owner.closeWrong(second);t.transport(95).nativeEnd();
 assert.equal((await t.at(12+19/12+1+20/12+1)).reason,'feedback-terminal-source-transition');
 assert.equal(t.owner.snapshot().state.phase,'postquiz');
 assert.equal(t.owner.snapshot().state.mainFrame,145);
 assert.equal(t.transport('main').prepareCalls,1);
 await t.owner.close();
});

test('feedback pause and explicit resume preserve feedback decoder and local frame',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(154);
 await t.owner.playMain({activation:'user'});await t.at(12);
 t.owner.choose('B');await t.owner.resolveFeedback(154,{activation:'user'});
 await t.at(12+3/12);const heldFrame=t.owner.snapshot().state.feedback!.frame;
 assert.equal(t.owner.pause().accepted,true);
 const cursor=t.transport(154).decodedSample;
 assert.equal((await t.owner.resumeFeedback({activation:'user'})).accepted,true);
 assert.equal(t.owner.snapshot().state.feedback!.frame,heldFrame);
 assert.equal(t.transport(154).prepareCalls,1);
 assert.equal(t.transport(154).decodedSample,cursor);
 await t.owner.close();
});

test('glossary and separate SA hold main; no locale autoplay or implicit Return resume',async()=>{
 const t=setup();await t.prepare('main');await t.prepare('sa');
 await t.owner.playMain({activation:'user'});await t.at(2);
 assert.equal(t.owner.openGlossary('Equation').accepted,true);
 assert.equal(t.owner.snapshot().activeOwner,'none');
 assert.equal(t.owner.closeGlossary().accepted,true);
 assert.equal(t.owner.snapshot().activeOwner,'none');
 assert.equal((await t.owner.playMain({activation:'user'})).accepted,true);
 assert.equal(t.transport('main').prepareCalls,1);
 assert.equal(t.transport('sa').playCalls,0);
 assert.equal((await t.owner.startSupplemental({activation:'user'})).accepted,true);
 assert.equal(t.owner.snapshot().activeOwner,'sa');
 const mainCursor=t.transport('main').decodedSample;
 assert.equal(t.owner.pauseSupplemental().accepted,true);
 assert.equal((await t.owner.resumeSupplemental({activation:'user'})).accepted,true);
 assert.equal(t.transport('sa').prepareCalls,1);
 assert.equal(t.owner.returnSupplemental().accepted,true);
 assert.equal(t.owner.snapshot().activeOwner,'none');
 assert.equal(t.transport('main').decodedSample,mainCursor);
 assert.equal((await t.owner.playMain({activation:'user'})).accepted,true);
 assert.equal(t.transport('main').prepareCalls,1);
 await t.owner.close();
});

test('Replay retires pending play and stale EOF; no autoplay or completion',async()=>{
 const t=setup();await t.prepare('main');
 t.transport('main').deferredPlay=()=>{};
 await t.owner.playMain({activation:'user'});
 const pending=t.at(1);
 await Promise.resolve();
 assert.equal(t.owner.replay().accepted,true);
 t.transport('main').deferredPlay?.();
 assert.equal((await pending).accepted,false);
 t.transport('main').nativeEnd();
 assert.equal(t.owner.snapshot().state.mainFrame,1);
 assert.equal(t.owner.snapshot().activeOwner,'none');
 assert.equal(t.owner.snapshot().nativeEof.main,false);
 assert.equal(t.owner.snapshot().lessonCompleted,false);
 await t.owner.close();
});

test('source hashes reject altered bytes and main native EOF never completes lesson',async()=>{
 const t=setup();const bad=t.bytes('main');new Uint8Array(bad)[0]^=1;
 assert.equal((await t.owner.prepare('main',bad)).reason,'source-byte-identity-mismatch');
 await t.prepare('main');await t.owner.playMain({activation:'user'});await t.at(1);
 t.transport('main').nativeEnd();
 assert.equal(t.owner.snapshot().nativeEof.main,true);
 assert.equal(t.owner.snapshot().lessonCompleted,false);
 await t.owner.close();
});

test('visual frame 534 holds a still-playing native tail; user resumes same buffer',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(154);
 await t.owner.playMain({activation:'user'});await t.at(12);
 t.owner.choose('B');await t.owner.resolveFeedback(154,{activation:'user'});
 await t.at(12+1/12);t.transport(154).nativeEnd();await t.at(15);
 assert.equal(t.owner.snapshot().state.phase,'postquiz');
 assert.equal(t.transport('main').playCalls,2);
 const held=await t.at(15+(534-145)/12);
 assert.equal(held.reason,'source-534-held-no-lesson-completion');
 assert.equal(t.owner.snapshot().state.mainFrame,534);
 assert.equal(t.owner.snapshot().mainFinalAudioTailPending,true);
 assert.equal(t.owner.snapshot().lessonCompleted,false);
 assert.equal(t.owner.pause().reason,'main-audio-tail-held-at-source-534');
 assert.equal(t.owner.snapshot().mainFinalAudioTailHeld,true);
 const cursor=t.transport('main').decodedSample;
 assert.equal((await t.owner.playMain({activation:'user'})).accepted,true);
 assert.equal(t.transport('main').prepareCalls,1);
 assert.equal(t.transport('main').decodedSample,cursor);
 t.transport('main').nativeEnd();
 assert.equal(t.owner.snapshot().nativeEof.main,true);
 assert.equal(t.owner.snapshot().lessonCompleted,false);
 await t.owner.close();
});

test('Replay during source hashing cannot prepare a stale generation',async()=>{
 const t=setup();
 const pending=t.owner.prepare('main',t.bytes('main'));
 assert.equal(t.owner.replay().accepted,true);
 assert.equal((await pending).reason,'stale-prepare');
 assert.equal(t.transport('main').prepareCalls,0);
 await t.owner.close();
});

test('automatic audio starts rejected by browser hold at first block for explicit Play',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(154);
 t.transport('main').rejectNextAutomatic=true;
 await t.owner.playMain({activation:'user'});
 assert.equal((await t.at(1)).reason,'P035_MAIN_START_gesture-required');
 assert.equal(t.owner.snapshot().state.mainFrame,13);
 assert.equal(t.owner.snapshot().phase,'paused');
 assert.equal((await t.owner.playMain({activation:'user'})).accepted,true);
 assert.equal(t.owner.snapshot().activeOwner,'main');
 await t.at(12);t.owner.choose('B');
 await t.owner.resolveFeedback(154,{activation:'user'});
 t.transport(154).rejectNextAutomatic=true;
 assert.equal((await t.at(12+1/12)).reason,'P035_FEEDBACK_START_gesture-required');
 assert.equal(t.owner.snapshot().state.feedback?.frame,2);
 assert.equal(t.owner.snapshot().phase,'paused');
 assert.equal((await t.owner.resumeFeedback({activation:'user'})).accepted,true);
 assert.equal(t.owner.snapshot().activeOwner,'feedback');
 await t.owner.close();
});

test('Close playback rejection stays resumable at the authored jump frame',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(80);
 await t.owner.playMain({activation:'user'});await t.at(12);
 t.owner.choose('A');await t.owner.resolveFeedback(80,{activation:'user'});
 await t.at(12+19/12);
 const token=t.owner.snapshot().state.feedback!.token;
 t.transport(80).rejectNextUser=true;
 assert.equal((await t.owner.closeWrong(token)).reason,
  'close-feedback-resume-gesture-required');
 assert.equal(t.owner.snapshot().state.feedback?.frame,21);
 assert.equal(t.owner.snapshot().phase,'paused');
 assert.equal((await t.owner.resumeFeedback({activation:'user'})).accepted,true);
 assert.equal(t.owner.snapshot().state.feedback?.frame,21);
 await t.owner.close();
});

test('early source-visible Close jumps each wrong clip without restarting its active buffer',async()=>{
 for(const [id,visible,destination,end] of [
  [80,14,21,29],[95,15,22,28],[126,16,23,28],
 ] as const){
  const t=setup();await t.prepare('main');await t.prepare(id);
  await t.owner.playMain({activation:'user'});await t.at(12);
  assert.equal(t.owner.choose('A').accepted,true);
  assert.equal((await t.owner.resolveFeedback(id,{activation:'user'})).accepted,true);
  const token=t.owner.snapshot().state.feedback!.token;
  await t.at(12+(visible-2)/12);
  assert.equal(t.owner.snapshot().state.feedback?.frame,visible-1);
  assert.equal((await t.owner.closeWrong(token)).accepted,false);
  await t.at(12+(visible-1)/12);
  assert.equal(t.owner.snapshot().state.feedback?.frame,visible);
  const playbackCount=t.transport(id).playCalls;
  const cursor=t.transport(id).decodedSample;
  assert.equal((await t.owner.closeWrong(token)).accepted,true);
  assert.equal(t.owner.snapshot().state.feedback?.frame,destination);
  assert.equal(t.feedbackFrames.at(-1)?.[1],destination);
  assert.equal(t.transport(id).playCalls,playbackCount);
  assert.equal(t.transport(id).decodedSample,cursor);
  assert.equal(t.owner.snapshot().state.quizTryCount,0);
  assert.equal((await t.owner.closeWrong(token)).accepted,false);
  assert.equal((await t.at(12+(visible-1)/12+1)).reason,
   'feedback-native-eof-pending-at-visual-terminal');
  t.transport(id).nativeEnd();
  assert.equal((await t.at(12+(visible-1)/12+1)).reason,
   'feedback-terminal-source-transition');
  assert.equal(t.owner.snapshot().state.phase,'question');
  assert.equal(t.owner.snapshot().state.quizTryCount,1);
  await t.owner.close();
 }
});

test('early Close from a paused visible frame resumes the same decoded feedback cursor once',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(80);
 await t.owner.playMain({activation:'user'});await t.at(12);
 t.owner.choose('A');await t.owner.resolveFeedback(80,{activation:'user'});
 await t.at(13); // local frame 13, popup alpha zero
 assert.equal(t.owner.pause().accepted,true);
 const token=t.owner.snapshot().state.feedback!.token;
 assert.equal((await t.owner.closeWrong(token)).accepted,false);
 assert.equal((await t.owner.resumeFeedback({activation:'user'})).accepted,true);
 await t.at(13+1/12); // first positive-alpha frame 14
 assert.equal(t.owner.pause().accepted,true);
 const before=t.transport(80).playCalls,cursor=t.transport(80).decodedSample;
 assert.equal((await t.owner.closeWrong(token)).accepted,true);
 assert.equal(t.owner.snapshot().state.feedback?.frame,21);
 assert.equal(t.transport(80).playCalls,before+1);
 assert.equal(t.transport(80).decodedSample,cursor);
 await t.owner.close();
});

test('early Close after native feedback EOF advances only the visual terminal',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(80);
 await t.owner.playMain({activation:'user'});await t.at(12);
 t.owner.choose('A');await t.owner.resolveFeedback(80,{activation:'user'});
 await t.at(13+1/12);
 const token=t.owner.snapshot().state.feedback!.token;
 t.transport(80).nativeEnd();
 assert.equal(t.owner.snapshot().nativeEof.feedback,true);
 const plays=t.transport(80).playCalls;
 assert.equal((await t.owner.closeWrong(token)).accepted,true);
 assert.equal(t.transport(80).playCalls,plays);
 assert.equal(t.owner.snapshot().state.feedback?.frame,21);
 assert.equal((await t.at(14)).reason,'feedback-terminal-source-transition');
 assert.equal(t.owner.snapshot().state.quizTryCount,1);
 assert.equal(t.owner.replay().accepted,true);
 t.transport(80).nativeEnd();
 assert.equal(t.owner.snapshot().state.mainFrame,1);
 assert.equal(t.owner.snapshot().nativeEof.feedback,false);
 await t.owner.close();
});

test('early Close retires a pending paused-buffer start before one user start',async()=>{
 const t=setup();await t.prepare('main');await t.prepare(80);
 await t.owner.playMain({activation:'user'});await t.at(12);
 t.owner.choose('A');await t.owner.resolveFeedback(80,{activation:'user'});
 await t.at(13+1/12);
 const token=t.owner.snapshot().state.feedback!.token;
 assert.equal(t.owner.pause().accepted,true);
 t.transport(80).deferredPlay=()=>{};
 const pending=t.owner.resumeFeedback({activation:'user'});
 await Promise.resolve();
 const releasePending=t.transport(80).deferredPlay!;
 const close=t.owner.closeWrong(token);
 await Promise.resolve();
 const releaseClose=t.transport(80).deferredPlay!;
 releasePending();releaseClose();
 assert.equal((await pending).accepted,false);
 const closed=await close;
 assert.equal(closed.accepted,true,closed.reason);
 assert.equal(t.owner.snapshot().state.feedback?.frame,21);
 assert.equal(t.owner.snapshot().activeOwner,'feedback');
 assert.equal(t.transport(80).phase,'playing');
 assert.equal(t.transport(80).playCalls,3); // initial, canceled pending, Close
 await t.owner.close();
});
