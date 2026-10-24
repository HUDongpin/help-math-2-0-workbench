'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P046NativeQuizV1} from './alg-l06-p046-native-v1';
import {P046PageRuntimeV1,type P046RuntimeSnapshot} from './alg-l06-p046-audio-runtime-v1';
import {p046CommitCanvas,type P046CanvasAssetV1} from './alg-l06-p046-canvas-commit-v1';
import {P046_GLOSSARY,type P046Event,type P046Transition} from './alg-l06-p046-state-v1';
import type {P046AudioDomain} from './alg-l06-p046-measured-bindings-v1';
import binding from '../../../migrations/shared-alg001-l06-p046/native-v1/native-bindings-v1.json';
import teaching from '../../../migrations/shared-alg001-l06-p046/native-v1/teaching-bindings-v1.json';

export type P046AudioPlayerControlsV1={setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;closeGlossary():void};
export type P046AudioPlayerPropsV1={asset:P046CanvasAssetV1;
  load:(domain:P046AudioDomain,signal:AbortSignal)=>Promise<ArrayBuffer>;
  language?:'en'|'es';volume?:number;hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onSnapshot?:(snapshot:P046RuntimeSnapshot)=>void;
  onGlossary?:(term:string,trigger:HTMLButtonElement)=>void;
  onCleanup?:()=>void;
  connectControls?:(controls:P046AudioPlayerControlsV1)=>void|(()=>void)};

export function P046AudioPlayerV1({asset,load,language='en',volume=1,hidePlaybackControls=false,nativeTextTarget,
  onSnapshot,onGlossary,onCleanup,connectControls}:P046AudioPlayerPropsV1){
  const runtimeRef=useRef<P046PageRuntimeV1|null>(null),canvasRef=useRef<HTMLCanvasElement>(null);
  const triggerRef=useRef<HTMLButtonElement|null>(null);
  const callbacks=useRef({onSnapshot,onGlossary,onCleanup});callbacks.current={onSnapshot,onGlossary,onCleanup};
  const [view,setView]=useState<P046RuntimeSnapshot|null>(null);
  const [error,setError]=useState<string|null>(null);
  const publish=useCallback((snapshot:P046RuntimeSnapshot)=>{
    setView(snapshot);try{callbacks.current.onSnapshot?.(snapshot);}catch{/* observer only */}
  },[]);
  useEffect(()=>{
    let live=true;
    const runtime=new P046PageRuntimeV1({load,onSnapshot:publish,
      onGlossary:term=>{if(triggerRef.current)callbacks.current.onGlossary?.(term,triggerRef.current);},
      onCleanup:()=>callbacks.current.onCleanup?.()});
    runtimeRef.current=runtime;setView(null);setError(null);
    void asset.ready().then(()=>{if(live)void runtime.start();}).catch(reason=>{if(live)setError(String(reason));});
    const hide=()=>{if(document.visibilityState==='hidden')runtime.send({type:'pause',epoch:runtime.snapshot().state.epoch});};
    document.addEventListener('visibilitychange',hide);
    return()=>{live=false;document.removeEventListener('visibilitychange',hide);
      if(runtimeRef.current===runtime)runtimeRef.current=null;
      triggerRef.current=null;void runtime.close();};
  },[asset,load,publish]);
  useEffect(()=>{runtimeRef.current?.setVolume(volume);},[volume,view?.ready]);
  useEffect(()=>{
    if(!view||!canvasRef.current||view.state.phase==='left')return;
    try{p046CommitCanvas(asset,canvasRef.current,view.state);}catch(reason){setError(String(reason));
      runtimeRef.current?.send({type:'pause',epoch:view.state.epoch});}
  },[asset,view?.state.mainFrame,view?.state.epoch]);
  useEffect(()=>{
    if(!view?.visualClockRunning)return;
    let live=true,handle=0;
    const tick=()=>{if(!live)return;runtimeRef.current?.tick();handle=requestAnimationFrame(tick);};
    handle=requestAnimationFrame(tick);
    return()=>{live=false;cancelAnimationFrame(handle);};
  },[view?.visualClockRunning]);
  const send=useCallback((event:P046Event):P046Transition=>{
    const runtime=runtimeRef.current;
    if(!runtime)throw Error('P046_RUNTIME_UNAVAILABLE');
    if(event.type==='glossary'){
      const active=document.activeElement;
      triggerRef.current=active instanceof HTMLButtonElement?active:null;
    }
    return runtime.send(event);
  },[]);
  const action=useCallback((type:'play'|'pause'|'replay'|'spanish'|'return-spanish'|'close-glossary')=>{
    const runtime=runtimeRef.current;
    return runtime?.send({type,epoch:runtime.snapshot().state.epoch}).accepted??false;
  },[]);
  useEffect(()=>connectControls?.({setPaused:paused=>{action(paused?'pause':'play');},
    replay:()=>action('replay'),narration:kind=>{action(kind==='play'?'play':'pause');},
    stop:()=>{action('pause');},closeGlossary:()=>{action('close-glossary');}}),[connectControls,action]);
  const state=view?.state,ready=!!view?.ready&&!error;
  const labels=language==='es'?{play:'Reproducir',pause:'Pausar',replay:'Repetir',spanish:'Audio en español',
    back:'Volver a la animación',terms:'Términos',loading:'Cargando audio…'}:
    {play:'Play',pause:'Pause',replay:'Replay',spanish:'Spanish Audio',back:'Return to animation',terms:'Terms',loading:'Loading audio…'};
  const companion=state&&<section data-p046-companion lang="en">
    {state.mainFrame!==163&&state.mainFrame>=2&&<>
      <p data-source-text-id={binding.question.textId}>{binding.question.text}</p>
      {state.mainFrame>=11&&<>
        <p className="p046-equation" data-source-text-id={binding.equation.textId}>{binding.equation.text}</p>
        <table><thead><tr><th scope="col" data-source-text-id={20}>{binding.inputLabel.text}</th>
          <th scope="col" data-source-text-id={21}>{binding.outputLabel.text}</th></tr></thead>
          <tbody>{binding.rows.map(row=><tr key={row.id}>{(['input','output'] as const).map(column=><td key={column}>
            {column!==row.missing?<span data-source-text-id={row.givenTextId}>{row.given}</span>:
              state.mainFrame>=164?<span data-source-text-id={row.answerTextId}>{row.answer}</span>:<span aria-label="blank">□</span>}
          </td>)}</tr>)}</tbody></table>
      </>}
      <div data-p046-teaching>{teaching.texts.filter(row=>row.ranges.some(([a,b])=>state.mainFrame>=a&&state.mainFrame<=b))
        .map(row=><p className="p046-equation" data-source-text-id={row.textId} key={row.textId}>{row.text}</p>)}</div>
    </>}
    <P046NativeQuizV1 state={state} language={language} onEvent={ready?send:undefined}/>
    {!state.nmhVisible&&<div role="group" aria-label={labels.terms} className="p046-controls">
      {[15,16,17,18].map(id=><button key={id} type="button" data-source-button-id={id}
        disabled={!ready||!!state.glossary||state.spanishSelected}
        onClick={event=>{triggerRef.current=event.currentTarget;send({type:'glossary',buttonId:id,epoch:state.epoch});}}>
        {(P046_GLOSSARY as Record<number,string>)[id]}</button>)}
    </div>}
  </section>;
  return <div data-p046-player data-p046-frame={state?.mainFrame??1} data-p046-phase={state?.phase??'loading'}
    data-p046-ready={ready?'true':'false'} data-p046-running={view?.visualClockRunning?'true':'false'}>
    <style>{`[data-p046-player],[data-p046-companion]{font-family:var(--lesson-font-family,system-ui);line-height:1.5;min-width:0;color:#172554}
[data-p046-player] button,[data-p046-companion] button{font:inherit;line-height:1.3;min-height:2.75rem;border:1px solid #64748b;border-radius:.4rem;background:white;color:#172554;padding:.4rem .75rem;max-width:100%;overflow-wrap:anywhere}
[data-p046-player] button:focus-visible,[data-p046-companion] button:focus-visible{outline:3px solid #124eab;outline-offset:3px}
[data-p046-player] button:disabled,[data-p046-companion] button:disabled{background:#f1f5f9;color:#475569}
[data-p046-companion] table{width:100%;max-width:34rem;border-collapse:collapse;table-layout:fixed}
[data-p046-companion] th,[data-p046-companion] td{padding:.4rem;border:1px solid #94a3b8;text-align:center;overflow-wrap:anywhere}
[data-p046-companion] .p046-equation{font-size:1.3em;font-weight:650;overflow-wrap:anywhere}
.p046-controls{display:flex;flex-wrap:wrap;gap:.6rem;margin:.75rem 0}`}</style>
    <div className="p046-controls" aria-label={language==='es'?'Controles de audio':'Audio controls'}>
      {!hidePlaybackControls&&<>
        <button type="button" disabled={!ready||!!state?.glossary||state?.phase==='end'&&!state?.spanishSelected} onClick={()=>action('play')}>{labels.play}</button>
        <button type="button" disabled={!ready} onClick={()=>action('pause')}>{labels.pause}</button>
        <button type="button" disabled={!ready} onClick={()=>action('replay')}>{labels.replay}</button>
      </>}
      {state?.spanishSelected?<button type="button" disabled={!ready} onClick={()=>action('return-spanish')}>{labels.back}</button>:
        <button type="button" disabled={!ready||!!state?.glossary} onClick={()=>action('spanish')}>{labels.spanish}</button>}
    </div>
    {(!ready||view?.spanishLoading)&&!error&&!view?.failure&&<p role="status">{labels.loading}</p>}
    {(error||view?.failure)&&<p role="alert">{error||view?.failure}</p>}
    <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
      style={{display:state?.mainFrame===163?'none':'block',width:'100%',height:'auto',maxWidth:800}}/>
    {nativeTextTarget?createPortal(companion,nativeTextTarget):companion}
  </div>;
}
