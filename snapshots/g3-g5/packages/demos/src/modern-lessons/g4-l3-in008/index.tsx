'use client';
import React,{useReducer,useRef}from'react';
import type{AnimationRendererProps}from'../../contract';
import type{LessonTextPresentationCapability}from'../../lesson-text-contract';
import type{SourceStaticCanvasFrameState}from'../../source-static-canvas-candidate';
import{getCourseG04L03In008FrameState}from'../../modules/course-g04-l03-in-008';
import{createCourseG04L03In008InteractionState,reduceCourseG04L03In008Interaction}from'../../timelines/course-g04-l03-in-008-interaction';
import{In008NativeSurface,type In008SourceState}from'./NativeSurface';
import{ID,DOMAIN,VERSION,BINDING,getIn008NativeState,getIn008Snapshot}from'./binding';
import SOURCE from'./source.generated.json';
import{IN008_AUDIO_HOST}from'./audio-host';
import{requestIn008CheckAudio,requestIn008CloseButtonAudio}from'./activity-adapter';
import{NATIVE_STYLES}from'./native-styles';
export const IN008_KEY_TERMS={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:['en-0459-b510b9647e1c']}as const;
export function requestIn008Pattern(runtime:AnimationRendererProps,trigger:HTMLElement){
 const context={...runtime,frameDomain:runtime.frameDomain??DOMAIN};const state=(runtime.state??getCourseG04L03In008FrameState(runtime.frame,context))as SourceStaticCanvasFrameState;
 if(runtime.entryStateSha256||!runtime.onLessonHostRequest||getIn008Snapshot(state,context).status!=='ready')return null;
 if(!getIn008NativeState(runtime.frame).keywordVisible)return null;
 return runtime.onLessonHostRequest({type:'open-keyterm',entryId:IN008_KEY_TERMS.entryIds[0],sourceAnimationId:ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'});
}
function Session(runtime:AnimationRendererProps){
 const[interaction,dispatch]=useReducer(reduceCourseG04L03In008Interaction,runtime.seed,createCourseG04L03In008InteractionState),checkGeneration=useRef(0);
 const context={...runtime,frameDomain:runtime.frameDomain??DOMAIN},state=(runtime.state??getCourseG04L03In008FrameState(runtime.frame,context))as SourceStaticCanvasFrameState;
 const snapshot=getIn008Snapshot(state,context,interaction);
 if(snapshot.status!=='ready')return<p role="status">This lesson view is unavailable in the selected context.</p>;
 const source=getIn008NativeState(runtime.frame)as In008SourceState;
 return<div data-modern-text-page={ID} data-lesson-text-binding={VERSION} data-lesson-frame={runtime.frame} data-lesson-seed={runtime.seed} data-lesson-replay={runtime.replay??0} data-lesson-text-status="ready" data-lesson-activities={JSON.stringify(runtime.lessonActivities??[])} lang="en">
  <style>{NATIVE_STYLES}</style>
  <In008NativeSurface source={source} title={SOURCE.title} interaction={interaction} dispatch={dispatch} paused={Boolean(runtime.paused||runtime.entryStateSha256)}
   onKeyTerm={runtime.onLessonHostRequest&&!runtime.entryStateSha256?(_term,trigger)=>{requestIn008Pattern(runtime,trigger);}:undefined}
   onCheck={next=>{checkGeneration.current++;requestIn008CheckAudio(context,next,checkGeneration.current);}}
   onClosePress={token=>{requestIn008CloseButtonAudio(context,'press',token,interaction.feedbackVisible);}}
   onCloseRelease={token=>{requestIn008CloseButtonAudio(context,'release',token,interaction.feedbackVisible);}}/>
 </div>;
}
/** Replay/seed changes remount exactly this page session. Layout/source-frame changes retain it. */
export function In008Renderer(runtime:AnimationRendererProps){return<Session key={`${runtime.seed}:${runtime.replay??0}`} {...runtime}/>;}
export const IN008_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:BINDING,Renderer:In008Renderer,getSnapshot:getIn008Snapshot,...IN008_AUDIO_HOST,keyTerms:IN008_KEY_TERMS};
