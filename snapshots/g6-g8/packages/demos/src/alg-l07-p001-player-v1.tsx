'use client';
import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {AlgL07P001Session,type AlgL07P001SessionDependencies} from './alg-l07-p001-session-v1';
import {algL07P001Frame} from './alg-l07-p001-state-v1';
import {AlgL07P001Presentation} from './alg-l07-p001-presentation-v1';
export interface AlgL07P001Controls{setPaused(paused:boolean):void;replay():boolean;
  narration(action:'play'|'stop'):void;stop():void;}
export interface AlgL07P001PlayerProps{
  seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;reducedMotion?:boolean;
  readAudio:AlgL07P001SessionDependencies['read'];
  connectControls?:(controls:AlgL07P001Controls)=>()=>void;
  onState?:(state:ReturnType<AlgL07P001Session['snapshot']>)=>void;
  onPaused?:(paused:boolean)=>void;
  onReplay?:()=>void;
}
export function AlgL07P001Player(props:AlgL07P001PlayerProps){
  const latest=useRef(props);latest.current=props;const engine=useRef<AlgL07P001Session|null>(null);
  const [snapshot,setSnapshot]=useState<ReturnType<AlgL07P001Session['snapshot']>|null>(null);
  const [frame,setFrame]=useState(1);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastKey='';
    const update=()=>{if(!active)return;const state=session.snapshot();const key=JSON.stringify(state);
      if(key!==lastKey){lastKey=key;setSnapshot(state);setFrame(state.frame);latest.current.onState?.(state);}
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
    };
    const tick=()=>{raf=null;update();};
    const session=new AlgL07P001Session({read:signal=>latest.current.readAudio(signal),changed:update,
      commitFrame(value){if(!active)return false;flushSync(()=>setFrame(value));return true;}});
    engine.current=session;session.setVolume(latest.current.volume??.8);update();
    const controls:AlgL07P001Controls={setPaused(value){if(!active)return;if(value)session.pause();else void session.play();
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
  },[props.seed]);
  useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);
  // Explicit host controls own play; observing an unpaused prop never starts source audio.
  useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);
  const reduced=props.reducedMotion??false;
  const state=algL07P001Frame(reduced?138:frame,{frame:reduced?138:frame,frameDomain:'sprite-142',scenario:'source-introduction',lang:props.uiLanguage,seed:props.seed,replay:snapshot?.replay??0});
  const playing=['playing','loading','start-pending'].includes(snapshot?.phase??''),es=props.uiLanguage==='es';
  return <div className="alg-l07-p001-player" data-p001-phase={snapshot?.phase??'initializing'} data-p001-frame={snapshot?.frame??1}
    data-p001-cycle={snapshot?.cycle??0} data-p001-replay={snapshot?.replay??0} data-p001-audio-phase={snapshot?.audioPhase??'idle'}>
    <AlgL07P001Presentation state={state} reducedMotion={reduced}/>
    {!props.connectControls&&<div className="alg-l07-p001-player__controls">
      <button type="button" onClick={()=>playing?engine.current?.pause():void engine.current?.play()}>{playing?(es?'Pausa':'Pause'):(es?'Reproducir':'Play')}</button>
      <button type="button" onClick={()=>{latest.current.onReplay?.();void engine.current?.replay();}}>{es?'Repetir':'Replay'}</button>
    </div>}
    {snapshot?.failure&&<p role="alert">{es?'No se pudo reproducir el audio. Inténtalo de nuevo.':'Audio could not play. Please try again.'}</p>}
  </div>;
}
