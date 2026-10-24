'use client';
import type { AnimationModule } from '../contract';
import { P044_AUDIO_PLANS } from '../generated/nms-l02-p044-audio-plan-v1';
import { P044_FRAME_DOMAINS, P044_SCENARIOS, P044_SOURCE_SHA256, p044ModuleFrame } from '../nms-l02-p044-frame-v1';
import { NmsL2P044Renderer } from '../nms-l02-p044-renderer-v1';
import { P044_TEXT_BINDING, p044TextSnapshot } from '../nms-l02-p044-text-v1';
const movie = Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains = Object.freeze(Object.entries(P044_FRAME_DOMAINS).map(([id,frameCount])=>Object.freeze({id,frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source = Object.freeze({version:1 as const,sourceSwfSha256:P044_SOURCE_SHA256,audio:P044_AUDIO_PLANS});
const defaults=Object.freeze({root:'source-inspection','sprite-243':'source-inspection','sprite-219':'partition-inspection','sprite-234':'first-wrong','sprite-235':'second-wrong-reveal','sprite-238':'first-correct','sprite-29':'help-example'});
const animationModule: AnimationModule<ReturnType<typeof p044ModuleFrame>> & {privateP044PartitionPractice:typeof source} = Object.freeze({
  key:'shared-nms002-l02-p044',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-243',frameDomains:domains}),
  playbackMode:'once',scenarios:Object.freeze(P044_SCENARIOS.map(id=>Object.freeze({id,label:id}))),defaultScenarioByFrameDomain:defaults,
  audioCues:Object.freeze([]),Renderer:NmsL2P044Renderer,getFrameState:p044ModuleFrame,privateP044PartitionPractice:source,
  textPresentation:Object.freeze({schemaVersion:1,binding:P044_TEXT_BINDING,Renderer:NmsL2P044Renderer,
    getSnapshot:(state:ReturnType<typeof p044ModuleFrame>)=>p044TextSnapshot(state),playbackEndFrameByDomain:Object.freeze({'sprite-243':361})}),
});
export default animationModule;
