import 'server-only';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {assertG678PredecessorMembership} from '../../../lib/g678-predecessor-membership-v1.mjs';
import {readJsonPin,readOrdinary,readPin,readRegistryTransaction,verifyAdmission} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P003_ID as ID,P003_SOURCE_ROOT as L7_SOURCE_ROOT,p003LocalDevelopment as l7LocalDevelopment} from './alg-l07-p003-preview-policy-v1';
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
const XML:Pin={path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,
 sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'};
const PREFIX='shared-alg001-l07-';
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L07_CURRENT_DESCRIPTOR_INVALID: ${why}`);
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
export function algL07CurrentDescriptor(candidateP003=false):PageOnlyLessonPlayerDescriptor {
 demand(l7LocalDevelopment(),'exact local physical source scope');
 const root=getWorkspaceRoot(),saved=readJsonPin(root,SNAPSHOT) as
  {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
 const matches=saved.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===7);
 demand(saved.status==='ready'&&matches.length===1,'one preserved ALG001 L7 descriptor');
 const base=matches[0]!,xml=readPin(L7_SOURCE_ROOT,XML).toString('utf8');
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
   bytes=readOrdinary(L7_SOURCE_ROOT,relative),sha256=digest(bytes);
  demand(page.animationId===key&&page.placementId===key&&page.globalPageOrdinal===index+1&&
   page.sectionCode===item.section&&page.sectionPageOrdinal===item.sectionOrdinal&&
   page.source.sourceOccurrence===index+1&&page.source.assetId===`swf-${sha256}`&&
   page.previousPlacementId===(index?base.pages[index-1]!.placementId:null)&&
   page.nextPlacementId===(index<61?base.pages[index+1]!.placementId:null),
  `source-ordered placement ${key}`);
  return {key,source:{path:relative,bytes:bytes.length,sha256,assetId:`swf-${sha256}`,
   sourceOccurrence:index+1,sourceXmlSha256:XML.sha256}};
 });
 const selected=base.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===13&&isDeepStrictEqual(selected,base.productBridge.selectedAnimationIds),
  'preserved source-ordered 13');
 const historical=(readJsonPin(root,HISTORICAL_REGISTRY) as {calibrations:Calibration[]}).calibrations;
 const admission=verifyAdmission(root,G678_ADMISSION_INDEX),transaction=readRegistryTransaction(root),current=transaction.registry.calibrations as Calibration[];
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
 demand(membership.requiredKeys.length===13,'13 original registration/source pins retained');
 const live=new Map(currentMembers.map(member=>[member.key,member]));
 const pages=base.pages.map(page=>{
  const actual=live.get(page.animationId),provisional=candidateP003&&page.animationId===ID&&!actual;
  if(!actual&&!provisional)return page;
  if(selected.includes(page.animationId))return page;
  const runtime=actual?admission.packets[page.animationId].selectedPages[0].runtime:{frameDomain:'sprite-401',scenario:'source-real-world',seed:'0'};
  demand(typeof runtime.frameDomain==='string'&&typeof runtime.scenario==='string'&&String(runtime.seed)==='0','bounded declared runtime query');
  return Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:page.animationId,
   runtimeQuery:Object.freeze({frameDomain:runtime.frameDomain,language:'fixed-en' as const,scenario:runtime.scenario,seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,productVisualBehaviorComposite:'not-established' as const})});
 });
 const updated=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 const glossaryModel=readJsonPin(root,{path:'migrations/shared-alg001-l07-p003/native-v1/glossary-model-v1.json',bytes:5723,sha256:'5ef56b7b063c349e32dbc9027f631f77fc79c670666f4d16bbd9daa9f6f56d3f'});
 for(const[lang,pin]of Object.entries(glossaryModel.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 const glossary=[...base.glossary];demand(glossary.length===16,'preserved sixteen source terms');
 for(const term of glossaryModel.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source};const prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'exact existing Function dictionary entry');else{demand(['relation','value'].includes(term.id),'only Relation and Value source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===18&&new Set(glossary.map(e=>e.id)).size===18&&isDeepStrictEqual(glossary.slice(0,16),base.glossary),'preserved sixteen plus exact two terms');
 const preservedGlossary=glossary.slice();
 const p006Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p006/native-v1/glossary-model-v1.json","bytes":3966,"sha256":"15400d874e9045fb2b066cf85cfc77128d91fa10a03d0a5c3d6a698e7f0a5706"});
 demand(p006Glossary.animationId==='shared-alg001-l07-p006'&&
  isDeepStrictEqual(p006Glossary.entries.map((term:{id:string})=>term.id),
   ['linear-function','nonlinear-function']),'two exact P006 source terms');
 for(const[lang,pin]of Object.entries(p006Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',
   {path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p006Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,
   definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(term.id==='linear-function'&&isDeepStrictEqual(prior,projected),
   'exact preserved Linear function dictionary entry');
  else{demand(term.id==='nonlinear-function','only Nonlinear function source addition');glossary.push(projected);}
 }
 demand(Number(glossary.length)===19&&new Set(glossary.map(e=>e.id)).size===19&&
  isDeepStrictEqual(glossary.slice(0,18),preservedGlossary),'preserved eighteen plus exact Nonlinear function');
 const beforeP009Glossary=glossary.slice();
 const p009Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p009/native-v1/glossary-model-v1.json","bytes":10286,"sha256":"0c5747b7fce78abf14334aa8ae987f0c3257b89659352d86d3e4687d8ac64173"});
 demand(p009Glossary.animationId==='shared-alg001-l07-p009'&&isDeepStrictEqual(
  p009Glossary.entries.map((term:{id:string})=>term.id),['input','output','slope','value','y-intercept']),
  'five exact P009 source glossary bindings');
 for(const[lang,pin]of Object.entries(p009Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',
   {path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p009Glossary.entries){
  const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,
   definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(term.id==='value'&&isDeepStrictEqual(prior,projected),'preserved exact Value definition');
  else{demand(['input','output','slope','y-intercept'].includes(term.id),'only four exact P009 source additions');glossary.push(projected);}
 }
 demand(Number(glossary.length)===23&&new Set(glossary.map(e=>e.id)).size===23&&
  isDeepStrictEqual(glossary.slice(0,19),beforeP009Glossary),'preserved nineteen plus four P009 source entries');
 const beforeP010Glossary=glossary.slice(),p010Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p010/native-v1/glossary-model-v1.json","bytes":18641,"sha256":"466ac8e89662e0355876e61614b654908977e76e10ca64d676a3114ddfa41ec7"});
 demand(p010Glossary.animationId==='shared-alg001-l07-p010'&&isDeepStrictEqual(p010Glossary.entries.map((t:{id:string})=>t.id),['horizontal','line','measure','ratio','rise','run','slope','steep','vertical']),'nine exact P010 source glossary entries');
 for(const[lang,pin]of Object.entries(p010Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p010Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['line','slope'].includes(term.id)&&isDeepStrictEqual(prior,projected),'preserved exact Line/Slope entries');
  else{demand(['horizontal','measure','ratio','rise','run','steep','vertical'].includes(term.id),'seven exact source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===30&&new Set(glossary.map(t=>t.id)).size===30&&isDeepStrictEqual(glossary.slice(0,23),beforeP010Glossary),'all23 prior entries preserved plus seven P010 terms');
 const beforeP011Glossary=glossary.slice(),p011Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p011/native-v1/glossary-model-v1.json","bytes":8889,"sha256":"db4a88a4929293aaa7383ce6ca62de964104acd750da130830d6a17765c7195c"});
 demand(p011Glossary.animationId==='shared-alg001-l07-p011'&&isDeepStrictEqual(p011Glossary.entries.map((t:{id:string})=>t.id),['equation','integers','slope','value']),'four exact P011 source glossary entries');
 for(const[lang,pin]of Object.entries(p011Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p011Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['equation','slope','value'].includes(term.id)&&isDeepStrictEqual(prior,projected),'preserved exact Equation/Slope/Value entries');
  else{demand(term.id==='integers','one exact source addition');glossary.push(projected);}}
 demand(Number(glossary.length)===31&&new Set(glossary.map(t=>t.id)).size===31&&isDeepStrictEqual(glossary.slice(0,30),beforeP011Glossary),'all30 prior entries preserved plus Integers');
 const beforeP013Glossary=glossary.slice(),p013Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p013/native-v1/glossary-model-v1.json","bytes":8369,"sha256":"ac909e07fb07820fae6a1d19bad5ac7cb68f791b439de793b89d306ec46d36fe"});
 demand(p013Glossary.animationId==='shared-alg001-l07-p013'&&isDeepStrictEqual(p013Glossary.entries.map((t:{id:string})=>t.id),['line','positive-number','slope','uphill']),'four exact P013 source glossary entries');
 for(const[lang,pin]of Object.entries(p013Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p013Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['line','slope'].includes(term.id)&&isDeepStrictEqual(prior,projected),'preserved exact Line/Slope entries');
  else{demand(['positive-number','uphill'].includes(term.id),'two exact source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===33&&new Set(glossary.map(t=>t.id)).size===33&&isDeepStrictEqual(glossary.slice(0,31),beforeP013Glossary),'all31 prior entries preserved plus Positive number and Uphill');
 const beforeP014Glossary=glossary.slice(),p014Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p014/native-v1/glossary-model-v1.json","bytes":10263,"sha256":"9b08b6d60afea41f147c5282da015cb57af921179055877c3e67a54a68268c1a"});
 demand(p014Glossary.animationId==='shared-alg001-l07-p014'&&isDeepStrictEqual(p014Glossary.entries.map((t:{id:string})=>t.id),['downhill','equation','line','negative-number','slope']),'five exact P014 source glossary entries');
 for(const[lang,pin]of Object.entries(p014Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p014Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['equation','line','slope'].includes(term.id)&&isDeepStrictEqual(prior,projected),'preserved exact Equation/Line/Slope entries');
  else{demand(['negative-number','downhill'].includes(term.id),'two exact source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===35&&new Set(glossary.map(t=>t.id)).size===35&&isDeepStrictEqual(glossary.slice(0,33),beforeP014Glossary),'all33 prior entries preserved plus Negative number and Downhill');
 const p015Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p015/native-v1/glossary-model-v1.json","bytes":6805,"sha256":"531d0bbb51763f6ad40d1db79fed9c68b6ff23f5fd7e76df94e27036b1320977"});
 demand(p015Glossary.animationId==='shared-alg001-l07-p015'&&isDeepStrictEqual(p015Glossary.entries.map((t:{id:string})=>t.id),['equation','line','slope']),'three exact P015 source glossary entries');
 for(const[lang,pin]of Object.entries(p015Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p015Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source};
  demand(isDeepStrictEqual(glossary.find(e=>e.id===term.id),projected),'P015 reuses exact Equation/Line/Slope without duplicate or mutation');}
 const beforeP016Glossary=glossary.slice(),p016Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p016/native-v1/glossary-model-v1.json","bytes":12053,"sha256":"fc2635014aad24196cfa6ba55469ec190060be49d5a698259381686a4efaefa9"});
 demand(p016Glossary.animationId==='shared-alg001-l07-p016'&&isDeepStrictEqual(p016Glossary.entries.map((t:{id:string})=>t.id),['cross','line','point','y-axis','y-coordinate','y-intercept']),'six exact P016 source glossary entries');
 for(const[lang,pin]of Object.entries(p016Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p016Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['line','y-intercept'].includes(term.id)&&isDeepStrictEqual(prior,projected),'preserved exact Line/Y-intercept entries');
  else{demand(['cross','point','y-axis','y-coordinate'].includes(term.id),'four exact source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===39&&new Set(glossary.map(t=>t.id)).size===39&&isDeepStrictEqual(glossary.slice(0,35),beforeP016Glossary),'all35 prior entries preserved plus four source P016 terms');
 const p017Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p017/native-v1/glossary-model-v1.json","bytes":4804,"sha256":"8369df7f42e32df174522cbdc02b9b5b80a4c68f0b79a19a3c2d64613ab5f1c6"});
 demand(p017Glossary.animationId==='shared-alg001-l07-p017'&&isDeepStrictEqual(p017Glossary.entries.map((t:{id:string})=>t.id),['equation','y-intercept']),'two exact P017 source glossary entries');
 for(const[lang,pin]of Object.entries(p017Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p017Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source};
  demand(isDeepStrictEqual(glossary.find(e=>e.id===term.id),projected),'P017 reuses exact Equation/Y-intercept without duplicate or mutation');}
 const p018Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p018/native-v1/glossary-model-v1.json","bytes":4804,"sha256":"d300b0c0bab03b53777c9efeb82fd2b96bf2eb60ad9fd6530be7d4a58ffae86c"});
 demand(p018Glossary.animationId==='shared-alg001-l07-p018'&&isDeepStrictEqual(p018Glossary.entries.map((t:{id:string})=>t.id),['equation','y-intercept']),'two exact P018 source glossary entries');
 for(const[lang,pin]of Object.entries(p018Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p018Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source};
  demand(isDeepStrictEqual(glossary.find(e=>e.id===term.id),projected),'P018 reuses exact Equation/Y-intercept without duplicate or mutation');}
 const p019Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p019/native-v1/glossary-model-v1.json","bytes":2907,"sha256":"051dd5ab17a40c303c5d63901e86812da32699cab477d13551379ab9234e776b"});
 demand(p019Glossary.animationId==='shared-alg001-l07-p019'&&isDeepStrictEqual(p019Glossary.entries.map((t:{id:string})=>t.id),['y-intercept']),'one exact P019 source glossary entry');
 for(const[lang,pin]of Object.entries(p019Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p019Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source};
  demand(isDeepStrictEqual(glossary.find(e=>e.id===term.id),projected),'P019 reuses exact Y-intercept without duplicate or mutation');}
 const beforeP020=glossary.slice(),p020Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p020/native-v1/glossary-model-v1.json","bytes":10665,"sha256":"1ad51e9072b805cd886f9e9a57ca411b8f7b7aa286e8374219cdf9fef8f18277"});
 demand(p020Glossary.animationId==='shared-alg001-l07-p020'&&isDeepStrictEqual(p020Glossary.entries.map((t:{id:string})=>t.id),['function','graph','line','nonlinear-function','vertical-line-test']),'five exact P020 source glossary entries');
 for(const[lang,pin]of Object.entries(p020Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p020Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['function','graph','line','nonlinear-function'].includes(term.id)&&isDeepStrictEqual(prior,projected),'P020 reuses four exact existing glossary entries');else{demand(term.id==='vertical-line-test','only P020 vertical-line-test source addition');glossary.push(projected);}}
 demand(Number(glossary.length)===40&&new Set(glossary.map(t=>t.id)).size===40&&isDeepStrictEqual(glossary.slice(0,39),beforeP020),'preserved39 plus exact vertical-line-test');
 const beforeP021=glossary.slice(),p021Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p021/native-v1/glossary-model-v1.json","bytes":7470,"sha256":"ee8e6e84f0b20988a5ea9a99373317356257be79fdba2c191d20bb15272ded45"});
 demand(p021Glossary.animationId==='shared-alg001-l07-p021'&&isDeepStrictEqual(p021Glossary.entries.map((t:{id:string})=>t.id),['function','graph','line','linear-function']),'four exact P021 glossary entries');
 for(const[lang,pin]of Object.entries(p021Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p021Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  demand(prior&&isDeepStrictEqual(prior,projected),'P021 exact existing glossary entry');}
 demand(Number(glossary.length)===40&&isDeepStrictEqual(glossary,beforeP021),'P021 preserves all40 existing glossary entries');
 const beforeP022=glossary.slice(),p022Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p022/native-v1/glossary-model-v1.json","bytes":10499,"sha256":"fadda47827cb1a4ec93601680cf90ac16d98ae662950ed717ebd4203dca3f76a"});
 demand(p022Glossary.animationId==='shared-alg001-l07-p022'&&isDeepStrictEqual(p022Glossary.entries.map((t:{id:string})=>t.id),['constant','function','graph','line','linear-function','term']),'six exact P022 glossary entries');
 for(const[lang,pin]of Object.entries(p022Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p022Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['function','graph','line','linear-function'].includes(term.id)&&isDeepStrictEqual(prior,projected),'P022 four exact existing glossary entries');
  else{demand(['constant','term'].includes(term.id),'only P022 Constant and Term source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===42&&new Set(glossary.map(t=>t.id)).size===42&&isDeepStrictEqual(glossary.slice(0,40),beforeP022),'P022 preserves all40 existing glossary entries and adds two exact terms');
 const beforeP025=glossary.slice(),p025Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p025/native-v1/glossary-model-v1.json","bytes":9517,"sha256":"270d48598f6a59949b86b181286277b9aebf5644ad1bb1fd9398e18424818aab"});
 demand(p025Glossary.animationId==='shared-alg001-l07-p025'&&isDeepStrictEqual(p025Glossary.entries.map((t:{id:string})=>t.id),['coefficient','equation','linear-function','slope','term']),'five exact P025 glossary entries');
 for(const[lang,pin]of Object.entries(p025Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p025Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(['equation','linear-function','slope','term'].includes(term.id)&&isDeepStrictEqual(prior,projected),'P025 four exact existing glossary entries');
  else{demand(term.id==='coefficient','only P025 Coefficient source addition');glossary.push(projected);}}
 demand(Number(glossary.length)===43&&new Set(glossary.map(t=>t.id)).size===43&&isDeepStrictEqual(glossary.slice(0,42),beforeP025),'P025 preserves all42 existing glossary entries and adds exact Coefficient');
 const beforeP030=glossary.slice(),p030Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p030/native-v1/glossary-model-v1.json","bytes":17720,"sha256":"a6c2da050c829419b8be8406de01bbe647e66ad38c4ba0038aa9a0c182dedd0b"});
 demand(p030Glossary.animationId==='shared-alg001-l07-p030'&&isDeepStrictEqual(p030Glossary.entries.map((t:{id:string})=>t.id),['change','function','graph','horizontal','line','measure','rate','ratio','slope','vertical']),'ten exact P030 glossary entries');
 for(const[lang,pin]of Object.entries(p030Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p030Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P030 reuses eight exact existing terms');
  else{demand(['change','rate'].includes(term.id),'only P030 Change and Rate source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===45&&new Set(glossary.map(t=>t.id)).size===45&&isDeepStrictEqual(glossary.slice(0,43),beforeP030),'P030 preserves all43 prior glossary entries and adds exact Change/Rate');
 const beforeP031=glossary.slice(),p031Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p031/native-v1/glossary-model-v1.json","bytes":5797,"sha256":"0387f32dff7980a6f0d8de3d6108688ec2ea1688242b1b92207be0e05350f715"});
 demand(p031Glossary.animationId==='shared-alg001-l07-p031'&&isDeepStrictEqual(p031Glossary.entries.map((t:{id:string})=>t.id),['function','linear-function','variable']),'three exact P031 glossary entries');
 for(const[lang,pin]of Object.entries(p031Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p031Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P031 reuses two exact existing terms');
  else{demand(['variable'].includes(term.id),'only P031 Variable source addition');glossary.push(projected);}}
 demand(Number(glossary.length)===46&&new Set(glossary.map(t=>t.id)).size===46&&isDeepStrictEqual(glossary.slice(0,45),beforeP031),'P031 preserves all45 prior glossary entries and adds exact Variable');
 const beforeP032=glossary.slice(),p032Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p032/native-v1/glossary-model-v1.json","bytes":10884,"sha256":"eed391df0509989460199243639641f1b5ff0f5cc4f7db78bcec165e7669dfb4"});
 demand(p032Glossary.animationId==='shared-alg001-l07-p032'&&isDeepStrictEqual(p032Glossary.entries.map((t:{id:string})=>t.id),['evaluate','input','nonlinear-function','substitute','value','variable']),'six exact P032 glossary entries');
 for(const[lang,pin]of Object.entries(p032Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p032Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P032 reuses four exact existing terms');
  else{demand(['evaluate','substitute'].includes(term.id),'only P032 Evaluate and Substitute source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===48&&new Set(glossary.map(t=>t.id)).size===48&&isDeepStrictEqual(glossary.slice(0,46),beforeP032),'P032 preserves all46 prior glossary entries and adds exact Evaluate and Substitute');
 const beforeP039=glossary.slice(),p039Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p039/native-v1/glossary-model-v1.json","bytes":16064,"sha256":"fd56f0962aeaf05147e2f63a127348447af0609656c8c1635e74fc91824e1cb9"});
 demand(p039Glossary.animationId==='shared-alg001-l07-p039'&&isDeepStrictEqual(p039Glossary.entries.map((t:{id:string})=>t.id),["function","graph","intersect","line","linear-function","point","vertical","vertical-line-test"]),'eight exact P039 glossary entries');
 for(const[lang,pin]of Object.entries(p039Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p039Glossary.entries){const actionKey=p039Glossary.caseBindings.find((b:{dictionaryKey:string;sourceActionKey:string})=>b.dictionaryKey===term.sourceKeyAttribute)?.sourceActionKey;
  demand(actionKey===term.sourceKeyAttribute||(term.id==='vertical-line-test'&&term.sourceKeyAttribute==='vertical-line test'&&actionKey==='Vertical-line test'),'exact P039 source-action case binding');
  const projected={id:term.id,sourceKeyAttribute:actionKey,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P039 reuses seven exact existing terms');
  else{demand(term.id==='intersect','only P039 Intersect source addition');glossary.push(projected);}}
 demand(Number(glossary.length)===49&&new Set(glossary.map(t=>t.id)).size===49&&isDeepStrictEqual(glossary.slice(0,48),beforeP039),'P039 preserves all48 prior glossary entries and adds exact Intersect');
 const beforeP040=glossary.slice(),p040Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p040/native-v1/glossary-model-v1.json","bytes":12909,"sha256":"95c6228ffd48a1e3b6f4ee7d02cfe03521bf3d7a480cea4e40a45dd6988be341"});
 demand(p040Glossary.animationId==='shared-alg001-l07-p040'&&isDeepStrictEqual(p040Glossary.entries.map((t:{id:string})=>t.id),["denominator","equation","exponent","fraction","linear-function","variable"]),'six exact P040 glossary entries');
 for(const[lang,pin]of Object.entries(p040Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p040Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P040 reuses three exact existing terms');
  else{demand(['denominator','exponent','fraction'].includes(term.id),'only P040 Denominator Exponent Fraction source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===52&&new Set(glossary.map(t=>t.id)).size===52&&isDeepStrictEqual(glossary.slice(0,49),beforeP040),'P040 preserves all49 prior glossary entries and adds exact Denominator Exponent Fraction');
 const beforeP041=glossary.slice(),p041Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p041/native-v1/glossary-model-v1.json","bytes":18744,"sha256":"8e14f5e33d05b31857ee4652bef66bcc1b13a83b71a8be8b118fb713c2772495"});
 demand(p041Glossary.animationId==='shared-alg001-l07-p041'&&isDeepStrictEqual(p041Glossary.entries.map((t:{id:string})=>t.id),["function-table","graph","input","linear-function","ordered-pair","output","point","table","x-coordinate","y-coordinate"]),'ten exact P041 glossary entries');
 for(const[lang,pin]of Object.entries(p041Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])
  readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p041Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);
  if(prior)demand(isDeepStrictEqual(prior,projected),'P041 reuses seven exact existing terms');
  else{demand(['function-table','ordered-pair','x-coordinate'].includes(term.id),'only P041 Function-table Ordered-pair X-coordinate source additions');glossary.push(projected);}}
 demand(Number(glossary.length)===55&&new Set(glossary.map(t=>t.id)).size===55&&isDeepStrictEqual(glossary.slice(0,52),beforeP041),'P041 preserves all52 prior glossary entries and adds exact Function-table Ordered-pair X-coordinate');
 const beforeP042=glossary.slice(),p042Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p042/native-v1/glossary-model-v1.json","bytes":28021,"sha256":"f7e3146729135a40c45678c87ad606480551dbc040061765e6aa299d7bf52d63"});
 demand(p042Glossary.animationId==='shared-alg001-l07-p042'&&isDeepStrictEqual(p042Glossary.entries.map((t:{id:string})=>t.id),["change", "coordinates", "fraction", "graph", "horizontal", "length", "line", "linear-function", "negative-sign", "point", "right-triangle", "simplify", "slope", "vertical"]),'exact P042 source glossary entries');
 for(const[lang,pin]of Object.entries(p042Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p042Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P042 exact reused entry');else{demand(["coordinates", "length", "negative-sign", "right-triangle", "simplify"].includes(term.id),'P042 exact permitted additions');glossary.push(projected);}}
 demand(Number(glossary.length)===60&&new Set(glossary.map(t=>t.id)).size===60&&isDeepStrictEqual(glossary.slice(0,55),beforeP042),'P042 preserves all55 prior entries');
 const beforeP043=glossary.slice(),p043Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p043/native-v1/glossary-model-v1.json","bytes":14325,"sha256":"7c98909b5f1c58190cee7af9fba7de1ea592d83d4b2f90ae989f80f035d70015"});
 demand(p043Glossary.animationId==='shared-alg001-l07-p043'&&isDeepStrictEqual(p043Glossary.entries.map((t:{id:string})=>t.id),["coefficient", "independent-variable", "linear-function", "slope", "slope-intercept-form", "variable"]),'exact P043 source glossary entries');
 for(const[lang,pin]of Object.entries(p043Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p043Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P043 exact reused entry');else{demand(["independent-variable", "slope-intercept-form"].includes(term.id),'P043 exact permitted additions');glossary.push(projected);}}
 demand(Number(glossary.length)===62&&new Set(glossary.map(t=>t.id)).size===62&&isDeepStrictEqual(glossary.slice(0,60),beforeP043),'P043 preserves all60 prior entries');
 const beforeP047=glossary.slice(),p047Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p047/native-v1/glossary-model-v1.json","bytes":29098,"sha256":"436aeed614f5d97ddcc9cf5b75a12db27c80a8025a0398c9bdf5c7daad8960d8"});
 demand(p047Glossary.animationId==='shared-alg001-l07-p047'&&isDeepStrictEqual(p047Glossary.entries.map((t:{id:string})=>t.id),["axis", "calculate", "coordinate", "function", "graph", "horizontal", "length", "line", "linear-function", "point", "rate", "right-triangle", "slope", "triangle", "vertical"]),'exact P047 source glossary entries');
 for(const[lang,pin]of Object.entries(p047Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p047Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P047 exact eleven reused entries');else{demand(["axis", "calculate", "coordinate", "triangle"].includes(term.id),'P047 exact four permitted additions');glossary.push(projected);}}
 demand(Number(glossary.length)===66&&new Set(glossary.map(t=>t.id)).size===66&&isDeepStrictEqual(glossary.slice(0,62),beforeP047),'P047 preserves all62 prior glossary entries');
 const beforeP046=glossary.slice(),p046Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p046/native-v1/glossary-model-v1.json","bytes":27961,"sha256":"9e5f880221531675464497c93cf753e41348b35f71aabe9fd11304e59c1b731e"});
 demand(p046Glossary.animationId==='shared-alg001-l07-p046'&&isDeepStrictEqual(p046Glossary.entries.map((t:{id:string})=>t.id),["coefficient", "constant", "coordinates", "denominator", "graph", "intersect", "linear-function", "numerator", "plot", "point", "slope", "term", "unit", "y-axis", "y-intercept"]),'exact P046 source glossary entries');
 for(const[lang,pin]of Object.entries(p046Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p046Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P046 exact twelve reused entries');else{demand(["numerator", "plot", "unit"].includes(term.id),'P046 exact three permitted additions');glossary.push(projected);}}
 demand(Number(glossary.length)===69&&new Set(glossary.map(t=>t.id)).size===69&&isDeepStrictEqual(glossary.slice(0,66),beforeP046),'P046 preserves all66 prior glossary entries');
 const beforeP050=glossary.slice(),p050Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p050/native-v1/glossary-model-v1.json","bytes":25987,"sha256":"10ef4b189fcc70df413d58a827935017f4218a3974d5ff8e0b7e1df3052035dd"});
 demand(p050Glossary.animationId==='shared-alg001-l07-p050'&&isDeepStrictEqual(p050Glossary.entries.map((t:{id:string})=>t.id),["area", "calculate", "circle", "equation", "evaluate", "expression", "function", "function-table", "nonlinear-function", "order-of-operations", "radius", "substitute", "value"]),'exact P050 source glossary entries');
 for(const[lang,pin]of Object.entries(p050Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p050Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P050 exact eight reused entries');else{demand(["area", "circle", "expression", "order-of-operations", "radius"].includes(term.id),'P050 exact five permitted additions');glossary.push(projected);}}
 demand(Number(glossary.length)===74&&new Set(glossary.map(t=>t.id)).size===74&&isDeepStrictEqual(glossary.slice(0,69),beforeP050),'P050 preserves all69 prior glossary entries');
 const beforeP058=glossary.slice(),p058Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p058/native-v1/glossary-model-v1.json","bytes":22399,"sha256":"cb2d895ab79ae18792b608af68fbdbb9a35c393cf2ec635c630bbd358795230e"});
 demand(p058Glossary.animationId==='shared-alg001-l07-p058'&&isDeepStrictEqual(p058Glossary.entries.map((t:{id:string})=>t.id),["baseball", "calculate", "coefficient", "equation", "expression", "function", "input-variable", "linear-equation", "output-variable", "pushup", "rate", "sentence", "variable"]),'exact P058 source glossary entries');
 for(const[lang,pin]of Object.entries(p058Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p058Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P058 exact eight reused entries');else{demand(["baseball", "input-variable", "output-variable", "pushup", "sentence"].includes(term.id),'P058 exact five permitted additions');glossary.push(projected);}}
 demand(Number(glossary.length)===79&&new Set(glossary.map(t=>t.id)).size===79&&isDeepStrictEqual(glossary.slice(0,74),beforeP058),'P058 preserves all74 prior glossary entries');
 const beforeP059=glossary.slice(),p059Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p059/native-v1/glossary-model-v1.json","bytes":20043,"sha256":"3e1c6db476255cf0aca745893444e1d699b3971085601bb04debd0753adf0050"});
 demand(p059Glossary.animationId==='shared-alg001-l07-p059'&&isDeepStrictEqual(p059Glossary.entries.map((t:{id:string})=>t.id),["equation", "exponent", "function", "function-table", "graph", "line", "linear-function", "point", "square-root", "value", "variable"]),'exact P059 source glossary entries');
 for(const[lang,pin]of Object.entries(p059Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p059Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P059 exact reused entries');else{demand(["square-root"].includes(term.id),'P059 permitted addition');glossary.push(projected);}}
 demand(Number(glossary.length)===80&&new Set(glossary.map(t=>t.id)).size===80&&isDeepStrictEqual(glossary.slice(0,79),beforeP059),'P059 preserves prior glossary entries');
 const beforeP060=glossary.slice(),p060Glossary=readJsonPin(root,{"path":"migrations/shared-alg001-l07-p060/native-v1/glossary-model-v1.json","bytes":21653,"sha256":"2de3810719a53316a2e4bb2e77b725e64fd3289b9d3e961c2ab318a9d17a6243"});
 demand(p060Glossary.animationId==='shared-alg001-l07-p060'&&isDeepStrictEqual(p060Glossary.entries.map((t:{id:string})=>t.id),["axis", "calculate", "coordinate", "function", "graph", "horizontal", "line", "linear-function", "point", "ratio", "right-triangle", "slope", "vertical"]),'exact P060 source glossary entries');
 for(const[lang,pin]of Object.entries(p060Glossary.dictionaries)as[string,{path:string;bytes:number;sha256:string}][])readPin('/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI',{path:lang==='en'?'L1KTE01.xml':'L1KTS01.xml',bytes:pin.bytes,sha256:pin.sha256});
 for(const term of p060Glossary.entries){const projected={id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source},prior=glossary.find(e=>e.id===term.id);if(prior)demand(isDeepStrictEqual(prior,projected),'P060 exact reused entries');else{demand(false,'P060 has no glossary additions');glossary.push(projected);}}
 demand(Number(glossary.length)===80&&new Set(glossary.map(t=>t.id)).size===80&&isDeepStrictEqual(glossary.slice(0,80),beforeP060),'P060 preserves prior glossary entries');
 // Enable the source-authored P051 -> P052 level handoff only after both exact page proofs are registered.
 const gameNavigation=['shared-alg001-l07-p051','shared-alg001-l07-p052'].every(id=>live.has(id));
 return Object.freeze({...base,support:gameNavigation?Object.freeze({...base.support,lessonHostCapabilities:Object.freeze([...new Set([...base.support.lessonHostCapabilities,'navigation' as const])])}):base.support,descriptorId:`${base.descriptorId}:current-l7-source-native-v1`,calibrationId:'g678-alg-l07-current-source-native-v1',releaseId:`${base.releaseId}:current-l7-source-native-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/${candidateP003?'candidate':'registered'}-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:current-l7-native-v1`}),glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(updated),registeredAnimationCount:updated.length})});
}
export function algL07CurrentRegisteredSharedCount(){const tx=readRegistryTransaction(getWorkspaceRoot());return tx.registry.calibrations.flatMap((c:Calibration)=>c.entries).filter((e:Entry)=>/^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/.test(e.key)).length;}
