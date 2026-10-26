import 'server-only';
import {validateP060Admission} from '../../../lib/alg-l06-p060-admission-semantics-v1.mjs';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P060CandidateDescriptor} from './alg-l06-p060-candidate-v1.server';
import {P060_ID as ID,p060LocalDevelopment} from './alg-l06-p060-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const CALIBRATION='g678-alg-l06-p060-current-js-20261003-v1';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v4.json`;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P060_FORMAL_DESCRIPTOR_INVALID: '+why);};
/** One actual registry member and unchanged source-function-walkthrough My Lesson behavior. */
export function algL6P060FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p060LocalDevelopment(),'exact development source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=45&&index.pages[44].animationId===ID&&own.length===1&&own[0].proof.path===PROOF,'one P060 after 44 preserved proofs');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID),
  page=packet.selectedPages[0],runtime=page.runtime;
 demand(registration.calibrationId===CALIBRATION&&registration.deploymentScope==='local-only'&&
  registration.entries.length===1&&entry.key===ID&&entry.module==='./modules/shared-alg001-l06-v2-p060'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===CALIBRATION&&meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&isDeepStrictEqual(packet.entry,entry),'actual entry and dispatch');
 validateP060Admission(root,packet,registration);
 const candidate=algL6P060CandidateDescriptor();
 demand(candidate.pages.length===60&&candidate.productBridge.registeredAnimationCount===58&&
  candidate.pages[59].animationId===ID&&candidate.pages[59].rendererAvailability.kind==='registered','58 source-ordered runnable pages');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...candidate.course,href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,storageKey:`${candidate.persistence.storageKey}:${CALIBRATION}`})});
}
