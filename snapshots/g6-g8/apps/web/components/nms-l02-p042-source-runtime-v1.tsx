'use client';
import{useEffect,useRef,useState}from'react';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import{isP042RuntimeScope,isP042RuntimeModule,P042_RUNTIME_ID as ID}from'@/lib/nms-l02-p042-runtime-access';
import{NmsL2P042Player}from'../../../packages/demos/src/nms-l02-p042-player-v1';
import{readP042SourceAudio}from'../../../packages/demos/src/nms-l02-p042-audio-loader-v1';
export function NmsL2P042SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const[ready,setReady]=useState(false),[failure,setFailure]=useState(''),[reducedMotion,setReducedMotion]=useState(false);
 const inScope=process.env.NODE_ENV!=='production'&&isP042RuntimeScope(props);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;setReady(false);setFailure('');void(async()=>{
  if(!inScope)throw Error('P042_PRIVATE_SCOPE');const animationModule=await loadClientAnimationModule(ID);if(!isP042RuntimeModule(animationModule))throw Error('P042_REGISTRATION_REQUIRED');
  await animationModule!.textPresentation!.prepare?.();if(active)setReady(true);
 })().catch(error=>{if(active){setFailure(error instanceof Error?error.message:'P042_PREPARATION_FAILED');latest.current.onRuntimePausedChange(true);}});return()=>{active=false;};},[inScope,props.animationId,props.moduleKey]);
 const seed=Number(props.query.seed??0);
 if(!inScope||failure||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)return <p role="alert" data-p042-failure={failure||'P042_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
 if(!ready)return <p role="status">{props.labels.loading}</p>;
 return <div className="runtime-shell" data-source-real-world-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
  <NmsL2P042Player uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused??true} volume={props.volume??.8} reducedMotion={reducedMotion}
   readAudio={readP042SourceAudio} connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
   onState={s=>{if(s.phase==='failed')latest.current.onRuntimePausedChange(true);latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:s.state.frame,frameCount:625,frameDomain:'sprite-261',fps:12,
    narration:s.phase==='playing'&&s.narrationEnabled?'playing':'idle',
    playbackProgress:s.elapsed/52,seekAvailable:false,stepFrames:1,transportMode:'none'});}}/>
 </div>;
}
