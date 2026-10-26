'use client';
import{useEffect,useRef,useState}from'react';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import{isP051RuntimeScope,isP051RuntimeModule,P051_RUNTIME_ID as ID}from'@/lib/nms-l02-p051-runtime-access';
import{P051Player}from'../../../packages/demos/src/nms-l02-p051-player-v1';
import{readP051SourceAudio}from'../../../packages/demos/src/nms-l02-p051-audio-loader-v1';
export function NmsL2P051SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const[ready,setReady]=useState(false),[failure,setFailure]=useState(''),[reducedMotion,setReducedMotion]=useState(false);
 const inScope=process.env.NODE_ENV!=='production'&&isP051RuntimeScope(props);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;setReady(false);setFailure('');void(async()=>{
  if(!inScope||location.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw Error('P051_PRIVATE_SCOPE');const animationModule=await loadClientAnimationModule(ID);if(!isP051RuntimeModule(animationModule))throw Error('P051_REGISTRATION_REQUIRED');
  await animationModule!.textPresentation!.prepare?.();if(active)setReady(true);
 })().catch(error=>{if(active){setFailure(error instanceof Error?error.message:'P051_PREPARATION_FAILED');latest.current.onRuntimePausedChange(true);}});return()=>{active=false;};},[inScope,props.animationId,props.moduleKey]);
 const seed=Number(props.query.seed??0),language=props.uiLanguage==='es'?'es':'en';
 if(!inScope||failure||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)return <p role="alert" data-p051-failure={failure||'P051_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
 if(!ready)return <p role="status">{props.labels.loading}</p>;
 return <div className="runtime-shell" data-source-fraction-match-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
  <p lang={language} data-p051-language-boundary>{language==='es'
   ?'El texto didáctico está traducido al español; el glosario procede del XML en español. La narración conserva el audio fuente en inglés.'
   :'Teaching text is in English. Narration uses the original English source audio.'}</p>
  <P051Player language={language} paused={props.paused??true} volume={props.volume??.8} reducedMotion={reducedMotion} showControls={false}
   readAudio={readP051SourceAudio} connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
   onState={s=>{if(s.failure)latest.current.onRuntimePausedChange(true);latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:s.frame,frameCount:503,frameDomain:'sprite-257',fps:12,
    narration:s.running&&s.narrationEnabled?'playing':'idle',playbackProgress:(s.frame-1)/502,seekAvailable:false,stepFrames:1,transportMode:'none'});}}/>
 </div>;
}
