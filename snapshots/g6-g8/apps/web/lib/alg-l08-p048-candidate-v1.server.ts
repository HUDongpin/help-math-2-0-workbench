import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P048_ID as ID,p048LocalDevelopment} from './alg-l08-p048-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P048CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP048CandidateDescriptor();
}
export async function algL08P048CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p048LocalDevelopment())throw Error('ALG_L08_P048_ASYNC_SCOPE');
 return buildP048CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP048CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p048LocalDevelopment())throw Error('ALG_L08_P048_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[47];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==48||page.sectionCode!=='TS'||page.sectionPageOrdinal!==8||
  page.source.sourceOccurrence!==48||page.source.assetId!=='swf-1f69c8f3794f29dd6345f5a827d4162b2008e21f6f83ad20c93c4c96e708be7d')
  throw Error('ALG_L08_P048_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-332',language:'fixed-en' as const,
    scenario:'source-question',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p048-candidate-v1`,
  calibrationId:'g678-alg-l08-p048-source-candidate-v1',
  releaseId:`${base.releaseId}:p048-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p048-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
