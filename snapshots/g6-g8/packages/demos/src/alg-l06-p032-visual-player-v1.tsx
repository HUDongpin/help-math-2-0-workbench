'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal,flushSync} from 'react-dom';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P032AudioPlayerV1,type P032PlayerControlsV1 as P032AudioControlsV1}
 from './alg-l06-p032-player-v1';
import {P032NativeTextV1,p032CanOpenGlossary,P032_TIMELINE,
 type P032GlossaryKey} from './alg-l06-p032-native-text-v1';
import {P032AudioOwnerV1} from './alg-l06-p032-audio-owner-v1';

export interface P032CanvasAssetV1 {
 readonly metadata:{readonly animationId:string;readonly sourceSwfSha256:string;
  readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
  readonly sourceRootTimeline:{readonly frameCount:number;readonly beginFrame:number};
  readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number};
  readonly sourceGlyphRendering:{readonly suppressTextIdsSupported:boolean;
   readonly default:string};};
 ready():Promise<unknown>;
 render(canvas:HTMLCanvasElement,request:{frame:number;scenario:'source-static-frame';
  lang:'en';seed:0}):{readonly localFrame:number;readonly frameDomain:string;
   readonly rootFrame:number;readonly scenario:string;readonly lang:string;
   readonly seed:number;readonly audioRendered:boolean;
   readonly suppressedSourceTextIds?:readonly number[]};
}
export type P032PlayerSnapshotV1=ReturnType<P032AudioOwnerV1['snapshot']>;
/** Same surface expected by source-lesson-host-bridge-v1. */
export interface P032PlayerControlsV1 {
 setPaused(paused:boolean):void;replay():boolean;
 narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;
}
export interface P032PlayerPropsV1 {
 asset:P032CanvasAssetV1;
 audioBinding:DecodedSourceStreamBinding;spanishBinding:DecodedSourceStreamBinding;
 loadAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 loadSpanishAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 createContext?:()=>AudioContext;createSpanishContext?:()=>AudioContext;
 language?:'en'|'es';reducedMotion?:boolean;volume?:number;
 onSnapshot?:(snapshot:P032PlayerSnapshotV1&{returning:boolean})=>void;
 connectControls?:(controls:P032PlayerControlsV1)=>void|(()=>void);
 hidePlaybackControls?:boolean;nativeTextTarget?:HTMLElement|null;
 onOpenGlossary:(key:P032GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** Paint the exact generated 413-frame source Canvas and verify its query
 * identity before audio or glossary state is allowed to use the new frame. */
export function p032PaintVerifiedFrame(asset:P032CanvasAssetV1,
 canvas:HTMLCanvasElement,frame:number):void{
 const m=asset.metadata,t=P032_TIMELINE;
 if(m.animationId!==t.animationId||m.sourceSwfSha256!==t.sourceSwfSha256||
  m.stage.width!==800||m.stage.height!==600||m.fps!==12||
  m.sourceRootTimeline.frameCount!==10||m.sourceRootTimeline.beginFrame!==6||
  m.deterministicContentTimeline.timelineId!=='sprite-22'||
  m.deterministicContentTimeline.frameCount!==413||
  m.sourceGlyphRendering.suppressTextIdsSupported!==false||
  m.sourceGlyphRendering.default!=='preserve-all')
  throw Error('P032_CANVAS_ASSET_IDENTITY_MISMATCH');
 if(!Number.isSafeInteger(frame)||frame<1||frame>413)
  throw Error('P032_INVALID_MAIN_FRAME');
 if(canvas.width!==800||canvas.height!==600)
  throw Error('P032_CANVAS_STAGE_MISMATCH');
 const result=asset.render(canvas,{frame,scenario:'source-static-frame',lang:'en',seed:0});
 if(result.localFrame!==frame||result.frameDomain!=='sprite-22'||
  result.rootFrame!==6||result.scenario!=='source-static-frame'||
  result.lang!=='en'||result.seed!==0||result.audioRendered!==false||
  (result.suppressedSourceTextIds?.length??0)!==0||
  canvas.getAttribute('data-flash-frame')!==String(frame)||
  canvas.getAttribute('data-flash-frame-domain')!=='sprite-22'||
  canvas.getAttribute('data-flash-root-frame')!=='6'||
  canvas.getAttribute('data-runtime-scenario')!=='source-static-frame'||
  canvas.getAttribute('data-runtime-seed')!=='0')
  throw Error('P032_CANVAS_FRAME_COMMIT_MISMATCH');
}

/** A valid source button also belongs to this live visual owner and exact
 * Canvas commit. The native helper checks source ink, mask and action hash. */
export function p032CanOpenCommittedGlossary(key:P032GlossaryKey,
 trigger:HTMLButtonElement,frame:number,scope:HTMLElement|null,
 canvas:HTMLCanvasElement|null,committedFrame:number):boolean{
 return !!canvas&&committedFrame===frame&&
  canvas.getAttribute('data-flash-frame')===String(frame)&&
  canvas.getAttribute('data-flash-frame-domain')==='sprite-22'&&
  canvas.getAttribute('data-flash-root-frame')==='6'&&
  canvas.getAttribute('data-runtime-scenario')==='source-static-frame'&&
  canvas.getAttribute('data-runtime-seed')==='0'&&
  p032CanOpenGlossary(key,trigger,frame,scope);
}

/** Bridge returns whether Replay was dispatched; the accepted reset is
 * reflected only after the audio owner resolves it. */
export function p032HostControls(value:P032AudioControlsV1,
 ready:()=>boolean,onReplayAccepted:()=>void):P032PlayerControlsV1{
 return {
  setPaused:paused=>{if(paused)value.pause();else void value.play();},
  replay:()=>{if(!ready())return false;
   void value.replay().then(accepted=>{if(accepted)onReplayAccepted();}).catch(()=>{});
   return true;},
  narration:action=>{if(action==='stop')value.pause();else void value.play();},
  stop:()=>value.stop(),closeGlossary:()=>value.closeGlossary(),
 };
}

/** The audio wrapper owns playback; this owner supplies exact visual frames,
 * source-gated native controls and the modern host control shape. */
export function P032PlayerV1({asset,audioBinding,spanishBinding,loadAudio,
 loadSpanishAudio,createContext,createSpanishContext,language='en',
 reducedMotion=false,volume=1,onSnapshot,connectControls,
 hidePlaybackControls=false,nativeTextTarget,onOpenGlossary}:P032PlayerPropsV1){
 const rootRef=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null);
 const committedRef=useRef(0),readyRef=useRef(false),mismatchRef=useRef(false);
 const audioControls=useRef<P032AudioControlsV1|null>(null);
 const connectRef=useRef(connectControls),snapshotRef=useRef(onSnapshot);
 connectRef.current=connectControls;snapshotRef.current=onSnapshot;
 const [assetReady,setAssetReady]=useState(false);
 const [view,setView]=useState({phase:'loading',frame:1,replay:0,
  selected:'main',glossary:false,error:''});
 useEffect(()=>{
  let live=true;readyRef.current=false;committedRef.current=0;mismatchRef.current=false;
  setAssetReady(false);
  void asset.ready().then(()=>{if(live){readyRef.current=true;setAssetReady(true);}},
   error=>{if(live)setView(p=>({...p,phase:'failed',error:String(error)}));});
  return()=>{live=false;readyRef.current=false;committedRef.current=0;};
 },[asset]);
 const commitFrame=(next:number)=>{
  const canvas=canvasRef.current;
  if(!readyRef.current||!canvas)return false;
  try{
   p032PaintVerifiedFrame(asset,canvas,next);
   committedRef.current=next;
   mismatchRef.current=false;
   flushSync(()=>setView(p=>({...p,frame:next})));
   return true;
  }catch(error){
   committedRef.current=0;
   flushSync(()=>setView(p=>({...p,phase:'failed',error:String(error)})));
   return false;
  }
 };
 const canOpenGlossary=(key:P032GlossaryKey,next:number,
  trigger:HTMLButtonElement)=>{
  const scope=nativeTextTarget??rootRef.current;
  return readyRef.current&&p032CanOpenCommittedGlossary(key,trigger,next,
   scope,canvasRef.current,committedRef.current);
 };
 const handleSnapshot=(snapshot:P032PlayerSnapshotV1)=>{
  if(committedRef.current===0)return;
  if(snapshot.frame!==committedRef.current){
   if(!mismatchRef.current){mismatchRef.current=true;
    queueMicrotask(()=>audioControls.current?.pause());}
   setView(p=>({...p,phase:'failed',error:'P032_SNAPSHOT_FRAME_NOT_COMMITTED'}));
   return;
  }
  setView(p=>({...p,phase:snapshot.playbackPhase,frame:snapshot.frame,
   selected:snapshot.selectedAudio,glossary:snapshot.main.glossaryOpen!==null,
   error:snapshot.failure??'',replay:p.replay}));
  snapshotRef.current?.({...snapshot,returning:snapshot.transitioning});
 };
 const handleConnect=useCallback((value:P032AudioControlsV1)=>{
  audioControls.current=value;
  let active=true;
  const host=p032HostControls(value,
   ()=>active&&readyRef.current&&committedRef.current>=1,
   ()=>{if(active)setView(p=>({...p,replay:p.replay+1}));});
  const disconnect=connectRef.current?.(host);
  return()=>{active=false;if(audioControls.current===value)audioControls.current=null;
   if(typeof disconnect==='function')disconnect();};
 },[]);
 const onNativeGlossary=(key:P032GlossaryKey,trigger:HTMLButtonElement)=>{
  audioControls.current?.openGlossary(key,trigger);
 };
 const companion=<P032NativeTextV1 frame={view.frame} language={language}
  onGlossary={view.selected==='main'?onNativeGlossary:undefined}/>;
 return <div ref={rootRef} className="p032-visual-player"
  data-p032-player="true" data-p032-player-frame={view.frame}
  data-p032-player-phase={view.phase} data-p032-player-replay={view.replay}
  data-p032-canvas-committed={committedRef.current===view.frame?'true':'false'}
  data-p032-source-swf-sha256={P032_TIMELINE.sourceSwfSha256}>
  <style>{`.p032-visual-player{min-width:0;max-width:100%;font-family:var(--font-lesson-sans,Arial),sans-serif}
   .p032-visual-player [data-p032-audio-player]>[role="group"]{display:flex;flex-wrap:wrap;gap:.5rem;padding:.75rem 0;min-width:0}
   .p032-visual-player button{min-height:44px;min-width:0;max-width:100%;padding:.45em .8em;font:inherit;overflow-wrap:anywhere}`}</style>
  {assetReady?<P032AudioPlayerV1 audioBinding={audioBinding}
   spanishBinding={spanishBinding} loadAudio={loadAudio}
   loadSpanishAudio={loadSpanishAudio} createContext={createContext}
   createSpanishContext={createSpanishContext} language={language}
   reducedMotion={reducedMotion} volume={volume}
   commitFrame={commitFrame} canOpenGlossary={canOpenGlossary}
   onOpenGlossary={onOpenGlossary} onSnapshot={handleSnapshot}
   connectControls={handleConnect} hidePlaybackControls={hidePlaybackControls}>
   <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
    style={{display:'block',width:'100%',height:'auto'}}/>
   {!nativeTextTarget&&companion}
   </P032AudioPlayerV1>:<p role={view.error?'alert':'status'}>
    {view.error|| (language==='es'?'Cargando…':'Loading…')}</p>}
  {assetReady&&nativeTextTarget&&createPortal(companion,nativeTextTarget)}
 </div>;
}
