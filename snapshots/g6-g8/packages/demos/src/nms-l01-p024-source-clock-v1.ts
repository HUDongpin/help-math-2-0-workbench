import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {P024PracticeV1,type P024DisplayState} from './nms-l01-p024-interaction-v1';
export interface P024AudioPlan {
 readonly version:1;readonly animationId:'shared-nms002-l01-p024';readonly sourceSwfSha256:string;
 readonly fps:12;readonly mainFrameDomain:'sprite-137';readonly mainFrameCount:469;readonly questionFrame:468;
 readonly rawAudioFirstFrame:6;readonly latencySamples:1673;readonly decoder:DecodedSourceStreamBinding;
 readonly mainSegments:readonly Readonly<{firstFrame:number;firstDecodedSample:number;endDecodedSample:number}>[];
 readonly sourceAlignment?:string;readonly terminalFramePolicy?:string;
 readonly sourceBoundary?:Readonly<{seconds:number;decodedSample:number;unplayedPreservedTailSamples:number}>;
}
export interface P024Picture {readonly mainFrame:number;readonly interaction:P024DisplayState;}
type Phase='idle'|'loading'|'ready'|'starting'|'playing'|'paused'|'question'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const rate=22050,introDuration=467/12;
const expectedSegments=[{"firstFrame":6,"firstDecodedSample":1673,"endDecodedSample":293184},{"firstFrame":184,"firstDecodedSample":293414,"endDecodedSample":818496}];
async function hash(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
async function pcmHash(buffer:AudioBuffer){const bytes=new ArrayBuffer(buffer.length*4),view=new DataView(bytes),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('P024_NONFINITE_PCM');view.setFloat32(i*4,samples[i]!,true);}return hash(bytes);}
/** Two source MP3 runs and ten silent answer timelines share one cancellable native clock. */
export class P024SourceClockV1 {
 readonly plan:P024AudioPlan;private readonly practice:P024PracticeV1;
 private context?:AudioContext;private gain?:GainNode;private buffer?:AudioBuffer;private nodes:AudioBufferSourceNode[]=[];
 private phase:Phase='idle';private operation:'intro'|'reveal'='intro';private position=0;private anchor?:{time:number;position:number};
 private epoch=0;private volume=1;private globalPaused=true;private inspection=false;private inspectedFrame:number|null=null;private failure:string|null=null;
 constructor(plan:P024AudioPlan,private readonly options:{seed?:number;createContext?:()=>AudioContext;commitPicture:(p:P024Picture)=>boolean}){
  if(plan.version!==1||plan.animationId!=='shared-nms002-l01-p024'||plan.sourceSwfSha256!=='c7dbf393e645c04560e0977675131109667c8094315a70321ad8af552bca038d'||plan.mainFrameDomain!=='sprite-137'||plan.fps!==12||plan.mainFrameCount!==469||plan.questionFrame!==468||plan.rawAudioFirstFrame!==6||plan.latencySamples!==1673||plan.decoder.sampleRate!==rate||plan.decoder.channels!==1||plan.decoder.decodedSamples!==818496||plan.decoder.sourceBytes!==184730||plan.decoder.sourceSha256!=='a4e55b02628a13844843dccb4e5f847e7a937212f5c2714f0a7ac2dda40ad41f'||plan.decoder.pcmSha256!=='93ac703d96a01f9a08250d2a8f292a4fe10e09b957e538f79bf1d695d75a5b3f'||JSON.stringify(plan.mainSegments)!==JSON.stringify(expectedSegments))throw Error('P024_SOURCE_PLAN_MISMATCH');
  this.plan=Object.freeze({...plan,decoder:Object.freeze({...plan.decoder}),mainSegments:Object.freeze(plan.mainSegments.map(s=>Object.freeze({...s})))});this.practice=new P024PracticeV1(options.seed??0);
 }
 private duration(){return this.operation==='intro'?introDuration:(this.practice.snapshot().answerFrameCount-2)/12;}
 private windows(){return this.plan.mainSegments.map(s=>({start:(s.firstFrame-1)/12,end:Math.min(introDuration,(s.firstFrame-1)/12+(s.endDecodedSample-s.firstDecodedSample)/rate),sample:s.firstDecodedSample}));}
 private retire(){this.anchor=undefined;for(const n of this.nodes){n.onended=null;try{n.stop();}catch{/* already ended */}n.disconnect();}this.nodes=[];}
 private settle(){
  if(this.phase!=='playing'||!this.anchor||!this.context)return;
  this.position=Math.min(this.duration(),this.anchor.position+Math.max(0,this.context.currentTime-this.anchor.time));
  if(this.operation==='reveal')this.practice.setAnswerFrame(Math.min(this.practice.snapshot().answerFrameCount,2+Math.floor(this.position*12+1e-8)));
  if(this.position>=this.duration()-1e-9){this.retire();this.phase='question';this.globalPaused=true;}
 }
 private picture():P024Picture{return Object.freeze({mainFrame:this.inspectedFrame??(this.operation==='reveal'?468:Math.min(468,1+Math.floor(this.position*12+1e-8))),interaction:this.practice.snapshot().picture});}
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 private fail(reason:string){this.epoch++;this.retire();this.phase='failed';this.globalPaused=true;this.failure=reason;return result(false,reason);}
 private readonly contextChanged=()=>{
  if(!this.context||this.context.state==='running'||['loading','closed'].includes(this.phase))return;
  this.settle();this.epoch++;this.retire();this.globalPaused=true;
  if(this.context.state==='closed'){this.phase='closed';this.buffer=undefined;this.context.removeEventListener('statechange',this.contextChanged);}
  else if(['playing','starting'].includes(this.phase))this.phase='paused';this.commit();
 };
 snapshot(){
  this.settle();const window=this.operation==='intro'&&this.phase==='playing'&&this.context?.state==='running'?this.windows().find(w=>this.position>=w.start&&this.position<w.end):undefined;
  const canPractice=this.picture().mainFrame===468&&['question','playing','paused','starting'].includes(this.phase);
  return Object.freeze({phase:this.phase,operation:this.operation,picture:this.picture(),practice:this.practice.snapshot(),operationSeconds:this.position,globalPaused:this.globalPaused,inspectionMode:this.inspection,audioNodePlaying:Boolean(window),audioSample:window?window.sample+(this.position-window.start)*rate:0,contextTime:this.context?.currentTime??null,sourceQuizActive:canPractice,canNewProblem:canPractice,canMultiply:canPractice&&this.phase==='question'&&!this.practice.snapshot().picture.revealed,volume:this.volume,failure:this.failure,originalRuntimeAccepted:false,audioAccepted:false,lessonCompleted:false});
 }
 async prepare(payload:ArrayBuffer):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');const bytes=payload.slice(0),turn=++this.epoch;this.phase='loading';
  try{
   if(bytes.byteLength!==this.plan.decoder.sourceBytes||await hash(bytes)!==this.plan.decoder.sourceSha256)throw Error('source-byte-identity-mismatch');if(turn!==this.epoch)return result(false,'stale-prepare');
   const c=this.options.createContext?.()??new AudioContext({sampleRate:rate,latencyHint:'interactive'});this.context=c;if(c.sampleRate!==rate)throw Error('context-rate-mismatch');c.addEventListener('statechange',this.contextChanged);this.gain=c.createGain();this.gain.connect(c.destination);this.gain.gain.setValueAtTime(this.volume,c.currentTime);
   const decoded=await c.decodeAudioData(bytes);if(turn!==this.epoch)return result(false,'stale-prepare');if(decoded.sampleRate!==rate||decoded.numberOfChannels!==1||decoded.length!==this.plan.decoder.decodedSamples||await pcmHash(decoded)!==this.plan.decoder.pcmSha256)throw Error('decoded-pcm-identity-mismatch');if(turn!==this.epoch)return result(false,'stale-prepare');this.buffer=decoded;this.phase='ready';if(!this.commit())throw Error('source-picture-not-committed');return result(true,'P024_SOURCE_READY');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-prepare');const r=this.fail(e instanceof Error?e.message:String(e));this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();this.buffer=undefined;return r;}
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!['automatic','user'].includes(policy.activation)||typeof policy.reducedMotion!=='boolean')return result(false,'invalid-play-policy');if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');if(this.phase==='question')return result(true,'source-waiting-for-multiplyion');if(this.inspectedFrame!==null&&this.inspectedFrame>468)return result(false,'source-stop-before-inspected-frame');if(this.phase==='playing')return result(true,'already-playing');
  if(!['ready','paused','starting'].includes(this.phase)||!this.context||!this.gain||!this.buffer)return result(false,'source-phase-cannot-play');if(this.phase==='starting'&&policy.activation==='automatic')return result(false,'start-pending');
  const turn=++this.epoch;this.retire();this.inspectedFrame=null;this.phase='starting';this.globalPaused=false;
  try{
   if(!this.commit())throw Error('source-picture-not-committed');if(turn!==this.epoch)return result(false,'stale-frame-commit');await this.context.resume();if(turn!==this.epoch)return result(false,'stale-start');if(this.context.state!=='running')throw Error('context-not-running');const now=this.context.currentTime;
   if(this.operation==='intro')for(const w of this.windows()){
    const start=Math.max(this.position,w.start);if(start>=w.end)continue;const n=this.context.createBufferSource();n.buffer=this.buffer;n.connect(this.gain);this.nodes.push(n);n.onended=()=>{const i=this.nodes.indexOf(n);if(i>=0){this.nodes.splice(i,1);n.onended=null;n.disconnect();}};n.start(now+start-this.position,(w.sample+(start-w.start)*rate)/rate,w.end-start);
   }
   this.anchor={time:now,position:this.position};this.phase='playing';this.failure=null;return result(true,this.operation==='intro'?'source-introduction-playing':'source-answer-playing');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-start');this.retire();this.phase='paused';this.globalPaused=true;this.failure=e instanceof Error?e.message:String(e);return result(false,this.failure);}
 }
 pause(){this.settle();this.epoch++;this.retire();this.globalPaused=true;if(['playing','starting'].includes(this.phase))this.phase='paused';return this.commit()?result(true,'source-held'):this.fail('paused-picture-not-committed');}
 async multiply(policy:Policy):Promise<DecodedStreamResult>{
  if(!this.snapshot().canMultiply||!['automatic','user'].includes(policy.activation)||typeof policy.reducedMotion!=='boolean')return result(false,'multiply-unavailable');
  this.epoch++;this.retire();this.practice.multiply();this.operation='reveal';this.position=0;this.phase='paused';this.inspectedFrame=null;this.globalPaused=true;if(!this.commit())return this.fail('answer-picture-not-committed');return this.play(policy);
 }
 newProblem(){
  if(!this.snapshot().canNewProblem)return false;this.epoch++;this.retire();this.practice.newProblem();this.operation='intro';this.position=introDuration;this.phase='question';this.inspectedFrame=null;this.globalPaused=true;return this.commit();
 }
 replay(){if(['idle','loading','failed','closed'].includes(this.phase))return result(false,'replay-unavailable');this.epoch++;this.retire();this.practice.replay();this.operation='intro';this.position=0;this.phase='ready';this.globalPaused=true;this.inspection=false;this.inspectedFrame=null;this.failure=null;return this.commit()?result(true,'source-replayed'):this.fail('replay-picture-not-committed');}
 inspect(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>469||['idle','loading','failed','closed'].includes(this.phase))return result(false,'invalid-source-inspection');this.epoch++;this.retire();this.practice.replay();this.operation='intro';this.position=Math.min(introDuration,(frame-1)/12);this.inspectedFrame=frame;this.phase=frame===468?'question':'paused';this.globalPaused=true;this.inspection=true;this.failure=null;return this.commit()?result(true,'source-frame-inspected'):this.fail('inspection-picture-not-committed');}
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=value;if(this.context)this.gain?.gain.setValueAtTime(value,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;this.retire();this.phase='closed';this.globalPaused=true;this.buffer=undefined;this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
