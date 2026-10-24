'use client';
import type {AnimationModule} from '../contract';
import {P046_AUDIO_PLANS} from '../generated/nms-l02-p046-audio-plan-v1';
import {P046_FRAME_DOMAINS,P046_SCENARIOS,P046_SOURCE_SHA256,p046ModuleFrame} from '../nms-l02-p046-frame-v1';
import {NmsL2P046Renderer} from '../nms-l02-p046-renderer-v1';
import {P046_TEXT_BINDING,p046TextSnapshot} from '../nms-l02-p046-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(P046_FRAME_DOMAINS).map(([id,frameCount])=>Object.freeze({id,frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:P046_SOURCE_SHA256,audio:P046_AUDIO_PLANS});
const defaults=Object.freeze({root:'source-inspection','sprite-205':'source-inspection','sprite-168':'second-wrong-reveal','sprite-30':'help-example'});
const animationModule:AnimationModule<ReturnType<typeof p046ModuleFrame>>&{privateP046FractionInput:typeof source}=Object.freeze({
 key:'shared-nms002-l02-p046',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-205',frameDomains:domains}),
 playbackMode:'once',scenarios:Object.freeze(P046_SCENARIOS.map(id=>Object.freeze({id,label:id}))),defaultScenarioByFrameDomain:defaults,
 audioCues:Object.freeze([]),Renderer:NmsL2P046Renderer,getFrameState:p046ModuleFrame,privateP046FractionInput:source,
 textPresentation:Object.freeze({schemaVersion:1,binding:P046_TEXT_BINDING,Renderer:NmsL2P046Renderer,
  getSnapshot:(state:ReturnType<typeof p046ModuleFrame>)=>p046TextSnapshot(state),playbackEndFrameByDomain:Object.freeze({'sprite-205':654})}),
});
export default animationModule;
