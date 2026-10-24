import type {LessonHostDecision, LessonHostRequest} from './lesson-host-contract';
import {sourceGlossaryControlsAtFrame, type SourceGlossaryControlPage} from './source-glossary-controls';

export interface GlossaryTransportSnapshot {
  phase: 'paused'|'loading'|'playing'|'ended'|'error'|'closed';
  frame:number; timelineSample:number; volume:number; error:string|null;
}
export interface GlossaryTransport {
  snapshot():GlossaryTransportSnapshot;
  play():Promise<boolean>; pause():void; reset():void; seekFrame(frame:number):void;
  setVolume(volume:number):void; close():Promise<void>;
}
export interface SourceGlossarySessionOptions {
  page:SourceGlossaryControlPage; transport:GlossaryTransport;
  request:(request:LessonHostRequest,context?:{trigger?:HTMLElement})=>LessonHostDecision|void;
  paused:(paused:boolean)=>void;
  complete:()=>void;
}

/** Modern product ownership shared by two source glossary pages. Source stop
 * becomes pause-before-open; Close stays paused until explicit Play. This
 * policy is not an assertion about the legacy host's close/resume behavior. */
export class SourceGlossarySession {
  private ready=false;
  private closed=false;
  private command=0;
  private lastPhase:GlossaryTransportSnapshot['phase']='paused';
  private pending:{entryId:string;trigger?:HTMLElement}|null=null;
  private completionArmed=false;
  constructor(private readonly options:SourceGlossarySessionOptions) {}
  snapshot(){return this.options.transport.snapshot();}
  get glossary(){return this.pending;}
  get isReady(){return this.ready&&!this.closed;}
  setReady(ready:boolean){this.ready=ready;if(!ready)this.pause();}
  setVolume(volume:number){if(!this.closed)this.options.transport.setVolume(volume);}
  pause(){
    if(this.closed)return;
    this.command++;this.options.transport.pause();this.lastPhase=this.snapshot().phase;
    this.options.paused(true);
  }
  async play():Promise<boolean>{
    if(this.closed||!this.ready||this.pending)return false;
    if(this.snapshot().phase==='ended')this.options.transport.reset();
    const command=++this.command;
    this.completionArmed=true;
    this.options.paused(false);
    const result=await this.options.transport.play();
    if(this.closed||command!==this.command)return false;
    this.lastPhase=this.snapshot().phase;
    this.options.paused(!result||this.lastPhase!=='playing');
    return result;
  }
  openGlossary(entryId:string,trigger?:HTMLElement):LessonHostDecision|void{
    if(this.closed||!this.ready||this.pending)return;
    const frame=this.snapshot().frame;
    const controls=sourceGlossaryControlsAtFrame(this.options.page,frame,this.options.page.frameDomain);
    if(!controls.some(control=>control.entryId===entryId))return;
    this.pause();
    const result=this.options.request({type:'open-glossary',entryId},{trigger});
    if(result?.status==='allowed')this.pending={entryId,trigger};
    return result;
  }
  closeGlossary(notifyHost=true){
    const pending=this.pending;
    if(!pending)return;
    this.pending=null;
    if(notifyHost)this.options.request({type:'close-glossary'});
    this.pause();
    return pending.trigger;
  }
  seekFrame(frame:number){
    if(this.closed||!this.ready||this.pending||!Number.isSafeInteger(frame)||frame<1||frame>this.options.page.frameCount)return false;
    this.pause();this.completionArmed=false;this.options.transport.seekFrame(frame);
    this.lastPhase=this.snapshot().phase;return true;
  }
  async replay(){
    if(this.closed||!this.ready)return false;
    this.closeGlossary();this.pause();this.options.transport.reset();
    this.lastPhase=this.snapshot().phase;
    return this.play();
  }
  tick(){
    if(this.closed)return;
    const state=this.snapshot();
    if(this.lastPhase==='playing'&&state.phase!=='playing'){
      this.options.paused(true);
      if(state.phase==='ended'&&this.completionArmed){this.completionArmed=false;this.options.complete();}
    }
    this.lastPhase=state.phase;
    return state;
  }
  stop(){this.closeGlossary();this.pause();this.completionArmed=false;}
  async close(){
    if(this.closed)return;
    this.stop();this.closed=true;this.command++;this.ready=false;
    await this.options.transport.close();
  }
}
