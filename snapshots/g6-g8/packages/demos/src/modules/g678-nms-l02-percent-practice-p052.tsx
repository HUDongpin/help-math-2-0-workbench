'use client';
import React from 'react';
import type {AnimationModule,AnimationRendererProps} from '../contract';
import {P052_CAPTURE_SCENARIOS} from '../nms-l02-p052-capture-state-v1';
import {p052ModuleCapture} from '../timelines/g678-nms-l02-percent-practice-p052';
export {p052ModuleCapture} from '../timelines/g678-nms-l02-percent-practice-p052';
import {P052CaptureRenderer} from '../nms-l02-p052-capture-renderer-v1';
import {P052_TEXT_BINDING,p052TextSnapshot} from '../nms-l02-p052-text-snapshot-v1';
import {P052_AUDIO_PLANS} from '../generated/nms-l02-p052-runtime-audio-v1';
/** Candidate inspection only. Full identities are mandatory, and replay here
 * is not the interactive player's reset operation. Never register this as an
 * autoplay substitute for the owned P052Controller/MyLesson adapter. */
function Renderer(props:AnimationRendererProps){
 const lang=props.uiLanguage==='es'?'es':props.lang;
 if(props.uiLanguage!==undefined&&props.uiLanguage!==lang&&props.uiLanguage!==props.lang)throw Error('P052_CAPTURE_UI_LANGUAGE');
 return <P052CaptureRenderer request={p052ModuleCapture(props.frame,{...props,lang}).request}/>;
}
const movie={stage:{width:800,height:600},fps:12,frameCount:10,durationMs:10000/12};
/** Structural root metadata is preserved, but only sprite350 inspection is
 * implemented. No invented root/preloader renderer or acceptance is implied. */
const source={version:1 as const,sourceSwfSha256:P052_TEXT_BINDING.sourceSwfSha256,audio:P052_AUDIO_PLANS};
const candidate:AnimationModule<ReturnType<typeof p052ModuleCapture>>&{privateP052PercentPractice:typeof source}={
 key:'shared-nms002-l02-p052',movie,maturity:'private-current-js',playbackMode:'once',
 runtime:{...movie,defaultFrameDomain:'sprite-350',frameDomains:[{id:'sprite-350',frameCount:156,rootFrame:6}]},
 scenarios:Object.keys(P052_CAPTURE_SCENARIOS).map(id=>({id,label:id})),
 defaultScenarioByFrameDomain:{'sprite-350':'intro'},audioCues:[],Renderer,getFrameState:p052ModuleCapture,
 privateP052PercentPractice:source,
 textPresentation:{schemaVersion:1,binding:P052_TEXT_BINDING,Renderer,
  getSnapshot(state,context){
   const current=p052ModuleCapture(context.frame,context);
   if(JSON.stringify(state)!==JSON.stringify(current))throw Error('P052_MODULE_TEXT_STATE_MISMATCH');
   return p052TextSnapshot(current.request);
  }},
};
export default candidate;
