/** P039 private draft: fixed branches, static coach and source terminal790. Shared runtime unchanged. */
import {SourceStreamRunsClockV1,type SourceStreamRunsClockPlan} from './source-stream-runs-clock-v1';
import {DecodedSourceStreamTransport} from './decoded-source-stream-transport';
import {createL8P039QuizV1,type L8P039SourceV1,type L8P039State,type L8P039Answer} from './alg-l08-p039-state-v1';
export type L8P039Clock=Pick<SourceStreamRunsClockV1,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type L8P039Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export type L8P039AudioId=number|'sa';
export interface L8P039SessionOptions{load:(id:L8P039AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;
 makeClock?:(plan:SourceStreamRunsClockPlan)=>L8P039Clock;makeSpanish?:()=>L8P039Spanish;draw?:()=>number;}
/** Authored stops define native scheduling boundaries. The page owns branch
 * state; a decoder ending does not choose an answer or complete a lesson. */
export class L8P039Session{
 private state:L8P039State;private readonly machine:ReturnType<typeof createL8P039QuizV1>;private clocks=new Map<string,L8P039Clock>();private active:{key:string;epoch:number;clock:L8P039Clock}|null=null;
 private pending:AbortController|null=null;private preparing:L8P039Clock|null=null;private loading=false;private token=0;private closed=false;private volume=.8;
 private retiring=new Set<Promise<void>>();private retired=new WeakMap<L8P039Clock|L8P039Spanish,Promise<void>>();private closePending?:Promise<void>;
 private failure:string|null=null;private mode:'main'|'sa'='main';private spanish?:L8P039Spanish;private unsubscribe?:()=>void;
 constructor(private readonly source:L8P039SourceV1,private readonly options:L8P039SessionOptions){this.machine=createL8P039QuizV1(source);this.state=this.machine.initialState();}
 private emit(){if(!this.closed)this.options.changed();}
 snapshot(){const clock=this.active?.clock.snapshot(),sa=this.spanish?.snapshot();return{state:this.state,frame:this.state.mainFrame,phase:this.closed?'closed':this.failure?'failed':this.loading?'loading':this.mode==='sa'?(sa?.phase??'idle'):this.state.playing?'playing':'paused',
 audioPhase:this.mode==='sa'?(sa?.phase??'idle'):(clock?.audio.phase??'idle'),decodedSample:this.mode==='sa'?(sa?.decodedSample??0):(clock?.audio.decodedSample??0),
 audioDomain:this.mode==='sa'?'sa':this.state.feedback?.spriteId??this.source.mainSpriteId,mode:this.mode,loading:this.loading,failure:this.failure,
 activeClockKey:this.active?.key??null,clockCount:this.clocks.size,lessonCompleted:false};}
 private spec(){const f=this.state.feedback,id:L8P039AudioId=f?.spriteId??this.source.mainSpriteId,b=f?this.machine.branch(f.spriteId):null;
  const last=b?(b.kind==='wrong'&&!f!.closing?b.hold:b.terminal):(this.state.phase==='prequiz'?this.source.quizFrame:this.source.mainFrameCount);
  const source=this.source.clocks.find(c=>c.spriteId===id)!;if(!source.decoder)throw Error('p039-native-decode-binding-unavailable');const plan:SourceStreamRunsClockPlan={version:1,sourceSwfSha256:this.source.sourceSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:last,fps:12,decoder:source.decoder,segments:source.segments.filter(segment=>segment.firstFrame<=last),emptyNegativeBlocks:source.emptyNegativeBlocks.filter(block=>block.frame<=last),alignmentStatus:'source-run-candidate-not-original-runtime-accepted'};
  return{id,frame:f?.frame??this.state.mainFrame,key:`${id}:${last}`,plan};}
 /** Remember the first close promise because shared transports mark themselves
  * closed before their native AudioContext.close() promise settles. */
 private retire(transport:L8P039Clock|L8P039Spanish){const previous=this.retired.get(transport);if(previous)return previous;
  const closing=transport.close();this.retired.set(transport,closing);this.retiring.add(closing);void closing.catch(()=>{});return closing;}
 private async drainRetirements(){const pending=[...this.retiring];await Promise.all(pending);for(const promise of pending)this.retiring.delete(promise);}
 private cancel(){this.token++;this.pending?.abort();this.pending=null;if(this.preparing){void this.retire(this.preparing);this.preparing=null;}if(this.loading&&this.mode==='sa'&&this.spanish){this.unsubscribe?.();this.unsubscribe=undefined;void this.retire(this.spanish);this.spanish=undefined;}this.loading=false;this.active?.clock.pause();}
 private async activate(user:boolean){if(this.closed||this.mode==='sa'||!this.state.playing)return false;
  this.cancel();if(!this.source.clocks.find(c=>c.spriteId===(this.state.feedback?.spriteId??this.source.mainSpriteId))?.decoder){this.state={...this.state,playing:false};this.failure='p039-native-decode-binding-unavailable';this.emit();return false;}const ticket=this.token,spec=this.spec(),controller=new AbortController();this.pending=controller;this.loading=true;this.failure=null;this.emit();
  const current=()=>!this.closed&&ticket===this.token&&!controller.signal.aborted;
  let clock=this.clocks.get(spec.key),fresh=false;
  try{if(!clock){const bytes=await this.options.load(spec.id,controller.signal);if(!current())return false;
   // While preparing an inactive domain, accept its private cursor without
   // changing the visible page. Public frame state is committed by tick().
   clock=this.options.makeClock?.(spec.plan)??new SourceStreamRunsClockV1(spec.plan,{commitHeldFrame:frame=>Number.isSafeInteger(frame)&&frame>=1&&frame<=spec.plan.lastFrame});fresh=true;
   this.preparing=clock;clock.setVolume(this.volume);const result=await clock.prepare(bytes);if(this.preparing===clock)this.preparing=null;if(!current()){await this.retire(clock);return false;}if(!result.accepted)throw Error(result.reason);this.clocks.set(spec.key,clock);}
   if(!current())return false;
   // Pause, glossary holds and SA return continue the same semantic entry at
   // its native fractional cursor. New branches and inspected entries seek.
   const continuing=this.active?.clock===clock&&this.active.key===spec.key&&this.active.epoch===this.state.epoch;
   if(!continuing){const held=clock.seekCandidateFrame(spec.frame);if(!held.accepted)throw Error(held.reason);}
   this.active={key:spec.key,epoch:this.state.epoch,clock};
   const played=await clock.play({activation:user?'user':'automatic',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);
   this.pending=null;this.loading=false;this.emit();return true;
  }catch(error){if(!current())return false;if(this.preparing===clock)this.preparing=null;if(fresh&&clock){if(this.clocks.get(spec.key)===clock)this.clocks.delete(spec.key);if(this.active?.clock===clock)this.active=null;await this.retire(clock);}if(!current())return false;this.pending=null;this.loading=false;this.state={...this.state,playing:false};this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}}
 tick(){if(this.closed||this.loading||this.mode==='sa'||!this.state.playing||!this.active)return;
  const observation=this.active.clock.snapshot();if(observation.failure){this.cancel();this.state={...this.state,playing:false};this.failure=observation.failure;this.emit();return;}
  if(!['playing','timeline-ended'].includes(observation.phase)){this.state={...this.state,playing:false};this.emit();return;}
  const old=this.state,oldKey=this.spec().key;this.state=this.machine.reduce(old,{type:old.feedback?'advance-feedback':'advance-main',epoch:old.epoch,frame:observation.frame});
  if(this.state===old)return;
  if(!this.state.playing)this.active.clock.pause();else if(this.spec().key!==oldKey||this.state.cycle!==old.cycle)void this.activate(false);
  this.emit();
 }
 async play(){if(this.closed||this.loading)return false;
  if(this.mode==='sa'){if(this.spanish?.snapshot().phase==='buffer-ended')this.spanish.replay();const r=await this.spanish?.play({activation:'user',reducedMotion:false});this.emit();return r?.accepted??false;}
  if(!this.machine.canPlay(this.state))return false;this.state=this.machine.reduce(this.state,{type:'play',epoch:this.state.epoch});return this.activate(true);}
 pause(){if(this.closed)return;this.tick();this.cancel();this.spanish?.pause();this.state=this.machine.reduce(this.state,{type:'pause',epoch:this.state.epoch});this.emit();}
 async choose(answer:L8P039Answer,seed?:number){if(this.closed||this.loading||this.mode==='sa')return false;this.tick();const old=this.state;
  this.state=this.machine.reduce(old,{type:'choose',epoch:old.epoch,answer,seed:seed??0});if(this.state===old)return false;return this.activate(true);}
 async closeFeedback(){if(this.closed||this.loading||this.mode==='sa')return false;this.tick();const old=this.state;this.state=this.machine.reduce(old,{type:'close-feedback',epoch:old.epoch});if(this.state===old)return false;return this.activate(true);}
 openCoach(){if(this.closed||this.loading||this.mode==='sa')return false;this.pause();const old=this.state;this.state=this.machine.reduce(old,{type:'open-coach',epoch:old.epoch});this.emit();return this.state!==old;}
 closeCoach(){if(this.closed||this.loading||this.mode==='sa')return false;const old=this.state;this.state=this.machine.reduce(old,{type:'close-coach',epoch:old.epoch});this.emit();return this.state!==old;}
 openGlossary(term:string){if(this.closed||this.loading||this.mode==='sa')return false;this.pause();const old=this.state;this.state=this.machine.reduce(old,{type:'open-glossary',term,epoch:old.epoch});this.emit();return this.state!==old;}
 closeGlossary(){const old=this.state;this.state=this.machine.reduce(old,{type:'close-glossary',epoch:old.epoch});this.emit();return this.state!==old;}
 async spanishAudio(){if(this.closed||this.loading||this.state.glossary)return false;this.pause();if(!this.source.sa){this.failure='p039-native-spanish-decode-binding-unavailable';this.emit();return false;}this.mode='sa';this.failure=null;
  if(this.spanish){this.spanish.replay();const r=await this.spanish.play({activation:'user',reducedMotion:false});this.emit();return r.accepted;}
  const controller=new AbortController();this.pending=controller;const ticket=this.token;this.loading=true;this.emit();const current=()=>!this.closed&&ticket===this.token&&!controller.signal.aborted;
  try{const bytes=await this.options.load('sa',controller.signal);if(!current())return false;const sa=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(this.source.sa);this.spanish=sa;sa.setVolume(this.volume);this.unsubscribe=sa.subscribe(()=>{if(!this.closed&&this.spanish===sa)this.emit();});
   const result=await sa.prepare(bytes);if(!current()){await this.retire(sa);return false;}if(!result.accepted)throw Error(result.reason);this.loading=false;this.pending=null;const r=await sa.play({activation:'user',reducedMotion:false});if(!current())return false;if(!r.accepted)throw Error(r.reason);this.emit();return true;
  }catch(error){if(!current())return false;this.unsubscribe?.();this.unsubscribe=undefined;const sa=this.spanish;this.spanish=undefined;if(sa)await this.retire(sa);if(!current())return false;this.loading=false;this.pending=null;this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}}
 returnMain(){if(this.closed)return;this.pause();this.mode='main';this.emit();}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));for(const c of this.clocks.values())c.setVolume(this.volume);this.spanish?.setVolume(this.volume);this.emit();}
 async replay(){if(this.closed)return false;this.cancel();this.unsubscribe?.();this.unsubscribe=undefined;const sa=this.spanish;this.spanish=undefined;this.mode='main';const clocks=[...this.clocks.values()];this.clocks.clear();this.active=null;
  this.state=this.machine.reduce(this.state,{type:'replay',epoch:this.state.epoch});this.failure=null;this.loading=true;const ticket=this.token;this.emit();for(const clock of clocks)void this.retire(clock);if(sa)void this.retire(sa);await this.drainRetirements();if(this.closed||ticket!==this.token)return false;this.loading=false;return this.play();}
 /** Bounded engineering entry only; cannot jump across an unanswered quiz. */
 inspect(frame:number){if(this.closed||this.loading||this.state.feedback||this.state.glossary||this.state.coach||this.mode==='sa'||!Number.isSafeInteger(frame)||frame<this.state.mainFrame||frame>this.source.mainFrameCount||this.state.phase==='quiz-held')return false;
  this.pause();const before=this.state;let playing=this.machine.reduce(before,{type:'play',epoch:before.epoch});playing=this.machine.reduce(playing,{type:'advance-main',frame,epoch:playing.epoch});this.state={...playing,playing:false};this.active=null;this.emit();return this.state.mainFrame===frame;}
 close():Promise<void>{if(this.closePending)return this.closePending;this.cancel();this.closed=true;this.unsubscribe?.();this.unsubscribe=undefined;this.state=this.machine.reduce(this.state,{type:'leave',epoch:this.state.epoch});
  for(const clock of this.clocks.values())void this.retire(clock);this.clocks.clear();this.active=null;if(this.spanish)void this.retire(this.spanish);this.spanish=undefined;
  this.closePending=this.drainRetirements();return this.closePending;}
}
