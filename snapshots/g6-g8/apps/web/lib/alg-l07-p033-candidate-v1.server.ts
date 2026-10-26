import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P033_ID as ID,p033LocalDevelopment} from './alg-l07-p033-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P033CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p033LocalDevelopment())throw Error('ALG_L07_P033_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[32];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==33||page.sectionCode!=='IN'||page.sectionPageOrdinal!==13||
  page.source.sourceOccurrence!==33||page.source.assetId!=='swf-89295b0afacf24fc1d5ed35cb4d67ce977a5c951533743aafb0edd92c8609954')
  throw Error('ALG_L07_P033_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-185',language:'fixed-en' as const,
    scenario:'source-instruction',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p033-candidate-v1`,
  calibrationId:'g678-alg-l07-p033-source-candidate-v1',
  releaseId:`${base.releaseId}:p033-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p033-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
