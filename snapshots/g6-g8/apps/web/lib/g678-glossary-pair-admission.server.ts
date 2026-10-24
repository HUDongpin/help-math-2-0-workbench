import 'server-only';
import {validateGlossaryPairAdmissionSemantics} from '../../../lib/g678-glossary-pair-admission-semantics.mjs';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** The common proof reader establishes physical bytes and registration first;
 * this extender binds the reviewed P013 behavior to its source-ordered slot. */
export function extendGlossaryPairAdmission(base:PageOnlyLessonPlayerDescriptor,packet:unknown,registration:unknown):PageOnlyLessonPlayerDescriptor{
 validateGlossaryPairAdmissionSemantics(packet,registration);
 const id='shared-alg001-l12-p013',target=base.pages[12];
 if(base.pages.length!==52||base.productBridge.registeredAnimationCount!==23||base.glossary.length!==44||
  base.course.moduleCode!=='ALG001'||base.course.lesson!==12||target.animationId!==id||target.placementId!==id||
  target.globalPageOrdinal!==13||target.sectionCode!=='VB'||target.sectionPageOrdinal!==7||
  target.source.assetId!=='swf-056fb04850a10cd8888112e4c4fe5730bf475e559f0904b7841545c099536424'||
  target.previousPlacementId!=='shared-alg001-l12-p012'||target.nextPlacementId!=='shared-alg001-l12-p014'||
  target.rendererAvailability.kind!=='unavailable'||Object.values(base.productBridge.acceptanceEffects).some(value=>value!==false))
  throw Error('P013_ADMISSION_PREDECESSOR_MISMATCH');
 const glossary=[...base.glossary];
 const terms=(packet as {sourceFacts:{glossary:PageOnlyLessonGlossaryEntry[]}}).sourceFacts.glossary;
 for(const term of terms){
  const existing=glossary.find(item=>item.sourceKeyAttribute===term.sourceKeyAttribute);
  if(existing){
   if(existing.id!==term.id||(['en','es'] as const).some(locale=>existing.definitions[locale]!==term.definitions[locale]))
    throw Error('P013_ADMISSION_DICTIONARY_MISMATCH');
  }else{
   if(term.id!=='quadrant'||glossary.some(item=>item.id===term.id))throw Error('P013_ADMISSION_DICTIONARY_ADDITION');
   glossary.push(term);
  }
 }
 if(glossary.length!==45)throw Error('P013_ADMISSION_DICTIONARY_COUNT');
 const pages=base.pages.map((page,index)=>index!==12?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:id,
   runtimeQuery:Object.freeze({frameDomain:'sprite-63',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  // Existing UI vocabulary classifies the maintained pause/Replay adapter.
  // The validated page proof retains the more specific whole-buffer audio,
  // signed-seek and modern full-frame terminal qualifications; no gate is raised.
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
   productBehavior:'maintained-javascript-state-machine-implemented' as const,productVisualBehaviorComposite:'not-established' as const}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p013-current-js-v2`,calibrationId:'g678-alg-l12-p013-current-js-v2',
  releaseId:`${base.releaseId}:p013-current-js-v2`,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${id}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p013-current-js-v2`}),
  pages:Object.freeze(pages),glossary:Object.freeze(glossary),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
