import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P032FormalDescriptor} from './alg-l06-p032-formal-admission-v1.server';
import {P034_CANDIDATE_BINDING} from './alg-l06-p034-candidate-binding-v1';
import {P034_ID as ID,P034_SOURCE_ROOT,p034LocalDevelopment} from './alg-l06-p034-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='32ddbfde743b785610360f38b7030ab2dbd289438f6c4433e6699ce3004a629a';
const CANVAS_SHA='8e424c04ecdde8168145b3aed03b02bcc2c38db95b776295fd7298fc04fedc87';
const MAIN_SHA='9f75303ceb0bd281d47f92583f1c40aa34b4974695a0c019199682b507131e2d';
const SA_SHA='2bebaa57aee0e80591e80cd542dc98f51839593820c9ec16d6a720dbfd9dab30';
const KEYS=['Vertical-line test','Graph','Function','Vertical','Line'];
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error('P034_CANDIDATE_INVALID: '+reason);};

/** Source-backed, local-only projection. It does not register P034. */
export function algL6P034SourceProjection():PageOnlyLessonPlayerDescriptor{
 demand(p034LocalDevelopment(),'local development and physical source');
 const root=getWorkspaceRoot(),binding=P034_CANDIDATE_BINDING;
 const index=readJsonPin(root,binding.index),plan=readJsonPin(root,binding.sourcePlan),
  native=readJsonPin(root,binding.native),canvas=readJsonPin(root,binding.canvas),
  schedule=readJsonPin(root,binding.audioSchedule),receipt=readJsonPin(root,binding.audioReceipt),
  browser=readJsonPin(root,binding.browserDecode);
 readJsonPin(root,binding.host);readPin(root,binding.player);
 demand(isDeepStrictEqual(index.host,binding.host)&&
  !index.pages.some((row:{animationId:string})=>row.animationId===ID),
  'exact unregistered predecessor index and host');
 readPin(P034_SOURCE_ROOT,plan.physicalSource.swf);
 readPin(P034_SOURCE_ROOT,plan.physicalSource.lessonXml);
 readPin(P034_SOURCE_ROOT,plan.physicalSource.separateSa);
 demand(plan.identity.animationId===ID&&plan.identity.globalOrdinal===34&&
  plan.identity.lessonPages===60&&plan.identity.xmlReference==='IN/L6IN06.swf'&&
  plan.identity.sectionCode==='IN'&&plan.identity.sectionPageOrdinal===5&&
  plan.identity.xmlPageAttributes.Title==='Testing Whether a Graph Represents a Function (Vertical-Line Test)'&&
  plan.physicalSource.swf.sha256===SOURCE_SHA&&plan.physicalSource.samePathFlaExists===false&&
  plan.header.fps===12&&plan.header.rootFrames===13&&
  plan.structure.mainSpriteId===40&&plan.structure.mainFrames===434&&
  isDeepStrictEqual([...new Set(plan.actions.glossary.map((g:{keyAttribute:string})=>g.keyAttribute))],KEYS),
  'exact XML occurrence, source SWF, 434-frame sprite and five source glossary keys');
 demand(native.animationId===ID&&native.source.sha256===SOURCE_SHA&&
  native.frameDomain==='sprite-40'&&native.mainFrameCount===434&&native.rootFrame===6&&
  native.fps===12&&native.definitions.length===13&&native.glossary.length===10&&
  isDeepStrictEqual([...new Set(native.glossary.map((g:{key:string})=>g.key))],KEYS),
  'native source geometry and ten authored glossary placements');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE_SHA&&
  canvas.rootFrame===6&&canvas.mainFrameCount===434&&
  canvas.sourceGlyphsPreserved===true&&canvas.sourceTextDefinitions===13&&
  canvas.sourceTextPlacements===47&&canvas.outputs[0].sha256===CANVAS_SHA,
  'source Canvas and retained glyphs');
 demand(schedule.frameDomain==='sprite-40'&&schedule.sourceVisualFrames===434&&
  schedule.blockCount===405&&schedule.declaredSamples===741312&&
  receipt.source.sha256===SOURCE_SHA&&receipt.sourceSA.sha256===SA_SHA&&
  receipt.outputs.some((row:{sha256:string})=>row.sha256===MAIN_SHA)&&
  receipt.optionalSpanishPolicy==='explicit-only-separate'&&
  plan.embeddedAudio.asset.sha256===MAIN_SHA&&
  plan.embeddedAudio.silentBlockGapFrames[0]===198&&
  plan.embeddedAudio.silentBlockGapFrames[1]===226&&
  plan.optionalSpanishAudio.source.sha256===SA_SHA&&
  plan.optionalSpanishAudio.localeAutoplay===false&&plan.optionalSpanishAudio.joinedWithMain===false,
  'source block schedule, authored gap and separate user-triggered Spanish audio');
 demand(browser.results.length===2&&
  [binding.browserMain,binding.browserSpanish].every(bound=>browser.results.some(
   (row:{sourceSha256:string;pcmSha256:string;samples:number})=>
    row.sourceSha256===bound.sourceSha256&&row.pcmSha256===bound.pcmSha256&&
    row.samples===bound.decodedSamples)),
  'measured browser PCM for independent main and Spanish files');
 const base=algL6P032FormalDescriptor();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&
  base.course.lesson===6&&base.course.courseShellCount===0&&
  base.productBridge.registeredAnimationCount===40&&base.glossary.length===45&&
  base.pages[31].animationId==='shared-alg001-l06-p032'&&
  base.pages[31].rendererAvailability.kind==='registered',
  'registered P032 predecessor, 40 pages and 45 glossary definitions');
 demand(KEYS.every(key=>base.glossary.filter(entry=>
  entry.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1),
  'all five existing source glossary definitions');
 const target=base.pages[33];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===34&&target.sectionCode==='IN'&&
  target.sectionPageOrdinal===5&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p033'&&
  target.nextPlacementId==='shared-alg001-l06-p035',
  'source-ordered IN06 target');
 const pages=base.pages.map((page,i)=>i!==33?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-40',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p034-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===41&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'only P034 changes among sixty pages');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p034-candidate-v1`,
  calibrationId:'g678-alg-l06-p034-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p034-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p034-candidate-v1`}),
  pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:41})});
}

/** The reviewed packet and exact unchanged registry must exist before the route opens. */
export function algL6P034CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 const binding=P034_CANDIDATE_BINDING;
 demand(binding.packet!==null&&binding.candidateRegistrySha256&&binding.browserMain&&
  binding.browserSpanish,'reviewed packet, registry and browser PCM required');
 const projection=algL6P034SourceProjection(),root=getWorkspaceRoot(),
  tx=readRegistryTransaction(root);
 demand(tx.sha256===binding.candidateRegistrySha256&&
  !localOnlyAnimationModuleRegistration(ID),'exact unregistered candidate registry');
 const packet=readJsonPin(root,binding.packet!);
 demand(packet.kind==='alg-l06-p034-candidate-source-binding-v1'&&
  packet.animationId===ID&&packet.source.sha256===SOURCE_SHA&&
  isDeepStrictEqual(packet.predecessorIndex,binding.index)&&
  isDeepStrictEqual(packet.predecessorHost,binding.host)&&
  Object.values(packet.acceptanceEffects).every(v=>v===false),
  'exact source packet, current predecessor and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 return projection;
}
