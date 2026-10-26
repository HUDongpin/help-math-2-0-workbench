import 'server-only';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readOrdinary,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {extendAlgL6Descriptor,readAlgL6P002Packet,readAlgL6P002DecoderSuccessor} from './g678-alg-l06-p002.server';
import {extendAlgL6P001Descriptor,readAlgL6P001Packet} from './g678-alg-l06-p001.server';
import {readP003ContinuousSource} from './alg-l06-p003-continuous-source-v2.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-alg001-l06-p003';
const PREFIX='shared-alg001-l06-';
const SNAPSHOT={path:'output/nms-l02-host-successor-20260927/predecessor/base-witness-v3/full-base-snapshot.json',
 bytes:4124297,sha256:'c14bbcf7529ec50a84f1d1f2fe7b8603285698b680f816eba720f44182ffa7f0'};
const HISTORICAL_REGISTRY={path:'output/nms-l02-host-successor-20260927/registry-predecessor/private-current-js-registry.json',
 bytes:607749,sha256:'1be56e4b5271d5365ba8cb7e5ee19e382df3c3f6f749552e0cec491339a7b61e'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const CANVAS={path:'canvas-renderer.js',bytes:9063233,
 sha256:'87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c'};
type Pin={path:string;bytes:number;sha256:string};
type Registration={calibrationId:string;deploymentScope:string;freezeManifest:string;
 freezeManifestBytes:number;freezeManifestSha256:string;entries:Array<{key:string;artifacts:Record<string,Pin|string>}>};
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P003_CONTINUOUS_CANDIDATE: ${reason}`);}

/** A historical descriptor supplies structure only. Every source occurrence and
 * the scoped current registrations are rechecked; this does not revive the old
 * aggregate reader or assert a current whole-catalog acceptance witness. */
export function algL6P003ContinuousCandidateDescriptor(){
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT,'local development source environment');
 const root=getWorkspaceRoot();
 const xml=readPin(SOURCE_ROOT,XML).toString('utf8').replace(/<!--[\s\S]*?-->/gu,'');
 const snapshot=readJsonPin(root,SNAPSHOT) as {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
 const matches=snapshot.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===6);
 demand(snapshot.status==='ready'&&matches.length===1,'unique historical source structure');
 let base=matches[0];
 demand(base.pages.length===60&&base.course.activePageCount===60&&base.course.courseShellCount===0&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,'source lesson identity');
 const occurrences=[...xml.matchAll(/<Section\b[^>]*\bSName="([A-Z]+)"[^>]*>([\s\S]*?)<\/Section>/gu)]
  .flatMap(section=>[...section[2].matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)]
   .map((page,index)=>({section:section[1],sectionOrdinal:index+1,path:page[1].trim()})));
 demand(occurrences.length===60,'60 active XML pages');
 for(const [index,occurrence] of occurrences.entries()){
  const page=base.pages[index],id=`${PREFIX}p${String(index+1).padStart(3,'0')}`;
  demand(/^[A-Z]+\/[A-Za-z0-9]+\.swf$/u.test(occurrence.path),'bounded source path');
  const bytes=readOrdinary(SOURCE_ROOT,`G6-G8-shared/ALG001/L6/${occurrence.path}`);
  const digest=createHash('sha256').update(bytes).digest('hex');
  demand(page.animationId===id&&page.placementId===id&&page.globalPageOrdinal===index+1&&
   page.sectionCode===occurrence.section&&page.sectionPageOrdinal===occurrence.sectionOrdinal&&
   page.source.sourceOccurrence===index+1&&page.source.assetId===`swf-${digest}`&&
   page.previousPlacementId===(index?base.pages[index-1].placementId:null)&&
   page.nextPlacementId===(index<59?base.pages[index+1].placementId:null),'current source order and bytes');
 }
 readP003ContinuousSource();
 readPin('/Volumes/American Dream/hudongpin/g678-p003-candidate-v2.w5AS1a',CANVAS);
 const transaction=readRegistryTransaction(root);
 const calibrations=transaction.registry.calibrations as Registration[];
 const historical=readJsonPin(root,HISTORICAL_REGISTRY) as {calibrations:Registration[]};
 const registered=calibrations.flatMap(c=>c.entries.filter(e=>e.key.startsWith(PREFIX)).map(e=>({c,e})));
 const originalSelected=base.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(originalSelected.length===17&&registered.length===19&&
  !registered.some(({e})=>e.key===ID)&&!localOnlyAnimationModuleRegistration(ID),'P003 remains unregistered');
 for(const {c,e} of registered){
  if(originalSelected.includes(e.key)){
   const old=historical.calibrations.find(row=>row.calibrationId===c.calibrationId);
   demand(old&&old.freezeManifestSha256===c.freezeManifestSha256&&
    isDeepStrictEqual(old.entries.find(entry=>entry.key===e.key),e),'retained exact base registration');
  }else demand(e.key===`${PREFIX}p001`||e.key===`${PREFIX}p002`,'only validated predecessor additions');
  readPin(root,{path:c.freezeManifest,bytes:c.freezeManifestBytes,sha256:c.freezeManifestSha256});
  for(const pin of Object.values(e.artifacts))if(typeof pin!=='string')readPin(root,pin);
  const metadata=localOnlyAnimationModuleRegistration(e.key);
  demand(metadata?.calibrationId===c.calibrationId&&metadata.freezeManifestSha256===c.freezeManifestSha256,
   'current generated registration binding');
 }
 base=extendAlgL6Descriptor(base,readAlgL6P002Packet(root),readAlgL6P002DecoderSuccessor(root),
  localOnlyAnimationModuleRegistration(`${PREFIX}p002`));
 base=extendAlgL6P001Descriptor(base,readAlgL6P001Packet(root),localOnlyAnimationModuleRegistration(`${PREFIX}p001`));
 demand(base.productBridge.registeredAnimationCount===19&&base.pages[2].rendererAvailability.kind==='unavailable'&&
  base.pages[2].source.assetId==='swf-c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
 'registered predecessor and P003 exact source');
 const pages=base.pages.map(page=>page.animationId!==ID?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-154',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'p003-source-readable'}),
 }));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===20&&Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'one simulated candidate and independent gates');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p003-continuous-v2-unregistered`,
  calibrationId:'g678-alg-l06-p003-continuous-v2-unregistered',releaseId:`${base.releaseId}:p003-continuous-v2-unregistered`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/continuous-v2`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p003-continuous-v2-unregistered`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length}),
  continuousCandidateDisclosure:Object.freeze({status:'unregistered-engineering-candidate' as const,
   historicalStructureSnapshotSha256:SNAPSHOT.sha256,wholeCatalogWitnessCurrent:false as const,
   actualRegisteredLessonPages:19,simulatedLessonPages:20,officialRegisteredCount:registeredLocalOnlyAnimationKeys.length,
   registryTransactionSha256:transaction.sha256,registrationChanged:false as const,acceptanceEffect:'none' as const}),
 });
}
