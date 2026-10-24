'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P042_SOURCE as S} from '../alg-l07-p042-state-v1';
import {algL07P042Frame,P042_DOMAINS,P042_MOVIE as movie,P042_DEFAULTS as defaults} from '../alg-l07-p042-frame-v1';
import {AlgL07P042Renderer} from '../alg-l07-p042-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P042Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-376',frameDomains:P042_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Find the slope from a graph'},{id:'help',label:'Static source help with twelve glossary terms'},...(['a', 'b', 'c'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct D named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P042Renderer,getFrameState:algL07P042Frame});
export default animationModule;
