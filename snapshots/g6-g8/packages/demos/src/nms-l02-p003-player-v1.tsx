'use client';
import {useEffect,useRef,useState} from 'react';
import {P003SourceAudio,type P003AudioDependencies,type P003AudioSnapshot} from './nms-l02-p003-audio-v1';
import {getNmsL2P003FrameState} from './nms-l02-p003-timeline-v1';
import {NmsL2P003Presentation} from './nms-l02-p003-presentation-v1';

export interface P003PlayerControls {
  setPaused(value:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
}
export interface P003PlayerProps {
  readonly seed:number;
  readonly uiLanguage:'en'|'es';
  readonly volume:number;
  readonly paused:boolean;
  readonly reducedMotion?:boolean;
  readonly readAudio:P003AudioDependencies['read'];
  readonly connectControls?:(controls:P003PlayerControls)=>()=>void;
  readonly onState?:(snapshot:P003AudioSnapshot)=>void;
  readonly onPaused?:(paused:boolean)=>void;
  readonly onReplay?:()=>void;
  readonly onComplete?:()=>void;
}

/** A single source audio clock owns motion, text reveals and Replay. Layout,
 * locale and reduced-motion changes do not replace the session or its seed. */
export function NmsL2P003Player(props:P003PlayerProps) {
  const latest=useRef(props); latest.current=props;
  const engine=useRef<P003SourceAudio|null>(null),observedPaused=useRef(false);
  const [snapshot,setSnapshot]=useState<P003AudioSnapshot|null>(null);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastFrame=-1,completedReplay=-1;
    const publish=(state:P003AudioSnapshot)=>{
      if(!active)return;
      setSnapshot(state);latest.current.onState?.(state);
      if(state.phase==='completed'&&completedReplay!==state.replay){completedReplay=state.replay;latest.current.onComplete?.();latest.current.onPaused?.(true);}
    };
    const tick=()=>{
      raf=null;if(!active)return;
      const state=session.snapshot();
      if(state.frame!==lastFrame){lastFrame=state.frame;publish(state);}
      if(state.phase==='playing')raf=requestAnimationFrame(tick);
    };
    const session=new P003SourceAudio({read:signal=>latest.current.readAudio(signal),changed:state=>{
      if(!active)return;publish(state);
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
      else if(state.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}
    }});
    engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
    const controls:P003PlayerControls={
      setPaused(value){if(!active)return;if(value)session.pause();else void session.play();latest.current.onPaused?.(value);},
      replay(){if(!active)return false;void session.replay();latest.current.onReplay?.();latest.current.onPaused?.(false);return true;},
      narration(action){if(!active)return;session.setNarrationEnabled(action==='play');if(action==='play'){void session.play();latest.current.onPaused?.(false);}},
      stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();},
    };
    const disconnect=latest.current.connectControls?.(controls);
    const visibility=()=>{if(document.hidden&&active){session.pause();latest.current.onPaused?.(true);}};
    document.addEventListener('visibilitychange',visibility);
    return()=>{
      active=false;if(raf!==null)cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange',visibility);disconnect?.();
      if(engine.current===session)engine.current=null;
      void session.close();
    };
  },[props.seed]);
  useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
  useEffect(()=>{if(props.paused){observedPaused.current=true;engine.current?.pause();}else if(observedPaused.current)void engine.current?.play();},[props.paused]);
  if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
  const state=getNmsL2P003FrameState(snapshot.frame,{seed:props.seed,replay:snapshot.replay,lang:props.uiLanguage});
  return <div data-p003-audio-phase={snapshot.phase} data-p003-audio-frame={snapshot.frame} data-p003-completed={snapshot.completed?'true':'false'}
    data-p003-replay={snapshot.replay} data-p003-narration={snapshot.narrationEnabled?'enabled':'disabled'} data-p003-motion={props.reducedMotion?'art-poster-source-text-clock':'source-clock'}>
    {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
    <NmsL2P003Presentation state={state} uiLanguage={props.uiLanguage} reducedMotion={props.reducedMotion}/>
  </div>;
}
