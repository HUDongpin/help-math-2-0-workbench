import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {CALIBRATION,ID,PROOF_PATH,SOURCE,XML,SOURCE_ROOT,readP022CanonicalSource,validateP022AdmissionSemantics} from '../../../lib/alg-l06-p022-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P021FormalDescriptor} from './alg-l06-p021-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage} from './whole-lesson-player-descriptor';
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error(`P022_FORMAL_DESCRIPTOR_INVALID: ${reason}`);};
const pageId=(n:number)=>`shared-alg001-l06-p${String(n).padStart(3,'0')}`;
const PREDECESSORS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,30,36,37,39,40,51,52,53,54,55,59];
/** Exact registered VB12 projection. Source audit and browser evidence remain scoped Current-JS. */
export function algL6P022FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')throw Error('P022_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((p:{animationId:string})=>p.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF_PATH,'one exact own proof');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof);
 validateP022AdmissionSemantics(packet,proof.registration,root);
 const source=readP022CanonicalSource(root),entry=proof.registration.entries[0],metadata=localOnlyAnimationModuleRegistration(ID);
 demand(proof.animationId===ID&&metadata?.calibrationId===CALIBRATION&&
  metadata.deploymentScope==='local-only'&&metadata.maturity==='private-current-js'&&
  metadata.freezeManifestSha256===proof.registration.freezeManifestSha256&&
  metadata.moduleSha256===entry.artifacts.module.sha256&&metadata.timelineSha256===entry.artifacts.timeline.sha256&&
  metadata.runtimeSha256===entry.artifacts.runtime.sha256,'actual metadata/source proof identity');
 const base=algL6P021FormalDescriptor();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&base.productBridge.registeredAnimationCount===32&&
  base.glossary.length===34&&base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,'exact P021 32/60 predecessor');
 const before=base.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(isDeepStrictEqual(before,PREDECESSORS.map(pageId))&&isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),'all 32 predecessor registrations');
 for(const [i,p] of base.pages.entries())demand(p.animationId===pageId(i+1)&&p.placementId===pageId(i+1)&&
  p.globalPageOrdinal===i+1&&p.source.sourceOccurrence===i+1&&p.previousPlacementId===(i?pageId(i):null)&&
  p.previousAnimationId===(i?pageId(i):null)&&p.nextPlacementId===(i<59?pageId(i+2):null)&&
  p.nextAnimationId===(i<59?pageId(i+2):null),'all sixty source links');
 const target=base.pages[21];demand(target.animationId===ID&&target.sectionCode==='VB'&&target.sectionPageOrdinal===12&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&target.rendererAvailability.kind==='unavailable','one exact unregistered source target');
 demand(packet.selectedPages.length===1&&packet.selectedPages[0].globalPageOrdinal===22&&
  packet.selectedPages[0].sectionPageOrdinal===12&&packet.selectedPages[0].runtime.frameDomain==='sprite-67'&&
  packet.selectedPages[0].runtime.frameCount===422&&Object.values(packet.acceptanceEffects).every(x=>x===false)&&
  Object.values(base.productBridge.acceptanceEffects).every(x=>x===false),'422 source domain, independent gates');
 const glossary=[...base.glossary];
 for(const key of ['Graph','Representation']){
  const row=source.crosswalk.entries.find((e:{key:string})=>e.key===key),d=row?.dictionary;
  demand(d&&!row.modern.present&&!glossary.some(e=>e.id===d.id)&&d.definitions.en&&d.definitions.es,'exact new dictionary entry');
  glossary.push(Object.freeze({id:d.id,sourceKeyAttribute:key,labels:Object.freeze({...d.labels}),definitions:Object.freeze({...d.definitions}),source:Object.freeze({...d.source})}) as PageOnlyLessonGlossaryEntry);
 }
 demand(glossary.length===36&&Object.keys(source.glossary).every(key=>glossary.filter(e=>e.sourceKeyAttribute===key).length===1),'six exact glossary keys');
 const pages=base.pages.map((p,i):WholeLessonPlayerPage=>i!==21?p:Object.freeze({...p,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,runtimeQuery:Object.freeze({frameDomain:'sprite-67',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...p.presentation,pageInteractionCompanionTargetIdSuffix:'p022-source-readable'})}));
 const after=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(after.length===33&&after[21]===ID&&isDeepStrictEqual(after.filter(id=>id!==ID),before),'one exact registration delta');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${CALIBRATION}`,calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/continuous-v1`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(after),registeredAnimationCount:33})});
}
