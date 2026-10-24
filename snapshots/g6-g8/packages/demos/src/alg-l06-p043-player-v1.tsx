'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P043NativeV1} from './alg-l06-p043-native-v1';
import {p043CommitCanvas,type P043CanvasAssetV1} from './alg-l06-p043-canvas-commit-v1';
import {P043VisualEngineeringRuntimeV1,type P043VisualSnapshotV1}
 from './alg-l06-p043-visual-runtime-v1';

export type P043PlayerControlsV1={setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;closeGlossary():void};
export type P043PlayerPropsV1={asset:P043CanvasAssetV1;language?:'en'|'es';
  nativeTextTarget?:HTMLElement|null;hidePlaybackControls?:boolean;
  onSnapshot?:(snapshot:P043VisualSnapshotV1)=>void;
  onGlossary?:(term:string,trigger:HTMLButtonElement)=>void;
  onCleanup?:()=>void;
  connectControls?:(controls:P043PlayerControlsV1)=>void|(()=>void)};

/** Local visual engineering player; source audio and Flash timing remain open. */
export function P043PlayerV1({asset,language='en',nativeTextTarget,
  hidePlaybackControls=false,onSnapshot,onGlossary,onCleanup,
  connectControls}:P043PlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nativeRef=useRef<HTMLElement>(null);
  const runtimeRef=useRef<P043VisualEngineeringRuntimeV1|null>(null);
  const glossaryTriggerRef=useRef<HTMLButtonElement|null>(null);
  const callbacks=useRef({onSnapshot,onGlossary,onCleanup});
  callbacks.current={onSnapshot,onGlossary,onCleanup};
  const [view,setView]=useState<P043VisualSnapshotV1|null>(null);
  const [ready,setReady]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);
  const publish=useCallback((snapshot:P043VisualSnapshotV1)=>{
    setView(snapshot);
    try{callbacks.current.onSnapshot?.(snapshot);}catch{/* observer only */}
  },[]);
  useEffect(()=>{
    let live=true;
    const runtime=new P043VisualEngineeringRuntimeV1({
      paint:state=>{
        const canvas=canvasRef.current;
        if(!live||runtimeRef.current!==runtime||!canvas)return false;
        try{return !!p043CommitCanvas(asset,canvas,state);}catch{return false;}
      },now:()=>performance.now(),onSnapshot:publish,
      onGlossary:term=>{
        const trigger=glossaryTriggerRef.current;
        if(trigger)callbacks.current.onGlossary?.(term,trigger);
      },onCleanup:()=>callbacks.current.onCleanup?.(),
      clearStage:()=>{canvasRef.current?.getContext('2d')?.clearRect(0,0,800,600)},
    });
    runtimeRef.current=runtime;setView(null);setReady(false);setLoadError(null);
    void asset.ready().then(()=>{
      if(live&&runtimeRef.current===runtime)setReady(runtime.mount());
    }).catch(error=>{if(live)setLoadError(String(error));});
    return()=>{live=false;glossaryTriggerRef.current=null;
      if(runtimeRef.current===runtime)runtimeRef.current=null;
      runtime.close();};
  },[asset,publish]);
  useEffect(()=>{
    if(!view?.visualClockRunning)return;
    let live=true,raf:number|null=null;
    const tick=()=>{if(!live)return;runtimeRef.current?.tick();
      raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
    return()=>{live=false;if(raf!==null)cancelAnimationFrame(raf);};
  },[view?.visualClockRunning]);
  const actions=useRef<{play:()=>boolean;pause:()=>boolean;replay:()=>boolean;
    closeGlossary:()=>boolean}>({play:()=>false,pause:()=>false,replay:()=>false,
    closeGlossary:()=>false});
  actions.current={play:()=>runtimeRef.current?.play()??false,
    pause:()=>runtimeRef.current?.pause()??false,
    replay:()=>runtimeRef.current?.replay()??false,
    closeGlossary:()=>runtimeRef.current?.closeGlossary()??false};
  useEffect(()=>connectControls?.({
    setPaused:paused=>{if(paused)actions.current.pause();else actions.current.play()},
    replay:()=>actions.current.replay(),
    narration:action=>{if(action==='stop')actions.current.pause();
      else actions.current.play()},
    stop:()=>{actions.current.pause()},
    closeGlossary:()=>{actions.current.closeGlossary()},
  }),[connectControls]);
  const state=view?.state;
  const labels=language==='es'?{play:'Reproducir imagen',pause:'Pausar imagen',
    replay:'Repetir',visual:'Vista de ingeniería: solo imagen; audio pendiente'}:
    {play:'Play visuals',pause:'Pause visuals',replay:'Replay',
      visual:'Engineering preview: visuals only; audio pending'};
  const companion=state&&<>
    <p role="status" data-p043-visual-only="true">{labels.visual}</p>
    <P043NativeV1 state={state} language={language} rootRef={nativeRef}
      onChoose={(choice,epoch,generation)=>{
        if(runtimeRef.current?.snapshot().state.epoch===epoch)
          runtimeRef.current.choose(choice,generation);
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
          runtimeRef.current.closeWrong(token);
      }}
      onGlossary={(buttonId,epoch,generation,trigger)=>{
        const runtime=runtimeRef.current;
        if(!runtime||runtime.snapshot().state.epoch!==epoch)return;
        glossaryTriggerRef.current=trigger;
        try{runtime.glossary(buttonId,generation)}
        finally{glossaryTriggerRef.current=null}
      }}/>
    {!hidePlaybackControls&&<div role="group" aria-label="Visual playback controls"
      style={{display:'flex',flexWrap:'wrap',gap:8,padding:12}}>
      <button type="button" onClick={()=>actions.current.play()}
        disabled={!ready||view?.visualClockRunning}>{labels.play}</button>
      <button type="button" onClick={()=>actions.current.pause()}
        disabled={!view?.visualClockRunning}>{labels.pause}</button>
      <button type="button" onClick={()=>actions.current.replay()}
        disabled={!ready}>{labels.replay}</button>
    </div>}
  </>;
  return <div data-animation-id="shared-alg001-l06-p043"
    data-p043-status={loadError||view?.error?'failed':ready?'ready':'loading'}
    data-p043-source-language="en" data-p043-ui-locale={language}
    data-p043-audio-enabled="false" data-p043-clock-alignment="unverified"
    style={{display:'grid',gap:8,minWidth:0,maxWidth:'100%'}}>
    <canvas ref={canvasRef} width={800} height={600} role="img"
      aria-label="Source algebra question illustration"
      style={{display:'block',width:'100%',height:'auto',maxWidth:800,aspectRatio:'4 / 3'}}/>
    {nativeTextTarget&&companion?createPortal(companion,nativeTextTarget):companion}
    {(loadError||view?.error)&&<p role="alert">{loadError??view?.error}</p>}
  </div>;
}
