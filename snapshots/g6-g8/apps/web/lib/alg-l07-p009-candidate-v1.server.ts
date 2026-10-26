import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P009_ID as ID,p009LocalDevelopment} from './alg-l07-p009-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P009CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p009LocalDevelopment())throw Error('ALG_L07_P009_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[8];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==9||page.sectionCode!=='VB'||page.sectionPageOrdinal!==3||
  page.source.sourceOccurrence!==9||page.source.assetId!=='swf-2c0858e617f4bf2a26d412523417f3a5cbee78e378de35847fe9e9d0555003b1')
  throw Error('ALG_L07_P009_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-80',language:'fixed-en' as const,
    scenario:'source-demo',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p009-candidate-v1`,
  calibrationId:'g678-alg-l07-p009-source-candidate-v1',
  releaseId:`${base.releaseId}:p009-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p009-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
