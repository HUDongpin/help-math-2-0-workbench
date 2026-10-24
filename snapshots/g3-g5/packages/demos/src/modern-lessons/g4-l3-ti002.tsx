'use client';
import React from'react';
import type{AnimationRendererProps}from'../contract';
import{getCourseG04L03Ti002FrameState}from'../modules/course-g04-l03-ti-002';
import{requestTi002KeyTerm}from'./g4-l3-ti002-keyterms';
import{Ti002Introduction}from'./g4-l3-ti002-introduction';
import{Ti002HostQuestion}from'./g4-l3-ti002-host-question';
import{ti002SourceBlockers}from'./g4-l3-ti002-source-context';
export{ti002SourceBlockers}from'./g4-l3-ti002-source-context';
const ID='course-g04-l03-ti-002';
/** Unregistered native candidate. A later binding/capability admits it to My Lesson. */
export function Ti002Renderer(runtime:AnimationRendererProps){
 const state=runtime.state??getCourseG04L03Ti002FrameState(runtime.frame,runtime);
 const blockers=ti002SourceBlockers(state,runtime);
 if(blockers.length)return <div data-ti002-native-status="blocked" data-ti002-blockers={blockers.join(',')}/>;
 return <section lang="en" data-modern-text-page={ID} data-ti002-native-status="ready" data-flash-frame={runtime.frame} data-runtime-replay={runtime.replay??0} data-lesson-activities={JSON.stringify(runtime.lessonActivities??[])}>
  {runtime.frame<238?<Ti002Introduction frame={runtime.frame} paused={runtime.paused} onKeyTerm={(id,trigger)=>{requestTi002KeyTerm(runtime,id,trigger);}}/>:<Ti002HostQuestion runtime={runtime} sourceReady={true}/>}
 </section>;
}
