'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P047_SOURCE as S} from '../alg-l07-p047-state-v1';
import {algL07P047Frame,P047_DOMAINS,P047_MOVIE as movie,P047_DEFAULTS as defaults} from '../alg-l07-p047-frame-v1';
import {AlgL07P047Renderer} from '../alg-l07-p047-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P047Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-447',frameDomains:P047_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Calculate the rate per minute from the graph'},{id:'help',label:'Static source help with thirteen glossary terms'},...(['a', 'c', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct B named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P047Renderer,getFrameState:algL07P047Frame});
export default animationModule;
