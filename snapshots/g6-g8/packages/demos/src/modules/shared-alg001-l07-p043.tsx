'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P043_SOURCE as S} from '../alg-l07-p043-state-v1';
import {algL07P043Frame,P043_DOMAINS,P043_MOVIE as movie,P043_DEFAULTS as defaults} from '../alg-l07-p043-frame-v1';
import {AlgL07P043Renderer} from '../alg-l07-p043-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P043Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-407',frameDomains:P043_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Find the slope from a linear equation'},{id:'help',label:'Static source help with four glossary terms'},...(['b', 'c', 'd'] as const).flatMap(a=>[{id:`wrong-first-${a}`,label:`First incorrect answer ${a.toUpperCase()}`},{id:`wrong-second-${a}`,label:`Second incorrect answer ${a.toUpperCase()}`}]),{id:'right-feedback',label:'Correct A named feedback4'}]),defaultScenarioByFrameDomain:Object.freeze(defaults),audioCues:Object.freeze([]),Renderer:AlgL07P043Renderer,getFrameState:algL07P043Frame});
export default animationModule;
