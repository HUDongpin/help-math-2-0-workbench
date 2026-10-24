import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P062_AUDIO} from './alg-l07-p062-audio-v1';
import {p062InitialState,p062Reduce,p062Score,p062Time,p062Random,type P062State,type P062Option} from './alg-l07-p062-state-v1';
import type {P062AudioTarget} from './alg-l07-p062-content-v1';
export type P062Transport = Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P062SessionOptions {
 readonly seed?:number;readonly randomIndex?:(length:number)=>number;readonly now?:()=>number;
 readonly load:(id:string,signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:()=>void;
 readonly makeTransport?:(binding:DecodedSourceStreamBinding)=>P062Transport;
}
type Active = {readonly serial:number;readonly id:string;readonly target:P062AudioTarget;readonly abort:AbortController;readonly transport:P062Transport;unsubscribe:()=>void;loading:boolean;paused:boolean};
export function p062AudioId(t:P062AudioTarget){
 if(!['en','es'].includes(t.language)||!Number.isInteger(t.questionId)||t.questionId<1||t.questionId>30||t.option!==null&&![1,2,3,4].includes(t.option))return null;
 const id=`${t.language}-q${t.questionId}-${t.option===null?'question':'abcd'[t.option-1]}`;
 return P062_AUDIO[id]?id:null;
}
export class P062Session {
 private state:P062State;private randomIndex:(length:number)=>number;private start:number;private lastTime:number;private finishElapsed:number|null=null;
 private active?:Active;private serial=0;private closed=false;private volume=.8;private failure:string|null=null;private retiring=new Set<Promise<void>>();
 constructor(private readonly options:P062SessionOptions){this.randomIndex=options.randomIndex??p062Random(options.seed??0);this.state=p062InitialState(this.randomIndex(30));this.start=this.lastTime=this.now();}
 private now(){const n=this.options.now?.()??performance.now();if(!Number.isFinite(n)||n<0)throw RangeError('P062_CLOCK');return n;}
 private emit(){if(!this.closed)this.options.changed();}
 private elapsed(){const now=this.now();if(now<this.lastTime)throw Error('P062_CLOCK_REGRESSION');this.lastTime=now;return now-this.start;}
 snapshot(){const a=this.active,obs=a?.transport.snapshot(),elapsed=this.elapsed();return{state:this.state,frame:this.state.currentQuestionId+1,phase:this.closed?'closed':this.state.phase==='exited'?'ended':a?.loading?'loading':obs?.phase==='playing'?'playing':'paused',elapsedMs:elapsed,elapsedDisplay:p062Time(elapsed),finishElapsedMs:this.finishElapsed,score:p062Score(this.state),audio:a?{id:a.id,target:a.target,phase:a.loading?'loading':obs?.phase??'idle',decodedSample:obs?.decodedSample??0,paused:a.paused}:null,failure:this.failure,lessonCompleted:false as const};}
 tick(){if(this.closed)return;this.elapsed();this.emit();}
 private retire(){const a=this.active;if(!a)return;this.active=undefined;a.abort.abort();a.unsubscribe();const closing=a.transport.close();this.retiring.add(closing);void closing.then(()=>this.retiring.delete(closing),()=>this.retiring.delete(closing));}
 private current(a:Active){return!this.closed&&this.active===a&&!a.abort.signal.aborted;}
 async audio(target:P062AudioTarget){
  if(this.closed||this.state.phase!=='question'||target.questionId!==this.state.currentQuestionId)return false;
  const id=p062AudioId(target);if(!id)return false;
  const old=this.active,toggle=old?.id===id&&!old.paused;
  this.retire();this.serial++;this.failure=null;
  if(toggle){this.emit();return true;}
  const abort=new AbortController(),transport=this.options.makeTransport?.(P062_AUDIO[id]!)??new DecodedSourceStreamTransport(P062_AUDIO[id]!);
  transport.setVolume(this.volume);const a:Active={serial:this.serial,id,target,abort,transport,unsubscribe:()=>{},loading:true,paused:false};this.active=a;
  a.unsubscribe=transport.subscribe(()=>{if(!this.current(a))return;const s=transport.snapshot();if(s.phase==='buffer-ended'){this.retire();this.emit();return;}if(s.failure)this.failure=s.failure;this.emit();});this.emit();
  try{const bytes=await this.options.load(id,abort.signal);if(!this.current(a))return false;const ready=await transport.prepare(bytes);if(!this.current(a))return false;if(!ready.accepted)throw Error(ready.reason);a.loading=false;
   if(!a.paused){const played=await transport.play({activation:'user',reducedMotion:false});if(!this.current(a))return false;if(!played.accepted)throw Error(played.reason);}
   this.emit();return true;
  }catch(error){if(!this.current(a))return false;this.failure=error instanceof Error?error.message:String(error);this.retire();this.emit();return false;}
 }
 choose(questionId:number,option:P062Option){
  if(this.closed||this.state.phase!=='question'||this.state.currentQuestionId!==questionId||![1,2,3,4].includes(option))return false;
  const nextIndex=this.state.responses.length<9?this.randomIndex(this.state.remaining.length):undefined;
  const next=p062Reduce(this.state,{type:'choose',epoch:this.state.epoch,questionId,option,...(nextIndex!==undefined?{nextIndex}:{})});if(next===this.state)return false;this.state=next;
  if(next.phase==='finish')this.finishElapsed=this.elapsed();
  // doGetRandomQuiz does not stop the global sound. It may finish over the next
  // question; a new audio click, Replay, explicit Stop or exit retires it.
  this.emit();return true;
 }
 pause(){if(this.closed)return;const a=this.active;if(a){a.paused=true;a.transport.pause();}this.emit();}
 async play(){const a=this.active;if(this.closed||!a||a.loading)return false;a.paused=false;a.transport.replay();const r=await a.transport.play({activation:'user',reducedMotion:false});if(!this.current(a))return false;if(!r.accepted){this.failure=r.reason;a.paused=true;}this.emit();return r.accepted;}
 stopAudio(){if(this.closed)return;this.serial++;this.retire();this.emit();}
 setVolume(v:number){if(this.closed||!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));this.active?.transport.setVolume(this.volume);}
 async replay(){if(this.closed)return false;this.retire();this.serial++;this.failure=null;this.finishElapsed=null;
  this.state=p062Reduce(this.state,{type:'replay',epoch:this.state.epoch,firstIndex:this.randomIndex(30)});this.start=this.lastTime=this.now();const epoch=this.state.epoch;this.emit();await Promise.all([...this.retiring]);return!this.closed&&this.state.epoch===epoch;
 }
 async continue(){if(this.closed||this.state.phase!=='finish')return false;this.state=p062Reduce(this.state,{type:'continue',epoch:this.state.epoch});this.retire();this.serial++;const epoch=this.state.epoch;this.emit();await Promise.all([...this.retiring]);return!this.closed&&this.state.epoch===epoch&&this.state.phase==='exited';}
 async close(){if(this.closed)return;this.closed=true;this.retire();this.serial++;this.state=p062Reduce(this.state,{type:'leave',epoch:this.state.epoch});await Promise.all([...this.retiring]);}
}
