'use client';
import React,{useEffect,useRef,useState} from 'react';
import {P001SourceAudio,type P001AudioDependencies,type P001AudioSnapshot} from './nms-l02-p001-audio-v1';
import {getNmsL2P001FrameState} from './nms-l02-p001-timeline-v1';
import {NmsL2P001Presentation} from './nms-l02-p001-presentation-v1';
export interface P001PlayerControls{setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P001PlayerProps{readonly seed:number;readonly uiLanguage:'en'|'es';readonly volume:number;readonly paused:boolean;readonly reducedMotion?:boolean;readonly readAudio:P001AudioDependencies['read'];readonly connectControls?:(controls:P001PlayerControls)=>()=>void;readonly onState?:(snapshot:P001AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;}
/** Source clock/audio and native text share one session. A first user Play is
 * required; changing fonts, layout, locale or motion preference never recreates it. */
export function NmsL2P001Player(props:P001PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P001SourceAudio|null>(null);const observedPaused=useRef(false);const[snapshot,setSnapshot]=useState<P001AudioSnapshot|null>(null);
 useEffect(()=>{let active=true,raf:number|null=null,lastFrame=-1,completedReplay=-1;
  const publish=(state:P001AudioSnapshot)=>{if(!active)return;setSnapshot(state);latest.current.onState?.(state);if(state.phase==='playing'&&state.cycle>=1&&completedReplay!==state.replay){completedReplay=state.replay;latest.current.onComplete?.();}};
  const tick=()=>{raf=null;if(!active)return;const state=session.snapshot();if(state.frame!==lastFrame){lastFrame=state.frame;publish(state);}if(state.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P001SourceAudio({read:signal=>latest.current.readAudio(signal),changed:state=>{if(!active)return;publish(state);if(state.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(state.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});
  engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const controls:P001PlayerControls={setPaused(value){if(!active)return;if(value)session.pause();else void session.play();latest.current.onPaused?.(value);},replay(){if(!active)return false;void session.replay();latest.current.onReplay?.();latest.current.onPaused?.(false);return true;},narration(action){if(!active)return;session.setNarrationEnabled(action==='play');if(action==='play'){void session.play();latest.current.onPaused?.(false);}},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls);const visibility=()=>{if(document.hidden&&active){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
 useEffect(()=>{if(props.paused){observedPaused.current=true;engine.current?.pause();}else if(observedPaused.current)void engine.current?.play();},[props.paused]);
 if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 const visibleFrame=props.reducedMotion?136:snapshot.frame,state=getNmsL2P001FrameState(visibleFrame,{seed:props.seed,replay:snapshot.replay,lang:props.uiLanguage});
 return <div data-p001-audio-phase={snapshot.phase} data-p001-audio-frame={snapshot.frame} data-p001-cycle={snapshot.cycle} data-p001-replay={snapshot.replay} data-p001-narration={snapshot.narrationEnabled?'enabled':'disabled'} data-p001-motion={props.reducedMotion?'poster':'source-clock'}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <NmsL2P001Presentation state={state} uiLanguage={props.uiLanguage}/>
 </div>;
}
