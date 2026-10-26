import {P031_AUDIO_SOURCES as SOURCES} from './nms-l02-p031-audio-source-v1';
import {p031PrepareSourcePcm} from './nms-l02-p031-audio-pcm-v1';
import {p031Initial,p031Tick,p031Answer,p031CloseFeedback,p031Feedback,p031OpenHelp,p031CloseHelp,P031_BRANCHES,type P031SessionState} from './nms-l02-p031-state-v1';
export interface P031AudioSnapshot{readonly phase:'paused'|'loading'|'playing'|'waiting'|'completed'|'failed'|'closed';readonly state:P031SessionState;readonly fraction:number;readonly volume:number;readonly narrationEnabled:boolean;readonly failure:string|null;}
export interface P031AudioDependencies{readonly seed:number;readonly read:(domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>;readonly changed:(snapshot:P031AudioSnapshot)=>void;readonly createContext?:()=>AudioContext;}
const waiting=(s:P031SessionState)=>s.help||['question','wrong-wait','completed'].includes(s.phase);
export class P031SourceAudio{
 private context:AudioContext|null=null;private gain:GainNode|null=null;private node:AudioBufferSourceNode|null=null;private buffers=new Map<string,AudioBuffer>();private pending:AbortController|null=null;private ticket=0;
 private state:P031SessionState;private phase:P031AudioSnapshot['phase']='paused';private fraction=0;private lastAt=0;private volume=.8;private narrationEnabled=true;private failure:string|null=null;
 constructor(private readonly dependencies:P031AudioDependencies){this.state=p031Initial(dependencies.seed);}
 private boundaryFrames(){const s=this.state;if(s.phase==='intro')return 147-s.localFrame;if(s.phase==='outro')return 340-s.localFrame;if(s.phase==='wrong-in')return P031_BRANCHES.wrong[s.branch!-1].hold-s.localFrame;if(s.phase==='right'||s.phase==='wrong-out')return p031Feedback(s)!.end-s.localFrame;return 0;}
 private stopNode(){const n=this.node;this.node=null;if(n){n.onended=null;try{n.stop();}catch{}n.disconnect();}}
 private beginNode(){this.stopNode();if(!this.context||!this.gain||!this.narrationEnabled||this.phase!=='playing')return;const buffer=this.buffers.get(this.state.domain);if(!buffer)throw Error('P031_AUDIO_DOMAIN');const offset=(this.state.localFrame-1+this.fraction)/12,duration=Math.min((this.boundaryFrames()-this.fraction)/12,buffer.duration-offset);if(duration<=0)return;const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.gain);this.node=node;node.onended=()=>{if(this.node===node&&this.phase==='playing'){this.sync();this.emit();}};node.start(0,offset,duration);}
 private sync(){if(this.phase!=='playing'||!this.context)return;const elapsed=this.fraction+Math.max(0,this.context.currentTime-this.lastAt)*12;this.lastAt=this.context.currentTime;const frames=Math.floor(elapsed+1e-8);this.fraction=elapsed-frames;let jumped=false;
  for(let i=0;i<frames;i++){const before=this.state,next=p031Tick(before);this.state=next;if(next.domain!==before.domain||next.localFrame!==before.localFrame+1)jumped=true;if(waiting(next)){this.fraction=0;this.phase=next.phase==='completed'?'completed':'waiting';this.stopNode();break;}}
  if(jumped&&this.phase==='playing')this.beginNode();
 }
 snapshot():P031AudioSnapshot{this.sync();return Object.freeze({phase:this.phase,state:this.state,fraction:this.fraction,volume:this.volume,narrationEnabled:this.narrationEnabled,failure:this.failure});}
 private emit(){this.dependencies.changed(this.snapshot());}
 async play(){this.sync();if(['closed','loading','completed'].includes(this.phase))return false;if(this.state.help){this.phase='paused';this.emit();return false;}if(waiting(this.state)){this.phase=this.state.phase==='completed'?'completed':'waiting';this.emit();return false;}if(this.phase==='playing')return true;
  if(this.context?.state==='running'&&this.gain&&Object.keys(SOURCES).every(d=>d==='202'||this.buffers.has(d))){
   this.lastAt=this.context.currentTime;this.phase='playing';this.failure=null;this.beginNode();this.emit();return true;
  }
  const ticket=++this.ticket,controller=new AbortController();this.pending=controller;this.phase='loading';this.failure=null;this.emit();const current=()=>this.phase!=='closed'&&ticket===this.ticket&&!controller.signal.aborted;
  try{const context=this.context??=this.dependencies.createContext?.()??new AudioContext({sampleRate:22050});await context.resume();if(!current())return false;if(context.sampleRate!==22050||context.state!=='running')throw Error('P031_AUDIO_ACTIVATION');
   for(const [domain,source]of Object.entries(SOURCES)){if(domain==='202'||this.buffers.has(domain))continue;const bytes=await this.dependencies.read(domain,controller.signal);if(!current())return false;if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==source.sourceBytes)throw Error('P031_AUDIO_BYTES');const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!current())return false;if(digest!==source.sourceSha256)throw Error('P031_AUDIO_HASH');const decoded=await context.decodeAudioData(bytes.slice(0));if(!current())return false;if(decoded.sampleRate!==22050||decoded.numberOfChannels!==1||decoded.length!==source.decodedSamples)throw Error('P031_AUDIO_DECODE');const buffer=context.createBuffer(1,source.totalSamples,22050);buffer.getChannelData(0).set(p031PrepareSourcePcm(decoded.getChannelData(0),domain));this.buffers.set(domain,buffer);}
   if(!current())return false;if(!this.gain){this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);}this.pending=null;this.lastAt=context.currentTime;this.phase='playing';this.beginNode();this.emit();return true;
  }catch(e){if(!current())return false;this.pending=null;this.stopNode();this.phase='failed';this.failure=e instanceof Error&&/^P031_AUDIO_/.test(e.message)?e.message:'P031_AUDIO_UNAVAILABLE';this.emit();return false;}
 }
 pause(){this.sync();if(this.phase==='closed'||this.phase==='completed')return;++this.ticket;this.pending?.abort();this.pending=null;this.stopNode();this.phase='paused';this.emit();}
 async answer(index:number){this.sync();if(!['playing','waiting'].includes(this.phase))return false;const next=p031Answer(this.state,index);if(next===this.state||this.phase==='closed')return false;this.pause();this.state=next;this.fraction=0;this.emit();return this.play();}
 async closeFeedback(){this.sync();if(!['playing','waiting'].includes(this.phase))return false;const next=p031CloseFeedback(this.state);if(next===this.state||this.phase==='closed')return false;this.pause();this.state=next;this.fraction=0;this.emit();return this.play();}
 openHelp(){this.sync();const next=p031OpenHelp(this.state);if(next===this.state||this.phase==='closed')return false;this.pause();this.state=next;this.emit();return true;}
 closeHelp(){const next=p031CloseHelp(this.state);if(next===this.state||this.phase==='closed')return false;this.state=next;this.emit();return true;}
 async replay(){if(this.phase==='closed')return false;this.pause();this.state=p031Initial(this.dependencies.seed,this.state.replay+1);this.fraction=0;this.phase='paused';this.emit();return this.play();}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.gain&&this.context)this.gain.gain.setValueAtTime(this.volume,this.context.currentTime);this.emit();}
 setNarrationEnabled(enabled:boolean){if(this.phase==='closed'||enabled===this.narrationEnabled)return;this.sync();this.narrationEnabled=enabled;if(!enabled)this.stopNode();else this.beginNode();this.emit();}
 async close(){if(this.phase==='closed')return;this.pause();this.phase='closed';this.buffers.clear();this.gain?.disconnect();this.gain=null;const context=this.context;this.context=null;this.emit();if(context&&context.state!=='closed')await context.close();}
}
