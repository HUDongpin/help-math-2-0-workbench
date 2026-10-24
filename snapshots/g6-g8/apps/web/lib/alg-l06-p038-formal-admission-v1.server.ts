import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P035FormalDescriptor} from './alg-l06-p035-formal-admission-v1.server';
import {P038_SOURCE_BINDING as B} from './alg-l06-p038-source-binding-v1';
import {P038_ID as ID,P038_SOURCE_ROOT,p038LocalDevelopment}
 from './alg-l06-p038-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='bbd60a3b673fc54b3ea44a20943db33ea556532ddc14789a71aed4dadfe1e9de';
const CANVAS_SHA='80c0b1f6225d60eee27bc9d99ab16040d23b794f3364873be455e2a68524fcfa';
const KEYS=['Table','Output','Input','Equation','Rule','Graph','Function'];
const RUNTIME=`work/g678-shared-page-factory/alg-l06-p038-maintained-canvas-v1-20261001-v1/members/${ID}/canvas-renderer.js`;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P038_FORMAL_DESCRIPTOR_INVALID: '+why);};

/** Actual v112 proof and dispatch select one maintained P038 page in My Lesson. */
export function algL6P038FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p038LocalDevelopment(),'local physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&
  own[0].proof.path==='work/g678-workflow/candidates/shared-alg001-l06-p038-proof-v1.json',
  'exactly one active formal P038 proof');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap((c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1,'one actual P038 registry entry');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],
  meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.entries.length===1&&entry.key===ID&&
  entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='interactive-understood'&&registration.deploymentScope==='local-only'&&
  registration.calibrationId==='g678-alg-l06-p038-current-js-20261002-v2'&&
  isDeepStrictEqual(packet.entry,entry)&&
  entry.artifacts.module.path===`packages/demos/src/modules/${ID}.tsx`&&
  entry.artifacts.timeline.path===`packages/demos/src/timelines/${ID}.ts`&&
  entry.artifacts.runtime.path===RUNTIME&&entry.artifacts.runtime.sha256===CANVAS_SHA&&
  meta?.calibrationId===registration.calibrationId&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256,
  'actual registry, generated dispatch and exact maintained runtime');
 const sourcePins=[B.sourceFacts,B.nativeModel,B.clipPlan,B.audioPlan,
  B.audioSchedule,B.canvasMetadata,B.canvasRenderer];
 demand(sourcePins.every(pin=>proof.files.some((row:{path:string;bytes:number;sha256:string})=>
  isDeepStrictEqual(row,pin))),
  'proof owns exact source, native, audio and Canvas evidence');
 const selected=packet.selectedPages[0],runtime=selected.runtime;
 demand(selected.animationId===ID&&selected.placementId===ID&&
  selected.assetId===`swf-${SOURCE_SHA}`&&selected.sourceSha256===SOURCE_SHA&&
  selected.moduleCode==='ALG001'&&selected.lessonNumber===6&&
  selected.globalPageOrdinal===38&&selected.sourceOccurrence===38&&
  selected.sectionCode==='IN'&&selected.sectionPageOrdinal===9&&
  runtime.frameDomain==='sprite-67'&&runtime.frameCount===409&&
  runtime.rootFrameCount===13&&runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.nativeMainEofRequired===true&&runtime.hostPlaybackCompletion===false&&
  runtime.sourceFrameToDecodedSampleAlignmentAccepted===false&&
  isDeepStrictEqual(runtime.canvasRenderer,entry.artifacts.runtime),
  'source occurrence, 409-frame content, native EOF and no invented completion');
 demand(packet.sourceRoot===P038_SOURCE_ROOT&&
  isDeepStrictEqual(packet.source,B.physical.swf)&&
  isDeepStrictEqual(packet.sourceXml,B.physical.xml)&&
  isDeepStrictEqual(packet.optionalSpanishAudio?.source,B.physical.sa)&&
  packet.optionalSpanishAudio?.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio?.localeAutoplay===false&&
  packet.optionalSpanishAudio?.mainStreamSpliced===false&&
  packet.optionalSpanishAudio?.audioAccepted===false&&
  packet.acceptanceEffects&&Object.values(packet.acceptanceEffects).length>0&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'exact physical source, explicit SA and independent acceptance gates');
 const base=algL6P035FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===42&&
  base.glossary.length===45&&base.pages[34].animationId==='shared-alg001-l06-p035'&&
  base.pages[34].rendererAvailability.kind==='registered',
  'source-ordered P035 formal predecessor');
 demand(KEYS.every(key=>base.glossary.filter(g=>
  g.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1),
  'seven source glossary keys');
 const target=base.pages[37];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===38&&target.sectionCode==='IN'&&
  target.sectionPageOrdinal===9&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p037'&&
  target.nextPlacementId==='shared-alg001-l06-p039',
  'exact source-ordered target before projection');
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
 const selectedIds=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selectedIds.length===43&&isDeepStrictEqual(selectedIds.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'exactly one additional formal page');
 const calibration=registration.calibrationId;
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${calibration}`,
  calibrationId:calibration,releaseId:calibration,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  source:Object.freeze({...base.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${calibration}`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selectedIds),registeredAnimationCount:43})});
}
