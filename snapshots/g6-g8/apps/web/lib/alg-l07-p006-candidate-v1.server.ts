import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P006_ID as ID,p006LocalDevelopment} from './alg-l07-p006-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P006CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p006LocalDevelopment())throw Error('ALG_L07_P006_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[5];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==6||page.sectionCode!=='RW'||page.sectionPageOrdinal!==5||
  page.source.sourceOccurrence!==6||page.source.assetId!=='swf-72c7f3e0d0fd0a5251214c3511262bf164d983837a5c52e9f1e56d4de96df155')
  throw Error('ALG_L07_P006_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-223',language:'fixed-en' as const,
    scenario:'source-real-world',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p006-candidate-v1`,
  calibrationId:'g678-alg-l07-p006-source-candidate-v1',
  releaseId:`${base.releaseId}:p006-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p006-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
