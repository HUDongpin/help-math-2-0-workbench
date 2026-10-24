import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {createP007Interaction,reduceP007Interaction,validateP007Cards,type P007Card,type P007CardId,type P007Interaction,type P007Point} from './nms-l01-p007-interaction-v1';
export interface P007AudioClip {readonly frameDomain:string;readonly frameCount:number;readonly rawAudioFirstFrame:number;readonly visualEntryFrame:number;readonly latencySamples:number;readonly decoder:DecodedSourceStreamBinding;}
export interface P007AudioPlan {readonly version:1;readonly animationId:string;readonly sourceSwfSha256:string;readonly fps:12;readonly mainFrameCount:220;readonly questionFrame:178;readonly mainAudioFirstFrame:8;readonly rightFeedbackDomain:'sprite-119';readonly rightFeedbackFirstFrame:2;readonly rightFeedbackLastFrame:25;readonly clips:readonly P007AudioClip[];readonly sourceAlignment:string;readonly feedbackStartPolicy?:string;}
export interface P007Picture {readonly mainFrame:number;readonly interaction:Readonly<{positions:P007Interaction['positions'];locked:readonly P007CardId[];popup:'none'|'help'|'wrong';feedbackFrame:number;rightFrame:number}>;}
type Operation='intro'|'wrong'|'correct'|'completion'|'outro';
type Phase='idle'|'loading'|'ready'|'playing'|'paused'|'question'|'dragging'|'wrong-wait'|'help'|'ended'|'starting'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const hashPattern=/^[a-f0-9]{64}$/u;
async function hash(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
async function pcmHash(b:AudioBuffer){const bytes=new ArrayBuffer(b.length*4),v=new DataView(bytes),samples=b.getChannelData(0);for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('nonfinite-source-pcm');v.setFloat32(i*4,samples[i],true);}return hash(bytes);}
/** Source113 ->119 ->main continuation is scheduled natively as one finite chain. */
export class P007SourceClockV1 {
 readonly plan:P007AudioPlan;
 private readonly clips=new Map<string,P007AudioClip>();private buffers=new Map<string,AudioBuffer>();
 private context?:AudioContext;private gain?:GainNode;private nodes=new Set<AudioBufferSourceNode>();
 private state:P007Interaction;private phase:Phase='idle';private operation:Operation='intro';private position=0;private outroFirst=178;
 private anchor?:{time:number;position:number};private epoch=0;private globalPaused=true;private volume=1;private failure:string|null=null;private inspection=false;
 constructor(plan:P007AudioPlan,private readonly cards:readonly P007Card[],private readonly options:{createContext?:()=>AudioContext;commitPicture:(picture:P007Picture)=>boolean}){
  validateP007Cards(cards);this.state=createP007Interaction(cards);
  if(plan.version!==1||plan.animationId!=='shared-nms002-l01-p007'||plan.sourceSwfSha256!=='d6af65fff8de6958b8125fb45516df0f70ebc71c8e60ff8cd31efe138f27365c'||plan.fps!==12||plan.mainFrameCount!==220||plan.questionFrame!==178||plan.mainAudioFirstFrame!==8||plan.rightFeedbackDomain!=='sprite-119'||plan.rightFeedbackFirstFrame!==2||plan.rightFeedbackLastFrame!==25||plan.clips.length!==3||typeof options.commitPicture!=='function')throw Error('P007_SOURCE_PLAN_MISMATCH');
  const expected:Record<string,readonly number[]>={'sprite-120':[220,8,391104],'sprite-111':[15,1,27072],'sprite-113':[20,2,34560]};
  for(const c of plan.clips){const e=expected[c.frameDomain],d=c.decoder;if(!e||this.clips.has(c.frameDomain)||c.frameCount!==e[0]||c.rawAudioFirstFrame!==e[1]||c.latencySamples!==1673||d.sampleRate!==22050||d.channels!==1||d.decodedSamples!==e[2]||!Number.isSafeInteger(d.sourceBytes)||d.sourceBytes<1||!hashPattern.test(d.sourceSha256)||!hashPattern.test(d.pcmSha256))throw Error('P007_SOURCE_CLIP_MISMATCH');this.clips.set(c.frameDomain,Object.freeze({...c,decoder:Object.freeze({...d})}));}
  this.plan=Object.freeze({...plan,clips:Object.freeze([...this.clips.values()])});
 }
 private nativeSeconds(domain:string){const c=this.clips.get(domain)!;return(c.decoder.decodedSamples-c.latencySamples)/22050;}
 private duration(){return this.operation==='intro'?177/12:this.operation==='wrong'?Math.max(13/12,this.nativeSeconds('sprite-111')):this.operation==='correct'?18/12:this.operation==='completion'?18/12+23/12+42/12:(220-this.outroFirst)/12;}
 private windows(){
  const main=this.clips.get('sprite-120')!,full=(domain:string,start:number)=>{const c=this.clips.get(domain)!;return{domain,start,end:start+this.nativeSeconds(domain),sample:c.latencySamples};};
  if(this.operation==='intro')return[{domain:'sprite-120',start:7/12,end:177/12,sample:1673}];
  if(this.operation==='wrong')return[full('sprite-111',0)];if(this.operation==='correct')return[full('sprite-113',0)];
  const first=this.operation==='completion'?178:this.outroFirst,start=this.operation==='completion'?41/12:0,sample=1673+(first-8)*22050/12;
  const outro={domain:'sprite-120',start,end:start+(main.decoder.decodedSamples-sample)/22050,sample};return this.operation==='completion'?[full('sprite-113',0),outro]:[outro];
 }
 private retire(){this.anchor=undefined;for(const n of this.nodes){n.onended=null;try{n.stop();}catch{/* A native node may already have ended. */}n.disconnect();}this.nodes.clear();}
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  this.position=Math.min(this.duration(),this.anchor.position+Math.max(0,this.context.currentTime-this.anchor.time));
  if(this.position<this.duration()-1e-9)return;this.retire();
  if(this.operation==='intro'||this.operation==='correct'){this.phase='question';this.state=reduceP007Interaction(this.cards,this.state,{type:'clear-feedback'});}
  else if(this.operation==='wrong')this.phase='wrong-wait';else{this.phase='ended';this.globalPaused=true;}
 }
 private picture():P007Picture{
  let mainFrame=['idle','loading','ready'].includes(this.phase)?1:178,feedbackFrame=1,rightFrame=1;
  if(this.operation==='intro'&&['ready','starting','playing','paused'].includes(this.phase))mainFrame=Math.min(178,1+Math.floor(this.position*12+1e-8));
  if(this.operation==='wrong'&&['starting','playing','paused','wrong-wait'].includes(this.phase))feedbackFrame=Math.min(15,2+Math.floor(this.position*12+1e-8));
  if(this.operation==='completion'&&['starting','playing','paused'].includes(this.phase)){
   if(this.position>=41/12-1e-9)mainFrame=Math.min(220,178+Math.floor((this.position-41/12)*12+1e-8));
   else if(this.position>=18/12-1e-9)rightFrame=Math.min(25,2+Math.floor((this.position-18/12)*12+1e-8));
  }
  if(this.operation==='outro'&&['starting','playing','paused'].includes(this.phase))mainFrame=Math.min(220,this.outroFirst+Math.floor(this.position*12+1e-8));
  if(this.phase==='ended')mainFrame=220;
  const popup=this.phase==='help'?'help':this.operation==='wrong'&&['starting','playing','paused','wrong-wait'].includes(this.phase)?'wrong':'none';
  return Object.freeze({mainFrame,interaction:Object.freeze({positions:this.state.positions,locked:this.state.locked,popup,feedbackFrame,rightFrame})});
 }
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 snapshot(){
  this.settle();const windows=this.windows(),active=this.phase==='playing'&&this.context?.state==='running'?windows.find(w=>this.position>=w.start-1e-9&&this.position<w.end-1e-9):undefined;
  let sample=0;if(active)sample=active.sample+Math.max(0,this.position-active.start)*22050;
  return Object.freeze({phase:this.phase,operation:this.operation,operationSeconds:this.position,picture:this.picture(),interaction:this.state,globalPaused:this.globalPaused,inspectionMode:this.inspection,
   audioNodePlaying:Boolean(active),audioDomain:active?.domain??null,audioSample:sample,contextTime:this.context?.currentTime??null,volume:this.volume,failure:this.failure,
   correctDrops:this.state.locked.length,sourceQuizActive:this.picture().mainFrame===178&&this.phase!=='ended'&&!(this.operation==='completion'&&this.position>=41/12-1e-9),
   originalRuntimeAccepted:false,audioAccepted:false,lessonCompleted:false});
 }
 tick(){return this.snapshot();}
 private readonly contextChanged=()=>{
  if(!this.context||this.context.state==='running'||['loading','closed'].includes(this.phase))return;
  this.settle();this.epoch++;this.retire();this.globalPaused=true;
  if(this.context.state==='closed'){this.phase='closed';this.buffers.clear();this.context.removeEventListener('statechange',this.contextChanged);}
  else if(['playing','starting'].includes(this.phase))this.phase='paused';
  this.commit();
 };
 private fail(reason:string){this.epoch++;this.retire();this.phase='failed';this.globalPaused=true;this.failure=reason;return result(false,reason);}
 async prepare(payloads:ReadonlyMap<string,ArrayBuffer>):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');this.phase='loading';const turn=++this.epoch;
  try{
   if(payloads.size!==3||[...payloads.keys()].some(k=>!this.clips.has(k)))throw Error('P007_EXACT_ACTIVE_PAYLOADS_REQUIRED');
   const copies=new Map([...payloads].map(([id,b])=>[id,b.slice(0)]));for(const[id,b]of copies){const d=this.clips.get(id)!.decoder;if(b.byteLength!==d.sourceBytes||await hash(b)!==d.sourceSha256)throw Error('source-byte-identity-mismatch:'+id);}
   if(turn!==this.epoch)return result(false,'stale-prepare');const context=this.options.createContext?.()??new AudioContext({sampleRate:22050,latencyHint:'interactive'});this.context=context;
   if(context.sampleRate!==22050)throw Error('context-rate-mismatch');context.addEventListener('statechange',this.contextChanged);this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   for(const[id,b]of copies){const decoded=await context.decodeAudioData(b),d=this.clips.get(id)!.decoder;if(turn!==this.epoch)return result(false,'stale-prepare');if(decoded.sampleRate!==22050||decoded.numberOfChannels!==1||decoded.length!==d.decodedSamples||await pcmHash(decoded)!==d.pcmSha256)throw Error('decoded-pcm-identity-mismatch:'+id);if(turn!==this.epoch)return result(false,'stale-prepare');this.buffers.set(id,decoded);}
   this.phase='ready';if(!this.commit())throw Error('source-picture-not-committed');return result(true,'P007_SOURCE_READY');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-prepare');const r=this.fail(e instanceof Error?e.message:String(e));this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();this.buffers.clear();return r;}
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!['automatic','user'].includes(policy.activation)||typeof policy.reducedMotion!=='boolean')return result(false,'invalid-play-policy');
  if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');
  if(['question','dragging'].includes(this.phase)){this.globalPaused=false;return result(true,'question-ready');}
  if(this.phase==='playing')return result(true,'already-playing');if(!['ready','paused','starting'].includes(this.phase)||!this.context||!this.gain)return result(false,'source-phase-cannot-play');
  if(this.phase==='starting'&&policy.activation==='automatic')return result(false,'start-pending');
  const turn=++this.epoch;this.retire();this.phase='starting';this.globalPaused=false;
  try{
   if(!this.commit())throw Error('source-picture-not-committed');if(turn!==this.epoch)return result(false,'stale-frame-commit');await this.context.resume();if(turn!==this.epoch)return result(false,'stale-start');if(this.context.state!=='running')throw Error('context-not-running');
   const now=this.context.currentTime;
   for(const w of this.windows()){
    const start=Math.max(this.position,w.start),end=Math.min(this.duration(),w.end);if(start>=end)continue;
    const n=this.context.createBufferSource();n.buffer=this.buffers.get(w.domain)!;n.connect(this.gain);this.nodes.add(n);n.onended=()=>{if(this.nodes.delete(n)){n.onended=null;n.disconnect();}};
    n.start(now+start-this.position,(w.sample+(start-w.start)*22050)/22050,end-start);
   }
   this.anchor={time:now,position:this.position};this.phase='playing';this.failure=null;return result(true,'source-operation-playing');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-start');this.retire();this.phase='paused';this.globalPaused=true;this.failure=e instanceof Error?e.message:String(e);return result(false,this.failure);}
 }
 pause(){this.settle();this.epoch++;this.retire();this.globalPaused=true;if(['playing','starting'].includes(this.phase))this.phase='paused';return this.commit()?result(true,'source-held'):this.fail('paused-picture-not-committed');}
 select(cardId:string){this.settle();if(!['question','dragging'].includes(this.phase))return result(false,'source-drag-unavailable');const next=reduceP007Interaction(this.cards,this.state,{type:'select',cardId});if(next===this.state)return result(false,'source-card-unavailable');this.state=next;this.phase='dragging';return this.commit()?result(true,'source-card-selected'):this.fail('selected-picture-not-committed');}
 move(point:P007Point){if(this.phase!=='dragging')return result(false,'source-not-dragging');this.state=reduceP007Interaction(this.cards,this.state,{type:'move',point});return this.commit()?result(true,'source-card-moved'):this.fail('drag-picture-not-committed');}
 cancel(){if(this.phase!=='dragging')return result(false,'source-not-dragging');this.state=reduceP007Interaction(this.cards,this.state,{type:'cancel'});this.phase='question';return this.commit()?result(true,'source-drag-cancelled'):this.fail('cancel-picture-not-committed');}
 async drop(targetId:string|null,policy:Policy){
  if(this.phase!=='dragging'||!this.state.selected)return result(false,'source-not-dragging');this.state=reduceP007Interaction(this.cards,this.state,{type:'drop',targetId});
  this.operation=this.state.result==='wrong'?'wrong':this.state.locked.length===4?'completion':'correct';this.position=0;this.phase='paused';return this.play(policy);
 }
 openHelp(){this.settle();if(!['question','dragging'].includes(this.phase))return result(false,'source-help-unavailable');if(this.phase==='dragging')this.cancel();this.pause();this.phase='help';return this.commit()?result(true,'source-help-open'):this.fail('help-picture-not-committed');}
 closePopup(){this.settle();if(this.phase!=='help'&&this.picture().interaction.popup!=='wrong')return result(false,'source-popup-not-open');this.epoch++;this.retire();this.state=reduceP007Interaction(this.cards,this.state,{type:'clear-feedback'});this.phase='question';this.operation='intro';this.position=177/12;return this.commit()?result(true,'source-popup-closed'):this.fail('popup-close-picture-not-committed');}
 replay(){if(['idle','loading','failed','closed'].includes(this.phase))return result(false,'replay-unavailable');this.epoch++;this.retire();this.state=reduceP007Interaction(this.cards,this.state,{type:'replay'});this.operation='intro';this.position=0;this.phase='ready';this.globalPaused=true;this.inspection=false;this.failure=null;return this.commit()?result(true,'source-replayed'):this.fail('replay-picture-not-committed');}
 inspect(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>220||['idle','loading','failed','closed'].includes(this.phase))return result(false,'invalid-source-inspection');
  this.epoch++;this.retire();this.state=reduceP007Interaction(this.cards,this.state,{type:'replay'});this.inspection=true;this.globalPaused=true;this.failure=null;
  if(frame<=178){this.operation='intro';this.position=(frame-1)/12;this.phase=frame===178?'question':'paused';}else{this.operation='outro';this.outroFirst=frame;this.position=0;this.phase=frame===220?'ended':'paused';}
  return this.commit()?result(true,'source-frame-inspected'):this.fail('inspection-picture-not-committed');
 }
 setVolume(v:number){if(!Number.isFinite(v)||v<0||v>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=v;if(this.context)this.gain?.gain.setValueAtTime(v,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;this.retire();this.phase='closed';this.globalPaused=true;this.buffers.clear();this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
