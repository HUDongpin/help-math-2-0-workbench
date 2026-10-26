import 'server-only';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {assertG678PredecessorMembership} from '../../../lib/g678-predecessor-membership-v1.mjs';
import {readJsonPin,readOrdinary,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P001_ID as ID,P001_SOURCE_ROOT,p001LocalDevelopment} from './alg-l07-p001-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

type Pin={path:string;bytes:number;sha256:string};
type Entry={key:string;module:string;maturity:string;artifacts:{module:Pin;timeline:Pin;[key:string]:Pin|string}};
type Calibration={calibrationId:string;deploymentScope:string;freezeManifest:string;
 freezeManifestBytes:number;freezeManifestSha256:string;entries:Entry[]};
const SNAPSHOT:Pin={path:'output/nms-l02-host-successor-20260927/predecessor/base-witness-v3/full-base-snapshot.json',
 bytes:4124297,sha256:'c14bbcf7529ec50a84f1d1f2fe7b8603285698b680f816eba720f44182ffa7f0'};
const HISTORICAL_REGISTRY:Pin={path:'output/nms-l02-host-successor-20260927/registry-predecessor/private-current-js-registry.json',
 bytes:607749,sha256:'1be56e4b5271d5365ba8cb7e5ee19e382df3c3f6f749552e0cec491339a7b61e'};
const XML:Pin={path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,
 sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'};
const SOURCE:Pin={path:'G6-G8-shared/ALG001/L7/IR/L7IR01.swf',bytes:72497,
 sha256:'cef7d8d01efa3a8cc1f2a6d6e6334213c23892e0375bdac72624fd6979c16821'};
const PREFIX='shared-alg001-l07-';
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L07_P001_CANDIDATE_INVALID: ${why}`);
}
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const normalized=(c:Calibration,e:Entry)=>({calibrationId:c.calibrationId,deploymentScope:c.deploymentScope,
 freezeManifest:{path:c.freezeManifest,bytes:c.freezeManifestBytes,sha256:c.freezeManifestSha256},entry:structuredClone(e)});
function unique(calibrations:Calibration[],key:string){
 const found=calibrations.flatMap(c=>c.entries.filter(e=>e.key===key).map(e=>({c,e})));
 demand(found.length===1,`unique registration ${key}`);return found[0]!;
}

/** The historical product snapshot is a preserved source-order witness.
 * Current registry and source bytes are checked afresh; no old proxy hash is renewed. */
export function algL07P001CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p001LocalDevelopment(),'exact local physical source scope');
 const root=getWorkspaceRoot(),saved=readJsonPin(root,SNAPSHOT) as
  {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
 const matches=saved.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===7);
 demand(saved.status==='ready'&&matches.length===1,'one preserved ALG001 L7 descriptor');
 const base=matches[0]!,xml=readPin(P001_SOURCE_ROOT,XML).toString('utf8');
 demand(base.course.activePageCount===62&&base.course.courseShellCount===0&&base.pages.length===62&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.productBridge.registeredAnimationCount===13,'preserved source lesson and 13 members');
 const occurrences=[...xml.replace(/<!--[\s\S]*?-->/gu,'').matchAll(
  /<Section\b[^>]*\bSName="([A-Z]+)"[^>]*>([\s\S]*?)<\/Section>/gu)]
  .flatMap(section=>[...section[2]!.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)]
   .map((page,index)=>({section:section[1]!,sectionOrdinal:index+1,path:page[1]!.trim()})));
 demand(occurrences.length===62,'all 62 XML occurrences');
 const sources=occurrences.map((item,index)=>{
  demand(/^[A-Z]+\/[A-Za-z0-9]+\.swf$/u.test(item.path),'bounded source path');
  const page=base.pages[index]!,key=`${PREFIX}p${String(index+1).padStart(3,'0')}`;
  const relative=`G6-G8-shared/ALG001/L7/${item.path}`,
   bytes=readOrdinary(P001_SOURCE_ROOT,relative),sha256=digest(bytes);
  demand(page.animationId===key&&page.placementId===key&&page.globalPageOrdinal===index+1&&
   page.sectionCode===item.section&&page.sectionPageOrdinal===item.sectionOrdinal&&
   page.source.sourceOccurrence===index+1&&page.source.assetId===`swf-${sha256}`&&
   page.previousPlacementId===(index?base.pages[index-1]!.placementId:null)&&
   page.nextPlacementId===(index<61?base.pages[index+1]!.placementId:null),
  `source-ordered placement ${key}`);
  return {key,source:{path:relative,bytes:bytes.length,sha256,assetId:`swf-${sha256}`,
   sourceOccurrence:index+1,sourceXmlSha256:XML.sha256}};
 });
 demand(isDeepStrictEqual(sources[0]!.source,{...SOURCE,assetId:`swf-${SOURCE.sha256}`,
  sourceOccurrence:1,sourceXmlSha256:XML.sha256}),'exact first source SWF');
 readPin(root,{...SOURCE,path:'migrations/shared-alg001-l07-p001/source-v1/L7IR01.swf'});
 readPin(root,{...XML,path:'migrations/shared-alg001-l07-p001/source-v1/index.xml'});
 const selected=base.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===13&&isDeepStrictEqual(selected,base.productBridge.selectedAnimationIds),
  'preserved source-ordered 13');
 const historical=(readJsonPin(root,HISTORICAL_REGISTRY) as {calibrations:Calibration[]}).calibrations;
 const transaction=readRegistryTransaction(root),current=transaction.registry.calibrations as Calibration[];
 const sourceByKey=new Map(sources.map(v=>[v.key,v.source]));
 const requiredMembers=selected.map(key=>{const pair=unique(historical,key),source=sourceByKey.get(key);
  demand(source,`historical source ${key}`);return {key,registration:normalized(pair.c,pair.e),source};});
 const currentPairs=current.flatMap(c=>c.entries.filter(e=>e.key.startsWith(PREFIX)&&e.key!==ID)
  .map(e=>({c,e})));
 demand(currentPairs.length===13,'exact current predecessor count');
 const currentMembers=currentPairs.map(({c,e})=>{
  const source=sourceByKey.get(e.key);demand(source,`current source ${e.key}`);
  readPin(root,{path:c.freezeManifest,bytes:c.freezeManifestBytes,sha256:c.freezeManifestSha256});
  for(const pin of Object.values(e.artifacts))if(typeof pin!=='string')readPin(root,pin);
  const meta=localOnlyAnimationModuleRegistration(e.key);
  demand(meta?.calibrationId===c.calibrationId&&meta.freezeManifestSha256===c.freezeManifestSha256&&
   meta.moduleSha256===e.artifacts.module.sha256&&meta.timelineSha256===e.artifacts.timeline.sha256,
   `generated current registry ${e.key}`);
  return {key:e.key,registration:normalized(c,e),source};
 });
 const membership=assertG678PredecessorMembership({keyPrefix:PREFIX,requiredMembers,currentMembers});
 demand(membership.admittedKeys.length===0&&membership.requiredKeys.length===13,
  '13 unchanged admitted predecessor members');
 const first=base.pages[0]!;
 demand(first.animationId===ID&&first.globalPageOrdinal===1&&first.sectionCode==='IR'&&
  first.sectionPageOrdinal===1&&first.previousPlacementId===null&&
  first.nextPlacementId==='shared-alg001-l07-p002'&&
  first.rendererAvailability.kind==='unavailable','first unregistered source placement');
 const pages=base.pages.map((page,index)=>index? page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-142',language:'fixed-en' as const,
    scenario:'source-introduction',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const})}));
 const updated=[ID,...selected];
 demand(isDeepStrictEqual(pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId),
  updated),'14 source-ordered registered renderers including candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p001-native-candidate-v1`,
  calibrationId:'g678-alg-l07-p001-native-candidate-v1',
  releaseId:`${base.releaseId}:p001-native-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p001-native-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(updated),registeredAnimationCount:14})});
}
