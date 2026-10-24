import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {CALIBRATION,ID,PROOF_PATH,SOURCE,XML,SOURCE_ROOT,readP025CanonicalSource,
 validateP025Page} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P024FormalDescriptor} from './alg-l06-p024-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor,
 WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error(`P025_FORMAL_DESCRIPTOR_INVALID: ${reason}`);};
const pageId=(n:number)=>`shared-alg001-l06-p${String(n).padStart(3,'0')}`;
const PREDECESSORS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,
 30,36,37,39,40,51,52,53,54,55,59];

/** Exact registered VB15 projection, read from its own proof and the actual
 * private registry. The historical unregistered route remains independent. */
export function algL6P025FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
  throw Error('P025_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((p:{animationId:string})=>p.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF_PATH,'one exact own proof');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof);
 validateP025Page(packet,proof.registration,root);
 const source=readP025CanonicalSource(root),entry=proof.registration.entries[0],
  metadata=localOnlyAnimationModuleRegistration(ID);
 demand(proof.animationId===ID&&metadata?.calibrationId===CALIBRATION&&
  metadata.deploymentScope==='local-only'&&metadata.maturity==='private-current-js'&&
  metadata.freezeManifestSha256===proof.registration.freezeManifestSha256&&
  metadata.moduleSha256===entry.artifacts.module.sha256&&
  metadata.timelineSha256===entry.artifacts.timeline.sha256&&
  metadata.runtimeSha256===entry.artifacts.runtime.sha256,
  'actual metadata/source proof identity');
 const base=algL6P024FormalDescriptor();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.course.activePageCount===60&&
  base.course.expectedReleaseMemberCount===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===35&&base.glossary.length===38&&
  base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'exact P024 35/60 predecessor');
 const before=base.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(isDeepStrictEqual(before,PREDECESSORS.map(pageId))&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'all 35 predecessor registrations');
 for(const [i,page] of base.pages.entries())demand(page.animationId===pageId(i+1)&&
  page.placementId===pageId(i+1)&&page.globalPageOrdinal===i+1&&
  page.source.sourceOccurrence===i+1&&
  page.previousPlacementId===(i?pageId(i):null)&&
  page.previousAnimationId===(i?pageId(i):null)&&
  page.nextPlacementId===(i<59?pageId(i+2):null)&&
  page.nextAnimationId===(i<59?pageId(i+2):null),
  'all sixty source links');
 const target=base.pages[24];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.sectionCode==='VB'&&target.sectionPageOrdinal===15&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId===pageId(24)&&target.nextPlacementId===pageId(26),
  'one exact unregistered VB15 target');
 demand(packet.selectedPages.length===1&&packet.selectedPages[0].globalPageOrdinal===25&&
  packet.selectedPages[0].runtime.frameDomain==='sprite-21'&&
  packet.selectedPages[0].runtime.frameCount===299&&
  isDeepStrictEqual(source.audit.runtime.domains.map((d:{domain:string;declaredFrames:number})=>
   [d.domain,d.declaredFrames]),[['root',10],['sprite-21',299]])&&
  source.audit.runtime.rootEntry.frame===6&&source.audit.runtime.buttonActions.length===4&&
  source.audit.runtime.mainActionCount===0&&
  source.audioPlan.main.frameDomain==='sprite-21'&&
  source.audioPlan.optionalSpanishAudio.localeAutoplay===false&&
  source.audioPlan.optionalSpanishAudio.joinedWithMain===false&&
  Object.values(packet.acceptanceEffects).every(x=>x===false)&&
  Object.values(base.productBridge.acceptanceEffects).every(x=>x===false),
  'source main/SA domains, no quiz, and independent gates');
 const glossary=[...base.glossary],row=source.crosswalk.entries.find((e:{key:string})=>
  e.key==='Independent variable'),dictionary=row?.dictionary;
 demand(dictionary&&!row?.modern.present&&!glossary.some(e=>e.id===dictionary.id)&&
  dictionary.definitions.en&&dictionary.definitions.es,
  'exact new Independent variable dictionary entry');
 glossary.push(Object.freeze({id:dictionary.id,sourceKeyAttribute:'Independent variable',
  labels:Object.freeze({...dictionary.labels}),
  definitions:Object.freeze({...dictionary.definitions}),
  source:Object.freeze({...dictionary.source})}) as PageOnlyLessonGlossaryEntry);
 demand(glossary.length===39&&Object.keys(source.glossary).length===4&&
  Object.keys(source.glossary).every(key=>
   glossary.filter(e=>e.sourceKeyAttribute===key).length===1),
  'four exact source glossary keys');
 const pages=base.pages.map((page,i):WholeLessonPlayerPage=>i!==24?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-21',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p025-source-readable'})}));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===36&&after[24]===ID&&
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
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:36})});
}
