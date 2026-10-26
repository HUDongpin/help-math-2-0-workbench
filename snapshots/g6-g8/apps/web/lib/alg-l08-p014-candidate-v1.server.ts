import 'server-only';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P014_ID as ID,p014LocalDevelopment} from './alg-l08-p014-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P014CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p014LocalDevelopment())throw Error('ALG_L08_P014_CANDIDATE_SCOPE');
 const base=algL08CurrentDescriptor(),page=base.pages[13];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==14||page.sectionCode!=='VB'||page.sectionPageOrdinal!==8||
  page.source.sourceOccurrence!==14||page.source.assetId!=='swf-7272413d6a2aef903ac2df6778172ef5448bde2bae73e9fc227a70e5ce354e15')
  throw Error('ALG_L08_P014_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-69',language:'fixed-en' as const,
    scenario:'source-intercept',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p014-candidate-v1`,
  calibrationId:'g678-alg-l08-p014-source-candidate-v1',
  releaseId:`${base.releaseId}:p014-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p014-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
