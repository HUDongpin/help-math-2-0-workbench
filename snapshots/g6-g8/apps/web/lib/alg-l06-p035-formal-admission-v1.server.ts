import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P035SourceProjection} from './alg-l06-p035-source-projection-v1.server';
import {P035_SOURCE_BINDING} from './alg-l06-p035-source-binding-v1';
import {P035_ID as ID,P035_SOURCE_ROOT,p035LocalDevelopment}
 from './alg-l06-p035-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='9aaf16b58c32b00b056c7c5040b38f9d1391486bb025b71c95fa0326bbae33b3';
const CANVAS_SHA='b0011b78121b76672ec62706f5943013885e8d0a31756707f2a246078b906ab3';
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P035_FORMAL_DESCRIPTOR_INVALID: '+why);};

/** Dormant until the actual P035 proof, generated dispatch, and active index agree. */
export function algL6P035FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p035LocalDevelopment(),'local physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&
  /^work\/g678-workflow\/candidates\/shared-alg001-l06-p035-proof-v[1-9]\d*\.json$/u.test(own[0].proof.path),
  'exactly one active formal P035 proof');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap((c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1,'one actual P035 registry entry');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],
  meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.entries.length===1&&entry.key===ID&&
  entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='behavior-heavy'&&registration.deploymentScope==='local-only'&&
  /^g678-alg-l06-p035-current-js-20261001-v[1-9]\d*$/u.test(registration.calibrationId)&&
  isDeepStrictEqual(packet.entry,entry)&&
  entry.artifacts.module.path===`packages/demos/src/modules/${ID}.tsx`&&
  entry.artifacts.timeline.path===`packages/demos/src/timelines/${ID}.ts`&&
  entry.artifacts.runtime.path===
   `work/g678-shared-page-factory/alg-l06-p035-maintained-canvas-v1-20261001-v1/members/${ID}/canvas-renderer.js`&&
  entry.artifacts.runtime.sha256===CANVAS_SHA&&
  meta?.calibrationId===registration.calibrationId&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256,
  'actual registry and generated local-only module/timeline/runtime metadata');
 const sourcePins=[P035_SOURCE_BINDING.sourceFacts,P035_SOURCE_BINDING.nativeInteraction,
  P035_SOURCE_BINDING.canvasMetadata,P035_SOURCE_BINDING.audioPlan];
 demand(sourcePins.every(pin=>proof.files.some((row:{path:string;bytes:number;sha256:string})=>
  isDeepStrictEqual(row,pin))),
  'proof pins exact source facts, quiz/native geometry, Canvas and audio plan without candidate packet');
 const selected=packet.selectedPages[0],runtime=selected.runtime;
 demand(selected.animationId===ID&&selected.placementId===ID&&
  selected.assetId===`swf-${SOURCE_SHA}`&&selected.sourceSha256===SOURCE_SHA&&
  selected.moduleCode==='ALG001'&&selected.lessonNumber===6&&
  selected.globalPageOrdinal===35&&selected.sourceOccurrence===35&&
  selected.sectionCode==='IN'&&selected.sectionPageOrdinal===6&&
  selected.complexityLane==='behavior-heavy'&&
  runtime.frameDomain==='sprite-227'&&runtime.frameCount===534&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.sourceBoundaryFrame===534&&runtime.nativeMainEofRequired===true&&
  runtime.hostPlaybackCompletion===false&&
  isDeepStrictEqual(runtime.canvasRenderer,entry.artifacts.runtime),
  'exact source occurrence, 534-frame quiz timeline, native EOF, no authored completion');
 demand(packet.sourceRoot===P035_SOURCE_ROOT&&
  isDeepStrictEqual(packet.source,P035_SOURCE_BINDING.physical.swf)&&
  isDeepStrictEqual(packet.sourceXml,P035_SOURCE_BINDING.physical.xml)&&
  isDeepStrictEqual(packet.optionalSpanishAudio?.source,P035_SOURCE_BINDING.physical.sa)&&
  packet.optionalSpanishAudio?.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio?.localeAutoplay===false&&
  packet.optionalSpanishAudio?.mainStreamSpliced===false&&
  packet.optionalSpanishAudio?.audioAccepted===false&&
  packet.acceptanceEffects&&Object.values(packet.acceptanceEffects).length>0&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'exact physical source and XML, explicit separate SA, independent acceptance gates');
 const base=algL6P035SourceProjection();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===42&&
  base.glossary.length===45&&base.pages[34].animationId===ID&&
  base.pages[34].rendererAvailability.kind==='registered'&&
  base.pages[34].previousPlacementId==='shared-alg001-l06-p034'&&
  base.pages[34].nextPlacementId==='shared-alg001-l06-p036',
  'source-ordered 42/60 My Lesson, five existing P035 glossary keys');
 const calibration=registration.calibrationId;
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${calibration}`,
  calibrationId:calibration,releaseId:calibration,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/continuous-v1`}),
  source:Object.freeze({...base.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${calibration}`})});
}
