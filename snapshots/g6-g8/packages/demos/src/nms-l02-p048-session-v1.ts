import {P048AudioTransport,type P048TransportDependencies} from './nms-l02-p048-audio-transport-v1';
import {p048AudioWindow} from './nms-l02-p048-audio-window-v1';
import {p048ClockInitial,p048ClockPlay,p048ClockPause,p048ClockSync,p048ClockEvent,p048ClockDuration,p048ClockMainFrame} from './nms-l02-p048-clock-v1';
import type {P048Event} from './nms-l02-p048-practice-v1';
type Transport=Pick<P048AudioTransport,'play'|'pause'|'stop'|'close'|'setVolume'|'snapshot'|'currentTime'>;
/** Native orchestration. Rendering calls tick; no hidden timers or onended-driven question changes. */
export class P048Session {
 private clock= p048ClockInitial();
 private audio:Transport;
 private operation=0;
 private closed=false;
 private running=false;
 private loading=false;
 private wrongBranch=0;
 private feedbackRng:number;
 private failure:string|null=null;
 private volume=0.8;
 private narrationEnabled=true;
 constructor(deps:P048TransportDependencies,seed=0,transport?:Transport){this.clock=p048ClockInitial(seed);this.feedbackRng=seed;this.audio=transport??new P048AudioTransport(deps);}
 snapshot(){return {state:this.clock.state,frame:p048ClockMainFrame(this.clock),elapsed:this.clock.elapsed,running:this.running,loading:this.loading,closed:this.closed,wrongBranch:this.wrongBranch,failure:this.failure,narrationEnabled:this.narrationEnabled};}
 async play(){
  if(this.closed||this.loading||this.running||this.clock.state.helpOpen)return;
  const window=p048AudioWindow(this.clock.state.phase,this.wrongBranch);
  if(!window&&!p048ClockDuration(this.clock))return;
  const operation=++this.operation;this.loading=true;this.failure=null;
  try{
   const elapsed=this.clock.state.phase==='wrong-feedback'?this.audio.snapshot().elapsed:this.clock.elapsed;
   if(window)await this.audio.play(window,elapsed);
   if(this.closed||operation!==this.operation)return;
   this.clock=p048ClockPlay(this.clock,this.audio.currentTime());
   this.running=true;
  }catch(error){if(operation===this.operation&&!this.closed){this.failure=error instanceof Error?error.message:'P048_AUDIO_FAILED';this.running=false;}}
  finally{if(operation===this.operation)this.loading=false;}
 }
 pause(){
  if(this.closed)return;
  this.operation++;this.loading=false;this.clock=p048ClockPause(this.clock,this.audio.currentTime());this.audio.pause();this.running=false;
 }
 async tick(){
  if(this.closed||!this.running)return;
  const before=this.clock.state.token;this.clock=p048ClockSync(this.clock,this.audio.currentTime());
  if(this.clock.state.token!==before){this.audio.stop();this.running=false;await this.play();}
  else if(this.clock.state.phase==='wrong-feedback'&&!this.audio.snapshot().playing)this.running=false;
 }
 async event(event:P048Event){
  if(this.closed)return;
  // Timer completion belongs exclusively to the clock.
  if(event.type==='phase-finished'||event.type==='intro-finished')return;
  this.pause();const previous=this.clock.state;
  this.clock=p048ClockEvent(this.clock,event,this.audio.currentTime());
  if(this.clock.state.token!==previous.token)this.audio.stop();
  if(event.type==='replay'){this.feedbackRng=this.clock.state.seed;this.wrongBranch=0;}
  if(previous.phase==='ready'&&this.clock.state.phase==='wrong-feedback'){
   this.feedbackRng=(Math.imul(this.feedbackRng,1664525)+1013904223)>>>0;
   this.wrongBranch=Math.floor(this.feedbackRng/0x100000000*4);
  }
  if(this.clock.state!==previous&&!this.clock.state.helpOpen)await this.play();
 }
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw Error('P048_VOLUME');this.volume=value;this.audio.setVolume(this.narrationEnabled?value:0);}
 setNarration(enabled:boolean){this.narrationEnabled=enabled;this.audio.setVolume(enabled?this.volume:0);}
 async close(){if(this.closed)return;this.pause();this.closed=true;await this.audio.close();}
}
