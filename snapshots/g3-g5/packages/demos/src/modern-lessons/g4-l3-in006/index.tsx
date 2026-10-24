'use client';
import React from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../../contract';
import type {LessonTextPresentationCapability,TextPresentationSnapshot} from '../../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {getCourseG04L03In006FrameState} from '../../modules/course-g04-l03-in-006';
import {G4L3In006QuizSession,COMPLETION_ID} from './quiz-session';
import {create,DOMAIN,QUIZ_FRAME} from './interaction';
import {getIn006Snapshot} from './snapshot';
export {getIn006Snapshot} from './snapshot';
import {In006Teaching} from './teaching';
import {IN006_ACTIVITIES} from './activities.generated';
import {IN006_BINDING} from './binding.generated';
export function In006ModernRenderer(runtime:AnimationRendererProps){
 const state=(runtime.state??getCourseG04L03In006FrameState(runtime.frame,runtime)) as SourceStaticCanvasFrameState;
 const snapshot=getIn006Snapshot(state,{...runtime,frameDomain:runtime.frameDomain??DOMAIN});
 if(snapshot.status!=='ready')return <p role="status">This lesson view is unavailable in the selected context.</p>;
 return <div lang="en" data-modern-text-page={IN006_BINDING.animationId} data-lesson-text-status="ready" data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={runtime.replay??0}>
  {state.frame<QUIZ_FRAME&&<In006Teaching frame={state.frame}/>}
  <G4L3In006QuizSession runtime={runtime} sourceReady/>
 </div>;
}
export const IN006_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:IN006_BINDING,Renderer:In006ModernRenderer,getSnapshot:getIn006Snapshot,
 playbackEndFrameByDomain:{[DOMAIN]:QUIZ_FRAME},reducedMotionFrameByDomain:{[DOMAIN]:QUIZ_FRAME},frameControl:{frameDomain:DOMAIN,completionFrame:QUIZ_FRAME,transitions:[]},
 activityTimelines:IN006_ACTIVITIES,completion:{id:COMPLETION_ID,frameDomain:DOMAIN,frames:[QUIZ_FRAME]},
 sourceTimelineAudioCues:[{id:'in006-source-main',source:'/flash-assets/courses/course-g04-l03-in-006/audio/embedded-stream-0001.mp3',sha256:'2b8c754a6a8b55434a6672525b8e300b5ed1f4c84760d3c89c5eb01605380717',frame:4,endFrame:1055,frameDomain:DOMAIN,language:'en',spokenLanguage:'undetermined'}]};
