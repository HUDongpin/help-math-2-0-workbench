'use client';
import {useEffect,useRef,useState}from'react';
import{P040SourceAudio,type P040AudioDependencies}from'./nms-l02-p040-audio-v1';
import{P040Presentation}from'./nms-l02-p040-presentation-v1';
import{prepareP040Fonts}from'./nms-l02-p040-fonts-v1';
export type P040AudioSnapshot=ReturnType<P040SourceAudio['snapshot']>;
export interface P040PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void}
export interface P040PlayerProps {uiLanguage:'en'|'es';paused:boolean;volume:number;reducedMotion?:boolean;readAudio:P040AudioDependencies['read'];connectControls?:(controls:P040PlayerControls)=>()=>void;onState?:(snapshot:P040AudioSnapshot)=>void;onPaused?:(paused:boolean)=>void;onReplay?:()=>void;onComplete?:()=>void}
export function NmsL2P040Player(props:P040PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P040SourceAudio|null>(null),ready=useRef(false),seenPaused=useRef(false);
 const[assetsReady,setAssetsReady]=useState(false),[fontFailure,setFontFailure]=useState(false),[snapshot,setSnapshot]=useState<P040AudioSnapshot|null>(null);
 useEffect(()=>{let active=true;void prepareP040Fonts().then(()=>{if(active){ready.current=true;setAssetsReady(true);}}).catch(()=>{if(active){setFontFailure(true);latest.current.onPaused?.(true);}});return()=>{active=false;ready.current=false};},[]);
 useEffect(()=>{
  let active=true,raf:number|null=null,lastFrame=-1,lastPhase='',lastPaused:boolean|null=null,completedReplay=-1;
  const publish=(s:P040AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);const paused=!['playing','loading'].includes(s.phase);if(paused!==lastPaused){lastPaused=paused;latest.current.onPaused?.(paused);}if(s.state.completed&&completedReplay!==s.state.replay){completedReplay=s.state.replay;latest.current.onComplete?.();}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.state.frame!==lastFrame||s.phase!==lastPhase){lastFrame=s.state.frame;lastPhase=s.phase;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P040SourceAudio({read:signal=>latest.current.readAudio(signal),changed:()=>{if(!active)return;const s=session.snapshot();publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});
  engine.current=session;session.setVolume(latest.current.volume);
  const resume=()=>{if(!ready.current){latest.current.onPaused?.(true);return;}void session.play();};
  const controls:P040PlayerControls={setPaused(value){if(!active)return;if(value)session.pause();else resume();},replay(){if(!active||!ready.current)return false;session.replay();latest.current.onReplay?.();return true;},narration(action){if(!active)return;session.setNarration(action==='play');if(action==='play')resume();},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden)session.pause();};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[]);
 useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current&&ready.current)void engine.current?.play();},[props.paused,assetsReady]);
 if(fontFailure)return <p role="alert">{props.uiLanguage==='es'?'El texto no está disponible.':'The text is unavailable.'}</p>;
 if(!snapshot||!assetsReady)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 return <div data-p040-assets="ready" data-p040-phase={snapshot.phase}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <P040Presentation state={snapshot.state} language={props.uiLanguage} reducedMotion={props.reducedMotion} interactive={snapshot.phase==='playing'||snapshot.phase==='paused'||snapshot.phase==='terminal'} onTerm={term=>engine.current?.openTerm(term)} onCloseTerm={()=>engine.current?.closeTerm()}/>
 </div>;
}
