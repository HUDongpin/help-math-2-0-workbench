import {createP052State,reduceP052,type P052Event,type P052State} from './nms-l02-p052-state-v1';
import {P052_AUDIO_WINDOWS} from './generated/nms-l02-p052-runtime-audio-v1';
import type {P052AudioSession} from './nms-l02-p052-audio-session-v1';
import {p052FeedbackClock} from './nms-l02-p052-feedback-clock-v1';
type Session=Pick<P052AudioSession,'play'|'pause'|'resume'|'cancel'|'close'|'setVolume'>;
export type P052UserEvent=Exclude<P052Event,{type:'frame'|'intro-ready'|'outro-ended'}>;
/** Host calls tick from requestAnimationFrame; no timer chains or synthesized
 * completion on failed audio. Narration and click sessions have separate owners. */
export class P052Controller {
 private state:P052State;
 private elapsed=0;
 private anchor:number|null=null;
 private natural=false;
 private started=false;
 private closed=false;
 private generation=0;
 private operation=0;
 private clickGeneration=0;
 private loading=false;
 private error:string|null=null;
 private clickError=false;
 private volume=0.8;
 private narrationEnabled=true;
 constructor(private readonly deps:{narration:Session;click:Session;now:()=>number;changed:()=>void},seed=0){this.state=createP052State(seed);}
 snapshot(){return {state:this.state,started:this.started,closed:this.closed,loading:this.loading,error:this.error,clickError:this.clickError,
  narrationEnabled:this.narrationEnabled,narrationPlaying:this.anchor!==null&&!this.natural&&!this.state.paused&&!this.closed&&!this.loading&&!this.error&&this.narrationEnabled,
  feedback:this.state.phase==='wrong'||this.state.phase==='right'?p052FeedbackClock(this.state.phase,Math.floor(this.elapsed*12+1e-7)):null};}
 private notify(){this.deps.changed();}
 setVolume(value:number){this.deps.click.setVolume(value);this.volume=value;this.deps.narration.setVolume(this.narrationEnabled?value:0);}
 setNarration(enabled:boolean){this.narrationEnabled=enabled;this.deps.narration.setVolume(enabled?this.volume:0);this.notify();}
 private accumulate(){if(this.anchor!==null){const now=this.deps.now();this.elapsed+=Math.max(0,now-this.anchor);this.anchor=now;}}
 tick(){
  if(this.closed||this.state.paused)return;
  this.accumulate();const phase=this.state.phase;
  if(phase==='intro'||phase==='outro'){
   const start=phase==='intro'?1:116,end=phase==='intro'?115:156;
   const frame=Math.min(end,start+Math.floor(this.elapsed*12+1e-7));
   if(frame!==this.state.frame)this.state=reduceP052(this.state,{type:'frame',frame,epoch:this.state.epoch});
   if(frame===end&&this.natural){
    this.state=reduceP052(this.state,{type:phase==='intro'?'intro-ready':'outro-ended',epoch:this.state.epoch});
    this.anchor=null;this.generation++;this.operation++;this.loading=false;
   }
  }
  this.notify();
 }
 async start(){if(this.closed||this.started||this.state.paused)return;this.started=true;await this.beginCue();}
 private async beginCue(){
  const generation=++this.generation;this.operation++;this.deps.narration.cancel();
  this.elapsed=0;this.anchor=null;this.natural=false;this.error=null;
  const id=this.state.audioCue;
  if(!id){this.loading=false;this.notify();return;}
  if(!Object.hasOwn(P052_AUDIO_WINDOWS,id))throw Error('P052_CONTROLLER_CUE');
  const cue=P052_AUDIO_WINDOWS[id as keyof typeof P052_AUDIO_WINDOWS];
  this.loading=true;this.notify();const operation=this.operation;
  try{
   const played=await this.deps.narration.play(cue,()=>{
    if(this.closed||generation!==this.generation)return;this.natural=true;this.tick();
   });
   if(this.closed||generation!==this.generation||operation!==this.operation)return;
   this.loading=false;if(played&&!this.state.paused)this.anchor=this.deps.now();
   else if(!this.state.paused)this.error='audio-unavailable';
  }catch{if(!this.closed&&generation===this.generation&&operation===this.operation){this.loading=false;this.error='audio-unavailable';}}
  this.notify();
 }
 private async resume(){
  const generation=this.generation,operation=++this.operation;this.loading=true;this.error=null;this.notify();
  try{
   const played=this.natural?true:await this.deps.narration.resume();
   if(this.closed||generation!==this.generation||operation!==this.operation)return;
   this.loading=false;if(played&&!this.state.paused)this.anchor=this.deps.now();
   else if(!this.state.paused)this.error='audio-unavailable';
  }catch{if(!this.closed&&generation===this.generation&&operation===this.operation){this.loading=false;this.error='audio-unavailable';}}
  this.notify();
 }
 private async click(id:'click'|'wrong-close-click'|'right-close-click'){
  const generation=++this.clickGeneration;this.clickError=false;
  try{await this.deps.click.play(P052_AUDIO_WINDOWS[id],()=>{});}
  catch{if(!this.closed&&generation===this.clickGeneration){this.clickError=true;this.notify();}}
 }
 async dispatch(event:P052UserEvent,options:{autoplayReplay?:boolean}={}){
  if(this.closed||event.epoch!==this.state.epoch)return;
  // Runtime callers cannot forge controller-owned completion events.
  if(['frame','intro-ready','outro-ended'].includes(event.type))throw Error('P052_CONTROLLER_EVENT');
  if(event.type==='pause'&&event.paused===this.state.paused)return;
  this.tick();const before=this.state,after=reduceP052(before,event);if(after===before)return;
  this.state=after;
  if(event.type==='replay'){
   this.clickGeneration++;this.deps.click.cancel();this.clickError=false;this.started=true;
   if(options.autoplayReplay===false){
    // Reset without briefly starting audio or moving a frame. Play remains explicit.
    this.generation++;this.operation++;this.deps.narration.cancel();this.started=false;
    this.elapsed=0;this.anchor=null;this.natural=false;this.loading=false;this.error=null;
    this.state=reduceP052(this.state,{type:'pause',paused:true,epoch:this.state.epoch});
    this.notify();return;
   }
   await this.beginCue();return;
  }
  if(event.type==='pause'){
   if(after.paused){this.operation++;this.anchor=null;this.loading=false;this.deps.narration.pause();
    this.clickGeneration++;this.deps.click.cancel();}
   else if(!this.started)await this.start();
   else if(after.audioCue)await this.resume();
   this.notify();return;
  }
  if(event.type==='submit'||event.type==='reset'||event.type==='open-help'||event.type==='close-help')void this.click('click');
  if(event.type==='close-feedback')void this.click(before.phase==='wrong'?'wrong-close-click':'right-close-click');
  if(after.audioCue!==before.audioCue||after.phase!==before.phase)await this.beginCue();
  this.notify();
 }
 async close(){if(this.closed)return;this.closed=true;this.generation++;this.operation++;this.clickGeneration++;
  this.anchor=null;this.loading=false;await Promise.all([this.deps.narration.close(),this.deps.click.close()]);}
}
