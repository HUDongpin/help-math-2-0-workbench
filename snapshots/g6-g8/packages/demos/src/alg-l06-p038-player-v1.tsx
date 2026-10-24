'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import canvasSource from '../../../migrations/shared-alg001-l06-p038/canvas-v1/canvas-metadata-v1.json';
import nativeSource from '../../../migrations/shared-alg001-l06-p038/native-v1/native-model-v1.json';
import {P038PageRuntimeV1,type P038GlossaryKey}
  from './alg-l06-p038-runtime-v1';
import {P038NativeTextCompanionV1,p038CanOpenGlossary}
  from './native-text/alg-l06-p038-native';
import {P038PlayerSessionV1,type P038SessionSnapshot} from './alg-l06-p038-player-session-v1';

export interface P038CanvasAssetV1 {
  readonly metadata:{readonly animationId:string;readonly sourceSwfSha256:string;
    readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
    readonly sourceRootTimeline:{readonly beginFrame:number};
    readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number};
    readonly generatorInput:{readonly framesHtmlSha256:string};readonly audioRendering:string};
  ready():Promise<unknown>;
  resolveFrameState(request:P038CanvasRequest):P038CanvasResult;
  render(canvas:HTMLCanvasElement,request:P038CanvasRequest):P038CanvasResult;
}
export interface P038CanvasRequest {
  frame:number;scenario:'source-static-frame';lang:'en';seed:0;
  suppressSourceGlyphTextIds:readonly [];
}
export interface P038CanvasResult {
  localFrame:number;frameDomain:string;rootFrame:number;
  scenario:string;lang:string;seed:number;audioRendered:boolean;
  suppressedSourceTextIds:readonly number[];
}
export type P038PlayerControlsV1={
  setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;
};
export interface P038PlayerPropsV1 {
  asset:P038CanvasAssetV1;
  loadMain:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  createMainContext?:()=>AudioContext;
  createSpanishContext?:()=>AudioContext;
  language?:'en'|'es';reducedMotion?:boolean;volume?:number;
  hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onSnapshot?:(snapshot:P038SessionSnapshot)=>void;
  connectControls?:(controls:P038PlayerControlsV1)=>void|(()=>void);
  onOpenGlossary:(key:P038GlossaryKey,trigger:HTMLButtonElement)=>void;
  onCloseGlossary:()=>void;
}
type View={phase:string;frame:number;selected:'main'|'spanish';
  spanishPhase:string;glossary:P038GlossaryKey|null;nativeEof:boolean;
  visualBoundary:boolean;error:string;ready:boolean};
const initial:View={phase:'loading',frame:1,selected:'main',spanishPhase:'idle',
  glossary:null,nativeEof:false,visualBoundary:false,error:'',ready:false};
type Commit={frame:number;token:number};

/** Exact source-bound Canvas readback. UI locale never changes source glyphs. */
export function p038PaintVerifiedFrame(asset:P038CanvasAssetV1,
  canvas:HTMLCanvasElement,frame:number,token:number,previous:Commit|null):Commit {
  const m=asset.metadata;
  if(m.animationId!=='shared-alg001-l06-p038'||
     m.sourceSwfSha256!==canvasSource.sourceSwfSha256||
     m.sourceSwfSha256!==nativeSource.source.physicalSwf.sha256||
     m.stage.width!==800||m.stage.height!==600||m.fps!==12||
     m.sourceRootTimeline.beginFrame!==6||
     m.deterministicContentTimeline.timelineId!=='sprite-67'||
     m.deterministicContentTimeline.frameCount!==409||
     m.generatorInput.framesHtmlSha256!==
       '3d7114597b6332e987f31d35336c723a7b4afe385c3df08d8929ef646e66ea35'||
     m.audioRendering!=='not-included'||
     canvasSource.sourceGlyphRendering.default!=='preserve-all')
    throw Error('P038_CANVAS_SOURCE_IDENTITY_MISMATCH');
  if(canvas.width!==800||canvas.height!==600||!Number.isSafeInteger(frame)||
     frame<1||frame>409||!Number.isSafeInteger(token)||token<0||
     (previous&&(token<previous.token||
       (token===previous.token&&frame<previous.frame))))
    throw Error('P038_INVALID_FRAME_OR_REPLAY_TOKEN');
  if(previous?.frame===frame&&previous.token===token&&
     canvas.getAttribute('data-flash-frame')===String(frame)&&
     canvas.getAttribute('data-flash-frame-domain')==='sprite-67'&&
     canvas.getAttribute('data-flash-root-frame')==='6'&&
     canvas.getAttribute('data-runtime-scenario')==='source-static-frame'&&
     canvas.getAttribute('data-runtime-seed')==='0')return previous;
  const request:P038CanvasRequest={frame,scenario:'source-static-frame',lang:'en',
    seed:0,suppressSourceGlyphTextIds:[]};
  const resolved=asset.resolveFrameState(request);
  if(resolved.localFrame!==frame||resolved.frameDomain!=='sprite-67'||
     resolved.rootFrame!==6||resolved.suppressedSourceTextIds.length!==0)
    throw Error('P038_CANVAS_RESOLUTION_MISMATCH');
  const rendered=asset.render(canvas,request);
  if(rendered.localFrame!==frame||rendered.frameDomain!=='sprite-67'||
     rendered.rootFrame!==6||rendered.scenario!=='source-static-frame'||
     rendered.lang!=='en'||rendered.seed!==0||rendered.audioRendered!==false||
     rendered.suppressedSourceTextIds.length!==0||
     canvas.getAttribute('data-flash-frame')!==String(frame)||
     canvas.getAttribute('data-flash-frame-domain')!=='sprite-67'||
     canvas.getAttribute('data-flash-root-frame')!=='6'||
     canvas.getAttribute('data-runtime-scenario')!=='source-static-frame'||
     canvas.getAttribute('data-runtime-seed')!=='0')
    throw Error('P038_CANVAS_COMMIT_MISMATCH');
  return {frame,token};
}

/** Maintained page owner. The companion is responsive below Canvas because
 * source-stage-to-DOM alignment has not been visually calibrated. */
export function P038PlayerV1({asset,loadMain,loadSpanish,createMainContext,
  createSpanishContext,language='en',reducedMotion=false,volume=1,
  hidePlaybackControls=false,nativeTextTarget,onSnapshot,connectControls,onOpenGlossary,
  onCloseGlossary}:P038PlayerPropsV1){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nativeRef=useRef<HTMLElement>(null);
  const sessionRef=useRef<P038PlayerSessionV1|null>(null);
  const triggerRef=useRef<HTMLButtonElement|null>(null);
  const commitRef=useRef<Commit|null>(null);
  const replayToken=useRef(0);
  const callbacks=useRef({onSnapshot,onOpenGlossary,onCloseGlossary,reducedMotion});
  callbacks.current={onSnapshot,onOpenGlossary,onCloseGlossary,reducedMotion};
  const [view,setView]=useState<View>(initial);
  const publish=useCallback((snapshot:P038SessionSnapshot)=>{
    setView(previous=>({...previous,phase:snapshot.phase,frame:snapshot.frame,
      selected:snapshot.selectedAudio,spanishPhase:snapshot.spanishAudio.phase,
      glossary:snapshot.glossaryOpen,nativeEof:snapshot.mainAudio.nativeEofObserved,
      visualBoundary:snapshot.visualBoundaryReached,ready:true,error:''}));
    try{callbacks.current.onSnapshot?.(snapshot);}catch{/* observer is not transport */}
  },[]);

  useEffect(()=>{
    let session:P038PlayerSessionV1;
    commitRef.current=null;replayToken.current=0;triggerRef.current=null;
    setView(initial);
    const paint=(frame:number)=>{
      const canvas=canvasRef.current;
      if(sessionRef.current!==session||!canvas)return false;
      try{
        const commit=p038PaintVerifiedFrame(asset,canvas,frame,
          replayToken.current,commitRef.current);
        commitRef.current=commit;
        setView(previous=>previous.frame===frame?previous:{...previous,frame});
        return true;
      }catch{return false;}
    };
    session=new P038PlayerSessionV1({
      readyVisual:()=>asset.ready(),paintInitial:()=>paint(1),
      createRuntime:()=>new P038PageRuntimeV1({commitFrame:paint,
        createMainContext,createSpanishContext,
        liveHit:(key,frame,buttonId,box)=>{
          const trigger=triggerRef.current,scope=nativeRef.current,
            canvas=canvasRef.current;
          return !!trigger&&!!canvas&&!!scope&&box.length===4&&
            trigger.isConnected&&scope.isConnected&&
            commitRef.current?.frame===frame&&
            commitRef.current.token===replayToken.current&&
            canvas.getAttribute('data-flash-frame')===String(frame)&&
            trigger.getAttribute('data-source-button-id')===String(buttonId)&&
            p038CanOpenGlossary(key,trigger,frame,scope);
        }}),
      loadMain,loadSpanish,initialVolume:volume,
      getReducedMotion:()=>callbacks.current.reducedMotion,
      onSnapshot:publish,
      onFailure:error=>setView(previous=>({...previous,phase:'failed',error:error.message})),
      onCloseDialog:()=>callbacks.current.onCloseGlossary(),
    });
    sessionRef.current=session;void session.start();
    return()=>{
      if(sessionRef.current===session)sessionRef.current=null;
      triggerRef.current=null;commitRef.current=null;
      void session.close().catch(()=>{});
    };
  },[asset,loadMain,loadSpanish,createMainContext,createSpanishContext,publish]);
  useEffect(()=>sessionRef.current?.setVolume(volume),[volume]);
  useEffect(()=>{
    if(!((view.phase==='playing'&&view.selected==='main')||
      (view.selected==='spanish'&&view.spanishPhase==='playing')))return;
    let live=true,raf:number|null=null;
    const tick=()=>{if(!live)return;sessionRef.current?.tick();raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
    return()=>{live=false;if(raf!==null)cancelAnimationFrame(raf);};
  },[view.phase,view.selected,view.spanishPhase]);

  const actions=useRef<{
    play:()=>Promise<boolean>;pause:()=>void;replay:()=>boolean;
    spanish:()=>Promise<boolean>;returnMain:()=>boolean;
    glossary:(key:P038GlossaryKey,trigger:HTMLButtonElement)=>boolean;
    closeGlossary:()=>void;
  }>({
    play:()=>Promise.resolve(false),pause:()=>{},replay:()=>false,
    spanish:()=>Promise.resolve(false),returnMain:()=>false,
    glossary:(_key:P038GlossaryKey,_trigger:HTMLButtonElement)=>false,
    closeGlossary:()=>{},
  });
  actions.current={
    play:()=>sessionRef.current?.play()??Promise.resolve(false),
    pause:()=>sessionRef.current?.pause(),
    replay:()=>sessionRef.current?.replay(()=>{replayToken.current++;})??false,
    spanish:()=>sessionRef.current?.startSpanish()??Promise.resolve(false),
    returnMain:()=>sessionRef.current?.returnMain()??false,
    glossary:(key,trigger)=>{
      triggerRef.current=trigger;
      const opened=sessionRef.current?.openGlossary(key,trigger,
        (name,button)=>callbacks.current.onOpenGlossary(name,button))??false;
      if(!opened)triggerRef.current=null;
      return opened;
    },
    closeGlossary:()=>{sessionRef.current?.closeGlossary();triggerRef.current=null;},
  };
  useEffect(()=>connectControls?.({
    setPaused:paused=>{if(paused)actions.current.pause();else void actions.current.play();},
    replay:()=>actions.current.replay(),
    narration:action=>{if(action==='stop')actions.current.pause();
      else void actions.current.play();},
    stop:()=>actions.current.pause(),
    closeGlossary:()=>actions.current.closeGlossary(),
  }),[connectControls]);
  const labels=language==='es'?{
    controls:'Controles de reproducción',play:'Reproducir',pause:'Pausar',
    replay:'Repetir',spanish:'Audio en español',returnMain:'Volver a la animación',
    close:'Cerrar glosario',failure:'La reproducción se detuvo:'
  }:{controls:'Lesson playback controls',play:'Play',pause:'Pause',
    replay:'Replay',spanish:'Spanish Audio',returnMain:'Return to animation',
    close:'Close glossary',failure:'Lesson playback stopped:'};
  const canPlay=view.ready&&!view.glossary&&
    (view.selected==='spanish'?['ready','paused'].includes(view.spanishPhase):
      ['ready','paused'].includes(view.phase));
  const canPause=view.selected==='spanish'?
    ['playing','start-pending'].includes(view.spanishPhase):
    ['loading','start-pending','playing'].includes(view.phase);
  const companion=<>
    <P038NativeTextCompanionV1 frame={view.frame} language={language}
      rootRef={nativeRef} onGlossary={(key,trigger)=>
        actions.current.glossary(key,trigger)}/>
    <div role="group" data-p038-controls="true" aria-label={labels.controls}
      style={{display:'flex',flexWrap:'wrap',gap:8,padding:12,minWidth:0}}>
      {!hidePlaybackControls&&<>
        <button type="button" onClick={()=>void actions.current.play()}
          disabled={view.glossary!==null||view.phase==='failed'||
            view.phase==='closed'||(!canPlay&&view.phase!=='loading')}>{labels.play}</button>
        <button type="button" onClick={()=>actions.current.pause()}
          disabled={!canPause}>{labels.pause}</button>
        <button type="button" onClick={()=>actions.current.replay()}
          disabled={!view.ready}>{labels.replay}</button>
      </>}
      <button type="button" onClick={()=>void actions.current.spanish()}
        disabled={!view.ready||view.phase==='failed'||view.glossary!==null||
          view.selected==='spanish'}>{labels.spanish}</button>
      {view.selected==='spanish'&&<button type="button"
        onClick={()=>actions.current.returnMain()}>{labels.returnMain}</button>}
      {view.glossary&&<button type="button"
        onClick={()=>actions.current.closeGlossary()}>{labels.close}</button>}
    </div>
  </>;
  return <div data-p038-player="true" data-p038-phase={view.phase}
    data-p038-frame={view.frame} data-p038-audio-owner={view.selected}
    data-p038-sa-phase={view.spanishPhase}
    data-p038-glossary-open={view.glossary??''}
    data-p038-native-eof={String(view.nativeEof)}
    data-p038-visual-boundary={String(view.visualBoundary)}
    data-p038-source-terminal-stop-verified="false"
    data-p038-lesson-completed="false"
    data-p038-audio-policy="source-main-explicit-separate-sa"
    data-p038-language-policy={language==='es'?'source-en-fallback':'source-en'}
    style={{display:'grid',minWidth:0,maxWidth:'100%'}}>
    <canvas ref={canvasRef} width={800} height={600}
      aria-label="Original lesson animation drawing"
      style={{display:'block',width:'100%',height:'auto',maxWidth:800,
        aspectRatio:'4 / 3',minWidth:0}}/>
    {nativeTextTarget?createPortal(companion,nativeTextTarget):companion}
    {view.error&&<p role="alert">{labels.failure} {view.error}</p>}
  </div>;
}
