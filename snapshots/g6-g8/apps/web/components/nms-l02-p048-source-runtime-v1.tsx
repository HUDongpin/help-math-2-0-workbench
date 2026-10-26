'use client';
import{useEffect,useRef,useState}from'react';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import{isP048RuntimeScope,isP048RuntimeModule,P048_RUNTIME_ID as ID}from'@/lib/nms-l02-p048-runtime-access';
import{P048Player}from'../../../packages/demos/src/nms-l02-p048-player-v1';
import{P048IntroView}from'../../../packages/demos/src/nms-l02-p048-intro-view-v1';
import{readP048SourceAudio}from'../../../packages/demos/src/nms-l02-p048-audio-loader-v1';
export function NmsL2P048SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const[ready,setReady]=useState(false),[failure,setFailure]=useState(''),[reducedMotion,setReducedMotion]=useState(false);
 const inScope=process.env.NODE_ENV!=='production'&&isP048RuntimeScope(props);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;setReady(false);setFailure('');void(async()=>{
  if(!inScope)throw Error('P048_PRIVATE_SCOPE');const animationModule=await loadClientAnimationModule(ID);if(!isP048RuntimeModule(animationModule))throw Error('P048_REGISTRATION_REQUIRED');
  await animationModule!.textPresentation!.prepare?.();if(active)setReady(true);
 })().catch(error=>{if(active){setFailure(error instanceof Error?error.message:'P048_PREPARATION_FAILED');latest.current.onRuntimePausedChange(true);}});return()=>{active=false;};},[inScope,props.animationId,props.moduleKey]);
 const seed=Number(props.query.seed??0),language=props.uiLanguage==='es'?'es':'en';
 if(!inScope||failure||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)return <p role="alert" data-p048-failure={failure||'P048_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
 if(!ready)return <p role="status">{props.labels.loading}</p>;
 return <div className="runtime-shell" data-source-decimal-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
  <P048Player language={language} paused={props.paused??true} volume={props.volume??.8} seed={seed} showControls={false}
   readAudio={readP048SourceAudio} connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
   renderIntro={(frame,onModalChange)=><P048IntroView frame={frame} language={language} reducedMotion={reducedMotion} onModalChange={onModalChange}/>}
   onState={s=>{if(s.failure)latest.current.onRuntimePausedChange(true);latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:s.frame,frameCount:363,frameDomain:'sprite-498',fps:12,
    narration:s.running&&s.narrationEnabled?'playing':'idle',playbackProgress:(s.frame-1)/362,seekAvailable:false,stepFrames:1,transportMode:'none'});}}/>
 </div>;
}
