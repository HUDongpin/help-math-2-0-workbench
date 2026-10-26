import {P002_AUDIO_SOURCE as SOURCE} from './nms-l02-p002-audio-source-v1';
import {p002FrameAtMilliseconds} from './nms-l02-p002-timeline-v1';
export interface P002AudioSnapshot{readonly phase:'paused'|'loading'|'playing'|'failed'|'closed';readonly elapsedSeconds:number;readonly frame:number;readonly cycle:number;readonly replay:number;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P002AudioDependencies{readonly read:(signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(state:P002AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
/** Continuous source stream with a source-bound delayed entry. The original MP3
 * stays unchanged. Prepared PCM starts at round(29/12*22050), discards only the
 * declared 1673-sample initial latency and pads the remaining cycle with silence.
 * Missing timeline SoundStreamBlocks do not invent discontinuities in MP3 PCM.
 * This is an engineering alignment, not original-host or listening acceptance. */
export class P002SourceAudio{
 private context:AudioContext|null=null;private buffer:AudioBuffer|null=null;private gain:GainNode|null=null;private node:AudioBufferSourceNode|null=null;
 private pending:AbortController|null=null;private ticket=0;private elapsed=0;private startedAt=0;private replayCount=0;private volume=.8;private narrationEnabled=true;
 private phase:P002AudioSnapshot['phase']='paused';private failure:string|null=null;
 constructor(private readonly dependencies:P002AudioDependencies){}
 private time(){return this.phase==='playing'&&this.context?this.elapsed+Math.max(0,this.context.currentTime-this.startedAt):this.elapsed;}
 snapshot():P002AudioSnapshot{const elapsedSeconds=this.time();return Object.freeze({phase:this.phase,elapsedSeconds,frame:p002FrameAtMilliseconds(elapsedSeconds*1000),cycle:Math.floor(elapsedSeconds/(SOURCE.frames/SOURCE.fps)),replay:this.replayCount,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});}
 private emit(){this.dependencies.changed(this.snapshot());}
 private stopNode(){const node=this.node;this.node=null;if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}}
 private beginNode(position:number){
  if(!this.context||!this.buffer||!this.gain||!this.narrationEnabled)return;
  this.stopNode();const node=this.context.createBufferSource();node.buffer=this.buffer;node.loop=true;node.loopStart=0;node.loopEnd=SOURCE.cycleSamples/SOURCE.sampleRate;node.connect(this.gain);this.node=node;
  node.start(0,position%(SOURCE.cycleSamples/SOURCE.sampleRate));
 }
 async play():Promise<boolean>{
  if(this.phase==='closed'||this.phase==='loading')return false;if(this.phase==='playing')return true;
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();
  const current=()=>this.phase!=='closed'&&ticket===this.ticket&&!controller.signal.aborted;
  try{
   const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:SOURCE.sampleRate});await context.resume();
   if(!current())return false;if(context.sampleRate!==SOURCE.sampleRate||context.state!=='running')throw Error('P002_AUDIO_ACTIVATION');
   if(!this.buffer){const bytes=await this.dependencies.read(controller.signal);if(!current())return false;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==SOURCE.sourceBytes)throw Error('P002_AUDIO_BYTES');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;if(digest!==SOURCE.sourceSha256)throw Error('P002_AUDIO_HASH');
    const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;
    if(decoded.length!==SOURCE.decodedSamples||decoded.sampleRate!==SOURCE.sampleRate||decoded.numberOfChannels!==SOURCE.channels)throw Error('P002_AUDIO_DECODE');
    if(SOURCE.cycleSamples<SOURCE.startOffsetSamples+SOURCE.decodedSamples-SOURCE.latencySamples)throw Error('P002_AUDIO_CYCLE_TOO_SHORT');
    const prepared=context.createBuffer(SOURCE.channels,SOURCE.cycleSamples,SOURCE.sampleRate);
    for(let channel=0;channel<SOURCE.channels;channel++){const samples=decoded.getChannelData(channel);let peak=0;for(const sample of samples){if(!Number.isFinite(sample))throw Error('P002_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(sample));}if(peak===0)throw Error('P002_AUDIO_SILENT');prepared.getChannelData(channel).set(samples.subarray(SOURCE.latencySamples),SOURCE.startOffsetSamples);}
    this.buffer=prepared;
   }
   if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}
   if(!current())return false;this.startedAt=context.currentTime;this.beginNode(this.elapsed);this.pending=null;this.phase='playing';this.emit();return true;
  }catch(error){if(!current())return false;this.pending=null;this.stopNode();this.phase='failed';this.failure=error instanceof Error&&/^P002_AUDIO_/.test(error.message)?error.message:'P002_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){if(this.phase==='closed')return;const elapsed=this.time();++this.ticket;this.pending?.abort();this.pending=null;this.stopNode();this.elapsed=elapsed;this.phase='paused';this.emit();}
 async replay(){if(this.phase==='closed')return false;this.pause();this.elapsed=0;this.replayCount++;this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed'||this.narrationEnabled===enabled)return;this.narrationEnabled=enabled;if(!enabled)this.stopNode();else if(this.phase==='playing')this.beginNode(this.time());this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.buffer=null;this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
