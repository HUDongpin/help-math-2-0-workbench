import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P035FormalDescriptor} from './alg-l06-p035-formal-admission-v1.server';
import {P038_SOURCE_BINDING as B} from './alg-l06-p038-source-binding-v1';
import {P038_ID as ID,P038_SOURCE_ROOT,p038LocalDevelopment} from './alg-l06-p038-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SHA='bbd60a3b673fc54b3ea44a20943db33ea556532ddc14789a71aed4dadfe1e9de';
const KEYS=['Table','Output','Input','Equation','Rule','Graph','Function'];
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error(`P038_CANDIDATE_INVALID: ${reason}`);};

/** Source-locked engineering projection. Registry admission is a separate gate. */
export function algL6P038CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p038LocalDevelopment(),'exact local source and development scope');
 demand(!localOnlyAnimationModuleRegistration(ID),'P038 must remain unregistered for candidate route');
 const root=getWorkspaceRoot();
 for(const pin of Object.values(B.physical))readPin(P038_SOURCE_ROOT,pin);
 for(const pin of Object.values(B).filter((value):value is (typeof B)[keyof typeof B]=>
  typeof value==='object'&&'path' in value))readPin(root,pin);
 const source=readJsonPin(root,B.sourceFacts),native=readJsonPin(root,B.nativeModel),
  clips=readJsonPin(root,B.clipPlan),audio=readJsonPin(root,B.audioPlan),
  schedule=readJsonPin(root,B.audioSchedule),canvas=readJsonPin(root,B.canvasMetadata);
 demand(source.animationId===ID&&source.assetId===`swf-${SHA}`&&
  source.placement.xmlOccurrence===38&&source.placement.activePageCount===60&&
  source.placement.reference==='IN/L6IN10.swf'&&
  source.physicalSource.swf.sha256===SHA&&
  isDeepStrictEqual(source.buttons.map((b:{keyAttribute:string})=>b.keyAttribute),KEYS)&&
  source.audio.blockCount===374&&source.audio.mp3PayloadSha256===B.mainAudio.sha256&&
  source.audio.zeroSampleBlockFrames.length===1&&source.audio.zeroSampleBlockFrames[0]===37,
  'physical source placement, seven controls and unpadded audio');
 demand(native.animationId===ID&&native.source.physicalSwf.sha256===SHA&&
  native.root.beginFrame===6&&native.root.frameCount===13&&
  native.frameDomain==='sprite-67'&&native.frameCount===409&&
  isDeepStrictEqual(native.buttonBindings.map((b:{sourceKeyAttribute:string})=>
   b.sourceKeyAttribute),KEYS)&&
  clips.animationId===ID&&clips.frameCount===409&&
  clips.maskInstances.length===10&&clips.canvasAlignmentCalibrated===false&&
  clips.sourceCanvasGlyphsPreserved===true,
  'native controls and uncalibrated source masks');
 demand(audio.animationId===ID&&audio.frameDomain==='sprite-67'&&
  audio.sourceVisualFrames===409&&audio.fps===12&&audio.blockCount===374&&
  audio.main.asset.sha256===B.mainAudio.sha256&&
  audio.main.schedule.sha256===B.audioSchedule.sha256&&
  audio.separateSA.asset.sha256===B.optionalSpanishAudio.sha256&&
  audio.separateSA.localeAutoplay===false&&audio.separateSA.joinedWithMain===false&&
  schedule.frameDomain==='sprite-67'&&schedule.blockCount===374&&
  canvas.animationId===ID&&canvas.sourceSwfSha256===SHA&&
  canvas.rootFrame===6&&canvas.frameDomain==='sprite-67'&&canvas.frameCount===409&&
  canvas.assetSha256===B.canvasRenderer.sha256&&
  canvas.sourceGlyphRendering.default==='preserve-all'&&
  canvas.sourceClipMasks.visualCalibration===false,
  'one stream, explicit separate Spanish and exact opaque Canvas');
 const base=algL6P035FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===42&&
  base.pages[34].animationId==='shared-alg001-l06-p035'&&
  base.pages[34].rendererAvailability.kind==='registered'&&
  base.glossary.length===45,'formal P035 predecessor');
 demand(KEYS.every(key=>base.glossary.filter(g=>
  g.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1),
  'seven existing glossary keys');
 const target=base.pages[37];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===38&&target.sectionCode==='IN'&&
  target.sectionPageOrdinal===9&&target.source.assetId===`swf-${SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p037'&&
  target.nextPlacementId==='shared-alg001-l06-p039',
  'source-ordered unregistered P038 occurrence');
 const pages=base.pages.map((page,index)=>index!==37?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-67',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p038-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===43&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'exactly one engineering projection');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p038-candidate-v1`,
  calibrationId:'g678-alg-l06-p038-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p038-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p038-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:43})});
}
