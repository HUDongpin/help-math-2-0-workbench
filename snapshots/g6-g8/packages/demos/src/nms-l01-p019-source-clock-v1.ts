import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {P019PracticeV1,type P019DisplayState,type P019Handle} from './nms-l01-p019-interaction-v1';
export interface P019AudioPlan {
 readonly version:1;readonly animationId:'shared-nms002-l01-p019';readonly sourceSwfSha256:string;
 readonly fps:12;readonly mainFrameDomain:'sprite-71';readonly mainFrameCount:555;readonly questionFrame:553;
 readonly rawAudioFirstFrame:7;readonly latencySamples:1673;readonly decoder:DecodedSourceStreamBinding;
 readonly sourceAlignment?:string;readonly terminalFramePolicy?:string;
 readonly sourceBoundary?:Readonly<{seconds:number;decodedSample:number;unplayedPreservedTailSamples:number}>;
}
export interface P019Picture {readonly mainFrame:number;readonly interaction:P019DisplayState;}
type Phase='idle'|'loading'|'ready'|'starting'|'playing'|'paused'|'question'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const rate=22050,duration=552/12,audioStart=6/12,firstSample=1673;
async function hash(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
async function pcmHash(buffer:AudioBuffer){
 const bytes=new ArrayBuffer(buffer.length*4),view=new DataView(bytes),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('P019_NONFINITE_PCM');view.setFloat32(i*4,samples[i]!,true);}return hash(bytes);
}
/** One native audio clock, stopped at source553; no question scoring or invented completion. */
export class P019SourceClockV1 {
 readonly plan:P019AudioPlan;
 private readonly practice:P019PracticeV1;
 private context?:AudioContext;private gain?:GainNode;private buffer?:AudioBuffer;private node?:AudioBufferSourceNode;
 private phase:Phase='idle';private position=0;private anchor?:{time:number;position:number};
 private epoch=0;private volume=1;private globalPaused=true;private inspection=false;private inspectedFrame:number|null=null;private failure:string|null=null;
 constructor(plan:P019AudioPlan,private readonly options:{seed?:number;createContext?:()=>AudioContext;commitPicture:(p:P019Picture)=>boolean}){
  if(plan.version!==1||plan.animationId!=='shared-nms002-l01-p019'||plan.sourceSwfSha256!=='1e87c6449e84acba17d947b26d27d0172c0daf6542e24d4b1290b70e308fec98'||plan.mainFrameDomain!=='sprite-71'||plan.fps!==12||plan.mainFrameCount!==555||plan.questionFrame!==553||plan.rawAudioFirstFrame!==7||plan.latencySamples!==1673||plan.decoder.sampleRate!==rate||plan.decoder.channels!==1||plan.decoder.decodedSamples!==1008000||!Number.isSafeInteger(plan.decoder.sourceBytes)||plan.decoder.sourceBytes<1||!/^[a-f0-9]{64}$/u.test(plan.decoder.sourceSha256)||!/^[a-f0-9]{64}$/u.test(plan.decoder.pcmSha256))throw Error('P019_SOURCE_PLAN_MISMATCH');
  this.plan=Object.freeze({...plan,decoder:Object.freeze({...plan.decoder})});this.practice=new P019PracticeV1(options.seed??0);
 }
 private retire(){this.anchor=undefined;const node=this.node;this.node=undefined;if(node){node.onended=null;try{node.stop();}catch{/* native end may already have fired */}node.disconnect();}}
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  this.position=Math.min(duration,this.anchor.position+Math.max(0,this.context.currentTime-this.anchor.time));
  if(this.position>=duration-1e-9){this.retire();this.phase='question';this.globalPaused=true;}
 }
 private picture():P019Picture{return Object.freeze({mainFrame:this.inspectedFrame??Math.min(553,1+Math.floor(this.position*12+1e-8)),interaction:this.practice.snapshot().picture});}
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 private fail(reason:string){this.epoch++;this.retire();this.phase='failed';this.globalPaused=true;this.failure=reason;return result(false,reason);}
 private readonly contextChanged=()=>{
  if(!this.context||this.context.state==='running'||['loading','closed'].includes(this.phase))return;
  this.settle();this.epoch++;this.retire();this.globalPaused=true;
  if(this.context.state==='closed'){this.phase='closed';this.buffer=undefined;this.context.removeEventListener('statechange',this.contextChanged);}
  else if(['playing','starting'].includes(this.phase))this.phase='paused';
  this.commit();
 };
 snapshot(){
  this.settle();const playing=this.phase==='playing'&&this.context?.state==='running'&&this.position>=audioStart&&this.position<duration;
  return Object.freeze({phase:this.phase,picture:this.picture(),practice:this.practice.snapshot(),operationSeconds:this.position,
   globalPaused:this.globalPaused,inspectionMode:this.inspection,audioNodePlaying:playing,
   audioSample:playing?firstSample+(this.position-audioStart)*rate:0,contextTime:this.context?.currentTime??null,
   sourceQuizActive:this.phase==='question',volume:this.volume,failure:this.failure,
   originalRuntimeAccepted:false,audioAccepted:false,lessonCompleted:false});
 }
 async prepare(payload:ArrayBuffer):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');
  const bytes=payload.slice(0),turn=++this.epoch;this.phase='loading';
  try{
   if(bytes.byteLength!==this.plan.decoder.sourceBytes||await hash(bytes)!==this.plan.decoder.sourceSha256)throw Error('source-byte-identity-mismatch');
   if(turn!==this.epoch)return result(false,'stale-prepare');
   const context=this.options.createContext?.()??new AudioContext({sampleRate:rate,latencyHint:'interactive'});this.context=context;
   if(context.sampleRate!==rate)throw Error('context-rate-mismatch');
   context.addEventListener('statechange',this.contextChanged);this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   const decoded=await context.decodeAudioData(bytes);if(turn!==this.epoch)return result(false,'stale-prepare');
   if(decoded.sampleRate!==rate||decoded.numberOfChannels!==1||decoded.length!==this.plan.decoder.decodedSamples||await pcmHash(decoded)!==this.plan.decoder.pcmSha256)throw Error('decoded-pcm-identity-mismatch');
   if(turn!==this.epoch)return result(false,'stale-prepare');this.buffer=decoded;this.phase='ready';
   if(!this.commit())throw Error('source-picture-not-committed');return result(true,'P019_SOURCE_READY');
  }catch(e){
   if(turn!==this.epoch)return result(false,'stale-prepare');const r=this.fail(e instanceof Error?e.message:String(e));
   this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();
   if(this.context&&this.context.state!=='closed')await this.context.close();this.buffer=undefined;return r;
  }
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();
  if(!['automatic','user'].includes(policy.activation)||typeof policy.reducedMotion!=='boolean')return result(false,'invalid-play-policy');
  if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');
  if(this.phase==='question')return result(true,'source-waiting-for-exploration');
  if(this.inspectedFrame!==null&&this.inspectedFrame>553)return result(false,'source-stop-before-inspected-frame');
  if(this.phase==='playing')return result(true,'already-playing');
  if(!['ready','paused','starting'].includes(this.phase)||!this.context||!this.gain||!this.buffer)return result(false,'source-phase-cannot-play');
  if(this.phase==='starting'&&policy.activation==='automatic')return result(false,'start-pending');
  const turn=++this.epoch;this.retire();this.inspectedFrame=null;this.phase='starting';this.globalPaused=false;
  try{
   if(!this.commit())throw Error('source-picture-not-committed');if(turn!==this.epoch)return result(false,'stale-frame-commit');
   await this.context.resume();if(turn!==this.epoch)return result(false,'stale-start');if(this.context.state!=='running')throw Error('context-not-running');
   const now=this.context.currentTime,start=Math.max(this.position,audioStart);
   if(start<duration){
    const node=this.context.createBufferSource();node.buffer=this.buffer;node.connect(this.gain);this.node=node;
    node.onended=()=>{if(this.node===node){this.node=undefined;node.onended=null;node.disconnect();}};
    node.start(now+start-this.position,(firstSample+(start-audioStart)*rate)/rate,duration-start);
   }
   this.anchor={time:now,position:this.position};this.phase='playing';this.failure=null;return result(true,'source-introduction-playing');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-start');this.retire();this.phase='paused';this.globalPaused=true;this.failure=e instanceof Error?e.message:String(e);return result(false,this.failure);}
 }
 pause(){
  this.settle();this.epoch++;this.retire();this.globalPaused=true;this.practice.finish(true);
  if(['playing','starting'].includes(this.phase))this.phase='paused';
  return this.commit()?result(true,'source-held'):this.fail('paused-picture-not-committed');
 }
 begin(id:P019Handle,x:number){this.settle();return this.phase==='question'&&this.practice.begin(id,x)&&this.commit();}
 move(x:number){return this.phase==='question'&&this.practice.move(x)&&this.commit();}
 finish(cancel=false){return this.phase==='question'&&this.practice.finish(cancel)&&this.commit();}
 setValue(id:P019Handle,value:number){return this.phase==='question'&&this.practice.setValue(id,value)&&this.commit();}
 newProblem(){if(this.phase!=='question')return false;this.practice.newProblem();return this.commit();}
 replay(){
  if(['idle','loading','failed','closed'].includes(this.phase))return result(false,'replay-unavailable');
  this.epoch++;this.retire();this.practice.replay();this.position=0;this.phase='ready';this.globalPaused=true;this.inspection=false;this.inspectedFrame=null;this.failure=null;
  return this.commit()?result(true,'source-replayed'):this.fail('replay-picture-not-committed');
 }
 inspect(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>555||['idle','loading','failed','closed'].includes(this.phase))return result(false,'invalid-source-inspection');
  this.epoch++;this.retire();this.practice.replay();this.position=Math.min(duration,(frame-1)/12);this.inspectedFrame=frame;
  this.phase=frame===553?'question':'paused';this.globalPaused=true;this.inspection=true;this.failure=null;
  return this.commit()?result(true,'source-frame-inspected'):this.fail('inspection-picture-not-committed');
 }
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=value;if(this.context)this.gain?.gain.setValueAtTime(value,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;this.retire();this.practice.finish(true);this.phase='closed';this.globalPaused=true;this.buffer=undefined;this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
