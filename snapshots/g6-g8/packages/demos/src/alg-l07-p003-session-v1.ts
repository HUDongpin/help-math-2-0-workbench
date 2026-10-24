import {SourceStreamRunsClockV1} from './source-stream-runs-clock-v1';
import {ALG_L07_P003_SOURCE as SOURCE} from './alg-l07-p003-source-v1';
export type P003TermKey='Function'|'Relation'|'Value';
type Clock=Pick<SourceStreamRunsClockV1,'snapshot'|'prepare'|'play'|'pause'|'replay'|'seekCandidateFrame'|'setVolume'|'close'>;
export interface P003Dependencies{read(signal:AbortSignal):Promise<ArrayBuffer>;changed():void;commitFrame(frame:number):boolean;
 createContext?:()=>AudioContext;createClock?:(commit:(frame:number)=>boolean)=>Clock;}
/** Page-owned asynchronous loading; source runs and native node retirement are shared. */
export class AlgL07P003Session{
 private clock:Clock|null=null;private pending:AbortController|null=null;private epoch=0;private replayCount=0;
 private volume=.8;private closed=false;private loading=false;private failure:string|null=null;private frame=1;private term:P003TermKey|null=null;
 constructor(private readonly dependencies:P003Dependencies){}
 private commit=(frame:number)=>{if(this.closed||!this.dependencies.commitFrame(frame))return false;this.frame=frame;return true;};
 snapshot(){const s=this.clock?.snapshot();return Object.freeze({phase:this.closed?'closed':this.loading?'loading':this.failure?'failed':s?.phase??'paused',frame:s?.frame??this.frame,
  replay:this.replayCount,glossary:this.term,volume:this.volume,audioPhase:s?.audio.phase??'idle',decodedSample:s?.audio.decodedSample??1673,
  failure:this.failure??s?.failure??null,lessonCompleted:false as const,sourceAlignment:'source-run-candidate-not-original-runtime-accepted' as const});}
 private emit(){this.dependencies.changed();}
 async play(){if(this.closed||this.loading||this.term||this.snapshot().frame===SOURCE.frameCount)return false;const ticket=++this.epoch;const current=()=>!this.closed&&ticket===this.epoch;
  try{if(!this.clock){const heldFrame=this.frame;this.loading=true;this.failure=null;const controller=new AbortController();this.pending=controller;this.emit();const bytes=await this.dependencies.read(controller.signal);if(!current())return false;
   const clock=this.dependencies.createClock?.(this.commit)??new SourceStreamRunsClockV1(SOURCE.clockPlan,{createContext:this.dependencies.createContext,commitHeldFrame:this.commit});this.clock=clock;clock.setVolume(this.volume);
   const ready=await clock.prepare(bytes);if(!current())return false;if(!ready.accepted)throw Error(ready.reason);this.pending=null;this.loading=false;
   if(heldFrame!==1&&!clock.seekCandidateFrame(heldFrame).accepted)throw Error('inspected-frame-unavailable');}
   const clock=this.clock;if(!clock||!current())return false;const started=await clock.play({activation:'user',reducedMotion:false});if(!current())return false;if(!started.accepted)throw Error(started.reason);this.failure=null;this.emit();return true;
  }catch(error){if(!current())return false;this.pending=null;this.loading=false;const clock=this.clock;this.clock=null;void clock?.close();this.failure=error instanceof Error?error.message:'source-unavailable';this.emit();return false;}}
 pause(){if(this.closed)return;this.epoch++;this.pending?.abort();this.pending=null;if(this.loading){const clock=this.clock;this.clock=null;this.loading=false;void clock?.close();}else this.clock?.pause();this.emit();}
 inspect(frame:number){if(this.closed||this.loading||this.term||!Number.isSafeInteger(frame)||frame<1||frame>2141)return false;this.pause();if(this.clock){if(!this.clock.seekCandidateFrame(frame).accepted)return false;}else if(!this.commit(frame))return false;this.frame=frame;this.emit();return true;}
 openGlossary(key:P003TermKey){if(this.closed||this.loading||this.term)return false;const frame=this.snapshot().frame;const rule=SOURCE.glossaryButtons.find(x=>x.key===key);if(!rule||!rule.frameRanges.some(([a,b])=>frame>=a&&frame<=b))return false;this.pause();this.term=key;this.emit();return true;}
 closeGlossary(){if(this.closed||!this.term)return false;this.term=null;this.pause();return true;}
 async replay(){if(this.closed)return false;this.pause();this.replayCount++;this.term=null;this.failure=null;const ticket=this.epoch,clock=this.clock;this.clock=null;this.frame=1;this.commit(1);this.emit();await clock?.close();if(this.closed||ticket!==this.epoch)return false;return this.play();}
 setVolume(value:number){if(this.closed||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));this.clock?.setVolume(this.volume);this.emit();}
 async close(){if(this.closed)return;this.pause();this.closed=true;this.term=null;const clock=this.clock;this.clock=null;this.emit();await clock?.close();}
}
