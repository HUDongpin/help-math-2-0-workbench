import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P033_ID as ID,p033LocalDevelopment} from './alg-l08-p033-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P033CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP033CandidateDescriptor();
}
export async function algL08P033CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p033LocalDevelopment())throw Error('ALG_L08_P033_ASYNC_SCOPE');
 return buildP033CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP033CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p033LocalDevelopment())throw Error('ALG_L08_P033_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[32];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==33||page.sectionCode!=='TI'||page.sectionPageOrdinal!==4||
  page.source.sourceOccurrence!==33||page.source.assetId!=='swf-b37cc0a0aedb117cd21c153702545f775045eade5e8f678268e702a3fe465870')
  throw Error('ALG_L08_P033_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-248',language:'fixed-en' as const,
    scenario:'source-vocabulary',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p033-candidate-v1`,
  calibrationId:'g678-alg-l08-p033-source-candidate-v1',
  releaseId:`${base.releaseId}:p033-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p033-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
