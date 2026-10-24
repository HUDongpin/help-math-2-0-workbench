import type {ComponentType} from 'react';
import type {AnimationModule, AnimationRendererProps, RuntimeContext} from './contract';
import {P044_CONFIG} from './g678-nms-l01-p044-controller';
import {P044_PRODUCT_STOPS} from './g678-nms-l01-p044-product-clock';
export const P044_SCENARIO = 'nms-l01-p044-source-behavior-candidate';
export function resolveP044CandidateFrame(frame: number, context: RuntimeContext) {
  const valid = Number.isSafeInteger(frame) && frame >= 1 && frame <= 756 && context.frame === frame &&
    (context.frameDomain ?? 'sprite-293') === 'sprite-293' && (context.rootFrame ?? 6) === 6 &&
    context.lang === 'en' && context.scenario === P044_SCENARIO && Number.isSafeInteger(context.seed) && context.seed >= 0 &&
    context.seed <= 0xffffffff && Number.isSafeInteger(context.replay ?? 0) && (context.replay ?? 0) >= 0;
  return Object.freeze({status:valid?'ready':'blocked',frame,frameDomain:'sprite-293',rootFrame:6,
    sourceSha256:P044_CONFIG.sourceSha256,currentJavaScriptRegistered:false,productCalibrationPassed:false,
    originalRuntimeAccepted:false,audioIntegrated:false,strictAcceptanceEffect:'none'});
}
/** Isolated candidate loader supplies a renderer with an explicit visual-ready
 * host hold. This factory itself never registers a module. */
export function createP044CandidateModule(Renderer: ComponentType<AnimationRendererProps>): AnimationModule {
  const movie=Object.freeze({stage:P044_CONFIG.stage,fps:12,frameCount:10,durationMs:Math.round(10000/12)});
  return Object.freeze({key:P044_CONFIG.animationId,maturity:'private-current-js',movie,
    runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-293',frameDomains:Object.freeze([
      Object.freeze({id:'root',frameCount:10,fps:12}),Object.freeze({id:'sprite-293',frameCount:759,fps:12,rootFrame:6}),
    ])}),playbackMode:'once',playbackEndFrame:756,playbackEndFrameByDomain:Object.freeze({root:1,'sprite-293':756}),reducedMotionFrame:756,
    scenarios:Object.freeze([Object.freeze({id:P044_SCENARIO,label:'Source-bound jeans word problem',
      description:'Unregistered local candidate. Full page behavior and source artwork; audio and independent acceptance remain pending.'})]),
    defaultScenarioByFrameDomain:Object.freeze({'sprite-293':P044_SCENARIO}),interactiveStops:P044_PRODUCT_STOPS,
    audioCues:Object.freeze([]),audioTracks:Object.freeze([]),interactiveAudioAssets:Object.freeze([]),
    lessonHost:Object.freeze({capabilities:Object.freeze(['glossary','practice-feedback'] as const),legacyOperations:'blocked',auditStorage:'memory-only',storesPersonalData:false}),
    Renderer,getFrameState:resolveP044CandidateFrame});
}
