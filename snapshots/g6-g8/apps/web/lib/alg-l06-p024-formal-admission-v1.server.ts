import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {CALIBRATION,ID,PROOF_PATH,SOURCE,XML,SOURCE_ROOT,readP024CanonicalSource,
 validateP024Page} from '../../../lib/alg-l06-p024-admission-semantics-v2.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P023FormalDescriptor} from './alg-l06-p023-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor,
 WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error(`P024_FORMAL_DESCRIPTOR_INVALID: ${reason}`);};
const pageId=(n:number)=>`shared-alg001-l06-p${String(n).padStart(3,'0')}`;
const PREDECESSORS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
 30,36,37,39,40,51,52,53,54,55,59];

/** Exact registered VB14 projection. The P024 proof is read independently of
 * its historical unregistered candidate route and the P023 proof. */
export function algL6P024FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
  throw Error('P024_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((p:{animationId:string})=>p.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF_PATH,'one exact own proof');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof);
 validateP024Page(packet,proof.registration,root);
 const source=readP024CanonicalSource(root),entry=proof.registration.entries[0],
  metadata=localOnlyAnimationModuleRegistration(ID);
 demand(proof.animationId===ID&&metadata?.calibrationId===CALIBRATION&&
  metadata.deploymentScope==='local-only'&&metadata.maturity==='private-current-js'&&
  metadata.freezeManifestSha256===proof.registration.freezeManifestSha256&&
  metadata.moduleSha256===entry.artifacts.module.sha256&&
  metadata.timelineSha256===entry.artifacts.timeline.sha256&&
  metadata.runtimeSha256===entry.artifacts.runtime.sha256,
  'actual metadata/source proof identity');
 const base=algL6P023FormalDescriptor();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.course.activePageCount===60&&
  base.course.expectedReleaseMemberCount===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===34&&base.glossary.length===37&&
  base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'exact P023 34/60 predecessor');
 const before=base.pages.filter(p=>p.rendererAvailability.kind==='registered')
  .map(p=>p.animationId);
 demand(isDeepStrictEqual(before,PREDECESSORS.map(pageId))&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'all 34 predecessor registrations');
 for(const [i,page] of base.pages.entries())demand(page.animationId===pageId(i+1)&&
  page.placementId===pageId(i+1)&&page.globalPageOrdinal===i+1&&
  page.source.sourceOccurrence===i+1&&
  page.previousPlacementId===(i?pageId(i):null)&&
  page.previousAnimationId===(i?pageId(i):null)&&
  page.nextPlacementId===(i<59?pageId(i+2):null)&&
  page.nextAnimationId===(i<59?pageId(i+2):null),
  'all sixty source links');
 const target=base.pages[23];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.sectionCode==='VB'&&target.sectionPageOrdinal===14&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId===pageId(23)&&target.nextPlacementId===pageId(25),
  'one exact unregistered VB14 target');
 demand(packet.selectedPages.length===1&&packet.selectedPages[0].globalPageOrdinal===24&&
  packet.selectedPages[0].runtime.frameDomain==='sprite-208'&&
  packet.selectedPages[0].runtime.frameCount===381&&
  Object.values(packet.acceptanceEffects).every(x=>x===false)&&
  Object.values(base.productBridge.acceptanceEffects).every(x=>x===false),
  '381 source domain and independent gates');
 const glossary=[...base.glossary],row=source.crosswalk.entries.find((e:{key:string})=>
  e.key==='Range'),dictionary=row?.dictionary;
 demand(dictionary&&!row?.modern.present&&
  !glossary.some(e=>e.id===dictionary.id)&&
  dictionary.definitions.en&&dictionary.definitions.es,
  'exact new Range dictionary entry');
 glossary.push(Object.freeze({id:dictionary.id,sourceKeyAttribute:'Range',
  labels:Object.freeze({...dictionary.labels}),
  definitions:Object.freeze({...dictionary.definitions}),
  source:Object.freeze({...dictionary.source})}) as PageOnlyLessonGlossaryEntry);
 demand(glossary.length===38&&Object.keys(source.glossary).length===5&&
  Object.keys(source.glossary).every(key=>
   glossary.filter(e=>e.sourceKeyAttribute===key).length===1),
  'five exact source glossary keys');
 const pages=base.pages.map((page,i):WholeLessonPlayerPage=>i!==23?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-208',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p024-source-readable'})}));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===35&&after[23]===ID&&
  isDeepStrictEqual(after.filter(key=>key!==ID),before),
  'one exact registration delta');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/continuous-v1`}),
  source:Object.freeze({...base.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:35})});
}
