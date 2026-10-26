import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {algL07CurrentDescriptor,algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
import {P002_ID as ID,P002_SOURCE_ROOT,p002LocalDevelopment} from './alg-l07-p002-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
export {algL07CurrentRegisteredSharedCount};
/** One provisional source placement; the shared reader owns all admitted members. */
export function algL07P002CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 if(!p002LocalDevelopment())throw Error('ALG_L07_P002_CANDIDATE_SCOPE');
 readPin(P002_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L7/RW/L7RW02.swf',bytes:1603537,sha256:'be4379b92c4a214b6a00d655cee930dbdba0a018c0b1dcb89be855e4a8c8f996'});
 const base=algL07CurrentDescriptor(true),source=base.pages[1];
 if(!source||source.animationId!==ID||source.globalPageOrdinal!==2||source.sectionCode!=='RW'||source.sectionPageOrdinal!==1||source.source.sourceOccurrence!==2||source.source.assetId!=='swf-be4379b92c4a214b6a00d655cee930dbdba0a018c0b1dcb89be855e4a8c8f996'||source.previousPlacementId!=='shared-alg001-l07-p001'||source.nextPlacementId!=='shared-alg001-l07-p003')throw Error('ALG_L07_P002_CANDIDATE_PLACEMENT');
 const pages=base.pages.map(page=>page.animationId!==ID||page.rendererAvailability.kind==='registered'?page:Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,runtimeQuery:Object.freeze({frameDomain:'sprite-452',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p002-candidate-v1`,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
