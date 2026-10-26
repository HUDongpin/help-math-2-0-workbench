import {P029_SOURCE,P029_FEEDBACK,type P029Kind,type P029State}
 from './quiz-reducer-v1';
import {P029_AUDIO_MANIFEST} from './audio-schedule-v1';
import {P029AudioOwnerCueV3} from './audio-owner-v3';
import {P029DomainClockCueV4} from './domain-clock-v4';
import type {P029FeedbackFrame,P029GlossaryKey}
 from './native-source-v1';

export interface P029CanvasAssetV1 {
  readonly metadata:{readonly animationId:string;readonly sourceSwfSha256:string;
    readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
    readonly sourceRootTimeline:{readonly beginFrame:number};
    readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number};
    readonly audioRendering:string};
  ready():Promise<unknown>;
  render(canvas:HTMLCanvasElement,request:{frame:number;scenario:'source-static-frame';
    lang:'en';seed:0;feedback:P029FeedbackFrame|null}):{
    readonly localFrame:number;readonly frameDomain:string;readonly rootFrame:number;
    readonly scenario:string;readonly lang:string;readonly seed:number;
    readonly audioRendered:boolean};
}

export function p029VisualRequest(state:P029State){
  const feedback=state.feedback;
  const selected:P029FeedbackFrame|null=feedback?{
    spriteId:feedback.spec.characterId,frame:feedback.frame}:null;
  return {frame:state.mainFrame,scenario:'source-static-frame' as const,
    lang:'en' as const,seed:0 as const,feedback:selected};
}

/** Commit one exact main frame plus at most one explicit source feedback frame. */
export function p029PaintVerifiedFrame(asset:P029CanvasAssetV1,
  canvas:HTMLCanvasElement,state:P029State){
  const m=asset.metadata,request=p029VisualRequest(state);
  if(m.animationId!==P029_SOURCE.animationId||
    m.sourceSwfSha256!==P029_SOURCE.swfSha256||
    m.sourceSwfSha256!==P029_AUDIO_MANIFEST.physicalSwf.sha256||
    m.stage.width!==800||m.stage.height!==600||m.fps!==12||
    m.sourceRootTimeline.beginFrame!==6||
    m.deterministicContentTimeline.timelineId!=='sprite-185'||
    m.deterministicContentTimeline.frameCount!==234||
    m.audioRendering!=='not-included')throw Error('P029_CANVAS_ASSET_IDENTITY_MISMATCH');
  if(canvas.width!==800||canvas.height!==600)throw Error('P029_CANVAS_STAGE_MISMATCH');
  if(request.feedback&&request.frame<145)throw Error('P029_FEEDBACK_BEFORE_QUIZ');
  const result=asset.render(canvas,request);
  if(result.localFrame!==request.frame||result.frameDomain!=='sprite-185'||
    result.rootFrame!==6||result.scenario!=='source-static-frame'||
    result.lang!=='en'||result.seed!==0||result.audioRendered!==false||
    canvas.getAttribute('data-flash-frame')!==String(request.frame)||
    canvas.getAttribute('data-flash-frame-domain')!=='sprite-185'||
    canvas.getAttribute('data-flash-root-frame')!=='6'||
    canvas.getAttribute('data-runtime-scenario')!=='source-static-frame'||
    canvas.getAttribute('data-runtime-seed')!=='0')
    throw Error('P029_CANVAS_FRAME_COMMIT_MISMATCH');
  canvas.setAttribute('data-p029-feedback-sprite',request.feedback?
    String(request.feedback.spriteId):'');
  canvas.setAttribute('data-p029-feedback-frame',request.feedback?
    String(request.feedback.frame):'');
  return request;
}

export interface P029VisualSnapshotV1 {
  readonly frame:number;readonly phase:string;readonly lessonPhase:P029State['phase'];
  readonly selectedAudio:'main'|'spanish';readonly audio:Readonly<{phase:string}>;
  readonly spanish:Readonly<{phase:string}>;readonly returning:boolean;
  readonly state:P029State;readonly ready:boolean;readonly committed:boolean;
  readonly feedback:P029FeedbackFrame|null;readonly failure:string|null;
  readonly sourceAlignment:'unresolved';readonly originalRuntimeAccepted:false;
  readonly audioAccepted:false;readonly lessonCompleted:false;
}

export interface P029VisualSessionOptions {
  readonly asset:P029CanvasAssetV1;readonly canvas:HTMLCanvasElement;
  readonly owner:P029AudioOwnerCueV3;readonly clock:P029DomainClockCueV4;
  readonly chooseFeedback:(kind:P029Kind,variants:readonly number[])=>number;
  readonly onSnapshot?:(snapshot:P029VisualSnapshotV1)=>void;
  readonly onOpenGlossary?:(key:P029GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** One visual/audio owner. All quiz and audio transitions stay in the frozen
 * reducer and P029 owner; this class only commits their current visual state. */
export class P029ProductSessionV2 {
  private ready=false;
  private closed=false;
  private generation=0;
  private committedKey:string|null=null;
  private failure:string|null=null;
  private returning=false;
  private glossaryTrigger:HTMLButtonElement|null=null;
  private glossaryOpen=false;
  private commandRevision=0;
  constructor(private readonly options:P029VisualSessionOptions){}

  snapshot():P029VisualSnapshotV1{
    const value=this.options.clock.snapshot(),audio=value.audio;
    const feedback=p029VisualRequest(value.state).feedback;
    const spanish=audio.spanishSelected;
    const key=this.key(value.state),canvas=this.options.canvas;
    const committed=this.committedKey===key&&
      canvas.getAttribute('data-flash-frame')===String(value.state.mainFrame)&&
      canvas.getAttribute('data-flash-frame-domain')==='sprite-185'&&
      canvas.getAttribute('data-flash-root-frame')==='6'&&
      canvas.getAttribute('data-runtime-scenario')==='source-static-frame'&&
      canvas.getAttribute('data-runtime-seed')==='0'&&
      canvas.getAttribute('data-p029-feedback-sprite')===
        (feedback?String(feedback.spriteId):'')&&
      canvas.getAttribute('data-p029-feedback-frame')===
        (feedback?String(feedback.frame):'');
    return {frame:value.state.mainFrame,
      phase:spanish?'idle':audio.phase,lessonPhase:value.state.phase,
      selectedAudio:spanish?'spanish':'main',
      audio:{phase:spanish?'idle':audio.phase},
      spanish:{phase:spanish?audio.phase:'idle'},returning:this.returning,
      state:value.state,ready:this.ready,committed,
      feedback,failure:this.failure??value.failure,
      sourceAlignment:'unresolved',originalRuntimeAccepted:false,
      audioAccepted:false,lessonCompleted:false};
  }
  private key(state:P029State){
    const feedback=state.feedback;
    return `${state.epoch}:${state.mainFrame}:${feedback?.spec.characterId??0}:${feedback?.frame??0}`;
  }
  private commit(){
    if(!this.ready||this.closed)return false;
    const state=this.options.clock.snapshot().state,key=this.key(state);
    if(this.committedKey===key)return true;
    try{p029PaintVerifiedFrame(this.options.asset,this.options.canvas,state);
      this.committedKey=key;return true;
    }catch(error){this.committedKey=null;
      this.failure=error instanceof Error?error.message:String(error);
      this.options.clock.holdPlayback();return false;}
  }
  private publish(){
    if(this.closed)return false;
    const state=this.options.clock.snapshot().state;
    // A throttled tick may jump from frame-1 preroll straight to the quiz
    // stop, where the reducer had no prior intent to retire the prepared main.
    if(['question','feedback-pending','feedback-held'].includes(state.phase)){
      const audio=this.options.owner.snapshot();
      if(audio.selected!==null&&!audio.spanishSelected)
        this.options.owner.hold('visual-source-hold');
    }
    const committed=this.commit();
    this.options.onSnapshot?.(this.snapshot());
    return committed;
  }
  async initialize(){
    if(this.closed)return false;
    const generation=this.generation;
    try{
      await this.options.asset.ready();
      if(this.closed||generation!==this.generation)return false;
      this.ready=true;
      if(!this.publish())return false;
      const prepared=await this.options.clock.prepare();
      if(this.closed||generation!==this.generation)return false;
      if(!prepared.accepted)this.failure=prepared.reason;
      this.publish();
      return prepared.accepted;
    }catch(error){
      if(this.closed||generation!==this.generation)return false;
      this.failure=error instanceof Error?error.message:String(error);
      this.publish();return false;
    }
  }
  canPlay(){
    if(this.closed||!this.ready||this.failure||this.glossaryOpen||this.returning)
      return false;
    const audio=this.options.owner.snapshot();
    if(audio.spanishSelected)
      return ['paused','interrupted','play-rejected'].includes(audio.phase);
    const state=this.options.clock.snapshot().state;
    if(state.phase==='prequiz'&&state.mainFrame===1)
      return this.options.owner.mainPrepared();
    return state.phase==='feedback-playing'||
      ((state.phase==='prequiz'||state.phase==='postquiz')&&state.playing);
  }
  async play(){
    if(!this.canPlay())return false;
    const generation=this.generation,revision=++this.commandRevision;
    const state=this.options.clock.snapshot().state;
    // clock.play() reaches the prepared AudioContext in this user call stack.
    const pending=this.options.owner.snapshot().spanishSelected?
      this.options.clock.resumeSeparateSpanish():
      state.playing||state.phase==='feedback-playing'?
      this.options.clock.resumeMain():this.options.clock.play();
    this.publish();
    const result=await pending;
    if(this.closed||generation!==this.generation||revision!==this.commandRevision)
      return false;
    if(!result.accepted)this.failure='reason' in result?result.reason:'P029_PLAY_REJECTED';
    this.publish();return result.accepted&&!this.failure;
  }
  pause(){
    if(this.closed)return false;
    ++this.commandRevision;
    const result=this.options.clock.holdPlayback();
    this.publish();return result.accepted;
  }
  async tick(){
    if(this.closed||!this.ready||this.glossaryOpen)return false;
    // Poll the independent native SA phase through EOF without advancing the
    // main reducer or creating a new visual clock anchor.
    if(this.options.owner.snapshot().spanishSelected)return this.publish();
    const generation=this.generation;
    await this.options.clock.tick();
    if(this.closed||generation!==this.generation)return false;
    return this.publish();
  }
  async input(text:string){
    if(this.closed||!this.ready||!this.snapshot().committed||this.returning||
      this.options.owner.snapshot().spanishSelected)return false;
    const changed=await this.options.clock.dispatch({type:'input',text});
    this.publish();return changed.accepted;
  }
  async submit(text:string){
    if(this.closed||!this.ready||!this.snapshot().committed||this.returning||
      this.options.owner.snapshot().spanishSelected||
      this.options.clock.snapshot().state.phase!=='question')return false;
    const generation=this.generation,epoch=this.options.clock.snapshot().state.epoch;
    if(text!==this.options.clock.snapshot().state.entryText)
      await this.options.clock.dispatch({type:'input',text});
    if(this.closed||generation!==this.generation||
      this.options.clock.snapshot().state.epoch!==epoch)return false;
    const submitted=await this.options.clock.dispatch({type:'submit'});
    if(!submitted.accepted||this.closed||generation!==this.generation)return false;
    this.publish();
    const pending=this.options.clock.snapshot().state.pendingHostCall;
    if(!pending)return false;
    const kind:P029Kind=pending.includes('Right')?'right':'wrong';
    const variants=Object.keys(P029_FEEDBACK[kind]).map(Number);
    let branch:number;
    try{branch=this.options.chooseFeedback(kind,variants);}catch(error){
      this.failure=error instanceof Error?error.message:String(error);
      this.publish();return false;}
    if(!Number.isSafeInteger(branch)||!variants.includes(branch)){
      this.failure='P029_HOST_FEEDBACK_SELECTION_REQUIRED';
      this.publish();return false;
    }
    const selected=await this.options.clock.hostSelectFeedback(branch);
    if(this.closed||generation!==this.generation)return false;
    this.publish();return selected.accepted&&!this.snapshot().failure;
  }
  async closeWrong(spriteId:52|67|98){
    if(this.closed||!this.snapshot().committed||this.returning||
      this.options.owner.snapshot().spanishSelected)return false;
    const state=this.options.clock.snapshot().state,feedback=state.feedback;
    if(state.phase!=='feedback-held'||!feedback||
      feedback.spec.characterId!==spriteId)return false;
    const generation=this.generation;
    const result=await this.options.clock.closeWrong(feedback.token);
    if(this.closed||generation!==this.generation)return false;
    this.publish();return result.accepted&&!this.snapshot().failure;
  }
  openGlossary(key:P029GlossaryKey,trigger:HTMLButtonElement){
    const snapshot=this.snapshot();
    if(this.closed||this.returning||snapshot.selectedAudio==='spanish'||
      !snapshot.committed||snapshot.feedback||
      snapshot.frame<6||this.glossaryOpen||!this.options.onOpenGlossary)return false;
    if(!this.pause())return false;
    this.glossaryOpen=true;this.glossaryTrigger=trigger;
    try{this.options.onOpenGlossary(key,trigger);}catch(error){
      this.glossaryOpen=false;this.glossaryTrigger=null;
      this.failure=error instanceof Error?error.message:String(error);
      this.publish();return false;}
    this.publish();return true;
  }
  closeGlossary(){
    this.glossaryOpen=false;
    const trigger=this.glossaryTrigger;this.glossaryTrigger=null;
    if(trigger?.isConnected)trigger.focus();
    this.publish();
  }
  async replay(){
    if(this.closed||!this.ready)return false;
    ++this.commandRevision;
    const generation=++this.generation;
    this.glossaryOpen=false;this.glossaryTrigger=null;this.failure=null;
    this.returning=false;
    const reset=await this.options.clock.replay();
    if(this.closed||generation!==this.generation)return false;
    this.publish();
    const prepared=await this.options.clock.prepare();
    if(this.closed||generation!==this.generation)return false;
    if(!prepared.accepted)this.failure=prepared.reason;
    this.publish();return reset.accepted&&prepared.accepted;
  }
  async startSeparateSpanish(){
    if(this.closed||!this.ready||this.glossaryOpen||
      this.options.owner.snapshot().spanishSelected)return false;
    const generation=this.generation,revision=++this.commandRevision;
    const pending=this.options.clock.startSeparateSpanish();
    this.publish();
    const started=await pending;
    if(this.closed||generation!==this.generation||revision!==this.commandRevision)
      return false;
    if(!started.accepted)this.failure=started.reason;
    this.publish();return started.accepted;
  }
  async returnMain(){
    if(this.closed||!this.options.owner.snapshot().spanishSelected)return false;
    ++this.commandRevision;
    const generation=this.generation;
    this.returning=true;this.publish();
    const returned=await this.options.clock.returnMain();
    if(this.closed||generation!==this.generation)return false;
    if(returned.accepted){
      const state=this.options.clock.snapshot().state;
      if(state.phase==='prequiz'&&state.mainFrame===1){
        const prepared=await this.options.clock.prepare();
        if(!prepared.accepted)this.failure=prepared.reason;
      }
    }else this.failure=returned.reason;
    if(this.closed||generation!==this.generation)return false;
    this.returning=false;this.publish();return returned.accepted&&!this.failure;
  }
  setVolume(value:number){return this.options.owner.setVolume(value);}
  async close(){
    if(this.closed)return;
    this.closed=true;this.generation++;this.commandRevision++;this.glossaryTrigger=null;
    this.glossaryOpen=false;this.committedKey=null;
    await this.options.clock.close();
  }
}
