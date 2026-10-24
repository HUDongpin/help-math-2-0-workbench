'use client';
import React,{useLayoutEffect,useState}from'react';
import type{AnimationRendererProps}from'../../contract';
import type{LessonTextPresentationCapability}from'../../lesson-text-contract';
import type{CourseG04L03In009FrameState}from'../../timelines/course-g04-l03-in-009';
import{getCourseG04L03In009FrameState}from'../../timelines/course-g04-l03-in-009';
import{ID,DOMAIN,VERSION,BINDING,getIn009NativeState,getIn009Snapshot}from'./binding';
import{IN009_AUDIO_HOST}from'./audio-host';
import{NATIVE_STYLES}from'./native-styles';
import{loadIn009Assets}from'./assets';
import type{In009Assets}from'./asset-contract';
import{createPreparedAssetStore}from'./asset-lifecycle';
import{In009Composition}from'./composition';
export const IN009_KEY_TERMS={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:['en-0684-c1f7ef269aea','en-0372-3dc76de7a102']}as const;
const assets=createPreparedAssetStore<In009Assets>(loadIn009Assets);
/** Node registry preflight is metadata-only; browser module prepare awaits real assets. */
export async function prepareIn009(signal?:AbortSignal){if(typeof window==='undefined')return;await assets.prepare(signal);}
export function disposeIn009PreparedAssets(){assets.disposeUnused();}
function contextFor(runtime:AnimationRendererProps){return{...runtime,frameDomain:runtime.frameDomain??DOMAIN};}
export function requestIn009Keyword(runtime:AnimationRendererProps,term:'Temperature'|'Measure',trigger:HTMLElement){
 const context=contextFor(runtime),state=(runtime.state??getCourseG04L03In009FrameState(runtime.frame,context))as CourseG04L03In009FrameState;
 if(runtime.entryStateSha256||!runtime.onLessonHostRequest||getIn009Snapshot(state,context).status!=='ready')return null;
 const index=term==='Temperature'?0:3;if(!getIn009NativeState(runtime.frame).wordIndices.includes(index))return null;
 return runtime.onLessonHostRequest({type:'open-keyterm',entryId:IN009_KEY_TERMS.entryIds[term==='Temperature'?0:1],sourceAnimationId:ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'});
}
function Session(runtime:AnimationRendererProps){const[result,setResult]=useState<{value:In009Assets|null;failed:boolean}>(()=>({value:assets.peekReady(),failed:false}));
 useLayoutEffect(()=>{let active=true;const lease=assets.acquire();lease.ready.then(value=>{if(active)setResult({value,failed:false});},()=>{if(active)setResult({value:null,failed:true});});return()=>{active=false;lease.release();};},[]);
 const context=contextFor(runtime),state=(runtime.state??getCourseG04L03In009FrameState(runtime.frame,context))as CourseG04L03In009FrameState,snapshot=getIn009Snapshot(state,context);
 if(snapshot.status!=='ready'||result.failed)return<p role="status" data-lesson-text-status="blocked">This lesson view is unavailable in the selected context.</p>;
 if(!result.value)return<p role="status" data-source-preparation-status="loading">Loading lesson graphics…</p>;
 return<div data-modern-text-page={ID} data-lesson-text-binding={VERSION} data-lesson-frame={runtime.frame} data-lesson-seed={runtime.seed} data-lesson-replay={runtime.replay??0} data-lesson-text-status="ready" lang="en"><style>{NATIVE_STYLES}</style><In009Composition assets={result.value} frame={runtime.frame} language={runtime.lang} onKeyword={(term,trigger)=>{requestIn009Keyword(runtime,term,trigger);}}/></div>;
}
/** Only seed/Replay remount a session; source frames and layout keep its resource lease. */
export function In009Renderer(runtime:AnimationRendererProps){return<Session key={`${runtime.seed}:${runtime.replay??0}`} {...runtime}/>;}
export const IN009_PRESENTATION:LessonTextPresentationCapability<CourseG04L03In009FrameState>={schemaVersion:1,binding:BINDING,Renderer:In009Renderer,getSnapshot:getIn009Snapshot,prepare:prepareIn009,...IN009_AUDIO_HOST,keyTerms:IN009_KEY_TERMS};
