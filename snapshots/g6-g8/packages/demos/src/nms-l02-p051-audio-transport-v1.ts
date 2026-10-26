import {p051DecodeAudio} from './nms-l02-p051-audio-decode-v1';
import {p051WindowOffset,type P051Window} from './nms-l02-p051-audio-window-v1';
export interface P051TransportDependencies {
 read:(domain:P051Window['domain'],signal:AbortSignal)=>Promise<ArrayBuffer>;
 context?:()=>AudioContext;
 decode?:typeof p051DecodeAudio;
}
/** One owned audio context and one active source node. The phase controller owns
 * natural next-question progression; onended never advances exercise state.
 */
export class P051AudioTransport {
 private context:AudioContext|null=null;
 private gain:GainNode|null=null;
 private node:AudioBufferSourceNode|null=null;
 private buffers=new Map<P051Window['domain'],AudioBuffer>();
 private request:AbortController|null=null;
 private generation=0;
 private closed=false;
 private window:P051Window|null=null;
 private elapsed=0;
 private anchor:number|null=null;
 private volume=0.8;
 constructor(private readonly deps:P051TransportDependencies){}
 currentTime(){return this.context?.currentTime??0;}
 snapshot(){return {closed:this.closed,loading:this.request!==null,playing:this.node!==null,elapsed:this.currentElapsed(),window:this.window};}
 private currentElapsed(){return this.elapsed+(this.anchor===null?0:Math.max(0,(this.context?.currentTime??this.anchor)-this.anchor));}
 private cancelRequest(){this.generation++;this.request?.abort();this.request=null;}
 private stopNode(){if(this.node){this.node.onended=null;this.node.stop();this.node.disconnect();this.node=null;}this.anchor=null;}
 pause(){if(this.closed)return;this.elapsed=this.currentElapsed();this.cancelRequest();this.stopNode();}
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw Error('P051_VOLUME');this.volume=value;if(this.gain)this.gain.gain.value=value;}
 /** Resume the owned clock for source completion feedback without an audio clip.
  * A pending resume is cancellable exactly like a pending decode/play request.
  */
 async resumeClock():Promise<boolean>{
  if(this.closed)return false;
  this.stop();
  const request=new AbortController();this.request=request;const generation=this.generation;
  const current=()=>!this.closed&&this.generation===generation&&!request.signal.aborted;
  try{
   if(!this.context){this.context=this.deps.context?.()??new AudioContext({sampleRate:22050});this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);}
   await this.context.resume();return current();
  }catch(error){if(!current())return false;throw error;}
  finally{if(this.request===request)this.request=null;}
 }
 async play(window:P051Window,elapsed=0):Promise<boolean>{
  if(this.closed)return false;
  // Validate before allocating a context or starting I/O.
  const offset=p051WindowOffset(window,elapsed);
  if(!Number.isSafeInteger(window.start)||!Number.isSafeInteger(window.end)||window.start<0||window.end<=window.start)throw Error('P051_WINDOW');
  this.pause();this.window=window;this.elapsed=elapsed;
  if(offset===window.end)return false;
  const request=new AbortController();this.request=request;const generation=this.generation;
  const current=()=>!this.closed&&this.generation===generation&&!request.signal.aborted;
  try{
   if(!this.context){this.context=this.deps.context?.()??new AudioContext({sampleRate:22050});this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);}
   const context=this.context;
   let buffer=this.buffers.get(window.domain);
   if(!buffer){const encoded=await this.deps.read(window.domain,request.signal);if(!current())return false;buffer=await (this.deps.decode??p051DecodeAudio)(context,window.domain,encoded,request.signal);if(!current())return false;this.buffers.set(window.domain,buffer);}
   if(window.end>buffer.length)throw Error('P051_WINDOW_BOUNDS');
   await context.resume();if(!current())return false;
   const node=context.createBufferSource();node.buffer=buffer;node.connect(this.gain!);
   this.node=node;this.anchor=context.currentTime;
   node.onended=()=>{if(this.node!==node)return;this.elapsed=(window.end-window.start)/22050;this.anchor=null;this.node=null;node.disconnect();};
   node.start(0,offset/22050,(window.end-offset)/22050);return true;
  }catch(error){if(!current())return false;this.stopNode();throw error;}
  finally{if(this.request===request)this.request=null;}
 }
 async resume(){if(this.node)return true;return this.window?this.play(this.window,this.elapsed):false;}
 stop(){if(this.closed)return;this.pause();this.window=null;this.elapsed=0;}
 async close(){if(this.closed)return;this.stop();this.closed=true;this.buffers.clear();this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;await context?.close();}
}
