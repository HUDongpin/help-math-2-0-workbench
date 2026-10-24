import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P042FormalDescriptor} from './alg-l06-p042-formal-admission-v1.server';
import {P043_ID as ID,P043_SOURCE_ROOT,p043LocalDevelopment}
 from './alg-l06-p043-preview-policy-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const SHA='8bec405895d09cc8f7dd9f0da197f67726cb45cab6cc8dec3d15b103bc04a97b';
const XML='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const SA='dfd986d3c9d1615b2456c5a9b5ebc2d24ab3b5d22f1b1d6f20df9aa886fcadf1';
const CANVAS='4ef3fd48ec83ba97542791832682e0a14aabec52611d7a4f6f0750e5b4852de5';
const workspacePins=[
 {path:'migrations/shared-alg001-l06-p043/source-v1/TI/L6TI03.swf',bytes:855977,sha256:SHA},
 {path:'migrations/shared-alg001-l06-p043/source-v1/index.xml',bytes:13926,sha256:XML},
 {path:'migrations/shared-alg001-l06-p043/source-v1/SA/L6TI03.mp3',bytes:151200,sha256:SA},
 {path:'migrations/shared-alg001-l06-p043/audit-v1/source-intake-v1.json',bytes:6957,
  sha256:'1cfc2954ef13aa4bc786f52fb78752369f85f413d3713ee68217453e1749f13e'},
 {path:'migrations/shared-alg001-l06-p043/native-v1/native-model-v1.json',bytes:1639926,
  sha256:'158cc7f897d0d23fd55ca87536fba851080e0c26996d69a43eb9e910ce5dae9c'},
 {path:'migrations/shared-alg001-l06-p043/native-v1/native-bindings-v1.json',bytes:6722,
  sha256:'220ad3977f3c63c1e1ebcb3b545d7e3fbdefc5c0dbe6e36df157814004ea5f0c'},
 {path:'migrations/shared-alg001-l06-p043/canvas-v1/canvas-renderer.js',bytes:3304890,
  sha256:CANVAS},
 {path:'migrations/shared-alg001-l06-p043/behavior-v1/source-glossary-additions-v1.json',
  bytes:2632,sha256:'7e68960f868dea4d0f0007dea898cab7738d4e00f49c28174bd7279276262686'},
] as const;
const physicalPins=[
 {path:'G6-G8-shared/ALG001/L6/TI/L6TI03.swf',bytes:855977,sha256:SHA},
 {path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:XML},
 {path:'G6-G8-shared/ALG001/L6/SA/L6TI03.mp3',bytes:151200,sha256:SA},
] as const;
const demand=(ok:unknown,reason:string)=>{
 if(!ok)throw Error('P043_VISUAL_CANDIDATE_INVALID: '+reason);
};

/** Source-locked local projection, shared by the pre-admission and formal host. */
export function algL6P043CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p043LocalDevelopment(),'exact local source and development scope');
 const root=getWorkspaceRoot();
 for(const pin of physicalPins)readPin(P043_SOURCE_ROOT,pin);
 for(const pin of workspacePins)readPin(root,pin);
 const audit=readJsonPin(root,workspacePins[3]),
  native=readJsonPin(root,workspacePins[4]),
  bindings=readJsonPin(root,workspacePins[5]),
  glossary=readJsonPin(root,workspacePins[7]);
 demand(audit.identity.animationId===ID&&audit.identity.globalOrdinal===43&&
  audit.identity.sectionPageOrdinal===2&&
  audit.identity.flaStatus==='no-same-placement-FLA-found'&&
  audit.physicalFiles.some((row:{sha256:string})=>row.sha256===SHA),
  'source occurrence and preserved source');
 demand(native.animationId===ID&&native.root.animationSpriteId===342&&
  native.quiz.holdFrame===62&&native.quiz.answerPlacements.length===4&&
  bindings.animationId===ID&&bindings.quizFrame===62&&
  bindings.source.physicalSwfSha256===SHA&&
  isDeepStrictEqual(Object.entries(bindings.options).map(
   ([letter,row])=>[letter,(row as {sourceValue:string}).sourceValue]),[
    ['A','$137.75'],['B','$160.52'],['C','$185.52'],['D','$580.52']]),
  'native answer and frame mapping');
 demand(glossary.animationId===ID&&glossary.sourceSwfSha256===SHA&&
  isDeepStrictEqual(glossary.entries.map((e:{id:string;sourceKeyAttribute:string})=>
   [e.id,e.sourceKeyAttribute]),[['equation','Equation'],['estimate','Estimate']])&&
  glossary.originalRuntimeBehaviorAccepted===false,
  'source glossary terms and open runtime gate');
 const base=algL6P042FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===45&&
  base.pages[41].animationId==='shared-alg001-l06-p042'&&
  base.pages[41].rendererAvailability.kind==='registered',
  'exact formally admitted predecessor');
 const target=base.pages[42];
 demand(target.animationId===ID&&target.globalPageOrdinal===43&&
  target.sectionCode==='TI'&&target.sectionPageOrdinal===2&&
  target.source.assetId===`swf-${SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p042'&&
  target.nextPlacementId==='shared-alg001-l06-p044',
  'source-ordered unregistered occurrence');
 const [equation,estimate]=glossary.entries as PageOnlyLessonGlossaryEntry[];
 const priorEquation=base.glossary.find(row=>row.id==='equation');
 demand(priorEquation&&
  isDeepStrictEqual(priorEquation.labels,equation.labels)&&
  isDeepStrictEqual(priorEquation.definitions,equation.definitions)&&
  isDeepStrictEqual(priorEquation.source,equation.source)&&
  !base.glossary.some(row=>row.id==='estimate'),
  'reuse exact existing Equation and add only Estimate');
 const pages=base.pages.map((page,index)=>index!==42?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-342',language:'fixed-en' as const,
    scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p043-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===46&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '45 predecessor pages and one source-audio P043 projection');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:p043-source-audio-candidate-v1`,
  calibrationId:'g678-alg-l06-p043-source-audio-candidate-v1',
  releaseId:`${base.releaseId}:p043-source-audio-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p043-source-audio-candidate-v1`}),
  pages:Object.freeze(pages),
  glossary:Object.freeze([...base.glossary,Object.freeze({id:estimate.id,
   sourceKeyAttribute:estimate.sourceKeyAttribute,labels:estimate.labels,
   definitions:estimate.definitions,source:estimate.source})]),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:46})});
}
