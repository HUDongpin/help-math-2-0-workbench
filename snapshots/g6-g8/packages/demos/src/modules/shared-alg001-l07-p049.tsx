'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P049_SOURCE as S} from '../alg-l07-p049-state-v1';
import {algL07P049Frame,P049_DOMAINS,P049_MOVIE as movie,P049_DEFAULTS as defaults} from '../alg-l07-p049-frame-v1';
import {AlgL07P049Renderer} from '../alg-l07-p049-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P049Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-243',frameDomains:P049_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Choose the nonlinear function graph'},{id:'help',label:'Static source help with source glossary terms'},...(['a', 'c', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct B named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P049Renderer,getFrameState:algL07P049Frame});
export default animationModule;
