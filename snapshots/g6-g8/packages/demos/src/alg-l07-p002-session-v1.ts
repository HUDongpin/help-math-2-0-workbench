import {SourceStreamRunsClockV1} from './source-stream-runs-clock-v1';
import {ALG_L07_P002_SOURCE as SOURCE} from './generated/alg-l07-p002-source-v1';
export interface AlgL07P002SessionDependencies{
  read(signal:AbortSignal):Promise<ArrayBuffer>;
  changed():void;
  commitFrame(frame:number):boolean;
  createContext?:()=>AudioContext;
}
/** Page-owned lifecycle around the existing source stream runs clock. */
export class AlgL07P002Session{
  private clock:SourceStreamRunsClockV1|null=null;
  private pending:AbortController|null=null;
  private epoch=0;private replayCount=0;private volume=.8;private closed=false;
  private loading=false;private failure:string|null=null;
  constructor(private readonly dependencies:AlgL07P002SessionDependencies){}
  snapshot(){
    const s=this.clock?.snapshot();
    return Object.freeze({phase:this.closed?'closed':this.loading?'loading':this.failure?'failed':s?.phase??'paused',
      frame:s?.frame??1,terminalHeld:s?.timelineReachedEnd??false,replay:this.replayCount,volume:this.volume,
      audioPhase:s?.audio.phase??'idle',decodedSample:s?.audio.decodedSample??1673,
      failure:this.failure??s?.failure??null,lessonCompleted:false as const});
  }
  private emit(){this.dependencies.changed();}
  async play(){
    if(this.closed||this.loading||this.clock?.snapshot().timelineReachedEnd)return false;
    const ticket=++this.epoch;const current=()=>!this.closed&&ticket===this.epoch;
    try{
      if(!this.clock){
        this.loading=true;this.failure=null;const controller=new AbortController();this.pending=controller;this.emit();
        const bytes=await this.dependencies.read(controller.signal);if(!current())return false;
        const clock:SourceStreamRunsClockV1=new SourceStreamRunsClockV1(SOURCE.clockPlan,{createContext:this.dependencies.createContext,
          commitHeldFrame:(frame):boolean=>!this.closed&&this.clock===clock&&this.dependencies.commitFrame(frame)});
        this.clock=clock;clock.setVolume(this.volume);
        const ready=await clock.prepare(bytes);if(!current())return false;
        if(!ready.accepted)throw Error(ready.reason);
        this.pending=null;this.loading=false;
      }
      const clock=this.clock;if(!clock||!current())return false;
      const started=await clock.play({activation:'user',reducedMotion:false});
      if(!current())return false;if(!started.accepted)throw Error(started.reason);
      this.failure=null;this.emit();return true;
    }catch(error){
      if(!current())return false;this.pending=null;this.loading=false;
      const clock=this.clock;this.clock=null;void clock?.close();
      this.failure=error instanceof Error?error.message:'source-unavailable';this.emit();return false;
    }
  }
  pause(){
    if(this.closed)return;this.epoch++;this.pending?.abort();this.pending=null;
    if(this.loading){const clock=this.clock;this.clock=null;this.loading=false;void clock?.close();}
    else this.clock?.pause();this.emit();
  }
  inspectFrame(frame:number){
    if(this.closed)return false;this.pause();const result=this.clock?.seekCandidateFrame(frame);this.emit();return result?.accepted??false;
  }
  async replay(){
    if(this.closed)return false;this.pause();this.replayCount++;this.failure=null;
    const ticket=this.epoch,clock=this.clock;this.clock=null;this.dependencies.commitFrame(1);this.emit();
    await clock?.close();if(this.closed||ticket!==this.epoch)return false;
    return this.play();
  }
  setVolume(value:number){
    if(this.closed||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));this.clock?.setVolume(this.volume);this.emit();
  }
  async close(){
    if(this.closed)return;this.pause();this.closed=true;const clock=this.clock;this.clock=null;this.emit();await clock?.close();
  }
}
