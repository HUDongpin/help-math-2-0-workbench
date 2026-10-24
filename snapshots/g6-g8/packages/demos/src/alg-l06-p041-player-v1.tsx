'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import canvasMetadata from '../../../migrations/shared-alg001-l06-p041/canvas-v1/canvas-metadata-v1.json';
import {P041NativeCompanionV1} from './alg-l06-p041-native-v1';
import {P041PageRuntimeV1,type P041RuntimeSnapshot} from './alg-l06-p041-runtime-v1';
import type {P041AudioId} from './alg-l06-p041-audio-owner-v1';
import type {P041State} from './alg-l06-p041-state-v1';

export interface P041CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:{frame:number;feedback?:{spriteId:number;localFrame:number}|null;
    scenario:'source-explicit-frames';lang:'en';seed:0}):{localFrame:number;feedback:null|{spriteId:number;localFrame:number}};
  render(canvas:HTMLCanvasElement,request:{frame:number;feedback?:{spriteId:number;localFrame:number}|null;
    scenario:'source-explicit-frames';lang:'en';seed:0}):unknown;
}
export type P041PlayerControlsV1={
  setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;
};
export interface P041PlayerPropsV1{
  asset:P041CanvasAssetV1;
  loadMain:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadFeedback:(id:Exclude<P041AudioId,'main'|'sa'>,signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  language?:'en'|'es';volume?:number;hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onSnapshot?:(snapshot:P041RuntimeSnapshot)=>void;
  connectControls?:(controls:P041PlayerControlsV1)=>void|(()=>void);
}
const SOURCE_SHA='bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85';
const initialState={state:null as P041State|null,ready:false,error:null as string|null,
  selected:null as P041AudioId|null,saPhase:'idle'};

/** The drawing function accepts an explicit source-domain feedback selection.
 * No Canvas text suppression, guessed ES translation or audio action occurs. */
export function p041PaintFrame(asset:P041CanvasAssetV1,canvas:HTMLCanvasElement,state:P041State){
  if(canvasMetadata.animationId!=='shared-alg001-l06-p041'||
    canvasMetadata.sourceSwfSha256!==SOURCE_SHA||
    canvasMetadata.assetSha256!==
      '77cdf78caf76bc825e4c8cbdc5f511dd377da9b289018a53cf1c72c7f3ad5923'||
    canvasMetadata.main.frameCount!==869||canvasMetadata.main.quizStopFrame!==752||
    canvas.width!==800||canvas.height!==600)
    throw Error('P041_CANVAS_IDENTITY_MISMATCH');
  const feedback=state.feedback?{spriteId:state.feedback.spriteId,
    localFrame:state.feedback.frame}:null;
  const request={frame:state.mainFrame,feedback,scenario:'source-explicit-frames' as const,
    lang:'en' as const,seed:0 as const};
  const resolved=asset.resolveFrameState(request);
  if(resolved.localFrame!==state.mainFrame||
    (feedback===null?resolved.feedback!==null:
      resolved.feedback?.spriteId!==feedback.spriteId||
      resolved.feedback?.localFrame!==feedback.localFrame))
    throw Error('P041_CANVAS_RESOLUTION_MISMATCH');
  asset.render(canvas,request);
  if(canvas.getAttribute('data-flash-frame')!==String(state.mainFrame)||
    canvas.getAttribute('data-flash-frame-domain')!=='sprite-169'||
    canvas.getAttribute('data-p041-feedback-sprite')!==
      (feedback?String(feedback.spriteId):'none'))
    throw Error('P041_CANVAS_COMMIT_MISMATCH');
  canvas.setAttribute('data-p041-state-epoch',String(state.epoch));
  return true;
}

export function P041PlayerV1({asset,loadMain,loadFeedback,loadSpanish,
  language='en',volume=1,hidePlaybackControls=false,nativeTextTarget,
  onSnapshot,connectControls}:P041PlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nativeRef=useRef<HTMLElement>(null);
  const runtimeRef=useRef<P041PageRuntimeV1|null>(null);
  const callbacks=useRef({onSnapshot});callbacks.current={onSnapshot};
  const [view,setView]=useState(initialState);
  const publish=useCallback((snapshot:P041RuntimeSnapshot)=>{
    setView({state:snapshot.state,ready:snapshot.ready,error:snapshot.error,
      selected:snapshot.audio.owner,saPhase:snapshot.audio.spanish?.phase??'idle'});
    try{callbacks.current.onSnapshot?.(snapshot);}catch{/* observer cannot change source state */}
  },[]);
  useEffect(()=>{
    let mounted=true;
    const runtime=new P041PageRuntimeV1({
      paint:state=>{
        const canvas=canvasRef.current;
        if(!mounted||runtimeRef.current!==runtime||!canvas)return false;
        try{return p041PaintFrame(asset,canvas,state);}catch{return false;}
      },loadMain,loadFeedback,loadSpanish,onSnapshot:publish,
    });
    runtimeRef.current=runtime;setView(initialState);
    void asset.ready().then(()=>{
      if(mounted&&runtimeRef.current===runtime)void runtime.start();
    }).catch(error=>{
      if(mounted)setView(previous=>({...previous,error:String(error)}));
    });
    return()=>{mounted=false;if(runtimeRef.current===runtime)runtimeRef.current=null;
      void runtime.close().catch(()=>{});};
  },[asset,loadMain,loadFeedback,loadSpanish,publish]);
  useEffect(()=>{runtimeRef.current?.setVolume(volume);},[volume]);
  useEffect(()=>{
    const state=view.state;
    if(!state?.mainTimelinePlaying&&!state?.feedback?.playing)return;
    let live=true,raf:number|null=null;
    const tick=()=>{if(!live)return;runtimeRef.current?.tick();raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
    return()=>{live=false;if(raf!==null)cancelAnimationFrame(raf);};
  },[view.state?.mainTimelinePlaying,view.state?.feedback?.playing,
    view.state?.feedback?.spriteId,view.state?.epoch]);
  const actions=useRef<{
    play:()=>Promise<boolean>;pause:()=>boolean;replay:()=>boolean;
    spanish:()=>Promise<boolean>;returnMain:()=>boolean;
  }>({
    play:()=>Promise.resolve(false),pause:()=>false,replay:()=>false,
    spanish:()=>Promise.resolve(false),returnMain:()=>false,
  });
  actions.current={
    play:()=>runtimeRef.current?.play()??Promise.resolve(false),
    pause:()=>runtimeRef.current?.pause()??false,
    replay:()=>runtimeRef.current?.replay()??false,
    spanish:()=>runtimeRef.current?.startSpanish()??Promise.resolve(false),
    returnMain:()=>runtimeRef.current?.returnMain()??false,
  };
  useEffect(()=>connectControls?.({
    setPaused:paused=>{if(paused)actions.current.pause();else void actions.current.play();},
    replay:()=>actions.current.replay(),
    narration:action=>{if(action==='stop')actions.current.pause();
      else void actions.current.play();},
    stop:()=>{actions.current.pause();},
  }),[connectControls]);
  const state=view.state;
  const labels=language==='es'?{
    play:'Reproducir',pause:'Pausar',replay:'Repetir',spanish:'Audio en español',
    return:'Volver a la animación',controls:'Controles de reproducción'
  }:{play:'Play',pause:'Pause',replay:'Replay',spanish:'Spanish Audio',
    return:'Return to animation',controls:'Lesson playback controls'};
  const companion=state&&<>
    <P041NativeCompanionV1 state={state} language={language} rootRef={nativeRef}
      onChoose={answer=>{void runtimeRef.current?.choose(answer);}}
      onCloseWrong={generation=>{void runtimeRef.current?.closeWrong(generation);}}/>
    <div role="group" aria-label={labels.controls} data-p041-controls="true"
      style={{display:'flex',flexWrap:'wrap',gap:8,padding:12,minWidth:0}}>
      {!hidePlaybackControls&&<>
        <button type="button" onClick={()=>void actions.current.play()}
          disabled={!view.ready||view.selected==='sa'||
            !(['prequiz','postquiz','postquiz-resume','feedback-playing'].includes(state.phase))}>
          {labels.play}</button>
        <button type="button" onClick={()=>actions.current.pause()}
          disabled={!state.mainTimelinePlaying&&!state.feedback?.playing&&
            !['playing','start-pending'].includes(view.saPhase)}>{labels.pause}</button>
        <button type="button" onClick={()=>actions.current.replay()} disabled={!view.ready}>
          {labels.replay}</button>
      </>}
      <button type="button" onClick={()=>void actions.current.spanish()}
        disabled={!view.ready||state.phase==='left'}>{labels.spanish}</button>
      {view.selected==='sa'&&<button type="button" onClick={()=>actions.current.returnMain()}>
        {labels.return}</button>}
      <span data-p041-audio-phase={view.saPhase} hidden/>
    </div>
  </>;
  return <div data-animation-id="shared-alg001-l06-p041"
    data-p041-status={view.error?'failed':view.ready?'ready':'loading'}
    data-p041-source-language="en" data-p041-ui-locale={language}
    style={{display:'grid',gap:8,minWidth:0,maxWidth:'100%'}}>
    <canvas ref={canvasRef} width={800} height={600}
      role="img" aria-label="Original source graph of ball height versus time"
      style={{display:'block',width:'100%',height:'auto',maxWidth:800,aspectRatio:'4 / 3'}}/>
    {nativeTextTarget&&companion?createPortal(companion,nativeTextTarget):companion}
    {view.error&&<p role="alert">{view.error}</p>}
  </div>;
}
