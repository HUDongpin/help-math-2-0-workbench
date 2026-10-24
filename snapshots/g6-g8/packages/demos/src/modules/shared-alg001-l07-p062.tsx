'use client';
import type {AnimationModule} from '../contract';
import {algL07P062Frame,P062_MOVIE as movie,P062_DOMAINS,P062_DEFAULTS} from '../alg-l07-p062-frame-v1';
import {AlgL07P062Renderer} from '../alg-l07-p062-renderer-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P062Frame>>=Object.freeze({key:'shared-alg001-l07-p062',movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-1383',frameDomains:P062_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:[{id:'source-quiz',label:'Source quiz'},...Array.from({length:11},(_,score)=>({id:`finish-${score}`,label:`Finish score ${score}`}))],defaultScenarioByFrameDomain:P062_DEFAULTS,audioCues:[],Renderer:AlgL07P062Renderer,getFrameState:algL07P062Frame});
export default animationModule;
