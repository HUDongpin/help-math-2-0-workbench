'use client';
import type { AnimationModule } from '../contract';
import { P043_AUDIO_PLANS } from '../generated/nms-l02-p043-audio-plan-v1';
import { P043_FRAME_DOMAINS, P043_SCENARIOS, P043_SOURCE_SHA256, p043ModuleFrame } from '../nms-l02-p043-frame-v1';
import { NmsL2P043Renderer } from '../nms-l02-p043-renderer-v1';
import { P043_TEXT_BINDING, p043TextSnapshot } from '../nms-l02-p043-text-v1';
const movie = Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains = Object.freeze(Object.entries(P043_FRAME_DOMAINS).map(([id,frameCount])=>Object.freeze({id,frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source = Object.freeze({version:1 as const,sourceSwfSha256:P043_SOURCE_SHA256,audio:P043_AUDIO_PLANS});
const defaults = Object.freeze(Object.fromEntries(Object.keys(P043_FRAME_DOMAINS).map(id=>[id,
  id==='root'||id==='sprite-250'?'source-inspection':id==='sprite-245'?'wrong-fraction-row1':id==='sprite-249'?'correct-fraction-row2':'four-matches-completion'])));
const animationModule: AnimationModule<ReturnType<typeof p043ModuleFrame>> & {privateP043Matching:typeof source} = Object.freeze({
  key:'shared-nms002-l02-p043',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-250',frameDomains:domains}),
  playbackMode:'once',scenarios:Object.freeze(P043_SCENARIOS.map(id=>Object.freeze({id,label:id}))),defaultScenarioByFrameDomain:defaults,
  audioCues:Object.freeze([]),Renderer:NmsL2P043Renderer,getFrameState:p043ModuleFrame,privateP043Matching:source,
  textPresentation:Object.freeze({schemaVersion:1,binding:P043_TEXT_BINDING,Renderer:NmsL2P043Renderer,
    getSnapshot:(state:ReturnType<typeof p043ModuleFrame>)=>p043TextSnapshot(state),playbackEndFrameByDomain:Object.freeze({'sprite-250':223})}),
});
export default animationModule;
