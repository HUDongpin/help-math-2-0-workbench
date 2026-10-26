import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P047FormalDescriptor} from './alg-l06-p047-formal-admission-v1.server';
import {P048_ID as ID,P048_SOURCE_ROOT,p048LocalDevelopment} from './alg-l06-p048-preview-policy-v1';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P048 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p048/source-v1/L6TI08.swf",
    "bytes": 829399,
    "sha256": "03a8334e6349a9e80b47bdea4d2c5ada40f635570be5d63f70e8706a03761780"
  },
  {
    "path": "migrations/shared-alg001-l06-p048/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p048/source-v1/L6TI08.mp3",
    "bytes": 192528,
    "sha256": "b76a62e5c4af35ab3ba277c2e186bf2d148a319b63c8fe9a9f954ae15057e5fd"
  },
  {
    "path": "migrations/shared-alg001-l06-p048/native-v1/source-model-v1.json",
    "bytes": 482931,
    "sha256": "adc0ba402c265deb7fa3fb9c06ce1d68454ea8ef5eaa15fa2842b12989ffda5b"
  },
  {
    "path": "migrations/shared-alg001-l06-p048/native-v1/native-bindings-v2.json",
    "bytes": 19680,
    "sha256": "b935c1eecb2c60ed5c800e942cdc412b12720a24560027b8c69e5be69c88b808"
  },
  {
    "path": "migrations/shared-alg001-l06-p048/native-v1/four-term-crosswalk-v1.json",
    "bytes": 5993,
    "sha256": "15e9e6101af5a4ade72cb128e37eefa065dd42aae588a207a188cd31d340d35b"
  },
  {
    "path": "migrations/shared-alg001-l06-p048/canvas-v2/canvas-renderer-draft.js",
    "bytes": 3681992,
    "sha256": "a27fa6d830bab0f90c653e62f89e069c2301b570a7e34e309592bbf552e0733f"
  }
] as const;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P048_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered four-choice graph candidate after formal P047. */
export function algL6P048CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p048LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TI/L6TI08.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TI08.mp3'].entries())
  readPin(P048_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]),binding=readJsonPin(root,workspacePins[4]);
 demand(model.animationId===ID&&model.placement.ordinal===48&&model.placement.sectionOrdinal===7&&
  model.runtime.mainSpriteId===348&&model.runtime.mainFrames===327&&model.runtime.quizFrame===224&&
  model.runtime.resumeFrame===225&&model.runtime.terminalFrame===327&&
  binding.sourceSha256===workspacePins[0].sha256&&binding.sourceModelSha256===workspacePins[3].sha256&&
  isDeepStrictEqual(Object.entries(binding.options).map(([letter,row])=>[letter,(row as {branch:string}).branch]),
   [['A','right4'],['B','wrong4'],['C','wrong4'],['D','wrong4']]),'source choices and timeline');
 const base=algL6P047FormalDescriptor(),target=base.pages[47];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===50&&
  base.pages[46].animationId==='shared-alg001-l06-p047'&&base.pages[46].rendererAvailability.kind==='registered',
  'formally admitted P047 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===48&&target.sectionPageOrdinal===7&&
  target.sectionCode==='TI'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p047'&&
  target.nextPlacementId==='shared-alg001-l06-p049','one source-ordered occurrence');
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
 const pages=base.pages.map((page,index)=>index!==47?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-348',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p048-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===51&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '50 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p048-source-graph-candidate-v1`,
  calibrationId:'g678-alg-l06-p048-source-graph-candidate-v1',releaseId:`${base.releaseId}:p048-source-graph-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p048-source-graph-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:51})});
}
