import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {algL6P028SourceProjection} from './alg-l06-p028-candidate-v1.server';
import {P028_CANDIDATE_BINDING} from './alg-l06-p028-candidate-binding-v1';
import {P028_ID as ID,P028_SOURCE_ROOT,p028LocalDevelopment}
 from './alg-l06-p028-preview-policy-v1';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_SHA='12b9912231512d5622b96708b83331217691169fadf185b3b2d0a27733e3c297';
const MAIN_SHA='4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70';
const SA_SHA='f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf';
const CANVAS_SHA='b4d784c6dd65c0a412c4a41447d4485476a8715b665b175f277a40a40ffbb2e6';
const KEYS=['Relation','Set','Ordered pair'];
const FORMAL_PROOF=/^work\/g678-workflow\/candidates\/shared-alg001-l06-p028-proof-v[1-9]\d*\.json$/u;
const SOURCE_ONLY_PREFLIGHT=/^work\/g678-workflow\/candidates\/shared-alg001-l06-p028-source-only-preflight-v[1-9]\d*\.json$/u;
const demand=(ok:unknown,reason:string)=>{if(!ok)throw Error(`P028_FORMAL_DESCRIPTOR_INVALID: ${reason}`);};

/** A source-only preflight is deliberately a different proof class. */
export function p028FormalProofPath(path:string):boolean{
 return FORMAL_PROOF.test(path)&&!SOURCE_ONLY_PREFLIGHT.test(path);
}

/** Formal reader is dormant until a registered proof and measured audio exist. */
export function algL6P028FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p028LocalDevelopment(),'local development/physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((p:{animationId:string})=>p.animationId===ID);
 demand(own.length===1&&p028FormalProofPath(own[0].proof.path),
  'one current formal P028 proof; source-only preflight excluded');
 const packet=readPageProof(root,own[0].proof,host,tx),
  proof=readJsonPin(root,own[0].proof),entry=proof.registration.entries[0],
  metadata=localOnlyAnimationModuleRegistration(ID),binding=P028_CANDIDATE_BINDING;
 demand(binding.browserMain&&binding.browserSpanish&&binding.browserDecode,
  'independently measured Chrome PCM and browser receipt');
 demand(proof.animationId===ID&&proof.registration.entries.length===1&&
  /^g678-alg-l06-p028-current-js-20261001-v[1-9]\d*$/u.test(proof.registration.calibrationId)&&
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
  packet.selectedPages[0].globalPageOrdinal===28&&
  packet.selectedPages[0].sectionCode==='VB'&&
  packet.selectedPages[0].sectionPageOrdinal===18&&
  packet.selectedPages[0].runtime.frameDomain==='sprite-30'&&
  packet.selectedPages[0].runtime.frameCount===134&&
  packet.selectedPages[0].runtime.rootBeginFrame===6&&
  packet.selectedPages[0].runtime.fps===12&&
  packet.selectedPages[0].runtime.canvasRenderer.sha256===CANVAS_SHA&&
  packet.source.sha256===SOURCE_SHA&&
  packet.sourceRoot===P028_SOURCE_ROOT&&
  packet.optionalSpanishAudio.source.sha256===SA_SHA&&
  packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false&&
  packet.continuousSource.frameDomain==='sprite-30'&&
  packet.continuousSource.visualFrames===134&&
  packet.continuousSource.mainRuns.length===1&&
  isDeepStrictEqual(packet.continuousSource.mainRuns[0].blockFrameRange,[2,134])&&
  packet.continuousSource.mainRuns[0].asset.sha256===MAIN_SHA&&
  packet.continuousSource.mainRuns[0].browserPcmSha256===binding.browserMain?.pcmSha256&&
  packet.optionalSpanishAudio.browserPcmSha256===binding.browserSpanish?.pcmSha256&&
  Object.values(packet.acceptanceEffects).every(x=>x===false),
  'source page, stream, separate SA and independent gates');
 demand(isDeepStrictEqual(Object.keys(packet.glossaryActions),KEYS)&&
  KEYS.every(key=>packet.glossaryActions[key].sourceKey===key&&
   packet.glossaryActions[key].originalClickObserved===false),
  'three source-exact glossary actions');
 const base=algL6P028SourceProjection();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===39&&
  base.glossary.length===44&&base.pages[27].animationId===ID&&
  base.pages[27].rendererAvailability.kind==='registered'&&
  base.productBridge.selectedAnimationIds[27]===ID,
  'same source projection: 39/60 and 44 glossary');
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
