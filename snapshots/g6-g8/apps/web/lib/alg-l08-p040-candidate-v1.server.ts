import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P040_ID as ID,p040LocalDevelopment} from './alg-l08-p040-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P040CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP040CandidateDescriptor();
}
export async function algL08P040CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p040LocalDevelopment())throw Error('ALG_L08_P040_ASYNC_SCOPE');
 return buildP040CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP040CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p040LocalDevelopment())throw Error('ALG_L08_P040_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[39];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==40||page.sectionCode!=='GS'||page.sectionPageOrdinal!==1||
  page.source.sourceOccurrence!==40||page.source.assetId!=='swf-0c6096016c0612fe56c3a8c3b94952d56ee0c907e66a58312621464231fa2152')
  throw Error('ALG_L08_P040_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-255',language:'fixed-en' as const,
    scenario:'source-game',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p040-candidate-v1`,
  calibrationId:'g678-alg-l08-p040-source-candidate-v1',
  releaseId:`${base.releaseId}:p040-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p040-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
