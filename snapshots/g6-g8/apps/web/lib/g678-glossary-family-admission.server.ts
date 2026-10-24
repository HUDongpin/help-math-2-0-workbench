import 'server-only';
import {validateGlossaryFamilyAdmissionSemantics} from '../../../lib/g678-glossary-family-admission.mjs';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

interface FamilyPacket {
 calibrationId:string;
 familyConfig:{descriptorPredecessor:{moduleCode:string;lesson:number;pageCount:number;
  registeredAnimationCount:number;glossaryCount:number;pageIndex:number;
  previousPlacementId:string;nextPlacementId:string;newGlossaryIds:readonly string[]}};
 selectedPages:readonly {animationId:string;placementId:string;assetId:string;globalPageOrdinal:number;
  sectionCode:string;sectionPageOrdinal:number;runtime:{frameDomain:string;scenario:string}}[];
 sourceFacts:{glossary:readonly PageOnlyLessonGlossaryEntry[]};
}

/** Common proof collection establishes current bytes and registration. This
 * family adapter verifies source-ordered placement and dictionary effects;
 * the caller also supplies the exact page ID it is permitted to extend. */
export function extendGlossaryFamilyAdmission(base:PageOnlyLessonPlayerDescriptor,packet:unknown,
 registration:unknown,expectedAnimationId:string):PageOnlyLessonPlayerDescriptor{
 validateGlossaryFamilyAdmissionSemantics(packet,registration);
 const approved=packet as FamilyPacket,selected=approved.selectedPages[0],before=approved.familyConfig.descriptorPredecessor;
 const target=base.pages[before.pageIndex],id=selected.animationId;
 if(id!==expectedAnimationId||selected.placementId!==id||base.pages.length!==before.pageCount||
  base.course.moduleCode!==before.moduleCode||base.course.lesson!==before.lesson||
  base.productBridge.registeredAnimationCount!==before.registeredAnimationCount||base.glossary.length!==before.glossaryCount||
  !target||target.animationId!==id||target.placementId!==id||target.source.assetId!==selected.assetId||
  target.globalPageOrdinal!==selected.globalPageOrdinal||target.sectionCode!==selected.sectionCode||
  target.sectionPageOrdinal!==selected.sectionPageOrdinal||target.previousPlacementId!==before.previousPlacementId||
  target.nextPlacementId!==before.nextPlacementId||target.rendererAvailability.kind!=='unavailable'||
  Object.values(base.productBridge.acceptanceEffects).some(value=>value!==false))
  throw Error('GLOSSARY_FAMILY_PREDECESSOR_MISMATCH');
 const glossary=[...base.glossary],added:string[]=[];
 for(const term of approved.sourceFacts.glossary){
  const existing=glossary.find(item=>item.sourceKeyAttribute===term.sourceKeyAttribute);
  if(existing){
   if(existing.id!==term.id||(['en','es'] as const).some(locale=>existing.definitions[locale]!==term.definitions[locale]))
    throw Error('GLOSSARY_FAMILY_DICTIONARY_MISMATCH');
  }else{
   if(glossary.some(item=>item.id===term.id))throw Error('GLOSSARY_FAMILY_DICTIONARY_COLLISION');
   glossary.push(term);added.push(term.id);
  }
 }
 if(JSON.stringify([...added].sort())!==JSON.stringify([...before.newGlossaryIds].sort()))
  throw Error('GLOSSARY_FAMILY_DICTIONARY_ADDITIONS');
 const pages=base.pages.map((page,index)=>index!==before.pageIndex?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:id,
   runtimeQuery:Object.freeze({frameDomain:selected.runtime.frameDomain,language:'fixed-en' as const,
    scenario:selected.runtime.scenario,seed:'0'})}),
  // Existing UI classification; detailed source/audio qualifications stay in
  // the validated page packet. These fields confer no downstream acceptance.
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
   productBehavior:'maintained-javascript-state-machine-implemented' as const,productVisualBehaviorComposite:'not-established' as const}),
 }));
 const ids=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 if(ids.length!==before.registeredAnimationCount+1)throw Error('GLOSSARY_FAMILY_REGISTRATION_DELTA');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${approved.calibrationId}`,calibrationId:approved.calibrationId,
  releaseId:`${base.releaseId}:${approved.calibrationId}`,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${id}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${approved.calibrationId}`}),
  pages:Object.freeze(pages),glossary:Object.freeze(glossary),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(ids),registeredAnimationCount:ids.length})});
}
