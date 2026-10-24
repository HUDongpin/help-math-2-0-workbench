import 'server-only';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {assertG678PredecessorMembership} from '../../../lib/g678-predecessor-membership-v1.mjs';
import {readJsonPin,readOrdinary,readPin,readRegistryTransaction,verifyAdmission,verifyAdmissionAsync} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P001_SOURCE_ROOT as L8_SOURCE_ROOT,p001LocalDevelopment as l8LocalDevelopment} from './alg-l08-p001-preview-policy-v1';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

type Pin={path:string;bytes:number;sha256:string};
type Entry={key:string;module:string;maturity:string;artifacts:{module:Pin;timeline:Pin;[key:string]:Pin|string}};
type Calibration={calibrationId:string;deploymentScope:string;freezeManifest:string;
 freezeManifestBytes:number;freezeManifestSha256:string;entries:Entry[]};
const SNAPSHOT:Pin={path:'output/nms-l02-host-successor-20260927/predecessor/base-witness-v3/full-base-snapshot.json',
 bytes:4124297,sha256:'c14bbcf7529ec50a84f1d1f2fe7b8603285698b680f816eba720f44182ffa7f0'};
const HISTORICAL_REGISTRY:Pin={path:'output/nms-l02-host-successor-20260927/registry-predecessor/private-current-js-registry.json',
 bytes:607749,sha256:'1be56e4b5271d5365ba8cb7e5ee19e382df3c3f6f749552e0cec491339a7b61e'};
const XML:Pin={path:'G6-G8-shared/ALG001/L8/index.xml',bytes:10734,
 sha256:'185aaeaf3b56a812d66fe72671941350c8ceb5db48dc2824e74980a70ebe80c7'};
const PREFIX='shared-alg001-l08-';
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_CURRENT_DESCRIPTOR_INVALID: ${why}`);
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
export function algL08CurrentDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildL08CurrentDescriptor();
}
export async function algL08CurrentDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 demand(l8LocalDevelopment(),'exact local physical source scope');
 const admission=await verifyAdmissionAsync(getWorkspaceRoot(),G678_ADMISSION_INDEX);
 return buildL08CurrentDescriptor(admission);
}
function buildL08CurrentDescriptor(verifiedAdmission?:ReturnType<typeof verifyAdmission>):PageOnlyLessonPlayerDescriptor {
 demand(l8LocalDevelopment(),'exact local physical source scope');
 const root=getWorkspaceRoot(),saved=readJsonPin(root,SNAPSHOT) as
  {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
 const matches=saved.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===8);
 demand(saved.status==='ready'&&matches.length===1,'one preserved ALG001 L8 descriptor');
 const base=matches[0]!,xml=readPin(L8_SOURCE_ROOT,XML).toString('utf8');
 demand(base.course.activePageCount===50&&base.course.courseShellCount===0&&base.pages.length===50&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.productBridge.registeredAnimationCount===12,'preserved source lesson and 12 members');
 const occurrences=[...xml.replace(/<!--[\s\S]*?-->/gu,'').matchAll(
  /<Section\b[^>]*\bSName="([A-Z]+)"[^>]*>([\s\S]*?)<\/Section>/gu)]
  .flatMap(section=>[...section[2]!.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)]
   .map((page,index)=>({section:section[1]!,sectionOrdinal:index+1,path:page[1]!.trim()})));
 demand(occurrences.length===50,'all 50 XML occurrences');
 const sources=occurrences.map((item,index)=>{
  demand(/^[A-Z]+\/[A-Za-z0-9]+\.swf$/u.test(item.path),'bounded source path');
  const page=base.pages[index]!,key=`${PREFIX}p${String(index+1).padStart(3,'0')}`;
  const relative=`G6-G8-shared/ALG001/L8/${item.path}`,
   bytes=readOrdinary(L8_SOURCE_ROOT,relative),sha256=digest(bytes);
  demand(page.animationId===key&&page.placementId===key&&page.globalPageOrdinal===index+1&&
   page.sectionCode===item.section&&page.sectionPageOrdinal===item.sectionOrdinal&&
   page.source.sourceOccurrence===index+1&&page.source.assetId===`swf-${sha256}`&&
   page.previousPlacementId===(index?base.pages[index-1]!.placementId:null)&&
   page.nextPlacementId===(index<49?base.pages[index+1]!.placementId:null),
  `source-ordered placement ${key}`);
  return {key,source:{path:relative,bytes:bytes.length,sha256,assetId:`swf-${sha256}`,
   sourceOccurrence:index+1,sourceXmlSha256:XML.sha256}};
 });
 const selected=base.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===12&&isDeepStrictEqual(selected,base.productBridge.selectedAnimationIds),
  'preserved source-ordered 12');
 const historical=(readJsonPin(root,HISTORICAL_REGISTRY) as {calibrations:Calibration[]}).calibrations;
 const admission=verifiedAdmission??verifyAdmission(root,G678_ADMISSION_INDEX),transaction=readRegistryTransaction(root),current=transaction.registry.calibrations as Calibration[];
 demand(transaction.sha256===admission.registrySha256,'same verified admission registry transaction');
 const sourceByKey=new Map(sources.map(v=>[v.key,v.source]));
 const requiredMembers=selected.map(key=>{const pair=unique(historical,key),source=sourceByKey.get(key);
  demand(source,`historical source ${key}`);return {key,registration:normalized(pair.c,pair.e),source};});
 const currentPairs=current.flatMap(c=>c.entries.filter(e=>e.key.startsWith(PREFIX))
  .map(e=>({c,e})));

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
 const proofWitnesses=currentMembers.filter(member=>!selected.includes(member.key)).map(member=>{
  const row=admission.index.pages.find((p:{animationId:string})=>p.animationId===member.key);demand(row,'additional source page is admitted');
  const proof=readJsonPin(root,row.proof);demand(isDeepStrictEqual(proof.packet,admission.packets[member.key]),'physically verified added packet');
  return {kind:'g678-validated-page-proof-witness-v1',validation:'readPageProof-v1',proofPin:row.proof,hostPin:admission.index.host,animationId:member.key,registration:member.registration,source:member.source,packet:proof.packet};
 });
 const membership=assertG678PredecessorMembership({keyPrefix:PREFIX,requiredMembers,currentMembers,
  validatedAdmission:{kind:'g678-verified-admission-index-v1',hostPin:admission.index.host,pageProofPins:admission.index.pages.map((p:{proof:Pin})=>p.proof)},admittedProofWitnesses:proofWitnesses});
 demand(membership.requiredKeys.length===12,'12 original registration/source pins retained');
 const live=new Map(currentMembers.map(member=>[member.key,member]));
 const pages=base.pages.map(page=>{
  const actual=live.get(page.animationId);
  if(!actual)return page;
  if(selected.includes(page.animationId))return page;
  const runtime=admission.packets[page.animationId].selectedPages[0].runtime;
  demand(typeof runtime.frameDomain==='string'&&typeof runtime.scenario==='string'&&String(runtime.seed)==='0','bounded declared runtime query');
  return Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:page.animationId,
   runtimeQuery:Object.freeze({frameDomain:runtime.frameDomain,language:'fixed-en' as const,scenario:runtime.scenario,seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,productVisualBehaviorComposite:'not-established' as const})});
 });
 const glossary=[...base.glossary],p009Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l08-p009/native-v1/glossary-model-v1.json","bytes":6572,"sha256":"4fc2ce2b6c9fe6a35b906e71db11b99f35ce09b7350ecf4e9bf0f44ee0749f7e"});
 demand(glossary.length===26&&p009Glossary.animationId==='shared-alg001-l08-p009'&&
  isDeepStrictEqual(p009Glossary.entries.map((t:{id:string})=>t.id),['integers','slope','value']),
  'preserved26 terms and exact three P009 source bindings');
 for(const[lang,pin]of Object.entries(p009Glossary.dictionaries)as[string,Pin][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',
   {path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p009Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,
   definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P009 exact existing Slope');
  else{demand(['integers','value'].includes(term.id),'only exact Integers and Value additions');glossary.push(projected);}
 }
 demand(Number(glossary.length)===28&&new Set(glossary.map(t=>t.id)).size===28&&
  isDeepStrictEqual(glossary.slice(0,26),base.glossary),'all26 prior glossary entries preserved');
 const p011Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p011/native-v1/glossary-model-v1.json", "bytes": 12503, "sha256": "42667a0bbd5758233a77fe517542a77348bff6c6889573d3df0190b85b5910f5"});
 demand(p011Glossary.animationId==='shared-alg001-l08-p011'&&isDeepStrictEqual(p011Glossary.entries.map((t:{id:string})=>t.id),['line','measure','positive-number','slope','steep','uphill']),'six exact P011 dictionary bindings');
 for(const term of p011Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P011 exact existing dictionary term');
  else{demand(['positive-number','uphill'].includes(term.id),'only exact Positive number and Uphill additions');glossary.push(projected);}
 }
 demand(Number(glossary.length)===30&&new Set(glossary.map(t=>t.id)).size===30,'all28 prior glossary entries retained with two source-bound additions');
 const p012Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p012/native-v1/glossary-model-v1.json", "bytes": 7799, "sha256": "2b462e152a374dc8d850c2694081c671ae1addb8d6a6a281828fc1625201a53e"});
 demand(p012Glossary.animationId==='shared-alg001-l08-p012'&&isDeepStrictEqual(p012Glossary.entries.map((t:{id:string})=>t.id),['downhill','line','negative-number','slope']),'four exact P012 dictionary bindings');
 for(const term of p012Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P012 exact existing dictionary term');
  else{demand(['downhill','negative-number'].includes(term.id),'only exact Downhill and Negative number additions');glossary.push(projected);}
 }
 demand(Number(glossary.length)===32&&new Set(glossary.map(t=>t.id )).size===32,'all30 prior glossary entries retained with two source-bound additions');
 const p013Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p013/native-v1/glossary-model-v1.json", "bytes": 6352, "sha256": "bb98788796d97ab170c2dd20d5629dfdb9d5a4a3271aebdc210fd75c71f97ded"});
 demand(p013Glossary.animationId==='shared-alg001-l08-p013'&&isDeepStrictEqual(p013Glossary.entries.map((t:{id:string})=>t.id),['line','slope','y-intercept']),'three exact P013 dictionary bindings');
 for(const term of p013Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P013 exact existing dictionary term');
  else{demand(term.id==='y-intercept','only source-bound Y-intercept addition');glossary.push(projected);}
 }
 demand(Number(glossary.length)===33&&new Set(glossary.map(t=>t.id)).size===33,'all32 prior glossary entries retained with Y-intercept');
 const p014Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p014/native-v1/glossary-model-v1.json", "bytes": 10406, "sha256": "e647db48031615d028e5c6ef73b7929a2d6f2968ecc9942d1f3a82b182e9f3ca"});
 demand(p014Glossary.animationId==='shared-alg001-l08-p014'&&isDeepStrictEqual(p014Glossary.entries.map((t:{id:string})=>t.id),['intersect','line','point','y-coordinate','y-intercept']),'five exact P014 dictionary bindings');
 for(const term of p014Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P014 exact existing dictionary term');
  else{demand(['intersect','point','y-coordinate'].includes(term.id),'only three source-bound P014 additions');glossary.push(projected);}
 }
 demand(Number(glossary.length)===36&&new Set(glossary.map(t=>t.id)).size===36,'all33 prior glossary entries retained with three P014 terms');
 const p016Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p016/native-v1/glossary-model-v1.json", "bytes": 10884, "sha256": "0af0cd95e7ebe0c8efc46162c923fd1c5f7599bb9d967c681892997f5f6183a9"});
 demand(p016Glossary.animationId==='shared-alg001-l08-p016'&&isDeepStrictEqual(p016Glossary.entries.map((t:{id:string})=>t.id),['equation','line','slope','slope-intercept-form','y-intercept']),'five exact P016 dictionary bindings');
 for(const term of p016Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P016 exact existing dictionary term');
  else{demand(term.id==='slope-intercept-form','only source-bound Slope-intercept form addition');glossary.push(projected);}
 }
 demand(Number(glossary.length)===37&&new Set(glossary.map(t=>t.id)).size===37,'all36 prior glossary entries retained with P016 term');
 const p018Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p018/native-v1/glossary-model-v1.json", "bytes": 8380, "sha256": "6dc7f76fcc68482f6679526e3ece0166765300e2d040a4cbf980504994e63944"});
 demand(p018Glossary.animationId==='shared-alg001-l08-p018'&&isDeepStrictEqual(p018Glossary.entries.map((t:{id:string})=>t.id),['equation','graph','line','linear-equation']),'four exact P018 dictionary bindings');
 for(const term of p018Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P018 exact existing dictionary term');
 }
 demand(Number(glossary.length)===37&&new Set(glossary.map(t=>t.id)).size===37,'all37 prior glossary entries retained');
 const p019Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p019/native-v1/glossary-model-v1.json", "bytes": 8379, "sha256": "7b5fe35e0f03d2a556f0d17c0a8e5f2543f24767264c039a639219637d12e1bc"});
 demand(p019Glossary.animationId==='shared-alg001-l08-p019'&&isDeepStrictEqual(p019Glossary.entries.map((t:{id:string})=>t.id),['equation','graph','line','linear-equation']),'four exact P019 dictionary bindings');
 for(const term of p019Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P019 exact existing dictionary term');
 }
 demand(Number(glossary.length)===37&&new Set(glossary.map(t=>t.id)).size===37,'all37 prior glossary entries retained');
 const p020Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p020/native-v1/glossary-model-v1.json", "bytes": 4457, "sha256": "7d6fe82521c36563260212bf07a89aa487cf0881a5c32b34ba187cf6867003bc"});
 demand(p020Glossary.animationId==='shared-alg001-l08-p020'&&isDeepStrictEqual(p020Glossary.entries.map((t:{id:string})=>t.id),['equation','linear-equation']),'two exact P020 dictionary bindings');
 for(const term of p020Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P020 exact existing dictionary term');
 }
 demand(Number(glossary.length)===37&&new Set(glossary.map(t=>t.id)).size===37,'all37 prior glossary entries retained');
 const p021Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p021/native-v1/glossary-model-v1.json", "bytes": 8780, "sha256": "238dc476825c163b91bc049681067e3b242f1f1cc732742d527ed94d129f2133"}),beforeP021=[...glossary];
 demand(p021Glossary.animationId==='shared-alg001-l08-p021'&&isDeepStrictEqual(p021Glossary.entries.map((t:{id:string})=>t.id),['horizontal','length','slope','vertical']),'four exact P021 dictionary bindings');
 for(const term of p021Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P021 exact existing dictionary term');
  else{demand(term.id==='length','only exact Length addition');glossary.push(projected);}
 }
 demand(Number(glossary.length)===38&&new Set(glossary.map(t=>t.id)).size===38&&isDeepStrictEqual(glossary.slice(0,37),beforeP021),'all37 prior glossary entries retained');
 const p022Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p022/native-v1/glossary-model-v1.json", "bytes": 16985, "sha256": "90b7557c774a284199f6a556d6a8d799c1430b73ac3f19da5772de878b70eb3a"}),beforeP022=[...glossary];
 demand(p022Glossary.animationId==='shared-alg001-l08-p022'&&isDeepStrictEqual(p022Glossary.entries.map((t:{id:string})=>t.id),["coefficient", "equation", "linear-equation", "opposite", "side-of-an-equation", "slope", "slope-intercept-form", "term"]),'eight exact P022 dictionary bindings');
 for(const term of p022Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P022 exact existing dictionary term');
 }
 demand(Number(glossary.length)===38&&new Set(glossary.map(t=>t.id)).size===38&&isDeepStrictEqual(glossary,beforeP022),'all38 prior glossary entries retained');
 const p023Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p023/native-v1/glossary-model-v1.json", "bytes": 4636, "sha256": "56ae8a854e87f026001dab42d19d435391d2da7f25b0f63ba09cc478bbfd00e8"}),beforeP023=[...glossary];
 demand(p023Glossary.animationId==='shared-alg001-l08-p023'&&isDeepStrictEqual(p023Glossary.entries.map((t:{id:string})=>t.id),["linear-equation", "slope"]),'two exact P023 dictionary bindings');
 for(const term of p023Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P023 exact existing dictionary term');
 }
 demand(Number(glossary.length)===38&&new Set(glossary.map(t=>t.id)).size===38&&isDeepStrictEqual(glossary,beforeP023),'all38 prior glossary entries retained');
 const p024Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p024/native-v1/glossary-model-v1.json", "bytes": 11269, "sha256": "44e602f14503e8aa1e67e07581223ff667c385a6dcdfe52cd70b4146d0da469b"}),beforeP024=[...glossary];
 demand(p024Glossary.animationId==='shared-alg001-l08-p024'&&isDeepStrictEqual(p024Glossary.entries.map((t:{id:string})=>t.id),["graph", "intercept", "linear-equation", "y-axis", "y-coordinate", "y-intercept"]),'six exact P024 dictionary bindings');
 for(const term of p024Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P024 exact existing dictionary term');
  else glossary.push(Object.freeze(projected));
 }
 demand(Number(glossary.length)===40&&new Set(glossary.map(t=>t.id)).size===40&&isDeepStrictEqual(glossary.slice(0,38),beforeP024)&&isDeepStrictEqual(glossary.slice(38).map(t=>t.id),['intercept','y-axis']),'all38 prior glossary entries retained and two exact P024 additions');
 const p026Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p026/native-v1/glossary-model-v1.json", "bytes": 4420, "sha256": "7630d2aaf14bdac4cd67cc82d6a25122faf572c0f14017dc14be62c81a10e121"}),beforeP026=[...glossary];
 demand(p026Glossary.animationId==='shared-alg001-l08-p026'&&isDeepStrictEqual(p026Glossary.entries.map((t:{id:string})=>t.id),["linear-equation", "y-intercept"]),'two exact P026 existing dictionary bindings');
 for(const term of p026Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P026 exact existing dictionary term');
 }
 demand(Number(glossary.length)===40&&new Set(glossary.map(t=>t.id)).size===40&&isDeepStrictEqual(glossary,beforeP026),'all40 prior glossary entries retained; no P026 addition');
 const p027Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p027/native-v1/glossary-model-v1.json", "bytes": 6053, "sha256": "7d22fce8a3b7e7ef9f3a455882cabfdb111b19e2b63453557acb3745d107db41"}),beforeP027=[...glossary];
 demand(p027Glossary.animationId==='shared-alg001-l08-p027'&&isDeepStrictEqual(p027Glossary.entries.map((t:{id:string})=>t.id),["graph", "linear-equation", "calculate", "point"]),'four exact P027 source dictionary bindings');
 for(const term of p027Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P027 exact existing dictionary term');
  else{demand(term.id==='calculate','only exact Calculate addition');glossary.push(Object.freeze(projected));}
 }
 demand(Number(glossary.length)===41&&new Set(glossary.map(t=>t.id)).size===41&&isDeepStrictEqual(glossary.slice(0,40),beforeP027)&&glossary[40]?.id==='calculate','all40 prior glossary entries retained and only exact Calculate addition');
 const p028Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p028/native-v1/glossary-model-v1.json", "bytes": 6161, "sha256": "81909812cb6a3dec93e5cb930771d8f359992cd72beb5abccaa3096b9be68d33"}),beforeP028=[...glossary];
 demand(p028Glossary.animationId==='shared-alg001-l08-p028'&&isDeepStrictEqual(p028Glossary.entries.map((t:{id:string})=>t.id),["graph", "linear-equation", "slope", "y-intercept"]),'four exact P028 source dictionary bindings');
 for(const term of p028Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(Boolean(prior)&&isDeepStrictEqual(prior,projected),'P028 exact existing dictionary term');
 }
 demand(Number(glossary.length)===41&&isDeepStrictEqual(glossary,beforeP028),'all 41 prior dictionary entries retained; P028 adds no term');
 const p029Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p029/native-v1/glossary-model-v1.json", "bytes": 5871, "sha256": "6c67cc904d9c3f73c4f35fe40d1d6691553c1e03cc5ef19adcad910fa2feaf14"}),beforeP029=[...glossary];
 demand(p029Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p029Glossary.entries.map((t:{id:string})=>t.id),['distance','graph','line','slope','variable']),'five exact P029 source dictionary bindings');
 for(const term of p029Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P029 exact existing dictionary term');
  else{demand(['distance','variable'].includes(term.id),'only exact Distance and Variable additions');glossary.push(Object.freeze(projected));}
 }
 demand(Number(glossary.length)===43&&new Set(glossary.map(t=>t.id)).size===43&&isDeepStrictEqual(glossary.slice(0,41),beforeP029)&&isDeepStrictEqual(glossary.slice(41).map(t=>t.id),['distance','variable']),'all 41 prior dictionary entries retained and exact Distance and Variable additions');
 const p030Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p030/native-v1/glossary-model-v1.json", "bytes": 5465, "sha256": "924c5bed29fd92260e5e842f9f2d7d9e1e095471f3e45ec141fef1787a5a5880"}),beforeP030=[...glossary];
 demand(p030Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p030Glossary.entries.map((t:{id:string})=>t.id),['bend','equation','graph','line','linear-equation']),'five exact P030 source dictionary bindings');
 for(const term of p030Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P030 exact existing dictionary term');
  else{demand(term.id==='bend','only exact Bend addition');glossary.push(Object.freeze(projected));}
 }
 demand(Number(glossary.length)===44&&new Set(glossary.map(t=>t.id)).size===44&&isDeepStrictEqual(glossary.slice(0,43),beforeP030)&&isDeepStrictEqual(glossary.slice(43).map(t=>t.id),['bend']),'all 43 prior dictionary entries retained and exact Bend addition');
 const p031Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p031/native-v1/glossary-model-v1.json", "bytes": 10161, "sha256": "399053b5497bbbe4e88410493479f9bfa021dd15291bdcdcf6208ed083f5f3f7"}),beforeP031=[...glossary];
 demand(p031Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p031Glossary.entries.map((t:{id:string})=>t.id),["constant", "denominator", "division", "equation", "exponent", "fraction", "linear-equation", "term", "variable"]),'nine exact P031 source dictionary bindings');
 for(const term of p031Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P031 exact existing dictionary term');
  else{demand(["constant", "denominator", "division", "exponent", "fraction"].includes(term.id),'only exact P031 dictionary additions');glossary.push(Object.freeze(projected));}
 }
 demand(Number(glossary.length)===49&&new Set(glossary.map(t=>t.id)).size===49&&isDeepStrictEqual(glossary.slice(0,44),beforeP031)&&isDeepStrictEqual(glossary.slice(44).map(t=>t.id),["constant", "denominator", "division", "exponent", "fraction"]),'all 44 prior dictionary entries retained and exact five P031 additions');
 const p032Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p032/native-v1/glossary-model-v1.json", "bytes": 20785, "sha256": "67c7e3ec82c735f6f6b1e48d3c88f116130fd63224e0e19e40e834589ce11ee6"}),beforeP032=[...glossary];
 demand(p032Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p032Glossary.entries.map((t:{id:string})=>t.id),["change", "coordinates", "fraction", "graph", "horizontal", "length", "line", "line-segment", "linear-equation", "negative-sign", "point", "right-triangle", "simplify", "slope", "vertical"]),'fifteen exact P032 source dictionary bindings');
 for(const term of p032Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P032 exact existing dictionary term');
  else{demand(["change", "coordinates", "line-segment", "negative-sign", "right-triangle", "simplify"].includes(term.id),'only exact P032 dictionary additions');glossary.push(Object.freeze(projected));}
 }
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary.slice(0,49),beforeP032)&&isDeepStrictEqual(glossary.slice(49).map(t=>t.id),["change", "coordinates", "line-segment", "negative-sign", "right-triangle", "simplify"]),'all 49 prior dictionary entries retained and exact six P032 additions');
 const p033Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p033/native-v1/glossary-model-v1.json", "bytes": 7012, "sha256": "20ff055a8256bd715dfb7bf41e7235a5b1c4f49fb79018412410343b4f941939"}),beforeP033=[...glossary];
 demand(p033Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p033Glossary.entries.map((t:{id:string})=>t.id),["coefficient", "constant", "equation", "linear-equation", "slope", "term"]),'six exact P033 source dictionary bindings');
 for(const term of p033Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P033 exact existing dictionary term');
 }
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary,beforeP033),'all55 prior dictionary entries retained; P033 has no additions');
 const p034Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p034/native-v1/glossary-model-v1.json", "bytes": 8316, "sha256": "9ba4b4d2575e84a7180a7b564ee688160a096e4022f34e3afd8df497e0b831a4"}),beforeP034=[...glossary];
 demand(p034Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p034Glossary.entries.map((t:{id:string})=>t.id),["coefficient", "constant", "equation", "linear-equation", "slope", "slope-intercept-form", "term"]),'seven exact P034 source dictionary bindings');
 for(const term of p034Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P034 exact existing dictionary term');
 }
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary,beforeP034),'all55 prior dictionary entries retained; P034 has no additions');
 const p035Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p035/native-v1/glossary-model-v1.json", "bytes": 7754, "sha256": "ecfa0a09ef87bb1a7ddeae22123a94edf3fc416ef1e3e27678cfc2f8e808e358"}),beforeP035=[...glossary];
 demand(p035Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p035Glossary.entries.map((t:{id:string})=>t.id),["graph", "line", "linear-equation", "point", "y-axis", "y-coordinate", "y-intercept"]),'seven exact P035 source dictionary bindings');
 for(const term of p035Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P035 exact existing dictionary term');
 }
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary,beforeP035),'all55 prior dictionary entries retained; P035 has no additions');
 const p036Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p036/native-v1/glossary-model-v1.json", "bytes": 8162, "sha256": "4571591c689d7bb64e52106b54acc89fc18700a13aa8dbc7f684d0f7dd186e6f"}),beforeP036=[...glossary];
 demand(p036Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p036Glossary.entries.map((t:{id:string})=>t.id),["constant", "equation", "linear-equation", "side-of-an-equation", "slope-intercept-form", "term", "y-intercept"]),'seven exact P036 source dictionary bindings');
 for(const term of p036Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P036 exact existing dictionary term');
 }
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary,beforeP036),'all55 prior dictionary entries retained; P036 has no additions');
 const p037Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p037/native-v1/glossary-model-v1.json", "bytes": 7029, "sha256": "b7567a60f58c42ac45b5eef5395a391e420f26903c3a8b9e877f59dbf301bfa5"}),beforeP037=[...glossary];
 demand(p037Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p037Glossary.entries.map((t:{id:string})=>t.id),["constant", "equation", "linear-equation", "slope-intercept-form", "term", "y-intercept"]),'six exact P037 source dictionary bindings');
 for(const term of p037Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P037 exact existing dictionary term');
 }
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary,beforeP037),'all55 prior dictionary entries retained; P037 has no additions');
 const p038Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p038/native-integration-v1/glossary-model-v1.json", "bytes": 18868, "sha256": "16e4d098a4039d16799b78ca80d1973c1381f4806cb0d6dc924412784d3ec31a"}),beforeP038=[...glossary];
 demand(p038Glossary.animationId==='shared-alg001-l08-p038'&&p038Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p038Glossary.entries.map((t:{id:string})=>t.id),["coefficient", "constant", "coordinates", "denominator", "equation", "graph", "linear-equation", "numerator", "point", "slope", "slope-intercept-form", "term", "y-axis", "y-intercept"]),'exact P038 source dictionary bindings');
 for(const term of p038Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P038 exact existing dictionary term');else{demand(["numerator"].includes(term.id),'only reviewed P038 additions');glossary.push(Object.freeze(projected));}}
 demand(Number(glossary.length)===56&&new Set(glossary.map(t=>t.id)).size===56&&isDeepStrictEqual(glossary.slice(0,beforeP038.length),beforeP038),'P038 prior dictionary entries preserved');
 const p039Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p039/native-integration-v1/glossary-model-v1.json", "bytes": 14882, "sha256": "37d290ac3af67aa4929f5b236022565b2ed4d0c85a4d196addfa6848ba204a68"}),beforeP039=[...glossary];
 demand(p039Glossary.animationId==='shared-alg001-l08-p039'&&p039Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p039Glossary.entries.map((t:{id:string})=>t.id),["axis", "calculate", "coordinate", "graph", "horizontal", "line", "point", "right-triangle", "slope", "triangle", "vertical"]),'exact P039 source dictionary bindings');
 for(const term of p039Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P039 exact existing dictionary term');else{demand(["axis", "coordinate", "triangle"].includes(term.id),'only reviewed P039 additions');glossary.push(Object.freeze(projected));}}
 demand(Number(glossary.length)===59&&new Set(glossary.map(t=>t.id)).size===59&&isDeepStrictEqual(glossary.slice(0,beforeP039.length),beforeP039),'P039 prior dictionary entries preserved');
 const p046Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p046/native-integration-v1/glossary-model-v1.json", "bytes": 16447, "sha256": "1e7f9fdc3f15ac7f35e6540733a712cd506cc1aafe1087fa483aa4d6918a24fb"}),beforeP046=[...glossary];
 demand(p046Glossary.animationId==='shared-alg001-l08-p046'&&p046Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p046Glossary.entries.map((t:{id:string})=>t.id),["calculate", "constant", "equation", "graph", "linear-equation", "locate", "point", "slope-intercept-form", "term", "y-axis", "y-coordinate", "y-intercept"]),'exact P046 source dictionary bindings');
 for(const term of p046Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P046 exact existing dictionary term');else{demand(["locate"].includes(term.id),'only reviewed P046 additions');glossary.push(Object.freeze(projected));}}
 demand(Number(glossary.length)===60&&new Set(glossary.map(t=>t.id)).size===60&&isDeepStrictEqual(glossary.slice(0,beforeP046.length),beforeP046),'P046 prior dictionary entries preserved');
 const p047Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p047/native-integration-v1/glossary-model-v1.json", "bytes": 17525, "sha256": "7df44b2a63d05294fa15c79c80e8315dd9fcc98401ee94fbdf36cc165fb3e51a"}),beforeP047=[...glossary];
 demand(p047Glossary.animationId==='shared-alg001-l08-p047'&&p047Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p047Glossary.entries.map((t:{id:string})=>t.id),["slope", "linear-equation", "line", "graph", "equation", "right-triangle", "point", "vertical", "horizontal", "downhill", "slope-intercept-form", "coefficient", "calculate"]),'exact P047 source dictionary bindings');
 for(const term of p047Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P047 exact existing dictionary term');else{demand(false,'only reviewed P047 additions');glossary.push(Object.freeze(projected));}}
 demand(Number(glossary.length)===60&&new Set(glossary.map(t=>t.id)).size===60&&isDeepStrictEqual(glossary.slice(0,beforeP047.length),beforeP047),'P047 prior dictionary entries preserved');
 const p048Glossary=readJsonPin(root,{"path": "migrations/shared-alg001-l08-p048/native-integration-v1/glossary-model-v1.json", "bytes": 15382, "sha256": "7e6adde39531a63833298ee15f54ab5d7c8c0b89c2ebda866ef551acd5e42c00"}),beforeP048=[...glossary];
 demand(p048Glossary.animationId==='shared-alg001-l08-p048'&&p048Glossary.sourceEntriesVerified===true&&isDeepStrictEqual(p048Glossary.entries.map((t:{id:string})=>t.id),["calculate", "coefficient", "constant", "equation", "horizontal", "length", "linear-equation", "slope", "slope-intercept-form", "term", "vertical"]),'exact P048 source dictionary bindings');
 for(const term of p048Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P048 exact existing dictionary term');else{demand(false,'only reviewed P048 additions');glossary.push(Object.freeze(projected));}}
 demand(Number(glossary.length)===60&&new Set(glossary.map(t=>t.id)).size===60&&isDeepStrictEqual(glossary.slice(0,beforeP048.length),beforeP048),'P048 prior dictionary entries preserved');
 const updated=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:current-l8-source-native-v1`,
  calibrationId:'g678-alg-l08-current-source-native-v1',releaseId:`${base.releaseId}:current-l8-source-native-v1`,
  course:Object.freeze({...base.course,href:'/migration-status/g678-calibration/shared-alg001-l08-p001/registered-v1'}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:current-l8-native-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(updated),registeredAnimationCount:updated.length})});
}
export function algL08CurrentRegisteredSharedCount(){const tx=readRegistryTransaction(getWorkspaceRoot());return tx.registry.calibrations.flatMap((c:Calibration)=>c.entries).filter((e:Entry)=>/^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/.test(e.key)).length;}
