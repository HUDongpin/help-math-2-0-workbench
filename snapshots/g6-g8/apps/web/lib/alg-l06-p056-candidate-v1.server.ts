import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P033FormalDescriptor} from './alg-l06-p033-formal-admission-v1.server';
import {P056_ID as ID,P056_SOURCE_ROOT,p056LocalDevelopment} from './alg-l06-p056-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P056 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p056/source-v1/L6TS07.swf",
    "bytes": 771707,
    "sha256": "ba6ba691fafbc6bbd2d0a14b4d249c59e7f1569ca8aaddaa778957c6120205d1"
  },
  {
    "path": "migrations/shared-alg001-l06-p056/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p056/source-v1/L6TS07.mp3",
    "bytes": 109536,
    "sha256": "5cc8952addd8da05969c88bee6c1f2563a968056ac787d2cd7a7070e4434ceec"
  },
  {
    "path": "migrations/shared-alg001-l06-p056/native-v1/source-model-v1.json",
    "bytes": 2119467,
    "sha256": "e41e8877a173cf62bbdb5356b273c61bdd78ac07841c813123d82927fd1eab98"
  },
  {
    "path": "migrations/shared-alg001-l06-p056/native-v1/eleven-term-crosswalk-v1.json",
    "bytes": 16655,
    "sha256": "44051dc34c0a4ecc19ab1f19d01fd0dacb858ccb8ec9e525190309e57d61b9ed"
  },
  {
    "path": "migrations/shared-alg001-l06-p056/canvas-v1/canvas-renderer-draft.js",
    "bytes": 9057010,
    "sha256": "9d0fa77a8c1339a4e559a76187c782167d6f351bdc3bae7ff4c3917c42847416"
  }
];
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P056_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered function walkthrough after formal P033. */
export function algL6P056CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p056LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TS/L6TS07.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TS07.mp3'].entries())
  readPin(P056_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]);
 demand(model.animationId===ID&&model.runtime.mainFrames===818&&model.runtime.mainSpriteId===305&&model.streams.length===9&&isDeepStrictEqual(model.answerPlacements.map((r:{instance:string;branch:string})=>[r.instance,r.branch]),[['AnsBtn1','right'],['AnsBtn2','wrong'],['AnsBtn3','wrong'],['AnsBtn4','wrong']]),'source function walkthrough and four targets');
 const base=algL6P033FormalDescriptor(),target=base.pages[55];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===54&&
  base.pages[32].animationId==='shared-alg001-l06-p033'&&base.pages[32].rendererAvailability.kind==='registered',
  'formally admitted P033 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===56&&target.sectionPageOrdinal===6&&
  target.sectionCode==='TS'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p055'&&
  target.nextPlacementId==='shared-alg001-l06-p057','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[4]),glossary=[...base.glossary];
 demand(crosswalk.entries.length===11,'eleven source glossary terms');
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
 const pages=base.pages.map((page,index)=>index!==55?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-305',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p056-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===55&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '54 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p056-source-function-walkthrough-candidate-v1`,
  calibrationId:'g678-alg-l06-p056-source-function-walkthrough-candidate-v1',releaseId:`${base.releaseId}:p056-source-function-walkthrough-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p056-source-function-walkthrough-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:55})});
}
