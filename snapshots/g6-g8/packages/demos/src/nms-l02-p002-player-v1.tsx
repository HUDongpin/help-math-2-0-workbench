'use client';
import {useEffect,useRef,useState} from 'react';
import {P002SourceAudio,type P002AudioDependencies,type P002AudioSnapshot} from './nms-l02-p002-audio-v1';
import {getNmsL2P002FrameState} from './nms-l02-p002-timeline-v1';
import {NmsL2P002Presentation,type P002PresentationProps} from './nms-l02-p002-presentation-v1';

export interface P002PlayerControls {
  setPaused(value:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
}
export interface P002PlayerProps {
  readonly seed:number;
  readonly uiLanguage:'en'|'es';
  readonly volume:number;
  readonly paused:boolean;
  readonly reducedMotion?:boolean;
  readonly readAudio:P002AudioDependencies['read'];
  readonly connectControls?:(controls:P002PlayerControls)=>()=>void;
  readonly onState?:(snapshot:P002AudioSnapshot)=>void;
  readonly onPaused?:(paused:boolean)=>void;
  readonly onReplay?:()=>void;
  readonly onComplete?:()=>void;
  readonly termEntries?:P002PresentationProps['termEntries'];
  readonly onLessonHostRequest?:P002PresentationProps['onLessonHostRequest'];
}

/** A single source audio clock owns motion, text reveals and Replay. Layout,
 * locale and reduced-motion changes do not replace the session or its seed. */
export function NmsL2P002Player(props:P002PlayerProps) {
  const latest=useRef(props); latest.current=props;
  const engine=useRef<P002SourceAudio|null>(null),observedPaused=useRef(false);
  const [snapshot,setSnapshot]=useState<P002AudioSnapshot|null>(null);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastFrame=-1,completedReplay=-1;
    const publish=(state:P002AudioSnapshot)=>{
      if(!active)return;
      setSnapshot(state);latest.current.onState?.(state);
      if(state.phase==='playing'&&state.cycle>=1&&completedReplay!==state.replay){completedReplay=state.replay;latest.current.onComplete?.();}
    };
    const tick=()=>{
      raf=null;if(!active)return;
      const state=session.snapshot();
      if(state.frame!==lastFrame){lastFrame=state.frame;publish(state);}
      if(state.phase==='playing')raf=requestAnimationFrame(tick);
    };
    const session=new P002SourceAudio({read:signal=>latest.current.readAudio(signal),changed:state=>{
      if(!active)return;publish(state);
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
      else if(state.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}
    }});
    engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
    const controls:P002PlayerControls={
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
  const state=getNmsL2P002FrameState(snapshot.frame,{seed:props.seed,replay:snapshot.replay,lang:props.uiLanguage});
  return <div data-p002-audio-phase={snapshot.phase} data-p002-audio-frame={snapshot.frame} data-p002-cycle={snapshot.cycle}
    data-p002-replay={snapshot.replay} data-p002-narration={snapshot.narrationEnabled?'enabled':'disabled'} data-p002-motion={props.reducedMotion?'art-poster-source-text-clock':'source-clock'}>
    {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
    <NmsL2P002Presentation state={state} uiLanguage={props.uiLanguage} reducedMotion={props.reducedMotion}
      termEntries={props.termEntries} onLessonHostRequest={props.onLessonHostRequest}
      onSourceStop={()=>{engine.current?.pause();latest.current.onPaused?.(true);}}/>
  </div>;
}
