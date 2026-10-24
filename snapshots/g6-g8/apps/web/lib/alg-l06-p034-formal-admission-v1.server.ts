import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P034SourceProjection} from './alg-l06-p034-candidate-v1.server';
import {P034_CANDIDATE_BINDING} from './alg-l06-p034-candidate-binding-v1';
import {P034_ID as ID,P034_SOURCE_ROOT,p034LocalDevelopment}
 from './alg-l06-p034-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const KEYS=['Vertical-line test','Graph','Function','Vertical','Line'];
const SOURCE_SHA='32ddbfde743b785610360f38b7030ab2dbd289438f6c4433e6699ce3004a629a';
const MAIN_SHA='9f75303ceb0bd281d47f92583f1c40aa34b4974695a0c019199682b507131e2d';
const SA_SHA='2bebaa57aee0e80591e80cd542dc98f51839593820c9ec16d6a720dbfd9dab30';
const CANVAS_SHA='8e424c04ecdde8168145b3aed03b02bcc2c38db95b776295fd7298fc04fedc87';
const demand=(okay:unknown,why:string)=>{if(!okay)throw Error('P034_FORMAL_DESCRIPTOR_INVALID: '+why);};

/** Dormant until one actual P034 proof, canonical dispatch, and active index exist.
 * The candidate descriptor is deliberately not called: its old-registry guard
 * must fail after admission. SourceProjection reads its historical source pin. */
export function algL6P034FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p034LocalDevelopment(),'local physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&
  /^work\/g678-workflow\/candidates\/shared-alg001-l06-p034-proof-v[1-9]\d*\.json$/u.test(own[0].proof.path),
  'exactly one active formal P034 proof; source-only candidate excluded');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap((c:{entries:{key:string}[]})=>c.entries);
 const shared=entries.filter(e=>e.key.startsWith('shared-'));
 demand(shared.filter(e=>e.key===ID).length===1,
  'one actual P034 entry in the current registry transaction');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],
  meta=localOnlyAnimationModuleRegistration(ID),binding=P034_CANDIDATE_BINDING;
 demand(registration.entries.length===1&&entry.key===ID&&
  entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='interactive-understood'&&
  /^g678-alg-l06-p034-current-js-20261001-v[1-9]\d*$/u.test(registration.calibrationId)&&
  registration.deploymentScope==='local-only'&&
  isDeepStrictEqual(packet.entry,entry)&&
  entry.artifacts.module.path===`packages/demos/src/modules/${ID}.tsx`&&
  entry.artifacts.timeline.path===`packages/demos/src/timelines/${ID}.ts`&&
  entry.artifacts.runtime.path===
   `work/g678-shared-page-factory/alg-l06-p034-maintained-canvas-v1-20261001-v1/members/${ID}/canvas-renderer.js`&&
  entry.artifacts.runtime.sha256===CANVAS_SHA&&
  meta?.calibrationId===registration.calibrationId&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256,
  'actual one-entry registry and generated local-only module/timeline/runtime metadata');
 demand(isDeepStrictEqual(packet.sourceEvidence?.plan,binding.sourcePlan)&&
  isDeepStrictEqual(packet.sourceEvidence?.native,binding.native)&&
  isDeepStrictEqual(packet.sourceEvidence?.canvas,binding.canvas)&&
  isDeepStrictEqual(packet.sourceEvidence?.ledger,binding.audioSchedule)&&
  isDeepStrictEqual(packet.sourceEvidence?.audioReceipt,binding.audioReceipt)&&
  isDeepStrictEqual(packet.sourceEvidence?.browserDecode,binding.browserDecode),
  'proof reuses exact P034 source and browser-decode binding');
 const selected=packet.selectedPages[0],runtime=selected.runtime;
 demand(selected.animationId===ID&&selected.placementId===ID&&
  selected.assetId===`swf-${SOURCE_SHA}`&&selected.sourceSha256===SOURCE_SHA&&
  selected.moduleCode==='ALG001'&&selected.lessonNumber===6&&
  selected.globalPageOrdinal===34&&selected.sourceOccurrence===34&&
  selected.sectionCode==='IN'&&selected.sectionPageOrdinal===5&&
  selected.complexityLane==='interactive-understood'&&
  runtime.frameDomain==='sprite-40'&&runtime.frameCount===434&&
  runtime.rootFrameCount===13&&runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.sourceStopFrame===433&&runtime.finalEncodedFrame===434&&
  runtime.nativeMainEofRequired===true&&
  runtime.terminalPolicy==='source-frame-433-and-native-main-audio-eof'&&
  runtime.hostPlaybackCompletion===false&&
  isDeepStrictEqual(runtime.canvasRenderer,entry.artifacts.runtime)&&
  packet.sourceRoot===P034_SOURCE_ROOT&&packet.source.sha256===SOURCE_SHA,
  'source occurrence, 434 encoded frames, frame-433 stop plus native main EOF');
 demand(packet.nativeTextSource?.definitions===13&&
  packet.nativeTextSource?.placements===47&&
  packet.nativeTextSource?.glossaryPlacements===10&&
  packet.nativeTextSource?.frameDomain==='sprite-40'&&
  packet.nativeTextSource?.canvasSourceGlyphsPreserved===true&&
  packet.nativeTextSource?.graphLabelsNativeCompanion===false&&
  packet.continuousSource?.frameDomain==='sprite-40'&&
  packet.continuousSource?.visualFrames===434&&
  packet.continuousSource?.sourceStopFrame===433&&
  packet.continuousSource?.finalEncodedFrame===434&&
  packet.continuousSource?.blockCount===405&&
  packet.continuousSource?.declaredSamples===741312&&
  packet.continuousSource?.mainAsset?.sha256===MAIN_SHA&&
  packet.continuousSource?.browserDecodedSamples===741312&&
  packet.continuousSource?.browserPcmSha256===binding.browserMain?.pcmSha256&&
  isDeepStrictEqual(packet.continuousSource?.streamTagAbsentRange,[198,226])&&
  packet.continuousSource?.runtimeInsertedSilence===false&&
  packet.continuousSource?.seekSamplesRuntimeEffect==='unresolved',
  '13/47 native text, 10 controls, one continuous decoded main; absent tags are not silence');
 demand(packet.optionalSpanishAudio?.source?.sha256===SA_SHA&&
  packet.optionalSpanishAudio?.browserDecodedSamples===1504512&&
  packet.optionalSpanishAudio?.browserSampleRate===48000&&
  packet.optionalSpanishAudio?.browserPcmSha256===binding.browserSpanish?.pcmSha256&&
  packet.optionalSpanishAudio?.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio?.localeAutoplay===false&&
  packet.optionalSpanishAudio?.mainStreamSpliced===false&&
  packet.optionalSpanishAudio?.audioAccepted===false&&
  isDeepStrictEqual(Object.keys(packet.glossaryActions??{}),KEYS)&&
  packet.graphInteraction?.activationFrame===433&&
  packet.graphInteraction?.originalRuntimeParity===false&&
  packet.acceptanceEffects&&
  Object.values(packet.acceptanceEffects).length>0&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'five existing source glossary keys, explicit SA, graph engineering only, no acceptance inflation');
 const base=algL6P034SourceProjection();
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&
  base.course.lesson===6&&base.course.courseShellCount===0&&
  base.productBridge.registeredAnimationCount===41&&base.glossary.length===45&&
  base.pages[33].animationId===ID&&base.pages[33].rendererAvailability.kind==='registered'&&
  base.pages[33].previousPlacementId==='shared-alg001-l06-p033'&&
  base.pages[33].nextPlacementId==='shared-alg001-l06-p035'&&
  KEYS.every(key=>base.glossary.filter(value=>
   value.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1),
  'source-ordered 41/60 My Lesson with five existing glossary definitions');
 const calibration=registration.calibrationId;
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${calibration}`,
  calibrationId:calibration,releaseId:calibration,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/continuous-v1`}),
  source:Object.freeze({...base.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${calibration}`})});
}
