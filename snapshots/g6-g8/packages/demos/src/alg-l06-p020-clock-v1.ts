import {DecodedSourceStreamTransport, type DecodedSourceStreamBinding, type DecodedStreamResult}
  from './decoded-source-stream-transport';
import {P020_AUDIO_ASSETS, p020AudioSlice, type P020AudioId} from './alg-l06-p020-audio-schedule-v1';
import {AlgL06P020QuizStateV1, type P020AnswerInstance, type P020GlossaryKey,
  type P020QuizSnapshot} from './alg-l06-p020-state-v1';

type Transport = Pick<DecodedSourceStreamTransport,
  'prepare'|'snapshot'|'seekDecodedSample'|'play'|'pause'|'replay'|'holdSourceBoundary'|'setVolume'|'close'>;
type Phase = 'idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
  'quiz-held'|'feedback-held'|'transition-ready'|'timeline-ended'|'failed'|'closed';
type Activation = {activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const FPS=12;
const assetIds=P020_AUDIO_ASSETS.map(asset=>asset.id);

/** One shared AudioContext holds the main decoder and seven separate feedback
 * decoders. Exactly one source node may play at a time. Main frame 58 and the
 * three wrong-feedback midpoint stops are authored holds. */
export class AlgL06P020ClockV1 {
  private readonly quiz=new AlgL06P020QuizStateV1();
  private readonly transports=new Map<P020AudioId,Transport>();
  private readonly commitFrame:(quiz:P020QuizSnapshot)=>boolean;
  private readonly createContext:()=>AudioContext;
  private context?:AudioContext;
  private phase:Phase='idle';
  private activeId:P020AudioId='main-1';
  private position=1;
  private anchor?:{id:P020AudioId;contextTime:number;position:number};
  private epoch=0;
  private failure:string|null=null;
  private volume=1;
  private autoContinue=false;

  constructor(options:{commitFrame:(quiz:P020QuizSnapshot)=>boolean;
    createContext?:()=>AudioContext;
    createTransport?:(binding:DecodedSourceStreamBinding,createContext:()=>AudioContext)=>Transport}){
    if(P020_AUDIO_ASSETS.length!==8||!P020_AUDIO_ASSETS.some(a=>a.id==='main-1')||
      P020_AUDIO_ASSETS.filter(a=>a.id.startsWith('feedback-')).length!==7||
      typeof options.commitFrame!=='function')
      throw Error('P020_DOMAIN_PLAN_DRIFT');
    this.commitFrame=options.commitFrame;
    this.createContext=options.createContext??(()=>new AudioContext({sampleRate:22050,latencyHint:'interactive'}));
    const sharedContext=()=>this.context??=this.createContext();
    for(const asset of P020_AUDIO_ASSETS){
      const binding={sourceSha256:asset.sourceSha256,sourceBytes:asset.sourceBytes,
        sampleRate:asset.sampleRate,channels:asset.channels,decodedSamples:asset.decodedSamples,
        pcmSha256:asset.pcmSha256} satisfies DecodedSourceStreamBinding;
      this.transports.set(asset.id,options.createTransport?.(binding,sharedContext)??
        new DecodedSourceStreamTransport(binding,{createContext:sharedContext}));
    }
  }

  snapshot(){
    this.settle();
    const quiz=this.quiz.snapshot();
    const audio=this.transports.get(this.activeId)!.snapshot();
    const activeAsset=P020_AUDIO_ASSETS.find(asset=>asset.id===this.activeId)!;
    return Object.freeze({phase:this.phase,frame:quiz.mainFrame,frameDomain:'sprite-162' as const,
      elapsedSeconds:(quiz.mainFrame-1)/FPS,quiz,
      feedbackDomain:quiz.feedbackDomain,feedbackFrame:quiz.feedbackFrame,
      activeAudioId:this.activeId,activePosition:this.position,
      audio:Object.freeze({phase:audio.phase,decodedSample:audio.decodedSample,
        contextTime:audio.contextTime,volume:audio.volume}),
      mainVisualAfterAudioEof:this.phase==='playing'&&this.activeId==='main-1'&&
        quiz.mainFrame<172&&audio.decodedSample>=activeAsset.decodedSamples,
      autoContinue:this.autoContinue,failure:this.failure,sourceAlignment:'unresolved' as const,
      originalRuntimeAccepted:false as const,audioAccepted:false as const,
      lessonCompleted:false as const});
  }

  async prepare(inputs:Readonly<Record<P020AudioId,ArrayBuffer>>):Promise<DecodedStreamResult>{
    if(this.phase!=='idle')return result(false,'prepare-not-idle');
    const ticket=++this.epoch;this.phase='loading';
    try{
      for(const id of assetIds){
        const bytes=inputs?.[id];
        if(!(bytes instanceof ArrayBuffer))throw Error(`missing-source-${id}`);
        const prepared=await this.transports.get(id)!.prepare(bytes);
        if(ticket!==this.epoch)return result(false,'stale-prepare');
        if(!prepared.accepted)throw Error(`${id}:${prepared.reason}`);
        const volume=this.transports.get(id)!.setVolume(this.volume);
        if(!volume.accepted)throw Error(`${id}:${volume.reason}`);
      }
      if(!this.commit())throw Error('source-first-frame-not-committed');
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.phase='ready';return result(true,'eight-source-domains-ready');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.phase='failed';this.failure=error instanceof Error?error.message:String(error);
      await this.closeSources();return result(false,this.failure);
    }
  }

  async play(policy:Activation):Promise<DecodedStreamResult>{
    this.settle();
    if(!policy||!['automatic','user'].includes(policy.activation)||
      typeof policy.reducedMotion!=='boolean')return result(false,'invalid-play-policy');
    if(policy.activation==='automatic'&&policy.reducedMotion)return result(false,'reduced-motion-hold');
    if(this.quiz.snapshot().glossaryOpen!==null)return result(false,'glossary-open-hold');
    if(this.phase==='playing')return result(true,'already-playing');
    if(!['ready','paused','transition-ready'].includes(this.phase))return result(false,'source-hold-or-not-ready');
    if(policy.activation==='automatic'&&!this.autoContinue)return result(false,'automatic-start-not-authorized');
    if(policy.activation==='user'&&this.quiz.snapshot().phase==='awaiting-answer')return result(false,'quiz-answer-required');
    const ticket=++this.epoch;
    this.phase='start-pending';
    const q=this.quiz.snapshot();
    if(q.phase==='post-quiz'&&q.mainFrame===58){
      this.quiz.play();this.quiz.advanceMain(59);
    }else this.quiz.play();
    if(!this.commit()){
      this.quiz.pause();this.phase='paused';return result(false,'source-frame-not-committed');
    }
    if(ticket!==this.epoch)return result(false,'stale-frame-commit');
    const position=this.position;
    const transport=this.transports.get(this.activeId)!;
    try{
      const slice=p020AudioSlice(this.activeId,position);
      if(slice){
        const sought=transport.seekDecodedSample(slice.firstDecodedSample);
        if(!sought.accepted)throw Error(sought.reason);
        const played=await transport.play({...policy,delaySeconds:slice.delaySeconds});
        if(ticket!==this.epoch)return result(false,'stale-start');
        if(!played.accepted)throw Error(played.reason);
      }else{
        await this.context!.resume();
        if(ticket!==this.epoch)return result(false,'stale-start');
        if(this.context!.state!=='running')throw Error('context-not-running');
      }
      this.anchor={id:this.activeId,contextTime:this.context!.currentTime,position};
      this.phase='playing';this.failure=null;this.autoContinue=false;
      this.settle();return result(true,'source-domain-playing');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-start');
      transport.pause();this.anchor=undefined;this.quiz.pause();this.phase='paused';
      this.failure=error instanceof Error?error.message:String(error);
      return result(false,this.failure);
    }
  }

  /** Drive source-owned frame positions from the running AudioContext. */
  tick(){return this.snapshot();}

  pause():DecodedStreamResult{
    this.settle();
    if(this.phase==='closed')return result(false,'closed');
    this.epoch++;
    if(this.phase==='playing'||this.phase==='start-pending')this.transports.get(this.activeId)!.pause();
    this.anchor=undefined;this.quiz.pause();
    if(this.phase==='playing'||this.phase==='start-pending'||this.phase==='paused')this.phase='paused';
    this.autoContinue=false;
    return this.commit()?result(true,'source-domain-held'):this.fail('paused-frame-not-committed');
  }

  answer(instance:P020AnswerInstance,ordinal:number):DecodedStreamResult{
    this.settle();
    if(this.phase!=='quiz-held'||this.quiz.snapshot().glossaryOpen!==null)return result(false,'quiz-not-held');
    const before=this.quiz.snapshot();
    const after=this.quiz.answer(instance,ordinal);
    if(after===before||after.phase!=='feedback'||!after.feedbackDomain)return result(false,'answer-rejected');
    this.epoch++;this.transports.get(this.activeId)!.holdSourceBoundary();
    const branch=P020_AUDIO_ASSETS.find(asset=>asset.domain===after.feedbackDomain);
    if(!branch)return this.fail('feedback-domain-missing');
    this.activeId=branch.id;this.position=2;this.anchor=undefined;this.phase='paused';
    return this.commit()?result(true,'feedback-branch-selected'):this.fail('feedback-first-frame-not-committed');
  }

  acknowledgeFeedback():DecodedStreamResult{
    this.settle();
    const before=this.quiz.snapshot();
    if(this.phase!=='feedback-held'||!before.feedbackAwaitingAcknowledgment||
      before.feedbackToken===null)return result(false,'feedback-ack-not-available');
    const after=this.quiz.acknowledgeFeedback(before.feedbackToken);
    if(after.feedbackFrame===before.feedbackFrame||after.feedbackFrame===null)
      return result(false,'feedback-ack-rejected');
    this.position=after.feedbackFrame;this.phase='paused';
    return this.commit()?result(true,'feedback-acknowledged'):this.fail('feedback-resume-frame-not-committed');
  }

  openGlossary(key:P020GlossaryKey):DecodedStreamResult{
    this.pause();
    const before=this.quiz.snapshot();
    this.quiz.openGlossary(key);
    return this.quiz.snapshot().glossaryOpen!==before.glossaryOpen
      ?result(true,'glossary-opened-and-held'):result(false,'glossary-unavailable');
  }
  closeGlossary(){this.quiz.closeGlossary();return result(true,'glossary-closed-held');}

  replay():DecodedStreamResult{
    if(!['ready','paused','playing','start-pending','quiz-held','feedback-held',
      'transition-ready','timeline-ended'].includes(this.phase))return result(false,'not-ready');
    this.epoch++;this.anchor=undefined;this.autoContinue=false;
    for(const transport of this.transports.values())transport.replay();
    this.quiz.replay();this.activeId='main-1';this.position=1;this.phase='ready';this.failure=null;
    return this.commit()?result(true,'source-replayed-and-held'):this.fail('replay-frame-not-committed');
  }
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)return result(false,'invalid-volume');
    this.volume=value;
    for(const transport of this.transports.values()){
      const set=transport.setVolume(value);if(!set.accepted)return set;
    }
    return result(true,'volume-set');
  }
  async close():Promise<void>{
    if(this.phase==='closed')return;
    this.epoch++;this.anchor=undefined;this.autoContinue=false;
    this.quiz.navigateAway();this.phase='closed';await this.closeSources();
  }

  private commit():boolean{
    try{return this.commitFrame(this.quiz.snapshot())===true;}catch{return false;}
  }
  private fail(reason:string):DecodedStreamResult{
    this.epoch++;this.anchor=undefined;this.autoContinue=false;this.quiz.pause();
    this.transports.get(this.activeId)!.holdSourceBoundary();
    this.phase='failed';this.failure=reason;return result(false,reason);
  }
  private async closeSources():Promise<void>{
    // Transports share one context; close serially, then drain the remaining
    // transport listeners that observed its closed state.
    for(const transport of this.transports.values())await transport.close();
  }
  private settle():void{
    if(this.phase!=='playing'||!this.anchor||!this.context)return;
    const native=this.transports.get(this.activeId)!.snapshot();
    const interrupted=this.context.state!=='running'||
      ['interrupted','play-rejected','failed','closed'].includes(native.phase);
    const time=interrupted?(native.heldContextTime??native.contextTime??this.context.currentTime)
      :this.context.currentTime;
    if(!Number.isFinite(time))return void this.fail('invalid-context-time');
    const activeAsset=P020_AUDIO_ASSETS.find(a=>a.id===this.activeId)!;
    const maxPosition=activeAsset.lastVisualFrame;
    const target=Math.min(maxPosition,
      this.anchor.position+Math.max(0,time-this.anchor.contextTime)*FPS);
    this.position=Math.max(this.position,target);
    const frame=Math.min(activeAsset.lastVisualFrame,Math.floor(this.position+1e-9));
    const old=this.quiz.snapshot();
    const current=old.phase==='feedback'?
      this.quiz.advanceFeedback(frame,old.feedbackToken!):this.quiz.advanceMain(frame);
    if(current.mainFrame!==old.mainFrame||current.feedbackFrame!==old.feedbackFrame){
      if(!this.commit())return void this.fail('source-frame-commit-failed');
    }
    if(interrupted){
      this.epoch++;this.anchor=undefined;this.quiz.pause();this.phase='paused';
      return;
    }
    if(current.phase==='awaiting-answer'&&old.phase==='before-quiz'){
      this.epoch++;this.transports.get(this.activeId)!.holdSourceBoundary();
      this.anchor=undefined;this.position=58;this.phase='quiz-held';return;
    }
    if(current.feedbackAwaitingAcknowledgment){
      this.epoch++;this.transports.get(this.activeId)!.holdSourceBoundary();
      this.anchor=undefined;this.position=current.feedbackFrame!;this.phase='feedback-held';return;
    }
    if(current.phase==='feedback'&&current.feedbackFrame===current.feedbackTerminalFrame&&
      current.feedbackToken!==null){
      this.epoch++;this.transports.get(this.activeId)!.holdSourceBoundary();
      this.anchor=undefined;
      const after=this.quiz.completeFeedback(current.feedbackToken,current.feedbackFrame!);
      if(after.phase==='awaiting-answer'){
        this.activeId='main-1';this.position=58;this.phase='quiz-held';
      }else{
        this.activeId='main-1';this.position=59;this.phase='transition-ready';
        this.autoContinue=true;
      }
      if(!this.commit())this.fail('feedback-terminal-frame-not-committed');
      return;
    }
    // The measured main decoder exhausts near frame 171.93. Context time
    // continues through the source's last visual frame 172 without inventing
    // audio; EOF alone cannot end the visual timeline before that frame.
    if(current.mainFrame===172&&old.phase==='post-quiz'&&this.activeId==='main-1'){
      this.epoch++;this.transports.get(this.activeId)!.holdSourceBoundary();
      this.anchor=undefined;this.position=172;this.phase='timeline-ended';
    }
  }
}
