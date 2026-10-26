import 'server-only';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P047_ID as ID,p047LocalDevelopment} from './alg-l07-p047-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL07P047CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p047LocalDevelopment())throw Error('ALG_L07_P047_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor(),page=base.pages[46];
 if(base.pages.length!==62||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==47||page.sectionCode!=='TI'||page.sectionPageOrdinal!==9||
  page.source.sourceOccurrence!==47||page.source.assetId!=='swf-af333a2fa1fd36cf497bca538d5d871b3ec92b57207b769e6ceb71d5bcafe407')
  throw Error('ALG_L07_P047_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-447',language:'fixed-en' as const,
    scenario:'source-question',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p047-candidate-v1`,
  calibrationId:'g678-alg-l07-p047-source-candidate-v1',
  releaseId:`${base.releaseId}:p047-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p047-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
