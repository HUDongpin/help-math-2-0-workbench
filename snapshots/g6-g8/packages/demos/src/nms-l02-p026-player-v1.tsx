'use client';
import{useEffect,useMemo,useRef,useState}from'react';
import{P026SourceAudio,type P026AudioDependencies,type P026AudioSnapshot}from'./nms-l02-p026-audio-v1';
import{NmsL2P026Presentation,type P026TermKey}from'./nms-l02-p026-presentation-v1';
import{createP026TermHost,P026_TERM_ENTRIES,p026SourceTerm}from'./nms-l02-p026-term-host-v1';
import{NmsL2P026TermDialog}from'./nms-l02-p026-term-dialog-v1';
export interface P026PlayerControls{setPaused(paused:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P026PlayerProps{readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;readonly readAudio:P026AudioDependencies['read'];readonly connectControls?:(controls:P026PlayerControls)=>()=>void;readonly onState?:(state:P026AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;}
/** User pause stops both clocks. Source quiz stops leave the native board active. */
export function NmsL2P026Player(props:P026PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P026SourceAudio|null>(null),selectionRef=useRef<string|null>(null),observedPaused=useRef(false);
 const[snapshot,setSnapshot]=useState<P026AudioSnapshot|null>(null),[selection,setSelection]=useState<{id:string;trigger:HTMLElement}|null>(null),host=useMemo(createP026TermHost,[props.seed]);
 const close=()=>{const s=engine.current?.snapshot();if(s)host.dispatch({type:'close-keyterm'},s.clock.game);selectionRef.current=null;setSelection(null);};
 useEffect(()=>{let active=true,raf:number|null=null,lastGame:P026AudioSnapshot['clock']['game']|null=null,lastPhase='',lastNarration=false,completedReplay=-1;selectionRef.current=null;setSelection(null);
  const publish=(s:P026AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);if(s.phase==='completed'&&completedReplay!==s.clock.game.replay){completedReplay=s.clock.game.replay;latest.current.onComplete?.();latest.current.onPaused?.(true);}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.clock.game!==lastGame||s.phase!==lastPhase||s.narrationActive!==lastNarration){lastGame=s.clock.game;lastPhase=s.phase;lastNarration=s.narrationActive;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P026SourceAudio({seed:props.seed,read:signal=>latest.current.readAudio(signal),changed:s=>{if(!active)return;publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const controls:P026PlayerControls={setPaused(value){if(!active)return;if(!value&&(selectionRef.current!==null||session.snapshot().phase==='completed')){latest.current.onPaused?.(true);return;}if(value)session.pause();else void session.play();latest.current.onPaused?.(value);},replay(){if(!active)return false;selectionRef.current=null;setSelection(null);host.dispatch({type:'close-keyterm'},session.snapshot().clock.game);void session.replay();latest.current.onReplay?.();latest.current.onPaused?.(false);return true;},narration(action){if(!active)return;if(action==='play'&&selectionRef.current!==null){latest.current.onPaused?.(true);return;}session.setNarrationEnabled(action==='play');if(action==='play'&&session.snapshot().phase!=='completed'){void session.play();latest.current.onPaused?.(false);}},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(document.hidden&&active){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed,host]);
 useEffect(()=>{engine.current?.setVolume(props.volume)},[props.volume]);
 useEffect(()=>{if(props.paused){observedPaused.current=true;engine.current?.pause();}else if(observedPaused.current){if(selectionRef.current!==null){engine.current?.pause();latest.current.onPaused?.(true);}else if(engine.current?.snapshot().phase==='completed')latest.current.onPaused?.(true);else void engine.current?.play();}},[props.paused]);
 if(!snapshot)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 const term=selection?p026SourceTerm(selection.id):undefined;
 const open=(key:P026TermKey,trigger:HTMLButtonElement)=>{const current=engine.current?.snapshot();if(!current)return;const id=P026_TERM_ENTRIES[key],decision=host.dispatch({type:'open-keyterm',entryId:id,sourceAnimationId:'shared-nms002-l02-p026',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},current.clock.game);if(decision.status!=='allowed')return;selectionRef.current=id;setSelection({id,trigger});engine.current?.pause();latest.current.onPaused?.(true);};
 return <div data-p026-audio-phase={snapshot.phase} data-p026-audio-frame={snapshot.clock.game.mainFrame} data-p026-audio-active={snapshot.narrationActive}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <NmsL2P026Presentation state={snapshot.clock.game} language={props.uiLanguage} paused={snapshot.clock.paused} reducedMotion={props.reducedMotion} onChoose={id=>{engine.current?.choose(id)}} onTerm={open}/>
  {term&&selection&&<NmsL2P026TermDialog term={term} language={props.uiLanguage} trigger={selection.trigger} onClose={close}/>}
 </div>;
}
