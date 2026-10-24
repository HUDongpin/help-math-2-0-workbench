import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,
 type DecodedStreamResult} from './decoded-source-stream-transport';
import {P034_SOURCE} from './alg-l06-p034-audio-clock-v1';
import type {P034GlossaryKey} from './alg-l06-p034-glossary-v1';
export type {P034GlossaryKey} from './alg-l06-p034-glossary-v1';

type Transport=Pick<DecodedSourceStreamTransport,'prepare'|'snapshot'|'subscribe'|
 'play'|'pause'|'replay'|'setVolume'|'close'>;
type Phase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
 'timeline-ended'|'failed'|'closed';
type UserPolicy={activation:'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const MAIN_SAMPLES=741312;
const RATE=22050;
const STOP_FRAME=433;
const FPS=12;

/** P034's one continuous decoded main run and AudioContext visual clock.
 * Frame-197/198–226/227 source block observations never call pause or seek.
 * Decoder PCM-to-source-frame onset remains unverified. */
export class AlgL06P034ClockV1{
 private readonly transport:Transport;
 private readonly unsubscribe:()=>void;
 private readonly commitFrame:(frame:number)=>boolean;
 private readonly canOpenGlossary:(key:P034GlossaryKey,frame:number)=>boolean;
 private context?:AudioContext;
 private phase:Phase='idle';
 private position=1;
 private committedFrame=0;
 private anchor?:{contextTime:number;position:number};
 private epoch=0;
 private nativeRunEpoch:number|null=null;
 private nativeEnded=false;
 private glossaryOpen:P034GlossaryKey|null=null;
 private failure:string|null=null;
 private volume=1;

 constructor(options:{binding:DecodedSourceStreamBinding;
  commitFrame:(frame:number)=>boolean;
  canOpenGlossary?:(key:P034GlossaryKey,frame:number)=>boolean;
  createContext?:()=>AudioContext;
  createTransport?:(binding:DecodedSourceStreamBinding,
   createContext:()=>AudioContext)=>Transport}){
  const b=options.binding;
  if(!b||b.sourceSha256!==P034_SOURCE.mainSha256||b.sourceBytes!==167310||
   b.sampleRate!==RATE||b.channels!==1||b.decodedSamples!==MAIN_SAMPLES||
   b.pcmSha256!==P034_SOURCE.mainPcmSha256||
   typeof options.commitFrame!=='function')
   throw Error('P034_MAIN_BROWSER_BINDING_OR_COMMIT_MISSING');
  this.commitFrame=options.commitFrame;
  this.canOpenGlossary=options.canOpenGlossary??(()=>false);
  const create=options.createContext??(()=>(new AudioContext({sampleRate:RATE,
   latencyHint:'interactive'})));
  const shared=()=>this.context??=create();
  this.transport=options.createTransport?.(b,shared)??
   new DecodedSourceStreamTransport(b,{createContext:shared});
  this.unsubscribe=this.transport.subscribe(()=>{
   const native=this.transport.snapshot();
   if(this.phase==='start-pending'&&
    (native.phase==='start-pending'||native.phase==='playing'))
    this.nativeRunEpoch=native.epoch;
   // This private adapter never calls seekDecodedSample. Only the current
   // transport run's native transition can establish main EOF.
   if(native.phase==='buffer-ended'&&this.nativeRunEpoch!==null&&
    native.epoch===this.nativeRunEpoch&&!this.nativeEnded){
    this.nativeEnded=true;this.nativeRunEpoch=null;
    if(this.phase==='playing')this.settle();
    else if(this.phase==='paused'&&this.frame()===STOP_FRAME)
     this.phase='timeline-ended';
   }else if(this.phase==='playing'&&
    ['interrupted','closed','failed'].includes(native.phase))this.settle();
  });
 }

 private frame(){return Math.min(STOP_FRAME,Math.max(1,Math.floor(this.position+1e-9)));}
 private commit(force=false){
  const frame=this.frame();if(!force&&frame===this.committedFrame)return true;
  try{if(this.commitFrame(frame)!==true)return false;}catch{return false;}
  this.committedFrame=frame;return true;
 }
 private retire(){
  const phase=this.transport.snapshot().phase;
  if(phase==='playing'||phase==='start-pending'){
   this.nativeRunEpoch=null;
   this.transport.pause();
  }
 }
 private fail(reason:string){
  this.epoch++;this.retire();this.anchor=undefined;
  this.phase='failed';this.failure=reason;return result(false,reason);
 }
 private readonly contextChanged=()=>{
  if(!this.context||this.phase==='closed')return;
  if(this.context.state==='running')return;
  if(this.phase==='playing')this.settle();
  if(this.phase==='start-pending'){
   this.epoch++;this.retire();this.anchor=undefined;
   this.phase=this.context.state==='closed'?'failed':'paused';
   if(this.phase==='failed')this.failure='P034_MAIN_CONTEXT_CLOSED';
  }else if(this.context.state==='closed'&&
   !['failed','closed'].includes(this.phase)){
   this.epoch++;this.anchor=undefined;this.phase='failed';
   this.failure='P034_MAIN_CONTEXT_CLOSED';
  }
 };
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  const native=this.transport.snapshot();
  const interrupted=this.context.state!=='running'||
   ['interrupted','closed','failed','play-rejected'].includes(native.phase);
  const now=interrupted?
   (native.heldContextTime??native.contextTime??this.context.currentTime):
   this.context.currentTime;
  if(!Number.isFinite(now))return void this.fail('P034_INVALID_CONTEXT_TIME');
  this.position=Math.min(STOP_FRAME,Math.max(this.position,
   this.anchor.position+Math.max(0,now-this.anchor.contextTime)*FPS));
  if(!this.commit())return void this.fail('P034_SOURCE_FRAME_COMMIT_FAILED');
  if(interrupted){
   this.epoch++;this.retire();this.anchor=undefined;
   this.phase=this.context.state==='closed'?'failed':'paused';
   if(this.phase==='failed')this.failure='P034_MAIN_CONTEXT_CLOSED';
   return;
  }
  // Main EOF alone is not the authored visual stop; frame 433 alone is not
  // native EOF. Only after both does the P025-compatible phase become terminal.
  if(this.position>=STOP_FRAME&&this.nativeEnded){
   this.epoch++;this.anchor=undefined;this.phase='timeline-ended';
  }
 }

 snapshot(){
  this.settle();
  const native=this.transport.snapshot(),frame=this.frame();
  const eofPending=!this.nativeEnded&&native.phase==='playing'&&
   native.decodedSample>=MAIN_SAMPLES&&
   (this.phase==='playing'||this.phase==='paused');
  return Object.freeze({phase:this.phase,frame,frameDomain:'sprite-40' as const,
   activePosition:this.position,elapsedSeconds:(this.position-1)/FPS,
   glossaryOpen:this.glossaryOpen,
   audio:Object.freeze({phase:eofPending?'native-eof-pending':native.phase,
    decodedSample:native.decodedSample,contextTime:native.contextTime,
    volume:this.volume}),
   nativeEofPending:eofPending,nativeEofObserved:this.nativeEnded,
   sourceStopHeld:frame===STOP_FRAME,
   mainFinalAudioTailPending:this.phase==='playing'&&frame===STOP_FRAME&&
    !this.nativeEnded,
   timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
   sourceAlignment:'unverified' as const,originalRuntimeAccepted:false as const,
   audioAccepted:false as const,lessonCompleted:false as const});
 }
 tick(){return this.snapshot();}

 async prepare(bytes:ArrayBuffer):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');
  const ticket=++this.epoch;this.phase='loading';
  try{
   if(!(bytes instanceof ArrayBuffer))throw Error('P034_MAIN_SOURCE_MISSING');
   const prepared=await this.transport.prepare(bytes);
   if(ticket!==this.epoch)return result(false,'stale-prepare');
   if(!prepared.accepted)throw Error(prepared.reason);
   if(!this.context||this.context.sampleRate!==RATE||
    this.context.state==='closed')throw Error('P034_CONTEXT_RATE_MISMATCH');
   const volume=this.transport.setVolume(this.volume);
   if(!volume.accepted)throw Error(volume.reason);
   this.context.addEventListener('statechange',this.contextChanged);
   if(!this.commit(true))throw Error('P034_FIRST_FRAME_NOT_COMMITTED');
   this.phase='ready';return result(true,'continuous-main-ready');
  }catch(error){
   if(ticket!==this.epoch)return result(false,'stale-prepare');
   const reason=error instanceof Error?error.message:String(error);
   this.phase='failed';this.failure=reason;
   this.context?.removeEventListener('statechange',this.contextChanged);
   await this.transport.close();
   return result(false,reason);
  }
 }

 async play(policy:UserPolicy):Promise<DecodedStreamResult>{
  this.settle();
  if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
   return result(false,'explicit-user-play-required');
  if(this.glossaryOpen!==null)return result(false,'glossary-open-hold');
  if(this.phase==='playing')return result(true,'already-playing');
  if(!['ready','paused'].includes(this.phase)||!this.context)
   return result(false,'not-ready');
  const held=this.transport.snapshot();
  if(this.snapshot().nativeEofPending)return result(false,'native-eof-pending');
  if(!this.nativeEnded&&held.decodedSample>=MAIN_SAMPLES)
   return result(false,'main-native-eof-unobserved-replay-required');
  if(this.frame()===STOP_FRAME&&this.nativeEnded)
   return result(false,'source-stop-held');
  const ticket=++this.epoch;this.phase='start-pending';this.failure=null;
  try{
   let anchorTime:number;
   if(this.nativeEnded){
    // After genuine main EOF there is no new source node. The same context
    // continues to time the remaining authored visual frames.
    await this.context.resume();
    if(ticket!==this.epoch)return result(false,'stale-start');
    if(this.context.state!=='running')throw Error('context-not-running');
    anchorTime=this.context.currentTime;
   }else{
    const started=await this.transport.play(policy);
    if(ticket!==this.epoch)return result(false,'stale-start');
    if(!started.accepted)throw Error(started.reason);
    const native=this.transport.snapshot();
    if(this.context.state!=='running'||
     (!native.playbackAnchor&&!this.nativeEnded))
     throw Error('P034_MAIN_START_ANCHOR_MISSING');
    anchorTime=native.playbackAnchor?.contextTime??this.context.currentTime;
    if(!this.nativeEnded)this.nativeRunEpoch=native.epoch;
   }
   if(!Number.isFinite(anchorTime))throw Error('P034_INVALID_CONTEXT_TIME');
   this.anchor={contextTime:anchorTime,position:this.position};
   this.phase='playing';this.settle();
   return result(true,this.nativeEnded?'visual-tail-only':'continuous-main-playing');
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
  // A full computed cursor may precede the real onended callback. Preserve
  // that node until its callback, rather than synthesizing EOF from the cursor.
  const awaitNativeEof=!this.nativeEnded&&native.phase==='playing'&&
   native.decodedSample>=MAIN_SAMPLES&&this.context?.state==='running';
  this.epoch++;if(!awaitNativeEof)this.retire();
  this.anchor=undefined;this.phase='paused';
  return this.commit()?result(true,'continuous-main-held'):
   this.fail('P034_PAUSED_FRAME_NOT_COMMITTED');
 }
 openGlossary(key:P034GlossaryKey):DecodedStreamResult{
  this.settle();
  if(this.glossaryOpen!==null||
   !['Vertical-line test','Graph','Function','Vertical','Line'].includes(key)||
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
  this.epoch++;this.retire();this.anchor=undefined;this.nativeRunEpoch=null;
  this.nativeEnded=false;this.glossaryOpen=null;
  const replayed=this.transport.replay();
  if(!replayed.accepted)return this.fail(replayed.reason);
  this.position=1;this.committedFrame=0;this.phase='ready';this.failure=null;
  return this.commit(true)?result(true,'continuous-main-replayed-held'):
   this.fail('P034_REPLAY_FRAME_NOT_COMMITTED');
 }
 setVolume(value:number):DecodedStreamResult{
  if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
   return result(false,'invalid-volume');
  const changed=this.transport.setVolume(value);
  if(!changed.accepted)return result(false,changed.reason);
  this.volume=value;return result(true,'volume-set');
 }
 async close():Promise<void>{
  if(this.phase==='closed')return;
  this.epoch++;this.retire();this.anchor=undefined;this.glossaryOpen=null;
  this.nativeRunEpoch=null;this.phase='closed';
  this.context?.removeEventListener('statechange',this.contextChanged);
  this.unsubscribe();await this.transport.close();
 }
}
