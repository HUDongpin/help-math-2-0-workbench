import 'server-only';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P039_ID as ID,p039LocalDevelopment} from './alg-l08-p039-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P039CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP039CandidateDescriptor();
}
export async function algL08P039CandidateDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p039LocalDevelopment())throw Error('ALG_L08_P039_ASYNC_SCOPE');
 return buildP039CandidateDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP039CandidateDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 if(!p039LocalDevelopment())throw Error('ALG_L08_P039_CANDIDATE_SCOPE');
 const base=verifiedDescriptor??algL08CurrentDescriptor(),page=base.pages[38];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==39||page.sectionCode!=='TI'||page.sectionPageOrdinal!==10||
  page.source.sourceOccurrence!==39||page.source.assetId!=='swf-e2dfeb8fe33b52d11c3a4bffcc0d23b69077aea2b95b06812c7b2985cb2f1566')
  throw Error('ALG_L08_P039_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-308',language:'fixed-en' as const,
    scenario:'source-vocabulary',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p039-candidate-v1`,
  calibrationId:'g678-alg-l08-p039-source-candidate-v1',
  releaseId:`${base.releaseId}:p039-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p039-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
