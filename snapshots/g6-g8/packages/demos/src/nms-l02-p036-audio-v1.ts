import {P036_AUDIO_SOURCES as SOURCES} from './nms-l02-p036-audio-source-v1';
import {p036PrepareSourcePcm} from './nms-l02-p036-audio-pcm-v1';
import {p036Initial,p036Tick,p036Replay,p036OpenTerm,p036CloseTerm,type P036SessionState,type P036TermId} from './nms-l02-p036-state-v1';
export interface P036AudioSnapshot {readonly phase:'paused'|'loading'|'playing'|'terminal'|'failed'|'closed';readonly state:P036SessionState;readonly fraction:number;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P036AudioDependencies {readonly seed:number;readonly read:(domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(snapshot:P036AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
/** One continuous source narration clock. The native terminal hold is qualified;
 * no source main stop is asserted. Closing a glossary never resumes implicitly. */
export class P036SourceAudio {
 private context:AudioContext|null=null;private gain:GainNode|null=null;private mainNode:AudioBufferSourceNode|null=null;
 private buffers=new Map<string,AudioBuffer>();private pending:AbortController|null=null;private ticket=0;
 private state:P036SessionState;private phase:P036AudioSnapshot['phase']='paused';private fraction=0;private lastAt=0;private volume=.8;private narrationEnabled=true;private failure:string|null=null;
 constructor(private readonly dependencies:P036AudioDependencies){this.state=p036Initial(dependencies.seed);}
 private stopMain(){const node=this.mainNode;this.mainNode=null;if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}}
 private beginMain(){
  this.stopMain();if(!this.context||!this.gain||!this.narrationEnabled||this.phase!=='playing')return;
  const buffer=this.buffers.get('89');if(!buffer)throw Error('P036_AUDIO_MAIN');
  const offset=(this.state.mainFrame-1+this.fraction)/12,duration=(854-this.state.mainFrame-this.fraction)/12;
  if(duration<=0)return;const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.gain);this.mainNode=node;
  node.onended=()=>{if(this.mainNode===node&&this.phase==='playing'){this.sync();this.emit();}};node.start(0,offset,Math.min(duration,buffer.duration-offset));
 }
 private sync(){
  if(this.phase!=='playing'||!this.context)return;
  const elapsed=this.fraction+Math.max(0,this.context.currentTime-this.lastAt)*12;this.lastAt=this.context.currentTime;
  const frames=Math.floor(elapsed+1e-8);this.fraction=Math.max(0,elapsed-frames);
  for(let i=0;i<frames;i++){this.state=p036Tick(this.state);if(this.state.phase==='terminal'){this.fraction=0;this.phase='terminal';this.stopMain();break;}}
 }
 snapshot():P036AudioSnapshot {this.sync();return Object.freeze({phase:this.phase,state:this.state,fraction:this.fraction,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});}
 private emit(){this.dependencies.changed(this.snapshot());}
 async play(){
  this.sync();if(['closed','loading'].includes(this.phase))return false;
  if(this.state.term!==null){this.phase='paused';this.emit();return false;}
  if(this.state.phase==='terminal'){if(this.phase==='failed')return false;this.phase='terminal';this.emit();return true;}
  if(this.phase==='playing')return true;
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();
  const current=()=>this.phase!=='closed'&&ticket===this.ticket&&!controller.signal.aborted;
  try{
   const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:22050});await context.resume();if(!current())return false;
   if(context.sampleRate!==22050||context.state!=='running')throw Error('P036_AUDIO_ACTIVATION');
   for(const[domain,source]of Object.entries(SOURCES)){
    if(this.buffers.has(domain))continue;
    const bytes=await this.dependencies.read(domain,controller.signal);if(!current())return false;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==source.sourceBytes)throw Error('P036_AUDIO_BYTES');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;
    if(digest!==source.sourceSha256)throw Error('P036_AUDIO_HASH');
    const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;
    if(decoded.sampleRate!==22050||decoded.numberOfChannels!==1||decoded.length!==source.decodedSamples)throw Error('P036_AUDIO_DECODE');
    const buffer=context.createBuffer(1,source.totalSamples,22050);buffer.getChannelData(0).set(p036PrepareSourcePcm(decoded.getChannelData(0),domain));this.buffers.set(domain,buffer);
   }
   if(!current())return false;
   if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}
   this.pending=null;this.lastAt=context.currentTime;this.phase='playing';this.beginMain();this.emit();return true;
  }catch(e){if(!current())return false;this.pending=null;this.stopMain();this.phase='failed';this.failure=e instanceof Error&&/^P036_AUDIO_/.test(e.message)?e.message:'P036_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){
  this.sync();if(this.phase==='closed')return;++this.ticket;this.pending?.abort();this.pending=null;this.stopMain();if(this.phase!=='failed')this.phase='paused';this.emit();
 }
 private canAct(){return !['closed','loading','failed'].includes(this.phase);}
 private action(fn:(state:P036SessionState)=>P036SessionState){this.sync();if(!this.canAct())return false;const next=fn(this.state);if(next===this.state)return false;this.state=next;this.emit();return true;}
 openTerm(term:P036TermId){this.sync();if(!this.canAct())return false;const next=p036OpenTerm(this.state,term);if(next===this.state)return false;this.pause();this.state=next;this.emit();return true;}
 closeTerm(){return this.action(p036CloseTerm);}
 async replay(){if(this.phase==='closed')return false;this.pause();this.state=p036Replay(this.state);this.fraction=0;this.phase='paused';this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed'||this.narrationEnabled===enabled)return;this.sync();this.narrationEnabled=enabled;if(enabled)this.beginMain();else this.stopMain();this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.buffers.clear();this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
