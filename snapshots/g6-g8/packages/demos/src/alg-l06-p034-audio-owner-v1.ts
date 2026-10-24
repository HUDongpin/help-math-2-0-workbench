import {P025AudioOwnerV1,type P025SeparateSpanishAudio}
 from './alg-l06-p025-audio-owner-v1';
import type {DecodedStreamResult}
 from './decoded-source-stream-transport';
import type {P034OptionalSpanishAudioSnapshot}
 from './alg-l06-p034-optional-spanish-audio-v1';
import type {AlgL06P034ClockV1} from './alg-l06-p034-clock-v1';

export interface P034ResumableSpanishAudio extends P025SeparateSpanishAudio {
  snapshot():P034OptionalSpanishAudioSnapshot;
  resume(policy:{activation:'user'}):Promise<DecodedStreamResult>;
}

/** One P025 owner for the continuous P034 main and separately triggered SA.
 * The main clock must expose an actual pending native EOF before transfer. */
export class P034AudioOwnerV1 extends P025AudioOwnerV1 {
  constructor(private readonly mainClock:AlgL06P034ClockV1,
    private readonly spanishAudio:P034ResumableSpanishAudio){super(mainClock,spanishAudio);}
  override snapshot(){
    const value=super.snapshot(),main=this.mainClock.snapshot();
    return Object.freeze({...value,...main,main,spanish:this.spanishAudio.snapshot(),
      // Preserve P025's selected-owner/transfer failure projection.
      playbackPhase:value.playbackPhase,selectedAudio:value.selectedAudio,
      transitioning:value.transitioning,closed:value.closed,
      ownershipFailure:value.ownershipFailure,failure:value.failure});
  }
  override async play(policy:{activation:'user';reducedMotion:boolean}):Promise<DecodedStreamResult>{
    const before=this.snapshot();
    if(before.selectedAudio!=='spanish')return super.play(policy);
    if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
      return Object.freeze({accepted:false,reason:'explicit-user-play-required'});
    if(before.closed||before.transitioning||!before.spanish.canResume)
      return Object.freeze({accepted:false,reason:'spanish-resume-unavailable'});
    return this.spanishAudio.resume({activation:'user'});
  }
  override async startSpanish(policy:{activation:'user'}):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user')
      return Object.freeze({accepted:false,reason:'explicit-user-spanish-start-required'});
    const before=this.snapshot();
    if(before.closed||before.selectedAudio!=='main')
      return Object.freeze({accepted:false,reason:'spanish-start-unavailable'});
    // At full decoded cursor, P034 pause preserves the real source until its
    // native onended. Hold before P025 selects Spanish, then check again.
    if(before.main.nativeEofPending)
      return Object.freeze({accepted:false,reason:'main-native-eof-pending'});
    if(before.main.phase==='playing'||before.main.phase==='start-pending'){
      const held=this.mainClock.pause();
      if(!held.accepted)return Object.freeze({accepted:false,reason:'main-pause-failed'});
    }
    if(this.mainClock.snapshot().nativeEofPending)
      return Object.freeze({accepted:false,reason:'main-native-eof-pending'});
    return super.startSpanish(policy);
  }
}
export type {P025MainAudio as P034MainAudio,
 P025SeparateSpanishAudio as P034SeparateSpanishAudio}
 from './alg-l06-p025-audio-owner-v1';
