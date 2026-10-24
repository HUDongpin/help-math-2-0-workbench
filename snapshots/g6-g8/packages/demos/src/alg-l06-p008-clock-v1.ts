import {DecodedSourceStreamTransport, type DecodedStreamResult} from './decoded-source-stream-transport';
import {P008_CONTINUOUS_AUDIO as PLAN,p008ContinuousAudioSlice} from './alg-l06-p008-audio-schedule-v1';

type Phase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|'timeline-ended'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const END_SECONDS=(PLAN.lastFrame-1)/PLAN.fps;
const answer=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});

/** Chrome decode-only measurement; no playback/listening or original sync was accepted. */
export const P008_BROWSER_DECODER=Object.freeze({
 receiptSha256:'1e234628e29ff9cb299225f019d9b8ab2d39ed6cf83c122fbffe6c2487a456d5',
 sourceSha256:PLAN.sourceMp3Sha256,sourceBytes:PLAN.sourceMp3Bytes,
 sampleRate:PLAN.sampleRate,channels:1 as const,decodedSamples:PLAN.decodedSamples,
 pcmSha256:'70865eeae0151c3ceaa2c67e37d13972c7652ef8ed52d62d4b36626b949ef8ae',
 browser:'HeadlessChrome/153.0.0.0',originalRuntimeAccepted:false,audioAccepted:false,
});
export const P008_CONTINUOUS_SOURCE_URL=
 `/flash-assets/g678-local/shared-alg001-l06-p008/continuous-source-v1?sha256=${PLAN.sourceMp3Sha256}`;

/** Owns one continuous main stream and a visual clock through the silent tail.
 * The separate SA source has no verified host trigger and is never activated. */
export class AlgL06P008ClockV1 {
 readonly plan=PLAN;
 private readonly commitHeldFrame:(frame:number)=>boolean;
 private readonly transport:DecodedSourceStreamTransport;
 private context?:AudioContext;
 private phase:Phase='idle';
 private position=0;
 private anchor?:{contextTime:number;seconds:number};
 private epoch=0;
 private audioEnded=false;
 private failure:string|null=null;

 constructor(options:{createContext?:()=>AudioContext;commitHeldFrame:(frame:number)=>boolean}){
  if(typeof options.commitHeldFrame!=='function')throw Error('source-frame-commit-required');
  this.commitHeldFrame=options.commitHeldFrame;
  this.transport=new DecodedSourceStreamTransport(P008_BROWSER_DECODER,{createContext:()=>{
   this.context=options.createContext?.()??new AudioContext({sampleRate:PLAN.sampleRate,latencyHint:'interactive'});
   return this.context;
  }});
 }
 private frame(){return Math.min(PLAN.lastFrame,1+Math.floor(this.position*PLAN.fps+1e-9));}
 private commit(){try{return this.commitHeldFrame(this.frame())===true;}catch{return false;}}
 private readonly contextChanged=()=>{
  if(!this.context||this.phase==='closed'||this.context.state==='running')return;
  if(this.phase==='playing')this.settle();
  if(this.phase==='start-pending'){
   this.epoch++;this.phase='paused';
   if(!this.commit()){this.phase='failed';this.failure='interrupted-frame-not-committed';}
  }
 };
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  const audio=this.transport.snapshot();
  const interrupted=['interrupted','play-rejected','closed','failed'].includes(audio.phase)||
   this.context.state!=='running';
  const time=interrupted?(audio.heldContextTime??audio.contextTime??this.context.currentTime)
   :(audio.contextTime??this.context.currentTime);
  this.position=Math.min(END_SECONDS,Math.max(0,this.anchor.seconds+
   Math.max(0,time-this.anchor.contextTime)));
  if(audio.phase==='buffer-ended'||audio.decodedSample>=PLAN.decodedSamples)this.audioEnded=true;
  if(interrupted){
   this.anchor=undefined;this.epoch++;
   this.phase=audio.phase==='closed'||this.context.state==='closed'?'closed':'paused';
   if(this.phase==='paused'&&!this.commit()){
    this.phase='failed';this.failure='interrupted-frame-not-committed';
   }
  }else if(this.position>=END_SECONDS){
   this.anchor=undefined;this.phase='timeline-ended';
   this.transport.holdSourceBoundary();
   if(!this.commit()){this.phase='failed';this.failure='terminal-frame-not-committed';}
  }
 }
 snapshot(){
  this.settle();
  const native=this.transport.snapshot();
  const active=this.position>=PLAN.audioStartSeconds&&this.position<PLAN.audioEndSeconds;
  const audioPhase=this.phase==='playing'
   ?this.position<PLAN.audioStartSeconds?'preroll':active?'playing':'postroll'
   :this.phase==='timeline-ended'?'boundary-held':this.phase==='ready'?'ready':
    native.phase==='interrupted'?'interrupted':this.phase;
  return Object.freeze({phase:this.phase,frame:this.frame(),frameDomain:PLAN.frameDomain,
   elapsedSeconds:this.position,audio:Object.freeze({phase:audioPhase,
    runId:active?'continuous-source-stream':null,
    decodedSample:active?native.decodedSample:null,
    contextTime:native.contextTime,volume:native.volume}),
   activeSegmentIndex:active?0:-1,audioEnded:this.audioEnded,
   timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
   sourceAlignment:PLAN.alignmentStatus,originalRuntimeAccepted:false,
   audioAccepted:false,lessonCompleted:false});
 }
 async prepare(input:ArrayBuffer):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return answer(false,'prepare-not-idle');
  if(!(input instanceof ArrayBuffer))return answer(false,'invalid-source-stream');
  const ticket=++this.epoch;this.phase='loading';
  const prepared=await this.transport.prepare(input);
  if(ticket!==this.epoch)return answer(false,'stale-prepare');
  if(!prepared.accepted){this.phase='failed';this.failure=prepared.reason;return prepared;}
  const held=this.transport.seekDecodedSample(PLAN.initialSeekSamples);
  if(!held.accepted){this.phase='failed';this.failure=held.reason;return held;}
  if(!this.commit()){this.phase='failed';this.failure='source-first-frame-not-committed';
   await this.transport.close();return answer(false,this.failure);}
  if(ticket!==this.epoch)return answer(false,'stale-prepare');
  this.context?.addEventListener('statechange',this.contextChanged);
  this.phase='ready';return answer(true,'continuous-source-ready');
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();
  if(!policy||!['automatic','user'].includes(policy.activation)||
   typeof policy.reducedMotion!=='boolean')return answer(false,'invalid-play-policy');
  if(policy.reducedMotion&&policy.activation==='automatic')return answer(false,'reduced-motion-hold');
  if(policy.activation!=='user')return answer(false,'explicit-user-play-required');
  if(this.phase==='playing')return answer(true,'already-playing');
  if(!['ready','paused','start-pending'].includes(this.phase)||!this.context)
   return answer(false,'not-ready');
  const ticket=++this.epoch;this.phase='start-pending';
  if(!this.commit()){this.phase='paused';return answer(false,'source-frame-not-committed');}
  if(ticket!==this.epoch)return answer(false,'stale-frame-commit');
  try{
   const slice=p008ContinuousAudioSlice(this.position);
   if(slice){
    const held=this.transport.seekDecodedSample(slice.firstDecodedSample);
    if(!held.accepted)throw Error(held.reason);
    const started=await this.transport.play({...policy,delaySeconds:slice.delaySeconds});
    if(ticket!==this.epoch)return answer(false,'stale-start');
    if(!started.accepted)throw Error(started.reason);
   }else{
    await this.context.resume();
    if(ticket!==this.epoch)return answer(false,'stale-start');
    if(this.context.state!=='running')throw Error('context-not-running');
    this.audioEnded=true;
   }
   const now=this.context.currentTime;
   this.anchor={contextTime:now,seconds:this.position};
   this.phase='playing';this.failure=null;this.settle();
   return answer(true,'continuous-source-playing');
  }catch(error){
   if(ticket!==this.epoch)return answer(false,'stale-start');
   this.anchor=undefined;this.phase='paused';
   this.failure=error instanceof Error?error.message:String(error);
   return answer(false,this.failure);
  }
 }
 pause():DecodedStreamResult{
  this.settle();
  if(!['playing','start-pending'].includes(this.phase))return answer(false,'not-playing');
  const anchor=this.anchor;this.epoch++;
  const native=this.transport.pause();
  const held=this.transport.snapshot();
  if(anchor){const time=held.heldContextTime??this.context?.currentTime??anchor.contextTime;
   this.position=Math.min(END_SECONDS,Math.max(0,anchor.seconds+time-anchor.contextTime));}
  this.anchor=undefined;this.phase='paused';
  if(!native.accepted&&held.phase!=='buffer-ended')this.audioEnded=
   held.decodedSample>=PLAN.decodedSamples;
  if(this.commit())return answer(true,'continuous-source-held');
  this.phase='failed';this.failure='paused-frame-not-committed';return answer(false,this.failure);
 }
 replay():DecodedStreamResult{
  if(!['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
   return answer(false,'not-ready');
  this.epoch++;this.transport.replay();
  const held=this.transport.seekDecodedSample(PLAN.initialSeekSamples);
  this.anchor=undefined;this.position=0;this.audioEnded=false;
  this.phase=held.accepted?'ready':'failed';this.failure=held.accepted?null:held.reason;
  if(!held.accepted)return held;
  if(this.commit())return answer(true,'continuous-source-replayed-and-held');
  this.phase='failed';this.failure='replay-frame-not-committed';return answer(false,this.failure);
 }
 seekCandidateFrame(_frame:number):DecodedStreamResult{
  return answer(false,'arbitrary-source-frame-seek-unsupported');
 }
 setVolume(value:number){return this.transport.setVolume(value);}
 async close(){
  if(this.phase==='closed')return;
  this.epoch++;this.anchor=undefined;this.phase='closed';
  this.context?.removeEventListener('statechange',this.contextChanged);
  await this.transport.close();
 }
}
