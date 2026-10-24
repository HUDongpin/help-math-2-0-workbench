import {SourceStreamRunsClockV1,type SourceStreamRunsClockPlan} from './source-stream-runs-clock-v1';
import {DecodedSourceStreamTransport} from './decoded-source-stream-transport';
import {ALG_L07_P046_SOURCE as S,p046InitialState,p046Reduce,p046Branch,p046CanPlay,type P046State,type P046Event,type P046FeedbackId,type P046PointName,type P046Point,type P046Term,type P046Draw} from './alg-l07-p046-state-v1';
export type P046Clock=Pick<SourceStreamRunsClockV1,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type P046Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
type Domain=288|P046FeedbackId;
type Event=P046Event extends infer E?E extends P046Event?Omit<E,'epoch'>:never:never;
interface Spec {id:Domain;key:string;frame:number;serial:number;running:boolean;plan:SourceStreamRunsClockPlan;}
interface Run {spec:Spec;controller:AbortController;clock?:P046Clock;busy:boolean;promise?:Promise<boolean>;}
export interface P046SessionOptions {
 load:(id:Domain|'sa',signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;draw?:P046Draw;
 makeClock?:(plan:SourceStreamRunsClockPlan)=>P046Clock;makeSpanish?:()=>P046Spanish;
}
/** This source permits repeated right submissions while prior right clips run.
 * Only native sample scheduling is shared; no single-active-feedback wrapper
 * can own these independently restarted MovieClips. */
export class P046Session {
 private state=p046InitialState();private runs=new Map<Domain,Run>();private retiring=new Set<Promise<void>>();
 private closed=false;private volume=.8;private failure:string|null=null;private mode:'main'|'sa'='main';
 private busy=false;private token=0;private spanish?:P046Spanish;private unsubscribe?:()=>void;private pending?:AbortController;
 constructor(private readonly options:P046SessionOptions){}
 private emit(){if(!this.closed)this.options.changed();}
 private reduce(e:Event){const before=this.state;this.state=p046Reduce(before,{...e,epoch:before.epoch} as P046Event,this.options.draw);return before!==this.state;}
 snapshot(){const domains=[...this.runs.values()].map(r=>({id:r.spec.id,key:r.spec.key,serial:r.spec.serial,loading:r.busy,observation:r.clock?.snapshot()??null}));const sa=this.spanish?.snapshot();
  return {state:this.state,frame:this.state.mainFrame,mode:this.mode,phase:this.closed?'closed':this.failure?'failed':this.busy||domains.some(r=>r.loading)?'loading':this.mode==='sa'?(sa?.phase??'idle'):this.state.phase==='ended'?'ended':this.state.playing?'playing':'paused',
   loading:this.busy||domains.some(r=>r.loading),failure:this.failure,domains,clockCount:this.runs.size,spanishPhase:sa?.phase??'idle',lessonCompleted:false};
 }
 private specs():Spec[]{
  const inputs:[Domain,number,number,number,boolean][]=[];
  if(this.state.phase!=='ended'&&this.state.phase!=='left')inputs.push([288,this.state.phase==='prequiz'||this.state.phase==='quiz-held'?318:641,this.state.mainFrame,0,this.state.mainRunning]);
  for(const f of this.state.feedback){const b=p046Branch(f.spriteId);inputs.push([f.spriteId,b.kind==='wrong'&&!f.closing?b.hold:b.terminal,f.frame,f.serial,f.running]);}
  return inputs.map(([id,last,frame,serial,running])=>{const c=S.clocks.find(c=>c.spriteId===id)!;return {id,key:`${id}:${last}:${serial}`,frame,serial,running,
   plan:{version:1,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:last,fps:12,decoder:c.decoder,segments:c.segments.filter(s=>s.firstFrame<=last),emptyNegativeBlocks:c.emptyNegativeBlocks.filter(b=>b.frame<=last),alignmentStatus:'source-run-candidate-not-original-runtime-accepted'}};});
 }
 private closeTransport(c:P046Clock|P046Spanish){const pending=c.close();this.retiring.add(pending);void pending.finally(()=>this.retiring.delete(pending));return pending;}
 private retire(r:Run){r.controller.abort();if(this.runs.get(r.spec.id)===r)this.runs.delete(r.spec.id);if(r.clock)void this.closeTransport(r.clock);}
 private current(r:Run){return !this.closed&&!r.controller.signal.aborted&&this.runs.get(r.spec.id)===r;}
 private pauseRuns(){for(const r of [...this.runs.values()]){if(r.busy)this.retire(r);else r.clock?.pause();}}
 private cancelAuxiliary(){this.token++;this.pending?.abort();this.pending=undefined;if(this.busy&&this.spanish){this.unsubscribe?.();this.unsubscribe=undefined;void this.closeTransport(this.spanish);this.spanish=undefined;}this.busy=false;}
 private async start(r:Run,user:boolean){r.busy=true;
  try{if(!r.clock){const bytes=await this.options.load(r.spec.id,r.controller.signal);if(!this.current(r))return false;
    const clock=this.options.makeClock?.(r.spec.plan)??new SourceStreamRunsClockV1(r.spec.plan,{commitHeldFrame:f=>Number.isSafeInteger(f)&&f>=1&&f<=r.spec.plan.lastFrame});r.clock=clock;clock.setVolume(this.volume);
    const prepared=await clock.prepare(bytes);if(!this.current(r))return false;if(!prepared.accepted)throw Error(prepared.reason);
    const seek=clock.seekCandidateFrame(r.spec.frame);if(!seek.accepted)throw Error(seek.reason);
   }
   if(!this.current(r)||!this.state.playing||this.mode!=='main')return false;
   const played=await r.clock.play({activation:user?'user':'automatic',reducedMotion:false});if(!this.current(r))return false;if(!played.accepted)throw Error(played.reason);
   r.busy=false;this.emit();return true;
  }catch(error){if(!this.current(r))return false;this.retire(r);this.reduce({type:'pause'});this.pauseRuns();this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}
 }
 private sync(user=false):Promise<boolean>{if(this.closed)return Promise.resolve(false);const desired=this.specs();
  for(const r of [...this.runs.values()])if(!desired.some(s=>s.key===r.spec.key))this.retire(r);
  const jobs:Promise<boolean>[]=[];
  for(const spec of desired){let r=this.runs.get(spec.id);const run=spec.running&&this.state.playing&&!this.state.glossary&&this.mode==='main';
   if(!run){if(r?.busy)this.retire(r);else r?.clock?.pause();continue;}
   if(!r){r={spec,controller:new AbortController(),busy:false};this.runs.set(spec.id,r);}
   if(r.busy){if(r.promise)jobs.push(r.promise);continue;}
   if(r.clock?.snapshot().phase==='playing')continue;
   r.promise=this.start(r,user);jobs.push(r.promise);
  }
  this.emit();return Promise.all(jobs).then(results=>results.every(Boolean));
 }
 tick(){if(this.closed||this.busy||this.mode==='sa'||!this.state.playing)return;let changed=false;
  for(const r of [...this.runs.values()]){if(r.busy||!r.clock||!this.current(r))continue;const spec=this.specs().find(s=>s.key===r.spec.key);if(!spec?.running)continue;
   const o=r.clock.snapshot();if(o.failure||!['playing','timeline-ended'].includes(o.phase)){this.failure=o.failure;this.reduce({type:'pause'});this.pauseRuns();this.emit();return;}
   changed=this.reduce(r.spec.id===288?{type:'advance-main',frame:o.frame}:{type:'advance-feedback',spriteId:r.spec.id,serial:r.spec.serial,frame:o.frame})||changed;
  }
  if(changed)void this.sync();
 }
 async play(){if(this.closed||this.busy)return false;
  if(this.mode==='sa'){const sa=this.spanish;if(!sa)return false;if(sa.snapshot().phase==='buffer-ended')sa.replay();const ticket=this.token;const r=await sa.play({activation:'user',reducedMotion:false});if(this.closed||ticket!==this.token)return false;this.emit();return r.accepted;}
  if(!p046CanPlay(this.state))return false;this.failure=null;this.reduce({type:'play'});return this.sync(true);
 }
 pause(){if(this.closed)return;this.tick();this.cancelAuxiliary();this.reduce({type:'pause'});this.pauseRuns();this.spanish?.pause();this.emit();}
 private interaction(e:Event){if(this.closed||this.busy||this.mode==='sa')return false;this.tick();const changed=this.reduce(e);if(changed)this.emit();return changed;}
 namedPoint(name:P046PointName){return this.interaction({type:'named-point',name});}
 backgroundPoint(point:P046Point){return this.interaction({type:'background-point',point});}
 clonePoint(name:string){return this.interaction({type:'clone-point',name});}
 async submit(){if(!this.interaction({type:'submit'}))return false;this.failure=null;return this.sync(true);}
 async closeFeedback(spriteId:P046FeedbackId){if(!this.interaction({type:'close-feedback',spriteId}))return false;return this.sync(true);}
 // Source Help and instruction overlays do not pause independently playing feedback.
 openHelp(){return this.interaction({type:'open-help'});}
 closeHelp(){return this.interaction({type:'close-help'});}
 closePrompt(){return this.interaction({type:'close-prompt'});}
 openGlossary(term:P046Term){if(this.closed||this.busy||this.mode==='sa'||this.state.glossary||!S.terms.some(t=>t.sourceActionKey===term))return false;this.pause();const changed=this.reduce({type:'open-glossary',term});this.emit();return changed;}
 closeGlossary(){if(this.closed||this.mode==='sa')return false;const changed=this.reduce({type:'close-glossary'});this.emit();return changed;}
 async spanishAudio(){if(this.closed||this.busy||this.state.glossary)return false;this.pause();this.mode='sa';this.failure=null;const ticket=this.token,controller=new AbortController();this.pending=controller;this.busy=true;this.emit();
  const current=()=>!this.closed&&this.token===ticket&&!controller.signal.aborted&&this.mode==='sa';
  try{let sa=this.spanish;if(!sa){const bytes=await this.options.load('sa',controller.signal);if(!current())return false;
    sa=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(S.sa);this.spanish=sa;sa.setVolume(this.volume);this.unsubscribe=sa.subscribe(()=>{if(this.spanish===sa)this.emit();});
    const prepared=await sa.prepare(bytes);if(!current())return false;if(!prepared.accepted)throw Error(prepared.reason);
   }else sa.replay();
   const played=await sa.play({activation:'user',reducedMotion:false});if(!current())return false;if(!played.accepted)throw Error(played.reason);this.busy=false;this.pending=undefined;this.emit();return true;
  }catch(error){if(!current())return false;this.unsubscribe?.();this.unsubscribe=undefined;const sa=this.spanish;this.spanish=undefined;if(sa)await this.closeTransport(sa);if(!current())return false;this.busy=false;this.pending=undefined;this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}
 }
 returnMain(){if(this.closed)return;this.pause();this.mode='main';this.emit();}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));for(const r of this.runs.values())r.clock?.setVolume(this.volume);this.spanish?.setVolume(this.volume);this.emit();}
 async replay(){if(this.closed)return false;this.cancelAuxiliary();for(const r of [...this.runs.values()])this.retire(r);this.unsubscribe?.();this.unsubscribe=undefined;if(this.spanish)void this.closeTransport(this.spanish);this.spanish=undefined;
  this.mode='main';this.reduce({type:'replay'});this.failure=null;this.busy=true;const ticket=this.token;this.emit();await Promise.all([...this.retiring]);if(this.closed||ticket!==this.token)return false;this.busy=false;return this.play();
 }
 /** Local inspection preserves the unanswered source stop and closes old clocks. */
 inspect(frame:number){if(this.closed||this.busy||this.state.feedback.length||this.state.glossary||this.state.help||this.mode==='sa'||!Number.isSafeInteger(frame)||frame<this.state.mainFrame||frame>641||this.state.phase==='quiz-held'||this.state.phase==='ended')return false;
  this.pause();for(const r of [...this.runs.values()])this.retire(r);this.reduce({type:'play'});this.reduce({type:'advance-main',frame});this.reduce({type:'pause'});this.emit();return this.state.mainFrame===frame;
 }
 async close(){if(this.closed)return;this.cancelAuxiliary();for(const r of [...this.runs.values()])this.retire(r);this.unsubscribe?.();this.unsubscribe=undefined;if(this.spanish)void this.closeTransport(this.spanish);this.spanish=undefined;this.reduce({type:'leave'});this.closed=true;await Promise.all([...this.retiring]);}
}
