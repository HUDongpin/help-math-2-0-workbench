import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P028FormalDescriptor} from './alg-l06-p028-formal-admission-v1.server';
import {P032_CANDIDATE_BINDING} from './alg-l06-p032-candidate-binding-v1';
import {P032_ID as ID,P032_SOURCE_ROOT,p032LocalDevelopment} from './alg-l06-p032-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='e425600d0b6cfab41ae50f7512cb8e6c4e3c6ee04bbfa10c29b437459876d836';
const MAIN_SHA='2584a692ee3936f02c3dc491872225f020744ce92710f890e1a31d468a75c85b';
const SA_SHA='9cdf2402eea05caebc190680eff4b15ee3baada80e366ed4e4ac96df7f3dd478';
const CANVAS_SHA='646ef50a5e3dc054bca4a323f6da775b82b22e769f33221fdaa155f51e0e2eaf';
const KEYS=['Set','Ordered pair','Function','X-coordinate'];
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error('P032_CANDIDATE_INVALID: '+reason);};

/** Private, source-backed projection. The 40th page here is not a registration. */
export function algL6P032SourceProjection():PageOnlyLessonPlayerDescriptor{
 demand(p032LocalDevelopment(),'local development/physical source');
 const root=getWorkspaceRoot(),binding=P032_CANDIDATE_BINDING;
 const index=readJsonPin(root,binding.index),plan=readJsonPin(root,binding.sourcePlan),
  native=readJsonPin(root,binding.native),canvas=readJsonPin(root,binding.canvas),
  audio=readJsonPin(root,binding.audioPlan),browser=readJsonPin(root,binding.browserDecode);
 readJsonPin(root,binding.host);readPin(root,binding.visualPlayer);
 demand(isDeepStrictEqual(index.host,binding.host),'exact current predecessor index and host');
 readPin(P032_SOURCE_ROOT,plan.physicalSource.swf);
 readPin(P032_SOURCE_ROOT,plan.physicalSource.lessonXml);
 readPin(P032_SOURCE_ROOT,plan.physicalSource.separateSa);
 demand(plan.identity.animationId===ID&&plan.identity.ordinal===32&&
  plan.identity.lessonPages===60&&plan.identity.xmlReference==='IN/L6IN04.swf'&&
  plan.identity.xmlPageAttributes.Title==='Testing Whether Ordered Pairs Represent a Function'&&
  plan.identity.sectionCode==='IN'&&plan.identity.sectionPageOrdinal===3&&
  plan.physicalSource.swf.sha256===SOURCE_SHA&&plan.physicalSource.samePathFlaExists===false&&
  plan.frameDomains[1].domain==='sprite-22'&&plan.frameDomains[1].frames===413&&
  isDeepStrictEqual(plan.actions.glossary.map((g:{keyAttribute:string})=>g.keyAttribute),KEYS),
  'exact XML ordinal, physical SWF, frame domain and four source glossary actions');
 demand(native.animationId===ID&&native.sourceSwfSha256===SOURCE_SHA&&
  native.frameDomain==='sprite-22'&&native.mainFrameCount===413&&
  native.rootFrameCount===10&&native.rootEntryFrame===6&&native.fps===12&&
  native.glossary.length===4&&native.canvasSourceGlyphsPreserved===true&&
  native.canvasInstanceSuppressionSupported===false&&
  isDeepStrictEqual(native.glossary.map((g:{key:string})=>g.key),KEYS),
  'native source geometry, original glyphs and glossary');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE_SHA&&
  canvas.rootFrame===6&&canvas.mainFrameCount===413&&
  canvas.sourceGlyphRendering.default==='preserve-all'&&
  canvas.sourceGlyphRendering.suppressTextIdsSupported===false&&
  canvas.outputs[0].sha256===CANVAS_SHA,'source Canvas and unhidden glyphs');
 demand(audio.sourceSwf.sha256===SOURCE_SHA&&audio.frameDomain==='sprite-22'&&
  audio.visualFrames===413&&audio.main.asset.sha256===MAIN_SHA&&
  audio.main.firstBlockFrame===1&&audio.main.lastBlockFrame===413&&
  audio.main.blockCount===413&&
  audio.optionalSpanishAudio.source.sha256===SA_SHA&&
  audio.optionalSpanishAudio.localeAutoplay===false&&
  audio.optionalSpanishAudio.joinedWithMain===false,
  'exact embedded stream and separate user-triggered SA');
 demand(browser.results.length===2&&
  [binding.browserMain,binding.browserSpanish].every(bound=>bound&&
   browser.results.some((row:{sourceSha256:string;pcmSha256:string;samples:number})=>
    row.sourceSha256===bound.sourceSha256&&row.pcmSha256===bound.pcmSha256&&
    row.samples===bound.decodedSamples)),
  'measured Chrome PCM for main and separate SA');
 const base=algL6P028FormalDescriptor();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&
  base.course.lesson===6&&base.course.courseShellCount===0&&
  base.productBridge.registeredAnimationCount===39&&base.glossary.length===44&&
  base.pages[27].animationId==='shared-alg001-l06-p028'&&
  base.pages[27].rendererAvailability.kind==='registered',
  'current registered P028 predecessor 39/60 and 44 glossary');
 const crosswalk=readJsonPin(root,binding.glossaryCrosswalk);
 demand(crosswalk.kind==='alg-l06-p032-four-glossary-source-crosswalk-v1'&&
  crosswalk.animationId===ID&&crosswalk.entries.length===4&&crosswalk.definitionOnly===true&&
  crosswalk.addedEntry.id==='x-coordinate'&&crosswalk.addedEntry.sourceKeyAttribute==='X-coordinate',
  'source dictionary X-coordinate definition');
 for(const external of crosswalk.external)readPin(external.root,external.pin);
 const glossary=[...base.glossary];
 demand(!glossary.some(entry=>entry.id==='x-coordinate'),'only X-coordinate is absent');
 const {id,sourceKeyAttribute,labels,definitions,source:dictionarySource}=crosswalk.addedEntry;
 glossary.push(Object.freeze({id,sourceKeyAttribute,labels:Object.freeze({...labels}),
  definitions:Object.freeze({...definitions}),source:Object.freeze({...dictionarySource})}));
 demand(glossary.length===45&&KEYS.every(key=>glossary.filter(entry=>
  entry.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1),
  'one definition for each source key');
 const target=base.pages[31];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===32&&target.sectionCode==='IN'&&
  target.sectionPageOrdinal===3&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p031'&&
  target.nextPlacementId==='shared-alg001-l06-p033',
  'exact source-ordered IN04 target');
 const pages=base.pages.map((page,i)=>i!==31?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-22',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p032-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===40&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'only P032 changes among sixty pages');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p032-candidate-v1`,
  calibrationId:'g678-alg-l06-p032-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p032-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p032-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:40})});
}

/** No formal path. Exact reviewed packet/registry are required before a candidate opens. */
export function algL6P032CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 const projection=algL6P032SourceProjection(),binding=P032_CANDIDATE_BINDING;
 demand(binding.packet&&binding.candidateRegistrySha256&&binding.browserMain&&
  binding.browserSpanish,'reviewed packet, registry and browser PCM required');
 const root=getWorkspaceRoot(),tx=readRegistryTransaction(root);
 demand(tx.sha256===binding.candidateRegistrySha256&&
  !localOnlyAnimationModuleRegistration(ID),'exact unregistered candidate registry');
 const packet=readJsonPin(root,binding.packet!);
 demand(packet.kind==='alg-l06-p032-candidate-source-binding-v1'&&
  packet.animationId===ID&&packet.source.sha256===SOURCE_SHA&&
  isDeepStrictEqual(packet.predecessorIndex,binding.index)&&
  isDeepStrictEqual(packet.predecessorHost,binding.host)&&
  Object.values(packet.acceptanceEffects).every(v=>v===false),
  'exact source packet, current predecessor and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 return projection;
}
