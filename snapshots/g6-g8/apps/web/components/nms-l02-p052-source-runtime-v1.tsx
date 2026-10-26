'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '../lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '../lib/load-animation-module.client';
import {isP052RuntimeScope,isP052RuntimeModule,P052_RUNTIME_ID as ID} from '../lib/nms-l02-p052-runtime-access';
import {P052Player} from '../../../packages/demos/src/nms-l02-p052-player-v1';
import {p052HostPlaybackState} from '../../../packages/demos/src/nms-l02-p052-host-state-v1';
/** Prepared host adapter. No route selects it until reviewed registration. */
export function NmsL2P052SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const [ready,setReady]=useState(false),[failure,setFailure]=useState('');
 const inScope=process.env.NODE_ENV!=='production'&&isP052RuntimeScope(props);
 useEffect(()=>{let active=true;setReady(false);setFailure('');void(async()=>{
  if(!inScope||location.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw Error('P052_PRIVATE_SCOPE');
  const module=await loadClientAnimationModule(ID);if(!isP052RuntimeModule(module))throw Error('P052_REGISTRATION_REQUIRED');
  await module!.textPresentation!.prepare?.();if(active)setReady(true);
 })().catch(error=>{if(active){setFailure(error instanceof Error?error.message:'P052_PREPARATION_FAILED');latest.current.onRuntimePausedChange(true);}});
 return()=>{active=false;};},[inScope,props.animationId,props.moduleKey]);
 if(!inScope||failure)return <p role="alert" data-p052-failure={failure||'P052_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
 if(!ready)return <p role="status">{props.labels.loading}</p>;
 const language=(props.uiLanguage??props.query.lang)==='es'?'es':'en';
 return <div className="runtime-shell" data-source-percent-practice-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
  <p lang={language}>{language==='es'?'Texto didáctico en español; narración fuente en inglés.':'English teaching text and original English source narration.'}</p>
  <P052Player language={language} seed={Number(props.query.seed??0)} paused={props.paused??true} volume={props.volume??.8} showControls={false}
   connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
   onState={s=>{if(s.error)latest.current.onRuntimePausedChange(true);latest.current.onPlaybackStateChange?.(p052HostPlaybackState(s));}}/>
 </div>;
}
