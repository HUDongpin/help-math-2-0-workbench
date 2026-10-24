'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P048_SOURCE as S} from '../alg-l07-p048-state-v1';
import {algL07P048Frame,P048_DOMAINS,P048_MOVIE as movie,P048_DEFAULTS as defaults} from '../alg-l07-p048-frame-v1';
import {AlgL07P048Renderer} from '../alg-l07-p048-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P048Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-332',frameDomains:P048_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Write the fundraiser equation'},{id:'help',label:'Static source help with source glossary terms'},...(['a', 'c', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct B named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P048Renderer,getFrameState:algL07P048Frame});
export default animationModule;
