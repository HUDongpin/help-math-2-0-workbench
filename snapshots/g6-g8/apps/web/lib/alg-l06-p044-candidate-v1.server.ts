import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P043FormalDescriptor} from './alg-l06-p043-formal-admission-v1.server';
import {P044_ID as ID,P044_SOURCE_ROOT,p044LocalDevelopment}
 from './alg-l06-p044-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const SHA='50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34';
const XML='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const SA='11784e80c090326e9d4f2863ae54d1bcd25d454a4e325d76516f415e377e3abb';
const CANVAS='26a7c58ba4f7ce018ffd8d1f552ecb8d63fa6d480eef7721a14cd8ba36cce01b';
const workspacePins=[
 {path:'migrations/shared-alg001-l06-p044/source-v1/TI/L6TI04.swf',bytes:657336,sha256:SHA},
 {path:'migrations/shared-alg001-l06-p044/source-v1/index.xml',bytes:13926,sha256:XML},
 {path:'migrations/shared-alg001-l06-p044/source-v1/SA/L6TI04.mp3',bytes:258384,sha256:SA},
 {path:'migrations/shared-alg001-l06-p044/audit-v1/source-intake-v2.json',bytes:7391,
  sha256:'7b74d697f4a4e0a43adf2b6bdd5506911ed0f5fa7468a77f4705f0dbacca06e2'},
 {path:'migrations/shared-alg001-l06-p044/audit-v1/answer-hit-geometry-v1.json',bytes:4833,
  sha256:'a90e3de91e099e4701c47fc994c9ad215e05875949cbf2b85262d958af5de07f'},
 {path:'migrations/shared-alg001-l06-p044/native-v1/native-model-v1.json',bytes:1532293,
  sha256:'1858dced6c07862f2f06d98946aabda464c5da6fe5ee90d2d4dc14a22d6979e5'},
 {path:'migrations/shared-alg001-l06-p044/native-v1/native-bindings-v1.json',bytes:5994,
  sha256:'d803b8a65c1d52530dead0bbe742af776c6e8b8adb651609473ef8b8c041f37b'},
 {path:'migrations/shared-alg001-l06-p044/behavior-v1/interaction-map-v1.json',bytes:5474,
  sha256:'c08124f624a2764fc8f4b0775f1cec6437c56321a9adaa5d7c07be3c7bd6dd91'},
 {path:'migrations/shared-alg001-l06-p044/canvas-v1/canvas-renderer.js',bytes:2576275,
  sha256:CANVAS},
 {path:'migrations/shared-alg001-l06-p044/audio-source-v1/browser-readback-v1.json',bytes:3833,
  sha256:'022e0baef5caeac5ad4977329ca59f796af502ceca023209d8e48db12b74db6f'},
] as const;
const physicalPins=[
 {path:'G6-G8-shared/ALG001/L6/TI/L6TI04.swf',bytes:657336,sha256:SHA},
 {path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:XML},
 {path:'G6-G8-shared/ALG001/L6/SA/L6TI04.mp3',bytes:258384,sha256:SA},
] as const;
const demand=(ok:unknown,reason:string)=>{
 if(!ok)throw Error('P044_SOURCE_CANDIDATE_INVALID: '+reason);
};

/** Local source-pinned P044 projection on the proof-backed P043 lesson. */
export function algL6P044CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p044LocalDevelopment(),'exact local development and source root');
 const root=getWorkspaceRoot();
 for(const pin of physicalPins)readPin(P044_SOURCE_ROOT,pin);
 for(const pin of workspacePins)readPin(root,pin);
 const audit=readJsonPin(root,workspacePins[3]),
  geometry=readJsonPin(root,workspacePins[4]),
  native=readJsonPin(root,workspacePins[5]),
  bindings=readJsonPin(root,workspacePins[6]),
  behavior=readJsonPin(root,workspacePins[7]),
  decode=readJsonPin(root,workspacePins[9]);
 demand(audit.animationId===ID&&audit.globalOrdinal===44&&
  audit.sectionPageOrdinal===3&&audit.samePathFlaPresent===false&&
  audit.namedFeedbackPlacement.wrong4.spriteId===336&&
  audit.namedFeedbackPlacement.right4.spriteId===198&&
  audit.physicalFiles.some((row:{sha256:string})=>row.sha256===SHA),
  'corrected physical source occurrence');
 demand(geometry.animationId===ID&&geometry.mainSprite===354&&
  geometry.quizHoldFrame===53&&geometry.answerPlacements.length===4&&
  geometry.browserHitParityAccepted===false&&
  native.animationId===ID&&native.root.animationSpriteId===354&&
  native.quiz.holdFrame===53&&bindings.animationId===ID&&
  bindings.quizFrame===53&&bindings.source.physicalSwfSha256===SHA&&
  isDeepStrictEqual(Object.entries(bindings.options).map(
   ([letter,row])=>[letter,(row as {sourceValue:string}).sourceValue]),[
    ['A','{(0, –1), (0, 0), (0, 1)}'],
    ['B','{(5, 1), (10, 1), (15, 1)}'],
    ['C','{(2, –2), (2, 0), (–2, 0)}'],
    ['D','{(–5, –4), (–4, –3), (–5, –1)}']]),
  'source answer and geometry binding');
 demand(behavior.animationId===ID&&behavior.main.mainSprite===354&&
  behavior.main.wrongFeedbackSprite===336&&
  behavior.main.rightFeedbackSprite===198&&
  behavior.sourceStageOnly===true&&
  decode.kind==='g678-p044-browser-decode-readback-v1'&&
  decode.status==='all-four-decoded'&&decode.playbackInvoked===false&&
  decode.results.length===4&&
  decode.results.every((row:{compressedPinMatched:boolean;decodedAtExpectedRate:boolean})=>
   row.compressedPinMatched&&row.decodedAtExpectedRate),
  'source behavior and decode-only audio');
 const base=algL6P043FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===46&&
  base.pages[42].animationId==='shared-alg001-l06-p043'&&
  base.pages[42].rendererAvailability.kind==='registered',
  'exact formally admitted predecessor');
 const target=base.pages[43];
 demand(target.animationId===ID&&target.globalPageOrdinal===44&&
  target.sectionCode==='TI'&&target.sectionPageOrdinal===3&&
  target.source.assetId===`swf-${SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p043'&&
  target.nextPlacementId==='shared-alg001-l06-p045',
  'source-ordered unregistered occurrence');
 const terms=[['relation','Relation'],['set','Set'],
  ['ordered-pair','Ordered pair'],['x-coordinate','X-coordinate'],
  ['function','Function']];
 demand(terms.every(([id,key])=>base.glossary.filter(row=>
  row.id===id&&row.sourceKeyAttribute===key).length===1),
  'existing source-bound glossary terms');
 const pages=base.pages.map((page,index)=>index!==43?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-354',language:'fixed-en' as const,
    scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p044-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===47&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '46 predecessor pages and one P044 candidate projection');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:p044-source-audio-candidate-v1`,
  calibrationId:'g678-alg-l06-p044-source-audio-candidate-v1',
  releaseId:`${base.releaseId}:p044-source-audio-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p044-source-audio-candidate-v1`}),
  pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:47})});
}
