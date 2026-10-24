'use client';
import React from 'react';
import type {AnimationModule,AnimationRendererProps,RuntimeContext} from './contract';
import {P061_ID,P061_SOURCE_SHA,p061SourceFrame} from './nms-l02-p061-state-v1';
import {P061_DISPLAY_META,p061SourceSnapshot} from './generated/nms-l02-p061-display-list-v1';
import {NmsL02P061ProductRendererV1} from './nms-l02-p061-product-renderer-v1';

export const P061_PRODUCT_SCENARIO='source-static-frame';
const ROOT_SCENARIO='root-unavailable';
const stage=Object.freeze({width:800,height:600});
export const P061_PRODUCT_SOURCE_AUDIO=Object.freeze({
 path:'output/nms-l02-p061-source-20260927/extraction/audio/sprite-315.mp3',bytes:358930,
 sha256:'62b1b094839a9716a7f68a266ea6725ae7c508123659840943be8db0ad9e467d',
 decodedSamples:1590336,sampleRate:22050,channels:1,firstBlockFrame:9,lastBlockFrame:875,
 disposition:'private-source-evidence-not-module-audio-cue' as const,
});

export function p061ProductContextReady(context:RuntimeContext):boolean{
 return Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=882&&
  context.frameDomain==='sprite-315'&&context.rootFrame===6&&
  context.scenario===P061_PRODUCT_SCENARIO&&context.lang==='en'&&
  context.seed===0&&Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0;
}
/** Introspection retains all 882 source frames; normal presentation holds at authored stop 879. */
export function p061ProductFrameState(frame:number,context:RuntimeContext){
 const source=Number.isInteger(frame)&&frame>=1&&frame<=882?p061SourceFrame(frame):null;
 const ready=frame===context.frame&&p061ProductContextReady(context);
 return Object.freeze({animationId:P061_ID,sourceSwfSha256:P061_SOURCE_SHA,
  frame,frameDomain:context.frameDomain??null,rootFrame:context.rootFrame??null,
  scenario:context.scenario,language:context.lang,seed:context.seed,
  status:ready?'ready' as const:'blocked' as const,
  visualStatus:ready&&frame<=879?'renderable' as const:
   ready?'blocked-after-authored-stop' as const:'blocked-context' as const,
  source,sourceObjects:ready?p061SourceSnapshot('315',frame):null,
  originalRuntimeEstablished:false as const,audioRendered:false as const,
  requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',
  entryStateSha256:context.entryStateSha256?.trim()??''});
}
function InspectorRenderer(props:AnimationRendererProps){
 const context:RuntimeContext={frame:props.frame,frameDomain:props.frameDomain,rootFrame:props.rootFrame,
  scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay};
 if(!p061ProductContextReady(context)||props.frame>879)return <article role="alert" data-p061-inspector-status="blocked">
  The P061 source visual frame is unavailable.</article>;
 return <NmsL02P061ProductRendererV1 mainFrame={props.frame} uiLanguage={props.uiLanguage??props.lang}/>;
}
if(P061_DISPLAY_META.animationId!==P061_ID||P061_DISPLAY_META.sourceSwfSha256!==P061_SOURCE_SHA||
 P061_DISPLAY_META.mainFrames!==882||P061_DISPLAY_META.mainSpriteId!==315)
 throw Error('P061_PRODUCT_SOURCE_DISPLAY_MISMATCH');

export const nmsL02P061ProductModule:AnimationModule<ReturnType<typeof p061ProductFrameState>>=Object.freeze({
 key:P061_ID,movie:Object.freeze({stage,fps:12,frameCount:882,durationMs:882*1000/12}),
 runtime:Object.freeze({stage,fps:12,frameCount:10,durationMs:10*1000/12,
  defaultFrameDomain:'sprite-315',frameDomains:Object.freeze([{id:'sprite-315',frameCount:882,fps:12,rootFrame:6}])}),
 playbackMode:'once',playbackEndFrameByDomain:Object.freeze({root:1,'sprite-315':879}),reducedMotionFrame:879,
 scenarios:Object.freeze([
  {id:P061_PRODUCT_SCENARIO,label:'English source teaching sprite',description:'Maintained native DOM visual inspector; source-stopped at 879. Original runtime and listening remain unverified.'},
  {id:ROOT_SCENARIO,label:'Root timeline (blocked)',description:'Ten source root frames; preloader behavior is not recreated.'},
 ]),defaultScenarioByFrameDomain:Object.freeze({root:ROOT_SCENARIO,'sprite-315':P061_PRODUCT_SCENARIO}),
 audioCues:Object.freeze([]),
 transport:Object.freeze({mode:'visual-frame-inspector' as const,frameDomains:Object.freeze(['sprite-315']),stepFrames:12,
  stateReconstruction:'renderer-remount-on-seek' as const,audioDisposition:'disabled-while-inspecting' as const,
  legacyBehaviorParity:false as const,strictAcceptanceEffect:'none' as const}),
 maturity:'legacy-prototype',Renderer:InspectorRenderer,getFrameState:p061ProductFrameState,
});
