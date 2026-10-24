import {P043AudioOwnerV1, type P043AudioId, type P043AudioSnapshot}
  from './alg-l06-p043-audio-owner-v1';
import {P043_SOURCE, initialP043State, reduceP043,
  type P043Choice, type P043Event, type P043State,
  type P043Transition} from './alg-l06-p043-state-v1';

const FPS=12;
type Loader=(signal:AbortSignal)=>Promise<ArrayBuffer>;
type FeedbackAudioId=Extract<P043AudioId,'wrong4'|'right4'>;
type Clock={owner:Exclude<P043AudioId,'sa'>;frame:number;time:number;
  epoch:number;session:number};

export interface P043RuntimeSnapshot {
  readonly state:P043State;
  readonly audio:P043AudioSnapshot;
  readonly ready:boolean;
  readonly visualClockRunning:boolean;
  readonly error:string|null;
  readonly session:number;
  readonly sourceClockAlignment:'unverified';
  readonly lessonCompleted:false;
}
export interface P043RuntimeOptionsV1 {
  paint:(state:P043State)=>boolean;
  loadMain:Loader;
  loadFeedback:(id:FeedbackAudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:Loader;
  onGlossary?:(term:string)=>void;
  onCleanup?:()=>void;
  onSnapshot?:(snapshot:P043RuntimeSnapshot)=>void;
  audio?:P043AudioOwnerV1;
}

/** Source-state runtime with an engineering 12 fps observer. Browser decoded
 * PCM is pinned; source frame/sample alignment remains unverified. */
export class P043PageRuntimeV1 {
  private state=initialP043State();
  private readonly audio:P043AudioOwnerV1;
  private clock:Clock|null=null;
  private ready=false;
  private error:string|null=null;
  private session=1;
  private closed=false;

  constructor(private readonly options:P043RuntimeOptionsV1){
    this.audio=options.audio??new P043AudioOwnerV1(()=>this.state.epoch);
  }
  snapshot():P043RuntimeSnapshot{
    return {state:this.state,audio:this.audio.snapshot(),ready:this.ready,
      visualClockRunning:this.clock!==null,
      error:this.error,session:this.session,sourceClockAlignment:'unverified',
      lessonCompleted:false};
  }
  private publish(){if(!this.closed)this.options.onSnapshot?.(this.snapshot());}
  private current(session:number,epoch:number){
    return !this.closed&&session===this.session&&epoch===this.state.epoch;
  }
  private apply(event:P043Event):P043Transition|null{
    const transition=reduceP043(this.state,event);
    if(!transition.accepted)return null;
    this.state=transition.state;
    if(!this.audio.syncStateEpoch(this.state.epoch)){
      this.error='P043_AUDIO_STATE_EPOCH_MISMATCH';return null;
    }
    if(transition.effects.some(effect=>effect.type==='audio:cancelAll'))
      this.audio.cancelCurrent(this.state.epoch);
    if(!this.options.paint(this.state)){
      this.error='P043_FRAME_COMMIT_FAILED';
      this.audio.cancelCurrent(this.state.epoch);this.clock=null;
      this.publish();return null;
    }
    for(const effect of transition.effects){
      if(effect.type==='host:DoHyperLinks')this.options.onGlossary?.(String(effect.keyAttribute));
      if(effect.type==='host:cleanup')this.options.onCleanup?.();
    }
    this.publish();return transition;
  }
  private anchor(owner:Exclude<P043AudioId,'sa'>,frame:number){
    const selected=this.audio.snapshot().selected;
    const time=selected?.playbackAnchor?.contextTime;
    if(!Number.isFinite(time))return false;
    this.clock={owner,frame,time:time!,epoch:this.state.epoch,session:this.session};
    return true;
  }
  private failStart(reason:string){
    this.error=reason;this.clock=null;this.audio.pause();this.publish();return false;
  }
  async start(){
    if(this.closed||this.ready)return false;
    const session=this.session,epoch=this.state.epoch;
    if(!this.options.paint(this.state))return false;
    this.publish();
    try{
      const prepared=await this.audio.select('main',epoch,this.options.loadMain);
      if(!this.current(session,epoch))return false;
      if(!prepared.accepted)return this.failStart(prepared.reason);
      this.ready=true;this.error=null;this.publish();return true;
    }catch(error){
      if(this.current(session,epoch))return this.failStart(String(error));
      return false;
    }
  }
  /** An explicit Play recovers a browser rejected automatic start, too. */
  async play(){
    if(!this.ready||this.closed||this.audio.snapshot().owner==='sa')return false;
    let id:Exclude<P043AudioId,'sa'>;
    let frame:number;
    if(this.state.phase==='prequiz'){
      // A glossary return holds the visual source at an unknown audio cursor.
      if(!this.state.mainPlaying&&this.state.mainFrame!==1)return false;
      if(!this.state.mainPlaying&&!this.apply({type:'start-main',epoch:this.state.epoch}))return false;
      id='main';frame=this.state.mainFrame;
    }else if(this.state.phase==='postquiz'&&this.state.mainPlaying){
      id='main';frame=this.state.mainFrame;
    }else if(this.state.feedback&&
      ['wrong-feedback-playing','wrong-feedback-tail','right-feedback-playing']
        .includes(this.state.phase)){
      id=this.state.feedback.kind==='wrong'?'wrong4':'right4';
      frame=this.state.feedback.frame;
    }else return false;
    const session=this.session,epoch=this.state.epoch;
    const started=await this.audio.activatePrepared(id,epoch,'user');
    if(!this.current(session,epoch))return false;
    if(!started.accepted||!this.anchor(id,frame))
      return this.failStart(started.reason);
    this.error=null;this.publish();return true;
  }
  pause(){
    if(this.closed)return false;
    this.tick();
    const playing=['playing','start-pending'].includes(
      this.audio.snapshot().selected?.phase??'');
    const clock=!!this.clock;
    this.audio.pause();this.clock=null;
    if(playing||clock)this.publish();
    return playing||clock;
  }
  /** Call with the audio-context clock; never convert SWF seekSamples here. */
  tick():P043RuntimeSnapshot{
    const clock=this.clock;
    if(!clock||!this.current(clock.session,clock.epoch)||
      this.audio.snapshot().owner!==clock.owner)return this.snapshot();
    const selected=this.audio.snapshot().selected;
    if(selected?.contextTime===null||selected?.contextTime===undefined)return this.snapshot();
    const elapsed=Math.max(0,selected.contextTime-clock.time);
    const frame=clock.frame+Math.floor(elapsed*FPS+1e-9);
    if(clock.owner==='main'){
      if(!this.state.mainPlaying)return this.snapshot();
      const target=Math.min(this.state.phase==='prequiz'?P043_SOURCE.quizFrame:
        P043_SOURCE.lastFrame,frame);
      if(target>this.state.mainFrame){
        this.apply({type:'advance-main',epoch:clock.epoch,frame:target});
        if(!this.state.mainPlaying){this.clock=null;this.publish();}
      }
    }else{
      const feedback=this.state.feedback;
      if(!feedback||feedback.kind!==(clock.owner==='wrong4'?'wrong':'right'))
        return this.snapshot();
      const terminal=feedback.kind==='wrong'?
        (this.state.phase==='wrong-feedback-playing'?P043_SOURCE.wrongHoldFrame:
          P043_SOURCE.wrongTerminalFrame):P043_SOURCE.rightTerminalFrame;
      const target=Math.min(terminal,frame);
      if(target>feedback.frame){
        const token=feedback.token;
        this.apply({type:'advance-feedback',epoch:clock.epoch,token,frame:target});
        if(this.state.phase==='wrong-feedback-held'){
          this.clock=null;this.publish();
        }
        if(!this.state.feedback){
          this.clock=null;this.publish();
          if(this.state.phase==='postquiz')void this.resumeMainAfterFeedback(clock.epoch);
        }
      }
    }
    return this.snapshot();
  }
  private async resumeMainAfterFeedback(epoch:number){
    const session=this.session,owner=this.state.audioOwner;
    const started=await this.audio.activatePrepared('main',epoch,'automatic');
    if(!this.current(session,epoch))return;
    if(this.state.phase!=='postquiz'||!this.state.mainPlaying||
      this.state.audioOwner!==owner||this.audio.snapshot().owner!=='main')return;
    if(!started.accepted||!this.anchor('main',this.state.mainFrame))
      this.failStart(started.reason);
    else {this.error=null;this.publish();}
  }
  async choose(choice:P043Choice,quizGeneration=this.state.quizGeneration){
    if(this.closed||!this.ready||this.audio.snapshot().owner==='sa')return false;
    this.tick();
    const transition=this.apply({type:'choose',epoch:this.state.epoch,quizGeneration,choice});
    if(!transition||!this.state.feedback)return false;
    this.clock=null;this.publish();
    const feedback=this.state.feedback;
    const id:FeedbackAudioId=feedback.kind==='wrong'?'wrong4':'right4';
    const session=this.session,epoch=this.state.epoch;
    try{
      const started=await this.audio.select(id,epoch,
        signal=>this.options.loadFeedback(id,signal),true);
      if(!this.current(session,epoch)||this.state.feedback?.token!==feedback.token){
        this.audio.pause();return false;
      }
      if(!started.accepted||!this.anchor(id,feedback.frame))
        return this.failStart(started.reason);
      this.error=null;this.publish();return true;
    }catch(error){
      if(this.current(session,epoch)&&this.state.feedback?.token===feedback.token)
        return this.failStart(String(error));
      return false;
    }
  }
  openNmh(quizGeneration=this.state.quizGeneration){
    if(this.closed||this.audio.snapshot().owner==='sa')return false;
    this.tick();return !!this.apply({type:'open-nmh',epoch:this.state.epoch,quizGeneration});
  }
  closeNmh(quizGeneration=this.state.quizGeneration){
    if(this.closed||this.audio.snapshot().owner==='sa')return false;
    return !!this.apply({type:'close-nmh',epoch:this.state.epoch,quizGeneration});
  }
  glossary(buttonId:number,quizGeneration=this.state.quizGeneration){
    if(this.closed||this.audio.snapshot().owner==='sa')return false;
    this.tick();
    const accepted=!!this.apply({type:'glossary',epoch:this.state.epoch,
      quizGeneration,buttonId});
    if(accepted){this.clock=null;this.publish();}
    return accepted;
  }
  closeGlossary(quizGeneration=this.state.quizGeneration){
    if(this.closed)return false;
    return !!this.apply({type:'close-glossary',epoch:this.state.epoch,
      quizGeneration});
  }
  async closeWrong(token:string){
    if(this.closed||this.audio.snapshot().owner==='sa'||
      !this.apply({type:'close-wrong',epoch:this.state.epoch,token}))return false;
    const feedback=this.state.feedback;
    if(!feedback)return false;
    const session=this.session,epoch=this.state.epoch;
    const started=await this.audio.activatePrepared('wrong4',epoch,'user');
    if(!this.current(session,epoch)||this.state.feedback?.token!==token)return false;
    if(!started.accepted||!this.anchor('wrong4',feedback.frame))
      return this.failStart(started.reason);
    this.error=null;this.publish();return true;
  }
  /** SA is an independent, explicit user-triggered stream. Locale never calls
   * this method, and Return leaves the embedded source held. */
  async startSpanish(){
    if(!this.ready||this.closed||this.state.phase==='host-glossary'||
      this.state.phase==='left')return false;
    if(this.audio.snapshot().owner==='sa'){
      const result=await this.audio.play(this.state.epoch,'user');
      if(!result.accepted)this.error=result.reason;
      this.publish();return result.accepted;
    }
    this.pause();
    const session=this.session,epoch=this.state.epoch;
    try{
      const prepared=await this.audio.select('sa',epoch,this.options.loadSpanish);
      if(!this.current(session,epoch)||!prepared.accepted)return false;
      const started=await this.audio.play(epoch,'user');
      if(!this.current(session,epoch))return false;
      if(!started.accepted)this.error=started.reason;
      this.publish();return started.accepted;
    }catch(error){
      if(this.current(session,epoch)){this.error=String(error);this.publish();}
      return false;
    }
  }
  returnMain(){
    if(this.closed)return false;
    const returned=this.audio.returnFromSpanish(this.state.epoch);
    if(returned){this.clock=null;this.publish();}
    return returned;
  }
  replay(){
    if(this.closed||!this.apply({type:'replay',epoch:this.state.epoch}))return false;
    this.clock=null;this.audio.replay(this.state.epoch);
    this.error=null;this.publish();return true;
  }
  setVolume(value:number){return this.audio.setVolume(value);}
  async close(){
    if(this.closed)return;
    this.apply({type:'leave',epoch:this.state.epoch});
    this.closed=true;this.session++;this.clock=null;
    await this.audio.close();
  }
}
