'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {P039SourceAudio,type P039AudioSnapshot,type P039AudioDependencies} from './nms-l02-p039-audio-v1';
import {P039Exercise} from './nms-l02-p039-exercise-v1';
import {prepareP039Fonts} from './nms-l02-p039-fonts-v1';
export interface P039PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P039PlayerProps {
 readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;
 readonly readAudio:P039AudioDependencies['read'];readonly connectControls?:(controls:P039PlayerControls)=>()=>void;
 readonly onState?:(snapshot:P039AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;
}
export function NmsL2P039Player(props:P039PlayerProps){
 const latest=useRef(props);latest.current=props;
 const engine=useRef<P039SourceAudio|null>(null),ready=useRef(false),seenPaused=useRef(false);
 const [assetsReady,setAssetsReady]=useState(false),[fontFailure,setFontFailure]=useState(false),[snapshot,setSnapshot]=useState<P039AudioSnapshot|null>(null);
 useEffect(()=>{let active=true;void prepareP039Fonts().then(()=>{if(active){ready.current=true;setAssetsReady(true);}}).catch(()=>{if(active){setFontFailure(true);latest.current.onPaused?.(true);}});return()=>{active=false;ready.current=false;};},[]);
 useEffect(()=>{
  let active=true,raf:number|null=null,lastState:P039AudioSnapshot['state']|null=null,lastPhase='',lastPaused:boolean|null=null,completedReplay=-1;
  const publish=(s:P039AudioSnapshot)=>{
   if(!active)return;setSnapshot(s);latest.current.onState?.(s);
   // An authored wait is still an active exercise; an explicit host Pause disables input.
   const paused=!['playing','waiting','loading'].includes(s.phase);
   if(lastPaused!==paused){lastPaused=paused;latest.current.onPaused?.(paused);}
   if(s.state.mainFrame===579&&completedReplay!==s.state.replay){completedReplay=s.state.replay;latest.current.onComplete?.();}
  };
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.state!==lastState||s.phase!==lastPhase){lastState=s.state;lastPhase=s.phase;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P039SourceAudio({seed:props.seed,read:(domain,signal)=>latest.current.readAudio(domain,signal),changed:s=>{
   if(!active)return;publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}
  }});
  engine.current=session;session.setVolume(latest.current.volume);
  const resume=()=>{if(!ready.current){latest.current.onPaused?.(true);return;}void session.play();};
  const controls:P039PlayerControls={
   setPaused(value){if(!active)return;if(value)session.pause();else resume();},
   replay(){if(!active||!ready.current)return false;void session.replay();latest.current.onReplay?.();return true;},
   narration(action){if(!active)return;session.setNarrationEnabled(action==='play');if(action==='play')resume();},
   stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();},
  };
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden)session.pause();};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current&&ready.current)void engine.current?.play();},[props.paused,assetsReady]);
 const pressClose=useCallback((pressed:boolean)=>engine.current?.pressClose(pressed),[]);
 if(fontFailure)return <p role="alert">{props.uiLanguage==='es'?'El texto no está disponible.':'The text is unavailable.'}</p>;
 if(!snapshot||!assetsReady)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 return <div data-p039-assets="ready" data-p039-audio-phase={snapshot.phase} data-p039-audio-frame={snapshot.state.mainFrame}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <P039Exercise state={snapshot.state} uiLanguage={props.uiLanguage} reducedMotion={props.reducedMotion}
   interactionEnabled={snapshot.phase==='playing'||snapshot.phase==='waiting'} onPercent={value=>engine.current?.setPercent(value)} onSubmit={()=>engine.current?.submit()}
   onReset={()=>engine.current?.reset()} onClose={()=>engine.current?.closeWrong()} onClosePress={pressClose}/>
 </div>;
}
