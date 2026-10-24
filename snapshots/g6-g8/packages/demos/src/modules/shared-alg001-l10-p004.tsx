'use client';
import type {AnimationModule} from '../contract';
import {ALG_L10_P004_SOURCE as SOURCE,algL10P004Frame} from '../alg-l10-p004-state-v1';
import {AlgL10P004Renderer} from '../alg-l10-p004-presentation-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:SOURCE.fps,frameCount:SOURCE.rootFrameCount,durationMs:SOURCE.rootFrameCount*1000/SOURCE.fps});
const animationModule:AnimationModule<ReturnType<typeof algL10P004Frame>>=Object.freeze({
 key:SOURCE.animationId,movie,
 runtime:Object.freeze({...movie,defaultFrameDomain:SOURCE.mainFrameDomain,frameDomains:Object.freeze([
  Object.freeze({id:'root',frameCount:SOURCE.rootFrameCount}),
  Object.freeze({id:SOURCE.mainFrameDomain,frameCount:SOURCE.mainFrameCount,rootFrame:SOURCE.rootEntryFrame}),
 ])}),
 maturity:'private-current-js',playbackMode:'once',playbackEndFrame:SOURCE.mainFrameCount,reducedMotionFrame:1,
 scenarios:Object.freeze([Object.freeze({id:'source-static-frame',label:'Source real world activity'})]),
 defaultScenarioByFrameDomain:Object.freeze({root:'source-static-frame',[SOURCE.mainFrameDomain]:'source-static-frame'}),
 // Audio remains owned by the dedicated source-bound player session.
 audioCues:Object.freeze([]),Renderer:AlgL10P004Renderer,getFrameState:algL10P004Frame,
});
export default animationModule;
