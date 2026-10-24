'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P045_SOURCE as S} from '../alg-l07-p045-state-v1';
import {algL07P045Frame,P045_DOMAINS,P045_MOVIE as movie,P045_DEFAULTS as defaults} from '../alg-l07-p045-frame-v1';
import {AlgL07P045Renderer} from '../alg-l07-p045-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P045Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-407',frameDomains:P045_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Find the y-intercept from the linear equation'},{id:'help',label:'Static source help with five glossary terms'},...(['a', 'c', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct B named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P045Renderer,getFrameState:algL07P045Frame});
export default animationModule;
