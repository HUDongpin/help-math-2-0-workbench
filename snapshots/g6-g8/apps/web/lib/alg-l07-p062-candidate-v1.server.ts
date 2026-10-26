import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P062_ID as ID,p062LocalDevelopment} from './alg-l07-p062-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P062CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p062LocalDevelopment())throw Error('ALG_L07_P062_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[61];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==62||page.sectionCode!=='FQ'||page.sectionPageOrdinal!==2||
  page.source.sourceOccurrence!==62||page.source.assetId!=='swf-577ab968e3c2b0a287b69657bdf15330b6144c7be27ae62198512542e3106ed2')
  throw Error('ALG_L07_P062_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-1383',language:'fixed-en' as const,
    scenario:'source-quiz',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p062-candidate-v1`,
  calibrationId:'g678-alg-l07-p062-source-candidate-v1',
  releaseId:`${base.releaseId}:p062-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p062-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
