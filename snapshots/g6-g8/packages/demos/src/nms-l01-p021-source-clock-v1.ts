import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {P021PracticeV1,type P021Problem,type P021Point,type P021PracticePicture} from './nms-l01-p021-interaction-v1';
export interface P021AudioPlan {
 readonly version:1;readonly animationId:'shared-nms002-l01-p021';readonly sourceSwfSha256:string;readonly fps:12;
 readonly mainFrameDomain:'sprite-160';readonly mainFrameCount:572;readonly questionFrame:571;
 readonly clips:readonly Readonly<{frameDomain:string;frameCount:number;rawAudioFirstFrame:number;latencySamples:1673;playable:boolean;decoder:DecodedSourceStreamBinding}>[];
 readonly coachVariants:readonly Readonly<{label:string;firstFrame:number;stopFrame:number;firstDecodedSample:number;durationSeconds:number;endDecodedSample:number}>[];
 readonly sourceBoundary?:Readonly<{seconds:number;decodedSample:number;unplayedPreservedTailSamples:number}>;
 readonly sourceAlignment?:string;readonly terminalFramePolicy?:string;
}
export interface P021Picture {readonly mainFrame:number;readonly interaction:P021PracticePicture&Readonly<{coachFrame:number;correctFrame:number;closePressed:boolean;buttonFrame:number}>;}
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
type Phase='idle'|'loading'|'ready'|'starting'|'playing'|'paused'|'question'|'failed'|'closed';
type Kind='main'|'coach'|'correct'|'button';
type Track={kind:Kind;domain:string;entry:number;stop:number;duration:number;audioDelay:number;sample:number;position:number;anchor?:{time:number;position:number};node?:AudioBufferSourceNode;done:boolean;label?:string};
const rate=22050,mainDuration=570/12;
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const policyValid=(p:Policy)=>p&&['automatic','user'].includes(p.activation)&&typeof p.reducedMotion==='boolean';
async function hash(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
async function pcmHash(buffer:AudioBuffer){const bytes=new ArrayBuffer(buffer.length*4),view=new DataView(bytes),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('P021_NONFINITE_PCM');view.setFloat32(i*4,samples[i]!,true);}return hash(bytes);}
/** Source main160, coach46, correct157 and close-button149 retain independent bounded native tracks. */
export class P021SourceClockV1 {
 readonly plan:P021AudioPlan;private readonly practice:P021PracticeV1;
 private context?:AudioContext;private gain?:GainNode;private buffers=new Map<string,AudioBuffer>();private tracks=new Map<Kind,Track>();
 private phase:Phase='idle';private epoch=0;private volume=1;private globalPaused=true;private inspection=false;private inspectedFrame:number|null=null;private failure:string|null=null;private closePressed=false;private lastCoachLabel:string|null=null;
 constructor(plan:P021AudioPlan,problems:readonly P021Problem[],private readonly options:{seed?:number;createContext?:()=>AudioContext;commitPicture:(p:P021Picture)=>boolean}){
  const expected=[['sprite-46',55,3,96768,true],['sprite-149',5,1,8640,true],['sprite-157',25,2,43776,true],['sprite-159',20,2,34560,false],['sprite-160',572,9,1035648,true]];
  if(plan.version!==1||plan.animationId!=='shared-nms002-l01-p021'||plan.sourceSwfSha256!=='0d1c2ea937365b40403eb7584b3133fd1820fb959d23cdd76e18f02fb0b8a1b1'||plan.fps!==12||plan.mainFrameDomain!=='sprite-160'||plan.mainFrameCount!==572||plan.questionFrame!==571||JSON.stringify(plan.clips.map(c=>[c.frameDomain,c.frameCount,c.rawAudioFirstFrame,c.decoder.decodedSamples,c.playable]))!==JSON.stringify(expected)||JSON.stringify(plan.coachVariants.map(c=>[c.label,c.firstFrame,c.stopFrame,c.firstDecodedSample]))!==JSON.stringify([['S1',3,16,1673],['S2',18,27,27391],['S3',31,36,51272],['S4',40,54,67805]]))throw Error('P021_SOURCE_PLAN_MISMATCH');
  for(const c of plan.clips)if(c.latencySamples!==1673||c.decoder.sampleRate!==rate||c.decoder.channels!==1||!Number.isSafeInteger(c.decoder.sourceBytes)||c.decoder.sourceBytes<1||!(/^[a-f0-9]{64}$/u.test(c.decoder.sourceSha256)&&/^[a-f0-9]{64}$/u.test(c.decoder.pcmSha256)))throw Error('P021_SOURCE_DECODER_MISMATCH');
  for(const c of plan.coachVariants)if(c.durationSeconds!==(c.stopFrame-c.firstFrame)/12||c.endDecodedSample!==c.firstDecodedSample+c.durationSeconds*rate)throw Error('P021_SOURCE_COACH_MISMATCH');
  this.plan=Object.freeze({...plan,clips:Object.freeze(plan.clips.map(c=>Object.freeze({...c,decoder:Object.freeze({...c.decoder})}))),coachVariants:Object.freeze(plan.coachVariants.map(c=>Object.freeze({...c})))});this.practice=new P021PracticeV1(problems,options.seed??0);this.resetMain();
 }
 private resetMain(){this.tracks.set('main',{kind:'main',domain:'sprite-160',entry:1,stop:571,duration:mainDuration,audioDelay:8/12,sample:1673,position:0,done:false});}
 private retire(t:Track){t.anchor=undefined;const n=t.node;t.node=undefined;if(n){n.onended=null;try{n.stop();}catch{/* source already ended */}n.disconnect();}}
 private remove(kind:Kind){const t=this.tracks.get(kind);if(t)this.retire(t);this.tracks.delete(kind);}
 private hasRemaining(){return [...this.tracks.values()].some(t=>!t.done);}
 private hasRunning(){return [...this.tracks.values()].some(t=>!t.done&&Boolean(t.anchor));}
 private refreshPhase(){
  if(['idle','loading','failed','closed'].includes(this.phase))return;
  if(this.inspectedFrame===572){this.phase='paused';this.globalPaused=true;return;}
  if(this.hasRunning()){this.phase='playing';this.globalPaused=false;}
  else if(!this.hasRemaining()){this.phase='question';this.globalPaused=true;}
  else if(!this.globalPaused)this.phase='starting';
  else if(this.phase!=='ready')this.phase='paused';
 }
 private settle(){
  if(!this.context)return;
  for(const t of [...this.tracks.values()]){
   if(!t.anchor||t.done)continue;t.position=Math.min(t.duration,t.anchor.position+Math.max(0,this.context.currentTime-t.anchor.time));
   if(t.position>=t.duration-1e-9){t.position=t.duration;t.done=true;this.retire(t);if(t.kind==='coach')this.tracks.delete('coach');if(t.kind==='correct'){this.tracks.delete('correct');this.practice.correctDone();}}
  }
  this.refreshPhase();
 }
 private frame(kind:Kind){const t=this.tracks.get(kind);return t?Math.min(t.stop,t.entry+Math.floor(t.position*12+1e-8)):1;}
 private picture():P021Picture{return Object.freeze({mainFrame:this.inspectedFrame??this.frame('main'),interaction:Object.freeze({...this.practice.snapshot().picture,coachFrame:this.frame('coach'),correctFrame:this.frame('correct'),closePressed:this.closePressed,buttonFrame:this.frame('button')})});}
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 private fail(reason:string){this.epoch++;for(const t of this.tracks.values())this.retire(t);this.phase='failed';this.globalPaused=true;this.failure=reason;return result(false,reason);}
 private canInteract(){return this.tracks.get('main')?.done===true&&this.inspectedFrame!==572&&!['idle','loading','failed','closed'].includes(this.phase);}
 private readonly contextChanged=()=>{if(!this.context||this.context.state==='running'||['loading','closed'].includes(this.phase))return;this.pause();if(this.context.state==='closed'){this.phase='closed';this.buffers.clear();this.context.removeEventListener('statechange',this.contextChanged);}};
 snapshot(){
  this.settle();const tracks=[...this.tracks.values()].map(t=>{const buffer=this.buffers.get(t.domain),audioEnd=Math.min(t.duration,t.audioDelay+((buffer?.length??0)-t.sample)/rate),audioPlaying=Boolean(t.anchor&&!t.done&&this.context?.state==='running'&&t.position>=t.audioDelay&&t.position<audioEnd);return Object.freeze({kind:t.kind,domain:t.domain,label:t.label??null,frame:this.frame(t.kind),seconds:t.position,done:t.done,running:Boolean(t.anchor),audioPlaying,audioSample:audioPlaying?t.sample+(t.position-t.audioDelay)*rate:0});});
  const p=this.practice.snapshot(),canInteract=this.canInteract();return Object.freeze({phase:this.phase,picture:this.picture(),practice:p,tracks:Object.freeze(tracks),globalPaused:this.globalPaused,inspectionMode:this.inspection,audioNodePlaying:tracks.some(t=>t.audioPlaying),activeAudioDomains:tracks.filter(t=>t.audioPlaying).map(t=>t.domain),contextTime:this.context?.currentTime??null,sourceQuizActive:canInteract,canInteract,canNewProblem:canInteract&&p.newProblemEnabled,coachLabel:this.lastCoachLabel,volume:this.volume,failure:this.failure,originalRuntimeAccepted:false,audioAccepted:false,lessonCompleted:false});
 }
 async prepare(payloads:Readonly<Record<string,ArrayBuffer>>):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');const turn=++this.epoch;this.phase='loading';
  try{
   if(Object.keys(payloads).sort().join()!==this.plan.clips.map(c=>c.frameDomain).sort().join())throw Error('source-payload-set-mismatch');const bytes=new Map<string,ArrayBuffer>();
   for(const c of this.plan.clips){const b=payloads[c.frameDomain]!.slice(0);if(b.byteLength!==c.decoder.sourceBytes||await hash(b)!==c.decoder.sourceSha256)throw Error('source-byte-identity-mismatch:'+c.frameDomain);bytes.set(c.frameDomain,b);}
   if(turn!==this.epoch)return result(false,'stale-prepare');const context=this.options.createContext?.()??new AudioContext({sampleRate:rate,latencyHint:'interactive'});this.context=context;if(context.sampleRate!==rate)throw Error('context-rate-mismatch');context.addEventListener('statechange',this.contextChanged);this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   const decoded=await Promise.all(this.plan.clips.map(async c=>{const b=await context.decodeAudioData(bytes.get(c.frameDomain)!);if(b.sampleRate!==rate||b.numberOfChannels!==1||b.length!==c.decoder.decodedSamples||await pcmHash(b)!==c.decoder.pcmSha256)throw Error('decoded-pcm-identity-mismatch:'+c.frameDomain);return [c.frameDomain,b] as const;}));
   if(turn!==this.epoch)return result(false,'stale-prepare');this.buffers=new Map(decoded);this.phase='ready';if(!this.commit())throw Error('source-picture-not-committed');return result(true,'P021_SOURCE_READY');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-prepare');const r=this.fail(e instanceof Error?e.message:String(e));this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();this.buffers.clear();return r;}
 }
 private schedule(t:Track){
  const c=this.context!,gain=this.gain!,buffer=this.buffers.get(t.domain)!;if(t.done||t.anchor)return;
  const now=c.currentTime,start=Math.max(t.position,t.audioDelay),end=Math.min(t.duration,t.audioDelay+(buffer.length-t.sample)/rate);
  if(start<end){const n=c.createBufferSource();n.buffer=buffer;n.connect(gain);t.node=n;n.onended=()=>{if(t.node===n){t.node=undefined;n.onended=null;n.disconnect();}};n.start(now+start-t.position,(t.sample+(start-t.audioDelay)*rate)/rate,end-start);}
  t.anchor={time:now,position:t.position};
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!policyValid(policy))return result(false,'invalid-play-policy');if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');if(this.inspectedFrame!==null&&this.inspectedFrame>571)return result(false,'source-stop-before-inspected-frame');if(['idle','loading','failed','closed'].includes(this.phase)||!this.context||!this.gain||this.buffers.size!==5)return result(false,'source-phase-cannot-play');
  if(!this.hasRemaining()){this.phase='question';this.globalPaused=true;return result(true,'source-waiting-for-jumps');}
  const pending=[...this.tracks.values()].filter(t=>!t.done&&!t.anchor);if(!pending.length)return result(true,'already-playing');const turn=this.epoch;this.inspectedFrame=null;this.globalPaused=false;if(!this.hasRunning())this.phase='starting';
  try{if(!this.commit())throw Error('source-picture-not-committed');await this.context.resume();if(turn!==this.epoch)return result(false,'stale-start');if(this.context.state!=='running')throw Error('context-not-running');for(const t of pending)if(this.tracks.get(t.kind)===t&&!t.done&&!t.anchor)this.schedule(t);this.refreshPhase();this.failure=null;return result(true,'source-tracks-playing');}
  catch(e){if(turn!==this.epoch)return result(false,'stale-start');this.pause();this.failure=e instanceof Error?e.message:String(e);return result(false,this.failure);}
 }
 pause(){this.settle();this.epoch++;for(const t of this.tracks.values())this.retire(t);this.remove('button');this.closePressed=false;this.practice.cancel();this.globalPaused=true;if(!['idle','loading','failed','closed'].includes(this.phase))this.phase=this.hasRemaining()?'paused':'question';return this.commit()?result(true,'source-held'):this.fail('paused-picture-not-committed');}
 select(id:string){return this.canInteract()&&this.practice.select(id)&&this.commit();}
 begin(id:string){return this.canInteract()&&this.practice.begin(id)&&this.commit();}
 move(p:P021Point){return this.canInteract()&&this.practice.move(p)&&this.commit();}
 cancel(){const changed=this.practice.cancel();return changed&&this.commit();}
 async drop(onTarget:boolean,policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!this.canInteract()||!policyValid(policy))return result(false,'drop-unavailable');const outcome=this.practice.drop(onTarget);if(outcome==='unavailable')return result(false,'drop-unavailable');
  if(outcome==='outside'||outcome==='wrong'){
   const v=this.plan.coachVariants[this.practice.nextCoach()]!;this.remove('coach');this.lastCoachLabel=v.label;this.tracks.set('coach',{kind:'coach',domain:'sprite-46',entry:v.firstFrame,stop:v.stopFrame,duration:v.durationSeconds,audioDelay:0,sample:v.firstDecodedSample,position:0,done:false,label:v.label});
  }else if(outcome==='correct'){this.remove('correct');this.tracks.set('correct',{kind:'correct',domain:'sprite-157',entry:2,stop:25,duration:23/12,audioDelay:0,sample:1673,position:0,done:false});}
  if(!this.commit())return this.fail('drop-picture-not-committed');if(outcome==='first')return result(true,'source-first-jump-placed');return this.play(policy);
 }
 async pressClose(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!this.canInteract()||this.practice.snapshot().picture.popup!=='wrong'||this.closePressed||!policyValid(policy))return result(false,'close-press-unavailable');this.closePressed=true;this.tracks.set('button',{kind:'button',domain:'sprite-149',entry:1,stop:5,duration:4/12,audioDelay:0,sample:1673,position:0,done:false});if(!this.commit())return this.fail('button-picture-not-committed');return this.play(policy);
 }
 cancelClose(){this.settle();this.remove('button');this.closePressed=false;this.refreshPhase();return this.commit();}
 closeWrong(){this.settle();if(!this.canInteract()||!this.practice.closeWrong())return false;this.remove('button');this.closePressed=false;this.refreshPhase();return this.commit();}
 newProblem(){this.settle();if(!this.canInteract()||!this.practice.newProblem())return false;this.closePressed=false;this.remove('button');return this.commit();}
 replay(){if(['idle','loading','failed','closed'].includes(this.phase))return result(false,'replay-unavailable');this.epoch++;for(const t of this.tracks.values())this.retire(t);this.tracks.clear();this.resetMain();this.practice.replay();this.closePressed=false;this.lastCoachLabel=null;this.phase='ready';this.globalPaused=true;this.inspection=false;this.inspectedFrame=null;this.failure=null;return this.commit()?result(true,'source-replayed'):this.fail('replay-picture-not-committed');}
 inspect(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>572||['idle','loading','failed','closed'].includes(this.phase))return result(false,'invalid-source-inspection');this.epoch++;for(const t of this.tracks.values())this.retire(t);this.tracks.clear();this.resetMain();const main=this.tracks.get('main')!;main.position=Math.min(mainDuration,(frame-1)/12);main.done=frame>=571;this.practice.replay();this.closePressed=false;this.lastCoachLabel=null;this.phase=frame===571?'question':'paused';this.globalPaused=true;this.inspection=true;this.inspectedFrame=frame;this.failure=null;return this.commit()?result(true,'source-frame-inspected'):this.fail('inspection-picture-not-committed');
 }
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=value;if(this.context)this.gain?.gain.setValueAtTime(value,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;for(const t of this.tracks.values())this.retire(t);this.tracks.clear();this.phase='closed';this.globalPaused=true;this.buffers.clear();this.practice.cancel();this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
