import 'server-only';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P001_ID as ID,p001LocalDevelopment} from './alg-l08-p001-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Provisional availability belongs only to this candidate document. */
export function algL08P001CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p001LocalDevelopment())throw Error('ALG_L08_P001_CANDIDATE_SCOPE');
 const base=algL08CurrentDescriptor(),page=base.pages[0];
 if(base.pages.length!==50||page?.animationId!==ID||page.placementId!==ID||
  page.globalPageOrdinal!==1||page.sectionCode!=='IR'||page.sectionPageOrdinal!==1||
  page.source.sourceOccurrence!==1||page.source.assetId!=='swf-f0b332dc6586753bf485740cf4e9fa00833a5a2c929d546b1190fecd391eaaf7')
  throw Error('ALG_L08_P001_CANDIDATE_SOURCE_ORDER');
 const pages=base.pages.map(p=>p.animationId!==ID||p.rendererAvailability.kind==='registered'?p:
  Object.freeze({...p,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-142',language:'fixed-en' as const,
    scenario:'source-introduction',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
    audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
    productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p001-candidate-v1`,
  calibrationId:'g678-alg-l08-p001-source-candidate-v1',
  releaseId:`${base.releaseId}:p001-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p001-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export {algL08CurrentRegisteredSharedCount} from './alg-l08-current-descriptor-v1.server';
