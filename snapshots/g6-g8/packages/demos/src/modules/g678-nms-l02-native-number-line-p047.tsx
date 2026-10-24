'use client';
import type {AnimationModule} from '../contract';
import {P047_AUDIO_PLANS} from '../generated/nms-l02-p047-audio-plan-v1';
import {P047_FRAME_DOMAINS,P047_SCENARIOS,P047_SOURCE_SHA256,p047ModuleFrame} from '../nms-l02-p047-frame-v1';
import {NmsL2P047Renderer} from '../nms-l02-p047-renderer-v1';
import {P047_TEXT_BINDING,p047TextSnapshot} from '../nms-l02-p047-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(P047_FRAME_DOMAINS).map(([id,frameCount])=>Object.freeze({id,frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:P047_SOURCE_SHA256,audio:P047_AUDIO_PLANS});
const defaults=Object.freeze({root:'source-inspection','sprite-81':'source-inspection','sprite-76':'celebration','sprite-78':'first-correct','sprite-80':'first-wrong','sprite-35':'help-example'});
const animationModule:AnimationModule<ReturnType<typeof p047ModuleFrame>>&{privateP047NumberLineInput:typeof source}=Object.freeze({
 key:'shared-nms002-l02-p047',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-81',frameDomains:domains}),
 playbackMode:'once',scenarios:Object.freeze(P047_SCENARIOS.map(id=>Object.freeze({id,label:id}))),defaultScenarioByFrameDomain:defaults,
 audioCues:Object.freeze([]),Renderer:NmsL2P047Renderer,getFrameState:p047ModuleFrame,privateP047NumberLineInput:source,
 textPresentation:Object.freeze({schemaVersion:1,binding:P047_TEXT_BINDING,Renderer:NmsL2P047Renderer,
  getSnapshot:(state:ReturnType<typeof p047ModuleFrame>)=>p047TextSnapshot(state),playbackEndFrameByDomain:Object.freeze({'sprite-81':140})}),
});
export default animationModule;
