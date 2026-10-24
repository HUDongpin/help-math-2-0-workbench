'use client';
import type{AnimationModule}from'../contract';
import{algL08P050Frame,P050_MOVIE as movie,P050_DOMAINS,P050_DEFAULTS}from'../alg-l08-p050-frame-v1';
import{AlgL08P050Renderer}from'../alg-l08-p050-renderer-v1';
const animationModule:AnimationModule<ReturnType<typeof algL08P050Frame>>=Object.freeze({key:'shared-alg001-l08-p050',movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-960',frameDomains:P050_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:[{id:'source-quiz',label:'Source quiz'}],defaultScenarioByFrameDomain:P050_DEFAULTS,audioCues:[],Renderer:AlgL08P050Renderer,getFrameState:algL08P050Frame});export default animationModule;
