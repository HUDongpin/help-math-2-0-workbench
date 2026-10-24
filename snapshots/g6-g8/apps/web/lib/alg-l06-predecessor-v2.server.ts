import 'server-only';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {assertG678PredecessorMembership} from '../../../lib/g678-predecessor-membership-v1.mjs';
import {readJsonPin,readOrdinary,readPageProof,readPin,readRegistryTransaction,
 verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {ALG_L6_P001_FREEZE,ALG_L6_P001_ID,extendAlgL6P001Descriptor,
 readAlgL6P001Packet} from './g678-alg-l06-p001.server';
import {ALG_L6_P002_DECODER_FREEZE,ALG_L6_P002_ID,extendAlgL6Descriptor,
 readAlgL6P002Packet,readAlgL6P002DecoderSuccessor} from './g678-alg-l06-p002.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const PREFIX='shared-alg001-l06-';
const P003=`${PREFIX}p003`;
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const SNAPSHOT={path:'output/nms-l02-host-successor-20260927/predecessor/base-witness-v3/full-base-snapshot.json',
 bytes:4124297,sha256:'c14bbcf7529ec50a84f1d1f2fe7b8603285698b680f816eba720f44182ffa7f0'};
const HISTORICAL_REGISTRY={path:'output/nms-l02-host-successor-20260927/registry-predecessor/private-current-js-registry.json',
 bytes:607749,sha256:'1be56e4b5271d5365ba8cb7e5ee19e382df3c3f6f749552e0cec491339a7b61e'};
type Pin={path:string;bytes:number;sha256:string};
type Entry={key:string;module:string;maturity:string;artifacts:{module:Pin;timeline:Pin;
 [key:string]:Pin|string}};
type Calibration={calibrationId:string;deploymentScope:string;freezeManifest:string;
 freezeManifestBytes:number;freezeManifestSha256:string;entries:Entry[]};
type Member={key:string;registration:{calibrationId:string;deploymentScope:string;
 freezeManifest:Pin;entry:Entry};source:{path:string;bytes:number;sha256:string;
 assetId:string;sourceOccurrence:number;sourceXmlSha256:string}};
type Packet={calibrationId:string;source:Pin;sourceXml:Pin;entry:Entry;
 selectedPages:Array<{animationId:string;assetId:string;sourceSha256:string;
 sourceOccurrence:number}>;[key:string]:unknown};
type PageProofWitness={kind:'g678-validated-page-proof-witness-v1';validation:'readPageProof-v1';
 animationId:string;proofPin:Pin;hostPin:Pin;registration:Member['registration'];
 source:Member['source'];packet:Packet};
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`ALG_L06_PREDECESSOR_V2: ${reason}`);
}
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function registration(c:Calibration,e:Entry):Member['registration']{
 return {calibrationId:c.calibrationId,deploymentScope:c.deploymentScope,
  freezeManifest:{path:c.freezeManifest,bytes:c.freezeManifestBytes,
   sha256:c.freezeManifestSha256},entry:structuredClone(e)};
}
function uniqueRegistration(calibrations:Calibration[],key:string){
 const matching=calibrations.flatMap(c=>c.entries.filter(e=>e.key===key).map(e=>({c,e})));
 demand(matching.length===1,`unique registry entry: ${key}`);
 return matching[0];
}
function occurrenceSources(xml:string,snapshot:PageOnlyLessonPlayerDescriptor){
 const occurrences=[...xml.replace(/<!--[\s\S]*?-->/gu,'').matchAll(
  /<Section\b[^>]*\bSName="([A-Z]+)"[^>]*>([\s\S]*?)<\/Section>/gu)]
  .flatMap(section=>[...section[2].matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)]
   .map((page,index)=>({section:section[1],sectionOrdinal:index+1,path:page[1].trim()})));
 demand(occurrences.length===snapshot.pages.length&&snapshot.pages.length===60,
  '60 source XML occurrences');
 return occurrences.map((item,index)=>{
  const page=snapshot.pages[index],key=`${PREFIX}p${String(index+1).padStart(3,'0')}`;
  demand(/^[A-Z]+\/[A-Za-z0-9]+\.swf$/u.test(item.path),'bounded source path');
  const sourcePath=`G6-G8-shared/ALG001/L6/${item.path}`;
  const bytes=readOrdinary(SOURCE_ROOT,sourcePath),sha256=digest(bytes);
  demand(page.animationId===key&&page.placementId===key&&
   page.globalPageOrdinal===index+1&&page.sectionCode===item.section&&
   page.sectionPageOrdinal===item.sectionOrdinal&&
   page.source.sourceOccurrence===index+1&&page.source.assetId===`swf-${sha256}`&&
   page.previousPlacementId===(index?snapshot.pages[index-1].placementId:null)&&
   page.nextPlacementId===(index<snapshot.pages.length-1?snapshot.pages[index+1].placementId:null),
  `source-ordered placement: ${key}`);
  return {key,source:{path:sourcePath,bytes:bytes.length,sha256,
   assetId:`swf-${sha256}`,sourceOccurrence:index+1,
   sourceXmlSha256:XML.sha256}};
 });
}

/** Pure post-read check used also by fixture tests. Physical verification
 * happens before this call in algL6PredecessorV2(). */
export function assertAlgL6PredecessorFacts(requiredMembers:Member[],currentMembers:Member[],
 validatedAdmission:{kind:string;hostPin:Pin;pageProofPins:Pin[]},
 admittedProofWitnesses:PageProofWitness[]){
 const membership=assertG678PredecessorMembership({keyPrefix:PREFIX,requiredMembers,
  currentMembers,validatedAdmission,admittedProofWitnesses});
 demand(requiredMembers.some(member=>member.key===ALG_L6_P001_ID)&&
  requiredMembers.some(member=>member.key===ALG_L6_P002_ID),
  'P001/P002 retained as exact required predecessors');
 demand(membership.admittedKeys.includes(P003),'P003 has separate actual page proof');
 return membership;
}

/** Source-ordered 17-page snapshot plus reviewed P001/P002 projections.
 * P003 and later pages stay separate verified proof packets. This reader never
 * registers a candidate or changes a frozen descriptor/proof. */
export function algL6PredecessorV2(){
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
 const root=getWorkspaceRoot();
 const xml=readPin(SOURCE_ROOT,XML).toString('utf8');
 const snapshot=readJsonPin(root,SNAPSHOT) as
  {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
 const matches=snapshot.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===6);
 demand(snapshot.status==='ready'&&matches.length===1,'one preserved ALG L6 descriptor');
 let base=matches[0];
 demand(base.course.activePageCount===60&&base.course.courseShellCount===0&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,
  'preserved source lesson identity');
 const sources=occurrenceSources(xml,base),sourceByKey=new Map(sources.map(item=>[item.key,item.source]));
 const selected=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===17&&isDeepStrictEqual(selected,base.productBridge.selectedAnimationIds),
  'exact preserved 17-member source snapshot');
 const transaction=readRegistryTransaction(root);
 const currentCalibrations=transaction.registry.calibrations as Calibration[];
 const historical=readJsonPin(root,HISTORICAL_REGISTRY) as {calibrations:Calibration[]};
 const p001=readAlgL6P001Packet(root),p002=readAlgL6P002Packet(root),
  p002Decoder=readAlgL6P002DecoderSuccessor(root);
 const p001Calibration=uniqueRegistration(currentCalibrations,ALG_L6_P001_ID);
 const p002Calibration=uniqueRegistration(currentCalibrations,ALG_L6_P002_ID);
 demand(isDeepStrictEqual(registration(p001Calibration.c,p001Calibration.e).freezeManifest,
  ALG_L6_P001_FREEZE)&&isDeepStrictEqual(p001Calibration.e,p001.entry)&&
  isDeepStrictEqual(registration(p002Calibration.c,p002Calibration.e).freezeManifest,
  ALG_L6_P002_DECODER_FREEZE)&&isDeepStrictEqual(p002Calibration.e,p002Decoder.entry),
  'P001/P002 exact frozen successor registrations');
 for(const [packet,key] of [[p001,ALG_L6_P001_ID],[p002,ALG_L6_P002_ID]] as const){
  const source=sourceByKey.get(key);
  demand(source&&packet.source.sha256===source.sha256&&
   packet.source.bytes===source.bytes&&packet.sourceXml.sha256===XML.sha256,
   `P001/P002 physical source: ${key}`);
 }
 const requiredKeys=[...selected,ALG_L6_P001_ID,ALG_L6_P002_ID];
 demand(new Set(requiredKeys).size===requiredKeys.length,'unique required predecessor set');
 const historicalEntries=historical.calibrations.flatMap(c=>
  c.entries.filter(e=>selected.includes(e.key)).map(e=>({c,e})));
 demand(historicalEntries.length===selected.length,'preserved original registrations');
 const requiredMembers=requiredKeys.map(key=>{
  const source=sourceByKey.get(key);demand(source,`required source: ${key}`);
  const pair=selected.includes(key)?uniqueRegistration(historical.calibrations,key):
   key===ALG_L6_P001_ID?p001Calibration:p002Calibration;
  return {key,registration:registration(pair.c,pair.e),source:{...source}};
 });
 const currentPairs=currentCalibrations.flatMap(c=>
  c.entries.filter(e=>e.key.startsWith(PREFIX)).map(e=>({c,e})));
 const currentMembers=currentPairs.map(({c,e})=>{
  const source=sourceByKey.get(e.key);demand(source,`current source: ${e.key}`);
  readPin(root,{path:c.freezeManifest,bytes:c.freezeManifestBytes,
   sha256:c.freezeManifestSha256});
  for(const artifact of Object.values(e.artifacts))
   if(typeof artifact!=='string')readPin(root,artifact);
  const metadata=localOnlyAnimationModuleRegistration(e.key);
  demand(metadata?.calibrationId===c.calibrationId&&
   metadata.freezeManifestSha256===c.freezeManifestSha256&&
   metadata.moduleSha256===e.artifacts.module.sha256&&
   metadata.timelineSha256===e.artifacts.timeline.sha256,
   `current generated registry binding: ${e.key}`);
  return {key:e.key,registration:registration(c,e),source:{...source}};
 });
 const index=readJsonPin(root,G678_ADMISSION_INDEX) as
  {schemaVersion:number;kind:string;host:Pin;pages:{animationId:string;proof:Pin}[]};
 demand(index.schemaVersion===1&&index.kind==='g678-admission-index-v1'&&
  index.pages.length===new Set(index.pages.map(row=>row.animationId)).size,
  'active unique admission index');
 const host=verifyHostVersion(root,index.host);
 const extraKeys=new Set(currentMembers.map(member=>member.key).filter(key=>!requiredKeys.includes(key)));
 demand(extraKeys.has(P003),'actual P003 required proof');
 const witnesses:PageProofWitness[]=[];
 for(const key of [...extraKeys].sort()){
  const matched=index.pages.filter(page=>page.animationId===key);
  demand(matched.length===1,`exact indexed page proof: ${key}`);
  const packet=readPageProof(root,matched[0].proof,host,transaction) as Packet;
  const pair=uniqueRegistration(currentCalibrations,key);
  const source=sourceByKey.get(key);demand(source,`admitted source: ${key}`);
  witnesses.push({kind:'g678-validated-page-proof-witness-v1',
   validation:'readPageProof-v1',animationId:key,proofPin:matched[0].proof,
   hostPin:index.host,registration:registration(pair.c,pair.e),source:{...source},packet});
 }
 const validatedAdmission={kind:'g678-verified-admission-index-v1',
  hostPin:index.host,pageProofPins:index.pages.map(page=>page.proof)};
 const membership=assertAlgL6PredecessorFacts(requiredMembers,currentMembers,
  validatedAdmission,witnesses);
 base=extendAlgL6Descriptor(base,p002,p002Decoder,
  localOnlyAnimationModuleRegistration(ALG_L6_P002_ID));
 base=extendAlgL6P001Descriptor(base,p001,
  localOnlyAnimationModuleRegistration(ALG_L6_P001_ID));
 demand(base.productBridge.registeredAnimationCount===requiredMembers.length&&
  base.pages[2].rendererAvailability.kind==='unavailable'&&
  base.pages[2].source.assetId===sourceByKey.get(P003)?.assetId&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'validated P001/P002 base without P003 projection');
 return {base,admittedPageProofs:Object.freeze(witnesses.map(witness=>Object.freeze({
  animationId:witness.animationId,proofPin:witness.proofPin,packet:witness.packet,
  registration:witness.registration}))),membership,
  evidence:Object.freeze({requiredMembers,currentMembers,validatedAdmission,
   admittedProofWitnesses:witnesses})};
}
