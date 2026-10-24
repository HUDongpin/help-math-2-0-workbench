import {SourceStreamCycleClockV1} from './source-stream-cycle-clock-v1';
import {ALG_L07_P001_SOURCE as SOURCE} from './generated/alg-l07-p001-source-v1';
export interface AlgL07P001SessionDependencies{
  read(signal:AbortSignal):Promise<ArrayBuffer>;
  changed():void;
  commitFrame(frame:number):boolean;
  createContext?:()=>AudioContext;
}
/** Page-owned lifecycle around the existing source stream cycle clock. */
export class AlgL07P001Session{
  private clock:SourceStreamCycleClockV1|null=null;
  private pending:AbortController|null=null;
  private epoch=0;private replayCount=0;private volume=.8;private closed=false;
  private loading=false;private failure:string|null=null;
  constructor(private readonly dependencies:AlgL07P001SessionDependencies){}
  snapshot(){
    const s=this.clock?.snapshot();
    return Object.freeze({phase:this.closed?'closed':this.loading?'loading':this.failure?'failed':s?.phase??'paused',
      frame:s?.frame??1,cycle:s?.cycleIndex??0,replay:this.replayCount,volume:this.volume,
      audioPhase:s?.audio.phase??'idle',decodedSample:s?.audio.decodedSample??1673,
      failure:this.failure??s?.failure??null,lessonCompleted:false as const});
  }
  private emit(){this.dependencies.changed();}
  async play(){
    if(this.closed||this.loading)return false;
    const ticket=++this.epoch;const current=()=>!this.closed&&ticket===this.epoch;
    try{
      if(!this.clock){
        this.loading=true;this.failure=null;const controller=new AbortController();this.pending=controller;this.emit();
        const bytes=await this.dependencies.read(controller.signal);if(!current())return false;
        const clock:SourceStreamCycleClockV1=new SourceStreamCycleClockV1(SOURCE.clockPlan,{createContext:this.dependencies.createContext,
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
