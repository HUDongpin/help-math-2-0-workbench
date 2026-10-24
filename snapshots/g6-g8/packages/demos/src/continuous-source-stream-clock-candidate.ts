import {bindTechnicalOwner, type TechnicalOwner} from './technical-observation-v1';
import {DecodedSourceStreamTransport, type DecodedSourceStreamBinding, type DecodedStreamResult} from './decoded-source-stream-transport';

export interface ContinuousSourceClockPlan {
  readonly sourceSwfSha256: string;
  readonly frameDomain: string;
  readonly firstFrame: number;
  readonly lastFrame: number;
  readonly audioFirstFrame?: number;
  readonly fps: number;
  readonly latencySamples: number;
  readonly sourceSegmentCount: 1;
  readonly sourceHasNegativeSeek: false;
  readonly decoder: DecodedSourceStreamBinding;
}
type Phase = 'idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|'timeline-ended'|'failed'|'closed';
type Options = {activation:'automatic'|'user';reducedMotion:boolean};
const answer=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});

/** Continuous-play engineering candidate. It does not implement SWF seeking,
 * discontinuous stream runs, nested entry or original-runtime acceptance. */
export class ContinuousSourceStreamClockCandidate {
  readonly plan:ContinuousSourceClockPlan;
  private readonly transport:DecodedSourceStreamTransport;
  private context:AudioContext|undefined;
  private phase:Phase='idle';
  private position=0;
  private anchor:{contextTime:number;seconds:number}|undefined;
  private epoch=0;
  private audioEnded=false;
  private readonly technicalOwner?: () => TechnicalOwner|null;
  private readonly commitHeldFrame:(frame:number)=>boolean;
  private get audioLeadSeconds(){return ((this.plan.audioFirstFrame??1)-1)/this.plan.fps;}
  constructor(plan:ContinuousSourceClockPlan,options:{createContext?:()=>AudioContext;technicalOwner?:()=>TechnicalOwner|null;commitHeldFrame:(frame:number)=>boolean}){
    if(!/^[a-f0-9]{64}$/u.test(plan.sourceSwfSha256)||!/^sprite-\d+$/u.test(plan.frameDomain)||
      ![plan.firstFrame,plan.lastFrame,plan.latencySamples].every(Number.isSafeInteger)||plan.firstFrame!==1||plan.lastFrame<2||
      !Number.isFinite(plan.fps)||plan.fps<=0||plan.fps>120||plan.latencySamples<0||plan.latencySamples>=plan.decoder.decodedSamples||
      (plan.audioFirstFrame!==undefined&&!Number.isSafeInteger(plan.audioFirstFrame))||(plan.audioFirstFrame??1)<1||(plan.audioFirstFrame??1)>plan.lastFrame||plan.sourceSegmentCount!==1||plan.sourceHasNegativeSeek!==false)throw new Error('unsupported-continuous-source-plan');
    this.plan=Object.freeze({...plan,decoder:Object.freeze({...plan.decoder})});
    if(typeof options.commitHeldFrame!=='function')throw new Error('source-frame-commit-required');
    this.commitHeldFrame=options.commitHeldFrame;this.technicalOwner=options.technicalOwner;
    this.transport=new DecodedSourceStreamTransport(this.plan.decoder,{technicalOwner:options.technicalOwner,createContext:()=>{
      this.context=options.createContext?.()??new AudioContext({sampleRate:plan.decoder.sampleRate,latencyHint:'interactive'});return this.context;
    }});
  }
  snapshot(){
    let audio=this.transport.snapshot();const end=(this.plan.lastFrame-this.plan.firstFrame)/this.plan.fps;
    if(this.phase==='playing'&&this.anchor&&audio.contextTime!==null){
      const held=['interrupted','play-rejected','closed','failed'].includes(audio.phase)?audio.heldContextTime:null;
      this.position=Math.max(0,Math.min(end,this.anchor.seconds+(held??audio.contextTime)-this.anchor.contextTime));
      if(audio.phase==='buffer-ended')this.audioEnded=true;
      if(['interrupted','play-rejected','closed','failed'].includes(audio.phase)||this.context?.state!=='running'){
        this.phase=audio.phase==='closed'?'closed':audio.phase==='failed'?'failed':'paused';this.anchor=undefined;
      }else if(this.position>=end){this.phase='timeline-ended';this.anchor=undefined;this.transport.holdSourceBoundary();audio=this.transport.snapshot();}
    }
    const frame=Math.min(this.plan.lastFrame,this.plan.firstFrame+Math.floor(this.position*this.plan.fps+1e-9));
    return Object.freeze({phase:this.phase,frame,frameDomain:this.plan.frameDomain,elapsedSeconds:this.position,
      audio,audioEnded:this.audioEnded,timelineReachedEnd:this.phase==='timeline-ended',
      originalRuntimeAccepted:false,sourceAlignment:'continuous-play-candidate-not-accepted',lessonCompleted:false});
  }
  async prepare(bytes:ArrayBuffer):Promise<DecodedStreamResult>{
    if(this.phase==='closed')return answer(false,'closed');
    const ticket=++this.epoch;this.position=0;this.anchor=undefined;this.audioEnded=false;this.phase='loading';
    const r=await this.transport.prepare(bytes);if(ticket!==this.epoch)return answer(false,'stale-prepare');
    if(!r.accepted){this.phase='failed';return r;}
    const positioned=this.transport.seekDecodedSample(this.plan.latencySamples);
    this.phase=positioned.accepted?'ready':'failed';return positioned.accepted?answer(true,'ready-at-source-latency'):positioned;
  }
  async play(options:Options):Promise<DecodedStreamResult>{
    if(!['automatic','user'].includes(options.activation)||typeof options.reducedMotion!=='boolean')return answer(false,'invalid-play-policy');
    if(this.phase==='playing')return answer(true,'already-playing');
    if(!['ready','paused','start-pending'].includes(this.phase))return answer(false,'not-ready');
    if(options.reducedMotion&&options.activation==='automatic')return answer(false,'reduced-motion-hold');
    if(this.phase==='start-pending'&&options.activation==='automatic')return answer(false,'start-pending');
    const heldFrame=this.snapshot().frame;
    const technicalOwner=this.technicalOwner?.();
    const ticket=++this.epoch;this.phase='start-pending';
    // A prepared consumer must synchronously commit the held source picture
    // before native sound starts. This keeps Replay from sounding over the
    // previous end frame and preserves the active browser gesture.
    let committed=false;try{committed=this.commitHeldFrame(heldFrame)===true;}catch{/* held, no audio start */}
    if(ticket!==this.epoch)return answer(false,'stale-frame-commit');
    if(!committed){this.phase='paused';return answer(false,'source-frame-not-committed');}
    const audio=this.transport.snapshot();
    if(audio.phase==='buffer-ended'){
      // Preserve the remaining visual tail after decoder EOF without creating
      // another source node or replaying samples from the buffer.
      try{await bindTechnicalOwner(this.context!,technicalOwner).resume();}catch{if(ticket===this.epoch)this.phase='paused';return answer(false,'tail-resume-rejected');}
      if(ticket!==this.epoch)return answer(false,'stale-start');
      if(this.context!.state!=='running'){this.phase='paused';return answer(false,'context-not-running');}
      this.anchor={contextTime:this.context!.currentTime,seconds:this.position};
    }else{
      const r=await this.transport.play({...options,delaySeconds:Math.max(0,this.audioLeadSeconds-this.position)});if(ticket!==this.epoch)return answer(false,'stale-start');
      if(!r.accepted){this.phase='paused';return r;}
      const start=this.transport.snapshot().playbackAnchor;
      if(!start){this.phase='failed';this.transport.holdSourceBoundary();return answer(false,'missing-audio-anchor');}
      this.anchor={contextTime:start.contextTime,seconds:this.audioLeadSeconds+(start.decodedSample-this.plan.latencySamples)/this.plan.decoder.sampleRate};
    }
    this.phase='playing';return answer(true,'playing');
  }
  pause():DecodedStreamResult{
    this.snapshot();if(!['playing','start-pending'].includes(this.phase))return answer(false,'not-playing');
    const anchor=this.anchor;this.epoch++;this.anchor=undefined;this.phase='paused';
    const stopped=this.transport.pause();
    if(stopped.accepted){
      const held=this.transport.snapshot();
      if(anchor&&held.heldContextTime!==null)this.position=Math.max(0,Math.min((this.plan.lastFrame-this.plan.firstFrame)/this.plan.fps,
        anchor.seconds+held.heldContextTime-anchor.contextTime));
    }
    try{if(this.commitHeldFrame(this.snapshot().frame)===true)return answer(true,'paused');}catch{/* audio already held */}
    this.phase='failed';return answer(false,'paused-source-frame-not-committed');
  }
  replay():DecodedStreamResult{
    if(this.phase==='closed'||!['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))return answer(false,'not-ready');
    this.epoch++;this.transport.replay();const r=this.transport.seekDecodedSample(this.plan.latencySamples);
    this.position=0;this.anchor=undefined;this.audioEnded=false;this.phase=r.accepted?'ready':'failed';return r.accepted?answer(true,'replayed-and-held-at-source-latency'):r;
  }
  setVolume(value:number){return this.transport.setVolume(value);}
  /** Modern inspection/resume in this continuous candidate's coordinates.
   * This is not source SWF SeekSamples or legacy Forward/Rewind emulation. */
  seekCandidateFrame(frame:number):DecodedStreamResult{
    if(!Number.isSafeInteger(frame)||frame<this.plan.firstFrame||frame>this.plan.lastFrame||
      !['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))return answer(false,'invalid-candidate-frame');
    const seconds=(frame-this.plan.firstFrame)/this.plan.fps;
    const sample=Math.min(this.plan.decoder.decodedSamples,this.plan.latencySamples+Math.max(0,seconds-this.audioLeadSeconds)*this.plan.decoder.sampleRate);
    this.epoch++;const r=this.transport.seekDecodedSample(sample);if(!r.accepted)return r;
    this.position=seconds;this.anchor=undefined;this.audioEnded=sample===this.plan.decoder.decodedSamples;this.phase='paused';
    try{if(this.commitHeldFrame(frame)===true)return answer(true,'candidate-frame-inspected-and-held');}catch{/* audio already held */}
    this.phase='failed';return answer(false,'inspected-source-frame-not-committed');
  }
  async close(){this.epoch++;this.phase='closed';this.anchor=undefined;await this.transport.close();}
}
