'use client';
import {useEffect,useRef,useState}from'react';
import{P042SourceAudio,type P042AudioDependencies}from'./nms-l02-p042-audio-v1';
import{P042Presentation}from'./nms-l02-p042-presentation-v1';
import{replayP042Practice,setP042Percentage}from'./nms-l02-p042-practice-v1';
export type P042AudioSnapshot=ReturnType<P042SourceAudio['snapshot']>;
export interface P042PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void}
export interface P042PlayerProps {uiLanguage:'en'|'es';paused:boolean;volume:number;reducedMotion?:boolean;readAudio:P042AudioDependencies['read'];connectControls?:(controls:P042PlayerControls)=>()=>void;onState?:(snapshot:P042AudioSnapshot)=>void;onPaused?:(paused:boolean)=>void;onReplay?:()=>void;onComplete?:()=>void}
export function NmsL2P042Player(props:P042PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P042SourceAudio|null>(null),ready=useRef(true),seenPaused=useRef(false);
 const[values,setValues]=useState(replayP042Practice),[snapshot,setSnapshot]=useState<P042AudioSnapshot|null>(null);const assetsReady=true;
 useEffect(()=>{
  let active=true,raf:number|null=null,lastFrame=-1,lastPhase='',lastPaused:boolean|null=null,completedReplay=-1;
  const publish=(s:P042AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);const paused=!['playing','loading'].includes(s.phase);if(paused!==lastPaused){lastPaused=paused;latest.current.onPaused?.(paused);}if(s.state.completed&&completedReplay!==s.state.replay){completedReplay=s.state.replay;latest.current.onComplete?.();}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.state.frame!==lastFrame||s.phase!==lastPhase){lastFrame=s.state.frame;lastPhase=s.phase;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P042SourceAudio({read:signal=>latest.current.readAudio(signal),changed:()=>{if(!active)return;const s=session.snapshot();publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});
  engine.current=session;session.setVolume(latest.current.volume);
  const resume=()=>{if(!ready.current){latest.current.onPaused?.(true);return;}void session.play();};
  const controls:P042PlayerControls={setPaused(value){if(!active)return;if(value)session.pause();else resume();},replay(){if(!active||!ready.current)return false;session.replay();setValues(replayP042Practice());latest.current.onReplay?.();return true;},narration(action){if(!active)return;session.setNarration(action==='play');if(action==='play')resume();},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden)session.pause();};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[]);
 useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current&&ready.current)void engine.current?.play();},[props.paused,assetsReady]);
 if(!snapshot||!assetsReady)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 return <div data-p042-assets="ready" data-p042-phase={snapshot.phase}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <P042Presentation frame={snapshot.state.frame} percentages={values} language={props.uiLanguage} interactive={snapshot.phase==='terminal'} onAdjust={(handle,value)=>{if(engine.current?.snapshot().phase==='terminal')setValues(current=>setP042Percentage(current,handle,value));}}/>
 </div>;
}
