import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P032SourceProjection} from './alg-l06-p032-candidate-v1.server';
import {P032_CANDIDATE_BINDING} from './alg-l06-p032-candidate-binding-v1';
import {P032_ID as ID,P032_SOURCE_ROOT,p032LocalDevelopment} from './alg-l06-p032-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const demand=(okay:unknown,why:string)=>{if(!okay)throw Error('P032_FORMAL_DESCRIPTOR_INVALID: '+why);};
/** Dormant until the exact final proof and actual registry transaction exist. */
export function algL6P032FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p032LocalDevelopment(),'local physical source');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&/^work\/g678-workflow\/candidates\/shared-alg001-l06-p032-proof-v[1-9]\d*\.json$/u.test(own[0].proof.path),
  'one formal proof; source-only preflight excluded');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  entry=proof.registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID),binding=P032_CANDIDATE_BINDING;
 demand(proof.registration.entries.length===1&&entry.key===ID&&entry.module===`./modules/${ID}`&&
  entry.maturity==='private-current-js'&&isDeepStrictEqual(packet.entry,entry)&&
  /^g678-alg-l06-p032-current-js-20261001-v[1-9]\d*$/u.test(proof.registration.calibrationId)&&
  proof.registration.deploymentScope==='local-only'&&meta?.calibrationId===proof.registration.calibrationId&&
  meta.freezeManifestSha256===proof.registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256,'exact final registration and canonical artifacts');
 const selected=packet.selectedPages[0],runtime=selected.runtime;
 demand(selected.placementId===ID&&selected.globalPageOrdinal===32&&selected.sectionCode==='IN'&&
  selected.sectionPageOrdinal===3&&runtime.frameDomain==='sprite-22'&&runtime.frameCount===413&&
  runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.canvasRenderer.sha256==='646ef50a5e3dc054bca4a323f6da775b82b22e769f33221fdaa155f51e0e2eaf'&&
  packet.sourceRoot===P032_SOURCE_ROOT&&packet.source.sha256==='e425600d0b6cfab41ae50f7512cb8e6c4e3c6ee04bbfa10c29b437459876d836',
  'source occurrence and 413-frame Canvas');
 demand(packet.optionalSpanishAudio.source.sha256==='9cdf2402eea05caebc190680eff4b15ee3baada80e366ed4e4ac96df7f3dd478'&&
  packet.optionalSpanishAudio.localeAutoplay===false&&packet.optionalSpanishAudio.mainStreamSpliced===false&&
  packet.optionalSpanishAudio.browserPcmSha256===binding.browserSpanish?.pcmSha256&&
  packet.continuousSource.frameDomain==='sprite-22'&&packet.continuousSource.visualFrames===413&&
  packet.continuousSource.mainRuns.length===1&&
  isDeepStrictEqual(packet.continuousSource.mainRuns[0].blockFrameRange,[1,413])&&
  packet.continuousSource.mainRuns[0].asset.sha256==='2584a692ee3936f02c3dc491872225f020744ce92710f890e1a31d468a75c85b'&&
  packet.continuousSource.mainRuns[0].browserPcmSha256===binding.browserMain?.pcmSha256&&
  isDeepStrictEqual(Object.keys(packet.glossaryActions),['Set','Ordered pair','Function','X-coordinate'])&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),'one main stream, explicit independent SA and four source keys');
 const base=algL6P032SourceProjection();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===40&&base.glossary.length===45&&
  base.pages[31].animationId===ID&&base.pages[31].rendererAvailability.kind==='registered',
  'same maintained source projection and all four glossary definitions');
 const calibration=proof.registration.calibrationId;
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${calibration}`,calibrationId:calibration,releaseId:calibration,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/continuous-v1`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${calibration}`})});
}
