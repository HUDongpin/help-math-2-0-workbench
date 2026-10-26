import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P046_ID as ID,p046LocalDevelopment} from './alg-l08-p046-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P046CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP046CandidateDescriptor();
}
export async function algL08P046CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p046LocalDevelopment())throw Error('ALG_L08_P046_ASYNC_SCOPE');
 return buildP046CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP046CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p046LocalDevelopment())throw Error('ALG_L08_P046_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[45];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==46||page.sectionCode!=='TS'||page.sectionPageOrdinal!==6||
  page.source.sourceOccurrence!==46||page.source.assetId!=='swf-7e7e5567267ca02005a01d71c2da085602d258bc95a581cd23856c364407cd23')
  throw Error('ALG_L08_P046_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-329',language:'fixed-en' as const,
    scenario:'source-question',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p046-candidate-v1`,
  calibrationId:'g678-alg-l08-p046-source-candidate-v1',
  releaseId:`${base.releaseId}:p046-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p046-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
