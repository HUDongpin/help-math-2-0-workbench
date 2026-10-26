import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P056FormalDescriptor} from './alg-l06-p056-formal-admission-v1.server';
import {P057_ID as ID,P057_SOURCE_ROOT,p057LocalDevelopment} from './alg-l06-p057-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P057 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p057/source-v1/L6TS08.swf",
    "bytes": 937900,
    "sha256": "03782ef6ed4587d61db4476648d0d69b5ad158f84b2f6a0ba747605a6712fb31"
  },
  {
    "path": "migrations/shared-alg001-l06-p057/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p057/source-v1/L6TS08.mp3",
    "bytes": 58800,
    "sha256": "2310e2c254f8acd45c47637176cd44b35ef3616cfa5a929cc182df628927ed0a"
  },
  {
    "path": "migrations/shared-alg001-l06-p057/native-v1/source-model-v1.json",
    "bytes": 2084038,
    "sha256": "82d884431bcdf4d231546fa743e6f7696028422aa0ea5c3f183119e34528fdbf"
  },
  {
    "path": "migrations/shared-alg001-l06-p057/native-v1/seven-term-crosswalk-v1.json",
    "bytes": 10440,
    "sha256": "b0ee339d668f41540243cd542da80fb047b42d113ad0fbced703f4c8c1094192"
  },
  {
    "path": "migrations/shared-alg001-l06-p057/canvas-v1/canvas-renderer-draft.js",
    "bytes": 11006951,
    "sha256": "b2d839c31d4907b168e45a2607896f714731b88943d3cb93b10b11528634b401"
  }
];
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P057_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered function walkthrough after formal P056. */
export function algL6P057CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p057LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TS/L6TS08.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TS08.mp3'].entries())
  readPin(P057_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]);
 demand(model.animationId===ID&&model.runtime.mainFrames===856&&model.runtime.mainSpriteId===312&&model.streams.length===9&&isDeepStrictEqual(model.answerPlacements.map((r:{instance:string;branch:string})=>[r.instance,r.branch]),[['AnsBtn1','right'],['AnsBtn2','wrong'],['AnsBtn3','wrong'],['AnsBtn4','wrong']]),'source function walkthrough and four targets');
 const base=algL6P056FormalDescriptor(),target=base.pages[56];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===55&&
  base.pages[55].animationId==='shared-alg001-l06-p056'&&base.pages[55].rendererAvailability.kind==='registered',
  'formally admitted P056 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===57&&target.sectionPageOrdinal===7&&
  target.sectionCode==='TS'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p056'&&
  target.nextPlacementId==='shared-alg001-l06-p058','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[4]),glossary=[...base.glossary];
 demand(crosswalk.entries.length===7,'seven source glossary terms');
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
 const pages=base.pages.map((page,index)=>index!==56?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-312',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p057-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===56&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '55 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p057-source-function-walkthrough-candidate-v1`,
  calibrationId:'g678-alg-l06-p057-source-function-walkthrough-candidate-v1',releaseId:`${base.releaseId}:p057-source-function-walkthrough-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p057-source-function-walkthrough-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:56})});
}
