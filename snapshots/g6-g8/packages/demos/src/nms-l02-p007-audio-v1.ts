import {P007_AUDIO_SOURCE as SOURCE} from './nms-l02-p007-audio-source-v1';
import {p007FrameAtMilliseconds} from './nms-l02-p007-timeline-v1';
export interface P007AudioSnapshot{readonly phase:'paused'|'loading'|'playing'|'completed'|'failed'|'closed';readonly elapsedSeconds:number;readonly frame:number;readonly completed:boolean;readonly replay:number;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P007AudioDependencies{readonly read:(signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(state:P007AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
/** Full source decode, declared1673-sample latency removed, 3675-sample
 * frame3 offset. Retain every post-latency sample once; hold after one cycle. */
export function p007PrepareSourcePcm(samples:Float32Array):Float32Array {
 if(samples.length!==SOURCE.decodedSamples)throw Error('P007_AUDIO_DECODE');
 const prepared=new Float32Array(SOURCE.stopSamples);let previousSource:number=SOURCE.latencySamples,previousOutput=0,peak=0;
 for(const sample of samples){if(!Number.isFinite(sample))throw Error('P007_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(sample));}
 if(peak===0)throw Error('P007_AUDIO_SILENT');
 for(const segment of SOURCE.segments){
  if(segment.sourceStartSample!==previousSource||segment.sourceEndSample<=segment.sourceStartSample||segment.outputStartSample<previousOutput||segment.outputEndSample>prepared.length||segment.outputEndSample-segment.outputStartSample!==segment.sourceEndSample-segment.sourceStartSample)throw Error('P007_AUDIO_PARTITION');
  prepared.set(samples.subarray(segment.sourceStartSample,segment.sourceEndSample),segment.outputStartSample);
  previousSource=segment.sourceEndSample;previousOutput=segment.outputEndSample;
 }
 if(previousSource!==samples.length)throw Error('P007_AUDIO_PARTITION');
 return prepared;
}
export class P007SourceAudio{
 private context:AudioContext|null=null;private buffer:AudioBuffer|null=null;private gain:GainNode|null=null;private node:AudioBufferSourceNode|null=null;
 private pending:AbortController|null=null;private ticket=0;private elapsed=0;private startedAt=0;private replayCount=0;private volume=.8;private narrationEnabled=true;
 private phase:P007AudioSnapshot['phase']='paused';private failure:string|null=null;
 constructor(private readonly dependencies:P007AudioDependencies){}
 private time(){return this.phase==='playing'&&this.context?this.elapsed+Math.max(0,this.context.currentTime-this.startedAt):this.elapsed;}
 snapshot():P007AudioSnapshot{let elapsedSeconds=this.time();const stop=SOURCE.stopSeconds;if(this.phase==='playing'&&elapsedSeconds>=stop){elapsedSeconds=stop;this.elapsed=stop;this.phase='completed';this.stopNode();}return Object.freeze({phase:this.phase,elapsedSeconds,frame:p007FrameAtMilliseconds(elapsedSeconds*1000),completed:this.phase==='completed',replay:this.replayCount,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});}

 private emit(){this.dependencies.changed(this.snapshot());}
 private stopNode(){const node=this.node;this.node=null;if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}}
 private beginNode(position:number){
  if(!this.context||!this.buffer||!this.gain||!this.narrationEnabled)return;
  this.stopNode();const node=this.context.createBufferSource();node.buffer=this.buffer;node.loop=false;node.connect(this.gain);this.node=node;
  if(position<SOURCE.stopSeconds)node.start(0,position);
 }
 async play():Promise<boolean>{
  this.snapshot();if(this.phase==='closed'||this.phase==='loading'||this.phase==='completed')return false;if(this.phase==='playing')return true;
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();
  const current=()=>this.phase!=='closed'&&ticket===this.ticket&&!controller.signal.aborted;
  try{
   const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:SOURCE.sampleRate});await context.resume();
   if(!current())return false;if(context.sampleRate!==SOURCE.sampleRate||context.state!=='running')throw Error('P007_AUDIO_ACTIVATION');
   if(!this.buffer){const bytes=await this.dependencies.read(controller.signal);if(!current())return false;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==SOURCE.sourceBytes)throw Error('P007_AUDIO_BYTES');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;if(digest!==SOURCE.sourceSha256)throw Error('P007_AUDIO_HASH');
    const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;
    if(decoded.length!==SOURCE.decodedSamples||decoded.sampleRate!==SOURCE.sampleRate||decoded.numberOfChannels!==SOURCE.channels)throw Error('P007_AUDIO_DECODE');
    const prepared=context.createBuffer(SOURCE.channels,SOURCE.stopSamples,SOURCE.sampleRate);
    for(let channel=0;channel<SOURCE.channels;channel++)prepared.getChannelData(channel).set(p007PrepareSourcePcm(decoded.getChannelData(channel)));
    this.buffer=prepared;
   }
   if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}
   if(!current())return false;this.startedAt=context.currentTime;this.beginNode(this.elapsed);this.pending=null;this.phase='playing';this.emit();return true;
  }catch(error){if(!current())return false;this.pending=null;this.stopNode();this.phase='failed';this.failure=error instanceof Error&&/^P007_AUDIO_/.test(error.message)?error.message:'P007_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){this.snapshot();if(this.phase==='closed'||this.phase==='completed')return;const elapsed=this.time();++this.ticket;this.pending?.abort();this.pending=null;this.stopNode();this.elapsed=elapsed;this.phase='paused';this.emit();}
 async replay(){if(this.phase==='closed')return false;this.pause();this.elapsed=0;this.phase='paused';this.replayCount++;this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed'||this.narrationEnabled===enabled)return;this.narrationEnabled=enabled;if(!enabled)this.stopNode();else if(this.phase==='playing')this.beginNode(this.time());this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.buffer=null;this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
