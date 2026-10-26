import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P007_ID as ID,p007LocalDevelopment} from './alg-l07-p007-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P007CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p007LocalDevelopment())throw Error('ALG_L07_P007_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[6];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==7||page.sectionCode!=='VB'||page.sectionPageOrdinal!==1||
  page.source.sourceOccurrence!==7||page.source.assetId!=='swf-db951557b1fa5f0c2a4d0b6b196a0a4228b0012fd1b2bbb383a672e8521ee6cd')
  throw Error('ALG_L07_P007_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-228',language:'fixed-en' as const,
    scenario:'source-vocabulary',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p007-candidate-v1`,
  calibrationId:'g678-alg-l07-p007-source-candidate-v1',
  releaseId:`${base.releaseId}:p007-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p007-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
