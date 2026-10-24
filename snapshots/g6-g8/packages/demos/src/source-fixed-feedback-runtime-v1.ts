import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {SourceAudioOwnerV1,type SourceAudioId,type SourceTransportV1,type SourceAudioSnapshotV1} from './source-stream-audio-owner-v1';
import type {FixedQuizState,FixedQuizEvent,FixedQuizTransition} from './source-fixed-feedback-quiz-v1';

type Domain=Exclude<SourceAudioId,'sa'>;
type Anchor={domain:Domain;position:number;time:number;audioEpoch:number};
const domains:Domain[]=['main','wrong4','right4'];
// These are source SoundStreamBlock onset frames, not decoder sample seeks.
export type FixedQuizTransportV1=SourceTransportV1 & Partial<Pick<DecodedSourceStreamTransport,'seekDecodedSample'>>;
export interface FixedQuizRuntimeBinding {
 initialState:()=>FixedQuizState;reduce:(state:FixedQuizState,event:FixedQuizEvent)=>FixedQuizTransition;
 measured:Readonly<Record<SourceAudioId,DecodedSourceStreamBinding>>;
 firstAudioFrame:Readonly<Record<Domain,number>>;
 decodedEntrySamples?:Readonly<Partial<Record<Domain,number>>>;
 quizFrame:number;lastFrame:number;wrongHoldFrame:number;wrongTerminalFrame:number;rightTerminalFrame:number;
}
export interface FixedQuizRuntimeSnapshot {
 state:FixedQuizState;audio:SourceAudioSnapshotV1;ready:boolean;failure:string|null;
 spanishSelected:boolean;spanishLoading:boolean;visualClockRunning:boolean;
 clockAuthority:'engineering-12fps-audio-context-observer';
 sourceFrameAlignmentAccepted:false;listeningAccepted:false;lessonCompleted:false;
}
export interface FixedQuizRuntimeOptions {
 load:(id:SourceAudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;
 onSnapshot?:(snapshot:FixedQuizRuntimeSnapshot)=>void;
 onGlossary?:(term:string)=>void;onCleanup?:()=>void;
 makeTransport?:(binding:DecodedSourceStreamBinding,id:SourceAudioId)=>FixedQuizTransportV1;
 resumeEnded?:(id:Domain)=>Promise<boolean>;
}

/** Maintained fixed-feedback clock from the actual P048/P049 source contracts.
 * Each binding supplies its source stops, stream onsets and measured audio.
 * Main, wrong4 and right4 keep distinct cursors. SA never advances these clocks.
 * P048's admitted implementation remains frozen and is a differential reference. */
export class FixedQuizPageRuntimeV1 {
 private state:FixedQuizState;
 private readonly audio:SourceAudioOwnerV1;
 private readonly contexts:Partial<Record<SourceAudioId,AudioContext>>={};
 private readonly buffers:Partial<Record<SourceAudioId,ArrayBuffer>>={};
 private readonly abort=new AbortController();
 private readonly positions:Record<Domain,number>={main:1,wrong4:2,right4:2};
 private anchor:Anchor|null=null;
 private ready=false;private started=false;private closed=false;private ticking=false;
 private generation=0;private spanishSelected=false;private spanishLoading=false;
 private failure:string|null=null;
 constructor(private readonly binding:FixedQuizRuntimeBinding,private readonly options:FixedQuizRuntimeOptions){
  this.state=binding.initialState();
  for(const value of [binding.quizFrame,binding.lastFrame,binding.wrongHoldFrame,binding.wrongTerminalFrame,binding.rightTerminalFrame,...Object.values(binding.firstAudioFrame)])
   if(!Number.isSafeInteger(value)||value<1)throw Error('FIXED_QUIZ_CLOCK_SOURCE_CONTRACT');
  if(binding.lastFrame<=binding.quizFrame||binding.wrongTerminalFrame<=binding.wrongHoldFrame)throw Error('FIXED_QUIZ_CLOCK_STOP_ORDER');
  for(const id of domains){const cue=binding.decodedEntrySamples?.[id]??0;
   if(!Number.isSafeInteger(cue)||cue<0||cue>=binding.measured[id].decodedSamples)throw Error('FIXED_QUIZ_DECODED_ENTRY_RANGE');}
  this.audio=new SourceAudioOwnerV1(binding.measured,()=>this.state.epoch,(binding,id)=>{
   const track=options.makeTransport?.(binding,id)??new DecodedSourceStreamTransport(binding,{createContext:()=>this.context(id)});
   const cue=id==='sa'?0:this.binding.decodedEntrySamples?.[id]??0;
   const entry=()=>cue===0?{accepted:true,reason:'source begins at decoded zero'}:
    track.seekDecodedSample?.(cue)??{accepted:false,reason:'source-bound decoder cue unavailable'};
   return {prepare:async bytes=>{const r=await track.prepare(bytes);return r.accepted?entry():r;},pause:()=>track.pause(),
    replay:()=>{const r=track.replay();return r.accepted?entry():r;},
    snapshot:()=>track.snapshot(),setVolume:value=>track.setVolume(value),close:()=>track.close(),
    play:policy=>track.play({...policy,delaySeconds:id==='sa'?0:Math.max(0,(this.binding.firstAudioFrame[id]-this.positions[id])/12)})};
  });
 }
 private context(id:SourceAudioId){return this.contexts[id]??(this.contexts[id]=new AudioContext({sampleRate:this.binding.measured[id].sampleRate,latencyHint:'interactive'}));}
 snapshot():FixedQuizRuntimeSnapshot{return {state:this.state,audio:this.audio.snapshot(),ready:this.ready&&!this.closed,
  failure:this.failure,spanishSelected:this.spanishSelected,spanishLoading:this.spanishLoading,visualClockRunning:!!this.anchor,
  clockAuthority:'engineering-12fps-audio-context-observer',sourceFrameAlignmentAccepted:false,listeningAccepted:false,lessonCompleted:false};}
 private publish(){if(!this.closed)this.options.onSnapshot?.(this.snapshot());}
 private position(){
  const a=this.anchor,s=this.audio.snapshot().selected;
  return a&&s?.contextTime!==null&&s?.contextTime!==undefined&&s.epoch===a.audioEpoch?
   a.position+Math.max(0,s.contextTime-a.time)*12:null;
 }
 private hold(){
  if(this.anchor){const p=this.position();if(p!==null)this.positions[this.anchor.domain]=p;}
  this.anchor=null;this.generation++;this.audio.cancelCurrent(this.state.epoch);
 }
 async start(){
  if(this.started||this.closed)return false;this.started=true;
  try{
   const rows=await Promise.all(domains.map(async id=>[id,await this.options.load(id,this.abort.signal)] as const));
   if(this.closed)return false;
   for(const [id,bytes] of rows){
    this.buffers[id]=bytes;
    const r=await this.audio.select(id,this.state.epoch,async()=>bytes);
    if(this.closed)return false;if(!r.accepted)throw Error(`${id}: ${r.reason}`);
   }
   this.audio.cancelCurrent(this.state.epoch);this.ready=true;this.publish();return true;
  }catch(e){if(!this.closed){this.failure=String(e);this.publish();}return false;}
 }
 private live(ticket:number,epoch:number){return !this.closed&&ticket===this.generation&&epoch===this.state.epoch;}
 private failed(reason:string){
  this.failure=reason;this.hold();
  const t=this.binding.reduce(this.state,{type:'pause-clock',epoch:this.state.epoch});if(t.accepted)this.state=t.state;
  this.publish();
 }
 private async playDomain(id:Domain,frame:number,activation:'user'|'automatic',restart:boolean){
  const ticket=++this.generation,epoch=this.state.epoch,owner=this.state.audioOwner;
  this.positions[id]=restart?frame:Math.max(frame,this.positions[id]);
  try{
   if(restart){
    const result=await this.audio.select(id,epoch,async()=>this.buffers[id]!);
    if(!this.live(ticket,epoch))return;
    if(!result.accepted){this.failed(result.reason);return;}
   }
   const result=await this.audio.activatePrepared(id,epoch,activation);
   if(!this.live(ticket,epoch)||this.state.audioOwner!==owner||this.spanishSelected)return;
   let s=this.audio.snapshot().selected;
   if(!result.accepted&&s?.phase==='buffer-ended'){
    const resumed=this.options.resumeEnded?await this.options.resumeEnded(id):
      await this.context(id).resume().then(()=>this.context(id).state==='running');
    if(!this.live(ticket,epoch))return;
    if(!resumed){this.failed('visual tail clock unavailable');return;}
    s=this.audio.snapshot().selected;
   }else if(!result.accepted){this.failed(result.reason);return;}
   if(s?.contextTime===null||s?.contextTime===undefined){this.failed('audio context missing');return;}
   const delay=Math.max(0,(this.binding.firstAudioFrame[id]-this.positions[id])/12);
   this.anchor={domain:id,position:this.positions[id],time:s.playbackAnchor?s.playbackAnchor.contextTime-delay:s.contextTime,audioEpoch:s.epoch};
   this.failure=null;this.publish();
  }catch(e){if(this.live(ticket,epoch))this.failed(String(e));}
 }
 private apply(event:FixedQuizEvent,activation:'user'|'automatic'):FixedQuizTransition {
  const t=this.binding.reduce(this.state,event);if(!t.accepted)return t;
  if(t.effects.some(e=>e.type==='audio:cancelAll')){
   const priorDomain=this.anchor?.domain;
   this.hold();
   // A late observer cannot advance a stopped source timeline beyond its stop.
   if(event.type==='advance-main')this.positions.main=t.state.mainFrame;
   if(event.type==='advance-feedback'&&priorDomain&&priorDomain!=='main')
    this.positions[priorDomain]=t.state.feedback?.frame??(priorDomain==='right4'?this.binding.rightTerminalFrame:this.binding.wrongTerminalFrame);
  }
  this.state=t.state;this.audio.syncStateEpoch(this.state.epoch);
  if(event.type==='replay'){
   this.positions.main=1;this.positions.wrong4=2;this.positions.right4=2;
   this.spanishSelected=false;this.spanishLoading=false;this.failure=null;
   this.audio.replay(this.state.epoch);
  }
  for(const e of t.effects){
   if(e.type==='audio:intent')void this.playDomain(e.stream as Domain,e.frame as number,activation,event.type==='choose');
   else if(e.type==='host:DoHyperLinks')this.options.onGlossary?.(String(e.keyAttribute));
   else if(e.type==='host:cleanup')this.options.onCleanup?.();
  }
  this.publish();return t;
 }
 send(event:FixedQuizEvent):FixedQuizTransition {
  if(this.closed||(!this.ready&&!['leave','replay','pause-clock'].includes(event.type))||
    (this.spanishSelected&&!['leave','replay'].includes(event.type)))
   return {accepted:false,reason:'page unavailable or Spanish Audio selected',state:this.state,effects:[]};
  this.tick();return this.apply(event,'user');
 }
 play(){
  if(this.spanishSelected){void this.resumeSpanish();return;}
  this.send({type:this.state.mainFrame===1&&!this.state.paused?'start-main':'resume-clock',epoch:this.state.epoch});
 }
 pause(){
  if(this.spanishSelected){this.generation++;this.audio.pause();this.publish();return;}
  this.send({type:'pause-clock',epoch:this.state.epoch});
 }
 replay(){return this.send({type:'replay',epoch:this.state.epoch}).accepted;}
 tick(){
  if(this.closed||this.ticking||!this.anchor)return;
  this.ticking=true;
  try{
   const a=this.anchor,s=this.audio.snapshot().selected;
   if(s?.epoch!==a.audioEpoch||!['playing','buffer-ended'].includes(s.phase)){
    this.failed('audio clock interrupted');return;
   }
   const p=this.position();if(p===null)return;
   const state=this.state;
   const limit=a.domain==='main'?(state.phase==='prequiz'?this.binding.quizFrame:this.binding.lastFrame):
    a.domain==='right4'?this.binding.rightTerminalFrame:state.phase==='wrong-feedback-playing'?this.binding.wrongHoldFrame:this.binding.wrongTerminalFrame;
   const frame=Math.min(limit,Math.floor(p+1e-8));
   if(a.domain==='main'&&frame>state.mainFrame)this.apply({type:'advance-main',frame,epoch:state.epoch},'automatic');
   else if(a.domain!=='main'&&state.feedback&&frame>state.feedback.frame)
    this.apply({type:'advance-feedback',frame,token:state.feedback.token,epoch:state.epoch},'automatic');
  }finally{this.ticking=false;}
 }
 async startSpanish(){
  if(!this.ready||this.closed||this.spanishLoading||this.state.phase==='host-glossary')return false;
  this.tick();
  if(!this.spanishSelected){
   const pause=this.binding.reduce(this.state,{type:'pause-clock',epoch:this.state.epoch});
   this.hold();if(pause.accepted)this.state=pause.state;
   this.spanishSelected=true;
  }
  const ticket=++this.generation,epoch=this.state.epoch;this.spanishLoading=true;this.publish();
  try{
   // Unlock only on this explicit Spanish Audio action; locale never calls here.
   if(!this.options.makeTransport)await this.context('sa').resume();
   if(!this.live(ticket,epoch)||!this.spanishSelected)return false;
   const selected=await this.audio.select('sa',epoch,async signal=>{
    return this.buffers.sa??(this.buffers.sa=await this.options.load('sa',signal));
   });
   if(!this.live(ticket,epoch)||!this.spanishSelected)return false;
   if(!selected.accepted)throw Error(selected.reason);
   const result=await this.audio.play(epoch,'user');
   if(!this.live(ticket,epoch))return false;
   this.spanishLoading=false;if(!result.accepted)this.failure=result.reason;
   this.publish();return result.accepted;
  }catch(e){if(this.live(ticket,epoch)){this.spanishLoading=false;this.failure=String(e);this.publish();}return false;}
 }
 private async resumeSpanish(){
  if(this.audio.snapshot().spanish?.phase==='buffer-ended')return this.startSpanish();
  const ticket=++this.generation,epoch=this.state.epoch;
  const result=await this.audio.play(epoch,'user');
  if(this.live(ticket,epoch)&&!result.accepted)this.failure=result.reason;
  this.publish();return result.accepted;
 }
 returnMain(){
  if(!this.spanishSelected||this.closed)return false;
  this.hold();this.spanishSelected=false;this.spanishLoading=false;this.publish();return true;
 }
 setVolume(volume:number){const r=this.audio.setVolume(volume);this.publish();return r;}
 async close(){
  if(this.closed)return;
  this.apply({type:'leave',epoch:this.state.epoch},'automatic');this.closed=true;this.ready=false;this.abort.abort();
  await this.audio.close();
  await Promise.all(Object.values(this.contexts).filter(c=>c.state!=='closed').map(c=>c.close()));
 }
}
