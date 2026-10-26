import 'server-only';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P027_ID as ID,p027LocalDevelopment} from './alg-l08-p027-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P027CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p027LocalDevelopment())throw Error('ALG_L08_P027_CANDIDATE_SCOPE');
 const base=algL08CurrentDescriptor(),page=base.pages[26];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==27||page.sectionCode!=='IN'||page.sectionPageOrdinal!==11||
  page.source.sourceOccurrence!==27||page.source.assetId!=='swf-3f36c371dbc373e6b3f50e17844b8ecabdd9fcb26cbc63ceb4d1d5534cb454f2')
  throw Error('ALG_L08_P027_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-41',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p027-candidate-v1`,
  calibrationId:'g678-alg-l08-p027-source-candidate-v1',
  releaseId:`${base.releaseId}:p027-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p027-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
