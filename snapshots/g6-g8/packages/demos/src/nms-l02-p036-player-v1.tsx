'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {P036SourceAudio,type P036AudioSnapshot,type P036AudioDependencies} from './nms-l02-p036-audio-v1';
import {P036Explanation} from './nms-l02-p036-explanation-v1';
import {createP036TermHost,p036SourceTerm} from './nms-l02-p036-term-host-v1';
import {NmsL2P036TermDialog} from './nms-l02-p036-term-dialog-v1';
import {prepareP036Images} from './nms-l02-p036-images-v1';
import {P036_ID} from './nms-l02-p036-state-v1';
export interface P036PlayerControls {setPaused(paused:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P036PlayerProps {readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;readonly readAudio:P036AudioDependencies['read'];readonly connectControls?:(controls:P036PlayerControls)=>()=>void;readonly onState?:(s:P036AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;}
const paused=(s:P036AudioSnapshot)=>!['playing'].includes(s.phase)||s.state.term!==null;
/** Native full853frame completion is a qualified terminal hold, never a claim
 * that the source timeline has an authored stop or that fidelity is accepted. */
export function NmsL2P036Player(props:P036PlayerProps){
 const imageReady=useRef(false),[assetsReady,setAssetsReady]=useState(false),[assetFailure,setAssetFailure]=useState(false);
 useEffect(()=>{let active=true;void prepareP036Images().then(()=>{if(active){imageReady.current=true;setAssetsReady(true)}}).catch(()=>{if(active){setAssetFailure(true);latest.current.onPaused?.(true)}});return()=>{active=false;imageReady.current=false}},[]);
 const latest=useRef(props);latest.current=props;const engine=useRef<P036SourceAudio|null>(null),trigger=useRef<HTMLElement|null>(null),seenPaused=useRef(false),host=useMemo(createP036TermHost,[props.seed]);const[snapshot,setSnapshot]=useState<P036AudioSnapshot|null>(null);
 useEffect(()=>{
  let active=true,raf:number|null=null,lastState:P036AudioSnapshot['state']|null=null,lastPhase='',completedReplay=-1;
  const publish=(s:P036AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);if(s.phase==='failed')latest.current.onPaused?.(true);if(s.state.phase==='terminal'&&completedReplay!==s.state.replay){completedReplay=s.state.replay;latest.current.onPaused?.(true);latest.current.onComplete?.();}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot();if(s.state!==lastState||s.phase!==lastPhase){lastState=s.state;lastPhase=s.phase;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P036SourceAudio({seed:props.seed,read:(d,s)=>latest.current.readAudio(d,s),changed:s=>{if(!active)return;publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const resume=()=>{if(!imageReady.current){latest.current.onPaused?.(true);return;}if(session.snapshot().state.term!==null){latest.current.onPaused?.(true);return;}void session.play().then(()=>{if(active)latest.current.onPaused?.(paused(session.snapshot()));});};
  const controls:P036PlayerControls={setPaused(value){if(!active)return;if(value){session.pause();latest.current.onPaused?.(true);}else resume();},replay(){if(!active||!imageReady.current)return false;host.dispatch({type:'close-keyterm'},session.snapshot().state);void session.replay().then(()=>{if(active)latest.current.onPaused?.(paused(session.snapshot()));});latest.current.onReplay?.();return true;},narration(action){if(!active)return;if(action==='play'&&session.snapshot().state.term!==null){latest.current.onPaused?.(true);return;}session.setNarrationEnabled(action==='play');if(action==='play')resume();},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed,host]);
 useEffect(()=>{engine.current?.setVolume(props.volume)},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current&&imageReady.current){const s=engine.current?.snapshot();if(s&&s.state.term!==null){latest.current.onPaused?.(true);return;}void engine.current?.play();}},[props.paused]);
 if(assetFailure)return <p role="alert">{props.uiLanguage==='es'?'La imagen no está disponible.':'The image is unavailable.'}</p>;
 if(!snapshot||!assetsReady)return <p role="status">{props.uiLanguage==='es'?'Cargando…':'Loading…'}</p>;
 const term=snapshot.state.term?p036SourceTerm(snapshot.state.term):undefined;
 return <div data-p036-assets="ready" data-p036-audio-phase={snapshot.phase} data-p036-audio-frame={snapshot.state.mainFrame}>
  {snapshot.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <P036Explanation state={snapshot.state} language={props.uiLanguage} reducedMotion={props.reducedMotion} interactionEnabled={['playing','terminal','paused'].includes(snapshot.phase)} onTerm={(id,node)=>{
   const session=engine.current,s=session?.snapshot();if(!session||!s||!['playing','terminal','paused'].includes(s.phase))return;
   const decision=host.dispatch({type:'open-keyterm',entryId:id,sourceAnimationId:P036_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},s.state);
   if(decision.status==='allowed'&&session.openTerm(id)){trigger.current=node;latest.current.onPaused?.(true);}
  }}/>
  {snapshot.state.term!==null&&term&&<NmsL2P036TermDialog term={term} language={props.uiLanguage} trigger={trigger.current} onClose={()=>{const session=engine.current;if(!session)return;host.dispatch({type:'close-keyterm'},session.snapshot().state);session.closeTerm();latest.current.onPaused?.(true);}}/>}
 </div>;
}
