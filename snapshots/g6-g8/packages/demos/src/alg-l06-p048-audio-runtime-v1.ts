import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P048AudioOwnerV1} from './alg-l06-p048-audio-owner-v1';
import {P048_MEASURED_BINDINGS} from './alg-l06-p048-measured-bindings-v1';
import type {SourceAudioId,SourceTransportV1,SourceAudioSnapshotV1} from './source-stream-audio-owner-v1';
import {initialP048State,reduceP048,type P048State,type P048Event,type P048Transition} from './alg-l06-p048-state-v1';

type Domain=Exclude<SourceAudioId,'sa'>;
type Anchor={domain:Domain;position:number;time:number;audioEpoch:number};
const domains:Domain[]=['main','wrong4','right4'];
// These are source SoundStreamBlock onset frames, not decoder sample seeks.
const firstAudioFrame:Record<Domain,number>={main:12,wrong4:3,right4:2};
export interface P048RuntimeSnapshot {
 state:P048State;audio:SourceAudioSnapshotV1;ready:boolean;failure:string|null;
 spanishSelected:boolean;spanishLoading:boolean;visualClockRunning:boolean;
 clockAuthority:'engineering-12fps-audio-context-observer';
 sourceFrameAlignmentAccepted:false;listeningAccepted:false;lessonCompleted:false;
}
export interface P048RuntimeOptions {
 load:(id:SourceAudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;
 onSnapshot?:(snapshot:P048RuntimeSnapshot)=>void;
 onGlossary?:(term:string)=>void;onCleanup?:()=>void;
 makeTransport?:(binding:DecodedSourceStreamBinding,id:SourceAudioId)=>SourceTransportV1;
 resumeEnded?:(id:Domain)=>Promise<boolean>;
}

/** P048 keeps its authored single-stream/feedback clocks page-owned. The shared
 * owner and decoded transport enforce exclusivity, hashes and stale-load cleanup.
 * Main, wrong4 and right4 keep distinct cursors. SA never advances these clocks. */
export class P048PageRuntimeV1 {
 private state=initialP048State();
 private readonly audio:P048AudioOwnerV1;
 private readonly contexts:Partial<Record<SourceAudioId,AudioContext>>={};
 private readonly buffers:Partial<Record<SourceAudioId,ArrayBuffer>>={};
 private readonly abort=new AbortController();
 private readonly positions:Record<Domain,number>={main:1,wrong4:2,right4:2};
 private anchor:Anchor|null=null;
 private ready=false;private started=false;private closed=false;private ticking=false;
 private generation=0;private spanishSelected=false;private spanishLoading=false;
 private failure:string|null=null;
 constructor(private readonly options:P048RuntimeOptions){
  this.audio=new P048AudioOwnerV1(()=>this.state.epoch,(binding,id)=>{
   const track=options.makeTransport?.(binding,id)??new DecodedSourceStreamTransport(binding,{createContext:()=>this.context(id)});
   return {prepare:bytes=>track.prepare(bytes),pause:()=>track.pause(),replay:()=>track.replay(),
    snapshot:()=>track.snapshot(),setVolume:value=>track.setVolume(value),close:()=>track.close(),
    play:policy=>track.play({...policy,delaySeconds:id==='sa'?0:Math.max(0,(firstAudioFrame[id]-this.positions[id])/12)})};
  });
 }
 private context(id:SourceAudioId){return this.contexts[id]??(this.contexts[id]=new AudioContext({sampleRate:P048_MEASURED_BINDINGS[id].sampleRate,latencyHint:'interactive'}));}
 snapshot():P048RuntimeSnapshot{return {state:this.state,audio:this.audio.snapshot(),ready:this.ready&&!this.closed,
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
  const t=reduceP048(this.state,{type:'pause-clock',epoch:this.state.epoch});if(t.accepted)this.state=t.state;
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
   const delay=Math.max(0,(firstAudioFrame[id]-this.positions[id])/12);
   this.anchor={domain:id,position:this.positions[id],time:s.playbackAnchor?s.playbackAnchor.contextTime-delay:s.contextTime,audioEpoch:s.epoch};
   this.failure=null;this.publish();
  }catch(e){if(this.live(ticket,epoch))this.failed(String(e));}
 }
 private apply(event:P048Event,activation:'user'|'automatic'):P048Transition {
  const t=reduceP048(this.state,event);if(!t.accepted)return t;
  if(t.effects.some(e=>e.type==='audio:cancelAll')){
   const priorDomain=this.anchor?.domain;
   this.hold();
   // A late observer cannot advance a stopped source timeline beyond its stop.
   if(event.type==='advance-main')this.positions.main=t.state.mainFrame;
   if(event.type==='advance-feedback'&&priorDomain&&priorDomain!=='main')
    this.positions[priorDomain]=t.state.feedback?.frame??(priorDomain==='right4'?25:31);
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
 send(event:P048Event):P048Transition {
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
   const limit=a.domain==='main'?(state.phase==='prequiz'?224:327):
    a.domain==='right4'?25:state.phase==='wrong-feedback-playing'?22:31;
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
   const pause=reduceP048(this.state,{type:'pause-clock',epoch:this.state.epoch});
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
