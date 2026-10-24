import {isDeepStrictEqual} from 'node:util';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {CALIBRATION,ID,SOURCE,XML,validateP019AdmissionSemantics}
 from '../../../lib/alg-l06-p019-admission-semantics-v1.mjs';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor,
 WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L06_P019_ADMISSION_ID=ID;
export const ALG_L06_P019_ADMISSION_CALIBRATION=CALIBRATION;
const FORMAL_PATH=`/migration-status/g678-calibration/${ID}/continuous-v1`;
const PREDECESSOR_ORDINALS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
 30,36,37,39,40,51,52,53,54,55,59];
const CROSSWALK={path:'output/alg-l06-p019-glossary-audit-v1/six-term-crosswalk-v1.json',
 bytes:10805,sha256:'a7bd4ba5e23059cf8e9479859191df2cb0a2edf9e9f650b2bf3fdba76db70938'};
const BUTTONS=[
 [8,'Function table','function-table'],[9,'Input','input'],[10,'Pair','pair'],
 [11,'Table','table'],[19,'Output','output'],[20,'Function','function'],
] as const;
const NEW_IDS=['function-table','pair'] as const;
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;

export interface AlgL06P019DescriptorInput {
 readonly packet:Readonly<{
  calibrationId:string;deploymentScope:'local-only';sourceRoot:string;
  sourceXml:Pin;source:Pin;freezeManifest:Pin;
  selectedPages:readonly Readonly<{animationId:string;placementId:string;
   globalPageOrdinal:number;sourceOccurrence:number;sectionCode:string;
   sectionPageOrdinal:number;runtime:Readonly<{frameDomain:string;frameCount:number;
    terminalPolicy:string;hostPlaybackCompletion:false}>}>[];
  entry:Readonly<{key:string;artifacts:Readonly<{module:Pin;timeline:Pin;runtime:Pin}>}>;
  optionalSpanishAudio:Readonly<{trigger:string;localeAutoplay:false;mainStreamSpliced:false}>;
  acceptanceEffects:PageOnlyLessonPlayerDescriptor['productBridge']['acceptanceEffects'];
  productCalibrationPassed:false;scaleOutAuthorized:false;
 }>;
 readonly registration:Readonly<{calibrationId:string;deploymentScope:'local-only';
  freezeManifest:string;freezeManifestBytes:number;freezeManifestSha256:string;
  entries:readonly unknown[]}>;
 readonly metadata:Readonly<{calibrationId:string;deploymentScope:'local-only';
  maturity:'private-current-js';freezeManifestSha256:string;moduleSha256:string;
  timelineSha256:string;runtimeSha256:string}>;
}

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`ALG_L06_P019_DESCRIPTOR_INVALID: ${reason}`);
}
const pageId=(ordinal:number)=>`shared-alg001-l06-p${String(ordinal).padStart(3,'0')}`;

/** Project only source VB9 after the exact P018 proof; acceptance stays closed. */
export function extendAlgL6P019Descriptor(base:PageOnlyLessonPlayerDescriptor,
 input:AlgL06P019DescriptorInput,root:string):PageOnlyLessonPlayerDescriptor{
 const {packet,registration,metadata}=input;
 demand(typeof root==='string'&&root.length>0,'current workspace root');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===29,'29/60 P018 predecessor');
 demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'source-ordered lesson XML');
 const before=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(isDeepStrictEqual(before,PREDECESSOR_ORDINALS.map(pageId))&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'exact P018 predecessor registration');
 for(const [index,page] of base.pages.entries()){
  const id=pageId(index+1),previous=index?pageId(index):null;
  const next=index<59?pageId(index+2):null;
  demand(page.animationId===id&&page.placementId===id&&
   page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
   page.previousPlacementId===previous&&page.previousAnimationId===previous&&
   page.nextPlacementId===next&&page.nextAnimationId===next,
   'all 60 exact source-order links');
 }
 const target=base.pages[18];
 demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===9&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.previousPlacementId===pageId(18)&&target.nextPlacementId===pageId(20),
  'P019 VB9 source placement and neighbors');
 try{validateP019AdmissionSemantics(packet,registration,root);}catch(error){
  throw Error(`ALG_L06_P019_DESCRIPTOR_INVALID: source-bound packet: ${String(error)}`);
 }
 const artifacts=packet.entry.artifacts;
 demand(metadata.calibrationId===packet.calibrationId&&
  metadata.deploymentScope==='local-only'&&metadata.maturity==='private-current-js'&&
  metadata.freezeManifestSha256===packet.freezeManifest.sha256&&
  metadata.moduleSha256===artifacts.module.sha256&&
  metadata.timelineSha256===artifacts.timeline.sha256&&
  metadata.runtimeSha256===artifacts.runtime.sha256,
  'actual registry metadata equals proof registration');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false)&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'independent acceptance remains closed');

 const crosswalk=readJsonPin(root,CROSSWALK);
 demand(crosswalk.identity.animationId===ID&&
  crosswalk.identity.globalOrdinal===19&&crosswalk.identity.section==='VB'&&
  crosswalk.identity.sectionPageOrdinal===9&&
  crosswalk.inputs.swf.sha256===SOURCE.sha256&&
  crosswalk.inputs.lesson.sha256===XML.sha256&&
  crosswalk.active.registeredLessonPages===29&&
  crosswalk.active.glossaryEntryCount===30&&
  isDeepStrictEqual(crosswalk.entries.map(
   (entry:{buttonCharacterId:number;key:string;dictionary:{id:string}})=>
    [entry.buttonCharacterId,entry.key,entry.dictionary.id]),BUTTONS)&&
  isDeepStrictEqual(crosswalk.missingModernKeys,
   ['Function table','Pair'])&&
  crosswalk.originalHostRunObserved===false&&crosswalk.acceptanceChanged===false,
  'exact source six-term crosswalk');
 const oldIds=new Set(base.glossary.map(entry=>entry.id));
 demand(base.glossary.length===30&&oldIds.size===30&&
  BUTTONS.filter(([, ,id])=>oldIds.has(id)).length===4&&
  NEW_IDS.every(id=>!oldIds.has(id))&&
  BUTTONS.filter(([, ,id])=>oldIds.has(id)).every(([,key,id])=>
   base.glossary.some(entry=>entry.id===id&&entry.sourceKeyAttribute===key)),
  'retain exact existing Input, Table, Output and Function');
 const additions:PageOnlyLessonGlossaryEntry[]=NEW_IDS.map(id=>{
  const item=crosswalk.entries.find((entry:{dictionary:{id:string}})=>entry.dictionary.id===id);
  demand(item&&item.modern.present===false&&item.modern.entryId===null&&
   item.dictionary.sourceKeyAttribute===item.key&&
   item.dictionary.definitions.en.length>0&&item.dictionary.definitions.es.length>0,
   `new exact glossary entry: ${id}`);
  return Object.freeze({id,sourceKeyAttribute:item.key,
   labels:Object.freeze({...item.dictionary.labels}),
   definitions:Object.freeze({...item.dictionary.definitions}),
   source:Object.freeze({en:Object.freeze({...item.dictionary.source.en}),
    es:Object.freeze({...item.dictionary.source.es})})});
 });
 const glossary=Object.freeze([...base.glossary,...additions]);
 demand(glossary.length===32&&BUTTONS.every(([,key,id])=>
  glossary.filter(entry=>entry.id===id&&entry.sourceKeyAttribute===key).length===1),
  'all six exact modern glossary entries');

 const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==18?page:Object.freeze({
  ...page,rendererAvailability:Object.freeze({kind:'registered' as const,
   moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-37',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const,
  }),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p019-source-readable'}),
 }));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===30&&after[18]===ID&&
  isDeepStrictEqual(after.filter(id=>id!==ID),before),
  'one exact registered-page delta');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,
  releaseId:CALIBRATION,
  course:Object.freeze({...base.course,href:FORMAL_PATH}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  glossary,pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:30}),
 });
}
