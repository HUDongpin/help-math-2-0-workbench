'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P044_SOURCE as S} from '../alg-l07-p044-state-v1';
import {algL07P044Frame,P044_DOMAINS,P044_MOVIE as movie,P044_DEFAULTS as defaults} from '../alg-l07-p044-frame-v1';
import {AlgL07P044Renderer} from '../alg-l07-p044-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P044Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-417',frameDomains:P044_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Find the y-intercept from the graph'},{id:'help',label:'Static source help with five glossary terms'},...(['a', 'c', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct B named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P044Renderer,getFrameState:algL07P044Frame});
export default animationModule;
