import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P047_ID as ID,p047LocalDevelopment} from './alg-l08-p047-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P047CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP047CandidateDescriptor();
}
export async function algL08P047CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p047LocalDevelopment())throw Error('ALG_L08_P047_ASYNC_SCOPE');
 return buildP047CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP047CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p047LocalDevelopment())throw Error('ALG_L08_P047_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[46];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==47||page.sectionCode!=='TS'||page.sectionPageOrdinal!==7||
  page.source.sourceOccurrence!==47||page.source.assetId!=='swf-805ce1d4ffc602b347c172618009e69fabac57cd776d1d32ded46c89bc67945c')
  throw Error('ALG_L08_P047_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-337',language:'fixed-en' as const,
    scenario:'source-question',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p047-candidate-v1`,
  calibrationId:'g678-alg-l08-p047-source-candidate-v1',
  releaseId:`${base.releaseId}:p047-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p047-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
