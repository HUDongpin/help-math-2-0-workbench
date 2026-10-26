import 'server-only';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readOrdinary,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {extendAlgL10PairDescriptor,ALG_L10_PAIR_IDS,readAlgL10PairPacket,ALG_L10_PAIR_FREEZE} from './g678-alg-l10-pair.server';
import {getWorkspaceRoot} from './catalog';
import {P004_SOURCE_ROOT,p004LocalDevelopment} from './alg-l10-p004-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
type Pin={path:string;bytes:number;sha256:string};
type Entry={key:string;module:string;maturity:string;artifacts:Record<string,Pin|string>};
type Calibration={calibrationId:string;deploymentScope:string;freezeManifest:string;freezeManifestBytes:number;freezeManifestSha256:string;entries:Entry[]};
const SNAPSHOT={"path": "output/nms-l02-host-successor-20260927/predecessor/base-witness-v3/full-base-snapshot.json", "bytes": 4124297, "sha256": "c14bbcf7529ec50a84f1d1f2fe7b8603285698b680f816eba720f44182ffa7f0"};
const RETAINED={"path":"migrations/shared-alg001-l10-p004/audit-v1/retained-members-v2.json","bytes":15408,"sha256":"644b0cf92cd67aa72caacb05ec9b01fa0761325364340618b9136c6320e36026"};
const PAIR={"path":"catalog/product-bridge-calibrations/g678-alg-l10-p005-p006-native-decoder-v2.json","bytes":78244,"sha256":"a23c8e318e4dc9ca05479b6559fd389887e1f764caaeae761d6dc9238d25b6af"};
const XML={path:'G6-G8-shared/ALG001/L10/index.xml',bytes:12047,sha256:'da83556a26ef2f33b37dcdc7972c5646e89723ac0819666baf6ed58ba9b955dc'};
function demand(ok:unknown,why:string):asserts ok{if(!ok)throw Error(`ALG_L10_P004_RETAINED_INVALID: ${why}`);}
const normalized=(c:Calibration,e:Entry)=>({calibrationId:c.calibrationId,deploymentScope:c.deploymentScope,freezeManifest:{path:c.freezeManifest,bytes:c.freezeManifestBytes,sha256:c.freezeManifestSha256},entry:e});
/** Source-order view of the exact eleven retained registrations.
 * Rechecks successor inputs and preserves historical source-generation exclusions. */
export function retainedL10Descriptor():PageOnlyLessonPlayerDescriptor{
 demand(p004LocalDevelopment(),'physical local development scope');
 const root=getWorkspaceRoot(),saved=readJsonPin(root,SNAPSHOT) as {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
 const matches=saved.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===10);
 demand(saved.status==='ready'&&matches.length===1,'one saved source-order witness');
 const base=matches[0]!,xml=readPin(P004_SOURCE_ROOT,XML).toString('utf8');
 demand(base.pages.length===52&&base.course.activePageCount===52&&base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===9&&base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256,'52 pages and 9 historical members');
 const occurrences=[...xml.replace(/<!--[\s\S]*?-->/gu,'').matchAll(/<Section\b[^>]*\bSName="([A-Z]+)"[^>]*>([\s\S]*?)<\/Section>/gu)].flatMap(s=>[...s[2]!.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)].map((p,i)=>({section:s[1]!,ordinal:i+1,path:p[1]!.trim()})));
 demand(occurrences.length===52,'52 XML occurrences');
 occurrences.forEach((source,i)=>{
  demand(/^[A-Z]+\/[A-Za-z0-9]+\.swf$/u.test(source.path),'bounded source path');
  const page=base.pages[i]!,key=`shared-alg001-l10-p${String(i+1).padStart(3,'0')}`,
   bytes=readOrdinary(P004_SOURCE_ROOT,`G6-G8-shared/ALG001/L10/${source.path}`),sha=createHash('sha256').update(bytes).digest('hex');
  demand(page.animationId===key&&page.placementId===key&&page.globalPageOrdinal===i+1&&page.sectionCode===source.section&&page.sectionPageOrdinal===source.ordinal&&page.source.sourceOccurrence===i+1&&page.source.assetId===`swf-${sha}`&&page.previousPlacementId===(i?base.pages[i-1]!.placementId:null)&&page.nextPlacementId===(i<51?base.pages[i+1]!.placementId:null),`source occurrence ${key}`);
 });
 const retained=readJsonPin(root,RETAINED) as {kind:string;members:Array<ReturnType<typeof normalized>>},tx=readRegistryTransaction(root);
 demand(retained.kind==='g678-alg-l10-retained-current-bindings-v2'&&retained.members.length===11,'eleven frozen current binding expectations');
 const current=(tx.registry.calibrations as Calibration[]).flatMap(c=>c.entries.filter(e=>e.key.startsWith('shared-alg001-l10-')&&e.key!=='shared-alg001-l10-p004').map(e=>normalized(c,e))).sort((a,b)=>a.entry.key.localeCompare(b.entry.key));
 demand(isDeepStrictEqual(current,retained.members),'exact current eleven; additions need reviewed successor');
 for(const row of current){
  demand(row.deploymentScope==='local-only'&&row.entry.maturity==='private-current-js','private existing member');
  readPin(root,row.freezeManifest);
  for(const pin of Object.values(row.entry.artifacts))if(typeof pin!=='string')readPin(root,pin);
  const meta=localOnlyAnimationModuleRegistration(row.entry.key),modulePin=row.entry.artifacts.module as Pin,timelinePin=row.entry.artifacts.timeline as Pin,runtimePin=row.entry.artifacts.runtime as Pin;
  demand(meta?.calibrationId===row.calibrationId&&meta.freezeManifestSha256===row.freezeManifest.sha256&&meta.moduleSha256===modulePin.sha256&&meta.timelineSha256===timelinePin.sha256&&meta.runtimeSha256===runtimePin.sha256,'generated dispatch and exact physical artifacts');
 }
 demand(isDeepStrictEqual(PAIR,ALG_L10_PAIR_FREEZE),'same decoder successor freeze binding');
 const packet=readAlgL10PairPacket(root);
 demand(packet.deploymentScope==='local-only'&&packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false&&Object.values(packet.acceptanceEffects).every(v=>v===false),'pair acceptance remains unestablished');
 for(const member of packet.members)readPin(P004_SOURCE_ROOT,member.source);
 const result=extendAlgL10PairDescriptor(base,packet,ALG_L10_PAIR_IDS.map(id=>localOnlyAnimationModuleRegistration(id)));
 demand(result.productBridge.registeredAnimationCount===11&&isDeepStrictEqual([...result.productBridge.selectedAnimationIds].sort(),current.map(r=>r.entry.key)),'exact 11 retained source-order pages');
 return result;
}
export function algL10CurrentRegisteredSharedCount():number{
 demand(p004LocalDevelopment(),'local registration count scope');
 return readRegistryTransaction(getWorkspaceRoot()).registry.calibrations.flatMap((c:Calibration)=>c.entries).filter((e:Entry)=>e.key.startsWith('shared-')).length;
}

/** Source-ordered candidate availability, separate from actual registration. */
export function algL10P004CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p004LocalDevelopment(),'P004 candidate scope');
 const base=retainedL10Descriptor(),page=base.pages[3],ID='shared-alg001-l10-p004';
 demand(!localOnlyAnimationModuleRegistration(ID),'candidate requires P004 absent from verified current registry');
 demand(base.pages.length===52&&base.course.activePageCount===52&&base.course.courseShellCount===0&&
  base.productBridge.registeredAnimationCount===11&&page?.animationId===ID&&page.placementId===ID&&
  page.globalPageOrdinal===4&&page.sectionCode==='RW'&&page.sectionPageOrdinal===3&&
  page.source.sourceOccurrence===4&&page.rendererAvailability.kind==='unavailable'&&
  page.source.assetId==='swf-5ac9be9459e12bdc6552d53a66b67ceb645633d2fe57522639a043d28180f5b2',
  'exact P004 source occurrence and unregistered state');
 const pages=Object.freeze(base.pages.map(p=>p.animationId!==ID?p:Object.freeze({...p,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-60',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const})})));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===12&&new Set(selected).size===12,'eleven retained plus one candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p004-candidate-v1`,
  calibrationId:'g678-alg-l10-p004-source-candidate-v1',releaseId:`${base.releaseId}:p004-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p004-candidate-v1`}),
  pages,productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
