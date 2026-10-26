import {p040ClockInitial,p040ClockSync,p040ClockPlay,p040ClockPause,p040ClockOpenTerm,p040ClockCloseTerm,p040ClockReplay} from './nms-l02-p040-clock-v1';
import {p040DecodeAudio} from './nms-l02-p040-audio-decode-v1';
import type {P040Term} from './nms-l02-p040-state-v1';
export interface P040AudioDependencies {read:(signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;createContext?:()=>AudioContext}
export class P040SourceAudio {
 private clock=p040ClockInitial();private context:AudioContext|null=null;private gain:GainNode|null=null;private node:AudioBufferSourceNode|null=null;private buffer:AudioBuffer|null=null;
 private pending:AbortController|null=null;private ticket=0;private phase:'paused'|'loading'|'playing'|'terminal'|'failed'|'closed'='paused';private failure:string|null=null;private volume=.8;private narration=true;
 constructor(private readonly deps:P040AudioDependencies){}
 private emit(){if(this.phase!=='closed')this.deps.changed();}
 private stop(){const node=this.node;this.node=null;if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}}
 private cancel(){this.ticket++;this.pending?.abort();this.pending=null;}
 private sync(){if(this.phase==='playing'&&this.context){this.clock=p040ClockSync(this.clock,this.context.currentTime);if(this.clock.state.completed){this.phase='terminal';this.stop();}}}
 private startNode(){
  this.stop();if(!this.narration||!this.context||!this.gain||!this.buffer||this.phase!=='playing')return;
  const node=this.context.createBufferSource();node.buffer=this.buffer;node.connect(this.gain);this.node=node;
  node.onended=()=>{if(this.node===node){this.sync();this.emit();}};node.start(0,this.clock.elapsed,Math.max(0,this.buffer.duration-this.clock.elapsed));
 }
 snapshot(){this.sync();return Object.freeze({phase:this.phase,state:this.clock.state,elapsed:this.clock.elapsed,volume:this.volume,narrationEnabled:this.narration,failure:this.failure});}
 async play(){
  if(this.phase==='closed'||this.phase==='loading'||this.phase==='playing'||this.clock.state.term||this.clock.state.completed)return;
  const ac=new AbortController();this.pending=ac;const ticket=++this.ticket;this.phase='loading';this.failure=null;this.emit();
  try{
   ac.signal.throwIfAborted();
   if(!this.context){this.context=this.deps.createContext?.()??new AudioContext({sampleRate:22050});this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);}
   const context=this.context;await context.resume();ac.signal.throwIfAborted();
   if(!this.buffer){const encoded=await this.deps.read(ac.signal);ac.signal.throwIfAborted();const prepared=await p040DecodeAudio(context,encoded,ac.signal);ac.signal.throwIfAborted();if(ticket!==this.ticket)return;this.buffer=prepared;}
   if(ticket!==this.ticket)return;this.pending=null;this.clock=p040ClockPlay(this.clock,context.currentTime);this.phase='playing';this.startNode();this.emit();
  }catch(error){if(ticket!==this.ticket||ac.signal.aborted)return;this.pending=null;this.stop();this.clock=p040ClockPause(this.clock,this.context?.currentTime??0);this.phase='failed';this.failure=error instanceof Error?error.message:'P040_AUDIO_FAILURE';this.emit();}
 }
 pause(){if(this.phase==='closed'||this.phase==='failed')return;this.sync();this.cancel();this.clock=p040ClockPause(this.clock,this.context?.currentTime??0);this.stop();this.phase=this.clock.state.completed?'terminal':'paused';this.emit();}
 replay(){if(this.phase==='closed')return;this.cancel();this.stop();this.clock=p040ClockReplay(this.clock);this.phase='paused';this.failure=null;this.emit();}
 openTerm(term:P040Term){if(this.phase==='closed'||this.phase==='loading'||this.phase==='failed')return;this.sync();const next=p040ClockOpenTerm(this.clock,term,this.context?.currentTime??0);if(next.state.term){this.cancel();this.stop();this.phase='paused';}this.clock=next;this.emit();}
 closeTerm(){if(this.phase==='closed')return;this.clock=p040ClockCloseTerm(this.clock);this.emit();}
 setVolume(volume:number){if(!Number.isFinite(volume)||volume<0||volume>1)throw Error('P040_VOLUME');if(this.phase==='closed')return;this.volume=volume;if(this.gain)this.gain.gain.value=volume;this.emit();}
 setNarration(enabled:boolean){if(this.phase==='closed')return;this.sync();this.narration=enabled;this.startNode();this.emit();}
 async close(){if(this.phase==='closed')return;this.cancel();this.stop();this.phase='closed';this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.buffer=null;await context?.close();}
}
