import {P013_IR as IR} from './generated/nms-l02-p013-source-ir-v1';
import {p013Initial,p013Elapse,p013ClockActive,p013Pick,p013Drop,p013Place,p013Cancel,p013ClosePress,p013CloseRelease,P013_WRONG,P013_ZERO_FRACTIONS,type P013State,type P013Fractions} from './nms-l02-p013-timeline-v1';
import type {P013AudioSource} from './nms-l02-p013-source-contract-v1';
export interface P013AudioSnapshot {readonly phase:'paused'|'loading'|'playing'|'waiting'|'completed'|'failed'|'closed';readonly state:P013State;readonly fractions:P013Fractions;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P013AudioDependencies {readonly seed:number;readonly read:(domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(snapshot:P013AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
export function p013PreparePcm(samples:Float32Array,source:P013AudioSource) {
 if(samples.length!==source.decodedSamples)throw Error('P013_AUDIO_DECODE');let peak=0;
 for(const x of samples){if(!Number.isFinite(x))throw Error('P013_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(x));}
 if(!peak)throw Error('P013_AUDIO_SILENT');
 if(source.outputEndSample-source.outputStartSample!==source.decodedSamples-source.latencySamples||source.outputEndSample>source.totalSamples)throw Error('P013_AUDIO_PARTITION');
 const output=new Float32Array(source.totalSamples);output.set(samples.subarray(source.latencySamples),source.outputStartSample);return output;
}
interface Voice {domain:string;key:string;frame:number;fraction:number;end:number;}
export function p013Voices(s:P013State,f:P013Fractions):readonly Voice[] {
 const voices:Voice[]=[];
 if(s.phase==='intro'||s.phase==='outro')voices.push({domain:'123',key:'main-'+s.phase,frame:s.mainFrame,fraction:f.main,end:s.phase==='intro'?153:243});
 if(s.wrongFrame!==null)voices.push({domain:'107',key:'wrong-'+s.wrongAttempts,frame:s.wrongFrame,fraction:f.wrong,end:P013_WRONG[s.wrongBranch!].end});
 if(s.correctFrame!==null)voices.push({domain:'111',key:'correct',frame:s.correctFrame,fraction:f.correct,end:25});
 if(s.closeHeld&&s.closeFrame!==null&&s.closeFrame<5)voices.push({domain:'99',key:'close',frame:s.closeFrame,fraction:f.close,end:5});
 return voices;
}
export class P013SourceAudio {
 private context:AudioContext|null=null;private gain:GainNode|null=null;
 private nodes=new Map<string,{key:string;node:AudioBufferSourceNode}>();private buffers=new Map<string,AudioBuffer>();
 private pending:AbortController|null=null;private ticket=0;private state:P013State;private fractions:P013Fractions=P013_ZERO_FRACTIONS;
 private phase:P013AudioSnapshot['phase']='paused';private lastAt=0;private volume=.8;private narrationEnabled=true;private failure:string|null=null;
 constructor(private readonly dependencies:P013AudioDependencies){this.state=p013Initial(dependencies.seed);}
 private stop(domain:string){const v=this.nodes.get(domain);if(v){this.nodes.delete(domain);v.node.onended=null;try{v.node.stop();}catch{}v.node.disconnect();}}
 private stopAll(){for(const domain of [...this.nodes.keys()])this.stop(domain);}
 private reconcile(){
  const desired=this.phase==='playing'&&this.narrationEnabled?p013Voices(this.state,this.fractions):[];
  for(const [domain,n]of this.nodes)if(!desired.some(v=>v.domain===domain&&v.key===n.key))this.stop(domain);
  if(!this.context||!this.gain)return;
  for(const v of desired){if(this.nodes.has(v.domain))continue;const buffer=this.buffers.get(v.domain);if(!buffer)throw Error('P013_AUDIO_DOMAIN');
   const offset=(v.frame-1+v.fraction)/12,duration=Math.min((v.end-v.frame-v.fraction)/12,buffer.duration-offset);if(duration<=0)continue;
   const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.gain);this.nodes.set(v.domain,{key:v.key,node});
   // The next snapshot resolves source stop actions. Do not repeatedly reschedule a finished buffer tail.
   node.onended=()=>{if(this.nodes.get(v.domain)?.node===node){this.sync();this.emit();}};node.start(0,offset,duration);
  }
 }
 private sync(){if(this.phase!=='playing'||!this.context)return;const now=this.context.currentTime,elapsed=Math.max(0,now-this.lastAt);this.lastAt=now;
  const next=p013Elapse(this.state,this.fractions,elapsed);this.state=next.state;this.fractions=next.fractions;
  if(!p013ClockActive(this.state))this.phase=this.state.phase==='completed'?'completed':'waiting';this.reconcile();
 }
 snapshot():P013AudioSnapshot {this.sync();return Object.freeze({phase:this.phase,state:this.state,fractions:this.fractions,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});}
 private emit(){this.dependencies.changed(this.snapshot());}
 async play(){this.sync();if(['closed','loading','completed'].includes(this.phase))return false;if(this.phase==='playing')return true;
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();
  const current=()=>this.phase!=='closed'&&ticket===this.ticket&&!controller.signal.aborted;
  try {const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:22050});await context.resume();if(!current())return false;
   if(context.sampleRate!==22050||context.state!=='running')throw Error('P013_AUDIO_ACTIVATION');
   // Source105 has no in-page caller. Preserve its audit payload, but do not fetch or play it in the learner path.
   for(const domain of ['123','107','111','99']){if(this.buffers.has(domain))continue;const source=IR.audio[domain],bytes=await this.dependencies.read(domain,controller.signal);if(!current())return false;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==source.sourceBytes)throw Error('P013_AUDIO_BYTES');const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;
    if(digest!==source.sourceSha256)throw Error('P013_AUDIO_HASH');const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;
    if(decoded.sampleRate!==22050||decoded.numberOfChannels!==1||decoded.length!==source.decodedSamples)throw Error('P013_AUDIO_DECODE');const buffer=context.createBuffer(1,source.totalSamples,22050);buffer.getChannelData(0).set(p013PreparePcm(decoded.getChannelData(0),source));this.buffers.set(domain,buffer);
   }
   if(!current())return false;if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}
   this.pending=null;this.lastAt=context.currentTime;this.phase=p013ClockActive(this.state)?'playing':this.state.phase==='completed'?'completed':'waiting';this.reconcile();this.emit();return this.phase==='playing';
  } catch(e){if(!current())return false;this.pending=null;this.stopAll();this.phase='failed';this.failure=e instanceof Error&&/^P013_AUDIO_/.test(e.message)?e.message:'P013_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){this.sync();if(this.phase==='closed'||this.phase==='completed')return;++this.ticket;this.pending?.abort();this.pending=null;this.stopAll();this.state=p013Cancel(this.state);this.phase='paused';this.emit();}
 pick(id:number,input:'pointer'|'keyboard'){this.sync();if(['closed','failed','loading'].includes(this.phase))return false;const next=p013Pick(this.state,id,input);if(next===this.state)return false;this.state=next;this.emit();return true;}
 cancel(){this.sync();if(this.phase==='closed')return;this.state=p013Cancel(this.state);this.emit();}
 private async apply(next:P013State){if(next===this.state||['closed','failed'].includes(this.phase))return false;const before=this.state;this.state=next;
  this.fractions={...this.fractions,wrong:next.wrongAttempts!==before.wrongAttempts?0:this.fractions.wrong,correct:next.correctFrame!==null&&before.correctFrame===null?0:this.fractions.correct,close:next.closeHeld&&!before.closeHeld?0:this.fractions.close};
  if(this.context)this.lastAt=this.context.currentTime;this.reconcile();this.emit();if(this.phase==='playing')return true;if(this.phase==='loading')return false;return this.play();
 }
 async drop(inTarget:boolean){this.sync();return this.apply(p013Drop(this.state,inTarget));}
 async place(id:number){this.sync();return this.apply(p013Place(this.state,id));}
 async closePress(){this.sync();return this.apply(p013ClosePress(this.state));}
 async closeRelease(activate:boolean){this.sync();return this.apply(p013CloseRelease(this.state,activate));}
 async replay(){if(this.phase==='closed')return false;this.pause();this.state=p013Initial(this.dependencies.seed,this.state.replay+1);this.fractions=P013_ZERO_FRACTIONS;this.phase='paused';this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed'||enabled===this.narrationEnabled)return;this.sync();this.narrationEnabled=enabled;this.reconcile();this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.stopAll();this.buffers.clear();this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
