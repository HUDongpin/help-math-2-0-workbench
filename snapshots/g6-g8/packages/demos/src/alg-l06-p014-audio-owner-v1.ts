import type {AlgL06P014ClockV1} from './alg-l06-p014-clock-v1';
import type {P014OptionalSpanishAudio} from './alg-l06-p014-optional-spanish-audio-v1';
import type {DecodedStreamResult} from './decoded-source-stream-transport';

type Main=Pick<AlgL06P014ClockV1,'snapshot'|'play'|'pause'|'replay'|'close'|'setVolume'>;
type Spanish=Pick<P014OptionalSpanishAudio,'snapshot'|'start'|'pause'|'stop'|'stopAndWait'|'close'|'setVolume'>;
const answer=(accepted:boolean,reason:string):DecodedStreamResult=>({accepted,reason});

/** P014 ownership only. The separate SA is an explicit action and never part
 * of the main stream or locale choice. The main cursor remains held for Return. */
export class P014AudioOwnerV1{
 private selected=false;
 private returning=false;
 private closed=false;
 private operation=0;
 private failure:string|null=null;
 constructor(private readonly main:Main,private readonly spanish:Spanish){}
 setVolume(value:number):DecodedStreamResult{
  if(this.closed||!Number.isFinite(value)||value<0||value>1)return answer(false,'invalid-volume');
  const main=this.main.setVolume(value),spanish=this.spanish.setVolume(value);
  return main.accepted&&spanish.accepted?answer(true,'volume-set'):answer(false,'volume-rejected');
 }
 snapshot(){
  const main=this.main.snapshot(),spanish=this.spanish.snapshot();
  return {...main,failure:main.failure??null,audioAccepted:false as const,
   selectedAudio:this.selected?'spanish' as const:'main' as const,spanish,
   returning:this.returning,ownershipFailure:this.failure,
   playbackPhase:this.closed?'closed':this.returning?'returning':this.selected?spanish.phase:main.phase};
 }
 async play(reducedMotion=false):Promise<DecodedStreamResult>{
  if(this.closed||this.returning)return answer(false,'audio-owner-not-ready');
  if(this.selected)return this.startSpanish();
  const ticket=++this.operation;
  const started=await this.main.play({activation:'user',reducedMotion});
  return ticket===this.operation?started:answer(false,'stale-main-start');
 }
 async startSpanish():Promise<DecodedStreamResult>{
  if(this.closed)return answer(false,'audio-owner-closed');
  const phase=this.main.snapshot().phase;
  if(!['ready','paused','playing','start-pending','quiz-held','feedback-held','transition-ready','timeline-ended'].includes(phase))
   return answer(false,'main-not-ready-for-spanish');
  const ticket=++this.operation;
  this.returning=false;this.failure=null;
  if(['playing','start-pending'].includes(phase)&&!this.main.pause().accepted)
   return answer(false,'main-pause-failed');
  this.selected=true;
  const started=await this.spanish.start({activation:'user'});
  return ticket===this.operation?started:answer(false,'stale-spanish-start');
 }
 pause():DecodedStreamResult{
  if(this.closed)return answer(false,'audio-owner-closed');
  this.operation++;this.returning=false;
  const phase=this.main.snapshot().phase;
  if(['playing','start-pending'].includes(phase))this.main.pause();
  if(this.selected)return this.spanish.pause();
  return answer(true,'main-held');
 }
 async returnMain(reducedMotion=false):Promise<DecodedStreamResult>{
  if(this.closed||!this.selected)return answer(false,'spanish-not-selected');
  const ticket=++this.operation;
  this.returning=true;this.failure=null;
  try{await this.spanish.stopAndWait();}
  catch(error){
   if(ticket!==this.operation)return answer(false,'stale-spanish-return');
   this.returning=false;this.failure=error instanceof Error?error.message:String(error);
   return answer(false,this.failure);
  }
  if(this.closed||ticket!==this.operation)return answer(false,'stale-spanish-return');
  this.selected=false;this.returning=false;
  const main=this.main.snapshot();
  if(['timeline-ended','quiz-held','feedback-held'].includes(main.phase))
   return answer(true,'held-main-remains-held');
  if(!['ready','paused','transition-ready'].includes(main.phase))return answer(false,'main-return-not-ready');
  const resumed=await this.main.play({activation:'user',reducedMotion});
  return ticket===this.operation?resumed:answer(false,'stale-main-return');
 }
 replay():DecodedStreamResult{
  if(this.closed)return answer(false,'audio-owner-closed');
  this.operation++;this.selected=false;this.returning=false;this.failure=null;
  this.spanish.stop();
  return this.main.replay();
 }
 async close():Promise<void>{
  this.operation++;this.closed=true;this.selected=false;this.returning=false;
  const settled=await Promise.allSettled([this.spanish.close(),this.main.close()]);
  const failed=settled.find((x):x is PromiseRejectedResult=>x.status==='rejected');
  if(failed)throw failed.reason;
 }
}
