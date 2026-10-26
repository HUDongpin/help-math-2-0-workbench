'use client';
import React from 'react';
import {createP052BrowserController} from './nms-l02-p052-browser-controller-p056-v1';
import type {P052Controller,P052UserEvent} from './nms-l02-p052-controller-v1';
import {P052PageView} from './nms-l02-p052-page-view-v1';
import type {P052Language} from './nms-l02-p052-copy-v1';
export interface P052PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P052PlayerProps {
 language:P052Language;seed?:number;paused?:boolean;volume?:number;showControls?:boolean;
 connectControls?:(controls:P052PlayerControls)=>()=>void;
 onPaused?:(value:boolean)=>void;onReplay?:()=>void;onComplete?:()=>void;
 onState?:(value:ReturnType<P052Controller['snapshot']>)=>void;
}
/** Unregistered interactive player; CSS is imported by the eventual host entry.
 * UI language/volume changes do not reconstruct the controller or reset state. */
export function P052Player(props:P052PlayerProps){
 const latest=React.useRef(props);latest.current=props;
 const reducedMotion=React.useRef(false);
 const [motionNotice,setMotionNotice]=React.useState(false);
 const owner=React.useRef<P052Controller|null>(null),raf=React.useRef<number|null>(null);
 const lastPaused=React.useRef<boolean|null>(null),completed=React.useRef(-1);
 const [snapshot,setSnapshot]=React.useState<ReturnType<P052Controller['snapshot']>|null>(null);
 const publish=React.useCallback((current:P052Controller)=>{
  if(owner.current!==current)return;
  const next=current.snapshot();setSnapshot(next);latest.current.onState?.(next);
  const paused=!next.started||next.state.paused||next.closed||!!next.error||next.state.phase==='complete';
  if(lastPaused.current!==paused){lastPaused.current=paused;latest.current.onPaused?.(paused);}
  if(next.state.phase==='complete'&&completed.current!==next.state.epoch){completed.current=next.state.epoch;latest.current.onComplete?.();}
 },[]);
 const schedule=React.useCallback(function scheduleTick(current:P052Controller){
  if(owner.current!==current||raf.current!==null)return;
  const s=current.snapshot();
  if(s.closed||s.state.paused||!s.started||s.error||s.state.phase==='complete'||s.state.phase==='practice')return;
  raf.current=requestAnimationFrame(()=>{raf.current=null;if(owner.current!==current)return;current.tick();scheduleTick(current);});
 },[]);
 const act=React.useCallback(async(action:'play'|'pause'|P052UserEvent)=>{
  const current=owner.current;if(!current||current.snapshot().closed)return;
  const state=current.snapshot();
  const pending=action==='play'
   ?(!state.started&&!state.state.paused?current.start():current.dispatch({type:'pause',paused:false,epoch:state.state.epoch}))
   :action==='pause'?current.dispatch({type:'pause',paused:true,epoch:state.state.epoch}):current.dispatch(action,{autoplayReplay:!reducedMotion.current});
  publish(current);schedule(current);await pending;if(owner.current!==current)return;
  if(typeof action!=='string'&&action.type==='replay'&&current.snapshot().state.epoch!==state.state.epoch){
   latest.current.onReplay?.();
   // The host also resets its toolbar during Replay. Re-publish the runtime's
   // final pause state after that handoff, even when the value did not change.
   lastPaused.current=null;
  }
  publish(current);schedule(current);
 },[publish,schedule]);
 React.useEffect(()=>{
  const current=createP052BrowserController(()=>{publish(current);schedule(current);},props.seed??0);
  owner.current=current;lastPaused.current=null;completed.current=-1;
  current.setVolume(latest.current.volume??.8);publish(current);
  const disconnect=latest.current.connectControls?.({
   setPaused:value=>{if(owner.current===current)void act(value?'pause':'play');},
   replay:()=>{if(owner.current!==current||current.snapshot().closed)return false;void act({type:'replay',epoch:current.snapshot().state.epoch});return true;},
   narration:action=>{if(owner.current!==current)return;current.setNarration(action==='play');if(action==='play')void act('play');},
   stop:()=>{if(owner.current!==current)return;void current.close().then(()=>publish(current));},
  });
  const hide=()=>{if(document.hidden&&owner.current===current)void act('pause');};
  document.addEventListener('visibilitychange',hide);
  return()=>{owner.current=null;if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;
   disconnect?.();document.removeEventListener('visibilitychange',hide);void current.close();};
 },[props.seed,act,publish,schedule]);
 React.useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{reducedMotion.current=preference.matches;setMotionNotice(preference.matches);
   if(preference.matches)void act('pause');};
  update();preference.addEventListener('change',update);
  return()=>preference.removeEventListener('change',update);
 },[act,props.seed]);
 React.useEffect(()=>{owner.current?.setVolume(props.volume??.8);},[props.volume]);
 React.useEffect(()=>{if(props.paused!==undefined)void act(props.paused?'pause':'play');},[props.paused,props.seed,act]);
 if(!snapshot)return <p role="status">{props.language==='es'?'Cargando…':'Loading…'}</p>;
 const es=props.language==='es',paused=!snapshot.started||snapshot.state.paused;
 return <div className="p052-player" data-p052-player-phase={snapshot.state.phase} data-p052-audio-loading={snapshot.loading}>
  {motionNotice&&<p role="status">{es?'Movimiento reducido: Repetir vuelve al inicio en pausa. Usa Reproducir para ver la secuencia didáctica con narración; puedes pausarla en cualquier momento.':'Reduced motion: Replay returns to the start paused. Use Play to watch the narrated teaching sequence; you can pause at any time.'}</p>}
  {snapshot.error&&<p role="alert">{es?'El audio no está disponible. Usa Repetir para intentarlo de nuevo.':'Audio is unavailable. Use Replay to try again.'}</p>}
  {snapshot.clickError&&<p role="status">{es?'El sonido del botón no está disponible.':'Button sound is unavailable.'}</p>}
  <P052PageView state={snapshot.state} language={props.language} interactive={!snapshot.closed}
   onEvent={event=>{void act(event as P052UserEvent);}}/>
  {props.showControls!==false&&<div className="p052-actions">
   <button type="button" disabled={snapshot.closed||!!snapshot.error||snapshot.state.phase==='complete'} onClick={()=>{void act(paused?'play':'pause');}}>{paused?(es?'Reproducir':'Play'):(es?'Pausar':'Pause')}</button>
   <button type="button" disabled={snapshot.closed} onClick={()=>{void act({type:'replay',epoch:snapshot.state.epoch});}}>{es?'Repetir':'Replay'}</button>
  </div>}
 </div>;
}
