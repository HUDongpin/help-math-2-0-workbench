import {p029AudioIntent,p029InitialState,p029Reduce,type P029Event,
  type P029State,type P029Transition} from './quiz-reducer-v1';
import {P029AudioOwnerCueV3} from './audio-owner-v3';
import {P029_AUDIO_MANIFEST} from './audio-schedule-v1';

type Anchor={domain:string;epoch:number;frame:number;seconds:number;clock:'audio-context'|'host'};
const fps=P029_AUDIO_MANIFEST.fps;
const valid=(n:number)=>Number.isFinite(n)&&n>=0;

/** Per-domain source clock. The reducer remains the sole authority for quiz,
 * wrong popup hold/Close, retry, terminal handoff, and Replay tokens. Native
 * EOF only gates a visual terminal; it never creates a lesson-complete claim. */
export class P029DomainClockCueV4 {
  private state:P029State=p029InitialState();
  private anchor:Anchor|null=null;
  private closed=false;
  private failure:string|null=null;
  private commandRevision=0;
  private prerollDelaySeconds=1/fps;
  constructor(private readonly owner:P029AudioOwnerCueV3,
    private readonly nowSeconds:()=>number=()=>performance.now()/1000){}
  snapshot(){return Object.freeze({state:this.state,audio:this.owner.snapshot(),anchor:this.anchor,
    failure:this.failure,sourceAlignment:'unresolved' as const,
    originalRuntimeAccepted:false as const,audioAccepted:false as const,
    lessonCompleted:false as const});}
  private clockNow():{seconds:number;clock:Anchor['clock']}{
    const native=this.owner.snapshot();
    if(native.contextTime!==null&&valid(native.contextTime))
      return {seconds:native.contextTime,clock:'audio-context'};
    const seconds=this.nowSeconds();
    if(!valid(seconds))throw Error('P029_INVALID_CLOCK');
    return {seconds,clock:'host'};
  }
  private placeAnchor(){
    const intent=p029AudioIntent(this.state);
    if(!intent){this.anchor=null;return;}
    const current=this.clockNow();
    this.anchor={domain:intent.domain,epoch:intent.epoch,frame:intent.frame,...current};
  }
  async dispatch(event:P029Event,activation:'user'|'automatic'='automatic'):
    Promise<P029Transition>{
    if(this.closed)throw Error('P029_CLOCK_CLOSED');
    if(event.type==='play')throw Error('P029_USE_PREPARED_PLAY');
    if(event.type==='replay'){
      this.prerollDelaySeconds=1/fps;
      this.failure=null;
    }
    const transition=p029Reduce(this.state,event);
    if(!transition.accepted)return transition;
    if(event.type==='replay'||transition.retireAudio)++this.commandRevision;
    const revision=this.commandRevision;
    const priorAnchor=this.anchor;
    this.state=transition.state;
    if(transition.retireAudio)this.owner.hold('reducer-retired-audio');
    const intent=p029AudioIntent(this.state);
    if(intent){
      const audio=await this.owner.sync(this.state,activation);
      if(revision!==this.commandRevision)return transition;
      if(!audio.accepted){this.failure=audio.reason;this.anchor=null;return transition;}
      this.failure=null;
      // Ordinary frame advances retain the original fractional frame time.
      // A new stream, resumed stream, domain, or epoch receives a fresh anchor.
      if(priorAnchor&&priorAnchor.domain===intent.domain&&
        priorAnchor.epoch===intent.epoch&&audio.reason==='source-domain-already-owned')
        this.anchor=priorAnchor;
      else this.placeAnchor();
    }else if(this.state.phase==='prequiz'&&this.state.playing&&this.state.mainFrame===1){
      const current=this.clockNow();
      this.anchor={domain:'sprite-185',epoch:this.state.epoch,frame:1,...current};
    }else this.anchor=null;
    return transition;
  }
  prepare(){return this.owner.prepareMain();}
  async play(){
    if(this.closed)throw Error('P029_CLOCK_CLOSED');
    if(!this.owner.mainPrepared())throw Error('P029_MAIN_PRELOAD_REQUIRED');
    const transition=p029Reduce(this.state,{type:'play'});
    if(!transition.accepted)return transition;
    this.state=transition.state;
    this.prerollDelaySeconds=1/fps;
    const revision=++this.commandRevision;
    const current=this.clockNow();
    this.anchor={domain:'sprite-185',epoch:this.state.epoch,frame:1,...current};
    // startPreparedMain enters AudioContext.resume before any asynchronous load.
    const started=await this.owner.startPreparedMain(this.state.epoch,this.prerollDelaySeconds);
    if(revision!==this.commandRevision)return transition;
    if(!started.accepted){this.failure=started.reason;this.anchor=null;}
    else this.failure=null;
    return transition;
  }
  async hostSelectFeedback(branchIndex:number){
    return this.dispatch({type:'host-select-feedback',branchIndex});
  }
  async closeWrong(token:number){return this.dispatch({type:'close-wrong',token});}
  async replay(){return this.dispatch({type:'replay'});}
  holdPlayback(){
    if(this.closed)throw Error('P029_CLOCK_CLOSED');
    ++this.commandRevision;
    if(this.anchor&&this.state.phase==='prequiz'&&this.state.mainFrame===1&&
      this.anchor.domain==='sprite-185'){
      const now=this.clockNow();
      if(now.clock===this.anchor.clock)
        this.prerollDelaySeconds=Math.max(0,Math.min(1/fps,
          1/fps-Math.max(0,now.seconds-this.anchor.seconds)));
    }
    this.anchor=null;return this.owner.pause();
  }
  async resumeMain(){
    if(this.closed)throw Error('P029_CLOCK_CLOSED');
    if(this.state.phase==='prequiz'&&this.state.mainFrame===1&&this.state.playing){
      if(!this.owner.mainPrepared())
        return {accepted:false,reason:'P029_MAIN_PRELOAD_REQUIRED'} as const;
      const revision=++this.commandRevision;
      const current=this.clockNow();
      this.anchor={domain:'sprite-185',epoch:this.state.epoch,frame:1,
        seconds:current.seconds-(1/fps-this.prerollDelaySeconds),clock:current.clock};
      const started=await this.owner.startPreparedMain(this.state.epoch,
        this.prerollDelaySeconds);
      if(revision!==this.commandRevision)
        return {accepted:false,reason:'held-during-prepared-start'} as const;
      if(!started.accepted){this.failure=started.reason;this.anchor=null;}
      else this.failure=null;
      return started;
    }
    const intent=p029AudioIntent(this.state);
    if(!intent)return {accepted:false,reason:'source-domain-not-playing'} as const;
    const revision=++this.commandRevision;
    const started=await this.owner.sync(this.state,'user');
    if(revision!==this.commandRevision)
      return {accepted:false,reason:'held-during-domain-resume'} as const;
    if(started.accepted)this.placeAnchor();
    return started;
  }

  async tick():Promise<P029Transition|null>{
    if(this.closed||!this.anchor)return null;
    const intent=p029AudioIntent(this.state);
    const preroll=!intent&&this.state.phase==='prequiz'&&this.state.playing&&
      this.state.mainFrame===1&&this.anchor.domain==='sprite-185'&&
      this.anchor.epoch===this.state.epoch;
    if(!preroll&&(!intent||intent.domain!==this.anchor.domain||
      intent.epoch!==this.anchor.epoch)){
      this.anchor=null;return null;
    }
    const current=this.clockNow();
    if(current.clock!==this.anchor.clock){
      this.anchor={...this.anchor,seconds:current.seconds,frame:preroll?1:intent!.frame,
        clock:current.clock};return null;
    }
    const frame=Math.max(preroll?1:intent!.frame,this.anchor.frame+
      Math.floor(Math.max(0,current.seconds-this.anchor.seconds)*fps+1e-9));
    const nativeEnded=this.owner.snapshot().nativeEofObserved;
    if(this.state.phase==='prequiz'||this.state.phase==='postquiz'){
      const target=this.state.phase==='prequiz'?Math.min(frame,145):
        Math.min(frame,nativeEnded?234:233);
      if(target<=this.state.mainFrame)return null;
      return this.dispatch({type:'advance-main',frame:target});
    }
    const feedback=this.state.feedback;
    if(this.state.phase!=='feedback-playing'||!feedback)return null;
    const limit=feedback.kind==='wrong'&&!feedback.acknowledged?
      feedback.spec.hold!:feedback.spec.end;
    const target=Math.min(frame,nativeEnded||
      (feedback.kind==='wrong'&&!feedback.acknowledged)?limit:limit-1);
    if(target<=feedback.frame)return null;
    const revision=this.commandRevision;
    const changed=await this.dispatch({type:'advance-feedback',frame:target,
      token:feedback.token});
    if(this.commandRevision!==revision+(changed.retireAudio?1:0))return null;
    // Authored feedback terminal resumes the parent at its next frame.
    if(changed.accepted&&changed.state.phase==='postquiz'&&changed.state.mainFrame===145)
      await this.dispatch({type:'advance-main',frame:146});
    return changed;
  }
  async startSeparateSpanish(){
    if(this.closed)throw Error('P029_CLOCK_CLOSED');
    if(this.state.phase==='prequiz'&&this.state.mainFrame===1&&this.anchor)
      this.holdPlayback();
    const revision=++this.commandRevision;
    const started=await this.owner.startSeparateSpanish('user');
    if(revision!==this.commandRevision)return {accepted:false,reason:'held-during-spanish-start'} as const;
    if(started.accepted)this.anchor=null;
    return started;
  }
  async resumeSeparateSpanish(){
    if(this.closed)throw Error('P029_CLOCK_CLOSED');
    const revision=++this.commandRevision;
    const started=await this.owner.resumeSeparateSpanish();
    if(revision!==this.commandRevision)
      return {accepted:false,reason:'held-during-spanish-resume'} as const;
    if(!started.accepted)this.failure=started.reason;
    else this.failure=null;
    this.anchor=null;
    return started;
  }
  async returnMain(){
    const revision=++this.commandRevision;
    const returned=await this.owner.returnMain(this.state);
    if(revision!==this.commandRevision)return {accepted:false,reason:'held-during-spanish-return'} as const;
    if(returned.accepted)this.anchor=null;
    return returned;
  }
  async close(){if(this.closed)return;this.closed=true;++this.commandRevision;
    this.anchor=null;await this.owner.close();}
}
