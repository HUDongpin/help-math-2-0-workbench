import 'server-only';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P003FormalDescriptor} from './alg-l06-p003-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p004';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const KEYTERM_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW04.swf',bytes:1115626,sha256:'514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const AUDIT={path:'migrations/shared-alg001-l06-p004/audit/source-audit-v1.json',bytes:125269,sha256:'89b22426969a3f288f1aef6043aed050d9eb6e4e8d092b45532e89a52ff37180'};
const GLOSSARY={path:'migrations/shared-alg001-l06-p004/audit/source-glossary-v1.json',bytes:15869,sha256:'0cb0789f117db00855a5be1c1123121cdd64b7eba03b2f64ddce3d7f81f999e0'};
const OCCURRENCES={path:'migrations/shared-alg001-l06-p004/audit/button-occurrences-v1.json',bytes:2908,sha256:'331a039e49a221e2427f7125826d66097163b94f617a7ab78a5599f15ea7a4d6'};
const SA_AUDIT={path:'migrations/shared-alg001-l06-p004/audit/sa-host-disposition-v1.json',bytes:8479,sha256:'8a64cea0933e8a5d8d19f6807c5109de865bf64485639489466e863458247530'};
const CANVAS_MANIFEST={path:'output/alg-l06-p004-canvas-candidate-v1/candidate-manifest.json',bytes:3570,sha256:'43bf62d30b2eb5f5c2f564bdcbe27ac31fce70060bb44a08ff55bb5c06e79ef6'};
const CANVAS_RECEIPT={path:'output/alg-l06-p004-canvas-candidate-v1/validation-receipt.json',bytes:2581,sha256:'f1958116091aec11dbfd83bef8a2900b183f479bf66747a2bd0a3f93be94d6e6'};
const CANVAS={path:'output/alg-l06-p004-canvas-candidate-v1/canvas-renderer.js',bytes:7342336,sha256:'6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8'};
const MAIN={path:'migrations/shared-alg001-l06-p004/audit/continuous-source-v1.mp3',bytes:329030,sha256:'e8f5307618bd63789f468c7a056cf80ae7828f17b665a24893fafc3ad8bb7f7e'};
const SA={path:'G6-G8-shared/ALG001/L6/SA/L6RW04.mp3',bytes:667968,sha256:'08bb62e9c1d92235c2e3fb96c44d44fc16b92ca7d175274e4c809f06bcfda8a5'};
const DICTIONARIES=[
 {path:'HELP_KEYTERMS/KT/XML/L1KTE01.xml',bytes:345838,sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b',assetId:'G678L1KTE01.xml'},
 {path:'HELP_KEYTERMS/KT/XML/L1KTS01.xml',bytes:344456,sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',assetId:'G678L1KTS01.xml'},
] as const;
const KEYS=['Input','Output','Function','Relation','Value','Rule','output'];
type Pin={path:string;bytes:number;sha256:string};
type GlossaryAudit={kind:string;animationId:string;sourceSwf:Pin;entries:Array<PageOnlyLessonGlossaryEntry&{canonicalDictionaryKey:string;buttonIds:number[];occurrenceIds:string[]}>;dictionaries:{en:Pin;es:Pin};modernDecisions:string[]};
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P004_CANDIDATE_INVALID: ${reason}`);}

/** A local projection only. The P003 proof remains the registered predecessor. */
export function algL6P004CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','exact local source environment');
 const base=algL6P003FormalDescriptor(),root=getWorkspaceRoot();
 const transaction=readRegistryTransaction(root);
 demand(registeredLocalOnlyAnimationKeys.length===497&&
  !transaction.registry.calibrations.some((c:{entries:{key:string}[]})=>c.entries.some(e=>e.key===ID))&&
  !localOnlyAnimationModuleRegistration(ID),'P004 remains unregistered');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&base.course.activePageCount===60&&
  base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.registeredAnimationCount===20&&
  base.pages.filter(p=>p.rendererAvailability.kind==='registered').length===20&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),'formal P003 predecessor');
 const target=base.pages[3];
 demand(target.animationId===ID&&target.placementId===ID&&target.rendererAvailability.kind==='unavailable'&&
  target.globalPageOrdinal===4&&target.sectionCode==='RW'&&target.sectionPageOrdinal===3&&
  target.previousPlacementId==='shared-alg001-l06-p003'&&target.nextPlacementId==='shared-alg001-l06-p005'&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===4,'exact P004 occurrence');
 readPin(SOURCE_ROOT,SOURCE);readPin(SOURCE_ROOT,XML);
 const audit=readJsonPin(root,AUDIT) as {kind:string;animationId:string;source:Pin;placement:{globalOrdinal:number;sectionCode:string;sectionPageOrdinal:number};frameDomains:{longestStaticallyRootReachableDomain:{domainId:string;declaredFrameCount:number}};stream:{mp3:{bytes:number;sha256:string}};optionalSpanish:Pin;buttons:number;acceptance:Record<string,boolean>};
 demand(audit.kind==='alg-l06-p004-source-audit-v1'&&audit.animationId===ID&&
  isDeepStrictEqual(audit.source,SOURCE)&&audit.placement.globalOrdinal===4&&audit.placement.sectionCode==='RW'&&
  audit.placement.sectionPageOrdinal===3&&audit.frameDomains.longestStaticallyRootReachableDomain.domainId==='sprite-95'&&
  audit.frameDomains.longestStaticallyRootReachableDomain.declaredFrameCount===831&&audit.buttons===8&&
  audit.stream.mp3.bytes===MAIN.bytes&&audit.stream.mp3.sha256===MAIN.sha256&&
  audit.optionalSpanish.path===SA.path&&audit.optionalSpanish.bytes===SA.bytes&&audit.optionalSpanish.sha256===SA.sha256&&
  Object.values(audit.acceptance).every(v=>v===false),'source audit identity and gates');
 const glossary=readJsonPin(root,GLOSSARY) as GlossaryAudit;
 demand(glossary.kind==='alg-l06-p004-source-glossary-v1'&&glossary.animationId===ID&&
  glossary.sourceSwf.sha256===SOURCE.sha256&&glossary.sourceSwf.bytes===SOURCE.bytes&&
  glossary.entries.length===7&&isDeepStrictEqual(glossary.entries.map(e=>e.sourceKeyAttribute),KEYS)&&
  glossary.entries[6].sourceKeyAttribute==='output'&&glossary.entries[6].id==='output'&&
  glossary.entries[6].canonicalDictionaryKey==='Output'&&
  new Set(glossary.entries.flatMap(e=>e.occurrenceIds)).size===9&&
  glossary.modernDecisions.includes('close keeps paused state until explicit resume'),'source glossary selection');
 readJsonPin(root,OCCURRENCES);
 const saAudit=readJsonPin(root,SA_AUDIT) as {kind:string;animationId:string;status:string;
  inputs:Record<string,Pin>;acceptanceEffects:Record<string,boolean>};
 demand(saAudit.kind==='alg-l06-p004-separate-sa-host-disposition-v1'&&saAudit.animationId===ID&&
  saAudit.status==='verified-static-host-algorithm-conditional-page-application-not-runtime-or-listening'&&
  saAudit.inputs.lessonXml?.sha256===XML.sha256&&saAudit.inputs.pageSwf?.sha256===SOURCE.sha256&&
  saAudit.inputs.separateSa?.sha256===SA.sha256&&
  Object.values(saAudit.acceptanceEffects).every(v=>v===false),'optional SA source role');
 for(const key of ['hostCas','hostFunctions','saRelease','eaRelease'] as const){
  const pin=saAudit.inputs[key];demand(pin&&path.isAbsolute(pin.path),'host source pin');
  readPin(path.dirname(pin.path),{...pin,path:path.basename(pin.path)});
 }
 for(const [index,pin] of DICTIONARIES.entries()){
  readPin(KEYTERM_ROOT,{...pin,path:index===0?'L1KTE01.xml':'L1KTS01.xml'});
  const bank=index===0?glossary.dictionaries.en:glossary.dictionaries.es;
  demand(bank.bytes===pin.bytes&&bank.sha256===pin.sha256,'bilingual dictionary byte binding');
 }
 const manifest=readJsonPin(root,CANVAS_MANIFEST) as {animationId:string;status:string;sourceSha256:string;outputs:{name:string;bytes:number;sha256:string}[];acceptance:Record<string,boolean>};
 demand(manifest.animationId===ID&&manifest.status==='unregistered-drawing-only-candidate'&&
  manifest.sourceSha256===SOURCE.sha256&&manifest.outputs.some(x=>x.name==='canvas-renderer.js'&&
   x.bytes===CANVAS.bytes&&x.sha256===CANVAS.sha256)&&Object.values(manifest.acceptance).every(v=>v===false),
  'canvas producer identity');
 const receipt=readJsonPin(root,CANVAS_RECEIPT) as {kind:string;status:string;outputs:Pin[];acceptanceEffect:string};
 demand(receipt.kind==='alg-l06-p004-drawing-candidate-validation-v1'&&
  receipt.status==='technical-pass-not-acceptance'&&receipt.acceptanceEffect==='none'&&
  receipt.outputs.some(x=>x.path===CANVAS.path&&x.bytes===CANVAS.bytes&&x.sha256===CANVAS.sha256),
  'canvas validation receipt');
 readPin(root,CANVAS);readPin(root,MAIN);readPin(SOURCE_ROOT,SA);
 const oldFunction=base.glossary.filter(e=>e.id==='function');
 const sourceFunction=glossary.entries.find(e=>e.id==='function');
 demand(oldFunction.length===1&&sourceFunction&&
  isDeepStrictEqual(oldFunction[0],projectGlossary(sourceFunction)),'existing Function dictionary exact match');
 const additions=glossary.entries.filter(e=>e.id!=='function'&&e.sourceKeyAttribute!=='output').map(projectGlossary);
 demand(additions.length===5&&additions.every(e=>!base.glossary.some(old=>old.id===e.id)),'five new canonical terms');
 const pages=base.pages.map((page,index)=>index!==3?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-95',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p004-source-readable'}),
 }));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===21,'one simulated page only');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p004-candidate-v1`,
  calibrationId:'g678-alg-l06-p004-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p004-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p004-candidate-v1`}),
  pages:Object.freeze(pages),glossary:Object.freeze([...base.glossary,...additions]),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:21}),
  p004CandidateDisclosure:Object.freeze({status:'unregistered-engineering-candidate',actualRegisteredLessonPages:20,
   simulatedLessonPages:21,officialRegisteredCount:497,registrationChanged:false,acceptanceEffect:'none'}),
 });
}
function projectGlossary(entry:GlossaryAudit['entries'][number]):PageOnlyLessonGlossaryEntry{
 return {id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,
  definitions:entry.definitions,source:entry.source};
}
