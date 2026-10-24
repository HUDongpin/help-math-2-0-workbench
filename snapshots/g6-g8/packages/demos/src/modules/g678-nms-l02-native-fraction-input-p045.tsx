'use client';
import type {AnimationModule} from '../contract';
import {P045_AUDIO_PLANS} from '../generated/nms-l02-p045-audio-plan-v1';
import {P045_FRAME_DOMAINS,P045_SCENARIOS,P045_SOURCE_SHA256,p045ModuleFrame} from '../nms-l02-p045-frame-v1';
import {NmsL2P045Renderer} from '../nms-l02-p045-renderer-v1';
import {P045_TEXT_BINDING,p045TextSnapshot} from '../nms-l02-p045-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(P045_FRAME_DOMAINS).map(([id,frameCount])=>Object.freeze({id,frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:P045_SOURCE_SHA256,audio:P045_AUDIO_PLANS});
const defaults=Object.freeze({root:'source-inspection','sprite-204':'source-inspection','sprite-189':'second-wrong-reveal','sprite-30':'help-example'});
const animationModule:AnimationModule<ReturnType<typeof p045ModuleFrame>>&{privateP045FractionInput:typeof source}=Object.freeze({
 key:'shared-nms002-l02-p045',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-204',frameDomains:domains}),
 playbackMode:'once',scenarios:Object.freeze(P045_SCENARIOS.map(id=>Object.freeze({id,label:id}))),defaultScenarioByFrameDomain:defaults,
 audioCues:Object.freeze([]),Renderer:NmsL2P045Renderer,getFrameState:p045ModuleFrame,privateP045FractionInput:source,
 textPresentation:Object.freeze({schemaVersion:1,binding:P045_TEXT_BINDING,Renderer:NmsL2P045Renderer,
  getSnapshot:(state:ReturnType<typeof p045ModuleFrame>)=>p045TextSnapshot(state),playbackEndFrameByDomain:Object.freeze({'sprite-204':450})}),
});
export default animationModule;
