'use client';
import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {SourceTitleSessionV1,type SourceTitleSessionV1Dependencies} from './source-title-session-v1';
import {sourceTitleFrameV1,type SourceTitleConfigV1} from './source-title-state-v1';
import {SourceTitlePresentationV1} from './source-title-presentation-v1';
export interface SourceTitleControlsV1{setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;}
export interface SourceTitlePlayerV1Props{
  source:SourceTitleConfigV1;seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;reducedMotion?:boolean;
  readAudio:SourceTitleSessionV1Dependencies['read'];
  connectControls?:(controls:SourceTitleControlsV1)=>()=>void;
  onState?:(state:ReturnType<SourceTitleSessionV1['snapshot']>)=>void;
  onPaused?:(paused:boolean)=>void;
  onReplay?:()=>void;
}
export function SourceTitlePlayerV1(props:SourceTitlePlayerV1Props){
  const latest=useRef(props);latest.current=props;const engine=useRef<SourceTitleSessionV1|null>(null);
  const [snapshot,setSnapshot]=useState<ReturnType<SourceTitleSessionV1['snapshot']>|null>(null);
  const [frame,setFrame]=useState(1);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastKey='';
    const update=()=>{if(!active)return;const state=session.snapshot();const key=JSON.stringify(state);
      if(key!==lastKey){lastKey=key;setSnapshot(state);setFrame(state.frame);latest.current.onState?.(state);}
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
    };
    const tick=()=>{raf=null;update();};
    const session=new SourceTitleSessionV1(props.source,{read:signal=>latest.current.readAudio(signal),changed:update,
      commitFrame(value){if(!active)return false;flushSync(()=>setFrame(value));return true;}});
    engine.current=session;session.setVolume(latest.current.volume??.8);update();
    const controls:SourceTitleControlsV1={setPaused(value){if(!active)return;if(value)session.pause();else void session.play();
      latest.current.onPaused?.(value);},
      replay(){if(!active)return false;latest.current.onReplay?.();latest.current.onPaused?.(false);
        void session.replay();return true;},
      narration(action){if(!active)return;if(action==='stop')session.pause();else void session.play();
        latest.current.onPaused?.(action==='stop');},
      stop(){if(!active)return;latest.current.onPaused?.(true);void session.close();}};
    const disconnect=latest.current.connectControls?.(controls);
    const hide=()=>{if(document.hidden)session.pause();};document.addEventListener('visibilitychange',hide);
    return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);disconnect?.();document.removeEventListener('visibilitychange',hide);
      if(engine.current===session)engine.current=null;void session.close();};
  },[props.seed,props.source]);
  useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);
  // Explicit host controls own play; observing an unpaused prop never starts source audio.
  useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);
  const reduced=props.reducedMotion??false;
  const state=sourceTitleFrameV1(props.source,reduced?props.source.frameCount:frame,{frame:reduced?props.source.frameCount:frame,frameDomain:props.source.frameDomain,scenario:'source-introduction',lang:props.uiLanguage,seed:props.seed,replay:snapshot?.replay??0});
  const playing=['playing','loading','start-pending'].includes(snapshot?.phase??''),es=props.uiLanguage==='es';
  return <div className="source-title-player-v1" data-title-phase={snapshot?.phase??'initializing'} data-title-frame={snapshot?.frame??1}
    data-title-cycle={snapshot?.cycle??0} data-title-replay={snapshot?.replay??0} data-title-audio-phase={snapshot?.audioPhase??'idle'}>
    <SourceTitlePresentationV1 source={props.source} state={state} reducedMotion={reduced}/>
    {!props.connectControls&&<div className="source-title-player-v1__controls">
      <button type="button" onClick={()=>playing?engine.current?.pause():void engine.current?.play()}>{playing?(es?'Pausa':'Pause'):(es?'Reproducir':'Play')}</button>
      <button type="button" onClick={()=>{latest.current.onReplay?.();void engine.current?.replay();}}>{es?'Repetir':'Replay'}</button>
    </div>}
    {snapshot?.failure&&<p role="alert">{es?'No se pudo reproducir el audio. Inténtalo de nuevo.':'Audio could not play. Please try again.'}</p>}
  </div>;
}
