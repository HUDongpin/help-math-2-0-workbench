import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P048_ID as ID,p048LocalDevelopment} from './alg-l07-p048-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P048CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p048LocalDevelopment())throw Error('ALG_L07_P048_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[47];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==48||page.sectionCode!=='TI'||page.sectionPageOrdinal!==10||
  page.source.sourceOccurrence!==48||page.source.assetId!=='swf-63e6c8e4474d9fcaa6c2f5dc23b04210619210bafbfaf4e907f7ca12b2470a2f')
  throw Error('ALG_L07_P048_CANDIDATE_SOURCE_ORDER');
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
  calibrationId:'g678-alg-l07-p048-source-candidate-v1',
  releaseId:`${base.releaseId}:p048-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p048-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
