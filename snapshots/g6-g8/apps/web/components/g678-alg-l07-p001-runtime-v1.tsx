'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {AlgL07P001Player} from '../../../packages/demos/src/alg-l07-p001-player-v1';
import type {AlgL07P001Session} from '../../../packages/demos/src/alg-l07-p001-session-v1';
import {loadBoundLessonAudio} from './source-lesson-host-bridge-v1';
import {P001_STREAM_PIN} from '@/lib/alg-l07-p001-local-request-v1';
const ID='shared-alg001-l07-p001';
const readAudio=(signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,assetId:'source-stream',
 pin:P001_STREAM_PIN,origin:window.location.origin,signal,errorPrefix:'ALG_L07_P001_SOURCE_STREAM'});

/** One source-bound title loop inside the modern My Lesson controls. */
export function G678AlgL07P001RuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const stateRef=useRef<ReturnType<AlgL07P001Session['snapshot']>|null>(null);
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
 const observe=useCallback((state:ReturnType<AlgL07P001Session['snapshot']>)=>{
  stateRef.current=state;
  latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:state.frame,frameCount:138,
   frameDomain:'sprite-142',fps:12,narration:state.audioPhase==='playing'?'playing':'idle',
   playbackProgress:(state.frame-1)/137,seekAvailable:false,stepFrames:12,transportMode:'none'});
  if(reportTimer.current!==null)clearTimeout(reportTimer.current);
  reportTimer.current=setTimeout(()=>{
   reportTimer.current=null;
   const current=stateRef.current;if(!current)return;
   const paused=!['playing','loading','start-pending'].includes(current.phase);
   if(latest.current.paused!==paused)latest.current.onRuntimePausedChange(paused);
  },0);
 },[]);
 if(!scoped)return <p role="alert" data-l07-p001-host-error="scope">{props.labels.unavailable}</p>;
 return <div className="runtime-shell" data-l07-p001-host-probe={ID}
  data-l07-p001-host-ready="true" data-l07-p001-host-error="none"
  data-lesson-presentation="modern-text-v1">
  <AlgL07P001Player seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'}
   paused={props.paused} volume={props.volume??1} reducedMotion={reducedMotion}
   readAudio={readAudio} connectControls={props.connectRuntimeControls}
   onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onState={observe}/>
 </div>;
}
