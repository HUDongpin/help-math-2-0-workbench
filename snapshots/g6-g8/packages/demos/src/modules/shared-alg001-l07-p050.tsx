'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P050_SOURCE as S} from '../alg-l07-p050-state-v1';
import {algL07P050Frame,P050_DOMAINS,P050_MOVIE as movie,P050_DEFAULTS as defaults} from '../alg-l07-p050-frame-v1';
import {AlgL07P050Renderer} from '../alg-l07-p050-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P050Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-345',frameDomains:P050_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Evaluate the circle area at radius three'},{id:'help',label:'Static source help with source glossary terms'},...(['a', 'b', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct C named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P050Renderer,getFrameState:algL07P050Frame});
export default animationModule;
