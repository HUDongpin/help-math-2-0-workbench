'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL07P002Player,type AlgL07P002Controls} from '../../../packages/demos/src/alg-l07-p002-player-v1';
import type {AlgL07P002Session} from '../../../packages/demos/src/alg-l07-p002-session-v1';
import {P002SpanishAudio,type P002SpanishSnapshot} from '@/lib/alg-l07-p002-spanish-audio-v1';
import {P002_STREAM_PIN,P002_SPANISH_PIN} from '@/lib/alg-l07-p002-local-request-v1';
import {P002ReturnGuard} from '@/lib/alg-l07-p002-return-v1';

const ID='shared-alg001-l07-p002';
const BINDING={frameCount:1195,frameDomain:'sprite-452',fps:12,companionIdSuffix:'-p002-source-readable',glossaryEntries:{}} as const;
type MainSnapshot=ReturnType<AlgL07P002Session['snapshot']>;
const readAudio=(signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,assetId:'source-stream',pin:P002_STREAM_PIN,origin:window.location.origin,signal,errorPrefix:'ALG_L07_P002_SOURCE_STREAM'});
const readSpanish=(signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,assetId:'optional-spanish-audio',pin:P002_SPANISH_PIN,origin:window.location.origin,signal,errorPrefix:'ALG_L07_P002_OPTIONAL_SA'});

export function G678AlgL07P002RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING),latest=useRef(props);latest.current=props;
 const main=useRef<AlgL07P002Controls|null>(null),mainState=useRef<MainSnapshot|null>(null),spanish=useRef<P002SpanishAudio|null>(null),selected=useRef(false);
 const returnGate=useRef(new P002ReturnGuard()),replayPending=useRef(false);
 const cancelPending=useCallback(()=>{returnGate.current.cancel();replayPending.current=false;},[]);
 const [ready,setReady]=useState(false),[saSelected,setSaSelected]=useState(false),[saState,setSaState]=useState<P002SpanishSnapshot>({phase:'idle',failure:null,lessonCompleted:false});
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-452'&&props.query.scenario==='source-static-frame'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 const report=useCallback(()=>{
  const s=mainState.current;if(!s)return;const sa=spanish.current?.snapshot();
  // The host keeps an explicit pending Play unpaused while source bytes decode.
  bridge.onSnapshot({frame:s.frame,phase:s.phase==='loading'?'start-pending':s.phase,returning:returnGate.current.pending||replayPending.current,selectedAudio:selected.current?'spanish':'main',audio:{phase:s.audioPhase},spanish:{phase:sa?.phase??'idle'}});
 },[bridge.onSnapshot]);
 const returnMain=useCallback(()=>{if(!selected.current)return;selected.current=false;setSaSelected(false);
  const active=spanish.current,controls=main.current;if(!active||!controls)return;
  const pending=returnGate.current.afterClose(()=>active.stopAndWait(),()=>spanish.current===active&&main.current===controls&&!selected.current,()=>controls.setPaused(mainState.current?.terminalHeld===true));
  report();void pending.then(()=>{if(spanish.current===active&&main.current===controls)report();}).catch(()=>{if(spanish.current!==active||main.current!==controls)return;cancelPending();latest.current.onRuntimePausedChange(true);report();});
 },[report,cancelPending]);
 useEffect(()=>{
  if(!scoped)return;let active=true;
  const sa=new P002SpanishAudio({load:readSpanish,changed:s=>{if(active){setSaState(s);report();}},ended:()=>{if(active)returnMain();}});
  spanish.current=sa;sa.setVolume(latest.current.volume??1);
  const hide=()=>{if(document.hidden){cancelPending();main.current?.setPaused(true);sa.pause();}};document.addEventListener('visibilitychange',hide);
  return()=>{active=false;selected.current=false;cancelPending();document.removeEventListener('visibilitychange',hide);void sa.close();if(spanish.current===sa)spanish.current=null;};
 },[scoped,report,returnMain,cancelPending]);
 useEffect(()=>{spanish.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{
  const element=bridge.source.current;if(!element||!scoped)return;
  const update=()=>setReady(element.querySelector('[data-canvas-status]')?.getAttribute('data-canvas-status')==='ready');
  update();const observer=new MutationObserver(update);observer.observe(element,{childList:true,subtree:true,attributes:true,attributeFilter:['data-canvas-status']});return()=>observer.disconnect();
 },[scoped,bridge.source]);
 const connect=useCallback((controls:AlgL07P002Controls)=>{
  main.current=controls;const wrapper={...controls,
   setPaused(paused:boolean){cancelPending();if(selected.current){if(paused)spanish.current?.pause();else void spanish.current?.start('user');report();}else {controls.setPaused(paused);if(!paused&&mainState.current?.terminalHeld){report();return true;}}},
   narration(action:'play'|'stop'){cancelPending();if(selected.current){if(action==='stop')spanish.current?.pause();else void spanish.current?.start('user');report();}else if(action==='play'&&mainState.current?.terminalHeld){controls.setPaused(true);report();}else controls.narration(action);},
   replay(){cancelPending();replayPending.current=true;selected.current=false;setSaSelected(false);spanish.current?.stop();return controls.replay();},
   stop(){cancelPending();selected.current=false;setSaSelected(false);void spanish.current?.close();controls.stop();},closeGlossary(){},
  };
  const disconnect=bridge.connectControls(wrapper);return()=>{if(main.current===controls)main.current=null;disconnect();};
 },[bridge.connectControls,report,cancelPending]);
 const startSpanish=()=>{if(!ready||!spanish.current)return;cancelPending();main.current?.setPaused(true);selected.current=true;setSaSelected(true);latest.current.onRuntimePausedChange(false);void spanish.current.start('user');};
 const es=props.uiLanguage==='es';
 return <div ref={bridge.source} className="runtime-shell" data-l07-p002-host-probe={ID} data-l07-p002-host-ready={ready&&scoped} data-l07-p002-host-error={scoped?'none':'scope'} data-p002-sa-selected={saSelected} data-p002-sa-phase={saState.phase} data-runtime-playback-complete="false" data-lesson-presentation="modern-text-v1">
  {!scoped?<p role="alert">{props.labels.unavailable}</p>:<>
   <AlgL07P002Player seed={0} uiLanguage={es?'es':'en'} paused={props.paused} volume={props.volume??1} reducedMotion={bridge.reducedMotion} readAudio={readAudio} connectControls={connect} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onState={s=>{mainState.current=s;if(['loading','playing','failed','closed'].includes(s.phase))replayPending.current=false;report();}}/>
   <div role="group" aria-label={es?'Audio en español':'Spanish Audio'} style={{display:'flex',flexWrap:'wrap',gap:8,marginBlock:12}}>
    <button type="button" data-p002-sa-start disabled={!ready||saState.phase==='loading'||saState.phase==='playing'} onClick={startSpanish}>{es?'Reproducir audio en español':'Play Spanish Audio'}</button>
    {saSelected?<button type="button" data-p002-sa-return onClick={returnMain}>{es?'Volver a la animación':'Return to animation'}</button>:null}
    {saState.phase==='loading'?<span role="status">{props.labels.loading}</span>:null}
   </div>
   {saState.failure?<p role="alert">{props.labels.unavailable}</p>:null}
  </>}
 </div>;
}
