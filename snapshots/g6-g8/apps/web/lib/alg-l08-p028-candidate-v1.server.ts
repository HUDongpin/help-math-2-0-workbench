import 'server-only';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P028_ID as ID,p028LocalDevelopment} from './alg-l08-p028-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P028CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p028LocalDevelopment())throw Error('ALG_L08_P028_CANDIDATE_SCOPE');
 const base=algL08CurrentDescriptor(),page=base.pages[27];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==28||page.sectionCode!=='IN'||page.sectionPageOrdinal!==12||
  page.source.sourceOccurrence!==28||page.source.assetId!=='swf-f5fa02bb84e2e967c6984fd7e9ea546bcd3b91a63e00c100c381b7a831d2d2d2')
  throw Error('ALG_L08_P028_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-45',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p028-candidate-v1`,
  calibrationId:'g678-alg-l08-p028-source-candidate-v1',
  releaseId:`${base.releaseId}:p028-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p028-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
