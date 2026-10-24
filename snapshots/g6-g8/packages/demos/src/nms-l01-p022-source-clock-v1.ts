import type {DecodedSourceStreamBinding,DecodedStreamResult} from './decoded-source-stream-transport';
import {createP022Interaction,reduceP022Interaction,validateP022Cards,type P022Card,type P022CardId,type P022Interaction,type P022Point} from './nms-l01-p022-interaction-v1';
export interface P022AudioPlan {
 readonly version:1;readonly animationId:'shared-nms002-l01-p022';readonly sourceSwfSha256:string;readonly fps:12;
 readonly mainFrameCount:523;readonly questionFrame:480;readonly mainAudioFirstFrame:9;
 readonly rightFeedbackDomain:'sprite-337';readonly rightFeedbackFirstFrame:2;readonly rightFeedbackLastFrame:25;
 readonly clips:readonly Readonly<{frameDomain:string;frameCount:number;rawAudioFirstFrame:number;visualEntryFrame:number;latencySamples:1673;selectable:boolean;decoder:DecodedSourceStreamBinding}>[];
 readonly mainSegments:readonly Readonly<{firstFrame:number;firstDecodedSample:number;endDecodedSample:number}>[];
 readonly wrongClosePolicy?:string;readonly emptyNegativeBlocks:readonly unknown[];readonly sourceAlignment?:string;readonly feedbackStartPolicy?:string;readonly terminalFramePolicy?:string;
}
export interface P022Picture {readonly mainFrame:number;readonly interaction:Readonly<{positions:P022Interaction['positions'];locked:readonly P022CardId[];popup:'none'|'wrong';feedbackFrame:number;rightFrame:number;coachFrame:number;closePressed:boolean}>;}
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
type Phase='idle'|'loading'|'ready'|'starting'|'playing'|'paused'|'question'|'dragging'|'wrong-wait'|'ended'|'failed'|'closed';
type Kind='main'|'wrong'|'feedback';type Mode='intro'|'wrong'|'correct'|'completion'|'outro';
type AudioWindow={domain:string;start:number;end:number;sample:number};
type Track={kind:Kind;mode:Mode;first:number;duration:number;windows:readonly AudioWindow[];position:number;done:boolean;anchor?:{time:number;position:number};nodes:Set<AudioBufferSourceNode>};
const rate=22050,questionSeconds=479/12,coachSeconds=18/12,revealSeconds=23/12,outroSeconds=43/12;
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const policyValid=(p:Policy)=>p&&['automatic','user'].includes(p.activation)&&typeof p.reducedMotion==='boolean';
async function hash(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
async function pcmHash(buffer:AudioBuffer){const bytes=new ArrayBuffer(buffer.length*4),view=new DataView(bytes),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw Error('P022_NONFINITE_PCM');view.setFloat32(i*4,samples[i]!,true);}return hash(bytes);}
/** Main342 and each finite correct341 -> silent337 -> main342 chain are natively scheduled.
 * Pop333 has an independent track because source Close hides it without stopping its sound. */
export class P022SourceClockV1 {
 readonly plan:P022AudioPlan;private state:P022Interaction;
 private context?:AudioContext;private gain?:GainNode;private buffers=new Map<string,AudioBuffer>();private tracks=new Map<Kind,Track>();
 private phase:Phase='idle';private epoch=0;private volume=1;private globalPaused=true;private inspection=false;private failure:string|null=null;private closePressed=false;
 constructor(plan:P022AudioPlan,private readonly cards:readonly P022Card[],private readonly options:{createContext?:()=>AudioContext;commitPicture:(p:P022Picture)=>boolean}){
  validateP022Cards(cards);this.state=createP022Interaction(cards);
  const expected=[['sprite-342',523,9,945792,true],['sprite-333',15,1,27072,true],['sprite-341',20,2,34560,true],['sprite-339',55,3,96768,false],['sprite-129',76,2,100800,false],['sprite-169',64,2,100800,false],['sprite-210',77,2,116928,false],['sprite-256',77,1,141120,false],['sprite-320',61,1,111744,false]];
  if(plan.version!==1||plan.animationId!=='shared-nms002-l01-p022'||plan.sourceSwfSha256!=='0c634b34f16b55f42d954dec64f1aa353b22053d93ab6137cadf48e7cc3bb5e2'||plan.fps!==12||plan.mainFrameCount!==523||plan.questionFrame!==480||plan.mainAudioFirstFrame!==9||plan.rightFeedbackDomain!=='sprite-337'||plan.rightFeedbackFirstFrame!==2||plan.rightFeedbackLastFrame!==25||JSON.stringify(plan.clips.map(c=>[c.frameDomain,c.frameCount,c.rawAudioFirstFrame,c.decoder.decodedSamples,c.selectable]))!==JSON.stringify(expected))throw Error('P022_SOURCE_PLAN_MISMATCH');
  for(const c of plan.clips)if(c.latencySamples!==1673||c.decoder.sampleRate!==rate||c.decoder.channels!==1||!Number.isSafeInteger(c.decoder.sourceBytes)||c.decoder.sourceBytes<1||!(/^[a-f0-9]{64}$/u.test(c.decoder.sourceSha256)&&/^[a-f0-9]{64}$/u.test(c.decoder.pcmSha256)))throw Error('P022_SOURCE_DECODER_MISMATCH');
  if(JSON.stringify(plan.mainSegments)!==JSON.stringify([{firstFrame:9,firstDecodedSample:1673,endDecodedSample:945792}])||plan.emptyNegativeBlocks.length!==0)throw Error('P022_MAIN_STREAM_MISMATCH');
  this.plan=Object.freeze({...plan,clips:Object.freeze(plan.clips.map(c=>Object.freeze({...c,decoder:Object.freeze({...c.decoder})}))),mainSegments:Object.freeze(plan.mainSegments.map(s=>Object.freeze({...s})))});this.resetMain();
 }
 private mainWindows(first:number,last:number,start=0):AudioWindow[]{return this.plan.mainSegments.flatMap(s=>{
  const authoredStart=(s.firstFrame-1)/12,authoredEnd=authoredStart+(s.endDecodedSample-s.firstDecodedSample)/rate,from=Math.max((first-1)/12,authoredStart),to=Math.min((last-1)/12,authoredEnd);
  return to>from?[{domain:'sprite-342',start:start+from-(first-1)/12,end:start+to-(first-1)/12,sample:s.firstDecodedSample+(from-authoredStart)*rate}]:[];
 });}
 private full(domain:string):AudioWindow{const c=this.plan.clips.find(c=>c.frameDomain===domain)!;return{domain,start:0,end:(c.decoder.decodedSamples-c.latencySamples)/rate,sample:c.latencySamples};}
 private track(kind:Kind,mode:Mode,duration:number,windows:readonly AudioWindow[],first=1):Track{return{kind,mode,first,duration,windows,position:0,done:false,nodes:new Set()};}
 private resetMain(){this.tracks.set('main',this.track('main','intro',questionSeconds,this.mainWindows(1,480)));}
 private retire(t:Track){t.anchor=undefined;for(const n of t.nodes){n.onended=null;try{n.stop();}catch{/* Already ended natively. */}n.disconnect();}t.nodes.clear();}
 private remove(kind:Kind){const t=this.tracks.get(kind);if(t)this.retire(t);this.tracks.delete(kind);}
 private hasRemaining(){return [...this.tracks.values()].some(t=>!t.done);}
 private hasRunning(){return [...this.tracks.values()].some(t=>!t.done&&Boolean(t.anchor));}
 private pageEnded(){return this.tracks.get('main')?.mode==='outro'&&this.tracks.get('main')?.done===true||this.tracks.get('feedback')?.mode==='completion'&&this.tracks.get('feedback')?.done===true;}
 private canInteract(){const m=this.tracks.get('main'),f=this.tracks.get('feedback');return m?.mode==='intro'&&m.done&&f?.mode!=='completion'&&(!f||f.done)&&this.state.result!=='wrong'&&!['idle','loading','failed','closed'].includes(this.phase);}
 private refreshPhase(){
  if(['idle','loading','failed','closed'].includes(this.phase))return;
  if(this.hasRunning()){this.phase='playing';this.globalPaused=false;}
  else if(this.pageEnded()){this.phase='ended';this.globalPaused=true;}
  else if(!this.hasRemaining()){this.phase=this.state.result==='wrong'?'wrong-wait':this.state.selected?'dragging':'question';this.globalPaused=true;}
  else if(!this.globalPaused)this.phase='starting';
  else if(this.phase!=='ready')this.phase='paused';
 }
 private settle(){
  if(!this.context)return;
  for(const t of [...this.tracks.values()]){
   if(!t.anchor||t.done)continue;t.position=Math.min(t.duration,t.anchor.position+Math.max(0,this.context.currentTime-t.anchor.time));
   if(t.position>=t.duration-1e-9){t.position=t.duration;t.done=true;this.retire(t);if(t.kind==='feedback'&&t.mode==='correct')this.state=reduceP022Interaction(this.cards,this.state,{type:'clear-feedback'});}
  }
  this.refreshPhase();
 }
 private picture():P022Picture{
  const m=this.tracks.get('main')!,f=this.tracks.get('feedback'),w=this.tracks.get('wrong');let mainFrame=Math.min(m.mode==='intro'?480:523,m.first+Math.floor(m.position*12+1e-8)),rightFrame=1,coachFrame=1;
  if(f){
   if(f.position<coachSeconds-1e-9)coachFrame=Math.min(20,2+Math.floor(f.position*12+1e-8));
   else if(f.mode==='completion'){
    if(f.position<coachSeconds+revealSeconds-1e-9)rightFrame=Math.min(25,2+Math.floor((f.position-coachSeconds)*12+1e-8));
    else mainFrame=Math.min(523,480+Math.floor((f.position-coachSeconds-revealSeconds)*12+1e-8));
   }
  }
  return Object.freeze({mainFrame,interaction:Object.freeze({positions:this.state.positions,locked:this.state.locked,popup:this.state.result==='wrong'?'wrong':'none',feedbackFrame:w?Math.min(15,2+Math.floor(w.position*12+1e-8)):1,rightFrame,coachFrame,closePressed:this.closePressed})});
 }
 private commit(){try{return this.options.commitPicture(this.picture())===true;}catch{return false;}}
 private fail(reason:string){this.epoch++;for(const t of this.tracks.values())this.retire(t);this.phase='failed';this.globalPaused=true;this.failure=reason;return result(false,reason);}
 private readonly contextChanged=()=>{if(!this.context||this.context.state==='running'||['loading','closed'].includes(this.phase))return;this.pause();if(this.context.state==='closed'){this.phase='closed';this.buffers.clear();this.context.removeEventListener('statechange',this.contextChanged);}};
 snapshot(){
  this.settle();const active=[...this.tracks.values()].flatMap(t=>t.anchor&&!t.done&&this.context?.state==='running'?t.windows.filter(w=>t.position>=w.start-1e-9&&t.position<w.end-1e-9).map(w=>({kind:t.kind,domain:w.domain,sample:w.sample+Math.max(0,t.position-w.start)*rate})):[]),picture=this.picture(),f=this.tracks.get('feedback');
  const operation:Mode=f?.mode==='completion'?'completion':this.state.result==='wrong'?'wrong':f&&!f.done?'correct':this.tracks.get('main')!.mode;
  return Object.freeze({phase:this.phase,operation,picture,interaction:this.state,globalPaused:this.globalPaused,inspectionMode:this.inspection,audioNodePlaying:active.length>0,activeAudioDomains:active.map(a=>a.domain),audioDomain:active[0]?.domain??null,audioSample:active[0]?.sample??0,contextTime:this.context?.currentTime??null,
   correctDrops:this.state.locked.length,sourceQuizActive:this.tracks.get('main')?.mode==='intro'&&this.tracks.get('main')?.done===true&&!(f?.mode==='completion'&&f.position>=coachSeconds+revealSeconds-1e-9),canInteract:this.canInteract(),pagePlaybackComplete:this.pageEnded()&&this.state.locked.length===6&&!this.inspection,volume:this.volume,failure:this.failure,
   tracks:Object.freeze([...this.tracks.values()].map(t=>Object.freeze({kind:t.kind,mode:t.mode,seconds:t.position,duration:t.duration,done:t.done,running:Boolean(t.anchor)}))),originalRuntimeAccepted:false,audioAccepted:false,lessonCompleted:false});
 }
 tick(){return this.snapshot();}
 async prepare(payloads:ReadonlyMap<string,ArrayBuffer>):Promise<DecodedStreamResult>{
  if(this.phase!=='idle')return result(false,'prepare-not-idle');const turn=++this.epoch;this.phase='loading';
  try{
   if([...payloads.keys()].sort().join()!==this.plan.clips.map(c=>c.frameDomain).sort().join())throw Error('source-payload-set-mismatch');const bytes=new Map<string,ArrayBuffer>();
   for(const c of this.plan.clips){const b=payloads.get(c.frameDomain)!.slice(0);if(b.byteLength!==c.decoder.sourceBytes||await hash(b)!==c.decoder.sourceSha256)throw Error('source-byte-identity-mismatch:'+c.frameDomain);bytes.set(c.frameDomain,b);}
   if(turn!==this.epoch)return result(false,'stale-prepare');const context=this.options.createContext?.()??new AudioContext({sampleRate:rate,latencyHint:'interactive'});this.context=context;if(context.sampleRate!==rate)throw Error('context-rate-mismatch');context.addEventListener('statechange',this.contextChanged);this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   const decoded=await Promise.all(this.plan.clips.map(async c=>{const b=await context.decodeAudioData(bytes.get(c.frameDomain)!);if(b.sampleRate!==rate||b.numberOfChannels!==1||b.length!==c.decoder.decodedSamples||await pcmHash(b)!==c.decoder.pcmSha256)throw Error('decoded-pcm-identity-mismatch:'+c.frameDomain);return [c.frameDomain,b] as const;}));
   if(turn!==this.epoch)return result(false,'stale-prepare');this.buffers=new Map(decoded);this.phase='ready';if(!this.commit())throw Error('source-picture-not-committed');return result(true,'P022_SOURCE_READY');
  }catch(e){if(turn!==this.epoch)return result(false,'stale-prepare');const r=this.fail(e instanceof Error?e.message:String(e));this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();this.buffers.clear();return r;}
 }
 private schedule(t:Track){
  if(t.done||t.anchor)return;const c=this.context!,gain=this.gain!,now=c.currentTime;
  for(const w of t.windows){const start=Math.max(t.position,w.start),end=Math.min(t.duration,w.end);if(start>=end)continue;const n=c.createBufferSource();n.buffer=this.buffers.get(w.domain)!;n.connect(gain);t.nodes.add(n);n.onended=()=>{if(t.nodes.delete(n)){n.onended=null;n.disconnect();}};n.start(now+start-t.position,(w.sample+(start-w.start)*rate)/rate,end-start);}
  t.anchor={time:now,position:t.position};
 }
 async play(policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!policyValid(policy))return result(false,'invalid-play-policy');if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');if(['idle','loading','failed','closed'].includes(this.phase)||!this.context||!this.gain||this.buffers.size!==9)return result(false,'source-phase-cannot-play');
  if(!this.hasRemaining()){this.refreshPhase();return result(true,'source-waiting');}
  const pending=[...this.tracks.values()].filter(t=>!t.done&&!t.anchor);if(!pending.length)return result(true,'already-playing');const turn=this.epoch;this.globalPaused=false;if(!this.hasRunning())this.phase='starting';
  try{if(!this.commit())throw Error('source-picture-not-committed');await this.context.resume();if(turn!==this.epoch)return result(false,'stale-start');if(this.context.state!=='running')throw Error('context-not-running');for(const t of pending)if(this.tracks.get(t.kind)===t&&!t.done&&!t.anchor)this.schedule(t);this.refreshPhase();this.failure=null;return result(true,'source-tracks-playing');}
  catch(e){if(turn!==this.epoch)return result(false,'stale-start');this.pause();this.failure=e instanceof Error?e.message:String(e);return result(false,this.failure);}
 }
 pause(){this.settle();this.epoch++;for(const t of this.tracks.values())this.retire(t);this.state=reduceP022Interaction(this.cards,this.state,{type:'cancel'});this.closePressed=false;this.globalPaused=true;if(!['idle','loading','failed','closed'].includes(this.phase))this.phase='paused';this.refreshPhase();return this.commit()?result(true,'source-held'):this.fail('paused-picture-not-committed');}
 select(cardId:string){this.settle();if(!this.canInteract())return result(false,'source-drag-unavailable');const next=reduceP022Interaction(this.cards,this.state,{type:'select',cardId});if(next===this.state)return result(false,'source-card-unavailable');this.state=next;this.refreshPhase();return this.commit()?result(true,'source-card-selected'):this.fail('selected-picture-not-committed');}
 move(point:P022Point){if(!this.canInteract()||!this.state.selected)return result(false,'source-not-dragging');this.state=reduceP022Interaction(this.cards,this.state,{type:'move',point});return this.commit()?result(true,'source-card-moved'):this.fail('drag-picture-not-committed');}
 cancel(){if(!this.state.selected)return result(false,'source-not-dragging');this.state=reduceP022Interaction(this.cards,this.state,{type:'cancel'});this.refreshPhase();return this.commit()?result(true,'source-drag-cancelled'):this.fail('cancel-picture-not-committed');}
 async drop(targetId:string|null,policy:Policy):Promise<DecodedStreamResult>{
  this.settle();if(!this.canInteract()||!this.state.selected||!policyValid(policy))return result(false,'drop-unavailable');this.state=reduceP022Interaction(this.cards,this.state,{type:'drop',targetId});
  if(this.state.result==='wrong'){this.remove('wrong');const w=this.full('sprite-333');this.tracks.set('wrong',this.track('wrong','wrong',Math.max(13/12,w.end),[w]));}
  else{this.remove('feedback');const completion=this.state.locked.length===6;this.tracks.set('feedback',this.track('feedback',completion?'completion':'correct',completion?coachSeconds+revealSeconds+outroSeconds:coachSeconds,[this.full('sprite-341'),...(completion?this.mainWindows(480,523,coachSeconds+revealSeconds):[])]));}
  if(!this.commit())return this.fail('drop-picture-not-committed');return this.play(policy);
 }
 pressClose(){this.settle();if(this.state.result!=='wrong'||this.closePressed)return false;this.closePressed=true;return this.commit();}
 cancelClose(){this.closePressed=false;return this.commit();}
 closePopup(){this.settle();if(this.state.result!=='wrong')return result(false,'source-popup-not-open');this.state=reduceP022Interaction(this.cards,this.state,{type:'clear-feedback'});this.closePressed=false;this.refreshPhase();return this.commit()?result(true,'source-popup-closed'):this.fail('popup-close-picture-not-committed');}
 replay(){if(['idle','loading','failed','closed'].includes(this.phase))return result(false,'replay-unavailable');this.epoch++;for(const t of this.tracks.values())this.retire(t);this.tracks.clear();this.resetMain();this.state=reduceP022Interaction(this.cards,this.state,{type:'replay'});this.closePressed=false;this.phase='ready';this.globalPaused=true;this.inspection=false;this.failure=null;return this.commit()?result(true,'source-replayed'):this.fail('replay-picture-not-committed');}
 inspect(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>523||['idle','loading','failed','closed'].includes(this.phase))return result(false,'invalid-source-inspection');this.epoch++;for(const t of this.tracks.values())this.retire(t);this.tracks.clear();this.resetMain();
  const main=frame<=480?this.tracks.get('main')!:this.track('main','outro',(523-frame)/12,this.mainWindows(frame,523),frame);if(frame<=480)main.position=(frame-1)/12;main.done=frame===480||frame===523;this.tracks.set('main',main);this.state=reduceP022Interaction(this.cards,this.state,{type:'replay'});this.closePressed=false;this.phase='paused';this.globalPaused=true;this.inspection=true;this.failure=null;this.refreshPhase();return this.commit()?result(true,'source-frame-inspected'):this.fail('inspection-picture-not-committed');
 }
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1||this.phase==='closed')return result(false,'invalid-volume');this.volume=value;if(this.context)this.gain?.gain.setValueAtTime(value,this.context.currentTime);return result(true,'volume-set');}
 async close(){if(this.phase==='closed')return;this.epoch++;for(const t of this.tracks.values())this.retire(t);this.phase='closed';this.globalPaused=true;this.buffers.clear();this.state=reduceP022Interaction(this.cards,this.state,{type:'cancel'});this.context?.removeEventListener('statechange',this.contextChanged);this.gain?.disconnect();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
