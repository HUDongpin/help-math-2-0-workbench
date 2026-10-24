'use client';
import React from 'react';
import type {AnimationModule,AnimationRendererProps,RuntimeContext} from './contract';
import {P062_ID,P062_SOURCE_SHA,p062SourceFrame} from './nms-l02-p062-state-v1';
import {P062_DISPLAY_META,p062SourceSnapshot} from './generated/nms-l02-p062-display-list-v1';
import {P062_AUDIO_DOMAINS} from './nms-l02-p062-audio-v1';
import {NmsL02P062ProductRendererV1} from './nms-l02-p062-product-renderer-v1';

export const P062_PRODUCT_SCENARIO='source-static-frame';
const ROOT_SCENARIO='root-unavailable';
const stage=Object.freeze({width:800,height:600});
const mainAudio=P062_AUDIO_DOMAINS['sprite-315'];
export const P062_PRODUCT_SOURCE_AUDIO=Object.freeze({
 path:'output/nms-l02-p062-source-20260928/extraction/audio/sprite-315.mp3',
 bytes:mainAudio.bytes,sha256:mainAudio.sha256,decodedSamples:mainAudio.decodedSamples,
 sampleRate:mainAudio.sampleRate,channels:mainAudio.channels,
 firstBlockFrame:mainAudio.firstBlockFrame,lastBlockFrame:mainAudio.lastBlockFrame,
 disposition:'private-source-evidence-not-module-audio-cue' as const,
});

export function p062ProductContextReady(context:RuntimeContext):boolean{
 return Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=837&&
  context.frameDomain==='sprite-315'&&context.rootFrame===6&&
  context.scenario===P062_PRODUCT_SCENARIO&&context.lang==='en'&&
  context.seed===0&&Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0;
}
/** All 837 source frames stay inspectable; normal presentation holds at authored stop 834. */
export function p062ProductFrameState(frame:number,context:RuntimeContext){
 const source=Number.isInteger(frame)&&frame>=1&&frame<=837?p062SourceFrame(frame):null;
 const ready=frame===context.frame&&p062ProductContextReady(context);
 return Object.freeze({animationId:P062_ID,sourceSwfSha256:P062_SOURCE_SHA,
  frame,frameDomain:context.frameDomain??null,rootFrame:context.rootFrame??null,
  scenario:context.scenario,language:context.lang,seed:context.seed,
  status:ready?'ready' as const:'blocked' as const,
  visualStatus:ready&&frame<=834?'renderable' as const:
   ready?'blocked-after-authored-stop' as const:'blocked-context' as const,
  source,sourceObjects:ready?p062SourceSnapshot('315',frame):null,
  sourceGlossaryControlsPresent:false as const,
  originalRuntimeEstablished:false as const,audioRendered:false as const,
  requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',
  entryStateSha256:context.entryStateSha256?.trim()??''});
}
function InspectorRenderer(props:AnimationRendererProps){
 const context:RuntimeContext={frame:props.frame,frameDomain:props.frameDomain,rootFrame:props.rootFrame,
  scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay};
 if(!p062ProductContextReady(context)||props.frame>834)return <article role="alert" data-p062-inspector-status="blocked">
  The P062 source visual frame is unavailable.</article>;
 return <NmsL02P062ProductRendererV1 mainFrame={props.frame} uiLanguage={props.uiLanguage??props.lang}/>;
}
if(P062_DISPLAY_META.animationId!==P062_ID||P062_DISPLAY_META.sourceSwfSha256!==P062_SOURCE_SHA||
 P062_DISPLAY_META.mainFrames!==837||P062_DISPLAY_META.mainSpriteId!==315)
 throw Error('P062_PRODUCT_SOURCE_DISPLAY_MISMATCH');

export const nmsL02P062ProductModule:AnimationModule<ReturnType<typeof p062ProductFrameState>>=Object.freeze({
 key:P062_ID,movie:Object.freeze({stage,fps:12,frameCount:837,durationMs:837*1000/12}),
 runtime:Object.freeze({stage,fps:12,frameCount:10,durationMs:10*1000/12,
  defaultFrameDomain:'sprite-315',frameDomains:Object.freeze([{id:'sprite-315',frameCount:837,fps:12,rootFrame:6}])}),
 playbackMode:'once',playbackEndFrameByDomain:Object.freeze({root:1,'sprite-315':834}),reducedMotionFrame:834,
 scenarios:Object.freeze([
  {id:P062_PRODUCT_SCENARIO,label:'English source teaching sprite',description:'Maintained native DOM visual inspector; source-stopped at 834. Original runtime and listening remain unverified.'},
  {id:ROOT_SCENARIO,label:'Root timeline (blocked)',description:'Ten source root frames; preloader behavior is not recreated.'},
 ]),defaultScenarioByFrameDomain:Object.freeze({root:ROOT_SCENARIO,'sprite-315':P062_PRODUCT_SCENARIO}),
 audioCues:Object.freeze([]),
 transport:Object.freeze({mode:'visual-frame-inspector' as const,frameDomains:Object.freeze(['sprite-315']),stepFrames:12,
  stateReconstruction:'renderer-remount-on-seek' as const,audioDisposition:'disabled-while-inspecting' as const,
  legacyBehaviorParity:false as const,strictAcceptanceEffect:'none' as const}),
 maturity:'legacy-prototype',Renderer:InspectorRenderer,getFrameState:p062ProductFrameState,
});
