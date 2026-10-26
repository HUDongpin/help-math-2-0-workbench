import {SourceStreamRunsClockV1} from './source-stream-runs-clock-v1';
import {DecodedSourceStreamTransport} from './decoded-source-stream-transport';
import {ALG_L10_P004_PLAYBACK as PLAYBACK} from './alg-l10-p004-playback-v2';
import {algL10P004OpenGlossary,type AlgL10P004Owner} from './alg-l10-p004-state-v1';
export interface AlgL10P004Dependencies {readonly readAudio:(language:'en'|'es',signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:()=>void;readonly commitFrame:(frame:number)=>boolean;readonly createContext?:(sampleRate:number)=>AudioContext;}
type Phase='paused'|'loading'|'start-pending'|'playing'|'failed'|'closed';
/** Page-owned lifecycle over the maintained native schedulers. P004 has no
 * independent child timeline: its visual and main audio clock both stop at609. */
export class AlgL10P004Session {
 private main:SourceStreamRunsClockV1|null=null;private spanish:DecodedSourceStreamTransport|null=null;private mainContext:AudioContext|null=null;
 private closing=new Set<Promise<void>>();private cleanupFailed=false;
 private pending:AbortController|null=null;private phase:Phase='paused';private mode:'main'|'spanish'='main';private seconds=0;private volume=.8;
 private epoch=0;private replayCount=0;private ownerRevision=0;private glossary:AlgL10P004Owner|null=null;private failure:string|null=null;private naturalStop=false;private playContextTime:number|null=null;
 constructor(private readonly dependencies:AlgL10P004Dependencies,private language:'en'|'es',private readonly seed:number){if(!['en','es'].includes(language)||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('ALG_L10_P004_SESSION_IDENTITY');}
 private get frame(){return Math.min(609,Math.floor(this.seconds*12+1e-9)+1);}
 private context=(rate:number)=>this.dependencies.createContext?.(rate)??new AudioContext({sampleRate:rate,latencyHint:'interactive'});
 private commit=(frame:number)=>this.dependencies.commitFrame(this.phase==='loading'?this.frame:frame);
 private emit(){this.dependencies.changed();}
 private retire(transport:SourceStreamRunsClockV1|DecodedSourceStreamTransport|null){if(!transport)return;let work:Promise<void>;work=transport.close().then(()=>{this.closing.delete(work);this.emit();},()=>{this.closing.delete(work);this.cleanupFailed=true;this.emit();});this.closing.add(work);this.emit();}
 private async drainClosing(){while(this.closing.size)await Promise.all([...this.closing]);if(this.cleanupFailed)throw Error('source-audio-close-failed');}
 private current(ticket:number){return this.phase!=='closed'&&ticket===this.epoch;}
 private settle(){
  if(this.phase!=='playing')return;
  if(this.mode==='spanish'){const s=this.spanish?.snapshot();if(s&&s.phase!=='playing'){this.phase=s.phase==='failed'?'failed':'paused';this.failure=s.failure;}return;}
  const s=this.main?.snapshot(),time=this.mainContext?.currentTime;
  if(!s||time===undefined||!Number.isFinite(time)||this.playContextTime===null||time<this.playContextTime||!Number.isFinite(s.elapsedSeconds)||s.elapsedSeconds<0||s.elapsedSeconds>608/12){this.main?.pause();this.phase='failed';this.failure='invalid-main-clock';this.playContextTime=null;return;}
  this.seconds=s.elapsedSeconds;
  if(s.timelineReachedEnd){this.naturalStop=true;this.phase='paused';this.playContextTime=null;this.dependencies.commitFrame(609);}
  else if(s.phase!=='playing'){this.phase=s.phase==='failed'?'failed':'paused';this.failure=s.failure;this.playContextTime=null;}
 }
 snapshot(){this.settle();const main=this.main?.snapshot(),es=this.spanish?.snapshot();return Object.freeze({phase:this.phase,mode:this.mode,frame:this.frame,visualElapsedSeconds:this.seconds,replay:this.replayCount,ownerRevision:this.ownerRevision,language:this.language,seed:this.seed,glossary:this.glossary,volume:this.volume,mainStopped:this.frame===609,mainStopReachedNaturally:this.naturalStop,mainAudioPhase:main?.audio.phase??'idle',mainDecodedSample:main?.audio.decodedSample??null,spanishAudioPhase:es?.phase??'idle',spanishDecodedSample:es?.decodedSample??null,failure:this.cleanupFailed?'source-audio-close-failed':this.failure??main?.failure??es?.failure??null,cleanupPending:this.closing.size,nativeBindingReady:PLAYBACK!==null,sourceAlignment:'source-run-candidate-not-original-runtime-accepted' as const,spanishAlignment:'independent-source-audio' as const,originalRuntimeAccepted:false as const,audioAccepted:false as const,lessonCompleted:false as const});}
 private async ensureMain(ticket:number){
  if(this.main)return this.main;if(!PLAYBACK)throw Error('native-measurement-required');
  this.phase='loading';const controller=new AbortController();this.pending=controller;this.emit();const bytes=await this.dependencies.readAudio('en',controller.signal);if(!this.current(ticket))return null;
  const clock=new SourceStreamRunsClockV1(PLAYBACK.mainPlan,{createContext:()=>{const c=this.context(22050);this.mainContext=c;return c;},commitHeldFrame:this.commit});this.main=clock;clock.setVolume(this.volume);
  const ready=await clock.prepare(bytes);if(!this.current(ticket))return null;if(!ready.accepted)throw Error(ready.reason);
  if(this.frame>1&&!clock.seekCandidateFrame(this.frame).accepted)throw Error('held-main-frame-unavailable');this.pending=null;return clock;
 }
 private async ensureSpanish(ticket:number){
  if(this.spanish)return this.spanish;if(!PLAYBACK)throw Error('native-measurement-required');
  this.phase='loading';const controller=new AbortController();this.pending=controller;this.emit();const bytes=await this.dependencies.readAudio('es',controller.signal);if(!this.current(ticket))return null;
  const spanishBinding=PLAYBACK.spanish;const transport=new DecodedSourceStreamTransport(spanishBinding,{createContext:()=>this.context(spanishBinding.sampleRate)});this.spanish=transport;transport.setVolume(this.volume);
  const ready=await transport.prepare(bytes);if(!this.current(ticket))return null;if(!ready.accepted)throw Error(ready.reason);this.pending=null;return transport;
 }
 async play(){
  if(this.phase==='closed'||['playing','loading','start-pending'].includes(this.phase)||this.glossary!==null||(this.mode==='main'&&this.frame===609))return false;
  const ticket=++this.epoch;this.failure=null;
  try{
   if(this.mode==='spanish'){const transport=await this.ensureSpanish(ticket);if(!transport||!this.current(ticket))return false;if(transport.snapshot().phase==='buffer-ended')transport.replay();this.phase='start-pending';this.emit();const started=await transport.play({activation:'user',reducedMotion:false});if(!this.current(ticket))return false;if(!started.accepted)throw Error(started.reason);}
   else{const clock=await this.ensureMain(ticket);if(!clock||!this.current(ticket))return false;this.phase='start-pending';this.emit();const started=await clock.play({activation:'user',reducedMotion:false});if(!this.current(ticket))return false;if(!started.accepted)throw Error(started.reason);this.seconds=clock.snapshot().elapsedSeconds;this.playContextTime=this.mainContext!.currentTime;}
   this.phase='playing';this.emit();return true;
  }catch(e){if(!this.current(ticket))return false;const loading=this.phase==='loading';this.pending=null;this.playContextTime=null;this.phase='failed';this.failure=e instanceof Error?e.message:'source-audio-unavailable';
   if(loading){if(this.mode==='main'){const c=this.main;this.main=null;this.mainContext=null;this.retire(c);await this.drainClosing();}else{const t=this.spanish;this.spanish=null;this.retire(t);await this.drainClosing();}}this.emit();return false;}
 }
 pause(){
  if(this.phase==='closed')return;this.settle();const loading=this.phase==='loading';this.epoch++;this.pending?.abort();this.pending=null;this.playContextTime=null;this.main?.pause();this.spanish?.pause();
  if(loading){if(this.mode==='main'){const c=this.main;this.main=null;this.mainContext=null;this.retire(c);}else{const t=this.spanish;this.spanish=null;this.retire(t);}}this.phase='paused';this.emit();
 }
 setLanguage(language:'en'|'es'){if(this.phase==='closed'||!['en','es'].includes(language))return false;if(language===this.language)return true;this.pause();this.language=language;this.ownerRevision++;this.glossary=null;this.emit();return true;}
 openGlossary(owner:AlgL10P004Owner,revision:number,language:'en'|'es'){
  if(this.phase==='closed'||revision!==this.ownerRevision||language!==this.language)return false;this.settle();
  try{const next=algL10P004OpenGlossary({frame:this.frame,language:this.language,seed:this.seed,replay:this.replayCount,paused:this.phase!=='playing',glossary:this.glossary},owner);this.pause();this.glossary=next.glossary;this.ownerRevision++;this.emit();return true;}catch{return false;}
 }
 closeGlossary(revision:number,language:'en'|'es'){if(this.phase==='closed'||revision!==this.ownerRevision||language!==this.language)return false;this.pause();this.glossary=null;this.ownerRevision++;this.emit();return true;}
 async narration(action:'play'|'stop',language:'en'|'es'){
  if(this.phase==='closed'||!['en','es'].includes(language)||!['play','stop'].includes(action))return false;if(action==='stop'){this.pause();return true;}if(this.glossary!==null)return false;
  const target=language==='es'?'spanish':'main';if(this.mode!==target){this.pause();this.mode=target;this.ownerRevision++;this.emit();}return this.play();
 }
 returnToMain(){if(this.phase==='closed')return false;this.pause();this.mode='main';this.glossary=null;this.ownerRevision++;this.emit();return true;}
 inspect(frame:number){if(this.phase==='closed'||!Number.isSafeInteger(frame)||frame<1||frame>609)return false;this.pause();this.mode='main';this.glossary=null;this.ownerRevision++;
  if(this.main&&!this.main.seekCandidateFrame(frame).accepted)return false;this.seconds=(frame-1)/12;this.naturalStop=false;if(!this.dependencies.commitFrame(frame)){this.phase='failed';this.failure='inspected-frame-not-committed';this.emit();return false;}this.emit();return true;
 }
 async replay(){
  if(this.phase==='closed')return false;this.pause();const ticket=this.epoch,main=this.main,es=this.spanish;this.main=null;this.spanish=null;this.mainContext=null;this.mode='main';this.seconds=0;this.naturalStop=false;this.failure=null;this.glossary=null;this.ownerRevision++;this.replayCount++;
  const committed=this.dependencies.commitFrame(1);this.retire(main);this.retire(es);this.emit();await this.drainClosing();if(!this.current(ticket))return false;if(!committed){this.phase='failed';this.failure='replay-frame-not-committed';this.emit();return false;}return this.play();
 }
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)return false;this.volume=value;this.main?.setVolume(value);this.spanish?.setVolume(value);this.emit();return true;}
 async close(){if(this.phase==='closed'){await this.drainClosing();return;}this.pause();this.phase='closed';this.ownerRevision++;this.glossary=null;const main=this.main,es=this.spanish;this.main=null;this.spanish=null;this.mainContext=null;this.retire(main);this.retire(es);this.emit();await this.drainClosing();}
}
