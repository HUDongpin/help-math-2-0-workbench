'use client';
import {useEffect,useRef,useState} from 'react';
import {P016SourceAudio,type P016AudioSnapshot,type P016AudioDependencies} from './nms-l02-p016-audio-v1';
import {NmsL2P016Presentation} from './nms-l02-p016-presentation-v1';
import {p016Initial,P016_ID} from './nms-l02-p016-state-v1';
import {p016SourceTerm,createP016TermHost} from './nms-l02-p016-term-host-v1';
import {NmsL2P016TermDialog} from './nms-l02-p016-term-dialog-v1';
export interface P016PlayerControls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P016PlayerProps {readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;readonly readAudio:P016AudioDependencies['read'];readonly connectControls?:(controls:P016PlayerControls)=>()=>void;readonly onState?:(s:P016AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;}
export function NmsL2P016Player(props:P016PlayerProps) {
 const latest=useRef(props);latest.current=props;const engine=useRef<P016SourceAudio|null>(null),seenPaused=useRef(false),host=useRef(createP016TermHost()),termRef=useRef<{id:string;trigger:HTMLElement}|null>(null);
 const [snapshot,setSnapshot]=useState<P016AudioSnapshot|null>(null),[term,setTerm]=useState<{id:string;trigger:HTMLElement}|null>(null);
 termRef.current=term;
 useEffect(()=>{
  setTerm(null);host.current=createP016TermHost();let active=true,raf:number|null=null,last='',completed=-1;
  const publish=(s:P016AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);if(s.phase==='waiting'||s.phase==='completed')latest.current.onPaused?.(true);if(s.phase==='completed'&&completed!==s.state.replay){completed=s.state.replay;latest.current.onComplete?.();}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot(),key=JSON.stringify([s.phase,s.state]);if(key!==last){last=key;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P016SourceAudio({seed:props.seed,read:(d,s)=>latest.current.readAudio(d,s),changed:s=>{publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const controls:P016PlayerControls={setPaused(value){if(!active)return;if(value||termRef.current){session.pause();latest.current.onPaused?.(true);}else void session.play().then(ok=>{if(active)latest.current.onPaused?.(!ok);});},replay(){if(!active)return false;setTerm(null);termRef.current=null;host.current=createP016TermHost();void session.replay().then(ok=>{if(active)latest.current.onPaused?.(!ok);});latest.current.onReplay?.();return true;},narration(action){session.setNarrationEnabled(action==='play');if(action==='play'&&!termRef.current)void session.play().then(ok=>{if(active)latest.current.onPaused?.(!ok);});},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current&&!termRef.current)void engine.current?.play();},[props.paused]);
 const s=snapshot?.state??p016Initial(props.seed),definition=term?p016SourceTerm(term.id):undefined;
 const result=(p:Promise<boolean>|undefined)=>{void p?.then(ok=>latest.current.onPaused?.(!ok));};
 return <div data-p016-audio-phase={snapshot?.phase??'paused'} data-p016-narration={snapshot?.narrationEnabled?'enabled':'disabled'}>
  {snapshot?.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <NmsL2P016Presentation state={s} language={props.uiLanguage} reducedMotion={props.reducedMotion} disabled={snapshot?.phase==='failed'||snapshot?.phase==='loading'||!!term}
   onShaded={count=>engine.current?.setShaded(count)} onDigit={(i,value)=>engine.current?.setDigit(i,value)}
   onDragStart={()=>engine.current?.dragStart()??false} onDragEnd={cancel=>engine.current?.dragEnd(cancel)}
   onSubmit={()=>result(engine.current?.submit())} onPress={kind=>result(engine.current?.press(kind))} onRelease={activate=>result(engine.current?.release(activate))} onClose={()=>result(engine.current?.closeFeedback())}
   onTerm={(id,trigger)=>{if(!p016SourceTerm(id))return;const decision=host.current.dispatch({type:'open-keyterm',entryId:id,sourceAnimationId:P016_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},s);if(decision.status!=='allowed')return;engine.current?.pause();latest.current.onPaused?.(true);setTerm({id,trigger});}}/>
  {term&&definition&&<NmsL2P016TermDialog term={definition} language={props.uiLanguage} trigger={term.trigger} onClose={()=>{host.current.dispatch({type:'close-keyterm'},s);setTerm(null);}}/>}
 </div>;
}
