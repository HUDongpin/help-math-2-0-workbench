import{P026_AUDIO_SOURCE as SOURCE}from'./nms-l02-p026-audio-source-v1';
import{p026PrepareSourcePcm}from'./nms-l02-p026-audio-pcm-v1';
import{p026ClockInitial,p026ClockAdvance,p026ClockPause,p026ClockChoose,p026ClockReplay,p026MainAudioSeconds,p026MainAudioBoundary,type P026Clock}from'./nms-l02-p026-clock-v1';
export interface P026AudioSnapshot{readonly phase:'paused'|'loading'|'playing'|'completed'|'failed'|'closed';readonly clock:P026Clock;readonly mainSeconds:number;readonly narrationActive:boolean;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P026AudioDependencies{readonly seed:number;readonly read:(signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(state:P026AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
/** Two authored stops share one decoded source buffer. Predictable successful
 * pair movement schedules the next source segment before the board tick ends. */
export class P026SourceAudio{
 private context:AudioContext|null=null;private buffer:AudioBuffer|null=null;private gain:GainNode|null=null;private node:AudioBufferSourceNode|null=null;
 private clock:P026Clock;private phase:P026AudioSnapshot['phase']='paused';private failure:string|null=null;private lastTime=0;private volume=.8;private narration=true;private ticket=0;private pending:AbortController|null=null;private planKey:string|null=null;private nodeStart=0;private nodeEnd=0;
 constructor(private readonly dependencies:P026AudioDependencies){this.clock=p026ClockInitial(dependencies.seed);}
 private stopNode(){const node=this.node;this.node=null;this.planKey=null;if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}}
 private plan():{key:string;delay:number;offset:number;end:number}|null{
  const s=this.clock.game,end=p026MainAudioBoundary(this.clock);if(end!==null)return{key:s.phase,delay:0,offset:p026MainAudioSeconds(this.clock),end};
  if(s.phase==='moving-second'&&s.matches===3){const a=s.cards.find(c=>c.id===s.first),b=s.cards.find(c=>c.id===s.second);if(a&&b&&a.pairId===b.pairId)return{key:s.round===1?'between':'outro',delay:(22-s.motionTick-this.clock.fractionalTick)/12,offset:s.round===1?391/12:424/12,end:s.round===1?424/12:491/12};}
  return null;
 }
 private syncNode(){
  if(!this.context||!this.buffer||!this.gain||this.phase!=='playing'||!this.narration){this.stopNode();return;}
  const plan=this.plan();if(!plan){this.stopNode();return;}if(this.node&&this.planKey===plan.key)return;
  this.stopNode();const n=this.context.createBufferSource();n.buffer=this.buffer;n.connect(this.gain);const now=this.context.currentTime;this.nodeStart=now+Math.max(0,plan.delay);this.nodeEnd=this.nodeStart+Math.max(0,plan.end-plan.offset);this.planKey=plan.key;this.node=n;n.start(this.nodeStart,plan.offset,plan.end-plan.offset);
 }
 private sync(){if(this.phase!=='playing'||!this.context)return;const now=this.context.currentTime;this.clock=p026ClockAdvance(this.clock,Math.max(0,now-this.lastTime));this.lastTime=now;if(this.clock.game.phase==='completed')this.phase='completed';this.syncNode();}
 snapshot():P026AudioSnapshot{this.sync();const now=this.context?.currentTime??0;return Object.freeze({phase:this.phase,clock:this.clock,mainSeconds:p026MainAudioSeconds(this.clock),narrationActive:this.phase==='playing'&&this.narration&&this.node!==null&&now>=this.nodeStart&&now<this.nodeEnd,volume:this.volume,narrationEnabled:this.narration,failure:this.failure});}
 private emit(){this.dependencies.changed(this.snapshot());}
 async play():Promise<boolean>{
  this.sync();if(this.phase==='closed'||this.phase==='completed'||this.phase==='loading')return false;if(this.phase==='playing')return true;
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();const current=()=>this.phase!=='closed'&&this.ticket===ticket&&!controller.signal.aborted;
  try{const ctx=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:SOURCE.sampleRate});await ctx.resume();if(!current())return false;if(ctx.sampleRate!==SOURCE.sampleRate||ctx.state!=='running')throw Error('P026_AUDIO_ACTIVATION');
   if(!this.buffer){const bytes=await this.dependencies.read(controller.signal);if(!current())return false;if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==SOURCE.sourceBytes)throw Error('P026_AUDIO_BYTES');const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;if(sha!==SOURCE.sourceSha256)throw Error('P026_AUDIO_HASH');const audio=await ctx.decodeAudioData(bytes.slice(0));if(!current())return false;if(audio.sampleRate!==SOURCE.sampleRate||audio.numberOfChannels!==1||audio.length!==SOURCE.decodedSamples)throw Error('P026_AUDIO_DECODE');const buffer=ctx.createBuffer(1,SOURCE.stopSamples,SOURCE.sampleRate);buffer.getChannelData(0).set(p026PrepareSourcePcm(audio.getChannelData(0)));this.buffer=buffer;}
   if(!this.gain){this.gain=ctx.createGain();this.gain.gain.value=this.volume;this.gain.connect(ctx.destination);}if(!current())return false;this.pending=null;this.clock=p026ClockPause(this.clock,false);this.lastTime=ctx.currentTime;this.phase='playing';this.syncNode();this.emit();return true;
  }catch(e){if(!current())return false;this.pending=null;this.clock=p026ClockPause(this.clock,true);this.stopNode();this.phase='failed';this.failure=e instanceof Error&&/^P026_AUDIO_/.test(e.message)?e.message:'P026_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){this.sync();if(this.phase==='closed'||this.phase==='completed')return;++this.ticket;this.pending?.abort();this.pending=null;this.clock=p026ClockPause(this.clock,true);this.stopNode();this.phase='paused';this.emit();}
 choose(id:number):boolean{this.sync();if(this.phase!=='playing')return false;const next=p026ClockChoose(this.clock,id);if(next===this.clock)return false;this.clock=next;this.syncNode();this.emit();return true;}
 async replay(){if(this.phase==='closed')return false;this.pause();this.clock=p026ClockReplay(this.clock);this.phase='paused';this.failure=null;this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.sync();this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed')return;this.sync();this.narration=enabled;this.syncNode();this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.stopNode();this.buffer=null;this.gain?.disconnect();this.gain=null;const ctx=this.context;this.context=null;this.emit();if(ctx&&ctx.state!=='closed')await ctx.close();}
}
