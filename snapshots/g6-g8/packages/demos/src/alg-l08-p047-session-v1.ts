import {SourceStreamRunsClockV2,type SourceStreamRunsClockPlan} from './source-stream-runs-clock-v2';
import {DecodedSourceStreamTransport} from './decoded-source-stream-transport';
import {ALG_L08_P047_SOURCE as S,p047InitialState,p047Reduce,p047Playing,type P047State,type P047Choice,type P047Event} from './alg-l08-p047-state-v1';
export type P047AudioId=59|84|100|112|124|136|164|337|'sa';
export type P047Clock=Pick<SourceStreamRunsClockV2,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type P047Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P047SessionOptions {seed?:number;load:(id:P047AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;now?:()=>number;makeClock?:(plan:SourceStreamRunsClockPlan)=>P047Clock;makeSpanish?:()=>P047Spanish;}
type Action= P047Event extends infer E? E extends {epoch:number}?Omit<E,'epoch'>:never:never;
/** Audited main and feedback source-run clocks; silent step boxes use a separate
 * monotonic cursor. Returning from Spanish or dictionary never changes a held
 * answer, counter, child frame, or fractional audio position. */
export class P047Session {
 private state=p047InitialState();private clocks=new Map<string,P047Clock>();private active:{key:string;clock:P047Clock}|null=null;
 private preparing:P047Clock|null=null;private abort:AbortController|null=null;private retiring=new Set<Promise<void>>();private serial=0;private closed=false;private loading=false;private failure:string|null=null;private volume=.8;
 private readonly closingOwners=new WeakMap<P047Clock|P047Spanish,Promise<void>>();private closing?:Promise<void>;
 private mode:'main'|'sa'='main';private spanish?:P047Spanish;private unsubscribe?:()=>void;
 private boxPosition=1;private boxAnchor:number|null=null;
 constructor(private readonly options:P047SessionOptions){}
 private now(){return this.options.now?.()??performance.now();}
 private emit(){if(!this.closed)this.options.changed();}
 private retire(c:P047Clock|P047Spanish){const previous=this.closingOwners.get(c);if(previous)return previous;
  const p=Promise.resolve().then(()=>c.close());this.closingOwners.set(c,p);this.retiring.add(p);
  // Keep rejected cleanup owned so Replay and every close caller observe failure.
  void p.then(()=>{this.retiring.delete(p);},()=>{});return p;}
 private apply(action:Action){const r=p047Reduce(this.state,{...action,epoch:this.state.epoch}as P047Event,this.options.seed??0);if(r.accepted)this.state=r.state;return r.accepted;}
 snapshot(){const c=this.active?.clock.snapshot(),sa=this.spanish?.snapshot();return{state:this.state,frame:this.state.mainFrame,phase:this.closed?'closed':this.failure?'failed':this.loading?'loading':this.mode==='sa'?(sa?.phase??'idle'):p047Playing(this.state)?'playing':'paused',mode:this.mode,loading:this.loading,failure:this.failure,
  audioPhase:this.mode==='sa'?(sa?.phase??'idle'):this.state.stepBox?.playing?'paused':(c?.audio.phase??'idle'),decodedSample:this.mode==='sa'?(sa?.decodedSample??0):(c?.audio.decodedSample??0),audioDomain:this.mode==='sa'?'sa':this.state.stepBox?.playing?'silent-helper':this.state.feedback?.spriteId??337,sourceElapsedSeconds:c?.elapsedSeconds??0,boxPosition:this.boxPosition,activeClockKey:this.active?.key??null,clockCount:this.clocks.size,lessonCompleted:false};}
 private spec(){const f=this.state.feedback,id=(f?.spriteId??337)as Exclude<P047AudioId,'sa'>,branch=f?S.branches.find(b=>b.spriteId===id)!:null;
  const last=branch?.terminal??S.behavior.steps.find(s=>s.frame>this.state.mainFrame)?.frame??(this.state.mainFrame<774?774:791),source=S.clocks.find(c=>c.spriteId===id)!;
  const plan:SourceStreamRunsClockPlan={version:1,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:last,fps:12,decoder:source.decoder,segments:source.segments.filter(s=>s.firstFrame<=last),emptyNegativeBlocks:source.emptyNegativeBlocks.filter(b=>b.frame<=last),alignmentStatus:'source-run-candidate-not-original-runtime-accepted'};
  return{id,frame:f?.frame??this.state.mainFrame,key:`${id}:${last}`,plan};}
 private holdBox(){if(this.boxAnchor!==null){this.boxPosition+=Math.max(0,this.now()-this.boxAnchor)*12/1000;this.boxAnchor=null;}}
 private cancel(){this.serial++;this.abort?.abort();this.abort=null;if(this.preparing){this.retire(this.preparing);this.preparing=null;}if(this.loading&&this.mode==='sa'&&this.spanish){this.unsubscribe?.();this.unsubscribe=undefined;this.retire(this.spanish);this.spanish=undefined;}this.loading=false;this.active?.clock.pause();this.spanish?.pause();this.holdBox();}
 private async activate(forceSeek=false,user=true){if(this.closed||this.mode==='sa'||!p047Playing(this.state))return false;
  if(this.state.stepBox?.playing){this.boxAnchor=this.now();this.emit();return true;}
  const spec=this.spec(),same=this.active?.key===spec.key;this.cancel();const serial=this.serial,abort=new AbortController();this.abort=abort;this.loading=true;this.failure=null;this.emit();
  const current=()=>!this.closed&&this.mode==='main'&&serial===this.serial&&!abort.signal.aborted;
  let c=this.clocks.get(spec.key),fresh=false;
  try{
   if(!c){const bytes=await this.options.load(spec.id,abort.signal);if(!current())return false;c=this.options.makeClock?.(spec.plan)??new SourceStreamRunsClockV2(spec.plan,{commitHeldFrame:f=>Number.isSafeInteger(f)&&f>=1&&f<=spec.plan.lastFrame});fresh=true;this.preparing=c;c.setVolume(this.volume);const ready=await c.prepare(bytes);if(this.preparing===c)this.preparing=null;if(!current()){this.retire(c);return false;}if(!ready.accepted)throw Error(ready.reason);this.clocks.set(spec.key,c);}
   if(!current())return false;this.active={key:spec.key,clock:c};if(forceSeek||!same||fresh){const held=c.seekCandidateFrame(spec.frame);if(!held.accepted)throw Error(held.reason);}
   const played=await c.play({activation:user?'user':'automatic',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);this.loading=false;this.abort=null;this.emit();return true;
  }catch(e){if(fresh&&c){if(this.preparing===c)this.preparing=null;if(this.clocks.get(spec.key)===c)this.clocks.delete(spec.key);if(this.active?.clock===c)this.active=null;this.retire(c);}if(!current())return false;this.loading=false;this.abort=null;this.failure=e instanceof Error?e.message:String(e);this.apply({type:'pause'});this.emit();return false;}
 }
 tick(){if(this.closed||this.loading||this.mode==='sa'||!p047Playing(this.state))return;
  const old=this.state;
  if(old.stepBox?.playing){const b=old.stepBox;if(this.boxAnchor===null)return;const p=this.boxPosition+Math.max(0,this.now()-this.boxAnchor)*12/1000,target=Math.min(b.closing?20:15,Math.floor(p+1e-8));if(target>b.frame)this.apply({type:'advance-box',frame:target,generation:b.generation});if(!this.state.stepBox?.playing){this.boxPosition=this.state.stepBox?.frame??1;this.boxAnchor=null;}if(this.state!==old)this.emit();return;}
  if(!this.active)return;const obs=this.active.clock.snapshot();if(obs.failure||!['playing','timeline-ended'].includes(obs.phase)){this.cancel();this.apply({type:'pause'});this.failure=obs.failure??'P047 source audio clock interrupted';this.emit();return;}
  const oldKey=this.active.key;
  if(old.feedback)this.apply({type:'advance-feedback',frame:obs.frame,generation:old.feedback.generation});
  else this.apply({type:'advance-main',frame:Math.min(791,obs.frame)});
  if(this.state===old)return;
  if(!p047Playing(this.state))this.active.clock.pause();
  else if(oldKey!==this.spec().key)void this.activate(true,false);
  this.emit();
 }
 async play(){if(this.closed||this.loading)return false;if(this.mode==='sa'){if(this.spanish?.snapshot().phase==='buffer-ended')this.spanish.replay();const r=await this.spanish?.play({activation:'user',reducedMotion:false});this.emit();return r?.accepted??false;}
  if(!this.apply({type:'play'}))return false;return this.activate();}
 pause(){if(this.closed)return;this.tick();this.cancel();
  // The held native snapshot is authoritative; time may cross a frame boundary
  // between tick and pause. Preserve its fractional cursor without seeking.
  if(this.mode==='main'&&p047Playing(this.state)){
   const b=this.state.stepBox;
   if(b?.playing){const frame=Math.min(b.closing?20:15,Math.floor(this.boxPosition+1e-8));if(frame>b.frame)this.apply({type:'advance-box',frame,generation:b.generation});if(!this.state.stepBox?.playing)this.boxPosition=this.state.stepBox?.frame??1;}
   else if(this.active?.key===this.spec().key){const held=this.active.clock.snapshot();
    if(held.failure||!['paused','timeline-ended'].includes(held.phase))this.failure=held.failure??'P047 source audio clock did not hold';
    else if(this.state.feedback)this.apply({type:'advance-feedback',frame:held.frame,generation:this.state.feedback.generation});
    else this.apply({type:'advance-main',frame:Math.min(791,held.frame)});
   }
  }
  this.apply({type:'pause'});this.emit();}
 private control(action:Action){if(this.closed||this.loading||this.mode==='sa')return false;this.tick();
  if(action.type==='glossary'||action.type==='open-help'){
   if(!p047Reduce(this.state,{...action,epoch:this.state.epoch}as P047Event,this.options.seed??0).accepted)return false;
   this.pause();
  }
  const before=this.state;if(!this.apply(action))return false;this.cancel();this.failure=null;
  if(action.type==='choose'){if(!this.apply({type:'resolve-host-feedback'}))throw Error('P047 host selection failed');}
  if(action.type==='step-click')this.boxPosition=this.state.stepBox?.frame??1;
  if(action.type==='close-box')this.boxPosition=before.stepBox!.frame;
  this.emit();if(p047Playing(this.state))void this.activate(action.type!=='play');return true;
 }
 step(){return this.control({type:'step-click'});}continueStep(){return this.control({type:'continue-step'});}closeBox(){return this.control({type:'close-box'});}
 choose(choice:P047Choice){return this.control({type:'choose',choice});}openHelp(){return this.control({type:'open-help'});}closeHelp(){return this.control({type:'close-help'});}
 glossary(buttonId:number,ownerSpriteId:number){return this.control({type:'glossary',buttonId,ownerSpriteId});}closeGlossary(){return this.control({type:'close-glossary'});}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));for(const c of this.clocks.values())c.setVolume(this.volume);this.spanish?.setVolume(this.volume);}
 async spanishAudio(){if(this.closed||this.loading||this.state.helpVisible||this.state.glossaryTerm||this.state.stepBox&&!(this.state.stepBox.frame===1&&this.state.stepBox.sourceStopped))return false;this.pause();this.mode='sa';this.failure=null;
  if(this.spanish){this.spanish.replay();const r=await this.spanish.play({activation:'user',reducedMotion:false});this.emit();return r.accepted;}
  const abort=new AbortController();this.abort=abort;const serial=this.serial;this.loading=true;this.emit();const current=()=>!this.closed&&this.mode==='sa'&&serial===this.serial&&!abort.signal.aborted;
  try{const bytes=await this.options.load('sa',abort.signal);if(!current())return false;const sa=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(S.sa);this.spanish=sa;sa.setVolume(this.volume);this.unsubscribe=sa.subscribe(()=>this.emit());const ready=await sa.prepare(bytes);if(!current()){this.retire(sa);return false;}if(!ready.accepted)throw Error(ready.reason);const played=await sa.play({activation:'user',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);this.loading=false;this.abort=null;this.emit();return true;
  }catch(e){if(!current())return false;this.loading=false;this.abort=null;this.failure=e instanceof Error?e.message:String(e);this.unsubscribe?.();this.unsubscribe=undefined;if(this.spanish)this.retire(this.spanish);this.spanish=undefined;this.emit();return false;}
 }
 returnMain(){if(this.closed)return;this.pause();this.mode='main';this.emit();}
 async replay(){if(this.closed)return false;this.cancel();const serial=this.serial;for(const c of this.clocks.values())this.retire(c);this.clocks.clear();this.active=null;this.unsubscribe?.();this.unsubscribe=undefined;if(this.spanish)this.retire(this.spanish);this.spanish=undefined;this.mode='main';this.failure=null;this.boxPosition=1;this.boxAnchor=null;this.apply({type:'replay'});this.loading=true;this.emit();await Promise.all([...this.retiring]);if(this.closed||serial!==this.serial)return false;this.loading=false;return this.play();}
 /** Engineering only. Clamp to the next authored hold; never bypass a quiz. */
 inspect(frame:number){if(this.closed||this.loading||this.mode==='sa'||this.state.phase!=='main'||this.state.glossaryTerm||this.state.helpVisible||!Number.isSafeInteger(frame)||frame<this.state.mainFrame||frame>791)return false;this.pause();this.apply({type:'play'});this.apply({type:'advance-main',frame});this.apply({type:'pause'});this.active=null;this.emit();return true;}
 close(){if(this.closing)return this.closing;this.cancel();this.apply({type:'leave'});this.closed=true;this.unsubscribe?.();this.unsubscribe=undefined;for(const c of this.clocks.values())this.retire(c);this.clocks.clear();if(this.spanish)this.retire(this.spanish);this.active=null;this.spanish=undefined;this.closing=Promise.all([...this.retiring]).then(()=>undefined);return this.closing;}
}
