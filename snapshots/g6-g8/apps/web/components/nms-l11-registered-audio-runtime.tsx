'use client';
import{useEffect,useState}from'react';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{createNmsL11ChoiceAudioRuntime}from'./nms-l11-choice-audio-runtime';
import{QUESTION_AUDIO_PACKAGE}from'../../../packages/demos/src/timelines/frozen16-nms-l11-choice-audio';
const ID='shared-nms002-l11-p030',Runtime=createNmsL11ChoiceAudioRuntime(QUESTION_AUDIO_PACKAGE);
export function NmsL11RegisteredAudioRuntime(props:LessonRuntimeAdapterProps){
 const[state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>{let active=true;setState('loading');void loadClientAnimationModule(ID).then(module=>{const loaded=module as typeof module&{privateQuestionAudioPackage?:unknown};if(props.moduleKey!==ID||module?.key!==ID||JSON.stringify(loaded?.privateQuestionAudioPackage)!==JSON.stringify(QUESTION_AUDIO_PACKAGE))throw Error('Registered NMS L11 package mismatch');if(active)setState('ready');}).catch(()=>{if(active)setState('failed');});return()=>{active=false;};},[props.moduleKey]);
 return state==='ready'?<Runtime {...props}/>:<p role={state==='failed'?'alert':'status'} data-nms-l11-registered-loader={state}>{state==='failed'?props.labels.unavailable:props.labels.loading}</p>;
}
