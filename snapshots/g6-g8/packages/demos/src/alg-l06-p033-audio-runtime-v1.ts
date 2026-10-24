import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,type DecodedStreamSnapshot} from './decoded-source-stream-transport';
import {P033_AUDIO_CLOCKS,P033_MEASURED_BINDINGS,type P033AudioDomain,type P033EmbeddedDomain} from './alg-l06-p033-measured-bindings-v1';
import {p033InitialState,p033Reduce,P033_BEHAVIOR_SOURCE,type P033Event,type P033State} from './alg-l06-p033-state-v1';
export type P033Transport=Pick<DecodedSourceStreamTransport,'prepare'|'play'|'pause'|'replay'|'seekDecodedSample'|'snapshot'|'setVolume'|'close'|'subscribe'>;
export interface P033RuntimeOptions {
 seed?:number;load:(id:P033AudioDomain,signal:AbortSignal)=>Promise<ArrayBuffer>;
 commit:(state:P033State)=>boolean;onSnapshot?:(snapshot:P033RuntimeSnapshot)=>void;onCleanup?:()=>void;
 makeTransport?:(binding:DecodedSourceStreamBinding,id:P033AudioDomain)=>P033Transport;
 resumeEnded?:(id:P033EmbeddedDomain)=>Promise<boolean>;
}
export interface P033RuntimeSnapshot {
 state:P033State;audio:{owner:P033AudioDomain|null;selected:DecodedStreamSnapshot|null;streams:Partial<Record<P033AudioDomain,DecodedStreamSnapshot>>};
 ready:boolean;failure:string|null;spanishSelected:boolean;spanishLoading:boolean;visualClockRunning:boolean;
 clockAuthority:'engineering-12fps-audio-context-observer';sourceFrameAlignmentAccepted:false;listeningAccepted:false;lessonCompleted:false;
}
type Anchor={id:P033EmbeddedDomain;frame:number;time:number;transportEpoch:number};
const domains=Object.keys(P033_AUDIO_CLOCKS) as P033EmbeddedDomain[];
/** Page-owned source stops and branch clocks over the existing measured PCM
 * transport. Empty terminal seek markers are retained in the source model;
 * they contain no MP3 payload and do not start another stream. */
export class P033PageRuntimeV1 {
 private state=p033InitialState();private readonly tracks=new Map<P033AudioDomain,P033Transport>();
 private readonly contexts:Partial<Record<P033AudioDomain,AudioContext>>={};
 private readonly positions=Object.fromEntries(domains.map(id=>[id,P033_AUDIO_CLOCKS[id].entryFrame])) as Record<P033EmbeddedDomain,number>;
 private readonly abort=new AbortController();private saAbort:AbortController|null=null;
 private owner:P033AudioDomain|null=null;private anchor:Anchor|null=null;private ticket=0;
 private ready=false;private started=false;private closed=false;private ticking=false;private volume=1;
 private spanishSelected=false;private spanishLoading=false;private spanishPrepared=false;private failure:string|null=null;
 private readonly unsubscribers:(()=>void)[]=[];private pendingNotification=false;
 constructor(private readonly options:P033RuntimeOptions){}
 private context(id:P033AudioDomain){return this.contexts[id]??(this.contexts[id]=new AudioContext({sampleRate:P033_MEASURED_BINDINGS[id].sampleRate,latencyHint:'interactive'}));}
 private track(id:P033AudioDomain){
  let t=this.tracks.get(id);if(t)return t;
  t=this.options.makeTransport?.(P033_MEASURED_BINDINGS[id],id)??new DecodedSourceStreamTransport(P033_MEASURED_BINDINGS[id],{createContext:()=>this.context(id)});
  t.setVolume(this.volume);this.tracks.set(id,t);
  this.unsubscribers.push(t.subscribe(()=>{
   if(this.closed||this.pendingNotification)return;this.pendingNotification=true;
   queueMicrotask(()=>{this.pendingNotification=false;if(this.closed)return;
    if(this.spanishSelected&&this.tracks.get('sa')?.snapshot().phase==='buffer-ended')this.returnMain();
    else this.publish();});
  }));return t;
 }
 snapshot():P033RuntimeSnapshot{
  const streams=Object.fromEntries([...this.tracks].map(([id,t])=>[id,t.snapshot()]));
  return {state:this.state,audio:{owner:this.owner,selected:this.owner?streams[this.owner]??null:null,streams},ready:this.ready&&!this.closed,
   failure:this.failure,spanishSelected:this.spanishSelected,spanishLoading:this.spanishLoading,visualClockRunning:!!this.anchor,
   clockAuthority:'engineering-12fps-audio-context-observer',sourceFrameAlignmentAccepted:false,listeningAccepted:false,lessonCompleted:false};
 }
 private publish(){if(!this.closed)this.options.onSnapshot?.(this.snapshot());}
 private live(ticket:number,epoch:number){return !this.closed&&ticket===this.ticket&&epoch===this.state.epoch;}
 private position(){const a=this.anchor,s=a?this.tracks.get(a.id)?.snapshot():null;
  return a&&s&&s.epoch===a.transportEpoch&&s.contextTime!==null?a.frame+Math.max(0,s.contextTime-a.time)*12:null;}
 private hold(){
  const p=this.position();if(this.anchor&&p!==null)this.positions[this.anchor.id]=p;
  this.anchor=null;this.ticket++;this.saAbort?.abort();this.saAbort=null;
  for(const t of this.tracks.values())if(['playing','start-pending'].includes(t.snapshot().phase))t.pause();
  this.owner=null;
 }
 private apply(event:P033Event){
  const r=p033Reduce(this.state,event,this.options.seed??0);if(!r.accepted)return r;
  this.state=r.state;
  if(!this.options.commit(this.state)){this.hold();this.failure='P033_SOURCE_FRAME_COMMIT_FAILED';
   const pause=p033Reduce(this.state,{type:'pause',epoch:this.state.epoch},this.options.seed??0);if(pause.accepted)this.state=pause.state;}
  this.publish();return r;
 }
 private failed(reason:string){this.hold();this.failure=reason;this.apply({type:'pause',epoch:this.state.epoch});this.publish();}
 async start(){
  if(this.started||this.closed)return false;this.started=true;
  if(!this.options.commit(this.state)){this.failed('P033_INITIAL_FRAME_COMMIT');return false;}
  try{
   const rows=await Promise.all(domains.map(async id=>[id,await this.options.load(id,this.abort.signal)] as const));
   if(this.closed)return false;
   for(const [id,b] of rows){const r=await this.track(id).prepare(b);if(this.closed)return false;if(!r.accepted)throw Error(`${id}: ${r.reason}`);
    const seek=this.track(id).seekDecodedSample(P033_AUDIO_CLOCKS[id].decodedEntrySample);if(!seek.accepted)throw Error(seek.reason);}
   this.ready=true;this.publish();return true;
  }catch(e){if(!this.closed){this.abort.abort();this.failure=String(e);this.publish();}return false;}
 }
 private seek(id:P033EmbeddedDomain,frame:number){
  const c=P033_AUDIO_CLOCKS[id],b=P033_MEASURED_BINDINGS[id];
  const sample=Math.min(b.decodedSamples,Math.ceil(c.latencySamples+Math.max(0,frame-c.firstAudioFrame)*b.sampleRate/12));
  this.positions[id]=frame;const r=this.track(id).seekDecodedSample(sample);if(!r.accepted)throw Error(r.reason);
 }
 private async playDomain(id:P033EmbeddedDomain,frame:number,restart=false){
  const ticket=++this.ticket,epoch=this.state.epoch,t=this.track(id);
  try{
   if(restart)this.seek(id,frame);else this.positions[id]=Math.max(frame,this.positions[id]);
   if(!this.options.commit(this.state))throw Error('P033_SOURCE_FRAME_COMMIT_FAILED');
   this.owner=id;const delay=Math.max(0,(P033_AUDIO_CLOCKS[id].firstAudioFrame-this.positions[id])/12);
   const result=await t.play({activation:'user',reducedMotion:false,delaySeconds:delay});
   if(!this.live(ticket,epoch)||this.spanishSelected)return;
   let s=t.snapshot();
   if(!result.accepted&&s.phase==='buffer-ended'){
    const resumed=this.options.resumeEnded?await this.options.resumeEnded(id):await this.context(id).resume().then(()=>this.context(id).state==='running');
    if(!this.live(ticket,epoch))return;if(!resumed)throw Error('P033_VISUAL_TAIL_CLOCK_UNAVAILABLE');s=t.snapshot();
   }else if(!result.accepted)throw Error(result.reason);
   if(s.contextTime===null)throw Error('P033_AUDIO_CONTEXT_UNAVAILABLE');
   this.anchor={id,frame:this.positions[id],time:s.playbackAnchor?s.playbackAnchor.contextTime-delay:s.contextTime,transportEpoch:s.epoch};
   this.failure=null;this.publish();
  }catch(e){if(this.live(ticket,epoch))this.failed(String(e));}
 }
 play(){
  if(this.spanishSelected){void this.startSpanish();return false;}
  if(!this.ready||this.closed)return false;
  this.failure=null;const r=this.apply({type:'play',epoch:this.state.epoch});if(!r.accepted||this.failure)return false;
  const f=this.state.feedback;void this.playDomain(f?String(f.spriteId) as P033EmbeddedDomain:'main',f?.frame??this.state.mainFrame);return true;
 }
 pause(){
  if(this.closed)return false;this.tick();this.hold();this.spanishLoading=false;
  const r=this.apply({type:'pause',epoch:this.state.epoch});this.publish();return r.accepted||this.spanishSelected;
 }
 choose(answer:1|2|3|4){
  if(!this.ready||this.closed||this.spanishSelected)return false;this.tick();
  if(!this.apply({type:'choose',answer,epoch:this.state.epoch}).accepted)return false;
  this.hold();if(!this.apply({type:'resolve-host-feedback',epoch:this.state.epoch}).accepted)return false;
  const f=this.state.feedback!;void this.playDomain(String(f.spriteId) as P033EmbeddedDomain,f.frame,true);return true;
 }
 closeWrong(generation:number){
  if(!this.ready||this.closed||this.spanishSelected)return false;this.tick();
  if(!this.apply({type:'close-wrong',generation,epoch:this.state.epoch}).accepted)return false;
  this.hold();const f=this.state.feedback!;void this.playDomain(String(f.spriteId) as P033EmbeddedDomain,f.frame,true);return true;
 }
 tick(){
  if(this.closed||this.ticking||this.spanishSelected||!this.anchor)return;this.ticking=true;
  try{
   const a=this.anchor,s=this.track(a.id).snapshot();
   if(s.epoch!==a.transportEpoch||!['playing','buffer-ended'].includes(s.phase)){this.failed('P033_AUDIO_CLOCK_INTERRUPTED');return;}
   const p=this.position();if(p===null)return;const frame=Math.floor(p+1e-8),before=this.state;
   if(a.id==='main'){
    const last=before.phase==='prequiz'?52:385,target=Math.min(last,frame);
    if(target>before.mainFrame)this.apply({type:'advance-main',frame:target,epoch:before.epoch});
    if(!this.state.mainTimelinePlaying){this.hold();this.seek('main',this.state.mainFrame);}
   }else{
    const f=before.feedback;if(!f)return;
    const b=P033_BEHAVIOR_SOURCE.binding.branches.find(b=>b.spriteId===f.spriteId)!;
    const last=b.kind==='wrong'&&!f.closeRequested?b.hold:b.terminal,target=Math.min(last,frame);
    if(target>f.frame)this.apply({type:'advance-feedback',frame:target,generation:f.generation,epoch:before.epoch});
    if(!this.state.feedback){this.hold();this.track(a.id).replay();this.positions[a.id]=2;
     if(this.state.phase==='postquiz-resume')void this.playDomain('main',52,true);
    }else if(!this.state.feedback.playing){this.hold();this.seek(a.id,this.state.feedback.frame);}
   }
   this.publish();
  }finally{this.ticking=false;}
 }
 replay(){
  if(this.closed)return false;this.hold();this.spanishSelected=false;this.spanishLoading=false;this.failure=null;
  for(const id of domains){const t=this.tracks.get(id);if(t&&this.ready){t.replay();this.seek(id,P033_AUDIO_CLOCKS[id].entryFrame);}else this.positions[id]=P033_AUDIO_CLOCKS[id].entryFrame;}
  this.tracks.get('sa')?.replay();return this.apply({type:'replay',epoch:this.state.epoch}).accepted;
 }
 async startSpanish(){
  if(!this.ready||this.closed||this.spanishLoading)return false;this.tick();
  if(!this.spanishSelected){this.pause();this.spanishSelected=true;}
  const ticket=++this.ticket,epoch=this.state.epoch,controller=new AbortController();this.saAbort=controller;
  this.spanishLoading=true;this.publish();
  try{
   if(!this.options.makeTransport)await this.context('sa').resume();if(!this.live(ticket,epoch))return false;
   const t=this.track('sa');
   if(!this.spanishPrepared){const bytes=await this.options.load('sa',controller.signal);if(!this.live(ticket,epoch)||controller.signal.aborted)return false;
    const r=await t.prepare(bytes);if(!this.live(ticket,epoch)||controller.signal.aborted)return false;if(!r.accepted)throw Error(r.reason);this.spanishPrepared=true;}
   if(t.snapshot().phase==='buffer-ended')t.replay();this.owner='sa';
   const r=await t.play({activation:'user',reducedMotion:false});if(!this.live(ticket,epoch))return false;
   this.spanishLoading=false;this.failure=r.accepted?null:r.reason;this.publish();return r.accepted;
  }catch(e){if(this.live(ticket,epoch)){this.spanishLoading=false;this.failure=String(e);this.publish();}return false;}
 }
 returnMain(){if(this.closed||!this.spanishSelected)return false;this.hold();this.tracks.get('sa')?.replay();this.spanishSelected=false;this.spanishLoading=false;this.publish();return true;}
 setVolume(value:number){if(this.closed||!Number.isFinite(value)||value<0||value>1)return false;this.volume=value;for(const t of this.tracks.values())t.setVolume(value);return true;}
 async close(){
  if(this.closed)return;this.hold();this.apply({type:'leave',epoch:this.state.epoch});this.closed=true;this.ready=false;this.abort.abort();this.saAbort?.abort();
  for(const off of this.unsubscribers)off();await Promise.all([...this.tracks.values()].map(t=>t.close()));
  await Promise.all(Object.values(this.contexts).filter(c=>c.state!=='closed').map(c=>c.close()));this.options.onCleanup?.();
 }
}
