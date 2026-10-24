import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P027FormalDescriptor} from './alg-l06-p027-formal-admission-v1.server';
import {P028_CANDIDATE_BINDING} from './alg-l06-p028-candidate-binding-v1';
import {P028_ID as ID,P028_SOURCE_ROOT,p028LocalDevelopment}
 from './alg-l06-p028-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='12b9912231512d5622b96708b83331217691169fadf185b3b2d0a27733e3c297';
const MAIN_SHA='4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70';
const SA_SHA='f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf';
const CANVAS_SHA='b4d784c6dd65c0a412c4a41447d4485476a8715b665b175f277a40a40ffbb2e6';
const KEYS=['Relation','Set','Ordered pair'];
const IDS=['relation','set','ordered-pair'];
const demand=(ok:unknown,message:string)=>{if(!ok)throw Error('P028_CANDIDATE_INVALID: '+message);};

/** Source-backed private projection. It is not a registry or route admission. */
export function algL6P028SourceProjection():PageOnlyLessonPlayerDescriptor{
 demand(p028LocalDevelopment(),'local development/physical source');
 const root=getWorkspaceRoot(),binding=P028_CANDIDATE_BINDING;
 const index=readJsonPin(root,binding.index),plan=readJsonPin(root,binding.sourcePlan),
  native=readJsonPin(root,binding.native),canvas=readJsonPin(root,binding.canvas),
  audio=readJsonPin(root,binding.audioPlan),crosswalk=readJsonPin(root,binding.crosswalk);
 readJsonPin(root,binding.host);
 readPin(root,binding.visualPlayer);
 demand(isDeepStrictEqual(index.host,binding.host),
  'exact candidate index and host binding');
 readPin(P028_SOURCE_ROOT,plan.source.swf);
 readPin(P028_SOURCE_ROOT,plan.source.separateSa);
 readPin(P028_SOURCE_ROOT,plan.source.lessonXml);
 demand(plan.identity.animationId===ID&&plan.identity.globalActiveOrdinal===28&&
  plan.identity.sectionCode==='VB'&&plan.identity.sectionPageOrdinal===18&&
  plan.identity.activePageCountInLesson===60&&plan.source.swf.sha256===SOURCE_SHA&&
  plan.source.samePathFlaExists===false&&
  isDeepStrictEqual(plan.frameDomains.map((d:{id:string;frames:number})=>[d.id,d.frames]),
   [['root',10],['sprite-30',134]])&&
  isDeepStrictEqual(plan.glossary.map((g:{keyAttribute:string})=>g.keyAttribute),KEYS),
  'exact source page, frame domains and three glossary actions');
 demand(native.animationId===ID&&native.sourceSwfSha256===SOURCE_SHA&&
  native.frameDomain==='sprite-30'&&native.mainFrameCount===134&&
  native.rootFrameCount===10&&native.rootEntryFrame===6&&
  native.definitions.length===21&&native.nativeCandidateTextInstanceIds.length===51&&
  native.glossary.length===3&&native.canvasSourceGlyphsPreserved===true&&
  native.canvasInstanceSuppressionSupported===false&&
  isDeepStrictEqual(native.glossary.map((g:{key:string})=>g.key),KEYS),
  'own source-native geometry and unsuppressed glyphs');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE_SHA&&
  canvas.rootFrame===6&&canvas.rootFrameCount===10&&canvas.mainFrameCount===134&&
  canvas.sourceClipMasks.length===1&&canvas.sourceGlyphRendering.default==='preserve-all'&&
  canvas.sourceGlyphRendering.suppressTextIdsSupported===false&&
  canvas.outputs[0].sha256===CANVAS_SHA,
  'own Canvas and clip mask');
 demand(audio.sourceSwf.sha256===SOURCE_SHA&&audio.frameDomain==='sprite-30'&&
  audio.visualFrames===134&&audio.main.asset.sha256===MAIN_SHA&&
  audio.main.firstBlockFrame===2&&audio.main.lastBlockFrame===134&&
  audio.main.blockCount===133&&audio.main.browserBinding===null&&
  audio.optionalSpanishAudio.source.sha256===SA_SHA&&
  audio.optionalSpanishAudio.localeAutoplay===false&&
  audio.optionalSpanishAudio.joinedWithMain===false&&
  audio.optionalSpanishAudio.browserBinding===null,
  'source stream and explicit separate SA; browser audio still unmeasured');
 demand(crosswalk.kind==='p028-three-source-glossary-v1'&&crosswalk.entries.length===3&&
  isDeepStrictEqual(crosswalk.entries.map((e:{sourceKeyAttribute:string})=>e.sourceKeyAttribute),KEYS),
  'three exact dictionary entries');
 const base=algL6P027FormalDescriptor();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&
  base.course.lesson===6&&base.course.courseShellCount===0&&
  base.productBridge.registeredAnimationCount===38&&base.glossary.length===44&&
  base.pages[26].animationId==='shared-alg001-l06-p027'&&
  base.pages[26].rendererAvailability.kind==='registered',
  'current registered P027 predecessor: 38/60 and 44 glossary');
 for(let i=0;i<KEYS.length;i++){
  const key=KEYS[i],rows=crosswalk.entries.filter((e:{sourceKeyAttribute:string})=>
   e.sourceKeyAttribute===key),existing=base.glossary.filter(e=>e.sourceKeyAttribute===key);
  demand(rows.length===1&&existing.length===1&&rows[0].id===IDS[i]&&
   rows[0].dictionaryKeyAttribute===key&&rows[0].caseBinding==='exact'&&
   existing[0].id===rows[0].id&&
   isDeepStrictEqual(existing[0].labels,rows[0].labels)&&
   isDeepStrictEqual(existing[0].definitions,rows[0].definitions),
   'exact existing bilingual dictionary '+key);
 }
 const target=base.pages[27];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===28&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===18&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p027'&&
  target.nextPlacementId==='shared-alg001-l06-p029',
  'exact source-ordered VB18 target');
 const pages=base.pages.map((page,i)=>i!==27?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-30',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p028-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===39&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),
  'only P028 changes among sixty source-ordered pages');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p028-candidate-v1`,
  calibrationId:'g678-alg-l06-p028-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p028-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p028-candidate-v1`}),
  glossary:base.glossary,pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:39})});
}

/** Candidate route remains closed until exact packet, registry and browser audio exist. */
export function algL6P028CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 const projection=algL6P028SourceProjection(),binding=P028_CANDIDATE_BINDING;
 demand(binding.packet&&binding.browserDecode&&binding.browserMain&&
  binding.browserSpanish&&binding.candidateRegistrySha256,
  'candidate packet, exact registry and measured browser PCM required');
 const root=getWorkspaceRoot(),tx=readRegistryTransaction(root);
 demand(tx.sha256===binding.candidateRegistrySha256&&
  !localOnlyAnimationModuleRegistration(ID),
  'exact candidate registry and unregistered P028');
 const packet=readJsonPin(root,binding.packet!);
 const browser=readJsonPin(root,binding.browserDecode!);
 demand(packet.kind==='alg-l06-p028-candidate-source-binding-v1'&&
  packet.animationId===ID&&
  isDeepStrictEqual(packet.predecessorIndex,binding.index)&&
  isDeepStrictEqual(packet.predecessorHost,binding.host)&&
  packet.source.sha256===SOURCE_SHA&&
  Object.values(packet.acceptanceEffects).every(v=>v===false),
  'own source packet and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 const rows=browser.results,expected=[binding.browserMain!,binding.browserSpanish!];
 demand(Array.isArray(rows)&&rows.length===2&&expected.every(bound=>rows.some(
  (row:{sourceSha256:string;pcmSha256:string})=>
   row.sourceSha256===bound.sourceSha256&&row.pcmSha256===bound.pcmSha256)),
  'two measured browser decode bindings');
 return projection;
}
