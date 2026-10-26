import 'server-only';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P030_ID as ID,p030LocalDevelopment} from './alg-l08-p030-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P030CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p030LocalDevelopment())throw Error('ALG_L08_P030_CANDIDATE_SCOPE');
 const base=algL08CurrentDescriptor(),page=base.pages[29];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==30||page.sectionCode!=='TI'||page.sectionPageOrdinal!==1||
  page.source.sourceOccurrence!==30||page.source.assetId!=='swf-48f2bab3490d63b5d8ad8cd98a3a9c519a4d6e8e72e4d5a1d8aa766703a8e308')
  throw Error('ALG_L08_P030_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-368',language:'fixed-en' as const,
    scenario:'source-vocabulary',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p030-candidate-v1`,
  calibrationId:'g678-alg-l08-p030-source-candidate-v1',
  releaseId:`${base.releaseId}:p030-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p030-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
