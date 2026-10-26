import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P046FormalDescriptor} from './alg-l06-p046-formal-admission-v1.server';
import {P047_ID as ID,P047_SOURCE_ROOT,p047LocalDevelopment} from './alg-l06-p047-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P047 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p047/source-v1/L6TI07.swf",
    "bytes": 272387,
    "sha256": "7fdbb16bcea020b3a28ada7d0bfbed26d077b339a914a86f493feb6827a9e893"
  },
  {
    "path": "migrations/shared-alg001-l06-p047/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p047/source-v1/L6TI07.mp3",
    "bytes": 196560,
    "sha256": "88e7c0f01e0569f5c8c828561669c87b4e468dbd218deca399db09bdb418448e"
  },
  {
    "path": "migrations/shared-alg001-l06-p047/native-v1/source-model-v1.json",
    "bytes": 622658,
    "sha256": "5b67c6c758f069a080e300ca3b30db9bdc76eee838fe3c3cde8c38851ae3f1b9"
  },
  {
    "path": "migrations/shared-alg001-l06-p047/native-v1/native-bindings-v1.json",
    "bytes": 6356,
    "sha256": "f59f4072720004ed23d4e1ffe0275f7d80c314aa003722bb3d7df85e694f8d61"
  },
  {
    "path": "migrations/shared-alg001-l06-p047/native-v1/eight-term-crosswalk-v1.json",
    "bytes": 12075,
    "sha256": "d1c0427ffb572b31d4e0640da87ac0f610c5927fd7de5f9235e14f40bde482fa"
  },
  {
    "path": "migrations/shared-alg001-l06-p047/canvas-v1/canvas-renderer-draft.js",
    "bytes": 5077928,
    "sha256": "d959f374bb092f72efb20b8a80695539c681edbcbc0ab5e55d4f79483fe7eaf7"
  }
] as const;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P047_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered five-value matching candidate after formal P046. */
export function algL6P047CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p047LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TI/L6TI07.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TI07.mp3'].entries())
  readPin(P047_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]),binding=readJsonPin(root,workspacePins[4]);
 demand(model.animationId===ID&&model.placement.ordinal===47&&model.placement.sectionOrdinal===6&&
  model.runtime.mainSpriteId===117&&model.runtime.mainFrames===890&&model.runtime.quizFrame===208&&
  binding.sourceSwfSha256===workspacePins[0].sha256&&binding.sourceModelSha256===workspacePins[3].sha256&&
  isDeepStrictEqual(model.drags.map((row:{id:number;value:string})=>[row.id,row.value]),
   [[1,'6'],[2,'–3'],[3,'0'],[4,'–4'],[5,'6']]),'source drag identity and timeline');
 const base=algL6P046FormalDescriptor(),target=base.pages[46];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===49&&
  base.pages[45].animationId==='shared-alg001-l06-p046'&&base.pages[45].rendererAvailability.kind==='registered',
  'formally admitted P046 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===47&&target.sectionPageOrdinal===6&&
  target.sectionCode==='TI'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p046'&&
  target.nextPlacementId==='shared-alg001-l06-p048','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[5]),glossary=[...base.glossary];
 demand(crosswalk.entries.length===8,'eight source glossary terms');
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
 const pages=base.pages.map((page,index)=>index!==46?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-117',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p047-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===50&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '49 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p047-source-matching-candidate-v1`,
  calibrationId:'g678-alg-l06-p047-source-matching-candidate-v1',releaseId:`${base.releaseId}:p047-source-matching-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p047-source-matching-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:50})});
}
