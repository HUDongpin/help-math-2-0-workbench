import {P039_AUDIO_SOURCE as SOURCE} from './generated/nms-l02-p039-audio-source-v1';
import {p039PreparePcm,p039PrepareCoachPcm,type P039AudioDomain} from './nms-l02-p039-audio-pcm-v1';
import {p039EncodedSource} from './nms-l02-p039-audio-loader-v1';
import {p039ClockInitial,p039AdvanceClock,p039ClockPage,p039ClockPress,p039AudioWindows,p039PageAdvancing,type P039AudioClock} from './nms-l02-p039-audio-clock-v1';
import {p039SetPercent,p039Submit,p039Reset,p039CloseWrong,p039Replay,type P039State} from './nms-l02-p039-state-v1';
export interface P039AudioSnapshot {readonly phase:'paused'|'loading'|'playing'|'waiting'|'completed'|'failed'|'closed';readonly state:P039State;readonly fraction:number;readonly coachSeconds:number|null;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P039AudioDependencies {readonly seed:number;readonly read:(domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(snapshot:P039AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
/** Independent coach/press sample lifetimes; source page and feedback still use 12fps. */
export class P039SourceAudio {
 private context:AudioContext|null=null;private gain:GainNode|null=null;
 private buffers=new Map<string,AudioBuffer>();private nodes=new Map<string,AudioBufferSourceNode>();
 private pending:AbortController|null=null;private ticket=0;private clock:P039AudioClock;
 private mode:'paused'|'loading'|'active'|'failed'|'closed'='paused';private lastAt=0;private volume=.8;private narrationEnabled=true;private failure:string|null=null;
 constructor(private readonly dependencies:P039AudioDependencies){this.clock=p039ClockInitial(dependencies.seed);}
 private stopNode(key:string){const node=this.nodes.get(key);this.nodes.delete(key);if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}}
 private stopNodes(){for(const key of [...this.nodes.keys()])this.stopNode(key);}
 private reconcile(){
  if(this.mode!=='active'||!this.narrationEnabled||!this.context||!this.gain){this.stopNodes();return;}
  const windows=p039AudioWindows(this.clock);
  for(const key of [...this.nodes.keys()])if(!windows.some(w=>w.key===key))this.stopNode(key);
  for(const w of windows){
   if(this.nodes.has(w.key))continue;const buffer=this.buffers.get(w.buffer);if(!buffer)throw Error('P039_AUDIO_BUFFER');
   const duration=Math.min(w.duration,buffer.duration-w.offset);if(duration<=1/SOURCE.sampleRate)continue;
   const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.gain);this.nodes.set(w.key,node);
   node.onended=()=>{if(this.nodes.get(w.key)!==node)return;this.nodes.delete(w.key);node.disconnect();this.sync();this.emit();};
   node.start(0,w.offset,duration);
  }
 }
 private sync(){if(this.mode!=='active'||!this.context)return;const now=this.context.currentTime;this.clock=p039AdvanceClock(this.clock,Math.min(3600,Math.max(0,now-this.lastAt)));this.lastAt=now;this.reconcile();}
 snapshot():P039AudioSnapshot{
  this.sync();let phase:P039AudioSnapshot['phase']=this.mode==='active'?'playing':this.mode;
  if(this.mode==='active'&&!p039PageAdvancing(this.clock.page)&&p039AudioWindows(this.clock).length===0)phase=this.clock.page.mainFrame===579?'completed':'waiting';
  return Object.freeze({phase,state:this.clock.page,fraction:this.clock.fraction,coachSeconds:this.clock.coachSeconds,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});
 }
 private emit(){this.dependencies.changed(this.snapshot());}
 async play(){
  this.sync();if(this.mode==='closed'||this.mode==='loading')return false;if(this.mode==='active')return true;
  const ticket=++this.ticket,abort=new AbortController();this.pending=abort;this.mode='loading';this.failure=null;this.emit();
  const current=()=>this.mode!=='closed'&&ticket===this.ticket&&!abort.signal.aborted;
  try{
   const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:SOURCE.sampleRate});await context.resume();if(!current())return false;
   if(context.sampleRate!==SOURCE.sampleRate||context.state!=='running')throw Error('P039_AUDIO_ACTIVATION');
   for(const domain of ['223','230','234','237']){
    if(this.buffers.has(domain==='230'?'coach-0':domain))continue;
    const plan=p039EncodedSource(domain),bytes=await this.dependencies.read(domain,abort.signal);if(!current())return false;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==plan.source.bytes)throw Error('P039_AUDIO_BYTES');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;if(digest!==plan.source.sha256)throw Error('P039_AUDIO_HASH');
    const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;
    if(decoded.sampleRate!==SOURCE.sampleRate||decoded.numberOfChannels!==1||decoded.length!==plan.decodedSamples)throw Error('P039_AUDIO_DECODE');
    const save=(key:string,samples:Float32Array)=>{const buffer=context.createBuffer(1,samples.length,SOURCE.sampleRate);buffer.getChannelData(0).set(samples);this.buffers.set(key,buffer);};
    if(domain==='230')for(const branch of [0,1,2,3]as const)save('coach-'+branch,p039PrepareCoachPcm(decoded.getChannelData(0),branch));
    else save(domain,p039PreparePcm(decoded.getChannelData(0),domain as P039AudioDomain));
   }
   if(!current())return false;if(!this.gain){this.gain=context.createGain();this.gain.connect(context.destination);}this.gain.gain.value=this.volume;
   this.pending=null;this.lastAt=context.currentTime;this.mode='active';this.reconcile();this.emit();return true;
  }catch(error){if(!current())return false;this.pending=null;this.stopNodes();this.mode='failed';this.failure=error instanceof Error&&/^P039_(AUDIO|PCM)_/.test(error.message)?error.message:'P039_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){this.sync();if(this.mode==='closed')return;++this.ticket;this.pending?.abort();this.pending=null;this.stopNodes();this.clock=p039ClockPress(this.clock,false);if(this.mode!=='failed')this.mode='paused';this.emit();}
 private action(change:(s:P039State)=>P039State){this.sync();if(this.mode!=='active')return false;const page=change(this.clock.page);if(page===this.clock.page)return false;this.clock=p039ClockPage(this.clock,page);this.reconcile();this.emit();return true;}
 setPercent(percent:number){return this.action(s=>p039SetPercent(s,percent));}
 submit(){return this.action(p039Submit);}
 reset(){return this.action(p039Reset);}
 closeWrong(){this.pressClose(false);return this.action(p039CloseWrong);}
 pressClose(pressed:boolean){this.sync();if(this.mode==='closed')return;if(pressed&&(this.mode!=='active'||!this.clock.page.popupVisible))return;this.clock=p039ClockPress(this.clock,pressed);this.reconcile();this.emit();}
 async replay(){if(this.mode==='closed')return false;this.pause();this.clock=Object.freeze({...p039ClockInitial(this.dependencies.seed),page:p039Replay(this.clock.page)});this.mode='paused';this.failure=null;this.emit();return this.play();}
 setVolume(value:number){if(this.mode==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.mode==='closed'||enabled===this.narrationEnabled)return;this.sync();this.narrationEnabled=enabled;this.reconcile();this.emit();}
 async close(){if(this.mode==='closed')return;this.pause();this.mode='closed';this.buffers.clear();this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
