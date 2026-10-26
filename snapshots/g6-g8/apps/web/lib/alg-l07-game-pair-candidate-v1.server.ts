import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {p051LocalDevelopment} from './alg-l07-p051-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const MEMBERS=[{"page": 51, "main": 185, "scenario": "source-directions", "sha256": "5a4ad482c9f62794c75080677a3a4c862063758c906fbe3d2ed51f3f98d64c25"}, {"page": 52, "main": 303, "scenario": "source-game", "sha256": "ec2a84931df2f7280466e0dac5cbe6c9e636b6700a35696bacb03baf5a4a905d"}] as const;
/** Only this two-page candidate can hand a chosen source game level to P052. */
export function algL07GamePairCandidateDescriptor(initialPage:51|52):PageOnlyLessonPlayerDescriptor {
 if(!p051LocalDevelopment())throw Error('ALG_L07_GAME_PAIR_CANDIDATE_SCOPE');
 const base=algL07CurrentDescriptor();
 for(const row of MEMBERS){const page=base.pages[row.page-1],id=`shared-alg001-l07-p0${row.page}`;
  if(base.pages.length!==62||page?.animationId!==id||page.placementId!==id||page.globalPageOrdinal!==row.page||page.sectionCode!=='GS'||page.sectionPageOrdinal!==row.page-50||page.source.sourceOccurrence!==row.page||page.source.assetId!==`swf-${row.sha256}`)throw Error('ALG_L07_GAME_PAIR_SOURCE_ORDER');}
 const pages=base.pages.map(page=>{const row=MEMBERS.find(r=>r.page===page.globalPageOrdinal);if(!row||page.rendererAvailability.kind==='registered')return page;
  return Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:page.animationId,runtimeQuery:Object.freeze({frameDomain:`sprite-${row.main}`,language:'fixed-en' as const,scenario:row.scenario,seed:'0'})}),runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,productVisualBehaviorComposite:'not-established' as const})});});
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 return Object.freeze({...base,support:Object.freeze({...base.support,lessonHostCapabilities:Object.freeze([...new Set([...base.support.lessonHostCapabilities,'navigation' as const])])}),descriptorId:`${base.descriptorId}:p051-p052-candidate-v1`,calibrationId:'g678-alg-l07-game-pair-source-candidate-v1',releaseId:`${base.releaseId}:p051-p052-candidate-v1`,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/shared-alg001-l07-p0${initialPage}/candidate-v1`}),persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p051-p052-candidate-v1`}),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}

export function algL07GamePairUnregisteredCount(){return MEMBERS.filter(row=>!localOnlyAnimationModuleRegistration(`shared-alg001-l07-p0${row.page}`)).length;}
