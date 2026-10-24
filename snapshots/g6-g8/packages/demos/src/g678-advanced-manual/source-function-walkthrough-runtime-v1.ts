import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,type DecodedStreamSnapshot} from '../decoded-source-stream-transport';
import {createFunctionWalkthroughReducer,type FunctionWalkthroughConfig,type WalkthroughState,type WalkthroughEvent,type WalkthroughChoice} from './source-function-walkthrough-state-v1';
export type WalkthroughAudioDomain=string;
export type WalkthroughEmbeddedDomain=string;
export interface WalkthroughAudioClock {
 readonly entryFrame:number;readonly firstAudioFrame:number;readonly decodedEntrySample:number;
 readonly latencySamples:number;readonly decodedSamplesPerFrame:number;
}
export type WalkthroughTransport=Pick<DecodedSourceStreamTransport,'prepare'|'play'|'pause'|'replay'|'seekDecodedSample'|'snapshot'|'setVolume'|'close'|'subscribe'>;
export interface WalkthroughRuntimeOptions {
 seed?:number;load:(id:WalkthroughAudioDomain,signal:AbortSignal)=>Promise<ArrayBuffer>;
 commit:(state:WalkthroughState)=>boolean;onSnapshot?:(snapshot:WalkthroughRuntimeSnapshot)=>void;onCleanup?:()=>void;
 makeTransport?:(binding:DecodedSourceStreamBinding,id:WalkthroughAudioDomain)=>WalkthroughTransport;
 resumeClock?:(id:WalkthroughEmbeddedDomain)=>Promise<boolean>;
}
export interface WalkthroughRuntimeSnapshot {
 state:WalkthroughState;audio:{owner:WalkthroughAudioDomain|null;selected:DecodedStreamSnapshot|null;streams:Partial<Record<WalkthroughAudioDomain,DecodedStreamSnapshot>>};
 ready:boolean;failure:string|null;spanishSelected:boolean;spanishLoading:boolean;visualClockRunning:boolean;
 clockAuthority:'engineering-12fps-audio-context-observer';sourceFrameAlignmentAccepted:false;listeningAccepted:false;lessonCompleted:false;
}
type Anchor={kind:'audio'|'box';id:WalkthroughEmbeddedDomain;frame:number;time:number;transportEpoch:number};
export function createFunctionWalkthroughRuntime(config:{behavior:FunctionWalkthroughConfig;measured:Readonly<Record<string,DecodedSourceStreamBinding>>;clocks:Readonly<Record<string,WalkthroughAudioClock>>}){
const {behavior,measured,clocks}=config;
const {initialState:walkthroughInitialState,reduce:walkthroughReduce}=createFunctionWalkthroughReducer(behavior);
const domains=Object.keys(clocks) as WalkthroughEmbeddedDomain[];
/** Page-owned walkthrough, silent box and feedback clocks over existing measured PCM
 * transport. Empty terminal seek markers are retained in the source model;
 * they contain no MP3 payload and do not start another stream. */
class WalkthroughPageRuntimeV1 {
 private state=walkthroughInitialState();private readonly tracks=new Map<WalkthroughAudioDomain,WalkthroughTransport>();
 private readonly contexts:Partial<Record<WalkthroughAudioDomain,AudioContext>>={};
 private readonly positions=Object.fromEntries(domains.map(id=>[id,clocks[id].entryFrame])) as Record<WalkthroughEmbeddedDomain,number>;
 private readonly abort=new AbortController();private saAbort:AbortController|null=null;
 private boxPosition=1;
 private owner:WalkthroughAudioDomain|null=null;private anchor:Anchor|null=null;private ticket=0;
 private ready=false;private started=false;private closed=false;private ticking=false;private volume=1;
 private spanishSelected=false;private spanishLoading=false;private spanishPrepared=false;private failure:string|null=null;
 private readonly unsubscribers:(()=>void)[]=[];private pendingNotification=false;
 constructor(private readonly options:WalkthroughRuntimeOptions){}
 private context(id:WalkthroughAudioDomain){return this.contexts[id]??(this.contexts[id]=new AudioContext({sampleRate:measured[id].sampleRate,latencyHint:'interactive'}));}
 private track(id:WalkthroughAudioDomain){
  let t=this.tracks.get(id);if(t)return t;
  t=this.options.makeTransport?.(measured[id],id)??new DecodedSourceStreamTransport(measured[id],{createContext:()=>this.context(id)});
  t.setVolume(this.volume);this.tracks.set(id,t);
  this.unsubscribers.push(t.subscribe(()=>{
   if(this.closed||this.pendingNotification)return;this.pendingNotification=true;
   queueMicrotask(()=>{this.pendingNotification=false;if(this.closed)return;
    if(this.spanishSelected&&this.tracks.get('sa')?.snapshot().phase==='buffer-ended')this.returnMain();
    else this.publish();});
  }));return t;
 }
 snapshot():WalkthroughRuntimeSnapshot{
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
  const p=this.position();if(this.anchor&&p!==null){if(this.anchor.kind==='box')this.boxPosition=p;else this.positions[this.anchor.id]=p;}
  this.anchor=null;this.ticket++;this.saAbort?.abort();this.saAbort=null;
  for(const t of this.tracks.values())if(['playing','start-pending'].includes(t.snapshot().phase))t.pause();
  this.owner=null;
 }
 private apply(event:WalkthroughEvent){
  const r=walkthroughReduce(this.state,event,this.options.seed??0);if(!r.accepted)return r;
  this.state=r.state;
  if(!this.options.commit(this.state)){this.hold();this.failure='Walkthrough_SOURCE_FRAME_COMMIT_FAILED';
   const pause=walkthroughReduce(this.state,{type:'pause',epoch:this.state.epoch},this.options.seed??0);if(pause.accepted)this.state=pause.state;}
  this.publish();return r;
 }
 private failed(reason:string){this.hold();this.failure=reason;this.apply({type:'pause',epoch:this.state.epoch});this.publish();}
 async start(){
  if(this.started||this.closed)return false;this.started=true;
  if(!this.options.commit(this.state)){this.failed('Walkthrough_INITIAL_FRAME_COMMIT');return false;}
  try{
   const rows=await Promise.all(domains.map(async id=>[id,await this.options.load(id,this.abort.signal)] as const));
   if(this.closed)return false;
   for(const [id,b] of rows){const r=await this.track(id).prepare(b);if(this.closed)return false;if(!r.accepted)throw Error(`${id}: ${r.reason}`);
    const seek=this.track(id).seekDecodedSample(clocks[id].decodedEntrySample);if(!seek.accepted)throw Error(seek.reason);}
   this.ready=true;this.publish();return true;
  }catch(e){if(!this.closed){this.abort.abort();this.failure=String(e);this.publish();}return false;}
 }
 private seek(id:WalkthroughEmbeddedDomain,frame:number){
  const c=clocks[id],b=measured[id];
  const sample=Math.min(b.decodedSamples,Math.ceil(c.latencySamples+Math.max(0,frame-c.firstAudioFrame)*c.decodedSamplesPerFrame));
  this.positions[id]=frame;const r=this.track(id).seekDecodedSample(sample);if(!r.accepted)throw Error(r.reason);
 }
 private async playDomain(id:WalkthroughEmbeddedDomain,frame:number,restart=false){
  const ticket=++this.ticket,epoch=this.state.epoch,t=this.track(id);
  try{
   if(restart)this.seek(id,frame);else this.positions[id]=Math.max(frame,this.positions[id]);
   if(!this.options.commit(this.state))throw Error('Walkthrough_SOURCE_FRAME_COMMIT_FAILED');
   this.owner=id;const delay=Math.max(0,(clocks[id].firstAudioFrame-this.positions[id])/12);
   const result=await t.play({activation:'user',reducedMotion:false,delaySeconds:delay});
   if(!this.live(ticket,epoch)||this.spanishSelected)return;
   let s=t.snapshot();
   if(!result.accepted&&s.phase==='buffer-ended'){
    const resumed=this.options.resumeClock?await this.options.resumeClock(id):await this.context(id).resume().then(()=>this.context(id).state==='running');
    if(!this.live(ticket,epoch))return;if(!resumed)throw Error('Walkthrough_VISUAL_TAIL_CLOCK_UNAVAILABLE');s=t.snapshot();
   }else if(!result.accepted)throw Error(result.reason);
   if(s.contextTime===null)throw Error('Walkthrough_AUDIO_CONTEXT_UNAVAILABLE');
   this.anchor={kind:'audio',id,frame:this.positions[id],time:s.playbackAnchor?s.playbackAnchor.contextTime-delay:s.contextTime,transportEpoch:s.epoch};
   this.failure=null;this.publish();
  }catch(e){if(this.live(ticket,epoch))this.failed(String(e));}
 }
 private async playBox(restart=false){
  const box=this.state.stepBox;if(!box?.playing)return;
  if(restart)this.boxPosition=box.frame;
  const ticket=++this.ticket,epoch=this.state.epoch;
  try{
   // A box is silent. Reuse the already prepared main AudioContext clock without
   // calling main.play(), so opening/closing never restarts source narration.
   const resumed=this.options.resumeClock?await this.options.resumeClock('main'):
    await this.context('main').resume().then(()=>this.context('main').state==='running');
   if(!this.live(ticket,epoch)||this.spanishSelected)return;
   const s=this.track('main').snapshot();if(!resumed||s.contextTime===null)throw Error('Walkthrough_BOX_CLOCK_UNAVAILABLE');
   this.anchor={kind:'box',id:'main',frame:this.boxPosition,time:s.contextTime,transportEpoch:s.epoch};
   this.owner=null;this.failure=null;this.publish();
  }catch(e){if(this.live(ticket,epoch))this.failed(String(e));}
 }
 private resumeActive(restart=false){
  if(this.state.stepBox?.playing)void this.playBox(restart);
  else if(this.state.feedback?.playing){const f=this.state.feedback;void this.playDomain(String(f.spriteId) as WalkthroughEmbeddedDomain,f.frame,restart);}
  else if(this.state.mainPlaying)void this.playDomain('main',this.state.mainFrame,restart);
 }
 play(){
  if(this.spanishSelected){void this.startSpanish();return false;}
  if(!this.ready||this.closed)return false;
  this.failure=null;const r=this.apply({type:'play',epoch:this.state.epoch});if(!r.accepted||this.failure)return false;
  this.resumeActive();return true;
 }
 pause(){
  if(this.closed)return false;this.tick();this.hold();this.spanishLoading=false;
  const r=this.apply({type:'pause',epoch:this.state.epoch});this.publish();return r.accepted||this.spanishSelected;
 }
 private control(type:'step-click'|'continue-step'|'close-box'|'open-help'|'close-help'){
  if(!this.ready||this.closed||this.spanishSelected)return false;this.tick();
  if(!this.apply({type,epoch:this.state.epoch}).accepted||this.failure)return false;
  this.hold();this.resumeActive(true);return true;
 }
 stepClick(){return this.control('step-click');}
 continueStep(){return this.control('continue-step');}
 closeBox(){return this.control('close-box');}
 openHelp(){return this.control('open-help');}
 closeHelp(){return this.control('close-help');}
 glossary(buttonId:number,ownerSpriteId:number){
  if(!this.ready||this.closed||this.spanishSelected)return false;this.tick();
  if(!this.apply({type:'glossary',buttonId,ownerSpriteId,epoch:this.state.epoch}).accepted)return false;
  this.hold();this.publish();return true;
 }
 closeGlossary(){return !this.closed&&this.apply({type:'close-glossary',epoch:this.state.epoch}).accepted;}
 choose(choice:WalkthroughChoice){
  if(!this.ready||this.closed||this.spanishSelected)return false;this.tick();
  if(!this.apply({type:'choose',choice,epoch:this.state.epoch}).accepted)return false;
  this.hold();if(!this.apply({type:'resolve-host-feedback',epoch:this.state.epoch}).accepted||this.failure)return false;
  this.resumeActive(true);return true;
 }
 tick(){
  if(this.closed||this.ticking||this.spanishSelected||!this.anchor)return;this.ticking=true;
  try{
   const a=this.anchor,s=this.track(a.id).snapshot();
   if(s.epoch!==a.transportEpoch||a.kind==='audio'&&!['playing','buffer-ended'].includes(s.phase)){
    this.failed('Walkthrough_AUDIO_CLOCK_INTERRUPTED');return;
   }
   const p=this.position();if(p===null)return;const frame=Math.floor(p+1e-8),before=this.state;
   if(a.kind==='box'){
    const b=before.stepBox;if(!b)return;
    const target=Math.min(b.closing?20:15,frame);
    if(target>b.frame)this.apply({type:'advance-box',frame:target,generation:b.generation,epoch:before.epoch});
    if(!this.state.stepBox?.playing){this.hold();this.boxPosition=this.state.stepBox?.frame??1;}
   }else if(a.id==='main'){
    const target=Math.min(behavior.mainLastFrame,frame);
    if(target>before.mainFrame)this.apply({type:'advance-main',frame:target,epoch:before.epoch});
    if(!this.state.mainPlaying){this.hold();this.seek('main',this.state.mainFrame);}
   }else{
    const f=before.feedback;if(!f)return;
    const b=behavior.feedback.find(b=>b.spriteId===f.spriteId)!;
    const target=Math.min(b.terminal,frame);
    if(target>f.frame)this.apply({type:'advance-feedback',frame:target,generation:f.generation,epoch:before.epoch});
    if(!this.state.feedback){this.hold();this.track(a.id).replay();this.positions[a.id]=2;
     if(this.state.mainPlaying)void this.playDomain('main',this.state.mainFrame,true);
    }
   }
   this.publish();
  }finally{this.ticking=false;}
 }
 replay(){
  if(this.closed)return false;this.hold();this.spanishSelected=false;this.spanishLoading=false;this.failure=null;this.boxPosition=1;
  for(const id of domains){const t=this.tracks.get(id);if(t&&this.ready){t.replay();this.seek(id,clocks[id].entryFrame);}else this.positions[id]=clocks[id].entryFrame;}
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
  await Promise.all(Object.values(this.contexts).filter((c):c is AudioContext=>!!c&&c.state!=='closed').map(c=>c.close()));this.options.onCleanup?.();
 }
}

return WalkthroughPageRuntimeV1;
}
