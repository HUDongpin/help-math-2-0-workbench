import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {createP018Interaction,reduceP018Interaction,validateP018Cards,type P018Card,type P018CardId,type P018Interaction,type P018Point} from './nms-l01-p018-interaction-v1';
export interface P018AudioClip {readonly frameDomain:string;readonly frameCount:number;readonly rawAudioFirstFrame:number;readonly visualEntryFrame:number;readonly latencySamples:number;readonly decoder:DecodedSourceStreamBinding;readonly selectable:boolean;}
export interface P018AudioPlan {readonly version:1;readonly animationId:string;readonly sourceSwfSha256:string;readonly fps:12;readonly mainFrameCount:492;readonly questionFrame:445;readonly mainAudioFirstFrame:9;readonly rightFeedbackDomain:'sprite-73';readonly rightFeedbackFirstFrame:2;readonly rightFeedbackLastFrame:25;readonly clips:readonly P018AudioClip[];readonly sourceAlignment:string;readonly feedbackStartPolicy?:string;readonly mainSegments:readonly Readonly<{firstFrame:number;firstDecodedSample:number;endDecodedSample:number}>[];readonly terminalFramePolicy:string;readonly emptyNegativeBlocks:readonly Readonly<{frame:number;samples:number;seek:number;mp3Bytes:number}>[];}
export interface P018Picture {readonly mainFrame:number;readonly interaction:Readonly<{positions:P018Interaction['positions'];locked:readonly P018CardId[];popup:'none'|'wrong';feedbackFrame:number;rightFrame:number}>;}
type Operation='intro'|'wrong'|'correct'|'completion'|'outro';
type Phase='idle'|'loading'|'ready'|'playing'|'paused'|'question'|'dragging'|'wrong-wait'|'ended'|'starting'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const hashPattern=/^[a-f0-9]{64}$/u;
async function hash(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
async function pcmHash(b:AudioBuffer){const bytes=new ArrayBuffer(b.length*4),v=new DataView(bytes),samples=b.getChannelData(0);for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('nonfinite-source-pcm');v.setFloat32(i*4,samples[i],true);}return hash(bytes);}
/** Source77 ->73 ->main continuation is scheduled natively as one finite chain. */
export class P018SourceClockV1 {
 readonly plan:P018AudioPlan;
 private readonly clips=new Map<string,P018AudioClip>();private buffers=new Map<string,AudioBuffer>();
 private context?:AudioContext;private gain?:GainNode;private nodes=new Set<AudioBufferSourceNode>();
 private state:P018Interaction;private phase:Phase='idle';private operation:Operation='intro';private position=0;private outroFirst=445;
 private anchor?:{time:number;position:number};private epoch=0;private globalPaused=true;private volume=1;private failure:string|null=null;private inspection=false;
 constructor(plan:P018AudioPlan,private readonly cards:readonly P018Card[],private readonly options:{createContext?:()=>AudioContext;commitPicture:(picture:P018Picture)=>boolean}){
  validateP018Cards(cards);this.state=createP018Interaction(cards);
  if(plan.version!==1||plan.animationId!=='shared-nms002-l01-p018'||plan.sourceSwfSha256!=='42109c2d4317b6e1b0af3519a00549344329d6a2266210d2cdd997c17d63bd7d'||plan.fps!==12||plan.mainFrameCount!==492||plan.questionFrame!==445||plan.mainAudioFirstFrame!==9||plan.rightFeedbackDomain!=='sprite-73'||plan.rightFeedbackFirstFrame!==2||plan.rightFeedbackLastFrame!==25||plan.clips.length!==4||typeof options.commitPicture!=='function')throw Error('P018_SOURCE_PLAN_MISMATCH');
  const expected:Record<string,readonly number[]>={'sprite-78':[492,9,879552],'sprite-69':[15,1,27072],'sprite-77':[20,2,34560],'sprite-75':[55,3,96768]};
  for(const c of plan.clips){const e=expected[c.frameDomain],d=c.decoder;if(!e||this.clips.has(c.frameDomain)||c.selectable!==(c.frameDomain!=='sprite-75')||c.frameCount!==e[0]||c.rawAudioFirstFrame!==e[1]||c.latencySamples!==1673||d.sampleRate!==22050||d.channels!==1||d.decodedSamples!==e[2]||!Number.isSafeInteger(d.sourceBytes)||d.sourceBytes<1||!hashPattern.test(d.sourceSha256)||!hashPattern.test(d.pcmSha256))throw Error('P018_SOURCE_CLIP_MISMATCH');this.clips.set(c.frameDomain,Object.freeze({...c,decoder:Object.freeze({...d})}));}
  if(JSON.stringify(plan.mainSegments)!==JSON.stringify([{firstFrame:9,firstDecodedSample:1673,endDecodedSample:725184},{firstFrame:409,firstDecodedSample:725420,endDecodedSample:879552}])||JSON.stringify(plan.emptyNegativeBlocks)!==JSON.stringify([{frame:404,samples:0,seek:-2103,mp3Bytes:0}]))throw Error('P018_SEGMENT_SOURCE_MISMATCH');
  this.plan=Object.freeze({...plan,mainSegments:Object.freeze(plan.mainSegments.map(s=>Object.freeze({...s}))),clips:Object.freeze([...this.clips.values()])});
 }
 private nativeSeconds(domain:string){const c=this.clips.get(domain)!;return(c.decoder.decodedSamples-c.latencySamples)/22050;}
 private duration(){return this.operation==='intro'?444/12:this.operation==='wrong'?Math.max(13/12,this.nativeSeconds('sprite-69')):this.operation==='correct'?18/12:this.operation==='completion'?18/12+23/12+47/12:(492-this.outroFirst)/12;}
 private windows(){
  const full=(domain:string,start:number)=>{const c=this.clips.get(domain)!;return{domain,start,end:start+this.nativeSeconds(domain),sample:c.latencySamples};};
  const main=(first:number,last:number,start:number)=>this.plan.mainSegments.flatMap(s=>{
   const authoredStart=(s.firstFrame-1)/12,authoredEnd=authoredStart+(s.endDecodedSample-s.firstDecodedSample)/22050;
   const from=Math.max((first-1)/12,authoredStart),to=Math.min((last-1)/12,authoredEnd);
   return to>from?[{domain:'sprite-78',start:start+from-(first-1)/12,end:start+to-(first-1)/12,sample:s.firstDecodedSample+(from-authoredStart)*22050}]:[];
  });
  if(this.operation==='intro')return main(1,445,0);
  if(this.operation==='wrong')return[full('sprite-69',0)];if(this.operation==='correct')return[full('sprite-77',0)];
  return this.operation==='completion'?[full('sprite-77',0),...main(445,492,41/12)]:main(this.outroFirst,492,0);
 }
 private retire(){this.anchor=undefined;for(const n of this.nodes){n.onended=null;try{n.stop();}catch{/* A native node may already have ended. */}n.disconnect();}this.nodes.clear();}
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  this.position=Math.min(this.duration(),this.anchor.position+Math.max(0,this.context.currentTime-this.anchor.time));
  if(this.position<this.duration()-1e-9)return;this.retire();
  if(this.operation==='intro'||this.operation==='correct'){this.phase='question';this.state=reduceP018Interaction(this.cards,this.state,{type:'clear-feedback'});}
  else if(this.operation==='wrong')this.phase='wrong-wait';else{this.phase='ended';this.globalPaused=true;}
 }
 private picture():P018Picture{
  let mainFrame=['idle','loading','ready'].includes(this.phase)?1:445,feedbackFrame=1,rightFrame=1;
  if(this.operation==='intro'&&['ready','starting','playing','paused'].includes(this.phase))mainFrame=Math.min(445,1+Math.floor(this.position*12+1e-8));
  if(this.operation==='wrong'&&['starting','playing','paused','wrong-wait'].includes(this.phase))feedbackFrame=Math.min(15,2+Math.floor(this.position*12+1e-8));
  if(this.operation==='completion'&&['starting','playing','paused'].includes(this.phase)){
   if(this.position>=41/12-1e-9)mainFrame=Math.min(492,445+Math.floor((this.position-41/12)*12+1e-8));
   else if(this.position>=18/12-1e-9)rightFrame=Math.min(25,2+Math.floor((this.position-18/12)*12+1e-8));
  }
  if(this.operation==='outro'&&['starting','playing','paused'].includes(this.phase))mainFrame=Math.min(492,this.outroFirst+Math.floor(this.position*12+1e-8));
  if(this.phase==='ended')mainFrame=492;
  const popup=this.operation==='wrong'&&['starting','playing','paused','wrong-wait'].includes(this.phase)?'wrong':'none';
  return Object.freeze({mainFrame,interaction:Object.freeze({positions:this.state.positions,locked:this.state.locked,popup,feedbackFrame,rightFrame})});
 }
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 snapshot(){
  this.settle();const windows=this.windows(),active=this.phase==='playing'&&this.context?.state==='running'?windows.find(w=>this.position>=w.start-1e-9&&this.position<w.end-1e-9):undefined;
  let sample=0;if(active)sample=active.sample+Math.max(0,this.position-active.start)*22050;
  return Object.freeze({phase:this.phase,operation:this.operation,operationSeconds:this.position,picture:this.picture(),interaction:this.state,globalPaused:this.globalPaused,inspectionMode:this.inspection,
   audioNodePlaying:Boolean(active),audioDomain:active?.domain??null,audioSample:sample,contextTime:this.context?.currentTime??null,volume:this.volume,failure:this.failure,
   correctDrops:this.state.locked.length,sourceQuizActive:this.picture().mainFrame===445&&this.phase!=='ended'&&!(this.operation==='completion'&&this.position>=41/12-1e-9),
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
   if(payloads.size!==4||[...payloads.keys()].some(k=>!this.clips.has(k)))throw Error('P018_EXACT_ACTIVE_PAYLOADS_REQUIRED');
   const copies=new Map([...payloads].map(([id,b])=>[id,b.slice(0)]));for(const[id,b]of copies){const d=this.clips.get(id)!.decoder;if(b.byteLength!==d.sourceBytes||await hash(b)!==d.sourceSha256)throw Error('source-byte-identity-mismatch:'+id);}
   if(turn!==this.epoch)return result(false,'stale-prepare');const context=this.options.createContext?.()??new AudioContext({sampleRate:22050,latencyHint:'interactive'});this.context=context;
   if(context.sampleRate!==22050)throw Error('context-rate-mismatch');context.addEventListener('statechange',this.contextChanged);this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   for(const[id,b]of copies){const decoded=await context.decodeAudioData(b),d=this.clips.get(id)!.decoder;if(turn!==this.epoch)return result(false,'stale-prepare');if(decoded.sampleRate!==22050||decoded.numberOfChannels!==1||decoded.length!==d.decodedSamples||await pcmHash(decoded)!==d.pcmSha256)throw Error('decoded-pcm-identity-mismatch:'+id);if(turn!==this.epoch)return result(false,'stale-prepare');this.buffers.set(id,decoded);}
   this.phase='ready';if(!this.commit())throw Error('source-picture-not-committed');return result(true,'P018_SOURCE_READY');
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
 select(cardId:string){this.settle();if(!['question','dragging'].includes(this.phase))return result(false,'source-drag-unavailable');const next=reduceP018Interaction(this.cards,this.state,{type:'select',cardId});if(next===this.state)return result(false,'source-card-unavailable');this.state=next;this.phase='dragging';return this.commit()?result(true,'source-card-selected'):this.fail('selected-picture-not-committed');}
 move(point:P018Point){if(this.phase!=='dragging')return result(false,'source-not-dragging');this.state=reduceP018Interaction(this.cards,this.state,{type:'move',point});return this.commit()?result(true,'source-card-moved'):this.fail('drag-picture-not-committed');}
 cancel(){if(this.phase!=='dragging')return result(false,'source-not-dragging');this.state=reduceP018Interaction(this.cards,this.state,{type:'cancel'});this.phase='question';return this.commit()?result(true,'source-drag-cancelled'):this.fail('cancel-picture-not-committed');}
 async drop(targetId:string|null,policy:Policy){
  if(this.phase!=='dragging'||!this.state.selected)return result(false,'source-not-dragging');this.state=reduceP018Interaction(this.cards,this.state,{type:'drop',targetId});
  this.operation=this.state.result==='wrong'?'wrong':this.state.locked.length===5?'completion':'correct';this.position=0;this.phase='paused';return this.play(policy);
 }
 closePopup(){this.settle();if(this.picture().interaction.popup!=='wrong')return result(false,'source-popup-not-open');this.epoch++;this.retire();this.state=reduceP018Interaction(this.cards,this.state,{type:'clear-feedback'});this.phase='question';this.operation='intro';this.position=444/12;return this.commit()?result(true,'source-popup-closed'):this.fail('popup-close-picture-not-committed');}
 replay(){if(['idle','loading','failed','closed'].includes(this.phase))return result(false,'replay-unavailable');this.epoch++;this.retire();this.state=reduceP018Interaction(this.cards,this.state,{type:'replay'});this.operation='intro';this.position=0;this.phase='ready';this.globalPaused=true;this.inspection=false;this.failure=null;return this.commit()?result(true,'source-replayed'):this.fail('replay-picture-not-committed');}
 inspect(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>492||['idle','loading','failed','closed'].includes(this.phase))return result(false,'invalid-source-inspection');
  this.epoch++;this.retire();this.state=reduceP018Interaction(this.cards,this.state,{type:'replay'});this.inspection=true;this.globalPaused=true;this.failure=null;
  if(frame<=445){this.operation='intro';this.position=(frame-1)/12;this.phase=frame===445?'question':'paused';}else{this.operation='outro';this.outroFirst=frame;this.position=0;this.phase=frame===492?'ended':'paused';}
  return this.commit()?result(true,'source-frame-inspected'):this.fail('inspection-picture-not-committed');
 }
 setVolume(v:number){if(!Number.isFinite(v)||v<0||v>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=v;if(this.context)this.gain?.gain.setValueAtTime(v,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;this.retire();this.phase='closed';this.globalPaused=true;this.buffers.clear();this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
