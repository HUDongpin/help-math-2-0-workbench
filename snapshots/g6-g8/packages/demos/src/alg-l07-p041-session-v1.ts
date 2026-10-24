import{SourceStreamRunsClockV1,type SourceStreamRunsClockPlan}from'./source-stream-runs-clock-v1';
import{DecodedSourceStreamTransport}from'./decoded-source-stream-transport';
import{ALG_L07_P041_SOURCE as S,p041InitialState,p041Reduce,p041CanPlay,p041Branch,type P041Term,type P041Handle,type P041Point,type P041Draw}from'./alg-l07-p041-state-v1';
export type P041AudioId=109|126|147|159|186|200|223|'sa';
export type P041Clock=Pick<SourceStreamRunsClockV1,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type P041Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P041SessionOptions {load:(id:P041AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;makeClock?:(plan:SourceStreamRunsClockPlan)=>P041Clock;makeSpanish?:()=>P041Spanish;draw?:P041Draw;}
// The maintained shared clock and transport own sample scheduling. This page
// supplies source drag/Done/help outcomes, conditional host feedback selection and terminal stop.
export class P041Session{
 private state=p041InitialState();private clocks=new Map<string,P041Clock>();private active:{key:string;clock:P041Clock}|null=null;
 private pending:AbortController|null=null;private preparing:P041Clock|null=null;private loading=false;private token=0;private closed=false;private volume=.8;
 private failure:string|null=null;private mode:'main'|'sa'='main';private spanish?:P041Spanish;private unsubscribe?:()=>void;
 constructor(private readonly options:P041SessionOptions){}
 private emit(){if(!this.closed)this.options.changed();}
 snapshot(){const clock=this.active?.clock.snapshot(),sa=this.spanish?.snapshot();return{state:this.state,frame:this.state.mainFrame,phase:this.closed?'closed':this.failure?'failed':this.loading?'loading':this.mode==='sa'?(sa?.phase??'idle'):this.state.phase==='ended'?'ended':this.state.playing?'playing':'paused',
 audioPhase:this.mode==='sa'?(sa?.phase??'idle'):(clock?.audio.phase??'idle'),decodedSample:this.mode==='sa'?(sa?.decodedSample??0):(clock?.audio.decodedSample??0),
 audioDomain:this.mode==='sa'?'sa':this.state.feedback?.spriteId??S.mainSpriteId,mode:this.mode,loading:this.loading,failure:this.failure,
 activeClockKey:this.active?.key??null,clockCount:this.clocks.size,lessonCompleted:false};}
 private spec(){const f=this.state.feedback,id:P041AudioId=f?.spriteId??223;
  const branch=f?p041Branch(f.key):null;const last=branch?(branch.kind==='wrong'&&!f!.closing?branch.hold:branch.terminal):(this.state.phase==='prequiz'?S.quizFrame:S.mainFrameCount);
  const source=S.clocks.find(c=>c.spriteId===id)!;const plan:SourceStreamRunsClockPlan={version:1,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:last,fps:12,decoder:source.decoder,segments:source.segments.filter(segment=>segment.firstFrame<=last),emptyNegativeBlocks:source.emptyNegativeBlocks.filter(block=>block.frame<=last),alignmentStatus:'source-run-candidate-not-original-runtime-accepted'};
  return{id,frame:f?.frame??this.state.mainFrame,key:`${id}:${last}`,plan};}
 private cancel(){this.token++;this.pending?.abort();this.pending=null;if(this.preparing){void this.preparing.close();this.preparing=null;}if(this.loading&&this.mode==='sa'&&this.spanish){this.unsubscribe?.();this.unsubscribe=undefined;void this.spanish.close();this.spanish=undefined;}this.loading=false;this.active?.clock.pause();}
 private async activate(user:boolean){if(this.closed||this.mode==='sa'||!this.state.playing)return false;
  const sameDomain=this.active?.key===this.spec().key;this.cancel();const ticket=this.token,spec=this.spec(),controller=new AbortController();this.pending=controller;this.loading=true;this.failure=null;this.emit();
  const current=()=>!this.closed&&ticket===this.token&&!controller.signal.aborted;
  let clock=this.clocks.get(spec.key),fresh=false;
  try{if(!clock){const bytes=await this.options.load(spec.id,controller.signal);if(!current())return false;
   // While preparing an inactive domain, accept its private cursor without
   // changing the visible page. Public frame state is committed by tick().
   clock=this.options.makeClock?.(spec.plan)??new SourceStreamRunsClockV1(spec.plan,{commitHeldFrame:frame=>Number.isSafeInteger(frame)&&frame>=1&&frame<=spec.plan.lastFrame});fresh=true;
   this.preparing=clock;clock.setVolume(this.volume);const result=await clock.prepare(bytes);if(this.preparing===clock)this.preparing=null;if(!current()){await clock.close();return false;}if(!result.accepted)throw Error(result.reason);this.clocks.set(spec.key,clock);}
   if(!current())return false;this.active={key:spec.key,clock};if(!sameDomain){const held=clock.seekCandidateFrame(spec.frame);if(!held.accepted)throw Error(held.reason);}
   const played=await clock.play({activation:user?'user':'automatic',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);
   this.pending=null;this.loading=false;this.emit();return true;
  }catch(error){if(fresh&&clock){this.clocks.delete(spec.key);await clock.close();}if(!current())return false;this.pending=null;this.loading=false;this.state={...this.state,playing:false};this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}}
 tick(){if(this.closed||this.loading||this.mode==='sa'||!this.state.playing||!this.active)return;
  const observation=this.active.clock.snapshot();if(observation.failure){this.cancel();this.state={...this.state,playing:false};this.failure=observation.failure;this.emit();return;}
  if(!['playing','timeline-ended'].includes(observation.phase)){this.state={...this.state,playing:false};this.emit();return;}
  const old=this.state,oldKey=this.spec().key;this.state=p041Reduce(old,{type:old.feedback?'advance-feedback':'advance-main',epoch:old.epoch,frame:observation.frame});
  if(this.state===old)return;
  if(!this.state.playing)this.active.clock.pause();else if(this.spec().key!==oldKey)void this.activate(false);
  this.emit();
 }
 async play(){if(this.closed||this.loading)return false;
  if(this.mode==='sa'){if(this.spanish?.snapshot().phase==='buffer-ended')this.spanish.replay();const r=await this.spanish?.play({activation:'user',reducedMotion:false});this.emit();return r?.accepted??false;}
  if(!p041CanPlay(this.state))return false;this.state=p041Reduce(this.state,{type:'play',epoch:this.state.epoch});return this.activate(true);}
 pause(){if(this.closed)return;this.tick();this.cancel();this.spanish?.pause();this.state=p041Reduce(this.state,{type:'pause',epoch:this.state.epoch});this.emit();}
 private drag(type:'drag-start'|'drag-move'|'drag-end',handle:P041Handle,point?:P041Point){if(this.closed||this.loading||this.mode==='sa')return false;const old=this.state;this.state=p041Reduce(old,type==='drag-end'?{type,handle,epoch:old.epoch}:{type,handle,point:point!,epoch:old.epoch});if(this.state===old)return false;this.emit();return true;}
 dragStart(handle:P041Handle,point:P041Point){return this.drag('drag-start',handle,point);}
 dragMove(handle:P041Handle,point:P041Point){return this.drag('drag-move',handle,point);}
 dragEnd(handle:P041Handle){return this.drag('drag-end',handle);}
 movePoint(handle:P041Handle,point:P041Point){if(!this.dragStart(handle,point))return false;return this.dragEnd(handle);}
 async submit(){if(this.closed||this.loading||this.mode==='sa')return false;const old=this.state,next=p041Reduce(old,{type:'submit',epoch:old.epoch},this.options.draw);if(next===old)return false;this.cancel();this.state=next;this.failure=null;this.emit();return this.activate(true);}
 async closeFeedback(){if(this.closed||this.loading||this.mode==='sa')return false;const old=this.state,next=p041Reduce(old,{type:'close-feedback',epoch:old.epoch});if(next===old)return false;this.cancel();this.state=next;this.emit();return this.activate(true);}
 openHelp(){if(this.closed||this.loading||this.mode==='sa')return false;const old=this.state,next=p041Reduce(old,{type:'open-help',epoch:old.epoch});if(next===old)return false;this.cancel();this.state=next;this.emit();return true;}
 closeHelp(){const old=this.state;this.state=p041Reduce(old,{type:'close-help',epoch:old.epoch});this.emit();return this.state!==old;}
 openGlossary(term:P041Term){if(this.closed||this.loading||this.mode==='sa')return false;this.pause();const old=this.state;this.state=p041Reduce(old,{type:'open-glossary',term,epoch:old.epoch});this.emit();return this.state!==old;}
 closeGlossary(){const old=this.state;this.state=p041Reduce(old,{type:'close-glossary',epoch:old.epoch});this.emit();return this.state!==old;}
 async spanishAudio(){if(this.closed||this.loading||this.state.glossary||this.state.help||this.state.dragging!==null)return false;this.pause();this.mode='sa';this.failure=null;
  if(this.spanish){this.spanish.replay();const r=await this.spanish.play({activation:'user',reducedMotion:false});this.emit();return r.accepted;}
  const controller=new AbortController();this.pending=controller;const ticket=this.token;this.loading=true;this.emit();const current=()=>!this.closed&&ticket===this.token&&!controller.signal.aborted;
  try{const bytes=await this.options.load('sa',controller.signal);if(!current())return false;const sa=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(S.sa);this.spanish=sa;sa.setVolume(this.volume);this.unsubscribe=sa.subscribe(()=>{if(!this.closed&&this.spanish===sa)this.emit();});
   const result=await sa.prepare(bytes);if(!current()){await sa.close();return false;}if(!result.accepted)throw Error(result.reason);this.loading=false;this.pending=null;const r=await sa.play({activation:'user',reducedMotion:false});if(!current())return false;if(!r.accepted)throw Error(r.reason);this.emit();return true;
  }catch(error){if(!current())return false;this.unsubscribe?.();this.unsubscribe=undefined;const sa=this.spanish;this.spanish=undefined;await sa?.close();if(!current())return false;this.loading=false;this.pending=null;this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}}
 returnMain(){if(this.closed)return;this.pause();this.mode='main';this.emit();}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));for(const c of this.clocks.values())c.setVolume(this.volume);this.spanish?.setVolume(this.volume);this.emit();}
 async replay(){if(this.closed)return false;this.cancel();this.unsubscribe?.();this.unsubscribe=undefined;const sa=this.spanish;this.spanish=undefined;this.mode='main';const clocks=[...this.clocks.values()];this.clocks.clear();this.active=null;
  this.state=p041Reduce(this.state,{type:'replay',epoch:this.state.epoch});this.failure=null;this.loading=true;const ticket=this.token;this.emit();await Promise.all([...clocks.map(c=>c.close()),sa?.close()]);if(this.closed||ticket!==this.token)return false;this.loading=false;return this.play();}
 /** Bounded engineering entry only; cannot jump across an unanswered quiz. */
 inspect(frame:number){if(this.closed||this.loading||this.state.feedback||this.state.glossary||this.state.help||this.mode==='sa'||!Number.isSafeInteger(frame)||frame<this.state.mainFrame||frame>S.mainFrameCount||this.state.phase==='quiz-held'||this.state.phase==='ended')return false;
  this.pause();const before=this.state;let playing=p041Reduce(before,{type:'play',epoch:before.epoch});playing=p041Reduce(playing,{type:'advance-main',frame,epoch:playing.epoch});this.state={...playing,playing:false};this.active=null;this.emit();return this.state.mainFrame===frame;}
 async close(){if(this.closed)return;this.cancel();this.closed=true;this.unsubscribe?.();this.state=p041Reduce(this.state,{type:'leave',epoch:this.state.epoch});const clocks=[...this.clocks.values()];this.clocks.clear();this.active=null;await Promise.all([...clocks.map(c=>c.close()),this.spanish?.close()]);}
}

