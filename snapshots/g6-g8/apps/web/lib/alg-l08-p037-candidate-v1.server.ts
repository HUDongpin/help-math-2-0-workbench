import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P037_ID as ID,p037LocalDevelopment} from './alg-l08-p037-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P037CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP037CandidateDescriptor();
}
export async function algL08P037CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p037LocalDevelopment())throw Error('ALG_L08_P037_ASYNC_SCOPE');
 return buildP037CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP037CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p037LocalDevelopment())throw Error('ALG_L08_P037_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[36];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==37||page.sectionCode!=='TI'||page.sectionPageOrdinal!==8||
  page.source.sourceOccurrence!==37||page.source.assetId!=='swf-9cdfe7c5e9a67d1c06a2b77d91f82474686751598ba466a9f5aed27acf49c8ee')
  throw Error('ALG_L08_P037_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-277',language:'fixed-en' as const,
    scenario:'source-vocabulary',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p037-candidate-v1`,
  calibrationId:'g678-alg-l08-p037-source-candidate-v1',
  releaseId:`${base.releaseId}:p037-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p037-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
