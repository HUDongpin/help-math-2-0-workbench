import {P041AudioOwnerV1,type P041AudioId,type P041AudioSnapshot}
  from './alg-l06-p041-audio-owner-v1';
import {P041_FEEDBACK,p041InitialState,p041Reduce,p041SourceDomainDraw,
  type P041Draw,type P041Event,type P041State} from './alg-l06-p041-state-v1';

const FPS=12;
type Loader=(signal:AbortSignal)=>Promise<ArrayBuffer>;
export type P041RuntimeSnapshot={state:P041State;audio:P041AudioSnapshot;
  ready:boolean;error:string|null;session:number;sourceClockAlignment:'unverified';
  lessonCompleted:false};
type Clock={owner:P041AudioId;frame:number;time:number;epoch:number;session:number};
export interface P041RuntimeOptionsV1{
  paint:(state:P041State)=>boolean;
  loadMain:Loader;
  loadFeedback:(id:Exclude<P041AudioId,'main'|'sa'>,signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:Loader;
  draw?:P041Draw;
  onSnapshot?:(snapshot:P041RuntimeSnapshot)=>void;
  audio?:P041AudioOwnerV1;
}

/** Page-owned engineering clock. Source frames are deterministic; browser
 * decoded cursors are never converted from SWF seekSamples. */
export class P041PageRuntimeV1{
  private state=p041InitialState();
  private readonly audio:P041AudioOwnerV1;
  private readonly draw:P041Draw;
  private clock:Clock|null=null;
  private ready=false;
  private error:string|null=null;
  private session=1;
  private closed=false;

  constructor(private readonly options:P041RuntimeOptionsV1){
    this.audio=options.audio??new P041AudioOwnerV1(()=>this.state.epoch);
    this.draw=options.draw??((max,kind)=>p041SourceDomainDraw(max,Math.random));
  }
  snapshot():P041RuntimeSnapshot{
    return {state:this.state,audio:this.audio.snapshot(),ready:this.ready,
      error:this.error,session:this.session,sourceClockAlignment:'unverified',
      lessonCompleted:false};
  }
  private publish(){if(!this.closed)this.options.onSnapshot?.(this.snapshot());}
  private current(session:number,epoch:number){
    return !this.closed&&session===this.session&&epoch===this.state.epoch;
  }
  private apply(event:P041Event){
    const transition=p041Reduce(this.state,event,this.draw);
    if(!transition.accepted)return false;
    this.state=transition.state;
    if(!this.audio.syncStateEpoch(this.state.epoch)){
      this.error='P041_AUDIO_STATE_EPOCH_MISMATCH';return false;
    }
    if(!this.options.paint(this.state)){
      this.error='P041_FRAME_COMMIT_FAILED';this.audio.pause();return false;
    }
    this.publish();return true;
  }
  private anchor(owner:P041AudioId,frame:number,lead=0){
    const selected=this.audio.snapshot().selected;
    const time=selected?.playbackAnchor?.contextTime;
    if(!Number.isFinite(time))return false;
    this.clock={owner,frame,time:time!-lead,epoch:this.state.epoch,session:this.session};
    return true;
  }
  async start(){
    if(this.closed||this.ready)return false;
    const session=this.session,epoch=this.state.epoch;
    if(!this.options.paint(this.state))return false;
    this.publish();
    try{
      const result=await this.audio.select('main',epoch,this.options.loadMain);
      if(!this.current(session,epoch))return false;
      if(!result.accepted){this.error=result.reason;this.publish();return false;}
      this.ready=true;this.publish();return true;
    }catch(error){
      if(this.current(session,epoch)){this.error=String(error);this.publish();}
      return false;
    }
  }
  async play(){
    if(!this.ready||this.closed||this.audio.snapshot().owner==='sa')return false;
    const selected=this.state.feedback?.spriteId;
    if(!this.apply({type:'play'}))return false;
    const session=this.session,epoch=this.state.epoch,owner=selected?String(selected) as P041AudioId:'main';
    const audio=await this.audio.activatePrepared(owner,epoch,'user');
    if(!this.current(session,epoch))return false;
    if(!audio.accepted||!this.anchor(owner,selected?this.state.feedback!.frame:this.state.mainFrame,
      owner==='main'&&this.state.mainFrame===1?1/FPS:0)){
      this.apply({type:'pause'});this.error=audio.reason;this.publish();return false;
    }
    return true;
  }
  pause(){
    if(this.closed)return false;
    this.tick();
    const wasPlaying=['playing','start-pending'].includes(
      this.audio.snapshot().selected?.phase??'');
    const accepted=this.apply({type:'pause'});
    this.audio.pause();this.clock=null;
    // SA has no visual play state. Its transport change still has to reach
    // the My Lesson host and the optional in-page controls.
    if(wasPlaying)this.publish();
    return accepted||wasPlaying;
  }
  /** Only this method advances the visual source frame. The callback carries
   * both the mount session and reducer epoch captured by its clock anchor. */
  tick(){
    const clock=this.clock;
    if(!clock||!this.current(clock.session,clock.epoch)||
      this.audio.snapshot().owner!==clock.owner)return this.snapshot();
    const audio=this.audio.snapshot().selected;
    if(audio?.contextTime===null||audio?.contextTime===undefined)return this.snapshot();
    const elapsed=Math.max(0,audio.contextTime-clock.time);
    const frame=clock.frame+Math.floor(elapsed*FPS+1e-9);
    if(clock.owner==='main'){
      if(!this.state.mainTimelinePlaying)return this.snapshot();
      const target=Math.min(this.state.phase==='prequiz'?752:869,frame);
      if(target>this.state.mainFrame){
        this.apply({type:'advance-main',frame:target,epoch:clock.epoch});
        if(!this.state.mainTimelinePlaying){this.audio.pause();this.clock=null;}
      }
    }else if(clock.owner!=='sa'){
      const feedback=this.state.feedback;
      if(!feedback||!feedback.playing)return this.snapshot();
      const terminal=P041_FEEDBACK[feedback.spriteId].terminal;
      const target=Math.min(terminal,frame);
      if(target>feedback.frame){
        this.apply({type:'advance-feedback',frame:target,
          generation:feedback.generation,epoch:clock.epoch});
        if(this.state.phase==='wrong-feedback-held'){
          this.audio.pause();this.clock=null;
        }else if(!this.state.feedback){
          this.audio.pause();this.clock=null;
          if(this.state.phase==='postquiz-resume')void this.resumeMainAfterFeedback(clock.epoch);
        }
      }
    }
    return this.snapshot();
  }
  private async resumeMainAfterFeedback(epoch:number){
    const session=this.session;
    const result=await this.audio.activatePrepared('main',epoch,'automatic');
    if(!this.current(session,epoch)||this.state.phase!=='postquiz-resume')return;
    if(!result.accepted||!this.anchor('main',752)){
      this.apply({type:'pause'});this.error=result.reason;this.publish();
    }
  }
  async choose(answer:1|2|3|4){
    if(this.closed||this.audio.snapshot().owner==='sa')return false;
    this.tick();
    if(!this.apply({type:'choose',answer}))return false;
    if(!this.apply({type:'resolve-host-feedback'}))return false;
    const chosen=this.state.feedback;
    if(!chosen)return false;
    const session=this.session,epoch=this.state.epoch,id=String(chosen.spriteId) as P041AudioId;
    this.clock=null;
    try{
      const result=await this.audio.select(id,epoch,
        signal=>this.options.loadFeedback(id as Exclude<P041AudioId,'main'|'sa'>,signal),true);
      if(!this.current(session,epoch)||this.state.feedback?.spriteId!==chosen.spriteId)return false;
      if(!result.accepted||!this.anchor(id,chosen.frame)){
        this.apply({type:'pause'});this.error=result.reason;this.publish();return false;
      }
      return true;
    }catch(error){
      if(this.current(session,epoch)){this.apply({type:'pause'});this.error=String(error);this.publish();}
      return false;
    }
  }
  async closeWrong(generation:number){
    if(this.closed||!this.apply({type:'close-wrong',generation}))return false;
    const feedback=this.state.feedback;
    if(!feedback)return false;
    const session=this.session,epoch=this.state.epoch,id=String(feedback.spriteId) as P041AudioId;
    const result=await this.audio.activatePrepared(id,epoch,'user');
    if(!this.current(session,epoch))return false;
    if(!result.accepted||!this.anchor(id,feedback.frame)){
      this.apply({type:'pause'});this.error=result.reason;this.publish();return false;
    }
    return true;
  }
  async startSpanish(){
    if(!this.ready||this.closed)return false;
    if(this.audio.snapshot().owner==='sa'){
      const result=await this.audio.play(this.state.epoch,'user');
      this.publish();return result.accepted;
    }
    this.pause();
    const session=this.session,epoch=this.state.epoch;
    try{
      const prepared=await this.audio.select('sa',epoch,this.options.loadSpanish);
      if(!this.current(session,epoch)||!prepared.accepted)return false;
      const played=await this.audio.play(epoch,'user');
      if(!this.current(session,epoch))return false;
      this.publish();return played.accepted;
    }catch(error){if(this.current(session,epoch)){this.error=String(error);this.publish();}return false;}
  }
  returnMain(){
    if(this.closed)return false;
    const held=this.audio.returnFromSpanish(this.state.epoch);
    if(held){this.clock=null;this.publish();}
    return held;
  }
  replay(){
    if(this.closed||!this.apply({type:'replay'}))return false;
    this.clock=null;this.audio.replay(this.state.epoch);
    this.error=null;this.publish();return true;
  }
  setVolume(value:number){return this.audio.setVolume(value);}
  async close(){
    if(this.closed)return;
    this.apply({type:'leave'});
    this.closed=true;this.session++;this.clock=null;
    await this.audio.close();
  }
}
