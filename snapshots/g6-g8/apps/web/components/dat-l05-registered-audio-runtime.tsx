'use client';
import{useEffect,useState}from'react';
import{loadClientAnimationModule}from'@/lib/load-animation-module.client';
import type{LessonRuntimeAdapterProps}from'@/lib/lesson-runtime-adapter';
import{createDatL05DragAudioRuntime}from'./dat-l05-drag-audio-runtime';
import{DRAG_AUDIO_PACKAGE}from'../../../packages/demos/src/timelines/frozen16-dat-l05-drag-audio';
const ID='shared-dat001-l05-p040',Runtime=createDatL05DragAudioRuntime(DRAG_AUDIO_PACKAGE);
export function DatL05RegisteredAudioRuntime(props:LessonRuntimeAdapterProps){
 const[state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>{let active=true;setState('loading');void loadClientAnimationModule(ID).then(module=>{const loaded=module as typeof module&{privateDragAudioPackage?:unknown};if(props.moduleKey!==ID||module?.key!==ID||JSON.stringify(loaded?.privateDragAudioPackage)!==JSON.stringify(DRAG_AUDIO_PACKAGE))throw Error('Registered DAT L5 package mismatch');if(active)setState('ready');}).catch(()=>{if(active)setState('failed');});return()=>{active=false;};},[props.moduleKey]);
 return state==='ready'?<Runtime {...props}/>:<p role={state==='failed'?'alert':'status'} data-dat-l05-registered-loader={state}>{state==='failed'?props.labels.unavailable:props.labels.loading}</p>;
}
