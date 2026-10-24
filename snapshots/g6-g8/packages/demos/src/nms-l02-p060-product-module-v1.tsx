'use client';
import React from 'react';
import type {AnimationModule,AnimationRendererProps,RuntimeContext} from './contract';
import {P060_ID,P060_SOURCE_SHA,p060SourceFrame} from './nms-l02-p060-state-v1';
import {P060_DISPLAY_META,p060SourceSnapshot} from './generated/nms-l02-p060-display-list-v1';
import {NmsL02P060ProductRendererV1} from './nms-l02-p060-product-renderer-v1';

export const P060_PRODUCT_SCENARIO='source-static-frame';
const ROOT_SCENARIO='root-unavailable';
const stage=Object.freeze({width:800,height:600});
export const P060_PRODUCT_SOURCE_AUDIO=Object.freeze({
 path:'output/nms-l02-p060-source-20260927/extraction/audio/sprite-391.mp3',bytes:290940,
 sha256:'78a98c5d3158f1fd41c9fd874380fe2a4a239d786e231597886a94cd1d6b67d0',
 decodedSamples:1289088,sampleRate:22050,channels:1,firstBlockFrame:9,lastBlockFrame:711,
 disposition:'private-source-evidence-not-module-audio-cue' as const,
});

export function p060ProductContextReady(context:RuntimeContext):boolean{
 return Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=721&&
  context.frameDomain==='sprite-391'&&context.rootFrame===6&&
  context.scenario===P060_PRODUCT_SCENARIO&&context.lang==='en'&&
  context.seed===0&&Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0;
}
/** Introspection retains all 721 source frames; normal presentation holds at authored stop 718. */
export function p060ProductFrameState(frame:number,context:RuntimeContext){
 const source=Number.isInteger(frame)&&frame>=1&&frame<=721?p060SourceFrame(frame):null;
 const ready=frame===context.frame&&p060ProductContextReady(context);
 return Object.freeze({animationId:P060_ID,sourceSwfSha256:P060_SOURCE_SHA,
  frame,frameDomain:context.frameDomain??null,rootFrame:context.rootFrame??null,
  scenario:context.scenario,language:context.lang,seed:context.seed,
  status:ready?'ready' as const:'blocked' as const,
  visualStatus:ready&&frame<=718?'renderable' as const:
   ready?'blocked-after-authored-stop' as const:'blocked-context' as const,
  source,sourceObjects:ready?p060SourceSnapshot('391',frame):null,
  originalRuntimeEstablished:false as const,audioRendered:false as const,
  requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',
  entryStateSha256:context.entryStateSha256?.trim()??''});
}
function InspectorRenderer(props:AnimationRendererProps){
 const context:RuntimeContext={frame:props.frame,frameDomain:props.frameDomain,rootFrame:props.rootFrame,
  scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay};
 if(!p060ProductContextReady(context)||props.frame>718)return <article role="alert" data-p060-inspector-status="blocked">
  The P060 source visual frame is unavailable.</article>;
 return <NmsL02P060ProductRendererV1 mainFrame={props.frame} uiLanguage={props.uiLanguage??props.lang}/>;
}
if(P060_DISPLAY_META.animationId!==P060_ID||P060_DISPLAY_META.sourceSwfSha256!==P060_SOURCE_SHA||
 P060_DISPLAY_META.mainFrames!==721||P060_DISPLAY_META.mainSpriteId!==391)
 throw Error('P060_PRODUCT_SOURCE_DISPLAY_MISMATCH');

export const nmsL02P060ProductModule:AnimationModule<ReturnType<typeof p060ProductFrameState>>=Object.freeze({
 key:P060_ID,movie:Object.freeze({stage,fps:12,frameCount:721,durationMs:721*1000/12}),
 runtime:Object.freeze({stage,fps:12,frameCount:10,durationMs:10*1000/12,
  defaultFrameDomain:'sprite-391',frameDomains:Object.freeze([{id:'sprite-391',frameCount:721,fps:12,rootFrame:6}])}),
 playbackMode:'once',playbackEndFrameByDomain:Object.freeze({root:1,'sprite-391':718}),reducedMotionFrame:718,
 scenarios:Object.freeze([
  {id:P060_PRODUCT_SCENARIO,label:'English source teaching sprite',description:'Maintained native DOM visual inspector; source-stopped at 718. Original runtime and listening remain unverified.'},
  {id:ROOT_SCENARIO,label:'Root timeline (blocked)',description:'Ten source root frames; preloader behavior is not recreated.'},
 ]),defaultScenarioByFrameDomain:Object.freeze({root:ROOT_SCENARIO,'sprite-391':P060_PRODUCT_SCENARIO}),
 audioCues:Object.freeze([]),
 transport:Object.freeze({mode:'visual-frame-inspector' as const,frameDomains:Object.freeze(['sprite-391']),stepFrames:12,
  stateReconstruction:'renderer-remount-on-seek' as const,audioDisposition:'disabled-while-inspecting' as const,
  legacyBehaviorParity:false as const,strictAcceptanceEffect:'none' as const}),
 maturity:'legacy-prototype',Renderer:InspectorRenderer,getFrameState:p060ProductFrameState,
});
