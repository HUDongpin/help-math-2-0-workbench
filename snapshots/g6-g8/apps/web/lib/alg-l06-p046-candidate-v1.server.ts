import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P045FormalDescriptor} from './alg-l06-p045-formal-admission-v1.server';
import {P046_ID as ID,P046_SOURCE_ROOT,p046LocalDevelopment} from './alg-l06-p046-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P046 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p046/source-v1/L6TI06.swf",
    "bytes": 240172,
    "sha256": "c69f1f0fdaff0201af171aaee6b9b90a33b483e8c93ffef406c31cf0853a54b8"
  },
  {
    "path": "migrations/shared-alg001-l06-p046/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p046/source-v1/L6TI06.mp3",
    "bytes": 350784,
    "sha256": "de3c127ba68d082b9a296fb17cb31a72f477f460fde01b8e3370402bb414f18e"
  },
  {
    "path": "migrations/shared-alg001-l06-p046/native-v1/source-model-v1.json",
    "bytes": 472515,
    "sha256": "0ab3cce9ece208aae74dd0a8ecc380c2fe1a6c2ea19a4d4ce0cc8ab816f7d682"
  },
  {
    "path": "migrations/shared-alg001-l06-p046/native-v1/native-bindings-v1.json",
    "bytes": 5453,
    "sha256": "98aa04198f3117a0013537c7413f08e6be56ba8295d8e4e2e3448558288368a0"
  },
  {
    "path": "migrations/shared-alg001-l06-p046/native-v1/nine-term-crosswalk-v1.json",
    "bytes": 13290,
    "sha256": "41eabd0141e956d8f9e9d661322bd9a52fc0bf8561814943dec0cca93af1badc"
  },
  {
    "path": "migrations/shared-alg001-l06-p046/canvas-v1/canvas-renderer-draft.js",
    "bytes": 2389062,
    "sha256": "888a3e9f41e236eda7b4d0fe9c04a0aaa38d9e12bdbdbe844cc6d1e12a5272d6"
  }
] as const;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P046_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered five-value matching candidate after formal P045. */
export function algL6P046CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p046LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TI/L6TI06.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TI06.mp3'].entries())
  readPin(P046_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]),binding=readJsonPin(root,workspacePins[4]);
 demand(model.animationId===ID&&model.placement.ordinal===46&&model.placement.sectionOrdinal===5&&
  model.runtime.mainSpriteId===123&&model.runtime.mainFrames===743&&model.runtime.quizFrame===163&&
  binding.sourceSwfSha256===workspacePins[0].sha256&&binding.sourceModelSha256===workspacePins[3].sha256&&
  isDeepStrictEqual(model.drags.map((row:{id:number;value:string})=>[row.id,row.value]),
   [[1,'–3'],[2,'–8'],[3,'0'],[4,'4'],[5,'6']]),'source drag identity and timeline');
 const base=algL6P045FormalDescriptor(),target=base.pages[45];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===48&&
  base.pages[44].animationId==='shared-alg001-l06-p045'&&base.pages[44].rendererAvailability.kind==='registered',
  'formally admitted P045 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===46&&target.sectionPageOrdinal===5&&
  target.sectionCode==='TI'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p045'&&
  target.nextPlacementId==='shared-alg001-l06-p047','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[5]),glossary=[...base.glossary];
 demand(crosswalk.entries.length===9,'nine source glossary terms');
 for(const row of crosswalk.entries as PageOnlyLessonGlossaryEntry[]) {
  const existing=glossary.filter(item=>item.sourceKeyAttribute===row.sourceKeyAttribute);
  demand(existing.length<=1,'unambiguous glossary key');
  if(existing.length)demand(isDeepStrictEqual(existing[0].labels,row.labels)&&
   isDeepStrictEqual(existing[0].definitions,row.definitions),'same dictionary entry');
  else {
   demand(!glossary.some(item=>item.id===row.id),'unambiguous glossary id');
   glossary.push(Object.freeze({id:row.id,sourceKeyAttribute:row.sourceKeyAttribute,
    labels:Object.freeze({...row.labels}),definitions:Object.freeze({...row.definitions}),
    source:Object.freeze({...row.source})}) as PageOnlyLessonGlossaryEntry);
  }
 }
 const pages=base.pages.map((page,index)=>index!==45?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-123',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p046-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===49&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '48 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p046-source-matching-candidate-v1`,
  calibrationId:'g678-alg-l06-p046-source-matching-candidate-v1',releaseId:`${base.releaseId}:p046-source-matching-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p046-source-matching-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:49})});
}
