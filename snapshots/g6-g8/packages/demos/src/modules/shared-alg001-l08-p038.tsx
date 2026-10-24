'use client';
import type {AnimationModule} from '../contract';
import {ALG_L08_P038_BEHAVIOR as S} from '../alg-l08-p038-behavior-source-v1';
import {algL08P038Frame,L8P038_DOMAINS,L8P038_MOVIE as movie,L8P038_DEFAULTS as defaults} from '../alg-l08-p038-frame-v1';
import {AlgL08P038Renderer} from '../alg-l08-p038-presentation-v1';
// Maintained advanced-manual module. Source domains retain independent frame counts.
const animationModule:AnimationModule<ReturnType<typeof algL08P038Frame>>=Object.freeze({
 key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-585',frameDomains:L8P038_DOMAINS}),
 maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,
 scenarios:Object.freeze([{id:'source-vocabulary',label:'Source graph and designated point slots'},
 {id:'coach',label:'Source static coach'},{id:'incomplete-hint',label:'Source incomplete selection hint'},
 {id:'wrong-first',label:'Source first incorrect attempt'},{id:'source-child',label:'Selected stopped source child'}]),
 defaultScenarioByFrameDomain:defaults,audioCues:Object.freeze([]),Renderer:AlgL08P038Renderer,getFrameState:algL08P038Frame,
});
export default animationModule;
