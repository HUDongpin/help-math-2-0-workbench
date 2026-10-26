import React from 'react';
import {P048_COPY} from './nms-l02-p048-copy-v1';
import {P048Effects,p048EffectForEvent} from './nms-l02-p048-effects-v1';
import {P048Session} from './nms-l02-p048-session-v1';
import {P048PracticeView} from './nms-l02-p048-practice-view-v1';
import type {P048TransportDependencies} from './nms-l02-p048-audio-transport-v1';
import type {P048Event} from './nms-l02-p048-practice-v1';
import './nms-l02-p048-view-v1.css';
export interface P048PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P048PlayerProps {
 paused?:boolean;showControls?:boolean;connectControls?:(controls:P048PlayerControls)=>()=>void;
 onPaused?:(value:boolean)=>void;onReplay?:()=>void;onComplete?:()=>void;
 readAudio:P048TransportDependencies['read'];
 language:'en'|'es'; seed?:number; volume?:number;
 renderIntro:(frame:number,onModalChange:(open:boolean)=>void)=>React.ReactNode;
 onState?:(snapshot:ReturnType<P048Session['snapshot']>)=>void;
}
export function P048Player(props:P048PlayerProps){
 const latest=React.useRef(props);latest.current=props;
 const session=React.useRef<P048Session|null>(null),raf=React.useRef<number|null>(null),active=React.useRef(false);
 const lastPaused=React.useRef<boolean|null>(null),completedReplay=React.useRef(-1),seenPaused=React.useRef(false);
 const effects=React.useRef<P048Effects|null>(null);
 const [effectFailure,setEffectFailure]=React.useState(false);
 const [snapshot,setSnapshot]=React.useState<ReturnType<P048Session['snapshot']>|null>(null);
 const publish=React.useCallback(()=>{if(!active.current||!session.current)return;const next=session.current.snapshot();setSnapshot(next);latest.current.onState?.(next);const paused=!next.running&&!next.loading;if(lastPaused.current!==paused){lastPaused.current=paused;latest.current.onPaused?.(paused);}if(next.state.phase==='complete'&&completedReplay.current!==next.state.replay){completedReplay.current=next.state.replay;latest.current.onComplete?.();}},[]);
 const schedule=React.useCallback(function scheduleTick(){
  if(!active.current||raf.current!==null)return;
  const current=session.current;if(!current)return;
  const status=current.snapshot();if(!status.running&&!status.loading)return;
  raf.current=requestAnimationFrame(async()=>{raf.current=null;await current.tick();if(!active.current||session.current!==current)return;publish();const state=current.snapshot();const fx=effects.current;if(fx)void fx.intro(state.frame,state.state.replay).catch(()=>{if(active.current&&effects.current===fx)setEffectFailure(true);});scheduleTick();});
 },[publish]);
 React.useEffect(()=>{
  active.current=true;lastPaused.current=null;completedReplay.current=-1;seenPaused.current=false;const fx=new P048Effects({read:(domain,signal)=>latest.current.readAudio(domain,signal)});effects.current=fx;fx.setVolume(latest.current.volume??0.8);setEffectFailure(false);const current=new P048Session({read:(domain,signal)=>latest.current.readAudio(domain,signal)},props.seed??0);session.current=current;current.setVolume(latest.current.volume??0.8);publish();
  const disconnect=latest.current.connectControls?.({setPaused:value=>{if(active.current&&session.current===current)void act(value?'pause':'play');},replay:()=>{if(!active.current||session.current!==current)return false;void act({type:'replay'});return true;},narration:action=>{if(!active.current||session.current!==current)return;current.setNarration(action==='play');if(action==='play')void act('play');else publish();},stop:()=>{if(session.current!==current)return;void current.close();void fx.close();publish();}});
  const visibility=()=>{if(document.hidden){current.pause();fx.pause();publish();}};document.addEventListener('visibilitychange',visibility);
  return ()=>{active.current=false;if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;document.removeEventListener('visibilitychange',visibility);disconnect?.();if(session.current===current)session.current=null;void current.close();if(effects.current===fx)effects.current=null;void fx.close();};
 },[props.seed,publish]);
 React.useEffect(()=>{session.current?.setVolume(props.volume??0.8);effects.current?.setVolume(props.volume??0.8);},[props.volume]);
 React.useEffect(()=>{if(props.paused===true){seenPaused.current=true;session.current?.pause();effects.current?.pause();publish();}else if(props.paused===false&&seenPaused.current){void session.current?.play().then(()=>{publish();schedule();});}},[props.paused,publish,schedule]);
 const act=async(event:P048Event|'play'|'pause')=>{
  const current=session.current;if(!current)return;
  const fx=effects.current;if(event==='pause')fx?.pause();
  if(typeof event!=='string'){if(event.type==='replay'){fx?.reset();setEffectFailure(false);}else{const domain=p048EffectForEvent(current.snapshot().state,event);if(domain&&fx)void fx.play(domain).catch(()=>{if(active.current&&effects.current===fx)setEffectFailure(true);});}}
  const pending=event==='play'?current.play():event==='pause'?current.pause():current.event(event);
  publish();schedule();await pending;
  if(typeof event!=='string'&&event.type==='replay'&&session.current===current&&active.current)latest.current.onReplay?.();
  if(session.current!==current||!active.current)return;publish();schedule();
 };
 if(!snapshot)return null;
 const es=props.language==='es';
 return <div data-p048-player-frame={snapshot.frame} data-p048-player-phase={snapshot.state.phase}>
  <p className="p048-course-title" lang={props.language}>{P048_COPY[props.language].title}</p>
  {(snapshot.failure||effectFailure)&&<p role="alert">{es?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  {snapshot.state.phase==='intro'?props.renderIntro(snapshot.frame,open=>{if(open){session.current?.pause();effects.current?.pause();publish();}}):<P048PracticeView state={snapshot.state} language={props.language} interactive={!snapshot.loading&&!snapshot.closed&&!snapshot.failure} onEvent={e=>{void act(e);}}/>}
  {props.showControls!==false&&<div className="p048-input-actions">
   <button type="button" disabled={snapshot.loading} onClick={()=>{void act(snapshot.running?'pause':'play');}}>{snapshot.running?(es?'Pausar':'Pause'):(es?'Reproducir':'Play')}</button>
   <button type="button" onClick={()=>{void act({type:'replay'});}}>{es?'Repetir':'Replay'}</button>
  </div>}
 </div>;
}
