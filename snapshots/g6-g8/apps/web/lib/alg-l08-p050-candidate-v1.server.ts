import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P050_ID as ID,p050LocalDevelopment} from './alg-l08-p050-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P050CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP050CandidateDescriptor();
}
export async function algL08P050CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p050LocalDevelopment())throw Error('ALG_L08_P050_ASYNC_SCOPE');
 return buildP050CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP050CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p050LocalDevelopment())throw Error('ALG_L08_P050_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[49];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==50||page.sectionCode!=='FQ'||page.sectionPageOrdinal!==2||
  page.source.sourceOccurrence!==50||page.source.assetId!=='swf-2c7dcd30a9d03bb79b26619447a702d44b9f3cdd060db44eb7fbf6b23a66f22a')
  throw Error('ALG_L08_P050_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-960',language:'fixed-en' as const,
    scenario:'source-quiz',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p050-candidate-v1`,
  calibrationId:'g678-alg-l08-p050-source-candidate-v1',
  releaseId:`${base.releaseId}:p050-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p050-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
