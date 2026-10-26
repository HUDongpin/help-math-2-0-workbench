import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P044FormalDescriptor} from './alg-l06-p044-formal-admission-v1.server';
import {P045_ID as ID,P045_SOURCE_ROOT,p045LocalDevelopment} from './alg-l06-p045-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p045/source-v1/L6TI05.swf",
    "bytes": 783221,
    "sha256": "9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/source-v1/L6TI05.mp3",
    "bytes": 321216,
    "sha256": "99404ff17adb3498bf64c033a3063077f3dce961ca52dfc8074f8f84f33dc7e7"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/source-v1/source-intake-v2.json",
    "bytes": 7046,
    "sha256": "16a061cb1731af7bf6747a67125a36be8b42e78fe89789b5b0628d8dfd03aa06"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/native-v1/answer-hit-geometry-v2.json",
    "bytes": 4051,
    "sha256": "4e863169c16e7f2f0404b2ecc360b1404bf42347c20c70a46dca0c5dddfe96ad"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/native-v1/native-model-v2.json",
    "bytes": 2133255,
    "sha256": "69915928cb0e08838a326e737da2847fb9020d39ceaae49890791a7e53f77814"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/native-v1/native-bindings-v1.json",
    "bytes": 6631,
    "sha256": "feb076bd3eb4689beab49be74a461a64f2dd182021a732da6dd8d3aca35e0a83"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/canvas-v1/canvas-renderer-draft.js",
    "bytes": 3986817,
    "sha256": "4e9e318fdd503275e8d89b1b462b7e525888f0b0c14ecad3d6c114d18c7d5bc0"
  },
  {
    "path": "migrations/shared-alg001-l06-p045/audio-source-v1/browser-readback-v1.json",
    "bytes": 3831,
    "sha256": "5fc56a2122139f0215d14e69011e62960aef08a7a65abd52257f611a390795ea"
  }
] as const;
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error('P045_SOURCE_CANDIDATE_INVALID: '+reason)};
const GLOSSARY_PIN={path:'migrations/shared-alg001-l06-p045/native-v1/seven-term-crosswalk-v1.json',
 bytes:10372,sha256:'2fbf0d0ec42bfdaacbfba0a9e551654d3b633b073e1993d8a367c8b2d706332c'};

/** P045 source graph candidate added to the formally admitted P044 lesson. */
export function algL6P045CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p045LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();
 for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/TI/L6TI05.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6TI05.mp3'].entries())
  readPin(P045_SOURCE_ROOT,{...workspacePins[index],path});
 const audit=readJsonPin(root,workspacePins[3]),geometry=readJsonPin(root,workspacePins[4]),
  native=readJsonPin(root,workspacePins[5]),bindings=readJsonPin(root,workspacePins[6]),
  decode=readJsonPin(root,workspacePins[8]);
 demand(audit.animationId===ID&&audit.globalOrdinal===45&&audit.sectionPageOrdinal===4&&
  audit.namedPlacement.mainSprite===350&&audit.namedPlacement.correctButton==='C'&&
  audit.namedPlacement.wrongFeedbackSprite===307&&audit.namedPlacement.rightFeedbackSprite===220&&
  audit.sourceBehavior.quizHoldFrame===53&&audit.sourceBehavior.mainEndHoldFrame===167,
  'physical occurrence and source actions');
 demand(geometry.animationId===ID&&geometry.correctChoice==='C'&&geometry.quizHoldFrame===53&&
  native.root.animationSpriteId===350&&native.quiz.holdFrame===53&&
  bindings.source.physicalSwfSha256===workspacePins[0].sha256&&
  bindings.wrong4.popupFirstFrame===16&&bindings.wrong4.holdFrame===22&&
  isDeepStrictEqual(geometry.answerPlacements.map((r:{label:string;instance:string;buttonId:number})=>
   [r.label,r.instance,r.buttonId]),[['A','AnsBtn1',177],['B','AnsBtn3',177],['C','AnsBtn2',178],['D','AnsBtn4',177]])&&
  isDeepStrictEqual(Object.entries(bindings.options).map(([k,v])=>[k,(v as {branch:string}).branch]),
   [['A','wrong4'],['B','wrong4'],['C','right4'],['D','wrong4']]),'visible source letters and graph hit zones');
 demand(decode.status==='all-four-decoded'&&decode.playbackInvoked===false&&decode.results.length===4&&
  decode.results.every((r:{compressedPinMatched:boolean;decodedAtExpectedRate:boolean})=>
   r.compressedPinMatched&&r.decodedAtExpectedRate),'decode-only source audio');
 const base=algL6P044FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===47&&
  base.pages[43].animationId==='shared-alg001-l06-p044'&&base.pages[43].rendererAvailability.kind==='registered',
  'formally admitted P044 predecessor');
 const target=base.pages[44];
 demand(target.animationId===ID&&target.globalPageOrdinal===45&&target.sectionPageOrdinal===4&&
  target.sectionCode==='TI'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p044'&&
  target.nextPlacementId==='shared-alg001-l06-p046','one source-ordered P045 occurrence');
 const terms=[['function','Function'],['graph','Graph'],['represent','Represent'],['vertical','Vertical'],
  ['line','Line'],['point','Point'],['vertical-line-test','Vertical-line test']];
 readPin(DICTIONARY_ROOT,DICTIONARY_EN);readPin(DICTIONARY_ROOT,DICTIONARY_ES);
 const crosswalk=readJsonPin(root,GLOSSARY_PIN),glossary=[...base.glossary];
 for(const [id,key] of terms){
  const rows=crosswalk.entries.filter((r:PageOnlyLessonGlossaryEntry)=>r.id===id&&r.sourceKeyAttribute===key);
  demand(rows.length===1,'one source glossary key '+key);
  const row=rows[0],existing=glossary.filter(r=>r.sourceKeyAttribute===key);
  demand(existing.length<=1,'unambiguous existing glossary '+key);
  if(existing.length)demand(isDeepStrictEqual(existing[0].labels,row.labels)&&
   isDeepStrictEqual(existing[0].definitions,row.definitions),'matching source definitions '+key);
  else{
   demand(key==='Represent'&&!glossary.some(r=>r.id===id),'only missing Represent entry');
   glossary.push(Object.freeze({id,sourceKeyAttribute:key,labels:Object.freeze({...row.labels}),
    definitions:Object.freeze({...row.definitions}),source:Object.freeze({...row.source})}) as PageOnlyLessonGlossaryEntry);
  }
 }
 demand(glossary.length===base.glossary.length+1,'one source glossary addition');
 const pages=base.pages.map((page,index)=>index!==44?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-350',language:'fixed-en' as const,
    scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p045-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===48&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '47 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p045-source-graph-candidate-v1`,
  calibrationId:'g678-alg-l06-p045-source-graph-candidate-v1',
  releaseId:`${base.releaseId}:p045-source-graph-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p045-source-graph-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:48})});
}
