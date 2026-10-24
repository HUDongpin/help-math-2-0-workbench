import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P038FormalDescriptor} from './alg-l06-p038-formal-admission-v1.server';
import {P041_SOURCE_BINDING as B} from './alg-l06-p041-source-binding-v1';
import {P041_ID as ID,P041_SOURCE_ROOT,p041LocalDevelopment}
 from './alg-l06-p041-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85';
const CANVAS_SHA='77cdf78caf76bc825e4c8cbdc5f511dd377da9b289018a53cf1c72c7f3ad5923';
const SA_SHA='5154170c4922f481ae3921c3ed67554c16a430daae24ec77167ecf689f264f1b';
const CALIBRATION='g678-alg-l06-p041-current-js-20261002-v1';
const PROOF='work/g678-workflow/candidates/shared-alg001-l06-p041-proof-v1.json';
const PROOF_SHA='8c794fd110f1c1c7459a770604f5248130dc5fa386f559981619571def5994db';
const FREEZE_SHA='6e3203f340cd5280c74bf3589d4f3237df4d002bc3abf14f9fd86d15eff5f4e5';
const RUNTIME=`work/g678-shared-page-factory/alg-l06-p041-maintained-canvas-v1-20261002-v1/members/${ID}/canvas-renderer.js`;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P041_FORMAL_DESCRIPTOR_INVALID: '+why);};

/** Actual successor proof and dispatch select one maintained P041 page in My Lesson. */
export function algL6P041FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p041LocalDevelopment(),'local physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF&&
  own[0].proof.sha256===PROOF_SHA&&own[0].proof.bytes===78439,
  'exactly one active formal P041 proof');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap((c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1,'one actual P041 registry entry');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],
  meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.entries.length===1&&entry.key===ID&&
  entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='behavior-heavy'&&registration.deploymentScope==='local-only'&&
  registration.calibrationId===CALIBRATION&&registration.freezeManifestSha256===FREEZE_SHA&&
  isDeepStrictEqual(packet.entry,entry)&&
  entry.artifacts.module.path===`packages/demos/src/modules/${ID}.tsx`&&
  entry.artifacts.timeline.path===`packages/demos/src/timelines/${ID}.ts`&&
  entry.artifacts.runtime.path===RUNTIME&&entry.artifacts.runtime.sha256===CANVAS_SHA&&
  meta?.calibrationId===CALIBRATION&&
  meta.freezeManifestSha256===FREEZE_SHA&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===CANVAS_SHA,
  'actual registry, generated dispatch and exact maintained runtime');
 const sourcePins=[B.sourceFacts,B.nativeModel,B.clipPlan,B.canvasMetadata,
  B.canvasRenderer,B.audioPlan,B.audioSchedule,B.clockIr,B.measuredBindings,
  B.hostResolution,B.hostAction,B.behaviorDraft];
 demand(sourcePins.every(pin=>proof.files.some((row:{path:string;bytes:number;sha256:string})=>
  isDeepStrictEqual(row,pin))),
  'proof owns exact source, native, audio, host and Canvas evidence');
 const selected=packet.selectedPages[0],runtime=selected.runtime;
 demand(selected.animationId===ID&&selected.placementId===ID&&
  selected.assetId===`swf-${SOURCE_SHA}`&&selected.sourceSha256===SOURCE_SHA&&
  selected.moduleCode==='ALG001'&&selected.lessonNumber===6&&
  selected.globalPageOrdinal===41&&selected.sourceOccurrence===41&&
  selected.sectionCode==='IN'&&selected.sectionPageOrdinal===12&&
  runtime.frameDomain==='sprite-169'&&runtime.frameCount===869&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.quizHoldFrame===752&&runtime.language==='source-en'&&
  runtime.stage.width===800&&runtime.stage.height===600&&
  runtime.hostPlaybackCompletion===false&&
  runtime.sourceFrameToDecodedSampleAlignmentAccepted===false&&
  isDeepStrictEqual(runtime.canvasRenderer,entry.artifacts.runtime),
  'source occurrence, quiz stop, engineering end and no invented completion');
 demand(packet.sourceRoot===P041_SOURCE_ROOT&&
  isDeepStrictEqual(packet.source,B.physical.swf)&&
  isDeepStrictEqual(packet.sourceXml,B.physical.xml)&&
  isDeepStrictEqual(packet.optionalSpanishAudio?.source,B.physical.sa)&&
  packet.optionalSpanishAudio?.source.sha256===SA_SHA&&
  packet.optionalSpanishAudio?.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio?.localeAutoplay===false&&
  packet.optionalSpanishAudio?.mainStreamSpliced===false&&
  packet.optionalSpanishAudio?.audioAccepted===false&&
  packet.acceptanceEffects&&Object.values(packet.acceptanceEffects).length>0&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'exact physical source, explicit SA and independent acceptance gates');
 const base=algL6P038FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===43&&
  base.pages[37].animationId==='shared-alg001-l06-p038'&&
  base.pages[37].rendererAvailability.kind==='registered',
  'exact formally admitted P038 predecessor');
 const target=base.pages[40];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===41&&target.sectionCode==='IN'&&
  target.sectionPageOrdinal===12&&target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p040'&&
  target.nextPlacementId==='shared-alg001-l06-p042',
  'exact source-ordered target before projection');
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
 const selectedIds=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selectedIds.length===44&&isDeepStrictEqual(selectedIds.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'exactly one additional formal page');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  source:Object.freeze({...base.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selectedIds),registeredAnimationCount:44})});
}
