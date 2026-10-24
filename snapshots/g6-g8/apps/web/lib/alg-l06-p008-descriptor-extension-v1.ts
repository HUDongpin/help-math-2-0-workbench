import {isDeepStrictEqual} from 'node:util';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L06_P008_ADMISSION_ID='shared-alg001-l06-p008';
export const ALG_L06_P008_ADMISSION_CALIBRATION='g678-alg-l06-p008-current-js-20260928-v3';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH='G6-G8-shared/ALG001/L6/RW/L6RW07.swf';
const SOURCE_SHA='6ea847e4682f9581cd72ee4a2fd8a177c9584cbf7a53ab8a2421e1ee0f012350';
const XML_PATH='G6-G8-shared/ALG001/L6/index.xml';
const XML_SHA='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const RUNTIME_PATH='work/g678-shared-page-factory/g678-alg-l06-p008-current-js-20260928-v1/members/shared-alg001-l06-p008/canvas-renderer.js';
const RUNTIME_SHA='ef40a85081b1cd131e3751fbaec8242a847592247f1b1992f681dd499309c33e';
const FREEZE_PATH=`catalog/product-bridge-calibrations/${ALG_L06_P008_ADMISSION_CALIBRATION}.json`;
const FORMAL_PATH=`/migration-status/g678-calibration/${ALG_L06_P008_ADMISSION_ID}/continuous-v1`;
const PREDECESSOR_ORDINALS=[1,2,3,4,5,6,7,9,11,12,30,36,37,39,40,51,52,53,54,55,59];
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type SelectedPage=Readonly<{
 animationId:string;placementId:string;sourceSha256:string;globalPageOrdinal:number;
 sourceOccurrence:number;sectionCode:string;sectionPageOrdinal:number;
 runtime:Readonly<{frameDomain:string;frameCount:number;rootFrameCount:number;
  rootBeginFrame:number;fps:number;stage:Readonly<{width:number;height:number}>;
  scenario:string;seed:string;canvasRenderer:Pin;hostPlaybackCompletion:false}>;
}>;

/** The server has already verified the physical v3 proof and actual registration. */
export interface AlgL06P008DescriptorInput {
 readonly packet:Readonly<{
  calibrationId:string;deploymentScope:'local-only';sourceRoot:string;
  sourceXml:Pin;source:Pin;freezeManifest:Pin;selectedPages:readonly SelectedPage[];
  entry:Readonly<{key:string;module:string;maturity:'private-current-js';
   artifacts:Readonly<{module:Pin;timeline:Pin;runtime:Pin}>}>;
  continuousSource:Readonly<{mp3:Pin;blockCount:number;firstAudioBlockFrame:number}>;
  optionalSpanishAudio:Readonly<{source:Pin;asset:Pin;trigger:string;localeAutoplay:false;
   mainStreamSpliced:false}>;
  integrity:Readonly<{files:readonly Pin[]}>;
  acceptanceEffects:PageOnlyLessonPlayerDescriptor['productBridge']['acceptanceEffects'];
  productCalibrationPassed:false;scaleOutAuthorized:false;
 }>;
 readonly registration:Readonly<{
  calibrationId:string;deploymentScope:'local-only';maturity:'private-current-js';
  freezeManifestSha256:string;moduleSha256:string;timelineSha256:string;runtimeSha256:string;
 }>;
}

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`ALG_L06_P008_DESCRIPTOR_INVALID: ${reason}`);
}
const pageId=(ordinal:number)=>`shared-alg001-l06-p${String(ordinal).padStart(3,'0')}`;
const validPin=(pin:Pin|undefined)=>Boolean(pin&&typeof pin.path==='string'&&
 Number.isSafeInteger(pin.bytes)&&pin.bytes>0&&/^[a-f0-9]{64}$/u.test(pin.sha256));

/** Add exactly RW7 while retaining every existing page, label and glossary row. */
export function extendAlgL6P008Descriptor(base:PageOnlyLessonPlayerDescriptor,
 input:AlgL06P008DescriptorInput):PageOnlyLessonPlayerDescriptor{
 const {packet,registration}=input;
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===21,'21/60 P004 predecessor');
 demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML_PATH&&base.source.sourceXmlSha256===XML_SHA,
  'source-ordered lesson XML');
 const registeredBefore=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(isDeepStrictEqual(registeredBefore,PREDECESSOR_ORDINALS.map(pageId))&&
  isDeepStrictEqual(registeredBefore,base.productBridge.selectedAnimationIds),
  'exact P004 predecessor registration');
 for(const [index,page] of base.pages.entries()){
  const id=pageId(index+1),previous=index?pageId(index):null;
  const next=index<59?pageId(index+2):null;
  demand(page.animationId===id&&page.placementId===id&&
   page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
   page.previousPlacementId===previous&&page.previousAnimationId===previous&&
   page.nextPlacementId===next&&page.nextAnimationId===next,
   'all 60 exact source-order links');
 }
 const target=base.pages[7];
 demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='RW'&&
  target.sectionPageOrdinal===7&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.previousPlacementId===pageId(7)&&target.nextPlacementId===pageId(9),
  'P008 RW7 source placement and neighbors');
 demand(packet.calibrationId===ALG_L06_P008_ADMISSION_CALIBRATION&&
  packet.deploymentScope==='local-only'&&packet.sourceRoot===SOURCE_ROOT&&
  packet.sourceXml.path===XML_PATH&&packet.sourceXml.bytes===13926&&
  packet.sourceXml.sha256===XML_SHA&&packet.source.path===SOURCE_PATH&&
  packet.source.bytes===2805364&&packet.source.sha256===SOURCE_SHA&&
  validPin(packet.freezeManifest)&&packet.freezeManifest.path===FREEZE_PATH,
  'exact P008 source and v3 freeze');
 demand(packet.selectedPages.length===1,'one selected page');
 const selected=packet.selectedPages[0],runtime=selected.runtime,artifacts=packet.entry.artifacts;
 demand(selected.animationId===ALG_L06_P008_ADMISSION_ID&&
  selected.placementId===ALG_L06_P008_ADMISSION_ID&&
  selected.sourceSha256===SOURCE_SHA&&selected.globalPageOrdinal===8&&
  selected.sourceOccurrence===8&&selected.sectionCode==='RW'&&
  selected.sectionPageOrdinal===7,'exact RW7 source occurrence');
 demand(runtime.frameDomain==='sprite-507'&&runtime.frameCount===938&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.stage.width===800&&runtime.stage.height===600&&
  runtime.scenario==='source-static-frame'&&runtime.seed==='0'&&
  runtime.hostPlaybackCompletion===false,'source frame domain and completion boundary');
 demand(packet.entry.key===ALG_L06_P008_ADMISSION_ID&&
  packet.entry.module===`./modules/${ALG_L06_P008_ADMISSION_ID}`&&
  packet.entry.maturity==='private-current-js'&&
  validPin(artifacts.module)&&artifacts.module.path===
   `packages/demos/src/modules/${ALG_L06_P008_ADMISSION_ID}.tsx`&&
  validPin(artifacts.timeline)&&artifacts.timeline.path===
   `packages/demos/src/timelines/${ALG_L06_P008_ADMISSION_ID}.ts`&&
  validPin(artifacts.runtime)&&artifacts.runtime.path===RUNTIME_PATH&&
  artifacts.runtime.bytes===19032480&&artifacts.runtime.sha256===RUNTIME_SHA&&
  isDeepStrictEqual(runtime.canvasRenderer,artifacts.runtime),
  'maintained module, timeline and optimized Canvas runtime');
 demand(packet.continuousSource.mp3.sha256===
  'ab14ce47d0f98c841213b222f27e7bc44587ba27849048ed1dd16bd41c2eabe2'&&
  packet.continuousSource.mp3.bytes===377130&&
  packet.continuousSource.blockCount===911&&
  packet.continuousSource.firstAudioBlockFrame===19&&
  packet.optionalSpanishAudio.source.sha256===
   'ca48f20431673bb4e6f17c28cb605134f4098161bbcb93cc82c274cb472466f3'&&
  packet.optionalSpanishAudio.source.bytes===135072&&
  packet.optionalSpanishAudio.asset.sha256===packet.optionalSpanishAudio.source.sha256&&
  packet.optionalSpanishAudio.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false,
  'embedded English stream and separate user-triggered SA');
 const evidence=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 demand(evidence.get('migrations/shared-alg001-l06-p008/audit/text-state-v1/text-state-audit-v1.json')?.sha256===
  '2f5602d837edacd53a47ac3a7c7a7fe051421df4e076844c7987acf71f88e9e4'&&
  evidence.get('packages/demos/src/alg-l06-p008-player-v1.tsx')?.sha256===
  '265d23c16cc0868c5c8ef57714380d81fe966ae9c240f78040e0d7c319e391d3',
  'native text source and final mobile player pins');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false&&
  isDeepStrictEqual(Object.keys(packet.acceptanceEffects).sort(),
   ['authoritativeOriginalRuntime','fidelityAccepted','audioAccepted','humanVisualAccepted',
    'ownerAccepted','strictComplete','published'].sort())&&
  Object.values(packet.acceptanceEffects).every(value=>value===false)&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'independent acceptance remains closed');
 demand(registration.calibrationId===packet.calibrationId&&
  registration.deploymentScope==='local-only'&&registration.maturity==='private-current-js'&&
  registration.freezeManifestSha256===packet.freezeManifest.sha256&&
  registration.moduleSha256===artifacts.module.sha256&&
  registration.timelineSha256===artifacts.timeline.sha256&&
  registration.runtimeSha256===artifacts.runtime.sha256,
  'actual registration metadata equals v3 packet');
 const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==7?page:Object.freeze({
  ...page,rendererAvailability:Object.freeze({kind:'registered' as const,
   moduleKey:ALG_L06_P008_ADMISSION_ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-507',language:'fixed-en' as const,
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
   pageInteractionCompanionTargetIdSuffix:'p008-source-readable'}),
 }));
 const selectedAfter=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selectedAfter.length===22&&selectedAfter[7]===ALG_L06_P008_ADMISSION_ID&&
  isDeepStrictEqual(selectedAfter.filter(id=>id!==ALG_L06_P008_ADMISSION_ID),registeredBefore),
  'one exact registered-page delta');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:${ALG_L06_P008_ADMISSION_CALIBRATION}`,
  calibrationId:ALG_L06_P008_ADMISSION_CALIBRATION,
  releaseId:ALG_L06_P008_ADMISSION_CALIBRATION,
  course:Object.freeze({...base.course,href:FORMAL_PATH}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${ALG_L06_P008_ADMISSION_CALIBRATION}`}),
  pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selectedAfter),registeredAnimationCount:22}),
 });
}
