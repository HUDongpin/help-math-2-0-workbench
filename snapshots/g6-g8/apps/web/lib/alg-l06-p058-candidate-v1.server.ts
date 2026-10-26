import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P057FormalDescriptor} from './alg-l06-p057-formal-admission-v1.server';
import {P058_ID as ID,P058_SOURCE_ROOT,p058LocalDevelopment} from './alg-l06-p058-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P058 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p058/source-v1/L6TS09.swf",
    "bytes": 605394,
    "sha256": "79bd9d4896d7b297a4df928711c92f1bd2b9f78b976f8399fc9e640d9704c4d3"
  },
  {
    "path": "migrations/shared-alg001-l06-p058/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p058/source-v1/L6TS09.mp3",
    "bytes": 167328,
    "sha256": "5e3fa2f4bfc3c534102315ec592c9547b667fb5d19198f2d653a3c9768636c7a"
  },
  {
    "path": "migrations/shared-alg001-l06-p058/native-v1/source-model-v1.json",
    "bytes": 2190983,
    "sha256": "0241cb5d6f0427442f56d6ac9a5188e56f9c2a7394134ab2b897092003f22c04"
  },
  {
    "path": "migrations/shared-alg001-l06-p058/native-v1/three-term-crosswalk-v1.json",
    "bytes": 4627,
    "sha256": "5c61bc23361a48b3760c2d03b1550ebff9b6e2fd25250688c361907664e77baf"
  },
  {
    "path": "migrations/shared-alg001-l06-p058/canvas-v1/canvas-renderer-draft.js",
    "bytes": 11258560,
    "sha256": "bd89e6fa6d8209ae0fe12c0a1388cac2944122e8d01d6491c3fb5db4cefb1494"
  }
];
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P058_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered function walkthrough after formal P057. */
export function algL6P058CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p058LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TS/L6TS09.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TS09.mp3'].entries())
  readPin(P058_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]);
 demand(model.animationId===ID&&model.runtime.mainFrames===951&&model.runtime.mainSpriteId===285&&model.streams.length===9&&isDeepStrictEqual(model.answerPlacements.map((r:{instance:string;branch:string})=>[r.instance,r.branch]),[['AnsBtn1','right'],['AnsBtn2','wrong'],['AnsBtn3','wrong'],['AnsBtn4','wrong']]),'source function walkthrough and four targets');
 const base=algL6P057FormalDescriptor(),target=base.pages[57];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===56&&
  base.pages[56].animationId==='shared-alg001-l06-p057'&&base.pages[56].rendererAvailability.kind==='registered',
  'formally admitted P057 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===58&&target.sectionPageOrdinal===8&&
  target.sectionCode==='TS'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p057'&&
  target.nextPlacementId==='shared-alg001-l06-p059','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[4]),glossary=[...base.glossary];
 demand(crosswalk.entries.length===3,'three source glossary terms');
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
 const pages=base.pages.map((page,index)=>index!==57?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-285',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p058-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===57&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '56 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p058-source-function-walkthrough-candidate-v1`,
  calibrationId:'g678-alg-l06-p058-source-function-walkthrough-candidate-v1',releaseId:`${base.releaseId}:p058-source-function-walkthrough-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p058-source-function-walkthrough-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:57})});
}
