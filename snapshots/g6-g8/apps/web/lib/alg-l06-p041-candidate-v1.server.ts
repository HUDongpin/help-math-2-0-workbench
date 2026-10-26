import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P038FormalDescriptor} from './alg-l06-p038-formal-admission-v1.server';
import {P041_SOURCE_BINDING as B} from './alg-l06-p041-source-binding-v1';
import {P041_ID as ID,P041_SOURCE_ROOT,p041LocalDevelopment}
 from './alg-l06-p041-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SHA='bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85';
const SA='5154170c4922f481ae3921c3ed67554c16a430daae24ec77167ecf689f264f1b';
const CANVAS='77cdf78caf76bc825e4c8cbdc5f511dd377da9b289018a53cf1c72c7f3ad5923';
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P041_CANDIDATE_INVALID: '+why);};

/** Source-locked engineering projection on the real P038 formal base.
 * P041 registry admission and original-runtime acceptance remain separate. */
export function algL6P041CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p041LocalDevelopment(),'exact local source and development scope');
 demand(!localOnlyAnimationModuleRegistration(ID),'P041 must remain unregistered');
 const root=getWorkspaceRoot();
 for(const pin of Object.values(B.physical))readPin(P041_SOURCE_ROOT,pin);
 const normal=[B.sourceFacts,B.nativeModel,B.clipPlan,B.canvasMetadata,
  B.canvasRenderer,B.audioPlan,B.audioSchedule,B.clockIr,B.measuredBindings,
  B.hostResolution,B.hostAction,B.behaviorDraft];
 for(const pin of normal)readPin(root,pin);
 const facts=readJsonPin(root,B.sourceFacts),native=readJsonPin(root,B.nativeModel),
  canvas=readJsonPin(root,B.canvasMetadata),audio=readJsonPin(root,B.audioPlan),
  clock=readJsonPin(root,B.clockIr),host=readJsonPin(root,B.hostResolution);
 demand(facts.animationId===ID&&facts.placement.xmlOccurrence===41&&
  facts.placement.activePageCount===60&&facts.placement.sectionPageOrdinal===12&&
  facts.placement.reference==='IN/L6IN13.swf'&&
  facts.physicalSource.swf.sha256===SHA&&
  facts.physicalSource.separateSA.sha256===SA&&
  facts.timeline.spriteActions['169'].includes(752)&&
  facts.sourceBehavior.mainQuizFrame===752&&
  isDeepStrictEqual(facts.sourceBehavior.answerInstances,
   ['AnsBtn1','AnsBtn2','AnsBtn3','AnsBtn4']),
  'exact physical page, stop and four answers');
 demand(native.animationId===ID&&native.source.physicalSwf.sha256===SHA&&
  native.root.frameCount===10&&native.root.beginFrame===6&&
  native.root.animationSpriteId===169&&
  native.quiz.holdFrame===752&&native.quiz.options.length===4&&
  isDeepStrictEqual(native.quiz.options.map((x:{sourceBranch:string})=>
   x.sourceBranch),['wrong','wrong','right','wrong'])&&
  native.readOnlyPopupTextContract.sourceAssignment==='txtFeed.text = _global.WrongFeed',
  'source native stage, quiz and runtime text ownership');
 demand(canvas.animationId===ID&&canvas.sourceSwfSha256===SHA&&
  canvas.assetSha256===CANVAS&&canvas.stage.width===800&&canvas.stage.height===600&&
  canvas.rootFrame===6&&canvas.rootFrames===10&&
  canvas.main.frameDomain==='sprite-169'&&canvas.main.frameCount===869&&
  canvas.main.quizStopFrame===752&&canvas.sourceGlyphs.readOnlyEditCanvasDrawing===false&&
  canvas.sourceGlyphs.nativeCompanionRequired===true&&
  canvas.sourceButtons.actionsExecutedByCanvas===false,
  'generated Canvas identity and native companion requirement');
 demand(audio.animationId===ID&&audio.streamCount===8&&audio.blockCount===1064&&
  audio.schedule.sha256===B.audioSchedule.sha256&&
  audio.separateSA.asset.sha256===SA&&audio.separateSA.localeAutoplay===false&&
  audio.separateSA.joinedWithEmbeddedStreams===false&&
  clock.animationId===ID&&clock.productContinuousClockPolicy.singleActiveOwner===true&&
  clock.productContinuousClockPolicy.sa.trigger==='explicit-user-only'&&
  clock.unresolvedHostEntry.originalFlashDecoderLatencyOrSeekCalibrated===false,
  'eight independent streams, explicit SA and uncalibrated Flash audio alignment');
 demand(host.binding.pageOccurrence===41&&host.binding.pageReference==='IN/L6IN13.swf'&&
  host.binding.staticCompatibilityVerified===true&&
  host.binding.historicalLauncherAndActualHostUseVerified===false&&
  isDeepStrictEqual(host.selection.wrong.sourceNamedSprites.map((x:{spriteId:number})=>
   x.spriteId),[76,105,91])&&
  isDeepStrictEqual(host.selection.right.sourceNamedSprites.map((x:{spriteId:number})=>
   x.spriteId),[168,139,119,152])&&
  host.hostLoopAndQuizInteraction.hostSelectionIndependentOfAttemptCountInExtractedFunctions===true,
  'conditional source host feedback selection, without historical launch claim');
 const base=algL6P038FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===43&&
  base.pages[37].animationId==='shared-alg001-l06-p038'&&
  base.pages[37].rendererAvailability.kind==='registered',
  'exact formally admitted P038 predecessor');
 const target=base.pages[40];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===41&&target.sectionCode==='IN'&&
  target.sectionPageOrdinal===12&&target.source.assetId===`swf-${SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p040'&&
  target.nextPlacementId==='shared-alg001-l06-p042',
  'source-ordered unregistered P041 occurrence');
 const pages=base.pages.map((page,index)=>index!==40?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-169',language:'fixed-en' as const,
    scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p041-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===44&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'exactly one engineering projection');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p041-candidate-v1`,
  calibrationId:'g678-alg-l06-p041-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p041-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p041-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:44})});
}
