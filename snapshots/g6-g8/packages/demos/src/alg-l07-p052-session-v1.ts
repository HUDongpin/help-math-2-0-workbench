import{SourceStreamRunsClockV1,type SourceStreamRunsClockPlan}from'./source-stream-runs-clock-v1';
import{DecodedSourceStreamTransport}from'./decoded-source-stream-transport';
import{L7_GAME_AUDIO}from'./alg-l07-game-audio-source-v1';
import{p052InitialState,p052Reduce,type P052State,type P052Card,type P052Level,type P052FeedbackId}from'./alg-l07-p052-state-v1';
export type P052Clock=Pick<SourceStreamRunsClockV1,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type P052Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P052SessionOptions {entryLevel?:P052Level;load:(id:P052FeedbackId|'sa',signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;now?:()=>number;makeClock?:(plan:SourceStreamRunsClockPlan)=>P052Clock;makeSpanish?:()=>P052Spanish;}
type Branch={id:P052FeedbackId;epoch:number;generation:number;clock:P052Clock;abort:AbortController;ready:boolean;};
const AUDIO=L7_GAME_AUDIO[52];
export class P052Session {
 private retiring=new Set<Promise<void>>();private state:P052State;private branches=new Map<P052FeedbackId,Branch>();private closed=false;private volume=.8;private lastNow:number|null=null;private failure:string|null=null;
 private mode:'game'|'sa'='game';private spanish?:P052Spanish;private saAbort?:AbortController;private saSerial=0;private saLoading=false;private unsubscribe?:()=>void;
 constructor(private readonly options:P052SessionOptions){this.state=p052InitialState(options.entryLevel??1);}
 private now(){return this.options.now?.()??performance.now();}
 private emit(){if(!this.closed)this.options.changed();}
 snapshot(){const sa=this.spanish?.snapshot(),moving=Object.values(this.state.feedback).some(f=>f?.playing)||this.state.fades.length>0,loading=this.saLoading||[...this.branches.values()].some(b=>!b.ready);
 return{state:this.state,frame:this.state.mainFrame,phase:this.closed?'closed':this.failure?'failed':loading?'loading':this.mode==='sa'?(sa?.phase??'idle'):this.state.phase==='complete'?'ended':this.state.paused?'paused':moving?'playing':'paused',mode:this.mode,loading,failure:this.failure,
 audioPhase:this.mode==='sa'?(sa?.phase??'idle'):[...this.branches.values()].some(b=>b.clock.snapshot().audio.phase==='playing')?'playing':'paused',
 clocks:[...this.branches.values()].map(b=>({id:b.id,generation:b.generation,ready:b.ready,frame:b.clock.snapshot().frame,audio:b.clock.snapshot().audio.phase})),lessonCompleted:false};}
 private plan(id:P052FeedbackId):SourceStreamRunsClockPlan{const s=AUDIO.clocks.find(c=>c.spriteId===id)!;return{version:1,sourceSwfSha256:AUDIO.sourceSwfSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:id===157?28:27,fps:12,decoder:s.decoder,segments:s.segments,emptyNegativeBlocks:s.emptyNegativeBlocks,alignmentStatus:'source-run-candidate-not-original-runtime-accepted'};}
 private cancelBranch(id:P052FeedbackId){const b=this.branches.get(id);if(!b)return;this.branches.delete(id);b.abort.abort();const closing=b.clock.close();this.retiring.add(closing);void closing.then(()=>this.retiring.delete(closing),()=>this.retiring.delete(closing));}
 private pauseClocks(){for(const b of this.branches.values())b.clock.pause();this.spanish?.pause();this.lastNow=null;}
 private async activate(id:P052FeedbackId,user:boolean){
  const f=this.state.feedback[id];if(this.closed||this.mode!=='game'||!f?.playing||this.state.paused)return false;
  const prior=this.branches.get(id);
  if(prior&&prior.epoch===this.state.epoch&&prior.generation===f.generation&&prior.ready){const r=await prior.clock.play({activation:user?'user':'automatic',reducedMotion:false});if(this.closed||this.branches.get(id)!==prior)return false;if(!r.accepted){this.failure=r.reason;this.state={...this.state,paused:true};this.pauseClocks();}this.lastNow=this.now();this.emit();return r.accepted;}
  this.cancelBranch(id);const abort=new AbortController(),plan=this.plan(id),clock=this.options.makeClock?.(plan)??new SourceStreamRunsClockV1(plan,{commitHeldFrame:n=>Number.isSafeInteger(n)&&n>=1&&n<=plan.lastFrame});clock.setVolume(this.volume);
  const b:Branch={id,epoch:this.state.epoch,generation:f.generation,clock,abort,ready:false};this.branches.set(id,b);this.failure=null;this.emit();
  const current=()=>!this.closed&&!abort.signal.aborted&&this.mode==='game'&&this.branches.get(id)===b&&this.state.epoch===b.epoch&&this.state.feedback[id]?.generation===b.generation;
  try{const bytes=await this.options.load(id,abort.signal);if(!current()){await clock.close();return false;}const ready=await clock.prepare(bytes);if(!current()){await clock.close();return false;}if(!ready.accepted)throw Error(ready.reason);b.ready=true;
   const held=clock.seekCandidateFrame(this.state.feedback[id]!.frame);if(!held.accepted)throw Error(held.reason);
   if(!this.state.paused){const played=await clock.play({activation:user?'user':'automatic',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);}
   this.lastNow=this.now();this.emit();return true;
  }catch(error){if(!current()){await clock.close();return false;}this.cancelBranch(id);this.failure=error instanceof Error?error.message:String(error);this.state={...this.state,paused:true};this.pauseClocks();this.emit();return false;}
 }
 tick(){if(this.closed||this.mode==='sa'||this.state.paused)return;const now=this.now();if(this.lastNow!==null&&now<this.lastNow)throw Error('P052 regressing clock');const elapsed=this.lastNow===null?0:now-this.lastNow;this.lastNow=now;
  if([...this.branches.values()].some(b=>!b.ready))return;
  const old=this.state;this.state=p052Reduce(this.state,{type:'advance-fades',epoch:this.state.epoch,elapsedMs:elapsed,generation:this.state.selectionSerial});
  // Source display order places wrong feedback before correct feedback.
  for(const id of[157,170]as const){const b=this.branches.get(id),f=this.state.feedback[id];if(!b||!b.ready||!f?.playing)continue;const obs=b.clock.snapshot();if(obs.failure){this.failure=obs.failure;this.state={...this.state,paused:true};this.pauseClocks();break;}
   if(['playing','timeline-ended'].includes(obs.phase)){this.state=p052Reduce(this.state,{type:'advance-feedback',epoch:this.state.epoch,id,frame:obs.frame,generation:b.generation});if(!this.state.feedback[id]?.playing)this.cancelBranch(id);}
  }
  if(this.state.phase==='complete'){for(const id of this.branches.keys())this.cancelBranch(id);this.lastNow=null;}
  if(this.state!==old)this.emit();
 }
 choose(card:P052Card){if(this.closed||this.mode==='sa')return false;this.tick();const before=this.state,next=p052Reduce(before,{type:'choose',epoch:before.epoch,card});if(next===before)return false;this.state=next;this.lastNow=this.now();this.failure=null;this.emit();if(before.selected!==null){const id:P052FeedbackId=next.score>before.score?170:157;void this.activate(id,true);}return true;}
 openDirections(){if(this.closed||this.mode==='sa')return false;this.tick();const old=this.state;this.state=p052Reduce(old,{type:'open-directions',epoch:old.epoch});this.emit();return old!==this.state;}
 closeDirections(){if(this.closed||this.mode==='sa')return false;const old=this.state;this.state=p052Reduce(old,{type:'close-directions',epoch:old.epoch});this.emit();return old!==this.state;}
 selectLevel(level:P052Level){if(this.closed||this.mode==='sa')return;this.state=p052Reduce(this.state,{type:'select-level',epoch:this.state.epoch,level});this.emit();}
 start(){if(this.closed||this.mode==='sa')return false;const old=this.state;this.state=p052Reduce(old,{type:'start',epoch:old.epoch});if(old===this.state)return false;for(const id of this.branches.keys())this.cancelBranch(id);this.failure=null;this.lastNow=null;this.emit();return true;}
 pause(){if(this.closed)return;this.tick();this.state=p052Reduce(this.state,{type:'pause',epoch:this.state.epoch});this.pauseClocks();this.emit();}
 async play(){if(this.closed)return false;if(this.mode==='sa'){if(this.saLoading)return false;if(this.spanish?.snapshot().phase==='buffer-ended')this.spanish.replay();const r=await this.spanish?.play({activation:'user',reducedMotion:false});this.emit();return r?.accepted??false;}
  this.state=p052Reduce(this.state,{type:'play',epoch:this.state.epoch});this.failure=null;this.lastNow=this.now();const ids=([157,170]as const).filter(id=>this.state.feedback[id]?.playing);const results=await Promise.all(ids.map(id=>this.activate(id,true)));this.emit();return results.every(Boolean);}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));for(const b of this.branches.values())b.clock.setVolume(this.volume);this.spanish?.setVolume(this.volume);}
 async spanishAudio(){if(this.closed||this.state.popup)return false;this.pause();this.mode='sa';this.failure=null;this.saAbort?.abort();const serial=++this.saSerial;
  if(this.spanish&&!this.saLoading){this.spanish.replay();const r=await this.spanish.play({activation:'user',reducedMotion:false});this.emit();return r.accepted;}
  this.unsubscribe?.();await this.spanish?.close();if(this.closed||this.mode!=='sa'||serial!==this.saSerial)return false;this.spanish=undefined;const abort=new AbortController();this.saAbort=abort;this.saLoading=true;this.emit();const current=()=>!this.closed&&this.mode==='sa'&&serial===this.saSerial&&!abort.signal.aborted;
  try{const bytes=await this.options.load('sa',abort.signal);if(!current())return false;const sa=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(AUDIO.sa);this.spanish=sa;sa.setVolume(this.volume);this.unsubscribe=sa.subscribe(()=>this.emit());const ready=await sa.prepare(bytes);if(!current()){await sa.close();return false;}if(!ready.accepted)throw Error(ready.reason);this.saLoading=false;const r=await sa.play({activation:'user',reducedMotion:false});if(!current())return false;if(!r.accepted)throw Error(r.reason);this.emit();return true;
  }catch(e){if(!current())return false;this.saLoading=false;this.failure=e instanceof Error?e.message:String(e);this.unsubscribe?.();this.unsubscribe=undefined;await this.spanish?.close();this.spanish=undefined;this.emit();return false;}
 }
 returnGame(){if(this.closed)return;this.pause();this.saSerial++;this.saAbort?.abort();if(this.saLoading){this.unsubscribe?.();this.unsubscribe=undefined;void this.spanish?.close();this.spanish=undefined;this.saLoading=false;}this.mode='game';this.emit();}
 async replay(){if(this.closed)return false;for(const id of this.branches.keys())this.cancelBranch(id);this.saSerial++;this.saAbort?.abort();this.unsubscribe?.();this.unsubscribe=undefined;const sa=this.spanish;this.spanish=undefined;this.saLoading=false;this.mode='game';this.failure=null;this.lastNow=null;this.state=p052Reduce(this.state,{type:'replay',epoch:this.state.epoch});this.emit();await Promise.all([...this.retiring,sa?.close()]);return true;}
 async close(){if(this.closed)return;this.closed=true;this.saSerial++;this.saAbort?.abort();this.unsubscribe?.();for(const id of this.branches.keys())this.cancelBranch(id);this.state=p052Reduce(this.state,{type:'leave',epoch:this.state.epoch});await Promise.all([...this.retiring,this.spanish?.close()]);this.spanish=undefined;this.saLoading=false;this.lastNow=null;}
}
