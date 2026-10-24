import {SourceStreamRunsClockV2,type SourceStreamRunsClockPlan} from './source-stream-runs-clock-v2';
import {DecodedSourceStreamTransport} from './decoded-source-stream-transport';
import {ALG_L07_P058_SOURCE as S,p058InitialState,p058Reduce,p058Playing,type P058State,type P058Choice,type P058Event} from './alg-l07-p058-state-v1';
export type P058AudioId=60|94|119|132|146|157|175|311|'sa';
export type P058Clock=Pick<SourceStreamRunsClockV2,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type P058Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P058SessionOptions {seed?:number;load:(id:P058AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;now?:()=>number;makeClock?:(plan:SourceStreamRunsClockPlan)=>P058Clock;makeSpanish?:()=>P058Spanish;}
type Action= P058Event extends infer E? E extends {epoch:number}?Omit<E,'epoch'>:never:never;
/** Audited main and feedback source-run clocks; silent step boxes use a separate
 * monotonic cursor. Returning from Spanish or dictionary never changes a held
 * answer, counter, child frame, or fractional audio position. */
export class P058Session {
 private state=p058InitialState();private clocks=new Map<string,P058Clock>();private active:{key:string;clock:P058Clock}|null=null;
 private preparing:P058Clock|null=null;private abort:AbortController|null=null;private retiring=new Set<Promise<void>>();private serial=0;private closed=false;private loading=false;private failure:string|null=null;private volume=.8;
 private mode:'main'|'sa'='main';private spanish?:P058Spanish;private unsubscribe?:()=>void;
 private boxPosition=1;private boxAnchor:number|null=null;
 constructor(private readonly options:P058SessionOptions){}
 private now(){return this.options.now?.()??performance.now();}
 private emit(){if(!this.closed)this.options.changed();}
 private retire(c:{close:()=>Promise<void>}){const p=c.close();this.retiring.add(p);void p.then(()=>this.retiring.delete(p),()=>this.retiring.delete(p));}
 private apply(action:Action){const r=p058Reduce(this.state,{...action,epoch:this.state.epoch}as P058Event,this.options.seed??0);if(r.accepted)this.state=r.state;return r.accepted;}
 snapshot(){const c=this.active?.clock.snapshot(),sa=this.spanish?.snapshot();return{state:this.state,frame:this.state.mainFrame,phase:this.closed?'closed':this.failure?'failed':this.loading?'loading':this.mode==='sa'?(sa?.phase??'idle'):p058Playing(this.state)?'playing':'paused',mode:this.mode,loading:this.loading,failure:this.failure,
  audioPhase:this.mode==='sa'?(sa?.phase??'idle'):this.state.stepBox?.playing?'paused':(c?.audio.phase??'idle'),decodedSample:this.mode==='sa'?(sa?.decodedSample??0):(c?.audio.decodedSample??0),audioDomain:this.mode==='sa'?'sa':this.state.stepBox?.playing?'silent-helper':this.state.feedback?.spriteId??311,boxPosition:this.boxPosition,activeClockKey:this.active?.key??null,clockCount:this.clocks.size,lessonCompleted:false};}
 private spec(){const f=this.state.feedback,id=(f?.spriteId??311)as Exclude<P058AudioId,'sa'>,branch=f?S.branches.find(b=>b.spriteId===id)!:null;
  const last=branch?.terminal??S.behavior.steps.find(s=>s.frame>this.state.mainFrame)?.frame??(this.state.mainFrame<805?805:823),source=S.clocks.find(c=>c.spriteId===id)!;
  const plan:SourceStreamRunsClockPlan={version:1,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:last,fps:12,decoder:source.decoder,segments:source.segments.filter(s=>s.firstFrame<=last),emptyNegativeBlocks:source.emptyNegativeBlocks.filter(b=>b.frame<=last),alignmentStatus:'source-run-candidate-not-original-runtime-accepted'};
  return{id,frame:f?.frame??this.state.mainFrame,key:`${id}:${last}`,plan};}
 private holdBox(){if(this.boxAnchor!==null){this.boxPosition+=Math.max(0,this.now()-this.boxAnchor)*12/1000;this.boxAnchor=null;}}
 private cancel(){this.serial++;this.abort?.abort();this.abort=null;if(this.preparing){this.retire(this.preparing);this.preparing=null;}if(this.loading&&this.mode==='sa'&&this.spanish){this.unsubscribe?.();this.unsubscribe=undefined;this.retire(this.spanish);this.spanish=undefined;}this.loading=false;this.active?.clock.pause();this.spanish?.pause();this.holdBox();}
 private async activate(forceSeek=false,user=true){if(this.closed||this.mode==='sa'||!p058Playing(this.state))return false;
  if(this.state.stepBox?.playing){this.boxAnchor=this.now();this.emit();return true;}
  const spec=this.spec(),same=this.active?.key===spec.key;this.cancel();const serial=this.serial,abort=new AbortController();this.abort=abort;this.loading=true;this.failure=null;this.emit();
  const current=()=>!this.closed&&this.mode==='main'&&serial===this.serial&&!abort.signal.aborted;
  let c=this.clocks.get(spec.key),fresh=false;
  try{
   if(!c){const bytes=await this.options.load(spec.id,abort.signal);if(!current())return false;c=this.options.makeClock?.(spec.plan)??new SourceStreamRunsClockV2(spec.plan,{commitHeldFrame:f=>Number.isSafeInteger(f)&&f>=1&&f<=spec.plan.lastFrame});fresh=true;this.preparing=c;c.setVolume(this.volume);const ready=await c.prepare(bytes);if(this.preparing===c)this.preparing=null;if(!current()){this.retire(c);return false;}if(!ready.accepted)throw Error(ready.reason);this.clocks.set(spec.key,c);}
   if(!current())return false;this.active={key:spec.key,clock:c};if(forceSeek||!same||fresh){const held=c.seekCandidateFrame(spec.frame);if(!held.accepted)throw Error(held.reason);}
   const played=await c.play({activation:user?'user':'automatic',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);this.loading=false;this.abort=null;this.emit();return true;
  }catch(e){if(fresh&&c){this.clocks.delete(spec.key);this.retire(c);}if(!current())return false;this.loading=false;this.abort=null;this.failure=e instanceof Error?e.message:String(e);this.apply({type:'pause'});this.emit();return false;}
 }
 tick(){if(this.closed||this.loading||this.mode==='sa'||!p058Playing(this.state))return;
  const old=this.state;
  if(old.stepBox?.playing){const b=old.stepBox;if(this.boxAnchor===null)return;const p=this.boxPosition+Math.max(0,this.now()-this.boxAnchor)*12/1000,target=Math.min(b.closing?20:15,Math.floor(p+1e-8));if(target>b.frame)this.apply({type:'advance-box',frame:target,generation:b.generation});if(!this.state.stepBox?.playing){this.boxPosition=this.state.stepBox?.frame??1;this.boxAnchor=null;}if(this.state!==old)this.emit();return;}
  if(!this.active)return;const obs=this.active.clock.snapshot();if(obs.failure||!['playing','timeline-ended'].includes(obs.phase)){this.cancel();this.apply({type:'pause'});this.failure=obs.failure??'P058 source audio clock interrupted';this.emit();return;}
  const oldKey=this.active.key;
  if(old.feedback)this.apply({type:'advance-feedback',frame:obs.frame,generation:old.feedback.generation});
  else{
   this.apply({type:'advance-main',frame:Math.min(822,obs.frame)});
   if(obs.frame===823&&this.state.mainFrame===822)this.apply({type:'wrap-main',boundaryFrame:823});
  }
  if(this.state===old)return;
  if(!p058Playing(this.state))this.active.clock.pause();
  else if(oldKey!==this.spec().key||old.loop!==this.state.loop)void this.activate(true,false);
  this.emit();
 }
 async play(){if(this.closed||this.loading)return false;if(this.mode==='sa'){if(this.spanish?.snapshot().phase==='buffer-ended')this.spanish.replay();const r=await this.spanish?.play({activation:'user',reducedMotion:false});this.emit();return r?.accepted??false;}
  if(!this.apply({type:'play'}))return false;return this.activate();}
 pause(){if(this.closed)return;this.tick();this.cancel();this.apply({type:'pause'});this.emit();}
 private control(action:Action){if(this.closed||this.loading||this.mode==='sa')return false;this.tick();const before=this.state;if(!this.apply(action))return false;this.cancel();this.failure=null;
  if(action.type==='choose'){if(!this.apply({type:'resolve-host-feedback'}))throw Error('P058 host selection failed');}
  if(action.type==='step-click')this.boxPosition=this.state.stepBox?.frame??1;
  if(action.type==='close-box')this.boxPosition=before.stepBox!.frame;
  this.emit();if(p058Playing(this.state))void this.activate(action.type!=='play');return true;
 }
 step(){return this.control({type:'step-click'});}continueStep(){return this.control({type:'continue-step'});}closeBox(){return this.control({type:'close-box'});}
 choose(choice:P058Choice){return this.control({type:'choose',choice});}openHelp(){return this.control({type:'open-help'});}closeHelp(){return this.control({type:'close-help'});}
 glossary(buttonId:number,ownerSpriteId:number){return this.control({type:'glossary',buttonId,ownerSpriteId});}closeGlossary(){return this.control({type:'close-glossary'});}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));for(const c of this.clocks.values())c.setVolume(this.volume);this.spanish?.setVolume(this.volume);}
 async spanishAudio(){if(this.closed||this.loading||this.state.helpVisible||this.state.glossaryTerm||this.state.stepBox&&this.state.stepBox.frame!==1)return false;this.pause();this.mode='sa';this.failure=null;
  if(this.spanish){this.spanish.replay();const r=await this.spanish.play({activation:'user',reducedMotion:false});this.emit();return r.accepted;}
  const abort=new AbortController();this.abort=abort;const serial=this.serial;this.loading=true;this.emit();const current=()=>!this.closed&&this.mode==='sa'&&serial===this.serial&&!abort.signal.aborted;
  try{const bytes=await this.options.load('sa',abort.signal);if(!current())return false;const sa=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(S.sa);this.spanish=sa;sa.setVolume(this.volume);this.unsubscribe=sa.subscribe(()=>this.emit());const ready=await sa.prepare(bytes);if(!current()){this.retire(sa);return false;}if(!ready.accepted)throw Error(ready.reason);const played=await sa.play({activation:'user',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);this.loading=false;this.abort=null;this.emit();return true;
  }catch(e){if(!current())return false;this.loading=false;this.abort=null;this.failure=e instanceof Error?e.message:String(e);this.unsubscribe?.();this.unsubscribe=undefined;if(this.spanish)this.retire(this.spanish);this.spanish=undefined;this.emit();return false;}
 }
 returnMain(){if(this.closed)return;this.pause();this.mode='main';this.emit();}
 async replay(){if(this.closed)return false;this.cancel();const serial=this.serial;for(const c of this.clocks.values())this.retire(c);this.clocks.clear();this.active=null;this.unsubscribe?.();this.unsubscribe=undefined;if(this.spanish)this.retire(this.spanish);this.spanish=undefined;this.mode='main';this.failure=null;this.boxPosition=1;this.boxAnchor=null;this.apply({type:'replay'});this.loading=true;this.emit();await Promise.all([...this.retiring]);if(this.closed||serial!==this.serial)return false;this.loading=false;return this.play();}
 /** Engineering only. Clamp to the next authored hold; never bypass a quiz. */
 inspect(frame:number){if(this.closed||this.loading||this.mode==='sa'||this.state.phase!=='main'||this.state.glossaryTerm||this.state.helpVisible||!Number.isSafeInteger(frame)||frame<this.state.mainFrame||frame>822)return false;this.pause();this.apply({type:'play'});this.apply({type:'advance-main',frame});this.apply({type:'pause'});this.active=null;this.emit();return true;}
 async close(){if(this.closed)return;this.cancel();this.apply({type:'leave'});this.closed=true;this.unsubscribe?.();for(const c of this.clocks.values())this.retire(c);this.clocks.clear();if(this.spanish)this.retire(this.spanish);this.active=null;this.spanish=undefined;await Promise.all([...this.retiring]);}
}
