'use client';
import type {AnimationModule} from '../contract';
import {ALG_L07_P046_SOURCE as S} from '../alg-l07-p046-state-v1';
import {algL07P046Frame,P046_DOMAINS,P046_MOVIE as movie,P046_DEFAULTS as defaults} from '../alg-l07-p046-frame-v1';
import {AlgL07P046Renderer} from '../alg-l07-p046-presentation-v1';
const animationModule:AnimationModule<ReturnType<typeof algL07P046Frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-288',frameDomains:P046_DOMAINS}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:Object.freeze([{id:'source-question',label:'Graph y = one third x + 2 with two source points'},{id:'help',label:'Static source help with fourteen glossary terms'},{id:'missing-points',label:'Draw instruction with an empty selection slot'},{id:'point-state',label:'Named point or dynamic clone local frame'},{id:'wrong-first',label:'First incorrect draw'},{id:'wrong-second',label:'Second incorrect draw'},{id:'right-feedback',label:'Correct draw selected right branch'},{id:'postquiz-help',label:'Help retained through the source explanation'}]),defaultScenarioByFrameDomain:defaults,audioCues:Object.freeze([]),Renderer:AlgL07P046Renderer,getFrameState:algL07P046Frame});
export default animationModule;
