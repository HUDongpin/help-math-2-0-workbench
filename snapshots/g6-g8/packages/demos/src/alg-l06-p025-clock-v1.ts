/** P025 source-bound sprite-21 clock. The pure clock below is transport-free;
 * the browser adapter owns one validated main node, while optional Spanish
 * Audio remains a separate owner.
 * Source/geometry: output/alg-l06-p025-source-audit-v1 and
 * output/alg-l06-p025-text-geometry-v1. No original-runtime sync is claimed. */

import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,type DecodedStreamResult}
 from './decoded-source-stream-transport';
import {P025_AUDIO_ASSETS,P025_AUDIO_DISPOSITION,P025_AUDIO_END_POSITION,p025AudioSlice,
 type P025AudioId} from './alg-l06-p025-audio-schedule-v1';
import {P025_TIMELINE,p025TimelineState,type P025TimelineGlossaryKey}
 from './alg-l06-p025-timeline-v1';

export const P025_PRIMARY_AUDIO=Object.freeze({
 id:'sprite-21' as const,frameDomain:'sprite-21' as const,
 sourceSha256:'e6122c6402e0000f810b82a6f91b76b50a918a44b75709194b2cec3834a201c4',
 sourceBytes:123500,sourceBlockFirstFrame:2,sourceBlockLastFrame:299,
 sourceBlockCount:298,sourceZeroPayloadFrames:[3] as const,
 firstSeekSamples:1673,sampleRate:22050,channels:1,
 ffmpegCandidateSamples:547200,visualFrames:299,fps:12,
 separateSaSourceSha256:'295dcabe0549764ffe03ecc4e6a332a5cb85d05329095be079ad32bdac6a044e',
 separateSaSpliced:false,originalRuntimeAccepted:false,audioAccepted:false,
});
export const P025_GLOSSARY_FIRST_SOURCE_READY=Object.freeze({
 'Independent variable':28,'Input variable':41,Function:50,Domain:295,
} as const);
export type P025GlossaryKey=keyof typeof P025_GLOSSARY_FIRST_SOURCE_READY;
export type P025ClockPhase='ready'|'playing'|'paused'|'ended'|'failed'|'closed';
export type P025BrowserDecode=Readonly<{sampleRate:number;samples:number;channels:number;
 durationSeconds:number;ffmpegCandidateSamples:number;candidateSampleCountMatches:true;
 browserPcmSha256IsFfmpegProof:false}>;
export type P025AudioStart=Readonly<{sourceId:'sprite-21';generation:number;
 decodedSample:number;offsetSeconds:number;delaySeconds:number}>;
export type P025ClockSnapshot=Readonly<{phase:P025ClockPhase;frameDomain:'sprite-21';
 frame:number;position:number;elapsedSeconds:number;decodedSamples:number;
 predictedAudioEofPosition:number;boundedVisualTailFrames:number;
 nativeEndedObserved:boolean;decodedSampleExhaustedObserved:boolean;
 visualTailAfterAudioEof:boolean;awaitingAudioEof:boolean;
 glossaryOpen:P025GlossaryKey|null;generation:number;failure:string|null;
 sourceAlignment:'unresolved';originalRuntimeAccepted:false;audioAccepted:false}>;
export type P025ClockTransition=Readonly<{accepted:boolean;reason:string;
 enteredFrames:readonly number[];snapshot:P025ClockSnapshot;
 audioStart:P025AudioStart|null;retirePrimaryAudio:boolean}>;

const A=P025_PRIMARY_AUDIO;
export const P025_AUDIO_EOF_POSITION=A.sourceBlockFirstFrame+
 (A.ffmpegCandidateSamples-A.firstSeekSamples)/A.sampleRate*A.fps;
export const P025_FINAL_VISUAL_TAIL_FRAMES=A.visualFrames-P025_AUDIO_EOF_POSITION;
if(!(P025_FINAL_VISUAL_TAIL_FRAMES>0&&P025_FINAL_VISUAL_TAIL_FRAMES<0.115))
 throw Error('P025_SOURCE_AUDIO_TAIL_DRIFT');
const finite=(n:number)=>Number.isFinite(n);
const clamp=(n:number)=>Math.max(1,Math.min(A.visualFrames,n));
const currentFrame=(position:number)=>Math.max(1,Math.min(A.visualFrames,
 Math.floor(position+1e-9)));

/** The browser must supply decoded AudioBuffer metadata. FFmpeg's count is a
 * source candidate, never substituted for a missing browser observation. */
export function inspectP025BrowserDecode(buffer:Pick<AudioBuffer,
 'sampleRate'|'length'|'numberOfChannels'|'duration'>):P025BrowserDecode{
 if(!buffer||buffer.sampleRate!==A.sampleRate||buffer.numberOfChannels!==A.channels||
  !Number.isSafeInteger(buffer.length)||buffer.length!==A.ffmpegCandidateSamples||
  !finite(buffer.duration)||buffer.duration<=0||
  Math.abs(buffer.duration-buffer.length/buffer.sampleRate)>1/buffer.sampleRate)
  throw Error('P025_BROWSER_DECODE_METADATA_UNRESOLVED');
 return Object.freeze({sampleRate:buffer.sampleRate,samples:buffer.length,
  channels:buffer.numberOfChannels,durationSeconds:buffer.duration,
  ffmpegCandidateSamples:A.ffmpegCandidateSamples,candidateSampleCountMatches:true as const,
  browserPcmSha256IsFfmpegProof:false as const});
}

export function p025GlossarySourceReady(key:P025GlossaryKey,frame:number):boolean{
 return Object.prototype.hasOwnProperty.call(P025_GLOSSARY_FIRST_SOURCE_READY,key)&&
  Number.isInteger(frame)&&frame>=P025_GLOSSARY_FIRST_SOURCE_READY[key]&&
  frame<=A.visualFrames;
}

/** Clock time is the AudioContext currentTime supplied by the owner. The class
 * never reads wall time, creates audio, dispatches UI, or loads separate SA. */
export class P025PrimaryClockV1{
 private phase:P025ClockPhase='ready';
 private position=1;
 private anchor:{contextTime:number;position:number}|null=null;
 private lastContextTime:number|null=null;
 private generation=0;
 private nativeEnded=false;
 private decodedExhausted=false;
 private lastObservedSample=0;
 private glossaryOpen:P025GlossaryKey|null=null;
 private failure:string|null=null;
 private readonly decoded:P025BrowserDecode;

 constructor(decoded:P025BrowserDecode){
  if(!decoded||decoded.sampleRate!==A.sampleRate||
   decoded.samples!==A.ffmpegCandidateSamples||decoded.channels!==A.channels||
   decoded.candidateSampleCountMatches!==true||
   decoded.browserPcmSha256IsFfmpegProof!==false)
   throw Error('P025_BROWSER_DECODE_REQUIRED');
  this.decoded=decoded;
 }
 private transition(accepted:boolean,reason:string,enteredFrames:number[]=[],
  audioStart:P025AudioStart|null=null,retirePrimaryAudio=false):P025ClockTransition{
  return Object.freeze({accepted,reason,enteredFrames:Object.freeze(enteredFrames),
   snapshot:this.snapshot(),audioStart,retirePrimaryAudio});
 }
 private fail(reason:string,enteredFrames:number[]=[]):P025ClockTransition{
  this.generation++;this.anchor=null;this.phase='failed';this.failure=reason;
  return this.transition(false,reason,enteredFrames,null,true);
 }
 snapshot():P025ClockSnapshot{
  return Object.freeze({phase:this.phase,frameDomain:'sprite-21' as const,
   frame:currentFrame(this.position),position:this.position,
   elapsedSeconds:(this.position-1)/A.fps,decodedSamples:this.decoded.samples,
   predictedAudioEofPosition:P025_AUDIO_EOF_POSITION,
   boundedVisualTailFrames:P025_FINAL_VISUAL_TAIL_FRAMES,
   nativeEndedObserved:this.nativeEnded,
   decodedSampleExhaustedObserved:this.decodedExhausted,
   visualTailAfterAudioEof:this.phase==='playing'&&
    (this.nativeEnded||this.decodedExhausted)&&this.position<A.visualFrames,
   awaitingAudioEof:this.phase==='playing'&&this.position>=A.visualFrames&&
    !this.nativeEnded&&!this.decodedExhausted,
   glossaryOpen:this.glossaryOpen,generation:this.generation,failure:this.failure,
   sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
   audioAccepted:false as const});
 }
 private advanceTo(contextTime:number):number[]{
  if(!finite(contextTime)||contextTime<0||
   (this.lastContextTime!==null&&contextTime+1e-9<this.lastContextTime))
   throw Error('P025_CONTEXT_TIME_NONMONOTONIC');
  this.lastContextTime=contextTime;
  if(this.phase!=='playing'||!this.anchor)return [];
  const oldFrame=currentFrame(this.position);
  const next=clamp(this.anchor.position+
   Math.max(0,contextTime-this.anchor.contextTime)*A.fps);
  if(next+1e-9<this.position)throw Error('P025_CLOCK_POSITION_REGRESSED');
  this.position=Math.max(this.position,next);
  const last=currentFrame(this.position);
  const entered=Array.from({length:last-oldFrame},(_,i)=>oldFrame+i+1);
  if(this.position>=A.visualFrames&&
   (this.nativeEnded||this.decodedExhausted)){
   this.anchor=null;this.phase='ended';this.generation++;
  }
  return entered;
 }
 advance(contextTime:number):P025ClockTransition{
  if(this.phase==='closed'||this.phase==='failed')
   return this.transition(false,'clock-unavailable');
  try{return this.transition(true,'clock-advanced',this.advanceTo(contextTime));}
  catch(error){return this.fail(error instanceof Error?error.message:String(error));}
 }
 /** Return a source offset and preroll delay. The owner must retire any old
  * node before using this descriptor, and must never mix in physical SA. */
 play(contextTime:number,activation:'user'|'automatic'='user'):P025ClockTransition{
  if(activation!=='user')return this.transition(false,'explicit-user-play-required');
  if(this.glossaryOpen)return this.transition(false,'glossary-open-hold');
  if(!['ready','paused'].includes(this.phase))return this.transition(false,'clock-not-ready');
  if(!finite(contextTime)||contextTime<0||
   (this.lastContextTime!==null&&contextTime+1e-9<this.lastContextTime))
   return this.fail('P025_CONTEXT_TIME_NONMONOTONIC');
  this.lastContextTime=contextTime;this.anchor={contextTime,position:this.position};
  this.phase='playing';this.failure=null;this.generation++;
  if(this.nativeEnded||this.decodedExhausted)
   return this.transition(true,'visual-tail-only',[],null,false);
  const delaySeconds=Math.max(0,A.sourceBlockFirstFrame-this.position)/A.fps;
  const sample=A.firstSeekSamples+
   Math.max(0,this.position-A.sourceBlockFirstFrame)*A.sampleRate/A.fps;
  if(sample>=this.decoded.samples){
   // A late onended callback may not yet have arrived. Never restart an
   // exhausted sample range or synthesize more primary audio.
   return this.transition(true,'awaiting-observed-audio-eof',[],null,false);
  }
  const audioStart=Object.freeze({sourceId:A.id,generation:this.generation,
   decodedSample:sample,offsetSeconds:sample/A.sampleRate,delaySeconds});
  return this.transition(true,'primary-start',[],audioStart,false);
 }
 pause(contextTime:number):P025ClockTransition{
  if(this.phase!=='playing')return this.transition(false,'clock-not-playing');
  try{
   const entered=this.advanceTo(contextTime);
   if(this.snapshot().phase==='ended')return this.transition(true,'already-ended',entered,null,true);
   this.anchor=null;this.phase='paused';this.generation++;
   return this.transition(true,'primary-held',entered,null,true);
  }catch(error){return this.fail(error instanceof Error?error.message:String(error));}
 }
 /** Sample observation comes from the owner/transport, not visual elapsed
  * time. A positive sample cursor is monotonic within one primary generation. */
 observeDecodedSample(sample:number,contextTime:number,generation:number):P025ClockTransition{
  if(this.phase!=='playing'||generation!==this.generation)
   return this.transition(false,'stale-primary-observation');
  if(!finite(sample)||sample<0||sample>this.decoded.samples)
   return this.fail('P025_DECODED_SAMPLE_INVALID');
  if(sample+1e-9<this.lastObservedSample)
   return this.fail('P025_DECODED_SAMPLE_REGRESSED');
  try{
   const entered=this.advanceTo(contextTime);
   this.lastObservedSample=sample;
   if(sample===this.decoded.samples){
    if(this.position+1e-9<P025_AUDIO_EOF_POSITION)
     return this.fail('P025_AUDIO_EOF_BEFORE_SOURCE_BOUNDARY',entered);
    this.decodedExhausted=true;
   }
   if(this.position>=A.visualFrames&&this.decodedExhausted){
    this.anchor=null;this.phase='ended';this.generation++;
   }
   return this.transition(true,'sample-observed',entered);
  }catch(error){return this.fail(error instanceof Error?error.message:String(error));}
 }
 markNativeEnded(contextTime:number,generation:number):P025ClockTransition{
  if(this.phase!=='playing'||generation!==this.generation)
   return this.transition(false,'stale-primary-ended');
  try{
   const entered=this.advanceTo(contextTime);
   if(this.position+1e-9<P025_AUDIO_EOF_POSITION)
    return this.fail('P025_AUDIO_EOF_BEFORE_SOURCE_BOUNDARY',entered);
   this.nativeEnded=true;
   if(this.position>=A.visualFrames){
    this.anchor=null;this.phase='ended';this.generation++;
   }
   return this.transition(true,'native-primary-ended',entered);
  }catch(error){return this.fail(error instanceof Error?error.message:String(error));}
 }
 holdForGlossary(key:P025GlossaryKey,contextTime:number):P025ClockTransition{
  if(this.glossaryOpen||!['ready','paused','playing'].includes(this.phase))
   return this.transition(false,'glossary-unavailable');
  const reached=this.advance(contextTime);
  if(!reached.accepted)return reached;
  if(!p025GlossarySourceReady(key,this.snapshot().frame))
   return this.transition(false,'glossary-before-source-ink-hit',
    [...reached.enteredFrames]);
  const held=this.phase==='playing'?this.pause(contextTime):
   this.transition(true,'already-held');
  if(!held.accepted)return held;
  this.glossaryOpen=key;
  return this.transition(true,'glossary-held',
   [...reached.enteredFrames,...held.enteredFrames],null,held.retirePrimaryAudio);
 }
 closeGlossary():P025ClockTransition{
  if(!this.glossaryOpen)return this.transition(false,'glossary-not-open');
  this.glossaryOpen=null;return this.transition(true,'glossary-closed-held');
 }
 replay():P025ClockTransition{
  if(this.phase==='closed')return this.transition(false,'clock-closed');
  this.generation++;this.phase='ready';this.position=1;this.anchor=null;
  this.lastContextTime=null;this.nativeEnded=false;this.decodedExhausted=false;
  this.lastObservedSample=0;
  this.glossaryOpen=null;this.failure=null;
  return this.transition(true,'primary-replayed',[],null,true);
 }
 close():P025ClockTransition{
  if(this.phase==='closed')return this.transition(true,'already-closed');
  this.generation++;this.phase='closed';this.anchor=null;
  this.glossaryOpen=null;return this.transition(true,'primary-closed',[],null,true);
 }
}

type P025Transport=Pick<DecodedSourceStreamTransport,
 'prepare'|'snapshot'|'subscribe'|'seekDecodedSample'|'play'|'pause'|'replay'|
 'holdSourceBoundary'|'setVolume'|'close'>;
type P025HostPhase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
 'timeline-ended'|'failed'|'closed';
type P025PlayPolicy={activation:'automatic'|'user';reducedMotion:boolean};
const hostResult=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});

/** Browser-facing single-range adapter. The transport verifies the actual
 * browser-decoded PCM against the independently measured schedule binding.
 * Separate Spanish Audio belongs to the owner, never to this clock. */
export class AlgL06P025ClockV1{
 private readonly transport:P025Transport;
 private readonly unsubscribe:()=>void;
 private readonly commitFrame:(frame:number)=>boolean;
 private readonly createContext:()=>AudioContext;
 private context?:AudioContext;
 private phase:P025HostPhase='idle';
 private position=1;
 private committedFrame=0;
 private anchor?:{contextTime:number;position:number};
 private epoch=0;
 private nativeEnded=false;
 private decodedExhausted=false;
 private glossaryOpen:P025TimelineGlossaryKey|null=null;
 private failure:string|null=null;
 private volume=1;

 constructor(options:{commitFrame:(frame:number)=>boolean;createContext?:()=>AudioContext;
  createTransport?:(binding:DecodedSourceStreamBinding,createContext:()=>AudioContext)=>P025Transport}){
  const asset=P025_AUDIO_ASSETS[0];
  if(typeof options.commitFrame!=='function'||P025_AUDIO_ASSETS.length!==1||
   asset.id!=='main-1'||asset.sourceSha256!==A.sourceSha256||
   asset.sourceBytes!==A.sourceBytes||asset.sampleRate!==A.sampleRate||
   asset.channels!==A.channels||asset.initialSeekSamples!==A.firstSeekSamples||
   asset.decodedSamples!==A.ffmpegCandidateSamples||
   P025_TIMELINE.frameDomain!=='sprite-21'||P025_TIMELINE.mainFrameCount!==A.visualFrames||
   P025_TIMELINE.fps!==A.fps||P025_TIMELINE.glossaryInstances.length!==4||
   P025_AUDIO_DISPOSITION.frameDomain!=='sprite-21'||
   JSON.stringify(P025_AUDIO_DISPOSITION.mainRanges)!=='[[2,299]]'||
   JSON.stringify(P025_AUDIO_DISPOSITION.sourceZeroPayloadBlockFrames)!=='[3]'||
   P025_AUDIO_DISPOSITION.syntheticSilenceAdded!==false||
   P025_AUDIO_DISPOSITION.mainRangesConcatenated!==false||
   P025_AUDIO_DISPOSITION.separateSaSpliced!==false||
   P025_AUDIO_END_POSITION!==A.visualFrames||
   !(P025_FINAL_VISUAL_TAIL_FRAMES>0&&P025_FINAL_VISUAL_TAIL_FRAMES<0.115))
   throw Error('P025_MAIN_STREAM_DISPOSITION_DRIFT');
  this.commitFrame=options.commitFrame;
  this.createContext=options.createContext??(()=>(
   new AudioContext({sampleRate:asset.sampleRate,latencyHint:'interactive'})));
  const shared=()=>this.context??=this.createContext();
  const binding={sourceSha256:asset.sourceSha256,sourceBytes:asset.sourceBytes,
   sampleRate:asset.sampleRate,channels:asset.channels,
   decodedSamples:asset.decodedSamples,pcmSha256:asset.pcmSha256} satisfies DecodedSourceStreamBinding;
  this.transport=options.createTransport?.(binding,shared)??
   new DecodedSourceStreamTransport(binding,{createContext:shared});
  this.unsubscribe=this.transport.subscribe(()=>{
   if(this.phase==='playing'&&this.transport.snapshot().phase==='buffer-ended')this.settle();
  });
 }
 private frame(){return currentFrame(this.position);}
 private commitThroughFrame(force=false):boolean{
  const target=this.frame();
  if(force&&this.committedFrame===0){
   try{if(this.commitFrame(1)!==true)return false;}catch{return false;}
   this.committedFrame=1;
  }
  for(let frame=this.committedFrame+1;frame<=target;frame++){
   try{if(this.commitFrame(frame)!==true)return false;}catch{return false;}
   this.committedFrame=frame;
  }
  return this.committedFrame===target;
 }
 private fail(reason:string):DecodedStreamResult{
  this.epoch++;this.anchor=undefined;this.transport.holdSourceBoundary();
  this.phase='failed';this.failure=reason;return hostResult(false,reason);
 }
 private readonly contextChanged=()=>{
  if(this.context?.state==='running')return;
  if(this.phase==='start-pending'){
   this.transport.pause();this.epoch++;this.anchor=undefined;
   this.phase=this.context?.state==='closed'?'failed':'paused';
   if(this.phase==='failed')this.failure='main-context-closed';
  }else if(this.phase==='playing')this.settle();
 };
 private settle():void{
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  const native=this.transport.snapshot();
  if(native.phase==='buffer-ended')this.nativeEnded=true;
  if(native.decodedSample>=P025_AUDIO_ASSETS[0].decodedSamples)this.decodedExhausted=true;
  const interrupted=this.context.state!=='running'||
   ['interrupted','play-rejected','failed','closed'].includes(native.phase);
  const now=interrupted?(native.heldContextTime??native.contextTime??this.context.currentTime)
   :this.context.currentTime;
  if(!Number.isFinite(now))return void this.fail('invalid-context-time');
  this.position=Math.min(A.visualFrames,Math.max(this.position,
   this.anchor.position+Math.max(0,now-this.anchor.contextTime)*A.fps));
  if((this.nativeEnded||this.decodedExhausted)&&
   this.position+1e-5<P025_AUDIO_EOF_POSITION)
   return void this.fail('P025_AUDIO_EOF_BEFORE_SOURCE_BOUNDARY');
  if(!this.commitThroughFrame())return void this.fail('source-frame-commit-failed');
  if(interrupted){
   this.transport.pause();this.epoch++;this.anchor=undefined;
   this.phase=this.context.state==='closed'?'failed':'paused';
   if(this.phase==='failed')this.failure='main-context-closed';
   return;
  }
  if(this.position>=A.visualFrames&&(this.nativeEnded||this.decodedExhausted)){
   this.epoch++;this.transport.holdSourceBoundary();this.anchor=undefined;
   this.phase='timeline-ended';
  }
 }
 snapshot(){
  this.settle();
  const native=this.transport.snapshot();
  const audioPhase=this.phase==='playing'&&this.position<A.sourceBlockFirstFrame?'preroll':
   this.phase==='playing'&&this.decodedExhausted?'visual-tail':native.phase;
  return Object.freeze({phase:this.phase,frame:this.frame(),frameDomain:'sprite-21' as const,
   elapsedSeconds:(this.position-1)/A.fps,activeAudioId:'main-1' as P025AudioId,
   activePosition:this.position,transitioning:false,glossaryOpen:this.glossaryOpen,
   audio:Object.freeze({phase:audioPhase,decodedSample:native.decodedSample,
    contextTime:native.contextTime,volume:native.volume}),
   visualTailAfterAudioEOF:this.phase==='playing'&&this.decodedExhausted&&
    this.position<A.visualFrames,nativeBufferEndedObserved:this.nativeEnded,
   decodedSampleExhaustedObserved:this.decodedExhausted,
   mainFinalAudioTailPending:this.phase==='playing'&&this.frame()===A.visualFrames&&
    !this.nativeEnded&&!this.decodedExhausted,
   timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
   sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
   audioAccepted:false as const,lessonCompleted:false as const});
 }
 tick(){return this.snapshot();}
 async prepare(inputs:Readonly<Record<P025AudioId,ArrayBuffer>>):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return hostResult(false,'prepare-not-idle');
  const ticket=++this.epoch;this.phase='loading';
  try{
   const bytes=inputs?.['main-1'];
   if(!(bytes instanceof ArrayBuffer))throw Error('missing-source-main-1');
   const prepared=await this.transport.prepare(bytes);
   if(ticket!==this.epoch)return hostResult(false,'stale-prepare');
   if(!prepared.accepted)throw Error(`main-1:${prepared.reason}`);
   const volume=this.transport.setVolume(this.volume);
   if(!volume.accepted)throw Error(volume.reason);
   if(!this.commitThroughFrame(true))throw Error('source-first-frame-not-committed');
   if(ticket!==this.epoch)return hostResult(false,'stale-prepare');
   this.context?.addEventListener('statechange',this.contextChanged);
   this.phase='ready';return hostResult(true,'single-source-ready');
  }catch(error){
   if(ticket!==this.epoch)return hostResult(false,'stale-prepare');
   this.phase='failed';this.failure=error instanceof Error?error.message:String(error);
   await this.transport.close();return hostResult(false,this.failure);
  }
 }
 async play(policy:P025PlayPolicy):Promise<DecodedStreamResult>{
  this.settle();
  if(!policy||!['automatic','user'].includes(policy.activation)||
   typeof policy.reducedMotion!=='boolean')return hostResult(false,'invalid-play-policy');
  if(policy.activation!=='user')return hostResult(false,'explicit-user-play-required');
  if(this.glossaryOpen!==null)return hostResult(false,'glossary-open-hold');
  if(this.phase==='playing')return hostResult(true,'already-playing');
  if(!['ready','paused'].includes(this.phase)||!this.context)return hostResult(false,'not-ready');
  const ticket=++this.epoch;this.phase='start-pending';
  if(!this.commitThroughFrame()){this.phase='paused';return hostResult(false,'source-frame-not-committed');}
  try{
   let visualAnchorTime:number;
   if(this.nativeEnded||this.decodedExhausted){
    await this.context.resume();
    if(ticket!==this.epoch)return hostResult(false,'stale-start');
    if(this.context.state!=='running')throw Error('context-not-running');
    visualAnchorTime=this.context.currentTime;
   }else{
    const slice=p025AudioSlice('main-1',this.position);
    if(!slice)throw Error('source-audio-ended-before-native-eof');
    const sought=this.transport.seekDecodedSample(slice.firstDecodedSample);
    if(!sought.accepted)throw Error(sought.reason);
    const started=await this.transport.play({...policy,delaySeconds:slice.delaySeconds});
    if(ticket!==this.epoch)return hostResult(false,'stale-start');
    if(!started.accepted)throw Error(started.reason);
    // The transport schedules the native node before resolving play(). A later
    // currentTime read loses those elapsed samples and can misclassify natural
    // EOF as early. Its retained node anchor is the exact scheduling evidence.
    const native=this.transport.snapshot(),sourceAnchor=native.playbackAnchor;
    visualAnchorTime=(sourceAnchor?.contextTime??NaN)-slice.delaySeconds;
    if(native.phase!=='playing'||this.context.state!=='running'||!sourceAnchor||
     sourceAnchor.decodedSample!==slice.firstDecodedSample||
     !Number.isFinite(sourceAnchor.contextTime)||
     !Number.isFinite(native.contextTime)||
     !Number.isFinite(visualAnchorTime)||visualAnchorTime<0||
     visualAnchorTime>native.contextTime!+1e-9)
     throw Error('P025_NATIVE_START_ANCHOR_INVALID');
   }
   this.anchor={contextTime:visualAnchorTime,position:this.position};
   this.phase='playing';this.failure=null;this.settle();
   return hostResult(true,this.decodedExhausted?'visual-tail-playing':'single-source-playing');
  }catch(error){
   if(ticket!==this.epoch)return hostResult(false,'stale-start');
   this.transport.pause();this.anchor=undefined;this.phase='paused';
   this.failure=error instanceof Error?error.message:String(error);
   return hostResult(false,this.failure);
  }
 }
 pause():DecodedStreamResult{
  this.settle();
  if(!['playing','start-pending'].includes(this.phase))return hostResult(false,'not-playing');
  this.epoch++;this.transport.pause();this.anchor=undefined;this.phase='paused';
  return this.commitThroughFrame()?hostResult(true,'single-source-held'):
   this.fail('paused-frame-not-committed');
 }
 stop():DecodedStreamResult{
  if(this.phase==='playing'||this.phase==='start-pending')return this.pause();
  if(['ready','paused','timeline-ended'].includes(this.phase))
   return hostResult(true,'single-source-held');
  return hostResult(false,'not-ready');
 }
 openGlossary(key:P025TimelineGlossaryKey):DecodedStreamResult{
  this.settle();
  if(!P025_TIMELINE.glossaryInstances.some(item=>item.key===key)||
   !p025TimelineState(this.frame()).glossary[key]||
   !p025GlossarySourceReady(key,this.frame())||this.glossaryOpen!==null||
   !['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
   return hostResult(false,'glossary-unavailable');
  if(['playing','start-pending'].includes(this.phase)&&!this.pause().accepted)
   return hostResult(false,'main-pause-failed');
  this.glossaryOpen=key;return hostResult(true,'glossary-opened-and-held');
 }
 closeGlossary():DecodedStreamResult{
  if(this.glossaryOpen===null)return hostResult(false,'glossary-not-open');
  this.glossaryOpen=null;return hostResult(true,'glossary-closed-held');
 }
 replay():DecodedStreamResult{
  if(!['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
   return hostResult(false,'not-ready');
  this.epoch++;this.anchor=undefined;this.nativeEnded=false;this.decodedExhausted=false;
  this.glossaryOpen=null;this.transport.replay();this.position=1;this.committedFrame=0;
  this.phase='ready';this.failure=null;
  return this.commitThroughFrame(true)?hostResult(true,'source-replayed-and-held'):
   this.fail('replay-frame-not-committed');
 }
 setVolume(value:number):DecodedStreamResult{
  if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
   return hostResult(false,'invalid-volume');
  this.volume=value;return this.transport.setVolume(value);
 }
 async close():Promise<void>{
  if(this.phase==='closed')return;
  this.epoch++;this.anchor=undefined;this.glossaryOpen=null;this.phase='closed';
  this.context?.removeEventListener('statechange',this.contextChanged);
  this.unsubscribe();await this.transport.close();
 }
}
