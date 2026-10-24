'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P045NativeV1, P045GraphHitTargetsV1} from './alg-l06-p045-native-v1';
import type {P045Choice} from './alg-l06-p045-state-v1';
import {p045CommitCanvas,type P045CanvasAssetV1} from './alg-l06-p045-canvas-commit-v1';
import {P045PageRuntimeV1,type P045RuntimeSnapshot}
 from './alg-l06-p045-audio-runtime-v1';
import type {P045AudioId} from './alg-l06-p045-audio-owner-v1';

type Loader=(signal:AbortSignal)=>Promise<ArrayBuffer>;
export type P045AudioPlayerControlsV1={setPaused(paused:boolean):void;
  replay():boolean;narration(action:'play'|'stop'):void;stop():void;
  closeGlossary():void};
export type P045AudioPlayerPropsV1={asset:P045CanvasAssetV1;
  loadMain:Loader;
  loadFeedback:(id:'wrong4'|'right4',signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:Loader;
  language?:'en'|'es';volume?:number;hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onSnapshot?:(snapshot:P045RuntimeSnapshot)=>void;
  onGlossary?:(term:string,trigger:HTMLButtonElement)=>void;
  onCleanup?:()=>void;
  connectControls?:(controls:P045AudioPlayerControlsV1)=>void|(()=>void)};

/** Source-pinned P045 audio with an engineering visual observer. Original Flash
 * frame/sample alignment, listening, and lesson completion remain open. */
export function P045AudioPlayerV1({asset,loadMain,loadFeedback,loadSpanish,
  language='en',volume=1,hidePlaybackControls=false,nativeTextTarget,
  onSnapshot,onGlossary,onCleanup,connectControls}:P045AudioPlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nativeRef=useRef<HTMLElement>(null);
  const runtimeRef=useRef<P045PageRuntimeV1|null>(null);
  const glossaryTriggerRef=useRef<HTMLButtonElement|null>(null);
  const callbacks=useRef({onSnapshot,onGlossary,onCleanup});
  callbacks.current={onSnapshot,onGlossary,onCleanup};
  const [view,setView]=useState<P045RuntimeSnapshot|null>(null);
  const [loadError,setLoadError]=useState<string|null>(null);
  const publish=useCallback((snapshot:P045RuntimeSnapshot)=>{
    setView(snapshot);
    try{callbacks.current.onSnapshot?.(snapshot)}catch{/* observer only */}
  },[]);
  useEffect(()=>{
    let live=true;
    const runtime=new P045PageRuntimeV1({
      paint:state=>{
        const canvas=canvasRef.current;
        if(!live||runtimeRef.current!==runtime||!canvas)return false;
        try{return !!p045CommitCanvas(asset,canvas,state)}catch{return false}
      },loadMain,loadFeedback,loadSpanish,onSnapshot:publish,
      onGlossary:term=>{
        const trigger=glossaryTriggerRef.current;
        if(trigger)callbacks.current.onGlossary?.(term,trigger);
      },onCleanup:()=>callbacks.current.onCleanup?.(),
    });
    runtimeRef.current=runtime;setView(null);setLoadError(null);
    void asset.ready().then(()=>{
      if(live&&runtimeRef.current===runtime)void runtime.start();
    }).catch(error=>{if(live)setLoadError(String(error))});
    return()=>{
      live=false;glossaryTriggerRef.current=null;
      if(runtimeRef.current===runtime)runtimeRef.current=null;
      void runtime.close().catch(()=>{});
      canvasRef.current?.getContext('2d')?.clearRect(0,0,800,600);
    };
  },[asset,loadMain,loadFeedback,loadSpanish,publish]);
  useEffect(()=>{runtimeRef.current?.setVolume(volume)},[volume]);
  useEffect(()=>{
    if(!view?.visualClockRunning||view.audio.owner==='sa')return;
    let live=true,raf:number|null=null;
    const tick=()=>{if(!live)return;runtimeRef.current?.tick();
      raf=requestAnimationFrame(tick)};
    raf=requestAnimationFrame(tick);
    return()=>{live=false;if(raf!==null)cancelAnimationFrame(raf)};
  },[view?.visualClockRunning,view?.audio.owner,view?.state.mainPlaying,
    view?.state.phase,view?.state.feedback?.spriteId,view?.state.epoch]);
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
    setPaused:paused=>{if(paused)actions.current.pause();else void actions.current.play()},
    replay:()=>actions.current.replay(),
    narration:action=>{if(action==='stop')actions.current.pause();
      else void actions.current.play()},
    stop:()=>{actions.current.pause()},
    closeGlossary:()=>{actions.current.closeGlossary()},
  }),[connectControls]);
  const state=view?.state,ready=view?.ready??false;
  const choose = (choice:P045Choice, epoch:number, generation:number) => {
    const runtime = runtimeRef.current;
    if (runtime?.snapshot().state.epoch === epoch) void runtime.choose(choice, generation);
  };
  const selected=view?.audio.owner as P045AudioId|null|undefined;
  const selectedPhase=view?.audio.selected?.phase??'idle';
  const saPhase=view?.audio.spanish?.phase??'idle';
  const labels=language==='es'?{
    play:'Reproducir',pause:'Pausar',replay:'Repetir',spanish:'Audio en español',
    return:'Volver a la animación',controls:'Controles de reproducción'
  }:{play:'Play',pause:'Pause',replay:'Replay',spanish:'Spanish Audio',
    return:'Return to animation',controls:'Lesson playback controls'};
  const audioButtonStyle:React.CSSProperties={border:'1px solid #426ab3',
    borderRadius:8,background:'#fff',color:'#173e82',font:'inherit',
    lineHeight:1.25,padding:'8px 12px',minHeight:40,maxWidth:'100%',
    whiteSpace:'normal',overflowWrap:'anywhere'};
  const companion=state&&<>
    <P045NativeV1 state={state} language={language} rootRef={nativeRef}
      answerButtonsOnStage onChoose={choose}
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
        try{runtime.glossary(buttonId,generation)}
        finally{glossaryTriggerRef.current=null}
      }}/>
    <div role="group" aria-label={labels.controls} data-p045-controls="true"
      style={{display:'flex',flexWrap:'wrap',gap:8,padding:12,minWidth:0}}>
      {!hidePlaybackControls&&<>
        <button type="button" style={audioButtonStyle} onClick={()=>void actions.current.play()}
          disabled={!ready||selected==='sa'||
            !(['prequiz','postquiz','wrong-feedback-playing',
              'wrong-feedback-tail','right-feedback-playing'].includes(state.phase))}>
          {labels.play}</button>
        <button type="button" style={audioButtonStyle} onClick={()=>actions.current.pause()}
          disabled={selectedPhase!=='playing'&&selectedPhase!=='start-pending'}>
          {labels.pause}</button>
        <button type="button" style={audioButtonStyle} onClick={()=>actions.current.replay()} disabled={!ready}>
          {labels.replay}</button>
      </>}
      <button type="button" style={audioButtonStyle} onClick={()=>void actions.current.spanish()}
        disabled={!ready||state.phase==='host-glossary'||state.phase==='left'}>
        {labels.spanish}</button>
      {selected==='sa'&&<button type="button" style={audioButtonStyle}
        onClick={()=>actions.current.returnMain()}>
        {labels.return}</button>}
      <span data-p045-sa-phase={saPhase} hidden/>
    </div>
  </>;
  return <div data-animation-id="shared-alg001-l06-p045"
    data-p045-status={loadError||view?.error?'failed':ready?'ready':'loading'}
    data-p045-source-language="en" data-p045-ui-locale={language}
    data-p045-audio-enabled="true" data-p045-clock-alignment="unverified"
    style={{display:'grid',gap:8,minWidth:0,maxWidth:'100%'}}>
    <div style={{position:'relative',width:'100%',maxWidth:800}}>
      <canvas ref={canvasRef} width={800} height={600} role="img"
        aria-label="Four graphs: A upper left, B upper right, C lower left, D lower right"
        style={{display:'block',width:'100%',height:'auto',aspectRatio:'4 / 3'}}/>
      {state && <P045GraphHitTargetsV1 state={state} onChoose={choose}/>}
    </div>
    {nativeTextTarget&&companion?createPortal(companion,nativeTextTarget):companion}
    {(loadError||view?.error)&&<p role="alert">{loadError??view?.error}</p>}
  </div>;
}
