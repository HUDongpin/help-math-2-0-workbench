import {P049AudioTransport,type P049TransportDependencies} from './nms-l02-p049-audio-transport-v1';
import {p049PhaseWindow} from './nms-l02-p049-audio-window-v1';
import {p049ClockInitial,p049ClockPlay,p049ClockPause,p049ClockSync,p049ClockEvent,p049ClockDuration,p049ClockMainFrame} from './nms-l02-p049-clock-v1';
import {p049AnswerMatches,type P049Event} from './nms-l02-p049-practice-v1';
type Transport=Pick<P049AudioTransport,'play'|'pause'|'stop'|'close'|'setVolume'|'currentTime'>;
/** Native orchestration; rendering supplies ticks, and audio onended never changes a question.
 * Seeded feedback selection is a reproducibility adapter for source random(S1..S4).
 */
export class P049Session {
 private clock=p049ClockInitial();
 private audio:Transport;
 private operation=0;
 private closed=false;
 private running=false;
 private loading=false;
 private feedbackRng:number;
 private failure:string|null=null;
 private volume=.8;
 private narrationEnabled=true;
 constructor(deps:P049TransportDependencies,private readonly seed=0,transport?:Transport){
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('P049_SEED');
  this.feedbackRng=seed;this.audio=transport??new P049AudioTransport(deps);
 }
 snapshot(){return {state:this.clock.state,frame:p049ClockMainFrame(this.clock),elapsed:this.clock.elapsed,wrongBranch:this.clock.wrongBranch,running:this.running,loading:this.loading,closed:this.closed,failure:this.failure,narrationEnabled:this.narrationEnabled};}
 async play(){
  if(this.closed||this.loading||this.running||this.clock.state.helpOpen)return;
  const window=p049PhaseWindow(this.clock.state,this.clock.wrongBranch);
  if(!window||this.clock.elapsed>=p049ClockDuration(this.clock))return;
  const operation=++this.operation;this.loading=true;this.failure=null;
  try{
   const started=await this.audio.play(window,this.clock.elapsed);
   if(this.closed||operation!==this.operation)return;
   if(!started)throw Error('P049_AUDIO_NOT_STARTED');
   this.clock=p049ClockPlay(this.clock,this.audio.currentTime());this.running=this.clock.anchor!==null;
  }catch(error){if(operation===this.operation&&!this.closed){this.failure=error instanceof Error?error.message:'P049_AUDIO_FAILED';this.running=false;this.audio.stop();}}
  finally{if(operation===this.operation)this.loading=false;}
 }
 pause(){
  if(this.closed)return;
  this.operation++;this.loading=false;this.clock=p049ClockPause(this.clock,this.audio.currentTime());this.audio.pause();this.running=false;
 }
 async tick(){
  if(this.closed||!this.running)return;
  const before=this.clock.state.token;this.clock=p049ClockSync(this.clock,this.audio.currentTime());
  if(this.clock.state.token!==before){this.audio.stop();this.running=false;await this.play();}
  else if(this.clock.anchor===null){this.audio.stop();this.running=false;}
 }
 async event(event:P049Event){
  if(this.closed||event.type==='phase-finished')return;
  this.pause();const previous=this.clock.state;let branch=this.clock.wrongBranch;
  if(event.type==='submit'&&previous.phase==='ready'&&!previous.helpOpen&&!p049AnswerMatches(previous.question,previous.digits)){
   this.feedbackRng=(Math.imul(this.feedbackRng,1664525)+1013904223)>>>0;branch=Math.floor(this.feedbackRng/0x100000000*4);
  }
  this.clock=p049ClockEvent(this.clock,event,this.audio.currentTime(),branch);
  if(this.clock.state.token!==previous.token)this.audio.stop();
  if(event.type==='replay'){this.feedbackRng=this.seed;this.failure=null;}
  if(this.clock.state!==previous&&!this.clock.state.helpOpen)await this.play();
 }
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw Error('P049_VOLUME');this.volume=value;this.audio.setVolume(this.narrationEnabled?value:0);}
 setNarration(enabled:boolean){this.narrationEnabled=enabled;this.audio.setVolume(enabled?this.volume:0);}
 async close(){if(this.closed)return;this.pause();this.closed=true;await this.audio.close();}
}
