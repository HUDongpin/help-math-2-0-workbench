'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P001_SOURCE as SOURCE,algL07P001Frame} from '../alg-l07-p001-state-v1';
import {AlgL07P001Renderer} from '../alg-l07-p001-presentation-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const animationModule:AnimationModule<ReturnType<typeof algL07P001Frame>>=Object.freeze({key:SOURCE.animationId,movie,
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-142',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-142',frameCount:138,rootFrame:6}])}),
  maturity:'private-current-js',playbackMode:'loop',reducedMotionFrame:138,
  scenarios:Object.freeze([{id:'source-introduction',label:'Source introduction'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-introduction','sprite-142':'source-introduction'}),
  audioCues:Object.freeze([]),Renderer:AlgL07P001Renderer,getFrameState:algL07P001Frame,
});
export default animationModule;
