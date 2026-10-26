import 'server-only';
import {validateP056Admission} from '../../../lib/alg-l06-p056-admission-semantics-v1.mjs';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P056CandidateDescriptor} from './alg-l06-p056-candidate-v1.server';
import {P056_ID as ID,p056LocalDevelopment} from './alg-l06-p056-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const CALIBRATION='g678-alg-l06-p056-current-js-20261003-v1';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P056_FORMAL_DESCRIPTOR_INVALID: '+why);};
/** One actual registry member and unchanged source-function-walkthrough My Lesson behavior. */
export function algL6P056FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p056LocalDevelopment(),'exact development source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=42&&index.pages[41].animationId===ID&&own.length===1&&own[0].proof.path===PROOF,'one P056 after 41 preserved proofs');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID),
  page=packet.selectedPages[0],runtime=page.runtime;
 demand(registration.calibrationId===CALIBRATION&&registration.deploymentScope==='local-only'&&
  registration.entries.length===1&&entry.key===ID&&entry.module===`./modules/${ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===CALIBRATION&&meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256&&isDeepStrictEqual(packet.entry,entry),'actual entry and dispatch');
 validateP056Admission(root,packet,registration);
 const candidate=algL6P056CandidateDescriptor();
 demand(candidate.pages.length===60&&candidate.productBridge.registeredAnimationCount===55&&
  candidate.pages[55].animationId===ID&&candidate.pages[55].rendererAvailability.kind==='registered','55 source-ordered runnable pages');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...candidate.course,href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,storageKey:`${candidate.persistence.storageKey}:${CALIBRATION}`})});
}
