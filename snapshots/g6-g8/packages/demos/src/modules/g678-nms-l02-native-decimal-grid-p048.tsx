'use client';
import type {AnimationModule} from '../contract';
import {P048_AUDIO_PLANS} from '../generated/nms-l02-p048-audio-plan-v1';
import {P048_FRAME_DOMAINS,P048_SCENARIOS,P048_SOURCE_SHA256,p048ModuleFrame} from '../nms-l02-p048-frame-v1';
import {NmsL2P048Renderer} from '../nms-l02-p048-renderer-v1';
import {P048_TEXT_BINDING,p048TextSnapshot} from '../nms-l02-p048-text-v1';
const movie={stage:{width:800,height:600},fps:12,frameCount:10,durationMs:10000/12};
const domains=Object.entries(P048_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,...(id==='root'?{}:{rootFrame:6})}));
const source={version:1 as const,sourceSwfSha256:P048_SOURCE_SHA256,audio:P048_AUDIO_PLANS};
const animationModule:AnimationModule<ReturnType<typeof p048ModuleFrame>>&{privateP048DecimalInput:typeof source}={
 key:'shared-nms002-l02-p048',movie,maturity:'private-current-js',runtime:{...movie,defaultFrameDomain:'sprite-498',frameDomains:domains},
 playbackMode:'once',scenarios:P048_SCENARIOS.map(id=>({id,label:id})),defaultScenarioByFrameDomain:{root:'source-inspection','sprite-498':'source-inspection','sprite-442':'first-correct','sprite-448':'first-correct','sprite-444':'first-wrong','sprite-450':'second-wrong-reveal','sprite-488':'help-example'},
 audioCues:[],Renderer:NmsL2P048Renderer,getFrameState:p048ModuleFrame,privateP048DecimalInput:source,
 textPresentation:{schemaVersion:1,binding:P048_TEXT_BINDING,Renderer:NmsL2P048Renderer,getSnapshot:(state)=>p048TextSnapshot(state),playbackEndFrameByDomain:{'sprite-498':330}},
};
export default animationModule;
