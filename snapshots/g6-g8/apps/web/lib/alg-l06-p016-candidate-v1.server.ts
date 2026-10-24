import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P015FormalDescriptor} from './alg-l06-p015-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p016';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB09.swf',bytes:413745,
 sha256:'2fdeba5b4dcfcfe7d1b575ab30d76a98fca802d6be670a679a54378f32aa4ae9'};
const SA_SOURCE={path:'G6-G8-shared/ALG001/L6/SA/L6VB09.mp3',bytes:468384,
 sha256:'cb2708cdd7be1dde5be7db5bf0487de74e1594d3528eed40cb79ba02a3ed1b6a'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const SOURCE_TIME={path:'output/alg-l06-p016-source-audit-v1/time-resolved-audit-v1.json',
 bytes:61254,sha256:'5a17bae3c4c1a29072a9dbaa048ac34c24bea65cda4e763d02f6e0355c8328d9'};
const SOURCE_XML={path:'migrations/shared-alg001-l06-p016/audit/canvas-v1/source.xml.gz',
 bytes:866127,sha256:'58da7b375dda3e57dc9af9584f8bf3bd8eeb7850b67832fd6e0c85c48eda9440'};
const TEXT={path:'migrations/shared-alg001-l06-p016/audit/text-state-v1/text-state-source-v1.json',
 bytes:20851,sha256:'23ded6a3d40fc2c82885d0fdcc5a68c4e45be92a15d3fb83550e4f196bc301b6'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p016-text-state-v1.ts',
 bytes:23212,sha256:'8076b3f2c4841606819a74b14beafe06d04cd180aa5c7f86f2395ae4b622a226'};
const AUDIO={path:'migrations/shared-alg001-l06-p016/audit/audio-v1/audio-source-audit-v1.json',
 bytes:249118,sha256:'fef22dc59ef37db976efea21921165ead844f92499ae7d5fd0331e3cc2bb001d'};
const SA_COPY={path:'migrations/shared-alg001-l06-p016/audit/audio-v1/separate-sa-source-v1.mp3',
 bytes:468384,sha256:SA_SOURCE.sha256};
const CANVAS={path:'output/alg-l06-p016-canvas-v1/canvas-manifest.json',bytes:5116,
 sha256:'18cab88da6ca723add910b165a81061ef27c4c30b42e1fd3333ba894e9bf515e'};
const RENDERER={path:'output/alg-l06-p016-canvas-v1/canvas-renderer.js',bytes:7477454,
 sha256:'3f6fddbf841d5cac7e28f1112971faed148c89160a8529ba81a30e12ab146b3a'};
const REGISTRY_SHA='aee27f32e3c1f84930f575f45e0b1c5e64b7a78acd92d5fe7195c32512795636';
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P016_CANDIDATE_INVALID: ${reason}`);}

/** One source-bound, unregistered VB6 projection into the real My Lesson descriptor. */
export function algL6P016CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
 const base=algL6P015FormalDescriptor(),root=getWorkspaceRoot(),transaction=readRegistryTransaction(root);
 demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===503&&
  !localOnlyAnimationModuleRegistration(ID)&&!transaction.registry.calibrations.some(
   (row:{entries:{key:string}[]})=>row.entries.some(entry=>entry.key===ID)),
  '503 formal pages; P016 unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===26&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===26&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.glossary.filter(entry=>entry.id==='function').length===1&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'P015 formal predecessor and existing Function glossary');
 readPin(ROOT,SOURCE);readPin(ROOT,SA_SOURCE);readPin(ROOT,XML);
 for(const pin of [SOURCE_XML,RENDERER,NATIVE_STATE,SA_COPY])readPin(root,pin);
 const source=readJsonPin(root,SOURCE_TIME),text=readJsonPin(root,TEXT),
  audio=readJsonPin(root,AUDIO),canvas=readJsonPin(root,CANVAS);
 demand(source.identity.animationId===ID&&source.source.sha256===SOURCE.sha256&&
  source.identity.sourceOccurrence===16&&source.identity.section==='VB'&&
  source.identity.sectionPageOrdinal===6&&source.identity.mainDomain==='sprite-139'&&
  source.identity.mainFrameCount===815&&source.identity.rootEntryFrame===6&&
  source.identity.fps===12&&source.button.characterId===10&&
  source.button.firstPlacementFrame===72&&source.button.firstStaticFullHitFrame===null&&
  source.button.actualClickObserved===false,'static source timing and glossary boundary');
 demand(text.animationId===ID&&text.sourceSwfSha256===SOURCE.sha256&&
  text.source.sha256===SOURCE.sha256&&text.frameDomain==='sprite-139'&&
  text.frameCount===815&&text.fps===12&&text.textDefinitions.length===19&&
  text.functionControl.key==='Function'&&text.functionControl.sourceButtonId===10&&
  text.functionControl.firstCandidateFrame===72&&
  text.functionControl.firstFullHitFrame===null&&
  isDeepStrictEqual(text.functionControl.availableSpans,[[72,815]])&&
  text.policy.canvasGlyphs==='preserved'&&text.policy.originalRuntimeAccepted===false&&
  text.inputs.some((item:{path:string;sha256:string})=>
    item.path===SOURCE_TIME.path&&item.sha256===SOURCE_TIME.sha256),
  'native source text and partially exposed Function hit');
 demand(audio.source.swf.sha256===SOURCE.sha256&&
  audio.source.separateSa.sha256===SA_SOURCE.sha256&&
  audio.separateSa.copy.sha256===SA_COPY.sha256&&
  audio.streamCount===1&&audio.trailers.length===0&&
  audio.streams[0].domain==='sprite-139'&&
  isDeepStrictEqual(audio.streams[0].contiguousRanges.map(
    (range:{firstFrame:number;lastFrame:number})=>[range.firstFrame,range.lastFrame]),
    [[2,299],[312,815]]),'two source ranges and independently copied SA');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.mainFrameCount===815&&canvas.rootFrame===6&&
  canvas.outputs[0].sha256===RENDERER.sha256&&
  canvas.sourceGlyphRendering.definitions===19&&
  canvas.sourceGlyphRendering.preserved===true&&
  isDeepStrictEqual(canvas.sourceClipMasks.map((mask:{frame:number;characterId:number})=>
    [mask.frame,mask.characterId]),
    [[34,2],[72,2],[115,2],[373,121],[412,121],[459,121],[557,121]])&&
  canvas.inputs.some((item:{path:string;sha256:string})=>
    item.path===SOURCE_XML.path&&item.sha256===SOURCE_XML.sha256)&&
  Object.values(canvas.acceptanceEffects).every(value=>value===false),
  'source drawing and preserved glyphs');
 const target=base.pages[15];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===16&&
  target.sectionCode==='VB'&&target.sectionPageOrdinal===6&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===16&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p015'&&
  target.nextPlacementId==='shared-alg001-l06-p017','exact P016 placement');
 const pages=base.pages.map((page,index)=>index!==15?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-139',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p016-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===27&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'exact single candidate addition');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p016-candidate-v1`,
  calibrationId:'g678-alg-l06-p016-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p016-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p016-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:27}),
 });
}
