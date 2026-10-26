"use client";
import {useEffect,useRef,useState} from 'react';import {flushSync} from 'react-dom';
import {AlgL10P004Session,type AlgL10P004Dependencies} from './alg-l10-p004-session-v2';
import {algL10P004Frame} from './alg-l10-p004-state-v1';import {AlgL10P004Presentation} from './alg-l10-p004-presentation-v1';import './alg-l10-p004-player-v1.css';
export interface AlgL10P004Controls {setPaused(paused:boolean):void;replay():boolean;narration(action:'play'|'stop',language?:'en'|'es'):void;returnToMain():boolean;stop():void;inspect(frame:number):boolean;}
export interface AlgL10P004PlayerProps {seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;reducedMotion?:boolean;readAudio:AlgL10P004Dependencies['readAudio'];connectControls?:(controls:AlgL10P004Controls)=>()=>void;onState?:(state:ReturnType<AlgL10P004Session['snapshot']>)=>void;onPaused?:(paused:boolean)=>void;onReplay?:()=>void;}
/** Explicit controls own playback; mount/language/volume/paused=false never start it. */
export function AlgL10P004Player(props:AlgL10P004PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<AlgL10P004Session|null>(null);
 const [snapshot,setSnapshot]=useState<ReturnType<AlgL10P004Session['snapshot']>|null>(null),[frame,setFrame]=useState(1);
 useEffect(()=>{let active=true,raf:number|null=null,last='',lastPhase='';
  const update=()=>{if(!active)return;const s=session.snapshot(),key=JSON.stringify(s);if(key!==last){last=key;setSnapshot(s);setFrame(s.frame);latest.current.onState?.(s);}if(lastPhase!==s.phase){lastPhase=s.phase;latest.current.onPaused?.(!['playing','loading','start-pending'].includes(s.phase));}if(s.phase==='playing'){if(raf===null)raf=requestAnimationFrame(draw);}else if(raf!==null){cancelAnimationFrame(raf);raf=null;}};
  const draw=()=>{raf=null;update();};
  const session=new AlgL10P004Session({readAudio:(lang,signal)=>latest.current.readAudio(lang,signal),changed:update,commitFrame(value){if(!active)return false;flushSync(()=>setFrame(value));return true;}},latest.current.uiLanguage,props.seed);
  engine.current=session;session.setVolume(latest.current.volume??.8);update();
  const controls:AlgL10P004Controls={setPaused(value){if(!active)return;if(value)session.pause();else void session.play();},replay(){if(!active)return false;latest.current.onReplay?.();void session.replay();return true;},narration(action,lang=latest.current.uiLanguage){if(active)void session.narration(action,lang);},returnToMain(){return active&&session.returnToMain();},stop(){if(active)void session.close();},inspect(value){return active&&session.inspect(value);}};
  const disconnect=latest.current.connectControls?.(controls),hidden=()=>{if(document.hidden)session.pause();};document.addEventListener('visibilitychange',hidden);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);disconnect?.();document.removeEventListener('visibilitychange',hidden);if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);useEffect(()=>{engine.current?.setLanguage(props.uiLanguage);},[props.uiLanguage]);
 const state=algL10P004Frame(frame,{frame,frameDomain:'sprite-60',rootFrame:6,scenario:'source-static-frame',lang:props.uiLanguage,seed:props.seed,replay:snapshot?.replay??0});
 // Capture this exact engine and revision in the rendered action. An old render
 // cannot call a replacement engine through the mutable ref after navigation.
 const renderedEngine=engine.current,revision=snapshot?.ownerRevision??-1,es=props.uiLanguage==='es',playing=['playing','loading','start-pending'].includes(snapshot?.phase??'');
 return <div className="alg-l10-p004-player" data-p004-phase={snapshot?.phase??'initializing'} data-p004-mode={snapshot?.mode??'main'} data-p004-frame={snapshot?.frame??1} data-p004-replay={snapshot?.replay??0} data-p004-owner-revision={revision} data-p004-main-stopped={snapshot?.mainStopped??false} data-p004-main-stop-natural={snapshot?.mainStopReachedNaturally??false} data-p004-main-audio-phase={snapshot?.mainAudioPhase??'idle'} data-p004-spanish-audio-phase={snapshot?.spanishAudioPhase??'idle'}>
  <AlgL10P004Presentation state={state} glossary={snapshot?.glossary} onOpenGlossary={renderedEngine?(owner)=>{renderedEngine.openGlossary(owner,revision,props.uiLanguage);}:undefined} onCloseGlossary={renderedEngine?()=>{renderedEngine.closeGlossary(revision,props.uiLanguage);}:undefined}/>
  {!props.connectControls&&<div className="alg-l10-p004-player__controls" lang={props.uiLanguage}><button type="button" onClick={()=>playing?engine.current?.pause():void engine.current?.play()}>{playing?(es?'Pausa':'Pause'):(es?'Reanudar':'Resume')}</button><button type="button" onClick={()=>{latest.current.onReplay?.();void engine.current?.replay();}}>{es?'Repetir':'Replay'}</button><button type="button" onClick={()=>void engine.current?.narration('play',props.uiLanguage)}>{es?'Audio en español':'English audio'}</button></div>}
  {snapshot?.mode==='spanish'&&<div className="alg-l10-p004-player__return" lang={props.uiLanguage}><p>{es?'El audio en español se reproduce con la animación en pausa.':'Spanish audio plays while the animation is paused.'}</p><button type="button" onClick={()=>engine.current?.returnToMain()}>{es?'Volver a la animación':'Return to animation'}</button></div>}
  {snapshot?.failure&&<p role="alert" lang={props.uiLanguage}>{es?'No se pudo reproducir el audio. Inténtalo de nuevo.':'Audio could not play. Please try again.'}</p>}
 </div>;
}
