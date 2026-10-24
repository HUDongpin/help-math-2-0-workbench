/** Maintained P035 page clock/transport draft. No browser PCM is asserted. */
import planJson from '../../../migrations/shared-alg001-l06-p035/audio-source-v1/source-audio-runtime-v1.json';
import {P035_FEEDBACK,P035_SOURCE,p035InitialState,p035Reduce,
 type P035Choice,type P035FeedbackId,type P035Glossary,type P035State}
 from './alg-l06-p035-state-v1';
import type {DecodedSourceStreamTransport,DecodedStreamResult,
 DecodedStreamSnapshot} from './decoded-source-stream-transport';

type Transport=Pick<DecodedSourceStreamTransport,
 'prepare'|'snapshot'|'subscribe'|'play'|'pause'|'replay'|'close'>;
type Domain=(typeof planJson.domains)[number];
type DomainId='main'|'sa'|80|95|126|154|195|207;
type AudioOwner='none'|'main'|'feedback'|'sa';
const FEEDBACK_IDS=[80,95,126,154,195,207] as const;
const validFeedback=(id:number):id is typeof FEEDBACK_IDS[number]=>
 FEEDBACK_IDS.some(value=>value===id);
const ok=(reason:string):DecodedStreamResult=>({accepted:true,reason});
const no=(reason:string):DecodedStreamResult=>({accepted:false,reason});
const EXPECTED={main:'31769b5944c74d1246f2fea66f4da200c2e57de869ab63ac4293ea0ae87d36c0',
 sa:'ca0d2121df287403e350e2f8812a755c3d5f43f6b13c2c84f8e205b286b8c79f'};

async function sourceSha(bytes:ArrayBuffer):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function domain(id:Exclude<DomainId,'sa'>):Domain{
 const characterId=id==='main'?227:id;
 const row=planJson.domains.find(item=>item.characterId===characterId);
 if(!row||!row.eligible&&id!=='main')throw Error('P035_DOMAIN_UNAVAILABLE');
 return row;
}
function pinFor(id:DomainId){
 return id==='sa'?planJson.separateSupplemental:domain(id).transportAsset;
}
function durationFrame(anchor:{time:number;frame:number},now:number,limit:number):number{
 if(!Number.isFinite(now)||now<anchor.time)throw Error('P035_CLOCK_REGRESSED');
 return Math.min(limit,anchor.frame+Math.floor((now-anchor.time)*12+1e-9));
}

/** The factory is injected because this source packet has FFmpeg PCM16 only.
 * A product factory must first obtain real browser-decoded Float32 bindings
 * before constructing DecodedSourceStreamTransport instances. */
export class P035PageAudioOwnerV1{
 private readonly transports:Record<DomainId,Transport>;
 private readonly unsubscribers:(()=>void)[]=[];
 private readonly now:()=>number;
 private readonly commitMain:(frame:number)=>boolean;
 private readonly commitFeedback:(id:number,localFrame:number)=>boolean;
 private readonly prepared=new Set<DomainId>();
 private readonly preparing=new Set<DomainId>();
 private state:P035State=p035InitialState();
 private phase:'held'|'playing'|'paused'|'failed'|'closed'='held';
 private active:AudioOwner='none';
 private mainAnchor:{time:number;frame:number}|null=null;
 private feedbackAnchor:{time:number;frame:number}|null=null;
 private mainRunEpoch:number|null=null;
 private feedbackRunEpoch:number|null=null;
 private saRunEpoch:number|null=null;
 private mainNativeEof=false;
 private feedbackNativeEof=false;
 private saNativeEof=false;
 private mainTailPending=false;
 private mainTailHeld=false;
 private generation=0;
 private ticking=false;
 private failure:string|null=null;

 constructor(options:{nowSeconds:()=>number;commitMain:(frame:number)=>boolean;
  commitFeedback:(id:number,localFrame:number)=>boolean;
  createTransport:(id:DomainId,technicalSource:Domain|null)=>Transport}){
  if(planJson.sourceSwf.sha256!==P035_SOURCE.swfSha256||
   planJson.mainClock.frameDomain!=='sprite-227'||
   planJson.mainClock.fps!==12||planJson.mainClock.firstMainBlockFrame!==13||
   planJson.mainClock.quizHoldFrame!==145||planJson.mainClock.encodedFinalFrame!==534||
   planJson.browserDecodeMeasured!==false||
   domain('main').sourceBlockFrames[0]!==13||
   domain('main').sourceBlockFrames[1]!==534||
   domain('main').transportAsset.sha256!==EXPECTED.main||
   planJson.separateSupplemental.sha256!==EXPECTED.sa||
   !planJson.domains.some(row=>row.characterId===207&&
    row.codec==='swf-adpcm'&&row.sourceBlockFrames[1]===13&&
    row.authoredTerminalFrame===25&&row.technicalDecode.samples===5980)||
   !planJson.domains.some(row=>row.characterId===179&&!row.eligible))
    throw Error('P035_SOURCE_AUDIO_PLAN_DRIFT');
  if(typeof options.nowSeconds!=='function'||
   typeof options.commitMain!=='function'||
   typeof options.commitFeedback!=='function')throw Error('P035_CLOCK_OWNER_MISSING');
  this.now=options.nowSeconds;
  this.commitMain=options.commitMain;
  this.commitFeedback=options.commitFeedback;
  const rows:readonly (readonly [DomainId,Domain|null])[]=[
   ['main',domain('main')],['sa',null],
   ...FEEDBACK_IDS.map(id=>[id,domain(id)] as const)];
  this.transports=Object.fromEntries(rows.map(([id,row])=>
   [id,options.createTransport(id,row)])) as Record<DomainId,Transport>;
  for(const [id] of rows){
   const transport=this.transports[id];
   if(!transport||typeof transport.subscribe!=='function')
    throw Error('P035_TRANSPORT_FACTORY_MISSING');
   this.unsubscribers.push(transport.subscribe(()=>this.onTransport(id)));
  }
  if(!this.commitMain(1))throw Error('P035_INITIAL_CANVAS_FRAME_NOT_COMMITTED');
 }

 private currentFeedback(){
  const id=this.state.feedback?.characterId;
  return id!==undefined&&validFeedback(id)?id:null;
 }
 private transport(id:DomainId){return this.transports[id];}
 private onTransport(id:DomainId){
  if(this.phase==='closed')return;
  const native=this.transport(id).snapshot();
  if(id==='main'&&this.mainRunEpoch!==null&&native.epoch===this.mainRunEpoch&&
   native.phase==='buffer-ended'){
   this.mainNativeEof=true;this.mainRunEpoch=null;this.mainTailPending=false;
   this.mainTailHeld=false;
   if(this.active==='main')this.active='none';
  }
  if(id==='sa'&&this.active==='sa'&&this.saRunEpoch!==null&&
   native.epoch===this.saRunEpoch&&native.phase==='buffer-ended'){
   this.saNativeEof=true;this.saRunEpoch=null;this.active='none';
   const next=p035Reduce(this.state,{type:'supplemental-ended',
    token:this.state.supplementalAudioToken});
   if(next.accepted)this.state=next.state;
  }
  if(typeof id==='number'&&this.active==='feedback'&&
   this.currentFeedback()===id&&this.feedbackRunEpoch!==null&&
   native.epoch===this.feedbackRunEpoch&&native.phase==='buffer-ended'){
   this.feedbackNativeEof=true;this.feedbackRunEpoch=null;
   this.active='none';
  }
  if((id==='main'&&this.active==='main'||id==='sa'&&this.active==='sa'||
    typeof id==='number'&&this.active==='feedback'&&this.currentFeedback()===id)&&
   ['failed','closed','play-rejected','interrupted'].includes(native.phase)){
   this.mainAnchor=null;this.feedbackAnchor=null;
   this.phase='paused';this.active='none';
   this.failure=`P035_${String(id)}_TRANSPORT_${native.phase}`;
  }
 }
 private holdMain(){
  this.mainAnchor=null;
  const native=this.transport('main').snapshot();
  if(['playing','start-pending'].includes(native.phase))
   this.transport('main').pause();
  if(this.state.mainFrame===534&&!this.mainNativeEof){
   this.mainTailHeld=true;this.mainTailPending=false;
  }
  this.mainRunEpoch=null;
  if(this.active==='main')this.active='none';
 }
 private holdFeedback(){
  this.feedbackAnchor=null;
  const id=this.currentFeedback();
  if(id!==null){
   const native=this.transport(id).snapshot();
   if(this.active==='feedback'&&['playing','start-pending'].includes(native.phase))
    this.transport(id).pause();
  }
  this.feedbackRunEpoch=null;
  if(this.active==='feedback')this.active='none';
 }
 private fail(reason:string):DecodedStreamResult{
  this.generation++;this.holdMain();this.holdFeedback();
  if(this.active==='sa')this.transport('sa').pause();
  this.active='none';this.phase='failed';this.failure=reason;
  return no(reason);
 }
 snapshot(){
  const feedback=this.currentFeedback(),main=this.transport('main').snapshot();
  return Object.freeze({state:this.state,phase:this.phase,activeOwner:this.active,
   mainAudio:main,feedbackAudio:feedback===null?null:this.transport(feedback).snapshot(),
   supplementalAudio:this.transport('sa').snapshot(),
   nativeEof:Object.freeze({main:this.mainNativeEof,
    feedback:this.feedbackNativeEof,supplemental:this.saNativeEof}),
   mainFinalAudioTailPending:this.mainTailPending,
   mainFinalAudioTailHeld:this.mainTailHeld,
   mainAudioToken:this.state.mainAudioToken,
   feedbackEpoch:this.state.feedback?.token??this.state.epoch,
   supplementalEpoch:this.state.supplementalAudioToken,
   generation:this.generation,failure:this.failure,
   sourceAlignment:'unverified' as const,
   browserBindingVerified:false as const,originalRuntimeAccepted:false as const,
   audioAccepted:false as const,listeningAccepted:false as const,
   lessonCompleted:false as const});
 }

 /** Exact source bytes are checked here; the injected real transport must also
  * verify browser PCM when a future measurement exists. */
 async prepare(id:DomainId,bytes:ArrayBuffer):Promise<DecodedStreamResult>{
  if(this.phase==='closed'||this.phase==='failed'||this.prepared.has(id)||
   this.preparing.has(id))return no('prepare-unavailable');
  const ticket=this.generation;
  this.preparing.add(id);
  try{
   const pin=pinFor(id);
   if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==pin.bytes)
    return no('source-byte-identity-mismatch');
   const copy=bytes.slice(0);
   if(await sourceSha(copy)!==pin.sha256)return no('source-byte-identity-mismatch');
   if(ticket!==this.generation)return no('stale-prepare');
   const result=await this.transport(id).prepare(copy);
   if(ticket!==this.generation)return no('stale-prepare');
   if(!result.accepted)return no(result.reason);
   this.prepared.add(id);return ok('exact-source-ready');
  }finally{this.preparing.delete(id);}
 }

 private async startMain(activation:'user'|'automatic'):Promise<DecodedStreamResult>{
  if(this.mainNativeEof)return ok('native-main-ended-visual-only');
  if(!this.prepared.has('main'))return no('main-not-prepared');
  const ticket=this.generation;
  const started=await this.transport('main').play({activation,reducedMotion:false});
   if(ticket!==this.generation||this.phase==='closed')return no('stale-main-start');
  if(!started.accepted)return no(started.reason);
  this.mainRunEpoch=this.transport('main').snapshot().epoch;
  this.active='main';return ok('same-main-buffer-playing');
 }
 async playMain(policy:{activation:'user'}):Promise<DecodedStreamResult>{
  if(policy?.activation!=='user'||this.phase==='closed'||this.phase==='failed'||
   this.state.glossaryOpen||this.state.supplemental!=='off'||
   this.state.feedback||!this.prepared.has('main'))return no('main-play-unavailable');
  if(this.state.mainFrame===534){
   if(!this.mainTailHeld||this.mainNativeEof)return no('main-source-boundary-held');
   const started=await this.startMain('user');
   if(!started.accepted)return started;
   this.mainTailHeld=false;this.mainTailPending=true;this.phase='playing';
   return ok('same-main-audio-tail-resumed-visual-held');
  }
  const fromHeld=this.state.mainPlaying;
  const transition=fromHeld?null:p035Reduce(this.state,{type:'play-main'});
  if(transition&&!transition.accepted)return no(transition.reason);
  if(this.state.mainFrame>=13){
   const started=await this.startMain('user');
   if(!started.accepted)return started;
  }
  if(transition)this.state=transition.state;
  this.mainAnchor={time:this.now(),frame:this.state.mainFrame};
  this.phase='playing';this.failure=null;
  return ok(fromHeld?'same-main-cursor-resumed':'main-visual-clock-started');
 }
 pause():DecodedStreamResult{
  if(this.phase==='closed'||this.phase==='failed')return no('pause-unavailable');
  if(this.state.supplemental==='playing')return this.pauseSupplemental();
  if(this.mainTailPending){
   this.generation++;this.holdMain();this.phase='paused';
   return ok('main-audio-tail-held-at-source-534');
  }
  if(this.state.phase==='feedback-playing'&&this.feedbackAnchor){
   this.generation++;
   this.holdFeedback();this.phase='paused';return ok('feedback-visual-and-cursor-held');
  }
  if(this.mainAnchor){this.generation++;this.holdMain();this.phase='paused';
   return ok('main-visual-and-cursor-held');}
  return no('nothing-playing');
 }
 /** Host Play after a paused feedback clip retains that clip's decoded cursor.
  * The reducer remains on its existing local frame and feedback token. */
 async resumeFeedback(policy:{activation:'user'}):Promise<DecodedStreamResult>{
  const id=this.currentFeedback();
  if(policy?.activation!=='user'||this.phase!=='paused'||id===null||
   this.state.phase!=='feedback-playing'||this.feedbackAnchor||
   this.state.supplemental!=='off')return no('feedback-resume-unavailable');
  if(!this.feedbackNativeEof){
   const ticket=this.generation;
   const started=await this.startFeedback(id,'user');
   if(ticket!==this.generation)return no('stale-feedback-resume');
   if(!started.accepted)return no(started.reason);
  }
  this.feedbackAnchor={time:this.now(),frame:this.state.feedback!.frame};
  this.phase='playing';this.failure=null;
  return ok('same-feedback-cursor-resumed');
 }
 private async startFeedback(id:typeof FEEDBACK_IDS[number],
  activation:'automatic'|'user'):Promise<DecodedStreamResult>{
  if(this.feedbackNativeEof)return ok('feedback-eof-visual-only');
  if(!this.prepared.has(id))return no('feedback-not-prepared');
  const ticket=this.generation;
  const started=await this.transport(id).play({activation,reducedMotion:false});
  if(ticket!==this.generation||this.currentFeedback()!==id)return no('stale-feedback-start');
  if(!started.accepted)return no(started.reason);
  this.feedbackRunEpoch=this.transport(id).snapshot().epoch;
  this.active='feedback';return ok('feedback-buffer-playing');
 }
 async tick():Promise<DecodedStreamResult>{
  if(this.ticking)return no('tick-in-progress');
  if(this.phase==='closed'||this.phase==='failed')return no('clock-unavailable');
  this.ticking=true;
  const ticket=this.generation;
  try{
   const now=this.now();
   if(this.mainAnchor&&this.state.mainPlaying){
    const target=durationFrame(this.mainAnchor,now,534);
    while(this.state.mainFrame<target){
     if(ticket!==this.generation)return no('stale-tick');
     const nextFrame=this.state.mainFrame+1;
     if(nextFrame===13&&!this.mainNativeEof){
      const started=await this.startMain('automatic');
      if(ticket!==this.generation)return no('stale-tick');
      if(!started.accepted){
       const held=p035Reduce(this.state,{type:'advance-main',frame:13});
       if(!held.accepted||!this.commitMain(13))
        return this.fail('P035_MAIN_FRAME_COMMIT');
       this.state=held.state;this.mainAnchor=null;this.phase='paused';
       this.failure='P035_MAIN_START_'+started.reason;
       return no(this.failure);
      }
     }
     const next=p035Reduce(this.state,{type:'advance-main',frame:nextFrame});
     if(!next.accepted||!this.commitMain(next.state.mainFrame))
      return this.fail('P035_MAIN_FRAME_COMMIT');
     this.state=next.state;
     if(this.state.phase==='question'){
      this.holdMain();this.phase='held';return ok('authored-quiz-145-held');
     }
     if(this.state.mainFrame===534){
      this.mainAnchor=null;
      this.mainTailPending=!this.mainNativeEof&&
       ['playing','start-pending'].includes(this.transport('main').snapshot().phase);
      this.phase='held';return ok('source-534-held-no-lesson-completion');
     }
    }
    return ok('main-visual-clock-current');
   }
   const fb=this.state.feedback,id=this.currentFeedback();
   if(this.feedbackAnchor&&fb&&id!==null&&this.state.phase==='feedback-playing'){
    const spec=P035_FEEDBACK[id];
    const limit=fb.kind==='wrong'&&!fb.acknowledged?spec.hold!:spec.end;
    const target=durationFrame(this.feedbackAnchor,now,limit);
    while(this.state.feedback&&this.state.feedback.frame<target){
     if(ticket!==this.generation)return no('stale-tick');
     const frame=this.state.feedback.frame+1;
     if(frame===spec.firstBlockFrame&&!this.feedbackNativeEof){
      const started=await this.startFeedback(id,'automatic');
      if(ticket!==this.generation)return no('stale-tick');
      if(!started.accepted){
       const held=p035Reduce(this.state,{type:'advance-feedback',frame,token:fb.token});
       if(!held.accepted||!this.commitFeedback(id,frame))
        return this.fail('P035_FEEDBACK_FRAME_COMMIT');
       this.state=held.state;this.feedbackAnchor=null;this.phase='paused';
       this.failure='P035_FEEDBACK_START_'+started.reason;
       return no(this.failure);
      }
     }
     // The authored terminal action is delayed until real native EOF. A
     // calculated sample cursor never substitutes for onended.
     if(frame===spec.end&&!this.feedbackNativeEof)
      return ok('feedback-native-eof-pending-at-visual-terminal');
     const next=p035Reduce(this.state,{type:'advance-feedback',frame,token:fb.token});
     if(!next.accepted||!this.commitFeedback(id,frame))
      return this.fail('P035_FEEDBACK_FRAME_COMMIT');
     this.state=next.state;
     if(this.state.phase==='feedback-held'){
      this.holdFeedback();this.phase='held';return ok('authored-wrong-popup-hold');
     }
     if(this.state.feedback===null){
      this.feedbackAnchor=null;this.active='none';
      this.transport(id).replay();this.feedbackRunEpoch=null;
      if(this.state.mainPlaying){
       const started=await this.startMain('automatic');
       if(ticket!==this.generation)return no('stale-tick');
       if(!started.accepted){this.phase='paused';this.failure=started.reason;
        return no('post-feedback-main-resume-'+started.reason);}
       this.mainAnchor={time:this.now(),frame:this.state.mainFrame};
       this.phase='playing';
      }else this.phase='held';
      return ok('feedback-terminal-source-transition');
     }
    }
    return ok('feedback-visual-clock-current');
   }
   return no('visual-clock-held');
  }catch(error){return this.fail(error instanceof Error?error.message:'clock-failed');}
  finally{this.ticking=false;}
 }
 choose(choice:P035Choice):DecodedStreamResult{
  if(this.phase==='closed'||this.phase==='failed'||this.state.mainFrame!==145)
   return no('choice-unavailable');
  const next=p035Reduce(this.state,{type:'choose',choice});
  if(!next.accepted)return no(next.reason);
  this.generation++;
  this.state=next.state;this.phase='held';return ok('host-feedback-selection-pending');
 }
 async resolveFeedback(id:P035FeedbackId,
  policy:{activation:'user'|'automatic'}):Promise<DecodedStreamResult>{
  if(this.phase==='closed'||this.phase==='failed'||!validFeedback(id)||
   !['user','automatic'].includes(policy?.activation))
   return no('feedback-variant-unavailable');
  const next=p035Reduce(this.state,{type:'resolve-feedback',characterId:id});
  if(!next.accepted)return no(next.reason);
  const transport=this.transport(id);
  if(!this.prepared.has(id)||!transport.replay().accepted)
   return no('feedback-buffer-not-ready');
  if(!this.commitFeedback(id,1))return this.fail('P035_FEEDBACK_FIRST_FRAME_COMMIT');
  this.generation++;
  this.state=next.state;this.feedbackNativeEof=false;this.feedbackRunEpoch=null;
  this.feedbackAnchor={time:this.now(),frame:1};this.phase='playing';
  if(P035_FEEDBACK[id].firstBlockFrame===1){
   const ticket=this.generation;
   const started=await this.startFeedback(id,policy.activation);
   if(ticket!==this.generation)return no('stale-feedback-selection');
   if(!started.accepted){this.feedbackAnchor=null;this.phase='paused';
    this.failure='P035_FEEDBACK_START_'+started.reason;
    return no(this.failure);}
  }
  return ok('explicit-host-variant-selected');
 }
 async closeWrong(token:number):Promise<DecodedStreamResult>{
  if(this.phase==='closed'||this.phase==='failed')return no('wrong-close-unavailable');
  const id=this.currentFeedback();if(id===null)return no('no-feedback');
  const next=p035Reduce(this.state,{type:'close-wrong',token});
  if(!next.accepted)return no(next.reason);
  const frame=next.state.feedback!.frame;
  if(!this.commitFeedback(id,frame))return this.fail('P035_CLOSE_FRAME_COMMIT');
  const native=this.transport(id).snapshot();
  const activeBuffer=this.active==='feedback'&&
   this.feedbackRunEpoch===native.epoch&&native.phase==='playing';
  this.generation++;
  // A source frame jump is not a decoded PCM seek. An active source instance
  // keeps its cursor; a pending start is retired before the user-activated
  // resume, so it cannot become a second live node after this Close.
  if(native.phase==='start-pending'){
   const held=this.transport(id).pause();
   if(!held.accepted)return this.fail('P035_CLOSE_PENDING_START_'+held.reason);
   this.feedbackRunEpoch=null;
   if(this.active==='feedback')this.active='none';
  }
  this.state=next.state;this.feedbackAnchor={time:this.now(),frame};
  if(!this.feedbackNativeEof&&!activeBuffer){
   if(native.phase==='playing')return this.fail('P035_CLOSE_FEEDBACK_OWNER_MISMATCH');
   const ticket=this.generation;
   const started=await this.startFeedback(id,'user');
   if(ticket!==this.generation)return no('stale-wrong-close');
   if(!started.accepted){this.feedbackAnchor=null;this.phase='paused';
    this.failure=started.reason;
    return no('close-feedback-resume-'+started.reason);}
  }
  this.phase='playing';return ok(activeBuffer?
   'source-close-retained-active-feedback-buffer':'source-close-resumed-local-feedback');
 }
 openGlossary(key:P035Glossary):DecodedStreamResult{
  if(this.phase==='closed'||this.phase==='failed')return no('glossary-unavailable');
  const next=p035Reduce(this.state,{type:'open-glossary',key});
  if(!next.accepted)return no(next.reason);
  this.generation++;
  this.holdMain();this.state=next.state;this.phase='held';
  return ok('source-glossary-open-main-held');
 }
 closeGlossary():DecodedStreamResult{
  const next=p035Reduce(this.state,{type:'close-glossary'});
  if(!next.accepted)return no(next.reason);
  this.state=next.state;this.phase='held';return ok('glossary-closed-explicit-play-required');
 }
 async startSupplemental(policy:{activation:'user'}):Promise<DecodedStreamResult>{
  if(policy?.activation!=='user'||this.phase==='closed'||this.phase==='failed'||
   !this.prepared.has('sa'))return no('explicit-ready-supplemental-required');
  const next=p035Reduce(this.state,{type:'start-supplemental'});
  if(!next.accepted)return no(next.reason);
  this.generation++;
  this.holdMain();this.mainAnchor=null;
  const ticket=this.generation;
  const transport=this.transport('sa');
  if(!transport.replay().accepted)return this.fail('P035_SA_REPLAY_FAILED');
  this.state=next.state;this.saNativeEof=false;
  const started=await transport.play({activation:'user',reducedMotion:false});
  if(ticket!==this.generation)return no('stale-supplemental-start');
  if(!started.accepted){this.phase='paused';this.failure=started.reason;
   const paused=p035Reduce(this.state,{type:'pause-supplemental'});
   if(paused.accepted)this.state=paused.state;
   return no('supplemental-start-'+started.reason);}
  this.saRunEpoch=transport.snapshot().epoch;
  this.active='sa';this.phase='playing';return ok('explicit-separate-supplemental-playing');
 }
 pauseSupplemental():DecodedStreamResult{
  const next=p035Reduce(this.state,{type:'pause-supplemental'});
  if(!next.accepted)return no(next.reason);
  this.generation++;
  const held=this.transport('sa').pause();
  if(!held.accepted)return this.fail('P035_SA_PAUSE_'+held.reason);
  this.state=next.state;this.saRunEpoch=null;this.active='none';this.phase='paused';
  return ok('same-supplemental-buffer-held');
 }
 async resumeSupplemental(policy:{activation:'user'}):Promise<DecodedStreamResult>{
  if(policy?.activation!=='user')return no('explicit-supplemental-resume-required');
  const next=p035Reduce(this.state,{type:'resume-supplemental'});
  if(!next.accepted)return no(next.reason);
  const ticket=this.generation;
  const started=await this.transport('sa').play({activation:'user',reducedMotion:false});
  if(ticket!==this.generation)return no('stale-supplemental-resume');
  if(!started.accepted)return no(started.reason);
  this.state=next.state;this.saRunEpoch=this.transport('sa').snapshot().epoch;
  this.active='sa';this.phase='playing';return ok('same-supplemental-cursor-resumed');
 }
 returnSupplemental():DecodedStreamResult{
  const next=p035Reduce(this.state,{type:'return-supplemental'});
  if(!next.accepted)return no(next.reason);
  this.generation++;
  if(this.active==='sa')this.transport('sa').pause();
  this.saRunEpoch=null;this.transport('sa').replay();this.active='none';
  this.state=next.state;this.phase='held';
  return ok('supplemental-retired-main-held-explicit-play');
 }
 replay():DecodedStreamResult{
  if(this.phase==='closed')return no('closed');
  this.generation++;
  this.mainAnchor=null;this.feedbackAnchor=null;
  this.mainRunEpoch=null;this.feedbackRunEpoch=null;this.saRunEpoch=null;
  this.active='none';this.mainNativeEof=false;this.feedbackNativeEof=false;
  this.saNativeEof=false;this.mainTailPending=false;this.mainTailHeld=false;
  for(const id of ['main','sa',...FEEDBACK_IDS] as DomainId[])
   this.transport(id).replay();
  this.state=p035Reduce(this.state,{type:'replay'}).state;
  if(!this.commitMain(1))return this.fail('P035_REPLAY_FRAME_COMMIT');
  this.phase='held';this.failure=null;return ok('replay-held-no-autoplay');
 }
 async close():Promise<void>{
  if(this.phase==='closed')return;
  this.generation++;this.mainAnchor=null;this.feedbackAnchor=null;
  this.mainRunEpoch=null;this.feedbackRunEpoch=null;this.saRunEpoch=null;
  this.active='none';this.phase='closed';
  for(const unsubscribe of this.unsubscribers)unsubscribe();
  await Promise.all((['main','sa',...FEEDBACK_IDS] as DomainId[])
   .map(id=>this.transport(id).close()));
 }
}

export type P035Transport=Transport;
export type P035DomainId=DomainId;
export type P035AudioOwnerSnapshot=ReturnType<P035PageAudioOwnerV1['snapshot']>;
