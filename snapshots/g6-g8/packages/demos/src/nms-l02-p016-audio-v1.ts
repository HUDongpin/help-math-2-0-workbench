import {P016_IR as IR} from './generated/nms-l02-p016-source-ir-v1';
import {p016Initial,p016Elapse,p016ClockActive,p016SetShaded,p016SetDigit,p016DragStart,p016DragMove,p016DragEnd,p016Submit,p016Press,p016Release,p016CloseFeedback,p016FractionsAfterEvent,P016_WRONG_BRANCHES,P016_ZERO_FRACTIONS,type P016State,type P016Fractions} from './nms-l02-p016-state-v1';
import type {P016AudioSource} from './nms-l02-p016-source-contract-v1';
export interface P016AudioSnapshot {readonly phase:'paused'|'loading'|'playing'|'waiting'|'completed'|'failed'|'closed';readonly state:P016State;readonly fractions:P016Fractions;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P016AudioDependencies {readonly seed:number;readonly read:(domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(snapshot:P016AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
export function p016PreparePcm(samples:Float32Array,source:P016AudioSource) {
 if(samples.length!==source.decodedSamples)throw Error('P016_AUDIO_DECODE');let peak=0;
 for(const x of samples){if(!Number.isFinite(x))throw Error('P016_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(x));}
 if(!peak)throw Error('P016_AUDIO_SILENT');
 if(source.outputEndSample-source.outputStartSample!==source.decodedSamples-source.latencySamples||source.outputEndSample>source.totalSamples)throw Error('P016_AUDIO_PARTITION');
 const output=new Float32Array(source.totalSamples);output.set(samples.subarray(source.latencySamples),source.outputStartSample);return output;
}
interface Voice {domain:string;key:string;frame:number;fraction:number;end:number;}
export function p016Voices(s:P016State,f:P016Fractions):readonly Voice[] {
 const voices:Voice[]=[];
 if(s.phase==='intro'||s.phase==='outro')voices.push({domain:'194',key:'main-'+s.phase,frame:s.mainFrame,fraction:f.main,end:s.phase==='intro'?176:209});
 if(s.coachFrame!==null)voices.push({domain:'168',key:'coach-'+s.wrongAttempts,frame:s.coachFrame,fraction:f.coach,end:P016_WRONG_BRANCHES[s.coachBranch!]!.end});
 if(s.correctFrame!==null)voices.push({domain:'186',key:'correct',frame:s.correctFrame,fraction:f.correct,end:20});
 if(s.held&&s.pressFrame!==null&&s.pressFrame<5)voices.push({domain:s.held==='reset'?'159':'175',key:s.held,frame:s.pressFrame,fraction:f.press,end:5});
 return voices;
}
export class P016SourceAudio {
 private context:AudioContext|null=null;private gain:GainNode|null=null;
 private nodes=new Map<string,{key:string;node:AudioBufferSourceNode}>();private buffers=new Map<string,AudioBuffer>();
 private pending:AbortController|null=null;private ticket=0;private state:P016State;private fractions:P016Fractions=P016_ZERO_FRACTIONS;
 private phase:P016AudioSnapshot['phase']='paused';private lastAt=0;private volume=.8;private narrationEnabled=true;private failure:string|null=null;
 constructor(private readonly dependencies:P016AudioDependencies){this.state=p016Initial(dependencies.seed);}
 private stop(domain:string){const v=this.nodes.get(domain);if(v){this.nodes.delete(domain);v.node.onended=null;try{v.node.stop();}catch{}v.node.disconnect();}}
 private stopAll(){for(const domain of [...this.nodes.keys()])this.stop(domain);}
 private reconcile(){
  const desired=this.phase==='playing'&&this.narrationEnabled?p016Voices(this.state,this.fractions):[];
  for(const [domain,n]of this.nodes)if(!desired.some(v=>v.domain===domain&&v.key===n.key))this.stop(domain);
  if(!this.context||!this.gain)return;
  for(const v of desired){if(this.nodes.has(v.domain))continue;const buffer=this.buffers.get(v.domain);if(!buffer)throw Error('P016_AUDIO_DOMAIN');
   const offset=(v.frame-1+v.fraction)/12,duration=Math.min((v.end-v.frame-v.fraction)/12,buffer.duration-offset);if(duration<=0)continue;
   const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.gain);this.nodes.set(v.domain,{key:v.key,node});
   // The next snapshot resolves source stop actions. Do not repeatedly reschedule a finished buffer tail.
   node.onended=()=>{if(this.nodes.get(v.domain)?.node===node){this.sync();this.emit();}};node.start(0,offset,duration);
  }
 }
 private sync(){if(this.phase!=='playing'||!this.context)return;const now=this.context.currentTime,elapsed=Math.max(0,now-this.lastAt);this.lastAt=now;
  const next=p016Elapse(this.state,this.fractions,elapsed);this.state=next.state;this.fractions=next.fractions;
  if(!p016ClockActive(this.state))this.phase=this.state.phase==='completed'?'completed':'waiting';this.reconcile();
 }
 snapshot():P016AudioSnapshot {this.sync();return Object.freeze({phase:this.phase,state:this.state,fractions:this.fractions,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});}
 private emit(){this.dependencies.changed(this.snapshot());}
 async play(){this.sync();if(['closed','loading','completed'].includes(this.phase))return false;if(this.phase==='playing')return true;
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();
  const current=()=>this.phase!=='closed'&&ticket===this.ticket&&!controller.signal.aborted;
  try {const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:22050});await context.resume();if(!current())return false;
   if(context.sampleRate!==22050||context.state!=='running')throw Error('P016_AUDIO_ACTIVATION');
   for(const domain of ['194','168','186','159','175']){if(this.buffers.has(domain))continue;const source=IR.audio[domain],bytes=await this.dependencies.read(domain,controller.signal);if(!current())return false;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==source.sourceBytes)throw Error('P016_AUDIO_BYTES');const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;
    if(digest!==source.sourceSha256)throw Error('P016_AUDIO_HASH');const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;
    if(decoded.sampleRate!==22050||decoded.numberOfChannels!==1||decoded.length!==source.decodedSamples)throw Error('P016_AUDIO_DECODE');const buffer=context.createBuffer(1,source.totalSamples,22050);buffer.getChannelData(0).set(p016PreparePcm(decoded.getChannelData(0),source));this.buffers.set(domain,buffer);
   }
   if(!current())return false;if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}
   this.pending=null;this.lastAt=context.currentTime;this.phase=p016ClockActive(this.state)?'playing':this.state.phase==='completed'?'completed':'waiting';this.reconcile();this.emit();return this.phase==='playing';
  } catch(e){if(!current())return false;this.pending=null;this.stopAll();this.phase='failed';this.failure=e instanceof Error&&/^P016_AUDIO_/.test(e.message)?e.message:'P016_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){this.sync();if(this.phase==='closed'||this.phase==='completed')return;++this.ticket;this.pending?.abort();this.pending=null;this.stopAll();this.state=p016DragEnd(this.state,true);this.phase='paused';this.emit();}
 private change(next:P016State){if(next===this.state||['closed','failed','loading'].includes(this.phase))return false;const before=this.state;this.state=next;this.fractions=p016FractionsAfterEvent(before,next,this.fractions);if(this.context)this.lastAt=this.context.currentTime;this.reconcile();this.emit();return true;}
 private async apply(next:P016State){if(!this.change(next))return false;if(this.phase==='playing')return true;return this.play();}
 setShaded(count:number){this.sync();return this.change(p016SetShaded(this.state,count));}
 setDigit(index:0|1,value:string){this.sync();return this.change(p016SetDigit(this.state,index,value));}
 dragStart(){this.sync();return this.change(p016DragStart(this.state));}
 dragMove(sourceX:number){this.sync();return this.change(p016DragMove(this.state,sourceX));}
 dragEnd(cancel=false){this.sync();return this.change(p016DragEnd(this.state,cancel));}
 async submit(){this.sync();return this.apply(p016Submit(this.state));}
 async press(kind:'reset'|'close'){this.sync();return this.apply(p016Press(this.state,kind));}
 async release(activate:boolean){this.sync();return this.apply(p016Release(this.state,activate));}
 async closeFeedback(){this.sync();return this.apply(p016CloseFeedback(this.state));}
 async replay(){if(this.phase==='closed')return false;this.pause();this.state=p016Initial(this.dependencies.seed,this.state.replay+1);this.fractions=P016_ZERO_FRACTIONS;this.phase='paused';this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed'||enabled===this.narrationEnabled)return;this.sync();this.narrationEnabled=enabled;this.reconcile();this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.stopAll();this.buffers.clear();this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
