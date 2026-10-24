'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {SourceTitlePlayerV1} from '../../../packages/demos/src/source-title-player-v1';
import {ALG_L08_P001_SOURCE as SOURCE} from '../../../packages/demos/src/generated/alg-l08-p001-source-v1';
import type {SourceTitleSessionV1} from '../../../packages/demos/src/source-title-session-v1';
import {loadBoundLessonAudio} from './source-lesson-host-bridge-v1';
import {P001_STREAM_PIN} from '@/lib/alg-l08-p001-local-request-v1';
const ID='shared-alg001-l08-p001';
const readAudio=(signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,assetId:'source-stream',
 pin:P001_STREAM_PIN,origin:window.location.origin,signal,errorPrefix:'ALG_L08_P001_SOURCE_STREAM'});

/** One source-bound title loop inside the modern My Lesson controls. */
export function G678AlgL08P001RuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const stateRef=useRef<ReturnType<SourceTitleSessionV1['snapshot']>|null>(null);
 const reportTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [reducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>()=>{if(reportTimer.current!==null)clearTimeout(reportTimer.current);},[]);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReducedMotion(media.matches);update();media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);},[]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&
  props.audioEnabled===true&&props.query.frameDomain==='sprite-142'&&
  props.query.scenario==='source-introduction'&&props.query.lang==='en'&&
  String(props.query.seed)==='0'&&props.query.capture!=='1'&&
  ['en','es'].includes(props.uiLanguage??'');
 const observe=useCallback((state:ReturnType<SourceTitleSessionV1['snapshot']>)=>{
  stateRef.current=state;
  latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:state.frame,frameCount:SOURCE.frameCount,
   frameDomain:'sprite-142',fps:12,narration:state.audioPhase==='playing'?'playing':'idle',
   playbackProgress:(state.frame-1)/(SOURCE.frameCount-1),seekAvailable:false,stepFrames:12,transportMode:'none'});
  if(reportTimer.current!==null)clearTimeout(reportTimer.current);
  reportTimer.current=setTimeout(()=>{
   reportTimer.current=null;
   const current=stateRef.current;if(!current)return;
   const paused=!['playing','loading','start-pending'].includes(current.phase);
   if(latest.current.paused!==paused)latest.current.onRuntimePausedChange(paused);
  },0);
 },[]);
 if(!scoped)return <p role="alert" data-l08-p001-host-error="scope">{props.labels.unavailable}</p>;
 return <div className="runtime-shell" data-l08-p001-host-probe={ID}
  data-l08-p001-host-ready="true" data-l08-p001-host-error="none"
  data-lesson-presentation="modern-text-v1">
  <SourceTitlePlayerV1 source={SOURCE} seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'}
   paused={props.paused} volume={props.volume??1} reducedMotion={reducedMotion}
   readAudio={readAudio} connectControls={props.connectRuntimeControls}
   onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onState={observe}/>
 </div>;
}
