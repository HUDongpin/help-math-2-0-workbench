'use client';
import{useEffect,useRef,useState}from'react';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import{isP050RuntimeScope,isP050RuntimeModule,P050_RUNTIME_ID as ID}from'@/lib/nms-l02-p050-runtime-access';
import{P050Player}from'../../../packages/demos/src/nms-l02-p050-player-v1';
import{readP050SourceAudio}from'../../../packages/demos/src/nms-l02-p050-audio-loader-v1';
export function NmsL2P050SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const[ready,setReady]=useState(false),[failure,setFailure]=useState(''),[reducedMotion,setReducedMotion]=useState(false);
 const inScope=process.env.NODE_ENV!=='production'&&isP050RuntimeScope(props);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;setReady(false);setFailure('');void(async()=>{
  if(!inScope)throw Error('P050_PRIVATE_SCOPE');const animationModule=await loadClientAnimationModule(ID);if(!isP050RuntimeModule(animationModule))throw Error('P050_REGISTRATION_REQUIRED');
  await animationModule!.textPresentation!.prepare?.();if(active)setReady(true);
 })().catch(error=>{if(active){setFailure(error instanceof Error?error.message:'P050_PREPARATION_FAILED');latest.current.onRuntimePausedChange(true);}});return()=>{active=false;};},[inScope,props.animationId,props.moduleKey]);
 const seed=Number(props.query.seed??0),language=props.uiLanguage==='es'?'es':'en';
 if(!inScope||failure||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)return <p role="alert" data-p050-failure={failure||'P050_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
 if(!ready)return <p role="status">{props.labels.loading}</p>;
 return <div className="runtime-shell" data-source-number-line-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
  <P050Player language={language} paused={props.paused??true} volume={props.volume??.8} reducedMotion={reducedMotion} showControls={false}
   readAudio={readP050SourceAudio} connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
   onState={s=>{if(s.failure)latest.current.onRuntimePausedChange(true);latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:s.frame,frameCount:260,frameDomain:'sprite-94',fps:12,
    narration:s.running&&s.narrationEnabled?'playing':'idle',playbackProgress:(s.frame-1)/259,seekAvailable:false,stepFrames:1,transportMode:'none'});}}/>
 </div>;
}
