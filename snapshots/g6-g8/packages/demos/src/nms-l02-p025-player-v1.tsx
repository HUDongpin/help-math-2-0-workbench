'use client';
import {useEffect,useRef,useState} from 'react';
import {P025SourceAudio,type P025AudioDependencies,type P025AudioSnapshot} from './nms-l02-p025-audio-v1';
import {getNmsL2P025FrameState} from './nms-l02-p025-timeline-v1';
import {NmsL2P025Presentation,type P025PresentationProps} from './nms-l02-p025-presentation-v1';

export interface P025PlayerControls {
  setPaused(value:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
}
export interface P025PlayerProps {
  readonly termEntries?:P025PresentationProps['termEntries'];
  readonly canResume?:()=>boolean;
  readonly onLessonHostRequest?:P025PresentationProps['onLessonHostRequest'];
  readonly seed:number;
  readonly uiLanguage:'en'|'es';
  readonly volume:number;
  readonly paused:boolean;
  readonly reducedMotion?:boolean;
  readonly readAudio:P025AudioDependencies['read'];
  readonly connectControls?:(controls:P025PlayerControls)=>()=>void;
  readonly onState?:(snapshot:P025AudioSnapshot)=>void;
  readonly onPaused?:(paused:boolean)=>void;
  readonly onReplay?:()=>void;
  readonly onComplete?:()=>void;
}

/** A single source audio clock owns motion, text reveals and Replay. Layout,
 * locale and reduced-motion changes do not replace the session or its seed. */
export function NmsL2P025Player(props:P025PlayerProps) {
  const latest=useRef(props); latest.current=props;
  const engine=useRef<P025SourceAudio|null>(null),observedPaused=useRef(false);
  const [snapshot,setSnapshot]=useState<P025AudioSnapshot|null>(null);
  useEffect(()=>{
    let active=true,raf:number|null=null,lastFrame=-1,completedReplay=-1;
    const publish=(state:P025AudioSnapshot)=>{
      if(!active)return;
      setSnapshot(state);latest.current.onState?.(state);
      if(state.phase==='completed'&&completedReplay!==state.replay){completedReplay=state.replay;latest.current.onComplete?.();latest.current.onPaused?.(true);}
    };
    const tick=()=>{
      raf=null;if(!active)return;
      const state=session.snapshot();
      // A complete source cycle includes frame351's final1/12second. Its
      // completion must publish even when the visible frame has not changed.
      if(state.frame!==lastFrame||state.phase==='completed'){lastFrame=state.frame;publish(state);}
      if(state.phase==='playing')raf=requestAnimationFrame(tick);
    };
    const session=new P025SourceAudio({read:signal=>latest.current.readAudio(signal),changed:state=>{
      if(!active)return;publish(state);
      if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);
      else if(state.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}
    }});
    engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
    const controls:P025PlayerControls={
      setPaused(value){if(!active)return;if(!value&&latest.current.canResume?.()===false){latest.current.onPaused?.(true);return;}if(!value&&session.snapshot().phase==='completed'){latest.current.onPaused?.(true);return;}if(value)session.pause();else void session.play();latest.current.onPaused?.(value);},
      replay(){if(!active)return false;void session.replay();latest.current.onReplay?.();latest.current.onPaused?.(false);return true;},
      narration(action){if(!active)return;if(action==='play'&&latest.current.canResume?.()===false){latest.current.onPaused?.(true);return;}session.setNarrationEnabled(action==='play');if(action==='play'){if(session.snapshot().phase==='completed'){latest.current.onPaused?.(true);return;}void session.play();latest.current.onPaused?.(false);}},
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
  useEffect(()=>{if(props.paused){observedPaused.current=true;engine.current?.pause();}else if(observedPaused.current){const session=engine.current;if(latest.current.canResume?.()===false){session?.pause();latest.current.onPaused?.(true);return;}if(session?.snapshot().phase==='completed')latest.current.onPaused?.(true);else void session?.play();}},[props.paused]);
  if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
  const state=getNmsL2P025FrameState(snapshot.frame,{seed:props.seed,replay:snapshot.replay,lang:props.uiLanguage});
  return <div data-p025-audio-phase={snapshot.phase} data-p025-audio-frame={snapshot.frame} data-p025-completed={snapshot.completed?'true':'false'}
    data-p025-replay={snapshot.replay} data-p025-narration={snapshot.narrationEnabled?'enabled':'disabled'} data-p025-motion={'source-clock-equivalent-fractions'}>
    {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
    <NmsL2P025Presentation state={state} uiLanguage={props.uiLanguage} reducedMotion={props.reducedMotion} termEntries={props.termEntries} onLessonHostRequest={props.onLessonHostRequest} onSourceStop={()=>{engine.current?.pause();latest.current.onPaused?.(true);}}/>
  </div>;
}
