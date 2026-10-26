import React from 'react';
import {P051OutroView} from './nms-l02-p051-outro-view-v1';
import {P051Glossary,type P051GlossaryId} from './nms-l02-p051-glossary-v1';
import {p051IntroScene} from './nms-l02-p051-intro-scene-v1';
import './nms-l02-p051-view-v1.css';
import './nms-l02-p051-intro-view-v1.css';
import {P051Session} from './nms-l02-p051-session-v1';
import {P051PracticeView} from './nms-l02-p051-practice-view-v1';
import {P051IntroView} from './nms-l02-p051-intro-view-v1';
import {P051_TEXT, type P051Language} from './nms-l02-p051-text-v1';
import {type P051Event} from './nms-l02-p051-practice-v1';
import type {P051TransportDependencies} from './nms-l02-p051-audio-transport-v1';
export interface P051PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P051PlayerProps {
 language:P051Language; readAudio:P051TransportDependencies['read']; volume?:number;paused?:boolean;
 reducedMotion?:boolean;showControls?:boolean;connectControls?:(controls:P051PlayerControls)=>()=>void;
 onPaused?:(paused:boolean)=>void;onComplete?:()=>void;onReplay?:()=>void;
 onState?:(state:ReturnType<P051Session['snapshot']>)=>void;
}
export function P051Player(props:P051PlayerProps){
 const latest=React.useRef(props);latest.current=props;
 const session=React.useRef<P051Session|null>(null),raf=React.useRef<number|null>(null);
 const lastPaused=React.useRef<boolean|null>(null),completed=React.useRef(-1),modalOpen=React.useRef(false);
 const [snapshot,setSnapshot]=React.useState<ReturnType<P051Session['snapshot']>|null>(null);
 const publish=React.useCallback((current:P051Session)=>{
  if(session.current!==current)return;
  const next=current.snapshot();setSnapshot(next);latest.current.onState?.(next);
  const paused=!next.running&&!next.loading;
  if(lastPaused.current!==paused){lastPaused.current=paused;latest.current.onPaused?.(paused);}
  if(next.state.phase==='complete'&&completed.current!==next.state.replay){completed.current=next.state.replay;latest.current.onComplete?.();}
 },[]);
 const schedule=React.useCallback(function scheduleTick(current:P051Session){
  if(session.current!==current||raf.current!==null)return;
  const next=current.snapshot();if(!next.running&&!next.loading)return;
  raf.current=requestAnimationFrame(async()=>{raf.current=null;await current.tick();if(session.current!==current)return;publish(current);scheduleTick(current);});
 },[publish]);
 const act=React.useCallback(async(event:P051Event|'play'|'pause')=>{
  const current=session.current;if(!current)return;
  if(event==='play'&&modalOpen.current)return;
  const pending=event==='play'?current.play():event==='pause'?current.pause():current.event(event);
  publish(current);schedule(current);await pending;if(session.current!==current)return;
  if(typeof event!=='string'&&event.type==='replay')latest.current.onReplay?.();
  lastPaused.current=null;publish(current);schedule(current);
 },[publish,schedule]);
 React.useEffect(()=>{
  const current=new P051Session({read:(domain,signal)=>latest.current.readAudio(domain,signal)});
  session.current=current;completed.current=-1;lastPaused.current=null;current.setVolume(latest.current.volume??.8);publish(current);
  const disconnect=latest.current.connectControls?.({setPaused:value=>{if(session.current===current)void act(value?'pause':'play');},replay:()=>{if(session.current!==current)return false;void act({type:'replay'});return true;},narration:action=>{if(session.current!==current)return;current.setNarration(action==='play');if(action==='play')void act('play');else publish(current);},stop:()=>{if(session.current!==current)return;void current.close();publish(current);}});
  const visibility=()=>{if(document.hidden){current.pause();publish(current);}};document.addEventListener('visibilitychange',visibility);
  return()=>{session.current=null;if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;disconnect?.();document.removeEventListener('visibilitychange',visibility);void current.close();};
 },[act,publish]);
 React.useEffect(()=>{session.current?.setVolume(props.volume??.8);},[props.volume]);
 React.useEffect(()=>{if(props.paused!==undefined)void act(props.paused?'pause':'play');},[props.paused,act]);
 if(!snapshot)return null;
 const es=props.language==='es';
 const glossaryOpen=()=>{modalOpen.current=true;session.current?.pause();if(session.current)publish(session.current);};
 const glossaryClose=()=>{modalOpen.current=false;if(session.current)publish(session.current);};
 const visibleTerms:readonly P051GlossaryId[]=snapshot.state.phase==='intro'
  ?p051IntroScene(Math.min(snapshot.frame,484)).filter(object=>object.alpha>0&&(object.characterId===62||object.characterId===63)).map(object=>object.characterId===62?'equivalent-decimal':'column')
  :['equivalent-decimal','column'];
 return <div className="p051-practice" data-p051-player-frame={snapshot.frame} data-p051-player-phase={snapshot.state.phase}>
  {snapshot.state.phase!=='intro'&&<p>{P051_TEXT[props.language].title}</p>}
  <P051Glossary key={snapshot.state.replay} scope="main" visibleIds={visibleTerms} language={props.language} disabled={snapshot.closed||snapshot.loading||snapshot.state.phase==='wrong-feedback'} onOpen={glossaryOpen} onClose={glossaryClose}/>
  {snapshot.failure&&<p role="alert">{es?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  {snapshot.state.phase==='intro'?<P051IntroView frame={Math.min(snapshot.frame,484)} language={props.language} reducedMotion={props.reducedMotion}/>:snapshot.state.phase==='outro'||snapshot.state.phase==='complete'?<P051OutroView language={props.language} complete={snapshot.state.phase==='complete'}/>:<P051PracticeView state={snapshot.state} language={props.language} interactive={!snapshot.loading&&!snapshot.closed&&!snapshot.failure} modalSuspended={modalOpen.current} wrongGlossary={<P051Glossary scope="wrong" language={props.language} disabled={snapshot.closed||snapshot.loading} onOpen={glossaryOpen} onClose={glossaryClose}/>} onEvent={event=>{void act(event);}}/>}
  {props.showControls!==false&&<div className="p051-player-controls">
   <button type="button" disabled={snapshot.loading||snapshot.closed} onClick={()=>{void act(snapshot.running?'pause':'play');}}>{snapshot.running?(es?'Pausar':'Pause'):(es?'Reproducir':'Play')}</button>
   <button type="button" disabled={snapshot.closed} onClick={()=>{void act({type:'replay'});}}>{es?'Repetir':'Replay'}</button>
  </div>}
 </div>;
}
