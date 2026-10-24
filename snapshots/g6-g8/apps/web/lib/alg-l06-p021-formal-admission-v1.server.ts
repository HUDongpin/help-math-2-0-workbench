import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {CALIBRATION,ID,PROOF_PATH,SOURCE,XML,SOURCE_ROOT,
 readP021CanonicalSource,validateP021AdmissionSemantics}
 from '../../../lib/alg-l06-p021-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P020FormalDescriptor} from './alg-l06-p020-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor,
 WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

const FORMAL_PATH=`/migration-status/g678-calibration/${ID}/continuous-v1`;
const CROSSWALK={path:'output/alg-l06-p021-glossary-audit-v1/six-term-crosswalk-v1.json',
 bytes:11627,sha256:'56354e286fe68ef3b2cc89860b76c02d801499194b25377cbd6180d022b541dc'};
const PREDECESSOR_ORDINALS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
 20,30,36,37,39,40,51,52,53,54,55,59];
const BUTTONS=[[8,'Set','set'],[9,'Input','input'],[10,'Ordered pair','ordered-pair'],
 [11,'Function','function'],[12,'Value','value'],[22,'Output','output']] as const;
const NEW_IDS=['set','ordered-pair'] as const;
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type Packet=Readonly<{calibrationId:string;sourceRoot:string;deploymentScope:string;
 source:Pin;sourceXml:Pin;freezeManifest:Pin;entry:Readonly<{key:string;
 artifacts:Readonly<{module:Pin;timeline:Pin;runtime:Pin}>}>;
 selectedPages:readonly Readonly<{animationId:string;placementId:string;
 globalPageOrdinal:number;sectionPageOrdinal:number;
 runtime:Readonly<{frameDomain:string;frameCount:number}>}>[];
 acceptanceEffects:PageOnlyLessonPlayerDescriptor['productBridge']['acceptanceEffects']}>
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P021_FORMAL_DESCRIPTOR_INVALID: ${reason}`);
}
const pageId=(ordinal:number)=>`shared-alg001-l06-p${String(ordinal).padStart(3,'0')}`;

/** Read the physical P021 proof before projecting one source-ordered VB11 placement. */
export function algL6P021FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
  throw Error('P021_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const own=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(own.length!==1||own[0].proof.path!==PROOF_PATH)
  throw Error('P021_FORMAL_EXACT_V1_ADMISSION');
 const proofPin=own[0].proof;
 const packet=readPageProof(root,proofPin,host,transaction) as Packet;
 const proof=readJsonPin(root,proofPin);
 if(proof.animationId!==ID)throw Error('P021_FORMAL_PROOF_IDENTITY');
 validateP021AdmissionSemantics(packet,proof.registration,root);
 readP021CanonicalSource(root);
 const entry=proof.registration.entries[0],metadata=localOnlyAnimationModuleRegistration(ID);
 if(!metadata?.calibrationId||metadata.deploymentScope!=='local-only'||
  metadata.maturity!=='private-current-js'||
  metadata.calibrationId!==proof.registration.calibrationId||
  metadata.freezeManifestSha256!==proof.registration.freezeManifestSha256||
  metadata.moduleSha256!==entry.artifacts.module.sha256||
  metadata.timelineSha256!==entry.artifacts.timeline.sha256||
  metadata.runtimeSha256!==entry.artifacts.runtime.sha256)
  throw Error('P021_FORMAL_REGISTRATION_METADATA');

 const base=algL6P020FormalDescriptor();
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.pageOnlyDescriptorMemberCount===60&&
  base.productBridge.registeredAnimationCount===31,
  '31/60 P020 predecessor');
 demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'source-ordered lesson XML');
 const before=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(isDeepStrictEqual(before,PREDECESSOR_ORDINALS.map(pageId))&&
  isDeepStrictEqual(before,base.productBridge.selectedAnimationIds),
  'thirty-one exact predecessor placements');
 for(const [index,page] of base.pages.entries()){
  const id=pageId(index+1),previous=index?pageId(index):null;
  const next=index<59?pageId(index+2):null;
  demand(page.animationId===id&&page.placementId===id&&
   page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
   page.previousPlacementId===previous&&page.previousAnimationId===previous&&
   page.nextPlacementId===next&&page.nextAnimationId===next,
   'all 60 source-order links unchanged');
 }
 const target=base.pages[20];
 demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===11&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.previousPlacementId===pageId(20)&&target.nextPlacementId===pageId(22),
  'exact P021 VB11 source placement and neighbors');
 demand(packet.calibrationId===CALIBRATION&&packet.sourceRoot===SOURCE_ROOT&&
  packet.deploymentScope==='local-only'&&packet.entry.key===ID&&
  packet.source.sha256===SOURCE.sha256&&packet.sourceXml.sha256===XML.sha256&&
  packet.selectedPages.length===1&&packet.selectedPages[0].animationId===ID&&
  packet.selectedPages[0].placementId===ID&&
  packet.selectedPages[0].globalPageOrdinal===21&&
  packet.selectedPages[0].sectionPageOrdinal===11&&
  packet.selectedPages[0].runtime.frameDomain==='sprite-43'&&
  packet.selectedPages[0].runtime.frameCount===377,
  'source-bound proof runtime');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false)&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'independent acceptance remains closed');

 const crosswalk=readJsonPin(root,CROSSWALK);
 demand(crosswalk.identity.animationId===ID&&
  crosswalk.inputs.swf.sha256===SOURCE.sha256&&
  crosswalk.inputs.lesson.sha256===XML.sha256&&
  crosswalk.active.registeredLessonPages===31&&
  crosswalk.active.glossaryEntryCount===32&&
  isDeepStrictEqual(crosswalk.entries.map((item:{buttonCharacterId:number;
   key:string;dictionary:{id:string}})=>
   [item.buttonCharacterId,item.key,item.dictionary.id]),BUTTONS)&&
  isDeepStrictEqual(crosswalk.missingModernKeys,['Set','Ordered pair'])&&
  crosswalk.originalHostRunObserved===false&&crosswalk.acceptanceChanged===false,
  'six exact source dictionary entries');
 const oldIds=new Set(base.glossary.map(item=>item.id));
 demand(base.glossary.length===32&&oldIds.size===32&&
  NEW_IDS.every(id=>!oldIds.has(id))&&
  BUTTONS.filter(([,key])=>!['Set','Ordered pair'].includes(key)).every(([,key,id])=>
   base.glossary.filter(item=>item.id===id&&item.sourceKeyAttribute===key).length===1),
  'retain four existing dictionary entries');
 const additions:PageOnlyLessonGlossaryEntry[]=NEW_IDS.map(id=>{
  const item=crosswalk.entries.find((row:{dictionary:{id:string}})=>row.dictionary.id===id);
  demand(item&&item.modern.present===false&&item.modern.entryId===null&&
   item.dictionary.sourceKeyAttribute===item.key&&
   item.dictionary.definitions.en.length>0&&item.dictionary.definitions.es.length>0,
   `new exact dictionary entry ${id}`);
  return Object.freeze({id,sourceKeyAttribute:item.key,
   labels:Object.freeze({...item.dictionary.labels}),
   definitions:Object.freeze({...item.dictionary.definitions}),
   source:Object.freeze({en:Object.freeze({...item.dictionary.source.en}),
    es:Object.freeze({...item.dictionary.source.es})})});
 });
 const glossary=Object.freeze([...base.glossary,...additions]);
 demand(glossary.length===34&&BUTTONS.every(([,key,id])=>
  glossary.filter(item=>item.id===id&&item.sourceKeyAttribute===key).length===1),
  'six retained/new exact dictionary entries');
 const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==20?page:Object.freeze({
  ...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-43',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p021-source-readable'}),
 }));
 const after=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(after.length===32&&after[20]===ID&&
  isDeepStrictEqual(after.filter(id=>id!==ID),before),
  'one exact registered page delta and all predecessors preserved');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,href:FORMAL_PATH}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  glossary,pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(after),registeredAnimationCount:32})});
}
