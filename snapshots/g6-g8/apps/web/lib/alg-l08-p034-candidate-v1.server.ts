import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P034_ID as ID,p034LocalDevelopment} from './alg-l08-p034-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P034CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP034CandidateDescriptor();
}
export async function algL08P034CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p034LocalDevelopment())throw Error('ALG_L08_P034_ASYNC_SCOPE');
 return buildP034CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP034CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p034LocalDevelopment())throw Error('ALG_L08_P034_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[33];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==34||page.sectionCode!=='TI'||page.sectionPageOrdinal!==5||
  page.source.sourceOccurrence!==34||page.source.assetId!=='swf-794afc62ac6c5505cdcc9b28b72c56ea7d57e0d85c9eba4bd64b78c835495a5f')
  throw Error('ALG_L08_P034_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-383',language:'fixed-en' as const,
    scenario:'source-vocabulary',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p034-candidate-v1`,
  calibrationId:'g678-alg-l08-p034-source-candidate-v1',
  releaseId:`${base.releaseId}:p034-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p034-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
