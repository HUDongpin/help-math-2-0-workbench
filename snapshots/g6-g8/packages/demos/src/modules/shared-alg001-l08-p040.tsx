'use client';
import type{AnimationModule}from'../contract';
import{algL08P040Frame,P040_MOVIE as movie,P040_DOMAINS}from'../alg-l08-p040-frame-v1';
import{AlgL08P040Renderer}from'../alg-l08-p040-frame-v1';
const animationModule:AnimationModule<ReturnType<typeof algL08P040Frame>>=Object.freeze({key:'shared-alg001-l08-p040',movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-255',frameDomains:P040_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:[{id:'source-game',label:'Source game'}],defaultScenarioByFrameDomain:Object.freeze({root:'source-game','sprite-255':'source-game'}),audioCues:[],Renderer:AlgL08P040Renderer,getFrameState:algL08P040Frame});export default animationModule;
