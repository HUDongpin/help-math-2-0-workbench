import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P048FormalDescriptor} from './alg-l06-p048-formal-admission-v1.server';
import {P049_ID as ID,P049_SOURCE_ROOT,p049LocalDevelopment} from './alg-l06-p049-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P049 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p049/source-v1/L6TI09.swf",
    "bytes": 251429,
    "sha256": "33f90f5897fa60939fb7015f60c8789d98aad3dca65ad39cb04dac4fededb3a6"
  },
  {
    "path": "migrations/shared-alg001-l06-p049/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p049/source-v1/L6TI09.mp3",
    "bytes": 111888,
    "sha256": "936b059a5355877c47f2bda90da6d4de47d7145371d97ef50cd9f1e267254150"
  },
  {
    "path": "migrations/shared-alg001-l06-p049/native-v1/source-model-v2.json",
    "bytes": 506774,
    "sha256": "8faf55033928e8449c96fe3a9c1a7504b7f119119f2f90a4f81d8caf309b11ff"
  },
  {
    "path": "migrations/shared-alg001-l06-p049/native-v1/native-bindings-v3.json",
    "bytes": 11243,
    "sha256": "255894534042bc080aab855bca632f998e466d62269052094f3e10631c3d8fe6"
  },
  {
    "path": "migrations/shared-alg001-l06-p049/native-v1/four-term-crosswalk-v1.json",
    "bytes": 5810,
    "sha256": "cc306a2598fb4d6f9561f729de9f714046f4925623cdb34a61538dbc44c54ed5"
  },
  {
    "path": "migrations/shared-alg001-l06-p049/canvas-v2/canvas-renderer-draft.js",
    "bytes": 2324462,
    "sha256": "298611af1cccf27353df77f9b4d7b4fdbebe7992e1d0950c974dba83a85fc3d3"
  }
] as const;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P049_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered four-choice function table candidate after formal P048. */
export function algL6P049CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p049LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TI/L6TI09.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TI09.mp3'].entries())
  readPin(P049_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]),binding=readJsonPin(root,workspacePins[4]);
 demand(model.animationId===ID&&model.placement.ordinal===49&&model.placement.sectionOrdinal===8&&
  model.runtime.mainSpriteId===327&&model.runtime.mainFrames===401&&model.runtime.quizFrame===159&&
  model.runtime.resumeFrame===160&&model.runtime.terminalFrame===401&&
  binding.sourceSha256===workspacePins[0].sha256&&binding.sourceModelSha256===workspacePins[3].sha256&&
  isDeepStrictEqual(Object.entries(binding.options).map(([letter,row])=>[letter,(row as {branch:string}).branch]),
   [['A','wrong4'],['B','right4'],['C','wrong4'],['D','wrong4']]),'source choices and timeline');
 const base=algL6P048FormalDescriptor(),target=base.pages[48];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===51&&
  base.pages[47].animationId==='shared-alg001-l06-p048'&&base.pages[47].rendererAvailability.kind==='registered',
  'formally admitted P048 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===49&&target.sectionPageOrdinal===8&&
  target.sectionCode==='TI'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p048'&&
  target.nextPlacementId==='shared-alg001-l06-p050','one source-ordered occurrence');
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,workspacePins[5]),glossary=[...base.glossary];
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
 const pages=base.pages.map((page,index)=>index!==48?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-327',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p049-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===52&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '51 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p049-source-table-candidate-v1`,
  calibrationId:'g678-alg-l06-p049-source-table-candidate-v1',releaseId:`${base.releaseId}:p049-source-table-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p049-source-table-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:52})});
}
