import {P025AudioOwnerV1,type P025SeparateSpanishAudio}
 from './alg-l06-p025-audio-owner-v1';
import type {DecodedStreamResult}
 from './decoded-source-stream-transport';
import type {P032OptionalSpanishAudioSnapshot}
 from './alg-l06-p032-optional-spanish-audio-v1';
import type {AlgL06P032ClockV1} from './alg-l06-p032-clock-v1';

export interface P032ResumableSpanishAudio extends P025SeparateSpanishAudio {
 snapshot():P032OptionalSpanishAudioSnapshot;
 resume(policy:{activation:'user'}):Promise<DecodedStreamResult>;
}

/** Reuse P025 handoff/retirement. P032 must expose a pending native EOF
 * before P025 transfers ownership to optional SA. */
export class P032AudioOwnerV1 extends P025AudioOwnerV1 {
 constructor(private readonly mainClock:AlgL06P032ClockV1,
  private readonly spanishAudio:P032ResumableSpanishAudio){super(mainClock,spanishAudio);}
 override snapshot(){
  const value=super.snapshot();
  return Object.freeze({...value,spanish:this.spanishAudio.snapshot()});
 }
 override async play(policy:{activation:'user';reducedMotion:boolean}):Promise<DecodedStreamResult>{
  const before=this.snapshot();
  if(before.selectedAudio!=='spanish')return super.play(policy);
  if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
   return Object.freeze({accepted:false,reason:'explicit-user-play-required'});
  if(before.closed||before.transitioning||!this.spanishAudio.snapshot().canResume)
   return Object.freeze({accepted:false,reason:'spanish-resume-unavailable'});
  return this.spanishAudio.resume({activation:'user'});
 }
 override async startSpanish(policy:{activation:'user'}){
  // A rejected policy cannot alter the main clock. If the decoded cursor has
  // reached its end, P032 pause retains the real node until onended. Do this
  // before P025 changes selectedAudio, then recheck the newly exposed state.
  if(!policy||policy.activation!=='user')
   return Object.freeze({accepted:false,reason:'explicit-user-spanish-start-required'});
  const before=this.snapshot();
  if(!before.closed&&before.selectedAudio==='main'&&
    (before.main.phase==='playing'||before.main.phase==='start-pending')){
   const held=this.mainClock.pause();
   if(!held.accepted)return Object.freeze({accepted:false,reason:'main-pause-failed'});
  }
  if(this.mainClock.snapshot().nativeEofPending)
   return Object.freeze({accepted:false,reason:'main-native-eof-pending'});
  return super.startSpanish(policy);
 }
}
export type {P025MainAudio as P032MainAudio,
 P025SeparateSpanishAudio as P032SeparateSpanishAudio}
 from './alg-l06-p025-audio-owner-v1';
