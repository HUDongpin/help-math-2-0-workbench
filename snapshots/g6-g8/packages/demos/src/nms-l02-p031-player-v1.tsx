'use client';
import{useEffect,useMemo,useRef,useState}from'react';
import{P031SourceAudio,type P031AudioSnapshot,type P031AudioDependencies}from'./nms-l02-p031-audio-v1';
import{P031Question}from'./nms-l02-p031-question-v1';
import{P031HelpDialog}from'./nms-l02-p031-help-v1';
import{P031FeedbackPresentation}from'./nms-l02-p031-feedback-presentation-v1';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{createP031TermHost,p031SourceTerm}from'./nms-l02-p031-term-host-v1';
import{NmsL2P031TermDialog}from'./nms-l02-p031-term-dialog-v1';
export interface P031PlayerControls{setPaused(paused:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P031PlayerProps{readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;readonly readAudio:P031AudioDependencies['read'];readonly connectControls?:(controls:P031PlayerControls)=>()=>void;readonly onState?:(s:P031AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;}
const isPaused=(s:P031AudioSnapshot)=>!['playing','waiting'].includes(s.phase)||s.state.help;
export function NmsL2P031Player(props:P031PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P031SourceAudio|null>(null),termOpen=useRef<string|null>(null),seenPaused=useRef(false),helpTrigger=useRef<HTMLElement|null>(null),host=useMemo(createP031TermHost,[props.seed]);const[snapshot,setSnapshot]=useState<P031AudioSnapshot|null>(null),[term,setTerm]=useState<{id:string;trigger:HTMLElement}|null>(null);
 const closeTerm=()=>{const s=engine.current?.snapshot();if(s)host.dispatch({type:'close-keyterm'},s.state);termOpen.current=null;setTerm(null);};
 useEffect(()=>{let active=true,raf:number|null=null,lastState:P031AudioSnapshot['state']|null=null,lastPhase='',completed=-1;termOpen.current=null;setTerm(null);
  const publish=(s:P031AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);if(s.phase==='failed')latest.current.onPaused?.(true);if(s.phase==='completed'&&completed!==s.state.replay){completed=s.state.replay;latest.current.onComplete?.();latest.current.onPaused?.(true);}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.state!==lastState||s.phase!==lastPhase){lastState=s.state;lastPhase=s.phase;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P031SourceAudio({seed:props.seed,read:(d,s)=>latest.current.readAudio(d,s),changed:s=>{if(!active)return;publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const resume=()=>{if(termOpen.current||session.snapshot().state.help){latest.current.onPaused?.(true);return;}void session.play().then(()=>{if(active)latest.current.onPaused?.(isPaused(session.snapshot()));});};
  const controls:P031PlayerControls={setPaused(value){if(!active)return;if(value){session.pause();latest.current.onPaused?.(true);}else resume();},replay(){if(!active)return false;closeTerm();void session.replay().then(()=>{if(active)latest.current.onPaused?.(isPaused(session.snapshot()));});latest.current.onReplay?.();return true;},narration(action){if(!active)return;if(action==='play'&&(termOpen.current||session.snapshot().state.help)){latest.current.onPaused?.(true);return;}session.setNarrationEnabled(action==='play');if(action==='play')resume();},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed,host]);
 useEffect(()=>{engine.current?.setVolume(props.volume)},[props.volume]);useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current){const s=engine.current?.snapshot();if(termOpen.current||s?.state.help||s?.phase==='completed'){latest.current.onPaused?.(true);return;}void engine.current?.play();}},[props.paused]);
 if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 const definition=term?p031SourceTerm(term.id):undefined;
 const openTerm=(id:string,trigger:HTMLElement)=>{const s=engine.current?.snapshot();if(!s||s.phase==='closed')return;const decision=host.dispatch({type:'open-keyterm',entryId:id,sourceAnimationId:'shared-nms002-l02-p031',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},s.state);if(decision.status!=='allowed')return;termOpen.current=id;setTerm({id,trigger});engine.current?.pause();latest.current.onPaused?.(true);};
 const acted=(action:()=>Promise<boolean>|undefined)=>{void action()?.then(()=>{const s=engine.current?.snapshot();if(s)latest.current.onPaused?.(isPaused(s));});};
 return <div data-p031-audio-phase={snapshot.phase} data-p031-audio-frame={snapshot.state.mainFrame} data-p031-audio-domain={snapshot.state.domain}>
 {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
 <div hidden={snapshot.state.feedback!==null}><P031Question state={snapshot.state} language={props.uiLanguage} reducedMotion={props.reducedMotion} interactionEnabled={!isPaused(snapshot)&&term===null} onAnswer={i=>acted(()=>engine.current?.answer(i))} onHelp={trigger=>{helpTrigger.current=trigger;if(engine.current?.openHelp())latest.current.onPaused?.(true)}} onTerm={openTerm}/></div>
 {snapshot.state.feedback&&<><LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/><P031FeedbackPresentation state={snapshot.state} language={props.uiLanguage} reducedMotion={props.reducedMotion} onClose={()=>acted(()=>engine.current?.closeFeedback())}/></>}
 {snapshot.state.help&&<P031HelpDialog language={props.uiLanguage} trigger={helpTrigger.current} onClose={()=>{engine.current?.closeHelp();latest.current.onPaused?.(true)}} onTermOpened={()=>{engine.current?.pause();latest.current.onPaused?.(true)}}/>}

 {term&&definition&&<NmsL2P031TermDialog term={definition} language={props.uiLanguage} trigger={term.trigger} onClose={closeTerm}/>}
 </div>;
}
