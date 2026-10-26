import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P042_ID as ID,p042LocalDevelopment} from './alg-l07-p042-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P042CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p042LocalDevelopment())throw Error('ALG_L07_P042_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[41];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==42||page.sectionCode!=='TI'||page.sectionPageOrdinal!==4||
  page.source.sourceOccurrence!==42||page.source.assetId!=='swf-43262ba3b945b7e6d43e347105274e0205b26565b95fad815917516883c6abf3')
  throw Error('ALG_L07_P042_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-376',language:'fixed-en' as const,
    scenario:'source-question',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p042-candidate-v1`,
  calibrationId:'g678-alg-l07-p042-source-candidate-v1',
  releaseId:`${base.releaseId}:p042-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p042-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
