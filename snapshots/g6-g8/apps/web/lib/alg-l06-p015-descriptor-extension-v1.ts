import {isDeepStrictEqual} from 'node:util';
import {validateP015AdmissionSemantics} from '../../../lib/alg-l06-p015-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage}
 from './whole-lesson-player-descriptor';

export const ALG_L06_P015_ADMISSION_ID='shared-alg001-l06-p015';
export const ALG_L06_P015_ADMISSION_CALIBRATION='g678-alg-l06-p015-current-js-20260929-v1';
const XML_PATH='G6-G8-shared/ALG001/L6/index.xml';
const XML_SHA='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const SOURCE_SHA='d0f395f5410353733b42ae29198caa86fae6b6eebd0e2a71830a203d969868b1';
const FORMAL_PATH=`/migration-status/g678-calibration/${ALG_L06_P015_ADMISSION_ID}/continuous-v1`;
const PREDECESSOR_ORDINALS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,30,36,37,39,40,51,52,53,54,55,59];
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;

export interface AlgL06P015DescriptorInput {
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
 if(!ok)throw Error(`ALG_L06_P015_DESCRIPTOR_INVALID: ${reason}`);
}
const pageId=(ordinal:number)=>`shared-alg001-l06-p${String(ordinal).padStart(3,'0')}`;

/** Project only source VB5 after the exact P014 proof; acceptance stays closed. */
export function extendAlgL6P015Descriptor(base:PageOnlyLessonPlayerDescriptor,
 input:AlgL06P015DescriptorInput,root:string):PageOnlyLessonPlayerDescriptor{
 const {packet,registration,metadata}=input;
 demand(typeof root==='string'&&root.length>0,'current workspace root');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===25,'25/60 P014 predecessor');
 demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML_PATH&&base.source.sourceXmlSha256===XML_SHA,
  'source-ordered lesson XML');
 const before=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(isDeepStrictEqual(before,PREDECESSOR_ORDINALS.map(pageId))&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'exact P014 predecessor registration');
 for(const [index,page] of base.pages.entries()){
  const id=pageId(index+1),previous=index?pageId(index):null;
  const next=index<59?pageId(index+2):null;
  demand(page.animationId===id&&page.placementId===id&&
   page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
   page.previousPlacementId===previous&&page.previousAnimationId===previous&&
   page.nextPlacementId===next&&page.nextAnimationId===next,
   'all 60 exact source-order links');
 }
 const target=base.pages[14];
 demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===5&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.previousPlacementId===pageId(14)&&target.nextPlacementId===pageId(16),
  'P015 VB5 source placement and neighbors');
 demand(['function','value','relation','rule','input','output'].every(id=>base.glossary.filter(entry=>entry.id===id).length===1),'six exact glossary entries');
 try{validateP015AdmissionSemantics(packet,registration,root);}catch(error){
  throw Error(`ALG_L06_P015_DESCRIPTOR_INVALID: source-bound packet: ${String(error)}`);
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
 const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==14?page:Object.freeze({
  ...page,rendererAvailability:Object.freeze({kind:'registered' as const,
   moduleKey:ALG_L06_P015_ADMISSION_ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-270',language:'fixed-en' as const,
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
   pageInteractionCompanionTargetIdSuffix:'p015-source-readable'}),
 }));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===26&&after[14]===ALG_L06_P015_ADMISSION_ID&&
  isDeepStrictEqual(after.filter(id=>id!==ALG_L06_P015_ADMISSION_ID),before),
  'one exact registered-page delta');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:${ALG_L06_P015_ADMISSION_CALIBRATION}`,
  calibrationId:ALG_L06_P015_ADMISSION_CALIBRATION,
  releaseId:ALG_L06_P015_ADMISSION_CALIBRATION,
  course:Object.freeze({...base.course,href:FORMAL_PATH}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${ALG_L06_P015_ADMISSION_CALIBRATION}`}),
  pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:26}),
 });
}
