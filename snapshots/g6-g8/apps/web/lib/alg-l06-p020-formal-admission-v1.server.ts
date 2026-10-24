import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {CALIBRATION,ID,PROOF_PATH,SOURCE,XML,SOURCE_ROOT,
 readP020CanonicalSource,validateP020AdmissionSemantics}
 from '../../../lib/alg-l06-p020-admission-semantics-v2.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P019FormalDescriptor} from './alg-l06-p019-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage}
 from './whole-lesson-player-descriptor';

const FORMAL_PATH=`/migration-status/g678-calibration/${ID}/continuous-v1`;
const EXPECTED_PREDECESSOR=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
 30,36,37,39,40,51,52,53,54,55,59].map(number=>
 `shared-alg001-l06-p${String(number).padStart(3,'0')}`);
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type Packet=Readonly<{calibrationId:string;sourceRoot:string;deploymentScope:string;
 source:Pin;sourceXml:Pin;freezeManifest:Pin;entry:Readonly<{key:string;
 artifacts:Readonly<{module:Pin;timeline:Pin;runtime:Pin}>}>;
 selectedPages:readonly Readonly<{animationId:string;placementId:string;
 globalPageOrdinal:number;sectionPageOrdinal:number;
 runtime:Readonly<{frameDomain:string;frameCount:number;quizHoldFrame:number}>}>[];
 acceptanceEffects:PageOnlyLessonPlayerDescriptor['productBridge']['acceptanceEffects']}>;
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P020_FORMAL_DESCRIPTOR_INVALID: ${reason}`);
}

/** Exact current proof and physical source precede the single VB10 projection. */
export function algL6P020FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
  throw Error('P020_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const own=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(own.length!==1||own[0].proof.path!==PROOF_PATH)
  throw Error('P020_FORMAL_EXACT_V1_ADMISSION');
 const proofPin=own[0].proof;
 const packet=readPageProof(root,proofPin,host,transaction) as Packet;
 const proof=readJsonPin(root,proofPin);
 if(proof.animationId!==ID)throw Error('P020_FORMAL_PROOF_IDENTITY');
 validateP020AdmissionSemantics(packet,proof.registration,root);
 readP020CanonicalSource(root);
 const entry=proof.registration.entries[0],metadata=localOnlyAnimationModuleRegistration(ID);
 if(!metadata?.calibrationId||metadata.deploymentScope!=='local-only'||
  metadata.maturity!=='private-current-js'||
  metadata.calibrationId!==proof.registration.calibrationId||
  metadata.freezeManifestSha256!==proof.registration.freezeManifestSha256||
  metadata.moduleSha256!==entry.artifacts.module.sha256||
  metadata.timelineSha256!==entry.artifacts.timeline.sha256||
  metadata.runtimeSha256!==entry.artifacts.runtime.sha256)
  throw Error('P020_FORMAL_REGISTRATION_METADATA');

 const base=algL6P019FormalDescriptor();
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===30,
  '30/60 P019 predecessor');
 demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'source-ordered lesson XML');
 const before=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(isDeepStrictEqual(before,EXPECTED_PREDECESSOR)&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'thirty exact predecessor placements');
 for(const [index,page] of base.pages.entries()){
  const id=`shared-alg001-l06-p${String(index+1).padStart(3,'0')}`;
  const previous=index?`shared-alg001-l06-p${String(index).padStart(3,'0')}`:null;
  const next=index<59?`shared-alg001-l06-p${String(index+2).padStart(3,'0')}`:null;
  demand(page.animationId===id&&page.placementId===id&&
   page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
   page.previousPlacementId===previous&&page.previousAnimationId===previous&&
   page.nextPlacementId===next&&page.nextAnimationId===next,
   'all 60 source-order links unchanged');
 }
 const target=base.pages[19];
 demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===10&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.previousPlacementId==='shared-alg001-l06-p019'&&
  target.nextPlacementId==='shared-alg001-l06-p021',
  'exact P020 VB10 placement and neighbors');
 demand(packet.calibrationId===CALIBRATION&&packet.sourceRoot===SOURCE_ROOT&&
  packet.deploymentScope==='local-only'&&packet.entry.key===ID&&
  packet.source.sha256===SOURCE.sha256&&packet.sourceXml.sha256===XML.sha256&&
  packet.selectedPages.length===1&&packet.selectedPages[0].globalPageOrdinal===20&&
  packet.selectedPages[0].runtime.frameDomain==='sprite-162'&&
  packet.selectedPages[0].runtime.frameCount===172&&
  packet.selectedPages[0].runtime.quizHoldFrame===58,
  'source-bound proof runtime');
 demand(base.glossary.length===32&&new Set(base.glossary.map(row=>row.id)).size===32&&
  (['Input','Function','Output'] as const).every(key=>
   base.glossary.filter(row=>row.sourceKeyAttribute===key&&
    row.id===key.toLowerCase()&&row.definitions.en&&row.definitions.es).length===1),
  'reuse exact English and Spanish dictionary entries');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false)&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'independent acceptance remains closed');
 const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==19?page:Object.freeze({
  ...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-162',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p020-source-readable'}),
 }));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===31&&after[19]===ID&&
  isDeepStrictEqual(after.filter(id=>id!==ID),before),
  'one exact registered page delta and all thirty preserved');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,href:FORMAL_PATH}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:31})});
}
