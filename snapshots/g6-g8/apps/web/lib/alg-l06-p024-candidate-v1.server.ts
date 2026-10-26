import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P023FormalDescriptor} from './alg-l06-p023-formal-admission-v1.server';
import {P024_ID as ID,p024LocalDevelopment} from './alg-l06-p024-preview-policy-v1';
import {P024_CANDIDATE_BINDING} from './alg-l06-p024-candidate-binding-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

function demand(value:unknown,reason:string):asserts value{
 if(!value)throw Error(`P024_CANDIDATE_INVALID: ${reason}`);
}

/** An unregistered source-backed projection over the current P023 formal host.
 * Candidate presentation never changes the official registry or acceptance gates. */
export function algL6P024CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p024LocalDevelopment(),'local physical source environment');
 const root=getWorkspaceRoot(),base=algL6P023FormalDescriptor(),binding=P024_CANDIDATE_BINDING;
 const tx=readRegistryTransaction(root),index=readJsonPin(root,G678_ADMISSION_INDEX);
 demand(isDeepStrictEqual(G678_ADMISSION_INDEX,binding.index)&&
  isDeepStrictEqual(index.host,binding.host)&&
  index.pages.length===21&&!index.pages.some((p:{animationId:string})=>p.animationId===ID),
  'exact reviewed candidate host/index and P024 unregistered');
 demand(tx.sha256===binding.registrySha256&&registeredLocalOnlyAnimationKeys.length===511&&
  !localOnlyAnimationModuleRegistration(ID),'511 formal pages and no P024 membership');
 const packet=readJsonPin(root,binding.packet);
 demand(packet.kind==='alg-l06-p024-candidate-source-binding-v1'&&packet.animationId===ID&&
  packet.source.sha256==='e36c6c293f1e620f82fa84d57a1b91fd0a977d24d365772126f87333ce359d05'&&
  Object.values(packet.acceptanceEffects).every(v=>v===false),'source identity and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===34&&
  base.glossary.length===37&&Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),
  'exact P023 formal predecessor');
 const crosswalk=readJsonPin(root,packet.crosswalk);
 demand(crosswalk.identity.animationId===ID&&crosswalk.identity.globalOrdinal===24&&
  crosswalk.identity.sectionPageOrdinal===14&&crosswalk.active.registeredLessonPages===34&&
  crosswalk.entries.length===5&&isDeepStrictEqual(crosswalk.missingModernKeys,['Range'])&&
  crosswalk.originalHostRunObserved===false,'exact five source glossary keys');
 const glossary=[...base.glossary],row=crosswalk.entries.find((e:{key:string})=>e.key==='Range');
 demand(row&&!row.modern.present&&!glossary.some(e=>e.id===row.dictionary.id)&&
  row.dictionary.definitions.en&&row.dictionary.definitions.es,'source Range dictionary');
 const range=row.dictionary;
 glossary.push(Object.freeze({id:range.id,sourceKeyAttribute:'Range',
  labels:Object.freeze({...range.labels}),definitions:Object.freeze({...range.definitions}),
  source:Object.freeze({...range.source})}) as PageOnlyLessonGlossaryEntry);
 demand(glossary.length===38&&['Range','Function','Output','Set','Function table'].every(key=>
  glossary.filter(e=>e.sourceKeyAttribute===key).length===1),'five unique exact glossary entries');
 const target=base.pages[23];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===24&&
  target.sectionPageOrdinal===14&&target.source.assetId===`swf-${packet.source.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p023'&&
  target.nextPlacementId==='shared-alg001-l06-p025','source-ordered VB14 placement');
 const pages=base.pages.map((page,i)=>i!==23?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-208',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p024-source-readable'}),
 }));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===35&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'one candidate projection only');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p024-candidate-v1`,
  calibrationId:'g678-alg-l06-p024-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p024-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p024-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),
   registeredAnimationCount:35})});
}
