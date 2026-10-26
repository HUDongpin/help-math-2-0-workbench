import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P034_ID as ID,p034LocalDevelopment} from './alg-l07-p034-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P034CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p034LocalDevelopment())throw Error('ALG_L07_P034_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[33];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==34||page.sectionCode!=='IN'||page.sectionPageOrdinal!==14||
  page.source.sourceOccurrence!==34||page.source.assetId!=='swf-f46c9d99df171d468b6c05f8ff9e6afa2908072e955a895fb36144e54003d8d2')
  throw Error('ALG_L07_P034_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-86',language:'fixed-en' as const,
    scenario:'source-instruction',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p034-candidate-v1`,
  calibrationId:'g678-alg-l07-p034-source-candidate-v1',
  releaseId:`${base.releaseId}:p034-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p034-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
