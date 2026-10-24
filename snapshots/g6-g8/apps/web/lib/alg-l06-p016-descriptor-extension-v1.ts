import {isDeepStrictEqual} from 'node:util';
import {CALIBRATION,ID,SOURCE,XML,validateP016AdmissionSemantics}
 from '../../../lib/alg-l06-p016-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage}
 from './whole-lesson-player-descriptor';

export const ALG_L06_P016_ADMISSION_ID=ID;
export const ALG_L06_P016_ADMISSION_CALIBRATION=CALIBRATION;
const FORMAL_PATH=`/migration-status/g678-calibration/${ID}/continuous-v1`;
const PREDECESSOR_ORDINALS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
 30,36,37,39,40,51,52,53,54,55,59];
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;

export interface AlgL06P016DescriptorInput {
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
 if(!ok)throw Error(`ALG_L06_P016_DESCRIPTOR_INVALID: ${reason}`);
}
const pageId=(ordinal:number)=>`shared-alg001-l06-p${String(ordinal).padStart(3,'0')}`;

/** Project only source VB6 after the exact P015 proof; acceptance stays closed. */
export function extendAlgL6P016Descriptor(base:PageOnlyLessonPlayerDescriptor,
 input:AlgL06P016DescriptorInput,root:string):PageOnlyLessonPlayerDescriptor{
 const {packet,registration,metadata}=input;
 demand(typeof root==='string'&&root.length>0,'current workspace root');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===26,'26/60 P015 predecessor');
 demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'source-ordered lesson XML');
 const before=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(isDeepStrictEqual(before,PREDECESSOR_ORDINALS.map(pageId))&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'exact P015 predecessor registration');
 for(const [index,page] of base.pages.entries()){
  const id=pageId(index+1),previous=index?pageId(index):null;
  const next=index<59?pageId(index+2):null;
  demand(page.animationId===id&&page.placementId===id&&
   page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
   page.previousPlacementId===previous&&page.previousAnimationId===previous&&
   page.nextPlacementId===next&&page.nextAnimationId===next,
   'all 60 exact source-order links');
 }
 const target=base.pages[15];
 demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===6&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.previousPlacementId===pageId(15)&&target.nextPlacementId===pageId(17),
  'P016 VB6 source placement and neighbors');
 demand(base.glossary.filter(entry=>entry.id==='function').length===1,
  'existing exact Function glossary entry');
 try{validateP016AdmissionSemantics(packet,registration,root);}catch(error){
  throw Error(`ALG_L06_P016_DESCRIPTOR_INVALID: source-bound packet: ${String(error)}`);
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
 const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==15?page:Object.freeze({
  ...page,rendererAvailability:Object.freeze({kind:'registered' as const,
   moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-139',language:'fixed-en' as const,
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
   pageInteractionCompanionTargetIdSuffix:'p016-source-readable'}),
 }));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===27&&after[15]===ID&&
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
  pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:27}),
 });
}
