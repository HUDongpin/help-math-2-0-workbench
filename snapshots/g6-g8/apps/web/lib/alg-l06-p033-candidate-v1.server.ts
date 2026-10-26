import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P050FormalDescriptor} from './alg-l06-p050-formal-admission-v1.server';
import {P033_ID as ID,P033_SOURCE_ROOT,p033LocalDevelopment} from './alg-l06-p033-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P033 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p033/source-v1/L6IN05.swf",
    "bytes": 472620,
    "sha256": "fb11fd842f3f0948cf5b00bf3b7b63bde86f0af9bf41bb2f9e3a762a1daad071"
  },
  {
    "path": "migrations/shared-alg001-l06-p033/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p033/source-v1/L6IN05.mp3",
    "bytes": 173040,
    "sha256": "172f4d7a8f90e4e3d98487048eae702fdd4debf6706248d705f5c5dc55008220"
  },
  {
    "path": "migrations/shared-alg001-l06-p033/native-v1/source-model-v1.json",
    "bytes": 255362,
    "sha256": "ee17508b0ce795e1d4eab49686f293e3d24a7bfeaec58c8b8caf3681695510fa"
  },
  {
    "path": "migrations/shared-alg001-l06-p033/native-v1/four-term-crosswalk-v1.json",
    "bytes": 6501,
    "sha256": "d5ee758da0c2b2724d5e6847b8ec52e9dd793eac521d5056376c42cd5ac2d816"
  },
  {
    "path": "migrations/shared-alg001-l06-p033/canvas-v1/canvas-renderer-draft.js",
    "bytes": 2553292,
    "sha256": "750d595b47eb3aa518df51e3b9bbb552e8fe27c8ff0a6a4d23d464fca615f465"
  }
]
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P033_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered four-choice ordered pairs candidate after formal P050. */
export function algL6P033CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p033LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/IN/L6IN05.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6IN05.mp3'].entries())
  readPin(P033_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]);
 demand(model.animationId===ID&&model.mainFrames===385&&isDeepStrictEqual(model.answerPlacements.map((r:{letter:string;answer:number})=>[r.letter,r.answer]),[['A',1],['B',2],['C',3],['D',4]]),'source ordered pairs and four targets');
 const base=algL6P050FormalDescriptor(),target=base.pages[32];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===53&&
  base.pages[49].animationId==='shared-alg001-l06-p050'&&base.pages[49].rendererAvailability.kind==='registered',
  'formally admitted P050 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===33&&target.sectionPageOrdinal===4&&
  target.sectionCode==='IN'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p032'&&
  target.nextPlacementId==='shared-alg001-l06-p034','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[4]),glossary=[...base.glossary];
 demand(crosswalk.entries.length===4,'four source glossary terms');
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
 const pages=base.pages.map((page,index)=>index!==32?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-190',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p033-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===54&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '53 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p033-source-ordered-pairs-candidate-v1`,
  calibrationId:'g678-alg-l06-p033-source-ordered-pairs-candidate-v1',releaseId:`${base.releaseId}:p033-source-ordered-pairs-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p033-source-ordered-pairs-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:54})});
}
