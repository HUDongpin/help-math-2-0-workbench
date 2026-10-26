'use client';
import {useEffect,useRef,useState} from 'react';
import {P032SourceAudio,type P032AudioDependencies,type P032AudioSnapshot} from './nms-l02-p032-audio-v1';
import {getNmsL2P032FrameState} from './nms-l02-p032-timeline-v1';
import {NmsL2P032Presentation,type P032PresentationProps} from './nms-l02-p032-presentation-v1';

export interface P032PlayerControls {
  setPaused(value:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
}
export interface P032PlayerProps {
  readonly onLessonHostRequest?:P032PresentationProps['onLessonHostRequest'];
  readonly seed:number;
  readonly uiLanguage:'en'|'es';
  readonly volume:number;
  readonly paused:boolean;
  readonly reducedMotion?:boolean;
  readonly readAudio:P032AudioDependencies['read'];
  readonly connectControls?:(controls:P032PlayerControls)=>()=>void;
  readonly onState?:(snapshot:P032AudioSnapshot)=>void;
  readonly onPaused?:(paused:boolean)=>void;
  readonly onReplay?:()=>void;
  readonly onComplete?:()=>void;
}

/** A single source audio clock owns motion, text reveals and Replay. Layout,
 * locale and reduced-motion changes do not replace the session or its seed. */
export function NmsL2P032Player(props:P032PlayerProps) {
  const latest=useRef(props); latest.current=props;
  const engine=useRef<P032SourceAudio|null>(null),observedPaused=useRef(false);
  const [snapshot,setSnapshot]=useState<P032AudioSnapshot|null>(null);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastFrame=-1,completedReplay=-1;
    const publish=(state:P032AudioSnapshot)=>{
      if(!active)return;
      setSnapshot(state);latest.current.onState?.(state);
      if(state.phase==='completed'&&completedReplay!==state.replay){completedReplay=state.replay;latest.current.onComplete?.();latest.current.onPaused?.(true);}
    };
    const tick=()=>{
      raf=null;if(!active)return;
      const state=session.snapshot();
      // A complete source cycle includes frame451's final1/12second. Its
      // completion must publish even when the visible frame has not changed.
      if(state.frame!==lastFrame||state.phase==='completed'){lastFrame=state.frame;publish(state);}
      if(state.phase==='playing')raf=requestAnimationFrame(tick);
    };
    const session=new P032SourceAudio({read:signal=>latest.current.readAudio(signal),changed:state=>{
      if(!active)return;publish(state);
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
      else if(state.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}
    }});
    engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
    const controls:P032PlayerControls={
      setPaused(value){if(!active)return;if(!value&&session.snapshot().phase==='completed'){latest.current.onPaused?.(true);return;}if(value)session.pause();else void session.play();latest.current.onPaused?.(value);},
      replay(){if(!active)return false;void session.replay();latest.current.onReplay?.();latest.current.onPaused?.(false);return true;},
      narration(action){if(!active)return;session.setNarrationEnabled(action==='play');if(action==='play'){if(session.snapshot().phase==='completed'){latest.current.onPaused?.(true);return;}void session.play();latest.current.onPaused?.(false);}},
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
  useEffect(()=>{if(props.paused){observedPaused.current=true;engine.current?.pause();}else if(observedPaused.current){const session=engine.current;if(session?.snapshot().phase==='completed')latest.current.onPaused?.(true);else void session?.play();}},[props.paused]);
  if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
  const state=getNmsL2P032FrameState(snapshot.frame,{seed:props.seed,replay:snapshot.replay,lang:props.uiLanguage});
  return <div data-p032-audio-phase={snapshot.phase} data-p032-audio-frame={snapshot.frame} data-p032-completed={snapshot.completed?'true':'false'}
    data-p032-replay={snapshot.replay} data-p032-narration={snapshot.narrationEnabled?'enabled':'disabled'} data-p032-motion={props.reducedMotion?'source-clock-with-immediate-grid-fade':'source-clock'}>
    {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
    <NmsL2P032Presentation state={state} uiLanguage={props.uiLanguage} reducedMotion={props.reducedMotion} onLessonHostRequest={props.onLessonHostRequest} onSourceStop={()=>{engine.current?.pause();latest.current.onPaused?.(true);}}/>
  </div>;
}
