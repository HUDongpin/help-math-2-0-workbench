'use client';
import{useEffect,useRef,useState}from'react';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import{isP049RuntimeScope,isP049RuntimeModule,P049_RUNTIME_ID as ID}from'@/lib/nms-l02-p049-runtime-access';
import{P049Player}from'../../../packages/demos/src/nms-l02-p049-player-v1';
import{P049IntroView}from'../../../packages/demos/src/nms-l02-p049-intro-view-v1';
import{readP049SourceAudio}from'../../../packages/demos/src/nms-l02-p049-audio-loader-v1';
export function NmsL2P049SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const[ready,setReady]=useState(false),[failure,setFailure]=useState(''),[reducedMotion,setReducedMotion]=useState(false);
 const inScope=process.env.NODE_ENV!=='production'&&isP049RuntimeScope(props);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;setReady(false);setFailure('');void(async()=>{
  if(!inScope)throw Error('P049_PRIVATE_SCOPE');const animationModule=await loadClientAnimationModule(ID);if(!isP049RuntimeModule(animationModule))throw Error('P049_REGISTRATION_REQUIRED');
  await animationModule!.textPresentation!.prepare?.();if(active)setReady(true);
 })().catch(error=>{if(active){setFailure(error instanceof Error?error.message:'P049_PREPARATION_FAILED');latest.current.onRuntimePausedChange(true);}});return()=>{active=false;};},[inScope,props.animationId,props.moduleKey]);
 const seed=Number(props.query.seed??0),language=props.uiLanguage==='es'?'es':'en';
 if(!inScope||failure||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)return <p role="alert" data-p049-failure={failure||'P049_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
 if(!ready)return <p role="status">{props.labels.loading}</p>;
 return <div className="runtime-shell" data-source-decimal-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
  <P049Player language={language} paused={props.paused??true} volume={props.volume??.8} seed={seed} showControls={false}
   readAudio={readP049SourceAudio} connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
   renderIntro={frame=><P049IntroView frame={frame} language={language} reducedMotion={reducedMotion}/>}
   onState={s=>{if(s.failure)latest.current.onRuntimePausedChange(true);latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:s.frame,frameCount:435,frameDomain:'sprite-156',fps:12,
    narration:s.running&&s.narrationEnabled?'playing':'idle',playbackProgress:(s.frame-1)/434,seekAvailable:false,stepFrames:1,transportMode:'none'});}}/>
 </div>;
}
