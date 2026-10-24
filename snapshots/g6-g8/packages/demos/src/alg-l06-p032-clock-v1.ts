import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,
 type DecodedStreamResult} from './decoded-source-stream-transport';
import {P032_AUDIO_DISPOSITION,p032AudioSlice,
 p032ValidateBrowserBinding} from './alg-l06-p032-audio-schedule-v1';

export type P032GlossaryKey='Set'|'Ordered pair'|'Function'|'X-coordinate';

type Transport=Pick<DecodedSourceStreamTransport,'prepare'|'snapshot'|'subscribe'|
 'seekDecodedSample'|'play'|'pause'|'replay'|'holdSourceBoundary'|'setVolume'|'close'>;
type Phase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
 'timeline-ended'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});

/** One physical stream run; the visual frame 413 is held until the actual
 * AudioBufferSourceNode end callback. FFmpeg's sample count is not an EOF. */
export class AlgL06P032ClockV1{
 private readonly transport:Transport;
 private readonly unsubscribe:()=>void;
 private readonly commitFrame:(frame:number)=>boolean;
 private readonly binding:DecodedSourceStreamBinding;
 private readonly canOpenGlossary:(key:P032GlossaryKey,frame:number)=>boolean;
 private context?:AudioContext;
 private phase:Phase='idle';
 private position=1;
 private committedFrame=0;
 private anchor?:{contextTime:number;position:number};
 private epoch=0;
 private nativeEnded=false;
 private glossaryOpen:P032GlossaryKey|null=null;
 private failure:string|null=null;
 private volume=1;

 constructor(options:{commitFrame:(frame:number)=>boolean;
  canOpenGlossary?:(key:P032GlossaryKey,frame:number)=>boolean;
  binding?:DecodedSourceStreamBinding;createContext?:()=>AudioContext;
  createTransport?:(binding:DecodedSourceStreamBinding,
   createContext:()=>AudioContext)=>Transport}){
  if(typeof options.commitFrame!=='function'||
   P032_AUDIO_DISPOSITION.frameDomain!=='sprite-22'||
   P032_AUDIO_DISPOSITION.visualFrames!==413||
   P032_AUDIO_DISPOSITION.fps!==12||P032_AUDIO_DISPOSITION.rootEntryFrame!==6||
   JSON.stringify(P032_AUDIO_DISPOSITION.mainRanges)!=='[[1,413]]'||
   JSON.stringify(P032_AUDIO_DISPOSITION.zeroPayloadFrames)!=='[2]'||
   P032_AUDIO_DISPOSITION.syntheticSilenceAdded!==false||
   P032_AUDIO_DISPOSITION.separateSaSpliced!==false)
   throw Error('P032_SOURCE_DISPOSITION_DRIFT');
  this.binding=p032ValidateBrowserBinding(options.binding);
  this.commitFrame=options.commitFrame;
  this.canOpenGlossary=options.canOpenGlossary??(()=>false);
  const create=options.createContext??(()=>(new AudioContext({sampleRate:22050,
   latencyHint:'interactive'})));
  const shared=()=>this.context??=create();
  this.transport=options.createTransport?.(this.binding,shared)??
   new DecodedSourceStreamTransport(this.binding,{createContext:shared});
  this.unsubscribe=this.transport.subscribe(()=>{
   const native=this.transport.snapshot();
   if(native.phase==='buffer-ended')this.nativeEnded=true;
   if(this.phase==='playing'&&['buffer-ended','interrupted','closed','failed']
     .includes(native.phase))this.settle();
  });
 }
 private frame(){return Math.min(413,Math.max(1,Math.floor(this.position+1e-9)));}
 private commit(force=false){
  const frame=this.frame();if(!force&&frame===this.committedFrame)return true;
  try{if(this.commitFrame(frame)!==true)return false;}catch{return false;}
  this.committedFrame=frame;return true;
 }
 private retire(){
  if(['playing','start-pending'].includes(this.transport.snapshot().phase))
   this.transport.pause();
 }
 private fail(reason:string){
  this.epoch++;this.retire();this.anchor=undefined;this.phase='failed';
  this.failure=reason;return result(false,reason);
 }
 private readonly contextChanged=()=>{
  if(!this.context||this.context.state==='running'||this.phase==='closed')return;
  this.settle();
  if(this.phase==='start-pending'){
   this.epoch++;this.retire();this.anchor=undefined;
   this.phase=this.context.state==='closed'?'failed':'paused';
   if(this.phase==='failed')this.failure='P032_MAIN_CONTEXT_CLOSED';
  }
 };
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  const native=this.transport.snapshot();
  if(native.phase==='buffer-ended')this.nativeEnded=true;
  const interrupted=this.context.state!=='running'||
   ['interrupted','closed','failed','play-rejected'].includes(native.phase);
  const now=interrupted?
   (native.heldContextTime??native.contextTime??this.context.currentTime):
   this.context.currentTime;
  if(!Number.isFinite(now))return void this.fail('P032_INVALID_CONTEXT_TIME');
  this.position=Math.min(413,Math.max(this.position,
   this.anchor.position+Math.max(0,now-this.anchor.contextTime)*12));
  if(!this.commit())return void this.fail('P032_SOURCE_FRAME_COMMIT_FAILED');
  if(interrupted){
   this.epoch++;this.retire();this.anchor=undefined;
   this.phase=this.context.state==='closed'?'failed':'paused';
   if(this.phase==='failed')this.failure='P032_MAIN_CONTEXT_CLOSED';
   return;
  }
  if(this.position>=413&&this.nativeEnded){
   this.epoch++;this.retire();this.anchor=undefined;this.phase='timeline-ended';
  }
 }
 snapshot(){
  this.settle();
  const native=this.transport.snapshot(),frame=this.frame();
  const nativeEofPending=this.phase==='paused'&&!this.nativeEnded&&
   native.phase==='playing'&&native.decodedSample>=this.binding.decodedSamples;
  const audioPhase=nativeEofPending?'native-eof-pending':
   this.phase==='playing'&&frame===413&&!this.nativeEnded?'playing':native.phase;
  return Object.freeze({phase:this.phase,frame,frameDomain:'sprite-22' as const,
   elapsedSeconds:(this.position-1)/12,activePosition:this.position,
   activeAudioId:'main-1' as const,glossaryOpen:this.glossaryOpen,
   audio:Object.freeze({phase:audioPhase,decodedSample:native.decodedSample,
    contextTime:native.contextTime,volume:this.volume}),
   nativeEofObserved:this.nativeEnded,
   nativeEofPending,
   mainFinalAudioTailPending:this.phase==='playing'&&frame===413&&!this.nativeEnded,
   timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
   sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
   audioAccepted:false as const,lessonCompleted:false as const});
 }
 tick(){return this.snapshot();}
 async prepare(bytes:ArrayBuffer):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');
  const ticket=++this.epoch;this.phase='loading';
  try{
   if(!(bytes instanceof ArrayBuffer))throw Error('P032_MAIN_SOURCE_MISSING');
   const prepared=await this.transport.prepare(bytes);
   if(ticket!==this.epoch)return result(false,'stale-prepare');
   if(!prepared.accepted)throw Error(prepared.reason);
   const volume=this.transport.setVolume(this.volume);
   if(!volume.accepted)throw Error(volume.reason);
   if(!this.context||this.context.sampleRate!==22050)
    throw Error('P032_CONTEXT_RATE_MISMATCH');
   this.context.addEventListener('statechange',this.contextChanged);
   if(!this.commit(true))throw Error('P032_FIRST_FRAME_NOT_COMMITTED');
   this.phase='ready';return result(true,'one-source-run-ready');
  }catch(error){
   if(ticket!==this.epoch)return result(false,'stale-prepare');
   const reason=error instanceof Error?error.message:String(error);
   this.phase='failed';this.failure=reason;await this.close();
   return result(false,reason);
  }
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();
  if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
   return result(false,'explicit-user-play-required');
  if(this.glossaryOpen!==null)return result(false,'glossary-open-hold');
  if(this.phase==='playing')return result(true,'already-playing');
  if(!['ready','paused'].includes(this.phase)||!this.context)
   return result(false,'not-ready');
  const held=this.transport.snapshot();
  const resumeHeld=!this.nativeEnded&&
   ['paused','interrupted','play-rejected'].includes(held.phase)&&
   held.decodedSample>0&&held.decodedSample<this.binding.decodedSamples;
  const slice=this.nativeEnded?null:
   p032AudioSlice(this.position,this.binding.decodedSamples);
  if(!this.nativeEnded&&!slice&&!resumeHeld)
   return result(false,'native-eof-not-observed');
  const ticket=++this.epoch;this.phase='start-pending';
  if(!this.commit()){
   this.phase='paused';return result(false,'P032_SOURCE_FRAME_NOT_COMMITTED');
  }
  try{
   await this.context.resume();
   if(ticket!==this.epoch)return result(false,'stale-start');
   if(this.context.state!=='running')throw Error('context-not-running');
   const anchorTime=this.context.currentTime,anchorPosition=this.position;
   if(slice||resumeHeld){
    // A paused stream resumes at its actual decoded cursor. A fresh visual
    // frame seek is only advisory until source/Chrome onset is measured.
    const sample=resumeHeld?held.decodedSample:
     Math.min(this.binding.decodedSamples-1,slice!.firstDecodedSample);
    const sought=this.transport.seekDecodedSample(sample);
    if(!sought.accepted)throw Error(sought.reason);
    const started=await this.transport.play({...policy,
     delaySeconds:Math.max(0,anchorTime+
      (resumeHeld?0:slice?.delaySeconds??0)-this.context.currentTime)});
    if(ticket!==this.epoch)return result(false,'stale-start');
    if(!started.accepted)throw Error(started.reason);
   }
   this.anchor={contextTime:anchorTime,position:anchorPosition};
   this.phase='playing';this.failure=null;this.settle();
   return result(true,slice||resumeHeld?'one-source-run-playing':'visual-tail-only');
  }catch(error){
   if(ticket!==this.epoch)return result(false,'stale-start');
   this.retire();this.anchor=undefined;this.phase='paused';
   this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
 }
 pause():DecodedStreamResult{
  this.settle();
  if(!['playing','start-pending'].includes(this.phase))return result(false,'not-playing');
  const native=this.transport.snapshot();
  // The computed cursor may clamp to buffer length just before the genuine
  // onended event. Keep that exhausted node only until its callback; seeking
  // to decodedSamples would synthesize buffer-ended without native evidence.
  const awaitNativeEof=!this.nativeEnded&&native.phase==='playing'&&
   native.decodedSample>=this.binding.decodedSamples;
  this.epoch++;if(!awaitNativeEof)this.retire();
  this.anchor=undefined;this.phase='paused';
  return this.commit()?result(true,'one-source-run-held'):
   this.fail('P032_PAUSED_FRAME_NOT_COMMITTED');
 }
 openGlossary(key:P032GlossaryKey):DecodedStreamResult{
  this.settle();
  if(this.glossaryOpen!==null||
   !['Set','Ordered pair','Function','X-coordinate'].includes(key)||
   !this.canOpenGlossary(key,this.frame())||
   !['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
   return result(false,'glossary-unavailable');
  if(['playing','start-pending'].includes(this.phase)&&!this.pause().accepted)
   return result(false,'main-pause-failed');
  this.glossaryOpen=key;return result(true,'glossary-opened-and-held');
 }
 closeGlossary():DecodedStreamResult{
  if(this.glossaryOpen===null)return result(false,'glossary-not-open');
  this.glossaryOpen=null;return result(true,'glossary-closed-held');
 }
 replay():DecodedStreamResult{
  if(!['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
   return result(false,'not-ready');
  this.epoch++;this.retire();this.anchor=undefined;this.nativeEnded=false;
  this.glossaryOpen=null;this.transport.replay();this.position=1;
  this.committedFrame=0;this.phase='ready';this.failure=null;
  return this.commit(true)?result(true,'one-source-run-replayed-held'):
   this.fail('P032_REPLAY_FRAME_NOT_COMMITTED');
 }
 seekCandidateFrame(frame:number):DecodedStreamResult{
  if(!Number.isSafeInteger(frame)||frame<1||frame>413||
   !['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
   return result(false,'invalid-candidate-frame');
  this.epoch++;this.retire();this.anchor=undefined;this.position=frame;
  this.transport.replay();this.nativeEnded=false;this.phase='paused';this.failure=null;
  return this.commit(true)?result(true,'source-candidate-frame-held'):
   this.fail('P032_INSPECTED_FRAME_NOT_COMMITTED');
 }
 setVolume(value:number):DecodedStreamResult{
  if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
   return result(false,'invalid-volume');
  this.volume=value;
  const changed=this.transport.setVolume(value);
  return changed.accepted?result(true,'volume-set'):result(false,'volume-rejected');
 }
 async close():Promise<void>{
  if(this.phase==='closed')return;
  this.epoch++;this.retire();this.anchor=undefined;this.glossaryOpen=null;
  this.phase='closed';this.context?.removeEventListener('statechange',this.contextChanged);
  this.unsubscribe();await this.transport.close();
 }
}
