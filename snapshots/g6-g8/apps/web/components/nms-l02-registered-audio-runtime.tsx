'use client';
import {useEffect,useState} from 'react';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {createNmsL2HoverAudioRuntime} from './nms-l02-hover-audio-runtime';
import {HOVER_AUDIO_PACKAGE} from '../../../packages/demos/src/timelines/nms-l02-hover-audio';
const ID='shared-nms002-l02-p020';
const Runtime=createNmsL2HoverAudioRuntime(HOVER_AUDIO_PACKAGE);
export function NmsL2RegisteredAudioRuntime(props:LessonRuntimeAdapterProps){
 const [state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>{let active=true;setState('loading');
  void loadClientAnimationModule(ID).then(module=>{
   const loaded=module as typeof module&{privateHoverAudioPackage?:unknown};
   if(props.moduleKey!==ID||module?.key!==ID||JSON.stringify(loaded?.privateHoverAudioPackage)!==JSON.stringify(HOVER_AUDIO_PACKAGE))throw Error('Registered NMS package mismatch');
   if(active)setState('ready');
  }).catch(()=>{if(active)setState('failed');});return()=>{active=false;};
 },[props.moduleKey]);
 return state==='ready'?<Runtime {...props}/>:<p role={state==='failed'?'alert':'status'} data-nms-registered-loader={state}>{state==='failed'?props.labels.unavailable:props.labels.loading}</p>;
}
