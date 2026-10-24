'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P049PageRuntimeV1,type P049RuntimeSnapshot,type P049RuntimeOptions} from './alg-l06-p049-audio-runtime-v1';
import {P049NativeV1} from './alg-l06-p049-native-v1';
import {p049CommitCanvas,type P049CanvasAssetV1} from './alg-l06-p049-canvas-commit-v1';
import type {P049Event} from './alg-l06-p049-state-v1';
export interface P049PlayerControls {
 setPaused(paused:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;
 stop():void;closeGlossary():void;
}
export interface P049PlayerProps {
 asset:P049CanvasAssetV1;load:P049RuntimeOptions['load'];language?:'en'|'es';volume?:number;
 hidePlaybackControls?:boolean;nativeTextTarget?:HTMLElement|null;
 onSnapshot?:(snapshot:P049RuntimeSnapshot)=>void;
 onGlossary?:(term:string,trigger:HTMLButtonElement)=>void;onCleanup?:()=>void;
 connectControls?:(controls:P049PlayerControls)=>void|(()=>void);
}
export function P049AudioPlayerV1({asset,load,language='en',volume=1,hidePlaybackControls=false,nativeTextTarget,
 onSnapshot,onGlossary,onCleanup,connectControls}:P049PlayerProps){
 const canvas=useRef<HTMLCanvasElement>(null),runtime=useRef<P049PageRuntimeV1|null>(null);
 const trigger=useRef<HTMLButtonElement|null>(null),latest=useRef({onSnapshot,onGlossary,onCleanup});
 latest.current={onSnapshot,onGlossary,onCleanup};
 const [reducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const [view,setView]=useState<P049RuntimeSnapshot|null>(null),[error,setError]=useState<string|null>(null);
 const publish=useCallback((s:P049RuntimeSnapshot)=>{setView(s);latest.current.onSnapshot?.(s);},[]);
 useEffect(()=>{
  let live=true;
  const page=new P049PageRuntimeV1({load,onSnapshot:s=>{if(live)publish(s);},
   onGlossary:term=>{if(trigger.current)latest.current.onGlossary?.(term,trigger.current);},onCleanup:()=>latest.current.onCleanup?.()});
  runtime.current=page;setView(null);setError(null);
  void asset.ready().then(()=>{if(live)void page.start();},e=>{if(live)setError(String(e));});
  const hidden=()=>{if(document.visibilityState==='hidden')page.pause();};document.addEventListener('visibilitychange',hidden);
  return()=>{live=false;document.removeEventListener('visibilitychange',hidden);if(runtime.current===page)runtime.current=null;trigger.current=null;void page.close();};
 },[asset,load,publish]);
 useEffect(()=>{runtime.current?.setVolume(volume);},[volume,view?.ready]);
 useEffect(()=>{
  if(!view||!canvas.current||view.state.phase==='left')return;
  try{p049CommitCanvas(asset,canvas.current,view.state);}catch(e){setError(String(e));runtime.current?.pause();}
 },[asset,view?.state]);
 useEffect(()=>{
  if(!view?.visualClockRunning)return;
  let live=true,handle=0;const tick=()=>{if(live){runtime.current?.tick();handle=requestAnimationFrame(tick);}};
  handle=requestAnimationFrame(tick);return()=>{live=false;cancelAnimationFrame(handle);};
 },[view?.visualClockRunning]);
 const send=useCallback((event:P049Event,button?:HTMLButtonElement)=>{
  trigger.current=button??null;runtime.current?.send(event);
 },[]);
 useEffect(()=>connectControls?.({setPaused:p=>{if(p)runtime.current?.pause();else runtime.current?.play();},
  replay:()=>runtime.current?.replay()??false,narration:a=>{if(a==='play')runtime.current?.play();else runtime.current?.pause();},
  stop:()=>{runtime.current?.pause();},closeGlossary:()=>{const r=runtime.current,s=r?.snapshot().state;
   if(r&&s)r.send({type:'close-glossary',epoch:s.epoch,quizGeneration:s.quizGeneration});}}),[connectControls]);
 const ready=!!view?.ready&&!error,state=view?.state,en=language==='en';
 const companion=state&&<div data-p049-companion>
  <P049NativeV1 state={state} language={language} reducedMotion={reducedMotion} onEvent={ready&&!view?.spanishSelected?send:undefined}/>
 </div>;
 return <div data-p049-player data-p049-ready={String(ready)} data-p049-frame={state?.mainFrame??1}
  data-p049-phase={state?.phase??'loading'} data-p049-running={String(view?.visualClockRunning??false)}
  data-p049-feedback-frame={state?.feedback?.frame??'none'} data-p049-feedback-sprite={state?.feedback?.spriteId??'none'}
  style={{minWidth:0,maxWidth:'100%',color:'#203a60',lineHeight:1.5}}>
  <style>{`[data-p049-player] button,[data-p049-companion] button{font:inherit;line-height:1.4;min-height:2.75rem;padding:.5em .75em;border:1px solid #8298b8;border-radius:.3em;background:#f3f7fc;color:#203a60;max-width:100%;overflow-wrap:anywhere}
[data-p049-player] button:focus-visible,[data-p049-companion] button:focus-visible{outline:3px solid #164faf;outline-offset:3px}
[data-p049-player] button:disabled,[data-p049-companion] button:disabled{color:#526075;background:#eff2f6}
[data-p049-controls]{display:flex;flex-wrap:wrap;gap:.5em;padding:.5em}`}</style>
  <div data-p049-controls>
   {!hidePlaybackControls&&<>
    <button type="button" disabled={!ready||state?.phase==='host-glossary'} onClick={()=>runtime.current?.play()}>{en?'Play':'Reproducir'}</button>
    <button type="button" disabled={!ready} onClick={()=>runtime.current?.pause()}>{en?'Pause':'Pausar'}</button>
    <button type="button" disabled={!ready} onClick={()=>runtime.current?.replay()}>{en?'Replay':'Repetir'}</button>
   </>}
   {view?.spanishSelected?<button type="button" onClick={()=>runtime.current?.returnMain()}>{en?'Return to animation':'Volver a la animación'}</button>:
    <button type="button" disabled={!ready||state?.phase==='host-glossary'} onClick={()=>void runtime.current?.startSpanish()}>{en?'Spanish Audio':'Audio en español'}</button>}
  </div>
  {(!ready||view?.spanishLoading)&&!error&&!view?.failure&&<p role="status">{en?'Loading audio…':'Cargando audio…'}</p>}
  {(error||view?.failure)&&<p role="alert">{error||view?.failure}</p>}
  <canvas ref={canvas} width={800} height={600} aria-hidden="true" style={{display:'block',width:'100%',height:'auto',maxWidth:800}}/>
  {nativeTextTarget?createPortal(companion,nativeTextTarget):companion}
 </div>;
}
