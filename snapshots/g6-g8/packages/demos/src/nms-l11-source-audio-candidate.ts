import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {createNms002State,reduceNms002,NMS002_L11_P030_BEHAVIOR_IR_V1,type Nms002State,type NmsAnswerId,type NmsFeedbackDomainId} from './g678-advanced-manual/nms002-l11-p030';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';

export interface NmsL11AudioClip {
  readonly frameDomain:string;
  readonly frameCount:number;
  readonly audioFirstFrame:number;
  readonly latencySamples:number;
  readonly decoder:DecodedSourceStreamBinding;
  readonly terminalEmptyNegativeSeekBlocks:readonly Readonly<{frame:number;seekSamples:number;sampleCount:0;mp3Bytes:0}>[];
}
export interface NmsL11AudioPlan {readonly sourceSwfSha256:string;readonly fps:12;readonly clips:readonly NmsL11AudioClip[];}
export interface NmsL11Picture {readonly mainFrame:number;readonly hintOpen:boolean;readonly feedbackObjectId:number|null;readonly feedbackFrame:number;}
type Phase='idle'|'loading'|'ready'|'main-playing'|'main-paused'|'starting-main'|'question'|'hint'|'feedback-playing'|'feedback-paused'|'starting-feedback'|'feedback-dismissal'|'ended'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const validPolicy=(p:Policy)=>['automatic','user'].includes(p.activation)&&typeof p.reducedMotion==='boolean';
const hashPattern=/^[a-f0-9]{64}$/u;
async function hash(bytes:ArrayBuffer):Promise<string>{return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
async function pcmHash(buffer:AudioBuffer):Promise<string>{
 const bytes=new ArrayBuffer(buffer.length*4),view=new DataView(bytes),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('invalid-pcm-sample');view.setFloat32(i*4,samples[i],true);}return hash(bytes);
}

/** Provisional source-clock mapping for the complete NMS question flow.
 * Native node duration bounds sound even when the caller's render loop stalls.
 * Empty negative-seek terminal metadata is retained, not applied as invented
 * trimming. This candidate never claims original Flash timing or acceptance. */
export class NmsL11SourceAudioCandidate {
 readonly plan:NmsL11AudioPlan;
 private readonly clips=new Map<string,NmsL11AudioClip>();
 private readonly buffers=new Map<string,AudioBuffer>();
 private context:AudioContext|undefined;
 private gain:GainNode|undefined;
 private node:AudioBufferSourceNode|undefined;
 private audioWindow:{start:number;end:number;domain:string}|undefined;
 private phase:Phase='idle';
 private interaction:Nms002State=createNms002State();
 private mainPosition=1;
 private feedbackPosition=2;
 private anchor:{time:number;frame:number;boundary:number;track:'main'|'feedback'}|undefined;
 private epoch=0;
 private volume=1;
 private wantsPlaying=false;
 private seed=0;
 private reduced=false;
 private explicitSession=false;
 private failure:string|null=null;
 private inspectionMode=false;
 private readonly contextChanged=()=>{
  if(this.context?.state==='running'||this.phase==='loading'||this.phase==='closed')return;
  this.settle();this.retire();this.epoch++;this.wantsPlaying=false;
  if(this.context?.state==='closed'){this.phase='closed';this.buffers.clear();this.gain?.disconnect();this.context.removeEventListener('statechange',this.contextChanged);}
  else if(this.phase==='main-playing'||this.phase==='starting-main')this.phase='main-paused';
  else if(this.phase==='feedback-playing'||this.phase==='starting-feedback')this.phase='feedback-paused';
 };
 constructor(plan:NmsL11AudioPlan,private readonly options:{createContext?:()=>AudioContext;commitPicture:(picture:NmsL11Picture)=>boolean}){
  if(plan.sourceSwfSha256!=='853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913'||plan.fps!==12||plan.clips.length!==10||typeof options.commitPicture!=='function')throw Error('invalid-nms-source-plan');
  const expected=new Map([['sprite-260',356],...NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.map(d=>['sprite-'+d.objectId,d.frameCount] as const)]);
  const firstAudio:Record<string,number>={'sprite-260':9,'sprite-90':3,'sprite-101':2,'sprite-112':2,'sprite-124':2,'sprite-150':2,'sprite-182':2,'sprite-215':1,'sprite-223':2,'sprite-251':2};
  for(const c of plan.clips){const d=c.decoder;
   if(expected.get(c.frameDomain)!==c.frameCount||this.clips.has(c.frameDomain)||!Number.isSafeInteger(c.audioFirstFrame)||c.audioFirstFrame<1||c.audioFirstFrame>c.frameCount||c.audioFirstFrame!==firstAudio[c.frameDomain]||c.latencySamples!==1673||
      !hashPattern.test(d.sourceSha256)||!hashPattern.test(d.pcmSha256)||!Number.isSafeInteger(d.sourceBytes)||d.sourceBytes<=0||d.sampleRate!==22050||d.channels!==1||!Number.isSafeInteger(d.decodedSamples)||d.decodedSamples<=1673)throw Error('invalid-nms-clip-binding');
   const terminal=c.terminalEmptyNegativeSeekBlocks;
   if(terminal.some(b=>!Number.isSafeInteger(b.frame)||!Number.isSafeInteger(b.seekSamples)||b.seekSamples>=0||b.sampleCount!==0||b.mp3Bytes!==0)||
      (c.frameDomain==='sprite-112'?JSON.stringify(terminal)!==JSON.stringify([{frame:27,seekSamples:-2093,sampleCount:0,mp3Bytes:0}]):
       c.frameDomain==='sprite-150'?JSON.stringify(terminal)!==JSON.stringify([{frame:31,seekSamples:-1953,sampleCount:0,mp3Bytes:0}]):terminal.length!==0))throw Error('unsupported-nms-terminal-metadata');
   this.clips.set(c.frameDomain,Object.freeze({...c,decoder:Object.freeze({...d}),terminalEmptyNegativeSeekBlocks:Object.freeze(terminal.map(b=>Object.freeze({...b})))}));
  }
  if(this.clips.get('sprite-260')!.audioFirstFrame!==9)throw Error('invalid-main-audio-entry');
  this.plan=Object.freeze({...plan,clips:Object.freeze([...this.clips.values()])});
 }
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 private retire(){const node=this.node;this.node=undefined;this.audioWindow=undefined;if(node){node.onended=null;try{node.stop();}catch{/* already naturally ended */}node.disconnect();}this.anchor=undefined;}
 private activeClip(){const pending=this.interaction.pendingFeedback;const d=pending?.domainId?NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.find(d=>d.id===pending.domainId):undefined;return d?this.clips.get('sprite-'+d.objectId):undefined;}
 private settle(){
  if(!this.anchor||!this.context)return;
  const a=this.anchor,elapsed=Math.max(0,this.context.currentTime-a.time),position=Math.min(a.boundary,a.frame+elapsed*this.plan.fps);
  if(a.track==='main')this.mainPosition=position;else this.feedbackPosition=position;
  if(position<a.boundary-1e-8)return;
  this.retire();
  if(a.track==='main'){this.phase=a.boundary===97?'question':'ended';return;}
  if(a.boundary===22&&this.interaction.pendingFeedback?.kind==='wrong'&&!this.interaction.wrongFeedbackDismissed){this.phase='feedback-dismissal';return;}
  this.interaction=reduceNms002(this.interaction,{type:'feedback-finished'});
  if(this.interaction.blockedReason){this.fail(this.interaction.blockedReason);return;}
  if(this.interaction.phase==='resumed'){this.mainPosition=98;this.phase='main-paused';}else this.phase='question';
 }
 private picture():NmsL11Picture {
  const clip=this.activeClip();return Object.freeze({mainFrame:Math.min(356,Math.floor(this.mainPosition+1e-8)),hintOpen:this.interaction.phase==='hint-open',feedbackObjectId:clip?Number(clip.frameDomain.slice(7)):null,feedbackFrame:clip?Math.min(clip.frameCount,Math.floor(this.feedbackPosition+1e-8)):1});
 }
 snapshot(){this.settle();const clip=this.activeClip();return Object.freeze({phase:this.phase,feedbackSeed:this.seed,inspectionMode:this.inspectionMode,picture:this.picture(),interaction:Object.freeze({...this.interaction,pendingFeedback:this.interaction.pendingFeedback?Object.freeze({...this.interaction.pendingFeedback}):null}),
   audioNodePlaying:Boolean(this.audioWindow&&this.context?.state==='running'&&this.context.currentTime>=this.audioWindow.start&&this.context.currentTime<this.audioWindow.end),mainPosition:this.mainPosition,feedbackPosition:clip?this.feedbackPosition:null,activeFrameDomain:clip?.frameDomain??'sprite-260',contextTime:this.context?.currentTime??null,volume:this.volume,failure:this.failure,wantsPlaying:this.wantsPlaying,
   sourceAlignment:'provisional-interactive-clock-not-accepted',audioAccepted:false,originalRuntimeAccepted:false,lessonCompleted:false});}
 private fail(reason:string){this.retire();this.epoch++;this.wantsPlaying=false;this.phase='failed';this.failure=reason;return result(false,reason);}
 async prepare(payloads:ReadonlyMap<string,ArrayBuffer>):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');this.phase='loading';const turn=++this.epoch;
  try{
   if(payloads.size!==10||[...payloads.keys()].some(k=>!this.clips.has(k)))throw Error('exact-ten-payloads-required');
   const copies=new Map([...payloads].map(([id,b])=>[id,b.slice(0)]));
   for(const [id,b]of copies){const d=this.clips.get(id)!.decoder;if(b.byteLength!==d.sourceBytes||await hash(b)!==d.sourceSha256)throw Error('source-byte-identity-mismatch:'+id);}
   if(turn!==this.epoch)return result(false,'stale-prepare');
   const context=this.options.createContext?.()??new AudioContext({sampleRate:22050,latencyHint:'interactive'});this.context=context;
   if(context.sampleRate!==22050)throw Error('context-rate-mismatch');await context.suspend();
   if(turn!==this.epoch)return result(false,'stale-prepare');
   context.addEventListener('statechange',this.contextChanged);this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   for(const [id,b]of copies){const buffer=await context.decodeAudioData(b),d=this.clips.get(id)!.decoder;
    if(turn!==this.epoch)return result(false,'stale-prepare');
    if(buffer.sampleRate!==d.sampleRate||buffer.numberOfChannels!==1||buffer.length!==d.decodedSamples||await pcmHash(buffer)!==d.pcmSha256)throw Error('decoded-pcm-identity-mismatch:'+id);
    if(turn!==this.epoch)return result(false,'stale-prepare');this.buffers.set(id,buffer);
   }
   if(!this.commit())throw Error('source-picture-not-committed');this.phase='ready';return result(true,'all-source-audio-ready');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-prepare');const r=this.fail(e instanceof Error?e.message:String(e));this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();this.buffers.clear();return r;}
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!validPolicy(policy))return result(false,'invalid-play-policy');
  if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');
  if(!['ready','main-paused','feedback-paused','starting-main','starting-feedback'].includes(this.phase))return result(false,'source-phase-cannot-play');
  if(policy.activation==='automatic'&&this.phase.startsWith('starting-'))return result(false,'start-already-pending');
  const feedback=this.phase==='feedback-paused'||this.phase==='starting-feedback',clip=feedback?this.activeClip()!:this.clips.get('sprite-260')!;
  const position=feedback?this.feedbackPosition:this.mainPosition,boundary=feedback?(this.interaction.pendingFeedback?.kind==='wrong'&&!this.interaction.wrongFeedbackDismissed?22:clip.frameCount):(this.interaction.phase==='resumed'?356:97);
  if(!clip||position>=boundary)return result(false,'no-source-interval');
  this.wantsPlaying=true;if(policy.activation==='user')this.explicitSession=true;this.reduced=policy.reducedMotion;this.phase=feedback?'starting-feedback':'starting-main';const turn=++this.epoch;
  try{
   // Commit the exact picture before resuming a native context or starting sound.
   if(!this.commit())throw Error('source-picture-not-committed');
   if(turn!==this.epoch)return result(false,'stale-picture-commit');
   await this.context!.resume();if(turn!==this.epoch)return result(false,'stale-start');
   if(this.context!.state!=='running')throw Error('context-not-running');
   const now=this.context!.currentTime,duration=(boundary-position)/this.plan.fps,lead=Math.max(0,(clip.audioFirstFrame-position)/this.plan.fps),sample=clip.latencySamples+Math.max(0,position-clip.audioFirstFrame)*22050/this.plan.fps,buffer=this.buffers.get(clip.frameDomain)!;
   if(sample<buffer.length&&duration>lead){const node=this.context!.createBufferSource();node.buffer=buffer;node.connect(this.gain!);
    const nativeDuration=Math.min((buffer.length-sample)/22050,duration-lead);try{node.start(now+lead,sample/22050,nativeDuration);node.stop(now+duration);}catch(e){node.disconnect();throw e;}this.node=node;this.audioWindow={start:now+lead,end:now+lead+nativeDuration,domain:clip.frameDomain};
   }
   this.anchor={time:now,frame:position,boundary,track:feedback?'feedback':'main'};this.phase=feedback?'feedback-playing':'main-playing';this.failure=null;return result(true,'source-interval-playing');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-start');this.retire();this.wantsPlaying=false;this.phase=feedback?'feedback-paused':'main-paused';this.failure=e instanceof Error?e.message:String(e);return result(false,this.failure);}
 }
 tick(){this.settle();if(this.wantsPlaying&&this.phase==='main-paused'&&this.interaction.phase==='resumed')void this.play({activation:this.explicitSession?'user':'automatic',reducedMotion:this.reduced});return this.snapshot();}
 pause(){this.settle();this.epoch++;this.wantsPlaying=false;const feedback=this.phase==='feedback-playing'||this.phase==='starting-feedback';const main=this.phase==='main-playing'||this.phase==='starting-main';this.retire();if(feedback)this.phase='feedback-paused';else if(main)this.phase='main-paused';return result(this.phase!=='closed'&&this.phase!=='failed','source-audio-held');}
 async choose(answerId:NmsAnswerId,policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!validPolicy(policy))return result(false,'invalid-play-policy');if(this.phase!=='question'||!['AnsBtn1','AnsBtn2','AnsBtn3','AnsBtn4'].includes(answerId))return result(false,'answer-control-unavailable');
  const pending=reduceNms002(this.interaction,{type:'choose-answer',answerId,input:'mouse'});if(!pending.pendingFeedback||pending.blockedReason)return result(false,'source-answer-rejected');
  const selected=selectHostFeedback(pending.pendingFeedback.kind,this.seed);this.interaction=reduceNms002(pending,{type:'resolve-feedback-domain',domainId:selected.instanceName as NmsFeedbackDomainId});
  if(this.interaction.blockedReason)return this.fail(this.interaction.blockedReason);this.feedbackPosition=2;this.phase='feedback-paused';return this.play(policy);
 }
 async dismissWrong(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!validPolicy(policy))return result(false,'invalid-play-policy');if(this.phase!=='feedback-dismissal')return result(false,'feedback-not-awaiting-dismissal');
  this.interaction=reduceNms002(this.interaction,{type:'dismiss-wrong-feedback',input:'mouse'});this.feedbackPosition=23;this.phase='feedback-paused';return this.play(policy);
 }
 openHint(){this.settle();if(this.phase!=='question')return result(false,'hint-unavailable');this.interaction=reduceNms002(this.interaction,{type:'open-hint',input:'mouse'});this.phase='hint';return this.commit()?result(true,'hint-open'):this.fail('source-picture-not-committed');}
 closeHint(){if(this.phase!=='hint')return result(false,'hint-not-open');this.interaction=reduceNms002(this.interaction,{type:'close-hint',input:'mouse'});this.phase='question';return this.commit()?result(true,'hint-closed'):this.fail('source-picture-not-committed');}
 replay(seed=0){if(['idle','loading','failed','closed'].includes(this.phase)||!Number.isSafeInteger(seed))return result(false,'replay-unavailable');this.epoch++;this.retire();this.wantsPlaying=false;this.seed=seed>>>0;this.mainPosition=1;this.feedbackPosition=2;this.inspectionMode=false;this.interaction=createNms002State();this.phase='ready';this.failure=null;return this.commit()?result(true,'replayed-and-held'):this.fail('source-picture-not-committed');}
 /** Modern audit-only reconstruction; never an answer or lesson-completion event. */
 inspectMainFrameForAudit(frame:number){
  if(['idle','loading','failed','closed'].includes(this.phase)||!Number.isSafeInteger(frame)||frame<1||frame>356)return result(false,'inspection-unavailable');
  this.epoch++;this.retire();this.wantsPlaying=false;this.inspectionMode=true;this.mainPosition=frame;this.feedbackPosition=2;this.interaction=createNms002State();
  if(frame>97)this.interaction={...this.interaction,phase:'resumed',mainFrame:98,mainPlaying:true,quizSection:false,answerControlsEnabled:false,hintButtonEnabled:false};
  this.phase=frame===97?'question':frame===356?'ended':'main-paused';
  return this.commit()?result(true,'audit-frame-held-without-source-completion'):this.fail('source-picture-not-committed');
 }
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=value;if(this.context&&this.gain)this.gain.gain.setValueAtTime(value,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;this.retire();this.wantsPlaying=false;this.phase='closed';this.buffers.clear();this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
