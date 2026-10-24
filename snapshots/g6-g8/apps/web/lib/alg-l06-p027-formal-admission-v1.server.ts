import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {algL6P027SourceProjection} from './alg-l06-p027-candidate-v1.server';
import {P027_CANDIDATE_BINDING} from './alg-l06-p027-candidate-binding-v1';
import {P027_ID as ID,P027_SOURCE_ROOT,p027LocalDevelopment}
 from './alg-l06-p027-preview-policy-v1';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984';
const SA_SHA='445005ae7c0a6f4896c686ad46c35e56847e4e977b991d5aa40add7a5e271cc0';
const XML_SHA='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const CANVAS_SHA='15aa87b51cf12834708b46290e95efa2a7f55e08f48d1d90010dcb32045fcb90';
const KEYS=['Vertical-line test','Function','Graph','Vertical','Line','Point'];
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error(`P027_FORMAL_DESCRIPTOR_INVALID: ${reason}`);};

/** The current activation proof, not the historical candidate registry SHA,
 * admits the same source-bound P027 projection after registration. */
export function algL6P027FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p027LocalDevelopment(),'local development/physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((p:{animationId:string})=>p.animationId===ID);
 demand(own.length===1&&
  /^work\/g678-workflow\/candidates\/shared-alg001-l06-p027-proof-v\d+\.json$/u.test(own[0].proof.path),
  'one current P027 proof');
 const packet=readPageProof(root,own[0].proof,host,tx),
  proof=readJsonPin(root,own[0].proof),entry=proof.registration.entries[0],
  metadata=localOnlyAnimationModuleRegistration(ID),binding=P027_CANDIDATE_BINDING;
 demand(proof.animationId===ID&&proof.registration.entries.length===1&&
  /^g678-alg-l06-p027-current-js-20261001-v\d+$/u.test(proof.registration.calibrationId)&&
  proof.registration.deploymentScope==='local-only'&&
  isDeepStrictEqual(packet.entry,entry)&&entry.key===ID&&
  entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  metadata?.calibrationId===proof.registration.calibrationId&&
  metadata.deploymentScope==='local-only'&&metadata.maturity==='private-current-js'&&
  metadata.freezeManifestSha256===proof.registration.freezeManifestSha256&&
  metadata.moduleSha256===entry.artifacts.module.sha256&&
  metadata.timelineSha256===entry.artifacts.timeline.sha256&&
  metadata.runtimeSha256===entry.artifacts.runtime.sha256,
  'actual registration and exact metadata/artifacts');
 demand(packet.selectedPages.length===1&&packet.selectedPages[0].animationId===ID&&
  packet.selectedPages[0].placementId===ID&&
  packet.selectedPages[0].globalPageOrdinal===27&&
  packet.selectedPages[0].sectionCode==='VB'&&
  packet.selectedPages[0].sectionPageOrdinal===17&&
  packet.selectedPages[0].runtime.frameDomain==='sprite-46'&&
  packet.selectedPages[0].runtime.frameCount===770&&
  packet.selectedPages[0].runtime.rootBeginFrame===6&&
  packet.selectedPages[0].runtime.fps===12&&
  packet.selectedPages[0].runtime.canvasRenderer.sha256===CANVAS_SHA&&
  packet.source.sha256===SOURCE_SHA&&packet.sourceXml.sha256===XML_SHA&&
  packet.sourceRoot===P027_SOURCE_ROOT&&
  packet.optionalSpanishAudio.source.sha256===SA_SHA&&
  packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false&&
  packet.continuousSource.frameDomain==='sprite-46'&&
  packet.continuousSource.visualFrames===770&&
  packet.continuousSource.mainRuns.length===1&&
  isDeepStrictEqual(packet.continuousSource.mainRuns[0].blockFrameRange,[2,770])&&
  packet.continuousSource.mainRuns[0].asset.sha256===binding.browserMain?.sourceSha256&&
  packet.continuousSource.mainRuns[0].browserPcmSha256===binding.browserMain?.pcmSha256&&
  packet.optionalSpanishAudio.browserPcmSha256===binding.browserSpanish?.pcmSha256&&
  Object.values(packet.acceptanceEffects).every(x=>x===false),
  'source page, one physical stream, separate SA and independent gates');
 demand(isDeepStrictEqual(Object.keys(packet.glossaryActions),KEYS)&&
  KEYS.every(key=>packet.glossaryActions[key].sourceKey===key&&
   packet.glossaryActions[key].originalClickObserved===false),
  'six source-exact glossary actions');
 const base=algL6P027SourceProjection();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===38&&
  base.glossary.length===44&&base.pages[26].animationId===ID&&
  base.pages[26].rendererAvailability.kind==='registered'&&
  base.productBridge.selectedAnimationIds[26]===ID,
  'same source projection: 38/60, 44 glossary');
 const calibration=proof.registration.calibrationId;
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
