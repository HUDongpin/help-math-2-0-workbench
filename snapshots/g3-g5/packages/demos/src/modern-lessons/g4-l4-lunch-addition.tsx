'use client';
import React,{useEffect,useState} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextInstance,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import {LessonCanvasPlane,type LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {loadLunchActivityScene} from './g4-l4-lunch-activity';
import {getLunchBillsSnapshot,LunchBillsScene,type LunchBillsConfig} from './g4-l4-lunch-bills';

export interface LunchAdditionConfig extends LunchBillsConfig {
 readonly adapter:Readonly<{url:string;sha256:string;variantId:string}>;
 readonly exclusions:readonly (LessonTextInstance&Readonly<{firstFrame:number;lastFrameExclusive:number}>)[];
}
type ReadFrame=(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState;
const NATIVE_STAGE=Object.freeze({width:800,height:600});
export function getLunchAdditionSnapshot(config:LunchAdditionConfig,readFrame:ReadFrame,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot {
 const expected=readFrame(context.frame,context);
 const raw=getLunchBillsSnapshot(config,state??expected,context);
 const snapshot=buildLessonTextSnapshot(config.binding,{...context,frame:expected.frame,frameDomain:config.frameDomain,rootFrame:config.rootFrame,seed:expected.seed},Object.fromEntries(raw.blocks.map(b=>[b.id,{text:b.text,visible:b.visible}])));
 if(!state||expected.status!=='ready'||state.frame!==expected.frame||state.seed!==expected.seed||raw.status!=='ready'||snapshot.status!=='ready')return {...snapshot,status:'blocked',blocks:[],suppressedInstances:[],blockers:raw.blockers.length?raw.blockers:snapshot.blockers.length?snapshot.blockers:['source-frame-identity-mismatch']};
 return {...snapshot,suppressedInstances:config.exclusions.filter(e=>snapshot.identity.frame>=e.firstFrame&&snapshot.identity.frame<e.lastFrameExclusive).map(({id,path})=>({id,path}))};
}
export function createLunchAdditionPresentation(config:LunchAdditionConfig,readFrame:ReadFrame):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
 const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getLunchAdditionSnapshot(config,readFrame,state,context);
 function Renderer(props:AnimationRendererProps){
  const context:RuntimeContext={...props,frameDomain:props.frameDomain??config.frameDomain,rootFrame:props.rootFrame??config.rootFrame};
  const state=(props.state===undefined?readFrame(props.frame,context):props.state)as SourceStaticCanvasFrameState;
  const snapshot=getSnapshot(state,context),[adapter,setAdapter]=useState<LessonCanvasPlaneAdapter|null>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{if(snapshot.status!=='ready')return;let cancelled=false;void loadLunchActivityScene(config).then(a=>{if(!cancelled)setAdapter(a)}).catch(()=>{if(!cancelled)setFailed(true)});return()=>{cancelled=true}},[snapshot.status]);
  const attributes={'data-modern-lesson':'g4-l4-in008','data-presentation-status':snapshot.status==='ready'?'candidate':'blocked','data-source-swf-sha256':config.sourceSwfSha256,
   'data-flash-frame':snapshot.identity.frame,'data-flash-frame-domain':snapshot.identity.frameDomain,'data-flash-root-frame':snapshot.identity.rootFrame,
   'data-flash-seed':snapshot.identity.seed,'data-flash-lang':snapshot.identity.language,'data-flash-scenario':snapshot.identity.scenario,'data-replay':snapshot.identity.replay,
   'data-language-policy':props.uiLanguage==='es'?'source-fallback':'source','data-spanish-translation':'false','data-original-runtime-accepted':'false','data-owner-accepted':'false','data-strict-migration-complete':'false'};
  if(snapshot.status!=='ready')return <section {...attributes} lang="en"/>;
  return <section {...attributes} lang="en">{failed?<p role="status">The lesson figure could not load.</p>:adapter?
   <LessonCanvasPlane adapter={adapter} nativeStage={NATIVE_STAGE} sourceBitmapBound={true} request={{...context,...snapshot.identity,lang:'en'}} snapshot={snapshot}
    renderKey={`${config.animationId}:${JSON.stringify(snapshot.identity)}`} figureLabel="Lunch scene">
    {(committed,figure)=><LunchBillsScene config={config} frame={committed.identity.frame} replay={committed.identity.replay} figure={figure}/>}
   </LessonCanvasPlane>:<p role="status">Loading lesson figure…</p>}</section>;
 }
 return Object.freeze({schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:Object.freeze({[config.frameDomain]:config.frameCount}),
  reducedMotionFrameByDomain:Object.freeze({[config.frameDomain]:config.frameCount}),sourceTimelineAudioCues:config.sourceAudio,prepare:async()=>{await loadLunchActivityScene(config)}});
}
