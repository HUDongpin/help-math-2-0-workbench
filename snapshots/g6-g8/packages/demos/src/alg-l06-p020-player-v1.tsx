import React, {useEffect,useRef,useState} from 'react';
import {flushSync,createPortal} from 'react-dom';
import {AlgL06P020ClockV1} from './alg-l06-p020-clock-v1';
import {P020AudioOwnerV1} from './alg-l06-p020-audio-owner-v1';
import {P020OptionalSpanishAudio} from './alg-l06-p020-optional-spanish-audio-v1';
import {P020NativeTextV1, type P020NativeQuizSnapshotV1} from './alg-l06-p020-native-text-v1';
import {P020_AUDIO_ASSETS,type P020AudioId} from './alg-l06-p020-audio-schedule-v1';
import {P020_TIMELINE,type P020GlossaryKey} from './alg-l06-p020-timeline-v1';
import type {P020FeedbackKind,P020QuizSnapshot} from './alg-l06-p020-state-v1';

export interface P020CanvasAssetV1 {
  readonly metadata:{
    readonly animationId:string;readonly sourceSwfSha256:string;
    readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
    readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number};
  };
  ready():Promise<unknown>;
  render(canvas:HTMLCanvasElement,request:{frame:number;scenario:'source-static-frame';
    lang:'en';seed:0;feedback?:{domain:string;frame:number}}):{
      readonly localFrame:number;readonly frameDomain:string;readonly rootFrame:number;
      readonly feedbackDomain:string|null;readonly feedbackFrame:number|null;
    };
}
export type P020PlayerSnapshotV1=ReturnType<P020AudioOwnerV1['snapshot']>;
export interface P020PlayerControlsV1 {
  setPaused(paused:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
  closeGlossary():void;
}
export interface P020PlayerPropsV1 {
  asset:P020CanvasAssetV1;
  loadAudio:(id:P020AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanishAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  createContext?:()=>AudioContext;
  createSpanishContext?:()=>AudioContext;
  chooseFeedbackBranch?:(kind:P020FeedbackKind,tryCount:number)=>number;
  language?:'en'|'es';reducedMotion?:boolean;volume?:number;
  onSnapshot?:(snapshot:P020PlayerSnapshotV1)=>void;
  connectControls?:(controls:P020PlayerControlsV1)=>void|(()=>void);
  hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onOpenGlossary:(key:P020GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** Conditional indexMI selector modeled as a modern injected choice. The
 * exact old-host launch remains unobserved; tests can supply all seven cases. */
export function p020ChooseFeedbackBranch(kind:P020FeedbackKind,tryCount:number,
  chooser?:(kind:P020FeedbackKind,tryCount:number)=>number):number{
  if(!Number.isInteger(tryCount)||tryCount<0||tryCount>1)throw Error('P020_INVALID_TRY_COUNT');
  const limit=kind==='right'?4:kind==='wrong'?3:0;
  if(!limit)throw Error('P020_INVALID_FEEDBACK_KIND');
  const selected=chooser?.(kind,tryCount)??(1+Math.floor(Math.random()*limit));
  if(!Number.isInteger(selected)||selected<1||selected>limit)throw Error('P020_INVALID_FEEDBACK_BRANCH');
  return selected;
}

export function p020PaintVerifiedFrame(asset:P020CanvasAssetV1,canvas:HTMLCanvasElement,
  quiz:P020QuizSnapshot):void{
  const m=asset.metadata;
  if(m.animationId!==P020_TIMELINE.animationId||
    m.sourceSwfSha256!==P020_TIMELINE.sourceSwfSha256||
    m.stage.width!==800||m.stage.height!==600||m.fps!==12||
    m.deterministicContentTimeline.timelineId!=='sprite-162'||
    m.deterministicContentTimeline.frameCount!==172)
    throw Error('P020_CANVAS_ASSET_IDENTITY_MISMATCH');
  const feedback=quiz.feedbackDomain&&quiz.feedbackFrame!==null
    ?{domain:quiz.feedbackDomain,frame:quiz.feedbackFrame}:undefined;
  if(feedback&&quiz.mainFrame!==58)throw Error('P020_FEEDBACK_PARENT_NOT_HELD');
  const rendered=asset.render(canvas,{frame:quiz.mainFrame,
    scenario:'source-static-frame',lang:'en',seed:0,...(feedback?{feedback}:{})});
  if(rendered.localFrame!==quiz.mainFrame||rendered.frameDomain!=='sprite-162'||
    rendered.rootFrame!==6||rendered.feedbackDomain!==(feedback?.domain??null)||
    rendered.feedbackFrame!==(feedback?.frame??null)||
    canvas.getAttribute('data-flash-frame')!==String(quiz.mainFrame)||
    canvas.getAttribute('data-flash-frame-domain')!=='sprite-162'||
    canvas.getAttribute('data-feedback-domain')!==(feedback?.domain??null)||
    canvas.getAttribute('data-feedback-frame')!==(feedback?String(feedback.frame):null))
    throw Error('P020_CANVAS_FRAME_COMMIT_MISMATCH');
}

/** Event boundaries bind the visible native control to the audited source action. */
export function p020CanOpenGlossary(key:P020GlossaryKey,button:HTMLButtonElement,
 quiz:P020QuizSnapshot):boolean{
 const source=P020_TIMELINE.glossary[key];
 return !!source&&button.isConnected&&!button.disabled&&quiz.phase!=='closed'&&
 quiz.phase!=='feedback'&&quiz.glossaryOpen===null&&
 quiz.mainFrame>=source.firstFullHitFrame&&quiz.mainFrame<=source.lastFrame&&
 button.getAttribute('data-source-button-id')===String(source.characterId)&&
 button.getAttribute('data-source-action-sha256')===source.actionSha256&&
 button.getAttribute('data-source-button-instance-id')===source.instanceId&&
 button.getAttribute('data-source-label-text-id')===String(source.labelTextId);
}
export function p020CanAnswer(option:'A'|'B'|'C'|'D',button:HTMLButtonElement,
 quiz:P020QuizSnapshot):boolean{
 const source=P020_TIMELINE.answers[option];
 return !!source&&button.isConnected&&!button.disabled&&quiz.phase==='awaiting-answer'&&
 quiz.answersEnabled&&quiz.mainFrame===58&&
 button.getAttribute('data-p020-option')===option&&
 button.getAttribute('data-source-instance')===source.sourceInstance&&
 button.getAttribute('data-source-button-id')===String(source.characterId)&&
 button.getAttribute('data-source-action-sha256')===source.actionSha256;
}
export function p020CanAcknowledge(button:HTMLButtonElement,quiz:P020QuizSnapshot):boolean{
 return button.isConnected&&!button.disabled&&quiz.phase==='feedback'&&
 quiz.feedbackAwaitingAcknowledgment&&quiz.glossaryOpen===null&&
 button.getAttribute('data-p020-feedback-ack')==='true'&&
 button.getAttribute('data-source-button-id')===String(quiz.feedbackAckButtonCharacterId)&&
 button.getAttribute('data-source-action-sha256')===P020_TIMELINE.acknowledgmentActions[
 quiz.feedbackAckButtonCharacterId as 60|89|74];
}

function nativeQuiz(quiz:P020QuizSnapshot):P020NativeQuizSnapshotV1{
  return {...quiz,feedbackDomain:quiz.feedbackDomain===null?null:
    Number(quiz.feedbackDomain.slice('sprite-'.length))};
}
const ANSWER_INSTANCE={A:'AnsBtn1',B:'AnsBtn2',C:'AnsBtn3',D:'AnsBtn4'} as const;
const NATIVE_SECTION='[data-p020-native-text="true"]';

/** A source button can unmount during the committed transition. Restore focus
 * only for its keyboard owner, and never override a later focus move. */
export function p020HandoffFocus(trigger:HTMLButtonElement,hadFocus:boolean,
  scope:HTMLElement|null,preferredSelector:string):boolean{
  if(!hadFocus||!scope)return false;
  const doc=trigger.ownerDocument;
  if(doc.activeElement!==trigger&&doc.activeElement!==doc.body)return false;
  const preferred=scope.querySelector<HTMLElement>(preferredSelector);
  const section=scope.querySelector<HTMLElement>(NATIVE_SECTION);
  const target=preferred&&(preferredSelector===NATIVE_SECTION||
    preferred.tagName==='BUTTON'&&!preferred.hasAttribute('disabled'))?preferred:section;
  if(!target?.isConnected)return false;
  if(target===section)target.tabIndex=-1;
  target.focus();
  return doc.activeElement===target;
}

export function p020ReturnFocusSelector(quiz:P020QuizSnapshot,
  chosen:'A'|'B'|'C'|'D'|null):string{
  if(quiz.phase==='awaiting-answer'&&quiz.answersEnabled)
    return `[data-p020-option="${chosen??'A'}"]`;
  if(quiz.feedbackAwaitingAcknowledgment)return '[data-p020-feedback-ack="true"]';
  return NATIVE_SECTION;
}

/** Read the refreshed quiz state after releasing a glossary hold. */
export function p020CloseGlossarySnapshot<S>(clock:{closeGlossary():unknown},
  readSnapshot:()=>S):S{
  clock.closeGlossary();
  return readSnapshot();
}

/** One visual owner, one selected audio owner. No track starts from locale or
 * loading; source answers and popup Close are explicit user actions. */
export function P020PlayerV1({asset,loadAudio,loadSpanishAudio,createContext,
  createSpanishContext,chooseFeedbackBranch,language='en',reducedMotion=false,
  volume=1,onSnapshot,connectControls,hidePlaybackControls=false,nativeTextTarget,
  onOpenGlossary}:P020PlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const rootRef=useRef<HTMLDivElement>(null);
  const ownerRef=useRef<P020AudioOwnerV1|null>(null);
  const clockRef=useRef<AlgL06P020ClockV1|null>(null);
  const rafRef=useRef<number|null>(null);
  const generationRef=useRef(0);
  const liveRef=useRef(false);
  const callbackRef=useRef(onSnapshot);callbackRef.current=onSnapshot;
  const chooserRef=useRef(chooseFeedbackBranch);chooserRef.current=chooseFeedbackBranch;
  const reducedRef=useRef(reducedMotion);reducedRef.current=reducedMotion;
  const notificationFailedRef=useRef(false);
  const glossaryTriggerRef=useRef<HTMLButtonElement|null>(null);
  const glossaryOpenRef=useRef(false);
  const lastCommitRef=useRef<{frame:number;domain:string|null;feedbackFrame:number|null}>
    ({frame:1,domain:null,feedbackFrame:null});
  const lastFocusQuizRef=useRef<P020QuizSnapshot|null>(null);
  const chosenAnswerRef=useRef<'A'|'B'|'C'|'D'|null>(null);
  const focusOwnershipRef=useRef(false);
  const [view,setView]=useState<{phase:string;frame:number;quiz:P020QuizSnapshot|null;
    replay:number;error:string}>({phase:'loading',frame:1,quiz:null,replay:0,error:''});
  const [visualReady,setVisualReady]=useState(false);
  const [saView,setSaView]=useState({selected:false,phase:'idle'});
  const [glossaryOpen,setGlossaryOpen]=useState(false);
  const stopLoop=()=>{if(rafRef.current!==null)cancelAnimationFrame(rafRef.current);rafRef.current=null;};
  const commit=(quiz:P020QuizSnapshot):boolean=>{
    const canvas=canvasRef.current;
    if(!liveRef.current||!canvas)return false;
    try{
      p020PaintVerifiedFrame(asset,canvas,quiz);
      lastCommitRef.current={frame:quiz.mainFrame,domain:quiz.feedbackDomain,
        feedbackFrame:quiz.feedbackFrame};
      flushSync(()=>{
        setVisualReady(true);
        setView(previous=>({...previous,frame:quiz.mainFrame,quiz}));
      });
      return true;
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      flushSync(()=>{setVisualReady(false);
        setView(previous=>({...previous,phase:'failed',error:message}));});
      return false;
    }
  };
  const showSnapshot=(owner:P020AudioOwnerV1,snapshot=owner.snapshot())=>{
    if(!liveRef.current||ownerRef.current!==owner||notificationFailedRef.current)return;
    const failure=snapshot.ownershipFailure??(snapshot.selectedAudio==='spanish'?
      snapshot.spanish.failure:null)??snapshot.failure??'';
    setSaView({selected:snapshot.selectedAudio==='spanish',phase:snapshot.spanish.phase});
    setView(previous=>({...previous,phase:snapshot.playbackPhase,frame:snapshot.frame,
      quiz:snapshot.quiz,error:failure}));
    try{callbackRef.current?.(snapshot);}catch(error){
      notificationFailedRef.current=true;stopLoop();owner.pause();
      setView(previous=>({...previous,phase:'failed',error:`snapshot-callback: ${String(error)}`}));
    }
  };
  const focusSourceControl=(quiz:P020QuizSnapshot)=>{
    const before=lastFocusQuizRef.current;
    lastFocusQuizRef.current=quiz;
    const focusAck=quiz.feedbackAwaitingAcknowledgment&&
      !before?.feedbackAwaitingAcknowledgment;
    const focusRetry=quiz.phase==='awaiting-answer'&&before?.phase==='feedback'&&
      quiz.tryCount===1&&chosenAnswerRef.current!==null;
    if((!focusAck&&!focusRetry)||!focusOwnershipRef.current)return;
    const generation=generationRef.current;
    queueMicrotask(()=>{
      if(!liveRef.current||generation!==generationRef.current||
        ownerRef.current?.snapshot().selectedAudio!=='main'||glossaryOpenRef.current)return;
      const scope=nativeTextTarget??rootRef.current;
      const section=scope?.querySelector<HTMLElement>(NATIVE_SECTION);
      if(!section||section.ownerDocument.activeElement!==section){
        focusOwnershipRef.current=false;return;
      }
      const selector=focusAck?'[data-p020-feedback-ack="true"]':
        `[data-p020-option="${chosenAnswerRef.current}"]`;
      const target=scope?.querySelector<HTMLButtonElement>(selector);
      if(target?.isConnected&&!target.disabled)target.focus();
    });
  };
  const schedule=(owner:P020AudioOwnerV1)=>{
    if(rafRef.current===null&&owner.snapshot().selectedAudio==='main'&&
      owner.snapshot().phase==='playing')rafRef.current=requestAnimationFrame(()=>tick(owner));
  };
  const tick=(owner:P020AudioOwnerV1)=>{
    rafRef.current=null;
    if(!liveRef.current||ownerRef.current!==owner)return;
    const clock=clockRef.current;
    if(!clock)return;
    const snapshot=clock.tick();
    const commit=lastCommitRef.current;
    if((commit.frame!==snapshot.frame||commit.domain!==snapshot.feedbackDomain||
      commit.feedbackFrame!==snapshot.feedbackFrame)&&!commitFrame(snapshot.quiz)){
      owner.pause();showSnapshot(owner);return;
    }
    showSnapshot(owner);
    focusSourceControl(snapshot.quiz);
    if(snapshot.autoContinue&&owner.snapshot().selectedAudio==='main'){
      void clock.play({activation:'automatic',reducedMotion:reducedRef.current})
        .then(()=>{if(ownerRef.current===owner){showSnapshot(owner);schedule(owner);}});
      return;
    }
    schedule(owner);
  };
  const commitFrame=(quiz:P020QuizSnapshot)=>commit(quiz);

  useEffect(()=>{
    const generation=++generationRef.current,abort=new AbortController();
    liveRef.current=true;notificationFailedRef.current=false;
    lastFocusQuizRef.current=null;chosenAnswerRef.current=null;
    focusOwnershipRef.current=false;
    glossaryOpenRef.current=false;glossaryTriggerRef.current=null;
    setGlossaryOpen(false);setVisualReady(false);
    setView({phase:'loading',frame:1,quiz:null,replay:0,error:''});
    let owner:P020AudioOwnerV1|null=null,clock:AlgL06P020ClockV1|null=null;
    void(async()=>{
      try{
        await asset.ready();
        if(abort.signal.aborted||generation!==generationRef.current)return;
        clock=new AlgL06P020ClockV1({createContext,commitFrame});
        const main=clock;
        const spanish=new P020OptionalSpanishAudio({load:loadSpanishAudio,
          createContext:createSpanishContext,
          onChange:()=>{if(owner)showSnapshot(owner);},
          onEnded:()=>{if(owner&&liveRef.current)showSnapshot(owner);}});
        owner=new P020AudioOwnerV1(main,spanish);
        clockRef.current=main;ownerRef.current=owner;
        const bytes=await Promise.all(P020_AUDIO_ASSETS.map(a=>loadAudio(a.id,abort.signal)));
        if(abort.signal.aborted||generation!==generationRef.current)return;
        const inputs=Object.fromEntries(P020_AUDIO_ASSETS.map((a,i)=>[a.id,bytes[i]])) as Record<P020AudioId,ArrayBuffer>;
        const prepared=await main.prepare(inputs);
        if(abort.signal.aborted||generation!==generationRef.current)return;
        if(!prepared.accepted)throw Error(prepared.reason);
        if(!owner.setVolume(volume).accepted)throw Error('P020_INVALID_VOLUME');
        showSnapshot(owner);
      }catch(error){
        if(abort.signal.aborted||generation!==generationRef.current)return;
        setView(previous=>({...previous,phase:'failed',error:String(error)}));
        if(owner)void owner.close();
      }
    })();
    return()=>{
      abort.abort();generationRef.current++;liveRef.current=false;
      glossaryOpenRef.current=false;glossaryTriggerRef.current=null;
      focusOwnershipRef.current=false;
      stopLoop();
      if(ownerRef.current===owner)ownerRef.current=null;
      if(clockRef.current===clock)clockRef.current=null;
      if(owner)void owner.close();
    };
  },[asset,loadAudio,loadSpanishAudio,createContext,createSpanishContext]);
  useEffect(()=>{ownerRef.current?.setVolume(volume);},[volume]);

  const play=async()=>{
    const owner=ownerRef.current;
    if(!owner||notificationFailedRef.current||glossaryOpenRef.current)return;
    const generation=generationRef.current;
    const pending=owner.play(reducedRef.current);showSnapshot(owner);
    await pending;
    if(generation!==generationRef.current||ownerRef.current!==owner)return;
    showSnapshot(owner);schedule(owner);
  };
  const pause=()=>{
    const owner=ownerRef.current;if(!owner)return;
    stopLoop();owner.pause();showSnapshot(owner);
  };
  const replay=()=>{
    const owner=ownerRef.current;
    if(!owner||glossaryOpenRef.current)return false;
    stopLoop();
    const replayed=owner.replay();
    if(replayed.accepted){chosenAnswerRef.current=null;lastFocusQuizRef.current=null;
      focusOwnershipRef.current=false;
      setView(previous=>({...previous,replay:previous.replay+1}));}
    showSnapshot(owner);return replayed.accepted;
  };
  const startSpanish=async()=>{
    const owner=ownerRef.current;
    if(!owner||notificationFailedRef.current||glossaryOpenRef.current)return;
    stopLoop();const generation=generationRef.current;
    const pending=owner.startSpanish();showSnapshot(owner);
    await pending;
    if(generation===generationRef.current&&ownerRef.current===owner)showSnapshot(owner);
  };
  const returnMain=async(trigger:HTMLButtonElement)=>{
    const owner=ownerRef.current;if(!owner||notificationFailedRef.current)return;
    const hadFocus=trigger.ownerDocument.activeElement===trigger;
    const generation=generationRef.current;
    const pending=owner.returnMain(reducedRef.current);showSnapshot(owner);
    const returned=await pending;
    if(generation!==generationRef.current||ownerRef.current!==owner)return;
    showSnapshot(owner);schedule(owner);
    if(!returned.accepted||owner.snapshot().selectedAudio!=='main')return;
    requestAnimationFrame(()=>{
      if(!liveRef.current||generation!==generationRef.current||
        ownerRef.current!==owner||glossaryOpenRef.current)return;
      const quiz=owner.snapshot().quiz;
      focusOwnershipRef.current=p020HandoffFocus(trigger,hadFocus,
        nativeTextTarget??rootRef.current,
        p020ReturnFocusSelector(quiz,chosenAnswerRef.current));
    });
  };
  const closeGlossary=()=>{
    if(!glossaryOpenRef.current)return;
    glossaryOpenRef.current=false;
    const trigger=glossaryTriggerRef.current;glossaryTriggerRef.current=null;
    setGlossaryOpen(false);
    const owner=ownerRef.current,clock=clockRef.current;
    if(owner&&clock)showSnapshot(owner,
      p020CloseGlossarySnapshot(clock,()=>owner.snapshot()));
    else clock?.closeGlossary();
    // React must commit the released quiz state before the vocabulary button
    // becomes enabled again. Do not steal a subsequent user focus move.
    if(trigger){
      const generation=generationRef.current,doc=trigger.ownerDocument;
      const before=doc.activeElement;
      requestAnimationFrame(()=>{
        if(!liveRef.current||generation!==generationRef.current||glossaryOpenRef.current||
          !trigger.isConnected||trigger.disabled||
          ![before,doc.body,trigger].includes(doc.activeElement))return;
        trigger.focus({preventScroll:true});
      });
    }
  };
  const openGlossary=(key:P020GlossaryKey,trigger:HTMLButtonElement)=>{
    const owner=ownerRef.current,clock=clockRef.current;
    if(!owner||!clock||owner.snapshot().selectedAudio!=='main'||
      glossaryOpenRef.current||!p020CanOpenGlossary(key,trigger,clock.snapshot().quiz))return;
    stopLoop();const held=clock.openGlossary(key);
    if(!held.accepted)return;
    glossaryOpenRef.current=true;glossaryTriggerRef.current=trigger;
    focusOwnershipRef.current=false;
    setGlossaryOpen(true);trigger.blur();showSnapshot(owner);
    try{onOpenGlossary(key,trigger);}catch(error){
      closeGlossary();setView(previous=>({...previous,phase:'failed',error:`glossary-host: ${String(error)}`}));
    }
  };
  const answer=(option:'A'|'B'|'C'|'D',trigger:HTMLButtonElement)=>{
    const owner=ownerRef.current,clock=clockRef.current;
    if(!owner||!clock||owner.snapshot().selectedAudio!=='main'||glossaryOpenRef.current)return;
    const quiz=clock.snapshot().quiz;
    if(!p020CanAnswer(option,trigger,quiz))return;
    const hadFocus=trigger.ownerDocument.activeElement===trigger;
    try{
      const kind:P020FeedbackKind=option==='B'?'right':'wrong';
      const ordinal=p020ChooseFeedbackBranch(kind,quiz.tryCount,chooserRef.current);
      chosenAnswerRef.current=option;
      if(clock.answer(ANSWER_INSTANCE[option],ordinal).accepted){
        focusOwnershipRef.current=p020HandoffFocus(trigger,hadFocus,
          nativeTextTarget??rootRef.current,NATIVE_SECTION);
        void play();
      }
      showSnapshot(owner);
    }catch(error){setView(previous=>({...previous,phase:'failed',error:`answer: ${String(error)}`}));}
  };
  const acknowledge=(trigger:HTMLButtonElement)=>{
    const owner=ownerRef.current,clock=clockRef.current;
    if(!owner||!clock||owner.snapshot().selectedAudio!=='main'||glossaryOpenRef.current)return;
    const hadFocus=trigger.ownerDocument.activeElement===trigger;
    const quiz=clock.snapshot().quiz;
    if(!p020CanAcknowledge(trigger,quiz))return;
    if(clock.acknowledgeFeedback().accepted){
      focusOwnershipRef.current=p020HandoffFocus(trigger,hadFocus,
        nativeTextTarget??rootRef.current,NATIVE_SECTION);
      void play();
    }
    showSnapshot(owner);
  };
  const controlsRef=useRef<P020PlayerControlsV1|null>(null);
  controlsRef.current={setPaused:value=>value?pause():void play(),replay,
    narration:action=>action==='stop'?pause():void play(),stop:pause,closeGlossary};
  useEffect(()=>connectControls?.({
    setPaused:value=>controlsRef.current?.setPaused(value),
    replay:()=>controlsRef.current?.replay()??false,
    narration:action=>controlsRef.current?.narration(action),
    stop:()=>controlsRef.current?.stop(),
    closeGlossary:()=>controlsRef.current?.closeGlossary(),
  }),[connectControls]);

  const labels=language==='es'?{
    drawing:'Ilustración de la tabla de una función',controls:'Controles de reproducción de la lección',
    play:'Reproducir',pause:'Pausar',replay:'Repetir',spanish:'Audio en español',
    returnMain:'Volver a la animación',stopped:'La reproducción se detuvo:',
  }:{drawing:'Function Table lesson drawing',controls:'Lesson playback controls',
    play:'Play',pause:'Pause',replay:'Replay',spanish:'Spanish Audio',
    returnMain:'Return to animation',stopped:'Lesson playback stopped:'};
  const buttonStyle:React.CSSProperties={minHeight:44,padding:'0.5em 1em',
    border:'1px solid #356aa0',borderRadius:'0.5em',background:'#fff',
    color:'#15344c',font:'inherit'};
  const playbackControls=<div role="group" aria-label={labels.controls}
    style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',padding:'0.75rem 0'}}>
    {!hidePlaybackControls&&<>
      <button type="button" onClick={()=>void play()}
        disabled={!(saView.selected?['paused','ended','error','idle']:
          ['ready','paused','transition-ready']).includes(view.phase)}>{labels.play}</button>
      <button type="button" onClick={pause}
        disabled={!['playing','start-pending','loading'].includes(view.phase)}>{labels.pause}</button>
      <button type="button" onClick={replay} disabled={!visualReady}>{labels.replay}</button>
    </>}
    <button type="button" style={buttonStyle} onClick={()=>void startSpanish()}
      disabled={!visualReady||glossaryOpen||view.phase==='returning'||
        (saView.selected&&['playing','loading'].includes(saView.phase))}>{labels.spanish}</button>
    {saView.selected&&<button type="button" style={buttonStyle}
      onClick={event=>void returnMain(event.currentTarget)}
      disabled={view.phase==='returning'}>{labels.returnMain}</button>}
  </div>;
  const companion=view.quiz?<P020NativeTextV1 frame={view.frame} language={language}
    quizState={nativeQuiz({...view.quiz,answersEnabled:!saView.selected&&view.quiz.answersEnabled,
      feedbackAwaitingAcknowledgment:!saView.selected&&view.quiz.feedbackAwaitingAcknowledgment})}
    onGlossary={saView.selected?undefined:openGlossary}
    onAnswer={saView.selected?undefined:answer}
    onAcknowledge={saView.selected?undefined:acknowledge}/>:null;
  return <div ref={rootRef} data-p020-player="true" data-p020-player-phase={view.phase}
    data-p020-player-frame={view.frame} data-p020-player-replay={view.replay}
    data-p020-feedback-domain={view.quiz?.feedbackDomain??undefined}
    data-p020-feedback-frame={view.quiz?.feedbackFrame??undefined}
    data-p020-glossary-open={glossaryOpen?'true':'false'}
    data-p020-audio-policy="explicit-separate-branch-domains"
    data-p020-audio-owner={saView.selected?'spanish':'main'}
    data-p020-sa-phase={saView.phase}
    data-p020-motion-policy={reducedMotion?'explicit-reduced':'explicit'}>
    <div hidden={!visualReady}>
      <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
        aria-label={labels.drawing} style={{display:'block',width:'100%',height:'auto'}}/>
      {!nativeTextTarget&&companion}
    </div>
    {visualReady&&nativeTextTarget&&createPortal(<>{companion}{playbackControls}</>,nativeTextTarget)}
    {!nativeTextTarget&&playbackControls}
    {view.error&&<p role="alert">{labels.stopped} {view.error}</p>}
  </div>;
}
