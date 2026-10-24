import {p024AudioIntent,type P024State} from './alg-l06-p024-state-v1';
import {P024DomainClockV1,type P024ClockResult} from './alg-l06-p024-clock-v1';
import type {P024AudioDomainId} from './alg-l06-p024-audio-schedule-v1';

export interface P024SeparateSpanishAudio {
 snapshot():Readonly<{phase:string;failure?:string|null}>;
 start(policy:{activation:'user'}):Promise<P024ClockResult>;
 pause():P024ClockResult;
 stop():P024ClockResult;
 stopAndWait():Promise<void>;
 setVolume(value:number):P024ClockResult;
 close():Promise<void>;
}
type SyncOptions={activation:'user'|'automatic';reducedMotion:boolean;source?:ArrayBuffer};
const result=(accepted:boolean,reason:string):P024ClockResult=>Object.freeze({accepted,reason});

/** The reducer supplies branch intent. This owner never infers a feedback
 * variant, treats locale as an audio cue, or joins the eight MP3 domains. */
export class P024AudioOwnerV1 {
 private selected:'source'|'spanish'='source';
 private transitioning=false;
 private closed=false;
 private epoch=0;
 private failure:string|null=null;
 private retirement:Promise<void>|null=null;
 private pendingSpanishStart:Promise<P024ClockResult>|null=null;
 private spanishReservation=0;
 constructor(private readonly clock:P024DomainClockV1,
  private readonly spanish:P024SeparateSpanishAudio){}
 snapshot(){
  return Object.freeze({selectedAudio:this.selected,transitioning:this.transitioning,
   closed:this.closed,failure:this.failure,clock:this.clock.snapshot(),
   spanish:this.spanish.snapshot(),originalRuntimeAccepted:false as const,
   audioAccepted:false as const,lessonCompleted:false as const});
 }
 /** Apply a reducer state after an event or clock tick. A new domain starts
  * only with its own verified source bytes or a previously decoded buffer. */
 async sync(state:P024State,options:SyncOptions):Promise<P024ClockResult>{
  if(this.closed)return result(false,'owner-closed');
  if(!options||!['user','automatic'].includes(options.activation)||
   typeof options.reducedMotion!=='boolean')return result(false,'invalid-sync-policy');
  const ticket=++this.epoch;this.failure=null;
  const retirement=this.retirement;
  if(retirement){
   try{await retirement;}catch(error){
    if(ticket!==this.epoch)return result(false,'stale-source-start');
    this.failure=error instanceof Error?error.message:String(error);
    return result(false,this.failure);
   }
   if(ticket!==this.epoch)return result(false,'stale-source-start');
   if(this.retirement===retirement)this.retirement=null;
  }
  if(this.selected==='spanish')return result(false,'explicit-spanish-return-required');
  if(state.sa!=='idle'){
   this.clock.hold();return result(false,'explicit-spanish-start-required');
  }
  const intent=p024AudioIntent(state);
  if(!intent){this.clock.hold();return result(true,'source-held-by-reducer');}
  if(intent.owner==='separate-sa'||intent.frame===null)
   return result(false,'explicit-spanish-start-required');
  const id=intent.owner as P024AudioDomainId,frame=intent.frame;
  const before=this.clock.snapshot();
  const approachingQuiz=id==='sprite-208'&&state.phase==='main'&&
   state.mainFrame<154&&!state.quizSection;
  // A late RAF can observe the already stopped native source before the
  // reducer has consumed frame 154. Keep the exact sample held for that tick.
  if(approachingQuiz&&before.domain===id&&before.quizBoundaryReached)
   return result(true,'quiz-boundary-held-await-reducer');
  if(approachingQuiz&&before.domain===id&&before.position>=154){
   this.clock.hold();return result(false,'main-audio-overshot-quiz-boundary');
  }
  if(before.domain!==id||before.phase==='start-pending')this.clock.hold();
  this.transitioning=before.domain!==id;
  try{
   if(options.source){
    const prepared=await this.clock.prepare(id,options.source);
    if(ticket!==this.epoch)return result(false,'stale-source-prepare');
    if(!prepared.accepted)throw Error(prepared.reason);
   }
   const started=await this.clock.play(id,frame,{activation:options.activation,
    reducedMotion:options.reducedMotion,
    stopAtFrame:approachingQuiz?154:undefined,
    // The main stream is held at the quiz stop. Returning after feedback must
    // resume its exact sample and fractional frame, even while state says 154.
    resumeHeld:id==='sprite-208'});
   if(ticket!==this.epoch)return result(false,'stale-source-start');
   if(!started.accepted)throw Error(started.reason);
   this.transitioning=false;return started;
  }catch(error){
   if(ticket!==this.epoch)return result(false,'stale-source-start');
   this.clock.hold();this.transitioning=false;
   this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
 }
 /** Separate SA is activated only by this explicit method after `sa-start`.
  * The source node is retired before the optional recording is started. */
 async startSpanish(state:P024State):Promise<P024ClockResult>{
  if(this.closed||this.selected==='spanish'||state.sa!=='playing'||state.glossary)
   return result(false,'spanish-start-unavailable');
  const ticket=++this.epoch;this.transitioning=true;this.failure=null;
  this.clock.hold();
  // Reserve SA ownership during its asynchronous load so Pause and Return can cancel it.
  this.spanishReservation++;
  this.selected='spanish';
  let pending:Promise<P024ClockResult>|null=null;
  try{
   if(this.retirement){await this.retirement;
    if(ticket!==this.epoch)return result(false,'stale-spanish-start');
    this.retirement=null;}
   pending=this.spanish.start({activation:'user'});
   this.pendingSpanishStart=pending;
   const started=await pending;
   if(this.pendingSpanishStart===pending)this.pendingSpanishStart=null;
   if(ticket!==this.epoch){await this.spanish.stopAndWait();
    return result(false,'stale-spanish-start');}
   if(!started.accepted)throw Error(started.reason);
   this.transitioning=false;
   return result(true,'separate-spanish-playing');
  }catch(error){
   if(this.pendingSpanishStart===pending)this.pendingSpanishStart=null;
   if(ticket!==this.epoch)return result(false,'stale-spanish-start');
   await this.spanish.stopAndWait().catch(()=>{});
   this.selected='source';this.transitioning=false;
   this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
 }
 /** Return waits until SA has stopped and disposed before source resume. */
 async returnFromSpanish(state:P024State,options:SyncOptions):Promise<P024ClockResult>{
  if(this.closed||this.selected!=='spanish'||state.sa!=='idle')
   return result(false,'spanish-return-unavailable');
  const ticket=++this.epoch;this.transitioning=true;this.failure=null;
  const pending=this.pendingSpanishStart;
  const preceding=this.retirement;
  const reservation=this.spanishReservation;
  this.spanish.stop();
  const retirement=(async()=>{
   if(preceding)await preceding;
   if(pending)await pending.catch(()=>{});
   await this.spanish.stopAndWait();
   // Pause can cancel the automatic source restart, but cannot leave the
   // reducer on sa:idle while this owner still selects Spanish audio.
   if(!this.closed&&this.selected==='spanish'&&
    this.spanishReservation===reservation){
    this.selected='source';this.transitioning=false;
   }
  })();
  this.retirement=retirement;
  try{
   await retirement;
  }
  catch(error){
   if(ticket!==this.epoch)return result(false,'stale-spanish-return');
   this.transitioning=false;
   this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
  if(this.retirement===retirement)this.retirement=null;
  if(ticket!==this.epoch||this.closed)return result(false,'stale-spanish-return');
  return this.sync(state,options);
 }
 pause():P024ClockResult{
  if(this.closed)return result(false,'owner-closed');
  this.epoch++;this.transitioning=false;this.clock.hold();
  return this.selected==='spanish'?this.spanish.pause():result(true,'source-held');
 }
 async replay():Promise<P024ClockResult>{
  if(this.closed)return result(false,'owner-closed');
  this.epoch++;this.spanish.stop();this.clock.replay();
  this.selected='source';this.transitioning=false;this.failure=null;
  const pending=this.pendingSpanishStart;
  const preceding=this.retirement;
  const retirement=this.retirement=(async()=>{
   if(preceding)await preceding.catch(()=>{});
   if(pending)await pending.catch(()=>{});
   await this.spanish.stopAndWait();
  })();
  try{await retirement;}catch(error){
   this.failure=error instanceof Error?error.message:String(error);
   return result(false,this.failure);
  }
  if(this.retirement===retirement)this.retirement=null;
  return result(true,'all-source-domains-replayed-held');
 }
 setVolume(value:number):P024ClockResult{
  if(this.closed||!Number.isFinite(value)||value<0||value>1)
   return result(false,'invalid-volume');
  const a=this.clock.setVolume(value),b=this.spanish.setVolume(value);
  return a.accepted&&b.accepted?result(true,'volume-set'):
   result(false,'volume-rejected');
 }
 async close():Promise<void>{
  if(this.closed)return;
  this.closed=true;this.epoch++;this.transitioning=false;
  this.clock.hold();this.spanish.stop();
  const pending=this.pendingSpanishStart;
  const preceding=this.retirement;
  const retirement=(async()=>{
   if(preceding)await preceding.catch(()=>{});
   if(pending)await pending.catch(()=>{});
   await this.spanish.stopAndWait();
  })();
  const saClose=retirement.catch(()=>{}).then(()=>this.spanish.close());
  const settled=await Promise.allSettled([preceding,retirement,
   saClose,this.clock.close()]);
  const failed=settled.find((item):item is PromiseRejectedResult=>item.status==='rejected');
  if(failed)throw failed.reason;
 }
}
