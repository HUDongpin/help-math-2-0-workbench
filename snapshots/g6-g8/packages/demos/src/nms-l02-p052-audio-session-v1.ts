export interface P052AudioWindow {
 readonly id:string; readonly domain:string;
 readonly startSample:number; readonly endSample:number; readonly sampleRate:22050;
}
export interface P052AudioSessionDependencies {
 /** Return the complete, source-plan-prepared PCM buffer, never an MP3 fragment. */
 load:(context:AudioContext,domain:string,signal:AbortSignal)=>Promise<AudioBuffer>;
 context?:()=>AudioContext;
}
/** Owns one cue. Natural completion reports audio only, not teaching progression.
 * The future host controller must also satisfy the independent visual stop. */
export class P052AudioSession {
 private context:AudioContext|null=null;
 private gain:GainNode|null=null;
 private volume=0.8;
 private node:AudioBufferSourceNode|null=null;
 private request:AbortController|null=null;
 private generation=0;
 private closed=false;
 private cue:P052AudioWindow|null=null;
 private played=0;
 private anchor:number|null=null;
 private completed=false;
 private onComplete:(()=>void)|null=null;
 constructor(private readonly deps:P052AudioSessionDependencies){}
 /** Suspended AudioContext time does not advance; use for synchronized visuals. */
 currentTime(){return this.context?.currentTime??0;}
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw Error('P052_AUDIO_VOLUME');this.volume=value;if(this.gain)this.gain.gain.value=value;}
 private cursor(){
  const advance=this.anchor===null?0:Math.floor(Math.max(0,(this.context!.currentTime-this.anchor))*22050+1e-7);
  return Math.min(this.cue?this.cue.endSample-this.cue.startSample:0,this.played+advance);
 }
 snapshot(){return {closed:this.closed,loading:this.request!==null,playing:this.node!==null,
  cue:this.cue,playedSamples:this.cursor(),completed:this.completed};}
 pause(){
  this.played=this.cursor();this.generation++;this.request?.abort();this.request=null;
  const node=this.node;this.node=null;this.anchor=null;
  if(node){node.onended=null;node.stop();node.disconnect();}
 }
 cancel(){this.pause();this.cue=null;this.played=0;this.completed=false;this.onComplete=null;}
 async play(cue:P052AudioWindow,onComplete:()=>void):Promise<boolean>{
  if(this.closed)return false;
  if(cue.sampleRate!==22050||!cue.domain||!cue.id||!Number.isSafeInteger(cue.startSample)
   ||!Number.isSafeInteger(cue.endSample)||cue.startSample<0||cue.endSample<=cue.startSample)throw Error('P052_AUDIO_WINDOW');
  this.cancel();this.cue=Object.freeze({...cue});this.onComplete=onComplete;
  return this.resume();
 }
 async resume():Promise<boolean>{
  if(this.closed||!this.cue||this.completed)return false;
  if(this.node)return true;
  // Invalidate even a still-loading previous resume.
  this.pause();
  const cue=this.cue, generation=this.generation, request=new AbortController();this.request=request;
  const current=()=>!this.closed&&this.generation===generation&&!request.signal.aborted;
  try{
   const context=this.context??(this.context=this.deps.context?.()??new AudioContext({sampleRate:22050}));
   if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}
   // Start activation while still in the caller's user gesture.
   const activation=context.resume();
   const [buffer]=await Promise.all([this.deps.load(context,cue.domain,request.signal),activation]);
   if(!current())return false;
   if(buffer.sampleRate!==22050||buffer.numberOfChannels!==1||buffer.length<cue.endSample)throw Error('P052_AUDIO_PCM_BOUNDS');
   const node=context.createBufferSource();node.buffer=buffer;node.connect(this.gain);
   this.node=node;this.anchor=context.currentTime;
   node.onended=()=>{
    if(!current()||this.node!==node)return;
    this.node=null;this.anchor=null;this.played=cue.endSample-cue.startSample;this.completed=true;
    node.onended=null;node.disconnect();const callback=this.onComplete;this.onComplete=null;callback?.();
   };
   node.start(0,(cue.startSample+this.played)/22050,(cue.endSample-cue.startSample-this.played)/22050);
   return true;
  }catch(error){if(!current())return false;this.pause();throw error;}
  finally{if(this.request===request)this.request=null;}
 }
 async close(){if(this.closed)return;this.cancel();this.closed=true;this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;await context?.close();}
}
