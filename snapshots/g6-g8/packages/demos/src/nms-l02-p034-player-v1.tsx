'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {P034SourceAudio,type P034AudioSnapshot,type P034AudioDependencies} from './nms-l02-p034-audio-v1';
import {P034Practice} from './nms-l02-p034-practice-v1';
import {createP034TermHost,p034SourceTerm} from './nms-l02-p034-term-host-v1';
import {NmsL2P034TermDialog} from './nms-l02-p034-term-dialog-v1';
import {P034_ID} from './nms-l02-p034-state-v1';
export interface P034PlayerControls {setPaused(paused:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P034PlayerProps {readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;readonly readAudio:P034AudioDependencies['read'];readonly connectControls?:(controls:P034PlayerControls)=>()=>void;readonly onState?:(s:P034AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;}
const paused=(s:P034AudioSnapshot)=>!['playing','waiting'].includes(s.phase)||s.state.termOpen;
/** Open-ended exploration has no invented correct-answer or completion event. */
export function NmsL2P034Player(props:P034PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P034SourceAudio|null>(null),trigger=useRef<HTMLElement|null>(null),seenPaused=useRef(false),host=useMemo(createP034TermHost,[props.seed]);const[snapshot,setSnapshot]=useState<P034AudioSnapshot|null>(null);
 useEffect(()=>{
  let active=true,raf:number|null=null,lastState:P034AudioSnapshot['state']|null=null,lastPhase='';
  const publish=(s:P034AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);if(s.phase==='failed')latest.current.onPaused?.(true);};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.state!==lastState||s.phase!==lastPhase){lastState=s.state;lastPhase=s.phase;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P034SourceAudio({seed:props.seed,read:(d,s)=>latest.current.readAudio(d,s),changed:s=>{if(!active)return;publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const resume=()=>{if(session.snapshot().state.termOpen){latest.current.onPaused?.(true);return;}void session.play().then(()=>{if(active)latest.current.onPaused?.(paused(session.snapshot()));});};
  const controls:P034PlayerControls={setPaused(value){if(!active)return;if(value){session.pause();latest.current.onPaused?.(true);}else resume();},replay(){if(!active)return false;host.dispatch({type:'close-keyterm'},session.snapshot().state);void session.replay().then(()=>{if(active)latest.current.onPaused?.(paused(session.snapshot()));});latest.current.onReplay?.();return true;},narration(action){if(!active)return;if(action==='play'&&session.snapshot().state.termOpen){latest.current.onPaused?.(true);return;}session.setNarrationEnabled(action==='play');if(action==='play')resume();},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed,host]);
 useEffect(()=>{engine.current?.setVolume(props.volume)},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current){const s=engine.current?.snapshot();if(s?.state.termOpen){latest.current.onPaused?.(true);return;}void engine.current?.play();}},[props.paused]);
 if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 const term=p034SourceTerm('decimal')!;
 return <div data-p034-audio-phase={snapshot.phase} data-p034-audio-frame={snapshot.state.mainFrame} data-p034-reset-sound={snapshot.resetSoundPlaying}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <P034Practice state={snapshot.state} language={props.uiLanguage} reducedMotion={props.reducedMotion} interactionEnabled={['playing','waiting','paused'].includes(snapshot.phase)} onValue={v=>engine.current?.setValue(v)} onDragStart={()=>engine.current?.beginDrag()} onDragEnd={()=>engine.current?.endDrag()} onResetPress={()=>{void engine.current?.pressReset()}} onResetCancel={()=>{engine.current?.cancelReset()}} onReset={()=>{engine.current?.reset()}} onTerm={node=>{
   const session=engine.current,s=session?.snapshot();if(!session||!s||!['playing','waiting','paused'].includes(s.phase))return;
   const decision=host.dispatch({type:'open-keyterm',entryId:'decimal',sourceAnimationId:P034_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},s.state);
   if(decision.status==='allowed'&&session.openTerm()){trigger.current=node;latest.current.onPaused?.(true);}
  }}/>
  {snapshot.state.termOpen&&<NmsL2P034TermDialog term={term} language={props.uiLanguage} trigger={trigger.current} onClose={()=>{const session=engine.current;if(!session)return;host.dispatch({type:'close-keyterm'},session.snapshot().state);session.closeTerm();latest.current.onPaused?.(true);}}/>}
 </div>;
}
