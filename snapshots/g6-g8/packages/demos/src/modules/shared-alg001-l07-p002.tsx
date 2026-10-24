'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P002_SOURCE as SOURCE,algL07P002Frame} from '../alg-l07-p002-state-v1';
import {ALG_L07_P002_TEXT_BINDING,algL07P002TextSnapshot} from '../alg-l07-p002-text-v1';
import {AlgL07P002Renderer} from '../alg-l07-p002-presentation-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const animationModule:AnimationModule<ReturnType<typeof algL07P002Frame>>=Object.freeze({key:SOURCE.animationId,movie,
 runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-452',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-452',frameCount:1195,rootFrame:6}])}),
 maturity:'private-current-js',playbackMode:'once',playbackEndFrameByDomain:Object.freeze({'sprite-452':1195}),reducedMotionFrame:1195,
 scenarios:Object.freeze([{id:'source-static-frame',label:'Source phone service plans'}]),
 defaultScenarioByFrameDomain:Object.freeze({root:'source-static-frame','sprite-452':'source-static-frame'}),
 lessonTextPresentation:Object.freeze({schemaVersion:1,binding:ALG_L07_P002_TEXT_BINDING,Renderer:AlgL07P002Renderer,playbackEndFrameByDomain:Object.freeze({'sprite-452':1195}),reducedMotionFrameByDomain:Object.freeze({'sprite-452':1195}),getSnapshot:algL07P002TextSnapshot}),
 audioCues:Object.freeze([]),Renderer:AlgL07P002Renderer,getFrameState:algL07P002Frame});
export default animationModule;
