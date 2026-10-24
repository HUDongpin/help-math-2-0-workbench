import {P024_AUDIO_DOMAINS,P024_AUDIO_FIRST_SEEK_SAMPLES,P024_AUDIO_FPS,
 P024_MAIN_AUDIO_ID,
 P024_AUDIO_SAMPLE_RATE,type P024AudioDomainId,p024AudioDomain}
 from './alg-l06-p024-audio-schedule-v1';

export type P024AudioContextLike=Pick<AudioContext,'currentTime'|'state'|'sampleRate'|
 'destination'|'decodeAudioData'|'createBufferSource'|'createGain'|'resume'|'close'|
 'addEventListener'|'removeEventListener'>;
export type P024ClockPhase='idle'|'decoding'|'ready'|'start-pending'|'playing'|
 'paused'|'ended'|'failed'|'closed';
export type P024ClockResult=Readonly<{accepted:boolean;reason:string}>;
type Decoded=Readonly<{buffer:AudioBuffer;sampleRate:number;samples:number;
 channels:number;durationSeconds:number;ffmpegSamples:number;ffmpegSampleCountMatches:boolean}>;
type Active=Readonly<{node:AudioBufferSourceNode;epoch:number;startTime:number;
 startSample:number;quizStopTime:number|null;quizStopSample:number|null}>;
type Held=Readonly<{position:number;cursor:number;nativeEnded:boolean;
 decodedExhausted:boolean;eofPosition:number|null;quizBoundaryReached:boolean}>;
const result=(accepted:boolean,reason:string):P024ClockResult=>Object.freeze({accepted,reason});
const domainIds=new Set<string>(P024_AUDIO_DOMAINS.map(row=>row.id));
const effectiveOnset=(id:P024AudioDomainId)=>id==='sprite-69'?3:2;
export const P024_MAIN_QUIZ_AUDIO_BOUNDARY=Object.freeze({frame:154,
 sample:P024_AUDIO_FIRST_SEEK_SAMPLES+
  (154-effectiveOnset(P024_MAIN_AUDIO_ID))*P024_AUDIO_SAMPLE_RATE/P024_AUDIO_FPS});
if(p024AudioDomain(P024_MAIN_AUDIO_ID).localStopFrame!==P024_MAIN_QUIZ_AUDIO_BOUNDARY.frame||
 !Number.isSafeInteger(P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample))
 throw Error('P024_MAIN_QUIZ_AUDIO_SOURCE_BOUNDARY_DRIFT');
/** A final empty/negative-seek SWF block is never interpreted as a negative
 * decoder seek. The running AudioContext may carry only this bounded visual tail. */
export const P024_VISUAL_TAIL_POLICY=Object.freeze({
 'sprite-69':{maxFrames:2,emptyFinalFrame:null},
 'sprite-83':{maxFrames:2,emptyFinalFrame:null},
 'sprite-97':{maxFrames:3,emptyFinalFrame:27},
 'sprite-123':{maxFrames:2,emptyFinalFrame:31},
 'sprite-155':{maxFrames:2,emptyFinalFrame:null},
 'sprite-188':{maxFrames:2,emptyFinalFrame:null},
 'sprite-196':{maxFrames:2,emptyFinalFrame:null},
 'sprite-208':{maxFrames:2,emptyFinalFrame:null},
} as const);

export function inspectP024BrowserDecode(id:P024AudioDomainId,buffer:Pick<AudioBuffer,
 'sampleRate'|'length'|'numberOfChannels'|'duration'>){
 const source=p024AudioDomain(id);
 if(buffer.sampleRate!==P024_AUDIO_SAMPLE_RATE||buffer.numberOfChannels!==1||
  !Number.isSafeInteger(buffer.length)||buffer.length<=P024_AUDIO_FIRST_SEEK_SAMPLES||
  !Number.isFinite(buffer.duration)||buffer.duration<=0||
  Math.abs(buffer.duration-buffer.length/buffer.sampleRate)>1/buffer.sampleRate)
  throw Error('P024_BROWSER_DECODE_METADATA_INVALID');
 return Object.freeze({domain:id,sampleRate:buffer.sampleRate,samples:buffer.length,
  channels:buffer.numberOfChannels,durationSeconds:buffer.duration,
  ffmpegSamples:source.declaredSamples,
  ffmpegSampleCountMatches:buffer.length===source.declaredSamples,
  ffmpegPcmSha256IsBrowserProof:false as const});
}

/** One native source at a time. Decoded buffers may be cached; a switched
 * domain's AudioBufferSourceNode is stopped and disconnected synchronously. */
export class P024DomainClockV1 {
 private readonly createContext:()=>P024AudioContextLike;
 private context?:P024AudioContextLike;
 private gain?:GainNode;
 private readonly decoded=new Map<P024AudioDomainId,Decoded>();
 private readonly held=new Map<P024AudioDomainId,Held>();
 private active?:Active;
 private phase:P024ClockPhase='idle';
 private domain:P024AudioDomainId|null=null;
 private position=1;
 private cursor:number=P024_AUDIO_FIRST_SEEK_SAMPLES;
 private anchor?:{time:number;position:number};
 private epoch=0;
 private nativeEnded=false;
 private decodedExhausted=false;
 private eofPosition:number|null=null;
 private quizBoundaryReached=false;
 private failure:string|null=null;
 private volume=1;
 private userActivated=false;

 constructor(options:{createContext?:()=>P024AudioContextLike}={}){
  this.createContext=options.createContext??(()=>new AudioContext({
   sampleRate:P024_AUDIO_SAMPLE_RATE,latencyHint:'interactive'}));
 }
 private ensureContext(){
  if(!this.context){
   const context=this.createContext();
   if(context.sampleRate!==P024_AUDIO_SAMPLE_RATE)throw Error('P024_CONTEXT_RATE_MISMATCH');
   this.context=context;this.gain=context.createGain();
   this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   this.gain.connect(context.destination);
   context.addEventListener('statechange',this.onContextState);
  }
  return this.context;
 }
 private readonly onContextState=()=>{
  if(this.phase==='playing'&&this.context?.state!=='running')this.hold();
 };
 private retire(){
  const active=this.active;this.active=undefined;
  if(!active)return;
  active.node.onended=null;
  try{active.node.stop();}catch{/* A naturally ended node may reject stop. */}
  active.node.disconnect();
 }
 private sampleAt(position:number,id:P024AudioDomainId){
  const decoded=this.decoded.get(id)!;
  const offset=Math.max(0,position-effectiveOnset(id))/P024_AUDIO_FPS;
  return Math.min(decoded.samples,P024_AUDIO_FIRST_SEEK_SAMPLES+offset*decoded.sampleRate);
 }
 private fail(reason:string){
  this.epoch++;this.retire();this.anchor=undefined;
  this.quizBoundaryReached=false;this.phase='failed';this.failure=reason;
 }
 private reachQuizBoundary(active:Active){
  if(this.domain!==P024_MAIN_AUDIO_ID||active.quizStopSample===null)return;
  this.position=P024_MAIN_QUIZ_AUDIO_BOUNDARY.frame;
  this.cursor=active.quizStopSample;
  this.nativeEnded=false;this.decodedExhausted=false;this.eofPosition=null;
  this.quizBoundaryReached=true;
  this.epoch++;this.retire();this.anchor=undefined;this.phase='paused';
  this.saveHeld();
 }
 private settle(){
  if(this.phase!=='playing'||!this.context||!this.domain||!this.anchor)return;
  const now=this.context.currentTime;
  if(!Number.isFinite(now)||now<this.anchor.time){this.fail('P024_INVALID_CONTEXT_TIME');return;}
  const active=this.active;
  if(active&&active.quizStopTime!==null&&now>=active.quizStopTime){
   this.reachQuizBoundary(active);return;
  }
  if(this.context.state!=='running'){
   this.epoch++;this.retire();this.anchor=undefined;this.phase='paused';
   this.saveHeld();return;
  }
  const info=this.decoded.get(this.domain)!;
  this.position=Math.min(p024AudioDomain(this.domain).frames,
   Math.max(this.position,this.anchor.position+(now-this.anchor.time)*P024_AUDIO_FPS));
  if(this.active){
   this.cursor=Math.min(info.samples,this.active.startSample+
    Math.max(0,now-this.active.startTime)*info.sampleRate);
   if(this.cursor>=info.samples){
    this.decodedExhausted=true;
    if(this.eofPosition===null)
     this.eofPosition=Math.min(p024AudioDomain(this.domain).frames,
      this.anchor.position+(this.active.startTime+
       (info.samples-this.active.startSample)/info.sampleRate-
       this.anchor.time)*P024_AUDIO_FPS);
   }
  }
  if(this.decodedExhausted){
   if(this.eofPosition===null)this.eofPosition=this.position;
   const bound=P024_VISUAL_TAIL_POLICY[this.domain].maxFrames;
   if(p024AudioDomain(this.domain).frames-this.eofPosition>bound+1e-6){
    this.fail('P024_VISUAL_TAIL_BOUND_EXCEEDED');return;
   }
  }
  if(this.position>=p024AudioDomain(this.domain).frames&&
   (this.nativeEnded||this.decodedExhausted)){
   this.epoch++;this.retire();this.anchor=undefined;this.phase='ended';
  }
 }
 snapshot(){
  this.settle();
  const id=this.domain,terminal=id?p024AudioDomain(id).frames:null;
  return Object.freeze({phase:this.phase,domain:id,frame:id?Math.min(terminal!,
   Math.floor(this.position+1e-9)):1,position:this.position,decodedSample:this.cursor,
   sourceNodeActive:!!this.active,nativeBufferEndedObserved:this.nativeEnded,
   decodedSampleExhaustedObserved:this.decodedExhausted,
   visualTerminalReached:terminal!==null&&this.position>=terminal,
   visualTailAfterAudioEOF:this.phase==='playing'&&this.decodedExhausted&&
    terminal!==null&&this.position<terminal,
   audioEofPosition:this.eofPosition,
   quizBoundaryReached:id===P024_MAIN_AUDIO_ID&&this.quizBoundaryReached,
   heldSourceSample:id===P024_MAIN_AUDIO_ID&&this.quizBoundaryReached?
    this.cursor:null,
   quizBoundarySample:id===P024_MAIN_AUDIO_ID?
    P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample:null,
   tailPolicy:id?P024_VISUAL_TAIL_POLICY[id]:null,
   browserDecode:id?this.decoded.get(id)&&Object.freeze({
    sampleRate:this.decoded.get(id)!.sampleRate,samples:this.decoded.get(id)!.samples,
    channels:this.decoded.get(id)!.channels,
    ffmpegSamples:this.decoded.get(id)!.ffmpegSamples,
    ffmpegSampleCountMatches:this.decoded.get(id)!.ffmpegSampleCountMatches}):null,
   volume:this.volume,failure:this.failure,sourceAlignment:'unresolved' as const,
   originalRuntimeAccepted:false as const,audioAccepted:false as const,
   lessonCompleted:false as const});
 }
 tick(){return this.snapshot();}
 private saveHeld(){
  if(this.domain)this.held.set(this.domain,{position:this.position,cursor:this.cursor,
   nativeEnded:this.nativeEnded,decodedExhausted:this.decodedExhausted,
   eofPosition:this.eofPosition,quizBoundaryReached:this.quizBoundaryReached});
 }
 async prepare(id:P024AudioDomainId,input:ArrayBuffer):Promise<P024ClockResult>{
  if(this.phase==='closed')return result(false,'clock-closed');
  if(this.decoded.has(id))return result(true,'already-prepared');
  if(!domainIds.has(id)||!(input instanceof ArrayBuffer))return result(false,'invalid-source-input');
  if(this.phase==='playing'||this.phase==='start-pending')return result(false,'hold-before-decode');
  const ticket=++this.epoch;this.phase='decoding';this.failure=null;
  const bytes=input.slice(0),source=p024AudioDomain(id);
  try{
   if(bytes.byteLength!==source.sourceBytes)throw Error('P024_SOURCE_LENGTH_MISMATCH');
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   const hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
   if(ticket!==this.epoch)return result(false,'stale-decode');
   if(hash!==source.sourceSha256)throw Error('P024_SOURCE_HASH_MISMATCH');
   const context=this.ensureContext();
   const buffer=await context.decodeAudioData(bytes);
   if(ticket!==this.epoch)return result(false,'stale-decode');
   const metadata=inspectP024BrowserDecode(id,buffer);
   this.decoded.set(id,{buffer,...metadata});
   this.phase='ready';return result(true,'source-decoded-metadata-recorded');
  }catch(error){
   if(ticket!==this.epoch)return result(false,'stale-decode');
   this.phase='failed';this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
 }
 /** Exact domain-local frame seek; no raw negative SWF seek is applied. */
 seek(id:P024AudioDomainId,frame:number):P024ClockResult{
  const source=domainIds.has(id)?p024AudioDomain(id):null;
  if(this.phase==='closed'||!source||!this.decoded.has(id)||
   !Number.isSafeInteger(frame)||frame<1||frame>source.frames)
   return result(false,'invalid-domain-frame-seek');
  this.hold();this.domain=id;this.position=frame;this.cursor=this.sampleAt(frame,id);
  this.nativeEnded=false;this.decodedExhausted=this.cursor>=this.decoded.get(id)!.samples;
  this.eofPosition=this.decodedExhausted?frame:null;
  this.quizBoundaryReached=false;
  this.saveHeld();
  this.phase='paused';this.failure=null;
  return result(true,'domain-frame-seek-held');
 }
 async play(id:P024AudioDomainId,frame:number,policy:{activation:'user'|'automatic';
  reducedMotion:boolean;resumeHeld?:boolean;stopAtFrame?:154}):Promise<P024ClockResult>{
  if(!policy||!['user','automatic'].includes(policy.activation)||
   typeof policy.reducedMotion!=='boolean')return result(false,'invalid-play-policy');
  if(policy.activation==='automatic'&&policy.reducedMotion)
   return result(false,'reduced-motion-hold');
  if(policy.activation==='automatic'&&!this.userActivated)
   return result(false,'explicit-user-start-required');
  if(this.phase==='closed'||!this.decoded.has(id))return result(false,'domain-not-ready');
  if(policy.stopAtFrame!==undefined&&
   (id!==P024_MAIN_AUDIO_ID||policy.stopAtFrame!==P024_MAIN_QUIZ_AUDIO_BOUNDARY.frame||
    frame>=policy.stopAtFrame))return result(false,'invalid-quiz-audio-boundary');
  if(policy.stopAtFrame!==undefined&&this.domain===id&&
   this.position>=policy.stopAtFrame)
   return result(false,this.quizBoundaryReached?'quiz-boundary-await-reducer':
    'quiz-boundary-already-overshot');
  if(this.phase==='playing'&&this.domain===id)return result(true,'already-playing');
  if(this.domain!==id){
   this.hold();
   const saved=policy.resumeHeld?this.held.get(id):undefined;
   if(saved&&Math.floor(saved.position+1e-9)===frame){
    this.domain=id;this.position=saved.position;this.cursor=saved.cursor;
    this.nativeEnded=saved.nativeEnded;this.decodedExhausted=saved.decodedExhausted;
    this.eofPosition=saved.eofPosition;
    this.quizBoundaryReached=saved.quizBoundaryReached;this.phase='paused';
   }else{
    const sought=this.seek(id,frame);if(!sought.accepted)return sought;
   }
  }else if(Math.floor(this.position+1e-9)!==frame){
   const sought=this.seek(id,frame);if(!sought.accepted)return sought;
  }
  if(!['ready','paused','ended'].includes(this.phase))return result(false,'clock-not-ready');
  const context=this.ensureContext(),ticket=++this.epoch;
  this.phase='start-pending';this.failure=null;
  try{
   // Resume is called before the first await, preserving a user gesture.
   await context.resume();
   if(ticket!==this.epoch)return result(false,'stale-start');
   if(context.state!=='running')throw Error('P024_CONTEXT_NOT_RUNNING');
   if(policy.activation==='user')this.userActivated=true;
   const decoded=this.decoded.get(id)!,when=context.currentTime;
   const delay=Math.max(0,effectiveOnset(id)-this.position)/P024_AUDIO_FPS;
   if(policy.stopAtFrame!==undefined&&
    decoded.samples<P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample)
    throw Error('P024_QUIZ_BOUNDARY_BEYOND_BROWSER_DECODE');
   if(this.cursor<decoded.samples){
    const node=context.createBufferSource();node.buffer=decoded.buffer;
    node.connect(this.gain!);
    const quizStopTime=policy.stopAtFrame===undefined?null:
     when+(policy.stopAtFrame-this.position)/P024_AUDIO_FPS;
    const active={node,epoch:ticket,startTime:when+delay,startSample:this.cursor,
     quizStopTime,quizStopSample:quizStopTime===null?null:
      P024_MAIN_QUIZ_AUDIO_BOUNDARY.sample};
    node.onended=()=>{
     if(this.active!==active||this.epoch!==ticket)return;
     if(active.quizStopTime!==null&&this.context&&
      this.context.currentTime>=active.quizStopTime){
      this.reachQuizBoundary(active);return;
     }
     if(this.anchor&&this.eofPosition===null)
      this.eofPosition=Math.min(p024AudioDomain(id).frames,
       this.anchor.position+(active.startTime+
        (decoded.samples-active.startSample)/decoded.sampleRate-
        this.anchor.time)*P024_AUDIO_FPS);
     this.active=undefined;node.onended=null;node.disconnect();
     this.cursor=decoded.samples;this.nativeEnded=true;this.decodedExhausted=true;
     this.settle();
    };
    try{
     node.start(active.startTime,this.cursor/decoded.sampleRate);
     if(quizStopTime!==null)node.stop(quizStopTime);
    }
    catch(error){node.onended=null;try{node.stop();}catch{/* No live node. */}
     node.disconnect();throw error;}
    this.active=active;
   }else this.decodedExhausted=true;
   this.domain=id;this.anchor={time:when,position:this.position};
   this.quizBoundaryReached=false;
   this.phase='playing';this.settle();
   return result(true,this.active?'source-playing':'visual-tail-playing');
  }catch(error){
   if(ticket!==this.epoch)return result(false,'stale-start');
   this.retire();this.anchor=undefined;this.phase='paused';
   this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
 }
 hold():P024ClockResult{
  if(this.phase==='closed')return result(false,'clock-closed');
  if(this.phase==='playing')this.settle();
  this.epoch++;this.retire();this.anchor=undefined;
  this.saveHeld();
  this.phase=this.domain?'paused':this.decoded.size?'ready':'idle';
  return result(true,'source-node-retired');
 }
 replay():P024ClockResult{
  if(this.phase==='closed')return result(false,'clock-closed');
  this.hold();this.held.clear();this.domain=null;this.position=1;
  this.cursor=P024_AUDIO_FIRST_SEEK_SAMPLES;
  this.nativeEnded=false;this.decodedExhausted=false;this.eofPosition=null;
  this.quizBoundaryReached=false;
  this.failure=null;this.phase=this.decoded.size?'ready':'idle';
  return result(true,'all-domains-held-at-replay');
 }
 setVolume(value:number):P024ClockResult{
  if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
   return result(false,'invalid-volume');
  this.volume=value;this.gain?.gain.setValueAtTime(value,this.context!.currentTime);
  return result(true,'volume-set');
 }
 async close():Promise<void>{
  if(this.phase==='closed')return;
  this.epoch++;this.retire();this.anchor=undefined;this.phase='closed';
  this.context?.removeEventListener('statechange',this.onContextState);
  this.gain?.disconnect();this.decoded.clear();this.held.clear();
  if(this.context&&this.context.state!=='closed')await this.context.close();
 }
}
