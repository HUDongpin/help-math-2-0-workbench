import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P025FormalDescriptor} from './alg-l06-p025-formal-admission-v1.server';
import {P026_CANDIDATE_BINDING} from './alg-l06-p026-candidate-binding-v1';
import {P026_ID as ID,p026LocalDevelopment} from './alg-l06-p026-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
const demand=(ok:unknown,message:string)=>{if(!ok)throw Error('P026_CANDIDATE_INVALID: '+message);};

/** Only a private renderable projection. Actual registry membership is unchanged. */
export function algL6P026CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p026LocalDevelopment(),'local development/physical source');
 const root=getWorkspaceRoot(),binding=P026_CANDIDATE_BINDING,tx=readRegistryTransaction(root);
 demand(tx.sha256===binding.registrySha256&&!localOnlyAnimationModuleRegistration(ID),'exact registry and unregistered P026');
 const packet=readJsonPin(root,binding.packet);
 demand(packet.kind==='alg-l06-p026-candidate-source-binding-v1'&&packet.animationId===ID&&
  Object.values(packet.acceptanceEffects).every(v=>v===false),'bound own packet and separate gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const item of packet.external)readPin(item.root,item.pin);
 const base=algL6P025FormalDescriptor(),audit=readJsonPin(root,packet.audit),
  native=readJsonPin(root,packet.native),canvas=readJsonPin(root,packet.canvas),
  audio=readJsonPin(root,packet.audioPlan),crosswalk=readJsonPin(root,packet.crosswalk);
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===36&&
  base.glossary.length===39,'exact formal 36/60 predecessor');
 demand(audit.identity.animationId===ID&&audit.identity.globalActiveOrdinal===26&&
  audit.identity.sectionPageOrdinal===16&&audit.source.swf.sha256===packet.source.sha256&&
  isDeepStrictEqual(audit.frameDomains.map((d:{id:string;frames:number})=>[d.id,d.frames]),
   [['root',10],['sprite-2',1],['sprite-55',389]])&&audit.glossary.length===7,'source page/title/main/glossary');
 demand(native.animationId===ID&&native.sourceSwfSha256===packet.source.sha256&&
  native.frameDomain==='sprite-55'&&native.mainFrameCount===389&&native.rootFrameCount===10&&
  native.definitions.length===31,'own source-native glyphs');
 demand(canvas.animationId===ID&&canvas.rootFrame===6&&canvas.mainFrameCount===389&&
  canvas.sourceGlyphRendering.default==='preserve-all'&&
  canvas.sourceGlyphRendering.nativeBinding==='every-instance-must-be-owned-before-suppression'&&
  audio.acceptanceEffects?.originalRuntime!==true,'drawing ownership and no original runtime claim');
 const keys=['Independent variable','Function','Input variable','Domain','Dependent variable','Output variable','Range'];
 demand(isDeepStrictEqual([...audit.glossary.map((g:{keyAttribute:string})=>g.keyAttribute)].sort(),[...keys].sort()),'seven exact actions');
 const glossary=[...base.glossary];
 for(const key of keys){
  const dictionary=crosswalk.entries.filter((e:PageOnlyLessonGlossaryEntry)=>e.sourceKeyAttribute===key);
  demand(dictionary.length===1,'one dictionary key '+key);
  const d=dictionary[0],modern=glossary.filter(e=>e.sourceKeyAttribute===key);
  demand(modern.length<=1,'unambiguous host key '+key);
  if(modern.length) demand(isDeepStrictEqual(modern[0].labels,d.labels)&&isDeepStrictEqual(modern[0].definitions,d.definitions),'exact existing bilingual dictionary '+key);
  else glossary.push(Object.freeze({id:d.id,sourceKeyAttribute:key,labels:Object.freeze({...d.labels}),
   definitions:Object.freeze({...d.definitions}),source:Object.freeze({...d.source})}) as PageOnlyLessonGlossaryEntry);
 }
 const target=base.pages[25];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===26&&
  target.sectionCode==='VB'&&target.sectionPageOrdinal===16&&target.source.assetId===`swf-${packet.source.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p025'&&
  target.nextPlacementId==='shared-alg001-l06-p027','exact source-ordered VB16 target');
 const pages=base.pages.map((page,i)=>i!==25?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-55',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p026-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===37&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),'one candidate; all59 other placements preserved');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p026-candidate-v1`,
  calibrationId:'g678-alg-l06-p026-unregistered-candidate-v1',releaseId:`${base.releaseId}:p026-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p026-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:37})});
}
