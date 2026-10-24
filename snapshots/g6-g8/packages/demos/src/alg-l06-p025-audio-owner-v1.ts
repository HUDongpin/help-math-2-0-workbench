import type {DecodedStreamResult} from './decoded-source-stream-transport';

export interface P025MainAudio {
  snapshot(): Readonly<{phase:string;frame:number;frameDomain:string;audio:Readonly<{phase:string}>;
    glossaryOpen?:string|null;failure?:string|null}>;
  play(policy:{activation:'user';reducedMotion:boolean}):Promise<DecodedStreamResult>;
  pause():DecodedStreamResult;
  replay():DecodedStreamResult;
  setVolume(value:number):DecodedStreamResult;
  close():Promise<void>;
}

export interface P025SeparateSpanishAudio {
  snapshot():Readonly<{phase:string;failure?:string|null}>;
  start(policy:{activation:'user'}):Promise<DecodedStreamResult>;
  pause():DecodedStreamResult;
  stop():DecodedStreamResult;
  stopAndWait():Promise<void>;
  setVolume(value:number):DecodedStreamResult;
  close():Promise<void>;
}

type UserPolicy={activation:'user';reducedMotion:boolean};
type ReturnPolicy=UserPolicy&{resumeMain?:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const activeMain=(phase:string)=>phase==='playing'||phase==='start-pending';
const usableMain=(phase:string)=>['ready','paused','playing','start-pending',
  'timeline-ended'].includes(phase);
const message=(error:unknown)=>error instanceof Error?error.message:String(error);

/** P025 has one continuous main stream and one independent, optional SA.
 * Only explicit user actions can begin either recording. The injected clock
 * and SA own byte/PCM validation and immediate native-node retirement. */
export class P025AudioOwnerV1 {
  private selected:'main'|'spanish'='main';
  private transitioning=false;
  private closed=false;
  private epoch=0;
  private spanishReservation=0;
  private failure:string|null=null;
  private pendingMainStart:Promise<DecodedStreamResult>|null=null;
  private pendingSpanishStart:Promise<DecodedStreamResult>|null=null;
  private retirement:Promise<void>|null=null;

  constructor(private readonly main:P025MainAudio,
    private readonly spanish:P025SeparateSpanishAudio){}

  snapshot(){
    const main=this.main.snapshot(),spanish=this.spanish.snapshot();
    return Object.freeze({...main,main,spanish,selectedAudio:this.selected,
      transitioning:this.transitioning,closed:this.closed,
      playbackPhase:this.closed?'closed':this.transitioning?'transitioning':
        this.selected==='spanish'?spanish.phase:main.phase,
      ownershipFailure:this.failure,
      failure:this.failure??(this.selected==='spanish'?spanish.failure:main.failure)??null,
      originalRuntimeAccepted:false as const,audioAccepted:false as const,
      lessonCompleted:false as const});
  }

  /** Main Play never selects SA, including when the product locale is es. */
  async play(policy:UserPolicy):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
      return result(false,'explicit-user-play-required');
    if(this.closed)return result(false,'owner-closed');
    if(this.selected==='spanish')return result(false,'explicit-spanish-return-required');
    const ticket=++this.epoch;
    const barrier=this.retirement;
    if(barrier){
      try{await barrier;}catch(error){
        if(ticket!==this.epoch)return result(false,'stale-main-start');
        this.failure=message(error);return result(false,this.failure);
      }
      if(ticket!==this.epoch||this.closed||this.selected!=='main')
        return result(false,'stale-main-start');
      if(this.retirement===barrier)this.retirement=null;
    }
    const pending=this.main.play(policy);this.pendingMainStart=pending;
    try{
      const started=await pending;
      if(ticket!==this.epoch||this.closed||this.selected!=='main')
        return result(false,'stale-main-start');
      if(!started.accepted)this.failure=started.reason;
      else this.failure=null;
      return started;
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-main-start');
      this.failure=message(error);return result(false,this.failure);
    }finally{
      if(this.pendingMainStart===pending)this.pendingMainStart=null;
    }
  }

  /** The source node is held before the optional recording may load/start.
   * A pending main start must settle and be held again before SA can begin. */
  async startSpanish(policy:{activation:'user'}):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user')
      return result(false,'explicit-user-spanish-start-required');
    if(this.closed||this.selected==='spanish')
      return result(false,'spanish-start-unavailable');
    const before=this.main.snapshot();
    if(before.glossaryOpen!=null||!usableMain(before.phase))
      return result(false,'main-not-ready-for-spanish');
    const ticket=++this.epoch,reservation=++this.spanishReservation;
    this.selected='spanish';this.transitioning=true;this.failure=null;
    if(activeMain(before.phase)&&!this.main.pause().accepted){
      this.selected='main';this.transitioning=false;
      return result(false,'main-pause-failed');
    }
    const pendingMain=this.pendingMainStart;
    if(pendingMain)await pendingMain.catch(()=>{});
    if(ticket!==this.epoch||this.closed||this.spanishReservation!==reservation)
      return result(false,'stale-spanish-start');
    const after=this.main.snapshot();
    if(activeMain(after.phase)&&!this.main.pause().accepted){
      this.selected='main';this.transitioning=false;
      return result(false,'main-pause-failed');
    }
    const barrier=this.retirement;
    if(barrier){
      try{await barrier;}catch(error){
        if(ticket!==this.epoch)return result(false,'stale-spanish-start');
        this.selected='main';this.transitioning=false;this.failure=message(error);
        return result(false,this.failure);
      }
      if(ticket!==this.epoch||this.closed||this.spanishReservation!==reservation)
        return result(false,'stale-spanish-start');
      if(this.retirement===barrier)this.retirement=null;
    }
    const pending=this.spanish.start(policy);this.pendingSpanishStart=pending;
    try{
      const started=await pending;
      if(ticket!==this.epoch||this.closed||this.spanishReservation!==reservation)
        return result(false,'stale-spanish-start');
      if(!started.accepted)throw Error(started.reason);
      this.transitioning=false;
      return result(true,'separate-spanish-playing');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-spanish-start');
      try{await this.spanish.stopAndWait();}catch{/* Retire best effort; report start failure. */}
      if(ticket!==this.epoch)return result(false,'stale-spanish-start');
      this.selected='main';this.transitioning=false;this.failure=message(error);
      return result(false,this.failure);
    }finally{
      if(this.pendingSpanishStart===pending)this.pendingSpanishStart=null;
    }
  }

  /** Pause cancels loading as well as currently audible playback. It never
   * changes Spanish selection, so only Return can hand control to main. */
  pause():DecodedStreamResult{
    if(this.closed)return result(false,'owner-closed');
    this.epoch++;this.transitioning=false;
    const phase=this.main.snapshot().phase;
    if(activeMain(phase))this.main.pause();
    if(this.selected==='main')return result(true,'main-held');
    const paused=this.spanish.pause();
    const pending=this.pendingSpanishStart;
    if(pending){
      const preceding=this.retirement;
      const retirement=(async()=>{
        if(preceding)await preceding;
        await pending.catch(()=>{});
        await this.spanish.stopAndWait();
      })();
      this.retirement=retirement;
      void retirement.catch(error=>{this.failure=message(error);});
    }
    return paused;
  }

  /** Natural SA EOF remains selected and held. Only explicit Return retires
   * it, then optionally resumes the exact held main cursor. */
  async returnMain(policy:ReturnPolicy):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
      return result(false,'explicit-user-return-required');
    if(this.closed||this.selected!=='spanish')
      return result(false,'spanish-not-selected');
    const ticket=++this.epoch,reservation=this.spanishReservation;
    this.transitioning=true;this.failure=null;
    this.spanish.stop();
    const pending=this.pendingSpanishStart,preceding=this.retirement;
    const retirement=(async()=>{
      if(preceding)await preceding;
      if(pending)await pending.catch(()=>{});
      await this.spanish.stopAndWait();
      // Pause cancels resumption but still releases this completed reservation.
      if(!this.closed&&this.selected==='spanish'&&
        this.spanishReservation===reservation){
        this.selected='main';this.transitioning=false;
      }
    })();
    this.retirement=retirement;
    try{await retirement;}catch(error){
      if(ticket!==this.epoch)return result(false,'stale-spanish-return');
      this.transitioning=false;this.failure=message(error);
      return result(false,this.failure);
    }
    if(this.retirement===retirement)this.retirement=null;
    if(ticket!==this.epoch||this.closed)return result(false,'stale-spanish-return');
    const phase=this.main.snapshot().phase;
    if(phase==='timeline-ended')return result(true,'terminal-main-remains-held');
    if(!['ready','paused'].includes(phase))
      return result(false,'main-return-not-ready');
    if(policy.resumeMain===false)return result(true,'main-returned-held');
    return this.play(policy);
  }

  /** Replay is held at the first source frame; a later user Play is needed. */
  async replay():Promise<DecodedStreamResult>{
    if(this.closed)return result(false,'owner-closed');
    const ticket=++this.epoch;
    this.spanish.stop();
    const replayed=this.main.replay();
    this.selected='main';this.transitioning=true;this.failure=null;
    const pendingSA=this.pendingSpanishStart;
    const pendingMain=this.pendingMainStart;
    const preceding=this.retirement;
    const retirement=(async()=>{
      if(preceding)await preceding;
      if(pendingSA)await pendingSA.catch(()=>{});
      await this.spanish.stopAndWait();
      if(pendingMain)await pendingMain.catch(()=>{});
    })();
    this.retirement=retirement;
    try{await retirement;}catch(error){
      if(ticket!==this.epoch)return result(false,'stale-replay');
      this.transitioning=false;this.failure=message(error);
      return result(false,this.failure);
    }
    if(this.retirement===retirement)this.retirement=null;
    if(ticket!==this.epoch||this.closed)return result(false,'stale-replay');
    this.transitioning=false;
    if(!replayed.accepted)this.failure=replayed.reason;
    return replayed;
  }

  setVolume(value:number):DecodedStreamResult{
    if(this.closed||!Number.isFinite(value)||value<0||value>1)
      return result(false,'invalid-volume');
    const main=this.main.setVolume(value),sa=this.spanish.setVolume(value);
    return main.accepted&&sa.accepted?result(true,'volume-set'):
      result(false,'volume-rejected');
  }

  async close():Promise<void>{
    if(this.closed)return;
    this.closed=true;this.epoch++;this.transitioning=false;
    const phase=this.main.snapshot().phase;
    if(activeMain(phase))this.main.pause();
    this.spanish.stop();
    const pendingSA=this.pendingSpanishStart,pendingMain=this.pendingMainStart;
    const preceding=this.retirement;
    const mainClose=this.main.close();
    const spanishClose=(async()=>{
      if(preceding)await preceding.catch(()=>{});
      if(pendingSA)await pendingSA.catch(()=>{});
      await this.spanish.stopAndWait();
      await this.spanish.close();
    })();
    const settled=await Promise.allSettled([mainClose,spanishClose,pendingMain]);
    const failed=settled.find((entry):entry is PromiseRejectedResult=>entry.status==='rejected');
    if(failed)throw failed.reason;
  }
}
