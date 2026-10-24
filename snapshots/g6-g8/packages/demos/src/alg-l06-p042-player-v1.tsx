'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import canvasMetadata from '../../../migrations/shared-alg001-l06-p042/canvas-v1/canvas-metadata-v1.json';
import {P042NativeCompanionV1} from './alg-l06-p042-native-v1';
import {P042PageRuntimeV1,type P042RuntimeSnapshot} from './alg-l06-p042-runtime-v1';
import type {P042AudioId} from './alg-l06-p042-audio-owner-v1';
import {P042_SOURCE,type P042State} from './alg-l06-p042-state-v1';

type P042CanvasFeedback={spriteId:239|292;localFrame:number};
export type P042CanvasRequestV1={frame:number;feedback:P042CanvasFeedback|null;
  nmhOpen:boolean;scenario:'source-explicit-frames';lang:'en';seed:0};
export interface P042CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:P042CanvasRequestV1):{
    localFrame:number;frameDomain:string;rootFrame:number;
    feedback:null|{spriteId:number;localFrame:number;sourceReachable:boolean};
    nmhOpen:boolean};
  render(canvas:HTMLCanvasElement,request:P042CanvasRequestV1):unknown;
}
export type P042PlayerControlsV1={
  setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;
};
export interface P042PlayerPropsV1{
  asset:P042CanvasAssetV1;
  loadMain:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadFeedback:(id:'wrong4'|'right4',signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  language?:'en'|'es';volume?:number;hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onGlossary?:(term:string,trigger:HTMLButtonElement)=>void;
  onCleanup?:()=>void;
  onSnapshot?:(snapshot:P042RuntimeSnapshot)=>void;
  connectControls?:(controls:P042PlayerControlsV1)=>void|(()=>void);
}
const initialView={state:null as P042State|null,ready:false,error:null as string|null,
  selected:null as P042AudioId|null,selectedPhase:'idle',saPhase:'idle',
  visualClockRunning:false};

/** Rejects a visually committed frame from the wrong source, selector or NMH
 * state. Canvas source glyphs remain intact; the native companion follows it. */
export function p042PaintFrame(asset:P042CanvasAssetV1,canvas:HTMLCanvasElement,state:P042State){
  if(canvasMetadata.kind!=='p042-source-canvas-visibility-v2-metadata'||
    canvasMetadata.animationId!==P042_SOURCE.animationId||
    canvasMetadata.physicalSource.sha256!==P042_SOURCE.swfSha256||
    canvasMetadata.lessonXml.sha256!==P042_SOURCE.lessonXmlSha256||
    canvasMetadata.assetSha256!==
      '8eebb94446a095f5219bc5b3b46f740179d92e8ee6260a6a5cfa2d9d34fae8f4'||
    canvasMetadata.main.frameDomain!=='sprite-341'||
    canvasMetadata.main.frameCount!==P042_SOURCE.lastFrame||
    canvasMetadata.main.quizHoldFrame!==P042_SOURCE.quizFrame||
    canvasMetadata.stage.width!==800||canvasMetadata.stage.height!==600||
    canvasMetadata.dynamicTextContract.canvasDrawsCurrentText!==false||
    canvas.width!==800||canvas.height!==600)
    throw Error('P042_CANVAS_IDENTITY_MISMATCH');
  const feedback=state.feedback?{spriteId:state.feedback.spriteId,
    localFrame:state.feedback.frame}:null;
  const nmhOpen=state.phase==='nmh-popup'&&state.nmhPopupVisible;
  if((feedback!==null||nmhOpen)&&state.mainFrame!==P042_SOURCE.quizFrame||
    feedback!==null&&nmhOpen)
    throw Error('P042_CANVAS_STATE_MISMATCH');
  const request:P042CanvasRequestV1={frame:state.mainFrame,feedback,nmhOpen,
    scenario:'source-explicit-frames',lang:'en',seed:0};
  const resolved=asset.resolveFrameState(request);
  if(resolved.localFrame!==state.mainFrame||
    resolved.frameDomain!=='sprite-341'||resolved.rootFrame!==6||
    resolved.nmhOpen!==nmhOpen||
    (feedback===null?resolved.feedback!==null:
      resolved.feedback?.spriteId!==feedback.spriteId||
      resolved.feedback?.localFrame!==feedback.localFrame||
      resolved.feedback?.sourceReachable!==true))
    throw Error('P042_CANVAS_RESOLUTION_MISMATCH');
  asset.render(canvas,request);
  if(canvas.getAttribute('data-flash-frame')!==String(state.mainFrame)||
    canvas.getAttribute('data-flash-frame-domain')!=='sprite-341'||
    canvas.getAttribute('data-flash-root-frame')!=='6'||
    canvas.getAttribute('data-p042-feedback-sprite')!==
      (feedback?String(feedback.spriteId):'none')||
    canvas.getAttribute('data-p042-feedback-frame')!==
      (feedback?String(feedback.localFrame):'none')||
    canvas.getAttribute('data-p042-nmh-open')!==String(nmhOpen))
    throw Error('P042_CANVAS_COMMIT_MISMATCH');
  canvas.setAttribute('data-p042-state-epoch',String(state.epoch));
  canvas.setAttribute('data-p042-phase',state.phase);
  return true;
}

export function P042PlayerV1({asset,loadMain,loadFeedback,loadSpanish,
  language='en',volume=1,hidePlaybackControls=false,nativeTextTarget,
  onGlossary,onCleanup,onSnapshot,connectControls}:P042PlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nativeRef=useRef<HTMLElement>(null);
  const runtimeRef=useRef<P042PageRuntimeV1|null>(null);
  const glossaryTriggerRef=useRef<HTMLButtonElement|null>(null);
  const callbacks=useRef({onGlossary,onCleanup,onSnapshot});
  callbacks.current={onGlossary,onCleanup,onSnapshot};
  const [view,setView]=useState(initialView);
  const publish=useCallback((snapshot:P042RuntimeSnapshot)=>{
    setView({state:snapshot.state,ready:snapshot.ready,error:snapshot.error,
      selected:snapshot.audio.owner,
      selectedPhase:snapshot.audio.selected?.phase??'idle',
      saPhase:snapshot.audio.spanish?.phase??'idle',
      visualClockRunning:snapshot.visualClockRunning});
    try{callbacks.current.onSnapshot?.(snapshot);}catch{/* observer cannot change source state */}
  },[]);
  useEffect(()=>{
    let mounted=true;
    const runtime=new P042PageRuntimeV1({
      paint:state=>{
        const canvas=canvasRef.current;
        if(!mounted||runtimeRef.current!==runtime||!canvas)return false;
        try{return p042PaintFrame(asset,canvas,state);}catch{return false;}
      },loadMain,loadFeedback,loadSpanish,onSnapshot:publish,
      onGlossary:term=>{
        const trigger=glossaryTriggerRef.current;
        if(trigger)callbacks.current.onGlossary?.(term,trigger);
      },
      onCleanup:()=>callbacks.current.onCleanup?.(),
    });
    runtimeRef.current=runtime;setView(initialView);
    void asset.ready().then(()=>{
      if(mounted&&runtimeRef.current===runtime)void runtime.start();
    }).catch(error=>{
      if(mounted)setView(previous=>({...previous,error:String(error)}));
    });
    return()=>{mounted=false;glossaryTriggerRef.current=null;
      if(runtimeRef.current===runtime)runtimeRef.current=null;
      void runtime.close().catch(()=>{});};
  },[asset,loadMain,loadFeedback,loadSpanish,publish]);
  useEffect(()=>{runtimeRef.current?.setVolume(volume);},[volume]);
  useEffect(()=>{
    if(view.selected==='sa'||!view.visualClockRunning)return;
    const state=view.state;
    if(!state?.mainPlaying&&
      !['wrong-feedback-playing','wrong-feedback-tail','right-feedback-playing']
        .includes(state?.phase??''))return;
    let live=true,raf:number|null=null;
    const tick=()=>{if(!live)return;runtimeRef.current?.tick();raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
    return()=>{live=false;if(raf!==null)cancelAnimationFrame(raf);};
  },[view.selected,view.visualClockRunning,view.state?.mainPlaying,
    view.state?.phase,view.state?.feedback?.spriteId,view.state?.epoch]);
  const actions=useRef<{
    play:()=>Promise<boolean>;pause:()=>boolean;replay:()=>boolean;
    spanish:()=>Promise<boolean>;returnMain:()=>boolean;closeGlossary:()=>boolean;
  }>({play:()=>Promise.resolve(false),pause:()=>false,replay:()=>false,
    spanish:()=>Promise.resolve(false),returnMain:()=>false,
    closeGlossary:()=>false});
  actions.current={
    play:()=>runtimeRef.current?.play()??Promise.resolve(false),
    pause:()=>runtimeRef.current?.pause()??false,
    replay:()=>runtimeRef.current?.replay()??false,
    spanish:()=>runtimeRef.current?.startSpanish()??Promise.resolve(false),
    returnMain:()=>runtimeRef.current?.returnMain()??false,
    closeGlossary:()=>runtimeRef.current?.closeGlossary()??false,
  };
  useEffect(()=>connectControls?.({
    setPaused:paused=>{if(paused)actions.current.pause();else void actions.current.play();},
    replay:()=>actions.current.replay(),
    narration:action=>{if(action==='stop')actions.current.pause();
      else void actions.current.play();},
    stop:()=>{actions.current.pause();},
    closeGlossary:()=>{actions.current.closeGlossary();},
  }),[connectControls]);
  const state=view.state;
  const labels=language==='es'?{
    play:'Reproducir',pause:'Pausar',replay:'Repetir',spanish:'Audio en español',
    return:'Volver a la animación',controls:'Controles de reproducción'
  }:{play:'Play',pause:'Pause',replay:'Replay',spanish:'Spanish Audio',
    return:'Return to animation',controls:'Lesson playback controls'};
  const companion=state&&<>
    <P042NativeCompanionV1 state={state} language={language} rootRef={nativeRef}
      onChoose={(choice,epoch,generation)=>{
        if(runtimeRef.current?.snapshot().state.epoch===epoch)
          void runtimeRef.current.choose(choice,generation);
      }}
      onOpenNmh={(epoch,generation)=>{
        if(runtimeRef.current?.snapshot().state.epoch===epoch)
          runtimeRef.current.openNmh(generation);
      }}
      onCloseNmh={(epoch,generation)=>{
        if(runtimeRef.current?.snapshot().state.epoch===epoch)
          runtimeRef.current.closeNmh(generation);
      }}
      onCloseWrong={(epoch,token)=>{
        if(runtimeRef.current?.snapshot().state.epoch===epoch)
          void runtimeRef.current.closeWrong(token);
      }}
      onGlossary={(buttonId,epoch,generation,trigger)=>{
        const runtime=runtimeRef.current;
        if(!runtime||runtime.snapshot().state.epoch!==epoch)return;
        glossaryTriggerRef.current=trigger;
        try{runtime.glossary(buttonId,generation);}
        finally{glossaryTriggerRef.current=null;}
      }}/>
    <div role="group" aria-label={labels.controls} data-p042-controls="true"
      style={{display:'flex',flexWrap:'wrap',gap:8,padding:12,minWidth:0}}>
      {!hidePlaybackControls&&<>
        <button type="button" onClick={()=>void actions.current.play()}
          disabled={!view.ready||view.selected==='sa'||
            !(['prequiz','postquiz','wrong-feedback-playing',
              'wrong-feedback-tail','right-feedback-playing'].includes(state.phase))}>
          {labels.play}</button>
        <button type="button" onClick={()=>actions.current.pause()}
          disabled={view.selectedPhase!=='playing'&&view.selectedPhase!=='start-pending'}>
          {labels.pause}</button>
        <button type="button" onClick={()=>actions.current.replay()} disabled={!view.ready}>
          {labels.replay}</button>
      </>}
      <button type="button" onClick={()=>void actions.current.spanish()}
        disabled={!view.ready||state.phase==='host-glossary'||state.phase==='left'}>
        {labels.spanish}</button>
      {view.selected==='sa'&&<button type="button" onClick={()=>actions.current.returnMain()}>
        {labels.return}</button>}
      <span data-p042-audio-phase={view.saPhase} hidden/>
    </div>
  </>;
  return <div data-animation-id="shared-alg001-l06-p042"
    data-p042-status={view.error?'failed':view.ready?'ready':'loading'}
    data-p042-source-language="en" data-p042-ui-locale={language}
    style={{display:'grid',gap:8,minWidth:0,maxWidth:'100%'}}>
    <canvas ref={canvasRef} width={800} height={600}
      role="img" aria-label="Original source illustration of a function table and equation"
      style={{display:'block',width:'100%',height:'auto',maxWidth:800,aspectRatio:'4 / 3'}}/>
    {nativeTextTarget&&companion?createPortal(companion,nativeTextTarget):companion}
    {view.error&&<p role="alert">{view.error}</p>}
  </div>;
}
